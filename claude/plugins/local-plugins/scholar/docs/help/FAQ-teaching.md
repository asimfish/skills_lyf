---
render_macros: false
---

# Teaching FAQ - Scholar v2.17.0

> **Quick answers to common questions about Scholar's teaching commands**

Last Updated: 2026-02-09

---

## Table of Contents

- [General Questions](#general-questions)
- [Setup & Configuration](#setup-configuration)
- [Assignments & Rubrics](#assignments-rubrics)
- [Exams & Quizzes](#exams-quizzes)
- [Lectures & Slides](#lectures-slides)
- [Workflows & Integration](#workflows-integration)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

---

## General Questions

### What is Scholar's teaching namespace?

Scholar's teaching namespace provides AI-powered commands for creating course materials. It includes {{ scholar.teaching_commands }} commands for generating exams, quizzes, assignments, solutions, lectures, slides, rubrics, syllabi, feedback, demos, R code validation, Canvas QTI export, and config management (validate, diff, sync, migrate, config, preflight).

All teaching commands start with `/teaching:` prefix. Use `/scholar:hub teaching` to see all commands with descriptions.

---

### Which teaching commands are available?

| Command | Purpose | Output |
|---------|---------|--------|
| `/teaching:exam` | Comprehensive exams | Questions + answer key |
| `/teaching:quiz` | Quick quizzes | 8-10 questions with answers |
| `/teaching:assignment` | Homework | Problems + solutions + rubric |
| `/teaching:lecture` | Lecture notes | 20-40 page documents |
| `/teaching:slides` | Lecture slides | 10-15 slides with examples |
| `/teaching:syllabus` | Course syllabi | Complete syllabus |
| `/teaching:rubric` | Grading rubrics | Detailed scoring criteria |
| `/teaching:feedback` | Student feedback | Constructive comments |
| `/teaching:demo` | Test all commands | Sample course |
| `/teaching:validate` | Validate YAML configs | Validation report |
| `/teaching:diff` | Check YAML/JSON sync | Diff report |
| `/teaching:sync` | Sync YAML to JSON | Updated JSON files |
| `/teaching:migrate` | Batch v1→v2 migration | Migrated YAML files |
| `/teaching:solution` | Solution keys from assignments | Step-by-step solutions |
| `/teaching:config` | Config management & provenance | Config reports |
| `/teaching:validate-r` | Validate R code in .qmd files | Per-chunk PASS/FAIL report |
| `/teaching:preflight` | Pre-release health checks | Pass/fail checklist |
| `/teaching:canvas` | Export QMD exam to Canvas QTI | `.qti.zip` for LMS import |

See [Teaching Commands Refcard](../refcards/teaching-commands.md) for quick reference, or run `/scholar:hub teaching` for a live command listing.

---

### How do I discover all available commands?

Use the Scholar Hub to browse all {{ scholar.command_count }} commands from a single entry point:

```bash
/scholar:hub              # Overview of all commands
/scholar:hub teaching     # All teaching commands with descriptions
/scholar:hub exam         # Detailed info on a specific command
/scholar:hub quick        # Compact one-line reference card
```

The hub also detects your project context (teaching vs research) and suggests relevant commands. See [Scholar Hub Tutorial](../tutorials/getting-started-with-hub.md) for a walkthrough.

---

### How do I get started with Scholar teaching commands?

**Quick start (2 minutes):**

```bash
# 1. Install Scholar
brew install scholar

# 2. Try your first command
/teaching:exam midterm

# 3. Review the generated exam
ls -l exam-midterm.md
```

See [Quick Start Guide](../QUICK-START.md) for detailed setup.

---

### What output formats are supported?

Scholar supports 5 output formats:

| Format | Extension | Use Case |
|--------|-----------|----------|
| Markdown | `.md` | Simple editing, version control |
| Quarto | `.qmd` | Reproducible documents, R/Python integration |
| LaTeX | `.tex` | Professional typesetting, print-ready PDFs |
| JSON | `.json` | Machine-readable, API access |
| Canvas QTI | `.zip` | LMS import (exams/quizzes only) |

**Specify format:**

```bash
/teaching:exam midterm --format qmd
/teaching:exam midterm --format md,qmd,tex  # Multiple
```

See [Output Formats Guide](../OUTPUT-FORMATS-GUIDE.md) for details.

---

### How does Scholar integrate with my workflow?

Scholar integrates with:

- **flow-cli**: Teaching workflow automation (`work`, `tweek`, `tlec`)
- **Git**: Version control for course materials
- **Quarto**: Reproducible document rendering
- **Canvas/LMS**: Direct import via QTI format
- **GitHub Pages**: Deploy course websites

**Example workflow:**

```bash
work teaching        # Start teaching session
/teaching:exam midterm
git add exam-midterm.md
git commit -m "Add midterm exam"
tpublish            # Deploy to GitHub Pages
```

See [Teaching Workflows](../TEACHING-WORKFLOWS.md) for integration patterns.

---

### Does Scholar work offline?

**Partially.** Commands that don't require AI generation work offline:

- `/teaching:validate` - Validate configs
- `/teaching:migrate` - Schema migration
- `/teaching:diff` - Check sync status

**Requires internet:**

All generation commands (`/teaching:exam`, `/teaching:quiz`, etc.) need Claude API access.

---

## Setup & Configuration

### How do I install Scholar?

**Recommended (Homebrew):**

```bash
brew tap data-wise/tap
brew install scholar
```

Homebrew automatically handles plugin installation. Restart Claude Code after installation.

**Manual installation:**

```bash
git clone https://github.com/Data-Wise/scholar
cd scholar
npm install
./scripts/install.sh
claude plugin install scholar@local-plugins
```

---

### What goes in .flow/teach-config.yml?

The config file customizes Scholar's output for your course:

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"      # or "graduate"
    field: "statistics"
    difficulty: "intermediate"  # beginner, intermediate, advanced

  defaults:
    exam_format: "markdown"     # md, qmd, tex, json
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"

  style:
    tone: "formal"              # or "conversational"
    notation: "statistical"
    examples: true
```

See [Configuration Guide](../CONFIGURATION.md) for all options.

---

### Can I customize prompts?

**Yes.** Add custom prompts to `.flow/teach-config.yml`:

```yaml
scholar:
  prompts:
    exam: |
      Generate exam focused on practical application.
      Include real-world scenarios.
    lecture: |
      Create lecture notes with intuitive explanations.
      Minimize mathematical proofs.
```

See [Prompt Customization Guide](../PROMPT-CUSTOMIZATION-GUIDE.md) for details.

---

### How do I set course difficulty level?

Configure difficulty in `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    difficulty: "beginner"      # Introductory courses
    # OR
    difficulty: "intermediate"  # Mid-level courses
    # OR
    difficulty: "advanced"      # Graduate/advanced courses
```

**Override per-command:**

```bash
/teaching:exam midterm --difficulty hard
/teaching:quiz "Linear Regression" --difficulty easy
```

---

### What are the configuration options?

**Core options:**

| Section | Options | Purpose |
|---------|---------|---------|
| `course_info` | level, field, difficulty | Course context |
| `defaults` | formats, question types | Output preferences |
| `style` | tone, notation, examples | Writing style |
| `ai_generation` | model, temperature | AI settings |
| `prompts` | Custom prompts | Fine-tune generation |

See [Configuration Reference](../CONFIGURATION.md) for complete list.

---

## Assignments & Rubrics

### How do I create an assignment without solutions?

Use the `--no-solutions` flag:

```bash
/teaching:assignment "Linear Regression" --no-solutions
```

**What's included:**

- Problem statements
- Grading rubric (if not disabled with `--no-rubric`)
- Instructions and submission guidelines

**No solution key** - safe to share with students.

**See also:** [Assignments & Rubrics Refcard](../refcards/assignments-rubrics.md)

---

### Does /teaching:assignment generate solutions automatically?

**Yes, by default.** Assignments include:

1. Problem statements
2. **Step-by-step solutions** with explanations
3. **Grading rubric** with partial credit tiers

**Example output:**

```json
{
  "problems": [{"id": "P1", "text": "..."}],
  "solutions": {
    "P1": {
      "answer": "Final answer here",
      "steps": ["Step 1...", "Step 2...", "Step 3..."],
      "parts": {"a": "...", "b": "..."}
    }
  },
  "rubric": {
    "P1": {
      "full_credit": "Correct derivation with clear steps",
      "partial_credit": [
        {"points": 15, "criteria": "Correct approach, minor errors"},
        {"points": 10, "criteria": "Partial work, missing key steps"}
      ]
    }
  }
}
```

---

### How do I generate just a rubric for an existing assignment?

Use the standalone `/teaching:rubric` command:

```bash
/teaching:rubric "Linear Regression Homework" 100
```

**Options:**

```bash
--points N      # Total points (default: 100)
--levels N      # Performance levels (default: 4)
--criteria N    # Number of criteria (default: 5)
--format md     # Output format (md or json)
```

**Example:**

```bash
/teaching:rubric "Data Analysis Project" 200 --levels 5 --format markdown
```

---

### Can I control how detailed the solutions are?

**Yes.** Configure solution detail level in `.flow/teach-config.yml`:

```yaml
scholar:
  defaults:
    solution_detail: "step-by-step"  # Full derivations (default)
    # OR
    solution_detail: "answer-only"   # Just final answers
    # OR
    solution_detail: "hints"         # Guidance without full solution
```

**Comparison:**

| Level | What's Included | Use Case |
|-------|-----------------|----------|
| `step-by-step` | Full derivations, explanations | Instructor key, teaching |
| `answer-only` | Final answers, no steps | Quick grading |
| `hints` | Guidance without solution | Student hints, partial help |

---

### How do I share assignments with students without solutions?

**Two approaches:**

**Approach 1: Generate student version directly**

```bash
/teaching:assignment "Linear Regression" --no-solutions
# Shares: problems + rubric, no solutions
```

**Approach 2: Edit JSON before sharing**

```bash
# 1. Generate full version
/teaching:assignment "Linear Regression"

# 2. Edit JSON: Remove "solutions" object
# 3. Regenerate Markdown/PDF from edited JSON
# 4. Share student version
```

**Best practice:** Use Approach 1 for quick student handouts.

---

### What's included in the grading rubric?

Rubrics include:

- **Full credit criteria** - What earns 100% points
- **Partial credit tiers** - Point ranges (e.g., 75%, 50%, 25%)
- **Common errors** - Typical mistakes with point deductions
- **Performance descriptors** - Clear, observable criteria

**Example:**

```markdown
### Problem 1: OLS Derivation (20 points)

| Score | Criteria |
|-------|----------|
| 18-20 | Correct derivation with clear steps |
| 15-17 | Correct approach, minor errors |
| 10-14 | Partial derivation, missing key steps |
| 0-9   | Incorrect approach or no work shown |

**Common errors:**
- Forgot to check assumptions → -3 pts
- Arithmetic error in final answer → -2 pts
- Missing interpretation → -2 pts
```

---

### Can I customize point values in rubrics?

**Yes.** Use the `--points` flag:

```bash
/teaching:rubric "Final Project" 200 --points 200
```

**Or specify in config:**

```yaml
defaults:
  assignment_points: 100  # Default for assignments
  exam_points: 150        # Default for exams
```

**Per-problem customization:**

Edit the generated JSON to adjust point values:

```json
{
  "problems": [
    {"id": "P1", "points": 30},  # Adjust from default
    {"id": "P2", "points": 40},
    {"id": "P3", "points": 30}
  ]
}
```

---

### How do I include programming problems in assignments?

Use the `--include-code` flag:

```bash
/teaching:assignment "Bootstrap Methods" --include-code --language R
```

**Supported languages:** R, Python, Julia

**Example output:**

```markdown
## Problem 3: R Programming (25 points)

Use the `mtcars` dataset to:

**a)** Fit a linear regression model with mpg as response.

**b)** Create a scatter plot with the fitted line.

**c)** Report and interpret the slope coefficient.

### Solution

```r
# Part (a): Fit model
model <- lm(mpg ~ wt, data = mtcars)
summary(model)

# Part (b): Plot
plot(mtcars$wt, mtcars$mpg)
abline(model, col = "blue")

# Part (c): Interpretation
coef(model)["wt"]  # Slope: -5.34 mpg per 1000 lbs
```

```

---

### What's the difference between homework and problem sets?

**Assignment types:**

| Type | Use Case | Default Points | Problem Count |
|------|----------|----------------|---------------|
| `homework` | Weekly homework (default) | 100 | 5-7 |
| `problem-set` | Comprehensive set | 100 | 10-15 |
| `lab` | Hands-on exercise | 50 | 3-5 |
| `project` | Larger scope | 200 | 1-3 |

**Specify type:**
```bash
/teaching:assignment homework "Linear Regression"
/teaching:assignment problem-set --problems 12
/teaching:assignment lab --include-code
/teaching:assignment project "Data Analysis"
```

---

## Exams & Quizzes

### How do I create an exam?

**Basic exam (2 minutes):**

```bash
/teaching:exam midterm
```

**Customized exam:**

```bash
/teaching:exam final \
  --questions 20 \
  --difficulty hard \
  --topics "regression,ANOVA,diagnostics" \
  --duration 120
```

**What you get:**

- Questions (multiple-choice, short-answer, essay)
- Answer key with solutions
- Formula sheet (optional, use `--no-formulas` to exclude)
- Instructions and point breakdown

See [First Exam Tutorial](../tutorials/teaching/first-exam.md) for step-by-step guide.

---

### What question types are supported?

**Default mix:**

| Type | Percentage | Description |
|------|------------|-------------|
| Multiple-choice | 60% | 4 options, one correct |
| Short-answer | 30% | Brief written response |
| Essay | 10% | Extended response |
| True/False | Optional | Boolean questions |
| Numerical | Optional | Numerical answers |

**Customize in config:**

```yaml
defaults:
  question_types:
    - "multiple-choice"
    - "short-answer"
    - "numerical"  # For stats/math courses
```

---

### How do I control exam difficulty?

**Three ways:**

**1. Global setting** (in `.flow/teach-config.yml`):

```yaml
course_info:
  difficulty: "intermediate"
```

**2. Per-exam flag:**

```bash
/teaching:exam midterm --difficulty hard
/teaching:exam practice --difficulty easy
```

**3. By course level:**

```yaml
course_info:
  level: "graduate"     # Automatically increases difficulty
  difficulty: "advanced"
```

**Difficulty levels:**

| Level | Target Audience | Question Complexity |
|-------|-----------------|---------------------|
| `beginner` | Introductory students | Basic concepts, definitions |
| `intermediate` | Mid-level courses | Application, analysis |
| `advanced` | Graduate/honors | Synthesis, proofs, derivations |

---

### How do I generate answer keys?

**Answer keys are included by default** in all exams and quizzes.

**Exclude answer key:**

```bash
/teaching:exam midterm --no-solutions
```

**Answer key format:**

**Multiple-choice:**

```markdown
## Answer Key
1. B
2. C
3. A
```

**Short-answer/essay:**

```markdown
## Solution: Question 7

**Expected answer:**
Type I error occurs when we reject a true null hypothesis.
Type II error occurs when we fail to reject a false null hypothesis.

**Key points for full credit:**
- Definition of Type I (2 pts)
- Definition of Type II (2 pts)
- Real-world example (3 pts)
```

---

### Can I export exams to LaTeX/PDF?

**Yes.** Use the `--format` flag:

```bash
# Generate LaTeX source
/teaching:exam midterm --format tex

# Compile to PDF
pdflatex exam-midterm.tex
```

**Or use Quarto for easier PDF generation:**

```bash
# Generate Quarto format
/teaching:exam midterm --format qmd

# Render to PDF
quarto render exam-midterm.qmd
```

**Multiple formats at once:**

```bash
/teaching:exam midterm --format md,qmd,tex,json
```

**Output files:**

- `exam-midterm.md` - Markdown (simple editing)
- `exam-midterm.qmd` - Quarto (R/Python integration)
- `exam-midterm.tex` - LaTeX (professional typesetting)
- `exam-midterm.json` - JSON (machine-readable)

---

### How do I import exams to Canvas/LMS?

**Use Canvas QTI format:**

```bash
# Generate QTI-compatible format
/teaching:exam midterm --format canvas
```

**Prerequisites:** Install `examark` npm package:

```bash
npm install -g examark
```

**Import to Canvas:**

1. Generate exam: `/teaching:exam midterm --format canvas`
2. Upload `.zip` file to Canvas
3. Canvas > Quizzes > Import Quiz > Upload QTI package

**Supported LMS:**

- Canvas
- Moodle
- Blackboard (via QTI)

See [LMS Integration Tutorial](../tutorials/advanced/lms-integration.md).

---

### How do I create variations of the same exam?

Use the `--variations` flag:

```bash
/teaching:exam midterm --variations 3
```

**Output:**

- `exam-midterm-v1.md` - Version A
- `exam-midterm-v2.md` - Version B
- `exam-midterm-v3.md` - Version C

**What varies:**

- Question order (randomized)
- Multiple-choice options (shuffled)
- Numerical values (different datasets)
- Problem contexts (different scenarios)

**Use cases:**

- Multiple exam rooms (reduce cheating)
- Makeup exams (different versions)
- Practice exams (variations for review)

---

## Lectures & Slides

### How do I generate lecture notes?

**Standalone lecture:**

```bash
/teaching:lecture "Multiple Regression"
```

**From lesson plan:**

```bash
/teaching:lecture --from-plan=content/lesson-plans/week03.yml
```

**What you get:**

- 20-40 page document
- Learning objectives
- Detailed explanations
- Worked examples
- Code blocks (if applicable)
- Practice problems

**Customize depth:**

```bash
/teaching:lecture "ANOVA" --depth advanced --examples 5
```

See [Weekly Lecture Production](../v2.5.0-weekly-lecture-production.md) for full workflow.

---

### Can I create slides instead of lecture notes?

**Yes.** Use `/teaching:slides`:

```bash
/teaching:slides "Hypothesis Testing" --format qmd
```

**Output:** 10-15 slides for a 50-minute lecture

**Slide formats:**

| Format | Output | Use Case |
|--------|--------|----------|
| `qmd` (Quarto) | Revealjs HTML | Interactive web slides |
| `qmd` (Beamer) | PDF slides | Print handouts |
| `md` | Markdown | Simple editing |

**Render slides:**

```bash
quarto render slides-hypothesis-testing.qmd
# Output: slides-hypothesis-testing.html
```

---

### What's the difference between /teaching:lecture and /teaching:slides?

| Feature | `/teaching:lecture` | `/teaching:slides` |
|---------|---------------------|-------------------|
| **Length** | 20-40 pages | 10-15 slides |
| **Format** | Full prose | Bullet points |
| **Depth** | Comprehensive | High-level overview |
| **Examples** | Fully worked out | Abbreviated |
| **Use Case** | Student reading, instructor prep | In-class presentation |
| **Generation time** | 3-5 minutes | 1-2 minutes |

**Typical workflow:**

1. Generate slides for class presentation
2. Generate lecture notes for student reading
3. Students review notes before/after class

---

### Can I refine just one section of a lecture?

**Yes.** Use the `--revise` flag (renamed from `--refine` in v2.8.0):

```bash
/teaching:lecture --revise=lecture-anova.qmd \
  --section="Introduction" \
  --instruction="Add more intuitive explanation with examples"
```

> **Note:** `--refine` still works as a silent alias in v2.8.0. It will show a deprecation warning in v2.9.0 and be removed in v3.0.0.

**What happens:**

- Scholar reads the existing lecture
- Finds the specified section (fuzzy matching)
- Regenerates just that section with your instructions
- Preserves the rest of the document

**Use cases:**

- Fix unclear explanations
- Add more examples
- Simplify mathematical notation
- Expand abbreviated sections

---

### How do I revise and validate slide decks? (v2.8.0)

**Validate slides against a lesson plan:**

```bash
/teaching:slides --check slides/week-03.qmd --from-plan=week03
```

This runs 3-layer validation: coverage (objectives), structure (ratios), style (formatting rules).

**Revise slides with targeted instructions:**

```bash
# Revise a section
/teaching:slides --revise slides.qmd --section "Methods" --instruction "Add examples"

# Revise by slide range
/teaching:slides --revise slides.qmd --slides 5-12 --instruction "Simplify"

# Revise all slides of a type
/teaching:slides --revise slides.qmd --type quiz --instruction "Add 4th option"
```

**Auto-analysis (no instruction):**

```bash
# Preview what Scholar would fix
/teaching:slides --revise slides.qmd --dry-run

# Apply auto-improvements
/teaching:slides --revise slides.qmd
```

Auto-analysis checks 7 dimensions: density, practice-distribution, style-compliance, math-depth, worked-examples, content-completeness, r-output-interpretation.

See the [Slide Revision Tutorial](../tutorials/teaching/slide-revision-validation.md) for a step-by-step guide.

---

### How do I customize slide themes?

**For Quarto (Revealjs):**

Edit the YAML frontmatter in `.qmd` file:

```yaml
---
title: "Hypothesis Testing"
format:
  revealjs:
    theme: simple        # Options: simple, dark, league, beige, sky, night
    slide-number: true
    transition: slide    # slide, fade, convex
    incremental: true    # Bullet points appear one at a time
---
```

**For Beamer (PDF):**

```yaml
---
format:
  beamer:
    theme: Madrid       # Frankfurt, Singapore, Copenhagen
    colortheme: dolphin
---
```

See [Quarto Revealjs documentation](https://quarto.org/docs/presentations/revealjs/).

---

### Can slides include code examples?

**Yes.** Use the `--include-code` flag:

```bash
/teaching:slides "Bootstrap Methods" --include-code --language R
```

**Example output:**

```markdown
## R Implementation

```{r}
#| echo: true
#| fig-width: 8

# Fit model
model <- lm(mpg ~ wt, data = mtcars)

# Bootstrap confidence intervals
library(boot)
boot_results <- boot(data = mtcars,
                     statistic = function(d, i) coef(lm(mpg ~ wt, data = d[i,])),
                     R = 1000)

# Plot
plot(boot_results)
```

**Supported languages:** R, Python, Julia

---

## Workflows & Integration

### What's the weekly content creation workflow?

**Complete workflow (15 minutes):**

```bash
cd ~/teaching/stat-440-spring-2026

# 1. Generate slides (2 min)
/teaching:slides "Week 5: Multiple Regression" --format qmd

# 2. Create assignment (2 min)
/teaching:assignment "Multiple Regression Problems"

# 3. Create quiz (1 min)
/teaching:quiz "Multiple Regression Concepts" 8

# 4. Create rubric (1 min)
/teaching:rubric "Assignment 5"

# 5. Review and customize (10 min)
# 6. Commit to git (1 min)
git add week-05/
git commit -m "feat: add Week 5 materials"
```

**Time savings:** 88-92% vs manual creation (15 min vs 2-3 hours)

See [Weekly Content Tutorial](../tutorials/teaching/weekly-content.md).

---

### How do I set up a semester?

**Complete setup (10 minutes):**

```bash
# 1. Create directory (1 min)
mkdir -p ~/teaching/stat-440-spring-2026
cd ~/teaching/stat-440-spring-2026
git init

# 2. Create config (2 min)
mkdir -p .flow
# Create .flow/teach-config.yml

# 3. Generate syllabus (2 min)
/teaching:syllabus "STAT 440" "Spring 2026"

# 4. Create structure (1 min)
mkdir -p {exams,quizzes,assignments,slides,lectures,rubrics}

# 5. Generate first week (4 min)
/teaching:slides "Introduction"
/teaching:assignment "Week 1 Problems"
/teaching:quiz "Introduction Concepts" 8
```

See [Semester Setup Tutorial](../tutorials/teaching/semester-setup.md).

---

### Can I batch-generate content?

**Yes.** Create a generation script:

```bash
#!/bin/bash
# generate-week.sh

WEEK=$1
TOPIC=$2

/teaching:slides "$TOPIC" --format qmd
/teaching:assignment "$TOPIC Problems"
/teaching:quiz "$TOPIC Concepts" 8
/teaching:rubric "Assignment $WEEK"

git add week-$WEEK/
git commit -m "feat: add Week $WEEK materials"
```

**Usage:**

```bash
./generate-week.sh 5 "Multiple Regression"
./generate-week.sh 6 "Model Diagnostics"
```

**Batch all weeks:**

```bash
for week in {1..15}; do
    topic=$(sed -n "${week}p" topics.txt)
    ./generate-week.sh $week "$topic"
    sleep 60  # Pause between API calls
done
```

---

### How does Scholar work with flow-cli?

**flow-cli integration:**

```bash
# Set up teaching workflow
work teaching        # Start teaching session
tweek               # View current week
tlec 5              # Open week 5 lecture

# Generate content
/teaching:exam midterm
/teaching:slides "Regression"

# Finish session
finish "Added midterm exam"
tpublish            # Deploy to GitHub Pages
```

**flow-cli commands:**

| Command | Action |
|---------|--------|
| `work teaching` | Start teaching session |
| `tweek` | Show current week info |
| `tlec [N]` | Open week N lecture |
| `tpublish` | Deploy to GitHub Pages |
| `pb` | Build (Quarto/LaTeX) |
| `pv` | Preview/View |

See [Teaching Workflows](../TEACHING-WORKFLOWS.md#flow-cli-integration).

---

### Can I automate deployment to GitHub Pages?

**Yes.** Use GitHub Actions:

**1. Create `.github/workflows/publish.yml`:**

```yaml
name: Publish Course Site

on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: quarto-dev/quarto-actions/setup@v2
      - name: Render site
        run: quarto render
      - name: Publish to gh-pages
        uses: quarto-dev/quarto-actions/publish@v2
        with:
          target: gh-pages
```

**2. Push changes:**

```bash
git add .
git commit -m "Add week 5 materials"
git push origin main
# Site auto-deploys to https://username.github.io/course-repo/
```

See [GitHub Actions Setup](../github-actions-setup.md).

---

## Troubleshooting

### Why isn't my command working?

**Check these in order:**

**1. Plugin installed?**

```bash
/teaching:exam midterm
# If "Unknown command", plugin not loaded
```

**Fix:**

```bash
claude plugin list | grep scholar
# If not listed:
brew install scholar
# Restart Claude Code
```

**2. Claude API key set?**

```bash
echo $ANTHROPIC_API_KEY
# Should show: sk-ant-...
```

**Fix:**

```bash
export ANTHROPIC_API_KEY=your-key-here
# Add to ~/.bashrc or ~/.zshrc for persistence
```

**3. Config file valid?**

```bash
/teaching:validate .flow/teach-config.yml
```

**Fix:** Check YAML syntax, indentation (use spaces, not tabs).

**4. Command syntax correct?**

See [Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md).

---

### How do I fix configuration errors?

**Use the Auto-Fixer:**

```bash
/teaching:fix
```

This automatically detects and repairs:

- YAML syntax errors
- Missing required fields
- Invalid field values
- Deprecated schema (v1 → v2)

**Manual validation:**

```bash
/teaching:validate .flow/teach-config.yml
```

See [Auto-Fixer Guide](../AUTO-FIXER-GUIDE.md) for details.

---

### Why is generated content too easy/hard?

**Problem:** Questions don't match expected difficulty.

**Solutions:**

**1. Adjust global difficulty:**

Edit `.flow/teach-config.yml`:

```yaml
course_info:
  difficulty: "advanced"  # Change from "intermediate"
```

**2. Override per-command:**

```bash
/teaching:exam midterm --difficulty hard
/teaching:quiz "Regression" --difficulty easy
```

**3. Check course level:**

```yaml
course_info:
  level: "graduate"    # Increases difficulty automatically
  difficulty: "advanced"
```

**4. Customize question types:**

Remove essay questions for beginner courses:

```yaml
defaults:
  question_types:
    - "multiple-choice"
    - "true-false"
    # Remove "essay" for beginner courses
```

---

### Commands are timing out or rate limited

**Problem:** API timeout or rate limit errors.

**Solutions:**

**1. Check API key:**

```bash
echo $ANTHROPIC_API_KEY
```

**2. Reduce question count:**

```bash
# Instead of:
/teaching:exam final --questions 50

# Use:
/teaching:exam final --questions 15
```

**3. Increase timeout (in config):**

```yaml
ai_generation:
  timeout: 60000    # 60 seconds (default: 30)
  max_retries: 5    # More retry attempts
```

**4. Batch with delays:**

```bash
for week in {1..5}; do
    /teaching:slides "Week $week Topic"
    sleep 60  # Wait 1 minute between calls
done
```

**5. Wait and retry:**

Rate limits reset after a few minutes. Try again in 5-10 minutes.

---

### Config file not detected

**Problem:** "No teach-config.yml found, using defaults"

**Solutions:**

**1. Verify location:**

```bash
ls -la .flow/teach-config.yml
# Should exist in current or parent directory
```

**2. Check search path:**

Scholar searches up the directory tree:

```
/path/to/course/exams/       ← Current directory
/path/to/course/.flow/       ← Searches here
```

**3. Create config:**

```bash
mkdir -p .flow
cat > .flow/teach-config.yml << 'EOF'
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
EOF
```

**4. Explicit path:**

```bash
/teaching:exam midterm --config .flow/teach-config.yml
```

---

### Output format problems

**Problem:** Generated files won't render or have formatting errors.

**Solutions:**

**LaTeX errors:**

```bash
# Install full LaTeX
brew install --cask mactex

# Or minimal LaTeX
quarto install tinytex
```

**Quarto errors:**

```bash
# Install Quarto
brew install quarto

# Verify version
quarto --version  # Should be 1.3+
```

**Math notation issues:**

Check LaTeX syntax in generated files:

```latex
# Wrong:
$\beta_1$  # May fail in some contexts

# Correct:
$$\beta_1$$     # Display math (standalone)
$\beta_1$       # Inline math (within text)
```

**Format not supported:**

Only use: `md`, `qmd`, `tex`, `json`, `canvas`

---

### Generated content quality issues

**Problem:** Content is repetitive, inaccurate, or doesn't match expectations.

**Solutions:**

**1. More specific prompts:**

```bash
# Instead of:
/teaching:slides "ANOVA"

# Use:
/teaching:slides "One-way ANOVA with agricultural examples and R code"
```

**2. Provide context in config:**

```yaml
examples:
  contexts:
    - "medical research"
    - "business analytics"
  datasets:
    - "mtcars"
    - "iris"
```

**3. Review and refine:**

Use `--refine` to improve specific sections:

```bash
/teaching:lecture --refine=lecture.qmd \
  --section="Introduction" \
  --instruction="Add more intuitive explanations"
```

**4. Adjust AI settings:**

```yaml
ai_generation:
  temperature: 0.7  # Lower for more consistency (0.5)
                   # Higher for more creativity (0.9)
```

---

## Advanced Topics

### How do I create custom templates?

Create JSON templates in `src/teaching/templates/`:

**Example:** `custom-exam.json`

```json
{
  "template_name": "custom-exam",
  "question_distribution": {
    "multiple-choice": 50,
    "short-answer": 30,
    "essay": 20
  },
  "difficulty": "custom",
  "instructions": "Custom instructions here..."
}
```

**Use template:**

```bash
/teaching:exam midterm --template custom-exam
```

See [Developer Guide](../DEVELOPER-GUIDE.md) for template creation.

---

### Can I use prompt engineering for better content?

**Yes.** Add custom prompts to `.flow/teach-config.yml`:

```yaml
scholar:
  prompts:
    exam: |
      You are an experienced statistics instructor creating an exam.

      Requirements:
      - Focus on conceptual understanding, not memorization
      - Include real-world applications
      - Provide clear, unambiguous question stems
      - Ensure all distractors are plausible
      - Write detailed solution explanations

      Context: {{course_info}}
      Topic: {{topic}}
      Difficulty: {{difficulty}}
```

**Variables available:**

- `{{course_info}}` - Course metadata
- `{{topic}}` - Command topic
- `{{difficulty}}` - Difficulty level
- `{{examples}}` - Example count
- `{{custom_field}}` - Any config field

See [Prompt Customization Guide](../PROMPT-CUSTOMIZATION-GUIDE.md).

---

### How do I export to multiple formats?

**Generate all formats at once:**

```bash
/teaching:exam midterm --format md,qmd,tex,json
```

**Output:**

- `exam-midterm.md` - Markdown
- `exam-midterm.qmd` - Quarto
- `exam-midterm.tex` - LaTeX
- `exam-midterm.json` - JSON

**Or use a script:**

```bash
#!/bin/bash
# export-all.sh

BASE=$1

/teaching:exam $BASE --format md
/teaching:exam $BASE --format qmd
/teaching:exam $BASE --format tex
/teaching:exam $BASE --format json

quarto render exam-$BASE.qmd  # → PDF
pdflatex exam-$BASE.tex       # → PDF
```

**Usage:**

```bash
./export-all.sh midterm
```

---

### What are version control best practices?

**Recommended workflow:**

```bash
# 1. Initialize repository
git init
git add .flow/teach-config.yml
git commit -m "Initial course setup"

# 2. Use .gitignore
cat > .gitignore << 'EOF'
# Exclude solutions
*-solutions.md
*-key.md
*-answer-key.*

# Exclude compiled output
*.pdf
*.html

# Exclude large datasets
data/*.csv
EOF

# 3. Commit weekly materials
git add week-05/
git commit -m "feat: add Week 5 materials (slides, assignment, quiz)"

# 4. Tag releases
git tag -a "spring-2026" -m "Spring 2026 semester"
git push --tags
```

**Branch strategy:**

- `main` - Current semester
- `spring-2026` - Spring 2026 branch
- `fall-2026` - Fall 2026 branch

**See also:** [Teaching Workflows](../TEACHING-WORKFLOWS.md#version-control).

---

### How do I migrate from v1 to v2 schema?

**Use the migration command:**

```bash
# 1. Detect v1 files
/teaching:migrate --detect

# 2. Preview changes
/teaching:migrate --dry-run

# 3. Apply migration
/teaching:migrate

# 4. Validate result
/teaching:validate --all
```

**What changes:**

| v1 Field | v2 Field |
|----------|----------|
| `title` | `course_title` |
| `code` | `course_code` |
| `instructor.name` | `instructor_name` |

**Automatic features:**

- Atomic migration (all-or-nothing)
- Git commit automation
- Rollback on errors
- Complexity scoring

See [Migration Guide](../MIGRATION-v2.2.0.md).

---

## Additional Resources

### Documentation

- [Quick Start Guide](../QUICK-START.md) - 5-minute introduction
- [User Guide](../USER-GUIDE.md) - Complete guide
- [Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md) - All commands
- [Configuration Guide](../CONFIGURATION.md) - Config options
- [Output Formats Guide](../OUTPUT-FORMATS-GUIDE.md) - Format details

### Quick Reference Cards

- [Teaching Commands Refcard](../refcards/teaching-commands.md) - Command quick reference
- [Assignments & Rubrics Refcard](../refcards/assignments-rubrics.md) - Assignment workflows

### Tutorials

- [First Exam Tutorial](../tutorials/teaching/first-exam.md) - Create your first exam
- [Semester Setup Tutorial](../tutorials/teaching/semester-setup.md) - Set up new course
- [Weekly Content Tutorial](../tutorials/teaching/weekly-content.md) - Weekly workflow

### Guides

- [Teaching Workflows](../TEACHING-WORKFLOWS.md) - Workflow patterns
- [Teaching Style Guide](../TEACHING-STYLE-GUIDE.md) - Style customization
- [Prompt Customization Guide](../PROMPT-CUSTOMIZATION-GUIDE.md) - Prompt engineering
- [Auto-Fixer Guide](../AUTO-FIXER-GUIDE.md) - Config troubleshooting

### Support

- [GitHub Issues](https://github.com/Data-Wise/scholar/issues) - Report bugs
- [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions) - Ask questions
- [Contributing](../CONTRIBUTING.md) - Contribute to Scholar

---

**Last Updated:** 2026-02-09 for Scholar v2.17.0
