/**
 * Slugify Utility for Teaching Commands
 *
 * Converts topic strings into URL/filename-safe slugs.
 * Used by lecture command for output filenames and by
 * dry-run utility for preview paths.
 */

/**
 * Convert a string to a filename-safe slug
 * @param {string} str - String to slugify
 * @returns {string} Slugified string (lowercase, hyphens only)
 * @example
 *   slugify("Multiple Linear Regression") // "multiple-linear-regression"
 *   slugify("ANOVA (One-Way)") // "anova-one-way"
 *   slugify("  Week 03: RCBD  ") // "week-03-rcbd"
 */
export function slugify(str, maxLength = 80) {
  if (!str) return 'untitled';
  let result = str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!result) return 'untitled';
  // Truncate to maxLength, avoiding mid-word cuts
  if (result.length > maxLength) {
    result = result.substring(0, maxLength).replace(/-[^-]*$/, '');
  }
  return result || 'untitled';
}

/**
 * Generate output filename for lecture notes
 *
 * Naming convention:
 * - With --from-plan (weekNN): week{NN}-{slugified-topic}.qmd
 * - Without --from-plan: lecture-{slugified-topic}.qmd
 *
 * @param {Object} options - Command options
 * @param {string} options.topic - Lecture topic
 * @param {string} [options.fromPlan] - Lesson plan ID (e.g., "week08")
 * @returns {string} Filename (without directory)
 */
export function generateLectureFilename(options) {
  const topic = options.topic || options.fromPlan || 'untitled';
  const topicSlug = slugify(topic);

  if (options.fromPlan) {
    // Extract week number from plan ID (week08, week8, 8, etc.)
    const weekMatch = String(options.fromPlan).match(/(\d+)/);
    const weekNum = weekMatch ? weekMatch[1].padStart(2, '0') : '00';
    return `week${weekNum}-${topicSlug}.qmd`;
  }

  return `lecture-${topicSlug}.qmd`;
}
