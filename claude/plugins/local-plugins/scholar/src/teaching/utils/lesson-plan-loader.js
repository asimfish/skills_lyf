/**
 * Lesson Plan Loader
 *
 * Loads and parses lesson plan YAML files for --from-plan integration.
 * Supports:
 * - content/lesson-plans/weekNN.yml format
 * - IEEE LOM compliant metadata
 * - Extraction of learning objectives, topics, materials
 *
 * Used by lecture-notes.js generator to constrain AI generation
 * based on pre-defined lesson plan content.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import yaml from 'js-yaml';
import { findManifest, loadManifest, extractWeekFromManifest } from './manifest-loader.js';

/**
 * Default lesson plan directories to search
 */
const LESSON_PLAN_DIRS = [
  'content/lesson-plans',
  'lesson-plans',
  'content/plans',
  'plans'
];

/**
 * Find lesson plans directory in a course root
 * @param {string} courseRoot - Course root directory
 * @returns {string|null} Path to lesson plans directory or null
 */
export function findLessonPlansDir(courseRoot) {
  if (!courseRoot) return null;

  for (const dir of LESSON_PLAN_DIRS) {
    const fullPath = join(courseRoot, dir);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Parse week identifier from various formats
 * @param {string} weekId - Week identifier (e.g., "week03", "03", "3", "week-03")
 * @returns {number|null} Week number or null if invalid
 */
export function parseWeekId(weekId) {
  if (!weekId) return null;

  // If already a number
  if (typeof weekId === 'number') {
    return weekId > 0 ? weekId : null;
  }

  const str = String(weekId).toLowerCase().trim();

  // Match patterns: "week03", "week-03", "week_03", "w03", "03", "3"
  const patterns = [
    /^week[-_]?(\d+)$/,    // week03, week-03, week_03
    /^w(\d+)$/,            // w03
    /^(\d+)$/              // 03 or 3
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > 0 ? num : null;
    }
  }

  return null;
}

/**
 * Format week number to filename
 * @param {number} weekNum - Week number
 * @returns {string} Formatted filename (e.g., "week03.yml")
 */
export function formatWeekFilename(weekNum) {
  const paddedNum = String(weekNum).padStart(2, '0');
  return `week${paddedNum}.yml`;
}

/**
 * Find lesson plan file for a specific week
 * @param {string} plansDir - Lesson plans directory
 * @param {string|number} weekId - Week identifier
 * @returns {string|null} Path to lesson plan file or null
 */
export function findLessonPlanFile(plansDir, weekId) {
  const weekNum = parseWeekId(weekId);
  if (!weekNum || !plansDir) return null;

  // Try common filename patterns
  const filenames = [
    formatWeekFilename(weekNum),           // week03.yml
    `week${weekNum}.yml`,                  // week3.yml
    `week-${weekNum.toString().padStart(2, '0')}.yml`,  // week-03.yml
    `week_${weekNum.toString().padStart(2, '0')}.yml`   // week_03.yml
  ];

  for (const filename of filenames) {
    const fullPath = join(plansDir, filename);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Scan directory for matching week number
  try {
    const files = readdirSync(plansDir);
    for (const file of files) {
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        const match = file.match(/week[-_]?0*(\d+)\.(yml|yaml)$/i);
        if (match && parseInt(match[1], 10) === weekNum) {
          return join(plansDir, file);
        }
      }
    }
  } catch {
    // Directory read error, return null
  }

  return null;
}

/**
 * Load and parse a lesson plan YAML file
 * @param {string} filePath - Path to lesson plan file
 * @returns {Object|null} Parsed lesson plan or null
 */
export function loadLessonPlanFile(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const plan = yaml.load(content);

    if (!plan || typeof plan !== 'object') {
      return null;
    }

    // Add source file info
    plan._source = {
      file: filePath,
      filename: basename(filePath)
    };

    return plan;
  } catch (_error) {
    // YAML parse error or file read error
    return null;
  }
}

/**
 * Extract learning objectives from lesson plan
 * @param {Object} lessonPlan - Parsed lesson plan
 * @returns {Array<string>} Array of learning objective descriptions
 */
