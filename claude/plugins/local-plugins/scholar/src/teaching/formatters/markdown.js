/**
 * Markdown Formatter
 *
 * Formats exam content as examark-compatible Markdown.
 * This is the base format for Canvas QTI export.
 */

import { BaseFormatter } from './base.js';

export class MarkdownFormatter extends BaseFormatter {
  /**
   * Format exam to Markdown
   * @param {Object} content - Exam content (JSON)
   * @param {Object} options - Format options
   * @param {boolean} options.skipFrontmatter - Skip YAML frontmatter
   * @param {boolean} options.includeAnswers - Include answer key (default: true)
   * @param {boolean} options.includeMetadata - Include metadata section (default: true)
   * @returns {string} Markdown formatted exam
   */
  format(content, options = {}) {
    const {
      skipFrontmatter = false,
      includeAnswers = true,
      includeMetadata = true
    } = options;

    // Validate content first
    const validation = this.validateContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid exam content: ${validation.errors.join(', ')}`);
    }

    const output = [];

    // YAML frontmatter (for examark)
    if (!skipFrontmatter) {
      output.push('---');
      output.push(`title: ${content.title}`);
      output.push(`points: ${content.total_points || 0}`);

      if (content.duration_minutes) {
        output.push(`duration: ${content.duration_minutes} minutes`);
      }

      if (content.exam_type) {
        output.push(`type: ${content.exam_type}`);
      }

      output.push('---');
      output.push('');
    }

    // Metadata section (optional)
    if (includeMetadata && content.metadata) {
      if (content.metadata.course) {
        output.push(`**Course:** ${content.metadata.course}`);
      }
      if (content.metadata.date) {
        output.push(`**Date:** ${content.metadata.date}`);
      }
      output.push('');
    }

    // Instructions
    if (content.instructions) {
      output.push(content.instructions);
      output.push('');
    }

    // Questions
    content.questions.forEach((q, idx) => {
      output.push(`## Question ${idx + 1}`);
      output.push('');

      // Question text (with LaTeX)
      output.push(q.text);
      output.push('');

      // Format based on question type
      if (q.type === 'multiple-choice') {
        this.formatMultipleChoice(q, content.answer_key, includeAnswers, output);
      } else if (q.type === 'short-answer') {
        this.formatShortAnswer(q, content.answer_key, includeAnswers, output);
      } else if (q.type === 'essay') {
        this.formatEssay(q, content.answer_key, includeAnswers, output);
      } else if (q.type === 'true-false') {
        this.formatTrueFalse(q, content.answer_key, includeAnswers, output);
      } else if (q.type === 'numerical') {
        this.formatNumerical(q, content.answer_key, includeAnswers, output);
      }

      // Points
      output.push('');
      output.push(`Points: ${q.points}`);
      output.push('');
    });

    // Formula sheet
    if (content.formula_sheet) {
      output.push('---');
      output.push('');
      output.push('## Formula Sheet');
      output.push('');
      output.push(content.formula_sheet);
      output.push('');
    }

    return output.join('\n');
  }

  /**
   * Format multiple-choice question
   * @private
   */
  formatMultipleChoice(question, answerKey, includeAnswers, output) {
    const answer = answerKey[question.id];

    question.options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i); // A, B, C, D
      const marker = (includeAnswers && letter === answer) ? '*' : '-';
      output.push(`${marker} ${opt}`);
    });
  }

  /**
   * Format short-answer question
   * @private
   */
  formatShortAnswer(question, answerKey, includeAnswers, output) {
    if (!includeAnswers) return;

    const answer = answerKey[question.id];

    if (answer) {
      output.push('**Answer:**');
      if (typeof answer === 'string') {
        output.push(answer);
      } else if (answer.answer) {
        output.push(answer.answer);
      }
      output.push('');
    }
  }

  /**
   * Format essay question
   * @private
   */
  formatEssay(question, answerKey, includeAnswers, output) {
    if (!includeAnswers) return;

    const answer = answerKey[question.id];

    if (answer) {
      output.push('**Answer:**');

      if (typeof answer === 'string') {
        output.push(answer);
      } else if (answer.answer) {
        output.push(answer.answer);
      }

      output.push('');

      // Add rubric if available
      if (question.rubric) {
        output.push('**Rubric:**');
        output.push(question.rubric);
        output.push('');
      }

      // Add detailed rubric points if available
      if (typeof answer === 'object' && answer.rubric_points) {
        output.push('**Point Allocation:**');
        Object.entries(answer.rubric_points).forEach(([criterion, description]) => {
          output.push(`- ${criterion}: ${description}`);
        });
        output.push('');
      }
    }
  }

  /**
   * Format true-false question
   * @private
   */
  formatTrueFalse(question, answerKey, includeAnswers, output) {
    const answer = answerKey[question.id];

    const options = ['True', 'False'];
    options.forEach((opt) => {
      const marker = (includeAnswers && opt === answer) ? '*' : '-';
      output.push(`${marker} ${opt}`);
    });
  }

  /**
   * Format numerical question
   * @private
   */
  formatNumerical(question, answerKey, includeAnswers, output) {
    if (!includeAnswers) return;

    const answer = answerKey[question.id];

    if (answer !== undefined) {
      output.push('**Answer:**');
      output.push(String(answer));
      output.push('');
    }
  }

  /**
   * Get file extension
   * @returns {string} '.md'
   */
  getFileExtension() {
    return '.md';
  }

  /**
   * Validate markdown output
   * @param {string} output - Formatted markdown
   * @returns {Object} Validation result
   */
  validate(output) {
    const errors = [];

    // Check for required sections
    if (!output.includes('## Question')) {
      errors.push('No questions found in output');
    }

    if (!output.includes('Points:')) {
      errors.push('No point values found');
    }

    // Check YAML frontmatter
    if (output.startsWith('---')) {
      const frontmatterEnd = output.indexOf('---', 3);
      if (frontmatterEnd === -1) {
        errors.push('Unclosed YAML frontmatter');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
