# Teaching Workflows Quick Reference

> **One-page cheat sheet for common teaching workflows with Scholar**

Print this page for quick reference during course preparation.

---

## Command Syntax

```bash
/teaching:<command> "description" [flags]
  --config PATH          Config file (default: .flow/teach-config.yml)
  --format FORMAT        Output format (md, qmd, tex, json)
  --output FILE          Output filename
  --solutions            Include solutions/answers
  --help                 Show command help
```

---

## Weekly Lecture Workflow

**Time:** 80 minutes | **Output:** Slides + Notes + Demo

```bash
# Monday (15 min) - Generate notes
/teaching:lecture "topic" --config .flow/teach-config.yml --format quarto

# Tuesday (30 min) - Customize & add examples
# Edit lecture.qmd: datasets, plots, worked examples

# Wednesday (20 min) - Create slides
/teaching:slides "topic" --source lecture.qmd --format revealjs

# Thursday (15 min) - Preview & render
quarto render slides.qmd
quarto render lecture.qmd --to pdf
```

**Shortcuts:**
```bash
tlec 7    # Open week 7 lecture (flow-cli)
tweek     # Show current week (flow-cli)
```

---

## Exam Creation Workflow

**Time:** 60 minutes | **Output:** Exam + Solutions + Practice Version

```bash
# Step 1 (15 min) - Generate exam
/teaching:exam "topic covering: subtopic1, subtopic2, subtopic3" \
  --config .flow/teach-config.yml \
  --format quarto \
  --questions 10 \
  --solutions

# Step 2 (20 min) - Customize
# Edit exam.qmd: adjust difficulty, add diagrams

# Step 3 (10 min) - Create practice version
cp exam.qmd exam-practice.qmd
# Remove point values, add hints

# Step 4 (15 min) - Render
quarto render exam.qmd --to pdf
quarto render exam-solutions.qmd --to pdf
quarto render exam-practice.qmd --to pdf
```

**Canvas Integration:**
```bash
# Generate JSON format
/teaching:exam "topic" --format json

# Convert to Canvas QTI (requires examark)
/teaching:canvas exam.qmd
# Or use --format canvas on content commands:
/teaching:exam "topic" --format canvas
```

---

## Assignment Creation Workflow

**Time:** 90 minutes | **Output:** Assignment + Rubric + Solutions

```bash
# Step 1 (15 min) - Generate assignment
/teaching:assignment "topic: specific requirements" \
  --config .flow/teach-config.yml \
  --format quarto

# Step 2 (30 min) - Add dataset & context
# Edit assignment.qmd: link dataset, research question

# Step 3 (15 min) - Create rubric
/teaching:rubric "assignment rubric" \
  --criteria "analysis, interpretation, writing, code" \
  --points 100

# Step 4 (30 min) - Create solutions
cp assignment.qmd assignment-solutions.qmd
# Work through analysis, document approach

# Step 5 (10 min) - Render
quarto render assignment.qmd --to pdf
quarto render assignment.qmd --to html
```

---

## Quiz Generation Workflow

**Time:** 20 minutes | **Output:** Quiz + Solutions

```bash
# Step 1 (10 min) - Generate quiz
/teaching:quiz "topic focusing on key concepts" \
  --config .flow/teach-config.yml \
  --format markdown \
  --solutions

# Step 2 (5 min) - Review & adjust
# Edit quiz.md: verify question difficulty

# Step 3 (5 min) - Export
# Copy to Canvas or convert to desired format
```

**Practice Version:**
```bash
/teaching:quiz "topic" --practice --solutions
# Students use for self-study
```

---

## Slide Revision & Validation (v2.8.0)

**Time:** 10 minutes | **Output:** Validated + improved slide deck

```bash
# Step 1 (1 min) - Check against lesson plan
/teaching:slides --check slides/week-03.qmd --from-plan=week03

# Step 2 (1 min) - Preview auto-analysis
/teaching:slides --revise slides/week-03.qmd --dry-run

# Step 3 (1 min) - Apply auto-improvements
/teaching:slides --revise slides/week-03.qmd

# Step 4 (5 min) - Targeted fixes from check report
/teaching:slides --revise slides.qmd --section "Methods" \
  --instruction "Add practice slide after worked example"
/teaching:slides --revise slides.qmd --type quiz \
  --instruction "Add 4th answer option"

# Step 5 (1 min) - Re-check
/teaching:slides --check slides/week-03.qmd --from-plan=week03
```

