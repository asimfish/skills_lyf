---
render_macros: false
---

# Proposal: Config & Prompt Management Commands

**Status:** Draft
**Created:** 2026-02-09
**Author:** DT
**Affects:** Scholar plugin v2.9+, flow-cli v6.7+

---

## Summary

Add `/teaching:config` subcommands for managing `.flow/` prompts, teaching style configs, and per-week variables. Addresses three pain points: no scaffolding workflow, no drift detection after upgrades, and no pre-generation validation.

## Motivation

Scholar already supports project-level prompt overrides (`.flow/templates/prompts/*.md`) and a 4-layer config merge. But the workflow around these is manual and fragile:

1. **No scaffolding** — Creating a custom prompt requires knowing the format, finding the default, copying it, and editing by hand.
2. **No drift detection** — After a Scholar upgrade, custom prompts may be stale vs new defaults. No way to see what changed.
3. **No pre-flight validation** — Invalid prompts or config only surface when generation fails.

## Design Decisions

Resolved during brainstorm (2026-02-09):

| Decision | Choice | Rationale |
| --- | --- | --- |
| Command ownership | Both Scholar + flow-cli | Scholar owns prompt intelligence; flow-cli owns .flow/ scaffolding |
| Per-week customization | Variables, not separate prompts | Same template, different `prompt_hints` per week in lesson plan |
| Output tracing | Provenance in frontmatter | Show which prompt + config + variables produced a file |
| Upgrade notification | On first run after version change | Automatic detection, not manual check |
| Diff workflow | Explicit `/teaching:config diff` | User runs when ready; upgrade notice points to it |

---

## 1. Scholar Commands: `/teaching:config`

### `/teaching:config show [--prompt TYPE] [--command CMD] [--week N]`

Display the resolved configuration for a command, showing all 4 layers and which value came from which layer.

```
/teaching:config show --command lecture --week 4

=== Resolved Config: /teaching:lecture (Week 4) ===

Layer 1 (Plugin Defaults):
  length: "15-25 pages"
  pedagogical_approach: "linear"

Layer 2 (Course Style — .flow/teach-config.yml):
  pedagogical_approach: "problem-based"  ← overrides Layer 1
  formality: "balanced"
  derivations: "full-step-by-step"

Layer 3 (Command Overrides — command_overrides.lecture):
  length: "20-40 pages"  ← overrides Layer 1
  include_practice_problems: true

Layer 4 (Week 4 Plan):
  topic: "Model Diagnostics"
  objectives: [4 items]
  prompt_hints:
    emphasis: "implementation"  ← per-week customization

Prompt template: .flow/templates/prompts/lecture-notes.md (project override)
  Based on Scholar v2.7.0 defaults
```

With `--prompt TYPE`, show the full resolved prompt template with variables substituted.

### `/teaching:config scaffold TYPE`

Copy a Scholar default prompt to `.flow/templates/prompts/` for customization.

```
/teaching:config scaffold lecture

Created: .flow/templates/prompts/lecture-notes.md
  Source: Scholar v2.8.0 default prompt
  Variables: 12 required, 8 optional

Edit this file to customize lecture generation.
The original default is preserved in Scholar — delete your copy to revert.
```

Valid types: `lecture-notes`, `lecture-outline`, `quiz`, `slides`, `exam`, `assignment`, `syllabus`, `rubric`, `feedback`, `section-content`

### `/teaching:config diff [TYPE]`

Compare project prompts against current Scholar defaults.

```
/teaching:config diff

Comparing .flow/templates/prompts/ vs Scholar v2.8.0 defaults:

  lecture-notes.md:
    Your version: based on Scholar v2.7.0
    Current default: v2.8.0
    Changes in default:
      + Added "R output interpretation" guidance (line 45-52)
      + New variable: {{r_output_style}} (optional)
      ~ Modified "worked examples" section wording

  quiz.md:
    No project override (using Scholar default)

Run /teaching:config merge lecture to interactively update.
```

### `/teaching:config validate`

Pre-flight check for all `.flow/` configuration.

```
/teaching:config validate

=== Config Validation ===

teach-config.yml .......................... PASS
  Schema: valid
  Required fields: all present

lesson-plans.yml .......................... PASS
  Weeks: 15 defined
  Objectives: all weeks have >= 1

Prompts:
  lecture-notes.md ........................ WARN
    Based on Scholar v2.7.0 (current: v2.8.0)
    Missing optional variable: {{r_output_style}}
  quiz.md ................................ PASS (using default)

Teaching Style:
  Global style ........................... PASS
  Course style ........................... PASS
  Command overrides ...................... PASS

Overall: WARN (1 issue)
  → Run /teaching:config diff lecture to review prompt changes
```

### `/teaching:config trace FILE`

Show provenance for a generated file.

```
/teaching:config trace lectures/week-04_model-diagnostics.qmd

=== Provenance: week-04_model-diagnostics.qmd ===

Generated: 2026-02-09T15:30:00Z
Scholar version: 2.8.0
Command: /teaching:lecture "Model Diagnostics" --week 4

Prompt: .flow/templates/prompts/lecture-notes.md
  Version: 2.0 (project override)
  Based on Scholar v2.7.0 default

Config layers applied:
  Layer 1: Plugin defaults
  Layer 2: .flow/teach-config.yml (teaching_style)
  Layer 3: command_overrides.lecture
  Layer 4: week 4 lesson plan (4 objectives)

Config hash: a3f8c2d
  (Regenerate with identical config: /teaching:lecture "Model Diagnostics" --week 4)

Key variables resolved:
  topic: "Model Diagnostics"
  pedagogical_approach: "problem-based" (Layer 2)
  length: "20-40 pages" (Layer 3)
  objectives: 4 items (Layer 4)
  emphasis: "implementation" (Layer 4, prompt_hints)
```

