---
name: teaching:assignment
description: Generate homework assignments and problem sets with solutions and rubrics
---

# Generate Assignment

Generate comprehensive homework assignments with multiple problem types, solutions, and grading rubrics.

**Usage:**
```
/teaching:assignment [type] [options]
```

**Examples:**
```
/teaching:assignment "Linear Regression"
/teaching:assignment homework --problems 5 --difficulty intermediate
/teaching:assignment lab --topic "Bootstrap Methods" --include-code
/teaching:assignment problem-set --topics "ANOVA,regression" --week 8
/teaching:assignment "ANOVA" --dry-run
```

**Assignment Types:**
- `homework` - Weekly homework (default)
- `problem-set` - Comprehensive problem set
- `lab` - Hands-on laboratory exercise
- `project` - Larger scope project
- `worksheet` - In-class worksheet

**Options:**
- `--problems N` - Number of problems (default: 5)
- `--points N` - Total points (default: 100)
- `--difficulty LEVEL` - Difficulty: beginner, intermediate, advanced
- `--topic "topic"` - Main topic for the assignment
- `--topics "topic1,topic2"` - Multiple specific topics
- `--week N` - Course week number
- `--due "date"` - Due date
- `--time "N hours"` - Estimated completion time (default: 2-3 hours)
- `--include-code` - Include programming problems
- `--language R|Python|Julia` - Programming language (default: R)
- `--format FMT` - Output format: json (default), examark, canvas, md, qmd, tex
- `--no-solutions` - Exclude solution key
- `--no-rubric` - Exclude grading rubric
- `--submission pdf|online|code|mixed` - Submission format
- `--collaboration individual|groups-allowed` - Collaboration policy
- `--config PATH` - Explicit config file path (bypasses .flow/teach-config.yml discovery)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--debug` - Enable debug logging
- `--validate` - Run R code validation after generation
- `--send [EMAIL]` - Email generated assignment after saving. Uses course.staff.ta_email from teach-config.yml if no email provided. Requires himalaya MCP.

**Problem Types:**
The generator creates a mix of:
- Multi-part problems (a, b, c, ...)
- Conceptual questions
- Computational problems
- Applied/data analysis problems
- Coding problems (if --include-code)

**Output:**
- JSON file with complete assignment structure
- Step-by-step solutions with explanations
- Grading rubric with partial credit tiers
- LaTeX math notation support

<system>
This command generates assignments using the Phase 0 foundation:
- Template System for structure (assignment.json)
- Config Loader for course settings
- Validator Engine for quality assurance
- AI Provider for problem generation

## Implementation

```javascript
import { generateAssignment, exportAssignment } from '../../../teaching/generators/assignment.js';
import { buildConversationalPrompt, processGeneratedAssignment } from '../../../teaching/generators/assignment-conversational.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Parse user input
const args = parseArgs(userInput);

// Default options
const options = {
  type: args.type || args._[0] || 'homework',
  topic: args.topic || args._[1] || '',
  problemCount: parseInt(args.problems) || 5,
  totalPoints: parseInt(args.points) || 100,
  difficulty: args.difficulty || undefined,
  topics: args.topics ? args.topics.split(',').map(t => t.trim()) : [],
  week: parseInt(args.week) || null,
  dueDate: args.due || null,
  estimatedTime: args.time || '2-3 hours',
  includeCode: args['include-code'] || false,
  language: args.language || 'R',
  generateSolutions: !args['no-solutions'],
  generateRubric: !args['no-rubric'],
  format: args.format || 'json',
  submissionFormat: args.submission || 'pdf',
  collaborationPolicy: args.collaboration || 'individual',
  configPath: args.config || null,
  instructions: args.instructions || args.i || null,
  debug: args.debug || false,
  validate: args.validate || false,
  send: args.send || false  // true (use config email) or string (explicit email)
};

