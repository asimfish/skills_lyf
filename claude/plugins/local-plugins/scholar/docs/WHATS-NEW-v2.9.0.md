# What's New in Scholar v2.9.0

**Released:** 2026-02-09 | **PR:** [#60](https://github.com/Data-Wise/scholar/pull/60), [#63](https://github.com/Data-Wise/scholar/pull/63)

## Config & Prompt Management

Scholar v2.9.0 adds `/teaching:config` with 5 subcommands for managing `.flow/` prompts, teaching style configs, and per-week variables. It also includes security hardening from a comprehensive code review.

### New Command: `/teaching:config`

| Subcommand | Purpose |
|------------|---------|
| `scaffold TYPE` | Copy Scholar default prompts to `.flow/templates/prompts/` for customization |
| `show [--prompt TYPE] [--command CMD] [--week N]` | Display resolved 4-layer configuration with source attribution |
| `validate` | Pre-flight validation for all `.flow/` configuration |
| `diff [TYPE]` | Compare project prompts against current Scholar defaults |
| `trace FILE` | Show provenance for generated files (prompt, config, variables) |

### Scaffold: Customize Prompts

```bash
/teaching:config scaffold lecture

# Created: .flow/templates/prompts/lecture-notes.md
#   Source: Scholar v2.9.0 default prompt
#   Variables: 12 required, 8 optional
```

Copy any default prompt to your project for customization. Scholar tracks the version so you can detect drift after upgrades.

### Show: Inspect Resolved Config

```bash
/teaching:config show --command lecture --week 4

# Shows all 4 layers:
#   Layer 1: Plugin defaults
#   Layer 2: Course style (.flow/teach-config.yml)
#   Layer 3: Command overrides
#   Layer 4: Week 4 lesson plan
```

See exactly which value came from which configuration layer.

### Validate: Pre-flight Checks

```bash
/teaching:config validate

# Checks:
#   teach-config.yml ... PASS (schema valid)
#   lesson-plans.yml ... PASS (15 weeks, all have objectives)
#   lecture-notes.md ... WARN (based on v2.8.0, current: v2.9.0)
```

Catch configuration issues before generation, not during.

### Diff: Detect Prompt Drift

```bash
/teaching:config diff lecture

# Your version: based on Scholar v2.8.0
# Current default: v2.9.0
# Changes:
#   + Added "R output interpretation" section
#   + New optional variable: {{r_output_style}}
```

After upgrading Scholar, see what changed in default prompts compared to your customized versions.

### Trace: Provenance Tracking

```bash
/teaching:config trace lectures/week-04.qmd

# Shows: command, prompt template, config layers,
#        variables resolved, config hash for reproduction
```

Audit exactly how any generated file was produced.

---

## Security Improvements

Three critical issues identified and fixed during code review:

| Issue | Fix | Tests |
|-------|-----|-------|
| Path traversal in scaffolder/provenance | Reject `..`, `/`, `\` in input; validate path containment | 11 tests |
| Silent error suppression | Replace bare `catch {}` with WARN logging or explicit throws | Across 3 modules |
| YAML corruption fallback | Throw `ScaffoldError` instead of silently corrupting frontmatter | 2 tests |

---

## New Modules

| Module | File | Lines | Purpose |
|--------|------|-------|---------|
| Scaffolder | `src/teaching/config/scaffolder.js` | ~280 | Prompt scaffolding with version tracking |
| Config Preflight | `src/teaching/config/config-preflight.js` | ~320 | Multi-check pre-flight validation |
| Prompt Diff | `src/teaching/config/prompt-diff.js` | ~300 | Semantic prompt comparison |
| Provenance | `src/teaching/config/provenance.js` | ~250 | Generation metadata tracking |

---

## Stats

| Metric | v2.8.0 | v2.9.0 | Change |
|--------|--------|--------|--------|
| Commands | 28 | 29 | +1 |
| Teaching commands | 13 | 14 | +1 |
| Tests | 2,252 | 2,630 | +378 |
| Test suites | 86 | 98 | +12 |
| New source files | — | 4 | — |
| New test files | — | 12 | — |

---

## Backward Compatibility

No breaking changes. The `/teaching:config` command is entirely additive. Existing workflows are unchanged.

---

## Getting Started

```bash
# Try it now
/teaching:config validate              # Check your config
/teaching:config show --command exam    # See resolved config
/teaching:config scaffold lecture       # Customize a prompt
```

**Tutorial:** [Config Management Tutorial](tutorials/teaching/config-management.md)

---

## Related

- [CHANGELOG](https://github.com/Data-Wise/scholar/blob/main/CHANGELOG.md)
- [Config Management Spec](specs/SPEC-2026-02-09-config-management.md)
- [v2.8.0 Release Notes](WHATS-NEW-v2.8.0.md) (previous release)
