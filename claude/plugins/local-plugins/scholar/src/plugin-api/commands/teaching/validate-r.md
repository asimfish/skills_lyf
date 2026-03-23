---
name: teaching:validate-r
description: Validate R code chunks in .qmd files by extracting and running them via Rscript
---

# Validate R Code in .qmd Files

Extract and execute R code chunks from Quarto (.qmd) files to verify they run without errors. Reports results in eslint-style format with per-chunk pass/fail/skip status.

**Usage:**
```
/teaching:validate-r <file.qmd> [options]
/teaching:validate-r --all <directory>
```

**Examples:**
```
# Validate a single solution file
/teaching:validate-r solutions/assignment4-solution.qmd

# Validate all .qmd files in a directory
/teaching:validate-r --all solutions/

# Dry-run: show extracted chunks without executing
/teaching:validate-r --dry-run solutions/assignment4-solution.qmd

# Verbose output with full R console output
/teaching:validate-r --verbose solutions/assignment4-solution.qmd

# Auto-fix failing chunks (1 retry)
/teaching:validate-r --fix solutions/assignment4-solution.qmd

# With extra R setup code
/teaching:validate-r --setup "library(tidyverse)" solutions/assignment4-solution.qmd

# Load setup from a file
/teaching:validate-r --setup @setup.R solutions/assignment4-solution.qmd

# Override data directory
/teaching:validate-r --data-dir data/dean2017 solutions/assignment4-solution.qmd

# CI-friendly JSON output
/teaching:validate-r --json solutions/assignment4-solution.qmd

# Full pipeline: validate then render
/teaching:validate-r --render solutions/assignment4-solution.qmd

# Quiet mode for CI (only FAIL/WARN lines)
/teaching:validate-r --quiet --all solutions/

# Custom timeout per chunk
/teaching:validate-r --timeout 60 solutions/assignment4-solution.qmd
```

**Options:**
- `--fix` - Auto-fix failing chunks by re-generating them via Claude (1 retry max)
- `--all` - Recursively scan directory for `**/*.qmd` files
- `--verbose` - Show full R output for each chunk
- `--setup CODE` - Extra R setup code prepended to validation script (supports `@file.R` to load from project root)
- `--data-dir PATH` - Override data directory (default: auto-detect `data/` at project root)
- `--dry-run` - Show extracted chunks without executing
- `--render` - Run `quarto render` as final step (requires Quarto installed)
- `--json` - Machine-readable JSON output for CI pipelines
- `--timeout N` - Per-chunk timeout in seconds (default: 30)
- `--quiet` - Only show FAIL and WARN lines, suppress PASS and SKIP

**Output Format:**

eslint-style per-chunk report:
```
solutions/assignment4-solution.qmd
  chunk "setup" ........... PASS
  chunk "anova-fit" ....... PASS
  chunk "diagnostics" ..... FAIL: object 'fit' not found
  chunk "posthoc" ......... SKIP (eval: false)

Result: 2 passed, 1 failed, 1 skipped
```

**JSON Output (`--json`):**

```json
{
  "file": "solutions/assignment4-solution.qmd",
  "chunks": [
    { "label": "setup", "status": "PASS", "lint": [] },
    { "label": "anova-fit", "status": "PASS", "lint": [] },
    { "label": "diagnostics", "status": "FAIL", "error": "object 'fit' not found", "lint": [] },
    { "label": "posthoc", "status": "SKIP", "lint": ["Uses library() instead of pacman::p_load()"] }
  ],
  "summary": { "pass": 2, "fail": 1, "skip": 1, "warn": 0 }
}
```

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | All chunks passed (or skipped) |
| 1 | One or more chunks had execution failures |
| 2 | No execution failures, but lint warnings present |

**Follow-up Actions:**

After validation, you can:
- Fix reported issues in the source .qmd file
- Re-run with `--fix` for auto-correction of failing chunks
- Run with `--render` for full Quarto validation (compile to HTML/PDF)
- Use `--json` output for CI integration
- Run `/teaching:validate` for YAML config validation

<system>
This command validates R code chunks in .qmd files by extracting them and running via Rscript.

## Workflow

You are Claude acting as an R code validator. Follow these steps precisely when the user invokes `/teaching:validate-r`.

### Step 1: Parse Arguments

Use the shared dry-run utility for consistent `--dry-run` handling:

```javascript
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';
```

