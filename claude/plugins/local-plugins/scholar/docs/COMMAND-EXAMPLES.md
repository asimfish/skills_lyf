# Scholar Teaching Commands - Interactive Playground

### Interactive examples and dry-run simulations for all {{ scholar.teaching_commands }} scholar teaching commands

---

## Quick Reference

| Command                | Purpose                                 | Example                                             |
| ---------------------- | --------------------------------------- | --------------------------------------------------- |
| `/teaching:exam`       | Generate comprehensive exams            | `/teaching:exam midterm --questions 15`             |
| `/teaching:quiz`       | Create quiz questions                   | `/teaching:quiz "Linear Regression" 10`             |
| `/teaching:assignment` | Generate homework assignments           | `/teaching:assignment "ANOVA" --problems 5`         |
| `/teaching:solution`   | Generate standalone solution keys       | `/teaching:solution assignments/hw3.qmd`            |
| `/teaching:slides`     | Create lecture slides                   | `/teaching:slides "Probability" 75`                 |
| `/teaching:lecture`    | Generate instructor notes (20-40 pages) | `/teaching:lecture "Regression" --from-plan=week05` |
| `/teaching:syllabus`   | Create course syllabus                  | `/teaching:syllabus "STAT-440" "Fall 2026"`         |
| `/teaching:rubric`     | Generate grading rubrics                | `/teaching:rubric "data analysis project" 100`      |
| `/teaching:feedback`   | Generate student feedback               | `/teaching:feedback "Homework 3" 85`                |
| `/teaching:demo`       | Create demo course                      | `/teaching:demo ~/test-course --verify`             |
| `/teaching:validate`   | Validate YAML configs                   | `/teaching:validate --all --strict`                 |
| `/teaching:sync`       | Sync YAML → JSON                        | `/teaching:sync --all`                              |
| `/teaching:migrate`    | Migrate v1 → v2 schema                  | `/teaching:migrate --dry-run`                       |
| `/teaching:diff`       | Compare YAML vs JSON                    | `/teaching:diff --all --summary`                    |
| `/teaching:config`     | Config management & provenance          | `/teaching:config --inspect`                        |
| `/teaching:validate-r` | Validate R code in .qmd                 | `/teaching:validate-r solutions/hw4.qmd`            |
| `/teaching:preflight`  | Pre-release health checks               | `/teaching:preflight`                               |
| `/teaching:canvas`     | Export QMD exam to Canvas QTI           | `/teaching:canvas midterm.qmd`                      |

---

## Content Generation Commands

### `/teaching:exam` - Generate Exams

Create comprehensive exams with multiple question types, answer keys, and automatic validation.

#### Basic Usage (/teaching:exam - Generate)

```bash
# Basic midterm exam
/teaching:exam midterm

# Final exam with 15 questions
/teaching:exam final --questions 15 --difficulty hard

# Practice exam for specific topics
/teaching:exam practice --topics "linear regression,hypothesis testing"
```

#### Common Options (Practice exam for)

| Option               | Description                       | Example                       |
| -------------------- | --------------------------------- | ----------------------------- |
| `--questions N`      | Number of questions (default: 10) | `--questions 20`              |
| `--difficulty LEVEL` | easy, medium, hard                | `--difficulty hard`           |
| `--duration N`       | Duration in minutes               | `--duration 90`               |
| `--topics "..."`     | Comma-separated topics            | `--topics "ANOVA,regression"` |
| `--no-formulas`      | Exclude formula sheet             | `--no-formulas`               |
| `--no-solutions`     | Exclude solution key              | `--no-solutions`              |
| `--variations N`     | Generate N versions               | `--variations 3`              |
| `--dry-run`          | Preview without API calls         | `--dry-run`                   |

#### Example Output (Simulated) (Practice exam for)

```
🎓 Generating midterm exam...
📊 10 questions, 60 minutes

✅ Exam generated successfully!
📁 File: exam-midterm-1738097234.json

📊 Exam Statistics:
  Type: midterm
  Questions: 10
  Total Points: 100
  Duration: 60 minutes
  Tokens Used: 3,456

📝 Question Types:
  multiple-choice: 6
  short-answer: 2
  essay: 1
  true-false: 1

📋 Sample Questions:
  Q1 [multiple-choice]: What is the primary purpose of hypothesis testing in...
  Q2 [short-answer]: Explain the difference between Type I and Type II errors...
  Q3 [essay]: Design a study to test the effectiveness of...
```

#### Tips & Gotchas (Practice exam for)

- Default question count is 10, adjust based on time available
- Use `--variations` to create multiple exam versions for test security
- Formula sheets are included by default for statistics exams
- JSON output can be converted to LaTeX, Canvas QTI, or Markdown
- Use `--dry-run` first to preview structure without API costs

---

### `/teaching:quiz` - Create Quiz Questions

Generate quick quizzes with mixed question types for formative assessment.

#### Basic Usage (/teachingquiz - Create)

```bash
# Basic 10-question quiz
/teaching:quiz "Linear Regression"

# 5-question easy quiz
/teaching:quiz "Confidence Intervals" 5 --difficulty easy

# Mixed difficulty with Canvas export
/teaching:quiz "Sampling" 8 --difficulty mixed --format canvas
```

