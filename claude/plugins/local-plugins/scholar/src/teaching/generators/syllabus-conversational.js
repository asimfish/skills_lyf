/**
 * Conversational Syllabus Generator for Claude Code
 *
 * Uses Claude Code's conversational interface instead of API calls.
 * Perfect for Max users who want to generate syllabi through chat.
 *
 * Usage in Claude Code:
 * - Ask Claude to generate a course syllabus
 * - Provide course details (title, code, semester, instructor info)
 * - Claude generates and saves the syllabus
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { loadTemplate } from '../templates/loader.js';

/**
 * Default grading scale
 */
const DEFAULT_GRADING_SCALE = [
  { grade: 'A', minimum: 93, maximum: 100 },
  { grade: 'A-', minimum: 90, maximum: 92 },
  { grade: 'B+', minimum: 87, maximum: 89 },
  { grade: 'B', minimum: 83, maximum: 86 },
  { grade: 'B-', minimum: 80, maximum: 82 },
  { grade: 'C+', minimum: 77, maximum: 79 },
  { grade: 'C', minimum: 73, maximum: 76 },
  { grade: 'C-', minimum: 70, maximum: 72 },
  { grade: 'D+', minimum: 67, maximum: 69 },
  { grade: 'D', minimum: 63, maximum: 66 },
  { grade: 'D-', minimum: 60, maximum: 62 },
  { grade: 'F', minimum: 0, maximum: 59 }
];

/**
 * Default grading components
 */
const DEFAULT_GRADING_COMPONENTS = [
  { name: 'Homework', percentage: 25, details: 'Weekly assignments' },
  { name: 'Quizzes', percentage: 10, details: 'In-class quizzes' },
  { name: 'Midterm Exam', percentage: 25, details: 'In-class exam' },
  { name: 'Final Exam', percentage: 30, details: 'Comprehensive final' },
  { name: 'Project', percentage: 10, details: 'Data analysis project' }
];

/**
 * Standard policy templates
 */
const STANDARD_POLICIES = {
  academic_integrity: `Academic integrity is taken seriously in this course. All submitted work must be your own unless explicitly stated otherwise. Plagiarism, cheating, and other forms of academic dishonesty will result in disciplinary action according to university policy.`,

  accessibility: `The university is committed to providing equal access to all students. If you have a documented disability that requires accommodations, please contact the Disability Resource Center and provide documentation to the instructor within the first two weeks of class.`,

  attendance: `Regular attendance is expected and encouraged. While attendance is not directly graded, consistent participation significantly contributes to understanding course material.`,

  late_policy: `Late assignments will be penalized 10% per day, up to a maximum of 3 days late. After 3 days, assignments will not be accepted without prior arrangement.`
};

/**
 * Generate syllabus prompt for conversational generation
 * @param {Object} options - Syllabus options
 * @returns {Object} Prompt and metadata for Claude
 */
