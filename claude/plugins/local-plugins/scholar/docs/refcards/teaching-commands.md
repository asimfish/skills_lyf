# Teaching Commands - Quick Reference Card

> **Version:** {{ scholar.version }} | **Last Updated:** 2026-02-16

---

## TL;DR (30 seconds)

- **Generate exam in 2 min:** `/teaching:exam midterm --questions 10`
- **Create weekly content in 15 min:** Slides + quiz + assignment
- **Setup semester in 10 min:** Config + syllabus + structure

---

## Quick Command Reference

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| `/teaching:exam` | Generate comprehensive exams | `/teaching:exam midterm --questions 15` | 2 min |
| `/teaching:quiz` | Create quiz questions | `/teaching:quiz "Linear Regression" 10` | 1 min |
| `/teaching:assignment` | Generate homework | `/teaching:assignment "Hypothesis Testing"` | 2 min |
| `/teaching:solution` | Generate solution keys | `/teaching:solution assignments/hw3.qmd --send` | 2 min |
| `/teaching:slides` | Create/revise/check slides | `/teaching:slides "ANOVA" --format quarto` | 2 min |
| `/teaching:lecture` | Generate lecture notes (20-40 pg) | `/teaching:lecture "Multiple Regression"` | 3 min |
| `/teaching:syllabus` | Build course syllabus | `/teaching:syllabus "STAT 440" "Spring 2026"` | 2 min |
| `/teaching:rubric` | Create grading rubrics | `/teaching:rubric "data analysis project"` | 1 min |
| `/teaching:feedback` | Generate student feedback | `/teaching:feedback` (interactive) | 1 min |
| `/teaching:demo` | Create demo course | `/teaching:demo ~/test-course --verify` | 30 sec |
| `/teaching:validate` | Validate YAML configs | `/teaching:validate --fix --auto` | 10 sec |
| `/teaching:diff` | Compare YAML vs JSON | `/teaching:diff week-01.yml` | 5 sec |
| `/teaching:sync` | Sync YAML to JSON | `/teaching:sync --all` | 10 sec |
| `/teaching:migrate` | Batch v1→v2 migration | `/teaching:migrate --dry-run` | 30 sec |
| `/teaching:validate-r` | Validate R code in .qmd | `/teaching:validate-r solutions/hw4.qmd` | 30 sec |
| `/teaching:canvas` | Export QMD exam to Canvas QTI | `/teaching:canvas midterm.qmd` | 1 min |
| `/teaching:preflight` | Pre-release health checks | `/teaching:preflight` | 30 sec |

---

## Common Workflows

### Workflow 1: Weekly Content Creation ⏱️ 15 minutes

```bash
# 1. Generate lecture slides (2 min)
/teaching:slides "Introduction to ANOVA" --format quarto

# 2. Create assignment (2 min)
/teaching:assignment "ANOVA Practice Problems"

# 3. Create quiz (1 min)
/teaching:quiz "ANOVA Concepts" 8

# 4. Create grading rubric (1 min)
/teaching:rubric "ANOVA assignment"

# 5. Save and commit (1 min)
# Files saved automatically, commit to git
```

**Output:**

- Quarto slides with code examples
- Assignment with 5-7 problems
- 8-question quiz with answer key
- Grading rubric with criteria
- Total time: ~15 minutes vs 2-3 hours manually

---

### Workflow 2: Midterm Exam Creation ⏱️ 20 minutes

```bash
# 1. Generate exam (2 min)
/teaching:exam midterm --questions 15 --duration 75

# 2. Review and customize (10 min)
# Review generated questions, adjust difficulty

# 3. Create rubric (1 min)
/teaching:rubric "midterm exam"

# 4. Export to formats (2 min)
# Export as: student.tex, key.tex, rubric.tex, .qmd, .md

# 5. Compile LaTeX (2 min)
# pdflatex exam-student.tex
# pdflatex exam-key.tex
```

**Output:**

