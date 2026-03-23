/**
 * Manifest generator for lesson plans
 *
 * Generates a complete lesson-plans.yml manifest from teach-config
 * topics, including draft stubs for unmapped weeks. Used by the
 * /teaching:demo command to scaffold full manifests.
 *
 * @module teaching/utils/manifest-generator
 */

import yaml from 'js-yaml';

/**
 * Default milestone weeks to skip during topic mapping
 */
const DEFAULT_MILESTONES = [
  { week: 8, type: 'midterm', label: 'Midterm Exam' },
  { week: 10, type: 'break', label: 'Spring Break' },
  { week: 16, type: 'final', label: 'Final Exam' }
];

/**
 * Generate a single draft stub entry for a topic.
 *
 * @param {number} weekNumber - Week number (1-based)
 * @param {string} topicTitle - Display title for the topic
 * @returns {{ week: number, title: string, status: string }}
 *
 * @example
 * const stub = generateDraftStub(4, 'Sampling Distributions');
 * // => { week: 4, title: 'Sampling Distributions', status: 'draft' }
 */
export function generateDraftStub(weekNumber, topicTitle) {
  return {
    week: weekNumber,
    title: topicTitle,
    status: 'draft'
  };
}

/**
 * Map teach-config topics to week numbers, skipping milestone weeks.
 *
 * Topics are assigned sequentially starting from startWeek,
 * but milestone weeks (midterm, break, final) are skipped.
 *
 * @param {string[]} topics - Array of topic title strings
 * @param {number} [startWeek=4] - First week number to assign
 * @param {Array} [milestones] - Milestone entries with { week, type, label }
 * @returns {Array<{ week: number, title: string }>}
 *
 * @example
 * const mapped = mapTopicsToWeeks(['A', 'B', 'C'], 4, [{ week: 5, type: 'break' }]);
 * // => [{ week: 4, title: 'A' }, { week: 6, title: 'B' }, { week: 7, title: 'C' }]
 */
export function mapTopicsToWeeks(topics, startWeek = 4, milestones = DEFAULT_MILESTONES) {
  if (!Array.isArray(topics) || topics.length === 0) return [];

  const milestoneWeeks = new Set(milestones.map(m => m.week));
  const mapped = [];
  let currentWeek = startWeek;

  for (const topic of topics) {
    // Skip milestone weeks
    while (milestoneWeeks.has(currentWeek)) {
      currentWeek++;
    }
    mapped.push({ week: currentWeek, title: topic });
    currentWeek++;
  }

  return mapped;
}

/**
 * Generate a full lesson-plans.yml manifest from teach-config topics.
 *
 * Merges existing detailed weeks (e.g., weeks 1-3 from the demo template)
 * with generated draft stubs for remaining topics.
 *
 * @param {Object} options
 * @param {Object} options.teachConfig - Parsed teach-config.yml (scholar.* section)
 * @param {number} [options.totalWeeks=15] - Total semester weeks
 * @param {string} [options.schedule='TR'] - Schedule pattern (e.g., 'TR', 'MWF')
 * @param {Array} [options.milestones] - Milestone entries
 * @param {Array} [options.existingWeeks=[]] - Pre-populated week entries (e.g., weeks 1-3 from demo)
 * @returns {{ manifest: Object, yaml: string }}
 *
 * @example
 * const { manifest, yaml } = generateManifestFromConfig({
 *   teachConfig: parsedConfig.scholar,
 *   existingWeeks: [week1, week2, week3]
 * });
 */
export function generateManifestFromConfig({
  teachConfig,
  totalWeeks = 15,
  schedule = 'TR',
  milestones = DEFAULT_MILESTONES,
  existingWeeks = []
} = {}) {
  // Extract topics from teach-config
  const topics = (teachConfig && teachConfig.topics) || [];

  // Determine what weeks are already populated
  const existingWeekNumbers = new Set(existingWeeks.map(w => w.week));

  // Find the first unoccupied week for topic assignment
  const maxExistingWeek = existingWeeks.length > 0
    ? Math.max(...existingWeeks.map(w => w.week))
    : 0;
  const startWeek = maxExistingWeek + 1;

  // Map remaining topics to weeks, skipping milestones
  const mappedTopics = mapTopicsToWeeks(topics, startWeek, milestones);

  // Generate draft stubs for mapped topics (skip if week already exists)
  const stubs = mappedTopics
    .filter(t => !existingWeekNumbers.has(t.week))
    .map(t => generateDraftStub(t.week, t.title));

  // Merge existing weeks + stubs, sort by week number
  const allWeeks = [...existingWeeks, ...stubs].sort((a, b) => a.week - b.week);

  // Build the manifest object
  const manifest = {
    schema_version: '1.0',
    semester: {
      total_weeks: totalWeeks,
      schedule,
      milestones: milestones.filter(m => m.week <= totalWeeks + 1)
    },
    weeks: allWeeks
  };

  // Generate YAML string
  const yamlContent = yaml.dump(manifest, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false
  });

  return { manifest, yaml: yamlContent };
}
