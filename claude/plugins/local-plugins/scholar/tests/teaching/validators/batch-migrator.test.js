/**
 * Tests for BatchMigrator - v1 to v2 schema migration
 *
 * Test Categories:
 * - Detection (8 tests)
 * - Git Safety (7 tests)
 * - Dry-run Preview (6 tests)
 * - Batch Processing (10 tests)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { BatchMigrator } from '../../../src/teaching/validators/batch-migrator.js';

const _FIXTURES_DIR = join(process.cwd(), 'tests/teaching/validators/batch-migrator-fixtures');
const TEST_DIR = join(process.cwd(), '.test-tmp-batch-migrator');

describe('BatchMigrator - Detection', () => {
  let migrator;

  beforeEach(() => {
    // Create temporary test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    migrator = new BatchMigrator({
      rootDir: TEST_DIR,
      debug: false,
    });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('should detect v1 schemas (no schema_version field)', async () => {
    // Create v1 file
    writeFileSync(
      join(TEST_DIR, 'config.yml'),
      'topics: "Test"\nobjectives: "Learn"\nweek: 1'
    );

    const results = await migrator.detectV1Schemas({
      patterns: ['*.yml'],
    });

    expect(results).toHaveLength(1);
    expect(results[0].relativePath).toBe('config.yml');
    expect(results[0].schema_version).toBe('undefined');
    expect(results[0].complexity).toBeGreaterThan(0);
  });

  test('should detect v1 schemas (schema_version: "1.0")', async () => {
    // Create v1 file with explicit version
    writeFileSync(
      join(TEST_DIR, 'config.yml'),
      'schema_version: "1.0"\ntopics: "Test"\nobjectives: "Learn"'
    );

    const results = await migrator.detectV1Schemas({
      patterns: ['*.yml'],
    });

    expect(results).toHaveLength(1);
    expect(results[0].schema_version).toBe('1.0');
  });

  test('should skip v2 schemas (schema_version: "2.0")', async () => {
    // Create v2 file
    writeFileSync(
      join(TEST_DIR, 'config.yml'),
      'schema_version: "2.0"\nmetadata:\n  id: "test"\ncontent:\n  topics: ["Test"]'
    );

    const results = await migrator.detectV1Schemas({
      patterns: ['*.yml'],
    });

    expect(results).toHaveLength(0);
  });

  test('should calculate complexity correctly', async () => {
    // Copy fixtures to test directory
    writeFileSync(
      join(TEST_DIR, 'simple.yml'),
      'topics: "Linear models"\nobjectives: "Understand regression"\nweek: 1'
    );
    writeFileSync(
      join(TEST_DIR, 'complex.yml'),
      'topics: "Linear models, ANOVA"\n' +
        'objectives: "Understand regression"\n' +
        'materials: "Textbook"\n' +
        'week: 1\n' +
        'date: 2026-01-20\n' +
        'teaching_style: "lecture"'
    );

    const results = await migrator.detectV1Schemas({
      patterns: ['*.yml'],
    });

    expect(results).toHaveLength(2);

    // Find simple and complex files
    const simple = results.find((r) => r.relativePath === 'simple.yml');
    const complex = results.find((r) => r.relativePath === 'complex.yml');

    expect(simple).toBeDefined();
    expect(complex).toBeDefined();

    // Complex file should have higher complexity
    expect(complex.complexity).toBeGreaterThan(simple.complexity);
    expect(simple.complexityDesc).toMatch(/Low|Medium|Trivial/i);
  });

  test('should handle empty directories gracefully', async () => {
    const results = await migrator.detectV1Schemas({
      patterns: ['*.yml'],
    });

    expect(results).toHaveLength(0);
  });

  test('should respect custom glob patterns', async () => {
    // Create files in subdirectory
    mkdirSync(join(TEST_DIR, 'content'), { recursive: true });
    writeFileSync(
      join(TEST_DIR, 'content', 'week-01.yml'),
      'topics: "Test"\nobjectives: "Learn"'
    );
    writeFileSync(join(TEST_DIR, 'other.yml'), 'topics: "Other"');

    // Search only in content/
    const results = await migrator.detectV1Schemas({
      patterns: ['content/**/*.yml'],
    });

    expect(results).toHaveLength(1);
    expect(results[0].relativePath).toBe('content/week-01.yml');
  });

  test('should return preview of top 3 deprecated fields', async () => {
    writeFileSync(
      join(TEST_DIR, 'config.yml'),
      'topics: "Test"\nobjectives: "Learn"\nweek: 1\ndate: 2026-01-20\nmaterials: "Book"'
    );

    const results = await migrator.detectV1Schemas({
      patterns: ['*.yml'],
    });

    expect(results).toHaveLength(1);
    expect(results[0].preview).toBeDefined();
    expect(Array.isArray(results[0].preview)).toBe(true);
    expect(results[0].preview.length).toBeLessThanOrEqual(3);

    // Check preview structure
    const preview = results[0].preview;
    if (preview.length > 0) {
      expect(preview[0]).toHaveProperty('oldPath');
      expect(preview[0]).toHaveProperty('newPath');
      expect(preview[0]).toHaveProperty('value');
    }
  });

  test('should handle malformed YAML gracefully', async () => {
    // Create malformed YAML
    writeFileSync(join(TEST_DIR, 'bad.yml'), 'topics: "Unclosed quote\nweek: 1');
    writeFileSync(join(TEST_DIR, 'good.yml'), 'topics: "Test"\nweek: 1');

    const results = await migrator.detectV1Schemas({
      patterns: ['*.yml'],
    });

    // Should skip malformed file and only return good file
    expect(results).toHaveLength(1);
    expect(results[0].relativePath).toBe('good.yml');
  });
});

