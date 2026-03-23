/**
 * Lecture Coverage Validator
 *
 * Validates that a generated lecture covers all lesson plan objectives
 * and topics. Used by --check flag.
 *
 * Matching strategy:
 * - Fuzzy keyword matching (not exact string match)
 * - Each objective/topic checked against all section content
 * - Reports coverage percentage and specific gaps
 */

import {
  loadLessonPlan,
  extractLearningObjectives,
  extractTopics
} from '../utils/lesson-plan-loader.js';
import { parseQmdFile, flattenSections } from '../utils/qmd-parser.js';

/**
 * Coverage result for a single objective or topic
 * @typedef {Object} CoverageItem
 * @property {string} id - Item identifier (LO-N.N or topic name)
 * @property {string} description - Item description
 * @property {boolean} covered - Whether item is covered in lecture
 * @property {string[]} foundInSections - Section titles where found
 */

/**
 * Full coverage report
 * @typedef {Object} CoverageReport
 * @property {string} lectureFile - Path to lecture file
 * @property {string} lessonPlan - Path to lesson plan
 * @property {number} coveragePercent - Overall coverage percentage
 * @property {CoverageItem[]} objectives - Objective coverage details
 * @property {CoverageItem[]} topics - Topic coverage details
 * @property {string[]} gaps - Descriptions of uncovered items
 */

/**
 * Validate lecture coverage against a lesson plan
 * @param {Object} options - Validation options
 * @param {string} options.check - Path to .qmd file to validate
 * @param {string} options.fromPlan - Lesson plan week ID (e.g., "week08")
 * @param {string} [options.courseRoot] - Course root directory
 * @param {boolean} [options.debug] - Debug logging
 * @returns {CoverageReport} Coverage report
 */
export function validateCoverage(options) {
  if (!options.check) {
    throw new Error('--check requires a path to a .qmd file');
  }
  if (!options.fromPlan) {
    throw new Error('--check requires --from-plan to specify which lesson plan to validate against');
  }

  // 1. Parse the lecture
  const parsed = parseQmdFile(options.check);
  const allSections = flattenSections(parsed.sections);

  // Build searchable content from sections
  const sectionContents = allSections.map(s => ({
    title: s.title,
    slug: s.slug,
    searchText: (s.title + ' ' + s.body).toLowerCase()
  }));

  // 2. Load the lesson plan
  const courseRoot = options.courseRoot || process.cwd();
  const planResult = loadLessonPlan({
    weekId: options.fromPlan,
    courseRoot,
    validate: false
  });

  if (!planResult.plan) {
    throw new Error(`Lesson plan not found for ${options.fromPlan}`);
  }

  const objectives = extractLearningObjectives(planResult.plan);
  const topics = extractTopics(planResult.plan);

  // 3. Check objectives coverage
  const objectiveResults = objectives.map((obj, i) => {
    const desc = typeof obj === 'string' ? obj : obj.description || String(obj);
    const keywords = extractKeywords(desc);
    const foundIn = findMatchingSections(keywords, sectionContents);

    return {
      id: `LO-${planResult.extracted.week || '?'}.${i + 1}`,
      description: desc,
      covered: foundIn.length > 0,
      foundInSections: foundIn
    };
  });

  // 4. Check topics coverage
  const topicResults = topics.map(topic => {
    const name = typeof topic === 'string' ? topic : topic.name;
    const keywords = extractKeywords(name);

    // Also check subtopics
    const subtopicKeywords = (topic.subtopics || []).flatMap(st =>
      extractKeywords(typeof st === 'string' ? st : st.name || '')
    );

    const allKeywords = [...keywords, ...subtopicKeywords];
    const foundIn = findMatchingSections(allKeywords, sectionContents);

    return {
      id: name,
      description: name,
      covered: foundIn.length > 0,
      foundInSections: foundIn
    };
  });

  // 5. Calculate coverage
  const totalItems = objectiveResults.length + topicResults.length;
  const coveredItems = objectiveResults.filter(o => o.covered).length +
    topicResults.filter(t => t.covered).length;
  const coveragePercent = totalItems > 0 ? Math.round((coveredItems / totalItems) * 100) : 100;

  // 6. Identify gaps
  const gaps = [
    ...objectiveResults.filter(o => !o.covered).map(o => `${o.id}: ${o.description}`),
    ...topicResults.filter(t => !t.covered).map(t => `Topic: ${t.description}`)
  ];

  return {
    lectureFile: options.check,
    lessonPlan: planResult.source,
    coveragePercent,
    objectives: objectiveResults,
    topics: topicResults,
    gaps
  };
}

