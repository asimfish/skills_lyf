/**
 * Unit tests for Prompt Builder
 *
 * Tests the template rendering system for AI prompts with:
 * - Variable substitution
 * - Conditional blocks
 * - Array/object formatting
 * - Validation
 */

import {
  PromptBuilder,
  PromptBuildError,
  buildPrompt,
} from '../../../src/teaching/ai/prompt-builder.js';

describe('PromptBuilder', () => {
  // ============================================================================
  // Variable Substitution Tests
  // ============================================================================
  describe('substituteVariables()', () => {
    it('substitutes simple {{variable}}', () => {
      const result = PromptBuilder.build('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('handles nested paths {{obj.nested.path}}', () => {
      const result = PromptBuilder.build('Code: {{course.code}}', {
        course: { code: 'STAT 545' },
      });
      expect(result).toBe('Code: STAT 545');
    });

    it('handles deeply nested paths', () => {
      const result = PromptBuilder.build('Value: {{a.b.c.d}}', {
        a: { b: { c: { d: 'deep' } } },
      });
      expect(result).toBe('Value: deep');
    });

    it('throws PromptBuildError on missing required variable', () => {
      expect(() => {
        PromptBuilder.build('Hello {{name}}!', {});
      }).toThrow(PromptBuildError);

      // Verify error details
      try {
        PromptBuilder.build('Hello {{name}}!', {});
      } catch (error) {
        expect(error.name).toBe('PromptBuildError');
        expect(error.variable).toBe('name');
        expect(error.message).toContain('Missing required variable');
      }
    });

    it('throws error with line number for missing variable', () => {
      const template = 'Line 1\nLine 2\nHello {{missing}}!';
      try {
        PromptBuilder.build(template, {});
      } catch (error) {
        expect(error.line).toBe(3);
      }
    });

    it('preserves literal {{ when escaped with backslash', () => {
      const result = PromptBuilder.build('Show {{\\escaped}}', {});
      expect(result).toBe('Show {{escaped}}');
    });

    it('substitutes multiple variables', () => {
      const result = PromptBuilder.build('{{greeting}} {{name}}!', {
        greeting: 'Hello',
        name: 'World',
      });
      expect(result).toBe('Hello World!');
    });

    it('handles whitespace in variable names', () => {
      const result = PromptBuilder.build('Value: {{ spaced }}', {
        spaced: 'trimmed',
      });
      expect(result).toBe('Value: trimmed');
    });
  });

  // ============================================================================
  // Conditional Tests
  // ============================================================================
  describe('evaluateConditionals()', () => {
    it('evaluates {{#if truthy}} correctly', () => {
      const template = '{{#if active}}Active{{/if}}';
      expect(PromptBuilder.build(template, { active: true })).toBe('Active');
      expect(PromptBuilder.build(template, { active: 'yes' })).toBe('Active');
      expect(PromptBuilder.build(template, { active: 1 })).toBe('Active');
    });

    it('evaluates {{#if falsy}} correctly', () => {
      const template = '{{#if active}}Active{{/if}}';
      expect(PromptBuilder.build(template, { active: false })).toBe('');
      expect(PromptBuilder.build(template, { active: null })).toBe('');
      expect(PromptBuilder.build(template, { active: undefined })).toBe('');
    });

    it('handles {{#if var == "value"}} equality with double quotes', () => {
      const template = '{{#if level == "graduate"}}PhD{{else}}UG{{/if}}';
      expect(PromptBuilder.build(template, { level: 'graduate' })).toBe('PhD');
      expect(PromptBuilder.build(template, { level: 'undergraduate' })).toBe(
        'UG'
      );
    });

    it("handles {{#if var == 'value'}} equality with single quotes", () => {
      const template = "{{#if level == 'graduate'}}PhD{{else}}UG{{/if}}";
      expect(PromptBuilder.build(template, { level: 'graduate' })).toBe('PhD');
      expect(PromptBuilder.build(template, { level: 'undergraduate' })).toBe(
        'UG'
      );
    });

    it('handles {{#if var != "value"}} inequality', () => {
      const template = '{{#if mode != "debug"}}Production{{/if}}';
      expect(PromptBuilder.build(template, { mode: 'production' })).toBe(
        'Production'
      );
      expect(PromptBuilder.build(template, { mode: 'debug' })).toBe('');
    });

    it('processes {{else}} branch correctly', () => {
      const template = '{{#if premium}}Premium{{else}}Free{{/if}}';
      expect(PromptBuilder.build(template, { premium: true })).toBe('Premium');
      expect(PromptBuilder.build(template, { premium: false })).toBe('Free');
    });

    it('handles nested conditionals when outer is truthy', () => {
      const template = `{{#if outer}}Outer{{#if inner}}Inner{{/if}}{{/if}}`;
      expect(PromptBuilder.build(template, { outer: true, inner: true })).toBe(
        'OuterInner'
      );
      expect(PromptBuilder.build(template, { outer: true, inner: false })).toBe(
        'Outer'
      );
    });

    it('handles sequential (non-nested) conditionals', () => {
      // Sequential conditionals work correctly
      const template = `{{#if a}}A{{/if}}{{#if b}}B{{/if}}`;
      expect(PromptBuilder.build(template, { a: true, b: true })).toBe('AB');
      expect(PromptBuilder.build(template, { a: true, b: false })).toBe('A');
      expect(PromptBuilder.build(template, { a: false, b: true })).toBe('B');
      expect(PromptBuilder.build(template, { a: false, b: false })).toBe('');
    });

    it('treats empty string as falsy', () => {
      const template = '{{#if value}}Has Value{{else}}Empty{{/if}}';
      expect(PromptBuilder.build(template, { value: '' })).toBe('Empty');
    });

    it('treats empty array as falsy', () => {
      const template = '{{#if items}}Has Items{{else}}No Items{{/if}}';
      expect(PromptBuilder.build(template, { items: [] })).toBe('No Items');
      expect(PromptBuilder.build(template, { items: ['a'] })).toBe('Has Items');
    });

    it('treats zero as falsy', () => {
      const template = '{{#if count}}Has Count{{else}}Zero{{/if}}';
      expect(PromptBuilder.build(template, { count: 0 })).toBe('Zero');
      expect(PromptBuilder.build(template, { count: 1 })).toBe('Has Count');
    });

    it('treats non-empty object as truthy', () => {
      const template = '{{#if obj}}Has Object{{/if}}';
      expect(PromptBuilder.build(template, { obj: { key: 'value' } })).toBe(
        'Has Object'
      );
    });

    it('treats empty object as falsy', () => {
      const template = '{{#if obj}}Has Object{{else}}Empty Object{{/if}}';
      expect(PromptBuilder.build(template, { obj: {} })).toBe('Empty Object');
    });

    it('handles equality with boolean literals', () => {
      const template = '{{#if flag == true}}Yes{{else}}No{{/if}}';
      expect(PromptBuilder.build(template, { flag: true })).toBe('Yes');
      expect(PromptBuilder.build(template, { flag: false })).toBe('No');
    });

    it('handles equality with numeric literals', () => {
      const template = '{{#if count == 5}}Five{{else}}Not Five{{/if}}';
      expect(PromptBuilder.build(template, { count: 5 })).toBe('Five');
      expect(PromptBuilder.build(template, { count: 3 })).toBe('Not Five');
    });

    it('handles equality with null literal', () => {
      const template = '{{#if value == null}}Null{{else}}Not Null{{/if}}';
      expect(PromptBuilder.build(template, { value: null })).toBe('Null');
      expect(PromptBuilder.build(template, { value: 'something' })).toBe(
        'Not Null'
      );
    });
  });

  // ============================================================================
  // Array/Object Formatting Tests
  // ============================================================================
  describe('array and object formatting', () => {
    it('formats arrays as numbered lists', () => {
      const result = PromptBuilder.build('Topics:\n{{topics}}', {
        topics: ['Math', 'Science', 'History'],
      });
      expect(result).toBe('Topics:\n1. Math\n2. Science\n3. History');
    });

    it('formats objects as JSON', () => {
      const result = PromptBuilder.build('Config: {{config}}', {
        config: { level: 'advanced', duration: 60 },
      });
      const expected = `Config: ${JSON.stringify({ level: 'advanced', duration: 60 }, null, 2)}`;
      expect(result).toBe(expected);
    });

    it('handles null values as empty string', () => {
      const result = PromptBuilder.build('Value: {{value}}', { value: null });
      expect(result).toBe('Value: ');
    });

    it('handles empty arrays', () => {
      const result = PromptBuilder.build('Items: {{items}}', { items: [] });
      expect(result).toBe('Items: ');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('handles empty template', () => {
      expect(PromptBuilder.build('', {})).toBe('');
      expect(PromptBuilder.build(null, {})).toBe('');
      expect(PromptBuilder.build(undefined, {})).toBe('');
    });

    it('handles template with no variables', () => {
      const template = 'This is plain text without any variables.';
      expect(PromptBuilder.build(template, {})).toBe(template);
    });

    it('preserves whitespace in conditional blocks', () => {
      const template = '{{#if show}}  spaced  {{/if}}';
      expect(PromptBuilder.build(template, { show: true })).toBe('  spaced  ');
    });

    it('handles multiline conditional blocks', () => {
      const template = `{{#if detailed}}
Line 1
Line 2
Line 3
{{/if}}`;
      const result = PromptBuilder.build(template, { detailed: true });
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
    });

    it('handles mixed variables and conditionals', () => {
      const template = `Hello {{name}}!
{{#if premium}}You have premium access.{{/if}}
{{#if role == "admin"}}Admin panel available.{{/if}}`;

      const result = PromptBuilder.build(template, {
        name: 'Alice',
        premium: true,
        role: 'admin',
      });

      expect(result).toContain('Hello Alice!');
      expect(result).toContain('You have premium access.');
      expect(result).toContain('Admin panel available.');
    });

    it('throws on non-string template', () => {
      expect(() => PromptBuilder.build(123, {})).toThrow(PromptBuildError);
      expect(() => PromptBuilder.build(['template'], {})).toThrow(
        PromptBuildError
      );
      expect(() => PromptBuilder.build({}, {})).toThrow(PromptBuildError);
    });

    it('handles nested path with missing intermediate', () => {
      expect(() => {
        PromptBuilder.build('{{a.b.c}}', { a: null });
      }).toThrow(PromptBuildError);
    });

    it('handles variables immediately after conditionals', () => {
      const template = '{{#if show}}Shown{{/if}}{{name}}';
      const result = PromptBuilder.build(template, { show: true, name: 'Test' });
      expect(result).toBe('ShownTest');
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================
  describe('validate()', () => {
    it('detects unclosed conditionals', () => {
      const result = PromptBuilder.validate('Hello {{#if test}}content');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unclosed conditional');
    });

    it('detects extra closing tags', () => {
      const result = PromptBuilder.validate('Hello {{/if}}');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Extra closing tag');
    });

    it('detects misplaced else', () => {
      const result = PromptBuilder.validate('Hello {{else}} world');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('{{else}}');
    });

    it('extracts variable names correctly', () => {
      const result = PromptBuilder.validate(
        'Hello {{name}}, your {{item.type}} is ready.'
      );
      expect(result.valid).toBe(true);
      expect(result.variables).toContain('name');
      expect(result.variables).toContain('item.type');
    });

    it('extracts condition variables', () => {
      const result = PromptBuilder.validate(
        '{{#if level == "advanced"}}content{{/if}}'
      );
      expect(result.valid).toBe(true);
      expect(result.variables).toContain('level');
    });

    it('validates correct template structure', () => {
      const result = PromptBuilder.validate(
        '{{#if a}}{{#if b}}nested{{/if}}{{/if}}'
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('warns about deeply nested conditionals', () => {
      const template =
        '{{#if a}}{{#if b}}{{#if c}}{{#if d}}{{#if e}}{{#if f}}deep{{/if}}{{/if}}{{/if}}{{/if}}{{/if}}{{/if}}';
      const result = PromptBuilder.validate(template);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Deeply nested');
    });

    it('returns empty results for invalid input', () => {
      const result = PromptBuilder.validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template must be a non-empty string');
    });

    it('handles empty string template', () => {
      const result = PromptBuilder.validate('');
      expect(result.valid).toBe(false);
    });
  });

  // ============================================================================
  // resolvePath() Tests
  // ============================================================================
  describe('resolvePath()', () => {
    it('resolves simple property', () => {
      expect(PromptBuilder.resolvePath({ name: 'Alice' }, 'name')).toBe(
        'Alice'
      );
    });

    it('resolves nested property', () => {
      expect(
        PromptBuilder.resolvePath({ user: { name: 'Bob' } }, 'user.name')
      ).toBe('Bob');
    });

    it('returns undefined for missing path', () => {
      expect(PromptBuilder.resolvePath({ a: 1 }, 'b')).toBeUndefined();
    });

    it('returns undefined for invalid object', () => {
      expect(PromptBuilder.resolvePath(null, 'a')).toBeUndefined();
      expect(PromptBuilder.resolvePath('string', 'a')).toBeUndefined();
    });

    it('returns undefined for invalid path', () => {
      expect(PromptBuilder.resolvePath({ a: 1 }, null)).toBeUndefined();
      expect(PromptBuilder.resolvePath({ a: 1 }, '')).toBeUndefined();
    });

    it('handles path through null value', () => {
      expect(PromptBuilder.resolvePath({ a: null }, 'a.b')).toBeUndefined();
    });
  });

  // ============================================================================
  // evaluateCondition() Tests
  // ============================================================================
  describe('evaluateCondition()', () => {
    it('evaluates truthy variable', () => {
      expect(PromptBuilder.evaluateCondition('active', { active: true })).toBe(
        true
      );
    });

    it('evaluates falsy variable', () => {
      expect(PromptBuilder.evaluateCondition('active', { active: false })).toBe(
        false
      );
    });

    it('evaluates equality with string', () => {
      expect(
        PromptBuilder.evaluateCondition('level == "grad"', { level: 'grad' })
      ).toBe(true);
    });

    it('evaluates inequality', () => {
      expect(
        PromptBuilder.evaluateCondition('mode != "test"', { mode: 'prod' })
      ).toBe(true);
    });

    it('handles invalid condition', () => {
      expect(PromptBuilder.evaluateCondition(null, {})).toBe(false);
      expect(PromptBuilder.evaluateCondition('', {})).toBe(false);
    });

    it('handles nested path in condition', () => {
      expect(
        PromptBuilder.evaluateCondition('user.active', {
          user: { active: true },
        })
      ).toBe(true);
    });
  });

  // ============================================================================
  // isTruthy() Tests (via evaluateCondition)
  // ============================================================================
  describe('isTruthy logic', () => {
    const testTruthy = (value) =>
      PromptBuilder.evaluateCondition('val', { val: value });

    it('treats undefined as falsy', () => {
      expect(testTruthy(undefined)).toBe(false);
    });

    it('treats null as falsy', () => {
      expect(testTruthy(null)).toBe(false);
    });

    it('treats false as falsy', () => {
      expect(testTruthy(false)).toBe(false);
    });

    it('treats true as truthy', () => {
      expect(testTruthy(true)).toBe(true);
    });

    it('treats 0 as falsy', () => {
      expect(testTruthy(0)).toBe(false);
    });

    it('treats positive number as truthy', () => {
      expect(testTruthy(42)).toBe(true);
    });

    it('treats negative number as truthy', () => {
      expect(testTruthy(-1)).toBe(true);
    });

    it('treats empty string as falsy', () => {
      expect(testTruthy('')).toBe(false);
    });

    it('treats non-empty string as truthy', () => {
      expect(testTruthy('hello')).toBe(true);
    });

    it('treats empty array as falsy', () => {
      expect(testTruthy([])).toBe(false);
    });

    it('treats non-empty array as truthy', () => {
      expect(testTruthy([1, 2, 3])).toBe(true);
    });

    it('treats empty object as falsy', () => {
      expect(testTruthy({})).toBe(false);
    });

    it('treats non-empty object as truthy', () => {
      expect(testTruthy({ a: 1 })).toBe(true);
    });
  });

  // ============================================================================
  // Convenience Function Tests
  // ============================================================================
  describe('buildPrompt() convenience function', () => {
    it('works the same as PromptBuilder.build()', () => {
      const template = 'Hello {{name}}!';
      const variables = { name: 'World' };

      expect(buildPrompt(template, variables)).toBe(
        PromptBuilder.build(template, variables)
      );
    });

    it('throws PromptBuildError on missing variable', () => {
      expect(() => buildPrompt('{{missing}}', {})).toThrow(PromptBuildError);
    });
  });

  // ============================================================================
  // Real-World Template Tests
  // ============================================================================
  describe('real-world templates', () => {
    it('handles lecture prompt template pattern', () => {
      const template = `Generate lecture notes for {{course.code}}: {{course.name}}.

Level: {{course.level}}
{{#if has_lesson_plan}}
Use the following lesson plan:
{{lesson_plan.objectives}}
{{/if}}

{{#if course.level == "graduate"}}
Include rigorous mathematical proofs.
{{else}}
Focus on intuitive explanations with examples.
{{/if}}`;

      const result = PromptBuilder.build(template, {
        course: {
          code: 'STAT 545',
          name: 'ANOVA',
          level: 'graduate',
        },
        has_lesson_plan: true,
        lesson_plan: {
          objectives: ['Understand F-tests', 'Apply ANOVA'],
        },
      });

      expect(result).toContain('STAT 545');
      expect(result).toContain('ANOVA');
      expect(result).toContain('Use the following lesson plan');
      expect(result).toContain('Include rigorous mathematical proofs');
      expect(result).not.toContain('Focus on intuitive explanations');
    });

    it('handles conditional with undefined variable in context', () => {
      // When checking a variable in a conditional that doesn't exist,
      // it should evaluate as falsy
      const template = '{{#if nonexistent}}Yes{{else}}No{{/if}}';
      const result = PromptBuilder.build(template, {});
      expect(result).toBe('No');
    });

    it('handles multiple conditional branches', () => {
      const template = `{{#if type == "exam"}}Exam Content{{/if}}
{{#if type == "quiz"}}Quiz Content{{/if}}
{{#if type == "assignment"}}Assignment Content{{/if}}`;

      expect(PromptBuilder.build(template, { type: 'quiz' })).toContain(
        'Quiz Content'
      );
      expect(PromptBuilder.build(template, { type: 'quiz' })).not.toContain(
        'Exam Content'
      );
    });
  });
});
