/**
 * Assignment Generator
 *
 * Generates homework assignments using Phase 0 foundation components:
 * - Template System for schema and structure
 * - Config Loader for course settings
 * - Validator Engine for content validation
 * - AI Provider for problem generation
 *
 * Assignments differ from exams/quizzes:
 * - Longer form problems with multiple parts
 * - Solutions with step-by-step workings
 * - May include coding components
 * - Due dates and collaboration policies
 * - Grading rubrics for TAs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadTemplate, injectAutoFields, applyDefaults } from '../templates/loader.js';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { AIProvider } from '../ai/provider.js';
import {
  QuartoFormatter,
  LaTeXFormatter,
  isFormatSupported
} from '../formatters/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Assignment generator options
 * @typedef {Object} AssignmentOptions
 * @property {string} type - Assignment type (homework, problem-set, lab, project, worksheet)
 * @property {string} topic - Main topic for the assignment
 * @property {number} problemCount - Number of problems to generate (default: 5)
 * @property {string} difficulty - Difficulty level (beginner, intermediate, advanced)
 * @property {Array<string>} topics - Specific topics/subtopics to cover
 * @property {number} assignmentNumber - Assignment number in sequence
 * @property {string} dueDate - Due date string
 * @property {number} totalPoints - Total possible points
 * @property {string} estimatedTime - Estimated completion time
 * @property {boolean} includeCode - Whether to include coding problems
 * @property {string} language - Programming language for code problems
 * @property {boolean} generateSolutions - Generate solution key
 * @property {boolean} generateRubric - Generate grading rubric
 * @property {boolean} strict - Use strict validation
 * @property {boolean} debug - Enable debug logging
 */

/**
 * Default problem distribution by difficulty
 */
const DEFAULT_PROBLEM_DISTRIBUTION = {
  easy: 0.2,
  medium: 0.5,
  hard: 0.25,
  challenge: 0.05
};

/**
 * Generate an assignment with AI
 * @param {AssignmentOptions} options - Generation options
 * @returns {Promise<Object>} Generated assignment with metadata
 */
export async function generateAssignment(options = {}) {
  // 1. Load configuration
  const config = loadTeachConfig(process.cwd());

  // 2. Merge options with config defaults
  const assignmentOptions = {
    type: options.type || 'homework',
    topic: options.topic || '',
    problemCount: options.problemCount || 5,
    difficulty: options.difficulty || config.scholar?.course_info?.difficulty || 'intermediate',
    topics: options.topics || [],
    assignmentNumber: options.assignmentNumber || null,
    dueDate: options.dueDate || null,
    totalPoints: options.totalPoints || 100,
    estimatedTime: options.estimatedTime || '2-3 hours',
    submissionFormat: options.submissionFormat || 'pdf',
    collaborationPolicy: options.collaborationPolicy || 'individual',
    latePolicy: options.latePolicy || config.scholar?.defaults?.late_policy || '10% off per day, up to 3 days',
    includeCode: options.includeCode || false,
    language: options.language || 'R',
    generateSolutions: options.generateSolutions !== false,
    generateRubric: options.generateRubric !== false,
    week: options.week || null,
    prerequisites: options.prerequisites || [],
    relatedReadings: options.relatedReadings || [],
    learningObjectives: options.learningObjectives || [],
    strict: options.strict || false,
    debug: options.debug || false
  };

  if (assignmentOptions.debug) {
    console.log('📋 Assignment Options:', JSON.stringify(assignmentOptions, null, 2));
  }

  // 3. Load templates
  const assignmentTemplate = loadTemplate('assignment');
  const fullTemplate = assignmentTemplate;

  if (assignmentOptions.debug) {
    console.log('📄 Template loaded');
  }

  // 4. Build AI prompt (or use pre-merged prompt from InstructionMerger)
  const prompt = options.mergedPrompt || buildAssignmentPrompt(assignmentOptions, config);

  if (assignmentOptions.debug) {
    if (options.mergedPrompt) {
      console.log('🔧 Using merged prompt from InstructionMerger');
    }
    console.log('🤖 Prompt:', prompt.substring(0, 200) + '...');
  }

  // 5. Generate content with AI
  const ai = new AIProvider({
    apiKey: config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY,
    model: config.scholar?.ai_generation?.model || 'claude-3-5-sonnet-20241022',
    maxTokens: config.scholar?.ai_generation?.max_tokens || 8192, // Larger for assignments
    timeout: config.scholar?.ai_generation?.timeout || 60000,
    debug: assignmentOptions.debug
  });

  const result = await ai.generate(prompt, {
    format: 'json',
    temperature: config.scholar?.ai_generation?.temperature || 0.7,
    context: {
      course: config.scholar?.course_info || {},
      difficulty: assignmentOptions.difficulty,
      type: assignmentOptions.type
    }
  });

  if (!result.success) {
    throw new Error(`AI generation failed: ${result.error}`);
  }

  if (assignmentOptions.debug) {
    console.log('✨ Content generated');
  }

  // 6. Process and enrich content
  let content = result.content;

  // Apply defaults from template
  content = applyDefaults(content, fullTemplate);

  // Inject auto-fields
  content = injectAutoFields(content, fullTemplate, {
    course: config.scholar?.course_info || {},
    generated_by: {
      tool: 'scholar',
      version: '2.0.0',
      model: result.metadata.model || ai.model,
      timestamp: new Date().toISOString()
    }
  });

  // Ensure metadata
  content.metadata = content.metadata || {};
  content.metadata.generated_at = new Date().toISOString();
  content.metadata.generator = 'scholar-assignment';
  content.metadata.options = assignmentOptions;

  if (assignmentOptions.debug) {
    console.log('📊 Content enriched');
  }

  // 7. Validate the generated content
  const validator = new ValidatorEngine({ strict: assignmentOptions.strict });
  const validation = await validator.validate(content, fullTemplate);

  if (!validation.valid && assignmentOptions.strict) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  if (assignmentOptions.debug) {
    console.log('✅ Validation:', validation.valid ? 'passed' : `warnings: ${validation.warnings?.length || 0}`);
  }

  // 8. Calculate total points if not specified
  if (!content.total_points && content.problems) {
    content.total_points = content.problems.reduce((sum, p) => {
      if (p.parts && p.parts.length > 0) {
        return sum + p.parts.reduce((partSum, part) => partSum + (part.points || 0), 0);
      }
      return sum + (p.points || 0);
    }, 0);
  }

  return {
    assignment: content,
    validation: validation,
    metadata: {
      ...result.metadata,
      options: assignmentOptions,
      template: 'assignment'
    }
  };
}

