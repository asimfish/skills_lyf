/**
 * Canvas QTI Formatter
 *
 * Formats exam content as Canvas LMS QTI package using examark.
 * Converts JSON → Examark Markdown → QTI .zip file.
 *
 * Security: Uses execFile (not exec) to prevent command injection.
 */

import { ExamarkFormatter } from './examark.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdtempSync, rmSync, existsSync } from 'fs';
import { join, isAbsolute, resolve, dirname } from 'path';
import { tmpdir } from 'os';

const execFileAsync = promisify(execFile);

export class CanvasFormatter extends ExamarkFormatter {
  /**
   * Format exam to Canvas QTI package
   * @param {Object} content - Exam content (JSON)
   * @param {Object} options - Format options
   * @param {string} options.output - Output path for QTI file
   * @param {boolean} options.validate - Run examark validation (default: true)
   * @param {boolean} options.cleanupTemp - Remove temp files (default: true)
   * @param {string|null} options.sourceDir - Source directory for resolving relative image paths (must be absolute)
   * @returns {Promise<string>} Path to generated QTI .zip file
   */
  async format(content, options = {}) {
    const {
      output,
      validate = true,
      cleanupTemp = true,
      sourceDir = null
    } = options;

    // Validate sourceDir if provided
    if (sourceDir) {
      const resolved = resolve(sourceDir);
      if (!isAbsolute(resolved) || !existsSync(resolved)) {
        throw new Error(`sourceDir must be a valid absolute path: ${sourceDir}`);
      }
    }

    // Check examark availability
    await this.checkExamarkInstalled();

    // Generate examark markdown using parent formatter
    const markdown = super.format(content, {
      includeFrontmatter: false,  // examark doesn't require frontmatter
      includeAnswers: true
    });

    // Surface warnings from ExamarkFormatter (e.g., Upload→Essay mapping)
    if (this.warnings.length > 0) {
      for (const w of this.warnings) {
        console.warn(`[scholar:canvas] ${w.message}`);
      }
    }

    // Create temp directory
    const tempDir = mkdtempSync(join(tmpdir(), 'scholar-exam-'));
    const mdPath = join(tempDir, 'exam.md');

    // Determine output path
    const qtiPath = output || join(tempDir, 'exam.qti.zip');

    try {
      // Write markdown to temp file
      writeFileSync(mdPath, markdown, 'utf-8');

      // Run examark conversion (sourceDir enables image bundling)
      await this.runExamark(mdPath, qtiPath, validate, sourceDir);

      // Verify output exists
      if (!existsSync(qtiPath)) {
        throw new Error('examark failed to generate QTI file');
      }

      return qtiPath;
    } finally {
      // Cleanup temp directory if requested
      if (cleanupTemp && tempDir !== resolve(dirname(qtiPath))) {
        try {
          rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.warn(`Failed to clean up temp directory: ${err.message}`);
        }
      }
    }
  }

  /**
   * Check if examark is installed
   * @private
   * @throws {Error} If examark is not found
   */
  async checkExamarkInstalled() {
    try {
      await execFileAsync('which', ['examark']);
    } catch (_error) {
      throw new Error(
        'examark not installed. Install with: npm install -g examark',
        { cause: _error }
      );
    }
  }

  /**
   * Run examark to convert markdown to QTI
   * @private
   * @param {string} mdPath - Input markdown file path
   * @param {string} qtiPath - Output QTI file path
   * @param {boolean} validate - Run validation
   */
  async runExamark(mdPath, qtiPath, validate, sourceDir = null) {
    const args = [mdPath, '-o', qtiPath];

    if (validate) {
      args.push('--validate');
    }

    // Set CWD to sourceDir so examark can resolve relative image paths
    const execOpts = {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    };
    if (sourceDir) {
      execOpts.cwd = sourceDir;
    }

    // Use execFile (safe from command injection)
    try {
      const { stdout, stderr } = await execFileAsync('examark', args, execOpts);

      if (this.options.debug) {
        if (stdout) console.log('examark output:', stdout);
        if (stderr) console.error('examark errors:', stderr);
      }
    } catch (error) {
      // examark may write to stderr even on success
      // Only fail if exit code is non-zero
      if (error.code !== 0) {
        throw new Error(`examark conversion failed: ${error.message}\n${error.stderr || ''}`, { cause: error });
      }
    }
  }

  /**
   * Validate QTI package using examark verify.
   * Tolerates "No correct answer defined" warnings from open-ended
   * questions (Essay, Short, Numeric) — these are expected, not errors.
   *
   * @param {string} qtiPath - Path to QTI .zip file
   * @returns {Promise<Object>} Validation result {valid, errors, warnings, output}
   */
  async validateQTI(qtiPath) {
    try {
      const { stdout } = await execFileAsync('examark', ['verify', qtiPath]);

      return {
        valid: true,
        errors: [],
        warnings: [],
        output: stdout
      };
    } catch (error) {
      const stderr = error.stderr || '';
      const stdout = error.stdout || '';
      const { errors, warnings } = this._parseExamarkWarnings(stderr);

      // If no real errors, treat as valid (warnings alone are acceptable)
      const valid = errors.length === 0;

      return {
        valid,
        errors: errors.length > 0 ? errors : (valid ? [] : [error.message]),
        warnings,
        output: stdout + stderr
      };
    }
  }

  /**
   * Parse examark verify stderr into warnings vs real errors.
   * Lines starting with '-' that contain "No correct answer defined"
   * are expected warnings for open-ended questions.
   *
   * @private
   * @param {string} stderr - stderr from examark verify
   * @returns {{ errors: string[], warnings: string[] }}
   */
  _parseExamarkWarnings(stderr) {
    const errors = [];
    const warnings = [];

    const lines = stderr.split('\n').filter(l => l.trim().startsWith('-'));
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('No correct answer defined')) {
        warnings.push(trimmed);
      } else {
        errors.push(trimmed);
      }
    }

    return { errors, warnings };
  }

  /**
   * Emulate Canvas LMS import
   * @param {string} qtiPath - Path to QTI .zip file
   * @returns {Promise<Object>} Import simulation result
   */
  async emulateCanvasImport(qtiPath) {
    try {
      const { stdout } = await execFileAsync('examark', [
        'emulate-canvas',
        qtiPath
      ]);

      return {
        success: true,
        output: stdout
      };
    } catch (error) {
      return {
        success: false,
        output: error.stderr || error.stdout,
        error: error.message
      };
    }
  }

  /**
   * Get file extension
   * @returns {string} '.qti.zip'
   */
  getFileExtension() {
    return '.qti.zip';
  }

  /**
   * Validate Canvas formatter output
   * @param {string} output - Path to QTI file
   * @returns {Promise<Object>} Validation result
   */
  async validate(output) {
    // Check if file exists
    if (!existsSync(output)) {
      return {
        valid: false,
        errors: ['QTI file does not exist']
      };
    }

    // Run examark verification
    return await this.validateQTI(output);
  }
}
