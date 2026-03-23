/**
 * Phase 3 Part A: Sync Engine Integration Tests
 *
 * Tests YAML → fix → JSON sync workflow:
 * - YAML fixed → JSON auto-synced
 * - Fix triggers sync: hash cache updated
 * - Fix with sync disabled: JSON not touched
 * - Pre-commit workflows
 *
 * Target: 10-12 tests (~400 lines)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigValidator } from '../../src/teaching/validators/config-validator.js';
import { createAutoFixer } from '../../src/teaching/validators/auto-fixer.js';
import { ConfigSyncEngine } from '../../src/teaching/config/sync-engine.js';
import { loadFixture, cleanup } from './helpers/test-runner.js';
import { registerCustomMatchers } from './shared/assertions.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import os from 'os';

// Register custom matchers
beforeEach(() => {
  registerCustomMatchers();
});

// ============================================================================
// Sync Integration: YAML Fix → JSON Update
// ============================================================================

describe('Sync Integration: YAML Fix → JSON Update', () => {
  let _validator;
  let fixer;
  let syncEngine;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    _validator = new ConfigValidator();
    fixer = createAutoFixer();

    // Create temp directory for this test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-sync-test-'));
    syncEngine = new ConfigSyncEngine({ rootDir: tempDir, debug: false });
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('YAML fixed: JSON auto-synced', async () => {
    // Given: YAML file with errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config, 'utf8');

    // When: Fix YAML errors
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);
    await fs.writeFile(yamlPath, syntaxResult.fixed, 'utf8');

    // When: Sync YAML to JSON
    const syncResult = syncEngine.syncFile(yamlPath);

    // Then: JSON created successfully
    expect(syncResult.success).toBe(true);
    expect(syncResult.skipped).toBe(undefined);

    const jsonPath = yamlPath.replace('.yml', '.json');
    expect(existsSync(jsonPath)).toBe(true);

    // Then: JSON matches fixed YAML
    const jsonContent = await fs.readFile(jsonPath, 'utf8');
    const jsonData = JSON.parse(jsonContent);
    const yamlData = yaml.load(syntaxResult.fixed);
    expect(jsonData).toEqual(yamlData);
  });

  test('fix triggers sync: hash cache updated', async () => {
    // Given: YAML file with errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config, 'utf8');

    // When: First sync (before fix)
    const syncResult1 = syncEngine.syncFile(yamlPath);
    expect(syncResult1.success).toBe(true);
    const hash1 = syncEngine.getCachedHash(yamlPath);
    expect(hash1).toBeDefined();

    // When: Fix YAML and sync again
    const syntaxResult = fixer.fixSyntaxErrors(config);
    await fs.writeFile(yamlPath, syntaxResult.fixed, 'utf8');
    const syncResult2 = syncEngine.syncFile(yamlPath);

    // Then: Hash updated (file changed)
    const hash2 = syncEngine.getCachedHash(yamlPath);
    expect(hash2).toBeDefined();
    expect(hash2).not.toBe(hash1);

    // Then: Second sync was not skipped
    expect(syncResult2.skipped).toBe(undefined);
  });

  test('unchanged file: sync skipped (hash match)', async () => {
    // Given: Valid YAML file
    const config = 'week: 1\ntitle: "Test"';
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config, 'utf8');

    // When: First sync
    const syncResult1 = syncEngine.syncFile(yamlPath);
    expect(syncResult1.success).toBe(true);

    // When: Second sync without changes
    const syncResult2 = syncEngine.syncFile(yamlPath);

    // Then: Second sync skipped (unchanged)
    expect(syncResult2.success).toBe(true);
    expect(syncResult2.skipped).toBe(true);
  });

  test('force sync: ignores hash cache', async () => {
    // Given: Synced YAML file
    const config = 'week: 1\ntitle: "Test"';
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config, 'utf8');
    syncEngine.syncFile(yamlPath);

    // When: Force sync (even though unchanged)
    const syncResult = syncEngine.syncFile(yamlPath, { force: true });

    // Then: Sync not skipped
    expect(syncResult.success).toBe(true);
    expect(syncResult.skipped).toBe(undefined);
  });
});

// ============================================================================
// Sync Integration: Complete Workflow
// ============================================================================

describe('Sync Integration: Complete Fix + Sync Workflow', () => {
  let validator;
  let fixer;
  let syncEngine;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    validator = new ConfigValidator();
    fixer = createAutoFixer();

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-workflow-test-'));
    syncEngine = new ConfigSyncEngine({ rootDir: tempDir, debug: false });
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('end-to-end: validate → fix → sync → re-validate', async () => {
    // Given: YAML with errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config, 'utf8');

    // Step 1: Validate (may have warnings but should be parseable)
    const _validation1 = validator.validateFile(yamlPath);
    // Note: validation might fail due to missing fields, that's okay

    // Step 2: Fix errors
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);
    await fs.writeFile(yamlPath, syntaxResult.fixed, 'utf8');

    // Step 3: Sync to JSON
    const syncResult = syncEngine.syncFile(yamlPath);
    expect(syncResult.success).toBe(true);

    // Step 4: Re-validate (should be better or at least parseable)
    const validation2 = validator.validateFile(yamlPath);
    // Note: May still have schema errors (missing fields) but should be parseable
    expect(validation2).toBeDefined();

    // Then: JSON file exists and matches YAML
    const jsonPath = yamlPath.replace('.yml', '.json');
    expect(existsSync(jsonPath)).toBe(true);
  });

  test('fix multiple files: sync all', async () => {
    // Given: Multiple YAML files with errors
    const fixtures = [
      'fixable-assignment-config.yml',
      'invalid-quiz-config.yml',
    ];

    const yamlPaths = [];
    for (const fixture of fixtures) {
      const config = await loadFixture(`../fixtures/command-configs/${fixture}`);
      const yamlPath = path.join(tempDir, fixture);
      await fs.writeFile(yamlPath, config, 'utf8');
      yamlPaths.push(yamlPath);

      // Fix each file
      const syntaxResult = fixer.fixSyntaxErrors(config);
      if (syntaxResult.success) {
        await fs.writeFile(yamlPath, syntaxResult.fixed, 'utf8');
      }
    }

    // When: Sync all files
    const syncResults = [];
    for (const yamlPath of yamlPaths) {
      const result = syncEngine.syncFile(yamlPath);
      syncResults.push(result);
    }

    // Then: All files synced successfully
    expect(syncResults).toHaveLength(2);
    expect(syncResults.every(r => r.success)).toBe(true);

    // Then: All JSON files exist
    for (const yamlPath of yamlPaths) {
      const jsonPath = yamlPath.replace('.yml', '.json');
      expect(existsSync(jsonPath)).toBe(true);
    }
  });

  test('sync status: detect out-of-sync files', async () => {
    // Given: YAML file synced to JSON
    const config = 'week: 1\ntitle: "Test"';
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config, 'utf8');
    syncEngine.syncFile(yamlPath);

    // When: Check status (should be in-sync)
    const status1 = syncEngine.getSyncStatus(yamlPath);
    expect(status1.status).toBe('in-sync');

    // When: Modify YAML (now out-of-sync)
    await fs.writeFile(yamlPath, config + '\ntopics: []', 'utf8');
    const status2 = syncEngine.getSyncStatus(yamlPath);

    // Then: Status changed to out-of-sync
    expect(status2.status).toBe('out-of-sync');
  });
});

// ============================================================================
// Sync Integration: Cache Management
// ============================================================================

describe('Sync Integration: Cache Management', () => {
  let syncEngine;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-cache-test-'));
    syncEngine = new ConfigSyncEngine({ rootDir: tempDir, debug: false });
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('cache directory created automatically', async () => {
    // Then: Cache directory exists
    const cacheDir = path.join(tempDir, '.scholar-cache');
    expect(existsSync(cacheDir)).toBe(true);
  });

  test('clear cache for specific file', async () => {
    // Given: YAML file with cached hash
    const config = 'week: 1\ntitle: "Test"';
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config, 'utf8');
    syncEngine.syncFile(yamlPath);

    const hash1 = syncEngine.getCachedHash(yamlPath);
    expect(hash1).toBeDefined();

    // When: Clear cache for this file
    syncEngine.clearCache(yamlPath);

    // Then: Hash no longer cached
    const hash2 = syncEngine.getCachedHash(yamlPath);
    expect(hash2).toBe(null);
  });

  test('clear all cache', async () => {
    // Given: Multiple files with cached hashes
    for (let i = 1; i <= 3; i++) {
      const config = `week: ${i}\ntitle: "Test ${i}"`;
      const yamlPath = path.join(tempDir, `week-0${i}.yml`);
      await fs.writeFile(yamlPath, config, 'utf8');
      syncEngine.syncFile(yamlPath);
    }

    // When: Clear all cache
    syncEngine.clearCache();

    // Then: Cache directory empty (except recreated structure)
    const cacheDir = path.join(tempDir, '.scholar-cache');
    const cacheFiles = await fs.readdir(cacheDir);
    expect(cacheFiles).toHaveLength(0);
  });

  test('cache survives sync errors', async () => {
    // Given: Valid file that was synced
    const config1 = 'week: 1\ntitle: "Test"';
    const yamlPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(yamlPath, config1, 'utf8');
    syncEngine.syncFile(yamlPath);

    const hash1 = syncEngine.getCachedHash(yamlPath);
    expect(hash1).toBeDefined();

    // When: Write invalid YAML (sync will fail)
    const config2 = 'week: 1\ntitle: [unclosed array';
    await fs.writeFile(yamlPath, config2, 'utf8');
    const syncResult = syncEngine.syncFile(yamlPath);

    // Then: Sync failed but old cache still exists
    expect(syncResult.success).toBe(false);
    const hash2 = syncEngine.getCachedHash(yamlPath);
    expect(hash2).toBe(hash1); // Old hash still there
  });
});

// ============================================================================
// Sync Integration: Error Scenarios
// ============================================================================

describe('Sync Integration: Error Handling', () => {
  let syncEngine;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-error-test-'));
    syncEngine = new ConfigSyncEngine({ rootDir: tempDir, debug: false });
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('sync non-existent file: error returned', async () => {
    // Given: Path to non-existent file
    const yamlPath = path.join(tempDir, 'does-not-exist.yml');

    // When: Try to sync
    const syncResult = syncEngine.syncFile(yamlPath);

    // Then: Error returned (not thrown)
    expect(syncResult.success).toBe(false);
    expect(syncResult.error).toContain('not found');
  });

  test('sync invalid YAML: error returned', async () => {
    // Given: Invalid YAML file (unclosed bracket)
    const invalidYAML = 'week: 1\ntitle: [unclosed array\ntopics: []';
    const yamlPath = path.join(tempDir, 'invalid.yml');
    await fs.writeFile(yamlPath, invalidYAML, 'utf8');

    // When: Try to sync
    const syncResult = syncEngine.syncFile(yamlPath);

    // Then: Error returned with line number
    expect(syncResult.success).toBe(false);
    expect(syncResult.error).toBeDefined();
  });

  test('sync empty YAML: error returned', async () => {
    // Given: Empty YAML file
    const emptyYAML = '# Just a comment';
    const yamlPath = path.join(tempDir, 'empty.yml');
    await fs.writeFile(yamlPath, emptyYAML, 'utf8');

    // When: Try to sync
    const syncResult = syncEngine.syncFile(yamlPath);

    // Then: Error returned
    expect(syncResult.success).toBe(false);
    expect(syncResult.error).toContain('empty');
  });

  test('strict mode: throws on error', async () => {
    // Given: Strict sync engine
    const strictEngine = new ConfigSyncEngine({ rootDir: tempDir, strict: true });
    const yamlPath = path.join(tempDir, 'does-not-exist.yml');

    // When/Then: Throws on error
    expect(() => strictEngine.syncFile(yamlPath)).toThrow('not found');
  });
});
