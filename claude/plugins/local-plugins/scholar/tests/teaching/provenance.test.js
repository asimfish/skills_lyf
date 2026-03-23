/**
 * Tests for ProvenanceTracer
 *
 * Validates the `/teaching:config trace` provenance tracing engine
 * which reads Scholar Generation Metadata from generated files and
 * enriches it with config layer info and reproducibility hashes.
 */

import { jest } from '@jest/globals';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ProvenanceTracer, ProvenanceError } from '../../src/teaching/config/provenance.js';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/**
 * Create a unique temp directory for each test
 * @returns {string} Path to temp directory
 */
function createTempDir() {
  const dir = join(
    tmpdir(),
    `provenance-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Create a QMD file with Scholar Generation Metadata
 * @param {string} dir - Directory to create file in
 * @param {string} name - File name
 * @param {Object} [provenance] - Provenance fields to include
 * @param {Object} [options] - Additional options
 * @param {string} [options.title] - Document title
 * @param {boolean} [options.noFrontmatter] - Skip frontmatter entirely
 * @param {boolean} [options.noMetadata] - Include frontmatter but no metadata block
 * @param {string} [options.extraFrontmatter] - Extra YAML to add after metadata
 * @returns {string} Full path to created file
 */
function createQmdFile(dir, name, provenance = {}, options = {}) {
  if (options.noFrontmatter) {
    const content = `# ${options.title || 'Test Lecture'}\n\nSome content here.\n`;
    const filePath = join(dir, name);
    writeFileSync(filePath, content);
    return filePath;
  }

  const title = options.title || provenance.title || 'Test Lecture';
  let frontmatterLines = [`title: "${title}"`];

  if (!options.noMetadata) {
    const metaLines = [
      '# --- Scholar Generation Metadata ---',
      `# generated: ${provenance.generated || '2026-02-09T15:30:00Z'}`,
      `# scholar_version: ${provenance.scholar_version || '2.7.0'}`,
      `# prompt_template: ${provenance.prompt_template || 'lecture-notes.md (v2.0)'}`
    ];

    if (provenance.config_source !== undefined) {
      metaLines.push(`# config_source: ${provenance.config_source}`);
    } else if (provenance.config_source !== null && !('config_source' in provenance)) {
      metaLines.push('# config_source: .flow/teach-config.yml');
    }

    if (provenance.lesson_plan) {
      metaLines.push(`# lesson_plan: ${provenance.lesson_plan}`);
    }

    if (provenance.teaching_style) {
      metaLines.push(`# teaching_style: ${provenance.teaching_style}`);
    }

    metaLines.push(`# generation_time: ${provenance.generation_time || '42s'}`);
    metaLines.push(`# sections: ${provenance.sections || '12'}`);

    // Handle extra provenance fields (e.g., refined)
    if (provenance._extraLines) {
      for (const line of provenance._extraLines) {
        metaLines.push(line);
      }
    }

    metaLines.push('# ---');
    frontmatterLines = frontmatterLines.concat(metaLines);
  }

  if (options.extraFrontmatter) {
    frontmatterLines.push(options.extraFrontmatter);
  }

  frontmatterLines.push('format: html');

  const content = `---\n${frontmatterLines.join('\n')}\n---\n\n# Content here\n\nSome body text.\n`;
  const filePath = join(dir, name);
  writeFileSync(filePath, content);
  return filePath;
}

