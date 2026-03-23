/**
 * Config Preflight Validator
 *
 * Performs pre-flight validation of all .flow/ configuration:
 * - teach-config.yml (syntax, schema, required fields)
 * - Lesson plans (content/lesson-plans/*.yml)
 * - Prompt templates (.flow/templates/prompts/*.md)
 * - Teaching styles (.claude/teaching-style.local.md)
 *
 * Returns a structured report with per-check status (PASS/WARN/FAIL)
 * and a human-readable formatted summary.
 *
 * @module teaching/config/config-preflight
 */

import { validateConfig, findConfigFile } from './loader.js';
import { findCourseRoot } from './style-loader.js';
import { PromptLoader } from '../ai/prompt-loader.js';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';

/**
 * Current Scholar version used for prompt version comparison
 * @type {string}
 */
const SCHOLAR_VERSION = '2.7.0';

/**
 * Status constants for validation checks
 * @enum {string}
 */
const Status = {
  PASS: 'PASS',
  WARN: 'WARN',
  FAIL: 'FAIL',
};

/**
 * Create a single check result entry
 * @param {string} name - Check name
 * @param {string} status - PASS, WARN, or FAIL
 * @param {string[]} messages - Descriptive messages for this check
 * @returns {{ name: string, status: string, messages: string[] }}
 */
function makeCheck(name, status, messages = []) {
  return { name, status, messages };
}

/**
 * ConfigPreflightValidator validates the entire .flow/ configuration
 * tree and produces a structured report.
 */
export class ConfigPreflightValidator {
  /**
   * Create a new ConfigPreflightValidator
   * @param {Object} options - Validator options
   * @param {string} [options.cwd=process.cwd()] - Working directory to search from
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {boolean} [options.strict=false] - Treat warnings as errors for exit-code logic
   */
  constructor({ cwd = process.cwd(), debug = false, strict = false } = {}) {
    this.cwd = cwd;
    this.debug = debug;
    this.strict = strict;
  }

  /**
   * Log a debug message if debug mode is enabled
   * @param {string} msg - Message to log
   * @private
   */
  _log(msg) {
    if (this.debug || process.env.SCHOLAR_DEBUG) {
      console.log(`[scholar:preflight] ${msg}`);
    }
  }

  /**
   * Run all preflight validation checks.
   *
   * Validates teach-config.yml, lesson plans, prompt templates, and
   * teaching style files. If no .flow/ directory exists, all checks
   * return PASS with "using defaults" messages.
   *
   * @returns {Promise<{
   *   errors: number,
   *   warnings: number,
   *   checks: Array<{ name: string, status: string, messages: string[] }>,
   *   formatted: string
   * }>} Validation report
   */
  async validate() {
    const checks = [];

    // Determine if .flow/ exists at all
    const courseRoot = findCourseRoot(this.cwd);
    const flowDir = courseRoot ? join(courseRoot, '.flow') : null;
    const hasFlowDir = flowDir && existsSync(flowDir);

    this._log(`Course root: ${courseRoot || '(none)'}`);
    this._log(`.flow/ exists: ${hasFlowDir}`);

    if (!hasFlowDir) {
      // No .flow/ directory: everything uses defaults, all PASS
      checks.push(makeCheck('teach-config.yml', Status.PASS, ['Using defaults (no .flow/ directory)']));
      checks.push(makeCheck('lesson-plans', Status.PASS, ['Using defaults (no .flow/ directory)']));
      checks.push(makeCheck('prompts', Status.PASS, ['Using defaults (no .flow/ directory)']));
      checks.push(makeCheck('Teaching Style (global)', Status.PASS, ['Using defaults (no .flow/ directory)']));

      return this._buildResult(checks);
    }

    // 1. Validate teach-config.yml
    checks.push(this._validateTeachConfig(courseRoot));

    // 2. Validate lesson plans
    checks.push(...this._validateLessonPlans(courseRoot));

    // 3. Validate prompt templates
    checks.push(...await this._validatePrompts(courseRoot));

    // 4. Validate teaching styles
    checks.push(...this._validateTeachingStyles(courseRoot));

    return this._buildResult(checks);
  }

