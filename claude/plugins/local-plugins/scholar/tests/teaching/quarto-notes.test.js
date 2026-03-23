/**
 * Tests for Quarto Notes Formatter
 *
 * Minimal tests for the lecture notes Quarto formatter.
 */

import {
  formatLectureNotesAsQuarto,
  generateFrontmatter,
  generateObjectivesSection,
  formatSection,
  formatCodeBlock,
  escapeYaml
} from '../../src/teaching/formatters/quarto-notes.js';

// Sample lecture notes for testing
const sampleLectureNotes = {
  title: 'Introduction to Linear Regression',
  course_code: 'STAT-440',
  learning_objectives: [
    'Understand the assumptions of linear regression',
    'Fit a linear model using R',
    'Interpret regression coefficients'
  ],
  sections: [
    {
      id: 'S1',
      type: 'introduction',
      title: 'Introduction',
      content: 'Linear regression is a fundamental statistical technique.'
    },
    {
      id: 'S2',
      type: 'code',
      title: 'R Implementation',
      description: 'Fitting a linear model in R',
      code_language: 'r',
      code: 'model <- lm(y ~ x, data = df)\nsummary(model)',
      explanation: 'This code fits a simple linear regression model.'
    }
  ],
  references: []
};

describe('formatLectureNotesAsQuarto', () => {
  it('should format lecture notes as Quarto document', () => {
    const output = formatLectureNotesAsQuarto(sampleLectureNotes);

    expect(output).toContain('---');
    expect(output).toContain('title: "Introduction to Linear Regression"');
    expect(output).toContain('subtitle: "STAT-440"');
    expect(output).toContain('Learning Objectives');
  });

  it('should include all output formats in frontmatter', () => {
    const output = formatLectureNotesAsQuarto(sampleLectureNotes, {
      formats: ['html', 'pdf', 'docx']
    });

    expect(output).toContain('format:');
    expect(output).toContain('html:');
    expect(output).toContain('pdf:');
    expect(output).toContain('docx:');
  });

  it('should include sections', () => {
    const output = formatLectureNotesAsQuarto(sampleLectureNotes);

    expect(output).toContain('Introduction');
    expect(output).toContain('R Implementation');
  });
});

describe('generateFrontmatter', () => {
  it('should generate valid YAML frontmatter', () => {
    const frontmatter = generateFrontmatter(sampleLectureNotes, ['html'], 'r');

    expect(frontmatter).toMatch(/^---/);
    expect(frontmatter).toMatch(/---$/);
    expect(frontmatter).toContain('title: "Introduction to Linear Regression"');
    expect(frontmatter).toContain('toc: true');
  });

  it('should include requested output formats', () => {
    const frontmatter = generateFrontmatter(sampleLectureNotes, ['pdf'], 'r');

    expect(frontmatter).toContain('format:');
    expect(frontmatter).toContain('pdf:');
    expect(frontmatter).not.toContain('html:');
  });
});

describe('generateObjectivesSection', () => {
  it('should format learning objectives as callout', () => {
    const objectives = [
      'Objective 1',
      'Objective 2',
      'Objective 3'
    ];

    const output = generateObjectivesSection(objectives);

    expect(output).toContain('::: {.callout-tip');
    expect(output).toContain('Learning Objectives');
    expect(output).toContain('1. Objective 1');
    expect(output).toContain('2. Objective 2');
    expect(output).toContain('3. Objective 3');
    expect(output).toContain(':::');
  });

  it('should handle empty objectives gracefully', () => {
    const output = generateObjectivesSection([]);

    // Empty objectives returns empty string
    expect(output).toBe('');
  });
});

describe('formatSection', () => {
  it('should format introduction section', () => {
    const section = {
      id: 'S1',
      type: 'introduction',
      title: 'Test Introduction',
      content: 'This is the introduction content.'
    };

    const output = formatSection(section, 'r');

    expect(output).toContain('Test Introduction');
    expect(output).toContain('{#sec-s1}');
    expect(output).toContain('This is the introduction content.');
  });

  it('should format code section with language', () => {
    const section = {
      id: 'S2',
      type: 'code',
      title: 'Code Example',
      content: 'Example code explanation',
      code: { language: 'r', source: 'x <- 1 + 1' }
    };

    const output = formatSection(section, 'r');

    expect(output).toContain('Code Example');
    expect(output).toContain('```{r}');
    expect(output).toContain('x <- 1 + 1');
    expect(output).toContain('```');
  });
});

describe('formatCodeBlock', () => {
  it('should format R code block', () => {
    const code = { language: 'r', source: 'x <- 1' };
    const output = formatCodeBlock(code, 'r');

    expect(output).toContain('```{r}');
    expect(output).toContain('x <- 1');
    expect(output).toContain('```');
  });

  it('should format Python code block', () => {
    const code = { language: 'python', source: 'x = 1' };
    const output = formatCodeBlock(code, 'python');

    expect(output).toContain('```{python}');
    expect(output).toContain('x = 1');
    expect(output).toContain('```');
  });

  it('should use default language if not specified', () => {
    const code = { source: 'x <- 1' };
    const output = formatCodeBlock(code, 'r');

    expect(output).toContain('```{r}');
    expect(output).toContain('x <- 1');
    expect(output).toContain('```');
  });
});

describe('escapeYaml', () => {
  it('should escape double quotes', () => {
    expect(escapeYaml('He said "hello"')).toBe('He said \\"hello\\"');
  });

  it('should handle empty string', () => {
    expect(escapeYaml('')).toBe('');
  });

  it('should handle null', () => {
    expect(escapeYaml(null)).toBe('');
  });

  it('should handle undefined', () => {
    expect(escapeYaml(undefined)).toBe('');
  });
});

describe('math blank line auto-fix', () => {
  it('should strip blank lines from inside $$...$$ blocks in output', () => {
    const lectureNotes = {
      title: 'Test Lecture',
      learning_objectives: ['Understand math'],
      sections: [{
        id: 'math-test',
        title: 'Math Section',
        level: 2,
        type: 'default',
        content: 'Some explanation',
        math: 'x + y\n\n= z'
      }]
    };

    const result = formatLectureNotesAsQuarto(lectureNotes);

    // The math block should be $$\nx + y\n= z\n$$ (no blank line)
    const mathBlockRegex = /\$\$([\s\S]*?)\$\$/g;
    let match;
    while ((match = mathBlockRegex.exec(result)) !== null) {
      const mathContent = match[1];
      const lines = mathContent.split('\n');
      const blankLines = lines.filter(l => l.trim() === '' && lines.indexOf(l) !== 0 && lines.indexOf(l) !== lines.length - 1);
      // No interior blank lines allowed
      expect(blankLines.length).toBe(0);
    }
  });
});
