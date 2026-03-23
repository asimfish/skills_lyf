# Scholar Teaching Commands - API Reference

Complete reference for all teaching commands in the scholar plugin.

## Table of Contents

1. [Commands Overview](#commands-overview)
2. [/teaching:exam](#teachingexam)
3. [/teaching:quiz](#teachingquiz)
4. [/teaching:assignment](#teachingassignment)
5. [/teaching:solution](#teachingsolution)
6. [/teaching:syllabus](#teachingsyllabus)
7. [/teaching:slides](#teachingslides)
8. [/teaching:rubric](#teachingrubric)
9. [/teaching:feedback](#teachingfeedback)
10. [/teaching:lecture](#teachinglecture)
11. [/teaching:demo](#teachingdemo)
12. [/teaching:validate](#teachingvalidate)
13. [/teaching:diff](#teachingdiff)
14. [/teaching:sync](#teachingsync)
15. [/teaching:migrate](#teachingmigrate)
16. [/teaching:config](#teachingconfig)
17. [/teaching:preflight](#teachingpreflight)
18. [/teaching:canvas](#teachingcanvas)
19. [Export Formats](#export-formats-run-demo-generating)
19. [Configuration](#configuration)

---

## Commands Overview

| Command                | Purpose                       | Output Formats                 |
| ---------------------- | ----------------------------- | ------------------------------ |
| `/teaching:exam`       | Generate comprehensive exams  | JSON, MD, QMD, TEX, Canvas QTI |
| `/teaching:quiz`       | Create quiz questions         | JSON, MD, QMD, TEX, Canvas QTI |
| `/teaching:assignment` | Generate homework assignments | JSON, MD, QMD, TEX             |
| `/teaching:solution`   | Generate standalone solution keys | JSON, MD, QMD              |
| `/teaching:syllabus`   | Create course syllabi         | JSON, MD, QMD, TEX             |
| `/teaching:slides`     | Generate/revise/validate slides | JSON, MD, QMD, TEX           |
| `/teaching:rubric`     | Create grading rubrics        | JSON, MD                       |
| `/teaching:feedback`   | Generate student feedback     | JSON, MD                       |
| `/teaching:lecture`    | Generate instructor lecture notes | JSON, MD, QMD             |
| `/teaching:demo`       | Test all commands             | Multiple formats               |
| `/teaching:validate`   | Validate YAML configs         | Terminal output                |
| `/teaching:diff`       | Check YAML/JSON sync status   | JSON, Terminal                 |
| `/teaching:sync`       | Synchronize YAML to JSON      | Terminal output                |
| `/teaching:migrate`    | Batch migrate v1→v2 schema    | Terminal output, Git commit    |
| `/teaching:config`     | Manage config, prompts & provenance | Terminal output, JSON |
| `/teaching:preflight`  | Pre-release health checks | `--fix`, `--json`, `--quick`, `--debug` |
| `/teaching:canvas`     | Convert QMD exams to Canvas QTI | `.qti.zip` via examark |

---

## Custom Instructions (v2.11.0)

All 9 AI-generating commands support the `--instructions` / `-i` flag for per-invocation customization. Instructions are AI-categorized and merged into the active generation prompt before you approve.

### Usage

```bash
# Inline instructions
/teaching:exam midterm -i "Focus on healthcare datasets, include R code"

# Load from file
/teaching:slides "ANOVA" -i @my-instructions.txt
```

### How It Works

1. **Categorize** — Instructions are classified into content, style, format, and constraints using a lightweight AI model
2. **Merge** — Categorized instructions are injected into the appropriate sections of the active prompt (default or user-overridden)
3. **Review** — A summary shows what will be generated, including any conflicts with your config
4. **Approve** — Accept, modify (unlimited rounds), or cancel before generation begins

### Supported Commands

| Command | `-i` Support |
|---------|:------------:|
| `/teaching:exam` | Yes |
| `/teaching:quiz` | Yes |
| `/teaching:assignment` | Yes |
| `/teaching:syllabus` | Yes |
| `/teaching:slides` | Yes |
| `/teaching:rubric` | Yes |
| `/teaching:feedback` | Yes |
| `/teaching:lecture` | Yes |
| `/teaching:solution` | Yes |
| Utility commands (config, demo, diff, migrate, sync, validate) | No |

---

## /teaching:exam

Generate comprehensive exams with AI-powered questions and automatic answer keys.

### Syntax (/teachingexam)

```
/teaching:exam [type] [options]
```

### Exam Types

| Type       | Description                    | Default Duration |
| ---------- | ------------------------------ | ---------------- |
| `midterm`  | Mid-term examination (default) | 60 minutes       |
| `final`    | Final examination              | 120 minutes      |
| `practice` | Practice exam                  | 60 minutes       |
| `quiz`     | Short quiz                     | 20 minutes       |

### Options (/teachingexam)

| Option                     | Type   | Default     | Description                       |
| -------------------------- | ------ | ----------- | --------------------------------- |
| `--questions N`            | Number | 10          | Number of questions to generate   |
| `--difficulty LEVEL`       | String | from config | `easy`, `medium`, `hard`          |
| `--duration N`             | Number | 60          | Exam duration in minutes          |
| `--topics "topic1,topic2"` | String | -           | Comma-separated topics to cover   |
| `--no-formulas`            | Flag   | false       | Exclude formula sheet             |
| `--no-solutions`           | Flag   | false       | Exclude detailed solutions        |
| `--strict`                 | Flag   | false       | Use strict validation mode        |
| `--variations N`           | Number | 1           | Generate N variations of the exam |
| `--instructions "text"` / `-i` | String | -       | Custom instructions to guide AI generation |

> **Note (v2.17.0):** `--send` was removed from `/teaching:exam`. For email delivery use `/teaching:solution --send` or send the generated file manually.

### Examples (/teachingexam)

```bash
# Generate a midterm exam (default)
/teaching:exam

# Generate a final exam with 15 questions at hard difficulty
/teaching:exam final --questions 15 --difficulty hard

# Generate a practice exam on specific topics
/teaching:exam practice --topics "linear regression,hypothesis testing"

# Generate 3 variations of a quiz
/teaching:exam quiz --variations 3

# Generate without formula sheet and solutions
/teaching:exam midterm --no-formulas --no-solutions

# Generate with custom instructions
/teaching:exam midterm -i "Focus on healthcare datasets, include R code"

# Load instructions from a file
/teaching:exam final -i @my-exam-instructions.txt
```

### Question Types

Default mix (configurable via templates):

| Type            | Percentage | Description                   |
| --------------- | ---------- | ----------------------------- |
| Multiple-choice | 60%        | 4 options, one correct        |
| Short-answer    | 30%        | Brief written response        |
| Essay           | 10%        | Extended response with rubric |
| True/False      | Optional   | Boolean questions             |
| Numerical       | Optional   | Numerical answers             |

### Output Structure (Generate without formula)

```json
{
  "title": "Midterm Exam - STAT 440",
  "exam_type": "midterm",
  "duration_minutes": 60,
  "total_points": 100,
  "instructions": "Show all work...",
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "What is the purpose of...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "points": 10,
      "difficulty": "medium",
      "topic": "Linear Regression"
    }
  ],
  "answer_key": {
    "Q1": "B"
  },
  "sections": [
    {
      "name": "Part I: Conceptual Questions",
      "question_ids": ["Q1", "Q2", "Q3"]
    }
  ],
  "formula_sheet": "$$\\hat{\\beta} = (X^T X)^{-1} X^T y$$",
  "resources_allowed": {
    "calculator": true,
    "notes": false
  }
}
```

### Export Formats (Generate without formula)

- **JSON** (`.json`) - Raw structured data
- **Markdown** (`.md`) - examark-compatible format
- **Quarto** (`.qmd`) - For PDF/HTML rendering
- **LaTeX** (`.tex`) - Academic typesetting
- **Canvas QTI** (`.qti.zip`) - LMS import package

---

## /teaching:quiz

Create quiz questions for formative assessment.

### Syntax (/teachingquiz)

```
/teaching:quiz [topic] [num-questions] [options]
```

### Quiz Types

| Type         | Description                 | Default Duration |
| ------------ | --------------------------- | ---------------- |
| `reading`    | Reading comprehension check | 15 minutes       |
| `practice`   | Self-study practice         | 20 minutes       |
| `checkpoint` | Progress check              | 15 minutes       |
| `pop`        | Unannounced quiz            | 10 minutes       |
| `review`     | Pre-exam review             | 30 minutes       |

### Options (/teachingquiz)

| Option               | Type   | Default        | Description                                            |
| -------------------- | ------ | -------------- | ------------------------------------------------------ |
| `--questions N`      | Number | 10             | Number of questions                                    |
| `--difficulty LEVEL` | String | `medium`       | `easy`, `medium`, `hard`, `mixed`                      |
| `--type TYPE`        | String | `reading`      | Quiz type                                              |
| `--duration N`       | Number | 15             | Quiz duration in minutes                               |
| `--randomize`        | Flag   | false          | Randomize question order                               |
| `--feedback WHEN`    | String | `after_submit` | `immediate`, `after_submit`, `after_deadline`, `never` |
| `--retakes`          | Flag   | false          | Allow multiple attempts                                |
| `--max-attempts N`   | Number | 1              | Maximum attempts if retakes allowed                    |
| `--instructions "text"` / `-i` | String | -     | Custom instructions to guide AI generation             |

> **Note (v2.17.0):** `--send` was removed from `/teaching:quiz`. Use `/teaching:solution --send` for email delivery.

### Examples (/teachingquiz)

```bash
# Generate a 10-question quiz on linear regression
/teaching:quiz "Linear Regression"

# Generate a 15-question quiz with mixed difficulty
/teaching:quiz "Confidence Intervals" 15 --difficulty mixed

# Generate a quiz with immediate feedback and retakes
/teaching:quiz "ANOVA" 8 --feedback immediate --retakes --max-attempts 3

# Generate a quiz in Canvas format
/teaching:quiz "Sampling" 8 --format canvas

# Generate with custom instructions
/teaching:quiz "Regression" 10 -i "Use real-world sports analytics examples"
```

### Question Type Distribution

Default mix for 10-question quiz:

| Type            | Count | Purpose                       |
| --------------- | ----- | ----------------------------- |
| Multiple-choice | 6     | Test conceptual understanding |
| True/False      | 2     | Quick fact checks             |
| Short-answer    | 1     | Deeper understanding          |
| Numerical       | 1     | Applied problem solving       |

### Output Structure (Generate a quiz)

```json
{
  "title": "Quiz: Linear Regression",
  "quiz_type": "reading",
  "duration_minutes": 15,
  "total_points": 20,
  "show_feedback": "after_submit",
  "allow_retakes": false,
  "max_attempts": 1,
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "Which assumption is violated if...",
      "options": ["A", "B", "C", "D"],
      "points": 2,
      "difficulty": "medium",
      "explanation": "The correct answer is B because..."
    }
  ],
  "answer_key": {
    "Q1": "B"
  },
  "learning_objectives": [
    "Identify assumptions of linear regression",
    "Interpret diagnostic plots"
  ]
}
```

---

## /teaching:assignment

Generate homework assignments with problems, solutions, and grading rubrics.

### Syntax (/teachingassignment)

```
/teaching:assignment [type] [options]
```

### Assignment Types

| Type          | Description                  | Default Points |
| ------------- | ---------------------------- | -------------- |
| `homework`    | Weekly homework (default)    | 100            |
| `problem-set` | Comprehensive problem set    | 100            |
| `lab`         | Hands-on laboratory exercise | 50             |
| `project`     | Larger scope project         | 200            |
| `worksheet`   | In-class worksheet           | 20             |

### Options (/teachingassignment)

| Option                     | Type   | Default      | Description                                           |
| -------------------------- | ------ | ------------ | ----------------------------------------------------- |
| `--problems N`             | Number | 5            | Number of problems                                    |
| `--points N`               | Number | 100          | Total points                                          |
| `--difficulty LEVEL`       | String | from config  | `beginner`, `intermediate`, `advanced`                |
| `--topic "topic"`          | String | -            | Main topic                                            |
| `--topics "topic1,topic2"` | String | -            | Multiple topics                                       |
| `--week N`                 | Number | -            | Course week number                                    |
| `--due "date"`             | String | -            | Due date                                              |
| `--time "N hours"`         | String | `2-3 hours`  | Estimated completion time                             |
| `--include-code`           | Flag   | false        | Include programming problems                          |
| `--language LANG`          | String | `R`          | Programming language (`R`, `Python`, `Julia`)         |
| `--no-solutions`           | Flag   | false        | Exclude solution key                                  |
| `--no-rubric`              | Flag   | false        | Exclude grading rubric                                |
| `--submission TYPE`        | String | `pdf`        | Submission format (`pdf`, `online`, `code`, `mixed`)  |
| `--collaboration POLICY`   | String | `individual` | Collaboration policy (`individual`, `groups-allowed`) |
| `--instructions "text"` / `-i` | String | -        | Custom instructions to guide AI generation            |
| `--validate`                 | Flag   | false        | Validate R code in generated .qmd output              |
| `--send [EMAIL]`             | String/Flag | false   | Email assignment to recipient via himalaya MCP         |

### Examples (/teachingassignment)

```bash
# Generate a homework assignment on linear regression
/teaching:assignment "Linear Regression"

# Generate a 5-problem homework at intermediate difficulty
/teaching:assignment homework --problems 5 --difficulty intermediate

# Generate a lab with R code
/teaching:assignment lab --topic "Bootstrap Methods" --include-code --language R

# Generate a problem set on multiple topics
/teaching:assignment problem-set --topics "ANOVA,regression" --week 8 --due "Friday, 11:59 PM"

# Generate without solutions and rubric
/teaching:assignment homework --no-solutions --no-rubric

# Generate with custom instructions
/teaching:assignment lab -i "Use tidyverse throughout, focus on ggplot2 visualizations"
```

### Problem Difficulty Distribution

Default distribution:

| Difficulty | Percentage | Purpose                                 |
| ---------- | ---------- | --------------------------------------- |
| Easy       | 20%        | Build confidence, foundational concepts |
| Medium     | 50%        | Core concepts, standard application     |
| Hard       | 25%        | Synthesis, multi-step reasoning         |
| Challenge  | 5%         | Optional, extra credit                  |

### Output Structure (Generate without solutions)

```json
{
  "title": "Homework 3: Linear Regression",
  "assignment_type": "homework",
  "assignment_number": 3,
  "due_date": "Friday, Week 4 by 11:59 PM",
  "total_points": 100,
  "estimated_time": "2-3 hours",
  "submission_format": "pdf",
  "collaboration_policy": "individual",
  "problems": [
    {
      "id": "P1",
      "text": "Consider the regression model $Y = \\beta_0 + \\beta_1 X + \\epsilon$...",
      "points": 20,
      "parts": [
        {
          "label": "a",
          "text": "Derive the OLS estimator...",
          "points": 10
        },
        {
          "label": "b",
          "text": "Show that it is unbiased...",
          "points": 10
        }
      ],
      "difficulty": "medium",
      "topic": "OLS Estimation"
    }
  ],
  "solutions": {
    "P1": {
      "answer": "The OLS estimator is...",
      "steps": ["Step 1: Minimize SSE...", "Step 2: Take derivative..."],
      "parts": {
        "a": "Using calculus, minimize...",
        "b": "Taking expectation..."
      }
    }
  },
  "rubric": {
    "P1": {
      "full_credit": "Correct derivation with clear steps",
      "partial_credit": [
        {"points": 15, "criteria": "Correct approach, minor errors"},
        {"points": 10, "criteria": "Partial derivation"}
      ]
    }
  }
}
```

---

## /teaching:solution

Generate standalone solution keys from existing assignment files. Reads `.qmd` or `.json` assignments, identifies problems, and produces step-by-step solutions as a separate document.

### Syntax (/teachingsolution)

```
/teaching:solution <assignment-file> [options]
```

### Options (/teachingsolution)

| Option                     | Type   | Default                          | Description                                          |
| -------------------------- | ------ | -------------------------------- | ---------------------------------------------------- |
| `--format FMT`             | String | `qmd`                            | Output format: `qmd`, `md`, `json`                   |
| `--output PATH`            | String | `solutions/<name>-solution.qmd`  | Custom output file path                              |
| `--include-rubric`         | Flag   | false                            | Include grading notes and partial credit guidance     |
| `--include-code`           | Flag   | true                             | Include R/Python code solutions                      |
| `--language LANG`          | String | `R`                              | Programming language for code: `R` or `Python`       |
| `--no-code`                | Flag   | false                            | Exclude code solutions                               |
| `--config PATH`            | String | -                                | Explicit config file path                            |
| `--instructions "text"` / `-i` | String | -                           | Custom instructions to guide AI generation           |
| `--dry-run`                | Flag   | false                            | Preview without API calls                            |
| `--json`                   | Flag   | false                            | Output dry-run as JSON (requires `--dry-run`)        |
| `--validate`               | Flag   | false                            | Validate R code in generated .qmd output             |
| `--send [EMAIL]`           | String/Flag | false                       | Email solution to TA via himalaya MCP                |
| `--debug`                  | Flag   | false                            | Enable debug logging                                 |

### Supported Input Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| Quarto/Markdown | `.qmd`, `.md` | Auto-parses YAML frontmatter and problem blocks |
| JSON | `.json` | Same schema as `/teaching:assignment` output |

The parser recognizes problem headings in several formats: `## Problem N`, `## Exercise N`, `## Question N`, `## N.`, and `**Problem N**`.

### Examples (/teachingsolution)

```bash
# Generate solution key from a .qmd assignment
/teaching:solution assignments/assignment3_multiple_comparisons.qmd

# Output as Markdown instead of Quarto
/teaching:solution assignments/hw3.qmd --format md

# Custom output path
/teaching:solution assignments/assignment4.qmd --output solutions/hw4-key.qmd

# Include grading rubric and notes
/teaching:solution assignments/assignment2.qmd --include-rubric

# Exclude code solutions (theory-only key)
/teaching:solution assignments/assignment1.qmd --no-code

# Preview what would be generated
/teaching:solution assignments/assignment5.qmd --dry-run

# Custom instructions
/teaching:solution assignments/hw3.qmd -i "Use modern p-value interpretation, show hand calculations before R code"

# Email solution to TA (uses config email or explicit)
/teaching:solution assignments/hw3.qmd --send
/teaching:solution assignments/hw3.qmd --send ta@university.edu
```

### Output Structure

The solution key includes for each problem:

- **Step-by-step solution** with worked examples
- **Final answer** clearly marked
- **Interpretation** of results in context
- **R code** (unless `--no-code`)
- **Common mistakes** and grading notes (with `--include-rubric`)

### Default Output Path

Solutions are saved to `solutions/<assignment-basename>-solution.<ext>` by default. This follows the convention of keeping solution keys in a gitignored `solutions/` directory.

---

## /teaching:syllabus

Create comprehensive course syllabi.

### Syntax (/teachingsyllabus)

```
/teaching:syllabus [course-name] [options]
```

### Options (/teachingsyllabus)

| Option                   | Type   | Default | Description                    |
| ------------------------ | ------ | ------- | ------------------------------ |
| `--code "CODE"`          | String | -       | Course code (e.g., "STAT-440") |
| `--semester "TERM"`      | String | -       | Semester (e.g., "Fall 2026")   |
| `--credits N`            | Number | 3       | Credit hours                   |
| `--weeks N`              | Number | 15      | Number of weeks                |
| `--meetings "DAYS TIME"` | String | -       | Meeting schedule               |
| `--instructions "text"` / `-i` | String | -  | Custom instructions to guide AI generation |

### Examples (/teachingsyllabus)

```bash
# Generate a syllabus for a statistics course
/teaching:syllabus "Regression Analysis"

# Generate with full details
/teaching:syllabus "Applied Statistics" --code "STAT-440" --semester "Fall 2026" --credits 3

# Generate with custom instructions
/teaching:syllabus "Biostatistics" -i "Emphasize clinical trial design, include ethics section"
```

### Output Structure (Generate with full)

```json
{
  "title": "Regression Analysis",
  "course_code": "STAT-440",
  "semester": "Fall 2026",
  "credits": 3,
  "level": "undergraduate",
  "instructor": {
    "name": "Dr. Jane Smith",
    "email": "jane@university.edu",
    "office": "Room 301",
    "office_hours": "MW 2-4 PM"
  },
  "meeting_times": {
    "days": ["Monday", "Wednesday", "Friday"],
    "time": "10:00 AM - 10:50 AM",
    "location": "Science Hall 205",
    "format": "in-person"
  },
  "description": "This course covers...",
  "learning_objectives": [
    "Apply regression models to real data",
    "Interpret model coefficients",
    "Assess model assumptions"
  ],
  "grading": {
    "components": [
      {"name": "Homework", "percentage": 30},
      {"name": "Midterm", "percentage": 25},
      {"name": "Final", "percentage": 35},
      {"name": "Participation", "percentage": 10}
    ],
    "scale": [
      {"grade": "A", "minimum": 90},
      {"grade": "B", "minimum": 80},
      {"grade": "C", "minimum": 70}
    ]
  },
  "schedule": [
    {
      "week": 1,
      "topic": "Introduction to Regression",
      "readings": ["Chapter 1"],
      "assignments_due": []
    }
  ]
}
```

---

## /teaching:slides

Generate, revise, and validate lecture slides for course topics. The command operates in three modes: **Generation** (default), **Revision** (`--revise`, v2.8.0), and **Validation** (`--check`, v2.8.0).

### Syntax (/teachingslides)

```
/teaching:slides [topic] [duration-minutes] [options]
/teaching:slides --revise <path> [targeting] [--instruction TEXT]
/teaching:slides --check <path> --from-plan=WEEK [--json]
```

### Generation Options (/teachingslides)

| Option                        | Type   | Default     | Description                                              |
| ----------------------------- | ------ | ----------- | -------------------------------------------------------- |
| `--duration N`                | Number | 50          | Lecture duration in minutes                              |
| `--level LEVEL`               | String | from config | `undergraduate`, `graduate`                              |
| `--week N`                    | Number | -           | Course week number                                       |
| `--lecture N`                 | Number | -           | Lecture number                                           |
| `--format FORMAT`             | String | `markdown`  | Output format (`markdown`, `reveal`, `beamer`, `quarto`) |
| `--subtopics "topic1,topic2"` | String | -           | Specific subtopics                                       |
| `--include-code`              | Flag   | false       | Include code examples                                    |
| `--language LANG`             | String | `R`         | Programming language                                     |
| `--instructions "text"` / `-i` | String | -          | Custom instructions to guide AI generation               |
| `--validate`                  | Flag   | false       | Validate R code in generated .qmd output                 |

### Revision Options (/teachingslides) — v2.8.0

| Option                | Type   | Default | Description                                                |
| --------------------- | ------ | ------- | ---------------------------------------------------------- |
| `--revise PATH`       | String | -       | Path to existing `.qmd` slide deck to revise               |
| `--instruction TEXT`  | String | -       | Revision instruction (omit for auto-analysis mode)         |
| `--section TITLE`     | String | -       | Target section by title (fuzzy matched, requires `--revise`) |
| `--slides RANGE`      | String | -       | Target slides by number or range (e.g., `5`, `5-12`, `3,5,8`) |
| `--type TYPE`         | String | -       | Target slides by type (e.g., `quiz`, `practice`, `example`) |
| `--dry-run`           | Flag   | false   | Preview changes without writing file                       |

**Revision modes:**

- **Instruction mode** (`--revise` + `--instruction`): Apply specific changes guided by your instruction
- **Auto-analysis mode** (bare `--revise`): Scholar analyzes 7 dimensions and generates improvements automatically

**Context strategy** (automatic):

- Decks with < 30 slides: full deck context sent to AI
- Decks with >= 30 slides: targeted slides + 1 neighbor on each side

### Validation Options (/teachingslides) — v2.8.0

| Option             | Type   | Default | Description                                                    |
| ------------------ | ------ | ------- | -------------------------------------------------------------- |
| `--check PATH`     | String | -       | Path to `.qmd` to validate (requires `--from-plan`)            |
| `--from-plan WEEK` | String | -       | Lesson plan identifier (e.g., `week03`)                        |
| `--json`           | Flag   | false   | Output validation report as JSON                               |

**Validation layers:**

1. **Coverage** — Every lesson plan objective appears in slide content (keyword matching)
2. **Structure** — Slide count, content/practice ratio, quiz distribution
3. **Style** — 5 configurable rules (math notation, code visibility, callouts, dtslides classes, hand calculations)

Reports include suggested `--revise` commands for detected issues. Strictness is configurable (`advisory` or `strict`) in `teach-config.yml`.

### Examples (/teachingslides)

```bash
# --- Generation ---
# Generate slides for a 50-minute lecture
/teaching:slides "Multiple Regression"

# Generate a 75-minute lecture in reveal.js format
/teaching:slides "Hypothesis Testing" 75 --format reveal

# Generate slides with R code examples
/teaching:slides "Bootstrap Methods" --include-code --language R

# --- Revision (v2.8.0) ---
# Revise specific section with instruction
/teaching:slides --revise slides.qmd --section "Methods" --instruction "Add worked example"

# Revise slide range
/teaching:slides --revise slides.qmd --slides 5-12 --instruction "Simplify notation"

# Revise all quiz slides
/teaching:slides --revise slides.qmd --type quiz --instruction "Add 4th answer option"

# Auto-analysis (no instruction) with dry-run preview
/teaching:slides --revise slides.qmd --dry-run

# Apply auto-analysis improvements
/teaching:slides --revise slides.qmd

# --- Validation (v2.8.0) ---
# Check slides against lesson plan
/teaching:slides --check slides/week-03.qmd --from-plan=week03

# JSON output for CI integration
/teaching:slides --check slides/week-03.qmd --from-plan=week03 --json
```

### Slide Types

Scholar classifies slides using a 4-level cascade: CSS classes, heading patterns, content heuristics, and default fallback.

| Type         | Purpose              | Detection Example                        |
| ------------ | -------------------- | ---------------------------------------- |
| `title`      | Section title slide  | `{.section-slide}`, `# Heading`          |
| `objectives` | Learning objectives  | `{.objectives}`, "Learning Objectives"   |
| `content`    | Main content         | Default type for unmatched slides        |
| `example`    | Worked example       | `{.example-slide}`, "Example:" prefix    |
| `definition` | Formal definition    | `{.definition-slide}`, "Definition:" prefix |
| `theorem`    | Mathematical theorem | `{.theorem-slide}`, "Theorem:" prefix    |
| `practice`   | Practice problem     | `{.practice-slide}`, "Practice:" prefix  |
| `quiz`       | Quiz question        | `{.quiz-question}`, `{.correct}` markup  |
| `discussion` | Discussion prompt    | `{.discussion}`, "Discussion:" prefix    |
| `summary`    | Summary slide        | `{.summary-slide}`, "Summary" heading    |
| `questions`  | Q&A slide            | "Questions?" heading                     |

### Auto-Analysis Dimensions (v2.8.0)

When using bare `--revise` (no `--instruction`), Scholar evaluates slides across 7 dimensions:

| Dimension | What It Checks | Threshold |
| --------- | -------------- | --------- |
| **density** | Overcrowded (>20 lines) or sparse (<3 lines) slides | Lines per slide |
| **practice-distribution** | Even spread of practice/quiz slides across sections | >50% in one section triggers warning |
| **style-compliance** | Match configured tone and formatting rules | Conversational language in formal mode |
| **math-depth** | Formulas accompanied by explanation | Math block without surrounding prose |
| **worked-examples** | Definition slides have nearby example slides | No example within 3 slides of definition |
| **content-completeness** | Sufficient concept explanation | <2 content lines on content slides |
| **r-output-interpretation** | Code output slides include interpretation | R code block without following prose |

### Output Structure (Generate slides with)

```json
{
  "title": "Multiple Regression",
  "topic": "Multiple Regression",
  "duration_minutes": 50,
  "learning_objectives": [
    "Apply multiple regression models",
    "Interpret partial coefficients"
  ],
  "slides": [
    {
      "id": "S1",
      "type": "title",
      "title": "Multiple Regression",
      "content": "STAT 440 | Week 5"
    },
    {
      "id": "S2",
      "type": "content",
      "title": "The Multiple Regression Model",
      "content": "Extends simple regression: $Y = \\beta_0 + \\beta_1 X_1 + \\beta_2 X_2 + \\epsilon$",
      "bullets": ["Multiple predictors", "Same OLS principle"],
      "speaker_notes": "Spend 3 minutes on this slide..."
    }
  ]
}
```

---

## /teaching:rubric

Create detailed grading rubrics for assignments.

### Syntax (/teachingrubric)

```
/teaching:rubric [assignment-type] [points] [options]
```

### Options (/teachingrubric)

| Option                         | Type   | Default | Description                                |
| ------------------------------ | ------ | ------- | ------------------------------------------ |
| `--instructions "text"` / `-i` | String | -       | Custom instructions to guide AI generation |
| `--send [EMAIL]`              | String/Flag | false | Email rubric to recipient via himalaya MCP |

### Examples (/teachingrubric)

```bash
# Generate a rubric for a data analysis project
/teaching:rubric "data analysis project"

# Generate a 100-point rubric for a research paper
/teaching:rubric "research paper" 100

# Generate with custom instructions
/teaching:rubric "research paper" -i "Weight reproducibility heavily, require tidyverse"
```

### Rubric Formats

### Traditional Grid Rubric

| Criterion    | Excellent (A)          | Proficient (B) | Developing (C)     | Points |
| ------------ | ---------------------- | -------------- | ------------------ | ------ |
| Code Quality | Clean, well-documented | Minor issues   | Significant issues | 25     |
| Analysis     | Appropriate methods    | Minor errors   | Incorrect methods  | 30     |

### Analytic Rubric

```markdown
## Code Quality (25 points)

### Outstanding (22-25 points)
- Reproducible with clear organization
- Comprehensive comments
- Efficient implementation

### Good (18-21 points)
- Mostly reproducible
- Some comments
- Reasonable efficiency
```

---

## /teaching:feedback

Generate personalized student feedback.

### Syntax (/teachingfeedback)

```
/teaching:feedback [assignment-type] [options]
```

### Options (/teachingfeedback)

| Option                         | Type   | Default | Description                                |
| ------------------------------ | ------ | ------- | ------------------------------------------ |
| `--instructions "text"` / `-i` | String | -       | Custom instructions to guide AI generation |

### Examples (/teachingfeedback)

```bash
# Generate feedback for a homework assignment
/teaching:feedback homework

# Generate feedback with specific areas for improvement
/teaching:feedback project --areas "analysis,writing"

# Generate with custom instructions
/teaching:feedback homework -i "Focus on code quality, be encouraging"
```

---

## /teaching:lecture

Generate comprehensive instructor lecture notes in Quarto format (20-40 pages). These are long-form documents with prose explanations, executable code, LaTeX math, and practice problems — not slides. Part of the weekly lecture production pipeline introduced in v2.5.0.

### Syntax (/teachinglecture)

```
/teaching:lecture <topic> [options]
```

The command operates in three modes: **Generation** (default), **Revision** (`--revise`, renamed from `--refine` in v2.8.0), and **Validation** (`--check`).

### Distinction from /teaching:slides

| Aspect | /teaching:slides | /teaching:lecture |
|--------|------------------|-------------------|
| **Purpose** | Visual presentation | Instructor reference |
| **Format** | Reveal.js/Beamer | Quarto document |
| **Length** | ~20-30 slides | 20-40 pages |
| **Content** | Bullets, minimal text | Comprehensive prose |
| **Code** | Display snippets | Full executable blocks |
| **Usage** | Project in class | Read/reference while teaching |

### Generation Options (/teachinglecture)

| Option               | Type   | Default       | Description                                                  |
| -------------------- | ------ | ------------- | ------------------------------------------------------------ |
| `--from-plan=WEEK`   | String | -             | Generate from lesson plan (e.g., `--from-plan=week03`)       |
| `--output-dir PATH`  | String | current dir   | Output directory (auto-created if missing)                   |
| `--force`            | Flag   | false         | Skip overwrite confirmation                                  |
| `--context SPEC`     | String | -             | Load previous week context: `previous` (3 weeks) or number   |
| `--open`             | Flag   | false         | Launch Quarto preview after generation                       |
| `--format FMT`       | String | `html,pdf,docx` | Quarto output formats                                      |
| `--language LANG`    | String | `r`           | Code language: `r`, `python`                                 |
| `--level LEVEL`      | String | from config   | Course level: `undergraduate`, `graduate`, `both`            |
| `--config PATH`      | String | auto-detected | Explicit config file path                                    |
| `--instructions "text"` / `-i` | String | -      | Custom instructions to guide AI generation                   |
| `--validate`            | Flag   | false         | Validate R code in generated .qmd output                     |

### Revision Options (/teachinglecture)

| Option                | Type   | Default | Description                                                |
| --------------------- | ------ | ------- | ---------------------------------------------------------- |
| `--revise PATH`       | String | -       | Path to existing `.qmd` to revise (preferred, v2.8.0)      |
| `--refine PATH`       | String | -       | Alias for `--revise` (deprecated, removed in v3.0.0)       |
| `--section TITLE`     | String | -       | Section title to revise (fuzzy matched, requires `--revise`) |
| `--instruction TEXT`  | String | -       | Revision instruction (requires `--revise`)                 |

### Validation Options (/teachinglecture)

| Option             | Type   | Default | Description                                                    |
| ------------------ | ------ | ------- | -------------------------------------------------------------- |
| `--check PATH`     | String | -       | Path to `.qmd` to validate against lesson plan (requires `--from-plan`) |

### Other Options (/teachinglecture)

| Option      | Type | Default | Description                               |
| ----------- | ---- | ------- | ----------------------------------------- |
| `--dry-run` | Flag | false   | Show outline without generating full content |
| `--json`    | Flag | false   | Output dry-run as JSON (requires `--dry-run`) |
| `--debug`   | Flag | false   | Enable debug logging                      |

### Examples (/teachinglecture)

```bash
# Generate lecture notes for a topic
/teaching:lecture "Multiple Regression"

# Generate from a lesson plan with output directory
/teaching:lecture --from-plan=week03 --output-dir=content/lectures/

# Generate with previous week context for continuity
/teaching:lecture "RCBD" --from-plan=week08 --context=previous

# Generate graduate-level lecture with Python code
/teaching:lecture "ANOVA" --level=graduate --language=python

# Generate and auto-preview in browser
/teaching:lecture "Hypothesis Testing" --from-plan=week05 --output-dir=content/lectures/ --open

# Preview the outline without generating (dry-run)
/teaching:lecture "Hypothesis Testing" --dry-run

# Dry-run with JSON output
/teaching:lecture "Hypothesis Testing" --dry-run --json

# Revise a specific section of an existing lecture (v2.8.0 preferred syntax)
/teaching:lecture --revise=content/lectures/week08-rcbd.qmd \
  --section="Worked Examples" \
  --instruction="Add two more worked examples with R code"

# Revise the entire lecture (no --section)
/teaching:lecture --revise=content/lectures/week08-rcbd.qmd \
  --instruction="Use tidyverse syntax throughout"

# Old syntax still works (deprecated, removed in v3.0.0)
/teaching:lecture --refine=content/lectures/week08-rcbd.qmd \
  --instruction="Use tidyverse syntax throughout"

# Validate lecture coverage against lesson plan
/teaching:lecture --check=content/lectures/week08-rcbd.qmd --from-plan=week08
```

### Section Types

Generated lecture notes contain these section types:

| Type           | Purpose                                     |
| -------------- | ------------------------------------------- |
| `introduction` | Opening section with overview and motivation |
| `concept`      | Main explanatory content with prose         |
| `definition`   | Formal definitions with mathematical notation |
| `theorem`      | Mathematical theorems with formal statements |
| `proof`        | Mathematical proofs (graduate level)        |
| `example`      | Worked examples with step-by-step solutions |
| `code`         | Executable R/Python code blocks             |
| `practice`     | Practice problems with solutions            |
| `discussion`   | Open-ended discussion questions             |
| `summary`      | Key takeaways and review                    |

### Output Structure (Generate lecture notes)

```json
{
  "title": "Multiple Regression",
  "topic": "Multiple Regression",
  "course_code": "STAT 440",
  "week": 5,
  "level": "undergraduate",
  "generated_at": "2026-01-14T10:30:00Z",
  "teaching_style": {
    "tone": "formal",
    "pedagogical_approach": "active-learning",
    "explanation_style": "rigorous-with-intuition"
  },
  "learning_objectives": [
    "Formulate multiple regression models with multiple predictors",
    "Interpret partial regression coefficients",
    "Assess model fit using adjusted R-squared and F-tests",
    "Diagnose multicollinearity using VIF"
  ],
  "sections": [
    {
      "id": "S1",
      "type": "introduction",
      "title": "Introduction to Multiple Regression",
      "level": 1,
      "estimated_pages": 2,
      "content": "Multiple regression extends simple linear regression..."
    },
    {
      "id": "S2",
      "type": "concept",
      "title": "The Multiple Regression Model",
      "level": 1,
      "estimated_pages": 4,
      "content": "...",
      "math": "Y_i = \\beta_0 + \\beta_1 X_{i1} + ... + \\beta_p X_{ip} + \\epsilon_i",
      "subsections": [
        {
          "id": "S2.1",
          "type": "definition",
          "title": "Model Assumptions",
          "level": 2,
          "content": "..."
        }
      ]
    },
    {
      "id": "S3",
      "type": "example",
      "title": "Example: Housing Prices",
      "level": 1,
      "estimated_pages": 5,
      "code": {
        "language": "r",
        "source": "housing <- read.csv('housing.csv')\nmodel <- lm(price ~ sqft + bedrooms, data = housing)\nsummary(model)"
      }
    },
    {
      "id": "S4",
      "type": "practice",
      "title": "Practice Problems",
      "level": 1,
      "estimated_pages": 3,
      "problems": [
        {
          "id": "P1",
          "text": "Given the following output, interpret the coefficient...",
          "solution": "...",
          "difficulty": "medium"
        }
      ]
    },
    {
      "id": "S5",
      "type": "summary",
      "title": "Key Takeaways",
      "level": 1,
      "estimated_pages": 1,
      "bullets": [
        "Multiple regression extends simple regression to multiple predictors",
        "Partial coefficients control for other variables"
      ]
    }
  ],
  "references": [
    "Kutner, M. H., et al. (2005). Applied Linear Statistical Models.",
    "James, G., et al. (2021). An Introduction to Statistical Learning."
  ]
}
```

### Generation Metadata

Every generated `.qmd` includes provenance metadata as YAML comments in the frontmatter:

```yaml
---
title: "RCBD"
# --- Scholar Generation Metadata --
# generated: 2026-02-03T14:30:00Z
# scholar_version: 2.5.0
# prompt_template: lecture-notes
# config_source: .flow/teach-config.yml
# lesson_plan: week08
# generation_time: 45.2s
# sections: 8
# --
```

These comments are invisible to Quarto rendering but allow Scholar to track provenance.

### Coverage Validation

Validate that a generated lecture covers all lesson plan objectives:

```
/teaching:lecture --check=content/lectures/week08-rcbd.qmd --from-plan=week08

# Coverage Report: week08-rcbd.qmd
# vs week08.yml
# ───────────────────────────────────────────────────
#
# Learning Objectives:
#   [x] LO-8.1: Understand RCBD design     (Section 2, 3)
#   [ ] LO-8.2: Interpret ANOVA table       (NOT FOUND)
#
# Coverage: 1/2 (50%) - 1 gap(s) found
```

- Exit code `0` for 100% coverage, `1` for gaps (CI-friendly)
- Uses keyword matching with stop-word filtering
- Strips Bloom's taxonomy verbs for better matching

### Cross-Listed Course Support

For `level: "both"` courses, the command generates differentiated callouts:

```markdown
::: {.callout-note title="Graduate Level"}
For graduate students: The formal proof follows from...
:::
```

### Tips (/teachinglecture)

- **Start from lesson plans:** Use `--from-plan=weekNN` to pull objectives, topics, and readings from your lesson plan YAML files for consistent, structured output.
- **Build continuity:** Use `--context=previous` to load summaries from the prior 3 weeks into the AI prompt so that lectures reference earlier material naturally.
- **Iterate, don't regenerate:** Use `--refine` with `--section` to fix a single section instead of regenerating the entire 20-40 page document.
- **Preview first:** Use `--dry-run` to inspect the outline and section plan before committing to a full generation (saves API tokens).
- **Automate rendering:** Pair `--output-dir` with `--open` to generate and preview in one step.
- **Validate coverage:** Run `--check` against your lesson plan before class to ensure no learning objectives are missed.

---

## /teaching:demo

Run demonstration mode to test all teaching commands with sample content.

### Syntax (/teachingdemo)

```
/teaching:demo [options]
```

### Options (/teachingdemo)

| Option            | Type   | Default    | Description                              |
| ----------------- | ------ | ---------- | ---------------------------------------- |
| `--skip-api`      | Flag   | false      | Skip real API calls (use demo templates) |
| `--format FORMAT` | String | `markdown` | Output format for demos                  |

### Examples (/teachingdemo)

```bash
# Run full demo with API calls
/teaching:demo

# Run demo without API calls (faster)
/teaching:demo --skip-api

# Run demo generating Quarto format
/teaching:demo --format quarto
```

---

## Export Formats (Run demo generating)

All commands support multiple output formats:

### Format Comparison

| Format         | Extension  | Use Case                                      | Dependencies      |
| -------------- | ---------- | --------------------------------------------- | ----------------- |
| **JSON**       | `.json`    | Raw structured data, API integration          | None              |
| **Markdown**   | `.md`      | Human-readable, version control, examark      | None              |
| **Quarto**     | `.qmd`     | PDF/HTML rendering, literate documents        | quarto (runtime)  |
| **LaTeX**      | `.tex`     | Academic typesetting, professional formatting | texlive (runtime) |
| **Canvas QTI** | `.qti.zip` | LMS import package (exams/quizzes only)       | examark (npm)     |

### Format Features

#### Markdown (`.md`)

- examark-compatible YAML frontmatter
- LaTeX math preservation (`$...$`, `$$...$$`)
- Multiple-choice with correct answer marking (`*`)
- Answer keys for all question types
- Formula sheet appendix

#### Quarto (`.qmd`)

- Enhanced YAML frontmatter
- PDF/HTML output formats
- Metadata table
- Instruction callout boxes
- LaTeX package configuration
- Code block execution

#### LaTeX (`.tex`)

- `exam` documentclass
- Proper math escaping
- Multiple-choice as `\begin{choices}`
- Rubric formatting
- Formula sheet appendix
- Professional typesetting

#### Canvas QTI (`.qti.zip`)

- Canvas-compatible QTI package
- Automatic validation
- Import simulation
- Secure command execution
- **Requires:** `examark` npm package

### Specifying Output Format

```bash
# Via -format flag
/teaching:exam midterm --format quarto

# Via file extension (if saving directly)
/teaching:exam midterm --output exam.qmd

# Generate multiple formats
/teaching:exam midterm --formats "md,qmd,tex,canvas"
```

---

## Configuration

All commands use configuration from `.flow/teach-config.yml`.

### Configuration Schema

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"  # or "graduate"
    field: "statistics"
    difficulty: "intermediate"  # "beginner", "intermediate", "advanced"
    instructor:
      name: "Dr. Jane Smith"
      email: "jane@university.edu"
      office: "Room 301"
      office_hours: "MW 2-4 PM"

  defaults:
    exam_format: "markdown"      # "md", "qmd", "tex", "canvas"
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"

  style:
    tone: "formal"               # or "conversational"
    notation: "statistical"      # LaTeX notation style
    examples: true               # Include worked examples

  ai_generation:
    model: "claude-3-5-sonnet-20241022"
    temperature: 0.7
    max_tokens: 4096
    timeout: 30000
    api_key: "sk-..."  # Optional, uses ANTHROPIC_API_KEY env var
```

### Configuration Discovery

The config loader searches parent directories for `.flow/teach-config.yml`:

```
/Users/username/courses/stat440/exams/  ← Current directory
                                        ↑ Search up
/Users/username/courses/stat440/        ↑
                                        ↑
/Users/username/courses/stat440/.flow/teach-config.yml  ← Found!
```

### Fallback Defaults

If no config file is found, the system uses sensible defaults:

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "general"
    difficulty: "intermediate"
  defaults:
    exam_format: "markdown"
    lecture_format: "markdown"
    question_types: ["multiple-choice", "short-answer", "essay"]
  style:
    tone: "formal"
    notation: "standard"
    examples: true
```

---

## Error Handling (Generate multiple formats)

### Common Errors

| Error                             | Cause                       | Solution                                   |
| --------------------------------- | --------------------------- | ------------------------------------------ |
| `API key not configured`          | Missing `ANTHROPIC_API_KEY` | Set environment variable or add to config  |
| `Configuration validation failed` | Invalid config syntax       | Check YAML syntax, validate against schema |
| `Template not found`              | Missing template file       | Ensure all template files are present      |
| `Validation failed`               | Generated content invalid   | Review AI output, adjust prompt            |
| `examark not installed`           | Missing Canvas export tool  | Install with `npm install -g examark`      |

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set debug flag
/teaching:exam midterm --debug

# Or set environment variable
export SCHOLAR_DEBUG=1
/teaching:exam midterm
```

---

## /teaching:validate

Validate YAML configuration files against schema with 4-level validation.

### Syntax (/teachingvalidate)

```
/teaching:validate <file> [options]
```

### Options (/teachingvalidate)

| Option     | Type | Default | Description                                |
| ---------- | ---- | ------- | ------------------------------------------ |
| `--all`    | Flag | false   | Validate all YAML configs in project       |
| `--strict` | Flag | false   | Strict validation mode (warnings → errors) |
| `--quiet`  | Flag | false   | Suppress warnings, errors only             |
| `--fix`    | Flag | false   | Auto-fix syntax errors                     |

### Validation Levels

1. **YAML Syntax** - Valid YAML structure (indentation, colons, quotes)
2. **JSON Schema** - Conforms to teach-config or lesson-plan schema
3. **LaTeX Validation** - Math notation compiles (`$...$`, `$$...$$`)
4. **Completeness** - Required fields present (course_info, defaults, style)

### Examples (/teachingvalidate)

```bash
# Validate single file
/teaching:validate .flow/teach-config.yml

# Validate specific lesson plan
/teaching:validate content/lesson-plans/week03.yml

# Validate all configs in project
/teaching:validate --all

# Strict mode (warnings become errors)
/teaching:validate .flow/teach-config.yml --strict

# Auto-fix syntax errors
/teaching:validate .flow/teach-config.yml --fix

# Quiet mode (errors only)
/teaching:validate --all --quiet
```

### Output Format

### IDE-style error messages

```
.flow/teach-config.yml:12:3: error: Missing required field 'course_title'
.flow/teach-config.yml:15:5: warning: Deprecated field 'title' (use 'course_title')
content/lesson-plans/week03.yml:8:10: error: Invalid LaTeX: unclosed $

Summary:
❌ Validation failed (2 errors, 1 warning)
```

### Exit codes

- `0` - Validation passed
- `1` - Validation failed (errors found)
- `2` - File not found or YAML parse error

### Use Cases

- Pre-commit validation (ensure configs are valid before commit)
- CI/CD pipelines (block deploys with invalid configs)
- Development debugging (find syntax errors quickly)
- Migration testing (validate after schema upgrades)

---

## /teaching:diff

Compare YAML and JSON sync status.

### Syntax (/teachingdiff)

```
/teaching:diff <file> [options]
```

### Options (/teachingdiff)

| Option      | Type | Default | Description                               |
| ----------- | ---- | ------- | ----------------------------------------- |
| `--all`     | Flag | false   | Check sync status for all YAML/JSON pairs |
| `--verbose` | Flag | false   | Show detailed diff output                 |
| `--json`    | Flag | false   | Output sync status as JSON                |

### Examples (/teachingdiff)

```bash
# Check sync status for single file
/teaching:diff teach-config.yml

# Check sync status for lesson plan
/teaching:diff content/lesson-plans/week03.yml

# Check all configs
/teaching:diff --all

# Verbose output with diffs
/teaching:diff teach-config.yml --verbose

# JSON output (for automation)
/teaching:diff --all --json
```

### Output Structure (JSON output (for)

### Terminal output

```
teach-config.yml:
  Status: ✅ In Sync
  YAML Hash: a3b2c1d4...
  JSON Hash: a3b2c1d4...
  Last Sync: 2026-01-15T10:30:00Z
  Cache Age: 5m 30s
```

### JSON output

```json
{
  "file": "teach-config.yml",
  "inSync": true,
  "yamlHash": "a3b2c1d4...",
  "jsonHash": "a3b2c1d4...",
  "lastSync": "2026-01-15T10:30:00Z",
  "cacheAge": "5m 30s"
}
```

### Sync States

- ✅ **In Sync** - YAML and JSON match (identical hashes)
- ⚠️ **Out of Sync** - YAML changed, JSON needs update (run `/teaching:sync`)
- ❌ **Missing JSON** - JSON file doesn't exist (run `/teaching:sync`)
- ❌ **Invalid YAML** - YAML has syntax/schema errors (run `/teaching:validate`)

### Performance (JSON output (for)

- Hash comparison: ~5ms per file
- Cache lookup: ~2ms per file
- No file parsing (hash-based only)

---

## /teaching:sync

Synchronize YAML to JSON (manual trigger).

### Syntax (/teachingsync)

```
/teaching:sync [file] [options]
```

### Options (/teachingsync)

| Option      | Type | Default | Description                                         |
| ----------- | ---- | ------- | --------------------------------------------------- |
| `--force`   | Flag | false   | Force re-sync (bypass hash check, rewrite all JSON) |
| `--dry-run` | Flag | false   | Preview sync without writing files                  |
| `--verbose` | Flag | false   | Show detailed sync progress                         |

### Examples (/teachingsync)

```bash
# Sync all YAML files in project
/teaching:sync

# Sync specific file
/teaching:sync teach-config.yml

# Force re-sync (ignore cache)
/teaching:sync --force

# Preview sync without writing files
/teaching:sync --dry-run

# Verbose output
/teaching:sync --verbose
```

### Sync Process

1. **Find YAML** - Locate all `*.yml` files in `.flow/` and `content/`
2. **Hash Check** - Compare SHA-256 hash with cache (skip if unchanged)
3. **Validate** - 4-level validation (YAML, schema, LaTeX, completeness)
4. **Parse** - Parse YAML to JSON
5. **Write** - Write JSON to same directory as YAML
6. **Cache** - Update `.scholar-cache/sync-status.json` with new hash

### Performance (Verbose output)

- Unchanged files: ~5ms (hash check only)
- Changed files: ~80ms (parse + validate + write)
- Typical project (10 files): ~150ms total

### Output (Verbose output)

```
Syncing 10 YAML files...

✅ teach-config.yml → teach-config.json (80ms)
⏭️ week01.yml (unchanged, skipped)
⏭️ week02.yml (unchanged, skipped)
✅ week03.yml → week03.json (75ms)
❌ week04.yml (validation failed, see errors below)

Summary:
  2 synced, 2 skipped, 1 failed
  Total time: 155ms
```

### Automatic Sync Triggers

- Pre-command hook (before Scholar commands run)
- Pre-commit hook (before git commits)
- GitHub Actions (on CI/CD push)

### Cache Location

```
.scholar-cache/
  sync-status.json    # Hash tracking, sync timestamps
```

### Error Handling (Verbose output)

- Validation errors block sync (prevents broken JSON)
- Missing YAML files are skipped (warnings only)
- Corrupt cache is auto-rebuilt on next sync

---

## /teaching:migrate

Migrate YAML configuration files from v1 to v2 schema with atomic batch migration.

### Syntax (/teachingmigrate)

```
/teaching:migrate [options]
```

### Modes

- **`--detect`** - Find v1 schema files and show complexity scoring (0-10)
- **`--dry-run`** - Preview colored diffs without modifying files
- **Default mode** - Apply migration with git commit automation
- **`--file <path>`** - Migrate specific file only

### Options (/teachingmigrate)

| Option            | Type   | Default | Description                               |
| ----------------- | ------ | ------- | ----------------------------------------- |
| `--detect`        | Flag   | false   | Detect v1 files with complexity scoring   |
| `--dry-run`       | Flag   | false   | Preview migration without modifying files |
| `--file PATH`     | String | -       | Migrate specific file only                |
| `--no-git`        | Flag   | false   | Skip git commit (still applies migration) |
| `--no-git-check`  | Flag   | false   | Skip git safety check (dangerous!)        |
| `--patterns GLOB` | String | -       | Custom glob patterns (comma-separated)    |
| `--debug`         | Flag   | false   | Enable debug logging                      |

### Examples (/teachingmigrate)

```bash
# Detect v1 files with complexity
/teaching:migrate --detect

# Preview migration changes
/teaching:migrate --dry-run

# Apply migration with git commit
/teaching:migrate

# Migrate single file
/teaching:migrate --file content/lesson-plans/week-01.yml

# Apply without git commit (manual control)
/teaching:migrate --no-git

# Custom glob patterns
/teaching:migrate --patterns ".flow/**/*.yml,lesson-plans/*.yml"
```

### Features

- **Atomic semantics** - All-or-nothing migration with rollback
- **Git integration** - Automated commits with descriptive messages
- **Git safety** - Checks for uncommitted changes before migration
- **Complexity scoring** - Helps prioritize migration effort (0-10 scale)
- **Security hardened** - Uses `execFileNoThrow` (prevents command injection)

### Complexity Categories

| Score | Category    | Description                         | Example Changes                        |
| ----- | ----------- | ----------------------------------- | -------------------------------------- |
| 0-3   | **Simple**  | Few field renames                   | `title` → `course_title` (1-2 changes) |
| 4-6   | **Medium**  | Multiple renames + type conversions | 3-5 field changes, array→object        |
| 7-10  | **Complex** | Many changes + nested structures    | 6+ changes, deep nesting updates       |

### Rollback Guarantee

Migration uses in-memory backups:

- All original file content stored before changes
- Any failure triggers automatic rollback
- Restores exact original content
- No partial migrations (all-or-nothing)

### Output (Custom glob patterns)

### Detect mode

```
Found 12 v1 schema files

Simple (0-3):
  week-01.yml (complexity: 2)
  week-02.yml (complexity: 1)

Medium (4-6):
  week-03.yml (complexity: 5)
  week-04.yml (complexity: 4)

Complex (7-10):
  week-05.yml (complexity: 8)

Total: 12 files (5 simple, 5 medium, 2 complex)
```

### Migration mode

```
Found 12 v1 schema files

Step 1: Detecting v1 schema files...
Step 2: Checking git status...
Step 3: Migrating files...

[1/12] week-01.yml... ✅
[2/12] week-02.yml... ✅
...

✓ Migration complete!
Processed: 12 files
Commit: abc123def456

Next steps:
  1. Review changes: git show abc123def456
  2. Validate configs: /teaching:validate --all
  3. Push to remote: git push
```

### Dry-run mode

```diff
week-01.yml:

+ course_info:
-   title: "Statistics 101"
+   course_title: "Statistics 101"

Summary: 1 change (1 addition, 1 deletion)
```

---

## /teaching:config

Manage configuration, prompt templates, and generation provenance. This command provides a unified interface for inspecting, customizing, and validating the 4-layer config hierarchy (Scholar defaults, project config, week overrides, CLI flags).

### Syntax (/teachingconfig)

```
/teaching:config <subcommand> [options]
```

### Subcommands

| Subcommand | Purpose | Description |
| ---------- | ------- | ----------- |
| `scaffold <type>` | Customize prompts | Copy default prompt template to `.flow/` for customization |
| `show [options]` | Inspect config | Display resolved 4-layer config hierarchy |
| `validate [options]` | Pre-flight check | Validate all `.flow/` configuration files |
| `diff [type]` | Compare prompts | Compare project prompts against Scholar defaults |
| `trace <file>` | Show provenance | Show generation provenance for a file |

### scaffold

Copy a default prompt template to `.flow/templates/prompts/` for local customization.

**Valid scaffold types:** `lecture-notes`, `lecture-outline`, `section-content`, `exam`, `quiz`, `slides`, `revealjs-slides`, `assignment`, `syllabus`, `rubric`, `feedback`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `<type>` | String | (required) | Prompt template type to scaffold |

```bash
# Scaffold the lecture-notes prompt for customization
/teaching:config scaffold lecture-notes

# Scaffold the exam prompt
/teaching:config scaffold exam

# Scaffold the slides prompt
/teaching:config scaffold slides
```

Output: Creates `.flow/templates/prompts/<type>.md` with the Scholar default prompt, ready for editing.

### show

Display the resolved configuration hierarchy showing how values are merged across layers.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `--command CMD` | String | - | Filter config for a specific command |
| `--week N` | Number | - | Show week-specific overrides |
| `--prompt TYPE` | String | - | Show resolved prompt template for a type |

```bash
# Show full resolved config hierarchy
/teaching:config show

# Show config resolved for the lecture command
/teaching:config show --command lecture

# Show config for week 4 of the lecture command
/teaching:config show --command lecture --week 4

# Show the resolved prompt template for exam
/teaching:config show --prompt exam
```

### validate

Pre-flight validation of all `.flow/` configuration files (config, prompts, templates).

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `--strict` | Flag | false | Warnings become errors (non-zero exit on warnings) |
| `--json` | Flag | false | Output validation results as JSON |

```bash
# Validate all configuration
/teaching:config validate

# Strict mode (warnings become errors)
/teaching:config validate --strict

# JSON output (for CI/CD pipelines)
/teaching:config validate --json

# Strict mode with JSON output
/teaching:config validate --strict --json
```

### diff

Compare project-local prompts against Scholar's built-in defaults to see what has been customized.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `[TYPE]` | String | all types | Specific prompt type to diff |

```bash
# Diff all customized prompts against defaults
/teaching:config diff

# Diff only the lecture-notes prompt
/teaching:config diff lecture-notes

# Diff the exam prompt
/teaching:config diff exam
```

### trace

Show generation provenance for a file, including which config, prompt template, and Scholar version were used to generate it.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `<file>` | String | (required) | Path to a generated file |

```bash
# Show provenance for a generated lecture
/teaching:config trace lectures/week-04.qmd

# Show provenance for a generated exam
/teaching:config trace exams/midterm-exam.qmd
```

### Examples (/teachingconfig)

```bash
# Full config management workflow
/teaching:config scaffold lecture-notes      # 1. Scaffold prompt
# Edit .flow/templates/prompts/lecture-notes.md
/teaching:config validate                    # 2. Validate config
/teaching:config show --command lecture --week 4  # 3. Review hierarchy
/teaching:config diff lecture-notes          # 4. Check customizations
/teaching:config trace lectures/week-04.qmd  # 5. Verify provenance

# CI/CD pipeline validation
/teaching:config validate --strict --json

# Quick check after upgrading Scholar
/teaching:config diff
```

### Exit Codes

- `0` - Success (validation passed, no issues)
- `1` - Validation failed (errors found)
- `2` - File not found or parse error

---

## /teaching:preflight

Pre-release health checks for Scholar projects. Validates version sync, conflict markers, test counts, cache cleanup, changelog, and status file freshness.

### Usage

```
/teaching:preflight
/teaching:preflight --fix
/teaching:preflight --json
/teaching:preflight --quick
```

### Options (/teachingpreflight)

| Option | Description |
|--------|-------------|
| `--fix` | Auto-fix fixable issues (delete stale cache, etc.) |
| `--json` | Output results as JSON |
| `--quick` | Skip slow checks (test count verification) |
| `--debug` | Enable verbose debug output |

### Checks

| Check | Description | Fixable |
|-------|-------------|---------|
| version-sync | Compares package.json, plugin.json, mkdocs.yml | No |
| conflict-markers | Scans src/ and docs/ for merge conflict markers | No |
| test-counts | Verifies mkdocs.yml test counts | Yes |
| cache-cleanup | Warns if discovery cache.json exists | Yes |
| changelog | Top entry matches current version | No |
| status-file | Warns if .STATUS > 7 days old | No |

---

## /teaching:canvas

Convert QMD exam files to Canvas LMS QTI format via examark.

### Usage

```
/teaching:canvas <input-file>
/teaching:canvas midterm.qmd --output midterm.qti.zip
/teaching:canvas midterm.qmd --dry-run
/teaching:canvas midterm.qmd --validate --emulate
```

### Options (/teachingcanvas)

| Option | Description |
|--------|-------------|
| `--output PATH` | Output file path (default: `<input>.qti.zip`) |
| `--dry-run` | Parse and show detected questions without converting |
| `--intermediate` | Keep the intermediate examark `.md` file |
| `--validate` | Run `examark verify` on the generated QTI package |
| `--emulate` | Simulate Canvas import |
| `--split-parts` | Split multi-part questions (default: true) |
| `--default-type TYPE` | Fallback question type (default: Essay) |

### Pipeline

```
.qmd → parse → detect types → examark MD → examark CLI → .qti.zip
```

### Supported Question Types

| Tag | Type |
|-----|------|
| `[MC]` | Multiple Choice |
| `[MA]` | Multiple Answer |
| `[TF]` | True/False |
| `[Short]` | Short Answer |
| `[Numeric]` | Numeric |
| `[Essay]` | Essay |
| `[Match]` | Matching |
| `[FMB]` | Fill-in-Multiple-Blanks |
| `[FIB]` | Fill-in-Blank |
| `[Upload]` | File Upload (degrades to Essay) |

### Also Available Via

- `/teaching:exam --format canvas` — generate exam and export to QTI
- `/teaching:quiz --format canvas` — generate quiz and export to QTI
- `/teaching:assignment --format canvas` — generate assignment and export to QTI

### Requirements

- [examark](https://github.com/Data-Wise/examark) v0.6.6+ (`npm install -g examark`)

---

## Best Practices

### Question Design

1. **Clear stems** - Avoid ambiguous wording
2. **One correct answer** - No debatable "best" answers
3. **Plausible distractors** - All options should seem reasonable
4. **Consistent difficulty** - Mix throughout assessment
5. **LaTeX math** - Use proper notation: `$\beta$`, `$$\sum_{i=1}^n$$`

### Problem Design

1. **Multi-part structure** - Break complex problems into parts
2. **Clear instructions** - Provide all needed information
3. **Point allocation** - Proportional to difficulty
4. **Scaffolding** - Provide hints for harder problems
5. **Real-world context** - Include applications

### Slide Design

1. **One concept per slide** - Avoid information overload
2. **Visual hierarchy** - Use headers, bullets, emphasis
3. **Examples** - Include worked examples
4. **Speaker notes** - Add teaching notes
5. **Timing** - Allocate realistic time per slide

---

## Related Documentation

- [Architecture](ARCHITECTURE.md) - System architecture
- [User Guide](USER-GUIDE.md) - Step-by-step workflows
- [Configuration Reference](CONFIGURATION.md) - Detailed config options
- [Developer Guide](DEVELOPER-GUIDE.md) - Contributing guide
