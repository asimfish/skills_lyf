/**
 * Tests for manifest generator and demo scaffold wiring (Feature 1)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { generateDraftStub, mapTopicsToWeeks, generateManifestFromConfig } from '../../../src/teaching/utils/manifest-generator.js';
import { scaffoldFlowDirectory } from '../../../src/teaching/commands/demo-scaffold.js';

describe('manifest-generator', () => {
  describe('generateDraftStub', () => {
    it('should return a stub with week, title, and draft status', () => {
      const stub = generateDraftStub(4, 'Sampling Distributions');
      expect(stub).toEqual({ week: 4, title: 'Sampling Distributions', status: 'draft' });
    });

    it('should handle week 1', () => {
      const stub = generateDraftStub(1, 'Intro');
      expect(stub.week).toBe(1);
      expect(stub.status).toBe('draft');
    });

    it('should handle large week numbers', () => {
      const stub = generateDraftStub(20, 'Advanced Topic');
      expect(stub.week).toBe(20);
    });
  });

  describe('mapTopicsToWeeks', () => {
    const milestones = [
      { week: 8, type: 'midterm', label: 'Midterm' },
      { week: 10, type: 'break', label: 'Break' },
      { week: 16, type: 'final', label: 'Final' }
    ];

    it('should map topics starting from startWeek', () => {
      const mapped = mapTopicsToWeeks(['A', 'B', 'C'], 4, []);
      expect(mapped).toEqual([
        { week: 4, title: 'A' },
        { week: 5, title: 'B' },
        { week: 6, title: 'C' }
      ]);
    });

    it('should skip milestone weeks', () => {
      const mapped = mapTopicsToWeeks(['A', 'B', 'C', 'D', 'E', 'F'], 6, milestones);
      expect(mapped.map(m => m.week)).toEqual([6, 7, 9, 11, 12, 13]);
      // Skipped 8 (midterm) and 10 (break)
    });

    it('should return empty array for empty topics', () => {
      expect(mapTopicsToWeeks([], 4, milestones)).toEqual([]);
    });

    it('should return empty array for null topics', () => {
      expect(mapTopicsToWeeks(null, 4, milestones)).toEqual([]);
    });

    it('should use default startWeek of 4', () => {
      const mapped = mapTopicsToWeeks(['A'], undefined, []);
      expect(mapped[0].week).toBe(4);
    });

    it('should handle consecutive milestone weeks', () => {
      const consecutiveMilestones = [
        { week: 5, type: 'midterm' },
        { week: 6, type: 'break' }
      ];
      const mapped = mapTopicsToWeeks(['A', 'B'], 4, consecutiveMilestones);
      expect(mapped).toEqual([
        { week: 4, title: 'A' },
        { week: 7, title: 'B' }
      ]);
    });

    it('should handle more topics than available weeks', () => {
      const topics = Array.from({ length: 15 }, (_, i) => `Topic ${i + 1}`);
      const mapped = mapTopicsToWeeks(topics, 4, milestones);
      expect(mapped.length).toBe(15);
      // Should not have weeks 8, 10, or 16
      expect(mapped.map(m => m.week)).not.toContain(8);
      expect(mapped.map(m => m.week)).not.toContain(10);
    });
  });

  describe('generateManifestFromConfig', () => {
    const demoConfig = {
      topics: [
        'Descriptive Statistics',
        'Probability Fundamentals',
        'Random Variables',
        'Sampling Distributions',
        'Confidence Intervals',
        'Hypothesis Testing',
        'Simple Linear Regression',
        'Correlation Analysis',
        'Chi-Square Tests',
        'ANOVA Basics'
      ]
    };

    const existingWeeks = [
      { week: 1, title: 'Descriptive Statistics', status: 'published' },
      { week: 2, title: 'Probability Fundamentals', status: 'generated' },
      { week: 3, title: 'Random Variables', status: 'draft' }
    ];

    it('should generate a valid manifest object', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        existingWeeks
      });

      expect(manifest.schema_version).toBe('1.0');
      expect(manifest.semester.total_weeks).toBe(15);
      expect(manifest.semester.schedule).toBe('TR');
      expect(Array.isArray(manifest.weeks)).toBe(true);
    });

    it('should include existing weeks unchanged', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        existingWeeks
      });

      const week1 = manifest.weeks.find(w => w.week === 1);
      expect(week1.status).toBe('published');
      expect(week1.title).toBe('Descriptive Statistics');
    });

    it('should generate draft stubs for topics beyond existing weeks', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        existingWeeks
      });

      const stubs = manifest.weeks.filter(w => w.week > 3);
      expect(stubs.length).toBeGreaterThan(0);
      stubs.forEach(stub => {
        expect(stub.status).toBe('draft');
        expect(stub.title).toBeTruthy();
      });
    });

    it('should skip milestone weeks (8, 10, 16)', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        existingWeeks
      });

      const weekNumbers = manifest.weeks.map(w => w.week);
      expect(weekNumbers).not.toContain(8);
      expect(weekNumbers).not.toContain(10);
    });

    it('should sort weeks by week number', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        existingWeeks
      });

      const weekNumbers = manifest.weeks.map(w => w.week);
      const sorted = [...weekNumbers].sort((a, b) => a - b);
      expect(weekNumbers).toEqual(sorted);
    });

    it('should produce valid YAML string', () => {
      const { yaml: yamlStr } = generateManifestFromConfig({
        teachConfig: demoConfig,
        existingWeeks
      });

      expect(typeof yamlStr).toBe('string');
      expect(() => yaml.load(yamlStr)).not.toThrow();
    });

    it('should include milestones in semester', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        existingWeeks,
        milestones: [{ week: 8, type: 'midterm', label: 'Midterm' }]
      });

      expect(manifest.semester.milestones).toEqual([{ week: 8, type: 'midterm', label: 'Midterm' }]);
    });

    it('should handle empty teach-config topics', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: { topics: [] },
        existingWeeks
      });

      // Should only have existing weeks
      expect(manifest.weeks.length).toBe(3);
    });

    it('should handle null teach-config', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: null,
        existingWeeks
      });

      expect(manifest.weeks.length).toBe(3);
    });

    it('should handle no existing weeks', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig
      });

      expect(manifest.weeks.length).toBe(10); // 10 topics
      // With no existing weeks, maxExistingWeek is 0, so startWeek is 1
      expect(manifest.weeks[0].week).toBe(1);
    });

    it('should use custom schedule', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        schedule: 'MWF'
      });

      expect(manifest.semester.schedule).toBe('MWF');
    });

    it('should use custom totalWeeks', () => {
      const { manifest } = generateManifestFromConfig({
        teachConfig: demoConfig,
        totalWeeks: 20
      });

      expect(manifest.semester.total_weeks).toBe(20);
    });
  });
});

describe('demo-scaffold', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-demo-scaffold-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('scaffoldFlowDirectory', () => {
    it('should create .flow directory', async () => {
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir });

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.flow'))).toBe(true);
    });

    it('should create teach-config.yml in .flow/', async () => {
      await scaffoldFlowDirectory({ targetPath: tmpDir });

      const configPath = path.join(tmpDir, '.flow', 'teach-config.yml');
      expect(fs.existsSync(configPath)).toBe(true);

      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      expect(config.scholar).toBeDefined();
      expect(config.scholar.topics).toBeInstanceOf(Array);
    });

    it('should create lesson-plans.yml in .flow/ with stubs', async () => {
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir });

      const manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.schema_version).toBe('1.0');
      expect(manifest.weeks.length).toBeGreaterThan(3);
      expect(result.weekStubsGenerated).toBeGreaterThan(0);
    });

    it('should have 3 detailed + N stub weeks', async () => {
      await scaffoldFlowDirectory({ targetPath: tmpDir });

      const manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

      const publishedWeeks = manifest.weeks.filter(w => w.status === 'published');
      const generatedWeeks = manifest.weeks.filter(w => w.status === 'generated');
      const draftWeeks = manifest.weeks.filter(w => w.status === 'draft');

      expect(publishedWeeks.length).toBe(1);  // Week 1
      expect(generatedWeeks.length).toBe(1);  // Week 2
      expect(draftWeeks.length).toBeGreaterThanOrEqual(1);  // Week 3 + stubs
    });

    it('should copy example files', async () => {
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir });

      expect(fs.existsSync(path.join(tmpDir, 'examples'))).toBe(true);
      expect(result.filesCreated.some(f => f.startsWith('examples/'))).toBe(true);
    });

    it('should copy README and checklist', async () => {
      await scaffoldFlowDirectory({ targetPath: tmpDir });

      expect(fs.existsSync(path.join(tmpDir, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'TEST-CHECKLIST.md'))).toBe(true);
    });

    it('should skip existing files when force=false', async () => {
      // Create first
      await scaffoldFlowDirectory({ targetPath: tmpDir });
      // Try again without force
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir, force: false });

      expect(result.filesSkipped.length).toBeGreaterThan(0);
    });

    it('should overwrite existing files when force=true', async () => {
      // Create first
      await scaffoldFlowDirectory({ targetPath: tmpDir });
      // Overwrite
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir, force: true });

      expect(result.filesCreated.length).toBeGreaterThan(0);
      expect(result.filesSkipped.length).toBe(0);
    });

    it('should support dry run mode', async () => {
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir, dryRun: true });

      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBeGreaterThan(0);
      // Files should NOT actually exist in dry run
      expect(fs.existsSync(path.join(tmpDir, '.flow', 'teach-config.yml'))).toBe(false);
    });

    it('should fail gracefully with no target path', async () => {
      const result = await scaffoldFlowDirectory({});

      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should report week stubs generated count', async () => {
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir });

      expect(result.weekStubsGenerated).toBeGreaterThan(0);
    });

    it('should generate valid manifest that passes schema validation', async () => {
      const result = await scaffoldFlowDirectory({ targetPath: tmpDir });

      // Validation warnings would be in result.warnings
      const validationWarnings = result.warnings.filter(w => w.includes('validation'));
      expect(validationWarnings).toHaveLength(0);
    });
  });
});
