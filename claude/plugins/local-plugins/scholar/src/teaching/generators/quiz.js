/**
 * Quiz Generator
 *
 * Generates quizzes using Phase 0 foundation components:
 * - Template System for schema and structure
 * - Config Loader for course settings
 * - Validator Engine for content validation
 * - AI Provider for question generation
 *
 * Quizzes differ from exams:
 * - Shorter duration (15-30 minutes)
 * - More multiple-choice and true/false
 * - Formative assessment focus
 * - Support for online quiz features (randomization, retakes)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadTemplate, mergeTemplates, injectAutoFields, applyDefaults } from '../templates/loader.js';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { AIProvider } from '../ai/provider.js';
import {
  MarkdownFormatter,
  CanvasFormatter,
  QuartoFormatter,
  LaTeXFormatter
} from '../formatters/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Quiz generator options
 * @typedef {Object} QuizOptions
 * @property {string} type - Quiz type (reading, practice, checkpoint, pop, review)
 * @property {string} topic - Main topic for the quiz
 * @property {number} questionCount - Number of questions to generate (default: 8)
 * @property {string} difficulty - Difficulty level (easy, medium, hard)
 * @property {Array<string>} topics - Specific topics/subtopics to cover
 * @property {number} durationMinutes - Quiz duration (default: 15)
 * @property {Object} questionTypes - Distribution of question types
 * @property {boolean} randomize - Enable question randomization
 * @property {boolean} showFeedback - Show feedback after submission
 * @property {boolean} allowRetakes - Allow quiz retakes
 * @property {boolean} strict - Use strict validation
 * @property {boolean} debug - Enable debug logging
 */

/**
 * Default question type distribution for quizzes
 * Heavy on quick-answer formats (no essays)
 */
const DEFAULT_QUIZ_QUESTION_TYPES = {
  'multiple-choice': 0.6,
  'true-false': 0.2,
  'short-answer': 0.2
};

/**
 * Generate a quiz with AI
 * @param {QuizOptions} options - Generation options
 * @returns {Promise<Object>} Generated quiz with metadata
 */
