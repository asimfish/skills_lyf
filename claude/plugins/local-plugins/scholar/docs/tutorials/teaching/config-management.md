# Tutorial: Managing Config & Prompts with `/teaching:config`

**Time:** 15 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- A course project with `.flow/teach-config.yml` (see [Course Configuration](configuration.md) if you need to set one up)

**What you'll learn:**

- Scaffold default prompt templates into your project for customization
- View the resolved 4-layer configuration hierarchy
- Run pre-flight validation on all `.flow/` configuration
- Compare your customized prompts against Scholar defaults
- Trace generation provenance for any output file
- Use `prompt_hints` in lesson plans for per-week variable injection

---

## Step 1: Scaffold a Prompt Template

**What to do:**

Copy a default Scholar prompt template into your `.flow/` directory so you can customize how content is generated. This is the starting point for any prompt customization workflow.

**Example:**

```bash
/teaching:config scaffold lecture-notes
```

**What you'll see:**

```
Created: .flow/prompts/lecture-notes.md
  Source: Scholar v2.9.0 default prompt
  Variables: 8 required, 4 optional

Edit this file to customize lecture-notes generation.
The original default is preserved in Scholar — delete your copy to revert.
```

The scaffolded file is a copy of Scholar's built-in prompt template. You can edit it freely. To revert to defaults at any time, simply delete the file from `.flow/prompts/`.

If the prompt already exists in your project, Scholar warns you instead of overwriting:

```
Warning: Project prompt already exists: .flow/prompts/lecture-notes.md
  Delete the file to revert to Scholar defaults.
```

**Valid scaffold types:**

| Category | Types |
|----------|-------|
| Lectures | `lecture-notes`, `lecture-outline`, `section-content` |
| Assessment | `exam`, `quiz` |
| Presentations | `slides`, `revealjs-slides` |
| Course materials | `assignment`, `syllabus`, `rubric`, `feedback` |

---

## Step 2: Show the Config Hierarchy

**What to do:**

Use `show` to display the resolved configuration that Scholar uses when generating content. Scholar merges four layers into a single resolved config, with later layers overriding earlier ones.

**The 4 layers (in override order):**

1. **Plugin defaults** -- Scholar built-in settings
2. **Course style** -- Your `.flow/teach-config.yml`
3. **Command overrides** -- The `command_overrides` section in teach-config.yml
4. **Week lesson plan** -- Per-week entries in `lesson-plans.yml` (including `prompt_hints`)

**Example -- show all resolved config:**

```bash
/teaching:config show
```

**What you'll see:**

A formatted view of the merged configuration, showing which layer each value came from. This makes it easy to understand why a particular setting is active.

**Example -- show config for a specific command:**

```bash
/teaching:config show --command lecture
```

This filters the output to only show settings that affect the `/teaching:lecture` command, including any `command_overrides` entries.

**Example -- show config for a specific week:**

```bash
/teaching:config show --command lecture --week 4
```

This resolves all four layers including week-specific lesson plan entries, so you can see exactly what Scholar would use when generating content for week 4.

**Example -- show a resolved prompt template:**

```bash
/teaching:config show --prompt lecture-notes
```

This displays the prompt template that would be used for lecture-notes generation, after resolving whether a project-level override exists or the Scholar default applies.

---

## Step 3: Validate Configuration

**What to do:**

Run a pre-flight check on all your `.flow/` configuration files before generating content. This catches issues like missing required fields, invalid YAML, schema violations, and orphaned references.

**Example:**

```bash
/teaching:config validate
```

**What you'll see:**

```
Config Validation
=================

teach-config.yml ........... PASS
lesson-plans.yml ........... PASS (12 weeks)
prompts/lecture-notes.md ... PASS (8/8 required vars)
prompts/exam.md ............ WARN: 1 unused variable

Summary: 0 errors, 1 warning
```

Errors indicate problems that will cause generation to fail. Warnings indicate potential issues that may affect output quality.

**Example -- strict mode (warnings become errors):**

```bash
/teaching:config validate --strict
```

