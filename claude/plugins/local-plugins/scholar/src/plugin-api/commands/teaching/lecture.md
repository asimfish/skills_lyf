---
name: teaching:lecture
description: Generate comprehensive instructor lecture notes in Quarto format (20-40 pages)
---

# Generate Lecture Notes

I'll help you create comprehensive instructor-facing lecture notes for your course topic. These are **long-form documents** (20-40 pages) with prose explanations, executable code, LaTeX math, and practice problems—not slides.

**Usage:** `/teaching:lecture <topic> [options]`

**Examples:**
```
# Generate
/teaching:lecture "Multiple Regression"
/teaching:lecture --from-plan=week03 --output-dir=content/lectures/
/teaching:lecture "ANOVA" --level=graduate --language=python --open

# Revise
/teaching:lecture --revise=content/lectures/week08-rcbd.qmd --section="Worked Examples" --instruction="Add two more examples with R code"
/teaching:lecture --revise=content/lectures/week08-rcbd.qmd --instruction="Use tidyverse syntax throughout"

# Validate
/teaching:lecture --check=content/lectures/week08-rcbd.qmd --from-plan=week08

# Preview
/teaching:lecture "Hypothesis Testing" --dry-run
```

**Arguments:**
- `topic` - Topic for lecture notes (required for generation)

**Options:**
- `--from-plan=WEEK` - Generate from lesson plan (e.g., --from-plan=week03)
- `--output-dir PATH` - Output directory (default: current directory)
- `--force` - Skip overwrite confirmation
- `--context SPEC` - Load previous week context: `previous` (default: 3 weeks) or number (e.g., `1`)
- `--open` - Launch Quarto preview after generation
- `--format FMT` - Quarto output formats: html,pdf,docx (default: html,pdf,docx)
- `--language LANG` - Code language: r, python (default: r)
- `--level LEVEL` - Override course level: undergraduate, graduate, both
- `--config PATH` - Explicit config file path
- `--revise PATH` - Path to existing .qmd to revise (alias: `--refine`)
- `--section TITLE` - Section title to target (fuzzy matched, requires --revise)
- `--instruction TEXT` - Revision instruction (requires --revise)
- `--check PATH` - Path to .qmd to validate against lesson plan (requires --from-plan)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--dry-run` - Show outline without generating full content
- `--json` - Output dry-run as JSON (requires --dry-run)
- `--debug` - Enable debug logging
- `--validate` - Run R code validation after generation

**Distinction from /teaching:slides:**

| Aspect | /teaching:slides | /teaching:lecture |
|--------|------------------|-------------------|
| **Purpose** | Visual presentation | Instructor reference |
| **Format** | Reveal.js/Beamer | Quarto document |
| **Length** | ~20-30 slides | 20-40 pages |
| **Content** | Bullets, minimal text | Comprehensive prose |
| **Code** | Display snippets | Full executable blocks |
| **Usage** | Project in class | Read/reference while teaching |

<system>
This command generates instructor lecture notes using the teaching foundation:
- Template System for structure (lecture-notes.json)
- Config Loader for course settings + 4-layer teaching style
- Validator Engine for quality assurance
- AI Provider for section-by-section generation

## Implementation

```javascript
import { generateLectureNotes } from '../../../teaching/generators/lecture-notes.js';
import { refineLecture } from '../../../teaching/generators/lecture-refiner.js';
import { validateCoverage, formatCoverageReport } from '../../../teaching/validators/lecture-coverage.js';
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';
import { generateLectureFilename } from '../../../teaching/utils/slugify.js';
import { launchPreview } from '../../../teaching/utils/preview-launcher.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// Parse user input
const args = parseArgs(userInput);

// All options
const options = {
  topic: args.topic || args._[0] || '',
  fromPlan: args['from-plan'] || null,
  outputDir: args['output-dir'] || null,
  force: args.force || false,
  context: args.context || null,
  open: args.open || false,
  format: args.format || 'html,pdf,docx',
  language: args.language || 'r',
  level: args.level || undefined,
  configPath: args.config || null,
  // Refinement (--revise primary, --refine silent alias)
  refine: args.revise || args.refine || null,
  section: args.section || null,
  instruction: args.instruction || null,
  // Validation
  check: args.check || null,
  // Custom instructions
  instructions: args.instructions || args.i || null,
  // Meta
  dryRun: args['dry-run'] || false,
  json: args.json || false,
  debug: args.debug || false,
  validate: args.validate || false
};

// ─── Mode: Coverage Validation (--check) ───
if (options.check) {
  if (!options.fromPlan) {
    console.error('❌ Error: --check requires --from-plan to specify the lesson plan');
    process.exit(1);
  }
  const report = validateCoverage(options);
  console.log(formatCoverageReport(report));
  process.exit(report.coveragePercent === 100 ? 0 : 1);
}

