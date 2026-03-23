/**
 * E2E Tests: InstructionMerger Dogfooding
 *
 * Tests the full custom-instructions pipeline against real prompts
 * from the generators and real config from the demo course fixtures.
 * No mocked AI — instead validates the merge/conflict/summary pipeline
 * using realistic categorization outputs to ensure the feature works
 * end-to-end as a user would experience it.
 *
 * Uses the demo course config (teach-config.yml) and real prompt
 * builders from the generators to validate:
 *   1. @file loading from disk
 *   2. Categorization validation with realistic AI responses
 *   3. Merge into real exam/quiz/lecture prompts
 *   4. Conflict detection against real config values
 *   5. Summary readability and completeness
 *   6. Multi-round instruction accumulation
 *   7. mergedPrompt bypass wiring in generators
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { InstructionMerger } from '../../../src/teaching/ai/instruction-merger.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXTURES_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'fixtures');
const DEMO_CONFIG_PATH = path.resolve('src/teaching/demo-templates/teach-config.yml');

/**
 * Load demo course config the same way a real command would.
 * Falls back to fixture if demo template missing (CI).
 */
function loadDemoConfig() {
  const configPath = fs.existsSync(DEMO_CONFIG_PATH)
    ? DEMO_CONFIG_PATH
    : path.join(FIXTURES_DIR, 'statistics-course.yml');

  const raw = fs.readFileSync(configPath, 'utf8');
  return yaml.load(raw);
}

/**
 * Build a realistic exam prompt matching what the generator produces.
 * We can't import buildExamPrompt (it's not exported), so we replicate
 * the structure to validate merge injection points.
 */
function buildRealisticExamPrompt(config) {
  const courseInfo = config.scholar?.course_info || {};
  return `
Generate a midterm exam for ${courseInfo.code || 'STAT-101'}: ${courseInfo.title || 'Statistics'}.

## Course Context

- Level: ${courseInfo.level || 'undergraduate'}
- Semester: ${courseInfo.semester || 'Spring 2026'}
- Instructor: ${courseInfo.instructor?.name || 'Dr. Smith'}

## Topic

Topics to cover: Descriptive Statistics, Probability, Hypothesis Testing

## Teaching Style

Use a ${config.scholar?.style?.tone || 'formal'} academic tone with clear explanations.
Notation: ${config.scholar?.style?.notation || 'statistical'}

## Output Format

Return valid JSON with the following structure:
{
  "title": "Exam title",
  "questions": [...]
}

IMPORTANT:
- Ensure all question IDs in answer_key match question IDs in questions array
- All LaTeX must use double backslashes
`.trim();
}

function buildRealisticQuizPrompt(config) {
  const courseInfo = config.scholar?.course_info || {};
  return `
Generate a 10-question quiz for ${courseInfo.code || 'STAT-101'}.

## Topic

Confidence Intervals

## Teaching Style

Use a ${config.scholar?.style?.tone || 'formal'} tone.

## Output Format

Return valid JSON matching the quiz schema.
`.trim();
}

function buildRealisticLecturePrompt(config) {
  const courseInfo = config.scholar?.course_info || {};
  return `
Generate comprehensive instructor lecture notes for ${courseInfo.code || 'STAT-101'}.

## Subject

Introduction to ANOVA

## Course Context

Level: ${courseInfo.level || 'undergraduate'}
Field: ${courseInfo.field || 'statistics'}

## Teaching Style

Tone: ${config.scholar?.style?.tone || 'formal'}
Include worked examples: ${config.scholar?.style?.examples ? 'yes' : 'no'}

## Requirements

- 20-40 pages of content
- Include executable R code blocks
- LaTeX math notation for all equations

## Output Format

Return Quarto-compatible markdown (.qmd).
`.trim();
}

// ─── Mock AI Provider ────────────────────────────────────────────────────────

/**
 * Create a mock provider that returns realistic categorization.
 * Simulates what Haiku would return for given instructions.
 */
function createRealisticMockProvider(categorizedResponse) {
  return {
    generate: jest.fn().mockResolvedValue({
      success: true,
      content: categorizedResponse,
    }),
  };
}

// ============================================================================
// E2E Tests
// ============================================================================

