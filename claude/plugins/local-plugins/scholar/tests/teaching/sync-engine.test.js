/**
 * Unit Tests for Sync Engine
 *
 * Tests YAML → JSON synchronization, hash caching, and error handling.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigSyncEngine, createSyncEngine, syncFile, syncAll } from '../../src/teaching/config/sync-engine.js';

describe('ConfigSyncEngine', () => {
  let tempDir;
  let engine;

  beforeEach(() => {
    tempDir = join(tmpdir(), `sync-engine-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    engine = new ConfigSyncEngine({ rootDir: tempDir });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create engine with default options', () => {
      const engine = new ConfigSyncEngine();
      expect(engine.rootDir).toBe(process.cwd());
    });

    it('should accept custom rootDir', () => {
      expect(engine.rootDir).toBe(tempDir);
    });

    it('should create cache directory', () => {
      expect(existsSync(join(tempDir, '.scholar-cache'))).toBe(true);
    });

    it('should accept custom cache directory', () => {
      const customCache = join(tempDir, 'custom-cache');
      const _engine = new ConfigSyncEngine({ rootDir: tempDir, cacheDir: customCache });
      expect(existsSync(customCache)).toBe(true);
    });
  });

  describe('syncFile', () => {
    it('should sync YAML to JSON', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(
        yamlPath,
        `name: test
value: 123
nested:
  key: value
`
      );

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result.yamlPath).toBe(yamlPath);
      expect(result.jsonPath).toBe(yamlPath.replace('.yml', '.json'));
      expect(existsSync(result.jsonPath)).toBe(true);

      // Verify JSON content
      const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
      expect(json.name).toBe('test');
      expect(json.value).toBe(123);
      expect(json.nested.key).toBe('value');
    });

    it('should handle .yaml extension', () => {
      const yamlPath = join(tempDir, 'config.yaml');
      writeFileSync(yamlPath, 'test: true');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result.jsonPath).toBe(yamlPath.replace('.yaml', '.json'));
      expect(existsSync(result.jsonPath)).toBe(true);
    });

    it('should return error for non-existent file', () => {
      const result = engine.syncFile(join(tempDir, 'missing.yml'));

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should throw in strict mode for non-existent file', () => {
      const strictEngine = new ConfigSyncEngine({ rootDir: tempDir, strict: true });

      expect(() => strictEngine.syncFile(join(tempDir, 'missing.yml'))).toThrow(/not found/);
    });

    it('should return error for empty YAML file', () => {
      const yamlPath = join(tempDir, 'empty.yml');
      writeFileSync(yamlPath, '');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should return error for comment-only YAML file', () => {
      const yamlPath = join(tempDir, 'comments.yml');
      writeFileSync(yamlPath, '# just a comment\n# another comment');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should return error for malformed YAML', () => {
      const yamlPath = join(tempDir, 'malformed.yml');
      writeFileSync(yamlPath, 'invalid: yaml: syntax: {{{{');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('YAML syntax error');
    });

    it('should measure duration', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'test: true');

      const result = engine.syncFile(yamlPath);

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeLessThan(1000); // Should be fast
    });

    it('should complete within 100ms target', () => {
      const yamlPath = join(tempDir, 'config.yml');
      // Create a moderately complex YAML file
      writeFileSync(
        yamlPath,
        `
learning_objectives:
  - id: LO1
    text: "Understand linear regression"
    bloom_level: understand
  - id: LO2
    text: "Apply regression to data"
    bloom_level: apply
  - id: LO3
    text: "Interpret coefficients"
    bloom_level: analyze

topics:
  - name: "Introduction"
    duration: 15
    activities:
      - lecture: 10
      - discussion: 5
  - name: "Regression Basics"
    duration: 25
    activities:
      - lecture: 15
      - example: 10
`
      );

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(100); // < 100ms target
    });
  });

  describe('hash-based caching', () => {
    it('should skip unchanged files', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'test: true');

      // First sync
      const result1 = engine.syncFile(yamlPath);
      expect(result1.success).toBe(true);
      expect(result1.skipped).toBeUndefined();

      // Second sync (same content)
      const result2 = engine.syncFile(yamlPath);
      expect(result2.success).toBe(true);
      expect(result2.skipped).toBe(true);
    });

    it('should re-sync when content changes', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'version: 1');

      // First sync
      const result1 = engine.syncFile(yamlPath);
      expect(result1.success).toBe(true);
      expect(result1.skipped).toBeUndefined();

      // Change content
      writeFileSync(yamlPath, 'version: 2');

      // Second sync (content changed)
      const result2 = engine.syncFile(yamlPath);
      expect(result2.success).toBe(true);
      expect(result2.skipped).toBeUndefined();

      // Verify JSON updated
      const json = JSON.parse(readFileSync(result2.jsonPath, 'utf8'));
      expect(json.version).toBe(2);
    });

    it('should force sync when force option is true', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'test: true');

      // First sync
      engine.syncFile(yamlPath);

      // Force sync (same content but forced)
      const result = engine.syncFile(yamlPath, { force: true });
      expect(result.success).toBe(true);
      expect(result.skipped).toBeUndefined();
    });

    it('should clear cache for specific file', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'test: true');

      // Sync to create cache
      engine.syncFile(yamlPath);

      // Clear cache
      engine.clearCache(yamlPath);

      // Sync again (should not be skipped)
      const result = engine.syncFile(yamlPath);
      expect(result.success).toBe(true);
      expect(result.skipped).toBeUndefined();
    });

    it('should clear all cache', () => {
      const yaml1 = join(tempDir, 'config1.yml');
      const yaml2 = join(tempDir, 'config2.yml');
      writeFileSync(yaml1, 'test: 1');
      writeFileSync(yaml2, 'test: 2');

      // Sync both
      engine.syncFile(yaml1);
      engine.syncFile(yaml2);

      // Clear all cache
      engine.clearCache();

      // Both should sync again
      const result1 = engine.syncFile(yaml1);
      const result2 = engine.syncFile(yaml2);
      expect(result1.skipped).toBeUndefined();
      expect(result2.skipped).toBeUndefined();
    });
  });

  describe('syncAll', () => {
    it('should sync multiple files', async () => {
      // Create directory structure
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });

      writeFileSync(join(lessonPlans, 'week01.yml'), 'week: 1');
      writeFileSync(join(lessonPlans, 'week02.yml'), 'week: 2');
      writeFileSync(join(lessonPlans, 'week03.yml'), 'week: 3');

      const results = await engine.syncAll({
        patterns: ['content/lesson-plans/*.yml']
      });

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should use default patterns', async () => {
      // Create directories
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      const claude = join(tempDir, '.claude');
      mkdirSync(lessonPlans, { recursive: true });
      mkdirSync(claude, { recursive: true });

      writeFileSync(join(lessonPlans, 'week01.yml'), 'week: 1');
      writeFileSync(join(claude, 'style.yml'), 'tone: formal');

      const results = await engine.syncAll();

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle empty directory', async () => {
      const results = await engine.syncAll({
        patterns: ['nonexistent/**/*.yml']
      });

      expect(results).toHaveLength(0);
    });
  });

  describe('getSyncStatus', () => {
    it('should return missing status for non-existent file', () => {
      const status = engine.getSyncStatus(join(tempDir, 'missing.yml'));
      expect(status.status).toBe('missing');
      expect(status.yamlExists).toBe(false);
    });

    it('should return never-synced status for new file', () => {
      const yamlPath = join(tempDir, 'new.yml');
      writeFileSync(yamlPath, 'test: true');

      const status = engine.getSyncStatus(yamlPath);
      expect(status.status).toBe('never-synced');
      expect(status.yamlExists).toBe(true);
      expect(status.jsonExists).toBe(false);
    });

    it('should return in-sync status after sync', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'test: true');
      engine.syncFile(yamlPath);

      const status = engine.getSyncStatus(yamlPath);
      expect(status.status).toBe('in-sync');
      expect(status.inSync).toBe(true);
    });

    it('should return out-of-sync status when content changes', () => {
      const yamlPath = join(tempDir, 'config.yml');
      writeFileSync(yamlPath, 'version: 1');
      engine.syncFile(yamlPath);

      // Change content without syncing
      writeFileSync(yamlPath, 'version: 2');

      const status = engine.getSyncStatus(yamlPath);
      expect(status.status).toBe('out-of-sync');
      expect(status.inSync).toBe(false);
    });
  });

  describe('getJsonPath', () => {
    it('should convert .yml to .json', () => {
      expect(engine.getJsonPath('/path/to/file.yml')).toBe('/path/to/file.json');
    });

    it('should convert .yaml to .json', () => {
      expect(engine.getJsonPath('/path/to/file.yaml')).toBe('/path/to/file.json');
    });

    it('should handle uppercase extension', () => {
      expect(engine.getJsonPath('/path/to/file.YML')).toBe('/path/to/file.json');
    });
  });

  describe('nested directories', () => {
    it('should create output directory if needed', () => {
      const deepPath = join(tempDir, 'a', 'b', 'c', 'config.yml');
      mkdirSync(join(tempDir, 'a', 'b', 'c'), { recursive: true });
      writeFileSync(deepPath, 'test: true');

      const result = engine.syncFile(deepPath);

      expect(result.success).toBe(true);
      expect(existsSync(result.jsonPath)).toBe(true);
    });
  });

  describe('Unicode and special characters', () => {
    it('should handle Unicode content', () => {
      const yamlPath = join(tempDir, 'unicode.yml');
      writeFileSync(
        yamlPath,
        `
title: "Análisis Estadístico"
instructor: "Dra. María García"
notation: "統計表記"
`
      );

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);

      const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
      expect(json.title).toBe('Análisis Estadístico');
      expect(json.instructor).toBe('Dra. María García');
      expect(json.notation).toBe('統計表記');
    });
  });

  describe('complex YAML features', () => {
    it('should handle arrays', () => {
      const yamlPath = join(tempDir, 'arrays.yml');
      writeFileSync(
        yamlPath,
        `
topics:
  - "Introduction"
  - "Main Content"
  - "Conclusion"
`
      );

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
      expect(json.topics).toEqual(['Introduction', 'Main Content', 'Conclusion']);
    });

    it('should handle nested objects', () => {
      const yamlPath = join(tempDir, 'nested.yml');
      writeFileSync(
        yamlPath,
        `
course:
  info:
    name: "STAT 440"
    level: "undergraduate"
  schedule:
    start: "2026-01-15"
    end: "2026-05-15"
`
      );

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
      expect(json.course.info.name).toBe('STAT 440');
      expect(json.course.schedule.start).toBe('2026-01-15');
    });

    it('should handle multiline strings', () => {
      const yamlPath = join(tempDir, 'multiline.yml');
      writeFileSync(
        yamlPath,
        `
description: |
  This is a multi-line
  description that spans
  several lines.
`
      );

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
      expect(json.description).toContain('multi-line');
      expect(json.description).toContain('several lines');
    });

    it('should handle anchors and aliases', () => {
      const yamlPath = join(tempDir, 'anchors.yml');
      writeFileSync(
        yamlPath,
        `
defaults: &defaults
  duration: 50
  format: lecture

week1:
  <<: *defaults
  topic: "Introduction"

week2:
  <<: *defaults
  topic: "Basics"
`
      );

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
      expect(json.week1.duration).toBe(50);
      expect(json.week2.duration).toBe(50);
      expect(json.week1.topic).toBe('Introduction');
      expect(json.week2.topic).toBe('Basics');
    });
  });
});

describe('Convenience functions', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = join(tmpdir(), `sync-convenience-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('createSyncEngine should return engine instance', () => {
    const engine = createSyncEngine({ rootDir: tempDir });
    expect(engine).toBeInstanceOf(ConfigSyncEngine);
  });

  it('syncFile should sync single file', () => {
    const yamlPath = join(tempDir, 'config.yml');
    writeFileSync(yamlPath, 'test: true');

    const result = syncFile(yamlPath);

    expect(result.success).toBe(true);
  });

  it('syncAll should sync all files in directory', async () => {
    const lessonPlans = join(tempDir, 'content', 'lesson-plans');
    mkdirSync(lessonPlans, { recursive: true });
    writeFileSync(join(lessonPlans, 'week01.yml'), 'week: 1');

    const results = await syncAll(tempDir, {
      patterns: ['content/lesson-plans/*.yml']
    });

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
  });
});
