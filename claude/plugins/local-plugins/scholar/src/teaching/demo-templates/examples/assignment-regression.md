# Homework 6: Simple Linear Regression

**Course:** STAT-101 - Introduction to Statistical Methods
**Topic:** Simple Linear Regression
**Due Date:** Week 14
**Total Points:** 50

---

## Instructions

- Show all work for full credit
- Round final answers to 3 decimal places
- You may use R/RStudio for calculations
- Interpret results in context

---

## Problem 1 (8 points) - Conceptual

**a) (4 points)** In the simple linear regression model $Y = \beta_0 + \beta_1 X + \epsilon$, explain what each component represents:
- $\beta_0$
- $\beta_1$
- $\epsilon$

**Solution:**
- $\beta_0$ (intercept): The expected value of Y when X = 0
- $\beta_1$ (slope): The expected change in Y for a one-unit increase in X
- $\epsilon$ (error term): Random variation not explained by the linear relationship

**b) (4 points)** What are the four key assumptions of simple linear regression? Briefly describe each.

**Solution:**
1. **Linearity:** The relationship between X and Y is linear
2. **Independence:** Errors are independent of each other
3. **Homoscedasticity:** Constant variance of errors across all X values
4. **Normality:** Errors are normally distributed

---

## Problem 2 (12 points) - Calculation

A study examined the relationship between study hours (X) and exam scores (Y) for 8 students:

| Student | Hours (X) | Score (Y) |
|---------|-----------|-----------|
| 1 | 2 | 65 |
| 2 | 3 | 70 |
| 3 | 4 | 72 |
| 4 | 5 | 78 |
| 5 | 5 | 75 |
| 6 | 6 | 82 |
| 7 | 7 | 85 |
| 8 | 8 | 90 |

**a) (4 points)** Calculate $\bar{X}$, $\bar{Y}$, and the sample correlation coefficient $r$.

**Solution:**
- $\bar{X} = \frac{2+3+4+5+5+6+7+8}{8} = 5$
- $\bar{Y} = \frac{65+70+72+78+75+82+85+90}{8} = 77.125$
- $r = 0.977$ (strong positive correlation)

**b) (4 points)** Find the least squares regression line $\hat{Y} = b_0 + b_1 X$.

**Solution:**
- $b_1 = \frac{\sum(X_i - \bar{X})(Y_i - \bar{Y})}{\sum(X_i - \bar{X})^2} = \frac{128.5}{34} = 3.779$
- $b_0 = \bar{Y} - b_1\bar{X} = 77.125 - 3.779(5) = 58.230$
- **Regression line:** $\hat{Y} = 58.230 + 3.779X$

**c) (4 points)** Interpret the slope and intercept in the context of this study.

**Solution:**
- **Slope (3.779):** For each additional hour of study, the expected exam score increases by approximately 3.78 points.
- **Intercept (58.230):** A student who studies 0 hours would be expected to score about 58.2 points. (Note: This extrapolation may not be meaningful since 0 hours is outside the observed data range.)

---

## Problem 3 (10 points) - Prediction and Residuals

Using the regression equation from Problem 2:

**a) (3 points)** Predict the exam score for a student who studies 6 hours.

**Solution:**
$\hat{Y} = 58.230 + 3.779(6) = 58.230 + 22.674 = 80.904$

A student who studies 6 hours is predicted to score approximately 80.9 points.

**b) (3 points)** Calculate the residual for Student 6 (who studied 6 hours and scored 82).

**Solution:**
- Observed: $Y_6 = 82$
- Predicted: $\hat{Y}_6 = 80.904$
- Residual: $e_6 = Y_6 - \hat{Y}_6 = 82 - 80.904 = 1.096$

The positive residual indicates this student scored about 1.1 points higher than predicted.

**c) (4 points)** Would it be appropriate to use this model to predict the score for a student who studies 15 hours? Explain.

**Solution:**
No, this would be extrapolation beyond the range of observed data (2-8 hours). The linear relationship may not hold at 15 hours - there could be diminishing returns, or the model might predict unrealistic scores above 100. Predictions should be limited to the range of X values in the data.

---

## Problem 4 (10 points) - Model Assessment

**a) (5 points)** Calculate and interpret $R^2$ for the regression in Problem 2.

**Solution:**
$R^2 = r^2 = (0.977)^2 = 0.955$

Interpretation: 95.5% of the variability in exam scores is explained by the linear relationship with study hours. This indicates the model fits the data very well.

**b) (5 points)** Given that $SSE = 23.5$ and $n = 8$, calculate the standard error of the estimate ($s_e$) and explain what it measures.

**Solution:**
$s_e = \sqrt{\frac{SSE}{n-2}} = \sqrt{\frac{23.5}{8-2}} = \sqrt{3.917} = 1.979$

The standard error of the estimate measures the typical size of prediction errors. On average, our predictions are off by about 2 exam points.

---

## Problem 5 (10 points) - Hypothesis Testing

Using the regression from Problem 2, test whether there is a significant linear relationship between study hours and exam scores.

**a) (3 points)** State the null and alternative hypotheses.

**Solution:**
- $H_0: \beta_1 = 0$ (no linear relationship)
- $H_A: \beta_1 \neq 0$ (there is a linear relationship)

**b) (4 points)** Given that $SE(b_1) = 0.339$, calculate the t-statistic and find the p-value.

**Solution:**
$t = \frac{b_1 - 0}{SE(b_1)} = \frac{3.779}{0.339} = 11.147$

With $df = n - 2 = 6$, the p-value < 0.0001 (very small)

**c) (3 points)** State your conclusion at $\alpha = 0.05$.

**Solution:**
Since p-value < 0.05, we reject $H_0$. There is statistically significant evidence of a linear relationship between study hours and exam scores. Students who study more tend to score higher on exams.

---

## Grading Rubric

| Problem | Points | Criteria |
|---------|--------|----------|
| 1a | 4 | Correct definitions with clear explanations |
| 1b | 4 | All four assumptions named and described |
| 2a | 4 | Correct calculations of means and r |
| 2b | 4 | Correct slope, intercept, and equation |
| 2c | 4 | Meaningful interpretations in context |
| 3a | 3 | Correct prediction with work shown |
| 3b | 3 | Correct residual calculation |
| 3c | 4 | Explains extrapolation concerns |
| 4a | 5 | Correct R² with interpretation |
| 4b | 5 | Correct s_e with interpretation |
| 5a | 3 | Correct hypotheses |
| 5b | 4 | Correct t-statistic |
| 5c | 3 | Correct conclusion with reasoning |

---

*Generated by scholar v2.0.0*
