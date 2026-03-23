/**
 * Unit tests for InstructionMerger
 *
 * Tests AI-powered categorization, prompt merging, conflict detection,
 * summary generation, and @file loading.
 */

import { jest } from '@jest/globals';
import { InstructionMerger, createMerger } from '../../src/teaching/ai/instruction-merger.js';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Load fixtures
import contentOnly from './fixtures/instructions/content-only.json' with { type: 'json' };
import mixedCategories from './fixtures/instructions/mixed-categories.json' with { type: 'json' };
import styleConflict from './fixtures/instructions/style-conflict.json' with { type: 'json' };

// ---------------------------------------------------------------------------
// Mock AI Provider
// ---------------------------------------------------------------------------

/**
 * Create a mock AI provider that returns pre-configured responses
 * @param {Object} response - The response to return from generate()
 * @returns {Object} Mock provider with generate() method
 */
function createMockProvider(response) {
  return {
    generate: jest.fn().mockResolvedValue({
      success: true,
      content: response,
    }),
  };
}

/**
 * Create a mock provider that returns a failure
 * @param {string} error - Error message
 * @returns {Object} Mock provider
 */
function createFailingProvider(error = 'API error') {
  return {
    generate: jest.fn().mockResolvedValue({
      success: false,
      error,
    }),
  };
}

// ---------------------------------------------------------------------------
// Sample prompts for merge testing
// ---------------------------------------------------------------------------

const SAMPLE_PROMPT = `## Course Context

Course: STAT-440 Regression Analysis
Level: undergraduate
Difficulty: intermediate

## Topic

Linear regression, Multiple regression

## Teaching Style

Use a formal academic tone with clear explanations.

## Output Format

Return valid JSON with the following structure:
{
  "questions": [...]
}`;

const SAMPLE_PROMPT_NO_STYLE = `## Topic

Linear regression

## Output Format

Return valid JSON.`;

// ============================================================================
// Tests
// ============================================================================

