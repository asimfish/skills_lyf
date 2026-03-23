/**
 * Tests for ExamarkFormatter
 *
 * Tests examark-specific format (numbered lists, type tags, etc.)
 */

import { ExamarkFormatter } from '../../src/teaching/formatters/index.js';

// Sample exam content for testing
const sampleExam = {
  title: 'Statistics Midterm Exam',
  exam_type: 'midterm',
  duration_minutes: 60,
  total_points: 50,
  instructions: 'Answer all questions. Show your work.',
  questions: [
    {
      id: 'Q1',
      type: 'multiple-choice',
      text: 'What is $2 + 2$?',
      options: ['3', '4', '5', '6'],
      points: 10
    },
    {
      id: 'Q2',
      type: 'true-false',
      text: 'Is $\\pi$ approximately 3.14?',
      points: 5
    },
    {
      id: 'Q3',
      type: 'short-answer',
      text: 'Explain the concept of variance.',
      points: 15
    },
    {
      id: 'Q4',
      type: 'essay',
      text: 'Discuss regression assumptions.',
      points: 20
    }
  ],
  answer_key: {
    'Q1': 'B',
    'Q2': 'True',
    'Q3': 'Variance measures the spread of data.',
    'Q4': 'Linear regression assumes linearity, independence, homoscedasticity, and normality.'
  }
};

// Extended exam content with new question types
const extendedExam = {
  title: 'Extended Type Exam',
  total_points: 100,
  instructions: 'Test all question types.',
  questions: [
    {
      id: 'Q1', type: 'multiple-answer',
      text: 'Select all prime numbers.',
      options: ['2', '3', '4', '5'],
      points: 10
    },
    {
      id: 'Q2', type: 'matching',
      text: 'Match the terms with definitions.',
      pairs: [
        { left: 'Mean', right: 'Average value' },
        { left: 'Median', right: 'Middle value' },
        { left: 'Mode', right: 'Most frequent value' }
      ],
      points: 15
    },
    {
      id: 'Q3', type: 'fill-in-multiple-blanks',
      text: 'The [blank1] of a dataset measures spread, while the [blank2] measures center.',
      points: 10
    },
    {
      id: 'Q4', type: 'fill-in-blank',
      text: 'The standard deviation is the square root of the [blank].',
      points: 5
    },
    {
      id: 'Q5', type: 'file-upload',
      text: 'Upload your R script for the analysis.',
      points: 20
    }
  ],
  answer_key: {
    'Q1': ['A', 'B', 'D'],
    'Q2': [
      { left: 'Mean', right: 'Average value' },
      { left: 'Median', right: 'Middle value' },
      { left: 'Mode', right: 'Most frequent value' }
    ],
    'Q3': { blank1: 'variance', blank2: 'mean' },
    'Q4': 'variance',
    'Q5': null
  }
};

