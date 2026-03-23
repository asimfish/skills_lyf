/**
 * QMD Exam Parser
 *
 * Converts .qmd exam files into a JSON structure compatible with
 * ExamarkFormatter.format(). Builds on the structural qmd-parser
 * which parses QMD files into sections/subsections.
 *
 * @module qmd-exam
 */

import { readFileSync } from 'fs';
import { parseQmdContent } from '../utils/qmd-parser.js';
import { detectQuestionType } from './question-type-detector.js';

/** Examark tag to internal type name mapping */
const TAG_TO_TYPE = {
  MC: 'multiple-choice',
  MA: 'multiple-answer',
  TF: 'true-false',
  Short: 'short-answer',
  Numeric: 'numerical',
  Essay: 'essay',
  Match: 'matching',
  FMB: 'fill-in-multiple-blanks',
  FIB: 'fill-in-blank',
  Upload: 'file-upload',
};

/**
 * Parse a QMD exam file into the ExamarkFormatter input format.
 *
 * @param {string} filePath - Path to .qmd exam file
 * @param {Object} [options={}] - Parser options
 * @param {boolean} [options.splitParts=true] - Split multi-part questions into separate entries
 * @param {string} [options.defaultType='Essay'] - Fallback type when detection fails
 * @param {number} [options.defaultPoints=1] - Points when none specified
 * @returns {Object} Exam object compatible with ExamarkFormatter.format()
 */
export function parseExamFile(filePath, options = {}) {
  const content = readFileSync(filePath, 'utf-8');
  return parseExamContent(content, options);
}

/**
 * Parse QMD exam content string into the ExamarkFormatter input format.
 *
 * @param {string} content - Raw QMD string
 * @param {Object} [options={}] - Parser options
 * @param {boolean} [options.splitParts=true] - Split multi-part questions into separate entries
 * @param {string} [options.defaultType='Essay'] - Fallback examark tag when detection fails
 * @param {number} [options.defaultPoints=1] - Points when none specified
 * @returns {Object} Exam object: { title, total_points, instructions, questions, answer_key }
 */
