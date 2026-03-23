/**
 * Example 4: Practice Exam with Specific Topics
 *
 * Focused practice exam covering specific topics.
 * Useful for review sessions before major exams.
 */

import { generateExam } from '../../src/teaching/generators/exam.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generatePracticeExam() {
  console.log('🎓 Generating Practice Exam with Specific Topics...\n');

  const focusTopics = [
    'simple linear regression',
    'residual analysis',
    'confidence intervals for slopes',
    'hypothesis testing for regression'
  ];

  console.log('🎯 Focus Topics:');
  focusTopics.forEach(topic => console.log(`  - ${topic}`));
  console.log();

  try {
    // Generate practice exam focused on specific topics
    const exam = await generateExam({
      type: 'practice',
      questionCount: 8,
      difficulty: 'medium',
      durationMinutes: 45,
      topics: focusTopics,
      questionTypes: {
        'multiple-choice': 0.5,
        'short-answer': 0.5
      },
      includeFormulas: true,
      includeSolutions: true
    });

    console.log('✅ Practice Exam Generated Successfully!\n');
    console.log('📊 Exam Statistics:');
    console.log(`  Questions: ${exam.metadata.questionCount}`);
    console.log(`  Total Points: ${exam.metadata.totalPoints}`);
    console.log(`  Duration: ${exam.metadata.duration} minutes\n`);

    // Group questions by topic
    const questionsByTopic = {};
    exam.content.questions.forEach(q => {
      const topic = q.topic || 'General';
      if (!questionsByTopic[topic]) {
        questionsByTopic[topic] = [];
      }
      questionsByTopic[topic].push(q);
    });

    console.log('📚 Questions by Topic:');
    Object.entries(questionsByTopic).forEach(([topic, questions]) => {
      console.log(`\n  ${topic} (${questions.length} questions):`);
      questions.forEach(q => {
        const preview = q.text.length > 50
          ? q.text.substring(0, 50) + '...'
          : q.text;
        console.log(`    ${q.id} [${q.type}]: ${preview}`);
      });
    });

    // Show formula sheet if included
    if (exam.content.formula_sheet) {
      console.log('\n📐 Formula Sheet:');
      const formulaPreview = exam.content.formula_sheet.substring(0, 200);
      console.log(`  ${formulaPreview}${exam.content.formula_sheet.length > 200 ? '...' : ''}`);
    }

    // Save to file
    const filename = `practice-exam-${Date.now()}.json`;
    const filepath = join(process.cwd(), 'examples', 'exams', 'output', filename);
    writeFileSync(filepath, JSON.stringify(exam.content, null, 2));

    console.log(`\n📁 Saved to: examples/exams/output/${filename}`);

    // Show study recommendations
    console.log('\n💡 Study Recommendations:');
    console.log('  1. Review formula sheet before starting');
    console.log('  2. Focus on topics with multiple questions');
    console.log('  3. Time yourself - aim for 5-6 minutes per question');
    console.log('  4. Check answer key after completion');

  } catch (error) {
    console.error('❌ Error generating practice exam:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePracticeExam();
}

export { generatePracticeExam };
