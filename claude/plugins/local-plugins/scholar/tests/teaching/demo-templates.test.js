/**
 * Tests for /teaching:demo command templates
 *
 * These tests validate that all demo template files are present and valid.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '../../src/teaching/demo-templates');
const EXAMPLES_DIR = path.join(TEMPLATES_DIR, 'examples');

describe('/teaching:demo templates', () => {
  describe('Template directory structure', () => {
    it('should have demo-templates directory', () => {
      expect(fs.existsSync(TEMPLATES_DIR)).toBe(true);
    });

    it('should have examples subdirectory', () => {
      expect(fs.existsSync(EXAMPLES_DIR)).toBe(true);
    });
  });

  describe('Core template files', () => {
    const coreFiles = [
      'teach-config.yml',
      'lesson-plans.yml',
      'README.md',
      'TEST-CHECKLIST.md',
      'sample-student-work.md'
    ];

    coreFiles.forEach(file => {
      it(`should have ${file}`, () => {
        const filePath = path.join(TEMPLATES_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it(`${file} should not be empty`, () => {
        const filePath = path.join(TEMPLATES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(100);
      });
    });
  });

  describe('Example files', () => {
    const exampleFiles = [
      'exam-midterm.json',
      'quiz-descriptive.md',
      'syllabus-stat101.md',
      'assignment-regression.md',
      'rubric-project.md',
      'slides-probability.md'
    ];

    exampleFiles.forEach(file => {
      it(`should have examples/${file}`, () => {
        const filePath = path.join(EXAMPLES_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it(`examples/${file} should not be empty`, () => {
        const filePath = path.join(EXAMPLES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(100);
      });
    });
  });

  describe('Configuration file validity', () => {
    it('teach-config.yml should be valid YAML', () => {
      const configPath = path.join(TEMPLATES_DIR, 'teach-config.yml');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(() => yaml.load(content)).not.toThrow();
    });

    it('teach-config.yml should have required fields', () => {
      const configPath = path.join(TEMPLATES_DIR, 'teach-config.yml');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = yaml.load(content);

      expect(config).toHaveProperty('scholar');
      expect(config.scholar).toHaveProperty('course_info');
      expect(config.scholar).toHaveProperty('defaults');
      expect(config.scholar).toHaveProperty('style');
      expect(config.scholar).toHaveProperty('topics');
      expect(config.scholar).toHaveProperty('grading');
    });

    it('teach-config.yml course_info should have required fields', () => {
      const configPath = path.join(TEMPLATES_DIR, 'teach-config.yml');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = yaml.load(content);

      const courseInfo = config.scholar.course_info;
      expect(courseInfo).toHaveProperty('code');
      expect(courseInfo).toHaveProperty('title');
      expect(courseInfo).toHaveProperty('level');
      expect(courseInfo).toHaveProperty('field');
      expect(courseInfo).toHaveProperty('instructor');
    });

    it('grading percentages should sum to 100', () => {
      const configPath = path.join(TEMPLATES_DIR, 'teach-config.yml');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = yaml.load(content);

      const grading = config.scholar.grading;
      const total = Object.values(grading).reduce((sum, val) => sum + val, 0);
      expect(total).toBe(100);
    });
  });

  describe('Lesson plans manifest validity', () => {
    it('lesson-plans.yml should be valid YAML', () => {
      const manifestPath = path.join(TEMPLATES_DIR, 'lesson-plans.yml');
      const content = fs.readFileSync(manifestPath, 'utf-8');

      expect(() => yaml.load(content)).not.toThrow();
    });

    it('lesson-plans.yml should have required top-level fields', () => {
      const manifestPath = path.join(TEMPLATES_DIR, 'lesson-plans.yml');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = yaml.load(content);

      expect(manifest).toHaveProperty('schema_version', '1.0');
      expect(manifest).toHaveProperty('semester');
      expect(manifest).toHaveProperty('weeks');
      expect(Array.isArray(manifest.weeks)).toBe(true);
      expect(manifest.weeks.length).toBeGreaterThan(0);
    });

    it('lesson-plans.yml semester should have schedule metadata', () => {
      const manifestPath = path.join(TEMPLATES_DIR, 'lesson-plans.yml');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = yaml.load(content);

      expect(manifest.semester).toHaveProperty('total_weeks');
      expect(manifest.semester).toHaveProperty('schedule');
      expect(manifest.semester.total_weeks).toBeGreaterThan(0);
    });

    it('lesson-plans.yml weeks should have required fields', () => {
      const manifestPath = path.join(TEMPLATES_DIR, 'lesson-plans.yml');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = yaml.load(content);

      manifest.weeks.forEach((week) => {
        expect(week).toHaveProperty('week');
        expect(week).toHaveProperty('title');
        expect(week).toHaveProperty('status');
        expect(['draft', 'generated', 'reviewed', 'published']).toContain(week.status);
      });
    });

    it('lesson-plans.yml should demonstrate all three status states', () => {
      const manifestPath = path.join(TEMPLATES_DIR, 'lesson-plans.yml');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = yaml.load(content);

      const statuses = manifest.weeks.map(w => w.status);
      expect(statuses).toContain('published');
      expect(statuses).toContain('generated');
      expect(statuses).toContain('draft');
    });
  });

  describe('Exam example validity', () => {
    it('exam-midterm.json should be valid JSON', () => {
      const examPath = path.join(EXAMPLES_DIR, 'exam-midterm.json');
      const content = fs.readFileSync(examPath, 'utf-8');

      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('exam-midterm.json should have required structure', () => {
      const examPath = path.join(EXAMPLES_DIR, 'exam-midterm.json');
      const content = fs.readFileSync(examPath, 'utf-8');
      const exam = JSON.parse(content);

      expect(exam).toHaveProperty('metadata');
      expect(exam).toHaveProperty('questions');
      expect(exam).toHaveProperty('answer_key');
      expect(Array.isArray(exam.questions)).toBe(true);
      expect(exam.questions.length).toBeGreaterThan(0);
    });

    it('exam questions should have required fields', () => {
      const examPath = path.join(EXAMPLES_DIR, 'exam-midterm.json');
      const content = fs.readFileSync(examPath, 'utf-8');
      const exam = JSON.parse(content);

      exam.questions.forEach((q, _i) => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('type');
        expect(q).toHaveProperty('text');
        expect(q).toHaveProperty('points');
      });
    });
  });

  describe('Markdown example files', () => {
    it('quiz-descriptive.md should have question structure', () => {
      const quizPath = path.join(EXAMPLES_DIR, 'quiz-descriptive.md');
      const content = fs.readFileSync(quizPath, 'utf-8');

      expect(content).toContain('## Question');
      expect(content).toContain('**Answer:**');
      expect(content).toContain('**Explanation:**');
    });

    it('syllabus-stat101.md should have course structure', () => {
      const syllabusPath = path.join(EXAMPLES_DIR, 'syllabus-stat101.md');
      const content = fs.readFileSync(syllabusPath, 'utf-8');

      expect(content).toContain('Learning Objectives');
      expect(content).toContain('Grading');
      expect(content).toContain('Course Schedule');
      expect(content).toContain('Week 1');
    });

    it('assignment-regression.md should have problems', () => {
      const assignmentPath = path.join(EXAMPLES_DIR, 'assignment-regression.md');
      const content = fs.readFileSync(assignmentPath, 'utf-8');

      expect(content).toContain('## Problem');
      expect(content).toContain('**Solution:**');
      expect(content).toContain('points');
    });

    it('rubric-project.md should have grading criteria', () => {
      const rubricPath = path.join(EXAMPLES_DIR, 'rubric-project.md');
      const content = fs.readFileSync(rubricPath, 'utf-8');

      expect(content).toContain('Excellent');
      expect(content).toContain('Good');
      expect(content).toContain('Satisfactory');
      expect(content).toContain('Points');
    });

    it('slides-probability.md should have slide structure', () => {
      const slidesPath = path.join(EXAMPLES_DIR, 'slides-probability.md');
      const content = fs.readFileSync(slidesPath, 'utf-8');

      expect(content).toContain('## Slide');
      expect(content).toContain('Learning Objectives');
      expect(content).toContain('Key Takeaways');
    });
  });

  describe('Sample student work', () => {
    it('sample-student-work.md should be usable for feedback testing', () => {
      const samplePath = path.join(TEMPLATES_DIR, 'sample-student-work.md');
      const content = fs.readFileSync(samplePath, 'utf-8');

      expect(content).toContain('Homework');
      expect(content).toContain('## Problem');
      expect(content).toContain('My Answer');
      // Should have some imperfect answers for feedback testing
      expect(content.length).toBeGreaterThan(500);
    });
  });
});