export async function generateQuiz(options = {}) {
  // 1. Load configuration
  const config = loadTeachConfig(process.cwd());

  // 2. Merge options with config defaults
  const quizOptions = {
    type: options.type || 'checkpoint',
    topic: options.topic || '',
    questionCount: options.questionCount || 8,
    difficulty: options.difficulty || config.scholar?.course_info?.difficulty || 'intermediate',
    topics: options.topics || [],
    durationMinutes: options.durationMinutes || 15,
    questionTypes: options.questionTypes || DEFAULT_QUIZ_QUESTION_TYPES,
    randomize: options.randomize || false,
    showFeedback: options.showFeedback !== false ? 'after_submit' : 'never',
    allowRetakes: options.allowRetakes || false,
    maxAttempts: options.maxAttempts || 1,
    week: options.week || null,
    relatedReading: options.relatedReading || null,
    learningObjectives: options.learningObjectives || [],
    strict: options.strict || false,
    debug: options.debug || false
  };

  if (quizOptions.debug) {
    console.log('📋 Quiz Options:', JSON.stringify(quizOptions, null, 2));
  }

  // 3. Load templates
  const baseTemplate = loadTemplate('quiz');
  const quizSpecific = loadQuizTemplate();
  const fullTemplate = mergeTemplates(baseTemplate, quizSpecific);

  if (quizOptions.debug) {
    console.log('📄 Template loaded');
  }

  // 4. Build AI prompt (or use pre-merged prompt from InstructionMerger)
  const prompt = options.mergedPrompt || buildQuizPrompt(quizOptions, config);

  if (quizOptions.debug) {
    if (options.mergedPrompt) {
      console.log('🔧 Using merged prompt from InstructionMerger');
    }
    console.log('🤖 Prompt:', prompt.substring(0, 200) + '...');
  }

  // 5. Generate content with AI
  const ai = new AIProvider({
    apiKey: config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY,
    model: config.scholar?.ai_generation?.model || 'claude-3-5-sonnet-20241022',
    maxTokens: config.scholar?.ai_generation?.max_tokens || 4096,
    timeout: config.scholar?.ai_generation?.timeout || 30000,
    debug: quizOptions.debug
  });

  const result = await ai.generate(prompt, {
    format: 'json',
    temperature: config.scholar?.ai_generation?.temperature || 0.7,
    context: {
      course: config.scholar?.course_info || {},
      difficulty: quizOptions.difficulty,
      type: quizOptions.type
    }
  });

  if (!result.success) {
    throw new Error(`AI generation failed: ${result.error}`);
  }

  if (quizOptions.debug) {
    console.log('✨ Content generated');
  }

  // 6. Process and enrich content
  let content = result.content;

  // Apply defaults from template
  content = applyDefaults(content, fullTemplate);

  // Inject auto-fields
  content = injectAutoFields(content, fullTemplate, {
    course: config.scholar?.course_info || {},
    generated_by: {
      tool: 'scholar',
      version: '1.0.0',
      model: result.metadata.model || ai.model,
      tokens: result.metadata.tokens,
      command: '/teaching:quiz'
    }
  });

  // Ensure quiz-specific fields
  content.randomize_questions = quizOptions.randomize;
  content.randomize_options = quizOptions.randomize;
  content.show_feedback = quizOptions.showFeedback;
  content.allow_retakes = quizOptions.allowRetakes;
  content.max_attempts = quizOptions.maxAttempts;

  if (quizOptions.week) {
    content.week = quizOptions.week;
  }
  if (quizOptions.relatedReading) {
    content.related_reading = quizOptions.relatedReading;
  }
  if (quizOptions.learningObjectives.length > 0) {
    content.learning_objectives = quizOptions.learningObjectives;
  }

  // Calculate total points
  content.total_points = content.questions
    ? content.questions.reduce((sum, q) => sum + (q.points || 0), 0)
    : 0;

  if (quizOptions.debug) {
    console.log(`📊 Total points: ${content.total_points}`);
  }

  // 7. Validate content
  const validator = new ValidatorEngine({
    strictMode: quizOptions.strict,
    validateLatex: true,
    checkCompleteness: true
  });

  const validation = validator.validate(content, fullTemplate);

  if (!validation.isValid) {
    const errorMsg = validation.errors
      .map(err => `  ${err.field}: ${err.message}`)
      .join('\n');
    throw new Error(`Validation failed:\n${errorMsg}`);
  }

  if (validation.warnings.length > 0 && quizOptions.debug) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  ${warning}`);
    });
  }

  if (quizOptions.debug) {
    console.log('✅ Validation passed');
  }

  // 8. Return complete quiz
  return {
    content,
    validation,
    metadata: {
      ...result.metadata,
      quizType: quizOptions.type,
      topic: quizOptions.topic,
      questionCount: content.questions ? content.questions.length : 0,
      totalPoints: content.total_points,
      duration: content.duration_minutes,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Load quiz-specific template
 * @returns {Object} Quiz template schema
 */
function loadQuizTemplate() {
  const templatePath = join(__dirname, '../templates/quiz.json');
  const templateContent = readFileSync(templatePath, 'utf-8');
  return JSON.parse(templateContent);
}

/**
 * Build AI prompt for quiz generation
 * @param {QuizOptions} options - Quiz options
 * @param {Object} config - Course configuration
 * @returns {string} Formatted prompt
 */
function buildQuizPrompt(options, config) {
  const courseInfo = config.scholar?.course_info || {};

  // Calculate question distribution
  const distribution = {};
  Object.entries(options.questionTypes).forEach(([type, ratio]) => {
    distribution[type] = Math.round(options.questionCount * ratio);
  });

  // Adjust to ensure total equals questionCount
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total !== options.questionCount) {
    const diff = options.questionCount - total;
    const firstType = Object.keys(distribution)[0];
    distribution[firstType] += diff;
  }

  // Quiz type descriptions
  const quizTypeDescriptions = {
    reading: 'a reading comprehension quiz testing understanding of assigned readings',
    practice: 'a practice quiz for self-study with hints and explanations',
    checkpoint: 'a progress checkpoint quiz to assess understanding of recent material',
    pop: 'a quick pop quiz on recent lecture content',
    review: 'a review quiz to prepare for an upcoming exam'
  };

  const quizDescription = quizTypeDescriptions[options.type] || 'a quiz';

  const topicsSection = options.topics.length > 0
    ? `Specific topics to cover:\n${options.topics.map(t => `- ${t}`).join('\n')}`
    : options.topic
      ? `Main topic: ${options.topic}`
      : 'Topics: Cover recent course material';

  const weekSection = options.week
    ? `This quiz is for Week ${options.week} of the course.`
    : '';

  const readingSection = options.relatedReading
    ? `Related reading: ${options.relatedReading}`
    : '';

  return `
Generate ${quizDescription} for ${courseInfo.code || 'the course'}: ${courseInfo.title || ''}.

Course Information:
- Level: ${courseInfo.level || 'undergraduate'}
- Field: ${courseInfo.field || 'general'}
${weekSection}
${readingSection}

Quiz Requirements:
- Total questions: ${options.questionCount}
- Question distribution:
${Object.entries(distribution).map(([type, count]) => `  - ${type}: ${count} questions`).join('\n')}
- Difficulty: ${options.difficulty}
- Duration: ${options.durationMinutes} minutes
- ${topicsSection}

Question Type Specifications:

1. Multiple-choice questions:
   - Provide exactly 4 options (A, B, C, D)
   - Make distractors plausible but clearly incorrect
   - Include brief explanation for why correct answer is right
   - Use LaTeX for mathematical notation: $\\\\frac{a}{b}$

2. True-False questions:
   - Clear, unambiguous statements
   - Avoid trick questions with subtle wording
   - Include explanation for the correct answer

3. Short-answer questions:
   - Clear, specific questions
   - Expected answer: 1-2 sentences
   - Provide acceptable answer variations

Quiz-Specific Guidelines:
- Questions should be answerable in ~2 minutes each
- Focus on key concepts, not minor details
- Include mix of recall and application questions
- Make feedback/explanations educational

${options.type === 'practice' ? '- Include helpful hints for each question\n- Explanations should be detailed and educational' : ''}
${options.type === 'review' ? '- Questions should preview exam-style content\n- Cover breadth of material' : ''}

Format the output as JSON matching this structure:
{
  "title": "Quiz title (e.g., 'Week 3 Checkpoint: Linear Regression')",
  "quiz_type": "${options.type}",
  "topic": "${options.topic || 'Course material'}",
  "duration_minutes": ${options.durationMinutes},
  "instructions": "Brief quiz instructions",
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "Question text with $\\\\LaTeX$ if needed",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "points": 2,
      "difficulty": "${options.difficulty}",
      "topic": "Specific topic",
      "explanation": "Why the correct answer is right"
    },
    {
      "id": "Q2",
      "type": "true-false",
      "text": "Statement to evaluate",
      "options": ["True", "False"],
      "points": 1,
      "difficulty": "easy",
      "topic": "Topic name",
      "explanation": "Why this is true/false"
    },
    {
      "id": "Q3",
      "type": "short-answer",
      "text": "Question requiring brief response",
      "points": 3,
      "difficulty": "medium",
      "topic": "Topic name",
      "explanation": "Key points for the answer"
    }
  ],
  "answer_key": {
    "Q1": "B",
    "Q2": "True",
    "Q3": "Expected answer or key points"
  }
}

