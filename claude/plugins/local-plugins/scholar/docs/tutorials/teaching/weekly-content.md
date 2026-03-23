# Tutorial: Weekly Content Creation

**Time:** 20 minutes
**Prerequisites:**

- Scholar plugin installed and configured
- Course setup complete (see [Semester Setup](semester-setup.md))
- `.flow/teach-config.yml` exists in your course directory
- Claude Code running with ANTHROPIC_API_KEY set

**What you'll learn:**

- Generate a week's worth of teaching materials in 20 minutes
- Create lecture slides with worked examples
- Build homework assignments with solutions
- Generate weekly quizzes with answer keys
- Create grading rubrics for assignments
- Export to multiple formats (Markdown, Quarto, LaTeX)
- Automate repetitive tasks with shell scripts

---

## Overview

This tutorial demonstrates the repeatable workflow for creating a complete week of course materials. You'll generate slides, assignment, quiz, and rubric - everything needed for a typical course week.

**What you'll build:**

```
week-03/
├── slides-hypothesis-testing.qmd      # Lecture slides (10-15 slides)
├── assignment-03.qmd                  # Homework (5-7 problems)
├── quiz-03.md                         # Weekly quiz (8 questions)
└── rubric-assignment-03.md           # Grading rubric
```

**Time breakdown:**

- Generate slides: 2 min
- Create assignment: 2 min
- Create quiz: 1 min
- Generate rubric: 1 min
- Review and customize: 10 min
- Export to formats: 2 min
- Deploy/share: 2 min

**Total time:** ~20 minutes vs 3-4 hours manually

**Time savings:** 88-92% reduction in content creation time

---

## Step 1: Generate Lecture Slides ⏱️ 2 minutes

**What to do:**

Create comprehensive lecture slides for this week's topic. Scholar generates slides with learning objectives, key concepts, worked examples, and practice problems.

**Example:**

```bash
# Navigate to your course directory
cd ~/teaching/stat-440-spring-2026

# Generate slides for Week 3: Hypothesis Testing
/teaching:slides "Hypothesis Testing for Regression" --format qmd
```

**What you'll see:**

Scholar generates `slides-hypothesis-testing-for-regression.qmd`:

```markdown
---
title: "Hypothesis Testing for Regression"
subtitle: "STAT 440 - Week 3"
author: "Dr. Sarah Johnson"
format:
  revealjs:
    theme: simple
    slide-number: true
    preview-links: auto
    incremental: false
---

## Learning Objectives

By the end of this lecture, you will be able to:

- Test hypotheses about regression coefficients
- Interpret p-values in regression context
- Construct confidence intervals for $\beta_0$ and $\beta_1$
- Understand the t-distribution in regression
- Make decisions based on hypothesis tests

---

## Review: Simple Linear Regression

Recall the model:

$$Y_i = \beta_0 + \beta_1 X_i + \epsilon_i$$

We've learned:

- How to estimate $\hat{\beta}_0$ and $\hat{\beta}_1$ using least squares
- How to interpret coefficients
- How to calculate $R^2$

**Today:** How to test if relationships are statistically significant

---

## Why Hypothesis Testing?

**Question:** Is there really a relationship between X and Y?

- Sample regression line might show a slope just by chance
- Need to quantify uncertainty
- Test if $\beta_1$ is significantly different from zero

**Example:**

- We estimate $\hat{\beta}_1 = 2.5$ (salary increases $2,500/year)
- Is this real, or could it be random variation?

---

## Hypothesis Testing Framework

### Null Hypothesis

$$H_0: \beta_1 = 0$$

**Interpretation:** No linear relationship between X and Y

### Alternative Hypothesis

$$H_a: \beta_1 \neq 0$$

**Interpretation:** There IS a linear relationship

**Two-sided test:** We test if slope is different from zero (either direction)

---

## Test Statistic

The t-statistic for testing $H_0: \beta_1 = 0$:

$$t = \frac{\hat{\beta}_1 - 0}{SE(\hat{\beta}_1)}$$

Where:

- $\hat{\beta}_1$: Estimated slope
- $SE(\hat{\beta}_1)$: Standard error of slope
- Under $H_0$, follows t-distribution with $n - 2$ degrees of freedom

**Intuition:** How many standard errors is $\hat{\beta}_1$ away from zero?

---

## Standard Error of Slope

$$SE(\hat{\beta}_1) = \frac{s}{\sqrt{\sum(X_i - \bar{X})^2}}$$

Where:

- $s = \sqrt{\frac{SSE}{n-2}}$ is the residual standard error
- $SSE = \sum(Y_i - \hat{Y}_i)^2$ is sum of squared errors

**Key insights:**

- Larger sample → smaller SE → more precise estimate
- More spread in X → smaller SE → easier to detect slope

---

## P-value Interpretation

**P-value:** Probability of observing a t-statistic this extreme (or more extreme) if $H_0$ is true

**Decision rule:**

- If p-value < $\alpha$ (typically 0.05): Reject $H_0$
- If p-value ≥ $\alpha$: Fail to reject $H_0$

**Example:**

- t = 3.45, p-value = 0.002
- Since 0.002 < 0.05, reject $H_0$
- **Conclusion:** Significant linear relationship exists

---

## Example: Salary vs. Experience

```{r}
#| echo: true

# Data
experience <- c(2, 4, 6, 8, 10, 12, 14, 16, 18, 20)
salary <- c(48, 53, 58, 64, 70, 75, 81, 86, 92, 97)  # in $1000s

# Fit model
model <- lm(salary ~ experience)

# View summary
summary(model)
```

**Output:**

```
Coefficients:
            Estimate Std. Error t value Pr(>|t|)
(Intercept)  43.1818     1.5234  28.345 3.15e-09 ***
experience    2.7273     0.1392  19.591 2.82e-08 ***

Residual standard error: 2.141 on 8 degrees of freedom
Multiple R-squared:  0.9797
```

**Interpretation:**

- $\hat{\beta}_1 = 2.727$ (salary increases $2,727/year)
- $SE(\hat{\beta}_1) = 0.139$
- t-value = 19.591
- p-value = 2.82e-08 (very small!)
- **Conclusion:** Strong evidence of relationship (p < 0.001)

---

## Confidence Intervals

**95% Confidence Interval for $\beta_1$:**

$$\hat{\beta}_1 \pm t_{0.025, n-2} \cdot SE(\hat{\beta}_1)$$

**Example:** (using previous data)

```{r}
#| echo: true

