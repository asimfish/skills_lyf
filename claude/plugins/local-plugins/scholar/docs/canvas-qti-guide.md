# Canvas QTI Pipeline Guide

Complete guide to exporting exams, quizzes, and assignments from Scholar to Canvas LMS via QTI packages.

## Overview

The Canvas QTI pipeline converts Scholar's exam JSON format into Canvas-importable QTI 1.2 zip packages using [examark](https://github.com/Data-Wise/examark) as the conversion engine.

```
.qmd → QMD Parser → JSON → ExamarkFormatter → examark MD → examark CLI → .qti.zip
```

## Supported Question Types

| QMD Type | Examark Tag | Canvas Type | Notes |
|----------|------------|-------------|-------|
| `multiple-choice` | `[MC]` | Multiple Choice | Single correct answer |
| `multiple-answer` | `[MA]` | Multiple Answers | Multiple correct answers with `[x]` markers |
| `true-false` | `[TF]` | True/False | Two options: True, False |
| `short-answer` | `[Short]` | Short Answer | Free-text response |
| `numerical` | `[Numeric]` | Numerical Answer | Numeric value expected |
| `essay` | `[Essay]` | Essay | Long-form response |
| `matching` | `[Match]` | Matching | Pairs with `=` separator |
| `fill-in-multiple-blanks` | `[FMB]` | Fill in Multiple Blanks | Uses `[blank1]`, `[blank2]` markers |
| `fill-in-blank` | `[FIB]` | Fill in the Blank | Maps to examark Short Answer internally |
| `file-upload` | `[Essay]` | Essay (degraded) | See [Upload limitation](#upload-questions) |

## Question Sections

QMD exams with multiple H1 sections are mapped to Canvas question groups:

```markdown
# Part 1: Fundamentals

## Question 1 [10 pts]
What is the mean?

## Question 2 [5 pts]
Is variance always positive?

# Part 2: Application

## Question 3 [15 pts]
Analyze the dataset...
```

In Canvas, "Part 1: Fundamentals" and "Part 2: Analysis" become separate question groups, which can be individually configured for randomization and point weighting.

**Note:** A single H1 heading is treated as the exam title, not a section. Section headers are only emitted when 2+ H1 sections exist.

## Image Support

Images referenced in QMD questions are bundled into the QTI zip:

```markdown
## Question 1 [10 pts]

![scatter plot](images/scatter.png)

Describe the relationship shown in the scatter plot above.
```

When using the `CanvasFormatter` programmatically, pass `sourceDir` to resolve relative image paths:

```javascript
const result = await canvasFormatter.format(exam, {
  output: 'exam.qti.zip',
  sourceDir: '/path/to/qmd/directory'
});
```

The `sourceDir` sets the working directory for examark, enabling it to find and bundle images referenced with relative paths.

## Verify Tolerance

`examark verify` validates QTI package structure but exits non-zero for open-ended questions (Essay, Short, Numeric) that lack machine-gradable correct answers. This is expected behavior.

The `CanvasFormatter.validateQTI()` method separates these expected warnings from real structural errors:

- **Warnings** (valid): "No correct answer defined" for Essay/Short/Numeric questions
- **Errors** (invalid): Structural issues like invalid XML, missing metadata

```javascript
const result = await formatter.validateQTI('exam.qti.zip');
// result.valid = true (even with "no correct answer" warnings)
// result.warnings = ["- Question 4: No correct answer defined", ...]
// result.errors = [] (empty when only warnings present)
```

## Known Limitations

### Upload Questions

examark does not support `[Upload]` questions and silently drops them, producing 0 QTI items. Scholar maps Upload questions to Essay with a note:

- The `[Upload]` tag becomes `[Essay]` in examark output
- A note is prepended: *"This question originally required a file upload..."*
- A warning is emitted via `formatter.warnings`

### FIB → Short Answer

`[FIB]` (Fill-in-Blank) maps to examark's Short Answer internally. The question appears correctly in Canvas but uses short-answer grading rather than fill-in-blank matching.

### Sub-Part Points

When multi-part questions (e.g., `**(a)** ... **(b)** ...`) lack explicit point values, parent points are divided equally among sub-parts. For example, a 30-point question with 3 sub-parts gives each sub-part 10 points.

## Pre-flight Validation

Before converting, `/teaching:canvas` automatically validates all questions for Canvas LMS compatibility. This catches issues that would cause silent failures or miscounted scores after import.

### What is checked

| Question Type | Check | Severity |
|--------------|-------|----------|
| `multiple-choice`, `true-false` | Has exactly one correct answer in `answer_key` | Error — blocks conversion |
| `multiple-answers` | Has 2+ correct answers | Error — blocks conversion |
| `fill-in-multiple-blanks` | All blank IDs have defined answers | Error — blocks conversion |
| `short-answer`, `fill-in-blank` | Has at least one sample answer | Warning — proceeds, manually graded |

### Sample output

```
🔍 Pre-flight Canvas validation...
   WARNING: Q3 [Short]: no sample answer — will be manually graded in Canvas
   ✅ All other questions valid for Canvas import
```

If blocking errors exist, conversion is aborted with a diagnostic message:

```
❌ Pre-flight errors (fix before converting):
   - Q4 [MC]: no correct answer marked
   - Q7 [MA]: 1 correct answer(s) — Canvas requires 2+

Fix these issues and re-run /teaching:canvas.
```

### Note on emulate-canvas

`examark emulate-canvas` (the `--emulate` flag) may exit non-zero for essay/short-answer questions with no predefined correct answer — this is expected. Canvas handles manually-graded questions without predefined answers. Use `examark verify` (`--validate`) as the reliable structural correctness check.

## Usage

### CLI

```bash
/teaching:canvas midterm.qmd
/teaching:canvas midterm.qmd --output midterm.qti.zip
/teaching:canvas midterm.qmd --validate --emulate
/teaching:canvas midterm.qmd --dry-run
```

### Via Other Commands

```bash
/teaching:exam --format canvas
/teaching:quiz --format canvas
/teaching:assignment --format canvas
```

### Programmatic

```javascript
import { CanvasFormatter } from 'scholar/formatters/canvas.js';
import { parseExamFile } from 'scholar/parsers/qmd-exam.js';

const exam = parseExamFile('midterm.qmd');
const formatter = new CanvasFormatter();
const qtiPath = await formatter.format(exam, {
  output: 'midterm.qti.zip',
  validate: true,
  sourceDir: '/path/to/source'
});
```

## Requirements

- [examark](https://github.com/Data-Wise/examark) v0.6.6+ (`npm install -g examark`)
- Node.js >= 20.19.0
