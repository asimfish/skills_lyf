/**
 * Base Formatter
 *
 * Abstract base class for all exam formatters.
 * Provides common interface and helper methods.
 */

export class BaseFormatter {
  /**
   * Create a formatter
   * @param {Object} options - Formatter-specific options
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Format exam content to target format
   * @param {Object} content - Exam content (JSON)
   * @param {Object} options - Format-specific options
   * @returns {string|Promise<string>} Formatted output
   */
  format(content, _options = {}) {
    throw new Error('format() must be implemented by subclass');
  }

  /**
   * Validate formatted output
   * @param {string} output - Formatted output
   * @returns {Object} Validation result {valid, errors}
   */
  validate(_output) {
    return { valid: true, errors: [] };
  }

  /**
   * Get file extension for this format
   * @returns {string} File extension (e.g., '.md', '.tex')
   */
  getFileExtension() {
    throw new Error('getFileExtension() must be implemented by subclass');
  }

  /**
   * Helper: Format LaTeX math notation for different formats
   * @param {string} text - Text with LaTeX
   * @param {string} format - Target format ('markdown', 'latex')
   * @returns {string} Formatted text
   */
  formatLatex(text, format = 'markdown') {
    if (!text) return '';

    if (format === 'markdown') {
      // Keep $...$ inline math, $$...$$ display math
      return text;
    } else if (format === 'latex') {
      // Remove $ delimiters for LaTeX documents
      return text.replace(/\$\$/g, '').replace(/\$/g, '');
    }

    return text;
  }

  /**
   * Helper: Escape special characters for markdown
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeMarkdown(text) {
    if (!text) return '';

    // Don't escape LaTeX math delimiters
    return text
      .replace(/([\\`*_{}[\]()#+\-.!])/g, (match, char) => {
        // Skip $ for math
        if (char === '$') return char;
        return '\\' + char;
      });
  }

  /**
   * Helper: Escape special characters for LaTeX
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeLatex(text) {
    if (!text) return '';

    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([&%$#_{}])/g, '\\$1')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  /**
   * Helper: Process LaTeX math in text
   * @param {string} text - Text with LaTeX
   * @returns {string} Processed text
   */
  processLatex(text) {
    if (!text) return '';

    // LaTeX is already properly formatted in our JSON
    // Just return as-is (subclasses can override for specific needs)
    return text;
  }

  /**
   * Helper: Validate exam content structure
   * @param {Object} content - Exam content
   * @returns {Object} Validation result {valid, errors}
   */
  validateContent(content) {
    const errors = [];

    if (!content.title) {
      errors.push('Missing exam title');
    }

    if (!content.questions || !Array.isArray(content.questions)) {
      errors.push('Missing or invalid questions array');
    } else if (content.questions.length === 0) {
      errors.push('No questions in exam');
    }

    if (!content.answer_key) {
      errors.push('Missing answer key');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
