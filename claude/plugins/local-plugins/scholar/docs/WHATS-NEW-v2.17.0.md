# What's New in v2.17.0

**Release:** v2.17.0 (in progress — feature/canvas-enhancements)
**Theme:** Canvas QTI reliability and exam command bug fixes

---

## Bug Fixes

### parseArgs: Quoted Argument Handling (exam.md)

**Problem:** `/teaching:exam --topics "linear regression, ANOVA"` was broken. The argument parser used `split(/\s+/)` which split the quoted string into 4 broken tokens.

**Fix:** Replaced with a regex tokenizer that respects quoted strings — the same pattern canvas.md already used correctly:

```bash
# Now works correctly:
/teaching:exam midterm --topics "linear regression, ANOVA, hypothesis testing"
/teaching:exam practice --topics "multiple regression" --difficulty hard
```

### --send Removed from exam.md and quiz.md

**Problem:** The `--send` flag in `/teaching:exam` and `/teaching:quiz` contained a syntax error (static ES module imports inside a conditional block) that caused a crash whenever `--send` was used. Additionally, output variables were scoped to the wrong branch.

**Fix:** Removed `--send` from exam.md and quiz.md. The flag never worked correctly in these commands. Email delivery for exams and quizzes can be done manually or via himalaya CLI.

`--send` **remains supported** on:
- `/teaching:solution` — send solution keys to TAs
- `/teaching:assignment` — send assignments for review
- `/teaching:rubric` — send rubrics to graders

---

## New Features

### Pre-flight Canvas Validation (/teaching:canvas)

Before invoking examark, `/teaching:canvas` now runs a pre-flight check that validates Canvas-specific requirements:

```
Parsing: midterm.qmd
   Title: Statistics Midterm
   Questions: 18
   Types: MC(10), TF(3), Short(4), Essay(1)

Running pre-flight validation...
   ✅ All questions valid for Canvas import
```

Blocking errors (exit 1 before conversion):
- MA questions with fewer than 2 correct answers
- Short answer questions with no acceptable answers
- MC/TF questions with no correct answer marked
- FMB blanks with no defined answers

Warnings (non-blocking):
- MC questions with multiple correct answers

### = Syntax for Short Answer Generation

When `/teaching:exam` generates short answer questions with multiple acceptable answers, it now uses the `= answer` syntax:

```markdown
What is the term for increasing residual spread with fitted values? [2pts]
= heteroscedasticity
= heteroskedasticity
= non-constant variance
```

This is the examark standard added in March 2026, ensuring generated exams import cleanly into Canvas with all acceptable answers recognized.

---

## Improvements

### Tighter --format canvas Pipeline

`/teaching:exam --format canvas` now runs end-to-end:

1. Generate exam JSON
2. Pre-flight Canvas compatibility check on generated content
3. Run examark pipeline to produce `.qti.zip`
4. Auto-validate the QTI output
5. Show import confidence summary

```
Canvas QTI package: exam-final-1709500000.qti.zip
   ✅ QTI validated — ready to import

Import: Canvas Settings → Import Course Content → QTI .zip
```

### Canvas-Compatible Type Enforcement

When `--format canvas` or `--format qti`, the exam generator now constrains question types to Canvas-safe options: MC, TF, MA, Short Answer, Essay, Numerical. Matching and fill-in-multiple-blanks are excluded with a notice.

---

## Migration Guide

### If you used --send with exam or quiz

Replace:
```bash
/teaching:exam midterm --send ta@university.edu
```

With:
```bash
/teaching:exam midterm
# Then send the generated JSON file manually via email or:
himalaya send --to ta@university.edu --subject "Midterm Exam" --attach exam-midterm-*.json
```

### If --topics broke with multi-word topics

No action needed — the bug is fixed. Multi-word quoted topics now work:
```bash
/teaching:exam midterm --topics "linear regression, ANOVA"  # ✅ works in v2.17.0
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/plugin-api/commands/teaching/exam.md` | Fix parseArgs, remove --send, tighten canvas pipeline |
| `src/plugin-api/commands/teaching/quiz.md` | Remove --send (static import crash) |
| `src/plugin-api/commands/teaching/canvas.md` | Add pre-flight Canvas validation |
| `src/teaching/generators/exam.js` | = syntax for short answer, Canvas type enforcement |

---

## Related

- [SPEC: Scholar Canvas Enhancements](specs/SPEC-scholar-canvas-enhancements-2026-03-04.md)
- [ADR-011: Remove --send from exam/quiz](internal/decision-log.md#adr-011-remove---send-from-exammd-and-quizmd)
- [ADR-012: parseArgs Regex Tokenizer](internal/decision-log.md#adr-012-parseargs-regex-tokenizer-as-standard)
- [ADR-013: Pre-flight Canvas Validation](internal/decision-log.md#adr-013-pre-flight-canvas-validation-before-conversion)
- [Email Integration Guide](tutorials/teaching/email-integration.md)
