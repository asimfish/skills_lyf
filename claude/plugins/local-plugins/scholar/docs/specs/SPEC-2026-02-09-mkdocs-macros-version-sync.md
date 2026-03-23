---
render_macros: false
---

# Spec: MkDocs Macros Plugin for Automated Version Sync

**Status:** Draft
**Created:** 2026-02-09
**Author:** DT
**Affects:** Scholar docs site, release workflow, CI pipeline
**From:** BRAINSTORM-mkdocs-macros-version-sync.md (repo root)

---

## Summary

Replace hardcoded version strings, test counts, and command counts across ~50 files with a two-layer automation system: MkDocs macros plugin for docs (~40 files) and a Node.js sync script for root/GitHub-visible files (~9 files). Add CI validation to prevent drift.

## Motivation

Every Scholar release requires manually updating version strings and test counts across ~50 files. The v2.8.0 release touched 49 files with 81 insertions and 77 deletions — all mechanical string replacements. This process is:

1. **Error-prone** — easy to miss files or update historical references by mistake
2. **Time-consuming** — ~30 minutes of grep-read-edit cycles per release
3. **Tedious** — mechanical work that adds no value

**Expected impact:** Release version sync drops from ~30 min to ~2 min.

## Design Decisions

Resolved during brainstorm (2026-02-09):

| Decision | Choice | Rationale |
| --- | --- | --- |
| Docs templating | mkdocs-macros-plugin (`extra:` variables) | Zero-touch for 40+ docs; single source of truth in mkdocs.yml |
| Root file sync | Node.js script (`scripts/version-sync.js`) | Matches existing `scripts/sync-yaml.js` pattern; handles test counts |
| GitHub raw rendering | Hybrid: macros for footers, script for high-visibility | Footers less visible on GitHub; badges/headers stay readable |
| Version source | `package.json` (authoritative) | Already the npm standard; CI reads it |
| Test count source | Jest output or manual input | Can parse Jest `--json` output or accept CLI arg |
| CI enforcement | GitHub Actions step in Scholar CI | Fails build if versions drift |

---

## Phase 1: MkDocs Macros Plugin (~40 doc files)

### 1.1 Install and Configure

Add `mkdocs-macros-plugin` to the MkDocs build:

```yaml
# mkdocs.yml
plugins:
  - search
  - macros

extra:
  scholar:
    version: "2.8.0"
    prev_version: "2.7.0"
    release_date: "2026-02-09"
    test_count: "2,252"
    jest_count: "2,205"
    node_test_count: "47"
    command_count: 28
    teaching_commands: 13
    research_commands: 14
    hub_commands: 1
    suite_count: 77
```

### 1.2 Template Replacement Patterns

| Pattern | Before | After |
|---------|--------|-------|
| Doc footer | `**Version:** 2.8.0` | `**Version:** {{ scholar.version }}` |
| Doc version | `**Document Version:** 2.8.0` | `**Document Version:** {{ scholar.version }}` |
| API version | `**API Version:** 2.8.0` | `**API Version:** {{ scholar.version }}` |
| Test count | `2,252 tests` | `{{ scholar.test_count }} tests` |
| Command count | `28 commands` | `{{ scholar.command_count }} commands` |
| Latest ref | `**Latest:** v2.8.0` | `**Latest:** v{{ scholar.version }}` |
| Generated line | `Scholar v2.8.0` | `Scholar v{{ scholar.version }}` |

### 1.3 Scope

Convert these categories of files:

- **Doc footers** (~25 files): `**Version:**` and `**Document Version:**` patterns
- **Test count refs** (~8 files): TESTING-GUIDE, CONTRIBUTING, architecture docs
- **Command count refs** (~3 files): QUICK-START, badges
- **API/generated refs** (~4 files): PHASE2 docs, ARCHITECTURE-DIAGRAMS

### 1.4 Exclusions (keep hardcoded)

Files that should NOT use macros (viewed raw on GitHub or contain historical refs):

- `README.md` — GitHub landing page, must render without MkDocs
- `CLAUDE.md` — Claude Code reads raw, not via MkDocs
- `CHANGELOG.md` — historical entries must stay as-is
- `plugin.json` — JSON, not markdown
- `tests/README.md` — viewed raw
- `docs/WHATS-NEW-*.md` — historical version references are intentional
- Any "NEW in vX.Y.Z" labels — historical, not current

---

## Phase 2: Node.js Sync Script (~9 root files)

### 2.1 Script: `scripts/version-sync.js`

```
Usage: node scripts/version-sync.js [--version X.Y.Z] [--tests N] [--dry-run]

Options:
  --version   Version to sync (default: reads package.json)
  --tests     Total test count (default: reads from last Jest run)
  --dry-run   Show changes without writing
```

