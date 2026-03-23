# What's New in Scholar v2.15.0

**Released:** 2026-02-23 | **Spec:** [Insights-Driven Enhancements](specs/SPEC-2026-02-23-insights-driven-enhancements.md)

## Overview

Scholar v2.15.0 delivers 5 enhancements derived from analyzing 341 Claude Code sessions (2025-12-24 to 2026-02-19). The insights revealed three primary friction patterns: wrong initial approach (59 events), buggy generated code (41 events), and tool limitations (11 events). This release targets those root causes with shared validation pipelines, a new preflight command, dry-run standardization, email integration, and a CI merge conflict guard.

---

## R Validation Pipeline — `--validate` Flag

### The Problem

Four commands produce `.qmd` files with R chunks (`solution`, `assignment`, `lecture`, `slides`), but only `solution` had a `--validate` flag. Instructors had to remember to run `/teaching:validate-r` separately, leading to 41 "buggy code" friction events where inline interpretations didn't match actual R output.

### The Solution

A new shared `validate-pipeline.js` utility brings the `--validate` flag to all 4 R-producing commands. When passed, the command automatically invokes validation after generating the `.qmd` file:

```bash
# Validate R code in a generated assignment
/teaching:assignment "Chi-square goodness of fit" --validate

# Validate lecture R chunks immediately after generation
/teaching:lecture "Week 8: Regression Diagnostics" --validate

# Validate slides R code before publishing
/teaching:slides "ANOVA assumptions" --validate

# Solution already had --validate — still works
/teaching:solution assignments/hw4.qmd --validate
```

### How It Works

1. **Generate** — The command produces the `.qmd` file as usual via AI
2. **Extract** — R chunks are extracted from the generated file
3. **Execute** — Each chunk runs via `Rscript` with per-chunk timeout
4. **Report** — Pass/fail results shown inline in eslint-style format
5. **Auto-fix** — If any chunk fails, the command offers to regenerate and re-validate

The pipeline is designed for extensibility — named `validate-pipeline.js` (not `validate-r-pipeline.js`) with a `language` parameter, so a future `/teaching:validate-py` can plug into the same architecture.

---

## `/teaching:preflight` Command

### The Problem

Pre-release checks were manual and error-prone. The insights show 59 "wrong approach" events and 30+ release sessions with recurring friction: version string drift between `package.json`, `plugin.json`, and `mkdocs.yml`; CHANGELOG lint failures; stale `cache.json` surviving into commits; merge conflict markers making it to PRs. All of these are detectable before committing.

### The Solution

A new `/teaching:preflight` command runs 6 automated checks in one pass:

```bash
# Run all preflight checks
/teaching:preflight

# Auto-fix what's fixable
/teaching:preflight --fix

# Machine-readable output for CI
/teaching:preflight --json
```

### Checks

| Check | What It Detects | Auto-Fixable |
|-------|-----------------|--------------|
| `version-sync` | `package.json` vs `plugin.json` vs `mkdocs.yml` version drift | No |
| `conflict-markers` | `<<<<<<<` markers in `src/` and `docs/` files | No |
| `test-counts` | `mkdocs.yml` counts out of sync with actual test/suite counts | Yes |
| `cache-cleanup` | Stale `src/discovery/cache.json` committed by mistake | Yes (`--fix` deletes) |
| `changelog` | Top CHANGELOG entry doesn't match current version | No |
| `status-file` | `.STATUS` file not updated in 7+ days | No |

Output uses a table format with PASS/WARN/FAIL per check:

```
┌──────────────────┬────────┬──────────────────────┐
│ Check            │ Status │ Detail               │
├──────────────────┼────────┼──────────────────────┤
│ Version sync     │ PASS   │ v2.15.0 everywhere   │
│ Conflict markers │ PASS   │ No markers found     │
│ Test counts      │ WARN   │ 2955 vs 2877 in yml  │
│ Cache cleanup    │ PASS   │ No stale cache       │
│ CHANGELOG        │ PASS   │ v2.15.0 entry found  │
│ .STATUS          │ WARN   │ Last updated 3d ago  │
└──────────────────┴────────┴──────────────────────┘
```

Exit codes: `0` (all pass), `1` (any fail) — ready for CI integration.

---

## Dry-Run Standardization

An audit of all 16 teaching commands revealed that all 9 AI-generating commands already use the shared `isDryRun()`/`executeDryRun()` utility from `src/teaching/utils/dry-run.js`. The one gap was `/teaching:validate-r`, which had its own dry-run implementation via `Rscript --dry-run`.

In v2.15.0, `validate-r` now uses the shared dry-run utility, giving consistent output format across all commands:

- Command name and resolved options
- Estimated token usage
- Output file path
- No API calls or Rscript execution

---

## Email Integration — `--send` Flag

### The Problem

Only `/teaching:solution` had a `--send` flag for emailing generated content. The email formatting logic was inline, not reusable across commands.

### The Solution

A new shared `send-output.js` utility brings the `--send` flag to 5 content-generating commands:

```bash
# Email an assignment directly to a TA
/teaching:assignment "HW3: Regression" --send ta@university.edu

# Email an exam — uses ta_email from teach-config.yml if no address given
/teaching:exam "Midterm" --send

# Email a rubric to the course coordinator
/teaching:rubric "Final Project" --send coordinator@university.edu

# Also available on quiz and solution
/teaching:quiz "Week 5 Check-in" --send ta@university.edu
/teaching:solution assignments/hw3.qmd --send
```

### How It Works

- **Recipient resolution:** explicit email argument > `course.staff.ta_email` from `teach-config.yml`
- **Subject line:** auto-generated from command type + content title (e.g., "Scholar: Assignment — HW3: Regression")
- **Preview:** content is composed via himalaya with confirmation before sending
- **Attachment:** the generated file is attached alongside an inline preview

---

## Merge Conflict Guard (CI)

A new CI workflow step detects when a PR modifies command files (`src/plugin-api/commands/`) that have also been modified on the target branch. Scholar's command files are both executable prompts and documentation, making them high-conflict-risk when two features touch the same command.

The guard runs automatically on PRs and posts a warning comment listing the specific files at risk. It does not block the PR — conflicts are still resolved manually, but developers get early visibility instead of discovering conflicts at merge time.

---

## Stats

| Metric | v2.14.0 | v2.15.0 | Change |
|--------|---------|---------|--------|
| Commands | 31 | 32 | +1 |
| Teaching commands | 16 | 17 | +1 |
| Tests | ~2,877 | ~2,955 | +78 |
| Shared utilities | 2 | 5 | +3 |
| Commands with `--validate` | 1 | 4 | +3 |
| Commands with `--send` | 1 | 5 | +4 |

---

**Full Changelog:** [v2.14.0...v2.15.0](https://github.com/Data-Wise/scholar/compare/v2.14.0...v2.15.0)

**Previous release:** [What's New in v2.14.0](WHATS-NEW-v2.14.0.md) — R Code Validation command