#### Common Options (Mixed difficulty with)

| Option               | Description                          | Example              |
| -------------------- | ------------------------------------ | -------------------- |
| `--questions N`      | Number of questions (default: 10)    | `--questions 15`     |
| `--difficulty LEVEL` | easy, medium, hard, mixed            | `--difficulty mixed` |
| `--format FMT`       | markdown, canvas, moodle, pdf, latex | `--format canvas`    |
| `--dry-run`          | Preview structure                    | `--dry-run`          |

#### Question Type Distribution (Default)

```
10-question quiz breakdown:
  6 Multiple Choice (60%)  - Test concepts
  2 True/False (20%)       - Quick fact checks
  1 Short Answer (10%)     - Deeper understanding
  1 Calculation (10%)      - Applied problems
```

#### Example Output (Simulated) (Mixed difficulty with)

```markdown
# Quiz: Linear Regression

**Instructions:** Select the best answer for each question.

---

## Question 1 (Multiple Choice)

What does the slope coefficient in simple linear regression represent?

A) The y-intercept when x = 0
B) The average change in y for a one-unit increase in x
C) The correlation between x and y
D) The total variation explained by the model

**Answer:** B
**Explanation:** The slope coefficient β₁ represents the expected change in the
response variable y for each one-unit increase in the predictor x.
**Learning Objective:** Interpret regression coefficients
**Difficulty:** Medium

---

## Question 2 (True/False)

A larger R² value always indicates a better regression model.

**Answer:** False
**Explanation:** While R² measures goodness of fit, it doesn't account for model
complexity or overfitting. Adjusted R² is better for comparing models.
```

#### Tips & Gotchas (Question 2 (True/False))

- Default difficulty is "mixed" for varied assessment
- Canvas/Moodle exports work with LMS import tools
- Include answer explanations for student learning
- Time estimate: 1-2 minutes per question
- Map questions to learning objectives for alignment

---

### `/teaching:assignment` - Generate Homework

Create comprehensive homework assignments with solutions, rubrics, and grading criteria.

#### Basic Usage (/teachingassignment - Generate)

```bash
# Basic homework assignment
/teaching:assignment "Linear Regression"

# 5-problem intermediate homework
/teaching:assignment homework --problems 5 --difficulty intermediate

# Lab with R code
/teaching:assignment lab --topic "Bootstrap Methods" --include-code --language R

# Problem set for multiple topics
/teaching:assignment problem-set --topics "ANOVA,regression" --week 8
```

#### Common Options (Problem set for)

| Option               | Description                      | Example                    |
| -------------------- | -------------------------------- | -------------------------- |
| `--problems N`       | Number of problems (default: 5)  | `--problems 8`             |
| `--points N`         | Total points (default: 100)      | `--points 50`              |
| `--difficulty LEVEL` | beginner, intermediate, advanced | `--difficulty advanced`    |
| `--topics "..."`     | Multiple topics                  | `--topics "t-tests,ANOVA"` |
| `--week N`           | Course week number               | `--week 5`                 |
| `--include-code`     | Add programming problems         | `--include-code`           |
| `--language LANG`    | R, Python, Julia                 | `--language Python`        |
| `--no-solutions`     | Omit solution key                | `--no-solutions`           |
| `--no-rubric`        | Omit grading rubric              | `--no-rubric`              |

#### Example Output Structure (Simulated)

```json
{
  "title": "Homework 3: Linear Regression",
  "assignment_type": "homework",
  "due_date": "Friday, Week 4 by 11:59 PM",
  "total_points": 100,
  "estimated_time": "2-3 hours",
  "problems": [
    {
      "id": "P1",
      "text": "Consider the regression model Y = β₀ + β₁X + ε...",
      "points": 20,
      "parts": [
        {"label": "a", "text": "Derive the OLS estimator...", "points": 10},
        {"label": "b", "text": "Show that it is unbiased...", "points": 10}
      ],
      "difficulty": "medium",
      "topic": "OLS Estimation"
    }
  ],
  "solutions": {
    "P1": {
      "answer": "The OLS estimator is...",
      "steps": ["Step 1: Minimize SSE...", "Step 2: Take derivative..."]
    }
  },
  "rubric": {
    "P1": {
      "full_credit": "Correct derivation with clear steps",
      "partial_credit": [
        {"points": 15, "criteria": "Correct approach, algebraic errors"}
      ]
    }
  }
}
```

#### Tips & Gotchas (Problem set for)

- Default difficulty distribution: 20% easy, 50% medium, 25% hard, 5% challenge
- Multi-part problems break complex tasks into manageable steps
- Solutions include step-by-step work, not just final answers
- LaTeX math notation is automatically formatted
- Use `--include-code` for computational statistics courses

---

### `/teaching:slides` - Create Lecture Slides

Generate lecture slide outlines in multiple presentation formats.

#### Basic Usage (/teachingslides - Create)

```bash
# 50-minute lecture (default)
/teaching:slides "Multiple Regression"

# 75-minute lecture
/teaching:slides "Hypothesis Testing" 75

# Reveal.js HTML slides
/teaching:slides "ANOVA" 50 --format reveal.js
```

#### Common Options (Reveal.js HTML slides)

