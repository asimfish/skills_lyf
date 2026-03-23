/**
 * Diff Formatter: Terminal output for dry-run change previews
 *
 * Provides color-coded diff output for YAML → JSON synchronization previews.
 * Shows added (+), changed (~), and removed (-) fields with clear formatting.
 *
 * Features:
 * - Color-coded output (green/yellow/red)
 * - Unified diff format for changes
 * - Handles nested objects and arrays
 * - Summary statistics
 *
 * @module teaching/formatters/diff-formatter
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

/**
 * @typedef {Object} DiffChange
 * @property {string} path - Field path (e.g., "week", "activities[0].duration")
 * @property {*} [value] - New value (for added fields)
 * @property {*} [from] - Old value (for changed fields)
 * @property {*} [to] - New value (for changed fields)
 * @property {string} [fromType] - Old type (for type changes)
 * @property {string} [toType] - New type (for type changes)
 * @property {string} [reason] - Change reason (for array length changes)
 */

/**
 * @typedef {Object} DiffChanges
 * @property {string} status - 'in-sync' | 'out-of-sync' | 'never-synced'
 * @property {DiffChange[]} added - Added fields
 * @property {DiffChange[]} changed - Changed fields
 * @property {DiffChange[]} removed - Removed fields
 * @property {string[]} unchanged - Unchanged field paths
 * @property {string} [error] - Parse error (if any)
 */

/**
 * @typedef {Object} FormatterOptions
 * @property {boolean} [color] - Enable color output (default: true)
 * @property {boolean} [verbose] - Show unchanged fields (default: false)
 * @property {number} [maxValueLength] - Maximum value length to display (default: 80)
 */

/**
 * Check if terminal supports color
 * @returns {boolean} True if colors supported
 */
export function supportsColor() {
  return (
    process.stdout.isTTY &&
    process.env.TERM !== 'dumb' &&
    !process.env.NO_COLOR &&
    process.env.FORCE_COLOR !== '0'
  );
}

/**
 * Format a value for display (truncate if too long)
 * @param {*} value - Value to format
 * @param {number} maxLength - Maximum length
 * @returns {string} Formatted value
 */
function formatValue(value, maxLength = 80) {
  if (value === null || value === undefined) {
    return String(value);
  }

  let str;
  if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else if (typeof value === 'string') {
    str = `"${value}"`;
  } else {
    str = String(value);
  }

  if (str.length > maxLength) {
    return str.slice(0, maxLength - 3) + '...';
  }

  return str;
}

/**
 * Format a single change line
 * @param {string} symbol - Change symbol (+, ~, -)
 * @param {string} color - ANSI color code
 * @param {string} path - Field path
 * @param {string} description - Change description
 * @param {Object} colors - Color codes object
 * @returns {string} Formatted line
 */
function formatChangeLine(symbol, color, path, description, colors) {
  return `      ${color}${symbol}${colors.reset} ${colors.dim}${path}${colors.reset}: ${description}`;
}

/**
 * Format diff changes for a single file
 * @param {string} yamlPath - Relative YAML file path
 * @param {string} jsonPath - Relative JSON file path
 * @param {DiffChanges} changes - Change diff object
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Formatted diff output
 */
export function formatFileDiff(yamlPath, jsonPath, changes, options = {}) {
  const { color = true, verbose = false, maxValueLength = 80 } = options;
  const c = color ? colors : { reset: '', red: '', green: '', yellow: '', blue: '', cyan: '', gray: '', bold: '', dim: '' };

  const lines = [];

  // Determine status indicator
  let statusIcon, statusColor;
  if (changes.status === 'in-sync') {
    statusIcon = '✓';
    statusColor = c.green;
  } else if (changes.status === 'never-synced') {
    statusIcon = '○';
    statusColor = c.yellow;
  } else if (changes.status === 'out-of-sync') {
    statusIcon = '⚠';
    statusColor = c.yellow;
  } else {
    statusIcon = '?';
    statusColor = c.gray;
  }

  // File header
  if (changes.status === 'in-sync') {
    lines.push(`  ${statusColor}${statusIcon}${c.reset} ${yamlPath} → ${jsonPath} ${c.dim}(unchanged)${c.reset}`);
    return lines.join('\n');
  }

  if (changes.error) {
    lines.push(`  ${c.red}✗${c.reset} ${yamlPath} → ${c.dim}(${changes.error})${c.reset}`);
    return lines.join('\n');
  }

  // Status line
  const statusText = changes.status === 'never-synced' ? 'never synced' : 'would update';
  lines.push(`  ${statusColor}${statusIcon}${c.reset} ${yamlPath} → ${jsonPath} ${c.dim}(${statusText})${c.reset}`);

  // Show added fields
  if (changes.added.length > 0) {
    for (const change of changes.added) {
      const valueStr = formatValue(change.value, maxValueLength);
      lines.push(formatChangeLine('+', c.green, change.path, valueStr, c));
    }
  }

  // Show changed fields
  if (changes.changed.length > 0) {
    for (const change of changes.changed) {
      let description;
      if (change.fromType && change.toType) {
        // Type change
        description = `${change.fromType} → ${change.toType}`;
      } else if (change.reason) {
        // Array length change or other reason
        description = change.reason;
      } else {
        // Value change
        const fromStr = formatValue(change.from, maxValueLength / 2);
        const toStr = formatValue(change.to, maxValueLength / 2);
        description = `${fromStr} → ${toStr}`;
      }
      lines.push(formatChangeLine('~', c.yellow, change.path, description, c));
    }
  }

  // Show removed fields
  if (changes.removed.length > 0) {
    for (const change of changes.removed) {
      const valueStr = formatValue(change.value, maxValueLength);
      lines.push(formatChangeLine('-', c.red, change.path, valueStr, c));
    }
  }

  // Show unchanged fields (verbose mode only)
  if (verbose && changes.unchanged.length > 0) {
    lines.push(`      ${c.dim}(${changes.unchanged.length} field(s) unchanged)${c.reset}`);
  }

  return lines.join('\n');
}

