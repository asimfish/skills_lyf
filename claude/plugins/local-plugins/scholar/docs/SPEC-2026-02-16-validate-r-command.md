# SPEC: `/teaching:validate-r` — R Code Validator Command

**Status:** draft
**Created:** 2026-02-16
**From:** Brainstorm session (STAT 545 solution key data loading issues)
**Branch:** `feature/validate-r` (from `dev`)

---

## Overview

Create `/teaching:validate-r` as a standalone command that validates R code chunks in any `.qmd` file by extracting them and running via `Rscript`. Also fix `/teaching:solution` to always load data from `data/` directory instead of hard-coding. Other commands (lecture, slides, lab) reference `/teaching:validate-r` as a follow-up action.

## Problem

1. Generated solution keys contain R code that may have errors — no way to validate
2. Solutions hard-code data inline or use `eval: false` placeholders, despite actual textbook data files existing at `data/dean2017/*.txt`
3. No R code validation exists anywhere in Scholar — lectures, slides, and labs also lack it
4. A prompt template for R code validation previously existed in Scholar but was lost

## User Stories

### Primary

As an instructor using Scholar to generate solution keys, I want to validate that all R code chunks actually run correctly, so I don't distribute broken solutions to TAs.

**Acceptance criteria:**
- `/teaching:validate-r solutions/assignment4-solution.qmd` extracts all R chunks, runs them via Rscript, and reports pass/fail per chunk
- `eval: false` chunks are flagged as warnings
- Output follows eslint-style format matching existing `/teaching:validate` command

### Secondary

As an instructor generating any content (lectures, slides, labs), I want a reusable R validation tool I can invoke on any `.qmd` file.

As an instructor generating solutions, I want the solution command to automatically use textbook data files from `data/dean2017/` instead of hard-coding data inline.

---

## Architecture

### New Command: `/teaching:validate-r`

```
/teaching:validate-r <file.qmd> [options]
/teaching:validate-r solutions/assignment4-solution.qmd
/teaching:validate-r lectures/week-04_model-diagnostics.qmd --fix
/teaching:validate-r --all solutions/
```

**Options:**
- `--fix` — Attempt to auto-fix errors (Claude re-generates failing chunks)
- `--all` — Validate all `.qmd` files in a directory
- `--verbose` — Show full R output for each chunk
- `--setup CODE` — Extra R setup code to prepend (e.g., library loads)
- `--data-dir PATH` — Override data directory (default: auto-detect from project)
- `--dry-run` — Show chunks that would be validated without running them
- `--render` — Also run `quarto render` as final validation step

### Validation Flow

```
1. Read target .qmd file
2. Extract R chunks (parse ```{r}...``` blocks with labels and options)
3. Flag eval: false chunks as warnings
4. Detect data directory (look for data/ relative to project root)
5. Build temp .R validation script:
   - Set working directory to project root
   - Load common packages via suppressPackageStartupMessages()
   - Run chunks sequentially, each wrapped in tryCatch
   - Output per-chunk status: [PASS], [FAIL], or [SKIP]
6. Execute via: Rscript /tmp/scholar-validate-XXXXX.R
7. Parse output into structured report
8. Display eslint-style results:

   solutions/assignment4-solution.qmd
     chunk "setup" ........... PASS
     chunk "anova-fit" ....... PASS
     chunk "diagnostics" ..... FAIL: object 'fit' not found
     chunk "posthoc" ......... SKIP (eval: false)

   Result: 2 passed, 1 failed, 1 skipped

9. (Optional) Run quarto render if --render flag
10. (Optional) If --fix, re-examine failing chunks and suggest fixes
11. Cleanup temp .R file
```

### Implementation: Conversational Command

Like all Scholar teaching commands, this is a **conversational command** — the `<system>` block instructs Claude what to do. Claude uses Bash tool to run `Rscript`, Read/Write to handle files.

### Supporting Module: `src/teaching/validators/r-code.js`

Pure utility functions (testable without Claude/Bash):

| Function | Purpose |
|----------|---------|
| `extractRChunks(qmdContent)` | Parse .qmd → `[{label, code, options, lineNumber}]` |
| `shouldValidateChunk(chunk)` | Check eval option, return boolean |
| `buildValidationScript(chunks, opts)` | Combine chunks into one .R script with tryCatch wrappers |
| `parseValidationOutput(stdout, stderr, exitCode)` | Parse Rscript output → structured report |
| `scanDataFiles(dataDir)` | List .txt/.csv files with column headers |
| `formatValidationReport(results)` | Format for display (eslint-style) |

**Result structure** (follows `ValidatorEngine` pattern from `engine.js`):
```javascript
{ isValid: boolean, errors: [{field, message, type}], warnings: [...], details: {...} }
```

---

## Feature 2: Solution Data Loading Fix

### Problem