| Option         | Description                         | Example           |
| -------------- | ----------------------------------- | ----------------- |
| `--duration N` | Lecture duration in minutes         | `--duration 90`   |
| `--slides N`   | Explicit slide count                | `--slides 25`     |
| `--format FMT` | markdown, reveal.js, beamer, quarto | `--format beamer` |
| `--dry-run`    | Preview structure                   | `--dry-run`       |

#### Slide Type Mix (Default)

```
50-minute lecture (~20 slides):
  - 1 Title slide
  - 1 Learning objectives
  - 14 Content slides (70%)
  - 3 Practice/example slides (15%)
  - 1 Summary slide

Timing: ~2.5 minutes per slide
```

#### Example Output (Simulated) (Reveal.js HTML slides)

```json
{
  "title": "Multiple Regression",
  "duration_minutes": 50,
  "slides": [
    {
      "id": "S1",
      "type": "title",
      "title": "Multiple Regression",
      "content": "STAT 440 | Week 5"
    },
    {
      "id": "S3",
      "type": "content",
      "title": "The Multiple Regression Model",
      "content": "Extends simple regression: Y = β₀ + β₁X₁ + β₂X₂ + ε",
      "bullets": ["Multiple predictors", "Same OLS principle"],
      "speaker_notes": "Spend 3 minutes on this. Ask class: why multiple predictors?"
    },
    {
      "id": "S5",
      "type": "practice",
      "title": "Try It: Interpretation",
      "content": "Given output, interpret β₂...",
      "speaker_notes": "Give 2 minutes to work individually, then discuss"
    }
  ]
}
```

#### Tips & Gotchas (Reveal.js HTML slides)

- One concept per slide (avoid overcrowding)
- Mix content with practice every 3-4 slides
- Speaker notes include timing suggestions
- Reveal.js creates interactive HTML presentations
- Beamer produces professional academic PDFs
- This is for **visual slides**, not instructor notes (use `/teaching:lecture` for that)

---

### `/teaching:lecture` - Generate Instructor Notes

Create comprehensive 20-40 page instructor-facing lecture notes in Quarto format.

#### Basic Usage (/teachinglecture - Generate)

```bash
# Generate from topic
/teaching:lecture "Multiple Regression"

# Generate from lesson plan
/teaching:lecture --from-plan=week03

# Python code examples
/teaching:lecture "Machine Learning Intro" --language=python --level=graduate
```

#### Common Options (Python code examples)

| Option             | Description                   | Example              |
| ------------------ | ----------------------------- | -------------------- |
| `--from-plan=WEEK` | Use lesson plan               | `--from-plan=week05` |
| `--output PATH`    | Output directory              | `--output lectures/` |
| `--format FMT`     | html,pdf,docx                 | `--format html,pdf`  |
| `--language LANG`  | r, python                     | `--language python`  |
| `--level LEVEL`    | undergraduate, graduate, both | `--level graduate`   |
| `--dry-run`        | Show outline only             | `--dry-run`          |

#### Distinction from `/teaching:slides`

| Aspect      | `/teaching:slides`    | `/teaching:lecture`    |
| ----------- | --------------------- | ---------------------- |
| **Purpose** | Visual presentation   | Instructor reference   |
| **Format**  | Reveal.js/Beamer      | Quarto document (.qmd) |
| **Length**  | ~20-30 slides         | 20-40 pages            |
| **Content** | Bullets, minimal text | Comprehensive prose    |
| **Code**    | Display snippets      | Full executable blocks |
| **Usage**   | Project in class      | Read while teaching    |

#### Example Output (Simulated) (Python code examples)

```
📝 Generating lecture notes: Multiple Regression
📄 Format: Quarto (.qmd) → html,pdf,docx

✅ Lecture notes generated successfully!
📁 File: content/lectures/multiple-regression.qmd

📊 Statistics:
  Sections: 8
  Est. Pages: ~28
  Code Blocks: 12
  Math Equations: 45
  Practice Problems: 6
  Generation Time: 23.4s

📦 To render:
   quarto render content/lectures/multiple-regression.qmd
```

#### Section Types

- **introduction** - Overview and motivation
- **concept** - Comprehensive explanatory content
- **definition** - Formal definitions with notation
- **example** - Worked examples with solutions
- **code** - Executable R/Python code blocks
- **practice** - Practice problems with solutions
- **summary** - Key takeaways

#### Tips & Gotchas (Python code examples)

- This generates **long-form documents**, not slides
- Use `--from-plan` to integrate with lesson planning
- Quarto renders to multiple formats from single source
- Code blocks are fully executable (not just display)
- For cross-listed courses, use `level: "both"` to generate differentiated callouts
- Render with `quarto render <file>.qmd`

---

### `/teaching:syllabus` - Create Course Syllabus

Generate comprehensive course syllabi with policies, schedules, and grading information.

#### Basic Usage (/teachingsyllabus - Create)

```bash
# Basic syllabus
/teaching:syllabus "Introduction to Statistics"

# Syllabus with semester
/teaching:syllabus "Regression Analysis" "Fall 2026"

# 12-week course
/teaching:syllabus "STAT-440" --weeks 12
```

#### Common Options (12-week course)

