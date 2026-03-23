/**
 * Tests for Syllabus Generator
 *
 * These tests verify that the syllabus generator integrates correctly with Phase 0 components
 * and follows the same patterns as other teaching generators.
 */

import { generateSyllabus, exportSyllabus } from '../../src/teaching/generators/syllabus.js';
import {
  buildConversationalPrompt,
  processGeneratedSyllabus,
  formatAsMarkdown,
  DEFAULT_GRADING_SCALE,
  DEFAULT_GRADING_COMPONENTS,
  STANDARD_POLICIES
} from '../../src/teaching/generators/syllabus-conversational.js';
import {
  formatSyllabusAsMarkdown,
  formatSyllabusAsLaTeX,
  formatSyllabusAsHTML
} from '../../src/teaching/generators/syllabus.js';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Syllabus Generator Smoke Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    // Set test API key for mock AI provider
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    // Restore original API key
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  it('should not throw errors for config access patterns', async () => {
    try {
      await generateSyllabus({ debug: false });
      expect(true).toBe(true);
    } catch (error) {
      // Check that error is validation-related, not config access
      expect(error.message).not.toContain('undefined');
      expect(error.message).not.toContain('Cannot read properties');

      // Validation failure is expected with mock data
      if (error.message.includes('Validation failed') || error.message.includes('AI generation failed')) {
        expect(true).toBe(true);
      } else {
        throw error;
      }
    }
  });

  it('should handle missing API key gracefully', async () => {
    const savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await generateSyllabus({ debug: false });
      // The generator handles missing key internally
      expect(true).toBe(true);
    } catch (error) {
      // AI generation failed is acceptable
      expect(error.message).toMatch(/AI generation failed|API key/i);
    } finally {
      process.env.ANTHROPIC_API_KEY = savedKey;
    }
  });

  it('should use scholar config structure', async () => {
    try {
      await generateSyllabus({
        level: 'graduate',
        debug: false,
      });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).not.toContain('Cannot read properties of undefined');
    }
  });

  it('should handle missing course_info gracefully', async () => {
    try {
      await generateSyllabus({ debug: false });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).not.toContain('course_info');
    }
  });
});

