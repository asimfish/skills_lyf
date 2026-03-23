import { readFileSync } from 'fs';
import { validateExam, saveExam, displaySummary } from './src/teaching/generators/exam-conversational.js';

// Load the generated quiz
const examContent = JSON.parse(readFileSync('sample-quiz-generated.json', 'utf-8'));

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

// Show answer key summary
console.log('\n🔑 Answer Key Summary:');
Object.entries(exam.content.answer_key).forEach(([id, answer]) => {
  const question = exam.content.questions.find(q => q.id === id);
  const answerPreview = typeof answer === 'string'
    ? (answer.length > 40 ? answer.substring(0, 40) + '...' : answer)
    : JSON.stringify(answer).substring(0, 40) + '...';
  console.log(`  ${id} [${question.type}]: ${answerPreview}`);
});

console.log(`\n✅ Validation: ${exam.validation.isValid ? 'PASSED' : 'FAILED'}`);
if (exam.validation.warnings.length > 0) {
  console.log(`⚠️  Warnings: ${exam.validation.warnings.length}`);
}

console.log('\n🎉 Quiz generation complete!');
console.log('💡 Generated conversationally - no API key needed');