| Option         | Description                   | Example        |
| -------------- | ----------------------------- | -------------- |
| `--weeks N`    | Number of weeks (default: 15) | `--weeks 16`   |
| `--format FMT` | markdown, pdf, latex          | `--format pdf` |
| `--dry-run`    | Preview structure             | `--dry-run`    |

#### Output Structure (Simulated)

```json
{
  "title": "Regression Analysis",
  "course_code": "STAT 440",
  "semester": "Fall 2026",
  "credits": 3,
  "instructor": {
    "name": "Dr. Smith",
    "email": "smith@university.edu",
    "office_hours": "MW 2-4 PM"
  },
  "learning_objectives": [
    "Apply simple and multiple regression models to real data",
    "Interpret regression coefficients and assess model fit",
    "Diagnose and address violations of regression assumptions"
  ],
  "grading": {
    "components": [
      {"name": "Homework", "percentage": 25},
      {"name": "Midterm", "percentage": 25},
      {"name": "Final Exam", "percentage": 30}
    ]
  },
  "schedule": [
    {
      "week": 1,
      "topic": "Introduction to Regression",
      "readings": ["Chapter 1"],
      "assignments_due": []
    }
  ]
}
```

#### Included Policies (Default)

- Academic integrity statement
- Accessibility/accommodations
- Attendance expectations
- Late work policy
- Communication policy
- Mental health resources
- Diversity statement

Use `--no-policies` to exclude standard templates.

#### Tips & Gotchas (12-week course)

- Reads course info from `.flow/teach-config.yml` if available
- Use measurable learning objectives (apply, analyze, evaluate vs. "understand")
- Include all key dates (exams, project deadlines, holidays)
- Grading breakdown should sum to 100%
- Export to LaTeX for professional formatting

---

### `/teaching:rubric` - Generate Grading Rubrics

Create detailed grading rubrics with performance levels and point allocations.

#### Basic Usage (/teachingrubric - Generate)

```bash
# Basic rubric
/teaching:rubric "data analysis project"

# 100-point rubric
/teaching:rubric "research paper" 100

# 5-level rubric
/teaching:rubric "lab report" --points 50 --levels 5
```

#### Common Options (5-level rubric)

| Option         | Description                     | Example                |
| -------------- | ------------------------------- | ---------------------- |
| `--points N`   | Total points (default: 100)     | `--points 50`          |
| `--levels N`   | Performance levels (default: 4) | `--levels 5`           |
| `--format FMT` | markdown, spreadsheet, pdf      | `--format spreadsheet` |
| `--dry-run`    | Preview structure               | `--dry-run`            |

#### Example Output (Simulated) (5-level rubric)

```markdown
# Grading Rubric: Data Analysis Project

**Total Points:** 100

## Rubric

| Criterion           | Excellent (A)                                | Proficient (B)                  | Developing (C)            | Needs Work (D)        | Points |
| ------------------- | -------------------------------------------- | ------------------------------- | ------------------------- | --------------------- | ------ |
| Code Quality        | Clean, efficient, well-documented            | Functional, mostly documented   | Works but messy           | Errors present        | 25 pts |
| Statistical Methods | Appropriate methods, all assumptions checked | Mostly appropriate, some checks | Basic methods, few checks | Inappropriate methods | 30 pts |
| Interpretation      | Thorough, accurate, contextual               | Accurate, adequate context      | Partially correct         | Major errors          | 20 pts |
| Visualizations      | Publication-quality, clear labels            | Good quality, mostly clear      | Basic, some issues        | Poor quality          | 15 pts |
| Writing             | Clear, professional, well-organized          | Generally clear, minor issues   | Somewhat unclear          | Difficult to follow   | 10 pts |

## Criterion Descriptions

### Code Quality (25 points)
- **Excellent (23-25):** Code is reproducible, efficiently organized, with clear comments
- **Proficient (20-22):** Code works correctly, adequate documentation
- **Developing (17-19):** Code runs but organization needs improvement
- **Needs Work (<17):** Code has errors or lacks documentation
```

#### Point Allocation Guidelines

```
Typical distribution:
  - Technical correctness: 40-50%
  - Communication/presentation: 20-30%
  - Analysis/interpretation: 20-30%
  - Creativity/originality: 5-10% (optional)
```

#### Tips & Gotchas (Code Quality (25)

- Use specific, observable criteria (not vague like "good work")
- Performance levels should clearly distinguish quality differences
- Point ranges should be consistent across levels
- Include both objective and subjective measures
- Share rubric with students **before** assignment
- Avoid too many criteria (focus on key skills)

---

### `/teaching:feedback` - Generate Student Feedback

Create personalized, constructive feedback for student assignments with specific improvement suggestions.

#### Basic Usage (/teachingfeedback - Generate)

```bash
# Basic feedback
/teaching:feedback "Homework 3"

# Feedback with score
/teaching:feedback "Midterm Exam" 72

# Letter grade feedback
/teaching:feedback "Research Paper" B+

# Focus on specific areas
/teaching:feedback "Lab Report" 85 --areas "analysis,interpretation"
```

#### Common Options (Focus on specific)

