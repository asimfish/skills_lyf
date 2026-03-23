---
name: teaching:slides
description: Generate lecture slides for a course topic
---

# Create Lecture Slides

I'll help you create comprehensive lecture slides for your course topic.

**Usage:** `/teaching:slides <topic>` or `/teaching:slides <topic> <duration-minutes>`

**Examples:**
- `/teaching:slides "Multiple Regression"`
- `/teaching:slides "Hypothesis Testing" 75`
- `/teaching:slides "ANOVA" 50 --format reveal.js`
- `/teaching:slides "Regression" --dry-run`

**Options:**
- `--duration N` - Lecture duration in minutes (default: 50)
- `--slides N` - Number of slides (auto-calculated from duration if not set)
- `--format FMT` - Output format: markdown, reveal.js, beamer, pptx
- `--dry-run` - Preview what would be generated without API calls
- `--json` - Output dry-run as JSON (requires --dry-run)
- `--config PATH` - Explicit config file path (bypasses .flow/teach-config.yml discovery)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--debug` - Enable debug logging
- `--validate` - Run R code validation after generation

**Revision Options:**
- `--revise PATH` - Path to existing slide deck to revise
- `--instruction TEXT` - Revision instruction (required with --revise)
- `--section TITLE` - Target section heading (fuzzy matched)
- `--slides N-M` - Target slide range by number (e.g., "5-12" or "5")
- `--type TYPE` - Target by slide type (title, content, example, practice, quiz, summary, definition, theorem, discussion, questions)
- `--dry-run` - Preview changes without applying

**Revision Examples:**
- `/teaching:slides --revise slides.qmd --instruction "Add more examples"`
- `/teaching:slides --revise slides.qmd --section "Methods" --instruction "Simplify language"`
- `/teaching:slides --revise slides.qmd --slides "5-12" --instruction "Add speaker notes"`
- `/teaching:slides --revise slides.qmd --type quiz --instruction "Add a fourth option"`
- `/teaching:slides --revise slides.qmd --instruction "Convert R to Python" --dry-run`

**Validation Options:**
- `--check PATH` - Path to slide deck to validate
- `--from-plan WEEK` - Lesson plan week to validate against (e.g., "week03")
- `--json` - Output check results as JSON

**Validation Examples:**
- `/teaching:slides --check slides/week-03.qmd --from-plan week03`
- `/teaching:slides --check slides/week-03.qmd --from-plan week03 --json`

<system>
This command generates lecture slides using the Phase 0 foundation:
- Template System for structure (lecture.json)
- Config Loader for course settings
- Validator Engine for quality assurance
- AI Provider for content generation

## Implementation

```javascript
import { generateLecture, exportLecture } from '../../../teaching/generators/lecture.js';
import { buildConversationalPrompt, processGeneratedLecture } from '../../../teaching/generators/lecture-conversational.js';
import { reviseSlides } from '../../../teaching/generators/slide-refiner.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Parse user input
const args = parseArgs(userInput);

// ─── Mode: Revision (--revise) ───
if (args.revise) {
  const options = {
    revise: args.revise,
    instruction: args.instruction || null,
    section: args.section || null,
    slides: args.slides || null,
    type: args.type || null,
    dryRun: args['dry-run'] || false,
    debug: args.debug || false
  };

  console.log(`Revising: ${options.revise}`);
  if (options.section) console.log(`   Section: ${options.section}`);
  if (options.slides) console.log(`   Slides: ${options.slides}`);
  if (options.type) console.log(`   Type: ${options.type}`);
  if (options.instruction) console.log(`   Instruction: ${options.instruction}`);

  const result = await reviseSlides(options);
  console.log(`\nRevision complete (${result.elapsed}s)`);
  console.log(`Updated: ${result.file}`);
  console.log(`Slides affected: ${result.slidesAffected}`);
  process.exit(0);
}

// ─── Mode: Check Validation (--check) ───
if (args.check) {
  if (!args['from-plan']) {
    console.error('Error: --check requires --from-plan to specify the lesson plan');
    process.exit(1);
  }

  import { validateSlideCheck, formatSlideCheckReport, formatSlideCheckJson } from '../../../teaching/validators/slide-coverage.js';

  const checkOptions = {
    check: args.check,
    fromPlan: args['from-plan'],
    courseRoot: args['course-root'] || process.cwd(),
    json: args.json || false,
    debug: args.debug || false
  };

  const result = validateSlideCheck(checkOptions);
  if (args.json) {
    console.log(JSON.stringify(formatSlideCheckJson(result), null, 2));
  } else {
    console.log(formatSlideCheckReport(result, checkOptions.check, result.planTitle));
  }
  process.exit(result.overall === 'PASS' ? 0 : 1);
}

// ─── Mode: Generation (default) ───

