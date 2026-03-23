/**
 * Exam Generator
 *
 * Generates exams using Phase 0 foundation components:
 * - Template System for schema and structure
 * - Config Loader for course settings
 * - Validator Engine for content validation
 * - AI Provider for question generation
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
 * Exam generator options
 * @typedef {Object} ExamOptions
 * @property {string} type - Exam type (midterm, final, practice, quiz)
 * @property {number} questionCount - Number of questions to generate
 * @property {string} difficulty - Difficulty level (easy, medium, hard)
 * @property {Array<string>} topics - Topics to cover
 * @property {number} durationMinutes - Exam duration
 * @property {Object} questionTypes - Distribution of question types
 * @property {boolean} includeFormulas - Include formula sheet
 * @property {boolean} includeSolutions - Include detailed solutions
 * @property {boolean} strict - Use strict validation
 * @property {boolean} debug - Enable debug logging
 * @property {string} [mergedPrompt] - Pre-merged prompt from InstructionMerger (bypasses buildExamPrompt)
 */

/**
 * Generate an exam with AI
 * @param {ExamOptions} options - Generation options
 * @returns {Promise<Object>} Generated exam with metadata
 */
export async function generateExam(options = {}) {
  // 1. Load configuration
  const config = loadTeachConfig(process.cwd());

  // 2. Merge options with config defaults
  const examOptions = {
    type: options.type || 'midterm',
    questionCount: options.questionCount || 10,
    difficulty: options.difficulty || config.scholar?.course_info?.difficulty || 'intermediate',
    topics: options.topics || [],
    durationMinutes: options.durationMinutes || 60,
    questionTypes: options.questionTypes || {
      'multiple-choice': 0.6,
      'short-answer': 0.3,
      'essay': 0.1
    },
    includeFormulas: options.includeFormulas !== false,
    includeSolutions: options.includeSolutions !== false,
    strict: options.strict || false,
    debug: options.debug || false
  };

  if (examOptions.debug) {
    console.log('📋 Exam Options:', JSON.stringify(examOptions, null, 2));
  }

  // 3. Load templates
  const baseTemplate = loadTemplate('exam');
  const examSpecific = loadExamTemplate();
  const fullTemplate = mergeTemplates(baseTemplate, examSpecific);

  if (examOptions.debug) {
    console.log('📄 Template loaded');
  }

  // 4. Build AI prompt (or use pre-merged prompt from InstructionMerger)
  const prompt = options.mergedPrompt || buildExamPrompt(examOptions, config);

  if (examOptions.debug) {
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
    debug: examOptions.debug
  });

  const result = await ai.generate(prompt, {
    format: 'json',
    temperature: config.scholar?.ai_generation?.temperature || 0.7,
    context: {
      course: config.scholar?.course_info || {},
      difficulty: examOptions.difficulty,
      type: examOptions.type
    }
  });

  if (!result.success) {
    throw new Error(`AI generation failed: ${result.error}`);
  }

  if (examOptions.debug) {
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
      command: '/teaching:exam'
    }
  });

  // Calculate total points
  content.total_points = content.questions
    ? content.questions.reduce((sum, q) => sum + (q.points || 0), 0)
    : 0;

  if (examOptions.debug) {
    console.log(`📊 Total points: ${content.total_points}`);
  }

  // 7. Validate content
  const validator = new ValidatorEngine({
    strictMode: examOptions.strict,
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

  if (validation.warnings.length > 0 && examOptions.debug) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  ${warning}`);
    });
  }

  if (examOptions.debug) {
    console.log('✅ Validation passed');
  }

  // 8. Return complete exam
  return {
    content,
    validation,
    metadata: {
      ...result.metadata,
      examType: examOptions.type,
      questionCount: content.questions ? content.questions.length : 0,
      totalPoints: content.total_points,
      duration: content.duration_minutes,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Load exam-specific template
 * @returns {Object} Exam template schema
 */
function loadExamTemplate() {
  const templatePath = join(__dirname, '../templates/exam.json');
  const templateContent = readFileSync(templatePath, 'utf-8');
  return JSON.parse(templateContent);
}

/**
 * Build AI prompt for exam generation
 * @param {ExamOptions} options - Exam options
 * @param {Object} config - Course configuration
 * @returns {string} Formatted prompt
 */
function buildExamPrompt(options, config) {
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

  const topicsSection = options.topics.length > 0
    ? `Topics to cover: ${options.topics.join(', ')}`
    : 'Topics: Use course curriculum as guide';

  return `
Generate a ${options.type} exam for ${courseInfo.code || 'the course'}: ${courseInfo.title || ''}.

Course Information:
- Level: ${courseInfo.level || 'undergraduate'}
- Semester: ${courseInfo.semester || ''}
- Instructor: ${courseInfo.instructor?.name || ''}

Exam Requirements:
- Total questions: ${options.questionCount}
- Question distribution:
${Object.entries(distribution).map(([type, count]) => `  - ${type}: ${count} questions`).join('\n')}
- Difficulty: ${options.difficulty}
- Duration: ${options.durationMinutes} minutes
- ${topicsSection}

Question Types Specifications:
1. Multiple-choice questions:
   - Provide exactly 4 options (A, B, C, D)
   - Make distractors plausible
   - Include LaTeX for mathematical notation where appropriate

2. Short-answer questions:
   - Clear, specific questions
   - Expected answer length: 2-3 sentences
   - Include grading criteria
   - When multiple answers are acceptable, use = syntax in the answer_key:
     = answer1
     = answer2
     (Do NOT use repeated "Answer: text" lines)

3. Essay questions:
   - Provide detailed rubric with point breakdown
   - Expected answer length: 1-2 paragraphs
   - Include key concepts to address

General Guidelines:
- Use LaTeX notation for mathematical expressions: $\\frac{a}{b}$, $x^2$, etc.
- Ensure questions are clear and unambiguous
- Vary difficulty across questions if possible
- Include realistic context and examples
- Make sure answer key is complete

${options.includeFormulas ? 'Include a formula sheet with relevant equations (LaTeX format).' : ''}

Format the output as JSON matching this structure:
{
  "title": "Exam title (e.g., 'Midterm Exam - Statistics 101')",
  "exam_type": "${options.type}",
  "duration_minutes": ${options.durationMinutes},
  "instructions": "General exam instructions",
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "Question text with $\\\\LaTeX$ if needed",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "points": 10,
      "difficulty": "medium",
      "topic": "Topic name"
    },
    {
      "id": "Q2",
      "type": "short-answer",
      "text": "Question text",
      "points": 15,
      "difficulty": "medium",
      "topic": "Topic name"
    },
    {
      "id": "Q3",
      "type": "essay",
      "text": "Question text",
      "points": 20,
      "difficulty": "hard",
      "topic": "Topic name",
      "rubric": "Detailed grading rubric with point breakdown"
    }
  ],
  "answer_key": {
    "Q1": "B",
    "Q2": "Expected short answer or key points",
    "Q3": {
      "answer": "Key points to address in essay",
      "rubric_points": {
        "Introduction (5 pts)": "Clear thesis statement",
        "Analysis (10 pts)": "Thorough analysis with examples",
        "Conclusion (5 pts)": "Summary of key points"
      }
    }
  }${options.includeFormulas ? ',\n  "formula_sheet": "LaTeX formatted formulas"' : ''}
}

