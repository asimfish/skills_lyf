# SPEC: Preflight Dogfood Testing Pipeline

**Status:** draft
**Priority:** medium
**Created:** 2026-02-27
**Source:** Insights analysis (327 sessions, 37 buggy_code + 48 wrong_approach friction events)
**Target:** v2.16.0 (alongside examark-qti integration)

---

## Overview

Extend `/teaching:preflight` with a `--dogfood` flag that exercises all teaching commands against real fixtures, validating invocation syntax, config loading, and output schema compliance. Catches regressions that unit tests miss by running commands end-to-end in dry-run mode.

The insights report identified "friction-aware test generation that catches real bugs" as a key opportunity. During v2.14.0 development, dogfood tests uncovered genuine runtime bugs (marker concatenation errors, invokeRestart crashes). This spec formalizes that pattern into preflight's check-runner architecture.

---

## Primary User Story

> As a Scholar maintainer preparing a release, I want preflight to verify that all teaching commands are functional (not just that versions are synced) so that I catch command-breaking regressions before shipping.

---

## Secondary User Stories

> As a CI pipeline, I want dogfood checks in JSON format so I can fail PRs that break command invocations.

<!-- -->

> As a contributor, I want `preflight --dogfood --debug` to show timing per command so I can identify slow or hanging commands.

---

## Architecture

### Existing Check-Runner (Reuse)

The preflight system (`src/teaching/validators/preflight.js`, 385 lines) uses a functional check pattern:

- Individual check functions return `{ name, status, detail, fixable }`
- `runAllChecks(options)` orchestrates execution and aggregation
- Three-level severity: `pass | warn | fail`
- `--fix` dispatches to `applyFix()` for fixable checks
- `--json` outputs structured results for CI

### New Dogfood Checks (3 modules)

```
src/teaching/validators/
├── preflight.js              # Existing orchestrator (modify)
├── checks/
│   ├── dogfood-commands.js   # NEW: Command invocation checks
│   ├── dogfood-schemas.js    # NEW: Output schema validation
│   └── dogfood-demo.js       # NEW: Demo course scaffold checks
```

### Data Flow

```
preflight --dogfood
  │
  ├── Existing 6 checks (version-sync, conflict-markers, cache, changelog, status, test-counts)
  │
  └── NEW dogfood checks (gated behind --dogfood flag)
      ├── dogfood-commands: invoke 10 AI commands (--dry-run) + 4 static commands
      ├── dogfood-schemas: validate 5 fixture files against JSON schemas
      └── dogfood-demo: verify demo scaffold integrity (6 templates)
```

---

## Command Invocation Test Matrix

### AI-Capable Commands (10, dry-run mode — no API calls)

| Command | Test Invocation | Validates |
| --- | --- | --- |
| exam | `exam midterm --dry-run --json` | JSON schema, question types, point totals |
| quiz | `quiz "Descriptive Statistics" --dry-run --json` | Question types, difficulty, answer keys |
| lecture | `lecture "Linear Regression" --dry-run --json` | Outline structure, sections, objectives |
| slides | `slides "Probability" --dry-run --json` | Slide structure, objectives, examples |
| assignment | `assignment "Regression" --dry-run --json` | Problem count, difficulty levels |
| rubric | `rubric "Project" 100 --dry-run --json` | Criteria count, point totals, levels |
| solution | `solution "Chapter 5" --dry-run --json` | Answer format, explanations |
| syllabus | `syllabus --dry-run --json` | 15-week schedule, grading, policies |
| feedback | `feedback fixture.md --dry-run --json` | Feedback structure, rubric ref |
| validate | `validate --all --strict` | Schema compliance on fixture configs |

### Static Commands (4, direct execution)

| Command | Test Invocation | Validates |
| --- | --- | --- |
| demo | `demo --verify --force` (temp dir) | Directory structure, manifest valid |
| config | `config status` | Config discovery, schema valid |
| sync | `sync --status --dry-run` | Detects changed files correctly |
| validate-r | `validate-r fixtures/` | R code blocks parse without errors |

### Excluded Commands (3)

| Command | Reason |
| --- | --- |
| preflight | Can't self-invoke recursively |
| diff | Requires two existing prompt files |
| migrate | Destructive operation, needs specific old-format input |

---

## CLI Interface

```bash
# Full preflight + dogfood
/teaching:preflight --dogfood

# Dogfood checks only (skip static checks)
/teaching:preflight --dogfood-only

# With timing breakdown
/teaching:preflight --dogfood --debug

# JSON for CI
/teaching:preflight --dogfood --json

# Skip dogfood for quick runs (default behavior preserved)
/teaching:preflight
```

---

## JSON Output Extension

