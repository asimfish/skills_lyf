/**
 * Prompt Loader for Teaching Content Generation
 *
 * Discovers and loads prompt templates from project or plugin defaults.
 * Handles YAML frontmatter parsing, metadata validation, and version checking.
 *
 * Resolution order:
 * 1. .flow/templates/prompts/{type}.md (project-specific)
 * 2. Plugin defaults (src/teaching/ai/prompts/default/)
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yaml from 'js-yaml';
import { SCHOLAR_VERSION } from '../config/scaffolder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Error thrown when prompt loading fails
 */
export class PromptLoadError extends Error {
  /**
   * Create a PromptLoadError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {string} options.type - Prompt type (e.g., 'lecture-notes', 'exam')
   * @param {string} options.path - Path that was attempted
   */
  constructor(message, { type, path }) {
    super(message);
    this.name = 'PromptLoadError';
    this.type = type;
    this.path = path;
  }
}

/**
 * Error thrown when prompt validation fails
 */
export class PromptValidationError extends Error {
  /**
   * Create a PromptValidationError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {string[]} options.warnings - Validation warnings
   * @param {string[]} options.errors - Validation errors
   */
  constructor(message, { warnings, errors }) {
    super(message);
    this.name = 'PromptValidationError';
    this.warnings = warnings || [];
    this.errors = errors || [];
  }
}

/**
 * Valid prompt types supported by the system
 */
const VALID_PROMPT_TYPES = [
  'lecture-notes',
  'lecture-outline',
  'section-content',
  'exam',
  'quiz',
  'slides',
  'revealjs-slides',
  'assignment',
  'syllabus',
  'rubric',
  'feedback'
];

/**
 * Required fields in prompt metadata
 */
const REQUIRED_METADATA_FIELDS = ['prompt_version', 'prompt_type', 'prompt_description'];

/**
 * Optional fields in prompt metadata
 */
const OPTIONAL_METADATA_FIELDS = [
  'target_template',
  'author',
  'last_updated',
  'variables',
  'based_on_scholar_version'
];

/**
 * PromptLoader class for discovering and loading prompt templates
 */
export class PromptLoader {
  /**
   * Discover and load prompt from project or defaults
   *
   * Resolution order:
   * 1. .flow/templates/prompts/{type}.md (project)
   * 2. Plugin defaults (src/teaching/ai/prompts/default/)
   *
   * @param {string} type - Prompt type (lecture-notes, exam, quiz, etc.)
   * @param {string} courseRoot - Course root directory
   * @param {Object} options - Loading options
   * @param {boolean} options.debug - Enable debug logging
   * @returns {Promise<{body: string, metadata: object, source: string}>}
   * @throws {PromptLoadError} If prompt cannot be found or loaded
   * @throws {PromptValidationError} If prompt has invalid format
   */
  static async load(type, courseRoot, options = {}) {
    const { debug = false } = options;
    const log = (msg) => {
      if (debug || process.env.SCHOLAR_DEBUG) {
        console.log(`[scholar:prompt] ${msg}`);
      }
    };

    // Validate prompt type
    if (!VALID_PROMPT_TYPES.includes(type)) {
      throw new PromptLoadError(
        `Invalid prompt type: "${type}". Must be one of: ${VALID_PROMPT_TYPES.join(', ')}`,
        { type, path: null }
      );
    }

    // Try project-specific prompt first
    const projectPath = join(courseRoot, '.flow', 'templates', 'prompts', `${type}.md`);
    log(`Looking for project prompt: ${projectPath}`);

    if (existsSync(projectPath)) {
      log(`Found project prompt: ${projectPath}`);
      try {
        const content = await readFile(projectPath, 'utf8');
        const parsed = this.parsePrompt(content);

        // Validate metadata
        const validation = this.validateMetadata(parsed.metadata);
        if (!validation.valid) {
          throw new PromptValidationError(
            `Invalid prompt metadata in ${projectPath}: ${validation.errors.join(', ')}`,
            { warnings: validation.warnings, errors: validation.errors }
          );
        }

        // Log warnings
        if (validation.warnings.length > 0 && debug) {
          validation.warnings.forEach(w => log(`Warning: ${w}`));
        }

        return {
          body: parsed.body,
          metadata: parsed.metadata,
          source: 'project',
          path: projectPath
        };
      } catch (err) {
        if (err instanceof PromptValidationError) {
          throw err;
        }
        throw new PromptLoadError(
          `Failed to load project prompt: ${err.message}`,
          { type, path: projectPath }
        );
      }
    }

    // Fall back to plugin defaults
    log(`No project prompt found, using default`);
    return this.loadDefault(type, options);
  }