---

## 2. Per-Week Prompt Variables (`prompt_hints`)

Extend lesson plan weeks with `prompt_hints` that merge as additional Layer 4 variables:

```yaml
# In teach-config.yml or lesson-plans.yml
semester_info:
  weeks:
    - number: 3
      topic: "Planned Comparisons"
      prompt_hints:
        emphasis: "derivations"
        include_hand_calculations: true
        r_output_style: "minimal"
    - number: 8
      topic: "RCBD"
      prompt_hints:
        emphasis: "implementation"
        include_hand_calculations: false
        r_output_style: "detailed"
```

These inject into the prompt template as `{{emphasis}}`, `{{r_output_style}}`, etc. The prompt template can use conditional blocks:

```markdown
{{#if include_hand_calculations}}
Include step-by-step hand calculations before showing R code.
{{else}}
Focus on R implementation with code-first approach.
{{/if}}
```

---

## 3. Upgrade Detection (Automatic)

On first run after Scholar version change, check for prompt drift:

```
Scholar v2.8.0 → v2.9.0 detected.

Prompt changes in this version:
  ✱ lecture-notes.md — Added "R output interpretation" section
  ✱ quiz.md — New difficulty calibration variables
  ○ slides.md — No changes

You have custom overrides for:
  → .flow/templates/prompts/lecture-notes.md (based on v2.8.0 default)

Run /teaching:config diff to see changes.
Run /teaching:config merge to update your overrides.
```

Implementation: Scholar stores `prompt_version` in each default prompt's frontmatter. Project overrides record `based_on_scholar_version` in their frontmatter. On load, compare versions.

---

## 4. Provenance Enhancement

Extend Scholar generation metadata in YAML frontmatter:

```yaml
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T15:30:00Z
# scholar_version: 2.8.0
# command: teaching:lecture
# prompt: .flow/templates/prompts/lecture-notes.md
# prompt_version: 2.0
# config_hash: a3f8c2d
# layers: plugin-defaults + course-style + command-overrides + week04-plan
# ---
```

The `config_hash` is a SHA-256 of the merged config, enabling exact reproduction.

---

## 5. flow-cli Coordination

Thin wrappers delegating to Scholar:

| flow-cli Command | Delegates To |
| --- | --- |
| `teach config show` | `/teaching:config show` |
| `teach config edit` | Opens `teach-config.yml` in `$EDITOR` |
| `teach config validate` | `/teaching:config validate` |
| `teach config diff` | `/teaching:config diff` |
| `teach config scaffold TYPE` | `/teaching:config scaffold TYPE` |

---

## 6. Implementation Phases

| Phase | Scope | Target |
| --- | --- | --- |
| **1** | `scaffold`, `show`, `validate` (quick wins) | v2.9.0 |
| **2** | `diff` + upgrade detection | v2.9.0 |
| **3** | `trace` provenance + `prompt_hints` per-week | v2.9.0 |
| **4** | `merge` (interactive 3-way prompt merge) | v3.0.0 |
| **5** | flow-cli `teach config` wrappers | flow-cli v6.7.0 |

---

## Files Affected

### Scholar Plugin

| File | Change |
| --- | --- |
| `src/plugin-api/commands/teaching/config.md` | **New** — /teaching:config command definition |
| `src/teaching/config/scaffolder.js` | **New** — copy defaults to .flow/ |
| `src/teaching/config/diff-engine.js` | **New** or extend existing — prompt diffing |
| `src/teaching/config/validator.js` | Extend — add pre-flight validation command |
| `src/teaching/config/provenance.js` | **New** — trace generation metadata |
| `src/teaching/ai/prompt-loader.js` | Extend — version tracking, upgrade detection |
| `src/teaching/ai/prompt-config-bridge.js` | Extend — merge `prompt_hints` from lesson plan |

### flow-cli

| File | Change |
| --- | --- |
| `lib/commands/config.zsh` | **New** — `teach config` subcommands |

---

## Open Questions

1. **Merge strategy**: When merging upgraded prompts, should it be git-style 3-way merge, or show sections side-by-side for manual selection?
2. **Config hash scope**: Should config_hash cover all 4 layers, or just the layers that differ from defaults?
3. **prompt_hints validation**: Should prompt_hints keys be validated against the prompt template's declared variables, or free-form?

---

## Related

- [SPEC-2026-02-09-unified-revise-check.md](SPEC-2026-02-09-unified-revise-check.md) — v2.8.0 --revise/--check (ships first)
- `src/teaching/ai/prompt-loader.js` — Current prompt resolution logic
- `src/teaching/ai/prompt-config-bridge.js` — 4-layer config merge
- `src/teaching/config/style-loader.js` — Teaching style loading

---

## History

| Date | Change |
| --- | --- |
| 2026-02-09 | Initial draft from interactive brainstorm |
