# SPEC: Insights-Driven Enhancements

**Status:** approved
**Version Target:** v2.15.0
**Created:** 2026-02-23
**Source:** Insights report (341 sessions, 2025-12-24 to 2026-02-19)
**From Brainstorm:** Session brainstorm, insights analysis

---

## Overview

Enhancements to Scholar derived from analyzing 341 Claude Code sessions. The insights reveal three primary friction patterns: wrong initial approach (59 events), buggy generated code (41 events), and tool limitations (11 events). These enhancements target the root causes with validation pipelines, pre-flight checks, and standardized command patterns.

---

## Enhancement 1: R Validation Pipeline Integration

### User Story

> As an instructor generating teaching content with R code, I want all R-producing commands to automatically validate their output so that I don't publish solution keys, assignments, or lectures with incorrect computations.

### Problem

Currently `/teaching:validate-r` is standalone. Four commands produce `.qmd` files with R chunks (solution, assignment, lecture, slides), but only solution has a `--validate` flag. Instructors must remember to run validation separately, leading to the 41 "buggy_code" friction events where inline interpretations don't match actual R output.

### Acceptance Criteria

- [ ] `--validate` flag available on: `/teaching:solution`, `/teaching:assignment`, `/teaching:lecture`, `/teaching:slides`
- [ ] When `--validate` is passed, automatically invoke `/teaching:validate-r` on the generated `.qmd` file
- [ ] Validation results shown inline (pass/fail per chunk)
- [ ] If validation fails, offer to auto-fix and re-validate
- [ ] Shared implementation in `src/teaching/utils/validate-pipeline.js`

### Architecture

```
Command (solution/assignment/lecture/slides)
  │
  ├── Generate content (AI)
  ├── Save .qmd file
  ├── if --validate:
  │     ├── Extract R chunks → temp .R script
  │     ├── Run via Rscript
  │     ├── Compare output to inline text
  │     ├── Report pass/fail per chunk
  │     └── if failures: offer auto-fix cycle
  └── Done
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/teaching/utils/validate-pipeline.js` | Create | Shared validation orchestrator |
| `src/plugin-api/commands/teaching/assignment.md` | Modify | Add `--validate` flag + implementation |
| `src/plugin-api/commands/teaching/lecture.md` | Modify | Add `--validate` flag + implementation |
| `src/plugin-api/commands/teaching/slides.md` | Modify | Add `--validate` flag + implementation |
| `tests/teaching/validate-pipeline.test.js` | Create | Unit tests for shared pipeline |

### Dependencies

- Rscript must be available in PATH
- Existing `/teaching:validate-r` command logic

### Priority

High — addresses top friction pattern (buggy_code: 41 events)

---

## Enhancement 2: `/teaching:preflight` Command

### User Story

> As a developer preparing a Scholar release, I want a single pre-flight check that catches all common issues (version drift, merge conflict markers, stale test counts, missing cache cleanup) so that I don't waste time debugging CI failures after pushing.

### Problem

The insights show 59 "wrong approach" events and 30+ release sessions with recurring friction: version string drift, CHANGELOG lint failures, stale `cache.json`, merge conflict markers surviving into commits. These are all detectable before committing.

### Acceptance Criteria

- [ ] New command: `/teaching:preflight`
- [ ] Checks performed:
  - Version consistency: `package.json` vs `plugin.json` vs `mkdocs.yml`
  - Merge conflict markers: scan all `.md` and `.js` files for `<<<<<<<`
  - Test count validation: actual Jest/node:test counts vs `mkdocs.yml` values
  - Cache cleanup: warn if `src/discovery/cache.json` exists
  - CHANGELOG lint: top entry matches current version
  - `.STATUS` file freshness
- [ ] Output: table with status per check (pass/warn/fail)
- [ ] `--fix` flag to auto-fix what's fixable
- [ ] Exit code 0 (all pass) or 1 (any fail) for CI integration

### Architecture