# Get confidence interval
confint(model, level = 0.95)
```

**Output:**

```
                2.5 %   97.5 %
(Intercept) 39.668258 46.69537
experience   2.406247  3.04835
```

**Interpretation:**

- We are 95% confident that the true slope is between 2.41 and 3.05
- For every year of experience, salary increases between $2,410 and $3,050
- Since interval doesn't include zero, confirms significant relationship

---

## Testing the Intercept

Can also test $H_0: \beta_0 = 0$

$$t = \frac{\hat{\beta}_0}{SE(\hat{\beta}_0)}$$

**When is this useful?**

- Sometimes theoretically meaningful (e.g., zero experience should give zero salary?)
- Often not of primary interest
- Focus is usually on slope $\beta_1$

**Example:** (from previous output)

- $\hat{\beta}_0 = 43.18$, SE = 1.52, t = 28.35, p < 0.001
- Intercept is significantly different from zero
- Interpretation: Starting salary (0 experience) is about $43,180

---

## One-sided vs Two-sided Tests

**Two-sided (default):**

- $H_0: \beta_1 = 0$ vs $H_a: \beta_1 \neq 0$
- Tests if slope is different from zero (either direction)

**One-sided:**

- $H_0: \beta_1 \leq 0$ vs $H_a: \beta_1 > 0$ (positive slope)
- OR: $H_0: \beta_1 \geq 0$ vs $H_a: \beta_1 < 0$ (negative slope)
- Use when direction is theoretically justified

**In R:**

```{r}
#| echo: true

# Two-sided p-value (default)
summary(model)$coefficients[2, 4]

# One-sided p-value (divide by 2 if correct direction)
summary(model)$coefficients[2, 4] / 2
```

---

## Common Mistakes

### Mistake 1: Confusing significance with importance

- p < 0.05 doesn't mean the effect is large or practically important
- Always consider effect size and context

### Mistake 2: Accepting the null hypothesis

- "Fail to reject $H_0$" ≠ "$H_0$ is true"
- Just means insufficient evidence against $H_0$

### Mistake 3: Multiple testing without adjustment

- Testing many hypotheses increases false positive rate
- Need adjustments (Bonferroni, FDR) when testing multiple slopes

---

## Practice Problem

**Dataset:** House prices (Y) vs. square footage (X)

| House | Sq Ft (X) | Price (Y, $1000s) |
|-------|-----------|-------------------|
| 1     | 1200      | 180               |
| 2     | 1500      | 220               |
| 3     | 1800      | 260               |
| 4     | 2100      | 300               |
| 5     | 2400      | 340               |

**Tasks:**

1. Fit a simple linear regression model
2. Test $H_0: \beta_1 = 0$ at $\alpha = 0.05$
3. Construct a 95% CI for $\beta_1$
4. Interpret your results in context

**Try this before next class!**

---

## Summary

### Key Concepts

- **Hypothesis testing:** Determine if relationships are statistically significant
- **t-statistic:** Measures how many SEs the estimate is from zero
- **p-value:** Probability of observing data this extreme under $H_0$
- **Confidence intervals:** Range of plausible values for $\beta_1$

### Next Class

- Prediction intervals
- Residual analysis
- Model assumptions

### Homework

- Assignment 3 (hypothesis testing problems)
- Reading: Chapter 3 in textbook

---

## Questions?

**Office hours:** MWF 2-3pm, Math Building 215

**Email:** sjohnson@university.edu

```

**Organize the slides:**

```bash
# Create week-03 directory if needed
mkdir -p week-03

# Move slides with descriptive name
mv slides-hypothesis-testing-for-regression.qmd week-03/slides-hypothesis-testing.qmd
```

**Preview the slides:**

```bash
# Render to HTML for preview
quarto render week-03/slides-hypothesis-testing.qmd

# Open in browser
open week-03/slides-hypothesis-testing.html
```

**✅ Checkpoint:**

- Verify `week-03/slides-hypothesis-testing.qmd` exists
- Check that slides include learning objectives, examples, and practice problems
- Confirm R code chunks are properly formatted with `{r}` and `#| echo: true`
- Review mathematical notation (LaTeX) renders correctly
- Preview HTML output to ensure slides look professional
- Count slides (should have 10-15 slides for typical 50-min lecture)

---

## Step 2: Create Homework Assignment ⏱️ 2 minutes

**What to do:**

Generate a homework assignment with problems that reinforce the concepts from this week's lecture. Scholar creates problems at appropriate difficulty with solutions.

**Example:**

```bash
/teaching:assignment "Hypothesis Testing in Regression" --format qmd --problems 6
```

**What you'll see:**

Scholar generates `assignment-hypothesis-testing-in-regression.qmd`:

