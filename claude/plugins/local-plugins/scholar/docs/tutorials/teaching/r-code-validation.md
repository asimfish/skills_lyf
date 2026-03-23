# Tutorial: R Code Validation

**Time:** 15 minutes
**Prerequisites:**

- Scholar plugin installed ({{ scholar.version }}+)
- Claude Code running with ANTHROPIC_API_KEY set
- Rscript available on your system (`which Rscript` should return a path)
- A `.qmd` file with R code chunks to validate

**What you'll learn:**

- Validate R code in `.qmd` files before distributing to students
- Understand eslint-style PASS/FAIL/SKIP/WARN output
- Use `--dry-run`, `--all`, `--fix`, and `--render` workflows
- Integrate R validation into CI pipelines
- Troubleshoot common R validation errors

---

## Overview

`/teaching:validate-r` extracts R code chunks from Quarto (`.qmd`) files, runs them sequentially via `Rscript`, and reports per-chunk pass/fail status. This catches broken code before students or TAs ever see it.

**Why validate R code?**

- Generated solutions may reference wrong column names or missing packages
- `eval: false` chunks hide errors until someone tries to run them
- Data loading paths may be incorrect or hard-coded
- Package conflicts surface only at runtime

**What you'll get:**

```
solutions/assignment4-solution.qmd
  chunk "setup" ........... PASS
  chunk "anova-fit" ....... PASS
  chunk "diagnostics" ..... FAIL: object 'fit' not found
  chunk "posthoc" ......... SKIP (eval: false)

Result: 2 passed, 1 failed, 1 skipped
```

---

## Step 1: Validate a Single File

**What to do:**

Run `/teaching:validate-r` on any `.qmd` file containing R code chunks.

**Example:**

```bash
/teaching:validate-r solutions/assignment4-solution.qmd
```

**What happens:**

1. Scholar reads the `.qmd` file and extracts all ```` ```{r} ```` blocks
2. Chunks are assembled into a temporary `.R` script with `tryCatch` wrappers
3. The script runs via `Rscript` with the project root as working directory
4. Results are parsed and displayed in eslint-style format

**Sample output:**

```
solutions/assignment4-solution.qmd
  chunk "setup" ............... PASS
  chunk "load-data" ........... PASS
  chunk "anova-model" ......... PASS
  chunk "tukey-posthoc" ....... PASS
  chunk "diagnostics" ......... PASS

Result: 5 passed, 0 failed, 0 skipped
```

**Checkpoint:**

- Verify Rscript is found (no "Rscript not found" error)
- Check that all chunks are listed in the output
- Review any FAIL or WARN messages

---

## Step 2: Understand the Output

Each chunk gets one of four statuses:

| Status | Meaning | Action Needed |
|--------|---------|---------------|
| **PASS** | Code ran without errors | None |
| **FAIL** | Code threw an error | Fix the R code |
| **SKIP** | Chunk has `eval: false` | Consider enabling eval |
| **WARN** | Non-fatal issue detected | Review but not blocking |

**FAIL messages include the R error:**

```
  chunk "diagnostics" ..... FAIL: object 'fit' not found
```

This tells you the chunk references a variable (`fit`) that was never created, likely because a prior chunk also failed or the variable name is wrong.

**SKIP messages flag chunks that cannot be validated:**

```
  chunk "posthoc" ......... SKIP (eval: false)
```

Chunks with `eval: false` are intentionally skipped by Quarto during rendering. The validator flags them so you can decide whether to enable evaluation.

---

## Step 3: Preview with `--dry-run`

Before running any R code, preview what would be validated:

```bash
/teaching:validate-r --dry-run solutions/assignment4-solution.qmd
```

**Output:**

```
Dry-run: 6 chunks found in solutions/assignment4-solution.qmd

  1. "setup" (line 12) ............. will validate
  2. "load-data" (line 25) ......... will validate
  3. "anova-model" (line 38) ....... will validate
  4. "diagnostics" (line 52) ....... will validate
  5. "visualization" (line 68) ..... will validate
  6. "appendix" (line 85) .......... will SKIP (eval: false)

