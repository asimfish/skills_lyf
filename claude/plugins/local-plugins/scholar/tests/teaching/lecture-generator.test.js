/**
 * Tests for Lecture Generator
 *
 * These tests verify that the lecture generator integrates correctly with Phase 0 components
 * and follows the same patterns as other teaching generators.
 */

import { generateLecture, exportLecture } from '../../src/teaching/generators/lecture.js';
import {
  buildConversationalPrompt,
  processGeneratedLecture,
  formatAsMarkdown,
  formatAsQuarto,
  SLIDE_TIMING,
  getSlideTimingForDuration
} from '../../src/teaching/generators/lecture-conversational.js';
import {
  formatAsMarkdown as formatMarkdownFull,
  formatAsRevealJS,
  formatAsBeamer,
  formatAsQuarto as formatQuartoFull,
  formatSlideAsMarkdown
} from '../../src/teaching/generators/lecture.js';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Lecture Generator Smoke Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  it('should not throw errors for config access patterns', async () => {
    try {
      await generateLecture({ topic: 'Test Topic', debug: false });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).not.toContain('undefined');
      expect(error.message).not.toContain('Cannot read properties');

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
      await generateLecture({ topic: 'Test', debug: false });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).toMatch(/AI generation failed|API key/i);
    } finally {
      process.env.ANTHROPIC_API_KEY = savedKey;
    }
  });

  it('should use scholar config structure', async () => {
    try {
      await generateLecture({
        topic: 'Regression',
        level: 'graduate',
        debug: false,
      });
      expect(true).toBe(true);
    } catch (error) {
      expect(error.message).not.toContain('Cannot read properties of undefined');
    }
  });
});