export function parseExamContent(content, options = {}) {
  const {
    splitParts = true,
    defaultType = 'Essay',
    defaultPoints = 1,
  } = options;

  const parsed = parseQmdContent(content);

  // Extract title: prefer H1 heading, fall back to frontmatter title
  let title = '';
  const h1Section = parsed.sections.find((s) => s.level === 1);
  if (h1Section) {
    title = h1Section.title;
  } else if (parsed.frontmatter) {
    const titleMatch = parsed.frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) {
      title = titleMatch[1];
    }
  }

  // Extract instructions: preamble text, or body of H1 before first ## question
  let instructions = '';
  if (h1Section) {
    // Body of H1 section, excluding subsections
    const bodyLines = h1Section.body.split('\n');
    const instrLines = [];
    for (const line of bodyLines) {
      if (line.match(/^##\s+/)) break;
      instrLines.push(line);
    }
    instructions = instrLines.join('\n').trim();
  } else if (parsed.preamble) {
    instructions = parsed.preamble;
  }

  // Find question sections (## level)
  const questionSections = findQuestionSections(parsed.sections);

  const questions = [];
  const answerKey = {};
  let questionCounter = 0;

  for (let i = 0; i < questionSections.length; i++) {
    const section = questionSections[i];
    const sectionName = section._sectionName || null;
    const result = parseQuestion(section, questionCounter, { splitParts, defaultType, defaultPoints });

    if (Array.isArray(result)) {
      // Multi-part split into separate questions
      for (const q of result) {
        questionCounter++;
        const id = `Q${questionCounter}`;
        q.id = id;
        if (sectionName) q.sectionName = sectionName;
        questions.push(q);
        answerKey[id] = q._answer !== undefined ? q._answer : null;
        delete q._answer;
      }
    } else {
      questionCounter++;
      const id = `Q${questionCounter}`;
      result.id = id;
      if (sectionName) result.sectionName = sectionName;
      questions.push(result);
      answerKey[id] = result._answer !== undefined ? result._answer : null;
      delete result._answer;
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return {
    title,
    total_points: totalPoints,
    instructions,
    questions,
    answer_key: answerKey,
  };
}

/**
 * Find all level-2 sections that represent questions.
 * Handles both flat structure (all ## under document) and
 * nested structure (## under a # heading).
 *
 * @param {Array} sections - Parsed sections from qmd-parser
 * @returns {Array} Flat array of level-2 sections
 */
function findQuestionSections(sections) {
  const result = [];

  // Count H1 sections — only propagate section names when there are 2+
  // (a single H1 is the exam title, not a section divider)
  const h1Sections = sections.filter(s => s.level === 1);
  const hasSections = h1Sections.length >= 2;

  for (const section of sections) {
    if (section.level === 2) {
      result.push(section);
    } else if (section.level === 1 && section.subsections) {
      // Nested under H1 — collect level 2 subsections
      for (const sub of section.subsections) {
        if (sub.level === 2) {
          if (hasSections) {
            sub._sectionName = section.title;
          }
          result.push(sub);
        }
      }
    }
  }
  return result;
}

/**
 * Parse a single ## section into one or more question objects.
 *
 * @param {Object} section - Parsed section from qmd-parser
 * @param {number} index - Running question counter (for sub-part IDs)
 * @param {Object} opts - Parser options
 * @returns {Object|Array} Single question object or array of sub-questions
 */
export function parseQuestion(section, index, opts = {}) {
  const { splitParts = true, defaultType = 'Essay', defaultPoints = 1 } = opts;

  // 1. Extract points from title
  const { points, cleanTitle } = extractPointsFromTitle(section.title);
  const questionPoints = points !== null ? points : defaultPoints;

  const body = section.body || '';

  // 2. Check for sub-parts first
  const subParts = extractSubParts(body, splitParts);
  if (subParts !== null) {
    if (splitParts && subParts.length > 0) {
      // Return array of sub-questions
      return subParts.map((part) => {
        return buildQuestionFromBody(part.text, part.points || Math.round(questionPoints / subParts.length), defaultType);
      });
    }
  }

  // 3. Build single question
  const question = buildQuestionFromBody(body, questionPoints, defaultType);
  return question;
}

/**
 * Build a question object from body text by extracting all components.
 *
 * @param {string} body - Question body text
 * @param {number} points - Point value
 * @param {string} defaultType - Default examark tag
 * @returns {Object} Question object with _answer for answer_key
 */
function buildQuestionFromBody(body, points, defaultType) {
  // Extract matching pairs
  const matchingResult = extractMatchingPairs(body);
  let workingBody = matchingResult ? matchingResult.remainingText : body;

  // Extract blanks
  const blanks = extractBlanks(workingBody);
  if (blanks) {
    // Remove blank definition lines from working body
    workingBody = workingBody.replace(/^\[blank\d+\]:\s*.+$/gm, '').trim();
  }

  // Extract answer
  const answerResult = extractAnswer(workingBody);
  if (answerResult.remainingText !== undefined) {
    workingBody = answerResult.remainingText;
  }

  // Extract options
  const optionsResult = extractOptions(workingBody);
  const optionsList = optionsResult.options;
  const correctFromOptions = optionsResult.correctAnswers;
  const questionText = optionsResult.remainingText.trim();

  // Build detection input
  const detectionInput = {
    text: questionText,
    options: optionsList.length > 0 ? optionsList : undefined,
    pairs: matchingResult ? matchingResult.pairs : undefined,
    blanks: blanks || undefined,
    correctAnswers: correctFromOptions.length > 1 ? correctFromOptions : undefined,
  };

  // Detect type
  const tag = detectQuestionType(detectionInput) || defaultType;
  const typeName = TAG_TO_TYPE[tag] || 'essay';

  // Build answer value
  let answer = null;
  if (tag === 'MC') {
    answer = resolveMultipleChoiceAnswer(answerResult.value, correctFromOptions, optionsList);
  } else if (tag === 'MA') {
    answer = resolveMultipleAnswerAnswer(correctFromOptions, optionsList);
  } else if (tag === 'TF') {
    answer = resolveTrueFalseAnswer(answerResult.value, correctFromOptions, optionsList);
  } else if (tag === 'Match') {
    // Matching — no single answer, null
    answer = null;
  } else if (tag === 'FMB') {
    answer = blanks || null;
  } else if (tag === 'FIB') {
    if (blanks) {
      const keys = Object.keys(blanks);
      answer = keys.length > 0 ? blanks[keys[0]] : null;
    } else {
      answer = answerResult.value || null;
    }
  } else if (tag === 'Essay' || tag === 'Upload') {
    answer = null;
  } else {
    // Short, Numeric
    answer = answerResult.value || null;
  }

  const question = {
    type: typeName,
    text: questionText,
    points,
    _answer: answer,
  };

  if (optionsList.length > 0) {
    question.options = optionsList;
  }

  if (matchingResult && matchingResult.pairs.length > 0) {
    question.pairs = matchingResult.pairs;
  }

  if (tag === 'Upload') {
    question.hasFileUpload = true;
  }

  // Extract image references
  const images = extractImages(body);
  if (images.length > 0) {
    question.images = images;
  }

  return question;
}

/**
 * Extract point values from a section title.
 *
 * Supported patterns:
 * - [10 pts], [10pts], [10 points]
 * - (10 pts), (10 points)
 * - "10 points" at end of title
 *
 * @param {string} title - Section heading text
 * @returns {{ points: number|null, cleanTitle: string }}
 */
export function extractPointsFromTitle(title) {
  // [N pts], [Npts], [N points]
  let match = title.match(/\[(\d+)\s*(?:pts?|points?)\]/i);
  if (match) {
    return {
      points: parseInt(match[1], 10),
      cleanTitle: title.replace(match[0], '').trim(),
    };
  }

  // (N pts), (N points)
  match = title.match(/\((\d+)\s*(?:pts?|points?)\)/i);
  if (match) {
    return {
      points: parseInt(match[1], 10),
      cleanTitle: title.replace(match[0], '').trim(),
    };
  }

  // N points at end of title
  match = title.match(/(\d+)\s+points?\s*$/i);
  if (match) {
    return {
      points: parseInt(match[1], 10),
      cleanTitle: title.replace(match[0], '').trim(),
    };
  }

  return { points: null, cleanTitle: title };
}

/**
 * Extract lettered options from question body text.
 *
 * Supported patterns:
 * - a) Option text, b) Option text
 * - a. Option text
 * - (a) Option text
 * - Correct answer markers: [x] suffix, **bold** option, checkmark
 *
 * @param {string} body - Question body text
 * @returns {{ options: string[], correctAnswers: number[], remainingText: string }}
 */
export function extractOptions(body) {
  const lines = body.split('\n');
  const options = [];
  const correctAnswers = [];
  const nonOptionLines = [];
  let inOptions = false;

  // Patterns for option lines
  const optionPattern = /^(?:\(?([a-zA-Z])\)|([a-zA-Z])[).])[\s]+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(optionPattern);

    if (match) {
      inOptions = true;
      let optionText = match[3].trim();
      let isCorrect = false;

      // Check for [x] marker
      if (optionText.match(/\[x\]\s*$/i)) {
        isCorrect = true;
        optionText = optionText.replace(/\s*\[x\]\s*$/i, '').trim();
      }

      // Check for checkmark
      if (optionText.match(/[✓✔]\s*$/)) {
        isCorrect = true;
        optionText = optionText.replace(/\s*[✓✔]\s*$/, '').trim();
      }

      // Check for **bold** wrapping (entire option is bold = correct)
      if (optionText.match(/^\*\*(.+)\*\*$/)) {
        isCorrect = true;
        optionText = optionText.replace(/^\*\*(.+)\*\*$/, '$1');
      }

      if (isCorrect) {
        correctAnswers.push(options.length);
      }
      options.push(optionText);
    } else {
      if (!inOptions) {
        nonOptionLines.push(line);
      } else if (trimmed === '') {
        // Blank line after options — could be end of options section
        continue;
      } else {
        // Non-option line after options started — probably not an option
        nonOptionLines.push(line);
      }
    }
  }

  return {
    options,
    correctAnswers,
    remainingText: nonOptionLines.join('\n').trim(),
  };
}

/**
 * Extract answer/solution block from question body.
 *
 * Supported patterns:
 * - **Answer:** X
 * - **Solution:** X
 * - > Answer: X
 *
 * @param {string} body - Question body text
 * @returns {{ value: string|null, remainingText: string }}
 */
export function extractAnswer(body) {
  const lines = body.split('\n');
  const remaining = [];
  let answerValue = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // **Answer:** X or **Answer: X**
    let match = trimmed.match(/^\*\*(?:Answer|Solution):\*?\*?\s*(.*)$/i);
    if (match) {
      answerValue = match[1].trim() || null;
      continue;
    }

    // > Answer: X
    match = trimmed.match(/^>\s*(?:Answer|Solution):\s*(.*)$/i);
    if (match) {
      answerValue = match[1].trim() || null;
      continue;
    }

    remaining.push(line);
  }

  return {
    value: answerValue,
    remainingText: remaining.join('\n'),
  };
}

