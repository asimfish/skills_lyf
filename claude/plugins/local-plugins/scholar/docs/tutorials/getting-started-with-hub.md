# Tutorial: Using Scholar Hub

**Time:** 5 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running

**What you'll learn:**

- Navigate all 33 scholar commands from one entry point
- Spot AI-capable commands with `[AI]` markers
- Discover command options without reading docs
- Drill into research and teaching categories
- Look up details, flags, and examples for any command
- Use the quick reference card
- Understand smart help context detection

---

## Why Use the Hub?

Scholar has {{ scholar.command_count }} commands across research and teaching. Instead of memorizing them all, the hub gives you a single entry point to:

- **Discover** what's available grouped by workflow
- **Identify** which commands support AI customization (`-i` flag)
- **Explore** options for any command before running it
- **Get examples** you can copy and modify

Think of it as `--help` for the entire plugin, organized by what you're trying to do.

---

## Step 1: Open the Hub Overview

**What to do:**

Run the hub command with no arguments to see all available commands grouped by category.

**Example:**

```bash
/scholar:hub
```

**What you'll see:**

A box-drawing layout showing all {{ scholar.command_count }} commands organized into Research ({{ scholar.research_commands }}) and Teaching ({{ scholar.teaching_commands }}), grouped by subcategory. Commands that support AI-powered custom instructions are marked with `[AI]`:

```
+-----------------------------------------------------------+
| SCHOLAR HUB                                               |
| Academic workflows for research and teaching              |
+-----------------------------------------------------------+
|                                                           |
| RESEARCH (14 commands)                                    |
|   Planning .... analysis-plan, hypothesis, lit-gap,       |
|                 method-scout                              |
|   Manuscript .. methods, proof, results, reviewer         |
|   Literature .. arxiv, bib-add, bib-search, doi           |
|   Simulation .. design, analysis                          |
|                                                           |
| TEACHING (18 commands)                                    |
|   Content ..... exam [AI], quiz [AI], slides [AI],        |
|                 assignment [AI], syllabus [AI],            |
|                 lecture [AI], solution                     |
|   Assessment .. rubric [AI], feedback [AI]                |
|   Quality ..... validate-r, preflight                     |
|   Export ...... canvas (QTI)                               |
|   Config ...... validate, diff, sync, migrate, demo,      |
|                 config                                    |
|                                                           |
+-----------------------------------------------------------+
```

**What `[AI]` means:** Commands marked `[AI]` accept the `-i` flag for custom instructions. For example, `/teaching:exam "midterm" -i "Focus on Bayesian methods"` lets you shape the AI generation.

If you're in a teaching or research project directory, the hub appends a context-aware tip suggesting relevant commands.

---

## Step 2: Drill Into a Category

**What to do:**

Pass `research` or `teaching` as an argument to see all commands in that category with descriptions and option counts.

**Example:**

```bash
/scholar:hub teaching
```

**What you'll see:**

Each command listed with its description, grouped by subcategory. Commands with options show a hint indicating how many are available:

```
| CONTENT                                                   |
|   exam             Generate comprehensive exams           |
|                    (12 options — see details)              |
|   quiz             Create quizzes from course material    |
|                    (10 options — see details)              |
|   validate         Validate config files                  |
```

The `(N options -- see details)` hint tells you there's more to discover. Config utilities like `validate` have no options, so no hint is shown.

```bash
# Research commands
/scholar:hub research
```

---

## Step 3: Look Up a Specific Command

**What to do:**

Pass any command name (full or short) to see its details, usage syntax, options, and examples.

**Example:**

```bash
/scholar:hub exam
```

**What you'll see:**

Full metadata for the command including:
- Full namespaced name (`teaching:exam`)
- Category and subcategory (`teaching > content`)
- Usage pattern with option count
- **Options section** with up to 8 flags displayed with dotted-leader alignment
- Example invocations (including `-i` usage for AI-capable commands)

```
+-----------------------------------------------------------+
| COMMAND: exam                                             |
+-----------------------------------------------------------+
|                                                           |
| Name:        teaching:exam                                |
| Category:    teaching > content                           |
| Description: Generate comprehensive exams                 |
|                                                           |
| Usage:                                                    |
|   /teaching:exam <topic> (12 options)                     |
|                                                           |
| Options:                                                  |
|   --questions N ........... Number of questions           |
|   --difficulty LEVEL ...... easy, medium, hard            |
|   --format FORMAT ......... md, qmd, tex, json            |
|   --instructions / -i ..... Custom instructions for AI    |
|   --solution .............. Include answer key            |
|   ... (+ 7 more)                                          |
|                                                           |
| Examples:                                                 |
|   /teaching:exam "intro stats midterm"                    |
|   /teaching:exam "regression" --questions 15              |
|   /teaching:exam "ANOVA" -i "focus on repeated           |
|     measures designs"                                     |
|                                                           |
+-----------------------------------------------------------+
```

You can also use the full name:

```bash
/scholar:hub research:analysis-plan
```

---

## Step 4: Quick Reference Card

**What to do:**

Use the `quick` argument for a compact one-line-per-command reference.

**Example:**

```bash
/scholar:hub quick
```

**What you'll see:**

All {{ scholar.command_count }} commands with dotted leaders aligning names to descriptions -- useful when you know the category but need the exact command name.

---

## Step 5: Smart Help Context Detection

**How it works:**

When you run `/scholar:hub` (no arguments), the smart help engine scans your working directory for project signals:

| Signal | Weight | Context |
|--------|--------|---------|
| `.flow/teach-config.yml` | 3 | Teaching |
| `content/lesson-plans/` directory | 2 | Teaching |
| `.qmd` files | 1 | Teaching |
| `manuscript/` directory | 3 | Research |
| `.bib` files | 2 | Research |
| `simulation/` directory | 2 | Research |

The hub overview automatically appends a contextual tip based on which signals are strongest.

**Teaching projects** get a tip mentioning the `-i` flag:

```
Tip: You're in a teaching project. Try /teaching:exam or /scholar:hub for all commands.
     Use -i to customize AI generation.
```

**Research projects** get research-focused suggestions. **Mixed/unknown** contexts suggest `/scholar:hub` as the starting point.

---

## Common Workflows

### "What commands are available?"

```bash
/scholar:hub           # Full overview with [AI] markers
/scholar:hub quick     # One-line reference card
```

### "What options does this command have?"

```bash
/scholar:hub exam      # See all flags, usage, and examples
/scholar:hub slides    # Same for any command
```

### "Which commands support custom instructions?"

Look for `[AI]` markers in the overview, or drill into a command to check for `--instructions / -i` in its Options section.

### "I'm new -- where do I start?"

```bash
/scholar:hub           # See everything at once
# Then pick a category:
/scholar:hub teaching  # If you teach
/scholar:hub research  # If you research
```

---

## What's Next?

- **Teaching?** Try [Your First Exam](teaching/first-exam.md) or [Semester Setup](teaching/semester-setup.md)
- **Research?** Try [First Literature Search](research/first-literature-search.md) or [Analysis Planning](research/analysis-planning.md)
- **Custom instructions?** See [Custom Instructions Tutorial](teaching/custom-instructions.md)
- **Explore all commands:** Run `/scholar:hub quick` for the full list

---

**Version:** Scholar v{{ scholar.version }} | **Added in:** v2.7.0 | **Flag Discovery:** v2.12.0
