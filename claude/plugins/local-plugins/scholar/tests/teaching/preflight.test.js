/**
 * Tests for Preflight Validators
 *
 * Tests each individual check with temporary directories and mock files,
 * plus runAllChecks aggregation, --fix behavior, and --json output format.
 */

import { describe, it, expect, afterEach } from '@jest/globals';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync, utimesSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  checkVersionSync,
  checkConflictMarkers,
  checkTestCounts,
  checkCacheCleanup,
  checkChangelog,
  checkStatusFile,
  runAllChecks,
} from '../../src/teaching/validators/preflight.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir;

function createTmpProject(overrides = {}) {
  tmpDir = mkdtempSync(join(tmpdir(), 'preflight-'));

  // package.json
  const pkgVersion = overrides.pkgVersion || '2.14.0';
  writeFileSync(
    join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'test', version: pkgVersion }),
  );

  // .claude-plugin/plugin.json
  const pluginVersion = overrides.pluginVersion || pkgVersion;
  mkdirSync(join(tmpDir, '.claude-plugin'), { recursive: true });
  writeFileSync(
    join(tmpDir, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'scholar', version: pluginVersion }),
  );

  // mkdocs.yml
  const mkdocsVersion = overrides.mkdocsVersion || pkgVersion;
  const mkdocsContent = [
    'site_name: Test',
    'extra:',
    '  scholar:',
    `    version: "${mkdocsVersion}"`,
    `    jest_count: "${overrides.jestCount || '2877'}"`,
    `    node_test_count: "${overrides.nodeTestCount || '137'}"`,
  ].join('\n');
  writeFileSync(join(tmpDir, 'mkdocs.yml'), mkdocsContent);

  // src/ and docs/ directories
  mkdirSync(join(tmpDir, 'src'), { recursive: true });
  mkdirSync(join(tmpDir, 'docs'), { recursive: true });
  mkdirSync(join(tmpDir, 'src', 'discovery'), { recursive: true });

  // CHANGELOG.md
  const changelogVersion = overrides.changelogVersion || pkgVersion;
  writeFileSync(
    join(tmpDir, 'CHANGELOG.md'),
    `# Changelog\n\n## [${changelogVersion}] - 2026-02-16\n\n### Added\n- Stuff\n`,
  );

  // .STATUS file
  writeFileSync(join(tmpDir, '.STATUS'), 'status: Active\nprogress: 100\n');

  // If stale status requested, set mtime to 10 days ago
  if (overrides.staleStatus) {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    utimesSync(join(tmpDir, '.STATUS'), tenDaysAgo, tenDaysAgo);
  }

  return tmpDir;
}

