# Tutorial: Creating Assignments with Solutions and Rubrics

**Time Estimate:** 45 minutes
**Difficulty:** Beginner
**Prerequisites:**
- Scholar plugin installed (v2.5.0+)
- Claude Code running with ANTHROPIC_API_KEY configured
- Basic familiarity with command-line tools
- A course directory with `.flow/teach-config.yml` (see [Configuration Tutorial](configuration.md))

---

## What You'll Learn

By the end of this tutorial, you will be able to:

1. Generate comprehensive homework assignments with `/teaching:assignment`
2. Create detailed solution keys that guide student learning
3. Design grading rubrics with clear criteria and point allocations
4. Export assignments to multiple formats (PDF, Quarto, Canvas QTI)
5. Customize assignments for different difficulty levels and topics
6. Batch generate weekly assignments for an entire semester
7. Quality control generated content before distribution

---

## Learning Objectives

After completing this tutorial, you should be able to:

- **Create** complete assignment packages (problems + solutions + rubric) in under 10 minutes
- **Evaluate** generated content for quality, difficulty, and alignment with course objectives
- **Customize** assignments to match your teaching style and course needs
- **Export** assignments to formats compatible with your LMS and workflow
- **Troubleshoot** common issues in assignment generation and validation

---

## Overview

This tutorial demonstrates the complete workflow for creating course assignments using Scholar's teaching commands. You'll learn how to generate problem sets with worked solutions and grading rubrics, ensuring consistent quality and saving hours of manual work.

**What makes a good assignment?**

- **Progressive difficulty** - Problems build from simple to complex
- **Clear instructions** - Students know exactly what's expected
- **Worked solutions** - Detailed explanations that teach, not just answer
- **Fair grading rubrics** - Clear criteria for partial credit and evaluation
- **Alignment** - Problems match learning objectives and lecture content

Scholar automates the creation of all these components while maintaining high quality standards.

---

## Step 1: Understand the Assignment Creation Pipeline

### The Three-Component System

Scholar generates assignments as **three interconnected pieces**:

```
Assignment (Problems)
    ↓
Solution Key (Step-by-step answers)
    ↓
Grading Rubric (Evaluation criteria)
```

Each component references the others, ensuring consistency:
- Solutions match problem numbering
- Rubrics align with problem point values
- All three use consistent terminology

### Default Generation Behavior

By default, `/teaching:assignment` generates all three components:

```bash
/teaching:assignment "Linear Regression Problem Set"
```

**Output:**
- `assignment-linear-regression-problem-set.qmd` (Problems for students)
- Solutions embedded in the same file (instructor copy)
- Grading rubric appended to the file

### Selective Generation

Generate only what you need:

```bash
# Assignment without solutions (for distribution to students)
/teaching:assignment "Midterm Practice" --no-solutions

# Assignment without rubric (solutions only)
/teaching:assignment "Extra Practice" --no-rubric

# Just problems (no solutions, no rubric)
/teaching:assignment "In-Class Worksheet" --no-solutions --no-rubric
```

---

## Step 2: Generate Your First Assignment

### 2a. Navigate to Your Course Directory

```bash
cd ~/teaching/stat-440-spring-2026
```

**Checkpoint:** Verify your config file exists:

```bash
ls -la .flow/teach-config.yml
# Should show: .flow/teach-config.yml
```

If missing, see the [Configuration Tutorial](configuration.md) to set up your course.

### 2b. Generate a Complete Assignment

Let's create a homework assignment on hypothesis testing with 6 problems.

```bash
/teaching:assignment "Hypothesis Testing" --problems 6 --points 100
```

**What Scholar Does:**

1. Loads your course configuration (difficulty level, field, style)
2. Generates 6 problems at mixed difficulty (easy → medium → hard)
3. Creates worked solutions with step-by-step explanations
4. Builds a grading rubric with point breakdowns
5. Formats everything in Quarto markdown (`.qmd`)
6. Validates the output against schema

**Expected output:**

```
Generating assignment: Hypothesis Testing
✓ Loaded config: .flow/teach-config.yml
✓ Generated 6 problems (2 easy, 3 medium, 1 hard)
✓ Created solution key with detailed steps
✓ Built grading rubric (100 points total)
✓ Validated output schema

Output written to: assignment-hypothesis-testing.qmd
```

### 2c. Inspect the Generated File

Open the assignment to review:

```bash
# macOS (using default editor)
open assignment-hypothesis-testing.qmd

# Or use your preferred editor
code assignment-hypothesis-testing.qmd   # VS Code
vim assignment-hypothesis-testing.qmd    # vim
```