/**
 * Extract matching pairs from question body.
 *
 * Supported patterns:
 * - "- Left :: Right"
 * - "- Left => Right"
 * - "Left = Right" (examark format)
 *
 * @param {string} body - Question body text
 * @returns {{ pairs: Array<{left: string, right: string}>, remainingText: string }|null}
 */
export function extractMatchingPairs(body) {
  const lines = body.split('\n');
  const pairs = [];
  const remaining = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // - Left :: Right
    let match = trimmed.match(/^-\s+(.+?)\s+::\s+(.+)$/);
    if (match) {
      pairs.push({ left: match[1].trim(), right: match[2].trim() });
      continue;
    }

    // - Left => Right
    match = trimmed.match(/^-\s+(.+?)\s+=>\s+(.+)$/);
    if (match) {
      pairs.push({ left: match[1].trim(), right: match[2].trim() });
      continue;
    }

    // - Left = Right (leading dash required to avoid false-positives on equations)
    match = trimmed.match(/^-\s+([^=]+?)\s+=\s+([^=$]+)$/);
    if (match && !trimmed.includes('$')) {
      pairs.push({ left: match[1].trim(), right: match[2].trim() });
      continue;
    }

    remaining.push(line);
  }

  if (pairs.length === 0) return null;

  return {
    pairs,
    remainingText: remaining.join('\n'),
  };
}

