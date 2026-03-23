/**
 * Quarto Notes Formatter
 *
 * Formats lecture notes as Quarto document (.qmd) for long-form content.
 * Generates instructor-facing lecture notes with:
 * - YAML frontmatter for multi-format output (HTML, PDF, DOCX)
 * - Hierarchical section structure
 * - Executable code blocks (R/Python)
 * - LaTeX math (display and inline)
 * - Callout blocks for notes, tips, warnings
 * - Practice problems with solutions
 *
 * This is distinct from quarto.js which formats exams/quizzes.
 */

import { stripMathBlankLines } from '../validators/latex.js';

/**
 * Format lecture notes as Quarto document
 * @param {Object} lectureNotes - Lecture notes object
 * @param {Object} options - Format options
 * @param {Array<string>} options.formats - Output formats (html, pdf, docx)
 * @param {string} options.language - Default code language (r, python)
 * @param {Object} [options.provenance] - Generation metadata for YAML comments
 * @returns {string} Quarto document content
 */
export function formatLectureNotesAsQuarto(lectureNotes, options = {}) {
  const {
    formats = ['html', 'pdf', 'docx'],
    language = 'r',
    provenance = null
  } = options;

  const output = [];

  // Generate YAML frontmatter (with optional provenance metadata comments)
  output.push(generateFrontmatter(lectureNotes, formats, language, provenance));

  // Add learning objectives
  output.push(generateObjectivesSection(lectureNotes.learning_objectives));

  // Add sections
  for (const section of lectureNotes.sections) {
    output.push(formatSection(section, language));
  }

  // Add references if present
  if (lectureNotes.references && lectureNotes.references.length > 0) {
    output.push(generateReferencesSection(lectureNotes.references));
  }

  // Auto-fix: strip blank lines from inside $$...$$ blocks (breaks LaTeX PDF)
  return stripMathBlankLines(output.join('\n\n'));
}

/**
 * Generate YAML frontmatter for Quarto document
 * @param {Object} lectureNotes - Lecture notes object
 * @param {Array<string>} formats - Output formats
 * @param {string} language - Default code language
 * @param {Object|null} provenance - Generation provenance metadata (rendered as YAML comments)
 * @returns {string} YAML frontmatter
 */
function generateFrontmatter(lectureNotes, formats, language, provenance = null) {
  const lines = ['---'];

  // Basic metadata
  lines.push(`title: "${escapeYaml(lectureNotes.title)}"`);

  // Generation metadata as YAML comments (not keys — invisible to Quarto)
  if (provenance) {
    lines.push(generateProvenanceComments(provenance));
  }

  if (lectureNotes.course_code) {
    lines.push(`subtitle: "${escapeYaml(lectureNotes.course_code)}"`);
  }

  lines.push(`date: "${new Date().toISOString().split('T')[0]}"`);
  lines.push(`date-format: long`);

  // Author (placeholder for instructor)
  lines.push(`author: ""`);

  // Table of contents
  lines.push(`toc: true`);
  lines.push(`toc-depth: 3`);
  lines.push(`number-sections: true`);

  // Output formats
  lines.push(`format:`);

  if (formats.includes('html')) {
    lines.push(`  html:`);
    lines.push(`    theme: cosmo`);
    lines.push(`    code-fold: false`);
    lines.push(`    code-tools: true`);
    lines.push(`    code-line-numbers: true`);
    lines.push(`    highlight-style: github`);
    lines.push(`    self-contained: true`);
  }

  if (formats.includes('pdf')) {
    lines.push(`  pdf:`);
    lines.push(`    documentclass: article`);
    lines.push(`    papersize: letter`);
    lines.push(`    geometry:`);
    lines.push(`      - margin=1in`);
    lines.push(`    fontsize: 11pt`);
    lines.push(`    include-in-header:`);
    lines.push(`      text: |`);
    lines.push(`        \\usepackage{amsmath,amssymb,amsthm}`);
    lines.push(`        \\usepackage{mathtools}`);
    lines.push(`        \\newtheorem{theorem}{Theorem}`);
    lines.push(`        \\newtheorem{definition}{Definition}`);
    lines.push(`        \\newtheorem{lemma}{Lemma}`);
  }

  if (formats.includes('docx')) {
    lines.push(`  docx:`);
    lines.push(`    toc: true`);
    lines.push(`    number-sections: true`);
  }

  // Code execution settings
  lines.push(`execute:`);
  lines.push(`  echo: true`);
  lines.push(`  warning: false`);
  lines.push(`  message: false`);

  // Knitr/Jupyter settings based on language
  if (language === 'r') {
    lines.push(`knitr:`);
    lines.push(`  opts_chunk:`);
    lines.push(`    comment: "#>"`);
    lines.push(`    fig.align: center`);
    lines.push(`    fig.width: 8`);
    lines.push(`    fig.height: 5`);
  } else if (language === 'python') {
    lines.push(`jupyter: python3`);
  }

  // Custom metadata
  if (lectureNotes.level) {
    lines.push(`level: "${lectureNotes.level}"`);
  }

  if (lectureNotes.week) {
    lines.push(`week: ${lectureNotes.week}`);
  }

  lines.push('---');

  return lines.join('\n');
}

