/**
 * Lecture Generator
 *
 * Generates lecture slides and content using Phase 0 foundation components:
 * - Template System for schema and structure
 * - Config Loader for course settings
 * - Validator Engine for content validation
 * - AI Provider for content generation
 *
 * Lectures include:
 * - Title and objectives slides
 * - Content organized by subtopics
 * - Examples and visualizations
 * - Practice problems and discussions
 * - Summary and next lecture preview
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadTemplate } from '../templates/loader.js';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { AIProvider } from '../ai/provider.js';

/**
 * Lecture generator options
 * @typedef {Object} LectureOptions
 * @property {string} topic - Main topic of the lecture
 * @property {string} title - Lecture title (defaults to topic)
 * @property {number} durationMinutes - Lecture duration (default: 50)
 * @property {string} level - Course level (undergraduate, graduate, doctoral)
 * @property {number} week - Week number in course
 * @property {number} lectureNumber - Lecture number
 * @property {string} format - Output format (markdown, reveal, beamer, quarto)
 * @property {Array<string>} subtopics - Specific subtopics to cover
 * @property {boolean} includeCode - Include code examples
 * @property {string} language - Programming language for code examples
 * @property {boolean} includeExercises - Include practice exercises
 * @property {boolean} generateHandout - Generate student handout
 * @property {boolean} strict - Use strict validation
 * @property {boolean} debug - Enable debug logging
 */

/**
 * Slide timing guidelines by duration
 */
const SLIDE_TIMING = {
  50: { total: 20, content: 14, practice: 3, other: 3 },
  75: { total: 30, content: 21, practice: 5, other: 4 },
  90: { total: 36, content: 26, practice: 6, other: 4 },
  120: { total: 48, content: 34, practice: 8, other: 6 }
};

/**
 * Default slide structure template
 */
const DEFAULT_SLIDE_STRUCTURE = [
  { type: 'title', count: 1 },
  { type: 'objectives', count: 1 },
  { type: 'content', count: 'variable' },
  { type: 'example', count: 'variable' },
  { type: 'practice', count: 'variable' },
  { type: 'summary', count: 1 },
  { type: 'questions', count: 1 }
];

/**
 * Generate a lecture with AI
 * @param {LectureOptions} options - Generation options
 * @returns {Promise<Object>} Generated lecture with metadata
 */