```json
{
  "checks": [
    { "name": "version-sync", "status": "pass", "detail": "..." },
    { "name": "conflict-markers", "status": "pass", "detail": "..." },
    {
      "name": "teaching-commands",
      "status": "pass",
      "detail": "14/14 commands invocable",
      "fixable": false,
      "subresults": [
        {
          "category": "AI Commands (dry-run)",
          "tests": [
            {
              "command": "exam",
              "status": "pass",
              "duration_ms": 2847,
              "schema_valid": true
            }
          ],
          "passed": 10,
          "failed": 0
        },
        {
          "category": "Static Commands",
          "tests": [
            {
              "command": "demo",
              "status": "pass",
              "files_created": 8
            }
          ],
          "passed": 4,
          "failed": 0
        }
      ]
    },
    {
      "name": "output-schemas",
      "status": "pass",
      "detail": "5/5 fixture files valid"
    },
    {
      "name": "demo-course",
      "status": "pass",
      "detail": "6/6 templates present, config valid"
    }
  ],
  "passed": 9,
  "failed": 0,
  "warned": 0,
  "dogfood": true
}
```

---

## Existing Fixtures (Reuse)

| Fixture | Path | Used By |
| --- | --- | --- |
| STAT-101 config | `src/teaching/demo-templates/teach-config.yml` | config, validate |
| 15-week manifest | `src/teaching/demo-templates/lesson-plans.yml` | sync, validate |
| Midterm exam JSON | `tests/teaching/fixtures/exam-midterm.json` | exam schema check |
| Quiz markdown | `tests/teaching/fixtures/quiz-descriptive.md` | quiz check |
| Assignment markdown | `tests/teaching/fixtures/assignment-regression.md` | assignment check |
| Rubric markdown | `tests/teaching/fixtures/rubric-project.md` | rubric check |
| Slides outline | `tests/teaching/fixtures/slides-probability.md` | slides check |

---

## Performance Budget

| Category | Tests | Duration | Notes |
| --- | --- | --- | --- |
| AI Commands (dry-run) | 10 | ~30s | No API calls, validates invocation path |
| Static Commands | 4 | ~5s | Local FS operations only |
| Output Schemas | 5 | <1s | JSON schema validation |
| Demo Course | 6 | ~2s | Verify scaffold integrity |
| **Total** | **25** | **~38s** | Fits in 60s CI budget |

---

## Dependencies

| Dependency | Version | Notes |
| --- | --- | --- |
| ajv | existing | Schema validation (already in project) |
| Node.js | >= 20.19.0 | Required for --experimental-vm-modules |
| Demo templates | existing | `src/teaching/demo-templates/` |
| Test fixtures | existing | `tests/teaching/fixtures/` |

---

## Acceptance Criteria

- [ ] `preflight --dogfood` runs all 25 checks and reports pass/fail
- [ ] `preflight --dogfood --json` outputs CI-friendly structured results
- [ ] `preflight --dogfood --debug` shows per-command timing
- [ ] `preflight` (no flag) behavior is unchanged — dogfood checks are opt-in
- [ ] AI command checks use `--dry-run` exclusively (zero API calls)
- [ ] Demo course check creates temp dir, validates, cleans up
- [ ] Total dogfood execution time < 60 seconds
- [ ] CI workflow updated to run `preflight --dogfood` on PRs

---

## Integration Checklist

- [ ] `src/discovery/index.js` — no change (no new command)
- [ ] `tests/discovery/discovery.test.js` — no change
- [ ] `.github/workflows/ci.yml` — add `preflight --dogfood --json` step
- [ ] `mkdocs.yml` — update test count after adding dogfood tests
- [ ] `docs/tutorials/teaching/preflight.md` — add dogfood section

---

## Open Questions

- [ ] Should dogfood checks run in CI on every PR, or only on release PRs?
- [ ] Should `--dogfood-only` be a separate flag or should `--dogfood` alone skip static checks?
- [ ] Should we add a `--skip-slow` flag for AI command checks that timeout?

---

## Implementation Notes

- **Implementation order:** dogfood-demo (simplest) → dogfood-schemas → dogfood-commands
- **Testing:** Add Jest tests for each dogfood check module (mock command invocations for unit tests, real invocation for integration tests)
- **Reuse `TEST-CHECKLIST.md`** from demo-templates as assertion reference (23 existing manual checks to automate)
- **Error handling:** Each command invocation must have a timeout (10s default) to prevent hanging

---

## Review Checklist

- [ ] Spec reviewed by maintainer
- [ ] Check-runner architecture compatible with existing preflight.js
- [ ] Fixture files sufficient for all command checks
- [ ] Performance budget validated with dry-run measurements
- [ ] CI integration tested in feature branch

---

## History

| Date | Change |
| --- | --- |
| 2026-02-27 | Initial spec from insights brainstorm (Session 84) |
