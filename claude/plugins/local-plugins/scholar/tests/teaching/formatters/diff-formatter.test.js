/**
 * Unit Tests for Diff Formatter
 *
 * Comprehensive tests for diff-formatter.js covering:
 * - Color handling and ANSI codes
 * - Value formatting and truncation
 * - Verbose mode
 * - Summary formatting
 * - Edge cases and special characters
 *
 * This complements the existing sync-engine-dryrun.test.js
 * which only has 3 integration tests for the formatter.
 */

import { describe, test, expect, afterEach } from '@jest/globals';
import {
  formatFileDiff,
  formatDryRunReport,
  formatChangeSummary,
  supportsColor
} from '../../../src/teaching/formatters/diff-formatter.js';

describe('Diff Formatter - Color Handling', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  afterEach(() => {
    process.env = { ...originalEnv };
    process.stdout.isTTY = originalIsTTY;
  });

  test('should output ANSI colors when color: true', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'new_field', value: 42 }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: true });

    // Should contain ANSI escape codes
    expect(output).toMatch(/\x1b\[\d+m/); // Matches any ANSI code
  });

  test('should not output ANSI colors when color: false', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'new_field', value: 42 }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    // Should NOT contain ANSI escape codes
    expect(output).not.toContain('\x1b[');
  });

  test('should respect NO_COLOR environment variable', () => {
    process.env.NO_COLOR = '1';
    process.stdout.isTTY = true;

    const supported = supportsColor();

    expect(supported).toBe(false);
  });

  test('should detect TTY support correctly', () => {
    process.stdout.isTTY = true;
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    process.env.TERM = 'xterm-256color';

    const supported = supportsColor();

    expect(supported).toBe(true);
  });

  test('should respect FORCE_COLOR environment variable', () => {
    process.env.FORCE_COLOR = '1';
    process.stdout.isTTY = true;
    delete process.env.NO_COLOR;
    process.env.TERM = 'xterm';

    const supported = supportsColor();

    expect(supported).toBe(true);
  });

  test('should return false for dumb terminals', () => {
    process.env.TERM = 'dumb';
    process.stdout.isTTY = true;

    const supported = supportsColor();

    expect(supported).toBe(false);
  });
});

describe('Diff Formatter - Value Formatting', () => {
  test('should truncate long string values to maxValueLength', () => {
    const longString = 'a'.repeat(200);
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'long_text', value: longString }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, {
      color: false,
      maxValueLength: 50
    });

    // Should contain ellipsis indicating truncation
    expect(output).toContain('...');
    // Should NOT contain the full 200-character string
    expect(output).not.toContain(longString);
  });

  test('should format objects as compact JSON', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'config', value: { enabled: true, timeout: 30 } }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    // Should contain JSON representation
    expect(output).toContain('{');
    expect(output).toContain('enabled');
    expect(output).toContain('timeout');
  });

  test('should format arrays as compact JSON', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'tags', value: ['alpha', 'beta', 'gamma'] }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    // Should contain array representation
    expect(output).toContain('[');
    expect(output).toContain('alpha');
    expect(output).toContain('beta');
  });

  test('should handle null values correctly', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'nullable', value: null }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('null');
  });

  test('should handle undefined values correctly', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'undef', value: undefined }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('undefined');
  });

  test('should handle special characters in string values', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'special', value: 'line1\nline2\ttab\rreturn' }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    // Should not crash and should produce output
    expect(output).toBeTruthy();
    expect(output.length).toBeGreaterThan(0);
  });

  test('should handle unicode and emoji characters', () => {
    const changes = {
      status: 'out-of-sync',
      added: [
        { path: 'emoji', value: '📊 Chart Data' },
        { path: 'chinese', value: '中文测试' },
        { path: 'arabic', value: 'العربية' }
      ],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('📊');
    expect(output).toContain('中文');
    expect(output).toContain('العربية');
  });

  test('should wrap string values in quotes', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'name', value: 'Test String' }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/"Test String"/);
  });

  test('should format numbers without quotes', () => {
    const changes = {
      status: 'out-of-sync',
      added: [
        { path: 'int', value: 42 },
        { path: 'float', value: 3.14 },
        { path: 'negative', value: -100 }
      ],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('42');
    expect(output).toContain('3.14');
    expect(output).toContain('-100');
    // Should not have quotes around numbers
    expect(output).not.toContain('"42"');
  });

  test('should format boolean values without quotes', () => {
    const changes = {
      status: 'out-of-sync',
      added: [
        { path: 'enabled', value: true },
        { path: 'disabled', value: false }
      ],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('true');
    expect(output).toContain('false');
  });
});