  /**
   * Validate teach-config.yml existence, syntax, and schema
   * @param {string} courseRoot - Course root directory
   * @returns {{ name: string, status: string, messages: string[] }}
   * @private
   */
  _validateTeachConfig(courseRoot) {
    const configPath = findConfigFile(courseRoot);

    if (!configPath) {
      return makeCheck('teach-config.yml', Status.PASS, ['Not found, using defaults']);
    }

    this._log(`Validating teach-config: ${configPath}`);
    const messages = [];

    // Check YAML syntax
    let parsed;
    try {
      const raw = readFileSync(configPath, 'utf8');
      parsed = yaml.load(raw);
    } catch (err) {
      return makeCheck('teach-config.yml', Status.FAIL, [
        `YAML syntax error: ${err.message}`,
      ]);
    }

    if (!parsed || typeof parsed !== 'object') {
      return makeCheck('teach-config.yml', Status.FAIL, [
        'File is empty or not a valid YAML object',
      ]);
    }

    // Validate structure via loader's validateConfig
    const validation = validateConfig(parsed);

    if (!validation.isValid) {
      return makeCheck('teach-config.yml', Status.FAIL, [
        'Schema: invalid',
        ...validation.errors,
      ]);
    }

    messages.push('Schema: valid');

    // Check required fields
    const missingRequired = [];
    if (!parsed.scholar) {
      missingRequired.push('scholar');
    } else {
      if (!parsed.scholar.course_info) missingRequired.push('scholar.course_info');
      if (!parsed.scholar.defaults) missingRequired.push('scholar.defaults');
    }

    if (missingRequired.length > 0) {
      messages.push(`Required fields: missing ${missingRequired.join(', ')}`);
      return makeCheck('teach-config.yml', Status.WARN, messages);
    }

    messages.push('Required fields: all present');
    return makeCheck('teach-config.yml', Status.PASS, messages);
  }

  /**
   * Validate lesson plan YAML files under content/lesson-plans/
   * @param {string} courseRoot - Course root directory
   * @returns {Array<{ name: string, status: string, messages: string[] }>}
   * @private
   */
  _validateLessonPlans(courseRoot) {
    const lessonPlansDir = join(courseRoot, 'content', 'lesson-plans');

    if (!existsSync(lessonPlansDir)) {
      return [makeCheck('lesson-plans', Status.PASS, ['No lesson-plans directory found, using defaults'])];
    }

    // Find all .yml files recursively
    let ymlFiles;
    try {
      ymlFiles = glob.sync('**/*.yml', { cwd: lessonPlansDir, absolute: true });
    } catch (err) {
      this._log(`Failed to scan lesson plans directory: ${err.message}`);
      return [makeCheck('lesson-plans', Status.WARN, [
        `Failed to scan lesson plans directory: ${err.message}`
      ])];
    }

    if (ymlFiles.length === 0) {
      return [makeCheck('lesson-plans', Status.PASS, ['No lesson plan files found'])];
    }

    const messages = [];
    let status = Status.PASS;
    let weekCount = 0;
    let weeksWithObjectives = 0;

    for (const filePath of ymlFiles) {
      const relPath = relative(courseRoot, filePath);
      this._log(`Validating lesson plan: ${relPath}`);

      try {
        const raw = readFileSync(filePath, 'utf8');
        const data = yaml.load(raw);

        if (!data || typeof data !== 'object') {
          messages.push(`${relPath}: empty or invalid YAML`);
          status = Status.FAIL;
          continue;
        }

        weekCount++;

        // Check for learning objectives
        if (data.learning_objectives && data.learning_objectives.length > 0) {
          weeksWithObjectives++;
        } else {
          messages.push(`${relPath}: no learning objectives defined`);
          if (status !== Status.FAIL) status = Status.WARN;
        }
      } catch (err) {
        messages.push(`${relPath}: YAML syntax error - ${err.message}`);
        status = Status.FAIL;
      }
    }

    // Summary messages at the top
    const summary = [`Weeks: ${weekCount} defined`];
    if (weekCount > 0 && weeksWithObjectives === weekCount) {
      summary.push('Objectives: all weeks have >= 1');
    } else if (weekCount > 0) {
      summary.push(`Objectives: ${weeksWithObjectives}/${weekCount} weeks have >= 1`);
    }

    return [makeCheck('lesson-plans', status, [...summary, ...messages])];
  }

