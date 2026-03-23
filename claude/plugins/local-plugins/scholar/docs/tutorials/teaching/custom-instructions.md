# Custom Instructions for AI Generation

> **Time to Complete:** 20 minutes
> **Level:** Beginner-Intermediate
> **Prerequisites:** Any AI-generating teaching command (exam, quiz, slides, etc.)

Learn to use the `--instructions` / `-i` flag to customize how Scholar generates teaching content. Control datasets, tone, format, constraints, and more — without editing prompt templates.

---

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Add inline custom instructions to any AI-generating command
- Load reusable instructions from a file
- Understand the 4-category classification system
- Read and respond to the approval workflow
- Handle conflict notices between instructions and config
- Build a reusable instruction file for your course

---

## Prerequisites

**Required:**
- Scholar plugin v2.11.0+
- At least one teaching command you've used before (e.g., `/teaching:exam`)

**Helpful:**
- Course configuration in `.flow/teach-config.yml` (for conflict detection)
- Understanding of Scholar's prompt system (see [Custom Prompts](../advanced/custom-prompts.md))

---

## Tutorial Overview

| Step | Task | Time |
|------|------|------|
| 1 | Understand what custom instructions do | 3 min |
| 2 | Add inline instructions | 3 min |
| 3 | Read the approval workflow | 5 min |
| 4 | Handle conflicts and modify | 4 min |
| 5 | Use file-based instructions | 3 min |
| 6 | Build a reusable instruction file | 2 min |

---

## Step 1: Understand What Custom Instructions Do

### The Problem

Scholar generates content using a default prompt plus your course configuration. Sometimes you need per-invocation adjustments:

- "Use healthcare datasets for this exam" (but not the next one)
- "Keep the quiz conversational" (overriding your formal config)
- "Limit to 20 slides" (just for this topic)
- "Include R code with tidyverse" (for a specific week)

### The Solution

The `-i` flag lets you add instructions **per command invocation**. Scholar's InstructionMerger engine:

1. **Categorizes** your instructions into 4 types (content, style, format, constraints)
2. **Merges** them into the active prompt at the right locations
3. **Detects conflicts** with your existing configuration
4. **Shows you a summary** for approval before generating

### When to Use `-i` vs. Config vs. Custom Prompts

| Approach | Scope | Use When |
|----------|-------|----------|
| `-i` flag | Single invocation | One-off adjustments for a specific generation |
| `teach-config.yml` | All generations | Course-wide defaults (tone, difficulty, field) |
| Custom prompts | Per-command | Permanently changing how a command generates |

**Rule of thumb:** If you'll use the same instruction more than 3 times, consider putting it in config or a custom prompt instead.

**Checkpoint:** Think of one instruction you'd want for your next exam or quiz.

---

## Step 2: Add Inline Instructions

### Basic Syntax

```bash
/teaching:exam midterm -i "Your instructions here"
```

The `-i` flag (short for `--instructions`) accepts a quoted string with your instructions.

### Try These Examples

**Example 1: Content instructions**
```bash
/teaching:exam midterm --topics "regression" -i "Use clinical trial datasets throughout"
```

**Example 2: Style instructions**
```bash
/teaching:quiz "ANOVA" 10 -i "Keep it conversational, use penguin dataset examples"
```

**Example 3: Multiple instructions in one string**
```bash
/teaching:slides "Bayesian Inference" \
  -i "Max 20 slides, no formal proofs, focus on intuition over rigor"
```

### What Happens Internally

```
Your text ──→ Haiku AI categorizes ──→ Categories assigned ──→ Merged into prompt
```

Scholar sends your instructions to Haiku (fast, inexpensive) for classification. Each instruction sentence is tagged as one of:

| Category | What It Controls | Example |
|----------|-----------------|---------|
| **Content** | Topics, datasets, examples | "Use healthcare data" |
| **Style** | Tone, voice, notation | "Conversational tone" |
| **Format** | Structure, output shape | "Include R code blocks" |
| **Constraints** | Limits, exclusions | "Max 3 essay questions" |

**Checkpoint:** Run any teaching command with `-i` and observe the approval summary.

---

## Step 3: Read the Approval Workflow

After categorization, Scholar shows a summary **before** generating anything.

### The Approval Summary

