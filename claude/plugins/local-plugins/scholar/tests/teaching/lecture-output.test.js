/**
 * Tests for Phase 1: Lecture Output Features (v2.5.0)
 *
 * F1: --output-dir flag with filename conventions
 * F2: Generation metadata as YAML comments in frontmatter
 */

import { describe, it, expect } from '@jest/globals';

import { slugify, generateLectureFilename } from '../../src/teaching/utils/slugify.js';
import {
  generateProvenanceComments,
  formatLectureNotesAsQuarto
} from '../../src/teaching/formatters/quarto-notes.js';
import { generateOutputPath } from '../../src/teaching/utils/dry-run.js';

// ─────────────────────────────────────────────────────────────
// F1: Filename Convention Tests
// ─────────────────────────────────────────────────────────────

describe('F1: slugify()', () => {
  it('should convert topic to lowercase hyphenated slug', () => {
    expect(slugify('Multiple Linear Regression')).toBe('multiple-linear-regression');
  });

  it('should strip non-alphanumeric characters', () => {
    expect(slugify('ANOVA (One-Way)')).toBe('anova-one-way');
  });

  it('should trim leading/trailing hyphens', () => {
    expect(slugify('  Week 03: RCBD  ')).toBe('week-03-rcbd');
  });

  it('should collapse consecutive non-alphanumeric characters', () => {
    expect(slugify('foo---bar___baz')).toBe('foo-bar-baz');
  });

  it('should return "untitled" for empty/null input', () => {
    expect(slugify('')).toBe('untitled');
    expect(slugify(null)).toBe('untitled');
    expect(slugify(undefined)).toBe('untitled');
  });

  it('should handle single-word topics', () => {
    expect(slugify('ANOVA')).toBe('anova');
  });
});

describe('F1: generateLectureFilename()', () => {
  describe('without --from-plan', () => {
    it('should produce lecture-{slug}.qmd', () => {
      expect(generateLectureFilename({ topic: 'RCBD' }))
        .toBe('lecture-rcbd.qmd');
    });

    it('should slugify multi-word topics', () => {
      expect(generateLectureFilename({ topic: 'Multiple Linear Regression' }))
        .toBe('lecture-multiple-linear-regression.qmd');
    });

    it('should handle missing topic gracefully', () => {
      expect(generateLectureFilename({}))
        .toBe('lecture-untitled.qmd');
    });
  });

  describe('with --from-plan', () => {
    it('should produce week{NN}-{slug}.qmd', () => {
      expect(generateLectureFilename({ topic: 'RCBD', fromPlan: 'week08' }))
        .toBe('week08-rcbd.qmd');
    });

    it('should zero-pad single-digit week numbers', () => {
      expect(generateLectureFilename({ topic: 'Intro', fromPlan: 'week3' }))
        .toBe('week03-intro.qmd');
    });

    it('should extract week number from bare digits', () => {
      expect(generateLectureFilename({ topic: 'Intro', fromPlan: '5' }))
        .toBe('week05-intro.qmd');
    });

    it('should handle double-digit weeks without padding', () => {
      expect(generateLectureFilename({ topic: 'Review', fromPlan: 'week15' }))
        .toBe('week15-review.qmd');
    });

    it('should use fromPlan as topic fallback', () => {
      expect(generateLectureFilename({ fromPlan: 'week08' }))
        .toBe('week08-week08.qmd');
    });
  });
});

describe('F1: generateOutputPath() (dry-run integration)', () => {
  it('should include filename without directory when no outputDir', () => {
    const path = generateOutputPath('lecture', { topic: 'ANOVA' });
    expect(path).toBe('lecture-anova.qmd');
  });

  it('should prepend outputDir with trailing slash', () => {
    const path = generateOutputPath('lecture', {
      topic: 'ANOVA',
      outputDir: 'content/lectures'
    });
    expect(path).toBe('content/lectures/lecture-anova.qmd');
  });

  it('should handle outputDir with trailing slash', () => {
    const path = generateOutputPath('lecture', {
      topic: 'ANOVA',
      outputDir: 'content/lectures/'
    });
    expect(path).toBe('content/lectures/lecture-anova.qmd');
  });

  it('should use week-based filename with fromPlan', () => {
    const path = generateOutputPath('lecture', {
      topic: 'RCBD',
      fromPlan: 'week08',
      outputDir: 'content/lectures/'
    });
    expect(path).toBe('content/lectures/week08-rcbd.qmd');
  });

  it('should maintain backward compat for non-lecture commands', () => {
    const path = generateOutputPath('exam', { format: 'md' });
    // Non-lecture commands use original date-based pattern
    expect(path).toMatch(/^exam-.*\.md$/);
  });
});

// ─────────────────────────────────────────────────────────────
// F2: Generation Metadata Tests
// ─────────────────────────────────────────────────────────────

