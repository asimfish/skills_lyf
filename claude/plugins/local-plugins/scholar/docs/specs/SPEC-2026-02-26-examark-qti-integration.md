# SPEC: Examark/QTI Integration for Canvas LMS Export

**Status:** draft
**Priority:** medium
**Created:** 2026-02-26
**Source:** Brainstorm session (STAT 545 midterm prep workflow)
**From Brainstorm:** `/workflow:brainstorm m f s` — examark + QTI Canvas export

---

## Overview

Add Canvas LMS export capability to Scholar's teaching commands via Examark (Data-Wise/examark, v0.6.6). Two deliverables: (1) a standalone `/teaching:canvas` converter that transforms existing `.qmd` exams/quizzes into QTI packages, and (2) `--format canvas` flags on existing generation commands (`/teaching:exam`, `/teaching:quiz`, `/teaching:assignment`).

Examark is already installed (`/opt/homebrew/bin/examark`) and Scholar already has `CanvasFormatter` and `ExamarkFormatter` in `src/teaching/formatters/`. The formatters work for programmatic JSON pipelines but aren't exposed to end users or connected to existing `.qmd` content.

---

## Primary User Story

> As an instructor who authors exams in Quarto `.qmd` format, I want to convert them to Canvas-importable QTI packages so that I can administer the same exam digitally without re-typing questions in the Canvas quiz editor.

---

## Track 1: New `/teaching:canvas` Converter Command

### User Story

> As an instructor with existing `.qmd` exam files (e.g., `practice-midterm.qmd`), I want a single command to convert them to a `.qti.zip` file ready for Canvas import.

### Usage

```bash
# Basic conversion
/teaching:canvas assignments/practice-midterm.qmd

# With validation and Canvas import simulation
/teaching:canvas assignments/practice-midterm.qmd --validate --emulate

# Dry-run: show parsed questions without generating
/teaching:canvas assignments/practice-midterm.qmd --dry-run

# Output to specific path
/teaching:canvas assignments/practice-midterm.qmd --output canvas-export/midterm.qti.zip
```

### Conversion Pipeline

```
.qmd file
  │
  ├── 1. Parse: Extract questions from Quarto headings, parts, point values
  │     - # / ## headings → question boundaries
  │     - [N pts] → point values
  │     - **(a)**, **(b)** → sub-parts (each becomes a separate examark question)
  │     - LaTeX math preserved ($...$, $$...$$)
  │
  ├── 2. Map: Identify examark question types
  │     - Multi-part show-work → [Essay]
  │     - "Which of the following" + options → [MC]
  │     - True/False → [TF]
  │     - "Calculate" with single numeric answer → [Numeric]
  │     - Fill-in-blank → [FMB]
  │     - Default fallback → [Essay]
  │
  ├── 3. Generate: Write examark markdown (.md)
  │     - Numbered list format: `1. [MC] Question [2pts]`
  │     - Answer markers: `[x]` for correct
  │     - Feedback blocks from solutions (if present)
  │
  ├── 4. Convert: Run `examark <file>.md -o <file>.qti.zip`
  │
  ├── 5. Validate (optional): `examark verify <file>.qti.zip`
  │
  └── 6. Emulate (optional): `examark emulate-canvas <file>.qti.zip`
```

### Question Type Detection Heuristics

| Pattern in `.qmd` | Examark Type | Notes |
| --- | --- | --- |
| Lettered options (a/b/c/d) with one marked correct | `[MC]` | Look for `[x]`, bold, or `{.correct}` |
| Lettered options with multiple correct | `[MA]` | Multiple `[x]` markers |
| "True or False" / "T/F" in stem | `[TF]` | |
| "Calculate" / "Compute" + single numeric answer | `[Numeric]` | Extract tolerance from context |
| Matching pairs (left → right) | `[Match]` | |
| Blanks with `___` in text | `[FMB]` | |
| Multi-part with **(a)**, **(b)** sub-questions | Split → multiple questions | Each part becomes separate question |
| "Explain" / "Describe" / "Interpret" / "Discuss" | `[Essay]` | Default for open-ended |
| "Write the R code" / code block expected | `[Essay]` | Canvas essay supports code |
| No clear type detected | `[Essay]` | Safe fallback |

### Options

| Flag | Default | Description |
| --- | --- | --- |
| `--output PATH` | `<filename>.qti.zip` | Output path for QTI package |
| `--validate` | false | Run `examark verify` on generated QTI |
| `--emulate` | false | Run `examark emulate-canvas` to simulate import |
| `--intermediate` | false | Keep the intermediate `.md` file (for debugging) |
| `--dry-run` | false | Show parsed questions without generating |
| `--split-parts` | true | Split multi-part problems into separate questions |
| `--default-type TYPE` | `Essay` | Default question type when detection is ambiguous |
| `--config PATH` | auto | Explicit config file path |

### Acceptance Criteria

- [ ] Converts `assignments/practice-midterm.qmd` to a valid `.qti.zip`
- [ ] `examark verify` passes on generated QTI
- [ ] `examark emulate-canvas` predicts SUCCESS
- [ ] LaTeX math renders correctly in Canvas preview
- [ ] Point values preserved from source `.qmd`
- [ ] Multi-part problems correctly split into individual questions
- [ ] `--dry-run` shows parsed question summary without calling examark

---

## Track 2: `--format canvas` Flag on Existing Commands

### User Story

> As an instructor generating new exams with `/teaching:exam`, I want to output directly to Canvas QTI format without a separate conversion step.

### Changes Required

#### `/teaching:exam`