// Default options
const options = {
  topic: args.topic || args._[0] || '',
  title: args.title || args._[0] || '',
  durationMinutes: parseInt(args.duration || args._[1]) || 50,
  level: args.level || undefined,
  week: parseInt(args.week) || null,
  lectureNumber: parseInt(args.lecture) || null,
  format: args.format || 'markdown',
  subtopics: args.subtopics ? args.subtopics.split(',').map(t => t.trim()) : [],
  includeCode: args['include-code'] || false,
  language: args.language || 'R',
  configPath: args.config || null,
  instructions: args.instructions || args.i || null,
  debug: args.debug || false,
  validate: args.validate || false
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
    const loaded = PromptLoader.load('slides', process.cwd());
    basePrompt = PromptBuilder.build(loaded.body, {
      courseCode: config.scholar?.course_info?.code || '',
      courseTitle: config.scholar?.course_info?.title || '',
      level: config.scholar?.course_info?.level || 'undergraduate',
      difficulty: options.difficulty || config.scholar?.course_info?.difficulty || 'intermediate',
      topic: options.topic || options.title || '',
      durationMinutes: options.durationMinutes,
      slideCount: options.slideCount || Math.round(options.durationMinutes / 2.5),
      format: options.format || 'markdown',
      subtopics: options.subtopics ? options.subtopics.join(', ') : '',
      language: options.language || 'R'
    });
    isCustomPrompt = true;
  } catch {
    // No user override — generator will use default slides prompt internally
    basePrompt = null;
  }

  // === Approval Loop (unlimited iterations) ===
  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    // Analyze with AI
    const categories = await merger.analyze(allInstructions, 'slides');

    // For preview: merge with base prompt (or placeholder if no custom prompt)
    const previewPrompt = basePrompt || `[Default slides prompt: ${options.topic || options.title}, ${options.durationMinutes} minutes]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'slides'
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
const result = await generateLecture(options);

// For conversational generation (Claude Code):
const prompt = buildConversationalPrompt(options);
// Claude generates JSON following the prompt
const lecture = processGeneratedLecture(generatedContent);

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
```

## JSON Output Structure

```json
{
  "title": "Multiple Regression",
  "topic": "Multiple Regression",
  "course_code": "STAT 440",
  "duration_minutes": 50,
  "level": "undergraduate",
  "learning_objectives": [
    "Apply multiple regression models to real data",
    "Interpret partial regression coefficients",
    "Assess model fit using adjusted R²"
  ],
  "slides": [
    {
      "id": "S1",
      "type": "title",
      "title": "Multiple Regression",
      "content": "STAT 440 | Week 5"
    },
    {
      "id": "S2",
      "type": "objectives",
      "title": "Learning Objectives",
      "bullets": ["Objective 1", "Objective 2"]
    },
    {
      "id": "S3",
      "type": "content",
      "title": "The Multiple Regression Model",
      "content": "Extends simple regression: $Y = \\beta_0 + \\beta_1 X_1 + \\beta_2 X_2 + \\epsilon$",
      "bullets": ["Multiple predictors", "Same OLS principle"],
      "speaker_notes": "Spend 3 minutes on this..."
    },
    {
      "id": "S4",
      "type": "example",
      "title": "Example: Housing Prices",
      "content": "Predicting price from sqft and bedrooms...",
      "speaker_notes": "Walk through step by step"
    },
    {
      "id": "S5",
      "type": "practice",
      "title": "Try It: Interpretation",
      "content": "Given output, interpret β₂...",
      "speaker_notes": "Give 2 minutes to work"
    },
    {
      "id": "S6",
      "type": "summary",
      "title": "Key Takeaways",
      "bullets": ["Multiple predictors improve fit", "Interpret holding others constant"]
    }
  ],
  "next_lecture": {
    "topic": "Model Diagnostics",
    "preview": "How to check assumptions"
  }
}
```

## Slide Types

- **title**: Opening slide with lecture title
- **objectives**: Learning objectives (3-5 using action verbs)
- **content**: Main explanatory content with optional bullets and LaTeX
- **example**: Worked examples with step-by-step solutions
- **definition**: Formal definitions with notation
- **theorem**: Mathematical theorems
- **practice**: Student exercises/think-pair-share
- **discussion**: Open-ended discussion questions
- **summary**: Key takeaways (3-5 points)
- **questions**: Closing slide for Q&A

## Output Formats

- **markdown** (default) - Pandoc-compatible with `---` slide breaks
- **reveal** - HTML5 reveal.js presentation
- **beamer** - LaTeX slides for academic presentations
- **quarto** - Quarto revealjs format

## Timing Guidelines

Based on duration, the generator creates appropriate slide counts:
- **50-minute lecture**: ~20 slides
- **75-minute lecture**: ~30 slides
- **90-minute lecture**: ~36 slides
- **120-minute lecture**: ~48 slides

Mix: ~70% content, ~15% practice, ~15% other (title, objectives, summary)

## Best Practices

1. **One concept per slide** - Don't overcrowd
2. **Examples are essential** - 1-2 per major concept
3. **Mix content with practice** - Maintain engagement
4. **Speaker notes** - Include timing suggestions
5. **LaTeX for math** - Use proper notation

## Follow-up Actions

After generating slides, offer:
- Validate R code chunks: `/teaching:validate-r`
- Generate speaker notes for each slide
- Create accompanying handout (PDF version)
- Generate practice problems for students
- Create quiz questions based on slides
- Export to different formats

## Related Commands

- `/teaching:assignment` - Create homework assignments
- `/teaching:quiz` - Generate quiz questions
- `/teaching:exam` - Create comprehensive exams
- `/teaching:syllabus` - Create course syllabus

## Dry-Run Handler

```javascript
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';

// Parse user input
const args = parseArgs(userInput);

const durationMins = parseInt(args.duration || args._[1]) || 50;
const options = {
  topic: args._[0] || '',
  durationMinutes: durationMins,
  slideCount: parseInt(args.slides) || Math.round(durationMins / 2.5),
  format: args.format || 'markdown',
  instructions: args.instructions || args.i || null,
  dryRun: args['dry-run'] || false,
  json: args.json || false
};

// Handle dry-run mode
if (isDryRun(options)) {
  executeDryRun('slides', options);
}

// Continue with generation...
```
</system>