describe('InstructionMerger', () => {
  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------
  describe('constructor', () => {
    it('requires an AI provider', () => {
      expect(() => new InstructionMerger(null)).toThrow(
        'InstructionMerger requires an AIProvider instance'
      );
    });

    it('creates instance with provider', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      expect(merger).toBeInstanceOf(InstructionMerger);
    });

    it('accepts debug option', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider, { debug: true });
      expect(merger.debug).toBe(true);
    });

    it('defaults debug to false', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      expect(merger.debug).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // createMerger factory
  // --------------------------------------------------------------------------
  describe('createMerger()', () => {
    it('returns an InstructionMerger instance', () => {
      const provider = createMockProvider({});
      const merger = createMerger(provider);
      expect(merger).toBeInstanceOf(InstructionMerger);
    });

    it('passes options through', () => {
      const provider = createMockProvider({});
      const merger = createMerger(provider, { debug: true });
      expect(merger.debug).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // analyze()
  // --------------------------------------------------------------------------
  describe('analyze()', () => {
    it('categorizes content-only instructions', async () => {
      const provider = createMockProvider(contentOnly.expected);
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze(contentOnly.input, contentOnly.commandType);

      expect(result.content).toEqual(contentOnly.expected.content);
      expect(result.style).toEqual([]);
      expect(result.format).toEqual([]);
      expect(result.constraints).toEqual([]);
    });

    it('categorizes mixed instructions', async () => {
      const provider = createMockProvider(mixedCategories.expected);
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze(mixedCategories.input, mixedCategories.commandType);

      expect(result.content).toEqual(mixedCategories.expected.content);
      expect(result.style).toEqual(mixedCategories.expected.style);
      expect(result.format).toEqual(mixedCategories.expected.format);
      expect(result.constraints).toEqual(mixedCategories.expected.constraints);
    });

    it('passes commandType to the AI prompt', async () => {
      const provider = createMockProvider({ content: [], style: [], format: [], constraints: [] });
      const merger = new InstructionMerger(provider);

      await merger.analyze('Some instructions', 'quiz');

      expect(provider.generate).toHaveBeenCalledTimes(1);
      const calledPrompt = provider.generate.mock.calls[0][0];
      expect(calledPrompt).toContain('quiz');
    });

    it('passes userInstructions to the AI prompt', async () => {
      const provider = createMockProvider({ content: [], style: [], format: [], constraints: [] });
      const merger = new InstructionMerger(provider);

      await merger.analyze('Focus on healthcare', 'exam');

      const calledPrompt = provider.generate.mock.calls[0][0];
      expect(calledPrompt).toContain('Focus on healthcare');
    });

    it('uses low temperature for consistent categorization', async () => {
      const provider = createMockProvider({ content: [], style: [], format: [], constraints: [] });
      const merger = new InstructionMerger(provider);

      await merger.analyze('Test', 'exam');

      const calledOptions = provider.generate.mock.calls[0][1];
      expect(calledOptions.temperature).toBe(0.1);
      expect(calledOptions.format).toBe('json');
    });

    it('throws on empty instructions', async () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      await expect(merger.analyze('', 'exam')).rejects.toThrow(
        'userInstructions must be a non-empty string'
      );
    });

    it('throws on null instructions', async () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      await expect(merger.analyze(null, 'exam')).rejects.toThrow(
        'userInstructions must be a non-empty string'
      );
    });

    it('throws on empty commandType', async () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      await expect(merger.analyze('test', '')).rejects.toThrow(
        'commandType must be a non-empty string'
      );
    });

    it('throws when AI returns failure', async () => {
      const provider = createFailingProvider('Rate limited');
      const merger = new InstructionMerger(provider);

      await expect(merger.analyze('test', 'exam')).rejects.toThrow(
        'AI categorization failed: Rate limited'
      );
    });

    it('handles AI returning a JSON string instead of object', async () => {
      const expected = { content: ['test'], style: [], format: [], constraints: [] };
      const provider = createMockProvider(JSON.stringify(expected));
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze('test', 'exam');
      expect(result.content).toEqual(['test']);
    });

    it('handles AI returning invalid JSON string', async () => {
      const provider = createMockProvider('not valid json');
      const merger = new InstructionMerger(provider);

      await expect(merger.analyze('test', 'exam')).rejects.toThrow(
        'AI returned invalid JSON'
      );
    });

    it('defaults missing categories to empty arrays', async () => {
      const provider = createMockProvider({ content: ['topic'] });
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze('test', 'exam');
      expect(result.content).toEqual(['topic']);
      expect(result.style).toEqual([]);
      expect(result.format).toEqual([]);
      expect(result.constraints).toEqual([]);
    });

    it('coerces single string category to array', async () => {
      const provider = createMockProvider({
        content: 'single item',
        style: [],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze('test', 'exam');
      expect(result.content).toEqual(['single item']);
    });

    it('filters null and empty items from categories', async () => {
      const provider = createMockProvider({
        content: ['valid', null, '', '  ', 'also valid'],
        style: [],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze('test', 'exam');
      expect(result.content).toEqual(['valid', 'also valid']);
    });
  });

  // --------------------------------------------------------------------------
  // merge()
  // --------------------------------------------------------------------------
  describe('merge()', () => {
    const makeCategories = (overrides = {}) => ({
      content: [],
      style: [],
      format: [],
      constraints: [],
      ...overrides,
    });

    it('returns a valid MergeResult structure', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({ content: ['test'] });
      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result).toHaveProperty('mergedPrompt');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('isCustomPrompt');
      expect(result).toHaveProperty('commandType');
      expect(Array.isArray(result.conflicts)).toBe(true);
    });

    it('throws on empty prompt', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const categories = makeCategories();

      expect(() => merger.merge('', categories)).toThrow(
        'activePrompt must be a non-empty string'
      );
    });

    it('injects content instructions after topic section', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        content: ['Use healthcare datasets'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toContain('## Additional Content Requirements');
      expect(result.mergedPrompt).toContain('- Use healthcare datasets');

      // Content should appear after Topic section but before Output Format
      const contentIdx = result.mergedPrompt.indexOf('Additional Content Requirements');
      const outputIdx = result.mergedPrompt.indexOf('## Output Format');
      expect(contentIdx).toBeLessThan(outputIdx);
    });

    it('injects style instructions after style section', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        style: ['Keep it conversational'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toContain('## Custom Style Requirements');
      expect(result.mergedPrompt).toContain('- Keep it conversational');
    });

    it('injects format instructions after format section', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        format: ['Include R code snippets'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toContain('## Additional Format Requirements');
      expect(result.mergedPrompt).toContain('- Include R code snippets');
    });

    it('injects constraints as a dedicated section', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        constraints: ['No more than 3 essay questions'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toContain('## Constraints');
      expect(result.mergedPrompt).toContain('- No more than 3 essay questions');
    });

    it('injects multiple items in one category', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        content: ['Use healthcare data', 'Focus on clinical trials', 'Include real datasets'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toContain('- Use healthcare data');
      expect(result.mergedPrompt).toContain('- Focus on clinical trials');
      expect(result.mergedPrompt).toContain('- Include real datasets');
    });

    it('handles prompt without matching sections (appends at end)', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        style: ['Be humorous'],
      });

      const result = merger.merge(SAMPLE_PROMPT_NO_STYLE, categories);

      // Should still contain the injected instructions
      expect(result.mergedPrompt).toContain('## Custom Style Requirements');
      expect(result.mergedPrompt).toContain('- Be humorous');
    });

    it('preserves isCustomPrompt flag', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const categories = makeCategories({ content: ['test'] });

      const result = merger.merge(SAMPLE_PROMPT, categories, {}, {
        isCustomPrompt: true,
        commandType: 'exam',
      });

      expect(result.isCustomPrompt).toBe(true);
      expect(result.commandType).toBe('exam');
    });

    it('preserves original prompt content', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const categories = makeCategories({ content: ['Extra topic'] });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toContain('STAT-440 Regression Analysis');
      expect(result.mergedPrompt).toContain('Linear regression, Multiple regression');
      expect(result.mergedPrompt).toContain('formal academic tone');
    });

    it('handles all four categories at once', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        content: ['Healthcare focus'],
        style: ['Conversational tone'],
        format: ['Include R code'],
        constraints: ['Max 3 essays'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toContain('Healthcare focus');
      expect(result.mergedPrompt).toContain('Conversational tone');
      expect(result.mergedPrompt).toContain('Include R code');
      expect(result.mergedPrompt).toContain('Max 3 essays');
    });

    it('does nothing when all categories are empty', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const categories = makeCategories();

      const result = merger.merge(SAMPLE_PROMPT, categories);

      expect(result.mergedPrompt).toBe(SAMPLE_PROMPT);
      expect(result.conflicts).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Conflict detection
  // --------------------------------------------------------------------------
  describe('conflict detection', () => {
    const makeCategories = (overrides = {}) => ({
      content: [],
      style: [],
      format: [],
      constraints: [],
      ...overrides,
    });

    it('detects style override when config has tone', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        style: ['Use a conversational tone'],
      });
      const config = { style: { tone: 'formal' } };

      const result = merger.merge(SAMPLE_PROMPT, categories, config);

      expect(result.conflicts.length).toBeGreaterThan(0);
      const styleConflict = result.conflicts.find(c => c.type === 'style_override');
      expect(styleConflict).toBeDefined();
      expect(styleConflict.severity).toBe('info');
      expect(styleConflict.message).toContain('formal');
    });

    it('does not flag style when config has no tone', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        style: ['Use a conversational tone'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories, {});

      const styleConflict = result.conflicts.find(c => c.type === 'style_override');
      expect(styleConflict).toBeUndefined();
    });

    it('detects format mismatch with config', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        format: ['Use markdown format'],
      });
      const config = { defaults: { exam_format: 'latex' } };

      const result = merger.merge(SAMPLE_PROMPT, categories, config);

      const formatConflict = result.conflicts.find(c => c.type === 'format_mismatch');
      expect(formatConflict).toBeDefined();
      expect(formatConflict.severity).toBe('warning');
      expect(formatConflict.message).toContain('latex');
    });

    it('detects contradictory instructions', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        content: [
          'Include detailed examples for every concept',
          "Don't include examples",
        ],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      const contradiction = result.conflicts.find(c => c.type === 'contradiction');
      expect(contradiction).toBeDefined();
      expect(contradiction.severity).toBe('warning');
      expect(contradiction.category).toBe('content');
    });

    it('detects scope expansion', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        content: ['Also cover Bayesian methods'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories);

      const expansion = result.conflicts.find(c => c.type === 'scope_expansion');
      expect(expansion).toBeDefined();
      expect(expansion.severity).toBe('info');
    });

    it('no conflicts when instructions are compatible', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        content: ['Use healthcare datasets'],
      });

      const result = merger.merge(SAMPLE_PROMPT, categories, {});

      expect(result.conflicts).toEqual([]);
    });

    it('detects multiple conflicts simultaneously', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = makeCategories({
        style: ['Use informal tone'],
        format: ['Use latex format'],
        content: ['Also add extra topics beyond the syllabus'],
      });
      const config = {
        style: { tone: 'formal' },
        defaults: { exam_format: 'markdown' },
      };

      const result = merger.merge(SAMPLE_PROMPT, categories, config);

      expect(result.conflicts.length).toBeGreaterThanOrEqual(2);
      expect(result.conflicts.some(c => c.type === 'style_override')).toBe(true);
      expect(result.conflicts.some(c => c.type === 'format_mismatch')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // summarize()
  // --------------------------------------------------------------------------
  describe('summarize()', () => {
    const makeMergeResult = (overrides = {}) => ({
      mergedPrompt: 'test prompt',
      categories: {
        content: [],
        style: [],
        format: [],
        constraints: [],
      },
      conflicts: [],
      isCustomPrompt: false,
      commandType: 'exam',
      ...overrides,
    });

    it('generates markdown summary header', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult();

      const summary = merger.summarize(result);

      expect(summary).toContain('## Generation Plan');
    });

    it('shows default prompt label', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({ commandType: 'exam', isCustomPrompt: false });

      const summary = merger.summarize(result);

      expect(summary).toContain('Default exam prompt');
    });

    it('shows custom prompt label when user override', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({ commandType: 'quiz', isCustomPrompt: true });

      const summary = merger.summarize(result);

      expect(summary).toContain('Custom quiz prompt (project override)');
    });

    it('shows instruction count', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({
        categories: {
          content: ['topic 1', 'topic 2'],
          style: ['tone'],
          format: [],
          constraints: ['limit'],
        },
      });

      const summary = merger.summarize(result);

      expect(summary).toContain('4 applied');
    });

    it('includes instruction table with categories', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({
        categories: {
          content: ['Healthcare datasets'],
          style: ['Conversational'],
          format: ['Include R code'],
          constraints: ['Max 3 essays'],
        },
      });

      const summary = merger.summarize(result);

      expect(summary).toContain('| Category | Instructions |');
      expect(summary).toContain('| Content | Healthcare datasets |');
      expect(summary).toContain('| Style | Conversational |');
      expect(summary).toContain('| Format | Include R code |');
      expect(summary).toContain('| Constraints | Max 3 essays |');
    });

    it('shows conflict notices', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({
        conflicts: [
          { type: 'style_override', severity: 'info', message: 'Override detected', category: 'style' },
          { type: 'format_mismatch', severity: 'warning', message: 'Format conflict', category: 'format' },
        ],
      });

      const summary = merger.summarize(result);

      expect(summary).toContain('### Notices');
      expect(summary).toContain('[i] Override detected');
      expect(summary).toContain('[!] Format conflict');
    });

    it('omits notices section when no conflicts', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({ conflicts: [] });

      const summary = merger.summarize(result);

      expect(summary).not.toContain('### Notices');
    });

    it('includes full prompt in verbose mode', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({ mergedPrompt: 'Full prompt content here' });

      const summary = merger.summarize(result, { verbose: true });

      expect(summary).toContain('### Full Merged Prompt');
      expect(summary).toContain('Full prompt content here');
    });

    it('omits full prompt in non-verbose mode', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult({ mergedPrompt: 'Full prompt content here' });

      const summary = merger.summarize(result, { verbose: false });

      expect(summary).not.toContain('### Full Merged Prompt');
    });

    it('throws on invalid mergeResult', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      expect(() => merger.summarize(null)).toThrow(
        'mergeResult must be a valid merge result object'
      );
    });

    it('handles zero instructions gracefully', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);
      const result = makeMergeResult();

      const summary = merger.summarize(result);

      expect(summary).toContain('0 applied');
      expect(summary).not.toContain('| Category |');
    });
  });

  // --------------------------------------------------------------------------
  // loadFromFile()
  // --------------------------------------------------------------------------
  describe('loadFromFile()', () => {
    const tmpDir = join(tmpdir(), 'scholar-test-instructions');
    const testFile = join(tmpDir, 'test-instructions.txt');
    const emptyFile = join(tmpDir, 'empty-instructions.txt');

    beforeAll(async () => {
      if (!existsSync(tmpDir)) {
        await mkdir(tmpDir, { recursive: true });
      }
      await writeFile(testFile, 'Focus on healthcare datasets\nInclude R code examples');
      await writeFile(emptyFile, '   \n  ');
    });

    afterAll(async () => {
      try {
        await unlink(testFile);
        await unlink(emptyFile);
      } catch { /* ignore cleanup errors */ }
    });

    it('loads instructions from a file with @ prefix', async () => {
      const content = await InstructionMerger.loadFromFile(`@${testFile}`);
      expect(content).toContain('Focus on healthcare datasets');
      expect(content).toContain('Include R code examples');
    });

    it('loads instructions from a file without @ prefix', async () => {
      const content = await InstructionMerger.loadFromFile(testFile);
      expect(content).toContain('Focus on healthcare datasets');
    });

    it('trims whitespace from loaded content', async () => {
      const content = await InstructionMerger.loadFromFile(testFile);
      expect(content).not.toMatch(/^\s/);
      expect(content).not.toMatch(/\s$/);
    });

    it('throws on non-existent file', async () => {
      await expect(
        InstructionMerger.loadFromFile('@/nonexistent/file.txt')
      ).rejects.toThrow('Instruction file not found');
    });

    it('throws on empty file', async () => {
      await expect(
        InstructionMerger.loadFromFile(emptyFile)
      ).rejects.toThrow('Instruction file is empty');
    });

    it('throws on null path', async () => {
      await expect(
        InstructionMerger.loadFromFile(null)
      ).rejects.toThrow('filePath must be a non-empty string');
    });

    it('throws on empty string path', async () => {
      await expect(
        InstructionMerger.loadFromFile('')
      ).rejects.toThrow('filePath must be a non-empty string');
    });

    it('throws on bare @ prefix', async () => {
      await expect(
        InstructionMerger.loadFromFile('@')
      ).rejects.toThrow('File path cannot be empty');
    });

    it('provides helpful error with resolved path', async () => {
      try {
        await InstructionMerger.loadFromFile('@missing.txt');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.message).toContain('Provided path');
        expect(err.message).toContain('Resolved to');
        expect(err.message).toContain('Tip:');
      }
    });

    it('rejects relative path traversal with ../', async () => {
      await expect(
        InstructionMerger.loadFromFile('@../../etc/passwd')
      ).rejects.toThrow('path traversal detected');
    });

    it('rejects relative path traversal to parent directory', async () => {
      await expect(
        InstructionMerger.loadFromFile('@../.env')
      ).rejects.toThrow('path traversal detected');
    });

    it('rejects relative path traversal with @ prefix normalization', async () => {
      await expect(
        InstructionMerger.loadFromFile('@../../../sensitive.txt')
      ).rejects.toThrow('path traversal detected');
    });
  });

  // --------------------------------------------------------------------------
  // Integration: analyze → merge → summarize
  // --------------------------------------------------------------------------
  describe('full pipeline', () => {
    it('analyze → merge → summarize produces valid output', async () => {
      const aiResponse = mixedCategories.expected;
      const provider = createMockProvider(aiResponse);
      const merger = new InstructionMerger(provider);

      // 1. Analyze
      const categories = await merger.analyze(mixedCategories.input, 'exam');
      expect(categories.content.length).toBeGreaterThan(0);

      // 2. Merge
      const mergeResult = merger.merge(SAMPLE_PROMPT, categories, {}, {
        isCustomPrompt: false,
        commandType: 'exam',
      });
      expect(mergeResult.mergedPrompt.length).toBeGreaterThan(SAMPLE_PROMPT.length);

      // 3. Summarize
      const summary = merger.summarize(mergeResult);
      expect(summary).toContain('## Generation Plan');
      expect(summary).toContain('Default exam prompt');
      expect(summary).toContain('applied');
    });

    it('pipeline with style conflict shows notice in summary', async () => {
      const provider = createMockProvider(styleConflict.expected);
      const merger = new InstructionMerger(provider);

      const categories = await merger.analyze(styleConflict.input, styleConflict.commandType);
      const mergeResult = merger.merge(
        SAMPLE_PROMPT,
        categories,
        styleConflict.config,
        { commandType: 'quiz' }
      );
      const summary = merger.summarize(mergeResult);

      expect(mergeResult.conflicts.length).toBeGreaterThan(0);
      expect(summary).toContain('### Notices');
    });

    it('pipeline with custom prompt marks isCustomPrompt', async () => {
      const provider = createMockProvider({ content: ['test'], style: [], format: [], constraints: [] });
      const merger = new InstructionMerger(provider);

      const categories = await merger.analyze('test instructions', 'exam');
      const mergeResult = merger.merge(SAMPLE_PROMPT, categories, {}, {
        isCustomPrompt: true,
        commandType: 'exam',
      });
      const summary = merger.summarize(mergeResult);

      expect(summary).toContain('Custom exam prompt (project override)');
    });
  });

  // --------------------------------------------------------------------------
  // Instruction accumulation (multi-round modify)
  // --------------------------------------------------------------------------
  describe('instruction accumulation', () => {
    it('re-analyzing combined instructions produces merged result', async () => {
      const round1Response = {
        content: ['Healthcare focus'],
        style: [],
        format: [],
        constraints: [],
      };
      const round2Response = {
        content: ['Healthcare focus', 'Python alternatives'],
        style: [],
        format: [],
        constraints: [],
      };

      const provider = {
        generate: jest.fn()
          .mockResolvedValueOnce({ success: true, content: round1Response })
          .mockResolvedValueOnce({ success: true, content: round2Response }),
      };
      const merger = new InstructionMerger(provider);

      // Round 1
      const cat1 = await merger.analyze('Focus on healthcare', 'exam');
      expect(cat1.content).toEqual(['Healthcare focus']);

      // Round 2: accumulated instructions
      const cat2 = await merger.analyze(
        'Focus on healthcare\nalso add Python alternatives',
        'exam'
      );
      expect(cat2.content).toEqual(['Healthcare focus', 'Python alternatives']);
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles very long instruction strings', async () => {
      const longInstruction = 'Use healthcare datasets. '.repeat(100);
      const provider = createMockProvider({
        content: [longInstruction.trim()],
        style: [],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze(longInstruction, 'exam');
      expect(result.content.length).toBe(1);
    });

    it('handles special characters in instructions', async () => {
      const provider = createMockProvider({
        content: ['Use R with %>% pipe operator'],
        style: [],
        format: ['Include LaTeX: $\\alpha + \\beta$'],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);

      const result = await merger.analyze('Use R with %>%, LaTeX math', 'slides');
      expect(result.content).toEqual(['Use R with %>% pipe operator']);
      expect(result.format).toEqual(['Include LaTeX: $\\alpha + \\beta$']);
    });

    it('merge with prompt that has no sections at all', () => {
      const provider = createMockProvider({});
      const merger = new InstructionMerger(provider);

      const categories = {
        content: ['New topic'],
        style: ['Be casual'],
        format: [],
        constraints: ['Max 5 questions'],
      };

      const barePrompt = 'Generate an exam about statistics.';
      const result = merger.merge(barePrompt, categories);

      expect(result.mergedPrompt).toContain('Generate an exam about statistics.');
      expect(result.mergedPrompt).toContain('New topic');
      expect(result.mergedPrompt).toContain('Be casual');
      expect(result.mergedPrompt).toContain('Max 5 questions');
    });
  });
});