- 15-question exam (60% MC, 30% short-answer, 10% essay)
- Answer key with detailed solutions
- Grading rubric with point breakdown
- LaTeX, Markdown, Quarto, JSON formats
- Total time: ~20 minutes vs 4-6 hours manually

---

### Workflow 3: Semester Setup ⏱️ 10 minutes

```bash
# 1. Create course directory (1 min)
mkdir -p ~/teaching/stat-440-spring-2026
cd ~/teaching/stat-440-spring-2026
git init

# 2. Create config (2 min)
mkdir -p .flow
# Create .flow/teach-config.yml with course settings

# 3. Generate syllabus (2 min)
/teaching:syllabus "STAT 440: Regression Analysis" "Spring 2026"

# 4. Create directory structure (1 min)
mkdir -p {exams,quizzes,assignments,slides,rubrics,lectures}

# 5. Generate first week content (4 min)
/teaching:slides "Course Introduction"
/teaching:assignment "R Setup and Data Import"
```

**Output:**

- Complete course structure
- Syllabus with learning objectives
- First week materials ready
- Git repository initialized
- Total time: ~10 minutes vs 3-4 hours manually

---

## Keyboard Shortcuts / Flags

| Flag | Effect | Example |
|------|--------|---------|
| `--dry-run` | Preview without API calls | `/teaching:exam --dry-run` |
| `--format md` | Markdown output | `/teaching:exam --format md` |
| `--format qmd` | Quarto output | `/teaching:slides --format qmd` |
| `--format tex` | LaTeX output | `/teaching:exam --format tex` |
| `--format json` | JSON output | `/teaching:quiz --format json` |
| `--format canvas` | Canvas QTI output | `/teaching:exam --format canvas` |
| `--config PATH` | Custom config location | `/teaching:exam --config .flow/config.yml` |
| `--from-plan` | Generate from lesson plan | `/teaching:lecture --from-plan week-01.yml` |
| `-i "text"` | Custom instructions for AI | `/teaching:exam -i "Focus on healthcare"` |
| `-i @file` | Load instructions from file | `/teaching:slides -i @instructions.txt` |
| `--revise` | Revise slides or lecture (v2.8.0) | `/teaching:slides --revise slides.qmd` |
| `--check` | Validate slides or lecture (v2.8.0) | `/teaching:slides --check slides.qmd --from-plan=week03` |
| `--instruction` | Revision instruction (v2.8.0) | `--revise slides.qmd --instruction "Add examples"` |
| `--section` | Target section for revision | `--revise slides.qmd --section "Methods"` |
| `--slides` | Target slide range | `--revise slides.qmd --slides 5-12` |
| `--type` | Target slide type | `--revise slides.qmd --type quiz` |
| `--send [EMAIL]` | Email to TA — solution, assignment, rubric only | `/teaching:solution hw3.qmd --send ta@uni.edu` |
| `--refine` | Alias for --revise (deprecated) | `/teaching:lecture --refine intro` |
| `--open` | Auto-open in preview app | `/teaching:slides --open` |
| `--questions N` | Number of questions | `/teaching:exam --questions 20` |
| `--difficulty LEVEL` | Set difficulty level | `/teaching:quiz --difficulty hard` |
| `--duration N` | Set time limit (minutes) | `/teaching:exam --duration 90` |
| `--variations N` | Generate N variations | `/teaching:exam --variations 3` |
| `--no-formulas` | Exclude formula sheet | `/teaching:exam --no-formulas` |
| `--no-solutions` | Exclude answer key | `/teaching:exam --no-solutions` |
| `--verify` | Verify demo course setup | `/teaching:demo --verify` |
| `--force` | Overwrite existing files | `/teaching:demo --force` |

---

## Export Formats Comparison

| Format | Use Case | Output Files | Pros | Cons |
|--------|----------|--------------|------|------|
| **Markdown** | Quick editing, web | `.md` with YAML | Easy to edit, portable | Limited formatting |
| **Quarto** | Reproducible docs | `.qmd` with code | R/Python integration | Requires Quarto |
| **LaTeX** | Print exams | `.tex` (student/key/rubric) | Professional typesetting | Requires LaTeX |
| **JSON** | Custom processing | `.json` structured | Machine-readable | Not human-friendly |
| **Canvas QTI** | LMS import | `.zip` via examark | Direct LMS upload | Requires examark |

