# What's New in Scholar v2.5.0

**Latest:** [v2.5.2](https://github.com/Data-Wise/scholar/releases/tag/v2.5.2) - Comprehensive Test Suite & Documentation (Jan 29, 2026)
**Release:** Weekly Lecture Production
**Date:** January 2026

---

## v2.5.2 (Latest) - Test Suite & Documentation

**Released:** January 29, 2026

### What's New

**Comprehensive Test Suite (80 new tests)**

- 🔒 **30 security tests** validating injection attack prevention
  - Path traversal, shell injection, ReDoS, unicode attacks, TOCTOU
  - 100% pass rate on all security scenarios
- 🧪 **35 E2E tests** using real demo course as fixture
  - Tests all 6 v2.5.0 features with real-world workflows
- 🔄 **15 regression tests** for Session 38 security fixes
  - Ensures 10 critical/important fixes remain fixed

**Security Documentation**

- 📘 New [SECURITY-TESTING-GUIDE.md](SECURITY-TESTING-GUIDE.md) (440 lines)
  - Complete threat model with attack surface diagrams
  - All 30 security test scenarios documented
  - Manual testing procedures and security checklist
- 📗 Updated [TESTING-GUIDE.md](TESTING-GUIDE.md) with v2.5.0 section
  - Comprehensive coverage of all 80 tests
  - Running instructions and examples

**Stats**

- Total tests: 1,740 (was 1,659)
- Pass rate: 100%
- New documentation: +711 lines

---

## v2.5.0 - Weekly Lecture Production

---

## Summary

v2.5.0 makes `/teaching:lecture` production-ready for weekly semester use. Six new features cover the full lifecycle: generate to a predictable directory, track provenance, refine individual sections, load context from previous weeks, validate coverage against lesson plans, and auto-preview.

---

## New Features

### Output Directory (`-output-dir`)

Generated lectures now land in a predictable directory with consistent naming.

```bash
/teaching:lecture "RCBD" --from-plan=week08 --output-dir=content/lectures/
# → content/lectures/week08-rcbd.qmd

/teaching:lecture "ANOVA"
# → ./lecture-anova.qmd
```

- Directories are auto-created when `--output-dir` is specified
- Use `--force` to skip the overwrite confirmation prompt
- Week numbers are zero-padded (`week08`, not `week8`)

### Generation Metadata

Every generated `.qmd` now includes provenance metadata as YAML comments in the frontmatter:

```yaml
---
title: "RCBD"
# --- Scholar Generation Metadata --
# generated: 2026-02-03T14:30:00Z
# scholar_version: 2.5.0
# prompt_template: lecture-notes
# config_source: .flow/teach-config.yml
# lesson_plan: week08
# generation_time: 45.2s
# sections: 8
# --
```

These comments are invisible to Quarto rendering but allow Scholar to track which version, config, and template produced each file.

### Section-Level Refinement (`-refine`)

Refine specific sections without regenerating the full 20-40 page lecture:

```bash
# Refine one section
/teaching:lecture --refine=content/lectures/week08-rcbd.qmd \
  --section="Worked Examples" \
  --instruction="Add two more worked examples with R code"

# Full-lecture refinement (no -section)
/teaching:lecture --refine=content/lectures/week08-rcbd.qmd \
  --instruction="Use tidyverse syntax throughout"
```

- Section matching is fuzzy: "Worked Example" matches "Worked Examples"
- The refiner includes surrounding section context for continuity
- Provenance is updated with a `# refined:` record after each refinement
- Without AI credentials, falls back to appending an HTML comment with the instruction

### Week-over-Week Continuity (`-context`)

Lectures can reference previous weeks so content builds naturally across the semester:

```bash
/teaching:lecture "RCBD" --from-plan=week08 --context=previous
# Loads weeks 5, 6, 7 and injects topic/objective summaries into the prompt
```

- Default window: 3 previous weeks
- Configurable: `--context=1` for just last week, `--context=5` for wider range
- Early weeks degrade gracefully (week 1 gets nothing, week 2 gets only week 1)

### Coverage Validation (`-check`)

Verify that a generated lecture covers all lesson plan objectives before class:

```bash
/teaching:lecture --check=content/lectures/week08-rcbd.qmd --from-plan=week08

# Coverage Report: week08-rcbd.qmd
# vs week08.yml
# ───────────────────────────────────────────────────
#
# Learning Objectives:
#   [x] LO-8.1: Understand RCBD design     (Section 2, 3)
#   [ ] LO-8.2: Interpret ANOVA table       (NOT FOUND)
#
# Coverage: 1/2 (50%) - 1 gap(s) found
```

- Exit code 0 for 100% coverage, 1 for gaps (CI-friendly)
- Uses keyword matching with stop-word filtering
- Strips Bloom's taxonomy verbs for better matching

### Auto-Preview (`-open`)

Launch Quarto preview immediately after generation or refinement:

```bash
/teaching:lecture "RCBD" --from-plan=week08 --output-dir=content/lectures/ --open
```

- Works with both generation and refinement modes
- Uses AppleScript on macOS for reliable app launching
- Requires `quarto` CLI to be installed

---

## New Modules

| Module                                         | Purpose                                    |
| ---------------------------------------------- | ------------------------------------------ |
| `src/teaching/utils/slugify.js`                | Shared slugify + filename generation       |
| `src/teaching/utils/qmd-parser.js`             | QMD section parsing, matching, replacement |
| `src/teaching/utils/preview-launcher.js`       | Quarto preview launch                      |
| `src/teaching/generators/lecture-refiner.js`   | Section/full refinement                    |
| `src/teaching/validators/lecture-coverage.js`  | Lesson plan coverage validation            |

## Modified Modules

| Module                                         | Changes                                 |
| ---------------------------------------------- | --------------------------------------- |
| `src/teaching/generators/lecture-notes.js`     | Provenance tracking, context injection  |
| `src/teaching/formatters/quarto-notes.js`      | Provenance comments in frontmatter      |
| `src/teaching/utils/dry-run.js`                | Uses shared slugify, output-dir support |
| `src/teaching/utils/lesson-plan-loader.js`     | Previous week context loading           |
| `src/plugin-api/commands/teaching/lecture.md`  | All new flags and 3 command modes       |

---

## Test Coverage

191 new tests covering all v2.5.0 features:

| Suite                   | Tests |
| ----------------------- | ----- |
| Output + provenance     | 28    |
| Phase 2-3 integration   | 47    |
| QMD parser edge cases   | 34    |
| Slugify edge cases      | 14    |
| Refiner unit tests      | 15    |
| Coverage validator      | 20    |
| Dry-run utility         | 22    |
| E2E round-trips         | 11    |

Full suite: 1657 tests passing.

---

## Migration Notes

- **Backward compatible:** All new flags are optional. Existing usage with just `topic` or `--from-plan` continues to work identically.
- **Flag rename:** `--output` is now `--output-dir` for clarity. The old flag is not supported.
- **Provenance comments:** New `.qmd` files will include `# --- Scholar Generation Metadata --` blocks. These are YAML comments and do not affect Quarto rendering.

---

## Related Documentation

- [Full technical reference](v2.5.0-weekly-lecture-production.md)
- [API Reference](TEACHING-COMMANDS-API.md) (updated for v2.5.0)
