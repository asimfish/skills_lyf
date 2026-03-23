/**
 * Config Validator: Multi-level validation for YAML configuration files
 *
 * Provides four levels of validation:
 * 1. Syntax - YAML parsing (is it valid YAML?)
 * 2. Schema - JSON Schema compliance (does structure match?)
 * 3. Semantic - Business logic (do values make sense?)
 * 4. Cross-file - References (do IDs exist in other files?)
 *
 * @module teaching/validators/config-validator
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { getLessonPlanSchema, getTeachingStyleSchema } from '../schemas/v2/index.js';
import {
  formatErrors,
  formatSummary,
  supportsColor
} from '../formatters/error-formatter.js';

/**
 * @typedef {Object} ValidationError
 * @property {'error'|'warning'|'info'} level - Severity level
 * @property {number} line - Line number (1-based)
 * @property {number} [column] - Column number (1-based)
 * @property {string} message - Error message
 * @property {string} [rule] - Rule or schema path that triggered the error
 * @property {string} [docLink] - Documentation link
 * @property {string} [suggestion] - Fix suggestion
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed (no errors)
 * @property {'syntax'|'schema'|'semantic'|'cross-file'} level - Highest level reached
 * @property {ValidationError[]} errors - All errors found
 * @property {ValidationError[]} warnings - All warnings found
 * @property {Object} [data] - Parsed YAML data (if syntax valid)
 * @property {number} duration - Validation duration in ms
 */

/**
 * @typedef {Object} ValidatorOptions
 * @property {boolean} [strict] - Fail on warnings (default: false)
 * @property {'syntax'|'schema'|'semantic'|'cross-file'} [maxLevel] - Stop after this level
 * @property {boolean} [color] - Enable color output (default: auto-detect)
 * @property {string} [cwd] - Current working directory for relative paths
 * @property {boolean} [debug] - Enable debug logging
 */

/**
 * Map JSON path to YAML line number
 * This is a simplified approach - full mapping requires YAML AST
 * @param {string} yamlContent - Original YAML content
 * @param {string} jsonPath - JSON path (e.g., "learning_objectives[0].id")
 * @returns {number} Approximate line number (1-based)
 */
function mapJsonPathToLine(yamlContent, jsonPath) {
  const lines = yamlContent.split('\n');

  // Parse the path into segments
  // e.g., "learning_objectives[0].id" -> ["learning_objectives", "[0]", "id"]
  const segments = jsonPath.split(/\.|\[|\]/).filter(Boolean);

  let currentLine = 1;

  for (const segment of segments) {
    // Handle array index
    if (/^\d+$/.test(segment)) {
      const index = parseInt(segment, 10);
      let foundItems = 0;

      for (let i = currentLine - 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('-')) {
          if (foundItems === index) {
            currentLine = i + 1;
            break;
          }
          foundItems++;
        }
      }
    } else {
      // Handle object key
      const keyPattern = new RegExp(`^\\s*${segment}\\s*:`, 'm');

      for (let i = currentLine - 1; i < lines.length; i++) {
        if (keyPattern.test(lines[i])) {
          currentLine = i + 1;
          break;
        }
      }
    }
  }

  return currentLine;
}

/**
 * Config Validator class
 */
export class ConfigValidator {
  /**
   * Create a new config validator
   * @param {ValidatorOptions} options - Validator options
   */
  constructor(options = {}) {
    this.options = {
      strict: options.strict || false,
      maxLevel: options.maxLevel || 'cross-file',
      color: options.color ?? supportsColor(),
      cwd: options.cwd || process.cwd(),
      debug: options.debug || process.env.SCHOLAR_DEBUG === 'true'
    };

    // Initialize ajv with formats
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(this.ajv);

    // Pre-compile schemas
    this._lessonPlanValidate = null;
    this._teachingStyleValidate = null;
  }

