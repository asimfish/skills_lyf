# Plan: `/teaching:validate-r` — Standalone R Code Validator + Solution Data Loading Fix

**Status:** draft
**Created:** 2026-02-16
**Consolidated from:** GitHub Issues #86, #87, #88
**Target Version:** v2.14.0

---

## Acceptance Criteria

- [ ] `/teaching:validate-r <file.qmd>` extracts R chunks and runs them via `Rscript`
- [ ] `eval: false` chunks reported as SKIP warnings
- [ ] `--fix` mode re-generates failing chunks via Claude
- [ ] `--all` validates all `.qmd` files in a directory
- [ ] `--dry-run` shows chunks without executing
- [ ] Friendly error if `Rscript` not found on PATH
- [ ] Temp `.R` files cleaned up (including on interrupt)
- [ ] `/teaching:solution` loads data from `data/` dir instead of hard-coding
- [ ] `/teaching:solution --validate` delegates to `/teaching:validate-r`
- [ ] `lecture.md` and `slides.md` list validate-r in follow-up actions
- [ ] All 4 discovery integration points updated (see Integration Checklist)
- [ ] Pure utility functions testable without R installed
- [ ] `/teaching:solution` reads lecture/lab notes for R code consistency
- [ ] Missing R packages produce `install.packages()` suggestions
- [ ] All existing tests pass + new tests added (~54 estimated)

---

## Context

Generated solution keys (and lectures/slides/labs) contain R code chunks that may have errors, but there's no way to validate them. Solutions also hard-code data inline or use `eval: false` placeholders, despite actual textbook datasets existing at `data/dean2017/*.txt`. A prompt template for R code validation previously existed in Scholar but was lost.

**Goal:** Create `/teaching:validate-r` as a standalone command that validates R code in any `.qmd` file. Also fix the `/teaching:solution` command to always load data from `data/` directory instead of hard-coding. Other commands (lecture, slides, lab) can reference `/teaching:validate-r` as a follow-up action.

**Scope:** Scholar plugin. Feature branch → PR to `dev`.

## Repository

`/Users/dt/projects/dev-tools/scholar` — currently on `dev` at `6a7929d`.

---

## Part 1: New `/teaching:validate-r` Command

### 1a. Command Definition: `src/plugin-api/commands/teaching/validate-r.md` (NEW)

A new conversational command following the pattern of `validate.md`. Key design:

```
/teaching:validate-r <file.qmd> [options]
/teaching:validate-r solutions/assignment4-solution.qmd
/teaching:validate-r lectures/week-04_model-diagnostics.qmd --fix
/teaching:validate-r --all solutions/
```

**Options:**
- `--fix` — Auto-fix errors by inline-replacing failing chunks (Claude re-generates directly in the .qmd)
- `--all` — Validate all `.qmd` files in a directory (recursive — scans subdirs too)
- `--verbose` — Show full R output for each chunk
- `--setup CODE` — Extra R setup code to prepend (e.g., library loads). Supports `--setup @file.R` to load from file (matches `-i @file.txt` pattern)
- `--data-dir PATH` — Override data directory (default: auto-detect from project)
- `--dry-run` — Show chunks that would be validated without running them
- `--render` — Run `quarto render` as final validation step (requires Quarto installed)
- `--json` — Output results as JSON (for CI/pre-commit hook integration)
- `--timeout N` — Per-chunk timeout in seconds (default: 30). Kills chunk if it exceeds limit.
- `--quiet` — Only show FAIL and WARN lines (suppresses PASS/SKIP). Useful for large files.

**The `<system>` block instructs Claude to:**

