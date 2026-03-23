/**
 * E2E + Dogfooding: Math blank-line detection and auto-fix
 *
 * Tests the full defense-in-depth chain:
 *   1. validateLatex() detects blank lines in math blocks
 *   2. stripMathBlankLines() auto-fixes them
 *   3. formatLectureNotesAsQuarto() silently cleans generated content
 *   4. Real demo course content validates cleanly
 *
 * Uses realistic fixtures modeled on actual STAT-545 lecture content
 * where 238 display math blocks had blank lines that broke LaTeX PDF.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { validateLatex, stripMathBlankLines, hasLatex } from '../../../src/teaching/validators/latex.js';
import { formatLectureNotesAsQuarto } from '../../../src/teaching/formatters/quarto-notes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_TEMPLATES = path.resolve(__dirname, '../../../src/teaching/demo-templates');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Assert that text has no blank lines inside $$...$$ blocks
 */
function expectNoMathBlankLines(text) {
  const lines = text.split('\n');
  let inMath = false;
  let mathStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].trim();
    if (stripped === '$$') {
      if (inMath) {
        inMath = false;
      } else {
        inMath = true;
        mathStart = i + 1;
      }
    } else if (inMath && stripped === '') {
      throw new Error(
        `Blank line at line ${i + 1} inside $$...$$ block opened at line ${mathStart}`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Realistic fixtures (modeled on AI-generated STAT content)
// ─────────────────────────────────────────────────────────────

/** Simulates AI output with blank lines in multi-line display math */
const STAT_LECTURE_WITH_MATH_DEFECTS = {
  title: 'Simple Linear Regression',
  course_code: 'STAT-545',
  level: 'graduate',
  week: 3,
  learning_objectives: [
    'Derive the OLS estimators for simple linear regression',
    'Interpret regression coefficients and their standard errors',
    'Construct confidence intervals for regression parameters',
    'Test hypotheses about the slope and intercept'
  ],
  sections: [
    {
      id: 'model',
      title: 'The Simple Linear Regression Model',
      level: 2,
      type: 'definition',
      content: 'The population regression model relates Y to X through a linear function plus random error.',
      // AI-generated math with blank line (common defect)
      math: 'Y_i = \\beta_0 + \\beta_1 X_i + \\epsilon_i\n\n\\text{where } \\epsilon_i \\sim N(0, \\sigma^2)'
    },
    {
      id: 'ols',
      title: 'Ordinary Least Squares Estimators',
      level: 2,
      type: 'theorem',
      content: 'The OLS estimators minimize the sum of squared residuals.',
      // Multi-line math with TWO blank lines
      math: '\\hat{\\beta}_1 = \\frac{\\sum_{i=1}^n (X_i - \\bar{X})(Y_i - \\bar{Y})}{\\sum_{i=1}^n (X_i - \\bar{X})^2}\n\n\\hat{\\beta}_0 = \\bar{Y} - \\hat{\\beta}_1 \\bar{X}\n\n\\text{RSS} = \\sum_{i=1}^n (Y_i - \\hat{Y}_i)^2'
    },
    {
      id: 'r-squared',
      title: 'Coefficient of Determination',
      level: 2,
      type: 'default',
      content: 'The R-squared statistic measures the proportion of variance explained by the model.',
      // Single blank line in display math
      math: 'R^2 = 1 - \\frac{\\text{RSS}}{\\text{TSS}} = 1 - \\frac{\\sum (Y_i - \\hat{Y}_i)^2}{\\sum (Y_i - \\bar{Y})^2}\n\n0 \\leq R^2 \\leq 1'
    },
    {
      id: 'hypothesis',
      title: 'Hypothesis Testing for the Slope',
      level: 2,
      type: 'proof',
      content: 'Under the null hypothesis that the slope is zero:',
      // Clean math (no blank lines) — should pass through unchanged
      math: 't = \\frac{\\hat{\\beta}_1 - 0}{\\text{SE}(\\hat{\\beta}_1)} \\sim t_{n-2}'
    },
    {
      id: 'example-r',
      title: 'R Implementation',
      level: 2,
      type: 'example',
      content: 'Fitting a simple linear regression model in R using the mtcars dataset.',
      // Math with blank line in example section
      math: 'Y = \\beta_0 + \\beta_1 \\cdot \\text{wt}\n\n+ \\epsilon',
      code: {
        language: 'r',
        source: 'model <- lm(mpg ~ wt, data = mtcars)\nsummary(model)',
        label: 'fig-regression'
      }
    },
    {
      id: 'practice',
      title: 'Practice Problems',
      level: 2,
      type: 'practice',
      content: 'Work through these problems to solidify your understanding.',
      problems: [
        {
          text: 'Given the following data, compute the OLS estimates.',
          difficulty: 'medium',
          hint: 'Use the formulas from the OLS theorem section.',
          solution: 'Apply $\\hat{\\beta}_1 = S_{xy}/S_{xx}$ to get the slope.'
        }
      ]
    }
  ],
  references: [
    'Weisberg, S. (2014). *Applied Linear Regression*, 4th ed.',
    'Sheather, S.J. (2009). *A Modern Approach to Regression with R*.'
  ]
};

/** Same lecture but with NO math defects (control group) */
const CLEAN_LECTURE = {
  title: 'Probability Fundamentals',
  course_code: 'STAT-101',
  level: 'undergraduate',
  week: 4,
  learning_objectives: [
    'Define probability using the frequentist interpretation',
    'Apply the three basic probability rules'
  ],
  sections: [
    {
      id: 'definition',
      title: 'What is Probability?',
      level: 2,
      type: 'definition',
      content: 'Probability measures the likelihood of an event.',
      math: 'P(A) = \\lim_{n \\to \\infty} \\frac{\\text{count}(A)}{n}'
    },
    {
      id: 'rules',
      title: 'Basic Rules',
      level: 2,
      type: 'default',
      content: 'The three fundamental rules of probability.',
      math: '0 \\leq P(A) \\leq 1'
    }
  ],
  references: []
};

// ─────────────────────────────────────────────────────────────
// E2E: Defense-in-depth chain
// ─────────────────────────────────────────────────────────────

describe('E2E: Math blank-line defense chain', () => {
  describe('Step 1: Detection — validateLatex flags blank lines', () => {
    it('should detect blank lines in AI-generated multi-line math', () => {
      // Simulate raw content as it appears in the formatted output
      const rawMath = '$$\nY_i = \\beta_0 + \\beta_1 X_i + \\epsilon_i\n\n\\text{where } \\epsilon_i \\sim N(0, \\sigma^2)\n$$';
      const errors = validateLatex(rawMath);
      const blankErrors = errors.filter(e => e.message.includes('Blank line inside'));

      expect(blankErrors.length).toBe(1);
      expect(blankErrors[0].message).toContain('line 1');
    });

    it('should detect multiple blank lines across a full lecture', () => {
      // Format the defective lecture, then validate the RAW (pre-strip) output
      // We need to test what would happen WITHOUT stripMathBlankLines
      const sections = STAT_LECTURE_WITH_MATH_DEFECTS.sections;
      const mathSections = sections.filter(s => s.math && s.math.includes('\n\n'));

      // Each section with blank lines in math should be flaggable
      expect(mathSections.length).toBeGreaterThanOrEqual(3);

      for (const section of mathSections) {
        const wrappedMath = `$$\n${section.math}\n$$`;
        const errors = validateLatex(wrappedMath);
        const blankErrors = errors.filter(e => e.message.includes('Blank line inside'));
        expect(blankErrors.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Step 2: Auto-fix — stripMathBlankLines cleans content', () => {
    it('should fix all math defects from a realistic lecture', () => {
      // Wrap each defective math field as the formatter would
      const defectiveSections = STAT_LECTURE_WITH_MATH_DEFECTS.sections
        .filter(s => s.math && s.math.includes('\n\n'));

      for (const section of defectiveSections) {
        const raw = `$$\n${section.math}\n$$`;
        const fixed = stripMathBlankLines(raw);

        // Fixed version should have no blank lines inside $$
        expectNoMathBlankLines(fixed);

        // Content should still contain the actual math (not stripped entirely)
        expect(fixed).toContain('$$');
        expect(fixed.length).toBeGreaterThan(10);
      }
    });

    it('should be idempotent — fixing clean content changes nothing', () => {
      const clean = '$$\nY = \\beta_0 + \\beta_1 X\n$$';
      expect(stripMathBlankLines(clean)).toBe(clean);
    });
  });

  describe('Step 3: Pipeline — formatLectureNotesAsQuarto auto-fixes', () => {
    it('should produce clean output from a lecture with math defects', () => {
      const qmd = formatLectureNotesAsQuarto(STAT_LECTURE_WITH_MATH_DEFECTS, {
        formats: ['html', 'pdf'],
        language: 'r'
      });

      // No blank lines inside any $$...$$ block in the final output
      expectNoMathBlankLines(qmd);

      // Math content is still present (not stripped entirely)
      expect(qmd).toContain('\\beta_0');
      expect(qmd).toContain('\\hat{\\beta}_1');
      expect(qmd).toContain('R^2');
    });

    it('should produce clean output from a lecture without defects', () => {
      const qmd = formatLectureNotesAsQuarto(CLEAN_LECTURE, {
        formats: ['html', 'pdf'],
        language: 'r'
      });

      expectNoMathBlankLines(qmd);
      expect(qmd).toContain('P(A)');
    });

    it('should preserve document structure while fixing math', () => {
      const qmd = formatLectureNotesAsQuarto(STAT_LECTURE_WITH_MATH_DEFECTS, {
        formats: ['html', 'pdf'],
        language: 'r'
      });

      // YAML frontmatter intact
      expect(qmd).toMatch(/^---\n/);
      expect(qmd).toContain('title: "Simple Linear Regression"');
      expect(qmd).toContain('subtitle: "STAT-545"');

      // Section structure intact
      expect(qmd).toContain('## The Simple Linear Regression Model');
      expect(qmd).toContain('## Ordinary Least Squares Estimators');
      expect(qmd).toContain('## R Implementation');

      // Callout blocks intact
      expect(qmd).toContain('.callout-note title="Definition"');
      expect(qmd).toContain('.callout-important title="Theorem"');
      expect(qmd).toContain('{.proof}');

      // Code block intact
      expect(qmd).toContain('```{r}');
      expect(qmd).toContain('lm(mpg ~ wt, data = mtcars)');

      // References intact
      expect(qmd).toContain('## References');
      expect(qmd).toContain('Weisberg');
    });
  });

  describe('Step 4: Round-trip — detect → fix → validate passes', () => {
    it('should pass validation after auto-fix', () => {
      const qmd = formatLectureNotesAsQuarto(STAT_LECTURE_WITH_MATH_DEFECTS, {
        formats: ['html', 'pdf'],
        language: 'r'
      });

      // The auto-fixed output should have zero blank-line errors
      const errors = validateLatex(qmd);
      const blankErrors = errors.filter(e => e.message.includes('Blank line inside'));
      expect(blankErrors).toHaveLength(0);
    });

    it('should have no other LaTeX validation errors in clean output', () => {
      const qmd = formatLectureNotesAsQuarto(CLEAN_LECTURE, {
        formats: ['html'],
        language: 'r'
      });

      const errors = validateLatex(qmd);
      expect(errors).toHaveLength(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// E2E: Multiple section types with math
// ─────────────────────────────────────────────────────────────

describe('E2E: All section types with math blank lines', () => {
  // Each formatter (definition, theorem, proof, example, generic) wraps
  // section.math in $$...$$. All paths must be cleaned.

  const SECTION_TYPES = [
    { type: 'definition', label: 'Definition', callout: '.callout-note' },
    { type: 'theorem', label: 'Theorem', callout: '.callout-important' },
    { type: 'proof', label: 'Proof', callout: '.proof' },
    { type: 'example', label: 'Example', callout: '.callout-note' },
    { type: 'default', label: 'Generic', callout: null },
  ];

  const DEFECTIVE_MATH = 'x = \\frac{a}{b}\n\n+ c';

  it.each(SECTION_TYPES)(
    'should clean math in $type sections',
    ({ type }) => {
      const lecture = {
        title: 'Test',
        learning_objectives: ['Test objective'],
        sections: [{
          id: `test-${type}`,
          title: `Test ${type}`,
          level: 2,
          type,
          content: 'Test content',
          math: DEFECTIVE_MATH,
          ...(type === 'example' ? { code: { language: 'r', source: 'x <- 1' } } : {})
        }],
        references: []
      };

      const qmd = formatLectureNotesAsQuarto(lecture);
      expectNoMathBlankLines(qmd);
      expect(qmd).toContain('\\frac{a}{b}');
    }
  );
});

// ─────────────────────────────────────────────────────────────
// Dogfooding: Real demo course content
// ─────────────────────────────────────────────────────────────

describe('Dogfooding: Demo course content validation', () => {
  const slidesPath = path.join(DEMO_TEMPLATES, 'examples', 'slides-probability.md');
  const slidesExist = fs.existsSync(slidesPath);

  const describeIfSlides = slidesExist ? describe : describe.skip;

  describeIfSlides('slides-probability.md (real demo content)', () => {
    let slidesContent;

    beforeAll(() => {
      slidesContent = fs.readFileSync(slidesPath, 'utf8');
    });

    it('should contain LaTeX math', () => {
      expect(hasLatex(slidesContent)).toBe(true);
    });

    it('should pass LaTeX validation with no errors', () => {
      const errors = validateLatex(slidesContent);
      // Filter out non-math errors (backslash-space from `\text` etc.)
      const mathErrors = errors.filter(e =>
        e.message.includes('Blank line') ||
        e.message.includes('Unbalanced')
      );
      expect(mathErrors).toHaveLength(0);
    });

    it('should survive stripMathBlankLines unchanged (already clean)', () => {
      const result = stripMathBlankLines(slidesContent);
      expect(result).toBe(slidesContent);
    });
  });

  describeIfSlides('demo content as lecture notes input', () => {
    it('should produce valid Quarto from STAT-101 probability content', () => {
      // Build a lecture notes object from demo course topics
      const probabilityLecture = {
        title: 'Probability Fundamentals',
        course_code: 'STAT-101',
        level: 'undergraduate',
        week: 4,
        learning_objectives: [
          'Define probability using the frequentist interpretation',
          'Identify sample spaces and events',
          'Apply the three basic probability rules',
          'Calculate conditional probabilities',
          'Determine if events are independent'
        ],
        sections: [
          {
            id: 'freq-def',
            title: 'Frequentist Definition',
            level: 2,
            type: 'definition',
            content: 'Probability as a long-run frequency.',
            math: 'P(A) = \\lim_{n \\to \\infty} \\frac{\\text{count}(A)}{n}'
          },
          {
            id: 'addition',
            title: 'Addition Rule',
            level: 2,
            type: 'theorem',
            content: 'For any two events A and B:',
            // Intentionally inject blank line to test auto-fix
            math: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)\n\n\\text{If mutually exclusive: } P(A \\cup B) = P(A) + P(B)'
          },
          {
            id: 'conditional',
            title: 'Conditional Probability',
            level: 2,
            type: 'default',
            content: 'The probability of A given B has occurred.',
            math: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}'
          },
          {
            id: 'bayes',
            title: 'Bayes Theorem',
            level: 2,
            type: 'theorem',
            content: 'Reversing conditional probabilities.',
            // Another intentional blank line
            math: 'P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}\n\n= \\frac{P(B|A) \\cdot P(A)}{P(B|A)P(A) + P(B|A^c)P(A^c)}'
          }
        ],
        references: ['Devore, J.L. (2015). *Probability and Statistics*, 9th ed.']
      };

      const qmd = formatLectureNotesAsQuarto(probabilityLecture, {
        formats: ['html', 'pdf'],
        language: 'r'
      });

      // Auto-fix should have cleaned the two injected blank lines
      expectNoMathBlankLines(qmd);

      // All math content preserved
      expect(qmd).toContain('P(A \\cup B)');
      expect(qmd).toContain('P(A|B)');
      expect(qmd).toContain('\\frac{P(B|A)');

      // PDF LaTeX packages present (needed for math rendering)
      expect(qmd).toContain('\\usepackage{amsmath');
      expect(qmd).toContain('\\usepackage{mathtools}');

      // Validate the output passes LaTeX checks
      const errors = validateLatex(qmd);
      const blankErrors = errors.filter(e => e.message.includes('Blank line'));
      expect(blankErrors).toHaveLength(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Dogfooding: Stress test with real-world defect patterns
// ─────────────────────────────────────────────────────────────

describe('Dogfooding: Real-world defect patterns from STAT-545', () => {
  // These patterns are modeled on actual AI output that broke LaTeX PDF.
  // Each represents a category of blank-line defect found in production.

  const DEFECT_PATTERNS = [
    {
      name: 'blank line before "where" clause',
      math: 'Y_i = \\mu + \\alpha_i + \\epsilon_{ij}\n\n\\text{where } \\epsilon_{ij} \\sim N(0, \\sigma^2)',
    },
    {
      name: 'blank line between aligned equations',
      math: '\\hat{\\mu} = \\bar{Y}_{..}\n\n\\hat{\\alpha}_i = \\bar{Y}_{i.} - \\bar{Y}_{..}',
    },
    {
      name: 'blank line before constraint',
      math: '\\sum_{i=1}^k \\alpha_i = 0\n\n\\text{(sum-to-zero constraint)}',
    },
    {
      name: 'blank line in multi-step derivation',
      math: 'E(MS_A) = \\sigma^2 + \\frac{n \\sum \\alpha_i^2}{k-1}\n\nE(MS_E) = \\sigma^2\n\nF = \\frac{MS_A}{MS_E}',
    },
    {
      name: 'blank line in piecewise definition',
      math: 'T(x) = \\begin{cases} 1 & \\text{if } x > c \\\\ 0 & \\text{otherwise} \\end{cases}\n\n\\text{where } c = t_{\\alpha/2, n-1}',
    },
  ];

  it.each(DEFECT_PATTERNS)(
    'should fix: $name',
    ({ math }) => {
      const wrapped = `$$\n${math}\n$$`;

      // Verify it IS defective
      const errors = validateLatex(wrapped);
      expect(errors.some(e => e.message.includes('Blank line inside'))).toBe(true);

      // Fix it
      const fixed = stripMathBlankLines(wrapped);
      expectNoMathBlankLines(fixed);

      // Verify fix passes validation
      const postFixErrors = validateLatex(fixed);
      const blankErrors = postFixErrors.filter(e => e.message.includes('Blank line'));
      expect(blankErrors).toHaveLength(0);
    }
  );

  it('should handle all 5 patterns through the full pipeline', () => {
    const lecture = {
      title: 'ANOVA and Linear Models',
      course_code: 'STAT-545',
      learning_objectives: ['Understand ANOVA decomposition'],
      sections: DEFECT_PATTERNS.map((pattern, i) => ({
        id: `defect-${i}`,
        title: `Pattern ${i + 1}: ${pattern.name}`,
        level: 2,
        type: 'default',
        content: `Testing: ${pattern.name}`,
        math: pattern.math
      })),
      references: []
    };

    const qmd = formatLectureNotesAsQuarto(lecture, {
      formats: ['pdf'],
      language: 'r'
    });

    // All blank lines should be gone
    expectNoMathBlankLines(qmd);

    // All 5 sections should appear
    for (const pattern of DEFECT_PATTERNS) {
      expect(qmd).toContain(pattern.name);
    }
  });
});
