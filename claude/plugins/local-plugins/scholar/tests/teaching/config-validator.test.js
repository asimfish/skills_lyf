/**
 * Unit Tests for Config Validator
 *
 * Tests multi-level YAML validation (syntax, schema, semantic, cross-file).
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigValidator, createConfigValidator, validateConfigFile } from '../../src/teaching/validators/config-validator.js';

describe('ConfigValidator', () => {
  let tempDir;
  let validator;

  beforeEach(() => {
    tempDir = join(tmpdir(), `config-validator-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    validator = new ConfigValidator({ cwd: tempDir });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create validator with default options', () => {
      const v = new ConfigValidator();
      expect(v.options.maxLevel).toBe('cross-file');
      expect(v.options.strict).toBe(false);
    });

    it('should accept custom options', () => {
      const v = new ConfigValidator({ strict: true, maxLevel: 'schema' });
      expect(v.options.strict).toBe(true);
      expect(v.options.maxLevel).toBe('schema');
    });
  });

  describe('detectSchemaType', () => {
    it('should detect lesson-plan from path', () => {
      expect(validator.detectSchemaType('content/lesson-plans/week03.yml')).toBe('lesson-plan');
    });

    it('should detect lesson-plan from week pattern', () => {
      expect(validator.detectSchemaType('week01.yml')).toBe('lesson-plan');
    });

    it('should detect teaching-style from path', () => {
      expect(validator.detectSchemaType('.claude/teaching-style.local.yml')).toBe('teaching-style');
    });

    it('should return unknown for unrecognized paths', () => {
      expect(validator.detectSchemaType('random/file.yml')).toBe('unknown');
    });
  });

  describe('Level 1: Syntax validation', () => {
    it('should pass valid YAML', () => {
      const yamlPath = join(tempDir, 'valid.yml');
      writeFileSync(yamlPath, 'key: value\nlist:\n  - item1\n  - item2');

      const result = validator.validateFile(yamlPath, { schemaType: 'unknown' });

      expect(result.errors.filter(e => e.rule === 'yaml-syntax')).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    it('should fail invalid YAML', () => {
      const yamlPath = join(tempDir, 'invalid.yml');
      writeFileSync(yamlPath, 'key: value\n  bad-indent: oops');

      const result = validator.validateFile(yamlPath);

      expect(result.isValid).toBe(false);
      expect(result.level).toBe('syntax');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report line numbers for syntax errors', () => {
      const yamlPath = join(tempDir, 'syntax-error.yml');
      writeFileSync(yamlPath, 'valid: true\ninvalid: {{{{');

      const result = validator.validateFile(yamlPath);

      expect(result.errors[0].line).toBeGreaterThan(0);
    });

    it('should handle empty files with warning', () => {
      const yamlPath = join(tempDir, 'empty.yml');
      writeFileSync(yamlPath, '');

      const result = validator.validateFile(yamlPath);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.rule === 'yaml-empty')).toBe(true);
    });

    it('should return error for non-existent file', () => {
      const result = validator.validateFile(join(tempDir, 'missing.yml'));

      expect(result.isValid).toBe(false);
      expect(result.errors[0].rule).toBe('file-exists');
    });
  });

  describe('Level 2: Schema validation', () => {
    it('should validate lesson plan structure', () => {
      const yamlPath = join(tempDir, 'week01.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Introduction"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Understand basic concepts"
topics:
  - id: "T-1.1"
    name: "Introduction to course"
`);

      const result = validator.validateFile(yamlPath);

      const schemaErrors = result.errors.filter(e => e.rule?.startsWith('schema:'));
      expect(schemaErrors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const yamlPath = join(tempDir, 'week-missing.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Introduction"
# Missing learning_objectives and topics
`);

      const result = validator.validateFile(yamlPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'schema:required')).toBe(true);
    });

    it('should catch wrong Bloom level', () => {
      const yamlPath = join(tempDir, 'week-bad-bloom.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "invalid-bloom"
    description: "Test objective"
topics:
  - id: "T-1.1"
    name: "Test topic"
`);

      const result = validator.validateFile(yamlPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'schema:enum')).toBe(true);
    });

    it('should catch invalid ID patterns', () => {
      const yamlPath = join(tempDir, 'week-bad-id.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "INVALID"
    level: "understand"
    description: "Test objective"
topics:
  - id: "T-1.1"
    name: "Test topic"
`);

      const result = validator.validateFile(yamlPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'schema:pattern')).toBe(true);
    });

    it('should validate teaching style structure', () => {
      const yamlPath = join(tempDir, 'teaching-style.yml');
      writeFileSync(yamlPath, `
teaching_style:
  pedagogical_approach:
    primary: "active-learning"
  explanation_style:
    formality: "balanced"
`);

      const result = validator.validateFile(yamlPath, { schemaType: 'teaching-style' });

      const schemaErrors = result.errors.filter(e => e.rule?.startsWith('schema:'));
      expect(schemaErrors).toHaveLength(0);
    });
  });

  describe('Level 3: Semantic validation', () => {
    it('should warn when activity time exceeds lecture time', () => {
      const yamlPath = join(tempDir, 'week-duration.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Test"
activities:
  - id: "A-1.1"
    type: "in-class-practice"
    duration_minutes: 90
    title: "Long activity"
lecture_structure:
  - segment: "introduction"
    duration_minutes: 50
`);

      const result = validator.validateFile(yamlPath);

      expect(result.warnings.some(w => w.rule === 'semantic:duration-overflow')).toBe(true);
    });

    it('should warn when objectives are not assessed', () => {
      const yamlPath = join(tempDir, 'week-unassessed.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Unassessed objective"
topics:
  - id: "T-1.1"
    name: "Test"
assessments:
  - type: "quiz"
    id: "Q-1"
    title: "Quiz 1"
    learning_objectives: []
`);

      const result = validator.validateFile(yamlPath);

      expect(result.warnings.some(w => w.rule === 'semantic:unassessed-objective')).toBe(true);
    });

    it('should warn about self-referencing prerequisites', () => {
      const yamlPath = join(tempDir, 'week-self-prereq.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Topic 1"
  - id: "T-1.2"
    name: "Topic 2"
    prerequisites:
      - "T-1.1"
`);

      const result = validator.validateFile(yamlPath);

      expect(result.warnings.some(w => w.rule === 'semantic:self-prerequisite')).toBe(true);
    });

    it('should error on invalid date range', () => {
      const yamlPath = join(tempDir, 'week-bad-dates.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
date_range:
  start: "2026-02-01"
  end: "2026-01-01"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Test"
`);

      const result = validator.validateFile(yamlPath);

      expect(result.errors.some(e => e.rule === 'semantic:invalid-date-range')).toBe(true);
    });
  });

  describe('Level 4: Cross-file validation', () => {
    it('should warn about missing dataset files', () => {
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });

      const yamlPath = join(lessonPlans, 'week01.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Test"
materials:
  datasets:
    - name: "missing-data"
      file: "datasets/missing.csv"
`);

      const result = validator.validateFile(yamlPath);

      expect(result.warnings.some(w => w.rule === 'cross-file:missing-dataset')).toBe(true);
    });

    it('should warn about future prerequisites', () => {
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });

      const yamlPath = join(lessonPlans, 'week01.yml');
      writeFileSync(yamlPath, `
week: 1
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
`);

      const result = validator.validateFile(yamlPath);

      expect(result.warnings.some(w => w.rule === 'cross-file:future-prerequisite')).toBe(true);
    });
  });

  describe('maxLevel option', () => {
    it('should stop at syntax level', () => {
      const v = new ConfigValidator({ maxLevel: 'syntax', cwd: tempDir });
      const yamlPath = join(tempDir, 'week01.yml');
      writeFileSync(yamlPath, 'week: 1\ntitle: "Test"');

      const result = v.validateFile(yamlPath);

      expect(result.level).toBe('syntax');
    });

    it('should stop at schema level', () => {
      const v = new ConfigValidator({ maxLevel: 'schema', cwd: tempDir });
      const yamlPath = join(tempDir, 'week01.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Test"
`);

      const result = v.validateFile(yamlPath);

      expect(result.level).toBe('schema');
    });
  });

  describe('strict mode', () => {
    it('should fail on warnings in strict mode', () => {
      const v = new ConfigValidator({ strict: true, cwd: tempDir });
      const yamlPath = join(tempDir, 'week01.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Test"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Test"
topics:
  - id: "T-1.1"
    name: "Topic 1"
  - id: "T-1.2"
    name: "Topic 2"
    prerequisites:
      - "T-1.1"
`);

      const result = v.validateFile(yamlPath);

      // Has self-prerequisite warning, so strict mode should fail
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.isValid).toBe(false);
    });
  });

  describe('convenience functions', () => {
    it('createConfigValidator should return instance', () => {
      const v = createConfigValidator();
      expect(v).toBeInstanceOf(ConfigValidator);
    });

    it('validateConfigFile should validate single file', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'key: value');

      const result = validateConfigFile(yamlPath, { cwd: tempDir });

      expect(result.data).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should validate within 1000ms (50ms target, generous budget for parallel CI load)', () => {
      const yamlPath = join(tempDir, 'week01.yml');
      writeFileSync(yamlPath, `
week: 1
title: "Complex Lesson Plan"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Objective 1"
  - id: "LO-1.2"
    level: "apply"
    description: "Objective 2"
  - id: "LO-1.3"
    level: "analyze"
    description: "Objective 3"
topics:
  - id: "T-1.1"
    name: "Topic 1"
    subtopics:
      - "Subtopic A"
      - "Subtopic B"
  - id: "T-1.2"
    name: "Topic 2"
    prerequisites:
      - "T-0.1"
`);

      const result = validator.validateFile(yamlPath);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
