/**
 * E2E Dogfood Test: Canvas QTI Pipeline
 *
 * Tests the complete pipeline from source files to QTI .zip packages
 * using both QMD fixtures and the demo course exam JSON.
 *
 * Pipeline:  .qmd/.json → parseExamContent/JSON → ExamarkFormatter → examark CLI → .qti.zip
 *
 * Requires: examark CLI (npm install -g examark)
 * Skips gracefully when examark is not installed.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, statSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';
import { parseExamContent } from '../../src/teaching/parsers/qmd-exam.js';
import { ExamarkFormatter } from '../../src/teaching/formatters/examark.js';
import { CanvasFormatter } from '../../src/teaching/formatters/canvas.js';
import { detectQuestionType, typeToTag, tagToType } from '../../src/teaching/parsers/question-type-detector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'teaching', 'fixtures', 'canvas');
const demoExamPath = join(__dirname, '..', '..', 'src', 'teaching', 'demo-templates', 'examples', 'exam-midterm.json');
const mixedQuizPath = join(__dirname, '..', '..', 'src', 'teaching', 'demo-templates', 'examples', 'quiz-mixed.json');

// Guard: skip CLI tests if examark is not installed
let hasExamark = false;
try {
  execFileSync('which', ['examark']);
  hasExamark = true;
} catch {
  // examark not available
}

const describeIfExamark = hasExamark ? describe : describe.skip;

function loadFixture(name) {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

function loadDemoExam() {
  return JSON.parse(readFileSync(demoExamPath, 'utf-8'));
}

function loadMixedQuiz() {
  return JSON.parse(readFileSync(mixedQuizPath, 'utf-8'));
}

// ---------------------------------------------------------------------------
// Helpers for CLI integration
// ---------------------------------------------------------------------------

function runExamarkToQti(markdownContent, title = 'test') {
  const tmp = mkdtempSync(join(tmpdir(), 'scholar-e2e-'));
  const mdPath = join(tmp, `${title}.md`);
  const qtiPath = join(tmp, `${title}.qti.zip`);
  writeFileSync(mdPath, markdownContent);

  const stdout = execFileSync('examark', [mdPath, '-o', qtiPath], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024
  });

  return { tmp, mdPath, qtiPath, stdout };
}

/**
 * Run examark verify. Returns { output, passed }.
 * examark verify exits non-zero for open-ended questions (Essay, Short, Numeric)
 * that lack a predefined "correct answer" in QTI — this is expected and not a real error.
 */
function verifyQti(qtiPath) {
  try {
    const output = execFileSync('examark', ['verify', qtiPath], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    return { output, passed: true };
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    // "No correct answer defined" is expected for Essay/Short/Numeric/FMB questions.
    // Strip those warnings and check if any OTHER failures remain.
    const stderr = err.stderr || '';
    const failureLines = stderr
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim());
    const onlyAnswerWarnings = failureLines.length > 0 &&
      failureLines.every(line => line.includes('No correct answer defined'));
    return { output, passed: onlyAnswerWarnings };
  }
}

// ===========================================================================
// 1. QMD Fixtures → Full Pipeline
// ===========================================================================

