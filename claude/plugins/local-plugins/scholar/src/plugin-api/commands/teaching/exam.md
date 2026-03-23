---
name: exam
description: Generate comprehensive exams with AI-powered questions and answer keys
---

# Generate Exam

Generate a comprehensive exam with multiple question types, automatic answer key generation, and validation.

**Usage:**
```
/teaching:exam [type] [options]
```

**Examples:**
```
/teaching:exam midterm
/teaching:exam final --questions 15 --difficulty hard
/teaching:exam practice --topics "linear regression,hypothesis testing"
```

**Exam Types:**
- `midterm` - Mid-term examination (default)
- `final` - Final examination
- `practice` - Practice exam
- `quiz` - Short quiz

**Options:**
- `--questions N` - Number of questions (default: 10)
- `--difficulty LEVEL` - Difficulty level: easy, medium, hard (default: from config)
- `--duration N` - Duration in minutes (default: 60)
- `--topics "topic1,topic2"` - Specific topics to cover
- `--no-formulas` - Exclude formula sheet
- `--no-solutions` - Exclude detailed solutions
- `--format FMT` - Output format: json (default), examark, canvas, md, qmd, tex
- `--strict` - Use strict validation
- `--variations N` - Generate N variations of the exam
- `--dry-run` - Preview what would be generated without API calls
- `--json` - Output dry-run as JSON (requires --dry-run)
- `--config PATH` - Explicit config file path (bypasses .flow/teach-config.yml discovery)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--debug` - Enable debug logging

**Question Types:**
The generator creates a mix of:
- Multiple-choice questions (4 options)
- Short-answer questions
- Essay questions with rubrics
- True/false questions
- Numerical questions

**Output:**
- JSON file with complete exam structure
- Automatic answer key generation
- LaTeX math notation support
- Validation of all content

<system>
This command generates exams using the Phase 0 foundation:
- Template System for structure
- Config Loader for course settings
- Validator Engine for quality assurance
- AI Provider for question generation

## Implementation

```javascript
import { generateExam, generateExamVariations } from '../../../teaching/generators/exam.js';
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';
import { runCanvasPreflightValidation } from '../../../teaching/validators/canvas-preflight.js';
import { writeFileSync } from 'fs';
import { join, basename } from 'path';

// Parse user input
const args = parseArgs(userInput); // userInput from conversation

