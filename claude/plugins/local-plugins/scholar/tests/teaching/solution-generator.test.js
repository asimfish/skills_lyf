/**
 * Tests for Solution Key Generator
 *
 * Verifies that the solution generator correctly:
 * - Parses .qmd and .json assignment files
 * - Builds AI prompts from parsed assignments
 * - Formats solutions as Markdown and Quarto
 * - Generates correct output paths
 */

import {
  parseQmdAssignment,
  parseJsonAssignment,
  parseAssignment,
  buildSolutionPrompt,
  formatSolutionAsMarkdown,
  formatSolutionAsQuarto,
  formatSolutionAsEmail,
  exportSolution,
  generateOutputPath
} from '../../src/teaching/generators/solution.js';

import {
  buildConversationalPrompt,
  processGeneratedSolution
} from '../../src/teaching/generators/solution-conversational.js';

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test fixtures
const SAMPLE_QMD = `---
title: "Assignment 1: Basics of Experimental Design"
subtitle: "STAT 545"
---

## Problem 1

Consider a completely randomized design with $k = 3$ treatments and $n = 10$ observations per treatment.

**(a)** State the null and alternative hypotheses for the one-way ANOVA F-test. [5 pts]

**(b)** Calculate the degrees of freedom for treatments and error. [5 pts]

## Problem 2

A researcher wants to compare four fertilizer types on plant growth. She has 20 plots available.

**(a)** Describe an appropriate experimental design. [10 pts]

**(b)** Write the statistical model. [10 pts]
`;

const SAMPLE_JSON = {
  title: 'Homework 3: Contrasts',
  assignment_type: 'homework',
  total_points: 50,
  problems: [
    {
      id: 'P1',
      text: 'Define a contrast and give an example.',
      points: 15,
      parts: [
        { label: 'a', text: 'Define a contrast vector', points: 5 },
        { label: 'b', text: 'Verify orthogonality', points: 10 }
      ]
    },
    {
      id: 'P2',
      text: 'Compute the sum of squares for a contrast.',
      points: 20
    }
  ]
};

const SAMPLE_EXERCISE_QMD = `---
title: "Assignment 4: Checking Model Assumptions"
---

## Exercise 3: Margarine Experiment

The data show melting times for three brands of margarine and one brand of butter.

(a) Check the equal-variance assumption.

(b) Compute a confidence interval with transformed data.

## Exercise 6: Bicycle Experiment

The bicycle experiment investigated crank rates at different speeds.

(a) Evaluate error variances.

(b) Apply a transformation.
`;

const SAMPLE_SOLUTION = {
  assignment_title: 'Assignment 1: Basics of Experimental Design',
  solutions: {
    P1: {
      answer: '$F(2, 27) = 8.43$, $p = 0.0015$',
      steps: [
        'Step 1: State hypotheses',
        'Step 2: Calculate test statistic'
      ],
      parts: {
        a: '$H_0: \\mu_1 = \\mu_2 = \\mu_3$',
        b: '$df_{Trt} = 2$, $df_E = 27$'
      },
      code: 'fit <- aov(Y ~ Trt, data = df)\nsummary(fit)',
      interpretation: 'Strong evidence against null hypothesis',
      common_mistakes: ['Using t-test for 3+ groups'],
      grading_notes: 'Award 5 pts for correct setup'
    },
    P2: {
      answer: 'CRD with 5 plots per treatment',
      steps: ['Step 1: Randomize plots', 'Step 2: Assign treatments'],
      parts: {
        a: 'Use a completely randomized design',
        b: '$Y_{ij} = \\mu + \\tau_i + \\varepsilon_{ij}$'
      },
      interpretation: 'Equal replication ensures balanced design',
      common_mistakes: ['Forgetting to randomize'],
      grading_notes: 'Accept RCBD if blocking is justified'
    }
  },
  general_notes: 'Show all work for full credit.'
};

// Temp directory for test files
let tmpDir;

