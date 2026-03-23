/**
 * ConfigShow - Resolve and display the 4-layer config hierarchy
 *
 * Loads each configuration layer separately, annotates resolved values
 * with their source layer, and produces human-readable output showing
 * which layer each value came from.
 *
 * 4-Layer Hierarchy (lowest to highest precedence):
 * - Layer 1: Plugin Defaults (hardcoded in buildMergedVariables + getDefaultConfig)
 * - Layer 2: Course Style (.flow/teach-config.yml + teaching style files)
 * - Layer 3: Command Overrides (command_overrides.<command> in teaching style)
 * - Layer 4: Week Plan (lesson plan values for a specific week)
 *
 * @module teaching/config/config-show
 */

import { loadTeachConfig, getDefaultConfig } from './loader.js';
import {
  loadTeachingStyle,
  findCourseRoot,
  getDefaultTeachingStyle
} from './style-loader.js';
import { PromptLoader } from '../ai/prompt-loader.js';
import { PromptConfigBridge } from '../ai/prompt-config-bridge.js';
import { loadLessonPlan } from '../utils/lesson-plan-loader.js';

/**
 * @typedef {Object} LayerEntry
 * @property {string} key - The flattened config key
 * @property {*} value - The resolved value
 * @property {number} layer - Layer number (1-4) where this value originates
 * @property {string} layerName - Human-readable layer name
 * @property {number|null} overrides - Layer number this value overrides, or null
 */

/**
 * @typedef {Object} ShowResult
 * @property {Object} layers - Raw data from each layer { layer1, layer2, layer3, layer4 }
 * @property {Object} resolved - Final merged key-value pairs with source annotations
 * @property {Object|null} prompt - Prompt template info { source, path, version } or null
 * @property {string} formatted - Human-readable multi-line display string
 * @property {string[]} warnings - Warnings encountered during resolution
 */

/**
 * ConfigShow class - resolves and displays the 4-layer config hierarchy
 */
export class ConfigShow {
  /**
   * Create a ConfigShow instance
   * @param {Object} options - Configuration options
   * @param {string} [options.cwd] - Working directory (defaults to process.cwd())
   * @param {boolean} [options.debug] - Enable debug logging
   */
  constructor({ cwd, debug } = {}) {
    this.cwd = cwd || process.cwd();
    this.debug = debug || false;
  }

  /**
   * Debug log helper
   * @param {string} msg - Message to log
   * @private
   */
  _log(msg) {
    if (this.debug || process.env.SCHOLAR_DEBUG) {
      console.log(`[scholar:config-show] ${msg}`);
    }
  }

  /**
   * Resolve and display the 4-layer config hierarchy
   *
   * @param {Object} options - Show options
   * @param {string} [options.command] - Command name (e.g., "lecture", "exam") for Layer 3
   * @param {string|number} [options.week] - Week identifier for Layer 4 (e.g., "4", "week04")
   * @param {string} [options.promptType] - Prompt type to resolve (e.g., "lecture-notes")
   * @returns {Promise<ShowResult>} Resolved config with layer annotations
   */
  async show({ command, week, promptType } = {}) {
    const warnings = [];

    this._log(`show() called: command=${command}, week=${week}, promptType=${promptType}`);

    // Find course root
    const courseRoot = findCourseRoot(this.cwd);
    this._log(`Course root: ${courseRoot || '(not found)'}`);

    // --- Load each layer independently ---

    // Layer 1: Plugin Defaults
    const layer1 = this._loadLayer1();
    this._log(`Layer 1: ${Object.keys(layer1).length} keys`);

    // Layer 2: Course Style (config + teaching style)
    const layer2 = this._loadLayer2(courseRoot, warnings);
    this._log(`Layer 2: ${Object.keys(layer2).length} keys`);

    // Layer 3: Command Overrides
    const layer3 = this._loadLayer3(courseRoot, command, warnings);
    this._log(`Layer 3: ${Object.keys(layer3).length} keys`);

    // Layer 4: Week Plan
    const layer4 = this._loadLayer4(courseRoot, week, warnings);
    this._log(`Layer 4: ${Object.keys(layer4).length} keys`);

    // Build resolved map with source annotations
    const resolved = this._buildResolved(layer1, layer2, layer3, layer4);

    // Resolve prompt template info
    let prompt = null;
    if (promptType) {
      prompt = await this._resolvePrompt(courseRoot, promptType, warnings);
    }

    // Build formatted output
    const formatted = this._format({
      courseRoot,
      command,
      week,
      layer1,
      layer2,
      layer3,
      layer4,
      resolved,
      prompt,
      warnings
    });

    return {
      layers: {
        layer1,
        layer2,
        layer3,
        layer4
      },
      resolved,
      prompt,
      formatted,
      warnings
    };
  }

