/**
 * Config Scaffolder for Teaching Prompt Templates
 *
 * Copies Scholar default prompt templates to `.flow/templates/prompts/`
 * for project-level customization. Injects Scholar version metadata
 * into YAML frontmatter so users can track which version they based
 * their customization on.
 *
 * Usage:
 *   const scaffolder = new ConfigScaffolder({ cwd: '/path/to/project' });
 *   const result = await scaffolder.scaffold('lecture-notes');
 *   // => { targetPath, scholarVersion, requiredVars, optionalVars, alreadyExists }
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Current Scholar version injected into scaffolded prompts
 */
const SCHOLAR_VERSION = '2.7.0';

/**
 * Path to the default prompts directory (relative to this module)
 */
const DEFAULTS_DIR = join(__dirname, '..', 'ai', 'prompts', 'default');

/**
 * Error thrown when scaffolding fails
 */
export class ScaffoldError extends Error {
  /**
   * Create a ScaffoldError
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {string} [options.type] - Prompt type that was being scaffolded
   * @param {string} [options.path] - Path that was involved
   */
  constructor(message, { type, path } = {}) {
    super(message);
    this.name = 'ScaffoldError';
    this.type = type || null;
    this.path = path || null;
  }
}

/**
 * ConfigScaffolder copies default prompt templates to project-level
 * `.flow/templates/prompts/` for customization.
 */
export class ConfigScaffolder {
  /**
   * Create a ConfigScaffolder instance
   * @param {Object} options - Scaffolder options
   * @param {string} [options.cwd=process.cwd()] - Working directory (project root)
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
    this.debug = options.debug || false;
  }

  /**
   * Log a debug message
   * @param {string} msg - Message to log
   * @private
   */
  _log(msg) {
    if (this.debug || process.env.SCHOLAR_DEBUG) {
      console.log(`[scholar:scaffolder] ${msg}`);
    }
  }

  /**
   * Scaffold a default prompt template to the project directory.
   *
   * Copies the default prompt for the given type into
   * `.flow/templates/prompts/{type}.md`, injecting `based_on_scholar_version`
   * into the YAML frontmatter.
   *
   * @param {string} type - Prompt type to scaffold (e.g., 'lecture-notes', 'exam')
   * @returns {Promise<Object>} Scaffold result
   * @returns {string} result.targetPath - Absolute path to the scaffolded file
   * @returns {string} result.scholarVersion - Scholar version injected into frontmatter
   * @returns {string[]} result.requiredVars - Required template variables
   * @returns {string[]} result.optionalVars - Optional template variables
   * @returns {boolean} result.alreadyExists - True if file already existed (no write performed)
   * @throws {ScaffoldError} If type is invalid or default prompt is missing
   */
  async scaffold(type) {
    this._log(`Scaffolding prompt type: ${type}`);

    // Defense-in-depth: reject path separators before any filesystem use
    if (type.includes('..') || type.includes('/') || type.includes('\\')) {
      throw new ScaffoldError('Invalid prompt type: contains path separators', { type });
    }

    // Validate prompt type
    if (!VALID_PROMPT_TYPES.includes(type)) {
      throw new ScaffoldError(
        `Invalid prompt type: "${type}". Must be one of: ${VALID_PROMPT_TYPES.join(', ')}`,
        { type }
      );
    }

    // Check if project override already exists
    const targetDir = join(this.cwd, '.flow', 'templates', 'prompts');
    const targetPath = join(targetDir, `${type}.md`);

    if (existsSync(targetPath)) {
      this._log(`File already exists: ${targetPath}`);

      // Read existing file to extract variables
      const existingContent = await readFile(targetPath, 'utf8');
      const { requiredVars, optionalVars } = this._extractVariables(existingContent);

      return {
        targetPath,
        scholarVersion: SCHOLAR_VERSION,
        requiredVars,
        optionalVars,
        alreadyExists: true
      };
    }

    // Read the default prompt
    const defaultPath = join(DEFAULTS_DIR, `${type}.md`);
    this._log(`Reading default prompt: ${defaultPath}`);

    if (!existsSync(defaultPath)) {
      throw new ScaffoldError(
        `No default prompt found for type: "${type}". Default file missing at: ${defaultPath}`,
        { type, path: defaultPath }
      );
    }

    let content;
    try {
      content = await readFile(defaultPath, 'utf8');
    } catch (err) {
      throw new ScaffoldError(
        `Failed to read default prompt: ${err.message}`,
        { type, path: defaultPath }
      );
    }

    // Inject based_on_scholar_version into frontmatter
    const injected = this._injectVersion(content, type);

    // Extract variables for the return value
    const { requiredVars, optionalVars } = this._extractVariables(content);

    // Create target directory if needed
    if (!existsSync(targetDir)) {
      this._log(`Creating directory: ${targetDir}`);
      await mkdir(targetDir, { recursive: true });
    }

    // Write the scaffolded file
    this._log(`Writing scaffolded prompt to: ${targetPath}`);
    await writeFile(targetPath, injected, 'utf8');

    return {
      targetPath,
      scholarVersion: SCHOLAR_VERSION,
      requiredVars,
      optionalVars,
      alreadyExists: false
    };
  }