```
/scholar:preflight [--fix] [--json]
  │
  ├── Version check (package.json vs plugin.json vs mkdocs.yml)
  ├── Conflict marker scan (*.md, *.js)
  ├── Test count validation (run tests, compare to mkdocs.yml)
  ├── Cache cleanup check (cache.json existence)
  ├── CHANGELOG lint (top entry matches version)
  ├── .STATUS freshness check
  │
  └── Report table:
      ┌──────────────────┬────────┬──────────────────────┐
      │ Check            │ Status │ Detail               │
      ├──────────────────┼────────┼──────────────────────┤
      │ Version sync     │ PASS   │ v2.14.0 everywhere   │
      │ Conflict markers │ FAIL   │ solution.md:90       │
      │ Test counts      │ WARN   │ 2877 vs 2856 in yml  │
      │ Cache cleanup    │ PASS   │ No stale cache       │
      │ CHANGELOG        │ PASS   │ v2.14.0 entry found  │
      │ .STATUS          │ WARN   │ Last updated 3d ago  │
      └──────────────────┴────────┴──────────────────────┘
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/plugin-api/commands/teaching/preflight.md` | Create | Command definition |
| `src/teaching/validators/preflight.js` | Create | Check implementations |
| `tests/teaching/preflight.test.js` | Create | Unit tests |
| `src/discovery/index.js` | Modify | Add to subcategory map |
| `tests/discovery/discovery.test.js` | Modify | Update command counts |
| `.github/workflows/ci.yml` | Modify | Add preflight to CI |

### Dependencies

None beyond existing project structure.

### Priority

High — addresses #1 friction pattern (wrong_approach: 59 events) and release friction (30+ sessions)

---

## Enhancement 3: Dry-Run Standardization

### User Story

> As an instructor, I want every teaching command to support `--dry-run` so that I can preview what will be generated before making expensive AI API calls.

### Problem

Dry-run support is inconsistent across teaching commands. Some have it (solution, assignment, exam, quiz), others don't (lecture, slides, rubric, feedback). The shared `src/teaching/utils/dry-run.js` utility exists but isn't used universally.

### Acceptance Criteria

- [ ] All 16 teaching commands support `--dry-run`
- [ ] All use the shared `dry-run.js` utility
- [ ] Dry-run output shows: command name, options, estimated token usage, output path
- [ ] `--json` flag works with `--dry-run` for programmatic use
- [ ] No API calls made during dry-run

### Audit: Current Dry-Run Support

| Command | Has `--dry-run`? | Uses shared `isDryRun/executeDryRun`? |
|---------|-----------------|--------------------------------------|
| solution | Yes | Yes |
| assignment | Yes | Yes |
| exam | Yes | Yes |
| quiz | Yes | Yes |
| slides | Yes | Yes |
| lecture | Yes | Yes |
| rubric | Yes | Yes |
| feedback | Yes | Yes |
| syllabus | Yes | Yes |
| demo | Has references | N/A (scaffolding) |
| validate | Has references | N/A (YAML validation, no AI) |
| validate-r | Yes | No (own implementation via Rscript) |
| diff | N/A | N/A (comparison tool) |
| sync | Has references | N/A (config sync, no AI) |
| migrate | Has references | N/A (schema migration, no AI) |
| config | N/A | N/A (utility) |

**Audit result:** All 9 AI-generating commands already use the shared dry-run utility. The remaining 5 with "Has references" mention dry-run in docs/examples but don't need it (no AI calls). **Enhancement #3 scope is smaller than expected** — the main gap is `validate-r` using its own implementation instead of the shared utility.

### Files to Modify

- Commands missing `--dry-run`: add flag + handler using shared utility
- `src/teaching/utils/dry-run.js`: ensure it handles all command types

### Priority

Medium — consistency improvement, low risk

---

## Enhancement 4: Email Integration Standardization

### User Story

> As an instructor, I want to email generated content (solutions, rubrics, exams) directly to TAs or students from any teaching command, without needing separate email steps.

### Problem

The `--send` flag was added to `/teaching:solution` but the pattern should be available on other content-generating commands. Currently each command would need its own email formatting logic.

### Acceptance Criteria