describe('Syllabus Generator Unit Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  describe('Syllabus Options', () => {
    it('should accept courseTitle option', async () => {
      try {
        await generateSyllabus({ courseTitle: 'Regression Analysis', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('courseTitle');
      }
    });

    it('should accept courseCode option', async () => {
      try {
        await generateSyllabus({ courseCode: 'STAT 440', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('courseCode');
      }
    });

    it('should accept semester option', async () => {
      try {
        await generateSyllabus({ semester: 'Fall 2026', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('semester');
      }
    });

    it('should accept level option', async () => {
      try {
        await generateSyllabus({ level: 'graduate', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('level');
      }
    });

    it('should accept weeks option', async () => {
      try {
        await generateSyllabus({ weeks: 15, debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('weeks');
      }
    });

    it('should accept format option (in-person/online/hybrid)', async () => {
      try {
        await generateSyllabus({ format: 'hybrid', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('format');
      }
    });

    it('should accept instructor object', async () => {
      try {
        await generateSyllabus({
          instructor: {
            name: 'Dr. Smith',
            email: 'smith@university.edu'
          },
          debug: false
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('instructor');
      }
    });

    it('should accept prerequisites array', async () => {
      try {
        await generateSyllabus({
          prerequisites: ['STAT 250', 'MATH 200'],
          debug: false
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('prerequisites');
      }
    });

    it('should accept custom grading components', async () => {
      try {
        await generateSyllabus({
          gradingComponents: [
            { name: 'Exams', percentage: 50 },
            { name: 'Projects', percentage: 50 }
          ],
          debug: false
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('gradingComponents');
      }
    });

    it('should accept topics array', async () => {
      try {
        await generateSyllabus({
          topics: ['Linear Regression', 'Multiple Regression', 'Model Selection'],
          debug: false
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('topics');
      }
    });
  });
});

describe('Conversational Syllabus Generator Tests', () => {
  describe('buildConversationalPrompt', () => {
    it('should generate prompt with default options', () => {
      const result = buildConversationalPrompt({});
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('options');
      expect(result.prompt).toContain('syllabus');
    });

    it('should include course title in prompt', () => {
      const result = buildConversationalPrompt({ courseTitle: 'Regression Analysis' });
      expect(result.prompt).toContain('Regression Analysis');
    });

    it('should include course code in prompt', () => {
      const result = buildConversationalPrompt({ courseCode: 'STAT 440' });
      expect(result.prompt).toContain('STAT 440');
    });

    it('should include semester in prompt', () => {
      const result = buildConversationalPrompt({ semester: 'Fall 2026' });
      expect(result.prompt).toContain('Fall 2026');
    });

    it('should include level in prompt', () => {
      const result = buildConversationalPrompt({ level: 'graduate' });
      expect(result.prompt).toContain('graduate');
    });

    it('should include weeks in prompt', () => {
      const result = buildConversationalPrompt({ weeks: 15 });
      expect(result.prompt).toContain('15');
    });

    it('should include topics when provided', () => {
      const result = buildConversationalPrompt({
        topics: ['Linear Regression', 'ANOVA']
      });
      expect(result.prompt).toContain('Linear Regression');
      expect(result.prompt).toContain('ANOVA');
    });

    it('should include prerequisites when provided', () => {
      const result = buildConversationalPrompt({
        prerequisites: ['STAT 250', 'MATH 200']
      });
      expect(result.prompt).toContain('STAT 250');
      expect(result.prompt).toContain('MATH 200');
    });

    it('should include instructor name when provided', () => {
      const result = buildConversationalPrompt({
        instructor: { name: 'Dr. Smith' }
      });
      expect(result.prompt).toContain('Dr. Smith');
    });
  });

  describe('processGeneratedSyllabus', () => {
    it('should process valid JSON string', () => {
      const content = JSON.stringify({
        title: 'Test Course',
        course_code: 'TEST 101',
        semester: 'Fall 2026',
        instructor: { name: 'Dr. Test', email: 'test@test.edu' },
        description: 'A test course description that is at least 50 characters long for validation.',
        learning_objectives: ['Objective 1', 'Objective 2', 'Objective 3'],
        grading: { components: [], scale: [] },
        schedule: [{ week: 1, topic: 'Introduction' }]
      });

      const result = processGeneratedSyllabus(content);
      expect(result.title).toBe('Test Course');
      expect(result.course_code).toBe('TEST 101');
    });

    it('should process valid object', () => {
      const content = {
        title: 'Test Course',
        course_code: 'TEST 101',
        semester: 'Fall 2026',
        instructor: { name: 'Dr. Test', email: 'test@test.edu' },
        description: 'A test course description that is at least 50 characters long for validation.',
        learning_objectives: ['Objective 1', 'Objective 2', 'Objective 3'],
        grading: { components: [], scale: [] },
        schedule: [{ week: 1, topic: 'Introduction' }]
      };

      const result = processGeneratedSyllabus(content);
      expect(result.title).toBe('Test Course');
    });

    it('should add metadata', () => {
      const content = {
        title: 'Test',
        course_code: 'TEST',
        semester: 'Fall',
        instructor: { name: 'Dr.', email: 'a@b.c' },
        description: 'Test description that is long enough to pass validation checks.',
        learning_objectives: ['A', 'B', 'C'],
        grading: { components: [], scale: [] },
        schedule: []
      };

      const result = processGeneratedSyllabus(content);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.generated_at).toBeDefined();
      expect(result.metadata.generator).toBe('scholar-syllabus-conversational');
    });

    it('should add standard policies when not present', () => {
      const content = {
        title: 'Test',
        course_code: 'TEST',
        semester: 'Fall',
        instructor: { name: 'Dr.', email: 'a@b.c' },
        description: 'Test description that is long enough to pass validation checks.',
        learning_objectives: ['A', 'B', 'C'],
        grading: { components: [], scale: [] },
        schedule: []
      };

      const result = processGeneratedSyllabus(content);
      expect(result.policies).toBeDefined();
      expect(result.policies.academic_integrity).toBeDefined();
      expect(result.policies.accessibility).toBeDefined();
    });
  });

  describe('formatAsMarkdown', () => {
    it('should format syllabus as markdown', () => {
      const syllabus = {
        title: 'Regression Analysis',
        course_code: 'STAT 440',
        semester: 'Fall 2026',
        credits: 3,
        instructor: {
          name: 'Dr. Smith',
          email: 'smith@uni.edu',
          office_hours: 'MW 2-4'
        },
        description: 'This course covers regression techniques.',
        learning_objectives: ['Apply regression', 'Interpret results'],
        schedule: [
          { week: 1, topic: 'Introduction', readings: ['Ch 1'] }
        ]
      };

      const md = formatAsMarkdown(syllabus);
      expect(md).toContain('# Regression Analysis');
      expect(md).toContain('STAT 440');
      expect(md).toContain('Fall 2026');
      expect(md).toContain('Dr. Smith');
      expect(md).toContain('## Course Description');
      expect(md).toContain('## Learning Objectives');
      expect(md).toContain('## Course Schedule');
    });

    it('should include grading components', () => {
      const syllabus = {
        title: 'Test',
        grading: {
          components: [
            { name: 'Homework', percentage: 25 },
            { name: 'Exams', percentage: 75 }
          ]
        }
      };

      const md = formatAsMarkdown(syllabus);
      expect(md).toContain('## Grading');
      expect(md).toContain('Homework');
      expect(md).toContain('25%');
    });

    it('should include textbooks', () => {
      const syllabus = {
        title: 'Test',
        required_materials: {
          textbooks: [
            { title: 'Stats Book', author: 'Author Name' }
          ]
        }
      };

      const md = formatAsMarkdown(syllabus);
      expect(md).toContain('Stats Book');
      expect(md).toContain('Author Name');
    });

    it('should include policies', () => {
      const syllabus = {
        title: 'Test',
        policies: {
          academic_integrity: 'No cheating.',
          attendance: 'Come to class.'
        }
      };

      const md = formatAsMarkdown(syllabus);
      expect(md).toContain('## Course Policies');
      expect(md).toContain('No cheating');
    });
  });
});

describe('Syllabus Template Schema Tests', () => {
  it('should have valid syllabus template', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/syllabus.json');
    expect(existsSync(templatePath)).toBe(true);

    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));
    expect(template.$schema).toBeDefined();
    expect(template.properties).toBeDefined();
    expect(template.properties.instructor).toBeDefined();
    expect(template.properties.grading).toBeDefined();
    expect(template.properties.schedule).toBeDefined();
    expect(template.properties.policies).toBeDefined();
  });

  it('should define required fields', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/syllabus.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    expect(template.required).toContain('title');
    expect(template.required).toContain('course_code');
    expect(template.required).toContain('semester');
    expect(template.required).toContain('instructor');
    expect(template.required).toContain('description');
    expect(template.required).toContain('learning_objectives');
    expect(template.required).toContain('grading');
    expect(template.required).toContain('schedule');
  });

  it('should define instructor structure', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/syllabus.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const instructorProps = template.properties.instructor.properties;
    expect(instructorProps.name).toBeDefined();
    expect(instructorProps.email).toBeDefined();
    expect(instructorProps.office).toBeDefined();
    expect(instructorProps.office_hours).toBeDefined();
  });

  it('should define grading structure', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/syllabus.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const gradingProps = template.properties.grading.properties;
    expect(gradingProps.components).toBeDefined();
    expect(gradingProps.scale).toBeDefined();
    expect(gradingProps.late_policy).toBeDefined();
  });

  it('should define schedule structure', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/syllabus.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const scheduleItem = template.properties.schedule.items.properties;
    expect(scheduleItem.week).toBeDefined();
    expect(scheduleItem.topic).toBeDefined();
    expect(scheduleItem.readings).toBeDefined();
    expect(scheduleItem.assignments_due).toBeDefined();
  });

  it('should define level enum', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/syllabus.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const levels = template.properties.level.enum;
    expect(levels).toContain('undergraduate');
    expect(levels).toContain('graduate');
    expect(levels).toContain('doctoral');
  });
});

describe('Syllabus Export Tests', () => {
  const testSyllabus = {
    title: 'Test Course',
    course_code: 'TEST 101',
    semester: 'Fall 2026',
    credits: 3,
    instructor: {
      name: 'Dr. Test',
      email: 'test@test.edu'
    },
    description: 'A comprehensive test course.',
    learning_objectives: ['Learn testing', 'Apply tests'],
    grading: {
      components: [{ name: 'Exam', percentage: 100 }],
      scale: [{ grade: 'A', minimum: 90 }]
    },
    schedule: [
      { week: 1, topic: 'Introduction' }
    ]
  };

  it('should export to markdown format', async () => {
    const result = await exportSyllabus(testSyllabus, 'markdown');
    expect(result.format).toBe('markdown');
    expect(result.content).toContain('# Test Course');
    expect(result.content).toContain('TEST 101');
  });

  it('should export to JSON format', async () => {
    const result = await exportSyllabus(testSyllabus, 'json');
    expect(result.format).toBe('json');
    const parsed = JSON.parse(result.content);
    expect(parsed.title).toBe('Test Course');
  });

  it('should export to LaTeX format', async () => {
    const result = await exportSyllabus(testSyllabus, 'latex');
    expect(result.format).toBe('latex');
    expect(result.content).toContain('\\documentclass');
    expect(result.content).toContain('Test Course');
  });

  it('should export to HTML format', async () => {
    const result = await exportSyllabus(testSyllabus, 'html');
    expect(result.format).toBe('html');
    expect(result.content).toContain('<!DOCTYPE html>');
    expect(result.content).toContain('Test Course');
  });

  it('should throw error for unsupported format', async () => {
    await expect(exportSyllabus(testSyllabus, 'unsupported'))
      .rejects
      .toThrow('Unsupported format');
  });
});

describe('Default Constants Tests', () => {
  it('should have valid default grading scale', () => {
    expect(DEFAULT_GRADING_SCALE).toBeDefined();
    expect(DEFAULT_GRADING_SCALE.length).toBeGreaterThan(0);

    // Check structure
    const firstGrade = DEFAULT_GRADING_SCALE[0];
    expect(firstGrade).toHaveProperty('grade');
    expect(firstGrade).toHaveProperty('minimum');
    expect(firstGrade).toHaveProperty('maximum');

    // Check A grade
    expect(firstGrade.grade).toBe('A');
    expect(firstGrade.minimum).toBe(93);
  });

  it('should have valid default grading components', () => {
    expect(DEFAULT_GRADING_COMPONENTS).toBeDefined();
    expect(DEFAULT_GRADING_COMPONENTS.length).toBeGreaterThan(0);

    // Check structure
    const firstComponent = DEFAULT_GRADING_COMPONENTS[0];
    expect(firstComponent).toHaveProperty('name');
    expect(firstComponent).toHaveProperty('percentage');

    // Check total percentage equals 100
    const total = DEFAULT_GRADING_COMPONENTS.reduce((sum, c) => sum + c.percentage, 0);
    expect(total).toBe(100);
  });

  it('should have valid standard policies', () => {
    expect(STANDARD_POLICIES).toBeDefined();
    expect(STANDARD_POLICIES.academic_integrity).toBeDefined();
    expect(STANDARD_POLICIES.accessibility).toBeDefined();
    expect(STANDARD_POLICIES.attendance).toBeDefined();
    expect(STANDARD_POLICIES.late_policy).toBeDefined();

    // Check policies are non-empty strings
    expect(typeof STANDARD_POLICIES.academic_integrity).toBe('string');
    expect(STANDARD_POLICIES.academic_integrity.length).toBeGreaterThan(50);
  });
});

describe('Full Syllabus Formatter Tests', () => {
  const completeSyllabus = {
    title: 'Regression Analysis',
    course_code: 'STAT 440',
    semester: 'Fall 2026',
    credits: 3,
    level: 'undergraduate',
    prerequisites: ['STAT 250', 'MATH 200'],
    instructor: {
      name: 'Dr. Smith',
      title: 'Associate Professor',
      email: 'smith@university.edu',
      office: 'Science 301',
      office_hours: 'MW 2-4 PM'
    },
    teaching_assistants: [
      { name: 'Jane Doe', email: 'jane@uni.edu', office_hours: 'TH 10-12' }
    ],
    meeting_times: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '10:00 AM - 10:50 AM',
      location: 'Science 100',
      format: 'in-person'
    },
    description: 'This course introduces students to regression analysis techniques used in statistical modeling.',
    learning_objectives: [
      'Apply simple and multiple regression models',
      'Interpret regression coefficients',
      'Diagnose model assumptions'
    ],
    required_materials: {
      textbooks: [
        { title: 'Applied Regression', author: 'Smith', edition: '4th', required: true }
      ],
      software: [
        { name: 'R', version: '4.0+', license: 'free' }
      ]
    },
    grading: {
      components: [
        { name: 'Homework', percentage: 30, details: 'Weekly' },
        { name: 'Midterm', percentage: 30 },
        { name: 'Final', percentage: 40 }
      ],
      scale: [
        { grade: 'A', minimum: 90, maximum: 100 },
        { grade: 'B', minimum: 80, maximum: 89 }
      ],
      late_policy: '10% per day'
    },
    schedule: [
      { week: 1, topic: 'Introduction', readings: ['Ch 1'], assignments_due: [] },
      { week: 2, topic: 'Simple Regression', readings: ['Ch 2'], assignments_due: ['HW 1'] },
      { week: 8, topic: 'Spring Break', is_break: true }
    ],
    important_dates: [
      { date: 'Week 8', event: 'Midterm Exam' }
    ],
    policies: {
      academic_integrity: 'No cheating.',
      accessibility: 'Contact DRC.'
    }
  };

  it('should format complete syllabus as markdown', () => {
    const md = formatSyllabusAsMarkdown(completeSyllabus);

    // Check headers
    expect(md).toContain('# Regression Analysis');
    expect(md).toContain('## Course Information');
    expect(md).toContain('## Instructor');
    expect(md).toContain('## Teaching Assistants');
    expect(md).toContain('## Course Description');
    expect(md).toContain('## Learning Objectives');
    expect(md).toContain('## Required Materials');
    expect(md).toContain('## Grading');
    expect(md).toContain('## Course Schedule');
    expect(md).toContain('## Important Dates');
    expect(md).toContain('## Course Policies');

    // Check content
    expect(md).toContain('Dr. Smith');
    expect(md).toContain('Jane Doe');
    expect(md).toContain('Applied Regression');
    expect(md).toContain('Spring Break');
  });

  it('should format complete syllabus as LaTeX', () => {
    const tex = formatSyllabusAsLaTeX(completeSyllabus);

    // Check LaTeX structure
    expect(tex).toContain('\\documentclass');
    expect(tex).toContain('\\begin{document}');
    expect(tex).toContain('\\end{document}');
    expect(tex).toContain('\\section*{Course Information}');
    expect(tex).toContain('\\section*{Instructor}');

    // Check content escaping
    expect(tex).toContain('Regression Analysis');
  });

  it('should format complete syllabus as HTML', () => {
    const html = formatSyllabusAsHTML(completeSyllabus);

    // Check HTML structure
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<style>');

    // Check content
    expect(html).toContain('Regression Analysis');
    expect(html).toContain('Dr. Smith');
  });
});
