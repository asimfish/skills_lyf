/**
 * Week-level Bidirectional Sync Engine
 *
 * Implements three-way merge for .flow/lesson-plans.yml manifests.
 * Compares Scholar's manifest (ours) with flow-cli's version (theirs)
 * using a stored base hash for conflict detection.
 *
 * Merge strategy:
 * - Non-conflicting: Scholar modifies week 3, flow-cli modifies week 5 -> auto-merge
 * - Conflicting: Both modify week 3 -> use conflictStrategy ('ours' default)
 * - Semester metadata: Last-writer-wins with warning
 *
 * @module teaching/config/manifest-sync
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { sha256 } from '../utils/hash.js';
import { safeWriteYaml } from '../utils/safe-write.js';

/**
 * Cache directory for storing base hashes
 */
const CACHE_DIR = '.scholar-cache';
const BASE_HASH_FILE = 'manifest-base-hash';
const BASE_SNAPSHOT_FILE = 'manifest-base-snapshot.yml';

/**
 * ManifestSyncEngine handles week-level bidirectional sync
 * between Scholar and flow-cli manifests.
 */
export class ManifestSyncEngine {
  /**
   * @param {Object} options
   * @param {string} options.courseRoot - Course root directory
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {boolean} [options.dryRun=false] - Preview without writing
   */
  constructor({ courseRoot, debug = false, dryRun = false } = {}) {
    this.courseRoot = courseRoot;
    this.debug = debug;
    this.dryRun = dryRun;
  }

  /**
   * Load both sides for comparison.
   *
   * @param {string} oursPath - Path to Scholar's manifest
   * @param {string} theirsPath - Path to flow-cli's manifest
   * @returns {{ ours: Object|null, theirs: Object|null, oursHash: string|null, theirsHash: string|null, identical: boolean, errors: string[] }}
   */
  loadSyncPair(oursPath, theirsPath) {
    const errors = [];
    let ours = null;
    let theirs = null;
    let oursHash = null;
    let theirsHash = null;

    // Load ours
    if (existsSync(oursPath)) {
      try {
        const content = readFileSync(oursPath, 'utf8');
        ours = yaml.load(content);
        oursHash = sha256(content);
      } catch (err) {
        errors.push(`Failed to load ours (${oursPath}): ${err.message}`);
      }
    } else {
      errors.push(`Ours not found: ${oursPath}`);
    }

    // Load theirs
    if (existsSync(theirsPath)) {
      try {
        const content = readFileSync(theirsPath, 'utf8');
        theirs = yaml.load(content);
        theirsHash = sha256(content);
      } catch (err) {
        errors.push(`Failed to load theirs (${theirsPath}): ${err.message}`);
      }
    } else {
      errors.push(`Theirs not found: ${theirsPath}`);
    }

    return {
      ours,
      theirs,
      oursHash,
      theirsHash,
      identical: oursHash !== null && oursHash === theirsHash,
      errors
    };
  }

