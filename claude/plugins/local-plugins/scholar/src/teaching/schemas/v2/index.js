/**
 * Schema Index: Exports all v2 JSON schemas
 *
 * @module teaching/schemas/v2
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load a JSON schema from the schemas directory
 * @param {string} schemaName - Schema filename without extension
 * @returns {Object} Parsed JSON schema
 */
function loadSchema(schemaName) {
  const schemaPath = join(__dirname, `${schemaName}.schema.json`);
  return JSON.parse(readFileSync(schemaPath, 'utf8'));
}

/**
 * Deep clone a schema to prevent mutation across different AJV instances
 * @param {Object} schema - Schema to clone
 * @returns {Object} Deep copy of schema
 */
function deepCloneSchema(schema) {
  return JSON.parse(JSON.stringify(schema));
}

// Lazy-load schemas to avoid startup overhead
let _lessonPlanSchema = null;
let _teachingStyleSchema = null;
let _lessonPlansManifestSchema = null;

/**
 * Lesson Plan Schema (IEEE LOM compliant)
 * Returns a deep copy to prevent cross-test pollution
 * @returns {Object} Deep copy of lesson plan schema
 */
export function getLessonPlanSchema() {
  if (!_lessonPlanSchema) {
    _lessonPlanSchema = loadSchema('lesson-plan');
  }
  return deepCloneSchema(_lessonPlanSchema);
}

/**
 * Teaching Style Schema
 * Returns a deep copy to prevent cross-test pollution
 * @returns {Object} Deep copy of teaching style schema
 */
export function getTeachingStyleSchema() {
  if (!_teachingStyleSchema) {
    _teachingStyleSchema = loadSchema('teaching-style');
  }
  return deepCloneSchema(_teachingStyleSchema);
}

/**
 * Lesson Plans Manifest Schema
 * Validates .flow/lesson-plans.yml manifest files
 * Returns a deep copy to prevent cross-test pollution
 * @returns {Object} Deep copy of lesson plans manifest schema
 */
export function getLessonPlansManifestSchema() {
  if (!_lessonPlansManifestSchema) {
    _lessonPlansManifestSchema = loadSchema('lesson-plans-manifest');
  }
  return deepCloneSchema(_lessonPlansManifestSchema);
}

/**
 * Get schema by name
 * @param {string} name - Schema name ('lesson-plan', 'teaching-style', or 'lesson-plans-manifest')
 * @returns {Object} JSON Schema object
 */
export function getSchema(name) {
  switch (name) {
    case 'lesson-plan':
      return getLessonPlanSchema();
    case 'teaching-style':
      return getTeachingStyleSchema();
    case 'lesson-plans-manifest':
      return getLessonPlansManifestSchema();
    default:
      throw new Error(`Unknown schema: ${name}. Available: ${listSchemas().join(', ')}`);
  }
}

/**
 * List available schemas
 * @returns {string[]} Array of schema names
 */
export function listSchemas() {
  return ['lesson-plan', 'teaching-style', 'lesson-plans-manifest'];
}

/**
 * Reset the schema cache (for testing only)
 * Forces schemas to be reloaded from disk on next access
 */
export function resetCache() {
  _lessonPlanSchema = null;
  _teachingStyleSchema = null;
  _lessonPlansManifestSchema = null;
}

/**
 * Export a schema as JSON string.
 * Used by CLI --export-schema flag and programmatic consumers.
 *
 * @param {string} name - Schema name: 'lesson-plan', 'teaching-style', or 'lesson-plans-manifest'
 * @param {Object} [options]
 * @param {boolean} [options.pretty=true] - Pretty-print with indentation
 * @returns {string} JSON string representation of the schema
 *
 * @example
 * const json = exportSchema('lesson-plans-manifest');
 * console.log(json); // Pretty-printed JSON schema
 *
 * const compact = exportSchema('lesson-plan', { pretty: false });
 * console.log(compact); // Minified JSON
 */
export function exportSchema(name, { pretty = true } = {}) {
  const schema = getSchema(name);
  return pretty ? JSON.stringify(schema, null, 2) : JSON.stringify(schema);
}

export default {
  getLessonPlanSchema,
  getTeachingStyleSchema,
  getLessonPlansManifestSchema,
  getSchema,
  listSchemas,
  resetCache,
  exportSchema
};