**What you'll see:**

```markdown
---
title: "Assignment: Hypothesis Testing"
subtitle: "STAT 440 - Regression Analysis"
author: "Dr. Jane Smith"
date: "Due: [Insert Date]"
format:
  pdf:
    documentclass: article
    geometry: margin=1in
---

## Instructions

- Show all work for full credit
- Include R code and output where requested
- Round numerical answers to 3 decimal places
- Submit PDF to Canvas by due date
- Collaboration policy: Individual work only

---

## Problem 1: Conceptual Understanding (10 points)

Explain the purpose of hypothesis testing in regression analysis. In your answer:

a) Define the null and alternative hypotheses for testing $H_0: \beta_1 = 0$
b) Explain what it means to "reject the null hypothesis"
c) Describe the role of the p-value in making a decision

### Solution (Problem 1)

**a) Hypotheses:**
- Null hypothesis ($H_0: \beta_1 = 0$): The slope parameter equals zero, meaning there is no linear relationship between the predictor X and response Y.
- Alternative hypothesis ($H_a: \beta_1 \neq 0$): The slope parameter is not zero, indicating a linear relationship exists.

**b) Rejecting $H_0$:**
When we reject the null hypothesis, we conclude that the data provide sufficient evidence that the slope is significantly different from zero. This means:
- There is a statistically significant linear relationship between X and Y
- Changes in X are associated with changes in Y beyond what we'd expect by random chance
- The predictor has explanatory power for the response variable

**c) Role of p-value:**
The p-value measures the probability of observing data as extreme (or more extreme) than what we actually observed, assuming $H_0$ is true.
- If p-value < $\alpha$ (typically 0.05): Reject $H_0$ (strong evidence against null)
- If p-value ≥ $\alpha$: Fail to reject $H_0$ (insufficient evidence)

The p-value does NOT tell us the probability that $H_0$ is true, only how compatible our data are with $H_0$.

---

## Problem 2: Hand Calculations (20 points)

A regression of exam score (Y) on study hours (X) for n = 10 students yields:
- $\hat{\beta}_1 = 5.2$ (estimated slope)
- $SE(\hat{\beta}_1) = 1.3$ (standard error)

**a)** (8 points) Calculate the t-statistic for testing $H_0: \beta_1 = 0$ vs $H_a: \beta_1 \neq 0$.

**b)** (6 points) Using $\alpha = 0.05$ and df = 8, the critical value is $t_{0.025,8} = 2.306$. Based on your t-statistic, would you reject $H_0$? Explain your decision.

**c)** (6 points) Construct a 95% confidence interval for $\beta_1$ using the formula: $\hat{\beta}_1 \pm t_{0.025,8} \cdot SE(\hat{\beta}_1)$

### Solution (Problem 2)

**a) Calculate t-statistic:**

The t-statistic formula:
$$t = \frac{\hat{\beta}_1 - 0}{SE(\hat{\beta}_1)} = \frac{5.2 - 0}{1.3} = \frac{5.2}{1.3} = 4.0$$

**Answer:** t = 4.0

**b) Decision:**

Compare $|t| = 4.0$ with critical value $t_{0.025,8} = 2.306$:

Since $4.0 > 2.306$, we reject $H_0$.

**Conclusion:** At the $\alpha = 0.05$ significance level, we have sufficient evidence to conclude that there is a significant linear relationship between study hours and exam scores. The slope is significantly different from zero.

**c) 95% Confidence Interval:**

$$CI = \hat{\beta}_1 \pm t_{0.025,8} \cdot SE(\hat{\beta}_1)$$
$$CI = 5.2 \pm 2.306 \times 1.3$$
$$CI = 5.2 \pm 2.998$$
$$CI = (5.2 - 2.998,\ 5.2 + 2.998)$$
$$CI = (2.202,\ 8.198)$$

**Answer:** 95% CI = (2.202, 8.198)

**Interpretation:** We are 95% confident that for each additional hour of study time, exam scores increase by between 2.2 and 8.2 points on average. Since this interval does not include zero, this confirms our hypothesis test decision to reject $H_0$.

---

[... Problems 3-6 would continue in similar format ...]

---

## Grading Rubric

### Problem-by-Problem Breakdown

#### Problem 1: Conceptual Understanding (10 points)

| Score | Criteria |
|-------|----------|
| **10** | All parts correct with clear, well-articulated explanations |
| **8-9** | All parts addressed but some minor imprecision in language |
| **6-7** | All parts attempted but one section weak or incomplete |
| **4-5** | Multiple conceptual gaps but demonstrates partial understanding |
| **2-3** | Major misunderstandings but some correct ideas |
| **0-1** | No substantial attempt or completely incorrect |

**Part-by-part scoring:**
- Part (a) - Hypotheses: 3 points
- Part (b) - Rejection interpretation: 4 points
- Part (c) - P-value role: 3 points

---

#### Problem 2: Hand Calculations (20 points)

**Part (a) - t-statistic (8 points):**

| Score | Criteria |
|-------|----------|
| **8** | Correct formula, correct calculation, correct answer (t = 4.0) |
| **6-7** | Correct formula but minor arithmetic error |
| **4-5** | Conceptually correct approach but significant error |
| **2-3** | Wrong formula but shows understanding of t-tests |
| **0-1** | No substantial work or completely wrong |

**Part (b) - Decision (6 points):**

| Score | Criteria |
|-------|----------|
| **6** | Correct comparison, correct decision, clear reasoning |
| **5** | Correct decision but reasoning could be clearer |
| **3-4** | Correct comparison but wrong decision or flawed reasoning |
| **1-2** | Major errors but some correct elements |
| **0** | No attempt or completely wrong |

**Part (c) - Confidence Interval (6 points):**

| Score | Criteria |
|-------|----------|
| **6** | Correct formula, correct calculation, correct interpretation |
| **5** | Correct interval but weak interpretation |
| **4** | Minor arithmetic error but correct method |
| **2-3** | Wrong formula but shows understanding of CIs |
| **0-1** | No attempt or fundamentally incorrect |

---

[... Rubrics for Problems 3-6 would continue ...]

---

## Overall Grading Guidelines

### Partial Credit Policy

- **Correct setup, calculation error:** 60-80% of problem points
- **Correct method, wrong formula:** 40-60% of problem points
- **Conceptual understanding shown:** Minimum 20% of problem points
- **No work shown:** 0 points (even if answer is correct)

### Deductions

- Missing units: -1 point per problem
- Not rounded to 3 decimals: -1 point per problem
- Missing interpretation: -2 points per problem (when requested)
- Disorganized work: -3 points overall
- Late submission: Per syllabus policy

### Extra Credit Opportunities (Optional)

- Exceptional clarity in explanations: +2 points
- Going beyond requirements (additional analysis, graphs): +3 points
- **Maximum total:** 105 points (100 + 5 bonus)

---

## Submission Requirements

- **Format:** Single PDF file
- **Filename:** `LastName_FirstName_Assignment_HypothesisTesting.pdf`
- **Due Date:** [Insert Date] at 11:59 PM
- **Submit to:** Canvas → Assignments → Hypothesis Testing Assignment

### What to Include

1. All problem solutions with work shown
2. R code and output (for computational problems)
3. Clear problem numbering and labeling
4. Your name and student ID on first page

### Academic Integrity

- You may discuss concepts with classmates
- All submitted work must be your own
- Copying code or answers is prohibited
- Violations will be reported per university policy
```