**Targeting options:**
```bash
--section "title"   # Fuzzy section match
--slides 5-12       # Slide range
--type quiz         # All slides of type
```

---

## R Code Validation Workflow

**Time:** 5 minutes | **Output:** Validated .qmd files with working R code

```bash
# Step 1 (30 sec) - Validate single file
/teaching:validate-r solutions/assignment4-solution.qmd

# Step 2 (30 sec) - Batch validate directory
/teaching:validate-r --all solutions/

# Step 3 (2 min) - Auto-fix failing chunks
/teaching:validate-r --fix solutions/assignment4-solution.qmd

# Step 4 (1 min) - Validate + render
/teaching:validate-r --render solutions/assignment4-solution.qmd

# Step 5 (30 sec) - CI-friendly output
/teaching:validate-r --json --quiet --all solutions/
```

**Key flags:**
```bash
--dry-run     # Preview chunks without running
--fix         # Auto-fix failing chunks
--all         # Validate all .qmd in directory
--render      # Also run quarto render
--json        # Machine-readable output
--quiet       # Only show failures
--setup CODE  # Extra R setup code
```

---

## Course Setup Workflow

**Time:** 2-3 hours | **Output:** Syllabus + Policies + Schedule

```bash
# Step 1 (15 min) - Configure course
cat > .flow/teach-config.yml << EOF
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
  defaults:
    exam_format: "markdown"
    lecture_format: "quarto"
  style:
    tone: "formal"
EOF

# Step 2 (30 min) - Generate syllabus
/teaching:syllabus "Course Title (COURSE-NUM)" \
  --config .flow/teach-config.yml \
  --format quarto \
  --include-policies

# Step 3 (60 min) - Customize
# Edit syllabus.qmd:
#   - Add course schedule (16 weeks)
#   - Include textbook info
#   - Modify grading policy
#   - Add university policies

# Step 4 (30 min) - Create rubrics
/teaching:rubric "exam rubric" --points 100
/teaching:rubric "assignment rubric" --points 100
/teaching:rubric "project rubric" --points 200

# Step 5 (15 min) - Render materials
quarto render syllabus.qmd --to pdf
quarto render syllabus.qmd --to html
```

---

## Batch Generation Workflow

**Use Case:** Generate 16 weeks of lectures at semester start

```bash
# Create topics file
cat > topics.txt << EOF
Week 1: Introduction to Statistics
Week 2: Descriptive Statistics
Week 3: Probability Basics
Week 4: Random Variables
Week 5: Distributions
Week 6: Sampling
Week 7: Estimation
Week 8: Confidence Intervals
Week 9: Hypothesis Testing
Week 10: t-tests
Week 11: ANOVA
Week 12: Simple Regression
Week 13: Multiple Regression
Week 14: Model Diagnostics
Week 15: Advanced Topics
Week 16: Review
EOF

# Batch generate lectures
while IFS=: read -r week topic; do
  num=$(echo $week | tr -dc '0-9')
  /teaching:lecture "$topic" \
    --config .flow/teach-config.yml \
    --format quarto \
    --output "lectures/week$(printf %02d $num)-$(echo $topic | tr ' ' '-' | tr '[:upper:]' '[:lower:]').qmd"
done < topics.txt

# Batch render
quarto render lectures/
```

**Time:** ~2-3 hours for full semester (with review/customization)

---

## Scholar Teaching Commands

| Command | Purpose | Time | Key Flags |
|---------|---------|------|-----------|
| `/teaching:exam` | Exams | 15 min | `--questions N`, `--solutions` |
| `/teaching:quiz` | Quizzes | 10 min | `--practice`, `--solutions` |
| `/teaching:slides` | Slides | 20 min | `--format revealjs/beamer` |
| `/teaching:lecture` | Notes | 15 min | `--detailed`, `--summary` |
| `/teaching:assignment` | Homework | 15 min | `--include-code`, `--lab` |
| `/teaching:syllabus` | Syllabus | 30 min | `--include-policies` |
| `/teaching:rubric` | Rubrics | 10 min | `--criteria`, `--points` |
| `/teaching:feedback` | Feedback | 5 min | `--rubric`, `--anonymous` |
| `/teaching:demo` | Demos | 15 min | `--language R/Python` |

