/**
 * Unit tests for Validate Pipeline orchestrator
 *
 * Tests the high-level validatePipeline() function that wraps
 * the low-level r-code.js functions.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ─────────────────────────────────────────────────────────────
// Dynamic mock setup for ES modules
// ─────────────────────────────────────────────────────────────

let mockExecFileSync;
let mockExtractRChunks;
let mockShouldValidateChunk;
let mockBuildValidationScript;
let mockParseValidationOutput;
let mockFormatValidationReport;

// Mock child_process
const { jest: jestObj } = await import('@jest/globals');

jestObj.unstable_mockModule('child_process', () => ({
  execFileSync: (...args) => mockExecFileSync(...args)
}));

jestObj.unstable_mockModule('../../src/teaching/validators/r-code.js', () => ({
  extractRChunks: (...args) => mockExtractRChunks(...args),
  shouldValidateChunk: (...args) => mockShouldValidateChunk(...args),
  buildValidationScript: (...args) => mockBuildValidationScript(...args),
  parseValidationOutput: (...args) => mockParseValidationOutput(...args),
  formatValidationReport: (...args) => mockFormatValidationReport(...args)
}));

const { validatePipeline } = await import('../../src/teaching/utils/validate-pipeline.js');

// ─────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────

let tempDir;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'scholar-validate-test-'));

  // Default mock implementations
  mockExecFileSync = () => '[PASS] chunk-1\n';
  mockExtractRChunks = () => [
    { label: 'chunk-1', code: 'x <- 1', options: {}, lineNumber: 2 }
  ];
  mockShouldValidateChunk = () => true;
  mockBuildValidationScript = () => '# mock script\ncat("[PASS] chunk-1\\n")';
  mockParseValidationOutput = () => ({
    results: [{ label: 'chunk-1', status: 'PASS', message: null }],
    summary: { pass: 1, fail: 0, warn: 0, skip: 0, total: 1, exitCode: 0, stderr: null }
  });
  mockFormatValidationReport = () => 'test.qmd\n  chunk "chunk-1" ... PASS\n\n  Result: 1 passed';
});

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('validatePipeline', () => {
  describe('chunk extraction', () => {
    it('should extract R chunks from .qmd content via extractRChunks', () => {
      const qmdFile = join(tempDir, 'test.qmd');
      writeFileSync(qmdFile, '```{r}\nx <- 1\n```', 'utf-8');

      let extractCalled = false;
      mockExtractRChunks = (content) => {
        extractCalled = true;
        expect(content).toContain('x <- 1');
        return [{ label: 'chunk-1', code: 'x <- 1', options: {}, lineNumber: 1 }];
      };

      const result = validatePipeline({ filepath: qmdFile });
      expect(extractCalled).toBe(true);
      expect(result.passed).toBe(1);
    });

    it('should return empty details when no R chunks found', () => {
      const qmdFile = join(tempDir, 'empty.qmd');
      writeFileSync(qmdFile, '# Just markdown\nNo code here.', 'utf-8');
      mockExtractRChunks = () => [];

      const result = validatePipeline({ filepath: qmdFile });
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.details).toHaveLength(0);
      expect(result.report).toContain('No R chunks found');
    });
  });

  describe('R script generation', () => {
    it('should call buildValidationScript with runnable chunks', () => {
      const qmdFile = join(tempDir, 'build.qmd');
      writeFileSync(qmdFile, '```{r}\ny <- 2\n```', 'utf-8');

      let buildCalled = false;
      mockBuildValidationScript = (chunks, opts) => {
        buildCalled = true;
        expect(chunks).toHaveLength(1);
        expect(chunks[0].label).toBe('chunk-1');
        return '# script';
      };

      validatePipeline({ filepath: qmdFile });
      expect(buildCalled).toBe(true);
    });
  });

  describe('pass/fail detection', () => {
    it('should detect passing chunks from parseValidationOutput', () => {
      const qmdFile = join(tempDir, 'pass.qmd');
      writeFileSync(qmdFile, '```{r}\nx <- 1\n```', 'utf-8');

      mockParseValidationOutput = () => ({
        results: [{ label: 'chunk-1', status: 'PASS', message: null }],
        summary: { pass: 1, fail: 0, warn: 0, skip: 0, total: 1, exitCode: 0, stderr: null }
      });

      const result = validatePipeline({ filepath: qmdFile });
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should detect failing chunks from parseValidationOutput', () => {
      const qmdFile = join(tempDir, 'fail.qmd');
      writeFileSync(qmdFile, '```{r}\nstop("error")\n```', 'utf-8');

      mockExecFileSync = () => { throw { stdout: '[FAIL] chunk-1: error', stderr: '', status: 1, code: null }; };
      mockParseValidationOutput = () => ({
        results: [{ label: 'chunk-1', status: 'FAIL', message: 'error' }],
        summary: { pass: 0, fail: 1, warn: 0, skip: 0, total: 1, exitCode: 1, stderr: null }
      });
      mockFormatValidationReport = () => 'fail.qmd\n  chunk "chunk-1" ... FAIL: error\n\n  Result: 1 failed';

      const result = validatePipeline({ filepath: qmdFile });
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.details[0].status).toBe('fail');
      expect(result.details[0].output).toBe('error');
    });
  });

  describe('mock Rscript output', () => {
    it('should handle mixed pass/fail/warn output', () => {
      const qmdFile = join(tempDir, 'mixed.qmd');
      writeFileSync(qmdFile, '```{r}\nx <- 1\n```\n```{r}\nstop("err")\n```', 'utf-8');

      mockExtractRChunks = () => [
        { label: 'setup', code: 'x <- 1', options: {}, lineNumber: 1 },
        { label: 'analysis', code: 'stop("err")', options: {}, lineNumber: 4 }
      ];

      mockExecFileSync = () => '[PASS] setup\n[FAIL] analysis: err\n';
      mockParseValidationOutput = () => ({
        results: [
          { label: 'setup', status: 'PASS', message: null },
          { label: 'analysis', status: 'FAIL', message: 'err' }
        ],
        summary: { pass: 1, fail: 1, warn: 0, skip: 0, total: 2, exitCode: 1, stderr: null }
      });
      mockFormatValidationReport = () => 'mixed.qmd\n  chunk "setup" ... PASS\n  chunk "analysis" ... FAIL: err\n\n  Result: 1 passed, 1 failed';

      const result = validatePipeline({ filepath: qmdFile });
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.details).toHaveLength(2);
    });
  });

  describe('language parameter', () => {
    it('should accept language "r" and process normally', () => {
      const qmdFile = join(tempDir, 'r-lang.qmd');
      writeFileSync(qmdFile, '```{r}\nx <- 1\n```', 'utf-8');

      const result = validatePipeline({ filepath: qmdFile, language: 'r' });
      expect(result.passed).toBe(1);
    });

    it('should accept language "R" (case insensitive)', () => {
      const qmdFile = join(tempDir, 'R-lang.qmd');
      writeFileSync(qmdFile, '```{r}\nx <- 1\n```', 'utf-8');

      const result = validatePipeline({ filepath: qmdFile, language: 'R' });
      expect(result.passed).toBe(1);
    });

    it('should return "not supported yet" for python', () => {
      const qmdFile = join(tempDir, 'py.qmd');
      writeFileSync(qmdFile, '```{python}\nx = 1\n```', 'utf-8');

      const result = validatePipeline({ filepath: qmdFile, language: 'python' });
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.report).toContain('not supported yet');
      expect(result.report).toContain('python');
    });

    it('should return "not supported yet" for julia', () => {
      const result = validatePipeline({ filepath: 'test.qmd', language: 'julia' });
      expect(result.report).toContain('not supported yet');
    });
  });

  describe('non-.qmd file handling', () => {
    it('should return skipped result for .md file', () => {
      const mdFile = join(tempDir, 'test.md');
      writeFileSync(mdFile, '# Markdown', 'utf-8');

      const result = validatePipeline({ filepath: mdFile });
      expect(result.skipped).toBe(1);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.details[0].status).toBe('skipped');
      expect(result.report).toContain('not a .qmd file');
    });

    it('should return skipped result for .json file', () => {
      const result = validatePipeline({ filepath: '/tmp/test.json' });
      expect(result.skipped).toBe(1);
    });

    it('should return skipped result for .tex file', () => {
      const result = validatePipeline({ filepath: '/tmp/test.tex' });
      expect(result.skipped).toBe(1);
    });
  });

  describe('Rscript not found error handling', () => {
    it('should return clear error when Rscript is not found (ENOENT)', () => {
      const qmdFile = join(tempDir, 'noR.qmd');
      writeFileSync(qmdFile, '```{r}\nx <- 1\n```', 'utf-8');

      mockExecFileSync = () => {
        const err = new Error('spawn Rscript ENOENT');
        err.code = 'ENOENT';
        throw err;
      };

      const result = validatePipeline({ filepath: qmdFile });
      expect(result.failed).toBe(1);
      expect(result.passed).toBe(0);
      expect(result.details[0].output).toContain('Rscript not found');
      expect(result.report).toContain('Rscript not found');
      expect(result.report).toContain('cran.r-project.org');
    });
  });

  describe('skipped chunks (eval: false)', () => {
    it('should report skipped chunks separately from pass/fail', () => {
      const qmdFile = join(tempDir, 'skip.qmd');
      writeFileSync(qmdFile, '```{r}\n#| eval: false\nx <- 1\n```\n```{r}\ny <- 2\n```', 'utf-8');

      mockExtractRChunks = () => [
        { label: 'chunk-1', code: 'x <- 1', options: { eval: false }, lineNumber: 1 },
        { label: 'chunk-2', code: 'y <- 2', options: {}, lineNumber: 5 }
      ];
      mockShouldValidateChunk = (chunk) => chunk.options.eval !== false;

      const result = validatePipeline({ filepath: qmdFile });
      expect(result.passed).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.details).toHaveLength(2);

      const skippedDetail = result.details.find(d => d.status === 'skipped');
      expect(skippedDetail).toBeDefined();
      expect(skippedDetail.chunk).toBe('chunk-1');
    });
  });

  describe('file read errors', () => {
    it('should handle missing file gracefully', () => {
      const result = validatePipeline({ filepath: '/nonexistent/file.qmd' });
      expect(result.failed).toBe(1);
      expect(result.details[0].output).toContain('Cannot read file');
    });
  });

  describe('default parameters', () => {
    it('should default language to r when not specified', () => {
      const qmdFile = join(tempDir, 'default.qmd');
      writeFileSync(qmdFile, '```{r}\nx <- 1\n```', 'utf-8');

      const result = validatePipeline({ filepath: qmdFile });
      expect(result.passed).toBe(1);
    });
  });
});