export async function generateLecture(options = {}) {
  // 1. Load configuration
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  // 2. Merge options with config defaults
  const lectureOptions = {
    topic: options.topic || '',
    title: options.title || options.topic || '',
    durationMinutes: options.durationMinutes || options.duration || 50,
    level: options.level || courseInfo.level || 'undergraduate',
    week: options.week || null,
    lectureNumber: options.lectureNumber || null,
    date: options.date || null,
    courseCode: options.courseCode || courseInfo.code || '',
    format: options.format || 'markdown',
    subtopics: options.subtopics || [],
    prerequisites: options.prerequisites || [],
    includeCode: options.includeCode || false,
    language: options.language || 'R',
    includeExercises: options.includeExercises !== false,
    generateHandout: options.generateHandout || false,
    readings: options.readings || [],
    nextLecture: options.nextLecture || null,
    strict: options.strict || false,
    debug: options.debug || false
  };

  if (lectureOptions.debug) {
    console.log('[Lecture] Options:', JSON.stringify(lectureOptions, null, 2));
  }

  // 3. Calculate slide count based on duration
  const timing = getSlideTimingForDuration(lectureOptions.durationMinutes);

  // 4. Load lecture template
  const lectureTemplate = loadTemplate('lecture');

  // 5. Build prompt for AI generation (or use pre-merged prompt from InstructionMerger)
  const prompt = options.mergedPrompt || buildLecturePrompt(lectureOptions, courseInfo, timing);

  if (lectureOptions.debug) {
    if (options.mergedPrompt) {
      console.log('[Lecture] 🔧 Using merged prompt from InstructionMerger');
    }
    console.log('[Lecture] Prompt length:', prompt.length);
  }

  // 6. Generate lecture content with AI
  const ai = new AIProvider();
  let generatedContent;

  try {
    generatedContent = await ai.generate({
      prompt,
      schema: lectureTemplate,
      temperature: 0.7,
      maxTokens: 8000
    });
  } catch (error) {
    throw new Error(`AI generation failed: ${error.message}`, { cause: error });
  }

  // 7. Parse and process generated content
  let lecture;
  try {
    lecture = typeof generatedContent === 'string'
      ? JSON.parse(generatedContent)
      : generatedContent;
  } catch (parseError) {
    throw new Error(`Failed to parse AI response: ${parseError.message}`, { cause: parseError });
  }

  // 8. Enrich with provided information
  lecture = enrichLecture(lecture, lectureOptions);

  // 9. Add metadata
  lecture.metadata = {
    generated_at: new Date().toISOString(),
    generator: 'scholar-lecture',
    version: '2.0.0'
  };

  // 10. Validate generated content
  if (lectureOptions.strict) {
    const validator = new ValidatorEngine({ strict: true });
    const validation = validator.validateSync(lecture, lectureTemplate);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return lecture;
}

/**
 * Get slide timing recommendations for a given duration
 * @param {number} duration - Lecture duration in minutes
 * @returns {Object} Timing recommendations
 */
function getSlideTimingForDuration(duration) {
  // Find closest duration match
  const durations = Object.keys(SLIDE_TIMING).map(Number);
  const closest = durations.reduce((prev, curr) =>
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  );

  const base = SLIDE_TIMING[closest];

  // Scale if duration differs
  if (duration !== closest) {
    const scale = duration / closest;
    return {
      total: Math.round(base.total * scale),
      content: Math.round(base.content * scale),
      practice: Math.round(base.practice * scale),
      other: Math.round(base.other * scale)
    };
  }

  return base;
}

/**
 * Build AI prompt for lecture generation
 * @param {Object} options - Lecture options
 * @param {Object} courseInfo - Course information from config
 * @param {Object} timing - Slide timing recommendations
 * @returns {string} Prompt for AI
 */
function buildLecturePrompt(options, courseInfo, timing) {
  const levelDescriptions = {
    undergraduate: 'undergraduate students - focus on intuition, examples, and visual explanations',
    graduate: 'graduate students - include proofs, advanced theory, and research connections',
    doctoral: 'doctoral students - emphasize research applications and cutting-edge methods'
  };

  const subtopicsSection = options.subtopics.length > 0
    ? `Subtopics to cover:\n${options.subtopics.map(t => `- ${t}`).join('\n')}`
    : 'Generate appropriate subtopics based on the main topic.';

  const codeSection = options.includeCode
    ? `\n- Include ${options.language} code examples where appropriate`
    : '';

  const prerequisitesSection = options.prerequisites.length > 0
    ? `\nPrerequisites students should know:\n${options.prerequisites.map(p => `- ${p}`).join('\n')}`
    : '';

  return `
Generate a comprehensive lecture for:

Topic: ${options.topic}
${options.title !== options.topic ? `Title: ${options.title}` : ''}
Course: ${courseInfo.code || ''} ${courseInfo.title || ''}
Duration: ${options.durationMinutes} minutes
Level: ${options.level} - designed for ${levelDescriptions[options.level] || 'students'}
Field: ${courseInfo.field || 'statistics'}
${options.week ? `Week: ${options.week}` : ''}
${options.lectureNumber ? `Lecture: ${options.lectureNumber}` : ''}

${subtopicsSection}
${prerequisitesSection}

## Slide Targets

Based on ${options.durationMinutes} minutes:
- Total slides: approximately ${timing.total}
- Content slides: ~${timing.content}
- Practice/exercise slides: ~${timing.practice}
- Other (title, objectives, summary): ~${timing.other}

## Required Output Structure

Generate a JSON object with this structure:

\`\`\`json
{
  "title": "${options.title || options.topic}",
  "topic": "${options.topic}",
  "course_code": "${options.courseCode}",
  "duration_minutes": ${options.durationMinutes},
  "level": "${options.level}",
  "learning_objectives": [
    "Apply [method] to [context]...",
    "Interpret [concept] in terms of...",
    "Evaluate [results] by..."
  ],
  "slides": [
    {
      "id": "S1",
      "type": "title",
      "title": "${options.title || options.topic}",
      "content": "${courseInfo.code || ''} | ${options.date || 'Date'}",
      "speaker_notes": "Welcome and introduction..."
    },
    {
      "id": "S2",
      "type": "objectives",
      "title": "Learning Objectives",
      "bullets": ["Objective 1", "Objective 2"],
      "speaker_notes": "By the end of today's lecture..."
    },
    {
      "id": "S3",
      "type": "content",
      "title": "Introduction to [Subtopic]",
      "content": "Main explanation with LaTeX: $\\\\beta_0 + \\\\beta_1 x$",
      "bullets": ["Point 1", "Point 2"],
      "subtopic": "Introduction",
      "speaker_notes": "Start by explaining..."
    },
    {
      "id": "S4",
      "type": "example",
      "title": "Example: [Context]",
      "content": "Worked example showing application...",
      "speaker_notes": "Walk through this step by step..."
    },
    {
      "id": "S5",
      "type": "practice",
      "title": "Try It: [Short description]",
      "content": "Problem for students to try...",
      "bullets": ["Given: ...", "Find: ..."],
      "speaker_notes": "Give students 2-3 minutes..."
    },
    {
      "id": "SN",
      "type": "summary",
      "title": "Key Takeaways",
      "bullets": ["Main point 1", "Main point 2"],
      "speaker_notes": "Wrap up..."
    },
    {
      "id": "SN+1",
      "type": "questions",
      "title": "Questions?",
      "content": "Office hours: [placeholder]",
      "speaker_notes": "Answer any questions..."
    }
  ],
  "next_lecture": {
    "topic": "Next topic",
    "preview": "Brief preview..."
  }
}
\`\`\`

## Slide Type Guidelines

1. **title**: Opening slide with lecture title and course info
2. **objectives**: 3-5 learning objectives using action verbs (apply, analyze, interpret, evaluate)
3. **content**: Main explanatory content with optional bullets and LaTeX math
4. **example**: Worked examples with step-by-step solutions
5. **definition**: Formal definitions with notation
6. **theorem**: Mathematical theorems with formal statements
7. **practice**: Student exercises/think-pair-share activities
8. **discussion**: Open-ended discussion questions
9. **summary**: Key takeaways (3-5 points)
10. **questions**: Closing slide for Q&A

## Content Requirements

1. **Appropriate depth** for ${options.level} level
2. **LaTeX notation** for mathematics: $\\beta$, $\\sum_{i=1}^n$
3. **Speaker notes** for each slide with timing suggestions
4. **Logical flow** from basic to advanced concepts${codeSection}
5. **Visual descriptions** in figure objects where appropriate

## Best Practices

- One main concept per slide
- Mix content with practice/discussion
- Include 1-2 examples per major concept
- Use visual aids (describe figures/plots needed)
- Estimate 2-2.5 minutes per slide

Return ONLY the JSON object.
`;
}

/**
 * Enrich lecture with provided information
 * @param {Object} lecture - Generated lecture
 * @param {Object} options - Original options
 * @returns {Object} Enriched lecture
 */
function enrichLecture(lecture, options) {
  // Override with provided values
  if (options.week) lecture.week = options.week;
  if (options.lectureNumber) lecture.lecture_number = options.lectureNumber;
  if (options.date) lecture.date = options.date;
  if (options.courseCode) lecture.course_code = options.courseCode;

  // Add readings if provided
  if (options.readings && options.readings.length > 0) {
    lecture.readings = options.readings;
  }

  // Add next lecture preview if provided
  if (options.nextLecture) {
    lecture.next_lecture = options.nextLecture;
  }

  // Add prerequisites if provided
  if (options.prerequisites && options.prerequisites.length > 0) {
    lecture.prerequisites = options.prerequisites;
  }

  // Generate handout config if requested
  if (options.generateHandout) {
    lecture.handout = {
      include_slides: true,
      include_notes: false,
      exercises: []
    };
  }

  return lecture;
}

/**
 * Export lecture in specified format
 * @param {Object} lecture - Lecture object
 * @param {string} format - Output format (markdown, reveal, beamer, quarto, json)
 * @returns {Promise<Object>} Export result with content and format
 */
export async function exportLecture(lecture, format = 'markdown') {
  const formatLower = format.toLowerCase();

  const supportedFormats = ['markdown', 'md', 'reveal', 'beamer', 'quarto', 'qmd', 'json'];
  if (!supportedFormats.includes(formatLower)) {
    throw new Error(`Unsupported format: ${format}. Supported: ${supportedFormats.join(', ')}`);
  }

  let content;

  switch (formatLower) {
    case 'json':
      content = JSON.stringify(lecture, null, 2);
      break;
    case 'reveal':
      content = formatAsRevealJS(lecture);
      break;
    case 'beamer':
      content = formatAsBeamer(lecture);
      break;
    case 'quarto':
    case 'qmd':
      content = formatAsQuarto(lecture);
      break;
    case 'markdown':
    case 'md':
    default:
      content = formatAsMarkdown(lecture);
      break;
  }

  return {
    content,
    format: ['md', 'qmd'].includes(formatLower)
      ? (formatLower === 'qmd' ? 'quarto' : 'markdown')
      : formatLower
  };
}

/**
 * Format lecture as Markdown slides
 * @param {Object} lecture - Lecture object
 * @returns {string} Markdown content
 */
function formatAsMarkdown(lecture) {
  let md = '';

  // Add each slide
  if (lecture.slides && lecture.slides.length > 0) {
    lecture.slides.forEach((slide, index) => {
      if (index > 0) {
        md += '\n---\n\n';
      }

      md += formatSlideAsMarkdown(slide);
    });
  }

  return md;
}

/**
 * Format a single slide as Markdown
 * @param {Object} slide - Slide object
 * @returns {string} Markdown for the slide
 */
function formatSlideAsMarkdown(slide) {
  let md = '';

  // Title
  if (slide.type === 'title') {
    md += `# ${slide.title}\n`;
    if (slide.content) md += `## ${slide.content}\n`;
  } else {
    md += `## ${slide.title}\n`;
  }
  md += '\n';

  // Content
  if (slide.content && slide.type !== 'title') {
    md += `${slide.content}\n\n`;
  }

  // Bullets
  if (slide.bullets && slide.bullets.length > 0) {
    slide.bullets.forEach(bullet => {
      md += `- ${bullet}\n`;
    });
    md += '\n';
  }

  // Code
  if (slide.code) {
    md += `\`\`\`${slide.code.language || ''}\n${slide.code.snippet}\n\`\`\`\n\n`;
    if (slide.code.output) {
      md += `Output:\n\`\`\`\n${slide.code.output}\n\`\`\`\n\n`;
    }
  }

  // Figure description (as comment for now)
  if (slide.figure) {
    md += `<!-- Figure: ${slide.figure.description} -->\n`;
    if (slide.figure.alt_text) {
      md += `<!-- Alt: ${slide.figure.alt_text} -->\n`;
    }
    md += '\n';
  }

  // Speaker notes (as HTML comment)
  if (slide.speaker_notes) {
    md += `\n<!-- Speaker notes:\n${slide.speaker_notes}\n-->\n`;
  }

  return md;
}

/**
 * Format lecture as reveal.js HTML
 * @param {Object} lecture - Lecture object
 * @returns {string} reveal.js HTML
 */
function formatAsRevealJS(lecture) {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${lecture.title || 'Lecture'}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/theme/white.css">
  <style>
    .reveal h1 { font-size: 2.5em; }
    .reveal h2 { font-size: 1.8em; }
    .reveal .slides section { text-align: left; }
    .reveal ul { margin-left: 1em; }
    .reveal .speaker-notes { display: none; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
`;

  if (lecture.slides) {
    lecture.slides.forEach(slide => {
      html += '      <section';
      if (slide.speaker_notes) {
        html += ` data-notes="${escapeHtml(slide.speaker_notes)}"`;
      }
      html += '>\n';

      if (slide.type === 'title') {
        html += `        <h1>${escapeHtml(slide.title)}</h1>\n`;
        if (slide.content) {
          html += `        <h3>${escapeHtml(slide.content)}</h3>\n`;
        }
      } else {
        html += `        <h2>${escapeHtml(slide.title)}</h2>\n`;
        if (slide.content) {
          html += `        <p>${escapeHtml(slide.content)}</p>\n`;
        }
        if (slide.bullets && slide.bullets.length > 0) {
          html += '        <ul>\n';
          slide.bullets.forEach(bullet => {
            html += `          <li>${escapeHtml(bullet)}</li>\n`;
          });
          html += '        </ul>\n';
        }
        if (slide.code) {
          html += `        <pre><code class="${slide.code.language || ''}">${escapeHtml(slide.code.snippet)}</code></pre>\n`;
        }
      }

      html += '      </section>\n';
    });
  }

  html += `    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      slideNumber: true
    });
  </script>
</body>
</html>`;

  return html;
}

/**
 * Format lecture as Beamer LaTeX
 * @param {Object} lecture - Lecture object
 * @returns {string} Beamer LaTeX
 */
function formatAsBeamer(lecture) {
  let tex = `\\documentclass{beamer}
\\usetheme{Madrid}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{listings}

\\title{${lecture.title || 'Lecture'}}
\\subtitle{${lecture.course_code || ''}}
\\author{}
\\date{${lecture.date || ''}}

\\begin{document}

\\begin{frame}
\\titlepage
\\end{frame}

`;

  if (lecture.slides) {
    lecture.slides.forEach(slide => {
      if (slide.type === 'title') return; // Skip, already have title page

      tex += `\\begin{frame}{${slide.title || ''}}\n`;

      if (slide.content) {
        tex += `${slide.content}\n\n`;
      }

      if (slide.bullets && slide.bullets.length > 0) {
        tex += '\\begin{itemize}\n';
        slide.bullets.forEach(bullet => {
          tex += `  \\item ${bullet}\n`;
        });
        tex += '\\end{itemize}\n';
      }

      if (slide.code) {
        tex += `\\begin{lstlisting}[language=${slide.code.language || 'R'}]\n`;
        tex += slide.code.snippet + '\n';
        tex += '\\end{lstlisting}\n';
      }

      tex += '\\end{frame}\n\n';

      // Add notes frame if speaker notes exist
      if (slide.speaker_notes) {
        tex += `\\note{${slide.speaker_notes}}\n\n`;
      }
    });
  }

  tex += '\\end{document}';

  return tex;
}

/**
 * Format lecture as Quarto slides
 * @param {Object} lecture - Lecture object
 * @returns {string} Quarto markdown
 */
function formatAsQuarto(lecture) {
  let qmd = `---
title: "${lecture.title || 'Lecture'}"
subtitle: "${lecture.course_code || ''}"
author: ""
date: "${lecture.date || ''}"
format:
  revealjs:
    theme: default
    slide-number: true
    chalkboard: true
---

`;

  if (lecture.slides) {
    lecture.slides.forEach((slide, index) => {
      if (index > 0 || slide.type !== 'title') {
        qmd += '\n---\n\n';
      }

      if (slide.type === 'title') {
        // Title is handled by YAML frontmatter
        return;
      }

      qmd += `## ${slide.title}\n\n`;

      if (slide.content) {
        qmd += `${slide.content}\n\n`;
      }

      if (slide.bullets && slide.bullets.length > 0) {
        slide.bullets.forEach(bullet => {
          qmd += `- ${bullet}\n`;
        });
        qmd += '\n';
      }

      if (slide.code) {
        qmd += `\`\`\`{${slide.code.language || 'r'}}\n${slide.code.snippet}\n\`\`\`\n\n`;
      }

      if (slide.speaker_notes) {
        qmd += `::: {.notes}\n${slide.speaker_notes}\n:::\n\n`;
      }
    });
  }

  return qmd;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Save lecture to file
 * @param {Object} lecture - Lecture object
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Save options
 * @returns {Object} Save result with filepath
 */
