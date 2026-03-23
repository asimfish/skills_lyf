/**
 * Conversational Assignment Generator for Claude Code
 *
 * Uses Claude Code's conversational interface instead of API calls.
 * Perfect for Max users who want to generate assignments through chat.
 *
 * Usage in Claude Code:
 * - Ask Claude to generate a homework assignment
 * - Provide requirements (topic, type, problems, difficulty)
 * - Claude generates and saves the assignment
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { loadTemplate } from '../templates/loader.js';

/**
 * Default problem difficulty distribution
 */
const DEFAULT_PROBLEM_DISTRIBUTION = {
  easy: 0.2,
  medium: 0.5,
  hard: 0.25,
  challenge: 0.05
};

/**
 * Generate assignment prompt for conversational generation
 * @param {Object} options - Assignment options
 * @returns {Object} Prompt and metadata for Claude
 */
export function buildConversationalPrompt(options = {}) {
  const config = loadTeachConfig(process.cwd());
  const courseInfo = config.scholar?.course_info || {};

  const assignmentOptions = {
    type: options.type || 'homework',
    topic: options.topic || '',
    problemCount: options.problemCount || 5,
    difficulty: options.difficulty || courseInfo.difficulty || 'intermediate',
    topics: options.topics || [],
    assignmentNumber: options.assignmentNumber || null,
    dueDate: options.dueDate || null,
    totalPoints: options.totalPoints || 100,
    estimatedTime: options.estimatedTime || '2-3 hours',
    submissionFormat: options.submissionFormat || 'pdf',
    collaborationPolicy: options.collaborationPolicy || 'individual',
    includeCode: options.includeCode || false,
    language: options.language || 'R',
    generateSolutions: options.generateSolutions !== false,
    generateRubric: options.generateRubric !== false,
    week: options.week || null,
    learningObjectives: options.learningObjectives || []
  };

  // Calculate problem distribution
  const distribution = {};
  Object.entries(DEFAULT_PROBLEM_DISTRIBUTION).forEach(([diff, ratio]) => {
    distribution[diff] = Math.round(assignmentOptions.problemCount * ratio);
  });

  // Ensure at least 1 easy, rest medium
  if (distribution.easy < 1) distribution.easy = 1;
  if (distribution.challenge < 1 && assignmentOptions.difficulty === 'advanced') {
    distribution.challenge = 1;
  }

  // Assignment type descriptions
  const typeDescriptions = {
    homework: 'a weekly homework assignment',
    'problem-set': 'a comprehensive problem set',
    lab: 'a hands-on lab exercise',
    project: 'a project assignment',
    worksheet: 'an in-class worksheet'
  };

  const assignmentDescription = typeDescriptions[assignmentOptions.type] || 'an assignment';

  const topicsSection = assignmentOptions.topics.length > 0
    ? `Topics: ${assignmentOptions.topics.join(', ')}`
    : assignmentOptions.topic
      ? `Topic: ${assignmentOptions.topic}`
      : 'Topics: Cover recent course material';

  const weekSection = assignmentOptions.week
    ? `Week ${assignmentOptions.week}`
    : '';

  const codeSection = assignmentOptions.includeCode
    ? `\n- Include ${assignmentOptions.language} coding problems`
    : '';

  return {
    prompt: `
Generate ${assignmentDescription} for ${courseInfo.code || 'the course'}: ${courseInfo.title || ''}.

Course Information:
- Level: ${courseInfo.level || 'undergraduate'}
- Field: ${courseInfo.field || 'statistics'}
${weekSection ? `- ${weekSection}` : ''}

Assignment Requirements:
- Total problems: ${assignmentOptions.problemCount}
- Total points: ${assignmentOptions.totalPoints}
- Difficulty: ${assignmentOptions.difficulty}
- Estimated time: ${assignmentOptions.estimatedTime}
- Submission format: ${assignmentOptions.submissionFormat}
- Collaboration: ${assignmentOptions.collaborationPolicy}${codeSection}

${topicsSection}

${assignmentOptions.learningObjectives.length > 0 ? `Learning Objectives:\n${assignmentOptions.learningObjectives.map(o => `- ${o}`).join('\n')}` : ''}

Problem Distribution by Difficulty:
${Object.entries(distribution).map(([diff, count]) => `- ${diff}: ${count} problems`).join('\n')}

## Output Requirements

Generate a JSON object with this exact structure:

\`\`\`json
{
  "title": "Assignment title",
  "assignment_type": "${assignmentOptions.type}",
  "assignment_number": ${assignmentOptions.assignmentNumber || 'null'},
  "due_date": ${assignmentOptions.dueDate ? `"${assignmentOptions.dueDate}"` : 'null'},
  "total_points": ${assignmentOptions.totalPoints},
  "estimated_time": "${assignmentOptions.estimatedTime}",
  "instructions": "Clear instructions for students...",
  "submission_format": "${assignmentOptions.submissionFormat}",
  "collaboration_policy": "${assignmentOptions.collaborationPolicy}",
  "topic": "${assignmentOptions.topic}",
  "week": ${assignmentOptions.week || 'null'},
  "learning_objectives": ["LO1", "LO2"],
  "problems": [
    {
      "id": "P1",
      "text": "Problem statement with LaTeX: $\\\\beta_0 + \\\\beta_1 x$",
      "points": 20,
      "parts": [
        {"label": "a", "text": "Part a question", "points": 10},
        {"label": "b", "text": "Part b question", "points": 10}
      ],
      "difficulty": "easy",
      "topic": "topic name",
      "hints": ["Hint if helpful"]
    }
  ],
  "solutions": {
    "P1": {
      "answer": "Final answer",
      "steps": ["Step 1", "Step 2"],
      "parts": {"a": "Part a solution", "b": "Part b solution"}
    }
  },
  "rubric": {
    "P1": {
      "full_credit": "Criteria for full points",
      "partial_credit": [
        {"points": 15, "criteria": "Correct approach, minor errors"}
      ],
      "common_errors": ["Common mistake"]
    }
  }
}
\`\`\`

## Guidelines

1. **Problems:** Create ${assignmentOptions.problemCount} problems with clear statements
2. **Multi-part problems:** Use parts (a, b, c) for complex problems
3. **LaTeX:** Use LaTeX for math: $\\\\beta$, $\\\\sum_{i=1}^n x_i$
4. **Solutions:** Provide step-by-step solutions${assignmentOptions.generateSolutions ? '' : ' (optional)'}
5. **Rubric:** Include grading criteria${assignmentOptions.generateRubric ? '' : ' (optional)'}
6. **Real-world context:** Include applications when appropriate
${assignmentOptions.includeCode ? `7. **Code:** Include ${assignmentOptions.language} code problems with sample code in solutions` : ''}

Return ONLY the JSON object.
`,
    options: assignmentOptions,
    config: courseInfo,
    distribution: distribution
  };
}

