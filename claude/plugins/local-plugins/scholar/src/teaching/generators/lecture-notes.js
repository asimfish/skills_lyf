/**
 * Lecture Notes Generator
 *
 * Generates comprehensive instructor-facing lecture notes (20-40 pages)
 * in Quarto format with executable code, LaTeX math, and practice problems.
 *
 * Uses Phase 0 foundation components:
 * - Template System for schema validation (lecture-notes.json)
 * - Config Loader for course settings + 4-layer teaching style
 * - Validator Engine for content validation
 * - AI Provider for section-by-section generation
 *
 * Generation Flow:
 * 1. Parse arguments & load config
 * 2. Generate outline (first API call)
 * 3. Generate sections (one API call per section)
 * 4. Assemble & format Quarto document
 * 5. Write output with metadata
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { loadTemplate } from '../templates/loader.js';
import { loadTeachConfig, findConfigFile } from '../config/loader.js';
import { loadTeachingStyle as loadTeachingStyleFromLayers } from '../config/style-loader.js';
import {
  loadLessonPlan as loadLessonPlanFromFile,
  getLessonPlanSummary,
  loadPreviousWeekContext,
  formatPreviousWeekContext
} from '../utils/lesson-plan-loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { AIProvider } from '../ai/provider.js';
import { formatLectureNotesAsQuarto } from '../formatters/quarto-notes.js';
import {
  buildOutlinePrompt,
  buildSectionPrompt,
  extractSectionSummary
} from '../ai/lecture-prompts.js';
import { PromptConfigBridge } from '../ai/prompt-config-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Lecture notes generation options
 * @typedef {Object} LectureNotesOptions
 * @property {string} topic - Main topic of the lecture
 * @property {string} fromPlan - Lesson plan to generate from (e.g., 'week03')
 * @property {string} output - Output directory path (legacy, use outputDir)
 * @property {string} outputDir - Output directory path
 * @property {boolean} force - Skip overwrite confirmation
 * @property {string} format - Quarto output formats (e.g., 'html,pdf,docx')
 * @property {string} language - Programming language for code (r, python)
 * @property {string} level - Course level override
 * @property {string} configPath - Explicit config file path (bypasses discovery)
 * @property {boolean} dryRun - Preview outline only
 * @property {boolean} json - Output dry-run as JSON
 * @property {boolean} debug - Enable debug logging
 */

/**
 * Section types with their characteristics
 */
const SECTION_TYPES = {
  introduction: { minPages: 1, maxPages: 3, hasCode: false, hasMath: false },
  concept: { minPages: 2, maxPages: 6, hasCode: false, hasMath: true },
  definition: { minPages: 0.5, maxPages: 2, hasCode: false, hasMath: true },
  theorem: { minPages: 1, maxPages: 3, hasCode: false, hasMath: true },
  proof: { minPages: 1, maxPages: 4, hasCode: false, hasMath: true },
  example: { minPages: 2, maxPages: 6, hasCode: true, hasMath: true },
  code: { minPages: 1, maxPages: 4, hasCode: true, hasMath: false },
  practice: { minPages: 2, maxPages: 5, hasCode: false, hasMath: true },
  discussion: { minPages: 0.5, maxPages: 2, hasCode: false, hasMath: false },
  summary: { minPages: 0.5, maxPages: 2, hasCode: false, hasMath: false }
};

/**
 * Progress callback for tracking generation status
 * @callback ProgressCallback
 * @param {Object} progress - Progress info
 * @param {string} progress.phase - Current phase (outline, sections)
 * @param {number} progress.current - Current item number
 * @param {number} progress.total - Total items
 * @param {string} progress.message - Status message
 * @param {number} progress.elapsed - Elapsed time in ms
 */

/**
 * Generate comprehensive lecture notes
 * @param {LectureNotesOptions} options - Generation options
 * @param {ProgressCallback} [onProgress] - Optional progress callback
 * @returns {Promise<Object>} Generated lecture notes with content and metadata
 */
