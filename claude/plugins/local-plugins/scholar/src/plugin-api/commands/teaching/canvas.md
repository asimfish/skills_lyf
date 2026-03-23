---
name: canvas
description: Convert QMD exam files to Canvas LMS QTI format via examark
---

# Convert to Canvas QTI

Convert Quarto/Markdown exam files (`.qmd` / `.md`) to Canvas LMS import packages (`.qti.zip`) using examark.

**Usage:**
```
/teaching:canvas <input-file> [options]
```

**Examples:**
```
/teaching:canvas midterm.qmd
/teaching:canvas midterm.qmd --output midterm.qti.zip
/teaching:canvas midterm.qmd --dry-run
/teaching:canvas midterm.qmd --intermediate
/teaching:canvas midterm.qmd --validate --emulate
/teaching:canvas midterm.qmd --split-parts false
/teaching:canvas midterm.qmd --default-type Short
```

**Options:**
- `--output PATH` / `-o PATH` - Output file path (default: `<input>.qti.zip`)
- `--dry-run` - Parse and show detected questions without converting
- `--intermediate` - Keep the intermediate examark `.md` file
- `--validate` - Run `examark verify` on the generated QTI package
- `--emulate` - Run `examark emulate-canvas` to simulate Canvas import
- `--split-parts` - Split multi-part questions into separate items (default: true)
- `--default-type TYPE` - Fallback question type: MC, TF, Short, Essay, etc. (default: Essay)
- `--config PATH` - Explicit config file path
- `--debug` - Enable debug logging

**Pipeline:**
```
.qmd → parse → detect types → examark MD → examark CLI → .qti.zip
```

**Supported Question Types:**
- Multiple Choice (`[MC]`) — lettered options with single correct answer
- Multiple Answer (`[MA]`) — multiple correct answers
- True/False (`[TF]`) — binary choice
- Short Answer (`[Short]`) — text input
- Numeric (`[Numeric]`) — numerical answer
- Essay (`[Essay]`) — long-form response
- Matching (`[Match]`) — pair left/right items
- Fill-in-Multiple-Blanks (`[FMB]`) — multiple blank placeholders

**Input Format:**
Standard exam QMD files with `##` question headings, point values, and answer markers:

```markdown
## Question 1 [10 pts]

What is the mean of {2, 4, 6}?

a) 3
b) 4 [x]
c) 5
```

**Output:**
- `.qti.zip` — Canvas-ready import package
- Optional `.md` intermediate — examark-format markdown (with `--intermediate`)

<system>
This command converts QMD exam files to Canvas QTI packages.

## Implementation