  /**
   * Load from plugin defaults only
   *
   * @param {string} type - Prompt type
   * @param {Object} options - Loading options
   * @param {boolean} options.debug - Enable debug logging
   * @returns {Promise<{body: string, metadata: object, source: string}>}
   * @throws {PromptLoadError} If default prompt cannot be found
   */
  static async loadDefault(type, options = {}) {
    const { debug = false } = options;
    const log = (msg) => {
      if (debug || process.env.SCHOLAR_DEBUG) {
        console.log(`[scholar:prompt] ${msg}`);
      }
    };

    const defaultPath = join(__dirname, 'prompts', 'default', `${type}.md`);
    log(`Looking for default prompt: ${defaultPath}`);

    if (!existsSync(defaultPath)) {
      throw new PromptLoadError(
        `No default prompt found for type: "${type}"`,
        { type, path: defaultPath }
      );
    }

    try {
      const content = await readFile(defaultPath, 'utf8');
      const parsed = this.parsePrompt(content);

      // Validate metadata (more lenient for defaults)
      const validation = this.validateMetadata(parsed.metadata);
      if (!validation.valid) {
        // Log errors but don't throw for defaults - they should always work
        log(`Warning: Default prompt has validation issues: ${validation.errors.join(', ')}`);
      }

      log(`Loaded default prompt: ${defaultPath}`);
      return {
        body: parsed.body,
        metadata: parsed.metadata,
        source: 'default',
        path: defaultPath
      };
    } catch (err) {
      throw new PromptLoadError(
        `Failed to load default prompt: ${err.message}`,
        { type, path: defaultPath }
      );
    }
  }

  /**
   * Parse prompt content (YAML frontmatter + body)
   *
   * @param {string} content - Raw prompt file content
   * @returns {{ metadata: object, body: string }} Parsed prompt
   */
  static parsePrompt(content) {
    // Check for YAML frontmatter (starts with ---)
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      // No frontmatter - return entire content as body with empty metadata
      return {
        metadata: {},
        body: content.trim()
      };
    }

    const yamlContent = match[1];
    const body = match[2];

    // Parse YAML frontmatter
    let metadata;
    try {
      metadata = yaml.load(yamlContent) || {};
    } catch (err) {
      throw new Error(`Invalid YAML frontmatter: ${err.message}`, { cause: err });
    }