/**
 * Extract meaningful keywords from a description for fuzzy matching
 * Strips common words and returns content keywords
 * @param {string} text - Text to extract keywords from
 * @returns {string[]} Array of lowercase keywords
 */
function extractKeywords(text) {
  if (!text) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'because', 'about', 'up', 'out', 'if', 'its', 'it',
    'this', 'that', 'these', 'those', 'what', 'which', 'who',
    'understand', 'apply', 'analyze', 'evaluate', 'create', 'identify',
    'describe', 'explain', 'demonstrate', 'compare', 'interpret',
    'using', 'use', 'able', 'students'
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Find sections that match a set of keywords
 * A section matches if it contains at least half of the keywords
 * @param {string[]} keywords - Keywords to search for
 * @param {Array} sectionContents - Section content objects
 * @returns {string[]} Titles of matching sections
 */
function findMatchingSections(keywords, sectionContents) {
  if (keywords.length === 0) return [];

  const threshold = Math.max(1, Math.ceil(keywords.length / 2));
  const matches = [];

  for (const section of sectionContents) {
    const matchCount = keywords.filter(kw => section.searchText.includes(kw)).length;
    if (matchCount >= threshold) {
      matches.push(section.title);
    }
  }

  return matches;
}

/**
 * Format coverage report for terminal display
 * @param {CoverageReport} report - Coverage report
 * @returns {string} Formatted report string
 */
export function formatCoverageReport(report) {
  const lines = [];

  lines.push(`Coverage Report: ${report.lectureFile}`);
  lines.push(`vs ${report.lessonPlan}`);
  lines.push('─'.repeat(55));

  // Learning Objectives
  if (report.objectives.length > 0) {
    lines.push('');
    lines.push('Learning Objectives:');
    for (const obj of report.objectives) {
      const icon = obj.covered ? '[x]' : '[ ]';
      const sections = obj.covered ? `  (${obj.foundInSections.join(', ')})` : '  (NOT FOUND)';
      lines.push(`  ${icon} ${obj.id}: ${obj.description.substring(0, 50)}${sections}`);
    }
  }

  // Topics
  if (report.topics.length > 0) {
    lines.push('');
    lines.push('Topics:');
    for (const topic of report.topics) {
      const icon = topic.covered ? '[x]' : '[ ]';
      const sections = topic.covered ? `  (${topic.foundInSections.join(', ')})` : '  (NOT FOUND)';
      lines.push(`  ${icon} ${topic.description.substring(0, 50)}${sections}`);
    }
  }

  // Summary
  lines.push('');
  const total = report.objectives.length + report.topics.length;
  const covered = report.objectives.filter(o => o.covered).length +
    report.topics.filter(t => t.covered).length;
  lines.push(`Coverage: ${covered}/${total} (${report.coveragePercent}%)${report.gaps.length > 0 ? ` - ${report.gaps.length} gap(s) found` : ''}`);
  lines.push('');
  lines.push('Note: Coverage uses keyword matching (>=50% keyword overlap).');
  lines.push('Items marked covered may be partially addressed. Review flagged gaps manually.');

  return lines.join('\n');
}

// Export for testing
export {
  extractKeywords,
  findMatchingSections
};
