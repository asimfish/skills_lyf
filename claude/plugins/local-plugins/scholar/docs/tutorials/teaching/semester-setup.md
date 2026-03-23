# Tutorial: Semester Setup

**Time:** 15 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- Access to Claude API (ANTHROPIC_API_KEY set)
- Basic familiarity with command line

**What you'll learn:**

- Create a complete course directory structure
- Configure Scholar for your specific course
- Generate your first syllabus with AI
- Initialize git version control for your course
- Create first week's teaching materials
- Set up workflow for semester-long content

---

## Overview

This tutorial guides first-time instructors through setting up a complete course from scratch using Scholar. By the end, you'll have a fully configured course directory with syllabus, version control, and first week's materials ready to deploy.

**What you'll build:**

```
stat-440-spring-2026/
├── .flow/
│   └── teach-config.yml          # Course configuration
├── .git/                          # Version control
├── syllabus.md                    # AI-generated syllabus
├── week-01/
│   ├── slides-introduction.qmd   # Lecture slides
│   ├── assignment-01.md          # Homework
│   └── quiz-01.md                # Weekly quiz
└── README.md                      # Course overview
```

**Time breakdown:**

- Directory setup: 1 min
- Configuration: 2 min
- Syllabus generation: 2 min
- Git initialization: 1 min
- First week content: 5 min
- Review and customization: 4 min

---

## Step 1: Create Course Directory Structure ⏱️ 1 minute

**What to do:**

Create a well-organized directory structure for your entire semester. This structure separates different types of course materials and makes content easy to find.

**Example:**

```bash
# Navigate to your teaching directory
cd ~/teaching

# Create course directory (adjust to your course code and semester)
mkdir -p stat-440-spring-2026
cd stat-440-spring-2026

# Create subdirectories for all course materials
mkdir -p exams quizzes assignments slides lectures rubrics handouts data
```

**Directory purposes:**

| Directory | Purpose | Example Files |
|-----------|---------|---------------|
| `exams/` | Midterms, finals, practice exams | `midterm-01.qmd`, `final.tex` |
| `quizzes/` | Weekly or unit quizzes | `quiz-week-01.md`, `quiz-regression.md` |
| `assignments/` | Homework assignments | `hw-01.qmd`, `project-guidelines.md` |
| `slides/` | Lecture slides | `week-01-introduction.qmd` |
| `lectures/` | Full lecture notes (20-40 pages) | `lecture-multiple-regression.qmd` |
| `rubrics/` | Grading rubrics | `rubric-midterm.md`, `rubric-project.md` |
| `handouts/` | Additional materials | `formula-sheet.pdf`, `r-reference.md` |
| `data/` | Datasets for examples | `salary.csv`, `housing.rds` |

**What you'll see:**

```bash
# Verify structure was created
ls -la

# Output:
drwxr-xr-x   assignments/
drwxr-xr-x   data/
drwxr-xr-x   exams/
drwxr-xr-x   handouts/
drwxr-xr-x   lectures/
drwxr-xr-x   quizzes/
drwxr-xr-x   rubrics/
drwxr-xr-x   slides/
```

**✅ Checkpoint:**

- Run `pwd` to verify you're in the course directory
- Run `ls -d */` to list all subdirectories
- Confirm you see 8 subdirectories
- All directories should be empty (this is correct)

---

## Step 2: Configure Scholar ⏱️ 2 minutes

**What to do:**

Create a configuration file that tells Scholar about your course. This allows Scholar to generate appropriately tailored content with correct difficulty, notation, and style.

First, create the configuration directory:

```bash
mkdir -p .flow
```

Then create the configuration file at `.flow/teach-config.yml`:

**Example:**

