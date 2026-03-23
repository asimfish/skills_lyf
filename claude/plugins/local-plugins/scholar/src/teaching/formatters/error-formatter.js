/**
 * Error Formatter: IDE-style output for validation and diff tools
 *
 * Provides consistent, IDE-compatible error formatting with:
 * - file:line:col format (eslint-like)
 * - Color-coded severity levels
 * - Documentation links
 * - Summary statistics
 *
 * @module teaching/formatters/error-formatter
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

/**
 * @typedef {Object} ValidationError
 * @property {'error'|'warning'|'info'} level - Severity level
 * @property {number} line - Line number (1-based)
 * @property {number} [column] - Column number (1-based)
 * @property {string} message - Error message
 * @property {string} [rule] - Rule or schema path that triggered the error
 * @property {string} [docLink] - Documentation link
 * @property {string} [suggestion] - Fix suggestion
 */

/**
 * @typedef {Object} FormatterOptions
 * @property {boolean} [color] - Enable color output (default: true)
 * @property {boolean} [verbose] - Show doc links and suggestions (default: false)
 * @property {string} [cwd] - Current working directory for relative paths
 */

/**
 * Format a single validation error in IDE-style
 * @param {string} file - File path
 * @param {ValidationError} error - Error object
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Formatted error string
 */
export function formatError(file, error, options = {}) {
  const { color = true, verbose = false, cwd = process.cwd() } = options;
  const c = color ? colors : { reset: '', red: '', yellow: '', blue: '', cyan: '', gray: '', bold: '', dim: '' };

  // Make path relative if possible
  const relativePath = file.startsWith(cwd) ? file.slice(cwd.length + 1) : file;

  // Build location string
  const col = error.column ? `:${error.column}` : '';
  const location = `${relativePath}:${error.line}${col}`;

  // Color by severity
  let levelColor;
  let levelText;
  switch (error.level) {
    case 'error':
      levelColor = c.red;
      levelText = 'error';
      break;
    case 'warning':
      levelColor = c.yellow;
      levelText = 'warning';
      break;
    case 'info':
      levelColor = c.blue;
      levelText = 'info';
      break;
    default:
      levelColor = c.gray;
      levelText = error.level;
  }

  // Build main line
  const lines = [`${c.bold}${location}${c.reset}: ${levelColor}${levelText}${c.reset}: ${error.message}`];

  // Add rule if present
  if (error.rule && verbose) {
    lines.push(`  ${c.gray}Rule: ${error.rule}${c.reset}`);
  }

  // Add suggestion if present
  if (error.suggestion) {
    lines.push(`  ${c.cyan}Suggestion: ${error.suggestion}${c.reset}`);
  }

  // Add doc link if verbose
  if (error.docLink && verbose) {
    lines.push(`  ${c.dim}See: ${error.docLink}${c.reset}`);
  }

  return lines.join('\n');
}

/**
 * Format multiple validation errors for a file
 * @param {string} file - File path
 * @param {ValidationError[]} errors - Array of errors
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Formatted errors string
 */
export function formatErrors(file, errors, options = {}) {
  if (errors.length === 0) return '';

  // Sort errors by line number, then column
  const sorted = [...errors].sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return (a.column || 0) - (b.column || 0);
  });

  return sorted.map((err) => formatError(file, err, options)).join('\n');
}

/**
 * Format validation summary statistics
 * @param {Object} stats - Summary statistics
 * @param {number} stats.errors - Error count
 * @param {number} stats.warnings - Warning count
 * @param {number} [stats.info] - Info count
 * @param {number} stats.files - Files checked
 * @param {number} stats.duration - Duration in ms
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Formatted summary string
 */
export function formatSummary(stats, options = {}) {
  const { color = true } = options;
  const c = color ? colors : { reset: '', red: '', yellow: '', blue: '', cyan: '', gray: '', bold: '', dim: '' };

  const parts = [];

  if (stats.errors > 0) {
    parts.push(`${c.red}${stats.errors} error${stats.errors !== 1 ? 's' : ''}${c.reset}`);
  }

  if (stats.warnings > 0) {
    parts.push(`${c.yellow}${stats.warnings} warning${stats.warnings !== 1 ? 's' : ''}${c.reset}`);
  }

  if (stats.info > 0) {
    parts.push(`${c.blue}${stats.info} info${c.reset}`);
  }

  if (parts.length === 0) {
    parts.push(`${c.cyan}✓ All valid${c.reset}`);
  }

  const filesText = `${stats.files} file${stats.files !== 1 ? 's' : ''}`;
  const durationText = `${stats.duration}ms`;

  return `\n${'─'.repeat(55)}\nValidation: ${parts.join(', ')} in ${filesText} (${durationText})`;
}

/**
 * Format a progress bar for validation
 * @param {number} current - Current file index
 * @param {number} total - Total files
 * @param {string} currentFile - Current file name
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Progress bar string
 */
export function formatProgress(current, total, currentFile, options = {}) {
  const { color = true } = options;
  const c = color ? colors : { reset: '', cyan: '', gray: '' };

  const percent = Math.round((current / total) * 100);
  const barWidth = 20;
  const filled = Math.round((current / total) * barWidth);
  const empty = barWidth - filled;

  const bar = `${c.cyan}${'█'.repeat(filled)}${c.gray}${'░'.repeat(empty)}${c.reset}`;
  const fileName = currentFile.length > 20 ? '...' + currentFile.slice(-17) : currentFile;

  return `\rValidating... ${bar} ${percent}% │ ${current}/${total} │ ${fileName}`;
}

/**
 * Format ignore comment hint
 * @param {FormatterOptions} options - Formatter options
 * @returns {string} Ignore hint string
 */
export function formatIgnoreHint(options = {}) {
  const { color = true } = options;
  const c = color ? colors : { reset: '', dim: '' };

  return `  ${c.dim}Add "# scholar-ignore-next-line" to suppress${c.reset}`;
}

/**
 * Check if stdout supports colors
 * @returns {boolean} True if colors are supported
 */
export function supportsColor() {
  // Check NO_COLOR environment variable (standard)
  if (process.env.NO_COLOR !== undefined) return false;

  // Check FORCE_COLOR environment variable
  if (process.env.FORCE_COLOR !== undefined) return true;

  // Check if stdout is a TTY
  if (process.stdout && typeof process.stdout.isTTY === 'boolean') {
    return process.stdout.isTTY;
  }

  return false;
}

/**
 * Format validation result as JSON
 * @param {Object} result - Validation result object
 * @returns {string} JSON string
 */
export function formatAsJson(result) {
  return JSON.stringify(result, null, 2);
}

export default {
  formatError,
  formatErrors,
  formatSummary,
  formatProgress,
  formatIgnoreHint,
  supportsColor,
  formatAsJson
};
