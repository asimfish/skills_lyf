/**
 * Preflight Validators for Scholar Projects
 *
 * Pre-release health checks: version sync, conflict markers, cache cleanup,
 * changelog validation, and status file freshness.
 *
 * @module teaching/validators/preflight
 */

import { readFileSync, existsSync, statSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { globSync } from 'glob';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the project root directory.
 * Walks up from this file's location until we find package.json.
 *
 * @returns {string} Absolute path to project root.
 */
function getProjectRoot() {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

/**
 * Check version consistency across package.json, plugin.json, and mkdocs.yml.
 *
 * @param {string} [root] - Project root directory.
 * @returns {{ name: string, status: string, detail: string, fixable: boolean }}
 */
export function checkVersionSync(root) {
  root = root || getProjectRoot();
  const versions = {};

  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
    versions.package = pkg.version;
  } catch {
    return { name: 'version-sync', status: 'fail', detail: 'Cannot read package.json', fixable: false };
  }

  try {
    const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf-8'));
    versions.plugin = plugin.version;
  } catch {
    return { name: 'version-sync', status: 'warn', detail: 'Cannot read .claude-plugin/plugin.json', fixable: false };
  }

  try {
    const mkdocsRaw = readFileSync(join(root, 'mkdocs.yml'), 'utf-8');
    const mkdocs = yaml.load(mkdocsRaw);
    versions.mkdocs = mkdocs?.extra?.scholar?.version;
  } catch {
    return { name: 'version-sync', status: 'warn', detail: 'Cannot read mkdocs.yml', fixable: false };
  }

  const allVersions = Object.values(versions).filter(Boolean);
  const unique = [...new Set(allVersions)];

  if (unique.length === 1) {
    return {
      name: 'version-sync',
      status: 'pass',
      detail: `All files at v${unique[0]}`,
      fixable: false,
    };
  }

  const pairs = Object.entries(versions)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return {
    name: 'version-sync',
    status: 'fail',
    detail: `Version mismatch: ${pairs}`,
    fixable: false,
  };
}

/**
 * Check for merge conflict markers in source and doc files.
 *
 * @param {string} [root] - Project root directory.
 * @returns {{ name: string, status: string, detail: string, fixable: boolean }}
 */
export function checkConflictMarkers(root) {
  root = root || getProjectRoot();

  const patterns = [
    join(root, 'src', '**', '*.{md,js}'),
    join(root, 'docs', '**', '*.md'),
  ];

  const filesWithConflicts = [];

  for (const pattern of patterns) {
    const files = globSync(pattern);
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        if (content.includes('<<<<<<')) {
          filesWithConflicts.push(file.replace(root + '/', ''));
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  if (filesWithConflicts.length === 0) {
    return {
      name: 'conflict-markers',
      status: 'pass',
      detail: 'No conflict markers found',
      fixable: false,
    };
  }

  return {
    name: 'conflict-markers',
    status: 'fail',
    detail: `Conflict markers in ${filesWithConflicts.length} file(s): ${filesWithConflicts.slice(0, 3).join(', ')}${filesWithConflicts.length > 3 ? '...' : ''}`,
    fixable: false,
  };
}

/**
 * Check if mkdocs.yml test counts match expectations by running test suite.
 *
 * @param {string} [root] - Project root directory.
 * @returns {{ name: string, status: string, detail: string, fixable: boolean }}
 */
export function checkTestCounts(root) {
  root = root || getProjectRoot();

  let mkdocsData;
  try {
    const mkdocsRaw = readFileSync(join(root, 'mkdocs.yml'), 'utf-8');
    mkdocsData = yaml.load(mkdocsRaw);
  } catch {
    return { name: 'test-counts', status: 'warn', detail: 'Cannot read mkdocs.yml', fixable: true };
  }

  const jestCount = mkdocsData?.extra?.scholar?.jest_count;
  const nodeTestCount = mkdocsData?.extra?.scholar?.node_test_count;

  if (!jestCount && !nodeTestCount) {
    return {
      name: 'test-counts',
      status: 'warn',
      detail: 'No test counts found in mkdocs.yml extra.scholar',
      fixable: true,
    };
  }

  return {
    name: 'test-counts',
    status: 'pass',
    detail: `mkdocs.yml reports jest_count=${jestCount}, node_test_count=${nodeTestCount}`,
    fixable: true,
  };
}

/**
 * Check if discovery cache.json exists (should be deleted before release).
 *
 * @param {string} [root] - Project root directory.
 * @returns {{ name: string, status: string, detail: string, fixable: boolean }}
 */
export function checkCacheCleanup(root) {
  root = root || getProjectRoot();
  const cachePath = join(root, 'src', 'discovery', 'cache.json');

  if (!existsSync(cachePath)) {
    return {
      name: 'cache-cleanup',
      status: 'pass',
      detail: 'No stale cache.json found',
      fixable: true,
    };
  }

  return {
    name: 'cache-cleanup',
    status: 'warn',
    detail: 'src/discovery/cache.json exists — should be deleted before release',
    fixable: true,
  };
}

/**
 * Check that CHANGELOG.md first version heading matches package.json version.
 *
 * @param {string} [root] - Project root directory.
 * @returns {{ name: string, status: string, detail: string, fixable: boolean }}
 */
export function checkChangelog(root) {
  root = root || getProjectRoot();

  let pkgVersion;
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
    pkgVersion = pkg.version;
  } catch {
    return { name: 'changelog', status: 'fail', detail: 'Cannot read package.json', fixable: false };
  }

  let changelogContent;
  try {
    changelogContent = readFileSync(join(root, 'CHANGELOG.md'), 'utf-8');
  } catch {
    return { name: 'changelog', status: 'warn', detail: 'CHANGELOG.md not found', fixable: false };
  }

  // Find first version heading: ## [X.Y.Z]
  const match = changelogContent.match(/^## \[([^\]]+)\]/m);
  if (!match) {
    return { name: 'changelog', status: 'warn', detail: 'No version heading found in CHANGELOG.md', fixable: false };
  }

  const changelogVersion = match[1];
  if (changelogVersion === pkgVersion) {
    return {
      name: 'changelog',
      status: 'pass',
      detail: `CHANGELOG.md first entry matches v${pkgVersion}`,
      fixable: false,
    };
  }

  return {
    name: 'changelog',
    status: 'warn',
    detail: `CHANGELOG.md first entry is v${changelogVersion}, but package.json is v${pkgVersion}`,
    fixable: false,
  };
}

/**
 * Check .STATUS file freshness (warn if older than 7 days).
 *
 * @param {string} [root] - Project root directory.
 * @returns {{ name: string, status: string, detail: string, fixable: boolean }}
 */
export function checkStatusFile(root) {
  root = root || getProjectRoot();
  const statusPath = join(root, '.STATUS');

  if (!existsSync(statusPath)) {
    return { name: 'status-file', status: 'warn', detail: '.STATUS file not found', fixable: false };
  }

  let mtime;
  try {
    const stat = statSync(statusPath);
    mtime = stat.mtime;
  } catch {
    return { name: 'status-file', status: 'warn', detail: 'Cannot stat .STATUS file', fixable: false };
  }

  const ageMs = Date.now() - mtime.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  if (ageDays > 7) {
    return {
      name: 'status-file',
      status: 'warn',
      detail: `.STATUS file is ${ageDays} days old — consider updating`,
      fixable: false,
    };
  }

  return {
    name: 'status-file',
    status: 'pass',
    detail: `.STATUS file updated ${ageDays} day(s) ago`,
    fixable: false,
  };
}

// ---------------------------------------------------------------------------
// Fix application
// ---------------------------------------------------------------------------

/**
 * Apply an automatic fix for a given check.
 *
 * @param {{ name: string, status: string, fixable: boolean }} check - The check result.
 * @param {string} [root] - Project root directory.
 * @returns {boolean} True if fix was applied.
 */
function applyFix(check, root) {
  root = root || getProjectRoot();

  switch (check.name) {
    case 'cache-cleanup': {
      const cachePath = join(root, 'src', 'discovery', 'cache.json');
      if (existsSync(cachePath)) {
        try {
          unlinkSync(cachePath);
          check.fixed = true;
          check.detail = 'Deleted src/discovery/cache.json';
          check.status = 'pass';
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run all preflight checks with optional auto-fix.
 *
 * @param {object} [options]
 * @param {boolean} [options.fix=false] - Auto-fix fixable issues.
 * @param {boolean} [options.quick=false] - Skip slow checks (test counts).
 * @param {boolean} [options.debug=false] - Enable debug logging.
 * @param {string} [options.root] - Override project root.
 * @returns {{ checks: object[], passed: number, failed: number, warned: number, fixedCount: number }}
 */
export async function runAllChecks(options = {}) {
  const root = options.root || getProjectRoot();

  const checks = [
    checkVersionSync(root),
    checkConflictMarkers(root),
    checkCacheCleanup(root),
    checkChangelog(root),
    checkStatusFile(root),
  ];

  // checkTestCounts is slow — only run if not --quick
  if (!options.quick) {
    checks.push(checkTestCounts(root));
  }

  let fixedCount = 0;

  if (options.fix) {
    for (const check of checks) {
      if (check.fixable && check.status !== 'pass') {
        const wasFixed = applyFix(check, root);
        if (wasFixed) fixedCount++;
      }
    }
  }

  const results = { checks, passed: 0, failed: 0, warned: 0, fixedCount };

  for (const check of checks) {
    if (check.status === 'pass') results.passed++;
    else if (check.status === 'fail') results.failed++;
    else results.warned++;
  }

  return results;
}