  /**
   * List available default prompt types that can be scaffolded.
   *
   * Only returns types for which a default `.md` file actually exists
   * in the defaults directory.
   *
   * @returns {string[]} Array of available prompt type names
   */
  listAvailable() {
    this._log(`Listing available defaults from: ${DEFAULTS_DIR}`);

    if (!existsSync(DEFAULTS_DIR)) {
      this._log('Defaults directory does not exist');
      return [];
    }

    let files;
    try {
      files = readdirSync(DEFAULTS_DIR);
    } catch (err) {
      this._log(`Failed to read defaults directory: ${err.message}`);
      throw new ScaffoldError(
        `Failed to read defaults directory: ${err.message}`,
        { path: DEFAULTS_DIR }
      );
    }

    const available = files
      .filter(f => f.endsWith('.md'))
      .map(f => basename(f, '.md'))
      .filter(name => VALID_PROMPT_TYPES.includes(name))
      .sort();

    this._log(`Found ${available.length} available defaults: ${available.join(', ')}`);
    return available;
  }

  /**
   * Inject `based_on_scholar_version` into YAML frontmatter.
   *
   * Parses the existing frontmatter, adds the version field, and
   * re-serializes the YAML while preserving the prompt body.
   *
   * @param {string} content - Raw prompt file content with frontmatter
   * @param {string} [type] - Prompt type (for error context)
   * @returns {string} Content with version injected into frontmatter
   * @throws {ScaffoldError} If frontmatter contains invalid YAML
   * @private
   */
  _injectVersion(content, type) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      // No frontmatter - wrap entire content with new frontmatter
      const newFrontmatter = yaml.dump(
        { based_on_scholar_version: SCHOLAR_VERSION },
        { lineWidth: -1 }
      ).trim();
      return `---\n${newFrontmatter}\n---\n\n${content}`;
    }

    const yamlContent = match[1];
    const body = match[2];

    // Parse existing frontmatter
    let metadata;
    try {
      metadata = yaml.load(yamlContent) || {};
    } catch (err) {
      throw new ScaffoldError(
        `Cannot inject version into scaffolded prompt: invalid YAML frontmatter — ${err.message}`,
        { type }
      );
    }

    // Add version field
    metadata.based_on_scholar_version = SCHOLAR_VERSION;

    // Re-serialize
    const newYaml = yaml.dump(metadata, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    }).trim();

    return `---\n${newYaml}\n---\n${body}`;
  }

  /**
   * Extract required and optional variables from prompt content.
   *
   * Handles two frontmatter formats:
   * - Format A: `variables.required` / `variables.optional` (lecture-notes style)
   * - Format B: `required_variables` / `optional_variables` (quiz style)
   *
   * @param {string} content - Raw prompt file content
   * @returns {{ requiredVars: string[], optionalVars: string[] }} Extracted variables
   * @private
   */
  _extractVariables(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { requiredVars: [], optionalVars: [] };
    }

    let metadata;
    try {
      metadata = yaml.load(match[1]) || {};
    } catch (err) {
      this._log(`Failed to parse YAML frontmatter for variable extraction: ${err.message}`);
      return { requiredVars: [], optionalVars: [] };
    }

    // Format A: variables.required / variables.optional
    if (metadata.variables && typeof metadata.variables === 'object') {
      return {
        requiredVars: Array.isArray(metadata.variables.required)
          ? [...metadata.variables.required]
          : [],
        optionalVars: Array.isArray(metadata.variables.optional)
          ? [...metadata.variables.optional]
          : []
      };
    }

    // Format B: required_variables / optional_variables
    return {
      requiredVars: Array.isArray(metadata.required_variables)
        ? [...metadata.required_variables]
        : [],
      optionalVars: Array.isArray(metadata.optional_variables)
        ? [...metadata.optional_variables]
        : []
    };
  }
}

export { VALID_PROMPT_TYPES, SCHOLAR_VERSION };
export default ConfigScaffolder;
