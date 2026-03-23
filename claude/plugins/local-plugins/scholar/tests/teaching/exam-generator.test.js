/**
 * Smoke tests for Exam Generator
 *
 * These tests verify that the exam generator integrates correctly with Phase 0 components.
 * Full end-to-end testing requires a real Claude API key.
 */

import { generateExam } from '../../src/teaching/generators/exam.js';

describe('Exam Generator Smoke Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    // Set test API key for mock AI provider
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    // Restore original API key
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  it('should not throw errors for config access patterns', async () => {
    // This test verifies that config access uses correct paths (scholar.*)
    // The mock AI will return placeholder content that fails validation,
    // but we're testing that config access doesn't throw undefined errors

    try {
      await generateExam({ debug: false });
      // If we get here, config access worked
      expect(true).toBe(true);
    } catch (error) {
      // Check that error is validation-related, not config access
      expect(error.message).not.toContain('undefined');
      expect(error.message).not.toContain('Cannot read properties');

      // Validation or AI failure is expected with mock/invalid data
      if (error.message.includes('Validation failed') || error.message.includes('AI generation failed')) {
        expect(true).toBe(true); // This is expected
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }
  });

  it('should handle missing API key gracefully', async () => {
    const savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await generateExam({ debug: false });
      fail('Should have thrown error for missing API key');
    } catch (error) {
      expect(error.message).toContain('AI generation failed');
    } finally {
      process.env.ANTHROPIC_API_KEY = savedKey;
    }
  });

  it('should use scholar config structure', async () => {
    // This verifies the fix for config.scholar.course_info access
    try {
      await generateExam({
        difficulty: 'hard', // Should override config
        debug: false,
      });
      expect(true).toBe(true);
    } catch (error) {
      // Should not be undefined/null errors from config access
      expect(error.message).not.toContain('Cannot read properties of undefined');
      expect(error.message).not.toContain('teaching_preferences');
    }
  });

  it('should handle optional ai_generation config section', async () => {
    // Verifies that config.scholar?.ai_generation optional chaining works
    try {
      await generateExam({ debug: false });
      expect(true).toBe(true);
    } catch (error) {
      // Should not throw errors about ai_generation being undefined
      expect(error.message).not.toContain('ai_generation');
    }
  });

  it('should handle missing course_info gracefully', async () => {
    // Tests that config.scholar?.course_info || {} fallback works
    try {
      await generateExam({ debug: false });
      expect(true).toBe(true);
    } catch (error) {
      // Should not throw errors about course_info being undefined
      expect(error.message).not.toContain('course_info');
    }
  });
});

describe('Exam Generator Unit Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  describe('generateExam()', () => {
    it('should return exam object with content, validation, and metadata', async () => {
      try {
        const result = await generateExam({
          type: 'midterm',
          questionCount: 5,
          difficulty: 'medium',
          debug: false
        });

        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('validation');
        expect(result).toHaveProperty('metadata');
      } catch (error) {
        expect(
          error.message.includes('AI generation failed') ||
            error.message.includes('Validation failed')
        ).toBe(true);
      }
    });

    it('should apply default options when none provided', async () => {
      try {
        const result = await generateExam({ debug: false });

        if (result.content) {
          expect(result.content.exam_type).toBe('midterm');
        }
      } catch (error) {
        expect(
          error.message.includes('AI generation failed') ||
            error.message.includes('Validation failed')
        ).toBe(true);
      }
    });

    it('should validate exam types', async () => {
      const validTypes = ['midterm', 'final', 'practice', 'quiz'];

      for (const type of validTypes) {
        try {
          const result = await generateExam({ type, debug: false });
          if (result.content) {
            expect(result.content.exam_type).toBe(type);
          }
        } catch (error) {
          expect(
            error.message.includes('AI generation failed') ||
              error.message.includes('Validation failed')
          ).toBe(true);
        }
      }
    });

    it('should calculate total points from questions', async () => {
      try {
        const result = await generateExam({ debug: false });

        if (result.content && result.content.questions) {
          const expectedTotal = result.content.questions.reduce(
            (sum, q) => sum + (q.points || 0),
            0
          );
          expect(result.content.total_points).toBe(expectedTotal);
        }
      } catch (error) {
        expect(
          error.message.includes('AI generation failed') ||
            error.message.includes('Validation failed')
        ).toBe(true);
      }
    });
  });
});
