# Validation Tools Documentation

Complete reference for Scholar's YAML → JSON sync, validation, and diff tools.

---

## Table of Contents

- [Overview](#overview)
- [Commands](#commands)
  - [/teaching:sync](#teachingsync)
  - [/teaching:validate](#teachingvalidate)
  - [/teaching:diff](#teachingdiff)
- [JSON Schemas](#json-schemas)
  - [Lesson Plan Schema](#lesson-plan-schema)
  - [Teaching Style Schema](#teaching-style-schema)
- [Error Formatter](#error-formatter)
- [API Reference](#api-reference)
- [Examples](#examples-auto-fix-sync-issues)

---

## Overview

The validation tools provide a complete pipeline for YAML configuration management:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    YAML Files    │ ──→ │   Sync Engine    │ ──→ │   JSON Files     │
│  (Source Truth)  │     │   (/teach:sync)  │     │  (Auto-generated)│
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                                                 │
         │                                                 │
         ▼                                                 ▼
┌──────────────────┐                            ┌──────────────────┐
│  Config Validator│                            │   Diff Engine    │
│ (/teach:validate)│                            │  (/teach:diff)   │
└──────────────────┘                            └──────────────────┘
```

### Key Features

- **<100ms sync latency** per file
- **Hash-based caching** skips unchanged files
- **4-level validation** (syntax → schema → semantic → cross-file)
- **IDE-compatible output** (eslint-style with line numbers)

---

## Commands

### /teaching:sync

Synchronize YAML configuration files to JSON format.

### Usage (Commands)

```bash
/teaching:sync [options]
/teaching:sync --file <path>
```

### Options (Commands)

| Option          | Description                          |
| --------------- | ------------------------------------ |
| `--all`         | Sync all files (force, ignore cache) |
| `--file <path>` | Sync specific file                   |
| `--status`      | Show sync status without syncing     |
| `--dry-run`     | Preview what would be synced         |
| `--force`       | Force sync even if unchanged         |
| `--quiet`       | Suppress output except errors        |
| `--debug`       | Enable debug logging                 |

### Examples (Commands)

```bash
# Sync changed files
/teaching:sync

# Check status
/teaching:sync --status

# Force sync specific file
/teaching:sync --file content/lesson-plans/week03.yml --force

# Preview what would sync
/teaching:sync --all --dry-run
```

---

### /teaching:validate

Validate YAML files against JSON schemas with multi-level validation.

### Usage (Preview what would)

```bash
/teaching:validate <file> [options]
/teaching:validate --all [options]
```

### Options (Preview what would)

| Option          | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| `--all`         | Validate all YAML files                                     |
| `--level <lvl>` | Stop at level: `syntax`, `schema`, `semantic`, `cross-file` |
| `--strict`      | Treat warnings as errors                                    |
| `--quiet`       | Only show errors                                            |
| `--json`        | Output as JSON                                              |
| `--debug`       | Enable debug logging                                        |

### Validation Levels

| Level          | Checks         | Example Errors                           |
| -------------- | -------------- | ---------------------------------------- |
| **syntax**     | YAML parsing   | Bad indentation, invalid syntax          |
| **schema**     | JSON Schema    | Missing required fields, wrong types     |
| **semantic**   | Business logic | Duration overflow, unassessed objectives |
| **cross-file** | References     | Missing datasets, invalid prerequisites  |

### Examples (Preview what would)

```bash
# Validate single file
/teaching:validate content/lesson-plans/week03.yml

# Validate all with strict mode
/teaching:validate --all --strict

# Quick schema check only
/teaching:validate --level=schema content/lesson-plans/

# JSON output for CI
/teaching:validate --all --json
```

---

### /teaching:diff

Compare YAML source files with generated JSON to detect sync issues.

### Usage (JSON output for CI)

```bash
/teaching:diff <file> [options]
/teaching:diff --all [options]
```

### Options (JSON output for CI)

| Option         | Description                 |
| -------------- | --------------------------- |
| `--all`        | Compare all YAML/JSON pairs |
| `--summary`    | Show only summary           |
| `--verbose`    | Show timestamps and details |
| `--force-sync` | Auto-sync out-of-sync files |
| `--json`       | Output as JSON              |
| `--quiet`      | Only show out-of-sync files |

### Change Symbols

| Symbol | Type         | Description                  |
| ------ | ------------ | ---------------------------- |
| `+`    | added        | Present in JSON but not YAML |
| `-`    | removed      | Present in YAML but not JSON |
| `~`    | changed      | Different values             |
| `!`    | type-changed | Data type differs            |

### Examples (JSON output for CI)

```bash
# Compare single file
/teaching:diff content/lesson-plans/week03.yml

# Summary of all files
/teaching:diff --all --summary

# Auto-fix sync issues
/teaching:diff --all --force-sync
```

---

## JSON Schemas

### Lesson Plan Schema

**File:** `src/teaching/schemas/v2/lesson-plan.schema.json`

### Required Fields

- `week` (integer, 1-52)
- `title` (string)
- `learning_objectives` (array, 1+ items)
- `topics` (array, 1+ items)

### ID Patterns

| Entity             | Pattern  | Example  |
| ------------------ | -------- | -------- |
| Learning Objective | `LO-X.Y` | `LO-3.1` |
| Topic              | `T-X.Y`  | `T-3.1`  |
| Activity           | `A-X.Y`  | `A-3.1`  |

### Learning Objective Structure

```yaml
learning_objectives:
  - id: "LO-3.1"                    # Required: LO-X.Y format
    level: "understand"             # Required: Bloom's taxonomy
    description: "Understand..."    # Required: 10-500 chars
    assessment_method: "quiz"       # Optional
```

### Bloom's Taxonomy Levels

`remember`, `understand`, `apply`, `analyze`, `evaluate`, `create`

### Topic Structure

```yaml
topics:
  - id: "T-3.1"                     # Required: T-X.Y format
    name: "Topic Name"              # Required: 3-200 chars
    prerequisites: ["T-2.1"]        # Optional: T-X.Y references
    subtopics:                      # Optional
      - "Subtopic A"
      - "Subtopic B"
```

### Activity Types

`in-class-practice`, `group-discussion`, `individual-exercise`, `lab-activity`, `peer-review`, `presentation`, `think-pair-share`, `demonstration`

### Full Example

```yaml
week: 3
title: "Multiple Regression"
date_range:
  start: "2026-02-05"
  end: "2026-02-09"

learning_objectives:
  - id: "LO-3.1"
    level: "understand"
    description: "Explain the multiple regression model"
    assessment_method: "quiz-question"

  - id: "LO-3.2"
    level: "apply"
    description: "Fit and interpret models in R"
    assessment_method: "homework-problem"

topics:
  - id: "T-3.1"
    name: "Multiple regression model"
    prerequisites: ["T-2.1", "T-2.2"]
    subtopics:
      - "Matrix notation"
      - "Coefficient interpretation"

materials:
  readings:
    - type: "textbook"
      title: "Applied Linear Regression"
      chapter: "6"
      required: true
  datasets:
    - name: "boston-housing"
      file: "datasets/boston.csv"

activities:
  - id: "A-3.1"
    type: "in-class-practice"
    duration_minutes: 25
    title: "Fit multiple regression in R"
    learning_objectives: ["LO-3.2"]

assessments:
  - type: "homework"
    id: "HW-3"
    title: "Multiple Regression Homework"
    due_date: "2026-02-12"
    points: 20
    learning_objectives: ["LO-3.1", "LO-3.2"]

lecture_structure:
  - segment: "review"
    duration_minutes: 5
  - segment: "introduction"
    duration_minutes: 15
    teaching_method: "mini-lecture"
  - segment: "practice"
    duration_minutes: 25
    teaching_method: "guided-practice"
```

---

### Teaching Style Schema

**File:** `src/teaching/schemas/v2/teaching-style.schema.json`

### Structure

```yaml
teaching_style:
  pedagogical_approach:
    primary: "active-learning"      # Required choice
    secondary: "socratic"           # Optional
    class_structure: []             # Optional: segment list

  explanation_style:
    formality: "balanced"           # formal, conversational, balanced
    proof_style: "intuition-first"  # proof-first, intuition-first, both-parallel
    example_depth: "multiple-varied"# single-detailed, multiple-varied, minimal
    analogies: "frequent"           # frequent, moderate, rare

  assessment_philosophy:
    primary_focus: "formative"      # formative, summative, balanced
    feedback_style: "descriptive"   # descriptive, rubric-based, minimal
    partial_credit: true

  student_interaction:
    questioning: "socratic"         # socratic, cold-call, volunteer, think-pair-share
    group_work: "structured"        # structured, open-ended, minimal

  content_preferences:
    real_world_examples: "frequent"
    computational_tools: "R-heavy"

  command_overrides:                # Layer 3: per-command overrides
    exam:
      formality: "formal"
      time_pressure: "strict"
    quiz:
      difficulty_adjustment: "easier"
```

### Pedagogical Approaches

`active-learning`, `lecture`, `flipped`, `socratic`, `inquiry-based`, `project-based`

### Command Override Options

- `formality`: tone adjustment
- `proof_style`: proof/intuition order
- `difficulty_adjustment`: `easier`, `same`, `harder`
- `time_pressure`: `relaxed`, `moderate`, `strict`
- `custom_instructions`: free-form text

---

## Error Formatter

The error formatter provides IDE-compatible output for all validation tools.

### Output Format

```
file.yml:15:3: error: Missing required field: level
  Rule: schema:required
  Suggestion: Add "level" with Bloom's taxonomy value

file.yml:42: warning: Activity time (90 min) exceeds lecture time (75 min)
  Rule: semantic:duration-overflow

───────────────────────────────────────────────────────
Validation: 1 error, 1 warning in 1 file (45ms)
```

### Severity Levels

| Level   | Color  | Description        |
| ------- | ------ | ------------------ |
| error   | Red    | Must be fixed      |
| warning | Yellow | Should be reviewed |
| info    | Blue   | Informational      |

### Features

- Relative paths from CWD
- Line and column numbers
- Rule identification
- Fix suggestions
- Summary statistics

---

## API Reference

### ConfigSyncEngine

```javascript
import { ConfigSyncEngine } from 'scholar/config/sync-engine.js';

const engine = new ConfigSyncEngine({
  rootDir: process.cwd(),
  cacheDir: '.scholar-cache',
  debug: false,
  strict: false
});

// Sync single file
const result = engine.syncFile('config.yml', { force: false });

// Sync all files
const results = await engine.syncAll({
  patterns: ['content/**/*.yml'],
  force: false
});

// Get sync status
const status = engine.getSyncStatus('config.yml');

// Clear cache
engine.clearCache();
```

### ConfigValidator

```javascript
import { ConfigValidator } from 'scholar/validators/config-validator.js';

const validator = new ConfigValidator({
  strict: false,
  maxLevel: 'cross-file',
  color: true,
  cwd: process.cwd()
});

// Validate file
const result = validator.validateFile('week03.yml', {
  schemaType: 'lesson-plan'  // or 'teaching-style', or auto-detect
});

// Result structure
{
  isValid: boolean,
  level: 'syntax' | 'schema' | 'semantic' | 'cross-file',
  errors: ValidationError[],
  warnings: ValidationError[],
  data: object,
  duration: number
}
```

### ConfigDiffEngine

```javascript
import { ConfigDiffEngine } from 'scholar/config/diff-engine.js';

const engine = new ConfigDiffEngine({
  cwd: process.cwd(),
  ignoreOrder: false,
  ignorePaths: []
});

// Compare files
const result = engine.compareFile('config.yml');

// Result structure
{
  inSync: boolean,
  yamlPath: string,
  jsonPath: string,
  differences: DiffEntry[],
  stats: { added, removed, changed, typeChanged },
  duration: number
}

// Format for display
const output = engine.formatResult(result, { color: true });
```

---

## Examples (Auto-fix sync issues)

### CI/CD Integration

```yaml
# .github/workflows/validate.yml
name: Validate Config

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Sync YAML → JSON
        run: node scripts/sync-yaml.js --all

      - name: Validate configs
        run: |
          npx scholar-validate --all --strict --json > validation.json
          if grep -q '"errors":\s*\[' validation.json && ! grep -q '"errors":\s*\[\]' validation.json; then
            cat validation.json
            exit 1
          fi
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Sync YAML → JSON
node scripts/sync-yaml.js --quiet
if [ $? -ne 0 ]; then
  echo "YAML sync failed. Please fix errors."
  exit 1
fi

# Stage generated JSON files
git add content/**/*.json .claude/**/*.json 2>/dev/null || true
```

### VS Code Integration

```json
// .vscode/settings.json
{
  "yaml.schemas": {
    "src/teaching/schemas/v2/lesson-plan.schema.json": [
      "content/lesson-plans/*.yml",
      "content/lesson-plans/*.yaml"
    ],
    "src/teaching/schemas/v2/teaching-style.schema.json": [
      ".claude/teaching-style*.yml"
    ]
  },
  "yaml.validate": true
}
```

---

## Troubleshooting

### "Never synced" status

Run `/teaching:sync` to generate the JSON file.

### Schema validation errors

Check the error message for the specific field and expected format. Common issues:

- Wrong ID pattern (use `LO-X.Y`, `T-X.Y`, `A-X.Y`)
- Invalid Bloom's level (use lowercase: `understand`, not `Understand`)
- Missing required fields

### Semantic warnings

These are suggestions, not errors. Common warnings:

- Activity time exceeds lecture time
- Learning objective not linked to assessment
- Topic references prerequisite from same week

### Cross-file warnings

- **Missing dataset**: Create the file or update the path
- **Future prerequisite**: Check week number in topic ID

---

*Generated for Scholar v2.2.0 - Validation Tools*