export async function generateLectureNotes(options = {}, onProgress = null) {
  const startTime = Date.now();

  // Helper for progress reporting (verbose flag checked after options are loaded)
  const reportProgress = (phase, current, total, message, verbose = true) => {
    if (onProgress) {
      onProgress({
        phase,
        current,
        total,
        message,
        elapsed: Date.now() - startTime
      });
    }
    // Log to console only if verbose mode
    if (verbose) {
      if (phase === 'outline') {
        console.log(`📋 ${message}`);
      } else if (phase === 'sections') {
        const pct = Math.round((current / total) * 100);
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        console.log(`  [${current}/${total}] ${bar} ${pct}% ${message}`);
      }
    }
  };

  // 1. Load configuration (supports explicit --config path)
  const config = loadTeachConfig(process.cwd(), {
    configPath: options.configPath || null,
    debug: options.debug || false
  });
  const courseInfo = config.scholar?.course_info || {};

  // 2. Merge options with config defaults
  const configPath = findConfigFile(process.cwd());
  const lectureOptions = {
    topic: options.topic || '',
    fromPlan: options.fromPlan || null,
    outputDir: options.outputDir || options.output || null,
    force: options.force || false,
    format: options.format || 'html,pdf,docx',
    language: options.language || config.scholar?.defaults?.language || 'r',
    level: options.level || courseInfo.level || 'undergraduate',
    courseCode: courseInfo.code || '',
    courseName: courseInfo.title || '',
    field: courseInfo.field || 'statistics',
    debug: options.debug || false,
    verbose: options.verbose !== false,  // Default true for CLI, can disable for library use
    // --context flag: "previous" (default 3 weeks) or explicit count
    context: options.context || null,
    // Provenance tracking for metadata
    _configPath: configPath || null
  };

  // 3. Load lesson plan if specified (BEFORE teaching style for Layer 4 integration)
  let lessonPlan = null;
  if (lectureOptions.fromPlan) {
    lessonPlan = loadLessonPlan(lectureOptions.fromPlan, {
      verbose: lectureOptions.verbose,
      debug: lectureOptions.debug
    });
    if (!lectureOptions.topic && lessonPlan) {
      lectureOptions.topic = lessonPlan.topic;
    }
  }

  // 4. Load teaching style (4-layer system)
  // Pass lesson plan for Layer 4 (teaching_style_overrides from lesson plan)
  const teachingStyle = loadTeachingStyle(config, lectureOptions, lessonPlan);

  if (lectureOptions.debug) {
    console.log('[LectureNotes] Options:', JSON.stringify(lectureOptions, null, 2));
    console.log('[LectureNotes] Teaching Style:', JSON.stringify(teachingStyle, null, 2));
  }

  // 5. Load lecture-notes template schema
  const lectureNotesTemplate = loadTemplate('lecture-notes');

  // 6. Initialize AI Provider (with early API key validation)
  const apiKey = config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No API key found. Set ANTHROPIC_API_KEY environment variable or ' +
      'configure scholar.ai_generation.api_key in teach-config.yml'
    );
  }
  const ai = new AIProvider({
    apiKey,
    model: config.scholar?.ai_generation?.model || 'claude-sonnet-4-20250514',
    maxTokens: config.scholar?.ai_generation?.max_tokens || 8192,
    timeout: config.scholar?.ai_generation?.timeout || 60000,
    debug: lectureOptions.debug
  });

  // 7. Load previous week context if requested
  let previousWeekContext = null;
  if (lectureOptions.context && lessonPlan) {
    const contextCount = lectureOptions.context === 'previous'
      ? 3
      : Math.min(10, Math.max(1, parseInt(lectureOptions.context, 10) || 3));

    const courseRoot = dirname(dirname(lectureOptions._configPath || process.cwd()));
    previousWeekContext = loadPreviousWeekContext({
      weekId: lessonPlan.week,
      courseRoot,
      count: contextCount
    });

    if (previousWeekContext.length > 0 && lectureOptions.verbose) {
      console.log(`📚 Loaded context from ${previousWeekContext.length} previous week(s)`);
    }
  }

  // 8. Generate outline
  reportProgress('outline', 0, 1, `Generating outline for: ${lectureOptions.topic}`, lectureOptions.verbose);
  const outline = await generateOutline(lectureOptions, teachingStyle, lessonPlan, ai, previousWeekContext);

  if (lectureOptions.debug) {
    console.log('[LectureNotes] Outline:', JSON.stringify(outline, null, 2));
  }

  // 8. Generate sections with progress tracking
  const totalSections = countSections(outline.sections);
  if (lectureOptions.verbose) {
    console.log(`📝 Generating ${totalSections} sections...`);
  }

  const sections = await generateSections(
    outline,
    lectureOptions,
    teachingStyle,
    ai,
    (current, total, sectionTitle) => {
      reportProgress('sections', current, total, sectionTitle, lectureOptions.verbose);
    }
  );

  // 9. Assemble lecture notes object
  const lectureNotes = {
    title: outline.title,
    topic: lectureOptions.topic,
    course_code: lectureOptions.courseCode,
    week: lessonPlan?.week || null,
    level: lectureOptions.level,
    generated_at: new Date().toISOString(),
    teaching_style: teachingStyle,
    learning_objectives: outline.learning_objectives,
    sections: sections,
    references: outline.references || []
  };

  // 10. Validate against schema
  const validator = new ValidatorEngine();
  const validation = validator.validate(lectureNotes, lectureNotesTemplate);

  if (!validation.valid) {
    console.warn('⚠️ Validation warnings:', validation.errors);
  }

  // 11. Calculate generation metadata (needed by formatter for YAML comments)
  const endTime = Date.now();
  const metadata = calculateMetadata(lectureNotes, endTime - startTime, ai.getStats());

  // Build provenance info for generation metadata comments
  const provenance = {
    generated: new Date().toISOString(),
    scholar_version: getScholarVersion(),
    prompt_template: getPromptTemplateName(lectureOptions),
    config_source: lectureOptions._configPath || '(defaults)',
    lesson_plan: lessonPlan?._source || null,
    teaching_style: teachingStyle?._source || null,
    generation_time: `${Math.round((endTime - startTime) / 1000)}s`,
    sections: metadata.totalSections
  };

  // 12. Format as Quarto document (with provenance metadata)
  const quartoContent = formatLectureNotesAsQuarto(lectureNotes, {
    formats: lectureOptions.format.split(',').map(f => f.trim()),
    language: lectureOptions.language,
    provenance
  });

  if (lectureOptions.verbose) {
    console.log(`\n✅ Generation complete in ${Math.round((endTime - startTime) / 1000)}s`);
  }

  return {
    content: quartoContent,
    json: lectureNotes,
    metadata,
    provenance,
    validation
  };
}