  /**
   * Validate prompt template files under .flow/templates/prompts/
   * @param {string} courseRoot - Course root directory
   * @returns {Promise<Array<{ name: string, status: string, messages: string[] }>>}
   * @private
   */
  async _validatePrompts(courseRoot) {
    const promptsDir = join(courseRoot, '.flow', 'templates', 'prompts');
    const allTypes = PromptLoader.listTypes();

    if (!existsSync(promptsDir)) {
      // No custom prompts: all using defaults
      return allTypes.map((type) =>
        makeCheck(`prompts/${type}.md`, Status.PASS, ['Using default prompt'])
      );
    }

    // Discover files in the prompts directory
    let promptFiles;
    try {
      promptFiles = readdirSync(promptsDir).filter((f) => f.endsWith('.md'));
    } catch (err) {
      this._log(`Failed to read prompts directory: ${err.message}`);
      return allTypes.map((type) =>
        makeCheck(`prompts/${type}.md`, Status.WARN, [
          `Failed to read prompts directory: ${err.message}`
        ])
      );
    }

    const checks = [];
    const foundTypes = new Set();

    for (const file of promptFiles) {
      const filePath = join(promptsDir, file);
      const type = file.replace(/\.md$/, '');
      foundTypes.add(type);

      this._log(`Validating prompt: ${file}`);

      try {
        const content = readFileSync(filePath, 'utf8');
        const parsed = PromptLoader.parsePrompt(content);
        const messages = [];
        let status = Status.PASS;

        // Validate metadata
        const validation = PromptLoader.validateMetadata(parsed.metadata);

        if (!validation.valid) {
          status = Status.FAIL;
          messages.push(...validation.errors);
        }

        if (validation.warnings.length > 0) {
          if (status !== Status.FAIL) status = Status.WARN;
          messages.push(...validation.warnings);
        }

        // Check based_on_scholar_version / min_scholar_version for freshness
        const versionField =
          parsed.metadata.based_on_scholar_version ||
          parsed.metadata.min_scholar_version;

        if (versionField) {
          const versionCheck = this._checkPromptVersion(versionField, SCHOLAR_VERSION);
          if (versionCheck.severity === 'warning') {
            if (status !== Status.FAIL) status = Status.WARN;
            messages.push(versionCheck.message);
          } else if (versionCheck.severity === 'error') {
            status = Status.FAIL;
            messages.push(versionCheck.message);
          }
        }

        // Check prompt_version against Scholar version
        if (parsed.metadata.prompt_version) {
          const versionCompat = PromptLoader.checkVersion(
            parsed.metadata.prompt_version,
            SCHOLAR_VERSION
          );
          if (versionCompat.severity === 'warning') {
            if (status !== Status.FAIL) status = Status.WARN;
            messages.push(versionCompat.message);
            if (versionCompat.suggestion) {
              messages.push(versionCompat.suggestion);
            }
          } else if (versionCompat.severity === 'error') {
            status = Status.FAIL;
            messages.push(versionCompat.message);
          }
        }

        // Check for missing optional variables compared to default prompt
        const missingVars = await this._checkMissingVariables(type, parsed.metadata);
        if (missingVars.length > 0) {
          if (status !== Status.FAIL) status = Status.WARN;
          messages.push(`Missing optional variable${missingVars.length > 1 ? 's' : ''}: ${missingVars.join(', ')}`);
        }

        if (messages.length === 0) {
          messages.push('Valid');
        }

        checks.push(makeCheck(`prompts/${file}`, status, messages));
      } catch (err) {
        checks.push(makeCheck(`prompts/${file}`, Status.FAIL, [
          `Parse error: ${err.message}`,
        ]));
      }
    }

    // Report types not overridden (using defaults)
    for (const type of allTypes) {
      if (!foundTypes.has(type)) {
        checks.push(makeCheck(`prompts/${type}.md`, Status.PASS, ['Using default prompt']));
      }
    }

    return checks;
  }