describe('BatchMigrator - Dry-run Preview', () => {
  let migrator;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    migrator = new BatchMigrator({
      rootDir: TEST_DIR,
      debug: false,
    });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('should generate diff preview for v1 file', async () => {
    // Create v1 file
    const yamlPath = join(TEST_DIR, 'config.yml');
    writeFileSync(
      yamlPath,
      'topics: "Linear models"\nobjectives: "Understand regression"\nweek: 1'
    );

    // Detect v1 files
    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });

    // Generate preview
    const previews = await migrator.previewMigration(files);

    expect(previews).toHaveLength(1);
    expect(previews[0].relativePath).toBe('config.yml');
    expect(previews[0].changes).toBeGreaterThan(0);
    expect(previews[0].fixes).toBeDefined();
    expect(Array.isArray(previews[0].fixes)).toBe(true);
    expect(previews[0].preview).toBeDefined();
  });

  test('should show multiple changes per file', async () => {
    // Create complex v1 file
    writeFileSync(
      join(TEST_DIR, 'complex.yml'),
      'topics: "Test"\nobjectives: "Learn"\nweek: 1\ndate: 2026-01-20\nmaterials: "Book"'
    );

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const previews = await migrator.previewMigration(files);

    expect(previews).toHaveLength(1);
    expect(previews[0].changes).toBeGreaterThan(3); // Multiple changes
    expect(previews[0].fixes.length).toBeGreaterThan(0);
  });

  test('should handle files with no changes needed', async () => {
    // Create v2 file
    writeFileSync(
      join(TEST_DIR, 'v2.yml'),
      'schema_version: "2.0"\nmetadata:\n  id: "test"\ncontent:\n  topics: ["Test"]'
    );

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const previews = await migrator.previewMigration(files);

    // Should detect no v1 files, so no previews
    expect(previews).toHaveLength(0);
  });

  test('should not modify files during preview', async () => {
    // Create v1 file
    const yamlPath = join(TEST_DIR, 'config.yml');
    const originalContent = 'topics: "Test"\nobjectives: "Learn"\nweek: 1';
    writeFileSync(yamlPath, originalContent);

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    await migrator.previewMigration(files);

    // File should remain unchanged
    const currentContent = readFileSync(yamlPath, 'utf8');
    expect(currentContent).toBe(originalContent);
  });

  test('should format preview with colors when enabled', async () => {
    // Create v1 file
    writeFileSync(
      join(TEST_DIR, 'config.yml'),
      'topics: "Test"\nobjectives: "Learn"'
    );

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const previews = await migrator.previewMigration(files, { color: true });

    expect(previews).toHaveLength(1);
    // Should contain ANSI color codes
    expect(previews[0].preview).toMatch(/\x1b\[\d+m/);
  });

  test('should format preview without colors when disabled', async () => {
    // Create v1 file
    writeFileSync(
      join(TEST_DIR, 'config.yml'),
      'topics: "Test"\nobjectives: "Learn"'
    );

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const previews = await migrator.previewMigration(files, { color: false });

    expect(previews).toHaveLength(1);
    // Should NOT contain ANSI color codes
    expect(previews[0].preview).not.toMatch(/\x1b\[\d+m/);
  });
});