Generated solutions hard-code data inline or use `eval: false` placeholders, despite actual textbook datasets existing at `data/dean2017/*.txt`. This causes:

- Broken R code (wrong column names, wrong sample sizes)
- `eval: false` chunks that can't be validated
- Manual revision needed for every generated solution

### Real-World Examples (Assignment 3 & 4 Revision)

| Assignment | Issue | Actual Data File |
|-----------|-------|-----------------|
| Hw4 Exercise 3 | `eval: false` with placeholder NAs, column `melt_time` | `margarine.txt` → columns `brand`, `time` (n=10/group) |
| Hw4 Exercise 6 | Hard-coded `data.frame()`, column `crank_rate` | `bicycle.txt` → columns `code`, `trtmt`, `rate` (n=3/group) |
| Hw3 Problem 4 | Hard-coded `data.frame()` for reaction times | `reaction.time.txt` → columns `Order`, `Trtmt`, `A`, `B`, `y` |

### Changes to `solution.md` `<system>` Block

Add **Data Loading Rules** to the generation prompt:

```
## Data Loading Rules (CRITICAL)

Before generating R code solutions:

1. SCAN the project's data directory: ls data/dean2017/
2. MATCH textbook references to data files:
   - Naming pattern: lowercase topic, dots for spaces (margarine.txt, meat.cooking.txt)
   - Common: "Table X.Y about [topic]" → data/dean2017/[topic].txt
3. ALWAYS load with: read.table(here::here("data", "dean2017", "<file>.txt"), header = TRUE)
4. NEVER hard-code data that exists in the data directory
5. ALWAYS use eval: true for R chunks (no eval: false placeholders)
6. If no matching data file exists, note it in a callout and provide inline data
```

Add `--validate` flag to `solution.md` that invokes `/teaching:validate-r` after generation.

### Changes to `solution.js` `buildSolutionPrompt()`

Add data directory context — if `data/dean2017/` exists, list available files in the prompt so Claude can match them to assignment references.

```javascript
// If data directory exists, list available files
if (existsSync('data/dean2017')) {
  const dataFiles = readdirSync('data/dean2017').filter(f => f.endsWith('.txt') || f.endsWith('.csv'));
  prompt += `\n## Available Data Files\n\n`;
  prompt += `The following data files are available in \`data/dean2017/\`:\n`;
  dataFiles.forEach(f => { prompt += `- ${f}\n`; });
  prompt += `\nUSE these files with read.table(here::here("data", "dean2017", "<file>"), header = TRUE).\n`;
  prompt += `NEVER hard-code data that exists in these files.\n\n`;
}
```

---

## Feature 3: R Pattern Consistency Enforcement

### Problem

Generated solutions use different R conventions than the corresponding lecture notes and lab materials. Students see one pattern in class, another in solution keys.

### Patterns That Must Match Across Content Tiers

| Pattern | Lecture/Lab Uses | Solution Should Use |
|---------|-----------------|-------------------|
| Package loading | `pacman::p_load(...)` | `pacman::p_load(...)` |
| Reproducibility | `set.seed(545)` | `set.seed(545)` |
| Data paths | `here::here("data", "dean2017", "file.txt")` | Same (separate arguments) |
| Q-Q plots | `car::qqPlot()` with confidence envelope | `car::qqPlot()` (not base `qqnorm`) |
| Diagnostics | `performance::check_model()` | `performance::check_model()` |
| ANOVA tables | `broom::tidy() \|> knitr::kable()` | `broom::tidy() \|> knitr::kable()` |
| Namespacing | `emmeans::emmeans()`, `car::leveneTest()` | Same (always namespace external pkgs) |
| Base R functions | `shapiro.test()`, `bartlett.test()` (no namespace) | Same |
| Pipe operator | `\|>` (base pipe) | `\|>` |

### Changes to `solution.md` `<system>` Block

Add **R Code Style Rules** after the Data Loading Rules:

```
## R Code Style Rules (CRITICAL — match lecture/lab patterns)

1. Package loading: pacman::p_load() with descriptive comments per package
2. Reproducibility: set.seed(545) in setup chunk
3. Data paths: here::here() with separate arguments (NOT path strings)
4. Diagnostics: car::qqPlot() (not qqnorm), performance::check_model()
5. ANOVA tables: broom::tidy() |> knitr::kable()
6. External packages: always namespace (emmeans::, car::, MASS::, performance::)
7. Base R functions: no namespace needed (shapiro.test, bartlett.test, oneway.test)
8. Pipe: use |> (base pipe), not %>%
```

### Optional: Scan Lecture/Lab for Week Context

The solution command should also scan existing lecture/lab files for the same week to extract the R patterns actually used, and include them as context for generation.

---

## Changes to Other Commands

Add `/teaching:validate-r` to follow-up actions in:
- `lecture.md`
- `slides.md`

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/plugin-api/commands/teaching/validate-r.md` | **CREATE** | New command definition |
| `src/teaching/validators/r-code.js` | **CREATE** | Pure utility functions |
| `src/teaching/validators/index.js` | MODIFY | Add r-code.js export |
| `tests/teaching/r-code-validator.test.js` | **CREATE** | Tests for pure functions |
| `src/plugin-api/commands/teaching/solution.md` | MODIFY | Data loading rules + --validate flag |
| `src/teaching/generators/solution.js` | MODIFY | Data dir context in prompt builder |
| `src/plugin-api/commands/teaching/lecture.md` | MODIFY | Add validate-r to follow-up |
| `src/plugin-api/commands/teaching/slides.md` | MODIFY | Add validate-r to follow-up |
| `src/discovery/cache.json` | MODIFY | Add validate-r entry |

