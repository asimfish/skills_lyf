/**
 * Batch Migration Engine for Schema v1 → v2
 *
 * Handles multi-file schema migration with git integration, rollback, and dry-run preview.
 * Extends AutoFixer for batch operations with atomic semantics.
 */

import { readFileSync, writeFileSync } from 'fs';
import { relative } from 'path';
import { glob } from 'glob';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import { AutoFixer } from './auto-fixer.js';
import {
  migrationRules,
  getMigrationComplexity,
  getComplexityDescription,
} from './migration-rules.js';
import { execFileNoThrow } from '../../utils/execFileNoThrow.js';

/**
 * Default glob patterns for finding YAML config files
 */
const DEFAULT_PATTERNS = [
  'content/lesson-plans/**/*.yml',
  'content/lesson-plans/**/*.yaml',
  '.claude/**/*.yml',
  '.claude/**/*.yaml',
  '.flow/**/*.yml',
  '.flow/**/*.yaml',
];

/**
 * BatchMigrator - Manages migration of multiple YAML files from v1 to v2 schema
 */
export class BatchMigrator {
  /**
   * Create a new BatchMigrator instance
   *
   * @param {Object} options - Configuration options
   * @param {string} options.rootDir - Root directory for file discovery
   * @param {Array<string>} [options.patterns] - Custom glob patterns
   * @param {boolean} [options.debug] - Enable debug logging
   */
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.patterns = options.patterns || DEFAULT_PATTERNS;
    this.debug = options.debug || false;
    this.autoFixer = new AutoFixer();

