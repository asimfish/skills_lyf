/**
 * E2E & Dogfooding Tests: /teaching:validate-r
 *
 * Tests the full pipeline from .qmd file → chunk extraction → script
 * generation → output parsing → report formatting, using realistic
 * STAT-101 fixtures.
 *
 * Categories:
 *   1. Full Pipeline (extract → build → parse → format)
 *   2. Edge Cases (empty files, mixed languages, large files)
 *   3. Lint Integration (static analysis across full files)
 *   4. Discovery Integration (command registered, discoverable)
 *   5. Config Integration (data_dir, r_packages defaults)
 *   6. Solution Command Integration (lecture/lab matching)
 *
 * ~45 tests across 6 categories.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

// Source modules under test
import {
  extractRChunks,
  shouldValidateChunk,
  buildValidationScript,
  parseValidationOutput,
  scanDataFiles,
  formatValidationReport,
  extractSummaryAndChunks,
  findMatchingLecture,
  findMatchingLab,
  suggestPackageInstall,
  lintRChunk,
  parseChunkOptions,
} from '../../src/teaching/validators/r-code.js';

// Discovery integration
import {
  discoverCommands,
  getCommandDetail,
  getCommandStats,
  getCategoryInfo,
} from '../../src/discovery/index.js';

// Config integration
import { loadTeachConfig, getDataDir, getRPackages } from '../../src/teaching/config/loader.js';

// ─────────────────────────────────────────────────────────────
// Fixtures & Helpers
// ─────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, 'fixtures');

function loadFixture(name) {
  return readFileSync(join(FIXTURES, name), 'utf-8');
}

function makeTmpDir(prefix = 'validate-r-e2e-') {
  const dir = join(tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ─────────────────────────────────────────────────────────────
// 1. Full Pipeline Tests
// ─────────────────────────────────────────────────────────────

describe('Full Pipeline: assignment4-solution.qmd', () => {
  let content;
  let chunks;
  let validatable;
  let skipped;
  let script;
  let report;

  beforeAll(() => {
    content = loadFixture('assignment4-solution.qmd');
    chunks = extractRChunks(content);
    validatable = chunks.filter(shouldValidateChunk);
    skipped = chunks.filter(c => !shouldValidateChunk(c));
    script = buildValidationScript(validatable, { projectRoot: '/tmp/test' });
  });

  test('extracts exactly 5 R chunks', () => {
    expect(chunks).toHaveLength(5);
  });

  test('chunk labels match expected names', () => {
    const labels = chunks.map(c => c.label);
    expect(labels).toEqual([
      'setup',
      'normality-check',
      'levene-test',
      'diagnostic-plots',
      'optional-advanced',
    ]);
  });

  test('identifies 4 validatable and 1 skipped chunk', () => {
    expect(validatable).toHaveLength(4);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].label).toBe('optional-advanced');
  });

  test('skipped chunk has eval: false in options', () => {
    const skipChunk = chunks.find(c => c.label === 'optional-advanced');
    expect(skipChunk.options.eval).toBe(false);
  });

  test('generated script contains tryCatch for each validatable chunk', () => {
    expect((script.match(/tryCatch\(/g) || []).length).toBe(4);
  });

  test('generated script contains [PASS] markers', () => {
    expect(script).toContain('[PASS] setup');
    expect(script).toContain('[PASS] normality-check');
    expect(script).toContain('[PASS] levene-test');
    expect(script).toContain('[PASS] diagnostic-plots');
  });

  test('generated script contains pdf(NULL) for plot suppression', () => {
    expect(script).toContain('pdf(NULL)');
  });

  test('generated script sets working directory', () => {
    expect(script).toContain('setwd("/tmp/test")');
  });

  test('parsing all-pass output produces correct summary', () => {
    const stdout = [
      '[RUNNING] setup',
      '[PASS] setup',
      '[RUNNING] normality-check',
      '[PASS] normality-check',
      '[RUNNING] levene-test',
      '[PASS] levene-test',
      '[RUNNING] diagnostic-plots',
      '[PASS] diagnostic-plots',
    ].join('\n');

    report = parseValidationOutput(stdout, '', 0);
    expect(report.summary.pass).toBe(4);
    expect(report.summary.fail).toBe(0);
    expect(report.summary.warn).toBe(0);
    expect(report.summary.exitCode).toBe(0);
  });

  test('formatted report includes file path header', () => {
    const formatted = formatValidationReport(report, skipped, 'assignment4-solution.qmd');
    expect(formatted).toContain('assignment4-solution.qmd');
    expect(formatted).toContain('PASS');
    expect(formatted).toContain('SKIP');
    expect(formatted).toContain('4 passed');
    expect(formatted).toContain('1 skipped');
  });

  test('formatted report uses dot-alignment between label and status', () => {
    const formatted = formatValidationReport(report, skipped, 'test.qmd');
    // Each line should have dots between label and status
    const chunkLines = formatted.split('\n').filter(l => l.includes('chunk "'));
    expect(chunkLines.length).toBeGreaterThan(0);
    for (const line of chunkLines) {
      expect(line).toMatch(/\.{3,}/);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Broken File Pipeline
// ─────────────────────────────────────────────────────────────

describe('Full Pipeline: broken-solution.qmd', () => {
  let chunks;

  beforeAll(() => {
    const content = loadFixture('broken-solution.qmd');
    chunks = extractRChunks(content);
  });

  test('extracts 4 chunks', () => {
    expect(chunks).toHaveLength(4);
  });

  test('all chunks are validatable (no eval:false)', () => {
    const validatable = chunks.filter(shouldValidateChunk);
    expect(validatable).toHaveLength(4);
  });

  test('parsing mixed output correctly identifies pass and fail', () => {
    const stdout = [
      '[PASS] good-chunk',
      '[FAIL] undefined-var: object \'nonexistent_variable\' not found',
      '[FAIL] bad-function: could not find function "fake_function_xyz"',
      '[PASS] final-good',
    ].join('\n');

    const report = parseValidationOutput(stdout, '', 1);
    expect(report.summary.pass).toBe(2);
    expect(report.summary.fail).toBe(2);
    expect(report.results[1].message).toContain('nonexistent_variable');
    expect(report.results[2].message).toContain('fake_function_xyz');
  });

  test('suggestPackageInstall returns null for non-package errors', () => {
    const suggestion = suggestPackageInstall("object 'nonexistent_variable' not found");
    expect(suggestion).toBeNull();
  });

  test('suggestPackageInstall returns suggestion for missing function', () => {
    const suggestion = suggestPackageInstall('could not find function "fake_function_xyz"');
    // Unknown function — no known mapping
    expect(suggestion).toBeNull();
  });

  test('suggestPackageInstall returns suggestion for known function', () => {
    const suggestion = suggestPackageInstall('could not find function "ggplot"');
    expect(suggestion).toContain('ggplot2');
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Edge Cases
// ─────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  test('no-r-chunks.qmd: extracts zero chunks', () => {
    const content = loadFixture('no-r-chunks.qmd');
    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(0);
  });

  test('no-r-chunks.qmd: report shows "No R chunks found"', () => {
    const report = parseValidationOutput('', '', 0);
    const formatted = formatValidationReport(report, [], 'no-r-chunks.qmd');
    expect(formatted).toContain('No R chunks found');
  });

  test('mixed-languages.qmd: only extracts R chunks', () => {
    const content = loadFixture('mixed-languages.qmd');
    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].label).toBe('r-chunk');
    expect(chunks[1].label).toBe('second-r');
  });

  test('mixed-languages.qmd: Python and bash are ignored', () => {
    const content = loadFixture('mixed-languages.qmd');
    const chunks = extractRChunks(content);
    const labels = chunks.map(c => c.label);
    expect(labels).not.toContain('python');
    expect(labels).not.toContain('bash');
  });

  test('buildValidationScript with empty chunk list produces INFO message', () => {
    const script = buildValidationScript([]);
    expect(script).toContain('[INFO] No R chunks to validate');
  });

  test('buildValidationScript with setup code prepends it', () => {
    const chunks = [{ label: 'test', code: 'x <- 1', options: {}, lineNumber: 1 }];
    const script = buildValidationScript(chunks, { setup: 'library(tidyverse)' });
    expect(script).toContain('library(tidyverse)');
    // Setup comes before chunks
    const setupIdx = script.indexOf('library(tidyverse)');
    const chunkIdx = script.indexOf('tryCatch');
    expect(setupIdx).toBeLessThan(chunkIdx);
  });

  test('buildValidationScript with dataDir includes comment', () => {
    const chunks = [{ label: 'test', code: 'x <- 1', options: {}, lineNumber: 1 }];
    const script = buildValidationScript(chunks, { dataDir: 'data/dean2017' });
    expect(script).toContain('Data directory: data/dean2017');
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Lint Integration (full-file analysis)
// ─────────────────────────────────────────────────────────────

describe('Lint Integration: lint-warnings.qmd', () => {
  let chunks;
  let allWarnings;

  beforeAll(() => {
    const content = loadFixture('lint-warnings.qmd');
    chunks = extractRChunks(content);
    allWarnings = chunks.flatMap(c => lintRChunk(c));
  });

  test('extracts 5 chunks from lint-warnings fixture', () => {
    expect(chunks).toHaveLength(5);
  });

  test('detects setwd() anti-pattern', () => {
    const setwdWarnings = allWarnings.filter(w => w.rule === 'no-setwd');
    expect(setwdWarnings.length).toBeGreaterThanOrEqual(1);
  });

  test('detects absolute path anti-pattern', () => {
    const pathWarnings = allWarnings.filter(w => w.rule === 'no-absolute-paths');
    expect(pathWarnings.length).toBeGreaterThanOrEqual(1);
  });

  test('detects install.packages() anti-pattern', () => {
    const installWarnings = allWarnings.filter(w => w.rule === 'no-install-packages');
    expect(installWarnings.length).toBeGreaterThanOrEqual(1);
  });

  test('detects rm(list=ls()) anti-pattern', () => {
    const rmWarnings = allWarnings.filter(w => w.rule === 'no-rm-list-ls');
    expect(rmWarnings.length).toBeGreaterThanOrEqual(1);
  });

  test('clean chunk produces no warnings', () => {
    const cleanChunk = chunks.find(c => c.label === 'clean');
    expect(cleanChunk).toBeDefined();
    const warnings = lintRChunk(cleanChunk);
    expect(warnings).toHaveLength(0);
  });

  test('total lint warnings across file is at least 4', () => {
    // setwd + absolute path + install.packages + rm(list=ls())
    const nonInfoWarnings = allWarnings.filter(w => w.severity !== 'info');
    expect(nonInfoWarnings.length).toBeGreaterThanOrEqual(4);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Discovery Integration
// ─────────────────────────────────────────────────────────────

describe('Discovery Integration', () => {
  let commands;

  beforeAll(() => {
    commands = discoverCommands();
  });

  test('validate-r is registered as a teaching command', () => {
    const cmd = commands.find(c => c.name === 'teaching:validate-r');
    expect(cmd).toBeDefined();
    expect(cmd.category).toBe('teaching');
  });

  test('validate-r is in the content subcategory', () => {
    const cmd = commands.find(c => c.name === 'teaching:validate-r');
    expect(cmd.subcategory).toBe('content');
  });

  test('getCommandDetail finds validate-r by full name', () => {
    const detail = getCommandDetail('teaching:validate-r');
    expect(detail).not.toBeNull();
    expect(detail.name).toBe('teaching:validate-r');
  });

  test('getCommandDetail finds validate-r by base name', () => {
    const detail = getCommandDetail('validate-r');
    expect(detail).not.toBeNull();
    expect(detail.category).toBe('teaching');
  });

  test('getCommandStats reflects 18 teaching commands', () => {
    const stats = getCommandStats();
    expect(stats.teaching).toBe(18);
    expect(stats.total).toBe(32);
  });

  test('getCategoryInfo(teaching).content includes validate-r', () => {
    const info = getCategoryInfo('teaching');
    const contentNames = info.content.map(c => c.name);
    expect(contentNames).toContain('teaching:validate-r');
  });

  test('validate-r command has flags array with --fix and --all', () => {
    const cmd = commands.find(c => c.name === 'teaching:validate-r');
    expect(Array.isArray(cmd.flags)).toBe(true);
    const flagNames = cmd.flags.map(f => f.name);
    expect(flagNames).toContain('--fix');
    expect(flagNames).toContain('--all');
  });

  test('validate-r command has usage and examples', () => {
    const detail = getCommandDetail('teaching:validate-r');
    expect(typeof detail.usage).toBe('string');
    expect(detail.usage.length).toBeGreaterThan(0);
    expect(Array.isArray(detail.examples)).toBe(true);
    expect(detail.examples.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Config Integration
// ─────────────────────────────────────────────────────────────

describe('Config Integration', () => {
  test('default config includes data_dir field', () => {
    const tmp = makeTmpDir('config-test-');
    try {
      // loadTeachConfig with no .flow/ dir returns defaults
      const config = loadTeachConfig(tmp);
      expect(config).toBeDefined();
      const dataDir = getDataDir(config);
      expect(typeof dataDir).toBe('string');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('default config includes r_packages field', () => {
    const tmp = makeTmpDir('config-test-');
    try {
      const config = loadTeachConfig(tmp);
      expect(config).toBeDefined();
      const pkgs = getRPackages(config);
      expect(Array.isArray(pkgs)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 7. Solution Command Integration (lecture/lab matching)
// ─────────────────────────────────────────────────────────────

describe('Solution Context: Lecture/Lab Matching', () => {
  let tmpRoot;

  beforeAll(() => {
    tmpRoot = makeTmpDir('solution-ctx-');

    // Create lectures/ directory with week-numbered files
    const lecturesDir = join(tmpRoot, 'lectures');
    mkdirSync(lecturesDir, { recursive: true });
    writeFileSync(join(lecturesDir, 'week-04-assumptions.qmd'), '---\ntitle: "Checking Assumptions"\n---\n\n```{r}\nx <- 1\n```\n');
    writeFileSync(join(lecturesDir, 'week-05-regression.qmd'), '---\ntitle: "Linear Regression"\n---\n\n```{r}\ny <- 2\n```\n');

    // Create labs/ directory
    const labsDir = join(tmpRoot, 'labs');
    mkdirSync(labsDir, { recursive: true });
    writeFileSync(join(labsDir, 'lab-week04-assumptions.qmd'), '---\ntitle: "Lab: Model Assumptions"\n---\n\n```{r}\nz <- 3\n```\n');

    // Create data/ directory
    const dataDir = join(tmpRoot, 'data');
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(dataDir, 'dean2017.csv'), 'id,score\n1,85\n2,92\n');
    writeFileSync(join(dataDir, 'grades.tsv'), 'id\tscore\n1\t85\n');
    writeFileSync(join(dataDir, 'README.md'), '# Data README (not a data file)');
  });

  test('findMatchingLecture matches by week number', () => {
    const assignmentPath = join(tmpRoot, 'assignments', 'assignment4-solution.qmd');
    const result = findMatchingLecture(assignmentPath, tmpRoot);
    expect(result).not.toBeNull();
    expect(result.matchType).toBe('week-number');
    expect(result.path).toContain('week-04');
  });

  test('findMatchingLab matches by week number', () => {
    const assignmentPath = join(tmpRoot, 'assignments', 'hw4-checking-assumptions.qmd');
    const result = findMatchingLab(assignmentPath, tmpRoot);
    expect(result).not.toBeNull();
    expect(result.path).toContain('lab-week04');
  });

  test('findMatchingLecture returns null for unmatched week', () => {
    const assignmentPath = join(tmpRoot, 'assignments', 'assignment99-nothing.qmd');
    const result = findMatchingLecture(assignmentPath, tmpRoot);
    expect(result).toBeNull();
  });

  test('scanDataFiles finds .csv and .tsv but not .md', () => {
    const files = scanDataFiles(join(tmpRoot, 'data'));
    expect(files).toHaveLength(2);
    const names = files.map(f => f.name);
    expect(names).toContain('dean2017.csv');
    expect(names).toContain('grades.tsv');
    expect(names).not.toContain('README.md');
  });

  test('extractSummaryAndChunks extracts headers and R chunks from lecture', () => {
    const lectureContent = readFileSync(join(tmpRoot, 'lectures', 'week-04-assumptions.qmd'), 'utf-8');
    const result = extractSummaryAndChunks(lectureContent);
    expect(result.rChunks.length).toBeGreaterThanOrEqual(1);
  });
});
