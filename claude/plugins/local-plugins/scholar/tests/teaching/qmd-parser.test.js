/**
 * Unit Tests: QMD Section Parser
 *
 * Covers edge cases for parsing, matching, and replacing
 * sections in Quarto documents.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  parseQmdContent,
  parseQmdFile,
  matchSection,
  flattenSections,
  replaceSection,
  listSections,
  extractProvenance,
  appendRefinementRecord
} from '../../src/teaching/utils/qmd-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// parseQmdContent edge cases
// ─────────────────────────────────────────────────────────────

describe('parseQmdContent() edge cases', () => {
  it('should handle empty string', () => {
    const parsed = parseQmdContent('');
    expect(parsed.frontmatter).toBe('');
    expect(parsed.sections).toEqual([]);
    expect(parsed.lines.length).toBe(1); // ['']
  });

  it('should handle document with only frontmatter', () => {
    const parsed = parseQmdContent('---\ntitle: "Test"\n---\n');
    expect(parsed.frontmatter).toContain('title: "Test"');
    expect(parsed.sections).toEqual([]);
  });

  it('should handle unclosed frontmatter (no closing ---)', () => {
    const parsed = parseQmdContent('---\ntitle: "Test"\nformat: html\n');
    // Without closing ---, parser returns empty frontmatter
    expect(parsed.frontmatter).toBe('');
    expect(parsed.frontmatterEndLine).toBe(0);
  });

  it('should handle document with no frontmatter, no sections', () => {
    const parsed = parseQmdContent('Just plain text.\nNo headings here.');
    expect(parsed.frontmatter).toBe('');
    expect(parsed.sections).toEqual([]);
    expect(parsed.preamble).toContain('Just plain text');
  });

  it('should skip headings inside fenced code blocks', () => {
    const doc = `---
title: test
---

## Real Section

\`\`\`r
# This is a comment, NOT a heading
x <- 1
\`\`\`

## Another Real Section

Content.`;
    const parsed = parseQmdContent(doc);
    expect(parsed.sections.length).toBe(2);
    expect(parsed.sections[0].title).toBe('Real Section');
    expect(parsed.sections[1].title).toBe('Another Real Section');
  });

  it('should handle multiple code blocks with comments', () => {
    const doc = `## Section

\`\`\`python
# Python heading-like comment
def foo():
    pass
\`\`\`

\`\`\`r
# R heading-like comment
library(tidyverse)
\`\`\`

## Next Section

Done.`;
    const parsed = parseQmdContent(doc);
    expect(parsed.sections.length).toBe(2);
  });

  it('should handle heading with only special chars after #', () => {
    const doc = '## ---\n\nContent under dashes.';
    const parsed = parseQmdContent(doc);
    expect(parsed.sections.length).toBe(1);
    expect(parsed.sections[0].title).toBe('---');
  });

  it('should handle heading levels 1 through 6', () => {
    const doc = `# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6`;
    const parsed = parseQmdContent(doc);
    // H1 is top level, H2 nested under it, etc.
    const flat = flattenSections(parsed.sections);
    expect(flat.length).toBe(6);
    expect(flat.map(s => s.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should handle section with no body (heading at EOF)', () => {
    const doc = '## Only Heading';
    const parsed = parseQmdContent(doc);
    expect(parsed.sections.length).toBe(1);
    expect(parsed.sections[0].body).toBe('');
  });

  it('should handle consecutive headings with no content between', () => {
    const doc = '## First\n## Second\n## Third';
    const parsed = parseQmdContent(doc);
    expect(parsed.sections.length).toBe(3);
    expect(parsed.sections[0].body).toBe('');
    expect(parsed.sections[1].body).toBe('');
  });

  it('should capture Quarto cross-ref IDs from headings', () => {
    const doc = '## My Section {#sec-my-section}\n\nContent.';
    const parsed = parseQmdContent(doc);
    expect(parsed.sections[0].headingId).toBe('sec-my-section');
  });

  it('should handle heading without cross-ref ID', () => {
    const doc = '## Plain Heading\n\nContent.';
    const parsed = parseQmdContent(doc);
    expect(parsed.sections[0].headingId).toBe('');
  });

  it('should capture preamble between frontmatter and first heading', () => {
    const doc = '---\ntitle: test\n---\n\nSome preamble text.\n\n## First Section\n\nContent.';
    const parsed = parseQmdContent(doc);
    expect(parsed.preamble).toContain('Some preamble text');
  });

  it('should preserve raw content', () => {
    const doc = '## Test\n\nHello world.';
    const parsed = parseQmdContent(doc);
    expect(parsed.raw).toBe(doc);
  });
});

// ─────────────────────────────────────────────────────────────
// parseQmdFile (file-based)
// ─────────────────────────────────────────────────────────────

describe('parseQmdFile()', () => {
  const tmpDir = join(__dirname, '../../test-output-qmd-parser');
  const tmpFile = join(tmpDir, 'test.qmd');

  beforeEach(() => {
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should parse a file from disk', () => {
    writeFileSync(tmpFile, '---\ntitle: file test\n---\n\n## Section\n\nContent.', 'utf-8');
    const parsed = parseQmdFile(tmpFile);
    expect(parsed.frontmatter).toContain('title: file test');
    expect(parsed.sections.length).toBe(1);
  });

  it('should throw for nonexistent file', () => {
    expect(() => parseQmdFile('/nonexistent/path.qmd')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// matchSection edge cases
// ─────────────────────────────────────────────────────────────

describe('matchSection() edge cases', () => {
  const sections = parseQmdContent(
    '## Introduction\n\n## Core Concepts\n\n### Definitions\n\n## Summary'
  ).sections;

  it('should return null for empty query', () => {
    // slugify('') returns 'untitled', no section has that slug
    const match = matchSection(sections, '');
    expect(match).toBeNull();
  });

  it('should return null for empty sections array', () => {
    const match = matchSection([], 'anything');
    expect(match).toBeNull();
  });

  it('should prefer exact slug match over fuzzy', () => {
    const match = matchSection(sections, 'Introduction');
    expect(match.title).toBe('Introduction');
  });

  it('should match subsections by title', () => {
    const match = matchSection(sections, 'Definitions');
    expect(match).not.toBeNull();
    expect(match.title).toBe('Definitions');
  });

  it('should not fuzzy match when query slug merely contains section slug (one-directional)', () => {
    // "core-concepts-section" contains "core-concepts", but bidirectional
    // matching was removed to prevent overly permissive matches.
    // The section slug must contain the query slug, not the other way around.
    const match = matchSection(sections, 'Core Concepts Section');
    expect(match).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// flattenSections edge cases
// ─────────────────────────────────────────────────────────────

describe('flattenSections() edge cases', () => {
  it('should handle empty array', () => {
    expect(flattenSections([])).toEqual([]);
  });

  it('should handle sections with no subsections property', () => {
    const sections = [{ title: 'Test', subsections: [] }];
    expect(flattenSections(sections).length).toBe(1);
  });

  it('should handle deeply nested sections', () => {
    const sections = [{
      title: 'L1',
      subsections: [{
        title: 'L2',
        subsections: [{
          title: 'L3',
          subsections: [{ title: 'L4', subsections: [] }]
        }]
      }]
    }];
    expect(flattenSections(sections).length).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────
// replaceSection edge cases
// ─────────────────────────────────────────────────────────────

describe('replaceSection() edge cases', () => {
  it('should handle replacing first section', () => {
    const lines = ['## First', 'content', '## Second', 'more'];
    const section = { startLine: 0, endLine: 2 };
    const result = replaceSection(lines, section, '## Replaced\nNew content');
    expect(result).toContain('## Replaced');
    expect(result).toContain('## Second');
    expect(result).not.toContain('## First');
  });

  it('should handle replacing last section', () => {
    const lines = ['## First', 'content', '## Last', 'end'];
    const section = { startLine: 2, endLine: 4 };
    const result = replaceSection(lines, section, '## New Last\nNew end');
    expect(result).toContain('## First');
    expect(result).toContain('## New Last');
    expect(result).not.toContain('## Last');
  });
});

// ─────────────────────────────────────────────────────────────
// listSections edge cases
// ─────────────────────────────────────────────────────────────

describe('listSections() edge cases', () => {
  it('should return empty string for empty sections', () => {
    expect(listSections([])).toBe('');
  });

  it('should indent subsections', () => {
    const sections = [{
      title: 'Parent',
      subsections: [{ title: 'Child', subsections: [] }]
    }];
    const list = listSections(sections);
    expect(list).toContain('- Parent');
    expect(list).toContain('  - Child');
  });
});

// ─────────────────────────────────────────────────────────────
// extractProvenance edge cases
// ─────────────────────────────────────────────────────────────

describe('extractProvenance() edge cases', () => {
  it('should handle metadata with extra whitespace', () => {
    const fm = '# --- Scholar Generation Metadata ---\n# generated:  2026-01-01 \n# ---';
    const prov = extractProvenance(fm);
    expect(prov.generated).toBe('2026-01-01');
  });

  it('should return null for empty frontmatter', () => {
    expect(extractProvenance('')).toBeNull();
  });

  it('should ignore non-metadata comment lines', () => {
    const fm = '# Just a regular comment\ntitle: test';
    expect(extractProvenance(fm)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// appendRefinementRecord edge cases
// ─────────────────────────────────────────────────────────────

describe('appendRefinementRecord() edge cases', () => {
  it('should handle empty frontmatter', () => {
    const result = appendRefinementRecord('', 'Section', '2026-01-01');
    expect(result).toBe('');
  });

  it('should handle ISO date with time component', () => {
    const fm = '# --- Scholar Generation Metadata ---\n# generated: test\n# ---';
    const result = appendRefinementRecord(fm, 'Test', '2026-03-15T14:30:00.000Z');
    expect(result).toContain('on 2026-03-15');
    expect(result).not.toContain('T14:30');
  });

  it('should handle multiple consecutive refinements', () => {
    let fm = '# --- Scholar Generation Metadata ---\n# generated: test\n# ---';
    fm = appendRefinementRecord(fm, 'Section A', '2026-01-01');
    fm = appendRefinementRecord(fm, 'Section B', '2026-01-02');
    expect(fm).toContain('# refined: "Section A" on 2026-01-01');
    expect(fm).toContain('# refined: "Section B" on 2026-01-02');
  });
});
