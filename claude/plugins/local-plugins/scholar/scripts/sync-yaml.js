#!/usr/bin/env node

/**
 * YAML → JSON Sync Script
 *
 * Called by pre-commit hook or manually to sync all YAML configs.
 *
 * Usage:
 *   node scripts/sync-yaml.js           # Sync changed files
 *   node scripts/sync-yaml.js --all     # Sync all files
 *   node scripts/sync-yaml.js --force   # Force sync (ignore cache)
 *   node scripts/sync-yaml.js --status  # Show sync status
 *   node scripts/sync-yaml.js --debug   # Enable debug logging
 *
 * Exit codes:
 *   0 - Success (all files synced or unchanged)
 *   1 - Errors occurred
 */

import { ConfigSyncEngine } from '../src/teaching/config/sync-engine.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import globCallback from 'glob';

// Promisify glob for async/await usage (glob v7.x compatibility)
const glob = promisify(globCallback);

const args = process.argv.slice(2);
const forceSync = args.includes('--force') || args.includes('-f');
const showStatus = args.includes('--status') || args.includes('-s');
const syncAll = args.includes('--all') || args.includes('-a');
const debug = args.includes('--debug') || args.includes('-d') || process.env.SCHOLAR_DEBUG === 'true';
const quiet = args.includes('--quiet') || args.includes('-q');

const cwd = process.cwd();

// Check if this is a teaching project
const hasLessonPlans = existsSync(join(cwd, 'content', 'lesson-plans'));
const hasClaudeConfig = existsSync(join(cwd, '.claude'));

if (!hasLessonPlans && !hasClaudeConfig) {
  if (!quiet) {
    console.log('No YAML configs found (content/lesson-plans/ or .claude/)');
  }
  process.exit(0);
}

const engine = new ConfigSyncEngine({
  rootDir: cwd,
  debug
});

// Build patterns
const patterns = [];
if (hasLessonPlans) {
  patterns.push('content/lesson-plans/**/*.yml');
  patterns.push('content/lesson-plans/**/*.yaml');
}
if (hasClaudeConfig) {
  patterns.push('.claude/**/*.yml');
  patterns.push('.claude/**/*.yaml');
}

async function main() {
  if (showStatus) {
    // Show sync status for all files
    let hasOutOfSync = false;

    console.log('YAML → JSON Sync Status\n');

    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd, absolute: true });
      for (const file of files) {
        const status = engine.getSyncStatus(file);
        const indicator = status.inSync ? '✓' : status.status === 'never-synced' ? '○' : '✗';
        const color =
          status.inSync ? '\x1b[32m' : status.status === 'never-synced' ? '\x1b[33m' : '\x1b[31m';
        const reset = '\x1b[0m';

        const relativePath = file.replace(cwd + '/', '');
        console.log(`${color}${indicator}${reset} ${relativePath} (${status.status})`);

        if (!status.inSync && status.status !== 'never-synced') {
          hasOutOfSync = true;
        }
      }
    }

    if (hasOutOfSync) {
      console.log('\nRun `node scripts/sync-yaml.js` to sync out-of-date files.');
    }

    return;
  }

  // Sync files
  const startTime = Date.now();

  if (!quiet) {
    console.log('Syncing YAML → JSON...');
  }

  const results = await engine.syncAll({
    patterns,
    force: forceSync || syncAll
  });

  // Summarize results
  const synced = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.success);

  const totalDuration = Date.now() - startTime;

  if (!quiet) {
    // Show individual results
    for (const result of synced) {
      const relativePath = result.yamlPath.replace(cwd + '/', '');
      const jsonRelative = result.jsonPath.replace(cwd + '/', '');
      console.log(`├─ ✓ ${relativePath} → ${jsonRelative} (${result.duration}ms)`);
    }

    for (const result of skipped) {
      const relativePath = result.yamlPath.replace(cwd + '/', '');
      if (debug) {
        console.log(`├─ ○ ${relativePath} (unchanged)`);
      }
    }

    for (const result of failed) {
      const relativePath = result.yamlPath.replace(cwd + '/', '');
      console.log(`├─ ✗ ${relativePath}`);
      console.log(`│   └─ ${result.error}`);
    }

    // Summary
    console.log(`└─ Done: ${synced.length} synced, ${skipped.length} unchanged, ${failed.length} failed (${totalDuration}ms)`);
  }

  // Exit with error if any files failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Sync error:', err.message);
  process.exit(1);
});
