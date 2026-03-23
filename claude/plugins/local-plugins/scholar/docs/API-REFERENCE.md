---
render_macros: false
---

# Scholar Plugin - API Reference

> **Version:** 2.17.0
> **Last Updated:** 2026-03-04
> **Audience:** Plugin developers and contributors

This document provides a comprehensive API reference for developers contributing to or extending the Scholar plugin.

---

## Table of Contents

- [Plugin Architecture](#plugin-architecture)
- [Command API](#command-api)
- [Skill API](#skill-api)
- [Core Modules](#core-modules)
- [Configuration API](#configuration-api)
- [Validation API](#validation-api)
- [Template System](#template-system-contentlesson-plansweek03yml)
- [Testing Framework](#testing-framework)
- [Utilities](#utilities)
- [Extension Points](#extension-points)
- [Security](#security)
- [Generator API](#generator-api)
- [Refiner API (v2.5.0)](#refiner-api-v250)
- [QMD Parser API (v2.5.0)](#qmd-parser-api-v250)
- [Slugify API (v2.5.0)](#slugify-api-v250)
- [Coverage Validator API (v2.5.0)](#coverage-validator-api-v250)
- [Preview Launcher API (v2.5.0)](#preview-launcher-api-v250)
- [Formatter API](#formatter-api)
- [Slide Parser API (v2.8.0)](#slide-parser-api-v280)
- [Slide Refiner API (v2.8.0)](#slide-refiner-api-v280)
- [Slide Coverage Validator API (v2.8.0)](#slide-coverage-validator-api-v280)
- [Discovery Engine API (v2.12.0)](#discovery-engine-api-v2120)
- [Validate Pipeline API (v2.15.0)](#validate-pipeline-api-v2150)
- [Preflight API (v2.15.0)](#preflight-api-v2150)
- [Canvas Preflight API (v2.17.0)](#canvas-preflight-api-v2170)
- [Send Output API (v2.15.0)](#send-output-api-v2150)
- [Smart Help API (v2.12.0)](#smart-help-api-v2120)

### See also

- [Teaching Commands Reference](TEACHING-COMMANDS-REFERENCE.md) - User-facing command documentation
- [Developer Guide](DEVELOPER-GUIDE.md) - Development workflow and contribution guidelines

---

## Plugin Architecture

### Directory Structure

```
scholar/
├── .claude-plugin/
│   └── plugin.json           # Plugin metadata
├── src/
│   ├── plugin-api/           # Commands and skills (user-facing)
│   │   ├── commands/         # Slash commands
│   │   │   ├── teaching/     # /teaching:* commands
│   │   │   ├── research/     # /scholar:* commands
│   │   │   ├── manuscript/   # /manuscript:* commands
│   │   │   ├── simulation/   # /simulation:* commands
│   │   │   └── literature/   # /arxiv, /doi, /bib:* commands
│   │   └── skills/           # Auto-activating skills
│   ├── teaching/             # Teaching command implementations
│   ├── research/             # Research command implementations
│   └── shared/               # Shared utilities
├── tests/                    # Test suite (3,302 tests)
└── docs/                     # Documentation
```

### Plugin Manifest

**File:** `.claude-plugin/plugin.json`

```json
{
  "name": "scholar",
  "version": "2.5.0",
  "description": "Academic workflows for research and teaching",
  "author": {
    "name": "Data-Wise"
  },
  "commands": "./src/plugin-api/commands",
  "skills": "./src/plugin-api/skills"
}
```

---

## Command API

Commands are slash commands (e.g., `/teaching:exam`) that users explicitly invoke.

### Command File Structure

**Location:** `src/plugin-api/commands/<namespace>/<command>.md`

### Frontmatter (Command API)

```yaml
---
name: exam
description: Generate comprehensive exams with AI-powered questions and answer keys
---
```

### Command Naming Conventions

| Pattern                 | Example          | Description                       |
| ----------------------- | ---------------- | --------------------------------- |
| `<namespace>:<command>` | `/teaching:exam` | Namespaced command                |
| `<standalone>`          | `/arxiv`         | Standalone command (no namespace) |

---

## Skill API

Skills auto-activate based on context and conversation content.

### Skill File Structure

**Location:** `src/plugin-api/skills/<category>/<skill>.md`

### Frontmatter (Skill API)

```yaml
---
name: Method Scout
category: research
trigger_keywords:
  - "statistical method"
  - "choose method"
description: Scout and evaluate statistical methods for research problems
---
```

### Skill Categories

| Category       | Purpose                      | Example Skills                    |
| -------------- | ---------------------------- | --------------------------------- |
| `research`     | Research planning and design | method-scout, lit-gap, hypothesis |
| `teaching`     | Course material generation   | slides, assignment, quiz          |
| `mathematical` | Mathematical reasoning       | proof, derive, notation           |

---

## Core Modules

### Configuration Loader

**Location:** `src/teaching/utils/config.js`

```javascript
import { loadConfig, findConfigFile } from './config.js';

// Auto-discover config file
const configPath = findConfigFile(); // Searches .flow/teach-config.yml

// Load and parse config
const config = await loadConfig(configPath);
```

### Template System (Core Modules)

**Location:** `src/teaching/templates/`

Templates define the structure for generated content (exams, quizzes, etc.).

### Validators

**Location:** `src/teaching/validators/`

- **Config Validator** - Validates YAML configuration files
- **Auto-Fixer** - Automatically fixes common config errors
- **Migration** - Migrates v1 schemas to v2

---

## Configuration API

### Configuration Schema

**File:** `.flow/teach-config.yml`

```yaml
scholar:
  course_info:
    level: "undergraduate"  # or "graduate"
    field: "statistics"
    difficulty: "intermediate"

  defaults:
    exam_format: "markdown"  # md, qmd, tex, json
    question_types:
      - "multiple-choice"
      - "short-answer"
```

---

## Teaching Style API

### Style Loader

**Location:** `src/teaching/config/style-loader.js`

The 4-layer teaching style system loads and merges pedagogical preferences from multiple configuration sources.

### Functions

```javascript
import {
  loadTeachingStyle,
  loadGlobalStyle,
  loadCourseStyle,
  extractCommandOverrides,
  mergeTeachingStyles,
  toPromptStyle,
  validateTeachingStyle,
  getStyleSummary
} from './config/style-loader.js';
```

### Main Loader

```javascript
// Load complete teaching style for a command
const { style, promptStyle, sources, courseRoot } = loadTeachingStyle({
  command: 'lecture',        // Command name
  startDir: process.cwd(),   // Search start directory
  lessonPlan: null           // Optional lesson plan object
});

// style: Full merged teaching style object
// promptStyle: Simplified attributes for AI prompts
// sources: { global, course, command, lesson } paths
// courseRoot: Detected course root directory
```

### Layer Precedence

| Priority    | Layer   | Source                            |
| ----------- | ------- | --------------------------------- |
| 1 (lowest)  | Global  | `~/.claude/CLAUDE.md`             |
| 2           | Course  | `.claude/teaching-style.local.md` |
| 3           | Lesson  | `content/lesson-plans/weekNN.yml` |
| 4 (highest) | Command | `command_overrides.{command}`     |

### Validation

```javascript
const { isValid, errors, warnings } = validateTeachingStyle(style);
// isValid: boolean
// errors: fatal validation errors
// warnings: non-fatal issues
```

### Lesson Plan Loader

**Location:** `src/teaching/utils/lesson-plan-loader.js`

Loads lesson plans from `content/lesson-plans/` directory.

```javascript
import { loadLessonPlan, findLessonPlans } from './utils/lesson-plan-loader.js';

// Load specific lesson plan
const plan = await loadLessonPlan('week03', courseRoot);

// Find all lesson plans in course
const plans = await findLessonPlans(courseRoot);
// Returns: ['week01', 'week02', 'week03', ...]
```

### Lesson Plan Structure

```yaml
# content/lesson-plans/week03.yml
title: "Linear Regression"
week: 3
learning_objectives:
  - "Understand the linear regression model"
  - "Apply least squares estimation"
teaching_style_overrides:
  explanation_style:
    proof_style: "rigorous-with-intuition"
```

---

## Validation API

### Auto-Fixer

**Location:** `src/teaching/validators/auto-fixer.js`

### Fix Types

| Code   | Type      | Description              |
| ------ | --------- | ------------------------ |
| `QW1`  | Quick Win | Whitespace normalization |
| `M1.1` | Migration | Schema compliance fixes  |
| `M1.2` | Migration | Type corrections         |
| `M1.3` | Migration | v1 → v2 schema migration |

### Usage

```javascript
import { AutoFixer } from './validators/auto-fixer.js';

const fixer = new AutoFixer({ dryRun: false });

// Fix single file
const result = await fixer.fix(filePath, { backup: true });
// result: { fixed: boolean, changes: [], backupPath: string }

// Fix multiple files
const results = await fixer.fixBatch(filePaths, { stopOnError: false });
```

### Validator Engine

**Location:** `src/teaching/validators/engine.js`

4-level validation for YAML configuration files.

```javascript
import { ValidatorEngine } from './validators/engine.js';

const validator = new ValidatorEngine({
  schemaDir: 'src/teaching/schemas/v2/',
  strictMode: false
});

const result = await validator.validate(filePath);
// {
//   valid: boolean,
//   errors: [{ file, line, col, message, code }],
//   warnings: [{ file, line, col, message }]
// }
```

### Validation Levels

1. **YAML Syntax** - Valid YAML structure
2. **JSON Schema** - Conforms to teaching config schema
3. **LaTeX** - Math notation validation
4. **Completeness** - Required fields present

### LaTeX Validator

**Location:** `src/teaching/validators/latex.js`

Math syntax validation and auto-fix utilities for LaTeX content.

#### `checkMathBlankLines(text)`

Detects blank lines inside `$$...$$` display math blocks. Blank lines create paragraph breaks in LaTeX, exiting math mode and causing PDF compilation errors.

**Parameters:**

| Name   | Type   | Required | Description       |
| ------ | ------ | -------- | ----------------- |
| `text` | string | Yes      | Text to check     |

**Returns:** `Array<LatexError>` — Each error includes `message`, `position`, and `context` (line numbers of the blank line and opening `$$`)

```javascript
import { validateLatex } from './validators/latex.js';

const errors = validateLatex(mathContent);
// checkMathBlankLines is called automatically by validateLatex()
```

#### `stripMathBlankLines(text)`

Auto-fix counterpart — silently removes blank lines from inside `$$...$$` display math blocks.

**Parameters:**

| Name   | Type   | Required | Description       |
| ------ | ------ | -------- | ----------------- |
| `text` | string | Yes      | Text to clean     |

**Returns:** `string` — Text with blank lines removed from math blocks

```javascript
import { stripMathBlankLines } from './validators/latex.js';

const cleaned = stripMathBlankLines(quartoContent);
```

> **Note:** `formatLectureNotesAsQuarto()` calls `stripMathBlankLines()` automatically. You only need to call it directly for custom pipelines.

---

## Prompt API (v2.4.0 - Planned)

### PromptBuilder

**Location:** `src/teaching/ai/prompt-builder.js` (planned)

Transforms teaching styles into optimized AI prompts.

```javascript
import { PromptBuilder } from './ai/prompt-builder.js';

const builder = new PromptBuilder({
  templateDir: 'src/teaching/ai/prompts/v2/'
});

// Build prompt from teaching style
const prompt = builder.buildFromStyle('lecture', 'ANOVA F-test', teachingStyle);
```

### Adaptation Strategies

1. **Variable Substitution** - `{{notation_rules}}` → actual values
2. **Conditional Sections** - Include/exclude based on style preferences
3. **Weighted Prompts** - Adjust emphasis by instructor preferences

For full specification, see the original spec in git history (`docs/specs/SPEC-prompt-generation-system-2026-01-21.md`).

---

## Template System (content/lesson-plans/week03.yml)

Templates are JSON Schema files that define the structure for generated content.

**Location:** `src/teaching/templates/<command>.json`

---

## Testing Framework

### Unit Tests

**Location:** `tests/teaching/<module>.test.js`

```javascript
import { describe, test, expect } from '@jest/globals';

describe('Exam Generator', () => {
  test('generates valid exam structure', async () => {
    const result = await generateExam({
      type: 'midterm',
      questionCount: 5
    });

    expect(result.questions).toHaveLength(5);
  });
});
```

### Custom Matchers

```javascript
expect(yaml1).toMatchYAML(yaml2);  // Deep YAML comparison
expect(yamlContent).toHaveValidSyntax();  // Syntax validation
```

---

## Utilities

### File System

```javascript
import { readFile, writeFile } from 'fs/promises';

const content = await readFile(path, 'utf-8');
await writeFile(path, content, 'utf-8');
```

### Git Operations

**IMPORTANT:** Always use `execFileNoThrow` for git operations to prevent command injection.

```javascript
import { execFileNoThrow } from '../utils/execFileNoThrow.js';

await execFileNoThrow('git', ['add', '.']);
await execFileNoThrow('git', ['commit', '-m', message]);
```

### YAML Parsing

```javascript
import yaml from 'js-yaml';

const data = yaml.load(yamlString);
const yamlString = yaml.dump(data, { indent: 2 });
```

---

## Extension Points

### Adding a New Command

1. Create command file: `src/plugin-api/commands/<namespace>/<name>.md`
2. Add generator (if needed): `src/teaching/generators/<name>.js`
3. Add template: `src/teaching/templates/<name>.json`
4. Add tests: `tests/teaching/<name>.test.js`

### Adding a New Skill

1. Create skill file: `src/plugin-api/skills/<category>/<name>.md`
2. Define trigger keywords in frontmatter
3. Implement skill logic in `<system>` block

---

## Security

### Input Validation

Always validate user input before using it:

```javascript
if (!['midterm', 'final', 'practice'].includes(examType)) {
  throw new Error('Invalid exam type');
}
```

### Command Injection Prevention

**CRITICAL:** Never use shell interpolation with user input.

Always use `execFileNoThrow` for subprocess execution:

```javascript
import { execFileNoThrow } from '../utils/execFileNoThrow.js';

// SAFE: No shell interpolation
await execFileNoThrow('git', ['commit', '-m', userMessage]);
```

### Why this is safer

- Uses `execFile` (no shell)
- Handles Windows compatibility
- Structured error handling
- Prevents injection attacks

### API Key Management

```javascript
// Load from environment, never hardcode
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY not set');
}
```

---

## Performance Guidelines

### Performance Targets (v2.3.0)

| Operation                 | Target | Actual |
| ------------------------- | ------ | ------ |
| Validate config           | <100ms | 72ms   |
| Generate exam (10 Q)      | <5s    | 3.8s   |
| Fix syntax errors         | <50ms  | 38ms   |
| Batch migrate (100 files) | <1s    | 850ms  |

---

## Error Handling (content/lesson-plans/week03.yml)

### Standard Error Format

```javascript
{
  success: false,
  error: {
    type: 'ValidationError',
    message: 'Invalid configuration',
    details: [/* error details */]
  }
}
```

### Error Types

| Type                | Description                     | Recovery                    |
| ------------------- | ------------------------------- | --------------------------- |
| `ValidationError`   | Config/schema validation failed | Fix config, run validator   |
| `GenerationError`   | AI generation failed            | Retry, check API key        |
| `FileNotFoundError` | Config file not found           | Create config, use --config |
| `MigrationError`    | Schema migration failed         | Manual fix, check logs      |

---

## Resources

### Internal Documentation

- [Teaching Commands Reference](TEACHING-COMMANDS-REFERENCE.md)
- [Developer Guide](DEVELOPER-GUIDE.md)
- [Testing Guide](TESTING-GUIDE.md)
- [Auto-Fixer Guide](AUTO-FIXER-GUIDE.md)
- [What's New v2.3.0](WHATS-NEW-v2.3.0.md)

### External Documentation

- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [JSON Schema](https://json-schema.org/draft-07/schema)
- [YAML Specification](https://yaml.org/spec/1.2.2/)
- [Jest Testing Framework](https://jestjs.io/)

### GitHub

- [Repository](https://github.com/Data-Wise/scholar)
- [Issues](https://github.com/Data-Wise/scholar/issues)
- [Releases](https://github.com/Data-Wise/scholar/releases)

---

**Last updated:** 2026-02-13
**API Version:** 2.11.0
**Contributors:** Data-Wise team

## Generator API

Generators create teaching content (exams, quizzes, assignments, syllabi, lectures) using AI. All generators share a common interface and use Phase 0 foundation components.

### Common Generator Interface

All generators follow this pattern:

```javascript
import { generateExam } from './generators/exam.js';

const result = await generateExam(options);
// Returns: { content, validation, metadata }
```

### Standard Return Object

| Property     | Type   | Description                                    |
| ------------ | ------ | ---------------------------------------------- |
| `content`    | Object | Generated content as JSON                      |
| `validation` | Object | Validation result `{valid, errors, warnings}`  |
| `metadata`   | Object | Generation metadata (tokens, model, timestamp) |

### Exam Generator

**Location:** `src/teaching/generators/exam.js`

#### `generateExam(options)`

Generate an exam with AI-powered questions.

### Parameters (Generator API)

| Name               | Type     | Required | Default          | Description                                       |
| ------------------ | -------- | -------- | ---------------- | ------------------------------------------------- |
| `type`             | string   | No       | `'midterm'`      | Exam type: `midterm`, `final`, `practice`, `quiz` |
| `questionCount`    | number   | No       | `10`             | Number of questions to generate                   |
| `difficulty`       | string   | No       | `'intermediate'` | Difficulty: `easy`, `medium`, `hard`              |
| `topics`           | string[] | No       | `[]`             | Specific topics to cover                          |
| `durationMinutes`  | number   | No       | `60`             | Exam duration                                     |
| `questionTypes`    | Object   | No       | See below        | Distribution of question types                    |
| `includeFormulas`  | boolean  | No       | `true`           | Include formula sheet                             |
| `includeSolutions` | boolean  | No       | `true`           | Include detailed solutions                        |
| `strict`           | boolean  | No       | `false`          | Use strict validation                             |
| `debug`            | boolean  | No       | `false`          | Enable debug logging                              |

### Default Question Types

```javascript
{
  'multiple-choice': 0.6,
  'short-answer': 0.3,
  'essay': 0.1
}
```

**Returns:** `Promise<Object>`

```javascript
{
  content: {
    title: 'Midterm Exam - Statistics 101',
    exam_type: 'midterm',
    questions: [...],
    answer_key: {...},
    total_points: 100
  },
  validation: { isValid: true, errors: [], warnings: [] },
  metadata: {
    examType: 'midterm',
    questionCount: 10,
    totalPoints: 100,
    generatedAt: '2026-01-28T...'
  }
}
```

### Example (Generator API)

```javascript
import { generateExam } from './generators/exam.js';

const exam = await generateExam({
  type: 'midterm',
  questionCount: 15,
  difficulty: 'medium',
  topics: ['Linear Regression', 'ANOVA', 'Hypothesis Testing'],
  durationMinutes: 90
});

console.log(`Generated ${exam.content.questions.length} questions`);
console.log(`Total points: ${exam.content.total_points}`);
```

### Error Handling (Generator API)

```javascript
try {
  const exam = await generateExam(options);
} catch (error) {
  if (error.message.includes('Validation failed')) {
    // Handle validation errors
  } else if (error.message.includes('AI generation failed')) {
    // Handle API errors
  }
}
```

#### `generateAndSaveExam(options, outputPath, format)`

Generate and save exam to file.

### Parameters

| Name         | Type   | Required | Description                                         |
| ------------ | ------ | -------- | --------------------------------------------------- |
| `options`    | Object | Yes      | Same as `generateExam()`                            |
| `outputPath` | string | Yes      | Output file path                                    |
| `format`     | string | No       | Output format: `json`, `md`, `canvas`, `qmd`, `tex` |

**Returns:** `Promise<Object>`

```javascript
{
  content: {...},
  validation: {...},
  metadata: {...},
  filePath: '/path/to/exam.md',
  format: 'markdown'
}
```

#### `generateExamVariations(options, count)`

Generate multiple variations of the same exam.

### Parameters - Generator API

| Name      | Type   | Required | Default | Description             |
| --------- | ------ | -------- | ------- | ----------------------- |
| `options` | Object | Yes      | -       | Exam generation options |
| `count`   | number | No       | `2`     | Number of variations    |

**Returns:** `Promise<Array<Object>>`

---

### Quiz Generator

**Location:** `src/teaching/generators/quiz.js`

#### `generateQuiz(options)`

Generate a quiz (shorter, formative assessment).

### Parameters - Generator API 2

| Name              | Type    | Required | Default          | Description                                                     |
| ----------------- | ------- | -------- | ---------------- | --------------------------------------------------------------- |
| `type`            | string  | No       | `'checkpoint'`   | Quiz type: `reading`, `practice`, `checkpoint`, `pop`, `review` |
| `topic`           | string  | No       | `''`             | Main topic                                                      |
| `questionCount`   | number  | No       | `8`              | Number of questions                                             |
| `difficulty`      | string  | No       | `'intermediate'` | Difficulty level                                                |
| `durationMinutes` | number  | No       | `15`             | Quiz duration                                                   |
| `questionTypes`   | Object  | No       | See below        | Question type distribution                                      |
| `randomize`       | boolean | No       | `false`          | Enable randomization                                            |
| `showFeedback`    | string  | No       | `'after_submit'` | When to show feedback                                           |
| `allowRetakes`    | boolean | No       | `false`          | Allow multiple attempts                                         |

### Default Question Types (Quiz)

```javascript
{
  'multiple-choice': 0.6,
  'true-false': 0.2,
  'short-answer': 0.2
}
```

### Quick Quiz Helpers

```javascript
import { QuickQuiz } from './generators/quiz.js';

// Reading quiz (5 questions, 10 minutes)
const reading = await QuickQuiz.reading('Chapter 3: Regression');

// Checkpoint quiz
const checkpoint = await QuickQuiz.checkpoint('ANOVA', 5);

// Practice quiz with hints
const practice = await QuickQuiz.practice('Probability', 10);

// Exam review quiz
const review = await QuickQuiz.review(['Regression', 'ANOVA'], 15);
```

---

### Assignment Generator

**Location:** `src/teaching/generators/assignment.js`

#### `generateAssignment(options)`

Generate homework assignments with multi-part problems.

### Parameters - Generator API 3

| Name                | Type    | Required | Default          | Description                                                               |
| ------------------- | ------- | -------- | ---------------- | ------------------------------------------------------------------------- |
| `type`              | string  | No       | `'homework'`     | Assignment type: `homework`, `problem-set`, `lab`, `project`, `worksheet` |
| `topic`             | string  | No       | `''`             | Main topic                                                                |
| `problemCount`      | number  | No       | `5`              | Number of problems                                                        |
| `difficulty`        | string  | No       | `'intermediate'` | Difficulty level                                                          |
| `totalPoints`       | number  | No       | `100`            | Total points                                                              |
| `estimatedTime`     | string  | No       | `'2-3 hours'`    | Estimated completion time                                                 |
| `includeCode`       | boolean | No       | `false`          | Include coding problems                                                   |
| `language`          | string  | No       | `'R'`            | Programming language                                                      |
| `generateSolutions` | boolean | No       | `true`           | Generate solution key                                                     |
| `generateRubric`    | boolean | No       | `true`           | Generate grading rubric                                                   |

**Returns:** `Promise<Object>`

```javascript
{
  assignment: {
    title: 'Homework 3: Linear Regression',
    problems: [
      {
        id: 'P1',
        text: 'Problem statement...',
        parts: [
          { label: 'a', text: 'Sub-question', points: 10 },
          { label: 'b', text: 'Sub-question', points: 10 }
        ],
        points: 20
      }
    ],
    solutions: {...},
    rubric: {...}
  },
  validation: {...},
  metadata: {...}
}
```

---

### Syllabus Generator

**Location:** `src/teaching/generators/syllabus.js`

#### `generateSyllabus(options)`

Generate comprehensive course syllabus.

### Parameters - Generator API 4

| Name                    | Type     | Required | Default           | Description               |
| ----------------------- | -------- | -------- | ----------------- | ------------------------- |
| `courseTitle`           | string   | No       | `''`              | Course title              |
| `courseCode`            | string   | No       | `''`              | Course code               |
| `semester`              | string   | No       | `''`              | Semester/term             |
| `credits`               | number   | No       | `3`               | Credit hours              |
| `level`                 | string   | No       | `'undergraduate'` | Course level              |
| `weeks`                 | number   | No       | `16`              | Number of weeks           |
| `topics`                | string[] | No       | `[]`              | Main topics               |
| `gradingComponents`     | Array    | No       | Standard          | Grading breakdown         |
| `includeTemplatePolicy` | boolean  | No       | `true`            | Include standard policies |

---

### Lecture Notes Generator

**Location:** `src/teaching/generators/lecture-notes.js`

#### `generateLectureNotes(options, onProgress)`

Generate comprehensive 20-40 page instructor-facing lecture notes in Quarto format.

### Parameters - Generator API 5

| Name       | Type   | Required | Default               | Description                     |
| ---------- | ------ | -------- | --------------------- | ------------------------------- |
| `topic`    | string | Yes      | -                     | Main topic                      |
| `fromPlan` | string | No       | `null`                | Lesson plan ID (e.g., 'week03') |
| `output`   | string | No       | `'content/lectures/'` | Output directory                |
| `format`   | string | No       | `'html,pdf,docx'`     | Quarto output formats           |
| `language` | string | No       | `'r'`                 | Programming language            |

**Returns:** `Promise<Object>`

```javascript
{
  content: '---\ntitle: ...\n...',  // Quarto document
  json: {                           // Structured JSON
    title: '...',
    sections: [...],
    learning_objectives: [...]
  },
  metadata: {
    totalSections: 8,
    totalPages: 28,
    codeBlocks: 5,
    mathEquations: 12,
    practiceProblems: 6,
    generationTime: 45  // seconds
  },
  validation: {...}
}
```

---

## Refiner API (v2.5.0)

The Refiner API enables section-level and full-lecture regeneration of existing `.qmd` files.

**Location:** `src/teaching/generators/lecture-refiner.js`

### `refineLecture(options)`

Refine an existing lecture `.qmd` file by section or globally.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options.refine` | string | Yes | Path to existing `.qmd` file |
| `options.section` | string | No | Section title to refine (fuzzy matched). Omit for full-lecture refinement |
| `options.instruction` | string | Yes | Refinement instruction text |
| `options.force` | boolean | No | Skip overwrite confirmation |
| `options.debug` | boolean | No | Enable debug logging |

#### Returns

```javascript
{
  file: string,        // Path to updated file
  mode: 'section' | 'full',
  section: string | null,
  instruction: string,
  elapsed: number,     // Seconds
  content: string      // Updated file content
}
```

#### Example

```javascript
import { refineLecture } from '../teaching/generators/lecture-refiner.js';

const result = await refineLecture({
  refine: 'content/lectures/week03-regression.qmd',
  section: 'Worked Examples',
  instruction: 'Add two more examples using tidyverse syntax'
});
// result.mode === 'section'
// result.elapsed === 12
```

---

## QMD Parser API (v2.5.0)

Parses Quarto (`.qmd`) documents into structured sections for refinement and validation.

**Location:** `src/teaching/utils/qmd-parser.js`

### `parseQmdFile(filePath)`

Parse a `.qmd` file into structured sections.

**Returns:** `ParsedQmd`

```typescript
interface ParsedQmd {
  frontmatter: string;        // Raw YAML (without --- delimiters)
  frontmatterEndLine: number; // Line after closing ---
  preamble: string;           // Content between frontmatter and first heading
  sections: ParsedSection[];  // Top-level sections
  lines: string[];            // All document lines
  raw: string;                // Original file content
}

interface ParsedSection {
  title: string;              // Heading text (without # prefix)
  slug: string;               // Slugified title
  level: number;              // Heading level (2 for ##, 3 for ###)
  startLine: number;          // 0-based line index
  endLine: number;            // Exclusive end line
  content: string;            // Full section text including heading
  body: string;               // Section text excluding heading line
  headingId: string;          // Quarto cross-ref ID (e.g., "sec-intro")
  subsections: ParsedSection[];
}
```

### `parseQmdContent(content)`

Parse QMD content string (same return type as `parseQmdFile`).

### `matchSection(sections, query)`

Match a query string against section titles using slug-based fuzzy matching.

| Behavior | Description |
|----------|-------------|
| Exact match | Slugified query exactly equals section slug |
| Fuzzy match | Section slug contains query slug (one-directional) |
| Minimum length | Query must be >= 4 characters for fuzzy matching |
| Ambiguity | Warns on console when multiple sections match |

**Returns:** `ParsedSection | null`

### `replaceSection(lines, section, newContent)`

Replace a section's content in the document.

**Returns:** `string` — Updated document content

### `flattenSections(sections)`

Flatten nested section tree into a flat array.

**Returns:** `ParsedSection[]`

### `appendRefinementRecord(frontmatter, sectionTitle, date)`

Append a refinement record to provenance metadata in frontmatter. Warns if no metadata block found.

**Returns:** `string` — Updated frontmatter

### `extractProvenance(frontmatter)`

Extract Scholar generation metadata from frontmatter YAML comments.

**Returns:** `Object | null`

---

## Slugify API (v2.5.0)

Converts topic strings into URL/filename-safe slugs.

**Location:** `src/teaching/utils/slugify.js`

### `slugify(str, maxLength = 80)`

Convert a string to a filename-safe slug.

```javascript
slugify("Multiple Linear Regression")  // "multiple-linear-regression"
slugify("ANOVA (One-Way)")             // "anova-one-way"
slugify("  Week 03: RCBD  ")           // "week-03-rcbd"
slugify("a".repeat(500))               // truncated to 80 chars
```

### `generateLectureFilename(options)`

Generate output filename based on topic and `--from-plan`.

| Input | Output |
|-------|--------|
| `{ topic: "Regression" }` | `lecture-regression.qmd` |
| `{ topic: "RCBD", fromPlan: "week08" }` | `week08-rcbd.qmd` |

---

## Coverage Validator API (v2.5.0)

Validates that a generated lecture covers all lesson plan objectives and topics.

**Location:** `src/teaching/validators/lecture-coverage.js`

### `validateCoverage(options)`

Validate lecture coverage against a lesson plan.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options.check` | string | Yes | Path to `.qmd` file |
| `options.fromPlan` | string | Yes | Lesson plan week ID (e.g., `"week08"`) |
| `options.courseRoot` | string | No | Course root directory (default: `cwd()`) |
| `options.debug` | boolean | No | Debug logging |

#### Returns

```typescript
interface CoverageReport {
  lectureFile: string;
  lessonPlan: string;
  coveragePercent: number;       // 0-100
  objectives: CoverageItem[];
  topics: CoverageItem[];
  gaps: string[];                // Descriptions of uncovered items
}

interface CoverageItem {
  id: string;                    // "LO-8.1" or topic name
  description: string;
  covered: boolean;
  foundInSections: string[];     // Section titles where found
}
```

### `formatCoverageReport(report)`

Format coverage report for terminal display with `[x]`/`[ ]` indicators.

**Returns:** `string`

### `extractKeywords(text)` (exported for testing)

Extract meaningful keywords from a description, filtering stop words and Bloom's taxonomy verbs.

### `findMatchingSections(keywords, sectionContents)` (exported for testing)

Find sections matching >= 50% of provided keywords.

---

## Preview Launcher API (v2.5.0)

Launches Quarto preview for generated lecture files.

**Location:** `src/teaching/utils/preview-launcher.js`

### `launchPreview(filePath, options)`

Launch `quarto preview` as a detached background process.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | Yes | Path to `.qmd` file |
| `options.debug` | boolean | No | Inherit stdio for debug output |

**Returns:** `{ success: boolean, message: string }`

Checks: file existence, Quarto CLI availability. Uses `spawn()` with argument array (no shell) on all platforms.

### `isQuartoAvailable()`

Check if Quarto CLI is installed and in PATH.

**Returns:** `boolean`

---

## Formatter API

Formatters convert generated teaching content (JSON) into various output formats (Markdown, LaTeX, Quarto, Canvas QTI). All formatters extend `BaseFormatter` and share a common interface.

### Base Formatter

**Location:** `src/teaching/formatters/base.js`

#### `BaseFormatter`

Abstract base class for all formatters.

### Core Methods

##### `format(content, options)`

Format content to target format.

### Parameters (Formatter API)

| Name      | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `content` | Object | Yes      | Generated content (JSON) |
| `options` | Object | No       | Format-specific options  |

**Returns:** `string | Promise<string>` - Formatted output

### Must be implemented by subclasses (Formatter API)

##### `getFileExtension()`

Get file extension for this format.

**Returns:** `string` - File extension (e.g., `.md`, `.tex`)

### Must be implemented by subclasses

##### `validate(output)`

Validate formatted output.

**Returns:** `Object` - `{valid: boolean, errors: string[]}`

### Helper Methods

```javascript
// Format LaTeX math for different formats
formatLatex(text, format = 'markdown')

// Escape special characters for markdown
escapeMarkdown(text)

// Escape special characters for LaTeX
escapeLatex(text)

// Process LaTeX math in text
processLatex(text)
```

---

### Creating Custom Formatters

### Example (Formatter API)

```javascript
import { BaseFormatter } from './base.js';

export class MyFormatter extends BaseFormatter {
  format(content, options = {}) {
    const validation = this.validateContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.errors.join(', ')}`);
    }
    return this.buildOutput(content, options);
  }

  getFileExtension() {
    return '.myformat';
  }
}
```

---

### Markdown Formatter

**Location:** `src/teaching/formatters/markdown.js`

#### `MarkdownFormatter`

Formats content as examark-compatible Markdown.

### Format Options (Formatter API)

| Option            | Type    | Default | Description              |
| ----------------- | ------- | ------- | ------------------------ |
| `skipFrontmatter` | boolean | `false` | Skip YAML frontmatter    |
| `includeAnswers`  | boolean | `true`  | Include answer key       |
| `includeMetadata` | boolean | `true`  | Include metadata section |

### Example

```javascript
import { MarkdownFormatter } from './formatters/markdown.js';

const formatter = new MarkdownFormatter();
const markdown = formatter.format(exam, {
  includeAnswers: true,
  skipFrontmatter: false
});
```

---

### Quarto Formatter

**Location:** `src/teaching/formatters/quarto.js`

#### `QuartoFormatter`

Formats content as Quarto document (.qmd). Extends `MarkdownFormatter`.

### Format Options

| Option          | Type   | Default  | Description                   |
| --------------- | ------ | -------- | ----------------------------- |
| `documentClass` | string | `'exam'` | LaTeX document class          |
| `format`        | string | `'pdf'`  | Output format (`pdf`, `html`) |
| `pdfOptions`    | Object | `{}`     | PDF-specific options          |

> **Math Auto-Fix:** The Quarto Notes formatter (`formatLectureNotesAsQuarto` in `src/teaching/formatters/quarto-notes.js`) automatically calls `stripMathBlankLines()` on output to prevent blank lines inside `$$...$$` blocks from breaking PDF rendering. See [LaTeX Validator API](#latex-validator) for details.

---

### LaTeX Formatter

**Location:** `src/teaching/formatters/latex.js`

#### `LaTeXFormatter`

Formats content as LaTeX document using exam class.

### Format Options - Formatter API

| Option          | Type    | Default  | Description        |
| --------------- | ------- | -------- | ------------------ |
| `documentClass` | string  | `'exam'` | Document class     |
| `fontSize`      | string  | `'12pt'` | Font size          |
| `solutions`     | boolean | `false`  | Include solutions  |
| `answers`       | boolean | `true`   | Include answer key |

---

### Examark Formatter

**Location:** `src/teaching/formatters/examark.js`

#### `ExamarkFormatter`

Formats exam content as examark-compatible Markdown. Converts Scholar's JSON exam format into the tag-based format that examark CLI consumes.

**Supported Question Types:** MC, MA, TF, Short, Numeric, Essay, Match, FMB, FIB, Upload (degrades to Essay)

#### `format(content, options)`

Format exam content to examark Markdown.

| Option               | Type    | Default | Description                        |
| -------------------- | ------- | ------- | ---------------------------------- |
| `includeFrontmatter` | boolean | `false` | Include YAML frontmatter block     |
| `includeAnswers`     | boolean | `true`  | Include answer markers in output   |

**Returns:** `string` — Examark-formatted Markdown

#### `validate(markdown)`

Validate examark Markdown output for structural correctness.

**Returns:** `{ valid: boolean, errors: string[] }`

#### `getFileExtension()`

**Returns:** `'.md'`

---

### Canvas QTI Formatter

**Location:** `src/teaching/formatters/canvas.js`

#### `CanvasFormatter` extends `ExamarkFormatter`

Formats exam content as Canvas-compatible QTI package using examark CLI. Handles the full pipeline: JSON → examark Markdown → QTI .zip.

#### `async format(content, options)`

Convert exam content to a Canvas QTI `.zip` package.

| Option        | Type    | Default | Description                                  |
| ------------- | ------- | ------- | -------------------------------------------- |
| `output`      | string  | auto    | Output file path (`.qti.zip`)                |
| `validate`    | boolean | `true`  | Run examark validation after conversion      |
| `cleanupTemp` | boolean | `true`  | Remove temporary files after conversion      |
| `sourceDir`   | string  | `null`  | Source directory for resolving relative paths |

**Returns:** `Promise<string>` — Path to generated QTI zip file

**Requires:** `examark` v0.6.6+ installed and in PATH

#### `async validateQTI(qtiPath)`

Validate a QTI package using `examark verify`. Tolerates "No correct answer defined" warnings from open-ended questions (Essay, Short, Numeric).

**Returns:** `Promise<{ valid: boolean, errors: string[], warnings: string[], output: string }>`

#### `async emulateCanvasImport(qtiPath)`

Simulate Canvas LMS import using `examark emulate-canvas`.

**Returns:** `Promise<{ success: boolean, output: string, error?: string }>`

#### `async validate(output)`

Check if QTI file exists and run examark verification.

**Returns:** `Promise<{ valid: boolean, errors?: string[] }>`

#### `getFileExtension()`

**Returns:** `'.qti.zip'`

---

### Formatter Utilities

**Location:** `src/teaching/formatters/index.js`

#### `getFormatter(format)`

Get formatter instance by format name.

**Supported Formats:** `md`, `markdown`, `canvas`, `qti`, `qmd`, `quarto`, `tex`, `latex`

**Returns:** `BaseFormatter` instance

### Example - Formatter API

```javascript
import { getFormatter } from './formatters/index.js';

const formatter = getFormatter('quarto');
const output = formatter.format(content);
```

#### `getSupportedFormats()`

Get list of supported format names.

**Returns:** `string[]` - Array of format names

#### `isFormatSupported(format)`

Check if a format is supported.

**Returns:** `boolean`

---

### Format Conversion Pipeline

### Typical Workflow

```javascript
// 1. Generate content
const exam = await generateExam({ type: 'midterm', questionCount: 10 });

// 2. Choose formatter
const formatter = getFormatter('quarto');

// 3. Format content
const output = formatter.format(exam.content, {
  format: 'pdf',
  pdfOptions: { toc: false }
});

// 4. Write to file
writeFileSync('exam.qmd', output);

// 5. Compile with Quarto
execSync('quarto render exam.qmd');
```

### Multi-Format Export

```javascript
const formats = ['markdown', 'latex', 'quarto'];

for (const format of formats) {
  const formatter = getFormatter(format);
  const output = formatter.format(exam.content);
  const ext = formatter.getFileExtension();
  writeFileSync(`exam${ext}`, output);
}
```

---

## Slide Parser API (v2.8.0)

The Slide Parser API converts parsed Quarto documents into typed slide objects with classification, filtering, and introspection capabilities.

**Location:** `src/teaching/utils/slide-parser.js`

### `parseSlides(parsedQmd)`

Convert parsed QMD sections into typed slide objects. Only processes level-2 (`##`) sections.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `parsedQmd` | ParsedQmd | Yes | Result from `parseQmdFile()` or `parseQmdContent()` |

**Returns:** `Array<SlideObject>`

```javascript
import { parseQmdFile, parseSlides } from '../teaching/utils/qmd-parser.js';
import { parseSlides as parseSlidesFromParsed } from '../teaching/utils/slide-parser.js';

const parsed = parseQmdFile('slides.qmd');
const slides = parseSlidesFromParsed(parsed);
// slides: Array of SlideObject with types, content, metadata
```

### `parseSlidesFromContent(qmdContent)`

Parse QMD string content directly into slides.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `qmdContent` | string | Yes | QMD document as string |

**Returns:** `Object`

```javascript
{
  slides: Array<SlideObject>,
  parsed: ParsedQmd
}
```

### `parseSlidesFromFile(filePath)`

Parse QMD file from disk into slides.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `filePath` | string | Yes | Path to `.qmd` file |

**Returns:** `Object`

```javascript
{
  slides: Array<SlideObject>,
  parsed: ParsedQmd
}
```

**Example:**

```javascript
import { parseSlidesFromFile } from '../teaching/utils/slide-parser.js';

const { slides, parsed } = await parseSlidesFromFile('content/slides/week03.qmd');
console.log(`Parsed ${slides.length} slides`);
slides.forEach(s => console.log(`${s.number}. [${s.type}] ${s.title}`));
```

### `classifySlideType(section, index, totalSlides)`

Classify slide type using 4-level cascade: CSS classes → heading patterns → content heuristics → default.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `section` | ParsedSection | Yes | Parsed section from QMD |
| `index` | number | Yes | 0-based slide index |
| `totalSlides` | number | Yes | Total number of slides |

**Returns:** `string` — Slide type identifier

**Type Cascade:**

1. **CSS Classes** - Extract from Quarto heading attributes (`.class-name`)
2. **Heading Patterns** - Match patterns like "Agenda", "Summary", "Practice"
3. **Content Heuristics** - Analyze body for code blocks, math, callouts
4. **Default** - Return `'content'` if no match

**Recognized Types:** `title`, `agenda`, `practice`, `worked-example`, `summary`, `callout`, `code`, `content`

### `extractCssClasses(headingLine)`

Extract dot-prefixed class names from Quarto heading attribute blocks.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `headingLine` | string | Yes | Full heading line (e.g., `## Intro {.slide-class}`) |

**Returns:** `string[]` — Array of class names

**Example:**

```javascript
extractCssClasses('## Linear Regression {.worked-example .highlight}');
// ['worked-example', 'highlight']
```

### `filterByType(slides, type)`

Filter slides by type.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Slide array to filter |
| `type` | string | Yes | Type to match |

**Returns:** `Array<SlideObject>`

**Example:**

```javascript
const practiceSlides = filterByType(slides, 'practice');
const examples = filterByType(slides, 'worked-example');
```

### `filterByRange(slides, start, end)`

Filter slides by 1-based range (inclusive).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Slide array to filter |
| `start` | number | Yes | Start slide number (1-based) |
| `end` | number | Yes | End slide number (1-based, inclusive) |

**Returns:** `Array<SlideObject>`

**Example:**

```javascript
const middle = filterByRange(slides, 5, 15);  // Slides 5-15 inclusive
```

### `filterBySection(slides, sectionTitle)`

Filter slides by fuzzy-matched section title.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Slide array to filter |
| `sectionTitle` | string | Yes | Section title to match (fuzzy) |

**Returns:** `Array<SlideObject>`

**Matching:** Uses slug-based fuzzy matching (same as QMD parser).

**Example:**

```javascript
const regressionSlides = filterBySection(slides, 'linear regression');
```

### `getSlideSummary(slides)`

Get summary statistics for slide collection.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Slide array to analyze |

**Returns:**

```javascript
{
  total: number,           // Total slide count
  byType: Object           // { type: count, ... }
}
```

**Example:**

```javascript
const summary = getSlideSummary(slides);
// {
//   total: 42,
//   byType: {
//     content: 25,
//     practice: 8,
//     worked-example: 5,
//     summary: 3,
//     callout: 1
//   }
// }
```

### SlideObject Type Definition

```javascript
{
  number: number,            // 1-based slide number
  type: string,              // Classified type
  title: string,             // Heading text
  sectionTitle: string,      // Parent section title
  startLine: number,         // Start line in source
  endLine: number,           // End line in source
  content: string,           // Full content including heading
  body: string,              // Content without heading
  classes: string[],         // CSS classes
  hasCode: boolean,          // Has code blocks
  hasMath: boolean,          // Has LaTeX math
  headingId: string | null   // Quarto heading ID
}
```

---

## QMD Exam Parser API (v2.16.0)

Parses QMD/Markdown exam files into structured question objects for the Canvas QTI pipeline. Handles 10 question types with automatic type detection, point extraction, and answer key generation.

**Location:** `src/teaching/parsers/qmd-exam.js`

### `parseExamFile(filePath, options)`

Parse a `.qmd` exam file from disk.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `filePath` | string | Yes | Path to `.qmd` or `.md` file |
| `options` | object | No | Parser options (see below) |

**Returns:** Same as `parseExamContent()`

### `parseExamContent(content, options)`

Parse exam content string into structured data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `content` | string | Yes | Raw QMD/Markdown content |
| `options.splitParts` | boolean | No | Split multi-part questions into separate items (default: `true`) |
| `options.defaultType` | string | No | Fallback question type tag (default: `'Essay'`) |

**Returns:**

```javascript
{
  title: string,           // Exam title from H1 heading
  questions: Array<{
    id: string,            // e.g., "q1", "q2a"
    type: string,          // Examark tag: MC, TF, Short, etc.
    text: string,          // Question body text
    points: number,        // Point value
    options: string[],     // Answer choices (MC/MA/TF)
    answer: string,        // Correct answer
    matchPairs: Array<{left, right}>,  // For Match type
    blanks: object,        // For FIB/FMB types
    images: string[],      // Referenced images
    sectionName: string    // Parent section heading
  }>,
  answer_key: object,      // { q1: 'B', q2: 'True', ... }
  total_points: number,    // Sum of all question points
  sections: string[]       // Unique section names
}
```

### Helper Functions

#### `extractPointsFromTitle(title)`

Extract point values from heading text. Supports: `[10 pts]`, `(10 points)`, `10pts`, `{10}`.

**Returns:** `number | null`

#### `extractOptions(body)`

Extract lettered answer choices (a-z) from question body.

**Returns:** `string[]`

#### `extractAnswer(body, options)`

Extract the correct answer marker. Supports: `[x]`, `*`, `**bold**`, `Answer:` line.

**Returns:** `string | null`

#### `extractMatchingPairs(body)`

Extract left/right matching pairs. Supports: `- Left => Right`, `- Left = Right`.

**Returns:** `{ pairs: Array<{left, right}>, remainingText: string } | null`

#### `extractBlanks(body)`

Extract fill-in-blank answers from `[blank1]: answer` patterns.

**Returns:** `object | null` — Map of blank IDs to accepted answers

#### `extractImages(body)`

Extract image references from `![alt](path)` patterns.

**Returns:** `string[]`

#### `extractSubParts(body)`

Extract multi-part sub-questions from `a)`, `(a)`, or `a.` patterns.

**Returns:** `Array<{ id, text }> | null`

---

## Question Type Detector API (v2.16.0)

Classifies parsed question data into one of 10 examark question types. Used when converting `.qmd` exam files (which lack explicit type tags) into examark format.

**Location:** `src/teaching/parsers/question-type-detector.js`

### `detectQuestionType(question)`

Detect the examark question type from question metadata.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `question.type` | string | No | Explicit type override |
| `question.options` | string[] | No | Answer choices |
| `question.answer` | string | No | Correct answer text |
| `question.text` | string | No | Question body |
| `question.matchPairs` | array | No | Matching pairs |
| `question.blanks` | object | No | Blank placeholders |

**Returns:** `string` — Examark tag (`MC`, `MA`, `TF`, `Short`, `Numeric`, `Essay`, `Match`, `FMB`, `FIB`, `Upload`)

**Detection Priority:**

1. Explicit type override (`question.type`)
2. File upload flag
3. Matching pairs present
4. Fill-in-multiple-blanks (2+ blanks)
5. Fill-in-blank (1 blank)
6. True/False (2 options matching T/F pairs)
7. Multiple Answer (multiple `[x]` markers)
8. Multiple Choice (lettered options with answer)
9. Numeric (answer is a number or text contains "calculate")
10. Short Answer (answer under 200 chars)
11. Essay (fallback)

### `typeToTag(type)`

Convert internal type string to examark tag.

**Example:** `'multiple-choice'` → `'MC'`, `'true-false'` → `'TF'`

**Throws:** `Error` for unknown types

### `tagToType(tag)`

Convert examark tag to internal type string.

**Example:** `'MC'` → `'multiple-choice'`, `'TF'` → `'true-false'`

**Throws:** `Error` for unknown tags

---

## Slide Refiner API (v2.8.0)

The Slide Refiner API enables targeted revision of slide decks with AI assistance. Supports instruction-based refinement and automatic analysis modes.

**Location:** `src/teaching/generators/slide-refiner.js`

### `reviseSlides(options)`

Main entry point for slide revision. Supports targeted (instruction-based) and auto-analysis modes.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options.revise` | string | Yes | Path to `.qmd` file |
| `options.instruction` | string | No | Revision instruction text (null = auto-analysis) |
| `options.section` | string | No | Target section title (fuzzy matched) |
| `options.slides` | string | No | Slide range: `"5-12"`, `"5-"`, or `"5"` |
| `options.type` | string | No | Slide type filter |
| `options.dryRun` | boolean | No | Preview only (don't write) |
| `options.debug` | boolean | No | Enable debug logging |

**Returns:** `Promise<Object>`

```javascript
{
  file: string,           // Path to updated file
  mode: 'section' | 'full' | 'targeted' | 'auto',
  slidesAffected: number, // Count of slides affected
  instruction: string,    // Instruction used
  elapsed: number,        // Seconds
  content: string,        // Updated file content
  analysis?: Object       // Analysis results (auto mode)
}
```

**Example (Targeted Revision):**

```javascript
import { reviseSlides } from '../teaching/generators/slide-refiner.js';

const result = await reviseSlides({
  revise: 'content/slides/week03.qmd',
  section: 'Linear Regression',
  instruction: 'Add worked example with tidyverse syntax'
});

console.log(`Revised ${result.slidesAffected} slides in ${result.elapsed}s`);
```

**Example (Auto-Analysis):**

```javascript
const result = await reviseSlides({
  revise: 'content/slides/week03.qmd',
  instruction: null  // Triggers auto-analysis
});

if (result.analysis.findings.length > 0) {
  console.log('Issues found:', result.analysis.findings);
}
```

### `resolveTargets(slides, options)`

Resolve target slides from `--section`, `--slides`, or `--type` options.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | All parsed slides |
| `options` | Object | Yes | Contains `section`, `slides`, or `type` |

**Returns:** `Array<SlideObject>` — Filtered target slides

### `parseSlideRange(rangeStr)`

Parse slide range string into start/end numbers.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `rangeStr` | string | Yes | Range format: `"5-12"`, `"5-"`, or `"5"` |

**Returns:**

```javascript
{
  start: number,  // 1-based start slide
  end: number     // 1-based end slide (Infinity if open-ended)
}
```

**Example:**

```javascript
parseSlideRange('5-12');   // { start: 5, end: 12 }
parseSlideRange('5-');     // { start: 5, end: Infinity }
parseSlideRange('5');      // { start: 5, end: 5 }
```

### `buildContext(slides, targetSlides)`

Build context window for AI revision. Uses full slide list if <30 slides, otherwise targeted + neighbors.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | All parsed slides |
| `targetSlides` | Array<SlideObject> | Yes | Target slides for revision |

**Returns:**

```javascript
{
  context: Array<SlideObject>,  // Slides to include in prompt
  strategy: 'full' | 'targeted' // Strategy used
}
```

### `buildSlideRevisionPrompt(targetSlides, instruction, contextSlides, strategy)`

Build targeted revision prompt for AI.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `targetSlides` | Array<SlideObject> | Yes | Slides being revised |
| `instruction` | string | Yes | Revision instruction |
| `contextSlides` | Array<SlideObject> | Yes | Full context slides |
| `strategy` | string | Yes | Context strategy (`'full'` or `'targeted'`) |

**Returns:** `string` — AI prompt for revision

### `buildFullDeckRevisionPrompt(slides, instruction)`

Build full-deck revision prompt for global changes.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | All parsed slides |
| `instruction` | string | Yes | Revision instruction |

**Returns:** `string` — AI prompt for full revision

### `autoAnalyze(slides, config?)`

Run 7-dimension heuristic analysis (no AI calls).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Slides to analyze |
| `config` | Object | No | Analysis config overrides |

**Returns:** `Array<DimensionResult>`

**7 Analysis Dimensions:**

1. **Density** - Content density per slide (words, code blocks)
2. **Practice Distribution** - Practice vs. content ratio across deck
3. **Style Compliance** - Math notation, code visibility rules
4. **Math Depth** - Mathematical notation depth analysis
5. **Worked Examples** - Presence and quality of worked examples
6. **Content Completeness** - Topic coverage analysis
7. **R Output Interpretation** - Quality of R output explanations

**DimensionResult:**

```javascript
{
  dimension: string,              // e.g., 'density', 'practice-distribution'
  status: 'ok' | 'warn',
  findings: string[],             // Human-readable findings
  slideNumbers: number[]          // Affected slide numbers
}
```

**Example:**

```javascript
const analysis = await autoAnalyze(slides);
analysis.forEach(result => {
  console.log(`${result.dimension}: ${result.status}`);
  console.log(`  Findings: ${result.findings.join('; ')}`);
});
```

### `buildAutoRevisePrompt(slides, analysis, config?)`

Build revision prompt from analysis findings. Returns null if all dimensions pass.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | All parsed slides |
| `analysis` | Array<DimensionResult> | Yes | Analysis results |
| `config` | Object | No | Config overrides |

**Returns:** `string | null` — AI prompt for auto-revision (null if all pass)

---

## Slide Coverage Validator API (v2.8.0)

The Slide Coverage Validator API validates slide decks against lesson plan objectives, structural guidelines, and teaching style compliance.

**Location:** `src/teaching/validators/slide-coverage.js`

### `validateSlideCoverage(slides, lessonPlan)`

Validate objectives coverage via keyword matching.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Parsed slides |
| `lessonPlan` | Object | Yes | Lesson plan with `learning_objectives` |

**Returns:** `CoverageResult`

```javascript
{
  status: 'PASS' | 'WARN' | 'FAIL',
  objectives: CoverageItem[],
  coveragePercent: number  // 0-100
}

// CoverageItem:
{
  id: string,                      // Objective ID (e.g., "LO-1")
  description: string,             // Objective text
  covered: boolean,
  foundInSections: string[]        // Slide titles where found
}
```

**Example:**

```javascript
import { validateSlideCoverage } from '../teaching/validators/slide-coverage.js';

const result = validateSlideCoverage(slides, lessonPlan);
console.log(`Coverage: ${result.coveragePercent}%`);
result.objectives.forEach(obj => {
  const status = obj.covered ? '✓' : '✗';
  console.log(`${status} ${obj.description}`);
});
```

### `validateSlideStructure(slides, config?, durationMinutes?)`

Check slide count, content ratio, and practice ratio against structural guidelines.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Parsed slides |
| `config` | Object | No | Structure config (see defaults) |
| `durationMinutes` | number | No | Lecture duration (overrides default) |

**Returns:** `StructureResult`

```javascript
{
  status: 'PASS' | 'WARN' | 'FAIL',
  issues: StructureIssue[],
  metrics: StructureMetrics
}

// StructureMetrics:
{
  totalSlides: number,
  contentSlides: number,
  practiceSlides: number,
  contentRatio: number,      // 0-1
  practiceRatio: number,     // 0-1
  minutesPerSlide: number
}
```

**Default Config:**

```javascript
{
  content_ratio: 0.70,       // 70% content slides
  practice_ratio: 0.15,      // 15% practice slides
  minutes_per_slide: 2.5,    // 2.5 min per slide
  tolerance: 0.20            // 20% tolerance
}
```

**Example:**

```javascript
const result = validateSlideStructure(slides, undefined, 90);
console.log(`Content ratio: ${(result.metrics.contentRatio * 100).toFixed(1)}%`);
if (result.status !== 'PASS') {
  result.issues.forEach(issue => console.log(`⚠️  ${issue.message}`));
}
```

### `validateSlideStyle(slides, config)`

Check 5 style rules for compliance.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `slides` | Array<SlideObject> | Yes | Parsed slides |
| `config` | Object | Yes | Style config with rules |

**Returns:** `StyleResult`

```javascript
{
  status: 'PASS' | 'WARN' | 'FAIL',
  issues: StyleIssue[],
  strictness: number         // 1-5 (5 = most strict)
}
```

**5 Style Rules:**

1. **math_notation** - Consistent LaTeX notation (inline vs. display)
2. **code_visibility** - Code blocks readable (font size, highlighting)
3. **callout_usage** - Appropriate use of callout blocks
4. **dtslides_classes** - Use of DTSlides CSS classes
5. **hand_calculations** - Presence of hand-worked calculation examples

**Example:**

```javascript
const styleConfig = {
  rules: {
    math_notation: { enabled: true, strict: true },
    code_visibility: { enabled: true },
    callout_usage: { enabled: true },
    dtslides_classes: { enabled: false },
    hand_calculations: { enabled: true }
  }
};

const result = validateSlideStyle(slides, styleConfig);
console.log(`Style status: ${result.status}`);
```

### `formatSlideCheckReport(results, filePath, planTitle)`

Format validation results as human-readable terminal report.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `results` | Object | Yes | Combined validation results |
| `filePath` | string | Yes | Path to slide file |
| `planTitle` | string | Yes | Lesson plan title |

**Returns:** `string` — Formatted terminal report (ANSI colors)

### `formatSlideCheckJson(results)`

Format validation results as machine-readable JSON.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `results` | Object | Yes | Combined validation results |

**Returns:** `Object` — Structured JSON output

### `generateReviseCommands(results, filePath)`

Generate actionable `--revise` commands based on validation findings.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `results` | Object | Yes | Validation results |
| `filePath` | string | Yes | Path to slide file |

**Returns:** `string[]` — Array of suggested revision commands

**Example:**

```javascript
const commands = generateReviseCommands(results, 'slides.qmd');
console.log('Suggested revisions:');
commands.forEach(cmd => console.log(`  scholar revise ${cmd}`));
```

### `validateSlideCheck(options)`

Main entry point running all 3 validation layers (coverage, structure, style).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options.check` | string | Yes | Path to `.qmd` file |
| `options.fromPlan` | string | Yes | Lesson plan ID (e.g., `"week03"`) |
| `options.courseRoot` | string | No | Course root (default: cwd) |
| `options.json` | boolean | No | Output JSON format |
| `options.debug` | boolean | No | Enable debug logging |

**Returns:** `Object`

```javascript
{
  coverage: CoverageResult,
  structure: StructureResult,
  style: StyleResult,
  overall: 'PASS' | 'WARN' | 'FAIL',
  planTitle: string,
  filePath: string
}
```

**Example:**

```javascript
import { validateSlideCheck } from '../teaching/validators/slide-coverage.js';

const results = await validateSlideCheck({
  check: 'content/slides/week03.qmd',
  fromPlan: 'week03'
});

const report = formatSlideCheckReport(results, results.filePath, results.planTitle);
console.log(report);
```

---

## Discovery Engine API (v2.12.0)

The Discovery Engine scans command `.md` files, parses YAML frontmatter and Options sections, and caches structured metadata for the Scholar Hub.

**Location:** `src/discovery/index.js`

### Type Definitions

```typescript
interface Flag {
  name: string;           // Flag name, e.g. "--questions", "-i"
  short: string | null;   // Alias, e.g. "-q", "--instructions"
  description: string;    // Human-readable description
  takesValue: boolean;    // true if flag accepts VALUE, "text", or @file
}

interface CommandMetadata {
  name: string;           // Frontmatter name, e.g. "teaching:exam"
  description: string;    // One-line description
  category: 'research' | 'teaching';
  subcategory: string;    // e.g. "planning", "content", "config"
  directory: string;      // Parent dir name, e.g. "teaching"
  file: string;           // Relative path from project root
  usage: string | null;   // Extracted usage pattern
  examples: string[];     // Up to 2 example invocations
  flags: Flag[];          // Parsed flags from **Options:** section
  hasInstructions: boolean; // true if command supports -i/--instructions
}
```

### `discoverCommands()`

Scan all `.md` command files, parse frontmatter and flags, return structured data.

**Returns:** `CommandMetadata[]` — Sorted by category then name.

```javascript
import { discoverCommands } from './src/discovery/index.js';

const commands = discoverCommands();
// 30 command objects with flags and hasInstructions
```

### `loadCachedCommands()`

Return cached command data if fresh, otherwise regenerate and persist to `src/discovery/cache.json`.

**Returns:** `CommandMetadata[]`

Cache is invalidated when:
- Cache file doesn't exist
- `CACHE_VERSION` doesn't match (currently `2`)
- Number of `.md` files has changed
- Any `.md` file has been modified since cache was written

### `getCommandStats()`

**Returns:** `{ research: number, teaching: number, total: number }`

### `getCategoryInfo(category)`

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `category` | `'research' \| 'teaching'` | Yes | Top-level category |

**Returns:** `Object<string, CommandMetadata[]>` — Map of subcategory to command array.

### `getCommandDetail(commandName)`

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `commandName` | string | Yes | Full name (`research:analysis-plan`), base name (`exam`), or partial match |

**Returns:** `CommandMetadata | null`

Matching priority: exact frontmatter name > last segment match > partial/fuzzy match.

### `extractFlags(body)` (internal)

Parse `**Options:**` sections from markdown body into structured flag objects.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `body` | string | Yes | Markdown body (after frontmatter) |

**Returns:** `Flag[]`

**Parsing rules:**
- Matches lines in format: `- \`--name VALUE\` / \`-s\` - Description`
- The `/` separator and short alias are optional
- `takesValue` is `true` when the flag name is followed by `[A-Z"@]` (uppercase word, quote, or `@`)
- Flag names are extracted by stripping everything after the first space

**Example input:**

```markdown
**Options:**
- `-i "text"` / `--instructions "text"` - Custom instructions for AI generation
- `--questions N` / `-q` - Number of questions to generate
- `--solution` - Include answer key
```

**Example output:**

```javascript
[
  { name: '-i', short: '--instructions', description: 'Custom instructions for AI generation', takesValue: true },
  { name: '--questions', short: '-q', description: 'Number of questions to generate', takesValue: true },
  { name: '--solution', short: null, description: 'Include answer key', takesValue: false }
]
```

---

## Validate Pipeline API (v2.15.0)

**Module:** `src/teaching/utils/validate-pipeline.js`

### `validatePipeline({ filepath, language, debug })`

High-level orchestrator for R code validation in .qmd files.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| filepath | string | required | Path to .qmd file |
| language | string | 'r' | Language to validate (only 'r' supported) |
| debug | boolean | false | Enable debug output |

**Returns:**

```javascript
{
  passed: number,    // Chunks that passed validation
  failed: number,    // Chunks that failed
  skipped: number,   // Chunks skipped (eval: false)
  details: [{
    chunk: string,   // Chunk label
    status: string,  // 'pass', 'fail', 'skip'
    output: string,  // Actual R output
    expected: string // Expected output from .qmd
  }],
  report: string     // Human-readable summary
}
```

**Dependencies:** Wraps `extractRChunks()`, `buildValidationScript()`, `parseValidationOutput()` from `src/teaching/validators/r-code.js`.

---

## Preflight API (v2.15.0)

**Module:** `src/teaching/validators/preflight.js`

### Exported Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `checkVersionSync()` | CheckResult | Compare versions across 3 files |
| `checkConflictMarkers()` | CheckResult | Scan for merge conflict markers |
| `checkTestCounts()` | CheckResult | Verify test counts in mkdocs.yml |
| `checkCacheCleanup()` | CheckResult | Check for stale discovery cache |
| `checkChangelog()` | CheckResult | Validate changelog version |
| `checkStatusFile()` | CheckResult | Check .STATUS freshness |
| `runAllChecks(options)` | AggregateResult | Run all checks with optional fix |

### CheckResult Type

```javascript
{
  name: string,          // e.g., 'version-sync'
  status: 'pass'|'warn'|'fail',
  detail: string,        // Human-readable description
  fixable: boolean       // Whether --fix can address this
}
```

---

## Canvas Preflight API (v2.17.0)

Validates exam questions for Canvas LMS import compatibility. Used by both `/teaching:canvas` (QMD-parsed data) and `/teaching:exam --format canvas` (AI-generated JSON).

**Module:** `src/teaching/validators/canvas-preflight.js`

**Exported from:** `src/teaching/validators/index.js`

### `runCanvasPreflightValidation(questions, answerKey)`

Validates an array of exam questions against Canvas LMS requirements.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `questions` | `Array` | Yes | Question objects with `id`, `type`, and optionally `blanks` |
| `answerKey` | `Object` | Yes | Map of question ID → answer (string, string[], or object for FMB) |

**Returns:** `{ errors: string[], warnings: string[] }`

| Property | Type | Description |
|----------|------|-------------|
| `errors` | `string[]` | Blocking issues — conversion should be aborted |
| `warnings` | `string[]` | Non-blocking notes (e.g. short-answer will be manually graded) |

**Validation Rules:**

| Question Type | Rule | Severity |
|---------------|------|----------|
| `multiple-choice` | Must have a correct answer in `answerKey` | Error |
| `true-false` | Must have a correct answer in `answerKey` | Error |
| `multiple-answers` | Must have 2+ correct answers (array) | Error |
| `short-answer` | Warning if no sample answer (manually graded) | Warning |
| `fill-in-blank` | Warning if no sample answer (manually graded) | Warning |
| `fill-in-multiple-blanks` | All blank IDs must have defined answers | Error |
| `essay`, `numerical`, etc. | No Canvas-specific constraints | — |

**Usage:**

```javascript
import { runCanvasPreflightValidation } from '../../../teaching/validators/canvas-preflight.js';

// From QMD-parsed exam (canvas.md):
const { errors, warnings } = runCanvasPreflightValidation(
  exam.questions,
  exam.answer_key
);

// From AI-generated exam (exam.md --format canvas):
const { errors, warnings } = runCanvasPreflightValidation(
  exam.content.questions,
  exam.content.answer_key
);

warnings.forEach(w => console.log(`⚠️  ${w}`));
if (errors.length > 0) {
  errors.forEach(e => console.log(`❌ ${e}`));
  process.exit(1);
}
```

**Design Notes:**

- Both data sources (QMD parser and AI generator) use hyphen-separated type names (`multiple-choice`, not `multiple_choice`) and store answers in an `answer_key` object — the validator is data-source-agnostic
- `multiple-answers` answer coercion: a single string is treated as an array of length 1, which always triggers an error (Canvas requires 2+)
- `fill-in-multiple-blanks` blank detection uses `q.blanks[].blankId` matching against `answerKey[q.id]` (object keyed by blank ID)

---

## Send Output API (v2.15.0)

**Module:** `src/teaching/utils/send-output.js`

### `resolveRecipient(options, config)`

Resolves email recipient from command options and teach-config.

**Priority:** Explicit `--send email@` > `course.staff.ta_email` > `course_info.instructor_email`

### `formatEmail(contentType, content, options)`

Formats generated content as email.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| contentType | string | 'solution', 'assignment', 'exam', 'quiz', 'rubric' |
| content | object | Generated content object |
| options | object | Command options (courseCode, topic, etc.) |

**Returns:** `{ subject: string, body: string }`

### `buildSendInstructions(email)`

Returns formatted instructions for Claude to preview and send via himalaya MCP.

---

## Smart Help API (v2.12.0)

Context-aware command suggestions based on filesystem signals.

**Location:** `src/discovery/smart-help.js`

### `detectContext(cwd)`

Scan working directory for teaching and research indicators.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `cwd` | string | Yes | Working directory to analyze |

**Returns:** `'research' | 'teaching' | 'mixed'`

### `getSuggestions(context)`

Get top 5 suggested commands for a detected context.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `context` | `'research' \| 'teaching' \| 'mixed'` | Yes | Detected context |

**Returns:** `Array<{ command: string, description: string, tip?: string }>`

Teaching suggestions include a `tip` property (e.g., `"Use -i for custom instructions"`).

### `getAutoTip(context)`

Generate a formatted auto-tip string for first-use suggestion.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `context` | `'research' \| 'teaching' \| 'mixed'` | Yes | Detected context |

**Returns:** `string` — Formatted tip. Teaching tips now mention `-i` flag.

---
