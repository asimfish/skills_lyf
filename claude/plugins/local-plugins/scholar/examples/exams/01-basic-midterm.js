/**
 * Example 1: Basic Midterm Exam
 *
 * Simple midterm with default settings - good for getting started.
 * Uses minimal configuration and relies on config file defaults.
 */

import { generateExam } from '../../src/teaching/generators/exam.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateBasicMidterm() {
  console.log('🎓 Generating Basic Midterm Exam...\n');

  try {
    // Generate exam with minimal options
    const exam = await generateExam({
      type: 'midterm',
      questionCount: 10,
      difficulty: 'medium'
    });

    // Display exam info
    console.log('✅ Exam Generated Successfully!\n');
    console.log('📊 Exam Statistics:');
    console.log(`  Type: ${exam.content.exam_type}`);
    console.log(`  Questions: ${exam.metadata.questionCount}`);
    console.log(`  Total Points: ${exam.metadata.totalPoints}`);
    console.log(`  Duration: ${exam.metadata.duration} minutes`);
    console.log(`  Generated At: ${exam.metadata.generatedAt}\n`);

    // Show question breakdown
    const questionTypes = {};
    exam.content.questions.forEach(q => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
    });

    console.log('📝 Question Type Distribution:');
    Object.entries(questionTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Show sample questions
    console.log('\n📋 Sample Questions:');
    exam.content.questions.slice(0, 3).forEach(q => {
      const preview = q.text.length > 60
        ? q.text.substring(0, 60) + '...'
        : q.text;
      console.log(`  ${q.id} [${q.type}, ${q.points}pts]: ${preview}`);
    });

    // Save to file
    const filename = `basic-midterm-${Date.now()}.json`;
    const filepath = join(process.cwd(), 'examples', 'exams', 'output', filename);
    writeFileSync(filepath, JSON.stringify(exam.content, null, 2));

    console.log(`\n📁 Saved to: examples/exams/output/${filename}`);

    // Show validation results
    if (exam.validation.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${exam.validation.warnings.length}`);
      exam.validation.warnings.slice(0, 3).forEach(w => console.log(`  - ${w}`));
    }

  } catch (error) {
    console.error('❌ Error generating exam:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBasicMidterm();
}

export { generateBasicMidterm };
