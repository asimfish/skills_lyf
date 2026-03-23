---
name: teaching:quiz
description: Create quiz questions for course material
---

# Create Quiz

I'll help you create comprehensive quiz questions for your course material.

**Usage:** `/teaching:quiz <topic>` or `/teaching:quiz <topic> <num-questions>`

**Examples:**
- `/teaching:quiz "Linear Regression"`
- `/teaching:quiz "Confidence Intervals" 10`
- `/teaching:quiz "ANOVA" 15 --difficulty mixed`
- `/teaching:quiz "Sampling" 8 --format canvas`
- `/teaching:quiz "Regression" --dry-run`

**Options:**
- `--questions N` - Number of questions (default: 10)
- `--difficulty LEVEL` - Difficulty: easy, medium, hard, mixed (default: mixed)
- `--format FMT` - Output format: markdown, canvas, moodle, pdf, latex
- `--dry-run` - Preview what would be generated without API calls
- `--json` - Output dry-run as JSON (requires --dry-run)
- `--config PATH` - Explicit config file path (bypasses .flow/teach-config.yml discovery)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--debug` - Enable debug logging

<system>
## Implementation

Generate quiz questions with:
1. **Multiple choice questions** (primary format)
2. **True/False questions** (quick checks)
3. **Short answer questions** (for deeper understanding)
4. **Calculation problems** (for quantitative topics)
5. **Answer key** with explanations
6. **Learning objective tags** (map to course objectives)

### Question Structure Template

```markdown
# Quiz: [Topic Name]

**Instructions:** Select the best answer for each question.

---

## Question 1 (Multiple Choice)

[Question text with clear stem]

A) [Distractor 1]
B) [Correct answer]
C) [Distractor 2]
D) [Distractor 3]

**Answer:** B
**Explanation:** [Why B is correct and others are wrong]
**Learning Objective:** [LO reference]
**Difficulty:** [Easy/Medium/Hard]

---

## Question 2 (True/False)

[Statement to evaluate]

**Answer:** True
**Explanation:** [Reasoning]

---

## Question 3 (Short Answer)

[Question requiring written response]

**Sample Answer:** [Expected response with key points]
**Grading Rubric:**
- Full credit (2 pts): [Criteria]
- Partial credit (1 pt): [Criteria]

---

## Question 4 (Calculation)

[Problem with numerical answer]

**Answer:** [Numerical result]
**Solution Steps:**
1. [Step 1]
2. [Step 2]
3. [Final answer]
```

### Question Type Distribution

Default mix for a 10-question quiz:
- **6 Multiple Choice** (60%) - Test conceptual understanding
- **2 True/False** (20%) - Quick fact checks
- **1 Short Answer** (10%) - Deeper understanding
- **1 Calculation** (10%) - Applied problem solving

Adjust based on topic and course level.

### Difficulty Levels

**Easy (Knowledge):**
- Recall definitions
- Identify examples
- State facts

**Medium (Comprehension/Application):**
- Explain concepts
- Apply formulas
- Interpret results
- Compare/contrast

**Hard (Analysis/Synthesis):**
- Analyze scenarios
- Design studies
- Critique approaches
- Create solutions

Default: 40% easy, 40% medium, 20% hard

### Distractor Design (Multiple Choice)

Create effective distractors:
1. **Plausible but incorrect** - Not obviously wrong
2. **Common misconceptions** - Address typical errors
3. **Partial understanding** - For students who know some material
4. **Similar wording** - Test careful reading

Avoid:
- "All of the above" or "None of the above"
- Obvious patterns in answer keys (e.g., all B's)
- Trick questions with subtle wording traps

### Format Options

Support multiple quiz formats:
- **Markdown** (default) - Human-readable, version-controllable
- **Canvas LMS** - Canvas quiz import format (QTI)
- **Moodle** - Moodle XML format
- **Google Forms** - Structured format for Google Forms
- **PDF** - Printable format with answer key separate
- **LaTeX** - Exam document class

### Best Practices

1. **Clear questions**: Avoid ambiguous wording
2. **One correct answer**: No debatable "best" answers
3. **Consistent difficulty**: Mix throughout quiz
4. **Fair distractors**: All options should seem reasonable
5. **Explanations**: Include reasoning for correct answers
6. **Time estimate**: 1-2 minutes per question
7. **Alignment**: Map questions to learning objectives

### Question Bank Features

Optionally generate:
- **Question pool** - More questions than needed for randomization
- **Difficulty ratings** - Tag each question
- **Topic tags** - For filtering and selection
- **Version variants** - Multiple versions of same quiz

## Follow-up Actions

After generating quiz, offer:
- Create answer key (separate document)
- Generate quiz variants (different question order)
- Create study guide based on quiz topics
- Generate similar practice questions
- Export to specific LMS format
- Create rubric for short answer questions

## Related Commands

- `/teaching:exam` - Create comprehensive exams
- `/teaching:rubric` - Generate grading rubrics
- `/teaching:slides` - Create lecture slides
- `/teaching:feedback` - Generate student feedback

## Dry-Run Handler

```javascript
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';