- [ ] Shared `src/teaching/utils/send-output.js` utility
- [ ] `--send [EMAIL]` flag on: solution, assignment, exam, quiz, rubric
- [ ] Email recipient resolution: flag value > `course.staff.ta_email` from config
- [ ] Preview before send (himalaya MCP compose_email with confirm: false)
- [ ] Subject line auto-generated from command type + content title

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/teaching/utils/send-output.js` | Create | Shared email utility |
| Commands (5) | Modify | Add `--send` flag + handler |
| `tests/teaching/send-output.test.js` | Create | Unit tests |

### Priority

Low — nice-to-have, `--send` on solution covers primary use case

---

## Enhancement 5: Merge Conflict Guard for Command Files

### User Story

> As a developer working on Scholar, I want CI to warn me when a PR modifies command `.md` files that have also been modified on the target branch, so that I can resolve conflicts proactively.

### Problem

Scholar's command files (`src/plugin-api/commands/teaching/*.md`) are both executable prompts AND documentation — high conflict risk when two features touch the same command. We just resolved 3 conflicts in `solution.md` from `--validate` and `--send` landing on different branches.

### Acceptance Criteria

- [ ] CI check in PR workflow: detect command files modified on both PR branch and target branch
- [ ] Warning comment on PR if conflicts likely
- [ ] List specific files at risk

### Architecture

```yaml
# In .github/workflows/ci.yml
- name: Check for command file conflicts
  run: |
    # Files modified in this PR
    PR_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }}...HEAD)
    # Files modified on target since branch point
    TARGET_FILES=$(git diff --name-only HEAD...${{ github.event.pull_request.base.sha }})
    # Intersection in command files
    CONFLICTS=$(comm -12 <(echo "$PR_FILES" | grep 'src/plugin-api/commands/' | sort) \
                         <(echo "$TARGET_FILES" | grep 'src/plugin-api/commands/' | sort))
    if [ -n "$CONFLICTS" ]; then
      echo "::warning::Potential merge conflicts in command files: $CONFLICTS"
    fi
```

### Priority

Low — preventive measure, merge conflicts are manageable manually

---

## Implementation Order

| Phase | Enhancement | Effort | Impact |
|-------|-------------|--------|--------|
| 1 | #1 R Validation Pipeline | 4-6h | High (41 buggy_code events) |
| 2 | #2 `/teaching:preflight` | 4-6h | High (59 wrong_approach events) |
| 3 | #3 Dry-Run Standardization | 2-3h | Medium (consistency) |
| 4 | #4 Email Standardization | 3-4h | Low (convenience) |
| 5 | #5 Merge Conflict Guard | 1h | Low (preventive) |

---

## Resolved Questions

**Q1: Should the preflight command live under `teaching:` or `scholar:`?**
**Answer: `teaching:preflight`** — Keeps it in the `teaching:` namespace alongside other dev utilities (`validate`, `sync`, `config`, `migrate`). The teaching namespace already contains non-content commands, so preflight fits the pattern of "tools instructors/developers use to maintain teaching infrastructure."

**Q2: Should the R validation pipeline support Python chunks too?**
**Answer: R-only now, design for extensibility.** Name the utility `validate-pipeline.js` (not `validate-r-pipeline.js`), accept a `language` parameter, but only implement the R codepath. Three commands already accept `--language R|Python`, so Python is eventual. A future `/teaching:validate-py` plugs into the same pipeline.

**Q3: Should `--validate` be opt-in or opt-out?**
**Answer: Opt-in (`--validate` flag).** Validation requires Rscript in PATH (not guaranteed), adds 5-30s overhead, and is a "check before publishing" step, not an every-generation step. Consistent with solution command's existing `--validate`. Users who always want it can set `defaults.auto_validate: true` in teach-config.

**Q4: Should email require himalaya MCP or support SMTP fallback?**
**Answer: Himalaya MCP only.** Scholar runs inside Claude Code's tool environment where himalaya is already configured. SMTP means managing credentials/TLS — unnecessary complexity. If himalaya isn't available, a clear error message suffices. YAGNI.

---

## Review Checklist

- [x] Open questions resolved (all 4 answered interactively)
- [x] Dry-run audit completed (9/9 AI commands already use shared utility)
- [x] Implementation order confirmed (Phases 1-5)
- [ ] Test strategy for each enhancement
- [ ] Documentation plan (docs site, CHANGELOG, WHATS-NEW)
- [x] Version target confirmed: **v2.15.0**

---

## History

| Date | Change |
|------|--------|
| 2026-02-23 | Initial spec from insights analysis |
| 2026-02-23 | Resolved 4 open questions, completed dry-run audit, updated Enhancement #3 scope |
| 2026-02-23 | Approved — target v2.15.0, implementation order confirmed |
