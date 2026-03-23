/**
 * Unit Tests: Slugify Edge Cases
 */

import { describe, it, expect } from '@jest/globals';
import { slugify, generateLectureFilename } from '../../src/teaching/utils/slugify.js';

describe('slugify() edge cases', () => {
  it('should handle unicode characters', () => {
    expect(slugify('Régression Linéaire')).toBe('r-gression-lin-aire');
  });

  it('should handle emoji', () => {
    expect(slugify('📊 Data Analysis')).toBe('data-analysis');
  });

  it('should handle all-special-character input', () => {
    expect(slugify('!@#$%^&*()')).toBe('untitled');
  });

  it('should handle numeric-only input', () => {
    expect(slugify('12345')).toBe('12345');
  });

  it('should handle very long input by truncating to 80 chars', () => {
    const long = 'a'.repeat(500);
    const slug = slugify(long);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toBe('a'.repeat(80));
  });

  it('should handle 0 (falsy number)', () => {
    expect(slugify(0)).toBe('untitled');
  });

  it('should handle false', () => {
    expect(slugify(false)).toBe('untitled');
  });

  it('should handle tabs and newlines', () => {
    expect(slugify('Hello\tWorld\n')).toBe('hello-world');
  });
});

describe('generateLectureFilename() edge cases', () => {
  it('should handle fromPlan with no digits', () => {
    const result = generateLectureFilename({ topic: 'Test', fromPlan: 'midterm' });
    // No digits → weekNum = '00'
    expect(result).toBe('week00-test.qmd');
  });

  it('should handle fromPlan = "0"', () => {
    const result = generateLectureFilename({ topic: 'Intro', fromPlan: '0' });
    expect(result).toBe('week00-intro.qmd');
  });

  it('should not double-pad already-padded fromPlan', () => {
    const result = generateLectureFilename({ topic: 'Test', fromPlan: 'week08' });
    expect(result).toBe('week08-test.qmd');
  });

  it('should handle 3-digit week numbers', () => {
    const result = generateLectureFilename({ topic: 'Test', fromPlan: 'week100' });
    expect(result).toBe('week100-test.qmd');
  });

  it('should handle topic with all special chars (becomes untitled)', () => {
    const result = generateLectureFilename({ topic: '!!!' });
    expect(result).toBe('lecture-untitled.qmd');
  });

  it('should handle empty object', () => {
    const result = generateLectureFilename({});
    expect(result).toBe('lecture-untitled.qmd');
  });
});
