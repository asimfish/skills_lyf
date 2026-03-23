/**
 * Configuration Loader for Teaching Content
 *
 * Discovers and loads .flow/teach-config.yml from current or parent directories.
 * Provides fallback defaults if no configuration file is found.
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import yaml from 'js-yaml';

/**
 * Default configuration when no .flow/teach-config.yml is found
 * @returns {object} Default teaching configuration
 */
export function getDefaultConfig() {
  return {
    scholar: {
      course_info: {
        level: 'undergraduate',
        field: 'general',
        difficulty: 'intermediate',
      },
      defaults: {
        exam_format: 'markdown',
        lecture_format: 'markdown',
        question_types: ['multiple-choice', 'short-answer', 'essay'],
      },
      style: {
        tone: 'formal',
        notation: 'standard',
        examples: true,
      },
      data_dir: 'data/',
      r_packages: [],
    },
  };
}

/**
 * Search for .flow/teach-config.yml in parent directories
 * @param {string} startDir - Directory to start search from (defaults to cwd)
 * @returns {string|null} Path to config file or null if not found
 */
export function findConfigFile(startDir = process.cwd()) {
  let currentDir = resolve(startDir);
  const rootDir = '/';

  while (currentDir !== rootDir) {
    const configPath = join(currentDir, '.flow', 'teach-config.yml');

    if (existsSync(configPath)) {
      return configPath;
    }

    // Move up one directory
    const parentDir = dirname(currentDir);

    // Prevent infinite loop if dirname returns same path
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return null;
}

/**
 * Load and parse configuration file
 * @param {string} configPath - Path to config file
 * @returns {object} Parsed configuration
 * @throws {Error} If file cannot be read or parsed
 */
export function loadConfigFile(configPath) {
  try {
    const fileContents = readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);

    if (!config || typeof config !== 'object') {
      throw new Error('Configuration file is empty or invalid');
    }

    return config;
  } catch (error) {
    if (error.name === 'YAMLException') {
      throw new Error(`YAML parsing error in ${configPath}: ${error.message}`, { cause: error });
    }
    throw new Error(`Failed to load config file ${configPath}: ${error.message}`, { cause: error });
  }
}

/**
 * Merge user configuration with defaults
 * @param {object} userConfig - User-provided configuration
 * @param {object} defaultConfig - Default configuration
 * @returns {object} Merged configuration
 */
export function mergeConfig(userConfig, defaultConfig) {
  // Deep merge strategy
  function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }

    return result;
  }

  return deepMerge(defaultConfig, userConfig);
}

/**
 * Validate configuration structure
 * @param {object} config - Configuration to validate
 * @returns {object} Validation result with isValid and errors
 */
