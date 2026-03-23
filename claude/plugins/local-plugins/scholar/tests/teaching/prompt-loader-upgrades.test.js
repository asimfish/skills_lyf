/**
 * Unit Tests for PromptLoader Upgrade Detection
 *
 * Tests the checkUpgrades, isFirstRunAfterUpgrade, and recordVersion
 * static methods added to PromptLoader for detecting prompt version drift
 * after Scholar upgrades.
 */

import { jest } from '@jest/globals';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { PromptLoader } from '../../src/teaching/ai/prompt-loader.js';
import { SCHOLAR_VERSION } from '../../src/teaching/config/scaffolder.js';

describe('PromptLoader Upgrade Detection', () => {
  let testDir;

  beforeEach(() => {
    testDir = join(tmpdir(), `scholar-upgrade-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper: create a prompt file with frontmatter in the project prompts dir.
   */
  function createProjectPrompt(type, frontmatter, body = 'Prompt body content here.') {
    const promptsDir = join(testDir, '.flow', 'templates', 'prompts');
    mkdirSync(promptsDir, { recursive: true });
    const filePath = join(promptsDir, `${type}.md`);
    const content = `---\n${frontmatter}\n---\n\n${body}`;
    writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * Helper: create a valid prompt with based_on_scholar_version set.
   */
  function createVersionedPrompt(type, basedOnVersion) {
    const fm = [
      `prompt_version: "2.0"`,
      `prompt_type: "${type}"`,
      `prompt_description: "Test prompt for ${type}"`,
      `based_on_scholar_version: "${basedOnVersion}"`
    ].join('\n');
    return createProjectPrompt(type, fm);
  }

  /**
   * Helper: create a valid prompt without based_on_scholar_version.
   */
  function createUnversionedPrompt(type) {
    const fm = [
      `prompt_version: "2.0"`,
      `prompt_type: "${type}"`,
      `prompt_description: "Test prompt for ${type}"`
    ].join('\n');
    return createProjectPrompt(type, fm);
  }

  // -----------------------------------------------------------------------
  // checkUpgrades
  // -----------------------------------------------------------------------
  describe('checkUpgrades', () => {
    it('should return hasUpgrades false when no .flow/ directory exists', async () => {
      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(false);
      expect(result.prompts).toEqual([]);
      expect(result.scholarVersion).toBe(SCHOLAR_VERSION);
      expect(result.formatted).toContain('No project prompt overrides found');
    });

    it('should return hasUpgrades false when .flow/templates/prompts/ is empty', async () => {
      const promptsDir = join(testDir, '.flow', 'templates', 'prompts');
      mkdirSync(promptsDir, { recursive: true });

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(false);
      expect(result.prompts).toEqual([]);
      expect(result.formatted).toContain('No project prompt overrides found');
    });

    it('should return status "current" when based_on_scholar_version matches', async () => {
      createVersionedPrompt('lecture-notes', SCHOLAR_VERSION);

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(false);
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].status).toBe('current');
      expect(result.prompts[0].type).toBe('lecture-notes');
      expect(result.prompts[0].basedOnVersion).toBe(SCHOLAR_VERSION);
      expect(result.prompts[0].currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should return status "stale" when based_on_scholar_version is older', async () => {
      createVersionedPrompt('lecture-notes', '2.6.0');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(true);
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].status).toBe('stale');
      expect(result.prompts[0].basedOnVersion).toBe('2.6.0');
      expect(result.prompts[0].currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should return status "unknown" when based_on_scholar_version is missing', async () => {
      createUnversionedPrompt('quiz');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(false);
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].status).toBe('unknown');
      expect(result.prompts[0].basedOnVersion).toBeNull();
    });

    it('should handle multiple prompts with mixed statuses', async () => {
      createVersionedPrompt('lecture-notes', SCHOLAR_VERSION);
      createVersionedPrompt('quiz', '2.5.0');
      createUnversionedPrompt('exam');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(true);
      expect(result.prompts).toHaveLength(3);

      const byType = {};
      for (const p of result.prompts) {
        byType[p.type] = p;
      }

      expect(byType['lecture-notes'].status).toBe('current');
      expect(byType['quiz'].status).toBe('stale');
      expect(byType['exam'].status).toBe('unknown');
    });

    it('should include expected text in formatted output for stale prompts', async () => {
      createVersionedPrompt('lecture-notes', '2.6.0');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.formatted).toContain('Prompt changes detected');
      expect(result.formatted).toContain('lecture-notes.md');
      expect(result.formatted).toContain('Version drift');
      expect(result.formatted).toContain('v2.6.0');
      expect(result.formatted).toContain('/teaching:config diff');
    });

    it('should include expected text in formatted output for unknown prompts', async () => {
      createUnversionedPrompt('quiz');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.formatted).toContain('Prompts without version tracking');
      expect(result.formatted).toContain('quiz.md');
      expect(result.formatted).toContain('No based_on_scholar_version');
    });

    it('should show "All project prompts are up to date" when all current', async () => {
      createVersionedPrompt('lecture-notes', SCHOLAR_VERSION);
      createVersionedPrompt('quiz', SCHOLAR_VERSION);

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(false);
      expect(result.formatted).toContain('All project prompts are up to date');
    });

    it('should log debug messages when debug option is enabled', async () => {
      createVersionedPrompt('lecture-notes', '2.5.0');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await PromptLoader.checkUpgrades(testDir, { debug: true });

      const logMessages = consoleSpy.mock.calls.map(c => c[0]);
      expect(logMessages.some(m => m.includes('[scholar:prompt]'))).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', async () => {
      createVersionedPrompt('lecture-notes', '2.5.0');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const originalEnv = process.env.SCHOLAR_DEBUG;
      delete process.env.SCHOLAR_DEBUG;

      await PromptLoader.checkUpgrades(testDir, { debug: false });

      const logMessages = consoleSpy.mock.calls.map(c => c[0]);
      expect(logMessages.filter(m => m.includes('[scholar:prompt]'))).toHaveLength(0);

      consoleSpy.mockRestore();
      if (originalEnv !== undefined) {
        process.env.SCHOLAR_DEBUG = originalEnv;
      }
    });

    it('should include path in each prompt result', async () => {
      const expectedPath = createVersionedPrompt('lecture-notes', SCHOLAR_VERSION);

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.prompts[0].path).toBe(expectedPath);
    });

    it('should ignore non-.md files in prompts directory', async () => {
      createVersionedPrompt('lecture-notes', SCHOLAR_VERSION);

      // Add non-md files
      const promptsDir = join(testDir, '.flow', 'templates', 'prompts');
      writeFileSync(join(promptsDir, 'notes.txt'), 'not a prompt');
      writeFileSync(join(promptsDir, 'config.json'), '{}');
      writeFileSync(join(promptsDir, '.hidden'), 'hidden file');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].type).toBe('lecture-notes');
    });

    it('should handle prompt with no frontmatter as unknown status', async () => {
      const promptsDir = join(testDir, '.flow', 'templates', 'prompts');
      mkdirSync(promptsDir, { recursive: true });
      writeFileSync(join(promptsDir, 'lecture-notes.md'), '# Just a body\n\nNo frontmatter.');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].status).toBe('unknown');
      expect(result.prompts[0].basedOnVersion).toBeNull();
    });

    it('should handle malformed YAML in project prompt gracefully', async () => {
      const promptsDir = join(testDir, '.flow', 'templates', 'prompts');
      mkdirSync(promptsDir, { recursive: true });
      writeFileSync(
        join(promptsDir, 'lecture-notes.md'),
        '---\n{{invalid: yaml: [}\n---\n\nBody content'
      );

      const result = await PromptLoader.checkUpgrades(testDir);

      // Should not throw, should mark as unknown
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].status).toBe('unknown');
      expect(result.prompts[0].basedOnVersion).toBeNull();
    });

    it('should treat a future/different version as stale', async () => {
      // A version newer than current also triggers stale (version mismatch)
      createVersionedPrompt('quiz', '9.9.9');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(true);
      expect(result.prompts[0].status).toBe('stale');
    });

    it('should set scholarVersion on the result object', async () => {
      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.scholarVersion).toBe(SCHOLAR_VERSION);
    });

    it('should include formatted header with Scholar version for mixed results', async () => {
      createVersionedPrompt('lecture-notes', '2.5.0');
      createVersionedPrompt('quiz', SCHOLAR_VERSION);

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.formatted).toContain(`Scholar v${SCHOLAR_VERSION}`);
      expect(result.formatted).toContain('Prompt upgrade check');
    });
  });

  // -----------------------------------------------------------------------
  // isFirstRunAfterUpgrade
  // -----------------------------------------------------------------------
  describe('isFirstRunAfterUpgrade', () => {
    it('should return isFirstRun true when no .flow/ directory exists', async () => {
      const result = await PromptLoader.isFirstRunAfterUpgrade(testDir);

      expect(result.isFirstRun).toBe(true);
      expect(result.previousVersion).toBeNull();
      expect(result.currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should return isFirstRun true when no .scholar-version file exists', async () => {
      mkdirSync(join(testDir, '.flow'), { recursive: true });

      const result = await PromptLoader.isFirstRunAfterUpgrade(testDir);

      expect(result.isFirstRun).toBe(true);
      expect(result.previousVersion).toBeNull();
      expect(result.currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should return isFirstRun false when .scholar-version matches current', async () => {
      const flowDir = join(testDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, '.scholar-version'), SCHOLAR_VERSION);

      const result = await PromptLoader.isFirstRunAfterUpgrade(testDir);

      expect(result.isFirstRun).toBe(false);
      expect(result.previousVersion).toBe(SCHOLAR_VERSION);
      expect(result.currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should return isFirstRun true when .scholar-version has older version', async () => {
      const flowDir = join(testDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, '.scholar-version'), '2.6.0');

      const result = await PromptLoader.isFirstRunAfterUpgrade(testDir);

      expect(result.isFirstRun).toBe(true);
      expect(result.previousVersion).toBe('2.6.0');
      expect(result.currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should return isFirstRun true when .scholar-version has newer version', async () => {
      const flowDir = join(testDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, '.scholar-version'), '9.0.0');

      const result = await PromptLoader.isFirstRunAfterUpgrade(testDir);

      expect(result.isFirstRun).toBe(true);
      expect(result.previousVersion).toBe('9.0.0');
      expect(result.currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should trim whitespace from stored version', async () => {
      const flowDir = join(testDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, '.scholar-version'), `  ${SCHOLAR_VERSION}  \n`);

      const result = await PromptLoader.isFirstRunAfterUpgrade(testDir);

      expect(result.isFirstRun).toBe(false);
    });

    it('should log debug messages when debug option is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await PromptLoader.isFirstRunAfterUpgrade(testDir, { debug: true });

      const logMessages = consoleSpy.mock.calls.map(c => c[0]);
      expect(logMessages.some(m => m.includes('[scholar:prompt]'))).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // recordVersion
  // -----------------------------------------------------------------------
  describe('recordVersion', () => {
    it('should create .flow/.scholar-version with correct content', async () => {
      mkdirSync(join(testDir, '.flow'), { recursive: true });

      await PromptLoader.recordVersion(testDir);

      const versionFile = join(testDir, '.flow', '.scholar-version');
      expect(existsSync(versionFile)).toBe(true);
      expect(readFileSync(versionFile, 'utf8')).toBe(SCHOLAR_VERSION);
    });

    it('should create .flow/ directory if it does not exist', async () => {
      expect(existsSync(join(testDir, '.flow'))).toBe(false);

      await PromptLoader.recordVersion(testDir);

      expect(existsSync(join(testDir, '.flow'))).toBe(true);
      const content = readFileSync(join(testDir, '.flow', '.scholar-version'), 'utf8');
      expect(content).toBe(SCHOLAR_VERSION);
    });

    it('should overwrite existing version file', async () => {
      const flowDir = join(testDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, '.scholar-version'), '1.0.0');

      await PromptLoader.recordVersion(testDir);

      const content = readFileSync(join(flowDir, '.scholar-version'), 'utf8');
      expect(content).toBe(SCHOLAR_VERSION);
    });

    it('should work in combination with isFirstRunAfterUpgrade', async () => {
      // Initially first run (no version file)
      const first = await PromptLoader.isFirstRunAfterUpgrade(testDir);
      expect(first.isFirstRun).toBe(true);

      // Record version
      await PromptLoader.recordVersion(testDir);

      // Now not first run
      const second = await PromptLoader.isFirstRunAfterUpgrade(testDir);
      expect(second.isFirstRun).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // validateMetadata regression (based_on_scholar_version)
  // -----------------------------------------------------------------------
  describe('validateMetadata — based_on_scholar_version field', () => {
    it('should NOT warn about based_on_scholar_version as unknown field', () => {
      const meta = {
        prompt_version: '2.0',
        prompt_type: 'lecture-notes',
        prompt_description: 'Test prompt',
        based_on_scholar_version: '2.7.0'
      };

      const validation = PromptLoader.validateMetadata(meta);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toEqual([]);
      expect(validation.errors).toEqual([]);
    });

    it('should accept scaffolded prompt metadata with based_on_scholar_version', () => {
      // Simulates what a scaffolded prompt looks like
      const meta = {
        prompt_version: '2.0',
        prompt_type: 'quiz',
        prompt_description: 'Quiz generation prompt',
        author: 'Scholar',
        last_updated: '2026-02-09',
        based_on_scholar_version: SCHOLAR_VERSION,
        variables: {
          required: ['topic', 'course_level'],
          optional: ['num_questions']
        }
      };

      const validation = PromptLoader.validateMetadata(meta);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle .flow/templates/ existing but no prompts/ subdirectory', async () => {
      mkdirSync(join(testDir, '.flow', 'templates'), { recursive: true });

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.hasUpgrades).toBe(false);
      expect(result.prompts).toEqual([]);
    });

    it('should handle prompt file with empty frontmatter as unknown', async () => {
      const promptsDir = join(testDir, '.flow', 'templates', 'prompts');
      mkdirSync(promptsDir, { recursive: true });
      writeFileSync(join(promptsDir, 'exam.md'), '---\n\n---\n\nBody');

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].status).toBe('unknown');
    });

    it('should handle prompt type names from file basename', async () => {
      createVersionedPrompt('my-custom-type', SCHOLAR_VERSION);

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].type).toBe('my-custom-type');
    });

    it('should handle based_on_scholar_version as empty string as unknown', async () => {
      const fm = [
        'prompt_version: "2.0"',
        'prompt_type: "exam"',
        'prompt_description: "Test"',
        'based_on_scholar_version: ""'
      ].join('\n');
      createProjectPrompt('exam', fm);

      const result = await PromptLoader.checkUpgrades(testDir);

      expect(result.prompts[0].status).toBe('unknown');
      expect(result.prompts[0].basedOnVersion).toBeNull();
    });
  });
});
