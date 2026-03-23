# SPEC: Rename Macro "Cache" to "Registry"

**Date:** 2026-02-08
**Status:** Ready
**Upstream:** flow-cli `feature/teach-doctor-v2` (commit `91ed04b6`)

## Problem

The macro system has inconsistent naming:
- `lib/macro-parser.zsh` (flow-cli) uses "registry" internally
- The file on disk was `.flow/macros/cache.yml`
- User-facing messages said "macro cache"
- "Cache" implies ephemeral/disposable data, which is misleading

## Solution

Rename to "registry" everywhere:

| Before | After |
|--------|-------|
| `.flow/macros/cache.yml` | `.flow/macros/registry.yml` |
| "Macro cache out of date" | "Macro registry out of date" |
| "No macro cache found" | "No macro registry found" |
| `teach macros sync` writes `cache.yml` | writes `registry.yml` |

## Backwards Compatibility

- flow-cli doctor falls back to `cache.yml` if `registry.yml` missing
- `teach macros sync` auto-migrates: reads old `cache.yml` count, deletes it, writes `registry.yml`
- No user action required

## Changes Required in Scholar

Documentation-only. No code references `cache.yml`.

### Files to Update

1. `docs/FLOW-DIRECTORY-REFERENCE.md`
   - Line 48: `cache.yml` → `registry.yml`
   - Line 232: Section heading "LaTeX Macro Cache" → "LaTeX Macro Registry"
   - Line 325: Table reference `macros/cache.yml` → `macros/registry.yml`
   - Line 333: Table reference `macros/cache.yml` → `macros/registry.yml`

## Timeline

- flow-cli: Already implemented (commit `91ed04b6` on `feature/teach-doctor-v2`)
- Scholar: This PR (docs-only update)
