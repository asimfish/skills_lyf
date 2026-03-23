/**
 * Preview Launcher
 *
 * Launches Quarto preview for generated lecture files.
 * Used by --open flag on /teaching:lecture.
 *
 * Uses detached spawn for cross-platform compatibility.
 */

import { spawn, execFileSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Launch Quarto preview for a file
 * @param {string} filePath - Path to .qmd file
 * @param {Object} [options] - Launch options
 * @param {boolean} [options.debug] - Debug logging
 * @returns {{ success: boolean, message: string }}
 */
export function launchPreview(filePath, options = {}) {
  if (!filePath || !existsSync(filePath)) {
    return { success: false, message: `File not found: ${filePath}` };
  }

  // Check if quarto is available
  if (!isQuartoAvailable()) {
    return {
      success: false,
      message: 'Quarto is not installed or not in PATH. Install from https://quarto.org'
    };
  }

  try {
    return launchDetached(filePath, options);
  } catch (error) {
    return { success: false, message: `Failed to launch preview: ${error.message}` };
  }
}

/**
 * Launch Quarto preview as a detached background process
 * Uses spawn with argument array to avoid shell injection.
 * @param {string} filePath - Path to .qmd file
 * @param {Object} options - Launch options
 * @returns {{ success: boolean, message: string }}
 */
function launchDetached(filePath, options) {
  const child = spawn('quarto', ['preview', filePath], {
    detached: true,
    stdio: options.debug ? 'inherit' : 'ignore'
  });

  // Unref to allow parent process to exit
  child.unref();

  return { success: true, message: `Preview launched: ${filePath}` };
}

/**
 * Check if Quarto CLI is available
 * @returns {boolean}
 */
function isQuartoAvailable() {
  try {
    execFileSync('quarto', ['--version'], { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export { isQuartoAvailable };
