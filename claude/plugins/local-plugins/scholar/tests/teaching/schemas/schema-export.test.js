/**
 * Tests for schema export functionality (Feature 3)
 */

import { exportSchema, getSchema, listSchemas, getLessonPlansManifestSchema } from '../../../src/teaching/schemas/v2/index.js';

describe('schema-export', () => {
  describe('exportSchema', () => {
    it('should export lesson-plan schema as pretty JSON', () => {
      const json = exportSchema('lesson-plan');
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
      expect(json).toContain('\n'); // Pretty-printed has newlines
    });

    it('should export lesson-plans-manifest schema', () => {
      const json = exportSchema('lesson-plans-manifest');
      const parsed = JSON.parse(json);
      expect(parsed.$schema).toBeDefined();
      expect(parsed.properties).toBeDefined();
    });

    it('should export teaching-style schema', () => {
      const json = exportSchema('teaching-style');
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    it('should support compact (non-pretty) format', () => {
      const compact = exportSchema('lesson-plan', { pretty: false });
      const pretty = exportSchema('lesson-plan', { pretty: true });

      expect(compact.length).toBeLessThan(pretty.length);
      expect(compact).not.toContain('\n');
    });

    it('should throw for unknown schema name', () => {
      expect(() => exportSchema('nonexistent')).toThrow(/Unknown schema/);
    });

    it('should produce valid JSON that can be re-parsed', () => {
      const schemas = listSchemas();
      schemas.forEach(name => {
        const json = exportSchema(name);
        const parsed = JSON.parse(json);
        expect(parsed).toBeDefined();
        expect(typeof parsed).toBe('object');
      });
    });

    it('should match the schema returned by getSchema', () => {
      const exported = JSON.parse(exportSchema('lesson-plans-manifest'));
      const direct = getSchema('lesson-plans-manifest');
      expect(exported).toEqual(direct);
    });

    it('pretty output should be indented with 2 spaces', () => {
      const json = exportSchema('lesson-plan');
      // Check for 2-space indentation pattern
      expect(json).toMatch(/^ {2}"/m);
    });
  });

  describe('npm package exports compatibility', () => {
    it('should export getLessonPlansManifestSchema', () => {
      const schema = getLessonPlansManifestSchema();
      expect(schema).toBeDefined();
      expect(schema.properties).toBeDefined();
      expect(schema.properties.schema_version).toBeDefined();
    });

    it('should export getSchema with all known schema names', () => {
      const names = listSchemas();
      expect(names).toContain('lesson-plan');
      expect(names).toContain('teaching-style');
      expect(names).toContain('lesson-plans-manifest');

      names.forEach(name => {
        const schema = getSchema(name);
        expect(schema).toBeDefined();
      });
    });

    it('schema should have $schema property', () => {
      const schema = getSchema('lesson-plans-manifest');
      expect(schema.$schema).toContain('json-schema.org');
    });

    it('exported schema should be usable with Ajv', async () => {
      const { default: Ajv } = await import('ajv');
      const { default: addFormats } = await import('ajv-formats');

      const json = exportSchema('lesson-plans-manifest');
      const schema = JSON.parse(json);

      const ajv = new Ajv({ allErrors: true });
      addFormats(ajv);
      const validate = ajv.compile(schema);

      // Valid manifest
      const valid = validate({
        schema_version: '1.0',
        semester: { total_weeks: 15, schedule: 'TR' },
        weeks: [{ week: 1, title: 'Test', status: 'draft' }]
      });
      expect(valid).toBe(true);

      // Invalid manifest
      const invalid = validate({ bad: 'data' });
      expect(invalid).toBe(false);
    });
  });

  describe('package.json exports field', () => {
    it('should have exports field configured', async () => {
      const { readFileSync } = await import('fs');
      const { join, dirname } = await import('path');
      const { fileURLToPath } = await import('url');

      const __dirname = dirname(fileURLToPath(import.meta.url));
      const pkgPath = join(__dirname, '..', '..', '..', 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

      expect(pkg.exports).toBeDefined();
      expect(pkg.exports['./schemas']).toBeDefined();
      expect(pkg.exports['./schemas/lesson-plan']).toBeDefined();
      expect(pkg.exports['./schemas/teaching-style']).toBeDefined();
      expect(pkg.exports['./schemas/lesson-plans-manifest']).toBeDefined();
    });

    it('exports paths should point to existing files', async () => {
      const { readFileSync, existsSync } = await import('fs');
      const { join, dirname } = await import('path');
      const { fileURLToPath } = await import('url');

      const __dirname = dirname(fileURLToPath(import.meta.url));
      const projectRoot = join(__dirname, '..', '..', '..');
      const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

      for (const [_key, value] of Object.entries(pkg.exports)) {
        const fullPath = join(projectRoot, value);
        expect(existsSync(fullPath)).toBe(true);
      }
    });

    it('JSON schema files should be valid JSON', async () => {
      const { readFileSync } = await import('fs');
      const { join, dirname } = await import('path');
      const { fileURLToPath } = await import('url');

      const __dirname = dirname(fileURLToPath(import.meta.url));
      const projectRoot = join(__dirname, '..', '..', '..');
      const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

      const jsonExports = Object.entries(pkg.exports)
        .filter(([, v]) => v.endsWith('.json'));

      expect(jsonExports.length).toBeGreaterThan(0);

      for (const [, value] of jsonExports) {
        const fullPath = join(projectRoot, value);
        const content = readFileSync(fullPath, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });
});
