---
render_macros: false
---

# What's New in Scholar v2.4.0

**Release Date:** 2026-01-28
**Focus:** Custom Prompt Discovery & Template System
**Tests:** 1,598 passing (+207 from v2.3.1)

---

## Overview

Scholar v2.4.0 introduces the **Prompt Discovery System**, enabling you to customize AI-generated teaching content by providing your own prompt templates. The system auto-discovers prompts from your course project and merges them with your teaching style configuration.

### Key Features

- **Custom Prompts** - Define your own AI prompts in `.flow/templates/prompts/`
- **Template Syntax** - Variables (`{{topic}}`), conditionals (`{{#if graduate}}`)
- **Style Integration** - 4-layer teaching style automatically merged into prompts
- **Version Checking** - Compatibility warnings with actionable suggestions
- **Graceful Fallback** - Works without custom prompts (uses built-in defaults)

---

## New Components

### PromptLoader

Discovers and loads prompt templates from your project or plugin defaults.

```javascript
// Resolution order:
// 1. .flow/templates/prompts/{type}.md  ← Your project
// 2. Plugin defaults                     ← Scholar built-in
// 3. Legacy prompts                      ← Fallback

const prompt = await PromptLoader.load('lecture-notes', courseRoot);
// => { body: "...", metadata: { prompt_version: "2.4" }, source: "project" }
```

**Features:**

- YAML frontmatter parsing
- Version compatibility checking
- Automatic fallback to defaults

### PromptBuilder

Renders templates with variable substitution and conditional logic.

```javascript
const rendered = PromptBuilder.build(template, {
  topic: 'ANOVA',
  course_level: 'graduate',
  has_lesson_plan: true,
  learning_objectives: ['LO1', 'LO2', 'LO3']
});
```

**Template Syntax:**

| Syntax | Example | Description |
|--------|---------|-------------|
| `{{var}}` | `{{topic}}` | Simple substitution |
| `{{obj.path}}` | `{{course.name}}` | Nested path |
| `{{#if cond}}` | `{{#if has_data}}` | Conditional block |
| `{{else}}` | | Else clause |
| `{{/if}}` | | End conditional |
| `{{#if x == "y"}}` | `{{#if level == "graduate"}}` | Equality check |
| `{{#if x != "y"}}` | `{{#if mode != "debug"}}` | Inequality check |

### PromptConfigBridge

Orchestrates config, teaching style, and prompt loading together.

```javascript
const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
  startDir: '/path/to/course',
  args: { topic: 'Linear Regression', level: 'undergraduate' },
  debug: true
});

console.log(result.rendered);    // The fully rendered prompt
console.log(result.prompt.source); // "project" or "default"
console.log(result.warnings);    // Version warnings, if any
```

---

## Default Templates

Four built-in prompt templates are included:

| Template | Lines | Purpose |
|----------|-------|---------|
| `lecture-notes.md` | 244 | Comprehensive lecture generation |
| `lecture-outline.md` | 113 | Outline generation (8-12 sections) |
| `section-content.md` | 254 | Section-by-section content |
| `quiz.md` | 64 | Quiz question generation |

These are used when no custom prompt is found. You can override any of them by creating a matching file in `.flow/templates/prompts/`.

---

## Teaching Style Integration

Your teaching style configuration is automatically merged into prompt variables.

### 4-Layer Merge System

```
Layer 1 (Global)     ~/.claude/CLAUDE.md
         ↓
Layer 2 (Course)     .claude/teaching-style.local.md
         ↓
Layer 3 (Command)    command_overrides.lecture
         ↓
Layer 4 (Lesson)     lesson-plan.yml teaching_style_overrides
```

### Variable Priority

When the same variable exists in multiple sources:

```
1. Command args        ← Highest priority
2. Lesson plan
3. Teaching style
4. Config values
5. Defaults            ← Lowest priority
```

### Example

Your `teach-config.yml`:

```yaml
teaching_style:
  pedagogical_approach:
    primary: "problem-based"
  explanation_style:
    proof_style: "rigorous-with-intuition"
```

Your prompt template:

```markdown
{{#if pedagogical_approach == "problem-based"}}
Start with a motivating problem before theory.
{{/if}}

Proof style: {{proof_style}}
```

