/**
 * LaTeX Exporter for Scholar Exams
 *
 * Converts JSON exam format to LaTeX documents for printing.
 * Generates: student version, answer key, grading rubric.
 *
 * @module latex-export
 */

/**
 * Escapes special LaTeX characters in text
 * Preserves LaTeX math mode (content between $ delimiters)
 */
function escapeLatex(text) {
  if (!text) return '';

  // Extract math mode sections first using Unicode placeholders that won't be escaped
  const mathSections = [];
  let textWithPlaceholders = text.replace(/\$([^$]+)\$/g, (match, mathContent) => {
    // Use Unicode private use area characters as placeholders
    const placeholder = `\uE000${mathSections.length}\uE001`;
    mathSections.push(mathContent);
    return placeholder;
  });

  // Escape special characters in non-math text
  textWithPlaceholders = textWithPlaceholders
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')  // Include $ in the character class
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');

  // Restore math sections
  mathSections.forEach((mathContent, index) => {
    const placeholder = `\uE000${index}\uE001`;
    textWithPlaceholders = textWithPlaceholders.replace(
      placeholder,
      `$${mathContent}$`
    );
  });

  return textWithPlaceholders;
}

/**
 * Converts JSON exam to LaTeX format
 */
export class LatexExporter {
  constructor(exam, options = {}) {
    this.exam = exam;
    this.options = {
      includeAnswerKey: true,
      includeRubric: true,
      formatStyle: 'exam-class', // or 'article'
      pageSize: 'letter',
      fontSize: '11pt',
      answerSpace: {
        'multiple-choice': '0in',
        'true-false': '0in',
        'short-answer': '3in',
        'numerical': '1.5in',
        'essay': '5in'
      },
      ...options
    };
  }

  /**
   * Export student version (no answers shown)
   */
  exportStudentVersion() {
    return this.buildLatex({
      showAnswers: false,
      includeAnswerSpace: true,
      includeFormulaSheet: true,
      highlightCorrect: false,
      showSolutions: false
    });
  }

  /**
   * Export answer key (answers shown and highlighted)
   */
  exportAnswerKey() {
    return this.buildLatex({
      showAnswers: true,
      includeAnswerSpace: false,
      includeFormulaSheet: false,
      highlightCorrect: true,
      showSolutions: true,
      documentTitle: 'Answer Key'
    });
  }

  /**
   * Export grading rubric
   */
  exportRubric() {
    const { questions, answer_key } = this.exam;
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    let latex = this.buildHeader('Grading Rubric');

    latex += '\\section*{Point Distribution}\n\n';
    latex += '\\begin{longtable}{|p{0.5in}|p{4in}|r|}\n';
    latex += '\\hline\n';
    latex += '\\textbf{ID} & \\textbf{Question} & \\textbf{Points} \\\\\n';
    latex += '\\hline\n';

    questions.forEach(q => {
      const questionText = escapeLatex(q.text);
      const preview = questionText.length > 60
        ? questionText.substring(0, 60) + '...'
        : questionText;

      latex += `${q.id} & ${preview} & ${q.points} \\\\\n`;
      latex += '\\hline\n';
    });

    latex += `\\multicolumn{2}{|r|}{\\textbf{Total Points:}} & \\textbf{${totalPoints}} \\\\\n`;
    latex += '\\hline\n';
    latex += '\\end{longtable}\n\n';

    // Detailed rubrics for essay/short-answer questions
    const questionsWithRubrics = questions.filter(q =>
      (q.type === 'essay' || q.type === 'short-answer') &&
      (q.rubric || (answer_key[q.id] && typeof answer_key[q.id] === 'object' && answer_key[q.id].rubric_points))
    );

    if (questionsWithRubrics.length > 0) {
      latex += '\\section*{Detailed Rubrics}\n\n';

      questionsWithRubrics.forEach(q => {
        latex += `\\subsection*{${q.id}: ${escapeLatex(q.text.substring(0, 50))}...}\n\n`;

        if (q.rubric) {
          latex += `${escapeLatex(q.rubric)}\n\n`;
        }

        if (answer_key[q.id] && typeof answer_key[q.id] === 'object' && answer_key[q.id].rubric_points) {
          latex += '\\begin{itemize}\n';
          Object.entries(answer_key[q.id].rubric_points).forEach(([criterion, description]) => {
            latex += `  \\item \\textbf{${escapeLatex(criterion)}}: ${escapeLatex(description)}\n`;
          });
          latex += '\\end{itemize}\n\n';
        }
      });
    }

    latex += this.buildFooter();
    return latex;
  }

  /**
   * Build complete LaTeX document
   */
  buildLatex(config) {
    const documentTitle = config.documentTitle || this.exam.title;

    let latex = this.buildHeader(documentTitle);
    latex += this.buildQuestions(config);

    if (config.includeFormulaSheet && this.exam.formula_sheet) {
      latex += this.buildFormulaSheet();
    }

    latex += this.buildFooter();
    return latex;
  }

