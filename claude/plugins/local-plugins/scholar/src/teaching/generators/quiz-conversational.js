/**
 * Conversational Quiz Generator for Claude Code
 *
 * Uses Claude Code's conversational interface instead of API calls.
 * Perfect for Max users who want to generate quizzes through chat.
 *
 * Usage in Claude Code:
 * - Ask Claude to generate a quiz
 * - Provide requirements (topic, type, questions, difficulty)
 * - Claude generates and saves the quiz
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { loadTemplate, injectAutoFields, applyDefaults } from '../templates/loader.js';

/**
 * Default question type distribution for quizzes
 */
const DEFAULT_QUIZ_QUESTION_TYPES = {
  'multiple-choice': 0.6,
  'true-false': 0.2,
  'short-answer': 0.2
};

/**
 * Generate quiz prompt for conversational generation
 * @param {Object} options - Quiz options
 * @returns {Object} Prompt and metadata for Claude
 */
export function buildConversationalPrompt(options = {}) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  const quizOptions = {
    type: options.type || 'checkpoint',
    topic: options.topic || '',
    questionCount: options.questionCount || 8,
    difficulty: options.difficulty || courseInfo.difficulty || 'intermediate',
    topics: options.topics || [],
    durationMinutes: options.durationMinutes || 15,
    questionTypes: options.questionTypes || DEFAULT_QUIZ_QUESTION_TYPES,
    randomize: options.randomize || false,
    showFeedback: options.showFeedback !== false ? 'after_submit' : 'never',
    week: options.week || null,
    relatedReading: options.relatedReading || null
  };

  // Calculate question distribution
  const distribution = {};
  Object.entries(quizOptions.questionTypes).forEach(([type, ratio]) => {
    distribution[type] = Math.round(quizOptions.questionCount * ratio);
  });

  // Adjust to ensure total equals questionCount
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total !== quizOptions.questionCount) {
    const diff = quizOptions.questionCount - total;
    const firstType = Object.keys(distribution)[0];
    distribution[firstType] += diff;
  }

  // Quiz type descriptions
  const quizTypeDescriptions = {
    reading: 'a reading comprehension quiz',
    practice: 'a practice quiz with hints',
    checkpoint: 'a progress checkpoint quiz',
    pop: 'a quick pop quiz',
    review: 'an exam review quiz'
  };

  const quizDescription = quizTypeDescriptions[quizOptions.type] || 'a quiz';

  const topicsSection = quizOptions.topics.length > 0
    ? `Topics: ${quizOptions.topics.join(', ')}`
    : quizOptions.topic
      ? `Topic: ${quizOptions.topic}`
      : 'Topics: Cover recent course material';

  const weekSection = quizOptions.week
    ? `Week ${quizOptions.week}`
    : '';

  return {
    prompt: `
Generate ${quizDescription} for ${courseInfo.code || 'the course'}: ${courseInfo.title || ''}.

Course Information:
- Level: ${courseInfo.level || 'undergraduate'}
- Field: ${courseInfo.field || 'general'}
${weekSection ? `- ${weekSection}` : ''}

Quiz Requirements:
- Total questions: ${quizOptions.questionCount}
- Question distribution:
${Object.entries(distribution).map(([type, count]) => `  - ${type}: ${count} questions`).join('\n')}
- Difficulty: ${quizOptions.difficulty}
- Duration: ${quizOptions.durationMinutes} minutes
- ${topicsSection}

Question Types:

1. Multiple-choice:
   - 4 options (A, B, C, D)
   - Include explanation for correct answer
   - Use LaTeX for math: $\\\\frac{a}{b}$

2. True-False:
   - Clear statements (avoid tricks)
   - Include explanation

3. Short-answer:
   - 1-2 sentence expected answers
   - Include key points to look for

Format as valid JSON:
{
  "title": "Quiz title",
  "quiz_type": "${quizOptions.type}",
  "topic": "${quizOptions.topic || 'Course material'}",
  "duration_minutes": ${quizOptions.durationMinutes},
  "instructions": "Quiz instructions",
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "Question text",
      "options": ["A", "B", "C", "D"],
      "points": 2,
      "difficulty": "${quizOptions.difficulty}",
      "topic": "Specific topic",
      "explanation": "Why correct answer is right"
    }
  ],
  "answer_key": {
    "Q1": "B"
  }
}

IMPORTANT:
- Use double backslashes in LaTeX: \\\\frac not \\frac
- Question IDs must match answer_key entries
- MC answers: A, B, C, or D
- T/F answers: "True" or "False"
- Points: 1-3 per question (small for quizzes)
`.trim(),
    options: quizOptions,
    config: courseInfo
  };
}

/**
 * Validate conversationally generated quiz
 * @param {Object} quizContent - Generated quiz content
 * @param {Object} options - Original options
 * @returns {Object} Validation result
 */