1. **Read the target .qmd file** (Bash: `cat <file>`)
2. **Extract R chunks** — Parse ````{r}...```` blocks, noting chunk labels and options
3. **Skip non-executable chunks** — `eval: false` chunks get flagged as warnings ("chunk X uses eval: false — consider enabling")
4. **Detect data directory** — Look for `data/` dir relative to project root; if found, note available files
5. **Build validation script** — Write a temp `.R` file that:
   - Sets working directory to project root
   - Loads packages from `scholar.r_packages` config via `suppressPackageStartupMessages()`
   - Runs chunks sequentially (each wrapped in `tryCatch`)
   - Outputs per-chunk status: `[PASS] chunk-label` or `[FAIL] chunk-label: error message`
6. **Check R availability** — Run `which Rscript`; if missing, exit with friendly error: "R is not installed. Install from https://cran.r-project.org/ or run `brew install r`"
7. **Execute** — Run via `Rscript /tmp/scholar-validate-XXXXX.R`
8. **Parse output** — Report results in eslint-style format:
   ```
   solutions/assignment4-solution.qmd
     chunk "setup" ........... PASS
     chunk "anova-fit" ....... PASS
     chunk "diagnostics" ..... FAIL: object 'fit' not found
     chunk "posthoc" ......... SKIP (eval: false)

   Result: 2 passed, 1 failed, 1 skipped
   ```
9. **Quarto render** (if `--render` flag) — Check `which quarto`; if missing, warn and skip. Otherwise run `quarto render <file>` as final validation
10. **Fix mode** — If `--fix` and errors found, Claude inline-replaces failing chunks directly in the .qmd file
11. **Cleanup** — Remove temp `.R` file (use `finally` block or trap to ensure cleanup on interrupt)

### 1b. R Code Validator Module: `src/teaching/validators/r-code.js` (NEW)

Pure utility functions (testable without Claude/Bash):

```javascript
// Key exports:
extractRChunks(qmdContent)              // Parse .qmd → [{label, code, options, lineNumber}]
shouldValidateChunk(chunk)              // Check eval option, return boolean
buildValidationScript(chunks, opts)     // Combine chunks into one .R script with tryCatch
parseValidationOutput(stdout, stderr, exitCode) // Parse results → structured report
scanDataFiles(dataDir)                  // List .txt/.csv files with headers
formatValidationReport(results)         // Format for display
extractSummaryAndChunks(qmdContent)     // Extract section headers + R chunks (for lecture/lab context)
findMatchingLecture(assignmentPath, root) // Find lecture by week-number or topic keywords
findMatchingLab(assignmentPath, root)   // Find lab by week-number or topic keywords
suggestPackageInstall(errorMsg)         // Pattern-match "no package called X" → install.packages("X")
lintRChunk(chunk)                       // Static lint: setwd(), absolute paths, install.packages(), rm(list=ls())
parseChunkOptions(optionsStr)           // Parse #| YAML options → {message, warning, eval, fig-width, ...}
```

**Pattern:** Follow `ValidatorEngine` result structure from `engine.js`:
```javascript
{ isValid: boolean, errors: [{field, message, type}], warnings: [...], details: {...} }
```

### 1c. Update Validator Index: `src/teaching/validators/index.js`

Add export for the new `r-code.js` module.

### 1d. Tests: `tests/teaching/r-code-validator.test.js` (NEW)

**Runner:** Jest (all `tests/teaching/` files use Jest)
**R required:** No — all tests are pure unit tests with mocked filesystem
**Estimated tests:** ~54 across 12 describe blocks

