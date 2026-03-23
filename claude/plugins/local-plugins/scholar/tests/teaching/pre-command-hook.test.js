/**
 * Unit Tests for Pre-Command Hook
 *
 * Tests the pre-command sync hook that runs before Scholar commands.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ensureSynced,
  formatPreCommandResult,
  shouldRunPreCommandHook
} from '../../src/teaching/config/pre-command-hook.js';

describe('Pre-Command Hook', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = join(tmpdir(), `pre-command-hook-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('ensureSynced', () => {
    it('should return success for non-teaching project', async () => {
      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      expect(result.success).toBe(true);
      expect(result.syncRequired).toBe(false);
    });

    it('should sync files when lesson plans exist', async () => {
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });
      writeFileSync(join(lessonPlans, 'week01.yml'), 'week: 1');

      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
    });

    it('should sync files when .claude config exists', async () => {
      const claude = join(tempDir, '.claude');
      mkdirSync(claude, { recursive: true });
      writeFileSync(join(claude, 'teaching-style.yml'), 'tone: formal');

      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
    });

    it('should detect .flow/teach-config.yml', async () => {
      const flow = join(tempDir, '.flow');
      mkdirSync(flow, { recursive: true });
      writeFileSync(join(flow, 'teach-config.yml'), 'course: test');

      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      // .flow config is detected but not synced (it's not in sync patterns)
      expect(result.success).toBe(true);
    });

    it('should skip sync when skipSync option is true', async () => {
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });
      writeFileSync(join(lessonPlans, 'week01.yml'), 'week: 1');

      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir,
        skipSync: true
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
    });

    it('should report failed syncs', async () => {
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });
      writeFileSync(join(lessonPlans, 'invalid.yml'), 'invalid: yaml: {{{{');

      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      expect(result.failedCount).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.success).toBe(true); // Non-strict mode
    });

    it('should fail in strict mode when sync fails', async () => {
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });
      writeFileSync(join(lessonPlans, 'invalid.yml'), 'invalid: yaml: {{{{');

      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir,
        strict: true
      });

      expect(result.success).toBe(false);
    });

    it('should track duration', async () => {
      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should skip unchanged files', async () => {
      const lessonPlans = join(tempDir, 'content', 'lesson-plans');
      mkdirSync(lessonPlans, { recursive: true });
      writeFileSync(join(lessonPlans, 'week01.yml'), 'week: 1');

      // First sync
      await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      // Second sync (should skip)
      const result = await ensureSynced({
        command: 'teaching:lecture',
        cwd: tempDir
      });

      expect(result.skippedCount).toBe(1);
      expect(result.syncedCount).toBe(0);
    });
  });

  describe('formatPreCommandResult', () => {
    it('should format sync result', () => {
      const result = {
        success: true,
        syncRequired: true,
        syncedCount: 3,
        skippedCount: 2,
        failedCount: 0,
        warnings: [],
        errors: [],
        duration: 150
      };

      const formatted = formatPreCommandResult(result);

      expect(formatted).toContain('Synced 3 file(s)');
      expect(formatted).toContain('150ms');
      expect(formatted).toContain('2 file(s) unchanged');
    });

    it('should format warnings', () => {
      const result = {
        success: true,
        syncRequired: false,
        syncedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        warnings: ['Warning 1', 'Warning 2'],
        errors: [],
        duration: 50
      };

      const formatted = formatPreCommandResult(result);

      expect(formatted).toContain('Warnings: 2');
      expect(formatted).toContain('Warning 1');
      expect(formatted).toContain('Warning 2');
    });

    it('should format errors', () => {
      const result = {
        success: false,
        syncRequired: false,
        syncedCount: 0,
        skippedCount: 0,
        failedCount: 1,
        warnings: [],
        errors: ['Error message'],
        duration: 50
      };

      const formatted = formatPreCommandResult(result);

      expect(formatted).toContain('Errors: 1');
      expect(formatted).toContain('Error message');
    });

    it('should truncate many warnings', () => {
      const result = {
        success: true,
        syncRequired: false,
        syncedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        warnings: ['W1', 'W2', 'W3', 'W4', 'W5'],
        errors: [],
        duration: 50
      };

      const formatted = formatPreCommandResult(result);

      expect(formatted).toContain('W1');
      expect(formatted).toContain('W2');
      expect(formatted).toContain('W3');
      expect(formatted).toContain('and 2 more');
      expect(formatted).not.toContain('W4');
    });
  });

  describe('shouldRunPreCommandHook', () => {
    it('should return true for teaching commands', () => {
      expect(shouldRunPreCommandHook('teaching:lecture')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:slides')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:exam')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:quiz')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:assignment')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:syllabus')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:rubric')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:feedback')).toBe(true);
    });

    it('should return false for demo command', () => {
      // Demo creates new config, doesn't need sync
      expect(shouldRunPreCommandHook('teaching:demo')).toBe(false);
    });

    it('should return false for non-teaching commands', () => {
      expect(shouldRunPreCommandHook('research:cite')).toBe(false);
      expect(shouldRunPreCommandHook('help')).toBe(false);
    });

    it('should handle command with arguments', () => {
      expect(shouldRunPreCommandHook('teaching:lecture "Topic"')).toBe(true);
      expect(shouldRunPreCommandHook('teaching:exam --dry-run')).toBe(true);
    });
  });
});