describe('ProvenanceTracer', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------
  describe('constructor', () => {
    it('should create tracer with default options', () => {
      const tracer = new ProvenanceTracer();
      expect(tracer.cwd).toBe(process.cwd());
      expect(tracer.debug).toBe(false);
    });

    it('should accept custom cwd', () => {
      const tracer = new ProvenanceTracer({ cwd: '/tmp/test' });
      expect(tracer.cwd).toBe('/tmp/test');
    });

    it('should accept debug option', () => {
      const tracer = new ProvenanceTracer({ debug: true });
      expect(tracer.debug).toBe(true);
    });

    it('should accept both cwd and debug', () => {
      const tracer = new ProvenanceTracer({ cwd: tempDir, debug: true });
      expect(tracer.cwd).toBe(tempDir);
      expect(tracer.debug).toBe(true);
    });

    it('should handle empty options object', () => {
      const tracer = new ProvenanceTracer({});
      expect(tracer.cwd).toBe(process.cwd());
      expect(tracer.debug).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // ProvenanceError
  // ---------------------------------------------------------------
  describe('ProvenanceError', () => {
    it('should be an instance of Error', () => {
      const err = new ProvenanceError('test error');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ProvenanceError);
    });

    it('should have correct name', () => {
      const err = new ProvenanceError('test');
      expect(err.name).toBe('ProvenanceError');
    });

    it('should store message', () => {
      const err = new ProvenanceError('something went wrong');
      expect(err.message).toBe('something went wrong');
    });

    it('should store file when provided', () => {
      const err = new ProvenanceError('fail', { file: '/some/path.qmd' });
      expect(err.file).toBe('/some/path.qmd');
    });

    it('should default file to null', () => {
      const err = new ProvenanceError('fail');
      expect(err.file).toBeNull();
    });

    it('should handle empty options', () => {
      const err = new ProvenanceError('fail', {});
      expect(err.file).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // trace — file with full provenance
  // ---------------------------------------------------------------
  describe('trace — full provenance', () => {
    it('should parse all provenance fields from a fully annotated file', async () => {
      const _filePath = createQmdFile(tempDir, 'week-04.qmd', {
        generated: '2026-02-09T15:30:00Z',
        scholar_version: '2.7.0',
        prompt_template: 'lecture-notes.md (v2.0)',
        config_source: '.flow/teach-config.yml',
        lesson_plan: '.flow/lesson-plans.yml',
        teaching_style: '.claude/teaching-style.local.md',
        generation_time: '42s',
        sections: '12'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('week-04.qmd');

      expect(result.found).toBe(true);
      expect(result.provenance).not.toBeNull();
      expect(result.provenance.generated).toBe('2026-02-09T15:30:00Z');
      expect(result.provenance.scholar_version).toBe('2.7.0');
      expect(result.provenance.prompt_template).toBe('lecture-notes.md (v2.0)');
      expect(result.provenance.config_source).toBe('.flow/teach-config.yml');
      expect(result.provenance.lesson_plan).toBe('.flow/lesson-plans.yml');
      expect(result.provenance.teaching_style).toBe('.claude/teaching-style.local.md');
      expect(result.provenance.generation_time).toBe('42s');
      expect(result.provenance.sections).toBe('12');
    });

    it('should extract prompt template info with version', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        prompt_template: 'lecture-notes.md (v2.0)'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.prompt).not.toBeNull();
      expect(result.prompt.template).toBe('lecture-notes.md');
      expect(result.prompt.version).toBe('2.0');
    });

    it('should extract prompt template without version', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        prompt_template: 'quiz.md'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.prompt).not.toBeNull();
      expect(result.prompt.template).toBe('quiz.md');
      expect(result.prompt.version).toBeNull();
    });

    it('should return file name in result', async () => {
      createQmdFile(tempDir, 'week-04_model-diagnostics.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('week-04_model-diagnostics.qmd');

      expect(result.fileName).toBe('week-04_model-diagnostics.qmd');
    });

    it('should return resolved absolute file path', async () => {
      createQmdFile(tempDir, 'test.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.file).toBe(join(tempDir, 'test.qmd'));
    });
  });

  // ---------------------------------------------------------------
  // trace — minimal provenance
  // ---------------------------------------------------------------
  describe('trace — minimal provenance', () => {
    it('should handle file with only required provenance fields', async () => {
      // Create a file with only generated, scholar_version, prompt_template
      const content = `---
title: "Minimal"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: 2.7.0
# prompt_template: exam.md
# ---
format: html
---

# Content
`;
      writeFileSync(join(tempDir, 'minimal.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('minimal.qmd');

      expect(result.found).toBe(true);
      expect(result.provenance.generated).toBe('2026-02-09T10:00:00Z');
      expect(result.provenance.scholar_version).toBe('2.7.0');
      expect(result.provenance.prompt_template).toBe('exam.md');
      expect(result.provenance.config_source).toBeUndefined();
      expect(result.provenance.lesson_plan).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------
  // trace — file without provenance
  // ---------------------------------------------------------------
  describe('trace — no provenance', () => {
    it('should return found=false for file without metadata block', async () => {
      createQmdFile(tempDir, 'plain.qmd', {}, { noMetadata: true });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('plain.qmd');

      expect(result.found).toBe(false);
      expect(result.provenance).toBeNull();
      expect(result.prompt).toBeNull();
      expect(result.layers).toEqual([]);
      expect(result.configHash).toBeNull();
    });

    it('should return informative formatted message when no metadata found', async () => {
      createQmdFile(tempDir, 'plain.qmd', {}, { noMetadata: true });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('plain.qmd');

      // Strip ANSI codes for assertion
      const stripped = result.formatted.replace(/\x1b\[[0-9;]*m/g, '');
      expect(stripped).toContain('No Scholar generation metadata found in: plain.qmd');
      expect(stripped).toContain('provenance tracking (v2.5.0+)');
    });
  });

  // ---------------------------------------------------------------
  // trace — non-existent file
  // ---------------------------------------------------------------
  describe('trace — non-existent file', () => {
    it('should throw ProvenanceError for missing file', async () => {
      const tracer = new ProvenanceTracer({ cwd: tempDir });

      await expect(tracer.trace('does-not-exist.qmd'))
        .rejects.toThrow(ProvenanceError);
    });

    it('should include file path in error', async () => {
      const tracer = new ProvenanceTracer({ cwd: tempDir });

      try {
        await tracer.trace('missing.qmd');
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err.file).toBe(join(tempDir, 'missing.qmd'));
        expect(err.message).toContain('File not found');
      }
    });
  });

  // ---------------------------------------------------------------
  // trace — non-.qmd file
  // ---------------------------------------------------------------
  describe('trace — non-QMD files', () => {
    it('should work with .md files that contain Scholar metadata', async () => {
      const content = `---
title: "Notes"
# --- Scholar Generation Metadata ---
# generated: 2026-02-08T12:00:00Z
# scholar_version: 2.7.0
# prompt_template: notes.md
# ---
---

# Notes content
`;
      writeFileSync(join(tempDir, 'notes.md'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('notes.md');

      expect(result.found).toBe(true);
      expect(result.provenance.scholar_version).toBe('2.7.0');
    });
  });

  // ---------------------------------------------------------------
  // trace — empty file
  // ---------------------------------------------------------------
  describe('trace — empty file', () => {
    it('should handle empty file gracefully', async () => {
      writeFileSync(join(tempDir, 'empty.qmd'), '');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('empty.qmd');

      expect(result.found).toBe(false);
      expect(result.provenance).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // trace — file with no frontmatter
  // ---------------------------------------------------------------
  describe('trace — no frontmatter', () => {
    it('should return found=false for file without YAML frontmatter', async () => {
      createQmdFile(tempDir, 'no-fm.qmd', {}, { noFrontmatter: true });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('no-fm.qmd');

      expect(result.found).toBe(false);
      expect(result.provenance).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // Layer detection
  // ---------------------------------------------------------------
  describe('layer detection', () => {
    it('should always include Layer 1 as active', async () => {
      // Minimal provenance without config_source, teaching_style, lesson_plan
      const content = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: 2.7.0
# prompt_template: exam.md
# ---
---
`;
      writeFileSync(join(tempDir, 'test.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      const layer1 = result.layers.find(l => l.layer === 1);
      expect(layer1).toBeDefined();
      expect(layer1.active).toBe(true);
      expect(layer1.name).toBe('Plugin defaults');
    });

    it('should detect Layer 2 when config_source is present', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        config_source: '.flow/teach-config.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      const layer2 = result.layers.find(l => l.layer === 2);
      expect(layer2.active).toBe(true);
      expect(layer2.source).toBe('.flow/teach-config.yml');
    });

    it('should detect Layer 2 when teaching_style is present', async () => {
      // Provide only teaching_style, no config_source
      const content = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: 2.7.0
# prompt_template: exam.md
# teaching_style: .claude/teaching-style.local.md
# ---
---
`;
      writeFileSync(join(tempDir, 'test.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      const layer2 = result.layers.find(l => l.layer === 2);
      expect(layer2.active).toBe(true);
    });

    it('should detect Layer 4 when lesson_plan is present', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        lesson_plan: '.flow/lesson-plans.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      const layer4 = result.layers.find(l => l.layer === 4);
      expect(layer4.active).toBe(true);
      expect(layer4.source).toBe('.flow/lesson-plans.yml');
    });

    it('should mark Layer 4 as not active when no lesson_plan', async () => {
      // No lesson_plan field
      const content = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: 2.7.0
# prompt_template: exam.md
# config_source: .flow/teach-config.yml
# ---
---
`;
      writeFileSync(join(tempDir, 'test.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      const layer4 = result.layers.find(l => l.layer === 4);
      expect(layer4.active).toBe(false);
    });

    it('should detect all 4 layers when fully specified', async () => {
      createQmdFile(tempDir, 'full.qmd', {
        config_source: '.flow/teach-config.yml',
        teaching_style: '.claude/teaching-style.local.md',
        lesson_plan: '.flow/lesson-plans.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('full.qmd');

      expect(result.layers).toHaveLength(4);
      expect(result.layers.filter(l => l.active)).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------
  // Config hash
  // ---------------------------------------------------------------
  describe('config hash', () => {
    it('should be deterministic for same input', async () => {
      createQmdFile(tempDir, 'a.qmd', {
        scholar_version: '2.7.0',
        prompt_template: 'lecture-notes.md (v2.0)',
        config_source: '.flow/teach-config.yml'
      });
      createQmdFile(tempDir, 'b.qmd', {
        scholar_version: '2.7.0',
        prompt_template: 'lecture-notes.md (v2.0)',
        config_source: '.flow/teach-config.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const resultA = await tracer.trace('a.qmd');
      const resultB = await tracer.trace('b.qmd');

      expect(resultA.configHash).toBe(resultB.configHash);
    });

    it('should differ for different config inputs', async () => {
      createQmdFile(tempDir, 'a.qmd', {
        scholar_version: '2.7.0',
        prompt_template: 'lecture-notes.md (v2.0)',
        config_source: '.flow/teach-config.yml'
      });
      createQmdFile(tempDir, 'b.qmd', {
        scholar_version: '2.6.0',
        prompt_template: 'exam.md',
        config_source: '.flow/teach-config.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const resultA = await tracer.trace('a.qmd');
      const resultB = await tracer.trace('b.qmd');

      expect(resultA.configHash).not.toBe(resultB.configHash);
    });

    it('should be 7 characters long', async () => {
      createQmdFile(tempDir, 'test.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.configHash).toHaveLength(7);
    });

    it('should be a hex string', async () => {
      createQmdFile(tempDir, 'test.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.configHash).toMatch(/^[0-9a-f]{7}$/);
    });

    it('should be null when no provenance found', async () => {
      createQmdFile(tempDir, 'no-meta.qmd', {}, { noMetadata: true });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('no-meta.qmd');

      expect(result.configHash).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // Formatted output
  // ---------------------------------------------------------------
  describe('formatted output', () => {
    /**
     * Strip ANSI escape codes from a string
     * @param {string} str - String with ANSI codes
     * @returns {string} Clean string
     */
    function stripAnsi(str) {
      return str.replace(/\x1b\[[0-9;]*m/g, '');
    }

    it('should contain file name in header', async () => {
      createQmdFile(tempDir, 'week-04.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('week-04.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('=== Provenance: week-04.qmd ===');
    });

    it('should contain generation timestamp', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        generated: '2026-02-09T15:30:00Z'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('Generated: 2026-02-09T15:30:00Z');
    });

    it('should contain Scholar version', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        scholar_version: '2.7.0'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('Scholar version: 2.7.0');
    });

    it('should contain layer section', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        config_source: '.flow/teach-config.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('Config layers applied:');
      expect(clean).toContain('Layer 1: Plugin defaults');
      expect(clean).toContain('Layer 2: Course style');
    });

    it('should contain config hash', async () => {
      createQmdFile(tempDir, 'test.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('Config hash:');
      expect(clean).toMatch(/Config hash: [0-9a-f]{7}/);
    });

    it('should contain prompt info when available', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        prompt_template: 'lecture-notes.md (v2.0)'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('Prompt: lecture-notes.md');
      expect(clean).toContain('Version: 2.0');
    });

    it('should show inactive layers as dim', async () => {
      // No lesson_plan = Layer 4 inactive
      const content = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: 2.7.0
# prompt_template: exam.md
# ---
---
`;
      writeFileSync(join(tempDir, 'test.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('Layer 4: Week lesson plan (not active)');
    });

    it('should show variables section when variables exist', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        config_source: '.flow/teach-config.yml',
        generation_time: '42s',
        sections: '12'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');
      const clean = stripAnsi(result.formatted);

      expect(clean).toContain('Key variables resolved:');
      expect(clean).toContain('sections: 12');
      expect(clean).toContain('generation_time: 42s');
    });
  });

  // ---------------------------------------------------------------
  // JSON output structure
  // ---------------------------------------------------------------
  describe('JSON output schema', () => {
    it('should have expected top-level fields', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        config_source: '.flow/teach-config.yml',
        lesson_plan: '.flow/lesson-plans.yml',
        teaching_style: '.claude/teaching-style.local.md'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result).toHaveProperty('file');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('provenance');
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('layers');
      expect(result).toHaveProperty('configHash');
      expect(result).toHaveProperty('variables');
      expect(result).toHaveProperty('found');
      expect(result).toHaveProperty('formatted');
    });

    it('should have serializable provenance object', async () => {
      createQmdFile(tempDir, 'test.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      // Should be JSON-serializable (no circular refs etc.)
      const json = JSON.stringify(result.provenance);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(result.provenance);
    });

    it('should produce valid JSON when formatted is excluded', async () => {
      createQmdFile(tempDir, 'test.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      const { formatted: _formatted, ...data } = result;
      const json = JSON.stringify(data, null, 2);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should have layers as an array of objects', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        config_source: '.flow/teach-config.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(Array.isArray(result.layers)).toBe(true);
      for (const layer of result.layers) {
        expect(layer).toHaveProperty('layer');
        expect(layer).toHaveProperty('name');
        expect(layer).toHaveProperty('active');
        expect(typeof layer.layer).toBe('number');
        expect(typeof layer.name).toBe('string');
        expect(typeof layer.active).toBe('boolean');
      }
    });
  });

  // ---------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle malformed frontmatter gracefully', async () => {
      const content = `---
title: "Test
malformed yaml here: [
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: 2.7.0
# ---
---
`;
      writeFileSync(join(tempDir, 'malformed.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      // Should not throw, even though YAML is malformed. We parse metadata comments, not YAML.
      const result = await tracer.trace('malformed.qmd');

      expect(result.found).toBe(true);
      expect(result.provenance.scholar_version).toBe('2.7.0');
    });

    it('should resolve relative paths against cwd', async () => {
      const subDir = join(tempDir, 'lectures');
      mkdirSync(subDir, { recursive: true });
      createQmdFile(subDir, 'week-04.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('lectures/week-04.qmd');

      expect(result.file).toBe(join(tempDir, 'lectures', 'week-04.qmd'));
      expect(result.found).toBe(true);
    });

    it('should handle absolute paths within cwd', async () => {
      const filePath = createQmdFile(tempDir, 'absolute.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace(filePath);

      expect(result.found).toBe(true);
      expect(result.file).toBe(filePath);
    });

    it('should reject absolute paths outside cwd', async () => {
      const filePath = createQmdFile(tempDir, 'outside.qmd');

      // cwd is a subdirectory, so the absolute path is outside it
      const subDir = join(tempDir, 'subdir');
      mkdirSync(subDir, { recursive: true });
      const tracer = new ProvenanceTracer({ cwd: subDir });

      await expect(tracer.trace(filePath))
        .rejects.toThrow(ProvenanceError);
      await expect(tracer.trace(filePath))
        .rejects.toThrow('Path traversal detected');
    });

    it('should handle file with only opening frontmatter delimiter', async () => {
      const content = `---
title: "Unclosed"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
`;
      writeFileSync(join(tempDir, 'unclosed.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('unclosed.qmd');

      expect(result.found).toBe(false);
    });

    it('should handle file with refinement records in metadata', async () => {
      createQmdFile(tempDir, 'refined.qmd', {
        generated: '2026-02-09T10:00:00Z',
        scholar_version: '2.7.0',
        prompt_template: 'lecture-notes.md (v2.0)',
        config_source: '.flow/teach-config.yml',
        _extraLines: [
          '# refined: "Introduction" on 2026-02-10',
          '# refined: full lecture on 2026-02-11'
        ]
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('refined.qmd');

      expect(result.found).toBe(true);
      expect(result.provenance.refined).toBeDefined();
    });

    it('should handle metadata block without closing marker', async () => {
      const content = `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: 2.7.0
format: html
---
`;
      writeFileSync(join(tempDir, 'no-close.qmd'), content);

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('no-close.qmd');

      // Should still parse what it can from the block
      expect(result.found).toBe(true);
      expect(result.provenance.generated).toBe('2026-02-09T10:00:00Z');
      expect(result.provenance.scholar_version).toBe('2.7.0');
    });
  });

  // ---------------------------------------------------------------
  // Security
  // ---------------------------------------------------------------
  describe('Security', () => {
    it('should reject path traversal with ".." that escapes cwd', async () => {
      const tracer = new ProvenanceTracer({ cwd: tempDir });

      await expect(tracer.trace('../../../etc/passwd'))
        .rejects.toThrow(ProvenanceError);
      await expect(tracer.trace('../../../etc/passwd'))
        .rejects.toThrow('Path traversal detected');
    });

    it('should reject relative path that resolves outside cwd', async () => {
      const tracer = new ProvenanceTracer({ cwd: tempDir });

      await expect(tracer.trace('subdir/../../../../../../etc/shadow'))
        .rejects.toThrow('Path traversal detected');
    });

    it('should include filePath in error for traversal attempt', async () => {
      const tracer = new ProvenanceTracer({ cwd: tempDir });

      try {
        await tracer.trace('../escape.qmd');
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err).toBeInstanceOf(ProvenanceError);
        expect(err.file).toBe('../escape.qmd');
      }
    });

    it('should allow valid relative paths within cwd', async () => {
      const subDir = join(tempDir, 'lectures');
      mkdirSync(subDir, { recursive: true });
      createQmdFile(subDir, 'safe.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('lectures/safe.qmd');

      expect(result.found).toBe(true);
      expect(result.file).toBe(join(tempDir, 'lectures', 'safe.qmd'));
    });

    it('should allow files in cwd root', async () => {
      createQmdFile(tempDir, 'root-file.qmd');

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('root-file.qmd');

      expect(result.found).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Debug logging
  // ---------------------------------------------------------------
  describe('debug logging', () => {
    it('should not log when debug is false', async () => {
      createQmdFile(tempDir, 'test.qmd');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const tracer = new ProvenanceTracer({ cwd: tempDir, debug: false });
      await tracer.trace('test.qmd');

      const debugCalls = consoleSpy.mock.calls.filter(
        call => call[0] && typeof call[0] === 'string' && call[0].includes('[scholar:provenance]')
      );
      expect(debugCalls).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should log when debug is true', async () => {
      createQmdFile(tempDir, 'test.qmd');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const tracer = new ProvenanceTracer({ cwd: tempDir, debug: true });
      await tracer.trace('test.qmd');

      const debugCalls = consoleSpy.mock.calls.filter(
        call => call[0] && typeof call[0] === 'string' && call[0].includes('[scholar:provenance]')
      );
      expect(debugCalls.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------
  // Variables extraction
  // ---------------------------------------------------------------
  describe('variables extraction', () => {
    it('should extract sections count', async () => {
      createQmdFile(tempDir, 'test.qmd', { sections: '15' });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.variables.sections).toEqual({
        value: '15',
        source: 'provenance'
      });
    });

    it('should extract generation_time', async () => {
      createQmdFile(tempDir, 'test.qmd', { generation_time: '58s' });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.variables.generation_time).toEqual({
        value: '58s',
        source: 'provenance'
      });
    });

    it('should extract config_source with Layer 2 annotation', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        config_source: '.flow/teach-config.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.variables.config_source).toEqual({
        value: '.flow/teach-config.yml',
        source: 'Layer 2'
      });
    });

    it('should extract lesson_plan with Layer 4 annotation', async () => {
      createQmdFile(tempDir, 'test.qmd', {
        lesson_plan: '.flow/lesson-plans.yml'
      });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.variables.lesson_plan).toEqual({
        value: '.flow/lesson-plans.yml',
        source: 'Layer 4'
      });
    });

    it('should return empty variables when no provenance', async () => {
      createQmdFile(tempDir, 'test.qmd', {}, { noMetadata: true });

      const tracer = new ProvenanceTracer({ cwd: tempDir });
      const result = await tracer.trace('test.qmd');

      expect(result.variables).toEqual({});
    });
  });
});