```javascript
import { parseExamContent, parseExamFile } from '../../../teaching/parsers/qmd-exam.js';
import { ExamarkFormatter } from '../../../teaching/formatters/examark.js';
import { CanvasFormatter } from '../../../teaching/formatters/canvas.js';
import { runCanvasPreflightValidation } from '../../../teaching/validators/canvas-preflight.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename, dirname, resolve } from 'path';

// Parse user input
const args = parseArgs(userInput);

const inputFile = args._[0];

if (!inputFile) {
  console.log('Usage: /teaching:canvas <input-file> [options]');
  console.log('');
  console.log('Convert a QMD/MD exam file to Canvas QTI format.');
  console.log('');
  console.log('Example: /teaching:canvas midterm.qmd');
  process.exit(1);
}

const inputPath = resolve(process.cwd(), inputFile);

if (!existsSync(inputPath)) {
  console.log(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

const options = {
  output: args.output || args.o || null,
  dryRun: args['dry-run'] || false,
  intermediate: args.intermediate || false,
  validate: args.validate || false,
  emulate: args.emulate || false,
  splitParts: args['split-parts'] !== 'false' && args['split-parts'] !== false,
  defaultType: args['default-type'] || 'Essay',
  configPath: args.config || null,
  debug: args.debug || false
};

// ─── Step 1: Parse QMD ───
console.log(`📄 Parsing: ${basename(inputPath)}`);

const content = readFileSync(inputPath, 'utf-8');
const exam = parseExamContent(content, {
  splitParts: options.splitParts,
  defaultType: options.defaultType
});

console.log(`   Title: ${exam.title}`);
console.log(`   Questions: ${exam.questions.length}`);
console.log(`   Total points: ${exam.total_points}`);

// Show question breakdown
const typeCount = {};
exam.questions.forEach(q => {
  typeCount[q.type] = (typeCount[q.type] || 0) + 1;
});
console.log(`   Types: ${Object.entries(typeCount).map(([t, c]) => `${t}(${c})`).join(', ')}`);

// ─── Step 1.5: Pre-flight Canvas Validation ───
if (!options.dryRun) {
  console.log('\n🔍 Pre-flight Canvas validation...');

  const { errors: preflightErrors, warnings: preflightWarnings } =
    runCanvasPreflightValidation(exam.questions, exam.answer_key);

  preflightWarnings.forEach(w => console.log(`   ⚠️  ${w}`));

  if (preflightErrors.length > 0) {
    console.log('❌ Pre-flight errors (fix before converting):');
    preflightErrors.forEach(e => console.log(`   - ${e}`));
    console.log('\nFix these issues and re-run /teaching:canvas.');
    process.exit(1);
  }

  if (preflightErrors.length === 0 && preflightWarnings.length === 0) {
    console.log('   ✅ All questions valid for Canvas import');
  }
}

// ─── Dry Run: Show parsed questions and exit ───
if (options.dryRun) {
  console.log('\n--- DRY RUN: Parsed Questions ---\n');
  exam.questions.forEach((q, i) => {
    const preview = q.text.length > 80 ? q.text.substring(0, 80) + '...' : q.text;
    console.log(`${i + 1}. [${q.type}] ${preview} [${q.points}pts]`);
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, j) => {
        const letter = String.fromCharCode(97 + j);
        const correct = exam.answer_key[q.id];
        const isCorrect = correct === String.fromCharCode(65 + j);
        console.log(`   ${letter}) ${opt}${isCorrect ? ' ✓' : ''}`);
      });
    }
  });
  console.log('\n--- End Dry Run ---');
  console.log('Remove --dry-run to convert to QTI.');
  process.exit(0);
}

// ─── Step 2: Format as examark markdown ───
console.log('\n🔄 Converting to examark format...');

const examarkFormatter = new ExamarkFormatter();
const examarkMd = examarkFormatter.format(exam, {
  includeFrontmatter: false,
  includeAnswers: true
});

// Validate examark output
const mdValidation = examarkFormatter.validate(examarkMd);
if (!mdValidation.valid) {
  console.log('⚠️ Examark format validation warnings:');
  mdValidation.errors.forEach(e => console.log(`   - ${e}`));
}

// ─── Step 3: Write intermediate file (if requested) ───
const inputDir = dirname(inputPath);
const baseName = basename(inputPath).replace(/\.(qmd|md)$/, '');
const mdOutputPath = join(inputDir, `${baseName}.examark.md`);

if (options.intermediate) {
  writeFileSync(mdOutputPath, examarkMd, 'utf-8');
  console.log(`📝 Intermediate: ${basename(mdOutputPath)}`);
}

// ─── Step 4: Convert to QTI via examark CLI ───
console.log('📦 Running examark CLI...');

const qtiOutputPath = options.output
  ? resolve(process.cwd(), options.output)
  : join(inputDir, `${baseName}.qti.zip`);

const canvasFormatter = new CanvasFormatter({ debug: options.debug });

try {
  const qtiPath = await canvasFormatter.format(exam, {
    output: qtiOutputPath,
    validate: false,  // We validate separately below
    cleanupTemp: !options.intermediate
  });

  console.log(`✅ QTI package created: ${basename(qtiPath)}`);

  // ─── Step 5: Validate (if requested) ───
  if (options.validate) {
    console.log('\n🔍 Validating QTI package...');
    const validation = await canvasFormatter.validateQTI(qtiPath);
    if (validation.valid) {
      console.log('   ✅ QTI package is valid');
    } else {
      console.log('   ⚠️ Validation issues:');
      validation.errors.forEach(e => console.log(`   - ${e}`));
    }
    if (validation.output && options.debug) {
      console.log(validation.output);
    }
  }

  // ─── Step 6: Emulate Canvas import (if requested) ───
  if (options.emulate) {
    console.log('\n🖥️ Simulating Canvas import...');
    const emulation = await canvasFormatter.emulateCanvasImport(qtiPath);
    if (emulation.success) {
      console.log('   ✅ Canvas import simulation passed');
    } else {
      console.log('   ⚠️ Import simulation issues:');
      console.log(`   ${emulation.error || emulation.output}`);
    }
    if (emulation.output && options.debug) {
      console.log(emulation.output);
    }
  }

  // ─── Summary ───
  console.log('\n📊 Conversion Summary:');
  console.log(`   Input: ${basename(inputPath)}`);
  console.log(`   Output: ${basename(qtiPath)}`);
  console.log(`   Questions: ${exam.questions.length}`);
  console.log(`   Points: ${exam.total_points}`);
  if (options.intermediate) {
    console.log(`   Intermediate: ${basename(mdOutputPath)}`);
  }
  console.log('\n💡 Import into Canvas: Settings → Import Course Content → QTI .zip');

} catch (err) {
  console.log(`\n❌ Conversion failed: ${err.message}`);
  if (err.message.includes('examark not installed')) {
    console.log('   Install: npm install -g examark');
    console.log('   Or: brew tap data-wise/tap && brew install examark');
  }
  if (options.debug) {
    console.error(err);
  }
  // Still save intermediate if requested
  if (options.intermediate && !existsSync(mdOutputPath)) {
    writeFileSync(mdOutputPath, examarkMd, 'utf-8');
    console.log(`\n📝 Intermediate file saved: ${basename(mdOutputPath)}`);
    console.log('   You can run examark manually on this file.');
  }
}

// Helper to parse command line arguments (supports quoted strings with spaces)
function parseArgs(input) {
  // Tokenize respecting quoted strings
  const parts = [];
  const pattern = /"([^"]+)"|'([^']+)'|(\S+)/g;
  let match;
  while ((match = pattern.exec(input)) !== null) {
    parts.push(match[1] || match[2] || match[3]);
  }

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
    } else if (part === '-o') {
      const next = parts[i + 1];
      if (next && !next.startsWith('-')) {
        args.o = next;
        i++;
      }
    } else if (!part.startsWith('/')) {
      args._.push(part);
    }
  }

  return args;
}
```

## Error Handling

- **File not found**: Clear message with path
- **No questions detected**: Show what was parsed, suggest checking QMD structure
- **examark not installed**: Show install instructions (npm + homebrew)
- **examark conversion fails**: Save intermediate `.md` so user can debug manually
- **Validation warnings**: Show but don't block (non-fatal)

## Follow-up Actions

After converting, offer to:
- Validate the QTI package: `examark verify <file>.qti.zip`
- Simulate Canvas import: `examark emulate-canvas <file>.qti.zip`
- Edit the intermediate markdown and re-convert
- Generate more exams with `/teaching:exam --format canvas`

## Related Commands

- `/teaching:exam` - Generate exams (with `--format canvas` for QTI output)
- `/teaching:quiz` - Generate quizzes (with `--format canvas` for QTI output)
</system>