| Option         | Description                   | Example                      |
| -------------- | ----------------------------- | ---------------------------- |
| `--score N`    | Numeric or letter grade       | `--score 85` or `--score B+` |
| `--areas LIST` | Focus areas (comma-separated) | `--areas "code,writing"`     |
| `--format FMT` | markdown, pdf                 | `--format pdf`               |
| `--dry-run`    | Preview template              | `--dry-run`                  |

#### Feedback Structure (Template)

```markdown
# Feedback: Homework 3: Confidence Intervals

**Student:** [Name]
**Score:** 85/100 (85%)
**Date:** 2026-02-20

---

## Overall Assessment

Your work demonstrates solid understanding of confidence interval concepts. You correctly
applied the formulas and showed clear work. To strengthen future submissions, focus on
interpretation and explaining statistical results in context.

**Grade:** B

---

## Strengths

Your work demonstrated several strengths:

✓ Correct application of confidence interval formula with appropriate critical values
✓ Clear step-by-step work showing all calculations
✓ Proper notation and formatting throughout

---

## Areas for Improvement

To strengthen your work, focus on:

1. **Statistical Interpretation**
   - Your interpretation of the 95% CI suggests certainty about the parameter
   - Remember: The interval either contains the parameter or it doesn't (not probabilistic)
   - Correct: "We are 95% confident that the true mean is in this interval"
   - Review: Section 8.2 on interpretation of confidence intervals

2. **Contextual Understanding**
   - Provide context when stating intervals (not just numbers)
   - Example: "The mean GPA is between 3.06 and 3.34" instead of just "(3.06, 3.34)"

---

## Detailed Comments

### Problem 1 (10/10)
Excellent work. Correct formula, proper calculation, and clear presentation.

### Problem 2 (12/15)
Good understanding shown, but your interpretation statement needs refinement. See note
above about probabilistic vs. confidence interpretation.

### Problem 3 (13/15)
Correct identification of the two methods to narrow intervals. Consider also mentioning
that we typically don't lower confidence level in practice (ethical considerations).

---

## Recommendations

### To improve your understanding
- Re-read Section 8.2 on interpreting confidence intervals
- Practice problems 8.15-8.20 focusing on interpretation
- Watch video: "What Does 95% Confident Really Mean?" (course website)

**Office Hours:** MW 2-4 PM
**Tutoring Center:** MWF 10-12, Science Building 101

---

## Looking Ahead

You're building strong foundational skills in statistical inference. With more attention
to interpretation, you'll be well-prepared for hypothesis testing (next unit).

### Next Steps
- Review interpretation guidelines before next assignment
- Come to office hours if you'd like to discuss any problems

Remember, statistical thinking is about communicating uncertainty clearly—keep
practicing!

---

**Questions?** Please come to office hours or email me if you'd like to discuss this feedback.
```

#### Constructive Phrasing Guide

| No Avoid                 | Yes Use Instead                            |
| ------------------------ | ------------------------------------------ |
| "You forgot to..."       | "Consider adding..."                       |
| "This is wrong"          | "This section could be strengthened by..." |
| "This isn't good enough" | "For even better results..."               |
| "You should have..."     | "Next time, try..."                        |

#### Tips & Gotchas (Next Steps)

- Always include both strengths and areas for improvement
- Be specific (not "good job"—say what was good)
- Make suggestions actionable (not "study more"—say what to study)
- Use growth mindset language ("you're developing these skills")
- Provide concrete resources for improvement
- Balance encouragement with honest assessment

---

## Utility Commands

### `/teaching:demo` - Create Demo Course

Set up a complete demo course environment with examples and test materials.

#### Basic Usage (/teachingdemo - Create)

```bash
# Create in default location
/teaching:demo

# Custom path
/teaching:demo ~/my-test-course

# Create and verify
/teaching:demo --verify

# Force overwrite (for CI)
/teaching:demo ~/test --force --verify --quiet
```

#### Common Options (Force overwrite (for)

| Option     | Description              | Example    |
| ---------- | ------------------------ | ---------- |
| `--verify` | Run tests after creation | `--verify` |
| `--force`  | Overwrite without prompt | `--force`  |
| `--quiet`  | Minimal output (CI mode) | `--quiet`  |

#### What Gets Created

```
demo-course/
├── .flow/
│   └── teach-config.yml       # STAT-101 course config
├── README.md                   # Testing instructions
├── TEST-CHECKLIST.md           # Manual verification checklist
├── sample-student-work.md      # For feedback testing
└── examples/
    ├── exam-midterm.json       # Sample exam
    ├── quiz-descriptive.md     # Sample quiz
    ├── syllabus-stat101.md     # Sample syllabus
    ├── assignment-regression.md
    ├── rubric-project.md
    └── slides-probability.md
```

#### Example Output (Simulated) (Force overwrite (for)

```
✅ Created demo course at ./demo-course/

Files:
  ✓ .flow/teach-config.yml    Course configuration
  ✓ README.md                  Testing instructions
  ✓ TEST-CHECKLIST.md          Manual test checklist
  ✓ sample-student-work.md     For feedback testing
  ✓ examples/ (6 files)        Pre-generated samples

Next steps:
  cd demo-course
  /teaching:exam midterm     ← Try generating an exam
  /teaching:quiz "topic"     ← Try generating a quiz
```

#### Tips & Gotchas (Force overwrite (for)

