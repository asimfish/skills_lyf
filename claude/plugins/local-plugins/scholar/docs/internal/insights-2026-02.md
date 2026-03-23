# Insights Report — February 2026

**Source:** Claude Code usage data (341 sessions, 3,791 messages, 2025-12-24 to 2026-02-19)
**Action taken:** Spec approved for v2.15.0 enhancements ([SPEC](../specs/SPEC-2026-02-23-insights-driven-enhancements.md))

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Sessions analyzed | 341 |
| Messages | 3,791 |
| Satisfaction (likely) | 92.5% |
| Fully achieved | 72.5% |
| Top tool | Bash (10,003 calls) |
| Parallel sessions | 113 events (18%) |

## Friction Patterns

These are the root causes behind failed or frustrating sessions. Each pattern was mapped to either an existing mitigation (CLAUDE.md rule) or a new enhancement in v2.15.0.

| Pattern | Count | Mitigation |
|---------|-------|------------|
| Wrong initial approach | 59 | v2.15.0: `/teaching:preflight` command |
| Buggy generated code | 41 | v2.15.0: R Validation Pipeline (`--validate`) |
| Tool limitation | 11 | CLAUDE.md rules (CWD pinning, shell escaping) |
| Misunderstood request | 10 | CLAUDE.md rule (action verb execution) |
| User rejected action | 10 | CLAUDE.md rule (no plan mode on action verbs) |

### Wrong Approach Details (59 events)

Most common sub-patterns:
- Entering plan mode when user wanted immediate execution
- Dismissing user bug reports without investigating
- Version string drift across `package.json`, `plugin.json`, `mkdocs.yml`
- Stale `cache.json` surviving into commits
- CHANGELOG lint failures caught only after pushing

### Buggy Code Details (41 events)

Most common sub-patterns:
- Inline R interpretations not matching actual Rscript output
- p-values, test statistics, CI bounds copied incorrectly
- Stale references to old versions in generated content
- Generated `.qmd` files with `eval: false` placeholders instead of runnable code

## What Works Well

| Capability | Evidence |
|------------|----------|
| Multi-file changes | 139 successful instances (most valued) |
| Release pipelines | Dozens of releases driven end-to-end |
| Multi-agent orchestration | Parallel agents in worktrees for large features |
| Documentation-as-code | 2,755 markdown touches, 40 doc sessions |

## Top Session Goals

1. Git operations (75 sessions)
2. Documentation update (40)
3. Code review (21)
4. Status update (20)
5. Commit and push (20)
6. Bug fix (20)

## Enhancements Derived

All 5 enhancements in v2.15.0 trace directly to this data:

| Enhancement | Friction Source | Expected Impact |
|-------------|---------------|-----------------|
| R Validation Pipeline | buggy_code (41) | Catch incorrect R output before publishing |
| `/teaching:preflight` | wrong_approach (59) | Pre-flight checks prevent CI failures |
| Dry-Run Standardization | wrong_approach (consistency) | Align validate-r with shared utility |
| Email Integration | tool_limitation | Reduce manual email steps |
| Merge Conflict Guard | wrong_approach (release friction) | Warn about overlapping command edits |

## Future Ideas (Not Yet Scoped)

These emerged from the analysis but are not part of v2.15.0:

1. **Custom `/release` skill** — Single command for the full release pipeline
2. **Post-edit version check hook** — Auto-detect version drift after Edit/Write
3. **Headless post-merge doc sync** — CI job scans docs for stale refs
4. **Autonomous release** — CI polling loop with self-diagnosing failures
5. **Parallel multi-agent refactoring** — Domain-owned worktrees with test gates
