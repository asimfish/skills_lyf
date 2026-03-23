/**
 * Auto-fixer Engine for YAML Configuration Files
 *
 * Provides automatic fixes for common errors:
 * - QW1: Syntax errors (safe, auto-apply)
 * - M1.1: Schema violations (requires confirmation)
 * - M1.2: Type conversions (requires confirmation)
 * - M1.3: Deprecated field migrations (requires confirmation)
 */

import yaml from 'js-yaml';
import Ajv from 'ajv';
import { migrationRules } from './migration-rules.js';

/**
 * Fix result structure
 * @typedef {Object} Fix
 * @property {'syntax'|'schema'|'type'|'deprecated'} type - Fix type
 * @property {string} description - Human-readable description
 * @property {boolean} safe - True if can auto-apply without confirmation
 * @property {string} before - Preview of original content
 * @property {string} after - Preview of fixed content
 * @property {boolean} applied - Whether fix has been applied
 * @property {Function} [apply] - Function to apply the fix
 */

/**
 * Auto-fixer Engine class
 */
export class AutoFixer {
  /**
   * Create a new auto-fixer
   * @param {Object} options - Fixer options
   * @param {boolean} options.autoApplySafe - Auto-apply safe fixes (default: false)
   */
  constructor(options = {}) {
    this.options = {
      autoApplySafe: options.autoApplySafe || false,
    };

    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
  }

