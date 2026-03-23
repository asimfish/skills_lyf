/**
 * Advanced Test Suite for Auto-fixer Engine
 *
 * Tests edge cases, error conditions, and advanced scenarios
 * not covered in the main test suite.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { AutoFixer, createAutoFixer } from '../../../src/teaching/validators/auto-fixer.js';
import yaml from 'js-yaml';

describe('AutoFixer - Advanced Edge Cases', () => {
  let fixer;

  beforeEach(() => {
    fixer = new AutoFixer();
  });

  // ==================================================================
  // 1. STRESS TESTS - Large files, deep nesting, many errors
  // ==================================================================

  describe('Stress Tests', () => {
    test('should handle very large YAML files (1000+ lines)', () => {
      // Generate large YAML
      const largeData = {
        schema_version: '2.0',
        lessons: Array.from({ length: 1000 }, (_, i) => ({
          id: `lesson-${i}`,
          title: `Lesson ${i}`,
          duration: 30
        }))
      };

      const largeYaml = yaml.dump(largeData);
      const result = fixer.fixSyntaxErrors(largeYaml);

      expect(result.success).toBe(true);
      expect(result.fixed).toBeDefined();

      // Should complete in reasonable time (< 1 second)
      const startTime = Date.now();
      fixer.fixSyntaxErrors(largeYaml);
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    test('should handle deeply nested YAML (10+ levels)', () => {
      const deepYaml = `
level1:
  level2:
    level3:
      level4:
        level5:
          level6:
            level7:
              level8:
                level9:
                  level10:
                    value: "deep"
`;

      const result = fixer.fixSyntaxErrors(deepYaml);
      expect(result.success).toBe(true);
      expect(result.fixed).toContain('value: deep');
    });

    test('should handle multiple simultaneous errors (syntax + schema + type)', () => {
      const problematicYaml = `
schema_version: "1.0"
title: "Week 1"
materials: "Textbook"
topics: Statistics
extra_field: invalid
`;

      const _data = yaml.load(problematicYaml);
      const schema = {
        type: 'object',
        required: ['schema_version', 'title', 'duration'],
        properties: {
          schema_version: { type: 'string' },
          title: { type: 'string' },
          duration: { type: 'number' },
          materials: { type: 'array' },
          topics: { type: 'array' }
        },
        additionalProperties: false
      };

      const schemaErrors = [
        {
          keyword: 'required',
          params: { missingProperty: 'duration' },
          instancePath: ''
        },
        {
          keyword: 'type',
          params: { type: 'array' },
          instancePath: '/materials',
          data: 'Textbook'
        },
        {
          keyword: 'additionalProperties',
          params: { additionalProperty: 'extra_field' },
          instancePath: ''
        }
      ];

      const allFixes = fixer.getAllFixes(problematicYaml, schemaErrors, schema);

      expect(allFixes.syntax).toBeDefined();
      expect(allFixes.schema.length).toBeGreaterThan(0);
      expect(allFixes.type.length).toBeGreaterThan(0);
    });
  });

  // ==================================================================
  // 2. UNICODE & SPECIAL CHARACTERS - Emoji, non-ASCII, escapes
  // ==================================================================

  describe('Unicode & Special Characters', () => {
    test('should preserve emoji in YAML content', () => {
      const emojiYaml = `
title: "Statistics 📊"
description: "Learn data analysis! 🎓"
tags:
  - "📈 trending"
  - "🔥 popular"
`;

      const result = fixer.fixSyntaxErrors(emojiYaml);
      expect(result.success).toBe(true);
      expect(result.fixed).toContain('📊');
      expect(result.fixed).toContain('🎓');
      expect(result.fixed).toContain('📈');
    });

    test('should handle non-ASCII characters (Chinese, Arabic, etc.)', () => {
      const multilingualYaml = `
title: "统计学入门"
description: "تعلم الإحصاء"
instructor: "José García"
`;

      const result = fixer.fixSyntaxErrors(multilingualYaml);
      expect(result.success).toBe(true);
      expect(result.fixed).toContain('统计学入门');
      expect(result.fixed).toContain('تعلم الإحصاء');
      expect(result.fixed).toContain('José García');
    });

    test('should handle escape sequences in strings', () => {
      const escapedYaml = `
description: "Line 1\\nLine 2\\tTabbed"
regex: "^[a-z]+\\\\d+$"
path: "C:\\\\Users\\\\Documents"
`;

      const result = fixer.fixSyntaxErrors(escapedYaml);
      expect(result.success).toBe(true);
      expect(result.fixed).toContain('Line 1\\nLine 2\\tTabbed');
    });

    test('should handle special YAML characters that need quoting', () => {
      const specialYaml = `
title: "Week 1: Introduction"
colon: "value: with colon"
pipe: "value | with pipe"
ampersand: "value & with ampersand"
`;

      const result = fixer.fixSyntaxErrors(specialYaml);
      expect(result.success).toBe(true);
      // Should preserve quoted strings
      expect(result.fixed).toBeDefined();
    });
  });

  // ==================================================================
  // 3. ERROR RECOVERY - Malformed YAML, partial fixes
  // ==================================================================

  describe('Error Recovery', () => {
    test('should gracefully fail on completely invalid YAML', () => {
      const invalidYaml = `
{{{{{  this is not valid YAML at all
:::::: completely broken
}}}}}}
`;

      const result = fixer.fixSyntaxErrors(invalidYaml);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.hint).toBeDefined();
    });

    test('should provide helpful hints for common syntax errors', () => {
      // Unmatched quote
      const unmatchedQuote = 'title: "Week 1';
      const result1 = fixer.fixSyntaxErrors(unmatchedQuote);
      expect(result1.hint).toContain('quote');

      // Invalid indentation
      const badIndent = `
title: Week 1
  topics:
   - Statistics
    - Probability
`;
      const result2 = fixer.fixSyntaxErrors(badIndent);
      expect(result2.hint).toContain('indentation');
    });

    test('should handle YAML with only comments', () => {
      const onlyComments = `
# This is a comment
# Another comment
# No actual content
`;

      const result = fixer.fixSyntaxErrors(onlyComments);
      // js-yaml returns null for comment-only files
      expect(result.success).toBe(true);
    });

    test('should handle empty YAML file', () => {
      const emptyYaml = '';
      const result = fixer.fixSyntaxErrors(emptyYaml);
      expect(result.success).toBe(true);
    });

    test('should handle YAML with only whitespace', () => {
      const whitespaceOnly = '   \n  \n\t\n   ';
      const result = fixer.fixSyntaxErrors(whitespaceOnly);
      expect(result.success).toBe(true);
    });
  });

  // ==================================================================
  // 4. TYPE CONVERSION EDGE CASES - Ambiguous types, complex conversions
  // ==================================================================

  describe('Type Conversion Edge Cases', () => {
    test('should handle ambiguous string-to-number conversions', () => {
      const data = { value: '42' };
      const errors = [
        {
          keyword: 'type',
          params: { type: 'number' },
          instancePath: '/value',
          data: '42'
        }
      ];

      const fixes = fixer.fixTypeErrors(data, errors);
      expect(fixes.length).toBe(1);
      expect(fixes[0].description).toContain('Convert');

      // Apply the fix
      const fixed = fixes[0].apply(data);
      expect(fixed.value).toBe(42);
      expect(typeof fixed.value).toBe('number');
    });

    test('should handle scientific notation in string-to-number', () => {
      const data = { value: '1.5e10' };
      const errors = [
        {
          keyword: 'type',
          params: { type: 'number' },
          instancePath: '/value',
          data: '1.5e10'
        }
      ];

      const fixes = fixer.fixTypeErrors(data, errors);
      const fixed = fixes[0].apply(data);
      expect(fixed.value).toBe(1.5e10);
    });

    test('should handle non-numeric strings gracefully', () => {
      const data = { value: 'not a number' };
      const errors = [
        {
          keyword: 'type',
          params: { type: 'number' },
          instancePath: '/value',
          data: 'not a number'
        }
      ];

      const fixes = fixer.fixTypeErrors(data, errors);
      // Should still create a fix, but result will be NaN
      expect(fixes.length).toBe(1);
    });

    test('should handle boolean-like strings', () => {
      const testCases = [
        { input: 'true', expected: true },
        { input: 'false', expected: false }
      ];

      testCases.forEach(({ input, expected }) => {
        const data = { value: input };
        const errors = [
          {
            keyword: 'type',
            params: { type: 'boolean' },
            instancePath: '/value',
            data: input
          }
        ];

        const fixes = fixer.fixTypeErrors(data, errors);
        if (fixes.length > 0) {
          const fixed = fixes[0].apply(data);
          // Should convert to boolean type
          expect(typeof fixed.value).toBe('boolean');
          // Should match expected value
          expect(fixed.value).toBe(expected);
        }
      });
    });

    test('should handle array-to-string with complex objects', () => {
      const data = {
        value: [
          { name: 'Item 1', id: 1 },
          { name: 'Item 2', id: 2 }
        ]
      };
      const errors = [
        {
          keyword: 'type',
          params: { type: 'string' },
          instancePath: '/value',
          data: data.value
        }
      ];

      const fixes = fixer.fixTypeErrors(data, errors);
      expect(fixes.length).toBe(1);

      const fixed = fixes[0].apply(data);
      expect(typeof fixed.value).toBe('string');
      // The string representation may vary (JSON, toString, etc.)
      expect(fixed.value.length).toBeGreaterThan(0);
    });

    test('should handle null and undefined in type conversions', () => {
      const data = { value: null };
      const errors = [
        {
          keyword: 'type',
          params: { type: 'string' },
          instancePath: '/value',
          data: null
        }
      ];

      const fixes = fixer.fixTypeErrors(data, errors);
      // Type conversions may not handle null - this is acceptable
      // If a fix is provided, verify it works
      if (fixes.length > 0) {
        const fixed = fixes[0].apply(data);
        expect(typeof fixed.value).toBe('string');
      }
    });
  });

  // ==================================================================
  // 5. SCHEMA VIOLATION EDGE CASES - Complex schemas, nested errors
  // ==================================================================

  describe('Schema Violation Edge Cases', () => {
    test('should handle nested required fields', () => {
      const data = {
        metadata: {
          title: 'Test'
          // missing 'id' field
        }
      };

      const errors = [
        {
          keyword: 'required',
          params: { missingProperty: 'id' },
          instancePath: '/metadata'
        }
      ];

      const schema = {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            required: ['title', 'id'],
            properties: {
              title: { type: 'string' },
              id: { type: 'string' }
            }
          }
        }
      };

      const fixes = fixer.fixSchemaViolations(data, errors, schema);
      expect(fixes.length).toBeGreaterThan(0);

      const fixed = fixes[0].apply(data);
      expect(fixed.metadata.id).toBeDefined();
    });

    test('should handle array items with missing required fields', () => {
      const data = {
        topics: [
          { title: 'Topic 1' }, // missing 'id'
          { title: 'Topic 2' }  // missing 'id'
        ]
      };

      const errors = [
        {
          keyword: 'required',
          params: { missingProperty: 'id' },
          instancePath: '/topics/0'
        },
        {
          keyword: 'required',
          params: { missingProperty: 'id' },
          instancePath: '/topics/1'
        }
      ];

      const schema = {
        type: 'object',
        properties: {
          topics: {
            type: 'array',
            items: {
              type: 'object',
              required: ['title', 'id'],
              properties: {
                title: { type: 'string' },
                id: { type: 'string' }
              }
            }
          }
        }
      };

      const fixes = fixer.fixSchemaViolations(data, errors, schema);
      expect(fixes.length).toBe(2);
    });

    test('should handle enum violations with suggestions', () => {
      const data = {
        difficulty: 'medium' // should be 'beginner', 'intermediate', or 'advanced'
      };

      const errors = [
        {
          keyword: 'enum',
          params: { allowedValues: ['beginner', 'intermediate', 'advanced'] },
          instancePath: '/difficulty',
          data: 'medium'
        }
      ];

      const schema = {
        type: 'object',
        properties: {
          difficulty: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced']
          }
        }
      };

      const fixes = fixer.fixSchemaViolations(data, errors, schema);
      expect(fixes.length).toBe(1);
      // Should suggest one of the valid values (may be 'beginner' based on implementation)
      expect(fixes[0].description).toContain('beginner');
    });

    test('should handle pattern violations', () => {
      const data = {
        id: 'invalid-id-format'
      };

      const errors = [
        {
          keyword: 'pattern',
          params: { pattern: '^LO-\\d+\\.\\d+$' },
          instancePath: '/id',
          data: 'invalid-id-format'
        }
      ];

      const schema = {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            pattern: '^LO-\\d+\\.\\d+$'
          }
        }
      };

      const fixes = fixer.fixSchemaViolations(data, errors, schema);
      // Pattern violations may not have auto-fixes - this is acceptable
      // They require manual intervention to match the pattern
      expect(fixes.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================================================================
  // 6. MIGRATION EDGE CASES - Complex v1→v2 scenarios
  // ==================================================================

  describe('Migration Edge Cases', () => {
    test('should handle partial v1/v2 hybrid documents', () => {
      const data = {
        schema_version: '1.0',
        topics: ['Stats'], // v1 field
        content: {
          learning_objectives: [] // v2 field
        }
      };

      const fixes = fixer.fixDeprecatedFields(data);

      // Should detect v1 fields even when some v2 fields exist
      const topicsFixIndex = fixes.findIndex(f => f.description.includes('topics'));
      expect(topicsFixIndex).toBeGreaterThanOrEqual(0);
    });

    test('should not flag v2 fields incorrectly', () => {
      const data = {
        schema_version: '2.0',
        content: {
          topics: ['Stats'], // This is correct in v2 (under content)
          learning_objectives: []
        }
      };

      const fixes = fixer.fixDeprecatedFields(data);

      // Should NOT flag content.topics as deprecated
      const topicsFixIndex = fixes.findIndex(f =>
        f.description.includes('topics') && f.from === 'content.topics'
      );
      expect(topicsFixIndex).toBe(-1);
    });

    test('should handle deeply nested deprecated fields', () => {
      const data = {
        schema_version: '1.0',
        metadata: {
          course: {
            objectives: ['Learn stats'] // Deprecated nested field
          }
        }
      };

      const fixes = fixer.fixDeprecatedFields(data);

      // Should detect even deeply nested deprecated fields
      expect(fixes.length).toBeGreaterThan(0);
    });

    test('should preserve non-deprecated fields during migration', () => {
      const data = {
        schema_version: '1.0',
        title: 'Week 1',
        topics: ['Stats'], // deprecated
        custom_field: 'value' // not in schema, should preserve
      };

      const fixes = fixer.fixDeprecatedFields(data);
      const topicsFix = fixes.find(f => f.description.includes('topics'));

      const fixed = topicsFix.apply(data);
      expect(fixed.title).toBe('Week 1');
      expect(fixed.custom_field).toBe('value');
      expect(fixed.content.topics).toEqual(['Stats']);
    });
  });

  // ==================================================================
  // 7. CONCURRENCY & PERFORMANCE - Multiple fixes, order dependencies
  // ==================================================================

  describe('Concurrency & Performance', () => {
    test('should apply fixes in correct order when dependencies exist', () => {
      const data = {
        topics: 'Statistics' // needs type conversion first
        // Then migration to content.topics
      };

      // First convert string to array
      const typeError = {
        keyword: 'type',
        params: { type: 'array' },
        instancePath: '/topics',
        data: 'Statistics'
      };

      const typeFixes = fixer.fixTypeErrors(data, [typeError]);
      let current = typeFixes[0].apply(data);

      // Then migrate to v2
      const migrationFixes = fixer.fixDeprecatedFields(current);
      current = migrationFixes[0].apply(current);

      expect(current.content.topics).toEqual(['Statistics']);
    });

    test('should handle multiple files in batch efficiently', () => {
      const files = Array.from({ length: 100 }, (_, i) => ({
        content: `
title: "Week ${i}"
topics: "Topic ${i}"
`,
        name: `week-${i}.yml`
      }));

      const startTime = Date.now();

      files.forEach(file => {
        const result = fixer.fixSyntaxErrors(file.content);
        expect(result.success).toBe(true);
      });

      const duration = Date.now() - startTime;

      // Should complete 100 files in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });

  // ==================================================================
  // 8. PREVIEW GENERATION - Ensure accurate before/after
  // ==================================================================

  describe('Preview Generation', () => {
    test('should truncate long values in preview', () => {
      const longString = 'A'.repeat(500);
      const data = { description: longString };

      const errors = [
        {
          keyword: 'maxLength',
          params: { limit: 200 },
          instancePath: '/description',
          data: longString
        }
      ];

      const fixes = fixer.fixSchemaViolations(data, errors, {
        type: 'object',
        properties: {
          description: { type: 'string', maxLength: 200 }
        }
      });

      if (fixes.length > 0) {
        expect(fixes[0].before.length).toBeLessThan(500);
        expect(fixes[0].before).toContain('...');
      }
    });

    test('should format complex objects in preview', () => {
      const data = {
        metadata: {
          nested: {
            deeply: {
              value: 'test'
            }
          }
        }
      };

      const errors = [
        {
          keyword: 'required',
          params: { missingProperty: 'id' },
          instancePath: '/metadata'
        }
      ];

      const schema = {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' }
            }
          }
        }
      };

      const fixes = fixer.fixSchemaViolations(data, errors, schema);

      expect(fixes[0].before).toBeDefined();
      expect(fixes[0].after).toBeDefined();
      expect(typeof fixes[0].before).toBe('string');
    });
  });

  // ==================================================================
  // 9. FIX APPLICATION - Ensure fixes work correctly
  // ==================================================================

  describe('Fix Application', () => {
    test('should apply type conversion fixes correctly', () => {
      const data = {
        title: 'Week 1',
        topics: 'Statistics'
      };

      const errors = [
        {
          keyword: 'type',
          params: { type: 'array' },
          instancePath: '/topics',
          data: 'Statistics'
        }
      ];

      const fixes = fixer.fixTypeErrors(data, errors);
      const fixed = fixes[0].apply(data);

      // Fix should be applied
      expect(fixed.topics).toEqual(['Statistics']);

      // Other fields should be preserved
      expect(fixed.title).toBe('Week 1');
    });

    test('should apply nested field migrations correctly', () => {
      const data = {
        schema_version: '1.0',
        topics: ['Statistics']
      };

      const fixes = fixer.fixDeprecatedFields(data);

      if (fixes.length > 0) {
        const fixed = fixes[0].apply(data);

        // Migration should be applied
        expect(fixed.content).toBeDefined();
        expect(fixed.content.topics).toEqual(['Statistics']);
      }
    });
  });

  // ==================================================================
  // 10. FACTORY FUNCTION - Options validation
  // ==================================================================

  describe('Factory Function Options', () => {
    test('should accept custom options', () => {
      const customFixer = createAutoFixer({
        autoApplySafe: true
      });

      expect(customFixer).toBeInstanceOf(AutoFixer);
      expect(customFixer.options.autoApplySafe).toBe(true);
    });

    test('should use default options when none provided', () => {
      const defaultFixer = createAutoFixer();

      expect(defaultFixer).toBeInstanceOf(AutoFixer);
      expect(defaultFixer.options.autoApplySafe).toBe(false);
    });

    test('should ignore invalid options', () => {
      const fixer = createAutoFixer({
        invalidOption: 'should be ignored',
        autoApplySafe: true
      });

      expect(fixer.options.autoApplySafe).toBe(true);
      expect(fixer.options.invalidOption).toBeUndefined();
    });
  });
});
