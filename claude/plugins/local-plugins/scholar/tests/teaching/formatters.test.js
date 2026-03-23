/**
 * Tests for Exam Formatters
 *
 * Tests all formatters: Markdown, Canvas, Quarto, LaTeX
 */

import { MarkdownFormatter, CanvasFormatter, QuartoFormatter, LaTeXFormatter } from '../../src/teaching/formatters/index.js';

// Sample exam content for testing
const sampleExam = {
  title: 'Statistics Midterm Exam',
  exam_type: 'midterm',
  duration_minutes: 60,
  total_points: 100,
  instructions: 'Answer all questions. Show your work.',
  metadata: {
    course: 'STAT-440',
    date: '2026-01-12'
  },
  questions: [
    {
      id: 'Q1',
      type: 'multiple-choice',
      text: 'What is $2 + 2$?',
      options: ['3', '4', '5', '6'],
      points: 10,
      difficulty: 'easy',
      topic: 'arithmetic'
    },
    {
      id: 'Q2',
      type: 'short-answer',
      text: 'Explain the concept of variance.',
      points: 15,
      difficulty: 'medium',
      topic: 'statistics'
    },
    {
      id: 'Q3',
      type: 'essay',
      text: 'Discuss the assumptions of linear regression.',
      points: 30,
      difficulty: 'hard',
      topic: 'regression',
      rubric: 'Part 1: List assumptions (10 pts). Part 2: Explain violations (10 pts). Part 3: Provide examples (10 pts).'
    }
  ],
  answer_key: {
    'Q1': 'B',
    'Q2': 'Variance measures the spread of data points around the mean.',
    'Q3': {
      answer: 'Linear regression assumes linearity, independence, homoscedasticity, and normality.',
      rubric_points: {
        'Part 1 (10 pts)': 'List all 4 assumptions',
        'Part 2 (10 pts)': 'Explain what happens when violated',
        'Part 3 (10 pts)': 'Provide concrete examples'
      }
    }
  },
  formula_sheet: '**Formulas:**\n- Mean: $\\bar{x} = \\frac{1}{n}\\sum x_i$\n- Variance: $s^2 = \\frac{1}{n-1}\\sum (x_i - \\bar{x})^2$'
};

describe('MarkdownFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  describe('format()', () => {
    it('should format exam to markdown', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('---');
      expect(output).toContain('title: Statistics Midterm Exam');
      expect(output).toContain('points: 100');
      expect(output).toContain('## Question 1');
      expect(output).toContain('## Question 2');
      expect(output).toContain('## Question 3');
      expect(output).toContain('Points: 10');
      expect(output).toContain('Points: 15');
      expect(output).toContain('Points: 30');
    });

    it('should include LaTeX math notation', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('$2 + 2$');
      expect(output).toContain('$\\bar{x}');
    });

    it('should format multiple-choice with correct answer marked', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('- 3');
      expect(output).toContain('* 4');  // Correct answer
      expect(output).toContain('- 5');
      expect(output).toContain('- 6');
    });

    it('should include answer key for short-answer', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('**Answer:**');
      expect(output).toContain('Variance measures the spread');
    });

    it('should include rubric for essay questions', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('**Rubric:**');
      expect(output).toContain('Part 1: List assumptions');
    });

    it('should include formula sheet', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('## Formula Sheet');
      expect(output).toContain('Mean: $\\bar{x}');
      expect(output).toContain('Variance: $s^2');
    });

    it('should skip frontmatter when requested', () => {
      const output = formatter.format(sampleExam, { skipFrontmatter: true });

      expect(output).not.toMatch(/^---/);
      expect(output).toContain('## Question 1');
    });

    it('should exclude answers when requested', () => {
      const output = formatter.format(sampleExam, { includeAnswers: false });

      expect(output).not.toContain('**Answer:**');
      expect(output).not.toContain('Variance measures');
      // Multiple-choice should show all options with '-' marker
      expect(output).not.toContain('* 4');
      expect(output).toContain('- 4');
    });
  });

  describe('validate()', () => {
    it('should validate correct markdown output', () => {
      const output = formatter.format(sampleExam);
      const result = formatter.validate(output);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing questions', () => {
      const output = '---\ntitle: Test\n---\n\nNo questions here';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No questions found in output');
    });

    it('should detect unclosed frontmatter', () => {
      const output = '---\ntitle: Test\n\n## Question 1';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unclosed YAML frontmatter');
    });
  });

  describe('getFileExtension()', () => {
    it('should return .md', () => {
      expect(formatter.getFileExtension()).toBe('.md');
    });
  });
});

