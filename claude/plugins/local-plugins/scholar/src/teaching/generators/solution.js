/**
 * Solution Key Generator
 *
 * Generates standalone solution keys from existing assignment files.
 * Reads .qmd or .json assignment files, extracts problems, and
 * produces step-by-step solutions with worked examples.
 *
 * Uses Phase 0 foundation components:
 * - Config Loader for course settings
 * - Validator Engine for content validation
 * - AI Provider for solution generation
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { loadTeachConfig, getDataDir } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { AIProvider } from '../ai/provider.js';
import { findMatchingLecture, findMatchingLab, extractSummaryAndChunks } from '../validators/r-code.js';

/**
 * Solution generator options
 * @typedef {Object} SolutionOptions
 * @property {string} assignmentPath - Path to assignment file (.qmd or .json)
 * @property {string} format - Output format (markdown, qmd, json)
 * @property {string} outputPath - Custom output path (default: solutions/ folder)
 * @property {boolean} includeRubric - Include grading rubric in solution
 * @property {boolean} includeCode - Include R/Python code solutions
 * @property {string} language - Programming language (default: R)
 * @property {string} instructions - Custom AI instructions
 * @property {boolean} strict - Use strict validation
 * @property {boolean} debug - Enable debug logging
 */

/**
 * Parse a .qmd file to extract assignment content
 * @param {string} filepath - Path to .qmd file
 * @returns {Object} Parsed assignment with frontmatter and problems
 */
export function parseQmdAssignment(filepath) {
  const content = readFileSync(filepath, 'utf-8');
  const result = {
    title: '',
    metadata: {},
    problems: [],
    rawContent: content,
    sourceFile: filepath
  };

  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];
    // Simple YAML parsing for common fields
    const titleMatch = yaml.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const subtitleMatch = yaml.match(/^subtitle:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) result.title = titleMatch[1];
    if (subtitleMatch) result.metadata.subtitle = subtitleMatch[1];
    result.metadata.rawYaml = yaml;
  }

  // Extract problems from markdown body
  const body = frontmatterMatch
    ? content.slice(frontmatterMatch[0].length)
    : content;

  // Look for problem patterns: ## Problem N, ## Exercise N, ### Problem N, ## N., **Problem N**
  const problemPatterns = [
    /^#{2,3}\s*Problem\s+(\w+)[\s:]*(.*)$/gm,
    /^#{2,3}\s*Exercise\s+(\w+)[\s:]*(.*)$/gm,
    /^#{2,3}\s*(\d+)\.\s*(.*)$/gm,
    /^\*\*Problem\s+(\w+)\*\*[\s:]*(.*)$/gm,
    /^#{2,3}\s*Question\s+(\w+)[\s:]*(.*)$/gm
  ];

  const problemPositions = [];
  for (const pattern of problemPatterns) {
    let match;
    while ((match = pattern.exec(body)) !== null) {
      problemPositions.push({
        id: `P${match[1]}`,
        heading: match[0],
        text: match[2] || '',
        index: match.index
      });
    }
  }

  // Sort by position and extract content between problems
  problemPositions.sort((a, b) => a.index - b.index);

  for (let i = 0; i < problemPositions.length; i++) {
    const start = problemPositions[i].index + problemPositions[i].heading.length;
    const end = i + 1 < problemPositions.length
      ? problemPositions[i + 1].index
      : body.length;

    const problemBody = body.slice(start, end).trim();

    // Try to extract parts (a), (b), etc.
    const parts = [];
    const partPattern = /\*?\*?\(([a-z])\)\*?\*?\s*(.*?)(?=\*?\*?\([a-z]\)\*?\*?|$)/gs;
    let partMatch;
    while ((partMatch = partPattern.exec(problemBody)) !== null) {
      parts.push({
        label: partMatch[1],
        text: partMatch[2].trim()
      });
    }

    // Extract point values if present
    const pointsMatch = problemBody.match(/\[?(\d+)\s*(?:pts?|points?)\]?/i);

    result.problems.push({
      id: problemPositions[i].id,
      text: problemBody,
      points: pointsMatch ? parseInt(pointsMatch[1]) : null,
      parts: parts.length > 0 ? parts : undefined
    });
  }

  return result;
}

/**
 * Parse a .json assignment file
 * @param {string} filepath - Path to .json file
 * @returns {Object} Parsed assignment
 */
