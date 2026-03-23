/**
 * Integration Tests: Manifest-First, Directory-Fallback Discovery Chain
 *
 * Tests that loadLessonPlan, loadPreviousWeekContext, and listLessonPlans
 * check .flow/lesson-plans.yml manifest first, then fall back to
 * directory scanning (content/lesson-plans/weekNN.yml) when the manifest
 * doesn't exist or doesn't contain the requested week.
 */

import { describe, it, expect, afterEach } from '@jest/globals';
import { mkdirSync, writeFileSync, rmSync, copyFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import yaml from 'js-yaml';

import {
  loadLessonPlan,
  loadPreviousWeekContext,
  listLessonPlans
} from '../../src/teaching/utils/lesson-plan-loader.js';

const FIXTURES_DIR = join(process.cwd(), 'tests', 'teaching', 'fixtures');
const tempDirs = [];

function createTempCourse() {
  const dir = join(tmpdir(), `scholar-integration-test-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

/**
 * Copy the valid-manifest.yml fixture into .flow/lesson-plans.yml
 */
function installManifest(courseRoot) {
  const flowDir = join(courseRoot, '.flow');
  mkdirSync(flowDir, { recursive: true });
  const src = join(FIXTURES_DIR, 'valid-manifest.yml');
  const dest = join(flowDir, 'lesson-plans.yml');
  copyFileSync(src, dest);
  return dest;
}

/**
 * Create a directory-based week file under content/lesson-plans/
 */
function createWeekFile(courseRoot, weekNum, data) {
  const dir = join(courseRoot, 'content', 'lesson-plans');
  mkdirSync(dir, { recursive: true });
  const filename = `week${String(weekNum).padStart(2, '0')}.yml`;
  writeFileSync(join(dir, filename), yaml.dump(data), 'utf8');
}

afterEach(() => {
  for (const dir of tempDirs) {
    try { rmSync(dir, { recursive: true, force: true }); } catch (_e) { /* cleanup */ }
  }
  tempDirs.length = 0;
});

describe('loadLessonPlan - manifest integration', () => {
  it('should load week from manifest when .flow/lesson-plans.yml exists', () => {
    const courseRoot = createTempCourse();
    installManifest(courseRoot);

    const result = loadLessonPlan({ weekId: 'week01', courseRoot });

    expect(result.plan).toBeTruthy();
    expect(result.plan._source).toBe('manifest');
    expect(result.plan._manifestPath).toBeTruthy();
    expect(result.plan._manifestPath).toContain('lesson-plans.yml');
    expect(result.plan.title).toBe('Introduction to Regression');
    expect(result.extracted).toBeTruthy();
    expect(result.extracted.learning_objectives.length).toBeGreaterThan(0);
    expect(result.extracted.topics.length).toBeGreaterThan(0);
  });

  it('should return same shape from manifest as directory', () => {
    // Setup: course with BOTH manifest AND directory file for week 1
    const courseRoot = createTempCourse();
    installManifest(courseRoot);
    createWeekFile(courseRoot, 1, {
      week: 1,
      title: 'Directory Version - Should Not Win',
      learning_objectives: ['Directory LO'],
      topics: ['Directory Topic']
    });

    const result = loadLessonPlan({ weekId: 1, courseRoot });

    // Manifest should win (manifest-first policy)
    expect(result.plan._source).toBe('manifest');
    expect(result.plan.title).toBe('Introduction to Regression');

    // Verify returned shape has all expected keys
    expect(result).toHaveProperty('plan');
    expect(result).toHaveProperty('extracted');
    expect(result).toHaveProperty('validation');
    expect(result).toHaveProperty('source');

    // Extracted has expected sub-keys
    expect(result.extracted).toHaveProperty('title');
    expect(result.extracted).toHaveProperty('week');
    expect(result.extracted).toHaveProperty('learning_objectives');
    expect(result.extracted).toHaveProperty('topics');
    expect(result.extracted).toHaveProperty('materials');
    expect(result.extracted).toHaveProperty('activities');
    expect(result.extracted).toHaveProperty('lecture_structure');
    expect(result.extracted).toHaveProperty('teaching_style_overrides');

    // Validation has expected sub-keys
    expect(result.validation).toHaveProperty('isValid');
    expect(result.validation).toHaveProperty('errors');
    expect(result.validation).toHaveProperty('warnings');
  });

  it('should fall back to directory when manifest exists but week not in manifest', () => {
    // Manifest has weeks 1-3; directory has week 5
    const courseRoot = createTempCourse();
    installManifest(courseRoot);
    createWeekFile(courseRoot, 5, {
      week: 5,
      title: 'ANOVA Introduction',
      learning_objectives: ['Understand one-way ANOVA'],
      topics: ['One-way ANOVA']
    });

    const result = loadLessonPlan({ weekId: 5, courseRoot });

    expect(result.plan).toBeTruthy();
    // Directory load attaches _source as an object with a file key
    expect(result.plan._source).toHaveProperty('file');
    expect(result.plan._source.file).toContain('week05.yml');
    expect(result.plan.title).toBe('ANOVA Introduction');
  });

  it('should fall back to directory when no manifest exists', () => {
    const courseRoot = createTempCourse();
    // No .flow/lesson-plans.yml -- only directory files
    createWeekFile(courseRoot, 1, {
      week: 1,
      title: 'Directory Only Week',
      learning_objectives: ['Learn from directory'],
      topics: ['Directory Topic']
    });

    const result = loadLessonPlan({ weekId: 'week01', courseRoot });

    expect(result.plan).toBeTruthy();
    expect(result.plan._source).toHaveProperty('file');
    expect(result.plan._source.file).toContain('week01.yml');
    expect(result.plan.title).toBe('Directory Only Week');
  });

  it('should return null plan when neither manifest nor directory has the week', () => {
    const courseRoot = createTempCourse();
    installManifest(courseRoot);
    // Manifest has weeks 1-3; no directory files; ask for week 99

    const result = loadLessonPlan({ weekId: 99, courseRoot });

    expect(result.plan).toBeNull();
    expect(result.extracted).toBeNull();
    expect(result.validation.isValid).toBe(false);
  });
});

describe('loadPreviousWeekContext - manifest integration', () => {
  it('should load previous weeks from manifest', () => {
    const courseRoot = createTempCourse();
    installManifest(courseRoot);

    // Manifest has weeks 1, 2, 3 -- request context for week 3, count 2
    const contexts = loadPreviousWeekContext({ weekId: 3, courseRoot, count: 2 });

    expect(contexts).toHaveLength(2);

    // Returned in chronological order (oldest first): week 1, then week 2
    expect(contexts[0].week).toBe(1);
    expect(contexts[1].week).toBe(2);

    // Each entry has required shape
    for (const ctx of contexts) {
      expect(ctx).toHaveProperty('week');
      expect(ctx).toHaveProperty('topic');
      expect(ctx).toHaveProperty('objectives');
      expect(ctx).toHaveProperty('keyConcepts');
      expect(ctx).toHaveProperty('summary');
    }

    // Week 1 content should match manifest fixture
    expect(contexts[0].topic).toBe('Introduction to Regression');
    // Week 2 content should match manifest fixture
    expect(contexts[1].topic).toBe('Multiple Regression');
  });

  it('should fall back to directory when no manifest', () => {
    const courseRoot = createTempCourse();
    // No manifest -- only directory files
    createWeekFile(courseRoot, 1, {
      week: 1,
      title: 'Dir Week 1',
      learning_objectives: ['LO from dir 1'],
      topics: [{ name: 'Dir Topic 1' }]
    });
    createWeekFile(courseRoot, 2, {
      week: 2,
      title: 'Dir Week 2',
      learning_objectives: ['LO from dir 2'],
      topics: [{ name: 'Dir Topic 2' }]
    });
    createWeekFile(courseRoot, 3, {
      week: 3,
      title: 'Dir Week 3',
      learning_objectives: ['LO from dir 3'],
      topics: [{ name: 'Dir Topic 3' }]
    });

    const contexts = loadPreviousWeekContext({ weekId: 3, courseRoot, count: 2 });

    expect(contexts).toHaveLength(2);
    // Chronological order
    expect(contexts[0].week).toBe(1);
    expect(contexts[1].week).toBe(2);
    expect(contexts[0].topic).toBe('Dir Week 1');
    expect(contexts[1].topic).toBe('Dir Week 2');
  });
});

describe('listLessonPlans - manifest integration', () => {
  it('should list all plans from manifest', () => {
    const courseRoot = createTempCourse();
    installManifest(courseRoot);

    const plans = listLessonPlans(courseRoot);

    expect(plans).toHaveLength(3);
    expect(plans[0].week).toBe(1);
    expect(plans[1].week).toBe(2);
    expect(plans[2].week).toBe(3);

    // Each entry comes from manifest
    for (const plan of plans) {
      expect(plan._source).toBe('manifest');
      expect(plan).toHaveProperty('title');
      expect(plan).toHaveProperty('has_objectives');
      expect(plan).toHaveProperty('topics_count');
      expect(plan).toHaveProperty('status');
    }
  });

  it('should include status field from manifest', () => {
    const courseRoot = createTempCourse();
    installManifest(courseRoot);

    const plans = listLessonPlans(courseRoot);

    // valid-manifest.yml: week 1 = published, weeks 2-3 = draft
    const week1 = plans.find(p => p.week === 1);
    const week2 = plans.find(p => p.week === 2);
    const week3 = plans.find(p => p.week === 3);

    expect(week1.status).toBe('published');
    expect(week2.status).toBe('draft');
    expect(week3.status).toBe('draft');
  });

  it('should fall back to directory listing when no manifest', () => {
    const courseRoot = createTempCourse();
    // No manifest -- only directory files
    createWeekFile(courseRoot, 1, {
      week: 1,
      title: 'Dir Week 1',
      learning_objectives: ['LO1'],
      topics: ['Topic1']
    });
    createWeekFile(courseRoot, 2, {
      week: 2,
      title: 'Dir Week 2',
      learning_objectives: ['LO2'],
      topics: ['Topic2']
    });

    const plans = listLessonPlans(courseRoot);

    expect(plans).toHaveLength(2);
    expect(plans[0].week).toBe(1);
    expect(plans[1].week).toBe(2);

    // Directory entries do not have _source: 'manifest'
    for (const plan of plans) {
      expect(plan._source).not.toBe('manifest');
      expect(plan).toHaveProperty('file');
      expect(plan.file).toBeTruthy();
    }
  });
});
