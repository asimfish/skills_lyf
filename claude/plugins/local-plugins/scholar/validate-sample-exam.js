import { readFileSync } from 'fs';
import { validateExam, saveExam, displaySummary } from './src/teaching/generators/exam-conversational.js';

// Load the generated exam
const examContent = JSON.parse(readFileSync('sample-exam-generated.json', 'utf-8'));

// Validate and process
const exam = validateExam(examContent, { strict: false });

// Check validation
if (!exam.validation.isValid) {
  console.error('❌ Validation failed:');
  exam.validation.errors.forEach(err => {
    console.error(`  ${err.field}: ${err.message}`);
  });
  process.exit(1);
}

// Display summary
displaySummary(exam);

// Save to final location
const filepath = saveExam(exam, './examples/exams/output');
console.log(`\n📁 Saved to: ${filepath}`);

// Show validation details
console.log(`\n✅ Validation: ${exam.validation.isValid ? 'PASSED' : 'FAILED'}`);
if (exam.validation.warnings.length > 0) {
  console.log(`⚠️  Warnings: ${exam.validation.warnings.length}`);
  exam.validation.warnings.slice(0, 3).forEach(w => console.log(`  - ${w}`));
}

console.log('\n🎉 Exam generation complete!');
console.log('💡 No API key required - generated conversationally through Claude Code');