export function parseJsonAssignment(filepath) {
  const content = JSON.parse(readFileSync(filepath, 'utf-8'));
  return {
    title: content.title || '',
    metadata: content.metadata || {},
    problems: content.problems || [],
    solutions: content.solutions || null,
    rubric: content.rubric || null,
    rawContent: null,
    sourceFile: filepath
  };
}

/**
 * Parse assignment file (auto-detect format)
 * @param {string} filepath - Path to assignment file
 * @returns {Object} Parsed assignment
 */
export function parseAssignment(filepath) {
  if (!existsSync(filepath)) {
    throw new Error(`Assignment file not found: ${filepath}`);
  }

  const ext = extname(filepath).toLowerCase();
  switch (ext) {
    case '.qmd':
    case '.md':
      return parseQmdAssignment(filepath);
    case '.json':
      return parseJsonAssignment(filepath);
    default:
      throw new Error(`Unsupported file format: ${ext}. Use .qmd, .md, or .json`);
  }
}

/**
 * Build AI prompt for solution generation
 * @param {Object} assignment - Parsed assignment
 * @param {Object} options - Generation options
 * @param {Object} config - Course config
 * @returns {string} AI prompt
 */
export function buildSolutionPrompt(assignment, options, config) {
  const courseInfo = config.scholar?.course_info || {};

  let prompt = `Generate a comprehensive solution key for the following assignment.

## Course Context

**Course:** ${courseInfo.code || ''} ${courseInfo.title || ''}
**Level:** ${courseInfo.level || 'undergraduate'}
**Field:** ${courseInfo.field || 'statistics'}

## Assignment

**Title:** ${assignment.title || 'Assignment'}
`;

  // Include problems
  if (assignment.problems && assignment.problems.length > 0) {
    prompt += `\n## Problems\n\n`;
    assignment.problems.forEach((problem, idx) => {
      prompt += `### ${problem.id || `P${idx + 1}`}`;
      if (problem.points) prompt += ` (${problem.points} points)`;
      prompt += `\n\n`;
      prompt += `${problem.text}\n\n`;

      if (problem.parts && problem.parts.length > 0) {
        problem.parts.forEach(part => {
          prompt += `**(${part.label})** ${part.text}\n`;
        });
        prompt += '\n';
      }
    });
  } else if (assignment.rawContent) {
    // Fallback: include full file content for Claude to parse
    prompt += `\n## Assignment Content (full file)\n\n`;
    prompt += `\`\`\`\n${assignment.rawContent}\n\`\`\`\n\n`;
    prompt += `Identify all problems/questions in the above content and generate solutions for each.\n\n`;
  }

  // Data directory context
  const dataDir = getDataDir(config);
  const resolvedDataDir = join(process.cwd(), dataDir);
  if (existsSync(resolvedDataDir)) {
    try {
      const dataFiles = readdirSync(resolvedDataDir).filter(f =>
        f.endsWith('.txt') || f.endsWith('.csv') || f.endsWith('.tsv')
      );
      if (dataFiles.length > 0) {
        prompt += `\n## Available Data Files\n\n`;
        prompt += `The following data files are available in \`${dataDir}\`:\n`;
        dataFiles.forEach(f => { prompt += `- ${f}\n`; });
        prompt += `\nUSE these files with \`read.table(here::here("${dataDir.replace(/\/$/, '')}", "<file>"), header = TRUE)\` instead of hard-coding data.\n`;
        prompt += `NEVER hard-code data that exists in these files.\n\n`;
      }
    } catch {
      // Data directory not readable — skip silently
    }
  }

  // Lecture/lab context for R code consistency
  if (assignment.sourceFile) {
    const projectRoot = process.cwd();
    const lecture = findMatchingLecture(assignment.sourceFile, projectRoot);
    const lab = findMatchingLab(assignment.sourceFile, projectRoot);

    if (lecture || lab) {
      prompt += `\n## Lecture/Lab Context (match these R patterns)\n\n`;

      if (lecture) {
        try {
          const lectureContent = readFileSync(lecture.path, 'utf-8');
          const summary = extractSummaryAndChunks(lectureContent);
          if (summary.rChunks.length > 0) {
            prompt += `**Matching lecture** (${basename(lecture.path)}, matched by ${lecture.matchType}):\n`;
            prompt += `R patterns used: ${summary.rChunks.length} code chunks\n`;
            // Include first 3 chunks for pattern reference
            const sampleChunks = summary.rChunks.slice(0, 3);
            for (const chunk of sampleChunks) {
              prompt += `\n\`\`\`r\n# chunk: ${chunk.label}\n${chunk.code.slice(0, 200)}\n\`\`\`\n`;
            }
            prompt += '\n';
          }
        } catch {
          // Lecture file not readable — skip
        }
      }

      if (lab) {
        try {
          const labContent = readFileSync(lab.path, 'utf-8');
          const summary = extractSummaryAndChunks(labContent);
          if (summary.rChunks.length > 0) {
            prompt += `**Matching lab** (${basename(lab.path)}, matched by ${lab.matchType}):\n`;
            prompt += `R patterns used: ${summary.rChunks.length} code chunks\n\n`;
          }
        } catch {
          // Lab file not readable — skip
        }
      }

      prompt += `**IMPORTANT:** Match the R coding patterns from the lecture/lab above. Use the same packages, pipe operator, and naming conventions.\n\n`;
    }
  }

  // Solution requirements
  prompt += `## Solution Requirements

For EACH problem, provide:
1. **Step-by-step solution** with clear mathematical work
2. **Final answer** clearly marked
3. **Interpretation** of what the result means in context`;

  if (options.includeCode) {
    prompt += `
4. **${options.language || 'R'} code** that solves the problem programmatically`;
  }

  if (options.includeRubric) {
    prompt += `
${options.includeCode ? '5' : '4'}. **Grading notes** with common mistakes and partial credit guidance`;
  }

  prompt += `

## Output Format

Return a JSON object with this structure:
{
  "assignment_title": "${assignment.title || 'Assignment'}",
  "solutions": {`;

  // Generate solution structure based on detected problems
  const problemIds = assignment.problems && assignment.problems.length > 0
    ? assignment.problems.map((p, i) => p.id || `P${i + 1}`)
    : ['P1'];

  prompt += `
    "${problemIds[0]}": {
      "answer": "Final answer (use LaTeX for math: $\\\\beta_0 = 2.5$)",
      "steps": [
        "Step 1: State the approach...",
        "Step 2: Show the calculation..."
      ],
      "parts": {
        "a": "Solution for part a (if applicable)",
        "b": "Solution for part b (if applicable)"
      },`;

  if (options.includeCode) {
    prompt += `
      "code": "# ${options.language || 'R'} code\\nresult <- ...",`;
  }

  prompt += `
      "interpretation": "What this result means in context",
      "common_mistakes": ["Mistake 1 - explanation", "Mistake 2 - explanation"],
      "grading_notes": "Partial credit: award X pts for correct setup even if calculation error"
    }
  },
  "general_notes": "Overall notes for graders (common themes, etc.)"
}

## Guidelines

1. **Show all work** - Every step should be explicit and traceable
2. **LaTeX notation** - Use $\\\\beta$, $\\\\sum_{i=1}^n$ for all math
3. **Multiple approaches** - If multiple valid methods exist, show the primary one and note alternatives
4. **Partial credit** - Indicate where partial credit is appropriate
5. **Common errors** - Flag mistakes students typically make
6. **Interpret results** - Don't just compute; explain what the answer means

Return ONLY the JSON object, no additional text.`;

  return prompt;
}

