/**
 * Prompt Diff Engine for Teaching Configuration
 *
 * Compares project-level prompt templates (`.flow/templates/prompts/`)
 * against Scholar default prompts to show what has changed, what is new,
 * and whether the user's prompts are based on an older Scholar version.
 *
 * Usage:
 *   const engine = new PromptDiffEngine({ cwd: '/path/to/project' });
 *   const result = await engine.diffAll();
 *   console.log(result.formatted);
 *
 * @module teaching/config/prompt-diff
 */

import { readFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { PromptLoader } from '../ai/prompt-loader.js';
import { SCHOLAR_VERSION } from './scaffolder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Path to the default prompts directory (relative to this module)
 */
const DEFAULTS_DIR = join(__dirname, '..', 'ai', 'prompts', 'default');

/**
 * ANSI color codes for formatted output
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

/**
 * Diff statuses for prompt comparison
 */
const STATUS = {
  IDENTICAL: 'identical',
  MODIFIED: 'modified',
  VERSION_MISMATCH: 'version-mismatch',
  NO_OVERRIDE: 'no-override',
  MISSING_DEFAULT: 'missing-default'
};

/**
 * Error thrown when prompt diff operations fail
 */
export class PromptDiffError extends Error {
  /**
   * Create a PromptDiffError
   * @param {string} message - Error message
   * @param {Object} [options] - Error options
   * @param {string} [options.type] - Prompt type involved
   * @param {string} [options.path] - File path involved
   */
  constructor(message, { type, path } = {}) {
    super(message);
    this.name = 'PromptDiffError';
    this.type = type || null;
    this.path = path || null;
  }
}

/**
 * PromptDiffEngine compares project prompt templates against Scholar defaults.
 *
 * Scans `.flow/templates/prompts/` for project overrides, loads corresponding
 * Scholar defaults, and produces a structured diff showing frontmatter changes,
 * variable changes, and body-level line diffs.
 */
export class PromptDiffEngine {
  /**
   * Create a PromptDiffEngine instance
   * @param {Object} [options] - Engine options
   * @param {string} [options.cwd=process.cwd()] - Working directory (project root)
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
    this.debug = options.debug || false;
    /** @type {string[]} Warnings collected during directory scanning */
    this._warnings = [];
  }

  /**
   * Log a debug message
   * @param {string} msg - Message to log
   * @private
   */
  _log(msg) {
    if (this.debug || process.env.SCHOLAR_DEBUG) {
      console.log(`[scholar:prompt-diff] ${msg}`);
    }
  }

  /**
   * Compare all project prompts against Scholar defaults.
   *
   * Scans the defaults directory for all known prompt types, then checks
   * whether the project has an override for each one.
   *
   * @returns {Promise<Object>} Diff result
   * @returns {Array} result.prompts - Array of per-type diff results
   * @returns {Object} result.summary - { total, overridden, identical, modified, versionMismatch }
   * @returns {string} result.formatted - ANSI-formatted output string
   */
  async diffAll() {
    this._log('Running diffAll');
    this._warnings = [];

    // Discover all default prompt types
    const defaultTypes = this._listDefaultTypes();
    this._log(`Found ${defaultTypes.length} default prompt types: ${defaultTypes.join(', ')}`);

    // Also discover any project prompts that might not have defaults
    const projectTypes = this._listProjectTypes();
    const allTypes = [...new Set([...defaultTypes, ...projectTypes])].sort();

    const prompts = [];

    for (const type of allTypes) {
      try {
        const diff = await this.diffType(type);
        prompts.push(diff);
      } catch (err) {
        this._log(`Error diffing ${type}: ${err.message}`);
        prompts.push({
          type,
          status: 'error',
          error: err.message,
          formatted: `  ${type}: Error - ${err.message}`
        });
      }
    }

    const summary = this._buildSummary(prompts);
    const formatted = this._formatAll(prompts, summary);

    const result = { prompts, summary, formatted };
    if (this._warnings.length > 0) {
      result.warnings = [...this._warnings];
    }
    return result;
  }

  /**
   * Compare a specific prompt type against its Scholar default.
   *
   * @param {string} type - Prompt type (e.g., 'lecture-notes', 'quiz')
   * @returns {Promise<Object>} Diff result for this type
   * @returns {string} result.type - Prompt type
   * @returns {string} result.status - One of: identical, modified, version-mismatch, no-override, missing-default
   * @returns {string|null} result.projectVersion - based_on_scholar_version from project prompt
   * @returns {string} result.defaultVersion - Current Scholar version
   * @returns {Object} result.frontmatterChanges - { added, removed, changed }
   * @returns {Object} result.variableChanges - { addedRequired, removedRequired, addedOptional, removedOptional }
   * @returns {Object} result.bodyChanges - { added, removed, changed, totalLines }
   * @returns {string} result.formatted - ANSI-formatted output for this type
   * @throws {PromptDiffError} If the type is invalid or comparison fails
   */
  async diffType(type) {
    this._log(`Diffing type: ${type}`);

    // Validate type by checking if a default exists (or a project override exists)
    const defaultPath = join(DEFAULTS_DIR, `${type}.md`);
    const projectPath = join(this.cwd, '.flow', 'templates', 'prompts', `${type}.md`);
    const hasDefault = existsSync(defaultPath);
    const hasProject = existsSync(projectPath);

    if (!hasDefault && !hasProject) {
      throw new PromptDiffError(
        `Unknown prompt type: "${type}". No default or project prompt found.`,
        { type }
      );
    }

    // No project override — using Scholar default
    if (!hasProject) {
      this._log(`No project override for ${type}`);
      return {
        type,
        status: STATUS.NO_OVERRIDE,
        projectVersion: null,
        defaultVersion: SCHOLAR_VERSION,
        frontmatterChanges: { added: [], removed: [], changed: [] },
        variableChanges: { addedRequired: [], removedRequired: [], addedOptional: [], removedOptional: [] },
        bodyChanges: { added: [], removed: [], changed: [], totalLines: 0 },
        formatted: this._formatNoOverride(type)
      };
    }

    // No default (project has a custom prompt with no Scholar counterpart)
    if (!hasDefault) {
      this._log(`No default found for ${type}, project has custom prompt`);
      return {
        type,
        status: STATUS.MISSING_DEFAULT,
        projectVersion: null,
        defaultVersion: SCHOLAR_VERSION,
        frontmatterChanges: { added: [], removed: [], changed: [] },
        variableChanges: { addedRequired: [], removedRequired: [], addedOptional: [], removedOptional: [] },
        bodyChanges: { added: [], removed: [], changed: [], totalLines: 0 },
        formatted: this._formatMissingDefault(type)
      };
    }

    // Both exist — perform comparison
    const [defaultContent, projectContent] = await Promise.all([
      readFile(defaultPath, 'utf8'),
      readFile(projectPath, 'utf8')
    ]);

    const defaultParsed = this._safeParse(defaultContent);
    const projectParsed = this._safeParse(projectContent);

    // Extract version info
    const projectVersion = projectParsed.metadata.based_on_scholar_version || null;
    const defaultVersion = SCHOLAR_VERSION;

    // Compute diffs
    const frontmatterChanges = this._diffFrontmatter(defaultParsed.metadata, projectParsed.metadata);
    const variableChanges = this._diffVariables(defaultParsed.metadata, projectParsed.metadata);
    const bodyChanges = this._diffBody(defaultParsed.body, projectParsed.body);

    // Determine status
    let status;
    if (this._isIdentical(frontmatterChanges, variableChanges, bodyChanges)) {
      if (projectVersion && projectVersion !== defaultVersion) {
        status = STATUS.VERSION_MISMATCH;
      } else {
        status = STATUS.IDENTICAL;
      }
    } else {
      if (projectVersion && projectVersion !== defaultVersion) {
        status = STATUS.VERSION_MISMATCH;
      } else {
        status = STATUS.MODIFIED;
      }
    }

    const result = {
      type,
      status,
      projectVersion,
      defaultVersion,
      frontmatterChanges,
      variableChanges,
      bodyChanges,
      formatted: ''
    };

    result.formatted = this._formatType(result);
    return result;
  }

  /**
   * Safely parse prompt content, handling missing/malformed frontmatter
   * @param {string} content - Raw file content
   * @returns {{ metadata: Object, body: string }}
   * @private
   */
  _safeParse(content) {
    try {
      return PromptLoader.parsePrompt(content);
    } catch (err) {
      this._log(`Prompt parse failed, using raw content: ${err.message}`);
      return { metadata: {}, body: content.trim() };
    }
  }

  /**
   * List all default prompt types available
   * @returns {string[]} Array of type names
   * @private
   */
  _listDefaultTypes() {
    if (!existsSync(DEFAULTS_DIR)) return [];
    try {
      return readdirSync(DEFAULTS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => basename(f, '.md'))
        .sort();
    } catch (err) {
      this._log(`Failed to read defaults directory: ${err.message}`);
      this._warnings.push(`Failed to read defaults directory: ${err.message}`);
      return [];
    }
  }

  /**
   * List project prompt types found in .flow/templates/prompts/
   * @returns {string[]} Array of type names
   * @private
   */
  _listProjectTypes() {
    const projectDir = join(this.cwd, '.flow', 'templates', 'prompts');
    if (!existsSync(projectDir)) return [];
    try {
      return readdirSync(projectDir)
        .filter(f => f.endsWith('.md'))
        .map(f => basename(f, '.md'))
        .sort();
    } catch (err) {
      this._log(`Failed to read project prompts directory: ${err.message}`);
      this._warnings.push(`Failed to read project prompts directory: ${err.message}`);
      return [];
    }
  }

  /**
   * Compare frontmatter metadata fields (excluding variables and based_on_scholar_version)
   * @param {Object} defaultMeta - Default prompt metadata
   * @param {Object} projectMeta - Project prompt metadata
   * @returns {{ added: Array, removed: Array, changed: Array }}
   * @private
   */
  _diffFrontmatter(defaultMeta, projectMeta) {
    const skipFields = ['variables', 'required_variables', 'optional_variables', 'based_on_scholar_version'];
    const added = [];
    const removed = [];
    const changed = [];

    const defaultKeys = Object.keys(defaultMeta).filter(k => !skipFields.includes(k));
    const projectKeys = Object.keys(projectMeta).filter(k => !skipFields.includes(k));

    // Fields added in project (not in default)
    for (const key of projectKeys) {
      if (!defaultKeys.includes(key)) {
        added.push({ field: key, value: projectMeta[key] });
      }
    }

    // Fields removed from project (in default but not project)
    for (const key of defaultKeys) {
      if (!projectKeys.includes(key)) {
        removed.push({ field: key, value: defaultMeta[key] });
      }
    }

    // Fields changed
    for (const key of defaultKeys) {
      if (projectKeys.includes(key)) {
        const defaultVal = JSON.stringify(defaultMeta[key]);
        const projectVal = JSON.stringify(projectMeta[key]);
        if (defaultVal !== projectVal) {
          changed.push({
            field: key,
            defaultValue: defaultMeta[key],
            projectValue: projectMeta[key]
          });
        }
      }
    }

    return { added, removed, changed };
  }

  /**
   * Compare template variables between default and project prompts.
   * Handles both Format A (variables.required/optional) and Format B
   * (required_variables/optional_variables).
   *
   * @param {Object} defaultMeta - Default prompt metadata
   * @param {Object} projectMeta - Project prompt metadata
   * @returns {{ addedRequired: string[], removedRequired: string[], addedOptional: string[], removedOptional: string[] }}
   * @private
   */
  _diffVariables(defaultMeta, projectMeta) {
    const defaultVars = this._extractVars(defaultMeta);
    const projectVars = this._extractVars(projectMeta);

    return {
      addedRequired: projectVars.required.filter(v => !defaultVars.required.includes(v)),
      removedRequired: defaultVars.required.filter(v => !projectVars.required.includes(v)),
      addedOptional: projectVars.optional.filter(v => !defaultVars.optional.includes(v)),
      removedOptional: defaultVars.optional.filter(v => !projectVars.optional.includes(v))
    };
  }

  /**
   * Extract required/optional variables from metadata, handling both formats
   * @param {Object} meta - Prompt metadata
   * @returns {{ required: string[], optional: string[] }}
   * @private
   */
  _extractVars(meta) {
    // Format A: variables.required / variables.optional
    if (meta.variables && typeof meta.variables === 'object') {
      return {
        required: Array.isArray(meta.variables.required) ? [...meta.variables.required] : [],
        optional: Array.isArray(meta.variables.optional) ? [...meta.variables.optional] : []
      };
    }

    // Format B: required_variables / optional_variables
    return {
      required: Array.isArray(meta.required_variables) ? [...meta.required_variables] : [],
      optional: Array.isArray(meta.optional_variables) ? [...meta.optional_variables] : []
    };
  }

  /**
   * Perform line-level diff on prompt bodies
   * @param {string} defaultBody - Default prompt body text
   * @param {string} projectBody - Project prompt body text
   * @returns {{ added: Array, removed: Array, changed: Array, totalLines: number }}
   * @private
   */
  _diffBody(defaultBody, projectBody) {
    const defaultLines = (defaultBody || '').split('\n');
    const projectLines = (projectBody || '').split('\n');
    const totalLines = Math.max(defaultLines.length, projectLines.length);

    const added = [];
    const removed = [];
    const changed = [];

    // Build a simple set-based diff for non-empty lines
    const defaultSet = new Set(defaultLines.map(l => l.trim()).filter(Boolean));
    const projectSet = new Set(projectLines.map(l => l.trim()).filter(Boolean));

    // Lines in project but not in default (added)
    let lineNum = 0;
    for (const line of projectLines) {
      lineNum++;
      const trimmed = line.trim();
      if (trimmed && !defaultSet.has(trimmed)) {
        added.push({ line: lineNum, content: trimmed });
      }
    }

    // Lines in default but not in project (removed)
    lineNum = 0;
    for (const line of defaultLines) {
      lineNum++;
      const trimmed = line.trim();
      if (trimmed && !projectSet.has(trimmed)) {
        removed.push({ line: lineNum, content: trimmed });
      }
    }

    // Detect section-level changes (lines starting with # that differ)
    const defaultSections = defaultLines.filter(l => l.trim().startsWith('#')).map(l => l.trim());
    const projectSections = projectLines.filter(l => l.trim().startsWith('#')).map(l => l.trim());

    for (const section of projectSections) {
      if (!defaultSections.includes(section)) {
        // Check if there is a similar section in default (same heading level, different text)
        const level = section.match(/^(#+)/)?.[1];
        const similar = defaultSections.find(s => s.startsWith(level + ' ') && !projectSections.includes(s));
        if (similar) {
          changed.push({ from: similar, to: section });
        }
      }
    }

    return { added, removed, changed, totalLines };
  }

  /**
   * Check if all diff aspects are empty (no changes detected)
   * @param {Object} fm - Frontmatter changes
   * @param {Object} vars - Variable changes
   * @param {Object} body - Body changes
   * @returns {boolean}
   * @private
   */
  _isIdentical(fm, vars, body) {
    return (
      fm.added.length === 0 &&
      fm.removed.length === 0 &&
      fm.changed.length === 0 &&
      vars.addedRequired.length === 0 &&
      vars.removedRequired.length === 0 &&
      vars.addedOptional.length === 0 &&
      vars.removedOptional.length === 0 &&
      body.added.length === 0 &&
      body.removed.length === 0 &&
      body.changed.length === 0
    );
  }

  /**
   * Build summary statistics from all prompt diffs
   * @param {Array} prompts - Array of per-type diff results
   * @returns {Object} Summary statistics
   * @private
   */
  _buildSummary(prompts) {
    return {
      total: prompts.length,
      overridden: prompts.filter(p => p.status !== STATUS.NO_OVERRIDE && p.status !== 'error').length,
      identical: prompts.filter(p => p.status === STATUS.IDENTICAL).length,
      modified: prompts.filter(p => p.status === STATUS.MODIFIED).length,
      versionMismatch: prompts.filter(p => p.status === STATUS.VERSION_MISMATCH).length,
      noOverride: prompts.filter(p => p.status === STATUS.NO_OVERRIDE).length,
      errors: prompts.filter(p => p.status === 'error').length
    };
  }

  // ---------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------

  /**
   * Format the complete diffAll result for terminal output
   * @param {Array} prompts - Array of per-type diff results
   * @param {Object} summary - Summary statistics
   * @returns {string} ANSI-formatted output
   * @private
   */
  _formatAll(prompts, summary) {
    const c = COLORS;
    const lines = [];

    lines.push(`${c.bold}Comparing .flow/templates/prompts/ vs Scholar v${SCHOLAR_VERSION} defaults:${c.reset}`);
    lines.push('');

    for (const prompt of prompts) {
      lines.push(prompt.formatted);
      lines.push('');
    }

    // Summary line
    lines.push(`${c.dim}---${c.reset}`);
    const parts = [];
    if (summary.overridden > 0) parts.push(`${c.cyan}${summary.overridden} overridden${c.reset}`);
    if (summary.identical > 0) parts.push(`${c.green}${summary.identical} identical${c.reset}`);
    if (summary.modified > 0) parts.push(`${c.yellow}${summary.modified} modified${c.reset}`);
    if (summary.versionMismatch > 0) parts.push(`${c.red}${summary.versionMismatch} version mismatch${c.reset}`);
    if (summary.noOverride > 0) parts.push(`${c.gray}${summary.noOverride} using defaults${c.reset}`);

    lines.push(`${c.bold}Summary:${c.reset} ${summary.total} prompt types: ${parts.join(', ')}`);

    return lines.join('\n');
  }

  /**
   * Format a single prompt type diff result
   * @param {Object} result - Single type diff result
   * @returns {string} ANSI-formatted output
   * @private
   */
  _formatType(result) {
    const c = COLORS;
    const lines = [];
    const { type, status, projectVersion, defaultVersion, frontmatterChanges, variableChanges, bodyChanges } = result;

    // Header
    const statusIcon = this._statusIcon(status);
    lines.push(`  ${c.bold}${type}.md:${c.reset} ${statusIcon}`);

    // Version info
    if (projectVersion) {
      lines.push(`    ${c.gray}Your version: based on Scholar v${projectVersion}${c.reset}`);
      lines.push(`    ${c.gray}Current default: v${defaultVersion}${c.reset}`);
      if (projectVersion !== defaultVersion) {
        lines.push(`    ${c.yellow}Version mismatch: your prompt is based on v${projectVersion}, current is v${defaultVersion}${c.reset}`);
      }
    } else if (status !== STATUS.NO_OVERRIDE && status !== STATUS.MISSING_DEFAULT) {
      lines.push(`    ${c.gray}Your version: no version tag${c.reset}`);
      lines.push(`    ${c.gray}Current default: v${defaultVersion}${c.reset}`);
    }

    // Frontmatter changes
    if (frontmatterChanges.added.length > 0 || frontmatterChanges.removed.length > 0 || frontmatterChanges.changed.length > 0) {
      lines.push(`    ${c.bold}Metadata changes:${c.reset}`);
      for (const item of frontmatterChanges.added) {
        lines.push(`      ${c.green}+ Added "${item.field}": ${JSON.stringify(item.value)}${c.reset}`);
      }
      for (const item of frontmatterChanges.removed) {
        lines.push(`      ${c.red}- Removed "${item.field}"${c.reset}`);
      }
      for (const item of frontmatterChanges.changed) {
        lines.push(`      ${c.yellow}~ Changed "${item.field}": ${JSON.stringify(item.defaultValue)} -> ${JSON.stringify(item.projectValue)}${c.reset}`);
      }
    }

    // Variable changes
    const hasVarChanges = variableChanges.addedRequired.length > 0 ||
      variableChanges.removedRequired.length > 0 ||
      variableChanges.addedOptional.length > 0 ||
      variableChanges.removedOptional.length > 0;

    if (hasVarChanges) {
      lines.push(`    ${c.bold}Variable changes:${c.reset}`);
      for (const v of variableChanges.addedRequired) {
        lines.push(`      ${c.green}+ New required variable: {{${v}}}${c.reset}`);
      }
      for (const v of variableChanges.removedRequired) {
        lines.push(`      ${c.red}- Removed required variable: {{${v}}}${c.reset}`);
      }
      for (const v of variableChanges.addedOptional) {
        lines.push(`      ${c.green}+ New optional variable: {{${v}}} (optional)${c.reset}`);
      }
      for (const v of variableChanges.removedOptional) {
        lines.push(`      ${c.red}- Removed optional variable: {{${v}}}${c.reset}`);
      }
    }

    // Body changes (summarized)
    if (bodyChanges.added.length > 0 || bodyChanges.removed.length > 0 || bodyChanges.changed.length > 0) {
      lines.push(`    ${c.bold}Body changes:${c.reset}`);

      // Show section-level changes first
      for (const ch of bodyChanges.changed) {
        lines.push(`      ${c.yellow}~ Section renamed: "${ch.from}" -> "${ch.to}"${c.reset}`);
      }

      // Show summary of line-level changes
      if (bodyChanges.added.length > 0) {
        const addedSample = bodyChanges.added.slice(0, 3);
        lines.push(`      ${c.green}+ ${bodyChanges.added.length} line(s) added${c.reset}`);
        for (const a of addedSample) {
          const preview = a.content.length > 60 ? a.content.substring(0, 60) + '...' : a.content;
          lines.push(`        ${c.dim}line ${a.line}: ${preview}${c.reset}`);
        }
        if (bodyChanges.added.length > 3) {
          lines.push(`        ${c.dim}... and ${bodyChanges.added.length - 3} more${c.reset}`);
        }
      }

      if (bodyChanges.removed.length > 0) {
        const removedSample = bodyChanges.removed.slice(0, 3);
        lines.push(`      ${c.red}- ${bodyChanges.removed.length} line(s) removed${c.reset}`);
        for (const r of removedSample) {
          const preview = r.content.length > 60 ? r.content.substring(0, 60) + '...' : r.content;
          lines.push(`        ${c.dim}line ${r.line}: ${preview}${c.reset}`);
        }
        if (bodyChanges.removed.length > 3) {
          lines.push(`        ${c.dim}... and ${bodyChanges.removed.length - 3} more${c.reset}`);
        }
      }
    }

    // Identical prompts
    if (status === STATUS.IDENTICAL) {
      lines.push(`    ${c.green}No changes detected${c.reset}`);
    }

    return lines.join('\n');
  }

  /**
   * Format output for a type with no project override
   * @param {string} type - Prompt type
   * @returns {string}
   * @private
   */
  _formatNoOverride(type) {
    const c = COLORS;
    return `  ${c.bold}${type}.md:${c.reset}\n    ${c.gray}No project override (using Scholar default)${c.reset}`;
  }

  /**
   * Format output for a type with no Scholar default
   * @param {string} type - Prompt type
   * @returns {string}
   * @private
   */
  _formatMissingDefault(type) {
    const c = COLORS;
    return `  ${c.bold}${type}.md:${c.reset}\n    ${c.cyan}Custom project prompt (no Scholar default exists)${c.reset}`;
  }

  /**
   * Get a status icon/label for a given diff status
   * @param {string} status - Diff status
   * @returns {string} ANSI-formatted status indicator
   * @private
   */
  _statusIcon(status) {
    const c = COLORS;
    switch (status) {
      case STATUS.IDENTICAL:
        return `${c.green}[identical]${c.reset}`;
      case STATUS.MODIFIED:
        return `${c.yellow}[modified]${c.reset}`;
      case STATUS.VERSION_MISMATCH:
        return `${c.red}[version mismatch]${c.reset}`;
      case STATUS.NO_OVERRIDE:
        return `${c.gray}[default]${c.reset}`;
      case STATUS.MISSING_DEFAULT:
        return `${c.cyan}[custom]${c.reset}`;
      default:
        return `${c.dim}[unknown]${c.reset}`;
    }
  }
}

export { STATUS, COLORS };
export default PromptDiffEngine;
