/**
 * LaTeX Formatter
 *
 * Formats exam content as LaTeX document using exam class.
 * Produces .tex files ready for compilation with pdflatex/xelatex.
 */

import { BaseFormatter } from './base.js';

export class LaTeXFormatter extends BaseFormatter {
  /**
   * Format exam to LaTeX document
   * @param {Object} content - Exam content (JSON)
   * @param {Object} options - Format options
   * @param {string} options.documentClass - Document class (default: 'exam')
   * @param {string} options.fontSize - Font size (default: '12pt')
   * @param {boolean} options.solutions - Include solutions (default: false)
   * @param {boolean} options.answers - Include answer key (default: true)
   * @returns {string} LaTeX formatted exam
   */
  format(content, options = {}) {
    const {
      documentClass = 'exam',
      fontSize = '12pt',
      solutions = false,
      answers = true
    } = options;

    const output = [];

    // Document class
    const classOptions = [fontSize];
    if (solutions) classOptions.push('answers');

    output.push(`\\documentclass[${classOptions.join(',')}]{${documentClass}}`);
    output.push('');

    // Packages
    this.addPackages(output);

    // Exam configuration
    if (documentClass === 'exam') {
      this.addExamConfig(output);
    }

    // Title and metadata
    this.addTitle(content, output);

    // Begin document
    output.push('\\begin{document}');
    output.push('');

    // Make title
    if (content.title || content.metadata) {
      output.push('\\maketitle');
      output.push('');
    }

    // Instructions
    if (content.instructions) {
      this.addInstructions(content.instructions, output);
    }

    // Exam header (metadata table)
    this.addExamHeader(content, output);

    // Questions
    output.push('\\begin{questions}');
    output.push('');

    content.questions.forEach((q, _idx) => {
      this.formatQuestion(q, content.answer_key, answers, output);
    });

    output.push('\\end{questions}');
    output.push('');

    // Formula sheet (appendix)
    if (content.formula_sheet) {
      this.addFormulaSheet(content.formula_sheet, output);
    }

    // End document
    output.push('\\end{document}');

    return output.join('\n');
  }

  /**
   * Add LaTeX packages
   * @private
   */
  addPackages(output) {
    output.push('% Packages');
    output.push('\\usepackage{amsmath}');
    output.push('\\usepackage{amssymb}');
    output.push('\\usepackage{amsfonts}');
    output.push('\\usepackage{graphicx}');
    output.push('\\usepackage{enumitem}');
    output.push('\\usepackage[utf8]{inputenc}');
    output.push('');
  }

  /**
   * Add exam class configuration
   * @private
   */
  addExamConfig(output) {
    output.push('% Exam configuration');
    output.push('\\pointsinrightmargin');
    output.push('\\bracketedpoints');
    output.push('\\marksnotpoints');
    output.push('');
  }

  /**
   * Add document title
   * @private
   */
  addTitle(content, output) {
    output.push('% Title and metadata');

    if (content.title) {
      output.push(`\\title{${this.escapeLatex(content.title)}}`);
    }

    if (content.metadata?.course) {
      output.push(`\\author{${this.escapeLatex(content.metadata.course)}}`);
    }

    if (content.metadata?.date) {
      output.push(`\\date{${this.escapeLatex(content.metadata.date)}}`);
    }

    output.push('');
  }

  /**
   * Add instructions section
   * @private
   */
  addInstructions(instructions, output) {
    output.push('\\noindent\\textbf{Instructions:}');
    output.push('\\begin{itemize}[leftmargin=*]');

    // Split instructions into sentences
    const sentences = instructions.split(/\. /).filter(s => s.trim());

    sentences.forEach(sentence => {
      const cleaned = sentence.trim();
      const item = cleaned.endsWith('.') ? cleaned : cleaned + '.';
      output.push(`  \\item ${this.escapeLatex(item)}`);
    });

    output.push('\\end{itemize}');
    output.push('');
  }

  /**
   * Add exam header (metadata)
   * @private
   */
  addExamHeader(content, output) {
    output.push('\\noindent');
    output.push('\\begin{tabular}{ll}');

    if (content.duration_minutes) {
      output.push(`  \\textbf{Duration:} & ${content.duration_minutes} minutes \\\\`);
    }

    if (content.total_points) {
      output.push(`  \\textbf{Total Points:} & ${content.total_points} \\\\`);
    }

    if (content.exam_type) {
      const typeLabel = content.exam_type.charAt(0).toUpperCase() + content.exam_type.slice(1);
      output.push(`  \\textbf{Exam Type:} & ${typeLabel} \\\\`);
    }

    output.push('\\end{tabular}');
    output.push('');
    output.push('\\vspace{1em}');
    output.push('');
  }

