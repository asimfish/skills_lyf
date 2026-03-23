/**
 * Pre-Command Hook: Ensure YAML→JSON sync before Scholar commands
 *
 * This hook runs before any /teaching:* command to ensure:
 * 1. All YAML configs are synced to JSON
 * 2. Schema validation passes (warnings allowed)
 * 3. Sync status is logged for debugging
 *
 * @module teaching/config/pre-command-hook
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { ConfigSyncEngine } from './sync-engine.js';

/**
 * @typedef {Object} PreCommandResult
 * @property {boolean} success - Whether pre-command checks passed
 * @property {boolean} syncRequired - Whether any files needed syncing
 * @property {number} syncedCount - Number of files synced
 * @property {number} skippedCount - Number of files skipped (unchanged)
 * @property {number} failedCount - Number of files that failed to sync
 * @property {string[]} warnings - Warnings from sync/validation
 * @property {string[]} errors - Errors that should block execution
 * @property {number} duration - Total duration in milliseconds
 */

/**
 * @typedef {Object} PreCommandOptions
 * @property {string} command - Scholar command being run (e.g., "teaching:lecture")
 * @property {string} cwd - Current working directory
 * @property {boolean} [debug] - Enable debug logging
 * @property {boolean} [strict] - Block on validation errors
 * @property {boolean} [skipSync] - Skip sync (for testing)
 */

/**
 * Ensure YAML files are synced before running a Scholar command
 * @param {PreCommandOptions} options - Hook options
 * @returns {Promise<PreCommandResult>} Pre-command result
 */
export async function ensureSynced(options) {
  const startTime = Date.now();
  const { command, cwd = process.cwd(), debug = false, strict = false, skipSync = false } = options;

  const debugLog = (msg) => {
    if (debug || process.env.SCHOLAR_DEBUG) {
      console.log(`[scholar:pre-command] ${msg}`);
    }
  };

  debugLog(`Pre-command hook for: ${command}`);
  debugLog(`Working directory: ${cwd}`);

  const result = {
    success: true,
    syncRequired: false,
    syncedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    warnings: [],
    errors: [],
    duration: 0
  };

  // Check if this is a teaching project
  const hasLessonPlans = existsSync(join(cwd, 'content', 'lesson-plans'));
  const hasClaudeConfig = existsSync(join(cwd, '.claude'));
  const hasFlowConfig = existsSync(join(cwd, '.flow', 'teach-config.yml'));

  if (!hasLessonPlans && !hasClaudeConfig && !hasFlowConfig) {
    debugLog('No teaching config found, skipping sync');
    result.duration = Date.now() - startTime;
    return result;
  }

  // Skip sync if requested
  if (skipSync) {
    debugLog('Sync skipped (skipSync=true)');
    result.duration = Date.now() - startTime;
    return result;
  }

  // Run sync
  try {
    const engine = new ConfigSyncEngine({
      rootDir: cwd,
      debug
    });

    // Build patterns based on what exists
    const patterns = [];
    if (hasLessonPlans) {
      patterns.push('content/lesson-plans/**/*.yml');
      patterns.push('content/lesson-plans/**/*.yaml');
    }
    if (hasClaudeConfig) {
      patterns.push('.claude/**/*.yml');
      patterns.push('.claude/**/*.yaml');
    }

    debugLog(`Sync patterns: ${patterns.join(', ')}`);

    const syncResults = await engine.syncAll({ patterns });

    // Process results
    for (const syncResult of syncResults) {
      if (syncResult.skipped) {
        result.skippedCount++;
      } else if (syncResult.success) {
        result.syncedCount++;
        result.syncRequired = true;
      } else {
        result.failedCount++;
        result.errors.push(syncResult.error);
      }

      if (syncResult.warnings?.length > 0) {
        result.warnings.push(...syncResult.warnings);
      }
    }

    // Determine overall success
    if (result.failedCount > 0 && strict) {
      result.success = false;
    }

    debugLog(`Sync complete: ${result.syncedCount} synced, ${result.skippedCount} skipped, ${result.failedCount} failed`);
  } catch (err) {
    debugLog(`Sync error: ${err.message}`);
    result.errors.push(err.message);
    if (strict) {
      result.success = false;
    }
  }

  result.duration = Date.now() - startTime;
  debugLog(`Pre-command hook complete in ${result.duration}ms`);

  return result;
}

/**
 * Format pre-command result for display
 * @param {PreCommandResult} result - Pre-command result
 * @returns {string} Formatted message
 */
export function formatPreCommandResult(result) {
  const lines = [];

  if (result.syncRequired) {
    lines.push(`Synced ${result.syncedCount} file(s) in ${result.duration}ms`);
  }

  if (result.skippedCount > 0) {
    lines.push(`${result.skippedCount} file(s) unchanged`);
  }

  if (result.warnings.length > 0) {
    lines.push(`Warnings: ${result.warnings.length}`);
    for (const warning of result.warnings.slice(0, 3)) {
      lines.push(`  - ${warning}`);
    }
    if (result.warnings.length > 3) {
      lines.push(`  ... and ${result.warnings.length - 3} more`);
    }
  }

  if (result.errors.length > 0) {
    lines.push(`Errors: ${result.errors.length}`);
    for (const error of result.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join('\n');
}

/**
 * Check if pre-command hook should run for a given command
 * @param {string} command - Command name
 * @returns {boolean} True if hook should run
 */
export function shouldRunPreCommandHook(command) {
  // List of commands that need sync
  const syncRequiredCommands = [
    'teaching:lecture',
    'teaching:slides',
    'teaching:exam',
    'teaching:quiz',
    'teaching:assignment',
    'teaching:syllabus',
    'teaching:rubric',
    'teaching:feedback'
    // Note: teaching:demo doesn't need sync (creates new config)
  ];

  return syncRequiredCommands.some(
    (cmd) => command === cmd || command.startsWith(`${cmd} `) || command === `/scholar:${cmd.split(':')[1]}`
  );
}

export default ensureSynced;