  /**
   * Load Layer 1: Plugin Defaults
   *
   * Combines hardcoded defaults from buildMergedVariables() and
   * getDefaultConfig() + getDefaultTeachingStyle().
   *
   * @returns {Object} Flattened default key-value pairs
   * @private
   */
  _loadLayer1() {
    // Defaults from buildMergedVariables (the canonical source)
    const mergedDefaults = {
      tone: 'formal',
      pedagogical_approach: 'active-learning',
      course_level: 'undergraduate',
      field: 'statistics',
      language: 'r'
    };

    // Defaults from getDefaultConfig
    const configDefaults = getDefaultConfig();
    const flatConfig = PromptConfigBridge.flattenConfig(configDefaults);
    const filteredConfig = PromptConfigBridge.filterUndefined(flatConfig);

    // Defaults from getDefaultTeachingStyle
    const styleDefaults = getDefaultTeachingStyle();
    const flatStyle = PromptConfigBridge.flattenStyle(styleDefaults);
    const filteredStyle = PromptConfigBridge.filterUndefined(flatStyle);

    // Merge: mergedDefaults take precedence as they are the final word
    return {
      ...filteredConfig,
      ...filteredStyle,
      ...mergedDefaults
    };
  }

  /**
   * Load Layer 2: Course Style
   *
   * Values from .flow/teach-config.yml and teaching style files,
   * excluding command_overrides.
   *
   * @param {string|null} courseRoot - Course root directory
   * @param {string[]} warnings - Warnings array to append to
   * @returns {Object} Flattened course-level key-value pairs
   * @private
   */
  _loadLayer2(courseRoot, warnings) {
    if (!courseRoot) return {};

    const result = {};

    // Load teach-config.yml values
    try {
      const config = loadTeachConfig(courseRoot, { debug: this.debug, strict: false });
      const defaults = getDefaultConfig();

      // Only include values that differ from defaults
      const flatConfig = PromptConfigBridge.flattenConfig(config);
      const flatDefaults = PromptConfigBridge.flattenConfig(defaults);

      for (const [key, value] of Object.entries(flatConfig)) {
        if (value !== undefined && value !== null && value !== flatDefaults[key]) {
          result[key] = value;
        }
      }
    } catch (err) {
      warnings.push(`Layer 2 config load failed: ${err.message}`);
    }

    // Load teaching style (course-level, excluding command overrides)
    try {
      const styleResult = loadTeachingStyle({
        command: '_none_', // use a non-matching command to avoid getting overrides
        startDir: courseRoot
      });

      const defaultStyle = getDefaultTeachingStyle();
      const flatStyle = PromptConfigBridge.flattenStyle(styleResult.style);
      const flatDefaults = PromptConfigBridge.flattenStyle(defaultStyle);

      for (const [key, value] of Object.entries(flatStyle)) {
        if (value !== undefined && value !== null && value !== flatDefaults[key]) {
          result[key] = value;
        }
      }

      // Track source paths
      if (styleResult.sources.course) {
        result._source_course = styleResult.sources.course;
      }
      if (styleResult.sources.global) {
        result._source_global = styleResult.sources.global;
      }
    } catch (err) {
      warnings.push(`Layer 2 style load failed: ${err.message}`);
    }

    return result;
  }

  /**
   * Load Layer 3: Command Overrides
   *
   * Values from command_overrides.<command> in teaching style.
   *
   * @param {string|null} courseRoot - Course root directory
   * @param {string} [command] - Command name
   * @param {string[]} warnings - Warnings array to append to
   * @returns {Object} Flattened command-override key-value pairs
   * @private
   */
  _loadLayer3(courseRoot, command, warnings) {
    if (!courseRoot || !command) return {};

    try {
      // Load style WITH command overrides applied
      const styleWithCmd = loadTeachingStyle({
        command,
        startDir: courseRoot
      });

      // If no command source was detected, there are no overrides
      if (!styleWithCmd.sources.command) {
        return {};
      }

      // Load style WITHOUT command overrides to find the diff
      const styleWithoutCmd = loadTeachingStyle({
        command: '_none_',
        startDir: courseRoot
      });

      const flatWith = PromptConfigBridge.flattenStyle(styleWithCmd.style);
      const flatWithout = PromptConfigBridge.flattenStyle(styleWithoutCmd.style);

      const result = {};
      for (const [key, value] of Object.entries(flatWith)) {
        if (value !== undefined && value !== null && value !== flatWithout[key]) {
          result[key] = value;
        }
      }

      return result;
    } catch (err) {
      warnings.push(`Layer 3 command overrides load failed: ${err.message}`);
      return {};
    }
  }

