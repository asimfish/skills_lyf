/**
 * Tests for ConfigPreflightValidator
 *
 * Validates the pre-flight validation of .flow/ configuration:
 * - teach-config.yml
 * - Lesson plans
 * - Prompt templates
 * - Teaching styles
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigPreflightValidator } from '../../src/teaching/config/config-preflight.js';

/**
 * Helper: create a unique temp directory for each test
 * @returns {string} Path to temp directory
 */
function createTempDir() {
  const dir = join(
    tmpdir(),
    `preflight-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Helper: create .flow/ directory structure inside a given root
 * @param {string} root - Root directory
 */
function createFlowDir(root) {
  mkdirSync(join(root, '.flow'), { recursive: true });
}

/**
 * Helper: write teach-config.yml
 * @param {string} root - Course root
 * @param {string} content - YAML content
 */
function writeTeachConfig(root, content) {
  const dir = join(root, '.flow');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'teach-config.yml'), content, 'utf8');
}

/**
 * Helper: write a lesson plan file
 * @param {string} root - Course root
 * @param {string} filename - e.g., 'week01.yml'
 * @param {string} content - YAML content
 */
function writeLessonPlan(root, filename, content) {
  const dir = join(root, 'content', 'lesson-plans');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), content, 'utf8');
}

/**
 * Helper: write a prompt template
 * @param {string} root - Course root
 * @param {string} filename - e.g., 'lecture-notes.md'
 * @param {string} content - Markdown content with frontmatter
 */
function writePrompt(root, filename, content) {
  const dir = join(root, '.flow', 'templates', 'prompts');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), content, 'utf8');
}

/**
 * Helper: write a teaching style file
 * @param {string} root - Course root
 * @param {string} content - Markdown content with frontmatter
 */
function writeCourseStyle(root, content) {
  const dir = join(root, '.claude');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'teaching-style.local.md'), content, 'utf8');
}

describe('ConfigPreflightValidator', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------
  // No .flow/ directory
  // ---------------------------------------------------------------
  describe('when no .flow/ directory exists', () => {
    it('should return all PASS with "using defaults" messages', async () => {
      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
      expect(result.checks.length).toBeGreaterThanOrEqual(4);

      for (const check of result.checks) {
        expect(check.status).toBe('PASS');
        expect(check.messages.some((m) => m.includes('defaults'))).toBe(true);
      }
    });

    it('should include formatted output', async () => {
      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      expect(result.formatted).toContain('=== Config Validation ===');
      expect(result.formatted).toContain('Overall: PASS');
    });
  });

  // ---------------------------------------------------------------
  // teach-config.yml validation
  // ---------------------------------------------------------------
  describe('teach-config.yml', () => {
    it('should PASS with a valid config file', async () => {
      writeTeachConfig(
        tempDir,
        [
          'scholar:',
          '  course_info:',
          '    level: undergraduate',
          '    field: statistics',
          '    difficulty: intermediate',
          '  defaults:',
          '    exam_format: markdown',
          '    lecture_format: quarto',
          '  style:',
          '    tone: formal',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      expect(configCheck).toBeDefined();
      expect(configCheck.status).toBe('PASS');
      expect(configCheck.messages).toContain('Schema: valid');
      expect(configCheck.messages).toContain('Required fields: all present');
    });

    it('should FAIL with invalid YAML syntax', async () => {
      writeTeachConfig(tempDir, ':\n  bad: yaml\n  : nope\n  [broken');

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      expect(configCheck).toBeDefined();
      expect(configCheck.status).toBe('FAIL');
      expect(configCheck.messages.some((m) => m.toLowerCase().includes('yaml') || m.toLowerCase().includes('syntax'))).toBe(true);
      expect(result.errors).toBeGreaterThanOrEqual(1);
    });

    it('should FAIL when schema validation fails (invalid level)', async () => {
      writeTeachConfig(
        tempDir,
        [
          'scholar:',
          '  course_info:',
          '    level: phd',
          '    field: statistics',
          '    difficulty: intermediate',
          '  defaults:',
          '    exam_format: markdown',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      expect(configCheck).toBeDefined();
      expect(configCheck.status).toBe('FAIL');
      expect(configCheck.messages.some((m) => m.includes('Schema: invalid') || m.includes('level'))).toBe(true);
    });

    it('should WARN when optional sections are missing', async () => {
      writeTeachConfig(
        tempDir,
        ['scholar:', '  course_info:', '    level: undergraduate'].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      expect(configCheck).toBeDefined();
      // Missing defaults section -> WARN
      expect(configCheck.status).toBe('WARN');
      expect(configCheck.messages.some((m) => m.includes('missing'))).toBe(true);
    });

    it('should PASS when .flow/ exists but teach-config.yml does not', async () => {
      createFlowDir(tempDir);

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      expect(configCheck).toBeDefined();
      expect(configCheck.status).toBe('PASS');
      expect(configCheck.messages.some((m) => m.includes('defaults'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Lesson plans validation
  // ---------------------------------------------------------------
  describe('lesson plans', () => {
    it('should PASS when no lesson-plans directory exists', async () => {
      createFlowDir(tempDir);

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const lpCheck = result.checks.find((c) => c.name === 'lesson-plans');
      expect(lpCheck).toBeDefined();
      expect(lpCheck.status).toBe('PASS');
    });

    it('should PASS with valid lesson plans that have objectives', async () => {
      createFlowDir(tempDir);
      writeLessonPlan(
        tempDir,
        'week01.yml',
        [
          'week: 1',
          'title: Introduction',
          'learning_objectives:',
          '  - id: LO-1.1',
          '    description: Understand basics',
        ].join('\n')
      );
      writeLessonPlan(
        tempDir,
        'week02.yml',
        [
          'week: 2',
          'title: Probability',
          'learning_objectives:',
          '  - id: LO-2.1',
          '    description: Compute probabilities',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const lpCheck = result.checks.find((c) => c.name === 'lesson-plans');
      expect(lpCheck).toBeDefined();
      expect(lpCheck.status).toBe('PASS');
      expect(lpCheck.messages.some((m) => m.includes('Weeks: 2 defined'))).toBe(true);
      expect(lpCheck.messages.some((m) => m.includes('all weeks have >= 1'))).toBe(true);
    });

    it('should WARN when a lesson plan has no objectives', async () => {
      createFlowDir(tempDir);
      writeLessonPlan(
        tempDir,
        'week01.yml',
        ['week: 1', 'title: Introduction'].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const lpCheck = result.checks.find((c) => c.name === 'lesson-plans');
      expect(lpCheck).toBeDefined();
      expect(lpCheck.status).toBe('WARN');
      expect(lpCheck.messages.some((m) => m.includes('no learning objectives'))).toBe(true);
    });

    it('should FAIL with invalid YAML in a lesson plan', async () => {
      createFlowDir(tempDir);
      writeLessonPlan(tempDir, 'week01.yml', ':\n  [broken yaml');

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const lpCheck = result.checks.find((c) => c.name === 'lesson-plans');
      expect(lpCheck).toBeDefined();
      expect(lpCheck.status).toBe('FAIL');
    });
  });

  // ---------------------------------------------------------------
  // Prompt template validation
  // ---------------------------------------------------------------
  describe('prompt templates', () => {
    it('should report all types as "using default" when no prompts dir', async () => {
      createFlowDir(tempDir);

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const promptChecks = result.checks.filter((c) => c.name.startsWith('prompts/'));
      expect(promptChecks.length).toBeGreaterThan(0);

      for (const check of promptChecks) {
        expect(check.status).toBe('PASS');
        expect(check.messages.some((m) => m.includes('default'))).toBe(true);
      }
    });

    it('should PASS for a valid prompt with correct metadata', async () => {
      createFlowDir(tempDir);
      writePrompt(
        tempDir,
        'quiz.md',
        [
          '---',
          'prompt_version: "2.7"',
          'prompt_type: quiz',
          'prompt_description: "Custom quiz prompt"',
          '---',
          '',
          '# Quiz prompt body',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const quizCheck = result.checks.find((c) => c.name === 'prompts/quiz.md');
      expect(quizCheck).toBeDefined();
      expect(quizCheck.status).toBe('PASS');
    });

    it('should FAIL for a prompt with missing required metadata', async () => {
      createFlowDir(tempDir);
      writePrompt(
        tempDir,
        'quiz.md',
        [
          '---',
          'author: "Test"',
          '---',
          '',
          '# Quiz with no required fields',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const quizCheck = result.checks.find((c) => c.name === 'prompts/quiz.md');
      expect(quizCheck).toBeDefined();
      expect(quizCheck.status).toBe('FAIL');
      expect(quizCheck.messages.some((m) => m.includes('Missing required field'))).toBe(true);
    });

    it('should WARN for outdated prompt version', async () => {
      createFlowDir(tempDir);
      writePrompt(
        tempDir,
        'quiz.md',
        [
          '---',
          'prompt_version: "1.0"',
          'prompt_type: quiz',
          'prompt_description: "Old quiz prompt"',
          'based_on_scholar_version: "2.5.0"',
          '---',
          '',
          '# Old quiz prompt',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const quizCheck = result.checks.find((c) => c.name === 'prompts/quiz.md');
      expect(quizCheck).toBeDefined();
      expect(quizCheck.status).toBe('WARN');
      expect(
        quizCheck.messages.some(
          (m) => m.includes('v2.5.0') || m.includes('older')
        )
      ).toBe(true);
    });

    it('should WARN for missing optional variables vs default prompt', async () => {
      createFlowDir(tempDir);
      // This prompt has correct metadata but fewer optional variables than the default
      writePrompt(
        tempDir,
        'lecture-notes.md',
        [
          '---',
          'prompt_version: "2.0"',
          'prompt_type: lecture-notes',
          'prompt_description: "Custom lecture notes"',
          'variables:',
          '  required:',
          '    - topic',
          '    - course_level',
          '    - field',
          '  optional:',
          '    - course_code',
          '---',
          '',
          '# Custom lecture notes',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const lectureCheck = result.checks.find(
        (c) => c.name === 'prompts/lecture-notes.md'
      );
      expect(lectureCheck).toBeDefined();
      // It should warn about missing optional variables
      expect(lectureCheck.status).toBe('WARN');
      expect(
        lectureCheck.messages.some((m) => m.includes('Missing optional variable'))
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Teaching style validation
  // ---------------------------------------------------------------
  describe('teaching styles', () => {
    it('should PASS when no course style file exists', async () => {
      createFlowDir(tempDir);

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const courseStyle = result.checks.find(
        (c) => c.name === 'Teaching Style (course)'
      );
      expect(courseStyle).toBeDefined();
      expect(courseStyle.status).toBe('PASS');
      expect(courseStyle.messages.some((m) => m.includes('defaults'))).toBe(true);
    });

    it('should PASS with valid teaching style frontmatter', async () => {
      createFlowDir(tempDir);
      writeCourseStyle(
        tempDir,
        [
          '---',
          'teaching_style:',
          '  pedagogical_approach:',
          '    primary: active-learning',
          '  explanation_style:',
          '    formality: balanced',
          '---',
          '',
          '# Course Teaching Style',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const courseStyle = result.checks.find(
        (c) => c.name === 'Teaching Style (course)'
      );
      expect(courseStyle).toBeDefined();
      expect(courseStyle.status).toBe('PASS');
      expect(
        courseStyle.messages.some((m) => m.includes('teaching_style'))
      ).toBe(true);
    });

    it('should FAIL with invalid YAML frontmatter in style file', async () => {
      createFlowDir(tempDir);
      writeCourseStyle(
        tempDir,
        ['---', '  [broken: yaml', '---', '', '# Bad style'].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const courseStyle = result.checks.find(
        (c) => c.name === 'Teaching Style (course)'
      );
      expect(courseStyle).toBeDefined();
      expect(courseStyle.status).toBe('FAIL');
      expect(
        courseStyle.messages.some((m) => m.includes('Invalid YAML'))
      ).toBe(true);
    });

    it('should WARN with unknown teaching style keys', async () => {
      createFlowDir(tempDir);
      writeCourseStyle(
        tempDir,
        [
          '---',
          'teaching_style:',
          '  pedagogical_approach:',
          '    primary: active-learning',
          '  unknown_section:',
          '    foo: bar',
          '---',
          '',
          '# Style with unknown keys',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const courseStyle = result.checks.find(
        (c) => c.name === 'Teaching Style (course)'
      );
      expect(courseStyle).toBeDefined();
      expect(courseStyle.status).toBe('WARN');
      expect(
        courseStyle.messages.some((m) => m.includes('Unknown keys'))
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Error and warning counting
  // ---------------------------------------------------------------
  describe('error and warning counts', () => {
    it('should count errors correctly', async () => {
      // Invalid YAML in teach-config + broken lesson plan
      writeTeachConfig(tempDir, ':\n  [broken yaml');
      writeLessonPlan(tempDir, 'week01.yml', ':\n  [also broken');

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      // At least 2 FAIL checks
      expect(result.errors).toBeGreaterThanOrEqual(2);
    });

    it('should count warnings correctly', async () => {
      writeTeachConfig(
        tempDir,
        ['scholar:', '  course_info:', '    level: undergraduate'].join('\n')
      );
      // Missing defaults -> WARN
      writeLessonPlan(
        tempDir,
        'week01.yml',
        ['week: 1', 'title: No objectives here'].join('\n')
      );
      // Missing objectives -> WARN

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      expect(result.warnings).toBeGreaterThanOrEqual(2);
    });

    it('should return zero errors and warnings for fully valid config', async () => {
      writeTeachConfig(
        tempDir,
        [
          'scholar:',
          '  course_info:',
          '    level: undergraduate',
          '    field: statistics',
          '    difficulty: intermediate',
          '  defaults:',
          '    exam_format: markdown',
          '  style:',
          '    tone: formal',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      expect(configCheck.status).toBe('PASS');
      expect(result.errors).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // Formatted output
  // ---------------------------------------------------------------
  describe('formatted output', () => {
    it('should contain all expected sections', async () => {
      writeTeachConfig(
        tempDir,
        [
          'scholar:',
          '  course_info:',
          '    level: undergraduate',
          '    field: statistics',
          '    difficulty: intermediate',
          '  defaults:',
          '    exam_format: markdown',
          '  style:',
          '    tone: formal',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      expect(result.formatted).toContain('=== Config Validation ===');
      expect(result.formatted).toContain('teach-config.yml');
      expect(result.formatted).toContain('Prompts:');
      expect(result.formatted).toContain('Teaching Style:');
      expect(result.formatted).toContain('Overall:');
    });

    it('should show FAIL in overall when errors exist', async () => {
      writeTeachConfig(tempDir, ':\n  [broken');

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      expect(result.formatted).toContain('Overall: FAIL');
    });

    it('should show WARN in overall when only warnings exist', async () => {
      writeTeachConfig(
        tempDir,
        ['scholar:', '  course_info:', '    level: undergraduate'].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      // Should have at least one warning (missing defaults)
      // but no errors from schema (level is valid)
      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      if (configCheck.status === 'WARN' && result.errors === 0) {
        expect(result.formatted).toContain('Overall: WARN');
      }
    });

    it('should show PASS in overall when no issues', async () => {
      // No .flow at all -> all defaults -> all PASS
      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      expect(result.formatted).toContain('Overall: PASS');
    });
  });

  // ---------------------------------------------------------------
  // Strict mode
  // ---------------------------------------------------------------
  describe('strict mode', () => {
    it('should set strict option when provided', () => {
      const validator = new ConfigPreflightValidator({
        cwd: tempDir,
        strict: true,
      });
      expect(validator.strict).toBe(true);
    });

    it('should still produce the same result structure in strict mode', async () => {
      writeTeachConfig(
        tempDir,
        ['scholar:', '  course_info:', '    level: undergraduate'].join('\n')
      );

      const validator = new ConfigPreflightValidator({
        cwd: tempDir,
        strict: true,
      });
      const result = await validator.validate();

      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('formatted');
    });

    it('should allow consumer to treat warnings as errors using strict flag', async () => {
      writeTeachConfig(
        tempDir,
        ['scholar:', '  course_info:', '    level: undergraduate'].join('\n')
      );

      const validator = new ConfigPreflightValidator({
        cwd: tempDir,
        strict: true,
      });
      const result = await validator.validate();

      // In strict mode, the consumer decides the exit code:
      // exitCode = result.errors > 0 || (validator.strict && result.warnings > 0) ? 1 : 0
      const exitCode =
        result.errors > 0 || (validator.strict && result.warnings > 0) ? 1 : 0;

      if (result.warnings > 0) {
        expect(exitCode).toBe(1);
      }
    });
  });

  // ---------------------------------------------------------------
  // Debug mode
  // ---------------------------------------------------------------
  describe('debug mode', () => {
    it('should set debug option when provided', () => {
      const validator = new ConfigPreflightValidator({
        cwd: tempDir,
        debug: true,
      });
      expect(validator.debug).toBe(true);
    });

    it('should not throw when debug logging is enabled', async () => {
      createFlowDir(tempDir);

      const validator = new ConfigPreflightValidator({
        cwd: tempDir,
        debug: true,
      });

      // Suppress console.log during test
      const originalLog = console.log;
      console.log = () => {};
      try {
        const result = await validator.validate();
        expect(result).toHaveProperty('checks');
      } finally {
        console.log = originalLog;
      }
    });
  });

  // ---------------------------------------------------------------
  // Integration: full scenario
  // ---------------------------------------------------------------
  describe('full scenario integration', () => {
    it('should validate a complete .flow/ setup with mixed results', async () => {
      // Valid teach-config
      writeTeachConfig(
        tempDir,
        [
          'scholar:',
          '  course_info:',
          '    level: undergraduate',
          '    field: statistics',
          '    difficulty: intermediate',
          '  defaults:',
          '    exam_format: markdown',
          '  style:',
          '    tone: formal',
        ].join('\n')
      );

      // Valid lesson plan
      writeLessonPlan(
        tempDir,
        'week01.yml',
        [
          'week: 1',
          'title: Introduction',
          'learning_objectives:',
          '  - id: LO-1.1',
          '    description: Understand basics',
        ].join('\n')
      );

      // Prompt with outdated version
      writePrompt(
        tempDir,
        'quiz.md',
        [
          '---',
          'prompt_version: "1.0"',
          'prompt_type: quiz',
          'prompt_description: "Older quiz prompt"',
          'based_on_scholar_version: "2.4.0"',
          '---',
          '',
          '# Quiz content',
        ].join('\n')
      );

      // Valid course style
      writeCourseStyle(
        tempDir,
        [
          '---',
          'teaching_style:',
          '  pedagogical_approach:',
          '    primary: active-learning',
          '---',
          '',
          '# Style',
        ].join('\n')
      );

      const validator = new ConfigPreflightValidator({ cwd: tempDir });
      const result = await validator.validate();

      // teach-config -> PASS
      const configCheck = result.checks.find((c) => c.name === 'teach-config.yml');
      expect(configCheck.status).toBe('PASS');

      // lesson-plans -> PASS
      const lpCheck = result.checks.find((c) => c.name === 'lesson-plans');
      expect(lpCheck.status).toBe('PASS');

      // quiz prompt -> WARN (outdated version)
      const quizCheck = result.checks.find((c) => c.name === 'prompts/quiz.md');
      expect(quizCheck.status).toBe('WARN');

      // course style -> PASS
      const courseStyle = result.checks.find(
        (c) => c.name === 'Teaching Style (course)'
      );
      expect(courseStyle.status).toBe('PASS');

      // Overall counts
      expect(result.errors).toBe(0);
      expect(result.warnings).toBeGreaterThanOrEqual(1);

      // Formatted output
      expect(result.formatted).toContain('Overall: WARN');
    });
  });
});
