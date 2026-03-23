/**
 * Instruction Merger for Teaching Content Generation
 *
 * Handles user-provided custom instructions by:
 * - AI-powered categorization (content, style, format, constraints)
 * - Merging categorized instructions into the active generation prompt
 * - Conflict detection between instructions and existing config
 * - Human-readable summary generation for approval workflows
 * - @file reference loading for instruction files
 *
 * Works with both default prompts and user-overridden prompts from
 * .flow/templates/prompts/.
 *
 * @module instruction-merger
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PromptLoader } from './prompt-loader.js';
import { PromptBuilder } from './prompt-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Valid instruction categories
 * @type {string[]}
 */
const CATEGORIES = ['content', 'style', 'format', 'constraints'];

/**
 * Conflict severity levels
 * @enum {string}
 */
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
};

/**
 * Section markers used to locate injection points in prompts.
 * Keys are canonical section names; values are arrays of heading patterns
 * to match (case-insensitive) in the active prompt.
 * @type {Object<string, string[]>}
 */
const SECTION_MARKERS = {
  topic: ['## Topic', '## Subject', '## Content'],
  style: ['## Teaching Style', '## Style', '## Tone'],
  format: ['## Output Format', '## Format', '## Structure'],
  course: ['## Course Context', '## Course', '## Course Level'],
  requirements: ['## Requirements', '## Rules'],
};

/**
 * Categorized instruction result from AI analysis
 * @typedef {Object} CategorizedInstructions
 * @property {string[]} content - Content-related instructions
 * @property {string[]} style - Style-related instructions
 * @property {string[]} format - Format-related instructions
 * @property {string[]} constraints - Constraint instructions
 */

/**
 * Merge conflict descriptor
 * @typedef {Object} MergeConflict
 * @property {string} type - Conflict type identifier
 * @property {string} severity - 'info' or 'warning'
 * @property {string} message - Human-readable conflict description
 * @property {string} category - Which category triggered the conflict
 */

/**
 * Merge result from combining instructions with prompt
 * @typedef {Object} MergeResult
 * @property {string} mergedPrompt - The final prompt with instructions injected
 * @property {CategorizedInstructions} categories - The categorized instructions used
 * @property {MergeConflict[]} conflicts - Any detected conflicts
 * @property {boolean} isCustomPrompt - Whether a user-overridden prompt was the base
 * @property {string} commandType - The command type this merge was for
 */

/**
 * InstructionMerger class for categorizing and merging user instructions
 */
export class InstructionMerger {
  /**
   * Create a new InstructionMerger
   * @param {import('./provider.js').AIProvider} aiProvider - AI provider instance (Haiku recommended)
   * @param {Object} [options] - Merger options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(aiProvider, options = {}) {
    if (!aiProvider) {
      throw new Error('InstructionMerger requires an AIProvider instance');
    }

    this.ai = aiProvider;
    this.debug = options.debug || false;

    // Load and cache the categorizer prompt template
    this._categorizerTemplate = null;
  }

  /**
   * Analyze user instructions by sending them to AI for categorization
   *
   * Sends the raw instruction string to a lightweight model (Haiku) using
   * the categorizer prompt template. Returns instructions split into four
   * categories: content, style, format, constraints.
   *
   * @param {string} userInstructions - Raw user instruction string
   * @param {string} commandType - Command type (exam, quiz, slides, lecture, etc.)
   * @returns {Promise<CategorizedInstructions>} Categorized instructions
   * @throws {Error} If AI categorization fails after retries
   *
   * @example
   * const categories = await merger.analyze(
   *   'Focus on healthcare datasets, include R code, keep it informal',
   *   'exam'
   * );
   * // => {
   * //   content: ['Focus on healthcare datasets'],
   * //   style: ['Keep it informal'],
   * //   format: ['Include R code'],
   * //   constraints: []
   * // }
   */
  async analyze(userInstructions, commandType) {
    if (!userInstructions || typeof userInstructions !== 'string') {
      throw new Error('userInstructions must be a non-empty string');
    }

    if (!commandType || typeof commandType !== 'string') {
      throw new Error('commandType must be a non-empty string');
    }

    this.log(`Analyzing instructions for command type: ${commandType}`);
    this.log(`Raw instructions: "${userInstructions}"`);

    // Load categorizer template (cached after first load)
    const template = await this._loadCategorizerTemplate();

    // Render the template with variables
    const prompt = PromptBuilder.build(template, {
      commandType,
      userInstructions,
    });

    this.log('Rendered categorizer prompt, sending to AI...');

    // Send to AI for categorization
    const result = await this.ai.generate(prompt, {
      format: 'json',
      temperature: 0.1, // Low temperature for consistent categorization
    });

    if (!result.success) {
      throw new Error(`AI categorization failed: ${result.error}`);
    }

    // Validate and normalize the response
    const categories = this._validateCategories(result.content);

    this.log(`Categorization result: ${JSON.stringify(categories)}`);
    return categories;
  }