```markdown
---
title: "Assignment 3: Hypothesis Testing in Regression"
subtitle: "STAT 440 - Due: End of Week 4"
author: "Your Name"
format: pdf
---

## Instructions

- Show all work for full credit
- Include R code and output for computational problems
- Round final answers to 3 decimal places
- Clearly state hypotheses, test statistics, p-values, and conclusions
- Submit PDF to Canvas by 11:59pm on due date

---

## Problem 1: Conceptual Understanding (15 points)

**a)** (5 points) Explain what it means to "reject the null hypothesis $H_0: \beta_1 = 0$" in the context of simple linear regression. What does this tell us about the relationship between X and Y?

**b)** (5 points) What is the difference between statistical significance and practical significance? Give an example where a slope coefficient is statistically significant but not practically important.

**c)** (5 points) Why do we use the t-distribution instead of the normal distribution for hypothesis tests about regression coefficients?

---

## Problem 2: Hand Calculations (20 points)

A regression of exam score (Y) on study hours (X) for n = 6 students yields:

- $\hat{\beta}_1 = 4.2$ (estimated slope)
- $SE(\hat{\beta}_1) = 0.8$ (standard error)

**a)** (5 points) Calculate the t-statistic for testing $H_0: \beta_1 = 0$ vs $H_a: \beta_1 \neq 0$.

**b)** (5 points) Using a t-table with df = 4, find the critical value for $\alpha = 0.05$ (two-sided test). Would you reject $H_0$?

**c)** (5 points) Construct a 95% confidence interval for $\beta_1$. Use $t_{0.025, 4} = 2.776$.

**d)** (5 points) Interpret the confidence interval in context. What does it tell us about the relationship between study hours and exam scores?

---

## Problem 3: R Programming (25 points)

Use R to analyze the relationship between car weight (`wt`, in 1000 lbs) and fuel efficiency (`mpg`) using the built-in `mtcars` dataset.

**a)** (5 points) Fit a simple linear regression model with `mpg` as the response and `wt` as the predictor. Display the summary output.

**b)** (8 points) Test the hypothesis $H_0: \beta_1 = 0$ vs $H_a: \beta_1 \neq 0$ at $\alpha = 0.05$. Report:
   - The test statistic
   - The p-value
   - Your decision (reject or fail to reject)
   - Your conclusion in context

**c)** (6 points) Construct a 95% confidence interval for the slope coefficient. Interpret this interval in the context of the problem.

**d)** (6 points) Based on your hypothesis test and confidence interval, do you believe there is strong evidence of a relationship between weight and fuel efficiency? Explain.

---

## Problem 4: Testing the Intercept (15 points)

Using the same `mtcars` regression from Problem 3:

**a)** (5 points) Test the hypothesis $H_0: \beta_0 = 0$ at $\alpha = 0.05$. Report the test statistic and p-value.

**b)** (5 points) What does the intercept represent in this context? Is it meaningful to test if the intercept equals zero? Why or why not?

**c)** (5 points) Construct a 95% confidence interval for the intercept. Interpret this interval.

---

## Problem 5: Real Data Application (25 points)

Download the `advertising.csv` dataset from Canvas. This dataset contains advertising spending (X, in thousands) and sales revenue (Y, in thousands) for 30 companies.

**a)** (5 points) Create a scatter plot of sales (Y) vs. advertising (X). Add the fitted regression line. Does a linear model seem appropriate?

**b)** (8 points) Fit a simple linear regression model. Test $H_0: \beta_1 = 0$ at $\alpha = 0.01$ (note: stricter significance level). Report:
   - Hypotheses
   - Test statistic
   - P-value
   - Decision
   - Conclusion in context

**c)** (6 points) Construct a 99% confidence interval for $\beta_1$. How does this interval compare to a 95% interval? (You can compute both to compare)

**d)** (6 points) Based on your analysis, would you recommend that companies increase advertising spending? Justify your answer using statistical evidence from your hypothesis test and confidence interval.

---

## Submission Guidelines

- Submit a single PDF file to Canvas
- Include all R code and output (screenshots or copy-paste)
- Clearly label each problem and sub-problem
- Show all steps for hand calculations
- Round numerical answers to 3 decimal places
- **Due:** [Insert date] at 11:59pm

**Late policy:** 10% deduction per day late, no credit after 3 days.

**Collaboration policy:** You may discuss concepts with classmates, but all submitted work must be your own. Copying code or answers is a violation of academic integrity.

---

## Grading Rubric

| Component | Points |
|-----------|--------|
| Problem 1: Conceptual | 15 |
| Problem 2: Hand Calculations | 20 |
| Problem 3: R Programming | 25 |
| Problem 4: Testing Intercept | 15 |
| Problem 5: Real Data | 25 |
| **Total** | **100** |

**Partial credit available for:**
- Correct setup even with calculation errors
- Proper R code even with interpretation errors
- Clear explanations even if final answer is wrong
```

**Organize and preview:**

```bash
# Move to week directory with sequential naming
mv assignment-hypothesis-testing-in-regression.qmd week-03/assignment-03.qmd

# Preview (optional)
quarto render week-03/assignment-03.qmd
```

**✅ Checkpoint:**

- Verify `week-03/assignment-03.qmd` exists
- Check that problems progress from simple to complex
- Confirm mix of conceptual, computational, and applied problems
- Verify point values sum to 100
- Review that problems align with slide content
- Ensure instructions are clear about submission format

---

## Step 3: Create Weekly Quiz ⏱️ 1 minute

**What to do:**

Generate a short quiz to assess basic understanding of this week's concepts. Quizzes are typically 8-10 questions, taking 15-20 minutes for students to complete.

**Example:**

```bash
/teaching:quiz "Hypothesis Testing in Regression" 8 --format md
```

**What you'll see:**

Scholar generates `quiz-hypothesis-testing-in-regression.md`:

```markdown
# Quiz 3: Hypothesis Testing in Regression

**Time:** 15 minutes
**Points:** 20 points
**Instructions:** Answer all questions. Show work where applicable.

---

## Question 1 (2 points)

In hypothesis testing for regression, the null hypothesis $H_0: \beta_1 = 0$ means:

A) The intercept is zero
B) There is no linear relationship between X and Y
C) The slope is positive
D) The correlation is perfect

**Answer:** B

---

## Question 2 (2 points)

The t-statistic for testing $H_0: \beta_1 = 0$ is calculated as:

A) $\hat{\beta}_1 / SE(\hat{\beta}_0)$
B) $\hat{\beta}_0 / SE(\hat{\beta}_1)$
C) $\hat{\beta}_1 / SE(\hat{\beta}_1)$
D) $SE(\hat{\beta}_1) / \hat{\beta}_1$

**Answer:** C

---

## Question 3 (3 points)

A regression yields $\hat{\beta}_1 = 3.5$ with $SE(\hat{\beta}_1) = 0.7$. The t-statistic is:

A) 2.8
B) 4.2
C) 5.0
D) 0.2

**Answer:** C (3.5 / 0.7 = 5.0)

---

## Question 4 (3 points)

If the p-value for testing $H_0: \beta_1 = 0$ is 0.003, and we use $\alpha = 0.05$, we should:

A) Fail to reject $H_0$
B) Reject $H_0$
C) Accept $H_0$
D) Increase the sample size

**Answer:** B (p-value < $\alpha$, so reject $H_0$)

---

## Question 5 (3 points)

A 95% confidence interval for $\beta_1$ is (2.1, 5.9). This means:

A) We are 95% confident the true slope is between 2.1 and 5.9
B) 95% of the data points fall in this range
C) The slope equals 4.0 with 95% certainty
D) The p-value is 0.05

**Answer:** A

---

## Question 6 (3 points)

If a 95% confidence interval for $\beta_1$ is (-1.2, 3.8), what can we conclude about testing $H_0: \beta_1 = 0$ at $\alpha = 0.05$?

A) Reject $H_0$ because the interval contains zero
B) Fail to reject $H_0$ because the interval contains zero
C) Reject $H_0$ because the interval doesn't contain zero
D) Not enough information to decide

**Answer:** B (interval contains zero → fail to reject $H_0$)

---

## Question 7 (2 points)

The degrees of freedom for the t-test in simple linear regression with n = 25 observations is:

A) 25
B) 24
C) 23
D) 22

**Answer:** C (df = n - 2 = 25 - 2 = 23)

---

## Question 8 (2 points)

A p-value of 0.12 for testing $H_0: \beta_1 = 0$ at $\alpha = 0.05$ indicates:

A) Strong evidence against $H_0$
B) Strong evidence for $H_0$
C) Insufficient evidence to reject $H_0$
D) The slope is definitely zero

**Answer:** C (p > $\alpha$, so fail to reject)

---

## Answer Key

1. B (2 pts) - No linear relationship
2. C (2 pts) - Formula for t-statistic
3. C (3 pts) - Calculation: 3.5/0.7 = 5.0
4. B (3 pts) - Reject since p < alpha
5. A (3 pts) - Interpretation of CI
6. B (3 pts) - CI contains zero → fail to reject
7. C (2 pts) - df = n - 2
8. C (2 pts) - Insufficient evidence

**Total:** 20 points

**Grading:**
- 18-20 points: Excellent understanding
- 15-17 points: Good understanding
- 12-14 points: Adequate understanding
- Below 12 points: Review concepts, attend office hours
```

