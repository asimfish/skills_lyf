/**
 * Example 5: Multiple Exam Variations
 *
 * Generate multiple versions of the same exam for large classes.
 * Helps prevent cheating while maintaining consistent difficulty.
 */

import { generateExamVariations } from '../../src/teaching/generators/exam.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateMultipleVariations() {
  console.log('🎓 Generating Multiple Exam Variations...\n');

  const variationCount = 4;  // A, B, C, D versions

  console.log(`Creating ${variationCount} variations (A, B, C, D)...`);
  console.log('Each variation will have the same structure but different questions.\n');

  try {
    // Generate variations
    const variations = await generateExamVariations(
      {
        type: 'midterm',
        questionCount: 10,
        difficulty: 'medium',
        durationMinutes: 60,
        topics: ['regression analysis', 'ANOVA'],
        questionTypes: {
          'multiple-choice': 0.6,
          'short-answer': 0.4
        },
        includeFormulas: true
      },
      variationCount
    );

    console.log(`✅ Generated ${variations.length} variations successfully!\n`);

    // Analyze variations
    console.log('📊 Variation Statistics:\n');

    variations.forEach((exam, index) => {
      const letter = String.fromCharCode(65 + index); // A, B, C, D

      console.log(`Version ${letter} (Variation ${exam.variant}):`);
      console.log(`  Questions: ${exam.metadata.questionCount}`);
      console.log(`  Total Points: ${exam.metadata.totalPoints}`);
      console.log(`  Duration: ${exam.metadata.duration} minutes`);

      // Question type breakdown
      const types = {};
      exam.content.questions.forEach(q => {
        types[q.type] = (types[q.type] || 0) + 1;
      });
      console.log(`  Question Types: ${Object.entries(types).map(([t, c]) => `${t}(${c})`).join(', ')}`);
      console.log();
    });

    // Verify consistency across variations
    console.log('🔍 Consistency Check:');

    const firstExam = variations[0];
    const allConsistent = variations.every(exam => {
      return exam.content.exam_type === firstExam.content.exam_type &&
             exam.metadata.questionCount === firstExam.metadata.questionCount &&
             exam.metadata.duration === firstExam.metadata.duration;
    });

    if (allConsistent) {
      console.log('  ✅ All variations have consistent structure');
      console.log(`  ✅ Exam type: ${firstExam.content.exam_type}`);
      console.log(`  ✅ Question count: ${firstExam.metadata.questionCount}`);
      console.log(`  ✅ Duration: ${firstExam.metadata.duration} minutes`);
    } else {
      console.log('  ⚠️  Variations have inconsistent structure');
    }

    // Point distribution comparison
    console.log('\n💯 Point Distribution Comparison:');
    const pointTotals = variations.map(v => v.metadata.totalPoints);
    const avgPoints = pointTotals.reduce((a, b) => a + b, 0) / pointTotals.length;
    const minPoints = Math.min(...pointTotals);
    const maxPoints = Math.max(...pointTotals);

    console.log(`  Average: ${avgPoints.toFixed(1)} points`);
    console.log(`  Range: ${minPoints}-${maxPoints} points`);
    console.log(`  Difference: ${maxPoints - minPoints} points`);

    // Save all variations
    console.log('\n📁 Saving Variations:');

    variations.forEach((exam, index) => {
      const letter = String.fromCharCode(65 + index);
      const filename = `midterm-version-${letter}-${Date.now()}.json`;
      const filepath = join(process.cwd(), 'examples', 'exams', 'output', filename);

      writeFileSync(filepath, JSON.stringify(exam.content, null, 2));
      console.log(`  ✓ Version ${letter}: examples/exams/output/${filename}`);
    });

    // Distribution instructions
    console.log('\n📋 Distribution Instructions:');
    console.log('  1. Print equal numbers of each version');
    console.log('  2. Shuffle versions when distributing to students');
    console.log('  3. Mark which version each student receives');
    console.log('  4. Use separate answer keys for each version');
    console.log('  5. Ensure grading uses correct version answer key');

    // Answer key summary
    console.log('\n🔑 Answer Key Files:');
    variations.forEach((exam, index) => {
      const letter = String.fromCharCode(65 + index);
      const answerCount = Object.keys(exam.content.answer_key).length;
      console.log(`  Version ${letter}: ${answerCount} answers`);
    });

  } catch (error) {
    console.error('❌ Error generating variations:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMultipleVariations();
}

export { generateMultipleVariations };