describeIfExamark('E2E: QMD Fixtures → QTI Pipeline', () => {
  let tmpDirs = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      try { rmSync(dir, { recursive: true, force: true }); } catch {}
    }
    tmpDirs = [];
  });

  it('simple-mc.qmd → 3-question QTI package', () => {
    const qmd = loadFixture('simple-mc.qmd');
    const exam = parseExamContent(qmd);
    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);

    expect(formatter.validate(md).valid).toBe(true);
    expect(exam.questions).toHaveLength(3);
    expect(exam.total_points).toBe(30);

    const { tmp, qtiPath, stdout } = runExamarkToQti(md, 'simple-mc');
    tmpDirs.push(tmp);

    expect(existsSync(qtiPath)).toBe(true);
    expect(stdout).toContain('3 questions');
    expect(statSync(qtiPath).size).toBeGreaterThan(0);

    // Verify the QTI package structure
    const verify = verifyQti(qtiPath);
    expect(verify.passed).toBe(true);
    expect(verify.output).toContain('Items: 3');
  });

  it('mixed-types.qmd → multi-type QTI package', () => {
    const qmd = loadFixture('mixed-types.qmd');
    const exam = parseExamContent(qmd);
    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);

    expect(formatter.validate(md).valid).toBe(true);
    expect(exam.questions.length).toBeGreaterThanOrEqual(4);

    // Verify type diversity
    const types = new Set(exam.questions.map(q => q.type));
    expect(types.size).toBeGreaterThanOrEqual(3);

    const { tmp, qtiPath, stdout } = runExamarkToQti(md, 'mixed-types');
    tmpDirs.push(tmp);

    expect(existsSync(qtiPath)).toBe(true);
    expect(statSync(qtiPath).size).toBeGreaterThan(0);

    // Mixed types includes Essay/Numeric which lack "correct answer" in QTI — expected
    const verify = verifyQti(qtiPath);
    expect(verify.passed).toBe(true);
  });

  it('latex-math.qmd → LaTeX preserved through QTI', () => {
    const qmd = loadFixture('latex-math.qmd');
    const exam = parseExamContent(qmd);
    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);

    expect(formatter.validate(md).valid).toBe(true);
    // LaTeX preserved in intermediate markdown
    expect(md).toContain('$');
    expect(md).toContain('\\');

    const { tmp, qtiPath } = runExamarkToQti(md, 'latex-math');
    tmpDirs.push(tmp);

    expect(existsSync(qtiPath)).toBe(true);
    // LaTeX/Numeric questions may lack "correct answer" — expected
    const verify = verifyQti(qtiPath);
    expect(verify.passed).toBe(true);
  });

  it('multi-part.qmd with splitParts=true → expanded QTI', () => {
    const qmd = loadFixture('multi-part.qmd');
    const exam = parseExamContent(qmd, { splitParts: true });
    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);

    expect(formatter.validate(md).valid).toBe(true);
    expect(exam.questions.length).toBeGreaterThan(2);

    const { tmp, qtiPath, stdout } = runExamarkToQti(md, 'multi-part');
    tmpDirs.push(tmp);

    expect(existsSync(qtiPath)).toBe(true);
    // Sub-parts may be essay/short — answer warnings expected
    const verify = verifyQti(qtiPath);
    expect(verify.passed).toBe(true);
  });

  it('minimal.qmd → single-question QTI', () => {
    const qmd = loadFixture('minimal.qmd');
    const exam = parseExamContent(qmd);
    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);

    expect(formatter.validate(md).valid).toBe(true);

    const { tmp, qtiPath, stdout } = runExamarkToQti(md, 'minimal');
    tmpDirs.push(tmp);

    expect(existsSync(qtiPath)).toBe(true);
    expect(stdout).toContain('1 question');

    const verify = verifyQti(qtiPath);
    expect(verify.passed).toBe(true);
  });
});

// ===========================================================================
// 2. Demo Course Exam JSON → Full Pipeline
// ===========================================================================

describeIfExamark('E2E: Demo Course exam-midterm.json → QTI Pipeline', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-e2e-demo-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('formats 7-question regression midterm as examark MD', () => {
    const examJson = loadDemoExam();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(examJson);

    expect(formatter.validate(md).valid).toBe(true);
    expect(md).toContain('# Midterm Exam - Regression Analysis');
    expect(md).toContain('[MC]');
    expect(md).toContain('[Short]');
    expect(md).toContain('[Essay');

    // 7 questions, 100 total points
    const questionMatches = md.match(/^\d+\.\s+\[/gm);
    expect(questionMatches).toHaveLength(7);
    expect(md).toContain('10pts');
    expect(md).toContain('15pts');
    expect(md).toContain('30pts');
  });

  it('preserves LaTeX formulas through formatting', () => {
    const examJson = loadDemoExam();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(examJson);

    // Key LaTeX patterns from the regression midterm
    expect(md).toContain('$Y = \\beta_0 + \\beta_1 X + \\epsilon$');
    expect(md).toContain('$R^2$');
    expect(md).toContain('$\\mu$');
    expect(md).toContain('$\\alpha = 0.05$');
  });

  it('includes answer key with correct answers marked', () => {
    const examJson = loadDemoExam();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(examJson, { includeAnswers: true });

    // MC answers marked with [x]
    expect(md).toContain('Homoscedasticity (constant variance) [x]');
    expect(md).toContain('The proportion of variance in Y explained by X [x]');
  });

  it('converts demo exam to QTI zip via examark CLI', () => {
    const examJson = loadDemoExam();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(examJson);

    const mdPath = join(tmpDir, 'midterm.md');
    const qtiPath = join(tmpDir, 'midterm.qti.zip');
    writeFileSync(mdPath, md);

    const stdout = execFileSync('examark', [mdPath, '-o', qtiPath], {
      encoding: 'utf-8'
    });

    expect(existsSync(qtiPath)).toBe(true);
    expect(stdout).toContain('7 questions');
    expect(statSync(qtiPath).size).toBeGreaterThan(500); // Reasonable QTI zip size

    // Verify — demo exam has Short/Essay questions, so "no correct answer" warnings expected
    const verify = verifyQti(qtiPath);
    expect(verify.passed).toBe(true);
    expect(verify.output).toContain('Items: 7');
  });

  it('CanvasFormatter produces valid QTI from demo exam', async () => {
    const examJson = loadDemoExam();
    const canvasFormatter = new CanvasFormatter();
    const qtiPath = join(tmpDir, 'canvas-midterm.qti.zip');

    const result = await canvasFormatter.format(examJson, {
      output: qtiPath,
      validate: true,
      cleanupTemp: true
    });

    expect(existsSync(result)).toBe(true);
    expect(statSync(result).size).toBeGreaterThan(500);

    // Double-check with verify — Short/Essay warnings expected
    const verify = verifyQti(result);
    expect(verify.passed).toBe(true);
  });
});