/**
 * Generate learning objectives section
 * @param {Array<string>} objectives - Learning objectives
 * @returns {string} Formatted objectives section
 */
function generateObjectivesSection(objectives) {
  if (!objectives || objectives.length === 0) {
    return '';
  }

  const lines = [];
  lines.push('::: {.callout-tip title="Learning Objectives"}');
  lines.push('');
  lines.push('By the end of this lecture, you should be able to:');
  lines.push('');

  objectives.forEach((obj, index) => {
    lines.push(`${index + 1}. ${obj}`);
  });

  lines.push('');
  lines.push(':::');

  return lines.join('\n');
}

/**
 * Format a section (recursive for subsections)
 * @param {Object} section - Section object
 * @param {string} language - Default code language
 * @param {number} depth - Current depth for heading level adjustment
 * @returns {string} Formatted section
 */
function formatSection(section, language, depth = 0) {
  const lines = [];

  // Generate heading
  const headingLevel = Math.min(section.level + depth, 6);
  const headingPrefix = '#'.repeat(headingLevel);
  lines.push(`${headingPrefix} ${section.title} {#sec-${section.id.toLowerCase()}}`);
  lines.push('');

  // Add content based on section type
  switch (section.type) {
    case 'definition':
      lines.push(formatDefinition(section));
      break;

    case 'theorem':
      lines.push(formatTheorem(section));
      break;

    case 'proof':
      lines.push(formatProof(section));
      break;

    case 'example':
      lines.push(formatExample(section, language));
      break;

    case 'code':
      lines.push(formatCodeSection(section, language));
      break;

    case 'practice':
      lines.push(formatPractice(section));
      break;

    default:
      lines.push(formatGenericSection(section, language));
  }

  // Add subsections
  if (section.subsections && section.subsections.length > 0) {
    for (const subsection of section.subsections) {
      lines.push('');
      lines.push(formatSection(subsection, language, depth));
    }
  }

  return lines.join('\n');
}

/**
 * Format a definition section
 * @param {Object} section - Section object
 * @returns {string} Formatted definition
 */
function formatDefinition(section) {
  const lines = [];

  lines.push('::: {#def-' + section.id.toLowerCase() + ' .callout-note title="Definition"}');

  if (section.content) {
    lines.push('');
    lines.push(section.content);
  }

  if (section.math) {
    lines.push('');
    lines.push('$$');
    lines.push(section.math);
    lines.push('$$');
  }

  lines.push(':::');

  return lines.join('\n');
}

/**
 * Format a theorem section
 * @param {Object} section - Section object
 * @returns {string} Formatted theorem
 */