## Dependencies

- `Rscript` available on system (v4.5.2 confirmed)
- No new npm dependencies — uses child_process for Rscript execution

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Standalone vs flag-only | Standalone command | Reusable by all teaching commands, not just solution |
| Execution approach | Temp .R file + Rscript | Avoids shell escaping issues with inline `-e` |
| Chunk execution | Sequential in one script | Chunks depend on prior chunks (data loaded in chunk 1, used in chunk 2) |
| Error isolation | tryCatch per chunk | One failure doesn't stop entire validation |
| Output format | eslint-style | Matches existing `/teaching:validate` command pattern |
| Validation on solution | Opt-in `--validate` flag | Generation is already slow; don't force extra step |

## Session Insights (2026-02-16)

Real-world validation of assignments 3 and 4 revealed these patterns that the validator should catch:

### Common Errors Found in Generated Solutions

| Error Type | Example | Detection Strategy |
|-----------|---------|-------------------|
| `eval: false` placeholders | Chunks with `eval: false` and placeholder NA data | Flag as warning; `--strict` treats as error |
| Hard-coded data | `data.frame(x = c(1,2,3))` when `data/dean2017/file.txt` exists | Scan data dir, warn if matching file found |
| Wrong column names | `melt_time` instead of `time` (actual column in margarine.txt) | Only detectable at runtime (Rscript error) |
| Wrong sample sizes | `n = 6` when data has `n = 10` per group | Runtime error when data doesn't match code |
| Inconsistent R patterns | `library()` instead of `pacman::p_load()` | Optional lint rule (compare with lecture/lab) |
| Missing namespacing | `qqPlot()` instead of `car::qqPlot()` | Optional lint rule |
| Missing `set.seed()` | No reproducibility seed | Optional lint rule |

### Data File Auto-Detection

The validator should support matching textbook references to data files:

```
data/dean2017/margarine.txt     → "Table 5.16", "margarine experiment"
data/dean2017/bicycle.txt       → "Table 5.19", "bicycle experiment"
data/dean2017/reaction.time.txt → "Table 4.4", "reaction time experiment"
data/dean2017/cotton.spinning.txt → "Section 2.3", "cotton-spinning"
data/dean2017/meat.cooking.txt  → "Table 3.14", "meat cooking"
```

File naming pattern: lowercase topic, dots for spaces (e.g., `meat.cooking.txt`).

### R Pattern Consistency Check (Optional `--lint` Flag)

Compare solution R patterns against lecture/lab materials for the same week:

| Check | Expected Pattern | Source |
|-------|-----------------|--------|
| Package loading | `pacman::p_load(...)` | All labs |
| Reproducibility | `set.seed(545)` | All labs |
| Data paths | `here::here("data", "dean2017", "file.txt")` | Lab week-01+ |
| Q-Q plots | `car::qqPlot()` | Lab/lecture week-04 |
| Diagnostics | `performance::check_model()` | Lab/lecture week-04 |
| ANOVA tables | `broom::tidy() \|> knitr::kable()` | Lab week-02+ |

## Open Questions

- Should `--fix` auto-regenerate chunks or just suggest fixes?
- Should validation results be cached (so re-running skips unchanged chunks)?
- Should there be a `--strict` mode that treats warnings (eval:false) as errors?
- Should `--lint` compare R patterns against lecture/lab files for the same week?

## Review Checklist

- [ ] `r-code.js` utility functions have full test coverage
- [ ] `validate-r.md` command follows same pattern as `validate.md`
- [ ] `solution.md` data loading rules are clear and comprehensive
- [ ] Discovery cache updated with correct command metadata
- [ ] All existing 2769+ tests still pass
- [ ] Manual test: `/teaching:validate-r` on a solution file works end-to-end
- [ ] PR description references this spec

## History

| Date | Change |
|------|--------|
| 2026-02-16 | Initial spec from brainstorm session |
| 2026-02-16 | Added session insights from assignment 3/4 revision: common error patterns, data file auto-detection, R pattern lint rules. Created GitHub issues #86, #87, #88. |