// ─── Mode: Revision (--revise / --refine) ───
if (options.refine) {
  if (!options.instruction) {
    console.error('❌ Error: --revise requires --instruction');
    process.exit(1);
  }
  console.log(`🔧 Revising: ${options.refine}`);
  if (options.section) console.log(`   Section: ${options.section}`);
  console.log(`   Instruction: ${options.instruction}`);

  const result = await refineLecture(options);
  console.log(`\n✅ Revision complete (${result.elapsed}s)`);
  console.log(`📁 Updated: ${result.file}`);

  if (options.open) {
    const preview = launchPreview(result.file, options);
    console.log(preview.success ? `🔍 ${preview.message}` : `⚠️ ${preview.message}`);
  }
  process.exit(0);
}

// ─── Mode: Generation (default) ───
// Validate: need topic or from-plan
if (!options.topic && !options.fromPlan) {
  console.error('❌ Error: Provide a topic or use --from-plan=weekNN');
  process.exit(1);
}

// ─── Custom Instructions Pipeline ───
if (options.instructions) {
  const { InstructionMerger } = await import('../../../teaching/ai/instruction-merger.js');
  const { AIProvider } = await import('../../../teaching/ai/provider.js');
  const { loadTeachConfig } = await import('../../../teaching/config/loader.js');

  let instructionText = options.instructions;
  if (instructionText.startsWith('@')) {
    instructionText = await InstructionMerger.loadFromFile(instructionText.slice(1));
  }

  const config = loadTeachConfig(process.cwd());

  const haiku = new AIProvider({
    model: 'claude-haiku-4-5-20251001',
    apiKey: config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
    debug: options.debug
  });

  const merger = new InstructionMerger(haiku, { debug: options.debug });

  let basePrompt;
  let isCustomPrompt = false;

  try {
    const { PromptLoader } = await import('../../../teaching/ai/prompt-loader.js');
    const { PromptBuilder } = await import('../../../teaching/ai/prompt-builder.js');
    const loaded = PromptLoader.load('lecture-notes', process.cwd());
    basePrompt = PromptBuilder.build(loaded.body, {
      topic: options.topic,
      fromPlan: options.fromPlan,
      language: options.language,
      level: options.level
    });
    isCustomPrompt = true;
  } catch {
    basePrompt = null;
  }

  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    const categories = await merger.analyze(allInstructions, 'lecture');
    const previewPrompt = basePrompt || `[Default lecture prompt]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'lecture'
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

// Handle dry-run mode
if (isDryRun(options)) {
  executeDryRun('lecture-notes', options);
}

// Generate lecture notes
console.log(`📝 Generating lecture notes: ${options.topic || options.fromPlan}`);
console.log(`📄 Format: Quarto (.qmd) → ${options.format}`);
if (options.context) {
  console.log(`📚 Context: loading previous weeks`);
}

const lectureNotes = await generateLectureNotes(options);

// Resolve output directory with path traversal protection
const cwd = process.cwd();
const outputDir = options.outputDir
  ? resolve(cwd, options.outputDir)
  : cwd;

// Prevent writing outside the current working directory
if (!outputDir.startsWith(cwd)) {
  console.error(`❌ Error: Output directory must be within the project: ${outputDir}`);
  process.exit(1);
}

if (options.outputDir && !existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const filename = generateLectureFilename(options);
const filepath = join(outputDir, filename);

// Atomic overwrite check using exclusive file creation
import { openSync, closeSync } from 'fs';
if (!options.force) {
  try {
    const fd = openSync(filepath, 'wx');
    closeSync(fd);
    // File was created exclusively — write content to it
    writeFileSync(filepath, lectureNotes.content, 'utf-8');
  } catch (err) {
    if (err.code === 'EEXIST') {
      console.log(`⚠️ File already exists: ${filepath}`);
      console.log(`   Use --force to overwrite.`);
      process.exit(1);
    }
    throw err;
  }
} else {
  writeFileSync(filepath, lectureNotes.content, 'utf-8');
}

console.log(`\n✅ Lecture notes generated successfully!`);
console.log(`📁 File: ${filepath}`);
console.log(`\n📊 Statistics:`);
console.log(`  Sections: ${lectureNotes.metadata.totalSections}`);
console.log(`  Est. Pages: ~${lectureNotes.metadata.totalPages}`);
console.log(`  Code Blocks: ${lectureNotes.metadata.codeBlocks}`);
console.log(`  Math Equations: ${lectureNotes.metadata.mathEquations}`);
console.log(`  Practice Problems: ${lectureNotes.metadata.practiceProblems}`);
console.log(`  Generation Time: ${lectureNotes.metadata.generationTime}s`);

// ─── Validate R code (if --validate) ───
if (options.validate && filepath.endsWith('.qmd')) {
  console.log('\n🔍 Running R code validation...');

  import { validatePipeline } from '../../../teaching/utils/validate-pipeline.js';

  const validation = validatePipeline({
    filepath: filepath,
    language: options.language || 'r',
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

// Auto-preview if --open
if (options.open) {
  const preview = launchPreview(filepath, options);
  console.log(preview.success ? `\n🔍 ${preview.message}` : `\n⚠️ ${preview.message}`);
} else {
  console.log(`\n📦 To render:`);
  console.log(`   quarto render ${filepath}`);
}
```

## JSON Output Structure

```json
{
  "title": "Multiple Regression",
  "topic": "Multiple Regression",
  "course_code": "STAT 440",
  "week": 5,
  "level": "undergraduate",
  "generated_at": "2026-01-14T10:30:00Z",
  "teaching_style": {
    "tone": "formal",
    "pedagogical_approach": "active-learning",
    "explanation_style": "rigorous-with-intuition"
  },
  "learning_objectives": [
    "Formulate multiple regression models with multiple predictors",
    "Interpret partial regression coefficients",
    "Assess model fit using adjusted R² and F-tests",
    "Diagnose multicollinearity using VIF"
  ],
  "sections": [
    {
      "id": "S1",
      "type": "introduction",
      "title": "Introduction to Multiple Regression",
      "level": 1,
      "estimated_pages": 2,
      "content": "Multiple regression extends simple linear regression..."
    },
    {
      "id": "S2",
      "type": "concept",
      "title": "The Multiple Regression Model",
      "level": 1,
      "estimated_pages": 4,
      "content": "...",
      "math": "Y_i = \\beta_0 + \\beta_1 X_{i1} + \\cdots + \\beta_p X_{ip} + \\epsilon_i",
      "subsections": [
        {
          "id": "S2.1",
          "type": "definition",
          "title": "Model Assumptions",
          "level": 2,
          "content": "..."
        }
      ]
    },
    {
      "id": "S3",
      "type": "example",
      "title": "Example: Housing Prices",
      "level": 1,
      "estimated_pages": 5,
      "code": {
        "language": "r",
        "source": "# Load data\\nhousing <- read.csv('housing.csv')\\n\\n# Fit model\\nmodel <- lm(price ~ sqft + bedrooms, data = housing)\\nsummary(model)"
      }
    },
    {
      "id": "S4",
      "type": "practice",
      "title": "Practice Problems",
      "level": 1,
      "estimated_pages": 3,
      "problems": [
        {
          "id": "P1",
          "text": "Given the following output, interpret β₂...",
          "solution": "...",
          "difficulty": "medium"
        }
      ]
    },
    {
      "id": "S5",
      "type": "summary",
      "title": "Key Takeaways",
      "level": 1,
      "estimated_pages": 1,
      "bullets": [
        "Multiple regression extends simple regression to multiple predictors",
        "Partial coefficients control for other variables"
      ]
    }
  ],
  "references": [
    "Kutner, M. H., et al. (2005). Applied Linear Statistical Models.",
    "James, G., et al. (2021). An Introduction to Statistical Learning."
  ]
}
```

## Section Types

- **introduction**: Opening section with overview and motivation
- **concept**: Main explanatory content with comprehensive prose
- **definition**: Formal definitions with mathematical notation
- **theorem**: Mathematical theorems with formal statements
- **proof**: Mathematical proofs (graduate level)
- **example**: Worked examples with step-by-step solutions
- **code**: Executable R/Python code blocks
- **practice**: Practice problems with solutions
- **discussion**: Open-ended discussion questions
- **summary**: Key takeaways and review

## 4-Layer Teaching Style System

This command uses the enhanced 4-layer style system:

1. **Global Teaching Style** (`~/.claude/CLAUDE.md`)
2. **Course-Specific Overrides** (`.claude/teaching-style.local.md`)
3. **Command-Level Overrides** (`.claude/teaching-style.local.md` → `command_overrides.lecture`)
4. **Lesson Plan Metadata** (`content/lesson-plans/weekNN.yml`)

## Cross-Listed Course Support

For `level: "both"` courses, generates differentiated callouts:

```markdown
::: {.callout-note title="Graduate Level"}
For graduate students: The formal proof follows from...
:::
```

## Dry-Run Handler

```javascript
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';

const options = {
  topic: args._[0] || '',
  fromPlan: args['from-plan'] || null,
  instructions: args.instructions || args.i || null,
  dryRun: args['dry-run'] || false,
  json: args.json || false
};

if (isDryRun(options)) {
  executeDryRun('lecture-notes', options);
}
```

## Related Commands

- `/teaching:slides` - Create visual presentation slides
- `/teaching:quiz` - Generate quiz questions from lecture content
- `/teaching:exam` - Create comprehensive exams
- `/teaching:assignment` - Create homework assignments

## Follow-up Actions

After generating lecture notes, offer:
- Validate R code chunks: `/teaching:validate-r`
- Generate accompanying slides (`/teaching:slides`)
- Create quiz questions based on content (`/teaching:quiz`)
- Export to additional formats (PDF, DOCX)
- Generate practice problem set
- Render with `quarto render`
</system>
