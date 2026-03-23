/**
 * Example: LaTeX Export
 *
 * Demonstrates exporting exams to LaTeX format for printing.
 * Creates three files:
 * - Student version (no answers, with answer spaces)
 * - Answer key (with correct answers highlighted)
 * - Grading rubric (point breakdown and criteria)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { LatexExporter } from '../../src/teaching/formatters/latex-export.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure output directory exists
const outputDir = join(__dirname, '../exams/latex-output');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

console.log('📄 LaTeX Export Example\n');

// Load a sample exam (use the one we generated conversationally)
const examPath = join(__dirname, '../exams/output/exam-midterm-1768203469706.json');
let exam;

try {
  exam = JSON.parse(readFileSync(examPath, 'utf-8'));
  console.log(`✓ Loaded exam: ${exam.title}`);
} catch (err) {
  console.error('❌ Could not load exam. Please run validate-sample-exam.js first.');
  process.exit(1);
}

// Create LaTeX exporter with custom options
const exporter = new LatexExporter(exam, {
  formatStyle: 'exam-class',  // Use LaTeX exam document class
  fontSize: '11pt',
  pageSize: 'letter',
  answerSpace: {
    'short-answer': '3in',
    'numerical': '1.5in',
    'essay': '5in'
  }
});

console.log('\n📝 Generating LaTeX documents...\n');

// 1. Export student version
const studentVersion = exporter.exportStudentVersion();
const studentPath = join(outputDir, 'exam-student.tex');
writeFileSync(studentPath, studentVersion);
console.log(`✓ Student version: ${studentPath}`);
console.log(`  - No answers shown`);
console.log(`  - Answer spaces included`);
console.log(`  - Formula sheet at end`);

// 2. Export answer key
const answerKey = exporter.exportAnswerKey();
const answerKeyPath = join(outputDir, 'exam-answer-key.tex');
writeFileSync(answerKeyPath, answerKey);
console.log(`\n✓ Answer key: ${answerKeyPath}`);
console.log(`  - Correct answers highlighted`);
console.log(`  - Detailed solutions included`);
console.log(`  - No answer spaces`);

// 3. Export grading rubric
const rubric = exporter.exportRubric();
const rubricPath = join(outputDir, 'exam-rubric.tex');
writeFileSync(rubricPath, rubric);
console.log(`\n✓ Grading rubric: ${rubricPath}`);
console.log(`  - Point breakdown for all questions`);
console.log(`  - Detailed rubrics for essay questions`);
console.log(`  - Total points summary`);

// Show file statistics
const studentSize = Buffer.byteLength(studentVersion, 'utf8');
const answerKeySize = Buffer.byteLength(answerKey, 'utf8');
const rubricSize = Buffer.byteLength(rubric, 'utf8');

console.log('\n📊 File Statistics:');
console.log(`  Student version: ${(studentSize / 1024).toFixed(2)} KB`);
console.log(`  Answer key: ${(answerKeySize / 1024).toFixed(2)} KB`);
console.log(`  Rubric: ${(rubricSize / 1024).toFixed(2)} KB`);

// Compile instructions
console.log('\n📘 To compile LaTeX to PDF:');
console.log('  cd examples/exams/latex-output');
console.log('  pdflatex exam-student.tex');
console.log('  pdflatex exam-answer-key.tex');
console.log('  pdflatex exam-rubric.tex');

console.log('\n💡 Tips:');
console.log('  - Use exam document class for professional exam formatting');
console.log('  - Adjust answerSpace options for different question lengths');
console.log('  - LaTeX math notation is preserved automatically');
console.log('  - Special characters are escaped properly');

console.log('\n✅ LaTeX export complete!');
