/**
 * Unit Tests: Dry-Run Utility
 *
 * Tests truncation, token estimation, sanitization, key formatting,
 * isDryRun detection, and output path generation.
 */

import { describe, it, expect } from '@jest/globals';
import {
  truncatePrompt,
  estimateTokens,
  estimateTokensFromOptions,
  isDryRun,
  generateOutputPath
} from '../../src/teaching/utils/dry-run.js';

// ─────────────────────────────────────────────────────────────
// truncatePrompt
// ─────────────────────────────────────────────────────────────

describe('truncatePrompt()', () => {
  it('should return short prompts unchanged', () => {
    expect(truncatePrompt('Hello world', 200)).toBe('Hello world');
  });

  it('should truncate long prompts with ellipsis', () => {
    const long = 'a'.repeat(300);
    const result = truncatePrompt(long, 100);
    expect(result.length).toBe(103); // 100 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should handle null/undefined input', () => {
    expect(truncatePrompt(null)).toBe('(no prompt)');
    expect(truncatePrompt(undefined)).toBe('(no prompt)');
    expect(truncatePrompt('')).toBe('(no prompt)');
  });

  it('should collapse internal whitespace', () => {
    const result = truncatePrompt('Hello    world\n\nfoo\tbar', 200);
    expect(result).toBe('Hello world foo bar');
  });

  it('should use default maxLength of 200', () => {
    const long = 'word '.repeat(100);
    const result = truncatePrompt(long);
    expect(result.length).toBeLessThanOrEqual(203);
  });

  it('should handle exact-length input', () => {
    const exact = 'a'.repeat(200);
    expect(truncatePrompt(exact, 200)).toBe(exact);
  });
});

// ─────────────────────────────────────────────────────────────
// estimateTokens
// ─────────────────────────────────────────────────────────────

describe('estimateTokens()', () => {
  it('should estimate ~4 chars per token plus response overhead', () => {
    const prompt = 'a'.repeat(400); // 400 chars → 100 prompt tokens
    const result = estimateTokens(prompt);
    // 100 prompt tokens + 2000 response estimate = 2100
    expect(result).toBe(2100);
  });

  it('should return 0 for empty/null prompt', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens(null)).toBe(0);
    expect(estimateTokens(undefined)).toBe(0);
  });

  it('should handle short prompts', () => {
    const result = estimateTokens('Hello');
    // ceil(5/4) + 2000 = 2 + 2000 = 2002
    expect(result).toBe(2002);
  });
});

// ─────────────────────────────────────────────────────────────
// estimateTokensFromOptions
// ─────────────────────────────────────────────────────────────

describe('estimateTokensFromOptions()', () => {
  it('should return base estimate for known commands', () => {
    expect(estimateTokensFromOptions('exam', {})).toBe(3000);
    expect(estimateTokensFromOptions('quiz', {})).toBe(1500);
    expect(estimateTokensFromOptions('syllabus', {})).toBe(2500);
  });

  it('should handle lecture-notes command (section-based)', () => {
    const result = estimateTokensFromOptions('lecture-notes', {});
    // Default 12 sections * 800 = 9600
    expect(result).toBe(9600);
  });

  it('should handle lecture alias', () => {
    const result = estimateTokensFromOptions('lecture', {});
    expect(result).toBe(9600);
  });

  it('should adjust for custom section count', () => {
    const result = estimateTokensFromOptions('lecture', { sectionCount: 5 });
    expect(result).toBe(4000); // 5 * 800
  });

  it('should adjust for question count', () => {
    const base = estimateTokensFromOptions('quiz', {});
    const withQuestions = estimateTokensFromOptions('quiz', { questionCount: 10 });
    expect(withQuestions).toBe(base + 1500); // 10 * 150
  });

  it('should adjust for weeks option', () => {
    const base = estimateTokensFromOptions('syllabus', {});
    const withWeeks = estimateTokensFromOptions('syllabus', { weeks: 15 });
    expect(withWeeks).toBe(base + 1500); // 15 * 100
  });

  it('should return default for unknown commands', () => {
    expect(estimateTokensFromOptions('unknown-command', {})).toBe(2000);
  });
});

// ─────────────────────────────────────────────────────────────
// isDryRun
// ─────────────────────────────────────────────────────────────

describe('isDryRun()', () => {
  it('should detect dryRun: true', () => {
    expect(isDryRun({ dryRun: true })).toBe(true);
  });

  it('should detect dry-run: true (kebab-case)', () => {
    expect(isDryRun({ 'dry-run': true })).toBe(true);
  });

  it('should return false for no dry-run flags', () => {
    expect(isDryRun({})).toBe(false);
    expect(isDryRun({ dryRun: false })).toBe(false);
    expect(isDryRun({ 'dry-run': false })).toBe(false);
  });

  it('should not treat truthy non-boolean values as true', () => {
    expect(isDryRun({ dryRun: 'yes' })).toBe(false);
    expect(isDryRun({ dryRun: 1 })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// generateOutputPath
// ─────────────────────────────────────────────────────────────

describe('generateOutputPath()', () => {
  it('should generate lecture filename with --from-plan', () => {
    const result = generateOutputPath('lecture-notes', {
      topic: 'Regression',
      fromPlan: 'week08'
    });
    expect(result).toBe('week08-regression.qmd');
  });

  it('should generate lecture filename without --from-plan', () => {
    const result = generateOutputPath('lecture-notes', {
      topic: 'ANOVA'
    });
    expect(result).toBe('lecture-anova.qmd');
  });

  it('should prepend outputDir for lecture', () => {
    const result = generateOutputPath('lecture', {
      topic: 'Test',
      outputDir: 'content/lectures'
    });
    expect(result).toBe('content/lectures/lecture-test.qmd');
  });

  it('should normalize trailing slash in outputDir', () => {
    const result = generateOutputPath('lecture', {
      topic: 'Test',
      outputDir: 'content/lectures/'
    });
    expect(result).toBe('content/lectures/lecture-test.qmd');
  });

  it('should generate date-based filename for non-lecture commands', () => {
    const result = generateOutputPath('exam', { format: 'md' });
    // Format: exam-exam-YYYY-MM-DD.md
    expect(result).toMatch(/^exam-exam-\d{4}-\d{2}-\d{2}\.md$/);
  });

  it('should map format to correct extension', () => {
    expect(generateOutputPath('quiz', { format: 'latex' })).toMatch(/\.tex$/);
    expect(generateOutputPath('quiz', { format: 'json' })).toMatch(/\.json$/);
    expect(generateOutputPath('quiz', { format: 'quarto' })).toMatch(/\.qmd$/);
    expect(generateOutputPath('exam', { format: 'canvas' })).toMatch(/\.qti\.zip$/);
  });

  it('should default to .md extension', () => {
    const result = generateOutputPath('quiz', {});
    expect(result).toMatch(/\.md$/);
  });
});
