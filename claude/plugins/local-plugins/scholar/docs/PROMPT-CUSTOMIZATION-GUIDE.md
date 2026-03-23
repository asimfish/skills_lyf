---
render_macros: false
---

# Prompt Customization Guide

Customize AI-generated teaching content by providing your own prompt templates.

## Quick Start (5 Minutes)

### 1. Create the Prompts Directory

```bash
# Recommended: Use scaffold to copy Scholar defaults as your starting point
/teaching:config scaffold lecture-notes

# Or create manually:
mkdir -p .flow/templates/prompts
```

### 2. Create a Custom Prompt

Create `.flow/templates/prompts/lecture-notes.md`:

```markdown
---
prompt_version: "2.4"
prompt_type: "lecture-notes"
prompt_description: "Custom lecture notes for my course"
---

# {{topic}} - Lecture Notes

Course: {{course_code}}
Level: {{course_level}}

Generate comprehensive lecture notes following my teaching style:
- Use {{tone}} academic language
- Include worked examples with {{language}} code
- Target {{course_level}} students

{{#if has_lesson_plan}}
Use these learning objectives:
{{learning_objectives}}
{{/if}}
```

### 3. Generate Content

```bash
claude "/teaching:lecture 'Linear Regression' --verbose"
```

Output shows your custom prompt was used:

```
📄 Using prompt: .flow/templates/prompts/lecture-notes.md
   Version: 2.4
   Source: project
```

---

## How Prompt Discovery Works

Scholar searches for prompts in this order:

```
1. .flow/templates/prompts/{type}.md     ← Your project (highest priority)
2. Plugin defaults (built-in)             ← Scholar's defaults
3. Legacy prompts (lecture-prompts.js)    ← Fallback
```

### Prompt Types

| Command | Prompt Type | Default Template |
|---------|-------------|------------------|
| `/teaching:lecture` | `lecture-notes` | Yes |
| `/teaching:lecture` (outline) | `lecture-outline` | Yes |
| `/teaching:lecture` (sections) | `section-content` | Yes |
| `/teaching:quiz` | `quiz` | Yes |
| `/teaching:exam` | `exam` | No (uses legacy) |
| `/teaching:slides` | `slides` | No (uses legacy) |

---

## Template Syntax

### YAML Frontmatter (Required)

Every prompt needs metadata:

```yaml
---
prompt_version: "2.4"           # Required: Version for compatibility
prompt_type: "lecture-notes"    # Required: Matches command type
prompt_description: "..."       # Optional: Human-readable description
target_template: "lecture.qmd"  # Optional: Associated content template
author: "Your Name"             # Optional
last_updated: "2026-01-28"      # Optional: ISO date
---
```

### Variable Substitution

Use `{{variable}}` to insert values:

```markdown
# {{topic}} - Lecture Notes

Course: {{course_code}} - {{course_name}}
Field: {{field}}
Level: {{course_level}}
```

**Nested paths** work too:

```markdown
Approach: {{teaching_style.pedagogical_approach}}
Notation: {{notation_conventions.fixed_effects}}
```

### Conditional Sections

Include content based on conditions:

```markdown
{{#if has_lesson_plan}}
## Learning Objectives
{{learning_objectives}}
{{else}}
Generate 4-6 learning objectives using Bloom's taxonomy.
{{/if}}
```

**Equality checks:**

```markdown
{{#if course_level == "graduate"}}
Include rigorous mathematical proofs with full derivations.
{{else}}
Focus on intuition and worked examples.
{{/if}}

{{#if pedagogical_approach != "lecture-based"}}
Include "Stop and Think" prompts throughout.
{{/if}}
```

---

## Available Variables

### From Command Arguments

| Variable | Source | Example |
|----------|--------|---------|
| `topic` | `--topic` or positional | "ANOVA" |
| `week` | `--from-plan=weekNN` | 3 |
| `language` | `--language` | "r" |
| `target_pages` | `--pages` | 30 |

### From Configuration

| Variable | Source | Example |
|----------|--------|---------|
| `course_level` | `scholar.course_info.level` | "graduate" |
| `field` | `scholar.course_info.field` | "statistics" |
| `course_code` | `course.code` | "STAT 545" |
| `course_name` | `course.name` | "Analysis of Variance" |

