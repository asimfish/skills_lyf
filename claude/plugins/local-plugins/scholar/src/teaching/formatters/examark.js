/**
 * Examark Formatter
 *
 * Formats exam content for examark (Canvas QTI export tool).
 * Uses numbered list format with question type tags.
 *
 * Format specification:
 * - Numbered lists: 1., 2., 3.
 * - Question types: [MC], [TF], [Essay], [Short], [Numeric], [MA], [Match], [FMB], [FIB], [Upload]
 * - Points inline: [10pts] or [Essay, 10pts]
 * - Correct answers: [x]
 * - Lettered options: a), b), c), d)
 */

import { BaseFormatter } from './base.js';

export class ExamarkFormatter extends BaseFormatter {
  constructor(options = {}) {
    super(options);
    /** @type {Array<{type: string, question: string, message: string}>} */
    this.warnings = [];
  }

  /**
   * Format exam to examark markdown
   * @param {Object} content - Exam content (JSON)
   * @param {Object} options - Format options
   * @param {boolean} options.includeFrontmatter - Include YAML frontmatter (default: false)
   * @param {boolean} options.includeAnswers - Include answer key (default: true)
   * @returns {string} Examark formatted markdown
   */
  format(content, options = {}) {
    this.warnings = [];
    const {
      includeFrontmatter = false,
      includeAnswers = true
    } = options;

    // Validate content
    const validation = this.validateContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid exam content: ${validation.errors.join(', ')}`);
    }

    const output = [];

    // Optional YAML frontmatter
    if (includeFrontmatter) {
      output.push('---');
      output.push(`title: ${content.title}`);
      if (content.total_points) {
        output.push(`points: ${content.total_points}`);
      }
      output.push('---');
      output.push('');
    }

    // Title as H1
    output.push(`# ${content.title}`);
    output.push('');

    // Instructions (if present)
    if (content.instructions) {
      output.push(content.instructions);
      output.push('');
    }

    // Questions in numbered list format
    let currentSection = null;
    content.questions.forEach((q, idx) => {
      // Emit section header when section changes (maps to Canvas question groups)
      if (q.sectionName && q.sectionName !== currentSection) {
        currentSection = q.sectionName;
        output.push(`# ${currentSection}`);
        output.push('');
      }

      const questionNum = idx + 1;
      this.formatQuestion(q, questionNum, content.answer_key, includeAnswers, output);
      output.push(''); // Blank line between questions
    });

    return output.join('\n');
  }

  /**
   * Format a single question
   * @private
   */
  formatQuestion(question, questionNum, answerKey, includeAnswers, output) {
    const typeTag = this.getQuestionTypeTag(question.type);
    const points = question.points;

    // Question header: "1. [MC] Question text [10pts]"
    if (question.type === 'essay' || question.type === 'file-upload') {
      // Essay/Upload format: "1. [Essay, 10pts] Question text"
      output.push(`${questionNum}. [${typeTag}, ${points}pts] ${question.text}`);
    } else {
      // Other formats: "1. [MC] Question text [10pts]"
      output.push(`${questionNum}. [${typeTag}] ${question.text} [${points}pts]`);
    }

    output.push(''); // Blank line after question

    // Format based on type
    if (question.type === 'multiple-choice') {
      this.formatMultipleChoice(question, answerKey, includeAnswers, output);
    } else if (question.type === 'true-false') {
      this.formatTrueFalse(question, answerKey, includeAnswers, output);
    } else if (question.type === 'short-answer') {
      // Short answer has no options, just the question
      // examark will show text input
    } else if (question.type === 'essay') {
      // Essay has no options, just the question
      // examark will show text area
    } else if (question.type === 'numerical') {
      // Numerical answer
      if (includeAnswers) {
        const answer = answerKey[question.id];
        if (answer !== undefined) {
          output.push(`Answer: ${answer}`);
        }
      }
    } else if (question.type === 'multiple-answer') {
      this.formatMultipleAnswer(question, answerKey, includeAnswers, output);
    } else if (question.type === 'matching') {
      this.formatMatching(question, answerKey, includeAnswers, output);
    } else if (question.type === 'fill-in-multiple-blanks') {
      this.formatFillInMultipleBlanks(question, answerKey, includeAnswers, output);
    } else if (question.type === 'fill-in-blank') {
      // Single blank answer
      if (includeAnswers) {
        const answer = answerKey[question.id];
        if (answer !== undefined) {
          output.push(`Answer: ${answer}`);
        }
      }
    } else if (question.type === 'file-upload') {
      // Mapped to Essay — add note about original upload intent
      output.push('*Note: This question originally required a file upload. Please submit your work as described above.*');
    }
  }