/**
 * Extract fill-in-blank answers from question body.
 *
 * Supported patterns:
 * - [blank1]: answer1, answer2
 * - [blank2]: answer
 *
 * @param {string} body - Question body text
 * @returns {Object|null} Object mapping blank IDs to accepted answers, or null
 */
export function extractBlanks(body) {
  const lines = body.split('\n');
  const blanks = {};
  const blankDefPattern = /^\[(blank\d+)\]:\s*(.+)$/i;

  for (const line of lines) {
    const match = line.trim().match(blankDefPattern);
    if (match) {
      const id = match[1].toLowerCase();
      const answers = match[2].trim();
      // Take the first answer as the primary answer
      blanks[id] = answers.split(',')[0].trim();
    }
  }

  return Object.keys(blanks).length > 0 ? blanks : null;
}

/**
 * Extract image references from question body.
 *
 * Finds markdown image patterns: ![alt](path)
 *
 * @param {string} body - Question body text
 * @returns {Array<{alt: string, path: string}>} Array of image references
 */
export function extractImages(body) {
  const images = [];
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = pattern.exec(body)) !== null) {
    images.push({
      alt: match[1],
      path: match[2],
    });
  }

  return images;
}

/**
 * Extract and optionally split multi-part questions.
 *
 * Supported patterns:
 * - **(a)** [N pts] Text
 * - **(b)** Text
 * - (a) Text at start of line
 *
 * @param {string} body - Question body text
 * @param {boolean} splitParts - Whether to split into separate questions
 * @returns {Array|null} Array of sub-parts or null if no sub-parts found
 */