5 chunks to validate, 1 to skip
```

This is useful for:

- Verifying the parser found all your chunks
- Checking which chunks have `eval: false`
- Understanding chunk order before execution

---

## Step 4: Validate All Files in a Directory

Use `--all` to validate every `.qmd` file in a directory:

```bash
/teaching:validate-r --all solutions/
```

**Output:**

```
solutions/assignment3-solution.qmd
  chunk "setup" ............... PASS
  chunk "model-fit" ........... PASS
  chunk "residuals" ........... PASS
  Result: 3 passed, 0 failed, 0 skipped

solutions/assignment4-solution.qmd
  chunk "setup" ............... PASS
  chunk "load-data" ........... PASS
  chunk "anova-model" ......... FAIL: could not find function "qqPlot"
  chunk "posthoc" ............. SKIP (eval: false)
  Result: 2 passed, 1 failed, 1 skipped

Summary: 2 files, 5 passed, 1 failed, 1 skipped
```

This is ideal for batch validation of all solution keys, lecture notes, or lab materials at once.

---

## Step 5: Auto-Fix Failing Chunks with `--fix`

When chunks fail, use `--fix` to have Claude analyze the error and regenerate the failing code:

```bash
/teaching:validate-r --fix solutions/assignment4-solution.qmd
```

**What happens:**

1. Validation runs normally
2. For each FAIL chunk, Claude examines the error message and surrounding context
3. A corrected version of the chunk is proposed
4. The file is updated with the fix
5. Validation re-runs to confirm the fix works

**Example fix:**

```
  chunk "anova-model" ... FAIL: could not find function "qqPlot"
  --> Fix: Added car:: namespace prefix
  --> Re-check: PASS
```

**Note:** `--fix` makes one retry attempt per failing chunk. If the fix also fails, the chunk is reported as still failing and you should fix it manually.

---

## Step 6: Validate and Render with `--render`

For full confidence, validate R code and then run `quarto render`:

```bash
/teaching:validate-r --render solutions/assignment4-solution.qmd
```

This performs two validation passes:

1. **R validation:** Extract and run chunks via Rscript
2. **Quarto render:** Run `quarto render` to verify the full document compiles

If R validation passes but Quarto render fails, the issue is likely in YAML frontmatter, LaTeX formatting, or Quarto-specific features rather than R code.

---

## Step 7: CI Integration with `--json` and `--quiet`

For automated pipelines, use machine-readable output:

### JSON output

```bash
/teaching:validate-r --json solutions/assignment4-solution.qmd
```

**Output:**

```json
{
  "file": "solutions/assignment4-solution.qmd",
  "chunks": [
    {"label": "setup", "status": "pass", "line": 12},
    {"label": "anova-model", "status": "fail", "line": 38, "error": "object 'fit' not found"}
  ],
  "summary": {"pass": 1, "fail": 1, "skip": 0, "warn": 0}
}
```

### Quiet mode

```bash
/teaching:validate-r --quiet --all solutions/
```

Quiet mode only prints FAIL and WARN lines, suppressing PASS output. Combined with `--all`, this is useful for CI checks where you only care about failures.

### Pre-commit hook

Add R validation as a pre-commit hook to catch broken code before it enters version control.

**`.git/hooks/pre-commit` (sample):**

```bash
#!/bin/bash
# Validate R code in staged .qmd files before commit

STAGED_QMD=$(git diff --cached --name-only --diff-filter=ACM | grep '\.qmd$')

if [ -z "$STAGED_QMD" ]; then
  exit 0  # No .qmd files staged
fi

echo "Validating R code in staged .qmd files..."

FAILED=0
for file in $STAGED_QMD; do
  # Extract R chunks and run via Rscript
  # (Simplified — use /teaching:validate-r in practice)
  Rscript -e "
    chunks <- knitr::purl('$file', output = tempfile(), quiet = TRUE)
    tryCatch(source(chunks), error = function(e) {
      cat('FAIL:', '$file', '-', e\$message, '\n')
      quit(status = 1)
    })
  " 2>/dev/null
  if [ $? -ne 0 ]; then
    FAILED=1
  fi
done

if [ $FAILED -ne 0 ]; then
  echo "R validation failed. Fix errors before committing."
  exit 1
fi

