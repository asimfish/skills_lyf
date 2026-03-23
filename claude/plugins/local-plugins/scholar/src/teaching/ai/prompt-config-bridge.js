/**
 * Prompt Config Bridge for Teaching Content Generation
 *
 * Orchestrates loading config, teaching style, and prompts together.
 * Provides a one-stop-shop for fully configured prompts with:
 * - Config discovery (.flow/teach-config.yml)
 * - Teaching style merging (4-layer system)
 * - Prompt template loading
 * - Variable merging (args > lesson plan > style > config > defaults)
 * - Version compatibility checking
 * - Legacy fallback support
 *
 * @module prompt-config-bridge
 */

import { PromptLoader, PromptLoadError } from './prompt-loader.js';
import { PromptBuilder, PromptBuildError } from './prompt-builder.js';
import { loadTeachingStyle, findCourseRoot } from '../config/style-loader.js';
import { loadTeachConfig } from '../config/loader.js';

/**
 * Current Scholar version for compatibility checking
 * Should match package.json version
 */
const SCHOLAR_VERSION = '2.17.0';

/**
 * Error thrown when prompt configuration fails
 */
export class PromptConfigError extends Error {
  /**
   * Create a PromptConfigError
   * @param {string} message - Error message
   * @param {Object} details - Error details
   * @param {string} [details.type] - Prompt type
   * @param {string} [details.phase] - Phase where error occurred
   */
  constructor(message, { type, phase } = {}) {
    super(message);
    this.name = 'PromptConfigError';
    this.type = type;
    this.phase = phase;
  }
}

/**
 * PromptConfigBridge class - orchestrates config, style, and prompt loading
 */
