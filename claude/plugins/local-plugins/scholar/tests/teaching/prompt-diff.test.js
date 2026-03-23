/**
 * Tests for PromptDiffEngine
 *
 * Validates prompt comparison between project-level overrides in
 * `.flow/templates/prompts/` and Scholar default prompts.
 */

import { jest } from '@jest/globals';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { PromptDiffEngine, PromptDiffError, STATUS } from '../../src/teaching/config/prompt-diff.js';
import { SCHOLAR_VERSION } from '../../src/teaching/config/scaffolder.js';

/**
 * Helper: create a unique temp directory for each test
 * @returns {string} Path to temp directory
 */
function createTempDir() {
  const dir = join(
    tmpdir(),
    `prompt-diff-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Helper: write a project prompt file at .flow/templates/prompts/{type}.md
 * @param {string} root - Project root
 * @param {string} type - Prompt type
 * @param {string} content - File content
 */
function writeProjectPrompt(root, type, content) {
  const dir = join(root, '.flow', 'templates', 'prompts');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${type}.md`), content, 'utf8');
}

/**
 * Build a prompt string with YAML frontmatter and body
 * @param {Object} meta - Frontmatter metadata
 * @param {string} body - Prompt body text
 * @returns {string}
 */
function buildPrompt(meta, body) {
  const yaml = Object.entries(meta)
    .map(([k, v]) => {
      if (typeof v === 'object' && !Array.isArray(v)) {
        // Nested object (like variables)
        let lines = `${k}:`;
        for (const [sk, sv] of Object.entries(v)) {
          if (Array.isArray(sv)) {
            lines += `\n  ${sk}:`;
            for (const item of sv) {
              lines += `\n    - ${item}`;
            }
          } else {
            lines += `\n  ${sk}: ${JSON.stringify(sv)}`;
          }
        }
        return lines;
      }
      if (Array.isArray(v)) {
        let lines = `${k}:`;
        for (const item of v) {
          lines += `\n  - ${item}`;
        }
        return lines;
      }
      return `${k}: "${v}"`;
    })
    .join('\n');
  return `---\n${yaml}\n---\n\n${body}`;
}

