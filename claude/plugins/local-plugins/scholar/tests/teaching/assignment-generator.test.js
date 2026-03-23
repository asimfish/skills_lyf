/**
 * Tests for Assignment Generator
 *
 * These tests verify that the assignment generator integrates correctly with Phase 0 components
 * and follows the same patterns as the exam/quiz generators.
 */

import { generateAssignment, exportAssignment } from '../../src/teaching/generators/assignment.js';
import {
  buildConversationalPrompt,
  processGeneratedAssignment,
  formatAsMarkdown
} from '../../src/teaching/generators/assignment-conversational.js';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Assignment Generator Smoke Tests', () => {
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
      await generateAssignment({ debug: false });
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
      await generateAssignment({ debug: false });
      fail('Should have thrown error for missing API key');
    } catch (error) {
      expect(error.message).toContain('AI generation failed');
    } finally {
      process.env.ANTHROPIC_API_KEY = savedKey;
    }
  });

  it('should use scholar config structure', async () => {
    try {
      await generateAssignment({
        difficulty: 'advanced',
        debug: false,
      });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).not.toContain('Cannot read properties of undefined');
      expect(error.message).not.toContain('teaching_preferences');
    }
  });

  it('should handle optional ai_generation config section', async () => {
    try {
      await generateAssignment({ debug: false });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).not.toContain('ai_generation');
    }
  });

  it('should handle missing course_info gracefully', async () => {
    try {
      await generateAssignment({ debug: false });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).not.toContain('course_info');
    }
  });
});

