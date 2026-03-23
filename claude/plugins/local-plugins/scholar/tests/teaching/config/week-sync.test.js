/**
 * Tests for week-level bidirectional sync (Feature 4)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { ManifestSyncEngine } from '../../../src/teaching/config/manifest-sync.js';
import { sha256 } from '../../../src/teaching/utils/hash.js';

describe('ManifestSyncEngine', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-sync-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /**
   * Helper to create a manifest file
   */
  function writeManifest(filePath, manifest) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const yamlContent = yaml.dump(manifest, { lineWidth: 120, noRefs: true });
    fs.writeFileSync(filePath, yamlContent, 'utf8');
    return yamlContent;
  }

  const baseManifest = {
    schema_version: '1.0',
    semester: { total_weeks: 15, schedule: 'TR' },
    weeks: [
      { week: 1, title: 'Descriptive Statistics', status: 'published' },
      { week: 2, title: 'Probability', status: 'generated' },
      { week: 3, title: 'Random Variables', status: 'draft' },
      { week: 4, title: 'Sampling', status: 'draft' },
      { week: 5, title: 'Confidence Intervals', status: 'draft' }
    ]
  };

  describe('constructor', () => {
    it('should accept courseRoot', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      expect(engine.courseRoot).toBe(tmpDir);
    });

    it('should default dryRun to false', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      expect(engine.dryRun).toBe(false);
    });
  });

  describe('loadSyncPair', () => {
    it('should load both manifests', () => {
      const oursPath = path.join(tmpDir, 'ours.yml');
      const theirsPath = path.join(tmpDir, 'theirs.yml');
      writeManifest(oursPath, baseManifest);
      writeManifest(theirsPath, baseManifest);

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair(oursPath, theirsPath);

      expect(pair.ours).toBeDefined();
      expect(pair.theirs).toBeDefined();
      expect(pair.oursHash).toBeDefined();
      expect(pair.theirsHash).toBeDefined();
      expect(pair.errors).toHaveLength(0);
    });

    it('should detect identical manifests', () => {
      const oursPath = path.join(tmpDir, 'ours.yml');
      const theirsPath = path.join(tmpDir, 'theirs.yml');
      const content = writeManifest(oursPath, baseManifest);
      fs.writeFileSync(theirsPath, content, 'utf8');

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair(oursPath, theirsPath);

      expect(pair.identical).toBe(true);
    });

    it('should detect different manifests', () => {
      const oursPath = path.join(tmpDir, 'ours.yml');
      const theirsPath = path.join(tmpDir, 'theirs.yml');
      writeManifest(oursPath, baseManifest);
      writeManifest(theirsPath, { ...baseManifest, weeks: [] });

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair(oursPath, theirsPath);

      expect(pair.identical).toBe(false);
    });

    it('should report missing files', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair('/nonexistent/a.yml', '/nonexistent/b.yml');

      expect(pair.errors.length).toBe(2);
      expect(pair.ours).toBeNull();
      expect(pair.theirs).toBeNull();
    });
  });

  describe('computeWeekDiff', () => {
    it('should detect no changes when all identical', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, baseManifest, baseManifest);

      expect(diff.oursChanged).toHaveLength(0);
      expect(diff.theirsChanged).toHaveLength(0);
      expect(diff.conflicts).toHaveLength(0);
      expect(diff.unchanged.length).toBe(5);
    });

    it('should detect ours-only changes', () => {
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, oursModified, baseManifest);

      expect(diff.oursChanged).toContain(3);
      expect(diff.theirsChanged).toHaveLength(0);
      expect(diff.conflicts).toHaveLength(0);
    });

    it('should detect theirs-only changes', () => {
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 5 ? { ...w, title: 'Updated CI' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, baseManifest, theirsModified);

      expect(diff.theirsChanged).toContain(5);
      expect(diff.oursChanged).toHaveLength(0);
      expect(diff.conflicts).toHaveLength(0);
    });

    it('should detect non-conflicting changes on different weeks', () => {
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 5 ? { ...w, title: 'Updated CI' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, oursModified, theirsModified);

      expect(diff.oursChanged).toContain(3);
      expect(diff.theirsChanged).toContain(5);
      expect(diff.conflicts).toHaveLength(0);
    });

    it('should detect conflict when both modify same week', () => {
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, title: 'Updated by flow-cli' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, oursModified, theirsModified);

      expect(diff.conflicts).toHaveLength(1);
      expect(diff.conflicts[0].week).toBe(3);
      expect(diff.conflicts[0].conflictingFields).toContain('status');
      expect(diff.conflicts[0].conflictingFields).toContain('title');
    });

    it('should not conflict when both make same change', () => {
      const modified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, modified, modified);

      // Same change on both sides = no conflict
      expect(diff.conflicts).toHaveLength(0);
    });

    it('should detect semester metadata changes', () => {
      const oursModified = {
        ...baseManifest,
        semester: { ...baseManifest.semester, schedule: 'MWF' }
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, oursModified, baseManifest);

      expect(diff.semesterDiff).toBe(true);
    });

    it('should detect week deleted by ours', () => {
      // base has [1,2,3,4,5], ours removes week 3 → [1,2,4,5], theirs unchanged
      const oursDeleted = {
        ...baseManifest,
        weeks: baseManifest.weeks.filter(w => w.week !== 3)
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, oursDeleted, baseManifest);

      // Week 3 deleted by ours
      expect(diff.deletedByOurs).toContain(3);
      expect(diff.deletedByTheirs).not.toContain(3);
      expect(diff.conflicts).toHaveLength(0);
      // Remaining weeks 1,2,4,5 should be unchanged
      expect(diff.unchanged).toEqual(expect.arrayContaining([1, 2, 4, 5]));
    });

    it('should detect week deleted by theirs', () => {
      // base has [1,2,3,4,5], theirs removes week 5 → [1,2,3,4], ours unchanged
      const theirsDeleted = {
        ...baseManifest,
        weeks: baseManifest.weeks.filter(w => w.week !== 5)
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, baseManifest, theirsDeleted);

      // Week 5 deleted by theirs
      expect(diff.deletedByTheirs).toContain(5);
      expect(diff.deletedByOurs).not.toContain(5);
      expect(diff.conflicts).toHaveLength(0);
      // Remaining weeks 1,2,3,4 should be unchanged
      expect(diff.unchanged).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    });

    it('should not conflict when both sides delete the same week', () => {
      // Both remove week 3
      const oursDeleted = {
        ...baseManifest,
        weeks: baseManifest.weeks.filter(w => w.week !== 3)
      };
      const theirsDeleted = {
        ...baseManifest,
        weeks: baseManifest.weeks.filter(w => w.week !== 3)
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, oursDeleted, theirsDeleted);

      // Both deleted week 3 → no conflict, tracked in both arrays
      expect(diff.deletedByOurs).toContain(3);
      expect(diff.deletedByTheirs).toContain(3);
      expect(diff.conflicts).toHaveLength(0);
      // Remaining weeks should be unchanged
      expect(diff.unchanged).toEqual(expect.arrayContaining([1, 2, 4, 5]));
    });

    it('should handle new weeks added by theirs', () => {
      const theirsWithNew = {
        ...baseManifest,
        weeks: [
          ...baseManifest.weeks,
          { week: 6, title: 'New from flow-cli', status: 'draft' }
        ]
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, baseManifest, theirsWithNew);

      expect(diff.theirsChanged).toContain(6);
    });
  });

  describe('mergeManifests', () => {
    it('should auto-merge non-conflicting changes', () => {
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 5 ? { ...w, title: 'Updated CI' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.mergeManifests(baseManifest, oursModified, theirsModified);

      expect(result.success).toBe(true);
      const week3 = result.merged.weeks.find(w => w.week === 3);
      const week5 = result.merged.weeks.find(w => w.week === 5);
      expect(week3.status).toBe('reviewed');     // our change kept
      expect(week5.title).toBe('Updated CI');     // their change merged
      expect(result.autoMerged).toContain(5);
    });

    it('should resolve conflicts with ours strategy (default)', () => {
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'published' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.mergeManifests(baseManifest, oursModified, theirsModified);

      const week3 = result.merged.weeks.find(w => w.week === 3);
      expect(week3.status).toBe('reviewed'); // ours wins
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].resolution).toBe('ours');
    });

    it('should resolve conflicts with theirs strategy', () => {
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'published' } : w
        )
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.mergeManifests(baseManifest, oursModified, theirsModified, {
        conflictStrategy: 'theirs'
      });

      const week3 = result.merged.weeks.find(w => w.week === 3);
      expect(week3.status).toBe('published'); // theirs wins
    });

    it('should produce valid YAML output', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.mergeManifests(baseManifest, baseManifest, baseManifest);

      expect(result.mergedYaml).toBeDefined();
      const parsed = yaml.load(result.mergedYaml);
      expect(parsed.schema_version).toBe('1.0');
      expect(parsed.weeks.length).toBe(5);
    });

    it('should sort merged weeks by week number', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.mergeManifests(baseManifest, baseManifest, baseManifest);

      const weekNums = result.merged.weeks.map(w => w.week);
      expect(weekNums).toEqual([1, 2, 3, 4, 5]);
    });

    it('should merge semester metadata with last-writer-wins', () => {
      const theirsModified = {
        ...baseManifest,
        semester: { ...baseManifest.semester, schedule: 'MWF' }
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.mergeManifests(baseManifest, baseManifest, theirsModified);

      expect(result.merged.semester.schedule).toBe('MWF');
    });

    it('should handle theirs adding new weeks', () => {
      const theirsWithNew = {
        ...baseManifest,
        weeks: [
          ...baseManifest.weeks,
          { week: 6, title: 'New Week', status: 'draft' }
        ]
      };

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.mergeManifests(baseManifest, baseManifest, theirsWithNew);

      expect(result.merged.weeks).toHaveLength(6);
      expect(result.autoMerged).toContain(6);
    });
  });

  describe('writeMergedManifest', () => {
    it('should write manifest to file', () => {
      const targetPath = path.join(tmpDir, '.flow', 'merged.yml');
      const yamlContent = yaml.dump(baseManifest);

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.writeMergedManifest(targetPath, yamlContent);

      expect(result.success).toBe(true);
      expect(result.newHash).toBeDefined();
      expect(fs.existsSync(targetPath)).toBe(true);
    });

    it('should create backup of existing file', () => {
      const targetPath = path.join(tmpDir, 'existing.yml');
      fs.writeFileSync(targetPath, 'original: true\n', 'utf8');

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const result = engine.writeMergedManifest(targetPath, yaml.dump(baseManifest));

      expect(result.backupPath).toBeDefined();
      expect(fs.existsSync(result.backupPath)).toBe(true);
    });

    it('should respect dryRun', () => {
      const targetPath = path.join(tmpDir, 'dry-run.yml');

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir, dryRun: true });
      const result = engine.writeMergedManifest(targetPath, yaml.dump(baseManifest));

      expect(result.success).toBe(true);
      expect(result.newHash).toBeDefined();
      expect(fs.existsSync(targetPath)).toBe(false);
    });
  });

  describe('base hash storage', () => {
    it('should store and retrieve base hash', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      engine.storeBaseHash(tmpDir, 'abc123hash');

      const retrieved = engine.getBaseHash(tmpDir);
      expect(retrieved).toBe('abc123hash');
    });

    it('should return null for missing hash', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const hash = engine.getBaseHash(tmpDir);
      expect(hash).toBeNull();
    });

    it('should create cache directory if missing', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      engine.storeBaseHash(tmpDir, 'test');

      expect(fs.existsSync(path.join(tmpDir, '.scholar-cache'))).toBe(true);
    });

    it('should overwrite existing hash', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      engine.storeBaseHash(tmpDir, 'first');
      engine.storeBaseHash(tmpDir, 'second');

      expect(engine.getBaseHash(tmpDir)).toBe('second');
    });

    it('should fall back to this.courseRoot when courseRoot param omitted', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      engine.storeBaseHash(null, 'fallback-hash');

      expect(engine.getBaseHash(null)).toBe('fallback-hash');
    });
  });

  describe('base manifest snapshot storage', () => {
    it('should store and retrieve base manifest snapshot', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const manifestYaml = yaml.dump(baseManifest, { lineWidth: 120, noRefs: true });
      engine.storeBaseHash(tmpDir, 'hash123', manifestYaml);

      const retrieved = engine.getBaseManifest(tmpDir);
      expect(retrieved).toBeDefined();
      expect(retrieved.schema_version).toBe('1.0');
      expect(retrieved.weeks).toHaveLength(5);
      expect(retrieved.weeks[0].title).toBe('Descriptive Statistics');
    });

    it('should return null when no snapshot exists', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const manifest = engine.getBaseManifest(tmpDir);
      expect(manifest).toBeNull();
    });

    it('should not write snapshot when manifestYaml is omitted', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      engine.storeBaseHash(tmpDir, 'hash-only');

      const manifest = engine.getBaseManifest(tmpDir);
      expect(manifest).toBeNull();
      expect(engine.getBaseHash(tmpDir)).toBe('hash-only');
    });

    it('should overwrite existing snapshot', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const firstManifest = { ...baseManifest, schema_version: '1.0' };
      const secondManifest = { ...baseManifest, schema_version: '2.0' };

      engine.storeBaseHash(tmpDir, 'hash1', yaml.dump(firstManifest));
      engine.storeBaseHash(tmpDir, 'hash2', yaml.dump(secondManifest));

      const retrieved = engine.getBaseManifest(tmpDir);
      expect(retrieved.schema_version).toBe('2.0');
    });

    it('should fall back to this.courseRoot for getBaseManifest', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const manifestYaml = yaml.dump(baseManifest);
      engine.storeBaseHash(null, 'hash', manifestYaml);

      const retrieved = engine.getBaseManifest(null);
      expect(retrieved).toBeDefined();
      expect(retrieved.weeks).toHaveLength(5);
    });
  });

  describe('null/undefined input handling', () => {
    it('should handle null base in computeWeekDiff', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(null, baseManifest, baseManifest);

      // With null base, _indexWeeks returns empty map, so all weeks appear as new
      // from both ours and theirs (both modified relative to empty base)
      expect(diff).toBeDefined();
      expect(diff.conflicts).toBeDefined();
      expect(diff.oursChanged).toBeDefined();
      expect(diff.theirsChanged).toBeDefined();
      expect(diff.unchanged).toBeDefined();
    });

    it('should handle null ours in computeWeekDiff', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, null, baseManifest);

      // With null ours, _indexWeeks returns empty map for ours
      // All base weeks missing from ours → treated as deletions by ours
      expect(diff).toBeDefined();
      expect(diff.conflicts).toBeDefined();
      expect(diff.oursChanged).toBeDefined();
      expect(diff.theirsChanged).toBeDefined();
    });

    it('should handle null theirs in computeWeekDiff', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const diff = engine.computeWeekDiff(baseManifest, baseManifest, null);

      // With null theirs, _indexWeeks returns empty map for theirs
      // All base weeks missing from theirs → treated as deletions by theirs
      expect(diff).toBeDefined();
      expect(diff.conflicts).toBeDefined();
      expect(diff.oursChanged).toBeDefined();
      expect(diff.theirsChanged).toBeDefined();
    });

    it('should handle null ours in mergeManifests', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });

      // mergeManifests starts from ours, so null ours may throw or produce empty merge
      let threw = false;
      let result;
      try {
        result = engine.mergeManifests(null, null, baseManifest);
      } catch {
        threw = true;
      }

      // Either gracefully returns a result or throws - both are acceptable
      expect(threw || (result && result.success !== undefined)).toBe(true);
    });

    it('should report error for invalid YAML in loadSyncPair', () => {
      const oursPath = path.join(tmpDir, 'garbled-ours.yml');
      const theirsPath = path.join(tmpDir, 'valid-theirs.yml');

      // Write garbled content that will fail YAML parsing
      fs.writeFileSync(oursPath, '{{{{invalid: yaml: [[[broken', 'utf8');
      writeManifest(theirsPath, baseManifest);

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair(oursPath, theirsPath);

      expect(pair.errors.length).toBeGreaterThan(0);
      expect(pair.errors[0]).toContain('Failed to load ours');
      expect(pair.ours).toBeNull();
      // theirs should still load successfully
      expect(pair.theirs).toBeDefined();
      expect(pair.theirsHash).toBeDefined();
    });

    it('should report error for invalid YAML in theirs of loadSyncPair', () => {
      const oursPath = path.join(tmpDir, 'valid-ours.yml');
      const theirsPath = path.join(tmpDir, 'garbled-theirs.yml');

      writeManifest(oursPath, baseManifest);
      fs.writeFileSync(theirsPath, 'not: valid: yaml: ::::', 'utf8');

      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });
      const pair = engine.loadSyncPair(oursPath, theirsPath);

      expect(pair.errors.length).toBeGreaterThan(0);
      expect(pair.errors[0]).toContain('Failed to load theirs');
      expect(pair.theirs).toBeNull();
      // ours should still load successfully
      expect(pair.ours).toBeDefined();
      expect(pair.oursHash).toBeDefined();
    });
  });

  describe('end-to-end sync scenario', () => {
    it('should handle full sync workflow', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });

      // Step 1: Initial state - write both sides from same base
      const oursPath = path.join(tmpDir, '.flow', 'lesson-plans.yml');
      const theirsPath = path.join(tmpDir, '.flow', 'lesson-plans-theirs.yml');
      writeManifest(oursPath, baseManifest);
      writeManifest(theirsPath, baseManifest);

      // Store base hash and snapshot for three-way merge
      const baseYaml = yaml.dump(baseManifest, { lineWidth: 120, noRefs: true });
      const baseHash = sha256(baseYaml);
      engine.storeBaseHash(tmpDir, baseHash, baseYaml);

      // Step 2: Both sides make changes
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed' } : w
        )
      };
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 5 ? { ...w, title: 'Updated by flow-cli' } : w
        )
      };
      writeManifest(oursPath, oursModified);
      writeManifest(theirsPath, theirsModified);

      // Step 3: Load sync pair
      const pair = engine.loadSyncPair(oursPath, theirsPath);
      expect(pair.identical).toBe(false);

      // Step 4: Merge
      const result = engine.mergeManifests(baseManifest, pair.ours, pair.theirs);
      expect(result.success).toBe(true);
      expect(result.autoMerged).toContain(5);
      expect(result.conflicts).toHaveLength(0);

      // Step 5: Verify merged result
      const week3 = result.merged.weeks.find(w => w.week === 3);
      const week5 = result.merged.weeks.find(w => w.week === 5);
      expect(week3.status).toBe('reviewed');
      expect(week5.title).toBe('Updated by flow-cli');
    });

    it('should handle conflict scenario', () => {
      const engine = new ManifestSyncEngine({ courseRoot: tmpDir });

      // Both modify week 3
      const oursModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'reviewed', title: 'Scholar edit' } : w
        )
      };
      const theirsModified = {
        ...baseManifest,
        weeks: baseManifest.weeks.map(w =>
          w.week === 3 ? { ...w, status: 'published', title: 'Flow edit' } : w
        )
      };

      const result = engine.mergeManifests(baseManifest, oursModified, theirsModified);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].week).toBe(3);
      // Verify conflict resolution strategy is recorded
      expect(result.conflicts[0].resolution).toBe('ours');
      // Verify conflictingFields contains the fields that both sides changed
      expect(result.conflicts[0].conflictingFields).toContain('status');
      expect(result.conflicts[0].conflictingFields).toContain('title');
      // Default: ours wins - verify the merged result reflects ours strategy
      const week3 = result.merged.weeks.find(w => w.week === 3);
      expect(week3.status).toBe('reviewed');
      expect(week3.title).toBe('Scholar edit');
    });
  });
});