export function extractSubParts(body, splitParts) {
  const lines = body.split('\n');
  const parts = [];
  let currentPart = null;

  // Pattern: **(a)** [N pts] Text  or  **(a)** Text
  const partPattern = /^\*\*\(([a-z])\)\*\*\s*(?:\[(\d+)\s*(?:pts?|points?)\]\s*)?(.*)$/i;
  // Alternate pattern: (a) Text at start of line (without bold)
  const altPartPattern = /^\(([a-z])\)\s+(.+)$/i;

  for (const line of lines) {
    const trimmed = line.trim();

    let match = trimmed.match(partPattern);
    if (match) {
      if (currentPart) {
        parts.push(currentPart);
      }
      currentPart = {
        label: match[1],
        points: match[2] ? parseInt(match[2], 10) : null,
        text: match[3].trim(),
        lines: [match[3].trim()],
      };
      continue;
    }

    // Only try alternate pattern if we haven't found any bold-style parts
    if (parts.length === 0 && !currentPart) {
      match = trimmed.match(altPartPattern);
      if (match) {
        currentPart = {
          label: match[1],
          points: null,
          text: match[2].trim(),
          lines: [match[2].trim()],
        };
        continue;
      }
    }

    // Continuation line for current part
    if (currentPart && trimmed !== '') {
      currentPart.lines.push(trimmed);
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  if (parts.length < 2) return null;

  // Finalize text for each part
  for (const part of parts) {
    part.text = part.lines.join('\n');
    delete part.lines;
  }

  return parts;
}

/**
 * Resolve MC answer from answer text or correct option markers.
 * Returns single letter (A, B, C, ...).
 *
 * @param {string|null} answerText - Text from **Answer:** marker
 * @param {number[]} correctIndices - Indices of correct options from markers
 * @param {string[]} options - List of option texts
 * @returns {string|null}
 */
function resolveMultipleChoiceAnswer(answerText, correctIndices, options) {
  // From correct markers in options
  if (correctIndices.length === 1) {
    return String.fromCharCode(65 + correctIndices[0]); // A=65
  }

  if (!answerText) return null;

  // Answer text is a letter like "b" or "B"
  const letterMatch = answerText.match(/^([a-zA-Z])(?:\)|\.|$)/);
  if (letterMatch) {
    return letterMatch[1].toUpperCase();
  }

  // Answer text matches an option value — find the index
  const normalized = answerText.toLowerCase().replace(/^\w\)\s*/, '');
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase() === normalized) {
      return String.fromCharCode(65 + i);
    }
  }

  // Raw answer text (single letter)
  if (answerText.length === 1 && answerText.match(/[a-zA-Z]/)) {
    return answerText.toUpperCase();
  }

  return answerText;
}

/**
 * Resolve MA answer from correct option markers.
 * Returns array of letters.
 *
 * @param {number[]} correctIndices - Indices of correct options
 * @param {string[]} options - List of option texts
 * @returns {string[]|null}
 */
function resolveMultipleAnswerAnswer(correctIndices, options) {
  if (correctIndices.length > 0) {
    return correctIndices.map((i) => String.fromCharCode(65 + i));
  }
  return null;
}

/**
 * Resolve TF answer from answer text or correct option markers.
 * Returns 'True' or 'False'.
 *
 * @param {string|null} answerText - Text from **Answer:** marker
 * @param {number[]} correctIndices - Indices of correct options
 * @param {string[]} options - List of option texts
 * @returns {string|null}
 */
function resolveTrueFalseAnswer(answerText, correctIndices, options) {
  // From correct markers
  if (correctIndices.length === 1 && options.length === 2) {
    const selected = options[correctIndices[0]].toLowerCase().trim();
    if (selected === 'true' || selected === 't' || selected === 'yes') return 'True';
    if (selected === 'false' || selected === 'f' || selected === 'no') return 'False';
  }

  if (!answerText) return null;

  // Parse answer text
  const clean = answerText.replace(/^[a-zA-Z]\)\s*/, '').trim().toLowerCase();
  if (clean === 'true' || clean === 't' || clean === 'yes') return 'True';
  if (clean === 'false' || clean === 'f' || clean === 'no') return 'False';

  return null;
}