describe('F2: generateProvenanceComments()', () => {
  const sampleProvenance = {
    generated: '2026-02-03T14:30:00.000Z',
    scholar_version: '2.5.0',
    prompt_template: 'lecture-notes.md (v2.4)',
    config_source: '.flow/teach-config.yml',
    lesson_plan: 'content/lesson-plans/week08.yml',
    teaching_style: '.claude/teaching-style.local.md',
    generation_time: '45s',
    sections: 8
  };

  it('should produce YAML comment lines (starting with #)', () => {
    const comments = generateProvenanceComments(sampleProvenance);
    const lines = comments.split('\n');
    lines.forEach(line => {
      expect(line.startsWith('#')).toBe(true);
    });
  });

  it('should include all required fields', () => {
    const comments = generateProvenanceComments(sampleProvenance);
    expect(comments).toContain('# generated: 2026-02-03T14:30:00.000Z');
    expect(comments).toContain('# scholar_version: 2.5.0');
    expect(comments).toContain('# prompt_template: lecture-notes.md (v2.4)');
    expect(comments).toContain('# config_source: .flow/teach-config.yml');
    expect(comments).toContain('# lesson_plan: content/lesson-plans/week08.yml');
    expect(comments).toContain('# teaching_style: .claude/teaching-style.local.md');
    expect(comments).toContain('# generation_time: 45s');
    expect(comments).toContain('# sections: 8');
  });

  it('should have opening and closing delimiters', () => {
    const comments = generateProvenanceComments(sampleProvenance);
    expect(comments).toContain('# --- Scholar Generation Metadata ---');
    expect(comments.trimEnd().endsWith('# ---')).toBe(true);
  });

  it('should omit lesson_plan when null', () => {
    const comments = generateProvenanceComments({
      ...sampleProvenance,
      lesson_plan: null
    });
    expect(comments).not.toContain('lesson_plan');
  });

  it('should omit teaching_style when null', () => {
    const comments = generateProvenanceComments({
      ...sampleProvenance,
      teaching_style: null
    });
    expect(comments).not.toContain('teaching_style');
  });
});

describe('F2: Metadata in Quarto frontmatter', () => {
  const minimalLectureNotes = {
    title: 'Test Lecture',
    topic: 'Testing',
    course_code: '',
    level: 'undergraduate',
    generated_at: new Date().toISOString(),
    teaching_style: {},
    learning_objectives: ['Learn testing'],
    sections: [{
      id: 'S1', type: 'introduction', title: 'Intro',
      level: 1, estimated_pages: 1, content: 'Hello.'
    }],
    references: []
  };

  it('should include provenance comments in frontmatter when provided', () => {
    const provenance = {
      generated: '2026-02-03T14:30:00.000Z',
      scholar_version: '2.5.0',
      prompt_template: 'lecture-notes.md (v2.4)',
      config_source: '.flow/teach-config.yml',
      lesson_plan: null,
      teaching_style: null,
      generation_time: '10s',
      sections: 1
    };

    const qmd = formatLectureNotesAsQuarto(minimalLectureNotes, {
      formats: ['html'],
      language: 'r',
      provenance
    });

    // Metadata should appear as comments inside the YAML frontmatter
    // Extract frontmatter: everything between first --- and the closing ---
    const fmMatch = qmd.match(/^---\n([\s\S]*?)\n---$/m);
    expect(fmMatch).not.toBeNull();
    const frontmatter = fmMatch[1];
    expect(frontmatter).toContain('# --- Scholar Generation Metadata ---');
    expect(frontmatter).toContain('# scholar_version: 2.5.0');
    expect(frontmatter).toContain('# generation_time: 10s');
  });

  it('should NOT include metadata when provenance is null', () => {
    const qmd = formatLectureNotesAsQuarto(minimalLectureNotes, {
      formats: ['html'],
      language: 'r'
      // no provenance
    });

    expect(qmd).not.toContain('Scholar Generation Metadata');
  });

  it('should not break YAML parsing (comments are ignored by parsers)', () => {
    const provenance = {
      generated: '2026-02-03T14:30:00.000Z',
      scholar_version: '2.5.0',
      prompt_template: 'lecture-notes.md (v2.4)',
      config_source: '.flow/teach-config.yml',
      lesson_plan: null,
      teaching_style: null,
      generation_time: '10s',
      sections: 1
    };

    const qmd = formatLectureNotesAsQuarto(minimalLectureNotes, {
      formats: ['html'],
      language: 'r',
      provenance
    });

    // The title key should still be valid YAML
    expect(qmd).toMatch(/^---\n/);
    expect(qmd).toContain('title: "Test Lecture"');
    expect(qmd).toContain('format:');
    // Metadata should appear AFTER title, BEFORE format section
    const titleIdx = qmd.indexOf('title:');
    const metadataIdx = qmd.indexOf('# --- Scholar Generation Metadata ---');
    const formatIdx = qmd.indexOf('format:');
    expect(metadataIdx).toBeGreaterThan(titleIdx);
    expect(formatIdx).toBeGreaterThan(metadataIdx);
  });
});

// ─────────────────────────────────────────────────────────────
// Backward Compatibility
// ─────────────────────────────────────────────────────────────

describe('Backward compatibility', () => {
  it('should work without any new flags (no outputDir, no provenance)', () => {
    const lectureNotes = {
      title: 'Old Style',
      topic: 'Testing',
      course_code: 'STAT 440',
      level: 'undergraduate',
      generated_at: new Date().toISOString(),
      teaching_style: {},
      learning_objectives: ['Learn'],
      sections: [{
        id: 'S1', type: 'introduction', title: 'Intro',
        level: 1, estimated_pages: 1, content: 'Content.'
      }],
      references: []
    };

    // No provenance = no metadata comments
    const qmd = formatLectureNotesAsQuarto(lectureNotes, {
      formats: ['html', 'pdf'],
      language: 'r'
    });

    expect(qmd).toContain('title: "Old Style"');
    expect(qmd).toContain('subtitle: "STAT 440"');
    expect(qmd).not.toContain('Scholar Generation Metadata');
  });
});
