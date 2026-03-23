/**
 * Edge Case Tests for Config Loader
 *
 * Tests unusual inputs, boundary conditions, and error scenarios
 * for the --config flag and config loader functionality.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, symlinkSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { loadTeachConfig } from '../../src/teaching/config/loader.js';

describe('Config Loader Edge Cases', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = join(tmpdir(), `config-edge-cases-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Path Handling Edge Cases', () => {
    it('should handle relative paths correctly', () => {
      const configPath = join(tempDir, 'config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      // Use resolved path (simulating how flow-cli would pass it)
      const resolvedPath = resolve(configPath);
      const config = loadTeachConfig(tempDir, {
        configPath: resolvedPath
      });

      expect(config.scholar.course_info.level).toBe('graduate');
    });

    it('should handle paths with spaces', () => {
      const dirWithSpaces = join(tempDir, 'path with spaces', 'nested dir');
      mkdirSync(dirWithSpaces, { recursive: true });

      const configPath = join(dirWithSpaces, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "undergraduate"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: configPath
      });

      expect(config.scholar.course_info.level).toBe('undergraduate');
    });

    it('should handle paths with special characters', () => {
      const specialDir = join(tempDir, 'config-v2.0_final (1)');
      mkdirSync(specialDir, { recursive: true });

      const configPath = join(specialDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    field: "statistics"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: configPath
      });

      expect(config.scholar.course_info.field).toBe('statistics');
    });

    it('should handle symbolic links to config files', () => {
      // Create actual config
      const actualConfig = join(tempDir, 'actual-config.yml');
      writeFileSync(
        actualConfig,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      // Create symlink
      const symlinkPath = join(tempDir, 'linked-config.yml');
      try {
        symlinkSync(actualConfig, symlinkPath);

        const config = loadTeachConfig(tempDir, {
          configPath: symlinkPath
        });

        expect(config.scholar.course_info.level).toBe('graduate');
      } catch (e) {
        // Skip on systems without symlink support
        if (e.code !== 'EPERM') throw e;
      }
    });

    it('should handle deeply nested paths', () => {
      const deepPath = join(tempDir, 'a', 'b', 'c', 'd', 'e', 'f', 'g');
      mkdirSync(deepPath, { recursive: true });

      const configPath = join(deepPath, 'config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "undergraduate"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: configPath
      });

      expect(config.scholar.course_info.level).toBe('undergraduate');
    });
  });

  describe('File Content Edge Cases', () => {
    it('should handle empty config file', () => {
      const emptyConfig = join(tempDir, 'empty.yml');
      writeFileSync(emptyConfig, '');

      expect(() =>
        loadTeachConfig(tempDir, {
          configPath: emptyConfig,
          strict: true
        })
      ).toThrow(/empty|invalid/i);
    });

    it('should handle config with only comments', () => {
      const commentOnlyConfig = join(tempDir, 'comments.yml');
      writeFileSync(
        commentOnlyConfig,
        `# This is a comment
# Another comment
# No actual config here
`
      );

      expect(() =>
        loadTeachConfig(tempDir, {
          configPath: commentOnlyConfig,
          strict: true
        })
      ).toThrow(/empty|invalid/i);
    });

    it('should handle config with whitespace only', () => {
      const whitespaceConfig = join(tempDir, 'whitespace.yml');
      writeFileSync(whitespaceConfig, '   \n\n   \t\t\n   ');

      expect(() =>
        loadTeachConfig(tempDir, {
          configPath: whitespaceConfig,
          strict: true
        })
      ).toThrow(/empty|invalid/i);
    });

    it('should handle malformed YAML', () => {
      const malformedConfig = join(tempDir, 'malformed.yml');
      writeFileSync(
        malformedConfig,
        `scholar:
  course_info:
    level: "undergraduate"
  bad_indentation:
wrong: here
  - invalid: list
    mixing: styles
`
      );

      expect(() =>
        loadTeachConfig(tempDir, {
          configPath: malformedConfig,
          strict: true
        })
      ).toThrow(/YAML|parsing/i);
    });

    it('should handle config with only non-scholar sections', () => {
      const noScholarConfig = join(tempDir, 'no-scholar.yml');
      writeFileSync(
        noScholarConfig,
        `course:
  name: "STAT 440"
  semester: "Spring"

deployment:
  url: "https://example.com"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: noScholarConfig
      });

      // Should merge with defaults (which provide scholar section)
      expect(config.scholar).toBeDefined();
      expect(config.scholar.course_info.level).toBe('undergraduate'); // default
      expect(config.course.name).toBe('STAT 440');
    });

    it('should handle very large config file', () => {
      const largeConfig = join(tempDir, 'large.yml');
      const topics = Array.from({ length: 100 }, (_, i) => `  - "Topic ${i + 1}"`).join('\n');

      writeFileSync(
        largeConfig,
        `scholar:
  course_info:
    level: "graduate"
  topics:
${topics}
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: largeConfig
      });

      expect(config.scholar.course_info.level).toBe('graduate');
      expect(config.scholar.topics).toHaveLength(100);
    });

    it('should handle Unicode in config values', () => {
      const unicodeConfig = join(tempDir, 'unicode.yml');
      writeFileSync(
        unicodeConfig,
        `scholar:
  course_info:
    title: "Análisis Estadístico"
    instructor: "Dra. María García"
    level: "undergraduate"
  style:
    notation: "統計表記"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: unicodeConfig
      });

      expect(config.scholar.course_info.title).toBe('Análisis Estadístico');
      expect(config.scholar.course_info.instructor).toBe('Dra. María García');
    });

    it('should handle numeric and boolean values', () => {
      const typedConfig = join(tempDir, 'typed.yml');
      writeFileSync(
        typedConfig,
        `scholar:
  course_info:
    level: "undergraduate"
    credits: 3
    required: true
    gpa_requirement: 2.5
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: typedConfig
      });

      expect(config.scholar.course_info.credits).toBe(3);
      expect(config.scholar.course_info.required).toBe(true);
      expect(config.scholar.course_info.gpa_requirement).toBe(2.5);
    });

    it('should handle multiline strings', () => {
      const multilineConfig = join(tempDir, 'multiline.yml');
      writeFileSync(
        multilineConfig,
        `scholar:
  course_info:
    level: "undergraduate"
    description: |
      This is a multi-line
      course description that
      spans several lines.
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: multilineConfig
      });

      expect(config.scholar.course_info.description).toContain('multi-line');
      expect(config.scholar.course_info.description).toContain('course description');
    });
  });

  describe('Option Combinations', () => {
    it('should handle configPath with validate=false', () => {
      const invalidConfig = join(tempDir, 'invalid-values.yml');
      writeFileSync(
        invalidConfig,
        `scholar:
  course_info:
    level: "invalid-level"
    difficulty: "not-a-difficulty"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: invalidConfig,
        validate: false
      });

      // Should load without validation errors
      expect(config.scholar.course_info.level).toBe('invalid-level');
      expect(config.scholar.course_info.difficulty).toBe('not-a-difficulty');
    });

    it('should handle configPath + debug + strict together', () => {
      const validConfig = join(tempDir, 'valid.yml');
      writeFileSync(
        validConfig,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        const config = loadTeachConfig(tempDir, {
          configPath: validConfig,
          debug: true,
          strict: true
        });

        expect(config.scholar.course_info.level).toBe('graduate');
        expect(logs.some((l) => l.includes('[scholar:config]'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });

    it('should prioritize configPath over startDir for discovery', () => {
      // Create config at startDir location
      const startDirConfig = join(tempDir, 'startdir', '.flow');
      mkdirSync(startDirConfig, { recursive: true });
      writeFileSync(
        join(startDirConfig, 'teach-config.yml'),
        `scholar:
  course_info:
    level: "undergraduate"
`
      );

      // Create explicit config elsewhere
      const explicitConfig = join(tempDir, 'explicit', 'config.yml');
      mkdirSync(join(tempDir, 'explicit'), { recursive: true });
      writeFileSync(
        explicitConfig,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      const config = loadTeachConfig(join(tempDir, 'startdir'), {
        configPath: explicitConfig
      });

      // Should use explicit path, not startDir discovery
      expect(config.scholar.course_info.level).toBe('graduate');
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error for non-existent file', () => {
      const nonExistent = join(tempDir, 'does-not-exist.yml');

      try {
        loadTeachConfig(tempDir, {
          configPath: nonExistent,
          strict: true
        });
        fail('Should have thrown');
      } catch (e) {
        expect(e.message).toContain('Config file not found');
        expect(e.message).toContain(nonExistent);
      }
    });

    it('should provide clear error for YAML syntax error', () => {
      const badYaml = join(tempDir, 'bad-yaml.yml');
      writeFileSync(badYaml, 'this: is: not: valid: yaml: {{{{');

      try {
        loadTeachConfig(tempDir, {
          configPath: badYaml,
          strict: true
        });
        fail('Should have thrown');
      } catch (e) {
        expect(e.message).toMatch(/YAML|parsing/i);
      }
    });

    it('should provide clear error for validation failure in strict mode', () => {
      const invalidConfig = join(tempDir, 'invalid.yml');
      writeFileSync(
        invalidConfig,
        `scholar:
  course_info:
    level: "not-a-valid-level"
`
      );

      try {
        loadTeachConfig(tempDir, {
          configPath: invalidConfig,
          strict: true
        });
        fail('Should have thrown');
      } catch (e) {
        expect(e.message).toMatch(/validation|level/i);
      }
    });
  });

  describe('Null and Undefined Handling', () => {
    it('should handle null configPath same as undefined', () => {
      // Create discoverable config
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(
        join(flowDir, 'teach-config.yml'),
        `scholar:
  course_info:
    level: "graduate"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: null
      });

      // Should fall back to discovery
      expect(config.scholar.course_info.level).toBe('graduate');
    });

    it('should handle undefined options gracefully', () => {
      const configPath = join(tempDir, 'config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "undergraduate"
`
      );

      // Pass undefined for various options
      const config = loadTeachConfig(tempDir, {
        configPath: configPath,
        validate: undefined,
        strict: undefined,
        debug: undefined
      });

      expect(config.scholar.course_info.level).toBe('undergraduate');
    });
  });

  describe('Config Merging Behavior', () => {
    it('should deep merge nested objects', () => {
      const partialConfig = join(tempDir, 'partial.yml');
      writeFileSync(
        partialConfig,
        `scholar:
  course_info:
    field: "mathematics"
  style:
    examples: false
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: partialConfig
      });

      // Custom values
      expect(config.scholar.course_info.field).toBe('mathematics');
      expect(config.scholar.style.examples).toBe(false);

      // Default values preserved
      expect(config.scholar.course_info.level).toBe('undergraduate');
      expect(config.scholar.course_info.difficulty).toBe('intermediate');
      expect(config.scholar.style.tone).toBe('formal');
    });

    it('should not merge arrays (replace instead)', () => {
      const configWithArray = join(tempDir, 'array.yml');
      writeFileSync(
        configWithArray,
        `scholar:
  defaults:
    question_types:
      - "essay"
      - "calculation"
`
      );

      const config = loadTeachConfig(tempDir, {
        configPath: configWithArray
      });

      // Should replace, not concatenate
      expect(config.scholar.defaults.question_types).toEqual(['essay', 'calculation']);
      expect(config.scholar.defaults.question_types).not.toContain('multiple-choice');
    });
  });
});
