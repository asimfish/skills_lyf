/**
 * Example 3: Quick Quiz
 *
 * Short quiz with 100% multiple-choice questions.
 * Perfect for quick assessments and in-class evaluations.
 */

import { generateExam } from '../../src/teaching/generators/exam.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateQuickQuiz() {
  console.log('🎓 Generating Quick Quiz...\n');

  try {
    // Generate short quiz with MC questions only
    const exam = await generateExam({
      type: 'quiz',
      questionCount: 5,
      difficulty: 'easy',
      durationMinutes: 15,
      topics: ['descriptive statistics', 'data visualization'],
      questionTypes: {
        'multiple-choice': 1.0  // 100% multiple-choice
      },
      includeFormulas: false,
      includeSolutions: true
    });

    console.log('✅ Quiz Generated Successfully!\n');
    console.log('📊 Quiz Statistics:');
    console.log(`  Questions: ${exam.metadata.questionCount} (all multiple-choice)`);
    console.log(`  Total Points: ${exam.metadata.totalPoints}`);
    console.log(`  Duration: ${exam.metadata.duration} minutes`);
    console.log(`  Difficulty: easy\n`);

    // Display all questions (since it's short)
    console.log('📋 Quiz Questions:\n');
    exam.content.questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.text} (${q.points} points)`);
      if (q.options) {
        q.options.forEach((opt, j) => {
          console.log(`   ${String.fromCharCode(65 + j)}. ${opt}`);
        });
      }
      console.log();
    });

    // Show answer key
    console.log('🔑 Answer Key:');
    Object.entries(exam.content.answer_key).forEach(([id, answer]) => {
      const qNum = parseInt(id.replace('Q', ''));
      console.log(`  ${qNum}. ${answer}`);
    });

    // Save to file
    const filename = `quick-quiz-${Date.now()}.json`;
    const filepath = join(process.cwd(), 'examples', 'exams', 'output', filename);
    writeFileSync(filepath, JSON.stringify(exam.content, null, 2));

    console.log(`\n📁 Saved to: examples/exams/output/${filename}`);

  } catch (error) {
    console.error('❌ Error generating quiz:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateQuickQuiz();
}

export { generateQuickQuiz };