// Default options
const options = {
  type: args.type || args._[0] || 'midterm',
  questionCount: parseInt(args.questions) || 10,
  difficulty: args.difficulty || undefined, // Use config default
  durationMinutes: parseInt(args.duration) || 60,
  topics: args.topics ? args.topics.split(',').map(t => t.trim()) : [],
  includeFormulas: !args['no-formulas'],
  includeSolutions: !args['no-solutions'],
  strict: args.strict || false,
  format: args.format || 'json',
  dryRun: args['dry-run'] || false,
  json: args.json || false,
  configPath: args.config || null,
  instructions: args.instructions || args.i || null,
  debug: args.debug || false,
  canvasSafe: ['canvas', 'qti'].includes(args.format || 'json')
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
    const loaded = PromptLoader.load('exam', process.cwd());
    basePrompt = PromptBuilder.build(loaded.body, {
      courseCode: config.scholar?.course_info?.code || '',
      courseTitle: config.scholar?.course_info?.title || '',
      level: config.scholar?.course_info?.level || 'undergraduate',
      difficulty: options.difficulty || config.scholar?.course_info?.difficulty || 'intermediate',
      examType: options.type,
      questionCount: options.questionCount,
      topics: options.topics.join(', ') || 'Use course curriculum',
      duration: options.durationMinutes
    });
    isCustomPrompt = true;
  } catch {
    // No user override — generator will use buildExamPrompt() internally
    basePrompt = null;
  }

  // === Approval Loop (unlimited iterations) ===
  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    // Analyze with AI
    const categories = await merger.analyze(allInstructions, 'exam');

    // For preview: merge with base prompt (or placeholder if no custom prompt)
    const previewPrompt = basePrompt || `[Default exam prompt: ${options.type}, ${options.questionCount} questions]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'exam'
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
  executeDryRun('exam', options);
  // executeDryRun calls process.exit(0)
}

// Canvas safe mode: constrain question types for Canvas import compatibility
if (options.canvasSafe) {
  const canvasSafeInstruction = 'Only use these question types: multiple-choice, true-false, multiple-answers, short-answer, essay, numerical. Do NOT use matching or fill-in-multiple-blanks question types.';
  options.instructions = options.instructions
    ? canvasSafeInstruction + '\n' + options.instructions
    : canvasSafeInstruction;
  console.log('🎯 Canvas mode: using Canvas-compatible question types only');
}

// Generate exam
console.log(`🎓 Generating ${options.type} exam...`);
console.log(`📊 ${options.questionCount} questions, ${options.durationMinutes} minutes`);

if (args.variations) {
  // Generate multiple variations
  const count = parseInt(args.variations);
  console.log(`🔄 Generating ${count} variations...`);

  const variations = await generateExamVariations(options, count);

  // Import formatter once if non-JSON format requested
  let formatter = null;
  if (options.format && options.format !== 'json') {
    const { getFormatter } = await import('../../../teaching/formatters/index.js');
    formatter = getFormatter(options.format);
  }

  variations.forEach((exam, index) => {
    const filename = `exam-${options.type}-v${index + 1}-${Date.now()}.json`;
    const filepath = join(process.cwd(), filename);
    writeFileSync(filepath, JSON.stringify(exam.content, null, 2));
    console.log(`✅ Variation ${index + 1} saved: ${filename}`);

    // Format routing for variations
    if (formatter) {
      const formatted = formatter.format(exam.content);
      const ext = formatter.getFileExtension();
      const formatFilename = filename.replace(/\.json$/, ext);
      writeFileSync(join(process.cwd(), formatFilename), formatted);
      console.log(`   📄 Formatted: ${formatFilename}`);
    }
  });

  console.log(`\n📈 Summary:`);
  console.log(`  Total variations: ${variations.length}`);
  console.log(`  Questions per exam: ${variations[0].metadata.questionCount}`);
  console.log(`  Total points: ${variations[0].metadata.totalPoints}`);

} else {
  // Generate single exam
  const exam = await generateExam(options);

  // Save to file
  const filename = `exam-${options.type}-${Date.now()}.json`;
  const filepath = join(process.cwd(), filename);
  writeFileSync(filepath, JSON.stringify(exam.content, null, 2));

  // ─── Format Routing ───
  // If a non-JSON format is requested, also produce formatted output
  if (options.format && options.format !== 'json') {
    const { getFormatter } = await import('../../../teaching/formatters/index.js');
    const formatter = getFormatter(options.format);
    const formatted = formatter.format(exam.content);
    const ext = formatter.getFileExtension();
    const formatFilename = filename.replace(/\.json$/, ext);
    const formatFilepath = join(process.cwd(), formatFilename);
    writeFileSync(formatFilepath, formatted);
    console.log(`📄 Formatted output: ${formatFilename}`);

    if (['canvas', 'qti'].includes(options.format)) {
      const { CanvasFormatter } = await import('../../../teaching/formatters/canvas.js');
      const canvasFormatter = new CanvasFormatter({ debug: options.debug });

      // Pre-flight: validate Canvas compatibility of generated JSON
      const { errors: preflightErrors, warnings: preflightWarnings } =
        runCanvasPreflightValidation(exam.content.questions, exam.content.answer_key);

      preflightWarnings.forEach(w => console.log(`   ⚠️  ${w}`));

      if (preflightErrors.length > 0) {
        console.log(`\n⚠️  Canvas compatibility issues in generated exam:`);
        preflightErrors.forEach(e => console.log(`   - ${e}`));
        console.log('   Consider adding more specific --instructions for correct answers.');
      }

      try {
        const qtiPath = await canvasFormatter.format(exam.content, {
          output: join(process.cwd(), formatFilename.replace(ext, '.qti.zip')),
          sourceDir: process.cwd()
        });
        console.log(`📦 Canvas QTI package: ${basename(qtiPath)}`);

        // Auto-validate the output
        const validation = await canvasFormatter.validateQTI(qtiPath);
        if (validation.valid) {
          console.log(`   ✅ QTI validated — ready to import`);
        } else {
          console.log(`   ⚠️  QTI validation issues (${validation.errors.length}):`);
          validation.errors.slice(0, 3).forEach(e => console.log(`      - ${e}`));
          if (validation.errors.length > 3) {
            console.log(`      ... and ${validation.errors.length - 3} more (use --debug)`);
          }
        }
        console.log(`\n💡 Import: Canvas Settings → Import Course Content → QTI .zip`);
      } catch (err) {
        console.log(`⚠️ Canvas QTI export failed: ${err.message}`);
        console.log('   Install examark: npm install -g examark');
      }
    }
  }

  console.log(`\n✅ Exam generated successfully!`);
  console.log(`📁 File: ${filename}`);
  console.log(`\n📊 Exam Statistics:`);
  console.log(`  Type: ${exam.content.exam_type}`);
  console.log(`  Questions: ${exam.metadata.questionCount}`);
  console.log(`  Total Points: ${exam.metadata.totalPoints}`);
  console.log(`  Duration: ${exam.metadata.duration} minutes`);
  console.log(`  Tokens Used: ${exam.metadata.tokens}`);

  // Show question breakdown
  const questionTypes = {};
  exam.content.questions.forEach(q => {
    questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
  });

  console.log(`\n📝 Question Types:`);
  Object.entries(questionTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Show validation results
  if (exam.validation.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${exam.validation.warnings.length}`);
    exam.validation.warnings.forEach(w => console.log(`  - ${w}`));
  }

  // Show sample questions
  console.log(`\n📋 Sample Questions:`);
  exam.content.questions.slice(0, 3).forEach(q => {
    const preview = q.text.length > 60 ? q.text.substring(0, 60) + '...' : q.text;
    console.log(`  ${q.id} [${q.type}]: ${preview}`);
  });
}

