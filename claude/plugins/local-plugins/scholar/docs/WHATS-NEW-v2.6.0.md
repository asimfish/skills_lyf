# What's New in Scholar v2.6.0

**Latest:** [v2.8.0](https://github.com/Data-Wise/scholar/releases/tag/v2.8.0) - Slide Revision & Validation (Feb 9, 2026)
**Release:** Config-Flow Integration (Phase 2)
**Date:** February 2026

---

## v2.6.3 - Doc Sync & Site Deploy

**Released:** February 4, 2026

### What's New

- Synchronized version refs, test counts, and command counts across 37 documentation files
- Fixed flaky prompt discovery test (decoupled from external template version)
- Synced test count badges to 2,024 across README and docs
- Deployed MkDocs documentation site to GitHub Pages
- Removed stale v2.3.0 social announcement file

**Tests:** 2,024 passing | 71 suites | 100% pass rate

---

## v2.6.2 - CI Fixes & Doc Cleanup

**Released:** February 3, 2026

### What's New

**CI Pipeline Fixes**

- Fixed all 4 Documentation Validation CI jobs (lint, links, structure, spell check)
- Added `workflow_dispatch` trigger and `.markdownlint.json` to CI paths

**Documentation Cleanup (-25,023 lines)**

- Removed `docs/specs/` directory (22 files, -15,449 lines)
- Removed 26 root-level planning files (-9,574 lines)
- All artifacts preserved in git history

**Bug Fixes**

- Fixed MD010 hard tab and MD003 setext heading lint errors
- Fixed broken anchor links across 7 doc files
- Fixed flaky temp directory tests with random suffix

---

## v2.6.1 - Version Alignment

**Released:** February 3, 2026

### What's New

- Bumped version references from v2.6.0 to v2.6.1 across 27 documentation files
- Updated test badge from 1,740 to 2,016 passing

---

## v2.6.0 - Config-Flow Integration (Phase 2)

**Released:** February 2, 2026 | **PR:** [#39](https://github.com/Data-Wise/scholar/pull/39)

### Highlights

This major release adds Phase 2 config-flow integration with 4 core features, manifest-first architecture, and bidirectional sync between YAML sources and JSON outputs.

### New Features

#### Manifest-First Discovery

- New `lesson-plans-manifest.schema.json` for centralized course configuration
- Manifest-first discovery with directory fallback (backward compatible)
- SHA-256 hash-based change detection for bidirectional sync
- Status lifecycle: `draft` → `generated` → `reviewed` → `published`

#### Bidirectional Sync Engine

- Week-level sync between YAML source and JSON output
- Backup-on-write (`.bak`) with last-write-wins conflict resolution
- `--to-manifest` flag for directory-to-manifest migration
- Atomic operations with rollback on failure

#### Demo Course Scaffolding

- Enhanced `/teaching:demo` with Phase 2 module wiring
- Schema export for flow-cli interoperability
- Demo course templates with v2-compliant YAML configurations

#### Phase 2 Modules

| Module | Purpose |
| ------ | ------- |
| `manifest-sync` | Manifest-first discovery and sync |
| `diff-engine` | YAML/JSON comparison with color-coded output |
| `sync-engine` | Bidirectional sync with hash tracking |
| `shared utilities` | Hash, safe-write, discovery, validator |

### JSON Schema v2

- `lesson-plan.schema.json` - Individual lesson plan validation
- `teaching-style.schema.json` - Teaching style configuration
- `lesson-plans-manifest.schema.json` - Course-level manifest

Schemas are exported via `package.json` for flow-cli consumption:

```json
{
  "exports": {
    "./schemas": "./src/teaching/schemas/v2/index.js",
    "./schemas/lesson-plan": "./src/teaching/schemas/v2/lesson-plan.schema.json"
  }
}
```

### Documentation (220+ pages)

- Phase 2 API Reference (`PHASE2-CONFIG-FLOW-API.md` - 1,709 lines)
- Phase 2 Architecture Diagrams (`PHASE2-ARCHITECTURE-DIAGRAMS.md` - 5 Mermaid diagrams)
- Phase 2 User Guide (`PHASE2-USER-GUIDE.md` - 1,020 lines)
- Internal documentation subfolder with 7 maintainer-facing docs
- 6 interactive teaching tutorials
- `.flow/` Directory Reference with command-file interaction matrix

### Key Design Decisions

1. **Manifest-first discovery** with directory fallback (backward compatible)
2. **SHA-256 hash-based** change detection for bidirectional sync
3. **Backup-on-write** (`.bak`) with last-write-wins conflict resolution
4. **Scholar owns schema**, flow-cli imports it via package exports

### Stats

| Metric | v2.5.0 | v2.7.0 | Change |
| ------ | ------ | ------ | ------ |
| Commands | 22 | 27 | +5 |
| Tests | 1,659 | 2,071 | +412 (+25%) |
| Test Suites | 60 | 71 | +11 |
| Documentation Pages | ~100 | 220+ | +120 |

### Upgrade Notes

v2.6.0 is fully backward compatible. Existing YAML configurations continue to work with directory-based discovery. To adopt manifest-first workflow:

1. Run `/teaching:migrate --to-manifest` to generate a manifest from existing files
2. Use `/teaching:sync` for bidirectional sync
3. Use `/teaching:diff` to verify sync status

---

## See Also

- [Phase 2 User Guide](PHASE2-USER-GUIDE.md) - Instructor-facing workflows
- [Phase 2 Architecture](PHASE2-ARCHITECTURE-DIAGRAMS.md) - System diagrams
- [Phase 2 API Reference](PHASE2-CONFIG-FLOW-API.md) - Module documentation
- [Configuration Reference](CONFIGURATION.md) - Full config options
- [What's New in v2.5.0](WHATS-NEW-v2.5.0.md) - Weekly lecture production