  /**
   * Merge categorized instructions into the active prompt
   *
   * Injects instructions into appropriate sections of the prompt based
   * on their category. Detects conflicts between instructions and existing
   * prompt content or config values.
   *
   * Merge strategy:
   * - System section: untouched (format rules, JSON schema)
   * - Course context: from config (untouched)
   * - Content section: APPEND categorized.content items
   * - Style section: OVERRIDE or APPEND categorized.style items
   * - Format section: APPEND categorized.format items
   * - Constraints section: new section if needed, APPEND items
   *
   * @param {string} activePrompt - The rendered prompt (default or user-overridden)
   * @param {CategorizedInstructions} categories - Categorized instructions from analyze()
   * @param {Object} [config={}] - Teaching config (from teach-config.yml)
   * @param {Object} [options={}] - Merge options
   * @param {boolean} [options.isCustomPrompt=false] - Whether activePrompt is a user override
   * @param {string} [options.commandType=''] - Command type for conflict context
   * @returns {MergeResult} The merge result with injected prompt and conflicts
   *
   * @example
   * const result = merger.merge(renderedPrompt, categories, config, {
   *   isCustomPrompt: false,
   *   commandType: 'exam'
   * });
   * console.log(result.mergedPrompt);  // Prompt with instructions injected
   * console.log(result.conflicts);     // Any detected conflicts
   */
  merge(activePrompt, categories, config = {}, options = {}) {
    const {
      isCustomPrompt = false,
      commandType = '',
    } = options;

    if (!activePrompt || typeof activePrompt !== 'string') {
      throw new Error('activePrompt must be a non-empty string');
    }

    this.log(`Merging instructions into ${isCustomPrompt ? 'custom' : 'default'} prompt`);

    const conflicts = [];
    let mergedPrompt = activePrompt;

    // Detect conflicts before merging
    this._detectConflicts(categories, config, conflicts, commandType);

    // Inject content instructions (after topic/content section)
    if (categories.content.length > 0) {
      mergedPrompt = this._injectSection(
        mergedPrompt,
        categories.content,
        'content',
        'Additional Content Requirements'
      );
    }

    // Inject style instructions (after style section or before format)
    if (categories.style.length > 0) {
      mergedPrompt = this._injectSection(
        mergedPrompt,
        categories.style,
        'style',
        'Custom Style Requirements'
      );
    }

    // Inject format instructions (after format/output section)
    if (categories.format.length > 0) {
      mergedPrompt = this._injectSection(
        mergedPrompt,
        categories.format,
        'format',
        'Additional Format Requirements'
      );
    }

    // Inject constraints (always as a new section at the end, before any final output format)
    if (categories.constraints.length > 0) {
      mergedPrompt = this._injectConstraints(mergedPrompt, categories.constraints);
    }

    const result = {
      mergedPrompt,
      categories,
      conflicts,
      isCustomPrompt,
      commandType,
    };

    this.log(`Merge complete. ${conflicts.length} conflict(s) detected.`);
    return result;
  }