**✅ Checkpoint 1 Complete:** You've generated and inspected a complete assignment with solutions and rubric.

---

## Step 3: Customize the Assignment

The generated assignment is a starting point. Let's customize it to match your exact needs.

### 3a. Adjust Difficulty Level

If the problems seem too easy or too hard, regenerate with a specific difficulty:

```bash
# Easier version (for introductory students)
/teaching:assignment "Hypothesis Testing" --problems 6 --difficulty beginner

# Harder version (for advanced students)
/teaching:assignment "Hypothesis Testing" --problems 6 --difficulty advanced
```

**Difficulty effects:**

| Level | Problem Characteristics |
|-------|------------------------|
| `beginner` | More scaffolding, step-by-step guidance, simpler calculations |
| `intermediate` | Standard complexity, some multi-step problems |
| `advanced` | Synthesis required, minimal hints, complex reasoning |

### 3b. Change Topic Focus

Generate assignments on specific subtopics:

```bash
# Focus on t-tests only
/teaching:assignment "t-tests for regression coefficients" --problems 5

# Multiple topics
/teaching:assignment "Hypothesis Testing and Confidence Intervals" --problems 8
```

### 3c. Add Programming Problems

Include R or Python coding problems:

```bash
# With R code
/teaching:assignment "Regression Analysis in R" --problems 5 --include-code --language R

# With Python code
/teaching:assignment "Linear Models in Python" --problems 5 --include-code --language Python
```

