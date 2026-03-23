/**
 * Tests for safe YAML file writer
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { safeWriteYaml } from '../../../src/teaching/utils/safe-write.js';

describe('safeWriteYaml', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-safe-write-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('basic writing', () => {
    it('should write an object as YAML', () => {
      const target = path.join(tmpDir, 'test.yml');
      const data = { schema_version: '1.0', weeks: [{ week: 1, title: 'Test' }] };

      const result = safeWriteYaml(target, data);

      expect(result.success).toBe(true);
      const written = yaml.load(fs.readFileSync(target, 'utf8'));
      expect(written.schema_version).toBe('1.0');
      expect(written.weeks[0].title).toBe('Test');
    });

    it('should write a raw YAML string', () => {
      const target = path.join(tmpDir, 'raw.yml');
      const rawYaml = 'schema_version: "1.0"\nweeks: []\n';

      const result = safeWriteYaml(target, rawYaml);

      expect(result.success).toBe(true);
      const content = fs.readFileSync(target, 'utf8');
      expect(content).toBe(rawYaml);
    });

    it('should create parent directories if missing', () => {
      const target = path.join(tmpDir, 'deep', 'nested', 'file.yml');
      const data = { key: 'value' };

      const result = safeWriteYaml(target, data);

      expect(result.success).toBe(true);
      expect(fs.existsSync(target)).toBe(true);
    });
  });

  describe('backup behavior', () => {
    it('should create .bak backup when overwriting', () => {
      const target = path.join(tmpDir, 'existing.yml');
      fs.writeFileSync(target, 'original: content\n', 'utf8');

      const result = safeWriteYaml(target, { updated: 'content' });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBe(`${target}.bak`);
      expect(fs.existsSync(`${target}.bak`)).toBe(true);

      const backup = fs.readFileSync(`${target}.bak`, 'utf8');
      expect(backup).toBe('original: content\n');
    });

    it('should not create backup for new files', () => {
      const target = path.join(tmpDir, 'new.yml');

      const result = safeWriteYaml(target, { key: 'value' });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeNull();
      expect(fs.existsSync(`${target}.bak`)).toBe(false);
    });

    it('should skip backup when backup=false', () => {
      const target = path.join(tmpDir, 'no-backup.yml');
      fs.writeFileSync(target, 'original: true\n', 'utf8');

      const result = safeWriteYaml(target, { updated: true }, { backup: false });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeNull();
      expect(fs.existsSync(`${target}.bak`)).toBe(false);
    });
  });

  describe('atomic write', () => {
    it('should write atomically via tmp+rename', () => {
      const target = path.join(tmpDir, 'atomic.yml');
      const data = { atomic: true, value: 42 };

      const result = safeWriteYaml(target, data, { atomic: true });

      expect(result.success).toBe(true);
      expect(fs.existsSync(target)).toBe(true);
      expect(fs.existsSync(`${target}.tmp`)).toBe(false);

      const written = yaml.load(fs.readFileSync(target, 'utf8'));
      expect(written.atomic).toBe(true);
    });

    it('should support backup + atomic together', () => {
      const target = path.join(tmpDir, 'both.yml');
      fs.writeFileSync(target, 'original: yes\n', 'utf8');

      const result = safeWriteYaml(target, { replaced: true }, { atomic: true, backup: true });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBe(`${target}.bak`);
      expect(fs.readFileSync(`${target}.bak`, 'utf8')).toBe('original: yes\n');
    });
  });

  describe('YAML options', () => {
    it('should accept custom yamlOptions', () => {
      const target = path.join(tmpDir, 'options.yml');
      const data = { long_line: 'a'.repeat(200) };

      safeWriteYaml(target, data, { yamlOptions: { lineWidth: -1 } });

      const content = fs.readFileSync(target, 'utf8');
      // With lineWidth: -1, the line should not wrap
      expect(content).toContain('a'.repeat(200));
    });
  });

  describe('error handling', () => {
    it('should return error for invalid path', () => {
      // Try to write to a path where parent is a file, not a directory
      const blockingFile = path.join(tmpDir, 'blocker');
      fs.writeFileSync(blockingFile, 'I am a file', 'utf8');
      const target = path.join(blockingFile, 'sub', 'test.yml');

      const result = safeWriteYaml(target, { key: 'value' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
