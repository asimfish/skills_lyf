/**
 * Tests for Manifest Loader
 *
 * Tests the manifest-loader module that discovers, loads, validates,
 * and updates `.flow/lesson-plans.yml` manifest files for the
 * config-flow-integration feature.
 *
 * Functions under test:
 *   findManifest, loadManifest, getManifestHash,
 *   updateWeekStatus, getSemesterInfo, extractWeekFromManifest
 */

import { describe, it, expect, afterEach } from '@jest/globals';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import yaml from 'js-yaml';

import {
  findManifest,
  loadManifest,
  getManifestHash,
  updateWeekStatus,
  getSemesterInfo,
  extractWeekFromManifest,
} from '../../src/teaching/utils/manifest-loader.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIXTURES_DIR = join(
  process.cwd(),
  'tests',
  'teaching',
  'fixtures'
);

/**
 * Create a temporary course directory with an optional manifest fixture
 * copied into `.flow/lesson-plans.yml`.
 *
 * @param {string|null} manifestFixture - Absolute path to a fixture file, or null for empty course
 * @returns {string} Absolute path to the temporary course root
 */
function createTempCourse(manifestFixture) {
  const tmpDir = mkdtempSync(join(tmpdir(), 'scholar-manifest-test-'));
  const flowDir = join(tmpDir, '.flow');
  mkdirSync(flowDir, { recursive: true });

  if (manifestFixture) {
    const fixtureContent = readFileSync(manifestFixture, 'utf8');
    writeFileSync(join(flowDir, 'lesson-plans.yml'), fixtureContent);
  }

  return tmpDir;
}

// Keep track of all temp dirs so afterEach can clean them up
const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  tempDirs.length = 0;
});

/**
 * Wrapper around createTempCourse that registers the directory for cleanup.
 */
function makeCourse(fixture) {
  const dir = createTempCourse(fixture);
  tempDirs.push(dir);
  return dir;
}

// ---------------------------------------------------------------------------
// findManifest
// ---------------------------------------------------------------------------

describe('findManifest', () => {
  it('should return path when .flow/lesson-plans.yml exists', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const result = findManifest(courseRoot);

    expect(result).toBe(join(courseRoot, '.flow', 'lesson-plans.yml'));
  });

  it('should return null when no manifest exists', () => {
    const courseRoot = makeCourse(null); // empty .flow directory
    const result = findManifest(courseRoot);

    expect(result).toBeNull();
  });

  it('should return null when courseRoot is null', () => {
    expect(findManifest(null)).toBeNull();
  });

  it('should return null when courseRoot is undefined', () => {
    expect(findManifest(undefined)).toBeNull();
  });

  it('should return null when courseRoot does not exist', () => {
    const result = findManifest('/tmp/nonexistent-course-dir-999999');

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// loadManifest
// ---------------------------------------------------------------------------

describe('loadManifest', () => {
  it('should load and validate a valid manifest', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const result = loadManifest(courseRoot);

    expect(result.manifest).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.manifest.schema_version).toBe('1.0');
    expect(result.manifest.semester).toBeDefined();
  });

  it('should load minimal manifest successfully', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'minimal-manifest.yml'));
    const result = loadManifest(courseRoot);

    expect(result.manifest).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.manifest.weeks).toHaveLength(1);
  });

  it('should return errors for invalid manifest (missing required fields)', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'invalid-manifest.yml'));
    const result = loadManifest(courseRoot, { validate: true });

    expect(result.errors.length).toBeGreaterThan(0);
    const errorText = result.errors.join(' ');
    // Should flag missing schema_version or semester
    expect(
      errorText.toLowerCase().includes('schema_version') ||
        errorText.toLowerCase().includes('semester') ||
        errorText.toLowerCase().includes('required')
    ).toBe(true);
  });

  it('should return errors for malformed manifest (bad values)', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'malformed-manifest.yml'));
    const result = loadManifest(courseRoot, { validate: true });

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return errors when no manifest found', () => {
    const courseRoot = makeCourse(null);
    const result = loadManifest(courseRoot);

    expect(result.manifest).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/not found|no manifest/i);
  });

  it('should return manifest without validation when validate=false', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'malformed-manifest.yml'));
    const result = loadManifest(courseRoot, { validate: false });

    // Even though the manifest has bad values, skipping validation
    // means we still get a manifest object back with no validation errors.
    expect(result.manifest).toBeDefined();
    expect(result.errors).toHaveLength(0);
  });

  it('should add _hash, _path, _loadedAt metadata fields', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const result = loadManifest(courseRoot);

    expect(result.manifest._hash).toBeDefined();
    expect(typeof result.manifest._hash).toBe('string');
    expect(result.manifest._hash.length).toBeGreaterThan(0);

    expect(result.manifest._path).toBeDefined();
    expect(result.manifest._path).toContain('lesson-plans.yml');

    expect(result.manifest._loadedAt).toBeDefined();
  });

  it('should parse all 3 weeks from valid fixture', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const result = loadManifest(courseRoot);

    expect(result.manifest.weeks).toHaveLength(3);
    expect(result.manifest.weeks[0].week).toBe(1);
    expect(result.manifest.weeks[1].week).toBe(2);
    expect(result.manifest.weeks[2].week).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getManifestHash
// ---------------------------------------------------------------------------

describe('getManifestHash', () => {
  it('should return SHA-256 hex string for existing manifest', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const hash = getManifestHash(courseRoot);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    // SHA-256 hex is 64 characters
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return consistent hash for same content', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const hash1 = getManifestHash(courseRoot);
    const hash2 = getManifestHash(courseRoot);

    expect(hash1).toBe(hash2);
  });

  it('should return different hash for different content', () => {
    const courseRoot1 = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const courseRoot2 = makeCourse(join(FIXTURES_DIR, 'minimal-manifest.yml'));

    const hash1 = getManifestHash(courseRoot1);
    const hash2 = getManifestHash(courseRoot2);

    expect(hash1).not.toBe(hash2);
  });

  it('should return null when no manifest exists', () => {
    const courseRoot = makeCourse(null);
    const hash = getManifestHash(courseRoot);

    expect(hash).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateWeekStatus
// ---------------------------------------------------------------------------

describe('updateWeekStatus', () => {
  it('should update status from draft to generated', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));

    // Week 2 starts as "draft" in the valid-manifest fixture
    const result = updateWeekStatus(courseRoot, 2, 'generated');

    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe('draft');
    expect(result.newStatus).toBe('generated');

    // Verify the file was actually written
    const raw = readFileSync(
      join(courseRoot, '.flow', 'lesson-plans.yml'),
      'utf8'
    );
    const updated = yaml.load(raw);
    const week2 = updated.weeks.find((w) => w.week === 2);
    expect(week2.status).toBe('generated');
  });

  it('should create .bak backup before writing', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));

    updateWeekStatus(courseRoot, 2, 'generated');

    const bakPath = join(courseRoot, '.flow', 'lesson-plans.yml.bak');
    expect(existsSync(bakPath)).toBe(true);

    // Backup should contain the original content (week 2 still "draft")
    const bakContent = yaml.load(readFileSync(bakPath, 'utf8'));
    const week2Bak = bakContent.weeks.find((w) => w.week === 2);
    expect(week2Bak.status).toBe('draft');
  });

  it('should return previous and new status', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const result = updateWeekStatus(courseRoot, 1, 'generated');

    expect(result).toHaveProperty('previousStatus');
    expect(result).toHaveProperty('newStatus');
    expect(result.previousStatus).toBe('published');
    expect(result.newStatus).toBe('generated');
  });

  it('should fail gracefully when week not found', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const result = updateWeekStatus(courseRoot, 99, 'generated');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found|week 99/i);
  });

  it('should fail gracefully when invalid status provided', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const result = updateWeekStatus(courseRoot, 1, 'banana');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid|status/i);
  });

  it('should skip backup when backup=false', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));

    updateWeekStatus(courseRoot, 2, 'generated', { backup: false });

    const bakPath = join(courseRoot, '.flow', 'lesson-plans.yml.bak');
    expect(existsSync(bakPath)).toBe(false);
  });

  it('should preserve other fields when updating status', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));

    updateWeekStatus(courseRoot, 1, 'generated');

    const raw = readFileSync(
      join(courseRoot, '.flow', 'lesson-plans.yml'),
      'utf8'
    );
    const updated = yaml.load(raw);
    const week1 = updated.weeks.find((w) => w.week === 1);

    // Title and other data from the fixture should remain intact
    expect(week1.title).toBe('Introduction to Regression');
    expect(week1.learning_objectives).toBeDefined();
    expect(week1.topics).toBeDefined();

    // schema_version and semester should be untouched
    expect(updated.schema_version).toBe('1.0');
    expect(updated.semester.total_weeks).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// getSemesterInfo
