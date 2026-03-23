/**
 * Tests for LaTeX Export Functionality
 *
 * Converts JSON exam format to LaTeX for printing.
 * Covers: student version, answer key, rubric generation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LatexExporter } from '../../src/teaching/formatters/latex-export.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

describe('LatexExporter', () => {
  let sampleExam;

  beforeEach(() => {
    // Load a sample exam for testing
    sampleExam = {
      schema_version: '1.0',
      template_type: 'exam',
      metadata: {
        title: 'Test Exam',
        date: '2025-01-12'
      },
      title: 'Test Exam - Introduction to Statistics',
      exam_type: 'midterm',
      duration_minutes: 60,
      instructions: 'Answer all questions. Show your work.',
      questions: [
        {
          id: 'Q1',
          type: 'multiple-choice',
          text: 'What is the mean of the dataset: 2, 4, 6?',
          options: ['3', '4', '5', '6'],
          points: 5,
          difficulty: 'easy',
          topic: 'descriptive statistics'
        },
        {
          id: 'Q2',
          type: 'short-answer',
          text: 'Explain the Central Limit Theorem.',
          points: 10,
          difficulty: 'medium',
          topic: 'probability'
        },
        {
          id: 'Q3',
          type: 'true-false',
          text: 'The median is always equal to the mean.',
          options: ['True', 'False'],
          points: 3,
          difficulty: 'easy',
          topic: 'descriptive statistics'
        },
        {
          id: 'Q4',
          type: 'numerical',
          text: 'Calculate the variance of: 1, 2, 3, 4, 5',
          points: 8,
          difficulty: 'medium',
          topic: 'descriptive statistics'
        },
        {
          id: 'Q5',
          type: 'essay',
          text: 'Discuss the assumptions of linear regression and explain why they matter.',
          points: 20,
          difficulty: 'hard',
          topic: 'regression',
          rubric: 'Assumptions listed (8 pts), Explanation (12 pts)'
        }
      ],
      answer_key: {
        Q1: 'B',
        Q2: 'The CLT states that the sampling distribution of the sample mean approaches a normal distribution as sample size increases, regardless of the population distribution.',
        Q3: 'B',
        Q4: {
          answer: '2',
          solution: 'Variance = sum((x - mean)^2) / n = 2'
        },
        Q5: {
          answer: 'Linear regression assumes: linearity, independence, homoscedasticity, normality of residuals. These matter because violations can lead to biased estimates, incorrect inference, and poor predictions.',
          rubric_points: {
            'Assumptions (8 pts)': 'Listed all four assumptions correctly',
            'Explanation (12 pts)': 'Explained consequences of violations with examples'
          }
        }
      },
      formula_sheet: 'Mean: $\\bar{x} = \\frac{1}{n}\\sum x_i$\n\nVariance: $s^2 = \\frac{1}{n-1}\\sum(x_i - \\bar{x})^2$'
    };
  });

  describe('Constructor and Configuration', () => {
    it('should create exporter with default options', () => {
      const exporter = new LatexExporter(sampleExam);

      expect(exporter.exam).toBeDefined();
      expect(exporter.options.includeAnswerKey).toBe(true);
      expect(exporter.options.formatStyle).toBe('exam-class');
    });

    it('should accept custom options', () => {
      const exporter = new LatexExporter(sampleExam, {
        formatStyle: 'article',
        fontSize: '12pt',
        includeAnswerKey: false
      });

      expect(exporter.options.formatStyle).toBe('article');
      expect(exporter.options.fontSize).toBe('12pt');
      expect(exporter.options.includeAnswerKey).toBe(false);
    });
  });

  describe('Student Version Export', () => {
    it('should export student version without answers', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('\\documentclass');
      expect(latex).toContain('\\begin{document}');
      expect(latex).toContain('\\end{document}');
      expect(latex).toContain(sampleExam.title);
      expect(latex).not.toContain('ANSWER:'); // No answers shown
    });

    it('should include all questions in student version', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('What is the mean of the dataset');
      expect(latex).toContain('Explain the Central Limit Theorem');
      expect(latex).toContain('The median is always equal to the mean');
      expect(latex).toContain('Calculate the variance');
      expect(latex).toContain('Discuss the assumptions of linear regression');
    });

    it('should include formula sheet in student version', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('Formula Sheet');
      expect(latex).toContain('$\\bar{x}');
      expect(latex).toContain('Variance');
    });

    it('should include answer space for written questions', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('\\vspace'); // Space for answers
      expect(latex).toMatch(/\\vspace\{.*\}/); // Proper LaTeX spacing command
    });

    it('should format multiple choice with choices environment', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('\\begin{choices}');
      expect(latex).toContain('\\choice');
      expect(latex).toContain('\\end{choices}');
    });

    it('should include point values for each question', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('[5]'); // Q1 points
      expect(latex).toContain('[10]'); // Q2 points
      expect(latex).toContain('[3]'); // Q3 points
    });

    it('should include exam metadata and instructions', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain(sampleExam.title);
      expect(latex).toContain(sampleExam.instructions);
      expect(latex).toContain('60 minutes'); // Duration
    });
  });

  describe('Answer Key Export', () => {
    it('should export answer key with correct answers', () => {
      const exporter = new LatexExporter(sampleExam);
      const answerKey = exporter.exportAnswerKey();

      expect(answerKey).toContain('\\documentclass');
      expect(answerKey).toContain('Answer Key');
      expect(answerKey).toContain('B'); // Q1 answer
    });

    it('should show detailed solutions for all questions', () => {
      const exporter = new LatexExporter(sampleExam);
      const answerKey = exporter.exportAnswerKey();

      expect(answerKey).toContain('Central Limit Theorem'); // Q2 solution
      expect(answerKey).toContain('Variance = sum'); // Q4 solution
      expect(answerKey).toContain('linearity, independence'); // Q5 solution
    });

    it('should highlight correct multiple choice answers', () => {
      const exporter = new LatexExporter(sampleExam);
      const answerKey = exporter.exportAnswerKey();

      expect(answerKey).toMatch(/\\correctchoice|\\textbf|\\underline/); // Highlighted answer
    });

    it('should include rubric details for essay questions', () => {
      const exporter = new LatexExporter(sampleExam);
      const answerKey = exporter.exportAnswerKey();

      expect(answerKey).toContain('Assumptions (8 pts)');
      expect(answerKey).toContain('Explanation (12 pts)');
    });
  });

  describe('Rubric Export', () => {
    it('should export grading rubric', () => {
      const exporter = new LatexExporter(sampleExam);
      const rubric = exporter.exportRubric();

      expect(rubric).toContain('\\documentclass');
      expect(rubric).toContain('Grading Rubric');
      expect(rubric).toContain('\\end{document}');
    });

    it('should include point breakdown for all questions', () => {
      const exporter = new LatexExporter(sampleExam);
      const rubric = exporter.exportRubric();

      expect(rubric).toContain('Q1'); // All questions listed
      expect(rubric).toContain('5 \\\\'); // Point values in table
      expect(rubric).toContain('10 \\\\');
      expect(rubric).toContain('20 \\\\');
    });

    it('should include detailed rubrics for essay questions', () => {
      const exporter = new LatexExporter(sampleExam);
      const rubric = exporter.exportRubric();

      expect(rubric).toContain('Assumptions listed (8 pts)');
      expect(rubric).toContain('Explanation (12 pts)');
    });

    it('should show total points', () => {
      const exporter = new LatexExporter(sampleExam);
      const rubric = exporter.exportRubric();

      const totalPoints = sampleExam.questions.reduce((sum, q) => sum + q.points, 0);
      expect(rubric).toContain(totalPoints.toString());
    });
  });

  describe('LaTeX Math Notation', () => {
    it('should preserve LaTeX math notation in questions', () => {
      const examWithMath = {
        ...sampleExam,
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'If $Y = \\beta_0 + \\beta_1 X + \\epsilon$, what is $\\beta_1$?',
            options: ['Slope', 'Intercept', 'Error', 'Residual'],
            points: 5,
            difficulty: 'easy'
          }
        ]
      };

      const exporter = new LatexExporter(examWithMath);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('$Y = \\beta_0 + \\beta_1 X + \\epsilon$');
      expect(latex).toContain('$\\beta_1$');
    });

    it('should handle multi-line equations', () => {
      const examWithEquations = {
        ...sampleExam,
        formula_sheet: '$$\\begin{aligned}\n\\bar{x} &= \\frac{1}{n}\\sum x_i \\\\\ns^2 &= \\frac{1}{n-1}\\sum(x_i - \\bar{x})^2\n\\end{aligned}$$'
      };

      const exporter = new LatexExporter(examWithEquations);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('\\begin{aligned}');
      expect(latex).toContain('\\end{aligned}');
    });
  });

  describe('Export Options', () => {
    it('should respect formatStyle option', () => {
      const exporterExam = new LatexExporter(sampleExam, { formatStyle: 'exam-class' });
      const exporterArticle = new LatexExporter(sampleExam, { formatStyle: 'article' });

      const latexExam = exporterExam.exportStudentVersion();
      const latexArticle = exporterArticle.exportStudentVersion();

      expect(latexExam).toContain('\\documentclass[11pt,letterpaper]{exam}');
      expect(latexArticle).toContain('\\documentclass[11pt,letterpaper]{article}');
    });

    it('should respect fontSize option', () => {
      const exporter = new LatexExporter(sampleExam, { fontSize: '12pt' });
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('12pt');
    });

    it('should respect pageSize option', () => {
      const exporterLetter = new LatexExporter(sampleExam, { pageSize: 'letter' });
      const exporterA4 = new LatexExporter(sampleExam, { pageSize: 'a4paper' });

      const latexLetter = exporterLetter.exportStudentVersion();
      const latexA4 = exporterA4.exportStudentVersion();

      expect(latexLetter).toContain('letterpaper');
      expect(latexA4).toContain('a4paper');
    });
  });

  describe('Question Type Handling', () => {
    it('should format multiple-choice questions correctly', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('\\begin{choices}');
      expect(latex).toContain('\\choice 3');
      expect(latex).toContain('\\choice 4');
    });

    it('should format short-answer with appropriate space', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      // Should have vspace for short answer Q2
      const shortAnswerMatch = latex.match(/Explain the Central Limit Theorem[\s\S]*?\\vspace\{[^}]+\}/);
      expect(shortAnswerMatch).toBeTruthy();
    });

    it('should format essay with lined space and parts', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      // Essay Q5 should have more space
      expect(latex).toContain('Discuss the assumptions');
      // Should have generous vspace for essay
      const essaySection = latex.match(/assumptions of linear regression[\s\S]*?\\vspace\{[^}]+\}/);
      expect(essaySection).toBeTruthy();
    });

    it('should format true-false questions', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('The median is always equal to the mean');
      expect(latex).toContain('True');
      expect(latex).toContain('False');
    });

    it('should format numerical questions with space for work', () => {
      const exporter = new LatexExporter(sampleExam);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('Calculate the variance');
      // Should have space for numerical work
      const numericalMatch = latex.match(/Calculate the variance[\s\S]*?\\vspace\{[^}]+\}/);
      expect(numericalMatch).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle exam with no formula sheet', () => {
      const examNoFormula = { ...sampleExam };
      delete examNoFormula.formula_sheet;

      const exporter = new LatexExporter(examNoFormula);
      const latex = exporter.exportStudentVersion();

      expect(latex).not.toContain('Formula Sheet');
      expect(latex).toContain('\\end{document}');
    });

    it('should handle questions with no rubric', () => {
      const examNoRubric = {
        ...sampleExam,
        questions: sampleExam.questions.filter(q => q.type !== 'essay')
      };

      const exporter = new LatexExporter(examNoRubric);
      const rubric = exporter.exportRubric();

      expect(rubric).toContain('Grading Rubric');
      expect(rubric).toContain('\\end{document}');
    });

    it('should handle special characters in question text', () => {
      const examWithSpecial = {
        ...sampleExam,
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'What is 50% of 100? Use $ notation.',
            options: ['$50', '$25', '$75', '$100'],
            points: 5,
            difficulty: 'easy'
          }
        ]
      };

      const exporter = new LatexExporter(examWithSpecial);
      const latex = exporter.exportStudentVersion();

      // Should escape or handle $ and % properly
      expect(latex).toBeDefined();
      expect(latex).toContain('\\end{document}');
    });

    it('should handle very long question text', () => {
      const longText = 'This is a very long question that goes on and on. '.repeat(10);
      const examLongQuestion = {
        ...sampleExam,
        questions: [
          {
            id: 'Q1',
            type: 'essay',
            text: longText,
            points: 20,
            difficulty: 'hard'
          }
        ]
      };

      const exporter = new LatexExporter(examLongQuestion);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain(longText.substring(0, 50)); // Contains start of long text
      expect(latex).toContain('\\end{document}');
    });
  });
});