    this.log(`BatchMigrator initialized at ${this.rootDir}`);
  }

  /**
   * Log debug messages
   * @private
   */
  log(message) {
    if (this.debug) {
      console.log(`[BatchMigrator] ${message}`);
    }
  }

  /**
   * Detect v1 schema files in the project
   *
   * @param {Object} options - Detection options
   * @param {Array<string>} [options.patterns] - Custom glob patterns
   * @returns {Promise<Array<Object>>} Array of v1 files with metadata
   *
   * Each result object contains:
   * - path: Absolute file path
   * - relativePath: Path relative to rootDir
   * - complexity: Complexity score (0-10)
   * - complexityDesc: Human-readable complexity description
   * - preview: Array of top 3 deprecated fields
   * - schema_version: Current schema version (undefined or "1.0")
   */
  async detectV1Schemas(options = {}) {
    const patterns = options.patterns || this.patterns;
    const v1Files = [];

    this.log(`Detecting v1 schemas with patterns: ${patterns.join(', ')}`);

    // Find all YAML files matching patterns
    const files = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: this.rootDir,
        absolute: true,
        nodir: true,
      });
      files.push(...matches);
    }

    this.log(`Found ${files.length} YAML files to check`);

    // Check each file for v1 schema
    for (const filePath of files) {
      try {
        const content = readFileSync(filePath, 'utf8');
        const data = yamlLoad(content);

        // Skip if not an object
        if (!data || typeof data !== 'object') {
          this.log(`Skipping ${filePath}: not an object`);
          continue;
        }

        // Check if v1 schema (no schema_version or schema_version === "1.0")
        const schemaVersion = data.schema_version;
        const isV1 = !schemaVersion || schemaVersion === '1.0';

        if (!isV1) {
          this.log(`Skipping ${filePath}: already v${schemaVersion}`);
          continue;
        }

        // Calculate complexity
        const complexity = getMigrationComplexity(data);
        const complexityDesc = getComplexityDescription(complexity);

        // Get preview of deprecated fields (top 3)
        const deprecatedFields = this.findDeprecatedFields(data);
        const preview = deprecatedFields.slice(0, 3).map((field) => ({
          oldPath: field.oldPath,
          newPath: field.newPath,
          value: this.formatValue(field.value),
        }));

        v1Files.push({
          path: filePath,
          relativePath: relative(this.rootDir, filePath),
          complexity,
          complexityDesc,
          preview,
          schema_version: schemaVersion || 'undefined',
        });

        this.log(
          `Found v1 file: ${relative(this.rootDir, filePath)} (complexity: ${complexity})`
        );
      } catch (error) {
        this.log(`Error processing ${filePath}: ${error.message}`);
        // Skip files with parse errors - they'll be handled by validate command
      }
    }

    this.log(`Detected ${v1Files.length} v1 schema files`);
    return v1Files;
  }

  /**
   * Find deprecated fields in data using migration rules
   * @private
   *
   * @param {Object} data - Parsed YAML data
   * @returns {Array<Object>} Array of deprecated field info
   */
  findDeprecatedFields(data) {
    const deprecated = [];

    if (!data || typeof data !== 'object') {
      return deprecated;
    }

    // Check for field renames
    for (const [oldField, newField] of Object.entries(
      migrationRules.fieldRenames
    )) {
      if (oldField in data) {
        deprecated.push({
          oldPath: oldField,
          newPath: newField,
          value: data[oldField],
        });
      }
    }

    // Check for missing required fields
    if (!data.schema_version) {
      deprecated.push({
        oldPath: '(missing)',
        newPath: 'schema_version',
        value: '"2.0"',
      });
    }

    return deprecated;
  }

  /**
   * Format value for display (truncate if too long)
   * @private
   *
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    let str;
    if (typeof value === 'object') {
      str = JSON.stringify(value);
    } else if (typeof value === 'string') {
      str = `"${value}"`;
    } else {
      str = String(value);
    }

    // Truncate long values
    const maxLen = 50;
    if (str.length > maxLen) {
      return str.substring(0, maxLen - 3) + '...';
    }

    return str;
  }

  /**
   * Preview migration changes for v1 files (dry-run mode)
   *
   * @param {Array<Object>} files - Array of file metadata from detectV1Schemas
   * @param {Object} options - Preview options
   * @param {boolean} [options.color=true] - Enable colored output
   * @returns {Promise<Array<Object>>} Array of preview results
   *
   * Each result object contains:
   * - file: File path
   * - relativePath: Path relative to rootDir
   * - changes: Number of changes needed
   * - fixes: Array of fix descriptions
   * - preview: Human-readable preview text
   */
  async previewMigration(files, options = {}) {
    const { color = true } = options;
    const previews = [];

    const c = color
      ? {
          reset: '\x1b[0m',
          red: '\x1b[31m',
          green: '\x1b[32m',
          yellow: '\x1b[33m',
          cyan: '\x1b[36m',
          gray: '\x1b[90m',
        }
      : { reset: '', red: '', green: '', yellow: '', cyan: '', gray: '' };

    this.log(`Previewing migration for ${files.length} files`);

    for (const fileInfo of files) {
      try {
        const { path: filePath, relativePath } = fileInfo;

        // Load file
        const content = readFileSync(filePath, 'utf8');
        const data = yamlLoad(content);

        if (!data || typeof data !== 'object') {
          this.log(`Skipping ${relativePath}: not an object`);
          continue;
        }

        // Get fixes from AutoFixer
        const fixes = this.autoFixer.fixDeprecatedFields(data);

        // Count changes
        const changes = fixes.length + (data.schema_version ? 0 : 1); // +1 for schema_version if missing

        // Build preview text
        const previewLines = [];
        previewLines.push(`${c.cyan}${relativePath}${c.reset}`);
        previewLines.push(
          `  ${c.gray}Changes: ${changes}${c.reset}`
        );

        // Show fixes
        for (const fix of fixes.slice(0, 5)) {
          // Limit to 5 for readability
          previewLines.push(
            `    ${c.yellow}~${c.reset} ${fix.description}`
          );
        }

        if (fixes.length > 5) {
          previewLines.push(
            `    ${c.gray}... and ${fixes.length - 5} more changes${c.reset}`
          );
        }

        // Add schema_version if missing
        if (!data.schema_version) {
          previewLines.push(
            `    ${c.yellow}~${c.reset} Add 'schema_version: "2.0"'`
          );
        }

        previews.push({
          file: filePath,
          relativePath,
          changes,
          fixes: fixes.map((f) => f.description),
          preview: previewLines.join('\n'),
        });

        this.log(`Preview generated for ${relativePath}: ${changes} changes`);
      } catch (error) {
        this.log(`Error previewing ${fileInfo.relativePath}: ${error.message}`);
        // Skip files with errors
      }
    }

    return previews;
  }

  /**
   * Migrate a single YAML file from v1 to v2 schema
   * @private
   *
   * @param {string} filePath - Absolute path to file
   * @returns {Promise<Object>} Migration result
   *
   * Result contains:
   * - success: boolean
   * - file: File path
   * - fixesApplied: Number of fixes applied
   * - fixes: Array of fix descriptions
   * - error: Error message (if failed)
   */
  async migrateFile(filePath) {
    try {
      this.log(`Migrating ${filePath}`);

      // Load YAML
      const content = readFileSync(filePath, 'utf8');
      const data = yamlLoad(content);

      if (!data || typeof data !== 'object') {
        throw new Error('File does not contain a valid YAML object');
      }

      // Get fixes from AutoFixer
      const fixes = this.autoFixer.fixDeprecatedFields(data);

      // Apply all fixes
      const updatedData = this.autoFixer.applyFixes(data, fixes);

      // Update schema_version to 2.0
      updatedData.schema_version = '2.0';

      // Write back to file
      const newContent = yamlDump(updatedData, {
        indent: 2,
        lineWidth: -1, // No line wrapping
        noRefs: true, // No YAML references
      });

      writeFileSync(filePath, newContent, 'utf8');

      this.log(`Successfully migrated ${filePath}: ${fixes.length} fixes applied`);

      return {
        success: true,
        file: filePath,
        fixesApplied: fixes.length,
        fixes: fixes.map((f) => f.description),
      };
    } catch (error) {
      this.log(`Failed to migrate ${filePath}: ${error.message}`);
      return {
        success: false,
        file: filePath,
        fixesApplied: 0,
        fixes: [],
        error: error.message,
      };
    }
  }

  /**
   * Migrate multiple files with atomic semantics (all-or-nothing)
   *
   * @param {Array<Object>} files - Array of file metadata from detectV1Schemas
   * @param {Object} options - Migration options
   * @param {boolean} [options.dryRun=false] - Preview only, don't modify files
   * @param {boolean} [options.gitCommit=true] - Create git commit after migration
   * @param {boolean} [options.gitCheck=true] - Check for uncommitted changes before migration
   * @returns {Promise<Object>} Migration result
   *
   * Result contains:
   * - success: boolean
   * - filesProcessed: Number of files processed
   * - results: Array of individual file results
   * - commitHash: Git commit hash (if gitCommit=true)
   * - error: Error message (if failed)
   */
  async migrate(files, options = {}) {
    const {
      dryRun = false,
      gitCommit = true,
      gitCheck = true,
    } = options;

    // If dry-run, return preview
    if (dryRun) {
      this.log('Dry-run mode: generating preview');
      const previews = await this.previewMigration(files);
      return {
        success: true,
        filesProcessed: 0,
        results: previews,
        dryRun: true,
      };
    }

    // Git safety check
    if (gitCheck) {
      this.log('Checking git status');
      await this.checkGitStatus();
    }

    // Create backups (in-memory)
    const backups = new Map();
    const filePaths = files.map((f) => f.path);

    for (const filePath of filePaths) {
      try {
        backups.set(filePath, readFileSync(filePath, 'utf8'));
      } catch (error) {
        return {
          success: false,
          filesProcessed: 0,
          results: [],
          error: `Failed to read ${filePath}: ${error.message}`,
        };
      }
    }

    this.log(`Created backups for ${backups.size} files`);

    // Migrate all files
    const results = [];
    let allSuccess = true;

    for (const fileInfo of files) {
      const result = await this.migrateFile(fileInfo.path);
      results.push(result);

      if (!result.success) {
        allSuccess = false;
        this.log(`Migration failed for ${fileInfo.relativePath}`);
        break; // Stop on first failure
      }
    }

    // Rollback if any failed
    if (!allSuccess) {
      this.log('Rolling back all changes');

      for (const [filePath, content] of backups) {
        try {
          writeFileSync(filePath, content, 'utf8');
        } catch (error) {
          // Critical: rollback failed
          this.log(`CRITICAL: Rollback failed for ${filePath}: ${error.message}`);
        }
      }

      return {
        success: false,
        filesProcessed: 0,
        results,
        error: 'Migration failed - all changes have been rolled back',
      };
    }

    this.log(`Successfully migrated ${results.length} files`);

    // Create git commit if requested
    let commitHash = null;
    if (gitCommit && await this.isGitRepository()) {
      try {
        commitHash = await this.createMigrationCommit(results);
        this.log(`Created git commit: ${commitHash}`);
      } catch (error) {
        this.log(`Failed to create git commit: ${error.message}`);
        // Rollback migration since we couldn't commit
        this.log('Rolling back migration due to git commit failure');

        for (const [filePath, content] of backups) {
          try {
            writeFileSync(filePath, content, 'utf8');
          } catch (_rollbackError) {
            this.log(`CRITICAL: Rollback failed for ${filePath}`);
          }
        }

        return {
          success: false,
          filesProcessed: 0,
          results,
          error: `Git commit failed: ${error.message} - all changes rolled back`,
        };
      }
    }

    return {
      success: true,
      filesProcessed: results.length,
      results,
      commitHash,
    };
  }

  /**
   * Create git commit for migration
   * @private
   *
   * @param {Array<Object>} results - Migration results
   * @returns {Promise<string>} Commit hash
   */
  async createMigrationCommit(results) {
    const filePaths = results.map((r) => r.file);
    const totalFixes = results.reduce((sum, r) => sum + r.fixesApplied, 0);

    // Build commit message
    const message =
      `chore: migrate schema from v1 to v2\n\n` +
      `Upgraded ${results.length} config file(s) to schema v2.0\n` +
      `Applied ${totalFixes} field migration(s)\n\n` +
      `Files:\n` +
      results.map((r) => `  - ${relative(this.rootDir, r.file)}`).join('\n') +
      `\n\nGenerated by scholar v2.3.0 /teaching:migrate`;

    // Add files
    const addResult = await execFileNoThrow('git', ['add', ...filePaths], {
      cwd: this.rootDir,
    });

    if (addResult.status !== 0) {
      throw new Error(`Failed to stage files: ${addResult.stderr}`);
    }

    // Create commit
    const commitResult = await execFileNoThrow('git', ['commit', '-m', message], {
      cwd: this.rootDir,
    });

    if (commitResult.status !== 0) {
      throw new Error(`Failed to create commit: ${commitResult.stderr}`);
    }

    // Get commit hash
    const { stdout, status } = await execFileNoThrow('git', ['rev-parse', 'HEAD'], {
      cwd: this.rootDir,
    });

    if (status !== 0) {
      throw new Error(`Failed to get commit hash`);
    }

    return stdout.trim();
  }

  /**
   * Check if current directory is a git repository
   *
   * @returns {Promise<boolean>} True if git repository
   */
  async isGitRepository() {
    try {
      const { status } = await execFileNoThrow('git', ['rev-parse', '--git-dir'], {
        cwd: this.rootDir,
      });
      return status === 0;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Check git working directory status
   *
   * @throws {Error} If uncommitted changes exist
   * @returns {Promise<void>}
   */
  async checkGitStatus() {
    const isGit = await this.isGitRepository();

    if (!isGit) {
      this.log('Not a git repository - skipping git checks');
      return;
    }

    const { stdout, status } = await execFileNoThrow('git', ['status', '--porcelain'], {
      cwd: this.rootDir,
    });

    if (status !== 0) {
      throw new Error('Failed to check git status');
    }

    if (stdout.trim()) {
      // Parse uncommitted files
      const uncommittedFiles = stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.substring(3)); // Remove status prefix

      throw new Error(
        `Uncommitted changes detected:\n  ${uncommittedFiles.join('\n  ')}\n\n` +
          `Options:\n` +
          `  1. Commit changes: git add . && git commit -m "..."\n` +
          `  2. Stash changes: git stash\n` +
          `  3. Skip check (dangerous): /teaching:migrate --no-git-check`
      );
    }

    this.log('Git working directory is clean');
  }
}

export default BatchMigrator;
