/**
 * Manifest Migrator
 *
 * Migrates directory-based week files into a single
 * .flow/lesson-plans.yml manifest. Detects week files across
 * all known locations, fills missing fields with defaults,
 * and merges into a validated manifest.
 *
 * @module teaching/validators/manifest-migrator
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { findAllWeekFiles } from '../utils/discovery.js';
import { safeWriteYaml } from '../utils/safe-write.js';
import { validateManifest } from '../utils/manifest-validator.js';

/**
 * Default values for missing fields in week entries
 */
const FIELD_DEFAULTS = {
  status: 'draft',
  learning_objectives: [],
  topics: [],
  activities: [],
  materials: {},
  lecture_structure: []
};

/**
 * Default semester metadata
 */
const SEMESTER_DEFAULTS = {
  schema_version: '1.0',
  total_weeks: 15,
  schedule: 'TR'
};

/**
 * ManifestMigrator detects directory-based week files and
 * merges them into a single .flow/lesson-plans.yml manifest.
 */
export class ManifestMigrator {
  /**
   * @param {Object} options
   * @param {string} options.courseRoot - Course root directory
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor({ courseRoot, debug = false } = {}) {
    this.courseRoot = courseRoot;
    this.debug = debug;
  }

  /**
   * Detect week files across all known locations.
   *
   * Scans WEEK_FILE_LOCATIONS directories, parses each file,
   * and identifies missing fields.
   *
   * @returns {Array<{ path: string, relativePath: string, weekNumber: number, source: string, data: Object, missingFields: string[] }>}
   */
  detectWeekFiles() {
    const discovered = findAllWeekFiles(this.courseRoot);
    const results = [];

    for (const file of discovered) {
      let data;
      try {
        const content = readFileSync(file.path, 'utf8');
        data = yaml.load(content);
      } catch (err) {
        if (this.debug) {
          console.error(`Failed to parse ${file.relativePath}: ${err.message}`);
        }
        continue;
      }

      if (!data || typeof data !== 'object') continue;

      // Identify missing fields
      const missingFields = [];
      for (const field of Object.keys(FIELD_DEFAULTS)) {
        if (data[field] === undefined || data[field] === null) {
          missingFields.push(field);
        }
      }

      // Ensure week number is present
      if (!data.week && file.weekNumber) {
        data.week = file.weekNumber;
        missingFields.push('week');
      }

      // Ensure title is present
      if (!data.title) {
        missingFields.push('title');
      }

      results.push({
        path: file.path,
        relativePath: file.relativePath,
        weekNumber: file.weekNumber,
        source: file.source,
        data,
        missingFields
      });
    }

    return results;
  }

  /**
   * Preview migration without writing.
   *
   * @param {Array} files - Result from detectWeekFiles()
   * @returns {{ weekCount: number, fieldsToFill: number, conflicts: Array, warnings: string[], manifestYaml: string }}
   */
  previewMigration(files) {
    const warnings = [];
    const conflicts = [];
    let fieldsToFill = 0;

    // Check for duplicate week numbers
    const weekMap = new Map();
    for (const file of files) {
      if (weekMap.has(file.weekNumber)) {
        conflicts.push({
          week: file.weekNumber,
          sources: [weekMap.get(file.weekNumber).relativePath, file.relativePath]
        });
      } else {
        weekMap.set(file.weekNumber, file);
      }
    }

    // Count fields that need defaults
    for (const file of files) {
      fieldsToFill += file.missingFields.length;
      if (file.missingFields.length > 0) {
        warnings.push(
          `${file.relativePath} missing: ${file.missingFields.join(', ')}`
        );
      }
    }

    // Check for existing manifest
    const manifestPath = join(this.courseRoot, '.flow', 'lesson-plans.yml');
    if (existsSync(manifestPath)) {
      warnings.push('Existing .flow/lesson-plans.yml found — will be backed up');
    }

    // Build preview manifest
    const weeks = this._buildWeeksArray(files);
    const manifest = this._buildManifest(weeks);
    const manifestYaml = yaml.dump(manifest, { lineWidth: 120, noRefs: true });

    return {
      weekCount: files.length,
      fieldsToFill,
      conflicts,
      warnings,
      manifestYaml
    };
  }