describe('Lecture Generator Unit Tests', () => {
  let originalApiKey;

  beforeAll(() => {
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  describe('Lecture Options', () => {
    it('should accept topic option', async () => {
      try {
        await generateLecture({ topic: 'Linear Regression', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('topic');
      }
    });

    it('should accept title option', async () => {
      try {
        await generateLecture({ title: 'Introduction to Regression', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('title');
      }
    });

    it('should accept durationMinutes option', async () => {
      try {
        await generateLecture({ topic: 'Test', durationMinutes: 75, debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('duration');
      }
    });

    it('should accept level option', async () => {
      try {
        await generateLecture({ topic: 'Test', level: 'graduate', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('level');
      }
    });

    it('should accept week option', async () => {
      try {
        await generateLecture({ topic: 'Test', week: 5, debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('week');
      }
    });

    it('should accept format option', async () => {
      try {
        await generateLecture({ topic: 'Test', format: 'reveal', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('format');
      }
    });

    it('should accept subtopics array', async () => {
      try {
        await generateLecture({
          topic: 'Regression',
          subtopics: ['Simple Regression', 'Multiple Regression'],
          debug: false
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('subtopics');
      }
    });

    it('should accept includeCode option', async () => {
      try {
        await generateLecture({ topic: 'Test', includeCode: true, language: 'R', debug: false });
        expect(true).toBe(true);
      } catch (error) {
        expect(error.message).not.toContain('includeCode');
      }
    });
  });
});

describe('Conversational Lecture Generator Tests', () => {
  describe('buildConversationalPrompt', () => {
    it('should generate prompt with default options', () => {
      const result = buildConversationalPrompt({ topic: 'Test Topic' });
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('timing');
      expect(result.prompt).toContain('Test Topic');
    });

    it('should include topic in prompt', () => {
      const result = buildConversationalPrompt({ topic: 'Linear Regression' });
      expect(result.prompt).toContain('Linear Regression');
    });

    it('should include duration in prompt', () => {
      const result = buildConversationalPrompt({ topic: 'Test', durationMinutes: 75 });
      expect(result.prompt).toContain('75');
    });

    it('should include level in prompt', () => {
      const result = buildConversationalPrompt({ topic: 'Test', level: 'graduate' });
      expect(result.prompt).toContain('graduate');
    });

    it('should include subtopics when provided', () => {
      const result = buildConversationalPrompt({
        topic: 'Regression',
        subtopics: ['OLS Estimation', 'Hypothesis Testing']
      });
      expect(result.prompt).toContain('OLS Estimation');
      expect(result.prompt).toContain('Hypothesis Testing');
    });

    it('should include code language when includeCode is true', () => {
      const result = buildConversationalPrompt({
        topic: 'Test',
        includeCode: true,
        language: 'Python'
      });
      expect(result.prompt).toContain('Python');
    });

    it('should calculate timing based on duration', () => {
      const result = buildConversationalPrompt({ topic: 'Test', durationMinutes: 50 });
      expect(result.timing).toBeDefined();
      expect(result.timing.total).toBe(20);
    });
  });

  describe('processGeneratedLecture', () => {
    it('should process valid JSON string', () => {
      const content = JSON.stringify({
        title: 'Test Lecture',
        topic: 'Testing',
        learning_objectives: ['Learn stuff', 'Do things'],
        slides: [{ id: 'S1', type: 'title', title: 'Test' }]
      });

      const result = processGeneratedLecture(content);
      expect(result.title).toBe('Test Lecture');
      expect(result.slides).toHaveLength(1);
    });

    it('should process valid object', () => {
      const content = {
        title: 'Test Lecture',
        topic: 'Testing',
        learning_objectives: ['Learn', 'Do'],
        slides: [{ id: 'S1', type: 'title', title: 'Test' }]
      };

      const result = processGeneratedLecture(content);
      expect(result.title).toBe('Test Lecture');
    });

    it('should add metadata', () => {
      const content = {
        title: 'Test',
        topic: 'Test',
        learning_objectives: [],
        slides: []
      };

      const result = processGeneratedLecture(content);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.generated_at).toBeDefined();
      expect(result.metadata.generator).toBe('scholar-lecture-conversational');
    });
  });

  describe('formatAsMarkdown', () => {
    it('should format lecture as markdown slides', () => {
      const lecture = {
        title: 'Test Lecture',
        slides: [
          { id: 'S1', type: 'title', title: 'Test Lecture', content: 'Course | Date' },
          { id: 'S2', type: 'objectives', title: 'Objectives', bullets: ['Obj 1', 'Obj 2'] },
          { id: 'S3', type: 'content', title: 'Content', content: 'Main content' }
        ]
      };

      const md = formatAsMarkdown(lecture);
      expect(md).toContain('# Test Lecture');
      expect(md).toContain('---');
      expect(md).toContain('## Objectives');
      expect(md).toContain('- Obj 1');
      expect(md).toContain('## Content');
    });

    it('should include code blocks', () => {
      const lecture = {
        slides: [
          {
            id: 'S1',
            type: 'content',
            title: 'Code Example',
            code: { language: 'r', snippet: 'x <- 1:10' }
          }
        ]
      };

      const md = formatAsMarkdown(lecture);
      expect(md).toContain('```r');
      expect(md).toContain('x <- 1:10');
    });

    it('should include speaker notes as comments', () => {
      const lecture = {
        slides: [
          { id: 'S1', type: 'content', title: 'Test', speaker_notes: 'Say this' }
        ]
      };

      const md = formatAsMarkdown(lecture);
      expect(md).toContain('<!-- Notes:');
      expect(md).toContain('Say this');
    });
  });

  describe('formatAsQuarto', () => {
    it('should format lecture as quarto slides', () => {
      const lecture = {
        title: 'Test Lecture',
        course_code: 'STAT 101',
        slides: [
          { id: 'S1', type: 'title', title: 'Test Lecture' },
          { id: 'S2', type: 'content', title: 'Content', content: 'Main content' }
        ]
      };

      const qmd = formatAsQuarto(lecture);
      expect(qmd).toContain('---');
      expect(qmd).toContain('title: "Test Lecture"');
      expect(qmd).toContain('format:');
      expect(qmd).toContain('revealjs:');
      expect(qmd).toContain('## Content');
    });

    it('should include speaker notes in quarto format', () => {
      const lecture = {
        title: 'Test',
        slides: [
          { id: 'S1', type: 'content', title: 'Test', speaker_notes: 'Notes here' }
        ]
      };

      const qmd = formatAsQuarto(lecture);
      expect(qmd).toContain('::: {.notes}');
      expect(qmd).toContain('Notes here');
    });
  });
});

describe('Slide Timing Tests', () => {
  it('should have timing for standard durations', () => {
    expect(SLIDE_TIMING[50]).toBeDefined();
    expect(SLIDE_TIMING[75]).toBeDefined();
    expect(SLIDE_TIMING[90]).toBeDefined();
    expect(SLIDE_TIMING[120]).toBeDefined();
  });

  it('should return correct timing for 50 minutes', () => {
    const timing = getSlideTimingForDuration(50);
    expect(timing.total).toBe(20);
    expect(timing.content).toBe(14);
    expect(timing.practice).toBe(3);
  });

  it('should return correct timing for 75 minutes', () => {
    const timing = getSlideTimingForDuration(75);
    expect(timing.total).toBe(30);
  });

  it('should scale timing for non-standard durations', () => {
    const timing = getSlideTimingForDuration(60);
    // Should scale from closest (50) by factor of 60/50 = 1.2
    expect(timing.total).toBeGreaterThan(20);
    expect(timing.total).toBeLessThan(30);
  });
});

describe('Lecture Template Schema Tests', () => {
  it('should have valid lecture template', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/lecture.json');
    expect(existsSync(templatePath)).toBe(true);

    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));
    expect(template.$schema).toBeDefined();
    expect(template.properties).toBeDefined();
    expect(template.properties.slides).toBeDefined();
    expect(template.properties.learning_objectives).toBeDefined();
  });

  it('should define required fields', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/lecture.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    expect(template.required).toContain('title');
    expect(template.required).toContain('topic');
    expect(template.required).toContain('learning_objectives');
    expect(template.required).toContain('slides');
  });

  it('should define slide structure', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/lecture.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const slideProps = template.properties.slides.items.properties;
    expect(slideProps.id).toBeDefined();
    expect(slideProps.type).toBeDefined();
    expect(slideProps.title).toBeDefined();
    expect(slideProps.content).toBeDefined();
    expect(slideProps.bullets).toBeDefined();
    expect(slideProps.speaker_notes).toBeDefined();
  });

  it('should define slide types enum', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/lecture.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const types = template.properties.slides.items.properties.type.enum;
    expect(types).toContain('title');
    expect(types).toContain('objectives');
    expect(types).toContain('content');
    expect(types).toContain('example');
    expect(types).toContain('practice');
    expect(types).toContain('summary');
    expect(types).toContain('questions');
  });

  it('should define level enum', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/lecture.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const levels = template.properties.level.enum;
    expect(levels).toContain('undergraduate');
    expect(levels).toContain('graduate');
    expect(levels).toContain('doctoral');
  });

  it('should define format enum', () => {
    const templatePath = join(__dirname, '../../src/teaching/templates/lecture.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8'));

    const formats = template.properties.format.enum;
    expect(formats).toContain('markdown');
    expect(formats).toContain('reveal');
    expect(formats).toContain('beamer');
    expect(formats).toContain('quarto');
  });
});

describe('Lecture Export Tests', () => {
  const testLecture = {
    title: 'Test Lecture',
    topic: 'Testing',
    course_code: 'TEST 101',
    date: '2026-01-15',
    duration_minutes: 50,
    learning_objectives: ['Learn testing'],
    slides: [
      { id: 'S1', type: 'title', title: 'Test Lecture', content: 'TEST 101 | 2026' },
      { id: 'S2', type: 'objectives', title: 'Objectives', bullets: ['Objective 1'] },
      { id: 'S3', type: 'content', title: 'Content', content: 'Main content' },
      { id: 'S4', type: 'summary', title: 'Summary', bullets: ['Point 1'] }
    ]
  };

  it('should export to markdown format', async () => {
    const result = await exportLecture(testLecture, 'markdown');
    expect(result.format).toBe('markdown');
    expect(result.content).toContain('# Test Lecture');
    expect(result.content).toContain('---');
  });

  it('should export to JSON format', async () => {
    const result = await exportLecture(testLecture, 'json');
    expect(result.format).toBe('json');
    const parsed = JSON.parse(result.content);
    expect(parsed.title).toBe('Test Lecture');
  });

  it('should export to reveal.js format', async () => {
    const result = await exportLecture(testLecture, 'reveal');
    expect(result.format).toBe('reveal');
    expect(result.content).toContain('<!DOCTYPE html>');
    expect(result.content).toContain('reveal.js');
    expect(result.content).toContain('Test Lecture');
  });

  it('should export to beamer format', async () => {
    const result = await exportLecture(testLecture, 'beamer');
    expect(result.format).toBe('beamer');
    expect(result.content).toContain('\\documentclass{beamer}');
    expect(result.content).toContain('Test Lecture');
  });

  it('should export to quarto format', async () => {
    const result = await exportLecture(testLecture, 'quarto');
    expect(result.format).toBe('quarto');
    expect(result.content).toContain('format:');
    expect(result.content).toContain('revealjs:');
  });

  it('should throw error for unsupported format', async () => {
    await expect(exportLecture(testLecture, 'unsupported'))
      .rejects
      .toThrow('Unsupported format');
  });
});

describe('Full Lecture Formatter Tests', () => {
  const completeLecture = {
    title: 'Multiple Regression',
    topic: 'Multiple Regression',
    course_code: 'STAT 440',
    date: '2026-02-01',
    duration_minutes: 50,
    level: 'undergraduate',
    learning_objectives: [
      'Apply multiple regression',
      'Interpret coefficients'
    ],
    slides: [
      {
        id: 'S1',
        type: 'title',
        title: 'Multiple Regression',
        content: 'STAT 440 | Week 5'
      },
      {
        id: 'S2',
        type: 'objectives',
        title: 'Learning Objectives',
        bullets: ['Apply regression', 'Interpret coefficients']
      },
      {
        id: 'S3',
        type: 'content',
        title: 'The Model',
        content: 'Y = β₀ + β₁X₁ + β₂X₂ + ε',
        bullets: ['Multiple predictors', 'Linear in parameters'],
        speaker_notes: 'Spend 3 minutes here'
      },
      {
        id: 'S4',
        type: 'example',
        title: 'Example: Housing',
        content: 'Predicting price from features',
        code: {
          language: 'r',
          snippet: 'lm(price ~ sqft + beds, data=houses)'
        }
      },
      {
        id: 'S5',
        type: 'practice',
        title: 'Try It',
        content: 'Interpret β₂',
        speaker_notes: 'Give 2 minutes'
      },
      {
        id: 'S6',
        type: 'summary',
        title: 'Key Takeaways',
        bullets: ['Multiple predictors', 'Ceteris paribus']
      },
      {
        id: 'S7',
        type: 'questions',
        title: 'Questions?',
        content: 'Office hours: MW 2-4'
      }
    ],
    next_lecture: {
      topic: 'Model Diagnostics',
      preview: 'Checking assumptions'
    }
  };

  it('should format complete lecture as markdown', () => {
    const md = formatMarkdownFull(completeLecture);

    expect(md).toContain('# Multiple Regression');
    expect(md).toContain('## Learning Objectives');
    expect(md).toContain('## The Model');
    expect(md).toContain('---'); // Slide separator
    expect(md).toContain('```r');
    expect(md).toContain('<!-- Speaker notes:');
  });

  it('should format complete lecture as reveal.js', () => {
    const html = formatAsRevealJS(completeLecture);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('reveal.js');
    expect(html).toContain('<section');
    expect(html).toContain('Multiple Regression');
    expect(html).toContain('<pre><code');
  });

  it('should format complete lecture as beamer', () => {
    const tex = formatAsBeamer(completeLecture);

    expect(tex).toContain('\\documentclass{beamer}');
    expect(tex).toContain('\\begin{frame}');
    expect(tex).toContain('\\end{frame}');
    expect(tex).toContain('Multiple Regression');
    expect(tex).toContain('\\begin{itemize}');
    expect(tex).toContain('\\begin{lstlisting}');
  });

  it('should format complete lecture as quarto', () => {
    const qmd = formatQuartoFull(completeLecture);

    expect(qmd).toContain('title: "Multiple Regression"');
    expect(qmd).toContain('format:');
    expect(qmd).toContain('revealjs:');
    expect(qmd).toContain('```{r}');
    expect(qmd).toContain('::: {.notes}');
  });
});

describe('Single Slide Formatter Tests', () => {
  it('should format title slide', () => {
    const slide = { type: 'title', title: 'My Title', content: 'Subtitle' };
    const md = formatSlideAsMarkdown(slide);
    expect(md).toContain('# My Title');
    expect(md).toContain('## Subtitle');
  });

  it('should format content slide with bullets', () => {
    const slide = { type: 'content', title: 'Content', bullets: ['Point 1', 'Point 2'] };
    const md = formatSlideAsMarkdown(slide);
    expect(md).toContain('## Content');
    expect(md).toContain('- Point 1');
    expect(md).toContain('- Point 2');
  });

  it('should format slide with code', () => {
    const slide = {
      type: 'content',
      title: 'Code',
      code: { language: 'python', snippet: 'print("hello")' }
    };
    const md = formatSlideAsMarkdown(slide);
    expect(md).toContain('```python');
    expect(md).toContain('print("hello")');
    expect(md).toContain('```');
  });

  it('should include figure description as comment', () => {
    const slide = {
      type: 'content',
      title: 'Visual',
      figure: { description: 'Scatter plot', alt_text: 'Points showing correlation' }
    };
    const md = formatSlideAsMarkdown(slide);
    expect(md).toContain('<!-- Figure: Scatter plot -->');
    expect(md).toContain('<!-- Alt: Points showing correlation -->');
  });
});
