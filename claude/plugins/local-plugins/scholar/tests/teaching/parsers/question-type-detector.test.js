import { describe, it, expect } from '@jest/globals';
import {
  detectQuestionType,
  typeToTag,
  tagToType,
} from '../../../src/teaching/parsers/question-type-detector.js';

describe('detectQuestionType', () => {
  describe('explicit type override', () => {
    const explicitCases = [
      ['multiple-choice', 'MC'],
      ['multiple-answer', 'MA'],
      ['true-false', 'TF'],
      ['short-answer', 'Short'],
      ['numerical', 'Numeric'],
      ['essay', 'Essay'],
      ['matching', 'Match'],
      ['fill-in-multiple-blanks', 'FMB'],
      ['fill-in-blank', 'FIB'],
      ['file-upload', 'Upload'],
    ];

    it.each(explicitCases)(
      'maps explicitType "%s" to "%s"',
      (explicitType, expected) => {
        const result = detectQuestionType({
          text: 'Some question',
          explicitType,
        });
        expect(result).toBe(expected);
      }
    );

    it('ignores unrecognized explicitType and falls through', () => {
      const result = detectQuestionType({
        text: 'Short question',
        explicitType: 'unknown-type',
      });
      // Should fall through to heuristic detection (Short for brief text)
      expect(result).toBe('Short');
    });

    it('explicit type takes priority over other signals', () => {
      const result = detectQuestionType({
        text: 'Calculate the value of x with [blank1] and [blank2]',
        explicitType: 'essay',
        options: ['A', 'B', 'C', 'D'],
        hasFileUpload: true,
        pairs: [{ left: 'a', right: '1' }],
      });
      expect(result).toBe('Essay');
    });
  });

  describe('file upload detection', () => {
    it('detects upload from hasFileUpload flag', () => {
      const result = detectQuestionType({
        text: 'Submit your project report.',
        hasFileUpload: true,
      });
      expect(result).toBe('Upload');
    });

    it('file upload takes priority over options', () => {
      const result = detectQuestionType({
        text: 'Upload your work',
        hasFileUpload: true,
        options: ['A', 'B', 'C'],
      });
      expect(result).toBe('Upload');
    });

    it('does not detect upload when flag is false', () => {
      const result = detectQuestionType({
        text: 'Short question here',
        hasFileUpload: false,
      });
      expect(result).not.toBe('Upload');
    });
  });

  describe('matching detection', () => {
    it('detects matching from pairs array', () => {
      const result = detectQuestionType({
        text: 'Match the following terms with their definitions.',
        pairs: [
          { left: 'Mean', right: 'Average' },
          { left: 'Median', right: 'Middle value' },
        ],
      });
      expect(result).toBe('Match');
    });

    it('does not detect matching with empty pairs', () => {
      const result = detectQuestionType({
        text: 'Short question',
        pairs: [],
      });
      expect(result).not.toBe('Match');
    });

    it('does not detect matching when pairs is undefined', () => {
      const result = detectQuestionType({
        text: 'Short question',
      });
      expect(result).not.toBe('Match');
    });
  });

  describe('fill-in-blank detection', () => {
    it('detects FMB with multiple [blankN] placeholders', () => {
      const result = detectQuestionType({
        text: 'The mean is [blank1] and the median is [blank2].',
      });
      expect(result).toBe('FMB');
    });

    it('detects FMB with multiple [___] placeholders', () => {
      const result = detectQuestionType({
        text: 'A [___] test compares [___] groups.',
      });
      expect(result).toBe('FMB');
    });

    it('detects FMB with mixed placeholder syntax', () => {
      const result = detectQuestionType({
        text: 'The [blank1] is calculated using [___].',
      });
      expect(result).toBe('FMB');
    });

    it('detects FIB with single [blank] placeholder', () => {
      const result = detectQuestionType({
        text: 'The standard deviation is [blank].',
      });
      expect(result).toBe('FIB');
    });

    it('detects FIB with single [___] placeholder', () => {
      const result = detectQuestionType({
        text: 'The p-value threshold is [___].',
      });
      expect(result).toBe('FIB');
    });

    it('detects FIB with single [blank1] placeholder', () => {
      const result = detectQuestionType({
        text: 'The correlation coefficient is [blank1].',
      });
      expect(result).toBe('FIB');
    });

    it('fill-in-blank takes priority over options', () => {
      const result = detectQuestionType({
        text: 'Fill in the [blank] for this question.',
        options: ['A', 'B', 'C', 'D'],
      });
      expect(result).toBe('FIB');
    });
  });

  describe('true/false detection', () => {
    it('detects TF from True/False options', () => {
      const result = detectQuestionType({
        text: 'The mean is always equal to the median.',
        options: ['True', 'False'],
      });
      expect(result).toBe('TF');
    });

    it('detects TF from T/F options', () => {
      const result = detectQuestionType({
        text: 'A normal distribution is symmetric.',
        options: ['T', 'F'],
      });
      expect(result).toBe('TF');
    });

    it('detects TF from true/false lowercase options', () => {
      const result = detectQuestionType({
        text: 'Correlation implies causation.',
        options: ['true', 'false'],
      });
      expect(result).toBe('TF');
    });

    it('detects TF from Yes/No options', () => {
      const result = detectQuestionType({
        text: 'Is the sample size sufficient?',
        options: ['Yes', 'No'],
      });
      expect(result).toBe('TF');
    });

    it('detects TF with reversed order (False/True)', () => {
      const result = detectQuestionType({
        text: 'The variance can be negative.',
        options: ['False', 'True'],
      });
      expect(result).toBe('TF');
    });

    it('does not misclassify 2-option MC as TF', () => {
      const result = detectQuestionType({
        text: 'Which method is better?',
        options: ['Method A', 'Method B'],
      });
      expect(result).toBe('MC');
    });

    it('does not misclassify 3-option with True/False as TF', () => {
      const result = detectQuestionType({
        text: 'Select the best answer.',
        options: ['True', 'False', 'Not enough information'],
      });
      expect(result).toBe('MC');
    });
  });

  describe('multiple answer detection', () => {
    it('detects MA from selectMultiple flag', () => {
      const result = detectQuestionType({
        text: 'Select all that apply.',
        options: ['A', 'B', 'C', 'D'],
        selectMultiple: true,
      });
      expect(result).toBe('MA');
    });

    it('detects MA from multiple correctAnswers', () => {
      const result = detectQuestionType({
        text: 'Which of the following are true?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswers: [0, 2],
      });
      expect(result).toBe('MA');
    });

    it('does not detect MA with single correctAnswer', () => {
      const result = detectQuestionType({
        text: 'Choose the best answer.',
        options: ['A', 'B', 'C', 'D'],
        correctAnswers: [1],
      });
      expect(result).toBe('MC');
    });

    it('selectMultiple takes priority over single correctAnswer', () => {
      const result = detectQuestionType({
        text: 'Select all valid options.',
        options: ['A', 'B', 'C'],
        selectMultiple: true,
        correctAnswers: [0],
      });
      expect(result).toBe('MA');
    });
  });

  describe('multiple choice detection', () => {
    it('detects MC from options array', () => {
      const result = detectQuestionType({
        text: 'What is the mean of {1, 2, 3}?',
        options: ['1', '2', '3', '4'],
      });
      expect(result).toBe('MC');
    });

    it('defaults to MC with 4 options', () => {
      const result = detectQuestionType({
        text: 'Choose one.',
        options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      });
      expect(result).toBe('MC');
    });

    it('detects MC with 3 options', () => {
      const result = detectQuestionType({
        text: 'Pick the correct answer.',
        options: ['Low', 'Medium', 'High'],
      });
      expect(result).toBe('MC');
    });

    it('detects MC with 5 options', () => {
      const result = detectQuestionType({
        text: 'Select the best option.',
        options: ['A', 'B', 'C', 'D', 'E'],
      });
      expect(result).toBe('MC');
    });
  });

  describe('numerical detection', () => {
    it('detects numeric from "calculate" keyword', () => {
      const result = detectQuestionType({
        text: 'Calculate the standard deviation of the dataset.',
      });
      expect(result).toBe('Numeric');
    });

    it('detects numeric from "compute" keyword', () => {
      const result = detectQuestionType({
        text: 'Compute the sum of squares.',
      });
      expect(result).toBe('Numeric');
    });

    it('detects numeric from "find the value" keyword', () => {
      const result = detectQuestionType({
        text: 'Find the value of the test statistic.',
      });
      expect(result).toBe('Numeric');
    });

    it('detects numeric from "how many" keyword', () => {
      const result = detectQuestionType({
        text: 'How many degrees of freedom does this test have?',
      });
      expect(result).toBe('Numeric');
    });

    it('detects numeric from answerType number', () => {
      const result = detectQuestionType({
        text: 'What is x?',
        answerType: 'number',
      });
      expect(result).toBe('Numeric');
    });

    it('does not detect numeric when options are present', () => {
      const result = detectQuestionType({
        text: 'Calculate the mean.',
        options: ['10', '20', '30', '40'],
      });
      expect(result).toBe('MC');
    });

    it('detects numeric case-insensitively', () => {
      const result = detectQuestionType({
        text: 'CALCULATE the total.',
      });
      expect(result).toBe('Numeric');
    });
  });

  describe('short answer vs essay', () => {
    it('detects short answer for brief questions', () => {
      const result = detectQuestionType({
        text: 'Define the null hypothesis.',
      });
      expect(result).toBe('Short');
    });

    it('detects short answer for questions under 200 chars', () => {
      const result = detectQuestionType({
        text: 'Explain the difference between Type I and Type II errors in one sentence.',
      });
      expect(result).toBe('Short');
    });

    it('defaults to essay for long questions', () => {
      const longText =
        'Discuss in detail the implications of the Central Limit Theorem for statistical inference. ' +
        'Include examples from both parametric and non-parametric settings, and explain how sample size ' +
        'affects the approximation quality. Consider edge cases where the theorem may not apply.';
      expect(longText.length).toBeGreaterThanOrEqual(200);
      const result = detectQuestionType({ text: longText });
      expect(result).toBe('Essay');
    });

    it('defaults to essay when nothing matches and text is empty', () => {
      const result = detectQuestionType({ text: '' });
      expect(result).toBe('Essay');
    });

    it('defaults to essay for undefined text', () => {
      const result = detectQuestionType({});
      expect(result).toBe('Essay');
    });
  });

  describe('priority ordering', () => {
    it('explicit type beats file upload', () => {
      const result = detectQuestionType({
        text: 'Q',
        explicitType: 'matching',
        hasFileUpload: true,
      });
      expect(result).toBe('Match');
    });

    it('file upload beats matching pairs', () => {
      const result = detectQuestionType({
        text: 'Q',
        hasFileUpload: true,
        pairs: [{ left: 'a', right: 'b' }],
      });
      expect(result).toBe('Upload');
    });

    it('matching beats fill-in-blank', () => {
      const result = detectQuestionType({
        text: 'Match [blank1] with [blank2].',
        pairs: [{ left: 'a', right: 'b' }],
      });
      expect(result).toBe('Match');
    });

    it('fill-in-blank beats true/false', () => {
      const result = detectQuestionType({
        text: 'The answer is [blank].',
        options: ['True', 'False'],
      });
      expect(result).toBe('FIB');
    });

    it('true/false beats multiple choice', () => {
      const result = detectQuestionType({
        text: 'Is this true?',
        options: ['True', 'False'],
      });
      expect(result).toBe('TF');
    });

    it('numeric keyword does not override options', () => {
      const result = detectQuestionType({
        text: 'Calculate which is correct.',
        options: ['A', 'B'],
      });
      // 2 options, not TF pair, so MC
      expect(result).toBe('MC');
    });
  });
});

