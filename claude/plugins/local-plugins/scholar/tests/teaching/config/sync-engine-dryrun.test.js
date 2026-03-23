/**
 * Test suite for ConfigSyncEngine dry-run mode
 *
 * Tests dry-run functionality ensuring:
 * - No files are modified in dry-run mode
 * - Change detection is accurate
 * - Diff computation works for all scenarios
 * - Integration with sync commands
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { ConfigSyncEngine } from '../../../src/teaching/config/sync-engine.js';
import { formatFileDiff, formatDryRunReport } from '../../../src/teaching/formatters/diff-formatter.js';

let TEST_DIR;

describe('ConfigSyncEngine - Dry-run Mode', () => {
  beforeEach(() => {
    // Create a unique temp directory per test (avoids process.cwd() dependency)
    TEST_DIR = mkdtempSync(join(os.tmpdir(), 'scholar-dryrun-'));
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    test('should initialize with dryRun option', () => {
      const engine = new ConfigSyncEngine({
        rootDir: TEST_DIR,
        dryRun: true
      });

      expect(engine.dryRun).toBe(true);
    });

    test('should not create cache directory in dry-run mode', () => {
      const cacheDir = join(TEST_DIR, '.scholar-cache');

      new ConfigSyncEngine({
        rootDir: TEST_DIR,
        dryRun: true,
        cacheDir
      });

      expect(existsSync(cacheDir)).toBe(false);
    });

    test('should create cache directory in normal mode', () => {
      const cacheDir = join(TEST_DIR, '.scholar-cache');

      new ConfigSyncEngine({
        rootDir: TEST_DIR,
        dryRun: false,
        cacheDir
      });

      expect(existsSync(cacheDir)).toBe(true);
    });
  });

  describe('computeChanges()', () => {
    let engine;

    beforeEach(() => {
      engine = new ConfigSyncEngine({
        rootDir: TEST_DIR,
        dryRun: true
      });
    });

    test('should detect never-synced files (JSON does not exist)', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlContent = 'week: 1\ntitle: Test';
      const yamlData = { week: 1, title: 'Test' };

      const changes = engine.computeChanges(yamlPath, jsonPath, yamlContent, yamlData);

      expect(changes.status).toBe('never-synced');
      expect(changes.added).toEqual(['week', 'title']);
      expect(changes.changed.length).toBe(0);
      expect(changes.removed.length).toBe(0);
    });

    test('should detect in-sync files (no changes)', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlContent = 'week: 1\ntitle: Test';
      const yamlData = { week: 1, title: 'Test' };
      const jsonData = { week: 1, title: 'Test' };

      // Write JSON file
      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

      const changes = engine.computeChanges(yamlPath, jsonPath, yamlContent, yamlData);

      expect(changes.status).toBe('in-sync');
      expect(changes.added.length).toBe(0);
      expect(changes.changed.length).toBe(0);
      expect(changes.removed.length).toBe(0);
    });

    test('should detect added fields', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlContent = 'week: 1\ntitle: Test\nduration: 30';
      const yamlData = { week: 1, title: 'Test', duration: 30 };
      const jsonData = { week: 1, title: 'Test' };

      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

      const changes = engine.computeChanges(yamlPath, jsonPath, yamlContent, yamlData);

      expect(changes.status).toBe('out-of-sync');
      expect(changes.added.length).toBe(1);
      expect(changes.added[0].path).toBe('duration');
      expect(changes.added[0].value).toBe(30);
    });

    test('should detect changed fields', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlContent = 'week: 1\ntitle: Updated Test';
      const yamlData = { week: 1, title: 'Updated Test' };
      const jsonData = { week: 1, title: 'Test' };

      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

      const changes = engine.computeChanges(yamlPath, jsonPath, yamlContent, yamlData);

      expect(changes.status).toBe('out-of-sync');
      expect(changes.changed.length).toBe(1);
      expect(changes.changed[0].path).toBe('title');
      expect(changes.changed[0].from).toBe('Test');
      expect(changes.changed[0].to).toBe('Updated Test');
    });

    test('should detect removed fields', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlContent = 'week: 1';
      const yamlData = { week: 1 };
      const jsonData = { week: 1, title: 'Test' };

      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

      const changes = engine.computeChanges(yamlPath, jsonPath, yamlContent, yamlData);

      expect(changes.status).toBe('out-of-sync');
      expect(changes.removed.length).toBe(1);
      expect(changes.removed[0].path).toBe('title');
      expect(changes.removed[0].value).toBe('Test');
    });

    test('should detect nested object changes', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlData = {
        week: 1,
        activity: {
          type: 'lab',
          duration: 60
        }
      };
      const jsonData = {
        week: 1,
        activity: {
          type: 'lecture',
          duration: 60
        }
      };

      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

      const changes = engine.computeChanges(yamlPath, jsonPath, '', yamlData);

      expect(changes.status).toBe('out-of-sync');
      expect(changes.changed.length).toBe(1);
      expect(changes.changed[0].path).toBe('activity.type');
      expect(changes.changed[0].from).toBe('lecture');
      expect(changes.changed[0].to).toBe('lab');
    });

    test('should detect array changes', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlData = {
        week: 1,
        topics: ['Topic A', 'Topic B', 'Topic C']
      };
      const jsonData = {
        week: 1,
        topics: ['Topic A', 'Topic B']
      };

      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

      const changes = engine.computeChanges(yamlPath, jsonPath, '', yamlData);

      expect(changes.status).toBe('out-of-sync');
      expect(changes.changed.length).toBe(1);
      expect(changes.changed[0].path).toBe('topics');
      expect(changes.changed[0].reason.includes('Array length changed')).toBeTruthy();
    });

    test('should detect type changes', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const yamlData = {
        week: 1,
        duration: '30'
      };
      const jsonData = {
        week: 1,
        duration: 30
      };

      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

      const changes = engine.computeChanges(yamlPath, jsonPath, '', yamlData);

      expect(changes.status).toBe('out-of-sync');
      expect(changes.changed.length).toBe(1);
      expect(changes.changed[0].path).toBe('duration');
      expect(changes.changed[0].fromType).toBe('number');
      expect(changes.changed[0].toType).toBe('string');
    });
  });

  describe('syncFile() - Dry-run Mode', () => {
    let engine;

    beforeEach(() => {
      engine = new ConfigSyncEngine({
        rootDir: TEST_DIR,
        dryRun: true
      });
    });

    test('should not write JSON file in dry-run mode', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');

      writeFileSync(yamlPath, 'week: 1\ntitle: Test');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(existsSync(jsonPath)).toBe(false);
    });

    test('should not update hash cache in dry-run mode', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const cacheFile = engine.getCacheFilePath(yamlPath);

      writeFileSync(yamlPath, 'week: 1\ntitle: Test');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(existsSync(cacheFile)).toBe(false);
    });

    test('should return changes in dry-run result', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');

      writeFileSync(yamlPath, 'week: 1\ntitle: Test');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.changes).toBeTruthy();
      expect(result.changes.status).toBe('never-synced');
      expect(result.message).toBe('Dry-run mode: No files modified');
    });

    test('should show in-sync status for unchanged files', () => {
      const yamlPath = join(TEST_DIR, 'test.yml');
      const jsonPath = join(TEST_DIR, 'test.json');
      const data = { week: 1, title: 'Test' };

      writeFileSync(yamlPath, 'week: 1\ntitle: Test');
      writeFileSync(jsonPath, JSON.stringify(data, null, 2));

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.changes.status).toBe('in-sync');
    });
  });

  describe('syncAll() - Dry-run Mode', () => {
    let engine;

    beforeEach(() => {
      engine = new ConfigSyncEngine({
        rootDir: TEST_DIR,
        dryRun: true
      });

      // Create test files
      mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'content', 'lesson-plans', 'week01.yml'), 'week: 1\ntitle: Week 1');
      writeFileSync(join(TEST_DIR, 'content', 'lesson-plans', 'week02.yml'), 'week: 2\ntitle: Week 2');
    });

    test('should not write any JSON files in dry-run mode', async () => {
      const results = await engine.syncAll({
        patterns: ['content/lesson-plans/**/*.yml']
      });

      expect(results.length).toBe(2);
      expect(results.every(r => r.dryRun)).toBe(true);
      expect(existsSync(join(TEST_DIR, 'content', 'lesson-plans', 'week01.json'))).toBe(false);
      expect(existsSync(join(TEST_DIR, 'content', 'lesson-plans', 'week02.json'))).toBe(false);
    });

    test('should return changes for all files', async () => {
      const results = await engine.syncAll({
        patterns: ['content/lesson-plans/**/*.yml']
      });

      expect(results.length).toBe(2);
      expect(results.every(r => r.changes)).toBeTruthy();
      expect(results.every(r => r.changes.status === 'never-synced')).toBeTruthy();
    });
  });

  describe('Diff Formatter Integration', () => {
    test('should format file diff for never-synced file', () => {
      const changes = {
        status: 'never-synced',
        added: ['week', 'title'],
        changed: [],
        removed: [],
        unchanged: []
      };

      const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

      expect(output.includes('test.yml')).toBeTruthy();
      expect(output.includes('test.json')).toBeTruthy();
      expect(output.includes('never synced')).toBeTruthy();
    });

    test('should format file diff for out-of-sync file', () => {
      const changes = {
        status: 'out-of-sync',
        added: [{ path: 'duration', value: 30 }],
        changed: [{ path: 'title', from: 'Old', to: 'New' }],
        removed: [{ path: 'deprecated', value: 'value' }],
        unchanged: []
      };

      const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

      expect(output.includes('+')).toBeTruthy();
      expect(output.includes('~')).toBeTruthy();
      expect(output.includes('-')).toBeTruthy();
      expect(output.includes('duration')).toBeTruthy();
      expect(output.includes('title')).toBeTruthy();
      expect(output.includes('deprecated')).toBeTruthy();
    });

    test('should format dry-run report with multiple files', () => {
      const results = [
        {
          success: true,
          yamlPath: 'week01.yml',
          jsonPath: 'week01.json',
          dryRun: true,
          changes: {
            status: 'in-sync',
            added: [],
            changed: [],
            removed: [],
            unchanged: ['week', 'title']
          }
        },
        {
          success: true,
          yamlPath: 'week02.yml',
          jsonPath: 'week02.json',
          dryRun: true,
          changes: {
            status: 'out-of-sync',
            added: [{ path: 'duration', value: 30 }],
            changed: [],
            removed: [],
            unchanged: []
          }
        }
      ];

      const output = formatDryRunReport(results, { color: false });

      expect(output.includes('Dry-run mode')).toBeTruthy();
      expect(output.includes('week01.yml')).toBeTruthy();
      expect(output.includes('week02.yml')).toBeTruthy();
      expect(output.includes('Summary')).toBeTruthy();
      expect(output.includes('Run without --dry-run')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    let engine;

    beforeEach(() => {
      engine = new ConfigSyncEngine({
        rootDir: TEST_DIR,
        dryRun: true
      });
    });

    test('should handle YAML parse errors in dry-run mode', () => {
      const yamlPath = join(TEST_DIR, 'invalid.yml');

      writeFileSync(yamlPath, 'invalid: :\n  bad indentation');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.includes('YAML syntax error')).toBeTruthy();
    });

    test('should handle empty YAML files in dry-run mode', () => {
      const yamlPath = join(TEST_DIR, 'empty.yml');

      writeFileSync(yamlPath, '# Just a comment');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.includes('empty')).toBeTruthy();
    });

    test('should handle missing YAML files in dry-run mode', () => {
      const yamlPath = join(TEST_DIR, 'missing.yml');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.includes('not found')).toBeTruthy();
    });
  });
});
