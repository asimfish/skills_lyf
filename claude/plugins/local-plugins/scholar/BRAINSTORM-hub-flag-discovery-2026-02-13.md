# Brainstorm: Hub Flag Discovery Enhancement

**Generated:** 2026-02-13
**Context:** Scholar v2.11.0, dev branch
**Depth:** Deep (8 questions)
**Focus:** Feature + Architecture
**Action:** Save as spec

## Problem Statement

The `-i` (custom instructions) flag was added to 8 teaching commands in v2.11.0, but the hub discovery system doesn't surface it. Users running `/scholar:hub exam` see no flags. The discovery engine (`src/discovery/index.js`) only extracts `name`, `description`, `usage`, and `examples` from command `.md` files.

## Gap Analysis (from earlier session)

| Discovery Method | Status | Gap |
|---|---|---|
| `/scholar:hub exam` | Missing | No flags shown in Layer 3 |
| `/scholar:hub teaching` | Missing | No flag count per command |
| `/scholar:hub` overview | Missing | No indicator of AI-capable commands |
| Smart help tips | Missing | Doesn't mention `-i` |
| Command `.md` files | Present | Flags documented in body but not parsed |

## Design Decisions (from brainstorm questions)

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Display style | Both inline + detail | Count hint in usage, full table in Options section |
| Data source | Parse markdown body | No command file schema changes needed |
| Smart help | Include in this PR | Small change, high value |
| Command file scope | Standardize format | Ensures reliable parsing |
| Caching | Cache in cache.json | Fast hub lookups |
| Inline verbosity | Count hint | `(12 options)` keeps it clean |
| Layer 1 markers | `[AI]` badge | Quick scan for AI-capable commands |
| Target version | v2.12.0 | Feature addition to discovery engine |

## Implementation Phases

1. **Standardize Options format** (14 teaching .md files)
2. **Discovery engine + cache** (`extractFlags()`, `CACHE_VERSION` bump)
3. **Hub rendering** (Layer 1/2/3 updates)
4. **Smart help + polish** (tips, examples)

## Spec

Full spec saved to: `docs/specs/SPEC-2026-02-13-hub-flag-discovery.md`

## Next Steps

1. [ ] Create worktree: `git worktree add ~/.git-worktrees/scholar/hub-flag-discovery -b feature/hub-flag-discovery dev`
2. [ ] Implement Phase 1-4
3. [ ] Run full test suite
4. [ ] PR to dev
