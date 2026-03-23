/**
 * End-to-End Tests
 *
 * Tests complete user workflows from start to finish:
 * 1. Generate exam conversationally
 * 2. Validate with Phase 0 components
 * 3. Export to multiple formats
 * 4. Verify all outputs are usable
 *
 * These tests simulate real-world usage scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateExam } from '../../src/teaching/generators/exam-conversational.js';
import { LatexExporter } from '../../src/teaching/formatters/latex-export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('End-to-End User Workflows', () => {
  const testOutputDir = join(__dirname, '../../test-output-e2e');

  beforeEach(() => {
    // Ensure test output directory exists
    if (!existsSync(testOutputDir)) {
      mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    const files = [
      join(testOutputDir, 'e2e-exam.json'),
      join(testOutputDir, 'e2e-student.tex'),
      join(testOutputDir, 'e2e-answer-key.tex'),
      join(testOutputDir, 'e2e-rubric.tex')
    ];

    files.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
  });

  describe('Complete Exam Creation Workflow', () => {
    it('should generate, validate, and export exam in all formats', () => {
      // Step 1: User creates exam content (simulating conversational generation)
      const examContent = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'E2E Test Exam',
          date: new Date().toISOString().split('T')[0]
        },
        title: 'Introduction to Statistics - Midterm',
        exam_type: 'midterm',
        duration_minutes: 90,
        instructions: 'Answer all questions. Show your work. You may use a calculator.',
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'What is the mean of the dataset: 2, 4, 6, 8?',
            options: ['4', '5', '6', '7'],
            points: 5,
            difficulty: 'easy',
            topic: 'descriptive statistics'
          },
          {
            id: 'Q2',
            type: 'short-answer',
            text: 'Explain the Central Limit Theorem in your own words.',
            points: 10,
            difficulty: 'medium',
            topic: 'probability theory'
          },
          {
            id: 'Q3',
            type: 'numerical',
            text: 'Calculate the variance of the dataset: 1, 2, 3, 4, 5',
            points: 8,
            difficulty: 'medium',
            topic: 'descriptive statistics'
          },
          {
            id: 'Q4',
            type: 'true-false',
            text: 'The standard deviation is always larger than the variance.',
            options: ['True', 'False'],
            points: 3,
            difficulty: 'easy',
            topic: 'descriptive statistics'
          },
          {
            id: 'Q5',
            type: 'essay',
            text: 'A researcher claims that a new teaching method improves test scores. Design a hypothesis test to evaluate this claim. Include (a) null and alternative hypotheses, (b) Type I and II errors, and (c) which error is more serious.',
            points: 20,
            difficulty: 'hard',
            topic: 'hypothesis testing',
            rubric: 'Hypotheses (8 pts), Type I error (4 pts), Type II error (4 pts), Analysis (4 pts)'
          }
        ],
        answer_key: {
          Q1: 'B',
          Q2: 'The CLT states that the sampling distribution of the sample mean approaches a normal distribution as sample size increases, regardless of the population distribution (for independent observations with finite variance).',
          Q3: {
            answer: '2',
            solution: 'Mean = 3, Variance = sum((x - 3)^2) / 5 = (4 + 1 + 0 + 1 + 4) / 5 = 2'
          },
          Q4: 'B',
          Q5: {
            answer: 'H₀: μ_new = μ_old (no improvement), H₁: μ_new > μ_old (improvement). Type I: concluding method works when it doesn\'t (waste resources). Type II: concluding method doesn\'t work when it does (miss improvement). Type I more serious as it leads to adopting ineffective method.',
            rubric_points: {
              'Hypotheses (8 pts)': 'Correctly stated H₀ and H₁ with proper notation',
              'Type I Error (4 pts)': 'Correctly identified as false positive',
              'Type II Error (4 pts)': 'Correctly identified as false negative',
              'Analysis (4 pts)': 'Justified which error is more serious with reasoning'
            }
          }
        },
        formula_sheet: 'Mean: $\\bar{x} = \\frac{1}{n}\\sum x_i$\n\nVariance: $s^2 = \\frac{1}{n-1}\\sum(x_i - \\bar{x})^2$\n\nStandard Deviation: $s = \\sqrt{s^2}$'
      };

      // Step 2: Validate exam with Phase 0 components
      const validated = validateExam(examContent, { strict: false });

      expect(validated.validation.isValid).toBe(true);
      expect(validated.validation.errors).toHaveLength(0);
      expect(validated.content.questions).toHaveLength(5);
      expect(validated.metadata.totalPoints).toBe(46);

      // Step 3: Save to JSON
      const jsonPath = join(testOutputDir, 'e2e-exam.json');
      writeFileSync(jsonPath, JSON.stringify(validated.content, null, 2));

      expect(existsSync(jsonPath)).toBe(true);

      // Step 4: Export to LaTeX (student version)
      const exporter = new LatexExporter(validated.content);
      const studentLatex = exporter.exportStudentVersion();

      expect(studentLatex).toContain('\\documentclass');
      expect(studentLatex).toContain('Introduction to Statistics');
      expect(studentLatex).toContain('\\begin{questions}');
      expect(studentLatex).not.toContain('\\correctchoice'); // No answers

      const studentPath = join(testOutputDir, 'e2e-student.tex');
      writeFileSync(studentPath, studentLatex);

      expect(existsSync(studentPath)).toBe(true);

      // Step 5: Export answer key
      const answerKey = exporter.exportAnswerKey();

      expect(answerKey).toContain('Answer Key');
      expect(answerKey).toContain('\\correctchoice'); // Has answers

      const answerKeyPath = join(testOutputDir, 'e2e-answer-key.tex');
      writeFileSync(answerKeyPath, answerKey);

      expect(existsSync(answerKeyPath)).toBe(true);

      // Step 6: Export rubric
      const rubric = exporter.exportRubric();

      expect(rubric).toContain('Grading Rubric');
      expect(rubric).toContain('Total Points');

      const rubricPath = join(testOutputDir, 'e2e-rubric.tex');
      writeFileSync(rubricPath, rubric);

      expect(existsSync(rubricPath)).toBe(true);

      // Verify all files created
      expect(existsSync(jsonPath)).toBe(true);
      expect(existsSync(studentPath)).toBe(true);
      expect(existsSync(answerKeyPath)).toBe(true);
      expect(existsSync(rubricPath)).toBe(true);
    });
  });

  describe('Quiz Generation Workflow', () => {
    it('should generate a quick quiz with limited time', () => {
      // Simulate quick quiz generation for weekly assessment
      const quizContent = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Weekly Quiz 1',
          date: new Date().toISOString().split('T')[0]
        },
        title: 'Weekly Quiz #1 - Descriptive Statistics',
        exam_type: 'quiz',
        duration_minutes: 15,
        instructions: 'Closed book. No calculator. 15 minutes.',
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'What does the median represent?',
            options: ['Middle value', 'Average value', 'Most common value', 'Range'],
            points: 3,
            difficulty: 'easy'
          },
          {
            id: 'Q2',
            type: 'true-false',
            text: 'The mode can have multiple values.',
            options: ['True', 'False'],
            points: 2,
            difficulty: 'easy'
          },
          {
            id: 'Q3',
            type: 'numerical',
            text: 'Find the median of: 3, 1, 4, 1, 5',
            points: 5,
            difficulty: 'easy'
          }
        ],
        answer_key: {
          Q1: 'A',
          Q2: 'A',
          Q3: { answer: '3', solution: 'Sorted: 1, 1, 3, 4, 5. Middle value = 3' }
        }
      };

      const validated = validateExam(quizContent, { strict: false });

      expect(validated.validation.isValid).toBe(true);
      expect(validated.metadata.totalPoints).toBe(10);
      expect(validated.content.duration_minutes).toBe(15);
      expect(validated.content.exam_type).toBe('quiz');

      // Export to LaTeX
      const exporter = new LatexExporter(validated.content);
      const latex = exporter.exportStudentVersion();

      expect(latex).toContain('Weekly Quiz');
      expect(latex).toContain('15 minutes');
    });
  });

  describe('Math-Heavy Exam Workflow', () => {
    it('should handle exam with extensive mathematical notation', () => {
      const mathExamContent = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Calculus Exam',
          date: new Date().toISOString().split('T')[0]
        },
        title: 'Calculus I - Final Exam',
        exam_type: 'final',
        duration_minutes: 120,
        questions: [
          {
            id: 'Q1',
            type: 'short-answer',
            text: 'Find the derivative of $f(x) = x^2 + 3x + 5$ using the power rule.',
            points: 10,
            difficulty: 'medium'
          },
          {
            id: 'Q2',
            type: 'short-answer',
            text: 'Evaluate the integral: $\\int_0^1 x^2 dx$',
            points: 15,
            difficulty: 'medium'
          },
          {
            id: 'Q3',
            type: 'essay',
            text: 'Explain the Fundamental Theorem of Calculus. Include both parts and describe why it is "fundamental".',
            points: 25,
            difficulty: 'hard'
          }
        ],
        answer_key: {
          Q1: '$f\'(x) = 2x + 3$',
          Q2: '$\\int_0^1 x^2 dx = [\\frac{x^3}{3}]_0^1 = \\frac{1}{3}$',
          Q3: 'The FTC Part 1 states that if $f$ is continuous on $[a,b]$, then $F(x) = \\int_a^x f(t)dt$ is differentiable and $F\'(x) = f(x)$. Part 2 states that $\\int_a^b f(x)dx = F(b) - F(a)$ where $F$ is any antiderivative of $f$. It is fundamental because it connects differentiation and integration as inverse operations.'
        },
        formula_sheet: 'Power Rule: $\\frac{d}{dx}x^n = nx^{n-1}$\n\nIntegral Power Rule: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$\n\nFTC Part 1: $\\frac{d}{dx}\\int_a^x f(t)dt = f(x)$\n\nFTC Part 2: $\\int_a^b f(x)dx = F(b) - F(a)$'
      };

      const validated = validateExam(mathExamContent, { strict: false });

      expect(validated.validation.isValid).toBe(true);

      // Export to LaTeX and verify math notation preserved
      const exporter = new LatexExporter(validated.content);
      const latex = exporter.exportStudentVersion();

      // Check math notation preserved
      expect(latex).toMatch(/\$.*x\^2.*\$/);
      expect(latex).toMatch(/\$.*\\int.*\$/);
      expect(latex).toMatch(/\$.*\\frac.*\$/);

      // Formula sheet included
      expect(latex).toContain('Formula Sheet');
      expect(latex).toContain('Power Rule');
      expect(latex).toContain('FTC Part');
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle malformed exam gracefully', () => {
      const malformedExam = {
        // Missing required fields
        title: 'Incomplete Exam',
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question without options',
            // Missing options array
            points: 5
          }
        ]
      };

      const validated = validateExam(malformedExam, { strict: false });

      expect(validated.validation.isValid).toBe(false);
      expect(validated.validation.errors.length).toBeGreaterThan(0);

      // Should still return a result object
      expect(validated).toHaveProperty('validation');
      expect(validated).toHaveProperty('content');
      expect(validated).toHaveProperty('metadata');
    });

    it('should detect missing answer keys', () => {
      const examWithoutAnswers = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: { title: 'Test', date: '2025-01-12' },
        title: 'Test Exam',
        exam_type: 'quiz',
        duration_minutes: 30,
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question 1',
            options: ['A', 'B', 'C', 'D'],
            points: 5,
            difficulty: 'easy'
          }
        ]
        // No answer_key field at all
      };

      const validated = validateExam(examWithoutAnswers, { strict: false });

      // Should have errors about missing answer key
      expect(validated.validation.isValid).toBe(false);
      expect(validated.validation.errors.length).toBeGreaterThan(0);
      const hasAnswerKeyError = validated.validation.errors.some(e =>
        e.field === 'answer_key' || e.message.includes('answer_key')
      );
      expect(hasAnswerKeyError).toBe(true);
    });
  });

  describe('Multiple Format Export Workflow', () => {
    it('should export to all formats for the same exam', () => {
      const examContent = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: { title: 'Multi-Format Test', date: '2025-01-12' },
        title: 'Multi-Format Test Exam',
        exam_type: 'midterm',
        duration_minutes: 60,
        questions: [
          {
            id: 'Q1',
            type: 'short-answer',
            text: 'Explain correlation vs causation.',
            points: 10,
            difficulty: 'medium'
          }
        ],
        answer_key: {
          Q1: 'Correlation means variables are related, but causation means one causes the other. Correlation does not imply causation.'
        }
      };

      const validated = validateExam(examContent, { strict: false });

      // Export to multiple LaTeX formats
      const exporter = new LatexExporter(validated.content);

      const studentVersion = exporter.exportStudentVersion();
      const answerKey = exporter.exportAnswerKey();
      const rubric = exporter.exportRubric();

      // All should be valid LaTeX
      expect(studentVersion).toContain('\\documentclass');
      expect(answerKey).toContain('\\documentclass');
      expect(rubric).toContain('\\documentclass');

      // Student version has no answers
      expect(studentVersion).not.toContain('Sample Answer');

      // Answer key has answers
      expect(answerKey).toContain('Solution:');
      expect(answerKey).toContain('Correlation');

      // Rubric has points
      expect(rubric).toContain('10');
      expect(rubric).toContain('Total Points');
    });

    it('should support different document classes', () => {
      const examContent = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: { title: 'Test', date: '2025-01-12' },
        title: 'Test Exam',
        exam_type: 'quiz',
        duration_minutes: 30,
        questions: [
          {
            id: 'Q1',
            type: 'short-answer',
            text: 'Question 1',
            points: 10,
            difficulty: 'easy'
          }
        ],
        answer_key: { Q1: 'Answer 1' }
      };

      const validated = validateExam(examContent, { strict: false });

      // Export with exam class
      const exporterExam = new LatexExporter(validated.content, {
        formatStyle: 'exam-class'
      });
      const latexExam = exporterExam.exportStudentVersion();

      expect(latexExam).toContain('\\documentclass[11pt,letterpaper]{exam}');
      expect(latexExam).toContain('\\begin{questions}');

      // Export with article class
      const exporterArticle = new LatexExporter(validated.content, {
        formatStyle: 'article'
      });
      const latexArticle = exporterArticle.exportStudentVersion();

      expect(latexArticle).toContain('\\documentclass[11pt,letterpaper]{article}');
      expect(latexArticle).not.toContain('\\begin{questions}');
    });
  });

  describe('Real-World Scenario: Course Instructor Workflow', () => {
    it('should simulate complete instructor workflow', () => {
      // Scenario: Instructor creates midterm, reviews, exports, prints

      // Step 1: Create exam content
      const examContent = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'STAT 440 Midterm',
          date: '2025-03-15',
          instructor: 'Dr. Smith',
          course: 'STAT 440 - Regression Analysis'
        },
        title: 'Regression Analysis - Midterm Exam',
        exam_type: 'midterm',
        duration_minutes: 75,
        instructions: 'Answer all questions. Show your work for full credit. You may use one page of notes.',
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'In simple linear regression, what does $R^2$ represent?',
            options: [
              'Proportion of variance explained',
              'Correlation coefficient',
              'Slope parameter',
              'Residual standard error'
            ],
            points: 5,
            difficulty: 'easy',
            topic: 'model assessment'
          },
          {
            id: 'Q2',
            type: 'numerical',
            text: 'Given SSE = 100 and SST = 400, calculate $R^2$.',
            points: 8,
            difficulty: 'medium',
            topic: 'model assessment'
          },
          {
            id: 'Q3',
            type: 'short-answer',
            text: 'Explain the assumptions of linear regression and why they matter.',
            points: 12,
            difficulty: 'medium',
            topic: 'assumptions'
          },
          {
            id: 'Q4',
            type: 'essay',
            text: 'A researcher finds that ice cream sales are correlated with crime rates. Design a hypothesis test to determine if this relationship is statistically significant. Discuss potential confounding variables.',
            points: 25,
            difficulty: 'hard',
            topic: 'hypothesis testing',
            rubric: 'Hypothesis formulation (8 pts), Test design (8 pts), Confounders identified (9 pts)'
          }
        ],
        answer_key: {
          Q1: 'A',
          Q2: {
            answer: '0.75',
            solution: '$R^2 = 1 - \\frac{SSE}{SST} = 1 - \\frac{100}{400} = 0.75$'
          },
          Q3: 'Linear regression assumes: (1) linearity, (2) independence, (3) homoscedasticity, (4) normality of residuals. These matter because violations lead to biased estimates, incorrect inference, and unreliable predictions.',
          Q4: {
            answer: 'H₀: β = 0, H₁: β ≠ 0. Use t-test for slope significance. Confounders: temperature (hot weather increases both), time of year, population density. Correlation does not imply causation.',
            rubric_points: {
              'Hypothesis (8 pts)': 'Correct null and alternative hypotheses with notation',
              'Test Design (8 pts)': 'Appropriate test chosen with justification',
              'Confounders (9 pts)': 'At least 3 relevant confounders identified with explanation'
            }
          }
        },
        formula_sheet: '$R^2 = 1 - \\frac{SSE}{SST}$\n\n$\\hat{\\beta}_1 = \\frac{\\sum(x_i - \\bar{x})(y_i - \\bar{y})}{\\sum(x_i - \\bar{x})^2}$\n\n$t = \\frac{\\hat{\\beta}_1 - 0}{SE(\\hat{\\beta}_1)}$'
      };

      // Step 2: Validate
      const validated = validateExam(examContent, { strict: false });

      expect(validated.validation.isValid).toBe(true);
      expect(validated.metadata.totalPoints).toBe(50);

      // Step 3: Save JSON for record keeping
      const jsonPath = join(testOutputDir, 'stat440-midterm.json');
      writeFileSync(jsonPath, JSON.stringify(validated.content, null, 2));

      // Step 4: Export for printing
      const exporter = new LatexExporter(validated.content);

      const studentCopies = exporter.exportStudentVersion();
      const instructorKey = exporter.exportAnswerKey();
      const gradingRubric = exporter.exportRubric();

      // Step 5: Verify exports
      expect(studentCopies).toContain('Regression Analysis');
      expect(studentCopies).toContain('75 minutes');
      expect(studentCopies).not.toContain('\\correctchoice'); // No answers

      expect(instructorKey).toContain('Answer Key');
      expect(instructorKey).toContain('\\correctchoice'); // Has answers

      expect(gradingRubric).toContain('50'); // Total points

      // Clean up
      if (existsSync(jsonPath)) {
        unlinkSync(jsonPath);
      }
    });
  });
});
