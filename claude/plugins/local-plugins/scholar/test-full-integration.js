/**
 * Full Integration Test: Conversational Generation → Validation → LaTeX Export
 *
 * Tests the complete pipeline for all question types and edge cases.
 */

import { readFileSync } from 'fs';
import { validateExam, saveExam } from './src/teaching/generators/exam-conversational.js';
import { LatexExporter } from './src/teaching/formatters/latex-export.js';

console.log('🧪 Full Integration Test\n');
console.log('Testing: Conversational Generation → Validation → LaTeX Export\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

// Test 1: Load and validate exam with all question types
test('Load exam with all question types', () => {
  const exam = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));
  const validated = validateExam(exam, { strict: false });

  if (!validated.validation.isValid) {
    throw new Error(`Validation failed: ${validated.validation.errors.map(e => e.message).join(', ')}`);
  }

  // Check all question types present
  const types = validated.content.questions.map(q => q.type);
  if (!types.includes('multiple-choice')) throw new Error('Missing multiple-choice');
  if (!types.includes('short-answer')) throw new Error('Missing short-answer');
  if (!types.includes('essay')) throw new Error('Missing essay');
});

// Test 2: Load and validate quiz with numerical questions
test('Load quiz with numerical questions', () => {
  const quiz = JSON.parse(readFileSync('sample-quiz-generated.json', 'utf-8'));
  const validated = validateExam(quiz, { strict: false });

  if (!validated.validation.isValid) {
    throw new Error(`Validation failed: ${validated.validation.errors.map(e => e.message).join(', ')}`);
  }

  // Check question types
  const types = validated.content.questions.map(q => q.type);
  if (!types.includes('numerical')) throw new Error('Missing numerical');
  if (!types.includes('true-false')) throw new Error('Missing true-false');
});

// Test 3: Export exam to LaTeX student version
test('Export exam to LaTeX student version', () => {
  const exam = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));
  const validated = validateExam(exam, { strict: false });

  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Verify LaTeX structure
  if (!latex.includes('\\documentclass')) throw new Error('Missing document class');
  if (!latex.includes('\\begin{document}')) throw new Error('Missing begin document');
  if (!latex.includes('\\end{document}')) throw new Error('Missing end document');
  if (!latex.includes('\\begin{questions}')) throw new Error('Missing questions environment');

  // Verify no answers shown
  if (latex.includes('\\correctchoice') || latex.includes('ANSWER:')) {
    throw new Error('Student version contains answers');
  }

  // Verify formula sheet included
  if (!latex.includes('Formula Sheet')) throw new Error('Missing formula sheet');
});

// Test 4: Export exam to LaTeX answer key
test('Export exam to LaTeX answer key', () => {
  const exam = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));
  const validated = validateExam(exam, { strict: false });

  const exporter = new LatexExporter(validated.content);
  const answerKey = exporter.exportAnswerKey();

  // Verify answers included
  if (!answerKey.includes('\\correctchoice')) {
    throw new Error('Answer key missing correct choice markers');
  }

  // Verify solutions for essay questions
  if (!answerKey.includes('Sample Answer:')) {
    throw new Error('Answer key missing essay solutions');
  }
});

// Test 5: Export exam to LaTeX rubric
test('Export exam to LaTeX rubric', () => {
  const exam = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));
  const validated = validateExam(exam, { strict: false });

  const exporter = new LatexExporter(validated.content);
  const rubric = exporter.exportRubric();

  // Verify rubric structure
  if (!rubric.includes('Grading Rubric')) throw new Error('Missing rubric title');
  if (!rubric.includes('Point Distribution')) throw new Error('Missing point distribution');
  if (!rubric.includes('Total Points:')) throw new Error('Missing total points');

  // Verify all questions listed
  const questions = validated.content.questions.map(q => q.id);
  questions.forEach(id => {
    if (!rubric.includes(id)) throw new Error(`Missing question ${id} in rubric`);
  });
});

