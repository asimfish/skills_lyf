# What's New in Scholar v2.7.0

**Release:** Scholar Hub — Command Discovery & Smart Help
**Date:** February 2026

---

## Highlights

Scholar Hub adds a 3-layer help system that makes all 29 commands discoverable through a single entry point. A dynamic discovery engine scans command files at runtime, while smart help detects your project context and suggests relevant commands automatically.

### `/scholar:hub` — Navigation Hub

Browse all scholar commands through 4 navigation layers:

| Layer | Invocation | What You See |
| ----- | ---------- | ------------ |
| Overview | `/scholar:hub` | Both categories with subcategory groupings |
| Category | `/scholar:hub research` | All commands in a category, grouped by subcategory |
| Detail | `/scholar:hub exam` | Full command info with usage and examples |
| Quick ref | `/scholar:hub quick` | One-line-per-command reference card |

### Smart Help — Context-Aware Suggestions

Smart help detects whether you're in a teaching or research project by scanning for filesystem signals:

- **Teaching signals:** `.flow/teach-config.yml` (weight 3), `content/lesson-plans/` (weight 2), `.qmd` files (weight 1)
- **Research signals:** `manuscript/` directory (weight 3), `.bib` files (weight 2), `simulation/` directory (weight 2)

The hub overview automatically appends a contextual tip with the most relevant commands for your project.

### Discovery Engine

The engine scans all `.md` command files under `src/plugin-api/commands/`, parses YAML frontmatter, and derives categories from directory structure:

- **Category derivation:** `teaching/` directory = teaching; everything else = research
- **Subcategory mapping:** Research uses directory names (planning, manuscript, literature, simulation); teaching uses a command-to-subcategory map (content, assessment, config)
- **JSON cache** with mtime-based invalidation — rebuilds only when command files change

## New Files

| File | Purpose |
| ---- | ------- |
| `src/discovery/index.js` | Discovery engine (scan, cache, query) |
| `src/discovery/smart-help.js` | Context detection and suggestions |
| `src/plugin-api/commands/hub.md` | Hub command definition |

## Stats

| Metric | v2.6.3 | v2.7.0 | Change |
| ------ | ------ | ------ | ------ |
| Commands | 27 | 28 | +1 (hub) |
| Tests | 2,024 | 2,071 | +47 |
| Test Runners | Jest | Jest + node:test | +1 runner |

## Upgrade Notes

v2.7.0 is fully backward compatible. The hub command is additive — no existing commands or workflows are affected. The discovery cache (`src/discovery/cache.json`) is auto-generated and gitignored.

---

## See Also

- [What's New in v2.6.0](WHATS-NEW-v2.6.0.md) - Config-Flow Integration
- [What's New in v2.5.0](WHATS-NEW-v2.5.0.md) - Weekly Lecture Production
- [Architecture Diagrams](ARCHITECTURE-DIAGRAMS.md) - System overview