export class PromptConfigBridge {
  /**
   * One-stop-shop for fully configured prompt
   *
   * Loads config, teaching style, and prompt template, then renders
   * the prompt with all merged variables.
   *
   * @param {string} type - Prompt type (lecture-notes, exam, quiz, etc.)
   * @param {Object} options - Configuration options
   * @param {string} [options.startDir] - Directory to start config search (defaults to cwd)
   * @param {string} [options.configPath] - Explicit config path (bypasses discovery)
   * @param {Object} [options.args] - Command args (topic, level, language, etc.)
   * @param {Object} [options.lessonPlan] - Lesson plan object (optional)
   * @param {string} [options.command] - Command name for style loading (defaults to type base)
   * @param {boolean} [options.debug] - Enable debug logging
   * @returns {Promise<{rendered: string, prompt: object, style: object, variables: object, warnings: string[]}>}
   * @throws {PromptConfigError} If configuration fails critically
   *
   * @example
   * const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
   *   startDir: '/path/to/course',
   *   args: { topic: 'Linear Regression', level: 'undergraduate' },
   *   debug: true
   * });
   * console.log(result.rendered); // The fully rendered prompt
   */
  static async loadConfiguredPrompt(type, options = {}) {
    const {
      startDir = process.cwd(),
      courseRoot: providedCourseRoot = null,
      configPath = null,
      args = {},
      lessonPlan = null,
      command = null,
      debug = false,
      // Allow passing common variables directly in options
      topic,
      course_level,
      field,
      week,
      part
    } = options;

    const warnings = [];
    const log = (msg) => {
      if (debug || process.env.SCHOLAR_DEBUG) {
        console.log(`[scholar:prompt] ${msg}`);
      }
    };

    log(`Loading configured prompt for type: ${type}`);
    log(`Start directory: ${startDir}`);

    // Phase 1: Find course root
    const courseRoot = providedCourseRoot || findCourseRoot(startDir) || startDir;
    log(`Course root: ${courseRoot}`);

    // Merge direct options into args
    const mergedArgs = {
      ...args,
      ...(topic !== undefined && { topic }),
      ...(course_level !== undefined && { course_level }),
      ...(field !== undefined && { field }),
      ...(week !== undefined && { week }),
      ...(part !== undefined && { part })
    };

    // Phase 2: Load teaching config (from courseRoot, not startDir)
    let config;
    try {
      config = loadTeachConfig(courseRoot, {
        configPath,
        debug,
        strict: false
      });
      log(`Config loaded successfully`);
    } catch (err) {
      log(`Config load error: ${err.message}`);
      warnings.push(`Config load failed: ${err.message}. Using defaults.`);
      config = {};
    }

    // Phase 3: Load teaching style (4-layer merged)
    const commandName = command || type.split('-')[0]; // e.g., 'lecture-notes' -> 'lecture'
    let styleResult;
    try {
      styleResult = loadTeachingStyle({
        command: commandName,
        startDir: courseRoot, // Use courseRoot, not startDir
        lessonPlan
      });
      log(`Style loaded from: ${Object.values(styleResult.sources).filter(Boolean).join(', ') || 'defaults'}`);
    } catch (err) {
      log(`Style load error: ${err.message}`);
      warnings.push(`Style load failed: ${err.message}. Using defaults.`);
      styleResult = {
        style: {},
        promptStyle: {},
        sources: {},
        courseRoot
      };
    }

    // Merge teaching_style from teach-config.yml into styleResult.style
    // This handles the case where teaching_style is in teach-config.yml
    // instead of (or in addition to) a separate teaching-style.local.md file
    const configTeachingStyle = config.scholar?.teaching_style || config.teaching_style;
    if (configTeachingStyle && typeof configTeachingStyle === 'object') {
      log('Merging config.teaching_style into style');
      styleResult.style = {
        ...styleResult.style,
        ...configTeachingStyle
      };
    }

    // Phase 4: Load prompt template
    let prompt;
    try {
      prompt = await PromptLoader.load(type, courseRoot, { debug });
      log(`Prompt loaded from: ${prompt.source}`);
    } catch (err) {
      if (err instanceof PromptLoadError) {
        log(`Prompt load failed: ${err.message}`);
        log(`Falling back to legacy prompt`);
        warnings.push(`Prompt template not found for "${type}". Using legacy built-in prompt.`);

        // Try legacy fallback
        try {
          return await this.useLegacyPrompt(type, args, lessonPlan, styleResult.promptStyle);
        } catch (legacyErr) {
          throw new PromptConfigError(
            `No prompt available for type "${type}": ${legacyErr.message}`,
            { type, phase: 'prompt-load' }
          );
        }
      }
      throw err;
    }

    // Phase 5: Version compatibility check
    // Use min_scholar_version (Scholar runtime requirement), not prompt_version
    // (which is the prompt document's own revision number, unrelated to Scholar versioning)
    const scholarRequirement = prompt.metadata?.min_scholar_version;
    if (scholarRequirement) {
      const versionCheck = PromptLoader.checkVersion(
        scholarRequirement,
        SCHOLAR_VERSION
      );

      if (versionCheck.severity === 'warning') {
        warnings.push(versionCheck.message);
        if (versionCheck.suggestion) {
          warnings.push(versionCheck.suggestion);
        }
        log(`Version warning: ${versionCheck.message}`);
      }

      if (versionCheck.severity === 'error') {
        throw new PromptConfigError(
          versionCheck.message,
          { type, phase: 'version-check' }
        );
      }
    }

    // Phase 6: Build merged variables
    const variables = this.buildMergedVariables(mergedArgs, lessonPlan, styleResult.style, config);
    log(`Variables merged: ${Object.keys(variables).length} keys`);

    // Phase 7: Render prompt
    let rendered;
    try {
      rendered = PromptBuilder.build(prompt.body, variables);
      log(`Prompt rendered successfully`);
    } catch (err) {
      if (err instanceof PromptBuildError) {
        throw new PromptConfigError(
          `Failed to render prompt: ${err.message}`,
          { type, phase: 'render' }
        );
      }
      throw err;
    }

    return {
      rendered,
      prompt: {
        body: prompt.body,
        metadata: prompt.metadata,
        source: prompt.source
      },
      style: styleResult.style,
      variables,
      warnings,
      courseRoot
    };
  }

