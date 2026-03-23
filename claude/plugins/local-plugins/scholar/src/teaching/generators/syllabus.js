/**
 * Syllabus Generator
 *
 * Generates comprehensive course syllabi using Phase 0 foundation components:
 * - Template System for schema and structure
 * - Config Loader for course settings
 * - Validator Engine for content validation
 * - AI Provider for content generation
 *
 * Syllabi are document-oriented and include:
 * - Course and instructor information
 * - Learning objectives
 * - Grading policies and scales
 * - Weekly schedule with topics and readings
 * - University policies and resources
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadTemplate } from '../templates/loader.js';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { AIProvider } from '../ai/provider.js';

/**
 * Syllabus generator options
 * @typedef {Object} SyllabusOptions
 * @property {string} courseTitle - Course title
 * @property {string} courseCode - Course number/code
 * @property {string} semester - Semester/term
 * @property {number} credits - Credit hours
 * @property {string} level - Course level (undergraduate, graduate, doctoral)
 * @property {number} weeks - Number of weeks in the course
 * @property {string} format - Delivery format (in-person, online, hybrid)
 * @property {Array<string>} topics - Main topics to cover
 * @property {Object} instructor - Instructor information
 * @property {boolean} includeTemplatePolicy - Include standard policy templates
 * @property {boolean} strict - Use strict validation
 * @property {boolean} debug - Enable debug logging
 */

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
 * Default grading components for statistics courses
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
  academic_integrity: `Academic integrity is taken seriously in this course. All submitted work must be your own unless explicitly stated otherwise. Plagiarism, cheating, and other forms of academic dishonesty will result in disciplinary action according to university policy. When in doubt, ask the instructor.`,

  accessibility: `The university is committed to providing equal access to all students. If you have a documented disability that requires accommodations, please contact the Disability Resource Center and provide documentation to the instructor within the first two weeks of class. We will work together to ensure appropriate accommodations are in place.`,

  attendance: `Regular attendance is expected and encouraged. While attendance is not directly graded, consistent participation significantly contributes to understanding course material. If you must miss class, please notify the instructor in advance when possible and obtain notes from a classmate.`,

  communication: `Email is the preferred method of communication. I will respond to emails within 24 hours on weekdays. For urgent matters, please include "URGENT" in the subject line. Check your university email regularly for course announcements.`,

  late_policy: `Late assignments will be penalized 10% per day, up to a maximum of 3 days late. After 3 days, assignments will not be accepted without prior arrangement. Extensions may be granted for documented emergencies or university-sanctioned events if requested in advance.`,

  technology: `Laptops and tablets may be used for note-taking and course-related activities. Please silence cell phones during class. Recording of lectures is permitted for personal study only and may not be shared without instructor permission.`,

  mental_health: `Your mental health is important. If you are experiencing stress, anxiety, or other challenges that affect your academic performance, please reach out to the Counseling Center. The instructor is also available during office hours to discuss any concerns confidentially.`,

  diversity: `This classroom is a space where diversity is valued and respected. We welcome students of all backgrounds, perspectives, and identities. Discrimination or harassment of any kind will not be tolerated.`
};

/**
 * Generate a syllabus with AI
 * @param {SyllabusOptions} options - Generation options
 * @returns {Promise<Object>} Generated syllabus with metadata
 */