  /**
   * Format a single question
   * @private
   */
  formatQuestion(question, answerKey, includeAnswers, output) {
    // Question with points
    output.push(`\\question[${question.points}]`);

    // Question text (preserves LaTeX math)
    output.push(this.processLatex(question.text));
    output.push('');

    // Format based on type
    if (question.type === 'multiple-choice') {
      this.formatMultipleChoice(question, answerKey, includeAnswers, output);
    } else if (question.type === 'short-answer') {
      this.formatShortAnswer(question, output);
    } else if (question.type === 'essay') {
      this.formatEssay(question, output);
    } else if (question.type === 'true-false') {
      this.formatTrueFalse(question, answerKey, includeAnswers, output);
    }

    output.push('');
  }

  /**
   * Format multiple-choice question
   * @private
   */
  formatMultipleChoice(question, answerKey, includeAnswers, output) {
    const answer = answerKey[question.id];

    output.push('\\begin{choices}');

    question.options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const choice = letter === answer && includeAnswers ? 'CorrectChoice' : 'choice';

      // Escape option text but preserve LaTeX math
      const escaped = this.escapeNonMath(opt);
      output.push(`  \\${choice} ${escaped}`);
    });

    output.push('\\end{choices}');
  }

  /**
   * Format short-answer question
   * @private
   */
  formatShortAnswer(question, output) {
    // Provide answer space
    output.push('\\vspace{3cm}');
  }

  /**
   * Format essay question
   * @private
   */
  formatEssay(question, output) {
    // Add rubric if available
    if (question.rubric) {
      output.push('');
      output.push('\\textit{Rubric:}');
      output.push('\\begin{itemize}[leftmargin=*]');

      // Split rubric into points
      const rubricPoints = question.rubric.split(/\n/).filter(p => p.trim());

      rubricPoints.forEach(point => {
        output.push(`  \\item ${this.escapeLatex(point.trim())}`);
      });

      output.push('\\end{itemize}');
    }

    // Provide answer space
    output.push('\\vspace{5cm}');
  }

  /**
   * Format true-false question
   * @private
   */
  formatTrueFalse(question, answerKey, includeAnswers, output) {
    const answer = answerKey[question.id];

    output.push('\\begin{choices}');

    ['True', 'False'].forEach(opt => {
      const choice = opt === answer && includeAnswers ? 'CorrectChoice' : 'choice';
      output.push(`  \\${choice} ${opt}`);
    });

    output.push('\\end{choices}');
  }

  /**
   * Add formula sheet as appendix
   * @private
   */
  addFormulaSheet(formulaSheet, output) {
    output.push('\\newpage');
    output.push('\\section*{Formula Sheet}');
    output.push('');

    // Formula sheet already has LaTeX formatting
    const processed = this.processLatex(formulaSheet);
    output.push(processed);
    output.push('');
  }

  /**
   * Process LaTeX math in text
   * @override
   */
  processLatex(text) {
    if (!text) return '';

    // Text already has proper LaTeX math delimiters ($...$)
    // Just return as-is
    return text;
  }

  /**
   * Escape non-math text for LaTeX
   * Preserves math delimiters ($...$, $$...$$)
   * @private
   */
  escapeNonMath(text) {
    if (!text) return '';

    // Split on math delimiters
    const parts = text.split(/(\$\$?[^$]+\$\$?)/);

    return parts.map((part, i) => {
      // Keep math parts unchanged
      if (i % 2 === 1) return part;

      // Escape non-math parts
      return this.escapeLatex(part);
    }).join('');
  }

  /**
   * Escape LaTeX special characters
   * @override
   */
  escapeLatex(text) {
    if (!text) return '';

    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([&%$#_{}])/g, '\\$1')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      // Fix double-escaped backslashes from textbackslash
      .replace(/\\textbackslash\{\}textbackslash\{\}/g, '\\textbackslash{}');
  }

  /**
   * Get file extension
   * @returns {string} '.tex'
   */
  getFileExtension() {
    return '.tex';
  }

  /**
   * Validate LaTeX output
   * @param {string} output - Formatted LaTeX
   * @returns {Object} Validation result
   */
  validate(output) {
    const errors = [];

    // Check document structure
    if (!output.includes('\\documentclass')) {
      errors.push('Missing \\documentclass');
    }

    if (!output.includes('\\begin{document}')) {
      errors.push('Missing \\begin{document}');
    }

    if (!output.includes('\\end{document}')) {
      errors.push('Missing \\end{document}');
    }

    // Check for questions environment
    if (!output.includes('\\begin{questions}')) {
      errors.push('Missing \\begin{questions}');
    }

    if (!output.includes('\\end{questions}')) {
      errors.push('Missing \\end{questions}');
    }

    // Check for at least one question
    if (!output.includes('\\question')) {
      errors.push('No questions found');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