/**
 * Load assignment-specific template
 */
function loadAssignmentTemplate() {
  const templatePath = join(__dirname, '../templates/assignment.json');
  try {
    return JSON.parse(readFileSync(templatePath, 'utf-8'));
  } catch (error) {
    console.warn('Could not load assignment template:', error.message);
    return {};
  }
}

/**
 * Build AI prompt for assignment generation
 */
function buildAssignmentPrompt(options, config) {
  const courseInfo = config.scholar?.course_info || {};
  const typeDescriptions = {
    'homework': 'weekly homework with practice problems',
    'problem-set': 'comprehensive problem set covering multiple topics',
    'lab': 'hands-on laboratory exercise with data analysis',
    'project': 'larger scope project with multiple components',
    'worksheet': 'in-class worksheet for practice'
  };

  const difficultyGuidelines = {
    'beginner': 'Focus on foundational concepts with clear step-by-step guidance. Include hints.',
    'intermediate': 'Balance conceptual understanding with application. Some multi-step problems.',
    'advanced': 'Emphasize synthesis, proofs, and complex applications. Challenge problems included.'
  };

  let prompt = `Generate a ${options.type} assignment for a ${courseInfo.level || 'undergraduate'} ${courseInfo.field || 'statistics'} course.

## Assignment Requirements

**Type:** ${typeDescriptions[options.type] || options.type}
**Topic:** ${options.topic || 'general course content'}
**Number of Problems:** ${options.problemCount}
**Difficulty:** ${options.difficulty} - ${difficultyGuidelines[options.difficulty] || ''}
**Total Points:** ${options.totalPoints}
**Estimated Time:** ${options.estimatedTime}

`;

  if (options.topics && options.topics.length > 0) {
    prompt += `**Specific Topics to Cover:**
${options.topics.map(t => `- ${t}`).join('\n')}

`;
  }

  if (options.learningObjectives && options.learningObjectives.length > 0) {
    prompt += `**Learning Objectives:**
${options.learningObjectives.map(o => `- ${o}`).join('\n')}

`;
  }

  if (options.includeCode) {
    prompt += `**Coding Component:** Include ${options.language} programming problems.

`;
  }

  prompt += `## Output Format

Generate a JSON object with this structure:
{
  "title": "Assignment title (e.g., 'Homework 3: Linear Regression')",
  "assignment_type": "${options.type}",
  "assignment_number": ${options.assignmentNumber || 'null'},
  "due_date": ${options.dueDate ? `"${options.dueDate}"` : 'null'},
  "total_points": ${options.totalPoints},
  "estimated_time": "${options.estimatedTime}",
  "instructions": "General instructions for students",
  "submission_format": "${options.submissionFormat}",
  "collaboration_policy": "${options.collaborationPolicy}",
  "late_policy": "${options.latePolicy}",
  "topic": "${options.topic}",
  "week": ${options.week || 'null'},
  "learning_objectives": [...],
  "problems": [
    {
      "id": "P1",
      "text": "Problem statement (may include LaTeX like $\\beta_0$)",
      "points": 20,
      "parts": [
        {"label": "a", "text": "Sub-question", "points": 10},
        {"label": "b", "text": "Sub-question", "points": 10}
      ],
      "difficulty": "medium",
      "topic": "specific topic",
      "learning_objective": "what this assesses",
      "hints": ["Optional hint 1"],
      "requires_code": ${options.includeCode},
      "language": ${options.includeCode ? `"${options.language}"` : 'null'}
    }
  ]`;

  if (options.generateSolutions) {
    prompt += `,
  "solutions": {
    "P1": {
      "answer": "Final answer",
      "steps": ["Step 1: ...", "Step 2: ..."],
      "parts": {
        "a": "Solution for part a",
        "b": "Solution for part b"
      },
      "code": "# R code if applicable",
      "notes": "Grading notes"
    }
  }`;
  }

  if (options.generateRubric) {
    prompt += `,
  "rubric": {
    "P1": {
      "full_credit": "Criteria for full points",
      "partial_credit": [
        {"points": 15, "criteria": "Correct approach, minor errors"},
        {"points": 10, "criteria": "Partial understanding"}
      ],
      "common_errors": ["Error 1 - deduct X points"]
    }
  }`;
  }

  prompt += `
}

## Guidelines

1. **Problem Structure:**
   - Each problem should have a clear statement and point value
   - Multi-part problems should have labeled parts (a, b, c)
   - Include context or real-world applications when appropriate
   - Vary difficulty across problems (${JSON.stringify(DEFAULT_PROBLEM_DISTRIBUTION)})

2. **Mathematical Notation:**
   - Use LaTeX for all mathematical expressions: $\\beta$, $\\sum_{i=1}^n$
   - Escape special characters properly

3. **Solutions (if requested):**
   - Provide step-by-step solutions with explanations
   - Include final answers clearly marked
   - Show all work that students would need to show

4. **Rubric (if requested):**
   - Define clear criteria for full credit
   - Include partial credit tiers
   - Note common errors and deductions

5. **Course Level:** ${courseInfo.level || 'undergraduate'}
   - Adjust complexity and expectations accordingly

Return ONLY the JSON object, no additional text.`;

  return prompt;
}