**Organize:**

```bash
mv quiz-hypothesis-testing-in-regression.md week-03/quiz-03.md
```

**✅ Checkpoint:**

- Verify `week-03/quiz-03.md` exists
- Check that quiz has 8 questions as requested
- Confirm mix of conceptual and computational questions
- Verify point values sum to 20 points
- Check that answer key is included at the end
- Ensure quiz aligns with slide content (tests what was taught)

---

## Step 4: Generate Grading Rubric ⏱️ 1 minute

**What to do:**

Create a detailed grading rubric for the assignment. This provides clear criteria for grading subjective problems and helps ensure consistent grading across students.

**Example:**

```bash
/teaching:rubric "Assignment 3: Hypothesis Testing" --criteria 5
```

**What you'll see:**

Scholar generates `rubric-assignment-3-hypothesis-testing.md`:

```markdown
# Grading Rubric - Assignment 3: Hypothesis Testing

---

## Overview

**Total Points:** 100
**Assignment:** Hypothesis Testing in Regression
**Course:** STAT 440 - Regression Analysis

---

## Problem-by-Problem Rubric

### Problem 1: Conceptual Understanding (15 points)

#### Part (a): Interpreting Rejection of $H_0: \beta_1 = 0$ (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Complete, accurate explanation with mention of statistical significance AND practical interpretation |
| **4** | Accurate explanation but missing one key element (either statistical or practical) |
| **3** | Partially correct but vague or incomplete explanation |
| **2** | Major conceptual errors but shows some understanding |
| **1** | Minimal understanding shown |
| **0** | No attempt or completely incorrect |

**Key points to award credit:**
- Rejection means evidence that $\beta_1 \neq 0$ (2 pts)
- Indicates significant linear relationship between X and Y (2 pts)
- Clear, well-articulated explanation (1 pt)

#### Part (b): Statistical vs. Practical Significance (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Clear distinction with relevant, well-explained example |
| **4** | Clear distinction but example is weak or generic |
| **3** | Understands concept but explanation lacks clarity |
| **2** | Partial understanding with significant gaps |
| **1** | Major conceptual errors |
| **0** | No attempt or completely incorrect |

**Key points:**
- Statistical significance: p < alpha, rejects null (1.5 pts)
- Practical significance: effect size matters in context (1.5 pts)
- Good example showing disconnect (2 pts)

#### Part (c): Why t-distribution? (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Complete explanation mentioning unknown variance and finite sample |
| **4** | Correct but missing one key element |
| **3** | Partial understanding |
| **2** | Major errors but some correct ideas |
| **1** | Minimal understanding |
| **0** | No attempt |

**Key points:**
- Unknown population variance (2 pts)
- Finite sample size (2 pts)
- Clear explanation (1 pt)

---

### Problem 2: Hand Calculations (20 points)

#### Part (a): Calculate t-statistic (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Correct formula, correct calculation, correct answer (t = 5.25) |
| **4** | Correct formula and process but minor arithmetic error |
| **3** | Correct formula but significant calculation error |
| **2** | Incorrect formula but some understanding of t-test |
| **1** | Minimal understanding |
| **0** | No attempt |

**Correct calculation:** $t = 4.2 / 0.8 = 5.25$

#### Part (b): Critical value and decision (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Correct critical value ($t_{0.025,4} = 2.776$) AND correct decision (reject $H_0$) |
| **4** | Correct critical value but minor error in decision |
| **3** | Wrong critical value but correct decision logic |
| **2** | Major errors in both critical value and decision |
| **1** | Minimal understanding |
| **0** | No attempt |

**Deductions:**
- Wrong df: -1 pt
- Wrong tail (one-sided vs two-sided): -1 pt

#### Part (c): 95% Confidence interval (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Correct formula, correct calculation, correct interval: (2.0, 6.4) |
| **4** | Correct formula but minor arithmetic error |
| **3** | Correct approach but significant error |
| **2** | Wrong formula but some understanding |
| **1** | Minimal understanding |
| **0** | No attempt |

**Correct calculation:** $4.2 \pm 2.776(0.8) = (2.0, 6.4)$

#### Part (d): Interpret CI (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Complete, contextual interpretation with mention of confidence level |
| **4** | Correct interpretation but not fully contextualized |
| **3** | Partially correct but vague |
| **2** | Major errors but shows some understanding |
| **1** | Minimal understanding |
| **0** | No attempt |

**Key elements:**
- 95% confidence language (2 pts)
- Contextualized to study hours and exam scores (2 pts)
- Correct directional interpretation (1 pt)

---

### Problem 3: R Programming (25 points)

#### Part (a): Fit model and display summary (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Correct R code (`lm()`, `summary()`) with output shown |
| **4** | Correct code but output not shown or formatted poorly |
| **3** | Code has minor errors but general approach is correct |
| **2** | Major code errors |
| **1** | Minimal attempt |
| **0** | No attempt |

**Required code:** `model <- lm(mpg ~ wt, data = mtcars)`

#### Part (b): Hypothesis test (8 points)

| Score | Criteria |
|-------|----------|
| **8** | All four components correct: statistic, p-value, decision, conclusion |
| **6-7** | 3 out of 4 components correct |
| **4-5** | 2 out of 4 components correct |
| **2-3** | 1 out of 4 components correct |
| **1** | Minimal attempt |
| **0** | No attempt |

**Breakdown:**
- Test statistic: 2 pts
- P-value: 2 pts
- Decision (reject/fail to reject): 2 pts
- Conclusion in context: 2 pts

#### Part (c): 95% CI and interpretation (6 points)

| Score | Criteria |
|-------|----------|
| **6** | Correct R code (`confint()`), correct interval, good interpretation |
| **5** | Correct interval but weak interpretation |
| **4** | Minor error in interval or interpretation |
| **3** | Major error but some understanding |
| **1-2** | Minimal understanding |
| **0** | No attempt |

**Required code:** `confint(model, level = 0.95)`

#### Part (d): Evidence evaluation (6 points)

| Score | Criteria |
|-------|----------|
| **6** | Thoughtful analysis using BOTH hypothesis test AND CI with clear reasoning |
| **5** | Good analysis but relies only on one piece of evidence |
| **4** | Adequate analysis but lacks depth |
| **3** | Weak analysis with some correct ideas |
| **1-2** | Minimal understanding |
| **0** | No attempt |

---

### Problem 4: Testing the Intercept (15 points)

#### Part (a): Test $H_0: \beta_0 = 0$ (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Correct test statistic and p-value from R output |
| **4** | Minor error in reporting |
| **3** | Correct approach but significant error |
| **1-2** | Major errors |
| **0** | No attempt |

#### Part (b): Meaningfulness of test (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Excellent discussion of context and whether test is meaningful |
| **4** | Good discussion but missing some nuance |
| **3** | Adequate but superficial |
| **1-2** | Weak understanding |
| **0** | No attempt |

**Key insight:** Intercept represents mpg at weight = 0, which is not physically meaningful for cars.

#### Part (c): 95% CI for intercept (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Correct interval and interpretation |
| **4** | Minor error |
| **3** | Major error but some understanding |
| **1-2** | Minimal understanding |
| **0** | No attempt |

---

### Problem 5: Real Data Application (25 points)

#### Part (a): Scatter plot (5 points)

| Score | Criteria |
|-------|----------|
| **5** | Professional plot with regression line, proper labels, and assessment of linearity |
| **4** | Good plot but missing one element (labels, line, or assessment) |
| **3** | Adequate plot but multiple missing elements |
| **1-2** | Poor quality or incomplete |
| **0** | No attempt |

**Required elements:**
- Scatter plot: 2 pts
- Regression line: 1 pt
- Axis labels: 1 pt
- Assessment of linearity: 1 pt

#### Part (b): Hypothesis test at $\alpha = 0.01$ (8 points)

| Score | Criteria |
|-------|----------|
| **8** | All components correct: hypotheses stated, statistic, p-value, decision, conclusion |
| **6-7** | 4 out of 5 components correct |
| **4-5** | 3 out of 5 components correct |
| **2-3** | 1-2 components correct |
| **1** | Minimal attempt |
| **0** | No attempt |

**Breakdown:**
- Hypotheses: 2 pts
- Test statistic: 2 pts
- P-value: 1 pt
- Decision: 2 pts
- Conclusion: 1 pt

#### Part (c): 99% vs 95% CI comparison (6 points)

| Score | Criteria |
|-------|----------|
| **6** | Correct 99% CI, correct comparison, insightful discussion |
| **5** | Correct CIs but weak comparison |
| **4** | Minor errors but general understanding |
| **2-3** | Major errors |
| **1** | Minimal attempt |
| **0** | No attempt |

**Key insight:** 99% CI is wider than 95% CI (more confidence = wider interval)

#### Part (d): Recommendation with justification (6 points)

| Score | Criteria |
|-------|----------|
| **6** | Well-reasoned recommendation using statistical evidence from test AND CI |
| **5** | Good recommendation but relies on only one piece of evidence |
| **4** | Adequate but lacks depth |
| **2-3** | Weak reasoning |
| **1** | Minimal attempt |
| **0** | No attempt |

---

## Overall Grading Notes

### Deductions

- **Missing work:** No partial credit (-all points)
- **No R code shown:** -50% of problem points
- **Not rounded to 3 decimals:** -1 pt per problem
- **No units or context:** -1 pt per interpretation
- **Disorganized submission:** -5 pts overall

### Bonus Credit Opportunities (Optional)

- Exceptional visualization: +2 pts
- Going beyond requirements with additional analysis: +3 pts
- Maximum bonus: +5 pts (total cannot exceed 100)

---

## Grade Scale

| Score | Grade | Performance |
|-------|-------|-------------|
| 90-100 | A | Excellent |
| 80-89 | B | Good |
| 70-79 | C | Satisfactory |
| 60-69 | D | Needs improvement |
| Below 60 | F | Unsatisfactory |

---

## Notes for Graders

- **Consistency:** Use this rubric for all students
- **Partial credit:** Award partial credit for correct approach even with errors
- **Feedback:** Write brief comments explaining deductions
- **Common errors:** Track common mistakes to address in class
- **Grade appeals:** Refer to this rubric when discussing grades with students
```

