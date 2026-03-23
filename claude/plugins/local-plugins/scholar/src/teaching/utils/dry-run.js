/**
 * Dry-Run Utility for Teaching Commands
 *
 * Provides preview functionality for all teaching commands.
 * Shows what would be generated without making API calls.
 */

import { loadTeachConfig, findConfigFile, getCourseInfo } from '../config/loader.js';
import { getTemplateMetadata } from '../templates/loader.js';
import { generateLectureFilename } from './slugify.js';

/**
 * Format dry-run output for a teaching command
 * @param {string} command - Command name (exam, quiz, syllabus, etc.)
 * @param {Object} options - Command options
 * @param {Object} promptData - Data used to build the prompt
 * @returns {Object} Dry-run preview data
 */
export function formatDryRun(command, options, promptData = {}) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = getCourseInfo(config);
  const configPath = findConfigFile(process.cwd());

  // Try to load template metadata
  let templateMeta = { type: command, title: `${command} Template`, version: '1.0' };
  try {
    templateMeta = getTemplateMetadata(command);
  } catch (_e) {
    // Template may not exist for all command types
  }

  return {
    command: `teaching:${command}`,
    would_generate: {
      format: options.format || 'markdown',
      output_file: generateOutputPath(command, options),
      template_used: templateMeta.type
    },
    parameters: sanitizeOptions(options),
    course_info: courseInfo.code ? {
      code: courseInfo.code,
      title: courseInfo.title,
      level: courseInfo.level,
      difficulty: courseInfo.difficulty
    } : { note: 'Using defaults (no teach-config.yml found)' },
    config_file: configPath || '(not found - using defaults)',
    prompt_preview: promptData.prompt
      ? truncatePrompt(promptData.prompt, 300)
      : '(prompt would be generated at runtime)',
    estimated_tokens: promptData.prompt
      ? estimateTokens(promptData.prompt)
      : estimateTokensFromOptions(command, options),
    api_calls: 0
  };
}

/**
 * Format dry-run data for human-readable output
 * @param {Object} preview - Dry-run preview data
 * @returns {string} Formatted output string
 */
export function formatHumanReadable(preview) {
  const lines = [];

  lines.push(`DRY RUN: /${preview.command}`);
  lines.push('');
  lines.push('Would generate:');
  lines.push(`  Format: ${preview.would_generate.format}`);
  lines.push(`  Output: ${preview.would_generate.output_file}`);
  lines.push(`  Template: ${preview.would_generate.template_used}`);
  lines.push('');

  // Parameters section
  lines.push('Parameters:');
  for (const [key, value] of Object.entries(preview.parameters)) {
    if (value !== undefined && value !== null) {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      lines.push(`  ${formatKey(key)}: ${displayValue}`);
    }
  }
  lines.push('');

  // Course info
  lines.push('Course info:');
  if (preview.course_info.note) {
    lines.push(`  ${preview.course_info.note}`);
  } else {
    lines.push(`  Code: ${preview.course_info.code || '(not set)'}`);
    lines.push(`  Title: ${preview.course_info.title || '(not set)'}`);
    lines.push(`  Level: ${preview.course_info.level || 'undergraduate'}`);
    lines.push(`  Difficulty: ${preview.course_info.difficulty || 'intermediate'}`);
  }
  lines.push('');

  // Config file
  lines.push(`Config: ${preview.config_file}`);
  lines.push('');

  // Prompt preview
  lines.push('Prompt preview:');
  lines.push(`  "${preview.prompt_preview}"`);
  lines.push('');

  // Token estimate
  lines.push(`Estimated tokens: ~${preview.estimated_tokens}`);
  lines.push('');
  lines.push('No API calls would be made.');

  return lines.join('\n');
}

/**
 * Generate expected output file path
 * @param {string} command - Command name
 * @param {Object} options - Command options
 * @returns {string} Expected output filename
 */
export function generateOutputPath(command, options) {
  const date = new Date().toISOString().split('T')[0];
  const format = options.format || 'md';
  const type = options.type || command;

  // Map format to extension
  const extMap = {
    markdown: 'md',
    md: 'md',
    json: 'json',
    latex: 'tex',
    tex: 'tex',
    quarto: 'qmd',
    qmd: 'qmd',
    canvas: 'qti.zip',
    qti: 'qti.zip',
    'html,pdf,docx': 'qmd' // Lecture notes multi-format output
  };

  const ext = extMap[format] || 'md';

  // Special handling for lecture-notes command
  if (command === 'lecture-notes' || command === 'lecture') {
    const filename = generateLectureFilename(options);
    const outputDir = options.outputDir || options.output || '';
    return outputDir ? `${outputDir.replace(/\/?$/, '/')}${filename}` : filename;
  }

  return `${command}-${type}-${date}.${ext}`;
}