### 3d. Control Point Distribution

Adjust total points and problem count:

```bash
# 50-point assignment (shorter)
/teaching:assignment "Quick Practice" --problems 4 --points 50

# 150-point project (longer)
/teaching:assignment "Data Analysis Project" --problems 10 --points 150 --type project
```

### 3e. Set Assignment Metadata

Add course-specific information:

```bash
/teaching:assignment "Regression Homework 3" \
  --week 5 \
  --due "Friday, March 15, 2026 at 11:59 PM" \
  --time "2-3 hours"
```

**✅ Checkpoint 2 Complete:** You've learned to customize assignments for different needs.

---

## Step 4: Generate Solutions and Rubrics Separately

Sometimes you need to create solutions or rubrics for existing assignments.

### 4a. Create a Standalone Rubric

Generate a grading rubric for an existing assignment:

```bash
/teaching:rubric "Hypothesis Testing Assignment 3" 100 --criteria 6
```

**Options:**
- First argument: Assignment name/description
- Second argument: Total points
- `--criteria N`: Number of main grading criteria (default: 5)

**Output:** `rubric-hypothesis-testing-assignment-3.md`

**Example rubric structure:**

```markdown
# Grading Rubric: Hypothesis Testing Assignment 3

**Total Points:** 100

---

## Criterion 1: Conceptual Understanding (20 points)

### Outstanding (18-20)
- Demonstrates deep understanding of hypothesis testing concepts
- Clear, precise explanations with correct terminology
- Makes connections between concepts

### Proficient (15-17)
- Good understanding with minor imprecisions
- Explanations are mostly clear
- Some correct terminology

### Developing (10-14)
- Partial understanding with gaps
- Explanations lack clarity
- Terminology errors

### Needs Improvement (0-9)
- Significant conceptual misunderstandings
- Unclear or missing explanations
- Major terminology errors

---

## Criterion 2: Calculations (30 points)

[Similar breakdown...]

---

[... Continue for all 6 criteria ...]
```

### 4b. Customize Rubric Details

Generate rubrics with specific focus areas:

```bash
# Code quality emphasis
/teaching:rubric "R Programming Assignment" 100 --focus "code-quality,documentation"

# Written communication emphasis
/teaching:rubric "Research Report" 100 --focus "writing,analysis,interpretation"
```

**✅ Checkpoint 3 Complete:** You can generate standalone rubrics for any assignment.

### 4b. Create a Standalone Solution Key

Generate a comprehensive solution key from an existing assignment file:

```bash
/teaching:solution assignments/assignment3_multiple_comparisons.qmd
```

**Output:** `solutions/assignment3_multiple_comparisons-solution.qmd`

The parser auto-detects problem blocks from headings like `## Problem N`, `## Exercise N`, or `## Question N`.

**Options:**

```bash
# Include grading notes and partial credit guidance
/teaching:solution assignments/hw4.qmd --include-rubric

# Output as Markdown instead of Quarto
/teaching:solution assignments/hw3.qmd --format md

# Custom output path
/teaching:solution assignments/hw3.qmd --output solutions/hw3-key.qmd

# Custom instructions for solution style
/teaching:solution assignments/hw3.qmd -i "Show hand calculations before R code"
```

**Email the solution to your TA:**

```bash
# Using TA email from teach-config.yml
/teaching:solution assignments/hw3.qmd --send

# Or specify email directly
/teaching:solution assignments/hw3.qmd --send ta@university.edu
```

The `--send` flag previews the email before sending, includes a formatted subject line with course code, and adds a confidentiality warning. Requires the himalaya MCP server.

**✅ Checkpoint 3b Complete:** You can generate standalone solution keys for existing assignments.

### 4c. Validate R Code in Solutions

After generating a solution key, validate that all R code chunks run correctly:

```bash
# Validate R code in the generated solution
/teaching:validate-r solutions/assignment3_multiple_comparisons-solution.qmd

# Or generate and validate in one step
/teaching:solution assignments/hw4.qmd --validate
```

The `--validate` flag on `/teaching:solution` automatically runs `/teaching:validate-r` after generation, catching broken code before distribution. See the [R Code Validation tutorial](r-code-validation.md) for details on interpreting results and fixing errors.

---

## Step 5: Export to Multiple Formats

Scholar generates Quarto markdown (`.qmd`) by default, which can be rendered to many formats.

### 5a. Render to PDF (Student Copy)

Remove solutions before distributing:

```bash
# First, generate without solutions
/teaching:assignment "Hypothesis Testing" --no-solutions --output assignment-ht-student.qmd

# Then render to PDF
quarto render assignment-ht-student.qmd --to pdf
```

**Output:** `assignment-ht-student.pdf` (problems only, no solutions)

### 5b. Create Instructor Copy with Solutions

```bash
# Generate with solutions (default)
/teaching:assignment "Hypothesis Testing" --output assignment-ht-instructor.qmd

# Render to PDF
quarto render assignment-ht-instructor.qmd --to pdf
```

**Output:** `assignment-ht-instructor.pdf` (problems + solutions + rubric)

### 5c. Export to Canvas QTI (Optional)

If you're using Canvas LMS, use the `/teaching:canvas` command (requires `examark`):

```bash
# Generate assignment in QMD format
/teaching:assignment "Hypothesis Testing" --format qmd

# Export to Canvas QTI zip
/teaching:canvas assignment-hypothesis-testing.qmd

# Output: assignment-hypothesis-testing.qti.zip (import to Canvas)
```

**Upload to Canvas:**
1. Canvas → Assignments → Import Assignment
2. Upload `.zip` file
3. Verify import and adjust settings

### 5d. Generate Multiple Formats at Once

```bash
# Generate all formats
/teaching:assignment "Hypothesis Testing" --formats "qmd,md,tex"
```

**Output:**
- `assignment-hypothesis-testing.qmd` (Quarto)
- `assignment-hypothesis-testing.md` (Markdown)
- `assignment-hypothesis-testing.tex` (LaTeX)

**✅ Checkpoint 4 Complete:** You can export assignments to any format needed.

---

## Step 6: Batch Generate Weekly Assignments

Save time by generating multiple weeks of assignments at once.

### 6a. Create a Topics List

Create a file `assignment-topics.txt` with one topic per line:

```
Introduction to Regression
Simple Linear Regression
Multiple Regression
Hypothesis Testing for Coefficients
Model Diagnostics and Assumptions
Transformations and Interactions
Polynomial Regression
Model Selection and Validation
```

### 6b. Generate All Assignments

Use a shell script to batch generate:

```bash
# Create script: generate-all-assignments.sh
cat > generate-all-assignments.sh << 'EOF'
#!/bin/bash
week=1
while IFS= read -r topic; do
  echo "Generating Assignment $week: $topic"
  /teaching:assignment "$topic" \
    --week $week \
    --problems 6 \
    --points 100 \
    --output "assignments/week-$(printf "%02d" $week)-assignment.qmd"
  ((week++))
  sleep 5  # Pause between API calls
done < assignment-topics.txt
EOF

# Make executable
chmod +x generate-all-assignments.sh

# Run
./generate-all-assignments.sh
```

**Output:** 8 assignments in `assignments/` directory

### 6c. Bulk Render to PDF

Render all assignments at once:

```bash
# Render all .qmd files in assignments/
for file in assignments/*.qmd; do
  quarto render "$file" --to pdf
done
```

**Result:** 8 PDF assignments ready for distribution

**✅ Checkpoint 5 Complete:** You can efficiently generate assignments for an entire semester.

---

## Step 7: Quality Control Checklist

Before distributing assignments, validate quality:

### Pre-Distribution Checklist

#### Content Validation

- [ ] **Problem alignment:** Do problems match lecture topics and learning objectives?
- [ ] **Difficulty progression:** Do problems gradually increase in complexity?
- [ ] **Point allocation:** Are points proportional to difficulty and time required?
- [ ] **Instructions clarity:** Can students understand what's being asked?
- [ ] **Solvability:** Are all problems solvable with course material?

#### Solution Validation

- [ ] **Correctness:** Are solutions mathematically/statistically correct?
- [ ] **Completeness:** Do solutions show all work and reasoning?
- [ ] **Clarity:** Can students learn from the solution explanations?
- [ ] **Code validation:** Does R/Python code run without errors?
- [ ] **Interpretation:** Are statistical interpretations accurate?

#### Rubric Validation

- [ ] **Alignment:** Does rubric cover all problems?
- [ ] **Point matching:** Do rubric points match assignment points?
- [ ] **Criteria clarity:** Are grading criteria clear and measurable?
- [ ] **Partial credit:** Are partial credit guidelines reasonable?
- [ ] **Consistency:** Can multiple graders use this rubric consistently?

#### Format Validation