echo "R validation passed."
exit 0
```

### GitHub Actions integration

```yaml
# .github/workflows/validate-r.yml
name: Validate R Code
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: r-lib/actions/setup-r@v2
      - name: Install R packages
        run: |
          Rscript -e 'install.packages(c("here", "pacman", "car", "broom", "knitr"))'
      - name: Validate R chunks
        run: |
          # Run validation on all solution files
          for f in solutions/*.qmd; do
            Rscript -e "knitr::purl('$f', output = '/tmp/test.R', quiet = TRUE); source('/tmp/test.R')"
          done
```

---

## Troubleshooting

### "Rscript not found"

**Cause:** R is not installed or not on your PATH.

**Solution:**

```bash
# Check if R is installed
which Rscript

# macOS: Install via Homebrew
brew install r

# Or download from https://cran.r-project.org/
```

### "there is no package called 'X'"

**Cause:** A required R package is not installed.

**Solution:**

```r
# Install the missing package
install.packages("car")

# Or install multiple packages at once
install.packages(c("here", "pacman", "car", "broom", "performance", "emmeans"))
```

**Tip:** Use `--setup` to load packages before validation:

```bash
/teaching:validate-r --setup "pacman::p_load(here, car, broom, performance)" file.qmd
```

### "eval: false chunks everywhere"

**Cause:** Generated content uses `eval: false` as a placeholder when it cannot determine the correct data or context.

**Solution:**

1. Enable evaluation: change `eval: false` to `eval: true` in the chunk options
2. Ensure data files are available in the expected location
3. Use `/teaching:solution` with the `--validate` flag to generate solutions that load real data

### "object 'X' not found"

**Cause:** A variable referenced in one chunk was created in a prior chunk that failed.

**Solution:**

1. Fix the earlier chunk first -- chunks run sequentially
2. Check for typos in variable names
3. Verify the data loading chunk runs correctly

### "cannot open the connection" / file not found

**Cause:** Data file path is incorrect.

**Solution:**

```bash
# Use --data-dir to specify the correct data location
/teaching:validate-r --data-dir data/dean2017 solutions/assignment4-solution.qmd
```

Or fix the path in the `.qmd` file to use `here::here()`:

```r
# Instead of:
dat <- read.table("data/dean2017/margarine.txt", header = TRUE)

# Use:
dat <- read.table(here::here("data", "dean2017", "margarine.txt"), header = TRUE)
```

---

## Additional Options

| Flag | Purpose | Example |
|------|---------|---------|
| `--fix` | Auto-fix failing chunks | `/teaching:validate-r --fix file.qmd` |
| `--all` | Validate all `.qmd` in directory | `/teaching:validate-r --all solutions/` |
| `--dry-run` | Preview chunks without running | `/teaching:validate-r --dry-run file.qmd` |
| `--render` | Also run `quarto render` | `/teaching:validate-r --render file.qmd` |
| `--verbose` | Show full R output | `/teaching:validate-r --verbose file.qmd` |
| `--json` | JSON output for CI | `/teaching:validate-r --json file.qmd` |
| `--quiet` | Only show failures | `/teaching:validate-r --quiet --all dir/` |
| `--setup CODE` | Extra R setup code | `/teaching:validate-r --setup "library(car)" file.qmd` |
| `--setup @file` | Load setup from file | `/teaching:validate-r --setup @setup.R file.qmd` |
| `--data-dir PATH` | Override data directory | `/teaching:validate-r --data-dir data/ file.qmd` |

---

## Next Steps

### Integrate into your workflow

1. Run `/teaching:validate-r` after generating any `.qmd` content
2. Use `--all` to batch-validate weekly materials
3. Add the pre-commit hook to catch issues early
4. Use `--fix` for quick corrections

### Related Tutorials

- **[Assignments, Solutions & Rubrics](assignments-solutions-rubrics.md)** -- Generate assignments with validated R code
- **[Weekly Content Creation](weekly-content.md)** -- Include R validation in your weekly workflow
- **[Slide Revision & Validation](slide-revision-validation.md)** -- Validate slide content and structure

### Related Commands

- **`/teaching:validate`** -- Validate YAML configuration files
- **`/teaching:solution`** -- Generate solution keys (supports `--validate` flag for automatic R validation)
- **`/teaching:slides --check`** -- Validate slide content against lesson plans

---

**You've learned how to validate R code in `.qmd` files.** Use `/teaching:validate-r` as part of your content creation workflow to ensure students always receive working code.