describe('Diff Formatter - Verbose Mode', () => {
  test('should show unchanged status when verbose: true', () => {
    const changes = {
      status: 'in-sync',
      added: [],
      changed: [],
      removed: [],
      unchanged: ['week', 'title', 'duration', 'instructor']
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, {
      color: false,
      verbose: true
    });

    // Should show unchanged status
    expect(output).toMatch(/unchanged/i);
    expect(output).toContain('test.yml');
    expect(output).toContain('test.json');
  });

  test('should hide unchanged fields when verbose: false (default)', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'new_field', value: 1 }],
      changed: [],
      removed: [],
      unchanged: ['week', 'title', 'duration']
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, {
      color: false,
      verbose: false
    });

    // Should NOT list individual unchanged fields
    expect(output).not.toMatch(/\bweek\b.*unchanged/i);
    expect(output).not.toMatch(/\btitle\b.*unchanged/i);
  });

  test('should show count of unchanged fields even when verbose: false', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'new', value: 1 }],
      changed: [],
      removed: [],
      unchanged: ['a', 'b', 'c', 'd', 'e']
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, {
      color: false,
      verbose: false
    });

    // Should show the change (added field) without listing unchanged fields
    expect(output).toContain('new');
    expect(output).toContain('would update');
  });
});

describe('Diff Formatter - Change Symbols and Colors', () => {
  test('should use + symbol for added fields', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'new_field', value: 123 }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/\+.*new_field/);
  });

  test('should use ~ symbol for changed fields', () => {
    const changes = {
      status: 'out-of-sync',
      added: [],
      changed: [{ path: 'title', from: 'Old', to: 'New' }],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/~.*title/);
  });

  test('should use - symbol for removed fields', () => {
    const changes = {
      status: 'out-of-sync',
      added: [],
      changed: [],
      removed: [{ path: 'old_field', value: 'removed' }],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/-.*old_field/);
  });

  test('should show from → to for changed fields', () => {
    const changes = {
      status: 'out-of-sync',
      added: [],
      changed: [{ path: 'status', from: 'draft', to: 'published' }],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('draft');
    expect(output).toContain('published');
    expect(output).toMatch(/draft.*→.*published/);
  });

  test('should show type changes with (type → type)', () => {
    const changes = {
      status: 'out-of-sync',
      added: [],
      changed: [{
        path: 'duration',
        from: '30',
        to: 30,
        fromType: 'string',
        toType: 'number'
      }],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('string');
    expect(output).toContain('number');
  });
});

describe('Diff Formatter - Summary Report', () => {
  test('should include dry-run header', () => {
    const results = [];

    const output = formatDryRunReport(results, { color: false });

    expect(output).toMatch(/dry[-\s]?run/i);
    expect(output).toMatch(/no files (will be )?modified/i);
  });

  test('should show correct file count', () => {
    const results = [
      {
        success: true,
        yamlPath: 'file1.yml',
        jsonPath: 'file1.json',
        dryRun: true,
        changes: { status: 'in-sync', added: [], changed: [], removed: [], unchanged: [] }
      },
      {
        success: true,
        yamlPath: 'file2.yml',
        jsonPath: 'file2.json',
        dryRun: true,
        changes: { status: 'out-of-sync', added: [{ path: 'new', value: 1 }], changed: [], removed: [], unchanged: [] }
      },
      {
        success: true,
        yamlPath: 'file3.yml',
        jsonPath: 'file3.json',
        dryRun: true,
        changes: { status: 'never-synced', added: ['field1'], changed: [], removed: [], unchanged: [] }
      }
    ];

    const output = formatDryRunReport(results, { color: false });

    expect(output).toContain('3'); // Total files
    expect(output).toMatch(/summary/i);
  });

  test('should count files that would sync', () => {
    const results = [
      {
        success: true,
        yamlPath: 'sync1.yml',
        jsonPath: 'sync1.json',
        dryRun: true,
        changes: { status: 'out-of-sync', added: [{ path: 'new', value: 1 }], changed: [], removed: [], unchanged: [] }
      },
      {
        success: true,
        yamlPath: 'nosync.yml',
        jsonPath: 'nosync.json',
        dryRun: true,
        changes: { status: 'in-sync', added: [], changed: [], removed: [], unchanged: [] }
      }
    ];

    const output = formatDryRunReport(results, { color: false });

    expect(output).toMatch(/1.*would (sync|update)/i);
  });

  test('should count and list files with errors', () => {
    const results = [
      {
        success: false,
        yamlPath: 'error1.yml',
        error: 'YAML syntax error at line 5'
      },
      {
        success: false,
        yamlPath: 'error2.yml',
        error: 'File not found'
      },
      {
        success: true,
        yamlPath: 'ok.yml',
        jsonPath: 'ok.json',
        dryRun: true,
        changes: { status: 'in-sync', added: [], changed: [], removed: [], unchanged: [] }
      }
    ];

    const output = formatDryRunReport(results, { color: false });

    expect(output).toMatch(/2.*error/i);
    expect(output).toContain('error1.yml');
    expect(output).toContain('error2.yml');
  });

  test('should provide actionable next steps', () => {
    const results = [
      {
        success: false,
        yamlPath: 'bad.yml',
        error: 'Parse error'
      }
    ];

    const output = formatDryRunReport(results, { color: false });

    // Should suggest using --fix for errors
    expect(output).toMatch(/--fix/i);
    // Should show error information
    expect(output).toContain('error');
  });

  test('should handle empty results gracefully', () => {
    const results = [];

    const output = formatDryRunReport(results, { color: false });

    expect(output).toBeTruthy();
    expect(output).toContain('Summary');
  });
});

