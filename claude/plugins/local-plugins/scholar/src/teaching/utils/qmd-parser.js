/**
 * QMD Section Parser
 *
 * Parses Quarto (.qmd) documents into structured sections based on
 * markdown headings. Used by:
 * - --refine: locate and replace individual sections
 * - --check: extract section content for coverage validation
 *
 * Parsing strategy:
 * - Frontmatter: everything between first pair of ---
 * - Sections: split on ## headings (level 2) as primary boundaries
 * - Subsections: ### headings within a section
 */

import { readFileSync } from 'fs';
import { slugify } from './slugify.js';

/**
 * Parsed section from a QMD document
 * @typedef {Object} ParsedSection
 * @property {string} title - Section heading text (without # prefix)
 * @property {string} slug - Slugified title for matching
 * @property {number} level - Heading level (2 for ##, 3 for ###, etc.)
 * @property {number} startLine - Line index where heading appears (0-based)
 * @property {number} endLine - Line index of last line in section (exclusive)
 * @property {string} content - Full section text including heading
 * @property {string} body - Section text excluding heading line
 * @property {string} headingId - Quarto cross-ref ID if present (e.g., "sec-intro")
 * @property {ParsedSection[]} subsections - Nested subsections
 */

/**
 * Parsed QMD document
 * @typedef {Object} ParsedQmd
 * @property {string} frontmatter - Raw frontmatter YAML (without --- delimiters)
 * @property {number} frontmatterEndLine - Line after closing ---
 * @property {string} preamble - Content between frontmatter and first section
 * @property {ParsedSection[]} sections - Top-level sections
 * @property {string[]} lines - All lines of the document
 * @property {string} raw - Original file content
 */

/**
 * Parse a QMD file into structured sections
 * @param {string} filePath - Path to .qmd file
 * @returns {ParsedQmd} Parsed document structure
 */
export function parseQmdFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  return parseQmdContent(raw);
}

/**
 * Parse QMD content string into structured sections
 * @param {string} content - QMD document content
 * @returns {ParsedQmd} Parsed document structure
 */
export function parseQmdContent(content) {
  const lines = content.split('\n');

  // 1. Extract frontmatter
  const { frontmatter, endLine: frontmatterEndLine } = extractFrontmatter(lines);

  // 2. Find all headings after frontmatter
  const headings = findHeadings(lines, frontmatterEndLine);

  // 3. Extract preamble (content between frontmatter and first heading)
  const firstHeadingLine = headings.length > 0 ? headings[0].line : lines.length;
  const preamble = lines.slice(frontmatterEndLine, firstHeadingLine).join('\n').trim();

  // 4. Build section tree from headings
  const sections = buildSectionTree(lines, headings);

  return {
    frontmatter,
    frontmatterEndLine,
    preamble,
    sections,
    lines,
    raw: content
  };
}

/**
 * Extract YAML frontmatter from document lines
 * @param {string[]} lines - Document lines
 * @returns {{ frontmatter: string, endLine: number }}
 */
function extractFrontmatter(lines) {
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { frontmatter: '', endLine: 0 };
  }

  // Find closing ---
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return {
        frontmatter: lines.slice(1, i).join('\n'),
        endLine: i + 1
      };
    }
  }

  // No closing --- found
  return { frontmatter: '', endLine: 0 };
}

/**
 * Find all markdown headings in document, skipping fenced code blocks
 * @param {string[]} lines - Document lines
 * @param {number} startFrom - Line to start searching from
 * @returns {Array<{ line: number, level: number, title: string, headingId: string }>}
 */