  /**
   * Compute week-level diff using three-way comparison.
   *
   * @param {Object} base - Base manifest (from stored hash point)
   * @param {Object} ours - Scholar's current manifest
   * @param {Object} theirs - flow-cli's current manifest
   * @returns {{ oursChanged: number[], theirsChanged: number[], conflicts: Array, unchanged: number[], deletedByOurs: number[], deletedByTheirs: number[], semesterDiff: boolean }}
   */
  computeWeekDiff(base, ours, theirs) {
    const oursChanged = [];
    const theirsChanged = [];
    const conflicts = [];
    const unchanged = [];
    const deletedByOurs = [];
    const deletedByTheirs = [];

    // Index weeks by week number
    const baseWeeks = this._indexWeeks(base);
    const oursWeeks = this._indexWeeks(ours);
    const theirsWeeks = this._indexWeeks(theirs);

    // Collect all week numbers
    const allWeekNums = new Set([
      ...baseWeeks.keys(),
      ...oursWeeks.keys(),
      ...theirsWeeks.keys()
    ]);

    for (const weekNum of allWeekNums) {
      const baseWeek = baseWeeks.get(weekNum);
      const oursWeek = oursWeeks.get(weekNum);
      const theirsWeek = theirsWeeks.get(weekNum);

      // Detect week deletions: week exists in base but missing from ours or theirs
      if (baseWeek && !oursWeek) {
        deletedByOurs.push(weekNum);
        if (!theirsWeek) {
          deletedByTheirs.push(weekNum);
        }
        continue;
      }
      if (baseWeek && !theirsWeek) {
        deletedByTheirs.push(weekNum);
        continue;
      }

      const baseHash = baseWeek ? sha256(JSON.stringify(baseWeek)) : null;
      const oursWeekHash = oursWeek ? sha256(JSON.stringify(oursWeek)) : null;
      const theirsWeekHash = theirsWeek ? sha256(JSON.stringify(theirsWeek)) : null;

      const oursModified = oursWeekHash !== baseHash;
      const theirsModified = theirsWeekHash !== baseHash;

      if (oursModified && theirsModified) {
        // Both sides changed this week
        if (oursWeekHash === theirsWeekHash) {
          // Same changes on both sides — no conflict
          unchanged.push(weekNum);
        } else {
          // True conflict
          conflicts.push({
            week: weekNum,
            oursVersion: oursWeek,
            theirsVersion: theirsWeek,
            conflictingFields: this._findConflictingFields(oursWeek, theirsWeek)
          });
        }
      } else if (oursModified) {
        oursChanged.push(weekNum);
      } else if (theirsModified) {
        theirsChanged.push(weekNum);
      } else {
        unchanged.push(weekNum);
      }
    }

    // Check semester metadata diff
    const baseSemester = base ? JSON.stringify(base.semester) : '';
    const oursSemester = ours ? JSON.stringify(ours.semester) : '';
    const theirsSemester = theirs ? JSON.stringify(theirs.semester) : '';
    const semesterDiff = oursSemester !== baseSemester || theirsSemester !== baseSemester;

    return {
      oursChanged: oursChanged.sort((a, b) => a - b),
      theirsChanged: theirsChanged.sort((a, b) => a - b),
      conflicts,
      unchanged: unchanged.sort((a, b) => a - b),
      deletedByOurs: deletedByOurs.sort((a, b) => a - b),
      deletedByTheirs: deletedByTheirs.sort((a, b) => a - b),
      semesterDiff
    };
  }

  /**
   * Week-level atomic merge.
   *
   * @param {Object} base - Base manifest
   * @param {Object} ours - Scholar's manifest
   * @param {Object} theirs - flow-cli's manifest
   * @param {Object} [options]
   * @param {string} [options.conflictStrategy='ours'] - How to resolve conflicts: 'ours' or 'theirs'
   * @returns {{ success: boolean, merged: Object, mergedYaml: string, autoMerged: number[], conflicts: Array, backupPath: string|null }}
   */
  mergeManifests(base, ours, theirs, { conflictStrategy = 'ours' } = {}) {
    const diff = this.computeWeekDiff(base, ours, theirs);
    const autoMerged = [];

    // Start from ours as the base for the merged result
    const oursWeeks = this._indexWeeks(ours);
    const theirsWeeks = this._indexWeeks(theirs);
    const mergedWeeks = new Map(oursWeeks);

    // Apply theirs-only changes
    for (const weekNum of diff.theirsChanged) {
      const theirsWeek = theirsWeeks.get(weekNum);
      if (theirsWeek) {
        mergedWeeks.set(weekNum, theirsWeek);
        autoMerged.push(weekNum);
      }
    }

    // Resolve conflicts
    const resolvedConflicts = [];
    for (const conflict of diff.conflicts) {
      if (conflictStrategy === 'theirs') {
        mergedWeeks.set(conflict.week, conflict.theirsVersion);
      }
      // 'ours' is already in place (we started from ours)
      resolvedConflicts.push({
        ...conflict,
        resolution: conflictStrategy
      });
    }

    // Merge semester metadata (last-writer-wins from theirs if changed)
    const mergedSemester = diff.semesterDiff && theirs && theirs.semester
      ? { ...ours.semester, ...theirs.semester }
      : (ours && ours.semester) || {};

    // Build merged manifest
    const merged = {
      schema_version: (ours && ours.schema_version) || '1.0',
      semester: mergedSemester,
      weeks: Array.from(mergedWeeks.values()).sort((a, b) => (a.week || 0) - (b.week || 0))
    };

    const mergedYaml = yaml.dump(merged, { lineWidth: 120, noRefs: true });

    return {
      success: true,
      merged,
      mergedYaml,
      autoMerged: autoMerged.sort((a, b) => a - b),
      conflicts: resolvedConflicts,
      backupPath: null
    };
  }

