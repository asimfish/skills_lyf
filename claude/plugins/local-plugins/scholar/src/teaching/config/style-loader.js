/**
 * 4-Layer Teaching Style Loader
 *
 * Implements the hierarchical teaching style system:
 * - Layer 1: Global (~/.claude/CLAUDE.md)
 * - Layer 2: Course (.claude/teaching-style.local.md)
 * - Layer 3: Command (command_overrides in course file)
 * - Layer 4: Lesson (content/lesson-plans/weekNN.yml)
 *
 * Precedence: Command > Lesson > Course > Global
 *
 * File format: Markdown with YAML frontmatter
 * Key: `teaching_style` in YAML frontmatter
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { homedir } from 'os';
import yaml from 'js-yaml';

/**
 * Default teaching style when no configuration is found
 * @returns {Object} Default teaching style configuration
 */
export function getDefaultTeachingStyle() {
  return {
    pedagogical_approach: {
      primary: 'active-learning',
      secondary: null,
      class_structure: []
    },
    explanation_style: {
      formality: 'balanced',
      proof_style: 'intuition-first',
      notation_preference: 'standard',
      example_depth: 'multiple-varied',
      analogies: 'moderate'
    },
    assessment_philosophy: {
      primary_focus: 'balanced',
      feedback_style: 'descriptive',
      revision_policy: 'encouraged',
      partial_credit: true
    },
    student_interaction: {
      questioning: 'socratic',
      group_work: 'structured',
      discussion_format: 'whole-class'
    },
    content_preferences: {
      real_world_examples: 'frequent',
      historical_context: 'moderate',
      computational_tools: 'integrated',
      interdisciplinary_connections: null
    }
  };
}

/**
 * Parse YAML frontmatter from markdown file
 * @param {string} content - File content
 * @returns {Object|null} Parsed YAML frontmatter or null
 */
export function parseYamlFrontmatter(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Match YAML frontmatter delimited by ---
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match || !match[1]) {
    return null;
  }

  try {
    return yaml.load(match[1]);
  } catch (_error) {
    // Invalid YAML, return null
    return null;
  }
}

/**
 * Read and parse teaching style from a markdown file with YAML frontmatter
 * @param {string} filePath - Path to markdown file
 * @returns {Object|null} Teaching style object or null if not found
 */
export function readTeachingStyleFile(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const frontmatter = parseYamlFrontmatter(content);

    if (!frontmatter || !frontmatter.teaching_style) {
      return null;
    }

    return frontmatter.teaching_style;
  } catch (_error) {
    // File read error, return null
    return null;
  }
}

/**
 * Load Layer 1: Global teaching style from ~/.claude/CLAUDE.md
 * @returns {Object|null} Global teaching style or null
 */
export function loadGlobalStyle() {
  const globalPath = join(homedir(), '.claude', 'CLAUDE.md');
  return readTeachingStyleFile(globalPath);
}

/**
 * Find course root by looking for .claude or .flow directories
 * @param {string} startDir - Directory to start search
 * @returns {string|null} Course root path or null
 */
