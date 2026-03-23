/**
 * Example 2: Comprehensive Final Exam
 *
 * Advanced final exam with custom question distribution, specific topics,
 * and longer duration. Demonstrates full control over exam generation.
 */

import { generateExam } from '../../src/teaching/generators/exam.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateComprehensiveFinal() {
  console.log('🎓 Generating Comprehensive Final Exam...\n');

  try {
    // Generate exam with detailed options
    const exam = await generateExam({
      type: 'final',
      questionCount: 20,
      difficulty: 'hard',
      durationMinutes: 180,
      topics: [
        'simple linear regression',
        'multiple regression',
        'model diagnostics',
        'variable selection',
        'multicollinearity',
        'heteroscedasticity'
      ],
      questionTypes: {
        'multiple-choice': 0.4,   // 40% MC (8 questions)
        'short-answer': 0.3,      // 30% short (6 questions)
        'essay': 0.2,             // 20% essay (4 questions)
        'numerical': 0.1          // 10% numerical (2 questions)
      },
      includeFormulas: true,
      includeSolutions: true,
      strict: false
    });

    // Display comprehensive statistics
    console.log('✅ Final Exam Generated Successfully!\n');
    console.log('📊 Exam Statistics:');
    console.log(`  Type: ${exam.content.exam_type.toUpperCase()}`);
    console.log(`  Difficulty: hard`);
    console.log(`  Questions: ${exam.metadata.questionCount}`);
    console.log(`  Total Points: ${exam.metadata.totalPoints}`);
    console.log(`  Duration: ${exam.metadata.duration} minutes (3 hours)`);
    console.log(`  Topics Covered: ${exam.content.questions.map(q => q.topic).filter((v, i, a) => a.indexOf(v) === i).length}`);
    console.log(`  Tokens Used: ${exam.metadata.tokens}\n`);

    // Analyze question distribution
    const questionTypes = {};
    const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
    const topicsCovered = new Set();

    exam.content.questions.forEach(q => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
      if (q.difficulty) difficultyBreakdown[q.difficulty]++;
      if (q.topic) topicsCovered.add(q.topic);
    });

    console.log('📝 Question Type Distribution:');
    Object.entries(questionTypes).forEach(([type, count]) => {
      const percentage = ((count / exam.metadata.questionCount) * 100).toFixed(0);
      console.log(`  ${type}: ${count} (${percentage}%)`);
    });

    console.log('\n📊 Difficulty Distribution:');
    Object.entries(difficultyBreakdown).forEach(([level, count]) => {
      if (count > 0) {
        console.log(`  ${level}: ${count}`);
      }
    });

    console.log('\n🎯 Topics Covered:');
    Array.from(topicsCovered).forEach(topic => {
      console.log(`  - ${topic}`);
    });

    // Show point distribution
    const pointsByType = {};
    exam.content.questions.forEach(q => {
      pointsByType[q.type] = (pointsByType[q.type] || 0) + q.points;
    });

    console.log('\n💯 Points by Question Type:');
    Object.entries(pointsByType).forEach(([type, points]) => {
      console.log(`  ${type}: ${points} points`);
    });

    // Display formula sheet info
    if (exam.content.formula_sheet) {
      console.log('\n📐 Formula Sheet: Included');
    }

    // Show essay questions with rubrics
    const essays = exam.content.questions.filter(q => q.type === 'essay');
    if (essays.length > 0) {
      console.log(`\n📄 Essay Questions: ${essays.length}`);
      essays.forEach(q => {
        console.log(`  ${q.id}: ${q.text.substring(0, 50)}...`);
        if (q.rubric) {
          console.log(`    Rubric: ${q.rubric.substring(0, 40)}...`);
        }
      });
    }

    // Save to file
    const filename = `comprehensive-final-${Date.now()}.json`;
    const filepath = join(process.cwd(), 'examples', 'exams', 'output', filename);
    writeFileSync(filepath, JSON.stringify(exam.content, null, 2));

    console.log(`\n📁 Saved to: examples/exams/output/${filename}`);

    // Validation summary
    console.log(`\n✅ Validation: ${exam.validation.isValid ? 'PASSED' : 'FAILED'}`);
    if (exam.validation.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${exam.validation.warnings.length}`);
    }

  } catch (error) {
    console.error('❌ Error generating final exam:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComprehensiveFinal();
}

export { generateComprehensiveFinal };
