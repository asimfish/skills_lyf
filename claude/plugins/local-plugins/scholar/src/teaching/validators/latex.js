/**
 * LaTeX Syntax Validator
 *
 * Validates LaTeX math syntax for common errors:
 * - Unbalanced delimiters ($, $$, \[, \])
 * - Unbalanced braces
 * - Invalid command syntax
 */

/**
 * LaTeX error structure
 * @typedef {Object} LatexError
 * @property {string} message - Error message
 * @property {number} position - Character position (if available)
 * @property {string} context - Surrounding text
 */

/**
 * Validate LaTeX syntax in a string
 * @param {string} text - Text to validate
 * @returns {Array<LatexError>} Array of LaTeX errors
 */
export function validateLatex(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const errors = [];

  // 1. Check for balanced inline math delimiters ($...$)
  errors.push(...checkInlineMath(text));

  // 2. Check for balanced display math delimiters ($$...$$, \[...\])
  errors.push(...checkDisplayMath(text));

  // 3. Check for unbalanced braces
  errors.push(...checkBraces(text));

  // 4. Check for common command errors
  errors.push(...checkCommands(text));

  // 5. Check for blank lines inside display math blocks (breaks LaTeX PDF)
  errors.push(...checkMathBlankLines(text));

  return errors;
}

/**
 * Check for balanced inline math delimiters ($...$)
 * @param {string} text - Text to check
 * @returns {Array<LatexError>} Errors found
 */
function checkInlineMath(text) {
  const errors = [];

  // Count single $ that aren't escaped or part of $$
  const dollars = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === '$') {
      // Check if escaped
      if (i > 0 && text[i - 1] === '\\') {
        i++;
        continue;
      }

      // Check if part of $$
      if (i + 1 < text.length && text[i + 1] === '$') {
        i += 2;
        continue;
      }

      dollars.push(i);
    }
    i++;
  }

  // Should have even number of $ delimiters
  if (dollars.length % 2 !== 0) {
    const lastPos = dollars[dollars.length - 1];
    errors.push({
      message: 'Unbalanced inline math delimiter ($)',
      position: lastPos,
      context: getContext(text, lastPos),
    });
  }

  return errors;
}

/**
 * Check for balanced display math delimiters ($$...$$ and \[...\])
 * @param {string} text - Text to check
 * @returns {Array<LatexError>} Errors found
 */
function checkDisplayMath(text) {
  const errors = [];

  // Check $$ pairs
  const doubleDollars = [];
  let i = 0;

  while (i < text.length - 1) {
    if (text[i] === '$' && text[i + 1] === '$') {
      // Check if escaped
      if (i > 0 && text[i - 1] === '\\') {
        i++;
        continue;
      }

      doubleDollars.push(i);
      i += 2;
    } else {
      i++;
    }
  }

  if (doubleDollars.length % 2 !== 0) {
    const lastPos = doubleDollars[doubleDollars.length - 1];
    errors.push({
      message: 'Unbalanced display math delimiter ($$)',
      position: lastPos,
      context: getContext(text, lastPos),
    });
  }

  // Check \[ ... \] pairs
  const openBrackets = [];
  const closeBrackets = [];

  for (let j = 0; j < text.length - 1; j++) {
    if (text[j] === '\\' && text[j + 1] === '[') {
      openBrackets.push(j);
    }
    if (text[j] === '\\' && text[j + 1] === ']') {
      closeBrackets.push(j);
    }
  }

  if (openBrackets.length !== closeBrackets.length) {
    errors.push({
      message: 'Unbalanced display math delimiters (\\[ ... \\])',
      position: openBrackets[openBrackets.length - 1] || closeBrackets[0],
      context: '',
    });
  }

  return errors;
}

/**
 * Check for unbalanced braces
 * @param {string} text - Text to check
 * @returns {Array<LatexError>} Errors found
 */
function checkBraces(text) {
  const errors = [];
  const stack = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Skip escaped braces
    if (i > 0 && text[i - 1] === '\\') {
      continue;
    }

    if (char === '{') {
      stack.push({ char, position: i });
    } else if (char === '}') {
      if (stack.length === 0) {
        errors.push({
          message: 'Unmatched closing brace',
          position: i,
          context: getContext(text, i),
        });
      } else {
        stack.pop();
      }
    }
  }

  // Check for unclosed braces
  if (stack.length > 0) {
    stack.forEach((brace) => {
      errors.push({
        message: 'Unmatched opening brace',
        position: brace.position,
        context: getContext(text, brace.position),
      });
    });
  }

  return errors;
}

/**
 * Check for common LaTeX command errors
 * @param {string} text - Text to check
 * @returns {Array<LatexError>} Errors found
 */