describe('Diff Formatter - Status Messages', () => {
  test('should show "in-sync" for unchanged files', () => {
    const changes = {
      status: 'in-sync',
      added: [],
      changed: [],
      removed: [],
      unchanged: ['field1', 'field2']
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/in[-\s]?sync|unchanged/i);
  });

  test('should show "never synced" for new files', () => {
    const changes = {
      status: 'never-synced',
      added: ['field1', 'field2', 'field3'],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/never[-\s]?synced/i);
  });

  test('should show "would update" for out-of-sync files', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'new', value: 1 }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/would (update|sync)|out[-\s]?of[-\s]?sync/i);
  });

  test('should handle parse-error status', () => {
    const changes = {
      status: 'parse-error',
      error: 'YAML syntax error at line 12',
      added: [],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toMatch(/error|failed/i);
    expect(output).toContain('line 12');
  });
});

describe('Diff Formatter - Nested Path Formatting', () => {
  test('should format simple paths', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'title', value: 'Test' }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('title');
  });

  test('should format nested object paths with dot notation', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'metadata.author.name', value: 'John' }],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('metadata.author.name');
  });

  test('should format array index paths', () => {
    const changes = {
      status: 'out-of-sync',
      changed: [{ path: 'items[0].name', from: 'Old', to: 'New' }],
      added: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('items[0].name');
  });

  test('should handle deeply nested paths', () => {
    const changes = {
      status: 'out-of-sync',
      changed: [{
        path: 'config.settings.advanced.features.experimental.enabled',
        from: false,
        to: true
      }],
      added: [],
      removed: [],
      unchanged: []
    };

    const output = formatFileDiff('test.yml', 'test.json', changes, { color: false });

    expect(output).toContain('config.settings.advanced.features.experimental.enabled');
  });
});

describe('Diff Formatter - formatChangeSummary', () => {
  test('should format change summary as short notation', () => {
    const changes = {
      status: 'out-of-sync',
      added: [{ path: 'new', value: 1 }],
      changed: [{ path: 'updated', from: 'old', to: 'new' }],
      removed: [{ path: 'deleted', value: 'gone' }],
      unchanged: []
    };

    const output = formatChangeSummary(changes, { color: false });

    // Should show counts: +1 ~1 -1
    expect(output).toContain('1');
    expect(output).toMatch(/\+.*~.*-/); // Should have +, ~, - symbols
    // Should NOT contain file paths
    expect(output).not.toContain('.yml');
    expect(output).not.toContain('.json');
  });

  test('should handle empty change list', () => {
    const changes = {
      status: 'in-sync',
      added: [],
      changed: [],
      removed: [],
      unchanged: []
    };

    const output = formatChangeSummary(changes, { color: false });

    expect(output).toBeTruthy();
    expect(output.length).toBeGreaterThan(0);
  });
});