- Perfect for testing before using on real course
- Contains realistic STAT-101 content
- All examples are fully functional
- Use `--verify` to run smoke tests
- Use `--force` in CI/CD pipelines

---

### `/teaching:validate` - Validate YAML Configs

Validate YAML configuration files against schemas with multi-level validation.

#### Basic Usage (/teachingvalidate - Validate)

```bash
# Validate single file
/teaching:validate content/lesson-plans/week03.yml

# Validate all configs
/teaching:validate --all

# Schema-level validation only
/teaching:validate --level=schema content/lesson-plans/

# Strict mode (warnings = errors)
/teaching:validate --strict --all

# Auto-fix issues
/teaching:validate --fix content/lesson-plans/week03.yml
```

#### Validation Levels

| Level          | Checks         | Example Errors                                      |
| -------------- | -------------- | --------------------------------------------------- |
| **syntax**     | YAML parsing   | Indentation errors, invalid syntax                  |
| **schema**     | Structure      | Missing required fields, wrong types                |
| **semantic**   | Business logic | Activity time > lecture time, unassessed objectives |
| **cross-file** | References     | Missing dataset files, invalid prerequisites        |

#### Common Options (Auto-fix issues)

| Option          | Description             | Example          |
| --------------- | ----------------------- | ---------------- |
| `--all`         | Validate all YAML files | `--all`          |
| `--level LEVEL` | Stop after level        | `--level=schema` |
| `--strict`      | Warnings = errors       | `--strict`       |
| `--quiet`       | Only show errors        | `--quiet`        |
| `--json`        | JSON output             | `--json`         |
| `--fix`         | Auto-fix issues         | `--fix`          |
| `--auto`        | Safe fixes only (CI)    | `--auto`         |
| `--dry-run`     | Preview fixes           | `--dry-run`      |

#### Example Output (Simulated) (Auto-fix issues)

```
content/lesson-plans/week03.yml:15:3: error: Missing required field: level
  Rule: schema:required
  Suggestion: Add "level" with Bloom's taxonomy value

content/lesson-plans/week03.yml:42: warning: Activity time (90 min) exceeds lecture time (75 min)
  Rule: semantic:duration-overflow

───────────────────────────────────────────────────────
Validation: 1 error, 1 warning in 1 file (45ms)
```

#### Auto-Fix Example

```
✗ content/lesson-plans/week03.yml

  Available fixes:

  ✓ Auto-fixable (2):
    1. [syntax] Normalize YAML formatting
       → Normalized indentation to 2 spaces
       → Removed trailing whitespace

  ⚠ Requires confirmation (1):
    3. [schema] Add required field 'duration' with default value
       Before: { title: "Lecture" }
       After:  { title: "Lecture", duration: 30 }

  Apply unsafe fixes? (Y/n)
```

#### Tips & Gotchas (Auto-fix issues)

- Run before committing YAML changes
- `--strict` mode useful in CI/CD
- `--fix` with `--auto` applies safe fixes only
- Use `--dry-run` to preview changes
- IDE-compatible output format (like eslint)

---

### `/teaching:sync` - Sync YAML to JSON

Synchronize YAML configuration files to JSON format (YAML is source of truth).

#### Basic Usage (/teachingsync - Sync)

```bash
# Sync changed files only
/teaching:sync

# Sync all files (ignore cache)
/teaching:sync --all

# Sync specific file
/teaching:sync --file content/lesson-plans/week03.yml

# Show sync status
/teaching:sync --status

# Preview without writing
/teaching:sync --dry-run
```

#### Common Options (Preview without writing)

| Option        | Description                  | Example             |
| ------------- | ---------------------------- | ------------------- |
| `--all`       | Sync all (force resync)      | `--all`             |
| `--file PATH` | Sync specific file           | `--file week03.yml` |
| `--status`    | Show sync status             | `--status`          |
| `--dry-run`   | Preview only                 | `--dry-run`         |
| `--force`     | Force sync (alias for --all) | `--force`           |
| `--quiet`     | Suppress output              | `--quiet`           |

#### How It Works

```
YAML (source of truth)        JSON (auto-generated)
  ↓                              ↓
week03.yml  ────[sync]───→  week03.json
  ↓                              ↓
Edit YAML                    Used by commands
  ↓                              ↓
Run /teaching:sync          JSON updated
```

#### Example Output (Simulated) (Preview without writing)

```
Syncing YAML → JSON...

✓ content/lesson-plans/week03.yml → week03.json (32ms)
✓ content/lesson-plans/week04.yml → week04.json (28ms)
○ content/lesson-plans/week05.yml (unchanged, skipped)

───────────────────────────────────────────────────────
Synced: 2 files, 0 skipped (84ms)
```

#### Tips & Gotchas (Preview without writing)

- Runs automatically via pre-commit hook (if installed)
- Hash-based change detection (<100ms latency)
- JSON files should NOT be manually edited
- Sync before running teaching commands
- Use `--status` to check which files need sync

---

### `/teaching:migrate` - Migrate Schema Versions

Automatically upgrade YAML configuration files from schema v1 to v2.

#### Basic Usage (/teachingmigrate - Migrate)