For an undergraduate regression course:

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"           # Options: undergraduate, graduate
    field: "statistics"              # Your discipline
    difficulty: "intermediate"       # Options: beginner, intermediate, advanced
    semester: "Spring 2026"
    credits: 3
    instructor:
      name: "Dr. Sarah Johnson"
      email: "sjohnson@university.edu"
      office: "Math Building 215"
      office_hours: "MWF 2-3pm, or by appointment"

  defaults:
    exam_format: "quarto"            # Options: md, qmd, tex, json
    lecture_format: "quarto"         # Recommended: quarto for reproducibility
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "numerical"                  # Good for stats courses
      - "essay"

  style:
    tone: "formal"                   # Options: formal, conversational
    notation: "statistical"          # LaTeX math notation style
    examples: true                   # Include worked examples
    difficulty_progression: "gradual" # Start easier, build complexity

  topics:                            # Your semester topics
    - "Simple Linear Regression"
    - "Multiple Linear Regression"
    - "Model Diagnostics"
    - "Transformations"
    - "Variable Selection"
    - "Polynomial Regression"
    - "Interaction Terms"
    - "Logistic Regression"
    - "Generalized Linear Models"
    - "Mixed Effects Models"

  grading:                           # Grading breakdown (percentages)
    homework: 30
    quizzes: 15
    midterm1: 20
    midterm2: 20
    final: 15
```

**For a graduate course**, adjust difficulty and style:

```yaml
scholar:
  course_info:
    level: "graduate"
    difficulty: "advanced"

  style:
    tone: "formal"
    notation: "statistical"
    examples: true
    include_proofs: true             # Add mathematical proofs
    include_derivations: true        # Show full derivations
```

**For an introductory course**, simplify:

```yaml
scholar:
  course_info:
    level: "undergraduate"
    difficulty: "beginner"

  style:
    tone: "conversational"           # More accessible
    notation: "intuitive"
    examples: true
    include_intuition: true          # Emphasize conceptual understanding
```

**What you'll see:**

After creating the file, verify it's readable:

```bash
cat .flow/teach-config.yml
```

You should see your YAML configuration printed to the terminal.

**✅ Checkpoint:**

- Run `ls -la .flow/` to verify the directory exists
- Run `cat .flow/teach-config.yml` to verify the file was created
- Check that YAML indentation is correct (2 spaces, no tabs)
- Verify your course code, title, and instructor info are correct
- Confirm topic list matches your planned semester content

**Common configuration mistakes:**

❌ **Wrong:** Using tabs for indentation

```yaml
scholar:
→   course_info:  # Tab character - YAML parsers reject this
```

✅ **Correct:** Using spaces for indentation

```yaml
scholar:
  course_info:    # 2 spaces - proper YAML
```

❌ **Wrong:** Inconsistent difficulty settings

```yaml
course_info:
  difficulty: "intermediate"
  level: "graduate"           # Mismatch: graduate should be "advanced"
```

✅ **Correct:** Aligned difficulty and level

```yaml
course_info:
  difficulty: "advanced"      # Matches graduate level
  level: "graduate"
```

---

## Step 3: Generate Initial Syllabus ⏱️ 2 minutes

**What to do:**

Use Scholar to generate a comprehensive course syllabus based on your configuration. This creates a professional syllabus with learning objectives, schedule, policies, and grading breakdown.

**Example:**

```bash
/teaching:syllabus "STAT 440: Regression Analysis" "Spring 2026"
```

**What you'll see:**

Scholar will generate `syllabus.md` in your course directory:

```markdown
# STAT 440: Regression Analysis
## Spring 2026

**Instructor:** Dr. Sarah Johnson
**Email:** sjohnson@university.edu
**Office:** Math Building 215
**Office Hours:** MWF 2-3pm, or by appointment

**Credits:** 3
**Prerequisites:** STAT 330 (Introduction to Statistical Methods)

---

## Course Description

This course provides a comprehensive introduction to regression analysis, covering
simple and multiple linear regression, model diagnostics, variable selection, and
extensions to generalized linear models. Students will develop skills in statistical
modeling, interpretation, and application using modern statistical software.

---

## Learning Objectives

By the end of this course, students will be able to:

1. Fit and interpret simple and multiple linear regression models
2. Assess model assumptions using diagnostic plots and statistical tests
3. Apply transformations to improve model fit
4. Select appropriate variables using statistical criteria
5. Extend linear models to polynomial and interaction terms
6. Fit and interpret logistic regression models
7. Use statistical software (R) for regression analysis
8. Communicate statistical results effectively in writing and presentations

---

## Course Schedule

### Week 1: Introduction to Regression
- Simple linear regression concepts
- Least squares estimation
- R² and correlation

### Week 2-3: Simple Linear Regression
- Inference for regression coefficients
- Confidence and prediction intervals
- Model assumptions and diagnostics

### Week 4-5: Multiple Linear Regression
- Multiple predictors
- Partial regression coefficients
- Adjusted R²

