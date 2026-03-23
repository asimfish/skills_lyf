---
name: teaching:solution
description: Generate standalone solution keys from existing assignment files
---

# Generate Solution Key

Generate a comprehensive solution key from an existing assignment file. Reads `.qmd` or `.json` assignment files, identifies problems, and produces step-by-step solutions as a separate document.

**Usage:**
```
/teaching:solution <assignment-file> [options]
```

**Examples:**
```
/teaching:solution assignments/assignment1_basics_of_experimental_design.qmd
/teaching:solution assignments/hw3.json --format md
/teaching:solution assignments/assignment4.qmd --output solutions/hw4-key.qmd
/teaching:solution assignments/assignment2.qmd --include-rubric --include-code
/teaching:solution assignments/assignment1.qmd --dry-run
/teaching:solution assignments/assignment3.qmd --send
/teaching:solution assignments/assignment3.qmd --send ta@university.edu
```

**Options:**
- `--format FMT` - Output format: qmd (default), md, json
- `--output PATH` - Custom output path (default: `solutions/<name>-solution.qmd`)
- `--include-rubric` - Include grading notes and partial credit guidance
- `--include-code` - Include R/Python code solutions (default: true)
- `--language R|Python` - Programming language for code (default: R)
- `--no-code` - Exclude code solutions
- `--config PATH` - Explicit config file path (bypasses .flow/teach-config.yml discovery)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--dry-run` - Preview what would be generated without API calls
- `--json` - Output dry-run as JSON (requires --dry-run)
- `--send [EMAIL]` - Email solution to TA after saving. Uses course.staff.ta_email from teach-config.yml if no email provided. Requires himalaya MCP.
- `--validate` - Run R code validation after generation (calls /teaching:validate-r)
- `--debug` - Enable debug logging

**Supported Input Formats:**
- `.qmd` / `.md` - Quarto/Markdown assignments (auto-parses YAML frontmatter and problem blocks)
- `.json` - JSON assignments (same schema as `/teaching:assignment` output)

**Output:**
- Step-by-step solutions with worked examples
- Final answers clearly marked
- Interpretation of results in context
- R code solutions (optional)
- Common mistakes and grading notes (optional)
- LaTeX math notation support

<system>
This command generates standalone solution keys from existing assignment files.

## Implementation

```javascript
import { parseAssignment, generateOutputPath } from '../../../teaching/generators/solution.js';
import {
  buildConversationalPrompt,
  processGeneratedSolution,
  saveSolution
} from '../../../teaching/generators/solution-conversational.js';

// Parse user input
const args = parseArgs(userInput);

// The first positional argument is the assignment file path
const assignmentPath = args._[0];

if (!assignmentPath) {
  console.log('Error: Please provide an assignment file path.');
  console.log('Usage: /teaching:solution <assignment-file> [options]');
  console.log('Example: /teaching:solution assignments/assignment1.qmd');
  process.exit(1);
}

const options = {
  format: args.format || 'qmd',
  outputPath: args.output || null,
  includeRubric: args['include-rubric'] || false,
  includeCode: !args['no-code'],
  language: args.language || 'R',
  configPath: args.config || null,
  instructions: args.instructions || args.i || null,
  dryRun: args['dry-run'] || false,
  json: args.json || false,
  validate: args.validate || false,
  debug: args.debug || false,
  send: args.send || false  // true (use config email) or string (explicit email)
};

// ─── Dry-Run Handler ───
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';

