/**
 * Tests for manifest validation utility
 */

import { validateManifest, createManifestValidator } from '../../../src/teaching/utils/manifest-validator.js';

describe('manifest-validator', () => {
  const validManifest = {
    schema_version: '1.0',
    semester: {
      total_weeks: 15,
      schedule: 'TR'
    },
    weeks: [
      { week: 1, title: 'Test Week', status: 'draft' }
    ]
  };

  describe('validateManifest', () => {
    it('should accept a valid manifest', () => {
      const { valid, errors } = validateManifest(validManifest);
      expect(valid).toBe(true);
      expect(errors).toEqual([]);
    });

    it('should reject manifest missing schema_version', () => {
      const invalid = { semester: { total_weeks: 15, schedule: 'TR' }, weeks: [] };
      const { valid, errors } = validateManifest(invalid);
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject manifest with invalid status', () => {
      const invalid = {
        ...validManifest,
        weeks: [{ week: 1, title: 'Test', status: 'invalid-status' }]
      };
      const { valid, errors } = validateManifest(invalid);
      expect(valid).toBe(false);
      expect(errors.some(e => e.includes('status'))).toBe(true);
    });

    it('should reject manifest with missing weeks array', () => {
      const invalid = { schema_version: '1.0', semester: { total_weeks: 15, schedule: 'TR' } };
      const { valid, errors } = validateManifest(invalid);
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept manifest with multiple valid weeks', () => {
      const multi = {
        ...validManifest,
        weeks: [
          { week: 1, title: 'Week 1', status: 'published' },
          { week: 2, title: 'Week 2', status: 'generated' },
          { week: 3, title: 'Week 3', status: 'draft' }
        ]
      };
      const { valid, errors } = validateManifest(multi);
      expect(valid).toBe(true);
      expect(errors).toEqual([]);
    });

    it('should accept manifest with milestones', () => {
      const withMilestones = {
        ...validManifest,
        semester: {
          ...validManifest.semester,
          milestones: [
            { week: 8, type: 'midterm', label: 'Midterm Exam' }
          ]
        }
      };
      const { valid, errors } = validateManifest(withMilestones);
      expect(valid).toBe(true);
      expect(errors).toEqual([]);
    });

    it('should reject week entry missing title', () => {
      const noTitle = {
        ...validManifest,
        weeks: [{ week: 1, status: 'draft' }]
      };
      const { valid, errors } = validateManifest(noTitle);
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject week entry missing week number', () => {
      const noWeekNum = {
        ...validManifest,
        weeks: [{ title: 'Test', status: 'draft' }]
      };
      const { valid, errors } = validateManifest(noWeekNum);
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should return all errors when multiple issues exist', () => {
      const multiError = {
        weeks: [{ status: 'bad' }]
      };
      const { valid, errors } = validateManifest(multiError);
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('createManifestValidator', () => {
    it('should return a compiled validate function', () => {
      const validator = createManifestValidator();
      expect(validator).not.toBeNull();
      expect(typeof validator).toBe('function');
    });

    it('should validate correctly when used directly', () => {
      const validator = createManifestValidator();
      const result = validator(validManifest);
      expect(result).toBe(true);
    });

    it('should detect invalid data when used directly', () => {
      const validator = createManifestValidator();
      const result = validator({ bad: 'data' });
      expect(result).toBe(false);
      expect(validator.errors.length).toBeGreaterThan(0);
    });
  });
});
