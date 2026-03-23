---
render_macros: false
---

# Prompt Authoring Guide

How to write and maintain Scholar's prompt templates. This covers the internal authoring conventions — for user-facing customization, see [Prompt Customization Guide](../PROMPT-CUSTOMIZATION-GUIDE.md).

---

## Two Prompt Systems

Scholar uses two complementary prompt systems:

| System | Location | Use Case | Customizable by Users? |
|--------|----------|----------|----------------------|
| **Markdown templates** | `src/teaching/ai/prompts/default/*.md` | Structured prompts with variables | Yes (via `.flow/templates/prompts/`) |
| **Programmatic builders** | Inline in `src/teaching/commands/*.js` | Complex multi-step generation | No |

### When to Use Which

- **Markdown templates** for prompts that users might want to customize: tone, style, structure, question types
- **Programmatic builders** for prompts that involve dynamic logic: multi-pass generation, context aggregation, conditional API calls

---

## Markdown Template Format

### File Structure

```
src/teaching/ai/prompts/default/
├── lecture-notes.md      # Full lecture notes generation
├── lecture-outline.md    # Structured outline (JSON output)
├── quiz.md               # Quiz/formative assessment
└── section-content.md    # Individual lecture section
```

### YAML Frontmatter Schema

Every `.md` prompt template starts with YAML frontmatter:

```yaml
---
prompt_version: "2.0"                    # Schema version (always "2.0" for current)
prompt_type: "lecture-notes"             # Unique identifier for this prompt
prompt_description: "..."                # Human-readable description
target_template: "content/lecture.qmd"   # What this prompt generates
author: "Scholar"                        # Author
last_updated: "2026-01-28"              # ISO date of last edit
min_scholar_version: "2.0.0"            # Minimum Scholar version (optional)
variables:
  required:                              # Variables that MUST be provided
    - topic
    - course_level
    - field
  optional:                              # Variables that MAY be provided
    - course_code
    - course_name
    - pages
    - tone
    - pedagogical_approach
---
```

**Required frontmatter fields:** `prompt_version`, `prompt_type`, `variables.required`

**Optional frontmatter fields:** `prompt_description`, `target_template`, `author`, `last_updated`, `min_scholar_version`, `variables.optional`

### Handlebars-Lite Syntax

Templates use a subset of Handlebars syntax:

| Syntax | Purpose | Example |
|--------|---------|---------|
| `{{variable}}` | Insert variable value | `{{topic}}` |
| `{{#if variable}}...{{/if}}` | Conditional block | `{{#if course_code}}Course: {{course_code}}{{/if}}` |
| `{{#if var == "value"}}...{{/if}}` | Equality check | `{{#if tone == "formal"}}Use formal language{{/if}}` |
| `{{else}}` | Else branch in conditional | `{{#if has_plan}}...{{else}}Generate objectives{{/if}}` |

**Not supported:** `{{#each}}`, `{{> partial}}`, nested helpers, custom helpers.

### Writing Effective Templates

1. **Required variables first.** Start the prompt body with required context (topic, level, field).
2. **Conditional sections for optional variables.** Wrap all optional content in `{{#if}}` blocks.
3. **Explicit instructions per course level.** Use `{{#if course_level == "undergraduate"}}` to tailor depth.
4. **Output format at the end.** Specify the expected response format (Quarto markdown, JSON, etc.) at the bottom of the template.
5. **IMPORTANT blocks for critical constraints.** Use `IMPORTANT:` prefix for rules the AI must not violate.

### Variable Resolution Order

When a template is rendered, variables are resolved in this order:

1. **Command-line flags** (e.g., `--topic "ANOVA"`)
2. **`.flow/teach-config.yml`** course_info and defaults
3. **`.flow/teaching-style.yml`** style preferences
4. **Template defaults** (hardcoded in the `.md` file)

---

## User Override Mechanism

Users can override default templates by placing files in:

```
.flow/templates/prompts/<prompt_type>.md
```

The resolution order is:

1. `.flow/templates/prompts/<prompt_type>.md` (user override)
2. `src/teaching/ai/prompts/default/<prompt_type>.md` (plugin default)

Overrides must use the same YAML frontmatter schema and variable names. The `prompt_version` field enables version compatibility checking.

---

## Adding a New Prompt Template

1. Create `src/teaching/ai/prompts/default/<name>.md`
2. Add YAML frontmatter with all required fields
3. Define required and optional variables
4. Write the prompt body using Handlebars-lite syntax
5. Document the template in this file (update the file structure table above)
6. Add tests in `tests/teaching/` to verify variable substitution
7. Update [Prompt Customization Guide](../PROMPT-CUSTOMIZATION-GUIDE.md) if users can override it

---

## Existing Templates Reference

### `lecture-notes.md`

- **Purpose:** Generate comprehensive instructor-facing lecture notes
- **Output:** Quarto markdown (`.qmd`)
- **Key variables:** `topic`, `course_level`, `field`, `tone`, `pedagogical_approach`, `explanation_style`, `proof_style`, `notation_*`
- **Notable:** Largest template (~245 lines), handles undergraduate/graduate/cross-listed levels, 4 tone modes, 4 pedagogical approaches

### `lecture-outline.md`

- **Purpose:** Generate structured JSON outline before full content generation
- **Output:** JSON with sections array
- **Key variables:** `topic`, `course_level`, `field`, `language`
- **Notable:** Output is parsed as JSON and fed into `section-content.md` for each section

### `section-content.md`

- **Purpose:** Generate content for a single lecture section
- **Output:** JSON with content, code, problems depending on section type
- **Key variables:** `section_id`, `section_type`, `section_title`, `previous_context`
- **Notable:** 10 section types with type-specific requirements (introduction, concept, definition, theorem, proof, example, code, practice, discussion, summary)

### `quiz.md`

- **Purpose:** Generate formative assessment quiz
- **Output:** Markdown
- **Key variables:** `topic`, `course_level`, `num_questions`, `question_types`, `difficulty`
- **Notable:** Simplest template (~65 lines), good reference for new template authors