/**
 * Count total sections including subsections
 * @param {Array} sections - Sections array
 * @returns {number} Total count
 */
function countSections(sections) {
  let count = 0;
  for (const section of sections) {
    count++;
    if (section.subsections) {
      count += countSections(section.subsections);
    }
  }
  return count;
}

/**
 * Generate lecture notes outline
 * @param {Object} options - Lecture options
 * @param {Object} teachingStyle - Teaching style config
 * @param {Object|null} lessonPlan - Lesson plan if available
 * @param {AIProvider} ai - AI provider instance
 * @param {Array|null} previousWeekContext - Context from previous weeks
 * @returns {Promise<Object>} Outline with title, objectives, and section structure
 */
export async function generateOutline(options, teachingStyle, lessonPlan = null, ai = null, previousWeekContext = null) {
  // Try to load prompt from discovery system (Issue #29)
  let prompt;
  try {
    const promptResult = await PromptConfigBridge.loadConfiguredPrompt('lecture-outline', {
      courseRoot: process.cwd(),
      topic: options.topic,
      course_level: options.level,
      field: options.field,
      language: options.language,
      week: lessonPlan?.week,
      lessonPlan,
      previousWeekContext: previousWeekContext ? formatPreviousWeekContext(previousWeekContext) : null,
      debug: options.debug
    });

    // Use discovered prompt if available
    prompt = promptResult.rendered;

    if (options.debug) {
      console.log('[LectureNotes] Using prompt from:', promptResult.prompt.source);
      if (promptResult.warnings.length > 0) {
        promptResult.warnings.forEach(w => console.log('[LectureNotes] Warning:', w));
      }
    }
  } catch (err) {
    // Fall back to legacy prompt builder
    if (options.debug) {
      console.log('[LectureNotes] Prompt discovery failed, using legacy:', err.message);
    }
    prompt = buildOutlinePrompt(options, teachingStyle, lessonPlan);
    // Append previous week context to legacy prompt if available
    if (previousWeekContext && previousWeekContext.length > 0) {
      prompt += '\n\n' + formatPreviousWeekContext(previousWeekContext);
    }
  }

  // Use pre-merged prompt from InstructionMerger if available
  if (options.mergedPrompt) {
    prompt = options.mergedPrompt;
    if (options.debug) {
      console.log('[LectureNotes] 🔧 Using merged prompt from InstructionMerger');
    }
  }

  // If no AI provider, return fallback outline (for dry-run or testing)
  if (!ai) {
    return getFallbackOutline(options, lessonPlan);
  }

  // Generate outline via AI
  const result = await ai.generate(prompt, {
    format: 'json',
    temperature: 0.7,
    context: {
      course: { code: options.courseCode, name: options.courseName },
      level: options.level,
      field: options.field
    }
  });

  if (!result.success) {
    console.warn(`⚠️ AI outline generation failed: ${result.error}`);
    console.warn('   Falling back to template outline');
    return getFallbackOutline(options, lessonPlan);
  }

  // Parse and validate the response
  let outline;
  try {
    outline = typeof result.content === 'string'
      ? JSON.parse(result.content)
      : result.content;
  } catch (parseError) {
    console.warn(`⚠️ Failed to parse outline JSON: ${parseError.message}`);
    return getFallbackOutline(options, lessonPlan);
  }

  // Ensure required fields
  outline.topic = outline.topic || options.topic;
  outline.title = outline.title || options.topic;

  // Validate section structure
  if (!outline.sections || outline.sections.length < 5) {
    console.warn('⚠️ Outline has too few sections, augmenting with defaults');
    outline = augmentOutline(outline, options);
  }

  return outline;
}