// Test 6: Math notation preservation
test('Math notation preservation in LaTeX', () => {
  const quiz = JSON.parse(readFileSync('sample-quiz-generated.json', 'utf-8'));
  const validated = validateExam(quiz, { strict: false });

  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Verify LaTeX math notation preserved (check patterns, not exact strings)
  if (!/\$.*\\beta.*\$/.test(latex)) throw new Error('Beta notation not preserved');
  if (!/\$.*R\^2.*\$/.test(latex)) throw new Error('R^2 notation not preserved');
  if (!/\$.*\\epsilon.*\$/.test(latex)) throw new Error('Epsilon notation not preserved');
});

// Test 7: All question types in LaTeX
test('All question types formatted in LaTeX', () => {
  const exam = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));
  const validated = validateExam(exam, { strict: false });

  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Multiple choice
  if (!latex.includes('\\begin{choices}')) throw new Error('Missing choices environment');

  // Short answer - should have vspace
  if (!latex.includes('\\vspace{3in}')) throw new Error('Missing short-answer space');

  // Essay - should have larger vspace
  if (!latex.includes('\\vspace{5in}')) throw new Error('Missing essay space');
});

// Test 8: Quiz numerical questions in LaTeX
test('Numerical questions formatted in LaTeX', () => {
  const quiz = JSON.parse(readFileSync('sample-quiz-generated.json', 'utf-8'));
  const validated = validateExam(quiz, { strict: false });

  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Numerical should have moderate vspace
  if (!latex.includes('\\vspace{1.5in}')) throw new Error('Missing numerical space');
});

// Test 9: Integration with Phase 0 validator
test('Integration with Phase 0 validator', () => {
  const exam = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));
  const validated = validateExam(exam, { strict: false });

  // Check validator populated all expected fields
  if (!validated.validation) throw new Error('Missing validation object');
  if (typeof validated.validation.isValid !== 'boolean') throw new Error('Missing isValid');
  if (!Array.isArray(validated.validation.errors)) throw new Error('Missing errors array');
  if (!Array.isArray(validated.validation.warnings)) throw new Error('Missing warnings array');

  // Check metadata populated
  if (!validated.metadata) throw new Error('Missing metadata');
  if (!validated.metadata.questionCount) throw new Error('Missing question count');
  if (!validated.metadata.totalPoints) throw new Error('Missing total points');
});

// Test 10: Error handling - missing required fields
test('Error handling - missing required fields', () => {
  const invalidExam = {
    // Missing schema_version, template_type, metadata
    title: 'Invalid Exam',
    questions: []
  };

  const validated = validateExam(invalidExam, { strict: false });

  if (validated.validation.isValid) {
    throw new Error('Validator should have failed for invalid exam');
  }

  if (validated.validation.errors.length === 0) {
    throw new Error('Should have validation errors');
  }
});

// Test 11: Export with custom options
test('LaTeX export with custom options', () => {
  const exam = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));
  const validated = validateExam(exam, { strict: false });

  const exporter = new LatexExporter(validated.content, {
    formatStyle: 'article',
    fontSize: '12pt',
    pageSize: 'a4paper'
  });

  const latex = exporter.exportStudentVersion();

  if (!latex.includes('\\documentclass[12pt,a4paper]{article}')) {
    throw new Error('Custom options not applied');
  }
});

// Test 12: Quiz with true-false questions
test('Quiz with true-false questions in LaTeX', () => {
  const quiz = JSON.parse(readFileSync('sample-quiz-generated.json', 'utf-8'));
  const validated = validateExam(quiz, { strict: false });

  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // True-false should have choices with True/False
  if (!latex.includes('True') || !latex.includes('False')) {
    throw new Error('Missing true-false options');
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  console.log('\n❌ Integration test FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All integration tests PASSED!');
  console.log('\n🎉 Full pipeline verified:');
  console.log('   1. Conversational exam generation');
  console.log('   2. Phase 0 validation');
  console.log('   3. LaTeX export (student, answer key, rubric)');
  console.log('   4. Math notation preservation');
  console.log('   5. All question types supported');
  console.log('   6. Error handling');
}
