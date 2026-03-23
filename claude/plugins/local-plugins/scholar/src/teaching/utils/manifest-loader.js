/**
 * Manifest Loader for .flow/lesson-plans.yml
 *
 * Loads, validates, and manages the lesson plans manifest file.
 * The manifest provides a semester-level view of all weekly topics,
 * schedule metadata, and milestone markers.
 *
 * Sits alongside lesson-plan-loader.js which handles individual
 * week-level lesson plan files (content/lesson-plans/weekNN.yml).
 *
 * @module teaching/utils/manifest-loader
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { sha256 } from './hash.js';
import { validateManifest as validateManifestUtil } from './manifest-validator.js';
import { safeWriteYaml } from './safe-write.js';

/**
 * Manifest filename within the .flow directory
 */
const MANIFEST_FILENAME = 'lesson-plans.yml';

/**
 * Valid status values for week entries
 */
const VALID_STATUSES = ['draft', 'generated', 'reviewed', 'published'];

/**
 * Compute SHA-256 hex digest of a string (delegates to shared hash utility)
 * @param {string} content - Raw file content
 * @returns {string} SHA-256 hex digest
 */
function computeHash(content) {
  return sha256(content);
}

/**
 * Find the .flow/lesson-plans.yml manifest in a course root
 *
 * @param {string} courseRoot - Course root directory
 * @returns {string|null} Full path to manifest file, or null if not found
 *
 * @example
 * const manifestPath = findManifest('/Users/dt/teaching/stat-440');
 * // => '/Users/dt/teaching/stat-440/.flow/lesson-plans.yml' or null
 */
export function findManifest(courseRoot) {
  if (!courseRoot) return null;

  const manifestPath = join(courseRoot, '.flow', MANIFEST_FILENAME);
  if (existsSync(manifestPath)) {
    return manifestPath;
  }

  return null;
}

/**
 * Load and optionally validate the lesson plans manifest
 *
 * @param {string} courseRoot - Course root directory
 * @param {Object} [options] - Load options
 * @param {boolean} [options.validate=true] - Whether to validate against JSON Schema
 * @returns {Object} Result object
 * @returns {Object|null} result.manifest - Parsed manifest data (with internal fields)
 * @returns {string|null} result.path - Path to manifest file
 * @returns {string[]} result.errors - Array of error messages
 * @returns {string[]} result.warnings - Array of warning messages
 * @returns {string|null} result.hash - SHA-256 hash of file content
 *
 * @example
 * const { manifest, errors } = loadManifest('/Users/dt/teaching/stat-440');
 * if (manifest) {
 *   console.log(`Loaded ${manifest.weeks.length} weeks`);
 * }
 */
export function loadManifest(courseRoot, { validate = true } = {}) {
  const manifestPath = findManifest(courseRoot);

  if (!manifestPath) {
    return {
      manifest: null,
      path: null,
      errors: ['No manifest found'],
      warnings: [],
      hash: null
    };
  }

  // Read raw content for hashing
  let rawContent;
  try {
    rawContent = readFileSync(manifestPath, 'utf8');
  } catch (err) {
    return {
      manifest: null,
      path: manifestPath,
      errors: [`Failed to read manifest: ${err.message}`],
      warnings: [],
      hash: null
    };
  }

  const hash = computeHash(rawContent);

  // Parse YAML
  let manifest;
  try {
    manifest = yaml.load(rawContent);
  } catch (err) {
    return {
      manifest: null,
      path: manifestPath,
      errors: [`YAML parse error: ${err.message}`],
      warnings: [],
      hash
    };
  }

  if (!manifest || typeof manifest !== 'object') {
    return {
      manifest: null,
      path: manifestPath,
      errors: ['Manifest file is empty or not a valid YAML object'],
      warnings: [],
      hash
    };
  }

  const errors = [];
  const warnings = [];

  // Validate against JSON Schema if requested
  if (validate) {
    const result = validateManifestUtil(manifest);
    if (!result.valid) {
      for (const errMsg of result.errors) {
        errors.push(`Schema validation: ${errMsg}`);
      }
    }
  }

  // Attach internal metadata fields
  manifest._hash = hash;
  manifest._path = manifestPath;
  manifest._loadedAt = new Date().toISOString();

  return {
    manifest,
    path: manifestPath,
    errors,
    warnings,
    hash
  };
}

/**
 * Get the SHA-256 hash of the manifest file without fully loading it
 *
 * Useful for change detection and cache invalidation.
 *
 * @param {string} courseRoot - Course root directory
 * @returns {string|null} SHA-256 hex digest, or null if file does not exist
 *
 * @example
 * const hash = getManifestHash('/Users/dt/teaching/stat-440');
 * if (hash !== cachedHash) {
 *   // manifest changed, reload
 * }
 */
export function getManifestHash(courseRoot) {
  const manifestPath = findManifest(courseRoot);
  if (!manifestPath) return null;

  try {
    const content = readFileSync(manifestPath, 'utf8');
    return computeHash(content);
  } catch {
    return null;
  }
}

