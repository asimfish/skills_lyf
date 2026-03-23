---
render_macros: false
---

# Designing Monte Carlo Simulation Studies

A comprehensive tutorial for planning and executing simulation studies in statistical research.

**Learning Objectives**: By the end of this tutorial, you will be able to:
- Design a Monte Carlo simulation study from scratch
- Choose appropriate performance metrics for your research question
- Use Scholar's `/simulation:design` command effectively
- Write efficient simulation code in R
- Plan parallel execution strategies
- Avoid common simulation design pitfalls

**Prerequisites**:
- Intermediate R programming skills
- Understanding of statistical inference
- Basic knowledge of Monte Carlo methods
- Scholar plugin installed (v2.5.0+)

**⏱️ Estimated Time**: 60-75 minutes

---

## Table of Contents

1. [Introduction to Simulation Studies](#introduction)
2. [The Simulation Design Process](#design-process)
3. [Step 1: Define Your Research Question](#step-1)
4. [Step 2: Use Scholar's Design Command](#step-2)
5. [Step 3: Set Up Data Generation](#step-3)
6. [Step 4: Choose Performance Metrics](#step-4)
7. [Step 5: Determine Sample Sizes](#step-5)
8. [Step 6: Plan Parallel Execution](#step-6)
9. [Complete Working Example](#complete-example)
10. [Best Practices for Reproducibility](#best-practices)
11. [Common Design Mistakes](#common-mistakes)
12. [Troubleshooting](#troubleshooting)
13. [Next Steps](#next-steps)

---

## Introduction to Simulation Studies {#introduction}

Monte Carlo simulations are computational experiments that use repeated random sampling to evaluate statistical methods, test theoretical results, or explore complex systems.

### Why Simulations?

- **Controlled Environments**: Test methods under known conditions
- **Theory Validation**: Verify analytical results with finite samples
- **Method Comparison**: Compare competing approaches objectively
- **Power Analysis**: Determine sample size requirements
- **Robustness Checks**: Assess performance under violations

### Real-World Applications

1. **Testing New Estimators**: Does your mediation estimator work with non-normal data?
2. **Power Analysis**: How many subjects do you need to detect an effect?
3. **Method Comparison**: Which test has better Type I error control?
4. **Assumption Violations**: What happens when normality is violated?

---

## The Simulation Design Process {#design-process}

A well-designed simulation study follows a structured workflow:

```
Research Question → Design Parameters → Data Generation
       ↓                    ↓                ↓
Performance Metrics ← Analysis Methods ← Sample Sizes
       ↓                    ↓                ↓
Parallel Execution → Run Simulation → Analyze Results
```

### Key Questions to Answer

Before writing any code, ask yourself:

1. **What am I testing?** (estimator, test, method)
2. **Under what conditions?** (sample size, effect size, distributions)
3. **How will I measure performance?** (bias, coverage, power)
4. **How many replications?** (usually 1,000-10,000)
5. **How long will it take?** (computational resources)

---

## Step 1: Define Your Research Question {#step-1}

### Start with a Clear Hypothesis

**Example Research Questions**:

- "Does the bootstrap percentile method maintain nominal coverage for small samples?"
- "Which mediation test has higher power for non-normal indirect effects?"
- "How robust is linear regression to outliers in different sample sizes?"

### Formalize Your Question

Let's work through a concrete example:

**Research Question**: *Does the Sobel test maintain Type I error control when the mediator is non-normally distributed?*

**Formalized Parameters**:
- Population indirect effect: ab = 0 (null hypothesis)
- Sample sizes: n ∈ {50, 100, 200, 500}
- Mediator distributions: Normal, Chi-square(3), Uniform(-√3, √3)
- Path coefficients: a ∈ {0, 0.3, 0.5}, b ∈ {0, 0.3, 0.5}
- Replications: 5,000 per condition
- Performance metric: Type I error rate (should be ≈ 0.05)

### Exercise: Define Your Own Question

Before proceeding, write down:

1. Your research question (one sentence)
2. The method/estimator you're testing
3. The conditions that might affect performance
4. The performance metrics you'll use

---

## Step 2: Use Scholar's Design Command {#step-2}

Now we'll use Scholar to create a structured simulation plan.

### Basic Command Usage

```bash
/simulation:design
```

This launches an interactive session where Scholar asks:

1. What statistical method are you evaluating?
2. What data generating mechanism will you use?
3. Which parameters will you vary?
4. What performance metrics do you need?
5. What sample sizes and replications?

### Example: Type I Error Study

Let's design our Sobel test simulation:

```bash
/simulation:design
```

**Scholar's Questions and Your Responses**:

```
Q: What statistical method are you evaluating?
A: Sobel test for mediation analysis

Q: What is your research question?
A: Does the Sobel test maintain Type I error control when the mediator
   is non-normally distributed?

Q: What data generating mechanism will you use?
A: Linear regression models:
   M = a*X + e_M
   Y = b*M + c'*X + e_Y
   where e_M follows different distributions

Q: Which parameters will you vary?
A: - Sample size (n)
   - Mediator error distribution (normal, chi-square, uniform)
   - Path coefficient a
   - Path coefficient b

Q: What performance metrics do you need?
A: - Type I error rate (proportion of p < 0.05 when ab = 0)
   - Empirical power (proportion of p < 0.05 when ab ≠ 0)
   - Mean p-value distribution

Q: Planned sample sizes?
A: 50, 100, 200, 500

Q: Replications per condition?
A: 5,000
```

### Generated Output

Scholar creates a comprehensive markdown file with:

```markdown
# Simulation Study Plan: Sobel Test Type I Error

## Research Question
Does the Sobel test maintain Type I error control when the mediator
is non-normally distributed?

## Design Matrix

| Condition | n   | Distribution | a   | b   | ab  | Reps  |
|-----------|-----|--------------|-----|-----|-----|-------|
| 1         | 50  | Normal       | 0.0 | 0.3 | 0.0 | 5,000 |
| 2         | 50  | Chi-sq(3)    | 0.0 | 0.3 | 0.0 | 5,000 |
| 3         | 50  | Uniform      | 0.0 | 0.3 | 0.0 | 5,000 |
...
| Total     |     |              |     |     |     | 60,000|

## Performance Metrics

1. **Type I Error Rate**
   - Target: 0.05
   - Acceptable range: [0.04, 0.06] (Bradley's liberal criterion)
   - Calculation: proportion of p < 0.05 when ab = 0

2. **Empirical Power**
   - Target: > 0.80
   - Calculation: proportion of p < 0.05 when ab ≠ 0

## R Code Template

```r
# Data generation function
generate_data <- function(n, a, b, c_prime, dist) {
  # [Code provided by Scholar]
}

# Analysis function
analyze_sobel <- function(data) {
  # [Code provided by Scholar]
}

# Simulation wrapper
run_simulation <- function(condition) {
  # [Code provided by Scholar]
}
```

## Computational Requirements

- Total iterations: 60,000
- Estimated time per iteration: 0.05 seconds
- Total time (sequential): 50 minutes
- Recommended: Parallel execution on 8 cores (~7 minutes)

## Expected Results

If the Sobel test is robust to non-normality:
- Type I error rates should be within [0.04, 0.06] for all distributions

If the test is sensitive to non-normality:
- Type I error rates may be inflated for chi-square distribution
- Type I error rates may differ from nominal 0.05 level
```

### Integration with flow-cli

If you're using flow-cli, Scholar automatically detects your course/research configuration:

```yaml
# .flow/research-config.yml detected
scholar:
  simulation:
    default_reps: 5000
    parallel_cores: 8
    output_dir: "simulations/"
```

---

## Step 3: Set Up Data Generation {#step-3}

### The Data Generating Process (DGP)

Your DGP must:
1. Reflect realistic data structures
2. Allow parameter manipulation
3. Be computationally efficient
4. Handle edge cases gracefully

### Example: Mediation DGP

```r
#' Generate mediation data
#'
#' @param n Sample size
#' @param a Path X -> M
#' @param b Path M -> Y
#' @param c_prime Direct effect X -> Y
#' @param dist Error distribution for M ("normal", "chisq", "uniform")
#' @param seed Random seed (optional)
#' @return Data frame with X, M, Y
generate_mediation_data <- function(n, a, b, c_prime,
                                     dist = "normal",
                                     seed = NULL) {
  if (!is.null(seed)) set.seed(seed)

  # Predictor (standardized)
  X <- rnorm(n, mean = 0, sd = 1)

  # Mediator error
  e_M <- switch(dist,
    "normal" = rnorm(n, mean = 0, sd = 1),
    "chisq"  = (rchisq(n, df = 3) - 3) / sqrt(6),  # Standardized
    "uniform" = runif(n, min = -sqrt(3), max = sqrt(3)),  # SD = 1
    stop("Unknown distribution: ", dist)
  )

  # Mediator
  M <- a * X + e_M

  # Outcome error (always normal)
  e_Y <- rnorm(n, mean = 0, sd = 1)

  # Outcome
  Y <- b * M + c_prime * X + e_Y

  # Return data frame
  data.frame(X = X, M = M, Y = Y)
}
```

### Testing Your DGP

Before running the full simulation, test your DGP:

```r
# Test case 1: Normal distribution, null effect
test_data_1 <- generate_mediation_data(
  n = 100,
  a = 0,
  b = 0.3,
  c_prime = 0.2,
  dist = "normal"
)

# Check dimensions
stopifnot(nrow(test_data_1) == 100)
stopifnot(ncol(test_data_1) == 3)

# Check means (should be near 0)
stopifnot(abs(mean(test_data_1$X)) < 0.2)

# Test case 2: Chi-square distribution
test_data_2 <- generate_mediation_data(
  n = 1000,
  a = 0.5,
  b = 0.5,
  c_prime = 0,
  dist = "chisq"
)

# Check mediator skewness (should be positive for chi-square)
library(moments)
skew_M <- skewness(test_data_2$M)
stopifnot(skew_M > 0)  # Chi-square is right-skewed

# Verify indirect effect exists
cor_XY <- cor(test_data_2$X, test_data_2$Y)
stopifnot(cor_XY > 0.2)  # ab = 0.25, should see correlation
```

### Common DGP Patterns

**Pattern 1: Varying Effect Sizes**

```r
# Create effect size grid
effect_grid <- expand.grid(
  a = c(0, 0.14, 0.39, 0.59),  # Cohen's d: 0, small, medium, large
  b = c(0, 0.14, 0.39, 0.59)
)
```

**Pattern 2: Varying Distributions**

```r
# Distribution family
distributions <- list(
  normal = function(n) rnorm(n, 0, 1),
  t5     = function(n) rt(n, df = 5) / sqrt(5/3),  # Standardized
  lognormal = function(n) {
    raw <- rlnorm(n, meanlog = 0, sdlog = 1)
    (raw - mean(raw)) / sd(raw)  # Standardize
  }
)
```

**Pattern 3: Varying Sample Sizes**

```r
# Common sample size ranges
sample_sizes <- c(
  30,   # Minimum for CLT
  50,   # Small sample
  100,  # Medium sample
  200,  # Large sample
  500   # Very large
)
```

---

## Step 4: Choose Performance Metrics {#step-4}

### Common Simulation Metrics

| Metric | Formula | Interpretation | Target |
|--------|---------|----------------|--------|
| Bias | E[θ̂ - θ] | Average deviation from truth | 0 |
| MSE | E[(θ̂ - θ)²] | Overall accuracy | Minimize |
| Coverage | P(CI contains θ) | Confidence interval accuracy | 0.95 |
| Type I Error | P(reject H₀ \| H₀ true) | False positive rate | α (0.05) |
| Power | P(reject H₀ \| H₀ false) | True positive rate | > 0.80 |

### Example: Computing Coverage

```r
#' Compute confidence interval coverage
#'
#' @param estimates Vector of point estimates
#' @param ses Vector of standard errors
#' @param true_value True population parameter
#' @param alpha Significance level (default 0.05)
#' @return Coverage proportion
compute_coverage <- function(estimates, ses, true_value, alpha = 0.05) {
  # Critical value for two-tailed test
  z_crit <- qnorm(1 - alpha / 2)

  # Confidence interval bounds
  ci_lower <- estimates - z_crit * ses
  ci_upper <- estimates + z_crit * ses

  # Check if true value is in CI
  in_ci <- (true_value >= ci_lower) & (true_value <= ci_upper)

  # Return proportion
  mean(in_ci)
}
```

### Example: Computing Relative Bias

```r
#' Compute relative bias
#'
#' @param estimates Vector of estimates
#' @param true_value True population parameter
#' @return Relative bias as percentage
compute_relative_bias <- function(estimates, true_value) {
  if (true_value == 0) {
    warning("True value is 0; returning absolute bias")
    return(mean(estimates))
  }

  mean_estimate <- mean(estimates)
  bias <- mean_estimate - true_value
  relative_bias <- (bias / true_value) * 100

  return(relative_bias)
}
```

### Creating a Performance Summary Function

```r
#' Summarize simulation results
#'
#' @param results Data frame with columns: estimate, se, p_value, true_value
#' @return Named vector of performance metrics
summarize_performance <- function(results) {
  c(
    n_reps = nrow(results),
    mean_estimate = mean(results$estimate),
    bias = mean(results$estimate - results$true_value),
    relative_bias = compute_relative_bias(
      results$estimate,
      unique(results$true_value)
    ),
    mse = mean((results$estimate - results$true_value)^2),
    coverage = compute_coverage(
      results$estimate,
      results$se,
      unique(results$true_value)
    ),
    type_I_error = mean(results$p_value < 0.05 & results$true_value == 0),
    power = mean(results$p_value < 0.05 & results$true_value != 0)
  )
}
```

---

## Step 5: Determine Sample Sizes {#step-5}

### Rules of Thumb for Replications

| Study Type | Minimum Reps | Recommended | Rationale |
|------------|-------------|-------------|-----------|
| Type I error | 5,000 | 10,000 | Need precision for rare event (α = 0.05) |
| Coverage | 2,000 | 5,000 | Confidence interval stability |
| Power curves | 1,000 | 2,500 | Smooth power function |
| Bias/MSE | 1,000 | 2,000 | Stable mean estimates |

### Calculating Simulation Precision

For Type I error rates, the Monte Carlo standard error is:

SE(α̂) = √(α(1-α) / R)

where R is the number of replications.

```r
#' Calculate required replications for desired precision
#'
#' @param alpha True Type I error rate (e.g., 0.05)
#' @param margin Desired margin of error (e.g., 0.005)
#' @param confidence Confidence level (default 0.95)
#' @return Required number of replications
calculate_required_reps <- function(alpha, margin, confidence = 0.95) {
  z <- qnorm(1 - (1 - confidence) / 2)
  required <- (z^2 * alpha * (1 - alpha)) / margin^2
  ceiling(required)
}

# Example: For α = 0.05, want margin = ±0.005
calculate_required_reps(alpha = 0.05, margin = 0.005)
# Result: 7,300 replications
```

### Sample Size Selection Strategy

**Start Small, Scale Up**:

1. **Pilot Run**: 100-500 reps on a few conditions
2. **Test Logic**: Verify code works correctly
3. **Estimate Time**: Extrapolate computational cost
4. **Full Run**: Scale to desired replications

```r
# Pilot run with small reps
pilot_conditions <- expand.grid(
  n = c(50, 100),
  dist = c("normal", "chisq"),
  reps = 100  # Small for testing
)

# After validation, scale up
full_conditions <- expand.grid(
  n = c(50, 100, 200, 500),
  dist = c("normal", "chisq", "uniform"),
  reps = 5000  # Full simulation
)
```

---

## Step 6: Plan Parallel Execution {#step-6}

### Why Parallelize?

A simulation with 48 conditions × 5,000 reps = 240,000 iterations might take:
- **Sequential**: 4-8 hours
- **8 cores**: 30-60 minutes
- **16 cores**: 15-30 minutes

### Using `future` and `furrr`

```r
library(future)
library(furrr)

# Set up parallel backend
plan(multisession, workers = 8)

# Parallel simulation
results <- future_map_dfr(
  1:nrow(conditions),
  function(i) {
    run_single_condition(conditions[i, ])
  },
  .options = furrr_options(seed = TRUE)  # Reproducible
)
```

### Progress Tracking with `progressr`

```r
library(progressr)

# Enable progress updates
handlers(global = TRUE)
handlers("cli")  # Use cli package for nice progress bars

# Wrap simulation in progress tracking
with_progress({
  p <- progressor(steps = nrow(conditions))

  results <- future_map_dfr(
    1:nrow(conditions),
    function(i) {
      result <- run_single_condition(conditions[i, ])
      p()  # Increment progress
      result
    }
  )
})
```

### Memory Management

For large simulations, save intermediate results:

```r
# Save results every N conditions
checkpoint_every <- 10

for (i in seq_len(nrow(conditions))) {
  result <- run_single_condition(conditions[i, ])

  # Append to file
  write.csv(
    result,
    file.path("output", paste0("condition_", i, ".csv")),
    row.names = FALSE
  )

  # Checkpoint
  if (i %% checkpoint_every == 0) {
    message("Completed ", i, "/", nrow(conditions), " conditions")
  }
}

# Combine results later
all_files <- list.files("output", pattern = "condition_.*\\.csv", full.names = TRUE)
final_results <- do.call(rbind, lapply(all_files, read.csv))
```

---

## Complete Working Example {#complete-example}

Here's a complete, runnable simulation study:

```r
# ============================================================================
# Simulation Study: Sobel Test Type I Error Under Non-Normality
# ============================================================================

# Load packages
library(tidyverse)
library(future)
library(furrr)
library(progressr)

# Set up parallel processing
plan(multisession, workers = 8)

# ----------------------------------------------------------------------------
# 1. Data Generation
# ----------------------------------------------------------------------------

generate_mediation_data <- function(n, a, b, c_prime, dist = "normal", seed = NULL) {
  if (!is.null(seed)) set.seed(seed)

  # Predictor
  X <- rnorm(n, 0, 1)

  # Mediator error
  e_M <- switch(dist,
    "normal" = rnorm(n, 0, 1),
    "chisq"  = (rchisq(n, df = 3) - 3) / sqrt(6),
    "uniform" = runif(n, -sqrt(3), sqrt(3))
  )

  # Mediator
  M <- a * X + e_M

  # Outcome
  e_Y <- rnorm(n, 0, 1)
  Y <- b * M + c_prime * X + e_Y

  data.frame(X = X, M = M, Y = Y)
}

# ----------------------------------------------------------------------------
# 2. Analysis Function
# ----------------------------------------------------------------------------

sobel_test <- function(data) {
  # Fit models
  fit_M <- lm(M ~ X, data = data)
  fit_Y <- lm(Y ~ X + M, data = data)

  # Extract coefficients
  a <- coef(fit_M)["X"]
  b <- coef(fit_Y)["M"]

  # Standard errors
  se_a <- summary(fit_M)$coefficients["X", "Std. Error"]
  se_b <- summary(fit_Y)$coefficients["M", "Std. Error"]

  # Sobel test statistic
  ab <- a * b
  se_ab <- sqrt(b^2 * se_a^2 + a^2 * se_b^2)
  z <- ab / se_ab
  p_value <- 2 * pnorm(-abs(z))

  # Return results
  data.frame(
    estimate = ab,
    se = se_ab,
    z = z,
    p_value = p_value
  )
}

# ----------------------------------------------------------------------------
# 3. Simulation Wrapper
# ----------------------------------------------------------------------------

run_single_replication <- function(condition_row, rep_id) {
  data <- generate_mediation_data(
    n = condition_row$n,
    a = condition_row$a,
    b = condition_row$b,
    c_prime = 0.2,
    dist = condition_row$dist,
    seed = condition_row$seed_base + rep_id
  )

  result <- sobel_test(data)

  # Add condition info
  cbind(
    condition_row[, c("condition_id", "n", "dist", "a", "b")],
    rep_id = rep_id,
    result
  )
}

run_condition <- function(condition_row, n_reps = 5000) {
  map_dfr(1:n_reps, ~run_single_replication(condition_row, .x))
}

# ----------------------------------------------------------------------------
# 4. Define Conditions
# ----------------------------------------------------------------------------

conditions <- expand.grid(
  n = c(50, 100, 200, 500),
  dist = c("normal", "chisq", "uniform"),
  a = 0,  # Null indirect effect
  b = 0.3,
  stringsAsFactors = FALSE
) %>%
  mutate(
    condition_id = row_number(),
    seed_base = condition_id * 100000,  # Unique seeds per condition
    true_ab = a * b
  )

# ----------------------------------------------------------------------------
# 5. Run Simulation
# ----------------------------------------------------------------------------

handlers(global = TRUE)
handlers("cli")

with_progress({
  p <- progressor(steps = nrow(conditions))

  results <- future_map_dfr(
    1:nrow(conditions),
    function(i) {
      result <- run_condition(conditions[i, ], n_reps = 5000)
      p()
      result
    },
    .options = furrr_options(seed = TRUE)
  )
})

# Save raw results
write_csv(results, "sobel_simulation_results.csv")

# ----------------------------------------------------------------------------
# 6. Analyze Results
# ----------------------------------------------------------------------------

performance <- results %>%
  group_by(condition_id, n, dist) %>%
  summarise(
    n_reps = n(),
    mean_estimate = mean(estimate),
    bias = mean(estimate - true_ab),
    mse = mean((estimate - true_ab)^2),
    type_I_error = mean(p_value < 0.05),
    se_type_I = sqrt(type_I_error * (1 - type_I_error) / n_reps),
    ci_lower = type_I_error - 1.96 * se_type_I,
    ci_upper = type_I_error + 1.96 * se_type_I,
    .groups = "drop"
  )

# Print summary
print(performance, n = 50)

# Visualize Type I error rates
ggplot(performance, aes(x = factor(n), y = type_I_error, color = dist)) +
  geom_hline(yintercept = 0.05, linetype = "dashed", color = "red") +
  geom_hline(yintercept = c(0.04, 0.06), linetype = "dotted", color = "gray50") +
  geom_point(size = 3) +
  geom_errorbar(aes(ymin = ci_lower, ymax = ci_upper), width = 0.2) +
  labs(
    title = "Sobel Test Type I Error Rates",
    subtitle = "Nominal α = 0.05, dashed line = target, dotted = Bradley's liberal bounds",
    x = "Sample Size",
    y = "Empirical Type I Error Rate",
    color = "Mediator Distribution"
  ) +
  theme_minimal()

ggsave("type_I_error_plot.png", width = 8, height = 6)
```

### Expected Output

```
# A tibble: 12 × 9
   condition_id     n dist    n_reps mean_estimate    bias    mse type_I_error se_type_I
          <int> <dbl> <chr>    <int>         <dbl>   <dbl>  <dbl>        <dbl>     <dbl>
 1            1    50 normal    5000      0.000123 0.00012 0.0289       0.0496   0.00307
 2            2    50 chisq     5000      0.000234 0.00023 0.0291       0.0521   0.00314
 3            3    50 uniform   5000     -0.000089 -0.0001 0.0287       0.0489   0.00305
...
```

The plot will show whether Type I error rates stay within the acceptable [0.04, 0.06] range across distributions and sample sizes.

---

## Best Practices for Reproducibility {#best-practices}

### 1. Version Control

```bash
# Initialize git repo
git init

# Track key files
git add simulation_study.R
git add conditions.csv
git commit -m "Initial simulation design"
```

### 2. Session Info

Always record your R environment:

```r
# At end of script
writeLines(
  capture.output(sessionInfo()),
  "session_info.txt"
)
```

### 3. Random Seeds

**Use hierarchical seeding**:

```r
# Master seed
set.seed(20260201)

# Generate unique seeds for each condition
conditions$seed_base <- sample.int(
  .Machine$integer.max,
  size = nrow(conditions)
)

# Within each condition, use seed_base + rep_id
```

### 4. Documentation

Create a README for your simulation:

````markdown
# Sobel Test Type I Error Simulation

**Date**: 2026-02-01
**Author**: Your Name
**Scholar Version**: 2.5.0

## Research Question
Does the Sobel test maintain Type I error control under non-normal mediator distributions?

## Files
- `simulation_study.R`: Main simulation script
- `conditions.csv`: Design matrix
- `results.csv`: Raw simulation results
- `performance.csv`: Summary statistics
- `plots/`: Visualization outputs

## Computational Environment
- R version: 4.3.2
- Cores: 8
- Runtime: ~45 minutes
- Total iterations: 60,000

## Reproducing Results
```r
source("simulation_study.R")
```
````

### 5. Save Everything

```r
# Save workspace
save.image("simulation_workspace.RData")

# Or save specific objects
save(
  conditions,
  results,
  performance,
  file = "simulation_results.RData"
)
```

---

## Common Design Mistakes {#common-mistakes}

### Mistake 1: Insufficient Replications

**Problem**: Using only 1,000 reps for Type I error rates.

**Why It's Bad**: Monte Carlo SE is too large:
SE(0.05) = √(0.05 × 0.95 / 1000) = 0.0069

A 95% CI would be [0.036, 0.064], making it hard to detect deviations.

**Solution**: Use at least 5,000 reps for α = 0.05.

### Mistake 2: Incorrect Standardization

**Problem**: Comparing distributions with different variances.

```r
# WRONG: These don't have the same variance
e_M_normal <- rnorm(n, 0, 1)      # Var = 1
e_M_chisq <- rchisq(n, df = 3)    # Var = 6
```

**Solution**: Standardize non-normal distributions:

```r
# RIGHT: Standardize to variance = 1
e_M_chisq_raw <- rchisq(n, df = 3)
e_M_chisq <- (e_M_chisq_raw - 3) / sqrt(6)
```

### Mistake 3: Ignoring Convergence Issues

**Problem**: Some models fail to converge but failures are silently ignored.

**Solution**: Use `tryCatch()` and report failure rates:

```r
sobel_test_safe <- function(data) {
  tryCatch(
    sobel_test(data),
    error = function(e) {
      data.frame(
        estimate = NA,
        se = NA,
        z = NA,
        p_value = NA,
        converged = FALSE,
        error_msg = e$message
      )
    }
  )
}

# Report convergence rate
results %>%
  summarise(
    convergence_rate = mean(!is.na(estimate)),
    failure_count = sum(is.na(estimate))
  )
```

### Mistake 4: No Sanity Checks

**Problem**: Running full simulation without testing data generation.

**Solution**: Always test your DGP first:

```r
# Sanity check 1: Known indirect effect
test_data <- generate_mediation_data(n = 10000, a = 0.5, b = 0.5, c_prime = 0, dist = "normal")

# True indirect effect: 0.25
# Check empirical correlation (should be ~0.25)
cor(test_data$X, test_data$Y)
# Should be around 0.25 ± 0.01

# Sanity check 2: Null effect
test_data_null <- generate_mediation_data(n = 10000, a = 0, b = 0, c_prime = 0, dist = "normal")
cor(test_data_null$X, test_data_null$Y)
# Should be near 0
```

### Mistake 5: P-Hacking Your Simulation

**Problem**: Running multiple pilot simulations and only reporting the one that "worked".

**Solution**: Pre-register your design and report all results, including unexpected findings.

---

## Troubleshooting {#troubleshooting}

### Issue 1: Simulation Runs Too Slowly

**Symptoms**: Expected 1 hour, still running after 4 hours.

**Diagnosis**:
```r
# Time a single replication
system.time({
  test <- run_single_replication(conditions[1, ], rep_id = 1)
})
```

**Solutions**:
1. **Optimize bottlenecks**: Use `profvis::profvis()` to identify slow code
2. **Reduce replications**: Start with fewer reps for testing
3. **Simplify conditions**: Reduce number of conditions in pilot
4. **More cores**: Increase parallel workers

### Issue 2: Memory Overflow

**Symptoms**: R crashes or system becomes unresponsive.

**Diagnosis**:
```r
# Check object sizes
object.size(results) / 1024^2  # Size in MB
```

**Solutions**:
1. **Save incrementally**: Don't store all results in memory
2. **Reduce output**: Only save essential columns
3. **Use data.table**: More memory-efficient than data.frame

```r
library(data.table)

# Save results in chunks
for (i in seq_len(nrow(conditions))) {
  result <- run_condition(conditions[i, ])
  fwrite(result, "results.csv", append = i > 1)
}
```

### Issue 3: Results Don't Match Theory

**Symptoms**: Type I error rate is 0.12 instead of expected 0.05.

**Diagnosis**:
1. Check data generation (plot distributions)
2. Verify true parameter values
3. Test on simple cases first

```r
# Visualize generated data
test_data <- generate_mediation_data(n = 1000, a = 0, b = 0.3, c_prime = 0, dist = "normal")

library(GGally)
ggpairs(test_data)

# Check if true indirect effect is 0
summary(lm(Y ~ X + M, data = test_data))  # Coefficient for X should be ~0
```

### Issue 4: Parallel Execution Fails

**Symptoms**: Errors about unavailable cores or random seeds.

**Solutions**:
```r
# 1. Check available cores
parallel::detectCores()

# 2. Reduce workers if necessary
plan(multisession, workers = 4)

# 3. Ensure reproducibility
future_map(..., .options = furrr_options(seed = TRUE))

# 4. Reset backend if needed
plan(sequential)  # Reset
plan(multisession, workers = 8)  # Restart
```

---

## Next Steps {#next-steps}

### Immediate Actions

1. **Complete the Exercise**: Design a simulation for your own research question using `/simulation:design`
2. **Run a Pilot**: Test with 100 reps on 2-3 conditions
3. **Review Your DGP**: Ensure it accurately reflects your assumptions
4. **Validate Metrics**: Confirm performance metrics align with research goals

### Deepen Your Knowledge

**Related Tutorials**:
- [Statistical Analysis Plans](analysis-planning.md) - Plan your analysis before collecting data

**Key Topics**:
- Power analysis workflows for determining required sample sizes
- Simulation commands via `/simulation:design` and `/simulation:run`
- Performance metrics (bias, RMSE, coverage, power)
- Parallel computing setup for R-based simulations

**Example Studies**:
- `/examples/research/mediation-simulation/` - Full mediation simulation study
- `/examples/research/bootstrap-comparison/` - Comparing bootstrap methods
- `/examples/research/missing-data-simulation/` - Handling missing data

### Advanced Topics

Once comfortable with basic simulations, explore:

1. **Sequential Stopping Rules**: Adaptive sample size determination
2. **High-Performance Computing**: Running simulations on clusters
3. **Bayesian Simulations**: Prior sensitivity analyses
4. **Agent-Based Models**: Complex system simulations
5. **Approximate Bayesian Computation**: Simulation-based inference

### Join the Community

- **Scholar GitHub**: Report issues, request features
- **Statistical Simulation Resources**: Check `docs/resources/simulation-references.md`
- **R-SIG-Mixed-Models**: Mailing list for simulation questions

---

## Summary

You've learned how to:

- Define clear research questions for simulation studies
- Use Scholar's `/simulation:design` command effectively
- Create robust data generating processes
- Choose appropriate performance metrics
- Determine sample sizes and replications
- Implement parallel execution strategies
- Follow best practices for reproducibility
- Avoid common simulation pitfalls
- Troubleshoot simulation issues

**Key Takeaway**: A well-designed simulation study requires careful planning before writing any code. Use Scholar's design tools to structure your thinking, then implement systematically.

**Next Tutorial**: [Creating Statistical Analysis Plans](analysis-planning.md)

---

**Last Updated**: 2026-02-01
**Scholar Version**: 2.5.0
**Maintainer**: Data-Wise Team