function cleanupTmp() {
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

afterEach(() => {
  cleanupTmp();
});

// ---------------------------------------------------------------------------
// checkVersionSync
// ---------------------------------------------------------------------------

describe('checkVersionSync', () => {
  it('returns pass when all versions match', () => {
    const root = createTmpProject({ pkgVersion: '2.14.0' });
    const result = checkVersionSync(root);
    expect(result.name).toBe('version-sync');
    expect(result.status).toBe('pass');
    expect(result.detail).toContain('2.14.0');
  });

  it('returns fail when versions mismatch', () => {
    const root = createTmpProject({ pkgVersion: '2.14.0', pluginVersion: '2.13.0' });
    const result = checkVersionSync(root);
    expect(result.name).toBe('version-sync');
    expect(result.status).toBe('fail');
    expect(result.detail).toContain('mismatch');
  });

  it('returns fail when mkdocs version differs', () => {
    const root = createTmpProject({ pkgVersion: '2.14.0', mkdocsVersion: '2.12.0' });
    const result = checkVersionSync(root);
    expect(result.status).toBe('fail');
  });

  it('returns warn when plugin.json missing', () => {
    const root = createTmpProject();
    rmSync(join(root, '.claude-plugin'), { recursive: true, force: true });
    const result = checkVersionSync(root);
    expect(result.status).toBe('warn');
  });
});

// ---------------------------------------------------------------------------
// checkConflictMarkers
// ---------------------------------------------------------------------------

describe('checkConflictMarkers', () => {
  it('returns pass when no conflict markers found', () => {
    const root = createTmpProject();
    writeFileSync(join(root, 'src', 'test.js'), 'const x = 1;');
    writeFileSync(join(root, 'docs', 'readme.md'), '# Hello');
    const result = checkConflictMarkers(root);
    expect(result.name).toBe('conflict-markers');
    expect(result.status).toBe('pass');
  });

  it('returns fail when conflict markers exist in src/', () => {
    const root = createTmpProject();
    writeFileSync(
      join(root, 'src', 'broken.js'),
      '<<<<<<< HEAD\nconst x = 1;\n=======\nconst x = 2;\n>>>>>>> feature\n',
    );
    const result = checkConflictMarkers(root);
    expect(result.status).toBe('fail');
    expect(result.detail).toContain('1 file');
  });

  it('returns fail when conflict markers exist in docs/', () => {
    const root = createTmpProject();
    writeFileSync(
      join(root, 'docs', 'broken.md'),
      '<<<<<<< HEAD\n# Title\n=======\n# Other\n>>>>>>> feature\n',
    );
    const result = checkConflictMarkers(root);
    expect(result.status).toBe('fail');
  });

  it('reports multiple files with conflicts', () => {
    const root = createTmpProject();
    writeFileSync(join(root, 'src', 'a.js'), '<<<<<<< HEAD\n');
    writeFileSync(join(root, 'src', 'b.js'), '<<<<<<< HEAD\n');
    const result = checkConflictMarkers(root);
    expect(result.status).toBe('fail');
    expect(result.detail).toContain('2 file');
  });
});

// ---------------------------------------------------------------------------
// checkTestCounts
// ---------------------------------------------------------------------------

describe('checkTestCounts', () => {
  it('returns pass when mkdocs.yml has test counts', () => {
    const root = createTmpProject({ jestCount: '2877', nodeTestCount: '137' });
    const result = checkTestCounts(root);
    expect(result.name).toBe('test-counts');
    expect(result.status).toBe('pass');
    expect(result.detail).toContain('2877');
  });

  it('returns warn when mkdocs.yml has no test counts', () => {
    const root = createTmpProject();
    writeFileSync(join(root, 'mkdocs.yml'), 'site_name: Test\nextra:\n  scholar:\n    version: "2.14.0"\n');
    const result = checkTestCounts(root);
    expect(result.status).toBe('warn');
  });

  it('returns warn when mkdocs.yml is missing', () => {
    const root = createTmpProject();
    rmSync(join(root, 'mkdocs.yml'));
    const result = checkTestCounts(root);
    expect(result.status).toBe('warn');
  });
});

// ---------------------------------------------------------------------------
// checkCacheCleanup
// ---------------------------------------------------------------------------

describe('checkCacheCleanup', () => {
  it('returns pass when no cache.json exists', () => {
    const root = createTmpProject();
    const result = checkCacheCleanup(root);
    expect(result.name).toBe('cache-cleanup');
    expect(result.status).toBe('pass');
  });

  it('returns warn when cache.json exists', () => {
    const root = createTmpProject();
    writeFileSync(join(root, 'src', 'discovery', 'cache.json'), '{}');
    const result = checkCacheCleanup(root);
    expect(result.status).toBe('warn');
    expect(result.fixable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkChangelog
// ---------------------------------------------------------------------------

describe('checkChangelog', () => {
  it('returns pass when first changelog version matches package.json', () => {
    const root = createTmpProject({ pkgVersion: '2.14.0', changelogVersion: '2.14.0' });
    const result = checkChangelog(root);
    expect(result.name).toBe('changelog');
    expect(result.status).toBe('pass');
  });

  it('returns warn when versions differ', () => {
    const root = createTmpProject({ pkgVersion: '2.15.0', changelogVersion: '2.14.0' });
    const result = checkChangelog(root);
    expect(result.status).toBe('warn');
    expect(result.detail).toContain('2.14.0');
    expect(result.detail).toContain('2.15.0');
  });

  it('returns warn when CHANGELOG.md is missing', () => {
    const root = createTmpProject();
    rmSync(join(root, 'CHANGELOG.md'));
    const result = checkChangelog(root);
    expect(result.status).toBe('warn');
  });

  it('returns warn when no version heading found', () => {
    const root = createTmpProject();
    writeFileSync(join(root, 'CHANGELOG.md'), '# Changelog\n\nNothing here yet.\n');
    const result = checkChangelog(root);
    expect(result.status).toBe('warn');
    expect(result.detail).toContain('No version heading');
  });
});

// ---------------------------------------------------------------------------
// checkStatusFile
// ---------------------------------------------------------------------------

describe('checkStatusFile', () => {
  it('returns pass when .STATUS is recent', () => {
    const root = createTmpProject();
    const result = checkStatusFile(root);
    expect(result.name).toBe('status-file');
    expect(result.status).toBe('pass');
  });

  it('returns warn when .STATUS is stale (> 7 days)', () => {
    const root = createTmpProject({ staleStatus: true });
    const result = checkStatusFile(root);
    expect(result.status).toBe('warn');
    expect(result.detail).toContain('days old');
  });

  it('returns warn when .STATUS is missing', () => {
    const root = createTmpProject();
    rmSync(join(root, '.STATUS'));
    const result = checkStatusFile(root);
    expect(result.status).toBe('warn');
  });
});

// ---------------------------------------------------------------------------
// runAllChecks
// ---------------------------------------------------------------------------

describe('runAllChecks', () => {
  it('aggregates counts correctly for a clean project', async () => {
    const root = createTmpProject();
    const results = await runAllChecks({ root, quick: true });
    expect(results.passed).toBeGreaterThan(0);
    expect(results.failed).toBe(0);
    expect(typeof results.warned).toBe('number');
    expect(results.checks.length).toBeGreaterThanOrEqual(5);
  });

  it('includes all 6 checks when not quick', async () => {
    const root = createTmpProject();
    const results = await runAllChecks({ root, quick: false });
    expect(results.checks.length).toBe(6);
    const names = results.checks.map(c => c.name);
    expect(names).toContain('version-sync');
    expect(names).toContain('conflict-markers');
    expect(names).toContain('cache-cleanup');
    expect(names).toContain('changelog');
    expect(names).toContain('status-file');
    expect(names).toContain('test-counts');
  });

  it('runs only 5 checks when quick mode', async () => {
    const root = createTmpProject();
    const results = await runAllChecks({ root, quick: true });
    expect(results.checks.length).toBe(5);
    const names = results.checks.map(c => c.name);
    expect(names).not.toContain('test-counts');
  });

  it('reports failures for version mismatch', async () => {
    const root = createTmpProject({ pkgVersion: '2.14.0', pluginVersion: '2.13.0' });
    const results = await runAllChecks({ root, quick: true });
    expect(results.failed).toBeGreaterThan(0);
  });

  it('--fix deletes stale cache.json', async () => {
    const root = createTmpProject();
    const cachePath = join(root, 'src', 'discovery', 'cache.json');
    writeFileSync(cachePath, '{}');
    expect(existsSync(cachePath)).toBe(true);

    const results = await runAllChecks({ root, quick: true, fix: true });
    expect(existsSync(cachePath)).toBe(false);
    expect(results.fixedCount).toBe(1);

    const cacheCheck = results.checks.find(c => c.name === 'cache-cleanup');
    expect(cacheCheck.status).toBe('pass');
    expect(cacheCheck.fixed).toBe(true);
  });

  it('--fix does not modify unfixable checks', async () => {
    const root = createTmpProject({ pkgVersion: '2.14.0', pluginVersion: '2.13.0' });
    const results = await runAllChecks({ root, quick: true, fix: true });
    const versionCheck = results.checks.find(c => c.name === 'version-sync');
    expect(versionCheck.status).toBe('fail');
    expect(versionCheck.fixed).toBeUndefined();
  });

  it('produces JSON-serializable output', async () => {
    const root = createTmpProject();
    const results = await runAllChecks({ root, quick: true });
    const json = JSON.stringify(results);
    const parsed = JSON.parse(json);
    expect(parsed.checks).toBeDefined();
    expect(parsed.passed).toBeDefined();
    expect(parsed.failed).toBeDefined();
    expect(parsed.warned).toBeDefined();
    expect(parsed.fixedCount).toBeDefined();
  });
});