  /**
   * Generate a human-readable summary of the merge result
   *
   * Produces markdown-formatted output showing:
   * - Base configuration (default vs custom prompt)
   * - Custom instructions applied (table by category)
   * - Conflicts with severity indicators
   *
   * @param {MergeResult} mergeResult - Result from merge()
   * @param {Object} [options={}] - Summary options
   * @param {boolean} [options.verbose=false] - Include full merged prompt in summary
   * @returns {string} Markdown-formatted summary
   *
   * @example
   * const summary = merger.summarize(mergeResult, { verbose: false });
   * console.log(summary);
   * // ## Generation Plan
   * //
   * // **Base:** Default exam prompt
   * // **Custom instructions:** 4 applied
   * //
   * // | Category | Instructions |
   * // |----------|-------------|
   * // | Content  | Focus on healthcare datasets |
   * // | Style    | Keep it informal |
   * // ...
   */
  summarize(mergeResult, options = {}) {
    const { verbose = false } = options;

    if (!mergeResult || typeof mergeResult !== 'object') {
      throw new Error('mergeResult must be a valid merge result object');
    }

    const { categories, conflicts, isCustomPrompt, commandType } = mergeResult;
    const lines = [];

    // Header
    lines.push('## Generation Plan');
    lines.push('');

    // Base configuration
    const baseLabel = isCustomPrompt
      ? `Custom ${commandType} prompt (project override)`
      : `Default ${commandType} prompt`;
    lines.push(`**Base:** ${baseLabel}`);

    // Count total instructions
    const totalInstructions = CATEGORIES.reduce(
      (sum, cat) => sum + categories[cat].length, 0
    );
    lines.push(`**Custom instructions:** ${totalInstructions} applied`);
    lines.push('');

    // Instructions table
    if (totalInstructions > 0) {
      lines.push('| Category | Instructions |');
      lines.push('|----------|-------------|');

      for (const category of CATEGORIES) {
        if (categories[category].length > 0) {
          const label = category.charAt(0).toUpperCase() + category.slice(1);
          for (const instruction of categories[category]) {
            lines.push(`| ${label} | ${instruction} |`);
          }
        }
      }
      lines.push('');
    }

    // Conflicts
    if (conflicts.length > 0) {
      lines.push('### Notices');
      lines.push('');

      for (const conflict of conflicts) {
        const icon = conflict.severity === SEVERITY.WARNING ? '[!]' : '[i]';
        lines.push(`- ${icon} ${conflict.message}`);
      }
      lines.push('');
    }

    // Verbose: include full prompt
    if (verbose) {
      lines.push('### Full Merged Prompt');
      lines.push('');
      lines.push('```');
      lines.push(mergeResult.mergedPrompt);
      lines.push('```');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Load instructions from a file reference
   *
   * If the instructions string starts with '@', treats the remainder as a
   * file path and reads the file contents. Supports both absolute paths and
   * paths relative to the current working directory.
   *
   * @param {string} filePath - Path to the instruction file (with or without @ prefix)
   * @returns {Promise<string>} File contents as instruction string
   * @throws {Error} If file does not exist or cannot be read
   *
   * @example
   * // Load from absolute path
   * const instructions = await InstructionMerger.loadFromFile('@/path/to/instructions.md');
   *
   * // Load from relative path
   * const instructions = await InstructionMerger.loadFromFile('@my-instructions.txt');
   *
   * // Path without @ prefix also works
   * const instructions = await InstructionMerger.loadFromFile('/path/to/instructions.md');
   */
  static async loadFromFile(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('filePath must be a non-empty string');
    }

    // Strip @ prefix if present
    const cleanPath = filePath.startsWith('@') ? filePath.slice(1) : filePath;

    if (!cleanPath) {
      throw new Error('File path cannot be empty (received bare "@")');
    }

    // Resolve relative paths against cwd
    const resolvedPath = resolve(process.cwd(), cleanPath);
    const basePath = resolve(process.cwd());

    // Prevent relative path traversal outside the working directory.
    // Absolute paths are allowed (explicit user choice), but relative
    // paths containing ../ that escape cwd are blocked.
    const isRelativePath = !cleanPath.startsWith('/');
    if (isRelativePath && !resolvedPath.startsWith(basePath + '/') && resolvedPath !== basePath) {
      throw new Error(
        `Access denied: path traversal detected.\n` +
        `  Provided path: ${filePath}\n` +
        `  Resolved to: ${resolvedPath}\n` +
        `  Allowed base: ${basePath}\n` +
        `  Instruction files must be within the current working directory.`
      );
    }

    if (!existsSync(resolvedPath)) {
      throw new Error(
        `Instruction file not found: ${resolvedPath}\n` +
        `  Provided path: ${filePath}\n` +
        `  Resolved to: ${resolvedPath}\n` +
        `  Tip: Use an absolute path or a path relative to ${process.cwd()}`
      );
    }

    const content = await readFile(resolvedPath, 'utf8');

    if (!content.trim()) {
      throw new Error(
        `Instruction file is empty: ${resolvedPath}\n` +
        `  The file must contain at least one instruction.`
      );
    }

    return content.trim();
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /**
   * Load and cache the categorizer prompt template
   * @returns {Promise<string>} Template body
   * @private
   */
  async _loadCategorizerTemplate() {
    if (this._categorizerTemplate) {
      return this._categorizerTemplate;
    }

    const templatePath = join(__dirname, 'prompts', 'system', 'categorizer.md');

    if (!existsSync(templatePath)) {
      throw new Error(
        `Categorizer prompt template not found at: ${templatePath}\n` +
        `  This is a Scholar internal file and should not be removed.`
      );
    }

    const content = await readFile(templatePath, 'utf8');
    const parsed = PromptLoader.parsePrompt(content);

    this._categorizerTemplate = parsed.body;
    this.log(`Loaded categorizer template (v${parsed.metadata.prompt_version || 'unknown'})`);

    return this._categorizerTemplate;
  }

  /**
   * Validate and normalize AI categorization response
   * @param {Object} response - Raw AI response
   * @returns {CategorizedInstructions} Validated categories
   * @private
   */
  _validateCategories(response) {
    // Handle string responses (AI returned raw text instead of JSON)
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response);
      } catch {
        throw new Error(
          'AI returned invalid JSON for categorization. ' +
          'This may indicate a model issue. Try again or use a different model.'
        );
      }
    }