function checkCommands(text) {
  const errors = [];

  // Check for backslash followed by space (likely typo)
  const backslashSpace = /\\\s/g;
  let match;

  while ((match = backslashSpace.exec(text)) !== null) {
    // Allow \\ and \ at end of line
    if (match.index > 0 && text[match.index - 1] === '\\') {
      continue;
    }

    errors.push({
      message: 'Backslash followed by space (possible incomplete command)',
      position: match.index,
      context: getContext(text, match.index),
    });
  }

  // Check for common fraction errors
  const invalidFrac = /\\frac[^{]/g;
  while ((match = invalidFrac.exec(text)) !== null) {
    errors.push({
      message: 'Invalid \\frac syntax (expecting \\frac{numerator}{denominator})',
      position: match.index,
      context: getContext(text, match.index),
    });
  }

  return errors;
}

/**
 * Check for blank lines inside display math blocks ($$...$$)
 * Blank lines create paragraph breaks in LaTeX, exiting math mode
 * and causing "Missing $ inserted" errors. MathJax (HTML) tolerates them.
 * Note: Does not check \[...\] display math blocks (uncommon in generated content).
 * @param {string} text - Text to check
 * @returns {Array<LatexError>} Errors found
 */
function checkMathBlankLines(text) {
  const errors = [];
  const lines = text.split('\n');
  let inMath = false;
  let mathStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].trim();

    // Only matches $$ on its own line (multi-line display blocks, not inline $$...$$)
    if (stripped === '$$') {
      if (inMath) {
        inMath = false;
      } else {
        inMath = true;
        mathStartLine = i + 1;
      }
    } else if (inMath && stripped === '') {
      // Calculate character position for context
      let position = 0;
      for (let j = 0; j < i; j++) {
        position += lines[j].length + 1;
      }

      errors.push({
        message: `Blank line inside $$...$$ block (opened line ${mathStartLine}) — breaks LaTeX PDF`,
        position,
        context: `line ${i + 1} in math block starting at line ${mathStartLine}`,
      });
    }
  }

  return errors;
}

/**
 * Get context around a position in text
 * @param {string} text - Full text
 * @param {number} position - Position of error
 * @param {number} contextLength - Characters before/after (default: 20)
 * @returns {string} Context string
 */
function getContext(text, position, contextLength = 20) {
  const start = Math.max(0, position - contextLength);
  const end = Math.min(text.length, position + contextLength);

  let context = text.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context;
}

/**
 * Extract LaTeX math from text (inline and display)
 * @param {string} text - Text to extract from
 * @returns {Array<{type: string, content: string, position: number}>} Math blocks
 */
export function extractMath(text) {
  const blocks = [];
  let match;

  // Extract display math first ($$...$$) to avoid conflicts with inline
  const displayRegex = /(?<!\\)\$\$(.*?)(?<!\\)\$\$/gs;
  const displayMatches = [];
  while ((match = displayRegex.exec(text)) !== null) {
    displayMatches.push({
      type: 'display',
      content: match[1],
      position: match.index,
      end: match.index + match[0].length,
    });
  }

  // Extract \[...\]
  const bracketRegex = /\\\[(.*?)\\\]/gs;
  while ((match = bracketRegex.exec(text)) !== null) {
    displayMatches.push({
      type: 'display',
      content: match[1],
      position: match.index,
      end: match.index + match[0].length,
    });
  }

  // Extract inline math ($...$), but skip positions inside display math
  const inlineRegex = /(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    const position = match.index;
    const end = position + match[0].length;

    // Check if this position overlaps with display math
    const overlaps = displayMatches.some(
      (d) => (position >= d.position && position < d.end) || (end > d.position && end <= d.end)
    );

    if (!overlaps) {
      blocks.push({
        type: 'inline',
        content: match[1],
        position: position,
      });
    }
  }

  // Add display matches to blocks
  blocks.push(...displayMatches);

  // Sort by position
  blocks.sort((a, b) => a.position - b.position);

  // Remove 'end' property from display matches
  return blocks.map(({ type, content, position }) => ({ type, content, position }));
}

/**
 * Strip blank lines from inside display math blocks ($$...$$)
 * Auto-fix counterpart to checkMathBlankLines — silently cleans content.
 * @param {string} text - Text to clean
 * @returns {string} Text with blank lines removed from math blocks
 */
export function stripMathBlankLines(text) {
  if (!text || typeof text !== 'string') return text;

  const lines = text.split('\n');
  const result = [];
  let inMath = false;

  for (const line of lines) {
    const stripped = line.trim();

    // Only matches $$ on its own line (multi-line display blocks, not inline $$...$$)
    if (stripped === '$$') {
      inMath = !inMath;
      result.push(line);
    } else if (inMath && stripped === '') {
      // Skip blank lines inside math blocks
      continue;
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Check if text contains LaTeX math
 * @param {string} text - Text to check
 * @returns {boolean} True if contains LaTeX math
 */
export function hasLatex(text) {
  if (!text || typeof text !== 'string') return false;

  // Check for common LaTeX delimiters
  return (
    text.includes('$') ||
    text.includes('\\[') ||
    text.includes('\\]') ||
    text.includes('\\(') ||
    text.includes('\\)') ||
    /\\[a-zA-Z]+/.test(text) // LaTeX command
  );
}