  /**
   * Load Layer 4: Week Plan
   *
   * Values from a specific week's lesson plan.
   *
   * @param {string|null} courseRoot - Course root directory
   * @param {string|number} [week] - Week identifier
   * @param {string[]} warnings - Warnings array to append to
   * @returns {Object} Flattened lesson plan key-value pairs
   * @private
   */
  _loadLayer4(courseRoot, week, warnings) {
    if (!courseRoot || week === undefined || week === null) return {};

    try {
      const planResult = loadLessonPlan({
        weekId: week,
        courseRoot,
        validate: false
      });

      if (!planResult.plan) {
        if (planResult.validation?.errors?.length > 0) {
          warnings.push(`Layer 4: ${planResult.validation.errors[0]}`);
        }
        return {};
      }

      const result = {};
      const { extracted } = planResult;

      if (extracted) {
        if (extracted.topic) result.topic = extracted.topic;
        if (extracted.title) result.lesson_title = extracted.title;
        if (extracted.week !== undefined) result.week = extracted.week;
        if (extracted.learning_objectives?.length > 0) {
          result.learning_objectives = extracted.learning_objectives;
        }
        if (extracted.topics?.length > 0) {
          result.topics = extracted.topics;
        }
        if (extracted.teaching_style_overrides) {
          const flatOverrides = PromptConfigBridge.flattenStyle(extracted.teaching_style_overrides);
          const filtered = PromptConfigBridge.filterUndefined(flatOverrides);
          Object.assign(result, filtered);
        }
      }

      result._source = planResult.source;
      return result;
    } catch (err) {
      warnings.push(`Layer 4 lesson plan load failed: ${err.message}`);
      return {};
    }
  }

  /**
   * Resolve prompt template information
   *
   * @param {string|null} courseRoot - Course root directory
   * @param {string} promptType - Prompt type to resolve
   * @param {string[]} warnings - Warnings array to append to
   * @returns {Promise<Object|null>} Prompt info or null
   * @private
   */
  async _resolvePrompt(courseRoot, promptType, warnings) {
    try {
      const result = await PromptLoader.load(
        promptType,
        courseRoot || this.cwd,
        { debug: this.debug }
      );

      return {
        source: result.source,
        path: result.path,
        version: result.metadata?.prompt_version || null,
        type: result.metadata?.prompt_type || promptType,
        scholarVersion: PromptConfigBridge.getScholarVersion()
      };
    } catch (err) {
      warnings.push(`Prompt resolution failed for "${promptType}": ${err.message}`);
      return null;
    }
  }

  /**
   * Build resolved map with source layer annotations
   *
   * Each key maps to { value, layer, layerName, overrides }.
   * Higher layers override lower layers.
   *
   * @param {Object} layer1 - Plugin defaults
   * @param {Object} layer2 - Course style
   * @param {Object} layer3 - Command overrides
   * @param {Object} layer4 - Week plan
   * @returns {Object} Resolved map with annotations
   * @private
   */
  _buildResolved(layer1, layer2, layer3, layer4) {
    const resolved = {};
    const layers = [
      { data: layer1, num: 1, name: 'Plugin Defaults' },
      { data: layer2, num: 2, name: 'Course Style' },
      { data: layer3, num: 3, name: 'Command Overrides' },
      { data: layer4, num: 4, name: 'Week Plan' }
    ];

    for (const { data, num, name } of layers) {
      for (const [key, value] of Object.entries(data)) {
        // Skip internal source tracking keys
        if (key.startsWith('_')) continue;

        const previousLayer = resolved[key]?.layer || null;
        resolved[key] = {
          value,
          layer: num,
          layerName: name,
          overrides: previousLayer
        };
      }
    }

    return resolved;
  }