/**
 * Truncate prompt for preview
 * @param {string} prompt - Full prompt text
 * @param {number} maxLength - Maximum length (default: 200)
 * @returns {string} Truncated prompt with ellipsis
 */
export function truncatePrompt(prompt, maxLength = 200) {
  if (!prompt) return '(no prompt)';

  // Clean up whitespace
  const cleaned = prompt.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.substring(0, maxLength) + '...';
}

/**
 * Estimate token count from prompt text
 * Rough estimate: ~4 characters per token for English text
 * @param {string} prompt - Prompt text
 * @returns {number} Estimated token count
 */
export function estimateTokens(prompt) {
  if (!prompt) return 0;

  // Rough estimate: ~4 chars per token, plus overhead for JSON response
  const promptTokens = Math.ceil(prompt.length / 4);
  const responseEstimate = 2000; // Typical response size

  return promptTokens + responseEstimate;
}

/**
 * Estimate tokens based on command type and options
 * @param {string} command - Command name
 * @param {Object} options - Command options
 * @returns {number} Estimated token count
 */
export function estimateTokensFromOptions(command, options) {
  // Base estimates by command type
  const baseEstimates = {
    exam: 3000,
    quiz: 1500,
    syllabus: 2500,
    assignment: 1500,
    rubric: 1000,
    slides: 2000,
    feedback: 1000,
    'lecture-notes': 8000, // 20-40 pages = multiple API calls
    lecture: 8000, // Alias for lecture-notes
    'validate-r': 500 // R chunk extraction only, no AI generation
  };

  let estimate = baseEstimates[command] || 2000;

  // Adjust for options
  if (options.questionCount) {
    estimate += options.questionCount * 150; // ~150 tokens per question
  }

  if (options.weeks) {
    estimate += options.weeks * 100; // ~100 tokens per week
  }

  if (options.slideCount) {
    estimate += options.slideCount * 80; // ~80 tokens per slide
  }

  // Lecture notes: estimate based on section count (10-15 sections)
  if (command === 'lecture-notes' || command === 'lecture') {
    // Section-by-section generation: ~800 tokens per section
    const sectionCount = options.sectionCount || 12;
    estimate = sectionCount * 800;
  }

  return estimate;
}

/**
 * Sanitize options for display (remove internal/sensitive fields)
 * @param {Object} options - Raw options
 * @returns {Object} Sanitized options
 */
function sanitizeOptions(options) {
  const sanitized = { ...options };

  // Remove internal fields
  delete sanitized.debug;
  delete sanitized.dryRun;
  delete sanitized.json;
  delete sanitized._;

  // Don't show false values for boolean flags
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] === false) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

/**
 * Format camelCase/snake_case key for display
 * @param {string} key - Key to format
 * @returns {string} Formatted key
 */
function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

/**
 * Check if dry-run mode is enabled in options
 * @param {Object} options - Command options
 * @returns {boolean} True if dry-run is enabled
 */
export function isDryRun(options) {
  return options.dryRun === true || options['dry-run'] === true;
}

/**
 * Execute dry-run and exit
 * @param {string} command - Command name
 * @param {Object} options - Command options
 * @param {Object} promptData - Optional prompt data
 */
export function executeDryRun(command, options, promptData = {}) {
  // Special handling for lecture-notes with detailed outline display
  if (command === 'lecture-notes' || command === 'lecture') {
    const output = formatLectureNotesDryRun(options);
    if (options.json) {
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log(formatLectureNotesHumanReadable(output));
    }
    process.exit(0);
  }

  const preview = formatDryRun(command, options, promptData);

  if (options.json) {
    console.log(JSON.stringify(preview, null, 2));
  } else {
    console.log(formatHumanReadable(preview));
  }

  process.exit(0);
}

/**
 * Format dry-run output specifically for lecture notes
 * @param {Object} options - Command options
 * @returns {Object} Detailed dry-run preview
 */
