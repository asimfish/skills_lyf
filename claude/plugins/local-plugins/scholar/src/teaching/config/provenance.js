/**
 * Provenance Tracer for Scholar-generated files
 *
 * Reads Scholar Generation Metadata embedded as YAML comments in QMD
 * frontmatter, enriches with config layer information, computes a
 * reproducibility hash, and produces formatted output for the
 * `/teaching:config trace` subcommand.
 *
 * Provenance metadata is written by quarto-notes.js during generation
 * and follows this format inside frontmatter:
 *
 *   # --- Scholar Generation Metadata ---
 *   # generated: 2026-02-09T15:30:00Z
 *   # scholar_version: 2.7.0
 *   # prompt_template: lecture-notes.md (v2.0)
 *   # config_source: .flow/teach-config.yml
 *   # lesson_plan: .flow/lesson-plans.yml
 *   # teaching_style: .claude/teaching-style.local.md
 *   # generation_time: 42s
 *   # sections: 12
 *   # ---
 *
 * @module teaching/config/provenance
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, resolve } from 'path';
import { createHash } from 'crypto';

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
 * Layer names for config hierarchy
 */
const LAYER_NAMES = {
  1: 'Plugin defaults',
  2: 'Course style',
  3: 'Command overrides',
  4: 'Week lesson plan'
};

/**
 * Error thrown when provenance tracing fails
 */
export class ProvenanceError extends Error {
  /**
   * Create a ProvenanceError
   * @param {string} message - Error message
   * @param {Object} [options] - Error options
   * @param {string} [options.file] - File path involved
   */
  constructor(message, { file } = {}) {
    super(message);
    this.name = 'ProvenanceError';
    this.file = file || null;
  }
}

/**
 * ProvenanceTracer reads and enriches Scholar generation metadata
 * embedded in generated files.
 *
 * Usage:
 *   const tracer = new ProvenanceTracer({ cwd: '/path/to/project' });
 *   const result = await tracer.trace('lectures/week-04.qmd');
 *   console.log(result.formatted);
 */
export class ProvenanceTracer {
  /**
   * Create a ProvenanceTracer instance
   * @param {Object} [options] - Tracer options
   * @param {string} [options.cwd=process.cwd()] - Working directory for resolving relative paths
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor({ cwd, debug } = {}) {
    this.cwd = cwd || process.cwd();
    this.debug = debug || false;
  }

  /**
   * Log a debug message
   * @param {string} msg - Message to log
   * @private
   */
  _log(msg) {
    if (this.debug || process.env.SCHOLAR_DEBUG) {
      console.log(`[scholar:provenance] ${msg}`);
    }
  }

  /**
   * Trace provenance for a generated file
   *
   * Reads the file, extracts Scholar Generation Metadata from its
   * frontmatter, enriches with config layer info, computes a config
   * hash, and produces formatted output.
   *
   * @param {string} filePath - Path to the generated file (absolute or relative to cwd)
   * @returns {Promise<Object>} Trace result
   * @returns {string} result.file - Resolved absolute file path
   * @returns {string} result.fileName - Base file name
   * @returns {Object|null} result.provenance - Parsed provenance metadata, or null if not found
   * @returns {Object|null} result.prompt - Prompt template info { template, version }
   * @returns {Array} result.layers - Active config layers with descriptions
   * @returns {string|null} result.configHash - 7-char SHA-256 hash of provenance metadata
   * @returns {Object} result.variables - Key variables resolved from provenance
   * @returns {boolean} result.found - Whether provenance metadata was found
   * @returns {string} result.formatted - ANSI-formatted output string
   * @throws {ProvenanceError} If the file does not exist or cannot be read
   */
  async trace(filePath) {
    // Resolve the file path
    const resolvedPath = resolve(this.cwd, filePath);
    const fileName = basename(resolvedPath);

    // Path containment: ensure resolved path stays within cwd
    if (!resolvedPath.startsWith(resolve(this.cwd))) {
      throw new ProvenanceError('Path traversal detected', { file: filePath });
    }

    this._log(`Tracing provenance for: ${resolvedPath}`);

    // Check file existence
    if (!existsSync(resolvedPath)) {
      throw new ProvenanceError(
        `File not found: ${filePath}`,
        { file: resolvedPath }
      );
    }

    // Read file content
    let content;
    try {
      content = await readFile(resolvedPath, 'utf8');
    } catch (err) {
      throw new ProvenanceError(
        `Failed to read file: ${err.message}`,
        { file: resolvedPath }
      );
    }

    this._log(`File size: ${content.length} bytes`);

    // Extract provenance metadata
    const provenance = this._extractProvenance(content);

    if (!provenance) {
      this._log('No Scholar Generation Metadata found');
      return {
        file: resolvedPath,
        fileName,
        provenance: null,
        prompt: null,
        layers: [],
        configHash: null,
        variables: {},
        found: false,
        formatted: this._formatNotFound(fileName)
      };
    }

    this._log(`Found provenance with ${Object.keys(provenance).length} fields`);

    // Extract prompt info
    const prompt = this._extractPromptInfo(provenance);

    // Determine active config layers
    const layers = this._detectLayers(provenance);

    // Compute config hash
    const configHash = this._computeConfigHash(provenance);

    // Extract key variables
    const variables = this._extractVariables(provenance);

    // Build formatted output
    const formatted = this._format({
      fileName,
      provenance,
      prompt,
      layers,
      configHash,
      variables
    });

    return {
      file: resolvedPath,
      fileName,
      provenance,
      prompt,
      layers,
      configHash,
      variables,
      found: true,
      formatted
    };
  }