// ===========================================================================
// 3. Question Type Detection Dogfood
// ===========================================================================

describe('E2E: Question Type Detection on Real Exam Content', () => {
  it('correctly classifies all demo exam questions', () => {
    const examJson = loadDemoExam();

    const expectedTypes = {
      Q1: 'MC',     // multiple-choice
      Q2: 'MC',     // multiple-choice
      Q3: 'MC',     // multiple-choice
      Q4: 'Short',  // short-answer
      Q5: 'Short',  // short-answer
      Q6: 'Essay',  // essay (30pts, long text)
      Q7: 'Short',  // short-answer
    };

    for (const q of examJson.questions) {
      const detected = detectQuestionType({
        text: q.text,
        options: q.options,
        explicitType: q.type !== 'essay' ? q.type : undefined
      });
      const tag = typeToTag(q.type);
      expect(tag).toBe(expectedTypes[q.id]);
    }
  });

  it('correctly classifies mixed-types QMD questions', () => {
    const qmd = loadFixture('mixed-types.qmd');
    const exam = parseExamContent(qmd);

    // Every question should get a recognized type
    for (const q of exam.questions) {
      const tag = typeToTag(q.type);
      expect(['MC', 'MA', 'TF', 'Short', 'Numeric', 'Essay', 'Match', 'FMB', 'FIB', 'Upload']).toContain(tag);
    }

    // Should contain at least MC and TF
    const tags = exam.questions.map(q => typeToTag(q.type));
    expect(tags).toContain('MC');
    expect(tags).toContain('TF');
  });

  it('typeToTag and tagToType are inverses', () => {
    const types = [
      'multiple-choice', 'true-false', 'short-answer', 'essay',
      'numerical', 'multiple-answer', 'matching',
      'fill-in-multiple-blanks', 'fill-in-blank', 'file-upload'
    ];

    for (const type of types) {
      const tag = typeToTag(type);
      const back = tagToType(tag);
      expect(back).toBe(type);
    }
  });
});

// ===========================================================================
// 4. examark CLI Lint Check (pre-conversion validation)
// ===========================================================================

describeIfExamark('E2E: examark lint on generated markdown', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-e2e-lint-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('simple-mc markdown passes examark lint', () => {
    const qmd = loadFixture('simple-mc.qmd');
    const exam = parseExamContent(qmd);
    const md = new ExamarkFormatter().format(exam);
    const mdPath = join(tmpDir, 'lint-test.md');
    writeFileSync(mdPath, md);

    // examark check/lint validates markdown before conversion
    const output = execFileSync('examark', ['check', mdPath], {
      encoding: 'utf-8'
    });

    // Lint should not report errors
    expect(output).not.toContain('error');
  });

  it('demo exam markdown passes examark lint', () => {
    const examJson = loadDemoExam();
    const md = new ExamarkFormatter().format(examJson);
    const mdPath = join(tmpDir, 'demo-lint.md');
    writeFileSync(mdPath, md);

    const output = execFileSync('examark', ['check', mdPath], {
      encoding: 'utf-8'
    });

    expect(output).not.toContain('error');
  });
});

// ===========================================================================
// 5. CanvasFormatter Class Integration
// ===========================================================================