- [ ] **PDF rendering:** Does PDF render correctly (no formatting errors)?
- [ ] **Math display:** Do equations display correctly?
- [ ] **Code formatting:** Is code properly syntax-highlighted?
- [ ] **Metadata:** Are due dates, names, course codes correct?
- [ ] **File naming:** Are files named according to your convention?

### Validation Commands

```bash
# Validate Quarto syntax
quarto check assignment-hypothesis-testing.qmd

# Preview in browser
quarto preview assignment-hypothesis-testing.qmd

# Render and check for errors
quarto render assignment-hypothesis-testing.qmd --to pdf --quiet

# Check for LaTeX errors
pdflatex assignment-hypothesis-testing.tex 2>&1 | grep -i error
```

**✅ Checkpoint 6 Complete:** You know how to validate assignment quality before distribution.

---

## Common Mistakes and How to Avoid Them

### Mistake 1: Not Customizing Generated Content

**Problem:** Using generated assignments without review.

**Why it's bad:** Generated content may not perfectly match your course pace, student level, or teaching style.

**Solution:**
1. Always review generated content
2. Customize problems to fit your examples from lecture
3. Adjust difficulty based on previous assignments
4. Update point values to match your grading philosophy

**Example customization:**

```bash
# Original (too generic)
/teaching:assignment "Regression"

# Better (specific to your course)
/teaching:assignment "Multiple Regression with Interaction Terms" \
  --week 6 \
  --difficulty intermediate \
  --problems 5 \
  --include-code \
  --language R
```

### Mistake 2: Inconsistent Point Allocations

**Problem:** Total points don't match your grading system.

**Why it's bad:** Causes confusion when entering grades in LMS.

**Solution:** Standardize point totals across all assignments.

```bash
# All homework assignments: 100 points
/teaching:assignment "Topic 1" --points 100
/teaching:assignment "Topic 2" --points 100

# All quizzes: 20 points
/teaching:quiz "Topic 1" 10 --points 20
```

### Mistake 3: Missing Context in Solutions

**Problem:** Solutions show answers but not reasoning.

**Why it's bad:** Students can't learn from solutions.

**Solution:** Verify solutions include:
- Step-by-step work
- Explanations of why each step is taken
- Interpretation of results in context
- Common mistakes to avoid

**Check solutions with:**

```bash
# Open solution key
open assignment-hypothesis-testing-instructor.pdf

# Review each solution section:
# - Is reasoning clear?
# - Are steps numbered?
# - Are interpretations provided?
# - Would a struggling student understand?
```

### Mistake 4: Rubric-Problem Mismatch

**Problem:** Rubric doesn't align with actual assignment problems.

**Why it's bad:** Inconsistent grading, student confusion.

**Solution:**
1. Generate rubric WITH the assignment (default behavior)
2. Verify rubric covers all problems
3. Check that point values match

```bash
# Generate together (ensures alignment)
/teaching:assignment "Hypothesis Testing" --problems 6 --points 100

# Then validate
grep -E "Problem [0-9]" assignment-hypothesis-testing.qmd | wc -l
# Should output: 6

grep -E "points|Points" rubric-hypothesis-testing.md
# Verify point allocations sum to 100
```

### Mistake 5: Not Testing with Real Data

**Problem:** Problems use unrealistic data or scenarios.

**Why it's bad:** Students can't connect to real applications.

**Solution:** Replace generic examples with domain-specific data.

**Example:**

```markdown
<!-- Generic (less engaging) -->
Problem: Given dataset with variables X and Y, test if slope is significant.

<!-- Domain-specific (more engaging) -->
Problem: A medical researcher collected data on patient age (X) and
cholesterol levels (Y) for 50 patients. Test if there is a significant
linear relationship at the 0.05 significance level. Data: cholesterol.csv
```

---

## Troubleshooting Common Issues

### Issue 1: "ANTHROPIC_API_KEY not found"

**Symptoms:** Command fails immediately with API key error.

**Cause:** Environment variable not set or expired.

**Solution:**

```bash
# Check if set
echo $ANTHROPIC_API_KEY

# If empty, set it
export ANTHROPIC_API_KEY="sk-ant-..."

# Make persistent (add to shell config)
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.zshrc  # or ~/.bashrc
source ~/.zshrc
```

**Verify:**

```bash
/teaching:assignment "Test" --problems 1 --dry-run
# Should not error on API key
```

### Issue 2: "Quarto render failed"

**Symptoms:** PDF generation fails with LaTeX errors.

**Cause:** Missing LaTeX installation or malformed math.

