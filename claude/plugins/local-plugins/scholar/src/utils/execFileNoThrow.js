/**
 * Safe wrapper around child_process.execFile for git operations
 *
 * SECURITY NOTE: This file IMPLEMENTS the safe execFileNoThrow wrapper.
 * Using execFile (not exec) prevents command injection vulnerabilities.
 *
 * execFile() does not spawn a shell, so shell metacharacters are safe.
 */

import { execFile } from 'child_process'; // Safe: execFile doesn't spawn shell
import { promisify } from 'util';

const execFilePromise = promisify(execFile);

/**
 * Execute a command using execFile (safe from command injection)
 *
 * @param {string} command - Command to execute (e.g., 'git')
 * @param {Array<string>} args - Arguments array (e.g., ['status', '--porcelain'])
 * @param {Object} options - Options passed to execFile (e.g., { cwd: '/path' })
 * @returns {Promise<{stdout: string, stderr: string, status: number}>} Result object
 *
 * @example
 * // Safe: Arguments are properly escaped by execFile
 * const { stdout } = await execFileNoThrow('git', ['add', filePath]);
 *
 * // NEVER do this: exec(`git add ${filePath}`) - VULNERABLE to injection!
 */
export async function execFileNoThrow(command, args = [], options = {}) {
  try {
    const { stdout, stderr } = await execFilePromise(command, args, {
      ...options,
      encoding: 'utf8',
    });

    return {
      stdout: stdout || '',
      stderr: stderr || '',
      status: 0,
    };
  } catch (error) {
    // execFile throws on non-zero exit codes
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      status: error.code || 1,
    };
  }
}

export default execFileNoThrow;
