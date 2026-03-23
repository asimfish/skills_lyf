/**
 * Validation Engine for Teaching Content
 *
 * Provides comprehensive validation using:
 * - JSON Schema validation (ajv)
 * - Conditional validation (ajv-keywords)
 * - LaTeX syntax checking
 * - Completeness checks (answer keys, etc.)
 */

import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import { validateLatex } from './latex.js';

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {Array<ValidationError>} errors - Schema validation errors
 * @property {Array<string>} warnings - Non-critical warnings
 * @property {Object} details - Additional validation details
 */

/**
 * Validation error structure
 * @typedef {Object} ValidationError
 * @property {string} field - Field path (e.g., 'questions[0].text')
 * @property {string} message - Error message
 * @property {string} type - Error type (schema, latex, completeness)
 */

/**
 * Validator Engine class
 */
export class ValidatorEngine {
  /**
   * Create a new validator engine
   * @param {Object} options - Validator options
   * @param {boolean} options.strictMode - Fail on warnings (default: false)
   * @param {boolean} options.validateLatex - Enable LaTeX validation (default: true)
   * @param {boolean} options.checkCompleteness - Check answer keys, etc. (default: true)
   */
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode || false,
      validateLatex: options.validateLatex !== false,
      checkCompleteness: options.checkCompleteness !== false,
    };

    // Initialize ajv with keywords support
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false, // Allow non-JSON-Schema keywords like 'source', 'auto'
    });

    // Add additional keywords (ajv v8 has 'if' built-in, add others if needed)
    // ajvKeywords adds transform, typeof, instanceof, etc.
    ajvKeywords(this.ajv);
  }

  /**
   * Validate content against a template schema
   * @param {Object} content - Content to validate
   * @param {Object} template - Template schema
   * @returns {ValidationResult} Validation result
   */
  validate(content, template) {
    const errors = [];
    const warnings = [];
    const details = {};

    // 1. JSON Schema validation
    const schemaErrors = this.validateSchema(content, template);
    errors.push(...schemaErrors);

    // 2. LaTeX syntax validation (if enabled)
    if (this.options.validateLatex) {
      const latexErrors = this.validateLatexContent(content);
      errors.push(...latexErrors);
      details.latex_checked = true;
    }

    // 3. Completeness checks (if enabled)
    if (this.options.checkCompleteness) {
      const completenessIssues = this.checkCompleteness(content, template);

      // Treat missing answer keys as errors, others as warnings
      completenessIssues.forEach((issue) => {
        if (issue.critical) {
          errors.push(issue);
        } else {
          warnings.push(issue.message);
        }
      });
      details.completeness_checked = true;
    }

    // In strict mode, warnings become errors
    if (this.options.strictMode && warnings.length > 0) {
      warnings.forEach((warning) => {
        errors.push({
          field: 'general',
          message: warning,
          type: 'warning',
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details,
    };
  }

  /**
   * Validate content against JSON Schema
   * @param {Object} content - Content to validate
   * @param {Object} template - Template schema
   * @returns {Array<ValidationError>} Schema validation errors
   */
  validateSchema(content, template) {
    const errors = [];

    // Compile schema
    let validate;
    try {
      validate = this.ajv.compile(template);
    } catch (error) {
      return [
        {
          field: 'schema',
          message: `Invalid template schema: ${error.message}`,
          type: 'schema',
        },
      ];
    }

    // Validate content
    const valid = validate(content);

    if (!valid && validate.errors) {
      validate.errors.forEach((err) => {
        const field = err.instancePath || err.dataPath || 'root';
        const message = this.formatSchemaError(err);

        errors.push({
          field: field.replace(/^\//, '').replace(/\//g, '.'),
          message,
          type: 'schema',
        });
      });
    }

    return errors;
  }

  /**
   * Format ajv error message
   * @param {Object} error - ajv error object
   * @returns {string} Formatted error message
   */
  formatSchemaError(error) {
    const { keyword, message, params } = error;

    switch (keyword) {
      case 'required':
        return `Missing required field: ${params.missingProperty}`;
      case 'type':
        return `Invalid type: expected ${params.type}, got ${typeof error.data}`;
      case 'enum':
        return `Invalid value. Must be one of: ${params.allowedValues.join(', ')}`;
      case 'minLength':
        return `Value too short (minimum ${params.limit} characters)`;
      case 'maxLength':
        return `Value too long (maximum ${params.limit} characters)`;
      case 'minimum':
        return `Value too small (minimum ${params.limit})`;
      case 'maximum':
        return `Value too large (maximum ${params.limit})`;
      default:
        return message || 'Validation error';
    }
  }

  /**
   * Validate LaTeX syntax in content
   * @param {Object} content - Content to validate
   * @returns {Array<ValidationError>} LaTeX validation errors
   */
  validateLatexContent(content) {
    const errors = [];

    // Extract all string values from content (recursive)
    const extractStrings = (obj, path = '') => {
      const strings = [];

      if (typeof obj === 'string') {
        strings.push({ path, text: obj });
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          strings.push(...extractStrings(item, `${path}[${index}]`));
        });
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          strings.push(...extractStrings(value, newPath));
        });
      }

      return strings;
    };

    const strings = extractStrings(content);

    // Validate each string for LaTeX syntax
    strings.forEach(({ path, text }) => {
      const latexErrors = validateLatex(text);

      latexErrors.forEach((err) => {
        errors.push({
          field: path,
          message: `LaTeX error: ${err.message}`,
          type: 'latex',
        });
      });
    });

    return errors;
  }

  /**
   * Check completeness of content (answer keys, etc.)
   * @param {Object} content - Content to validate
   * @param {Object} template - Template schema
   * @returns {Array<Object>} Completeness issues
   */
  checkCompleteness(content, _template) {
    const issues = [];

    // Check for answer key if questions exist
    if (content.questions && Array.isArray(content.questions)) {
      // Check if answer_key exists
      if (!content.answer_key) {
        issues.push({
          field: 'answer_key',
          message: 'Missing answer key for exam questions',
          type: 'completeness',
          critical: true,
        });
      } else {
        // Check if answer_key has entries for all questions
        const answerKeys = Object.keys(content.answer_key);

        content.questions.forEach((question, index) => {
          const questionId = question.id || `Q${index + 1}`;

          if (!answerKeys.includes(questionId)) {
            issues.push({
              field: `answer_key.${questionId}`,
              message: `Missing answer for question ${questionId}`,
              type: 'completeness',
              critical: true,
            });
          }
        });

        // Warn about extra answer keys
        answerKeys.forEach((key) => {
          const questionExists = content.questions.some(
            (q, idx) => (q.id || `Q${idx + 1}`) === key
          );

          if (!questionExists) {
            issues.push({
              field: `answer_key.${key}`,
              message: `Answer key exists for non-existent question ${key}`,
              type: 'completeness',
              critical: false,
            });
          }
        });
      }

      // Check multiple-choice questions have options
      content.questions.forEach((question, index) => {
        const questionId = question.id || `Q${index + 1}`;

        if (question.type === 'multiple-choice' && !question.options) {
          issues.push({
            field: `questions[${index}].options`,
            message: `Multiple-choice question ${questionId} missing options`,
            type: 'completeness',
            critical: true,
          });
        }

        if (
          question.type === 'multiple-choice' &&
          question.options &&
          question.options.length < 2
        ) {
          issues.push({
            field: `questions[${index}].options`,
            message: `Multiple-choice question ${questionId} has fewer than 2 options`,
            type: 'completeness',
            critical: false,
          });
        }

        // Check essay questions have rubric
        if (question.type === 'essay' && !question.rubric) {
          issues.push({
            field: `questions[${index}].rubric`,
            message: `Essay question ${questionId} missing grading rubric`,
            type: 'completeness',
            critical: false,
          });
        }
      });
    }

    return issues;
  }

  /**
   * Quick validate - only check schema (skip LaTeX and completeness)
   * @param {Object} content - Content to validate
   * @param {Object} template - Template schema
   * @returns {ValidationResult} Validation result
   */
  quickValidate(content, template) {
    const errors = this.validateSchema(content, template);

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      details: { quick_mode: true },
    };
  }
}

/**
 * Create a validator with default options
 * @param {Object} options - Validator options
 * @returns {ValidatorEngine} Validator instance
 */
export function createValidator(options = {}) {
  return new ValidatorEngine(options);
}

/**
 * Validate content with a template (convenience function)
 * @param {Object} content - Content to validate
 * @param {Object} template - Template schema
 * @param {Object} options - Validator options
 * @returns {ValidationResult} Validation result
 */
export function validate(content, template, options = {}) {
  const validator = new ValidatorEngine(options);
  return validator.validate(content, template);
}
