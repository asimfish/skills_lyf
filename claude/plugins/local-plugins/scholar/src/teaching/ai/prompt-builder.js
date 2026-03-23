/**
 * Prompt Builder for Teaching Content Generation
 *
 * Provides template rendering for AI prompts with:
 * - Variable substitution ({{variable}}, {{obj.nested.path}})
 * - Conditional blocks ({{#if}}, {{else}}, {{/if}})
 * - Equality/inequality checks (==, !=)
 *
 * Template syntax follows Handlebars conventions but with limited features
 * for simplicity and maintainability.
 *
 * @module prompt-builder
 */

/**
 * Error thrown when prompt building fails
 */
export class PromptBuildError extends Error {
  /**
   * Create a PromptBuildError
   * @param {string} message - Error message
   * @param {Object} details - Error details
   * @param {string} [details.variable] - Variable name that caused the error
   * @param {string} [details.template] - Template name or path
   * @param {number} [details.line] - Line number where error occurred
   */
  constructor(message, { variable, template, line } = {}) {
    super(message);
    this.name = 'PromptBuildError';
    this.variable = variable;
    this.template = template;
    this.line = line;
  }
}

/**
 * Prompt Builder class for rendering templates with variables
 */
export class PromptBuilder {
  /**
   * Build final prompt from template + variables
   *
   * @param {string} template - Prompt template with {{variables}} and {{#if}} blocks
   * @param {Object} variables - Merged variable object
   * @returns {string} Rendered prompt
   * @throws {PromptBuildError} On missing required variable or syntax error
   *
   * @example
   * const rendered = PromptBuilder.build(
   *   'Hello {{name}}! {{#if formal}}Pleased to meet you.{{/if}}',
   *   { name: 'Dr. Smith', formal: true }
   * );
   * // => 'Hello Dr. Smith! Pleased to meet you.'
   */
  static build(template, variables = {}) {
    // Handle edge cases
    if (!template) {
      return '';
    }

    if (typeof template !== 'string') {
      throw new PromptBuildError('Template must be a string', {});
    }

    // Check if template has any variables/conditionals
    if (!template.includes('{{')) {
      return template;
    }

    // Process in order: conditionals first (they may contain variables), then variables
    let result = this.evaluateConditionals(template, variables);
    result = this.substituteVariables(result, variables);

    return result;
  }

