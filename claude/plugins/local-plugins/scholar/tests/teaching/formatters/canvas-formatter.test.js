/**
 * Tests for CanvasFormatter verify tolerance (E3)
 *
 * Tests the _parseExamarkWarnings method and tolerant validateQTI behavior.
 */

import { CanvasFormatter } from '../../../src/teaching/formatters/canvas.js';

describe('CanvasFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new CanvasFormatter();
  });

  describe('_parseExamarkWarnings()', () => {
    it('classifies "No correct answer defined" lines as warnings', () => {
      const stderr = [
        '- Question 4: No correct answer defined',
        '- Question 5: No correct answer defined',
      ].join('\n');

      const { errors, warnings } = formatter._parseExamarkWarnings(stderr);
      expect(warnings).toHaveLength(2);
      expect(errors).toHaveLength(0);
    });

    it('classifies other failure lines as errors', () => {
      const stderr = [
        '- Question 1: Invalid XML structure',
        '- Question 2: Missing assessment metadata',
      ].join('\n');

      const { errors, warnings } = formatter._parseExamarkWarnings(stderr);
      expect(errors).toHaveLength(2);
      expect(warnings).toHaveLength(0);
    });

    it('separates warnings from errors in mixed output', () => {
      const stderr = [
        '- Question 1: Invalid XML structure',
        '- Question 4: No correct answer defined',
        '- Question 6: No correct answer defined',
      ].join('\n');

      const { errors, warnings } = formatter._parseExamarkWarnings(stderr);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid XML structure');
      expect(warnings).toHaveLength(2);
    });

    it('returns empty arrays for empty stderr', () => {
      const { errors, warnings } = formatter._parseExamarkWarnings('');
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('ignores lines that do not start with -', () => {
      const stderr = [
        'Verifying QTI package...',
        '- Question 4: No correct answer defined',
        'Done.',
      ].join('\n');

      const { errors, warnings } = formatter._parseExamarkWarnings(stderr);
      expect(warnings).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });
  });

  describe('getFileExtension()', () => {
    it('returns .qti.zip', () => {
      expect(formatter.getFileExtension()).toBe('.qti.zip');
    });
  });

  describe('validate()', () => {
    it('returns invalid for non-existent file', async () => {
      const result = await formatter.validate('/nonexistent/path.qti.zip');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('QTI file does not exist');
    });
  });
});