function findHeadings(lines, startFrom = 0) {
  const headings = [];
  const headingRegex = /^(#{1,6})\s+(.+?)(?:\s+\{#([^}]+)\})?$/;
  let inCodeBlock = false;

  for (let i = startFrom; i < lines.length; i++) {
    // Toggle code block state on fenced code markers
    if (lines[i].trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines inside code blocks
    if (inCodeBlock) continue;

    const match = lines[i].match(headingRegex);
    if (match) {
      headings.push({
        line: i,
        level: match[1].length,
        title: match[2].trim(),
        headingId: match[3] || ''
      });
    }
  }

  return headings;
}

/**
 * Build hierarchical section tree from flat heading list
 * @param {string[]} lines - Document lines
 * @param {Array} headings - Flat heading list
 * @returns {ParsedSection[]} Tree of sections
 */
function buildSectionTree(lines, headings) {
  if (headings.length === 0) return [];

  const sections = [];
  let i = 0;

  while (i < headings.length) {
    const section = buildSection(lines, headings, i);
    sections.push(section.section);
    i = section.nextIndex;
  }

  return sections;
}

/**
 * Build a single section with its subsections
 * @param {string[]} lines - Document lines
 * @param {Array} headings - All headings
 * @param {number} index - Current heading index
 * @returns {{ section: ParsedSection, nextIndex: number }}
 */
function buildSection(lines, headings, index) {
  const heading = headings[index];
  const subsections = [];

  // Find where this section ends (next heading at same or higher level, or EOF)
  let endLine = lines.length;
  let nextIndex = index + 1;

  // Collect subsections (headings at deeper level)
  while (nextIndex < headings.length) {
    const next = headings[nextIndex];
    if (next.level <= heading.level) {
      // Same or higher level = end of this section
      endLine = next.line;
      break;
    }
    // Deeper heading = subsection
    const sub = buildSection(lines, headings, nextIndex);
    subsections.push(sub.section);
    nextIndex = sub.nextIndex;
  }

  // If we consumed all headings, end at EOF
  if (nextIndex >= headings.length) {
    endLine = lines.length;
  }

  const content = lines.slice(heading.line, endLine).join('\n');
  const body = lines.slice(heading.line + 1, endLine).join('\n').trim();

  return {
    section: {
      title: heading.title,
      slug: slugify(heading.title),
      level: heading.level,
      startLine: heading.line,
      endLine,
      content,
      body,
      headingId: heading.headingId,
      subsections
    },
    nextIndex
  };
}

/**
 * Match a query string against section titles using slug-based fuzzy matching
 *
 * Matching rules (from spec):
 * - slugify both query and section titles
 * - match if either slug contains the other
 *
 * @param {ParsedSection[]} sections - Sections to search
 * @param {string} query - Section title query
 * @returns {ParsedSection|null} Matched section or null
 */
export function matchSection(sections, query) {
  const querySlug = slugify(query);

  // Flatten all sections (including subsections) for searching
  const allSections = flattenSections(sections);

  // Exact slug match first
  const exact = allSections.find(s => s.slug === querySlug);
  if (exact) return exact;

  // Require minimum query length for fuzzy matching to prevent
  // overly broad matches (e.g., "and" matching "results-and-discussion")
  if (querySlug.length < 4) return null;

  // Fuzzy: query slug must be contained in section slug (one-directional)
  // This prevents short section slugs from matching long unrelated queries
  const fuzzyMatches = allSections.filter(s => s.slug.includes(querySlug));

  if (fuzzyMatches.length === 1) return fuzzyMatches[0];
  if (fuzzyMatches.length > 1) {
    // Multiple matches — warn and return the first (longest match wins)
    console.warn(
      `Warning: "${query}" matched ${fuzzyMatches.length} sections: ` +
      fuzzyMatches.map(s => `"${s.title}"`).join(', ') +
      '. Using first match. Use a more specific query to avoid ambiguity.'
    );
    return fuzzyMatches[0];
  }

  return null;
}

/**
 * Flatten nested sections into a flat array
 * @param {ParsedSection[]} sections - Nested sections
 * @returns {ParsedSection[]} Flat array of all sections
 */
export function flattenSections(sections) {
  const result = [];
  for (const section of sections) {
    result.push(section);
    if (section.subsections && section.subsections.length > 0) {
      result.push(...flattenSections(section.subsections));
    }
  }
  return result;
}

/**
 * Replace a section's content in the document
 * @param {string[]} lines - Original document lines
 * @param {ParsedSection} section - Section to replace
 * @param {string} newContent - New section content (including heading)
 * @returns {string} Updated document content
 */
export function replaceSection(lines, section, newContent) {
  const before = lines.slice(0, section.startLine);
  const after = lines.slice(section.endLine);
  const newLines = newContent.split('\n');

  return [...before, ...newLines, ...after].join('\n');
}

/**
 * List all section titles for user display (when no match found)
 * @param {ParsedSection[]} sections - Sections to list
 * @param {number} indent - Indentation level
 * @returns {string} Formatted section list
 */
export function listSections(sections, indent = 0) {
  const lines = [];
  const prefix = '  '.repeat(indent);

  for (const section of sections) {
    lines.push(`${prefix}- ${section.title}`);
    if (section.subsections && section.subsections.length > 0) {
      lines.push(listSections(section.subsections, indent + 1));
    }
  }

  return lines.join('\n');
}

/**
 * Extract provenance metadata from QMD frontmatter comments
 * @param {string} frontmatter - Raw frontmatter content
 * @returns {Object|null} Parsed provenance or null
 */
export function extractProvenance(frontmatter) {
  const metadataStart = frontmatter.indexOf('# --- Scholar Generation Metadata ---');
  if (metadataStart === -1) return null;

  const metadataEnd = frontmatter.indexOf('# ---', metadataStart + 36);
  if (metadataEnd === -1) return null;

  const metadataBlock = frontmatter.slice(metadataStart, metadataEnd + 5);
  const provenance = {};

  for (const line of metadataBlock.split('\n')) {
    const match = line.match(/^#\s+(\w+):\s+(.+)$/);
    if (match) {
      provenance[match[1]] = match[2].trim();
    }
  }

  return Object.keys(provenance).length > 0 ? provenance : null;
}

/**
 * Append a refinement record to provenance metadata in frontmatter
 * @param {string} frontmatter - Raw frontmatter content
 * @param {string} sectionTitle - Title of refined section (or "full" for global)
 * @param {string} date - ISO date string
 * @returns {string} Updated frontmatter
 */
export function appendRefinementRecord(frontmatter, sectionTitle, date) {
  const closingMarker = '# ---';
  const lastMarkerIdx = frontmatter.lastIndexOf(closingMarker);

  if (lastMarkerIdx === -1) {
    // No existing metadata block — warn and return unchanged
    console.warn('Warning: No Scholar Generation Metadata block found in frontmatter. Refinement record not appended.');
    return frontmatter;
  }

  const label = sectionTitle === 'full' ? 'full lecture' : `"${sectionTitle}"`;
  const dateStr = date.split('T')[0]; // YYYY-MM-DD
  const record = `# refined: ${label} on ${dateStr}`;

  // Insert before closing marker
  return (
    frontmatter.slice(0, lastMarkerIdx) +
    record + '\n' +
    frontmatter.slice(lastMarkerIdx)
  );
}