/**
 * Get fallback outline when AI is unavailable
 * @param {Object} options - Lecture options
 * @param {Object|null} lessonPlan - Lesson plan if available
 * @returns {Object} Fallback outline structure
 */
function getFallbackOutline(options, lessonPlan = null) {
  const objectives = lessonPlan?.learning_objectives || [];

  return {
    title: options.topic,
    topic: options.topic,
    learning_objectives: objectives.length > 0 ? objectives : [
      `Understand the fundamental concepts of ${options.topic}`,
      `Apply ${options.topic} techniques to real-world problems`,
      `Interpret results from ${options.topic} analysis`,
      `Evaluate assumptions and limitations of ${options.topic}`
    ],
    sections: [
      {
        id: 'S1',
        type: 'introduction',
        title: `Introduction to ${options.topic}`,
        level: 1,
        estimated_pages: 2
      },
      {
        id: 'S2',
        type: 'concept',
        title: `Core Concepts of ${options.topic}`,
        level: 1,
        estimated_pages: 4,
        subsections: [
          {
            id: 'S2.1',
            type: 'definition',
            title: 'Key Definitions',
            level: 2,
            estimated_pages: 1
          },
          {
            id: 'S2.2',
            type: 'concept',
            title: 'Mathematical Framework',
            level: 2,
            estimated_pages: 2
          }
        ]
      },
      {
        id: 'S3',
        type: 'example',
        title: `Worked Example: ${options.topic} in Practice`,
        level: 1,
        estimated_pages: 5
      },
      {
        id: 'S4',
        type: 'code',
        title: `${options.language.toUpperCase()} Implementation`,
        level: 1,
        estimated_pages: 3
      },
      {
        id: 'S5',
        type: 'practice',
        title: 'Practice Problems',
        level: 1,
        estimated_pages: 3
      },
      {
        id: 'S6',
        type: 'summary',
        title: 'Key Takeaways',
        level: 1,
        estimated_pages: 1
      }
    ],
    references: [
      `Standard ${options.field} textbook reference`,
      `Applied ${options.field} methods reference`
    ],
    estimated_total_pages: 18
  };
}

