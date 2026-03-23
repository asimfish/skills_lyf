# Tutorial: Generating a Course Syllabus

**Time:** 5-7 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- Access to Claude API (ANTHROPIC_API_KEY set)

**What you'll learn:**

- Generate a comprehensive course syllabus with AI assistance
- Customize course information and schedule
- Set semester length and course format
- Export to multiple formats (Markdown, PDF, LaTeX)
- Include standard academic policies

---

## Step 1: Basic Syllabus Generation ⏱️ 2 minutes

**What to do:**

Generate a basic course syllabus using default settings. This creates a 15-week syllabus with standard course components including learning objectives, grading breakdown, weekly schedule, and academic policies.

**Example:**

```bash
/teaching:syllabus "Introduction to Statistics"
```

**What you'll see:**

Scholar will generate a syllabus file with comprehensive course information:

```markdown
# Course Syllabus: Introduction to Statistics

**Semester:** Fall 2026
**Credits:** 3
**Format:** In-person

## Course Information

**Instructor:** [Your Name]
**Email:** [Your Email]
**Office:** [Office Location]
**Office Hours:** [Times]

**Meeting Times:**
- Days: Monday, Wednesday, Friday
- Time: 10:00 AM - 10:50 AM
- Location: [Classroom]

## Course Description

This course introduces students to fundamental concepts in statistical reasoning
and data analysis. Topics include descriptive statistics, probability, sampling
distributions, hypothesis testing, and basic regression analysis.

## Prerequisites

- MATH 101 or equivalent
- Basic algebra skills

## Learning Objectives

By the end of this course, students will be able to:
1. Apply statistical concepts to analyze real-world data
2. Interpret statistical results and communicate findings
3. Use statistical software for data analysis
4. Understand the role of statistics in scientific research

## Required Materials

**Textbook:**
- "Introduction to Statistics" by Author Name
- [Software requirements]

## Grading

| Component      | Percentage |
|----------------|------------|
| Homework       | 25%        |
| Quizzes        | 10%        |
| Midterm Exam   | 25%        |
| Final Exam     | 30%        |
| Project        | 10%        |

**Grade Scale:**
- A: 93-100, A-: 90-92
- B+: 87-89, B: 83-86, B-: 80-82
- C+: 77-79, C: 73-76, C-: 70-72
- D: 60-69, F: Below 60

## Weekly Schedule

**Week 1:** Introduction to Statistics
**Week 2:** Descriptive Statistics
...
**Week 8:** Midterm Exam
...
**Week 15:** Final Exam

## Course Policies

### Academic Integrity
[Standard academic integrity policy]

### Accessibility
[Accommodations statement]

### Attendance
[Attendance expectations]
```

The syllabus will be saved to `syllabus-introduction-to-statistics.md` in your current directory.

**Checkpoint:**

- Run `ls -l syllabus-*.md` to verify the file exists
- Open the file and confirm it contains all major sections
- Check that the schedule includes 15 weeks by default

---

## Step 2: Customize Course Details ⏱️ 2 minutes

**What to do:**

Create a configuration file to customize the syllabus with your specific course information. This allows Scholar to generate syllabi tailored to your course level, field, and institutional requirements.

First, create the configuration directory:

```bash
mkdir -p .flow
```

Create a configuration file at `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"

  defaults:
    exam_format: "markdown"

  style:
    tone: "formal"
    notation: "statistical"
    examples: true
```

**Example:**

Now generate a customized syllabus with semester information:

```bash
/teaching:syllabus "Regression Analysis" "Fall 2026" --weeks 16
```

**What you'll see:**

A syllabus customized to your course configuration:

```markdown
# Course Syllabus: STAT-440 - Regression Analysis

**Semester:** Fall 2026
**Credits:** 3
**Level:** Undergraduate
**Format:** In-person

## Course Description

This course provides comprehensive coverage of regression analysis methods...
[Content tailored to intermediate undergraduate statistics level]

## Learning Objectives

1. Apply simple and multiple regression models to real data
2. Interpret regression coefficients and assess model fit
3. Diagnose and address violations of regression assumptions
4. Communicate statistical findings through written reports
[Objectives appropriate for intermediate-level course]

## Weekly Schedule

**Week 1:** Introduction to Simple Linear Regression
**Week 2:** Least Squares Estimation
...
**Week 16:** Final Exam
[16-week schedule as specified]
```

**Checkpoint:**

- Verify the syllabus shows your course code (STAT-440) in the title
- Check that the schedule has 16 weeks instead of the default 15
- Confirm learning objectives match your course level
- Review that content reflects "intermediate" difficulty

---

## Step 3: Set Course Format and Options ⏱️ 1 minute

**What to do:**

Customize additional course options like meeting format, instructor information, and whether to include template policies.

**Example:**

```bash
/teaching:syllabus "Data Science Methods" --weeks 12 --format "hybrid" --no-policies
```

**What you'll see:**

A syllabus with customized format settings:

```markdown
# Course Syllabus: Data Science Methods

**Format:** Hybrid (In-person and Online)

**Meeting Times:**
- In-person: Tuesdays, 2:00 PM - 3:15 PM
- Online: Thursdays (asynchronous)
- Location: [Classroom] and [LMS Platform]

## Course Format

This course uses a hybrid format combining in-person sessions for discussions
and collaborative work with online asynchronous content for lectures and readings.

[Rest of syllabus without standard policy templates]
```

**Options you can customize:**

- `--weeks N` - Semester length (default: 15)
- `--format FMT` - "in-person", "online", or "hybrid"
- `--no-policies` - Exclude template policies
- `--instructor "Name"` - Set instructor name
- `--email "email@edu"` - Set contact email

**Checkpoint:**

- Verify the format is correctly set (hybrid, online, or in-person)
- If using `--no-policies`, confirm policy sections are omitted
- Check that meeting information matches the specified format

---

## Step 4: Export to Different Formats ⏱️ 1 minute

**What to do:**

Generate the syllabus in different formats for various use cases. Markdown is best for course websites, LaTeX for professional PDFs, and HTML for standalone web pages.

**Example:**

```bash
# Markdown format (default, for LMS upload)
/teaching:syllabus "Statistics" --format markdown

# LaTeX format (for professional PDF generation)
/teaching:syllabus "Statistics" --format latex

# PDF format (direct PDF output)
/teaching:syllabus "Statistics" --format pdf
```

**What you'll see:**

Different output formats for the same syllabus:

**Markdown (`syllabus-statistics.md`):**
```markdown
# Course Syllabus: Statistics
[Human-readable format with markdown tables]
```

**LaTeX (`syllabus-statistics.tex`):**
```latex
\documentclass{article}
\usepackage{geometry}
\begin{document}

\title{Course Syllabus: Statistics}
\maketitle

\section{Course Information}
[Professional academic formatting]
\end{document}
```

**Use cases:**

- **Markdown (`.md`):** Upload to Canvas/Moodle, course websites, version control
- **LaTeX (`.tex`):** Professional printed syllabi, compile with `pdflatex`
- **PDF (`.pdf`):** Direct PDF output for distribution
- **HTML (`.html`):** Self-contained web page

**Checkpoint:**

- Run `ls -l syllabus-statistics.*` to see all generated files
- Verify each file contains the same content in appropriate format
- If you have LaTeX installed, test compilation: `pdflatex syllabus-statistics.tex`

---

## Step 5: Preview Without API Calls ⏱️ 1 minute

**What to do:**

Use the `--dry-run` flag to preview what would be generated without making API calls. This helps you verify settings, estimate costs, and test configurations before generating content.

**Example:**

```bash
/teaching:syllabus "Machine Learning" --weeks 14 --dry-run
```