IMPORTANT:
- Ensure all question IDs in answer_key match question IDs in questions array
- For multiple-choice, answer should be single letter: "A", "B", "C", or "D"
- All LaTeX must use double backslashes: \\\\frac, \\\\alpha, etc.
- Total points should sum to a reasonable exam total (100-150 points typical)
`.trim();
}

/**
 * Generate exam and save to file
 * @param {ExamOptions} options - Generation options
 * @param {string} outputPath - Path to save exam
 * @param {string} format - Output format (json|md|canvas|qmd|tex)
 * @returns {Promise<Object>} Generated exam with file path
 */
export async function generateAndSaveExam(options, outputPath, format = 'json') {
  const exam = await generateExam(options);

  // Normalize format
  const fmt = format.toLowerCase();

  let output, finalPath;

  if (fmt === 'json') {
    // Default JSON format
    output = JSON.stringify(exam.content, null, 2);
    finalPath = outputPath.endsWith('.json') ? outputPath : outputPath + '.json';
    writeFileSync(finalPath, output);
  } else if (fmt === 'md' || fmt === 'markdown') {
    // Markdown format
    const formatter = new MarkdownFormatter();
    output = formatter.format(exam.content);
    finalPath = outputPath.replace(/\.[^.]+$/, '.md');
    writeFileSync(finalPath, output);
  } else if (fmt === 'canvas' || fmt === 'qti') {
    // Canvas QTI format (async)
    const formatter = new CanvasFormatter({ debug: options.debug });
    finalPath = outputPath.replace(/\.[^.]+$/, '.qti.zip');
    output = await formatter.format(exam.content, { output: finalPath });
    // Canvas formatter returns path to zip file
    finalPath = output;
  } else if (fmt === 'qmd' || fmt === 'quarto') {
    // Quarto format
    const formatter = new QuartoFormatter();
    output = formatter.format(exam.content);
    finalPath = outputPath.replace(/\.[^.]+$/, '.qmd');
    writeFileSync(finalPath, output);
  } else if (fmt === 'tex' || fmt === 'latex') {
    // LaTeX format
    const formatter = new LaTeXFormatter();
    output = formatter.format(exam.content);
    finalPath = outputPath.replace(/\.[^.]+$/, '.tex');
    writeFileSync(finalPath, output);
  } else {
    throw new Error(`Unsupported format: ${format}. Supported: json, md, canvas, qmd, tex`);
  }

  return {
    ...exam,
    filePath: finalPath,
    format: fmt
  };
}

/**
 * Generate multiple variations of an exam
 * @param {ExamOptions} options - Base generation options
 * @param {number} count - Number of variations
 * @returns {Promise<Array<Object>>} Array of generated exams
 */
export async function generateExamVariations(options, count = 2) {
  const variations = [];

  for (let i = 0; i < count; i++) {
    const variantOptions = {
      ...options,
      debug: false // Disable debug for batch generation
    };

    const exam = await generateExam(variantOptions);
    variations.push({
      ...exam,
      variant: i + 1
    });

    // Small delay between generations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return variations;
}
