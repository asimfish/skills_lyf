/**
 * Unit Tests for Error Formatter
 *
 * Tests IDE-style error output formatting.
 */

import {
  formatError,
  formatErrors,
  formatSummary,
  formatProgress,
  formatIgnoreHint,
  supportsColor,
  formatAsJson
} from '../../src/teaching/formatters/error-formatter.js';

describe('Error Formatter', () => {
  describe('formatError', () => {
    const testError = {
      level: 'error',
      line: 15,
      column: 3,
      message: 'Missing required field',
      rule: 'schema:required',
      suggestion: 'Add the required field'
    };

    it('should format basic error', () => {
      const output = formatError('/path/to/file.yml', testError, { color: false });

      expect(output).toContain('file.yml:15:3');
      expect(output).toContain('error');
      expect(output).toContain('Missing required field');
    });

    it('should include suggestion in output', () => {
      const output = formatError('/path/to/file.yml', testError, { color: false });

      expect(output).toContain('Suggestion');
      expect(output).toContain('Add the required field');
    });

    it('should include rule in verbose mode', () => {
      const output = formatError('/path/to/file.yml', testError, { color: false, verbose: true });

      expect(output).toContain('Rule');
      expect(output).toContain('schema:required');
    });

    it('should not include rule in non-verbose mode', () => {
      const output = formatError('/path/to/file.yml', testError, { color: false, verbose: false });

      expect(output).not.toContain('Rule:');
    });

    it('should handle warning level', () => {
      const warning = { ...testError, level: 'warning' };
      const output = formatError('/path/to/file.yml', warning, { color: false });

      expect(output).toContain('warning');
    });

    it('should handle info level', () => {
      const info = { ...testError, level: 'info' };
      const output = formatError('/path/to/file.yml', info, { color: false });

      expect(output).toContain('info');
    });

    it('should handle missing column', () => {
      const noColumn = { ...testError, column: undefined };
      const output = formatError('/path/to/file.yml', noColumn, { color: false });

      // With column: file.yml:15:3: error
      // Without column: file.yml:15: error (no column number between line and separator)
      expect(output).toContain('file.yml:15:');
      expect(output).not.toContain('file.yml:15:3');
    });

    it('should make path relative to cwd', () => {
      const output = formatError('/some/long/path/to/file.yml', testError, {
        color: false,
        cwd: '/some/long/path'
      });

      expect(output).toContain('to/file.yml');
      expect(output).not.toContain('/some/long/path');
    });

    it('should handle docLink in verbose mode', () => {
      const withDoc = { ...testError, docLink: 'https://docs.example.com/schema' };
      const output = formatError('/path/file.yml', withDoc, { color: false, verbose: true });

      expect(output).toContain('See:');
      expect(output).toContain('https://docs.example.com/schema');
    });
  });

  describe('formatErrors', () => {
    const errors = [
      { level: 'error', line: 20, message: 'Second error' },
      { level: 'error', line: 10, message: 'First error' },
      { level: 'error', line: 15, message: 'Middle error' }
    ];

    it('should sort errors by line number', () => {
      const output = formatErrors('/path/file.yml', errors, { color: false });

      const lines = output.split('\n');
      expect(lines[0]).toContain('10');
      expect(lines[1]).toContain('15');
      expect(lines[2]).toContain('20');
    });

    it('should return empty string for no errors', () => {
      const output = formatErrors('/path/file.yml', [], { color: false });

      expect(output).toBe('');
    });

    it('should format all errors', () => {
      const output = formatErrors('/path/file.yml', errors, { color: false });

      expect(output).toContain('First error');
      expect(output).toContain('Second error');
      expect(output).toContain('Middle error');
    });
  });

  describe('formatSummary', () => {
    it('should format summary with errors', () => {
      const stats = { errors: 3, warnings: 2, files: 5, duration: 100 };
      const output = formatSummary(stats, { color: false });

      expect(output).toContain('3 errors');
      expect(output).toContain('2 warnings');
      expect(output).toContain('5 files');
      expect(output).toContain('100ms');
    });

    it('should show All valid when no issues', () => {
      const stats = { errors: 0, warnings: 0, files: 3, duration: 50 };
      const output = formatSummary(stats, { color: false });

      expect(output).toContain('All valid');
    });

    it('should handle singular forms', () => {
      const stats = { errors: 1, warnings: 1, files: 1, duration: 10 };
      const output = formatSummary(stats, { color: false });

      expect(output).toContain('1 error');
      expect(output).not.toContain('1 errors');
      expect(output).toContain('1 warning');
      expect(output).toContain('1 file');
    });

    it('should include info count when present', () => {
      const stats = { errors: 0, warnings: 0, info: 2, files: 1, duration: 10 };
      const output = formatSummary(stats, { color: false });

      expect(output).toContain('2 info');
    });
  });

  describe('formatProgress', () => {
    it('should format progress bar', () => {
      const output = formatProgress(5, 10, 'file.yml', { color: false });

      expect(output).toContain('50%');
      expect(output).toContain('5/10');
      expect(output).toContain('file.yml');
    });

    it('should truncate long filenames', () => {
      const output = formatProgress(1, 10, 'very-long-filename-that-exceeds-limit.yml', { color: false });

      expect(output).toContain('...');
      expect(output.length).toBeLessThan(100);
    });

    it('should handle 0%', () => {
      const output = formatProgress(0, 10, 'file.yml', { color: false });

      expect(output).toContain('0%');
    });

    it('should handle 100%', () => {
      const output = formatProgress(10, 10, 'file.yml', { color: false });

      expect(output).toContain('100%');
    });
  });

  describe('formatIgnoreHint', () => {
    it('should include ignore comment syntax', () => {
      const output = formatIgnoreHint({ color: false });

      expect(output).toContain('scholar-ignore-next-line');
    });
  });

  describe('supportsColor', () => {
    it('should return boolean', () => {
      const result = supportsColor();
      expect(typeof result).toBe('boolean');
    });

    it('should respect NO_COLOR env', () => {
      const original = process.env.NO_COLOR;
      process.env.NO_COLOR = '1';

      expect(supportsColor()).toBe(false);

      if (original === undefined) {
        delete process.env.NO_COLOR;
      } else {
        process.env.NO_COLOR = original;
      }
    });

    it('should respect FORCE_COLOR env', () => {
      const originalNo = process.env.NO_COLOR;
      const originalForce = process.env.FORCE_COLOR;

      delete process.env.NO_COLOR;
      process.env.FORCE_COLOR = '1';

      expect(supportsColor()).toBe(true);

      if (originalNo !== undefined) process.env.NO_COLOR = originalNo;
      if (originalForce === undefined) {
        delete process.env.FORCE_COLOR;
      } else {
        process.env.FORCE_COLOR = originalForce;
      }
    });
  });

  describe('formatAsJson', () => {
    it('should return valid JSON string', () => {
      const result = { errors: [], warnings: [], valid: true };
      const output = formatAsJson(result);

      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should be pretty-printed', () => {
      const result = { key: 'value' };
      const output = formatAsJson(result);

      expect(output).toContain('\n');
      expect(output).toContain('  ');
    });

    it('should preserve all data', () => {
      const result = {
        errors: [{ line: 1, message: 'test' }],
        warnings: [{ line: 2, message: 'warn' }],
        files: 5
      };
      const output = formatAsJson(result);
      const parsed = JSON.parse(output);

      expect(parsed.errors[0].message).toBe('test');
      expect(parsed.warnings[0].message).toBe('warn');
      expect(parsed.files).toBe(5);
    });
  });

  describe('color output', () => {
    it('should include ANSI codes when color enabled', () => {
      const error = { level: 'error', line: 1, message: 'Test' };
      const output = formatError('/path/file.yml', error, { color: true });

      // ANSI escape codes start with \x1b[
      expect(output).toContain('\x1b[');
    });

    it('should not include ANSI codes when color disabled', () => {
      const error = { level: 'error', line: 1, message: 'Test' };
      const output = formatError('/path/file.yml', error, { color: false });

      expect(output).not.toContain('\x1b[');
    });
  });
});