export async function generateSyllabus(options = {}) {
  // 1. Load configuration
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  // 2. Merge options with config defaults
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
    teachingAssistants: options.teachingAssistants || [],
    meetingTimes: options.meetingTimes || {},
    prerequisites: options.prerequisites || [],
    textbooks: options.textbooks || [],
    software: options.software || [],
    gradingComponents: options.gradingComponents || DEFAULT_GRADING_COMPONENTS,
    gradingScale: options.gradingScale || DEFAULT_GRADING_SCALE,
    includeTemplatePolicy: options.includeTemplatePolicy !== false,
    customPolicies: options.customPolicies || {},
    includeSchedule: options.includeSchedule !== false,
    strict: options.strict || false,
    debug: options.debug || false
  };

  if (syllabusOptions.debug) {
    console.log('[Syllabus] Options:', JSON.stringify(syllabusOptions, null, 2));
  }

  // 3. Load syllabus template
  const syllabusTemplate = loadTemplate('syllabus');

  // 4. Build prompt for AI generation (or use pre-merged prompt from InstructionMerger)
  const prompt = options.mergedPrompt || buildSyllabusPrompt(syllabusOptions, courseInfo);

  if (syllabusOptions.debug) {
    if (options.mergedPrompt) {
      console.log('[Syllabus] 🔧 Using merged prompt from InstructionMerger');
    }
    console.log('[Syllabus] Prompt length:', prompt.length);
  }

  // 5. Generate syllabus content with AI
  const ai = new AIProvider();
  let generatedContent;

  try {
    generatedContent = await ai.generate({
      prompt,
      schema: syllabusTemplate,
      temperature: 0.7,
      maxTokens: 8000
    });
  } catch (error) {
    throw new Error(`AI generation failed: ${error.message}`, { cause: error });
  }

  // 6. Parse and process generated content
  let syllabus;
  try {
    syllabus = typeof generatedContent === 'string'
      ? JSON.parse(generatedContent)
      : generatedContent;
  } catch (parseError) {
    throw new Error(`Failed to parse AI response: ${parseError.message}`, { cause: parseError });
  }

  // 7. Enrich with provided information
  syllabus = enrichSyllabus(syllabus, syllabusOptions);

  // 8. Add standard policies if requested
  if (syllabusOptions.includeTemplatePolicy) {
    syllabus.policies = {
      ...STANDARD_POLICIES,
      ...syllabus.policies,
      ...syllabusOptions.customPolicies
    };
  }

  // 9. Add metadata
  syllabus.metadata = {
    generated_at: new Date().toISOString(),
    generator: 'scholar-syllabus',
    version: '2.0.0'
  };

  // 10. Validate generated content
  if (syllabusOptions.strict) {
    const validator = new ValidatorEngine({ strict: true });
    const validation = validator.validateSync(syllabus, syllabusTemplate);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return syllabus;
}

/**
 * Build AI prompt for syllabus generation
 * @param {Object} options - Syllabus options
 * @param {Object} courseInfo - Course information from config
 * @returns {string} Prompt for AI
 */
function buildSyllabusPrompt(options, courseInfo) {
  const levelDescriptions = {
    undergraduate: 'undergraduate students with foundational knowledge',
    graduate: 'graduate students with advanced preparation',
    doctoral: 'doctoral students with research focus'
  };

  const topicsSection = options.topics.length > 0
    ? `Main Topics to Cover:\n${options.topics.map(t => `- ${t}`).join('\n')}`
    : 'Generate appropriate topics based on the course title and level.';

  const softwareSection = options.software.length > 0
    ? `Required Software:\n${options.software.map(s => `- ${s.name || s}`).join('\n')}`
    : courseInfo.field === 'statistics'
      ? 'Include R and/or Python for statistical computing.'
      : '';

  return `
Generate a comprehensive course syllabus for:

Course: ${options.courseTitle} (${options.courseCode})
Semester: ${options.semester}
Credits: ${options.credits}
Level: ${options.level} - designed for ${levelDescriptions[options.level] || 'students'}
Field: ${courseInfo.field || 'statistics'}
Format: ${options.format}
Weeks: ${options.weeks}

${topicsSection}

${options.prerequisites.length > 0 ? `Prerequisites: ${options.prerequisites.join(', ')}` : ''}

${softwareSection}

## Required Output Structure

Generate a JSON object with this structure:

\`\`\`json
{
  "title": "${options.courseTitle}",
  "course_code": "${options.courseCode}",
  "semester": "${options.semester}",
  "credits": ${options.credits},
  "level": "${options.level}",
  "prerequisites": ["course1", "course2"],
  "description": "A comprehensive course description (100-200 words)...",
  "learning_objectives": [
    "Apply statistical methods to...",
    "Analyze data using...",
    "Interpret results from...",
    "Communicate findings through..."
  ],
  "required_materials": {
    "textbooks": [
      {
        "title": "Textbook title",
        "author": "Author name",
        "edition": "Edition",
        "isbn": "ISBN if known",
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
    "components": ${JSON.stringify(options.gradingComponents)},
    "scale": ${JSON.stringify(options.gradingScale)},
    "late_policy": "Late assignments lose 10% per day..."
  },
  "schedule": [
    {
      "week": 1,
      "topic": "Introduction and Course Overview",
      "readings": ["Chapter 1"],
      "assignments_due": []
    }
  ]
}
\`\`\`

## Requirements

1. **Course Description**: Write an engaging, informative description (100-200 words) appropriate for the course catalog.

2. **Learning Objectives**: Create 5-8 measurable learning objectives using action verbs (apply, analyze, evaluate, create, etc.). Avoid vague terms like "understand" or "know".

3. **Textbook Recommendations**: Suggest appropriate textbooks for a ${options.level} ${courseInfo.field || 'statistics'} course.

4. **Course Schedule**: Create a ${options.weeks}-week schedule with:
   - Logical topic progression
   - Assigned readings
   - When assignments are due
   - Mark exam weeks and breaks appropriately

5. **Appropriate Level**: Ensure content difficulty matches ${options.level} level.

Return ONLY the JSON object.
`;
}