Test the pure functions:
- `extractRChunks` (~8 tests): Various chunk patterns (labeled, unlabeled, with options, nested code fences, empty chunks, Python chunks ignored)
- `shouldValidateChunk` (~4 tests): eval:true/false/missing/string-vs-boolean
- `buildValidationScript` (~6 tests): Verify tryCatch wrapping, sequential execution, setup code prepend, data-dir injection, empty chunk list
- `parseValidationOutput` (~6 tests): Parse pass/fail/warning from stdout, handle stderr, non-zero exit codes, malformed output
- `scanDataFiles` (~3 tests): Mock filesystem, verify file discovery, empty dir, missing dir
- `formatValidationReport` (~3 tests): Output format, zero results, mixed results
- `extractSummaryAndChunks` (~5 tests): Headers extraction, R chunk extraction, mixed content, empty file, no R chunks
- `findMatchingLecture` (~4 tests): Week-number match, topic keyword fallback, no match returns null, multiple matches picks best
- `findMatchingLab` (~3 tests): Same patterns as lecture matching
- `suggestPackageInstall` (~3 tests): Standard R error message, non-package error returns null, multiple missing packages
- `lintRChunk` (~5 tests): Detect setwd(), absolute paths, install.packages(), rm(list=ls()), clean chunk returns empty
- `parseChunkOptions` (~4 tests): Parse #| YAML options, missing options, boolean vs string values, multiple options

### 1e. Update Discovery Cache: `src/discovery/cache.json`

Add `validate-r` command entry so `/scholar:hub` can discover it.

---

## Part 2: Fix `/teaching:solution` Data Loading

### 2a. Update `solution.md` `<system>` Block

Add **Data Loading Rules** to the solution generation prompt. Insert between the assignment parsing step and the generation step:

```
## Context Gathering (CRITICAL — do this FIRST)

Before generating any R code solutions:

1. READ the corresponding lecture notes: Look for `lectures/week-NN*.qmd` matching the assignment's week/topic
2. READ any lab notes: Look for `labs/week-NN*.qmd` or `labs/lab-NN*.qmd`
3. EXTRACT from lecture/lab notes:
   - R commands and functions taught (use EXACTLY these, not alternatives)
   - Variable naming conventions used (e.g., `fit` vs `model` vs `lm_result`)
   - Package usage patterns (tidyverse vs base R — match the lecture style)
   - Data loading patterns used in lecture examples
   - Plotting conventions (ggplot2 vs base plots — match lecture)
4. ENSURE solution consistency:
   - Use the SAME function names taught in lecture (e.g., if lecture uses `aov()`, don't use `lm()` with `anova()`)
   - Use the SAME variable naming style as lecture examples
   - Reference lecture examples: "As shown in lecture, we use..."
   - Build on lab exercises where applicable

## Data Loading Rules (CRITICAL)

After gathering context from lecture/lab notes:

1. SCAN the project's data directory: `ls data/dean2017/` (or wherever data lives)
2. MATCH textbook references to data files:
   - File naming pattern: lowercase topic, dots for spaces (e.g., margarine.txt, meat.cooking.txt)
   - Common mappings: "Table X.Y about [topic]" → data/dean2017/[topic].txt
3. ALWAYS load with: read.table("data/dean2017/<file>.txt", header = TRUE)
4. NEVER hard-code data that exists in the data directory
5. ALWAYS use eval: true for R chunks (no eval: false placeholders)
6. If no matching data file exists, note it in a callout and provide inline data
```

Also add `--validate` flag that invokes `/teaching:validate-r` on the generated solution:

```
- `--validate` - Run R code validation after generation (calls /teaching:validate-r)
```

After save step, add:
```javascript
// 6. Validate R code (if --validate)
if (options.validate) {
  // Instruct Claude to invoke /teaching:validate-r on the saved file
  // If validation fails, offer to fix and re-validate
}
```

### 2b. Update Solution Prompt: `buildSolutionPrompt()` in `solution.js`

Add lecture/lab context and data loading context to the prompt builder. After the "## Assignment" section, insert:

```javascript
// 1. Find matching lecture/lab files
//    Strategy: try week-number filename match first, then topic keyword search
const lectureFile = findMatchingLecture(assignmentPath, projectRoot);
const labFile = findMatchingLab(assignmentPath, projectRoot);

// 2. Extract summary + R chunks (not full content — avoids token bloat)
if (lectureFile) {
  const lectureContent = readFileSync(join(projectRoot, lectureFile), 'utf-8');
  const { headers, rChunks } = extractSummaryAndChunks(lectureContent);
  prompt += `\n## Lecture Context (for consistency)\n\n`;
  prompt += `### Topics covered:\n${headers.map(h => `- ${h}`).join('\n')}\n\n`;
  prompt += `### R code patterns used in lecture:\n`;
  rChunks.forEach(chunk => {
    prompt += `\`\`\`r\n${chunk.code}\n\`\`\`\n`;
  });
  prompt += `\nUse the SAME R functions, variable names, and coding style as above.\n\n`;
}

if (labFile) {
  const labContent = readFileSync(join(projectRoot, labFile), 'utf-8');
  const { headers, rChunks } = extractSummaryAndChunks(labContent);
  prompt += `\n## Lab Context (for consistency)\n\n`;
  prompt += `### Lab exercises:\n${headers.map(h => `- ${h}`).join('\n')}\n\n`;
  prompt += `### R code patterns from lab:\n`;
  rChunks.forEach(chunk => {
    prompt += `\`\`\`r\n${chunk.code}\n\`\`\`\n`;
  });
  prompt += `\nBuild on these patterns and reference lab exercises where applicable.\n\n`;
}

// 2. If data directory exists, list available files
const dataDir = config?.scholar?.data_dir || findDataDir(projectRoot);
if (dataDir && existsSync(dataDir)) {
  const dataFiles = readdirSync(dataDir).filter(f => f.endsWith('.txt') || f.endsWith('.csv'));
  prompt += `\n## Available Data Files\n\n`;
  prompt += `The following data files are available in \`${dataDir}\`:\n`;
  dataFiles.forEach(f => { prompt += `- ${f}\n`; });
  prompt += `\nUSE these files with read.table("${dataDir}/<file>", header = TRUE) instead of hard-coding data.\n\n`;
}
```

---

## Part 3: Update Other Commands' Follow-up Actions

### 3a. `lecture.md` — Add to follow-up actions
```
- Validate R code: `/teaching:validate-r`
```

### 3b. `slides.md` — Add to follow-up actions
```
- Validate R code: `/teaching:validate-r`
```

### 3c. `solution.md` — Already handled in Part 2 (`--validate` flag)

---

## Part 4: Affected Parent/Super Commands

Commands that delegate to, reference, or are modified by this feature:

| Command | How Affected | Change Required |
|---------|-------------|-----------------|
| `/teaching:solution` | **Modified** — new data loading rules + `--validate` flag | Update `solution.md` system block + `solution.js` prompt builder |
| `/teaching:lecture` | **Follow-up** — add validate-r to suggested next actions | Append to follow-up actions in `lecture.md` |
| `/teaching:slides` | **Follow-up** — add validate-r to suggested next actions | Append to follow-up actions in `slides.md` |
| `/teaching:assignment` | **Indirect** — assignments don't contain R code, but solutions do | No change needed (solution is separate command) |
| `/teaching:config` | **Schema update** — new `data_dir` and `r_packages` fields | Update config schema + validation |
| `/teaching:validate` | **Sibling** — YAML validator; validate-r is R code validator | No change needed (different scope) |
| `/scholar:hub` | **Discovery** — new command appears in hub layers | Integration checklist handles this |
| `/teaching:demo` | **Modified** — demo course includes validate-r example step | Add validate-r step to demo workflow |

---

## Part 5: Documentation Updates

All docs that need updating or creation for validate-r. Organized by doc type.

### 5a. New Tutorial: `docs/tutorials/teaching/r-code-validation.md` (NEW)

**Time:** 15 minutes
**Pattern:** Follow existing tutorial structure (see `validate-and-fix.md`)

**Outline:**
1. **Step 1: Basic Validation** — Run validate-r on a single .qmd file
2. **Step 2: Understanding the Report** — Read pass/fail/skip output
3. **Step 3: Using --dry-run** — Preview which chunks will run
4. **Step 4: Auto-fix with --fix** — Let Claude fix failing chunks
5. **Step 5: Batch Validation with --all** — Validate entire solutions/ directory
6. **Step 6: Quarto Render Check with --render** — Full pipeline validation
7. **Step 7: Custom Setup with --setup** — Prepend libraries, load from file
8. **Step 8: Integration with /teaching:solution** — Use `--validate` flag
9. **Troubleshooting Common R Errors** — Table of 5-6 common errors with solutions:
   - "there is no package called 'X'" → `install.packages("X")`
   - "object 'x' not found" → check chunk order, variable naming
   - "cannot open file 'data/...'" → verify data directory path, use `--data-dir`
   - "could not find function 'X'" → missing `library()` call
   - "non-numeric argument to binary operator" → data type mismatch
   - "unexpected symbol" → syntax error in R code
10. **CI / Pre-commit Integration** — Sample `.pre-commit-config.yml` snippet:
    ```yaml
    - repo: local
      hooks:
        - id: validate-r
          name: Validate R code in .qmd files
          entry: claude --skill teaching:validate-r --json
          language: system
          files: \.qmd$
          pass_filenames: true
    ```
11. **Next Steps** — Link to weekly-content, assignments-solutions-rubrics

### 5b. Update Tutorial: `docs/tutorials/teaching/assignments-solutions-rubrics.md`

Add a new section after solution generation:

```markdown
## Step N: Validate Your Solution Key