  /**
   * Format the resolved config hierarchy as a human-readable string
   *
   * @param {Object} params - Format parameters
   * @param {string|null} params.courseRoot - Course root
   * @param {string} [params.command] - Command name
   * @param {string|number} [params.week] - Week number
   * @param {Object} params.layer1 - Layer 1 data
   * @param {Object} params.layer2 - Layer 2 data
   * @param {Object} params.layer3 - Layer 3 data
   * @param {Object} params.layer4 - Layer 4 data
   * @param {Object} params.resolved - Resolved annotations
   * @param {Object|null} params.prompt - Prompt info
   * @param {string[]} params.warnings - Warnings
   * @returns {string} Formatted output
   * @private
   */
  _format({ courseRoot: _courseRoot, command, week, layer1, layer2, layer3, layer4, resolved, prompt, warnings }) {
    const lines = [];

    // Header
    const commandLabel = command ? `/teaching:${command}` : '(no command)';
    const weekLabel = week !== undefined && week !== null ? ` (Week ${week})` : '';
    lines.push(`=== Resolved Config: ${commandLabel}${weekLabel} ===`);
    lines.push('');

    // Layer 1
    lines.push('Layer 1 (Plugin Defaults):');
    this._formatLayer(lines, layer1, 1, resolved);
    lines.push('');

    // Layer 2
    const layer2Source = layer2._source_course || '.flow/teach-config.yml';
    const layer2Keys = this._getPublicKeys(layer2);
    if (layer2Keys.length > 0) {
      lines.push(`Layer 2 (Course Style \u2014 ${layer2Source}):`);
      this._formatLayer(lines, layer2, 2, resolved);
    } else {
      lines.push('Layer 2 (Course Style):');
      lines.push('  (no course-level overrides found)');
    }
    lines.push('');

    // Layer 3
    if (command) {
      const layer3Keys = this._getPublicKeys(layer3);
      if (layer3Keys.length > 0) {
        lines.push(`Layer 3 (Command Overrides \u2014 command_overrides.${command}):`);
        this._formatLayer(lines, layer3, 3, resolved);
      } else {
        lines.push(`Layer 3 (Command Overrides \u2014 command_overrides.${command}):`);
        lines.push('  (no command overrides found)');
      }
    } else {
      lines.push('Layer 3 (Command Overrides):');
      lines.push('  (no --command specified)');
    }
    lines.push('');

    // Layer 4
    if (week !== undefined && week !== null) {
      const layer4Keys = this._getPublicKeys(layer4);
      if (layer4Keys.length > 0) {
        lines.push(`Layer 4 (Week ${week} Plan):`);
        this._formatLayer(lines, layer4, 4, resolved);
      } else {
        lines.push(`Layer 4 (Week ${week} Plan):`);
        lines.push('  (no lesson plan found)');
      }
    } else {
      lines.push('Layer 4 (Week Plan):');
      lines.push('  (no --week specified)');
    }

    // Prompt info
    if (prompt) {
      lines.push('');
      const sourceLabel = prompt.source === 'project'
        ? `${prompt.path} (project override)`
        : `${prompt.path || 'built-in'} (${prompt.source})`;
      lines.push(`Prompt template: ${sourceLabel}`);
      if (prompt.scholarVersion) {
        lines.push(`  Based on Scholar v${prompt.scholarVersion} defaults`);
      }
    }

    // Warnings
    if (warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      for (const warning of warnings) {
        lines.push(`  - ${warning}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format a single layer's entries into output lines
   *
   * @param {string[]} lines - Lines array to append to
   * @param {Object} layerData - Layer key-value data
   * @param {number} layerNum - Layer number for annotation
   * @param {Object} resolved - Resolved map for override detection
   * @private
   */
  _formatLayer(lines, layerData, layerNum, resolved) {
    const keys = this._getPublicKeys(layerData);
    if (keys.length === 0 && layerNum === 1) {
      // Layer 1 always has data, show all defaults
      return;
    }

    for (const key of keys.sort()) {
      const value = layerData[key];
      const formattedValue = this._formatValue(value);
      const annotation = this._getAnnotation(key, layerNum, resolved);
      lines.push(`  ${key}: ${formattedValue}${annotation}`);
    }
  }

  /**
   * Format a value for display
   *
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   * @private
   */
  _formatValue(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return `{${Object.keys(value).length} keys}`;
    return String(value);
  }

  /**
   * Get override annotation for a key at a given layer
   *
   * @param {string} key - Config key
   * @param {number} layerNum - Current layer number
   * @param {Object} resolved - Resolved map
   * @returns {string} Annotation string (e.g., " <- overrides Layer 1")
   * @private
   */
  _getAnnotation(key, layerNum, resolved) {
    const entry = resolved[key];
    if (!entry) return '';

    // Only annotate if this layer is the winning layer and it overrides something
    if (entry.layer === layerNum && entry.overrides !== null) {
      return ` \u2190 overrides Layer ${entry.overrides}`;
    }

    return '';
  }

  /**
   * Get public (non-underscore-prefixed) keys from a layer object
   *
   * @param {Object} data - Layer data
   * @returns {string[]} Public keys
   * @private
   */
  _getPublicKeys(data) {
    return Object.keys(data).filter(k => !k.startsWith('_'));
  }
}

export default ConfigShow;