/**
 * Update the status of a specific week in the manifest
 *
 * Reads the manifest, finds the week by ID, optionally backs up the
 * current file, updates the status field, and writes the file back.
 *
 * @param {string} courseRoot - Course root directory
 * @param {number|string} weekId - Week number to update (integer match)
 * @param {string} newStatus - New status value (draft|generated|reviewed|published)
 * @param {Object} [options] - Update options
 * @param {boolean} [options.backup=true] - Whether to create .bak backup before writing
 * @returns {Object} Result object
 * @returns {boolean} result.success - Whether the update succeeded
 * @returns {string|undefined} result.previousStatus - Previous status value
 * @returns {string|undefined} result.newStatus - New status value
 * @returns {string|null} result.backupPath - Path to backup file, or null
 * @returns {string|undefined} result.error - Error message if failed
 *
 * @example
 * const result = updateWeekStatus('/Users/dt/teaching/stat-440', 3, 'reviewed');
 * // => { success: true, previousStatus: 'generated', newStatus: 'reviewed', backupPath: '...bak' }
 */
export function updateWeekStatus(courseRoot, weekId, newStatus, { backup = true } = {}) {
  // Validate status value
  if (!VALID_STATUSES.includes(newStatus)) {
    return {
      success: false,
      error: `Invalid status "${newStatus}". Must be one of: ${VALID_STATUSES.join(', ')}`,
      backupPath: null
    };
  }

  // Parse week ID to integer
  const weekNum = typeof weekId === 'number' ? weekId : parseInt(String(weekId), 10);
  if (isNaN(weekNum) || weekNum <= 0) {
    return {
      success: false,
      error: `Invalid week ID: ${weekId}`,
      backupPath: null
    };
  }

  // Load manifest
  const { manifest, path: manifestPath, errors } = loadManifest(courseRoot, { validate: false });
  if (!manifest) {
    return {
      success: false,
      error: errors.length > 0 ? errors[0] : 'Failed to load manifest',
      backupPath: null
    };
  }

  // Find the week entry
  if (!Array.isArray(manifest.weeks)) {
    return {
      success: false,
      error: 'Manifest has no weeks array',
      backupPath: null
    };
  }

  const weekEntry = manifest.weeks.find(w => w.week === weekNum);
  if (!weekEntry) {
    return {
      success: false,
      error: `Week ${weekNum} not found in manifest`,
      backupPath: null
    };
  }

  const previousStatus = weekEntry.status;

  // Update status
  weekEntry.status = newStatus;

  // Remove internal fields before writing
  delete manifest._hash;
  delete manifest._path;
  delete manifest._loadedAt;

  // Write back with backup using shared safe-write utility
  const writeResult = safeWriteYaml(manifestPath, manifest, { backup });

  if (!writeResult.success) {
    return {
      success: false,
      error: `Failed to write manifest: ${writeResult.error}`,
      backupPath: writeResult.backupPath
    };
  }

  return {
    success: true,
    previousStatus,
    newStatus,
    backupPath: writeResult.backupPath
  };
}

/**
 * Get high-level semester information from the manifest
 *
 * Provides a lightweight read of schedule metadata and milestones
 * without validating individual week entries.
 *
 * @param {string} courseRoot - Course root directory
 * @returns {Object|null} Semester info or null if manifest not found
 * @returns {number} result.total_weeks - Total weeks declared in schedule
 * @returns {Object} result.schedule - Raw schedule object from manifest
 * @returns {Array} result.milestones - Milestone entries
 * @returns {number} result.weekCount - Actual number of week entries
 *
 * @example
 * const info = getSemesterInfo('/Users/dt/teaching/stat-440');
 * // => { total_weeks: 16, schedule: {...}, milestones: [...], weekCount: 15 }
 */
export function getSemesterInfo(courseRoot) {
  const { manifest } = loadManifest(courseRoot, { validate: false });
  if (!manifest) return null;

  const semester = manifest.semester || {};
  const schedule = semester.schedule || semester;
  const milestones = Array.isArray(semester.milestones) ? semester.milestones : [];
  const weeks = Array.isArray(manifest.weeks) ? manifest.weeks : [];

  return {
    total_weeks: semester.total_weeks || weeks.length,
    schedule,
    milestones,
    weekCount: weeks.length
  };
}

/**
 * Extract a single week entry from an already-loaded manifest
 *
 * Used internally by the loader integration to pull a specific
 * week's data without re-reading the file.
 *
 * @param {Object} manifest - Parsed manifest object (from loadManifest)
 * @param {number|string} weekId - Week number to extract
 * @returns {Object|null} Week object or null if not found
 *
 * @example
 * const { manifest } = loadManifest(courseRoot);
 * const week3 = extractWeekFromManifest(manifest, 3);
 * // => { week: 3, title: 'Regression Analysis', topics: [...], status: 'draft' }
 */
export function extractWeekFromManifest(manifest, weekId) {
  if (!manifest || !Array.isArray(manifest.weeks)) return null;

  const weekNum = typeof weekId === 'number' ? weekId : parseInt(String(weekId), 10);
  if (isNaN(weekNum) || weekNum <= 0) return null;

  return manifest.weeks.find(w => w.week === weekNum) || null;
}

export default {
  findManifest,
  loadManifest,
  getManifestHash,
  updateWeekStatus,
  getSemesterInfo,
  extractWeekFromManifest
};