  /**
   * Build merged variables from all sources
   *
   * Merge priority (highest to lowest):
   * 1. Command args
   * 2. Lesson plan values
   * 3. Teaching style (4-layer merged)
   * 4. Config values
   * 5. Defaults
   *
   * @param {Object} args - Command arguments
   * @param {Object|null} lessonPlan - Lesson plan object
   * @param {Object} style - Merged teaching style
   * @param {Object} config - Teaching config
   * @returns {Object} Merged variables object
   */
  static buildMergedVariables(args = {}, lessonPlan = null, style = {}, config = {}) {
    // Start with defaults
    const merged = {
      tone: 'formal',
      pedagogical_approach: 'active-learning',
      course_level: 'undergraduate',
      field: 'statistics',
      language: 'r'
    };

    // Layer: Config values (lowest priority external source)
    Object.assign(merged, this.filterUndefined(this.flattenConfig(config)));

    // Layer: Teaching style (already 4-layer merged)
    Object.assign(merged, this.filterUndefined(this.flattenStyle(style)));

    // Layer: Lesson plan values
    if (lessonPlan) {
      merged.has_lesson_plan = true;

      if (lessonPlan.learning_objectives?.length > 0) {
        merged.learning_objectives = lessonPlan.learning_objectives;
      }

      if (lessonPlan.week !== undefined) {
        merged.week = lessonPlan.week;
      }

      if (lessonPlan.topic) {
        merged.topic = lessonPlan.topic;
      }

      if (lessonPlan.title) {
        merged.lesson_title = lessonPlan.title;
      }

      if (lessonPlan.duration) {
        merged.duration = lessonPlan.duration;
      }

      if (lessonPlan.prior_knowledge?.length > 0) {
        merged.prior_knowledge = lessonPlan.prior_knowledge;
      }
    } else {
      merged.has_lesson_plan = false;
    }

    // Layer: Lesson plan prompt_hints (per-week customization, highest Layer 4 priority)
    if (lessonPlan?.prompt_hints && typeof lessonPlan.prompt_hints === 'object') {
      Object.assign(merged, this.filterUndefined(lessonPlan.prompt_hints));
    }

    // Layer: Command args (highest priority)
    if (args.topic) merged.topic = args.topic;
    if (args.level) merged.course_level = args.level;
    if (args.course_level) merged.course_level = args.course_level;
    if (args.language) merged.language = args.language;
    if (args.field) merged.field = args.field;
    if (args.courseCode) merged.course_code = args.courseCode;
    if (args.courseName) merged.course_name = args.courseName;
    if (args.format) merged.output_format = args.format;
    if (args.pages) merged.target_pages = args.pages;
    if (args.tone) merged.tone = args.tone;
    if (args.week !== undefined) merged.week = args.week;
    if (args.part !== undefined) merged.part = args.part;

    return merged;
  }

  /**
   * Flatten config object to variable-friendly format
   *
   * @param {Object} config - Teaching config object
   * @returns {Object} Flattened variables
   */
  static flattenConfig(config) {
    return {
      course_level: config?.scholar?.course_info?.level,
      field: config?.scholar?.course_info?.field,
      difficulty: config?.scholar?.course_info?.difficulty,
      course_code: config?.course?.code,
      course_name: config?.course?.name || config?.course?.title,
      language: config?.scholar?.defaults?.language,
      output_format: config?.scholar?.defaults?.lecture_format,
      notation: config?.scholar?.style?.notation,
      include_examples: config?.scholar?.style?.examples
    };
  }

