/**
 * Unit tests for Config Loader
 */

import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getDefaultConfig,
  findConfigFile,
  loadConfigFile,
  mergeConfig,
  validateConfig,
  loadTeachConfig,
  getConfigValue,
  getCourseInfo,
  getDefaults,
  getStyle,
} from '../../src/teaching/config/loader.js';

describe('Config Loader', () => {
  const fixturesDir = join(process.cwd(), 'tests', 'teaching', 'fixtures');

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getDefaultConfig();
      expect(config).toBeDefined();
      expect(config.scholar).toBeDefined();
      expect(config.scholar.course_info).toBeDefined();
      expect(config.scholar.defaults).toBeDefined();
      expect(config.scholar.style).toBeDefined();
    });

    it('should have expected default values', () => {
      const config = getDefaultConfig();
      expect(config.scholar.course_info.level).toBe('undergraduate');
      expect(config.scholar.course_info.difficulty).toBe('intermediate');
      expect(config.scholar.defaults.exam_format).toBe('markdown');
      expect(config.scholar.style.tone).toBe('formal');
    });

    it('should return new object each time', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('findConfigFile', () => {
    let tempDir;

    beforeEach(() => {
      // Create temporary directory structure
      tempDir = join(tmpdir(), `scholar-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      // Clean up
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should find config in current directory', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(configPath, 'scholar:\n  test: true\n');

      const found = findConfigFile(tempDir);
      expect(found).toBe(configPath);
    });

    it('should find config in parent directory', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(configPath, 'scholar:\n  test: true\n');

      // Create nested directory
      const nestedDir = join(tempDir, 'nested', 'deeply');
      mkdirSync(nestedDir, { recursive: true });

      const found = findConfigFile(nestedDir);
      expect(found).toBe(configPath);
    });

    it('should return null if no config found', () => {
      const found = findConfigFile(tempDir);
      expect(found).toBeNull();
    });

    it('should stop at root directory', () => {
      const found = findConfigFile('/');
      expect(found).toBeNull();
    });
  });

  describe('loadConfigFile', () => {
    it('should load valid config file', () => {
      const configPath = join(fixturesDir, 'valid-config.yml');
      const config = loadConfigFile(configPath);

      expect(config).toBeDefined();
      expect(config.scholar).toBeDefined();
      expect(config.scholar.course_info.level).toBe('graduate');
      expect(config.scholar.course_info.field).toBe('statistics');
    });

    it('should load minimal config file', () => {
      const configPath = join(fixturesDir, 'minimal-config.yml');
      const config = loadConfigFile(configPath);

      expect(config).toBeDefined();
      expect(config.scholar.course_info.field).toBe('mathematics');
    });

    it('should throw error for malformed YAML', () => {
      const configPath = join(fixturesDir, 'malformed-config.yml');
      expect(() => loadConfigFile(configPath)).toThrow(/YAML parsing error/);
    });

    it('should throw error for non-existent file', () => {
      const configPath = join(fixturesDir, 'non-existent.yml');
      expect(() => loadConfigFile(configPath)).toThrow(/Failed to load/);
    });
  });

  describe('mergeConfig', () => {
    it('should merge user config with defaults', () => {
      const defaultConfig = {
        scholar: {
          course_info: {
            level: 'undergraduate',
            difficulty: 'intermediate',
          },
          defaults: {
            exam_format: 'markdown',
          },
        },
      };

      const userConfig = {
        scholar: {
          course_info: {
            level: 'graduate',
            field: 'statistics',
          },
        },
      };

      const merged = mergeConfig(userConfig, defaultConfig);

      // User values should override
      expect(merged.scholar.course_info.level).toBe('graduate');
      // User values should be added
      expect(merged.scholar.course_info.field).toBe('statistics');
      // Default values should be preserved
      expect(merged.scholar.course_info.difficulty).toBe('intermediate');
      expect(merged.scholar.defaults.exam_format).toBe('markdown');
    });

    it('should handle nested object merging', () => {
      const defaultConfig = {
        scholar: {
          style: {
            tone: 'formal',
            examples: true,
          },
        },
      };

      const userConfig = {
        scholar: {
          style: {
            tone: 'conversational',
          },
        },
      };

      const merged = mergeConfig(userConfig, defaultConfig);
      expect(merged.scholar.style.tone).toBe('conversational');
      expect(merged.scholar.style.examples).toBe(true);
    });

    it('should handle array overrides', () => {
      const defaultConfig = {
        scholar: {
          defaults: {
            question_types: ['multiple-choice', 'short-answer'],
          },
        },
      };

      const userConfig = {
        scholar: {
          defaults: {
            question_types: ['essay', 'true-false'],
          },
        },
      };

      const merged = mergeConfig(userConfig, defaultConfig);
      expect(merged.scholar.defaults.question_types).toEqual([
        'essay',
        'true-false',
      ]);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = {
        scholar: {
          course_info: {
            level: 'undergraduate',
            difficulty: 'intermediate',
          },
          defaults: {
            exam_format: 'markdown',
            lecture_format: 'quarto',
          },
          style: {
            tone: 'formal',
          },
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid level', () => {
      const config = {
        scholar: {
          course_info: {
            level: 'postdoc',
          },
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid course_info.level'))).toBe(true);
    });

    it('should reject invalid difficulty', () => {
      const config = {
        scholar: {
          course_info: {
            difficulty: 'expert',
          },
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid course_info.difficulty'))).toBe(true);
    });

    it('should reject invalid exam format', () => {
      const config = {
        scholar: {
          defaults: {
            exam_format: 'pdf',
          },
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid defaults.exam_format'))).toBe(true);
    });

    it('should reject invalid tone', () => {
      const config = {
        scholar: {
          style: {
            tone: 'casual',
          },
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid style.tone'))).toBe(true);
    });

    it('should reject missing scholar section', () => {
      const config = {};

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required "scholar" section');
    });

    it('should collect multiple validation errors', () => {
      const config = {
        scholar: {
          course_info: {
            level: 'postdoc',
            difficulty: 'expert',
          },
          defaults: {
            exam_format: 'pdf',
          },
          style: {
            tone: 'casual',
          },
        },
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('loadTeachConfig', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = join(tmpdir(), `scholar-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should return defaults when no config file found', () => {
      const config = loadTeachConfig(tempDir);
      expect(config).toEqual(getDefaultConfig());
    });

    it('should load and merge config file', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "graduate"
    field: "statistics"
`
      );

      const config = loadTeachConfig(tempDir);
      expect(config.scholar.course_info.level).toBe('graduate');
      expect(config.scholar.course_info.field).toBe('statistics');
      // Should still have defaults
      expect(config.scholar.course_info.difficulty).toBe('intermediate');
    });

    it('should validate config by default', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "invalid"
`
      );

      // Should not throw in non-strict mode
      const config = loadTeachConfig(tempDir);
      expect(config).toBeDefined();
      // Should still merge with defaults despite invalid value
      expect(config.scholar).toBeDefined();
    });

    it('should throw in strict mode on validation error', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "invalid"
`
      );

      expect(() =>
        loadTeachConfig(tempDir, { strict: true })
      ).toThrow(/validation failed/);
    });

    it('should skip validation when requested', () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      const configPath = join(flowDir, 'teach-config.yml');
      writeFileSync(
        configPath,
        `scholar:
  course_info:
    level: "invalid"
`
      );

      const config = loadTeachConfig(tempDir, { validate: false });
      expect(config.scholar.course_info.level).toBe('invalid');
    });

    describe('explicit configPath option', () => {
      it('should load config from explicit path', () => {
        // Create config in a non-standard location
        const customConfigPath = join(tempDir, 'custom-config.yml');
        writeFileSync(
          customConfigPath,
          `scholar:
  course_info:
    level: "graduate"
    field: "statistics"
`
        );

        const config = loadTeachConfig(tempDir, { configPath: customConfigPath });
        expect(config.scholar.course_info.level).toBe('graduate');
        expect(config.scholar.course_info.field).toBe('statistics');
      });

      it('should bypass discovery when explicit path provided', () => {
        // Create a config in .flow directory (would be found by discovery)
        const flowDir = join(tempDir, '.flow');
        mkdirSync(flowDir, { recursive: true });
        const discoveryPath = join(flowDir, 'teach-config.yml');
        writeFileSync(
          discoveryPath,
          `scholar:
  course_info:
    level: "undergraduate"
    field: "mathematics"
`
        );

        // Create a different config in custom location
        const customConfigPath = join(tempDir, 'override-config.yml');
        writeFileSync(
          customConfigPath,
          `scholar:
  course_info:
    level: "graduate"
    field: "physics"
`
        );

        // Explicit path should take precedence over discovery
        const config = loadTeachConfig(tempDir, { configPath: customConfigPath });
        expect(config.scholar.course_info.level).toBe('graduate');
        expect(config.scholar.course_info.field).toBe('physics');
      });

      it('should return defaults for non-existent explicit path (non-strict)', () => {
        const nonExistentPath = join(tempDir, 'does-not-exist.yml');
        const config = loadTeachConfig(tempDir, { configPath: nonExistentPath });
        expect(config).toEqual(getDefaultConfig());
      });

      it('should throw for non-existent explicit path in strict mode', () => {
        const nonExistentPath = join(tempDir, 'does-not-exist.yml');
        expect(() =>
          loadTeachConfig(tempDir, { configPath: nonExistentPath, strict: true })
        ).toThrow(/Config file not found/);
      });

      it('should validate explicit config path', () => {
        const customConfigPath = join(tempDir, 'invalid-config.yml');
        writeFileSync(
          customConfigPath,
          `scholar:
  course_info:
    level: "invalid-level"
`
        );

        // Non-strict mode: should warn but not throw
        const config = loadTeachConfig(tempDir, { configPath: customConfigPath });
        expect(config.scholar.course_info.level).toBe('invalid-level');

        // Strict mode: should throw
        expect(() =>
          loadTeachConfig(tempDir, { configPath: customConfigPath, strict: true })
        ).toThrow(/validation failed/);
      });

      it('should merge explicit config with defaults', () => {
        const customConfigPath = join(tempDir, 'partial-config.yml');
        writeFileSync(
          customConfigPath,
          `scholar:
  course_info:
    field: "biology"
`
        );

        const config = loadTeachConfig(tempDir, { configPath: customConfigPath });
        // Custom value from explicit config
        expect(config.scholar.course_info.field).toBe('biology');
        // Default values should still be present
        expect(config.scholar.course_info.level).toBe('undergraduate');
        expect(config.scholar.course_info.difficulty).toBe('intermediate');
      });
    });
  });

  describe('getConfigValue', () => {
    const config = {
      scholar: {
        course_info: {
          level: 'graduate',
          field: 'statistics',
        },
        defaults: {
          exam_format: 'markdown',
        },
      },
    };

    it('should get nested value by path', () => {
      const value = getConfigValue(config, 'scholar.course_info.level');
      expect(value).toBe('graduate');
    });

    it('should return default value for missing path', () => {
      const value = getConfigValue(
        config,
        'scholar.course_info.missing',
        'default'
      );
      expect(value).toBe('default');
    });

    it('should return undefined for missing path without default', () => {
      const value = getConfigValue(config, 'scholar.missing.path');
      expect(value).toBeUndefined();
    });

    it('should handle top-level paths', () => {
      const value = getConfigValue(config, 'scholar');
      expect(value).toBe(config.scholar);
    });
  });

  describe('getCourseInfo', () => {
    it('should get course info from config', () => {
      const config = {
        scholar: {
          course_info: {
            level: 'graduate',
            field: 'statistics',
          },
        },
      };

      const courseInfo = getCourseInfo(config);
      expect(courseInfo.level).toBe('graduate');
      expect(courseInfo.field).toBe('statistics');
    });

    it('should return empty object if course_info missing', () => {
      const config = { scholar: {} };
      const courseInfo = getCourseInfo(config);
      expect(courseInfo).toEqual({});
    });
  });

  describe('getDefaults', () => {
    it('should get defaults from config', () => {
      const config = {
        scholar: {
          defaults: {
            exam_format: 'quarto',
          },
        },
      };

      const defaults = getDefaults(config);
      expect(defaults.exam_format).toBe('quarto');
    });

    it('should return empty object if defaults missing', () => {
      const config = { scholar: {} };
      const defaults = getDefaults(config);
      expect(defaults).toEqual({});
    });
  });

  describe('getStyle', () => {
    it('should get style from config', () => {
      const config = {
        scholar: {
          style: {
            tone: 'conversational',
            examples: false,
          },
        },
      };

      const style = getStyle(config);
      expect(style.tone).toBe('conversational');
      expect(style.examples).toBe(false);
    });

    it('should return empty object if style missing', () => {
      const config = { scholar: {} };
      const style = getStyle(config);
      expect(style).toEqual({});
    });
  });
});
