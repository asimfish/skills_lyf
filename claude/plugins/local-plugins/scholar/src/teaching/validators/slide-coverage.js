/**
 * Slide Coverage Validator (3-Layer)
 *
 * Validates slide decks against lesson plans using three layers:
 *   Layer 1: Coverage — are all objectives addressed?
 *   Layer 2: Structure — does the deck match expected ratios/counts?
 *   Layer 3: Style — does the deck follow teaching style rules?
 *
 * Used by: /teaching:slides --check
 *
 * Each layer produces a status (PASS/WARN/FAIL) and issues.
 * The overall status is the worst of the three layers.
 * A report formatter and --revise command generator are included.
 */

import { parseSlidesFromFile } from '../utils/slide-parser.js';
import { extractKeywords, findMatchingSections } from './lecture-coverage.js';
import { loadLessonPlan, extractLearningObjectives } from '../utils/lesson-plan-loader.js';
import { loadTeachConfig } from '../config/loader.js';

// ─────────────────────────────────────────────────────────────
// Constants & Defaults
// ─────────────────────────────────────────────────────────────

/**
 * Default structure config values (used when teach-config.yml
 * doesn't have a style.structure section)
 */
const STRUCTURE_DEFAULTS = {
  content_ratio: 0.70,
  practice_ratio: 0.15,
  minutes_per_slide: 2.5,
  tolerance: 0.20,
  quiz_per_section: 1
};

/**
 * Default style rules
 */
const STYLE_DEFAULTS = {
  strictness: 'advisory',
  rules: {
    math_notation: 'warn',
    code_visibility: 'warn',
    callout_usage: 'warn',
    dtslides_classes: 'warn',
    hand_calculations: 'warn'
  }
};

// ─────────────────────────────────────────────────────────────
// Layer 1: Coverage Validation
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CoverageItem
 * @property {string} id - Objective identifier
 * @property {string} description - Objective text
 * @property {boolean} covered - Whether objective is covered
 * @property {string[]} foundInSections - Section titles where found
 */

/**
 * @typedef {Object} CoverageResult
 * @property {'PASS'|'WARN'|'FAIL'} status
 * @property {CoverageItem[]} objectives
 * @property {number} coveragePercent
 */

/**
 * Validate that slides cover all lesson plan objectives.
 *
 * Groups slides by sectionTitle, concatenates content per section,
 * then checks each objective against section content via keyword matching.
 *
 * @param {Array} slides - Parsed slide objects from slide-parser
 * @param {Object} lessonPlan - Loaded lesson plan object
 * @returns {CoverageResult}
 */
export function validateSlideCoverage(slides, lessonPlan) {
  if (!slides || slides.length === 0) {
    return { status: 'FAIL', objectives: [], coveragePercent: 0 };
  }

  const objectives = extractLearningObjectives(lessonPlan);
  if (objectives.length === 0) {
    // No objectives to validate — pass by default
    return { status: 'PASS', objectives: [], coveragePercent: 100 };
  }

  // Group slides by sectionTitle → build searchable text per section
  const sectionMap = new Map();
  for (const slide of slides) {
    const key = slide.sectionTitle || 'Untitled';
    if (!sectionMap.has(key)) {
      sectionMap.set(key, []);
    }
    sectionMap.get(key).push(slide);
  }

  const sectionContents = [];
  for (const [title, sectionSlides] of sectionMap) {
    const searchText = sectionSlides
      .map(s => `${s.title} ${s.body || ''} ${s.content || ''}`)
      .join(' ')
      .toLowerCase();
    sectionContents.push({ title, searchText });
  }

  // Check each objective against section content
  const objectiveResults = objectives.map((obj, i) => {
    const desc = typeof obj === 'string' ? obj : obj.description || String(obj);
    const keywords = extractKeywords(desc);
    const foundIn = findMatchingSections(keywords, sectionContents);

    return {
      id: `LO-${i + 1}`,
      description: desc,
      covered: foundIn.length > 0,
      foundInSections: foundIn
    };
  });

  const coveredCount = objectiveResults.filter(o => o.covered).length;
  const totalCount = objectiveResults.length;
  const coveragePercent = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 100;

  let status;
  if (coveredCount === totalCount) {
    status = 'PASS';
  } else if (coveragePercent >= 50) {
    status = 'WARN';
  } else {
    status = 'FAIL';
  }

  return { status, objectives: objectiveResults, coveragePercent };
}