/**
 * Format summary statistics for batch sync
 * @param {Array<Object>} results - Sync results with change diffs
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Formatted summary
 */
export function formatDiffSummary(results, options = {}) {
  const { color = true } = options;
  const c = color ? colors : { reset: '', red: '', green: '', yellow: '', blue: '', cyan: '', gray: '', bold: '', dim: '' };

  // Count results by status
  let inSyncCount = 0;
  let wouldUpdateCount = 0;
  let errorCount = 0;
  let neverSyncedCount = 0;

  for (const result of results) {
    if (!result.success || result.error) {
      errorCount++;
    } else if (result.dryRun && result.changes) {
      if (result.changes.status === 'in-sync') {
        inSyncCount++;
      } else if (result.changes.status === 'never-synced') {
        neverSyncedCount++;
      } else if (result.changes.status === 'out-of-sync') {
        wouldUpdateCount++;
      }
    } else if (result.skipped) {
      inSyncCount++;
    } else {
      wouldUpdateCount++;
    }
  }

  const lines = [];
  lines.push('');
  lines.push(`${c.bold}Summary:${c.reset}`);

  if (inSyncCount > 0) {
    lines.push(`  ${c.green}✓${c.reset} ${inSyncCount} file(s) in sync (no changes)`);
  }

  if (wouldUpdateCount > 0) {
    lines.push(`  ${c.yellow}⚠${c.reset} ${wouldUpdateCount} file(s) would be updated`);
  }

  if (neverSyncedCount > 0) {
    lines.push(`  ${c.yellow}○${c.reset} ${neverSyncedCount} file(s) never synced (would create JSON)`);
  }

  if (errorCount > 0) {
    lines.push(`  ${c.red}✗${c.reset} ${errorCount} file(s) have errors`);
  }

  // Add follow-up message
  if (wouldUpdateCount > 0 || neverSyncedCount > 0) {
    lines.push('');
    lines.push(`${c.cyan}Run without --dry-run to apply these changes.${c.reset}`);
  }

  if (errorCount > 0) {
    lines.push(`${c.cyan}Use --fix to auto-fix errors (if available).${c.reset}`);
  }

  return lines.join('\n');
}

/**
 * Format full dry-run report (header + files + summary)
 * @param {Array<Object>} results - Sync results with change diffs
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Complete formatted report
 */
export function formatDryRunReport(results, options = {}) {
  const { color = true } = options;
  const c = color ? colors : { reset: '', red: '', green: '', yellow: '', blue: '', cyan: '', gray: '', bold: '', dim: '' };

  const lines = [];

  // Header
  lines.push(`${c.bold}${c.cyan}Dry-run mode: No files will be modified${c.reset}`);
  lines.push('');
  lines.push(`${c.bold}YAML → JSON sync preview:${c.reset}`);

  // File-by-file diffs
  for (const result of results) {
    if (result.dryRun && result.changes) {
      const relativePath = result.yamlPath;
      const jsonPath = result.jsonPath;
      lines.push(formatFileDiff(relativePath, jsonPath, result.changes, options));
    } else if (!result.success && result.error) {
      // Error case
      lines.push(`  ${c.red}✗${c.reset} ${result.yamlPath} → ${c.dim}(${result.error})${c.reset}`);
    }
  }

  // Summary
  lines.push(formatDiffSummary(results, options));

  return lines.join('\n');
}

/**
 * Format a simple change summary (one-liner)
 * @param {DiffChanges} changes - Change diff object
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} One-line summary
 */
export function formatChangeSummary(changes, options = {}) {
  const { color = true } = options;
  const c = color ? colors : { reset: '', red: '', green: '', yellow: '', blue: '', cyan: '', gray: '', bold: '', dim: '' };

  if (changes.status === 'in-sync') {
    return `${c.green}✓ No changes${c.reset}`;
  }

  if (changes.error) {
    return `${c.red}✗ Error: ${changes.error}${c.reset}`;
  }

  const parts = [];
  if (changes.added.length > 0) {
    parts.push(`${c.green}+${changes.added.length}${c.reset}`);
  }
  if (changes.changed.length > 0) {
    parts.push(`${c.yellow}~${changes.changed.length}${c.reset}`);
  }
  if (changes.removed.length > 0) {
    parts.push(`${c.red}-${changes.removed.length}${c.reset}`);
  }

  if (parts.length === 0) {
    return `${c.dim}(no changes)${c.reset}`;
  }

  return parts.join(' ');
}

/**
 * Export all formatters
 */
export default {
  formatFileDiff,
  formatDiffSummary,
  formatDryRunReport,
  formatChangeSummary,
  supportsColor
};
