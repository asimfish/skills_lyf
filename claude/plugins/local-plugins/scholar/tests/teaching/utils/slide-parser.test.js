/**
 * Unit Tests: Slide Deck Parser
 *
 * Covers slide parsing, type classification (CSS, heading, heuristic),
 * CSS class extraction, metadata detection, and filter utilities.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  parseSlides,
  parseSlidesFromContent,
  parseSlidesFromFile,
  extractCssClasses,
  filterByType,
  filterByRange,
  filterBySection,
  getSlideSummary,
} from '../../../src/teaching/utils/slide-parser.js';

import { parseQmdContent } from '../../../src/teaching/utils/qmd-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────

const SIMPLE_DECK = `---
title: "Planned Comparisons"
format: revealjs
---

## Learning Objectives

- Understand contrast coefficients
- Apply planned comparisons

## What Are Contrasts?

Contrasts let us test specific hypotheses.

$H_0: \\psi = 0$

## Worked Example: Contrast Coefficients

\`\`\`{r}
#| echo: true
contrasts <- c(-1, 0.5, 0.5)
\`\`\`

## Practice: Your Turn

Try computing contrasts for a 4-group design.

## Summary

Key takeaways from today's lecture.`;

const DECK_WITH_SECTIONS = `---
title: "ANOVA"
format: revealjs
---

# Introduction

## Course Overview {.section-slide}

Welcome to the course.

## Goals

Learn ANOVA.

# Main Content

## One-Way ANOVA

Compare group means.

## Two-Way ANOVA {.example-slide}

Interaction effects.

# Wrap-Up

## Recap

Review what we learned.`;

const DECK_WITH_CLASSES = `---
title: "Quiz Deck"
format: revealjs
---

## Warm-Up {.quiz-question}

What is 2+2?

- [ ] 3
- [x] 4 {.correct}
- [ ] 5 {.incorrect}

## Key Concept {.definition-slide .small-slide}

::: {.callout-important}
A p-value is the probability of observing data as extreme as what was observed.
:::

## Proof of CLT {.theorem-slide}

The central limit theorem states...

## Group Activity {.discussion-slide}

Discuss with your neighbor.

## Review {.summary-slide}

Main points from today.

## Hands-On {.practice-slide}

Complete the worksheet.`;

// ─────────────────────────────────────────────────────────────
// 1. parseSlides basic (~8 tests)
// ─────────────────────────────────────────────────────────────

describe('parseSlides() basic', () => {
  it('should parse a simple 5-slide deck', () => {
    const parsed = parseQmdContent(SIMPLE_DECK);
    const slides = parseSlides(parsed);
    expect(slides.length).toBe(5);
  });

  it('should number slides sequentially 1 through N', () => {
    const parsed = parseQmdContent(SIMPLE_DECK);
    const slides = parseSlides(parsed);
    expect(slides.map(s => s.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should assign correct titles to each slide', () => {
    const parsed = parseQmdContent(SIMPLE_DECK);
    const slides = parseSlides(parsed);
    expect(slides[0].title).toBe('Learning Objectives');
    expect(slides[1].title).toBe('What Are Contrasts?');
    expect(slides[2].title).toBe('Worked Example: Contrast Coefficients');
    expect(slides[3].title).toBe('Practice: Your Turn');
    expect(slides[4].title).toBe('Summary');
  });

  it('should return empty array for empty document', () => {
    const parsed = parseQmdContent('');
    const slides = parseSlides(parsed);
    expect(slides).toEqual([]);
  });

  it('should return empty array for document with only frontmatter', () => {
    const parsed = parseQmdContent('---\ntitle: "Empty"\nformat: revealjs\n---\n');
    const slides = parseSlides(parsed);
    expect(slides).toEqual([]);
  });

  it('should parse a single-slide deck', () => {
    const doc = '---\ntitle: test\n---\n\n## Only Slide\n\nSome content here.';
    const parsed = parseQmdContent(doc);
    const slides = parseSlides(parsed);
    expect(slides.length).toBe(1);
    expect(slides[0].number).toBe(1);
    expect(slides[0].title).toBe('Only Slide');
  });

  it('should ignore preamble content before first ## heading', () => {
    const doc = '---\ntitle: test\n---\n\nThis is preamble text.\n\n## First Slide\n\nContent.';
    const parsed = parseQmdContent(doc);
    const slides = parseSlides(parsed);
    expect(slides.length).toBe(1);
    expect(slides[0].title).toBe('First Slide');
  });

  it('should handle slide with empty title (bare ## is absorbed by parser)', () => {
    // QMD parser treats bare `## ` (no text) as an empty heading that gets merged
    // into the prior content — only slides with actual heading text are parsed
    const doc = '## \n\nContent for untitled slide.\n\n## Normal Slide\n\nRegular content.';
    const { slides } = parseSlidesFromContent(doc);
    // Only the "Normal Slide" is parsed as a valid slide
    expect(slides.length).toBe(1);
    expect(slides[0].title).toBe('Normal Slide');
  });

  it('should handle slide with only CSS class, no title text', () => {
    const doc = '## {.quiz-question}\n\nWhat is 2+2?\n\n- [x] 4 {.correct}';
    const { slides } = parseSlidesFromContent(doc);
    expect(slides.length).toBe(1);
    expect(slides[0].type).toBe('quiz');
    expect(slides[0].classes).toContain('quiz-question');
  });

  it('should not treat ### subsections as separate slides', () => {
    const doc = `## Main Slide

Some content.

### Sub-heading

More content under sub-heading.

## Second Slide

Done.`;
    const parsed = parseQmdContent(doc);
    const slides = parseSlides(parsed);
    expect(slides.length).toBe(2);
    expect(slides[0].title).toBe('Main Slide');
    expect(slides[1].title).toBe('Second Slide');
    // Subsection content should be part of first slide's body
    expect(slides[0].content).toContain('Sub-heading');
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Type classification from CSS (~6 tests)
// ─────────────────────────────────────────────────────────────

describe('Type classification from CSS classes', () => {
  it('should classify {.quiz-question} as quiz', () => {
    const { slides } = parseSlidesFromContent(
      '## Question 1 {.quiz-question}\n\nWhat is 2+2?'
    );
    expect(slides[0].type).toBe('quiz');
  });

  it('should classify {.section-slide} as title', () => {
    const { slides } = parseSlidesFromContent(
      '## Chapter 1 {.section-slide}\n\nIntroduction.'
    );
    expect(slides[0].type).toBe('title');
  });

  it('should classify {.practice-slide} as practice', () => {
    const { slides } = parseSlidesFromContent(
      '## Exercise {.practice-slide}\n\nTry this.'
    );
    expect(slides[0].type).toBe('practice');
  });

  it('should classify {.example-slide} as example', () => {
    const { slides } = parseSlidesFromContent(
      '## Demo {.example-slide}\n\nHere is a worked problem.'
    );
    expect(slides[0].type).toBe('example');
  });

  it('should pick correct type from multiple classes', () => {
    const { slides } = parseSlidesFromContent(
      '## Question {.small-slide .quiz-question}\n\nWhat?'
    );
    expect(slides[0].type).toBe('quiz');
    expect(slides[0].classes).toContain('small-slide');
    expect(slides[0].classes).toContain('quiz-question');
  });

  it('should fall through to next cascade when class is unknown', () => {
    // {.small-slide} is not in CSS_TYPE_MAP, so heading pattern should match
    const { slides } = parseSlidesFromContent(
      '## Summary {.small-slide}\n\nKey points.'
    );
    // Falls through CSS → heading pattern matches "Summary"
    expect(slides[0].type).toBe('summary');
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Type classification from headings (~6 tests)
// ─────────────────────────────────────────────────────────────

describe('Type classification from heading patterns', () => {
  it('should classify "Quiz: ..." as quiz', () => {
    const { slides } = parseSlidesFromContent(
      '## Quiz: Hypothesis Testing\n\nChoose the correct answer.'
    );
    expect(slides[0].type).toBe('quiz');
  });

  it('should classify "Example: ..." as example', () => {
    const { slides } = parseSlidesFromContent(
      '## Example: Linear Regression\n\nFit the model.'
    );
    expect(slides[0].type).toBe('example');
  });

  it('should classify "Practice: ..." as practice', () => {
    const { slides } = parseSlidesFromContent(
      '## Practice: ANOVA Table\n\nFill in the blanks.'
    );
    expect(slides[0].type).toBe('practice');
  });

  it('should classify "Summary" (standalone) as summary', () => {
    const { slides } = parseSlidesFromContent(
      '## Summary\n\nToday we learned about contrasts.'
    );
    expect(slides[0].type).toBe('summary');
  });

  it('should classify "Learning Objectives" as objectives', () => {
    const { slides } = parseSlidesFromContent(
      '## Learning Objectives\n\n- Understand ANOVA\n- Apply contrasts'
    );
    expect(slides[0].type).toBe('objectives');
  });

  it('should classify "Definition: ..." as definition', () => {
    const { slides } = parseSlidesFromContent(
      '## Definition: P-Value\n\nA p-value is...'
    );
    expect(slides[0].type).toBe('definition');
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Type classification from heuristics (~5 tests)
// ─────────────────────────────────────────────────────────────

describe('Type classification from content heuristics', () => {
  it('should classify slide with {.correct} marker as quiz', () => {
    const { slides } = parseSlidesFromContent(
      '## Check Understanding\n\n- Option A {.incorrect}\n- Option B {.correct}'
    );
    expect(slides[0].type).toBe('quiz');
  });

  it('should classify slide with {.callout-important} as definition', () => {
    const { slides } = parseSlidesFromContent(
      '## Key Concept\n\n::: {.callout-important}\nVariance is the average squared deviation.\n:::'
    );
    expect(slides[0].type).toBe('definition');
  });

  it('should classify first slide with short body as title', () => {
    const { slides } = parseSlidesFromContent(
      '## STAT 101\n\nDr. Smith\nSpring 2026'
    );
    expect(slides[0].type).toBe('title');
  });

  it('should classify slide with R code + echo:true as example', () => {
    const doc = `## Computing Means

\`\`\`{r}
#| echo: true
mean(c(1, 2, 3))
\`\`\``;
    const { slides } = parseSlidesFromContent(doc);
    expect(slides[0].type).toBe('example');
  });

  it('should default to content when no heuristic matches', () => {
    const doc = `## Some Random Slide\n\n## Another One\n\nJust regular content with no special markers.`;
    const { slides } = parseSlidesFromContent(doc);
    // Second slide: not first (so no title heuristic), no special markers
    expect(slides[1].type).toBe('content');
  });
});

// ─────────────────────────────────────────────────────────────
// 5. extractCssClasses (~4 tests)
// ─────────────────────────────────────────────────────────────

describe('extractCssClasses()', () => {
  it('should extract multiple classes from heading', () => {
    const classes = extractCssClasses('## Title {.small-slide .quiz-question}');
    expect(classes).toEqual(['small-slide', 'quiz-question']);
  });

  it('should return empty array when no attribute block', () => {
    const classes = extractCssClasses('## Plain Title');
    expect(classes).toEqual([]);
  });

  it('should return empty array for cross-ref ID only (no classes)', () => {
    const classes = extractCssClasses('## Title {#sec-intro}');
    expect(classes).toEqual([]);
  });

  it('should extract only classes from mixed attributes', () => {
    const classes = extractCssClasses('## Title {.a .b #sec-c}');
    expect(classes).toEqual(['a', 'b']);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Metadata detection (~4 tests)
// ─────────────────────────────────────────────────────────────

describe('Metadata detection', () => {
  it('should detect hasCode when slide contains code block', () => {
    const doc = `## Code Slide

\`\`\`r
x <- 1
\`\`\``;
    const { slides } = parseSlidesFromContent(doc);
    expect(slides[0].hasCode).toBe(true);
  });

  it('should set hasCode to false when no code block', () => {
    const { slides } = parseSlidesFromContent(
      '## Text Slide\n\nJust regular text content.'
    );
    expect(slides[0].hasCode).toBe(false);
  });

  it('should detect hasMath for inline and display math', () => {
    const doc = `## Math Slide

The formula is $\\bar{x} = \\frac{1}{n}\\sum x_i$.

$$
S^2 = \\frac{\\sum (x_i - \\bar{x})^2}{n-1}
$$`;
    const { slides } = parseSlidesFromContent(doc);
    expect(slides[0].hasMath).toBe(true);
  });

  it('should not detect math when $ is only inside code blocks', () => {
    const doc = `## Shell Slide

\`\`\`bash
echo $HOME
price=$10
\`\`\``;
    const { slides } = parseSlidesFromContent(doc);
    expect(slides[0].hasMath).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. Filter functions (~5 tests)
// ─────────────────────────────────────────────────────────────

describe('Filter functions', () => {
  let slides;

  beforeEach(() => {
    const result = parseSlidesFromContent(SIMPLE_DECK);
    slides = result.slides;
  });

  it('filterByType should return only matching slides', () => {
    const examples = filterByType(slides, 'example');
    expect(examples.length).toBeGreaterThan(0);
    for (const s of examples) {
      expect(s.type).toBe('example');
    }
  });

  it('filterByRange should return slides in range (inclusive)', () => {
    const ranged = filterByRange(slides, 2, 4);
    expect(ranged.length).toBe(3);
    expect(ranged[0].number).toBe(2);
    expect(ranged[2].number).toBe(4);
  });

  it('filterByRange should handle out-of-bounds gracefully', () => {
    const ranged = filterByRange(slides, 10, 20);
    expect(ranged).toEqual([]);
  });

  it('filterBySection should match section title with fuzzy matching', () => {
    // In DECK_WITH_SECTIONS, slides under "# Main Content" have sectionTitle = "Main Content"
    const parsed = parseQmdContent(DECK_WITH_SECTIONS);
    const sectionSlides = parseSlides(parsed);
    const matched = filterBySection(sectionSlides, 'Main Content');
    expect(matched.length).toBe(2);
    expect(matched[0].title).toBe('One-Way ANOVA');
    expect(matched[1].title).toBe('Two-Way ANOVA');
  });

  it('getSlideSummary should return correct total and type counts', () => {
    const summary = getSlideSummary(slides);
    expect(summary.total).toBe(5);
    expect(typeof summary.byType).toBe('object');
    // Sum of all type counts should equal total
    const sum = Object.values(summary.byType).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.total);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. Line range mapping (~2 tests)
// ─────────────────────────────────────────────────────────────

describe('Line range mapping', () => {
  it('should assign correct startLine and endLine for each slide', () => {
    const doc = `## Slide One

Content 1.

## Slide Two

Content 2.

## Slide Three

Content 3.`;
    const { slides } = parseSlidesFromContent(doc);
    expect(slides.length).toBe(3);

    // First slide starts at line 0
    expect(slides[0].startLine).toBe(0);
    // Second slide starts after first
    expect(slides[1].startLine).toBeGreaterThan(slides[0].startLine);
    // Third slide starts after second
    expect(slides[2].startLine).toBeGreaterThan(slides[1].startLine);

    // Each slide's endLine should be the next slide's startLine (or doc end)
    expect(slides[0].endLine).toBe(slides[1].startLine);
    expect(slides[1].endLine).toBe(slides[2].startLine);
  });

  it('should set last slide endLine to total number of lines', () => {
    const doc = `## First

Content.

## Last

Final content.`;
    const parsed = parseQmdContent(doc);
    const slides = parseSlides(parsed);
    expect(slides[slides.length - 1].endLine).toBe(parsed.lines.length);
  });
});

// ─────────────────────────────────────────────────────────────
// 9. Section title grouping
// ─────────────────────────────────────────────────────────────

describe('Section title grouping', () => {
  it('should assign parent # section title as sectionTitle', () => {
    const parsed = parseQmdContent(DECK_WITH_SECTIONS);
    const slides = parseSlides(parsed);

    // Slides under "# Introduction" should have sectionTitle "Introduction"
    const overview = slides.find(s => s.title === 'Course Overview');
    expect(overview.sectionTitle).toBe('Introduction');

    // Slides under "# Main Content"
    const anova = slides.find(s => s.title === 'One-Way ANOVA');
    expect(anova.sectionTitle).toBe('Main Content');
  });

  it('should use own title when no parent # section exists', () => {
    const doc = '## Standalone Slide\n\nNo parent section.';
    const { slides } = parseSlidesFromContent(doc);
    expect(slides[0].sectionTitle).toBe('Standalone Slide');
  });
});

// ─────────────────────────────────────────────────────────────
// 10. parseSlidesFromContent and parseSlidesFromFile
// ─────────────────────────────────────────────────────────────

describe('parseSlidesFromContent()', () => {
  it('should return both slides and parsed QMD', () => {
    const result = parseSlidesFromContent(SIMPLE_DECK);
    expect(Array.isArray(result.slides)).toBe(true);
    expect(result.parsed).toBeDefined();
    expect(result.parsed.frontmatter).toContain('Planned Comparisons');
  });
});

describe('parseSlidesFromFile()', () => {
  const tmpDir = join(__dirname, '../../../test-output-slide-parser');
  const tmpFile = join(tmpDir, 'test-slides.qmd');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should parse a slide deck from disk', () => {
    writeFileSync(tmpFile, SIMPLE_DECK, 'utf-8');
    const result = parseSlidesFromFile(tmpFile);
    expect(result.slides.length).toBe(5);
    expect(result.parsed.frontmatter).toContain('Planned Comparisons');
  });

  it('should throw for nonexistent file', () => {
    expect(() => parseSlidesFromFile('/nonexistent/slides.qmd')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 11. CSS class deck integration
// ─────────────────────────────────────────────────────────────

describe('Full deck with CSS classes', () => {
  it('should classify all CSS-tagged slides correctly', () => {
    const { slides } = parseSlidesFromContent(DECK_WITH_CLASSES);

    const typeMap = {};
    for (const s of slides) {
      typeMap[s.title] = s.type;
    }

    expect(typeMap['Warm-Up']).toBe('quiz');
    expect(typeMap['Key Concept']).toBe('definition');
    expect(typeMap['Proof of CLT']).toBe('theorem');
    expect(typeMap['Group Activity']).toBe('discussion');
    expect(typeMap['Review']).toBe('summary');
    expect(typeMap['Hands-On']).toBe('practice');
  });
});

// ─────────────────────────────────────────────────────────────
// 12. Heading ID (cross-ref) passthrough
// ─────────────────────────────────────────────────────────────

describe('Heading ID passthrough', () => {
  it('should capture headingId from {#sec-...} attribute', () => {
    const doc = '## Introduction {#sec-intro}\n\nContent.';
    const { slides } = parseSlidesFromContent(doc);
    expect(slides[0].headingId).toBe('sec-intro');
  });

  it('should return empty string when no headingId', () => {
    const { slides } = parseSlidesFromContent('## No ID\n\nContent.');
    expect(slides[0].headingId).toBe('');
  });
});