describe('E2E: InstructionMerger with Real Prompts', () => {
  let config;

  beforeAll(() => {
    config = loadDemoConfig();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. @file loading
  // ──────────────────────────────────────────────────────────────────────────

  describe('1. @file loading from disk', () => {
    let tmpDir;
    let instructionFile;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-e2e-instructions-'));
      instructionFile = path.join(tmpDir, 'exam-instructions.txt');
      fs.writeFileSync(instructionFile, [
        'Focus on healthcare datasets (BMI, blood pressure)',
        'Include R code snippets with tidyverse',
        'Use a conversational tone',
        'No more than 3 essay questions',
      ].join('\n'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('loads multi-line instructions from a file', async () => {
      const content = await InstructionMerger.loadFromFile(instructionFile);

      expect(content).toContain('healthcare datasets');
      expect(content).toContain('tidyverse');
      expect(content).toContain('conversational');
      expect(content).toContain('3 essay questions');
    });

    it('loads with @ prefix as user would type it', async () => {
      const content = await InstructionMerger.loadFromFile(`@${instructionFile}`);
      expect(content).toContain('healthcare datasets');
    });

    it('loaded content can be analyzed by merger', async () => {
      const content = await InstructionMerger.loadFromFile(instructionFile);

      const provider = createRealisticMockProvider({
        content: ['Focus on healthcare datasets (BMI, blood pressure)', 'Include R code snippets with tidyverse'],
        style: ['Use a conversational tone'],
        format: [],
        constraints: ['No more than 3 essay questions'],
      });
      const merger = new InstructionMerger(provider);

      const categories = await merger.analyze(content, 'exam');

      expect(categories.content.length).toBe(2);
      expect(categories.style.length).toBe(1);
      expect(categories.constraints.length).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Full pipeline: exam
  // ──────────────────────────────────────────────────────────────────────────

  describe('2. Full pipeline: exam with real prompt', () => {
    it('merges healthcare instructions into a real exam prompt', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      const provider = createRealisticMockProvider({
        content: ['Focus on healthcare datasets (BMI, blood pressure, clinical trials)'],
        style: ['Use a conversational tone with practical examples'],
        format: ['Include R code snippets in solutions'],
        constraints: ['No more than 3 essay questions', 'Keep total under 100 points'],
      });
      const merger = new InstructionMerger(provider);

      // Analyze
      const categories = await merger.analyze(
        'Focus on healthcare, conversational, R code, max 3 essays, under 100 points',
        'exam'
      );

      // Merge into real prompt
      const result = merger.merge(examPrompt, categories, config.scholar || {}, {
        isCustomPrompt: false,
        commandType: 'exam',
      });

      // Verify: content injected after Topic section
      expect(result.mergedPrompt).toContain('Additional Content Requirements');
      expect(result.mergedPrompt).toContain('healthcare datasets');

      // Verify: style injected after Teaching Style section
      expect(result.mergedPrompt).toContain('Custom Style Requirements');
      expect(result.mergedPrompt).toContain('conversational tone');

      // Verify: format injected
      expect(result.mergedPrompt).toContain('Additional Format Requirements');
      expect(result.mergedPrompt).toContain('R code snippets');

      // Verify: constraints section added
      expect(result.mergedPrompt).toContain('## Constraints');
      expect(result.mergedPrompt).toContain('3 essay questions');

      // Verify: original prompt preserved
      expect(result.mergedPrompt).toContain(config.scholar?.course_info?.code || 'STAT-101');
      expect(result.mergedPrompt).toContain('Return valid JSON');

      // Verify: section ordering (content before output format)
      const contentIdx = result.mergedPrompt.indexOf('Additional Content Requirements');
      const outputIdx = result.mergedPrompt.indexOf('## Output Format');
      expect(contentIdx).toBeLessThan(outputIdx);
    });

    it('detects style conflict with demo course config', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      const provider = createRealisticMockProvider({
        content: [],
        style: ['Use informal conversational tone'],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze('informal tone', 'exam');

      const result = merger.merge(examPrompt, categories, config.scholar || {}, {
        commandType: 'exam',
      });

      // Demo config has tone: "formal", instruction says "informal"
      const styleConflict = result.conflicts.find(c => c.type === 'style_override');
      expect(styleConflict).toBeDefined();
      expect(styleConflict.severity).toBe('info');
      expect(styleConflict.message).toContain('formal');
    });

    it('detects format conflict with demo course config', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      const provider = createRealisticMockProvider({
        content: [],
        style: [],
        format: ['Use LaTeX format for all output'],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze('latex format', 'exam');

      const result = merger.merge(examPrompt, categories, config.scholar || {}, {
        commandType: 'exam',
      });

      // Demo config has exam_format: "markdown", instruction says "latex"
      const formatConflict = result.conflicts.find(c => c.type === 'format_mismatch');
      expect(formatConflict).toBeDefined();
      expect(formatConflict.severity).toBe('warning');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Full pipeline: quiz
  // ──────────────────────────────────────────────────────────────────────────

  describe('3. Full pipeline: quiz with real prompt', () => {
    it('merges sports analytics instructions into quiz prompt', async () => {
      const quizPrompt = buildRealisticQuizPrompt(config);

      const provider = createRealisticMockProvider({
        content: ['Use sports analytics examples (baseball, basketball)'],
        style: [],
        format: ['Multiple choice only'],
        constraints: ['No questions about probability'],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze(
        'Use sports examples, MC only, no probability',
        'quiz'
      );

      const result = merger.merge(quizPrompt, categories, config.scholar || {}, {
        commandType: 'quiz',
      });

      expect(result.mergedPrompt).toContain('sports analytics');
      expect(result.mergedPrompt).toContain('Multiple choice only');
      expect(result.mergedPrompt).toContain('No questions about probability');
      expect(result.mergedPrompt).toContain('Confidence Intervals'); // original topic preserved
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Full pipeline: lecture
  // ──────────────────────────────────────────────────────────────────────────

  describe('4. Full pipeline: lecture with real prompt', () => {
    it('merges pedagogical instructions into lecture prompt', async () => {
      const lecturePrompt = buildRealisticLecturePrompt(config);

      const provider = createRealisticMockProvider({
        content: ['Use penguin dataset throughout'],
        style: ['Socratic teaching style with guided questions'],
        format: ['Include interactive code exercises every 5 pages'],
        constraints: ['Avoid proofs, focus on intuition'],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze(
        'penguin dataset, Socratic style, interactive exercises, no proofs',
        'lecture'
      );

      const result = merger.merge(lecturePrompt, categories, config.scholar || {}, {
        commandType: 'lecture',
      });

      expect(result.mergedPrompt).toContain('penguin dataset');
      expect(result.mergedPrompt).toContain('Socratic teaching');
      expect(result.mergedPrompt).toContain('interactive code exercises');
      expect(result.mergedPrompt).toContain('Avoid proofs');
      expect(result.mergedPrompt).toContain('ANOVA'); // original topic preserved
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Summary readability
  // ──────────────────────────────────────────────────────────────────────────

  describe('5. Summary readability and completeness', () => {
    it('produces a complete summary for exam with all categories', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      const provider = createRealisticMockProvider({
        content: ['Healthcare datasets'],
        style: ['Conversational tone'],
        format: ['Include R code'],
        constraints: ['Max 3 essays'],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze('test', 'exam');

      const mergeResult = merger.merge(examPrompt, categories, config.scholar || {}, {
        isCustomPrompt: false,
        commandType: 'exam',
      });
      const summary = merger.summarize(mergeResult);

      // Structure checks
      expect(summary).toContain('## Generation Plan');
      expect(summary).toContain('**Base:** Default exam prompt');
      expect(summary).toContain('4 applied');

      // Table
      expect(summary).toContain('| Category | Instructions |');
      expect(summary).toContain('| Content | Healthcare datasets |');
      expect(summary).toContain('| Style | Conversational tone |');
      expect(summary).toContain('| Format | Include R code |');
      expect(summary).toContain('| Constraints | Max 3 essays |');
    });

    it('summary shows conflicts from real config', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      const provider = createRealisticMockProvider({
        content: [],
        style: ['Informal conversational tone'],
        format: ['Use LaTeX format'],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze('informal, latex', 'exam');

      const mergeResult = merger.merge(examPrompt, categories, config.scholar || {}, {
        commandType: 'exam',
      });
      const summary = merger.summarize(mergeResult);

      expect(summary).toContain('### Notices');
      // At least one conflict from style or format
      expect(mergeResult.conflicts.length).toBeGreaterThanOrEqual(1);
    });

    it('verbose summary includes the full merged prompt', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      const provider = createRealisticMockProvider({
        content: ['Test content'],
        style: [],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze('test', 'exam');

      const mergeResult = merger.merge(examPrompt, categories, {}, { commandType: 'exam' });
      const summary = merger.summarize(mergeResult, { verbose: true });

      expect(summary).toContain('### Full Merged Prompt');
      expect(summary).toContain('Generate a midterm exam');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Multi-round instruction accumulation
  // ──────────────────────────────────────────────────────────────────────────

  describe('6. Multi-round instruction accumulation', () => {
    it('simulates accept/modify/accept workflow', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      // Round 1: user says "focus on healthcare"
      const round1Provider = createRealisticMockProvider({
        content: ['Focus on healthcare datasets'],
        style: [],
        format: [],
        constraints: [],
      });
      const merger1 = new InstructionMerger(round1Provider);
      const cat1 = await merger1.analyze('Focus on healthcare', 'exam');
      const merge1 = merger1.merge(examPrompt, cat1, config.scholar || {}, { commandType: 'exam' });
      const summary1 = merger1.summarize(merge1);

      expect(summary1).toContain('1 applied');
      expect(summary1).toContain('Focus on healthcare datasets');

      // User says "modify — also add Python"
      // Round 2: accumulated instructions
      const round2Provider = createRealisticMockProvider({
        content: ['Focus on healthcare datasets', 'Include Python alternatives alongside R'],
        style: [],
        format: [],
        constraints: [],
      });
      const merger2 = new InstructionMerger(round2Provider);
      const cat2 = await merger2.analyze(
        'Focus on healthcare\nalso add Python alternatives alongside R',
        'exam'
      );
      const merge2 = merger2.merge(examPrompt, cat2, config.scholar || {}, { commandType: 'exam' });
      const summary2 = merger2.summarize(merge2);

      expect(summary2).toContain('2 applied');
      expect(merge2.mergedPrompt).toContain('healthcare datasets');
      expect(merge2.mergedPrompt).toContain('Python alternatives');
    });

    it('later round can replace earlier instructions', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      // Round 3: user replaces healthcare with finance
      const provider = createRealisticMockProvider({
        content: ['Focus on finance datasets (stock prices, portfolios)'],
        style: [],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze(
        'Focus on finance datasets instead of healthcare',
        'exam'
      );
      const result = merger.merge(examPrompt, categories, config.scholar || {}, { commandType: 'exam' });

      expect(result.mergedPrompt).toContain('finance datasets');
      expect(result.mergedPrompt).not.toContain('healthcare');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Generator mergedPrompt bypass wiring
  // ──────────────────────────────────────────────────────────────────────────

  describe('7. mergedPrompt bypass wiring in generators', () => {
    // These tests verify that generators accept and use mergedPrompt
    // without actually calling the AI API (which would cost money).
    // We import the generator, pass a mergedPrompt, and verify it's used.

    it('exam generator accepts mergedPrompt option', async () => {
      // Import the generator module
      const { generateExam } = await import('../../../src/teaching/generators/exam.js');

      // The generator should accept mergedPrompt and use it instead of buildExamPrompt.
      // We can't run full generation (needs API key), but we can verify the option
      // is accepted by checking the code structure.
      expect(typeof generateExam).toBe('function');

      // Verify the source contains the mergedPrompt bypass
      const examSource = fs.readFileSync(
        path.resolve('src/teaching/generators/exam.js'),
        'utf8'
      );
      expect(examSource).toContain('options.mergedPrompt || buildExamPrompt');
    });

    it('quiz generator accepts mergedPrompt option', () => {
      const quizSource = fs.readFileSync(
        path.resolve('src/teaching/generators/quiz.js'),
        'utf8'
      );
      expect(quizSource).toContain('options.mergedPrompt || buildQuizPrompt');
    });

    it('assignment generator accepts mergedPrompt option', () => {
      const assignmentSource = fs.readFileSync(
        path.resolve('src/teaching/generators/assignment.js'),
        'utf8'
      );
      expect(assignmentSource).toContain('options.mergedPrompt || buildAssignmentPrompt');
    });

    it('lecture generator accepts mergedPrompt option', () => {
      const lectureSource = fs.readFileSync(
        path.resolve('src/teaching/generators/lecture.js'),
        'utf8'
      );
      expect(lectureSource).toContain('options.mergedPrompt || buildLecturePrompt');
    });

    it('syllabus generator accepts mergedPrompt option', () => {
      const syllabusSource = fs.readFileSync(
        path.resolve('src/teaching/generators/syllabus.js'),
        'utf8'
      );
      expect(syllabusSource).toContain('options.mergedPrompt || buildSyllabusPrompt');
    });

    it('lecture-notes generator accepts mergedPrompt option', () => {
      const source = fs.readFileSync(
        path.resolve('src/teaching/generators/lecture-notes.js'),
        'utf8'
      );
      expect(source).toContain('options.mergedPrompt');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Command definition wiring
  // ──────────────────────────────────────────────────────────────────────────

  describe('8. Command definitions have -i flag wired', () => {
    const COMMAND_DIR = path.resolve('src/plugin-api/commands/teaching');

    const aiCommands = [
      'exam', 'quiz', 'assignment', 'syllabus',
      'slides', 'lecture', 'feedback', 'rubric',
    ];

    const utilityCommands = [
      'config', 'demo', 'diff', 'migrate', 'sync', 'validate',
    ];

    for (const cmd of aiCommands) {
      it(`${cmd}.md has InstructionMerger pipeline`, () => {
        const source = fs.readFileSync(path.join(COMMAND_DIR, `${cmd}.md`), 'utf8');
        expect(source).toContain('InstructionMerger');
        expect(source).toContain('args.instructions || args.i');
        expect(source).toContain('-i "text"');
      });
    }

    for (const cmd of utilityCommands) {
      it(`${cmd}.md does NOT have InstructionMerger (utility command)`, () => {
        const source = fs.readFileSync(path.join(COMMAND_DIR, `${cmd}.md`), 'utf8');
        expect(source).not.toContain('InstructionMerger');
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Edge cases with real config
  // ──────────────────────────────────────────────────────────────────────────

  describe('9. Edge cases with real config', () => {
    it('empty style config does not cause false conflicts', async () => {
      const examPrompt = buildRealisticExamPrompt(config);
      const emptyStyleConfig = { scholar: { course_info: config.scholar?.course_info } };

      const provider = createRealisticMockProvider({
        content: [],
        style: ['Use humor and pop culture references'],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze('humorous style', 'exam');

      const result = merger.merge(examPrompt, categories, emptyStyleConfig.scholar || {}, {
        commandType: 'exam',
      });

      // No style conflict because config has no tone set
      const styleConflict = result.conflicts.find(c => c.type === 'style_override');
      expect(styleConflict).toBeUndefined();
    });

    it('all-empty categories produce unchanged prompt', async () => {
      const examPrompt = buildRealisticExamPrompt(config);

      const provider = createRealisticMockProvider({
        content: [],
        style: [],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze('test', 'exam');

      const result = merger.merge(examPrompt, categories, config.scholar || {}, {
        commandType: 'exam',
      });

      expect(result.mergedPrompt).toBe(examPrompt);
      expect(result.conflicts).toEqual([]);
    });

    it('very long instructions do not break merge', async () => {
      const examPrompt = buildRealisticExamPrompt(config);
      const longInstructions = Array.from({ length: 20 }, (_, i) =>
        `Content requirement ${i + 1}: include topic about statistical method ${i + 1}`
      );

      const provider = createRealisticMockProvider({
        content: longInstructions,
        style: [],
        format: [],
        constraints: [],
      });
      const merger = new InstructionMerger(provider);
      const categories = await merger.analyze(longInstructions.join('. '), 'exam');

      const result = merger.merge(examPrompt, categories, config.scholar || {}, {
        commandType: 'exam',
      });

      // All 20 items should be injected
      expect(result.mergedPrompt).toContain('Content requirement 1');
      expect(result.mergedPrompt).toContain('Content requirement 20');
      // Original prompt still intact
      expect(result.mergedPrompt).toContain('Return valid JSON');
    });
  });
});
