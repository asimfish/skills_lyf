# Teaching with Scholar

> **Quick Start:** Generate your first exam in 2 minutes with `/teaching:exam midterm`

Scholar's teaching commands help you create course materials faster and more consistently. Generate exams, quizzes, syllabi, assignments, slides, rubrics, and feedback - all powered by AI.

---

## Quick Start (5 minutes)

### 1. Install Scholar

```bash
brew install scholar
```

### 2. Try Your First Command

```bash
/teaching:exam midterm
```

### 3. Explore Workflows

- [Weekly Content Creation](#workflow-1-weekly-content-creation-15-minutes)
- [Semester Setup](#workflow-2-semester-setup-10-minutes)
- [Assessment Creation](#workflow-3-assessment-creation-20-minutes)

---

## Commands Overview

### Content Generation

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| [`/teaching:exam`](../TEACHING-COMMANDS-REFERENCE.md#teachingexam) | Comprehensive exams | `/teaching:exam midterm --questions 12` | 2 min |
| [`/teaching:quiz`](../TEACHING-COMMANDS-REFERENCE.md#teachingquiz) | Quick quizzes | `/teaching:quiz "hypothesis testing"` | 1 min |
| [`/teaching:assignment`](../TEACHING-COMMANDS-REFERENCE.md#teachingassignment) | Homework | `/teaching:assignment week5` | 2 min |
| [`/teaching:solution`](../TEACHING-COMMANDS-REFERENCE.md#teachingsolution) | Solution keys | `/teaching:solution hw3.qmd` | 2 min |
| [`/teaching:syllabus`](../TEACHING-COMMANDS-REFERENCE.md#teachingsyllabus) | Course syllabi | `/teaching:syllabus` | 3 min |
| [`/teaching:slides`](../TEACHING-COMMANDS-REFERENCE.md#teachingslides) | Lecture slides | `/teaching:slides "regression"` | 2 min |
| [`/teaching:lecture`](../WHATS-NEW-v2.5.0.md) | Lecture notes | `/teaching:lecture "ANOVA"` | 3 min |

### LMS Integration

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| [`/teaching:canvas`](../TEACHING-COMMANDS-REFERENCE.md#teachingcanvas) | Export to Canvas QTI | `/teaching:canvas midterm.qmd` | 1 min |

### Assessment & Feedback

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| [`/teaching:rubric`](../TEACHING-COMMANDS-REFERENCE.md#teachingrubric) | Grading rubrics | `/teaching:rubric assignment1` | 1 min |
| [`/teaching:feedback`](../TEACHING-COMMANDS-REFERENCE.md#teachingfeedback) | Student feedback | `/teaching:feedback submission.pdf` | 1 min |

### Testing

| Command | Use Case | Time |
|---------|----------|------|
| [`/teaching:demo`](../TEACHING-COMMANDS-REFERENCE.md#teachingdemo) | Test all commands | 5 min |

→ [Full API Reference](../TEACHING-COMMANDS-REFERENCE.md)

---

## Common Workflows

### Workflow 1: Weekly Content Creation ⏱️ 15 minutes

Create complete week's content: slides, assignment, quiz.

**Steps:**

1. Generate slides (2 min): `/teaching:slides "Week 5: Multiple Regression"`
2. Create assignment (2 min): `/teaching:assignment week5 --topics "multiple regression,diagnostics"`
3. Build quiz (1 min): `/teaching:quiz "multiple regression" --questions 5`
4. Review and customize (10 min)

→ [Full guide](../TEACHING-WORKFLOWS.md#weekly-content-creation-15-minutes-per-week)

---

### Workflow 2: Semester Setup ⏱️ 10 minutes

Set up new course at semester start.

**Steps:**

1. Create directory (1 min):

   ```bash
   mkdir -p ~/teaching/stat-440-spring-2026
   cd ~/teaching/stat-440-spring-2026
   git init
   ```

2. Create config (3 min):

   ```yaml
   # .flow/teach-config.yml
   scholar:
     course_info:
       level: "undergraduate"
       field: "statistics"
       difficulty: "intermediate"
   ```

3. Generate syllabus (2 min): `/teaching:syllabus`
4. Create structure (4 min): `mkdir -p {lectures,assignments,exams,quizzes,slides}`

→ [Full guide](../TEACHING-WORKFLOWS.md#semester-setup-10-minutes)

---

### Workflow 3: Assessment Creation ⏱️ 20 minutes

Create exam with answer key and rubric.

**Steps:**

1. Generate exam (2 min): `/teaching:exam midterm --questions 12 --topics "regression,ANOVA"`
2. Review questions (10 min)
3. Create rubric (3 min): `/teaching:rubric midterm --criteria "correctness,work-shown"`
4. Export to Canvas (5 min): `/teaching:canvas midterm.qmd` or `/teaching:exam midterm --format canvas`

→ [Full guide](../TEACHING-WORKFLOWS.md#assessment-creation-20-minutes)

---

## Examples

### Generate Final Exam

```bash
/teaching:exam final \
  --questions 20 \
  --difficulty hard \
  --topics "simple regression,multiple regression,diagnostics" \
  --duration 120
```

### Weekly Quiz Series

```bash
/teaching:quiz "descriptive statistics" --questions 5
/teaching:quiz "probability distributions" --questions 5
/teaching:quiz "hypothesis testing" --questions 5
```

### Lecture Notes with Exercises

```bash
/teaching:lecture "ANOVA" --depth advanced --examples 5 --exercises 10
```

### Assignment with Rubric

```bash
/teaching:assignment week7 --topics "logistic regression" --problems 6
/teaching:rubric week7 --criteria "correctness,code-quality,interpretation"
```

### Course Syllabus

```bash
/teaching:syllabus
```

→ [See all examples](../examples/teaching.md)

---

## Output Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| **Markdown** | `.md` | Simple documents |
| **Quarto** | `.qmd` | Academic documents |
| **LaTeX** | `.tex` | Print-ready exams |
| **JSON** | `.json` | API access |
| **Canvas QTI** | `.zip` | LMS import |

**Specify format:**

```bash
/teaching:exam midterm --format qmd
/teaching:exam midterm --format md,qmd,tex  # Multiple
```

→ [Output Formats Guide](../OUTPUT-FORMATS-GUIDE.md)

---

## Configuration

### Basic Configuration

```yaml
# .flow/teach-config.yml
scholar:
  course_info:
    level: "undergraduate"      # or "graduate"
    field: "statistics"
    difficulty: "intermediate"  # beginner, intermediate, advanced

  defaults:
    exam_format: "markdown"     # md, qmd, tex, json
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"

  style:
    tone: "formal"              # formal, conversational
    notation: "statistical"
    examples: true
```

### Custom Prompts

```yaml
scholar:
  prompts:
    exam: |
      Generate exam focused on practical application.
    lecture: |
      Create lecture notes with intuitive explanations.
```

→ [Configuration Guide](../CONFIGURATION.md) | [.flow/ Directory Reference](../FLOW-DIRECTORY-REFERENCE.md) | [Prompt Customization](../PROMPT-CUSTOMIZATION-GUIDE.md)

---

## Integration with Flow CLI

```bash
brew install flow-cli

work teaching        # Start teaching session
tweek               # View current week
tlec 5              # Open week 5 lecture
tpublish            # Deploy to GitHub Pages
```

→ [Flow CLI Integration](../TEACHING-WORKFLOWS.md#flow-cli-integration)

---

## Best Practices

### Content Generation

1. **Configure first** - Set up `.flow/teach-config.yml` before generating
2. **Use specific topics** - Provide detailed topic lists
3. **Review always** - Check content before using
4. **Version control** - Track materials in Git
5. **Iterate** - Use `--refine` to improve content

### Quality Control

1. **Verify accuracy** - Check mathematical content
2. **Test questions** - Solve problems yourself
3. **Validate formats** - Ensure output renders
4. **Check accessibility** - Use semantic markup
5. **Get feedback** - Ask students about clarity

### Workflow Optimization

1. **Batch generation** - Create multiple weeks at once
2. **Template reuse** - Save configurations
3. **Automate deployment** - Use GitHub Actions
4. **Track changes** - Use Git for versioning
5. **Share configs** - Collaborate with colleagues

→ [Teaching Style Guide](../TEACHING-STYLE-GUIDE.md)

---

## Need Help?

### Documentation

- [Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md)
- [Teaching Workflows](../TEACHING-WORKFLOWS.md)
- [Configuration Guide](../CONFIGURATION.md)
- [.flow/ Directory Reference](../FLOW-DIRECTORY-REFERENCE.md)
- [Output Formats](../OUTPUT-FORMATS-GUIDE.md)
- [Style Guide](../TEACHING-STYLE-GUIDE.md)

### Quick References

- [Commands Refcard](../refcards/teaching-commands.md)
- [Workflows Refcard](../refcards/teaching-workflows.md)

### Tutorials

- [First Exam](../tutorials/teaching/first-exam.md)
- [Weekly Content](../tutorials/teaching/weekly-content.md)
- [Semester Setup](../tutorials/teaching/semester-setup.md)

### Troubleshooting

- [FAQ](../help/FAQ-teaching.md)
- [Common Issues](../help/COMMON-ISSUES.md#teaching-commands)
- [Troubleshooting](../help/TROUBLESHOOTING-teaching.md)

### Support

- [GitHub Issues](https://github.com/Data-Wise/scholar/issues)
- [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions)
- [Contributing](../CONTRIBUTING.md)

---

## What's Next?

### Try Your First Command

```bash
/teaching:exam midterm
```

### Explore Workflows

- [Weekly Content](../TEACHING-WORKFLOWS.md#weekly-content-creation-15-minutes-per-week) ⏱️ 15 min
- [Semester Setup](../TEACHING-WORKFLOWS.md#semester-setup-10-minutes) ⏱️ 10 min
- [Assessment Creation](../TEACHING-WORKFLOWS.md#assessment-creation-20-minutes) ⏱️ 20 min

### Read Tutorials

- [Create Your First Exam](../tutorials/teaching/first-exam.md) ⏱️ 10 min
- [Set Up a New Course](../tutorials/teaching/semester-setup.md) ⏱️ 15 min
- [Generate Weekly Content](../tutorials/teaching/weekly-content.md) ⏱️ 20 min

### Customize

- [Configuration Guide](../CONFIGURATION.md)
- [Prompt Customization](../PROMPT-CUSTOMIZATION-GUIDE.md)
- [Teaching Style Guide](../TEACHING-STYLE-GUIDE.md)

---

**Version:** {{ scholar.version }}
**Last Updated:** 2026-02-04
**License:** MIT
