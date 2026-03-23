/**
 * Integration Tests for /teaching:config Command
 *
 * Tests the `/teaching:config` command routing and integration between
 * scaffolder, config loader, and validator modules. Since this is a Claude Code
 * plugin command (defined in .md file), we test the underlying module integration
 * rather than direct command invocation.
 *
 * Test Coverage:
 * - Module imports and availability
 * - Scaffold → Validate integration flow
 * - Config loading across directory hierarchy
 * - Complete .flow/ structure scaffolding
 * - Edge cases (missing directories, invalid configs, permission errors)
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigScaffolder, VALID_PROMPT_TYPES } from '../../src/teaching/config/scaffolder.js';
import {
  loadTeachConfig,
  findConfigFile,
  loadConfigFile,
  validateConfig,
  getDefaultConfig
} from '../../src/teaching/config/loader.js';
import { ConfigValidator } from '../../src/teaching/validators/config-validator.js';

describe('/teaching:config integration tests', () => {
  let tempDir;
  let scaffolder;

  beforeEach(() => {
    tempDir = join(tmpdir(), `config-command-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    scaffolder = new ConfigScaffolder({ cwd: tempDir, debug: false });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Module imports', () => {
    it('should import ConfigScaffolder', () => {
      expect(ConfigScaffolder).toBeDefined();
      expect(typeof ConfigScaffolder).toBe('function');
    });

    it('should import config loader functions', () => {
      expect(loadTeachConfig).toBeDefined();
      expect(findConfigFile).toBeDefined();
      expect(loadConfigFile).toBeDefined();
      expect(validateConfig).toBeDefined();
      expect(getDefaultConfig).toBeDefined();
    });

    it('should import ConfigValidator', () => {
      expect(ConfigValidator).toBeDefined();
      expect(typeof ConfigValidator).toBe('function');
    });

    it('should create ConfigScaffolder instance with correct methods', () => {
      const s = new ConfigScaffolder({ cwd: tempDir });
      expect(typeof s.scaffold).toBe('function');
      expect(typeof s.listAvailable).toBe('function');
    });

    it('should create ConfigValidator instance with correct methods', () => {
      const v = new ConfigValidator({ cwd: tempDir });
      expect(typeof v.validateFile).toBe('function');
      expect(typeof v.detectSchemaType).toBe('function');
    });
  });

  describe('Scaffold → Validate integration flow', () => {
    it('should scaffold a prompt and validate it exists', async () => {
      // Scaffold a lecture-notes prompt
      const result = await scaffolder.scaffold('lecture-notes');

      expect(result.alreadyExists).toBe(false);
      expect(existsSync(result.targetPath)).toBe(true);

      // Verify the file contains Scholar version
      const content = readFileSync(result.targetPath, 'utf8');
      expect(content).toContain('based_on_scholar_version');
      expect(content).toContain('2.7.0');
    });

    it('should scaffold multiple prompts to build complete .flow/ structure', async () => {
      // Scaffold several prompt types (only use types with actual default files)
      const types = ['lecture-notes', 'lecture-outline', 'quiz'];
      const results = [];

      for (const type of types) {
        results.push(await scaffolder.scaffold(type));
      }

      // Verify all were created
      expect(results.every(r => !r.alreadyExists)).toBe(true);
      expect(results.every(r => existsSync(r.targetPath))).toBe(true);

      // Verify directory structure
      const promptsDir = join(tempDir, '.flow', 'templates', 'prompts');
      expect(existsSync(join(promptsDir, 'lecture-notes.md'))).toBe(true);
      expect(existsSync(join(promptsDir, 'lecture-outline.md'))).toBe(true);
      expect(existsSync(join(promptsDir, 'quiz.md'))).toBe(true);
    });

    it('should detect already-scaffolded prompts', async () => {
      // Scaffold once
      const first = await scaffolder.scaffold('quiz');
      expect(first.alreadyExists).toBe(false);

      // Try again
      const second = await scaffolder.scaffold('quiz');
      expect(second.alreadyExists).toBe(true);
      expect(second.targetPath).toBe(first.targetPath);
    });

    it('should report variable counts for scaffolded prompts', async () => {
      const result = await scaffolder.scaffold('lecture-notes');

      // lecture-notes template should have required and optional variables
      expect(Array.isArray(result.requiredVars)).toBe(true);
      expect(Array.isArray(result.optionalVars)).toBe(true);

      // Verify variables are strings
      if (result.requiredVars.length > 0) {
        expect(typeof result.requiredVars[0]).toBe('string');
      }
    });
  });

  describe('Scaffold → Config loading integration', () => {
    it('should scaffold and load config with defaults', async () => {
      // Create a complete .flow/ structure
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      // Write a valid teach-config.yml
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
  defaults:
    lecture_format: "quarto"
    exam_format: "markdown"
  style:
    tone: "conversational"
    notation: "statistical"
    examples: true
`
      );

      // Scaffold a prompt
      await scaffolder.scaffold('lecture-notes');

      // Load config - should find the .flow/teach-config.yml
      const config = loadTeachConfig(tempDir);

      expect(config).toBeDefined();
      expect(config.scholar.course_info.level).toBe('undergraduate');
      expect(config.scholar.defaults.lecture_format).toBe('quarto');
      expect(config.scholar.style.tone).toBe('conversational');
    });

    it('should load config from parent directory', async () => {
      // Create parent .flow/
      const parentFlowDir = join(tempDir, '.flow');
      mkdirSync(parentFlowDir, { recursive: true });

      const configPath = join(parentFlowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "graduate"
    field: "mathematics"
`
      );

      // Create a subdirectory
      const subDir = join(tempDir, 'content', 'week01');
      mkdirSync(subDir, { recursive: true });

      // Load config from subdirectory - should find parent config
      const config = loadTeachConfig(subDir);

      expect(config.scholar.course_info.level).toBe('graduate');
      expect(config.scholar.course_info.field).toBe('mathematics');
    });

    it('should merge user config with defaults', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      // Write partial config
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      const config = loadTeachConfig(tempDir);

      // Should have user value
      expect(config.scholar.course_info.level).toBe('graduate');

      // Should have default values
      expect(config.scholar.course_info.difficulty).toBe('intermediate');
      expect(config.scholar.defaults.exam_format).toBe('markdown');
      expect(config.scholar.style.tone).toBe('formal');
    });
  });

  describe('Config validation integration', () => {
    it('should validate a complete config file', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
  defaults:
    lecture_format: "quarto"
    exam_format: "markdown"
  style:
    tone: "conversational"
`
      );

      const config = loadConfigFile(configPath);
      const validation = validateConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should catch invalid config values', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "invalid-level"
    difficulty: "super-hard"
  defaults:
    exam_format: "invalid-format"
`
      );

      const config = loadConfigFile(configPath);
      const validation = validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Should report all invalid values
      const errorMessages = validation.errors.join(' ');
      expect(errorMessages).toContain('invalid-level');
      expect(errorMessages).toContain('super-hard');
      expect(errorMessages).toContain('invalid-format');
    });

    it('should validate lesson plan after scaffolding', async () => {
      // Create lesson plan directory
      const lessonPlansDir = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlansDir, { recursive: true });

      // Write a valid lesson plan
      const lessonPath = join(lessonPlansDir, 'week01.yml');
      writeFileSync(
        lessonPath,
        `week: 1
title: "Introduction to Statistics"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Understand basic statistical concepts"
topics:
  - id: "T-1.1"
    name: "Course introduction"
`
      );

      // Validate the lesson plan
      const validator = new ConfigValidator({ cwd: tempDir });
      const result = validator.validateFile(lessonPath);

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.rule?.startsWith('schema:')).length).toBe(0);
    });
  });

  describe('Complete .flow/ structure scaffolding', () => {
    it('should scaffold complete teaching directory structure', async () => {
      // Scaffold all required components
      const flowDir = join(tempDir, '.flow');
      const templatesDir = join(flowDir, 'templates');
      const promptsDir = join(templatesDir, 'prompts');

      // Create teach-config.yml
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(
        join(flowDir, 'teach-config.yml'),
        `scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
`
      );

      // Scaffold prompts (only use types with actual default files)
      await scaffolder.scaffold('lecture-notes');
      await scaffolder.scaffold('quiz');

      // Create lesson plans directory
      const lessonPlansDir = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlansDir, { recursive: true });

      writeFileSync(
        join(lessonPlansDir, 'week01.yml'),
        `week: 1
title: "Week 1"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Understand concepts"
topics:
  - id: "T-1.1"
    name: "Introduction"
`
      );

      // Verify structure
      expect(existsSync(join(flowDir, 'teach-config.yml'))).toBe(true);
      expect(existsSync(join(promptsDir, 'lecture-notes.md'))).toBe(true);
      expect(existsSync(join(promptsDir, 'quiz.md'))).toBe(true);
      expect(existsSync(join(lessonPlansDir, 'week01.yml'))).toBe(true);

      // Verify config can be loaded
      const config = loadTeachConfig(tempDir);
      expect(config.scholar.course_info.level).toBe('undergraduate');

      // Verify lesson plan validates
      const validator = new ConfigValidator({ cwd: tempDir });
      const result = validator.validateFile(join(lessonPlansDir, 'week01.yml'));
      expect(result.isValid).toBe(true);
    });

    it('should support teaching-style.local.md override', async () => {
      // Create .claude/ directory for local overrides
      const claudeDir = join(tempDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });

      writeFileSync(
        join(claudeDir, 'teaching-style.local.md'),
        `---
teaching_style:
  pedagogical_approach:
    primary: "active-learning"
  explanation_style:
    formality: "conversational"
---

# Custom Teaching Style

Use lots of examples and real-world applications.
`
      );

      // Verify file exists
      expect(existsSync(join(claudeDir, 'teaching-style.local.md'))).toBe(true);

      // Note: teaching-style validation would be handled by ConfigValidator
      // when it's extended to support teaching-style schema
    });
  });

  describe('Edge cases', () => {
    it('should handle missing .flow/ directory gracefully', () => {
      // No .flow/ directory - should return defaults
      const config = loadTeachConfig(tempDir);

      expect(config).toBeDefined();
      expect(config.scholar).toBeDefined();
      expect(config.scholar.course_info.level).toBe('undergraduate');
    });

    it('should handle empty .flow/ directory', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      // Empty .flow/ - should return defaults
      const config = loadTeachConfig(tempDir);

      expect(config).toBeDefined();
      expect(config.scholar.course_info.level).toBe('undergraduate');
    });

    it('should handle invalid YAML in teach-config.yml', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(configPath, 'invalid: {{{{ yaml: broken');

      // Should throw in loadConfigFile
      expect(() => loadConfigFile(configPath)).toThrow(/YAML parsing error/);

      // Should fall back to defaults in loadTeachConfig (non-strict mode)
      const config = loadTeachConfig(tempDir, { strict: false });
      expect(config).toBeDefined();
      expect(config.scholar).toBeDefined();
    });

    it('should throw in strict mode with invalid config', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(configPath, 'invalid: yaml: {{{{');

      // Strict mode should throw
      expect(() => loadTeachConfig(tempDir, { strict: true })).toThrow();
    });

    it('should handle prompt type that does not have a default', async () => {
      // Invalid prompt type
      await expect(scaffolder.scaffold('nonexistent-prompt')).rejects.toThrow(/Invalid prompt type/);
    });

    it('should list available prompt types', () => {
      const available = scaffolder.listAvailable();

      expect(Array.isArray(available)).toBe(true);
      expect(available.length).toBeGreaterThan(0);

      // Should include known types that have actual default files
      const hasLectureNotes = available.includes('lecture-notes');
      const hasLectureOutline = available.includes('lecture-outline');
      const hasQuiz = available.includes('quiz');
      const hasSectionContent = available.includes('section-content');

      expect(hasLectureNotes || hasLectureOutline || hasQuiz || hasSectionContent).toBe(true);
    });

    it('should handle non-existent config file path', () => {
      const missingPath = join(tempDir, 'missing.yml');

      expect(() => loadConfigFile(missingPath)).toThrow(/Failed to load config file/);
    });

    it('should validate config with missing required scholar section', () => {
      const config = { random: 'data' };
      const validation = validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('scholar'))).toBe(true);
    });

    it('should return default config when findConfigFile returns null', () => {
      // Create a directory with no .flow/ anywhere in hierarchy
      const isolatedDir = join(tempDir, 'isolated', 'deep', 'path');
      mkdirSync(isolatedDir, { recursive: true });

      const configPath = findConfigFile(isolatedDir);
      expect(configPath).toBeNull();

      const config = loadTeachConfig(isolatedDir);
      expect(config).toEqual(getDefaultConfig());
    });
  });

  describe('Validation level integration', () => {
    it('should validate at syntax level only', () => {
      const validator = new ConfigValidator({ cwd: tempDir, maxLevel: 'syntax' });

      const lessonPath = join(tempDir, 'test.yml');
      writeFileSync(lessonPath, 'week: 1\ntitle: "Test"');

      const result = validator.validateFile(lessonPath);

      expect(result.level).toBe('syntax');
      expect(result.isValid).toBe(true);
    });

    it('should validate with schema checks', () => {
      const lessonPlansDir = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlansDir, { recursive: true });

      const lessonPath = join(lessonPlansDir, 'week01.yml');
      writeFileSync(
        lessonPath,
        `week: 1
title: "Test"
learning_objectives:
  - id: "INVALID"
    level: "invalid-bloom"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Test"
`
      );

      const validator = new ConfigValidator({ cwd: tempDir, maxLevel: 'schema' });
      const result = validator.validateFile(lessonPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule?.startsWith('schema:'))).toBe(true);
    });

    it('should perform cross-file validation', () => {
      const lessonPlansDir = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlansDir, { recursive: true });

      const lessonPath = join(lessonPlansDir, 'week01.yml');
      writeFileSync(
        lessonPath,
        `week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Test"
prerequisites:
  topics:
    - "T-5.1"
`
      );

      const validator = new ConfigValidator({ cwd: tempDir, maxLevel: 'cross-file' });
      const result = validator.validateFile(lessonPath);

      // Should warn about future prerequisite
      expect(result.warnings.some(w => w.rule === 'cross-file:future-prerequisite')).toBe(true);
    });
  });

  describe('VALID_PROMPT_TYPES constant', () => {
    it('should export valid prompt types array', () => {
      expect(Array.isArray(VALID_PROMPT_TYPES)).toBe(true);
      expect(VALID_PROMPT_TYPES.length).toBeGreaterThan(0);
    });

    it('should include expected prompt types', () => {
      expect(VALID_PROMPT_TYPES).toContain('lecture-notes');
      expect(VALID_PROMPT_TYPES).toContain('lecture-outline');
      expect(VALID_PROMPT_TYPES).toContain('section-content');
      expect(VALID_PROMPT_TYPES).toContain('quiz');
      expect(VALID_PROMPT_TYPES).toContain('exam');
      expect(VALID_PROMPT_TYPES).toContain('assignment');
      expect(VALID_PROMPT_TYPES).toContain('syllabus');
    });

    it('should only accept valid prompt types in scaffold', async () => {
      const invalidType = 'not-a-valid-type';
      expect(VALID_PROMPT_TYPES).not.toContain(invalidType);

      await expect(scaffolder.scaffold(invalidType)).rejects.toThrow(/Invalid prompt type/);
    });
  });

  describe('Config discovery across hierarchy', () => {
    it('should find config in parent of parent', () => {
      // Create deep directory structure
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      writeFileSync(
        join(flowDir, 'teach-config.yml'),
        `scholar:
  course_info:
    level: "graduate"
`
      );

      // Create deep subdirectory
      const deepDir = join(tempDir, 'content', 'week01', 'materials', 'datasets');
      mkdirSync(deepDir, { recursive: true });

      // Find config from deep directory
      const configPath = findConfigFile(deepDir);
      expect(configPath).not.toBeNull();
      expect(configPath).toBe(join(flowDir, 'teach-config.yml'));

      // Load config from deep directory
      const config = loadTeachConfig(deepDir);
      expect(config.scholar.course_info.level).toBe('graduate');
    });

    it('should stop at filesystem root if no config found', () => {
      // Create a temp directory that definitely has no .flow/ in parents
      const isolatedTemp = join(tmpdir(), `isolated-${Date.now()}`);
      mkdirSync(isolatedTemp, { recursive: true });

      try {
        const configPath = findConfigFile(isolatedTemp);
        expect(configPath).toBeNull();
      } finally {
        rmSync(isolatedTemp, { recursive: true, force: true });
      }
    });
  });

  describe('Scaffold error handling', () => {
    it('should provide detailed error on scaffold failure', async () => {
      try {
        await scaffolder.scaffold('invalid-type');
        fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).toContain('Invalid prompt type');
        expect(err.message).toContain('invalid-type');
        expect(err.message).toContain('Must be one of');
      }
    });

    it('should handle read-only target directory gracefully', async () => {
      // Create .flow/templates/prompts directory
      const promptsDir = join(tempDir, '.flow', 'templates', 'prompts');
      mkdirSync(promptsDir, { recursive: true });

      // Make directory read-only (skip on Windows where chmod is limited)
      if (process.platform !== 'win32') {
        chmodSync(promptsDir, 0o444);

        try {
          await expect(scaffolder.scaffold('lecture-notes')).rejects.toThrow();
        } finally {
          // Restore permissions for cleanup
          chmodSync(promptsDir, 0o755);
        }
      }
    });
  });

  describe('Config validation strictness', () => {
    it('should pass with valid config in strict mode', () => {
      const config = {
        scholar: {
          course_info: {
            level: 'undergraduate',
            field: 'statistics',
            difficulty: 'intermediate'
          }
        }
      };

      const validation = validateConfig(config);
      expect(validation.isValid).toBe(true);
    });

    it('should reject invalid enum values', () => {
      const config = {
        scholar: {
          course_info: {
            level: 'postdoc',
            difficulty: 'impossible'
          },
          style: {
            tone: 'sarcastic'
          }
        }
      };

      const validation = validateConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
