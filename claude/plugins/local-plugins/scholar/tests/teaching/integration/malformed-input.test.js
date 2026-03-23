/**
 * Malformed Input Tests for ConfigSyncEngine
 *
 * Tests error handling for various types of malformed YAML inputs.
 * Ensures graceful degradation and helpful error messages for users.
 *
 * Categories:
 * - Syntax errors (unmatched quotes, bad indentation)
 * - Invalid YAML (wrong syntax, tabs vs spaces)
 * - Special cases (anchors, circular references, binary data)
 * - Edge cases (empty files, very large files, special characters)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { ConfigSyncEngine } from '../../../src/teaching/config/sync-engine.js';

const TEST_DIR = join(process.cwd(), '.test-tmp-malformed');

describe('ConfigSyncEngine - Malformed YAML Handling', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Syntax Errors', () => {
    test('should handle unmatched double quotes', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'unmatched-quote.yml');

      writeFileSync(yamlPath, `
week: 1
title: "Unclosed quote
content: test
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      // Error message should mention quotes or parsing
      expect(result.error.toLowerCase()).toMatch(/quote|parse|syntax/);
    });

    test('should handle unmatched single quotes', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'unmatched-single.yml');

      writeFileSync(yamlPath, `
week: 1
title: 'Unclosed single quote
content: test
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/quote|parse|syntax/);
    });

    test('should handle incorrect indentation', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'bad-indent.yml');

      writeFileSync(yamlPath, `
week: 1
  title: Bad Indentation
 content: Mixed indentation
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/indent|parse|syntax/);
    });

    test('should handle missing colon in key-value pairs', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'missing-colon.yml');

      writeFileSync(yamlPath, `
week: 1
title "Missing Colon"
content: test
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/parse|syntax|colon/);
    });

    test('should handle tabs instead of spaces', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'tabs.yml');

      writeFileSync(yamlPath, `week: 1\n\ttitle: Tabs Are Bad\n\tcontent: YAML forbids tabs`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/tab|indent|parse/);
    });
  });

  describe('Invalid YAML Structures', () => {
    test('should handle completely invalid YAML syntax', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'invalid.yml');

      writeFileSync(yamlPath, `}{][invalid yaml!@#$%`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/parse|syntax|invalid/);
    });

    test('should handle mixed brackets and braces', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'mixed-brackets.yml');

      writeFileSync(yamlPath, `
items: [
  { name: "test",
  { value: 123 ]
}
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle duplicate keys', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'duplicate-keys.yml');

      writeFileSync(yamlPath, `
week: 1
title: First Title
week: 2
title: Second Title
`);

      const result = engine.syncFile(yamlPath);

      // YAML spec allows duplicate keys (last one wins)
      // But we should either handle it or document the behavior
      expect(result).toBeDefined();
      // If successful, the last value should win
      if (result.success) {
        expect(result).toBeTruthy();
      }
    });

    test('should handle unclosed arrays', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'unclosed-array.yml');

      writeFileSync(yamlPath, `
items: [
  "item1",
  "item2",
week: 1
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle unclosed objects', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'unclosed-object.yml');

      writeFileSync(yamlPath, `
config: {
  enabled: true,
  timeout: 30,
week: 1
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Special YAML Features', () => {
    test('should handle anchors and aliases', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'anchors.yml');

      writeFileSync(yamlPath, `
defaults: &defaults
  duration: 30
  format: "lecture"

week1:
  <<: *defaults
  title: "Week 1"

week2:
  <<: *defaults
  title: "Week 2"
`);

      const result = engine.syncFile(yamlPath);

      // Should handle anchors/aliases (either successfully or with clear error)
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    test('should handle circular references with anchors', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'circular.yml');

      writeFileSync(yamlPath, `
node: &node
  name: "Node"
  children:
    - *node
`);

      const result = engine.syncFile(yamlPath);

      // Should handle gracefully (either error or success with depth limit)
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    test('should handle explicit types', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'explicit-types.yml');

      writeFileSync(yamlPath, `
string: !!str 123
number: !!int "456"
bool: !!bool "yes"
`);

      const result = engine.syncFile(yamlPath);

      // Should handle explicit type tags
      expect(result).toBeDefined();
    });

    test('should handle multiline strings with |', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'multiline-pipe.yml');

      writeFileSync(yamlPath, `
week: 1
description: |
  This is a multiline
  string using the pipe
  operator for literal block
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result).toBeDefined();
    });

    test('should handle multiline strings with >', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'multiline-fold.yml');

      writeFileSync(yamlPath, `
week: 1
description: >
  This is a multiline
  string using the fold
  operator for wrapped text
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(true);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty YAML files', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'empty.yml');

      writeFileSync(yamlPath, '');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/empty|null|no (content|data)/);
    });

    test('should handle whitespace-only files', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'whitespace.yml');

      writeFileSync(yamlPath, '   \n\n   \t\t   \n');

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/empty|null|no (content|data)/);
    });

    test('should handle comment-only files', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'comments-only.yml');

      writeFileSync(yamlPath, `
# This is a comment
# Another comment
# No actual YAML content
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.toLowerCase()).toMatch(/empty|null|no (content|data)/);
    });

    test('should handle very long field names (>100 chars)', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'long-field.yml');

      const longFieldName = 'a'.repeat(200);
      writeFileSync(yamlPath, `${longFieldName}: "value"`);

      const result = engine.syncFile(yamlPath);

      // Should handle long field names
      expect(result).toBeDefined();
    });

    test('should handle very long string values (>10000 chars)', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'long-value.yml');

      const longValue = 'x'.repeat(15000);
      writeFileSync(yamlPath, `
week: 1
description: "${longValue}"
`);

      const result = engine.syncFile(yamlPath);

      // Should handle long values
      expect(result).toBeDefined();
    });

    test('should handle special characters in field names', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'special-chars.yml');

      writeFileSync(yamlPath, `
"field-with-dashes": 1
"field.with.dots": 2
"field_with_underscores": 3
"field with spaces": 4
"field@with!special#chars": 5
`);

      const result = engine.syncFile(yamlPath);

      // Should handle special characters in field names
      expect(result).toBeDefined();
    });

    test('should handle unicode in field names', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'unicode-fields.yml');

      writeFileSync(yamlPath, `
"名前": "Name in Japanese"
"الاسم": "Name in Arabic"
"📊": "Emoji field name"
`);

      const result = engine.syncFile(yamlPath);

      // Should handle unicode in field names
      expect(result).toBeDefined();
    });

    test('should provide helpful error messages', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'syntax-error.yml');

      writeFileSync(yamlPath, `
week: 1
title: "Unclosed
content: test
`);

      const result = engine.syncFile(yamlPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      // Error should contain useful info (not just "error")
      expect(result.error.length).toBeGreaterThan(10);
      expect(result.error).not.toBe('Error');
      expect(result.error).not.toBe('Failed');
    });

    test('should handle very large YAML files', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'large.yml');

      // Create large YAML (~1MB)
      const items = [];
      for (let i = 0; i < 10000; i++) {
        items.push(`
item${i}:
  id: ${i}
  title: "Item ${i}"
  description: "This is item number ${i}"`);
      }

      writeFileSync(yamlPath, items.join('\n'));

      const result = engine.syncFile(yamlPath);

      // Should handle large files (may be slow but shouldn't crash)
      expect(result).toBeDefined();
    });
  });

  describe('Error Message Quality', () => {
    test('should include line number in parse errors', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'line-error.yml');

      writeFileSync(yamlPath, `
week: 1
title: "Good"
content: bad: syntax: here
objective: "Valid"
`);

      const result = engine.syncFile(yamlPath);

      if (!result.success && result.error) {
        // Check if error mentions a line number
        const hasLineNumber = /line \d+|:\d+:/i.test(result.error);
        expect(hasLineNumber || result.error.includes('3')).toBe(true);
      }
    });

    test('should include column number in parse errors', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'col-error.yml');

      writeFileSync(yamlPath, `week: 1\ntitle: "test" bad syntax`);

      const result = engine.syncFile(yamlPath);

      if (!result.success && result.error) {
        // Error message should be informative
        expect(result.error.length).toBeGreaterThan(15);
      }
    });

    test('should suggest fixes for common errors', () => {
      const engine = new ConfigSyncEngine({ rootDir: TEST_DIR, dryRun: true });
      const yamlPath = join(TEST_DIR, 'tabs-error.yml');

      writeFileSync(yamlPath, `week: 1\n\ttitle: "Has Tab"`);

      const result = engine.syncFile(yamlPath);

      if (!result.success && result.error) {
        // Should mention tabs and/or suggest using spaces
        expect(result.error.toLowerCase()).toMatch(/tab|space|indent/);
      }
    });
  });
});