**Organize:**

```bash
mv rubric-assignment-3-hypothesis-testing.md week-03/rubric-assignment-03.md
```

**✅ Checkpoint:**

- Verify `week-03/rubric-assignment-03.md` exists
- Check that rubric covers all assignment problems
- Confirm point values match assignment (should total 100)
- Verify rubric provides clear criteria for each problem
- Check that partial credit guidelines are included
- Ensure rubric is detailed enough for consistent grading across students

---

## Step 5: Review and Customize ⏱️ 10 minutes

**What to do:**

Review all generated materials and customize them to match your teaching style, course pace, and institutional requirements.

### Review Checklist

**Slides review (3 min):**

```bash
# Open slides for review
open week-03/slides-hypothesis-testing.qmd
```

**Check for:**

- [ ] Learning objectives match course level
- [ ] Mathematical notation is consistent with your style
- [ ] R code examples are appropriate for students' skill level
- [ ] Number of slides fits your class time (10-15 slides for 50 min)
- [ ] Examples are relevant to your students' interests
- [ ] Practice problems are at right difficulty

**Common customizations:**

```r
# Adjust R code complexity
# BEFORE (generated):
ggplot(data.frame(x, y), aes(x = x, y = y)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE)

# AFTER (simplified for beginners):
plot(x, y)
abline(lm(y ~ x))
```