export function findCourseRoot(startDir = process.cwd()) {
  let currentDir = resolve(startDir);
  const rootDir = '/';

  while (currentDir !== rootDir) {
    // Check for .claude directory (teaching style location)
    const claudeDir = join(currentDir, '.claude');
    const flowDir = join(currentDir, '.flow');

    if (existsSync(claudeDir) || existsSync(flowDir)) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Load Layer 2: Course-specific teaching style from .claude/teaching-style.local.md
 * @param {string} courseRoot - Course root directory
 * @returns {Object|null} Course teaching style or null
 */
export function loadCourseStyle(courseRoot) {
  if (!courseRoot) return null;

  const coursePath = join(courseRoot, '.claude', 'teaching-style.local.md');
  return readTeachingStyleFile(coursePath);
}

/**
 * Extract Layer 3: Command-level overrides
 * @param {Object} courseStyle - Course style object (may contain command_overrides)
 * @param {string} command - Command name (exam, quiz, lecture, assignment, etc.)
 * @returns {Object|null} Command-specific overrides or null
 */
export function extractCommandOverrides(courseStyle, command) {
  if (!courseStyle || !courseStyle.command_overrides) {
    return null;
  }

  return courseStyle.command_overrides[command] || null;
}

/**
 * Deep merge two objects, with source overriding target
 * @param {Object} target - Base object
 * @param {Object} source - Override object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  if (!source || typeof source !== 'object') {
    return target;
  }

  if (!target || typeof target !== 'object') {
    return source;
  }

  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(targetValue || {}, sourceValue);
      } else if (sourceValue !== undefined) {
        // Override with source value
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Merge all layers of teaching style configuration
 *
 * Precedence (highest to lowest):
 * 1. Command overrides (if provided)
 * 2. Lesson plan style (if provided)
 * 3. Course style
 * 4. Global style
 * 5. Default style
 *
 * @param {Object} options - Merge options
 * @param {Object} options.globalStyle - Layer 1 global style
 * @param {Object} options.courseStyle - Layer 2 course style
 * @param {Object} options.commandOverrides - Layer 3 command overrides
 * @param {Object} options.lessonStyle - Layer 4 lesson plan style overrides
 * @returns {Object} Merged teaching style
 */
export function mergeTeachingStyles({
  globalStyle = null,
  courseStyle = null,
  commandOverrides = null,
  lessonStyle = null
} = {}) {
  // Start with defaults
  let merged = getDefaultTeachingStyle();

  // Layer 1: Apply global style
  if (globalStyle) {
    merged = deepMerge(merged, globalStyle);
  }

  // Layer 2: Apply course style (excluding command_overrides)
  if (courseStyle) {
    const courseStyleWithoutOverrides = Object.fromEntries(
      Object.entries(courseStyle).filter(([key]) => key !== 'command_overrides')
    );
    merged = deepMerge(merged, courseStyleWithoutOverrides);
  }

  // Layer 4: Apply lesson plan style (before command overrides)
  if (lessonStyle) {
    merged = deepMerge(merged, lessonStyle);
  }

  // Layer 3: Apply command overrides (highest precedence)
  if (commandOverrides) {
    merged = deepMerge(merged, commandOverrides);
  }

  return merged;
}

/**
 * Convert merged teaching style to prompt-friendly format
 * Used by lecture-prompts.js buildStyleGuidance()
 *
 * @param {Object} style - Merged teaching style
 * @returns {Object} Simplified style for prompts
 */
export function toPromptStyle(style) {
  return {
    // Main attributes used by buildStyleGuidance
    tone: style?.explanation_style?.formality || 'balanced',
    pedagogical_approach: style?.pedagogical_approach?.primary || 'active-learning',
    explanation_style: style?.explanation_style?.proof_style || 'rigorous-with-intuition',

    // Additional attributes for enhanced prompts
    example_depth: style?.explanation_style?.example_depth || 'multiple-varied',
    analogies: style?.explanation_style?.analogies || 'moderate',
    real_world_examples: style?.content_preferences?.real_world_examples || 'frequent',
    computational_tools: style?.content_preferences?.computational_tools || 'integrated',
    questioning: style?.student_interaction?.questioning || 'socratic',
    group_work: style?.student_interaction?.group_work || 'structured',
    proof_style: style?.explanation_style?.proof_style || 'intuition-first',

    // Full style object for advanced use
    _full: style
  };
}

/**
 * Main loader function: Load complete teaching style for a command
 *
 * @param {Object} options - Loader options
 * @param {string} options.command - Command name (lecture, exam, quiz, etc.)
 * @param {string} options.startDir - Directory to start search (defaults to cwd)
 * @param {Object} options.lessonPlan - Lesson plan object (if using --from-plan)
 * @returns {Object} Result with style, sources, and prompt-friendly version
 */
export function loadTeachingStyle({
  command = 'lecture',
  startDir = process.cwd(),
  lessonPlan = null
} = {}) {
  const sources = {
    global: null,
    course: null,
    command: null,
    lesson: null
  };

  // Layer 1: Load global style
  const globalStyle = loadGlobalStyle();
  if (globalStyle) {
    sources.global = join(homedir(), '.claude', 'CLAUDE.md');
  }

  // Find course root
  const courseRoot = findCourseRoot(startDir);

  // Layer 2: Load course style
  let courseStyle = null;
  if (courseRoot) {
    courseStyle = loadCourseStyle(courseRoot);
    if (courseStyle) {
      sources.course = join(courseRoot, '.claude', 'teaching-style.local.md');
    }
  }

  // Layer 3: Extract command overrides
  const commandOverrides = extractCommandOverrides(courseStyle, command);
  if (commandOverrides) {
    sources.command = `${sources.course}#command_overrides.${command}`;
  }

  // Layer 4: Extract lesson plan style overrides (if present)
  let lessonStyle = null;
  if (lessonPlan?.teaching_style_overrides) {
    lessonStyle = lessonPlan.teaching_style_overrides;
    sources.lesson = 'lesson-plan';
  }

  // Merge all layers
  const mergedStyle = mergeTeachingStyles({
    globalStyle,
    courseStyle,
    commandOverrides,
    lessonStyle
  });

  return {
    style: mergedStyle,
    promptStyle: toPromptStyle(mergedStyle),
    sources,
    courseRoot
  };
}

/**
 * Validate teaching style structure
 * @param {Object} style - Teaching style to validate
 * @returns {Object} Validation result { isValid, errors, warnings }
 */
export function validateTeachingStyle(style) {
  const errors = [];
  const warnings = [];

  if (!style || typeof style !== 'object') {
    errors.push('Teaching style must be an object');
    return { isValid: false, errors, warnings };
  }

  // Validate pedagogical_approach
  if (style.pedagogical_approach) {
    const validApproaches = ['active-learning', 'lecture-based', 'problem-based', 'flipped', 'socratic', 'inquiry-based'];
    const { primary, secondary } = style.pedagogical_approach;

    if (primary && !validApproaches.includes(primary)) {
      warnings.push(`Unknown pedagogical_approach.primary: "${primary}". Valid: ${validApproaches.join(', ')}`);
    }
    if (secondary && !validApproaches.includes(secondary)) {
      warnings.push(`Unknown pedagogical_approach.secondary: "${secondary}"`);
    }
  }

  // Validate explanation_style
  if (style.explanation_style) {
    const { formality, proof_style } = style.explanation_style;

    const validFormality = ['formal', 'conversational', 'balanced', 'engaging'];
    if (formality && !validFormality.includes(formality)) {
      warnings.push(`Unknown explanation_style.formality: "${formality}". Valid: ${validFormality.join(', ')}`);
    }

    const validProofStyle = ['proof-first', 'intuition-first', 'both-parallel', 'rigorous', 'intuitive', 'rigorous-with-intuition'];
    if (proof_style && !validProofStyle.includes(proof_style)) {
      warnings.push(`Unknown explanation_style.proof_style: "${proof_style}"`);
    }
  }

  // Validate command_overrides keys
  if (style.command_overrides) {
    const validCommands = ['exam', 'quiz', 'lecture', 'assignment', 'slides', 'syllabus', 'rubric', 'feedback'];
    for (const cmd of Object.keys(style.command_overrides)) {
      if (!validCommands.includes(cmd)) {
        warnings.push(`Unknown command_overrides key: "${cmd}". Valid: ${validCommands.join(', ')}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get a summary of loaded styles for debugging/logging
 * @param {Object} loadResult - Result from loadTeachingStyle
 * @returns {string} Human-readable summary
 */
export function getStyleSummary(loadResult) {
  const { promptStyle, sources } = loadResult;
  const lines = ['Teaching Style Configuration:'];

  // Show sources
  lines.push('  Sources:');
  if (sources.global) lines.push(`    - Global: ${sources.global}`);
  if (sources.course) lines.push(`    - Course: ${sources.course}`);
  if (sources.command) lines.push(`    - Command: ${sources.command}`);
  if (sources.lesson) lines.push(`    - Lesson: ${sources.lesson}`);
  if (!sources.global && !sources.course) lines.push('    - Using defaults only');

  // Show key style attributes
  lines.push('  Applied Style:');
  lines.push(`    - Tone: ${promptStyle.tone}`);
  lines.push(`    - Approach: ${promptStyle.pedagogical_approach}`);
  lines.push(`    - Explanation: ${promptStyle.explanation_style}`);
  lines.push(`    - Examples: ${promptStyle.example_depth}`);

  return lines.join('\n');
}
