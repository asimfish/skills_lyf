# Schema & Template Conventions

How Scholar's JSON Schemas and content templates are structured, authored, and consumed. For user-facing schema documentation, see [Configuration Reference](../CONFIGURATION.md).

---

## Schemas vs Templates

Scholar has two distinct validation layers:

| Layer | Location | Purpose | Count |
|-------|----------|---------|-------|
| **Schemas** | `src/teaching/schemas/v2/*.schema.json` | Validate YAML configuration files | 3 |
| **Templates** | `src/teaching/templates/*.json` | Define structure of generated content | 7 |

**Schemas** validate what instructors *write* (lesson plans, teaching style, manifests).
**Templates** validate what Scholar *generates* (exams, quizzes, lectures, assignments, syllabi).

---

## JSON Schemas (v2)

### Available Schemas

| Schema | File | Validates |
|--------|------|-----------|
| Lesson Plan | `lesson-plan.schema.json` | Weekly lesson plan YAML files |
| Teaching Style | `teaching-style.schema.json` | `.flow/teaching-style.yml` |
| Lesson Plans Manifest | `lesson-plans-manifest.schema.json` | `.flow/lesson-plans.yml` |

### Authoring Rules

1. **Use JSON Schema Draft-07.** All schemas set `"$schema": "http://json-schema.org/draft-07/schema#"`.

2. **Set a `$id` URL.** Use the pattern: `https://scholar.anthropic.com/schemas/v2/<name>.schema.json`

3. **Required fields are explicit.** Always define `"required"` arrays at each object level. Don't rely on consumers knowing which fields matter.

4. **Use `definitions` for reusable types.** Complex object types (learningObjective, topic, reading, activity) are defined in `"definitions"` and referenced with `"$ref"`.

5. **ID patterns use regex.** Learning objectives are `LO-N.N`, topics are `T-N.N`, activities are `A-N.N`. Enforce with `"pattern"` in the schema.

6. **Enums for controlled vocabularies.** Bloom's taxonomy levels, activity types, assessment types, lecture segment types — all use `"enum"`.

7. **IEEE LOM alignment.** Lesson plan properties include `"description"` fields that reference IEEE LOM categories (e.g., `Educational.LearningResourceType`).

### Schema Index Module

`src/teaching/schemas/v2/index.js` provides the programmatic API:

```javascript
import { getSchema, listSchemas, exportSchema } from '@data-wise/scholar/schemas';

// Get a schema (returns deep clone to prevent mutation)
const schema = getSchema('lesson-plan');

// List available schemas
listSchemas(); // ['lesson-plan', 'teaching-style', 'lesson-plans-manifest']

// Export as JSON string
const json = exportSchema('lesson-plans-manifest', { pretty: true });
```

**Key design decisions:**

- Schemas are **lazy-loaded** to avoid startup overhead
- `getSchema()` returns a **deep clone** to prevent cross-test pollution when multiple AJV instances share a schema
- `resetCache()` is provided for testing only

### Package.json Exports

External consumers (e.g., flow-cli) import schemas directly:

```json
{
  "exports": {
    "./schemas": "./src/teaching/schemas/v2/index.js",
    "./schemas/lesson-plan": "./src/teaching/schemas/v2/lesson-plan.schema.json",
    "./schemas/teaching-style": "./src/teaching/schemas/v2/teaching-style.schema.json",
    "./schemas/lesson-plans-manifest": "./src/teaching/schemas/v2/lesson-plans-manifest.schema.json"
  }
}
```

**Rule:** When changing a schema in a breaking way, bump the **major** version.

---

## Content Templates

### Available Templates

| Template | File | Used By |
|----------|------|---------|
| Base | `base.json` | All content types (inherited) |
| Exam | `exam.json` | `/teaching:exam` |
| Quiz | `quiz.json` | `/teaching:quiz` |
| Lecture | `lecture.json` | `/teaching:lecture` |
| Lecture Notes | `lecture-notes.json` | `/teaching:lecture` (notes variant) |
| Assignment | `assignment.json` | `/teaching:assignment` |
| Syllabus | `syllabus.json` | `/teaching:syllabus` |

### Template Inheritance

All templates inherit from `base.json`, which defines common fields:

- `schema_version` — Template schema version (currently `"1.0"`)
- `template_type` — Enum: `exam`, `quiz`, `lecture`, `assignment`, `syllabus`
- `metadata` — Title, course, course_code, date, author
- `generated_by` — Tool name, version, timestamp, model (auto-populated)

Specific templates extend the base with content-type-specific properties (questions for exams, sections for lectures, etc.).

### Authoring Rules for Templates

1. **Always include `generated_by`.** The `tool`, `version`, `timestamp`, and `model` fields are auto-populated by Scholar at generation time. Mark these with `"auto": true`.

2. **Metadata sourced from config.** Fields like `course` and `author` are marked with `"source": "config"` to indicate they come from `.flow/teach-config.yml`, not user input.

3. **Date defaults to `"auto"`.** The `date` field uses `"default": "auto"` which Scholar replaces with today's date at generation time.

4. **Schema version is const.** `"schema_version": { "const": "1.0" }` ensures all generated content declares its template version.

---

## Validator Engine

The `ValidatorEngine` class (`src/teaching/validators/engine.js`) orchestrates validation:

1. **Load schema** from `schemas/v2/` (for YAML config) or `templates/` (for generated content)
2. **Compile** with AJV (ajv + ajv-keywords + ajv-formats)
3. **Validate** input data against schema
4. **Return** `{ isValid, errors, warnings }`

### Adding a New Schema

1. Create `src/teaching/schemas/v2/<name>.schema.json`
2. Follow Draft-07 with `$id` and `$schema`
3. Add getter function in `src/teaching/schemas/v2/index.js`
4. Add to `listSchemas()` return array
5. Add `package.json` export entry
6. Add validation test in `tests/teaching/`
7. Update this document

### Adding a New Template

1. Create `src/teaching/templates/<name>.json`
2. Include all `base.json` fields plus type-specific properties
3. Set `template_type` enum value
4. Add to the command handler's template loader
5. Add format-specific tests
6. Update this document