```
## Generation Plan

**Base:** Default exam prompt
**Custom instructions:** 4 applied

| Category    | Instructions                          |
|-------------|---------------------------------------|
| Content     | Use clinical trial datasets           |
| Format      | Include R code with tidyverse         |
| Style       | Conversational but precise tone       |
| Constraints | No more than 3 essay questions        |

---
**Accept** to generate | **Modify** to change instructions | **Cancel** to abort
```

### Understanding the Summary

- **Base** tells you which prompt template is being used
- **Category table** shows how your instructions were classified
- **No surprises** — you see exactly what will be injected before any generation

### Your Options

| Action | What Happens |
|--------|-------------|
| **Accept** | Generation proceeds with merged prompt |
| **Modify** | Add or change instructions (another round) |
| **Cancel** | Nothing generated, no API cost |

### Preview Without Generating

Use `--dry-run` to see the approval summary without generating content:

```bash
/teaching:exam midterm -i "Use healthcare data" --dry-run
```

This shows the categorization and merged prompt without calling the generation API.

**Checkpoint:** Run a command with `-i --dry-run` to preview the categorization without generating.

---

## Step 4: Handle Conflicts and Modify

### Conflict Notices

When your instructions conflict with existing configuration, Scholar shows notices:

```
### Notices
- [i] Style instructions may override config tone "formal"
- [!] Constraint "max 5 questions" conflicts with --questions 10
```

**Notice levels:**

| Icon | Meaning | Action |
|------|---------|--------|
| `[i]` | Informational | Your instruction will override config — just be aware |
| `[!]` | Warning | Potential contradiction — review before accepting |

### Modifying Instructions

If the categorization doesn't look right, choose **Modify**:

```
## Generation Plan

**Base:** Default exam prompt
**Custom instructions:** 2 applied

| Category | Instructions                |
|----------|-----------------------------|
| Content  | Focus on Bayesian methods   |
| Style    | Use healthcare examples     |

---
**Accept** to generate | **Modify** to change instructions | **Cancel** to abort
```

**You:** Modify — "Use healthcare examples" should be Content, not Style.

Scholar re-categorizes with your feedback. You can modify **unlimited times** — instructions accumulate across rounds.

### Tips for Better Categorization

- **Be specific:** "Use penguin dataset" > "Use interesting data"
- **One concept per sentence:** Split long instructions into separate statements
- **Use category keywords:** "Limit to..." (constraint), "Format as..." (format), "Include..." (content)

**Checkpoint:** Try providing instructions that conflict with your config and observe the notices.

---

## Step 5: Use File-Based Instructions

### Why Files?

When you have 5+ lines of instructions, or reuse the same instructions across commands, save them to a file.

### Create an Instruction File

```bash
cat > exam-instructions.txt << 'EOF'
Use healthcare and epidemiology datasets
Include R code with tidyverse syntax
Show hand calculations before R output
Conversational but precise tone
Maximum 3 essay questions
All multiple-choice questions should have 5 options
EOF
```

### Reference with `@`

```bash
/teaching:exam final -i @exam-instructions.txt
```

Scholar reads the file and processes each line as a separate instruction.

### Combine File and Inline

```bash
# File provides base instructions, inline adds one-off adjustments
/teaching:exam midterm -i @course-style.txt -i "This exam: focus on Chapter 7"
```

### File Organization Tips

```
.flow/
├── teach-config.yml          # Course-wide config (always applied)
└── instructions/
    ├── course-style.txt      # Reusable across all commands
    ├── exam-style.txt        # Exam-specific instructions
    └── slides-constraints.txt # Slide-specific constraints
```

**Checkpoint:** Create an instruction file and use it with `-i @filename`.

---

## Step 6: Build a Reusable Instruction File

### Template

Start with this template and customize for your course:

```text
# Content
Use [your field] datasets and examples
Include [tool/language] code where appropriate
Reference [textbook or standard] notation

# Style
[Formal/Conversational/Technical] tone
[Show/Hide] intermediate steps in calculations
[Include/Exclude] real-world applications

# Constraints
Maximum [N] questions per exam section
All code must use [package/library]
[Include/Exclude] formula sheets
```

### Example: Statistics Course

```text
Use clinical trial and public health datasets
Include R code with tidyverse and ggplot2
Use hat notation for parameter estimates
Show hand calculations before R output
Conversational but statistically rigorous tone
All examples should include sample sizes > 30
Maximum 3 essay questions per exam
Multiple-choice questions should have 4 options
Include formula reference where applicable
```