**Assignment review (3 min):**

```bash
# Open assignment for review
open week-03/assignment-03.qmd
```

**Check for:**

- [ ] Problem difficulty progresses appropriately
- [ ] Point values reflect problem difficulty
- [ ] Dataset references are correct (update Canvas links)
- [ ] Due date is filled in
- [ ] Instructions match your submission requirements
- [ ] Collaboration policy matches department policy

**Common customizations:**

```yaml
# Update due date
**Due:** [Insert date] at 11:59pm
# CHANGE TO:
**Due:** Monday, February 10, 2026 at 11:59pm

# Update dataset location
Download the `advertising.csv` dataset from Canvas
# CHANGE TO:
Download the `advertising.csv` dataset from Canvas > Files > Week 3
```

**Quiz review (2 min):**

```bash
# Open quiz
open week-03/quiz-03.md
```

**Check for:**

- [ ] Questions test key concepts from slides
- [ ] Difficulty is appropriate for quick assessment
- [ ] Answer key is correct
- [ ] Time estimate is realistic (typically 1-2 min per question)

**Rubric review (2 min):**

```bash
# Open rubric
open week-03/rubric-assignment-03.md
```

**Check for:**

- [ ] Rubric aligns with assignment problems
- [ ] Point breakdown matches assignment
- [ ] Grading criteria are clear and measurable
- [ ] Partial credit guidelines are reasonable

### Quick Customization Examples

**Change difficulty level:**

If content seems too advanced for your class, adjust in `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    difficulty: "beginner"  # Change from "intermediate"
```

Then regenerate:

```bash
/teaching:slides "Hypothesis Testing" --format qmd --difficulty easy
```

**Adjust mathematical rigor:**

For less mathematically intensive courses:

```yaml
style:
  notation: "intuitive"      # Instead of "statistical"
  include_proofs: false      # Skip formal proofs
  include_derivations: false # Skip derivations
  examples: true             # Keep examples
```

**Change tone:**

For more approachable content:

```yaml
style:
  tone: "conversational"  # Instead of "formal"
```

**✅ Checkpoint:**

- All four files have been reviewed
- Customizations have been made to match your teaching style
- Dates, links, and references have been updated
- Content difficulty matches your students' level
- Materials are ready to deploy

---

## Step 6: Validate R Code ⏱️ 2 minutes

**What to do:**

Before distributing materials, validate that all R code chunks in your `.qmd` files actually run without errors. This catches broken code, wrong column names, and missing packages.

**Example:**

```bash
# Validate all .qmd files in the week directory
/teaching:validate-r --all week-03/
```

**What you'll see:**

```
week-03/slides-hypothesis-testing.qmd
  chunk "setup" ............... PASS
  chunk "salary-model" ........ PASS
  chunk "confint" ............. PASS
  Result: 3 passed, 0 failed, 0 skipped

week-03/assignment-03.qmd
  chunk "mtcars-model" ........ PASS
  chunk "confint-example" ..... PASS
  Result: 2 passed, 0 failed, 0 skipped

Summary: 2 files, 5 passed, 0 failed, 0 skipped
```

**If chunks fail:**

```bash
# Auto-fix failing chunks
/teaching:validate-r --fix week-03/slides-hypothesis-testing.qmd

# Or preview what would be validated without running
/teaching:validate-r --dry-run week-03/slides-hypothesis-testing.qmd
```

See the [R Code Validation tutorial](r-code-validation.md) for details on troubleshooting and CI integration.

**Checkpoint:**

- All R code chunks pass validation
- No `eval: false` placeholders in material intended for students
- Data loading paths are correct

---

## Step 7: Export to Formats and Deploy ⏱️ 4 minutes

**What to do:**

Export materials to the formats you need for distribution (PDF for students, HTML for web, LaTeX for printing).

### 6a. Render slides to HTML (1 min)

**Example:**

```bash
# Render slides to HTML (Revealjs presentation)
quarto render week-03/slides-hypothesis-testing.qmd

# Output: slides-hypothesis-testing.html
```

**What you'll see:**

```
pandoc
  to: revealjs
  output-file: slides-hypothesis-testing.html

Output created: slides-hypothesis-testing.html
```

**Deploy slides:**

```bash
# Option 1: Upload to Canvas
# Manually upload the .html file to Canvas > Files > Week 3

# Option 2: Deploy to course website
cp week-03/slides-hypothesis-testing.html ~/course-website/slides/

# Option 3: Share via GitHub Pages
git add week-03/
git commit -m "Add week 3 slides"
git push origin main
```

### 6b. Export assignment to PDF (1 min)

**Example:**

```bash
# Render assignment to PDF
quarto render week-03/assignment-03.qmd --to pdf

# Output: assignment-03.pdf
```

**What you'll see:**

```
pandoc
  to: latex
  output-file: assignment-03.pdf

Output created: assignment-03.pdf
```

**Deploy assignment:**

```bash
# Upload to Canvas as Assignment
# Canvas > Assignments > Create Assignment > Upload assignment-03.pdf
```

### 6c. Export quiz to Canvas-compatible format (1 min)

**Optional: Export to Canvas QTI format**

```bash
# Use the canvas command (requires examark)
/teaching:canvas week-03/quiz-03.qmd

# Output: quiz-03.qti.zip (importable to Canvas)
```

**Upload to Canvas:**

```bash
# Canvas > Quizzes > Import Quiz > Upload quiz-03.qti.zip
```

**Alternative: Manual entry**

If you don't have `examark` installed, manually create quiz in Canvas using the generated questions as a guide.

### 6d. Share rubric with graders (1 min)

**Example:**

```bash
# Convert rubric to PDF for TAs
pandoc week-03/rubric-assignment-03.md -o week-03/rubric-assignment-03.pdf

# Share with TAs via email or Canvas
```

**Or keep as Markdown:**

