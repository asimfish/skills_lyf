/**
 * Week file discovery utility
 *
 * Centralizes knowledge of where week-level lesson plan files
 * can be found across different project layouts.
 *
 * @module teaching/utils/discovery
 */

import { existsSync, readdirSync } from 'fs';
import { join, relative } from 'path';

/**
 * Known directory locations where week files may reside.
 * Searched in order of preference.
 */
export const WEEK_FILE_LOCATIONS = [
  'content/lesson-plans',
  'lesson-plans',
  'content/plans',
  'plans',
  '.flow/weeks'
];

/**
 * Regex pattern to match week file names.
 * Matches: week01.yml, week1.yml, week-01.yml, week_01.yml, etc.
 */
const WEEK_FILE_PATTERN = /^week[-_]?0*(\d+)\.(yml|yaml)$/i;

/**
 * Parse week number from a filename
 * @param {string} filename - Filename to parse
 * @returns {number|null} Week number or null
 */
export function parseWeekNumber(filename) {
  const match = filename.match(WEEK_FILE_PATTERN);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Find all week files across all known locations in a course root.
 *
 * Scans each directory in WEEK_FILE_LOCATIONS for files matching
 * the week file naming pattern (week*.yml / week*.yaml).
 *
 * @param {string} courseRoot - Course root directory
 * @returns {Array<{ path: string, relativePath: string, weekNumber: number, source: string, filename: string }>}
 *   Sorted by week number ascending.
 *
 * @example
 * const files = findAllWeekFiles('/Users/dt/teaching/stat-440');
 * // => [
 * //   { path: '/full/path/week01.yml', relativePath: 'content/lesson-plans/week01.yml', weekNumber: 1, source: 'content/lesson-plans', filename: 'week01.yml' },
 * //   ...
 * // ]
 */
export function findAllWeekFiles(courseRoot) {
  if (!courseRoot) return [];

  const results = [];

  for (const dir of WEEK_FILE_LOCATIONS) {
    const fullDir = join(courseRoot, dir);
    if (!existsSync(fullDir)) continue;

    let entries;
    try {
      entries = readdirSync(fullDir);
    } catch {
      continue;
    }

    for (const filename of entries) {
      const weekNum = parseWeekNumber(filename);
      if (weekNum === null) continue;

      const fullPath = join(fullDir, filename);
      results.push({
        path: fullPath,
        relativePath: relative(courseRoot, fullPath),
        weekNumber: weekNum,
        source: dir,
        filename
      });
    }
  }

  // Sort by week number, then by source priority (first match wins for duplicates)
  results.sort((a, b) => a.weekNumber - b.weekNumber);

  return results;
}

/**
 * Find which known directories exist in a course root
 * @param {string} courseRoot - Course root directory
 * @returns {string[]} Array of existing directory paths (relative)
 */
export function findExistingWeekDirs(courseRoot) {
  if (!courseRoot) return [];

  return WEEK_FILE_LOCATIONS.filter(dir => {
    const fullDir = join(courseRoot, dir);
    return existsSync(fullDir);
  });
}