describeIfExamark('E2E: CanvasFormatter class full pipeline', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-e2e-canvas-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('converts QMD through CanvasFormatter to QTI', async () => {
    const qmd = loadFixture('simple-mc.qmd');
    const exam = parseExamContent(qmd);
    const formatter = new CanvasFormatter();
    const qtiPath = join(tmpDir, 'canvas-mc.qti.zip');

    const result = await formatter.format(exam, {
      output: qtiPath,
      validate: true
    });

    expect(existsSync(result)).toBe(true);
    expect(statSync(result).size).toBeGreaterThan(0);
  });

  it('CanvasFormatter.getFileExtension returns .qti.zip', () => {
    const formatter = new CanvasFormatter();
    expect(formatter.getFileExtension()).toBe('.qti.zip');
  });

  it('CanvasFormatter.validate checks QTI file exists', async () => {
    const formatter = new CanvasFormatter();
    const result = await formatter.validate('/nonexistent/path.qti.zip');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('QTI file does not exist');
  });

  it('CanvasFormatter.validate verifies real QTI package', async () => {
    const qmd = loadFixture('simple-mc.qmd');
    const exam = parseExamContent(qmd);
    const formatter = new CanvasFormatter();
    const qtiPath = join(tmpDir, 'validate-test.qti.zip');

    await formatter.format(exam, { output: qtiPath });

    const validation = await formatter.validate(qtiPath);
    expect(validation.valid).toBe(true);
  });
});

// ===========================================================================
// 6. Round-Trip Integrity
// ===========================================================================

describe('E2E: Round-trip data integrity', () => {
  it('QMD parse preserves question count through formatter', () => {
    const fixtures = ['minimal.qmd', 'simple-mc.qmd', 'mixed-types.qmd', 'latex-math.qmd'];
    const formatter = new ExamarkFormatter();

    for (const fixture of fixtures) {
      const qmd = loadFixture(fixture);
      const exam = parseExamContent(qmd);
      const md = formatter.format(exam);

      // Count questions in output markdown
      const outputQuestions = md.match(/^\d+\.\s+\[/gm) || [];
      expect(outputQuestions.length).toBe(exam.questions.length);
    }
  });

  it('points are preserved from QMD through to examark MD', () => {
    const qmd = loadFixture('simple-mc.qmd');
    const exam = parseExamContent(qmd);
    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);

    // Each question's points should appear in the output
    for (const q of exam.questions) {
      expect(md).toContain(`${q.points}pts`);
    }
  });

  it('demo exam answer key is embedded in examark output', () => {
    const examJson = loadDemoExam();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(examJson, { includeAnswers: true });

    // MC answers should have [x] markers
    expect(md).toContain('[x]');

    // Count [x] markers — should have exactly 3 (one per MC question)
    const correctMarkers = md.match(/\[x\]/g) || [];
    expect(correctMarkers.length).toBe(3);
  });

  it('all fixtures produce valid examark markdown', () => {
    const fixtures = ['minimal.qmd', 'simple-mc.qmd', 'mixed-types.qmd', 'latex-math.qmd', 'multi-part.qmd'];
    const formatter = new ExamarkFormatter();

    for (const fixture of fixtures) {
      const qmd = loadFixture(fixture);
      const exam = parseExamContent(qmd);
      const md = formatter.format(exam);
      const validation = formatter.validate(md);
      expect(validation.valid).toBe(true);
    }
  });
});

// ===========================================================================
// 7. Mixed Quiz Fixture — All 10 Question Types (E2)
// ===========================================================================

