/**
 * Conversational Exam Generator for Claude Code
 *
 * Uses Claude Code's conversational interface instead of API calls.
 * Perfect for Max users who want to generate exams through chat.
 *
 * Usage in Claude Code:
 * - Ask Claude to generate an exam
 * - Provide requirements (type, questions, difficulty, topics)
 * - Claude generates and saves the exam
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { loadTemplate, injectAutoFields, applyDefaults } from '../templates/loader.js';

/**
 * Generate exam prompt for conversational generation
 * @param {Object} options - Exam options
 * @returns {string} Formatted prompt for Claude
 */
export function buildConversationalPrompt(options = {}) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  const examOptions = {
    type: options.type || 'midterm',
    questionCount: options.questionCount || 10,
    difficulty: options.difficulty || courseInfo.difficulty || 'intermediate',
    topics: options.topics || [],
    durationMinutes: options.durationMinutes || 60,
    questionTypes: options.questionTypes || {
      'multiple-choice': 0.6,
      'short-answer': 0.3,
      'essay': 0.1
    },
    includeFormulas: options.includeFormulas !== false,
    includeSolutions: options.includeSolutions !== false
  };

  // Calculate question distribution
  const distribution = {};
  Object.entries(examOptions.questionTypes).forEach(([type, ratio]) => {
    distribution[type] = Math.round(examOptions.questionCount * ratio);
  });

  // Adjust to ensure total equals questionCount
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total !== examOptions.questionCount) {
    const diff = examOptions.questionCount - total;
    const firstType = Object.keys(distribution)[0];
    distribution[firstType] += diff;
  }

  const topicsSection = examOptions.topics.length > 0
    ? `Topics to cover: ${examOptions.topics.join(', ')}`
    : 'Topics: Use course curriculum as guide';

  return {
    prompt: `
Generate a ${examOptions.type} exam for ${courseInfo.code || 'the course'}: ${courseInfo.title || ''}.

Course Information:
- Level: ${courseInfo.level || 'undergraduate'}
- Field: ${courseInfo.field || 'general'}
- Difficulty: ${examOptions.difficulty}

Exam Requirements:
- Total questions: ${examOptions.questionCount}
- Question distribution:
${Object.entries(distribution).map(([type, count]) => `  - ${type}: ${count} questions`).join('\n')}
- Duration: ${examOptions.durationMinutes} minutes
- ${topicsSection}

Question Type Guidelines:

1. Multiple-choice questions:
   - Provide exactly 4 options (A, B, C, D)
   - Make distractors plausible but clearly wrong
   - Use LaTeX for math: $\\\\frac{a}{b}$

2. Short-answer questions:
   - Clear, specific questions
   - Expected answer: 2-3 sentences
   - Include grading criteria

3. Essay questions:
   - Provide detailed rubric with point breakdown
   - Expected answer: 1-2 paragraphs
   - Include key concepts to address

Format the output as valid JSON matching this structure:
{
  "title": "Exam title",
  "exam_type": "${examOptions.type}",
  "duration_minutes": ${examOptions.durationMinutes},
  "instructions": "General exam instructions",
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "Question text",
      "options": ["A", "B", "C", "D"],
      "points": 10,
      "difficulty": "${examOptions.difficulty}",
      "topic": "Topic name"
    }
  ],
  "answer_key": {
    "Q1": "B"
  }${examOptions.includeFormulas ? ',\n  "formula_sheet": "LaTeX formulas"' : ''}
}

IMPORTANT:
- Use double backslashes in LaTeX: \\\\frac not \\frac
- All question IDs must match answer_key entries
- For MC questions, answer must be A, B, C, or D
- Total points should be reasonable (100-150 typical)
`.trim(),
    options: examOptions,
    config: courseInfo
  };
}

/**
 * Validate conversationally generated exam
 * @param {Object} examContent - Generated exam content
 * @param {Object} options - Original options
 * @returns {Object} Validation result
 */
export function validateConversationalExam(examContent, options = {}) {
  // Load templates
  const baseTemplate = loadTemplate('exam');

  // Apply defaults and enrich
  let content = applyDefaults(examContent, baseTemplate);

  // Inject auto-fields
  content = injectAutoFields(content, baseTemplate, {
    generated_by: {
      tool: 'scholar',
      version: '1.0.0',
      method: 'conversational',
      command: '/teaching:exam'
    }
  });

  // Calculate total points
  content.total_points = content.questions
    ? content.questions.reduce((sum, q) => sum + (q.points || 0), 0)
    : 0;

  // Validate
  const validator = new ValidatorEngine({
    strictMode: options.strict || false,
    validateLatex: true,
    checkCompleteness: true
  });

  const validation = validator.validate(content, baseTemplate);

  return {
    content,
    validation,
    metadata: {
      examType: content.exam_type,
      questionCount: content.questions ? content.questions.length : 0,
      totalPoints: content.total_points,
      duration: content.duration_minutes,
      generatedAt: new Date().toISOString(),
      method: 'conversational'
    }
  };
}

/**
 * Save conversationally generated exam
 * @param {Object} exam - Exam with content, validation, metadata
 * @param {string} outputDir - Directory to save to (default: current)
 * @returns {string} Path to saved file
 */
export function saveConversationalExam(exam, outputDir = process.cwd()) {
  const timestamp = Date.now();
  const filename = `exam-${exam.content.exam_type}-${timestamp}.json`;
  const filepath = join(outputDir, filename);

  writeFileSync(filepath, JSON.stringify(exam.content, null, 2));

  return filepath;
}

/**
 * Display exam summary
 * @param {Object} exam - Exam object
 */
export function displayExamSummary(exam) {
  console.log('\n✅ Exam Generated Successfully!\n');
  console.log('📊 Exam Statistics:');
  console.log(`  Type: ${exam.content.exam_type}`);
  console.log(`  Questions: ${exam.metadata.questionCount}`);
  console.log(`  Total Points: ${exam.metadata.totalPoints}`);
  console.log(`  Duration: ${exam.metadata.duration} minutes\n`);

  // Question breakdown
  const questionTypes = {};
  exam.content.questions.forEach(q => {
    questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
  });

  console.log('📝 Question Types:');
  Object.entries(questionTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Sample questions
  console.log('\n📋 Sample Questions:');
  exam.content.questions.slice(0, 3).forEach(q => {
    const preview = q.text.length > 60
      ? q.text.substring(0, 60) + '...'
      : q.text;
    console.log(`  ${q.id} [${q.type}]: ${preview}`);
  });

  // Validation
  if (exam.validation.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${exam.validation.warnings.length}`);
  }
}

export {
  buildConversationalPrompt as buildPrompt,
  validateConversationalExam as validateExam,
  saveConversationalExam as saveExam,
  displayExamSummary as displaySummary
};