In strict mode, any warning is treated as an error and the command exits with a non-zero status code. This is useful for CI/CD pipelines where you want to enforce clean configuration.

**Example -- JSON output for automation:**

```bash
/teaching:config validate --json
```

Outputs structured JSON instead of the formatted display. Useful for integrating validation into scripts or GitHub Actions workflows.

---

## Step 4: Diff Prompts Against Defaults

**What to do:**

After customizing prompts, use `diff` to see exactly what you changed compared to Scholar's built-in defaults. This is helpful when upgrading Scholar versions to understand if your customizations conflict with upstream improvements.

**Example -- diff all customized prompts:**

```bash
/teaching:config diff
```

**What you'll see:**

A summary of all prompts that differ from Scholar defaults, with a change count for each:

```
Prompt Diff Summary
===================

lecture-notes.md ... 3 changes (2 modified sections, 1 added)
exam.md ............ 1 change (1 modified section)

2 of 11 prompts customized
```

**Example -- diff a specific prompt type:**

```bash
/teaching:config diff lecture-notes
```

This shows a detailed section-by-section comparison between your project prompt and the Scholar default, highlighting additions, removals, and modifications.

---

## Step 5: Trace File Provenance

**What to do:**

After generating content, use `trace` to see the full provenance of a file -- which config values, prompt template, and lesson plan entry were used to produce it. This is invaluable for debugging unexpected output.

**Example:**

```bash
/teaching:config trace lectures/week-04.qmd
```

**What you'll see:**

```
Provenance: lectures/week-04.qmd
================================

Generated:  2026-02-08T14:32:00Z
Command:    /teaching:lecture --week 4
Scholar:    v2.9.0

Config Sources:
  Layer 1 (defaults)  ... Scholar built-in
  Layer 2 (course)    ... .flow/teach-config.yml
  Layer 3 (command)   ... command_overrides.lecture
  Layer 4 (week)      ... lesson-plans.yml week 4

Prompt:     .flow/prompts/lecture-notes.md (project override)
Variables:
  week_number:    4
  title:          "Model Diagnostics"
  emphasis:       "practical interpretation over theory"
  include_dataset: "boston_housing"
  code_style:     "tidyverse with pipe syntax"
```

If the file was not generated by Scholar, or no provenance metadata is found, the command reports an error.

---

## Step 6: Using `prompt_hints` in Lesson Plans

**What to do:**

The fourth config layer -- week-specific lesson plan entries -- supports a `prompt_hints` field that injects custom variables into prompt templates. This lets you fine-tune generation on a per-week basis without modifying the prompt template itself.

**Example `lesson-plans.yml`:**

```yaml
weeks:
  - week: 4
    title: "Model Diagnostics"
    prompt_hints:
      emphasis: "practical interpretation over theory"
      include_dataset: "boston_housing"
      code_style: "tidyverse with pipe syntax"

  - week: 5
    title: "Multiple Regression"
    prompt_hints:
      emphasis: "assumption checking and model comparison"
      include_dataset: "mtcars"
      code_style: "tidyverse with pipe syntax"
```

**How it works:**

When Scholar generates content for a specific week, the `prompt_hints` values are merged into the template variables at the highest priority (layer 4). Any variable in your prompt template that matches a `prompt_hints` key will use the per-week value.

**Verify with `show`:**

```bash
/teaching:config show --command lecture --week 4
```

This will display the fully resolved config including the `prompt_hints` values from week 4, so you can confirm they are being picked up correctly.

**Verify with `trace` after generation:**

```bash
/teaching:config trace lectures/week-04.qmd
```

The provenance output will list each `prompt_hints` variable and the value that was used during generation.

---

## What's Next?

- **Course Configuration** -- Set up your `.flow/teach-config.yml` from scratch: [Course Configuration](configuration.md)
- **Custom Prompts** -- Deep dive into prompt template syntax and variables: [Custom Prompts](../advanced/custom-prompts.md)
- **Teaching Workflows** -- End-to-end workflows combining multiple commands: [Teaching Workflows](../../TEACHING-WORKFLOWS.md)

---

**Version:** Scholar v2.9.0 | **Added in:** v2.9.0