---

## Output Formats

| Format | Extension | Use Case | Render Command |
|--------|-----------|----------|----------------|
| **Markdown** | `.md` | Simple docs | `pandoc -o file.pdf` |
| **Quarto** | `.qmd` | Rich content | `quarto render file.qmd` |
| **LaTeX** | `.tex` | Professional PDFs | `pdflatex file.tex` |
| **JSON** | `.json` | Canvas/LMS | `/teaching:canvas` |
| **Reveal.js** | `.qmd` | Slides (HTML) | `quarto render --to revealjs` |
| **Beamer** | `.qmd` | Slides (PDF) | `quarto render --to beamer` |

---

## Integration Points

### flow-cli Teaching Commands

```bash
tst                    # Teaching dashboard
tweek                  # Current week info
tlec N                 # Open week N lecture
tpublish               # Deploy to GitHub Pages
pb                     # Build current file
pv                     # Preview rendered output
```

### Quarto Rendering

```bash
quarto render file.qmd                    # Default format
quarto render file.qmd --to pdf           # PDF output
quarto render file.qmd --to html          # HTML output
quarto render file.qmd --to revealjs      # Slides
quarto render dir/                        # Batch render
```

### Canvas/LMS Integration

```bash
# Canvas QTI export (requires examark)
/teaching:canvas exam.qmd
# Or: /teaching:exam "topic" --format canvas
```

### Git Version Control

```bash
git add lectures/ assignments/ exams/
git commit -m "feat(teaching): add week 7 materials"
git push
```

---

## Troubleshooting Quick Tips

| Issue | Solution |
|-------|----------|
| Config not found | Specify: `--config .flow/teach-config.yml` |
| Format not supported | Check available: `/teaching:command --help` |
| Quarto render fails | Run: `quarto check` and verify syntax |
| Solutions missing | Add flag: `--solutions` |
| PDF render fails | Install LaTeX: `quarto install tinytex` |
| Images not showing | Use relative paths, check file exists |
| Code blocks broken | Verify language: ` ```{r}` or ` ```{python}` |
| Canvas upload fails | Check examark install, verify course ID |

**Debug Mode:**
```bash
/teaching:command "topic" --debug
```

---

## Time Estimates

### Per-Activity Breakdown

| Activity | Initial Generation | Customization | Total |
|----------|-------------------|---------------|-------|
| **Quiz** | 10 min | 10 min | 20 min |
| **Lecture** | 15 min | 30 min | 45 min |
| **Slides** | 20 min | 15 min | 35 min |
| **Assignment** | 15 min | 45 min | 60 min |
| **Exam** | 15 min | 30 min | 45 min |
| **Rubric** | 10 min | 5 min | 15 min |
| **Syllabus** | 30 min | 60 min | 90 min |
| **Demo** | 15 min | 20 min | 35 min |

### Weekly Teaching Prep

| Task | Time | Frequency |
|------|------|-----------|
| Lecture prep (notes + slides) | 80 min | Weekly |
| Quiz creation | 20 min | Weekly |
| Assignment creation | 90 min | Every 2 weeks |
| Exam creation | 60 min | 2x per semester |
| Grading (with rubrics) | Variable | Ongoing |

**Total Weekly:** ~100 minutes (lectures + quiz)

---

## Common Workflow Patterns

### Pattern 1: Lecture-Driven Course

```bash
# Each week:
1. /teaching:lecture (15 min)
2. Customize content (30 min)
3. /teaching:slides (20 min)
4. /teaching:quiz (20 min)
5. Render & post (15 min)
```

**Weekly Total:** ~100 minutes

### Pattern 2: Flipped Classroom

```bash
# Pre-class:
1. /teaching:lecture --detailed (15 min)
2. Post for student review

# In-class:
3. /teaching:demo (15 min)
4. Active learning activities

# Post-class:
5. /teaching:quiz --practice (10 min)
```

**Weekly Total:** ~40 minutes (prep)

### Pattern 3: Project-Based Course

