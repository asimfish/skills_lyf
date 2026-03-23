/**
 * Tests for week file discovery utility
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { WEEK_FILE_LOCATIONS, findAllWeekFiles, findExistingWeekDirs, parseWeekNumber } from '../../../src/teaching/utils/discovery.js';

describe('discovery', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-discovery-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('WEEK_FILE_LOCATIONS', () => {
    it('should export a non-empty array', () => {
      expect(Array.isArray(WEEK_FILE_LOCATIONS)).toBe(true);
      expect(WEEK_FILE_LOCATIONS.length).toBeGreaterThan(0);
    });

    it('should include content/lesson-plans', () => {
      expect(WEEK_FILE_LOCATIONS).toContain('content/lesson-plans');
    });

    it('should include .flow/weeks', () => {
      expect(WEEK_FILE_LOCATIONS).toContain('.flow/weeks');
    });

    it('should include lesson-plans', () => {
      expect(WEEK_FILE_LOCATIONS).toContain('lesson-plans');
    });
  });

  describe('parseWeekNumber', () => {
    it('should parse week01.yml', () => {
      expect(parseWeekNumber('week01.yml')).toBe(1);
    });

    it('should parse week1.yml', () => {
      expect(parseWeekNumber('week1.yml')).toBe(1);
    });

    it('should parse week-03.yml', () => {
      expect(parseWeekNumber('week-03.yml')).toBe(3);
    });

    it('should parse week_12.yml', () => {
      expect(parseWeekNumber('week_12.yml')).toBe(12);
    });

    it('should parse week15.yaml', () => {
      expect(parseWeekNumber('week15.yaml')).toBe(15);
    });

    it('should return null for non-week files', () => {
      expect(parseWeekNumber('teach-config.yml')).toBeNull();
      expect(parseWeekNumber('lesson-plans.yml')).toBeNull();
      expect(parseWeekNumber('readme.md')).toBeNull();
    });
  });

  describe('findAllWeekFiles', () => {
    it('should return empty array for null courseRoot', () => {
      expect(findAllWeekFiles(null)).toEqual([]);
    });

    it('should return empty array when no week dirs exist', () => {
      expect(findAllWeekFiles(tmpDir)).toEqual([]);
    });

    it('should find week files in content/lesson-plans', () => {
      const dir = path.join(tmpDir, 'content', 'lesson-plans');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'week01.yml'), 'week: 1\ntitle: Test\n');
      fs.writeFileSync(path.join(dir, 'week02.yml'), 'week: 2\ntitle: Test2\n');

      const results = findAllWeekFiles(tmpDir);

      expect(results).toHaveLength(2);
      expect(results[0].weekNumber).toBe(1);
      expect(results[0].source).toBe('content/lesson-plans');
      expect(results[1].weekNumber).toBe(2);
    });

    it('should find week files in .flow/weeks', () => {
      const dir = path.join(tmpDir, '.flow', 'weeks');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'week05.yml'), 'week: 5\n');

      const results = findAllWeekFiles(tmpDir);

      expect(results).toHaveLength(1);
      expect(results[0].weekNumber).toBe(5);
      expect(results[0].source).toBe('.flow/weeks');
    });

    it('should find files across multiple directories', () => {
      const dir1 = path.join(tmpDir, 'content', 'lesson-plans');
      const dir2 = path.join(tmpDir, 'lesson-plans');
      fs.mkdirSync(dir1, { recursive: true });
      fs.mkdirSync(dir2, { recursive: true });
      fs.writeFileSync(path.join(dir1, 'week01.yml'), 'week: 1\n');
      fs.writeFileSync(path.join(dir2, 'week05.yml'), 'week: 5\n');

      const results = findAllWeekFiles(tmpDir);

      expect(results).toHaveLength(2);
      expect(results[0].weekNumber).toBe(1);
      expect(results[1].weekNumber).toBe(5);
    });

    it('should sort by week number', () => {
      const dir = path.join(tmpDir, 'lesson-plans');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'week10.yml'), 'week: 10\n');
      fs.writeFileSync(path.join(dir, 'week03.yml'), 'week: 3\n');
      fs.writeFileSync(path.join(dir, 'week01.yml'), 'week: 1\n');

      const results = findAllWeekFiles(tmpDir);

      expect(results.map(r => r.weekNumber)).toEqual([1, 3, 10]);
    });

    it('should ignore non-week files', () => {
      const dir = path.join(tmpDir, 'lesson-plans');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'week01.yml'), 'week: 1\n');
      fs.writeFileSync(path.join(dir, 'teach-config.yml'), 'config: true\n');
      fs.writeFileSync(path.join(dir, 'README.md'), '# Plans\n');

      const results = findAllWeekFiles(tmpDir);

      expect(results).toHaveLength(1);
      expect(results[0].weekNumber).toBe(1);
    });

    it('should include relativePath and filename', () => {
      const dir = path.join(tmpDir, 'content', 'lesson-plans');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'week03.yml'), 'week: 3\n');

      const results = findAllWeekFiles(tmpDir);

      expect(results[0].relativePath).toBe(path.join('content', 'lesson-plans', 'week03.yml'));
      expect(results[0].filename).toBe('week03.yml');
    });

    it('should handle week files with different naming patterns', () => {
      const dir = path.join(tmpDir, 'lesson-plans');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'week-01.yml'), 'week: 1\n');
      fs.writeFileSync(path.join(dir, 'week_02.yml'), 'week: 2\n');
      fs.writeFileSync(path.join(dir, 'week3.yml'), 'week: 3\n');

      const results = findAllWeekFiles(tmpDir);

      expect(results).toHaveLength(3);
      expect(results.map(r => r.weekNumber)).toEqual([1, 2, 3]);
    });
  });

  describe('findExistingWeekDirs', () => {
    it('should return empty array for null courseRoot', () => {
      expect(findExistingWeekDirs(null)).toEqual([]);
    });

    it('should return empty array when no dirs exist', () => {
      expect(findExistingWeekDirs(tmpDir)).toEqual([]);
    });

    it('should find existing directories', () => {
      fs.mkdirSync(path.join(tmpDir, 'content', 'lesson-plans'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, '.flow', 'weeks'), { recursive: true });

      const dirs = findExistingWeekDirs(tmpDir);

      expect(dirs).toContain('content/lesson-plans');
      expect(dirs).toContain('.flow/weeks');
      expect(dirs).not.toContain('lesson-plans');
    });
  });
});