describe('QuartoFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new QuartoFormatter();
  });

  describe('format()', () => {
    it('should add Quarto YAML frontmatter', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('---');
      expect(output).toContain('title: "Statistics Midterm Exam"');
      expect(output).toContain('format:');
      expect(output).toContain('pdf:');
      expect(output).toContain('documentclass: exam');
      expect(output).toContain('\\usepackage{amsmath}');
      expect(output).toContain('\\usepackage{amssymb}');
    });

    it('should include subtitle from metadata', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('subtitle: "STAT-440"');
    });

    it('should include exam header table', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('| **Duration** | 60 minutes |');
      expect(output).toContain('| **Total Points** | 100 |');
    });

    it('should include instructions in callout box', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain(':::{.callout-note}');
      expect(output).toContain('## Instructions');
      expect(output).toContain('Answer all questions');
      expect(output).toContain(':::');
    });
  });

  describe('validate()', () => {
    it('should validate correct Quarto output', () => {
      const output = formatter.format(sampleExam);
      const result = formatter.validate(output);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing format field', () => {
      const output = '---\ntitle: Test\n---\n\n## Question 1\n\nPoints: 10';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing format in frontmatter');
    });
  });

  describe('getFileExtension()', () => {
    it('should return .qmd', () => {
      expect(formatter.getFileExtension()).toBe('.qmd');
    });
  });
});

describe('LaTeXFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new LaTeXFormatter();
  });

  describe('format()', () => {
    it('should create LaTeX document structure', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('\\documentclass[12pt]{exam}');
      expect(output).toContain('\\begin{document}');
      expect(output).toContain('\\end{document}');
      expect(output).toContain('\\begin{questions}');
      expect(output).toContain('\\end{questions}');
    });

    it('should include required packages', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('\\usepackage{amsmath}');
      expect(output).toContain('\\usepackage{amssymb}');
      expect(output).toContain('\\usepackage{enumitem}');
    });

    it('should escape LaTeX special characters', () => {
      const exam = {
        ...sampleExam,
        instructions: 'Use & symbol, # for numbers, $5 for currency'
      };

      const output = formatter.format(exam);

      expect(output).toContain('\\&');
      expect(output).toContain('\\#');
      expect(output).toContain('\\$5');
    });

    it('should preserve LaTeX math delimiters', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('$2 + 2$');
      expect(output).toContain('$\\bar{x}');
    });

    it('should format multiple-choice as choices environment', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('\\begin{choices}');
      expect(output).toContain('\\end{choices}');
      expect(output).toContain('\\choice 3');
      expect(output).toContain('\\CorrectChoice 4');
    });

    it('should format questions with point values', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('\\question[10]');
      expect(output).toContain('\\question[15]');
      expect(output).toContain('\\question[30]');
    });

    it('should include formula sheet as appendix', () => {
      const output = formatter.format(sampleExam);

      expect(output).toContain('\\newpage');
      expect(output).toContain('\\section*{Formula Sheet}');
    });

    it('should not include answers when requested', () => {
      const output = formatter.format(sampleExam, { answers: false });

      expect(output).not.toContain('\\CorrectChoice');
      expect(output).toContain('\\choice 4');
    });
  });

  describe('validate()', () => {
    it('should validate correct LaTeX output', () => {
      const output = formatter.format(sampleExam);
      const result = formatter.validate(output);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing document structure', () => {
      const output = 'Just some text';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing \\documentclass');
      expect(result.errors).toContain('Missing \\begin{document}');
    });

    it('should detect missing questions', () => {
      const output = '\\documentclass{exam}\n\\begin{document}\n\\end{document}';
      const result = formatter.validate(output);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing \\begin{questions}');
      expect(result.errors).toContain('No questions found');
    });
  });

  describe('getFileExtension()', () => {
    it('should return .tex', () => {
      expect(formatter.getFileExtension()).toBe('.tex');
    });
  });
});

describe('CanvasFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new CanvasFormatter();
  });

  describe('format()', () => {
    // Note: Full integration test requires examark to be installed
    // and would create actual QTI files. These tests are in integration suite.

    it('should extend MarkdownFormatter', () => {
      expect(formatter).toBeInstanceOf(CanvasFormatter);
      expect(typeof formatter.format).toBe('function');
    });
  });

  describe('getFileExtension()', () => {
    it('should return .qti.zip', () => {
      expect(formatter.getFileExtension()).toBe('.qti.zip');
    });
  });
});

describe('BaseFormatter', () => {
  it('should validate exam content structure', () => {
    const formatter = new MarkdownFormatter();

    const invalidExam = {
      // Missing title
      questions: []  // Empty questions
    };

    const result = formatter.validateContent(invalidExam);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing exam title');
    expect(result.errors).toContain('No questions in exam');
  });

  it('should escape markdown special characters', () => {
    const formatter = new MarkdownFormatter();

    const escaped = formatter.escapeMarkdown('Test with * and _ and [brackets]');

    expect(escaped).toContain('\\*');
    expect(escaped).toContain('\\_');
    expect(escaped).toContain('\\[');
  });
});