### From Teaching Style

| Variable | Source | Example |
|----------|--------|---------|
| `tone` | `explanation_style.formality` | "balanced" |
| `pedagogical_approach` | `pedagogical_approach.primary` | "problem-based" |
| `proof_style` | `explanation_style.proof_style` | "rigorous-with-intuition" |
| `example_depth` | `explanation_style.example_depth` | "comprehensive" |

### From Notation Conventions

| Variable | Source | Example |
|----------|--------|---------|
| `notation_fixed_effects` | `notation_conventions.fixed_effects` | "Greek letters (α, β, γ)" |
| `notation_random_effects` | `notation_conventions.random_effects` | "Latin letters (u, v, w)" |
| `notation_nesting` | `notation_conventions.nesting` | "β_j(i) subscript notation" |

### Computed Variables

| Variable | Logic | Example |
|----------|-------|---------|
| `has_lesson_plan` | `lessonPlan !== null` | true |
| `learning_objectives` | From lesson plan | ["LO1", "LO2", "LO3"] |

---

## Variable Priority

When the same variable exists in multiple sources, higher priority wins:

```
1. Command args           ← Highest (--level=graduate)
2. Lesson plan
3. Teaching style (4-layer merged)
4. Config values
5. Defaults               ← Lowest
```

**Example:** If config says `level: "undergraduate"` but you run with `--level=graduate`, the lecture uses "graduate".

---

## Teaching Style Integration

Your `.claude/teaching-style.local.md` or `teach-config.yml` settings flow into prompts automatically.

### 4-Layer Merge System

```
Layer 1 (Global)    ~/.claude/CLAUDE.md
       ↓
Layer 2 (Course)    .claude/teaching-style.local.md
       ↓
Layer 3 (Command)   command_overrides.lecture
       ↓
Layer 4 (Lesson)    lesson-plan.yml teaching_style_overrides
```

### Example: stat-545 Integration

`.flow/teach-config.yml`:

```yaml
teaching_style:
  pedagogical_approach:
    primary: "problem-based"
  explanation_style:
    formality: "balanced"
    proof_style: "rigorous-with-intuition"
  notation_conventions:
    fixed_effects: "Greek letters (α, β, γ, τ)"
    random_effects: "Latin letters (u, v, w)"
```

These values become available as `{{pedagogical_approach}}`, `{{proof_style}}`, etc.

---

## Common Customizations

### Adjusting Tone

```markdown
{{#if tone == "formal"}}
Use formal academic language appropriate for a textbook.
{{else if tone == "conversational"}}
Use a conversational but professional tone.
{{else}}
Use an engaging, dynamic tone with rhetorical questions.
{{/if}}
```

### Notation Standards

```markdown
## Notation Conventions

{{#if notation_fixed_effects}}
- Fixed effects: {{notation_fixed_effects}}
- Random effects: {{notation_random_effects}}
- Nesting: {{notation_nesting}}
{{else}}
Use standard statistical notation throughout.
{{/if}}
```

### R Package Requirements

```markdown
## Required R Packages

{{#if r_packages}}
Load these packages at the start:
```r
pacman::p_load({{r_packages}})
```

{{else}}

```r
pacman::p_load(tidyverse, emmeans, lme4, car)
```

{{/if}}

```

### Level-Specific Content

```markdown
{{#if course_level == "graduate"}}
### Advanced Topics

Include rigorous proofs with the following structure:
1. State the theorem formally
2. Explain intuition
3. Full step-by-step derivation
4. Applications
{{/if}}
```

---

## Debugging

### Verbose Mode

See which prompt is used:

```bash
claude "/teaching:lecture 'ANOVA' --verbose"
```

Output:

```
📄 Using prompt: .flow/templates/prompts/lecture-notes.md
   Version: 2.4
   Source: project
   Variables: 24 merged
```

### Debug Mode

Full variable dump:

```bash
claude "/teaching:lecture 'ANOVA' --debug"
```

### Common Issues

**"Missing required variable: {{xyz}}"**

The template references a variable that doesn't exist. Either:

- Add it to your config/style
- Make it conditional: `{{#if xyz}}{{xyz}}{{/if}}`

**"Prompt version X is older than Scholar vY"**

Update your prompt's `prompt_version` in frontmatter, or run:

```bash
teach templates update
```

**"Using legacy built-in prompt"**

No custom prompt found. Scholar fell back to defaults. This is fine if you haven't created custom prompts.

---

## Migration from v2.3

**No action required.** v2.4.0 is fully backward compatible:

- Existing `/teaching:lecture` usage works unchanged
- Custom prompts are optional
- Legacy `lecture-prompts.js` still functions as fallback

To start using custom prompts:

1. Create `.flow/templates/prompts/` directory
2. Add your custom prompt file
3. That's it - Scholar auto-discovers it

---

## Example: Complete Custom Prompt

`.flow/templates/prompts/lecture-notes.md`:

```markdown
---
prompt_version: "2.4"
prompt_type: "lecture-notes"
prompt_description: "STAT 545 ANOVA lecture notes"
author: "DT"
last_updated: "2026-01-28"
---

# {{topic}} - Lecture Notes

**Course:** {{course_code}} - {{course_name}}
**Level:** {{course_level}}
**Field:** {{field}}

## Context

Generate comprehensive instructor-facing lecture notes (20-40 pages)
for a {{field}} course at the {{course_level}} level.

{{#if has_lesson_plan}}
## Learning Objectives

Use these objectives from the lesson plan:
{{learning_objectives}}
{{else}}
Generate 4-6 learning objectives using Bloom's taxonomy verbs
(analyze, evaluate, apply, compare, derive, interpret).
{{/if}}

## Teaching Style

- **Tone:** {{tone}}
- **Approach:** {{pedagogical_approach}}
- **Proof Style:** {{proof_style}}

{{#if pedagogical_approach == "problem-based"}}
Start each section with a motivating real-world problem before
introducing the theoretical framework.
{{/if}}

{{#if notation_fixed_effects}}
## Notation Standards

| Element | Convention |
|---------|------------|
| Fixed effects | {{notation_fixed_effects}} |
| Random effects | {{notation_random_effects}} |
| Nesting | {{notation_nesting}} |
{{/if}}

## Content Requirements

1. **Motivating Problem** - Real-world research scenario
2. **Theory & Derivations** - {{proof_style}} approach
3. **R Implementation** - Using {{language}} with tidyverse style
4. **Worked Examples** - Hand-calculated + R code
5. **Practice Problems** - Variable count (4-10) with complete solutions
6. **Summary** - Key takeaways as bullet points

{{#if course_level == "graduate"}}
## Graduate-Level Expectations

Include rigorous mathematical proofs with full derivations.
Show both the formal definition and intuitive explanation.
Reference Dean, Voss & Draguljić (2017) where appropriate.
{{/if}}

## Output Format

Generate JSON matching the lecture-notes schema with:
- title, topic, course_code, level
- learning_objectives array
- sections array (8-12 sections)
- references array
```

---

## Comparing Your Prompts to Defaults

After customizing prompts, use `/teaching:config diff` to see exactly what changed:

```bash
# Compare all project prompts against Scholar defaults
/teaching:config diff

# Compare a specific prompt type
/teaching:config diff lecture-notes
```

This shows frontmatter changes, variable changes, and body content differences. It is especially useful after a Scholar upgrade to see whether default prompts have changed relative to your customizations.

---

## Tracing Prompt Usage in Generated Files

After generating content, verify which prompt was used and reproduce the result:

```bash
/teaching:config trace lectures/week-04.qmd
```

This shows:
- The prompt template that was used (project or Scholar default)
- The Scholar version at generation time
- The config layers that were active
- A reproducibility hash for exact regeneration

---

## See Also

- [Teaching Style Guide](TEACHING-STYLE-GUIDE.md) - Configure teaching preferences
- [What's New in v2.4.0](WHATS-NEW-v2.4.0.md) - Full feature overview
- [API Reference](API-REFERENCE.md) - PromptLoader/Builder APIs
- [Config Management Tutorial](tutorials/teaching/config-management.md) - Full `/teaching:config` walkthrough
