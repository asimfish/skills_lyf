# BRAINSTORM: Scholar Command Enhancements

**Mode:** feature | **Depth:** deep | **Date:** 2026-03-04
**From:** Bugs found in code review + lessons from examark QTI fixes

---

## Context: What We Found

During a code review of scholar's `/teaching:exam` and `/teaching:canvas` commands (post-examark bugfix session), three real bugs were identified plus architectural improvement opportunities.

### Confirmed Bugs (exam.md)

1. **Static import syntax error** — Lines 310-311 use `import { ... } from '...'` inside an `if (options.send)` block. ES modules require `await import()` in dynamic contexts. This crashes on any `--send` usage.

2. **Scoped variable access bug** — `exam` and `filepath` variables are defined only inside the `else` branch (no `--variations`), but the `--send` block accesses them unconditionally. Null pointer crash when `--variations` is used.

3. **parseArgs breaks quoted strings** — `input.split(/\s+/)` splits on every space. `--topics "linear regression, hypothesis testing"` becomes broken tokens.

### Same Bugs in quiz.md

`quiz.md` has identical static import bug (lines 344-345) and the same `parseArgs` pattern.

### Lessons from Examark

- Canvas import requires specific QTI structure (rcardinality, MA resprocessing, varequal encoding)
- Pre-conversion validation catches errors before wasted conversion
- Multiple acceptable short answers use `= answer` syntax (cleaner than repeated `Answer: text`)
- XML validity is non-negotiable — malformed content silently truncates Canvas import

---

## User Priorities (from 8-question deep dive)

| Priority | Answer |
|----------|--------|
| parseArgs fix | **Critical** — multi-word topics used constantly |
| --send flag | **Remove from exam.md** — canvas handles delivery |
| Canvas pipeline | **Pre-flight validation** before conversion |
| Command architecture | **Tighter** — exam --format canvas should be end-to-end |
| Short answer format | **= syntax** for multiple answers (new standard) |
| Scope | **exam.md primary**, canvas.md gets pre-flight |
| Question quality | **Enforce Canvas-compatible types** in generation |
| Release | **v2.17.0 minor** — bugs + Canvas enhancements |

---

## Quick Wins (under 30 min each)

### 1. Fix parseArgs in exam.md

Replace `split(/\s+/)` with the same regex tokenizer that `canvas.md` already uses correctly.

**canvas.md approach (proven):**
```
Tokenize with: /"([^"]+)"|'([^']+)'|(\S+)/g
```

This handles: `--topics "linear regression, hypothesis testing"` correctly.

**Impact:** Multi-word quoted topics work. This is user-reported as critical.

### 2. Remove --send from exam.md

Remove the `--send` option from:
- Options documentation block
- `options.send` assignment in the options object
- The entire `// Email Sending (--send flag)` block at the bottom
- The `send: args.send || false` line

**Impact:** Eliminates the static import crash. Canvas/email delivery is a separate concern from exam generation.

### 3. Remove --send from quiz.md (same bug, trivial fix)

Same static import pattern on lines 344-345. Remove the entire email sending block.

---

## Medium Effort (1-3 hours each)

### 4. Add Pre-flight Validation to /teaching:canvas

Before invoking examark, run `examark check` on the input file as Step 0.5.

**Canvas-specific checks:**
- Every MC/TF question has exactly one correct answer
- MA questions have 2+ correct answers
- Short answer questions have 1+ acceptable answer
- FMB blanks all have defined answers
- No unsupported question type patterns

**User experience:**
```
🔍 Running pre-flight validation...
❌ Pre-flight errors (fix before converting):
   - Q3 [MA]: Only 1 correct answer found (need 2+)
   - Q7 [Short]: No acceptable answers defined
```

**Impact:** Surface Canvas import errors BEFORE running examark, not after upload.

### 5. Tighten /teaching:exam --format canvas Pipeline

Currently: generate JSON → loose format routing → QTI (error-prone)

When `--format canvas` or `--format qti`:
1. Generate exam JSON normally
2. **Validate generated JSON for Canvas compatibility**
3. If issues found: warn user, optionally regenerate with stricter constraints
4. Run examark pipeline end-to-end
5. Auto-validate the QTI output
6. Show summary with QTI path

**Impact:** `/teaching:exam final --format canvas` becomes a single end-to-end command.

### 6. Canvas-Compatible Question Type Enforcement

Add Canvas compatibility mode when `--format canvas`:
- Only generate types: MC, TF, MA, Short Answer, Essay, Numerical
- Avoid: Matching and FMB (complex Canvas behavior, prone to import failures)
- Enforce: MC has exactly 4 options, one correct
- Enforce: MA has 4 options, 2-4 correct

**Impact:** Eliminates the most common "couldn't determine correct answers" errors.

### 7. Generate Short Answers with = Syntax

When the exam generator creates short answer questions with multiple acceptable answers, output in `= answer` format:

```markdown
Q12. [Short, 2pts]
What is the term for increasing residual spread?

= heteroscedasticity
= heteroskedasticity
= non-constant variance
```

This is now the standard syntax in examark (added Mar 2026).

---

## Long-term (Future sessions)

### 8. Shared parseArgs Utility

Extract the robust quote-aware tokenizer from canvas.md into:
```
src/teaching/utils/args.js
```
Apply consistently to: exam.md, quiz.md, slides.md, assignment.md, lecture.md

### 9. QTI Quality Score

After conversion, show a Canvas import confidence score:
```
Canvas Import Confidence: 94/100
  MC questions: fully compatible (8/8)
  TF questions: fully compatible (3/3)
  MA questions: 1 may have grading issues
  Short answer: 4 with multiple accepted answers
```

### 10. Canvas Validate Command Enhancement

Extend `/teaching:canvas --validate` to output structured per-question report with fix suggestions, not just pass/fail.

---

## Recommended Implementation Order

```
Phase 1 (Bug Fixes) — v2.17.0
  Feature Branch: feature/canvas-enhancements

  1. Fix parseArgs in exam.md (quoted string tokenizer)
  2. Remove --send from exam.md
  3. Remove --send from quiz.md

Phase 2 (Canvas Enhancements) — v2.17.0 (same branch)

  4. Add pre-flight validation to /teaching:canvas
  5. Tighten /teaching:exam --format canvas pipeline
  6. Canvas-compatible type enforcement
  7. = syntax for short answer generation

Phase 3 (Future) — v2.18.0+

  8. Shared parseArgs utility
  9. QTI quality score
 10. Enhanced canvas validate report
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/plugin-api/commands/teaching/exam.md` | Fix parseArgs, remove --send, tighten canvas pipeline |
| `src/plugin-api/commands/teaching/quiz.md` | Remove --send (static import bug) |
| `src/plugin-api/commands/teaching/canvas.md` | Add pre-flight validation step |
| `src/teaching/generators/exam.js` | Canvas type enforcement, = syntax generation |
| `src/teaching/formatters/canvas.js` | Pre-flight validation method |

---

## Metrics for Success

- `--topics "multiple regression, ANOVA"` parses correctly
- `/teaching:exam final --format canvas` runs end-to-end without two commands
- Canvas import succeeds on first try
- Pre-flight catches errors before examark is invoked
