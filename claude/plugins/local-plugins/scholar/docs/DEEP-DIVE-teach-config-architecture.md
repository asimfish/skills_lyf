# Scholar Teaching System: Deep Dive Architecture Guide

**Created:** 2026-01-13
**Purpose:** Comprehensive guide for understanding teach-config.yml, templates, and generation workflow
**Audience:** Developers and advanced users setting up Scholar teaching commands manually

---

## Table of Contents

1. [Overview: The Three-Layer Architecture](#1-overview-the-three-layer-architecture)
2. [YAML Files in Scholar](#2-yaml-files-in-scholar)
3. [Creating teach-config.yml Manually](#3-creating-teach-configyml-manually)
4. [Template System (JSON Schema)](#4-template-system-json-schema)
5. [Generation Workflow](#5-generation-workflow)
6. [Specification System](#6-specification-system)
7. [Complete Configuration Reference](#7-complete-configuration-reference)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Overview: The Three-Layer Architecture

Scholar's teaching system has three distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Configuration (YAML)                              │
│  Purpose: User preferences, course context, defaults        │
│  Location: .flow/teach-config.yml                           │
│  Format: YAML                                               │
│  Created by: User (manually) or /teaching:demo             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Templates (JSON Schema)                           │
│  Purpose: Structure validation, field definitions           │
│  Location: src/teaching/templates/*.json                    │
│  Format: JSON Schema (Draft 7)                              │
│  Created by: Scholar developers (NOT users)                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Generated Content (AI + Validation)               │
│  Purpose: Actual quizzes, exams, lectures, etc.             │
│  Location: User-specified output path                       │
│  Format: Markdown, Quarto, LaTeX, JSON                      │
│  Created by: AI (Claude API) + Formatters                   │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight:**

- **YAML = Configuration** (what course, what style, what defaults)
- **JSON Schema = Structure** (what fields exist, what's required, validation rules)
- **Generated Content = Output** (actual quiz questions, exam problems, etc.)

---

## 2. YAML Files in Scholar

### 2.1 Where YAML Files Exist

Scholar uses **TWO USER-FACING YAML FILES**:

```
.flow/teach-config.yml    ← Course configuration (preferences, defaults, style)
.flow/lesson-plans.yml    ← Lesson plan manifest (weekly topics, status, schedule)
```

**Other YAML files in the codebase:**

| Location                                       | Purpose                                 | Who Creates |
| ---------------------------------------------- | --------------------------------------- | ----------- |
| `.flow/teach-config.yml`                       | Course configuration and preferences    | Users       |
| `.flow/lesson-plans.yml`                       | Semester lesson plan manifest           | Users       |
| `mkdocs.yml`                                   | MkDocs documentation site configuration | Developers  |
| `.github/workflows/*.yml`                      | GitHub Actions CI/CD                    | Developers  |
| `tests/teaching/fixtures/*.yml`                | Test fixtures for unit tests            | Developers  |
| `src/teaching/demo-templates/teach-config.yml` | Template for `/teaching:demo` command   | Developers  |

**You should NEVER edit any YAML files except `.flow/teach-config.yml` and `.flow/lesson-plans.yml`**

### 2.2 Why .flow/teach-config.yml?

The `.flow/` directory is a convention from the flow-cli project:

- **flow-cli** provides workflow automation (`tst`, `tweek`, `tlec`, etc.)
- **scholar** provides content generation (`/teaching:quiz`, etc.)
- Both tools read the same `.flow/teach-config.yml` for consistency

**Location flexibility:**

- Can be in current directory: `./.flow/teach-config.yml`
- Can be in parent directory: `../.flow/teach-config.yml`
- Scholar searches upward until it finds it (like git searching for `.git/`)

**If no config file exists:**

- Scholar uses built-in defaults (see `src/teaching/config/loader.js:16-36`)
- Generation still works, just with generic settings

### 2.3 Why lesson-plans.yml?

The `.flow/lesson-plans.yml` manifest was introduced to solve several problems with the original directory-based approach:

**Replaces per-week directory scanning.** Previously, lesson plans were discovered by scanning directories like `content/lesson-plans/week01.yml`, `content/lesson-plans/week02.yml`, etc. The manifest consolidates all weeks into a single file, making it easier to view and manage an entire semester at a glance.

**Tracks generation status per week.** Each week entry has a `status` field that progresses through a lifecycle: `draft` -> `generated` -> `reviewed` -> `published`. This lets instructors know exactly which weeks have been generated, reviewed, and finalized without checking individual output files.

**Enables SHA-256 hash-based sync between Scholar and flow-cli.** Both Scholar and flow-cli read/write the same manifest. A SHA-256 hash of the file content allows either tool to detect when the other has made changes, avoiding stale reads.

**Backup-on-write prevents data loss.** Before any write operation to `lesson-plans.yml`, Scholar creates a `.bak` copy. If a write fails or produces unexpected results, the previous version is always recoverable.

**Discovery priority ensures backward compatibility:**

```
1. Manifest first: .flow/lesson-plans.yml
2. Directory fallback: content/lesson-plans/weekNN.yml
3. Legacy fallback: other known paths
```

Projects that do not have a manifest continue to work exactly as before. The manifest is optional but recommended for courses where semester-level planning is valuable.

---

## 3. Creating teach-config.yml Manually

### 3.1 Minimal Configuration

The absolute minimum configuration (Scholar will fill in defaults):

```yaml
# .flow/teach-config.yml (minimal)
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
```

This is **100% valid** and Scholar will merge it with defaults.

### 3.2 Recommended Configuration

A realistic configuration for teaching a course:

```yaml
# .flow/teach-config.yml (recommended)
scholar:
  course_info:
    code: "STAT-440"                  # Course code
    title: "Applied Regression Analysis"
    level: "undergraduate"            # or "graduate"
    field: "statistics"               # or "mathematics", "economics", etc.
    difficulty: "intermediate"        # "beginner", "intermediate", "advanced"
    semester: "Spring 2026"
    credits: 3
    instructor:
      name: "Dr. Jane Smith"
      email: "jsmith@university.edu"
      office: "Statistics Building 305"
      office_hours: "MW 2-4pm or by appointment"

  defaults:
    exam_format: "markdown"           # "markdown", "quarto", "latex", "json"
    lecture_format: "quarto"          # Default format for lecture slides
    question_types:                   # Default question types for quizzes/exams
      - "multiple-choice"
      - "true-false"
      - "short-answer"
      - "numerical"
      - "essay"

  style:
    tone: "formal"                    # "formal" or "conversational"
    notation: "statistical"           # LaTeX notation style
    examples: true                    # Include worked examples

  topics:                             # Optional: Course topics list
    - "Simple Linear Regression"
    - "Multiple Regression"
    - "Model Diagnostics"
    - "Variable Selection"
    - "Logistic Regression"
    - "Time Series Basics"

  grading:                            # Optional: Grading breakdown
    homework: 20
    quizzes: 15
    midterm1: 20
    midterm2: 20
    final: 25
```

### 3.3 Graduate-Level Configuration

For graduate courses, adjust difficulty and tone:

```yaml
scholar:
  course_info:
    level: "graduate"                 # Changes depth and rigor
    difficulty: "advanced"            # Harder questions, more theory
    field: "statistics"

  style:
    tone: "formal"                    # Graduate courses = formal
    notation: "statistical"
    examples: true

  defaults:
    exam_format: "latex"              # Graduate students often prefer LaTeX
    question_types:
      - "short-answer"
      - "essay"
      - "proof"                       # More theoretical questions
```

### 3.4 Field-by-Field Explanation

#### `course_info` Section

| Field          | Type   | Required | Default           | Description                                       |
| -------------- | ------ | -------- | ----------------- | ------------------------------------------------- |
| `code`         | string | No       | -                 | Course code (e.g., "STAT-440")                    |
| `title`        | string | No       | -                 | Full course title                                 |
| `level`        | string | **Yes**  | `"undergraduate"` | Must be "undergraduate" or "graduate"             |
| `field`        | string | No       | `"general"`       | Academic field (used for context)                 |
| `difficulty`   | string | No       | `"intermediate"`  | Must be "beginner", "intermediate", or "advanced" |
| `semester`     | string | No       | -                 | Semester/term (e.g., "Spring 2026")               |
| `credits`      | number | No       | -                 | Credit hours                                      |
| `instructor.*` | object | No       | -                 | Instructor information (optional)                 |

**How level affects generation:**

- `"undergraduate"`: Simpler explanations, more scaffolding, basic notation
- `"graduate"`: Rigorous proofs, advanced notation, assume prior knowledge

**How difficulty affects generation:**

- `"beginner"`: Gentle introduction, lots of examples, avoid edge cases
- `"intermediate"`: Standard complexity, some tricky questions
- `"advanced"`: Challenging problems, subtle edge cases, require deep thinking

#### `defaults` Section

| Field            | Type   | Required | Default                    | Description                 |
| ---------------- | ------ | -------- | -------------------------- | --------------------------- |
| `exam_format`    | string | No       | `"markdown"`               | Default format for exams    |
| `lecture_format` | string | No       | `"markdown"`               | Default format for lectures |
| `question_types` | array  | No       | `["multiple-choice", ...]` | Default question types      |

**Valid formats:**

- `"markdown"` or `"md"` → Markdown files
- `"quarto"` or `"qmd"` → Quarto documents (includes YAML header)
- `"latex"` or `"tex"` → LaTeX documents
- `"json"` → JSON output (for programmatic use)

**Valid question types:**

- `"multiple-choice"` → A/B/C/D questions
- `"true-false"` → True/False questions
- `"short-answer"` → Open-ended but brief
- `"essay"` → Longer written responses
- `"numerical"` → Calculate a number
- `"fill-blank"` → Fill in the blank
- `"matching"` → Match items from two lists
- `"proof"` → Mathematical proof

#### `style` Section

| Field      | Type    | Required | Default      | Description                          |
| ---------- | ------- | -------- | ------------ | ------------------------------------ |
| `tone`     | string  | No       | `"formal"`   | Must be "formal" or "conversational" |
| `notation` | string  | No       | `"standard"` | LaTeX notation style                 |
| `examples` | boolean | No       | `true`       | Include worked examples              |

**Tone comparison:**

- `"formal"`: "The null hypothesis states that..." (academic writing)
- `"conversational"`: "Let's think about what we're testing here..." (friendly)

#### `topics` Section (Optional)

Array of strings listing course topics. Used for:

- Auto-suggesting quiz topics
- Contextualizing questions ("this builds on Topic 3")
- Ensuring coverage across topics

```yaml
topics:
  - "Introduction to Statistics"
  - "Descriptive Statistics"
  - "Probability"
```

#### `grading` Section (Optional)

Grading breakdown used in syllabus generation:

```yaml
grading:
  homework: 30        # 30%
  quizzes: 20         # 20%
  midterm: 20         # 20%
  final: 30           # 30%
```

**Must sum to 100 if provided.**

---

## 4. Template System (JSON Schema)

### 4.1 Templates Are NOT Configuration

**Critical distinction:**

- **Configuration (YAML)** = User preferences
- **Templates (JSON Schema)** = Structure validation

**Users NEVER create or edit templates.** Templates are part of Scholar's codebase.

### 4.2 What Templates Define

Each teaching command has a corresponding JSON Schema template:

| Command                | Template File                            | Purpose                          |
| ---------------------- | ---------------------------------------- | -------------------------------- |
| `/teaching:quiz`       | `src/teaching/templates/quiz.json`       | Defines quiz structure           |
| `/teaching:exam`       | `src/teaching/templates/exam.json`       | Defines exam structure           |
| `/teaching:assignment` | `src/teaching/templates/assignment.json` | Defines homework structure       |
| `/teaching:syllabus`   | `src/teaching/templates/syllabus.json`   | Defines syllabus structure       |
| `/teaching:slides`     | `src/teaching/templates/lecture.json`    | Defines lecture slides structure |

**Example: quiz.json template defines:**

```json
{
  "required": ["title", "quiz_type", "questions"],
  "properties": {
    "title": { "type": "string", "minLength": 1 },
    "quiz_type": {
      "type": "string",
      "enum": ["reading", "practice", "checkpoint", "pop", "review"]
    },
    "duration_minutes": { "type": "number", "minimum": 5, "maximum": 45 },
    "questions": {
      "type": "array",
      "minItems": 1,
      "items": {
        "required": ["id", "type", "text", "points"],
        "properties": {
          "id": { "type": "string", "pattern": "^Q[0-9]+$" },
          "type": { "enum": ["multiple-choice", "true-false", "short-answer", ...] },
          "text": { "type": "string" },
          "points": { "type": "number", "minimum": 0 }
        }
      }
    }
  }
}
```

### 4.3 Why JSON Schema?

**Validation benefits:**

1. **Catch errors early**: AI generated invalid JSON? Validation fails before saving
2. **Ensure completeness**: Missing answer key? Validation catches it
3. **Type safety**: Points must be a number, not a string
4. **Format enforcement**: Question IDs must match pattern `Q1`, `Q2`, etc.

**Without templates:**

- AI could generate `"Q1"`, `"Question 1"`, `"q1"` inconsistently
- Missing fields would slip through
- Invalid data types would cause formatter errors

### 4.4 How Templates Are Used

Templates are loaded and used during generation:

```javascript
// Inside quiz.js generator
import { loadTemplate } from '../templates/loader.js';

// Load template
const baseTemplate = loadTemplate('quiz');

// AI generates content
const content = await ai.generate(prompt);

// Validate against template
const validator = new ValidatorEngine();
const validation = validator.validate(content, baseTemplate);

if (!validation.valid) {
  console.error('Generated content failed validation:', validation.errors);
  // Retry or prompt user
}
```

**Key point: Templates enforce structure, config provides context.**

---

## 5. Generation Workflow

### 5.1 Complete Workflow Diagram

```
User Command: /teaching:quiz "Hypothesis Testing"
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 1: Load Configuration                                    │
│ - Search for .flow/teach-config.yml (up to root)             │
│ - Parse YAML with js-yaml                                    │
│ - Merge with defaults (src/teaching/config/loader.js:16-36)  │
│ - Extract course_info, defaults, style                       │
│ - If --from-plan: load lesson plan from manifest first,      │
│   falling back to directory scan if no manifest exists        │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 2: Load Template                                         │
│ - Load quiz.json from src/teaching/templates/                │
│ - Parse JSON Schema                                           │
│ - Extract required fields, validation rules                   │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 3: Merge Options                                         │
│ - Command-line args: --count=10 --format=markdown            │
│ - Config defaults: question_types, exam_format               │
│ - Template defaults: duration_minutes=15                      │
│ - Final options: { topic, count, types, format, config }     │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 4: Build AI Prompt                                       │
│ - Include course context (level, difficulty, field)          │
│ - Include style preferences (tone, notation)                 │
│ - Include question requirements (types, count)               │
│ - Include template structure (JSON Schema fields)            │
│ Example prompt:                                               │
│   "Generate a quiz for an undergraduate statistics course     │
│    on Hypothesis Testing. Include 10 questions:               │
│    5 multiple-choice, 3 short-answer, 2 numerical.           │
│    Use formal tone and statistical notation.                 │
│    Format as JSON matching this schema: {...}"               │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 5: Generate with AI (Claude API)                         │
│ - Send prompt to Claude API                                   │
│ - Set temperature=0.7 (balance creativity & consistency)      │
│ - Parse JSON response                                         │
│ - Retry on parse errors (max 3 attempts with backoff)        │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 6: Post-Process Content                                  │
│ - Apply template defaults for missing optional fields        │
│ - Inject auto-generated fields (generated_at, metadata)      │
│ - Normalize IDs (Q1, Q2, Q3...)                              │
│ - Calculate total_points if not provided                      │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 7: Validate Content                                      │
│ - Run JSON Schema validation (ajv library)                   │
│ - Check required fields present                              │
│ - Check types match (string, number, boolean)                │
│ - Check enums valid (quiz_type = reading|practice|...)       │
│ - Check patterns match (id = Q1, Q2, Q3...)                  │
│ - Collect all validation errors                              │
│ Result: { valid: true/false, errors: [...] }                 │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 8: Format Output                                         │
│ - Select formatter based on --format=markdown                │
│ - Convert JSON to Markdown/Quarto/LaTeX/JSON                 │
│ Markdown formatter:                                           │
│   - Header with metadata                                     │
│   - Questions with proper numbering                          │
│   - LaTeX math wrapped in $...$                              │
│   - Answer key section                                       │
└───────────────────────────────────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 9: Save to File                                          │
│ - Write to output path (e.g., quiz-hypothesis-testing.md)   │
│ - Set file permissions                                        │
│ - Confirm success                                             │
└───────────────────────────────────────────────────────────────┘
```

### 5.2 Workflow Code References

Each step maps to specific code:

| Step             | Code Location                                                    |
| ---------------- | ---------------------------------------------------------------- |
| 1. Load Config   | `src/teaching/config/loader.js:199-240` (`loadTeachConfig`)      |
| 2. Load Template | `src/teaching/templates/loader.js` (`loadTemplate`)              |
| 3. Merge Options | `src/teaching/generators/quiz.js:15-40`                          |
| 4. Build Prompt  | `src/teaching/ai/prompts.js` (prompt builder functions)          |
| 5. Generate AI   | `src/teaching/ai/provider.js` (`AIProvider.generate`)            |
| 6. Post-Process  | `src/teaching/generators/quiz.js` (content enrichment)           |
| 7. Validate      | `src/teaching/validators/engine.js` (`ValidatorEngine.validate`) |
| 8. Format Output | `src/teaching/formatters/*.js` (markdown, quarto, latex, json)   |
| 9. Save File     | `src/teaching/commands/*.js` (command handlers)                  |

### 5.3 Example: Quiz Generation in Detail

**Command:**

```bash
/teaching:quiz "Hypothesis Testing" --count=10 --format=markdown
```

**What happens:**

1. **Config loaded:**

```javascript
const config = loadTeachConfig(process.cwd());
// Returns:
{
  scholar: {
    course_info: { level: "undergraduate", difficulty: "intermediate" },
    defaults: { question_types: ["multiple-choice", "short-answer"] },
    style: { tone: "formal", notation: "statistical" }
  }
}
```

1. **Options merged:**

```javascript
const quizOptions = {
  topic: "Hypothesis Testing",
  count: 10,
  types: config.scholar.defaults.question_types,
  format: "markdown",
  level: config.scholar.course_info.level,
  difficulty: config.scholar.course_info.difficulty,
  tone: config.scholar.style.tone
};
```

1. **Prompt built:**

```javascript
const prompt = `Generate a quiz for an undergraduate statistics course.

Topic: Hypothesis Testing
Number of questions: 10
Question types: multiple-choice, short-answer
Difficulty: intermediate
Tone: formal

Format the output as JSON matching this schema:
{
  "title": "Quiz on Hypothesis Testing",
  "quiz_type": "practice",
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "...",
      "options": ["A", "B", "C", "D"],
      "points": 5
    },
    ...
  ],
  "answer_key": {
    "Q1": "B",
    ...
  }
}`;
```

1. **AI generates:**

```json
{
  "title": "Quiz on Hypothesis Testing",
  "quiz_type": "practice",
  "duration_minutes": 20,
  "total_points": 100,
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "What is the null hypothesis in hypothesis testing?",
      "options": [
        "The hypothesis we want to prove",
        "The hypothesis of no effect or no difference",
        "The alternative hypothesis",
        "The hypothesis with p-value < 0.05"
      ],
      "points": 10,
      "difficulty": "easy",
      "topic": "Null Hypothesis"
    },
    ...
  ],
  "answer_key": {
    "Q1": "B",
    ...
  }
}
```

1. **Validation:**

```javascript
const validator = new ValidatorEngine();
const result = validator.validate(content, quizTemplate);

// result.valid = true (all fields present, types correct)
// result.errors = []
```

1. **Formatting:**

```markdown
# Quiz on Hypothesis Testing

**Type:** Practice Quiz
**Duration:** 20 minutes
**Total Points:** 100

---

## Instructions

Answer all questions to the best of your ability. Show your work for numerical questions.

---

## Questions

### Question 1 (10 points)

What is the null hypothesis in hypothesis testing?

A. The hypothesis we want to prove
B. The hypothesis of no effect or no difference
C. The alternative hypothesis
D. The hypothesis with p-value < 0.05

---

... (remaining questions) ...

---

## Answer Key

| Question | Answer |
| -------- | ------ |
| Q1       | B      |
| Q2       | ...    |
```

1. **Saved to:** `quiz-hypothesis-testing.md`

---

## 6. Specification System

### 6.1 What Are SPEC Files?

SPEC files are **planning documents** written **before** implementing features.

**Location:** `docs/specs/SPEC-*.md` (archived -- see git history)

**Purpose:**

- Document requirements and acceptance criteria
- Plan architecture and implementation steps
- Track progress during development
- Serve as reference during code review

### 6.2 SPEC vs teach-config.yml

| Aspect           | SPEC Files                        | teach-config.yml               |
| ---------------- | --------------------------------- | ------------------------------ |
| **Purpose**      | Feature planning                  | Runtime configuration          |
| **Created by**   | Developers                        | Users                          |
| **When created** | Before coding                     | Before generating content      |
| **Format**       | Markdown                          | YAML                           |
| **Contains**     | User stories, acceptance criteria | Course info, style preferences |
| **Used by**      | Developers                        | Scholar commands               |

**SPEC files do NOT affect generation.** They are documentation only.

### 6.3 How SPECs Are Created

**Workflow:**

1. **Brainstorm:** Generate ideas (`/brainstorm` command)
2. **Spec Review:** Convert brainstorm to formal spec (`/spec-review`)
3. **Implementation:** Code features following spec
4. **Testing:** Verify acceptance criteria met
5. **Archive:** Spec available in git history after completion

**Example SPEC: SPEC-scholar-teaching-2026-01-11.md**

Contains:

- **Overview:** Expand scholar with teaching commands
- **User Stories:** 5 user stories with acceptance criteria
- **Technical Architecture:** Phase 0 foundation, command structure
- **Implementation Plan:** 7 increments over 5 weeks
- **Testing Strategy:** Unit tests, integration tests, E2E tests

**Current SPEC files:**

```bash
# specs archived -- see git history for original files
# SPEC-scholar-teaching-2026-01-11.md        # Teaching features (main spec)
# SPEC-teaching-demo-2026-01-13.md           # /teaching:demo command
# SPEC-teaching-dry-run-2026-01-13.md        # Dry-run testing spec
# WEEK-2-FORMATTERS.md                       # Formatter implementation plan
```

### 6.4 teach-config.yml in SPECs

SPECs often include **example configurations**:

```markdown
## Example Configuration

Users should create `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
```

This helps users understand what configuration is needed.

---

## 7. Complete Configuration Reference

### 7.1 Full Schema

Here is the **complete, authoritative schema** for `.flow/teach-config.yml`:

```yaml
scholar:                                  # Root key (required)

  course_info:                            # Course information (required)
    code: string                          # Course code (optional)
    title: string                         # Course title (optional)
    level: "undergraduate" | "graduate"   # REQUIRED - Course level
    field: string                         # Academic field (optional, default: "general")
    difficulty: "beginner" | "intermediate" | "advanced"  # Optional, default: "intermediate"
    semester: string                      # Semester/term (optional)
    credits: number                       # Credit hours (optional)
    instructor:                           # Instructor info (optional)
      name: string
      email: string
      office: string
      office_hours: string

  defaults:                               # Default settings (optional)
    exam_format: "markdown" | "md" | "quarto" | "qmd" | "latex" | "tex" | "json"
    lecture_format: "markdown" | "md" | "quarto" | "qmd" | "latex" | "tex" | "json"
    question_types: string[]              # Array of question types
      # Valid types: "multiple-choice", "true-false", "short-answer", "essay",
      #              "numerical", "fill-blank", "matching", "proof"

  style:                                  # Style preferences (optional)
    tone: "formal" | "conversational"     # Default: "formal"
    notation: string                      # LaTeX notation style (default: "standard")
    examples: boolean                     # Include worked examples (default: true)

  topics: string[]                        # Course topics list (optional)
    # Example: ["Linear Regression", "ANOVA", "Time Series"]

  grading: object                         # Grading breakdown (optional)
    # Keys: component names (homework, quiz, midterm, final)
    # Values: percentage (must sum to 100)
    # Example:
    #   homework: 30
    #   quizzes: 20
    #   midterm: 20
    #   final: 30
```

### 7.2 Validation Rules

**Enforced by `validateConfig()` in `src/teaching/config/loader.js:122-186`:**

| Rule                      | Check                                             | Error Message                                |
| ------------------------- | ------------------------------------------------- | -------------------------------------------- |
| `scholar` section exists  | Required                                          | "Missing required 'scholar' section"         |
| `level` is valid          | Must be "undergraduate" or "graduate"             | "Invalid course_info.level: '{value}'"       |
| `difficulty` is valid     | Must be "beginner", "intermediate", or "advanced" | "Invalid course_info.difficulty: '{value}'"  |
| `exam_format` is valid    | Must be in validFormats list                      | "Invalid defaults.exam_format: '{value}'"    |
| `lecture_format` is valid | Must be in validFormats list                      | "Invalid defaults.lecture_format: '{value}'" |
| `tone` is valid           | Must be "formal" or "conversational"              | "Invalid style.tone: '{value}'"              |

**Validation modes:**

```javascript
// Non-strict (default): warnings, uses defaults
loadTeachConfig(cwd, { validate: true, strict: false });

// Strict: throws errors
loadTeachConfig(cwd, { validate: true, strict: true });

// No validation
loadTeachConfig(cwd, { validate: false });
```

### 7.3 Default Configuration

**If no `.flow/teach-config.yml` exists, Scholar uses:**

```javascript
// From src/teaching/config/loader.js:16-36
{
  scholar: {
    course_info: {
      level: 'undergraduate',
      field: 'general',
      difficulty: 'intermediate',
    },
    defaults: {
      exam_format: 'markdown',
      lecture_format: 'markdown',
      question_types: ['multiple-choice', 'short-answer', 'essay'],
    },
    style: {
      tone: 'formal',
      notation: 'standard',
      examples: true,
    },
  },
}
```

### 7.4 Configuration Discovery Algorithm

**How Scholar finds your config:**

```
1. Start in current working directory (cwd)
2. Check for .flow/teach-config.yml
3. If found → Load and parse
4. If not found → Move to parent directory
5. Repeat until:
   - Config file found, OR
   - Reached filesystem root (/)
6. If no config found → Use default config
```

**Example search path:**

```
/Users/dt/projects/teaching/stat-440/assignments/week3/
                                                  ↑ Start here
/Users/dt/projects/teaching/stat-440/assignments/
                                                  ↑ Check here
/Users/dt/projects/teaching/stat-440/.flow/teach-config.yml
                                                  ↑ FOUND!
```

**Implementation:** `src/teaching/config/loader.js:43-66` (`findConfigFile`)

---

## 8. Troubleshooting

### 8.1 Common Configuration Errors

#### Error: "Missing required 'scholar' section"

**Problem:** Config file missing top-level `scholar:` key

**Fix:**

```yaml
# ❌ WRONG
course_info:
  level: "undergraduate"

# ✅ CORRECT
scholar:
  course_info:
    level: "undergraduate"
```

#### Error: "Invalid course_info.level: 'college'"

**Problem:** Using invalid level value

**Fix:**

```yaml
# ❌ WRONG
scholar:
  course_info:
    level: "college"

# ✅ CORRECT
scholar:
  course_info:
    level: "undergraduate"  # or "graduate"
```

#### Error: "YAML parsing error: bad indentation"

**Problem:** YAML indentation must be consistent (2 spaces)

**Fix:**

```yaml
# ❌ WRONG (mixed tabs and spaces)
scholar:
    course_info:
      level: "undergraduate"

# ✅ CORRECT (consistent 2-space indentation)
scholar:
  course_info:
    level: "undergraduate"
```

### 8.2 Validation Issues

#### How to see validation errors

```javascript
// In code
const config = loadTeachConfig(cwd, { validate: true, strict: false });
// Prints warnings to console but continues

// To throw errors on validation failure
const config = loadTeachConfig(cwd, { validate: true, strict: true });
// Throws error with detailed validation message
```

#### Common validation warnings

```
Warning: Configuration validation failed:
Invalid course_info.difficulty: "hard". Must be "beginner", "intermediate", or "advanced"
Invalid defaults.exam_format: "pdf". Must be one of: markdown, md, quarto, qmd, latex, tex, json
Proceeding with merged configuration.
```

**Solution:** Fix the invalid values in your config file

### 8.3 Template vs Configuration Confusion

**Problem:** "Do I need to create quiz.json for my course?"

**Answer:** **NO!** Templates are part of Scholar's codebase.

**What you create:** `.flow/teach-config.yml` (configuration)
**What Scholar provides:** `src/teaching/templates/quiz.json` (template)

**If you see errors like:**

```
Error: Template file not found: quiz.json
```

**This means:**

- Scholar is not installed correctly
- Template files are missing from `src/teaching/templates/`
- **NOT** that you need to create them

**Fix:** Reinstall Scholar or check installation

### 8.4 Generation Failures

#### "AI generation failed after 3 retries"

**Possible causes:**

1. Claude API rate limit hit
2. Network connectivity issues
3. Invalid API key
4. Prompt too complex

**Debug:**

```bash
# Enable debug mode
/teaching:quiz "Topic" --debug

# Check API key
echo $ANTHROPIC_API_KEY

# Simplify request
/teaching:quiz "Simple Topic" --count=5
```

#### "Validation failed: Missing required field 'answer_key'"

**Possible causes:**

1. AI didn't generate complete JSON
2. Template expectations don't match AI output

**Debug:**

```bash
# Generate with JSON output to inspect
/teaching:quiz "Topic" --format=json

# Review generated JSON manually
# Check if answer_key section exists
```

### 8.5 Format-Specific Issues

#### LaTeX math not rendering

**Problem:** Markdown viewer doesn't support LaTeX

**Fix:**

- Use Quarto format: `--format=quarto`
- Or use LaTeX directly: `--format=latex`

#### Canvas QTI import fails

**Problem:** Generated quiz doesn't match Canvas format

**Fix:**

```bash
# Use exam format with QTI export
/teaching:exam "Topic" --format=qti

# Requires examark tool installed
npm install -g examark
```

---

## Quick Reference Card

### Essential Commands

```bash
# Generate quiz with default settings
/teaching:quiz "Hypothesis Testing"

# Generate with custom count and format
/teaching:quiz "Regression" --count=15 --format=quarto

# Generate exam
/teaching:exam "Midterm 1" --sections=3 --duration=90

# Create demo course (includes teach-config.yml)
/teaching:demo
```

### Configuration Checklist

- [ ] Create `.flow/` directory in project root
- [ ] Create `teach-config.yml` inside `.flow/`
- [ ] Add `scholar:` as root key
- [ ] Set `course_info.level` ("undergraduate" or "graduate")
- [ ] (Optional) Set `defaults.exam_format` and `defaults.lecture_format`
- [ ] (Optional) Set `style.tone` ("formal" or "conversational")
- [ ] (Optional) Create `lesson-plans.yml` inside `.flow/` for semester planning
- [ ] Validate YAML syntax (consistent 2-space indentation)
- [ ] Test with `/teaching:quiz "Test Topic"`

### Configuration Locations

```
.flow/teach-config.yml          ← Create this (course config)
.flow/lesson-plans.yml          ← Create this (lesson plan manifest, optional)
src/teaching/templates/*.json   ← Don't touch (Scholar templates)
```

### Getting Help

- **Config examples:** `tests/demo-course/.flow/teach-config.yml`
- **Template schemas:** `src/teaching/templates/*.json`
- **Workflow docs:** `docs/TEACHING-WORKFLOWS.md`
- **Source code:** `src/teaching/config/loader.js`

---

**End of Deep Dive Guide**

*This document comprehensively explains teach-config.yml creation, YAML usage, template system, generation workflow, and specification system for the Scholar teaching plugin.*
