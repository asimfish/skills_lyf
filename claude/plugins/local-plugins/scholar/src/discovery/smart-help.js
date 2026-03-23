/**
 * Smart Help Engine - Context-Aware Command Suggestions
 *
 * Detects whether the user's current project is research-oriented or
 * teaching-oriented based on filesystem signals, then provides
 * context-aware command suggestions.
 *
 * Performance target: < 50ms (filesystem checks only, no parsing).
 *
 * @module discovery/smart-help
 */

import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Filesystem signals for teaching context detection.
 * Each signal has a path (relative to cwd) and a weight.
 * Higher weight = stronger signal.
 */
const TEACHING_SIGNALS = [
  { check: 'file', path: '.flow/teach-config.yml', weight: 3 },
  { check: 'dir', path: 'content/lesson-plans', weight: 2 },
  { check: 'file', path: '.flow/teaching-style.yml', weight: 2 },
  { check: 'glob', pattern: '*.qmd', dirs: ['.', 'content'], weight: 1 },
];

/**
 * Filesystem signals for research context detection.
 * Each signal has a path (relative to cwd) and a weight.
 * Higher weight = stronger signal.
 */
const RESEARCH_SIGNALS = [
  { check: 'dir', path: 'manuscript', weight: 3 },
  { check: 'glob', pattern: '*.bib', dirs: ['.', '..'], weight: 2 },
  { check: 'dir', path: 'simulation', weight: 2 },
  { check: 'file', path: 'DESCRIPTION', weight: 1 },
  { check: 'glob', pattern: '*.R', dirs: ['.'], weight: 1, altPattern: '*.py' },
];

/**
 * Suggested commands per context type.
 * Each entry is a command name (without namespace prefix).
 */
const SUGGESTIONS = {
  research: [
    { command: 'research:analysis-plan', description: 'Design a statistical analysis plan' },
    { command: 'research:hypothesis', description: 'Formulate and refine hypotheses' },
    { command: 'research:lit-gap', description: 'Identify literature gaps' },
    { command: 'research:manuscript:methods', description: 'Draft methods section' },
    { command: 'research:literature:arxiv', description: 'Search arXiv preprints' },
  ],
  teaching: [
    { command: 'teaching:exam', description: 'Generate an exam', tip: 'Use -i for custom instructions' },
    { command: 'teaching:quiz', description: 'Create a quiz', tip: 'Use -i for custom instructions' },
    { command: 'teaching:slides', description: 'Build lecture slides', tip: 'Use -i for custom instructions' },
    { command: 'teaching:assignment', description: 'Create an assignment', tip: 'Use -i for custom instructions' },
    { command: 'teaching:syllabus', description: 'Generate a syllabus', tip: 'Use -i for custom instructions' },
  ],
  mixed: [
    { command: 'scholar:hub', description: 'Open the Scholar command hub for all commands' },
  ],
};

/**
 * Check if a directory contains any files matching a glob-like extension pattern.
 * Uses readdirSync with try-catch for safety.
 *
 * @param {string} dir - Absolute directory path
 * @param {string} pattern - Simple glob pattern like '*.qmd'
 * @returns {boolean} True if at least one matching file exists
 */
function dirHasFileWithExtension(dir, pattern) {
  // Extract extension from simple glob pattern (e.g., '*.qmd' -> '.qmd')
  const ext = pattern.replace('*', '');

  try {
    if (!existsSync(dir)) return false;
    const entries = readdirSync(dir);
    return entries.some(entry => entry.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Evaluate a single signal against the filesystem.
 *
 * @param {object} signal - Signal definition
 * @param {string} cwd - Working directory
 * @returns {number} Weight if signal is present, 0 otherwise
 */
function evaluateSignal(signal, cwd) {
  switch (signal.check) {
    case 'file':
      return existsSync(join(cwd, signal.path)) ? signal.weight : 0;

    case 'dir':
      return existsSync(join(cwd, signal.path)) ? signal.weight : 0;

    case 'glob': {
      const dirs = signal.dirs || ['.'];
      for (const dir of dirs) {
        const absDir = dir === '..'
          ? dirname(cwd)
          : join(cwd, dir);

        if (dirHasFileWithExtension(absDir, signal.pattern)) {
          return signal.weight;
        }
        // Check alternate pattern if defined (e.g., *.R or *.py)
        if (signal.altPattern && dirHasFileWithExtension(absDir, signal.altPattern)) {
          return signal.weight;
        }
      }
      return 0;
    }

    default:
      return 0;
  }
}

/**
 * Detect the project context based on filesystem signals.
 *
 * Scans the working directory for teaching and research indicators,
 * weights them, and returns the dominant context.
 *
 * @param {string} cwd - Working directory to analyze
 * @returns {'research'|'teaching'|'mixed'} Detected project context
 *
 * @example
 * // In a course directory with .flow/teach-config.yml
 * detectContext('/Users/dt/teaching/stat-440');
 * // => 'teaching'
 *
 * @example
 * // In a research project with manuscript/ and .bib files
 * detectContext('/Users/dt/research/my-paper');
 * // => 'research'
 */
export function detectContext(cwd) {
  if (!cwd) return 'mixed';

  let teachingScore = 0;
  let researchScore = 0;

  for (const signal of TEACHING_SIGNALS) {
    teachingScore += evaluateSignal(signal, cwd);
  }

  for (const signal of RESEARCH_SIGNALS) {
    researchScore += evaluateSignal(signal, cwd);
  }

  if (teachingScore > researchScore) return 'teaching';
  if (researchScore > teachingScore) return 'research';
  return 'mixed';
}

/**
 * Get the top 5 suggested commands for a detected context.
 *
 * @param {'research'|'teaching'|'mixed'} context - Detected context from detectContext()
 * @returns {Array<{ command: string, description: string }>} Suggested commands
 *
 * @example
 * getSuggestions('teaching');
 * // => [
 * //   { command: 'teaching:exam', description: 'Generate an exam' },
 * //   { command: 'teaching:quiz', description: 'Create a quiz' },
 * //   ...
 * // ]
 */
export function getSuggestions(context) {
  return SUGGESTIONS[context] || SUGGESTIONS.mixed;
}

/**
 * Generate a formatted auto-tip string for first-use suggestion.
 *
 * Returns a human-readable tip based on the detected context,
 * suggesting relevant commands the user might want to try.
 *
 * @param {'research'|'teaching'|'mixed'} context - Detected context from detectContext()
 * @returns {string} Formatted tip string
 *
 * @example
 * getAutoTip('research');
 * // => "Tip: You're in a research project. Try /research:analysis-plan or /scholar:hub for all commands"
 */
export function getAutoTip(context) {
  switch (context) {
    case 'teaching':
      return "Tip: You're in a teaching project. Try /teaching:exam or /scholar:hub for all commands. Use -i to customize AI generation.";

    case 'research':
      return "Tip: You're in a research project. Try /research:analysis-plan or /scholar:hub for all commands";

    case 'mixed':
    default:
      return 'Tip: Try /scholar:hub to see all available research and teaching commands';
  }
}
