/**
 * Unit Tests: Slide Refiner — Auto-Analysis Mode
 *
 * Tests the 7-dimension heuristic analysis (autoAnalyze),
 * auto-revision prompt building (buildAutoRevisePrompt),
 * and integration of bare --revise mode (no --instruction).
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  reviseSlides,
  autoAnalyze,
  buildAutoRevisePrompt,
} from '../../../src/teaching/generators/slide-refiner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

import { makeSlide, makeLines } from '../helpers/slide-test-helpers.js';

// ─────────────────────────────────────────────────────────────
// Sample deck for integration tests
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

// ─────────────────────────────────────────────────────────────
// 1. autoAnalyze() — dimension tests (~10 tests)
// ─────────────────────────────────────────────────────────────

describe('autoAnalyze()', () => {
  it('should detect overcrowded slide (>20 content lines)', () => {
    const slides = [
      makeSlide({ number: 1, body: makeLines(25) }),
      makeSlide({ number: 2, body: makeLines(10) }), // Normal density (not sparse, not overcrowded)
    ];
    const analysis = autoAnalyze(slides);
    const density = analysis.find(a => a.dimension === 'density');
    // Structural checks (primary — resilient to wording changes)
    expect(density.status).toBe('warn');
    expect(density.slideNumbers).toContain(1);
    expect(density.slideNumbers).not.toContain(2);
    expect(density.findings.length).toBeGreaterThanOrEqual(1);
    // Wording check (secondary — documents expected phrasing)
    expect(density.findings.some(f => /overcrowded/i.test(f))).toBe(true);
  });

  it('should detect sparse slide (<3 content lines)', () => {
    const slides = [
      makeSlide({ number: 1, body: 'one line', type: 'content' }),
    ];
    const analysis = autoAnalyze(slides);
    const density = analysis.find(a => a.dimension === 'density');
    // Structural checks
    expect(density.status).toBe('warn');
    expect(density.slideNumbers).toContain(1);
    expect(density.findings.length).toBeGreaterThanOrEqual(1);
    // Wording check
    expect(density.findings[0]).toMatch(/sparse/i);
  });

  it('should detect clustered practice slides (>50% in one section)', () => {
    const slides = [
      makeSlide({ number: 1, type: 'practice', sectionTitle: 'Intro' }),
      makeSlide({ number: 2, type: 'practice', sectionTitle: 'Intro' }),
      makeSlide({ number: 3, type: 'practice', sectionTitle: 'Intro' }),
      makeSlide({ number: 4, type: 'quiz', sectionTitle: 'Methods' }),
    ];
    const analysis = autoAnalyze(slides);
    const dist = analysis.find(a => a.dimension === 'practice-distribution');
    // Structural checks — all 3 clustered practice slides flagged
    expect(dist.status).toBe('warn');
    expect(dist.findings.length).toBeGreaterThanOrEqual(1);
    expect(dist.slideNumbers).toContain(1);
    expect(dist.slideNumbers).toContain(2);
    expect(dist.slideNumbers).toContain(3);
    expect(dist.slideNumbers).not.toContain(4);
    // Wording check — percentage should be mentioned
    expect(dist.findings[0]).toMatch(/75%/);
  });

  it('should detect evenly distributed practice slides as ok', () => {
    const slides = [
      makeSlide({ number: 1, type: 'practice', sectionTitle: 'Intro' }),
      makeSlide({ number: 2, type: 'quiz', sectionTitle: 'Methods' }),
      makeSlide({ number: 3, type: 'practice', sectionTitle: 'Results' }),
      makeSlide({ number: 4, type: 'quiz', sectionTitle: 'Discussion' }),
    ];
    const analysis = autoAnalyze(slides);
    const dist = analysis.find(a => a.dimension === 'practice-distribution');
    expect(dist.status).toBe('ok');
    expect(dist.findings).toHaveLength(0);
  });

  it('should detect math without explanation', () => {
    const slides = [
      makeSlide({
        number: 1,
        hasMath: true,
        body: '$$F = \\frac{a}{b}$$',
      }),
    ];
    const analysis = autoAnalyze(slides);
    const math = analysis.find(a => a.dimension === 'math-depth');
    // Structural checks
    expect(math.status).toBe('warn');
    expect(math.slideNumbers).toContain(1);
    expect(math.findings.length).toBeGreaterThanOrEqual(1);
    // Wording check
    expect(math.findings[0]).toMatch(/insufficient explanation/i);
  });

  it('should detect math with proper explanation as ok', () => {
    const slides = [
      makeSlide({
        number: 1,
        hasMath: true,
        body: 'The F-statistic measures the ratio of between-group variance to within-group variance.\n$$F = \\frac{MS_b}{MS_w}$$\nA larger value indicates greater group differences.',
      }),
    ];
    const analysis = autoAnalyze(slides);
    const math = analysis.find(a => a.dimension === 'math-depth');
    expect(math.status).toBe('ok');
  });

  it('should detect R output without interpretation', () => {
    const slides = [
      makeSlide({
        number: 1,
        hasCode: true,
        body: '```{r}\n#| echo: true\nsummary(model)\n```',
      }),
    ];
    const analysis = autoAnalyze(slides);
    const rOutput = analysis.find(a => a.dimension === 'r-output-interpretation');
    expect(rOutput.status).toBe('warn');
    expect(rOutput.slideNumbers).toContain(1);
  });

  it('should detect R output with interpretation as ok', () => {
    const slides = [
      makeSlide({
        number: 1,
        hasCode: true,
        body: '```{r}\n#| echo: true\nsummary(model)\n```\nThe output shows the model coefficients and their significance levels.',
      }),
    ];
    const analysis = autoAnalyze(slides);
    const rOutput = analysis.find(a => a.dimension === 'r-output-interpretation');
    expect(rOutput.status).toBe('ok');
  });

  it('should detect definition without nearby example', () => {
    const slides = [
      makeSlide({ number: 1, type: 'content', body: makeLines(5) }),
      makeSlide({ number: 2, type: 'content', body: makeLines(5) }),
      makeSlide({ number: 3, type: 'content', body: makeLines(5) }),
      makeSlide({ number: 4, type: 'content', body: makeLines(5) }),
      makeSlide({ number: 5, type: 'definition', title: 'Definition: Variance', body: makeLines(5) }),
      makeSlide({ number: 6, type: 'content', body: makeLines(5) }),
      makeSlide({ number: 7, type: 'content', body: makeLines(5) }),
      makeSlide({ number: 8, type: 'content', body: makeLines(5) }),
      makeSlide({ number: 9, type: 'content', body: makeLines(5) }),
    ];
    const analysis = autoAnalyze(slides);
    const examples = analysis.find(a => a.dimension === 'worked-examples');
    // Structural checks — definition slide 5 flagged, not content slides
    expect(examples.status).toBe('warn');
    expect(examples.slideNumbers).toContain(5);
    expect(examples.slideNumbers).not.toContain(1);
    expect(examples.findings.length).toBeGreaterThanOrEqual(1);
    // Wording check
    expect(examples.findings[0]).toMatch(/no example slide within 3 slides/i);
  });

  it('should detect content completeness issues', () => {
    const slides = [
      makeSlide({ number: 1, type: 'content', body: 'Only one line.' }),
      makeSlide({ number: 2, type: 'content', body: 'Line one\nLine two\nLine three\nLine four' }),
    ];
    const analysis = autoAnalyze(slides);
    const completeness = analysis.find(a => a.dimension === 'content-completeness');
    expect(completeness.status).toBe('warn');
    expect(completeness.slideNumbers).toContain(1);
    expect(completeness.slideNumbers).not.toContain(2);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. buildAutoRevisePrompt() (~4 tests)
// ─────────────────────────────────────────────────────────────

describe('buildAutoRevisePrompt()', () => {
  it('should include only warn dimensions in prompt', () => {
    const slides = [makeSlide({ number: 1, body: makeLines(25) })];
    const analysis = [
      { dimension: 'density', status: 'warn', findings: ['Slide 1 is overcrowded'], slideNumbers: [1] },
      { dimension: 'math-depth', status: 'ok', findings: [], slideNumbers: [] },
      { dimension: 'style-compliance', status: 'ok', findings: [], slideNumbers: [] },
    ];
    const prompt = buildAutoRevisePrompt(slides, analysis);

    expect(prompt).toContain('density');
    expect(prompt).not.toContain('math-depth');
    expect(prompt).not.toContain('style-compliance');
  });

  it('should include slide numbers in prompt', () => {
    const slides = [makeSlide({ number: 3 }), makeSlide({ number: 7 })];
    const analysis = [
      { dimension: 'density', status: 'warn', findings: ['Too dense'], slideNumbers: [3, 7] },
    ];
    const prompt = buildAutoRevisePrompt(slides, analysis);
    expect(prompt).toContain('slides: 3, 7');
  });

  it('should return null when all dimensions are ok', () => {
    const slides = [makeSlide()];
    const analysis = [
      { dimension: 'density', status: 'ok', findings: [], slideNumbers: [] },
      { dimension: 'math-depth', status: 'ok', findings: [], slideNumbers: [] },
    ];
    const result = buildAutoRevisePrompt(slides, analysis);
    expect(result).toBeNull();
  });

  it('should include config style preferences in prompt', () => {
    const slides = [makeSlide()];
    const analysis = [
      { dimension: 'density', status: 'warn', findings: ['Issue'], slideNumbers: [1] },
    ];
    const config = { scholar: { style: { tone: 'conversational', notation: 'statistical' } } };
    const prompt = buildAutoRevisePrompt(slides, analysis, config);
    expect(prompt).toContain('tone=conversational');
    expect(prompt).toContain('notation=statistical');
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Integration tests (~4 tests)
// ─────────────────────────────────────────────────────────────

describe('Auto-analysis integration', () => {
  const tmpDir = join(__dirname, '../../../test-output-slide-refiner-auto');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('--dry-run should return analysis report without writing file', async () => {
    const filePath = join(tmpDir, 'auto-dryrun.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');
    const originalContent = readFileSync(filePath, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      dryRun: true,
    });

    expect(result.dryRun).toBe(true);
    expect(result.mode).toBe('auto-analysis');
    expect(Array.isArray(result.analysis)).toBe(true);
    expect(result.analysis.length).toBe(7);

    // File should NOT be modified
    const afterContent = readFileSync(filePath, 'utf-8');
    expect(afterContent).toBe(originalContent);
  });

  it('auto mode should write updated file (with AI fallback)', async () => {
    const filePath = join(tmpDir, 'auto-write.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
    });

    expect(result.mode).toBe('auto-analysis');
    expect(result).toHaveProperty('content');
    expect(typeof result.content).toBe('string');
  });

  it('provenance label should be "auto-analysis"', async () => {
    const filePath = join(tmpDir, 'auto-provenance.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    await reviseSlides({
      revise: filePath,
    });

    const content = readFileSync(filePath, 'utf-8');
    // The provenance record should contain auto-analysis
    expect(content).toContain('auto-analysis');
  });

  it('auto mode with --section should only analyze targeted section', async () => {
    const filePath = join(tmpDir, 'auto-section.qmd');
    writeFileSync(filePath, SAMPLE_DECK, 'utf-8');

    const result = await reviseSlides({
      revise: filePath,
      section: 'Methods',
      dryRun: true,
    });

    expect(result.mode).toBe('auto-analysis');
    expect(result.dryRun).toBe(true);
    // Should only have targeted Methods slides
    for (const t of result.targetSlides) {
      expect(t).toHaveProperty('number');
      expect(t).toHaveProperty('title');
    }
    expect(result.targetSlides.length).toBeGreaterThan(0);
    expect(result.targetSlides.length).toBeLessThan(8); // not all slides
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Error handling / edge cases (~2 tests)
// ─────────────────────────────────────────────────────────────

describe('Auto-analysis edge cases', () => {
  it('empty slides array should return all-ok analysis', () => {
    const analysis = autoAnalyze([]);
    expect(analysis.length).toBe(7);
    for (const dim of analysis) {
      expect(dim.status).toBe('ok');
      expect(dim.findings).toHaveLength(0);
      expect(dim.slideNumbers).toHaveLength(0);
    }
  });

  it('config loading failure should still analyze (uses defaults)', () => {
    const slides = [
      makeSlide({ number: 1, body: "Let's look at this cool example", type: 'content' }),
    ];
    // Pass null config (simulating load failure)
    const analysis = autoAnalyze(slides, null);
    expect(analysis.length).toBe(7);
    // Default tone is 'formal', so "Let's" should trigger style warning
    const style = analysis.find(a => a.dimension === 'style-compliance');
    // Structural checks
    expect(style.status).toBe('warn');
    expect(style.slideNumbers).toContain(1);
    expect(style.findings.length).toBeGreaterThanOrEqual(1);
    // Wording check
    expect(style.findings[0]).toMatch(/conversational language/i);
  });
});
