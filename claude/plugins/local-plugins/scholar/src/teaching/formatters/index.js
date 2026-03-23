/**
 * Formatters Index
 *
 * Exports all exam formatters for easy import.
 */

import { MarkdownFormatter } from './markdown.js';
import { ExamarkFormatter } from './examark.js';
import { CanvasFormatter } from './canvas.js';
import { QuartoFormatter } from './quarto.js';
import { LaTeXFormatter } from './latex.js';

export { BaseFormatter } from './base.js';
export { MarkdownFormatter } from './markdown.js';
export { ExamarkFormatter } from './examark.js';
export { CanvasFormatter } from './canvas.js';
export { QuartoFormatter } from './quarto.js';
export { LaTeXFormatter } from './latex.js';

/**
 * Get formatter by format name
 * @param {string} format - Format name (md, canvas, qmd, tex, etc.)
 * @returns {BaseFormatter} Formatter instance
 */
export function getFormatter(format) {
  const normalizedFormat = format.toLowerCase();

  switch (normalizedFormat) {
    case 'md':
    case 'markdown':
      return new MarkdownFormatter();
    case 'canvas':
    case 'qti':
      return new CanvasFormatter();
    case 'qmd':
    case 'quarto':
      return new QuartoFormatter();
    case 'tex':
    case 'latex':
      return new LaTeXFormatter();
    case 'examark':
    case 'examark-md':
      return new ExamarkFormatter();
    default:
      throw new Error(
        `Unknown format: ${format}. Supported formats: md, canvas, qmd, tex, examark`
      );
  }
}

/**
 * Get supported formats
 * @returns {Array<string>} List of supported format names
 */
export function getSupportedFormats() {
  return ['md', 'markdown', 'canvas', 'qti', 'qmd', 'quarto', 'tex', 'latex', 'examark', 'examark-md'];
}

/**
 * Check if format is supported
 * @param {string} format - Format name
 * @returns {boolean} True if supported
 */
export function isFormatSupported(format) {
  return getSupportedFormats().includes(format.toLowerCase());
}