**What you'll see:**

Scholar displays the generation plan without executing it:

```
🔍 DRY RUN MODE - No API calls will be made

Syllabus Generation Plan:
  Course: Machine Learning
  Semester: [Current term]
  Weeks: 14
  Format: markdown

Configuration:
  Level: undergraduate (from teach-config.yml)
  Field: statistics
  Difficulty: intermediate

Content Sections:
  ✓ Course Information
  ✓ Learning Objectives (4-6 objectives)
  ✓ Required Materials
  ✓ Grading Breakdown
  ✓ Weekly Schedule (14 weeks)
  ✓ Academic Policies (standard templates)

Estimated API Costs:
  Input tokens: ~4,200
  Output tokens: ~6,500
  Estimated cost: $0.09

Output Files:
  - syllabus-machine-learning.md

To proceed with generation, remove --dry-run flag
```

**Why this matters:**

- **Verify settings** before generating content
- **Estimate costs** for budget planning
- **Test configurations** without spending API credits
- **Catch errors** in command syntax early

**Checkpoint:**

- Confirm no files were created (dry run doesn't generate content)
- Verify the plan shows your expected settings (weeks, format, etc.)
- Note the estimated API cost
- If settings look wrong, adjust your command and re-run

---

## Common Issues

### Issue 1: "Missing required course information"

**Symptoms:**

- Syllabus has placeholder text for instructor information
- Course code not shown in title
- Generic course description

**Solution:**

Create or update `.flow/teach-config.yml` with your course details:

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Your Course Name"
    level: "undergraduate"
    field: "statistics"
```

Alternatively, provide information via command flags:

```bash
/teaching:syllabus "Statistics" --code "STAT-440" --instructor "Dr. Smith"
```

### Issue 2: "Syllabus schedule doesn't match semester"

**Symptoms:**

- Too many or too few weeks
- Schedule doesn't align with academic calendar
- Missing holiday weeks

**Solution:**

Specify the exact number of weeks for your semester:

```bash
# Quarter system (10 weeks)
/teaching:syllabus "Statistics" --weeks 10

# Semester system (15-16 weeks)
/teaching:syllabus "Statistics" --weeks 15

# Summer session (8 weeks)
/teaching:syllabus "Statistics" --weeks 8
```

Note: Scholar generates a basic schedule. You'll need to manually adjust for holidays, exam weeks, and break periods.

### Issue 3: "Policies don't match institutional requirements"

**Symptoms:**

- Generic policy language
- Missing required institutional statements
- Policies don't reflect department standards

**Solution:**

1. Generate without template policies:

   ```bash
   /teaching:syllabus "Statistics" --no-policies
   ```

2. Add your institution's required policy statements manually

3. Or customize the generated policies to match your requirements

**Best Practice:** Keep a template file with your institution's required policies and merge them with generated syllabi.

---

## Next Steps

Congratulations! You've generated your first course syllabus with Scholar. Now explore related features:

### Related Tutorials

- **[Your First Exam](first-exam.md)** - Create exams to match your syllabus schedule
- **[Weekly Content Generation](weekly-content.md)** - Generate lectures and assignments for each week
- **[Semester Setup](semester-setup.md)** - Plan a complete semester of course materials

### Follow-up Actions

After generating your syllabus, you can:

- **Create first week's lecture** - `/teaching:lecture "Week 1 Introduction"`
- **Generate assignment prompts** - `/teaching:assignment "Homework 1"`
- **Create grading rubrics** - `/teaching:rubric "Research Paper"`
- **Plan weekly schedule** - Use `/teaching:lecture` for each week

### Quick References

- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md#teachingsyllabus)** - Complete command documentation
- **[Configuration Guide](configuration.md)** - Detailed config options
- **[Teaching Style Guide](../../TEACHING-STYLE-GUIDE.md)** - Customize pedagogical approach

---

**Happy teaching with Scholar!**