// ---------------------------------------------------------------------------

describe('getSemesterInfo', () => {
  it('should return semester metadata from valid manifest', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const info = getSemesterInfo(courseRoot);

    expect(info).toBeDefined();
    expect(info).not.toBeNull();
  });

  it('should return null when no manifest found', () => {
    const courseRoot = makeCourse(null);
    const info = getSemesterInfo(courseRoot);

    expect(info).toBeNull();
  });

  it('should include total_weeks from semester', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const info = getSemesterInfo(courseRoot);

    expect(info.total_weeks).toBe(15);
  });

  it('should include schedule from semester', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const info = getSemesterInfo(courseRoot);

    expect(info.schedule).toBe('TR');
  });

  it('should include milestones from semester', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const info = getSemesterInfo(courseRoot);

    expect(info.milestones).toBeDefined();
    expect(Array.isArray(info.milestones)).toBe(true);
    expect(info.milestones.length).toBe(3);
  });

  it('should include weekCount derived from weeks array', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const info = getSemesterInfo(courseRoot);

    expect(info.weekCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// extractWeekFromManifest
// ---------------------------------------------------------------------------

describe('extractWeekFromManifest', () => {
  it('should find week by number', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const { manifest } = loadManifest(courseRoot);

    const week = extractWeekFromManifest(manifest, 2);

    expect(week).toBeDefined();
    expect(week.week).toBe(2);
    expect(week.title).toBe('Multiple Regression');
  });

  it('should return first week when weekId is 1', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const { manifest } = loadManifest(courseRoot);

    const week = extractWeekFromManifest(manifest, 1);

    expect(week).toBeDefined();
    expect(week.week).toBe(1);
    expect(week.title).toBe('Introduction to Regression');
  });

  it('should return null for non-existent week', () => {
    const courseRoot = makeCourse(join(FIXTURES_DIR, 'valid-manifest.yml'));
    const { manifest } = loadManifest(courseRoot);

    const week = extractWeekFromManifest(manifest, 42);

    expect(week).toBeNull();
  });

  it('should return null for null manifest', () => {
    const week = extractWeekFromManifest(null, 1);

    expect(week).toBeNull();
  });

  it('should return null for undefined manifest', () => {
    const week = extractWeekFromManifest(undefined, 1);

    expect(week).toBeNull();
  });

  it('should return null for manifest without weeks array', () => {
    const week = extractWeekFromManifest({ schema_version: '1.0' }, 1);

    expect(week).toBeNull();
  });
});