if (isDryRun(options)) {
  // Parse the assignment to show problem count in preview
  try {
    const assignment = parseAssignment(assignmentPath);
    const outputPath = generateOutputPath(assignmentPath, options.format, options.outputPath);
    options.topic = assignment.title || 'Assignment';
    options.problemCount = assignment.problems.length;
    options.outputFile = outputPath;
    options.sourceFile = assignmentPath;
  } catch (e) {
    options.topic = assignmentPath;
    options.parseError = e.message;
  }
  executeDryRun('solution', options);
}

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

  // Build base prompt from the assignment file
  let basePrompt;
  let isCustomPrompt = false;

  try {
    const { PromptLoader } = await import('../../../teaching/ai/prompt-loader.js');
    const { PromptBuilder } = await import('../../../teaching/ai/prompt-builder.js');
    const loaded = PromptLoader.load('solution', process.cwd());
    const assignment = parseAssignment(assignmentPath);
    basePrompt = PromptBuilder.build(loaded.body, {
      assignmentTitle: assignment.title,
      problemCount: assignment.problems.length,
      includeCode: options.includeCode,
      language: options.language
    });
    isCustomPrompt = true;
  } catch {
    // No user override — generator builds prompt from assignment
    basePrompt = null;
  }

  // === Approval Loop ===
  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    const categories = await merger.analyze(allInstructions, 'solution');
    const previewPrompt = basePrompt || `[Default solution prompt for ${assignmentPath}]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'solution'
    });

    const summary = merger.summarize(mergeResult);
    console.log(summary);
    console.log('---');
    console.log('**Accept** to generate | **Modify** to change instructions | **Cancel** to abort');

    const userResponse = await waitForUserResponse();

    if (userResponse.action === 'accept') {
      if (isCustomPrompt) {
        options.mergedPrompt = mergeResult.mergedPrompt;
      }
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

// ─── Generate Solution ───

// 1. Parse the assignment file
const assignment = parseAssignment(assignmentPath);

// 2. Build the conversational prompt
const promptData = buildConversationalPrompt(assignmentPath, options);

// 3. Claude generates JSON following the prompt
// (In conversational mode, the prompt is shown to Claude who generates the solution)
const solution = processGeneratedSolution(generatedContent, assignment);

// 4. Determine output path
const outputPath = options.outputPath || generateOutputPath(assignmentPath, options.format);

// 5. Save the solution
const result = saveSolution(assignment, solution, outputPath, {
  format: options.format,
  language: options.language
});

console.log(`✅ Solution saved to: ${result.filepath}`);
console.log(`   Format: ${result.format} | Size: ${result.size} bytes`);

// 6. Validate R code (if --validate)
if (options.validate && result.filepath.endsWith('.qmd')) {
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
  const courseCode = config.scholar?.course_info?.code || config.course?.name || '';

  const recipientEmail = resolveRecipient(options, config);

  if (!recipientEmail) {
    console.log('No email recipient configured.');
    console.log('   Provide an email: --send ta@university.edu');
    console.log('   Or add to .flow/teach-config.yml: scholar.course.staff.ta_email');
  } else {
    const email = formatEmail('solution', solution, {
      courseCode,
      topic: assignment.title || assignmentPath,
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

## Solution JSON Structure

```json
{
  "assignment_title": "Assignment 1: Basics of Experimental Design",
  "solutions": {
    "P1": {
      "answer": "The treatment has a significant effect, $F(2, 27) = 8.43$, $p = 0.0015$",
      "steps": [
        "Step 1: State hypotheses — $H_0: \\mu_1 = \\mu_2 = \\mu_3$ vs $H_a$: at least one mean differs",
        "Step 2: Calculate group means — $\\bar{Y}_1 = 12.3$, $\\bar{Y}_2 = 15.7$, $\\bar{Y}_3 = 18.2$",
        "Step 3: Compute SS_Trt and SS_E using ANOVA decomposition",
        "Step 4: Form F-ratio and compare to reference distribution"
      ],
      "parts": {
        "a": "The completely randomized design is appropriate because treatments are assigned randomly to experimental units with no blocking factors.",
        "b": "With $k = 3$ groups and $n = 10$ per group, $df_{Trt} = 2$ and $df_E = 27$."
      },
      "code": "# One-way ANOVA\nfit <- aov(response ~ treatment, data = experiment)\nsummary(fit)\n\n# Effect size\neffectsize::eta_squared(fit)",
      "interpretation": "The data provide strong evidence against the null hypothesis of equal treatment means. The eta-squared of 0.38 indicates a large effect, with treatment explaining 38% of the variance in response.",
      "common_mistakes": [
        "Using t-test instead of ANOVA for 3+ groups — deduct 5 pts",
        "Forgetting to check normality assumption — deduct 3 pts",
        "Reporting F-statistic without degrees of freedom — deduct 2 pts"
      ],
      "grading_notes": "Award 5 pts for correct setup even if calculation has minor errors. Accept either hand calculation or R output."
    }
  },
  "general_notes": "Students should show work for hand calculations. R output alone is insufficient for problems requiring derivation. Accept p-values reported to 3-4 decimal places."
}
```

## Output Path Convention

Default output goes to a `solutions/` sibling directory:

```
assignments/assignment1.qmd  →  solutions/assignment1-solution.qmd
assignments/hw3.json         →  solutions/hw3-solution.qmd
```

The `solutions/` directory should be added to `.gitignore` and `.quartoignore` in public repositories to prevent students from accessing answer keys.

## Best Practices

1. **Review generated solutions** — AI solutions should always be verified by the instructor
2. **Add course-specific context** — Use `-i` to provide relevant formulas, datasets, or notation
3. **Include code** — R/Python code helps TAs verify numerical answers
4. **Include rubric notes** — Use `--include-rubric` for assignments graded by TAs
5. **Keep solutions private** — Ensure `solutions/` is gitignored in public repos

## Solution Key Validation Workflow
- **Always run R code separately** before finalizing solution keys — use an R script or `/teaching:validate-r` to execute all chunks
- **Check inline interpretations** match actual R output (p-values, test statistics, CI bounds, effect sizes)
- Workflow: (1) Extract R chunks → standalone `.R` script, (2) Run and capture output, (3) Cross-check inline text against actual values
- This catches copy-paste errors, rounding mismatches, and stale interpretations

## Data Loading Rules (CRITICAL)

Before generating R code solutions:

1. SCAN the project's data directory: `ls data/` (or the configured `scholar.data_dir`)
2. MATCH textbook references to data files:
   - File naming pattern: lowercase topic, dots for spaces (e.g., margarine.txt, meat.cooking.txt)
   - Common mappings: "Table X.Y about [topic]" → data/dean2017/[topic].txt
3. ALWAYS load with: `read.table(here::here("data", "dean2017", "<file>.txt"), header = TRUE)`
4. NEVER hard-code data that exists in the data directory
5. ALWAYS use `eval: true` for R chunks (no `eval: false` placeholders)
6. If no matching data file exists, note it in a callout and provide inline data

## R Code Style Rules (CRITICAL — match lecture/lab patterns)

1. Package loading: `pacman::p_load()` with descriptive comments per package
2. Reproducibility: `set.seed(545)` in setup chunk
3. Data paths: `here::here()` with separate arguments (NOT path strings)
4. Diagnostics: `car::qqPlot()` (not `qqnorm`), `performance::check_model()`
5. ANOVA tables: `broom::tidy() |> knitr::kable()`
6. External packages: always namespace (`emmeans::`, `car::`, `MASS::`, `performance::`)
7. Base R functions: no namespace needed (`shapiro.test`, `bartlett.test`, `oneway.test`)
8. Pipe: use `|>` (base pipe), not `%>%`

## Follow-up Actions

After generating the solution key, offer to:
- Validate R code: `/teaching:validate-r <output-file>`
- Email to TA: use `--send` or `--send ta@email.com`
- Render the solution to PDF: `quarto render solutions/file.qmd --to pdf`
- Generate a grading rubric: `/teaching:rubric`
- Compare with existing solutions
- Export to a different format
</system>
