/**
 * E2E Tests: Lecture Output Pipeline
 *
 * Tests the end-to-end flow:
 * 1. Generate lecture → verify output file structure
 * 2. Refine section → verify updated content
 * 3. Refine full → verify structure preserved
 * 4. Check coverage → verify report
 *
 * These tests use real file I/O but mock the AI provider
 * (no API calls). All temp files are cleaned up.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { parseQmdContent, parseQmdFile, matchSection, flattenSections, replaceSection, appendRefinementRecord, extractProvenance } from '../../src/teaching/utils/qmd-parser.js';
import { generateLectureFilename } from '../../src/teaching/utils/slugify.js';
import { generateProvenanceComments } from '../../src/teaching/formatters/quarto-notes.js';
import { extractKeywords, findMatchingSections, formatCoverageReport } from '../../src/teaching/validators/lecture-coverage.js';
import { buildSectionRefinePrompt, buildFullRefinePrompt } from '../../src/teaching/generators/lecture-refiner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// E2E: Generate → Parse → Verify Structure
// ─────────────────────────────────────────────────────────────

describe('E2E: Lecture file round-trip', () => {
  const tmpDir = join(__dirname, '../../test-output-e2e');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should generate a valid QMD file with provenance that round-trips through parser', () => {
    // Step 1: Build a lecture QMD file with provenance metadata
    const provenance = {
      generated: '2026-01-28T10:00:00.000Z',
      scholar_version: '2.5.0',
      prompt_template: 'lecture-notes',
      config_source: '.flow/teach-config.yml',
      lesson_plan: 'week08',
      teaching_style: 'formal / active-learning',
      generation_time: '45.2s',
      sections: 6
    };

    const comments = generateProvenanceComments(provenance);
    const frontmatter = `---
title: "Randomized Complete Block Design (RCBD)"
subtitle: "STAT 440 — Week 8"
author: "Dr. Smith"
format:
  html:
    toc: true
  pdf: default
${comments}
---`;

    const body = `
## Introduction {#sec-intro}

This lecture covers the Randomized Complete Block Design (RCBD), a fundamental experimental design that controls for a known source of variability.

## Core Concepts {#sec-concepts}

### Blocking

Blocking is a technique to reduce the effect of nuisance variables on the treatment comparison.

### The RCBD Model

$$Y_{ij} = \\mu + \\tau_i + \\beta_j + \\epsilon_{ij}$$

## Worked Example {#sec-example}

\`\`\`{r}
#| label: rcbd-analysis
library(tidyverse)
data <- tibble(
  block = rep(1:4, each = 3),
  treatment = rep(c("A", "B", "C"), 4),
  yield = c(73, 68, 74, 71, 67, 72, 75, 69, 78, 72, 68, 75)
)

model <- aov(yield ~ factor(treatment) + factor(block), data = data)
summary(model)
\`\`\`

## Practice Problems {#sec-practice}

1. Given a dataset with 5 treatments and 4 blocks, set up the ANOVA table.
2. Test the hypothesis that all treatment means are equal.

## Summary {#sec-summary}

Key takeaways from this lecture on RCBD.
`;

    const fullQmd = frontmatter + '\n' + body;
    const filename = generateLectureFilename({ topic: 'RCBD', fromPlan: 'week08' });
    const filePath = join(tmpDir, filename);
    writeFileSync(filePath, fullQmd, 'utf-8');

    // Step 2: Verify file was written correctly
    expect(existsSync(filePath)).toBe(true);
    expect(filename).toBe('week08-rcbd.qmd');

    // Step 3: Parse the file
    const parsed = parseQmdFile(filePath);

    // Verify frontmatter
    expect(parsed.frontmatter).toContain('title: "Randomized Complete Block Design');
    expect(parsed.frontmatter).toContain('# --- Scholar Generation Metadata ---');
    expect(parsed.frontmatter).toContain('# scholar_version: 2.5.0');

    // Verify sections
    expect(parsed.sections.length).toBe(5); // Introduction, Core Concepts, Worked Example, Practice, Summary
    expect(parsed.sections[0].title).toBe('Introduction');
    expect(parsed.sections[0].headingId).toBe('sec-intro');

    // Verify subsections
    const flat = flattenSections(parsed.sections);
    expect(flat.length).toBe(7); // 5 top + 2 subsections under Core Concepts

    // Verify code blocks are NOT parsed as headings
    const titles = flat.map(s => s.title);
    expect(titles).not.toContain('| label: rcbd-analysis');

    // Step 4: Extract provenance
    const prov = extractProvenance(parsed.frontmatter);
    expect(prov).not.toBeNull();
    expect(prov.generated).toBe('2026-01-28T10:00:00.000Z');
    expect(prov.scholar_version).toBe('2.5.0');
  });

  it('should support section match → replace → verify round-trip', () => {
    const qmd = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-01-01
# ---
---

## Introduction

Old intro content.

## Methods

Old methods content.

## Results

Old results content.
`;
    const filePath = join(tmpDir, 'roundtrip.qmd');
    writeFileSync(filePath, qmd, 'utf-8');

    // Parse
    const parsed = parseQmdFile(filePath);
    expect(parsed.sections.length).toBe(3);

    // Match section
    const matched = matchSection(parsed.sections, 'Methods');
    expect(matched).not.toBeNull();
    expect(matched.title).toBe('Methods');

    // Replace section
    const newContent = '## Methods\n\nUpdated methods with new approach.\n\nUsing tidyverse throughout.';
    const updated = replaceSection(parsed.lines, matched, newContent);

    // Write back
    writeFileSync(filePath, updated, 'utf-8');

    // Re-parse and verify
    const reparsed = parseQmdFile(filePath);
    expect(reparsed.sections.length).toBe(3);
    const methodsSection = reparsed.sections.find(s => s.title === 'Methods');
    expect(methodsSection.body).toContain('Updated methods with new approach');
    expect(methodsSection.body).toContain('tidyverse');

    // Other sections preserved
    expect(reparsed.sections.find(s => s.title === 'Introduction').body).toContain('Old intro');
    expect(reparsed.sections.find(s => s.title === 'Results').body).toContain('Old results');
  });

  it('should support provenance append round-trip', () => {
    const qmd = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-01-01
# scholar_version: 2.5.0
# ---
---

## Section

Content.
`;
    const filePath = join(tmpDir, 'provenance-roundtrip.qmd');
    writeFileSync(filePath, qmd, 'utf-8');

    // Parse
    const parsed = parseQmdFile(filePath);

    // Append refinement record
    let fm = parsed.frontmatter;
    fm = appendRefinementRecord(fm, 'Section', '2026-01-15T10:00:00.000Z');
    fm = appendRefinementRecord(fm, 'full', '2026-01-16T14:30:00.000Z');

    // Write back with updated frontmatter
    const updatedQmd = '---\n' + fm + '\n---\n\n## Section\n\nContent.\n';
    writeFileSync(filePath, updatedQmd, 'utf-8');

    // Re-parse and verify
    const reparsed = parseQmdFile(filePath);
    const prov = extractProvenance(reparsed.frontmatter);
    expect(prov).not.toBeNull();
    expect(prov.generated).toBe('2026-01-01');

    // Verify refinement records
    expect(reparsed.frontmatter).toContain('# refined: "Section" on 2026-01-15');
    expect(reparsed.frontmatter).toContain('# refined: full lecture on 2026-01-16');
  });
});

// ─────────────────────────────────────────────────────────────
// E2E: Coverage validation pipeline
// ─────────────────────────────────────────────────────────────

describe('E2E: Coverage validation pipeline', () => {
  it('should validate coverage end-to-end using keyword matching', () => {
    // Simulate: lesson plan objectives + lecture sections
    const objectives = [
      'Understand the assumptions of ANOVA',
      'Apply F-test for testing treatment effects',
      'Interpret interaction effects in two-way ANOVA'
    ];

    const lectureContent = `
## Introduction to ANOVA

Analysis of Variance (ANOVA) is used for testing treatment effects across groups.

## ANOVA Assumptions

The assumptions include normality, equal variances, and independence of observations.

## The F-test

The F-test compares between-group variance to within-group variance for testing treatment effects.

## Summary

Key concepts from ANOVA analysis.
`;

    // Parse lecture
    const parsed = parseQmdContent(lectureContent);
    const allSections = flattenSections(parsed.sections);
    const sectionContents = allSections.map(s => ({
      title: s.title,
      slug: s.slug,
      searchText: (s.title + ' ' + s.body).toLowerCase()
    }));

    // Check each objective
    const results = objectives.map(obj => {
      const keywords = extractKeywords(obj);
      const foundIn = findMatchingSections(keywords, sectionContents);
      return { description: obj, covered: foundIn.length > 0, foundIn };
    });

    // Objective 1: "assumptions" + "anova" → should match ANOVA Assumptions section
    expect(results[0].covered).toBe(true);
    expect(results[0].foundIn).toContain('ANOVA Assumptions');

    // Objective 2: "test" + "treatment" + "effects" → should match F-test section
    expect(results[1].covered).toBe(true);

    // Objective 3: "interaction" + "effects" + "two-way" + "anova" → may not match
    // (no section discusses interaction effects)
    // This is a legitimate gap
    expect(results[2].covered).toBe(false);

    // Format report
    const report = {
      lectureFile: 'test.qmd',
      lessonPlan: 'week08.yml',
      coveragePercent: Math.round((2 / 3) * 100),
      objectives: results.map((r, i) => ({
        id: `LO-8.${i + 1}`,
        description: r.description,
        covered: r.covered,
        foundInSections: r.foundIn
      })),
      topics: [],
      gaps: results.filter(r => !r.covered).map(r => r.description)
    };

    const formatted = formatCoverageReport(report);
    expect(formatted).toContain('Coverage: 2/3 (67%)');
    expect(formatted).toContain('1 gap(s) found');
    expect(formatted).toContain('[x] LO-8.1');
    expect(formatted).toContain('[ ] LO-8.3');
  });
});

// ─────────────────────────────────────────────────────────────
// E2E: Refine prompt building pipeline
// ─────────────────────────────────────────────────────────────

describe('E2E: Refinement prompt pipeline', () => {
  it('should build section refine prompt from parsed document', () => {
    const doc = `---
title: "Test"
---

## Introduction

Original intro.

## Core Concepts

The main concepts of regression analysis include residuals, leverage, and influence.

## Worked Examples

Example 1: Fitting a model.
`;
    const parsed = parseQmdContent(doc);
    const matched = matchSection(parsed.sections, 'Core Concepts');
    expect(matched).not.toBeNull();

    // Get context
    const flat = flattenSections(parsed.sections);
    const idx = flat.findIndex(s => s.startLine === matched.startLine);
    const prev = idx > 0 ? flat[idx - 1] : null;
    const next = idx < flat.length - 1 ? flat[idx + 1] : null;

    const prompt = buildSectionRefinePrompt(
      matched,
      'Add Cook\'s distance and DFFITS',
      prev,
      next
    );

    expect(prompt).toContain('Core Concepts');
    expect(prompt).toContain('Add Cook\'s distance and DFFITS');
    expect(prompt).toContain('regression analysis');
    expect(prompt).toContain('Previous Section');
    expect(prompt).toContain('Introduction');
    expect(prompt).toContain('Next Section');
    expect(prompt).toContain('Worked Examples');
  });

  it('should build full refine prompt from parsed document', () => {
    const doc = `---
title: "Test"
---

## Section A

Content A.

## Section B

Content B.
`;
    const parsed = parseQmdContent(doc);
    const prompt = buildFullRefinePrompt(parsed, 'Use Python instead of R');

    expect(prompt).toContain('Section A');
    expect(prompt).toContain('Section B');
    expect(prompt).toContain('Use Python instead of R');
    expect(prompt).toContain('global refinement');
    // Body is included, frontmatter is not
    expect(prompt).toContain('Content A');
    expect(prompt).not.toContain('title: "Test"');
  });
});

// ─────────────────────────────────────────────────────────────
// E2E: Filename + slugify pipeline
// ─────────────────────────────────────────────────────────────

describe('E2E: Filename generation pipeline', () => {
  it('should produce correct filenames from various topic inputs', () => {
    const cases = [
      { topic: 'Multiple Regression', fromPlan: 'week05', expected: 'week05-multiple-regression.qmd' },
      { topic: 'ANOVA (One-Way)', expected: 'lecture-anova-one-way.qmd' },
      { topic: 'Week 3: RCBD', fromPlan: 'week03', expected: 'week03-week-3-rcbd.qmd' },
      { topic: 'Chi² Test', expected: 'lecture-chi-test.qmd' },
      { topic: '', fromPlan: 'week01', expected: 'week01-week01.qmd' },
    ];

    for (const { topic, fromPlan, expected } of cases) {
      const result = generateLectureFilename({ topic, fromPlan });
      expect(result).toBe(expected);
    }
  });

  it('should handle topic slugs in section matching', () => {
    const doc = `## Multiple Regression\n\n## ANOVA\n\n## Chi-Square Test`;
    const parsed = parseQmdContent(doc);

    // Slugify matches
    expect(matchSection(parsed.sections, 'multiple-regression').title).toBe('Multiple Regression');
    expect(matchSection(parsed.sections, 'ANOVA').title).toBe('ANOVA');
    expect(matchSection(parsed.sections, 'chi-square-test').title).toBe('Chi-Square Test');
    // Fuzzy match
    expect(matchSection(parsed.sections, 'Chi Square').title).toBe('Chi-Square Test');
  });
});
