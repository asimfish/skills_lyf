# Tutorial: Creating a Demo Course

**Time:** 5 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running

**What you'll learn:**

- Create a fully-configured demo course with one command
- Explore generated configuration files and examples
- Customize course settings for your needs
- Generate teaching materials from demo templates
- Use the demo as a testing environment

---

## Step 1: Prerequisites Check ⏱️ 30 seconds

**What to do:**

Verify Scholar is installed and accessible from Claude Code.

**Example:**

In Claude Code, type:

```bash
/teaching:demo --help
```

**Expected output:**

```
Create Demo Course

Usage: /teaching:demo [path] [options]

Examples:
  /teaching:demo                    - Create in ./demo-course/
  /teaching:demo ~/my-test-course   - Create at custom path
  /teaching:demo --verify           - Create and run verification tests
```

If you see this help text, you're ready to proceed.

**Checkpoint:**

Scholar is installed and the `/teaching:demo` command is available.

---

## Step 2: Run /teaching:demo ⏱️ 1 minute

**What to do:**

Create a demo course with a realistic statistics curriculum (STAT-101).

**Example:**

```bash
/teaching:demo
```

**What happens:**

Scholar scaffolds a complete course directory:

```
demo-course/
├── .flow/
│   ├── teach-config.yml       # Course configuration
│   └── lesson-plans.yml       # 15-week semester manifest
├── README.md                   # Testing instructions
├── TEST-CHECKLIST.md           # Manual testing guide
├── sample-student-work.md      # For feedback testing
└── examples/
    ├── exam-midterm.json       # 10-question statistics exam
    ├── quiz-descriptive.md     # 5-question descriptive stats quiz
    ├── syllabus-stat101.md     # Complete 15-week syllabus
    ├── assignment-regression.md # Regression homework
    ├── rubric-project.md       # Final project grading rubric
    └── slides-probability.md   # Probability lecture outline
```

**Progress output:**

```
Creating demo course at ./demo-course/

✓ .flow/teach-config.yml      Course configuration
✓ .flow/lesson-plans.yml      15-week manifest (3 detailed + 12 stubs)
✓ README.md                   Testing instructions
✓ TEST-CHECKLIST.md           Manual test checklist
✓ sample-student-work.md      For feedback testing
✓ examples/ (6 files)         Pre-generated samples

Next steps:
  cd demo-course
  /teaching:exam midterm      ← Try generating an exam
```

**Checkpoint:**

Navigate to `demo-course/` and verify the `.flow/` directory exists.

---

## Step 3: Explore Generated Structure ⏱️ 2 minutes

**What to do:**

Examine the three key files Scholar created.

### File 1: `.flow/teach-config.yml`

Open this file to see course-level configuration:

```yaml
scholar:
  course_info:
    code: "STAT-101"
    title: "Introduction to Statistical Methods"
    level: undergraduate
    field: statistics
    difficulty: beginner
    semester: "Spring 2026"
    credits: 3
    instructor:
      name: "Dr. Jane Smith"
      email: "jsmith@university.edu"
      office: "Science Building 302"
      office_hours: "MW 2-4pm, F by appointment"

  defaults:
    exam_format: markdown
    lecture_format: markdown
    question_types:
      - multiple-choice
      - short-answer
      - true-false
      - calculation

  style:
    tone: formal
    notation: statistical
    examples: true

  topics:
    - "Descriptive Statistics"
    - "Probability Fundamentals"
    - "Random Variables"
    - "Sampling Distributions"
    - "Confidence Intervals"
    - "Hypothesis Testing"
    - "Simple Linear Regression"
    - "Correlation Analysis"
    - "Chi-Square Tests"
    - "ANOVA Basics"

  grading:
    homework: 20
    quizzes: 15
    midterm1: 15
    midterm2: 15
    final: 25
    participation: 10
```

**What this controls:**

- Course metadata (title, semester, instructor)
- Default output formats for exams and lectures
- Question types for auto-generation
- Writing style (formal vs conversational)
- Topic list for content generation
- Grading weights

### File 2: `.flow/lesson-plans.yml`

This manifest contains the full semester structure:

```yaml
schema_version: "1.0"

semester:
  total_weeks: 15
  schedule: "TR"              # Tuesday/Thursday
  milestones:
    - week: 8
      type: midterm
      description: "Midterm Exam - Weeks 1-7"
    - week: 16
      type: final
      description: "Final Exam - Comprehensive"

weeks:
  - week: 1
    title: "Course Introduction"
    status: draft
  - week: 3
    title: "Introduction to Linear Regression"
    status: reviewed
    learning_objectives:
      - id: LO-3.1
        text: "Understand the concept of linear regression"
  # ... weeks 2, 4-15 as draft stubs
```

**What this controls:**

- Semester length and schedule
- Week-by-week learning objectives
- Content status tracking (draft/reviewed/published)
- Milestones (exams, breaks, projects)

### File 3: `README.md`

Quick reference for testing all teaching commands:

```markdown
# STAT-101 Demo Course

Try these commands:

### Generate New Materials
- `/teaching:exam "Hypothesis Testing"` - Create an exam
- `/teaching:quiz "Confidence Intervals"` - Create a quiz
- `/teaching:syllabus` - Generate syllabus from config
- `/teaching:assignment "Regression Analysis"` - Create homework
- `/teaching:rubric "Final Project" 100` - Create grading rubric
- `/teaching:slides "Probability"` - Create lecture slides
- `/teaching:feedback sample-student-work.md` - Generate feedback
```

**Checkpoint:**

You should now understand:
- `teach-config.yml` configures course metadata and style
- `lesson-plans.yml` structures the semester week-by-week
- `README.md` provides command examples

---

## Step 4: Customize teach-config.yml ⏱️ 1 minute

**What to do:**

Personalize the demo course for your institution and teaching style.

**Example edits:**

```yaml
scholar:
  course_info:
    code: "STAT-440"                    # Change course code
    title: "Regression Analysis"       # Change course title
    semester: "Fall 2026"              # Update semester
    instructor:
      name: "Dr. Your Name"            # Your name
      email: "your.email@university.edu"

  defaults:
    exam_format: quarto               # Use Quarto instead of Markdown
    lecture_format: quarto

  style:
    tone: conversational              # More informal tone
    examples: true                     # Keep worked examples

  grading:
    homework: 30                       # Adjust weights
    midterm1: 20
    final: 30
    project: 20
```

**Common customizations:**

- **Format preferences:** Change `markdown` to `quarto` or `latex` for exams/lectures
- **Question types:** Remove `true-false`, add `coding` or `proof` types
- **Tone:** Switch between `formal` and `conversational`
- **Topics:** Replace with your actual course topics

**Checkpoint:**

Save your changes and verify the YAML is valid:

```bash
/teaching:validate
```

---

## Step 5: Generate Content from Demo ⏱️ 1 minute

**What to do:**

Use Scholar's teaching commands with your configured demo course.

**Example: Generate an exam**

```bash
/teaching:exam "Descriptive Statistics"
```

Scholar reads `teach-config.yml` and generates an exam with:
- Question types from `defaults.question_types`
- Tone from `style.tone`
- Context from `course_info.field` and `course_info.difficulty`

**Example: Generate a quiz from manifest**

```bash
/teaching:quiz --week 3
```

Scholar reads week 3 from `lesson-plans.yml` and generates questions covering:
- Learning objectives (LO-3.1, LO-3.2, etc.)
- Topics listed in the week entry
- Appropriate difficulty for week 3 material

**Example: Generate complete syllabus**

```bash
/teaching:syllabus
```

Scholar merges `teach-config.yml` and `lesson-plans.yml` to produce a full syllabus with:
- Course information and instructor details
- 15-week schedule from manifest
- Grading breakdown
- Course policies

**Checkpoint:**

You should have generated at least one teaching material (exam, quiz, or syllabus) from the demo configuration.

---

## Step 6: Next Steps ⏱️ 30 seconds

**What to do:**

Now that you have a working demo course, choose your next action:

**Option 1: Use as testing environment**

Keep the demo course and experiment with all teaching commands:

```bash
cd demo-course
/teaching:exam midterm
/teaching:assignment "Regression"
/teaching:rubric "Project" 100
```

**Option 2: Create your real course**

Copy the demo structure to a new location:

```bash
cp -r demo-course/ ~/my-courses/stat-440/
cd ~/my-courses/stat-440/
# Edit .flow/teach-config.yml with real course details
# Edit .flow/lesson-plans.yml with real weekly topics
```

**Option 3: Migrate existing materials**

If you already have `content/lesson-plans/week*.yml` files:

```bash
cd ~/my-courses/existing-course/
/teaching:migrate --to-manifest --dry-run    # Preview migration
/teaching:migrate --to-manifest               # Apply migration
```

---

## Troubleshooting

**Problem:** `/teaching:demo` says "Directory exists. Overwrite? (y/n)"

**Solution:** Either delete the existing `demo-course/` directory or use the `--force` flag:

```bash
/teaching:demo --force
```

---

**Problem:** Generated content doesn't match my course

**Solution:** Edit `.flow/teach-config.yml` and update:
- `course_info.field` (e.g., change from `statistics` to `biology`)
- `course_info.difficulty` (beginner/intermediate/advanced)
- `topics` array with your actual course topics

Then regenerate content.

---

**Problem:** Validation fails after editing config

**Solution:** Check YAML syntax. Common issues:
- Missing quotes around strings with colons (use `"Spring 2026"`)
- Incorrect indentation (use 2 spaces, not tabs)
- Trailing spaces after values

Fix errors and run `/teaching:validate` again.

---

## Summary

You've learned how to:

- Create a complete demo course with `/teaching:demo`
- Understand the generated directory structure
- Customize `teach-config.yml` for your course
- Generate teaching materials using demo configurations
- Use the demo as a testing environment

**Next steps:**

- [Working with Lesson Plans Manifests](lesson-plans-manifest.md) - Deep dive into manifest structure
- [Migrating to Manifest Format](migration.md) - Convert existing courses
- [Your First Exam](first-exam.md) - Generate exams from scratch

**See also:**

- [Phase 2 User Guide](../../PHASE2-USER-GUIDE.md) - Complete configuration reference
- [Command Reference](../../API-REFERENCE.md) - All teaching commands
