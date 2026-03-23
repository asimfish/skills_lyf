/**
 * Conversational Solution Key Generator for Claude Code
 *
 * Uses Claude Code's conversational interface instead of API calls.
 * Reads an existing assignment file and generates a standalone solution key.
 *
 * Usage in Claude Code:
 * - /teaching:solution assignments/assignment1.qmd
 * - /teaching:solution assignments/hw3.json --format qmd
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { loadTeachConfig } from '../config/loader.js';
import {
  parseAssignment,
  buildSolutionPrompt,
  formatSolutionAsMarkdown,
  formatSolutionAsQuarto,
  generateOutputPath
} from './solution.js';

/**
 * Build conversational prompt from an assignment file
 * @param {string} assignmentPath - Path to assignment file
 * @param {Object} options - Generation options
 * @returns {Object} Prompt and metadata for Claude
 */
export function buildConversationalPrompt(assignmentPath, options = {}) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  // Parse the assignment file
  const assignment = parseAssignment(assignmentPath);

  const solutionOptions = {
    includeRubric: options.includeRubric || false,
    includeCode: options.includeCode !== false,
    language: options.language || 'R',
    debug: options.debug || false
  };

  // Build the prompt
  const prompt = buildSolutionPrompt(assignment, solutionOptions, config);

  return {
    prompt,
    assignment,
    options: solutionOptions,
    config: courseInfo
  };
}

/**
 * Process conversationally generated solution content
 * @param {Object|string} content - Generated content (JSON object or string)
 * @param {Object} assignment - Parsed assignment object
 * @param {Object} options - Processing options
 * @returns {Object} Processed solution
 */
export function processGeneratedSolution(content, assignment, options = {}) {
  // Parse if string
  const solution = typeof content === 'string' ? JSON.parse(content) : content;

  // Add metadata
  solution.metadata = solution.metadata || {};
  solution.metadata.generated_at = new Date().toISOString();
  solution.metadata.generator = 'scholar-solution-conversational';
  solution.metadata.source_file = assignment.sourceFile;

  // Ensure assignment_title
  if (!solution.assignment_title) {
    solution.assignment_title = assignment.title || 'Assignment';
  }

  // Validate solution structure
  if (!solution.solutions || typeof solution.solutions !== 'object') {
    throw new Error('Generated content is missing "solutions" object');
  }

  const solutionCount = Object.keys(solution.solutions).length;
  if (solutionCount === 0) {
    throw new Error('No solutions were generated');
  }

  return solution;
}

/**
 * Save solution to file with auto-directory creation
 * @param {Object} assignment - Parsed assignment
 * @param {Object} solution - Solution object
 * @param {string} filename - Output filename (without extension) or full path
 * @param {Object} options - Save options
 * @returns {Object} Save result with filepath
 */
export function saveSolution(assignment, solution, filename, options = {}) {
  const format = options.format || 'qmd';

  // Determine output path
  let filepath;
  if (filename.includes('/') || filename.includes('\\')) {
    // Full or relative path provided
    filepath = filename;
  } else {
    // Just a filename — use default solutions/ dir
    const outputPath = generateOutputPath(assignment.sourceFile, format);
    const dir = dirname(outputPath);
    filepath = join(dir, filename);
  }

  // Add extension if missing
  const extensions = { markdown: '.md', md: '.md', quarto: '.qmd', qmd: '.qmd', json: '.json' };
  const expectedExt = extensions[format.toLowerCase()] || '.qmd';
  if (!filepath.endsWith(expectedExt)) {
    filepath += expectedExt;
  }

  // Ensure directory exists
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Format and save
  let content;
  switch (format.toLowerCase()) {
    case 'markdown':
    case 'md':
      content = formatSolutionAsMarkdown(assignment, solution, options);
      break;
    case 'quarto':
    case 'qmd':
      content = formatSolutionAsQuarto(assignment, solution, options);
      break;
    case 'json':
      content = JSON.stringify(solution, null, 2);
      break;
    default:
      content = formatSolutionAsQuarto(assignment, solution, options);
  }

  writeFileSync(filepath, content, 'utf-8');

  return {
    filepath,
    format,
    size: content.length
  };
}

// Re-export parseAssignment for command usage
export { parseAssignment } from './solution.js';