Extract from user input:
- `file` — the .qmd file path (or directory if `--all`)
- `--fix` — enable auto-fix mode (1 retry max)
- `--all` — recursive `**/*.qmd` scan
- `--verbose` — show full R output per chunk
- `--setup CODE` — extra R setup code (if starts with `@`, read that file from project root)
- `--data-dir PATH` — override data directory
- `--dry-run` — extract and display chunks only, do not execute
- `--render` — run `quarto render` after validation
- `--json` — output results as JSON
- `--timeout N` — per-chunk timeout in seconds (default: 30)
- `--quiet` — suppress PASS/SKIP lines

Map parsed arguments to an options object:

```javascript
const options = {
  file: args._[0] || args.file,
  fix: args.fix || false,
  all: args.all || false,
  verbose: args.verbose || false,
  setup: args.setup || null,
  dataDir: args['data-dir'] || null,
  dryRun: args['dry-run'] || false,
  render: args.render || false,
  json: args.json || false,
  timeout: parseInt(args.timeout) || 30,
  quiet: args.quiet || false
};
```

### Step 2: Read the .qmd File(s)

- If `--all` flag: use Bash to find all `**/*.qmd` files in the given directory. Process each file through steps 3-8.
- Otherwise: read the single .qmd file using the Read tool.
- If the file does not exist, report an error and stop.

### Step 3: Extract R Chunks

Parse the .qmd content to extract fenced R code blocks:
- Match only ` ```{r} ` blocks (ignore `{python}`, `{bash}`, inline R)
- For each chunk, capture:
  - **label**: from `{r label}` or `{r, label="name"}` or `#| label: name`
  - **options**: YAML-style `#|` options (eval, echo, warning, message, fig-width, etc.)
  - **code**: the R source code inside the fence
- Auto-number unnamed chunks as `chunk-1`, `chunk-2`, etc.
- Use `extractRChunks()` and `parseChunkOptions()` from `src/teaching/validators/r-code.js` if available.

### Step 4: Classify Chunks and Handle Dry-Run

For each chunk, determine its status:
- If `eval: false` in chunk options → mark as **SKIP**, do not execute
- If `include: false` but `eval` is not false → still execute (include only controls output visibility)
- All other chunks → mark as **PENDING** for execution

Check for dry-run mode using the shared utility:

```javascript
if (isDryRun(options)) {
  executeDryRun('validate-r', options, {
    prompt: `Validate R chunks in ${options.file}: ${chunks.map(c => c.label).join(', ')}`
  });
  // executeDryRun calls process.exit(0)
}
```

The shared `executeDryRun('validate-r', options)` will produce consistent output:
- **Human-readable mode** (default): shows command name, parameters, config, estimated tokens, and "No API calls would be made."
- **JSON mode** (`--json` + `--dry-run`): outputs a JSON object with `command`, `would_generate`, `parameters`, `course_info`, `config_file`, `prompt_preview`, `estimated_tokens`, and `api_calls: 0` — matching the format used by all other teaching commands.

After displaying the dry-run preview, also list the extracted chunks with their labels, line numbers, and first 3 lines of code for validate-r-specific context. Then stop. Do not execute anything.

### Step 5: Detect Data Directory

Look for a `data/` directory at the project root (the directory containing `.git` or `_quarto.yml`):
- If `--data-dir` is provided, use that path instead
- If `data/` exists, note its path for the validation script
- If `data/` does not exist and no `--data-dir` provided, proceed without (chunks referencing data files may fail, which is a valid validation result)

### Step 6: Build Validation Script

Construct a temporary `.R` file that executes each PENDING chunk inside a tryCatch wrapper. Use `buildValidationScript()` from `src/teaching/validators/r-code.js` if available, or construct manually:

```r
# Auto-generated validation script
# Do not edit — this file is deleted after execution

suppressPackageStartupMessages({
  # --setup code goes here (if provided)
})

setwd("PROJECT_ROOT")

# Suppress plot output
pdf(NULL)
on.exit(dev.off(), add = TRUE)

# Chunk 1: "setup"
cat("[CHUNK:setup:START]\n")
tryCatch({
  # ... chunk code here ...
  cat("[CHUNK:setup:PASS]\n")
}, error = function(e) {
  cat(paste0("[CHUNK:setup:FAIL:", conditionMessage(e), "]\n"))
}, warning = function(w) {
  cat(paste0("[CHUNK:setup:WARN:", conditionMessage(w), "]\n"))
  invokeRestart("muffleWarning")
})
cat("[CHUNK:setup:END]\n")

# Chunk 2: "anova-fit"
# ... same pattern ...
```