describe('ExamarkFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new ExamarkFormatter();
  });

  describe('format()', () => {
    it('should format exam with numbered lists', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('1. [MC]');
      expect(output).toContain('2. [TF]');
      expect(output).toContain('3. [Short]');
      expect(output).toContain('4. [Essay');
    });

    it('should include question type tags', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('[MC]');
      expect(output).toContain('[TF]');
      expect(output).toContain('[Short]');
      expect(output).toContain('[Essay');
    });

    it('should include points inline', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('[10pts]');
      expect(output).toContain('[5pts]');
      expect(output).toContain('[15pts]');
      expect(output).toContain('[Essay, 20pts]');  // Essay format includes type tag
    });

    it('should use lettered options for multiple-choice', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('a) 3');
      expect(output).toContain('b) 4 [x]');  // Correct answer
      expect(output).toContain('c) 5');
      expect(output).toContain('d) 6');
    });

    it('should mark correct answers with [x]', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('[x]');
      const matches = output.match(/\[x\]/g);
      expect(matches.length).toBe(2); // Q1 and Q2 have correct answers marked
    });

    it('should preserve LaTeX math notation', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('$2 + 2$');
      expect(output).toContain('$\\pi$');
    });

    it('should include title as H1', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('# Statistics Midterm Exam');
    });

    it('should include instructions', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('Answer all questions. Show your work.');
    });

    it('should format essay questions with inline points', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('4. [Essay, 20pts]');
    });

    it('should not include frontmatter by default', () => {
      const output = formatter.format(sampleExam);

      expect(output).not.toMatch(/^---/);
    });

    it('should include frontmatter when requested', () => {
      const output = formatter.format(sampleExam, { includeFrontmatter: true });

      expect(output).toContain('---');
      expect(output).toContain('title: Statistics Midterm Exam');
      expect(output).toContain('points: 50');
    });

    it('should exclude answers when requested', () => {
      const output = formatter.format(sampleExam, { includeAnswers: false });

      expect(output).not.toContain('[x]');
      expect(output).toContain('a) 3');
      expect(output).toContain('b) 4');  // No [x] marker
    });

    it('should handle true-false questions', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('2. [TF]');
      expect(output).toContain('a) True [x]');
      expect(output).toContain('b) False');
    });
  });

  describe('getQuestionTypeTag()', () => {
    it('should map question types correctly', () => {
      expect(formatter.getQuestionTypeTag('multiple-choice')).toBe('MC');
      expect(formatter.getQuestionTypeTag('true-false')).toBe('TF');
      expect(formatter.getQuestionTypeTag('short-answer')).toBe('Short');
      expect(formatter.getQuestionTypeTag('essay')).toBe('Essay');
      expect(formatter.getQuestionTypeTag('numerical')).toBe('Numeric');
      expect(formatter.getQuestionTypeTag('multiple-answer')).toBe('MA');
      expect(formatter.getQuestionTypeTag('matching')).toBe('Match');
      expect(formatter.getQuestionTypeTag('fill-in-multiple-blanks')).toBe('FMB');
      expect(formatter.getQuestionTypeTag('fill-in-blank')).toBe('FIB');
      expect(formatter.getQuestionTypeTag('file-upload')).toBe('Essay'); // Upload mapped to Essay
    });

    it('should default to MC for unknown types', () => {
      expect(formatter.getQuestionTypeTag('unknown')).toBe('MC');
    });
  });

  describe('validate()', () => {
    it('should validate correct examark output', () => {
      const output = formatter.format(sampleExam);
      const result = formatter.validate(output);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing numbered lists', () => {
      const output = '# Test\n\nSome text but no questions';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No numbered questions found (expected format: "1. [MC] ...")');
    });

    it('should detect missing question type tags', () => {
      const output = '1. Question without type tag';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No question type tags found (expected: [MC], [TF], etc.)');
    });

    it('should detect missing points notation', () => {
      const output = '1. [MC] Question without points';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No points notation found (expected: [10pts])');
    });
  });

  describe('multiple-answer questions', () => {
    it('should format with [MA] type tag', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('1. [MA]');
    });

    it('should include points notation', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('[MA] Select all prime numbers. [10pts]');
    });

    it('should mark multiple correct answers with [x]', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('a) 2 [x]');
      expect(output).toContain('b) 3 [x]');
      expect(output).not.toContain('c) 4 [x]');
      expect(output).toContain('d) 5 [x]');
    });

    it('should not mark answers when includeAnswers is false', () => {
      const output = formatter.format(extendedExam, { includeAnswers: false });
      expect(output).toContain('a) 2');
      expect(output).toContain('b) 3');
      expect(output).toContain('c) 4');
      expect(output).toContain('d) 5');
      // Ensure no [x] markers on MA options
      const lines = output.split('\n');
      const maLines = lines.filter(l => l.match(/^[a-d]\) [2345]/));
      maLines.forEach(line => {
        expect(line).not.toContain('[x]');
      });
    });
  });

  describe('matching questions', () => {
    it('should format with [Match] type tag', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('2. [Match]');
    });

    it('should include points notation', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('[15pts]');
    });

    it('should show pairs with answers when includeAnswers is true', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('Mean = Average value');
      expect(output).toContain('Median = Middle value');
      expect(output).toContain('Mode = Most frequent value');
    });

    it('should show left items and right items separately when includeAnswers is false', () => {
      const output = formatter.format(extendedExam, { includeAnswers: false });
      expect(output).toContain('a) Mean');
      expect(output).toContain('b) Median');
      expect(output).toContain('c) Mode');
      expect(output).toContain('1. Average value');
      expect(output).toContain('2. Middle value');
      expect(output).toContain('3. Most frequent value');
      expect(output).not.toContain('Mean = Average value');
    });
  });

  describe('fill-in-multiple-blanks questions', () => {
    it('should format with [FMB] type tag', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('3. [FMB]');
    });

    it('should include points notation', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('[10pts]');
    });

    it('should show blank markers in question text', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('[blank1]');
      expect(output).toContain('[blank2]');
    });

    it('should show answers section when includeAnswers is true', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('Answers:');
      expect(output).toContain('blank1: variance');
      expect(output).toContain('blank2: mean');
    });

    it('should not show answers when includeAnswers is false', () => {
      const output = formatter.format(extendedExam, { includeAnswers: false });
      expect(output).not.toContain('Answers:');
      expect(output).not.toContain('blank1: variance');
    });
  });

  describe('fill-in-blank questions', () => {
    it('should format with [FIB] type tag', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('4. [FIB]');
    });

    it('should include points notation', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('[5pts]');
    });

    it('should show answer when includeAnswers is true', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('Answer: variance');
    });

    it('should not show answer when includeAnswers is false', () => {
      const output = formatter.format(extendedExam, { includeAnswers: false });
      // Check that no "Answer: variance" line appears for FIB question
      const lines = output.split('\n');
      const fibIdx = lines.findIndex(l => l.includes('[FIB]'));
      // Next non-empty lines after FIB should not contain Answer:
      const afterFib = lines.slice(fibIdx + 1, fibIdx + 5);
      afterFib.forEach(line => {
        expect(line).not.toContain('Answer: variance');
      });
    });
  });

  describe('file-upload questions', () => {
    it('should map Upload to Essay type tag with inline points', () => {
      const output = formatter.format(extendedExam);
      // Upload is mapped to Essay because examark drops [Upload] silently
      expect(output).toContain('5. [Essay, 20pts]');
      expect(output).not.toContain('[Upload');
    });

    it('should include upload note in output', () => {
      const output = formatter.format(extendedExam);
      expect(output).toContain('originally required a file upload');
    });

    it('should emit warning when Upload is mapped to Essay', () => {
      formatter.format(extendedExam);
      const uploadWarnings = formatter.warnings.filter(w => w.type === 'upload-to-essay');
      expect(uploadWarnings.length).toBeGreaterThanOrEqual(1);
      expect(uploadWarnings[0].message).toContain('Upload question mapped to Essay');
    });

    it('should have no answer section', () => {
      const output = formatter.format(extendedExam);
      const lines = output.split('\n');
      const uploadIdx = lines.findIndex(l => l.includes('Upload your R script'));
      // Lines after upload question should not have Answer:
      const afterUpload = lines.slice(uploadIdx + 1, uploadIdx + 4);
      afterUpload.forEach(line => {
        expect(line).not.toMatch(/^Answer:/);
      });
    });
  });

  describe('validate() with extended types', () => {
    it('should validate output with new question type tags', () => {
      const output = formatter.format(extendedExam);
      const result = formatter.validate(output);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('section headers (E4)', () => {
    const sectionedExam = {
      title: 'Sectioned Exam',
      total_points: 30,
      instructions: '',
      questions: [
        { id: 'Q1', type: 'multiple-choice', text: 'MC question', options: ['A', 'B'], points: 10, sectionName: 'Part 1: Basics' },
        { id: 'Q2', type: 'true-false', text: 'TF question', points: 10, sectionName: 'Part 1: Basics' },
        { id: 'Q3', type: 'essay', text: 'Essay question', points: 10, sectionName: 'Part 2: Analysis' },
      ],
      answer_key: { Q1: 'A', Q2: 'True', Q3: null }
    };

    it('should emit H1 section headers when sectionName changes', () => {
      const output = formatter.format(sectionedExam);
      expect(output).toContain('# Part 1: Basics');
      expect(output).toContain('# Part 2: Analysis');
    });

    it('should not repeat section header for consecutive questions in same section', () => {
      const output = formatter.format(sectionedExam);
      const sectionMatches = output.match(/^# Part 1: Basics$/gm);
      expect(sectionMatches).toHaveLength(1);
    });

    it('should not emit section headers when questions have no sectionName', () => {
      const output = formatter.format(sampleExam);
      // sampleExam has no sectionName — only the title H1 should exist
      const h1Lines = output.split('\n').filter(l => l.match(/^# /));
      expect(h1Lines).toHaveLength(1);
      expect(h1Lines[0]).toBe('# Statistics Midterm Exam');
    });
  });

  describe('getFileExtension()', () => {
    it('should return .md', () => {
      expect(formatter.getFileExtension()).toBe('.md');
    });
  });
});