**Solution:**

```bash
# Check if Quarto is installed
quarto --version

# Install if missing
brew install quarto  # macOS
# Or download from https://quarto.org/docs/get-started/

# Install TinyTeX for LaTeX support
quarto install tinytex

# Test render
quarto render assignment-hypothesis-testing.qmd --to pdf
```

**If LaTeX errors persist:**

1. Check for unescaped special characters (`$`, `%`, `&`, `_`, `#`)
2. Verify math delimiters (`$...$` for inline, `$$...$$` for display)
3. Remove any fancy Unicode characters

### Issue 3: Generated Problems Too Easy/Hard

**Symptoms:** Problems don't match student ability level.

**Cause:** Config file difficulty setting doesn't match reality.

**Solution:**

**Check your config:**

```bash
cat .flow/teach-config.yml | grep difficulty
# Output: difficulty: "intermediate"
```

**Adjust and regenerate:**

```bash
# Edit config
vim .flow/teach-config.yml
# Change: difficulty: "beginner"

# Or override for this assignment only
/teaching:assignment "Topic" --difficulty beginner
```

**Difficulty calibration:**
- `beginner`: Intro courses, first-year students, high school
- `intermediate`: Standard undergrad, 200-400 level courses
- `advanced`: Upper-level undergrad, grad courses, research

### Issue 4: Solutions Missing Steps

**Symptoms:** Solutions jump to answers without showing work.

**Cause:** AI generated abbreviated solutions.

**Solution:**

Regenerate with explicit instruction:

```bash
# Add note to config
cat >> .flow/teach-config.yml << EOF

  # Custom instructions
  solution_style:
    show_all_steps: true
    include_explanations: true
    verbosity: "high"
EOF

# Regenerate
/teaching:assignment "Topic" --problems 6
```

**Or manually expand solutions** in the generated file:

1. Open `.qmd` file
2. Find solution sections
3. Add intermediate steps between jumps
4. Include "why" explanations for each step

### Issue 5: Rubric Too Generic

**Symptoms:** Rubric uses generic criteria not specific to problems.

**Cause:** Rubric generated without problem context.

**Solution:**

**Generate rubric WITH assignment (recommended):**

```bash
# Default behavior includes rubric
/teaching:assignment "Hypothesis Testing" --problems 6
```

**Or provide problem list when generating standalone rubric:**

```bash
# List problems explicitly
/teaching:rubric "Assignment 3" 100 \
  --problems "Conceptual,Calculations,R Code,Interpretation,Real Data,Challenge"
```

**Then customize the rubric** to match your specific problems.

---

## Advanced Workflows

### Workflow 1: Create Assignment Variations

Generate multiple versions of the same assignment (for academic integrity):

```bash
# Version A
/teaching:assignment "Hypothesis Testing" \
  --problems 6 \
  --seed 1234 \
  --output assignment-ht-version-a.qmd

# Version B (different problems, same topics)
/teaching:assignment "Hypothesis Testing" \
  --problems 6 \
  --seed 5678 \
  --output assignment-ht-version-b.qmd

# Version C
/teaching:assignment "Hypothesis Testing" \
  --problems 6 \
  --seed 9012 \
  --output assignment-ht-version-c.qmd
```

**Result:** 3 assignments covering same topics with different problems.

### Workflow 2: Progressive Assignment Series

Create a series of assignments that build on each other:

```bash
# Week 1: Basics
/teaching:assignment "Simple Linear Regression Basics" \
  --week 1 --difficulty beginner --problems 5

# Week 2: Add complexity
/teaching:assignment "SLR Inference and Prediction" \
  --week 2 --difficulty intermediate --problems 6 \
  --context "Week 1 covered: estimation, interpretation, R²"

# Week 3: Mastery
/teaching:assignment "SLR Comprehensive Problems" \
  --week 3 --difficulty advanced --problems 7 \
  --context "Previous weeks covered: estimation, inference, prediction"
```

**Result:** Scaffolded learning with increasing complexity.

### Workflow 3: Topic-Specific Deep Dive

Create a series of short assignments on one topic:

```bash
# Mini-assignment 1: t-tests
/teaching:assignment "t-tests for regression coefficients" \
  --problems 3 --points 30 --type worksheet

# Mini-assignment 2: Confidence intervals
/teaching:assignment "Confidence intervals for slopes" \
  --problems 3 --points 30 --type worksheet

# Mini-assignment 3: Prediction intervals
/teaching:assignment "Prediction intervals for new observations" \
  --problems 3 --points 30 --type worksheet

# Final comprehensive assignment
/teaching:assignment "Inference in Regression - Comprehensive" \
  --problems 9 --points 100
```

