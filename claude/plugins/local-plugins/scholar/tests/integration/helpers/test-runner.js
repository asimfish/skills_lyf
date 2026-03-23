/**
 * Test Runner Helper
 *
 * Provides utilities for running validation and fix workflows in integration tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Run a teaching command and return output
 * @param {string} cmdString - Command string (e.g., "/teaching:validate --fix")
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Command output and metadata
 */
export async function runCommand(cmdString, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(cmdString, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 30000,
    });

    return {
      success: true,
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
      error: error.message,
    };
  }
}

/**
 * Run command with interactive user input
 * @param {string} cmdString - Command string
 * @param {Array<string>} inputs - Array of user inputs to provide
 * @returns {Promise<Object>} Command output with interaction log
 */
export async function runInteractive(cmdString, inputs = []) {
  // TODO: Implement interactive mode with stdin mocking
  // For now, return mock structure
  return {
    success: true,
    stdout: '',
    stderr: '',
    interactions: inputs.map((input, i) => ({
      prompt: `Prompt ${i + 1}`,
      response: input,
    })),
  };
}

/**
 * Load a fixture file
 * @param {string} relativePath - Path relative to fixtures directory
 * @returns {Promise<string>} File contents
 */
export async function loadFixture(relativePath) {
  const fixturesDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '../fixtures'
  );
  const fullPath = path.join(fixturesDir, relativePath);
  return await fs.readFile(fullPath, 'utf8');
}

/**
 * Create temporary test file
 * @param {string} content - File content
 * @param {string} filename - Optional filename (defaults to temp-{random}.yml)
 * @returns {Promise<string>} Path to created file
 */
export async function createTempFile(content, filename = null) {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'scholar-integration-'));

  const name = filename || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}.yml`;
  const filePath = path.join(tmpDir, name);

  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

/**
 * Cleanup temporary test files
 * @param {string|Array<string>} paths - File path(s) to delete
 */
export async function cleanup(paths) {
  const pathArray = Array.isArray(paths) ? paths : [paths];

  for (const filePath of pathArray) {
    try {
      await fs.unlink(filePath);
    } catch (_error) {
      // Ignore errors (file might not exist)
    }
  }
}

/**
 * Compare two YAML files for equality
 * @param {string} file1 - First file path
 * @param {string} file2 - Second file path
 * @returns {Promise<boolean>} True if files are equivalent
 */
export async function compareYAMLFiles(file1, file2) {
  const [content1, content2] = await Promise.all([
    fs.readFile(file1, 'utf8'),
    fs.readFile(file2, 'utf8'),
  ]);

  // Simple string comparison for now
  // Could be enhanced to do semantic YAML comparison
  return content1.trim() === content2.trim();
}
