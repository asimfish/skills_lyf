/**
 * Quarto Formatter
 *
 * Formats exam content as Quarto document (.qmd).
 * Extends MarkdownFormatter with Quarto-specific YAML frontmatter.
 */

import { MarkdownFormatter } from './markdown.js';

export class QuartoFormatter extends MarkdownFormatter {
  /**
   * Format exam to Quarto document
   * @param {Object} content - Exam content (JSON)
   * @param {Object} options - Format options
   * @param {string} options.documentClass - LaTeX document class (default: 'exam')
   * @param {string} options.format - Output format (default: 'pdf')
   * @param {Object} options.pdfOptions - PDF-specific options
   * @returns {string} Quarto formatted exam
   */
  format(content, options = {}) {
    const {
      documentClass = 'exam',
      format = 'pdf',
      pdfOptions = {}
    } = options;

    const output = [];

    // Enhanced YAML frontmatter for Quarto
    output.push('---');
    output.push(`title: "${content.title}"`);

    // Subtitle (course info)
    if (content.metadata?.course) {
      output.push(`subtitle: "${content.metadata.course}"`);
    }

    // Date
    output.push(`date: ${content.metadata?.date || 'today'}`);

    // Author (instructor)
    if (content.metadata?.instructor) {
      output.push(`author: "${content.metadata.instructor}"`);
    }

    // Format configuration
    output.push(`format:`);

    if (format === 'pdf') {
      output.push(`  pdf:`);
      output.push(`    documentclass: ${documentClass}`);

      // PDF options
      if (pdfOptions.toc !== false) {
        output.push(`    toc: ${pdfOptions.toc || false}`);
      }

      if (pdfOptions.numberSections !== false) {
        output.push(`    number-sections: ${pdfOptions.numberSections || false}`);
      }

      // LaTeX packages
      output.push(`    include-in-header:`);
      output.push(`      text: |`);
      output.push(`        \\usepackage{amsmath}`);
      output.push(`        \\usepackage{amssymb}`);

      if (documentClass === 'exam') {
        output.push(`        \\usepackage{enumerate}`);
      }

      // Additional packages
      if (pdfOptions.packages) {
        pdfOptions.packages.forEach(pkg => {
          output.push(`        \\usepackage{${pkg}}`);
        });
      }

      // Geometry
      if (pdfOptions.geometry) {
        const geo = pdfOptions.geometry;
        output.push(`    geometry:`);
        if (geo.margin) output.push(`      - margin=${geo.margin}`);
        if (geo.left) output.push(`      - left=${geo.left}`);
        if (geo.right) output.push(`      - right=${geo.right}`);
        if (geo.top) output.push(`      - top=${geo.top}`);
        if (geo.bottom) output.push(`      - bottom=${geo.bottom}`);
      }
    } else if (format === 'html') {
      output.push(`  html:`);
      output.push(`    toc: true`);
      output.push(`    toc-depth: 2`);
      output.push(`    code-fold: false`);
    }

    // Exam metadata
    if (content.duration_minutes) {
      output.push(`duration: "${content.duration_minutes} minutes"`);
    }

    if (content.total_points) {
      output.push(`total_points: ${content.total_points}`);
    }

    if (content.exam_type) {
      output.push(`exam_type: "${content.exam_type}"`);
    }

    output.push('---');
    output.push('');

    // Add exam header section
    this.addExamHeader(content, output);

    // Use parent markdown formatter for question content
    const markdown = super.format(content, { skipFrontmatter: true });
    output.push(markdown);

    return output.join('\n');
  }

  /**
   * Add exam header section
   * @private
   */
  addExamHeader(content, output) {
    // Instructions box (if using exam class)
    if (content.instructions) {
      output.push(':::{.callout-note}');
      output.push('## Instructions');
      output.push('');
      output.push(content.instructions);
      output.push(':::');
      output.push('');
    }

    // Exam metadata table
    output.push('| | |');
    output.push('|---|---|');

    if (content.duration_minutes) {
      output.push(`| **Duration** | ${content.duration_minutes} minutes |`);
    }

    if (content.total_points) {
      output.push(`| **Total Points** | ${content.total_points} |`);
    }

    if (content.exam_type) {
      const typeLabel = content.exam_type.charAt(0).toUpperCase() + content.exam_type.slice(1);
      output.push(`| **Exam Type** | ${typeLabel} |`);
    }

    if (content.resources_allowed) {
      const resources = [];
      if (content.resources_allowed.calculator) resources.push('Calculator');
      if (content.resources_allowed.notes) resources.push('Notes');
      if (content.resources_allowed.textbook) resources.push('Textbook');
      if (content.resources_allowed.computer) resources.push('Computer');

      if (resources.length > 0) {
        output.push(`| **Allowed Resources** | ${resources.join(', ')} |`);
      }
    }

    output.push('');
  }

  /**
   * Get file extension
   * @returns {string} '.qmd'
   */
  getFileExtension() {
    return '.qmd';
  }

  /**
   * Validate Quarto output
   * @param {string} output - Formatted Quarto document
   * @returns {Object} Validation result
   */
  validate(output) {
    const errors = [];

    // Check for YAML frontmatter
    if (!output.startsWith('---')) {
      errors.push('Missing YAML frontmatter');
    }

    const frontmatterEnd = output.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      errors.push('Unclosed YAML frontmatter');
    } else {
      const frontmatter = output.substring(0, frontmatterEnd + 3);

      // Check for required fields
      if (!frontmatter.includes('title:')) {
        errors.push('Missing title in frontmatter');
      }

      if (!frontmatter.includes('format:')) {
        errors.push('Missing format in frontmatter');
      }
    }

    // Validate markdown content using parent
    const mdValidation = super.validate(output);
    if (!mdValidation.valid) {
      errors.push(...mdValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