/**
 * Enrich syllabus with provided instructor/course information
 * @param {Object} syllabus - Generated syllabus
 * @param {Object} options - Original options with provided data
 * @returns {Object} Enriched syllabus
 */
function enrichSyllabus(syllabus, options) {
  // Override with provided instructor info
  if (options.instructor && Object.keys(options.instructor).length > 0) {
    syllabus.instructor = {
      ...syllabus.instructor,
      ...options.instructor
    };
  }

  // Add teaching assistants if provided
  if (options.teachingAssistants && options.teachingAssistants.length > 0) {
    syllabus.teaching_assistants = options.teachingAssistants;
  }

  // Add meeting times if provided
  if (options.meetingTimes && Object.keys(options.meetingTimes).length > 0) {
    syllabus.meeting_times = options.meetingTimes;
  }

  // Override grading if provided
  if (options.gradingComponents !== DEFAULT_GRADING_COMPONENTS) {
    syllabus.grading = {
      ...syllabus.grading,
      components: options.gradingComponents
    };
  }

  if (options.gradingScale !== DEFAULT_GRADING_SCALE) {
    syllabus.grading = {
      ...syllabus.grading,
      scale: options.gradingScale
    };
  }

  // Add prerequisites if provided
  if (options.prerequisites && options.prerequisites.length > 0) {
    syllabus.prerequisites = options.prerequisites;
  }

  // Add textbooks if provided
  if (options.textbooks && options.textbooks.length > 0) {
    syllabus.required_materials = syllabus.required_materials || {};
    syllabus.required_materials.textbooks = options.textbooks;
  }

  // Add software if provided
  if (options.software && options.software.length > 0) {
    syllabus.required_materials = syllabus.required_materials || {};
    syllabus.required_materials.software = options.software;
  }

  return syllabus;
}

/**
 * Export syllabus in specified format
 * @param {Object} syllabus - Syllabus object
 * @param {string} format - Output format (markdown, json, latex, html)
 * @returns {Promise<Object>} Export result with content and format
 */
export async function exportSyllabus(syllabus, format = 'markdown') {
  const formatLower = format.toLowerCase();

  const supportedFormats = ['markdown', 'md', 'json', 'latex', 'tex', 'html'];
  if (!supportedFormats.includes(formatLower)) {
    throw new Error(`Unsupported format: ${format}. Supported: ${supportedFormats.join(', ')}`);
  }

  let content;

  switch (formatLower) {
    case 'json':
      content = JSON.stringify(syllabus, null, 2);
      break;
    case 'latex':
    case 'tex':
      content = formatSyllabusAsLaTeX(syllabus);
      break;
    case 'html':
      content = formatSyllabusAsHTML(syllabus);
      break;
    case 'markdown':
    case 'md':
    default:
      content = formatSyllabusAsMarkdown(syllabus);
      break;
  }

  return {
    content,
    format: formatLower === 'md' ? 'markdown' : formatLower === 'tex' ? 'latex' : formatLower
  };
}

/**
 * Format syllabus as Markdown
 * @param {Object} syllabus - Syllabus object
 * @returns {string} Markdown content
 */