// ─────────────────────────────────────────────────────────────
// Layer 2: Structure Validation
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StructureIssue
 * @property {string} type - Issue type identifier
 * @property {string} message - Human-readable description
 * @property {string} [section] - Affected section title (for quiz_missing)
 */

/**
 * @typedef {Object} StructureMetric
 * @property {number|string} actual - Actual value
 * @property {number|string} expected - Expected value
 * @property {'PASS'|'WARN'} status
 */

/**
 * @typedef {Object} StructureMetrics
 * @property {StructureMetric} slideCount
 * @property {StructureMetric} contentRatio
 * @property {StructureMetric} practiceRatio
 * @property {{ missing: string[], status: 'PASS'|'WARN' }} quizPerSection
 */

/**
 * @typedef {Object} StructureResult
 * @property {'PASS'|'WARN'|'FAIL'} status
 * @property {StructureIssue[]} issues
 * @property {StructureMetrics} metrics
 */

/**
 * Validate slide deck structure against config defaults.
 *
 * Checks: slide count, content ratio, practice ratio, quiz per section.
 *
 * @param {Array} slides - Parsed slide objects
 * @param {Object} [config] - teach-config (falls back to STRUCTURE_DEFAULTS)
 * @param {number} [durationMinutes=50] - Lecture duration in minutes
 * @returns {StructureResult}
 */