IMPORTANT:
- Ensure all question IDs in answer_key match question IDs in questions array
- For multiple-choice, answer should be single letter: "A", "B", "C", or "D"
- For true-false, answer should be "True" or "False"
- All LaTeX must use double backslashes: \\\\frac, \\\\alpha, etc.
- Points should be small numbers (1-3 per question typical for quizzes)
- Include explanation field for each question
`.trim();
}

/**
 * Generate quiz and save to file
 * @param {QuizOptions} options - Generation options
 * @param {string} outputPath - Path to save quiz
 * @param {string} format - Output format (json|md|canvas|qmd|tex)
 * @returns {Promise<Object>} Generated quiz with file path
 */
export async function generateAndSaveQuiz(options, outputPath, format = 'json') {
  const quiz = await generateQuiz(options);

  // Normalize format
  const fmt = format.toLowerCase();

  let output, finalPath;

  if (fmt === 'json') {
    // Default JSON format
    output = JSON.stringify(quiz.content, null, 2);
    finalPath = outputPath.endsWith('.json') ? outputPath : outputPath + '.json';
    writeFileSync(finalPath, output);
  } else if (fmt === 'md' || fmt === 'markdown') {
    // Markdown format
    const formatter = new MarkdownFormatter();
    output = formatter.format(quiz.content);
    finalPath = outputPath.replace(/\.[^.]+$/, '.md');
    writeFileSync(finalPath, output);
  } else if (fmt === 'canvas' || fmt === 'qti') {
    // Canvas QTI format (async)
    const formatter = new CanvasFormatter({ debug: options.debug });
    finalPath = outputPath.replace(/\.[^.]+$/, '.qti.zip');
    output = await formatter.format(quiz.content, { output: finalPath });
    finalPath = output;
  } else if (fmt === 'qmd' || fmt === 'quarto') {
    // Quarto format
    const formatter = new QuartoFormatter();
    output = formatter.format(quiz.content);
    finalPath = outputPath.replace(/\.[^.]+$/, '.qmd');
    writeFileSync(finalPath, output);
  } else if (fmt === 'tex' || fmt === 'latex') {
    // LaTeX format
    const formatter = new LaTeXFormatter();
    output = formatter.format(quiz.content);
    finalPath = outputPath.replace(/\.[^.]+$/, '.tex');
    writeFileSync(finalPath, output);
  } else {
    throw new Error(`Unsupported format: ${format}. Supported: json, md, canvas, qmd, tex`);
  }

  return {
    ...quiz,
    filePath: finalPath,
    format: fmt
  };
}

/**
 * Generate quiz bank (multiple quizzes on same topic)
 * @param {QuizOptions} options - Base generation options
 * @param {number} count - Number of quiz variations
 * @returns {Promise<Array<Object>>} Array of generated quizzes
 */
export async function generateQuizBank(options, count = 3) {
  const quizzes = [];

  for (let i = 0; i < count; i++) {
    const variantOptions = {
      ...options,
      debug: false // Disable debug for batch generation
    };

    const quiz = await generateQuiz(variantOptions);
    quizzes.push({
      ...quiz,
      variant: i + 1
    });

    // Small delay between generations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return quizzes;
}

/**
 * Quick quiz generator for common use cases
 */
export const QuickQuiz = {
  /**
   * Generate a reading quiz
   * @param {string} topic - Reading/chapter topic
   * @param {number} questions - Number of questions (default: 5)
   */
  reading: (topic, questions = 5) => generateQuiz({
    type: 'reading',
    topic,
    questionCount: questions,
    durationMinutes: 10,
    difficulty: 'easy'
  }),

  /**
   * Generate a checkpoint quiz
   * @param {string} topic - Topic to assess
   * @param {number} week - Course week number
   */
  checkpoint: (topic, week) => generateQuiz({
    type: 'checkpoint',
    topic,
    week,
    questionCount: 8,
    durationMinutes: 15,
    difficulty: 'medium'
  }),

  /**
   * Generate a practice quiz with hints
   * @param {string} topic - Topic for practice
   * @param {number} questions - Number of questions
   */
  practice: (topic, questions = 10) => generateQuiz({
    type: 'practice',
    topic,
    questionCount: questions,
    durationMinutes: 20,
    difficulty: 'medium',
    showFeedback: 'immediate',
    allowRetakes: true,
    maxAttempts: 3
  }),

  /**
   * Generate an exam review quiz
   * @param {Array<string>} topics - Topics to review
   * @param {number} questions - Number of questions
   */
  review: (topics, questions = 15) => generateQuiz({
    type: 'review',
    topics: Array.isArray(topics) ? topics : [topics],
    questionCount: questions,
    durationMinutes: 25,
    difficulty: 'medium'
  })
};
