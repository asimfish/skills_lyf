/**
 * Unit Tests: Lecture Refiner
 *
 * Tests refinement logic including validation, section matching,
 * prompt building, AI fallback, and provenance updates.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  refineLecture,
  buildSectionRefinePrompt,
  buildFullRefinePrompt
} from '../../src/teaching/generators/lecture-refiner.js';
import { parseQmdContent } from '../../src/teaching/utils/qmd-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Validation errors
// ─────────────────────────────────────────────────────────────

describe('refineLecture() validation', () => {
  it('should throw if --refine path is missing', async () => {
    await expect(refineLecture({ instruction: 'test' }))
      .rejects.toThrow('--revise requires a path');
  });

  it('should throw if --instruction is missing', async () => {
    await expect(refineLecture({ refine: '/tmp/test.qmd' }))
      .rejects.toThrow('--revise requires --instruction');
  });

  it('should throw for nonexistent file', async () => {
    await expect(refineLecture({
      refine: '/nonexistent/path.qmd',
      instruction: 'test'
    })).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// Section-level refinement (no AI)
// ─────────────────────────────────────────────────────────────

describe('refineLecture() section refinement (no AI)', () => {
  const tmpDir = join(__dirname, '../../test-output-refiner');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should refine a specific section using fallback (no AI)', async () => {
    const qmd = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-01-01
# ---
---

## Introduction

Hello world.

## Methods

Some methods.

## Results

Results here.
`;
    const filePath = join(tmpDir, 'refine-section.qmd');
    writeFileSync(filePath, qmd, 'utf-8');

    const result = await refineLecture({
      refine: filePath,
      section: 'Methods',
      instruction: 'Add more detail about the methods'
    });

    expect(result.mode).toBe('section');
    expect(result.section).toBe('Methods');
    expect(result.file).toBe(filePath);

    // Fallback appends an HTML comment
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Refinement instruction: Add more detail');
    // Provenance updated
    expect(content).toContain('# refined:');
  });

  it('should throw when section not found', async () => {
    const qmd = `---
title: "Test"
---

## Introduction

Hello.
`;
    const filePath = join(tmpDir, 'refine-notfound.qmd');
    writeFileSync(filePath, qmd, 'utf-8');

    await expect(refineLecture({
      refine: filePath,
      section: 'Nonexistent Section',
      instruction: 'test'
    })).rejects.toThrow('not found');
  });

  it('should throw for file with no sections', async () => {
    const qmd = `---
title: "Test"
---

Just text, no headings.
`;
    const filePath = join(tmpDir, 'refine-nosections.qmd');
    writeFileSync(filePath, qmd, 'utf-8');

    await expect(refineLecture({
      refine: filePath,
      instruction: 'test'
    })).rejects.toThrow('No sections found');
  });
});

// ─────────────────────────────────────────────────────────────
// Full-lecture refinement (no AI)
// ─────────────────────────────────────────────────────────────

describe('refineLecture() full refinement (no AI)', () => {
  const tmpDir = join(__dirname, '../../test-output-refiner-full');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should refine entire lecture using fallback (no AI)', async () => {
    const qmd = `---
title: "Full Test"
# --- Scholar Generation Metadata ---
# generated: 2026-01-01
# ---
---

## Section A

Content A.

## Section B

Content B.
`;
    const filePath = join(tmpDir, 'refine-full.qmd');
    writeFileSync(filePath, qmd, 'utf-8');

    const result = await refineLecture({
      refine: filePath,
      instruction: 'Use tidyverse syntax throughout'
    });

    expect(result.mode).toBe('full');
    expect(result.section).toBeNull();

    // Fallback appends comment
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Full refinement instruction: Use tidyverse syntax');
    // Provenance updated with "full lecture"
    expect(content).toContain('# refined: full lecture');
  });

  it('should return elapsed time', async () => {
    const qmd = `---
title: "Timing"
# --- Scholar Generation Metadata ---
# generated: 2026-01-01
# ---
---

## Section

Content.
`;
    const filePath = join(tmpDir, 'refine-timing.qmd');
    writeFileSync(filePath, qmd, 'utf-8');

    const result = await refineLecture({
      refine: filePath,
      instruction: 'test'
    });

    expect(typeof result.elapsed).toBe('number');
    expect(result.elapsed).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Prompt builders
// ─────────────────────────────────────────────────────────────

describe('buildSectionRefinePrompt()', () => {
  const section = {
    title: 'Core Concepts',
    level: 2,
    content: '## Core Concepts\n\nSome content about concepts.',
    slug: 'core-concepts',
    startLine: 5,
    endLine: 8
  };

  it('should include section title and instruction', () => {
    const prompt = buildSectionRefinePrompt(section, 'Add examples', null, null);
    expect(prompt).toContain('Core Concepts');
    expect(prompt).toContain('Add examples');
    expect(prompt).toContain('## heading');
  });

  it('should include previous section context', () => {
    const prev = {
      title: 'Introduction',
      body: 'This lecture introduces the topic of regression analysis.'
    };
    const prompt = buildSectionRefinePrompt(section, 'Expand', prev, null);
    expect(prompt).toContain('Previous Section');
    expect(prompt).toContain('Introduction');
  });

  it('should include next section context', () => {
    const next = { title: 'Summary' };
    const prompt = buildSectionRefinePrompt(section, 'Expand', null, next);
    expect(prompt).toContain('Next Section');
    expect(prompt).toContain('Summary');
  });

  it('should include output requirements', () => {
    const prompt = buildSectionRefinePrompt(section, 'test', null, null);
    expect(prompt).toContain('Output Requirements');
    expect(prompt).toContain('Do NOT include any frontmatter');
  });

  it('should handle level 3 section', () => {
    const l3 = { ...section, level: 3, title: 'Sub Concept' };
    const prompt = buildSectionRefinePrompt(l3, 'test', null, null);
    expect(prompt).toContain('### heading');
  });
});

describe('buildFullRefinePrompt()', () => {
  it('should include full body and instruction', () => {
    const parsed = parseQmdContent(
      '---\ntitle: test\n---\n\n## Section A\n\nContent A.\n\n## Section B\n\nContent B.'
    );
    const prompt = buildFullRefinePrompt(parsed, 'Use Python instead of R');
    expect(prompt).toContain('Section A');
    expect(prompt).toContain('Section B');
    expect(prompt).toContain('Use Python instead of R');
    expect(prompt).toContain('global refinement');
  });

  it('should not include frontmatter in prompt', () => {
    const parsed = parseQmdContent(
      '---\ntitle: secret\n---\n\n## Section\n\nContent.'
    );
    const prompt = buildFullRefinePrompt(parsed, 'test');
    // The frontmatter itself is not included, only the body
    expect(prompt).not.toContain('title: secret');
  });
});