---

### Workflow 4: Slide Revision & Validation (v2.8.0) ⏱️ 10 minutes

```bash
# 1. Check slides against lesson plan (30 sec)
/teaching:slides --check slides/week-03.qmd --from-plan=week03

# 2. Preview auto-analysis suggestions (30 sec)
/teaching:slides --revise slides/week-03.qmd --dry-run

# 3. Apply auto-analysis improvements (1 min)
/teaching:slides --revise slides/week-03.qmd

# 4. Fix specific issues from check report (5 min)
/teaching:slides --revise slides/week-03.qmd --section "Methods" \
  --instruction "Add practice slide after worked example"

# 5. Re-check to verify improvements (30 sec)
/teaching:slides --check slides/week-03.qmd --from-plan=week03
```

**Output:**

- Validation report (coverage, structure, style)
- Auto-analysis across 7 dimensions
- Targeted revisions per section/type/range
- Total time: ~10 minutes vs 1-2 hours manual review

### Workflow 5: Quality Check — R Code Validation ⏱️ 2 minutes

```bash
# 1. Validate R code in a solution file (30 sec)
/teaching:validate-r solutions/assignment4-solution.qmd

# 2. Validate all .qmd files in a directory (30 sec)
/teaching:validate-r --all solutions/

# 3. Auto-fix failing chunks (1 min)
/teaching:validate-r --fix solutions/assignment4-solution.qmd

# 4. Full pipeline: validate + render (1 min)
/teaching:validate-r --render solutions/assignment4-solution.qmd
```

**Output:**

- Per-chunk PASS/FAIL/SKIP/WARN report (eslint-style)
- Auto-fix suggestions for failing chunks
- JSON output for CI with `--json`
- Total time: ~2 minutes vs 15+ minutes manual testing

---

## Command-Specific Options

| Command | Key Options | Output |
|---------|-------------|--------|
| `/teaching:exam` | `--questions N`, `--difficulty`, `--duration N`, `--variations N` | MC (60%), short-answer (30%), essay (10%), answer key |
| `/teaching:quiz` | `--questions N`, `--type`, `--randomize`, `--feedback WHEN` | MC (60%), T/F (20%), short (10%), numerical (10%) |
| `/teaching:assignment` | `--problems N`, `--difficulty`, `--include-solutions` | 5-7 problems, solutions, rubric (optional) |
| `/teaching:slides` | `--format`, `--revise`, `--check`, `--section`, `--type`, `--slides` | Bullets, Reveal.js/Beamer, code snippets |
| `/teaching:lecture` | `--from-plan PATH`, `--revise PATH`, `--open` | 20-40 pages, full derivations, code blocks |
| `/teaching:syllabus` | `--topics`, `--policies`, `--calendar` | Schedule, grading, policies, resources |
| `/teaching:rubric` | `--criteria N`, `--scale POINTS`, `--levels N` | Criteria, performance levels, points |
| `/teaching:feedback` | Interactive (no options) | Constructive feedback, improvements |
| `/teaching:demo` | `--verify`, `--force` | Demo course with samples, config files |

---

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Commands not showing | `claude plugin update scholar` or restart Claude Code |
| Config not found | Create `.flow/teach-config.yml` in project root or parent dir |
| API error | Check `ANTHROPIC_API_KEY` environment variable |
| LaTeX won't compile | Install LaTeX: `brew install basictex` |
| Quarto error | Install Quarto: `brew install quarto` |
| Canvas QTI export fails | Install examark: `npm install -g examark` |
| Dry-run doesn't work | Ensure `--dry-run` flag is before command topic |
| File not saving | Check write permissions in output directory |
| Format not supported | Use: `md`, `qmd`, `tex`, `json` only |
| Questions too easy/hard | Override with `--difficulty LEVEL` flag |

---

