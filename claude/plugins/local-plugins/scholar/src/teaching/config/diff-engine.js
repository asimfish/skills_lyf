/**
 * Diff Engine: YAML vs JSON Comparison
 *
 * Compares YAML source files with their generated JSON counterparts
 * to detect sync issues, structural differences, and data changes.
 *
 * Features:
 * - Deep object comparison
 * - Path-based change tracking
 * - YAML line number mapping for changes
 * - Colored terminal output
 *
 * @module teaching/config/diff-engine
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { relative } from 'path';
import yaml from 'js-yaml';

/**
 * @typedef {Object} DiffEntry
 * @property {string} path - JSON path to changed value
 * @property {'added'|'removed'|'changed'|'type-changed'} type - Change type
 * @property {*} yamlValue - Value in YAML (or undefined if added to JSON)
 * @property {*} jsonValue - Value in JSON (or undefined if removed)
 * @property {number} [line] - Approximate YAML line number
 */

/**
 * @typedef {Object} DiffResult
 * @property {boolean} inSync - Whether files are in sync
 * @property {string} yamlPath - Path to YAML file
 * @property {string} jsonPath - Path to JSON file
 * @property {Date} yamlModified - YAML file modification time
 * @property {Date} jsonModified - JSON file modification time
 * @property {DiffEntry[]} differences - List of differences found
 * @property {Object} stats - Summary statistics
 * @property {number} duration - Comparison duration in ms
 */

/**
 * @typedef {Object} DiffEngineOptions
 * @property {string} [cwd] - Current working directory for relative paths
 * @property {boolean} [ignoreOrder] - Ignore array order differences
 * @property {string[]} [ignorePaths] - JSON paths to ignore
 * @property {boolean} [debug] - Enable debug logging
 */

/**
 * Deep compare two values and return differences
 * @param {*} yamlVal - Value from YAML
 * @param {*} jsonVal - Value from JSON
 * @param {string} path - Current path
 * @param {DiffEntry[]} diffs - Array to collect differences
 * @param {Object} options - Comparison options
 */
function deepCompare(yamlVal, jsonVal, path, diffs, options = {}) {
  // Handle identical values
  if (yamlVal === jsonVal) {
    return;
  }

  // Handle null/undefined
  if (yamlVal === null || yamlVal === undefined) {
    if (jsonVal !== null && jsonVal !== undefined) {
      diffs.push({ path, type: 'added', yamlValue: yamlVal, jsonValue: jsonVal });
    }
    return;
  }

  if (jsonVal === null || jsonVal === undefined) {
    diffs.push({ path, type: 'removed', yamlValue: yamlVal, jsonValue: jsonVal });
    return;
  }

  // Handle type differences
  const yamlType = Array.isArray(yamlVal) ? 'array' : typeof yamlVal;
  const jsonType = Array.isArray(jsonVal) ? 'array' : typeof jsonVal;

  if (yamlType !== jsonType) {
    diffs.push({
      path,
      type: 'type-changed',
      yamlValue: yamlVal,
      jsonValue: jsonVal
    });
    return;
  }

  // Handle arrays
  if (yamlType === 'array') {
    // Check for length difference
    if (yamlVal.length !== jsonVal.length) {
      diffs.push({
        path,
        type: 'changed',
        yamlValue: `Array(${yamlVal.length})`,
        jsonValue: `Array(${jsonVal.length})`
      });
    }

    // Compare elements
    const maxLen = Math.max(yamlVal.length, jsonVal.length);
    for (let i = 0; i < maxLen; i++) {
      const elemPath = `${path}[${i}]`;

      if (i >= yamlVal.length) {
        diffs.push({
          path: elemPath,
          type: 'added',
          yamlValue: undefined,
          jsonValue: jsonVal[i]
        });
      } else if (i >= jsonVal.length) {
        diffs.push({
          path: elemPath,
          type: 'removed',
          yamlValue: yamlVal[i],
          jsonValue: undefined
        });
      } else {
        deepCompare(yamlVal[i], jsonVal[i], elemPath, diffs, options);
      }
    }
    return;
  }

  // Handle objects
  if (yamlType === 'object') {
    const yamlKeys = new Set(Object.keys(yamlVal));
    const jsonKeys = new Set(Object.keys(jsonVal));
    const allKeys = new Set([...yamlKeys, ...jsonKeys]);

    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;

      // Skip ignored paths
      if (options.ignorePaths?.includes(keyPath)) {
        continue;
      }

      if (!yamlKeys.has(key)) {
        diffs.push({
          path: keyPath,
          type: 'added',
          yamlValue: undefined,
          jsonValue: jsonVal[key]
        });
      } else if (!jsonKeys.has(key)) {
        diffs.push({
          path: keyPath,
          type: 'removed',
          yamlValue: yamlVal[key],
          jsonValue: undefined
        });
      } else {
        deepCompare(yamlVal[key], jsonVal[key], keyPath, diffs, options);
      }
    }
    return;
  }

  // Handle primitive differences
  if (yamlVal !== jsonVal) {
    diffs.push({
      path,
      type: 'changed',
      yamlValue: yamlVal,
      jsonValue: jsonVal
    });
  }
}

