/**
 * Conversational Lecture Generator for Claude Code
 *
 * Uses Claude Code's conversational interface instead of API calls.
 * Perfect for Max users who want to generate lectures through chat.
 *
 * Usage in Claude Code:
 * - Ask Claude to generate lecture slides
 * - Provide topic, duration, and level
 * - Claude generates and saves the lecture
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { loadTemplate } from '../templates/loader.js';

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
 * Get slide timing recommendations for a given duration
 * @param {number} duration - Lecture duration in minutes
 * @returns {Object} Timing recommendations
 */
function getSlideTimingForDuration(duration) {
  const durations = Object.keys(SLIDE_TIMING).map(Number);
  const closest = durations.reduce((prev, curr) =>
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  );

  const base = SLIDE_TIMING[closest];

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
 * Generate lecture prompt for conversational generation
 * @param {Object} options - Lecture options
 * @returns {Object} Prompt and metadata for Claude
 */
export function buildConversationalPrompt(options = {}) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  const lectureOptions = {
    topic: options.topic || '',
    title: options.title || options.topic || '',
    durationMinutes: options.durationMinutes || options.duration || 50,
    level: options.level || courseInfo.level || 'undergraduate',
    week: options.week || null,
    lectureNumber: options.lectureNumber || null,
    courseCode: options.courseCode || courseInfo.code || '',
    format: options.format || 'markdown',
    subtopics: options.subtopics || [],
    includeCode: options.includeCode || false,
    language: options.language || 'R'
  };

  const timing = getSlideTimingForDuration(lectureOptions.durationMinutes);

  const levelDescriptions = {
    undergraduate: 'undergraduate students - focus on intuition and examples',
    graduate: 'graduate students - include proofs and advanced theory',
    doctoral: 'doctoral students - emphasize research applications'
  };

  const subtopicsSection = lectureOptions.subtopics.length > 0
    ? `Subtopics to cover:\n${lectureOptions.subtopics.map(t => `- ${t}`).join('\n')}`
    : 'Generate appropriate subtopics based on the main topic.';

  const codeSection = lectureOptions.includeCode
    ? `\n- Include ${lectureOptions.language} code examples`
    : '';

  return {
    prompt: `
Generate lecture slides for:

Topic: ${lectureOptions.topic}
${lectureOptions.title !== lectureOptions.topic ? `Title: ${lectureOptions.title}` : ''}
Course: ${courseInfo.code || ''} ${courseInfo.title || ''}
Duration: ${lectureOptions.durationMinutes} minutes
Level: ${lectureOptions.level} - designed for ${levelDescriptions[lectureOptions.level] || 'students'}
Field: ${courseInfo.field || 'statistics'}
${lectureOptions.week ? `Week: ${lectureOptions.week}` : ''}

${subtopicsSection}

## Slide Targets

Based on ${lectureOptions.durationMinutes} minutes:
- Total slides: approximately ${timing.total}
- Content slides: ~${timing.content}
- Practice slides: ~${timing.practice}
- Other (title, objectives, summary): ~${timing.other}

## Output Requirements

Generate a JSON object with this exact structure:

\`\`\`json
{
  "title": "Lecture Title",
  "topic": "${lectureOptions.topic}",
  "course_code": "${lectureOptions.courseCode}",
  "duration_minutes": ${lectureOptions.durationMinutes},
  "level": "${lectureOptions.level}",
  "learning_objectives": [
    "Apply [method] to [context]...",
    "Interpret [concept]...",
    "Evaluate [results]..."
  ],
  "slides": [
    {
      "id": "S1",
      "type": "title",
      "title": "Lecture Title",
      "content": "Course Code | Date"
    },
    {
      "id": "S2",
      "type": "objectives",
      "title": "Learning Objectives",
      "bullets": ["Objective 1", "Objective 2", "Objective 3"]
    },
    {
      "id": "S3",
      "type": "content",
      "title": "Introduction",
      "content": "Opening explanation with LaTeX: $\\\\beta_0 + \\\\beta_1 x$",
      "bullets": ["Point 1", "Point 2"],
      "speaker_notes": "Start by explaining..."
    },
    {
      "id": "S4",
      "type": "example",
      "title": "Example: Context",
      "content": "Worked example...",
      "speaker_notes": "Walk through step by step..."
    },
    {
      "id": "S5",
      "type": "practice",
      "title": "Try It",
      "content": "Problem for students...",
      "speaker_notes": "Give 2-3 minutes..."
    },
    {
      "id": "SN",
      "type": "summary",
      "title": "Key Takeaways",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "id": "SN+1",
      "type": "questions",
      "title": "Questions?",
      "content": "Office hours info"
    }
  ],
  "next_lecture": {
    "topic": "Next topic",
    "preview": "Brief preview"
  }
}
\`\`\`

## Slide Types

- **title**: Opening slide
- **objectives**: Learning objectives (3-5)
- **content**: Main explanatory content
- **example**: Worked examples
- **definition**: Formal definitions
- **practice**: Student exercises
- **discussion**: Discussion questions
- **summary**: Key takeaways
- **questions**: Closing Q&A

## Guidelines

1. **One concept per slide** - don't overcrowd
2. **LaTeX for math**: $\\\\beta$, $\\\\sum_{i=1}^n$
3. **Speaker notes** with timing suggestions
4. **Mix content with practice** for engagement
5. **2-2.5 minutes per slide** pacing${codeSection}

Return ONLY the JSON object.
`,
    options: lectureOptions,
    config: courseInfo,
    timing
  };
}

