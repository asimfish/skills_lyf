/**
 * Unit tests for R Code Validator
 *
 * Tests pure utility functions for parsing, validating, and reporting
 * R code chunks in .qmd files.
 */

import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

// ─────────────────────────────────────────────────────────────
// extractRChunks
// ─────────────────────────────────────────────────────────────

describe('extractRChunks', () => {
  it('should extract a labeled R chunk', () => {
    const content = [
      '# Header',
      '```{r my-chunk}',
      'x <- 1 + 1',
      '```',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].label).toBe('my-chunk');
    expect(chunks[0].code).toBe('x <- 1 + 1');
    expect(chunks[0].lineNumber).toBe(2);
  });

  it('should auto-number unlabeled chunks sequentially', () => {
    const content = [
      '```{r}',
      'x <- 1',
      '```',
      '',
      '```{r}',
      'y <- 2',
      '```',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].label).toBe('chunk-1');
    expect(chunks[1].label).toBe('chunk-2');
  });

  it('should parse #| YAML-style chunk options', () => {
    const content = [
      '```{r setup}',
      '#| eval: false',
      '#| echo: true',
      'library(ggplot2)',
      '```',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].options.eval).toBe(false);
    expect(chunks[0].options.echo).toBe(true);
    expect(chunks[0].code).toBe('library(ggplot2)');
  });

  it('should handle nested fences (longer backtick sequences)', () => {
    const content = [
      '````{r outer}',
      'code_here <- TRUE',
      '````',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].label).toBe('outer');
    expect(chunks[0].code).toBe('code_here <- TRUE');
  });

  it('should return empty array for content with no R chunks', () => {
    const content = [
      '# Just Markdown',
      '',
      'Some text here.',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(0);
  });

  it('should ignore Python chunks', () => {
    const content = [
      '```{python}',
      'x = 1',
      '```',
      '```{r actual}',
      'x <- 1',
      '```',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].label).toBe('actual');
  });

  it('should ignore bash chunks', () => {
    const content = [
      '```{bash}',
      'echo "hello"',
      '```',
      '```{r my-r}',
      'print("hello")',
      '```',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].label).toBe('my-r');
  });

  it('should extract multiple chunks preserving order', () => {
    const content = [
      '```{r first}',
      'a <- 1',
      '```',
      '',
      '```{r second}',
      'b <- 2',
      '```',
      '',
      '```{r third}',
      'c <- 3',
      '```',
    ].join('\n');

    const chunks = extractRChunks(content);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].label).toBe('first');
    expect(chunks[1].label).toBe('second');
    expect(chunks[2].label).toBe('third');
    expect(chunks[0].lineNumber).toBeLessThan(chunks[1].lineNumber);
    expect(chunks[1].lineNumber).toBeLessThan(chunks[2].lineNumber);
  });
});

// ─────────────────────────────────────────────────────────────
// shouldValidateChunk
// ─────────────────────────────────────────────────────────────

