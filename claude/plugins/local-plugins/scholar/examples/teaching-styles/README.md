# Teaching Style Examples

This directory contains example teaching style configurations for the Scholar plugin's 4-layer teaching style system.

## What is a Teaching Style?

A teaching style configuration controls how Scholar generates course content:

- **Pedagogical approach** (problem-based, lecture-based, flipped)
- **Explanation style** (proof-first, intuition-first, rigorous-with-intuition)
- **Assessment philosophy** (formative, summative, balanced)
- **Content preferences** (R packages, notation, visualization)
- **Command overrides** (lecture length, slide count, quiz format)

## 4-Layer System

| Layer | Location | Scope |
|-------|----------|-------|
| 1. Global | `~/.claude/CLAUDE.md` | All courses |
| 2. Course | `.claude/teaching-style.local.md` | Single course |
| 3. Command | `command_overrides` in course file | Specific commands |
| 4. Lesson | `teaching_style_overrides` in lesson plan | Single lesson |

Lower layers override higher layers for specific settings.

## Available Examples

| File | Course Type | Key Features |
|------|-------------|--------------|
| `stat545-anova-experimental-design.md` | Graduate ANOVA | Rigorous proofs, cross-listing, full R integration |

## Using These Examples

1. **Copy** the example to your course repository:
   ```bash
   cp stat545-anova-experimental-design.md /path/to/course/.claude/teaching-style.local.md
   ```

2. **Modify** settings to match your course:
   - Update course codes and names
   - Adjust pedagogical approach
   - Select appropriate R packages
   - Configure command overrides

3. **Generate content** with Scholar commands:
   ```bash
   /teaching:lecture "Your Topic"
   /teaching:slides "Your Topic" 75
   /teaching:exam "Midterm"
   ```

## Contributing Examples

To add a new example:

1. Create a `.md` file with YAML frontmatter containing `teaching_style:`
2. Include comprehensive settings for your course type
3. Add markdown documentation explaining key features
4. Submit a PR with the example

### Naming Convention

`{course-code}-{topic-area}.md`

Examples:
- `stat440-regression.md`
- `intro-stats-undergraduate.md`
- `bayesian-methods-graduate.md`
- `machine-learning-applied.md`

## Schema Reference

See the full schema in:
- `src/teaching/config/style-loader.js`

## Testing Your Configuration

Validate YAML syntax:

```bash
python3 -c "
import yaml
with open('.claude/teaching-style.local.md') as f:
    content = f.read()
parts = content.split('---')
data = yaml.safe_load(parts[1])
print('Valid!' if 'teaching_style' in data else 'Missing teaching_style key')
"
```

Test with dry-run:

```bash
/teaching:lecture "Test Topic" --dry-run
```

Should show 10+ sections and estimate page count matching your configuration.