export function saveLecture(lecture, filename, options = {}) {
  const format = options.format || 'markdown';
  const outputDir = options.outputDir || process.cwd();

  const extensions = {
    json: '.json',
    markdown: '.md',
    md: '.md',
    reveal: '.html',
    beamer: '.tex',
    quarto: '.qmd',
    qmd: '.qmd'
  };

  const extension = extensions[format] || '.md';
  let content;

  switch (format) {
    case 'json':
      content = JSON.stringify(lecture, null, 2);
      break;
    case 'reveal':
      content = formatAsRevealJS(lecture);
      break;
    case 'beamer':
      content = formatAsBeamer(lecture);
      break;
    case 'quarto':
    case 'qmd':
      content = formatAsQuarto(lecture);
      break;
    default:
      content = formatAsMarkdown(lecture);
  }

  const filepath = join(outputDir, `${filename}${extension}`);
  writeFileSync(filepath, content, 'utf-8');

  return {
    filepath,
    format,
    size: content.length
  };
}

// Export formatters for testing
export {
  formatAsMarkdown,
  formatAsRevealJS,
  formatAsBeamer,
  formatAsQuarto,
  formatSlideAsMarkdown,
  getSlideTimingForDuration,
  SLIDE_TIMING,
  DEFAULT_SLIDE_STRUCTURE
};