  /**
   * Format multiple-choice options
   * @private
   */
  formatMultipleChoice(question, answerKey, includeAnswers, output) {
    const answer = answerKey[question.id];

    question.options.forEach((opt, i) => {
      const letter = String.fromCharCode(97 + i); // a, b, c, d
      const isCorrect = includeAnswers && String.fromCharCode(65 + i) === answer; // A, B, C, D

      if (isCorrect) {
        output.push(`${letter}) ${opt} [x]`);
      } else {
        output.push(`${letter}) ${opt}`);
      }
    });
  }

  /**
   * Format true-false options
   * @private
   */
  formatTrueFalse(question, answerKey, includeAnswers, output) {
    const answer = answerKey[question.id];

    const options = ['True', 'False'];
    options.forEach((opt, i) => {
      const letter = String.fromCharCode(97 + i); // a, b
      const isCorrect = includeAnswers && opt === answer;

      if (isCorrect) {
        output.push(`${letter}) ${opt} [x]`);
      } else {
        output.push(`${letter}) ${opt}`);
      }
    });
  }

  /**
   * Format multiple-answer options (multiple correct answers)
   * @private
   */
  formatMultipleAnswer(question, answerKey, includeAnswers, output) {
    const answer = answerKey[question.id]; // Array of letters like ['A', 'C']

    question.options.forEach((opt, i) => {
      const letter = String.fromCharCode(97 + i); // a, b, c, d
      const upperLetter = String.fromCharCode(65 + i); // A, B, C, D
      const isCorrect = includeAnswers && Array.isArray(answer) && answer.includes(upperLetter);

      if (isCorrect) {
        output.push(`${letter}) ${opt} [x]`);
      } else {
        output.push(`${letter}) ${opt}`);
      }
    });
  }

  /**
   * Format matching question (pair left = right)
   * @private
   */
  formatMatching(question, answerKey, includeAnswers, output) {
    const pairs = question.pairs || [];

    if (includeAnswers) {
      // Show pairs with answers: "Mean = Average value"
      pairs.forEach(pair => {
        output.push(`${pair.left} = ${pair.right}`);
      });
    } else {
      // Show left items as lettered list and right items separately
      pairs.forEach((pair, i) => {
        const letter = String.fromCharCode(97 + i); // a, b, c
        output.push(`${letter}) ${pair.left}`);
      });
      output.push('');
      pairs.forEach((pair, i) => {
        output.push(`${i + 1}. ${pair.right}`);
      });
    }
  }

  /**
   * Format fill-in-multiple-blanks question
   * @private
   */
  formatFillInMultipleBlanks(question, answerKey, includeAnswers, output) {
    if (includeAnswers) {
      const answers = answerKey[question.id]; // Object like {blank1: "answer1", blank2: "answer2"}
      if (answers && typeof answers === 'object') {
        output.push('Answers:');
        for (const [blank, answer] of Object.entries(answers)) {
          output.push(`  ${blank}: ${answer}`);
        }
      }
    }
  }

  /**
   * Get examark question type tag
   * @private
   */
  getQuestionTypeTag(type) {
    if (type === 'file-upload') {
      this.warnings.push({
        type: 'upload-to-essay',
        question: '',
        message: 'Upload question mapped to Essay — examark does not support [Upload] and would silently drop it.'
      });
      return 'Essay';
    }

    const typeMap = {
      'multiple-choice': 'MC',
      'true-false': 'TF',
      'short-answer': 'Short',
      'essay': 'Essay',
      'numerical': 'Numeric',
      'multiple-answer': 'MA',
      'matching': 'Match',
      'fill-in-multiple-blanks': 'FMB',
      'fill-in-blank': 'FIB',
    };

    return typeMap[type] || 'MC';
  }

  /**
   * Get file extension
   * @returns {string} '.md'
   */
  getFileExtension() {
    return '.md';
  }

  /**
   * Validate examark output
   * @param {string} output - Formatted markdown
   * @returns {Object} Validation result
   */
  validate(output) {
    const errors = [];

    // Check for numbered lists
    if (!output.match(/^\d+\.\s+\[/m)) {
      errors.push('No numbered questions found (expected format: "1. [MC] ...")');
    }

    // Check for question type tags
    const validTags = ['[MC]', '[TF]', '[Essay', '[Short]', '[Numeric]', '[MA]', '[Match]', '[FMB]', '[FIB]'];
    const hasTags = validTags.some(tag => output.includes(tag));
    if (!hasTags) {
      errors.push('No question type tags found (expected: [MC], [TF], etc.)');
    }

    // Check for points notation
    if (!output.includes('pts]')) {
      errors.push('No points notation found (expected: [10pts])');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
