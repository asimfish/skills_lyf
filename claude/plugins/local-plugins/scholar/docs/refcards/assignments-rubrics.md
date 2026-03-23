# Assignments & Rubrics - Quick Reference Card

## TL;DR (30 seconds)

- Generate complete assignment: `/teaching:assignment "topic"`
- Student version (no solutions): `/teaching:assignment "topic" --no-solutions`
- Standalone solution key: `/teaching:solution assignments/hw3.qmd`
- Standalone rubric: `/teaching:rubric "assignment" 100`

## Quick Command Reference

| Command | Output | Example |
|---------|--------|---------|
| `/teaching:assignment "topic"` | Problems + Solutions + Rubric | `/teaching:assignment "Linear Regression"` |
| `... --no-solutions` | Problems + Rubric only | `/teaching:assignment "ANOVA" --no-solutions` |
| `... --no-rubric` | Problems + Solutions only | `/teaching:assignment "t-test" --no-rubric` |
| `... --no-solutions --no-rubric` | Problems only | `/teaching:assignment "regression" --no-solutions --no-rubric` |
| `/teaching:rubric "name" N` | Rubric for N points | `/teaching:rubric "homework" 100` |

## Common Flags

| Flag | Effect | Example |
|------|--------|---------|
| `--problems N` | Number of problems | `--problems 8` |
| `--points N` | Total points | `--points 150` |
| `--difficulty LEVEL` | Difficulty level | `--difficulty advanced` |
| `--no-solutions` | Exclude solution key | `/teaching:assignment "topic" --no-solutions` |
| `--no-rubric` | Exclude grading rubric | `/teaching:assignment "topic" --no-rubric` |
| `--include-code` | Add programming problems | `--include-code --language R` |
| `--dry-run` | Preview without API | `/teaching:assignment "topic" --dry-run` |

## Assignment Types

| Type | Use Case | Example |
|------|----------|---------|
| `homework` | Weekly homework (default) | `/teaching:assignment homework "regression"` |
| `problem-set` | Comprehensive set | `/teaching:assignment problem-set --problems 10` |
| `lab` | Hands-on exercise | `/teaching:assignment lab --include-code` |
| `project` | Larger scope | `/teaching:assignment project "data analysis"` |

## Rubric Customization

| Flag | Effect | Default |
|------|--------|---------|
| `--points N` | Total points | 100 |
| `--levels N` | Performance levels | 4 (A/B/C/D) |
| `--format FMT` | Output format | markdown |

**Example:**

```bash
/teaching:rubric "final project" 200 --levels 5 --format markdown
```

## Solution Detail Levels

Configure in `.flow/teach-config.yml`:

```yaml
scholar:
  defaults:
    solution_detail: "step-by-step"  # or "answer-only", "hints"
```

| Level | What's Included |
|-------|-----------------|
| `step-by-step` | Full derivations, explanations (default) |
| `answer-only` | Final answers, no steps |
| `hints` | Guidance without full solution |

## Common Workflows

### Workflow 1: Complete Assignment ⏱️ 2 min

```bash
/teaching:assignment "ANOVA" --problems 5
# Output: Problems + Solutions + Rubric
```

### Workflow 2: Student + Grading Versions ⏱️ 3 min

```bash
# Student version
/teaching:assignment "regression" --no-solutions

# Grading version (later)
/teaching:assignment "regression"
```

### Workflow 3: Standalone Solution Key ⏱️ 2 min

```bash
# Generate solution key from existing .qmd assignment
/teaching:solution assignments/hw3.qmd

# Include grading notes
/teaching:solution assignments/hw3.qmd --include-rubric

# Custom instructions
/teaching:solution assignments/hw3.qmd -i "Use modern p-value interpretation"

# Email solution to TA after saving
/teaching:solution assignments/hw3.qmd --send
/teaching:solution assignments/hw3.qmd --send ta@university.edu
```

### Workflow 4: Existing Assignment + Rubric ⏱️ 2 min

```bash
# You have problems already
/teaching:rubric "regression homework" 100
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No solutions in output | Solutions included by default - check JSON `solutions` object |
| Don't want students to see solutions | Use `--no-solutions` flag |
| Wrong point total | Use `--points N` or edit JSON output |
| Need more/fewer questions | Use `--problems N` flag |
| Rubric too simple | Use `--levels N` for more performance tiers |

## Output Format

**JSON Structure:**

```json
{
  "problems": [...],
  "solutions": {
    "P1": {
      "answer": "...",
      "steps": ["Step 1...", "Step 2..."],
      "parts": {"a": "...", "b": "..."}
    }
  },
  "rubric": {
    "P1": {
      "full_credit": "...",
      "partial_credit": [{...}],
      "common_errors": [...]
    }
  }
}
```

## Integration with Workflow

### With flow-cli

```bash
# Set course config once
flow teach config

# Generate assignment in course context
flow teach assign "ANOVA" --problems 5
```

### Configuration Discovery

Scholar automatically finds `.flow/teach-config.yml` in parent directories:

```
~/courses/stat-440/
  └── .flow/teach-config.yml  ← Auto-discovered
      └── week-03/
          └── [run commands here]
```

### Output Files

Generated files follow this pattern:

```
assignment-{topic}-{timestamp}.json
assignment-{topic}-{timestamp}.md
assignment-{topic}-{timestamp}.qmd
assignment-{topic}-{timestamp}.tex
```

## Advanced Customization

### Format Combinations

Generate multiple formats at once:

```bash
/teaching:assignment "regression" --format md,qmd,tex,json
```

Output:

- `assignment-regression-*.md` (Student handout)
- `assignment-regression-*.qmd` (Quarto source)
- `assignment-regression-*.tex` (LaTeX document)
- `assignment-regression-*.json` (Machine-readable)

## Quality Assurance

### Validation Checklist

Before distributing to students:

- [ ] Run `--dry-run` first to preview
- [ ] Check solutions are correct
- [ ] Validate R code with `/teaching:validate-r`
- [ ] Verify point totals match course policy
- [ ] Test compilation (LaTeX/Quarto)
- [ ] Remove solutions if using `--no-solutions`

### Testing Commands

```bash
# Preview without API call
/teaching:assignment "topic" --dry-run

# Generate small version for testing
/teaching:assignment "test" --problems 2 --points 20

# Validate R code in solution key
/teaching:validate-r solutions/assignment-topic-solution.qmd

# Validate JSON structure
/teaching:assignment "topic" | jq '.solutions | keys'
```

## Performance Optimization

| Scenario | Recommendation | Time |
|----------|----------------|------|
| Quick homework | `--problems 3-5` | ~30s |
| Weekly assignment | `--problems 5-8` | ~1m |
| Problem set | `--problems 10-15` | ~2m |
| Project description | `--type project` | ~1m |

## More Information

- [Tutorial: Assignments with Solutions & Rubrics](../tutorials/teaching/assignments-solutions-rubrics.md)
- [Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md)
- [Output Formats Guide](../OUTPUT-FORMATS-GUIDE.md)
- [Teaching Workflows](../TEACHING-WORKFLOWS.md)
- [Configuration Guide](../tutorials/teaching/configuration.md)