export function buildConversationalPrompt(options = {}) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  const syllabusOptions = {
    courseTitle: options.courseTitle || options.title || courseInfo.title || '',
    courseCode: options.courseCode || courseInfo.code || '',
    semester: options.semester || '',
    credits: options.credits || 3,
    level: options.level || courseInfo.level || 'undergraduate',
    weeks: options.weeks || 16,
    format: options.format || 'in-person',
    topics: options.topics || [],
    instructor: options.instructor || {},
    prerequisites: options.prerequisites || [],
    textbooks: options.textbooks || [],
    software: options.software || [],
    gradingComponents: options.gradingComponents || DEFAULT_GRADING_COMPONENTS,
    gradingScale: options.gradingScale || DEFAULT_GRADING_SCALE
  };

  const levelDescriptions = {
    undergraduate: 'undergraduate students with foundational knowledge',
    graduate: 'graduate students with advanced preparation',
    doctoral: 'doctoral students with research focus'
  };

  const topicsSection = syllabusOptions.topics.length > 0
    ? `Topics to cover:\n${syllabusOptions.topics.map(t => `- ${t}`).join('\n')}`
    : 'Generate appropriate topics based on the course title and level.';

  return {
    prompt: `
Generate a comprehensive course syllabus for:

Course: ${syllabusOptions.courseTitle} (${syllabusOptions.courseCode})
Semester: ${syllabusOptions.semester}
Credits: ${syllabusOptions.credits}
Level: ${syllabusOptions.level} - designed for ${levelDescriptions[syllabusOptions.level] || 'students'}
Field: ${courseInfo.field || 'statistics'}
Delivery: ${syllabusOptions.format}
Duration: ${syllabusOptions.weeks} weeks

${topicsSection}

${syllabusOptions.prerequisites.length > 0 ? `Prerequisites: ${syllabusOptions.prerequisites.join(', ')}` : ''}

${syllabusOptions.instructor.name ? `Instructor: ${syllabusOptions.instructor.name}` : ''}

## Output Requirements

Generate a JSON object with this exact structure:

\`\`\`json
{
  "title": "Course Title",
  "course_code": "STAT 440",
  "semester": "Fall 2026",
  "credits": ${syllabusOptions.credits},
  "level": "${syllabusOptions.level}",
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "instructor": {
    "name": "Instructor Name",
    "title": "Professor",
    "email": "email@university.edu",
    "office": "Building Room",
    "office_hours": "MW 2-4 PM"
  },
  "meeting_times": {
    "days": ["Monday", "Wednesday", "Friday"],
    "time": "10:00 AM - 10:50 AM",
    "location": "Building Room",
    "format": "${syllabusOptions.format}"
  },
  "description": "Comprehensive course description (100-200 words)...",
  "learning_objectives": [
    "Apply [specific method] to [context]...",
    "Analyze [type of data/problem]...",
    "Evaluate [outcomes/results]...",
    "Interpret [statistical concepts]...",
    "Communicate [findings/results]..."
  ],
  "required_materials": {
    "textbooks": [
      {
        "title": "Textbook Title",
        "author": "Author Name",
        "edition": "2nd Edition",
        "isbn": "978-0-XXX-XXXXX-X",
        "required": true
      }
    ],
    "software": [
      {
        "name": "R",
        "version": "4.0+",
        "license": "free"
      }
    ]
  },
  "grading": {
    "components": ${JSON.stringify(syllabusOptions.gradingComponents)},
    "scale": ${JSON.stringify(syllabusOptions.gradingScale.slice(0, 4))},
    "late_policy": "Late assignments lose 10% per day, up to 3 days maximum."
  },
  "schedule": [
    {
      "week": 1,
      "topic": "Introduction and Course Overview",
      "readings": ["Chapter 1"],
      "assignments_due": []
    },
    {
      "week": 2,
      "topic": "Topic for Week 2",
      "readings": ["Chapter 2"],
      "assignments_due": ["HW 1"]
    }
  ],
  "important_dates": [
    {"date": "Week 8", "event": "Midterm Exam"},
    {"date": "Week 15", "event": "Project Due"},
    {"date": "Finals Week", "event": "Final Exam"}
  ]
}
\`\`\`

## Guidelines

1. **Course Description**: Write 100-200 words describing the course content and goals
2. **Learning Objectives**: Create 5-8 MEASURABLE objectives using action verbs (apply, analyze, evaluate, create)
   - Avoid vague verbs like "understand", "know", "learn"
3. **Textbooks**: Recommend appropriate textbooks for the level and field
4. **Course Schedule**: Create ${syllabusOptions.weeks}-week schedule with:
   - Logical topic progression
   - Assigned readings for each week
   - When assignments/exams are due
   - Include break weeks if applicable (mark with "is_break": true)
5. **Appropriate Level**: Match content to ${syllabusOptions.level} level expectations

Return ONLY the JSON object.
`,
    options: syllabusOptions,
    config: courseInfo
  };
}

/**
 * Process conversationally generated syllabus content
 * @param {Object|string} content - Generated content (JSON object or string)
 * @param {Object} options - Processing options
 * @returns {Object} Processed and validated syllabus
 */