function formatTheorem(section) {
  const lines = [];

  lines.push('::: {#thm-' + section.id.toLowerCase() + ' .callout-important title="Theorem"}');

  if (section.content) {
    lines.push('');
    lines.push(section.content);
  }

  if (section.math) {
    lines.push('');
    lines.push('$$');
    lines.push(section.math);
    lines.push('$$');
  }

  lines.push(':::');

  return lines.join('\n');
}

/**
 * Format a proof section
 * @param {Object} section - Section object
 * @returns {string} Formatted proof
 */
function formatProof(section) {
  const lines = [];

  lines.push('::: {.proof}');

  if (section.content) {
    lines.push('');
    lines.push(section.content);
  }

  if (section.math) {
    lines.push('');
    lines.push('$$');
    lines.push(section.math);
    lines.push('$$');
  }

  lines.push(':::');

  return lines.join('\n');
}

/**
 * Format an example section
 * @param {Object} section - Section object
 * @param {string} language - Default code language
 * @returns {string} Formatted example
 */
function formatExample(section, language) {
  const lines = [];

  lines.push('::: {.callout-note title="Example" icon="false"}');

  if (section.content) {
    lines.push('');
    lines.push(section.content);
  }

  if (section.math) {
    lines.push('');
    lines.push('$$');
    lines.push(section.math);
    lines.push('$$');
  }

  lines.push(':::');

  // Add code block outside the callout
  if (section.code) {
    lines.push('');
    lines.push(formatCodeBlock(section.code, language));
  }

  return lines.join('\n');
}

/**
 * Format a code section
 * @param {Object} section - Section object
 * @param {string} language - Default code language
 * @returns {string} Formatted code section
 */
function formatCodeSection(section, language) {
  const lines = [];

  if (section.content) {
    lines.push(section.content);
    lines.push('');
  }

  if (section.code) {
    lines.push(formatCodeBlock(section.code, language));
  }

  return lines.join('\n');
}

/**
 * Format a code block
 * @param {Object} code - Code object
 * @param {string} defaultLanguage - Default language
 * @returns {string} Formatted code block
 */
function formatCodeBlock(code, defaultLanguage) {
  const lines = [];
  const lang = code.language || defaultLanguage;

  // Build code chunk options
  const chunkOptions = [];
  if (code.label) {
    chunkOptions.push(`#| label: ${code.label}`);
  }
  if (code.echo === false) {
    chunkOptions.push(`#| echo: false`);
  }
  if (code.eval === false) {
    chunkOptions.push(`#| eval: false`);
  }

  lines.push('```{' + lang + '}');
  if (chunkOptions.length > 0) {
    lines.push(chunkOptions.join('\n'));
  }
  lines.push(code.source);
  lines.push('```');

  return lines.join('\n');
}

/**
 * Format a practice section
 * @param {Object} section - Section object
 * @returns {string} Formatted practice section
 */
function formatPractice(section) {
  const lines = [];

  if (section.content) {
    lines.push(section.content);
    lines.push('');
  }

  if (section.problems && section.problems.length > 0) {
    section.problems.forEach((problem, index) => {
      // Problem
      lines.push(`**Problem ${index + 1}** ${problem.difficulty ? `(${problem.difficulty})` : ''}`);
      lines.push('');
      lines.push(problem.text);
      lines.push('');

      // Hint (collapsible)
      if (problem.hint) {
        lines.push('::: {.callout-tip title="Hint" collapse="true"}');
        lines.push(problem.hint);
        lines.push(':::');
        lines.push('');
      }

      // Solution (collapsible)
      if (problem.solution) {
        lines.push('::: {.callout-note title="Solution" collapse="true"}');
        lines.push(problem.solution);
        lines.push(':::');
        lines.push('');
      }
    });
  }

  return lines.join('\n');
}