// ─── Custom Instructions Pipeline ───
if (options.instructions) {
  const { InstructionMerger } = await import('../../../teaching/ai/instruction-merger.js');
  const { AIProvider } = await import('../../../teaching/ai/provider.js');
  const { loadTeachConfig } = await import('../../../teaching/config/loader.js');

  // Load from file if @reference
  let instructionText = options.instructions;
  if (instructionText.startsWith('@')) {
    instructionText = await InstructionMerger.loadFromFile(instructionText.slice(1));
  }

  // Load config for conflict detection
  const config = loadTeachConfig(process.cwd());

  // Create Haiku provider for fast categorization
  const haiku = new AIProvider({
    model: 'claude-haiku-4-5-20251001',
    apiKey: config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
    debug: options.debug
  });

  const merger = new InstructionMerger(haiku, { debug: options.debug });

  // Build the base prompt (check for user override first)
  let basePrompt;
  let isCustomPrompt = false;

  try {
    const { PromptLoader } = await import('../../../teaching/ai/prompt-loader.js');
    const { PromptBuilder } = await import('../../../teaching/ai/prompt-builder.js');
    const loaded = PromptLoader.load('assignment', process.cwd());
    basePrompt = PromptBuilder.build(loaded.body, {
      courseCode: config.scholar?.course_info?.code || '',
      courseTitle: config.scholar?.course_info?.title || '',
      level: config.scholar?.course_info?.level || 'undergraduate',
      difficulty: options.difficulty || config.scholar?.course_info?.difficulty || 'intermediate',
      assignmentType: options.type,
      problemCount: options.problemCount,
      topics: options.topics.join(', ') || options.topic || 'Use course curriculum',
      format: options.submissionFormat,
      includeCode: options.includeCode,
      language: options.language
    });
    isCustomPrompt = true;
  } catch {
    // No user override — generator will use buildAssignmentPrompt() internally
    basePrompt = null;
  }

  // === Approval Loop (unlimited iterations) ===
  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    // Analyze with AI
    const categories = await merger.analyze(allInstructions, 'assignment');

    // For preview: merge with base prompt (or placeholder if no custom prompt)
    const previewPrompt = basePrompt || `[Default assignment prompt: ${options.type}, ${options.problemCount} problems]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'assignment'
    });

    // Show summary
    const summary = merger.summarize(mergeResult);
    console.log(summary);
    console.log('---');
    console.log('**Accept** to generate | **Modify** to change instructions | **Cancel** to abort');

    // Wait for user response (Claude Code conversation context)
    const userResponse = await waitForUserResponse();

    if (userResponse.action === 'accept') {
      // Pass merged prompt to generator (only if we have a real base prompt)
      if (isCustomPrompt) {
        options.mergedPrompt = mergeResult.mergedPrompt;
      }
      // Always pass instruction metadata for the generator
      options.instructionText = allInstructions;
      options.mergedCategories = categories;
      accepted = true;
    } else if (userResponse.action === 'modify') {
      allInstructions = allInstructions + '\n' + userResponse.newInstructions;
    } else if (userResponse.action === 'cancel') {
      console.log('❌ Generation cancelled.');
      process.exit(0);
    }
  }
}

// For API-based generation:
const result = await generateAssignment(options);

// For conversational generation (Claude Code):
const prompt = buildConversationalPrompt(options);
// Claude generates JSON following the prompt
const assignment = processGeneratedAssignment(generatedContent);

// ─── Format Routing ───
// If a non-JSON format is requested, produce formatted output
if (options.format && options.format !== 'json' && result.content) {
  const { getFormatter, isFormatSupported } = await import('../../../teaching/formatters/index.js');

  if (isFormatSupported(options.format)) {
    const formatter = getFormatter(options.format);
    const formatted = formatter.format(result.content);
    const ext = formatter.getFileExtension();
    const formatFilepath = result.filepath.replace(/\.(json|md)$/, ext);
    writeFileSync(formatFilepath, formatted);
    console.log(`📄 Formatted output: ${basename(formatFilepath)}`);

    // For canvas/qti format, route through CanvasFormatter for validation + cleanup
    if (['canvas', 'qti'].includes(options.format)) {
      const { CanvasFormatter } = await import('../../../teaching/formatters/canvas.js');
      const canvasFormatter = new CanvasFormatter();
      try {
        const qtiPath = await canvasFormatter.format(result.content, {
          output: formatFilepath.replace(ext, '.qti.zip'),
          sourceDir: process.cwd()
        });
        console.log(`📦 Canvas QTI package: ${basename(qtiPath)}`);
      } catch (err) {
        console.log(`⚠️ Canvas QTI export failed: ${err.message}`);
        console.log('   Install examark: npm install -g examark');
      }
    }
  }
}

// ─── Validate R code (if --validate and output is .qmd) ───
if (options.validate && result.filepath && result.filepath.endsWith('.qmd')) {
  console.log('\n🔍 Running R code validation...');

  import { validatePipeline } from '../../../teaching/utils/validate-pipeline.js';

  const validation = validatePipeline({
    filepath: result.filepath,
    language: options.language || 'R',
    debug: options.debug
  });

  console.log(validation.report);

  if (validation.failed > 0) {
    console.log(`\n⚠️ ${validation.failed} chunk(s) failed validation.`);
    console.log('   Review the errors above, fix the code, and re-run with --validate.');
    // Claude: Offer to fix failing chunks and re-validate
  } else if (validation.passed > 0) {
    console.log(`\n✅ All ${validation.passed} R chunk(s) passed validation.`);
  }
}

// ─── Email Sending (--send flag) ───
// Uses shared send-output utility for recipient resolution, email formatting,
// and himalaya MCP compose_email instructions.

if (options.send) {
  import { resolveRecipient, formatEmail, buildSendInstructions } from '../../../teaching/utils/send-output.js';
  import { loadTeachConfig } from '../../../teaching/config/loader.js';

  const config = loadTeachConfig(process.cwd());
  const courseCode = config.scholar?.course_info?.code || '';

  const recipientEmail = resolveRecipient(options, config);

  if (!recipientEmail) {
    console.log('No email recipient configured.');
    console.log('   Provide an email: --send ta@university.edu');
    console.log('   Or add to .flow/teach-config.yml: scholar.course.staff.ta_email');
  } else {
    const email = formatEmail('assignment', assignment, {
      courseCode,
      topic: options.topic || assignment.title || '',
      outputPath: result.filepath
    });

    const instructions = buildSendInstructions({
      to: recipientEmail,
      subject: email.subject,
      body: email.body
    });

    // Claude: Follow the instructions to preview and send via himalaya MCP
    console.log(instructions);
  }
}
```

## JSON Output Structure

```json
{
  "title": "Homework 3: Linear Regression",
  "assignment_type": "homework",
  "assignment_number": 3,
  "due_date": "Friday, Week 4 by 11:59 PM",
  "total_points": 100,
  "estimated_time": "2-3 hours",
  "instructions": "Show all work...",
  "submission_format": "pdf",
  "collaboration_policy": "individual",
  "late_policy": "10% off per day, up to 3 days",
  "topic": "Linear Regression",
  "week": 4,
  "learning_objectives": [
    "Interpret regression coefficients",
    "Assess model fit using R²"
  ],
  "problems": [
    {
      "id": "P1",
      "text": "Consider the regression model $Y = \\beta_0 + \\beta_1 X + \\epsilon$...",
      "points": 20,
      "parts": [
        {"label": "a", "text": "Derive the OLS estimator...", "points": 10},
        {"label": "b", "text": "Show that it is unbiased...", "points": 10}
      ],
      "difficulty": "medium",
      "topic": "OLS Estimation",
      "learning_objective": "Derive and interpret OLS estimators"
    }
  ],
  "solutions": {
    "P1": {
      "answer": "The OLS estimator is...",
      "steps": ["Step 1: Minimize SSE...", "Step 2: Take derivative..."],
      "parts": {
        "a": "Using calculus, minimize $\\sum(y_i - \\hat{y}_i)^2$...",
        "b": "Taking expectation, $E[\\hat{\\beta}] = \\beta$ because..."
      }
    }
  },
  "rubric": {
    "P1": {
      "full_credit": "Correct derivation with clear steps",
      "partial_credit": [
        {"points": 15, "criteria": "Correct approach, algebraic errors"},
        {"points": 10, "criteria": "Partial derivation, missing steps"}
      ],
      "common_errors": [
        "Forgetting to divide by n → deduct 3 pts",
        "Wrong sign on derivative → deduct 2 pts"
      ]
    }
  }
}
```

## Problem Difficulty Distribution

Default distribution:
- 20% easy (foundational, build confidence)
- 50% medium (core concepts, standard application)
- 25% hard (synthesis, multi-step)
- 5% challenge (optional, extra credit)

Adjust based on course level and assignment type.

## Best Practices

1. **Clear problem statements** - Unambiguous with all needed information
2. **Multi-part structure** - Break complex problems into manageable parts
3. **Point allocation** - Clear, proportional to difficulty
4. **Real-world context** - Include applications when appropriate
5. **Scaffolding** - Provide hints for harder problems
6. **LaTeX math** - Use proper notation: $\beta$, $\sum_{i=1}^n$

## R Code Validation (when --include-code)

When assignments include R code problems with embedded solutions:
- **Always run R code separately** before finalizing — use an R script or `/teaching:validate-r` to execute all chunks
- **Check inline interpretations** match actual R output (p-values, test statistics, CI bounds, effect sizes)
- Workflow: (1) Extract R chunks → standalone `.R` script, (2) Run and capture output, (3) Cross-check inline text against actual values
- This catches copy-paste errors, rounding mismatches, and stale interpretations

## Follow-up Actions

After generating assignment, offer to:
- Validate R code: `/teaching:validate-r <output-file>` (when `--include-code`)
- Export to LaTeX for professional formatting
- Generate separate solution key document
- Create sample data files for data analysis problems
- Export grading rubric as standalone document
- Generate practice problems for students

## Subject-Specific Considerations

**Statistics/Data Analysis:**
- Provide datasets or data generation code
- Require code + interpretation
- Include model diagnostics

**Mathematics:**
- Balance computational and proof problems
- Include examples before harder problems
- Specify notation conventions

**Research Methods:**
- Include literature review components
- Require methodological justification
- Emphasize ethical considerations

## Dry-Run Handler

```javascript
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';

// Parse user input
const args = parseArgs(userInput);

const options = {
  topic: args._[0] || '',
  difficulty: args.difficulty || args._[1] || 'intermediate',
  problemCount: parseInt(args.problems) || 5,
  format: args.format || 'markdown',
  instructions: args.instructions || args.i || null,
  dryRun: args['dry-run'] || false,
  json: args.json || false
};

// Handle dry-run mode
if (isDryRun(options)) {
  executeDryRun('assignment', options);
}

// Continue with generation...
```
</system>