**Current:** `--format` exists in `generateAndSaveExam()` signature but NOT in the command's argument parser.

**Fix:** Add `format` to `parseArgs` section:

```javascript
const options = {
  // ... existing options ...
  format: args.format || 'json',  // ADD THIS LINE
};
```

**Accepted values:** `json` (default), `qmd`, `md`, `canvas`, `examark`, `tex`

#### `/teaching:quiz`

**Current:** `--format` is documented with `markdown`, `canvas`, `moodle`, `pdf`, `latex` but the `canvas` path may not be tested end-to-end.

**Fix:** Verify the `CanvasFormatter` pipeline works when invoked via the quiz command. Add integration test.

#### `/teaching:assignment`

**Current:** No `--format` flag.

**Fix:** Add `--format` flag with same accepted values. Route `canvas`/`examark` through the formatter pipeline.

### Acceptance Criteria

- [ ] `/teaching:exam midterm --format canvas` generates valid `.qti.zip`
- [ ] `/teaching:quiz "test" --format canvas` generates valid `.qti.zip`
- [ ] `/teaching:exam midterm --format examark` generates intermediate `.md` for inspection
- [ ] All format values documented in command help text

---

## Architecture

### Existing Components (Reuse)

| Component | Path | Role |
| --- | --- | --- |
| `ExamarkFormatter` | `src/teaching/formatters/examark.js` | JSON → examark markdown |
| `CanvasFormatter` | `src/teaching/formatters/canvas.js` | JSON → examark → QTI via CLI |
| `BaseFormatter` | `src/teaching/formatters/base.js` | Shared validation |
| Examark CLI | `/opt/homebrew/bin/examark` | Core conversion engine |

### New Components

| Component | Path | Role |
| --- | --- | --- |
| Canvas command | `src/plugin-api/commands/teaching/canvas.md` | Command definition |
| Canvas skill | `src/plugin-api/skills/teaching/canvas.md` | Skill definition |
| QMD parser | `src/teaching/parsers/qmd-exam.js` | Parse `.qmd` → question objects |
| Type detector | `src/teaching/parsers/question-type-detector.js` | Heuristic type classification |

### Data Flow

```
Track 1 (converter):
  .qmd → qmd-exam parser → question objects → ExamarkFormatter → .md → examark CLI → .qti.zip

Track 2 (generation):
  AI prompt → JSON → CanvasFormatter → .md → examark CLI → .qti.zip
```

---

## Supported Question Types

All 10 examark types should be supported:

| Type | Tag | Auto-Graded | Notes |
| --- | --- | --- | --- |
| Multiple Choice | `[MC]` | Yes | Single correct answer |
| Multiple Answer | `[MA]` | Yes | Multiple correct answers |
| True/False | `[TF]` | Yes | Binary choice |
| Short Answer | `[Short]` | Yes | Text match |
| Numerical | `[Numeric]` | Yes | With tolerance |
| Essay | `[Essay]` | No | Long-form text |
| Matching | `[Match]` | Yes | Pair items |
| Fill-in-Multiple-Blanks | `[FMB]` | Yes | Multiple blanks in text |
| Fill-in-Blank | `[FIB]` | Yes | Single blank |
| File Upload | `[Upload]` | No | Student uploads file |

---

## Dependencies

| Dependency | Version | Required | Notes |
| --- | --- | --- | --- |
| examark (npm) | >= 0.6.6 | Yes (for QTI output) | Already installed via Homebrew |
| Node.js | >= 18 | Yes | examark runtime |
| Canvas LMS | QTI 1.2 | N/A | Import target |

---

## Edge Cases and Limitations

1. **Show-work problems** (like STAT 545 practice midterm) are all Essay type in Canvas — no auto-grading possible
2. **R code chunks** in `.qmd` are stripped during conversion (not meaningful in Canvas quiz context)
3. **Mermaid diagrams** and dynamic content won't transfer — only static text/math/images
4. **Images** from R-generated plots need special handling if `.qmd` has been rendered (examark can bundle images from `_files/` directories)
5. **Solution keys** (collapsible answers) map to examark feedback blocks — only visible after submission in Canvas
6. **Point values** must be explicitly marked in the `.qmd` (e.g., `[5 pts]`, `(5 points)`) or defaulted

---

## Open Questions

- [ ] Should `/teaching:canvas` also support `.md` input (not just `.qmd`)? Examark already handles `.md` directly — may be redundant
- [ ] Should the command auto-detect if examark is installed and offer `npx examark` fallback?
- [ ] Should we add a `--bank` flag to generate Canvas Item Bank structure (for random question selection)?
- [ ] How to handle multi-part problems: split into N questions, or keep as one Essay with lettered sub-parts?

---

## Review Checklist

- [ ] Spec reviewed by maintainer
- [ ] Question type detection heuristics validated against 3+ real exam files
- [ ] `CanvasFormatter` end-to-end test passing
- [ ] Examark CLI version compatibility verified (>= 0.6.0)
- [ ] Canvas QTI import tested in sandbox course

---

## Implementation Notes

- **Implementation order:** Track 2 first (fix `--format` flags, ~30 min), then Track 1 (converter, ~2 hours)
- **Testing:** Use `assignments/practice-midterm.qmd` as the primary test file — it has 5 multi-part problems with point values, LaTeX math, and R code blocks
- **The `ExamarkFormatter` currently only handles 5 question types** (MC, TF, Short, Essay, Numeric). Needs extension for MA, Match, FMB, FIB, Upload to match examark's full 10-type support

---

## History

| Date | Change |
| --- | --- |
| 2026-02-26 | Initial spec from brainstorm session |