export function validateSlideStructure(slides, config, durationMinutes = 50) {
  const structureConfig = config?.scholar?.style?.structure || STRUCTURE_DEFAULTS;
  const contentRatio = structureConfig.content_ratio ?? STRUCTURE_DEFAULTS.content_ratio;
  const practiceRatio = structureConfig.practice_ratio ?? STRUCTURE_DEFAULTS.practice_ratio;
  const minutesPerSlide = structureConfig.minutes_per_slide ?? STRUCTURE_DEFAULTS.minutes_per_slide;
  const tolerance = structureConfig.tolerance ?? STRUCTURE_DEFAULTS.tolerance;
  const quizPerSection = structureConfig.quiz_per_section ?? STRUCTURE_DEFAULTS.quiz_per_section;

  const issues = [];
  const total = slides.length;
  const expectedCount = Math.round(durationMinutes / minutesPerSlide);

  // ── Slide count ──
  const countDelta = Math.abs(total - expectedCount) / expectedCount;
  const slideCountStatus = countDelta <= tolerance ? 'PASS' : 'WARN';
  if (slideCountStatus === 'WARN') {
    issues.push({
      type: 'slide_count',
      message: `Slide count ${total} is outside tolerance of expected ~${expectedCount} (${durationMinutes} min / ${minutesPerSlide} min per slide)`
    });
  }

  // ── Content ratio ──
  const contentTypes = new Set(['content', 'definition', 'theorem', 'example']);
  const contentSlides = slides.filter(s => contentTypes.has(s.type)).length;
  const actualContentRatio = total > 0 ? contentSlides / total : 0;
  const contentRatioStatus = actualContentRatio >= (contentRatio - tolerance) ? 'PASS' : 'WARN';
  if (contentRatioStatus === 'WARN') {
    issues.push({
      type: 'content_low',
      message: `Content ratio ${(actualContentRatio * 100).toFixed(0)}% is below expected ~${(contentRatio * 100).toFixed(0)}% (min ${((contentRatio - tolerance) * 100).toFixed(0)}%)`
    });
  }

  // ── Practice ratio ──
  const practiceTypes = new Set(['practice', 'quiz', 'discussion']);
  const practiceSlides = slides.filter(s => practiceTypes.has(s.type)).length;
  const actualPracticeRatio = total > 0 ? practiceSlides / total : 0;
  const practiceRatioStatus = actualPracticeRatio >= (practiceRatio - tolerance) ? 'PASS' : 'WARN';
  if (practiceRatioStatus === 'WARN') {
    issues.push({
      type: 'practice_low',
      message: `Practice ratio ${(actualPracticeRatio * 100).toFixed(0)}% is below expected ~${(practiceRatio * 100).toFixed(0)}% (min ${((practiceRatio - tolerance) * 100).toFixed(0)}%)`
    });
  }

  // ── Quiz per section ──
  const missingSections = [];
  if (quizPerSection > 0) {
    const sectionMap = new Map();
    for (const slide of slides) {
      const key = slide.sectionTitle || 'Untitled';
      if (!sectionMap.has(key)) {
        sectionMap.set(key, []);
      }
      sectionMap.get(key).push(slide);
    }

    for (const [sectionTitle, sectionSlides] of sectionMap) {
      const quizCount = sectionSlides.filter(s => s.type === 'quiz').length;
      if (quizCount < quizPerSection) {
        missingSections.push(sectionTitle);
        issues.push({
          type: 'quiz_missing',
          section: sectionTitle,
          message: `Section "${sectionTitle}" has ${quizCount} quiz slide(s), expected >= ${quizPerSection}`
        });
      }
    }
  }

  const quizSectionStatus = missingSections.length === 0 ? 'PASS' : 'WARN';

  // ── Overall status ──
  const allStatuses = [slideCountStatus, contentRatioStatus, practiceRatioStatus, quizSectionStatus];
  const status = allStatuses.includes('FAIL') ? 'FAIL'
    : allStatuses.includes('WARN') ? 'WARN'
      : 'PASS';

  return {
    status,
    issues,
    metrics: {
      slideCount: {
        actual: total,
        expected: expectedCount,
        status: slideCountStatus
      },
      contentRatio: {
        actual: parseFloat(actualContentRatio.toFixed(2)),
        expected: contentRatio,
        status: contentRatioStatus
      },
      practiceRatio: {
        actual: parseFloat(actualPracticeRatio.toFixed(2)),
        expected: practiceRatio,
        status: practiceRatioStatus
      },
      quizPerSection: {
        missing: missingSections,
        status: quizSectionStatus
      }
    }
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 3: Style Validation
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StyleIssue
 * @property {string} rule - Rule identifier
 * @property {number} slideNumber - 1-based slide number
 * @property {string} slideTitle - Slide title
 * @property {string} message - Human-readable description
 * @property {string} fix - Suggested fix instruction
 * @property {'WARN'|'FAIL'} severity
 */

/**
 * @typedef {Object} StyleResult
 * @property {'PASS'|'WARN'|'FAIL'} status
 * @property {StyleIssue[]} issues
 * @property {string} strictness
 */

/**
 * Validate teaching style compliance.
 *
 * Rules checked:
 * 1. math_notation — math present when expected
 * 2. code_visibility — echo: consistency within slides
 * 3. callout_usage — definitions use callout wrappers
 * 4. dtslides_classes — dense slides use .small-slide
 * 5. hand_calculations — R output preceded by math derivation
 *
 * @param {Array} slides - Parsed slide objects
 * @param {Object} [config] - teach-config (falls back to STYLE_DEFAULTS)
 * @returns {StyleResult}
 */
export function validateSlideStyle(slides, config) {
  const styleConfig = config?.scholar?.style?.check || STYLE_DEFAULTS;
  const strictness = styleConfig.strictness || STYLE_DEFAULTS.strictness;
  const rules = { ...STYLE_DEFAULTS.rules, ...styleConfig.rules };
  const severity = strictness === 'strict' ? 'FAIL' : 'WARN';

  const issues = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const prevSlide = i > 0 ? slides[i - 1] : null;

    // ── Rule 1: math_notation ──
    if (rules.math_notation !== 'off') {
      // If config says math should be present and slide is content type but has no math
      if (config?.scholar?.style?.notation === 'statistical' &&
          slide.type === 'content' && !slide.hasMath) {
        // Only flag if the slide title suggests it should have math
        const mathKeywords = /equation|formula|model|regression|anova|variance|coefficient|statistic|distribution|hypothesis|theorem/i;
        if (mathKeywords.test(slide.title)) {
          issues.push({
            rule: 'math_notation',
            slideNumber: slide.number,
            slideTitle: slide.title,
            message: `Content slide "${slide.title}" likely needs LaTeX math notation`,
            fix: 'Add LaTeX math notation for the mathematical concept',
            severity
          });
        }
      }
    }

    // ── Rule 2: code_visibility ──
    if (rules.code_visibility !== 'off') {
      const body = slide.body || '';
      const echoTrue = (body.match(/#\|\s*echo:\s*true/gi) || []).length;
      const echoFalse = (body.match(/#\|\s*echo:\s*false/gi) || []).length;
      if (echoTrue > 0 && echoFalse > 0) {
        issues.push({
          rule: 'code_visibility',
          slideNumber: slide.number,
          slideTitle: slide.title,
          message: `Mixed echo: true/false in same slide "${slide.title}"`,
          fix: 'Use consistent echo: settings or split into separate slides',
          severity
        });
      }
    }

    // ── Rule 3: callout_usage ──
    if (rules.callout_usage !== 'off') {
      if (slide.type === 'definition') {
        const body = slide.body || '';
        const hasCallout = /\{\.callout-important\}/.test(body) || /:::\s*\{\.callout/.test(body);
        if (!hasCallout) {
          issues.push({
            rule: 'callout_usage',
            slideNumber: slide.number,
            slideTitle: slide.title,
            message: `Definition slide "${slide.title}" lacks {.callout-important} wrapper`,
            fix: `Wrap the definition in {.callout-important}`,
            severity
          });
        }
      }
    }

    // ── Rule 4: dtslides_classes ──
    if (rules.dtslides_classes !== 'off') {
      const body = slide.body || '';
      const nonEmptyLines = body.split('\n').filter(l => l.trim().length > 0);
      if (nonEmptyLines.length > 15) {
        const hasSmallSlide = slide.classes.includes('small-slide') ||
                              slide.classes.includes('smaller');
        if (!hasSmallSlide) {
          issues.push({
            rule: 'dtslides_classes',
            slideNumber: slide.number,
            slideTitle: slide.title,
            message: `Dense slide "${slide.title}" (${nonEmptyLines.length} lines) lacks {.small-slide} class`,
            fix: 'Add {.small-slide} class to the heading',
            severity
          });
        }
      }
    }

    // ── Rule 5: hand_calculations ──
    if (rules.hand_calculations !== 'off') {
      if (slide.hasCode && prevSlide) {
        // Check for echo: true in the body (this means R output is shown)
        const body = slide.body || '';
        const hasEchoTrue = /#\|\s*echo:\s*true/i.test(body);
        if (hasEchoTrue && !prevSlide.hasMath) {
          issues.push({
            rule: 'hand_calculations',
            slideNumber: slide.number,
            slideTitle: slide.title,
            message: `Slide "${slide.title}" shows R output without preceding hand calculation`,
            fix: 'Add hand calculation derivation before the R output',
            severity
          });
        }
      }
    }
  }

  // Overall status
  const status = issues.length === 0 ? 'PASS'
    : issues.some(i => i.severity === 'FAIL') ? 'FAIL'
      : 'WARN';

  return { status, issues, strictness };
}

// ─────────────────────────────────────────────────────────────
// Report Formatting
// ─────────────────────────────────────────────────────────────

/**
 * Format a slide check report for terminal display.
 *
 * @param {Object} results - Combined results from all three layers
 * @param {CoverageResult} results.coverage
 * @param {StructureResult} results.structure
 * @param {StyleResult} results.style
 * @param {string} results.overall - Overall status
 * @param {string} filePath - Path to the slide deck file
 * @param {string} [planTitle] - Lesson plan title
 * @returns {string} Formatted report
 */
export function formatSlideCheckReport(results, filePath, planTitle) {
  const lines = [];
  const { coverage, structure, style } = results;

  // Header
  lines.push(`=== Slide Check: ${filePath} ===`);
  if (planTitle) {
    lines.push(`Plan: ${planTitle}`);
  }
  lines.push('');

  // Coverage section
  const covObj = coverage.objectives;
  const covCount = covObj.filter(o => o.covered).length;
  const covTotal = covObj.length;
  const covLabel = covTotal > 0
    ? `COVERAGE (${covCount}/${covTotal} objectives)`
    : 'COVERAGE (no objectives)';
  lines.push(`${covLabel} ${'.'.repeat(Math.max(1, 50 - covLabel.length))} ${coverage.status}`);
  for (const obj of covObj) {
    const icon = obj.covered ? '[x]' : '[ ]';
    lines.push(`  ${icon} ${obj.description}`);
  }
  lines.push('');

  // Structure section
  const { metrics } = structure;
  lines.push(`STRUCTURE ${'.'.repeat(42)} ${structure.status}`);
  lines.push(`  Slide count: ${metrics.slideCount.actual} (expected ~${metrics.slideCount.expected}, ${metrics.slideCount.status === 'PASS' ? 'OK' : 'OUT OF RANGE'})`);
  lines.push(`  Content: ${(metrics.contentRatio.actual * 100).toFixed(0)}% (expected ~${(metrics.contentRatio.expected * 100).toFixed(0)}%, ${metrics.contentRatio.status === 'PASS' ? 'OK' : 'LOW'})`);
  lines.push(`  Practice: ${(metrics.practiceRatio.actual * 100).toFixed(0)}% (expected ~${(metrics.practiceRatio.expected * 100).toFixed(0)}%, ${metrics.practiceRatio.status === 'PASS' ? 'OK' : 'LOW'})`);
  if (metrics.quizPerSection.missing.length > 0) {
    lines.push(`  Quiz: missing in ${metrics.quizPerSection.missing.map(s => `"${s}"`).join(', ')}`);
  } else {
    lines.push('  Quiz: all sections covered');
  }
  lines.push('');

  // Style section
  lines.push(`STYLE (${style.strictness}) ${'.'.repeat(Math.max(1, 44 - style.strictness.length))} ${style.status}`);
  if (style.issues.length === 0) {
    lines.push('  All style rules pass');
  }
  for (const issue of style.issues) {
    const icon = issue.severity === 'FAIL' ? '[X]' : '[!]';
    lines.push(`  ${icon} ${issue.rule}: ${issue.message}`);
  }
  lines.push('');

  // Overall
  const totalIssues = structure.issues.length + style.issues.length +
    coverage.objectives.filter(o => !o.covered).length;
  lines.push(`Overall: ${results.overall}${totalIssues > 0 ? ` (${totalIssues} issue${totalIssues === 1 ? '' : 's'})` : ''}`);

  // Suggested --revise commands
  const commands = generateReviseCommands(results, filePath);
  if (commands.length > 0) {
    lines.push('');
    lines.push('Suggested fixes:');
    for (const cmd of commands) {
      lines.push(`  -> ${cmd}`);
    }
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// --revise Command Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate actionable --revise commands from validation results.
 *
 * @param {Object} results - Combined results from all three layers
 * @param {string} filePath - Path to the slide deck
 * @returns {string[]} Array of ready-to-run commands
 */
export function generateReviseCommands(results, filePath) {
  const commands = [];

  // Structure issues -> section-targeted commands
  for (const issue of results.structure.issues) {
    if (issue.type === 'practice_low') {
      commands.push(
        `/teaching:slides --revise ${filePath} --instruction "Add practice slides to improve engagement"`
      );
    }
    if (issue.type === 'quiz_missing') {
      commands.push(
        `/teaching:slides --revise ${filePath} --section "${issue.section}" --instruction "Add a quiz slide to test understanding"`
      );
    }
  }

  // Style issues -> slide-targeted commands
  for (const issue of results.style.issues) {
    commands.push(
      `/teaching:slides --revise ${filePath} --slides ${issue.slideNumber} --instruction "${issue.fix}"`
    );
  }

  return commands;
}

// ─────────────────────────────────────────────────────────────
// JSON Output
// ─────────────────────────────────────────────────────────────

/**
 * Format slide check results as a JSON-serializable object.
 *
 * @param {Object} results - Combined results from all three layers
 * @returns {Object} JSON-serializable result
 */
export function formatSlideCheckJson(results) {
  return {
    overall: results.overall,
    coverage: {
      status: results.coverage.status,
      coveragePercent: results.coverage.coveragePercent,
      objectives: results.coverage.objectives
    },
    structure: {
      status: results.structure.status,
      metrics: results.structure.metrics,
      issues: results.structure.issues
    },
    style: {
      status: results.style.status,
      strictness: results.style.strictness,
      issues: results.style.issues
    }
  };
}

// ─────────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────────

/**
 * Run all three validation layers on a slide deck.
 *
 * @param {Object} options
 * @param {string} options.check - Path to slide deck to validate
 * @param {string} options.fromPlan - Lesson plan week ID (e.g., "week03")
 * @param {string} [options.courseRoot] - Course root directory
 * @param {boolean} [options.json] - Output as JSON
 * @param {boolean} [options.debug] - Debug logging
 * @returns {Object} Combined results { coverage, structure, style, overall }
 */
export function validateSlideCheck(options) {
  if (!options.check) {
    throw new Error('--check requires a path to a slide deck file');
  }
  if (!options.fromPlan) {
    throw new Error('--check requires --from-plan to specify the lesson plan');
  }

  const debugLog = (msg) => {
    if (options.debug) {
      console.log(`[scholar:slide-check] ${msg}`);
    }
  };

  // 1. Parse the slide deck
  debugLog(`Parsing slide deck: ${options.check}`);
  const { slides } = parseSlidesFromFile(options.check);
  debugLog(`Found ${slides.length} slides`);

  // 2. Load lesson plan
  const courseRoot = options.courseRoot || process.cwd();
  debugLog(`Loading lesson plan: ${options.fromPlan} from ${courseRoot}`);
  const planResult = loadLessonPlan({
    weekId: options.fromPlan,
    courseRoot,
    validate: false
  });

  if (!planResult.plan) {
    throw new Error(`Lesson plan not found for ${options.fromPlan}`);
  }

  debugLog(`Lesson plan loaded: ${planResult.extracted.title}`);

  // 3. Load config
  const config = loadTeachConfig(courseRoot, { validate: false, debug: options.debug });
  const durationMinutes = options.duration || config?.scholar?.defaults?.duration || 50;

  // 4. Run three validation layers
  debugLog('Running Layer 1: Coverage');
  const coverage = validateSlideCoverage(slides, planResult.plan);
  debugLog(`Coverage: ${coverage.status} (${coverage.coveragePercent}%)`);

  debugLog('Running Layer 2: Structure');
  const structure = validateSlideStructure(slides, config, durationMinutes);
  debugLog(`Structure: ${structure.status} (${structure.issues.length} issues)`);

  debugLog('Running Layer 3: Style');
  const style = validateSlideStyle(slides, config);
  debugLog(`Style: ${style.status} (${style.issues.length} issues)`);

  // 5. Compute overall status (worst of three)
  const statuses = [coverage.status, structure.status, style.status];
  const overall = statuses.includes('FAIL') ? 'FAIL'
    : statuses.includes('WARN') ? 'WARN'
      : 'PASS';

  return {
    coverage,
    structure,
    style,
    overall,
    planTitle: planResult.extracted.title,
    filePath: options.check
  };
}