### 2.2 Target Files

| File | Patterns to Update |
|------|-------------------|
| `README.md` | Badge URLs, test badge, `**Latest version:**`, test counts |
| `CLAUDE.md` | `Current State (vX.Y.Z)`, test count, release URL |
| `.claude-plugin/plugin.json` | `"version"` field |
| `tests/README.md` | Test count |
| `docs/index.md` | Badge URLs (if not converted to macros) |
| `mkdocs.yml` | `extra.scholar.version`, `extra.scholar.test_count` |

### 2.3 npm Script

```json
{
  "scripts": {
    "sync:version": "node scripts/version-sync.js",
    "sync:version:dry": "node scripts/version-sync.js --dry-run"
  }
}
```

### 2.4 Implementation Notes

- Read version from `package.json` as authoritative source
- Use regex replacements with capture groups to preserve surrounding context
- Log each file + change for auditability
- `--dry-run` prints diffs without writing
- Exit with non-zero if no changes found (prevents silent no-ops)

---

## Phase 3: CI Validation

### 3.1 Version Consistency Check

Add a step to `.github/workflows/ci.yml`:

```yaml
- name: Version consistency check
  run: |
    PKG_VERSION=$(node -p "require('./package.json').version")
    PLUGIN_VERSION=$(node -p "require('./.claude-plugin/plugin.json').version")
    MKDOCS_VERSION=$(grep 'version:' mkdocs.yml | head -1 | awk '{print $2}' | tr -d '"')

    if [ "$PKG_VERSION" != "$PLUGIN_VERSION" ]; then
      echo "::error::package.json ($PKG_VERSION) != plugin.json ($PLUGIN_VERSION)"
      exit 1
    fi
    if [ "$PKG_VERSION" != "$MKDOCS_VERSION" ]; then
      echo "::error::package.json ($PKG_VERSION) != mkdocs.yml ($MKDOCS_VERSION)"
      exit 1
    fi
    echo "Version consistent: $PKG_VERSION"
```

### 3.2 What CI Does NOT Check

- Test counts (change with every feature, not every release)
- Historical version references in WHATS-NEW files
- CHANGELOG entries (always historical)

---

## Implementation Plan

### Wave 1: Quick Setup (Phase 1 core)
1. `pip install mkdocs-macros-plugin` and add to `mkdocs.yml` plugins
2. Define `extra.scholar` variables in `mkdocs.yml`
3. Convert 5 highest-churn files: index.md footers, QUICK-START, ADHD-QUICK-START, CONTRIBUTING, TESTING-GUIDE
4. Verify MkDocs build succeeds with no new warnings
5. Verify GitHub raw rendering is acceptable

### Wave 2: Full Footer Conversion (Phase 1 remaining)
6. Convert remaining ~30 doc footers systematically
7. Convert test count references in architecture docs
8. Convert command count references
9. Run full docs validation CI

### Wave 3: Sync Script (Phase 2)
10. Create `scripts/version-sync.js`
11. Add `npm run sync:version` to package.json
12. Test with `--dry-run` against current state
13. Document in release-checklist.md

### Wave 4: CI Guard (Phase 3)
14. Add version consistency step to ci.yml
15. Verify it catches intentional mismatches
16. Update release-checklist.md with new workflow

### Estimated Tests
- ~10 tests for `scripts/version-sync.js` (regex patterns, dry-run, edge cases)
- Manual verification of MkDocs build output
- CI integration test (version mismatch detection)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitHub shows `{{ }}` in raw markdown | Medium — users see template syntax | Only use macros in footers (low visibility); keep headers hardcoded |
| MkDocs macros conflict with existing Jinja2 | Low — no current Jinja2 usage | Test thoroughly in Wave 1 |
| Sync script misses a pattern | Low — same as current manual process | `--dry-run` preview + CI version check |
| Extra build dependency | Low — macros plugin is well-maintained | Pin version in requirements |

## Dependencies

- `mkdocs-macros-plugin` (pip) — [PyPI](https://pypi.org/project/mkdocs-macros-plugin/)
- No new Node.js dependencies (script uses built-in `fs`, `path`)

## Acceptance Criteria

- [ ] `mkdocs build` succeeds with macros plugin enabled
- [ ] All `{{ scholar.* }}` variables render correctly on MkDocs site
- [ ] GitHub raw rendering of footer-only macros is acceptable
- [ ] `npm run sync:version` updates all root files correctly
- [ ] `npm run sync:version --dry-run` shows changes without writing
- [ ] CI fails when `package.json` and `plugin.json` versions differ
- [ ] Release version sync takes < 5 minutes (down from ~30)

---

**Generated:** 2026-02-09 | Scholar v2.8.0