```bash
# Share Markdown file directly with TAs
# TAs can view in any text editor
```

**✅ Checkpoint:**

- Slides rendered to HTML successfully
- Assignment exported to PDF
- Quiz ready for Canvas upload
- Rubric shared with graders
- All materials deployed to appropriate platforms

---

## Step 8: Automation Tips ⏱️ Optional

**What to do:**

Save time in future weeks by automating repetitive tasks with shell scripts.

### Create weekly generation script

**Save as:** `scripts/generate-week.sh`

```bash
#!/bin/bash
# Usage: ./scripts/generate-week.sh 4 "ANOVA"

set -e  # Exit on error

WEEK=$1
TOPIC=$2

if [ -z "$WEEK" ] || [ -z "$TOPIC" ]; then
    echo "Usage: $0 WEEK_NUMBER TOPIC"
    echo "Example: $0 4 \"ANOVA\""
    exit 1
fi

WEEK_DIR="week-$(printf "%02d" $WEEK)"
mkdir -p "$WEEK_DIR"

echo "Generating Week $WEEK materials: $TOPIC"
echo "============================================"

# Generate slides
echo "[1/4] Generating slides..."
/teaching:slides "$TOPIC" --format qmd
mv slides-*.qmd "$WEEK_DIR/slides-${TOPIC,,}.qmd" 2>/dev/null || true

# Generate assignment
echo "[2/4] Generating assignment..."
/teaching:assignment "$TOPIC Problems" --format qmd --problems 6
mv assignment-*.qmd "$WEEK_DIR/assignment-$(printf "%02d" $WEEK).qmd" 2>/dev/null || true

# Generate quiz
echo "[3/4] Generating quiz..."
/teaching:quiz "$TOPIC Concepts" 8 --format md
mv quiz-*.md "$WEEK_DIR/quiz-$(printf "%02d" $WEEK).md" 2>/dev/null || true

# Generate rubric
echo "[4/4] Generating rubric..."
/teaching:rubric "Assignment $WEEK: $TOPIC" --criteria 5
mv rubric-*.md "$WEEK_DIR/rubric-assignment-$(printf "%02d" $WEEK).md" 2>/dev/null || true

# Commit to git
git add "$WEEK_DIR/"
git commit -m "feat: add Week $WEEK materials ($TOPIC)"

echo ""
echo "✅ Week $WEEK materials generated successfully!"
echo "📂 Location: $WEEK_DIR/"
echo ""
echo "Next steps:"
echo "  1. Review materials: cd $WEEK_DIR && ls -la"
echo "  2. Customize content as needed"
echo "  3. Render to formats: quarto render"
echo "  4. Deploy to Canvas"
```

**Make executable:**

```bash
chmod +x scripts/generate-week.sh
```

**Usage:**

```bash
# Generate Week 4 materials
./scripts/generate-week.sh 4 "ANOVA"

# Generate Week 5 materials
./scripts/generate-week.sh 5 "Multiple Comparisons"
```

### Batch rendering script

**Save as:** `scripts/render-all.sh`

```bash
#!/bin/bash
# Render all materials for a specific week

WEEK_DIR=$1

if [ -z "$WEEK_DIR" ]; then
    echo "Usage: $0 WEEK_DIR"
    echo "Example: $0 week-03"
    exit 1
fi

echo "Rendering all materials in $WEEK_DIR..."

# Render slides to HTML
quarto render "$WEEK_DIR"/slides-*.qmd

# Render assignment to PDF
quarto render "$WEEK_DIR"/assignment-*.qmd --to pdf

# Convert rubric to PDF
pandoc "$WEEK_DIR"/rubric-*.md -o "$WEEK_DIR"/rubric.pdf

echo "✅ All materials rendered!"
ls -lh "$WEEK_DIR"/*.{html,pdf}
```

**Usage:**

```bash
./scripts/render-all.sh week-03
```

### Deploy script (Canvas)

**Save as:** `scripts/deploy-week.sh`

```bash
#!/bin/bash
# Deploy week's materials to appropriate locations

WEEK_DIR=$1

echo "Deploying materials from $WEEK_DIR..."

# Copy slides to website
cp "$WEEK_DIR"/slides-*.html ~/course-website/slides/

# Stage assignment and rubric for Canvas upload
cp "$WEEK_DIR"/assignment-*.pdf ~/canvas-uploads/
cp "$WEEK_DIR"/rubric-*.pdf ~/canvas-uploads/

echo "✅ Materials staged for deployment!"
echo ""
echo "Next steps:"
echo "  1. Upload slides: ~/course-website/slides/"
echo "  2. Upload assignment to Canvas from: ~/canvas-uploads/"
echo "  3. Create quiz in Canvas using quiz-*.md as reference"
```

**✅ Checkpoint:**

- Generation script created and tested
- Rendering script created and tested
- Deploy script created and tested
- Scripts saved in `scripts/` directory
- Scripts committed to git for reuse

---

## Time-Saving Shortcuts

### Use bash aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Scholar teaching shortcuts
alias tw='cd ~/teaching/stat-440-spring-2026'  # Jump to course directory
alias tgen='~/teaching/stat-440-spring-2026/scripts/generate-week.sh'
alias trender='~/teaching/stat-440-spring-2026/scripts/render-all.sh'
alias tdeploy='~/teaching/stat-440-spring-2026/scripts/deploy-week.sh'
```

**Usage:**

```bash
tw              # Jump to course directory
tgen 4 "ANOVA"  # Generate week 4
trender week-04 # Render all materials
tdeploy week-04 # Deploy to Canvas/website
```

### Keyboard shortcuts in Claude Code

```bash
# Quick command recall
/teaching:exam↑  # Recall last exam command
/teaching:quiz↑  # Recall last quiz command
```

### Integration with flow-cli

If you're using flow-cli:

```bash
# Set up teaching workflow
work stat-440

# Generate content
tgen 4 "ANOVA"