  /**
   * Compare a prompt's scholar version against the running version
   * @param {string} promptVersion - Version string from the prompt (e.g., "2.6.0")
   * @param {string} currentVersion - Current Scholar version
   * @returns {{ severity: string, message: string }}
   * @private
   */
  _checkPromptVersion(promptVersion, currentVersion) {
    const [pMajor, pMinor = 0] = promptVersion.split('.').map(Number);
    const [cMajor, cMinor = 0] = currentVersion.split('.').map(Number);

    if (pMajor > cMajor) {
      return {
        severity: 'error',
        message: `Prompt requires Scholar v${pMajor}.x, current: v${currentVersion}`,
      };
    }

    if (pMajor < cMajor || pMinor < cMinor) {
      return {
        severity: 'warning',
        message: `Based on Scholar v${promptVersion} (current: v${currentVersion})`,
      };
    }

    return { severity: 'none', message: '' };
  }

  /**
   * Check for optional variables present in the default prompt but missing
   * from a project-level prompt's metadata.
   * @param {string} type - Prompt type (e.g., "lecture-notes")
   * @param {Object} metadata - Project prompt metadata
   * @returns {Promise<string[]>} List of missing optional variable names
   * @private
   */
  async _checkMissingVariables(type, metadata) {
    if (!PromptLoader.isValidType(type)) {
      return [];
    }

    try {
      const defaultPrompt = await PromptLoader.loadDefault(type, { debug: false });
      const defaultOptional = defaultPrompt.metadata?.variables?.optional || [];
      const userOptional = metadata?.variables?.optional || [];

      const userSet = new Set(userOptional);
      return defaultOptional.filter((v) => !userSet.has(v));
    } catch (err) {
      this._log(`Failed to load default prompt for ${type}: ${err.message}`);
      // Default prompt may not exist for this type — not actionable for the user
      return [];
    }
  }

  /**
   * Validate teaching style files (global and course-level)
   * @param {string} courseRoot - Course root directory
   * @returns {Array<{ name: string, status: string, messages: string[] }>}
   * @private
   */
  _validateTeachingStyles(courseRoot) {
    const checks = [];

    // Global style: ~/.claude/teaching-style.local.md (or CLAUDE.md)
    const globalClaudeMd = join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.claude',
      'CLAUDE.md'
    );

    if (existsSync(globalClaudeMd)) {
      const check = this._validateSingleStyleFile(globalClaudeMd, 'Teaching Style (global)');
      checks.push(check);
    } else {
      checks.push(makeCheck('Teaching Style (global)', Status.PASS, ['Not found, using defaults']));
    }

    // Course style: .claude/teaching-style.local.md
    const courseStylePath = join(courseRoot, '.claude', 'teaching-style.local.md');

    if (existsSync(courseStylePath)) {
      const check = this._validateSingleStyleFile(courseStylePath, 'Teaching Style (course)');
      checks.push(check);
    } else {
      checks.push(makeCheck('Teaching Style (course)', Status.PASS, ['Not found, using defaults']));
    }