### Week 6: Model Diagnostics
- Residual analysis
- Influential observations
- Multicollinearity

### Week 7: Midterm Exam 1

### Week 8-9: Transformations and Variable Selection
- Power transformations
- Log transformations
- Stepwise selection, AIC, BIC

### Week 10-11: Extensions
- Polynomial regression
- Interaction terms
- Categorical predictors

### Week 12: Midterm Exam 2

### Week 13-14: Logistic Regression
- Binary outcomes
- Odds ratios
- Model diagnostics for GLMs

### Week 15: Generalized Linear Models & Mixed Effects
- GLM framework
- Introduction to mixed models

### Week 16: Final Exam

---

## Grading

| Component | Weight |
|-----------|--------|
| Homework (10 assignments) | 30% |
| Quizzes (weekly) | 15% |
| Midterm Exam 1 | 20% |
| Midterm Exam 2 | 20% |
| Final Exam | 15% |
| **Total** | **100%** |

### Grade Scale
- A: 90-100%
- B: 80-89%
- C: 70-79%
- D: 60-69%
- F: Below 60%

---

## Course Policies

### Attendance
Regular attendance is expected. If you must miss class, review notes from
a classmate and contact the instructor if you have questions.

### Late Work
Homework assignments lose 10% per day late. No credit after 3 days.
No late quizzes accepted (lowest quiz grade dropped).

### Academic Integrity
All work must be your own. You may discuss concepts with classmates, but
all written work and code must be original. Violations will result in a
failing grade and referral to the academic integrity board.

### Accommodations
Students requiring accommodations should contact the Office of Disability
Services and provide documentation to the instructor within the first week.

---

## Required Materials

### Textbook
- *Applied Linear Regression Models* by Kutner, Nachtsheim, Neter (4th edition)
- *An Introduction to Statistical Learning* by James et al. (free online)

### Software
- R (free download from r-project.org)
- RStudio (free download from posit.co)

### Additional Resources
- Course website on Canvas
- Office hours for one-on-one help
- Statistics tutoring center (Math Building 105)

---

## Course Expectations

- Complete all assigned readings before class
- Attempt homework problems independently first
- Attend office hours when you need help
- Practice coding in R regularly
- Ask questions in class and on Canvas
```

**Why this matters:**

The syllabus sets expectations and provides students with:

- Clear learning objectives
- Week-by-week schedule
- Transparent grading policies
- Contact information and resources

**✅ Checkpoint:**

- Run `ls -l syllabus.md` to verify the file exists
- Open `syllabus.md` and review the content
- Check that course code, title, and instructor info are correct
- Verify the course schedule matches your planned topics (from config)
- Confirm grading percentages match your configuration
- Review policies and adjust to match your department's requirements

**Next steps for customization:**

After generation, you'll likely want to customize:

- **Prerequisites:** Adjust based on your department's course sequence
- **Textbooks:** Replace with your preferred textbooks
- **Policies:** Update to match your institution's policies
- **Schedule:** Adjust week-by-week topics to match your pace
- **Office hours:** Update to your actual schedule

---

## Step 4: Initialize Git Repository ⏱️ 1 minute

**What to do:**

Set up version control for your course materials. This allows you to:

- Track changes to exams, assignments, and slides
- Revert mistakes or accidental deletions
- See what you changed since last semester
- Share materials with teaching assistants
- Back up to GitHub/GitLab for safety

**Example:**

```bash
# Initialize git repository
git init

# Create .gitignore to exclude sensitive files
cat > .gitignore << 'EOF'
# Private instructor files
*-solutions.md
*-key.md
*-answer-key.*
private/

