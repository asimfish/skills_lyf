/**
 * Manifest validation utility
 *
 * Validates manifest objects against the lesson-plans-manifest
 * JSON Schema. Extracted from manifest-loader.js for reuse across
 * generation, migration, and sync features.
 *
 * @module teaching/utils/manifest-validator
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { getLessonPlansManifestSchema } from '../schemas/v2/index.js';

// Module-level Ajv instance, created once and reused
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

// Module-level compiled validator, lazily initialized
let _compiledValidator = null;

/**
 * Get or create the compiled manifest validator
 * @returns {Function} Compiled ajv validator
 */
function getCompiledValidator() {
  if (!_compiledValidator) {
    const schema = getLessonPlansManifestSchema();
    _compiledValidator = ajv.compile(schema);
  }
  return _compiledValidator;
}

/**
 * Validate a manifest object against the lesson-plans-manifest schema.
 *
 * @param {Object} manifest - Parsed manifest data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 *
 * @example
 * const { valid, errors } = validateManifest(manifest);
 * if (!valid) {
 *   console.error('Validation errors:', errors);
 * }
 */
export function validateManifest(manifest) {
  try {
    const validate = getCompiledValidator();
    const valid = validate(manifest);

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors = (validate.errors || []).map(err => {
      const path = err.instancePath || '';
      return `${path} ${err.message}`.trim();
    });

    return { valid: false, errors };
  } catch (err) {
    return { valid: false, errors: [`Schema validation setup failed: ${err.message}`] };
  }
}

/**
 * Create a reusable compiled validator function.
 * Useful when validating multiple manifests in sequence.
 *
 * @returns {Function|null} Compiled validate function, or null if schema unavailable
 */
export function createManifestValidator() {
  try {
    return getCompiledValidator();
  } catch {
    return null;
  }
}