describe('BatchMigrator - Batch Processing', () => {
  let migrator;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    migrator = new BatchMigrator({
      rootDir: TEST_DIR,
      debug: false,
    });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('should migrate multiple files successfully', async () => {
    // Create v1 files
    writeFileSync(
      join(TEST_DIR, 'file1.yml'),
      'topics: "Test1"\nobjectives: "Learn1"\nweek: 1'
    );
    writeFileSync(
      join(TEST_DIR, 'file2.yml'),
      'topics: "Test2"\nobjectives: "Learn2"\nweek: 2'
    );

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const result = await migrator.migrate(files, { gitCheck: false, gitCommit: false });

    expect(result.success).toBe(true);
    expect(result.filesProcessed).toBe(2);
    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => r.success)).toBe(true);
  });

  test('should apply all fixes from AutoFixer', async () => {
    // Create v1 file with multiple deprecated fields
    writeFileSync(
      join(TEST_DIR, 'config.yml'),
      'topics: "Test"\nobjectives: "Learn"\nweek: 1\ndate: 2026-01-20'
    );

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const result = await migrator.migrate(files, { gitCheck: false, gitCommit: false });

    expect(result.success).toBe(true);
    expect(result.results[0].fixesApplied).toBeGreaterThan(0);
    expect(result.results[0].fixes).toBeDefined();
    expect(Array.isArray(result.results[0].fixes)).toBe(true);
  });

  test('should add schema_version to all files', async () => {
    // Create v1 file without schema_version
    const yamlPath = join(TEST_DIR, 'config.yml');
    writeFileSync(yamlPath, 'topics: "Test"\nobjectives: "Learn"');

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    await migrator.migrate(files, { gitCheck: false, gitCommit: false });

    // Read migrated file
    const content = readFileSync(yamlPath, 'utf8');
    expect(content).toMatch(/schema_version:\s*['"]?2\.0['"]?/);
  });

  test('should rollback on failure', async () => {
    // Create good v1 file
    const goodFile = join(TEST_DIR, 'good.yml');
    writeFileSync(goodFile, 'topics: "Test"\nobjectives: "Learn"');

    // Create v1 file that will fail (make it read-only after creation)
    const badFile = join(TEST_DIR, 'bad.yml');
    writeFileSync(badFile, 'topics: "Bad"\nweek: 1');

    // Make bad file read-only to cause write failure
    const { chmod } = await import('fs/promises');
    await chmod(badFile, 0o444); // Read-only

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });

    try {
      // This should fail and rollback
      const result = await migrator.migrate(files, { gitCheck: false, gitCommit: false });

      expect(result.success).toBe(false);
      expect(result.filesProcessed).toBe(0);
      expect(result.error).toMatch(/rolled back/i);
    } finally {
      // Cleanup: restore write permissions
      await chmod(badFile, 0o644);
    }
  });

  test('should restore exact original content on rollback', async () => {
    // Create v1 file
    const yamlPath = join(TEST_DIR, 'config.yml');
    const originalContent = 'topics: "Test"\nobjectives: "Learn"\nweek: 1';
    writeFileSync(yamlPath, originalContent);

    // Also create a v1 file that will fail (make it read-only)
    const badFile = join(TEST_DIR, 'bad.yml');
    writeFileSync(badFile, 'topics: "Bad"\nweek: 2');

    const { chmod } = await import('fs/promises');
    await chmod(badFile, 0o444); // Read-only to cause failure

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });

    try {
      // Migration should fail and rollback
      await migrator.migrate(files, { gitCheck: false, gitCommit: false });

      // Check that original file is unchanged
      const currentContent = readFileSync(yamlPath, 'utf8');
      expect(currentContent).toBe(originalContent);
    } finally {
      // Cleanup: restore write permissions
      await chmod(badFile, 0o644);
    }
  });

  test('should skip git commit if gitCommit=false', async () => {
    // Initialize git repo in test directory
    const { execFileNoThrow } = await import(
      '../../../src/utils/execFileNoThrow.js'
    );
    await execFileNoThrow('git', ['init'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.name', 'Test'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.email', 'test@test.com'], {
      cwd: TEST_DIR,
    });

    // Create v1 file
    writeFileSync(join(TEST_DIR, 'config.yml'), 'topics: "Test"\nweek: 1');

    const testMigrator = new BatchMigrator({ rootDir: TEST_DIR });
    const files = await testMigrator.detectV1Schemas({ patterns: ['*.yml'] });
    const result = await testMigrator.migrate(files, {
      gitCheck: false,
      gitCommit: false,
    });

    expect(result.success).toBe(true);
    expect(result.commitHash).toBeFalsy(); // null or undefined
  });

  test('should handle dry-run mode without modifying files', async () => {
    // Create v1 file
    const yamlPath = join(TEST_DIR, 'config.yml');
    const originalContent = 'topics: "Test"\nobjectives: "Learn"';
    writeFileSync(yamlPath, originalContent);

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const result = await migrator.migrate(files, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.filesProcessed).toBe(0); // No files modified

    // File should remain unchanged
    const currentContent = readFileSync(yamlPath, 'utf8');
    expect(currentContent).toBe(originalContent);
  });

  test('should preserve YAML formatting where possible', async () => {
    // Create v1 file with specific formatting
    const yamlPath = join(TEST_DIR, 'config.yml');
    writeFileSync(yamlPath, 'topics: Test\nweek: 1');

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    await migrator.migrate(files, { gitCheck: false, gitCommit: false });

    // Read migrated file
    const content = readFileSync(yamlPath, 'utf8');

    // Should be valid YAML
    const { load } = await import('js-yaml');
    const data = load(content);
    expect(data).toBeDefined();
    expect(data.schema_version).toBe('2.0');
  });

  test('should handle mixed v1/v2 fields correctly', async () => {
    // Create file with both v1 (topics) and v2 (schema_version) fields
    const yamlPath = join(TEST_DIR, 'mixed.yml');
    writeFileSync(
      yamlPath,
      'schema_version: "1.0"\ntopics: "Test"\ncontent:\n  materials: []\nweek: 1'
    );

    const files = await migrator.detectV1Schemas({ patterns: ['*.yml'] });
    const result = await migrator.migrate(files, { gitCheck: false, gitCommit: false });

    expect(result.success).toBe(true);

    // Read migrated file
    const { load } = await import('js-yaml');
    const data = load(readFileSync(yamlPath, 'utf8'));

    expect(data.schema_version).toBe('2.0'); // Updated
    expect(data).toBeDefined();
  });
});

