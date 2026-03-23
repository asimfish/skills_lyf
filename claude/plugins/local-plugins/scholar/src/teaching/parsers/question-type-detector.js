/**
 * Question Type Detector for Examark/QTI Pipeline
 *
 * Classifies parsed question data into one of 10 examark question types.
 * Used when converting .qmd exam files (which lack explicit type tags)
 * into examark format (which requires them).
 *
 * @module question-type-detector
 */

/** Map from explicit type strings to examark tags */
const EXPLICIT_TYPE_MAP = {
  'multiple-choice': 'MC',
  'multiple-answer': 'MA',
  'true-false': 'TF',
  'short-answer': 'Short',
  'numerical': 'Numeric',
  'essay': 'Essay',
  'matching': 'Match',
  'fill-in-multiple-blanks': 'FMB',
  'fill-in-blank': 'FIB',
  'file-upload': 'Upload',
};

/** Reverse map from examark tags to internal type strings */
const TAG_TO_TYPE_MAP = Object.fromEntries(
  Object.entries(EXPLICIT_TYPE_MAP).map(([k, v]) => [v, k])
);

/** Patterns in question text that suggest a numerical answer */
const NUMERIC_PATTERNS = [
  /\bcalculate\b/i,
  /\bcompute\b/i,
  /\bfind the value\b/i,
  /\bhow many\b/i,
  /\bwhat is the numerical\b/i,
];

/** Recognized True/False option pairs (normalized to lowercase) */
const TF_PAIRS = [
  ['true', 'false'],
  ['t', 'f'],
  ['yes', 'no'],
];

/** Pattern matching blank placeholders in question text */
const BLANK_PATTERN = /\[blank\d*\]|\[___\]/gi;

/** Short answer text length threshold */
const SHORT_ANSWER_MAX_LENGTH = 200;

/**
 * Detect the examark question type from question metadata.
 *
 * Applies detection rules in priority order:
 * 1. Explicit type override
 * 2. File upload flag
 * 3. Matching pairs
 * 4. Fill-in-multiple-blanks (2+ blanks)
 * 5. Fill-in-blank (1 blank)
 * 6. True/False (2 options matching TF patterns)
 * 7. Multiple Answer (selectMultiple or multiple correctAnswers)
 * 8. Multiple Choice (non-empty options array)
 * 9. Numerical (keyword heuristics or answerType)
 * 10. Short Answer (brief text, no options)
 * 11. Default: Essay
 *
 * @param {Object} question - Parsed question object
 * @param {string} question.text - Question text
 * @param {Array} [question.options] - Answer options (if present)
 * @param {Array} [question.pairs] - Matching pairs (if present)
 * @param {Object} [question.blanks] - Blank markers (if present)
 * @param {boolean} [question.hasFileUpload] - Upload indicator
 * @param {string} [question.explicitType] - Explicitly stated type (if any)
 * @param {boolean} [question.selectMultiple] - Multiple selection indicator
 * @param {Array} [question.correctAnswers] - Array of correct answer indices
 * @param {string} [question.answerType] - Expected answer type ('number', etc.)
 * @returns {string} Examark type: 'MC', 'MA', 'TF', 'Short', 'Numeric', 'Essay', 'Match', 'FMB', 'FIB', 'Upload'
 */
export function detectQuestionType(question) {
  // 1. Explicit type override
  if (question.explicitType && EXPLICIT_TYPE_MAP[question.explicitType]) {
    return EXPLICIT_TYPE_MAP[question.explicitType];
  }

  // 2. File upload
  if (question.hasFileUpload) {
    return 'Upload';
  }

  // 3. Matching pairs
  if (Array.isArray(question.pairs) && question.pairs.length > 0) {
    return 'Match';
  }

  // 4 & 5. Fill-in-blank detection
  const text = question.text || '';
  const blankMatches = text.match(BLANK_PATTERN);
  if (blankMatches) {
    if (blankMatches.length >= 2) {
      return 'FMB';
    }
    return 'FIB';
  }

  // 6. True/False detection
  const options = question.options;
  if (Array.isArray(options) && options.length === 2) {
    const normalized = options.map((opt) =>
      (typeof opt === 'string' ? opt : String(opt)).trim().toLowerCase()
    );
    const isTF = TF_PAIRS.some(
      (pair) =>
        (normalized[0] === pair[0] && normalized[1] === pair[1]) ||
        (normalized[0] === pair[1] && normalized[1] === pair[0])
    );
    if (isTF) {
      return 'TF';
    }
  }

  // 7. Multiple Answer
  if (Array.isArray(options) && options.length > 0) {
    if (question.selectMultiple) {
      return 'MA';
    }
    if (
      Array.isArray(question.correctAnswers) &&
      question.correctAnswers.length > 1
    ) {
      return 'MA';
    }

    // 8. Multiple Choice (options present, not TF or MA)
    return 'MC';
  }

  // 9. Numerical detection
  if (question.answerType === 'number') {
    return 'Numeric';
  }
  const hasNumericKeyword = NUMERIC_PATTERNS.some((pattern) =>
    pattern.test(text)
  );
  if (hasNumericKeyword) {
    return 'Numeric';
  }

  // 10. Short Answer (brief text, no options)
  if (text.length > 0 && text.length < SHORT_ANSWER_MAX_LENGTH) {
    return 'Short';
  }

  // 11. Default: Essay
  return 'Essay';
}

/**
 * Map internal question type string to examark tag.
 *
 * @param {string} type - Internal type name (e.g. 'multiple-choice')
 * @returns {string} Examark tag (e.g. 'MC')
 * @throws {Error} If the type is not recognized
 */
export function typeToTag(type) {
  const tag = EXPLICIT_TYPE_MAP[type];
  if (!tag) {
    throw new Error(`Unknown question type: "${type}"`);
  }
  return tag;
}

/**
 * Map examark tag to internal question type string.
 *
 * @param {string} tag - Examark tag (e.g. 'MC', 'MA', etc.)
 * @returns {string} Internal type name (e.g. 'multiple-choice')
 * @throws {Error} If the tag is not recognized
 */
export function tagToType(tag) {
  const type = TAG_TO_TYPE_MAP[tag];
  if (!type) {
    throw new Error(`Unknown examark tag: "${tag}"`);
  }
  return type;
}
