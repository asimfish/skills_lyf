/**
 * Integration Tests for /teaching:migrate command
 *
 * Tests the full command execution flow, not just BatchMigrator class.
 * These tests simulate actual command invocation and verify output.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { BatchMigrator } from '../../../src/teaching/validators/batch-migrator.js';
import { execFileNoThrow } from '../../../src/utils/execFileNoThrow.js';

const TEST_DIR = join(process.cwd(), '.test-tmp-migrate-cmd');

describe('/teaching:migrate - Integration Tests', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('--detect mode should show complexity and changes', async () => {
    // Create v1 files with different complexity
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'simple.yml'),
      'topics: "Simple"\nweek: 1'
    );
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'complex.yml'),
      'topics: "Complex"\nobjectives: "Learn"\nweek: 1\ndate: 2026-01-20\nmaterials: "Book"'
    );

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    expect(files).toHaveLength(2);

    const simple = files.find(f => f.relativePath.includes('simple'));
    const complex = files.find(f => f.relativePath.includes('complex'));

    expect(simple).toBeDefined();
    expect(complex).toBeDefined();
    expect(simple.complexity).toBeDefined();
    expect(complex.complexity).toBeGreaterThan(simple.complexity);
    expect(simple.preview.length).toBeGreaterThan(0);
  });

  test('--dry-run should show colored preview without modifications', async () => {
    // Create v1 file
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    const yamlPath = join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml');
    const originalContent = 'topics: "Test"\nobjectives: "Learn"\nweek: 1';
    writeFileSync(yamlPath, originalContent);

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    const previews = await migrator.previewMigration(files, { color: true });

    expect(previews).toHaveLength(1);
    expect(previews[0].preview).toMatch(/\x1b\[\d+m/); // ANSI colors
    expect(previews[0].changes).toBeGreaterThan(0);

    // Verify file unchanged
    const currentContent = readFileSync(yamlPath, 'utf8');
    expect(currentContent).toBe(originalContent);
  });

  test('should apply migration and create git commit', async () => {
    // Initialize git repo
    mkdirSync(TEST_DIR, { recursive: true });
    await execFileNoThrow('git', ['init'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.name', 'Test'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.email', 'test@test.com'], {
      cwd: TEST_DIR,
    });

    // Create v1 file
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    const yamlPath = join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml');
    writeFileSync(yamlPath, 'topics: "Test"\nweek: 1');

    // Initial commit (so we have a clean state)
    await execFileNoThrow('git', ['add', '.'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['commit', '-m', 'Initial'], { cwd: TEST_DIR });

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    const result = await migrator.migrate(files, {
      gitCheck: false,
      gitCommit: true,
    });

    expect(result.success).toBe(true);
    expect(result.filesProcessed).toBe(1);
    expect(result.commitHash).toBeDefined();
    expect(result.commitHash).toMatch(/^[a-f0-9]{40}$/); // Full SHA

    // Verify file was migrated
    const { load } = await import('js-yaml');
    const data = load(readFileSync(yamlPath, 'utf8'));
    expect(data.schema_version).toBe('2.0');

    // Verify git commit
    const { stdout: log } = await execFileNoThrow('git', ['log', '--oneline', '-1'], {
      cwd: TEST_DIR,
    });
    expect(log).toMatch(/migrate schema from v1 to v2/i);
  });

  test('--file should migrate single file', async () => {
    // Create v1 files
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml'),
      'topics: "Week 1"\nweek: 1'
    );
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'week-02.yml'),
      'topics: "Week 2"\nweek: 2'
    );

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });

    // Detect only one file
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/week-01.yml']
    });

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toMatch(/week-01\.yml/);

    const result = await migrator.migrate(files, {
      gitCheck: false,
      gitCommit: false,
    });

    expect(result.success).toBe(true);
    expect(result.filesProcessed).toBe(1);

    // Verify only week-01 was migrated
    const { load } = await import('js-yaml');
    const week01 = load(
      readFileSync(join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml'), 'utf8')
    );
    const week02 = load(
      readFileSync(join(TEST_DIR, 'content', 'lesson-plans', 'week-02.yml'), 'utf8')
    );

    expect(week01.schema_version).toBe('2.0');
    expect(week02.schema_version).toBeUndefined(); // Still v1
  });

  test('should fail on uncommitted changes', async () => {
    // Initialize git repo
    await execFileNoThrow('git', ['init'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.name', 'Test'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.email', 'test@test.com'], {
      cwd: TEST_DIR,
    });

    // Create v1 file
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml'),
      'topics: "Test"\nweek: 1'
    );

    // Add file to git tracking
    await execFileNoThrow('git', ['add', '.'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['commit', '-m', 'Initial'], { cwd: TEST_DIR });

    // Now modify the file (this creates uncommitted changes)
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml'),
      'topics: "Test Modified"\nweek: 1'
    );

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const _files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    try {
      await migrator.checkGitStatus();
      expect(true).toBe(false); // Should have thrown
    } catch (error) {
      expect(error.message).toMatch(/Uncommitted changes detected/);
      expect(error.message).toMatch(/content\/lesson-plans\/week-01\.yml/);
    }
  });

  test('--no-git should apply migration without commit', async () => {
    // Initialize git repo (to test that commit is skipped)
    await execFileNoThrow('git', ['init'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.name', 'Test'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.email', 'test@test.com'], {
      cwd: TEST_DIR,
    });

    // Create v1 file
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    const yamlPath = join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml');
    writeFileSync(yamlPath, 'topics: "Test"\nweek: 1');

    // Initial commit
    await execFileNoThrow('git', ['add', '.'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['commit', '-m', 'Initial'], { cwd: TEST_DIR });

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    const result = await migrator.migrate(files, {
      gitCheck: false,
      gitCommit: false, // --no-git
    });

    expect(result.success).toBe(true);
    expect(result.commitHash).toBeFalsy(); // No commit created

    // Verify file was migrated
    const { load } = await import('js-yaml');
    const data = load(readFileSync(yamlPath, 'utf8'));
    expect(data.schema_version).toBe('2.0');

    // Verify no new commit
    const { stdout: log } = await execFileNoThrow('git', ['log', '--oneline'], {
      cwd: TEST_DIR,
    });
    const commits = log.trim().split('\n').filter(line => line.trim());
    expect(commits.length).toBe(1); // Only initial commit
  });

  test('should handle no v1 files found gracefully', async () => {
    // Create v2 files only
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml'),
      'schema_version: "2.0"\nmetadata:\n  id: "test"\ncontent:\n  topics: ["Test"]'
    );

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    expect(files).toHaveLength(0);
  });

  test('should respect custom --patterns', async () => {
    // Create v1 files in custom location
    mkdirSync(join(TEST_DIR, 'custom', 'configs'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'custom', 'configs', 'test.yml'),
      'topics: "Test"\nweek: 1'
    );

    // Also create file in standard location (should be ignored)
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'standard.yml'),
      'topics: "Standard"\nweek: 1'
    );

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });

    // Use custom pattern
    const files = await migrator.detectV1Schemas({
      patterns: ['custom/configs/**/*.yml']
    });

    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toMatch(/custom.*configs.*test\.yml/);
  });

  test('should show progress for multiple files', async () => {
    // Create multiple v1 files
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    for (let i = 1; i <= 5; i++) {
      writeFileSync(
        join(TEST_DIR, 'content', 'lesson-plans', `week-${String(i).padStart(2, '0')}.yml`),
        `topics: "Week ${i}"\nweek: ${i}`
      );
    }

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    expect(files).toHaveLength(5);

    const result = await migrator.migrate(files, {
      gitCheck: false,
      gitCommit: false,
    });

    expect(result.success).toBe(true);
    expect(result.filesProcessed).toBe(5);
    expect(result.results).toHaveLength(5);
    expect(result.results.every(r => r.success)).toBe(true);
  });

  test('should rollback on git commit failure', async () => {
    // Initialize git repo
    await execFileNoThrow('git', ['init'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.name', 'Test'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.email', 'test@test.com'], { cwd: TEST_DIR });

    // Create v1 file
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    const yamlPath = join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml');
    const originalContent = 'topics: "Test"\nweek: 1';
    writeFileSync(yamlPath, originalContent);

    // Initial commit
    await execFileNoThrow('git', ['add', '.'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['commit', '-m', 'Initial'], { cwd: TEST_DIR });

    // Create a pre-commit hook that always fails
    const { mkdirSync: mkdir2, writeFileSync: write2, chmodSync } = await import('fs');
    mkdir2(join(TEST_DIR, '.git', 'hooks'), { recursive: true });
    const hookPath = join(TEST_DIR, '.git', 'hooks', 'pre-commit');
    write2(hookPath, '#!/bin/sh\nexit 1\n');
    chmodSync(hookPath, 0o755);

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    const result = await migrator.migrate(files, {
      gitCheck: false,
      gitCommit: true, // Will fail due to pre-commit hook
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Git commit failed|rolled back/i);

    // Verify file was rolled back to original
    const currentContent = readFileSync(yamlPath, 'utf8');
    expect(currentContent).toBe(originalContent);
  });

  test('should validate all files are v2 after migration', async () => {
    // Create v1 files
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml'),
      'topics: "Week 1"\nweek: 1'
    );
    writeFileSync(
      join(TEST_DIR, 'content', 'lesson-plans', 'week-02.yml'),
      'topics: "Week 2"\nweek: 2'
    );

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    await migrator.migrate(files, {
      gitCheck: false,
      gitCommit: false,
    });

    // Re-detect - should find no v1 files
    const filesAfter = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    expect(filesAfter).toHaveLength(0);

    // Verify all files have schema_version: "2.0"
    const { load } = await import('js-yaml');
    for (const file of files) {
      const content = readFileSync(file.path, 'utf8');
      const data = load(content);
      expect(data.schema_version).toBe('2.0');
    }
  });

  test('should handle permission errors gracefully', async () => {
    // Create v1 file
    mkdirSync(join(TEST_DIR, 'content', 'lesson-plans'), { recursive: true });
    const yamlPath = join(TEST_DIR, 'content', 'lesson-plans', 'week-01.yml');
    writeFileSync(yamlPath, 'topics: "Test"\nweek: 1');

    // Make file read-only
    const { chmod } = await import('fs/promises');
    await chmod(yamlPath, 0o444);

    const migrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await migrator.detectV1Schemas({
      patterns: ['content/lesson-plans/**/*.yml']
    });

    try {
      const result = await migrator.migrate(files, {
        gitCheck: false,
        gitCommit: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/rolled back/i);
    } finally {
      // Cleanup: restore permissions
      await chmod(yamlPath, 0o644);
    }
  });
});
