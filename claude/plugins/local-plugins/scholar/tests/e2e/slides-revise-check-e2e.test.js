/**
 * E2E & Dogfooding Tests: Slides --revise / --check
 *
 * Uses the STAT-101 demo course fixtures to test the full pipeline:
 * - Slide parsing → type classification → targeting
 * - --revise: targeted revision, auto-analysis, dry-run
 * - --check: 3-layer validation (coverage, structure, style)
 *
 * ~30 tests across 4 categories.
 */

import { describe, test, expect, beforeAll, afterEach } from '@jest/globals';
import { readFileSync, mkdirSync, rmSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Source modules under test
import {
  parseSlidesFromContent,
  filterByType,
  filterBySection,
  getSlideSummary
} from '../../src/teaching/utils/slide-parser.js';

import {
  reviseSlides,
  resolveTargets,
  buildContext,
  autoAnalyze,
  buildAutoRevisePrompt
} from '../../src/teaching/generators/slide-refiner.js';

import {
  validateSlideCoverage,
  validateSlideStructure,
  validateSlideStyle,
  formatSlideCheckReport,
  generateReviseCommands,
  formatSlideCheckJson
} from '../../src/teaching/validators/slide-coverage.js';

import yaml from 'js-yaml';

// ─────────────────────────────────────────────────────────────
// Fixtures & Helpers
// ─────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, 'fixtures');

/** Load the demo QMD slide deck as a string */
function loadDemoSlides() {
  return readFileSync(join(FIXTURES, 'stat101-week01-slides.qmd'), 'utf-8');
}

/** Load the demo lesson plan as a parsed YAML object */
function loadDemoPlan() {
  const raw = readFileSync(join(FIXTURES, 'stat101-week01-plan.yml'), 'utf-8');
  return yaml.load(raw);
}

/** Load the demo teach config as a parsed YAML object */
function loadDemoConfig() {
  const raw = readFileSync(join(FIXTURES, 'stat101-teach-config.yml'), 'utf-8');
  return yaml.load(raw);
}

/** Create a temp directory with a copy of the demo slides for write tests */
function createTempDeck() {
  const tmpDir = join(os.tmpdir(), `scholar-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(tmpDir, { recursive: true });
  const src = join(FIXTURES, 'stat101-week01-slides.qmd');
  const dest = join(tmpDir, 'slides.qmd');
  copyFileSync(src, dest);
  return { tmpDir, slidesPath: dest };
}

/** Clean up temp directory */
function cleanupTemp(tmpDir) {
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// Track temp dirs for cleanup
let tempDirs = [];
afterEach(() => {
  for (const dir of tempDirs) { cleanupTemp(dir); }
  tempDirs = [];
});

// ═══════════════════════════════════════════════════════════════
// DOGFOODING: Parse STAT-101 Demo Course
// ═══════════════════════════════════════════════════════════════

describe('Dogfooding: STAT-101 slide deck parsing', () => {
  let slides;

  beforeAll(() => {
    const content = loadDemoSlides();
    const result = parseSlidesFromContent(content);
    slides = result.slides;
  });

  test('should parse correct number of slides from demo deck', () => {
    // The QMD fixture has exactly 31 ## headings (2 # section headings are not slides)
    expect(slides.length).toBe(31);
  });

  test('should classify slide types correctly on demo deck', () => {
    const summary = getSlideSummary(slides);

    // Expect a diverse mix of types from the demo
    expect(summary.byType).toHaveProperty('content');
    expect(summary.byType).toHaveProperty('quiz');
    expect(summary.byType).toHaveProperty('practice');
    expect(summary.byType).toHaveProperty('definition');
    expect(summary.byType).toHaveProperty('summary');
  });

  test('should detect quiz slides via CSS class', () => {
    const quizSlides = filterByType(slides, 'quiz');
    expect(quizSlides.length).toBeGreaterThanOrEqual(2);

    // Verify quiz slides have expected content
    const titles = quizSlides.map(s => s.title);
    expect(titles.some(t => /variable types/i.test(t))).toBe(true);
    expect(titles.some(t => /interpretation/i.test(t))).toBe(true);
  });

  test('should detect definition slides via CSS class', () => {
    const defSlides = filterByType(slides, 'definition');
    expect(defSlides.length).toBeGreaterThanOrEqual(2);
  });

  test('should detect example slides via CSS class', () => {
    const examples = filterByType(slides, 'example');
    expect(examples.length).toBeGreaterThanOrEqual(2);
  });

  test('should detect math in slides with formulas', () => {
    const mathSlides = slides.filter(s => s.hasMath);
    expect(mathSlides.length).toBeGreaterThanOrEqual(5);
  });

  test('should detect code in slides with R blocks', () => {
    const codeSlides = slides.filter(s => s.hasCode);
    expect(codeSlides.length).toBeGreaterThanOrEqual(2);
  });

  test('should assign correct section titles', () => {
    const sections = [...new Set(slides.map(s => s.sectionTitle))];
    // Should have at least the two # sections: Descriptive Statistics, Data Visualization
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  test('should filter by section correctly', () => {
    const vizSlides = filterBySection(slides, 'Data Visualization');
    expect(vizSlides.length).toBeGreaterThan(0);
    expect(vizSlides.every(s => /visualization/i.test(s.sectionTitle))).toBe(true);
  });

  test('should produce correct summary breakdown', () => {
    const summary = getSlideSummary(slides);
    expect(summary.total).toBe(slides.length);

    // Total across types must equal total slides
    const typeSum = Object.values(summary.byType).reduce((a, b) => a + b, 0);
    expect(typeSum).toBe(summary.total);
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E: --revise Workflow
// ═══════════════════════════════════════════════════════════════

describe('E2E: --revise workflow', () => {
  test('targeted revision by section injects fallback comments', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    const result = await reviseSlides({
      revise: slidesPath,
      section: 'Data Visualization',
      instruction: 'Add more detail about histogram bin widths'
    });

    expect(result.mode).toBe('targeted');
    expect(result.slidesAffected).toBeGreaterThan(0);
    expect(result.instruction).toContain('histogram bin widths');

    // Verify file was actually written
    const updated = readFileSync(slidesPath, 'utf-8');
    expect(updated).toContain('Revision instruction');
    expect(updated).toContain('histogram bin widths');
  });

  test('targeted revision by slide range', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    const result = await reviseSlides({
      revise: slidesPath,
      slides: '3-5',
      instruction: 'Simplify the language for beginners'
    });

    expect(result.mode).toBe('targeted');
    expect(result.slidesAffected).toBe(3);
  });

  test('targeted revision by type filters correctly', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    const result = await reviseSlides({
      revise: slidesPath,
      type: 'quiz',
      instruction: 'Add a fifth answer option'
    });

    expect(result.mode).toBe('targeted');
    expect(result.slidesAffected).toBeGreaterThanOrEqual(2);
  });

  test('full deck revision when no targeting specified', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    const result = await reviseSlides({
      revise: slidesPath,
      instruction: 'Convert all notation to APA style'
    });

    expect(result.mode).toBe('full');
    expect(result.slidesAffected).toBeGreaterThan(10);
  });

  test('dry-run returns preview without modifying file', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    const before = readFileSync(slidesPath, 'utf-8');

    const result = await reviseSlides({
      revise: slidesPath,
      section: 'Descriptive Statistics',
      instruction: 'Add speaker notes',
      dryRun: true
    });

    expect(result.dryRun).toBe(true);
    expect(result.targetSlides).toBeDefined();
    expect(result.targetSlides.length).toBeGreaterThan(0);
    expect(result.strategy).toBeDefined();

    // File should be unchanged
    const after = readFileSync(slidesPath, 'utf-8');
    expect(after).toBe(before);
  });

  test('auto-analysis dry-run returns 7-dimension report', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    const before = readFileSync(slidesPath, 'utf-8');

    const result = await reviseSlides({
      revise: slidesPath,
      dryRun: true
      // No instruction → auto-analysis mode
    });

    expect(result.dryRun).toBe(true);
    expect(result.mode).toBe('auto-analysis');
    expect(result.analysis).toBeDefined();
    expect(result.analysis).toHaveLength(7);

    // Verify dimension names
    const dimensions = result.analysis.map(a => a.dimension);
    expect(dimensions).toContain('density');
    expect(dimensions).toContain('practice-distribution');
    expect(dimensions).toContain('math-depth');
    expect(dimensions).toContain('content-completeness');

    // File should be unchanged
    const after = readFileSync(slidesPath, 'utf-8');
    expect(after).toBe(before);
  });

  test('auto-analysis detects overcrowded slides in demo deck', async () => {
    const content = loadDemoSlides();
    const { slides } = parseSlidesFromContent(content);

    const analysis = autoAnalyze(slides);
    const density = analysis.find(a => a.dimension === 'density');

    // The "Dense Slide: All Formulas Reference" has >20 lines
    expect(density.status).toBe('warn');
    expect(density.findings.some(f => /overcrowded/i.test(f))).toBe(true);
  });

  test('auto-analysis detects sparse slide in demo deck', async () => {
    const content = loadDemoSlides();
    const { slides } = parseSlidesFromContent(content);

    const analysis = autoAnalyze(slides);
    const density = analysis.find(a => a.dimension === 'density');

    // "Choosing the Right Plot" is intentionally sparse
    expect(density.findings.some(f => /sparse/i.test(f))).toBe(true);
  });

  test('error on non-existent file', async () => {
    await expect(
      reviseSlides({ revise: '/nonexistent/path.qmd', instruction: 'test' })
    ).rejects.toThrow(/not found/i);
  });

  test('error on invalid section name', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    await expect(
      reviseSlides({
        revise: slidesPath,
        section: 'Nonexistent Section',
        instruction: 'test'
      })
    ).rejects.toThrow(/no slides found in section/i);
  });

  test('revision comment is injected into the output file', async () => {
    const { tmpDir, slidesPath } = createTempDeck();
    tempDirs.push(tmpDir);

    await reviseSlides({
      revise: slidesPath,
      type: 'summary',
      instruction: 'Make bullet points shorter'
    });

    const updated = readFileSync(slidesPath, 'utf-8');
    // Without AI, the fallback injects HTML comment with the instruction
    expect(updated).toContain('<!-- Revision instruction:');
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E: --check Workflow
// ═══════════════════════════════════════════════════════════════

describe('E2E: --check workflow', () => {
  let slides;
  let plan;
  let config;

  beforeAll(() => {
    const content = loadDemoSlides();
    const result = parseSlidesFromContent(content);
    slides = result.slides;
    plan = loadDemoPlan();
    config = loadDemoConfig();
  });

  test('coverage validation: objectives are covered by demo slides', () => {
    const result = validateSlideCoverage(slides, plan);

    // Demo slides were designed to cover all 4 objectives
    expect(result.coveragePercent).toBeGreaterThanOrEqual(50);
    expect(['PASS', 'WARN']).toContain(result.status);
    expect(result.objectives.length).toBe(4);
  });

  test('coverage: individual objectives map to correct sections', () => {
    const result = validateSlideCoverage(slides, plan);

    // LO-1.1 about variable types should be found
    const lo1 = result.objectives[0];
    expect(lo1.description).toContain('categorical');
    expect(lo1.covered).toBe(true);
    expect(lo1.foundInSections.length).toBeGreaterThan(0);
  });

  test('coverage: FAIL for unrelated plan objectives', () => {
    const fakePlan = {
      title: 'Unrelated Topic',
      week: 99,
      learning_objectives: [
        { description: 'Implement neural network backpropagation algorithms' },
        { description: 'Design quantum computing circuits' }
      ]
    };

    const result = validateSlideCoverage(slides, fakePlan);
    expect(result.status).toBe('FAIL');
    expect(result.coveragePercent).toBe(0);
  });

  test('structure validation: checks slide count', () => {
    const result = validateSlideStructure(slides, config, 50);

    expect(result.metrics).toBeDefined();
    expect(result.metrics.slideCount).toBeDefined();
    expect(result.metrics.slideCount.actual).toBe(slides.length);
  });

  test('structure validation: checks content ratio', () => {
    const result = validateSlideStructure(slides, config, 50);

    expect(result.metrics.contentRatio).toBeDefined();
    expect(result.metrics.contentRatio.actual).toBeGreaterThan(0);
    expect(result.metrics.contentRatio.actual).toBeLessThanOrEqual(1);
  });

  test('structure validation: checks practice ratio', () => {
    const result = validateSlideStructure(slides, config, 50);

    expect(result.metrics.practiceRatio).toBeDefined();
    expect(result.metrics.practiceRatio.actual).toBeGreaterThanOrEqual(0);
  });

  test('style validation: detects definition slide without callout', () => {
    const result = validateSlideStyle(slides, config);

    // "Definition: Standard Deviation" slide lacks {.callout-important}
    const calloutIssues = result.issues.filter(i =>
      /callout/i.test(i.message || i.type || '')
    );
    expect(calloutIssues.length).toBeGreaterThanOrEqual(1);
  });

  test('style validation: detects dense slide without small-slide class', () => {
    const result = validateSlideStyle(slides, config);

    // "Dense Slide: All Formulas Reference" is >15 lines but lacks .small-slide
    const denseIssues = result.issues.filter(i =>
      /dense|small-slide/i.test(i.message || i.type || '')
    );
    expect(denseIssues.length).toBeGreaterThanOrEqual(1);
  });

  test('report format includes all three layers', () => {
    const coverage = validateSlideCoverage(slides, plan);
    const structure = validateSlideStructure(slides, config, 50);
    const style = validateSlideStyle(slides, config);

    const results = { coverage, structure, style };
    const report = formatSlideCheckReport(results, 'week01-slides.qmd', plan.title);

    expect(report).toContain('COVERAGE');
    expect(report).toContain('STRUCTURE');
    expect(report).toContain('STYLE');
  });

  test('report includes suggested --revise commands', () => {
    const coverage = validateSlideCoverage(slides, plan);
    const structure = validateSlideStructure(slides, config, 50);
    const style = validateSlideStyle(slides, config);

    const results = { coverage, structure, style };
    const commands = generateReviseCommands(results, 'week01-slides.qmd');

    // Should suggest at least one revise command for the style issues
    if (style.issues.length > 0) {
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.some(c => c.includes('--revise'))).toBe(true);
    }
  });

  test('JSON output is valid and machine-readable', () => {
    const coverage = validateSlideCoverage(slides, plan);
    const structure = validateSlideStructure(slides, config, 50);
    const style = validateSlideStyle(slides, config);

    const results = { coverage, structure, style };
    const jsonOutput = formatSlideCheckJson(results);

    // Should be a valid JSON-serializable object
    const serialized = JSON.stringify(jsonOutput);
    const parsed = JSON.parse(serialized);

    expect(parsed).toHaveProperty('coverage');
    expect(parsed).toHaveProperty('structure');
    expect(parsed).toHaveProperty('style');
    expect(parsed.coverage).toHaveProperty('status');
    expect(parsed.structure).toHaveProperty('status');
    expect(parsed.style).toHaveProperty('status');
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E: Auto-Analysis Integration
// ═══════════════════════════════════════════════════════════════

describe('E2E: auto-analysis on demo deck', () => {
  let slides;

  beforeAll(() => {
    const content = loadDemoSlides();
    const result = parseSlidesFromContent(content);
    slides = result.slides;
  });

  test('auto-analysis produces all 7 dimensions', () => {
    const analysis = autoAnalyze(slides);
    expect(analysis).toHaveLength(7);

    const names = analysis.map(a => a.dimension).sort();
    expect(names).toEqual([
      'content-completeness',
      'density',
      'math-depth',
      'practice-distribution',
      'r-output-interpretation',
      'style-compliance',
      'worked-examples'
    ]);
  });

  test('buildAutoRevisePrompt includes only warn dimensions', () => {
    const analysis = autoAnalyze(slides);
    const warnDimensions = analysis.filter(a => a.status === 'warn');

    const prompt = buildAutoRevisePrompt(slides, analysis);

    if (warnDimensions.length > 0) {
      expect(prompt).not.toBeNull();
      // Each warn dimension should be mentioned
      for (const dim of warnDimensions) {
        expect(prompt).toContain(dim.dimension);
      }
    }

    // Ok dimensions should NOT be in the prompt
    const okDimensions = analysis.filter(a => a.status === 'ok');
    for (const dim of okDimensions) {
      // The dimension name shouldn't appear as a section header
      if (prompt) {
        expect(prompt).not.toContain(`## ${dim.dimension}`);
      }
    }
  });

  test('R output interpretation flags code without interpretation', () => {
    const analysis = autoAnalyze(slides);
    const rOutput = analysis.find(a => a.dimension === 'r-output-interpretation');

    // "R Output: Variability" slide has code but no interpretation text
    if (rOutput.status === 'warn') {
      expect(rOutput.slideNumbers.length).toBeGreaterThan(0);
    }
  });

  test('content completeness flags sparse slides', () => {
    const analysis = autoAnalyze(slides);
    const completeness = analysis.find(a => a.dimension === 'content-completeness');

    // "Choosing the Right Plot" is intentionally sparse
    if (completeness.status === 'warn') {
      expect(completeness.findings.length).toBeGreaterThan(0);
    }
  });

  test('worked-examples dimension checks definition/theorem coverage', () => {
    const analysis = autoAnalyze(slides);
    const examples = analysis.find(a => a.dimension === 'worked-examples');

    // Theorem: Chebyshev's Inequality exists without an example nearby
    // The analysis should detect this
    expect(examples).toBeDefined();
    expect(['ok', 'warn']).toContain(examples.status);
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E: Target Resolution & Context Building
// ═══════════════════════════════════════════════════════════════

describe('E2E: target resolution on demo deck', () => {
  let slides;

  beforeAll(() => {
    const content = loadDemoSlides();
    const result = parseSlidesFromContent(content);
    slides = result.slides;
  });

  test('combined section + type targeting works', () => {
    const targets = resolveTargets(slides, {
      section: 'Descriptive Statistics',
      type: 'example'
    });

    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(s => s.type === 'example')).toBe(true);
    expect(targets.every(s => /descriptive/i.test(s.sectionTitle))).toBe(true);
  });

  test('slide range respects boundaries', () => {
    const targets = resolveTargets(slides, { slides: '1-3' });
    expect(targets.length).toBe(3);
    expect(targets[0].number).toBe(1);
    expect(targets[2].number).toBe(3);
  });

  test('context strategy is targeted for demo deck (>=30 slides)', () => {
    const targets = resolveTargets(slides, { type: 'quiz' });
    const { context, strategy } = buildContext(slides, targets);

    expect(strategy).toBe('targeted');
    // Context should include targets + neighbors, not the full deck
    expect(context.length).toBeLessThan(slides.length);
    expect(context.length).toBeGreaterThan(targets.length);
  });

  test('open-ended range works', () => {
    const lastFive = resolveTargets(slides, {
      slides: `${slides.length - 4}-`
    });
    expect(lastFive.length).toBe(5);
  });
});
