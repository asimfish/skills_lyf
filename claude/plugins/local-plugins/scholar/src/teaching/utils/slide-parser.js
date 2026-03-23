/**
 * Slide Deck Parser
 *
 * Parses Quarto (.qmd) slide decks into structured slides with type
 * classification. Wraps qmd-parser.js with slide-specific semantics.
 *
 * Used by:
 * - --revise: locate and replace targeted slides
 * - --check: validate slide structure and coverage
 *
 * Parsing strategy:
 * - Each ## heading = one slide
 * - Type classified via cascade: CSS classes → heading patterns → content heuristics
 * - Metadata extracted: hasCode, hasMath, CSS classes
 */

import { parseQmdContent, parseQmdFile } from './qmd-parser.js';
import { slugify } from './slugify.js';

// ─────────────────────────────────────────────────────────────
// CSS class → slide type mapping
// ─────────────────────────────────────────────────────────────

const CSS_TYPE_MAP = {
  'quiz-question':    'quiz',
  'section-slide':    'title',
  'practice-slide':   'practice',
  'definition-slide': 'definition',
  'theorem-slide':    'theorem',
  'example-slide':    'example',
  'summary-slide':    'summary',
  'discussion-slide': 'discussion',
};

// ─────────────────────────────────────────────────────────────
// Heading text → slide type patterns (order matters)
// ─────────────────────────────────────────────────────────────

const HEADING_PATTERNS = [
  { pattern: /^quiz[:\s]/i,                           type: 'quiz' },
  { pattern: /^(worked\s+)?example[:\s]/i,            type: 'example' },
  { pattern: /^(practice|try\s+it|your\s+turn)[:\s]/i, type: 'practice' },
  { pattern: /^(definition|def)[:\s]/i,               type: 'definition' },
  { pattern: /^theorem[:\s]/i,                        type: 'theorem' },
  { pattern: /^discussion[:\s]/i,                     type: 'discussion' },
  { pattern: /^(summary|key\s+takeaways?|takeaway|recap)$/i, type: 'summary' },
  { pattern: /^(summary|key\s+takeaways?|takeaway|recap)[:\s]/i, type: 'summary' },
  { pattern: /^(learning\s+objectives|objectives|goals)$/i,  type: 'objectives' },
  { pattern: /^(learning\s+objectives|objectives|goals)[:\s]/i, type: 'objectives' },
  { pattern: /^(questions|q&a)$/i,                    type: 'questions' },
  { pattern: /^(questions|q&a)[:\s]/i,                type: 'questions' },
];

// ─────────────────────────────────────────────────────────────
// CSS class extraction
// ─────────────────────────────────────────────────────────────

/**
 * Extract CSS classes from a heading line's attribute block.
 *
 * Quarto headings can end with `{.class-a .class-b #sec-id}`.
 * This function extracts only the dot-prefixed class names.
 *
 * @param {string} headingLine - Raw heading line (e.g., "## Title {.small-slide .quiz-question}")
 * @returns {string[]} Array of class names (without leading dots)
 */
export function extractCssClasses(headingLine) {
  // Match the trailing {...} block on the heading line
  const attrMatch = headingLine.match(/\{([^}]+)\}\s*$/);
  if (!attrMatch) return [];

  const attrContent = attrMatch[1];
  const classes = [];

  // Extract each .class-name token
  const classRegex = /\.([a-zA-Z][\w-]*)/g;
  let match;
  while ((match = classRegex.exec(attrContent)) !== null) {
    classes.push(match[1]);
  }

  return classes;
}

// ─────────────────────────────────────────────────────────────
// Clean title (strip attribute block from heading text)
// ─────────────────────────────────────────────────────────────

/**
 * Strip trailing Quarto attribute block from title text.
 *
 * The qmd-parser may include `{.class}` blocks in the title
 * (it only strips `{#id}` blocks). This cleans the title.
 *
 * @param {string} title - Raw title from parser
 * @returns {string} Cleaned title
 */
function cleanTitle(title) {
  return title.replace(/\s*\{[^}]*\}\s*$/, '').trim();
}

// ─────────────────────────────────────────────────────────────
// Type classification
// ─────────────────────────────────────────────────────────────

