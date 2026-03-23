/**
 * R Validation Pipeline — High-Level Orchestrator
 *
 * Wraps the low-level functions in validators/r-code.js to provide
 * a single-call validation pipeline for .qmd files containing R code.
 *
 * Supports extensible language parameter (only 'r' implemented now).
 *
 * Used by: /teaching:solution, /teaching:assignment, /teaching:lecture, /teaching:slides
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

import {
  extractRChunks,
  shouldValidateChunk,
  buildValidationScript,
  parseValidationOutput,
  formatValidationReport
} from '../validators/r-code.js';

/**
 * Run the full validation pipeline on a file.
 *
 * @param {Object} params - Pipeline parameters
 * @param {string} params.filepath - Path to the .qmd file to validate
 * @param {string} [params.language='r'] - Language to validate ('r' supported; others return unsupported)
 * @param {boolean} [params.debug=false] - Enable debug logging
 * @returns {{ passed: number, failed: number, skipped: number, details: Array<{ chunk: string, status: string, output: string|null, expected: string|null }>, report: string }}
 */
export function validatePipeline({ filepath, language = 'r', debug = false }) {
  // ─── Language gate ───
  const lang = language.toLowerCase();
  if (lang !== 'r') {
    return {
      passed: 0,
      failed: 0,
      skipped: 0,
      details: [],
      report: `Language "${language}" is not supported yet. Currently supported: r`
    };
  }

  // ─── File type gate ───
  if (!filepath.endsWith('.qmd')) {
    return {
      passed: 0,
      failed: 0,
      skipped: 1,
      details: [{ chunk: '(file)', status: 'skipped', output: 'Not a .qmd file', expected: null }],
      report: `Skipped: ${filepath} is not a .qmd file`
    };
  }

  // ─── Read file ───
  let qmdContent;
  try {
    qmdContent = readFileSync(filepath, 'utf-8');
  } catch (err) {
    return {
      passed: 0,
      failed: 1,
      skipped: 0,
      details: [{ chunk: '(file)', status: 'failed', output: `Cannot read file: ${err.message}`, expected: null }],
      report: `Error: Cannot read ${filepath}: ${err.message}`
    };
  }

  // ─── Extract chunks ───
  const allChunks = extractRChunks(qmdContent);

  if (allChunks.length === 0) {
    return {
      passed: 0,
      failed: 0,
      skipped: 0,
      details: [],
      report: 'No R chunks found in file'
    };
  }

  // ─── Filter chunks ───
  const runnableChunks = allChunks.filter(shouldValidateChunk);
  const skippedChunks = allChunks.filter(c => !shouldValidateChunk(c));

  if (debug) {
    console.log(`[validate-pipeline] Total chunks: ${allChunks.length}`);
    console.log(`[validate-pipeline] Runnable: ${runnableChunks.length}, Skipped: ${skippedChunks.length}`);
  }

  if (runnableChunks.length === 0) {
    const details = skippedChunks.map(c => ({
      chunk: c.label,
      status: 'skipped',
      output: 'eval: false',
      expected: null
    }));
    return {
      passed: 0,
      failed: 0,
      skipped: skippedChunks.length,
      details,
      report: formatValidationReport({ results: [], summary: { pass: 0, fail: 0, warn: 0, skip: skippedChunks.length, total: 0, exitCode: 0, stderr: null } }, skippedChunks, filepath)
    };
  }

  // ─── Build validation script ───
  const script = buildValidationScript(runnableChunks, {
    projectRoot: process.cwd()
  });

  // ─── Write temp file ───
  const tmpId = randomBytes(8).toString('hex');
  const tempFile = join(tmpdir(), `scholar-validate-${tmpId}.R`);

  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    writeFileSync(tempFile, script, 'utf-8');

    if (debug) {
      console.log(`[validate-pipeline] Temp script: ${tempFile}`);
    }

    // ─── Execute Rscript ───
    try {
      stdout = execFileSync('Rscript', [tempFile], {
        encoding: 'utf-8',
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (execErr) {
      // execFileSync throws on non-zero exit
      if (execErr.code === 'ENOENT') {
        return {
          passed: 0,
          failed: 1,
          skipped: 0,
          details: [{ chunk: '(system)', status: 'failed', output: 'Rscript not found. Please install R and ensure Rscript is on your PATH.', expected: null }],
          report: 'Error: Rscript not found. Install R from https://cran.r-project.org/ and ensure Rscript is on your PATH.'
        };
      }
      stdout = execErr.stdout || '';
      stderr = execErr.stderr || '';
      exitCode = execErr.status || 1;
    }

    if (debug) {
      console.log(`[validate-pipeline] Exit code: ${exitCode}`);
      if (stderr) console.log(`[validate-pipeline] stderr: ${stderr.slice(0, 500)}`);
    }

    // ─── Parse output ───
    const report = parseValidationOutput(stdout, stderr, exitCode);

    // ─── Build details array ───
    const details = [];

    for (const r of report.results) {
      details.push({
        chunk: r.label,
        status: r.status.toLowerCase(),
        output: r.message || null,
        expected: null
      });
    }

    for (const c of skippedChunks) {
      details.push({
        chunk: c.label,
        status: 'skipped',
        output: 'eval: false',
        expected: null
      });
    }

    const formattedReport = formatValidationReport(report, skippedChunks, filepath);

    return {
      passed: report.summary.pass,
      failed: report.summary.fail,
      skipped: skippedChunks.length,
      details,
      report: formattedReport
    };
  } finally {
    // ─── Cleanup temp file ───
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}