After generating a solution, validate the R code runs correctly:

\`\`\`bash
/teaching:validate-r solutions/assignment4-solution.qmd
\`\`\`

Or generate with automatic validation:

\`\`\`bash
/teaching:solution assignments/hw4.qmd --validate
\`\`\`
```

### 5c. Update Tutorial: `docs/tutorials/teaching/weekly-content.md`

Add validate-r as step 6 in the weekly workflow:

```markdown
## Step 6: Validate R Code ⏱️ 1 minute

Ensure all R code in your generated content runs correctly:

\`\`\`bash
/teaching:validate-r --all solutions/
\`\`\`
```

### 5d. Update Tutorial: `docs/tutorials/teaching/learning-path.md`

Add validate-r to the learning path diagram and table:
- Place after "Validation & Auto-Fix" in the Operations track
- Add: `| **[R Code Validation](r-code-validation.md)** | 15 min | Validate R code in .qmd files, auto-fix errors, batch validation |`

### 5e. Update Refcard: `docs/REFCARD.md`

Add validate-r row to the TEACHING section:

```
│  /teaching:validate-r (NEW)         │
│    Validate R code in .qmd files    │
```

Update teaching command count: 15 → 16.

### 5f. Update Refcard: `docs/refcards/teaching-commands.md`

Add row to Quick Command Reference table:

```markdown
| `/teaching:validate-r` | Validate R code in .qmd | `/teaching:validate-r solutions/hw4.qmd` | 30 sec |
```

Add to Common Workflows section — "Quality Check" workflow:

```markdown
### Workflow N: Quality Check ⏱️ 2 minutes

\`\`\`bash
# Validate all solution keys
/teaching:validate-r --all solutions/

# Fix any failing chunks
/teaching:validate-r solutions/hw4-solution.qmd --fix

# Full pipeline with Quarto render
/teaching:validate-r solutions/hw4-solution.qmd --render
\`\`\`
```

### 5g. Update Refcard: `docs/refcards/teaching-workflows.md`

Add validate-r to the "Content Quality" or "Weekly Production" workflow card.

### 5h. Update Refcard: `docs/refcards/assignments-rubrics.md`

Add validate-r as a follow-up step in the assignment→solution→rubric pipeline.

### 5i. Update `docs/QUICK-REFERENCE.md`

Add validate-r entry with options summary.

### 5j. Update `mkdocs.yml` Navigation

Add new tutorial to nav under Teaching Tutorials:

```yaml
- R Code Validation: tutorials/teaching/r-code-validation.md
```

### 5k. Update What's New / CHANGELOG

Create entry in CHANGELOG.md under `[Unreleased]`:

```markdown
### Added
- `/teaching:validate-r` — Standalone R code validator for .qmd files
- `--validate` flag on `/teaching:solution` for automatic R code validation
- `scholar.data_dir` and `scholar.r_packages` config options
- New tutorial: R Code Validation
```

### 5l. Update `docs/index.md`

Add validate-r to the teaching command list on the landing page. Update command count 30→31.

---

## Integration Checklist (New Command — Mandatory)

Adding `validate-r` brings teaching commands from 15 → 16 and total from 30 → 31.

| # | File | Change |
|---|------|--------|
| 1 | `src/discovery/index.js` | Add `'validate-r'` to `TEACHING_SUBCATEGORY_MAP` under `'content'` subcategory |
| 2 | `tests/discovery/discovery.test.js` | Update hardcoded counts: teaching 15→16, total 30→31 |
| 3 | `.github/workflows/ci.yml` | Update minimum command count 30→31, add `validate-r.md` file check |
| 4 | `mkdocs.yml` | Update `command_count: 31`, `teaching_commands: 16` |
| 5 | `src/discovery/cache.json` | Delete before running `npm run test:discovery` (auto-regenerated) |

---

## Dependencies

| Dependency | Required | Notes |
|------------|----------|-------|
| Node.js >= 20.19.0 | Yes | Runtime for validator module |
| R / Rscript | Runtime only | Needed for `validate-r` execution, not for tests. Guard with `which Rscript` check |
| Quarto | Runtime only | Needed for `--render` flag. Guard with `which quarto` check, warn and skip if missing |
| js-yaml | Yes | Already in project — frontmatter parsing |
| ajv | No | Not needed for this command |

---

## Design Decisions (Resolved)

