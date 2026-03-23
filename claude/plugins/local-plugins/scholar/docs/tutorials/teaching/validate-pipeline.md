# Tutorial: R Validation Pipeline

**Time:** 15 minutes
**Prerequisites:**

- Scholar plugin installed ({{ scholar.version }}+)
- Claude Code running with ANTHROPIC_API_KEY set
- Rscript available on your system (`which Rscript` should return a path)
- A course with `.qmd` content containing R code chunks

**What you'll learn:**

- Use `--validate` with `/teaching:assignment`, `/teaching:lecture`, and `/teaching:slides`
- Understand per-chunk pass/fail validation output
- Configure automatic validation via `teach-config.yml`
- Handle the auto-fix cycle when validation fails
- Troubleshoot common R validation issues

---

## Overview

The `--validate` flag adds automatic R code validation to content-generating commands. When you generate a `.qmd` file with R code chunks, `--validate` extracts those chunks, runs them via `Rscript`, and reports per-chunk pass/fail status -- all in one step.

**Why use `--validate`?**

- Generated R code may reference wrong column names or missing packages
- Inline interpretations ("the p-value is 0.03") may not match actual R output
- Catching errors at generation time avoids distributing broken materials to students
- Without `--validate`, you must remember to run `/teaching:validate-r` separately

**What you'll get:**

```
/teaching:assignment "ANOVA Homework" --validate

  Generated: assignments/anova-homework.qmd

  Validating R code...
    chunk "setup" ............... PASS
    chunk "load-data" ........... PASS
    chunk "anova-fit" ........... PASS
    chunk "diagnostics" ......... PASS
    chunk "interpretation" ...... PASS

  Result: 5 passed, 0 failed, 0 skipped
  Assignment saved with validated R code.
```

---

## Step 1: Validate an Assignment

**What to do:**

Add `--validate` when generating an assignment that includes R code.

**Example:**

```bash
/teaching:assignment "ANOVA Homework" --format qmd --validate
```

**What happens:**

1. Scholar generates the assignment content with R code chunks via AI
2. The `.qmd` file is saved to disk
3. The validation pipeline extracts all ```` ```{r} ```` blocks
4. Chunks are assembled into a temporary `.R` script with `tryCatch` wrappers
5. The script runs via `Rscript` with the project root as working directory
6. Results are parsed and displayed inline

**Sample output:**

```
  Generated: assignments/anova-homework.qmd

  Validating R code...
    chunk "setup" ............... PASS
    chunk "load-data" ........... PASS
    chunk "anova-fit" ........... PASS
    chunk "tukey-posthoc" ....... FAIL: could not find function "TukeyHSD"
    chunk "diagnostics" ......... SKIP (eval: false)

  Result: 2 passed, 1 failed, 1 skipped
```

**Checkpoint:**

- Verify Rscript is found (no "Rscript not found" error)
- Check that all R chunks are listed in the output
- Review any FAIL messages before distributing

---

## Step 2: Validate a Lecture

The same `--validate` flag works with `/teaching:lecture`:

```bash
/teaching:lecture "Week 5: ANOVA" --format qmd --validate
```

**Sample output:**

```
  Generated: lectures/week-5-anova.qmd

  Validating R code...
    chunk "setup" ............... PASS
    chunk "example-data" ........ PASS
    chunk "one-way-anova" ....... PASS
    chunk "effect-size" ......... PASS
    chunk "visualization" ....... PASS
    chunk "summary-table" ....... PASS

  Result: 6 passed, 0 failed, 0 skipped
  Lecture saved with validated R code.
```

Lecture files often have more R chunks than assignments because they include worked examples, visualizations, and summary tables. Validation ensures all of these produce correct output.

---

## Step 3: Validate Slides

The `--validate` flag also works with `/teaching:slides`:

```bash
/teaching:slides "ANOVA Results" --format qmd --validate
```

**Sample output:**

```
  Generated: slides/anova-results.qmd

  Validating R code...
    chunk "setup" ............... PASS
    chunk "model-output" ........ PASS
    chunk "plot-residuals" ...... PASS

  Result: 3 passed, 0 failed, 0 skipped
  Slides saved with validated R code.
```

Slides typically have fewer R chunks focused on key visualizations and output tables. Validation ensures the plots and tables render correctly.

---

## Step 4: Understanding Validation Output

Each chunk gets one of four statuses:

| Status | Meaning | Action Needed |
|--------|---------|---------------|
| **PASS** | Code ran without errors | None |
| **FAIL** | Code threw an error | Fix the R code |
| **SKIP** | Chunk has `eval: false` | Consider enabling eval |
| **WARN** | Non-fatal issue detected | Review but not blocking |

**FAIL messages include the R error:**

```
  chunk "tukey-posthoc" ..... FAIL: could not find function "TukeyHSD"
```

This tells you the chunk calls a function that is not available, likely because a package was not loaded in the setup chunk.

**Interpretation comparison:**

When the R code runs successfully but the inline interpretation does not match the actual output, the validator flags it:

```
  chunk "anova-fit" ......... WARN: text says "p = 0.03" but R output shows p = 0.042