# Large data files
*.csv
*.rds
*.rda
data/*.zip

# Compiled output
*.pdf
*.html
_site/
.quarto/

# IDE files
.Rproj.user/
.Rhistory
.RData
.DS_Store

# Temporary files
*.tmp
*.bak
*~
EOF

# Create README
cat > README.md << 'EOF'
# STAT 440: Regression Analysis - Spring 2026

Course materials for STAT 440 taught by Dr. Sarah Johnson.

## Directory Structure

- `exams/` - Midterm and final exams
- `quizzes/` - Weekly quizzes
- `assignments/` - Homework assignments
- `slides/` - Lecture slides
- `lectures/` - Full lecture notes
- `rubrics/` - Grading rubrics
- `data/` - Example datasets

## Setup

This course uses the [Scholar plugin](https://github.com/Data-Wise/scholar)
for content generation. Configuration is in `.flow/teach-config.yml`.

## Software

Students need:
- R (>= 4.0)
- RStudio
- Packages: tidyverse, car, lmtest

## License

Course materials © 2026 Dr. Sarah Johnson. All rights reserved.
EOF

# Add and commit initial files
git add .flow/teach-config.yml syllabus.md README.md .gitignore
git commit -m "Initial course setup: config, syllabus, README"
```

**What you'll see:**

```
Initialized empty Git repository in /Users/you/teaching/stat-440-spring-2026/.git/
[main (root-commit) a1b2c3d] Initial course setup: config, syllabus, README
 4 files changed, 215 insertions(+)
 create mode 100644 .flow/teach-config.yml
 create mode 100644 .gitignore
 create mode 100644 README.md
 create mode 100644 syllabus.md
```

**Why this matters:**

Version control provides:

- **Safety:** Never lose work to accidental deletion
- **History:** See what changed between semesters
- **Collaboration:** Share with TAs, co-instructors
- **Backup:** Push to GitHub for off-site backup
- **Transparency:** Track when you updated each exam/assignment

**Optional: Set up remote backup**

```bash
# Create repository on GitHub, then:
git remote add origin git@github.com:yourusername/stat-440-spring-2026.git
git branch -M main
git push -u origin main
```

**✅ Checkpoint:**

- Run `git status` to verify repository is initialized
- Run `git log` to see your first commit
- Check that `.gitignore` excludes solution files and PDFs
- Verify `README.md` provides clear overview of your course
- If using remote backup, confirm `git remote -v` shows correct URL

---

## Step 5: Create First Week's Content ⏱️ 5 minutes

**What to do:**

Generate all materials for your first week of class: lecture slides, homework assignment, and quiz. This demonstrates a typical weekly workflow you'll repeat throughout the semester.

### 5a. Generate Lecture Slides (2 min)

**Example:**

```bash
# Generate Quarto slides for Week 1
/teaching:slides "Introduction to Regression Analysis" --format qmd

# Move to slides directory
mv slides-introduction-to-regression-analysis.qmd slides/week-01-introduction.qmd
```

**What you'll see:**

```markdown
---
title: "Introduction to Regression Analysis"
subtitle: "STAT 440 - Week 1"
author: "Dr. Sarah Johnson"
format:
  revealjs:
    theme: simple
    slide-number: true
    preview-links: auto
---

## Welcome to STAT 440

### Regression Analysis

- Understanding relationships between variables
- Prediction and inference
- Applications across disciplines

---

## What is Regression?

**Regression analysis** studies the relationship between:

- **Response variable** (Y): What we want to predict/explain
- **Predictor variable(s)** (X): What we use to predict

**Examples:**

- Salary (Y) vs. Years of experience (X)
- House price (Y) vs. Square footage (X)
- Blood pressure (Y) vs. Age, weight, exercise (X)

---

## Course Overview

### Topics This Semester

1. Simple linear regression
2. Multiple regression
3. Model diagnostics
4. Transformations
5. Variable selection
6. Logistic regression

---

## Simple Linear Regression Model

$$Y_i = \beta_0 + \beta_1 X_i + \epsilon_i$$

Where:

- $Y_i$: Response for observation $i$
- $X_i$: Predictor for observation $i$
- $\beta_0$: Intercept (value of Y when X = 0)
- $\beta_1$: Slope (change in Y per unit change in X)
- $\epsilon_i$: Error term (random variation)

---

## Example: Salary vs. Experience

```{r}
#| echo: true
#| fig-width: 8
#| fig-height: 5

library(ggplot2)

# Simulated data
set.seed(123)
experience <- 0:20
salary <- 45000 + 3000 * experience + rnorm(21, 0, 5000)

# Plot
ggplot(data.frame(experience, salary), aes(x = experience, y = salary)) +
  geom_point(size = 3) +
  geom_smooth(method = "lm", se = FALSE, color = "blue") +
  labs(x = "Years of Experience", y = "Salary ($)",
       title = "Salary vs. Experience") +
  theme_minimal()
```

---

## Least Squares Estimation

**Goal:** Find the line that minimizes the sum of squared errors

$$\text{SSE} = \sum_{i=1}^{n} (Y_i - \hat{Y}_i)^2$$

**Solution:**

$$\hat{\beta}_1 = \frac{\sum(X_i - \bar{X})(Y_i - \bar{Y})}{\sum(X_i - \bar{X})^2}$$

$$\hat{\beta}_0 = \bar{Y} - \hat{\beta}_1 \bar{X}$$

---

## R Implementation

```{r}
#| echo: true

# Fit linear model
model <- lm(salary ~ experience)

# View coefficients
summary(model)$coefficients
```

**Interpretation:**

- Intercept: $45,234 - starting salary
- Slope: $2,987/year - salary increase per year of experience

---

## Next Class

- Inference for regression coefficients
- Confidence intervals
- Hypothesis tests for slope

**Homework:** Assignment 1 (due next week)
**Reading:** Chapter 1-2 in textbook

```

### 5b. Create Homework Assignment (2 min)

**Example:**

```bash
# Generate assignment
/teaching:assignment "Simple Linear Regression Basics" --format qmd

# Move to assignments directory
mv assignment-simple-linear-regression-basics.qmd assignments/hw-01.qmd
```

**What you'll see:**

```markdown
---
title: "Homework 1: Simple Linear Regression Basics"
subtitle: "STAT 440 - Due: Week 2"
author: "Your Name"
format: pdf
---

## Instructions

- Show all work for full credit
- Include R code and output
- Round final answers to 3 decimal places
- Submit PDF to Canvas by 11:59pm on due date

---

## Problem 1: Conceptual Understanding (15 points)

**a)** (5 points) In simple linear regression, what is the difference between
the population regression line and the fitted regression line?

**b)** (5 points) Explain why we use the method of least squares to fit a
regression line. What quantity is being minimized?

**c)** (5 points) What does it mean if the slope coefficient $\beta_1 = 0$?
What does this imply about the relationship between X and Y?

---

## Problem 2: Hand Calculations (20 points)

The following data shows the relationship between study hours (X) and exam
score (Y) for 5 students:

| Student | Study Hours (X) | Exam Score (Y) |
|---------|----------------|----------------|
| 1       | 2              | 65             |
| 2       | 4              | 75             |
| 3       | 6              | 82             |
| 4       | 8              | 88             |
| 5       | 10             | 95             |

**a)** (5 points) Calculate the means $\bar{X}$ and $\bar{Y}$.

**b)** (10 points) Calculate the least squares estimates $\hat{\beta}_0$ and
$\hat{\beta}_1$ using the formulas from class.

**c)** (5 points) Write the fitted regression equation $\hat{Y} = \hat{\beta}_0 + \hat{\beta}_1 X$.

---

## Problem 3: R Programming (30 points)

Use the built-in `mtcars` dataset in R to analyze the relationship between
car weight (wt) and fuel efficiency (mpg).

**a)** (5 points) Create a scatter plot of mpg (Y) vs. wt (X). Include axis
labels and a title.

**b)** (10 points) Fit a simple linear regression model with mpg as the
response and wt as the predictor. Report the fitted equation.

**c)** (5 points) Interpret the slope coefficient in context. What does it mean?

**d)** (5 points) What is the predicted mpg for a car weighing 3,000 lbs?

**e)** (5 points) Add the fitted regression line to your scatter plot from part (a).

---

## Problem 4: Real Data Application (35 points)

Download the `salary.csv` dataset from Canvas. This dataset contains information
about employee salaries and years of experience.

**a)** (5 points) Load the data into R and create summary statistics (mean,
median, SD) for both variables.

**b)** (10 points) Create an appropriate plot to visualize the relationship
between experience and salary.

**c)** (10 points) Fit a simple linear regression model. Report and interpret:
   - The intercept
   - The slope
   - The R² value

**d)** (5 points) Use your model to predict the salary for someone with 15
years of experience.

**e)** (5 points) Do you think the linear model is appropriate for this data?
Why or why not?

---

## Submission Guidelines

- Submit a single PDF file to Canvas
- Include all R code and output
- Clearly label each problem and sub-problem
- Round numerical answers to 3 decimal places
- Due: [Date] at 11:59pm

**Late policy:** 10% deduction per day late, no credit after 3 days.
```

### 5c. Create Weekly Quiz (1 min)

**Example:**

```bash
# Generate quiz
/teaching:quiz "Introduction to Regression" 8 --format md

# Move to quizzes directory
mv quiz-introduction-to-regression.md quizzes/quiz-week-01.md
```

**What you'll see:**

```markdown
# Quiz 1: Introduction to Regression

**Time:** 15 minutes
**Points:** 20 points
**Instructions:** Answer all questions. Show work for partial credit.

---

## Question 1 (2 points)

In the simple linear regression model $Y = \beta_0 + \beta_1 X + \epsilon$,
what does $\beta_0$ represent?

A) The slope of the regression line
B) The intercept of the regression line
C) The correlation coefficient
D) The error term

**Answer:** B

---

## Question 2 (2 points)

The method of least squares finds the regression line that minimizes:

A) The sum of errors
B) The sum of squared errors
C) The sum of absolute errors
D) The correlation coefficient

**Answer:** B

---

## Question 3 (3 points)

If the slope coefficient $\beta_1 = 5$, this means:

A) Y increases by 5 units when X = 0
B) Y increases by 5 units for every 1-unit increase in X
C) X increases by 5 units for every 1-unit increase in Y
D) The correlation is 5

**Answer:** B

---

## Question 4 (3 points)

A regression of house price (in thousands) on square footage yields
$\hat{Y} = 50 + 0.15X$. What is the predicted price for a 2,000 sq ft house?

A) $50,150
B) $350,000
C) $35,000
D) $3,050

**Answer:** B ($50,000 + 0.15 × 2,000 = $350,000)

---

## Question 5 (2 points)

True or False: A higher R² value always means the regression model is better.

A) True
B) False

**Answer:** B (False - R² increases with more predictors, doesn't account for
overfitting)

---

## Question 6 (3 points)

Which of the following is NOT an assumption of simple linear regression?

A) Linearity between X and Y
B) Independence of errors
C) X and Y must be normally distributed
D) Constant variance of errors

**Answer:** C (Only errors need to be normal, not X and Y)

---

## Question 7 (3 points)

A negative slope coefficient indicates:

A) No relationship between X and Y
B) Y decreases as X increases
C) Y increases as X increases
D) The model is invalid

**Answer:** B

---

## Question 8 (2 points)

The fitted value $\hat{Y}_i$ represents:

A) The actual observed value of Y
B) The predicted value of Y based on the regression equation
C) The error term
D) The slope coefficient

**Answer:** B

---

## Answer Key

1. B (2 pts)
2. B (2 pts)
3. B (3 pts)
4. B (3 pts)
5. B (2 pts)
6. C (3 pts)
7. B (3 pts)
8. B (2 pts)

**Total:** 20 points
```

### Commit all first week materials

```bash
# Add all new files
git add slides/week-01-introduction.qmd
git add assignments/hw-01.qmd
git add quizzes/quiz-week-01.md

# Commit with descriptive message
git commit -m "feat: add Week 1 materials (slides, homework, quiz)"
```

**What you'll see:**

```
[main b4e8f9a] feat: add Week 1 materials (slides, homework, quiz)
 3 files changed, 387 insertions(+)
 create mode 100644 assignments/hw-01.qmd
 create mode 100644 quizzes/quiz-week-01.md
 create mode 100644 slides/week-01-introduction.qmd
```

**✅ Checkpoint:**

- Run `ls slides/` to verify week-01-introduction.qmd exists
- Run `ls assignments/` to verify hw-01.qmd exists
- Run `ls quizzes/` to verify quiz-week-01.md exists
- Open each file and review the content
- Check that course code and instructor info are correct
- Verify topics match Week 1 from your syllabus
- Run `git log` to see both commits

---

## Common Issues

### Issue 1: "Scholar command not found"

**Symptoms:**

- `/teaching:syllabus` shows "Unknown command"
- Scholar commands don't appear in autocomplete

**Solution:**

1. Verify Scholar is installed:

   ```bash
   claude plugin list | grep scholar
   ```

2. If not listed, install:

   ```bash
   brew install scholar
   # OR for manual installation:
   cd ~/projects/dev-tools/scholar
   ./scripts/install.sh --dev
   ```

3. Restart Claude Code completely

4. Test with demo command:

   ```bash
   /teaching:demo ~/test-course --verify
   ```

### Issue 2: "YAML syntax error in config file"

**Symptoms:**

- Error: "teach-config.yml is invalid"
- Commands fail with "Config parse error"
- Message about "unexpected token"

**Solution:**

1. Check indentation (use spaces, not tabs):

   ```bash
   cat -A .flow/teach-config.yml | head -20
   ```

   Look for `^I` (tab characters) - replace with spaces

2. Verify YAML syntax online:
   - Copy your config to yamllint.com
   - Fix any reported errors

3. Common YAML mistakes:

   ❌ **Wrong:** Tabs for indentation

   ```yaml
   scholar:
   →   course_info:  # Tab character
   ```

   ✅ **Correct:** Spaces only

   ```yaml
   scholar:
     course_info:    # 2 spaces
   ```

   ❌ **Wrong:** Missing colon

   ```yaml
   course_info
     level: "undergraduate"
   ```

   ✅ **Correct:** Colon after key

   ```yaml
   course_info:
     level: "undergraduate"
   ```

4. Use the demo template as starting point:

   ```bash
   /teaching:demo ~/temp-course
   cp ~/temp-course/.flow/teach-config.yml .flow/
   # Then edit with your course info
   ```

### Issue 3: "Git repository not initialized properly"

**Symptoms:**

- `git status` shows "not a git repository"
- `git commit` fails
- Files not being tracked

**Solution:**

1. Verify you're in the course directory:

   ```bash
   pwd
   # Should show: /Users/you/teaching/stat-440-spring-2026
   ```

2. Check if .git exists:

   ```bash
   ls -la | grep .git
   ```

3. If missing, initialize:

   ```bash
   git init
   ```

4. Configure git if needed:

   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@university.edu"
   ```

5. Verify with:

   ```bash
   git status
   # Should show untracked files
   ```

### Issue 4: "Generated content doesn't match my course"

**Symptoms:**

- Syllabus shows wrong course code or title
- Topics don't match your configuration
- Difficulty level seems off

**Solution:**

1. Verify config file is in the right location:

   ```bash
   ls -la .flow/teach-config.yml
   ```

2. Check Scholar found your config:

   ```bash
   /teaching:demo --dry-run
   # Look for "Using config: .flow/teach-config.yml"
   ```

3. Verify config values:

   ```bash
   cat .flow/teach-config.yml | grep -A 5 "course_info:"
   ```

4. Regenerate with explicit config path:

   ```bash
   /teaching:syllabus "My Course" "Semester" --config .flow/teach-config.yml
   ```

5. If still wrong, use demo template as reference:

   ```bash
   /teaching:demo ~/temp
   diff .flow/teach-config.yml ~/temp/.flow/teach-config.yml
   ```

### Issue 5: "Quarto render fails"

**Symptoms:**

- `quarto render slides/week-01.qmd` fails
- Error: "quarto command not found"
- PDF generation errors

**Solution:**

1. Install Quarto:

   ```bash
   brew install quarto
   # OR download from quarto.org
   ```

2. Verify installation:

   ```bash
   quarto --version
   # Should show version 1.3+ or higher
   ```

3. Test with simple document:

   ```bash
   quarto render slides/week-01-introduction.qmd
   ```

4. Check for LaTeX if rendering to PDF:

   ```bash
   # Install minimal LaTeX
   brew install basictex
   # OR install full TeXLive
   ```

5. If specific render errors, check:
   - YAML header syntax
   - R code chunk syntax (if using)
   - Missing R packages

---

## Next Steps

### Continue Building Your Course

Now that you have Week 1 complete, create materials for the rest of the semester:

**Week 2-15:** Repeat the workflow from Step 5

```bash
# For each week:
cd ~/teaching/stat-440-spring-2026

# Generate slides
/teaching:slides "Week [N] Topic" --format qmd
mv slides-week-*.qmd slides/week-[N]-topic.qmd

# Create assignment
/teaching:assignment "Week [N] Problems" --format qmd
mv assignment-*.qmd assignments/hw-[N].qmd

# Create quiz
/teaching:quiz "Week [N] Concepts" 8 --format md
mv quiz-*.md quizzes/quiz-week-[N].md

# Commit
git add slides/ assignments/ quizzes/
git commit -m "feat: add Week [N] materials"
```

**Estimated time per week:** 10-15 minutes of generation + 20-30 minutes of review/customization

**Weekly workflow saves:** 2-3 hours compared to creating from scratch

### Create Major Assessments

**Midterm 1 (Week 7):**

```bash
cd exams/
/teaching:exam midterm --questions 12 --duration 75 --format qmd
/teaching:rubric "midterm exam"
git add exams/
git commit -m "feat: add Midterm 1 exam and rubric"
```

**Midterm 2 (Week 12):**

```bash
cd exams/
/teaching:exam midterm --questions 15 --difficulty hard --format qmd
/teaching:rubric "midterm 2 exam"
git add exams/
git commit -m "feat: add Midterm 2 exam and rubric"
```

**Final Exam (Week 16):**

```bash
cd exams/
/teaching:exam final --questions 20 --duration 120 --format qmd
/teaching:rubric "final exam"
git add exams/
git commit -m "feat: add Final exam and rubric"
```

### Automation Tips

**Create a weekly generation script** (`scripts/generate-week.sh`):

```bash
#!/bin/bash
# Usage: ./scripts/generate-week.sh 2 "Multiple Regression"

WEEK=$1
TOPIC=$2

/teaching:slides "$TOPIC" --format qmd
mv slides-*.qmd slides/week-$(printf "%02d" $WEEK)-*.qmd

/teaching:assignment "$TOPIC Problems" --format qmd
mv assignment-*.qmd assignments/hw-$(printf "%02d" $WEEK).qmd

/teaching:quiz "$TOPIC Concepts" 8 --format md
mv quiz-*.md quizzes/quiz-week-$(printf "%02d" $WEEK).md

git add slides/ assignments/ quizzes/
git commit -m "feat: add Week $WEEK materials ($TOPIC)"

echo "Week $WEEK materials generated and committed!"
```

**Usage:**

```bash
chmod +x scripts/generate-week.sh
./scripts/generate-week.sh 2 "Multiple Regression"
```

### Related Tutorials

**Recommended next tutorials:**

1. **[Weekly Content Creation](weekly-content.md)** - Master the repeatable workflow for generating week-by-week materials

2. **[Your First Exam](first-exam.md)** - Deep dive into creating comprehensive exams with Scholar

3. **[Weekly Content Creation](weekly-content.md)** - Create weekly quizzes, assignments, and lectures

### Integration with Course Management

**Canvas/Moodle Integration:**

- Export exams to Canvas QTI format using `/teaching:canvas`
- Upload quizzes directly to your LMS
- Use PDF exports for printed handouts

**Quarto Publishing:**

```bash
# Create course website
quarto create-project . --type website

# Render all materials
quarto render

# Deploy to GitHub Pages
quarto publish gh-pages
```

### Semester Maintenance

**Regular git commits:**

```bash
# After each week
git add .
git commit -m "Update week [N] materials after class feedback"

# Push to remote backup
git push origin main
```

**Version tagging:**

```bash
# End of semester
git tag -a "spring-2026" -m "Spring 2026 semester complete"
git push --tags
```

**Prepare for next semester:**

```bash
# Create new branch for next semester
git checkout -b fall-2026

# Update config
vim .flow/teach-config.yml
# Change: semester: "Fall 2026"

# Regenerate syllabus
/teaching:syllabus "STAT 440" "Fall 2026"

git commit -am "Update for Fall 2026 semester"
```

---

## Additional Resources

### Documentation

- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md)** - Complete API documentation
- **[Configuration Guide](../../CONFIGURATION.md)** - Full config options reference
- **[Teaching Style Guide](../../TEACHING-STYLE-GUIDE.md)** - Customize tone and notation

### Tutorials

- **[Weekly Content Creation](weekly-content.md)** - Workflow for regular content generation
- **[Your First Exam](first-exam.md)** - Comprehensive exam creation guide
- **[Teaching Workflows](../../TEACHING-WORKFLOWS.md)** - Common workflow patterns

### Examples

- **[Teaching Examples](../../examples/teaching.md)** - Real-world course examples
- **[Command Examples](../../COMMAND-EXAMPLES.md)** - All commands demonstrated

### Quick References

- **[Teaching Commands Refcard](../../refcards/teaching-commands.md)** - One-page command reference
- **[Teaching Workflows Refcard](../../refcards/teaching-workflows.md)** - Common workflow patterns

### Help

- **[FAQ](../../help/FAQ-teaching.md)** - Frequently asked questions
- **[Common Issues](../../help/COMMON-ISSUES.md)** - Troubleshooting guide

---

**🎓 Congratulations!** You've set up a complete course structure with Scholar. Your semester is ready to go!