export function processGeneratedSyllabus(content, options = {}) {
  // Parse if string
  const syllabus = typeof content === 'string' ? JSON.parse(content) : content;

  // Load config for enrichment
  const config = loadTeachConfig(process.cwd());

  // Add generated_by metadata directly
  syllabus.generated_by = {
    tool: 'scholar-conversational',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  };

  // Add course info if available
  if (config.scholar?.course_info) {
    syllabus.course_info = config.scholar.course_info;
  }

  // Ensure required fields
  syllabus.metadata = syllabus.metadata || {};
  syllabus.metadata.generated_at = new Date().toISOString();
  syllabus.metadata.generator = 'scholar-syllabus-conversational';

  // Add standard policies if not present
  if (!syllabus.policies) {
    syllabus.policies = STANDARD_POLICIES;
  }

  // Validate if strict mode
  if (options.strict) {
    const validator = new ValidatorEngine({ strict: true });
    const validation = validator.validateSync(syllabus, loadTemplate('syllabus'));
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return syllabus;
}

/**
 * Save syllabus to file
 * @param {Object} syllabus - Syllabus object
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Save options
 * @returns {Object} Save result with filepath
 */
export function saveSyllabus(syllabus, filename, options = {}) {
  const format = options.format || 'json';
  const outputDir = options.outputDir || process.cwd();

  let content;
  let extension;

  switch (format) {
    case 'json':
      content = JSON.stringify(syllabus, null, 2);
      extension = '.json';
      break;
    case 'markdown':
    case 'md':
      content = formatAsMarkdown(syllabus);
      extension = '.md';
      break;
    default:
      content = JSON.stringify(syllabus, null, 2);
      extension = '.json';
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
 * Format syllabus as Markdown
 */
function formatAsMarkdown(syllabus) {
  let md = `# ${syllabus.title || 'Course Syllabus'}\n`;
  md += `## ${syllabus.course_code || ''} - ${syllabus.semester || ''}\n\n`;

  // Course Info
  md += `## Course Information\n\n`;
  if (syllabus.credits) md += `- **Credits:** ${syllabus.credits}\n`;
  if (syllabus.level) md += `- **Level:** ${syllabus.level}\n`;
  if (syllabus.prerequisites && syllabus.prerequisites.length > 0) {
    md += `- **Prerequisites:** ${syllabus.prerequisites.join(', ')}\n`;
  }

  if (syllabus.meeting_times) {
    const mt = syllabus.meeting_times;
    if (mt.days) md += `- **Days:** ${mt.days.join(', ')}\n`;
    if (mt.time) md += `- **Time:** ${mt.time}\n`;
    if (mt.location) md += `- **Location:** ${mt.location}\n`;
  }
  md += '\n';

  // Instructor
  if (syllabus.instructor) {
    md += `## Instructor\n\n`;
    const inst = syllabus.instructor;
    if (inst.name) md += `- **${inst.title || 'Instructor'}:** ${inst.name}\n`;
    if (inst.email) md += `- **Email:** ${inst.email}\n`;
    if (inst.office) md += `- **Office:** ${inst.office}\n`;
    if (inst.office_hours) md += `- **Office Hours:** ${inst.office_hours}\n`;
    md += '\n';
  }

  // Description
  if (syllabus.description) {
    md += `## Course Description\n\n${syllabus.description}\n\n`;
  }

  // Learning Objectives
  if (syllabus.learning_objectives && syllabus.learning_objectives.length > 0) {
    md += `## Learning Objectives\n\nBy the end of this course, students will be able to:\n\n`;
    syllabus.learning_objectives.forEach((obj, i) => {
      md += `${i + 1}. ${obj}\n`;
    });
    md += '\n';
  }

  // Materials
  if (syllabus.required_materials) {
    md += `## Required Materials\n\n`;
    if (syllabus.required_materials.textbooks) {
      md += `### Textbooks\n\n`;
      syllabus.required_materials.textbooks.forEach(book => {
        md += `- **${book.title}** by ${book.author}`;
        if (book.edition) md += ` (${book.edition})`;
        md += '\n';
      });
      md += '\n';
    }
    if (syllabus.required_materials.software) {
      md += `### Software\n\n`;
      syllabus.required_materials.software.forEach(sw => {
        md += `- **${sw.name}**`;
        if (sw.version) md += ` ${sw.version}`;
        if (sw.license) md += ` (${sw.license})`;
        md += '\n';
      });
      md += '\n';
    }
  }

  // Grading
  if (syllabus.grading) {
    md += `## Grading\n\n`;
    if (syllabus.grading.components) {
      md += `| Component | Weight |\n|-----------|--------|\n`;
      syllabus.grading.components.forEach(comp => {
        md += `| ${comp.name} | ${comp.percentage}% |\n`;
      });
      md += '\n';
    }
  }

  // Schedule
  if (syllabus.schedule && syllabus.schedule.length > 0) {
    md += `## Course Schedule\n\n`;
    md += `| Week | Topic | Readings | Due |\n`;
    md += `|------|-------|----------|-----|\n`;
    syllabus.schedule.forEach(week => {
      const readings = week.readings ? week.readings.join('; ') : '-';
      const due = week.assignments_due && week.assignments_due.length > 0
        ? week.assignments_due.join('; ')
        : '-';
      md += `| ${week.week} | ${week.topic} | ${readings} | ${due} |\n`;
    });
    md += '\n';
  }

  // Important Dates
  if (syllabus.important_dates && syllabus.important_dates.length > 0) {
    md += `## Important Dates\n\n`;
    syllabus.important_dates.forEach(date => {
      md += `- **${date.date}:** ${date.event}\n`;
    });
    md += '\n';
  }

  // Policies
  if (syllabus.policies) {
    md += `## Course Policies\n\n`;
    if (syllabus.policies.academic_integrity) {
      md += `### Academic Integrity\n\n${syllabus.policies.academic_integrity}\n\n`;
    }
    if (syllabus.policies.accessibility) {
      md += `### Accessibility\n\n${syllabus.policies.accessibility}\n\n`;
    }
    if (syllabus.policies.attendance) {
      md += `### Attendance\n\n${syllabus.policies.attendance}\n\n`;
    }
    if (syllabus.policies.late_policy) {
      md += `### Late Work\n\n${syllabus.policies.late_policy}\n\n`;
    }
  }

  return md;
}

// Export for command usage
export {
  DEFAULT_GRADING_SCALE,
  DEFAULT_GRADING_COMPONENTS,
  STANDARD_POLICIES,
  formatAsMarkdown
};
