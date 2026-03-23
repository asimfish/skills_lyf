/**
 * Tests for Lesson Plan Loader
 *
 * Tests the --from-plan integration for loading and parsing
 * lesson plan YAML files.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  findLessonPlansDir,
  parseWeekId,
  formatWeekFilename,
  findLessonPlanFile,
  loadLessonPlanFile,
  extractLearningObjectives,
  extractTopics,
  extractMaterials,
  extractActivities,
  extractLectureStructure,
  extractTeachingStyleOverrides,
  validateLessonPlan,
  loadLessonPlan,
  listLessonPlans,
  getLessonPlanSummary
} from '../../src/teaching/utils/lesson-plan-loader.js';

describe('Lesson Plan Loader', () => {
  let testDir;
  let courseRoot;
  let plansDir;

  beforeEach(() => {
    // Create test directory structure
    testDir = join(tmpdir(), `lesson-plan-test-${Date.now()}`);
    courseRoot = join(testDir, 'course');
    plansDir = join(courseRoot, 'content', 'lesson-plans');
    mkdirSync(plansDir, { recursive: true });
    mkdirSync(join(courseRoot, '.claude'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('parseWeekId', () => {
    it('should parse "week03" format', () => {
      expect(parseWeekId('week03')).toBe(3);
    });

    it('should parse "week-03" format', () => {
      expect(parseWeekId('week-03')).toBe(3);
    });

    it('should parse "week_03" format', () => {
      expect(parseWeekId('week_03')).toBe(3);
    });

    it('should parse "w03" format', () => {
      expect(parseWeekId('w03')).toBe(3);
    });

    it('should parse "03" format', () => {
      expect(parseWeekId('03')).toBe(3);
    });

    it('should parse "3" format', () => {
      expect(parseWeekId('3')).toBe(3);
    });

    it('should parse numeric input', () => {
      expect(parseWeekId(5)).toBe(5);
    });

    it('should return null for invalid input', () => {
      expect(parseWeekId('invalid')).toBeNull();
      expect(parseWeekId('')).toBeNull();
      expect(parseWeekId(null)).toBeNull();
      expect(parseWeekId(0)).toBeNull();
      expect(parseWeekId(-1)).toBeNull();
    });

    it('should handle case insensitivity', () => {
      expect(parseWeekId('WEEK03')).toBe(3);
      expect(parseWeekId('Week03')).toBe(3);
    });
  });

  describe('formatWeekFilename', () => {
    it('should format single digit weeks', () => {
      expect(formatWeekFilename(3)).toBe('week03.yml');
    });

    it('should format double digit weeks', () => {
      expect(formatWeekFilename(12)).toBe('week12.yml');
    });
  });

  describe('findLessonPlansDir', () => {
    it('should find content/lesson-plans directory', () => {
      const result = findLessonPlansDir(courseRoot);

      expect(result).toBe(plansDir);
    });

    it('should find lesson-plans directory at root', () => {
      rmSync(plansDir, { recursive: true, force: true });
      const altPlansDir = join(courseRoot, 'lesson-plans');
      mkdirSync(altPlansDir, { recursive: true });

      const result = findLessonPlansDir(courseRoot);

      expect(result).toBe(altPlansDir);
    });

    it('should return null if no plans directory', () => {
      rmSync(plansDir, { recursive: true, force: true });

      const result = findLessonPlansDir(courseRoot);

      expect(result).toBeNull();
    });
  });

  describe('findLessonPlanFile', () => {
    it('should find week03.yml file', () => {
      writeFileSync(join(plansDir, 'week03.yml'), 'week: 3');

      const result = findLessonPlanFile(plansDir, 'week03');

      expect(result).toBe(join(plansDir, 'week03.yml'));
    });

    it('should find file by numeric week ID', () => {
      writeFileSync(join(plansDir, 'week03.yml'), 'week: 3');

      const result = findLessonPlanFile(plansDir, 3);

      expect(result).toBe(join(plansDir, 'week03.yml'));
    });

    it('should find file with alternate naming', () => {
      writeFileSync(join(plansDir, 'week-05.yml'), 'week: 5');

      const result = findLessonPlanFile(plansDir, 5);

      expect(result).toBe(join(plansDir, 'week-05.yml'));
    });

    it('should return null for non-existent week', () => {
      const result = findLessonPlanFile(plansDir, 99);

      expect(result).toBeNull();
    });
  });

  describe('loadLessonPlanFile', () => {
    it('should load and parse valid YAML file', () => {
      const planContent = `
week: 3
title: Multiple Regression
learning_objectives:
  - Understand regression coefficients
  - Apply R for regression analysis
`;
      writeFileSync(join(plansDir, 'week03.yml'), planContent);

      const plan = loadLessonPlanFile(join(plansDir, 'week03.yml'));

      expect(plan.week).toBe(3);
      expect(plan.title).toBe('Multiple Regression');
      expect(plan.learning_objectives).toHaveLength(2);
    });

    it('should return null for non-existent file', () => {
      const result = loadLessonPlanFile('/nonexistent/file.yml');

      expect(result).toBeNull();
    });

    it('should return null for invalid YAML', () => {
      writeFileSync(join(plansDir, 'invalid.yml'), '{{invalid yaml');

      const result = loadLessonPlanFile(join(plansDir, 'invalid.yml'));

      expect(result).toBeNull();
    });

    it('should add source info to loaded plan', () => {
      writeFileSync(join(plansDir, 'week03.yml'), 'week: 3');

      const plan = loadLessonPlanFile(join(plansDir, 'week03.yml'));

      expect(plan._source).toHaveProperty('file');
      expect(plan._source).toHaveProperty('filename');
      expect(plan._source.filename).toBe('week03.yml');
    });
  });

  describe('extractLearningObjectives', () => {
    it('should extract simple string objectives', () => {
      const plan = {
        learning_objectives: [
          'Understand concepts',
          'Apply techniques'
        ]
      };

      const objectives = extractLearningObjectives(plan);

      expect(objectives).toEqual(['Understand concepts', 'Apply techniques']);
    });

    it('should extract objectives from objects with description', () => {
      const plan = {
        learning_objectives: [
          { id: 'LO-1', description: 'Understand concepts' },
          { id: 'LO-2', description: 'Apply techniques' }
        ]
      };

      const objectives = extractLearningObjectives(plan);

      expect(objectives).toEqual(['Understand concepts', 'Apply techniques']);
    });

    it('should handle mixed formats', () => {
      const plan = {
        learning_objectives: [
          'Simple objective',
          { description: 'Complex objective' },
          { text: 'Text-based objective' }
        ]
      };

      const objectives = extractLearningObjectives(plan);

      expect(objectives).toHaveLength(3);
    });

    it('should return empty array for missing objectives', () => {
      const plan = {};

      const objectives = extractLearningObjectives(plan);

      expect(objectives).toEqual([]);
    });
  });

  describe('extractTopics', () => {
    it('should extract simple string topics', () => {
      const plan = {
        topics: ['Topic A', 'Topic B']
      };

      const topics = extractTopics(plan);

      expect(topics).toHaveLength(2);
      expect(topics[0].name).toBe('Topic A');
    });

    it('should extract topics with subtopics', () => {
      const plan = {
        topics: [
          {
            id: 'T-1',
            name: 'Main Topic',
            subtopics: ['Subtopic 1', 'Subtopic 2']
          }
        ]
      };

      const topics = extractTopics(plan);

      expect(topics[0].name).toBe('Main Topic');
      expect(topics[0].subtopics).toHaveLength(2);
    });

    it('should extract prerequisites', () => {
      const plan = {
        topics: [
          {
            name: 'Advanced Topic',
            prerequisites: ['T-1', 'T-2']
          }
        ]
      };

      const topics = extractTopics(plan);

      expect(topics[0].prerequisites).toEqual(['T-1', 'T-2']);
    });
  });

  describe('extractMaterials', () => {
    it('should extract readings, datasets, and software', () => {
      const plan = {
        materials: {
          readings: [{ title: 'Textbook Ch 3' }],
          datasets: [{ name: 'sample-data' }],
          software: [{ name: 'R', version: '4.0' }]
        }
      };

      const materials = extractMaterials(plan);

      expect(materials.readings).toHaveLength(1);
      expect(materials.datasets).toHaveLength(1);
      expect(materials.software).toHaveLength(1);
    });

    it('should return empty arrays for missing sections', () => {
      const plan = {};

      const materials = extractMaterials(plan);

      expect(materials.readings).toEqual([]);
      expect(materials.datasets).toEqual([]);
      expect(materials.software).toEqual([]);
    });
  });

  describe('extractActivities', () => {
    it('should extract activity details', () => {
      const plan = {
        activities: [
          {
            id: 'A-1',
            type: 'in-class-practice',
            title: 'Group Work',
            duration_minutes: 25,
            description: 'Work in pairs'
          }
        ]
      };

      const activities = extractActivities(plan);

      expect(activities).toHaveLength(1);
      expect(activities[0].id).toBe('A-1');
      expect(activities[0].type).toBe('in-class-practice');
      expect(activities[0].duration_minutes).toBe(25);
    });
  });

  describe('extractLectureStructure', () => {
    it('should extract lecture segments', () => {
      const plan = {
        lecture_structure: [
          { segment: 'review', duration_minutes: 5, content: 'Review' },
          { segment: 'lecture', duration_minutes: 30, content: 'Main' }
        ]
      };

      const structure = extractLectureStructure(plan);

      expect(structure).toHaveLength(2);
      expect(structure[0].segment).toBe('review');
      expect(structure[1].duration_minutes).toBe(30);
    });
  });

  describe('extractTeachingStyleOverrides', () => {
    it('should extract teaching style overrides', () => {
      const plan = {
        teaching_style_overrides: {
          explanation_style: { formality: 'conversational' }
        }
      };

      const overrides = extractTeachingStyleOverrides(plan);

      expect(overrides.explanation_style.formality).toBe('conversational');
    });

    it('should return null if no overrides', () => {
      const plan = {};

      const overrides = extractTeachingStyleOverrides(plan);

      expect(overrides).toBeNull();
    });
  });

  describe('validateLessonPlan', () => {
    it('should validate valid plan', () => {
      const plan = {
        week: 3,
        title: 'Test',
        learning_objectives: ['LO1'],
        topics: ['T1']
      };

      const result = validateLessonPlan(plan);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about missing objectives', () => {
      const plan = { week: 3, topics: ['T1'] };

      const result = validateLessonPlan(plan);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('no learning_objectives')
      );
    });

    it('should warn about missing topics', () => {
      const plan = { week: 3, learning_objectives: ['LO1'] };

      const result = validateLessonPlan(plan);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('no topics')
      );
    });

    it('should validate Bloom taxonomy levels', () => {
      const plan = {
        week: 3,
        learning_objectives: [
          { level: 'understand', description: 'Valid' },
          { level: 'invalid-level', description: 'Invalid' }
        ]
      };

      const result = validateLessonPlan(plan);

      expect(result.warnings).toContainEqual(
        expect.stringContaining("Unknown Bloom's taxonomy level")
      );
    });

    it('should error on non-object input', () => {
      const result = validateLessonPlan(null);

      expect(result.isValid).toBe(false);
    });
  });

  describe('loadLessonPlan', () => {
    it('should load lesson plan by week ID', () => {
      const planContent = `
week: 3
title: Multiple Regression
learning_objectives:
  - id: LO-1
    description: Understand regression
topics:
  - name: Regression basics
`;
      writeFileSync(join(plansDir, 'week03.yml'), planContent);

      const result = loadLessonPlan({
        weekId: 'week03',
        courseRoot: courseRoot
      });

      expect(result.plan).toBeTruthy();
      expect(result.extracted.week).toBe(3);
      expect(result.extracted.title).toBe('Multiple Regression');
      expect(result.extracted.learning_objectives).toHaveLength(1);
      expect(result.source).toContain('week03.yml');
    });

    it('should return error for non-existent week', () => {
      const result = loadLessonPlan({
        weekId: 'week99',
        courseRoot: courseRoot
      });

      expect(result.plan).toBeNull();
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors[0]).toContain('not found');
    });

    it('should handle numeric week IDs', () => {
      writeFileSync(join(plansDir, 'week05.yml'), 'week: 5\ntitle: Week 5');

      const result = loadLessonPlan({
        weekId: 5,
        courseRoot: courseRoot
      });

      expect(result.plan).toBeTruthy();
      expect(result.extracted.week).toBe(5);
    });

    it('should extract teaching style overrides', () => {
      const planContent = `
week: 3
title: Test
teaching_style_overrides:
  explanation_style:
    formality: engaging
`;
      writeFileSync(join(plansDir, 'week03.yml'), planContent);

      const result = loadLessonPlan({
        weekId: 3,
        courseRoot: courseRoot
      });

      expect(result.extracted.teaching_style_overrides).toBeTruthy();
      expect(result.extracted.teaching_style_overrides.explanation_style.formality)
        .toBe('engaging');
    });
  });

  describe('listLessonPlans', () => {
    it('should list all available lesson plans', () => {
      writeFileSync(join(plansDir, 'week01.yml'), 'week: 1\ntitle: Week 1');
      writeFileSync(join(plansDir, 'week02.yml'), 'week: 2\ntitle: Week 2');
      writeFileSync(join(plansDir, 'week03.yml'), 'week: 3\ntitle: Week 3');

      const plans = listLessonPlans(courseRoot);

      expect(plans).toHaveLength(3);
      expect(plans[0].week).toBe(1);
      expect(plans[1].week).toBe(2);
      expect(plans[2].week).toBe(3);
    });

    it('should include plan metadata', () => {
      const planContent = `
week: 3
title: Multiple Regression
learning_objectives:
  - LO1
  - LO2
topics:
  - T1
  - T2
  - T3
`;
      writeFileSync(join(plansDir, 'week03.yml'), planContent);

      const plans = listLessonPlans(courseRoot);

      expect(plans[0].title).toBe('Multiple Regression');
      expect(plans[0].has_objectives).toBe(true);
      expect(plans[0].topics_count).toBe(3);
    });

    it('should return empty array if no plans', () => {
      rmSync(plansDir, { recursive: true, force: true });

      const plans = listLessonPlans(courseRoot);

      expect(plans).toEqual([]);
    });
  });

  describe('getLessonPlanSummary', () => {
    it('should generate summary for loaded plan', () => {
      const planContent = `
week: 3
title: Multiple Regression
learning_objectives:
  - LO1
  - LO2
topics:
  - T1
`;
      writeFileSync(join(plansDir, 'week03.yml'), planContent);

      const loadResult = loadLessonPlan({
        weekId: 3,
        courseRoot: courseRoot
      });
      const summary = getLessonPlanSummary(loadResult);

      expect(summary).toContain('Multiple Regression');
      expect(summary).toContain('Week: 3');
      expect(summary).toContain('Learning Objectives: 2');
      expect(summary).toContain('Topics: 1');
    });

    it('should handle null plan', () => {
      const result = loadLessonPlan({
        weekId: 99,
        courseRoot: courseRoot
      });
      const summary = getLessonPlanSummary(result);

      expect(summary).toBe('No lesson plan loaded');
    });

    it('should include activities count when present', () => {
      const planContent = `
week: 3
title: Test Plan
learning_objectives:
  - LO1
topics:
  - T1
activities:
  - id: A1
    type: practice
    title: Activity 1
`;
      writeFileSync(join(plansDir, 'week03.yml'), planContent);

      const loadResult = loadLessonPlan({
        weekId: 3,
        courseRoot: courseRoot
      });
      const summary = getLessonPlanSummary(loadResult);

      expect(summary).toContain('Activities: 1');
    });
  });

  describe('Edge Cases and Error Paths', () => {
    it('should handle YAML file with no week number', () => {
      writeFileSync(join(plansDir, 'week05.yml'), 'title: No Week Number');

      const result = loadLessonPlan({
        weekId: 5,
        courseRoot: courseRoot
      });

      expect(result.extracted.week).toBe(5);  // Derived from weekId
    });

    it('should handle empty learning_objectives array', () => {
      const plan = {
        week: 3,
        learning_objectives: []
      };

      const result = validateLessonPlan(plan);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('empty')
      );
    });

    it('should handle empty topics array', () => {
      const plan = {
        week: 3,
        topics: []
      };

      const result = validateLessonPlan(plan);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('empty')
      );
    });

    it('should extract objectives with text field', () => {
      const plan = {
        learning_objectives: [
          { text: 'Text objective' },
          { objective: 'Objective field' }
        ]
      };

      const objectives = extractLearningObjectives(plan);
      expect(objectives).toContain('Text objective');
      expect(objectives).toContain('Objective field');
    });

    it('should handle topics with title instead of name', () => {
      const plan = {
        topics: [
          { title: 'Topic with title' }
        ]
      };

      const topics = extractTopics(plan);
      expect(topics[0].name).toBe('Topic with title');
    });

    it('should handle activities with missing fields', () => {
      const plan = {
        activities: [
          { id: 'A1' },  // Missing most fields
          {}  // Empty object
        ]
      };

      const activities = extractActivities(plan);
      expect(activities).toHaveLength(2);
      expect(activities[0].id).toBe('A1');
      expect(activities[1].type).toBe('unknown');
    });

    it('should handle lecture_structure with type instead of segment', () => {
      const plan = {
        lecture_structure: [
          { type: 'intro', duration_minutes: 10 }
        ]
      };

      const structure = extractLectureStructure(plan);
      expect(structure[0].segment).toBe('intro');
    });

    it('should handle non-standard week filename patterns', () => {
      writeFileSync(join(plansDir, 'week07.yml'), 'week: 7');

      const result = findLessonPlanFile(plansDir, 7);
      expect(result).toContain('week07.yml');
    });

    it('should skip non-YAML files in listLessonPlans', () => {
      writeFileSync(join(plansDir, 'week01.yml'), 'week: 1\ntitle: Week 1');
      writeFileSync(join(plansDir, 'README.md'), '# Readme');
      writeFileSync(join(plansDir, 'notes.txt'), 'Some notes');

      const plans = listLessonPlans(courseRoot);
      expect(plans).toHaveLength(1);
      expect(plans[0].week).toBe(1);
    });

    it('should handle plan without week but with title', () => {
      const plan = {
        title: 'Just a Title'
      };

      const result = validateLessonPlan(plan);
      expect(result.isValid).toBe(true);  // Warning but not error
    });

    it('should validate all valid Bloom levels', () => {
      const plan = {
        week: 1,
        learning_objectives: [
          { level: 'remember', description: 'LO1' },
          { level: 'understand', description: 'LO2' },
          { level: 'apply', description: 'LO3' },
          { level: 'analyze', description: 'LO4' },
          { level: 'evaluate', description: 'LO5' },
          { level: 'create', description: 'LO6' }
        ]
      };

      const result = validateLessonPlan(plan);
      const bloomWarnings = result.warnings.filter(w => w.includes('Bloom'));
      expect(bloomWarnings).toHaveLength(0);
    });

    it('should handle case-insensitive Bloom levels', () => {
      const plan = {
        week: 1,
        learning_objectives: [
          { level: 'UNDERSTAND', description: 'LO1' },
          { level: 'Apply', description: 'LO2' }
        ]
      };

      const result = validateLessonPlan(plan);
      const bloomWarnings = result.warnings.filter(w => w.includes('Bloom'));
      expect(bloomWarnings).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should load complete IEEE LOM compliant lesson plan', () => {
      const fullPlan = `
week: 3
date_range:
  start: "2026-02-05"
  end: "2026-02-09"
title: "Multiple Regression"
subtitle: "Introduction to Multiple Predictors"
learning_objectives:
  - id: "LO-3.1"
    level: "understand"
    description: "Explain regression coefficients"
    assessment_method: "quiz-question"
  - id: "LO-3.2"
    level: "apply"
    description: "Fit models in R"
topics:
  - id: "T-3.1"
    name: "Multiple regression"
    prerequisites: ["T-2.1"]
    subtopics:
      - "Matrix notation"
      - "Coefficient interpretation"
materials:
  readings:
    - type: "textbook"
      title: "Applied Linear Regression"
      chapter: "6"
  datasets:
    - name: "boston-housing"
      file: "data/boston.csv"
  software:
    - name: "R"
      version: ">= 4.0"
activities:
  - id: "A-3.1"
    type: "in-class-practice"
    duration_minutes: 25
    title: "Model fitting exercise"
lecture_structure:
  - segment: "review"
    duration_minutes: 5
  - segment: "introduction"
    duration_minutes: 15
teaching_style_overrides:
  explanation_style:
    formality: engaging
`;
      writeFileSync(join(plansDir, 'week03.yml'), fullPlan);

      const result = loadLessonPlan({
        weekId: 3,
        courseRoot: courseRoot
      });

      expect(result.plan).toBeTruthy();
      expect(result.extracted.title).toBe('Multiple Regression');
      expect(result.extracted.learning_objectives).toHaveLength(2);
      expect(result.extracted.topics).toHaveLength(1);
      expect(result.extracted.topics[0].subtopics).toHaveLength(2);
      expect(result.extracted.materials.readings).toHaveLength(1);
      expect(result.extracted.materials.datasets).toHaveLength(1);
      expect(result.extracted.activities).toHaveLength(1);
      expect(result.extracted.lecture_structure).toHaveLength(2);
      expect(result.extracted.teaching_style_overrides).toBeTruthy();
    });

    it('should sort lesson plans by week number', () => {
      writeFileSync(join(plansDir, 'week05.yml'), 'week: 5\ntitle: Week 5');
      writeFileSync(join(plansDir, 'week01.yml'), 'week: 1\ntitle: Week 1');
      writeFileSync(join(plansDir, 'week03.yml'), 'week: 3\ntitle: Week 3');

      const plans = listLessonPlans(courseRoot);

      expect(plans[0].week).toBe(1);
      expect(plans[1].week).toBe(3);
      expect(plans[2].week).toBe(5);
    });
  });
});