```

This catches the most common friction point: AI-generated interpretations that do not match the actual computations.

---

## Step 5: The Auto-Fix Cycle

When validation finds failures, Scholar offers to fix them automatically:

```
  chunk "anova-fit" ......... FAIL: object 'dat' not found

  1 chunk failed. Attempt auto-fix? [Y/n]
```

**What happens during auto-fix:**

1. Claude examines the failing chunk, the error message, and the surrounding context
2. A corrected version of the chunk is proposed
3. The `.qmd` file is updated with the fix
4. Validation re-runs on the corrected file
5. Results are displayed

**Example auto-fix:**

```
  chunk "anova-fit" ... FAIL: object 'dat' not found
  --> Fix: Changed 'dat' to 'anova_data' (matching load-data chunk)
  --> Re-check: PASS

  Result after fix: 5 passed, 0 failed, 0 skipped
```

**Note:** Auto-fix makes one retry attempt per failing chunk. If the fix also fails, the chunk is reported as still failing and you should fix it manually or use `/teaching:validate-r --fix` for more targeted debugging.

---

## Step 6: Configure Auto-Validation

If you always want validation on `.qmd` output, configure it in `teach-config.yml` instead of passing `--validate` every time:

```yaml
# .flow/teach-config.yml
scholar:
  defaults:
    auto_validate: true
```

With `auto_validate: true`, every command that produces a `.qmd` file will automatically validate R chunks after saving. This is equivalent to always passing `--validate`.

**Override per-command:**

You can disable validation for a single invocation even when auto-validate is on:

```bash
/teaching:assignment "Quick Draft" --no-validate
```

**When to use auto-validate:**

- You always generate `.qmd` files with R code
- Rscript is always available in your environment
- You prefer catching errors immediately over faster generation

**When to keep it opt-in:**

- You frequently generate non-R content (markdown, LaTeX)
- Rscript is not always available (e.g., CI without R installed)
- You want faster generation and will validate separately

---

## Step 7: Commands That Support `--validate`

The `--validate` flag is available on four commands:

| Command | Typical Use Case |
|---------|-----------------|
| `/teaching:solution` | Validate solution keys before distributing to TAs |
| `/teaching:assignment` | Validate assignment starter code before releasing to students |
| `/teaching:lecture` | Validate worked examples in lecture notes |
| `/teaching:slides` | Validate R output in presentation slides |

All four use the same shared validation pipeline (`src/teaching/utils/validate-pipeline.js`), ensuring consistent behavior and output format.

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

### "object 'X' not found"

**Cause:** A variable referenced in one chunk was created in a prior chunk that failed.

**Solution:**

1. Fix the earlier chunk first -- chunks run sequentially
2. Check for typos in variable names
3. Verify the data loading chunk runs correctly

### "Validation passed but output looks wrong"

**Cause:** The R code runs without errors but produces unexpected results (e.g., wrong column names, unexpected NA values).

**Solution:**

1. Run `/teaching:validate-r --verbose` on the saved file to see full R output
2. Compare R output to inline interpretations manually
3. Use `--fix` to regenerate the problematic chunks

### "Validation takes too long"

**Cause:** Large datasets or computationally intensive R code.

**Solution:**

- Use `/teaching:preflight --quick` for fast checks during development
- Reserve `--validate` for final content before distribution
- Consider using smaller sample datasets in teaching materials

### "--validate flag ignored"

**Cause:** The generated file is not a `.qmd` file (e.g., you specified `--format md` or `--format tex`).

**Solution:** The `--validate` flag only works with `.qmd` files that contain R code chunks. For other formats, use `/teaching:validate-r` directly on the source `.qmd` file.

---

## Additional Options

| Flag | Purpose | Example |
|------|---------|---------|
| `--validate` | Run R validation after generation | `/teaching:assignment "HW1" --validate` |
| `--no-validate` | Skip validation (overrides auto_validate) | `/teaching:lecture "Week 1" --no-validate` |
| `--format qmd` | Generate Quarto format (required for validation) | `/teaching:slides "Results" --format qmd --validate` |

---

## Next Steps

### Integrate into your workflow

1. Add `--validate` to your content generation commands
2. Consider enabling `auto_validate: true` in teach-config.yml
3. Use `/teaching:validate-r` for batch validation of existing files
4. Combine with `/teaching:preflight` before releases

### Related Tutorials

- **[R Code Validation](r-code-validation.md)** -- Standalone R validation with `/teaching:validate-r`
- **[Assignments, Solutions & Rubrics](assignments-solutions-rubrics.md)** -- Generate assignments with validated R code
- **[Weekly Content Creation](weekly-content.md)** -- Include R validation in your weekly workflow

### Related Commands

- **`/teaching:validate-r`** -- Standalone R code validation
- **`/teaching:solution --validate`** -- Generate and validate solution keys
- **`/teaching:preflight`** -- Pre-release health checks

---

**You've learned how to use the `--validate` flag for automatic R code validation.** Add `--validate` to your content generation workflow to catch broken code before students ever see it.
