/**
 * R Code Validator — Pure Utility Functions
 *
 * Provides parsing, script generation, and report formatting for
 * validating R code chunks in .qmd files via Rscript.
 *
 * All functions are pure and testable without R installed.
 * I/O and Rscript execution are handled by the validate-r command.
 *
 * Used by: /teaching:validate-r
 */

import { readdirSync, existsSync, statSync } from 'fs';
import { join, basename, extname, dirname, relative } from 'path';

// ─────────────────────────────────────────────────────────────
// Chunk Extraction
// ─────────────────────────────────────────────────────────────

/**
 * Parse .qmd content and extract R code chunks
 *
 * Extracts fenced ```{r} blocks only (ignores Python, bash, inline R).
 * Auto-numbers unnamed chunks as chunk-1, chunk-2, etc.
 *
 * @param {string} qmdContent - Raw .qmd file content
 * @returns {Array<{label: string, code: string, options: Object, lineNumber: number}>}
 */
export function extractRChunks(qmdContent) {
  const chunks = [];
  const lines = qmdContent.split('\n');
  let unnamedCounter = 0;
  let inChunk = false;
  let currentChunk = null;
  let fenceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inChunk) {
      // Match opening fence: ```{r} or ```{r label} or ```{r, options}
      const openMatch = line.match(/^(`{3,})\{r\s*([^}]*)\}\s*$/);
      if (openMatch) {
        fenceDepth = openMatch[1].length;
        const rawLabel = openMatch[2].trim();

        // Parse label and inline comma-separated options
        let label = '';
        const inlineOpts = {};

        if (rawLabel) {
          // Handle: {r label, echo=FALSE} or {r, echo=FALSE} or {r label}
          const parts = rawLabel.split(',').map(s => s.trim());
          const first = parts[0];

          // First part is label if it doesn't contain '='
          if (first && !first.includes('=')) {
            label = sanitizeLabel(first);
            parts.shift();
          }

          // Remaining parts are inline options
          for (const part of parts) {
            if (part.includes('=')) {
              const [key, ...valParts] = part.split('=');
              const val = valParts.join('=').trim();
              inlineOpts[key.trim()] = parseOptionValue(val);
            }
          }
        }

        if (!label) {
          unnamedCounter++;
          label = `chunk-${unnamedCounter}`; // auto-numbered labels are already safe
        }

        currentChunk = {
          label,
          code: '',
          options: { ...inlineOpts },
          lineNumber: i + 1 // 1-indexed
        };
        inChunk = true;
        continue;
      }
    } else {
      // Check for closing fence (must be same depth or greater)
      const closeMatch = line.match(/^(`{3,})\s*$/);
      if (closeMatch && closeMatch[1].length >= fenceDepth) {
        inChunk = false;
        chunks.push(currentChunk);
        currentChunk = null;
        continue;
      }

      // Parse #| YAML-style chunk options
      if (line.startsWith('#|')) {
        const optLine = line.slice(2).trim();
        const parsed = parseChunkOptions(optLine);
        Object.assign(currentChunk.options, parsed);
        continue;
      }

      // Accumulate code lines
      if (currentChunk.code) {
        currentChunk.code += '\n' + line;
      } else {
        currentChunk.code = line;
      }
    }
  }

  // Handle unclosed chunk (shouldn't happen in valid .qmd, but be safe)
  if (inChunk && currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Parse a single #| option line (YAML-style)
 *
 * @param {string} optionsStr - e.g. "eval: false" or "echo: true"
 * @returns {Object} Parsed key-value pair
 */
export function parseChunkOptions(optionsStr) {
  const result = {};
  if (!optionsStr) return result;

  // Handle "key: value" format
  const match = optionsStr.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    result[key] = parseOptionValue(val);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Chunk Filtering
// ─────────────────────────────────────────────────────────────

/**
 * Determine if a chunk should be validated (executed)
 *
 * A chunk is validated unless eval is explicitly set to false.
 * Missing eval option defaults to true (R default behavior).
 *
 * @param {Object} chunk - Chunk from extractRChunks
 * @returns {boolean} Whether the chunk should be run
 */
export function shouldValidateChunk(chunk) {
  const evalOpt = chunk.options?.eval;
  if (evalOpt === false || evalOpt === 'false' || evalOpt === 'FALSE') {
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// Script Generation
// ─────────────────────────────────────────────────────────────

/**
 * Build a validation .R script from chunks
 *
 * Wraps each chunk in tryCatch for isolated error reporting.
 * Uses pdf(NULL) to suppress plot output.
 * Sets working directory to project root.
 *
 * @param {Array} chunks - Chunks to validate (already filtered by shouldValidateChunk)
 * @param {Object} opts - Build options
 * @param {string} [opts.projectRoot] - Working directory (default: '.')
 * @param {string} [opts.dataDir] - Data directory path
 * @param {string} [opts.setup] - Extra R setup code to prepend
 * @param {number} [opts.timeout] - Per-chunk timeout in seconds (default: 30)
 * @returns {string} Complete .R script content
 */
export function buildValidationScript(chunks, opts = {}) {
  const {
    projectRoot = '.',
    dataDir,
    setup,
    timeout = 30
  } = opts;

  const scriptLines = [];

  // Header
  scriptLines.push('# Auto-generated by /teaching:validate-r');
  scriptLines.push('# Do not edit — this file is temporary');
  scriptLines.push('');

  // Set working directory
  scriptLines.push(`setwd("${escapeRString(projectRoot)}")`);
  scriptLines.push('');

  // Suppress plot output
  scriptLines.push('pdf(NULL)');
  scriptLines.push('');

  // Suppress package startup messages
  scriptLines.push('options(warn = 1)');
  scriptLines.push('suppressPackageStartupMessages({');
  scriptLines.push('  # Package loading happens in user chunks');
  scriptLines.push('  invisible(NULL)');
  scriptLines.push('})');
  scriptLines.push('');

  // User setup code
  if (setup) {
    scriptLines.push('# --- User setup ---');
    scriptLines.push(setup);
    scriptLines.push('# --- End user setup ---');
    scriptLines.push('');
  }

  // Data directory info
  if (dataDir) {
    scriptLines.push(`# Data directory: ${dataDir}`);
    scriptLines.push('');
  }

  // Process each chunk
  if (chunks.length === 0) {
    scriptLines.push('cat("[INFO] No R chunks to validate\\n")');
  }

  for (const chunk of chunks) {
    scriptLines.push(`# --- Chunk: ${chunk.label} (line ${chunk.lineNumber}) ---`);
    scriptLines.push(`cat("[RUNNING] ${escapeRString(chunk.label)}\\n")`);
    scriptLines.push('tryCatch(');
    scriptLines.push('  withCallingHandlers({');

    // Indent chunk code
    const codeLines = chunk.code.split('\n');
    for (const codeLine of codeLines) {
      scriptLines.push(`    ${codeLine}`);
    }

    // Newline before marker ensures it starts on its own line
    // even if user code uses cat() without trailing newline
    scriptLines.push(`    cat("\\n[PASS] ${escapeRString(chunk.label)}\\n")`);
    scriptLines.push('  }, warning = function(w) {');
    scriptLines.push(`    cat(paste0("\\n[WARN] ${escapeRString(chunk.label)}: ", conditionMessage(w), "\\n"))`);
    scriptLines.push('    invokeRestart("muffleWarning")');
    scriptLines.push('  }),');
    scriptLines.push('  error = function(e) {');
    scriptLines.push(`    cat(paste0("\\n[FAIL] ${escapeRString(chunk.label)}: ", conditionMessage(e), "\\n"))`);
    scriptLines.push('  }');
    scriptLines.push(')');
    scriptLines.push('');
  }

  // Close pdf device
  scriptLines.push('invisible(dev.off())');

  return scriptLines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// Output Parsing
// ─────────────────────────────────────────────────────────────

/**
 * Parse Rscript stdout/stderr into a structured validation report
 *
 * @param {string} stdout - Rscript stdout
 * @param {string} stderr - Rscript stderr
 * @param {number} exitCode - Process exit code
 * @returns {Object} Structured report with results array and summary
 */
export function parseValidationOutput(stdout, stderr, exitCode) {
  const results = [];
  const lines = (stdout || '').split('\n').filter(l => l.trim());

  for (const line of lines) {
    const passMatch = line.match(/^\[PASS\]\s+(.+)$/);
    if (passMatch) {
      results.push({ label: passMatch[1], status: 'PASS', message: null });
      continue;
    }

    const failMatch = line.match(/^\[FAIL\]\s+([^:]+):\s*(.+)$/);
    if (failMatch) {
      results.push({ label: failMatch[1].trim(), status: 'FAIL', message: failMatch[2].trim() });
      continue;
    }

    const warnMatch = line.match(/^\[WARN\]\s+([^:]+):\s*(.+)$/);
    if (warnMatch) {
      results.push({ label: warnMatch[1].trim(), status: 'WARN', message: warnMatch[2].trim() });
      continue;
    }

    // Ignore [RUNNING] and [INFO] lines
  }

  // Stderr may contain additional error info
  const stderrMessages = [];
  if (stderr) {
    const stderrLines = stderr.split('\n').filter(l => l.trim());
    for (const line of stderrLines) {
      // Skip common R noise
      if (line.startsWith('Loading required package:')) continue;
      if (line.startsWith('Attaching package:')) continue;
      if (line.match(/^The following objects are masked/)) continue;
      if (line.match(/^\s+from /)) continue;
      stderrMessages.push(line);
    }
  }

  const summary = {
    pass: results.filter(r => r.status === 'PASS').length,
    fail: results.filter(r => r.status === 'FAIL').length,
    warn: results.filter(r => r.status === 'WARN').length,
    skip: 0, // Skipped chunks are added by the caller (not sent to Rscript)
    total: results.length,
    exitCode,
    stderr: stderrMessages.length > 0 ? stderrMessages.join('\n') : null
  };

  return { results, summary };
}

// ─────────────────────────────────────────────────────────────
// Data File Discovery
// ─────────────────────────────────────────────────────────────

/**
 * Scan a directory for data files (.txt, .csv, .tsv, .dat)
 *
 * @param {string} dataDir - Path to data directory
 * @returns {Array<{name: string, path: string, ext: string}>} List of data files
 */
export function scanDataFiles(dataDir) {
  if (!dataDir || !existsSync(dataDir)) {
    return [];
  }

  try {
    const stat = statSync(dataDir);
    if (!stat.isDirectory()) return [];

    const dataExtensions = ['.txt', '.csv', '.tsv', '.dat'];
    const entries = readdirSync(dataDir);

    return entries
      .filter(name => {
        const ext = extname(name).toLowerCase();
        return dataExtensions.includes(ext);
      })
      .map(name => ({
        name,
        path: join(dataDir, name),
        ext: extname(name).toLowerCase()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Report Formatting
// ─────────────────────────────────────────────────────────────

/**
 * Format validation results as eslint-style text report
 *
 * @param {Object} report - From parseValidationOutput
 * @param {Array} [skippedChunks] - Chunks that were skipped (eval: false)
 * @param {string} [filePath] - Source file path for header
 * @returns {string} Formatted report text
 */
export function formatValidationReport(report, skippedChunks = [], filePath = '') {
  const lines = [];

  if (filePath) {
    lines.push(filePath);
  }

  // Combine results with skip entries
  const allEntries = [
    ...report.results.map(r => ({ ...r })),
    ...skippedChunks.map(c => ({ label: c.label, status: 'SKIP', message: 'eval: false' }))
  ];

  if (allEntries.length === 0) {
    lines.push('  No R chunks found');
    return lines.join('\n');
  }

  // Find max label length for alignment
  const maxLabelLen = Math.max(...allEntries.map(e => e.label.length));

  for (const entry of allEntries) {
    const padding = '.'.repeat(Math.max(3, maxLabelLen - entry.label.length + 3));
    let statusStr;

    switch (entry.status) {
      case 'PASS':
        statusStr = 'PASS';
        break;
      case 'FAIL':
        statusStr = `FAIL: ${entry.message}`;
        break;
      case 'WARN':
        statusStr = `WARN: ${entry.message}`;
        break;
      case 'SKIP':
        statusStr = `SKIP (${entry.message})`;
        break;
      default:
        statusStr = entry.status;
    }

    lines.push(`  chunk "${entry.label}" ${padding} ${statusStr}`);
  }

  // Summary line
  const totalSkip = skippedChunks.length;
  const summary = report.summary;
  const parts = [];
  if (summary.pass > 0) parts.push(`${summary.pass} passed`);
  if (summary.fail > 0) parts.push(`${summary.fail} failed`);
  if (summary.warn > 0) parts.push(`${summary.warn} warnings`);
  if (totalSkip > 0) parts.push(`${totalSkip} skipped`);

  lines.push('');
  lines.push(`  Result: ${parts.join(', ')}`);

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// Context Extraction (for /teaching:solution)
// ─────────────────────────────────────────────────────────────

/**
 * Extract summary headers and R chunks from a .qmd file
 *
 * Used by /teaching:solution to gather lecture/lab context without
 * including the full 20-40 page content.
 *
 * @param {string} qmdContent - Raw .qmd file content
 * @returns {{ headers: string[], rChunks: Array<{label: string, code: string}> }}
 */
export function extractSummaryAndChunks(qmdContent) {
  const headers = [];
  const rChunks = extractRChunks(qmdContent);

  const lines = qmdContent.split('\n');
  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      headers.push({
        level: headerMatch[1].length,
        text: headerMatch[2].trim()
      });
    }
  }

  return {
    headers,
    rChunks: rChunks.map(c => ({
      label: c.label,
      code: c.code
    }))
  };
}

/**
 * Find the matching lecture file for an assignment
 *
 * Matches by week number first, then falls back to topic keyword matching
 * via YAML frontmatter title.
 *
 * @param {string} assignmentPath - Path to the assignment file
 * @param {string} root - Project root directory
 * @returns {{ path: string, matchType: string } | null}
 */
export function findMatchingLecture(assignmentPath, root) {
  return findMatchingContent(assignmentPath, root, 'lectures');
}

/**
 * Find the matching lab file for an assignment
 *
 * Same matching logic as findMatchingLecture.
 *
 * @param {string} assignmentPath - Path to the assignment file
 * @param {string} root - Project root directory
 * @returns {{ path: string, matchType: string } | null}
 */
export function findMatchingLab(assignmentPath, root) {
  return findMatchingContent(assignmentPath, root, 'labs');
}

/**
 * Internal: Find matching content file by week number or topic keyword
 *
 * @param {string} assignmentPath - Path to the assignment file
 * @param {string} root - Project root directory
 * @param {string} contentDir - 'lectures' or 'labs'
 * @returns {{ path: string, matchType: string } | null}
 */
function findMatchingContent(assignmentPath, root, contentDir) {
  const dirPath = join(root, contentDir);
  if (!existsSync(dirPath)) return null;

  const assignmentName = basename(assignmentPath, extname(assignmentPath));

  // Extract week number from assignment filename
  // Patterns: assignment4, hw3, week-04, assignment_week3
  const weekMatch = assignmentName.match(/(?:week[_-]?|assignment|hw)(\d+)/i);
  const weekNum = weekMatch ? parseInt(weekMatch[1], 10) : null;

  // Extract topic keywords from assignment filename
  // e.g., "assignment4_checking_model_assumptions" → ["checking", "model", "assumptions"]
  const topicWords = assignmentName
    .replace(/^(assignment|hw)\d*[_-]*/i, '')
    .split(/[_-]+/)
    .filter(w => w.length > 2)
    .map(w => w.toLowerCase());

  let entries;
  try {
    entries = readdirSync(dirPath).filter(f => f.endsWith('.qmd') || f.endsWith('.md'));
  } catch {
    return null;
  }

  // Strategy 1: Match by week number
  if (weekNum !== null) {
    for (const entry of entries) {
      const entryWeekMatch = entry.match(/week[_-]?0*(\d+)/i);
      if (entryWeekMatch && parseInt(entryWeekMatch[1], 10) === weekNum) {
        return {
          path: join(dirPath, entry),
          matchType: 'week-number'
        };
      }
    }
  }

  // Strategy 2: Match by topic keywords
  if (topicWords.length > 0) {
    let bestMatch = null;
    let bestScore = 0;

    for (const entry of entries) {
      const entryName = entry.toLowerCase();
      let score = 0;
      for (const word of topicWords) {
        if (entryName.includes(word)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore > 0) {
      return {
        path: join(dirPath, bestMatch),
        matchType: 'topic-keyword'
      };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Error Suggestions
// ─────────────────────────────────────────────────────────────

/**
 * Suggest package installation for missing package errors
 *
 * @param {string} errorMsg - Error message from R
 * @returns {string|null} install.packages() suggestion, or null
 */
export function suggestPackageInstall(errorMsg) {
  if (!errorMsg) return null;

  // Pattern: "there is no package called 'pkg'"
  const noPackageMatch = errorMsg.match(/there is no package called '([^']+)'/);
  if (noPackageMatch) {
    return `install.packages("${noPackageMatch[1]}")`;
  }

  // Pattern: "could not find function "fn""  — may indicate missing package
  const noFunctionMatch = errorMsg.match(/could not find function "([^"]+)"/);
  if (noFunctionMatch) {
    const fn = noFunctionMatch[1];
    // Common function → package mappings
    const knownMappings = {
      'qqPlot': 'car',
      'leveneTest': 'car',
      'p_load': 'pacman',
      'tidy': 'broom',
      'kable': 'knitr',
      'emmeans': 'emmeans',
      'check_model': 'performance',
      'here': 'here',
      'ggplot': 'ggplot2',
      'read_csv': 'readr',
      'tibble': 'tibble',
      'mutate': 'dplyr',
      'filter': 'dplyr',
      'select': 'dplyr',
      'pivot_longer': 'tidyr',
      'pivot_wider': 'tidyr'
    };

    const pkg = knownMappings[fn];
    if (pkg) {
      return `install.packages("${pkg}")  # provides ${fn}()`;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Static Lint
// ─────────────────────────────────────────────────────────────

/**
 * Run static lint checks on an R chunk
 *
 * Detects common anti-patterns without executing code.
 *
 * @param {Object} chunk - Chunk from extractRChunks
 * @returns {Array<{rule: string, message: string, severity: string}>}
 */
export function lintRChunk(chunk) {
  const warnings = [];
  const code = chunk.code || '';

  // Rule: setwd() usage
  if (/\bsetwd\s*\(/.test(code)) {
    warnings.push({
      rule: 'no-setwd',
      message: 'Avoid setwd() — use here::here() or relative paths instead',
      severity: 'warning'
    });
  }

  // Rule: Absolute paths (Windows or Unix)
  if (/["'][A-Z]:\\/.test(code) || /["']\/Users\//.test(code) || /["']\/home\//.test(code)) {
    warnings.push({
      rule: 'no-absolute-paths',
      message: 'Avoid absolute paths — use here::here() or relative paths',
      severity: 'warning'
    });
  }

  // Rule: install.packages() in chunk
  if (/\binstall\.packages\s*\(/.test(code)) {
    warnings.push({
      rule: 'no-install-packages',
      message: 'Avoid install.packages() in code chunks — use a setup script or pacman::p_load()',
      severity: 'warning'
    });
  }

  // Rule: rm(list=ls()) — clears environment
  if (/\brm\s*\(\s*list\s*=\s*ls\s*\(\s*\)/.test(code)) {
    warnings.push({
      rule: 'no-rm-list-ls',
      message: 'Avoid rm(list=ls()) — it clears the global environment and breaks sequential validation',
      severity: 'warning'
    });
  }

  // Rule: library() instead of pacman::p_load() (informational)
  if (/\blibrary\s*\(/.test(code) && !/suppressPackageStartupMessages/.test(code)) {
    warnings.push({
      rule: 'prefer-pacman',
      message: 'Consider using pacman::p_load() instead of library() for consistent style',
      severity: 'info'
    });
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Parse an R option value string to its JS equivalent
 * @param {string} val - Option value string
 * @returns {*} Parsed value
 */
function parseOptionValue(val) {
  if (val === 'true' || val === 'TRUE') return true;
  if (val === 'false' || val === 'FALSE') return false;
  if (/^\d+$/.test(val)) return parseInt(val, 10);
  if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

/**
 * Sanitize a chunk label to safe characters only.
 * Prevents R code injection via malicious chunk labels in .qmd files.
 * @param {string} label - Raw label from .qmd chunk header
 * @returns {string} Sanitized label (alphanumeric, hyphens, underscores, dots)
 */
function sanitizeLabel(label) {
  return label.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

/**
 * Escape a string for use in R string literals
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
function escapeRString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}
