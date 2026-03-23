/**
 * Safe YAML file writer with backup support
 *
 * Provides atomic-ish YAML write operations with automatic
 * .bak backup creation before overwriting existing files.
 *
 * @module teaching/utils/safe-write
 */

import { writeFileSync, copyFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { dirname } from 'path';
import yaml from 'js-yaml';

/**
 * Default YAML dump options for consistent output
 */
const DEFAULT_YAML_OPTIONS = {
  lineWidth: 120,
  noRefs: true,
  quotingType: '"',
  forceQuotes: false
};

/**
 * Safely write data as YAML to a file path.
 *
 * Creates parent directories if they don't exist.
 * Optionally creates a .bak backup of the existing file before overwriting.
 * Optionally uses atomic write via temporary file + rename.
 *
 * @param {string} targetPath - Full path to write the YAML file
 * @param {Object|string} data - Object to serialize as YAML, or raw YAML string
 * @param {Object} [options] - Write options
 * @param {boolean} [options.backup=true] - Create .bak backup before overwriting
 * @param {boolean} [options.atomic=false] - Write to .tmp then rename (atomic)
 * @param {Object} [options.yamlOptions] - Options passed to js-yaml dump()
 * @returns {{ success: boolean, backupPath: string|null, error?: string }}
 *
 * @example
 * const result = safeWriteYaml('/path/to/.flow/lesson-plans.yml', manifestData);
 * // => { success: true, backupPath: '/path/to/.flow/lesson-plans.yml.bak' }
 */
export function safeWriteYaml(targetPath, data, { backup = true, atomic = false, yamlOptions = {} } = {}) {
  try {
    // Ensure parent directory exists
    const dir = dirname(targetPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Create backup if file exists and backup is requested
    let backupPath = null;
    if (backup && existsSync(targetPath)) {
      backupPath = `${targetPath}.bak`;
      copyFileSync(targetPath, backupPath);
    }

    // Serialize data to YAML if it's an object
    const yamlContent = typeof data === 'string'
      ? data
      : yaml.dump(data, { ...DEFAULT_YAML_OPTIONS, ...yamlOptions });

    if (atomic) {
      // Write to temp file, then rename for atomicity
      const tmpPath = `${targetPath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
      writeFileSync(tmpPath, yamlContent, 'utf8');
      renameSync(tmpPath, targetPath);
    } else {
      writeFileSync(targetPath, yamlContent, 'utf8');
    }

    return { success: true, backupPath };
  } catch (err) {
    return { success: false, backupPath: null, error: err.message };
  }
}