/**
 * Map JSON path to approximate YAML line number
 * @param {string} yamlContent - Original YAML content
 * @param {string} jsonPath - JSON path (e.g., "learning_objectives[0].id")
 * @returns {number} Approximate line number (1-based)
 */
function mapPathToLine(yamlContent, jsonPath) {
  const lines = yamlContent.split('\n');
  const segments = jsonPath.split(/\.|\[|\]/).filter(Boolean);

  let currentLine = 1;

  for (const segment of segments) {
    if (/^\d+$/.test(segment)) {
      // Array index - find the Nth list item
      const index = parseInt(segment, 10);
      let foundItems = 0;

      for (let i = currentLine - 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('-')) {
          if (foundItems === index) {
            currentLine = i + 1;
            break;
          }
          foundItems++;
        }
      }
    } else {
      // Object key - find the key
      const keyPattern = new RegExp(`^\\s*${segment}\\s*:`, 'm');

      for (let i = currentLine - 1; i < lines.length; i++) {
        if (keyPattern.test(lines[i])) {
          currentLine = i + 1;
          break;
        }
      }
    }
  }

  return currentLine;
}

/**
 * Config Diff Engine class
 */
export class ConfigDiffEngine {
  /**
   * Create a new diff engine
   * @param {DiffEngineOptions} options - Engine options
   */
  constructor(options = {}) {
    this.options = {
      cwd: options.cwd || process.cwd(),
      ignoreOrder: options.ignoreOrder || false,
      ignorePaths: options.ignorePaths || [],
      debug: options.debug || process.env.SCHOLAR_DEBUG === 'true'
    };
  }