1. **Data directory: project root only** — `findDataDir()` checks for `data/` at project root only. No upward directory walking. Simple and predictable.
2. **Package errors: suggest install** — When `library()` fails with "no package called X", the report suggests `install.packages("X")`. Pattern-match on R's standard error message.
3. **`--render` flag: included in v1** — Full validation pipeline: R chunks + optional `quarto render` as final step. Adds Quarto as optional runtime dependency (guarded with `which quarto` check, like Rscript).
4. **Config schema: add `data_dir` now** — Add `scholar.data_dir` to `.flow/teach-config.yml` schema. Default: `"data/"` relative to project root. This future-proofs data path configuration across commands.
5. **Fix mode: inline replace** — `--fix` has Claude edit the .qmd file directly, replacing the failing chunk in place. No separate file, no diff prompt.
6. **Discovery subcategory: content** — `validate-r` goes in `'content'` subcategory alongside generation commands, since it validates generated content.
7. **`--all` is recursive** — `--all <dir>` scans subdirectories recursively (glob `**/*.qmd`). Useful for nested `lectures/week-*/` structures.
8. **Cascading failures: run anyway** — All chunks are attempted regardless of prior failures. Dependent chunks will fail with their own error messages, which is informative for diagnosing the root cause.
9. **Fenced blocks only** — `extractRChunks` parses only fenced ````{r}...```` blocks, not inline `` `r expr` ``. Inline R is typically trivial variable references.
10. **Package auto-loading: from config** — Read `scholar.r_packages` list from `teach-config.yml` for packages to auto-load via `suppressPackageStartupMessages()`. Defaults to empty list if not configured.
11. **Solution reads lecture/lab first** — `/teaching:solution` reads corresponding lecture and lab .qmd files before generating, ensuring R code uses the same functions, variable names, and style taught in class.
12. **Lecture matching: topic search with filename fallback** — First try week-number filename matching (assignment-04 → week-04). If no match, scan lecture files for topic keywords from the assignment. Slower but robust for non-standard naming.
13. **Context injection: summary + R chunks** — Extract section headers (for topic context) plus R code chunks (for coding style) from lecture/lab files. Avoids injecting 20-40 pages of prose into the prompt while capturing both what was taught and how.
14. **Demo includes validate-r** — Update `/teaching:demo` to include a validate-r step in the demo course workflow so new users discover it immediately.
15. **Config layout: flat** — `scholar.data_dir` and `scholar.r_packages` go directly under `scholar:` key. Simple, matches existing pattern. No nested `scholar.r:` sub-key.
16. **Topic matching: YAML frontmatter title** — `findMatchingLecture()` reads `title:` from .qmd frontmatter of lecture/lab files and matches against assignment topic keywords. Fast and structured.
17. **No lecture found: warn and continue** — If no matching lecture is found, show warning ("No matching lecture found — solution may not match teaching style") but still generate the solution.
18. **Python chunks: ignore silently** — `extractRChunks()` only captures `{r}` blocks. `{python}`, `{bash}`, etc. are skipped without mention.
19. **Tutorial includes troubleshooting** — The new `r-code-validation.md` tutorial includes a troubleshooting section covering 5-6 common R errors (missing package, object not found, wrong data path, library not loaded, etc.) with solutions.
20. **Fix retries: one max** — `--fix` repairs a chunk, re-validates once. If the fix still fails, report final state and move on. Avoids infinite loops.
21. **Batch output: summary table** — `--all` shows a per-file pass/fail summary table at the end, with detailed errors listed below for failing files.
22. **JSON output: yes** — Add `--json` flag for machine-readable output. Enables CI/pre-commit hook integration. Outputs the ValidatorEngine result structure as JSON.
23. **Package config: names only** — `scholar.r_packages` is a simple string array: `['tidyverse', 'ggplot2']`. No version constraints — version management is R's responsibility.
24. **Chunk timeout: configurable** — Default 30s per chunk, override with `--timeout N`. Built into the generated R script using `setTimeLimit()` or `R.utils::withTimeout()`. Most teaching code runs in <5s; simulations may need longer.
25. **Setup file resolution: project root** — `--setup @file.R` resolves relative to project root (where `teach-config.yml` lives). Consistent with `data_dir` resolution.
26. **Pre-commit hook: include sample** — Plan includes a `.pre-commit-config.yml` snippet for running validate-r on staged `.qmd` files. Tutorial covers setup.
27. **Empty directory: warning + exit 0** — `--all` with no `.qmd` files shows warning "No .qmd files found in <dir>" and exits successfully (exit code 0).
28. **Chunk options: respect suppression** — Honor `#| message: false` and `#| warning: false` in chunk options. Suppress those in output like R/Quarto would. Other options (`fig-width`, `echo`, etc.) are parsed but don't affect validation.
29. **Working directory: project root** — `setwd()` to project root (where `teach-config.yml` lives) before running chunks. Matches expected data path resolution. Consistent with `data_dir` being relative to project root.
30. **Unnamed chunks: auto-number** — Chunks without labels are reported as `chunk-1`, `chunk-2`, etc. based on order in the file. `extractRChunks()` assigns sequential labels when none present.
31. **Basic linting: yes** — Beyond execution errors, warn on common anti-patterns:
    - `setwd()` calls in chunks (breaks portability)
    - Absolute paths (e.g., `/Users/...` or `C:\...`)
    - `install.packages()` in chunks (should be in setup, not content)
    - `rm(list = ls())` (destructive, breaks sequential validation)
    - `library()` after code that uses the package (load order)
