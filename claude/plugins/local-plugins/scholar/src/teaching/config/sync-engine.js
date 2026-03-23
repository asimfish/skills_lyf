/**
 * Sync Engine: YAML → JSON Synchronization
 *
 * Provides automatic synchronization of YAML configuration files to JSON,
 * enabling human-friendly editing (YAML) with machine-readable validation (JSON).
 *
 * Features:
 * - <100ms sync latency per file
 * - Hash-based change detection (skip unchanged files)
 * - Line number preservation for error reporting
 * - Lenient mode (warnings, not errors)
 *
 * @module teaching/config/sync-engine
 */

import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, unlinkSync, rmSync } from 'fs';
import { join, dirname, relative } from 'path';
import { createHash } from 'crypto';
import yaml from 'js-yaml';
import { glob } from 'glob';

/**
 * @typedef {Object} SyncResult
 * @property {boolean} success - Whether sync completed successfully
 * @property {number} duration - Sync duration in milliseconds
 * @property {string} yamlPath - Source YAML file path
 * @property {string} jsonPath - Generated JSON file path
 * @property {string} [error] - Error message if failed
 * @property {string[]} [warnings] - Validation warnings
 * @property {boolean} [skipped] - True if file unchanged (hash match)
 */

/**
 * @typedef {Object} SyncEngineOptions
 * @property {string} rootDir - Project root directory
 * @property {string} [cacheDir] - Directory for hash cache (default: .scholar-cache)
 * @property {boolean} [debug] - Enable debug logging
 * @property {boolean} [strict] - Throw on errors instead of returning error result
 * @property {boolean} [dryRun] - Preview changes without writing files (default: false)
 */

/**
 * Sync engine for YAML → JSON conversion
 */
export class ConfigSyncEngine {
  /**
   * Create a new sync engine
   * @param {SyncEngineOptions} options - Engine configuration
   */
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.cacheDir = options.cacheDir || join(this.rootDir, '.scholar-cache');
    this.debug = options.debug || process.env.SCHOLAR_DEBUG === 'true';
    this.strict = options.strict || false;
    this.dryRun = options.dryRun || false;

    // Ensure cache directory exists (skip in dry-run mode)
    if (!this.dryRun && !existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }

    this.debugLog('ConfigSyncEngine initialized', {
      rootDir: this.rootDir,
      cacheDir: this.cacheDir,
      dryRun: this.dryRun
    });
  }

  /**
   * Log debug messages if debug mode enabled
   * @param {string} message - Debug message
   * @param {Object} [data] - Additional data to log
   */
  debugLog(message, data = null) {
    if (this.debug) {
      const prefix = '[scholar:sync]';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  /**
   * Calculate hash of file contents
   * @param {string} content - File content
   * @returns {string} SHA-256 hash
   */
  calculateHash(content) {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached hash for a file
   * @param {string} yamlPath - YAML file path
   * @returns {string|null} Cached hash or null if not cached
   */
  getCachedHash(yamlPath) {
    const cacheFile = this.getCacheFilePath(yamlPath);
    if (existsSync(cacheFile)) {
      try {
        return readFileSync(cacheFile, 'utf8').trim();
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Save hash to cache
   * @param {string} yamlPath - YAML file path
   * @param {string} hash - Hash to cache
   */
  saveCachedHash(yamlPath, hash) {
    const cacheFile = this.getCacheFilePath(yamlPath);
    const cacheDir = dirname(cacheFile);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    writeFileSync(cacheFile, hash);
  }

  /**
   * Get cache file path for a YAML file
   * @param {string} yamlPath - YAML file path
   * @returns {string} Cache file path
   */
  getCacheFilePath(yamlPath) {
    const relativePath = relative(this.rootDir, yamlPath);
    const safeName = relativePath.replace(/[/\\]/g, '__');
    return join(this.cacheDir, `${safeName}.hash`);
  }

  /**
   * Get JSON output path for a YAML file
   * @param {string} yamlPath - YAML file path
   * @returns {string} JSON file path
   */
  getJsonPath(yamlPath) {
    return yamlPath.replace(/\.ya?ml$/i, '.json');
  }

  /**
   * Check if a file has changed since last sync
   * @param {string} yamlPath - YAML file path
   * @param {string} content - Current file content
   * @returns {boolean} True if file changed
   */
  hasChanged(yamlPath, content) {
    const currentHash = this.calculateHash(content);
    const cachedHash = this.getCachedHash(yamlPath);
    return currentHash !== cachedHash;
  }

  /**
   * Compare YAML and JSON to compute changes
   * @param {string} yamlPath - Path to YAML file
   * @param {string} jsonPath - Path to JSON file
   * @param {string} yamlContent - YAML file content
   * @param {Object} yamlData - Parsed YAML data
   * @returns {Object} Change diff object
   */
  computeChanges(yamlPath, jsonPath, yamlContent, yamlData) {
    const changes = {
      added: [],
      changed: [],
      removed: [],
      unchanged: []
    };

    // Check if JSON exists
    if (!existsSync(jsonPath)) {
      return {
        status: 'never-synced',
        added: Object.keys(yamlData),
        changed: [],
        removed: [],
        unchanged: []
      };
    }

    try {
      // Read existing JSON
      const jsonContent = readFileSync(jsonPath, 'utf8');
      const jsonData = JSON.parse(jsonContent);

      // Deep compare objects
      this._compareObjects('', yamlData, jsonData, changes);

      // Determine overall status
      const hasChanges = changes.added.length > 0 || changes.changed.length > 0 || changes.removed.length > 0;
      return {
        status: hasChanges ? 'out-of-sync' : 'in-sync',
        ...changes
      };
    } catch (err) {
      // If JSON is invalid, treat as never-synced
      return {
        status: 'never-synced',
        added: Object.keys(yamlData),
        changed: [],
        removed: [],
        unchanged: [],
        error: `Invalid JSON: ${err.message}`
      };
    }
  }

  /**
   * Deep compare two objects to find differences
   * @param {string} path - Current path in object tree
   * @param {*} yamlValue - Value from YAML
   * @param {*} jsonValue - Value from JSON
   * @param {Object} changes - Changes accumulator
   * @private
   */
  _compareObjects(path, yamlValue, jsonValue, changes) {
    const yamlType = this._getValueType(yamlValue);
    const jsonType = this._getValueType(jsonValue);

    // If types differ, mark as changed
    if (yamlType !== jsonType) {
      changes.changed.push({
        path: path || '(root)',
        from: jsonValue,
        to: yamlValue,
        fromType: jsonType,
        toType: yamlType
      });
      return;
    }

    // Handle objects
    if (yamlType === 'object') {
      const yamlKeys = new Set(Object.keys(yamlValue));
      const jsonKeys = new Set(Object.keys(jsonValue));

      // Find added keys
      for (const key of yamlKeys) {
        if (!jsonKeys.has(key)) {
          const fieldPath = path ? `${path}.${key}` : key;
          changes.added.push({
            path: fieldPath,
            value: yamlValue[key]
          });
        }
      }

      // Find removed keys
      for (const key of jsonKeys) {
        if (!yamlKeys.has(key)) {
          const fieldPath = path ? `${path}.${key}` : key;
          changes.removed.push({
            path: fieldPath,
            value: jsonValue[key]
          });
        }
      }

      // Recursively compare common keys
      for (const key of yamlKeys) {
        if (jsonKeys.has(key)) {
          const fieldPath = path ? `${path}.${key}` : key;
          this._compareObjects(fieldPath, yamlValue[key], jsonValue[key], changes);
        }
      }
      return;
    }

    // Handle arrays
    if (yamlType === 'array') {
      if (yamlValue.length !== jsonValue.length) {
        changes.changed.push({
          path: path || '(root)',
          from: jsonValue,
          to: yamlValue,
          reason: `Array length changed (${jsonValue.length} → ${yamlValue.length})`
        });
        return;
      }

      // Compare array elements
      for (let i = 0; i < yamlValue.length; i++) {
        const elementPath = `${path}[${i}]`;
        this._compareObjects(elementPath, yamlValue[i], jsonValue[i], changes);
      }
      return;
    }

    // Handle primitives
    if (yamlValue !== jsonValue) {
      changes.changed.push({
        path: path || '(root)',
        from: jsonValue,
        to: yamlValue
      });
    } else {
      changes.unchanged.push(path || '(root)');
    }
  }

  /**
   * Get value type for comparison
   * @param {*} value - Value to type-check
   * @returns {string} Type name
   * @private
   */
  _getValueType(value) {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Sync a single YAML file to JSON
   * @param {string} yamlPath - Path to YAML file
   * @param {Object} [options] - Sync options
   * @param {boolean} [options.force] - Force sync even if unchanged
   * @returns {SyncResult} Sync result
   */
  syncFile(yamlPath, options = {}) {
    const startTime = Date.now();
    const jsonPath = this.getJsonPath(yamlPath);
    const force = options.force || false;

    this.debugLog(`Syncing file: ${yamlPath}`);

    // Check file exists
    if (!existsSync(yamlPath)) {
      const error = `YAML file not found: ${yamlPath}`;
      this.debugLog(`Error: ${error}`);
      if (this.strict) {
        throw new Error(error);
      }
      return {
        success: false,
        duration: Date.now() - startTime,
        yamlPath,
        jsonPath,
        error
      };
    }

    try {
      // Read YAML content
      const content = readFileSync(yamlPath, 'utf8');

      // Check if file changed (skip if unchanged and not forced)
      if (!force && !this.hasChanged(yamlPath, content)) {
        this.debugLog(`Skipped (unchanged): ${yamlPath}`);
        return {
          success: true,
          duration: Date.now() - startTime,
          yamlPath,
          jsonPath,
          skipped: true
        };
      }

      // Parse YAML
      const data = yaml.load(content, {
        filename: yamlPath,
        onWarning: (warning) => {
          this.debugLog(`YAML warning: ${warning.message}`);
        }
      });

      // Handle empty files
      if (data === null || data === undefined) {
        const error = 'YAML file is empty or contains only comments';
        this.debugLog(`Error: ${error}`);
        if (this.strict) {
          throw new Error(error);
        }
        return {
          success: false,
          duration: Date.now() - startTime,
          yamlPath,
          jsonPath,
          error
        };
      }

      // Generate JSON
      const jsonContent = JSON.stringify(data, null, 2);

      // Compute changes if in dry-run mode
      if (this.dryRun) {
        const changes = this.computeChanges(yamlPath, jsonPath, content, data);
        const duration = Date.now() - startTime;
        this.debugLog(`Dry-run: ${yamlPath} → ${jsonPath} (${duration}ms)`);

        return {
          success: true,
          duration,
          yamlPath,
          jsonPath,
          dryRun: true,
          changes,
          message: 'Dry-run mode: No files modified',
          warnings: []
        };
      }

      // Ensure output directory exists
      const jsonDir = dirname(jsonPath);
      if (!existsSync(jsonDir)) {
        mkdirSync(jsonDir, { recursive: true });
      }

      // Write JSON file
      writeFileSync(jsonPath, jsonContent);

      // Update hash cache
      this.saveCachedHash(yamlPath, this.calculateHash(content));

      const duration = Date.now() - startTime;
      this.debugLog(`Synced: ${yamlPath} → ${jsonPath} (${duration}ms)`);

      return {
        success: true,
        duration,
        yamlPath,
        jsonPath,
        warnings: []
      };
    } catch (err) {
      const duration = Date.now() - startTime;

      // Handle YAML parse errors
      if (err.name === 'YAMLException') {
        const error = `YAML syntax error at line ${err.mark?.line || '?'}: ${err.reason || err.message}`;
        this.debugLog(`Error: ${error}`);
        if (this.strict) {
          throw new Error(error, { cause: err });
        }
        return {
          success: false,
          duration,
          yamlPath,
          jsonPath,
          error
        };
      }

      // Handle other errors
      const error = err.message;
      this.debugLog(`Error: ${error}`);
      if (this.strict) {
        throw err;
      }
      return {
        success: false,
        duration,
        yamlPath,
        jsonPath,
        error
      };
    }
  }

  /**
   * Sync all YAML files in specified directories
   * @param {Object} [options] - Sync options
   * @param {string[]} [options.patterns] - Glob patterns for YAML files
   * @param {boolean} [options.force] - Force sync even if unchanged
   * @returns {Promise<SyncResult[]>} Array of sync results
   */
  async syncAll(options = {}) {
    const patterns = options.patterns || [
      'content/lesson-plans/**/*.yml',
      'content/lesson-plans/**/*.yaml',
      '.claude/**/*.yml',
      '.claude/**/*.yaml'
    ];
    const force = options.force || false;

    this.debugLog('Syncing all files', { patterns, force });

    const results = [];
    const startTime = Date.now();

    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: this.rootDir, absolute: true });
      for (const file of files) {
        // Skip files that are already JSON
        if (file.endsWith('.json')) continue;

        const result = this.syncFile(file, { force });
        results.push(result);
      }
    }

    const totalDuration = Date.now() - startTime;
    const synced = results.filter((r) => r.success && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.success).length;

    this.debugLog(`Sync complete: ${synced} synced, ${skipped} skipped, ${failed} failed (${totalDuration}ms)`);

    return results;
  }

  /**
   * Get sync status for a file
   * @param {string} yamlPath - YAML file path
   * @returns {Object} Sync status
   */
  getSyncStatus(yamlPath) {
    const jsonPath = this.getJsonPath(yamlPath);

    const yamlExists = existsSync(yamlPath);
    const jsonExists = existsSync(jsonPath);

    if (!yamlExists) {
      return {
        status: 'missing',
        yamlPath,
        jsonPath,
        yamlExists: false,
        jsonExists
      };
    }

    if (!jsonExists) {
      return {
        status: 'never-synced',
        yamlPath,
        jsonPath,
        yamlExists: true,
        jsonExists: false
      };
    }

    // Check modification times
    const yamlStat = statSync(yamlPath);
    const jsonStat = statSync(jsonPath);
    const yamlModified = yamlStat.mtime;
    const jsonModified = jsonStat.mtime;

    // Check content hash
    const content = readFileSync(yamlPath, 'utf8');
    const currentHash = this.calculateHash(content);
    const cachedHash = this.getCachedHash(yamlPath);

    const inSync = currentHash === cachedHash && yamlModified <= jsonModified;

    return {
      status: inSync ? 'in-sync' : 'out-of-sync',
      yamlPath,
      jsonPath,
      yamlExists: true,
      jsonExists: true,
      yamlModified,
      jsonModified,
      inSync
    };
  }

  /**
   * Clear the hash cache
   * @param {string} [yamlPath] - Specific file to clear, or all if not specified
   */
  clearCache(yamlPath = null) {
    if (yamlPath) {
      const cacheFile = this.getCacheFilePath(yamlPath);
      if (existsSync(cacheFile)) {
        unlinkSync(cacheFile);
        this.debugLog(`Cache cleared: ${yamlPath}`);
      }
    } else {
      // Clear entire cache directory
      if (existsSync(this.cacheDir)) {
        rmSync(this.cacheDir, { recursive: true, force: true });
        mkdirSync(this.cacheDir, { recursive: true });
        this.debugLog('Cache cleared: all');
      }
    }
  }
}

/**
 * Create a sync engine with default options
 * @param {SyncEngineOptions} options - Engine options
 * @returns {ConfigSyncEngine} Sync engine instance
 */
export function createSyncEngine(options = {}) {
  return new ConfigSyncEngine(options);
}

/**
 * Sync a single file (convenience function)
 * @param {string} yamlPath - YAML file path
 * @param {Object} [options] - Sync options
 * @returns {SyncResult} Sync result
 */
export function syncFile(yamlPath, options = {}) {
  const syncEngine = createSyncEngine({ rootDir: dirname(yamlPath), ...options });
  return syncEngine.syncFile(yamlPath, options);
}

/**
 * Sync all files in a directory (convenience function)
 * @param {string} rootDir - Root directory
 * @param {Object} [options] - Sync options
 * @returns {Promise<SyncResult[]>} Sync results
 */
export async function syncAll(rootDir, options = {}) {
  const syncEngine = createSyncEngine({ rootDir, ...options });
  return syncEngine.syncAll(options);
}

export default ConfigSyncEngine;
