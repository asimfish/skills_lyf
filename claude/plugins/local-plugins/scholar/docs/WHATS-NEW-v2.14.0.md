# What's New in Scholar v2.14.0

**Released:** 2026-02-16 | **PR:** [#90](https://github.com/Data-Wise/scholar/pull/90)

## R Code Validator — `/teaching:validate-r`

Scholar v2.14.0 adds the `/teaching:validate-r` command — an R code validator that extracts and executes R chunks from `.qmd` files via Rscript, reporting per-chunk PASS/FAIL/SKIP/WARN in eslint-style format. This is the 16th teaching command and the 31st command overall.

### The Problem

After generating solution keys or lecture notes with R code, instructors had no automated way to verify that R code chunks actually execute correctly. Broken code in published materials erodes student trust and wastes class time debugging examples.

### The Solution

`/teaching:validate-r` parses `.qmd` files, extracts fenced R code chunks, and executes them sequentially via `Rscript`:

```bash
# Validate a single solution file
/teaching:validate-r solutions/hw4-solution.qmd

# Batch validate all .qmd files in a directory
/teaching:validate-r --all solutions/

# Auto-fix failing chunks (1 retry)
/teaching:validate-r solutions/hw4.qmd --fix --verbose

# CI-friendly JSON output
/teaching:validate-r --all solutions/ --json --quiet
```

### Per-Chunk Reporting

Output uses an eslint-style format with clear status per chunk:

```
solutions/hw4-solution.qmd
  chunk 1 (setup)       PASS  0.3s
  chunk 2 (regression)  PASS  0.8s
  chunk 3 (plot)        SKIP  eval=FALSE
  chunk 4 (bootstrap)   FAIL  Error in library(boot): no package called 'boot'

3 passed, 1 failed, 1 skipped (1.1s)
```

### Static Lint Rules

Before execution, chunks are statically analyzed for common anti-patterns:

| Rule | Detects | Severity |
|------|---------|----------|
| `setwd()` | Breaks reproducibility | Warning |
| Absolute paths | Non-portable code | Warning |
| `install.packages()` | Side effects in teaching materials | Warning |
| `rm(list=ls())` | Unnecessary global cleanup | Warning |

### Options

| Option | Description |
|--------|-------------|
| `--fix` | Re-generate failing chunks (1 retry max) |
| `--all` | Validate all `.qmd` files in directory |
| `--verbose` | Show detailed execution output |
| `--setup` | Install missing R packages before validation |
| `--data-dir` | Path to data files for R chunks |
| `--dry-run` | Preview chunks without executing |
| `--render` | Full Quarto render after validation |
| `--json` | Machine-readable JSON output |
| `--timeout` | Per-chunk timeout in seconds |
| `--quiet` | Minimal output (CI mode) |
| `--validate` | On `/teaching:solution`: auto-validate generated R code |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All chunks passed |
| 1 | One or more chunks failed |
| 2 | Lint warnings only (no execution failures) |

### Solution Integration

The `--validate` flag on `/teaching:solution` chains solution generation with R code validation:

```bash
# Generate solution + immediately validate R code
/teaching:solution assignments/hw4.qmd --validate

# Generate with data directory context
/teaching:solution assignments/hw4.qmd --validate --data-dir data/
```

### Security

The `sanitizeLabel()` function prevents R code injection via malicious chunk labels in `.qmd` files. Labels are sanitized at the parsing boundary, replacing unsafe characters with underscores.

### Validator Module

The `r-code.js` module provides 12 pure utility functions:

| Function | Purpose |
|----------|---------|
| `extractRChunks` | Parse `.qmd` files for R code blocks |
| `buildValidationScript` | Generate temporary Rscript for execution |
| `parseValidationOutput` | Parse Rscript stdout/stderr into structured results |
| `scanDataFiles` | Discover data files for R chunk context |
| `formatValidationReport` | Generate eslint-style output |
| `extractSummaryAndChunks` | Parse QMD structure for solution generation |
| `findMatchingLecture` | Locate related lecture for context |
| `findMatchingLab` | Locate related lab for context |
| `suggestPackageInstall` | Suggest missing R package installations |
| `lintRChunk` | Static analysis of R code |
| `parseChunkOptions` | Parse `{r chunk-name, eval=FALSE}` options |
| `shouldValidateChunk` | Determine if chunk should be executed |

## Documentation Updates

- New tutorial: [R Code Validation](tutorials/teaching/r-code-validation.md) (15-minute guide)
- Updated 3 refcards, 2 FAQs, learning path, hub tutorial
- Updated commands reference with validate-r entry
- CI link checker: added ignore pattern for CHANGELOG compare URLs

## Stats

| Metric | v2.13.0 | v2.14.0 | Change |
|--------|---------|---------|--------|
| Commands | 30 | 31 | +1 |
| Teaching commands | 15 | 16 | +1 |
| Tests | 2,906 | 3,014 | +108 |
| Test suites | 126 | 128 | +2 |

**Full Changelog:** [v2.13.0...v2.14.0](https://github.com/Data-Wise/scholar/compare/v2.13.0...v2.14.0)

**Previous release:** [What's New in v2.13.0](WHATS-NEW-v2.13.0.md) — Solution Key Generator