  /**
   * Execute migration: merge week files into .flow/lesson-plans.yml
   *
   * @param {Array} files - Result from detectWeekFiles()
   * @param {Object} [options]
   * @param {boolean} [options.dryRun=false] - Preview without writing
   * @param {boolean} [options.preserveOriginals=true] - Keep original week files
   * @param {Object} [options.defaults={}] - Custom default values
   * @returns {{ success: boolean, manifestPath: string, weeksMerged: number, defaultsFilled: number, warnings: string[], backupPath: string|null, error?: string }}
   */
  async migrate(files, { dryRun = false, preserveOriginals: _preserveOriginals = true, defaults = {} } = {}) {
    const warnings = [];
    let defaultsFilled = 0;

    if (!files || files.length === 0) {
      return {
        success: false,
        manifestPath: null,
        weeksMerged: 0,
        defaultsFilled: 0,
        warnings: ['No week files found to migrate'],
        backupPath: null,
        error: 'No week files to migrate'
      };
    }

    // Fill defaults for each week
    const filledWeeks = files.map(file => {
      const { filled, warnings: fillWarnings, count } = this.fillDefaults(
        file.data,
        file.weekNumber,
        defaults
      );
      warnings.push(...fillWarnings);
      defaultsFilled += count;
      return filled;
    });

    // Build manifest
    const weeks = filledWeeks.sort((a, b) => a.week - b.week);
    const manifest = this._buildManifest(weeks);

    // Validate
    const { valid, errors: validationErrors } = validateManifest(manifest);
    if (!valid) {
      warnings.push(`Validation warnings: ${validationErrors.join('; ')}`);
    }

    const manifestPath = join(this.courseRoot, '.flow', 'lesson-plans.yml');

    if (dryRun) {
      return {
        success: true,
        manifestPath,
        weeksMerged: weeks.length,
        defaultsFilled,
        warnings,
        backupPath: null
      };
    }

    // Write manifest
    const manifestYaml = yaml.dump(manifest, { lineWidth: 120, noRefs: true });
    const writeResult = safeWriteYaml(manifestPath, manifestYaml, {
      backup: true,
      atomic: false
    });

    if (!writeResult.success) {
      return {
        success: false,
        manifestPath,
        weeksMerged: 0,
        defaultsFilled: 0,
        warnings,
        backupPath: null,
        error: `Failed to write manifest: ${writeResult.error}`
      };
    }

    return {
      success: true,
      manifestPath,
      weeksMerged: weeks.length,
      defaultsFilled,
      warnings,
      backupPath: writeResult.backupPath
    };
  }

  /**
   * Fill missing fields with defaults.
   *
   * @param {Object} weekData - Parsed week data
   * @param {number} weekNumber - Week number
   * @param {Object} [customDefaults={}] - Override default values
   * @returns {{ filled: Object, warnings: string[], count: number }}
   */
  fillDefaults(weekData, weekNumber, customDefaults = {}) {
    const warnings = [];
    let count = 0;
    const merged = { ...weekData };
    const allDefaults = { ...FIELD_DEFAULTS, ...customDefaults };

    // Ensure week number
    if (!merged.week) {
      merged.week = weekNumber;
      count++;
    }

    // Ensure title
    if (!merged.title) {
      merged.title = `Week ${weekNumber}`;
      warnings.push(`Week ${weekNumber}: title set to default "Week ${weekNumber}"`);
      count++;
    }

    // Fill other defaults
    for (const [field, defaultValue] of Object.entries(allDefaults)) {
      if (merged[field] === undefined || merged[field] === null) {
        merged[field] = defaultValue;
        warnings.push(`Week ${weekNumber}: ${field} set to default`);
        count++;
      }
    }

    return { filled: merged, warnings, count };
  }

  /**
   * Build the weeks array from detected files, deduplicating by week number
   * @private
   */
  _buildWeeksArray(files) {
    const weekMap = new Map();

    for (const file of files) {
      const weekNum = file.weekNumber;
      // First found wins (based on WEEK_FILE_LOCATIONS priority)
      if (!weekMap.has(weekNum)) {
        weekMap.set(weekNum, file.data);
      }
    }

    return Array.from(weekMap.values()).sort((a, b) => (a.week || 0) - (b.week || 0));
  }

  /**
   * Build the complete manifest object
   * @private
   */
  _buildManifest(weeks) {
    return {
      schema_version: SEMESTER_DEFAULTS.schema_version,
      semester: {
        total_weeks: SEMESTER_DEFAULTS.total_weeks,
        schedule: SEMESTER_DEFAULTS.schedule
      },
      weeks
    };
  }
}