```bash
# Detect v1 files
/teaching:migrate --detect

# Preview migration
/teaching:migrate --dry-run

# Apply migration with git commit
/teaching:migrate

# Migrate specific file
/teaching:migrate --file week-01.yml

# Apply without git commit
/teaching:migrate --no-git
```

#### Common Options (Apply without git)

| Option           | Description                   | Example             |
| ---------------- | ----------------------------- | ------------------- |
| `--detect`       | Find v1 files                 | `--detect`          |
| `--dry-run`      | Preview changes               | `--dry-run`         |
| `--file PATH`    | Migrate specific file         | `--file week01.yml` |
| `--no-git`       | Skip git commit               | `--no-git`          |
| `--no-git-check` | Skip safety check (dangerous) | `--no-git-check`    |

#### Migration Behavior

- **Atomic:** All-or-nothing (if any fails, all rollback)
- **Git safety:** Checks for uncommitted changes first
- **Auto-commit:** Creates descriptive commit with stats
- **Rollback:** Restores exact original on failure

#### Example Output (Simulated) (Apply without git)

```
🔍 Detecting v1 schema files...

Found 3 files requiring migration:
  content/lesson-plans/week01.yml  [simple]
  content/lesson-plans/week02.yml  [simple]
  content/lesson-plans/week05.yml  [complex]

Complexity:
  Simple: 2 files
  Complex: 1 file

───────────────────────────────────────────────────────

🔄 Migrating 3 files...

✓ week01.yml: topics → content.topics (4 changes)
✓ week02.yml: activities[] restructured (8 changes)
✓ week05.yml: teaching_style added (2 changes)

✅ Migration complete: 3 files, 14 total changes

📝 Git commit created:
   chore: migrate 3 lesson plans to schema v2.0
```

#### Migration Rules

- Field renames (e.g., `topics` → `content.topics`)
- Type conversions (string → array)
- Add missing required fields
- Update `schema_version` to "2.0"

#### Tips & Gotchas (Apply without git)

- Backup before migration (or use `--dry-run` first)
- Git safety check prevents accidental data loss
- Atomic semantics ensure consistency
- Use `--detect` to assess migration scope
- All files migrate together (no partial migrations)

---

### `/teaching:diff` - Compare YAML vs JSON

Compare YAML source files with auto-generated JSON to detect sync issues.

#### Basic Usage (/teachingdiff - Compare)

```bash
# Diff specific file
/teaching:diff content/lesson-plans/week03.yml

# Diff all files
/teaching:diff --all

# Summary only
/teaching:diff --all --summary

# Auto-sync out-of-sync files
/teaching:diff content/lesson-plans/week03.yml --force-sync
```

#### Common Options (Auto-sync out-of-sync files)

| Option         | Description                 | Example        |
| -------------- | --------------------------- | -------------- |
| `--all`        | Compare all YAML/JSON pairs | `--all`        |
| `--summary`    | Summary only (no details)   | `--summary`    |
| `--verbose`    | Show timestamps             | `--verbose`    |
| `--json`       | JSON output                 | `--json`       |
| `--force-sync` | Auto-sync mismatches        | `--force-sync` |
| `--quiet`      | Only show out-of-sync       | `--quiet`      |

#### Example Output (Simulated) (Auto-sync out-of-sync files)

```
Comparing: content/lesson-plans/week03.yml ↔ week03.json

Status: ✗ Out of sync

  ~ learning_objectives[0].level:15: "understand" → "apply"
  + topics[3]:45: added in JSON → {"id": "T-3.4", "name": "Extra topic"}
  - materials.datasets[1]:62: missing in JSON ← {"name": "extra-data"}

───────────────────────────────────────────────────────
Summary: +1 added, -1 removed, ~1 changed (23ms)
Run /teaching:sync --force to resync
```

#### Change Types

| Symbol | Type         | Description                        |
| ------ | ------------ | ---------------------------------- |
| `+`    | added        | Present in JSON but not in YAML    |
| `-`    | removed      | Present in YAML but not in JSON    |
| `~`    | changed      | Different values in YAML vs JSON   |
| `!`    | type-changed | Data type differs (array → object) |

#### Tips & Gotchas (Auto-sync out-of-sync files)

- Use before running commands if edits made to YAML
- `--force-sync` auto-fixes discrepancies
- YAML is always source of truth
- JSON should not be manually edited
- Useful for debugging sync issues

---

## Common Workflows

### 1. Create New Course from Scratch

```bash
# Step 1: Set up demo course for testing
/teaching:demo ~/courses/stat440-fall2026 --verify

# Step 2: Customize config
cd ~/courses/stat440-fall2026
# Edit .flow/teach-config.yml with course details

# Step 3: Generate syllabus
/teaching:syllabus "STAT 440: Regression Analysis" "Fall 2026"

# Step 4: Create weekly materials
/teaching:lecture "Introduction to Regression" --week 1
/teaching:slides "Introduction to Regression" 50
/teaching:assignment "Simple Linear Regression" --problems 5

# Step 5: Create assessments
/teaching:quiz "Simple Regression" 10
/teaching:exam midterm --questions 15
```

### 2. Generate Exam Week Materials