/**
 * Process conversationally generated assignment content
 * @param {Object|string} content - Generated content (JSON object or string)
 * @param {Object} options - Processing options
 * @returns {Object} Processed and validated assignment
 */
export function processGeneratedAssignment(content, options = {}) {
  // Parse if string
  const assignment = typeof content === 'string' ? JSON.parse(content) : content;

  // Load config for enrichment
  const config = loadTeachConfig(process.cwd());

  // Add generated_by metadata directly (avoid template issues)
  assignment.generated_by = {
    tool: 'scholar-conversational',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  };

  // Add course info if available
  if (config.scholar?.course_info) {
    assignment.course_info = config.scholar.course_info;
  }

  // Ensure required fields
  assignment.metadata = assignment.metadata || {};
  assignment.metadata.generated_at = new Date().toISOString();
  assignment.metadata.generator = 'scholar-assignment-conversational';

  // Calculate total points if not set
  if (!assignment.total_points && assignment.problems) {
    assignment.total_points = assignment.problems.reduce((sum, p) => {
      if (p.parts && p.parts.length > 0) {
        return sum + p.parts.reduce((partSum, part) => partSum + (part.points || 0), 0);
      }
      return sum + (p.points || 0);
    }, 0);
  }

  // Validate if strict mode
  if (options.strict) {
    const validator = new ValidatorEngine({ strict: true });
    const validation = validator.validateSync(assignment, loadTemplate('assignment'));
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return assignment;
}

/**
 * Save assignment to file
 * @param {Object} assignment - Assignment object
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Save options
 * @returns {Object} Save result with filepath
 */
export function saveAssignment(assignment, filename, options = {}) {
  const format = options.format || 'json';
  const outputDir = options.outputDir || process.cwd();

  let content;
  let extension;

  switch (format) {
    case 'json':
      content = JSON.stringify(assignment, null, 2);
      extension = '.json';
      break;
    case 'markdown':
    case 'md':
      content = formatAsMarkdown(assignment);
      extension = '.md';
      break;
    default:
      content = JSON.stringify(assignment, null, 2);
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
 * Format assignment as Markdown
 */
function formatAsMarkdown(assignment) {
  let md = `# ${assignment.title || 'Assignment'}\n\n`;

  if (assignment.due_date) {
    md += `**Due:** ${assignment.due_date}\n`;
  }
  if (assignment.total_points) {
    md += `**Total Points:** ${assignment.total_points}\n`;
  }
  if (assignment.estimated_time) {
    md += `**Estimated Time:** ${assignment.estimated_time}\n`;
  }
  md += '\n';

  if (assignment.instructions) {
    md += `## Instructions\n\n${assignment.instructions}\n\n`;
  }

  if (assignment.collaboration_policy) {
    md += `**Collaboration Policy:** ${assignment.collaboration_policy}\n\n`;
  }

  // Problems
  md += `## Problems\n\n`;

  if (assignment.problems) {
    assignment.problems.forEach((problem, idx) => {
      md += `### Problem ${problem.id || idx + 1}`;
      if (problem.points) {
        md += ` (${problem.points} points)`;
      }
      md += `\n\n`;

      md += `${problem.text}\n\n`;

      if (problem.parts && problem.parts.length > 0) {
        problem.parts.forEach(part => {
          md += `**(${part.label})** ${part.text}`;
          if (part.points) {
            md += ` [${part.points} pts]`;
          }
          md += `\n\n`;
        });
      }

      if (problem.hints && problem.hints.length > 0) {
        md += `> **Hint:** ${problem.hints[0]}\n\n`;
      }
    });
  }

  // Solutions (if included)
  if (assignment.solutions && Object.keys(assignment.solutions).length > 0) {
    md += `---\n\n## Solutions\n\n`;

    Object.entries(assignment.solutions).forEach(([id, solution]) => {
      md += `### ${id}\n\n`;

      if (typeof solution === 'string') {
        md += `${solution}\n\n`;
      } else {
        if (solution.steps && solution.steps.length > 0) {
          solution.steps.forEach((step, i) => {
            md += `${i + 1}. ${step}\n`;
          });
          md += '\n';
        }
        if (solution.answer) {
          md += `**Answer:** ${solution.answer}\n\n`;
        }
        if (solution.parts) {
          Object.entries(solution.parts).forEach(([label, sol]) => {
            md += `**(${label})** ${sol}\n\n`;
          });
        }
        if (solution.code) {
          md += `\`\`\`r\n${solution.code}\n\`\`\`\n\n`;
        }
      }
    });
  }

  return md;
}

// Export for command usage
export {
  DEFAULT_PROBLEM_DISTRIBUTION,
  formatAsMarkdown
};