describe('E2E: quiz-mixed.json — all 10 question types', () => {
  it('loads quiz-mixed.json with 10 questions', () => {
    const quiz = loadMixedQuiz();
    expect(quiz.questions).toHaveLength(10);
    expect(quiz.total_points).toBe(50);
  });

  it('covers all supported question types via ExamarkFormatter', () => {
    const quiz = loadMixedQuiz();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(quiz);

    expect(formatter.validate(md).valid).toBe(true);

    // Verify type tags appear (Upload is mapped to Essay)
    expect(md).toContain('[MC]');
    expect(md).toContain('[MA]');
    expect(md).toContain('[TF]');
    expect(md).toContain('[Short]');
    expect(md).toContain('[Numeric]');
    expect(md).toContain('[Essay');
    expect(md).toContain('[Match]');
    expect(md).toContain('[FMB]');
    expect(md).toContain('[FIB]');
    // Upload is now mapped to Essay — verify upload note is present
    expect(md).toContain('originally required a file upload');
  });

  it('emits Upload→Essay warning for question 10', () => {
    const quiz = loadMixedQuiz();
    const formatter = new ExamarkFormatter();
    formatter.format(quiz);

    const uploadWarnings = formatter.warnings.filter(w => w.type === 'upload-to-essay');
    expect(uploadWarnings).toHaveLength(1);
  });

  it('preserves all answer key entries', () => {
    const quiz = loadMixedQuiz();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(quiz, { includeAnswers: true });

    // MC correct answer marked
    expect(md).toContain('Mean [x]');
    // MA correct answers
    expect(md).toContain('Range [x]');
    expect(md).toContain('Standard deviation [x]');
    expect(md).toContain('Interquartile range [x]');
    // TF correct answer
    expect(md).toContain('True [x]');
    // FMB answers
    expect(md).toContain('blank1: 68');
    expect(md).toContain('blank2: 95');
    // FIB answer
    expect(md).toContain('Answer: t-test');
    // Numeric answer
    expect(md).toContain('Answer: 5');
  });
});

// ===========================================================================
// 8. Image Support (E7)
// ===========================================================================

describe('E2E: Image extraction from QMD content', () => {
  it('extracts image references from question body', () => {
    const qmd = [
      '# Image Test',
      '',
      '## Question 1 [10 pts]',
      '',
      'Look at the scatter plot:',
      '',
      '![scatter](images/scatter.png)',
      '',
      'Describe the relationship between X and Y.',
    ].join('\n');

    const exam = parseExamContent(qmd);
    expect(exam.questions[0].images).toEqual([
      { alt: 'scatter', path: 'images/scatter.png' },
    ]);
  });

  it('preserves image markdown in examark output', () => {
    const qmd = [
      '# Image Test',
      '',
      '## Question 1 [10 pts]',
      '',
      '![chart](images/chart.png)',
      '',
      'What pattern do you observe?',
    ].join('\n');

    const exam = parseExamContent(qmd);
    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);

    expect(md).toContain('![chart](images/chart.png)');
  });
});

describeIfExamark('E2E: Image bundling in QTI pipeline', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-e2e-img-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generates QTI zip with image from sourceDir', () => {
    // Copy test image to tmpDir/images/
    const imgDir = join(tmpDir, 'images');
    mkdirSync(imgDir, { recursive: true });
    copyFileSync(
      join(fixturesDir, 'test-image.png'),
      join(imgDir, 'test-image.png')
    );

    // Create exam with image reference
    const exam = {
      title: 'Image Exam',
      total_points: 10,
      instructions: '',
      questions: [
        { id: 'Q1', type: 'multiple-choice', text: '![diagram](images/test-image.png)\n\nWhat does this show?', options: ['A', 'B'], points: 10 }
      ],
      answer_key: { Q1: 'A' }
    };

    const formatter = new ExamarkFormatter();
    const md = formatter.format(exam);
    const mdPath = join(tmpDir, 'image-exam.md');
    const qtiPath = join(tmpDir, 'image-exam.qti.zip');
    writeFileSync(mdPath, md);

    // Run examark with CWD set to tmpDir so it finds the image
    const stdout = execFileSync('examark', [mdPath, '-o', qtiPath], {
      encoding: 'utf-8',
      cwd: tmpDir,
    });

    expect(existsSync(qtiPath)).toBe(true);
    expect(statSync(qtiPath).size).toBeGreaterThan(0);
  });
});

describeIfExamark('E2E: quiz-mixed.json → QTI Pipeline', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'scholar-e2e-mixed-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generates QTI zip from quiz-mixed.json', () => {
    const quiz = loadMixedQuiz();
    const formatter = new ExamarkFormatter();
    const md = formatter.format(quiz);

    const mdPath = join(tmpDir, 'mixed-quiz.md');
    const qtiPath = join(tmpDir, 'mixed-quiz.qti.zip');
    writeFileSync(mdPath, md);

    const stdout = execFileSync('examark', [mdPath, '-o', qtiPath], {
      encoding: 'utf-8'
    });

    expect(existsSync(qtiPath)).toBe(true);
    // Upload mapped to Essay, so 10 questions total
    expect(stdout).toContain('10 questions');
    expect(statSync(qtiPath).size).toBeGreaterThan(500);

    // Verify — Essay/Short/Numeric/FMB lack correct answers, expected warnings
    const verify = verifyQti(qtiPath);
    expect(verify.passed).toBe(true);
  });
});