---

## Usage Examples

### Basic Usage (No Custom Prompts)

Works exactly like before - no changes needed:

```bash
claude "/teaching:lecture 'ANOVA'"
```

### With Custom Prompt

1. Create `.flow/templates/prompts/lecture-notes.md`:

```markdown
---
prompt_version: "2.4"
prompt_type: "lecture-notes"
---

# {{topic}}

Level: {{course_level}}
Style: {{pedagogical_approach}}

[Your custom instructions here]
```

1. Generate:

```bash
claude "/teaching:lecture 'ANOVA' --verbose"
```

Output:

```
📄 Using prompt: .flow/templates/prompts/lecture-notes.md
   Version: 2.4
   Source: project
```

### With stat-545 Course

The stat-545 course already has custom prompts ready:

```bash
cd ~/projects/teaching/stat-545
claude "/teaching:lecture 'One-Way ANOVA' --from-plan=week03"
```

---

## Debugging

### Verbose Mode

See which prompt is used:

```bash
claude "/teaching:lecture 'Topic' --verbose"
```

### Debug Mode

Full variable and config dump:

```bash
claude "/teaching:lecture 'Topic' --debug"
```

### Common Warnings

**"Prompt version X is older than Scholar vY"**

- Your prompt was written for an older version
- Update `prompt_version` in frontmatter
- Or run `teach templates update`

**"Using legacy built-in prompt"**

- No custom prompt found (this is OK)
- Scholar uses defaults from `lecture-prompts.js`

---

## Testing

### New Tests Added

| Category | Count | Focus |
|----------|-------|-------|
| PromptLoader | 41 | Discovery, parsing, version |
| PromptBuilder | 75 | Variables, conditionals, edge cases |
| stat-545 Integration | 22 | Real course validation |
| Fixtures | 5 | Edge case templates |
| **Total** | **207** | |

### Running Tests

```bash
# All prompt tests
npm test -- --testPathPattern="prompt"

# stat-545 integration
npm test -- --testPathPattern="stat-545"
```

---

## Breaking Changes

**None.** This release is fully backward compatible:

- Existing `/teaching:lecture` usage works unchanged
- Custom prompts are optional
- Legacy `lecture-prompts.js` still functions as fallback
- No configuration changes required

---

## Migration Guide

**No migration needed.** To start using custom prompts:

1. Create `.flow/templates/prompts/` directory
2. Add your custom prompt file(s)
3. Scholar auto-discovers them

That's it. Your existing content generation continues to work.

---

## Known Limitations

1. **One prompt per type** - Can't have multiple variants of the same prompt type
2. **Simple conditionals** - Only `{{#if}}` supported, no `{{#each}}` loops
3. **No external APIs** - Variables come from style/config only
4. **Frontmatter required** - Templates without YAML frontmatter may fail

---

## Files Changed

| Component | File | Lines |
|-----------|------|-------|
| PromptLoader | `src/teaching/ai/prompt-loader.js` | +387 |
| PromptBuilder | `src/teaching/ai/prompt-builder.js` | +493 |
| PromptConfigBridge | `src/teaching/ai/prompt-config-bridge.js` | +485 |
| Default Templates | `src/teaching/ai/prompts/default/` | +675 |
| Integration | `src/teaching/generators/lecture-notes.js` | +91 |
| Tests | `tests/` | +1,600 |
| **Total** | | **+3,842** |

---

## References

- **Issue:** [#29](https://github.com/Data-Wise/scholar/issues/29)
- **PR:** [#31](https://github.com/Data-Wise/scholar/pull/31)
- **Commit:** `2af8f28`
- **Design:** archived (see git history)

---

## See Also

- [Prompt Customization Guide](PROMPT-CUSTOMIZATION-GUIDE.md) - How to create custom prompts
- [Teaching Style Guide](TEACHING-STYLE-GUIDE.md) - Configure teaching preferences
- [API Reference](API-REFERENCE.md) - PromptLoader/Builder/Bridge APIs
- [CHANGELOG](https://github.com/Data-Wise/scholar/blob/main/CHANGELOG.md) - Full release notes
