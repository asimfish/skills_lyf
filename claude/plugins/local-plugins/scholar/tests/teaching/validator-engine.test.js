/**
 * Unit tests for Validator Engine
 */

import {
  ValidatorEngine,
  createValidator,
  validate,
} from '../../src/teaching/validators/engine.js';
import { loadTemplate } from '../../src/teaching/templates/loader.js';

describe('Validator Engine', () => {
  describe('ValidatorEngine class', () => {
    it('should create validator with default options', () => {
      const validator = new ValidatorEngine();
      expect(validator).toBeDefined();
      expect(validator.options.strictMode).toBe(false);
      expect(validator.options.validateLatex).toBe(true);
      expect(validator.options.checkCompleteness).toBe(true);
    });

    it('should create validator with custom options', () => {
      const validator = new ValidatorEngine({
        strictMode: true,
        validateLatex: false,
        checkCompleteness: false,
      });

      expect(validator.options.strictMode).toBe(true);
      expect(validator.options.validateLatex).toBe(false);
      expect(validator.options.checkCompleteness).toBe(false);
    });

    it('should have ajv instance with keywords support', () => {
      const validator = new ValidatorEngine();
      expect(validator.ajv).toBeDefined();
    });
  });

  describe('validate', () => {
    const template = loadTemplate('exam');

    it('should validate correct content', () => {
      const content = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Test Exam',
          date: '2026-01-11',
        },
        generated_by: {
          tool: 'scholar',
          timestamp: '2026-01-11T12:00:00Z',
        },
      };

      const validator = new ValidatorEngine();
      const result = validator.validate(content, template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect schema violations', () => {
      const content = {
        // Missing required fields
        schema_version: '1.0',
      };

      const validator = new ValidatorEngine();
      const result = validator.validate(content, template);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should skip LaTeX validation when disabled', () => {
      const content = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Test with $unbalanced LaTeX',
          date: '2026-01-11',
        },
        generated_by: {
          tool: 'scholar',
          timestamp: '2026-01-11T12:00:00Z',
        },
      };

      const validator = new ValidatorEngine({ validateLatex: false });
      const result = validator.validate(content, template);

      expect(result.details.latex_checked).toBeUndefined();
    });

    it('should skip completeness checks when disabled', () => {
      const content = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Test Exam',
          date: '2026-01-11',
        },
        generated_by: {
          tool: 'scholar',
          timestamp: '2026-01-11T12:00:00Z',
        },
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question text',
            points: 5,
          },
        ],
        // Missing answer_key
      };

      const validator = new ValidatorEngine({ checkCompleteness: false });
      const result = validator.validate(content, template);

      expect(result.details.completeness_checked).toBeUndefined();
    });
  });

  describe('validateSchema', () => {
    it('should validate against JSON Schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
        required: ['name'],
      };

      const validator = new ValidatorEngine();

      const validContent = { name: 'Test', age: 25 };
      const errors = validator.validateSchema(validContent, schema);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      const validator = new ValidatorEngine();
      const invalidContent = {};
      const errors = validator.validateSchema(invalidContent, schema);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Missing required field');
    });

    it('should detect type mismatches', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      };

      const validator = new ValidatorEngine();
      const invalidContent = { age: 'not a number' };
      const errors = validator.validateSchema(invalidContent, schema);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Invalid type');
    });

    it('should detect enum violations', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      };

      const validator = new ValidatorEngine();
      const invalidContent = { status: 'unknown' };
      const errors = validator.validateSchema(invalidContent, schema);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Invalid value');
    });
  });

  describe('validateLatexContent', () => {
    it('should detect unbalanced inline math', () => {
      const content = {
        title: 'Test with $unbalanced math',
        text: 'Some text here',
      };

      const validator = new ValidatorEngine();
      const errors = validator.validateLatexContent(content);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('LaTeX error');
    });

    it('should detect unbalanced braces', () => {
      const content = {
        text: 'Formula: $x^{2$',
      };

      const validator = new ValidatorEngine();
      const errors = validator.validateLatexContent(content);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate correct LaTeX', () => {
      const content = {
        text: 'Formula: $x^{2} + y^{2} = z^{2}$',
      };

      const validator = new ValidatorEngine();
      const errors = validator.validateLatexContent(content);

      expect(errors).toHaveLength(0);
    });

    it('should recursively check nested objects', () => {
      const content = {
        questions: [
          {
            text: 'Question with $bad math',
          },
          {
            text: 'Good question',
          },
        ],
      };

      const validator = new ValidatorEngine();
      const errors = validator.validateLatexContent(content);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('checkCompleteness', () => {
    const template = loadTemplate('exam');

    it('should detect missing answer key', () => {
      const content = {
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question',
            points: 5,
          },
        ],
        // answer_key missing
      };

      const validator = new ValidatorEngine();
      const issues = validator.checkCompleteness(content, template);

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].message).toContain('Missing answer key');
      expect(issues[0].critical).toBe(true);
    });

    it('should detect missing answers for specific questions', () => {
      const content = {
        questions: [
          { id: 'Q1', type: 'multiple-choice', text: 'Q1', points: 5 },
          { id: 'Q2', type: 'short-answer', text: 'Q2', points: 10 },
        ],
        answer_key: {
          Q1: 'a',
          // Q2 missing
        },
      };

      const validator = new ValidatorEngine();
      const issues = validator.checkCompleteness(content, template);

      expect(issues.some((issue) => issue.field.includes('Q2'))).toBe(true);
    });

    it('should detect multiple-choice without options', () => {
      const content = {
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question',
            points: 5,
            // options missing
          },
        ],
        answer_key: { Q1: 'a' },
      };

      const validator = new ValidatorEngine();
      const issues = validator.checkCompleteness(content, template);

      expect(
        issues.some((issue) => issue.message.includes('missing options'))
      ).toBe(true);
    });

    it('should warn about essay without rubric', () => {
      const content = {
        questions: [
          {
            id: 'Q1',
            type: 'essay',
            text: 'Essay question',
            points: 25,
            // rubric missing
          },
        ],
        answer_key: { Q1: 'See rubric' },
      };

      const validator = new ValidatorEngine();
      const issues = validator.checkCompleteness(content, template);

      expect(
        issues.some((issue) => issue.message.includes('missing grading rubric'))
      ).toBe(true);
      expect(issues.some((issue) => !issue.critical)).toBe(true);
    });

    it('should warn about insufficient MC options', () => {
      const content = {
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question',
            points: 5,
            options: ['Only one option'],
          },
        ],
        answer_key: { Q1: 'a' },
      };

      const validator = new ValidatorEngine();
      const issues = validator.checkCompleteness(content, template);

      expect(
        issues.some((issue) => issue.message.includes('fewer than 2 options'))
      ).toBe(true);
    });

    it('should pass with complete content', () => {
      const content = {
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question',
            points: 5,
            options: ['Option A', 'Option B', 'Option C'],
          },
        ],
        answer_key: { Q1: 'a' },
      };

      const validator = new ValidatorEngine();
      const issues = validator.checkCompleteness(content, template);

      expect(issues.filter((i) => i.critical)).toHaveLength(0);
    });
  });

  describe('quickValidate', () => {
    const template = loadTemplate('exam');

    it('should only check schema', () => {
      const content = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Test with $bad LaTeX',
          date: '2026-01-11',
        },
        generated_by: {
          tool: 'scholar',
          timestamp: '2026-01-11T12:00:00Z',
        },
        questions: [
          {
            id: 'Q1',
            type: 'multiple-choice',
            text: 'Question',
            points: 5,
          },
        ],
        // Missing answer_key
      };

      const validator = new ValidatorEngine();
      const result = validator.quickValidate(content, template);

      expect(result.details.quick_mode).toBe(true);
      expect(result.warnings).toHaveLength(0);
      // Should not detect LaTeX or completeness issues
    });
  });

  describe('convenience functions', () => {
    it('should create validator with createValidator', () => {
      const validator = createValidator({ strictMode: true });
      expect(validator).toBeInstanceOf(ValidatorEngine);
      expect(validator.options.strictMode).toBe(true);
    });

    it('should validate with convenience function', () => {
      const template = loadTemplate('exam');
      const content = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Test',
          date: '2026-01-11',
        },
        generated_by: {
          tool: 'scholar',
          timestamp: '2026-01-11T12:00:00Z',
        },
      };

      const result = validate(content, template);
      expect(result.isValid).toBe(true);
    });
  });

  describe('strict mode', () => {
    const template = loadTemplate('exam');

    it('should treat warnings as errors in strict mode', () => {
      const content = {
        schema_version: '1.0',
        template_type: 'exam',
        metadata: {
          title: 'Test',
          date: '2026-01-11',
        },
        generated_by: {
          tool: 'scholar',
          timestamp: '2026-01-11T12:00:00Z',
        },
        questions: [
          {
            id: 'Q1',
            type: 'essay',
            text: 'Essay question',
            points: 25,
            // Missing rubric (warning)
          },
        ],
        answer_key: { Q1: 'See rubric' },
      };

      const validator = new ValidatorEngine({ strictMode: true });
      const result = validator.validate(content, template);

      // In strict mode, warnings become errors
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'warning')).toBe(true);
    });
  });
});