  /**
   * Flatten teaching style object to variable-friendly format
   *
   * @param {Object} style - Teaching style object
   * @returns {Object} Flattened variables
   */
  static flattenStyle(style) {
    return {
      tone: style?.explanation_style?.formality,
      pedagogical_approach: style?.pedagogical_approach?.primary,
      secondary_approach: style?.pedagogical_approach?.secondary,
      proof_style: style?.explanation_style?.proof_style,
      example_depth: style?.explanation_style?.example_depth,
      analogies: style?.explanation_style?.analogies,
      notation_preference: style?.explanation_style?.notation_preference,

      // Notation conventions (for statistics courses)
      notation_fixed_effects: style?.notation_conventions?.fixed_effects,
      notation_random_effects: style?.notation_conventions?.random_effects,
      notation_nesting: style?.notation_conventions?.nesting,

      // Content preferences
      real_world_examples: style?.content_preferences?.real_world_examples,
      historical_context: style?.content_preferences?.historical_context,
      computational_tools: style?.content_preferences?.computational_tools,
      interdisciplinary_connections: style?.content_preferences?.interdisciplinary_connections,

      // Student interaction
      questioning_style: style?.student_interaction?.questioning,
      group_work_style: style?.student_interaction?.group_work,
      discussion_format: style?.student_interaction?.discussion_format,

      // Assessment philosophy
      assessment_focus: style?.assessment_philosophy?.primary_focus,
      feedback_style: style?.assessment_philosophy?.feedback_style,
      partial_credit: style?.assessment_philosophy?.partial_credit
    };
  }

  /**
   * Filter out undefined values from an object
   *
   * @param {Object} obj - Object to filter
   * @returns {Object} Object with only defined values
   * @private
   */
  static filterUndefined(obj) {
    const filtered = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * Use legacy hardcoded prompt (backward compatibility)
   *
   * Falls back to the existing lecture-prompts.js functions when
   * no external prompt template is available.
   *
   * @param {string} type - Prompt type
   * @param {Object} args - Command arguments
   * @param {Object|null} lessonPlan - Lesson plan object
   * @param {Object} teachingStyle - Teaching style (prompt-friendly format)
   * @returns {Promise<{rendered: string, prompt: object, warnings: string[]}>}
   * @throws {Error} If no legacy prompt exists for type
   */
  static async useLegacyPrompt(type, args, lessonPlan, teachingStyle) {
    // Dynamic import to avoid circular dependencies
    const { buildOutlinePrompt, buildSectionPrompt } = await import('./lecture-prompts.js');

    switch (type) {
      case 'lecture-outline':
        return {
          rendered: buildOutlinePrompt(args, teachingStyle, lessonPlan),
          prompt: {
            body: null,
            metadata: { prompt_version: '1.0', prompt_type: type },
            source: 'built-in'
          },
          style: teachingStyle,
          variables: args,
          warnings: ['Using legacy built-in prompt (no template file found)'],
          courseRoot: null
        };

      case 'section-content':
        return {
          rendered: buildSectionPrompt(
            args.section,
            args,
            teachingStyle,
            args.previousContext,
            args.learningObjectives
          ),
          prompt: {
            body: null,
            metadata: { prompt_version: '1.0', prompt_type: type },
            source: 'built-in'
          },
          style: teachingStyle,
          variables: args,
          warnings: ['Using legacy built-in prompt (no template file found)'],
          courseRoot: null
        };

      default:
        throw new Error(`No legacy prompt available for type: ${type}`);
    }
  }

  /**
   * Get Scholar version used for compatibility checking
   *
   * @returns {string} Scholar version string
   */
  static getScholarVersion() {
    return SCHOLAR_VERSION;
  }

  /**
   * Check if a prompt type supports the new template system
   *
   * @param {string} type - Prompt type to check
   * @returns {boolean} True if type is supported
   */
  static isTemplateSupported(type) {
    return PromptLoader.isValidType(type);
  }

  /**
   * List all supported prompt types
   *
   * @returns {string[]} Array of supported prompt types
   */
  static listSupportedTypes() {
    return PromptLoader.listTypes();
  }
}

export default PromptConfigBridge;