/**
 * Classify a slide's type using the cascade:
 * CSS classes → heading patterns → content heuristics → default
 *
 * @param {Object} section - Parsed section from qmd-parser
 * @param {number} index - 0-based slide index
 * @param {number} totalSlides - Total number of slides
 * @returns {string} Slide type string
 */
export function classifySlideType(section, index, _totalSlides) {
  // Get the raw heading line to extract CSS classes
  const headingLine = section.content.split('\n')[0];
  const classes = extractCssClasses(headingLine);

  // 1. CSS class cascade (highest priority)
  for (const cls of classes) {
    if (CSS_TYPE_MAP[cls]) {
      return CSS_TYPE_MAP[cls];
    }
  }

  // 2. Heading text patterns
  const title = cleanTitle(section.title);
  for (const { pattern, type } of HEADING_PATTERNS) {
    if (pattern.test(title)) {
      return type;
    }
  }

  // 3. Content heuristics
  const body = section.body || '';

  // Has quiz answer markers → quiz
  if (/\{\.correct\}/.test(body) || /\{\.incorrect\}/.test(body)) {
    return 'quiz';
  }

  // Has callout-important → definition
  if (/\{\.callout-important\}/.test(body)) {
    return 'definition';
  }

  // Has R/Python code block with echo: true → example
  if (hasCodeWithEcho(body)) {
    return 'example';
  }

  // First slide with very short body → title slide
  if (index === 0) {
    const bodyLines = body.split('\n').filter(l => l.trim().length > 0);
    if (bodyLines.length <= 3) {
      return 'title';
    }
  }

  // Title contains summary/takeaway keywords (looser match for heuristics)
  if (/summary|takeaway/i.test(title)) {
    return 'summary';
  }

  // 4. Default
  return 'content';
}

// ─────────────────────────────────────────────────────────────
// Content detection helpers
// ─────────────────────────────────────────────────────────────

/**
 * Check if body contains code blocks with echo: true
 * @param {string} body - Slide body content
 * @returns {boolean}
 */
function hasCodeWithEcho(body) {
  // Look for ```{r} or ```{python} blocks followed by #| echo: true
  const codeBlockRegex = /```\{(?:r|python)[^}]*\}[^\n]*\n(?:#\|[^\n]*\n)*#\|\s*echo:\s*true/i;
  return codeBlockRegex.test(body);
}

/**
 * Check if content has code blocks (``` markers).
 * @param {string} content - Slide content
 * @returns {boolean}
 */