  /**
   * Substitute {{variable}} and {{obj.nested.path}} references
   *
   * @param {string} template - Template with variable placeholders
   * @param {Object} variables - Variable values
   * @returns {string} Template with variables substituted
   * @throws {PromptBuildError} On missing required variable
   *
   * @example
   * PromptBuilder.substituteVariables(
   *   'Course: {{course.code}} - {{course.name}}',
   *   { course: { code: 'STAT 545', name: 'ANOVA' } }
   * );
   * // => 'Course: STAT 545 - ANOVA'
   */
  static substituteVariables(template, variables) {
    // Regex matches {{variable}} but not {{#if}}, {{else}}, {{/if}}
    // Negative lookahead excludes control structures
    const variablePattern = /\{\{(?!#|\/|else\b)([^}]+)\}\}/g;

    // Track line numbers for error messages
    let currentLine = 1;
    let lastIndex = 0;

    return template.replace(variablePattern, (match, path, offset) => {
      // Calculate line number from offset
      const textBeforeMatch = template.substring(lastIndex, offset);
      currentLine += (textBeforeMatch.match(/\n/g) || []).length;
      lastIndex = offset;

      // Clean up the path (trim whitespace)
      const cleanPath = path.trim();

      // Handle escaped braces (\\{{ -> {{)
      if (cleanPath.startsWith('\\')) {
        return '{{' + cleanPath.substring(1) + '}}';
      }

      // Resolve the value
      const value = this.resolvePath(variables, cleanPath);

      // Check for missing required variable
      if (value === undefined) {
        throw new PromptBuildError(
          `Missing required variable: {{${cleanPath}}}`,
          {
            variable: cleanPath,
            line: currentLine
          }
        );
      }

      // Convert value to string
      if (value === null) {
        return '';
      }

      if (Array.isArray(value)) {
        // Format arrays as bullet list
        return value.map((item, i) => `${i + 1}. ${item}`).join('\n');
      }

      if (typeof value === 'object') {
        // Stringify objects
        return JSON.stringify(value, null, 2);
      }

      return String(value);
    });
  }

  /**
   * Evaluate {{#if condition}}...{{/if}} blocks
   *
   * Supports:
   * - Truthy/falsy: {{#if has_lesson_plan}}
   * - Equality: {{#if course_level == "graduate"}}
   * - Inequality: {{#if pedagogical_approach != "lecture-based"}}
   * - Else clause: {{#if condition}}...{{else}}...{{/if}}
   *
   * @param {string} template - Template with conditional blocks
   * @param {Object} variables - Variable values for condition evaluation
   * @returns {string} Template with conditionals evaluated
   *
   * @example
   * PromptBuilder.evaluateConditionals(
   *   '{{#if level == "graduate"}}Rigorous proofs{{else}}Intuitive explanations{{/if}}',
   *   { level: 'graduate' }
   * );
   * // => 'Rigorous proofs'
   */
  static evaluateConditionals(template, variables) {
    // Process nested conditionals by iterating until no more matches
    // This handles innermost conditionals first
    let result = template;
    let previousResult;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    // Regex for conditional blocks (non-greedy, handles else)
    // Uses [\s\S] instead of . to match newlines
    const conditionalPattern = /\{\{#if\s+(.+?)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

    do {
      previousResult = result;
      result = result.replace(conditionalPattern, (match, condition, ifBlock, elseBlock = '') => {
        const conditionResult = this.evaluateCondition(condition.trim(), variables);
        return conditionResult ? ifBlock : elseBlock;
      });
      iterations++;
    } while (result !== previousResult && iterations < maxIterations);

    if (iterations >= maxIterations) {
      throw new PromptBuildError(
        'Maximum conditional nesting depth exceeded (possible infinite loop)',
        {}
      );
    }

    return result;
  }

  /**
   * Resolve nested path like "obj.nested.path"
   *
   * @param {Object} obj - Object to traverse
   * @param {string} path - Dot-notation path (e.g., "course.info.level")
   * @returns {*} Value at path or undefined if not found
   *
   * @example
   * PromptBuilder.resolvePath(
   *   { a: { b: { c: 1 } } },
   *   'a.b.c'
   * );
   * // => 1
   *
   * @example
   * PromptBuilder.resolvePath({ a: 1 }, 'a.b.c');
   * // => undefined
   */
  static resolvePath(obj, path) {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    if (!path || typeof path !== 'string') {
      return undefined;
    }

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current !== 'object') {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }

  /**
   * Evaluate a condition expression
   *
   * Supports:
   * - Variable name only (truthy check): "has_lesson_plan"
   * - Equality: "level == 'graduate'" or 'level == "graduate"'
   * - Inequality: "approach != 'lecture-based'"
   *
   * @param {string} condition - Condition expression
   * @param {Object} variables - Variable values
   * @returns {boolean} Result of condition evaluation
   *
   * @example
   * PromptBuilder.evaluateCondition('has_data', { has_data: true });
   * // => true
   *
   * @example
   * PromptBuilder.evaluateCondition('level == "graduate"', { level: 'graduate' });
   * // => true
   *
   * @example
   * PromptBuilder.evaluateCondition('mode != "debug"', { mode: 'production' });
   * // => true
   */
  static evaluateCondition(condition, variables) {
    if (!condition || typeof condition !== 'string') {
      return false;
    }

    // Check for equality operator (==)
    const equalityMatch = condition.match(/^(.+?)\s*==\s*(.+)$/);
    if (equalityMatch) {
      const [, varPath, compareValue] = equalityMatch;
      const actualValue = this.resolvePath(variables, varPath.trim());
      const expectedValue = this.parseCompareValue(compareValue.trim());
      return actualValue === expectedValue;
    }

    // Check for inequality operator (!=)
    const inequalityMatch = condition.match(/^(.+?)\s*!=\s*(.+)$/);
    if (inequalityMatch) {
      const [, varPath, compareValue] = inequalityMatch;
      const actualValue = this.resolvePath(variables, varPath.trim());
      const expectedValue = this.parseCompareValue(compareValue.trim());
      return actualValue !== expectedValue;
    }

    // Simple truthy check (variable name only)
    const value = this.resolvePath(variables, condition);
    return this.isTruthy(value);
  }

  /**
   * Parse a comparison value from condition expression
   *
   * Handles:
   * - Quoted strings: "value" or 'value'
   * - Numbers: 123, 45.67
   * - Booleans: true, false
   * - null
   *
   * @param {string} value - Raw value from condition
   * @returns {*} Parsed value
   * @private
   */
  static parseCompareValue(value) {
    // Quoted string (double quotes)
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    // Quoted string (single quotes)
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }

    // Boolean
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }

    // Null
    if (value === 'null') {
      return null;
    }

    // Number
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }

    // Treat as variable reference
    return value;
  }

  /**
   * Check if a value is truthy for conditional evaluation
   *
   * Unlike JavaScript's native truthy, this treats:
   * - Empty arrays as falsy
   * - Empty strings as falsy
   * - 0 as falsy
   *
   * @param {*} value - Value to check
   * @returns {boolean} True if value is truthy
   * @private
   */
  static isTruthy(value) {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      return value.length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  /**
   * Validate a template for syntax errors without building
   *
   * @param {string} template - Template to validate
   * @returns {Object} Validation result
   * @returns {boolean} .valid - Whether template is valid
   * @returns {string[]} .errors - List of syntax errors
   * @returns {string[]} .warnings - List of potential issues
   * @returns {string[]} .variables - List of variable names found
   *
   * @example
   * const result = PromptBuilder.validate('Hello {{name}}! {{#if test}}');
   * // => { valid: false, errors: ['Unclosed conditional block'], ... }
   */
  static validate(template) {
    const errors = [];
    const warnings = [];
    const variables = new Set();

    if (!template || typeof template !== 'string') {
      return { valid: false, errors: ['Template must be a non-empty string'], warnings, variables: [] };
    }

    // Check for unclosed conditionals
    const ifCount = (template.match(/\{\{#if\s/g) || []).length;
    const endifCount = (template.match(/\{\{\/if\}\}/g) || []).length;

    if (ifCount > endifCount) {
      errors.push(`Unclosed conditional block: found ${ifCount} {{#if}} but only ${endifCount} {{/if}}`);
    } else if (endifCount > ifCount) {
      errors.push(`Extra closing tag: found ${endifCount} {{/if}} but only ${ifCount} {{#if}}`);
    }

    // Check for mismatched else without if
    const elseMatches = template.match(/\{\{else\}\}/g) || [];
    if (elseMatches.length > ifCount) {
      errors.push('{{else}} found outside of conditional block');
    }

    // Extract variable names
    const variablePattern = /\{\{(?!#|\/|else\b)([^}]+)\}\}/g;
    let match;
    while ((match = variablePattern.exec(template)) !== null) {
      const varName = match[1].trim();
      if (!varName.startsWith('\\')) {
        variables.add(varName);
      }
    }

    // Extract condition variables
    const conditionPattern = /\{\{#if\s+([^}]+)\}\}/g;
    while ((match = conditionPattern.exec(template)) !== null) {
      const condition = match[1].trim();
      // Extract variable from condition (handle == and !=)
      const condVar = condition.split(/\s*(==|!=)\s*/)[0].trim();
      variables.add(condVar);
    }

    // Warn about deeply nested conditionals
    let maxDepth = 0;
    let depth = 0;
    const tokens = template.split(/(\{\{#if\s|\{\{\/if\}\})/);
    for (const token of tokens) {
      if (token === '{{#if ') {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      } else if (token === '{{/if}}') {
        depth--;
      }
    }
    if (maxDepth > 5) {
      warnings.push(`Deeply nested conditionals (depth: ${maxDepth}) may be hard to maintain`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      variables: Array.from(variables)
    };
  }

  /**
   * Get line number for a position in text
   *
   * @param {string} text - Full text
   * @param {number} position - Character position
   * @returns {number} Line number (1-indexed)
   * @private
   */
  static getLineNumber(text, position) {
    const textBefore = text.substring(0, position);
    return (textBefore.match(/\n/g) || []).length + 1;
  }
}

// Export convenience function
/**
 * Build a prompt from template and variables
 *
 * @param {string} template - Template string
 * @param {Object} variables - Variable values
 * @returns {string} Rendered prompt
 * @throws {PromptBuildError} On error
 */
export function buildPrompt(template, variables) {
  return PromptBuilder.build(template, variables);
}

export default PromptBuilder;