```bash
# Milestone-based:
1. /teaching:assignment --project (20 min)
2. /teaching:rubric (10 min)
3. Periodic check-ins (ongoing)
4. /teaching:feedback (variable)
```

**Per Milestone:** ~30 minutes (setup)

---

## Keyboard Shortcuts (flow-cli)

| Shortcut | Command | Action |
|----------|---------|--------|
| `tst` | Teaching status | Dashboard overview |
| `tweek` | Week info | Current week details |
| `tlec N` | Lecture open | Open week N lecture |
| `pb` | Build | Compile/render current |
| `pv` | Preview | View rendered output |
| `tpublish` | Publish | Deploy to GitHub Pages |

---

## Semester Planning Checklist

### Pre-Semester (Week 0)
- [ ] Create `.flow/teach-config.yml`
- [ ] Generate syllabus
- [ ] Create rubrics for major assignments
- [ ] Generate first 2 weeks of lectures
- [ ] Set up LMS (Canvas/Blackboard)

### During Semester (Weeks 1-16)
- [ ] Weekly: Generate lecture + quiz
- [ ] Every 2 weeks: Create assignment
- [ ] Week 7: Midterm exam
- [ ] Week 16: Final exam

### Post-Semester
- [ ] Archive course materials
- [ ] Review student evaluations
- [ ] Update config for next semester
- [ ] Backup `.flow/` directory

---

## Essential Commands Reference

```bash
# Generate content
/teaching:lecture "topic" --config .flow/teach-config.yml
/teaching:slides "topic" --format revealjs
/teaching:exam "topic" --questions 10 --solutions
/teaching:assignment "topic" --format quarto

# Render content
quarto render file.qmd --to pdf
quarto render dir/

# Canvas integration
/teaching:canvas exam.qmd

# Git workflow
git add .
git commit -m "feat: add week N materials"
git push
```

---

## Common Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `--config PATH` | Config file | `--config .flow/teach-config.yml` |
| `--format FORMAT` | Output format | `--format quarto` |
| `--output FILE` | Output filename | `--output exam.qmd` |
| `--solutions` | Include answers | `--solutions` |
| `--questions N` | Number of questions | `--questions 10` |
| `--practice` | Practice/ungraded | `--practice` |
| `--detailed` | Verbose notes | `--detailed` |
| `--summary` | Brief overview | `--summary` |
| `--include-code` | Add code blocks | `--include-code` |
| `--help` | Show help | `--help` |

---

## File Naming Conventions

```bash
# Lectures
week01-introduction.qmd
week02-descriptive-stats.qmd

# Exams
midterm-exam.qmd
midterm-solutions.qmd
final-exam.qmd

# Assignments
hw01-regression.qmd
hw01-solutions.qmd
project-proposal.qmd

# Quizzes
quiz01-probability.md
quiz02-distributions.md

# Rubrics
exam-rubric.md
assignment-rubric.md
project-rubric.md
```

---

## Configuration Template

```yaml
# .flow/teach-config.yml
scholar:
  course_info:
    level: "undergraduate"        # or "graduate"
    field: "statistics"           # your discipline
    difficulty: "intermediate"    # "beginner", "intermediate", "advanced"
    institution: "University"     # your institution

  defaults:
    exam_format: "markdown"       # md, qmd, tex, json
    lecture_format: "quarto"      # quarto or markdown
    include_solutions: true       # auto-include solutions

  style:
    tone: "formal"                # "formal" or "conversational"
    notation: "statistical"       # LaTeX notation style
    examples: true                # include worked examples
    code_blocks: true             # include code in notes
```

---

## Additional Resources

- **Full Examples:** [docs/examples/teaching.md](../examples/teaching.md)
- **.flow/ Directory Reference:** [docs/FLOW-DIRECTORY-REFERENCE.md](../FLOW-DIRECTORY-REFERENCE.md) - Complete file map
- **API Reference:** [docs/API-REFERENCE.md](../API-REFERENCE.md)
- **Tutorials:** [docs/tutorials/](../tutorials/teaching/first-exam.md)
- **GitHub:** https://github.com/Data-Wise/scholar
- **Docs Site:** https://Data-Wise.github.io/scholar/

---

**Version:** {{ scholar.version }}
**Last Updated:** 2026-02-16
**Print-Friendly:** Yes (single page, high contrast)