32. **JSON shape: combined** — `--json` outputs a single `results` array per chunk with both execution status and lint warnings: `{label, status: 'PASS'|'FAIL'|'SKIP'|'TIMEOUT', lint: [{rule, message}], error: null|string}`.
33. **Fix comments: none** — `--fix` does clean inline replacement. No `#| fixed-by:` comments or audit trail in the file.
34. **File types: QMD only** — Scholar is Quarto-focused. `.Rmd` files are not supported. Error message: "validate-r supports .qmd files only".
35. **Batch summary: compact table** — `--all` summary format:
    ```
    solutions/hw1.qmd  ✓ 5/5  |  solutions/hw2.qmd  ✗ 3/5 (2 failed)
    Total: 8/10 passed, 2 failed across 2 files
    ```
36. **Plot output: discard** — Redirect graphics to null device (`pdf(NULL)`) in the validation script. Faster, avoids temp plot files. Plot *code* is still validated (errors caught), just no output saved.
37. **Exit codes: granular** — Exit 0 = all passed. Exit 1 = execution failures. Exit 2 = lint warnings only (no execution failures). Enables CI pipelines to distinguish "broken code" from "style issues".
38. **Quiet mode: yes** — `--quiet` suppresses PASS and SKIP lines, showing only FAIL and WARN. Summary line always shown. Adds one more field to the config schema alongside `data_dir`.

---

## Implementation Order

1. Create worktree: `git worktree add ~/.git-worktrees/scholar/feature-validate-r -b feature/validate-r dev`
2. Create `src/teaching/validators/r-code.js` — Pure utility functions
3. Update `src/teaching/validators/index.js` — Add export
4. Create `tests/teaching/r-code-validator.test.js` — Test pure functions (~54 tests, Jest)
5. Run Jest on new tests: `npx jest tests/teaching/r-code-validator.test.js`
6. Create `src/plugin-api/commands/teaching/validate-r.md` — New command
7. Update `src/plugin-api/commands/teaching/solution.md` — Data loading rules + `--validate` flag
8. Update `src/teaching/generators/solution.js` — Add data directory context to prompt builder
9. Update `lecture.md`, `slides.md` — Add validate-r to follow-up actions
10. Add `scholar.data_dir` to teach-config.yml schema + update config docs
11. **Integration checklist** (all 5 items):
    - `src/discovery/index.js` — add to `TEACHING_SUBCATEGORY_MAP`
    - `tests/discovery/discovery.test.js` — update counts 15→16, 30→31
    - `.github/workflows/ci.yml` — update minimum count + add file check
    - `mkdocs.yml` — update `command_count: 31`, `teaching_commands: 16`
    - Delete `src/discovery/cache.json`
12. Run full test suite: `npm test` + `npm run test:discovery`
13. Create PR: `gh pr create --base dev`

## Verification

1. `npm test` in Scholar — all 2,900 existing tests pass + ~54 new r-code-validator tests
2. Manual test: `/teaching:validate-r solutions/assignment4_checking_model_assumptions-solution.qmd`
   - Should detect eval:false chunks, report them as warnings
   - Should run eval:true chunks and report pass/fail
3. Manual test: `/teaching:solution assignments/assignment4.qmd --validate`
   - Should generate solution with data loaded from `data/dean2017/`
   - Should auto-run validate-r on the output
4. Manual test: `/teaching:validate-r --all solutions/` — Validates all solution files
5. Verify data loading: Generated solutions should contain `read.table("data/dean2017/margarine.txt", header = TRUE)` instead of hard-coded `data.frame()`

## Key Design Decisions

- **Standalone command** (not just a flag) — `/teaching:validate-r` is reusable by any command that generates .qmd with R code
- **Temp file approach** — Write combined `.R` script to temp file, run with `Rscript` (avoids shell escaping issues with inline `-e`)
- **Sequential execution** — Chunks run in order (chunk 2 may depend on chunk 1's objects)
- **tryCatch wrapping** — Each chunk wrapped individually so one failure doesn't stop validation
- **Follow eslint-style output** — Matches existing `validate` command's output format
- **`--validate` on solution** — Convenience flag that delegates to `/teaching:validate-r` after generation
