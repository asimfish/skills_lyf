/**
 * Tests for canvas-preflight validator
 */

import { runCanvasPreflightValidation } from '../../../src/teaching/validators/canvas-preflight.js';

describe('runCanvasPreflightValidation', () => {
  describe('multiple-choice', () => {
    it('passes when correct answer is present', () => {
      const questions = [{ id: 'Q1', type: 'multiple-choice' }];
      const answerKey = { Q1: 'A' };
      const { errors, warnings } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('errors when no correct answer', () => {
      const questions = [{ id: 'Q1', type: 'multiple-choice' }];
      const answerKey = {};
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatch(/Q1 \[MC\]: no correct answer/);
    });
  });

  describe('true-false', () => {
    it('passes when correct answer is present', () => {
      const questions = [{ id: 'Q2', type: 'true-false' }];
      const answerKey = { Q2: 'True' };
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(0);
    });

    it('errors when no correct answer', () => {
      const questions = [{ id: 'Q2', type: 'true-false' }];
      const answerKey = {};
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors[0]).toMatch(/Q2 \[TF\]: no correct answer/);
    });
  });

  describe('multiple-answers', () => {
    it('passes when 2+ correct answers are present (array)', () => {
      const questions = [{ id: 'Q3', type: 'multiple-answers' }];
      const answerKey = { Q3: ['A', 'C'] };
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(0);
    });

    it('errors when fewer than 2 correct answers', () => {
      const questions = [{ id: 'Q3', type: 'multiple-answers' }];
      const answerKey = { Q3: ['A'] };
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors[0]).toMatch(/Q3 \[MA\]: 1 correct answer/);
    });

    it('errors when no answer at all', () => {
      const questions = [{ id: 'Q3', type: 'multiple-answers' }];
      const answerKey = {};
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors[0]).toMatch(/Q3 \[MA\]: 0 correct answer/);
    });

    it('coerces single string answer to array of 1 (still errors)', () => {
      const questions = [{ id: 'Q3', type: 'multiple-answers' }];
      const answerKey = { Q3: 'A' };
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors[0]).toMatch(/1 correct answer/);
    });
  });

  describe('short-answer / fill-in-blank', () => {
    it('warns when no sample answer', () => {
      const questions = [{ id: 'Q4', type: 'short-answer' }];
      const answerKey = {};
      const { errors, warnings } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(0);
      expect(warnings[0]).toMatch(/Q4 \[Short\]: no sample answer/);
    });

    it('warns for fill-in-blank with no sample answer', () => {
      const questions = [{ id: 'Q5', type: 'fill-in-blank' }];
      const answerKey = {};
      const { warnings } = runCanvasPreflightValidation(questions, answerKey);
      expect(warnings[0]).toMatch(/Q5 \[Short\]/);
    });

    it('passes silently when sample answer is provided', () => {
      const questions = [{ id: 'Q4', type: 'short-answer' }];
      const answerKey = { Q4: 'The mean' };
      const { errors, warnings } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('fill-in-multiple-blanks', () => {
    it('passes when all blanks have answers', () => {
      const questions = [{
        id: 'Q6', type: 'fill-in-multiple-blanks',
        blanks: [{ blankId: 'blank1' }, { blankId: 'blank2' }]
      }];
      const answerKey = { Q6: { blank1: 'mean', blank2: 'variance' } };
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(0);
    });

    it('errors when a blank has no answer', () => {
      const questions = [{
        id: 'Q6', type: 'fill-in-multiple-blanks',
        blanks: [{ blankId: 'blank1' }, { blankId: 'blank2' }]
      }];
      const answerKey = { Q6: { blank1: 'mean' } };
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors[0]).toMatch(/Q6 \[FMB\]: blank\(s\) blank2/);
    });

    it('errors when answer key entry is not an object', () => {
      const questions = [{
        id: 'Q6', type: 'fill-in-multiple-blanks',
        blanks: [{ blankId: 'blank1' }]
      }];
      const answerKey = { Q6: 'flat string' };
      const { errors } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors[0]).toMatch(/Q6 \[FMB\]/);
    });
  });

  describe('unknown types', () => {
    it('ignores question types with no Canvas rules (e.g. essay, numerical)', () => {
      const questions = [
        { id: 'Q7', type: 'essay' },
        { id: 'Q8', type: 'numerical' },
        { id: 'Q9', type: 'matching' }
      ];
      const { errors, warnings } = runCanvasPreflightValidation(questions, {});
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('mixed exam', () => {
    it('collects all errors and warnings across question types', () => {
      const questions = [
        { id: 'Q1', type: 'multiple-choice' },
        { id: 'Q2', type: 'multiple-answers' },
        { id: 'Q3', type: 'short-answer' },
        { id: 'Q4', type: 'true-false' }
      ];
      const answerKey = { Q4: 'False' }; // only Q4 answered
      const { errors, warnings } = runCanvasPreflightValidation(questions, answerKey);
      expect(errors).toHaveLength(2); // Q1 MC, Q2 MA
      expect(warnings).toHaveLength(1); // Q3 short-answer
      expect(errors.some(e => e.includes('Q1'))).toBe(true);
      expect(errors.some(e => e.includes('Q2'))).toBe(true);
      expect(warnings[0]).toMatch(/Q3/);
    });
  });
});