```bash
# Create exam
/teaching:exam midterm --questions 20 --duration 90 --difficulty mixed

# Create exam variations
/teaching:exam midterm --variations 3

# Create practice materials
/teaching:quiz "Review Topics" 15 --difficulty mixed

# Create rubric
/teaching:rubric "Midterm Exam" 100
```

### 3. Weekly Teaching Workflow

```bash
# Monday: Prep for week
/teaching:lecture "Topic" --from-plan=week08
/teaching:slides "Topic" 75

# Wednesday: Create assignment
/teaching:assignment "Topic Practice" --problems 5 --week 8

# Friday: Grade and give feedback
/teaching:feedback "Homework 7" --areas "interpretation,code"
```

### 4. Course Maintenance Workflow

```bash
# Validate all configs 2
/teaching:validate --all --strict

# Check sync status
/teaching:sync --status

# Sync any out-of-sync files
/teaching:sync --all

# Compare for discrepancies
/teaching:diff --all --summary
```

### 5. Schema Migration Workflow

```bash
# Step 1: Detect v1 files
/teaching:migrate --detect

# Step 2: Preview migration
/teaching:migrate --dry-run

# Step 3: Create backup
git add -A
git commit -m "backup: before schema migration"

# Step 4: Apply migration
/teaching:migrate

# Step 5: Validate results
/teaching:validate --all --strict
```

---

## Configuration

All teaching commands use `.flow/teach-config.yml` for course settings.

### Minimal Config

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: undergraduate
    field: statistics
```

### Full Config Example

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: undergraduate        # or: graduate, both
    field: statistics
    difficulty: intermediate    # beginner, intermediate, advanced
    semester: "Fall 2026"
    credits: 3
    instructor:
      name: "Dr. Jane Smith"
      email: "jsmith@university.edu"
      office: "Science Building 302"
      office_hours: "MW 2-4pm"

  defaults:
    exam_format: markdown       # markdown, latex, canvas
    lecture_format: quarto      # markdown, quarto
    question_types:
      - multiple-choice
      - short-answer
      - essay
      - true-false
      - calculation

  style:
    tone: formal                # formal, conversational
    notation: statistical       # LaTeX math style
    examples: true              # Include worked examples

  topics:
    - "Simple Linear Regression"
    - "Multiple Regression"
    - "Model Diagnostics"
    - "Variable Selection"
    - "Categorical Predictors"

  grading:
    homework: 25
    quizzes: 10
    midterm: 25
    final: 30
    participation: 10

  ai_generation:
    model: "claude-3-5-sonnet-20241022"
    temperature: 0.7
    max_tokens: 4096
```

---

## Global Options

These options work with most commands:

| Option          | Description                  | Example                  |
| --------------- | ---------------------------- | ------------------------ |
| `--dry-run`     | Preview without API calls    | `--dry-run`              |
| `--json`        | JSON output (with --dry-run) | `--json`                 |
| `--config PATH` | Explicit config file         | `--config ../course.yml` |
| `--debug`       | Enable debug logging         | `--debug`                |
| `--quiet`       | Minimal output               | `--quiet`                |
| `--strict`      | Treat warnings as errors     | `--strict`               |

---

## Troubleshooting

### "Config not found"

```bash
# Check for config file
ls .flow/teach-config.yml

# Create demo config
/teaching:demo --config-only

# Or specify explicit path
/teaching:exam midterm --config /path/to/config.yml
```

### "YAML syntax error"

```bash
# Validate YAML
/teaching:validate content/lesson-plans/week03.yml

# Auto-fix
/teaching:validate --fix content/lesson-plans/week03.yml
```

### "Out of sync warning"

```bash
# Check sync status 2
/teaching:sync --status

# Sync all files
/teaching:sync --all

# Or sync specific file
/teaching:sync --file content/lesson-plans/week03.yml
```

### "Schema validation failed"

```bash
# Run full validation
/teaching:validate --all --level=cross-file

# Check what level fails
/teaching:validate --level=syntax content/lesson-plans/week03.yml
/teaching:validate --level=schema content/lesson-plans/week03.yml
```

### "API rate limit"

```bash
# Use -dry-run to preview without API
/teaching:exam midterm --dry-run

# Reduce token usage
/teaching:quiz "topic" --questions 5  # Fewer questions = fewer tokens
```

---

## Quick Tips

### Speed Up Generation

- Use `--dry-run` to preview structure before full generation
- Reduce question counts for faster generation
- Cache generated content and modify manually if needed

### Save API Costs

- Generate once, export to multiple formats
- Use `--variations` instead of separate generations
- Preview with `--dry-run --json` to verify options

### Ensure Quality

- Run `--dry-run` first to check structure
- Use `--strict` validation before generation
- Validate YAML configs before running commands

### Maintain Consistency

- Use `.flow/teach-config.yml` for all commands
- Run `/teaching:sync` regularly
- Validate with `--all --strict` before sharing

### Collaborate Effectively

- Keep YAML in version control (not JSON)
- Run `/teaching:sync` before committing
- Use `/teaching:validate --strict` in CI/CD

---

## Related Resources

- **Status:** `.STATUS` file in project root
- **Config Reference:** `docs/DEEP-DIVE-teach-config-architecture.md`

---

**Version:** Scholar v{{ scholar.version }}
**Generated:** 2026-01-28
**Author:** Claude Code Assistant