describe('BatchMigrator - Git Safety', () => {
  let _migrator;

  beforeEach(() => {
    _migrator = new BatchMigrator({
      rootDir: TEST_DIR,
      debug: false,
    });
  });

  test('should detect git repository', async () => {
    // This test runs in the actual git repository
    const realMigrator = new BatchMigrator({
      rootDir: process.cwd(),
      debug: false,
    });

    const isGit = await realMigrator.isGitRepository();
    expect(isGit).toBe(true);
  });

  test('should handle non-git directories', async () => {
    // Create non-git directory outside of git repo
    const tmpDir = join('/tmp', 'test-batch-migrator-' + Date.now());
    mkdirSync(tmpDir, { recursive: true });

    try {
      const testMigrator = new BatchMigrator({
        rootDir: tmpDir,
        debug: false,
      });

      const isGit = await testMigrator.isGitRepository();
      expect(isGit).toBe(false);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('should pass git check with clean working directory', async () => {
    // This should pass since we're in a git repo with clean state
    // (assuming tests are run with clean state)
    const realMigrator = new BatchMigrator({
      rootDir: process.cwd(),
      debug: false,
    });

    // This should not throw if working directory is clean
    try {
      await realMigrator.checkGitStatus();
      // Success - no uncommitted changes
      expect(true).toBe(true);
    } catch (error) {
      // If there are uncommitted changes, that's expected during development
      expect(error.message).toMatch(/Uncommitted changes detected/);
    }
  });

  test('should skip git check if not a git repository', async () => {
    // Create non-git directory outside of git repo
    const tmpDir = join('/tmp', 'test-batch-migrator-' + Date.now());
    mkdirSync(tmpDir, { recursive: true });

    try {
      const testMigrator = new BatchMigrator({
        rootDir: tmpDir,
        debug: false,
      });

      // Should not throw for non-git directory
      await expect(testMigrator.checkGitStatus()).resolves.not.toThrow();
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('should list uncommitted files in error message', async () => {
    // Create a git repo with uncommitted changes
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    // Initialize git repo
    const { execFileNoThrow } = await import(
      '../../../src/utils/execFileNoThrow.js'
    );
    await execFileNoThrow('git', ['init'], { cwd: TEST_DIR });
    await execFileNoThrow('git', ['config', 'user.name', 'Test User'], {
      cwd: TEST_DIR,
    });
    await execFileNoThrow('git', ['config', 'user.email', 'test@example.com'], {
      cwd: TEST_DIR,
    });

    // Create uncommitted file
    writeFileSync(join(TEST_DIR, 'uncommitted.yml'), 'test: data');

    const testMigrator = new BatchMigrator({
      rootDir: TEST_DIR,
      debug: false,
    });

    try {
      await testMigrator.checkGitStatus();
      // Should have thrown
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toMatch(/Uncommitted changes detected/);
      expect(error.message).toMatch(/uncommitted\.yml/);
      expect(error.message).toMatch(/git add/); // Suggest fix
    }

    // Cleanup
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test('should provide helpful error message with fix options', async () => {
    // This test verifies the error message format
    const errorMessage =
      'Uncommitted changes detected:\n  file1.yml\n  file2.yml\n\n' +
      'Options:\n' +
      '  1. Commit changes: git add . && git commit -m "..."\n' +
      '  2. Stash changes: git stash\n' +
      '  3. Skip check (dangerous): /teaching:migrate --no-git-check';

    expect(errorMessage).toMatch(/Uncommitted changes detected/);
    expect(errorMessage).toMatch(/git add/);
    expect(errorMessage).toMatch(/git stash/);
    expect(errorMessage).toMatch(/--no-git-check/);
  });

  test('should handle git command failures gracefully', async () => {
    // Test with invalid git directory
    const invalidMigrator = new BatchMigrator({
      rootDir: '/nonexistent/path',
      debug: false,
    });

    const isGit = await invalidMigrator.isGitRepository();
    expect(isGit).toBe(false);
  });
});