/**
 * Export assignment to specified format
 * @param {Object} assignment - Generated assignment
 * @param {string} format - Output format (markdown, latex, quarto, json)
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export result with content and metadata
 */
export async function exportAssignment(assignment, format = 'markdown', options = {}) {
  // JSON is handled specially (not a formatter, just serialization)
  const formatLower = format.toLowerCase();
  if (formatLower !== 'json' && !isFormatSupported(format)) {
    throw new Error(`Unsupported format: ${format}. Supported: markdown, latex, quarto, json`);
  }

  const exportOptions = {
    includeSolutions: options.includeSolutions !== false,
    includeRubric: options.includeRubric || false,
    studentVersion: options.studentVersion || false,
    ...options
  };

  let formatter;
  let result;

  switch (format.toLowerCase()) {
    case 'markdown':
    case 'md':
      // Use assignment-specific markdown formatting (not exam formatter)
      result = {
        content: formatAssignmentAsMarkdown(assignment, exportOptions),
        metadata: { format: 'markdown' }
      };
      break;

    case 'latex':
    case 'tex':
      formatter = new LaTeXFormatter();
      // Generate multiple versions for assignments
      if (exportOptions.studentVersion) {
        result = formatter.formatAssignmentStudent(assignment, exportOptions);
      } else if (exportOptions.includeRubric) {
        result = formatter.formatAssignmentRubric(assignment, exportOptions);
      } else if (exportOptions.includeSolutions) {
        result = formatter.formatAssignmentSolutions(assignment, exportOptions);
      } else {
        result = formatter.format(assignment, { type: 'assignment', ...exportOptions });
      }
      break;

    case 'quarto':
    case 'qmd':
      formatter = new QuartoFormatter();
      result = formatter.format(assignment, { type: 'assignment', ...exportOptions });
      break;

    case 'json':
      result = {
        content: JSON.stringify(assignment, null, 2),
        metadata: { format: 'json' }
      };
      break;

    default:
      throw new Error(`Unknown format: ${format}`);
  }

  return {
    content: result.content || result,
    format: format,
    metadata: {
      ...result.metadata,
      exported_at: new Date().toISOString(),
      options: exportOptions
    }
  };
}

