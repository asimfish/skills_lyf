/**
 * Template Loader for Teaching Content
 *
 * Loads and manages JSON templates for teaching content generation.
 * Handles template inheritance, auto-field injection, and default values.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a template by type
 * @param {string} type - Template type (exam, quiz, lecture, assignment, syllabus)
 * @returns {object} Merged template with base fields
 * @throws {Error} If template file not found
 */
export function loadTemplate(type) {
  const validTypes = ['exam', 'quiz', 'lecture', 'lecture-notes', 'assignment', 'syllabus'];

  if (!validTypes.includes(type)) {
    throw new Error(
      `Invalid template type: ${type}. Must be one of: ${validTypes.join(', ')}`
    );
  }

  const basePath = join(__dirname, 'base.json');

  try {
    const base = JSON.parse(readFileSync(basePath, 'utf8'));

    // For now, return base template until specific templates are created
    // TODO: Implement template merging when specific templates (exam.json, etc.) exist
    return {
      ...base,
      schema_version: base.properties?.schema_version?.const || '1.0',
      template_type: type,
    };
  } catch (error) {
    throw new Error(`Failed to load template: ${error.message}`, { cause: error });
  }
}

/**
 * Merge base template with specific template
 * @param {object} base - Base template
 * @param {object} specific - Specific template (exam, quiz, etc.)
 * @returns {object} Merged template
 */
export function mergeTemplates(base, specific) {
  // Deep merge strategy: specific template overrides base
  return {
    ...base,
    ...specific,
    properties: {
      ...base.properties,
      ...specific.properties,
      // Merge metadata properties
      metadata: {
        ...base.properties?.metadata,
        ...specific.properties?.metadata,
        properties: {
          ...base.properties?.metadata?.properties,
          ...specific.properties?.metadata?.properties,
        },
      },
    },
  };
}

/**
 * Inject auto-generated values into content
 * @param {object} content - Content object
 * @param {object} template - Template schema
 * @param {object} options - Generation options (version, model)
 * @returns {object} Content with auto-generated fields populated
 */
export function injectAutoFields(content, template, options = {}) {
  const result = { ...content };

  // Inject schema version
  result.schema_version = template.properties.schema_version.const || '1.0';

  // Inject generated_by metadata
  result.generated_by = {
    tool: 'scholar',
    version: options.version || '1.0.0',
    timestamp: new Date().toISOString(),
    model: options.model || 'claude-3-5-sonnet-20241022',
  };

  // Inject auto date if set to "auto"
  if (result.metadata?.date === 'auto') {
    result.metadata.date = new Date().toISOString().split('T')[0];
  }

  return result;
}

/**
 * Apply default values from template to content
 * @param {object} content - Content object
 * @param {object} template - Template schema
 * @returns {object} Content with defaults applied
 */
export function applyDefaults(content, template) {
  const result = { ...content };

  // Recursively apply defaults
  function applyDefaultsRecursive(obj, schema) {
    if (!schema.properties) return obj;

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // Apply default if field is undefined
      if (propSchema.default !== undefined && obj[key] === undefined) {
        obj[key] = propSchema.default;
      }

      // Handle nested objects with properties
      if (propSchema.properties) {
        // Initialize object if it doesn't exist
        if (!obj[key]) {
          obj[key] = {};
        }
        // Recursively apply defaults to nested object
        obj[key] = applyDefaultsRecursive(obj[key], propSchema);
      }
    }

    return obj;
  }

  return applyDefaultsRecursive(result, template);
}

/**
 * Get template metadata
 * @param {string} type - Template type
 * @returns {object} Template metadata (title, description, version)
 */
export function getTemplateMetadata(type) {
  const template = loadTemplate(type);
  return {
    type,
    title: template.title || `${type} Template`,
    description: template.description || '',
    version: template.properties?.schema_version?.const || '1.0',
  };
}

/**
 * List all available template types
 * @returns {string[]} Array of template types
 */
export function listTemplateTypes() {
  return ['exam', 'quiz', 'lecture', 'lecture-notes', 'assignment', 'syllabus'];
}