/**
 * Format a generic section
 * @param {Object} section - Section object
 * @param {string} language - Default code language
 * @returns {string} Formatted section
 */
function formatGenericSection(section, language) {
  const lines = [];

  // Main content
  if (section.content) {
    lines.push(section.content);
  }

  // Math
  if (section.math) {
    lines.push('');
    lines.push('$$');
    lines.push(section.math);
    lines.push('$$');
  }

  // Bullets
  if (section.bullets && section.bullets.length > 0) {
    lines.push('');
    section.bullets.forEach(bullet => {
      lines.push(`- ${bullet}`);
    });
  }

  // Callout
  if (section.callout) {
    lines.push('');
    lines.push(`::: {.callout-${section.callout.type || 'note'} title="${section.callout.title || ''}"}`);
    lines.push(section.callout.content);
    lines.push(':::');
  }

  // Code
  if (section.code) {
    lines.push('');
    lines.push(formatCodeBlock(section.code, language));
  }

  // Differentiation for cross-listed courses
  if (section.differentiation) {
    if (section.differentiation.undergraduate) {
      lines.push('');
      lines.push('::: {.callout-note title="Undergraduate Students"}');
      lines.push(section.differentiation.undergraduate);
      lines.push(':::');
    }
    if (section.differentiation.graduate) {
      lines.push('');
      lines.push('::: {.callout-important title="Graduate Students"}');
      lines.push(section.differentiation.graduate);
      lines.push(':::');
    }
  }

  return lines.join('\n');
}

/**
 * Generate references section
 * @param {Array<string>} references - Reference strings
 * @returns {string} Formatted references
 */
function generateReferencesSection(references) {
  const lines = [];

  lines.push('## References {.unnumbered}');
  lines.push('');

  references.forEach(ref => {
    lines.push(`- ${ref}`);
  });

  return lines.join('\n');
}

/**
 * Generate provenance metadata as YAML comments block
 *
 * These are placed inside the YAML frontmatter as comments (not keys)
 * so Quarto ignores them but humans/tools can read generation provenance.
 *
 * @param {Object} provenance - Provenance metadata
 * @param {string} provenance.generated - ISO timestamp
 * @param {string} provenance.scholar_version - Scholar plugin version
 * @param {string} provenance.prompt_template - Prompt template name
 * @param {string} provenance.config_source - Config file path
 * @param {string|null} provenance.lesson_plan - Lesson plan path
 * @param {string|null} provenance.teaching_style - Teaching style path
 * @param {string} provenance.generation_time - Time taken
 * @param {number} provenance.sections - Section count
 * @returns {string} YAML comments block
 */
function generateProvenanceComments(provenance) {
  const lines = [];
  lines.push('# --- Scholar Generation Metadata ---');
  lines.push(`# generated: ${provenance.generated}`);
  lines.push(`# scholar_version: ${provenance.scholar_version}`);
  lines.push(`# prompt_template: ${provenance.prompt_template}`);
  lines.push(`# config_source: ${provenance.config_source}`);

  if (provenance.lesson_plan) {
    lines.push(`# lesson_plan: ${provenance.lesson_plan}`);
  }
  if (provenance.teaching_style) {
    lines.push(`# teaching_style: ${provenance.teaching_style}`);
  }

  lines.push(`# generation_time: ${provenance.generation_time}`);
  lines.push(`# sections: ${provenance.sections}`);
  lines.push('# ---');

  return lines.join('\n');
}

/**
 * Escape special characters for YAML
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeYaml(str) {
  if (!str) return '';
  return str.replace(/"/g, '\\"');
}

// Export for testing
export {
  generateFrontmatter,
  generateProvenanceComments,
  generateObjectivesSection,
  formatSection,
  formatDefinition,
  formatTheorem,
  formatProof,
  formatExample,
  formatCodeSection,
  formatCodeBlock,
  formatPractice,
  formatGenericSection,
  generateReferencesSection,
  escapeYaml
};