/**
 * Augment a partial outline with required sections
 * @param {Object} outline - Partial outline
 * @param {Object} options - Lecture options
 * @returns {Object} Augmented outline
 */
function augmentOutline(outline, options) {
  const requiredTypes = ['introduction', 'concept', 'example', 'practice', 'summary'];
  const existingTypes = new Set(outline.sections?.map(s => s.type) || []);

  let nextId = (outline.sections?.length || 0) + 1;

  for (const type of requiredTypes) {
    if (!existingTypes.has(type)) {
      outline.sections = outline.sections || [];
      outline.sections.push({
        id: `S${nextId}`,
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${options.topic}`,
        level: 1,
        estimated_pages: SECTION_TYPES[type]?.minPages || 2
      });
      nextId++;
    }
  }

  return outline;
}

/**
 * Generate content for each section
 * @param {Object} outline - Lecture outline
 * @param {Object} options - Lecture options
 * @param {Object} teachingStyle - Teaching style config
 * @param {AIProvider} ai - AI provider instance
 * @param {Function} onSectionProgress - Progress callback(current, total, title)
 * @returns {Promise<Array>} Array of generated sections
 */
export async function generateSections(outline, options, teachingStyle, ai = null, onSectionProgress = null) {
  // Note: sections array is built via processSections recursion, returned at end
  let previousContext = '';
  let currentIndex = 0;
  const totalSections = countSections(outline.sections);

  /**
   * Recursively generate sections and subsections
   * @param {Array} sectionOutlines - Section outlines to generate
   * @returns {Promise<Array>} Generated sections
   */
  async function processSections(sectionOutlines) {
    const results = [];

    for (const sectionOutline of sectionOutlines) {
      currentIndex++;

      // Report progress
      if (onSectionProgress) {
        onSectionProgress(currentIndex, totalSections, sectionOutline.title);
      }

      // Generate this section's content
      const section = await generateSectionContent(
        sectionOutline,
        options,
        teachingStyle,
        previousContext,
        outline.learning_objectives,
        ai
      );

      // Process subsections if present
      if (sectionOutline.subsections && sectionOutline.subsections.length > 0) {
        section.subsections = await processSections(sectionOutline.subsections);
      }

      results.push(section);

      // Update context for next section (use extractSectionSummary from prompts)
      const summary = extractSectionSummary(section);
      previousContext += `\n- ${section.title}: ${summary}`;
    }

    return results;
  }

  return processSections(outline.sections);
}

/**
 * Generate content for a single section
 * @param {Object} sectionOutline - Section outline
 * @param {Object} options - Lecture options
 * @param {Object} teachingStyle - Teaching style config
 * @param {string} previousContext - Summary of previous sections
 * @param {Array} learningObjectives - Learning objectives for context
 * @param {AIProvider} ai - AI provider instance
 * @returns {Promise<Object>} Generated section with content
 */
async function generateSectionContent(sectionOutline, options, teachingStyle, previousContext, learningObjectives = [], ai = null) {
  // Try to load prompt from discovery system (Issue #29)
  let prompt;
  try {
    const promptResult = await PromptConfigBridge.loadConfiguredPrompt('section-content', {
      courseRoot: process.cwd(),
      // Section-specific variables
      section_id: sectionOutline.id,
      section_type: sectionOutline.type,
      section_title: sectionOutline.title,
      section_level: sectionOutline.level,
      estimated_pages: sectionOutline.estimated_pages,
      // Context variables
      topic: options.topic,
      course_level: options.level,
      field: options.field,
      language: options.language,
      previous_context: previousContext,
      learning_objectives: learningObjectives,
      debug: options.debug
    });

    prompt = promptResult.rendered;

    if (options.debug) {
      console.log(`[LectureNotes] Section ${sectionOutline.id} using prompt from:`, promptResult.prompt.source);
    }
  } catch (err) {
    // Fall back to legacy prompt builder
    if (options.debug) {
      console.log(`[LectureNotes] Section ${sectionOutline.id} prompt discovery failed, using legacy:`, err.message);
    }
    prompt = buildSectionPrompt(
      sectionOutline,
      options,
      teachingStyle,
      previousContext,
      learningObjectives
    );
  }

  // If no AI provider, return fallback content (for dry-run or testing)
  if (!ai) {
    return getFallbackSectionContent(sectionOutline, options);
  }

  // Generate section content via AI
  const result = await ai.generate(prompt, {
    format: 'json',
    temperature: 0.7,
    context: {
      sectionType: sectionOutline.type,
      sectionId: sectionOutline.id
    }
  });

  if (!result.success) {
    if (options.debug) {
      console.warn(`⚠️ AI section generation failed for ${sectionOutline.id}: ${result.error}`);
    }
    return getFallbackSectionContent(sectionOutline, options);
  }

  // Parse the response
  let section;
  try {
    section = typeof result.content === 'string'
      ? JSON.parse(result.content)
      : result.content;
  } catch (parseError) {
    if (options.debug) {
      console.warn(`⚠️ Failed to parse section JSON for ${sectionOutline.id}: ${parseError.message}`);
    }
    return getFallbackSectionContent(sectionOutline, options);
  }

  // Ensure required fields from outline
  section.id = sectionOutline.id;
  section.type = sectionOutline.type;
  section.title = section.title || sectionOutline.title;
  section.level = sectionOutline.level;
  section.estimated_pages = sectionOutline.estimated_pages;

  // Don't include subsections here - they're handled by the parent loop
  delete section.subsections;

  return section;
}

/**
 * Get fallback section content when AI is unavailable
 * @param {Object} sectionOutline - Section outline
 * @param {Object} options - Lecture options
 * @returns {Object} Fallback section content
 */
function getFallbackSectionContent(sectionOutline, options) {
  const section = {
    id: sectionOutline.id,
    type: sectionOutline.type,
    title: sectionOutline.title,
    level: sectionOutline.level,
    estimated_pages: sectionOutline.estimated_pages
  };

  // Add type-specific fallback content
  switch (sectionOutline.type) {
    case 'introduction':
      section.content = `This section introduces ${options.topic} and provides motivation for studying this topic. ` +
        `We will explore the key concepts, applications, and importance in ${options.field}.`;
      break;

    case 'concept':
      section.content = `This section covers the core concepts of ${options.topic}. ` +
        `Understanding these fundamentals is essential for applying the techniques in practice.`;
      section.math = `\\text{Placeholder equation for } ${options.topic}`;
      break;

    case 'definition':
      section.content = `**Definition:** Formal definition of key terms related to ${options.topic}.`;
      section.math = `X \\sim \\text{Distribution}(\\theta)`;
      break;

    case 'theorem':
      section.content = `**Theorem:** A fundamental result in ${options.topic}.`;
      section.math = `E[X] = \\mu, \\quad \\text{Var}(X) = \\sigma^2`;
      break;

    case 'proof':
      section.content = `**Proof:** We prove the theorem using standard techniques.`;
      section.math = `\\begin{aligned} & \\text{Step 1: ...} \\\\ & \\text{Step 2: ...} \\end{aligned}`;
      break;

    case 'example':
      section.content = `This worked example demonstrates ${options.topic} using a real-world dataset.`;
      section.code = {
        language: options.language,
        source: options.language === 'r'
          ? `# Example: ${options.topic}\n# Load data\ndata <- read.csv("example.csv")\nhead(data)\n\n# Analysis\nsummary(data)`
          : `# Example: ${options.topic}\nimport pandas as pd\ndata = pd.read_csv("example.csv")\ndata.head()\n\n# Analysis\ndata.describe()`,
        echo: true,
        eval: true
      };
      break;

    case 'code':
      section.content = `Complete ${options.language.toUpperCase()} implementation of ${options.topic}.`;
      section.code = {
        language: options.language,
        source: options.language === 'r'
          ? `# ${options.topic} Implementation\n\n# Function definition\nanalyze <- function(data) {\n  # Implementation\n  return(summary(data))\n}\n\n# Usage\nresult <- analyze(data)`
          : `# ${options.topic} Implementation\n\ndef analyze(data):\n    """Implementation"""\n    return data.describe()\n\n# Usage\nresult = analyze(data)`,
        echo: true,
        eval: true
      };
      break;

    case 'practice':
      section.content = `Practice these problems to reinforce your understanding of ${options.topic}.`;
      section.problems = [
        {
          id: 'P1',
          text: `Given the following scenario, apply ${options.topic} to find the solution.`,
          solution: 'Work through the problem step by step using the methods covered.',
          difficulty: 'medium'
        },
        {
          id: 'P2',
          text: `Interpret the results of a ${options.topic} analysis.`,
          solution: 'Consider the context and statistical significance of the results.',
          difficulty: 'medium'
        }
      ];
      break;

    case 'discussion':
      section.content = `Consider the following questions about ${options.topic}:`;
      section.bullets = [
        `When is ${options.topic} most appropriate?`,
        `What are the limitations of ${options.topic}?`,
        `How does ${options.topic} compare to alternatives?`
      ];
      break;

    case 'summary':
      section.content = `Key takeaways from this lecture on ${options.topic}:`;
      section.bullets = [
        `Understand the fundamental concepts of ${options.topic}`,
        `Apply techniques to real-world problems`,
        `Interpret results correctly`,
        `Recognize assumptions and limitations`
      ];
      break;

    default:
      section.content = `Content for ${sectionOutline.title}.`;
  }

  return section;
}

/**
 * Get a brief summary of a section for context
 * @param {Object} section - Generated section
 * @returns {string} Brief summary
 */
function getSectionSummary(section) {
  if (section.bullets && section.bullets.length > 0) {
    return section.bullets[0];
  }
  if (section.content) {
    return section.content.substring(0, 100) + '...';
  }
  return section.title;
}

/**
 * Load teaching style from 4-layer system
 *
 * Layer 1: Global (~/.claude/CLAUDE.md)
 * Layer 2: Course (.claude/teaching-style.local.md)
 * Layer 3: Command (command_overrides.lecture)
 * Layer 4: Lesson plan (teaching_style_overrides)
 *
 * Precedence: Command > Lesson > Course > Global > Default
 *
 * @param {Object} config - Loaded teach config
 * @param {Object} options - Generation options
 * @param {Object|null} lessonPlan - Loaded lesson plan (for Layer 4)
 * @returns {Object} Merged teaching style in prompt-friendly format
 */
function loadTeachingStyle(config, options, lessonPlan = null) {
  // Use the 4-layer style loader
  const styleResult = loadTeachingStyleFromLayers({
    command: 'lecture',
    startDir: process.cwd(),
    lessonPlan: lessonPlan
  });

  // Debug output if requested
  if (options?.debug) {
    console.log('[LectureNotes] Teaching Style Sources:', styleResult.sources);
    console.log('[LectureNotes] Full Style:', JSON.stringify(styleResult.style, null, 2));
  }

  // Return the prompt-friendly style format
  // This matches what buildStyleGuidance() expects
  return styleResult.promptStyle;
}

/**
 * Load lesson plan from YAML file
 *
 * Uses the lesson-plan-loader module to find and parse lesson plans
 * from content/lesson-plans/ directory.
 *
 * @param {string} planId - Lesson plan ID (e.g., 'week03', '3', 'week-03')
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Log loading info
 * @param {boolean} options.debug - Enable debug output
 * @returns {Object|null} Lesson plan or null if not found
 */
function loadLessonPlan(planId, options = {}) {
  // Find course root by looking for .flow or .claude directories
  let courseRoot = process.cwd();
  const configPath = findConfigFile(process.cwd());
  if (configPath) {
    courseRoot = dirname(dirname(configPath)); // Go up from .flow/teach-config.yml
  }

  // Load using the lesson plan loader
  const result = loadLessonPlanFromFile({
    weekId: planId,
    courseRoot: courseRoot,
    validate: true
  });

  // Handle not found
  if (!result.plan) {
    if (options.verbose !== false) {
      console.warn(`⚠️ Lesson plan not found: ${planId}`);
      if (result.validation?.errors?.length > 0) {
        console.warn(`   ${result.validation.errors[0]}`);
      }
    }
    return null;
  }

  // Log validation warnings
  if (result.validation?.warnings?.length > 0 && options.debug) {
    console.warn(`⚠️ Lesson plan warnings for ${planId}:`);
    for (const warning of result.validation.warnings) {
      console.warn(`   - ${warning}`);
    }
  }

  // Debug output
  if (options.debug) {
    console.log('[LectureNotes] Lesson Plan loaded from:', result.source);
    console.log('[LectureNotes] Lesson Plan Summary:', getLessonPlanSummary(result));
  }

  // Return normalized structure compatible with existing code
  const { extracted, plan } = result;
  return {
    // Original plan (for full access)
    _raw: plan,
    _source: result.source,

    // Normalized fields
    week: extracted.week,
    topic: extracted.title || plan.title || 'Untitled',
    title: extracted.title,
    learning_objectives: extracted.learning_objectives,
    topics: extracted.topics,
    activities: extracted.activities,
    materials: extracted.materials,
    lecture_structure: extracted.lecture_structure,
    duration_minutes: plan.duration_minutes || 75,
    date: plan.date_range?.start || plan.date || null,

    // Teaching style overrides (Layer 4)
    teaching_style_overrides: extracted.teaching_style_overrides
  };
}

/**
 * Get Scholar plugin version from package.json
 * @returns {string} Version string (e.g., "2.5.0")
 */
function getScholarVersion() {
  try {
    const pkgPath = join(dirname(dirname(dirname(__dirname))), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Get prompt template name for provenance tracking
 * @param {Object} options - Lecture options
 * @returns {string} Prompt template identifier
 */
function getPromptTemplateName(_options) {
  // The prompt discovery system uses 'lecture-outline' and 'section-content'
  // For provenance, report the primary template
  return 'lecture-notes.md (v2.4)';
}

/**
 * Calculate metadata for generated content
 * @param {Object} lectureNotes - Generated lecture notes
 * @param {number} generationTimeMs - Generation time in milliseconds
 * @param {Object} aiStats - AI provider statistics
 * @returns {Object} Metadata object
 */
function calculateMetadata(lectureNotes, generationTimeMs, aiStats = {}) {
  let totalPages = 0;
  let codeBlocks = 0;
  let mathEquations = 0;
  let practiceProblems = 0;
  let totalSections = 0;

  function processSections(sections) {
    for (const section of sections) {
      totalSections++;
      totalPages += section.estimated_pages || 0;
      if (section.code) codeBlocks++;
      if (section.math) mathEquations++;
      if (section.problems) practiceProblems += section.problems.length;
      if (section.subsections) processSections(section.subsections);
    }
  }

  processSections(lectureNotes.sections);

  return {
    totalSections,
    totalPages: Math.round(totalPages),
    codeBlocks,
    mathEquations,
    practiceProblems,
    generationTime: Math.round(generationTimeMs / 1000),
    // AI statistics
    apiCalls: aiStats.totalRequests || 0,
    totalTokens: aiStats.totalTokens || 0,
    successRate: aiStats.successRate || 100,
    retriedRequests: aiStats.retriedRequests || 0
  };
}

// Export for testing
export {
  SECTION_TYPES,
  loadTeachingStyle,
  loadLessonPlan,
  calculateMetadata,
  generateSectionContent,
  getSectionSummary,
  getFallbackOutline,
  getFallbackSectionContent,
  countSections,
  getScholarVersion,
  getPromptTemplateName
};