  /**
   * Debug log helper
   * @param {string} message - Message to log
   * @param {Object} [data] - Additional data
   */
  debugLog(message, data = null) {
    if (this.options.debug) {
      const prefix = '[scholar:diff]';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  /**
   * Get JSON path for a YAML file
   * @param {string} yamlPath - YAML file path
   * @returns {string} JSON file path
   */
  getJsonPath(yamlPath) {
    return yamlPath.replace(/\.ya?ml$/i, '.json');
  }

  /**
   * Compare a YAML file with its JSON counterpart
   * @param {string} yamlPath - Path to YAML file
   * @param {Object} [options] - Comparison options
   * @returns {DiffResult} Comparison result
   */
  compareFile(yamlPath, options = {}) {
    const startTime = Date.now();
    const jsonPath = options.jsonPath || this.getJsonPath(yamlPath);

    this.debugLog(`Comparing: ${yamlPath} ↔ ${jsonPath}`);

    // Check files exist
    if (!existsSync(yamlPath)) {
      return {
        inSync: false,
        yamlPath,
        jsonPath,
        yamlModified: null,
        jsonModified: null,
        differences: [{
          path: '',
          type: 'removed',
          yamlValue: 'FILE NOT FOUND',
          jsonValue: existsSync(jsonPath) ? 'exists' : 'FILE NOT FOUND'
        }],
        stats: { added: 0, removed: 1, changed: 0, typeChanged: 0 },
        duration: Date.now() - startTime,
        error: 'YAML file not found'
      };
    }

    if (!existsSync(jsonPath)) {
      return {
        inSync: false,
        yamlPath,
        jsonPath,
        yamlModified: statSync(yamlPath).mtime,
        jsonModified: null,
        differences: [{
          path: '',
          type: 'added',
          yamlValue: 'exists',
          jsonValue: 'FILE NOT FOUND'
        }],
        stats: { added: 1, removed: 0, changed: 0, typeChanged: 0 },
        duration: Date.now() - startTime,
        status: 'never-synced'
      };
    }

    // Get file modification times
    const yamlStat = statSync(yamlPath);
    const jsonStat = statSync(jsonPath);
    const yamlModified = yamlStat.mtime;
    const jsonModified = jsonStat.mtime;

    // Read and parse files
    let yamlContent, yamlData, jsonData;

    try {
      yamlContent = readFileSync(yamlPath, 'utf8');
      yamlData = yaml.load(yamlContent);
    } catch (err) {
      return {
        inSync: false,
        yamlPath,
        jsonPath,
        yamlModified,
        jsonModified,
        differences: [],
        stats: { added: 0, removed: 0, changed: 0, typeChanged: 0 },
        duration: Date.now() - startTime,
        error: `YAML parse error: ${err.message}`
      };
    }

    try {
      jsonData = JSON.parse(readFileSync(jsonPath, 'utf8'));
    } catch (err) {
      return {
        inSync: false,
        yamlPath,
        jsonPath,
        yamlModified,
        jsonModified,
        differences: [],
        stats: { added: 0, removed: 0, changed: 0, typeChanged: 0 },
        duration: Date.now() - startTime,
        error: `JSON parse error: ${err.message}`
      };
    }

    // Compare data
    const differences = [];
    const compareOptions = {
      ignoreOrder: options.ignoreOrder ?? this.options.ignoreOrder,
      ignorePaths: options.ignorePaths ?? this.options.ignorePaths
    };

    deepCompare(yamlData, jsonData, '', differences, compareOptions);

    // Add line numbers to differences
    for (const diff of differences) {
      if (diff.path) {
        diff.line = mapPathToLine(yamlContent, diff.path);
      }
    }

    // Calculate stats
    const stats = {
      added: differences.filter(d => d.type === 'added').length,
      removed: differences.filter(d => d.type === 'removed').length,
      changed: differences.filter(d => d.type === 'changed').length,
      typeChanged: differences.filter(d => d.type === 'type-changed').length
    };

    const inSync = differences.length === 0;

    return {
      inSync,
      yamlPath,
      jsonPath,
      yamlModified,
      jsonModified,
      differences,
      stats,
      duration: Date.now() - startTime
    };
  }

  /**
   * Format a single difference for display
   * @param {DiffEntry} diff - Difference entry
   * @param {Object} options - Formatting options
   * @returns {string} Formatted difference
   */
  formatDiff(diff, options = {}) {
    const { color = true } = options;
    const c = color ? {
      reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
      yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m'
    } : { reset: '', red: '', green: '', yellow: '', cyan: '', gray: '' };

    const path = diff.path || '(root)';
    const line = diff.line ? `:${diff.line}` : '';

    switch (diff.type) {
      case 'added':
        return `${c.green}+ ${path}${line}${c.reset}: ${c.gray}added in JSON${c.reset} → ${JSON.stringify(diff.jsonValue)}`;

      case 'removed':
        return `${c.red}- ${path}${line}${c.reset}: ${c.gray}missing in JSON${c.reset} ← ${JSON.stringify(diff.yamlValue)}`;

      case 'changed':
        return `${c.yellow}~ ${path}${line}${c.reset}: ${JSON.stringify(diff.yamlValue)} ${c.gray}→${c.reset} ${JSON.stringify(diff.jsonValue)}`;

      case 'type-changed': {
        const yamlType = Array.isArray(diff.yamlValue) ? 'array' : typeof diff.yamlValue;
        const jsonType = Array.isArray(diff.jsonValue) ? 'array' : typeof diff.jsonValue;
        return `${c.red}! ${path}${line}${c.reset}: ${c.gray}type changed${c.reset} ${yamlType} → ${jsonType}`;
      }

      default:
        return `? ${path}: unknown change`;
    }
  }

  /**
   * Format full diff result for display
   * @param {DiffResult} result - Diff result
   * @param {Object} options - Formatting options
   * @returns {string} Formatted output
   */
  formatResult(result, options = {}) {
    const { color = true, verbose = false } = options;
    const c = color ? {
      reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
      yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m'
    } : { reset: '', red: '', green: '', yellow: '', cyan: '', gray: '', bold: '' };

    const lines = [];
    const yamlRel = relative(this.options.cwd, result.yamlPath);
    const jsonRel = relative(this.options.cwd, result.jsonPath);

    // Header
    lines.push(`${c.bold}Comparing:${c.reset} ${yamlRel} ${c.gray}↔${c.reset} ${jsonRel}`);
    lines.push('');

    // Status
    if (result.error) {
      lines.push(`${c.red}Error:${c.reset} ${result.error}`);
    } else if (result.status === 'never-synced') {
      lines.push(`${c.yellow}Status: Never synced${c.reset} (JSON file not found)`);
      lines.push(`${c.cyan}Run /teaching:sync to generate JSON${c.reset}`);
    } else if (result.inSync) {
      lines.push(`${c.green}Status: ✓ In sync${c.reset}`);

      if (verbose && result.yamlModified && result.jsonModified) {
        lines.push('');
        lines.push(`  YAML modified: ${result.yamlModified.toISOString()}`);
        lines.push(`  JSON modified: ${result.jsonModified.toISOString()}`);
      }
    } else {
      lines.push(`${c.red}Status: ✗ Out of sync${c.reset}`);
      lines.push('');

      // List differences
      for (const diff of result.differences) {
        lines.push('  ' + this.formatDiff(diff, { color }));
      }

      // Stats summary
      lines.push('');
      lines.push(`${c.gray}───────────────────────────────────────────────────────${c.reset}`);
      const statParts = [];
      if (result.stats.added > 0) statParts.push(`${c.green}+${result.stats.added} added${c.reset}`);
      if (result.stats.removed > 0) statParts.push(`${c.red}-${result.stats.removed} removed${c.reset}`);
      if (result.stats.changed > 0) statParts.push(`${c.yellow}~${result.stats.changed} changed${c.reset}`);
      if (result.stats.typeChanged > 0) statParts.push(`${c.red}!${result.stats.typeChanged} type changed${c.reset}`);

      lines.push(`Summary: ${statParts.join(', ')} (${result.duration}ms)`);
      lines.push(`${c.cyan}Run /teaching:sync --force to resync${c.reset}`);
    }

    return lines.join('\n');
  }
}

/**
 * Create a diff engine with default options
 * @param {DiffEngineOptions} options - Engine options
 * @returns {ConfigDiffEngine} Diff engine instance
 */
export function createDiffEngine(options = {}) {
  return new ConfigDiffEngine(options);
}

/**
 * Compare a single file (convenience function)
 * @param {string} yamlPath - YAML file path
 * @param {DiffEngineOptions} options - Engine options
 * @returns {DiffResult} Diff result
 */
export function compareFile(yamlPath, options = {}) {
  const diffEngine = new ConfigDiffEngine(options);
  return diffEngine.compareFile(yamlPath);
}

export default ConfigDiffEngine;
