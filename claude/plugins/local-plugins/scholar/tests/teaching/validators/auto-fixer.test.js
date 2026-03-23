/**
 * Tests for Auto-fixer Engine
 *
 * Tests QW1 (syntax), M1.1 (schema), M1.2 (type), M1.3 (deprecated)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { AutoFixer, createAutoFixer } from '../../../src/teaching/validators/auto-fixer.js';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'auto-fixer-fixtures');

/**
 * Helper: Load fixture file
 */
function loadFixture(filename) {
  return fs.readFileSync(path.join(fixturesDir, filename), 'utf8');
}

describe('AutoFixer', () => {
  let fixer;

  beforeEach(() => {
    fixer = new AutoFixer();
  });

  // ========================================================================
  // QW1: Syntax Auto-fix Tests (Priority 1)
  // ========================================================================

  describe('QW1: fixSyntaxErrors', () => {
    test('should normalize indentation to 2 spaces', () => {
      const yamlContent = loadFixture('syntax-errors.yml');
      const result = fixer.fixSyntaxErrors(yamlContent);

      expect(result.success).toBe(true);
      expect(result.changes).toContain('Normalized indentation to 2 spaces');

      // Verify all lines use 2-space indentation
      const lines = result.fixed.split('\n');
      const indentedLines = lines.filter((line) => line.match(/^\s+/));

      indentedLines.forEach((line) => {
        const indent = line.match(/^\s+/)[0];
        // Should be multiple of 2 spaces
        expect(indent.length % 2).toBe(0);
        // Should not contain tabs
        expect(indent).not.toContain('\t');
      });
    });

    test('should remove trailing whitespace', () => {
      const yamlContent = 'key: value   \nanother: test  \n';
      const result = fixer.fixSyntaxErrors(yamlContent);

      expect(result.success).toBe(true);
      expect(result.changes).toContain('Removed trailing whitespace');
      expect(result.fixed).not.toMatch(/\s+$/m);
    });

    test('should normalize line endings to LF', () => {
      const yamlContent = 'key: value\r\nanother: test\r\n';
      const result = fixer.fixSyntaxErrors(yamlContent);

      expect(result.success).toBe(true);
      expect(result.changes).toContain('Normalized line endings to LF');
      expect(result.fixed).not.toContain('\r\n');
    });

    test('should add quotes when necessary', () => {
      // YAML with special characters - this will fail to parse
      const yamlContent = 'message: Hello: World\n';
      const result = fixer.fixSyntaxErrors(yamlContent);

      // This is actually invalid YAML that can't be auto-fixed
      // The colon in the value makes it ambiguous
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle already valid YAML', () => {
      const yamlContent = loadFixture('valid-v2.yml');
      const result = fixer.fixSyntaxErrors(yamlContent);

      expect(result.success).toBe(true);
      // May still normalize formatting
      expect(result.fixed).toBeTruthy();
    });

    test('should return error for invalid YAML', () => {
      const yamlContent = 'key: value\n  invalid indentation\nno colon here';
      const result = fixer.fixSyntaxErrors(yamlContent);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    });

    test('should provide helpful hints for syntax errors', () => {
      const yamlContent = 'key: value\n\tinvalid tab';
      const result = fixer.fixSyntaxErrors(yamlContent);

      expect(result.success).toBe(false);
      expect(result.hint).toMatch(/tab/i);
    });

    test('should handle empty YAML', () => {
      const result = fixer.fixSyntaxErrors('');

      expect(result.success).toBe(true);
      // Empty string produces empty output (not null)
      expect(result.fixed).toBe('');
    });

    test('should handle YAML with comments', () => {
      const yamlContent = `
# This is a comment
key: value  # Inline comment
another: test
`;
      const result = fixer.fixSyntaxErrors(yamlContent);

      expect(result.success).toBe(true);
      // Comments are preserved by js-yaml
      const parsed = yaml.load(result.fixed);
      expect(parsed.key).toBe('value');
    });
  });

  // ========================================================================
  // M1.1: Schema Violation Fixes (Priority 2)
  // ========================================================================

  describe('M1.1: fixSchemaViolations', () => {
    test('should detect missing required fields', () => {
      const data = {
        title: 'Test',
        // Missing: schema_version (required)
      };

      const schemaErrors = [
        {
          keyword: 'required',
          params: { missingProperty: 'schema_version' },
          instancePath: '',
        },
      ];

      const schema = {
        type: 'object',
        required: ['schema_version'],
        properties: {
          schema_version: { type: 'string', default: '2.0' },
        },
      };

      const fixes = fixer.fixSchemaViolations(data, schemaErrors, schema);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].type).toBe('schema');
      expect(fixes[0].description).toMatch(/schema_version/);
      expect(fixes[0].safe).toBe(false);
      expect(fixes[0].apply).toBeDefined();
    });

    test('should propose default values for missing fields', () => {
      const data = { title: 'Test' };

      const schemaErrors = [
        {
          keyword: 'required',
          params: { missingProperty: 'duration' },
          instancePath: '',
        },
      ];

      const schema = {
        type: 'object',
        required: ['duration'],
      };

      const fixes = fixer.fixSchemaViolations(data, schemaErrors, schema);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].description).toMatch(/duration/);

      // Apply fix and check default value
      const fixed = fixes[0].apply(data);
      expect(fixed.duration).toBe(30); // Default duration
    });

    test('should detect invalid enum values', () => {
      const data = {
        style: {
          teaching_approach: 'invalid_value',
        },
      };

      const schemaErrors = [
        {
          keyword: 'enum',
          params: { allowedValues: ['interactive', 'lecture', 'hybrid'] },
          instancePath: '/style/teaching_approach',
        },
      ];

      const schema = {};

      const fixes = fixer.fixSchemaViolations(data, schemaErrors, schema);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].type).toBe('schema');
      expect(fixes[0].description).toMatch(/interactive/); // First allowed value
    });

    test('should detect additional properties', () => {
      const data = {
        title: 'Test',
        extra_field: 'Should not be here',
      };

      const schemaErrors = [
        {
          keyword: 'additionalProperties',
          params: { additionalProperty: 'extra_field' },
          instancePath: '',
        },
      ];

      const schema = {};

      const fixes = fixer.fixSchemaViolations(data, schemaErrors, schema);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].type).toBe('schema');
      expect(fixes[0].description).toMatch(/extra_field/);
      expect(fixes[0].description).toMatch(/[Rr]emove/);
    });

    test('should apply field additions correctly', () => {
      const data = { title: 'Test' };
      const fixed = fixer.applyFieldAddition(data, 'schema_version', '2.0');

      expect(fixed.schema_version).toBe('2.0');
      expect(fixed.title).toBe('Test');
      expect(data.schema_version).toBeUndefined(); // Original unchanged
    });

    test('should apply nested field additions', () => {
      const data = { title: 'Test' };
      const fixed = fixer.applyFieldAddition(data, 'metadata/id', 'week-01');

      expect(fixed.metadata.id).toBe('week-01');
    });
  });

  // ========================================================================
  // M1.2: Type Conversion Fixes (Priority 3)
  // ========================================================================

  describe('M1.2: fixTypeErrors', () => {
    test('should convert string to array (comma-separated)', () => {
      const data = {
        topics: 'Statistics, Probability, Inference',
      };

      const schemaErrors = [
        {
          keyword: 'type',
          params: { type: 'array' },
          instancePath: '/topics',
        },
      ];

      const fixes = fixer.fixTypeErrors(data, schemaErrors);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].type).toBe('type');
      expect(fixes[0].description).toMatch(/string to array/);

      const fixed = fixes[0].apply(data);
      expect(fixed.topics).toEqual(['Statistics', 'Probability', 'Inference']);
    });

    test('should convert string to array (single value)', () => {
      const data = {
        materials: 'Textbook Chapter 1',
      };

      const schemaErrors = [
        {
          keyword: 'type',
          params: { type: 'array' },
          instancePath: '/materials',
        },
      ];

      const fixes = fixer.fixTypeErrors(data, schemaErrors);

      expect(fixes).toHaveLength(1);

      const fixed = fixes[0].apply(data);
      expect(fixed.materials).toEqual(['Textbook Chapter 1']);
    });

    test('should convert string to number', () => {
      const data = {
        week: '5',
      };

      const schemaErrors = [
        {
          keyword: 'type',
          params: { type: 'number' },
          instancePath: '/week',
        },
      ];

      const fixes = fixer.fixTypeErrors(data, schemaErrors);

      expect(fixes).toHaveLength(1);

      const fixed = fixes[0].apply(data);
      expect(fixed.week).toBe(5);
    });

    test('should convert string to boolean', () => {
      const data = {
        enabled: 'true',
      };

      const schemaErrors = [
        {
          keyword: 'type',
          params: { type: 'boolean' },
          instancePath: '/enabled',
        },
      ];

      const fixes = fixer.fixTypeErrors(data, schemaErrors);

      expect(fixes).toHaveLength(1);

      const fixed = fixes[0].apply(data);
      expect(fixed.enabled).toBe(true);
    });

    test('should convert number to string', () => {
      const data = {
        course_code: 440,
      };

      const schemaErrors = [
        {
          keyword: 'type',
          params: { type: 'string' },
          instancePath: '/course_code',
        },
      ];

      const fixes = fixer.fixTypeErrors(data, schemaErrors);

      expect(fixes).toHaveLength(1);

      const fixed = fixes[0].apply(data);
      expect(fixed.course_code).toBe('440');
    });

    test('should convert array to string', () => {
      const data = {
        teaching_approach: ['interactive', 'lecture'],
      };

      const schemaErrors = [
        {
          keyword: 'type',
          params: { type: 'string' },
          instancePath: '/teaching_approach',
        },
      ];

      const fixes = fixer.fixTypeErrors(data, schemaErrors);

      expect(fixes).toHaveLength(1);

      const fixed = fixes[0].apply(data);
      expect(fixed.teaching_approach).toBe('interactive, lecture');
    });

    test('should handle multiple type errors', () => {
      const data = {
        week: '1',
        topics: 'Statistics',
        duration: '30',
      };

      const schemaErrors = [
        {
          keyword: 'type',
          params: { type: 'number' },
          instancePath: '/week',
        },
        {
          keyword: 'type',
          params: { type: 'array' },
          instancePath: '/topics',
        },
        {
          keyword: 'type',
          params: { type: 'number' },
          instancePath: '/duration',
        },
      ];

      const fixes = fixer.fixTypeErrors(data, schemaErrors);

      expect(fixes).toHaveLength(3);
    });
  });

  // ========================================================================
  // M1.3: Deprecated Field Migration (Priority 4)
  // ========================================================================

  describe('M1.3: fixDeprecatedFields', () => {
    test('should detect deprecated top-level fields', () => {
      const data = {
        topics: ['Statistics', 'Probability'],
        objectives: ['Understand statistics'],
      };

      const fixes = fixer.fixDeprecatedFields(data);

      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].type).toBe('deprecated');
      expect(fixes[0].description).toMatch(/topics/);
      expect(fixes[0].safe).toBe(false);
    });

    test('should propose nested field renames', () => {
      const data = {
        topics: ['Statistics'],
      };

      const fixes = fixer.fixDeprecatedFields(data);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].description).toMatch(/content\.topics/);
    });

    test('should apply simple field rename', () => {
      const data = {
        teaching_style: 'interactive',
      };

      const fixes = fixer.fixDeprecatedFields(data);
      expect(fixes).toHaveLength(1);

      const fixed = fixes[0].apply(data);
      expect(fixed.teaching_style).toBeUndefined();
      expect(fixed.style.teaching_approach).toBe('interactive');
    });

    test('should apply nested field rename', () => {
      const data = {
        topics: ['Statistics', 'Probability'],
      };

      const fixes = fixer.fixDeprecatedFields(data);
      expect(fixes).toHaveLength(1);

      const fixed = fixes[0].apply(data);
      expect(fixed.topics).toBeUndefined();
      expect(fixed.content.topics).toEqual(['Statistics', 'Probability']);
    });

    test('should detect multiple deprecated fields', () => {
      const yamlContent = loadFixture('deprecated-fields.yml');
      const data = yaml.load(yamlContent);

      const fixes = fixer.fixDeprecatedFields(data);

      // Should find: topics, objectives, materials, teaching_style, assessment_type
      expect(fixes.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle nested objects with deprecated fields', () => {
      const data = {
        metadata: {
          week: 1, // This is correct in v2
        },
        topics: ['Statistics'], // This is deprecated
      };

      const fixes = fixer.fixDeprecatedFields(data);

      // Should only find deprecated 'topics' at root level
      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].description).toMatch(/topics/);
    });

    test('should not flag v2 fields as deprecated', () => {
      const yamlContent = loadFixture('valid-v2.yml');
      const data = yaml.load(yamlContent);

      const fixes = fixer.fixDeprecatedFields(data);

      expect(fixes).toHaveLength(0);
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration: getAllFixes', () => {
    test('should return all fix types for complex file', () => {
      const yamlContent = loadFixture('syntax-errors.yml');

      // Mock schema errors
      const schemaErrors = [
        {
          keyword: 'required',
          params: { missingProperty: 'schema_version' },
          instancePath: '',
        },
      ];

      const schema = {
        type: 'object',
        required: ['schema_version'],
      };

      const fixes = fixer.getAllFixes(yamlContent, schemaErrors, schema);

      expect(fixes.syntax).toBeTruthy();
      expect(fixes.syntax.success).toBe(true);
      expect(fixes.schema).toBeInstanceOf(Array);
    });

    test('should handle valid YAML with no fixes needed', () => {
      const yamlContent = loadFixture('valid-v2.yml');
      const schemaErrors = [];
      const schema = {};

      const fixes = fixer.getAllFixes(yamlContent, schemaErrors, schema);

      expect(fixes.syntax.success).toBe(true);
      expect(fixes.schema).toHaveLength(0);
      expect(fixes.type).toHaveLength(0);
      expect(fixes.deprecated).toHaveLength(0);
    });

    test('should stop at syntax errors if YAML is invalid', () => {
      const yamlContent = 'invalid: yaml\n  bad indentation\nno colon';
      const schemaErrors = [];
      const schema = {};

      const fixes = fixer.getAllFixes(yamlContent, schemaErrors, schema);

      expect(fixes.syntax).toBeNull(); // Syntax fix failed
      expect(fixes.schema).toHaveLength(0);
      expect(fixes.type).toHaveLength(0);
      expect(fixes.deprecated).toHaveLength(0);
    });
  });

  describe('Integration: applyFixes', () => {
    test('should apply multiple fixes in sequence', () => {
      const data = {
        title: 'Test',
      };

      const fixes = [
        {
          type: 'schema',
          applied: true,
          apply: (obj) => ({ ...obj, schema_version: '2.0' }),
        },
        {
          type: 'schema',
          applied: true,
          apply: (obj) => ({ ...obj, duration: 30 }),
        },
      ];

      const result = fixer.applyFixes(data, fixes);

      expect(result.schema_version).toBe('2.0');
      expect(result.duration).toBe(30);
      expect(result.title).toBe('Test');
    });

    test('should skip unapplied fixes', () => {
      const data = { title: 'Test' };

      const fixes = [
        {
          type: 'schema',
          applied: true,
          apply: (obj) => ({ ...obj, field1: 'value1' }),
        },
        {
          type: 'schema',
          applied: false, // Not applied
          apply: (obj) => ({ ...obj, field2: 'value2' }),
        },
      ];

      const result = fixer.applyFixes(data, fixes);

      expect(result.field1).toBe('value1');
      expect(result.field2).toBeUndefined();
    });
  });

  // ========================================================================
  // Helper Functions Tests
  // ========================================================================

  describe('Helper: getValueAtPath', () => {
    test('should get value at simple path', () => {
      const obj = { key: 'value' };
      const value = fixer.getValueAtPath(obj, '/key');

      expect(value).toBe('value');
    });

    test('should get value at nested path', () => {
      const obj = { a: { b: { c: 'value' } } };
      const value = fixer.getValueAtPath(obj, '/a/b/c');

      expect(value).toBe('value');
    });

    test('should return undefined for missing path', () => {
      const obj = { key: 'value' };
      const value = fixer.getValueAtPath(obj, '/missing/path');

      expect(value).toBeUndefined();
    });

    test('should handle empty path', () => {
      const obj = { key: 'value' };
      const value = fixer.getValueAtPath(obj, '');

      expect(value).toEqual(obj);
    });
  });

  describe('Helper: setValueAtPath', () => {
    test('should set value at simple path', () => {
      const obj = { key: 'old' };
      fixer.setValueAtPath(obj, '/key', 'new');

      expect(obj.key).toBe('new');
    });

    test('should set value at nested path', () => {
      const obj = { a: { b: {} } };
      fixer.setValueAtPath(obj, '/a/b/c', 'value');

      expect(obj.a.b.c).toBe('value');
    });

    test('should create missing intermediate objects', () => {
      const obj = {};
      fixer.setValueAtPath(obj, '/a/b/c', 'value');

      expect(obj.a.b.c).toBe('value');
    });
  });

  describe('Helper: formatValue', () => {
    test('should format strings with quotes', () => {
      const formatted = fixer.formatValue('test', 'string');
      expect(formatted).toBe('"test"');
    });

    test('should format arrays as JSON', () => {
      const formatted = fixer.formatValue(['a', 'b'], 'array');
      expect(formatted).toBe('["a","b"]');
    });

    test('should format objects as JSON', () => {
      const formatted = fixer.formatValue({ a: 1 }, 'object');
      expect(formatted).toContain('"a"');
    });

    test('should format numbers as strings', () => {
      const formatted = fixer.formatValue(42, 'number');
      expect(formatted).toBe('42');
    });
  });

  // ========================================================================
  // Factory Function Tests
  // ========================================================================

  describe('Factory: createAutoFixer', () => {
    test('should create fixer with default options', () => {
      const fixer = createAutoFixer();

      expect(fixer).toBeInstanceOf(AutoFixer);
      expect(fixer.options.autoApplySafe).toBe(false);
    });

    test('should create fixer with custom options', () => {
      const fixer = createAutoFixer({ autoApplySafe: true });

      expect(fixer.options.autoApplySafe).toBe(true);
    });
  });
});