    if (!response || typeof response !== 'object') {
      throw new Error('AI categorization returned an invalid response (expected an object)');
    }

    const validated = {};

    for (const category of CATEGORIES) {
      if (!response[category]) {
        // Missing category defaults to empty array
        validated[category] = [];
      } else if (!Array.isArray(response[category])) {
        // Coerce single string to array
        validated[category] = [String(response[category])];
      } else {
        // Filter out non-string items and trim
        validated[category] = response[category]
          .filter(item => item != null)
          .map(item => String(item).trim())
          .filter(item => item.length > 0);
      }
    }

    return validated;
  }

  /**
   * Inject instructions into a specific section of the prompt
   * @param {string} prompt - Current prompt text
   * @param {string[]} instructions - Instructions to inject
   * @param {string} category - Category name (content, style, format)
   * @param {string} heading - Section heading for the injected block
   * @returns {string} Prompt with instructions injected
   * @private
   */
  _injectSection(prompt, instructions, category, heading) {
    const block = this._formatInstructionBlock(heading, instructions);

    // Try to find an existing section to inject after
    const markers = this._getInjectionMarkers(category);
    const insertionPoint = this._findSectionEnd(prompt, markers);

    if (insertionPoint !== -1) {
      // Insert after the found section
      return (
        prompt.slice(0, insertionPoint) +
        '\n\n' + block +
        prompt.slice(insertionPoint)
      );
    }

    // No matching section found -- append before the last section (Output Format)
    // or at the end if no Output Format section exists
    const outputMarkers = SECTION_MARKERS.format || [];
    const outputPoint = this._findSectionStart(prompt, outputMarkers);

    if (outputPoint !== -1) {
      return (
        prompt.slice(0, outputPoint) +
        block + '\n\n' +
        prompt.slice(outputPoint)
      );
    }

    // Fallback: append at the end
    return prompt + '\n\n' + block;
  }

  /**
   * Inject constraint instructions into the prompt
   *
   * Constraints are always added as a dedicated section. If a constraints/
   * requirements section already exists, items are appended to it.
   * Otherwise a new section is created before the Output Format section
   * (or at the end).
   *
   * @param {string} prompt - Current prompt text
   * @param {string[]} constraints - Constraint instructions
   * @returns {string} Prompt with constraints injected
   * @private
   */
  _injectConstraints(prompt, constraints) {
    const block = this._formatInstructionBlock('Constraints', constraints);

    // Try to insert before Output Format
    const outputMarkers = SECTION_MARKERS.format || [];
    const outputPoint = this._findSectionStart(prompt, outputMarkers);

    if (outputPoint !== -1) {
      return (
        prompt.slice(0, outputPoint) +
        block + '\n\n' +
        prompt.slice(outputPoint)
      );
    }

    // Fallback: append at the end
    return prompt + '\n\n' + block;
  }

  /**
   * Format an instruction block as markdown
   * @param {string} heading - Section heading
   * @param {string[]} instructions - List of instructions
   * @returns {string} Formatted markdown block
   * @private
   */
  _formatInstructionBlock(heading, instructions) {
    const lines = [`## ${heading}`, ''];
    for (const instruction of instructions) {
      lines.push(`- ${instruction}`);
    }
    return lines.join('\n');
  }

  /**
   * Get section markers for a given category
   * @param {string} category - Category name
   * @returns {string[]} Heading patterns to search for
   * @private
   */
  _getInjectionMarkers(category) {
    switch (category) {
      case 'content':
        return [...(SECTION_MARKERS.topic || []), ...(SECTION_MARKERS.course || [])];
      case 'style':
        return SECTION_MARKERS.style || [];
      case 'format':
        return SECTION_MARKERS.format || [];
      default:
        return [];
    }
  }

  /**
   * Find the end position of a section identified by heading markers
   *
   * Scans for the first matching heading, then finds where that section
   * ends (the start of the next ## heading or end of string).
   *
   * @param {string} prompt - Prompt text
   * @param {string[]} markers - Heading patterns to match
   * @returns {number} Character position of section end, or -1 if not found
   * @private
   */
  _findSectionEnd(prompt, markers) {
    for (const marker of markers) {
      const markerLower = marker.toLowerCase();
      const promptLower = prompt.toLowerCase();
      const idx = promptLower.indexOf(markerLower);

      if (idx !== -1) {
        // Find the next ## heading after this one
        const afterMarker = idx + marker.length;
        const nextHeading = prompt.indexOf('\n## ', afterMarker);

        if (nextHeading !== -1) {
          return nextHeading;
        }

        // No next heading -- section goes to end
        return prompt.length;
      }
    }

    return -1;
  }

  /**
   * Find the start position of a section identified by heading markers
   *
   * @param {string} prompt - Prompt text
   * @param {string[]} markers - Heading patterns to match
   * @returns {number} Character position of section start, or -1 if not found
   * @private
   */
  _findSectionStart(prompt, markers) {
    for (const marker of markers) {
      const markerLower = marker.toLowerCase();
      const promptLower = prompt.toLowerCase();
      const idx = promptLower.indexOf(markerLower);

      if (idx !== -1) {
        // Walk back to the start of the line (find preceding newline)
        const lineStart = prompt.lastIndexOf('\n', idx);
        return lineStart !== -1 ? lineStart + 1 : idx;
      }
    }

    return -1;
  }

  /**
   * Detect conflicts between instructions and config/prompt
   * @param {CategorizedInstructions} categories - Categorized instructions
   * @param {Object} config - Teaching config
   * @param {MergeConflict[]} conflicts - Array to push conflicts into
   * @param {string} commandType - Command type for context
   * @private
   */
  _detectConflicts(categories, config, conflicts, _commandType) {
    // Style override detection (info severity)
    if (categories.style.length > 0 && config.style) {
      const configTone = config.style?.tone;
      const hasStyleOverride = categories.style.some(
        instr => instr.toLowerCase().includes('tone') ||
                 instr.toLowerCase().includes('formal') ||
                 instr.toLowerCase().includes('informal') ||
                 instr.toLowerCase().includes('conversational')
      );

      if (hasStyleOverride && configTone) {
        conflicts.push({
          type: 'style_override',
          severity: SEVERITY.INFO,
          message: `Style instructions may override config tone "${configTone}"`,
          category: 'style',
        });
      }
    }

    // Format mismatch detection (warning severity)
    if (categories.format.length > 0) {
      const configFormat = config.defaults?.exam_format ||
                           config.defaults?.lecture_format;

      if (configFormat) {
        const hasFormatChange = categories.format.some(
          instr => instr.toLowerCase().includes('format') ||
                   instr.toLowerCase().includes('markdown') ||
                   instr.toLowerCase().includes('latex') ||
                   instr.toLowerCase().includes('quarto') ||
                   instr.toLowerCase().includes('json')
        );

        if (hasFormatChange) {
          conflicts.push({
            type: 'format_mismatch',
            severity: SEVERITY.WARNING,
            message: `Format instructions may conflict with config format "${configFormat}"`,
            category: 'format',
          });
        }
      }
    }

    // Contradiction detection (warning severity)
    // Check for opposing instructions within the same category
    for (const category of CATEGORIES) {
      const items = categories[category];
      if (items.length < 2) continue;

      const negatives = items.filter(
        i => i.toLowerCase().startsWith('don\'t') ||
             i.toLowerCase().startsWith('do not') ||
             i.toLowerCase().startsWith('no ') ||
             i.toLowerCase().startsWith('avoid') ||
             i.toLowerCase().startsWith('exclude')
      );

      const positives = items.filter(i => !negatives.includes(i));

      // Simple heuristic: check if any negative references a positive keyword
      for (const neg of negatives) {
        const negWords = neg.toLowerCase().split(/\s+/);
        for (const pos of positives) {
          const posWords = pos.toLowerCase().split(/\s+/);
          const overlap = posWords.filter(w => w.length > 4 && negWords.includes(w));

          if (overlap.length > 0) {
            conflicts.push({
              type: 'contradiction',
              severity: SEVERITY.WARNING,
              message: `Possible contradiction in ${category}: "${pos}" vs "${neg}"`,
              category,
            });
          }
        }
      }
    }

    // Scope expansion detection (info severity)
    if (categories.content.length > 0) {
      const expandingKeywords = ['also', 'additional', 'extra', 'beyond', 'plus', 'more'];
      const hasExpansion = categories.content.some(instr =>
        expandingKeywords.some(kw => instr.toLowerCase().includes(kw))
      );

      if (hasExpansion) {
        conflicts.push({
          type: 'scope_expansion',
          severity: SEVERITY.INFO,
          message: 'Content instructions expand the default scope -- generation may take longer',
          category: 'content',
        });
      }
    }
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @private
   */
  log(message) {
    if (this.debug) {
      console.log(`[InstructionMerger] ${message}`);
    }
  }
}

/**
 * Create an InstructionMerger with an AI provider
 *
 * Convenience factory function that mirrors the createProvider pattern
 * used elsewhere in the codebase.
 *
 * @param {import('./provider.js').AIProvider} aiProvider - AI provider (Haiku recommended)
 * @param {Object} [options] - Merger options
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {InstructionMerger} Configured merger instance
 *
 * @example
 * import { createProvider } from './provider.js';
 * import { createMerger } from './instruction-merger.js';
 *
 * const haiku = createProvider({ model: 'claude-haiku-4-5-20251001' });
 * const merger = createMerger(haiku, { debug: true });
 *
 * const categories = await merger.analyze('Focus on R code examples', 'exam');
 * const result = merger.merge(prompt, categories, config);
 * const summary = merger.summarize(result);
 */
export function createMerger(aiProvider, options = {}) {
  return new InstructionMerger(aiProvider, options);
}

export default InstructionMerger;