  /**
   * Write merged result with backup.
   *
   * @param {string} targetPath - Path to write merged manifest
   * @param {string} mergedYaml - YAML content to write
   * @param {Object} [options]
   * @param {boolean} [options.backup=true] - Create backup before writing
   * @returns {{ success: boolean, backupPath: string|null, newHash: string }}
   */
  writeMergedManifest(targetPath, mergedYaml, { backup = true } = {}) {
    if (this.dryRun) {
      return {
        success: true,
        backupPath: null,
        newHash: sha256(mergedYaml)
      };
    }

    const writeResult = safeWriteYaml(targetPath, mergedYaml, { backup });

    return {
      success: writeResult.success,
      backupPath: writeResult.backupPath,
      newHash: writeResult.success ? sha256(mergedYaml) : null
    };
  }

  /**
   * Store the base hash and full manifest snapshot for three-way diff.
   *
   * @param {string} courseRoot - Course root directory (deprecated, uses this.courseRoot)
   * @param {string} hash - SHA-256 hash to store
   * @param {string} [manifestYaml] - Full YAML content of the base manifest
   */
  storeBaseHash(courseRoot, hash, manifestYaml) {
    const root = courseRoot || this.courseRoot;
    const cacheDir = join(root, CACHE_DIR);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    writeFileSync(join(cacheDir, BASE_HASH_FILE), hash, 'utf8');
    if (manifestYaml) {
      writeFileSync(join(cacheDir, BASE_SNAPSHOT_FILE), manifestYaml, 'utf8');
    }
  }

  /**
   * Retrieve the stored base hash.
   *
   * @param {string} [courseRoot] - Course root directory (deprecated, uses this.courseRoot)
   * @returns {string|null} Stored hash, or null if not found
   */
  getBaseHash(courseRoot) {
    const root = courseRoot || this.courseRoot;
    const hashPath = join(root, CACHE_DIR, BASE_HASH_FILE);
    if (!existsSync(hashPath)) return null;

    try {
      return readFileSync(hashPath, 'utf8').trim();
    } catch {
      return null;
    }
  }

  /**
   * Retrieve the stored base manifest snapshot for three-way merge.
   *
   * @param {string} [courseRoot] - Course root directory (deprecated, uses this.courseRoot)
   * @returns {Object|null} Parsed base manifest, or null if not found
   */
  getBaseManifest(courseRoot) {
    const root = courseRoot || this.courseRoot;
    const snapshotPath = join(root, CACHE_DIR, BASE_SNAPSHOT_FILE);
    if (!existsSync(snapshotPath)) return null;

    try {
      const content = readFileSync(snapshotPath, 'utf8');
      return yaml.load(content);
    } catch {
      return null;
    }
  }

  /**
   * Index weeks by week number for fast lookup
   * @private
   */
  _indexWeeks(manifest) {
    const map = new Map();
    if (!manifest || !Array.isArray(manifest.weeks)) return map;

    for (const week of manifest.weeks) {
      if (week && week.week) {
        map.set(week.week, week);
      }
    }
    return map;
  }

  /**
   * Find which fields differ between two week objects
   * @private
   */
  _findConflictingFields(oursWeek, theirsWeek) {
    if (!oursWeek || !theirsWeek) return [];

    const fields = new Set([...Object.keys(oursWeek), ...Object.keys(theirsWeek)]);
    const conflicting = [];

    for (const field of fields) {
      if (JSON.stringify(oursWeek[field]) !== JSON.stringify(theirsWeek[field])) {
        conflicting.push(field);
      }
    }

    return conflicting;
  }
}