export function extractLearningObjectives(lessonPlan) {
  if (!lessonPlan?.learning_objectives) {
    return [];
  }

  return lessonPlan.learning_objectives.map(obj => {
    if (typeof obj === 'string') {
      return obj;
    }
    return obj.description || obj.text || obj.objective || String(obj);
  }).filter(Boolean);
}

/**
 * Extract topics from lesson plan
 * @param {Object} lessonPlan - Parsed lesson plan
 * @returns {Array<Object>} Array of topic objects with name and subtopics
 */
export function extractTopics(lessonPlan) {
  if (!lessonPlan?.topics) {
    return [];
  }

  return lessonPlan.topics.map(topic => {
    if (typeof topic === 'string') {
      return { name: topic, subtopics: [] };
    }

    return {
      id: topic.id || null,
      name: topic.name || topic.title || String(topic),
      subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
      prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : []
    };
  }).filter(t => t.name);
}

/**
 * Extract materials (readings, datasets, software) from lesson plan
 * @param {Object} lessonPlan - Parsed lesson plan
 * @returns {Object} Materials object with readings, datasets, software arrays
 */
export function extractMaterials(lessonPlan) {
  const materials = lessonPlan?.materials || {};

  return {
    readings: Array.isArray(materials.readings) ? materials.readings : [],
    datasets: Array.isArray(materials.datasets) ? materials.datasets : [],
    software: Array.isArray(materials.software) ? materials.software : []
  };
}

/**
 * Extract activities from lesson plan
 * @param {Object} lessonPlan - Parsed lesson plan
 * @returns {Array<Object>} Array of activity objects
 */
export function extractActivities(lessonPlan) {
  if (!lessonPlan?.activities) {
    return [];
  }

  return lessonPlan.activities.map(activity => ({
    id: activity.id || null,
    type: activity.type || 'unknown',
    title: activity.title || '',
    duration_minutes: activity.duration_minutes || null,
    description: activity.description || '',
    learning_objectives: Array.isArray(activity.learning_objectives) ? activity.learning_objectives : [],
    materials: Array.isArray(activity.materials) ? activity.materials : []
  }));
}

/**
 * Extract lecture structure from lesson plan
 * @param {Object} lessonPlan - Parsed lesson plan
 * @returns {Array<Object>} Array of lecture segment objects
 */
export function extractLectureStructure(lessonPlan) {
  if (!lessonPlan?.lecture_structure) {
    return [];
  }

  return lessonPlan.lecture_structure.map(segment => ({
    segment: segment.segment || segment.type || 'unknown',
    duration_minutes: segment.duration_minutes || null,
    content: segment.content || '',
    teaching_method: segment.teaching_method || null
  }));
}

/**
 * Get teaching style overrides from lesson plan
 * @param {Object} lessonPlan - Parsed lesson plan
 * @returns {Object|null} Teaching style overrides or null
 */
export function extractTeachingStyleOverrides(lessonPlan) {
  return lessonPlan?.teaching_style_overrides || null;
}

/**
 * Extract prompt_hints from a lesson plan week
 * @param {Object} weekPlan - Week plan data
 * @returns {Object|null} Prompt hints object or null
 */
export function extractPromptHints(weekPlan) {
  if (!weekPlan?.prompt_hints || typeof weekPlan.prompt_hints !== 'object') {
    return null;
  }
  return { ...weekPlan.prompt_hints };
}

/**
 * Validate lesson plan structure
 * @param {Object} lessonPlan - Parsed lesson plan
 * @returns {Object} Validation result { isValid, errors, warnings }
 */