export function validateConfig(config) {
  const errors = [];

  // Check for scholar section
  if (!config.scholar) {
    errors.push('Missing required "scholar" section');
    return { isValid: false, errors };
  }

  const { scholar } = config;

  // Validate course_info
  if (scholar.course_info) {
    const { level, difficulty } = scholar.course_info;

    if (level && !['undergraduate', 'graduate'].includes(level)) {
      errors.push(
        `Invalid course_info.level: "${level}". Must be "undergraduate" or "graduate"`
      );
    }

    if (
      difficulty &&
      !['beginner', 'intermediate', 'advanced'].includes(difficulty)
    ) {
      errors.push(
        `Invalid course_info.difficulty: "${difficulty}". Must be "beginner", "intermediate", or "advanced"`
      );
    }
  }

  // Validate defaults
  if (scholar.defaults) {
    const { exam_format, lecture_format } = scholar.defaults;
    const validFormats = ['markdown', 'md', 'quarto', 'qmd', 'latex', 'tex', 'json'];

    if (exam_format && !validFormats.includes(exam_format)) {
      errors.push(
        `Invalid defaults.exam_format: "${exam_format}". Must be one of: ${validFormats.join(', ')}`
      );
    }

    if (lecture_format && !validFormats.includes(lecture_format)) {
      errors.push(
        `Invalid defaults.lecture_format: "${lecture_format}". Must be one of: ${validFormats.join(', ')}`
      );
    }
  }

  // Validate data_dir
  if (scholar.data_dir !== undefined && typeof scholar.data_dir !== 'string') {
    errors.push(
      `Invalid data_dir: must be a string (relative path to project root)`
    );
  }

  // Validate r_packages
  if (scholar.r_packages !== undefined) {
    if (!Array.isArray(scholar.r_packages)) {
      errors.push(
        `Invalid r_packages: must be an array of package name strings`
      );
    } else if (scholar.r_packages.some(p => typeof p !== 'string')) {
      errors.push(
        `Invalid r_packages: all entries must be strings (package names only, no versions)`
      );
    }
  }

  // Validate style
  if (scholar.style) {
    const { tone } = scholar.style;

    if (tone && !['formal', 'conversational'].includes(tone)) {
      errors.push(
        `Invalid style.tone: "${tone}". Must be "formal" or "conversational"`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Load teaching configuration from .flow/teach-config.yml
 * Searches parent directories and merges with defaults
 *
 * @param {string} startDir - Directory to start search from (defaults to cwd)
 * @param {object} options - Loading options
 * @param {boolean} options.validate - Whether to validate config (default: true)
 * @param {boolean} options.strict - Throw error on validation failure (default: false)
 * @param {string} options.configPath - Explicit config file path (bypasses discovery)
 * @param {boolean} options.debug - Enable debug logging (default: false)
 * @returns {object} Teaching configuration
 * @throws {Error} If validation fails in strict mode or explicit config path is invalid
 */
export function loadTeachConfig(startDir = process.cwd(), options = {}) {
  const {
    validate = true,
    strict = false,
    configPath: explicitConfigPath = null,
    debug = false
  } = options;

  // Debug helper
  const debugLog = (msg) => {
    if (debug || process.env.SCHOLAR_DEBUG) {
      console.log(`[scholar:config] ${msg}`);
    }
  };

  // Use explicit config path if provided, otherwise discover
  let configPath;
  let configSource;

  if (explicitConfigPath) {
    configSource = 'explicit';
    debugLog(`Source: explicit (--config flag)`);
    debugLog(`Path: ${explicitConfigPath}`);

    // Validate explicit path exists
    if (!existsSync(explicitConfigPath)) {
      const error = new Error(`Config file not found: ${explicitConfigPath}`);
      debugLog(`Error: ${error.message}`);
      if (strict) {
        throw error;
      }
      console.warn(`Warning: ${error.message}. Using default configuration.`);
      debugLog(`Fallback: using defaults`);
      return getDefaultConfig();
    }
    configPath = explicitConfigPath;
  } else {
    configSource = 'discovered';
    debugLog(`Source: discovered (searching parent directories)`);
    // Try to find config file via discovery
    configPath = findConfigFile(startDir);
    debugLog(`Path: ${configPath || '(not found)'}`);
  }

  // If no config file found, return defaults
  if (!configPath) {
    debugLog(`Fallback: using defaults (no config found)`);
    return getDefaultConfig();
  }

  // Load and parse config file
  let userConfig;
  try {
    userConfig = loadConfigFile(configPath);
    debugLog(`Loaded: ${Object.keys(userConfig).length} top-level keys`);
  } catch (error) {
    debugLog(`Load error: ${error.message}`);
    if (strict) {
      throw error;
    }
    // In non-strict mode, warn and return defaults
    console.warn(`Warning: ${error.message}. Using default configuration.`);
    debugLog(`Fallback: using defaults`);
    return getDefaultConfig();
  }

  // Merge with defaults
  const config = mergeConfig(userConfig, getDefaultConfig());
  debugLog(`Merged: config with defaults`);

  // Validate if requested
  if (validate) {
    const validation = validateConfig(config);
    if (!validation.isValid) {
      const errorMsg = `Configuration validation failed:\n${validation.errors.join('\n')}`;
      debugLog(`Validation: failed (${validation.errors.length} errors)`);

      if (strict) {
        throw new Error(errorMsg);
      }
      console.warn(`Warning: ${errorMsg}\nProceeding with merged configuration.`);
    } else {
      debugLog(`Validation: passed`);
    }
  } else {
    debugLog(`Validation: skipped`);
  }

  debugLog(`Complete: config loaded from ${configSource} source`);
  return config;
}

/**
 * Get a specific configuration value by path
 * @param {object} config - Configuration object
 * @param {string} path - Dot-separated path (e.g., 'scholar.course_info.level')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Configuration value
 */
export function getConfigValue(config, path, defaultValue = undefined) {
  const keys = path.split('.');
  let value = config;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Get course information from config
 * @param {object} config - Configuration object
 * @returns {object} Course information
 */
export function getCourseInfo(config) {
  return getConfigValue(config, 'scholar.course_info', {});
}

/**
 * Get default settings from config
 * @param {object} config - Configuration object
 * @returns {object} Default settings
 */
export function getDefaults(config) {
  return getConfigValue(config, 'scholar.defaults', {});
}

/**
 * Get style settings from config
 * @param {object} config - Configuration object
 * @returns {object} Style settings
 */
export function getStyle(config) {
  return getConfigValue(config, 'scholar.style', {});
}

/**
 * Get data directory path from config
 * @param {object} config - Configuration object
 * @returns {string} Data directory path (relative to project root)
 */
export function getDataDir(config) {
  return getConfigValue(config, 'scholar.data_dir', 'data/');
}

/**
 * Get R packages list from config
 * @param {object} config - Configuration object
 * @returns {string[]} Array of R package names
 */
export function getRPackages(config) {
  return getConfigValue(config, 'scholar.r_packages', []);
}