### Example: Machine Learning Course

```text
Use scikit-learn and PyTorch examples
Include both mathematical notation and Python code
Focus on intuition before formal derivations
Use real-world datasets from UCI or Kaggle
Progressive difficulty within each section
Include computational complexity notes
Maximum 25 slides per lecture topic
```

**Checkpoint:** Create a course-style instruction file tailored to your course.

---

## Complete Workflow Example

### Scenario: Weekly Exam Preparation

**Monday: Generate with course-wide instructions**

```bash
/teaching:exam midterm \
  --topics "hypothesis testing, confidence intervals" \
  -i @.flow/instructions/course-style.txt
```

Review the approval summary, accept.

**Tuesday: Generate quiz with one-off adjustment**

```bash
/teaching:quiz "t-tests" 8 \
  -i @.flow/instructions/course-style.txt \
  -i "This quiz: open-book format, allow formula sheet"
```

**Wednesday: Generate slides with constraints**

```bash
/teaching:slides "Confidence Intervals" \
  -i @.flow/instructions/course-style.txt \
  -i "Max 22 slides, include interactive R demo at slide 15"
```

### Key Pattern

- **File instructions** provide consistent course identity
- **Inline instructions** add per-invocation specifics
- **Approval workflow** catches conflicts before generation

---

## Troubleshooting

### Instructions Not Applied

**Problem:** Generated content doesn't reflect your instructions.

**Solutions:**
- Check the approval summary — was the instruction categorized correctly?
- Use `--dry-run` to preview the merged prompt
- Be more specific: "Use Palmer penguin dataset" > "Use interesting data"

### Wrong Category

**Problem:** "Use healthcare examples" classified as Style instead of Content.

**Solution:** Choose **Modify** in the approval workflow and add clarification: "Content: use healthcare datasets as the primary data source for all examples."

### File Not Found

**Problem:** `-i @myfile.txt` returns an error.

**Solutions:**
- Check the file path is relative to your current directory
- File must be a plain text file (`.txt`, `.md`)
- Path cannot contain `..` (security restriction)

### Config Conflicts

**Problem:** Many `[!]` notices in the approval summary.

**Solutions:**
- Review your `teach-config.yml` — your instructions may be redundant
- Consider updating config instead of using `-i` for persistent preferences
- Conflict notices are informational — you can still Accept

---

## Best Practices

### DO

- **Start with `--dry-run`** to preview categorization before generating
- **One concept per line** in instruction files for better categorization
- **Use files** for course-wide instructions, inline for one-offs
- **Review the approval summary** — it takes 5 seconds and prevents wasted generations
- **Iterate with Modify** — don't Cancel and re-run, just modify in place

### DON'T

- **Don't duplicate config** — if it's in `teach-config.yml`, you don't need `-i` for it
- **Don't write essays** — keep instructions concise and actionable
- **Don't fight the categorizer** — if it consistently miscategorizes, rephrase your instruction
- **Don't skip approval** — the summary catches conflicts you might miss

---

## Next Steps

Now that you can customize AI generation with instructions:

1. **Explore prompt customization**: [Custom Prompts](../advanced/custom-prompts.md) — for permanent command-level changes
2. **Configure your course**: [Config Management](config-management.md) — for course-wide defaults
3. **See examples**: [Teaching Examples Hub](../../examples/teaching.md#custom-instructions) — real-world instruction patterns
4. **Check the reference**: [Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md) — full flag documentation

---

## Summary

You've learned to:

- Add inline instructions with `-i "text"` to any AI-generating command
- Load reusable instructions from files with `-i @file.txt`
- Understand the 4-category system (content, style, format, constraints)
- Navigate the approval workflow (accept, modify, cancel)
- Handle conflict notices between instructions and config
- Build and organize reusable instruction files

**Key takeaway:** The `-i` flag gives you per-invocation control over AI generation without touching prompt templates or config files. Use it for one-off adjustments; promote frequently-used instructions to config or custom prompts.

---

## See Also

- [What's New in v2.11.0](../../WHATS-NEW-v2.11.0.md)
- [Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md)
- [Custom Prompts Tutorial](../advanced/custom-prompts.md)
- [Config Management Tutorial](config-management.md)
- [Teaching Examples Hub](../../examples/teaching.md#custom-instructions)
