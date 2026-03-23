/**
 * Unit Tests: Slide Refiner
 *
 * Tests slide revision logic including target resolution, range parsing,
 * context building, prompt construction, integration (no-AI fallback),
 * error handling, and dry-run mode.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  reviseSlides,
  resolveTargets,
  parseSlideRange,
  buildContext,
  buildSlideRevisionPrompt,
  buildFullDeckRevisionPrompt
} from '../../../src/teaching/generators/slide-refiner.js';

import { parseSlidesFromContent } from '../../../src/teaching/utils/slide-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Sample slide deck fixtures
// ─────────────────────────────────────────────────────────────

const SAMPLE_DECK = `---
title: "ANOVA Lecture"
format: revealjs
# --- Scholar Generation Metadata ---
# generated: 2026-02-01
# ---
---

# Introduction

## Course Overview {.section-slide}

Welcome to the ANOVA lecture.

## Learning Objectives

- Understand one-way ANOVA
- Conduct F-tests
- Interpret results

# Methods

## One-Way ANOVA

The one-way ANOVA tests differences between group means.

$$F = \\frac{MS_{between}}{MS_{within}}$$

## Example: Plant Growth

\`\`\`{r}
#| echo: true
aov_model <- aov(weight ~ group, data = PlantGrowth)
summary(aov_model)
\`\`\`

## Practice: Your Turn

Try running an ANOVA on the iris dataset.

## Quiz: F-Test {.quiz-question}

What does a large F-statistic indicate?

- [ ] No difference {.incorrect}
- [x] At least one group differs {.correct}
- [ ] All groups differ {.incorrect}

# Wrap-Up

## Summary

Key takeaways from today's lecture.

## Questions

Any questions?`;

const SMALL_DECK = `---
title: "Small Deck"
format: revealjs
# --- Scholar Generation Metadata ---
# generated: 2026-02-01
# ---
---

## Slide One

Content for slide one.

## Slide Two

Content for slide two.

## Slide Three

Content for slide three.`;

// Generate a large deck (>= 30 slides) for context strategy testing
function makeLargeDeck(count) {
  let deck = `---
title: "Large Deck"
format: revealjs
# --- Scholar Generation Metadata ---
# generated: 2026-02-01
# ---
---

`;
  for (let i = 1; i <= count; i++) {
    deck += `## Slide ${i}\n\nContent for slide ${i}.\n\n`;
  }
  return deck;
}

// ─────────────────────────────────────────────────────────────
// 1. resolveTargets (~8 tests)
// ─────────────────────────────────────────────────────────────

describe('resolveTargets()', () => {
  let slides;

  beforeEach(() => {
    const result = parseSlidesFromContent(SAMPLE_DECK);
    slides = result.slides;
  });

  it('should return slides matching --section "Methods"', () => {
    const targets = resolveTargets(slides, { section: 'Methods' });
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) {
      expect(t.sectionTitle).toBe('Methods');
    }
  });

  it('should throw descriptive error for --section "Nonexistent"', () => {
    expect(() => resolveTargets(slides, { section: 'Nonexistent' }))
      .toThrow(/No slides found in section "Nonexistent"/);
  });

  it('should return slides in range with --slides "3-5"', () => {
    const targets = resolveTargets(slides, { slides: '3-5' });
    expect(targets.length).toBe(3);
    expect(targets[0].number).toBe(3);
    expect(targets[1].number).toBe(4);
    expect(targets[2].number).toBe(5);
  });

  it('should return single slide with --slides "2"', () => {
    const targets = resolveTargets(slides, { slides: '2' });
    expect(targets.length).toBe(1);
    expect(targets[0].number).toBe(2);
  });

  it('should return only quiz slides with --type quiz', () => {
    const targets = resolveTargets(slides, { type: 'quiz' });
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) {
      expect(t.type).toBe('quiz');
    }
  });

  it('should return all slides when no targets specified', () => {
    const targets = resolveTargets(slides, {});
    expect(targets.length).toBe(slides.length);
  });

  it('should narrow with combined --section + --type', () => {
    // Methods section has content, example, practice, quiz types
    const targets = resolveTargets(slides, { section: 'Methods', type: 'quiz' });
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) {
      expect(t.sectionTitle).toBe('Methods');
      expect(t.type).toBe('quiz');
    }
  });

  it('should throw when combined filters produce empty result', () => {
    // Methods section has no summary slides
    expect(() => resolveTargets(slides, { section: 'Methods', type: 'summary' }))
      .toThrow(/No slides of type "summary" found/);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. parseSlideRange (~5 tests)
// ─────────────────────────────────────────────────────────────

describe('parseSlideRange()', () => {
  it('should parse "5-12" into { start: 5, end: 12 }', () => {
    const range = parseSlideRange('5-12');
    expect(range).toEqual({ start: 5, end: 12 });
  });

  it('should parse "5" into { start: 5, end: 5 }', () => {
    const range = parseSlideRange('5');
    expect(range).toEqual({ start: 5, end: 5 });
  });

  it('should parse "5-" into { start: 5, end: Infinity }', () => {
    const range = parseSlideRange('5-');
    expect(range).toEqual({ start: 5, end: Infinity });
  });

  it('should throw for non-numeric input "abc"', () => {
    expect(() => parseSlideRange('abc'))
      .toThrow(/Invalid slide range "abc"/);
  });

  it('should throw when start > end like "12-5"', () => {
    expect(() => parseSlideRange('12-5'))
      .toThrow(/start \(12\) must not be greater than end \(5\)/);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. buildContext (~4 tests)
// ─────────────────────────────────────────────────────────────

describe('buildContext()', () => {
  it('should use "full" strategy for decks < 30 slides', () => {
    const { slides } = parseSlidesFromContent(SAMPLE_DECK);
    const targets = [slides[2], slides[3]];
    const { context, strategy } = buildContext(slides, targets);
    expect(strategy).toBe('full');
    expect(context.length).toBe(slides.length);
  });

  it('should use "targeted" strategy for decks >= 30 slides', () => {
    const largeDeck = makeLargeDeck(35);
    const { slides } = parseSlidesFromContent(largeDeck);
    const targets = [slides[14], slides[15]]; // slides 15 and 16

    const { context, strategy } = buildContext(slides, targets);
    expect(strategy).toBe('targeted');
    // Should include targets + neighbors: 14, 15, 16, 17 = 4 slides
    expect(context.length).toBeLessThan(slides.length);
    expect(context.length).toBe(4);
  });

  it('should not go out of bounds for neighbors', () => {
    const largeDeck = makeLargeDeck(35);
    const { slides } = parseSlidesFromContent(largeDeck);
    // Target first slide (no previous neighbor)
    const targets = [slides[0]];

    const { context, strategy } = buildContext(slides, targets);
    expect(strategy).toBe('targeted');
    // Should include slide 1 (target) + slide 2 (next neighbor) = 2
    expect(context.length).toBe(2);
    expect(context[0].number).toBe(1);
    expect(context[1].number).toBe(2);
  });

  it('should use "targeted" strategy for deck with exactly 30 slides (boundary)', () => {
    const deck30 = makeLargeDeck(30);
    const { slides } = parseSlidesFromContent(deck30);
    const targets = [slides[14]]; // slide 15

    const { context, strategy } = buildContext(slides, targets);
    expect(strategy).toBe('targeted');
    // Should include target + neighbors: 14, 15, 16 = 3
    expect(context.length).toBe(3);
  });

  it('should use "full" strategy for deck with 29 slides (just under boundary)', () => {
    const deck29 = makeLargeDeck(29);
    const { slides } = parseSlidesFromContent(deck29);
    const targets = [slides[14]];

    const { context, strategy } = buildContext(slides, targets);
    expect(strategy).toBe('full');
    expect(context.length).toBe(slides.length);
  });

  it('should handle target at last slide (edge case)', () => {
    const largeDeck = makeLargeDeck(35);
    const { slides } = parseSlidesFromContent(largeDeck);
    // Target last slide (no next neighbor)
    const targets = [slides[slides.length - 1]];

    const { context, strategy } = buildContext(slides, targets);
    expect(strategy).toBe('targeted');
    // Should include slide N-1 (prev neighbor) + slide N (target) = 2
    expect(context.length).toBe(2);
    expect(context[context.length - 1].number).toBe(slides.length);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Prompt building (~4 tests)
// ─────────────────────────────────────────────────────────────

describe('Prompt building', () => {
  it('buildSlideRevisionPrompt should include slide numbers and content', () => {
    const { slides } = parseSlidesFromContent(SAMPLE_DECK);
    const targets = [slides[2], slides[3]];
    const prompt = buildSlideRevisionPrompt(targets, 'Add more detail', slides, 'full');

    expect(prompt).toContain('Slide 3:');
    expect(prompt).toContain('Slide 4:');
    expect(prompt).toContain(targets[0].title);
    expect(prompt).toContain(targets[1].title);
  });

  it('buildSlideRevisionPrompt should include instruction', () => {
    const { slides } = parseSlidesFromContent(SAMPLE_DECK);
    const targets = [slides[0]];
    const prompt = buildSlideRevisionPrompt(targets, 'Use simpler language', slides, 'full');

    expect(prompt).toContain('Use simpler language');
    expect(prompt).toContain('Revision Instruction');
  });

  it('buildFullDeckRevisionPrompt should include all slides', () => {
    const { slides } = parseSlidesFromContent(SMALL_DECK);
    const prompt = buildFullDeckRevisionPrompt(slides, 'Convert to Python');

    expect(prompt).toContain('Slide One');
    expect(prompt).toContain('Slide Two');
    expect(prompt).toContain('Slide Three');
    expect(prompt).toContain('Convert to Python');
    expect(prompt).toContain('global revision');
  });

  it('buildSlideRevisionPrompt should include context slides when targeted strategy', () => {
    const largeDeck = makeLargeDeck(35);
    const { slides } = parseSlidesFromContent(largeDeck);
    const targets = [slides[14]]; // slide 15
    const { context } = buildContext(slides, targets);

    const prompt = buildSlideRevisionPrompt(targets, 'Improve content', context, 'targeted');
    expect(prompt).toContain('Context (surrounding slides for coherence)');
    // Should mention neighbor slides
    expect(prompt).toContain('Slide 14:');
    expect(prompt).toContain('Slide 16:');
  });
});

// ─────────────────────────────────────────────────────────────
// 5. reviseSlides integration (~8 tests, no-AI fallback)
// ─────────────────────────────────────────────────────────────

describe('reviseSlides() integration (no-AI fallback)', () => {
  const tmpDir = join(__dirname, '../../../test-output-slide-refiner');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should revise with --section and write updated file', async () => {
    const filePath = join(tmpDir, 'revise-section.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      section: 'Methods',
      instruction: 'Add more worked examples'
    });

    expect(result.file).toBe(filePath);
    expect(result.mode).toBe('targeted');
    expect(result.slidesAffected).toBeGreaterThan(0);

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Revision instruction: Add more worked examples');
  });

  it('should revise with --slides range and write updated file', async () => {
    const filePath = join(tmpDir, 'revise-range.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      slides: '2-4',
      instruction: 'Simplify the language'
    });

    expect(result.file).toBe(filePath);
    expect(result.mode).toBe('targeted');
    expect(result.slidesAffected).toBe(3);

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Revision instruction: Simplify the language');
  });

  it('should revise with --type and write updated file', async () => {
    const filePath = join(tmpDir, 'revise-type.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      type: 'quiz',
      instruction: 'Add a fourth answer option'
    });

    expect(result.file).toBe(filePath);
    expect(result.mode).toBe('targeted');
    expect(result.slidesAffected).toBeGreaterThan(0);

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Revision instruction: Add a fourth answer option');
  });

  it('should revise full deck (no targets) and write updated file', async () => {
    const filePath = join(tmpDir, 'revise-full.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      instruction: 'Use tidyverse syntax throughout'
    });

    expect(result.file).toBe(filePath);
    expect(result.mode).toBe('full');

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Full revision instruction: Use tidyverse syntax');
  });

  it('should append provenance metadata after revision', async () => {
    const filePath = join(tmpDir, 'revise-provenance.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    await reviseSlides({
      revise: filePath,
      section: 'Methods',
      instruction: 'Improve clarity'
    });

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('# refined:');
  });

  it('should return result with correct shape', async () => {
    const filePath = join(tmpDir, 'revise-shape.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      slides: '1-3',
      instruction: 'Make slides more engaging'
    });

    expect(result).toHaveProperty('file');
    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('slidesAffected');
    expect(result).toHaveProperty('elapsed');
    expect(result).toHaveProperty('instruction');
    expect(result).toHaveProperty('content');

    expect(typeof result.file).toBe('string');
    expect(typeof result.mode).toBe('string');
    expect(typeof result.slidesAffected).toBe('number');
    expect(typeof result.elapsed).toBe('number');
    expect(result.elapsed).toBeGreaterThanOrEqual(0);
    expect(typeof result.content).toBe('string');
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('should throw for nonexistent file', async () => {
    await expect(reviseSlides({
      revise: '/nonexistent/slides.qmd',
      instruction: 'test'
    })).rejects.toThrow('File not found');
  });

  it('should enter auto-analysis mode when no instruction provided', async () => {
    const filePath = join(tmpDir, 'revise-noinst.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath
    });

    // Auto-analysis mode should not throw; it should return a result
    expect(result.mode).toBe('auto-analysis');
    expect(result).toHaveProperty('analysis');
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Error handling (~4 tests)
// ─────────────────────────────────────────────────────────────

describe('Error handling', () => {
  const tmpDir = join(__dirname, '../../../test-output-slide-refiner-errors');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should throw when --revise path is missing', async () => {
    await expect(reviseSlides({
      instruction: 'test'
    })).rejects.toThrow('--revise requires a path');
  });

  it('should throw when file does not exist', async () => {
    await expect(reviseSlides({
      revise: '/tmp/does-not-exist-slide-refiner-test.qmd',
      instruction: 'test'
    })).rejects.toThrow('File not found');
  });

  it('should throw descriptive error when no slides match filter', async () => {
    const filePath = join(tmpDir, 'error-nomatch.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    await expect(reviseSlides({
      revise: filePath,
      type: 'theorem',
      instruction: 'test'
    })).rejects.toThrow(/No slides of type "theorem" found/);
  });

  it('should throw for invalid slide range', async () => {
    const filePath = join(tmpDir, 'error-range.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    await expect(reviseSlides({
      revise: filePath,
      slides: 'abc',
      instruction: 'test'
    })).rejects.toThrow(/Invalid slide range/);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. Dry-run (~2 tests)
// ─────────────────────────────────────────────────────────────

describe('Dry-run mode', () => {
  const tmpDir = join(__dirname, '../../../test-output-slide-refiner-dryrun');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return preview without modifying file', async () => {
    const filePath = join(tmpDir, 'dryrun-nowrite.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');
    const originalContent = readFileSync(filePath, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      section: 'Methods',
      instruction: 'Add more detail',
      dryRun: true
    });

    expect(result.dryRun).toBe(true);
    expect(result.slidesAffected).toBeGreaterThan(0);
    expect(result.mode).toBe('targeted');

    // File should NOT be modified
    const afterContent = readFileSync(filePath, 'utf-8');
    expect(afterContent).toBe(originalContent);
  });

  it('should include targetSlides info in dry-run result', async () => {
    const filePath = join(tmpDir, 'dryrun-info.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      type: 'quiz',
      instruction: 'Simplify questions',
      dryRun: true
    });

    expect(result.dryRun).toBe(true);
    expect(Array.isArray(result.targetSlides)).toBe(true);
    expect(result.targetSlides.length).toBeGreaterThan(0);

    for (const t of result.targetSlides) {
      expect(t).toHaveProperty('number');
      expect(t).toHaveProperty('title');
      expect(t).toHaveProperty('type');
      expect(t.type).toBe('quiz');
    }

    expect(result.strategy).toBeDefined();
    expect(result.instruction).toBe('Simplify questions');
  });
});