function formatLectureNotesDryRun(options) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = getCourseInfo(config);

  const topic = options.topic || options.fromPlan || 'Topic';
  const filename = generateLectureFilename(options);
  const outputDir = options.outputDir || options.output || '';

  return {
    command: 'teaching:lecture',
    topic,
    config: {
      level: options.level || courseInfo.level || 'undergraduate',
      language: options.language || 'r',
      style: config.scholar?.style?.tone || 'formal',
      pedagogical_approach: config.scholar?.style?.pedagogical_approach || 'active-learning',
      from_plan: options.fromPlan || null
    },
    learning_objectives: [
      `Understand the fundamental concepts of ${topic}`,
      `Apply ${topic} techniques to real-world problems`,
      `Interpret results from ${topic} analysis`,
      `Evaluate assumptions and limitations of ${topic}`
    ],
    outline: [
      { id: 'S1', type: 'introduction', title: `Introduction to ${topic}`, pages: 2 },
      { id: 'S2', type: 'concept', title: `Core Concepts of ${topic}`, pages: 4,
        subsections: [
          { id: 'S2.1', title: 'Key Definitions' },
          { id: 'S2.2', title: 'Mathematical Framework' }
        ]
      },
      { id: 'S3', type: 'example', title: `Worked Example`, pages: 5, has_code: true },
      { id: 'S4', type: 'code', title: `${(options.language || 'R').toUpperCase()} Implementation`, pages: 3, has_code: true },
      { id: 'S5', type: 'practice', title: 'Practice Problems', pages: 3 },
      { id: 'S6', type: 'summary', title: 'Key Takeaways', pages: 1 }
    ],
    output: {
      path: outputDir ? `${outputDir.replace(/\/?$/, '/')}${filename}` : filename,
      formats: (options.format || 'html,pdf,docx').split(',').map(f => f.trim())
    },
    estimates: {
      total_pages: 18,
      total_sections: 6,
      code_blocks: 2,
      api_calls: 7,
      generation_time: '2-3 minutes',
      estimated_cost: '$0.15-0.25'
    }
  };
}

/**
 * Format lecture notes dry-run for human-readable display
 * @param {Object} preview - Dry-run preview data
 * @returns {string} Formatted output
 */
function formatLectureNotesHumanReadable(preview) {
  const lines = [];

  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push(`│ 📝 LECTURE NOTES: ${preview.topic.substring(0, 35).padEnd(35)} (DRY-RUN) │`);
  lines.push('├─────────────────────────────────────────────────────────────┤');
  lines.push('│                                                             │');
  lines.push('│ 📊 Configuration                                            │');
  lines.push(`│    Topic: ${preview.topic.substring(0, 45).padEnd(45)}    │`);
  lines.push(`│    Level: ${preview.config.level.padEnd(45)}    │`);
  lines.push(`│    Language: ${preview.config.language.toUpperCase().padEnd(42)}    │`);
  lines.push(`│    Style: ${preview.config.style} / ${preview.config.pedagogical_approach}`.padEnd(57) + '│');
  if (preview.config.from_plan) {
    lines.push(`│    From Plan: ${preview.config.from_plan.substring(0, 41).padEnd(41)}    │`);
  }
  lines.push('│                                                             │');
  lines.push('│ 🎯 Learning Objectives                                      │');
  preview.learning_objectives.forEach((obj, i) => {
    const truncated = obj.substring(0, 50);
    lines.push(`│    ${i + 1}. ${truncated.padEnd(50)}   │`);
  });
  lines.push('│                                                             │');
  lines.push(`│ 📋 Outline (${preview.outline.length} sections, ~${preview.estimates.total_pages} pages)`.padEnd(58) + '│');
  preview.outline.forEach(section => {
    const codeIndicator = section.has_code ? ' [code]' : '';
    const sectionLine = `│    ${section.id}. ${section.title} (${section.pages} pages)${codeIndicator}`;
    lines.push(sectionLine.padEnd(58) + '│');
    if (section.subsections) {
      section.subsections.forEach(sub => {
        lines.push(`│        ${sub.id} ${sub.title}`.padEnd(58) + '│');
      });
    }
  });
  lines.push('│                                                             │');
  lines.push('│ 📦 Output                                                   │');
  lines.push(`│    Path: ${preview.output.path.substring(0, 45).padEnd(45)}    │`);
  lines.push(`│    Formats: ${preview.output.formats.join(', ').padEnd(42)}    │`);
  lines.push('│                                                             │');
  lines.push('├─────────────────────────────────────────────────────────────┤');
  lines.push('│ 💡 Run without --dry-run to generate full lecture notes     │');
  lines.push(`│    Estimated generation time: ${preview.estimates.generation_time.padEnd(24)}    │`);
  lines.push(`│    Estimated API cost: ${preview.estimates.estimated_cost.padEnd(31)}    │`);
  lines.push('└─────────────────────────────────────────────────────────────┘');

  return lines.join('\n');
}
