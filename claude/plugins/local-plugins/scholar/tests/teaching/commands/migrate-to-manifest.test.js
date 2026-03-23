/**
 * Tests for manifest migrator (Feature 2: /teaching:migrate --to-manifest)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { ManifestMigrator } from '../../../src/teaching/validators/manifest-migrator.js';

describe('ManifestMigrator', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-migrator-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /**
   * Helper to create a week file in a specific directory
   */
  function createWeekFile(dir, weekNum, data = {}) {
    const dirPath = path.join(tmpDir, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    const padded = weekNum.toString().padStart(2, '0');
    const filePath = path.join(dirPath, `week${padded}.yml`);
    const weekData = {
      week: weekNum,
      title: `Week ${weekNum}`,
      status: 'draft',
      ...data
    };
    fs.writeFileSync(filePath, yaml.dump(weekData), 'utf8');
    return filePath;
  }

  describe('constructor', () => {
    it('should accept courseRoot', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      expect(migrator.courseRoot).toBe(tmpDir);
    });

    it('should default debug to false', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      expect(migrator.debug).toBe(false);
    });
  });

  describe('detectWeekFiles', () => {
    it('should detect week files in content/lesson-plans', () => {
      createWeekFile('content/lesson-plans', 1);
      createWeekFile('content/lesson-plans', 2);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files).toHaveLength(2);
      expect(files[0].weekNumber).toBe(1);
      expect(files[1].weekNumber).toBe(2);
    });

    it('should detect week files in lesson-plans/', () => {
      createWeekFile('lesson-plans', 5);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files).toHaveLength(1);
      expect(files[0].weekNumber).toBe(5);
    });

    it('should detect week files in .flow/weeks', () => {
      createWeekFile('.flow/weeks', 3);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files).toHaveLength(1);
      expect(files[0].source).toBe('.flow/weeks');
    });

    it('should detect across multiple directories', () => {
      createWeekFile('content/lesson-plans', 1);
      createWeekFile('lesson-plans', 5);
      createWeekFile('.flow/weeks', 10);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files).toHaveLength(3);
    });

    it('should parse week data from YAML', () => {
      createWeekFile('lesson-plans', 1, { title: 'Intro Stats', status: 'published' });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files[0].data.title).toBe('Intro Stats');
      expect(files[0].data.status).toBe('published');
    });

    it('should identify missing fields', () => {
      createWeekFile('lesson-plans', 1, { title: 'Test' });
      // Status is present but learning_objectives, topics, etc are missing

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files[0].missingFields).toContain('learning_objectives');
      expect(files[0].missingFields).toContain('topics');
      expect(files[0].missingFields).toContain('activities');
    });

    it('should return empty array when no week files exist', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files).toHaveLength(0);
    });

    it('should skip unparseable YAML files', () => {
      const dir = path.join(tmpDir, 'lesson-plans');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'week01.yml'), '{{invalid yaml', 'utf8');
      createWeekFile('lesson-plans', 2);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files).toHaveLength(1);
      expect(files[0].weekNumber).toBe(2);
    });
  });

  describe('previewMigration', () => {
    it('should count week files', () => {
      createWeekFile('lesson-plans', 1);
      createWeekFile('lesson-plans', 2);
      createWeekFile('lesson-plans', 3);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const preview = migrator.previewMigration(files);

      expect(preview.weekCount).toBe(3);
    });

    it('should count fields to fill', () => {
      createWeekFile('lesson-plans', 1, { title: 'Test' });
      // Missing: learning_objectives, topics, activities, materials, lecture_structure

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const preview = migrator.previewMigration(files);

      expect(preview.fieldsToFill).toBeGreaterThan(0);
    });

    it('should detect duplicate week numbers', () => {
      createWeekFile('content/lesson-plans', 1);
      createWeekFile('lesson-plans', 1); // Duplicate week 1

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const preview = migrator.previewMigration(files);

      expect(preview.conflicts).toHaveLength(1);
      expect(preview.conflicts[0].week).toBe(1);
    });

    it('should warn about existing manifest', () => {
      createWeekFile('lesson-plans', 1);
      fs.mkdirSync(path.join(tmpDir, '.flow'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, '.flow', 'lesson-plans.yml'),
        'schema_version: "1.0"\nweeks: []\n',
        'utf8'
      );

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const preview = migrator.previewMigration(files);

      expect(preview.warnings.some(w => w.includes('Existing'))).toBe(true);
    });

    it('should generate manifest YAML preview', () => {
      createWeekFile('lesson-plans', 1, { title: 'Intro' });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const preview = migrator.previewMigration(files);

      expect(preview.manifestYaml).toBeDefined();
      const parsed = yaml.load(preview.manifestYaml);
      expect(parsed.schema_version).toBe('1.0');
      expect(parsed.weeks).toHaveLength(1);
    });
  });

  describe('migrate', () => {
    it('should create .flow/lesson-plans.yml', async () => {
      createWeekFile('lesson-plans', 1, { title: 'Intro' });
      createWeekFile('lesson-plans', 2, { title: 'Probability' });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const result = await migrator.migrate(files);

      expect(result.success).toBe(true);
      expect(result.weeksMerged).toBe(2);

      const manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.weeks).toHaveLength(2);
    });

    it('should fill defaults for missing fields', async () => {
      createWeekFile('lesson-plans', 1, { title: 'Test' });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const result = await migrator.migrate(files);

      expect(result.defaultsFilled).toBeGreaterThan(0);

      const manifest = yaml.load(
        fs.readFileSync(path.join(tmpDir, '.flow', 'lesson-plans.yml'), 'utf8')
      );
      expect(manifest.weeks[0].status).toBe('draft');
    });

    it('should preserve existing field values', async () => {
      createWeekFile('lesson-plans', 1, {
        title: 'Custom Title',
        status: 'published',
        learning_objectives: [{ id: 'LO-1', description: 'Test' }]
      });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      await migrator.migrate(files);

      const manifest = yaml.load(
        fs.readFileSync(path.join(tmpDir, '.flow', 'lesson-plans.yml'), 'utf8')
      );
      expect(manifest.weeks[0].title).toBe('Custom Title');
      expect(manifest.weeks[0].status).toBe('published');
      expect(manifest.weeks[0].learning_objectives).toHaveLength(1);
    });

    it('should create backup of existing manifest', async () => {
      fs.mkdirSync(path.join(tmpDir, '.flow'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, '.flow', 'lesson-plans.yml'),
        'schema_version: "1.0"\nweeks: []\n',
        'utf8'
      );
      createWeekFile('lesson-plans', 1, { title: 'New' });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const result = await migrator.migrate(files);

      expect(result.backupPath).toBeDefined();
      expect(fs.existsSync(result.backupPath)).toBe(true);
    });

    it('should support dry run', async () => {
      createWeekFile('lesson-plans', 1);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const result = await migrator.migrate(files, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.weeksMerged).toBe(1);
      // File should NOT be created in dry run
      expect(fs.existsSync(path.join(tmpDir, '.flow', 'lesson-plans.yml'))).toBe(false);
    });

    it('should fail with no files', async () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const result = await migrator.migrate([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No week files');
    });

    it('should sort weeks by number', async () => {
      createWeekFile('lesson-plans', 5, { title: 'Five' });
      createWeekFile('lesson-plans', 1, { title: 'One' });
      createWeekFile('lesson-plans', 3, { title: 'Three' });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      await migrator.migrate(files);

      const manifest = yaml.load(
        fs.readFileSync(path.join(tmpDir, '.flow', 'lesson-plans.yml'), 'utf8')
      );
      expect(manifest.weeks.map(w => w.week)).toEqual([1, 3, 5]);
    });

    it('should include semester metadata', async () => {
      createWeekFile('lesson-plans', 1);

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      await migrator.migrate(files);

      const manifest = yaml.load(
        fs.readFileSync(path.join(tmpDir, '.flow', 'lesson-plans.yml'), 'utf8')
      );
      expect(manifest.schema_version).toBe('1.0');
      expect(manifest.semester.total_weeks).toBe(15);
      expect(manifest.semester.schedule).toBe('TR');
    });

    it('should generate warnings for missing fields', async () => {
      createWeekFile('lesson-plans', 1, { title: 'Test' });
      // Missing: learning_objectives, topics, activities, etc.

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const result = await migrator.migrate(files);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should accept custom defaults', async () => {
      createWeekFile('lesson-plans', 1, { title: 'Test' });

      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      await migrator.migrate(files, { defaults: { status: 'reviewed' } });

      // Custom default should NOT override existing 'draft' value
      const manifest = yaml.load(
        fs.readFileSync(path.join(tmpDir, '.flow', 'lesson-plans.yml'), 'utf8')
      );
      expect(manifest.weeks[0].status).toBe('draft'); // was already set
    });
  });

  describe('fillDefaults', () => {
    it('should fill missing fields with defaults', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const { filled, count } = migrator.fillDefaults({ week: 1, title: 'Test' }, 1);

      expect(filled.status).toBe('draft');
      expect(filled.learning_objectives).toEqual([]);
      expect(filled.topics).toEqual([]);
      expect(count).toBeGreaterThan(0);
    });

    it('should not overwrite existing fields', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const { filled } = migrator.fillDefaults(
        { week: 1, title: 'Custom', status: 'published' },
        1
      );

      expect(filled.status).toBe('published');
    });

    it('should add week number if missing', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const { filled } = migrator.fillDefaults({ title: 'Test' }, 5);

      expect(filled.week).toBe(5);
    });

    it('should add default title if missing', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const { filled, warnings } = migrator.fillDefaults({ week: 3 }, 3);

      expect(filled.title).toBe('Week 3');
      expect(warnings.some(w => w.includes('title'))).toBe(true);
    });

    it('should accept custom defaults', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const { filled } = migrator.fillDefaults(
        { week: 1, title: 'Test' },
        1,
        { status: 'reviewed' }
      );

      // Custom default only applies if field is missing
      expect(filled.status).toBe('reviewed');
    });

    it('should count filled fields', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const { count } = migrator.fillDefaults({ week: 1, title: 'Test' }, 1);

      // At minimum: status, learning_objectives, topics, activities, materials, lecture_structure
      expect(count).toBeGreaterThanOrEqual(5);
    });
  });
});