beforeAll(() => {
  tmpDir = join(tmpdir(), `scholar-solution-test-${Date.now()}`);
  mkdirSync(join(tmpDir, 'assignments'), { recursive: true });

  // Write sample .qmd file
  writeFileSync(join(tmpDir, 'assignments', 'assignment1.qmd'), SAMPLE_QMD, 'utf-8');

  // Write sample .qmd file with Exercise headings
  writeFileSync(join(tmpDir, 'assignments', 'assignment4.qmd'), SAMPLE_EXERCISE_QMD, 'utf-8');

  // Write sample .json file
  writeFileSync(
    join(tmpDir, 'assignments', 'hw3.json'),
    JSON.stringify(SAMPLE_JSON, null, 2),
    'utf-8'
  );
});

afterAll(() => {
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('QMD Parser', () => {
  it('should parse YAML frontmatter', () => {
    const result = parseQmdAssignment(join(tmpDir, 'assignments', 'assignment1.qmd'));
    expect(result.title).toBe('Assignment 1: Basics of Experimental Design');
    expect(result.metadata.subtitle).toBe('STAT 545');
  });

  it('should extract problems from markdown', () => {
    const result = parseQmdAssignment(join(tmpDir, 'assignments', 'assignment1.qmd'));
    expect(result.problems.length).toBe(2);
    expect(result.problems[0].id).toBe('P1');
    expect(result.problems[1].id).toBe('P2');
  });

  it('should preserve raw content for fallback', () => {
    const result = parseQmdAssignment(join(tmpDir, 'assignments', 'assignment1.qmd'));
    expect(result.rawContent).toContain('completely randomized design');
  });

  it('should store source file path', () => {
    const filepath = join(tmpDir, 'assignments', 'assignment1.qmd');
    const result = parseQmdAssignment(filepath);
    expect(result.sourceFile).toBe(filepath);
  });

  it('should extract exercises from ## Exercise N headings', () => {
    const result = parseQmdAssignment(join(tmpDir, 'assignments', 'assignment4.qmd'));
    expect(result.title).toBe('Assignment 4: Checking Model Assumptions');
    expect(result.problems.length).toBe(2);
    expect(result.problems[0].id).toBe('P3');
    expect(result.problems[1].id).toBe('P6');
  });
});

describe('JSON Parser', () => {
  it('should parse JSON assignment structure', () => {
    const result = parseJsonAssignment(join(tmpDir, 'assignments', 'hw3.json'));
    expect(result.title).toBe('Homework 3: Contrasts');
    expect(result.problems.length).toBe(2);
  });

  it('should extract problem parts', () => {
    const result = parseJsonAssignment(join(tmpDir, 'assignments', 'hw3.json'));
    expect(result.problems[0].parts.length).toBe(2);
    expect(result.problems[0].parts[0].label).toBe('a');
  });
});

describe('Auto-detect Parser', () => {
  it('should detect .qmd files', () => {
    const result = parseAssignment(join(tmpDir, 'assignments', 'assignment1.qmd'));
    expect(result.title).toBe('Assignment 1: Basics of Experimental Design');
  });

  it('should detect .json files', () => {
    const result = parseAssignment(join(tmpDir, 'assignments', 'hw3.json'));
    expect(result.title).toBe('Homework 3: Contrasts');
  });

  it('should throw on missing file', () => {
    expect(() => parseAssignment('/nonexistent/file.qmd')).toThrow('not found');
  });

  it('should throw on unsupported format', () => {
    const txtFile = join(tmpDir, 'assignments', 'test.txt');
    writeFileSync(txtFile, 'test', 'utf-8');
    expect(() => parseAssignment(txtFile)).toThrow('Unsupported file format');
  });
});

describe('Prompt Builder', () => {
  it('should build prompt with problems', () => {
    const assignment = parseAssignment(join(tmpDir, 'assignments', 'assignment1.qmd'));
    const config = { scholar: { course_info: { code: 'STAT 545', title: 'ANOVA' } } };
    const prompt = buildSolutionPrompt(assignment, { includeCode: true, language: 'R' }, config);

    expect(prompt).toContain('STAT 545');
    expect(prompt).toContain('P1');
    expect(prompt.toLowerCase()).toContain('step-by-step');
    expect(prompt).toContain('R code');
  });

  it('should include rubric request when option set', () => {
    const assignment = parseAssignment(join(tmpDir, 'assignments', 'hw3.json'));
    const config = { scholar: {} };
    const prompt = buildSolutionPrompt(
      assignment,
      { includeRubric: true, includeCode: false },
      config
    );

    expect(prompt).toContain('Grading notes');
  });

  it('should fall back to raw content when no problems parsed', () => {
    const assignment = {
      title: 'Test',
      problems: [],
      rawContent: 'Some assignment content here',
      sourceFile: 'test.qmd'
    };
    const config = { scholar: {} };
    const prompt = buildSolutionPrompt(assignment, {}, config);

    expect(prompt).toContain('Assignment Content (full file)');
    expect(prompt).toContain('Some assignment content here');
  });
});

describe('Markdown Formatter', () => {
  const assignment = {
    title: 'Assignment 1',
    sourceFile: 'assignments/assignment1.qmd'
  };

  it('should format solution with title and source', () => {
    const md = formatSolutionAsMarkdown(assignment, SAMPLE_SOLUTION);

    expect(md).toContain('# Solution Key:');
    expect(md).toContain('assignment1.qmd');
  });

  it('should include steps and answers', () => {
    const md = formatSolutionAsMarkdown(assignment, SAMPLE_SOLUTION);

    expect(md).toContain('**Solution:**');
    expect(md).toContain('Step 1:');
    expect(md).toContain('**Answer:**');
  });

  it('should include code blocks', () => {
    const md = formatSolutionAsMarkdown(assignment, SAMPLE_SOLUTION, { language: 'r' });

    expect(md).toContain('```r');
    expect(md).toContain('aov(Y ~ Trt');
  });

  it('should include common mistakes', () => {
    const md = formatSolutionAsMarkdown(assignment, SAMPLE_SOLUTION);

    expect(md).toContain('**Common Mistakes:**');
    expect(md).toContain('Using t-test');
  });

  it('should include general notes', () => {
    const md = formatSolutionAsMarkdown(assignment, SAMPLE_SOLUTION);

    expect(md).toContain('## General Grading Notes');
    expect(md).toContain('Show all work');
  });

  it('should handle empty solutions gracefully', () => {
    const md = formatSolutionAsMarkdown(assignment, { solutions: {} });
    expect(md).toContain('No solutions generated');
  });
});

describe('Quarto Formatter', () => {
  const assignment = {
    title: 'Assignment 1',
    sourceFile: 'assignments/assignment1.qmd'
  };

  it('should include YAML frontmatter', () => {
    const qmd = formatSolutionAsQuarto(assignment, SAMPLE_SOLUTION);

    expect(qmd).toMatch(/^---/);
    expect(qmd).toContain('title: "Solution Key:');
    expect(qmd).toContain('subtitle: "Instructor Only"');
    expect(qmd).toContain('toc: true');
  });

  it('should include tex macros path for PDF', () => {
    const qmd = formatSolutionAsQuarto(assignment, SAMPLE_SOLUTION);

    expect(qmd).toContain('include-in-header');
    expect(qmd).toContain('tex/macros.tex');
  });
});

describe('Export Dispatcher', () => {
  const assignment = {
    title: 'Test',
    sourceFile: 'test.qmd'
  };

  it('should export markdown', () => {
    const result = exportSolution(assignment, SAMPLE_SOLUTION, 'md');
    expect(result.extension).toBe('.md');
    expect(result.content).toContain('# Solution Key');
  });

  it('should export quarto', () => {
    const result = exportSolution(assignment, SAMPLE_SOLUTION, 'qmd');
    expect(result.extension).toBe('.qmd');
    expect(result.content).toContain('---');
  });

  it('should export JSON', () => {
    const result = exportSolution(assignment, SAMPLE_SOLUTION, 'json');
    expect(result.extension).toBe('.json');
    const parsed = JSON.parse(result.content);
    expect(parsed.solutions).toBeDefined();
  });

  it('should reject unsupported formats', () => {
    expect(() => exportSolution(assignment, SAMPLE_SOLUTION, 'pdf')).toThrow('Unsupported format');
  });
});

describe('Output Path Generator', () => {
  it('should generate default path in solutions/ directory', () => {
    const path = generateOutputPath('/project/assignments/hw1.qmd', 'qmd');
    expect(path).toContain('solutions');
    expect(path).toContain('hw1-solution.qmd');
  });

  it('should respect custom output path', () => {
    const path = generateOutputPath('/project/assignments/hw1.qmd', 'qmd', '/custom/path.qmd');
    expect(path).toBe('/custom/path.qmd');
  });

  it('should use correct extension for format', () => {
    expect(generateOutputPath('/a/b.qmd', 'md')).toContain('.md');
    expect(generateOutputPath('/a/b.qmd', 'json')).toContain('.json');
    expect(generateOutputPath('/a/b.qmd', 'qmd')).toContain('.qmd');
  });
});

describe('Email Formatter', () => {
  const assignment = {
    title: 'Assignment 1',
    sourceFile: 'assignments/assignment1.qmd'
  };

  it('should return subject and body', () => {
    const result = formatSolutionAsEmail(assignment, SAMPLE_SOLUTION);
    expect(result.subject).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('should include course code in subject', () => {
    const result = formatSolutionAsEmail(assignment, SAMPLE_SOLUTION, { courseCode: 'STAT 545' });
    expect(result.subject).toBe('[STAT 545] Solution Key: Assignment 1: Basics of Experimental Design');
  });

  it('should handle missing course code', () => {
    const result = formatSolutionAsEmail(assignment, SAMPLE_SOLUTION);
    expect(result.subject).toBe('Solution Key: Assignment 1: Basics of Experimental Design');
  });

  it('should include confidentiality warning in body', () => {
    const result = formatSolutionAsEmail(assignment, SAMPLE_SOLUTION);
    expect(result.body).toContain('CONFIDENTIAL');
    expect(result.body).toContain('Do not distribute to students');
  });

  it('should include problem count in body', () => {
    const result = formatSolutionAsEmail(assignment, SAMPLE_SOLUTION);
    expect(result.body).toContain('Problems: 2');
  });

  it('should include solution content in body', () => {
    const result = formatSolutionAsEmail(assignment, SAMPLE_SOLUTION);
    expect(result.body).toContain('Step 1:');
    expect(result.body).toContain('aov(Y ~ Trt');
  });
});

describe('Conversational Generator', () => {
  it('should build prompt from .qmd file', () => {
    const result = buildConversationalPrompt(
      join(tmpDir, 'assignments', 'assignment1.qmd'),
      { includeCode: true }
    );

    expect(result.prompt).toContain('Assignment 1');
    expect(result.assignment.problems.length).toBe(2);
  });

  it('should build prompt from .json file', () => {
    const result = buildConversationalPrompt(
      join(tmpDir, 'assignments', 'hw3.json'),
      { includeCode: false }
    );

    expect(result.prompt).toContain('Contrasts');
  });

  it('should process valid solution content', () => {
    const assignment = { title: 'Test', sourceFile: 'test.qmd' };
    const content = JSON.stringify(SAMPLE_SOLUTION);
    const processed = processGeneratedSolution(content, assignment);

    expect(processed.solutions).toBeDefined();
    expect(processed.metadata.generator).toBe('scholar-solution-conversational');
  });

  it('should process solution object directly', () => {
    const assignment = { title: 'Test', sourceFile: 'test.qmd' };
    const processed = processGeneratedSolution(SAMPLE_SOLUTION, assignment);

    expect(processed.assignment_title).toBe('Assignment 1: Basics of Experimental Design');
  });

  it('should reject missing solutions object', () => {
    const assignment = { title: 'Test', sourceFile: 'test.qmd' };
    expect(() => processGeneratedSolution({}, assignment)).toThrow('missing "solutions"');
  });

  it('should reject empty solutions', () => {
    const assignment = { title: 'Test', sourceFile: 'test.qmd' };
    expect(() => processGeneratedSolution({ solutions: {} }, assignment)).toThrow('No solutions');
  });
});