    return checks;
  }

  /**
   * Validate a single teaching-style markdown file
   * @param {string} filePath - Path to the markdown file
   * @param {string} label - Display label for the check
   * @returns {{ name: string, status: string, messages: string[] }}
   * @private
   */
  _validateSingleStyleFile(filePath, label) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const messages = [];

      // Check for YAML frontmatter
      const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
      const match = content.match(frontmatterRegex);

      if (!match) {
        return makeCheck(label, Status.PASS, ['No YAML frontmatter (no teaching_style defined)']);
      }

      // Parse the frontmatter
      let frontmatter;
      try {
        frontmatter = yaml.load(match[1]);
      } catch (err) {
        return makeCheck(label, Status.FAIL, [`Invalid YAML frontmatter: ${err.message}`]);
      }

      if (!frontmatter || !frontmatter.teaching_style) {
        return makeCheck(label, Status.PASS, ['Frontmatter present but no teaching_style key']);
      }

      messages.push('Has teaching_style configuration');

      // Basic structural validation
      const style = frontmatter.teaching_style;
      if (typeof style !== 'object') {
        return makeCheck(label, Status.FAIL, ['teaching_style must be an object']);
      }

      const knownKeys = [
        'pedagogical_approach',
        'explanation_style',
        'assessment_philosophy',
        'student_interaction',
        'content_preferences',
        'command_overrides',
      ];

      const unknownKeys = Object.keys(style).filter((k) => !knownKeys.includes(k));
      if (unknownKeys.length > 0) {
        messages.push(`Unknown keys: ${unknownKeys.join(', ')}`);
        return makeCheck(label, Status.WARN, messages);
      }

      return makeCheck(label, Status.PASS, messages);
    } catch (err) {
      return makeCheck(label, Status.FAIL, [`Read error: ${err.message}`]);
    }
  }

  /**
   * Build the final validation result from individual checks
   * @param {Array<{ name: string, status: string, messages: string[] }>} checks - All check results
   * @returns {{ errors: number, warnings: number, checks: Array, formatted: string }}
   * @private
   */
  _buildResult(checks) {
    let errors = 0;
    let warnings = 0;

    for (const check of checks) {
      if (check.status === Status.FAIL) errors++;
      if (check.status === Status.WARN) warnings++;
    }

    return {
      errors,
      warnings,
      checks,
      formatted: this._format(checks, errors, warnings),
    };
  }

  /**
   * Produce a human-readable formatted report string
   * @param {Array<{ name: string, status: string, messages: string[] }>} checks - All checks
   * @param {number} errors - Total error count
   * @param {number} warnings - Total warning count
   * @returns {string}
   * @private
   */
  _format(checks, errors, warnings) {
    const lines = ['=== Config Validation ===', ''];

    // Group checks by category
    const teachConfig = checks.filter((c) => c.name === 'teach-config.yml');
    const lessonPlans = checks.filter((c) => c.name === 'lesson-plans');
    const prompts = checks.filter((c) => c.name.startsWith('prompts/'));
    const styles = checks.filter((c) => c.name.startsWith('Teaching Style'));

    // teach-config.yml
    for (const check of teachConfig) {
      lines.push(this._formatCheckLine(check));
      for (const msg of check.messages) {
        lines.push(`  ${msg}`);
      }
      lines.push('');
    }

    // Lesson plans
    for (const check of lessonPlans) {
      lines.push(this._formatCheckLine(check));
      for (const msg of check.messages) {
        lines.push(`  ${msg}`);
      }
      lines.push('');
    }

    // Prompts
    if (prompts.length > 0) {
      lines.push('Prompts:');
      for (const check of prompts) {
        const shortName = check.name.replace('prompts/', '  ');
        lines.push(this._formatCheckLine({ ...check, name: shortName }));
        for (const msg of check.messages) {
          lines.push(`    ${msg}`);
        }
      }
      lines.push('');
    }

    // Teaching styles
    if (styles.length > 0) {
      lines.push('Teaching Style:');
      for (const check of styles) {
        const shortName = check.name.replace('Teaching Style ', '  ');
        lines.push(this._formatCheckLine({ ...check, name: shortName }));
        for (const msg of check.messages) {
          lines.push(`    ${msg}`);
        }
      }
      lines.push('');
    }

    // Overall
    const issueCount = errors + warnings;
    if (issueCount === 0) {
      lines.push('Overall: PASS');
    } else if (errors > 0) {
      lines.push(`Overall: FAIL (${issueCount} issue${issueCount !== 1 ? 's' : ''})`);
    } else {
      lines.push(`Overall: WARN (${issueCount} issue${issueCount !== 1 ? 's' : ''})`);
    }

    // Actionable suggestion for warnings
    if (warnings > 0 && errors === 0) {
      const promptWarns = prompts.filter((c) => c.status === Status.WARN);
      if (promptWarns.length > 0) {
        const firstType = promptWarns[0].name.replace('prompts/', '').replace('.md', '');
        lines.push(`  -> Run /teaching:config diff ${firstType} to review prompt changes`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format a single check as a dotted-leader line
   * @param {{ name: string, status: string }} check - Check to format
   * @returns {string}
   * @private
   */
  _formatCheckLine(check) {
    const maxWidth = 50;
    const name = check.name;
    const tag =
      check.status === Status.PASS
        ? check.messages.some((m) => m.includes('Using default'))
          ? `${Status.PASS} (using default)`
          : Status.PASS
        : check.status;

    const dots = '.'.repeat(Math.max(2, maxWidth - name.length - tag.length));
    return `${name} ${dots} ${tag}`;
  }
}

export default ConfigPreflightValidator;
