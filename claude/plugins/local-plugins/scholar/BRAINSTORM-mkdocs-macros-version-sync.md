# Brainstorm: MkDocs Macros Plugin for Version Sync

**Mode:** Feature | **Depth:** Default | **Date:** 2026-02-09
**From:** Session 63 — manual version sync of 49 files highlighted the pain

---

## Problem Statement

Every Scholar release requires manually updating version strings and test counts across ~50 files. This session's v2.8.0 sync touched 49 files with 81 insertions and 77 deletions, all for simple string replacements. The process is:

1. **Error-prone** — easy to miss files or update historical references by mistake
2. **Time-consuming** — ~30 minutes of grep-read-edit cycles per release
3. **Tedious** — mechanical work that adds no value

## Current State

| Pattern | Example | Count | Where |
|---------|---------|-------|-------|
| `**Version:** X.Y.Z` | `**Version:** 2.8.0` | ~15 | Doc footers |
| `**Document Version:** X.Y.Z` | `**Document Version:** 2.8.0` | ~10 | Research/workflow docs |
| Badge URL | `version-2.8.0-blue.svg` | 2 | index.md, README.md |
| Test count | `2,252 tests` | ~12 | Guides, READMEs, architecture |
| `**Latest:** vX.Y.Z` | `**Latest:** v2.8.0` | ~3 | Quick start, index |
| `Scholar vX.Y.Z` | `Scholar v2.8.0` | ~5 | Titles, troubleshooting |
| Command count | `28 commands` | ~3 | Quick start, badges |
| `**API Version:** X.Y.Z` | `**API Version:** 2.8.0` | 1 | Phase 2 API ref |

**Total: ~50 files affected per release**

## Proposed Solution

### Layer 1: MkDocs Macros Plugin (docs/ — ~40 files)

Add `mkdocs-macros-plugin` and define `extra:` variables in `mkdocs.yml`:

```yaml
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
    suite_count: 77

plugins:
  - search
  - macros
```

Then in any docs page, replace hardcoded values:

```markdown
<!-- Before -->
**Version:** 2.8.0

<!-- After -->
**Version:** {{ scholar.version }}
```

**Key benefit:** Change `mkdocs.yml` once → all 40+ doc pages updated.

### Layer 2: Script for Root Files (~9 files)

Root-level files (README.md, CLAUDE.md, plugin.json, CHANGELOG.md, tests/README.md) can't use Jinja2 templates because they're viewed raw on GitHub. Options:

**Option A: Node.js sync script** (`scripts/version-sync.js`)
- Read version from `package.json`, test count from last Jest run
- Apply regex replacements to known files
- Run as `npm run sync:version`

**Option B: bump2version** (`.bumpversion.cfg`)
- Handles version strings across files
- One command: `bump2version minor`
- Doesn't handle test counts

**Recommendation:** Option A — we already have `scripts/sync-yaml.js`, keep the pattern.

### Layer 3: CI Validation

Add a CI step that verifies version consistency:
- `package.json` version matches `plugin.json` version
- `mkdocs.yml extra.scholar.version` matches `package.json`
- Fails CI if out of sync

## Quick Wins

1. **Add macros plugin** — `pip install mkdocs-macros-plugin`, add to `mkdocs.yml`
2. **Define `extra:` variables** — version, test count, command count
3. **Convert 5 highest-churn files first** — index.md, QUICK-START, ADHD-QUICK-START, CONTRIBUTING, TESTING-GUIDE

## Medium Effort

4. **Convert remaining ~35 doc footers** — systematic replacement pass
5. **Create `scripts/version-sync.js`** — handles README.md, CLAUDE.md, plugin.json
6. **Add CI version check** — GitHub Actions step comparing versions

## Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Macros plugin | Zero-touch for docs, single source | Raw markdown on GitHub shows `{{ }}` syntax |
| Sync script | Works for all files, no template syntax | Custom code to maintain |
| bump2version | Battle-tested, one command | Python dep, no test counts |

## Risk: GitHub Raw Rendering

The biggest trade-off: GitHub renders `.md` files as-is. Pages like `docs/QUICK-START.md` viewed on GitHub would show `{{ scholar.version }}` instead of `2.8.0`. Mitigations:

1. **Accept it** — most users see the MkDocs site, not raw GitHub files
2. **Use macros only in footers** — footers are less visible on GitHub
3. **Keep high-visibility files hardcoded** — index.md badge, QUICK-START header stay hardcoded, handle via sync script

## Recommended Path

→ **Hybrid approach:** macros for doc footers (low GitHub visibility), sync script for badges/headers/root files.

**Phase 1 (Quick):** Add macros plugin + convert footers (~35 files)
**Phase 2 (Script):** Create `scripts/version-sync.js` for root files (~9 files)
**Phase 3 (CI):** Add version consistency check to CI

Expected impact: **Release version sync drops from ~30 min to ~2 min** (run script + update mkdocs.yml extra).

---

**Generated:** 2026-02-09 | Scholar v2.8.0