  /**
   * QW1: Fix YAML syntax errors (safe, auto-apply)
   *
   * Fixes:
   * - Inconsistent indentation → normalize to 2 spaces
   * - Missing quotes → add where needed
   * - Trailing whitespace → remove
   * - Inconsistent line endings → normalize to \n
   *
   * @param {string} yamlContent - Original YAML content
   * @returns {Object} Result with fixed content or error
   */
  fixSyntaxErrors(yamlContent) {
    const changes = [];

    try {
      // Parse YAML (this validates syntax)
      const parsed = yaml.load(yamlContent);

      // Re-serialize with consistent formatting
      const fixed = yaml.dump(parsed, {
        indent: 2,
        lineWidth: 80,
        noRefs: true, // Don't use YAML anchors/aliases
        sortKeys: false, // Preserve key order
        quotingType: '"', // Use double quotes
        forceQuotes: false, // Only quote when necessary
      });

      // Remove trailing whitespace from each line
      const lines = fixed.split('\n');
      const cleanedLines = lines.map((line) => line.trimEnd());
      let cleaned = cleanedLines.join('\n');

      // Ensure no trailing newline with whitespace
      cleaned = cleaned.trimEnd();

      // Track what changed
      if (yamlContent !== cleaned) {
        // Check specific changes
        const originalLines = yamlContent.split('\n');
        const fixedLines = cleaned.split('\n');

        // Detect indentation changes
        const indentPattern = /^(\s+)/;
        let indentChanged = false;

        originalLines.forEach((origLine, i) => {
          const fixedLine = fixedLines[i];
          if (!fixedLine) return;

          const origIndent = origLine.match(indentPattern);
          const fixedIndent = fixedLine.match(indentPattern);

          if (origIndent && fixedIndent) {
            if (origIndent[1] !== fixedIndent[1]) {
              indentChanged = true;
            }
          }
        });

        if (indentChanged) {
          changes.push('Normalized indentation to 2 spaces');
        }

        // Detect trailing whitespace removal
        if (originalLines.some((line) => line !== line.trimEnd())) {
          changes.push('Removed trailing whitespace');
        }

        // Detect quote additions
        const originalQuoteCount = (yamlContent.match(/["']/g) || []).length;
        const fixedQuoteCount = (cleaned.match(/["']/g) || []).length;

        if (fixedQuoteCount > originalQuoteCount) {
          changes.push('Added missing quotes');
        }

        // Detect line ending normalization
        if (yamlContent.includes('\r\n')) {
          changes.push('Normalized line endings to LF');
        }
      }

      return {
        success: true,
        fixed: cleaned,
        changes: changes.length > 0 ? changes : ['No syntax changes needed'],
        original: yamlContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        hint: this.getSyntaxErrorHint(error),
      };
    }
  }

  /**
   * Get helpful hint for YAML syntax errors
   * @private
   */
  getSyntaxErrorHint(error) {
    const message = error.message.toLowerCase();

    if (message.includes('tab')) {
      return 'Replace tabs with spaces';
    }
    if (message.includes('indent')) {
      return 'Check indentation - use 2 spaces consistently';
    }
    if (message.includes('unexpected')) {
      return 'Check for missing quotes around special characters';
    }
    if (message.includes('duplicated mapping key')) {
      return 'Remove duplicate keys in YAML object';
    }

    return 'Check YAML syntax at the reported line';
  }

  /**
   * M1.1: Fix schema violations (requires confirmation)
   *
   * Detects:
   * - Missing required fields → propose defaults
   * - Invalid enum values → propose valid values
   * - Missing array items → propose empty array
   *
   * @param {Object} data - Parsed YAML data
   * @param {Array} schemaErrors - Validation errors from ajv
   * @param {Object} schema - JSON schema
   * @returns {Array<Fix>} Array of proposed fixes
   */
  fixSchemaViolations(data, schemaErrors, schema) {
    const fixes = [];

    for (const error of schemaErrors) {
      // Missing required field
      if (error.keyword === 'required') {
        const field = error.params.missingProperty;
        const path = error.instancePath || '';
        const fullPath = path ? `${path}/${field}` : field;

        const defaultValue = this.getDefaultForField(field, schema, path);

        const before = this.getValuePreview(data, path);
        const after = this.getValuePreview(
          this.applyFieldAddition(data, fullPath, defaultValue),
          path
        );

        fixes.push({
          type: 'schema',
          description: `Add required field '${field}' with default value`,
          safe: false, // Requires confirmation
          before,
          after,
          applied: false,
          apply: (obj) => this.applyFieldAddition(obj, fullPath, defaultValue),
        });
      }

      // Invalid enum value
      if (error.keyword === 'enum') {
        const path = error.instancePath;
        const allowedValues = error.params.allowedValues;
        const currentValue = this.getValueAtPath(data, path);

        // Propose the first allowed value as default
        const suggestedValue = allowedValues[0];

        fixes.push({
          type: 'schema',
          description: `Change '${currentValue}' to valid value '${suggestedValue}'`,
          safe: false,
          before: `${path}: ${JSON.stringify(currentValue)}`,
          after: `${path}: ${JSON.stringify(suggestedValue)}`,
          applied: false,
          apply: (obj) => this.setValueAtPath(obj, path, suggestedValue),
        });
      }

      // Additional properties not allowed
      if (error.keyword === 'additionalProperties') {
        const additionalProp = error.params.additionalProperty;
        const path = error.instancePath;
        const fullPath = path ? `${path}/${additionalProp}` : additionalProp;

        fixes.push({
          type: 'schema',
          description: `Remove disallowed property '${additionalProp}'`,
          safe: false,
          before: `${fullPath}: ${JSON.stringify(
            this.getValueAtPath(data, fullPath)
          )}`,
          after: '(removed)',
          applied: false,
          apply: (obj) => this.removeFieldAtPath(obj, fullPath),
        });
      }
    }

    return fixes;
  }

  /**
   * M1.2: Fix type mismatches (requires confirmation)
   *
   * Converts:
   * - string → array (split by comma or wrap in array)
   * - number → string (toString)
   * - string → number (parseInt/parseFloat)
   * - string → boolean (parse 'true'/'false')
   *
   * @param {Object} data - Parsed YAML data
   * @param {Array} schemaErrors - Validation errors from ajv
   * @returns {Array<Fix>} Array of proposed fixes
   */
  fixTypeErrors(data, schemaErrors) {
    const fixes = [];

    for (const error of schemaErrors) {
      if (error.keyword === 'type') {
        const path = error.instancePath;
        const expectedType = error.params.type;
        const currentValue = this.getValueAtPath(data, path);
        const currentType = Array.isArray(currentValue)
          ? 'array'
          : typeof currentValue;

        const converter = this.getTypeConverter(currentType, expectedType);

        if (converter) {
          const convertedValue = converter(currentValue);

          fixes.push({
            type: 'type',
            description: `Convert '${path}' from ${currentType} to ${expectedType}`,
            safe: false,
            before: `${path}: ${this.formatValue(currentValue, currentType)}`,
            after: `${path}: ${this.formatValue(convertedValue, expectedType)}`,
            applied: false,
            apply: (obj) => this.setValueAtPath(obj, path, convertedValue),
          });
        }
      }
    }

    return fixes;
  }

  /**
   * M1.3: Fix deprecated fields (v1 → v2 migration)
   *
   * @param {Object} data - Parsed YAML data
   * @returns {Array<Fix>} Array of proposed fixes
   */
  fixDeprecatedFields(data) {
    const fixes = [];

    // Check for deprecated fields using migration rules
    const deprecated = this.findDeprecatedFields(data, migrationRules);

    for (const { path, oldField, newField, value } of deprecated) {
      fixes.push({
        type: 'deprecated',
        description: `Migrate '${oldField}' to '${newField}' (v2 schema)`,
        safe: false,
        before: `${path ? path + '.' : ''}${oldField}: ${this.formatValue(value)}`,
        after: `${newField}: ${this.formatValue(value)}`,
        applied: false,
        apply: (obj) => this.applyFieldRename(obj, path, oldField, newField),
      });
    }

    return fixes;
  }

  /**
   * Find deprecated fields in data
   * @private
   */
  findDeprecatedFields(data, rules, path = '') {
    const deprecated = [];

    if (!data || typeof data !== 'object') {
      return deprecated;
    }

    // Check current level
    for (const [oldField, newField] of Object.entries(rules.fieldRenames)) {
      if (oldField in data) {
        // Build current path
        const currentPath = path ? `${path}.${oldField}` : oldField;
        const targetPath = newField;

        // Only flag as deprecated if it's NOT already in the correct location
        // For example, if 'topics' should be 'content.topics', only flag if not under 'content'
        if (currentPath !== targetPath) {
          deprecated.push({
            path,
            oldField,
            newField,
            value: data[oldField],
          });
        }
      }
    }

    // Recursively check nested objects
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nestedPath = path ? `${path}.${key}` : key;
        deprecated.push(...this.findDeprecatedFields(value, rules, nestedPath));
      }
    }

    return deprecated;
  }

  /**
   * Get default value for a field based on schema
   * @private
   */
  getDefaultForField(field, schema, path) {
    // Try to find field definition in schema
    const pathParts = path.split('/').filter(Boolean);
    let currentSchema = schema;

    for (const part of pathParts) {
      if (currentSchema.properties && currentSchema.properties[part]) {
        currentSchema = currentSchema.properties[part];
      }
    }

    if (
      currentSchema.properties &&
      currentSchema.properties[field] &&
      'default' in currentSchema.properties[field]
    ) {
      return currentSchema.properties[field].default;
    }

    // Fallback defaults based on field name patterns
    if (field.includes('duration')) return 30;
    if (field.includes('enabled') || field.includes('required')) return false;
    if (field.includes('list') || field.includes('items')) return [];
    if (field.includes('count') || field.includes('number')) return 0;
    if (field.includes('name') || field.includes('title')) return '';
    if (field.includes('config') || field.includes('settings')) return {};

    return null;
  }

  /**
   * Get type converter function
   * @private
   */
  getTypeConverter(fromType, toType) {
    const key = `${fromType}->${toType}`;

    const converters = {
      'string->array': (val) => {
        // Try splitting by comma
        if (val.includes(',')) {
          return val.split(',').map((s) => s.trim());
        }
        // Wrap in array
        return [val];
      },
      'string->number': (val) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      },
      'string->boolean': (val) => {
        return val.toLowerCase() === 'true' || val === '1';
      },
      'number->string': (val) => String(val),
      'boolean->string': (val) => String(val),
      'array->string': (val) => val.join(', '),
      'number->boolean': (val) => val !== 0,
      'string->object': (val) => {
        try {
          return JSON.parse(val);
        } catch {
          return { value: val };
        }
      },
    };

    return converters[key];
  }

  /**
   * Format value for display
   * @private
   */
  formatValue(value, type) {
    if (type === 'array' || Array.isArray(value)) {
      return JSON.stringify(value);
    }
    if (type === 'object' && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  }

  /**
   * Get value at JSON path
   * @private
   */
  getValueAtPath(obj, path) {
    if (!path) return obj;

    const parts = path
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean);
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }

    return current;
  }

  /**
   * Set value at JSON path
   * @private
   */
  setValueAtPath(obj, path, value) {
    const parts = path
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
    return obj;
  }

  /**
   * Apply field addition
   * @private
   */
  applyFieldAddition(obj, path, value) {
    const clone = JSON.parse(JSON.stringify(obj));
    return this.setValueAtPath(clone, path, value);
  }

  /**
   * Remove field at path
   * @private
   */
  removeFieldAtPath(obj, path) {
    const clone = JSON.parse(JSON.stringify(obj));
    const parts = path
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean);
    let current = clone;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) return clone;
      current = current[parts[i]];
    }

