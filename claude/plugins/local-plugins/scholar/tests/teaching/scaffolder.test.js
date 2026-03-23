/**
 * Unit Tests for ConfigScaffolder
 *
 * Tests prompt template scaffolding from Scholar defaults to project-level
 * `.flow/templates/prompts/` directory.
 */

import { jest } from '@jest/globals';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import yaml from 'js-yaml';
import { ConfigScaffolder, ScaffoldError, VALID_PROMPT_TYPES, SCHOLAR_VERSION } from '../../src/teaching/config/scaffolder.js';

describe('ConfigScaffolder', () => {
  let tempDir;
  let scaffolder;

  beforeEach(() => {
    tempDir = join(tmpdir(), `scaffolder-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
    scaffolder = new ConfigScaffolder({ cwd: tempDir });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create scaffolder with default options', () => {
      const s = new ConfigScaffolder();
      expect(s.cwd).toBe(process.cwd());
      expect(s.debug).toBe(false);
    });

    it('should accept custom cwd', () => {
      const s = new ConfigScaffolder({ cwd: '/tmp/test' });
      expect(s.cwd).toBe('/tmp/test');
    });

    it('should accept debug option', () => {
      const s = new ConfigScaffolder({ debug: true });
      expect(s.debug).toBe(true);
    });
  });

  describe('scaffold', () => {
    it('should reject invalid prompt type', async () => {
      await expect(scaffolder.scaffold('not-a-real-type'))
        .rejects.toThrow(ScaffoldError);

      await expect(scaffolder.scaffold('not-a-real-type'))
        .rejects.toThrow('Invalid prompt type');
    });

    it('should reject empty string as prompt type', async () => {
      await expect(scaffolder.scaffold(''))
        .rejects.toThrow(ScaffoldError);
    });

    it('should create file in correct location', async () => {
      const result = await scaffolder.scaffold('lecture-notes');

      const expectedPath = join(tempDir, '.flow', 'templates', 'prompts', 'lecture-notes.md');
      expect(result.targetPath).toBe(expectedPath);
      expect(existsSync(expectedPath)).toBe(true);
      expect(result.alreadyExists).toBe(false);
    });

    it('should create .flow/templates/prompts/ directory if missing', async () => {
      const targetDir = join(tempDir, '.flow', 'templates', 'prompts');
      expect(existsSync(targetDir)).toBe(false);

      await scaffolder.scaffold('lecture-notes');

      expect(existsSync(targetDir)).toBe(true);
    });

    it('should create nested directories when none exist', async () => {
      // tempDir has no .flow/ at all
      expect(existsSync(join(tempDir, '.flow'))).toBe(false);

      const result = await scaffolder.scaffold('lecture-notes');

      expect(existsSync(result.targetPath)).toBe(true);
    });

    it('should add based_on_scholar_version to frontmatter', async () => {
      const result = await scaffolder.scaffold('lecture-notes');
      const content = readFileSync(result.targetPath, 'utf8');

      // Parse frontmatter
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(fmMatch).not.toBeNull();

      const metadata = yaml.load(fmMatch[1]);
      expect(metadata.based_on_scholar_version).toBe(SCHOLAR_VERSION);
    });

    it('should preserve original frontmatter fields after injection', async () => {
      const result = await scaffolder.scaffold('lecture-notes');
      const content = readFileSync(result.targetPath, 'utf8');

      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const metadata = yaml.load(fmMatch[1]);

      // Original fields should still be present
      expect(metadata.prompt_version).toBe('2.0');
      expect(metadata.prompt_type).toBe('lecture-notes');
      expect(metadata.prompt_description).toBeDefined();
    });

    it('should preserve the prompt body after injection', async () => {
      const result = await scaffolder.scaffold('lecture-notes');
      const content = readFileSync(result.targetPath, 'utf8');

      // The body should contain key content from the default
      expect(content).toContain('Comprehensive Lecture Notes');
      expect(content).toContain('{{topic}}');
    });

    it('should return correct metadata for lecture-notes (Format A: variables)', async () => {
      const result = await scaffolder.scaffold('lecture-notes');

      expect(result.scholarVersion).toBe(SCHOLAR_VERSION);
      expect(result.requiredVars).toContain('topic');
      expect(result.requiredVars).toContain('course_level');
      expect(result.requiredVars).toContain('field');
      expect(result.optionalVars).toContain('course_code');
      expect(result.optionalVars).toContain('language');
      expect(result.alreadyExists).toBe(false);
    });

    it('should return correct metadata for quiz (Format B: required_variables)', async () => {
      const result = await scaffolder.scaffold('quiz');

      expect(result.scholarVersion).toBe(SCHOLAR_VERSION);
      expect(result.requiredVars).toContain('topic');
      expect(result.requiredVars).toContain('course_level');
      expect(result.optionalVars).toContain('num_questions');
      expect(result.alreadyExists).toBe(false);
    });

    it('should return alreadyExists=true when file exists', async () => {
      // First scaffold
      const first = await scaffolder.scaffold('lecture-notes');
      expect(first.alreadyExists).toBe(false);

      // Second scaffold of same type
      const second = await scaffolder.scaffold('lecture-notes');
      expect(second.alreadyExists).toBe(true);
      expect(second.targetPath).toBe(first.targetPath);
    });

    it('should not overwrite existing file', async () => {
      // Create a custom file first
      const targetDir = join(tempDir, '.flow', 'templates', 'prompts');
      mkdirSync(targetDir, { recursive: true });
      const targetPath = join(targetDir, 'lecture-notes.md');
      const customContent = '---\nprompt_version: "99.0"\nprompt_type: lecture-notes\nprompt_description: "Custom"\nvariables:\n  required:\n    - custom_var\n  optional:\n    - another_var\n---\n\nMy custom prompt';
      writeFileSync(targetPath, customContent);

      // Scaffold should not overwrite
      const result = await scaffolder.scaffold('lecture-notes');
      expect(result.alreadyExists).toBe(true);

      // Content should be unchanged
      const afterContent = readFileSync(targetPath, 'utf8');
      expect(afterContent).toBe(customContent);
    });

    it('should extract variables from existing file when alreadyExists', async () => {
      const targetDir = join(tempDir, '.flow', 'templates', 'prompts');
      mkdirSync(targetDir, { recursive: true });
      const targetPath = join(targetDir, 'lecture-notes.md');
      writeFileSync(targetPath, '---\nvariables:\n  required:\n    - my_var\n  optional:\n    - opt_var\n---\n\nBody');

      const result = await scaffolder.scaffold('lecture-notes');
      expect(result.alreadyExists).toBe(true);
      expect(result.requiredVars).toEqual(['my_var']);
      expect(result.optionalVars).toEqual(['opt_var']);
    });

    it('should throw ScaffoldError when default prompt is missing', async () => {
      // 'feedback' is a valid type but has no default file
      await expect(scaffolder.scaffold('feedback'))
        .rejects.toThrow(ScaffoldError);

      await expect(scaffolder.scaffold('feedback'))
        .rejects.toThrow('No default prompt found');
    });

    it('should scaffold multiple types independently', async () => {
      const lectureResult = await scaffolder.scaffold('lecture-notes');
      const quizResult = await scaffolder.scaffold('quiz');

      expect(lectureResult.targetPath).not.toBe(quizResult.targetPath);
      expect(existsSync(lectureResult.targetPath)).toBe(true);
      expect(existsSync(quizResult.targetPath)).toBe(true);
    });
  });

  describe('listAvailable', () => {
    it('should return an array', () => {
      const available = scaffolder.listAvailable();
      expect(Array.isArray(available)).toBe(true);
    });

    it('should only return types with existing default files', () => {
      const available = scaffolder.listAvailable();

      // These are the ones we know exist on disk
      expect(available).toContain('lecture-notes');
      expect(available).toContain('lecture-outline');
      expect(available).toContain('quiz');
      expect(available).toContain('section-content');
    });

    it('should not return types without default files', () => {
      const available = scaffolder.listAvailable();

      // These should not be listed unless their default files are created
      // We check that every returned item is a valid type
      for (const type of available) {
        expect(VALID_PROMPT_TYPES).toContain(type);
      }
    });

    it('should return results in sorted order', () => {
      const available = scaffolder.listAvailable();
      const sorted = [...available].sort();
      expect(available).toEqual(sorted);
    });

    it('should only include valid prompt types', () => {
      const available = scaffolder.listAvailable();

      for (const name of available) {
        expect(VALID_PROMPT_TYPES).toContain(name);
      }
    });
  });

  describe('VALID_PROMPT_TYPES', () => {
    it('should export the valid prompt types constant', () => {
      expect(Array.isArray(VALID_PROMPT_TYPES)).toBe(true);
      expect(VALID_PROMPT_TYPES.length).toBe(11);
    });

    it('should include all expected types', () => {
      const expected = [
        'lecture-notes', 'lecture-outline', 'section-content',
        'exam', 'quiz', 'slides', 'revealjs-slides',
        'assignment', 'syllabus', 'rubric', 'feedback'
      ];

      for (const type of expected) {
        expect(VALID_PROMPT_TYPES).toContain(type);
      }
    });
  });

  describe('SCHOLAR_VERSION', () => {
    it('should export the scholar version constant', () => {
      expect(typeof SCHOLAR_VERSION).toBe('string');
      expect(SCHOLAR_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should be 2.7.0', () => {
      expect(SCHOLAR_VERSION).toBe('2.7.0');
    });
  });

  describe('ScaffoldError', () => {
    it('should be an instance of Error', () => {
      const err = new ScaffoldError('test error');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ScaffoldError);
    });

    it('should have correct name', () => {
      const err = new ScaffoldError('test');
      expect(err.name).toBe('ScaffoldError');
    });

    it('should store type and path', () => {
      const err = new ScaffoldError('test', { type: 'exam', path: '/some/path' });
      expect(err.type).toBe('exam');
      expect(err.path).toBe('/some/path');
    });

    it('should default type and path to null', () => {
      const err = new ScaffoldError('test');
      expect(err.type).toBeNull();
      expect(err.path).toBeNull();
    });
  });

  describe('frontmatter injection edge cases', () => {
    it('should handle prompt with no frontmatter gracefully', async () => {
      // Create a default prompt without frontmatter in a controlled way
      // by creating a custom scaffolder pointing at a temp defaults dir
      const customDefaultsDir = join(tempDir, 'custom-defaults');
      mkdirSync(customDefaultsDir, { recursive: true });
      writeFileSync(
        join(customDefaultsDir, 'lecture-notes.md'),
        '# Just a body\n\nNo frontmatter here.'
      );

      // We test _injectVersion indirectly through scaffold
      // For this edge case, we test the internal method directly
      const content = '# Just a body\n\nNo frontmatter here.';
      const injected = scaffolder._injectVersion(content);

      expect(injected).toContain('---');
      expect(injected).toContain('based_on_scholar_version');
      expect(injected).toContain('# Just a body');
    });

    it('should handle empty variables gracefully', async () => {
      const targetDir = join(tempDir, '.flow', 'templates', 'prompts');
      mkdirSync(targetDir, { recursive: true });
      writeFileSync(
        join(targetDir, 'lecture-notes.md'),
        '---\nprompt_type: lecture-notes\n---\n\nBody'
      );

      const result = await scaffolder.scaffold('lecture-notes');
      expect(result.requiredVars).toEqual([]);
      expect(result.optionalVars).toEqual([]);
    });

    it('should handle malformed YAML in existing file gracefully', async () => {
      const targetDir = join(tempDir, '.flow', 'templates', 'prompts');
      mkdirSync(targetDir, { recursive: true });
      writeFileSync(
        join(targetDir, 'lecture-notes.md'),
        '---\n{{invalid yaml}}\n---\n\nBody'
      );

      const result = await scaffolder.scaffold('lecture-notes');
      expect(result.alreadyExists).toBe(true);
      // Should not throw, returns empty vars
      expect(result.requiredVars).toEqual([]);
      expect(result.optionalVars).toEqual([]);
    });

    it('should throw ScaffoldError when prompt has invalid YAML frontmatter', () => {
      const invalidContent = '---\n{{invalid: yaml: content}}\n---\n\nBody text';

      expect(() => scaffolder._injectVersion(invalidContent, 'lecture-notes'))
        .toThrow(ScaffoldError);

      expect(() => scaffolder._injectVersion(invalidContent, 'lecture-notes'))
        .toThrow('Cannot inject version into scaffolded prompt: invalid YAML frontmatter');
    });

    it('should include prompt type in ScaffoldError for invalid YAML frontmatter', () => {
      const invalidContent = '---\n{{invalid: yaml: content}}\n---\n\nBody text';

      try {
        scaffolder._injectVersion(invalidContent, 'exam');
        // Should not reach here
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(ScaffoldError);
        expect(err.type).toBe('exam');
      }
    });
  });

  describe('Security', () => {
    it('should reject type with ".." path traversal', async () => {
      await expect(scaffolder.scaffold('../../etc/passwd'))
        .rejects.toThrow(ScaffoldError);
      await expect(scaffolder.scaffold('../../etc/passwd'))
        .rejects.toThrow('contains path separators');
    });

    it('should reject type with forward slash', async () => {
      await expect(scaffolder.scaffold('foo/bar'))
        .rejects.toThrow(ScaffoldError);
      await expect(scaffolder.scaffold('foo/bar'))
        .rejects.toThrow('contains path separators');
    });

    it('should reject type with backslash', async () => {
      await expect(scaffolder.scaffold('foo\\bar'))
        .rejects.toThrow(ScaffoldError);
      await expect(scaffolder.scaffold('foo\\bar'))
        .rejects.toThrow('contains path separators');
    });

    it('should reject ".." even without slashes', async () => {
      await expect(scaffolder.scaffold('..'))
        .rejects.toThrow('contains path separators');
    });

    it('should reject nested traversal like "lecture-notes/../../etc/passwd"', async () => {
      await expect(scaffolder.scaffold('lecture-notes/../../etc/passwd'))
        .rejects.toThrow('contains path separators');
    });

    it('should still accept valid types after security check', async () => {
      const result = await scaffolder.scaffold('lecture-notes');
      expect(result.targetPath).toBeDefined();
      expect(result.alreadyExists).toBe(false);
    });
  });

  describe('debug logging', () => {
    it('should not throw when debug is enabled', async () => {
      const debugScaffolder = new ConfigScaffolder({ cwd: tempDir, debug: true });

      // Capture console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await debugScaffolder.scaffold('lecture-notes');

      expect(consoleSpy).toHaveBeenCalled();
      const logMessages = consoleSpy.mock.calls.map(c => c[0]);
      expect(logMessages.some(m => m.includes('[scholar:scaffolder]'))).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', async () => {
      const quietScaffolder = new ConfigScaffolder({ cwd: tempDir, debug: false });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Ensure SCHOLAR_DEBUG is not set
      const originalEnv = process.env.SCHOLAR_DEBUG;
      delete process.env.SCHOLAR_DEBUG;

      await quietScaffolder.scaffold('lecture-notes');

      const logMessages = consoleSpy.mock.calls.map(c => c[0]);
      expect(logMessages.filter(m => m.includes('[scholar:scaffolder]'))).toHaveLength(0);

      consoleSpy.mockRestore();
      if (originalEnv !== undefined) {
        process.env.SCHOLAR_DEBUG = originalEnv;
      }
    });
  });
});
