# SPEC: Scholar Canvas & Exam Command Enhancements

**Status:** draft
**Version Target:** v2.17.0
**Created:** 2026-03-04
**From Brainstorm:** BRAINSTORM-scholar-command-enhancements-2026-03-04.md

---

## Overview

Three confirmed bugs exist in `/teaching:exam` (and `/teaching:quiz`): a static import syntax error that crashes `--send`, a scoped variable access bug, and a `parseArgs` tokenizer that breaks quoted strings. These are combined with Canvas integration enhancements (pre-flight validation, end-to-end pipeline, Canvas-compatible question types, `= syntax` for short answers) into a single v2.17.0 minor release.

---

## Primary User Story

**As a** statistics instructor using Canvas LMS,
**I want** `/teaching:exam final --topics "linear regression, hypothesis testing" --format canvas` to generate a Canvas-ready QTI package in a single command,
**So that** I can go from AI-generated exam to Canvas import without debugging QTI errors or running two separate commands.

---

## Acceptance Criteria

- [ ] `--topics "linear regression, hypothesis testing"` parses as one topic string (not 4 broken tokens)
- [ ] `/teaching:exam` with `--format canvas` runs end-to-end: generate → validate → QTI without a second command
- [ ] `/teaching:canvas` shows pre-flight validation errors before invoking examark
- [ ] `--send` flag is removed from exam.md (no static import crash)
- [ ] `--send` static import bug is fixed in quiz.md
- [ ] Generated short answer questions with multiple acceptable answers use `= answer` syntax
- [ ] Canvas-incompatible question types (Matching, FMB) are excluded when `--format canvas`

---

## Secondary User Stories

- **As a** teaching assistant, I want to see exactly which questions will fail Canvas import before running the conversion, so I don't waste time uploading broken QTI packages.
- **As a** power user, I want `/teaching:quiz` to also benefit from these fixes even though it's not the primary focus.

---

## Architecture

```
User: /teaching:exam final --topics "linear regression" --format canvas

         parseArgs() [FIXED: regex tokenizer]
              │
              ▼
         generateExam(options)
              │ generates JSON
              ▼
         validateForCanvas(exam.content) [NEW]
              │ checks types, correct answers, MA cardinality
              ▼
         canvasFormatter.format(exam.content, ...)
              │ runs examark pipeline
              ▼
         canvasFormatter.validateQTI(qtiPath) [already exists]
              │
              ▼
         Output: exam.qti.zip + validation summary
```

```
User: /teaching:canvas midterm.qmd

         parseExamContent(content)
              │
              ▼  [NEW Step 0.5]
         examark check (pre-flight validation)
              │ errors → exit; warnings → continue
              ▼
         examarkFormatter.format(exam)
              │
              ▼
         canvasFormatter.format(exam, options)
              │
              ▼
         Output: midterm.qti.zip
```

---

## API Design

### Pre-flight Validation (new method)

N/A — No external API changes. Internal method on `CanvasFormatter`.

```javascript
// Internal interface
validateForCanvas(examContent: ExamContent): {
  errors: string[];    // Blocking — abort conversion
  warnings: string[];  // Non-blocking — warn and continue
  compatible: boolean;
}
```

---

## Data Models

No new data models. Changes are to command logic and generator output format.

### Changed: Short Answer Generation

Generator output changes when multiple acceptable answers exist:

**Before (inline syntax):**
```markdown
Answer: heteroscedasticity
Answer: heteroskedasticity
```

**After (= syntax, new standard):**
```markdown
= heteroscedasticity
= heteroskedasticity
= non-constant variance
```

---

## Dependencies

- `examark` (npm) — already required for canvas format
- No new dependencies

---

## UI/UX Specifications

### Pre-flight Output (canvas.md)

```
Parsing: midterm.qmd
   Title: Midterm Exam
   Questions: 18
   Types: MC(10), TF(3), Short(4), Essay(1)

Running pre-flight validation...
   Errors (must fix):
   - Q3 [MA]: Only 1 correct answer (Canvas requires 2+)
   - Q7 [Short]: No acceptable answers defined

Fix these issues and re-run /teaching:canvas.
```