    delete current[parts[parts.length - 1]];
    return clone;
  }

  /**
   * Apply field rename (for deprecated field migration)
   * @private
   */
  applyFieldRename(obj, path, oldField, newField) {
    const clone = JSON.parse(JSON.stringify(obj));
    let current = clone;

    // Navigate to parent object
    if (path) {
      const parts = path.split('.').filter(Boolean);
      for (const part of parts) {
        if (!(part in current)) return clone;
        current = current[part];
      }
    }

    // Handle nested field names (e.g., 'content.topics')
    if (newField.includes('.')) {
      const parts = newField.split('.');
      const value = current[oldField];

      // Create nested structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }

      // Set value at final location
      current[parts[parts.length - 1]] = value;

      // Remove old field
      if (path) {
        this.removeFieldAtPath(clone, `${path}.${oldField}`);
      } else {
        delete clone[oldField];
      }
    } else {
      // Simple rename
      current[newField] = current[oldField];
      delete current[oldField];
    }

    return clone;
  }

  /**
   * Get preview of value at path
   * @private
   */
  getValuePreview(obj, path, maxLength = 100) {
    const value = path ? this.getValueAtPath(obj, path) : obj;
    const str = JSON.stringify(value, null, 2);

    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }

    return str;
  }

  /**
   * Apply all fixes to data
   * @param {Object} data - Original data
   * @param {Array<Fix>} fixes - Fixes to apply
   * @returns {Object} Fixed data
   */
  applyFixes(data, fixes) {
    let result = JSON.parse(JSON.stringify(data));

    for (const fix of fixes) {
      if (fix.apply && fix.applied) {
        result = fix.apply(result);
      }
    }

    return result;
  }

  /**
   * Get all fixes for data and schema errors
   * @param {string} yamlContent - Original YAML content
   * @param {Array} schemaErrors - Schema validation errors
   * @param {Object} schema - JSON schema
   * @returns {Object} All fixes organized by type
   */
  getAllFixes(yamlContent, schemaErrors, schema) {
    const fixes = {
      syntax: null,
      schema: [],
      type: [],
      deprecated: [],
    };

    // 1. Syntax fixes
    const syntaxResult = this.fixSyntaxErrors(yamlContent);
    if (syntaxResult.success) {
      fixes.syntax = syntaxResult;
    }

    // Parse YAML for other fixes
    let data;
    try {
      data = yaml.load(
        syntaxResult.success ? syntaxResult.fixed : yamlContent
      );
    } catch (_error) {
      // Can't proceed with other fixes if YAML is invalid
      return fixes;
    }

    // 2. Schema violation fixes
    const schemaViolations = schemaErrors.filter(
      (e) =>
        e.keyword === 'required' ||
        e.keyword === 'enum' ||
        e.keyword === 'additionalProperties'
    );
    fixes.schema = this.fixSchemaViolations(data, schemaViolations, schema);

    // 3. Type conversion fixes
    const typeErrors = schemaErrors.filter((e) => e.keyword === 'type');
    fixes.type = this.fixTypeErrors(data, typeErrors);

    // 4. Deprecated field fixes
    fixes.deprecated = this.fixDeprecatedFields(data);

    return fixes;
  }
}

/**
 * Create an auto-fixer with default options
 * @param {Object} options - Fixer options
 * @returns {AutoFixer} Auto-fixer instance
 */
export function createAutoFixer(options = {}) {
  return new AutoFixer(options);
}