## Configuration Quick Reference

### Minimal .flow/teach-config.yml

```yaml
scholar:
  course_info:
    level: "undergraduate"        # or "graduate"
    field: "statistics"          # your field
    difficulty: "intermediate"   # beginner/intermediate/advanced

  defaults:
    exam_format: "markdown"      # md/qmd/tex/json
    lecture_format: "quarto"     # qmd/md
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"

  style:
    tone: "formal"               # formal/conversational
    notation: "statistical"      # your notation style
    examples: true               # include worked examples
```

**Config Location (searched in order):**

1. Current directory: `./.flow/teach-config.yml`
2. Parent directory: `../.flow/teach-config.yml`
3. Grandparent directory: `../../.flow/teach-config.yml`
4. Uses defaults if not found

---

## Tips & Best Practices

### Configuration Tips

- Place `.flow/teach-config.yml` at project root for auto-discovery
- Override defaults per-command with flags (e.g., `--difficulty hard`)
- Use `--dry-run` first to preview before generating

### Quality Tips

- Review AI-generated content before using in class
- Customize difficulty levels to match your course
- Use `--variations N` to create multiple exam versions
- Combine commands: slides → assignment → quiz → rubric

### Workflow Tips

- Generate content week-by-week, not all at once
- Use git to track changes and versions
- Export to multiple formats for flexibility
- Test with `/teaching:demo` before real course

---

## Time Savings Summary

| Task | Manual Time | Scholar Time | Savings |
|------|-------------|--------------|---------|
| Weekly content | 2-3 hours | 15 min | 88-92% |
| Midterm exam | 4-6 hours | 20 min | 94-97% |
| Semester setup | 3-4 hours | 10 min | 95-97% |
| Single quiz | 30-45 min | 1 min | 97-98% |
| Grading rubric | 20-30 min | 1 min | 95-97% |
| Lecture notes | 3-5 hours | 3 min | 98-99% |

**Average time savings:** ~50-70% overall course preparation time

---

## More Information

### Full Guides

- [Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md) - Complete API reference
- [Teaching Workflows](../TEACHING-WORKFLOWS.md) - Detailed workflow examples
- [Teaching Style Guide](../TEACHING-STYLE-GUIDE.md) - Customization options
- [Output Formats Guide](../OUTPUT-FORMATS-GUIDE.md) - Format conversion details

### Tutorials

- [Your First Exam](../tutorials/teaching/first-exam.md) - Step-by-step exam creation
- [Weekly Content Creation](../tutorials/teaching/weekly-content.md) - Lecture workflow
- [Assignments with Solutions & Rubrics](../tutorials/teaching/assignments-solutions-rubrics.md) - Complete workflow

### Examples

- [Simulation Examples](../examples/simulations.md) - Real-world examples
- [Command Examples](../COMMAND-EXAMPLES.md) - All commands demonstrated

### Help

- [FAQ](../help/FAQ-teaching.md) - Common questions
- [Common Issues](../help/COMMON-ISSUES.md) - Troubleshooting guide
- [Troubleshooting](../help/TROUBLESHOOTING-teaching.md) - Advanced troubleshooting

### Reference

- [.flow/ Directory Reference](../FLOW-DIRECTORY-REFERENCE.md) - Complete .flow/ file map
- [Prompt Customization](../PROMPT-CUSTOMIZATION-GUIDE.md) - Customize AI prompts
- [API Reference](../API-REFERENCE.md) - Complete API documentation
- [Lecture Pipeline Diagrams](../LECTURE-PIPELINE-DIAGRAMS.md) - Visual workflows

---

## Quick Start Command

```bash
# Try Scholar teaching commands in 30 seconds
/teaching:demo ~/test-course --verify
cd ~/test-course
/teaching:exam midterm --dry-run
```

---

**Questions?** Check the [FAQ](../help/FAQ-teaching.md) or [open an issue](https://github.com/Data-Wise/scholar/issues)

**Want to contribute?** See [DEVELOPER-GUIDE.md](../DEVELOPER-GUIDE.md)