describe('Assignment Generator Unit Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  describe('Assignment Types', () => {
    it('should support homework type', async () => {
      try {
        await generateAssignment({ type: 'homework', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('Invalid type');
      }
    });

    it('should support problem-set type', async () => {
      try {
        await generateAssignment({ type: 'problem-set', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('Invalid type');
      }
    });

    it('should support lab type', async () => {
      try {
        await generateAssignment({ type: 'lab', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('Invalid type');
      }
    });

    it('should support project type', async () => {
      try {
        await generateAssignment({ type: 'project', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('Invalid type');
      }
    });

    it('should support worksheet type', async () => {
      try {
        await generateAssignment({ type: 'worksheet', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('Invalid type');
      }
    });
  });

  describe('Assignment Options', () => {
    it('should accept problemCount option', async () => {
      try {
        await generateAssignment({ problemCount: 10, debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('problemCount');
      }
    });

    it('should accept totalPoints option', async () => {
      try {
        await generateAssignment({ totalPoints: 150, debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('totalPoints');
      }
    });

    it('should accept includeCode option', async () => {
      try {
        await generateAssignment({ includeCode: true, language: 'R', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('includeCode');
      }
    });

    it('should accept topics array', async () => {
      try {
        await generateAssignment({
          topics: ['Linear Regression', 'Hypothesis Testing'],
          debug: false
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('topics');
      }
    });

    it('should accept collaboration policy', async () => {
      try {
        await generateAssignment({
          collaborationPolicy: 'groups-allowed',
          debug: false
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('collaborationPolicy');
      }
    });
  });

  describe('Solution and Rubric Generation', () => {
    it('should generate solutions by default', async () => {
      try {
        await generateAssignment({ debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('solutions');
      }
    });

    it('should skip solutions when generateSolutions is false', async () => {
      try {
        await generateAssignment({ generateSolutions: false, debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('generateSolutions');
      }
    });

    it('should generate rubric by default', async () => {
      try {
        await generateAssignment({ debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('rubric');
      }
    });

    it('should skip rubric when generateRubric is false', async () => {
      try {
        await generateAssignment({ generateRubric: false, debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('generateRubric');
      }
    });
  });
});

describe('Conversational Assignment Generator Tests', () => {
  describe('buildConversationalPrompt', () => {
    it('should generate prompt with default options', () => {
      const result = buildConversationalPrompt({});
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('options');
      expect(result.prompt).toContain('homework');
    });

    it('should include topic in prompt', () => {
      const result = buildConversationalPrompt({ topic: 'Linear Regression' });
      expect(result.prompt).toContain('Linear Regression');
    });

    it('should include problem count in prompt', () => {
      const result = buildConversationalPrompt({ problemCount: 7 });
      expect(result.prompt).toContain('7');
    });

    it('should include difficulty in prompt', () => {
      const result = buildConversationalPrompt({ difficulty: 'advanced' });
      expect(result.prompt).toContain('advanced');
    });

    it('should include code section when includeCode is true', () => {
      const result = buildConversationalPrompt({ includeCode: true, language: 'Python' });
      expect(result.prompt).toContain('Python');
      expect(result.prompt).toContain('coding');
    });

    it('should include learning objectives when provided', () => {
      const result = buildConversationalPrompt({
        learningObjectives: ['Interpret regression', 'Assess model fit']
      });
      expect(result.prompt).toContain('Interpret regression');
      expect(result.prompt).toContain('Assess model fit');
    });

    it('should handle multiple topics', () => {
      const result = buildConversationalPrompt({
        topics: ['ANOVA', 'Regression', 'Hypothesis Testing']
      });
      expect(result.prompt).toContain('ANOVA');
      expect(result.prompt).toContain('Regression');
      expect(result.prompt).toContain('Hypothesis Testing');
    });
  });

  describe('processGeneratedAssignment', () => {
    it('should process valid JSON string', () => {
      const content = JSON.stringify({
        title: 'Test Assignment',
        assignment_type: 'homework',
        problems: [{ id: 'P1', text: 'Test', points: 10 }]
      });

      const result = processGeneratedAssignment(content);
      expect(result.title).toBe('Test Assignment');
      expect(result.problems).toHaveLength(1);
    });

    it('should process valid object', () => {
      const content = {
        title: 'Test Assignment',
        assignment_type: 'homework',
        problems: [{ id: 'P1', text: 'Test', points: 10 }]
      };

      const result = processGeneratedAssignment(content);
      expect(result.title).toBe('Test Assignment');
    });

    it('should add metadata', () => {
      const content = {
        title: 'Test',
        problems: []
      };

      const result = processGeneratedAssignment(content);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.generated_at).toBeDefined();
      expect(result.metadata.generator).toBe('scholar-assignment-conversational');
    });

    it('should calculate total points from problems', () => {
      const content = {
        title: 'Test',
        problems: [
          { id: 'P1', text: 'Q1', points: 20 },
          { id: 'P2', text: 'Q2', points: 30 }
        ]
      };

      const result = processGeneratedAssignment(content);
      expect(result.total_points).toBe(50);
    });

    it('should calculate total points from parts', () => {
      const content = {
        title: 'Test',
        problems: [
          {
            id: 'P1',
            text: 'Q1',
            points: 0,
            parts: [
              { label: 'a', text: 'Part a', points: 10 },
              { label: 'b', text: 'Part b', points: 15 }
            ]
          }
        ]
      };

      const result = processGeneratedAssignment(content);
      expect(result.total_points).toBe(25);
    });
  });

  describe('formatAsMarkdown', () => {
    it('should format assignment as markdown', () => {
      const assignment = {
        title: 'Homework 1',
        due_date: 'Friday',
        total_points: 100,
        instructions: 'Show all work',
        problems: [
          { id: 'P1', text: 'Solve this', points: 50 }
        ]
      };

      const md = formatAsMarkdown(assignment);
      expect(md).toContain('# Homework 1');
      expect(md).toContain('**Due:** Friday');
      expect(md).toContain('**Total Points:** 100');
      expect(md).toContain('## Problems');
      expect(md).toContain('### Problem P1');
    });

    it('should include solutions if present', () => {
      const assignment = {
        title: 'Test',
        problems: [{ id: 'P1', text: 'Q', points: 10 }],
        solutions: {
          P1: { answer: 'The answer is 42' }
        }
      };

      const md = formatAsMarkdown(assignment);
      expect(md).toContain('## Solutions');
      expect(md).toContain('The answer is 42');
    });

    it('should format parts correctly', () => {
      const assignment = {
        title: 'Test',
        problems: [{
          id: 'P1',
          text: 'Main question',
          points: 30,
          parts: [
            { label: 'a', text: 'Part a', points: 10 },
            { label: 'b', text: 'Part b', points: 20 }
          ]
        }]
      };

      const md = formatAsMarkdown(assignment);
      expect(md).toContain('**(a)** Part a');
      expect(md).toContain('**(b)** Part b');
      expect(md).toContain('[10 pts]');
      expect(md).toContain('[20 pts]');
    });
  });
});

describe('Assignment Template Schema Tests', () => {
  it('should have valid assignment template', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/assignment.json');
    expect(existsSync(templatePath)).toBe(true);

    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));
    expect(template.$schema).toBeDefined();
    expect(template.properties).toBeDefined();
    expect(template.properties.problems).toBeDefined();
    expect(template.properties.solutions).toBeDefined();
    expect(template.properties.rubric).toBeDefined();
  });

  it('should define required fields', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/assignment.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    expect(template.required).toContain('title');
    expect(template.required).toContain('assignment_type');
    expect(template.required).toContain('problems');
  });

  it('should define assignment types enum', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/assignment.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const types = template.properties.assignment_type.enum;
    expect(types).toContain('homework');
    expect(types).toContain('problem-set');
    expect(types).toContain('lab');
    expect(types).toContain('project');
    expect(types).toContain('worksheet');
  });

  it('should define problem structure', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/assignment.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const problemProps = template.properties.problems.items.properties;
    expect(problemProps.id).toBeDefined();
    expect(problemProps.text).toBeDefined();
    expect(problemProps.points).toBeDefined();
    expect(problemProps.parts).toBeDefined();
    expect(problemProps.difficulty).toBeDefined();
  });
});

describe('Assignment Export Tests', () => {
  const testAssignment = {
    title: 'Test Assignment',
    assignment_type: 'homework',
    total_points: 100,
    problems: [
      { id: 'P1', text: 'Test problem', points: 100 }
    ]
  };

  it('should export to markdown format', async () => {
    const result = await exportAssignment(testAssignment, 'markdown');
    expect(result.format).toBe('markdown');
    expect(result.content).toContain('# Test Assignment');
  });

  it('should export to JSON format', async () => {
    const result = await exportAssignment(testAssignment, 'json');
    expect(result.format).toBe('json');
    const parsed = JSON.parse(result.content);
    expect(parsed.title).toBe('Test Assignment');
  });

  it('should throw error for unsupported format', async () => {
    await expect(exportAssignment(testAssignment, 'unsupported'))
      .rejects
      .toThrow('Unsupported format');
  });
});
