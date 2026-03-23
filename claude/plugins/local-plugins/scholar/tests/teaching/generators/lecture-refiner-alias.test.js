/**
 * Unit Tests: Lecture Refiner --revise Alias
 *
 * Tests that --revise works as primary flag and --refine
 * continues to work as a silent alias. Both flags route to
 * the same refineLecture() function via options.refine.
 *
 * The command layer (lecture.md) handles aliasing:
 *   refine: args.revise || args.refine || null
 *
 * So refineLecture() always receives options.refine regardless
 * of which CLI flag the user passed.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  refineLecture
} from '../../../src/teaching/generators/lecture-refiner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Sample QMD content for testing
// ─────────────────────────────────────────────────────────────

const SAMPLE_QMD = `---
title: "Regression Analysis"
# --- Scholar Generation Metadata ---
# generated: 2026-02-01
# ---
---

## Introduction

This lecture covers regression analysis.

## Simple Linear Regression

The simple linear regression model is $Y = \\beta_0 + \\beta_1 X + \\epsilon$.

## Worked Examples

Here is a worked example using R.

\`\`\`{r}
model <- lm(y ~ x, data = df)
summary(model)
\`\`\`

## Summary

Key takeaways from this lecture.
`;

// ─────────────────────────────────────────────────────────────
// --revise / --refine alias behavior
// ─────────────────────────────────────────────────────────────

describe('--revise / --refine alias', () => {
  const tmpDir = join(__dirname, '../../../test-output-revise-alias');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Test 1: options.refine works for full refinement ──

  it('should accept options.refine for full-lecture revision (backward compat)', async () => {
    const filePath = join(tmpDir, 'alias-full-refine.qmd');
    writeFileSync(filePath, SAMPLE_QMD, 'utf-8');

    const result = await refineLecture({
      refine: filePath,
      instruction: 'Use tidyverse syntax throughout'
    });

    expect(result.mode).toBe('full');
    expect(result.file).toBe(filePath);
    expect(result.instruction).toBe('Use tidyverse syntax throughout');
  });

  // ── Test 2: options.refine works for section refinement ──

  it('should accept options.refine for section revision (backward compat)', async () => {
    const filePath = join(tmpDir, 'alias-section-refine.qmd');
    writeFileSync(filePath, SAMPLE_QMD, 'utf-8');

    const result = await refineLecture({
      refine: filePath,
      section: 'Worked Examples',
      instruction: 'Add two more examples with R code'
    });

    expect(result.mode).toBe('section');
    expect(result.section).toBe('Worked Examples');
    expect(result.file).toBe(filePath);
  });

  // ── Test 3: Both flags route to the same refineLecture() function ──

  it('should produce identical results whether called via --revise or --refine', async () => {
    // Both paths set options.refine, so refineLecture sees the same thing
    const fileA = join(tmpDir, 'alias-compare-a.qmd');
    const fileB = join(tmpDir, 'alias-compare-b.qmd');
    writeFileSync(fileA, SAMPLE_QMD, 'utf-8');
    writeFileSync(fileB, SAMPLE_QMD, 'utf-8');

    const resultA = await refineLecture({
      refine: fileA,
      instruction: 'Simplify language'
    });

    const resultB = await refineLecture({
      refine: fileB,
      instruction: 'Simplify language'
    });

    // Both should have identical modes and output structure
    expect(resultA.mode).toBe(resultB.mode);
    expect(resultA.section).toBe(resultB.section);
    expect(resultA.instruction).toBe(resultB.instruction);

    // Content should be equivalent (written to different files)
    const contentA = readFileSync(fileA, 'utf-8');
    const contentB = readFileSync(fileB, 'utf-8');
    expect(contentA).toBe(contentB);
  });

  // ── Test 4: Error message references --revise (missing path) ──

  it('should reference --revise in error when path is missing', async () => {
    await expect(refineLecture({
      instruction: 'test instruction'
    })).rejects.toThrow('--revise requires a path');
  });

  // ── Test 5: Error message references --revise (missing instruction) ──

  it('should reference --revise in error when instruction is missing', async () => {
    await expect(refineLecture({
      refine: '/tmp/some-file.qmd'
    })).rejects.toThrow('--revise requires --instruction');
  });

  // ── Test 6: Error messages do not reference deprecated --refine ──

  it('should not reference --refine in error messages', async () => {
    // Missing path error
    try {
      await refineLecture({ instruction: 'test' });
    } catch (err) {
      expect(err.message).not.toMatch(/--refine requires/);
      expect(err.message).toMatch(/--revise/);
    }

    // Missing instruction error
    try {
      await refineLecture({ refine: '/tmp/test.qmd' });
    } catch (err) {
      expect(err.message).not.toMatch(/--refine requires/);
      expect(err.message).toMatch(/--revise/);
    }
  });

  // ── Test 7: Section refinement with --refine still writes file ──

  it('should write updated content when using options.refine with section', async () => {
    const filePath = join(tmpDir, 'alias-write-check.qmd');
    writeFileSync(filePath, SAMPLE_QMD, 'utf-8');

    await refineLecture({
      refine: filePath,
      section: 'Introduction',
      instruction: 'Make introduction more engaging'
    });

    const content = readFileSync(filePath, 'utf-8');
    // Fallback (no AI) appends comment with instruction
    expect(content).toContain('Refinement instruction: Make introduction more engaging');
  });

  // ── Test 8: Full refinement with --refine still writes file ──

  it('should write updated content when using options.refine for full lecture', async () => {
    const filePath = join(tmpDir, 'alias-full-write.qmd');
    writeFileSync(filePath, SAMPLE_QMD, 'utf-8');

    await refineLecture({
      refine: filePath,
      instruction: 'Convert all code to Python'
    });

    const content = readFileSync(filePath, 'utf-8');
    // Fallback (no AI) appends comment
    expect(content).toContain('Full refinement instruction: Convert all code to Python');
  });

  // ── Test 9: Provenance metadata updated via --refine (alias path) ──

  it('should update provenance metadata when called via options.refine', async () => {
    const filePath = join(tmpDir, 'alias-provenance.qmd');
    writeFileSync(filePath, SAMPLE_QMD, 'utf-8');

    await refineLecture({
      refine: filePath,
      section: 'Summary',
      instruction: 'Add three more bullet points'
    });

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('# refined:');
  });

  // ── Test 10: Return structure is consistent regardless of flag ──

  it('should return consistent result structure with all expected fields', async () => {
    const filePath = join(tmpDir, 'alias-structure.qmd');
    writeFileSync(filePath, SAMPLE_QMD, 'utf-8');

    const result = await refineLecture({
      refine: filePath,
      section: 'Simple Linear Regression',
      instruction: 'Add interpretation guidance'
    });

    // Verify all expected fields are present
    expect(result).toHaveProperty('file');
    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('section');
    expect(result).toHaveProperty('instruction');
    expect(result).toHaveProperty('elapsed');
    expect(result).toHaveProperty('content');

    // Verify correct values
    expect(result.file).toBe(filePath);
    expect(result.mode).toBe('section');
    expect(result.section).toBe('Simple Linear Regression');
    expect(result.instruction).toBe('Add interpretation guidance');
    expect(typeof result.elapsed).toBe('number');
    expect(result.elapsed).toBeGreaterThanOrEqual(0);
    expect(typeof result.content).toBe('string');
    expect(result.content.length).toBeGreaterThan(0);
  });
});