// Parse user input
const args = parseArgs(userInput);

const options = {
  topic: args._[0] || '',
  questionCount: parseInt(args.questions || args._[1]) || 10,
  difficulty: args.difficulty || 'mixed',
  format: args.format || 'markdown',
  dryRun: args['dry-run'] || false,
  json: args.json || false,
  configPath: args.config || null,
  instructions: args.instructions || args.i || null,
  debug: args.debug || false
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
    const loaded = PromptLoader.load('quiz', process.cwd());
    basePrompt = PromptBuilder.build(loaded.body, {
      courseCode: config.scholar?.course_info?.code || '',
      courseTitle: config.scholar?.course_info?.title || '',
      level: config.scholar?.course_info?.level || 'undergraduate',
      difficulty: options.difficulty || config.scholar?.course_info?.difficulty || 'intermediate',
      quizType: options.type || 'practice',
      questionCount: options.questionCount,
      topics: options.topics ? options.topics.join(', ') : 'Use course curriculum'
    });
    isCustomPrompt = true;
  } catch {
    // No user override — generator will use default quiz prompt internally
    basePrompt = null;
  }

  // === Approval Loop (unlimited iterations) ===
  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    // Analyze with AI
    const categories = await merger.analyze(allInstructions, 'quiz');

    // For preview: merge with base prompt (or placeholder if no custom prompt)
    const previewPrompt = basePrompt || `[Default quiz prompt: ${options.questionCount || 10} questions]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'quiz'
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

// Handle dry-run mode
if (isDryRun(options)) {
  executeDryRun('quiz', options);
}

// Continue with generation...
// After quiz is generated and saved as `quiz` object with `filepath`:

// ─── Format Routing ───
// Route generated content through the appropriate formatter
if (options.format && options.format !== 'markdown') {
  const { getFormatter, isFormatSupported } = await import('../../../teaching/formatters/index.js');

  if (isFormatSupported(options.format)) {
    const formatter = getFormatter(options.format);
    const formatted = formatter.format(quiz.content || quiz);
    const ext = formatter.getFileExtension();
    const formatFilename = filepath.replace(/\.(json|md)$/, ext);
    writeFileSync(formatFilename, formatted);
    console.log(`📄 Formatted output: ${basename(formatFilename)}`);

    // For canvas/qti format, route through CanvasFormatter for validation + cleanup
    if (['canvas', 'qti'].includes(options.format)) {
      const { CanvasFormatter } = await import('../../../teaching/formatters/canvas.js');
      const canvasFormatter = new CanvasFormatter();
      try {
        const qtiPath = await canvasFormatter.format(quiz.content || quiz, {
          output: formatFilename.replace(ext, '.qti.zip'),
          sourceDir: process.cwd()
        });
        console.log(`📦 Canvas QTI package: ${basename(qtiPath)}`);
      } catch (err) {
        console.log(`⚠️ Canvas QTI export failed: ${err.message}`);
        console.log('   Install examark: npm install -g examark');
      }
    }
  } else {
    console.log(`⚠️ Unknown format: ${options.format}. Using default markdown output.`);
  }
}

```
</system>
