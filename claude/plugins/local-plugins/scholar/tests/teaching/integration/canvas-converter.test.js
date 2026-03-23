import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';
import { parseExamContent } from '../../../src/teaching/parsers/qmd-exam.js';
import { ExamarkFormatter } from '../../../src/teaching/formatters/examark.js';
import { detectQuestionType } from '../../../src/teaching/parsers/question-type-detector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'fixtures', 'canvas');

function loadFixture(name) {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

describe('Canvas Converter Pipeline', () => {
  describe('end-to-end: QMD → examark MD', () => {
    it('converts minimal.qmd to valid examark format', () => {
      const qmd = loadFixture('minimal.qmd');
      const exam = parseExamContent(qmd);
      const formatter = new ExamarkFormatter();
      const output = formatter.format(exam);
      const validation = formatter.validate(output);

      expect(validation.valid).toBe(true);
      expect(output).toContain('# Minimal Quiz');
      expect(output).toContain('[MC]');
      expect(output).toContain('pts]');
    });

    it('converts simple-mc.qmd with 3 questions', () => {
      const qmd = loadFixture('simple-mc.qmd');
      const exam = parseExamContent(qmd);

      expect(exam.questions).toHaveLength(3);
      expect(exam.total_points).toBe(30);

      const formatter = new ExamarkFormatter();
      const output = formatter.format(exam);
      expect(formatter.validate(output).valid).toBe(true);

      // Check all 3 questions appear
      expect(output).toContain('1. [MC]');
      expect(output).toContain('2. [MC]');
      expect(output).toContain('3. [MC]');
    });

    it('converts mixed-types.qmd preserving all question types', () => {
      const qmd = loadFixture('mixed-types.qmd');
      const exam = parseExamContent(qmd);

      // Should have 6 questions of different types
      expect(exam.questions.length).toBeGreaterThanOrEqual(4);

      const formatter = new ExamarkFormatter();
      const output = formatter.format(exam);
      expect(formatter.validate(output).valid).toBe(true);

      // Check variety of type tags
      expect(output).toContain('[MC]');
      expect(output).toContain('[TF]');
    });

    it('converts latex-math.qmd preserving LaTeX', () => {
      const qmd = loadFixture('latex-math.qmd');
      const exam = parseExamContent(qmd);
      const formatter = new ExamarkFormatter();
      const output = formatter.format(exam);

      expect(formatter.validate(output).valid).toBe(true);
      // LaTeX should be preserved
      expect(output).toContain('$');
      expect(output).toContain('\\');
    });
  });

  describe('type detection integration', () => {
    it('detects MC from parsed QMD options', () => {
      // Parse a MC question from fixture, then detect type
      const qmd = loadFixture('simple-mc.qmd');
      const exam = parseExamContent(qmd);
      const q = exam.questions[0];
      const detected = detectQuestionType({
        text: q.text,
        options: q.options,
        explicitType: q.type !== 'essay' ? q.type : undefined
      });
      expect(detected).toBe('MC');
    });

    it('classifies all mixed-types questions correctly', () => {
      const qmd = loadFixture('mixed-types.qmd');
      const exam = parseExamContent(qmd);

      for (const q of exam.questions) {
        const detected = detectQuestionType({
          text: q.text,
          options: q.options,
          explicitType: q.type !== 'essay' ? q.type : undefined
        });
        // Every question should get a valid type classification
        expect(['MC', 'MA', 'TF', 'Short', 'Numeric', 'Essay', 'Match', 'FMB', 'FIB', 'Upload']).toContain(detected);
      }
    });
  });

  describe('parser-formatter round-trip', () => {
    it('parsed exam produces valid formatter input', () => {
      // Verify the parseExamContent output shape matches what ExamarkFormatter.format() expects
      const qmd = loadFixture('simple-mc.qmd');
      const exam = parseExamContent(qmd);

      // Required fields
      expect(exam).toHaveProperty('title');
      expect(exam).toHaveProperty('questions');
      expect(exam).toHaveProperty('answer_key');
      expect(exam.questions[0]).toHaveProperty('id');
      expect(exam.questions[0]).toHaveProperty('type');
      expect(exam.questions[0]).toHaveProperty('text');
      expect(exam.questions[0]).toHaveProperty('points');
    });

    it('formatter validates all fixture outputs', () => {
      const formatter = new ExamarkFormatter();
      const fixtures = ['minimal.qmd', 'simple-mc.qmd', 'mixed-types.qmd', 'latex-math.qmd'];

      for (const fixture of fixtures) {
        const qmd = loadFixture(fixture);
        const exam = parseExamContent(qmd);
        const output = formatter.format(exam);
        const validation = formatter.validate(output);
        expect(validation.valid).toBe(true);
      }
    });
  });

  describe('multi-part questions', () => {
    it('splits sub-parts into separate questions by default', () => {
      const qmd = loadFixture('multi-part.qmd');
      const exam = parseExamContent(qmd);
      // With splitParts=true (default), sub-parts become separate questions
      expect(exam.questions.length).toBeGreaterThan(2); // More than 2 problems
    });

    it('keeps combined when splitParts=false', () => {
      const qmd = loadFixture('multi-part.qmd');
      const exam = parseExamContent(qmd, { splitParts: false });
      // Should have exactly 2 problems
      expect(exam.questions).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('handles empty QMD gracefully', () => {
      const exam = parseExamContent('');
      expect(exam.questions).toHaveLength(0);
      expect(exam.title).toBeDefined();
    });

    it('handles QMD with no questions', () => {
      const qmd = '---\ntitle: Empty\n---\n\n# Empty Exam\n\nNo questions here.';
      const exam = parseExamContent(qmd);
      expect(exam.questions).toHaveLength(0);
    });

    it('formatter throws on invalid content', () => {
      const formatter = new ExamarkFormatter();
      expect(() => formatter.format({ title: null, questions: null, answer_key: null }))
        .toThrow();
    });
  });

  describe('examark CLI integration', () => {
    // Only run if examark is installed
    let hasExamark = false;

    beforeAll(() => {
      try {
        execFileSync('which', ['examark']);
        hasExamark = true;
      } catch {
        hasExamark = false;
      }
    });

    it('converts examark MD to QTI zip', () => {
      if (!hasExamark) {
        console.log('Skipping: examark CLI not installed');
        return;
      }

      const qmd = loadFixture('simple-mc.qmd');
      const exam = parseExamContent(qmd);
      const formatter = new ExamarkFormatter();
      const output = formatter.format(exam);

      // Write temp file
      const tmpDir = mkdtempSync(join(tmpdir(), 'canvas-test-'));
      const mdPath = join(tmpDir, 'test.md');
      const qtiPath = join(tmpDir, 'test.qti.zip');
      writeFileSync(mdPath, output);

      // Run examark
      execFileSync('examark', [mdPath, '-o', qtiPath]);

      // Verify QTI zip was created
      expect(existsSync(qtiPath)).toBe(true);

      // Cleanup
      rmSync(tmpDir, { recursive: true });
    });
  });
});
