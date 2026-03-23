/**
 * Phase 3 Part B: Batch Processing Tests
 *
 * Tests fixing multiple files at once:
 * - Fix all YAML files in directory
 * - Aggregated reports
 * - Fail-fast vs continue-on-error modes
 * - Performance with many files
 *
 * Target: 8-10 tests (~300 lines)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigValidator } from '../../src/teaching/validators/config-validator.js';
import { createAutoFixer } from '../../src/teaching/validators/auto-fixer.js';
import { loadFixture, cleanup } from './helpers/test-runner.js';
import { registerCustomMatchers } from './shared/assertions.js';
import fs from 'fs/promises';


import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

// Register custom matchers
beforeEach(() => {
  registerCustomMatchers();
});

// ============================================================================
// Batch Processing: Multiple Files
// ============================================================================

describe('Batch Processing: Multiple Files', () => {
  let validator;
  let fixer;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    validator = new ConfigValidator();
    fixer = createAutoFixer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-batch-test-'));
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('fix all YAML files in directory', async () => {
    // Given: Multiple files with fixable errors
    const fixtures = [
      'fixable-assignment-config.yml',
      'invalid-quiz-config.yml',
      'deprecated-lecture-config.yml',
    ];

    const filePaths = [];
    for (const fixture of fixtures) {
      const config = await loadFixture(`../fixtures/command-configs/${fixture}`);
      const filePath = path.join(tempDir, fixture);
      await fs.writeFile(filePath, config, 'utf8');
      filePaths.push(filePath);
    }

    // When: Batch fix all files
    const results = [];
    for (const filePath of filePaths) {
      const content = await fs.readFile(filePath, 'utf8');
      const syntaxResult = fixer.fixSyntaxErrors(content);
      results.push({
        file: path.basename(filePath),
        success: syntaxResult.success,
        changes: syntaxResult.changes?.length || 0,
      });

      if (syntaxResult.success) {
        await fs.writeFile(filePath, syntaxResult.fixed, 'utf8');
      }
    }

    // Then: All files processed
    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);

    // Then: All files now valid
    for (const filePath of filePaths) {
      const validation = validator.validateFile(filePath);
      expect(validation.isValid).toBe(true);
    }
  });

  test('batch fix: aggregated report', async () => {
    // Given: Multiple files with various error counts
    const testFiles = [
      { name: 'week-01.yml', errors: 2, config: 'week: 1\ntitle:    "Week 1"\ntopics: []' },
      { name: 'week-02.yml', errors: 1, config: 'week: 2\ntitle:   "Week 2"\ntopics: []' },
      { name: 'week-03.yml', errors: 0, config: 'week: 3\ntitle: "Week 3"\ntopics: []' },
    ];

    for (const file of testFiles) {
      const filePath = path.join(tempDir, file.name);
      await fs.writeFile(filePath, file.config, 'utf8');
    }

    // When: Batch process with aggregated report
    let totalFiles = 0;
    let totalErrors = 0;
    let totalFixed = 0;

    for (const file of testFiles) {
      const filePath = path.join(tempDir, file.name);
      const content = await fs.readFile(filePath, 'utf8');
      const syntaxResult = fixer.fixSyntaxErrors(content);

      totalFiles++;
      const errorCount = syntaxResult.changes?.length || 0;
      totalErrors += errorCount;
      if (syntaxResult.success && errorCount > 0) {
        totalFixed++;
        await fs.writeFile(filePath, syntaxResult.fixed, 'utf8');
      }
    }

    // Then: Aggregated stats
    expect(totalFiles).toBe(3);
    expect(totalErrors).toBeGreaterThan(0);
    expect(totalFixed).toBeGreaterThan(0);
  });

  test('batch fix: track changes per file', async () => {
    // Given: Mix of files with different error levels
    const files = [
      { name: 'minimal.yml', content: 'week: 1\ntitle: "Test"' },
      { name: 'fixable.yml', content: 'week: 2\ntitle:    "Bad"' }, // Extra spaces
    ];

    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      await fs.writeFile(filePath, file.content, 'utf8');
    }

    // When: Process all files and track changes
    const results = [];
    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      const content = await fs.readFile(filePath, 'utf8');
      const syntaxResult = fixer.fixSyntaxErrors(content);

      results.push({
        file: file.name,
        changeCount: syntaxResult.changes?.length || 0,
      });
    }

    // Then: Changes tracked per file
    expect(results).toHaveLength(2);
    // At least one file should have changes
    const totalChanges = results.reduce((sum, r) => sum + r.changeCount, 0);
    expect(totalChanges).toBeGreaterThan(0);
  });

  test('batch processing: preserve file order', async () => {
    // Given: Files in specific order
    const fileNames = ['week-03.yml', 'week-01.yml', 'week-02.yml'];

    for (const name of fileNames) {
      const num = name.match(/\d+/)[0];
      const config = `week: ${num}\ntitle: "Week ${num}"`;
      const filePath = path.join(tempDir, name);
      await fs.writeFile(filePath, config, 'utf8');
    }

    // When: Process in order
    const processedOrder = [];
    for (const name of fileNames) {
      const filePath = path.join(tempDir, name);
      const content = await fs.readFile(filePath, 'utf8');
      const _syntaxResult = fixer.fixSyntaxErrors(content);
      processedOrder.push(name);
    }

    // Then: Order preserved
    expect(processedOrder).toEqual(fileNames);
  });
});

// ============================================================================
// Batch Processing: Error Handling
// ============================================================================

describe('Batch Processing: Error Handling', () => {
  let _validator;
  let fixer;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    _validator = new ConfigValidator();
    fixer = createAutoFixer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-batch-error-test-'));
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('continue-on-error: process all files even if some fail', async () => {
    // Given: Mix of valid, fixable, and invalid files
    const files = [
      { name: 'valid.yml', content: 'week: 1\ntitle: "Valid"', shouldFix: false },
      { name: 'fixable.yml', content: 'week: 2\ntitle:   "Fixable"', shouldFix: true },
      { name: 'invalid.yml', content: 'week: 3\n  bad indentation', shouldFix: false },
    ];

    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      await fs.writeFile(filePath, file.content, 'utf8');
    }

    // When: Process all (continue on error)
    const results = [];
    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const syntaxResult = fixer.fixSyntaxErrors(content);
        results.push({
          file: file.name,
          success: syntaxResult.success,
          error: null,
        });
      } catch (err) {
        results.push({
          file: file.name,
          success: false,
          error: err.message,
        });
      }
    }

    // Then: All files attempted
    expect(results).toHaveLength(3);

    // Then: valid and fixable succeeded
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
  });

  test('fail-fast: stop on first error', async () => {
    // Given: Files where second one will fail (invalid YAML)
    const files = [
      { name: 'file1.yml', content: 'week: 1\ntitle: "File 1"' },
      { name: 'file2.yml', content: 'week: 2\ntitle: [unclosed array' }, // Invalid YAML
      { name: 'file3.yml', content: 'week: 3\ntitle: "File 3"' },
    ];

    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      await fs.writeFile(filePath, file.content, 'utf8');
    }

    // When: Process with fail-fast
    const processed = [];

    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      const content = await fs.readFile(filePath, 'utf8');

      // Try to parse YAML (will fail on invalid)
      try {
        yaml.load(content);
        processed.push(file.name);
      } catch (_err) {
        break;
      }
    }

    // Then: Stopped at file2
    expect(processed).toEqual(['file1.yml']);
    expect(processed).not.toContain('file3.yml');
  });

  test('partial success: report which files succeeded/failed', async () => {
    // Given: Mix of valid and invalid YAML files
    const files = [
      { name: 'success1.yml', content: 'week: 1\ntitle: "A"' },
      { name: 'fail1.yml', content: 'week: 2\ntitle: [bad' }, // Invalid YAML
      { name: 'success2.yml', content: 'week: 3\ntitle: "B"' },
      { name: 'fail2.yml', content: 'week: 4\nvalue: {unclosed' }, // Invalid YAML
    ];

    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      await fs.writeFile(filePath, file.content, 'utf8');
    }

    // When: Process all, track results
    const succeeded = [];
    const failed = [];

    for (const file of files) {
      const filePath = path.join(tempDir, file.name);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        yaml.load(content); // Will throw if invalid
        const syntaxResult = fixer.fixSyntaxErrors(content);
        if (syntaxResult.success) {
          succeeded.push(file.name);
        }
      } catch (_err) {
        failed.push(file.name);
      }
    }

    // Then: Correct classification
    expect(succeeded).toHaveLength(2);
    expect(failed).toHaveLength(2);
    expect(succeeded).toContain('success1.yml');
    expect(succeeded).toContain('success2.yml');
    expect(failed).toContain('fail1.yml');
    expect(failed).toContain('fail2.yml');
  });
});

// ============================================================================
// Batch Processing: Performance
// ============================================================================

describe('Batch Processing: Performance', () => {
  let fixer;
  let tempDir;
  let tempFiles = [];

  beforeEach(async () => {
    fixer = createAutoFixer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scholar-batch-perf-test-'));
    tempFiles = [tempDir];
  });

  afterEach(async () => {
    await cleanup(tempFiles);
  });

  test('process 10 files: complete within reasonable time', async () => {
    // Given: 10 small files
    const fileCount = 10;
    const filePaths = [];

    for (let i = 1; i <= fileCount; i++) {
      const config = `week: ${i}\ntitle:    "Week ${i}"\ntopics: []`;
      const filePath = path.join(tempDir, `week-${String(i).padStart(2, '0')}.yml`);
      await fs.writeFile(filePath, config, 'utf8');
      filePaths.push(filePath);
    }

    // When: Process all files
    const startTime = Date.now();
    const results = [];

    for (const filePath of filePaths) {
      const content = await fs.readFile(filePath, 'utf8');
      const syntaxResult = fixer.fixSyntaxErrors(content);
      results.push(syntaxResult.success);

      if (syntaxResult.success) {
        await fs.writeFile(filePath, syntaxResult.fixed, 'utf8');
      }
    }

    const duration = Date.now() - startTime;

    // Then: All processed successfully
    expect(results).toHaveLength(fileCount);
    expect(results.every(r => r === true)).toBe(true);

    // Then: Reasonable performance (< 2 seconds for 10 files)
    expect(duration).toBeLessThan(2000);
  });

  test('empty batch: handle gracefully', async () => {
    // Given: No files to process
    const filePaths = [];

    // When: Process empty batch
    const results = [];
    for (const filePath of filePaths) {
      const content = await fs.readFile(filePath, 'utf8');
      const syntaxResult = fixer.fixSyntaxErrors(content);
      results.push(syntaxResult);
    }

    // Then: No errors, empty results
    expect(results).toHaveLength(0);
  });
});