/**
 * Save assignment to file
 * @param {Object} assignment - Generated assignment
 * @param {string} filepath - Output file path
 * @param {string} format - Output format
 * @param {Object} options - Export options
 */
export async function saveAssignment(assignment, filepath, format = 'markdown', options = {}) {
  const exported = await exportAssignment(assignment, format, options);
  writeFileSync(filepath, exported.content, 'utf-8');
  return {
    filepath,
    format,
    size: exported.content.length,
    metadata: exported.metadata
  };
}

/**
 * Format assignment as Markdown
 * @param {Object} assignment - Assignment object
 * @param {Object} options - Export options
 * @returns {string} Markdown content
 */
function formatAssignmentAsMarkdown(assignment, options = {}) {
  let md = `# ${assignment.title || 'Assignment'}\n\n`;

  // Header info
  if (assignment.due_date) {
    md += `**Due:** ${assignment.due_date}\n`;
  }
  if (assignment.total_points) {
    md += `**Total Points:** ${assignment.total_points}\n`;
  }
  if (assignment.estimated_time) {
    md += `**Estimated Time:** ${assignment.estimated_time}\n`;
  }
  if (assignment.submission_format) {
    md += `**Submission:** ${assignment.submission_format}\n`;
  }
  if (assignment.collaboration_policy) {
    md += `**Collaboration:** ${assignment.collaboration_policy}\n`;
  }
  md += '\n';

  // Instructions
  if (assignment.instructions) {
    md += `## Instructions\n\n${assignment.instructions}\n\n`;
  }

  // Learning objectives
  if (assignment.learning_objectives && assignment.learning_objectives.length > 0) {
    md += `## Learning Objectives\n\n`;
    assignment.learning_objectives.forEach(obj => {
      md += `- ${obj}\n`;
    });
    md += '\n';
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

      if (problem.topic) {
        md += `*Topic: ${problem.topic}*\n\n`;
      }

      md += `${problem.text}\n\n`;

      // Parts
      if (problem.parts && problem.parts.length > 0) {
        problem.parts.forEach(part => {
          md += `**(${part.label})** ${part.text}`;
          if (part.points) {
            md += ` [${part.points} pts]`;
          }
          md += `\n\n`;
        });
      }

      // Hints
      if (problem.hints && problem.hints.length > 0) {
        md += `> **Hint:** ${problem.hints[0]}\n\n`;
      }
    });
  }

  // Solutions (if requested and available)
  if (options.includeSolutions && assignment.solutions && Object.keys(assignment.solutions).length > 0) {
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
          const lang = assignment.problems?.find(p => p.id === id)?.language || 'r';
          md += `\`\`\`${lang}\n${solution.code}\n\`\`\`\n\n`;
        }
      }
    });
  }

  // Rubric (if requested and available)
  if (options.includeRubric && assignment.rubric && Object.keys(assignment.rubric).length > 0) {
    md += `---\n\n## Grading Rubric\n\n`;

    Object.entries(assignment.rubric).forEach(([id, rubric]) => {
      md += `### ${id}\n\n`;
      if (rubric.full_credit) {
        md += `**Full Credit:** ${rubric.full_credit}\n\n`;
      }
      if (rubric.partial_credit && rubric.partial_credit.length > 0) {
        md += `**Partial Credit:**\n`;
        rubric.partial_credit.forEach(pc => {
          md += `- ${pc.points} pts: ${pc.criteria}\n`;
        });
        md += '\n';
      }
      if (rubric.common_errors && rubric.common_errors.length > 0) {
        md += `**Common Errors:**\n`;
        rubric.common_errors.forEach(err => {
          md += `- ${err}\n`;
        });
        md += '\n';
      }
    });
  }

  return md;
}

// Export for use in conversational generator
export { buildAssignmentPrompt, loadAssignmentTemplate, DEFAULT_PROBLEM_DISTRIBUTION, formatAssignmentAsMarkdown };