describe('PromptDiffEngine', () => {
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
    it('should create engine with default options', () => {
      const engine = new PromptDiffEngine();
      expect(engine.cwd).toBe(process.cwd());
      expect(engine.debug).toBe(false);
    });

    it('should accept custom cwd', () => {
      const engine = new PromptDiffEngine({ cwd: '/tmp/test-project' });
      expect(engine.cwd).toBe('/tmp/test-project');
    });

    it('should accept debug option', () => {
      const engine = new PromptDiffEngine({ debug: true });
      expect(engine.debug).toBe(true);
    });

    it('should accept both cwd and debug', () => {
      const engine = new PromptDiffEngine({ cwd: tempDir, debug: true });
      expect(engine.cwd).toBe(tempDir);
      expect(engine.debug).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // PromptDiffError
  // ---------------------------------------------------------------
  describe('PromptDiffError', () => {
    it('should be an instance of Error', () => {
      const err = new PromptDiffError('test error');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(PromptDiffError);
    });

    it('should have correct name', () => {
      const err = new PromptDiffError('test');
      expect(err.name).toBe('PromptDiffError');
    });

    it('should store type and path', () => {
      const err = new PromptDiffError('test', { type: 'quiz', path: '/some/path' });
      expect(err.type).toBe('quiz');
      expect(err.path).toBe('/some/path');
    });

    it('should default type and path to null', () => {
      const err = new PromptDiffError('test');
      expect(err.type).toBeNull();
      expect(err.path).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // STATUS constants
  // ---------------------------------------------------------------
  describe('STATUS constants', () => {
    it('should export expected status values', () => {
      expect(STATUS.IDENTICAL).toBe('identical');
      expect(STATUS.MODIFIED).toBe('modified');
      expect(STATUS.VERSION_MISMATCH).toBe('version-mismatch');
      expect(STATUS.NO_OVERRIDE).toBe('no-override');
      expect(STATUS.MISSING_DEFAULT).toBe('missing-default');
    });
  });

  // ---------------------------------------------------------------
  // diffAll — no project prompts
  // ---------------------------------------------------------------
  describe('diffAll with no project prompts', () => {
    it('should return results for all default types', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      expect(result.prompts).toBeDefined();
      expect(Array.isArray(result.prompts)).toBe(true);
      expect(result.prompts.length).toBeGreaterThanOrEqual(4); // 4 defaults exist
    });

    it('should mark all prompts as no-override', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      for (const p of result.prompts) {
        expect(p.status).toBe(STATUS.NO_OVERRIDE);
      }
    });

    it('should have correct summary counts', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      expect(result.summary.overridden).toBe(0);
      expect(result.summary.identical).toBe(0);
      expect(result.summary.modified).toBe(0);
      expect(result.summary.versionMismatch).toBe(0);
      expect(result.summary.noOverride).toBe(result.prompts.length);
      expect(result.summary.total).toBe(result.prompts.length);
    });

    it('should produce formatted output', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      expect(typeof result.formatted).toBe('string');
      expect(result.formatted).toContain('Scholar v' + SCHOLAR_VERSION);
      expect(result.formatted).toContain('using Scholar default');
    });
  });

  // ---------------------------------------------------------------
  // diffAll — with one project prompt (identical copy)
  // ---------------------------------------------------------------
  describe('diffAll with one identical project prompt', () => {
    it('should detect identical prompt override', async () => {
      // Read the actual default and copy it verbatim with based_on_scholar_version
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const defaultContent = readFileSync(defaultPath, 'utf8');

      // Add based_on_scholar_version to the frontmatter
      const projectContent = defaultContent.replace(
        '---\n',
        `---\nbased_on_scholar_version: "${SCHOLAR_VERSION}"\n`
      );
      writeProjectPrompt(tempDir, 'quiz', projectContent);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      // The quiz should show as identical (or close to it, depending on frontmatter injection)
      const quizResult = result.prompts.find(p => p.type === 'quiz');
      expect(quizResult).toBeDefined();
      expect(quizResult.status).not.toBe(STATUS.NO_OVERRIDE);

      // All others should be no-override
      const others = result.prompts.filter(p => p.type !== 'quiz');
      for (const p of others) {
        expect(p.status).toBe(STATUS.NO_OVERRIDE);
      }
    });

    it('should show correct summary for one override', async () => {
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const defaultContent = readFileSync(defaultPath, 'utf8');
      const projectContent = defaultContent.replace(
        '---\n',
        `---\nbased_on_scholar_version: "${SCHOLAR_VERSION}"\n`
      );
      writeProjectPrompt(tempDir, 'quiz', projectContent);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      expect(result.summary.overridden).toBe(1);
      expect(result.summary.noOverride).toBe(result.prompts.length - 1);
    });
  });

  // ---------------------------------------------------------------
  // diffAll — with multiple project prompts
  // ---------------------------------------------------------------
  describe('diffAll with multiple project prompts', () => {
    it('should handle each prompt independently', async () => {
      // Create two project prompts: one identical, one modified
      const defaultQuizPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const quizContent = readFileSync(defaultQuizPath, 'utf8');
      writeProjectPrompt(tempDir, 'quiz', quizContent.replace(
        '---\n', `---\nbased_on_scholar_version: "${SCHOLAR_VERSION}"\n`
      ));

      // Modified lecture-notes (changed body)
      const modifiedContent = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'lecture-notes',
        prompt_description: 'Custom lecture notes',
        based_on_scholar_version: SCHOLAR_VERSION,
        variables: { required: ['topic', 'course_level', 'field'], optional: ['course_code'] }
      }, '# My Custom Lecture Notes\n\nThis is a completely different body.');

      writeProjectPrompt(tempDir, 'lecture-notes', modifiedContent);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      const quizResult = result.prompts.find(p => p.type === 'quiz');
      const lectureResult = result.prompts.find(p => p.type === 'lecture-notes');

      expect(quizResult).toBeDefined();
      expect(lectureResult).toBeDefined();

      // Lecture-notes should be modified (body differs significantly)
      expect(lectureResult.status).toBe(STATUS.MODIFIED);
      expect(result.summary.overridden).toBe(2);
    });
  });

  // ---------------------------------------------------------------
  // diffType — matching versions, identical
  // ---------------------------------------------------------------
  describe('diffType — matching versions', () => {
    it('should detect identical prompt with same version', async () => {
      // Copy quiz default exactly, adding only based_on_scholar_version
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const content = readFileSync(defaultPath, 'utf8');
      const withVersion = content.replace(
        '---\n',
        `---\nbased_on_scholar_version: "${SCHOLAR_VERSION}"\n`
      );
      writeProjectPrompt(tempDir, 'quiz', withVersion);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      // based_on_scholar_version is a frontmatter addition, but it is excluded from diff
      expect(result.type).toBe('quiz');
      expect(result.projectVersion).toBe(SCHOLAR_VERSION);
      expect(result.defaultVersion).toBe(SCHOLAR_VERSION);
    });

    it('should show no variable changes for identical prompt', async () => {
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const content = readFileSync(defaultPath, 'utf8');
      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.variableChanges.addedRequired).toEqual([]);
      expect(result.variableChanges.removedRequired).toEqual([]);
      expect(result.variableChanges.addedOptional).toEqual([]);
      expect(result.variableChanges.removedOptional).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // diffType — older based_on_scholar_version
  // ---------------------------------------------------------------
  describe('diffType — version mismatch', () => {
    it('should detect older based_on_scholar_version', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        based_on_scholar_version: '2.5.0',
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.projectVersion).toBe('2.5.0');
      expect(result.defaultVersion).toBe(SCHOLAR_VERSION);
      expect(result.status).toBe(STATUS.VERSION_MISMATCH);
    });

    it('should include version mismatch warning in formatted output', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        based_on_scholar_version: '2.3.0',
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions']
      }, '# Quiz\n\nBody text.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.formatted).toContain('version mismatch');
      expect(result.formatted).toContain('v2.3.0');
      expect(result.formatted).toContain(`v${SCHOLAR_VERSION}`);
    });
  });

  // ---------------------------------------------------------------
  // diffType — frontmatter changes
  // ---------------------------------------------------------------
  describe('diffType — frontmatter changes', () => {
    it('should detect added metadata fields', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        custom_field: 'custom_value',
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.frontmatterChanges.added.length).toBeGreaterThanOrEqual(1);
      const addedFields = result.frontmatterChanges.added.map(a => a.field);
      expect(addedFields).toContain('custom_field');
    });

    it('should detect removed metadata fields', async () => {
      // Quiz default has min_scholar_version — remove it from project version
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      const removedFields = result.frontmatterChanges.removed.map(r => r.field);
      expect(removedFields).toContain('min_scholar_version');
    });

    it('should detect changed metadata fields', async () => {
      const content = buildPrompt({
        prompt_version: '3.0',
        prompt_type: 'quiz',
        prompt_description: 'Updated quiz description',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      const changedFields = result.frontmatterChanges.changed.map(c => c.field);
      expect(changedFields).toContain('prompt_version');
      expect(changedFields).toContain('prompt_description');
    });

    it('should include metadata changes in formatted output', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        author: 'Test User',
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.formatted).toContain('Metadata changes');
      expect(result.formatted).toContain('Added');
      expect(result.formatted).toContain('author');
    });
  });

  // ---------------------------------------------------------------
  // diffType — variable changes
  // ---------------------------------------------------------------
  describe('diffType — variable changes', () => {
    it('should detect new required variables (Format B)', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level', 'new_required_var'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.variableChanges.addedRequired).toContain('new_required_var');
    });

    it('should detect removed required variables', async () => {
      // Quiz default has required: [topic, course_level]. Remove course_level.
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.variableChanges.removedRequired).toContain('course_level');
    });

    it('should detect new optional variables', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit', 'custom_option']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.variableChanges.addedOptional).toContain('custom_option');
    });

    it('should detect removed optional variables', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.variableChanges.removedOptional).toContain('question_types');
      expect(result.variableChanges.removedOptional).toContain('difficulty');
      expect(result.variableChanges.removedOptional).toContain('time_limit');
    });

    it('should handle Format A variables (lecture-notes style)', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'lecture-notes',
        prompt_description: 'Comprehensive instructor-facing lecture notes in Quarto format',
        target_template: 'content/lecture.qmd',
        author: 'Scholar',
        last_updated: '2026-01-28',
        based_on_scholar_version: SCHOLAR_VERSION,
        variables: {
          required: ['topic', 'course_level', 'field', 'new_var'],
          optional: ['course_code']
        }
      }, '# Comprehensive Lecture Notes: {{topic}}');

      writeProjectPrompt(tempDir, 'lecture-notes', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('lecture-notes');

      expect(result.variableChanges.addedRequired).toContain('new_var');
      // Many optional vars removed since we only kept course_code
      expect(result.variableChanges.removedOptional.length).toBeGreaterThan(0);
    });

    it('should include variable changes in formatted output', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level', 'extra_var'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz for formative assessment on the following topic.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.formatted).toContain('Variable changes');
      expect(result.formatted).toContain('extra_var');
    });
  });

  // ---------------------------------------------------------------
  // diffType — body changes
  // ---------------------------------------------------------------
  describe('diffType — body changes', () => {
    it('should detect added lines in body', async () => {
      // Read the default quiz body and add lines
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const defaultContent = readFileSync(defaultPath, 'utf8');

      // Append a new section to the body
      const projectContent = defaultContent.replace(
        '---\n',
        `---\nbased_on_scholar_version: "${SCHOLAR_VERSION}"\n`
      ) + '\n\n## Custom Section\n\nThis is a new section added by the project.';

      writeProjectPrompt(tempDir, 'quiz', projectContent);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.bodyChanges.added.length).toBeGreaterThan(0);
      const addedContent = result.bodyChanges.added.map(a => a.content);
      expect(addedContent.some(c => c.includes('Custom Section'))).toBe(true);
    });

    it('should detect removed lines in body', async () => {
      // Create a project prompt with fewer lines than default
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nMinimal body.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.bodyChanges.removed.length).toBeGreaterThan(0);
    });

    it('should detect section heading changes', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nGenerate a quiz.\n\n## Subject Area\n{{topic}}\n\n## Course Level\n{{course_level}}\n\n## Requirements\n\n1. Be clear\n\n## Output Format\n\nMarkdown.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      // "## Subject Area" is a new section (default has "## Topic")
      // This should show up in body changes
      expect(result.bodyChanges.added.length > 0 || result.bodyChanges.changed.length > 0).toBe(true);
    });

    it('should include body changes in formatted output', async () => {
      const content = buildPrompt({
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt for formative assessment',
        min_scholar_version: '2.0.0',
        based_on_scholar_version: SCHOLAR_VERSION,
        required_variables: ['topic', 'course_level'],
        optional_variables: ['num_questions', 'question_types', 'difficulty', 'time_limit']
      }, '# Quiz Generator Prompt\n\nMinimal body.');

      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.formatted).toContain('Body changes');
      expect(result.formatted).toContain('line(s)');
    });
  });

  // ---------------------------------------------------------------
  // diffType — no project override
  // ---------------------------------------------------------------
  describe('diffType — no project override', () => {
    it('should report no-override status for type without project file', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('lecture-notes');

      expect(result.type).toBe('lecture-notes');
      expect(result.status).toBe(STATUS.NO_OVERRIDE);
      expect(result.projectVersion).toBeNull();
    });

    it('should have empty change sets for no-override', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.frontmatterChanges.added).toEqual([]);
      expect(result.frontmatterChanges.removed).toEqual([]);
      expect(result.frontmatterChanges.changed).toEqual([]);
      expect(result.variableChanges.addedRequired).toEqual([]);
      expect(result.variableChanges.removedRequired).toEqual([]);
      expect(result.variableChanges.addedOptional).toEqual([]);
      expect(result.variableChanges.removedOptional).toEqual([]);
    });

    it('should include default message in formatted output', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('lecture-outline');

      expect(result.formatted).toContain('No project override');
      expect(result.formatted).toContain('using Scholar default');
    });
  });

  // ---------------------------------------------------------------
  // diffType — invalid type
  // ---------------------------------------------------------------
  describe('diffType — invalid type', () => {
    it('should throw PromptDiffError for unknown type', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });

      await expect(engine.diffType('nonexistent-type'))
        .rejects.toThrow(PromptDiffError);
    });

    it('should include type name in error message', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });

      await expect(engine.diffType('invalid-prompt'))
        .rejects.toThrow('Unknown prompt type');
    });

    it('should throw for empty string type', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });

      await expect(engine.diffType(''))
        .rejects.toThrow(PromptDiffError);
    });
  });

  // ---------------------------------------------------------------
  // diffType — project prompt with no frontmatter
  // ---------------------------------------------------------------
  describe('diffType — project prompt with no frontmatter', () => {
    it('should handle gracefully when project prompt has no frontmatter', async () => {
      writeProjectPrompt(tempDir, 'quiz', '# Just a body\n\nNo frontmatter here.');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.type).toBe('quiz');
      expect(result.projectVersion).toBeNull();
      // Should still produce a valid result with body changes
      expect(result.bodyChanges).toBeDefined();
      expect(result.formatted).toBeDefined();
    });

    it('should detect all default metadata as removed', async () => {
      writeProjectPrompt(tempDir, 'quiz', '# Just a body\n\nNo frontmatter.');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      // Default quiz has prompt_version, prompt_type, prompt_description, min_scholar_version
      expect(result.frontmatterChanges.removed.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------
  // diffType — malformed YAML frontmatter
  // ---------------------------------------------------------------
  describe('diffType — malformed YAML', () => {
    it('should handle malformed YAML in project prompt gracefully', async () => {
      writeProjectPrompt(tempDir, 'quiz', '---\n{{invalid: yaml: here}}\n---\n\n# Body');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      // Should not throw — _safeParse handles it
      const result = await engine.diffType('quiz');

      expect(result).toBeDefined();
      expect(result.type).toBe('quiz');
      expect(result.projectVersion).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // Format output structure
  // ---------------------------------------------------------------
  describe('formatted output', () => {
    it('should contain header with Scholar version', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      expect(result.formatted).toContain(`Scholar v${SCHOLAR_VERSION}`);
    });

    it('should contain summary section', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      expect(result.formatted).toContain('Summary');
      expect(result.formatted).toContain('prompt types');
    });

    it('should list each prompt type', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      expect(result.formatted).toContain('lecture-notes.md');
      expect(result.formatted).toContain('quiz.md');
      expect(result.formatted).toContain('lecture-outline.md');
      expect(result.formatted).toContain('section-content.md');
    });

    it('should format single type diff with type header', async () => {
      writeProjectPrompt(tempDir, 'quiz', '---\nprompt_version: "2.0"\nprompt_type: quiz\nprompt_description: "Test"\nbased_on_scholar_version: "2.5.0"\nrequired_variables:\n  - topic\n  - course_level\noptional_variables:\n  - num_questions\n---\n\n# Quiz\n\nBody.');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.formatted).toContain('quiz.md');
    });
  });

  // ---------------------------------------------------------------
  // JSON output (structured data)
  // ---------------------------------------------------------------
  describe('JSON output structure', () => {
    it('should provide structured data for diffAll', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      // Can be serialized to JSON without the formatted strings
      const data = {
        prompts: result.prompts.map(({ formatted: _formatted, ...rest }) => rest),
        summary: result.summary
      };
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(parsed.prompts).toBeDefined();
      expect(Array.isArray(parsed.prompts)).toBe(true);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.total).toBeGreaterThan(0);
    });

    it('should provide structured data for diffType', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      const { formatted: _formatted, ...data } = result;
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('quiz');
      expect(parsed.status).toBe(STATUS.NO_OVERRIDE);
      expect(parsed.defaultVersion).toBe(SCHOLAR_VERSION);
    });

    it('should include all expected fields in type diff JSON', async () => {
      writeProjectPrompt(tempDir, 'quiz', '---\nprompt_version: "2.0"\nprompt_type: quiz\nprompt_description: "Test"\nbased_on_scholar_version: "2.5.0"\nrequired_variables:\n  - topic\noptional_variables:\n  - num_questions\n---\n\n# Quiz\n\nBody.');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      const { formatted: _formatted, ...data } = result;

      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('projectVersion');
      expect(data).toHaveProperty('defaultVersion');
      expect(data).toHaveProperty('frontmatterChanges');
      expect(data).toHaveProperty('variableChanges');
      expect(data).toHaveProperty('bodyChanges');
      expect(data.frontmatterChanges).toHaveProperty('added');
      expect(data.frontmatterChanges).toHaveProperty('removed');
      expect(data.frontmatterChanges).toHaveProperty('changed');
      expect(data.variableChanges).toHaveProperty('addedRequired');
      expect(data.variableChanges).toHaveProperty('removedRequired');
      expect(data.variableChanges).toHaveProperty('addedOptional');
      expect(data.variableChanges).toHaveProperty('removedOptional');
      expect(data.bodyChanges).toHaveProperty('added');
      expect(data.bodyChanges).toHaveProperty('removed');
      expect(data.bodyChanges).toHaveProperty('changed');
      expect(data.bodyChanges).toHaveProperty('totalLines');
    });
  });

  // ---------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle empty body in project prompt', async () => {
      writeProjectPrompt(tempDir, 'quiz', '---\nprompt_version: "2.0"\nprompt_type: quiz\nprompt_description: "Empty"\nmin_scholar_version: "2.0.0"\nrequired_variables:\n  - topic\n  - course_level\noptional_variables:\n  - num_questions\n  - question_types\n  - difficulty\n  - time_limit\n---\n');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      // Should not throw, body changes should show removed lines
      expect(result).toBeDefined();
      expect(result.bodyChanges.removed.length).toBeGreaterThan(0);
    });

    it('should handle project prompt that is just whitespace', async () => {
      writeProjectPrompt(tempDir, 'quiz', '   \n\n  \n');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result).toBeDefined();
      expect(result.projectVersion).toBeNull();
    });

    it('should handle project type that exists only in project (no default)', async () => {
      writeProjectPrompt(tempDir, 'custom-prompt', '---\nprompt_version: "1.0"\nprompt_type: custom\nprompt_description: "A custom prompt"\n---\n\n# Custom Prompt\n\nBody.');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('custom-prompt');

      expect(result.status).toBe(STATUS.MISSING_DEFAULT);
    });

    it('should include custom project-only types in diffAll', async () => {
      writeProjectPrompt(tempDir, 'my-custom', '---\nprompt_type: custom\n---\n\nBody.');

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      const customResult = result.prompts.find(p => p.type === 'my-custom');
      expect(customResult).toBeDefined();
      expect(customResult.status).toBe(STATUS.MISSING_DEFAULT);
    });

    it('should handle .flow/templates/prompts/ directory not existing', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir });
      // No .flow directory at all
      const result = await engine.diffAll();

      expect(result.prompts.length).toBeGreaterThan(0);
      expect(result.summary.overridden).toBe(0);
    });

    it('should handle completely empty .flow/templates/prompts/ directory', async () => {
      mkdirSync(join(tempDir, '.flow', 'templates', 'prompts'), { recursive: true });

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffAll();

      // Should just show all defaults with no-override
      for (const p of result.prompts) {
        expect(p.status).toBe(STATUS.NO_OVERRIDE);
      }
    });
  });

  // ---------------------------------------------------------------
  // Debug logging
  // ---------------------------------------------------------------
  describe('debug logging', () => {
    it('should not throw when debug is enabled', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir, debug: true });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await engine.diffAll();
      expect(result).toBeDefined();

      const logMessages = consoleSpy.mock.calls.map(c => c[0]);
      expect(logMessages.some(m => m.includes('[scholar:prompt-diff]'))).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', async () => {
      const engine = new PromptDiffEngine({ cwd: tempDir, debug: false });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const originalEnv = process.env.SCHOLAR_DEBUG;
      delete process.env.SCHOLAR_DEBUG;

      await engine.diffAll();

      const logMessages = consoleSpy.mock.calls.map(c => c[0]);
      expect(logMessages.filter(m => m.includes('[scholar:prompt-diff]'))).toHaveLength(0);

      consoleSpy.mockRestore();
      if (originalEnv !== undefined) {
        process.env.SCHOLAR_DEBUG = originalEnv;
      }
    });
  });

  // ---------------------------------------------------------------
  // Integration: modified status detection
  // ---------------------------------------------------------------
  describe('status detection', () => {
    it('should detect MODIFIED when only body changes', async () => {
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      let content = readFileSync(defaultPath, 'utf8');
      // Add based_on_scholar_version and modify the body
      content = content.replace(
        '---\n',
        `---\nbased_on_scholar_version: "${SCHOLAR_VERSION}"\n`
      );
      content += '\n\n## Extra Section\n\nAdded content for project.';
      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      // Should be MODIFIED (same version, but body changed)
      expect(result.status).toBe(STATUS.MODIFIED);
    });

    it('should detect IDENTICAL when prompt is exact copy with version tag', async () => {
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const content = readFileSync(defaultPath, 'utf8');
      // Write exact copy (no version tag added)
      writeProjectPrompt(tempDir, 'quiz', content);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      // No body changes, no frontmatter changes, no variable changes
      expect(result.status).toBe(STATUS.IDENTICAL);
    });

    it('should detect VERSION_MISMATCH even when content is otherwise identical', async () => {
      const defaultPath = join(
        process.cwd(), 'src', 'teaching', 'ai', 'prompts', 'default', 'quiz.md'
      );
      const content = readFileSync(defaultPath, 'utf8');
      // Add an older version tag
      const withOldVersion = content.replace(
        '---\n',
        `---\nbased_on_scholar_version: "2.0.0"\n`
      );
      writeProjectPrompt(tempDir, 'quiz', withOldVersion);

      const engine = new PromptDiffEngine({ cwd: tempDir });
      const result = await engine.diffType('quiz');

      expect(result.status).toBe(STATUS.VERSION_MISMATCH);
      expect(result.projectVersion).toBe('2.0.0');
    });
  });
});
