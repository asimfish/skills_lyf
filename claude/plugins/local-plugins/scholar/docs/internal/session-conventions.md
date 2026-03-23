# Session Conventions

The `.STATUS` file tracks project state, session history, and release milestones. This page documents its format so future sessions maintain consistency.

---

## Header Fields

The first block of the `.STATUS` file uses YAML-like key-value pairs:

```yaml
status: Active                    # Active | Paused | Complete
progress: 100                     # 0-100, percentage toward current target
next: Plan v2.7.0 features       # What the next session should focus on
target: v2.7.0 - Feature Name    # Current development target
milestone: v2.7.0 released | 2,071 tests | All CIs green
last_session: 2026-02-03 - Brief description (Session 53)
complexity: Medium                # Low | Medium | High
risk_level: Low                   # Low | Medium | High
dependencies: Claude API, js-yaml, ajv, ...
```

**Rules:**

- `progress` resets to 0 when `target` changes
- `milestone` is a pipe-separated summary of the most recent achievement
- `last_session` includes date, description, and session number
- `dependencies` lists runtime dependencies (not dev dependencies)

---

## Session Summary Template

Each session gets a markdown block appended below the header:

```markdown
# Session NN Summary (YYYY-MM-DD)

**Commits:** N (types: feat, fix, docs, test, chore)

**Completed:**
- Bullet points of what was accomplished
- Include specific numbers (tests added, files changed, lines deleted)

**Tests:** N,NNN pass | N failures | NN suites

**Commits:**
- `abcdef1` type: short description
- `1234567` type: short description

---
```

**Rules:**

- Session numbers are sequential (never reuse, never skip)
- Separate sessions with `---` horizontal rules
- Include commit hashes (short form, 7 chars)
- Test counts go in the session where they changed
- Use `**Commits:** N (types)` as the first line for quick scanning
- PR numbers use `#NN` format when applicable
- Release sessions include `**Releases:** vX.Y.Z` in the summary header

---

## Release History Table

Maintained at the bottom of the `.STATUS` file:

```markdown
# Release History

| Version | Date | Highlights |
|---------|------|-----------|
| v2.8.0 | 2026-02-09 | Slide revision & validation, --revise/--check |
| v2.7.0 | 2026-02-05 | Scholar Hub, command discovery |
| v2.6.3 | 2026-02-04 | Doc fixes, anchor repairs |
| v2.6.2 | 2026-02-03 | CI fixes, doc cleanup |
| ...     | ...  | ...       |
```

**Rules:**

- Newest release at the top
- Highlights are brief (under 60 chars)
- Date format: `YYYY-MM-DD`
- Version includes `v` prefix

---

## Example Session Entry

```markdown
# Session 48 Summary (2026-02-02)

**Commits:** 5 (4 feat + 1 fix)

**Completed (Phase 2: 4 Features):**

| Wave | Feature | Tests |
| ---- | ------- | ----- |
| 0 | Shared utilities (hash, safe-write, discovery, validator) | 52 |
| 1 | Demo wiring + schema export (Features 1 & 3) | 49 |
| 2 | Manifest migrator (Feature 2: --to-manifest) | 31 |
| 3 | Bidirectional sync engine (Feature 4) | 30 |

**Test Growth:** 1,793 -> 1,983 (+162 new tests)

**Commits:**
- `c9c577f` feat: extract shared utilities for config-flow Phase 2
- `2eab8ef` feat: add demo wiring and schema export (Wave 1)
- `1370e03` feat: add manifest migrator for directory-to-manifest migration (Wave 2)
- `36959b9` feat: add week-level bidirectional sync engine (Feature 4)

---
```

This session entry demonstrates several conventions: wave-based table for phased work, test growth tracking with delta, and commit listing with hashes.

---

## When to Update .STATUS

| Event | What to Update |
|-------|---------------|
| Start session | Increment session number |
| Complete work | Add session summary block |
| Release | Add to release history table, update header milestone |
| Change target | Update `target`, reset `progress` to 0 |
| End session | Update `last_session`, `progress`, and `next` |