  /**
   * Extract Scholar Generation Metadata from file content
   *
   * Looks for YAML frontmatter (between --- delimiters), then finds
   * the `# --- Scholar Generation Metadata ---` block within it.
   *
   * @param {string} content - Full file content
   * @returns {Object|null} Parsed provenance key-value pairs, or null
   * @private
   */
  _extractProvenance(content) {
    // Find YAML frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;

    const frontmatter = fmMatch[1];
    const metaStart = frontmatter.indexOf('# --- Scholar Generation Metadata ---');
    if (metaStart === -1) return null;

    const metaEnd = frontmatter.indexOf('# ---', metaStart + 36);
    const block = frontmatter.slice(metaStart, metaEnd !== -1 ? metaEnd + 5 : undefined);

    const provenance = {};
    for (const line of block.split('\n')) {
      const match = line.match(/^#\s+(\w+):\s+(.+)$/);
      if (match) {
        provenance[match[1]] = match[2].trim();
      }
    }

    return Object.keys(provenance).length > 0 ? provenance : null;
  }

  /**
   * Extract prompt template info from provenance
   *
   * @param {Object} provenance - Parsed provenance metadata
   * @returns {Object|null} Prompt info { template, version } or null
   * @private
   */
  _extractPromptInfo(provenance) {
    if (!provenance.prompt_template) return null;

    const raw = provenance.prompt_template;
    // Parse format: "lecture-notes.md (v2.0)"
    const match = raw.match(/^(.+?)(?:\s*\(v?([\d.]+)\))?$/);
    if (!match) return { template: raw, version: null };

    return {
      template: match[1].trim(),
      version: match[2] || null
    };
  }

  /**
   * Detect which config layers were active based on provenance fields
   *
   * Layer 1 (Plugin defaults) is always present. Higher layers are
   * detected by the presence of specific provenance fields.
   *
   * @param {Object} provenance - Parsed provenance metadata
   * @returns {Array<Object>} Active layers with { layer, name, source, active }
   * @private
   */
  _detectLayers(provenance) {
    const layers = [];

    // Layer 1: Plugin defaults (always present)
    layers.push({
      layer: 1,
      name: LAYER_NAMES[1],
      source: null,
      active: true
    });

    // Layer 2: Course style — detected by config_source or teaching_style
    const hasLayer2 = !!(provenance.config_source || provenance.teaching_style);
    layers.push({
      layer: 2,
      name: LAYER_NAMES[2],
      source: provenance.config_source || provenance.teaching_style || null,
      active: hasLayer2
    });

    // Layer 3: Command overrides — detected by teaching_style with command hints
    // Note: provenance doesn't distinguish L2 vs L3 explicitly; we infer L3
    // is present when teaching_style is set (style files contain command_overrides)
    const hasLayer3 = !!provenance.teaching_style;
    layers.push({
      layer: 3,
      name: LAYER_NAMES[3],
      source: provenance.teaching_style || null,
      active: hasLayer3
    });

    // Layer 4: Week lesson plan — detected by lesson_plan field
    const hasLayer4 = !!provenance.lesson_plan;
    layers.push({
      layer: 4,
      name: LAYER_NAMES[4],
      source: provenance.lesson_plan || null,
      active: hasLayer4
    });

    return layers;
  }

  /**
   * Compute a reproducibility config hash from provenance metadata
   *
   * The hash captures the key configuration inputs that would be needed
   * to reproduce the generation. If two files were generated with the
   * same config hash, they used identical configuration.
   *
   * @param {Object} provenance - Parsed provenance metadata
   * @returns {string} 7-character hex SHA-256 substring
   * @private
   */
  _computeConfigHash(provenance) {
    const hashInput = JSON.stringify({
      scholar_version: provenance.scholar_version || null,
      prompt_template: provenance.prompt_template || null,
      config_source: provenance.config_source || null,
      lesson_plan: provenance.lesson_plan || null,
      teaching_style: provenance.teaching_style || null
    });

    return createHash('sha256')
      .update(hashInput)
      .digest('hex')
      .substring(0, 7);
  }

  /**
   * Extract key variables from provenance for display
   *
   * @param {Object} provenance - Parsed provenance metadata
   * @returns {Object} Key variables { field: { value, source } }
   * @private
   */
  _extractVariables(provenance) {
    const variables = {};

    // Directly available from provenance
    if (provenance.sections) {
      variables.sections = { value: provenance.sections, source: 'provenance' };
    }
    if (provenance.generation_time) {
      variables.generation_time = { value: provenance.generation_time, source: 'provenance' };
    }
    if (provenance.config_source) {
      variables.config_source = { value: provenance.config_source, source: 'Layer 2' };
    }
    if (provenance.teaching_style) {
      variables.teaching_style = { value: provenance.teaching_style, source: 'Layer 2/3' };
    }
    if (provenance.lesson_plan) {
      variables.lesson_plan = { value: provenance.lesson_plan, source: 'Layer 4' };
    }

    return variables;
  }

  /**
   * Format the trace result as an ANSI-colored string
   *
   * @param {Object} params - Format parameters
   * @param {string} params.fileName - Base file name
   * @param {Object} params.provenance - Parsed provenance metadata
   * @param {Object|null} params.prompt - Prompt template info
   * @param {Array} params.layers - Active config layers
   * @param {string} params.configHash - Config hash
   * @param {Object} params.variables - Extracted variables
   * @returns {string} Formatted output
   * @private
   */
  _format({ fileName, provenance, prompt, layers, configHash, variables }) {
    const c = COLORS;
    const lines = [];

    // Header
    lines.push(`${c.bold}=== Provenance: ${fileName} ===${c.reset}`);
    lines.push('');

    // Generation info
    if (provenance.generated) {
      lines.push(`${c.bold}Generated:${c.reset} ${provenance.generated}`);
    }
    if (provenance.scholar_version) {
      lines.push(`${c.bold}Scholar version:${c.reset} ${provenance.scholar_version}`);
    }

    // Prompt template
    if (prompt) {
      lines.push('');
      lines.push(`${c.bold}Prompt:${c.reset} ${prompt.template}`);
      if (prompt.version) {
        lines.push(`  Version: ${prompt.version}`);
      }
    }

    // Config layers
    lines.push('');
    lines.push(`${c.bold}Config layers applied:${c.reset}`);
    for (const layer of layers) {
      if (layer.active) {
        const source = layer.source ? ` (${layer.source})` : '';
        lines.push(`  ${c.cyan}Layer ${layer.layer}:${c.reset} ${layer.name}${source}`);
      } else {
        lines.push(`  ${c.dim}Layer ${layer.layer}: ${layer.name} (not active)${c.reset}`);
      }
    }

    // Config hash
    lines.push('');
    lines.push(`${c.bold}Config hash:${c.reset} ${c.green}${configHash}${c.reset}`);

    // Key variables
    const varKeys = Object.keys(variables);
    if (varKeys.length > 0) {
      lines.push('');
      lines.push(`${c.bold}Key variables resolved:${c.reset}`);
      for (const key of varKeys) {
        const v = variables[key];
        lines.push(`  ${key}: ${c.cyan}${v.value}${c.reset} ${c.dim}(${v.source})${c.reset}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format output when no provenance metadata is found
   *
   * @param {string} fileName - Base file name
   * @returns {string} Formatted message
   * @private
   */
  _formatNotFound(fileName) {
    const c = COLORS;
    const lines = [];
    lines.push(`${c.yellow}No Scholar generation metadata found in: ${fileName}${c.reset}`);
    lines.push(`This file may not have been generated by Scholar, or was generated before provenance tracking (v2.5.0+).`);
    return lines.join('\n');
  }
}

export default ProvenanceTracer;