function formatSyllabusAsMarkdown(syllabus) {
  let md = `# ${syllabus.title || 'Course Syllabus'}\n`;
  md += `## ${syllabus.course_code || ''} - ${syllabus.semester || ''}\n\n`;

  // Course Information
  md += `## Course Information\n\n`;
  if (syllabus.credits) md += `- **Credits:** ${syllabus.credits}\n`;
  if (syllabus.level) md += `- **Level:** ${syllabus.level}\n`;
  if (syllabus.prerequisites && syllabus.prerequisites.length > 0) {
    md += `- **Prerequisites:** ${syllabus.prerequisites.join(', ')}\n`;
  }

  // Meeting Times
  if (syllabus.meeting_times) {
    const mt = syllabus.meeting_times;
    if (mt.days) md += `- **Days:** ${mt.days.join(', ')}\n`;
    if (mt.time) md += `- **Time:** ${mt.time}\n`;
    if (mt.location) md += `- **Location:** ${mt.location}\n`;
    if (mt.format) md += `- **Format:** ${mt.format}\n`;
  }
  md += '\n';

  // Instructor Information
  if (syllabus.instructor) {
    md += `## Instructor\n\n`;
    const inst = syllabus.instructor;
    if (inst.name) md += `- **Name:** ${inst.title ? inst.title + ' ' : ''}${inst.name}\n`;
    if (inst.email) md += `- **Email:** ${inst.email}\n`;
    if (inst.office) md += `- **Office:** ${inst.office}\n`;
    if (inst.office_hours) md += `- **Office Hours:** ${inst.office_hours}\n`;
    if (inst.phone) md += `- **Phone:** ${inst.phone}\n`;
    md += '\n';
  }

  // Teaching Assistants
  if (syllabus.teaching_assistants && syllabus.teaching_assistants.length > 0) {
    md += `## Teaching Assistants\n\n`;
    syllabus.teaching_assistants.forEach(ta => {
      md += `### ${ta.name}\n`;
      if (ta.email) md += `- **Email:** ${ta.email}\n`;
      if (ta.office_hours) md += `- **Office Hours:** ${ta.office_hours}\n`;
      if (ta.office) md += `- **Office:** ${ta.office}\n`;
      md += '\n';
    });
  }

  // Course Description
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

  // Required Materials
  if (syllabus.required_materials) {
    md += `## Required Materials\n\n`;

    if (syllabus.required_materials.textbooks && syllabus.required_materials.textbooks.length > 0) {
      md += `### Textbooks\n\n`;
      syllabus.required_materials.textbooks.forEach(book => {
        md += `- **${book.title}** by ${book.author}`;
        if (book.edition) md += ` (${book.edition})`;
        if (book.isbn) md += ` - ISBN: ${book.isbn}`;
        if (!book.required) md += ' *(optional)*';
        md += '\n';
      });
      md += '\n';
    }

    if (syllabus.required_materials.software && syllabus.required_materials.software.length > 0) {
      md += `### Software\n\n`;
      syllabus.required_materials.software.forEach(sw => {
        md += `- **${sw.name}**`;
        if (sw.version) md += ` (${sw.version})`;
        if (sw.license) md += ` - ${sw.license}`;
        md += '\n';
      });
      md += '\n';
    }

    if (syllabus.required_materials.other && syllabus.required_materials.other.length > 0) {
      md += `### Other Materials\n\n`;
      syllabus.required_materials.other.forEach(item => {
        md += `- ${item}\n`;
      });
      md += '\n';
    }
  }

  // Grading
  if (syllabus.grading) {
    md += `## Grading\n\n`;

    if (syllabus.grading.components && syllabus.grading.components.length > 0) {
      md += `### Grade Components\n\n`;
      md += `| Component | Weight | Details |\n`;
      md += `|-----------|--------|---------|  \n`;
      syllabus.grading.components.forEach(comp => {
        md += `| ${comp.name} | ${comp.percentage}% | ${comp.details || ''} |\n`;
      });
      md += '\n';
    }

    if (syllabus.grading.scale && syllabus.grading.scale.length > 0) {
      md += `### Grading Scale\n\n`;
      md += `| Grade | Range |\n`;
      md += `|-------|-------|\n`;
      syllabus.grading.scale.forEach(g => {
        md += `| ${g.grade} | ${g.minimum}-${g.maximum}% |\n`;
      });
      md += '\n';
    }

    if (syllabus.grading.late_policy) {
      md += `### Late Policy\n\n${syllabus.grading.late_policy}\n\n`;
    }
  }

  // Course Schedule
  if (syllabus.schedule && syllabus.schedule.length > 0) {
    md += `## Course Schedule\n\n`;
    md += `| Week | Topic | Readings | Due |\n`;
    md += `|------|-------|----------|-----|\n`;
    syllabus.schedule.forEach(week => {
      if (week.is_break) {
        md += `| ${week.week} | *${week.topic || 'Break'}* | - | - |\n`;
      } else {
        const readings = week.readings ? week.readings.join('; ') : '-';
        const due = week.assignments_due ? week.assignments_due.join('; ') : '-';
        md += `| ${week.week} | ${week.topic} | ${readings} | ${due} |\n`;
      }
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

    const policyTitles = {
      attendance: 'Attendance',
      participation: 'Participation',
      academic_integrity: 'Academic Integrity',
      accessibility: 'Accessibility & Accommodations',
      communication: 'Communication',
      technology: 'Technology',
      late_policy: 'Late Work Policy',
      mental_health: 'Mental Health Resources',
      diversity: 'Diversity & Inclusion',
      recording: 'Recording Policy',
      emergency: 'Emergency Procedures'
    };

    Object.entries(syllabus.policies).forEach(([key, value]) => {
      if (value) {
        const title = policyTitles[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        md += `### ${title}\n\n${value}\n\n`;
      }
    });
  }

  // Resources
  if (syllabus.resources) {
    md += `## Resources\n\n`;
    if (syllabus.resources.tutoring) md += `- **Tutoring:** ${syllabus.resources.tutoring}\n`;
    if (syllabus.resources.writing_center) md += `- **Writing Center:** ${syllabus.resources.writing_center}\n`;
    if (syllabus.resources.library) md += `- **Library:** ${syllabus.resources.library}\n`;
    if (syllabus.resources.technology_support) md += `- **IT Support:** ${syllabus.resources.technology_support}\n`;
    if (syllabus.resources.supplemental_materials && syllabus.resources.supplemental_materials.length > 0) {
      md += `\n### Supplemental Materials\n\n`;
      syllabus.resources.supplemental_materials.forEach(item => {
        md += `- ${item}\n`;
      });
    }
    md += '\n';
  }

  return md;
}

/**
 * Format syllabus as LaTeX
 * @param {Object} syllabus - Syllabus object
 * @returns {string} LaTeX content
 */
function formatSyllabusAsLaTeX(syllabus) {
  let tex = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{enumitem}

\\title{${syllabus.title || 'Course Syllabus'}}
\\author{${syllabus.instructor?.name || ''}}
\\date{${syllabus.semester || ''}}

\\begin{document}
\\maketitle

\\section*{Course Information}
\\begin{description}
  \\item[Course:] ${syllabus.course_code || ''} - ${syllabus.title || ''}
  \\item[Semester:] ${syllabus.semester || ''}
  \\item[Credits:] ${syllabus.credits || ''}
`;

  if (syllabus.meeting_times) {
    if (syllabus.meeting_times.days) {
      tex += `  \\item[Meeting Days:] ${syllabus.meeting_times.days.join(', ')}\n`;
    }
    if (syllabus.meeting_times.time) {
      tex += `  \\item[Time:] ${syllabus.meeting_times.time}\n`;
    }
    if (syllabus.meeting_times.location) {
      tex += `  \\item[Location:] ${syllabus.meeting_times.location}\n`;
    }
  }

  tex += `\\end{description}\n\n`;

  // Instructor
  if (syllabus.instructor) {
    tex += `\\section*{Instructor}
\\begin{description}
  \\item[Name:] ${syllabus.instructor.title ? syllabus.instructor.title + ' ' : ''}${syllabus.instructor.name || ''}
  \\item[Email:] \\href{mailto:${syllabus.instructor.email || ''}}{${syllabus.instructor.email || ''}}
`;
    if (syllabus.instructor.office) {
      tex += `  \\item[Office:] ${syllabus.instructor.office}\n`;
    }
    if (syllabus.instructor.office_hours) {
      tex += `  \\item[Office Hours:] ${syllabus.instructor.office_hours}\n`;
    }
    tex += `\\end{description}\n\n`;
  }

  // Description
  if (syllabus.description) {
    tex += `\\section*{Course Description}\n${syllabus.description}\n\n`;
  }

  // Learning Objectives
  if (syllabus.learning_objectives && syllabus.learning_objectives.length > 0) {
    tex += `\\section*{Learning Objectives}
By the end of this course, students will be able to:
\\begin{enumerate}
`;
    syllabus.learning_objectives.forEach(obj => {
      tex += `  \\item ${obj}\n`;
    });
    tex += `\\end{enumerate}\n\n`;
  }

  // Grading
  if (syllabus.grading && syllabus.grading.components) {
    tex += `\\section*{Grading}
\\subsection*{Grade Components}
\\begin{tabular}{lrl}
\\toprule
Component & Weight & Details \\\\
\\midrule
`;
    syllabus.grading.components.forEach(comp => {
      tex += `${comp.name} & ${comp.percentage}\\% & ${comp.details || ''} \\\\\n`;
    });
    tex += `\\bottomrule
\\end{tabular}\n\n`;
  }

  // Schedule (simplified)
  if (syllabus.schedule && syllabus.schedule.length > 0) {
    tex += `\\section*{Course Schedule}
\\begin{tabular}{rll}
\\toprule
Week & Topic & Due \\\\
\\midrule
`;
    syllabus.schedule.forEach(week => {
      const due = week.assignments_due && week.assignments_due.length > 0
        ? week.assignments_due.join(', ')
        : '-';
      tex += `${week.week} & ${week.topic || 'TBD'} & ${due} \\\\\n`;
    });
    tex += `\\bottomrule
\\end{tabular}\n\n`;
  }

  // Policies
  if (syllabus.policies) {
    tex += `\\section*{Course Policies}\n\n`;
    if (syllabus.policies.academic_integrity) {
      tex += `\\subsection*{Academic Integrity}\n${syllabus.policies.academic_integrity}\n\n`;
    }
    if (syllabus.policies.accessibility) {
      tex += `\\subsection*{Accessibility}\n${syllabus.policies.accessibility}\n\n`;
    }
    if (syllabus.policies.attendance) {
      tex += `\\subsection*{Attendance}\n${syllabus.policies.attendance}\n\n`;
    }
  }

  tex += `\\end{document}`;

  return tex;
}

/**
 * Format syllabus as HTML
 * @param {Object} syllabus - Syllabus object
 * @returns {string} HTML content
 */
function formatSyllabusAsHTML(syllabus) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${syllabus.title || 'Course Syllabus'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    h2 { color: #333; margin-top: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; }
    h3 { color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .info-item { margin: 0.5rem 0; }
    .info-label { font-weight: bold; }
    .policy { margin: 1rem 0; }
    .policy-title { font-weight: bold; color: #333; }
  </style>
</head>
<body>
  <h1>${syllabus.title || 'Course Syllabus'}</h1>
  <p><strong>${syllabus.course_code || ''}</strong> | ${syllabus.semester || ''}</p>
`;

  // Course Info
  html += `<h2>Course Information</h2>
<div class="info-grid">`;
  if (syllabus.credits) html += `<div class="info-item"><span class="info-label">Credits:</span> ${syllabus.credits}</div>`;
  if (syllabus.level) html += `<div class="info-item"><span class="info-label">Level:</span> ${syllabus.level}</div>`;
  if (syllabus.meeting_times?.days) html += `<div class="info-item"><span class="info-label">Days:</span> ${syllabus.meeting_times.days.join(', ')}</div>`;
  if (syllabus.meeting_times?.time) html += `<div class="info-item"><span class="info-label">Time:</span> ${syllabus.meeting_times.time}</div>`;
  if (syllabus.meeting_times?.location) html += `<div class="info-item"><span class="info-label">Location:</span> ${syllabus.meeting_times.location}</div>`;
  html += `</div>\n`;

  // Instructor
  if (syllabus.instructor) {
    html += `<h2>Instructor</h2>
<div class="info-grid">
  <div class="info-item"><span class="info-label">Name:</span> ${syllabus.instructor.title ? syllabus.instructor.title + ' ' : ''}${syllabus.instructor.name || ''}</div>
  <div class="info-item"><span class="info-label">Email:</span> <a href="mailto:${syllabus.instructor.email}">${syllabus.instructor.email}</a></div>`;
    if (syllabus.instructor.office) html += `<div class="info-item"><span class="info-label">Office:</span> ${syllabus.instructor.office}</div>`;
    if (syllabus.instructor.office_hours) html += `<div class="info-item"><span class="info-label">Office Hours:</span> ${syllabus.instructor.office_hours}</div>`;
    html += `</div>\n`;
  }

  // Description
  if (syllabus.description) {
    html += `<h2>Course Description</h2>\n<p>${syllabus.description}</p>\n`;
  }

  // Learning Objectives
  if (syllabus.learning_objectives && syllabus.learning_objectives.length > 0) {
    html += `<h2>Learning Objectives</h2>
<p>By the end of this course, students will be able to:</p>
<ol>
`;
    syllabus.learning_objectives.forEach(obj => {
      html += `  <li>${obj}</li>\n`;
    });
    html += `</ol>\n`;
  }

  // Grading
  if (syllabus.grading && syllabus.grading.components) {
    html += `<h2>Grading</h2>
<h3>Grade Components</h3>
<table>
  <thead><tr><th>Component</th><th>Weight</th><th>Details</th></tr></thead>
  <tbody>
`;
    syllabus.grading.components.forEach(comp => {
      html += `    <tr><td>${comp.name}</td><td>${comp.percentage}%</td><td>${comp.details || ''}</td></tr>\n`;
    });
    html += `  </tbody>
</table>\n`;
  }

  // Schedule
  if (syllabus.schedule && syllabus.schedule.length > 0) {
    html += `<h2>Course Schedule</h2>
<table>
  <thead><tr><th>Week</th><th>Topic</th><th>Readings</th><th>Due</th></tr></thead>
  <tbody>
`;
    syllabus.schedule.forEach(week => {
      const readings = week.readings ? week.readings.join('; ') : '-';
      const due = week.assignments_due ? week.assignments_due.join('; ') : '-';
      if (week.is_break) {
        html += `    <tr><td>${week.week}</td><td><em>${week.topic || 'Break'}</em></td><td>-</td><td>-</td></tr>\n`;
      } else {
        html += `    <tr><td>${week.week}</td><td>${week.topic}</td><td>${readings}</td><td>${due}</td></tr>\n`;
      }
    });
    html += `  </tbody>
</table>\n`;
  }

  // Policies
  if (syllabus.policies) {
    html += `<h2>Course Policies</h2>\n`;
    const policyTitles = {
      attendance: 'Attendance',
      academic_integrity: 'Academic Integrity',
      accessibility: 'Accessibility & Accommodations',
      communication: 'Communication',
      late_policy: 'Late Work Policy'
    };

    Object.entries(syllabus.policies).forEach(([key, value]) => {
      if (value) {
        const title = policyTitles[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        html += `<div class="policy"><p class="policy-title">${title}</p><p>${value}</p></div>\n`;
      }
    });
  }

  html += `</body>
</html>`;

  return html;
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
      content = formatSyllabusAsMarkdown(syllabus);
      extension = '.md';
      break;
    case 'latex':
    case 'tex':
      content = formatSyllabusAsLaTeX(syllabus);
      extension = '.tex';
      break;
    case 'html':
      content = formatSyllabusAsHTML(syllabus);
      extension = '.html';
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

// Export formatters for testing
export {
  formatSyllabusAsMarkdown,
  formatSyllabusAsLaTeX,
  formatSyllabusAsHTML,
  DEFAULT_GRADING_SCALE,
  DEFAULT_GRADING_COMPONENTS,
  STANDARD_POLICIES
};