# Finish week
finish "Added week 4 materials"
```

---

## Common Issues

### Issue 1: "Quarto render fails with R code error"

**Symptoms:**

- Quarto render stops with R code execution error
- Error: "object not found" or "package not loaded"

**Solution:**

1. Check R code chunks for missing packages:

   ```yaml
   # Add to top of .qmd file
   ```{r setup, include=FALSE}
   library(ggplot2)
   library(dplyr)
   ```

   ```

2. Set eval=FALSE for code that shouldn't run:

   ```yaml
   ```{r, eval=FALSE}
   # Example code (won't execute)
   ```

   ```

3. Use cache for slow computations:

   ```yaml
   ```{r, cache=TRUE}
   # Expensive computation
   ```

   ```

### Issue 2: "Generated content is repetitive across weeks"

**Symptoms:**

- Week 3 and Week 4 materials look too similar
- Examples use same datasets repeatedly

**Solution:**

1. Provide more specific prompts:

   ```bash
   # Instead of:
   /teaching:slides "ANOVA"

   # Use:
   /teaching:slides "One-way ANOVA with agricultural examples"
   ```

2. Specify different contexts in config:

   ```yaml
   examples:
     contexts:
       - "medical research"
       - "business analytics"
       - "agricultural studies"
   ```

3. Manually vary examples during review (Step 5)

### Issue 3: "Materials don't align across the week"

**Symptoms:**

- Quiz tests concepts not covered in slides
- Assignment problems don't match lecture examples

**Solution:**

1. Generate all materials in one session (maintains consistency):

   ```bash
   ./scripts/generate-week.sh 3 "Hypothesis Testing"
   ```

2. Use the same topic string for all commands:

   ```bash
   TOPIC="Hypothesis Testing"
   /teaching:slides "$TOPIC" --format qmd
   /teaching:assignment "$TOPIC Problems"
   /teaching:quiz "$TOPIC Concepts" 8
   ```

3. Review alignment during Step 5 (Review)

### Issue 4: "PDF export has LaTeX errors"

**Symptoms:**

- Quarto render to PDF fails
- Error: "! Undefined control sequence"
- Missing math symbols in output

**Solution:**

1. Install full LaTeX distribution:

   ```bash
   # macOS
   brew install --cask mactex

   # Linux
   sudo apt-get install texlive-full
   ```

2. Use tinytex (minimal LaTeX):

   ```bash
   quarto install tinytex
   ```

3. Check math notation syntax:

   ```latex
   # Wrong:
   $\beta_1$

   # Correct:
   $$\beta_1$$  # Display math
   $\beta_1$    # Inline math (should work)
   ```

4. Escape special characters:

   ```latex
   # Wrong:
   $100 & $200

   # Correct:
   \$100 \& \$200
   ```

---

## Next Steps

### Master the Weekly Workflow

**Practice this workflow for 2-3 weeks** to build muscle memory:

1. Generate materials (15 min)
2. Review and customize (10 min)
3. Render and deploy (5 min)
4. Teach class
5. Gather feedback
6. Refine for next week

**After 3 weeks, you'll have:**

- A template for your weekly workflow
- Custom scripts tailored to your needs
- Confidence in Scholar's capabilities
- 50-70% time savings vs manual creation

### Advanced Techniques

**Batch generation for entire semester:**

```bash
# Generate all 15 weeks at once
for week in {1..15}; do
    topic=$(sed -n "${week}p" semester-topics.txt)
    ./scripts/generate-week.sh $week "$topic"
    sleep 60  # Pause between API calls
done
```

**Create variations for different sections:**

```bash
# Generate 3 variations of the same exam
/teaching:exam midterm --variations 3

# Result: exam-midterm-v1.qmd, exam-midterm-v2.qmd, exam-midterm-v3.qmd
```

**Integrate with Canvas API:**

```bash
# Upload assignment directly to Canvas
# (requires canvas-api-cli)
canvas upload-assignment week-03/assignment-03.pdf \
    --course-id 12345 \
    --name "Assignment 3: Hypothesis Testing" \
    --due-date "2026-02-10T23:59:00"
```

### Related Tutorials

1. **[Your First Exam](first-exam.md)** - Deep dive into exam creation with Scholar

2. **[Semester Setup](semester-setup.md)** - Complete course setup from scratch

3. **[Semester Setup](semester-setup.md)** - Plan a full semester of content

### Quality Improvement Tips

**Gather student feedback:**

```bash
# After each week, ask students:
# - Were the slides clear?
# - Was the assignment at the right difficulty?
# - Did the quiz test important concepts?
```

**Track what works:**

Keep a log of customizations:

```markdown
# teaching-log.md

## Week 3: Hypothesis Testing

**Generated:** 2026-02-03
**Customizations:**
- Simplified R code examples (removed ggplot2, used base R)
- Added extra practice problem on CI interpretation
- Reduced quiz from 8 to 6 questions (too long)

**Student feedback:**
- "Quiz was perfect length this week!"
- "Assignment Problem 3 was confusing - needs clearer instructions"

**Next time:**
- Keep 6-question quizzes
- Add more explicit instructions to applied problems
```

**Iterate and improve:**

```bash
# Next semester, regenerate with lessons learned
/teaching:slides "Hypothesis Testing" --format qmd --difficulty beginner
# Then apply your proven customizations from teaching-log.md
```

---

## Additional Resources

### Documentation

- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md)** - Complete API for all teaching commands
- **[Configuration Guide](../../CONFIGURATION.md)** - All config options explained
- **[Output Formats Guide](../../OUTPUT-FORMATS-GUIDE.md)** - Master Markdown, Quarto, LaTeX, JSON

### Tutorials

- **[Your First Exam](first-exam.md)** - Comprehensive exam creation tutorial
- **[Semester Setup](semester-setup.md)** - Initial course setup guide
- **[Teaching Workflows](../../TEACHING-WORKFLOWS.md)** - Common workflow patterns

### Quick References

- **[Teaching Commands Refcard](../../refcards/teaching-commands.md)** - One-page command reference
- **[Teaching Workflows Refcard](../../refcards/teaching-workflows.md)** - Common workflow patterns

### Examples

- **[Teaching Examples](../../examples/teaching.md)** - Real-world course examples
- **[Command Examples](../../COMMAND-EXAMPLES.md)** - All commands demonstrated

### Help

- **[FAQ](../../help/FAQ-teaching.md)** - Frequently asked questions
- **[Common Issues](../../help/COMMON-ISSUES.md)** - Troubleshooting guide

---

**🎓 Congratulations!** You've mastered the weekly content creation workflow. You can now generate a week's worth of materials in 20 minutes instead of 3-4 hours!

**Next:** Apply this workflow to create content for your entire semester, saving 50-70% of your course prep time.
