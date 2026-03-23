/**
 * Migration Rules for Schema v1 → v2
 *
 * Defines transformations for upgrading old configs to new schema version.
 */

/**
 * Field rename mappings (v1 → v2)
 */
export const fieldRenames = {
  // Top-level renames
  topics: 'content.topics',
  objectives: 'content.learning_objectives',
  materials: 'content.materials',

  // Metadata renames
  week: 'metadata.week',
  date: 'metadata.date',

  // Teaching style renames
  teaching_style: 'style.teaching_approach',
  assessment_type: 'style.assessment_approach',
};

/**
 * Field additions (required in v2, not in v1)
 */
export const fieldAdditions = {
  schema_version: '2.0',
  'metadata.id': 'auto-generate', // Will be auto-generated based on filename or content
  'content.duration': 30, // Default duration in minutes
};

/**
 * Type conversions
 */
export const typeConversions = {
  materials: {
    from: 'string',
    to: 'array',
    converter: 'stringToArray',
    description: 'Convert single material string to array',
  },
  topics: {
    from: 'string',
    to: 'array',
    converter: 'stringToArray',
    description: 'Convert comma-separated topics to array',
  },
  'content.topics': {
    from: 'string',
    to: 'array',
    converter: 'stringToArray',
    description: 'Convert comma-separated topics to array',
  },
};

/**
 * Field removals (deprecated in v2)
 */
export const fieldRemovals = [
  'legacy_id', // No longer used
  'deprecated_field', // Removed in v2
];

/**
 * Structural changes (more complex transformations)
 */
export const structuralChanges = {
  // Flatten nested 'config' object to top-level
  flattenConfig: {
    from: 'config.*',
    to: '*',
    description: 'Move config fields to top level',
  },

  // Group related fields under 'metadata'
  groupMetadata: {
    fields: ['week', 'date', 'id', 'course_code'],
    to: 'metadata',
    description: 'Group metadata fields under metadata object',
  },

  // Convert topics array of strings to array of topic objects
  enhanceTopics: {
    from: 'content.topics (string[])',
    to: 'content.topics (TopicObject[])',
    description: 'Convert topic strings to topic objects with duration',
    transform: (topics) => {
      if (!Array.isArray(topics)) return topics;

      return topics.map((topic) => {
        if (typeof topic === 'string') {
          return {
            title: topic,
            duration: 30, // Default 30 minutes
          };
        }
        return topic; // Already an object
      });
    },
  },
};

/**
 * Default values for new required fields in v2
 */
export const defaultValues = {
  schema_version: '2.0',
  'metadata.id': (filename) => {
    // Generate ID from filename
    if (filename) {
      return filename
        .replace(/\.(yml|yaml)$/, '')
        .replace(/[^a-z0-9-]/gi, '-')
        .toLowerCase();
    }
    // Fallback to timestamp-based ID
    return `config-${Date.now()}`;
  },
  'metadata.created_at': () => new Date().toISOString(),
  'metadata.version': '1.0',
  'content.duration': 30,
  'content.topics': [],
  'content.learning_objectives': [],
  'content.materials': [],
  'style.teaching_approach': 'interactive',
  'style.assessment_approach': 'formative',
};

/**
 * Validation rules for migration
 */
export const validationRules = {
  // Ensure these fields exist after migration
  requiredFields: [
    'schema_version',
    'metadata.id',
    'content.topics',
    'content.learning_objectives',
  ],

  // Ensure these types are correct after migration
  typeChecks: {
    schema_version: 'string',
    'content.topics': 'array',
    'content.learning_objectives': 'array',
    'content.materials': 'array',
    'metadata.week': 'number',
  },
};

/**
 * Complete migration rules object
 */
export const migrationRules = {
  fieldRenames,
  fieldAdditions,
  typeConversions,
  fieldRemovals,
  structuralChanges,
  defaultValues,
  validationRules,
};

/**
 * Get migration complexity score (0-10)
 * Based on number and type of transformations needed
 *
 * @param {Object} data - v1 data to migrate
 * @returns {number} Complexity score (0-10)
 */
export function getMigrationComplexity(data) {
  let complexity = 0;

  // Check for deprecated fields (1 point each)
  for (const oldField of Object.keys(fieldRenames)) {
    if (oldField in data) {
      complexity += 1;
    }
  }

  // Check for type conversions needed (2 points each)
  for (const [field, conversion] of Object.entries(typeConversions)) {
    const value = getNestedValue(data, field);
    if (value !== undefined && typeof value === conversion.from) {
      complexity += 2;
    }
  }

  // Check for structural changes needed (3 points each)
  if (data.config && typeof data.config === 'object') {
    complexity += 3; // Needs flattening
  }

  // Cap at 10
  return Math.min(complexity, 10);
}

/**
 * Get human-readable complexity description
 *
 * @param {number} complexity - Complexity score (0-10)
 * @returns {string} Description
 */
export function getComplexityDescription(complexity) {
  if (complexity === 0) return 'Trivial (no changes needed)';
  if (complexity <= 3) return 'Low (simple field renames)';
  if (complexity <= 6) return 'Medium (field renames + type conversions)';
  if (complexity <= 9) return 'High (structural changes required)';
  return 'Very High (extensive restructuring)';
}

/**
 * Helper: Get nested value from object
 * @private
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }

  return current;
}
