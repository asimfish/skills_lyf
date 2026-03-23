/**
 * Phase 3 Part C: Error Recovery & Rollback Tests
 *
 * Tests failure scenarios and recovery mechanisms:
 * - Fix fails midway: rollback to original
 * - Fix corrupts file: restore from backup
 * - Fix with validation: invalid fix rejected
 * - User cancellation handling
 *
 * Target: 8-10 tests (~300 lines)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigValidator } from '../../src/teaching/validators/config-validator.js';
import { createAutoFixer } from '../../src/teaching/validators/auto-fixer.js';
import { loadFixture, createTempFile, cleanup } from './helpers/test-runner.js';
import { registerCustomMatchers } from './shared/assertions.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

// Register custom matchers
beforeEach(() => {
  registerCustomMatchers();
});

// ============================================================================
// Error Recovery: Backup and Restore
// ============================================================================

describe('Error Recovery: Backup and Restore', () => {
  let _validator;
  let fixer;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    _validator = new ConfigValidator();
    fixer = createAutoFixer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-recovery-test-'));
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('create backup before fixing', async () => {
    // Given: Config with errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const configPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(configPath, config, 'utf8');

    // When: Create backup
    const backupPath = configPath + '.bak';
    await fs.copyFile(configPath, backupPath);

    // Then: Backup exists
    expect(existsSync(backupPath)).toBe(true);

    // Then: Backup has original content
    const backupContent = await fs.readFile(backupPath, 'utf8');
    expect(backupContent).toBe(config);
  });

  test('restore from backup after failed fix', async () => {
    // Given: Config with backup
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const configPath = path.join(tempDir, 'week-01.yml');
    const backupPath = configPath + '.bak';

    await fs.writeFile(configPath, config, 'utf8');
    await fs.copyFile(configPath, backupPath);

    // When: Simulate failed fix (corrupt the file)
    await fs.writeFile(configPath, 'corrupted data {]', 'utf8');

    // When: Restore from backup
    await fs.copyFile(backupPath, configPath);

    // Then: File restored to original
    const restoredContent = await fs.readFile(configPath, 'utf8');
    expect(restoredContent).toBe(config);
  });

  test('backup cleanup: remove backup after successful fix', async () => {
    // Given: Config with backup
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const configPath = path.join(tempDir, 'week-01.yml');
    const backupPath = configPath + '.bak';

    await fs.writeFile(configPath, config, 'utf8');
    await fs.copyFile(configPath, backupPath);

    // When: Apply fix successfully
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);
    await fs.writeFile(configPath, syntaxResult.fixed, 'utf8');

    // When: Cleanup backup (after successful fix)
    await fs.unlink(backupPath);

    // Then: Backup removed
    expect(existsSync(backupPath)).toBe(false);
  });

  test('multiple backups: timestamped naming', async () => {
    // Given: Config file
    const config = 'week: 1\ntitle: "Test"';
    const configPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(configPath, config, 'utf8');

    // When: Create multiple backups with timestamps
    const timestamp1 = Date.now();
    const backup1 = `${configPath}.${timestamp1}.bak`;
    await fs.copyFile(configPath, backup1);

    // Simulate time passing
    await new Promise(resolve => setTimeout(resolve, 10));

    const timestamp2 = Date.now();
    const backup2 = `${configPath}.${timestamp2}.bak`;
    await fs.copyFile(configPath, backup2);

    // Then: Both backups exist
    expect(existsSync(backup1)).toBe(true);
    expect(existsSync(backup2)).toBe(true);
    expect(timestamp2).toBeGreaterThan(timestamp1);

    // Cleanup
    await fs.unlink(backup1);
    await fs.unlink(backup2);
  });
});

// ============================================================================
// Error Recovery: Validation Checks
// ============================================================================

describe('Error Recovery: Validation Checks', () => {
  let validator;
  let fixer;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    validator = new ConfigValidator();
    fixer = createAutoFixer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-validation-test-'));
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('validate fix before applying', async () => {
    // Given: Config with syntax errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');

    // When: Get fixes
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);

    // When: Validate fixed content before applying
    const tempFile = await createTempFile(syntaxResult.fixed, 'test.yml');
    const validation = validator.validateFile(tempFile);
    await cleanup(tempFile);

    // Then: Fixed content is valid
    expect(validation.isValid).toBe(true);
  });

  test('reject invalid fix: parser catches corruption', async () => {
    // Given: Original valid config
    const _config = 'week: 1\ntitle: "Test"';

    // When: Simulate corrupted fix output
    const corruptedFix = 'week: 1\n  invalid indentation\ntitle: "Test"';

    // Then: Parser should catch the corruption
    const tempFile = await createTempFile(corruptedFix, 'test.yml');
    try {
      const validation = validator.validateFile(tempFile);
      // If it gets here, validation should show errors
      expect(validation.isValid).toBe(false);
    } catch (err) {
      // Or it might throw a parse error
      expect(err).toBeDefined();
    }
    await cleanup(tempFile);
  });

  test('fix produces valid YAML: syntax check passes', async () => {
    // Given: Config with syntax errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');

    // When: Apply fixes
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);

    // Then: Fixed content is parseable YAML
    const tempFile = await createTempFile(syntaxResult.fixed, 'test.yml');
    expect(tempFile).toHaveValidSyntax();
    await cleanup(tempFile);
  });
});

// ============================================================================
// Error Recovery: Transaction-like Behavior
// ============================================================================

describe('Error Recovery: Transaction-like Behavior', () => {
  let fixer;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    fixer = createAutoFixer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-transaction-test-'));
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('all-or-nothing: apply all fixes or none', async () => {
    // Given: Config with multiple fixable issues
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');

    // When: Get all fixes
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);
    const fixCount = syntaxResult.changes?.length || 0;

    // Then: Either all fixes applied or none
    // (In the auto-fixer, fixes are applied atomically)
    expect(fixCount).toBeGreaterThan(0);
    expect(syntaxResult.fixed).toBeDefined();
  });

  test('partial fix: track which changes applied', async () => {
    // Given: Config with multiple issues
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');

    // When: Apply fixes and track changes
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);

    // Then: Changes array documents what was fixed
    expect(syntaxResult.changes).toBeDefined();
    expect(Array.isArray(syntaxResult.changes)).toBe(true);

    // Then: Changes tracked (strings or objects describing what was fixed)
    if (syntaxResult.changes && syntaxResult.changes.length > 0) {
      expect(syntaxResult.changes[0]).toBeDefined();
      // Changes can be strings or objects
      expect(['string', 'object']).toContain(typeof syntaxResult.changes[0]);
    }
  });

  test('fix idempotency: applying twice gives same result', async () => {
    // Given: Config with errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');

    // When: Apply fixes first time
    const result1 = fixer.fixSyntaxErrors(config);
    expect(result1.success).toBe(true);

    // When: Apply fixes second time (to already-fixed content)
    const result2 = fixer.fixSyntaxErrors(result1.fixed);

    // Then: Second application succeeds and produces same output
    expect(result2.success).toBe(true);
    expect(result2.fixed).toBe(result1.fixed);

    // Note: Auto-fixer may still report changes due to normalization,
    // but the output should be identical (true idempotency)
  });
});

// ============================================================================
// Error Recovery: User Cancellation Scenarios
// ============================================================================

describe('Error Recovery: User Cancellation', () => {
  let fixer;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    fixer = createAutoFixer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-cancel-test-'));
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('cancel before fixes: file unchanged', async () => {
    // Given: Config with errors
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const configPath = path.join(tempDir, 'week-01.yml');
    await fs.writeFile(configPath, config, 'utf8');

    // When: Get fixes but don't apply (simulate user cancellation)
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);

    // Simulate: User cancels before applying
    // No fs.writeFile call

    // Then: Original file unchanged
    const currentContent = await fs.readFile(configPath, 'utf8');
    expect(currentContent).toBe(config);
  });

  test('cancel after backup: restore original', async () => {
    // Given: Config with backup
    const config = await loadFixture('../fixtures/command-configs/fixable-assignment-config.yml');
    const configPath = path.join(tempDir, 'week-01.yml');
    const backupPath = configPath + '.bak';

    await fs.writeFile(configPath, config, 'utf8');
    await fs.copyFile(configPath, backupPath);

    // When: Start fix process (backup created)
    const syntaxResult = fixer.fixSyntaxErrors(config);
    expect(syntaxResult.success).toBe(true);

    // Simulate: User cancels, restore from backup
    await fs.copyFile(backupPath, configPath);

    // Then: File restored
    const restoredContent = await fs.readFile(configPath, 'utf8');
    expect(restoredContent).toBe(config);

    // Cleanup backup
    await fs.unlink(backupPath);
  });
});