export function validateLessonPlan(lessonPlan) {
  const errors = [];
  const warnings = [];

  if (!lessonPlan || typeof lessonPlan !== 'object') {
    errors.push('Lesson plan must be a valid YAML object');
    return { isValid: false, errors, warnings };
  }

  // Required fields
  if (!lessonPlan.week && !lessonPlan.title) {
    warnings.push('Lesson plan should have a week number or title');
  }

  // Learning objectives
  if (!lessonPlan.learning_objectives || !Array.isArray(lessonPlan.learning_objectives)) {
    warnings.push('Lesson plan has no learning_objectives array');
  } else if (lessonPlan.learning_objectives.length === 0) {
    warnings.push('Lesson plan learning_objectives array is empty');
  }

  // Topics
  if (!lessonPlan.topics || !Array.isArray(lessonPlan.topics)) {
    warnings.push('Lesson plan has no topics array');
  } else if (lessonPlan.topics.length === 0) {
    warnings.push('Lesson plan topics array is empty');
  }

  // Validate Bloom's taxonomy levels if present
  const validBloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  if (Array.isArray(lessonPlan.learning_objectives)) {
    for (const obj of lessonPlan.learning_objectives) {
      if (typeof obj === 'object' && obj.level) {
        if (!validBloomLevels.includes(obj.level.toLowerCase())) {
          warnings.push(`Unknown Bloom's taxonomy level: "${obj.level}". Valid: ${validBloomLevels.join(', ')}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Main loader function: Load lesson plan for --from-plan
 *
 * @param {Object} options - Loader options
 * @param {string} options.weekId - Week identifier (e.g., "week03", "3")
 * @param {string} options.courseRoot - Course root directory
 * @param {boolean} options.validate - Whether to validate (default: true)
 * @returns {Object} Result { plan, extracted, validation, source }
 */
export function loadLessonPlan({
  weekId,
  courseRoot,
  validate = true
} = {}) {
  // --- Check manifest first ---
  const manifestPath = findManifest(courseRoot);
  if (manifestPath) {
    const { manifest, warnings: manifestWarnings } = loadManifest(courseRoot, { validate });
    if (manifest) {
      const weekNum = parseWeekId(weekId);
      const weekEntry = extractWeekFromManifest(manifest, weekNum);
      if (weekEntry) {
        // Extract components from manifest week entry (same shape as directory load)
        const plan = { ...weekEntry };
        plan._source = 'manifest';
        plan._manifestPath = manifestPath;

        const extracted = {
          title: plan.title || `Week ${plan.week} Lesson`,
          week: plan.week || weekNum,
          learning_objectives: extractLearningObjectives(plan),
          topics: extractTopics(plan),
          materials: extractMaterials(plan),
          activities: extractActivities(plan),
          lecture_structure: extractLectureStructure(plan),
          teaching_style_overrides: extractTeachingStyleOverrides(plan),
          prompt_hints: extractPromptHints(plan)
        };

        const validation = validate ? validateLessonPlan(plan) : { isValid: true, errors: [], warnings: [] };
        // Add any manifest-level warnings
        if (manifestWarnings.length > 0) {
          validation.warnings.push(...manifestWarnings);
        }

        return {
          plan,
          extracted,
          validation,
          source: manifestPath
        };
      }
      // Week not found in manifest - fall through to directory scan
    }
  }

  // --- Directory scan fallback ---
  // Find lesson plans directory
  const plansDir = findLessonPlansDir(courseRoot);
  if (!plansDir) {
    return {
      plan: null,
      extracted: null,
      validation: { isValid: false, errors: ['No lesson plans directory found'], warnings: [] },
      source: null
    };
  }

  // Find lesson plan file
  const planFile = findLessonPlanFile(plansDir, weekId);
  if (!planFile) {
    const weekNum = parseWeekId(weekId);
    return {
      plan: null,
      extracted: null,
      validation: {
        isValid: false,
        errors: [`Lesson plan not found for week ${weekNum || weekId} in ${plansDir}`],
        warnings: []
      },
      source: null
    };
  }

  // Load and parse
  const plan = loadLessonPlanFile(planFile);
  if (!plan) {
    return {
      plan: null,
      extracted: null,
      validation: { isValid: false, errors: [`Failed to parse ${planFile}`], warnings: [] },
      source: planFile
    };
  }

  // Extract components
  const extracted = {
    title: plan.title || `Week ${plan.week} Lesson`,
    week: plan.week || parseWeekId(weekId),
    learning_objectives: extractLearningObjectives(plan),
    topics: extractTopics(plan),
    materials: extractMaterials(plan),
    activities: extractActivities(plan),
    lecture_structure: extractLectureStructure(plan),
    teaching_style_overrides: extractTeachingStyleOverrides(plan),
    prompt_hints: extractPromptHints(plan)
  };

  // Validate if requested
  const validation = validate ? validateLessonPlan(plan) : { isValid: true, errors: [], warnings: [] };

  return {
    plan,
    extracted,
    validation,
    source: planFile
  };
}

/**
 * Load context summaries from previous weeks for continuity.
 *
 * Used by --context=previous to inject prior week content into
 * the generation prompt so lectures naturally reference earlier material.
 *
 * @param {Object} options - Context options
 * @param {string|number} options.weekId - Current week ID
 * @param {string} options.courseRoot - Course root directory
 * @param {number} [options.count=3] - Number of previous weeks to load
 * @param {number} [options.maxTokensPerWeek=500] - Token budget per week (~4 chars/token)
 * @returns {Array<Object>} Array of { week, topic, objectives, keyConcepts, summary }
 */
export function loadPreviousWeekContext({
  weekId,
  courseRoot,
  count = 3,
  maxTokensPerWeek = 500
} = {}) {
  const currentWeek = parseWeekId(weekId);
  if (!currentWeek || currentWeek <= 1) return [];

  // --- Check manifest first ---
  const manifestPath = findManifest(courseRoot);
  if (manifestPath) {
    const { manifest } = loadManifest(courseRoot, { validate: false });
    if (manifest && Array.isArray(manifest.weeks)) {
      const contexts = [];
      const maxChars = maxTokensPerWeek * 4;

      for (let w = currentWeek - 1; w >= Math.max(1, currentWeek - count); w--) {
        const weekEntry = extractWeekFromManifest(manifest, w);
        if (!weekEntry) continue;

        const objectives = extractLearningObjectives(weekEntry);
        const topics = extractTopics(weekEntry);
        const topicNames = topics.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);

        const summaryParts = [];
        if (weekEntry.title) summaryParts.push(`Topic: ${weekEntry.title}`);
        if (objectives.length > 0) {
          summaryParts.push('Objectives: ' + objectives.slice(0, 4).join('; '));
        }
        if (topicNames.length > 0) {
          summaryParts.push('Key concepts: ' + topicNames.slice(0, 5).join(', '));
        }

        let summary = summaryParts.join('. ');
        if (summary.length > maxChars) {
          summary = summary.substring(0, maxChars - 3) + '...';
        }

        contexts.push({
          week: w,
          topic: weekEntry.title || `Week ${w}`,
          objectives: objectives.slice(0, 4),
          keyConcepts: topicNames.slice(0, 5),
          summary
        });
      }

      if (contexts.length > 0) {
        return contexts.reverse(); // chronological order
      }
      // No weeks found in manifest range - fall through to directory
    }
  }

  // --- Directory scan fallback ---
  const plansDir = findLessonPlansDir(courseRoot);
  if (!plansDir) return [];

  const contexts = [];
  const maxChars = maxTokensPerWeek * 4; // ~4 chars per token

  // Load weeks N-1, N-2, ..., N-count (most recent first)
  for (let w = currentWeek - 1; w >= Math.max(1, currentWeek - count); w--) {
    const planFile = findLessonPlanFile(plansDir, w);
    if (!planFile) continue;

    const plan = loadLessonPlanFile(planFile);
    if (!plan) continue;

    const objectives = extractLearningObjectives(plan);
    const topics = extractTopics(plan);
    const topicNames = topics.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);

    // Build summary, capped to token budget
    const summaryParts = [];
    if (plan.title) summaryParts.push(`Topic: ${plan.title}`);
    if (objectives.length > 0) {
      summaryParts.push('Objectives: ' + objectives.slice(0, 4).join('; '));
    }
    if (topicNames.length > 0) {
      summaryParts.push('Key concepts: ' + topicNames.slice(0, 5).join(', '));
    }

    let summary = summaryParts.join('. ');
    if (summary.length > maxChars) {
      summary = summary.substring(0, maxChars - 3) + '...';
    }

    contexts.push({
      week: w,
      topic: plan.title || `Week ${w}`,
      objectives: objectives.slice(0, 4),
      keyConcepts: topicNames.slice(0, 5),
      summary
    });
  }

  // Return in chronological order (oldest first)
  return contexts.reverse();
}

/**
 * Format previous week contexts into a prompt injection string
 * @param {Array<Object>} contexts - From loadPreviousWeekContext
 * @returns {string} Formatted context for prompt injection
 */
export function formatPreviousWeekContext(contexts) {
  if (!contexts || contexts.length === 0) return '';

  const lines = ['## Previous Weeks Context', ''];
  lines.push('The following topics were covered in recent weeks. Build on these concepts where appropriate.', '');

  for (const ctx of contexts) {
    lines.push(`### Week ${ctx.week}: ${ctx.topic}`);
    if (ctx.objectives.length > 0) {
      lines.push('Learning objectives:');
      ctx.objectives.forEach(o => lines.push(`- ${o}`));
    }
    if (ctx.keyConcepts.length > 0) {
      lines.push(`Key concepts: ${ctx.keyConcepts.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * List all available lesson plans in a course
 * @param {string} courseRoot - Course root directory
 * @returns {Array<Object>} Array of { week, title, file } objects
 */
export function listLessonPlans(courseRoot) {
  // --- Check manifest first ---
  const manifestPath = findManifest(courseRoot);
  if (manifestPath) {
    const { manifest } = loadManifest(courseRoot, { validate: false });
    if (manifest && Array.isArray(manifest.weeks) && manifest.weeks.length > 0) {
      return manifest.weeks
        .map(weekEntry => ({
          week: weekEntry.week,
          title: weekEntry.title || `Week ${weekEntry.week}`,
          file: null,
          path: manifestPath,
          has_objectives: Array.isArray(weekEntry.learning_objectives) && weekEntry.learning_objectives.length > 0,
          topics_count: Array.isArray(weekEntry.topics) ? weekEntry.topics.length : 0,
          status: weekEntry.status || 'draft',
          _source: 'manifest'
        }))
        .sort((a, b) => (a.week || 0) - (b.week || 0));
    }
  }

  // --- Directory scan fallback ---
  const plansDir = findLessonPlansDir(courseRoot);
  if (!plansDir) return [];

  const plans = [];

  try {
    const files = readdirSync(plansDir).sort();

    for (const file of files) {
      if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;

      const filePath = join(plansDir, file);
      const plan = loadLessonPlanFile(filePath);

      if (plan) {
        // Extract week number from filename if not in plan
        let weekNum = plan.week;
        if (!weekNum) {
          const match = file.match(/week[-_]?0*(\d+)/i);
          if (match) weekNum = parseInt(match[1], 10);
        }

        plans.push({
          week: weekNum,
          title: plan.title || `Week ${weekNum}`,
          file: file,
          path: filePath,
          has_objectives: Array.isArray(plan.learning_objectives) && plan.learning_objectives.length > 0,
          topics_count: Array.isArray(plan.topics) ? plan.topics.length : 0
        });
      }
    }
  } catch {
    // Directory read error
  }

  return plans.sort((a, b) => (a.week || 0) - (b.week || 0));
}

/**
 * Get summary of lesson plan for display
 * @param {Object} loadResult - Result from loadLessonPlan
 * @returns {string} Human-readable summary
 */
export function getLessonPlanSummary(loadResult) {
  const { extracted, source, validation } = loadResult;

  if (!extracted) {
    return 'No lesson plan loaded';
  }

  const lines = [
    `Lesson Plan: ${extracted.title}`,
    `  Week: ${extracted.week}`,
    `  Source: ${source}`,
    `  Learning Objectives: ${extracted.learning_objectives.length}`,
    `  Topics: ${extracted.topics.length}`
  ];

  if (extracted.activities.length > 0) {
    lines.push(`  Activities: ${extracted.activities.length}`);
  }

  if (validation.warnings.length > 0) {
    lines.push(`  Warnings: ${validation.warnings.length}`);
  }

  return lines.join('\n');
}