/**
 * Generate solution key from assignment file
 * @param {SolutionOptions} options - Generation options
 * @returns {Promise<Object>} Generated solution with metadata
 */
export async function generateSolution(options = {}) {
  const { assignmentPath } = options;

  if (!assignmentPath) {
    throw new Error('Assignment file path is required');
  }

  // 1. Parse assignment
  const assignment = parseAssignment(assignmentPath);

  if (options.debug) {
    console.log(`📋 Parsed assignment: "${assignment.title}" with ${assignment.problems.length} problems`);
  }

  // 2. Load config
  const config = loadTeachConfig(process.cwd());

  // 3. Build prompt
  const solutionOptions = {
    includeRubric: options.includeRubric || false,
    includeCode: options.includeCode !== false,
    language: options.language || 'R',
    instructions: options.instructions || null,
    strict: options.strict || false,
    debug: options.debug || false
  };

  const prompt = options.mergedPrompt || buildSolutionPrompt(assignment, solutionOptions, config);

  if (options.debug) {
    console.log('🤖 Prompt:', prompt.substring(0, 200) + '...');
  }

  // 4. Generate with AI
  const ai = new AIProvider({
    apiKey: config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY,
    model: config.scholar?.ai_generation?.model || 'claude-3-5-sonnet-20241022',
    maxTokens: config.scholar?.ai_generation?.max_tokens || 8192,
    timeout: config.scholar?.ai_generation?.timeout || 60000,
    debug: options.debug
  });

  const result = await ai.generate(prompt, {
    format: 'json',
    temperature: 0.3, // Lower temperature for solutions (accuracy matters)
    context: {
      course: config.scholar?.course_info || {},
      type: 'solution'
    }
  });

  if (!result.success) {
    throw new Error(`AI generation failed: ${result.error}`);
  }

  // 5. Enrich result
  const content = result.content;
  content.assignment_file = assignmentPath;
  content.metadata = {
    generated_at: new Date().toISOString(),
    generator: 'scholar-solution',
    source_file: assignmentPath,
    options: solutionOptions
  };

  // 6. Validate
  if (solutionOptions.strict) {
    const validator = new ValidatorEngine({ strict: true });
    const validation = await validator.validate(content, {});
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return {
    assignment,
    solution: content,
    metadata: {
      ...result.metadata,
      options: solutionOptions
    }
  };
}

/**
 * Format solution as Markdown
 * @param {Object} assignment - Parsed assignment
 * @param {Object} solution - Generated solution object
 * @param {Object} options - Format options
 * @returns {string} Markdown content
 */
export function formatSolutionAsMarkdown(assignment, solution, options = {}) {
  let md = `# Solution Key: ${solution.assignment_title || assignment.title || 'Assignment'}\n\n`;

  md += `**Source:** ${basename(assignment.sourceFile)}\n`;
  md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `---\n\n`;

  if (!solution.solutions || Object.keys(solution.solutions).length === 0) {
    md += `*No solutions generated.*\n`;
    return md;
  }

  Object.entries(solution.solutions).forEach(([id, sol]) => {
    md += `## ${id}\n\n`;

    if (typeof sol === 'string') {
      md += `${sol}\n\n`;
      return;
    }

    // Steps
    if (sol.steps && sol.steps.length > 0) {
      md += `**Solution:**\n\n`;
      sol.steps.forEach((step, i) => {
        md += `${i + 1}. ${step}\n`;
      });
      md += '\n';
    }

    // Answer
    if (sol.answer) {
      md += `**Answer:** ${sol.answer}\n\n`;
    }

    // Parts
    if (sol.parts && Object.keys(sol.parts).length > 0) {
      Object.entries(sol.parts).forEach(([label, partSol]) => {
        md += `**(${label})** ${partSol}\n\n`;
      });
    }

    // Code
    if (sol.code) {
      const lang = options.language || 'r';
      md += `**Code:**\n\n\`\`\`${lang}\n${sol.code}\n\`\`\`\n\n`;
    }

    // Interpretation
    if (sol.interpretation) {
      md += `**Interpretation:** ${sol.interpretation}\n\n`;
    }

    // Common mistakes
    if (sol.common_mistakes && sol.common_mistakes.length > 0) {
      md += `**Common Mistakes:**\n`;
      sol.common_mistakes.forEach(mistake => {
        md += `- ${mistake}\n`;
      });
      md += '\n';
    }

    // Grading notes
    if (sol.grading_notes) {
      md += `**Grading Notes:** ${sol.grading_notes}\n\n`;
    }

    md += `---\n\n`;
  });

  // General notes
  if (solution.general_notes) {
    md += `## General Grading Notes\n\n${solution.general_notes}\n`;
  }

  return md;
}

/**
 * Format solution as Quarto .qmd file
 * @param {Object} assignment - Parsed assignment
 * @param {Object} solution - Generated solution object
 * @param {Object} options - Format options
 * @returns {string} Quarto content with YAML frontmatter
 */
export function formatSolutionAsQuarto(assignment, solution, options = {}) {
  const title = solution.assignment_title || assignment.title || 'Assignment';

  let qmd = `---
title: "Solution Key: ${title}"
subtitle: "Instructor Only"
date: today
date-format: long
format:
  html:
    toc: true
    toc-depth: 3
  pdf:
    include-in-header:
      - ../tex/macros.tex
---

`;

  // Append markdown body (reuse markdown formatter, skip the title line)
  const mdBody = formatSolutionAsMarkdown(assignment, solution, options);
  // Strip the first title line since we have YAML title
  const bodyStart = mdBody.indexOf('\n\n');
  if (bodyStart > 0) {
    qmd += mdBody.slice(bodyStart + 2);
  } else {
    qmd += mdBody;
  }

  return qmd;
}

/**
 * Export solution to specified format
 * @param {Object} assignment - Parsed assignment
 * @param {Object} solution - Generated solution
 * @param {string} format - Output format
 * @param {Object} options - Export options
 * @returns {Object} Export result
 */
export function exportSolution(assignment, solution, format = 'markdown', options = {}) {
  let content;
  let extension;

  switch (format.toLowerCase()) {
    case 'markdown':
    case 'md':
      content = formatSolutionAsMarkdown(assignment, solution, options);
      extension = '.md';
      break;
    case 'quarto':
    case 'qmd':
      content = formatSolutionAsQuarto(assignment, solution, options);
      extension = '.qmd';
      break;
    case 'json':
      content = JSON.stringify(solution, null, 2);
      extension = '.json';
      break;
    default:
      throw new Error(`Unsupported format: ${format}. Use markdown, qmd, or json`);
  }

  return {
    content,
    extension,
    format,
    metadata: {
      exported_at: new Date().toISOString()
    }
  };
}

/**
 * Generate default output path for solution file
 * @param {string} assignmentPath - Source assignment file path
 * @param {string} format - Output format
 * @param {string} customOutput - Custom output path (optional)
 * @returns {string} Output file path
 */
export function generateOutputPath(assignmentPath, format = 'qmd', customOutput = null) {
  if (customOutput) {
    return customOutput;
  }

  const base = basename(assignmentPath, extname(assignmentPath));
  const dir = dirname(assignmentPath);
  // If file is in a subdirectory (e.g., assignments/hw1.qmd), put solutions/ as sibling.
  // If file is at root level (e.g., ./hw1.qmd), put solutions/ in cwd to avoid going up a level.
  const parentDir = dirname(dir);
  const solutionsDir = parentDir === dir
    ? join(dir, 'solutions')
    : join(parentDir, 'solutions');

  const extensions = {
    markdown: '.md',
    md: '.md',
    quarto: '.qmd',
    qmd: '.qmd',
    json: '.json'
  };

  const ext = extensions[format.toLowerCase()] || '.qmd';
  return join(solutionsDir, `${base}-solution${ext}`);
}

/**
 * Save solution to file
 * @param {Object} assignment - Parsed assignment
 * @param {Object} solution - Generated solution
 * @param {string} filepath - Output file path
 * @param {string} format - Output format
 * @param {Object} options - Export options
 * @returns {Object} Save result
 */
export function saveSolution(assignment, solution, filepath, format = 'markdown', options = {}) {
  const exported = exportSolution(assignment, solution, format, options);
  writeFileSync(filepath, exported.content, 'utf-8');
  return {
    filepath,
    format,
    size: exported.content.length,
    metadata: exported.metadata
  };
}

/**
 * Format solution as email-friendly plain text with metadata header
 * @param {Object} assignment - Parsed assignment
 * @param {Object} solution - Generated solution object
 * @param {Object} options - Format options
 * @param {string} options.courseCode - Course code for subject line (e.g., "STAT 545")
 * @returns {Object} { subject, body } ready for email composition
 */
export function formatSolutionAsEmail(assignment, solution, options = {}) {
  const courseCode = options.courseCode || '';
  const title = solution.assignment_title || assignment.title || 'Assignment';

  const subject = courseCode
    ? `[${courseCode}] Solution Key: ${title}`
    : `Solution Key: ${title}`;

  let body = `Solution Key: ${title}\n`;
  body += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
  body += `Source: ${basename(assignment.sourceFile)}\n`;
  body += `Problems: ${Object.keys(solution.solutions).length}\n\n`;
  body += `---\n\n`;
  body += formatSolutionAsMarkdown(assignment, solution, options);
  body += `\n---\nGenerated by Scholar (teaching:solution)\n`;
  body += `CONFIDENTIAL - Do not distribute to students.\n`;

  return { subject, body };
}
