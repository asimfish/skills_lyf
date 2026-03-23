<!-- markdownlint-disable MD051 -->
<!-- Heading slugs with /: characters produce valid GitHub fragments but trigger false positives -->

# Scholar Teaching Commands - API Reference

**Version:** {{ scholar.version }}
**Format:** REST-like Command Interface
**Base Namespace:** `/teaching:`

This document provides a comprehensive API reference for all Scholar teaching commands, structured similar to OpenAPI specifications.

---

## Table of Contents

1. [Content Generation Commands](#content-generation-commands)
   - [/teaching:exam](#teachingexam)
   - [/teaching:quiz](#teachingquiz)
   - [/teaching:assignment](#teachingassignment)
   - [/teaching:solution](#teachingsolution)
   - [/teaching:lecture](#teachinglecture)
   - [/teaching:slides](#teachingslides)
   - [/teaching:syllabus](#teachingsyllabus)
   - [/teaching:rubric](#teachingrubric)
   - [/teaching:feedback](#teachingfeedback)
2. [Workflow Commands](#workflow-commands)
   - [/teaching:demo](#teachingdemo)
3. [Configuration Management Commands](#configuration-management-commands)
   - [/teaching:validate](#teachingvalidate)
   - [/teaching:sync](#teachingsync)
   - [/teaching:diff](#teachingdiff)
   - [/teaching:migrate](#teachingmigrate)
   - [/teaching:config](#teachingconfig)
4. [Quality & Export Commands](#quality--export-commands)
   - [/teaching:validate-r](#teachingvalidate-r)
   - [/teaching:preflight](#teachingpreflight)
   - [/teaching:canvas](#teachingcanvas)

---

## Content Generation Commands

### /teaching:exam

Generate comprehensive exams with AI-powered questions and automatic answer keys.

#### Endpoint (/teachingexam)

```
/teaching:exam [type] [options]
```

#### Parameters (/teachingexam)

| Parameter        | Type    | Required | Default     | Description                                       |
| ---------------- | ------- | -------- | ----------- | ------------------------------------------------- |
| `type`           | string  | No       | `midterm`   | Exam type: `midterm`, `final`, `practice`, `quiz` |
| `--questions`    | integer | No       | 10          | Number of questions to generate                   |
| `--difficulty`   | enum    | No       | from config | Difficulty level: `easy`, `medium`, `hard`        |
| `--duration`     | integer | No       | 60          | Duration in minutes                               |
| `--topics`       | string  | No       | -           | Comma-separated topics to cover                   |
| `--no-formulas`  | boolean | No       | false       | Exclude formula sheet                             |
| `--no-solutions` | boolean | No       | false       | Exclude detailed solutions                        |
| `--strict`       | boolean | No       | false       | Use strict validation                             |
| `--variations`   | integer | No       | -           | Generate N variations of the exam                 |
| `--dry-run`      | boolean | No       | false       | Preview without API calls                         |
| `--json`         | boolean | No       | false       | Output dry-run as JSON (requires --dry-run)       |
| `--config`       | string  | No       | -           | Explicit config file path                         |
| `--debug`        | boolean | No       | false       | Enable debug logging                              |

#### Request Schema (/teachingexam)

```javascript
{
  type: 'midterm' | 'final' | 'practice' | 'quiz',
  questionCount: number,
  difficulty: 'easy' | 'medium' | 'hard',
  durationMinutes: number,
  topics: string[],
  includeFormulas: boolean,
  includeSolutions: boolean,
  strict: boolean,
  format: 'json',
  dryRun: boolean,
  configPath?: string
}
```

#### Response Schema (/teachingexam)

```javascript
{
  content: {
    exam_type: string,
    title: string,
    duration_minutes: number,
    total_points: number,
    instructions: string,
    questions: [
      {
        id: string,
        type: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false' | 'numerical',
        text: string,
        points: number,
        options?: string[],
        correct_answer?: string,
        rubric?: object
      }
    ],
    answer_key: object,
    formula_sheet?: string
  },
  metadata: {
    questionCount: number,
    totalPoints: number,
    duration: number,
    tokens: number
  },
  validation: {
    isValid: boolean,
    errors: string[],
    warnings: string[]
  }
}
```

#### Examples (/teachingexam)

```bash
# Basic midterm exam
/teaching:exam midterm

# Custom final exam with 15 hard questions
/teaching:exam final --questions 15 --difficulty hard

# Practice exam on specific topics
/teaching:exam practice --topics "linear regression,hypothesis testing"

# Generate 3 variations
/teaching:exam midterm --variations 3

# Preview without generating
/teaching:exam midterm --dry-run
```

#### Output Files (Preview without generating)

- `exam-{type}-{timestamp}.json` - Complete exam structure

#### Quality Assurance

- ✅ Validated against JSON Schema
- ✅ LaTeX syntax checked
- ✅ Answer keys verified
- ✅ Question ID mapping tested

---

### /teaching:quiz

Create quiz questions for course material with automatic grading support.

#### Endpoint (/teachingquiz)

```
/teaching:quiz <topic> [num-questions] [options]
```

#### Parameters (/teachingquiz)

| Parameter       | Type    | Required | Default    | Description                                                   |
| --------------- | ------- | -------- | ---------- | ------------------------------------------------------------- |
| `topic`         | string  | Yes      | -          | Quiz topic                                                    |
| `num-questions` | integer | No       | -          | Number of questions (can use --questions instead)             |
| `--questions`   | integer | No       | 10         | Number of questions                                           |
| `--difficulty`  | enum    | No       | `mixed`    | Difficulty: `easy`, `medium`, `hard`, `mixed`                 |
| `--format`      | enum    | No       | `markdown` | Output format: `markdown`, `canvas`, `moodle`, `pdf`, `latex` |
| `--dry-run`     | boolean | No       | false      | Preview without API calls                                     |
| `--json`        | boolean | No       | false      | Output dry-run as JSON                                        |
| `--config`      | string  | No       | -          | Explicit config file path                                     |
| `--debug`       | boolean | No       | false      | Enable debug logging                                          |

#### Request Schema (/teachingquiz)

```javascript
{
  topic: string,
  questionCount: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  format: 'markdown' | 'canvas' | 'moodle' | 'pdf' | 'latex',
  dryRun: boolean,
  configPath?: string
}
```

#### Response Schema (/teachingquiz)

```markdown
# Quiz: {Topic Name}

**Instructions:** Select the best answer for each question.

---

## Question 1 (Multiple Choice)

{Question text}

A) {Option A}
B) {Option B}
C) {Option C}
D) {Option D}

**Answer:** B
**Explanation:** {Explanation}
**Learning Objective:** {LO reference}
**Difficulty:** {Level}
```

#### Examples (Question 1 (Multiple)

```bash
# Basic quiz
/teaching:quiz "Linear Regression"

# Custom number of questions
/teaching:quiz "Confidence Intervals" 10

# Mixed difficulty with Canvas export
/teaching:quiz "ANOVA" 15 --difficulty mixed --format canvas

# Preview only
/teaching:quiz "Regression" --dry-run
```

#### Question Type Distribution (Default)

- 60% Multiple Choice (6 questions)
- 20% True/False (2 questions)
- 10% Short Answer (1 question)
- 10% Calculation (1 question)

---

### /teaching:assignment

Generate homework assignments with solutions and grading rubrics.

#### Endpoint (/teachingassignment)

```
/teaching:assignment [topic] [options]
```

#### Parameters (/teachingassignment)

| Parameter         | Type    | Required | Default      | Description                                                    |
| ----------------- | ------- | -------- | ------------ | -------------------------------------------------------------- |
| `topic`           | string  | No       | -            | Assignment topic                                               |
| `--type`          | enum    | No       | `homework`   | Type: `homework`, `problem-set`, `lab`, `project`, `worksheet` |
| `--problems`      | integer | No       | 5            | Number of problems                                             |
| `--points`        | integer | No       | 100          | Total points                                                   |
| `--difficulty`    | enum    | No       | -            | Difficulty: `beginner`, `intermediate`, `advanced`             |
| `--topics`        | string  | No       | -            | Comma-separated specific topics                                |
| `--week`          | integer | No       | -            | Course week number                                             |
| `--due`           | string  | No       | -            | Due date                                                       |
| `--time`          | string  | No       | `2-3 hours`  | Estimated completion time                                      |
| `--include-code`  | boolean | No       | false        | Include programming problems                                   |
| `--language`      | enum    | No       | `R`          | Programming language: `R`, `Python`, `Julia`                   |
| `--no-solutions`  | boolean | No       | false        | Exclude solution key                                           |
| `--no-rubric`     | boolean | No       | false        | Exclude grading rubric                                         |
| `--submission`    | enum    | No       | `pdf`        | Submission format: `pdf`, `online`, `code`, `mixed`            |
| `--collaboration` | enum    | No       | `individual` | Collaboration policy: `individual`, `groups-allowed`           |
| `--config`        | string  | No       | -            | Explicit config file path                                      |
| `--debug`         | boolean | No       | false        | Enable debug logging                                           |

#### Request Schema (/teachingassignment)

```javascript
{
  type: 'homework' | 'problem-set' | 'lab' | 'project' | 'worksheet',
  topic: string,
  problemCount: number,
  totalPoints: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  topics: string[],
  week?: number,
  dueDate?: string,
  estimatedTime: string,
  includeCode: boolean,
  language: 'R' | 'Python' | 'Julia',
  generateSolutions: boolean,
  generateRubric: boolean,
  submissionFormat: 'pdf' | 'online' | 'code' | 'mixed',
  collaborationPolicy: 'individual' | 'groups-allowed'
}
```

#### Response Schema (/teachingassignment)

```javascript
{
  title: string,
  assignment_type: string,
  assignment_number: number,
  due_date: string,
  total_points: number,
  estimated_time: string,
  instructions: string,
  submission_format: string,
  collaboration_policy: string,
  late_policy: string,
  topic: string,
  week: number,
  learning_objectives: string[],
  problems: [
    {
      id: string,
      text: string,
      points: number,
      parts?: [
        { label: string, text: string, points: number }
      ],
      difficulty: string,
      topic: string,
      learning_objective: string
    }
  ],
  solutions: object,
  rubric: object
}
```

#### Examples (/teachingassignment)

```bash
# Basic homework
/teaching:assignment "Linear Regression"

# Custom problem set
/teaching:assignment homework --problems 5 --difficulty intermediate

# Lab with code
/teaching:assignment lab --topic "Bootstrap Methods" --include-code

# Multi-topic problem set
/teaching:assignment problem-set --topics "ANOVA,regression" --week 8

# Preview only 2
/teaching:assignment "ANOVA" --dry-run
```

#### Difficulty Distribution (Default)

- 20% Easy (foundational)
- 50% Medium (core concepts)
- 25% Hard (synthesis)
- 5% Challenge (optional)

---

### /teaching:solution

Generate standalone solution keys from existing assignment files. Reads `.qmd` or `.json` assignments, identifies problems, and produces step-by-step solutions as a separate document.

#### Endpoint (/teachingsolution)

```
/teaching:solution <assignment-file> [options]
```

#### Parameters (/teachingsolution)

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `assignment-file` | string | Yes | - | Path to `.qmd`, `.md`, or `.json` assignment file |
| `--format` | enum | No | `qmd` | Output format: `qmd`, `md`, `json` |
| `--output` | string | No | auto | Custom output path |
| `--include-rubric` | boolean | No | false | Include grading notes and partial credit guidance |
| `--include-code` | boolean | No | true | Include R/Python code solutions |
| `--language` | enum | No | `R` | Programming language: `R`, `Python` |
| `--no-code` | boolean | No | false | Exclude code solutions |
| `--config` | string | No | auto | Explicit config file path |
| `-i` / `--instructions` | string | No | - | Custom AI instructions (text or `@file.txt`) |
| `--dry-run` | boolean | No | false | Preview without API calls |
| `--json` | boolean | No | false | Output dry-run as JSON (requires `--dry-run`) |
| `--send` | string/boolean | No | false | Email solution to TA. Use `--send` for config email or `--send ta@email.com` |
| `--debug` | boolean | No | false | Enable debug logging |

#### Response Schema (/teachingsolution)

```json
{
  "assignment_title": "Assignment 1: Basics of Experimental Design",
  "solutions": {
    "P1": {
      "answer": "The treatment has a significant effect, F(2, 27) = 8.43, p = 0.0015",
      "steps": ["Step 1: State hypotheses...", "Step 2: Calculate..."],
      "parts": { "a": "...", "b": "..." },
      "code": "fit <- aov(response ~ treatment, data = experiment)\nsummary(fit)",
      "interpretation": "The data provide strong evidence against...",
      "common_mistakes": ["Using t-test instead of ANOVA — deduct 5 pts"],
      "grading_notes": "Award 5 pts for correct setup even if calculation has minor errors."
    }
  },
  "general_notes": "Students should show work for hand calculations."
}
```

#### Output Path Convention (/teachingsolution)

Default output goes to a `solutions/` sibling directory:

```
assignments/assignment1.qmd  →  solutions/assignment1-solution.qmd
assignments/hw3.json         →  solutions/hw3-solution.qmd
```

#### Examples (/teachingsolution)

```bash
# Basic usage
/teaching:solution assignments/assignment1.qmd

# With rubric notes for TA grading
/teaching:solution assignments/hw3.qmd --include-rubric

# Markdown format, custom output path
/teaching:solution assignments/hw3.json --format md --output keys/hw3-key.md

# With custom instructions
/teaching:solution assignments/assignment2.qmd -i "Focus on step-by-step derivations"

# Preview without API call
/teaching:solution assignments/assignment1.qmd --dry-run

# Email solution to TA
/teaching:solution assignments/assignment1.qmd --send
/teaching:solution assignments/assignment1.qmd --send ta@university.edu
```

#### Notes (/teachingsolution)

- Supports custom instructions via `-i` flag (AI-capable command)
- Parses QMD frontmatter and Exercise/Problem heading patterns automatically
- Solutions directory should be gitignored in public repositories
- `--send` uses himalaya MCP for email; resolves recipient from flag value or `course.staff.ta_email` in config

---

### /teaching:lecture

Generate comprehensive instructor lecture notes in Quarto format (20-40 pages). Supports three modes: generation, refinement, and validation.

**v2.5.0:** Added `--output-dir`, `--refine`, `--section`, `--instruction`, `--context`, `--check`, `--open`, `--force` flags and generation provenance metadata.

#### Endpoint (/teachinglecture)

```
/teaching:lecture <topic> [options]           # Generation mode
/teaching:lecture --refine=<path> [options]   # Refinement mode
/teaching:lecture --check=<path> [options]    # Validation mode
```

#### Parameters — Generation (/teachinglecture)

| Parameter      | Type    | Required    | Default          | Description                                                |
| -------------- | ------- | ----------- | ---------------- | ---------------------------------------------------------- |
| `topic`        | string  | Conditional | -                | Lecture topic (required unless --from-plan)                |
| `--from-plan`  | string  | No          | -                | Generate from lesson plan (e.g., week03)                   |
| `--output-dir` | string  | No          | `.` (cwd)        | Output directory path (auto-created if missing)            |
| `--force`      | boolean | No          | false            | Skip overwrite confirmation                                |
| `--context`    | string  | No          | -                | Load previous week context: `previous` (3 weeks) or `N`    |
| `--open`       | boolean | No          | false            | Launch Quarto preview after generation                     |
| `--format`     | string  | No          | `html,pdf,docx`  | Quarto output formats (comma-separated)                    |
| `--language`   | enum    | No          | `r`              | Code language: `r`, `python`                               |
| `--level`      | enum    | No          | from config      | Override course level: `undergraduate`, `graduate`, `both` |
| `--config`     | string  | No          | -                | Explicit config file path                                  |
| `--dry-run`    | boolean | No          | false            | Show outline without generating                            |
| `--json`       | boolean | No          | false            | Output dry-run as JSON                                     |
| `--debug`      | boolean | No          | false            | Enable debug logging                                       |

#### Parameters — Refinement (/teachinglecture)

| Parameter       | Type    | Required | Default | Description                                      |
| --------------- | ------- | -------- | ------- | ------------------------------------------------ |
| `--refine`      | string  | Yes      | -       | Path to existing .qmd to refine                  |
| `--section`     | string  | No       | -       | Section title (fuzzy matched); omit for full     |
| `--instruction` | string  | Yes      | -       | Refinement instruction                           |
| `--open`        | boolean | No       | false   | Launch Quarto preview after refinement           |
| `--debug`       | boolean | No       | false   | Enable debug logging                             |

#### Parameters — Validation (/teachinglecture)

| Parameter     | Type    | Required | Default | Description                              |
| ------------- | ------- | -------- | ------- | ---------------------------------------- |
| `--check`     | string  | Yes      | -       | Path to .qmd to validate                 |
| `--from-plan` | string  | Yes      | -       | Lesson plan week ID to validate against  |
| `--debug`     | boolean | No       | false   | Enable debug logging                     |

#### Request Schema (/teachinglecture)

```javascript
{
  // Generation
  topic: string,
  fromPlan?: string,
  outputDir?: string,
  force?: boolean,
  context?: string | number,
  open?: boolean,
  format: string,
  language: 'r' | 'python',
  level?: 'undergraduate' | 'graduate' | 'both',
  configPath?: string,
  dryRun: boolean,
  json: boolean,
  // Refinement
  refine?: string,
  section?: string,
  instruction?: string,
  // Validation
  check?: string,
  // Meta
  debug: boolean
}
```

#### Response Schema — Generation (/teachinglecture)

```javascript
{
  title: string,
  topic: string,
  course_code: string,
  week?: number,
  level: 'undergraduate' | 'graduate' | 'both',
  generated_at: string,
  teaching_style: {
    tone: string,
    pedagogical_approach: string,
    explanation_style: string
  },
  learning_objectives: string[],
  sections: [
    {
      id: string,
      type: 'introduction' | 'concept' | 'definition' | 'theorem' | 'proof' | 'example' | 'code' | 'practice' | 'discussion' | 'summary',
      title: string,
      level: number,
      estimated_pages: number,
      content: string,
      math?: string,
      code?: { language: string, source: string },
      subsections?: object[]
    }
  ],
  references: string[],
  provenance: {                      // NEW in v2.5.0
    generated: string,               // ISO timestamp
    scholar_version: string,         // e.g., "2.5.0"
    prompt_template: string,         // template identifier
    config_source: string,           // config file path
    lesson_plan?: string,            // week ID if --from-plan
    teaching_style?: string,         // style summary
    generation_time: string,         // e.g., "45.2s"
    sections: number                 // section count
  }
}
```

#### Response Schema — Refinement (/teachinglecture)

```javascript
{
  file: string,              // path to updated file
  mode: 'section' | 'full', // refinement mode
  section: string | null,    // section title or null for full
  instruction: string,       // applied instruction
  elapsed: number,           // seconds
  content: string            // full updated document
}
```

#### Response Schema — Validation (/teachinglecture)

```javascript
{
  lectureFile: string,
  lessonPlan: string,
  coveragePercent: number,          // 0-100
  objectives: [{
    id: string,                     // "LO-8.1"
    description: string,
    covered: boolean,
    foundInSections: string[]
  }],
  topics: [{
    id: string,
    description: string,
    covered: boolean,
    foundInSections: string[]
  }],
  gaps: string[]                    // uncovered item descriptions
}
```

#### Examples (/teachinglecture)

```bash
# Basic lecture notes
/teaching:lecture "Multiple Regression"

# From lesson plan with output directory
/teaching:lecture --from-plan=week05 --output-dir=content/lectures/

# With context and auto-preview
/teaching:lecture "RCBD" --from-plan=week08 --context=previous --open

# Graduate level with Python
/teaching:lecture "ANOVA" --level=graduate --language=python

# Force overwrite
/teaching:lecture "RCBD" --from-plan=week08 --output-dir=content/lectures/ --force

# Preview outline
/teaching:lecture "Hypothesis Testing" --dry-run

# Refine a section
/teaching:lecture --refine=content/lectures/week08-rcbd.qmd \
  --section="Worked Examples" \
  --instruction="Add two more examples with R code"

# Full-lecture refinement
/teaching:lecture --refine=content/lectures/week08-rcbd.qmd \
  --instruction="Use tidyverse syntax throughout"

# Validate coverage
/teaching:lecture --check=content/lectures/week08-rcbd.qmd --from-plan=week08
```

#### Output Files

**Generation mode:**

- With `--from-plan=weekNN`: `week{NN}-{slugified-topic}.qmd`
- Without `--from-plan`: `lecture-{slugified-topic}.qmd`

**Refinement mode:** Edits file in-place (specified by `--refine`).

**Validation mode:** Terminal output only (exit code 0 = 100% coverage, 1 = gaps).

#### Distinction from /teaching:slides

| Aspect      | /teaching:slides      | /teaching:lecture             |
| ----------- | --------------------- | ----------------------------- |
| **Purpose** | Visual presentation   | Instructor reference          |
| **Format**  | Reveal.js/Beamer      | Quarto document               |
| **Length**  | ~20-30 slides         | 20-40 pages                   |
| **Content** | Bullets, minimal text | Comprehensive prose           |
| **Code**    | Display snippets      | Full executable blocks        |
| **Usage**   | Project in class      | Read/reference while teaching |

---

### /teaching:slides

Generate lecture slides for visual presentations.

#### Endpoint (/teachingslides)

```
/teaching:slides <topic> [duration-minutes] [options]
```

#### Parameters (/teachingslides)

| Parameter          | Type    | Required | Default    | Description                                       |
| ------------------ | ------- | -------- | ---------- | ------------------------------------------------- |
| `topic`            | string  | Yes      | -          | Slide topic                                       |
| `duration-minutes` | integer | No       | -          | Duration in minutes (can use --duration instead)  |
| `--duration`       | integer | No       | 50         | Lecture duration in minutes                       |
| `--slides`         | integer | No       | auto       | Number of slides (auto-calculated if not set)     |
| `--format`         | enum    | No       | `markdown` | Format: `markdown`, `reveal.js`, `beamer`, `pptx` |
| `--dry-run`        | boolean | No       | false      | Preview without API calls                         |
| `--json`           | boolean | No       | false      | Output dry-run as JSON                            |
| `--config`         | string  | No       | -          | Explicit config file path                         |
| `--debug`          | boolean | No       | false      | Enable debug logging                              |

#### Request Schema (/teachingslides)

```javascript
{
  topic: string,
  title: string,
  durationMinutes: number,
  level?: string,
  week?: number,
  lectureNumber?: number,
  format: 'markdown' | 'reveal' | 'beamer' | 'quarto',
  subtopics: string[],
  includeCode: boolean,
  language: string
}
```

#### Response Schema (/teachingslides)

```javascript
{
  title: string,
  topic: string,
  course_code: string,
  duration_minutes: number,
  level: string,
  learning_objectives: string[],
  slides: [
    {
      id: string,
      type: 'title' | 'objectives' | 'content' | 'example' | 'definition' | 'theorem' | 'practice' | 'discussion' | 'summary' | 'questions',
      title: string,
      content?: string,
      bullets?: string[],
      speaker_notes?: string
    }
  ],
  next_lecture?: {
    topic: string,
    preview: string
  }
}
```

#### Examples (/teachingslides)

```bash
# Basic slides
/teaching:slides "Multiple Regression"

# 75-minute lecture
/teaching:slides "Hypothesis Testing" 75

# Reveal.js format
/teaching:slides "ANOVA" 50 --format reveal.js

# Preview only 3
/teaching:slides "Regression" --dry-run
```

#### Timing Guidelines

- **50-minute lecture**: ~20 slides
- **75-minute lecture**: ~30 slides
- **90-minute lecture**: ~36 slides
- **120-minute lecture**: ~48 slides

**Mix**: ~70% content, ~15% practice, ~15% other (title, objectives, summary)

---

### /teaching:syllabus

Generate a comprehensive course syllabus.

#### Endpoint (/teachingsyllabus)

```
/teaching:syllabus <course-name> [semester] [options]
```

#### Parameters (/teachingsyllabus)

| Parameter     | Type    | Required | Default    | Description                        |
| ------------- | ------- | -------- | ---------- | ---------------------------------- |
| `course-name` | string  | Yes      | -          | Course name or code                |
| `semester`    | string  | No       | -          | Semester/term                      |
| `--weeks`     | integer | No       | 15         | Number of weeks in semester        |
| `--format`    | enum    | No       | `markdown` | Format: `markdown`, `pdf`, `latex` |
| `--dry-run`   | boolean | No       | false      | Preview without API calls          |
| `--json`      | boolean | No       | false      | Output dry-run as JSON             |
| `--config`    | string  | No       | -          | Explicit config file path          |
| `--debug`     | boolean | No       | false      | Enable debug logging               |

#### Request Schema (/teachingsyllabus)

```javascript
{
  courseTitle: string,
  courseCode: string,
  semester: string,
  credits: number,
  level: string,
  weeks: number,
  format: 'in-person' | 'online' | 'hybrid',
  topics: string[],
  instructor: {
    name: string,
    email: string,
    office: string
  },
  prerequisites: string[],
  includeTemplatePolicy: boolean
}
```

#### Response Schema (/teachingsyllabus)

```javascript
{
  title: string,
  course_code: string,
  semester: string,
  credits: number,
  level: string,
  prerequisites: string[],
  instructor: object,
  meeting_times: object,
  description: string,
  learning_objectives: string[],
  required_materials: {
    textbooks: object[],
    software: object[]
  },
  grading: {
    components: object[],
    scale: object[],
    late_policy: string
  },
  schedule: object[],
  policies: object
}
```

#### Examples (/teachingsyllabus)

```bash
# Basic syllabus
/teaching:syllabus "Introduction to Statistics"

# With semester
/teaching:syllabus "Regression Analysis" "Fall 2026"

# Preview only 4
/teaching:syllabus "STAT-440" --dry-run
```

#### Standard Policies Included

- Academic integrity
- Accessibility/accommodations
- Attendance expectations
- Late work policy
- Communication policy
- Technology in classroom
- Mental health resources
- Diversity statement

---

### /teaching:rubric

Generate grading rubrics for assignments and assessments.

#### Endpoint (/teachingrubric)

```
/teaching:rubric <assignment-type> [points] [options]
```

#### Parameters (/teachingrubric)

| Parameter         | Type    | Required | Default    | Description                              |
| ----------------- | ------- | -------- | ---------- | ---------------------------------------- |
| `assignment-type` | string  | Yes      | -          | Type of assignment                       |
| `points`          | integer | No       | -          | Total points (can use --points instead)  |
| `--points`        | integer | No       | 100        | Total points                             |
| `--levels`        | integer | No       | 4          | Number of performance levels             |
| `--format`        | enum    | No       | `markdown` | Format: `markdown`, `spreadsheet`, `pdf` |
| `--dry-run`       | boolean | No       | false      | Preview without API calls                |
| `--json`          | boolean | No       | false      | Output dry-run as JSON                   |
| `--config`        | string  | No       | -          | Explicit config file path                |
| `--debug`         | boolean | No       | false      | Enable debug logging                     |

#### Request Schema (/teachingrubric)

```javascript
{
  assignmentType: string,
  totalPoints: number,
  performanceLevels: number,
  format: 'markdown' | 'spreadsheet' | 'pdf',
  dryRun: boolean
}
```

#### Response Schema (/teachingrubric)

```markdown
# Grading Rubric: {Assignment Name}

**Total Points:** {X}

## Rubric

| Criterion     | Excellent (A)  | Proficient (B) | Developing (C) | Needs Work (D) | Points |
| ------------- | -------------- | -------------- | -------------- | -------------- | ------ |
| {Criterion 1} | {A descriptor} | {B descriptor} | {C descriptor} | {D descriptor} | X pts  |
| {Criterion 2} | {A descriptor} | {B descriptor} | {C descriptor} | {D descriptor} | X pts  |
```

#### Examples (Rubric)

```bash
# Data analysis project rubric
/teaching:rubric "data analysis project"

# Research paper with 100 points
/teaching:rubric "research paper" 100

# Preview only 5
/teaching:rubric "lab report" --dry-run
```

#### Common Criteria by Assignment Type

### Data Analysis Project

- Code quality and organization
- Statistical methodology
- Interpretation and communication
- Visualizations
- Technical accuracy

### Research Paper

- Introduction and motivation
- Methodology
- Results and analysis
- Discussion and conclusions
- Writing quality

---

### /teaching:feedback

Generate constructive feedback for student work.

#### Endpoint (/teachingfeedback)

```
/teaching:feedback <assignment-type> [score] [options]
```

#### Parameters (/teachingfeedback)

| Parameter         | Type          | Required | Default    | Description                             |
| ----------------- | ------------- | -------- | ---------- | --------------------------------------- |
| `assignment-type` | string        | Yes      | -          | Type of assignment                      |
| `score`           | string/number | No       | -          | Student score (can use --score instead) |
| `--score`         | string/number | No       | -          | Student score (numeric or letter grade) |
| `--areas`         | string        | No       | -          | Comma-separated focus areas             |
| `--format`        | enum          | No       | `markdown` | Format: `markdown`, `pdf`               |
| `--dry-run`       | boolean       | No       | false      | Preview without API calls               |
| `--json`          | boolean       | No       | false      | Output dry-run as JSON                  |
| `--config`        | string        | No       | -          | Explicit config file path               |
| `--debug`         | boolean       | No       | false      | Enable debug logging                    |

#### Request Schema (/teachingfeedback)

```javascript
{
  assignmentType: string,
  score?: number | string,
  focusAreas: string[],
  format: 'markdown' | 'pdf',
  dryRun: boolean
}
```

#### Response Schema (/teachingfeedback)

```markdown
# Feedback: {Assignment Name}

**Student:** {Name placeholder}
**Score:** {X}/{Total} ({X}%)
**Date:** {Date}

## Overall Assessment

{2-3 sentence summary}

**Grade:** {Letter grade}

## Strengths

✓ {Specific strength 1}
✓ {Specific strength 2}
✓ {Specific strength 3}

## Areas for Improvement

1. **{Area 1}**
   - {Specific issue}
   - {Suggestion}
   - {Resource}

## Recommendations

{Study recommendations}
{Practice recommendations}
{Resources}

## Looking Ahead

{Encouragement and next steps}
```

#### Examples (Looking Ahead)

```bash
# Basic feedback
/teaching:feedback "Homework 3"

# With score
/teaching:feedback "Midterm Exam" 72

# Letter grade
/teaching:feedback "Research Paper" B+

# With focus areas
/teaching:feedback "Lab Report" 85 --areas "analysis,interpretation"

# Preview only 6
/teaching:feedback "Project" --dry-run
```

#### Performance Level Templates

- **A (90-100%)**: Strong mastery, suggest advanced extensions
- **B (80-89%)**: Good understanding, specific improvements
- **C (70-79%)**: Basic understanding, key areas to focus
- **D (60-69%)**: Needs attention, office hours recommended
- **F (<60%)**: Significant gaps, immediate action plan

---

## Workflow Commands

### /teaching:demo

Create a complete demo course with configuration, examples, and test materials.

#### Endpoint (/teachingdemo)

```
/teaching:demo [path] [options]
```

#### Parameters (/teachingdemo)

| Parameter  | Type    | Required | Default          | Description                           |
| ---------- | ------- | -------- | ---------------- | ------------------------------------- |
| `path`     | string  | No       | `./demo-course/` | Target directory                      |
| `--verify` | boolean | No       | false            | Run verification tests after creation |
| `--force`  | boolean | No       | false            | Overwrite existing without prompting  |
| `--quiet`  | boolean | No       | false            | Minimal output (for CI)               |
| `--config` | string  | No       | -                | Config file path to use as template   |
| `--debug`  | boolean | No       | false            | Enable debug logging                  |

#### Request Schema (/teachingdemo)

```javascript
{
  targetPath: string,
  verify: boolean,
  force: boolean,
  quiet: boolean,
  configTemplate?: string
}
```

#### Created Structure

```
{path}/
├── .flow/
│   └── teach-config.yml       # Course configuration
├── README.md                   # Testing instructions
├── TEST-CHECKLIST.md           # Manual test checklist
├── sample-student-work.md      # For feedback testing
└── examples/
    ├── exam-midterm.json       # 10-question midterm
    ├── quiz-descriptive.md     # Descriptive stats quiz
    ├── syllabus-stat101.md     # 15-week syllabus
    ├── assignment-regression.md # Regression homework
    ├── rubric-project.md       # Project rubric
    └── slides-probability.md   # Probability slides
```

#### Examples (/teachingdemo)

```bash
# Create in default location
/teaching:demo

# Custom path
/teaching:demo ~/my-test-course

# Create and verify
/teaching:demo --verify

# Force overwrite
/teaching:demo --force

# CI-friendly (force + verify + quiet)
/teaching:demo ~/test --force --verify --quiet
```

#### Verification Tests (with -verify)

```
Verification:
  ✓ /teaching:syllabus - generates valid output
  ✓ /teaching:quiz - generates questions
  ✓ /teaching:exam - creates JSON structure
  ✓ /teaching:rubric - includes criteria
  ✓ /teaching:slides - has sections
  ✓ /teaching:feedback - produces comments
  ✓ /teaching:assignment - contains problems

Result: 7/7 commands verified
```

---

## Configuration Management Commands

### /teaching:validate

Validate YAML configuration files against schemas with multi-level checks.

#### Endpoint (/teachingvalidate)

```
/teaching:validate [file] [options]
```

#### Parameters (/teachingvalidate)

| Parameter   | Type    | Required | Default      | Description                                                    |
| ----------- | ------- | -------- | ------------ | -------------------------------------------------------------- |
| `file`      | string  | No       | -            | File or directory to validate                                  |
| `--all`     | boolean | No       | false        | Validate all YAML files                                        |
| `--level`   | enum    | No       | `cross-file` | Stop after level: `syntax`, `schema`, `semantic`, `cross-file` |
| `--strict`  | boolean | No       | false        | Treat warnings as errors                                       |
| `--quiet`   | boolean | No       | false        | Only show errors                                               |
| `--json`    | boolean | No       | false        | Output as JSON                                                 |
| `--fix`     | boolean | No       | false        | Auto-fix issues (interactive)                                  |
| `--auto`    | boolean | No       | false        | Auto-fix safe issues only (for CI/CD)                          |
| `--dry-run` | boolean | No       | false        | Preview fixes without applying                                 |
| `--debug`   | boolean | No       | false        | Enable debug logging                                           |

#### Request Schema (/teachingvalidate)

```javascript
{
  files: string[],
  validateAll: boolean,
  level: 'syntax' | 'schema' | 'semantic' | 'cross-file',
  strict: boolean,
  quiet: boolean,
  autoFix: boolean,
  autoApply: boolean,
  dryRun: boolean
}
```

#### Validation Levels

| Level          | Checks       | Example Errors                                      |
| -------------- | ------------ | --------------------------------------------------- |
| **syntax**     | YAML parsing | Indentation errors, invalid syntax                  |
| **schema**     | Structure    | Missing required fields, wrong types                |
| **semantic**   | Logic        | Activity time > lecture time, unassessed objectives |
| **cross-file** | References   | Missing dataset files, invalid prerequisites        |

#### Response Schema (/teachingvalidate)

```
{file}:{line}:{col}: error: {message}
  Rule: {rule-name}
  Suggestion: {suggestion}

───────────────────────────────────────────────────────
Validation: {N} error(s), {M} warning(s) in {X} file(s) ({duration}ms)
```

#### Examples (/teachingvalidate)

```bash
# Validate single file
/teaching:validate content/lesson-plans/week03.yml

# Validate all files
/teaching:validate --all

# Schema level only
/teaching:validate --level=schema content/lesson-plans/

# Strict mode
/teaching:validate --strict --all

# Auto-fix (interactive)
/teaching:validate --fix content/lesson-plans/week03.yml

# Auto-fix in CI/CD
/teaching:validate --fix --auto --all

# Preview fixes
/teaching:validate --fix --dry-run content/lesson-plans/week03.yml
```

#### Auto-Fix Types

| Type           | Safe? | Examples                                               |
| -------------- | ----- | ------------------------------------------------------ |
| **syntax**     | Yes   | Normalize indentation, remove trailing whitespace      |
| **schema**     | No    | Add missing required fields, remove invalid properties |
| **type**       | No    | Convert string to array, number to string              |
| **deprecated** | No    | Migrate v1 fields to v2 schema                         |

#### Exit Codes (Preview fixes)

| Code | Meaning                                                      |
| ---- | ------------------------------------------------------------ |
| 0    | Validation passed                                            |
| 1    | Validation failed (errors found, or warnings in strict mode) |

---

### /teaching:sync

Sync YAML configuration files to JSON for validation and execution.

#### Endpoint (/teachingsync)

```
/teaching:sync [options]
```

#### Parameters (/teachingsync)

| Parameter   | Type    | Required | Default | Description                    |
| ----------- | ------- | -------- | ------- | ------------------------------ |
| `--all`     | boolean | No       | false   | Sync all files (ignore cache)  |
| `--file`    | string  | No       | -       | Sync specific file only        |
| `--status`  | boolean | No       | false   | Show sync status for all files |
| `--dry-run` | boolean | No       | false   | Preview without writing        |
| `--force`   | boolean | No       | false   | Force sync even if unchanged   |
| `--quiet`   | boolean | No       | false   | Suppress output except errors  |
| `--debug`   | boolean | No       | false   | Enable debug logging           |

#### Request Schema (/teachingsync)

```javascript
{
  syncAll: boolean,
  specificFile?: string,
  showStatus: boolean,
  forceSync: boolean,
  dryRun: boolean,
  quiet: boolean
}
```

#### Response Schema (/teachingsync)

```
├─ ✓ {file.yml} → {file.json} ({duration}ms)
├─ ○ {file.yml} (unchanged)
└─ Done: {N} synced, {M} unchanged, {X} failed ({total}ms)
```

#### Examples (/teachingsync)

```bash
# Sync changed files only
/teaching:sync

# Sync all files (ignore cache)
/teaching:sync --all

# Sync specific file
/teaching:sync --file content/lesson-plans/week03.yml

# Show sync status
/teaching:sync --status

# Preview without writing
/teaching:sync --dry-run
```

#### Sync Behavior

- Hash-based change detection skips unchanged files
- <100ms sync latency per file
- Creates JSON adjacent to YAML (e.g., `week03.yml` → `week03.json`)
- Automatic via pre-commit hook

#### Directories Monitored

- `content/lesson-plans/**/*.yml`
- `.claude/**/*.yml`

---

### /teaching:diff

Compare YAML source files with generated JSON to detect sync issues.

#### Endpoint (/teachingdiff)

```
/teaching:diff <file> [options]
/teaching:diff --all [options]
```

#### Parameters (/teachingdiff)

| Parameter      | Type    | Required    | Default | Description                             |
| -------------- | ------- | ----------- | ------- | --------------------------------------- |
| `file`         | string  | Conditional | -       | File to compare (required unless --all) |
| `--all`        | boolean | No          | false   | Compare all YAML/JSON pairs             |
| `--summary`    | boolean | No          | false   | Show only summary                       |
| `--verbose`    | boolean | No          | false   | Show timestamps and details             |
| `--json`       | boolean | No          | false   | Output as JSON                          |
| `--force-sync` | boolean | No          | false   | Auto-sync out-of-sync files             |
| `--quiet`      | boolean | No          | false   | Only show out-of-sync files             |
| `--debug`      | boolean | No          | false   | Enable debug logging                    |

#### Request Schema (/teachingdiff)

```javascript
{
  files: string[],
  diffAll: boolean,
  summaryOnly: boolean,
  verbose: boolean,
  forceSync: boolean,
  quiet: boolean
}
```

#### Response Schema (/teachingdiff)

```
Comparing: {yaml-file} ↔ {json-file}

Status: ✗ Out of sync

  ~ {path}:{line}: "old" → "new"
  + {path}:{line}: added in JSON → {value}
  - {path}:{line}: missing in JSON ← {value}

───────────────────────────────────────────────────────
Summary: +{N} added, -{M} removed, ~{X} changed ({duration}ms)
```

#### Change Types

| Symbol | Type         | Description                      |
| ------ | ------------ | -------------------------------- |
| `+`    | added        | Present in JSON but not in YAML  |
| `-`    | removed      | Present in YAML but not in JSON  |
| `~`    | changed      | Different values in YAML vs JSON |
| `!`    | type-changed | Data type differs                |

#### Examples (/teachingdiff)

```bash
# Check single file
/teaching:diff content/lesson-plans/week03.yml

# Check all files
/teaching:diff --all

# Summary only
/teaching:diff --all --summary

# Auto-fix sync issues
/teaching:diff --all --force-sync

# CI integration
/teaching:diff --all --json
```

#### Exit Codes (CI integration)

| Code | Meaning                          |
| ---- | -------------------------------- |
| 0    | All files in sync                |
| 1    | Some files out of sync or errors |

---

### /teaching:migrate

Migrate YAML configuration files from v1 to v2 schema.

#### Endpoint (/teachingmigrate)

```
/teaching:migrate [options]
```

#### Parameters (/teachingmigrate)

| Parameter        | Type    | Required | Default | Description                            |
| ---------------- | ------- | -------- | ------- | -------------------------------------- |
| `--detect`       | boolean | No       | false   | Find v1 files with complexity          |
| `--dry-run`      | boolean | No       | false   | Preview changes without modifying      |
| `--file`         | string  | No       | -       | Migrate specific file only             |
| `--no-git`       | boolean | No       | false   | Skip git commit                        |
| `--no-git-check` | boolean | No       | false   | Skip git safety check (dangerous)      |
| `--patterns`     | string  | No       | -       | Custom glob patterns (comma-separated) |
| `--debug`        | boolean | No       | false   | Enable debug logging                   |

#### Request Schema (/teachingmigrate)

```javascript
{
  detectMode: boolean,
  dryRun: boolean,
  specificFile?: string,
  gitCommit: boolean,
  gitCheck: boolean,
  patterns?: string[]
}
```

#### Response Schema (/teachingmigrate)

```
Step 1: Detecting v1 schema files...
Found {N} v1 schema file(s)

Step 2: Checking git status...
✓ Clean working directory

Step 3: Migrating files...
[1/{N}] {file}... ✅
[2/{N}] {file}... ✅

✓ Migration complete!

Processed: {N} file(s)
Commit: {hash}
```

#### Examples (/teachingmigrate)

```bash
# Find v1 files
/teaching:migrate --detect

# Preview migration
/teaching:migrate --dry-run

# Apply migration
/teaching:migrate

# Migrate single file
/teaching:migrate --file week-01.yml

# Apply without git commit
/teaching:migrate --no-git
```

#### Migration Behavior

- **Atomic semantics**: All-or-nothing (rollback on any failure)
- **Git safety**: Checks for uncommitted changes before migration
- **Auto-commit**: Creates descriptive commit with stats
- **Rollback guarantee**: Restores exact original content on failure

#### Schema Detection

- Files without `schema_version` field
- Files with `schema_version: "1.0"`
- Skips files already at `schema_version: "2.0"`

---

## Quality & Export Commands

### /teaching:validate-r

Validate R code chunks in `.qmd` files for syntax errors.

#### Endpoint (/teachingvalidate-r)

```
/teaching:validate-r <file-or-directory> [options]
```

#### Parameters - validate-r

| Parameter | Type   | Required | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| `path`    | string | Yes      | File or directory to validate         |
| `--fix`   | flag   | No       | Auto-fix common issues                |
| `--json`  | flag   | No       | Output results as JSON                |
| `--debug` | flag   | No       | Show detailed parsing info            |

#### Response Schema - validate-r

```json
{
  "files_checked": 3,
  "errors": 0,
  "warnings": 1,
  "results": [
    {
      "file": "week-03.qmd",
      "status": "pass",
      "chunks": 12,
      "errors": []
    }
  ]
}
```

---

### /teaching:preflight

Run pre-release health checks for Scholar plugin.

#### Endpoint (/teachingpreflight)

```
/teaching:preflight [options]
```

#### Parameters - preflight

| Parameter    | Type | Required | Description                    |
| ------------ | ---- | -------- | ------------------------------ |
| `--json`     | flag | No       | Output structured JSON results |
| `--fix`      | flag | No       | Auto-fix fixable issues        |
| `--debug`    | flag | No       | Show timing per check          |

#### Checks Performed

| Check            | Description                                   |
| ---------------- | --------------------------------------------- |
| version-sync     | package.json, plugin.json, mkdocs.yml match   |
| conflict-markers | No unresolved merge conflicts in source files |
| cache            | Discovery cache is valid                      |
| changelog        | CHANGELOG.md has unreleased section            |
| status           | .STATUS file is current                       |
| test-counts      | CI config matches actual test counts           |

#### Response Schema - preflight

```json
{
  "checks": [
    { "name": "version-sync", "status": "pass", "detail": "..." }
  ],
  "passed": 6,
  "failed": 0,
  "warned": 0
}
```

---

### /teaching:canvas

Convert QMD/MD exam files to Canvas LMS QTI import packages via examark.

#### Endpoint (/teachingcanvas)

```
/teaching:canvas <input-file> [options]
```

#### Parameters - canvas

| Parameter        | Type   | Required | Default   | Description                                              |
| ---------------- | ------ | -------- | --------- | -------------------------------------------------------- |
| `input-file`     | string | Yes      | —         | Path to `.qmd` or `.md` exam file                        |
| `--output PATH`  | string | No       | auto      | Output file path (default: `<input>.qti.zip`)            |
| `--dry-run`      | flag   | No       | false     | Parse and show detected questions without converting     |
| `--intermediate` | flag   | No       | false     | Keep the intermediate examark `.md` file                 |
| `--validate`     | flag   | No       | false     | Run `examark verify` on the generated QTI package        |
| `--emulate`      | flag   | No       | false     | Run `examark emulate-canvas` to simulate Canvas import   |
| `--split-parts`  | bool   | No       | true      | Split multi-part questions into separate items            |
| `--default-type` | string | No       | Essay     | Fallback question type: MC, TF, Short, Essay, etc.       |
| `--config PATH`  | string | No       | auto      | Explicit config file path                                |
| `--debug`        | flag   | No       | false     | Enable debug logging                                     |

#### Pipeline

```
.qmd → parse → detect types → examark MD → examark CLI → .qti.zip
```

#### Supported Question Types

| Tag        | Type                    | Detection Method                            |
| ---------- | ----------------------- | ------------------------------------------- |
| `[MC]`     | Multiple Choice         | Lettered options with single `[x]` marker   |
| `[MA]`     | Multiple Answer         | Lettered options with multiple `[x]` markers |
| `[TF]`     | True/False              | Two options: true/false, yes/no, T/F         |
| `[Short]`  | Short Answer            | Free-text answer under 200 chars             |
| `[Numeric]`| Numeric                 | Numerical answer or "calculate/compute" text |
| `[Essay]`  | Essay                   | Long-form response (no structured answer)    |
| `[Match]`  | Matching                | Pairs with `=>` or `=` separators            |
| `[FMB]`    | Fill-in-Multiple-Blanks | Multiple `[blank]` placeholders in text      |
| `[FIB]`    | Fill-in-Blank           | Single `[blank]` placeholder in text         |
| `[Upload]` | File Upload             | Explicit type override (degrades to Essay)   |

#### Example Requests - canvas

```bash
# Basic conversion
/teaching:canvas midterm.qmd

# Dry run (preview only)
/teaching:canvas midterm.qmd --dry-run

# Full pipeline with validation
/teaching:canvas midterm.qmd --validate --emulate --intermediate

# Custom output path
/teaching:canvas midterm.qmd --output exports/midterm.qti.zip

# Override default type for undetectable questions
/teaching:canvas midterm.qmd --default-type Short
```

#### Response - canvas

```
📄 Parsing: midterm.qmd
   Title: STAT 101 Midterm
   Questions: 15
   Total points: 100
   Types: MC(5), TF(3), Short(4), Essay(2), Numeric(1)

🔄 Converting to examark format...
📦 Running examark CLI...
✅ QTI package created: midterm.qti.zip

📊 Conversion Summary:
   Input: midterm.qmd
   Output: midterm.qti.zip
   Questions: 15
   Points: 100

💡 Import into Canvas: Settings → Import Course Content → QTI .zip
```

#### Requirements - canvas

- `examark` v0.6.6+ installed (`npm install -g examark` or `brew install examark`)
- Node.js >= 20.19.0

---

## Common Schemas

### Configuration File (.flow/teach-config.yml)

```yaml
scholar:
  course_info:
    code: "STAT-101"
    title: "Introduction to Statistics"
    level: undergraduate
    field: statistics
    difficulty: beginner
    semester: "Spring 2026"
    credits: 3
    instructor:
      name: "Dr. Jane Smith"
      email: "jsmith@university.edu"
      office: "Science Building 302"
      office_hours: "MW 2-4pm"

  defaults:
    exam_format: markdown
    lecture_format: markdown
    question_types:
      - multiple-choice
      - short-answer
      - true-false

  style:
    tone: formal
    notation: statistical
    examples: true

  topics:
    - "Descriptive Statistics"
    - "Probability"
    - "Hypothesis Testing"

  grading:
    homework: 20
    quizzes: 15
    midterm: 15
    final: 25
```

---

## Error Handling

All commands follow consistent error handling:

### Common Errors

| Error                       | Description                  | Solution                 |
| --------------------------- | ---------------------------- | ------------------------ |
| `File not found`            | Specified file doesn't exist | Check file path          |
| `ANTHROPIC_API_KEY not set` | API key missing              | Set environment variable |
| `Config file invalid`       | YAML syntax error            | Run `/teaching:validate` |
| `Permission denied`         | No write access              | Check file permissions   |
| `Git uncommitted changes`   | Working directory not clean  | Commit or stash changes  |

### HTTP-like Status Codes

Commands use process exit codes similar to HTTP status codes:

| Exit Code | Meaning       |
| --------- | ------------- |
| 0         | Success       |
| 1         | General error |

---

## Authentication

All content generation commands require:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Optional in config file:

```yaml
ai_generation:
  api_key: "sk-ant-..."  # Falls back to ANTHROPIC_API_KEY env var
```

---

## Rate Limiting

Commands respect Claude API rate limits:

- Automatic retry with exponential backoff
- Max 3 retries per request
- 429 responses trigger delay

---

## Versioning

Current API version: **2.0.1**

Version is tracked in:

- Plugin `package.json`: `"version": "2.0.1"`
- Command metadata: `schema_version: "2.0"`

---

## Related Documentation

- [Test Specifications](https://github.com/Data-Wise/scholar/blob/main/tests/teaching/README.md)

---

**Generated:** 2026-01-28
**Plugin:** scholar v2.8.0
**Format:** OpenAPI-style REST-like Command Interface