function detectCode(content) {
  return /```/.test(content);
}

/**
 * Check if content has math expressions ($...$ or $$...$$),
 * excluding $ inside code blocks.
 *
 * @param {string} content - Slide content
 * @returns {boolean}
 */
function detectMath(content) {
  // Remove code blocks first, then check for $
  const withoutCode = content.replace(/```[\s\S]*?```/g, '');
  // Match $...$ (inline) or $$...$$ (display)
  return /\$\$?[^$]+\$\$?/.test(withoutCode);
}

// ─────────────────────────────────────────────────────────────
// Core slide parsing
// ─────────────────────────────────────────────────────────────

/**
 * Parse a structured QMD document into slides.
 *
 * Only level-2 (##) sections are treated as slides.
 * Subsections (###, etc.) are part of their parent slide's content.
 *
 * @param {import('./qmd-parser.js').ParsedQmd} parsedQmd - Output from parseQmdContent/parseQmdFile
 * @returns {Array<Object>} Array of slide objects
 */
export function parseSlides(parsedQmd) {
  // Collect only ## level sections (slides), preserving order
  const level2Sections = collectLevel2Sections(parsedQmd.sections);

  const totalSlides = level2Sections.length;

  return level2Sections.map((section, index) => {
    const headingLine = section.content.split('\n')[0];
    const classes = extractCssClasses(headingLine);
    const title = cleanTitle(section.title);

    return {
      number: index + 1,
      type: classifySlideType(section, index, totalSlides),
      title,
      sectionTitle: findParentSectionTitle(parsedQmd.sections, section),
      startLine: section.startLine,
      endLine: section.endLine,
      content: section.content,
      body: section.body,
      classes,
      hasCode: detectCode(section.content),
      hasMath: detectMath(section.content),
      headingId: section.headingId || '',
    };
  });
}

/**
 * Collect all level-2 sections from the section tree in document order.
 *
 * If the tree has level-1 sections with level-2 subsections,
 * we collect the level-2 subsections. If the tree already starts
 * at level 2 (no level-1 parents), we collect those directly.
 *
 * @param {Array} sections - Top-level sections from qmd-parser
 * @returns {Array} Flat list of level-2 sections in document order
 */
function collectLevel2Sections(sections) {
  const result = [];

  for (const section of sections) {
    if (section.level === 2) {
      result.push(section);
    } else if (section.level === 1 && section.subsections) {
      // Level 1 section: collect its level-2 children
      for (const sub of section.subsections) {
        if (sub.level === 2) {
          result.push(sub);
        }
      }
    }
  }

  return result;
}

/**
 * Find the parent level-1 section title for a given level-2 section.
 *
 * @param {Array} topSections - Top-level sections from parser
 * @param {Object} targetSection - The level-2 section to find the parent for
 * @returns {string} Parent section title, or the section's own title if no parent
 */
function findParentSectionTitle(topSections, targetSection) {
  for (const section of topSections) {
    if (section.level === 1 && section.subsections) {
      for (const sub of section.subsections) {
        if (sub.startLine === targetSection.startLine &&
            sub.title === targetSection.title) {
          return cleanTitle(section.title);
        }
      }
    }
  }
  // No level-1 parent found — use own title
  return cleanTitle(targetSection.title);
}

// ─────────────────────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────────────────────

/**
 * Parse QMD content string directly into slides.
 *
 * @param {string} qmdContent - Raw QMD content
 * @returns {{ slides: Array, parsed: import('./qmd-parser.js').ParsedQmd }}
 */
export function parseSlidesFromContent(qmdContent) {
  const parsed = parseQmdContent(qmdContent);
  const slides = parseSlides(parsed);
  return { slides, parsed };
}

/**
 * Parse a QMD file from disk into slides.
 *
 * @param {string} filePath - Path to .qmd file
 * @returns {{ slides: Array, parsed: import('./qmd-parser.js').ParsedQmd }}
 */
export function parseSlidesFromFile(filePath) {
  const parsed = parseQmdFile(filePath);
  const slides = parseSlides(parsed);
  return { slides, parsed };
}

// ─────────────────────────────────────────────────────────────
// Filter utilities
// ─────────────────────────────────────────────────────────────

/**
 * Filter slides by type.
 *
 * @param {Array} slides - Array of slide objects
 * @param {string} type - Slide type to filter for
 * @returns {Array} Matching slides
 */
export function filterByType(slides, type) {
  return slides.filter(s => s.type === type);
}

/**
 * Filter slides by number range (inclusive).
 *
 * @param {Array} slides - Array of slide objects
 * @param {number} start - Start slide number (1-based)
 * @param {number} end - End slide number (1-based, inclusive)
 * @returns {Array} Matching slides
 */
export function filterByRange(slides, start, end) {
  return slides.filter(s => s.number >= start && s.number <= end);
}

/**
 * Filter slides by parent section title using fuzzy matching.
 *
 * Uses slug-based fuzzy matching (same approach as qmd-parser's matchSection)
 * on the sectionTitle field.
 *
 * @param {Array} slides - Array of slide objects
 * @param {string} sectionTitle - Section title query
 * @returns {Array} Matching slides
 */
export function filterBySection(slides, sectionTitle) {
  const querySlug = slugify(sectionTitle);

  return slides.filter(s => {
    const slideSlug = slugify(s.sectionTitle);

    // Exact match
    if (slideSlug === querySlug) return true;

    // Fuzzy: query slug contained in section slug (same direction as matchSection)
    if (querySlug.length >= 4 && slideSlug.includes(querySlug)) return true;

    return false;
  });
}

/**
 * Get a summary of slide counts by type.
 *
 * @param {Array} slides - Array of slide objects
 * @returns {{ total: number, byType: Record<string, number> }}
 */
export function getSlideSummary(slides) {
  const byType = {};
  for (const slide of slides) {
    byType[slide.type] = (byType[slide.type] || 0) + 1;
  }
  return { total: slides.length, byType };
}