**Result:** Focused practice followed by integration.

### Workflow 4: Auto-Grading Setup

Prepare assignments for auto-grading with R Markdown:

```bash
# Generate with R code
/teaching:assignment "Regression in R" \
  --problems 5 \
  --include-code \
  --language R \
  --format rmd

# Students submit .Rmd files
# Auto-grade with:
# - testthat for unit tests
# - gradethis for R code checking
# - Custom scripts for output validation
```

---

## Integration with Course Workflows

### With Flow-CLI (ADHD-Friendly Workflow)

If you're using the flow-cli system:

```bash
# Start assignment creation session
work stat-440

# Generate assignment
/teaching:assignment "Hypothesis Testing" --week 5

# Review and edit
vim assignment-hypothesis-testing.qmd

# Render to PDF
quarto render assignment-hypothesis-testing.qmd --to pdf

# Finish and commit
finish "Added Assignment 5: Hypothesis Testing"
```

### With GitHub for Version Control

Track assignment changes over time:

```bash
# Initialize git (if not already)
git init
git add .flow/teach-config.yml

# Generate assignment
/teaching:assignment "Hypothesis Testing" --output assignments/hw5.qmd

# Commit
git add assignments/hw5.qmd
git commit -m "feat: add Assignment 5 - Hypothesis Testing

- 6 problems covering t-tests and CIs
- Difficulty: intermediate
- Points: 100
- Includes solutions and grading rubric"

# Tag release
git tag -a hw5-v1.0 -m "Assignment 5 - Release for Spring 2026"
git push origin hw5-v1.0
```

### With Canvas LMS

Streamline Canvas upload:

```bash
# Generate assignment
/teaching:assignment "Hypothesis Testing" --no-solutions

# Render to PDF
quarto render assignment-hypothesis-testing.qmd --to pdf

# Upload via Canvas API (if available)
canvas-api upload-assignment \
  --course-id 12345 \
  --file assignment-hypothesis-testing.pdf \
  --name "Assignment 5: Hypothesis Testing" \
  --points 100 \
  --due-date "2026-03-15T23:59:00"

# Or manually upload via Canvas web interface
```

---

## Next Steps

### Master the Assignment Workflow

**Practice generating 3-5 assignments** to build confidence:

1. Start simple (3 problems, beginner)
2. Add complexity (6 problems, intermediate)
3. Include code (R or Python)
4. Customize difficulty and topics
5. Export to multiple formats

**After 3-5 assignments, you'll have:**
- A template workflow for your courses
- Understanding of customization options
- Confidence in quality control
- Time savings of 60-80% vs manual creation

### Related Tutorials

1. **[Configuration Guide](configuration.md)** - Set up `.flow/teach-config.yml` for your course
2. **[Weekly Content Creation](weekly-content.md)** - Generate slides, assignments, quizzes together
3. **[Lecture Notes Generation](lecture-notes.md)** - Create comprehensive lecture notes
4. **[First Exam Tutorial](first-exam.md)** - Generate midterms and finals

### Additional Resources

- **[Teaching Commands API Reference](../../TEACHING-COMMANDS-API.md)** - Complete command documentation
- **[Output Formats Guide](../../OUTPUT-FORMATS-GUIDE.md)** - Master Markdown, Quarto, LaTeX, JSON
- **[Assignment Quick Reference](../../refcards/assignments-rubrics.md)** - One-page cheat sheet
- **[Teaching Workflows](../../TEACHING-WORKFLOWS.md)** - Common workflow patterns

---

## Summary

You've learned how to:

✅ Generate complete assignments with solutions and rubrics in 5-10 minutes
✅ Customize assignments for difficulty, topics, and format
✅ Create standalone rubrics for any assignment
✅ Generate standalone solution keys from existing assignments with `/teaching:solution`
✅ Export to PDF, Quarto, Canvas QTI
✅ Batch generate weekly assignments for a semester
✅ Quality control generated content before distribution
✅ Troubleshoot common issues
✅ Integrate with course workflows (flow-cli, Git, Canvas)

**Time savings:** 60-80% reduction in assignment creation time (3-4 hours → 30-60 minutes per assignment)

**Next:** Apply this workflow to generate assignments for your entire course, saving dozens of hours of manual work!

---

**🎓 Congratulations!** You've mastered the assignment creation workflow with Scholar.