describe('typeToTag', () => {
  const mappings = [
    ['multiple-choice', 'MC'],
    ['multiple-answer', 'MA'],
    ['true-false', 'TF'],
    ['short-answer', 'Short'],
    ['numerical', 'Numeric'],
    ['essay', 'Essay'],
    ['matching', 'Match'],
    ['fill-in-multiple-blanks', 'FMB'],
    ['fill-in-blank', 'FIB'],
    ['file-upload', 'Upload'],
  ];

  it.each(mappings)('maps "%s" to "%s"', (type, expectedTag) => {
    expect(typeToTag(type)).toBe(expectedTag);
  });

  it('throws for unknown type', () => {
    expect(() => typeToTag('unknown')).toThrow('Unknown question type');
  });

  it('throws for empty string', () => {
    expect(() => typeToTag('')).toThrow('Unknown question type');
  });
});

describe('tagToType', () => {
  const mappings = [
    ['MC', 'multiple-choice'],
    ['MA', 'multiple-answer'],
    ['TF', 'true-false'],
    ['Short', 'short-answer'],
    ['Numeric', 'numerical'],
    ['Essay', 'essay'],
    ['Match', 'matching'],
    ['FMB', 'fill-in-multiple-blanks'],
    ['FIB', 'fill-in-blank'],
    ['Upload', 'file-upload'],
  ];

  it.each(mappings)('maps "%s" to "%s"', (tag, expectedType) => {
    expect(tagToType(tag)).toBe(expectedType);
  });

  it('throws for unknown tag', () => {
    expect(() => tagToType('UNKNOWN')).toThrow('Unknown examark tag');
  });

  it('throws for lowercase tag', () => {
    expect(() => tagToType('mc')).toThrow('Unknown examark tag');
  });
});