describe('shouldValidateChunk', () => {
  it('should return true when eval is true', () => {
    const chunk = { options: { eval: true } };
    expect(shouldValidateChunk(chunk)).toBe(true);
  });

  it('should return false when eval is false', () => {
    const chunk = { options: { eval: false } };
    expect(shouldValidateChunk(chunk)).toBe(false);
  });

  it('should default to true when eval is missing', () => {
    const chunk = { options: {} };
    expect(shouldValidateChunk(chunk)).toBe(true);
  });

  it('should return false when eval is string "false" or "FALSE"', () => {
    expect(shouldValidateChunk({ options: { eval: 'false' } })).toBe(false);
    expect(shouldValidateChunk({ options: { eval: 'FALSE' } })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// buildValidationScript
// ─────────────────────────────────────────────────────────────

describe('buildValidationScript', () => {
  it('should include tryCatch wrapping for each chunk', () => {
    const chunks = [
      { label: 'test', code: 'x <- 1', lineNumber: 5 },
    ];
    const script = buildValidationScript(chunks);

    expect(script).toContain('tryCatch(');
    expect(script).toContain('withCallingHandlers({');
    expect(script).toContain('[PASS] test');
    expect(script).toContain('[FAIL] test');
  });

  it('should process chunks in sequential order', () => {
    const chunks = [
      { label: 'first', code: 'a <- 1', lineNumber: 1 },
      { label: 'second', code: 'b <- 2', lineNumber: 5 },
    ];
    const script = buildValidationScript(chunks);

    const firstIdx = script.indexOf('Chunk: first');
    const secondIdx = script.indexOf('Chunk: second');
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('should prepend setup code when provided', () => {
    const chunks = [
      { label: 'main', code: 'print(x)', lineNumber: 3 },
    ];
    const script = buildValidationScript(chunks, {
      setup: 'x <- 42',
    });

    expect(script).toContain('# --- User setup ---');
    expect(script).toContain('x <- 42');
    expect(script).toContain('# --- End user setup ---');
    // Setup should come before the chunk
    const setupIdx = script.indexOf('x <- 42');
    const chunkIdx = script.indexOf('Chunk: main');
    expect(setupIdx).toBeLessThan(chunkIdx);
  });

  it('should include data-dir comment when provided', () => {
    const chunks = [
      { label: 'load', code: 'read.csv("data.csv")', lineNumber: 1 },
    ];
    const script = buildValidationScript(chunks, {
      dataDir: '/path/to/data',
    });

    expect(script).toContain('# Data directory: /path/to/data');
  });

  it('should handle empty chunk list gracefully', () => {
    const script = buildValidationScript([]);
    expect(script).toContain('[INFO] No R chunks to validate');
    expect(script).not.toContain('tryCatch');
  });

  it('should set working directory to projectRoot', () => {
    const chunks = [
      { label: 'test', code: 'getwd()', lineNumber: 1 },
    ];
    const script = buildValidationScript(chunks, {
      projectRoot: '/home/user/project',
    });

    expect(script).toContain('setwd("/home/user/project")');
  });
});

// ─────────────────────────────────────────────────────────────
// parseValidationOutput
// ─────────────────────────────────────────────────────────────

describe('parseValidationOutput', () => {
  it('should parse all-pass output', () => {
    const stdout = [
      '[RUNNING] chunk-1',
      '[PASS] chunk-1',
      '[RUNNING] chunk-2',
      '[PASS] chunk-2',
    ].join('\n');

    const report = parseValidationOutput(stdout, '', 0);
    expect(report.results).toHaveLength(2);
    expect(report.results[0]).toEqual({ label: 'chunk-1', status: 'PASS', message: null });
    expect(report.results[1]).toEqual({ label: 'chunk-2', status: 'PASS', message: null });
    expect(report.summary.pass).toBe(2);
    expect(report.summary.fail).toBe(0);
  });

  it('should parse mixed pass/fail output', () => {
    const stdout = [
      '[PASS] setup',
      '[FAIL] analysis: object "df" not found',
      '[PASS] cleanup',
    ].join('\n');

    const report = parseValidationOutput(stdout, '', 1);
    expect(report.summary.pass).toBe(2);
    expect(report.summary.fail).toBe(1);
    expect(report.results[1].status).toBe('FAIL');
    expect(report.results[1].message).toBe('object "df" not found');
  });

  it('should parse warning output', () => {
    const stdout = '[WARN] plot-chunk: NAs introduced by coercion';

    const report = parseValidationOutput(stdout, '', 0);
    expect(report.results).toHaveLength(1);
    expect(report.results[0].status).toBe('WARN');
    expect(report.results[0].message).toBe('NAs introduced by coercion');
    expect(report.summary.warn).toBe(1);
  });

  it('should filter common R noise from stderr', () => {
    const stderr = [
      'Loading required package: stats',
      'Attaching package: "dplyr"',
      'The following objects are masked from "package:stats":',
      '    from namespace:base',
      'Actual error message here',
    ].join('\n');

    const report = parseValidationOutput('', stderr, 1);
    expect(report.summary.stderr).toBe('Actual error message here');
  });

  it('should record exit code in summary', () => {
    const report = parseValidationOutput('', '', 137);
    expect(report.summary.exitCode).toBe(137);
  });

  it('should handle malformed output with no markers', () => {
    const stdout = 'Some random R output\nwithout any markers';

    const report = parseValidationOutput(stdout, '', 0);
    expect(report.results).toHaveLength(0);
    expect(report.summary.total).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// scanDataFiles
// ─────────────────────────────────────────────────────────────

describe('scanDataFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should filter to data file extensions only', () => {
    writeFileSync(join(tmpDir, 'data.csv'), 'a,b\n1,2');
    writeFileSync(join(tmpDir, 'notes.txt'), 'notes');
    writeFileSync(join(tmpDir, 'values.tsv'), 'a\tb');
    writeFileSync(join(tmpDir, 'raw.dat'), '1 2 3');
    writeFileSync(join(tmpDir, 'script.R'), 'x <- 1');
    writeFileSync(join(tmpDir, 'report.pdf'), 'fake');
    writeFileSync(join(tmpDir, 'style.css'), 'body{}');

    const files = scanDataFiles(tmpDir);
    expect(files).toHaveLength(4);
    const names = files.map(f => f.name);
    expect(names).toContain('data.csv');
    expect(names).toContain('notes.txt');
    expect(names).toContain('values.tsv');
    expect(names).toContain('raw.dat');
    expect(names).not.toContain('script.R');
  });

  it('should return empty array for empty directory', () => {
    const files = scanDataFiles(tmpDir);
    expect(files).toEqual([]);
  });

  it('should return empty array for missing directory', () => {
    const files = scanDataFiles(join(tmpDir, 'nonexistent'));
    expect(files).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// formatValidationReport
// ─────────────────────────────────────────────────────────────

describe('formatValidationReport', () => {
  it('should format results with dot-alignment', () => {
    const report = {
      results: [
        { label: 'setup', status: 'PASS', message: null },
        { label: 'analysis-long-name', status: 'FAIL', message: 'error msg' },
      ],
      summary: { pass: 1, fail: 1, warn: 0, skip: 0, total: 2, exitCode: 1, stderr: null },
    };

    const output = formatValidationReport(report, [], 'test.qmd');
    expect(output).toContain('test.qmd');
    expect(output).toContain('chunk "setup"');
    expect(output).toContain('PASS');
    expect(output).toContain('FAIL: error msg');
    expect(output).toContain('...');
  });

  it('should show "No R chunks found" for zero results', () => {
    const report = {
      results: [],
      summary: { pass: 0, fail: 0, warn: 0, skip: 0, total: 0, exitCode: 0, stderr: null },
    };

    const output = formatValidationReport(report);
    expect(output).toContain('No R chunks found');
  });

  it('should include skipped chunks in output', () => {
    const report = {
      results: [
        { label: 'main', status: 'PASS', message: null },
      ],
      summary: { pass: 1, fail: 0, warn: 0, skip: 0, total: 1, exitCode: 0, stderr: null },
    };
    const skipped = [{ label: 'optional', options: { eval: false } }];

    const output = formatValidationReport(report, skipped);
    expect(output).toContain('chunk "optional"');
    expect(output).toContain('SKIP');
    expect(output).toContain('1 passed');
    expect(output).toContain('1 skipped');
  });
});

// ─────────────────────────────────────────────────────────────
// extractSummaryAndChunks
// ─────────────────────────────────────────────────────────────

describe('extractSummaryAndChunks', () => {
  it('should extract markdown headers', () => {
    const content = [
      '# Title',
      '## Section One',
      'Some text',
      '### Subsection',
    ].join('\n');

    const result = extractSummaryAndChunks(content);
    expect(result.headers).toHaveLength(3);
    expect(result.headers[0]).toEqual({ level: 1, text: 'Title' });
    expect(result.headers[1]).toEqual({ level: 2, text: 'Section One' });
    expect(result.headers[2]).toEqual({ level: 3, text: 'Subsection' });
  });

  it('should extract R chunks with label and code', () => {
    const content = [
      '```{r setup}',
      'library(dplyr)',
      '```',
      '',
      '```{r analysis}',
      'df %>% filter(x > 0)',
      '```',
    ].join('\n');

    const result = extractSummaryAndChunks(content);
    expect(result.rChunks).toHaveLength(2);
    expect(result.rChunks[0].label).toBe('setup');
    expect(result.rChunks[0].code).toBe('library(dplyr)');
    expect(result.rChunks[1].label).toBe('analysis');
  });

  it('should handle mixed content with headers and chunks', () => {
    const content = [
      '# Lecture 4',
      '## Introduction',
      '```{r intro-code}',
      'x <- 1',
      '```',
      '## Analysis',
      '```{r analysis-code}',
      'plot(x)',
      '```',
    ].join('\n');

    const result = extractSummaryAndChunks(content);
    expect(result.headers).toHaveLength(3);
    expect(result.rChunks).toHaveLength(2);
  });

  it('should handle empty content', () => {
    const result = extractSummaryAndChunks('');
    expect(result.headers).toHaveLength(0);
    expect(result.rChunks).toHaveLength(0);
  });

  it('should handle content with no R chunks', () => {
    const content = [
      '# Title',
      '',
      'Just plain markdown text.',
      '',
      '## Another Section',
    ].join('\n');

    const result = extractSummaryAndChunks(content);
    expect(result.headers).toHaveLength(2);
    expect(result.rChunks).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// findMatchingLecture
// ─────────────────────────────────────────────────────────────

describe('findMatchingLecture', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-lecture-'));
    mkdirSync(join(tmpDir, 'lectures'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should match by week number', () => {
    writeFileSync(join(tmpDir, 'lectures', 'week-04-regression.qmd'), '');
    writeFileSync(join(tmpDir, 'lectures', 'week-05-anova.qmd'), '');

    const result = findMatchingLecture(join(tmpDir, 'assignment4.qmd'), tmpDir);
    expect(result).not.toBeNull();
    expect(result.path).toContain('week-04');
    expect(result.matchType).toBe('week-number');
  });

  it('should match by topic keyword when no week number match', () => {
    writeFileSync(join(tmpDir, 'lectures', 'intro-to-regression.qmd'), '');
    writeFileSync(join(tmpDir, 'lectures', 'anova-basics.qmd'), '');

    const result = findMatchingLecture(
      join(tmpDir, 'hw_regression_diagnostics.qmd'),
      tmpDir
    );
    expect(result).not.toBeNull();
    expect(result.path).toContain('regression');
    expect(result.matchType).toBe('topic-keyword');
  });

  it('should return null when no match found', () => {
    writeFileSync(join(tmpDir, 'lectures', 'week-01-intro.qmd'), '');

    const result = findMatchingLecture(
      join(tmpDir, 'assignment99_quantum.qmd'),
      tmpDir
    );
    expect(result).toBeNull();
  });

  it('should return null when lectures directory is missing', () => {
    rmSync(join(tmpDir, 'lectures'), { recursive: true });

    const result = findMatchingLecture(join(tmpDir, 'assignment1.qmd'), tmpDir);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// findMatchingLab
// ─────────────────────────────────────────────────────────────

describe('findMatchingLab', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-lab-'));
    mkdirSync(join(tmpDir, 'labs'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should match lab by week number', () => {
    writeFileSync(join(tmpDir, 'labs', 'lab-week03.qmd'), '');
    writeFileSync(join(tmpDir, 'labs', 'lab-week04.qmd'), '');

    const result = findMatchingLab(join(tmpDir, 'hw3.qmd'), tmpDir);
    expect(result).not.toBeNull();
    expect(result.path).toContain('week03');
    expect(result.matchType).toBe('week-number');
  });

  it('should match lab by topic keyword', () => {
    writeFileSync(join(tmpDir, 'labs', 'lab-hypothesis-testing.qmd'), '');

    const result = findMatchingLab(
      join(tmpDir, 'hw_hypothesis_testing.qmd'),
      tmpDir
    );
    expect(result).not.toBeNull();
    expect(result.path).toContain('hypothesis');
    expect(result.matchType).toBe('topic-keyword');
  });

  it('should return null when labs directory is missing', () => {
    rmSync(join(tmpDir, 'labs'), { recursive: true });

    const result = findMatchingLab(join(tmpDir, 'assignment1.qmd'), tmpDir);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// suggestPackageInstall
// ─────────────────────────────────────────────────────────────

describe('suggestPackageInstall', () => {
  it('should suggest install.packages for "no package called" error', () => {
    const msg = "there is no package called 'tidyverse'";
    const suggestion = suggestPackageInstall(msg);
    expect(suggestion).toBe('install.packages("tidyverse")');
  });

  it('should suggest package for known function mapping', () => {
    const msg = 'could not find function "ggplot"';
    const suggestion = suggestPackageInstall(msg);
    expect(suggestion).toBe('install.packages("ggplot2")  # provides ggplot()');
  });

  it('should return null for non-package errors', () => {
    const msg = 'object "x" not found';
    const suggestion = suggestPackageInstall(msg);
    expect(suggestion).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// lintRChunk
// ─────────────────────────────────────────────────────────────

describe('lintRChunk', () => {
  it('should detect setwd() usage', () => {
    const chunk = { code: 'setwd("/home/user/project")' };
    const warnings = lintRChunk(chunk);
    expect(warnings.some(w => w.rule === 'no-setwd')).toBe(true);
  });

  it('should detect absolute paths', () => {
    const chunk = { code: 'read.csv("/Users/dt/data.csv")' };
    const warnings = lintRChunk(chunk);
    expect(warnings.some(w => w.rule === 'no-absolute-paths')).toBe(true);
  });

  it('should detect install.packages() in chunks', () => {
    const chunk = { code: 'install.packages("ggplot2")' };
    const warnings = lintRChunk(chunk);
    expect(warnings.some(w => w.rule === 'no-install-packages')).toBe(true);
  });

  it('should detect rm(list=ls())', () => {
    const chunk = { code: 'rm(list=ls())' };
    const warnings = lintRChunk(chunk);
    expect(warnings.some(w => w.rule === 'no-rm-list-ls')).toBe(true);
  });

  it('should return empty array for clean chunk', () => {
    const chunk = { code: 'x <- mean(c(1, 2, 3))' };
    const warnings = lintRChunk(chunk);
    const nonInfo = warnings.filter(w => w.severity !== 'info');
    expect(nonInfo).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// parseChunkOptions
// ─────────────────────────────────────────────────────────────

describe('parseChunkOptions', () => {
  it('should parse "eval: false" correctly', () => {
    const result = parseChunkOptions('eval: false');
    expect(result).toEqual({ eval: false });
  });

  it('should return empty object for missing input', () => {
    expect(parseChunkOptions('')).toEqual({});
    expect(parseChunkOptions(null)).toEqual({});
    expect(parseChunkOptions(undefined)).toEqual({});
  });

  it('should parse boolean and string values correctly', () => {
    expect(parseChunkOptions('echo: TRUE')).toEqual({ echo: true });
    expect(parseChunkOptions('echo: false')).toEqual({ echo: false });
    expect(parseChunkOptions('fig-width: 8')).toEqual({ 'fig-width': 8 });
  });

  it('should handle multiple calls for different options independently', () => {
    const eval_ = parseChunkOptions('eval: false');
    const echo = parseChunkOptions('echo: true');
    const figWidth = parseChunkOptions('fig-width: 10');

    expect(eval_).toEqual({ eval: false });
    expect(echo).toEqual({ echo: true });
    expect(figWidth).toEqual({ 'fig-width': 10 });
  });
});