Key rules for the script:
- `setwd()` to project root so relative paths in chunks work
- `pdf(NULL)` to suppress plot device output
- `suppressPackageStartupMessages` around setup code
- Each chunk wrapped in `tryCatch` with error and warning handlers
- Markers like `[CHUNK:label:PASS]` for reliable parsing
- Chunks execute sequentially (later chunks depend on earlier ones)

Write the script to a temp file (e.g., `/tmp/scholar-validate-TIMESTAMP.R`).

### Step 7: Check Rscript Availability

Run `which Rscript` via Bash. If Rscript is not found:
- Report a friendly error: "Rscript not found on PATH. Install R from https://cran.r-project.org/ or ensure it is in your PATH."
- Clean up the temp file
- Stop with exit code 1

### Step 8: Execute Validation

Run the temp script via Bash:
```bash
timeout TIMEOUT_SECONDS Rscript /tmp/scholar-validate-TIMESTAMP.R 2>&1
```

- Use the `--timeout` value (default 30s) multiplied by the number of chunks as the total timeout
- Capture both stdout and stderr

### Step 9: Parse Output

Parse the Rscript output to determine per-chunk results:
- Look for `[CHUNK:label:PASS]` → chunk passed
- Look for `[CHUNK:label:FAIL:message]` → chunk failed with error message
- Look for `[CHUNK:label:WARN:message]` → chunk had warnings
- If a chunk's START marker appears but no PASS/FAIL/END → chunk timed out or crashed

Use `parseValidationOutput()` from `src/teaching/validators/r-code.js` if available.

Also run `lintRChunk()` on each chunk to check for common issues:
- `setwd()` calls (should use project root instead)
- Absolute file paths (should use relative)
- `install.packages()` calls (should use setup or config)
- `rm(list = ls())` (dangerous in shared environment)

### Step 10: Report Results

**Standard output** (eslint-style):
```
solutions/assignment4-solution.qmd
  chunk "setup" ........... PASS
  chunk "anova-fit" ....... PASS
  chunk "diagnostics" ..... FAIL: object 'fit' not found
  chunk "posthoc" ......... SKIP (eval: false)

Result: 2 passed, 1 failed, 1 skipped
```

- If `--quiet`: only show FAIL and WARN lines
- If `--verbose`: show full R output for each chunk between its START and END markers
- If `--json`: output the JSON structure with per-chunk status, errors, and lint results

For missing package errors, add a suggestion:
```
  chunk "setup" ........... FAIL: there is no package called 'effectsize'
    Suggestion: install.packages("effectsize")
```

### Step 11: Quarto Render (if --render)

If `--render` flag is set and validation passed (no FAIL results):
1. Check `which quarto` — if not found, warn and skip
2. Run `quarto render FILE.qmd` via Bash
3. Report render success or failure

If validation had failures, skip rendering and report: "Skipping render — fix R errors first."

### Step 12: Fix Mode (if --fix)

If `--fix` flag is set and there are FAIL results:
1. For each failing chunk, use Claude to re-generate the R code based on:
   - The chunk's label and surrounding context
   - The error message from the failed execution
   - The rest of the .qmd file for context
2. Replace the failing chunk in the .qmd file with the corrected code
3. Re-run validation on the fixed file (1 retry only — do not loop)
4. Report which chunks were fixed and whether the retry passed

Maximum 1 retry. If chunks still fail after the fix attempt, report them as unresolved.

### Step 13: Cleanup

Always clean up the temp .R file, even if execution fails or is interrupted. Use a finally-style pattern:
```bash
rm -f /tmp/scholar-validate-TIMESTAMP.R
```

### Exit Codes

After reporting results, indicate the exit status:
- **0** — all chunks passed or were skipped
- **1** — one or more chunks had execution failures
- **2** — no execution failures, but lint warnings were found

## Notes

- Chunks execute sequentially because later chunks often depend on objects created in earlier ones (e.g., `fit` from a model-fitting chunk used in a diagnostics chunk).
- The `pdf(NULL)` device prevents R from trying to open a graphics window or create PDF files during validation.
- If `--setup` starts with `@`, read the file relative to the project root (e.g., `@setup.R` reads `PROJECT_ROOT/setup.R`).
- The `--all` flag combined with `--quiet` and `--json` is designed for CI pipelines.
</system>