/**
 * Process conversationally generated lecture content
 * @param {Object|string} content - Generated content (JSON object or string)
 * @param {Object} options - Processing options
 * @returns {Object} Processed and validated lecture
 */
export function processGeneratedLecture(content, options = {}) {
  // Parse if string
  const lecture = typeof content === 'string' ? JSON.parse(content) : content;

  // Load config for enrichment
  const config = loadTeachConfig(process.cwd());

  // Add generated_by metadata directly
  lecture.generated_by = {
    tool: 'scholar-conversational',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  };

  // Add course info if available
  if (config.scholar?.course_info) {
    lecture.course_info = config.scholar.course_info;
  }

  // Ensure required fields
  lecture.metadata = lecture.metadata || {};
  lecture.metadata.generated_at = new Date().toISOString();
  lecture.metadata.generator = 'scholar-lecture-conversational';

  // Validate if strict mode
  if (options.strict) {
    const validator = new ValidatorEngine({ strict: true });
    const validation = validator.validateSync(lecture, loadTemplate('lecture'));
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return lecture;
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
    quarto: '.qmd'
  };

  const extension = extensions[format] || '.md';
  let content;

  switch (format) {
    case 'json':
      content = JSON.stringify(lecture, null, 2);
      break;
    case 'quarto':
      content = formatAsQuarto(lecture);
      break;
    case 'markdown':
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

/**
 * Format lecture as Markdown slides
 */
function formatAsMarkdown(lecture) {
  let md = '';

  if (lecture.slides && lecture.slides.length > 0) {
    lecture.slides.forEach((slide, index) => {
      if (index > 0) {
        md += '\n---\n\n';
      }

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
      }

      // Speaker notes
      if (slide.speaker_notes) {
        md += `<!-- Notes: ${slide.speaker_notes} -->\n`;
      }
    });
  }

  return md;
}

/**
 * Format lecture as Quarto slides
 */
function formatAsQuarto(lecture) {
  let qmd = `---
title: "${lecture.title || 'Lecture'}"
subtitle: "${lecture.course_code || ''}"
format:
  revealjs:
    theme: default
    slide-number: true
---

`;

  if (lecture.slides) {
    lecture.slides.forEach((slide, index) => {
      if (slide.type === 'title') return; // Handled by frontmatter

      if (index > 0) qmd += '\n---\n\n';

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

// Export for command usage
export {
  SLIDE_TIMING,
  getSlideTimingForDuration,
  formatAsMarkdown,
  formatAsQuarto
};