### End-to-end Canvas Output (exam.md)

```
Generating final exam...
  15 questions, 60 minutes

Canvas compatibility check...
  Enforcing Canvas-safe types: MC, TF, MA, Short, Essay
  Skipping: Matching, FMB (use classic format for these)

QTI package created: exam-final-1709500000.qti.zip
  Validation: 15/15 questions valid
  Canvas import confidence: 100%

Import: Canvas Settings → Import Course Content → QTI .zip
```

### Accessibility Checklist

- N/A — CLI output, no UI components

---

## Open Questions

1. Should quiz.md also get the full Canvas pipeline tightening (not just --send removal), or just the bug fix?
2. When Canvas type enforcement drops Matching/FMB questions, should the exam generator note this in output so the user knows their prompt was partially ignored?
3. Should `= syntax` be the default for ALL short answer generation (even single answers), or only when 2+ acceptable answers are expected?

---

## Review Checklist

- [ ] parseArgs fix tested with: `--topics "multi word topic"`, `--topics "a, b, c"`, edge case: `--topics "it's complex"`
- [ ] exam.md: no `--send` references remain in docs or implementation
- [ ] quiz.md: static import block removed, no regressions
- [ ] canvas.md: pre-flight runs before examark, exit code 1 on blocking errors
- [ ] `--format canvas` pipeline: generates QTI and auto-validates
- [ ] Canvas type enforcement: MC, TF, MA, Short, Essay, Numerical allowed; Matching, FMB warned/excluded
- [ ] Short answer = syntax: 2+ acceptable answers use multi-line format
- [ ] All tests pass (currently ~3,302)
- [ ] CHANGELOG updated with v2.17.0 entry

---

## Implementation Notes

### parseArgs Fix

The fix is well-established — `canvas.md` already uses it correctly. Copy the regex tokenizer pattern:

```
Pattern: /"([^"]+)"|'([^']+)'|(\S+)/g
Logic: match[1] || match[2] || match[3]
```

### Static Import Fix (exam.md and quiz.md)

The `--send` block uses ES static import syntax inside a conditional. This is invalid. Since the user decision is to **remove --send from exam.md**, the fix is deletion, not conversion to `await import()`.

For quiz.md, same decision: remove the `--send` block entirely.

### Canvas Pre-flight in canvas.md

Add between Step 1 (parse QMD) and Step 2 (format as examark markdown):

```javascript
// Step 1.5: Pre-flight validation
const preflightErrors = [];
exam.questions.forEach(q => {
  if (q.type === 'multiple_answers') {
    const correctCount = q.options.filter(o => o.isCorrect).length;
    if (correctCount < 2) {
      preflightErrors.push(`Q${q.id} [MA]: ${correctCount} correct answer (need 2+)`);
    }
  }
  if (q.type === 'short_answer' && q.options.filter(o => o.isCorrect).length === 0) {
    preflightErrors.push(`Q${q.id} [Short]: no acceptable answers`);
  }
});
if (preflightErrors.length > 0) {
  // show errors, exit 1
}
```

### Canvas Type Enforcement in exam.md

Add a `CANVAS_SAFE_TYPES` constant and filter the question generation prompt when `--format canvas`:

```
CANVAS_SAFE_TYPES = ['multiple-choice', 'true-false', 'multiple-answers', 'short-answer', 'essay', 'numerical']
```

Pass as a constraint to `generateExam()`. The AI prompt should note: "only use these question types."

### = Syntax Generation

In the exam generator, when building short answer questions with multiple acceptable answers:

```javascript
if (q.type === 'short_answer' && q.acceptableAnswers?.length > 1) {
  // Use = syntax
  return q.acceptableAnswers.map(a => `= ${a}`).join('\n');
} else {
  return `Answer: ${q.acceptableAnswers?.[0] || ''}`;
}
```

---

## History

| Date | Author | Change |
|------|--------|--------|
| 2026-03-04 | Claude Code | Initial draft from deep brainstorm session |