  /**
   * Build LaTeX document header
   */
  buildHeader(title) {
    const { formatStyle, fontSize, pageSize } = this.options;
    const { exam_type, duration_minutes, instructions } = this.exam;

    const documentClass = formatStyle === 'exam-class' ? 'exam' : 'article';
    const paperSize = pageSize === 'letter' ? 'letterpaper' : 'a4paper';

    let header = `\\documentclass[${fontSize},${paperSize}]{${documentClass}}\n\n`;

    // Packages
    header += '\\usepackage{amsmath}\n';
    header += '\\usepackage{amssymb}\n';
    header += '\\usepackage{graphicx}\n';
    header += '\\usepackage{geometry}\n';
    header += '\\usepackage{longtable}\n';
    header += '\\geometry{margin=1in}\n\n';

    // Document start
    header += '\\begin{document}\n\n';

    // Title section
    header += `\\begin{center}\n`;
    header += `\\LARGE \\textbf{${escapeLatex(title)}} \\\\\n`;
    header += `\\large ${escapeLatex(exam_type.charAt(0).toUpperCase() + exam_type.slice(1))} \\\\\n`;
    if (duration_minutes) {
      header += `\\normalsize Duration: ${duration_minutes} minutes\n`;
    }
    header += `\\end{center}\n\n`;

    // Instructions
    if (instructions) {
      header += `\\noindent \\textbf{Instructions:} ${escapeLatex(instructions)}\n\n`;
    }

    header += '\\vspace{0.25in}\n\n';

    // Start questions environment
    if (documentClass === 'exam') {
      header += '\\begin{questions}\n\n';
    }

    return header;
  }

  /**
   * Build questions section
   */
  buildQuestions(config) {
    const { questions, answer_key } = this.exam;
    const { formatStyle } = this.options;

    let latex = '';

    questions.forEach((question, index) => {
      // Question number and points
      if (formatStyle === 'exam-class') {
        latex += `\\question[${question.points}] `;
      } else {
        latex += `\\noindent \\textbf{${index + 1}.} (${question.points} points) `;
      }

      // Question text
      latex += `${escapeLatex(question.text)}\n\n`;

      // Question-type specific formatting
      switch (question.type) {
        case 'multiple-choice':
        case 'true-false':
          latex += this.formatMultipleChoice(question, answer_key[question.id], config);
          break;
        case 'short-answer':
        case 'numerical':
          latex += this.formatWrittenQuestion(question, answer_key[question.id], config, question.type);
          break;
        case 'essay':
          latex += this.formatEssay(question, answer_key[question.id], config);
          break;
      }

      latex += '\n';
    });

    return latex;
  }

  /**
   * Format multiple choice question
   */
  formatMultipleChoice(question, answer, config) {
    let latex = '\\begin{choices}\n';

    question.options.forEach((option, index) => {
      const letter = String.fromCharCode(65 + index); // A, B, C, D...
      const isCorrect = config.highlightCorrect && answer === letter;

      if (isCorrect) {
        latex += `  \\correctchoice ${escapeLatex(option)}\n`;
      } else {
        latex += `  \\choice ${escapeLatex(option)}\n`;
      }
    });

    latex += '\\end{choices}\n\n';

    // Show solution if requested
    if (config.showSolutions && typeof answer === 'string') {
      latex += `\\textbf{Answer:} ${answer}\n\n`;
    }

    return latex;
  }

  /**
   * Format short-answer or numerical question
   */
  formatWrittenQuestion(question, answer, config, type) {
    let latex = '';

    if (config.includeAnswerSpace) {
      const space = this.options.answerSpace[type] || '2in';
      latex += `\\vspace{${space}}\n\n`;
    }

    if (config.showSolutions) {
      if (typeof answer === 'string') {
        latex += `\\textbf{Solution:} ${escapeLatex(answer)}\n\n`;
      } else if (answer && answer.solution) {
        latex += `\\textbf{Solution:} ${escapeLatex(answer.solution)}\n\n`;
      } else if (answer && answer.answer) {
        latex += `\\textbf{Answer:} ${escapeLatex(answer.answer)}\n\n`;
      }
    }

    return latex;
  }

  /**
   * Format essay question
   */
  formatEssay(question, answer, config) {
    let latex = '';

    // Show rubric if available
    if (question.rubric && !config.showSolutions) {
      latex += `\\textit{${escapeLatex(question.rubric)}}\n\n`;
    }

    if (config.includeAnswerSpace) {
      const space = this.options.answerSpace['essay'] || '5in';
      latex += `\\vspace{${space}}\n\n`;
    }

    if (config.showSolutions) {
      if (typeof answer === 'string') {
        latex += `\\textbf{Sample Answer:} ${escapeLatex(answer)}\n\n`;
      } else if (answer && answer.answer) {
        latex += `\\textbf{Sample Answer:} ${escapeLatex(answer.answer)}\n\n`;
      }

      // Show rubric breakdown
      if (answer && answer.rubric_points) {
        latex += '\\textbf{Grading Rubric:}\n';
        latex += '\\begin{itemize}\n';
        Object.entries(answer.rubric_points).forEach(([criterion, description]) => {
          latex += `  \\item \\textbf{${escapeLatex(criterion)}}: ${escapeLatex(description)}\n`;
        });
        latex += '\\end{itemize}\n\n';
      }
    }

    return latex;
  }

  /**
   * Build formula sheet section
   */
  buildFormulaSheet() {
    const { formula_sheet } = this.exam;

    let latex = '\\newpage\n\n';
    latex += '\\section*{Formula Sheet}\n\n';

    // Formula sheet can contain LaTeX - don't escape it
    latex += `${formula_sheet}\n\n`;

    return latex;
  }

  /**
   * Build document footer
   */
  buildFooter() {
    const { formatStyle } = this.options;

    let footer = '';

    if (formatStyle === 'exam-class') {
      footer += '\\end{questions}\n\n';
    }

    footer += '\\end{document}\n';
    return footer;
  }
}