  /**
   * Debug log helper
   * @param {string} message - Message to log
   * @param {Object} [data] - Additional data
   */
  debugLog(message, data = null) {
    if (this.options.debug) {
      const prefix = '[scholar:validate]';
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  /**
   * Get or compile lesson plan validator
   * @returns {Function} Compiled ajv validator
   */
  getLessonPlanValidator() {
    if (!this._lessonPlanValidate) {
      this._lessonPlanValidate = this.ajv.compile(getLessonPlanSchema());
    }
    return this._lessonPlanValidate;
  }

  /**
   * Get or compile teaching style validator
   * @returns {Function} Compiled ajv validator
   */
  getTeachingStyleValidator() {
    if (!this._teachingStyleValidate) {
      this._teachingStyleValidate = this.ajv.compile(getTeachingStyleSchema());
    }
    return this._teachingStyleValidate;
  }

  /**
   * Detect schema type from file path
   * @param {string} filePath - Path to YAML file
   * @returns {'lesson-plan'|'teaching-style'|'unknown'} Schema type
   */
  detectSchemaType(filePath) {
    if (filePath.includes('lesson-plan') || filePath.includes('week')) {
      return 'lesson-plan';
    }
    if (filePath.includes('teaching-style')) {
      return 'teaching-style';
    }
    return 'unknown';
  }

  /**
   * Validate a YAML file
   * @param {string} filePath - Path to YAML file
   * @param {Object} [options] - Validation options
   * @param {string} [options.schemaType] - Force schema type
   * @returns {ValidationResult} Validation result
   */
  validateFile(filePath, options = {}) {
    const startTime = Date.now();
    const errors = [];
    const warnings = [];
    let data;
    let highestLevel;
    let schemaErrors = []; // Store raw schema errors for auto-fixer

    this.debugLog(`Validating: ${filePath}`);

    // Check file exists
    if (!existsSync(filePath)) {
      return {
        isValid: false,
        level: 'syntax',
        errors: [{
          level: 'error',
          line: 0,
          message: `File not found: ${filePath}`,
          rule: 'file-exists'
        }],
        warnings: [],
        schemaErrors: [],
        duration: Date.now() - startTime
      };
    }

    // Read file content
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch (err) {
      return {
        isValid: false,
        level: 'syntax',
        errors: [{
          level: 'error',
          line: 0,
          message: `Cannot read file: ${err.message}`,
          rule: 'file-readable'
        }],
        warnings: [],
        schemaErrors: [],
        duration: Date.now() - startTime
      };
    }

    // === Level 1: Syntax (YAML parsing) ===
    this.debugLog('Level 1: Syntax validation');
    try {
      data = yaml.load(content, {
        filename: filePath,
        onWarning: (warning) => {
          warnings.push({
            level: 'warning',
            line: warning.mark?.line ? warning.mark.line + 1 : 1,
            message: warning.message,
            rule: 'yaml-syntax'
          });
        }
      });
    } catch (err) {
      if (err.name === 'YAMLException') {
        errors.push({
          level: 'error',
          line: err.mark?.line ? err.mark.line + 1 : 1,
          column: err.mark?.column ? err.mark.column + 1 : undefined,
          message: err.reason || err.message,
          rule: 'yaml-syntax',
          suggestion: 'Check YAML indentation and syntax'
        });
      } else {
        errors.push({
          level: 'error',
          line: 1,
          message: err.message,
          rule: 'yaml-parse'
        });
      }

      return {
        isValid: false,
        level: 'syntax',
        errors,
        warnings,
        schemaErrors: [],
        duration: Date.now() - startTime
      };
    }

    // Handle empty files
    if (data === null || data === undefined) {
      warnings.push({
        level: 'warning',
        line: 1,
        message: 'File is empty or contains only comments',
        rule: 'yaml-empty'
      });

      return {
        isValid: true,
        level: 'syntax',
        errors,
        warnings,
        data,
        schemaErrors: [],
        duration: Date.now() - startTime
      };
    }

    highestLevel = 'syntax';
    if (this.options.maxLevel === 'syntax') {
      return { isValid: errors.length === 0, level: highestLevel, errors, warnings, data, schemaErrors, duration: Date.now() - startTime };
    }

    // === Level 2: Schema validation ===
    this.debugLog('Level 2: Schema validation');
    highestLevel = 'schema';

    const schemaType = options.schemaType || this.detectSchemaType(filePath);
    this.debugLog(`Schema type: ${schemaType}`);

    if (schemaType !== 'unknown') {
      let validate;
      try {
        if (schemaType === 'lesson-plan') {
          validate = this.getLessonPlanValidator();
        } else if (schemaType === 'teaching-style') {
          validate = this.getTeachingStyleValidator();
        }

        if (validate) {
          const valid = validate(data);

          if (!valid && validate.errors) {
            // Store raw schema errors for auto-fixer
            schemaErrors = validate.errors;

            for (const err of validate.errors) {
              const jsonPath = (err.instancePath || err.dataPath || '').replace(/^\//, '').replace(/\//g, '.');
              const line = mapJsonPathToLine(content, jsonPath);

              errors.push({
                level: 'error',
                line,
                message: this.formatSchemaError(err),
                rule: `schema:${err.keyword}`,
                suggestion: this.getSchemaSuggestion(err)
              });
            }
          }
        }
      } catch (err) {
        errors.push({
          level: 'error',
          line: 1,
          message: `Schema validation error: ${err.message}`,
          rule: 'schema-compile'
        });
      }
    } else {
      warnings.push({
        level: 'info',
        line: 1,
        message: 'Unknown file type - skipping schema validation',
        rule: 'schema-unknown'
      });
    }

    if (this.options.maxLevel === 'schema') {
      return { isValid: errors.length === 0, level: highestLevel, errors, warnings, data, schemaErrors, duration: Date.now() - startTime };
    }

    // === Level 3: Semantic validation ===
    this.debugLog('Level 3: Semantic validation');
    highestLevel = 'semantic';

    if (schemaType === 'lesson-plan') {
      const semanticIssues = this.validateLessonPlanSemantics(data, content);
      errors.push(...semanticIssues.filter(i => i.level === 'error'));
      warnings.push(...semanticIssues.filter(i => i.level === 'warning'));
    }

    if (this.options.maxLevel === 'semantic') {
      return { isValid: errors.length === 0, level: highestLevel, errors, warnings, data, schemaErrors, duration: Date.now() - startTime };
    }

    // === Level 4: Cross-file validation ===
    this.debugLog('Level 4: Cross-file validation');
    highestLevel = 'cross-file';

    if (schemaType === 'lesson-plan') {
      const crossFileIssues = this.validateCrossFileReferences(data, filePath, content);
      errors.push(...crossFileIssues.filter(i => i.level === 'error'));
      warnings.push(...crossFileIssues.filter(i => i.level === 'warning'));
    }

    const isValid = this.options.strict ? (errors.length === 0 && warnings.length === 0) : (errors.length === 0);

    return {
      isValid,
      level: highestLevel,
      errors,
      warnings,
      data,
      schemaErrors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Format ajv schema error
   * @param {Object} error - ajv error object
   * @returns {string} Formatted error message
   */
  formatSchemaError(error) {
    const { keyword, message, params, instancePath } = error;
    const path = instancePath ? instancePath.replace(/^\//, '').replace(/\//g, '.') : 'root';

    switch (keyword) {
      case 'required':
        return `Missing required field: ${params.missingProperty}`;
      case 'type':
        return `${path}: expected ${params.type}`;
      case 'enum':
        return `${path}: must be one of: ${params.allowedValues.join(', ')}`;
      case 'pattern':
        return `${path}: invalid format (expected pattern: ${params.pattern})`;
      case 'minLength':
        return `${path}: too short (minimum ${params.limit} characters)`;
      case 'maxLength':
        return `${path}: too long (maximum ${params.limit} characters)`;
      case 'minimum':
        return `${path}: value too small (minimum ${params.limit})`;
      case 'maximum':
        return `${path}: value too large (maximum ${params.limit})`;
      case 'minItems':
        return `${path}: too few items (minimum ${params.limit})`;
      case 'maxItems':
        return `${path}: too many items (maximum ${params.limit})`;
      case 'format':
        return `${path}: invalid ${params.format} format`;
      default:
        return message || `${path}: validation error`;
    }
  }

  /**
   * Get suggestion for schema error
   * @param {Object} error - ajv error object
   * @returns {string|undefined} Suggestion text
   */
  getSchemaSuggestion(error) {
    const { keyword, params } = error;

    switch (keyword) {
      case 'pattern':
        if (params.pattern.includes('LO-')) {
          return 'Use format: LO-X.Y (e.g., LO-3.1)';
        }
        if (params.pattern.includes('T-')) {
          return 'Use format: T-X.Y (e.g., T-3.1)';
        }
        if (params.pattern.includes('A-')) {
          return 'Use format: A-X.Y (e.g., A-3.1)';
        }
        break;
      case 'enum':
        return `Choose from: ${params.allowedValues.join(', ')}`;
      case 'format':
        if (params.format === 'date') {
          return 'Use format: YYYY-MM-DD (e.g., 2026-01-15)';
        }
        break;
    }
    return undefined;
  }

  /**
   * Validate lesson plan semantic rules
   * @param {Object} data - Parsed lesson plan data
   * @param {string} content - Original YAML content
   * @returns {ValidationError[]} Semantic validation issues
   */
  validateLessonPlanSemantics(data, content) {
    const issues = [];

    // Check activity durations don't exceed class time
    if (data.activities && data.lecture_structure) {
      const totalActivityTime = data.activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
      const totalLectureTime = data.lecture_structure.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      if (totalActivityTime > totalLectureTime) {
        issues.push({
          level: 'warning',
          line: mapJsonPathToLine(content, 'activities'),
          message: `Activity time (${totalActivityTime} min) exceeds lecture time (${totalLectureTime} min)`,
          rule: 'semantic:duration-overflow'
        });
      }
    }

    // Check learning objectives are assessed
    if (data.learning_objectives && data.assessments) {
      const assessedObjectives = new Set(
        data.assessments.flatMap(a => a.learning_objectives || [])
      );

      for (const obj of data.learning_objectives) {
        if (!assessedObjectives.has(obj.id)) {
          issues.push({
            level: 'warning',
            line: mapJsonPathToLine(content, `learning_objectives`),
            message: `Learning objective ${obj.id} has no linked assessment`,
            rule: 'semantic:unassessed-objective',
            suggestion: 'Add this objective to an assessment\'s learning_objectives array'
          });
        }
      }
    }

    // Check topic prerequisites form valid DAG (no cycles)
    if (data.topics) {
      const topicIds = new Set(data.topics.map(t => t.id));

      for (const topic of data.topics) {
        if (topic.prerequisites) {
          for (const prereq of topic.prerequisites) {
            // Warn if prerequisite references a topic in same week
            if (topicIds.has(prereq)) {
              issues.push({
                level: 'warning',
                line: mapJsonPathToLine(content, `topics`),
                message: `Topic ${topic.id} has prerequisite ${prereq} from same week`,
                rule: 'semantic:self-prerequisite'
              });
            }
          }
        }
      }
    }

    // Check date range is valid
    if (data.date_range?.start && data.date_range?.end) {
      const start = new Date(data.date_range.start);
      const end = new Date(data.date_range.end);

      if (start > end) {
        issues.push({
          level: 'error',
          line: mapJsonPathToLine(content, 'date_range'),
          message: 'Start date is after end date',
          rule: 'semantic:invalid-date-range'
        });
      }
    }

    return issues;
  }

  /**
   * Validate cross-file references
   * @param {Object} data - Parsed lesson plan data
   * @param {string} filePath - Path to current file
   * @param {string} content - Original YAML content
   * @returns {ValidationError[]} Cross-file validation issues
   */
  validateCrossFileReferences(data, filePath, content) {
    const issues = [];
    const courseDir = dirname(dirname(filePath)); // Go up from lesson-plans/

    // Check material file references
    if (data.materials?.datasets) {
      for (const dataset of data.materials.datasets) {
        if (dataset.file) {
          const datasetPath = join(courseDir, dataset.file);
          if (!existsSync(datasetPath)) {
            issues.push({
              level: 'warning',
              line: mapJsonPathToLine(content, 'materials.datasets'),
              message: `Dataset file not found: ${dataset.file}`,
              rule: 'cross-file:missing-dataset',
              suggestion: `Create file at: ${relative(this.options.cwd, datasetPath)}`
            });
          }
        }
      }
    }

    // Check prerequisite topics exist in previous weeks
    if (data.prerequisites?.topics) {
      const lessonPlansDir = dirname(filePath);
      const currentWeek = data.week;

      for (const prereqId of data.prerequisites.topics) {
        // Extract week number from topic ID (e.g., T-2.1 -> week 2)
        const match = prereqId.match(/^T-(\d+)\./);
        if (match) {
          const prereqWeek = parseInt(match[1], 10);

          if (prereqWeek >= currentWeek) {
            issues.push({
              level: 'warning',
              line: mapJsonPathToLine(content, 'prerequisites.topics'),
              message: `Prerequisite ${prereqId} is from week ${prereqWeek}, not before week ${currentWeek}`,
              rule: 'cross-file:future-prerequisite'
            });
          }

          // Could also check if the topic exists in that week's file
          const prereqFile = join(lessonPlansDir, `week${String(prereqWeek).padStart(2, '0')}.yml`);
          if (!existsSync(prereqFile)) {
            issues.push({
              level: 'info',
              line: mapJsonPathToLine(content, 'prerequisites.topics'),
              message: `Cannot verify prerequisite ${prereqId} - week ${prereqWeek} lesson plan not found`,
              rule: 'cross-file:unverified-prerequisite'
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Format validation result for display
   * @param {string} filePath - Path to validated file
   * @param {ValidationResult} result - Validation result
   * @returns {string} Formatted output
   */
  formatResult(filePath, result) {
    const lines = [];
    const opts = { color: this.options.color, cwd: this.options.cwd, verbose: true };

    if (result.errors.length > 0) {
      lines.push(formatErrors(filePath, result.errors, opts));
    }

    if (result.warnings.length > 0) {
      lines.push(formatErrors(filePath, result.warnings, opts));
    }

    lines.push(formatSummary({
      errors: result.errors.length,
      warnings: result.warnings.length,
      info: result.warnings.filter(w => w.level === 'info').length,
      files: 1,
      duration: result.duration
    }, opts));

    return lines.join('\n');
  }

  /**
   * Get the JSON schema for a file (used by auto-fixer)
   * @param {string} filePath - Path to YAML file
   * @returns {Object} JSON Schema object
   */
  getSchemaForFile(filePath) {
    const schemaType = this.detectSchemaType(filePath);

    if (schemaType === 'lesson-plan') {
      return getLessonPlanSchema();
    } else if (schemaType === 'teaching-style') {
      return getTeachingStyleSchema();
    }

    // Return a minimal schema for unknown types
    return {
      type: 'object',
      properties: {},
      additionalProperties: true
    };
  }
}

/**
 * Create a config validator with default options
 * @param {ValidatorOptions} options - Validator options
 * @returns {ConfigValidator} Validator instance
 */
export function createConfigValidator(options = {}) {
  return new ConfigValidator(options);
}

/**
 * Validate a single file (convenience function)
 * @param {string} filePath - Path to YAML file
 * @param {ValidatorOptions} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateConfigFile(filePath, options = {}) {
  const validator = new ConfigValidator(options);
  return validator.validateFile(filePath, options);
}

export default ConfigValidator;
