/**
 * End-to-end test: Full pipeline using the real demo course.
 *
 * Copies ~/projects/teaching/scholar-demo-course to a temp dir,
 * then runs the full pipeline:
 *   1. Detect week files
 *   2. Preview migration
 *   3. Migrate to manifest
 *   4. Validate manifest
 *   5. Simulate flow-cli changes
 *   6. Bidirectional sync with conflict resolution
 *   7. Verify round-trip integrity
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { ManifestMigrator } from '../../../src/teaching/validators/manifest-migrator.js';
import { ManifestSyncEngine } from '../../../src/teaching/config/manifest-sync.js';
import { validateManifest } from '../../../src/teaching/utils/manifest-validator.js';
import { generateManifestFromConfig } from '../../../src/teaching/utils/manifest-generator.js';
import { sha256 } from '../../../src/teaching/utils/hash.js';

const DEMO_COURSE = path.join(
  os.homedir(),
  'projects',
  'teaching',
  'scholar-demo-course'
);

// Skip if demo course doesn't exist (CI environment)
const demoExists = fs.existsSync(DEMO_COURSE);
const describeIfDemo = demoExists ? describe : describe.skip;

describeIfDemo('E2E: Demo Course Pipeline', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-e2e-'));

    // Copy demo course structure to temp dir
    copyDirRecursive(DEMO_COURSE, tmpDir, ['.git', 'node_modules', '.scholar-cache']);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── Phase 1: Migration Pipeline ─────────────────────────

  describe('Phase 1: Migrate directory → manifest', () => {
    // Remove any existing manifest so migration tests start clean
    beforeEach(() => {
      const existingManifest = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      if (fs.existsSync(existingManifest)) {
        fs.unlinkSync(existingManifest);
      }
    });

    it('should detect week files in content/lesson-plans/', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();

      expect(files.length).toBeGreaterThanOrEqual(1);

      const week3 = files.find(f => f.weekNumber === 3);
      expect(week3).toBeDefined();
      expect(week3.source).toBe('content/lesson-plans');
      expect(week3.data.title).toBe('Introduction to Linear Regression');
    });

    it('should identify present fields on detailed week file', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const week3 = files.find(f => f.weekNumber === 3);

      // Week 3 has learning_objectives, topics, activities, materials, lecture_structure
      expect(week3.data.learning_objectives).toBeDefined();
      expect(week3.data.topics).toBeDefined();
      expect(week3.data.activities).toBeDefined();
      expect(week3.data.materials).toBeDefined();
      expect(week3.data.lecture_structure).toBeDefined();
    });

    it('should preview migration correctly', () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const preview = migrator.previewMigration(files);

      expect(preview.weekCount).toBeGreaterThanOrEqual(1);
      expect(preview.manifestYaml).toBeDefined();

      // Parse and verify YAML
      const manifest = yaml.load(preview.manifestYaml);
      expect(manifest.schema_version).toBe('1.0');
      expect(manifest.weeks).toBeInstanceOf(Array);
      expect(manifest.weeks.length).toBeGreaterThanOrEqual(1);
    });

    it('should create .flow/lesson-plans.yml via migrate()', async () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const result = await migrator.migrate(files);

      expect(result.success).toBe(true);
      expect(result.weeksMerged).toBeGreaterThanOrEqual(1);

      // Manifest file should exist
      const manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      expect(fs.existsSync(manifestPath)).toBe(true);

      // Parse and validate
      const content = fs.readFileSync(manifestPath, 'utf8');
      const manifest = yaml.load(content);

      expect(manifest.schema_version).toBe('1.0');
      expect(manifest.semester).toBeDefined();
      expect(manifest.weeks).toBeInstanceOf(Array);

      // Week 3 should be present with original data
      const week3 = manifest.weeks.find(w => w.week === 3);
      expect(week3).toBeDefined();
      expect(week3.title).toBe('Introduction to Linear Regression');
      expect(week3.learning_objectives.length).toBe(4);
      expect(week3.activities.length).toBe(5);
    });

    it('should preserve detailed week data through migration', async () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      await migrator.migrate(files);

      const manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

      const week3 = manifest.weeks.find(w => w.week === 3);

      // Verify all fields survived (v2 schema format)
      expect(week3.topics[0].id).toBe('T-3.1');
      expect(week3.topics[0].name).toBe('Simple Linear Regression Model');
      expect(week3.topics[0].subtopics).toContain('Population regression line');
      expect(week3.materials.readings[0].type).toBe('textbook');
      expect(week3.materials.readings[0].title).toBe('Simple Linear Regression');
      expect(week3.activities[2].type).toBe('lab-activity');
      expect(week3.lecture_structure[1].teaching_method).toBe('mini-lecture');
    });

    it('should produce a manifest that validates structurally', async () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      await migrator.migrate(files);

      const manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

      // Structural validation: top-level keys present
      expect(manifest.schema_version).toBe('1.0');
      expect(manifest.semester).toBeDefined();
      expect(Array.isArray(manifest.weeks)).toBe(true);

      // With v2-compliant demo course data, strict schema validation should pass
      const { valid, errors } = validateManifest(manifest);
      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should support dry-run without writing', async () => {
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      const result = await migrator.migrate(files, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.weeksMerged).toBeGreaterThanOrEqual(1);

      // File should NOT exist
      expect(fs.existsSync(path.join(tmpDir, '.flow', 'lesson-plans.yml'))).toBe(false);
    });
  });

  // ─── Phase 2: Manifest Generation from Config ────────────

  describe('Phase 2: Generate manifest from teach-config.yml', () => {
    it('should generate manifest with topic stubs from config', () => {
      const configPath = path.join(tmpDir, '.flow', 'teach-config.yml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent);

      const teachConfig = config.scholar || config;
      const topics = teachConfig.topics || [];

      const result = generateManifestFromConfig({
        teachConfig,
        totalWeeks: 15,
        schedule: 'TR'
      });

      expect(result.manifest).toBeDefined();
      expect(result.manifest.schema_version).toBe('1.0');
      expect(result.manifest.weeks.length).toBeGreaterThan(0);

      // Should have draft stubs for mapped topics
      const draftWeeks = result.manifest.weeks.filter(w => w.status === 'draft');
      expect(draftWeeks.length).toBeGreaterThan(0);

      // Topics should appear as week titles
      const weekTitles = result.manifest.weeks.map(w => w.title);
      // At least some topics should be present
      const matchedTopics = topics.filter(t => weekTitles.includes(t));
      expect(matchedTopics.length).toBeGreaterThan(0);
    });

    it('should skip milestone weeks (midterm, break)', () => {
      const configPath = path.join(tmpDir, '.flow', 'teach-config.yml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      const teachConfig = config.scholar || config;

      const result = generateManifestFromConfig({
        teachConfig,
        totalWeeks: 15
      });

      // Week 8 (midterm) and week 10 (break) should not have topic stubs
      const week8 = result.manifest.weeks.find(w => w.week === 8);
      const week10 = result.manifest.weeks.find(w => w.week === 10);

      if (week8) {
        expect(week8.title).not.toMatch(/Descriptive Statistics|Probability/);
      }
      if (week10) {
        expect(week10.title).not.toMatch(/Descriptive Statistics|Probability/);
      }
    });

    it('should produce valid YAML output', () => {
      const configPath = path.join(tmpDir, '.flow', 'teach-config.yml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      const teachConfig = config.scholar || config;

      const result = generateManifestFromConfig({ teachConfig });

      expect(result.yaml).toBeDefined();
      expect(typeof result.yaml).toBe('string');

      // Should be valid YAML
      const reparsed = yaml.load(result.yaml);
      expect(reparsed.schema_version).toBe('1.0');
      expect(reparsed.weeks).toBeInstanceOf(Array);
    });
  });

  // ─── Phase 3: Bidirectional Sync ─────────────────────────

  describe('Phase 3: Bidirectional manifest sync', () => {
    let manifestPath;
    let theirsPath;

    beforeEach(async () => {
      // First, create a manifest via migration
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      await migrator.migrate(files);

      manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      theirsPath = path.join(tmpDir, '.flow', 'lesson-plans-flow.yml');
    });

    it('should detect identical manifests', () => {
      // Copy ours to theirs — should be identical
      fs.copyFileSync(manifestPath, theirsPath);

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair(manifestPath, theirsPath);

      expect(pair.identical).toBe(true);
      expect(pair.errors).toHaveLength(0);
    });

    it('should detect theirs-only changes', () => {
      // Copy ours to theirs, then modify theirs
      const oursContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = yaml.load(oursContent);

      // Simulate flow-cli adding a new week
      manifest.weeks.push({
        week: 14,
        title: 'Flow-CLI Added Week',
        status: 'draft'
      });

      fs.writeFileSync(theirsPath, yaml.dump(manifest, { lineWidth: 120, noRefs: true }), 'utf8');

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair(manifestPath, theirsPath);

      expect(pair.identical).toBe(false);

      // Use ours as base (no stored base yet)
      const ours = yaml.load(oursContent);
      const theirs = yaml.load(fs.readFileSync(theirsPath, 'utf8'));
      const diff = engine.computeWeekDiff(ours, ours, theirs);

      expect(diff.theirsChanged).toContain(14);
    });

    it('should auto-merge non-conflicting changes', () => {
      const oursContent = fs.readFileSync(manifestPath, 'utf8');
      const base = yaml.load(oursContent);
      const ours = yaml.load(oursContent);
      const theirs = yaml.load(oursContent);

      // Scholar modifies week 3 status
      const oursWeek3 = ours.weeks.find(w => w.week === 3);
      if (oursWeek3) oursWeek3.status = 'reviewed';

      // flow-cli adds a new week
      theirs.weeks.push({
        week: 14,
        title: 'Added by flow-cli',
        status: 'draft'
      });

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const mergeResult = engine.mergeManifests(base, ours, theirs);

      expect(mergeResult.success).toBe(true);

      // Both changes should be in merged result
      const mergedManifest = mergeResult.merged;
      const mergedWeek3 = mergedManifest.weeks.find(w => w.week === 3);
      const mergedWeek14 = mergedManifest.weeks.find(w => w.week === 14);

      if (mergedWeek3) expect(mergedWeek3.status).toBe('reviewed');
      expect(mergedWeek14).toBeDefined();
      expect(mergedWeek14.title).toBe('Added by flow-cli');

      // Auto-merged should include week 14
      expect(mergeResult.autoMerged).toContain(14);
    });

    it('should resolve conflicts with ours strategy', () => {
      const oursContent = fs.readFileSync(manifestPath, 'utf8');
      const base = yaml.load(oursContent);
      const ours = yaml.load(oursContent);
      const theirs = yaml.load(oursContent);

      // Both modify week 3 differently
      const oursWeek3 = ours.weeks.find(w => w.week === 3);
      const theirsWeek3 = theirs.weeks.find(w => w.week === 3);

      if (oursWeek3 && theirsWeek3) {
        oursWeek3.title = 'Scholar version';
        theirsWeek3.title = 'Flow-CLI version';

        const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
        const mergeResult = engine.mergeManifests(base, ours, theirs, {
          conflictStrategy: 'ours'
        });

        expect(mergeResult.success).toBe(true);
        expect(mergeResult.conflicts.length).toBeGreaterThanOrEqual(1);
        expect(mergeResult.conflicts[0].resolution).toBe('ours');

        const mergedWeek3 = mergeResult.merged.weeks.find(w => w.week === 3);
        expect(mergedWeek3.title).toBe('Scholar version');
      }
    });

    it('should resolve conflicts with theirs strategy', () => {
      const oursContent = fs.readFileSync(manifestPath, 'utf8');
      const base = yaml.load(oursContent);
      const ours = yaml.load(oursContent);
      const theirs = yaml.load(oursContent);

      const oursWeek3 = ours.weeks.find(w => w.week === 3);
      const theirsWeek3 = theirs.weeks.find(w => w.week === 3);

      if (oursWeek3 && theirsWeek3) {
        oursWeek3.title = 'Scholar version';
        theirsWeek3.title = 'Flow-CLI version';

        const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
        const mergeResult = engine.mergeManifests(base, ours, theirs, {
          conflictStrategy: 'theirs'
        });

        expect(mergeResult.success).toBe(true);
        const mergedWeek3 = mergeResult.merged.weeks.find(w => w.week === 3);
        expect(mergedWeek3.title).toBe('Flow-CLI version');
      }
    });

    it('should write merged manifest and store base hash', () => {
      const oursContent = fs.readFileSync(manifestPath, 'utf8');
      const base = yaml.load(oursContent);
      const ours = yaml.load(oursContent);
      const theirs = yaml.load(oursContent);

      // Theirs adds a new week
      theirs.weeks.push({
        week: 14,
        title: 'New from flow-cli',
        status: 'draft'
      });

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const mergeResult = engine.mergeManifests(base, ours, theirs);
      const writeResult = engine.writeMergedManifest(manifestPath, mergeResult.mergedYaml);

      expect(writeResult.success).toBe(true);
      expect(writeResult.newHash).toBeDefined();

      // Store base hash for next sync
      engine.storeBaseHash(tmpDir, writeResult.newHash);
      const storedHash = engine.getBaseHash(tmpDir);
      expect(storedHash).toBe(writeResult.newHash);

      // Verify file was updated
      const updatedManifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));
      expect(updatedManifest.weeks.find(w => w.week === 14)).toBeDefined();
    });

    it('should create backup before writing', () => {
      const oursContent = fs.readFileSync(manifestPath, 'utf8');
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const writeResult = engine.writeMergedManifest(manifestPath, oursContent);

      expect(writeResult.success).toBe(true);
      expect(writeResult.backupPath).toBeDefined();
      expect(fs.existsSync(writeResult.backupPath)).toBe(true);
    });
  });

  // ─── Phase 4: Full Round-Trip ────────────────────────────

  describe('Phase 4: Full round-trip integrity', () => {
    it('should survive detect → migrate → sync → verify cycle', async () => {
      // Step 1: Detect
      const migrator = new ManifestMigrator({ courseRoot: tmpDir });
      const files = migrator.detectWeekFiles();
      expect(files.length).toBeGreaterThanOrEqual(1);

      // Step 2: Migrate
      const migrateResult = await migrator.migrate(files);
      expect(migrateResult.success).toBe(true);

      const manifestPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const originalHash = sha256(manifestContent);

      // Step 3: Simulate flow-cli sync (copy + modify)
      const theirsPath = path.join(tmpDir, '.flow', 'lesson-plans-flow.yml');
      const theirsManifest = yaml.load(manifestContent);
      theirsManifest.weeks.push({
        week: 12,
        title: 'Flow-CLI: Review Session',
        status: 'draft'
      });
      fs.writeFileSync(theirsPath, yaml.dump(theirsManifest, { lineWidth: 120, noRefs: true }), 'utf8');

      // Step 4: Sync
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const ours = yaml.load(manifestContent);
      const base = yaml.load(manifestContent); // First sync: ours is the base
      const theirs = yaml.load(fs.readFileSync(theirsPath, 'utf8'));

      const mergeResult = engine.mergeManifests(base, ours, theirs);
      expect(mergeResult.success).toBe(true);
      expect(mergeResult.autoMerged).toContain(12);

      const writeResult = engine.writeMergedManifest(manifestPath, mergeResult.mergedYaml);
      expect(writeResult.success).toBe(true);
      engine.storeBaseHash(tmpDir, writeResult.newHash);

      // Step 5: Verify
      const finalManifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

      // Original week 3 data preserved
      const week3 = finalManifest.weeks.find(w => w.week === 3);
      expect(week3).toBeDefined();
      expect(week3.title).toBe('Introduction to Linear Regression');
      expect(week3.learning_objectives.length).toBe(4);

      // New week 12 from flow-cli present
      const week12 = finalManifest.weeks.find(w => w.week === 12);
      expect(week12).toBeDefined();
      expect(week12.title).toBe('Flow-CLI: Review Session');

      // Weeks sorted
      const weekNums = finalManifest.weeks.map(w => w.week);
      const sorted = [...weekNums].sort((a, b) => a - b);
      expect(weekNums).toEqual(sorted);

      // Hash changed (content was modified)
      const finalHash = sha256(fs.readFileSync(manifestPath, 'utf8'));
      expect(finalHash).not.toBe(originalHash);

      // Stored hash matches
      const storedHash = engine.getBaseHash(tmpDir);
      expect(storedHash).toBe(finalHash);

      // Full v2 schema validation passes (demo course now v2 compliant)
      expect(finalManifest.schema_version).toBe('1.0');
      expect(finalManifest.semester).toBeDefined();
      expect(Array.isArray(finalManifest.weeks)).toBe(true);

      const { valid } = validateManifest(finalManifest);
      expect(valid).toBe(true);
    });
  });
});

/**
 * Recursively copy directory, skipping excluded dirs
 */
function copyDirRecursive(src, dest, exclude = []) {
  if (!fs.existsSync(src)) return;

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
