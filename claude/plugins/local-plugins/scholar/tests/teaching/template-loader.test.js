/**
 * Unit tests for Template Loader
 */

import {
  loadTemplate,
  mergeTemplates,
  injectAutoFields,
  applyDefaults,
  getTemplateMetadata,
  listTemplateTypes,
} from '../../src/teaching/templates/loader.js';

describe('Template Loader', () => {
  describe('loadTemplate', () => {
    it('should load base template for valid type', () => {
      const template = loadTemplate('exam');
      expect(template).toBeDefined();
      expect(template.template_type).toBe('exam');
      expect(template.schema_version).toBe('1.0');
    });

    it('should load template for all valid types', () => {
      const types = ['exam', 'quiz', 'lecture', 'assignment', 'syllabus'];
      types.forEach((type) => {
        const template = loadTemplate(type);
        expect(template.template_type).toBe(type);
      });
    });

    it('should throw error for invalid type', () => {
      expect(() => loadTemplate('invalid')).toThrow('Invalid template type');
    });

    it('should have required base properties', () => {
      const template = loadTemplate('exam');
      expect(template.properties).toBeDefined();
      expect(template.properties.metadata).toBeDefined();
      expect(template.properties.generated_by).toBeDefined();
    });
  });

  describe('mergeTemplates', () => {
    it('should merge base and specific templates', () => {
      const base = {
        properties: {
          metadata: {
            properties: {
              title: { type: 'string' },
              date: { type: 'string', default: 'auto' },
            },
          },
        },
      };

      const specific = {
        properties: {
          metadata: {
            properties: {
              duration: { type: 'number', default: 60 },
            },
          },
          questions: {
            type: 'array',
          },
        },
      };

      const merged = mergeTemplates(base, specific);
      expect(merged.properties.metadata.properties.title).toBeDefined();
      expect(merged.properties.metadata.properties.duration).toBeDefined();
      expect(merged.properties.questions).toBeDefined();
    });

    it('should allow specific template to override base', () => {
      const base = {
        properties: {
          metadata: {
            properties: {
              date: { type: 'string', default: 'auto' },
            },
          },
        },
      };

      const specific = {
        properties: {
          metadata: {
            properties: {
              date: { type: 'string', default: '2026-01-11' },
            },
          },
        },
      };

      const merged = mergeTemplates(base, specific);
      expect(merged.properties.metadata.properties.date.default).toBe(
        '2026-01-11'
      );
    });
  });

  describe('injectAutoFields', () => {
    it('should inject schema_version', () => {
      const template = loadTemplate('exam');
      const content = { metadata: { title: 'Test Exam' } };

      const result = injectAutoFields(content, template);
      expect(result.schema_version).toBe('1.0');
    });

    it('should inject generated_by metadata', () => {
      const template = loadTemplate('exam');
      const content = { metadata: { title: 'Test Exam' } };

      const result = injectAutoFields(content, template);
      expect(result.generated_by).toBeDefined();
      expect(result.generated_by.tool).toBe('scholar');
      expect(result.generated_by.timestamp).toBeDefined();
      expect(result.generated_by.version).toBeDefined();
      expect(result.generated_by.model).toBeDefined();
    });

    it('should inject custom version and model', () => {
      const template = loadTemplate('exam');
      const content = { metadata: { title: 'Test Exam' } };
      const options = {
        version: '2.0.0',
        model: 'claude-opus-4',
      };

      const result = injectAutoFields(content, template, options);
      expect(result.generated_by.version).toBe('2.0.0');
      expect(result.generated_by.model).toBe('claude-opus-4');
    });

    it('should convert auto date to ISO date string', () => {
      const template = loadTemplate('exam');
      const content = {
        metadata: {
          title: 'Test Exam',
          date: 'auto',
        },
      };

      const result = injectAutoFields(content, template);
      expect(result.metadata.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.metadata.date).not.toBe('auto');
    });

    it('should preserve non-auto date values', () => {
      const template = loadTemplate('exam');
      const content = {
        metadata: {
          title: 'Test Exam',
          date: '2026-06-15',
        },
      };

      const result = injectAutoFields(content, template);
      expect(result.metadata.date).toBe('2026-06-15');
    });

    it('should generate valid ISO 8601 timestamp', () => {
      const template = loadTemplate('exam');
      const content = { metadata: { title: 'Test Exam' } };

      const result = injectAutoFields(content, template);
      const timestamp = new Date(result.generated_by.timestamp);
      expect(timestamp.toISOString()).toBe(result.generated_by.timestamp);
    });
  });

  describe('applyDefaults', () => {
    it('should apply default values from template', () => {
      const template = {
        properties: {
          metadata: {
            properties: {
              date: { type: 'string', default: 'auto' },
              duration: { type: 'number', default: 60 },
            },
          },
        },
      };

      const content = { metadata: { title: 'Test Exam' } };

      const result = applyDefaults(content, template);
      expect(result.metadata.date).toBe('auto');
      expect(result.metadata.duration).toBe(60);
    });

    it('should not override existing values', () => {
      const template = {
        properties: {
          metadata: {
            properties: {
              duration: { type: 'number', default: 60 },
            },
          },
        },
      };

      const content = {
        metadata: {
          title: 'Test Exam',
          duration: 90,
        },
      };

      const result = applyDefaults(content, template);
      expect(result.metadata.duration).toBe(90);
    });

    it('should handle nested defaults', () => {
      const template = {
        properties: {
          settings: {
            type: 'object',
            properties: {
              format: { type: 'string', default: 'markdown' },
              validate: { type: 'boolean', default: true },
            },
          },
        },
      };

      const content = { settings: {} };

      const result = applyDefaults(content, template);
      expect(result.settings.format).toBe('markdown');
      expect(result.settings.validate).toBe(true);
    });
  });

  describe('getTemplateMetadata', () => {
    it('should return metadata for template', () => {
      const metadata = getTemplateMetadata('exam');
      expect(metadata).toBeDefined();
      expect(metadata.type).toBe('exam');
      expect(metadata.title).toBeDefined();
      expect(metadata.version).toBe('1.0');
    });

    it('should return metadata for all types', () => {
      const types = ['exam', 'quiz', 'lecture', 'assignment', 'syllabus'];
      types.forEach((type) => {
        const metadata = getTemplateMetadata(type);
        expect(metadata.type).toBe(type);
      });
    });
  });

  describe('listTemplateTypes', () => {
    it('should return all template types', () => {
      const types = listTemplateTypes();
      expect(types).toEqual([
        'exam',
        'quiz',
        'lecture',
        'lecture-notes',
        'assignment',
        'syllabus',
      ]);
    });

    it('should return array of strings', () => {
      const types = listTemplateTypes();
      expect(Array.isArray(types)).toBe(true);
      types.forEach((type) => {
        expect(typeof type).toBe('string');
      });
    });
  });
});
