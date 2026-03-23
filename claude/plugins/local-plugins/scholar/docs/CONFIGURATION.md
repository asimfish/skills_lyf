# Scholar Configuration Reference

Complete reference for configuring the scholar teaching module via `.flow/teach-config.yml`.

## Table of Contents

1. [Overview](#overview)
2. [Configuration Discovery](#configuration-discovery)
3. [Lesson Plans Manifest](#lesson-plans-manifest)
4. [Configuration Schema](#configuration-schema)
5. [Course Information](#course-information)
6. [Default Settings](#default-settings)
7. [Style Configuration](#style-configuration)
8. [AI Generation Settings](#ai-generation-settings)
9. [Examples](#examples)
10. [Validation Rules](#validation-rules)
11. [Fallback Defaults](#fallback-defaults)

---

!!! tip "See also"
    For a complete map of every file in `.flow/`, which commands create/read/write them, and visual flowcharts of all pipelines, see the [.flow/ Directory Reference](FLOW-DIRECTORY-REFERENCE.md).

## Overview

The scholar teaching module uses `.flow/teach-config.yml` to configure:

- Course metadata (code, title, instructor)
- Default output formats
- Question type preferences
- Writing style and tone
- AI generation parameters

### Key Features

- **Hierarchical discovery** - Searches parent directories
- **Deep merging** - User config overrides defaults
- **Validation** - Checks for invalid values
- **Fallback defaults** - Works without config file
- **Environment integration** - Reads from env vars

---

## Configuration Discovery

### Search Algorithm

The config loader searches parent directories until it finds `.flow/teach-config.yml`:

```
Current directory: /Users/prof/courses/stat440/exams/
                                                     ↑ Search up
Parent:            /Users/prof/courses/stat440/     ↑
                                                     ↑
Found:             /Users/prof/courses/stat440/.flow/teach-config.yml
```

### Project Structure

Recommended structure:

```
stat440/                        # Course root
├── .flow/
│   └── teach-config.yml        # Configuration file
├── exams/
│   ├── midterm/
│   └── final/
├── quizzes/
├── homework/
└── slides/
```

All subdirectories inherit the root configuration.

---

## Lesson Plans Manifest

### Purpose

The `.flow/lesson-plans.yml` file provides a semester-level view of weekly lesson plans. It consolidates topics, schedule, milestones, and generation status into a single manifest, replacing the need to manage individual per-week YAML files scattered across directories.

### Relationship to teach-config.yml

Scholar uses two complementary configuration files inside `.flow/`:

| File | Role | Contains |
| ---- | ---- | -------- |
| `teach-config.yml` | Course preferences and defaults | Course info, output formats, style, AI settings, grading |
| `lesson-plans.yml` | Weekly lesson plan content and status | Semester metadata, weekly topics, objectives, activities, generation status |

Think of `teach-config.yml` as the **how** (how content is generated) and `lesson-plans.yml` as the **what** (what content to generate each week).

### Updated Project Structure

```
stat440/
├── .flow/
│   ├── teach-config.yml        # Course configuration
│   └── lesson-plans.yml        # Lesson plan manifest (NEW)
├── exams/
│   ├── midterm/
│   └── final/
├── quizzes/
├── homework/
└── slides/
```

### Discovery Flow

The lesson plan loader uses a manifest-first strategy with directory fallback:

```
1. Check for .flow/lesson-plans.yml (manifest)
2. If found → Validate against schema, extract requested week
3. If NOT found → Fall back to content/lesson-plans/weekNN.yml directory scan
4. If directory scan fails → Fall back to legacy paths
5. Return LessonPlan object with _source field indicating origin
```

This means existing projects that use per-week files in `content/lesson-plans/` continue to work without changes. Creating a manifest is optional but recommended for new courses.

### Schema Overview

The manifest has three top-level sections:

| Section | Required | Description |
| ------- | -------- | ----------- |
| `schema_version` | Yes | Schema version string (currently `"1.0"`) |
| `semester` | Yes | Semester metadata: total weeks, schedule pattern, milestones |
| `weeks[]` | Yes | Array of weekly lesson plan entries |

Each `weeks[]` entry supports:

| Field | Required | Description |
| ----- | -------- | ----------- |
| `week` | Yes | Week number (integer) |
| `title` | Yes | Week title |
| `status` | No | Generation status (default: `"draft"`) |
| `learning_objectives` | No | Array of objectives with Bloom's taxonomy level |
| `topics` | No | Array of topics with subtopics |
| `materials` | No | Readings, datasets, and other resources |
| `activities` | No | In-class activities with duration |
| `lecture_structure` | No | Segment breakdown (review, theory, practice, wrap-up) |

### Status Tracking

Each week has a `status` field that tracks the content lifecycle:

```
draft → generated → reviewed → published
```

| Status | Meaning |
| ------ | ------- |
| `draft` | Plan exists but no content generated yet |
| `generated` | Scholar has generated content for this week |
| `reviewed` | Instructor has reviewed the generated content |
| `published` | Content is finalized and ready for students |

Status updates use **backup-on-write** safety: before any write to `lesson-plans.yml`, a `.bak` copy is created to prevent accidental data loss.

### Manifest Example

```yaml
# .flow/lesson-plans.yml
schema_version: "1.0"

semester:
  total_weeks: 15
  schedule: "TR"
  milestones:
    - week: 8
      type: midterm
      label: "Midterm Exam"
    - week: 16
      type: final
      label: "Final Exam"

weeks:
  - week: 1
    title: "Introduction to Regression"
    status: published
    learning_objectives:
      - id: LO-1.1
        level: understand
        description: "Understand the concept of simple linear regression"
    topics:
      - id: T-1.1
        name: "Simple Linear Regression"
        subtopics:
          - "Least squares estimation"
          - "Residuals and fitted values"
    materials:
      readings:
        - "Textbook Ch. 1"
    activities:
      - id: A-1.1
        type: in-class-practice
        duration_minutes: 25
        description: "Fit a simple regression model"
    lecture_structure:
      - segment: review
        duration_minutes: 5
      - segment: theory
        duration_minutes: 30
      - segment: practice
        duration_minutes: 25
      - segment: wrap-up
        duration_minutes: 15

  - week: 2
    title: "Multiple Regression"
    status: draft
    learning_objectives:
      - id: LO-2.1
        level: apply
        description: "Apply multiple regression to real datasets"
    topics:
      - id: T-2.1
        name: "Multiple Regression"
        subtopics:
          - "Adding predictors"
          - "Interpreting coefficients"
    materials:
      readings:
        - "Textbook Ch. 2"
```

---

### Manual Override

Specify a custom config location:

```bash
export SCHOLAR_CONFIG="/path/to/custom-config.yml"
/teaching:exam midterm
```

---

## Configuration Schema

### Complete Example

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
    instructor:
      name: "Dr. Jane Smith"
      title: "Associate Professor"
      email: "jane.smith@university.edu"
      phone: "(555) 123-4567"
      office: "Science Hall 301"
      office_hours: "MW 2:00-4:00 PM"
      website: "https://faculty.university.edu/jsmith"

  defaults:
    exam_format: "markdown"
    lecture_format: "quarto"
    assignment_format: "markdown"
    quiz_format: "canvas"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"
    exam_duration: 60
    quiz_duration: 15

  style:
    tone: "formal"
    notation: "statistical"
    examples: true
    difficulty_progression: "gradual"
    real_world_context: true

  ai_generation:
    model: "claude-3-5-sonnet-20241022"
    temperature: 0.7
    max_tokens: 4096
    timeout: 30000
    max_retries: 3
    api_key: "sk-..."  # Optional, uses ANTHROPIC_API_KEY env var
```

---

## Course Information

### `course_info` Section

Defines course metadata used in generated materials.

#### `code` (string)

Course number or code.

**Format:** Alphanumeric with optional hyphen/space
**Examples:**

- `"STAT-440"`
- `"MATH 101"`
- `"PSY101"`

### Used in (Course Information)

- Exam headers
- Slide title pages
- Assignment headers
- Syllabus

#### `title` (string)

Full course title.

### Examples (Course Information)

- `"Regression Analysis"`
- `"Introduction to Statistics"`
- `"Applied Machine Learning"`

### Used in

- All generated materials
- Document metadata

#### `level` (string)

Course level for content difficulty.

### Valid values (Course Information)

- `"undergraduate"` (default)
- `"graduate"`
- `"doctoral"`

### Effects (Course Information)

- Question complexity
- Expected prior knowledge
- Writing style formality
- Example sophistication

#### `field` (string)

Academic field for specialized notation and terminology.

### Examples

- `"statistics"`
- `"mathematics"`
- `"computer science"`
- `"economics"`
- `"psychology"`
- `"biology"`

### Effects

- LaTeX notation style
- Terminology choices
- Example contexts
- Problem types

#### `difficulty` (string)

Overall course difficulty level.

### Valid values

- `"beginner"` - Introductory, foundational
- `"intermediate"` (default) - Standard undergraduate
- `"advanced"` - Upper-level or graduate

### Effects - Course Information

- Question difficulty distribution
- Problem complexity
- Scaffolding amount
- Hint frequency

### `instructor` Section

Instructor information for syllabi and materials.

#### Required Fields

| Field   | Type   | Description     |
| ------- | ------ | --------------- |
| `name`  | string | Instructor name |
| `email` | string | Contact email   |

#### Optional Fields

| Field          | Type   | Description                        |
| -------------- | ------ | ---------------------------------- |
| `title`        | string | Academic title (e.g., "Professor") |
| `phone`        | string | Contact phone                      |
| `office`       | string | Office location                    |
| `office_hours` | string | Office hours schedule              |
| `website`      | string | Personal or course website         |

### Example (Course Information)

```yaml
instructor:
  name: "Dr. Jane Smith"
  title: "Associate Professor"
  email: "jane.smith@university.edu"
  phone: "(555) 123-4567"
  office: "Science Hall 301"
  office_hours: "MW 2:00-4:00 PM, or by appointment"
  website: "https://faculty.university.edu/jsmith"
```

---

## Default Settings

### `defaults` Section

Default values for generated content.

#### `exam_format` (string)

Default output format for exams.

### Valid values (Default Settings)

- `"markdown"` (default) - examark-compatible
- `"md"` - Same as markdown
- `"quarto"` - Quarto document
- `"qmd"` - Same as quarto
- `"latex"` - LaTeX document
- `"tex"` - Same as latex
- `"canvas"` - Canvas QTI package
- `"json"` - Raw JSON

#### `lecture_format` (string)

Default output format for lecture slides.

**Valid values:** Same as `exam_format`

**Recommendation:** Use `"quarto"` for slides (supports reveal.js)

#### `assignment_format` (string)

Default output format for assignments.

**Valid values:** Same as `exam_format`

#### `quiz_format` (string)

Default output format for quizzes.

**Valid values:** Same as `exam_format`

**Recommendation:** Use `"canvas"` for online quizzes

#### `question_types` (array)

Preferred question types for exams and quizzes.

### Valid values - Default Settings

- `"multiple-choice"` - MC with 4 options
- `"short-answer"` - Brief written response
- `"essay"` - Extended response
- `"true-false"` - Boolean questions
- `"numerical"` - Numerical answers
- `"fill-blank"` - Fill in the blank
- `"matching"` - Matching pairs

### Default

```yaml
question_types:
  - "multiple-choice"
  - "short-answer"
  - "essay"
```

### Distribution

- Exams: 60% MC, 30% short-answer, 10% essay
- Quizzes: 60% MC, 20% true-false, 10% short-answer, 10% numerical

#### `exam_duration` (number)

Default exam duration in minutes.

**Default:** `60`
**Range:** 15-300

### Typical values

- Quiz: 15-20 minutes
- Midterm: 60-90 minutes
- Final: 120-180 minutes

#### `quiz_duration` (number)

Default quiz duration in minutes.

**Default:** `15`
**Range:** 5-45

---

## Style Configuration

### `style` Section

Controls writing style and content preferences.

#### `tone` (string)

Writing tone for generated content.

### Valid values (Style Configuration)

- `"formal"` (default) - Academic, professional
- `"conversational"` - Friendly, approachable

### Effects (Style Configuration)

| Aspect       | Formal                          | Conversational           |
| ------------ | ------------------------------- | ------------------------ |
| Instructions | "You must demonstrate..."       | "Show me how you..."     |
| Feedback     | "This response demonstrates..." | "Great job! You..."      |
| Questions    | "Determine the value of..."     | "What's the value of..." |
| Examples     | Theoretical proofs              | Practical applications   |

#### `notation` (string)

LaTeX notation style for mathematical content.

### Valid values - Style Configuration

- `"statistical"` (default) - Statistics notation
  - `$\bar{x}$` for mean
  - `$\hat{\beta}$` for estimators
  - `$H_0$` for hypotheses
- `"mathematical"` - Pure math notation
  - `$\mu$` for mean
  - `$\sum_{i=1}^n$` for summations
  - `$\forall$`, `$\exists$` for logic
- `"standard"` - Generic notation
  - Mixed styles
  - Common conventions

#### `examples` (boolean)

Include worked examples in generated content.

**Default:** `true`

### Effects - Style Configuration

- Slides: Add example slides
- Assignments: Include sample solutions
- Exams: Add hints referencing examples
- Quizzes: Include explanations

#### `difficulty_progression` (string)

How difficulty increases throughout materials.

### Valid values - Style Configuration 2

- `"gradual"` (default) - Smooth progression
- `"steep"` - Rapid escalation
- `"flat"` - Consistent difficulty

### Effects on assignments

- `gradual`: Easy → Medium → Hard
- `steep`: Medium → Hard → Very Hard
- `flat`: All medium difficulty

#### `real_world_context` (boolean)

Include real-world applications and contexts.

**Default:** `true`

### Effects - Style Configuration 2

- Questions set in applied contexts
- Examples use realistic data
- Problems reference practical scenarios
- Less focus on abstract theory

### Example (Style Configuration)

- Without context: "Let $X_1, ..., X_n$ be i.i.d. random variables..."
- With context: "A study measured cholesterol levels in 100 patients..."

---

## AI Generation Settings

### `ai_generation` Section

Controls AI model behavior and API settings.

#### `model` (string)

Claude model to use for content generation.

**Default:** `"claude-3-5-sonnet-20241022"`

### Available models

- `"claude-3-5-sonnet-20241022"` - Recommended (best quality/speed balance)
- `"claude-3-opus-20240229"` - Highest quality (slower, more expensive)
- `"claude-3-sonnet-20240229"` - Good quality (faster, cheaper)
- `"claude-3-haiku-20240307"` - Fast (lower quality, cheapest)

#### `temperature` (number)

Sampling temperature for AI generation.

**Default:** `0.7`
**Range:** 0.0-1.0

### Guidelines (AI Generation Settings)

- `0.0-0.3` - Deterministic, focused (good for exams with single answers)
- `0.4-0.7` - Balanced creativity and consistency (default)
- `0.8-1.0` - Creative, diverse (good for brainstorming, examples)

#### `max_tokens` (number)

Maximum tokens to generate per request.

**Default:** `4096`
**Range:** 1-8192

### Guidelines

- Short quiz: 1024-2048 tokens
- Standard exam: 2048-4096 tokens
- Long assignment: 4096-8192 tokens

**Note:** Longer requests cost more and take longer.

#### `timeout` (number)

Request timeout in milliseconds.

**Default:** `30000` (30 seconds)
**Range:** 5000-60000

### Guidelines - AI Generation Settings

- Short requests: 10000 (10 seconds)
- Standard requests: 30000 (30 seconds)
- Long requests: 60000 (60 seconds)

#### `max_retries` (number)

Maximum retry attempts for failed requests.

**Default:** `3`
**Range:** 0-5

### Effects (AI Generation Settings)

- 0: No retries (fail immediately)
- 1-3: Reasonable retries with backoff
- 4-5: Aggressive retries (may delay failures)

#### `api_key` (string)

Anthropic API key for Claude access.

**Default:** Reads from `ANTHROPIC_API_KEY` environment variable

**Recommendation:** Use environment variable instead of config file for security.

### Setup

```bash
# Set environment variable
export ANTHROPIC_API_KEY="sk-..."

# Or add to .bashrc / .zshrc
echo 'export ANTHROPIC_API_KEY="sk-..."' >> ~/.bashrc
```

---

## Examples (Or add to)

### Minimal Configuration

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    instructor:
      name: "Dr. Jane Smith"
      email: "jane@university.edu"
```

Uses defaults for all other settings.

### Statistics Course (Undergraduate)

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
    instructor:
      name: "Dr. Jane Smith"
      email: "jane@university.edu"

  defaults:
    exam_format: "quarto"
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "numerical"

  style:
    tone: "formal"
    notation: "statistical"
    examples: true
    real_world_context: true

  ai_generation:
    temperature: 0.6
    max_tokens: 4096
```

### Graduate Mathematics Course

```yaml
scholar:
  course_info:
    code: "MATH-600"
    title: "Advanced Real Analysis"
    level: "graduate"
    field: "mathematics"
    difficulty: "advanced"
    instructor:
      name: "Dr. Robert Chen"
      email: "rchen@university.edu"

  defaults:
    exam_format: "latex"
    lecture_format: "latex"
    question_types:
      - "essay"
      - "short-answer"

  style:
    tone: "formal"
    notation: "mathematical"
    examples: true
    difficulty_progression: "steep"
    real_world_context: false

  ai_generation:
    model: "claude-3-opus-20240229"
    temperature: 0.5
    max_tokens: 8192
```

### Online Course (Conversational Style)

```yaml
scholar:
  course_info:
    code: "DATA-101"
    title: "Introduction to Data Science"
    level: "undergraduate"
    field: "computer science"
    difficulty: "beginner"
    instructor:
      name: "Sarah Johnson"
      email: "sjohnson@online-u.edu"

  defaults:
    exam_format: "canvas"
    quiz_format: "canvas"
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "true-false"
      - "short-answer"

  style:
    tone: "conversational"
    notation: "standard"
    examples: true
    difficulty_progression: "gradual"
    real_world_context: true

  ai_generation:
    temperature: 0.7
    max_tokens: 4096
```

---

## Validation Rules

The config loader validates all settings and provides helpful error messages.

### Course Info Validation

| Field              | Validation                                         |
| ------------------ | -------------------------------------------------- |
| `level`            | Must be "undergraduate", "graduate", or "doctoral" |
| `difficulty`       | Must be "beginner", "intermediate", or "advanced"  |
| `instructor.email` | Must be valid email format                         |

### Defaults Validation

| Field           | Validation                                                 |
| --------------- | ---------------------------------------------------------- |
| `*_format`      | Must be valid format: "md", "qmd", "tex", "canvas", "json" |
| `exam_duration` | Must be 15-300 minutes                                     |
| `quiz_duration` | Must be 5-45 minutes                                       |

### Style Validation

| Field      | Validation                                           |
| ---------- | ---------------------------------------------------- |
| `tone`     | Must be "formal" or "conversational"                 |
| `notation` | Must be "statistical", "mathematical", or "standard" |
| `examples` | Must be boolean                                      |

### AI Generation Validation

| Field         | Validation         |
| ------------- | ------------------ |
| `temperature` | Must be 0.0-1.0    |
| `max_tokens`  | Must be 1-8192     |
| `timeout`     | Must be 5000-60000 |
| `max_retries` | Must be 0-5        |

### Error Handling

### Invalid value

```
Configuration validation failed:
- Invalid course_info.level: "undergrad". Must be "undergraduate" or "graduate"
```

**Solution:** Fix the invalid value in config file.

### Strict mode

```bash
# Throw error on validation failure
/teaching:exam midterm --strict
```

---

## Config Management Command

**New in v2.9.0.** The `/teaching:config` command provides a unified interface for managing Scholar configuration, prompts, and generation provenance.

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `scaffold <type>` | Copy a Scholar default prompt to `.flow/templates/prompts/` for customization |
| `show [--command CMD] [--week N] [--prompt TYPE]` | Display the resolved 4-layer config hierarchy |
| `validate [--strict] [--json]` | Pre-flight validation of all `.flow/` configuration files |
| `diff [TYPE]` | Compare project prompts against Scholar defaults |
| `trace <file>` | Show generation provenance for a previously generated file |

### Validation

The `validate` subcommand provides **comprehensive pre-flight validation** that goes beyond `/teaching:validate`. While `/teaching:validate` checks `teach-config.yml` and `lesson-plans.yml` schema compliance, `/teaching:config validate` additionally checks:

- Prompt template frontmatter and variable references
- Lesson plan completeness and cross-references
- Teaching style file consistency
- Version compatibility between project prompts and current Scholar version

### Upgrade Detection

Scholar stores the last-seen version in `.flow/.scholar-version`. When Scholar is updated, running any config command detects the version change and notifies about potential prompt differences. Use `/teaching:config diff` to review what changed.

For a step-by-step walkthrough, see the [Config Management Tutorial](tutorials/teaching/config-management.md).

---

## Fallback Defaults

If no configuration file is found, these defaults are used:

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "general"
    difficulty: "intermediate"

  defaults:
    exam_format: "markdown"
    lecture_format: "markdown"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"
    exam_duration: 60
    quiz_duration: 15

  style:
    tone: "formal"
    notation: "standard"
    examples: true
    difficulty_progression: "gradual"
    real_world_context: true

  ai_generation:
    model: "claude-3-5-sonnet-20241022"
    temperature: 0.7
    max_tokens: 4096
    timeout: 30000
    max_retries: 3
```

These defaults work for most undergraduate courses and provide sensible starting values.

---

## Advanced Configuration

### Environment Variables

Override config values with environment variables:

```bash
# Override API key
export ANTHROPIC_API_KEY="sk-..."

# Override model
export SCHOLAR_MODEL="claude-3-opus-20240229"

# Override temperature
export SCHOLAR_TEMPERATURE="0.5"

# Override config location
export SCHOLAR_CONFIG="/path/to/config.yml"
```

**Precedence:** Environment variables > Config file > Defaults

### Per-Command Override

Override config for a single command:

```bash
# Override format for this exam
/teaching:exam midterm --format quarto

# Override difficulty for this assignment
/teaching:assignment homework --difficulty advanced

# Override question count
/teaching:quiz "Linear Regression" 15
```

**Precedence:** Command options > Environment variables > Config file > Defaults

### Multiple Courses

Manage multiple courses with separate configs:

```
courses/
├── stat440/
│   ├── .flow/teach-config.yml  # STAT-440 config
│   └── exams/
├── stat579/
│   ├── .flow/teach-config.yml  # STAT-579 config
│   └── exams/
└── math101/
    ├── .flow/teach-config.yml  # MATH-101 config
    └── exams/
```

Each course has its own configuration.

---

## Configuration Tips

### Best Practices

1. **Start minimal** - Use defaults, add config as needed
2. **Version control** - Commit `.flow/teach-config.yml` to git
3. **Document changes** - Add comments to explain non-standard settings
4. **Test changes** - Run demo mode after config changes
5. **Use environment variables** - For secrets and per-machine settings

### Common Patterns

### Beginner course (easy difficulty)

```yaml
course_info:
  difficulty: "beginner"
style:
  tone: "conversational"
  examples: true
  difficulty_progression: "gradual"
ai_generation:
  temperature: 0.7  # More variety in questions
```

### Advanced course (challenging)

```yaml
course_info:
  difficulty: "advanced"
style:
  tone: "formal"
  difficulty_progression: "steep"
  real_world_context: false
ai_generation:
  temperature: 0.5  # More focused, precise
  model: "claude-3-opus-20240229"  # Higher quality
```

### Online course (Canvas LMS)

```yaml
defaults:
  exam_format: "canvas"
  quiz_format: "canvas"
  lecture_format: "quarto"
style:
  tone: "conversational"
  examples: true
```

---

## Related Documentation

- [API Reference](API-REFERENCE.md) - Command documentation
- [User Guide](USER-GUIDE.md) - Step-by-step workflows
- [Architecture](ARCHITECTURE.md) - System architecture
- [Developer Guide](DEVELOPER-GUIDE.md) - Contributing guide
- [Deep Dive: teach-config Architecture](DEEP-DIVE-teach-config-architecture.md) - Detailed architecture guide