// Helper to parse command line arguments
function parseArgs(input) {
  // Tokenize respecting quoted strings (same as canvas.md)
  const parts = [...input.matchAll(/"([^"]+)"|'([^']+)'|(\S+)/g)]
    .map(m => m[1] || m[2] || m[3]);

  const args = { _: [] };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith('--')) {
      const key = part.substring(2);
      const next = parts[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (part === '-i') {
      const next = parts[i + 1];
      if (next && !next.startsWith('-')) {
        args.instructions = next;
        i++;
      }
    } else if (!part.startsWith('/')) {
      args._.push(part);
    }
  }

  return args;
}
```

## Configuration

The exam generator uses course configuration from `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
    instructor:
      name: "Dr. Jane Smith"

  defaults:
    exam_format: "markdown"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"

  style:
    tone: "formal"
    notation: "statistical"
    examples: true

  ai_generation:
    model: "claude-3-5-sonnet-20241022"
    temperature: 0.7
    max_tokens: 4096
    api_key: "sk-..."  # Optional, uses ANTHROPIC_API_KEY env var if not set
```

## Quality Assurance

Every generated exam is:
1. ✅ Validated against JSON Schema
2. ✅ Checked for LaTeX syntax errors
3. ✅ Verified for completeness (answer keys, options, rubrics)
4. ✅ Tested for proper question ID mapping

## Error Handling

If generation fails:
- Check that ANTHROPIC_API_KEY is set
- Verify course configuration exists (or will use defaults)
- Review validation errors if content is rejected
- Use `--debug` flag for detailed logging

## Follow-up Actions

After generating, you can:
- Review the JSON file and customize questions
- Generate variations with `--variations` flag
- Export to PDF/LaTeX using conversion tools
- Import into LMS (Canvas, Blackboard, etc.)
- Create study guide from exam topics
</system>
