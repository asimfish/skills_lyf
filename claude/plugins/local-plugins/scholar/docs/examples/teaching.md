# Teaching Examples Hub

**Quick Navigation:** [Custom Instructions](#custom-instructions) | [Exams](#exam-examples) | [Quizzes](#quiz-examples) | [Assignments](#assignment-examples) | [Solution Keys](#solution-key-examples) | [Lectures](#lecture-examples) | [Syllabus](#syllabus-examples) | [Semester Workflow](#semester-long-course-example)

---

## Overview

Welcome to the comprehensive teaching examples hub for Scholar. This page organizes all teaching-related examples by activity type, from quick weekly quizzes to complete semester courses. Whether you're creating your first exam, building weekly lecture content, or setting up a full course, you'll find practical examples and complete workflows here.

**What's Covered:**

- Exam creation with multiple formats (Markdown, Quarto, LaTeX, Canvas QTI)
- Quick quiz generation for formative assessment
- Homework assignments with solutions and rubrics
- Standalone solution key generation from existing assignments
- Lecture notes and slides
- Course syllabus generation
- Complete semester workflows
- Integration with `.flow/teach-config.yml`
- Custom instructions with `-i` flag (v2.11.0) — 9 AI-capable commands

**Key Resources:**

- [Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md) - Complete command documentation
- [Teaching Workflows](../TEACHING-WORKFLOWS.md) - Common workflow patterns
- [Teaching Index](../teaching/index.md) - Getting started guide
- [Tutorials](../tutorials/teaching/first-exam.md) - Step-by-step guides

---

## Getting Started

### Prerequisites

- Scholar installed via Homebrew: `brew install data-wise/tap/scholar`
- Optional: Quarto (for `.qmd` output), LaTeX (for `.tex` output), examark (for Canvas QTI)
- Optional: `.flow/teach-config.yml` for course customization

### Quick Start (2 minutes)

Generate your first exam:

```bash
/teaching:exam midterm
```

That's it. Scholar generates a complete midterm exam with:

- 10-12 questions covering course material
- Multiple question types (multiple choice, short answer, problem solving)
- Point values and time estimates
- Answer key with detailed solutions
- Markdown format (easily converted to PDF/Word)

### Scholar Teaching Commands Overview

| Category | Commands | Typical Use |
|----------|----------|-------------|
| **Content** | 7 commands | Exams, quizzes, assignments, solution keys, lectures, slides, syllabus |
| **Assessment** | 2 commands | Rubrics, feedback |
| **Quality** | 2 commands | R code validation, preflight checks |
| **Export** | 1 command | Canvas QTI export |
| **Config** | 5 commands | Validate, diff, sync, migrate, config |
| **Testing** | 1 command | Demo all features |

**Total:** {{ scholar.teaching_commands }} teaching commands covering complete course lifecycle.

---

## Course Configuration

Before generating content, configure Scholar for your course. This is optional but recommended for consistent, high-quality output.

### .flow/teach-config.yml

Create this file in your course directory:

```yaml
# .flow/teach-config.yml
scholar:
  course_info:
    title: "STAT 440: Regression Analysis"
    level: "undergraduate"        # or "graduate"
    field: "statistics"            # or "data_science", "biostatistics"
    difficulty: "intermediate"     # "beginner", "intermediate", "advanced"
    institution: "University of Nebraska-Lincoln"
    instructor: "Dr. John Smith"

  defaults:
    exam_format: "quarto"          # "markdown", "quarto", "tex", "json"
    lecture_format: "quarto"
    assignment_format: "markdown"
    include_solutions: true        # Include answer keys
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "problem-solving"
      - "proof"

  style:
    tone: "formal"                 # "formal", "conversational"
    notation: "statistical"        # LaTeX math notation style
    examples: true                 # Include worked examples
    difficulty_progression: true   # Easy → Hard ordering
```

**What This Does:**

- Customizes all generated content for your course
- Sets default output formats (easily overridden per command)
- Controls question types and difficulty
- Maintains consistent style across all materials

**Example:** With this config, `/teaching:exam midterm` automatically generates a Quarto-formatted exam tailored to an undergraduate regression course.

---

## Custom Instructions

> **New in v2.11.0** — All 8 AI-generating commands support the `-i` flag.

Add per-invocation instructions that are AI-categorized and merged into your generation prompt. You review a summary before generation begins.

### Inline Instructions

```bash
# Healthcare-focused exam with R code
/teaching:exam midterm --topics "regression" -i "Use healthcare datasets, include R code"

# Conversational quiz style
/teaching:quiz "ANOVA" 10 -i "Keep it conversational, use penguin dataset examples"

# Slides with specific constraints
/teaching:slides "Bayesian Inference" -i "Max 20 slides, animated transitions, no proofs"
```

### Instructions from File

```bash
# Save reusable instructions
echo "Use healthcare datasets (BMI, blood pressure, clinical trials)
Include R code with tidyverse
Conversational tone
No more than 3 essay questions" > my-instructions.txt

# Reference with @
/teaching:exam final -i @my-instructions.txt
```

### Approval Workflow

When you use `-i`, Scholar shows a summary before generating:

```
## Generation Plan

**Base:** Default exam prompt
**Custom instructions:** 4 applied

| Category    | Instructions                          |
|-------------|---------------------------------------|
| Content     | Use healthcare datasets               |
| Format      | Include R code snippets               |
| Style       | Conversational tone                   |
| Constraints | No more than 3 essay questions        |

### Notices
- [i] Style instructions may override config tone "formal"

---
**Accept** to generate | **Modify** to change instructions | **Cancel** to abort
```

You can modify instructions unlimited times before accepting.

---

## Exam Examples

> **Full Guide:** [First Exam Tutorial](../tutorials/teaching/first-exam.md)

Exams are Scholar's flagship teaching feature. Generate comprehensive assessments in seconds, with full customization and multiple output formats.

### Quick Reference

| Exam Type | Command | Questions | Duration |
|-----------|---------|-----------|----------|
| Midterm | `/teaching:exam midterm` | 10-12 | 75 min |
| Final | `/teaching:exam final` | 18-20 | 120 min |
| Quiz Exam | `/teaching:exam quiz1` | 5-7 | 30 min |
| Custom | `/teaching:exam custom --questions 15` | 15 | 90 min |

### Example 1: Standard Midterm Exam

**Scenario:** You're teaching STAT 440 (Regression Analysis) and need a midterm covering simple regression, multiple regression, and diagnostics.

**Command:**

```bash
cd ~/teaching/stat-440-spring-2026/exams

/teaching:exam midterm \
  --topics "simple regression,multiple regression,diagnostics" \
  --questions 12 \
  --duration 75 \
  --format quarto
```

**Output:** `midterm-exam.qmd`

```markdown
---
title: "STAT 440: Midterm Exam"
subtitle: "Regression Analysis"
date: "2026-03-15"
format:
  pdf:
    documentclass: article
    geometry: margin=1in
---

## Instructions

- **Duration:** 75 minutes
- **Total Points:** 100
- **Materials Allowed:** Calculator, one 8.5" × 11" formula sheet (both sides)
- **Instructions:** Show all work for full credit. Clearly indicate your final answers.

---

## Part 1: Multiple Choice (30 points, 3 points each)

**Question 1.** In simple linear regression $Y = \beta_0 + \beta_1 X + \epsilon$, which assumption is violated if the residuals show a clear pattern when plotted against fitted values?

a) Independence of errors
b) Normality of errors
c) **Constant variance (homoscedasticity)** ✓
d) Linearity

**Points:** 3 | **Time:** 1 minute

---

**Question 2.** The coefficient of determination $R^2$ represents:

a) The correlation between X and Y
b) **The proportion of variance in Y explained by the model** ✓
c) The average prediction error
d) The slope of the regression line

**Points:** 3 | **Time:** 1 minute

---

[... 8 more multiple choice questions ...]

---

## Part 2: Short Answer (30 points, 10 points each)

**Question 11.** Explain the difference between $\hat{\beta}_1$ and $\beta_1$ in simple linear regression. Why do we need to estimate $\beta_1$ rather than knowing its exact value?

**Points:** 10 | **Time:** 5 minutes

**Expected Answer:**

- $\beta_1$ is the true population slope parameter representing the linear relationship between X and Y in the population
- $\hat{\beta}_1$ is the sample estimate of $\beta_1$ computed from observed data using least squares
- We estimate because we rarely have access to the entire population; we work with a sample
- $\hat{\beta}_1$ is a random variable that varies from sample to sample
- As sample size increases, $\hat{\beta}_1$ converges to $\beta_1$ (consistency)

**Grading Rubric:**
- 4 points: Clear distinction between parameter and estimate
- 3 points: Explanation of why estimation is necessary
- 3 points: Recognition that $\hat{\beta}_1$ is random/varies across samples

---

[... 2 more short answer questions ...]

---

## Part 3: Problem Solving (40 points, 20 points each)

**Question 14.** A researcher fits a simple linear regression model predicting test scores (Y) from study hours (X) for n = 30 students. The output shows:

- $\hat{\beta}_0 = 55.2$, $SE(\hat{\beta}_0) = 3.8$
- $\hat{\beta}_1 = 4.7$, $SE(\hat{\beta}_1) = 0.9$
- $R^2 = 0.68$, $\hat{\sigma} = 8.2$

a) Write the fitted regression equation. (3 points)

b) Interpret the slope coefficient $\hat{\beta}_1 = 4.7$ in context. (4 points)

c) Test $H_0: \beta_1 = 0$ vs $H_A: \beta_1 \neq 0$ at $\alpha = 0.05$. Report the test statistic, p-value (approximate), and conclusion. (8 points)

d) Construct a 95% confidence interval for $\beta_1$. (5 points)

**Points:** 20 | **Time:** 15 minutes

**Solution:**

a) Fitted equation: $\hat{Y} = 55.2 + 4.7X$

b) Interpretation: For each additional hour of study, the predicted test score increases by 4.7 points, on average. (Note: This is the estimated average change, not causal unless study hours were randomized.)

c) Test statistic:
   $$t = \frac{\hat{\beta}_1 - 0}{SE(\hat{\beta}_1)} = \frac{4.7}{0.9} = 5.22$$

   Degrees of freedom: $df = n - 2 = 28$

   Critical value: $t_{0.025, 28} \approx 2.048$

   Since $|t| = 5.22 > 2.048$, reject $H_0$.

   Conclusion: There is strong evidence ($p < 0.001$) that study hours are linearly associated with test scores.

d) 95% CI: $\hat{\beta}_1 \pm t_{0.025, 28} \times SE(\hat{\beta}_1)$
   $$4.7 \pm 2.048 \times 0.9 = 4.7 \pm 1.84 = (2.86, 6.54)$$

   We are 95% confident that the true slope is between 2.86 and 6.54 points per study hour.

**Grading Rubric:**
- Part (a): 3 points for correct equation
- Part (b): 4 points (2 for numeric interpretation, 2 for "on average" language)
- Part (c): 8 points (2 for test statistic, 2 for critical value, 2 for decision rule, 2 for conclusion in context)
- Part (d): 5 points (2 for formula, 3 for correct interval with interpretation)

---

[... 1 more problem solving question ...]

---

## Answer Key

[Provided on separate document for instructors]

---

**Exam Statistics:**

- Total Points: 100
- Estimated Time: 75 minutes
- Difficulty: Intermediate
- Coverage: Simple regression (40%), Multiple regression (35%), Diagnostics (25%)
```

**Key Features:**

- ✅ Multiple question types (MC, short answer, problem solving)
- ✅ Point values and time estimates for each question
- ✅ Detailed solutions with grading rubrics
- ✅ Statistical notation properly formatted (LaTeX)
- ✅ Ready to compile to PDF via Quarto

**Time Saved:** 3-5 hours of manual exam creation

### Example 2: Final Exam with Comprehensive Coverage

**Scenario:** End-of-semester final covering all course topics.

**Command:**

```bash
/teaching:exam final \
  --topics "descriptive statistics,probability,simple regression,multiple regression,diagnostics,transformations,categorical predictors,interaction effects" \
  --questions 20 \
  --duration 120 \
  --difficulty mixed \
  --format quarto
```

**Output:** Comprehensive 20-question exam with:

- 10 multiple choice (2 points each)
- 5 short answer (8 points each)
- 5 problem solving (12 points each)
- Total: 120 points, 120 minutes
- Full solutions and rubrics

**Time Saved:** 5-8 hours

### Example 3: Quick Quiz Exam

**Scenario:** 30-minute in-class quiz on hypothesis testing.

**Command:**

```bash
/teaching:exam quiz3 \
  --topics "hypothesis testing,p-values,Type I and II errors" \
  --questions 6 \
  --duration 30 \
  --format markdown
```

**Output:** Short 6-question quiz (mostly multiple choice and short calculations) ready to print or upload to LMS.

### Example 4: Canvas LMS Format (QTI Export)

**Scenario:** You need to upload exam to Canvas LMS.

**Command:**

```bash
/teaching:exam midterm \
  --topics "regression,ANOVA" \
  --questions 12 \
  --format qti
```

**Output:** `midterm-exam.zip` containing:

- QTI XML files compatible with Canvas
- Questions with randomization options
- Automatic grading for multiple choice
- Solutions embedded for manual grading

**Upload:** Canvas → Quizzes → Import → Upload `midterm-exam.zip`

### Exam Customization Options

Scholar supports extensive customization:

```bash
# Adjust difficulty
/teaching:exam midterm --difficulty easy    # Beginner-friendly
/teaching:exam midterm --difficulty hard    # Graduate-level

# Control question types
/teaching:exam midterm --types "multiple-choice,short-answer"

# Add specific constraints
/teaching:exam midterm --no-proofs          # Skip proof questions
/teaching:exam midterm --open-book          # Open-book exam format

# Multiple output formats simultaneously
/teaching:exam midterm --format quarto,tex,json
```

### More Exam Examples

- [First Exam Tutorial](../tutorials/teaching/first-exam.md) - Step-by-step guide
- [LMS Integration](../tutorials/advanced/lms-integration.md)
- [Custom Prompts](../tutorials/advanced/custom-prompts.md)

→ [Complete Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md#teachingexam)

---

## Quiz Examples

> **Full Guide:** [Weekly Content Tutorial](../tutorials/teaching/weekly-content.md)

Quizzes are Scholar's fastest content generation feature. Generate 5-question formative assessments in under 60 seconds.

### Quick Reference

| Quiz Type | Command | Use Case | Time |
|-----------|---------|----------|------|
| Concept check | `/teaching:quiz "topic"` | After lecture | 1 min |
| Weekly quiz | `/teaching:quiz "topic" --questions 8` | Homework quiz | 1 min |
| Practice | `/teaching:quiz "topic" --difficulty easy` | Exam prep | 1 min |

### Example 1: Quick Concept Check Quiz

**Scenario:** You just finished lecturing on hypothesis testing. Generate a quick quiz for next class.

**Command:**

```bash
/teaching:quiz "hypothesis testing" --questions 5
```

**Output:** `quiz-hypothesis-testing.md`

```markdown
# Quiz: Hypothesis Testing

**Instructions:** Answer all questions. Each question is worth 2 points.

---

**Question 1.** What is a Type I error?

a) Failing to reject a false null hypothesis
b) **Rejecting a true null hypothesis** ✓
c) Accepting a false null hypothesis
d) Correctly rejecting a false null hypothesis

---

**Question 2.** If a p-value is 0.03 and α = 0.05, what is the correct decision?

a) Fail to reject H₀
b) **Reject H₀** ✓
c) Accept H₀
d) Inconclusive

---

**Question 3.** Which statement is TRUE about p-values?

a) p-value = probability that H₀ is true
b) p-value = probability that HA is true
c) **p-value = probability of observing data as extreme as ours, assuming H₀ is true** ✓
d) p-value = probability of making a Type I error

---

**Question 4.** A researcher sets α = 0.01 instead of α = 0.05. This makes Type I errors:

a) More likely
b) **Less likely** ✓
c) Unchanged
d) Impossible

---

**Question 5.** In hypothesis testing, "statistical significance" means:

a) The result is practically important
b) **The result is unlikely to occur by chance if H₀ is true** ✓
c) The null hypothesis is true
d) The sample size is large enough

---

**Answer Key:**
1. b) | 2. b) | 3. c) | 4. b) | 5. b)
```

**Time Saved:** 30-45 minutes per quiz

### Example 2: Weekly Quiz Series

**Scenario:** You run weekly quizzes for homework credit. Generate a semester's worth in advance.

**Commands:**

```bash
# Week 1: Descriptive Statistics
/teaching:quiz "descriptive statistics,measures of center and spread" --questions 8

# Week 2: Probability Basics
/teaching:quiz "probability rules,conditional probability" --questions 8

# Week 3: Probability Distributions
/teaching:quiz "binomial distribution,normal distribution" --questions 8

# Week 4: Sampling Distributions
/teaching:quiz "sampling distribution of mean,CLT" --questions 8

# Week 5: Confidence Intervals
/teaching:quiz "confidence intervals for means" --questions 8

# ... continue through Week 15
```

**Result:** 15 weekly quizzes ready to deploy throughout semester.

**Time Saved:** 6-8 hours for full semester series

### Example 3: Exam Practice Quiz

**Scenario:** Students requested practice problems before the midterm.

**Command:**

```bash
/teaching:quiz "simple regression,multiple regression,model diagnostics" \
  --questions 12 \
  --difficulty mixed \
  --format quarto \
  --solutions detailed
```

**Output:** 12-question practice quiz with step-by-step solutions, formatted as a nice PDF.

### Quiz Customization

```bash
# Easy quiz for review
/teaching:quiz "topic" --difficulty easy --questions 10

# Graduate-level quiz
/teaching:quiz "topic" --difficulty hard --questions 5

# Specific question types
/teaching:quiz "topic" --types "multiple-choice"

# Include detailed explanations
/teaching:quiz "topic" --solutions detailed
```

### More Quiz Examples

- [Weekly Quiz Series](../tutorials/teaching/weekly-content.md#step-3-create-weekly-quiz-1-minute)
- [Teaching Workflows](../TEACHING-WORKFLOWS.md)

→ [Quiz Command Reference](../TEACHING-COMMANDS-REFERENCE.md#teachingquiz)

---

## Assignment Examples

> **Full Guide:** [Assignments, Solutions, and Rubrics Tutorial](../tutorials/teaching/assignments-solutions-rubrics.md)

Assignments are Scholar's most comprehensive teaching feature. Generate homework problems, solutions, and grading rubrics all at once.

### Quick Reference

| Assignment Type | Command | Components | Time |
|-----------------|---------|------------|------|
| Weekly homework | `/teaching:assignment week3` | Problems + solutions + rubric | 2 min |
| Project | `/teaching:assignment project1` | Description + milestones + rubric | 3 min |
| Lab | `/teaching:assignment lab5` | Exercises + code + rubric | 2 min |

### Example 1: Weekly Homework Assignment

**Scenario:** Week 5 homework on multiple regression and diagnostics.

**Command:**

```bash
/teaching:assignment week5 \
  --topics "multiple regression,model diagnostics,residual plots" \
  --questions 8 \
  --difficulty intermediate \
  --format quarto
```

**Output:** `assignment-week5.qmd`

```markdown
---
title: "Assignment 5: Multiple Regression and Diagnostics"
subtitle: "STAT 440: Regression Analysis"
due-date: "2026-10-15"
format:
  pdf:
    documentclass: article
---

## Instructions

- **Due:** Friday, October 15, 2026 at 11:59 PM
- **Submission:** Upload PDF to Canvas
- **Collaboration:** You may discuss concepts with classmates but must write your own solutions
- **Software:** Use R or Python for computational problems. Include code and output.

---

## Problem 1: Conceptual Understanding (10 points)

Consider the multiple regression model:

$$Y = \beta_0 + \beta_1 X_1 + \beta_2 X_2 + \epsilon$$

where $X_1$ is years of experience and $X_2$ is years of education.

a) Interpret $\beta_1$ in the context of this model. How does this interpretation differ from the slope in a simple linear regression of Y on $X_1$ only? (5 points)

b) Explain why $\hat{\beta}_1$ from the multiple regression model will generally differ from the slope estimate in a simple regression of Y on $X_1$ alone. (5 points)

---

## Problem 2: Model Fitting (15 points)

The file `insurance.csv` contains data on n = 200 insurance claims with:

- `charges`: Total claim amount (response)
- `age`: Customer age (years)
- `bmi`: Body mass index
- `smoker`: Smoking status (0 = no, 1 = yes)

a) Fit a multiple regression model predicting charges from age, BMI, and smoker status. Report the fitted equation. (5 points)

b) Test the hypothesis that smoking status is unrelated to charges, controlling for age and BMI. Use α = 0.05. Report the test statistic, p-value, and conclusion. (5 points)

c) Construct a 95% confidence interval for the effect of smoking on charges. Interpret this interval in context. (5 points)

---

## Problem 3: Residual Analysis (20 points)

Using the model from Problem 2:

a) Create a residual plot (residuals vs fitted values). Describe any patterns you observe. (5 points)

b) Create a Q-Q plot of the residuals. Does the normality assumption appear satisfied? Explain. (5 points)

c) Compute the standardized residuals. Are there any potential outliers (|standardized residual| > 3)? If so, list the observation numbers. (5 points)

d) Based on your diagnostic plots, do you believe the model assumptions are adequately satisfied? If not, what remedies would you suggest? (5 points)

---

## Problem 4: Model Comparison (15 points)

Consider two models for the insurance data:

- **Model 1:** charges ~ age + bmi + smoker
- **Model 2:** charges ~ age + bmi + smoker + age:smoker

where `age:smoker` is the interaction term.

a) Fit both models and report their R² values. Which model explains more variance? (5 points)

b) Test whether the interaction term significantly improves the model using a nested F-test at α = 0.05. Show your work. (5 points)

c) Interpret the interaction term (if significant). What does it tell you about how the effect of age on charges depends on smoking status? (5 points)

---

## Problem 5: Interpretation and Communication (10 points)

A journalist asks you to explain your findings from the insurance analysis in non-technical language.

Write a 150-200 word summary of your key findings that:
- Avoids statistical jargon
- Uses plain language to describe relationships
- Quantifies effect sizes in dollars
- Notes any important limitations

---

**Total Points:** 70
```

**Separate File:** `assignment-week5-solutions.qmd`

```markdown
---
title: "Assignment 5: Solutions"
subtitle: "STAT 440: Regression Analysis"
format:
  pdf:
    documentclass: article
---

## Problem 1: Conceptual Understanding

**Solution:**

a) $\beta_1$ represents the change in Y associated with a one-unit increase in $X_1$ (experience), **holding $X_2$ (education) constant**. This differs from simple linear regression, where $\beta_1$ represents the change in Y per unit increase in $X_1$ **without controlling for any other variables**.

In simple regression, the slope captures both:
- Direct effect of $X_1$ on Y
- Indirect effect through correlation between $X_1$ and $X_2$

In multiple regression, $\beta_1$ isolates the **partial effect** of $X_1$ on Y, removing the influence of $X_2$.

b) $\hat{\beta}_1$ from multiple regression differs from simple regression because:

1. **Confounding:** If $X_1$ and $X_2$ are correlated, the simple regression slope mixes up their effects
2. **Omitted variable bias:** Simple regression attributes all variation in Y to $X_1$, even variation actually due to $X_2$
3. **Mathematical relationship:**

   $$\hat{\beta}_1^{simple} = \hat{\beta}_1^{multiple} + \hat{\beta}_2^{multiple} \times r_{X_1 X_2}$$

   where $r_{X_1 X_2}$ is the correlation between predictors.

Only when $X_1$ and $X_2$ are uncorrelated does $\hat{\beta}_1^{simple} = \hat{\beta}_1^{multiple}$.

---

## Problem 2: Model Fitting

**Solution:**

```r
# Read data
insurance <- read.csv("insurance.csv")

# Fit multiple regression model
model <- lm(charges ~ age + bmi + smoker, data = insurance)
summary(model)
```

**Output:**

```
Coefficients:
            Estimate Std. Error t value Pr(>|t|)
(Intercept)  -6916.3     1022.8  -6.761 1.41e-10 ***
age            256.8       11.9  21.587  < 2e-16 ***
bmi            339.2       28.6  11.860  < 2e-16 ***
smoker       23847.5      413.1  57.723  < 2e-16 ***

Residual standard error: 6062 on 196 degrees of freedom
Multiple R-squared:  0.7509,    Adjusted R-squared:  0.7471
```

a) **Fitted equation:**

   $$\hat{Y} = -6916.3 + 256.8 \times \text{age} + 339.2 \times \text{bmi} + 23847.5 \times \text{smoker}$$

b) **Hypothesis test:**

   $H_0: \beta_3 = 0$ (smoking has no effect, controlling for age and BMI)

   $H_A: \beta_3 \neq 0$ (smoking has an effect)

   Test statistic: $t = 57.723$

   p-value: $p < 0.001$ (essentially zero)

   **Decision:** Reject $H_0$ at α = 0.05.

   **Conclusion:** There is overwhelming evidence that smoking status is associated with insurance charges, even after controlling for age and BMI. Smokers have significantly higher charges than non-smokers.

c) **95% Confidence interval:**

   $$\hat{\beta}_3 \pm t_{0.025, 196} \times SE(\hat{\beta}_3)$$
   $$23847.5 \pm 1.972 \times 413.1 = 23847.5 \pm 814.6 = (23032.9, 24662.1)$$

   **Interpretation:** We are 95% confident that smokers have insurance charges between $23,033 and $24,662 higher than non-smokers, on average, after controlling for age and BMI.

[... Solutions for Problems 3-5 ...]
```

**Separate File:** `assignment-week5-rubric.md`

```markdown
# Assignment 5: Grading Rubric

**Total Points:** 70

---

## Problem 1: Conceptual Understanding (10 points)

**Part (a): Interpretation of β₁ (5 points)**

- [ ] 2 points: Correct interpretation of β₁ as change per unit X₁
- [ ] 2 points: Mentions "holding X₂ constant" or equivalent
- [ ] 1 point: Contrasts with simple regression interpretation

**Part (b): Why estimates differ (5 points)**

- [ ] 2 points: Mentions confounding or correlation between predictors
- [ ] 2 points: Explains omitted variable bias
- [ ] 1 point: Notes that estimates are equal when predictors uncorrelated

---

## Problem 2: Model Fitting (15 points)

**Part (a): Fitted equation (5 points)**

- [ ] 5 points: Correct equation with all coefficients
- [ ] 3 points: Minor errors in coefficients
- [ ] 0 points: Major errors or missing predictors

**Part (b): Hypothesis test (5 points)**

- [ ] 1 point: Correct hypotheses
- [ ] 2 points: Correct test statistic and p-value
- [ ] 2 points: Correct conclusion in context

**Part (c): Confidence interval (5 points)**

- [ ] 2 points: Correct interval calculation
- [ ] 3 points: Correct interpretation in context (dollars, controlling for confounders)

---

## Problem 3: Residual Analysis (20 points)

**Part (a): Residual plot (5 points)**

- [ ] 3 points: Correct plot included
- [ ] 2 points: Thoughtful description of patterns (or lack thereof)

**Part (b): Q-Q plot (5 points)**

- [ ] 3 points: Correct plot included
- [ ] 2 points: Accurate assessment of normality

**Part (c): Outlier detection (5 points)**

- [ ] 3 points: Correct computation of standardized residuals
- [ ] 2 points: Correct identification of outliers (if any)

**Part (d): Overall assessment (5 points)**

- [ ] 3 points: Coherent assessment based on diagnostics
- [ ] 2 points: Appropriate remedies suggested (if violations detected)

---

## Problem 4: Model Comparison (15 points)

**Part (a): R² comparison (5 points)**

- [ ] 3 points: Both models fit correctly
- [ ] 2 points: R² values reported and compared

**Part (b): Nested F-test (5 points)**

- [ ] 2 points: Correct F-statistic
- [ ] 1 point: Correct p-value
- [ ] 2 points: Correct conclusion

**Part (c): Interaction interpretation (5 points)**

- [ ] 5 points: Clear explanation of what interaction means in context
- [ ] 3 points: Correct but incomplete explanation
- [ ] 0 points: Incorrect or missing

---

## Problem 5: Communication (10 points)

**Criteria:**

- [ ] 3 points: Plain language (no jargon)
- [ ] 3 points: Effect sizes quantified in dollars
- [ ] 2 points: Key findings clearly stated
- [ ] 2 points: Limitations noted

**Penalties:**

- -2 points: Excessive use of statistical terminology
- -2 points: Missing quantification
- -1 point: Over/under word count (150-200 required)

---

## General Deductions

- [ ] -5 points: Missing code or output (where required)
- [ ] -3 points: Unclear/illegible work
- [ ] -2 points: No interpretation (just numbers)
- [ ] -2 points: Late submission (per syllabus policy)
```

**Key Features:**

- ✅ Complete assignment with 5 problems spanning concepts, computation, and communication
- ✅ Separate solutions document with R code and output
- ✅ Detailed grading rubric with point allocations
- ✅ Mix of conceptual, computational, and interpretation questions
- ✅ Real-world context (insurance data)

**Time Saved:** 4-6 hours for complete assignment + solutions + rubric

### Example 2: Data Analysis Project

**Scenario:** Major course project analyzing a dataset.

**Command:**

```bash
/teaching:assignment project1 \
  --topics "full regression analysis,model building,diagnostics,interpretation" \
  --type project \
  --duration "2 weeks" \
  --format quarto
```

**Output:** Comprehensive project description with:

- Background and research question
- Dataset description and variables
- Analysis requirements (EDA, model fitting, diagnostics, interpretation)
- Deliverables (report, code, presentation)
- Grading rubric (40+ points)
- Milestones and deadlines

### Example 3: Lab Assignment

**Scenario:** In-class lab on residual diagnostics.

**Command:**

```bash
/teaching:assignment lab8 \
  --topics "residual plots,Q-Q plots,leverage,influence" \
  --type lab \
  --duration "50 minutes" \
  --format markdown \
  --guided
```

**Output:** Step-by-step guided lab with:

- Pre-loaded dataset
- Specific R commands to run
- Questions to answer after each step
- Expected output screenshots
- Quick rubric for completion credit

### Assignment Customization

```bash
# Adjust difficulty
/teaching:assignment week5 --difficulty easy    # Introductory
/teaching:assignment week5 --difficulty hard    # Graduate-level

# Control point distribution
/teaching:assignment week5 --total-points 100

# Include/exclude components
/teaching:assignment week5 --solutions          # With solutions
/teaching:assignment week5 --no-rubric          # Skip rubric

# Specific question types
/teaching:assignment week5 --types "computational,conceptual"
```

### More Assignment Examples

- [Assignments, Solutions, and Rubrics Tutorial](../tutorials/teaching/assignments-solutions-rubrics.md)
- [Teaching Workflows](../TEACHING-WORKFLOWS.md)

→ [Assignment Command Reference](../TEACHING-COMMANDS-REFERENCE.md#teachingassignment)

---

## Solution Key Examples

Generate standalone solution keys from existing assignment files using `/teaching:solution`.

### Basic Solution Key

```bash
# Generate solution key from a .qmd assignment
/teaching:solution assignments/assignment3_multiple_comparisons.qmd
```

Output saved to `solutions/assignment3_multiple_comparisons-solution.qmd` with:

- Step-by-step solutions for each problem
- R code with output interpretation
- Final answers clearly marked
- LaTeX math notation

### Solution Key with Grading Notes

```bash
# Include partial credit guidance and common mistakes
/teaching:solution assignments/hw4.qmd --include-rubric
```

### Custom Instructions

```bash
# Tailor solutions to your teaching style
/teaching:solution assignments/hw3.qmd -i "Use modern p-value interpretation, show hand calculations before R code"
```

### Supported Input Formats

| Input | Command | Output |
|-------|---------|--------|
| Quarto `.qmd` | `/teaching:solution hw3.qmd` | `solutions/hw3-solution.qmd` |
| JSON `.json` | `/teaching:solution hw3.json --format md` | `solutions/hw3-solution.md` |

The parser auto-detects problem headings: `## Problem N`, `## Exercise N`, `## Question N`, `## N.`, and `**Problem N**`.

### Email Solution to TA

```bash
# Email using configured TA address
/teaching:solution assignments/hw3.qmd --send

# Email to explicit address
/teaching:solution assignments/hw3.qmd --send ta@university.edu
```

Uses himalaya MCP for email delivery with preview-before-send workflow.

> [Solution Command Reference](../TEACHING-COMMANDS-REFERENCE.md#teachingsolution)

---

## Lecture Examples

> **Full Guide:** [Weekly Content Tutorial](../tutorials/teaching/weekly-content.md)

Lecture commands generate comprehensive lecture notes with examples, exercises, and slides. New in Scholar v2.5.0.

### Quick Reference

| Lecture Type | Command | Output | Time |
|--------------|---------|--------|------|
| Standard lecture | `/teaching:lecture "topic"` | Notes + examples | 3 min |
| With slides | `/teaching:lecture "topic" --slides` | Notes + slides | 4 min |
| Advanced | `/teaching:lecture "topic" --depth advanced` | Graduate-level | 3 min |

### Example 1: Standard Lecture Notes

**Scenario:** Week 3 lecture on multiple regression.

**Command:**

```bash
/teaching:lecture "Multiple Regression: Model Fitting and Interpretation" \
  --depth intermediate \
  --examples 4 \
  --exercises 6 \
  --format quarto
```

**Output:** `lecture-03-multiple-regression.qmd`

```markdown
---
title: "Lecture 3: Multiple Regression"
subtitle: "Model Fitting and Interpretation"
date: "2026-09-18"
format:
  revealjs:
    theme: simple
    transition: slide
---

## Learning Objectives

By the end of this lecture, you should be able to:

1. Extend simple linear regression to multiple predictors
2. Interpret regression coefficients in multiple regression
3. Understand the difference between partial and marginal effects
4. Fit multiple regression models in R
5. Assess model fit using R² and adjusted R²

---

## Motivation: Why Multiple Regression?

**Real-world relationships are complex.**

- House prices depend on size, age, location, condition...
- Test scores depend on study hours, prior knowledge, sleep...
- Crop yield depends on fertilizer, water, temperature...

**Simple linear regression is too simple:**

- Ignores confounding variables
- Omitted variable bias
- Can't answer "what is the effect of X₁, controlling for X₂?"

**Solution:** Multiple regression

---

## The Multiple Regression Model

**Population Model:**

$$Y = \beta_0 + \beta_1 X_1 + \beta_2 X_2 + \cdots + \beta_p X_p + \epsilon$$

where:

- $Y$: Response variable
- $X_1, ..., X_p$: Predictor variables (features, covariates)
- $\beta_0$: Intercept (Y when all X = 0)
- $\beta_1, ..., \beta_p$: Slope coefficients (partial effects)
- $\epsilon$: Random error ($\epsilon \sim N(0, \sigma^2)$)

---

## Example: Test Score Prediction

**Research Question:** How do study hours and prior GPA predict test scores?

**Model:**

$$\text{Test Score} = \beta_0 + \beta_1 \times \text{Study Hours} + \beta_2 \times \text{Prior GPA} + \epsilon$$

**Interpretation:**

- $\beta_1$: Effect of study hours, **holding prior GPA constant**
- $\beta_2$: Effect of prior GPA, **holding study hours constant**

**Key insight:** Multiple regression isolates the effect of each predictor.

---

## Interpretation of Coefficients

**Partial vs Marginal Effects**

**Marginal effect (simple regression):**
- Total effect of X on Y (includes indirect effects)
- Example: Study hours → Test score (doesn't control for GPA)

**Partial effect (multiple regression):**
- Direct effect of X on Y, holding other predictors constant
- Example: Study hours → Test score, **controlling for GPA**

**Why they differ:** Predictors are often correlated.

---

[... 20 more slides covering: estimation, R example, interpretation, model fit, assumptions, diagnostics ...]

---

## Practice Exercises

### Exercise 1: Interpretation

A researcher fits the model:

$$\text{Salary} = 25000 + 1500 \times \text{Experience} + 800 \times \text{Education} + \epsilon$$

where Experience is in years and Education is years of schooling.

a) Interpret the coefficient 1500 in context.
b) Predict the salary for someone with 5 years experience and 16 years education.
c) What is the salary difference between someone with a bachelor's (16 years) vs master's (18 years), holding experience constant?

---

### Exercise 2: R Practice

Using the `mtcars` dataset:

```r
model <- lm(mpg ~ hp + wt, data = mtcars)
summary(model)
```

a) Write the fitted regression equation.
b) Interpret the coefficient for horsepower (hp).
c) What is the R² value? Interpret it.

---

[... 4 more exercises ...]

---

## Summary

**Key Takeaways:**

1. Multiple regression extends simple regression to multiple predictors
2. Coefficients represent **partial effects**, holding other variables constant
3. Interpretation requires careful attention to "controlling for X"
4. R² measures proportion of variance explained
5. Adjusted R² penalizes model complexity
6. Assumptions: Linearity, independence, homoscedasticity, normality

**Next Lecture:** Model diagnostics and residual analysis

---

## References

- Kutner et al. (2005). *Applied Linear Statistical Models*. Chapter 6.
- James et al. (2021). *An Introduction to Statistical Learning*. Chapter 3.
```

**Key Features:**

- ✅ Complete lecture slides (20-30 slides)
- ✅ Learning objectives clearly stated
- ✅ Motivation and examples
- ✅ Statistical notation and equations
- ✅ Practice exercises embedded
- ✅ Summary and references

**Time Saved:** 3-5 hours per lecture

### Example 2: Lecture with Separate Handout

**Scenario:** You want slides for class + detailed handout for students.

**Command:**

```bash
/teaching:lecture "ANOVA: One-Way Analysis of Variance" \
  --format quarto \
  --handout \
  --examples 5 \
  --exercises 8
```

**Output:**

- `lecture-anova-slides.qmd` - Presentation slides (Reveal.js)
- `lecture-anova-handout.qmd` - Detailed notes with worked examples

### Example 3: Advanced Graduate Lecture

**Scenario:** Graduate-level theory lecture.

**Command:**

```bash
/teaching:lecture "Asymptotic Theory for Regression Estimators" \
  --depth advanced \
  --proofs \
  --format quarto
```

**Output:** Lecture notes with:

- Formal theorems and proofs
- Regularity conditions
- Asymptotic notation (op, Op)
- Advanced references

### Lecture Customization

```bash
# Control depth
/teaching:lecture "topic" --depth beginner      # Intuition-focused
/teaching:lecture "topic" --depth advanced      # Theory-focused

# Add/remove components
/teaching:lecture "topic" --slides --handout    # Both formats
/teaching:lecture "topic" --no-exercises        # Skip practice problems

# Adjust content
/teaching:lecture "topic" --examples 10         # More examples
/teaching:lecture "topic" --proofs              # Include proofs
```

### More Lecture Examples

- [Weekly Lecture Production](../tutorials/teaching/weekly-content.md#step-1-generate-lecture-slides-2-minutes)
- [Lecture Pipeline Diagrams](../LECTURE-PIPELINE-DIAGRAMS.md)

→ [Lecture Command Reference](../TEACHING-COMMANDS-REFERENCE.md#teachinglecture)

---

## Syllabus Examples

> **Full Guide:** [Semester Setup Tutorial](../tutorials/teaching/semester-setup.md)

Generate complete course syllabi with policies, schedule, grading, and learning objectives.

### Example: Complete Course Syllabus

**Command:**

```bash
cd ~/teaching/stat-440-spring-2026

/teaching:syllabus \
  --course "STAT 440: Regression Analysis" \
  --semester "Spring 2026" \
  --instructor "Dr. Jane Smith" \
  --format quarto
```

**Output:** `syllabus.qmd` (8-10 pages)

```markdown
---
title: "STAT 440: Regression Analysis"
subtitle: "Spring 2026 Syllabus"
instructor: "Dr. Jane Smith"
format:
  pdf:
    documentclass: article
---

## Course Information

**Course:** STAT 440 - Regression Analysis
**Credits:** 3
**Prerequisites:** STAT 380 (Probability and Statistics) or equivalent
**Meeting Times:** MWF 10:00-10:50 AM
**Location:** Hardin Hall 163

**Instructor:** Dr. Jane Smith
**Email:** jsmith@university.edu
**Office:** Hardin Hall 343
**Office Hours:** MW 2:00-3:30 PM or by appointment

---

## Course Description

This course provides a comprehensive introduction to regression analysis, the
most widely used statistical method in the sciences, social sciences, and
business. Students will learn to fit, interpret, and evaluate linear
regression models for continuous outcomes. Topics include simple and multiple
linear regression, model diagnostics, transformations, categorical predictors,
interaction effects, and model selection.

**Emphasis:** Practical application using real datasets, statistical
computing in R, and clear communication of findings.

---

## Learning Objectives

By the end of this course, students will be able to:

1. **Fit** simple and multiple linear regression models using least squares
2. **Interpret** regression coefficients, confidence intervals, and p-values in context
3. **Assess** model assumptions using diagnostic plots and tests
4. **Apply** transformations and remedial measures when assumptions are violated
5. **Compare** nested and non-nested models using appropriate criteria
6. **Communicate** statistical findings clearly to technical and non-technical audiences
7. **Use** R to perform regression analyses and create publication-quality graphics

---

## Required Materials

**Textbook:**
- Kutner, M. H., Nachtsheim, C. J., Neter, J., & Li, W. (2005). *Applied Linear Statistical Models* (5th ed.). McGraw-Hill/Irwin.
  - Available as ebook through university library

**Software:**
- R (version 4.0 or higher) - Free at https://www.r-project.org/
- RStudio - Free at https://www.rstudio.com/

**Additional Resources:**
- Course website: Canvas (canvas.university.edu)
- All lecture slides, datasets, and R code posted on Canvas
- Recommended: James et al. (2021). *An Introduction to Statistical Learning with Applications in R*. Free at https://www.statlearning.com/

---

## Grading

| Component | Weight | Description |
|-----------|--------|-------------|
| Homework | 30% | Weekly assignments (drop lowest 2) |
| Quizzes | 10% | In-class quizzes (drop lowest 2) |
| Midterm Exam | 25% | In-class exam (Week 8) |
| Final Exam | 30% | Cumulative final exam |
| Project | 15% | Data analysis project (due Week 15) |

**Grading Scale:**

- A: 93-100% | A-: 90-92.9%
- B+: 87-89.9% | B: 83-86.9% | B-: 80-82.9%
- C+: 77-79.9% | C: 73-76.9% | C-: 70-72.9%
- D+: 67-69.9% | D: 63-66.9% | D-: 60-62.9%
- F: < 60%

---

## Course Schedule

### Week 1: Introduction and Review
- **Topics:** Course overview, descriptive statistics, correlation
- **Reading:** Chapters 1-2
- **Homework:** HW1 (due Week 2)

### Week 2: Simple Linear Regression
- **Topics:** Least squares estimation, interpretation of coefficients
- **Reading:** Chapter 3
- **Homework:** HW2 (due Week 3)

### Week 3: Inference in Simple Linear Regression
- **Topics:** Confidence intervals, hypothesis tests, prediction intervals
- **Reading:** Chapter 4
- **Quiz:** Quiz 1 (Friday)
- **Homework:** HW3 (due Week 4)

[... Weeks 4-15 detailed schedule ...]

---

## Course Policies

### Attendance
Attendance is expected but not explicitly graded. Students are responsible
for all material covered in class, including announcements.

### Late Work
- Homework: 10% penalty per day late (up to 3 days), then zero credit
- Project: No late submissions accepted (due to end-of-semester grading constraints)
- Exams: No makeup exams except for documented emergencies (contact instructor ASAP)

### Collaboration Policy
- **Homework:** You may discuss concepts with classmates but must write your own solutions. Copying code or solutions is academic misconduct.
- **Quizzes:** Individual work only.
- **Exams:** Individual work only.
- **Project:** Individual work only (unless otherwise specified).

### Academic Integrity
All work must be your own. Violations of academic integrity will result in
a zero on the assignment and referral to the Office of Student Conduct.
See university policy: https://studentconduct.unl.edu/

### Accommodations
Students with disabilities are encouraged to contact Services for Students
with Disabilities (SSD) to arrange for appropriate accommodations. Please
provide documentation to the instructor within the first two weeks of the
semester.

---

## University Policies

[Standard university policies on Title IX, mental health resources, etc.]

---

**I look forward to working with you this semester!**
```

**Key Features:**

- ✅ Complete syllabus with all standard sections
- ✅ Week-by-week course schedule
- ✅ Grading breakdown and policies
- ✅ Learning objectives and textbook info
- ✅ University policy boilerplate

**Time Saved:** 2-3 hours

### Syllabus Customization

```bash
# Specify components
/teaching:syllabus --schedule --policies --grading

# Different course levels
/teaching:syllabus --level graduate

# Custom schedule
/teaching:syllabus --weeks 16
```

→ [Syllabus Command Reference](../TEACHING-COMMANDS-REFERENCE.md#teachingsyllabus)

---

## Semester-Long Course Example

This section demonstrates a complete semester workflow using Scholar commands.

### Timeline: 15-Week Semester

**Pre-Semester Preparation (2 hours)**

```bash
# Week 0: Setup
cd ~/teaching/stat-440-spring-2026
git init

# Create directory structure
mkdir -p {lectures,assignments,exams,quizzes,slides,data}

# Generate syllabus
/teaching:syllabus --course "STAT 440" --semester "Spring 2026"

# Create teach-config.yml
cat > .flow/teach-config.yml << EOF
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
  defaults:
    exam_format: "quarto"
    lecture_format: "quarto"
EOF
```

**Weekly Workflow (15 minutes per week)**

```bash
# Week 1: Introduction
/teaching:lecture "Introduction to Regression Analysis" --examples 3
/teaching:quiz "descriptive statistics review" --questions 5
/teaching:assignment week1 --topics "R basics,descriptive statistics"

# Week 2: Simple Linear Regression
/teaching:lecture "Simple Linear Regression" --examples 5 --exercises 8
/teaching:quiz "correlation and covariance" --questions 5
/teaching:assignment week2 --topics "simple linear regression,least squares"

# Week 3: Inference
/teaching:lecture "Inference in Simple Linear Regression" --examples 4
/teaching:quiz "confidence intervals" --questions 5
/teaching:assignment week3 --topics "hypothesis tests,confidence intervals"

# ... Weeks 4-7 ...

# Week 8: Midterm
/teaching:exam midterm \
  --topics "simple regression,multiple regression,inference,diagnostics" \
  --questions 12 \
  --duration 75

# ... Weeks 9-14 ...

# Week 15: Final Exam
/teaching:exam final \
  --topics "all course topics" \
  --questions 20 \
  --duration 120
```

**Total Time Investment**

| Activity | Scholar Time | Manual Time | Time Saved |
|----------|--------------|-------------|------------|
| Syllabus | 5 min | 2 hours | 1h 55m |
| Weekly lectures (15) | 45 min | 45 hours | 44h 15m |
| Weekly quizzes (15) | 15 min | 7.5 hours | 7h 15m |
| Weekly assignments (15) | 30 min | 30 hours | 29h 30m |
| Midterm exam | 5 min | 3 hours | 2h 55m |
| Final exam | 5 min | 5 hours | 4h 55m |
| **Total** | **1h 45m** | **92.5 hours** | **90h 45m** |

**Time Saved per Semester:** ~90 hours (over 2 full work weeks)

---

## Integration with .flow/teach-config.yml

Scholar reads course configuration from `.flow/teach-config.yml` to customize all generated content.

### Configuration Example

```yaml
# .flow/teach-config.yml
scholar:
  course_info:
    title: "STAT 440: Regression Analysis"
    level: "undergraduate"           # "undergraduate" or "graduate"
    field: "statistics"               # "statistics", "data_science", "biostatistics"
    difficulty: "intermediate"        # "beginner", "intermediate", "advanced"
    institution: "University of Nebraska-Lincoln"
    instructor:
      name: "Dr. Jane Smith"
      email: "jsmith@unl.edu"
      office: "Hardin Hall 343"

  defaults:
    exam_format: "quarto"             # "markdown", "quarto", "tex", "json", "qti"
    lecture_format: "quarto"
    assignment_format: "markdown"
    include_solutions: true           # Generate solution keys
    include_rubrics: true             # Generate grading rubrics

    question_types:                   # Allowed question types
      - "multiple-choice"
      - "short-answer"
      - "problem-solving"
      - "proof"                       # (graduate level only)

  style:
    tone: "formal"                    # "formal" or "conversational"
    notation: "statistical"           # LaTeX math notation style
    examples: true                    # Include worked examples
    difficulty_progression: true      # Order questions easy → hard
    real_data: true                   # Use realistic datasets

  policies:
    late_penalty: "10% per day"
    collaboration: "discuss concepts, write own solutions"
    academic_integrity: "university policy"
```

### How Config Affects Output

**Without Config:**

```bash
/teaching:exam midterm
# Generic undergraduate exam, markdown format, mixed question types
```

**With Config:**

```bash
/teaching:exam midterm
# Reads .flow/teach-config.yml
# Uses Quarto format, STAT 440 branding, formal tone
# Question types limited to those in config
# Difficulty set to "intermediate"
```

### Configuration Discovery

Scholar searches for `.flow/teach-config.yml` in:

1. Current directory
2. Parent directory
3. Up to 3 levels up

**Example:**

```
~/teaching/stat-440-spring-2026/
├── .flow/
│   └── teach-config.yml          ← Found here
├── lectures/
│   └── week03/                   ← Scholar searches upward
```

---

## Scholar Teaching Commands Quick Reference

### All 9 Commands

| Command | Purpose | Typical Output | Time |
|---------|---------|----------------|------|
| `/teaching:exam` | Generate comprehensive exams | 10-20 questions + solutions | 2-5 min |
| `/teaching:quiz` | Quick quizzes for formative assessment | 5-8 questions | 1 min |
| `/teaching:assignment` | Homework with solutions and rubrics | 5-10 problems + key + rubric | 2 min |
| `/teaching:lecture` | Lecture notes with examples | 20-30 slides or 10-15 pages | 3 min |
| `/teaching:slides` | Presentation slides | 15-25 slides | 2 min |
| `/teaching:syllabus` | Complete course syllabus | 8-10 page syllabus | 3 min |
| `/teaching:rubric` | Grading rubrics | Detailed rubric | 1 min |
| `/teaching:feedback` | Student feedback on submissions | Personalized feedback | 1 min |
| `/teaching:demo` | Test all teaching commands | Demo outputs | 5 min |

### Typical Semester Workflow

```bash
# 1. Setup Phase (Pre-semester)
/teaching:syllabus
# Create .flow/teach-config.yml

# 2. Weekly Content Creation (During semester)
/teaching:lecture "topic"
/teaching:quiz "topic"
/teaching:assignment weekN

# 3. Assessment Phase (Weeks 8, 15)
/teaching:exam midterm
/teaching:exam final

# 4. Grading Phase (Ongoing)
/teaching:rubric assignmentN
/teaching:feedback student-submission.pdf
```

### Output Format Options

All teaching commands support multiple formats:

```bash
# Markdown (default) - Easy to read and edit
/teaching:exam midterm --format markdown

# Quarto - Publication-quality PDFs, HTML, slides
/teaching:exam midterm --format quarto

# LaTeX - Traditional typesetting
/teaching:exam midterm --format tex

# JSON - Programmatic access
/teaching:exam midterm --format json

# Canvas QTI - LMS integration
/teaching:exam midterm --format qti
```

---

## Need Help?

### Documentation

- [Teaching Commands Reference](../TEACHING-COMMANDS-REFERENCE.md) - Complete command details
- [Teaching Workflows](../TEACHING-WORKFLOWS.md) - Common workflow patterns
- [Teaching Index](../teaching/index.md) - Getting started guide
- [Troubleshooting](../help/TROUBLESHOOTING-teaching.md) - Common issues

### Tutorials

- [First Exam Tutorial](../tutorials/teaching/first-exam.md) - Create your first exam
- [Weekly Content Tutorial](../tutorials/teaching/weekly-content.md) - Weekly workflow
- [Semester Setup Tutorial](../tutorials/teaching/semester-setup.md) - Start a new course
- [Assignments, Solutions, Rubrics](../tutorials/teaching/assignments-solutions-rubrics.md)

### Command Help

```bash
# Get help for any teaching command
/teaching:exam --help
/teaching:quiz --help
/teaching:assignment --help
/teaching:lecture --help
```

### Related Resources

- [Quick Reference Card](../refcards/teaching-commands.md)
- [Command Examples](../COMMAND-EXAMPLES.md) - Interactive command playground
- [Lecture Pipeline Diagrams](../LECTURE-PIPELINE-DIAGRAMS.md)
- [What's New in v2.5.0](../WHATS-NEW-v2.5.0.md) - Latest features

### Support

- GitHub Issues: [Data-Wise/scholar/issues](https://github.com/Data-Wise/scholar/issues)
- Documentation: [Scholar Docs](https://Data-Wise.github.io/scholar/)
- Email: scholar-support@example.com

---

**Last Updated:** 2026-02-01
**Version:** {{ scholar.version }}
**Status:** Complete