export function validateConversationalQuiz(quizContent, options = {}) {
  // Load templates
  const baseTemplate = loadTemplate('quiz');

  // Apply defaults and enrich
  let content = applyDefaults(quizContent, baseTemplate);

  // Inject auto-fields
  content = injectAutoFields(content, baseTemplate, {
    generated_by: {
      tool: 'scholar',
      version: '1.0.0',
      method: 'conversational',
      command: '/teaching:quiz'
    }
  });

  // Ensure quiz-specific fields with defaults
  content.randomize_questions = content.randomize_questions || false;
  content.randomize_options = content.randomize_options || false;
  content.show_feedback = content.show_feedback || 'after_submit';
  content.allow_retakes = content.allow_retakes || false;
  content.max_attempts = content.max_attempts || 1;

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
      quizType: content.quiz_type,
      topic: content.topic,
      questionCount: content.questions ? content.questions.length : 0,
      totalPoints: content.total_points,
      duration: content.duration_minutes,
      generatedAt: new Date().toISOString(),
      method: 'conversational'
    }
  };
}

/**
 * Save conversationally generated quiz
 * @param {Object} quiz - Quiz with content, validation, metadata
 * @param {string} outputDir - Directory to save to (default: current)
 * @returns {string} Path to saved file
 */
export function saveConversationalQuiz(quiz, outputDir = process.cwd()) {
  const timestamp = Date.now();
  const topicSlug = (quiz.content.topic || 'quiz')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 30);
  const filename = `quiz-${quiz.content.quiz_type}-${topicSlug}-${timestamp}.json`;
  const filepath = join(outputDir, filename);

  writeFileSync(filepath, JSON.stringify(quiz.content, null, 2));

  return filepath;
}

/**
 * Display quiz summary
 * @param {Object} quiz - Quiz object
 */
export function displayQuizSummary(quiz) {
  console.log('\n✅ Quiz Generated Successfully!\n');
  console.log('📊 Quiz Statistics:');
  console.log(`  Type: ${quiz.content.quiz_type}`);
  console.log(`  Topic: ${quiz.content.topic || 'General'}`);
  console.log(`  Questions: ${quiz.metadata.questionCount}`);
  console.log(`  Total Points: ${quiz.metadata.totalPoints}`);
  console.log(`  Duration: ${quiz.metadata.duration} minutes\n`);

  // Question breakdown
  const questionTypes = {};
  quiz.content.questions.forEach(q => {
    questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
  });

  console.log('📝 Question Types:');
  Object.entries(questionTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Difficulty breakdown
  const difficulties = {};
  quiz.content.questions.forEach(q => {
    const d = q.difficulty || 'medium';
    difficulties[d] = (difficulties[d] || 0) + 1;
  });

  console.log('\n📈 Difficulty Distribution:');
  Object.entries(difficulties).forEach(([diff, count]) => {
    console.log(`  ${diff}: ${count}`);
  });

  // Sample questions
  console.log('\n📋 Sample Questions:');
  quiz.content.questions.slice(0, 3).forEach(q => {
    const preview = q.text.length > 60
      ? q.text.substring(0, 60) + '...'
      : q.text;
    console.log(`  ${q.id} [${q.type}]: ${preview}`);
  });

  // Validation
  if (quiz.validation.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${quiz.validation.warnings.length}`);
  }
}

/**
 * Quick prompts for common quiz types
 */
export const QuickPrompts = {
  /**
   * Reading quiz prompt
   * @param {string} chapter - Chapter/reading name
   * @param {number} questions - Number of questions
   */
  reading: (chapter, questions = 5) => buildConversationalPrompt({
    type: 'reading',
    topic: chapter,
    relatedReading: chapter,
    questionCount: questions,
    durationMinutes: 10,
    difficulty: 'easy'
  }),

  /**
   * Checkpoint quiz prompt
   * @param {string} topic - Topic to assess
   * @param {number} week - Course week number
   */
  checkpoint: (topic, week) => buildConversationalPrompt({
    type: 'checkpoint',
    topic,
    week,
    questionCount: 8,
    durationMinutes: 15
  }),

  /**
   * Practice quiz prompt
   * @param {string} topic - Topic for practice
   */
  practice: (topic) => buildConversationalPrompt({
    type: 'practice',
    topic,
    questionCount: 10,
    durationMinutes: 20,
    showFeedback: 'immediate'
  }),

  /**
   * Review quiz prompt
   * @param {Array<string>} topics - Topics to review
   */
  review: (topics) => buildConversationalPrompt({
    type: 'review',
    topics: Array.isArray(topics) ? topics : [topics],
    questionCount: 15,
    durationMinutes: 25
  })
};

export {
  buildConversationalPrompt as buildPrompt,
  validateConversationalQuiz as validateQuiz,
  saveConversationalQuiz as saveQuiz,
  displayQuizSummary as displaySummary
};