    return {
      metadata,
      body: body.trim()
    };
  }

  /**
   * Validate prompt metadata
   *
   * @param {object} meta - Prompt metadata from frontmatter
   * @returns {{ valid: boolean, warnings: string[], errors: string[] }} Validation result
   */
  static validateMetadata(meta) {
    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of REQUIRED_METADATA_FIELDS) {
      if (!meta[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate prompt_version format (semver-like: "X.Y")
    if (meta.prompt_version) {
      const versionPattern = /^\d+\.\d+$/;
      if (!versionPattern.test(meta.prompt_version)) {
        errors.push(`Invalid prompt_version format: "${meta.prompt_version}". Expected "X.Y" (e.g., "2.0")`);
      }
    }

    // Validate prompt_type is known
    if (meta.prompt_type && !VALID_PROMPT_TYPES.includes(meta.prompt_type)) {
      errors.push(`Invalid prompt_type: "${meta.prompt_type}". Must be one of: ${VALID_PROMPT_TYPES.join(', ')}`);
    }

    // Validate last_updated is ISO date format if present
    if (meta.last_updated) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(meta.last_updated)) {
        warnings.push(`last_updated should be ISO date format (YYYY-MM-DD): "${meta.last_updated}"`);
      }
    }

    // Validate variables structure if present
    if (meta.variables) {
      if (typeof meta.variables !== 'object') {
        errors.push('variables must be an object');
      } else {
        if (meta.variables.required && !Array.isArray(meta.variables.required)) {
          errors.push('variables.required must be an array');
        }
        if (meta.variables.optional && !Array.isArray(meta.variables.optional)) {
          errors.push('variables.optional must be an array');
        }
      }
    }

    // Warn about unknown fields
    const knownFields = [...REQUIRED_METADATA_FIELDS, ...OPTIONAL_METADATA_FIELDS];
    for (const field of Object.keys(meta)) {
      if (!knownFields.includes(field)) {
        warnings.push(`Unknown metadata field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Check version compatibility between prompt and Scholar
   *
   * @param {string} promptVersion - Prompt version (e.g., "2.0")
   * @param {string} scholarVersion - Scholar version (e.g., "2.4.0")
   * @returns {{ compatible: boolean, severity: string, message: string, suggestion?: string }}
   */
  static checkVersion(promptVersion, scholarVersion) {
    // Parse versions
    const [promptMajor, promptMinor = 0] = promptVersion.split('.').map(Number);
    const [scholarMajor, scholarMinor = 0] = scholarVersion.split('.').map(Number);

    // Major version mismatch - prompt requires newer Scholar
    if (promptMajor > scholarMajor) {
      return {
        compatible: false,
        severity: 'error',
        message: `Prompt requires Scholar v${promptMajor}.x, but you have v${scholarVersion}`
      };
    }

    // Prompt is older than Scholar - may be missing features
    if (promptMajor < scholarMajor || promptMinor < scholarMinor) {
      return {
        compatible: true,
        severity: 'warning',
        message: `Prompt v${promptVersion} is older than Scholar v${scholarVersion}`,
        suggestion: "Run 'teach templates update' to get the latest prompts"
      };
    }

    // Versions match
    return {
      compatible: true,
      severity: 'none',
      message: 'Version compatible'
    };
  }

  /**
   * List all available prompt types
   *
   * @returns {string[]} Array of valid prompt types
   */
  static listTypes() {
    return [...VALID_PROMPT_TYPES];
  }

  /**
   * Check if a prompt type is valid
   *
   * @param {string} type - Prompt type to check
   * @returns {boolean} True if type is valid
   */
  static isValidType(type) {
    return VALID_PROMPT_TYPES.includes(type);
  }

  /**
   * Scan project prompts and check for version drift against current Scholar version.
   *
   * Reads all .md files from `.flow/templates/prompts/` in the courseRoot,
   * parses their frontmatter, and compares `based_on_scholar_version` against
   * the current SCHOLAR_VERSION.
   *
   * @param {string} courseRoot - Course root directory
   * @param {Object} options - Options
   * @param {boolean} options.debug - Enable debug logging
   * @returns {Promise<UpgradeCheckResult>}
   */
  static async checkUpgrades(courseRoot, options = {}) {
    const { debug = false } = options;
    const log = (msg) => {
      if (debug || process.env.SCHOLAR_DEBUG) {
        console.log(`[scholar:prompt] ${msg}`);
      }
    };

    const promptsDir = join(courseRoot, '.flow', 'templates', 'prompts');
    const result = {
      hasUpgrades: false,
      scholarVersion: SCHOLAR_VERSION,
      prompts: [],
      formatted: ''
    };

    // Check if prompts directory exists
    if (!existsSync(promptsDir)) {
      log('No .flow/templates/prompts/ directory found');
      result.formatted = 'No project prompt overrides found.';
      return result;
    }

    // Read all files in prompts directory
    let files;
    try {
      files = await readdir(promptsDir);
    } catch (err) {
      log(`Failed to read prompts directory: ${err.message}`);
      result.formatted = 'No project prompt overrides found.';
      return result;
    }

    // Filter to .md files only
    const mdFiles = files.filter(f => f.endsWith('.md'));

    if (mdFiles.length === 0) {
      log('No .md files found in prompts directory');
      result.formatted = 'No project prompt overrides found.';
      return result;
    }

    // Check each prompt file
    for (const file of mdFiles) {
      const filePath = join(promptsDir, file);
      const type = file.replace(/\.md$/, '');

      log(`Checking prompt: ${file}`);

      let content;
      try {
        content = await readFile(filePath, 'utf8');
      } catch (err) {
        log(`Failed to read ${file}: ${err.message}`);
        result.prompts.push({
          type,
          status: 'unknown',
          basedOnVersion: null,
          currentVersion: SCHOLAR_VERSION,
          path: filePath
        });
        continue;
      }

      // Parse frontmatter
      let metadata;
      try {
        const parsed = this.parsePrompt(content);
        metadata = parsed.metadata;
      } catch (err) {
        log(`Failed to parse ${file}: ${err.message}`);
        result.prompts.push({
          type,
          status: 'unknown',
          basedOnVersion: null,
          currentVersion: SCHOLAR_VERSION,
          path: filePath
        });
        continue;
      }

      const basedOn = metadata.based_on_scholar_version || null;

      let status;
      if (!basedOn) {
        status = 'unknown';
      } else if (basedOn === SCHOLAR_VERSION) {
        status = 'current';
      } else {
        status = 'stale';
      }

      log(`  ${type}: status=${status}, basedOn=${basedOn}`);

      result.prompts.push({
        type,
        status,
        basedOnVersion: basedOn,
        currentVersion: SCHOLAR_VERSION,
        path: filePath
      });
    }

    // Determine if any upgrades are needed
    result.hasUpgrades = result.prompts.some(p => p.status === 'stale');

    // Build formatted output
    result.formatted = this._formatUpgradeCheck(result);

    return result;
  }

  /**
   * Check if this is the first run after a Scholar version change.
   * Uses .flow/.scholar-version as a marker file.
   *
   * @param {string} courseRoot - Course root directory
   * @param {Object} options - Options
   * @param {boolean} options.debug - Enable debug logging
   * @returns {Promise<{isFirstRun: boolean, previousVersion: string|null, currentVersion: string}>}
   */
  static async isFirstRunAfterUpgrade(courseRoot, options = {}) {
    const { debug = false } = options;
    const log = (msg) => {
      if (debug || process.env.SCHOLAR_DEBUG) {
        console.log(`[scholar:prompt] ${msg}`);
      }
    };

    const versionFile = join(courseRoot, '.flow', '.scholar-version');

    if (!existsSync(versionFile)) {
      log('No .scholar-version file found — first run ever or after upgrade');
      return {
        isFirstRun: true,
        previousVersion: null,
        currentVersion: SCHOLAR_VERSION
      };
    }

    let storedVersion;
    try {
      storedVersion = (await readFile(versionFile, 'utf8')).trim();
    } catch (err) {
      log(`Failed to read .scholar-version: ${err.message}`);
      return {
        isFirstRun: true,
        previousVersion: null,
        currentVersion: SCHOLAR_VERSION
      };
    }

    if (storedVersion === SCHOLAR_VERSION) {
      log(`Scholar version matches: ${SCHOLAR_VERSION}`);
      return {
        isFirstRun: false,
        previousVersion: storedVersion,
        currentVersion: SCHOLAR_VERSION
      };
    }

    log(`Version drift detected: ${storedVersion} → ${SCHOLAR_VERSION}`);
    return {
      isFirstRun: true,
      previousVersion: storedVersion,
      currentVersion: SCHOLAR_VERSION
    };
  }

  /**
   * Record current Scholar version to .flow/.scholar-version.
   * Called after displaying upgrade notice.
   *
   * @param {string} courseRoot - Course root directory
   */
  static async recordVersion(courseRoot) {
    const flowDir = join(courseRoot, '.flow');
    if (!existsSync(flowDir)) {
      await mkdir(flowDir, { recursive: true });
    }

    const versionFile = join(flowDir, '.scholar-version');
    await writeFile(versionFile, SCHOLAR_VERSION, 'utf8');
  }

  /**
   * Format upgrade check results into human-readable output.
   *
   * @param {Object} result - Upgrade check result
   * @returns {string} Formatted output
   * @private
   */
  static _formatUpgradeCheck(result) {
    const lines = [];

    if (result.prompts.length === 0) {
      return 'No project prompt overrides found.';
    }

    const stale = result.prompts.filter(p => p.status === 'stale');
    const unknown = result.prompts.filter(p => p.status === 'unknown');
    const current = result.prompts.filter(p => p.status === 'current');

    if (stale.length === 0 && unknown.length === 0) {
      lines.push('All project prompts are up to date.');
      return lines.join('\n');
    }

    lines.push(`Scholar v${result.scholarVersion} — Prompt upgrade check:\n`);

    if (stale.length > 0) {
      lines.push('Prompt changes detected:');
      for (const p of stale) {
        lines.push(`  * ${p.type}.md — Version drift (based on v${p.basedOnVersion})`);
      }
      lines.push('');
    }

    if (unknown.length > 0) {
      lines.push('Prompts without version tracking:');
      for (const p of unknown) {
        lines.push(`  ? ${p.type}.md — No based_on_scholar_version field`);
      }
      lines.push('');
    }

    if (current.length > 0) {
      lines.push('Up-to-date prompts:');
      for (const p of current) {
        lines.push(`  . ${p.type}.md — Current (v${p.basedOnVersion})`);
      }
      lines.push('');
    }

    if (stale.length > 0) {
      lines.push('Run /teaching:config diff to see changes.');
    }

    return lines.join('\n');
  }
}

export default PromptLoader;
