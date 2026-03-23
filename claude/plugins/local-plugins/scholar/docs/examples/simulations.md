# Simulation Study Examples

Comprehensive examples of Monte Carlo simulation studies using Scholar's research commands. These examples demonstrate complete workflows from design through publication.

## Navigation

- [Overview](#overview)
- [Example 1: Bootstrap CI Comparison](#example-1-bootstrap-ci-comparison) - Coverage rate analysis
- [Example 2: Power Analysis](#example-2-power-analysis) - Sample size determination
- [Example 3: Robustness Study](#example-3-robustness-study) - Distributional violations
- [Example 4: Method Comparison](#example-4-method-comparison) - Estimator performance
- [Example 5: Factorial Design](#example-5-factorial-design) - Complex simulation
- [Complete Workflow](#complete-workflow-publication-ready-study) - End-to-end example
- [Computational Strategies](#computational-strategies) - Parallel processing, optimization
- [Visualization Gallery](#visualization-gallery) - Publication-ready figures
- [Real Research Examples](#real-research-examples) - Published simulation studies

---

## Overview

Monte Carlo simulation studies are essential for evaluating statistical methods. Scholar streamlines the entire simulation workflow:

### Typical Simulation Study Workflow

```
1. Design Study
   └─> /research:simulation:design "research question"

2. Pilot Implementation
   └─> Run with small reps (1,000) to debug

3. Full Simulation
   └─> Scale to production (5,000+ reps)

4. Analyze Results
   └─> /research:simulation:analysis results.csv

5. Write Manuscript
   ├─> /research:manuscript:methods
   └─> /research:manuscript:results
```

### Common Study Types

| Study Type | Purpose | Key Metrics |
|------------|---------|-------------|
| Coverage | CI performance | Coverage rate, width |
| Power | Sample size planning | Power, Type I error |
| Robustness | Assumption violations | Bias, MSE under misspecification |
| Comparison | Method selection | Relative efficiency, ranking |
| Factorial | Multiple factors | Interaction effects, main effects |

### Computational Considerations

- **Pilot runs:** 1,000 reps to test code (< 1 hour)
- **Production runs:** 5,000+ reps for publication (4-24 hours)
- **Parallel processing:** Use multiple cores (8-16 typical)
- **Memory management:** Save intermediate results
- **Reproducibility:** Set seeds, version control

---

## Example 1: Bootstrap CI Comparison

**Research Question:** Which bootstrap confidence interval method achieves better coverage for mediation effects?

### Scenario

You're comparing percentile vs BCa bootstrap confidence intervals for indirect effects. Your goal is to determine if BCa's complexity is justified by improved coverage.

### Step 1: Design the Study

```bash
/research:simulation:design "Compare coverage rates of percentile vs BCa bootstrap confidence intervals for mediation effects across sample sizes 50, 100, 200, 500"
```

### Generated Design

```markdown
## Simulation Design: Bootstrap CI Methods for Mediation

### Research Objective
Evaluate the finite-sample performance of two bootstrap confidence interval
methods (percentile and BCa) for indirect effects in single-mediator models.

### Data Generation Model

**Structure:**
- Treatment Z → Mediator M → Outcome Y
- Simple mediation with no confounders

**Parameters:**
- Sample sizes: n ∈ {50, 100, 200, 500}
- True indirect effect: θ = αβ ∈ {0, 0.1, 0.3, 0.5}
- Treatment effect on M: α = 0.3
- Mediator effect on Y: β = θ/α
- Error distributions: Normal(0, 1) for both M and Y

**Data Generating Process:**
$$
M_i = \alpha Z_i + \epsilon_{Mi}, \quad \epsilon_{Mi} \sim N(0, 1)
$$
$$
Y_i = \beta M_i + \gamma Z_i + \epsilon_{Yi}, \quad \epsilon_{Yi} \sim N(0, 1)
$$

where $Z_i \sim \text{Bernoulli}(0.5)$ is the treatment indicator.

### Estimation Methods

**Method 1: Bootstrap Percentile CI**
1. Draw B = 5,000 bootstrap samples
2. Estimate $\hat{\theta}^*_b = \hat{\alpha}^*_b \times \hat{\beta}^*_b$ in each
3. 95% CI = [2.5th percentile, 97.5th percentile]

**Method 2: BCa (Bias-Corrected and Accelerated) CI**
1. Same bootstrap samples as Method 1
2. Compute bias-correction factor z₀
3. Compute acceleration factor a via jackknife
4. Adjust percentiles: $\alpha_1 = \Phi(z_0 + \frac{z_0 + z_{\alpha/2}}{1 - a(z_0 + z_{\alpha/2})})$
5. 95% CI = [$\alpha_1$ percentile, $\alpha_2$ percentile]

### Performance Metrics

**Primary:**
- **Coverage Rate**: Proportion of CIs containing true θ (target: 0.95)
- **Average Width**: Mean CI length (precision)

**Secondary:**
- **Non-coverage Error Balance**: P(θ < CI lower) vs P(θ > CI upper)
- **Computation Time**: Mean seconds per replication
- **Monte Carlo Error**: SE of coverage estimate ≈ sqrt(0.95 × 0.05 / 5000) = 0.003

### Design Structure

**Factorial Design:**
| Factor | Levels | Total |
|--------|--------|-------|
| Sample size (n) | 50, 100, 200, 500 | 4 |
| Effect size (θ) | 0.0, 0.1, 0.3, 0.5 | 4 |
| CI method | Percentile, BCa | 2 |
| **Total scenarios** | | **32** |

**Replications:** 5,000 per scenario (160,000 total datasets)

### Implementation Timeline

**Phase 1: Pilot (2 hours)**
- 1,000 reps × 1 sample size (n = 100) × 2 methods × 4 effects = 8,000 runs
- Goal: Verify code correctness, estimate runtime

**Phase 2: Full Simulation (8 hours)**
- 5,000 reps × 32 scenarios = 160,000 runs
- Parallel: 8 cores, ~1 hour per core
```

### Step 2: Implement in R

```r
# =============================================================================
# Bootstrap CI Comparison Simulation
# Generated by: /research:simulation:design
# Date: 2026-01-31
# =============================================================================

library(dplyr)
library(boot)
library(parallel)
library(progress)

# Set reproducibility
set.seed(20260131)

# -----------------------------------------------------------------------------
# Function: simulate_one_dataset
# Purpose: Generate one mediation dataset and compute CIs
# -----------------------------------------------------------------------------
simulate_one_dataset <- function(n, alpha = 0.3, beta, B = 5000) {
  # Generate data
  Z <- rbinom(n, 1, 0.5)
  epsilon_M <- rnorm(n, 0, 1)
  epsilon_Y <- rnorm(n, 0, 1)

  M <- alpha * Z + epsilon_M
  Y <- beta * M + epsilon_Y  # Note: gamma = 0 for simplicity

  data <- data.frame(Z = Z, M = M, Y = Y)

  # Bootstrap function for indirect effect
  indirect_effect <- function(data, indices) {
    d <- data[indices, ]
    fit_m <- lm(M ~ Z, data = d)
    fit_y <- lm(Y ~ M + Z, data = d)

    alpha_hat <- coef(fit_m)["Z"]
    beta_hat <- coef(fit_y)["M"]

    alpha_hat * beta_hat
  }

  # Run bootstrap
  boot_results <- boot(data, indirect_effect, R = B)

  # Compute both CI types
  ci_perc <- tryCatch(
    boot.ci(boot_results, type = "perc", conf = 0.95)$percent[4:5],
    error = function(e) c(NA, NA)
  )

  ci_bca <- tryCatch(
    boot.ci(boot_results, type = "bca", conf = 0.95)$bca[4:5],
    error = function(e) c(NA, NA)
  )

  list(
    estimate = boot_results$t0,
    perc_lower = ci_perc[1],
    perc_upper = ci_perc[2],
    bca_lower = ci_bca[1],
    bca_upper = ci_bca[2]
  )
}

# -----------------------------------------------------------------------------
# Function: run_simulation
# Purpose: Execute full simulation across design grid
# -----------------------------------------------------------------------------
run_simulation <- function(reps = 5000, cores = 8, pilot = FALSE) {
  # Design grid
  design <- expand.grid(
    n = c(50, 100, 200, 500),
    theta = c(0, 0.1, 0.3, 0.5),
    rep = 1:reps,
    stringsAsFactors = FALSE
  )

  # For pilot, only use n = 100
  if (pilot) {
    design <- design[design$n == 100, ]
  }

  # Compute beta from theta (theta = alpha * beta, alpha = 0.3)
  design$beta <- design$theta / 0.3

  cat(sprintf("Running %d total replications...\n", nrow(design)))

  # Progress bar
  pb <- progress_bar$new(
    format = "[:bar] :percent ETA: :eta",
    total = nrow(design),
    clear = FALSE
  )

  # Parallel execution with progress
  results <- mclapply(1:nrow(design), function(i) {
    row <- design[i, ]

    # Simulate one dataset
    res <- simulate_one_dataset(
      n = row$n,
      beta = row$beta,
      B = 5000
    )

    # Update progress (only in main thread)
    if (i %% 100 == 0) pb$tick(100)

    # Return combined results
    data.frame(
      n = row$n,
      theta = row$theta,
      rep = row$rep,
      estimate = res$estimate,
      perc_lower = res$perc_lower,
      perc_upper = res$perc_upper,
      bca_lower = res$bca_lower,
      bca_upper = res$bca_upper,
      stringsAsFactors = FALSE
    )
  }, mc.cores = cores)

  pb$terminate()

  # Combine all results
  bind_rows(results)
}

# -----------------------------------------------------------------------------
# Function: compute_coverage
# Purpose: Calculate performance metrics from simulation results
# -----------------------------------------------------------------------------
compute_coverage <- function(results) {
  results %>%
    group_by(n, theta) %>%
    summarize(
      # Coverage rates
      coverage_perc = mean(theta >= perc_lower & theta <= perc_upper, na.rm = TRUE),
      coverage_bca = mean(theta >= bca_lower & theta <= bca_upper, na.rm = TRUE),

      # Average widths
      width_perc = mean(perc_upper - perc_lower, na.rm = TRUE),
      width_bca = mean(bca_upper - bca_lower, na.rm = TRUE),

      # Non-coverage error balance
      left_error_perc = mean(theta < perc_lower, na.rm = TRUE),
      right_error_perc = mean(theta > perc_upper, na.rm = TRUE),
      left_error_bca = mean(theta < bca_lower, na.rm = TRUE),
      right_error_bca = mean(theta > bca_upper, na.rm = TRUE),

      # Sample size
      reps = n(),

      .groups = "drop"
    )
}

# =============================================================================
# EXECUTION
# =============================================================================

# STEP 1: Pilot run (fast, for debugging)
cat("=== PILOT RUN ===\n")
pilot_results <- run_simulation(reps = 1000, cores = 4, pilot = TRUE)
saveRDS(pilot_results, "pilot_results.rds")

pilot_coverage <- compute_coverage(pilot_results)
print(pilot_coverage)

# Verify results look reasonable before continuing
cat("\nPilot complete. Review results above.\n")
cat("If satisfactory, uncomment below to run full simulation.\n\n")

# STEP 2: Full simulation (production)
# full_results <- run_simulation(reps = 5000, cores = 8, pilot = FALSE)
# saveRDS(full_results, "full_results.rds")
# write.csv(full_results, "full_results.csv", row.names = FALSE)

# STEP 3: Compute performance metrics
# full_coverage <- compute_coverage(full_results)
# write.csv(full_coverage, "coverage_summary.csv", row.names = FALSE)
# print(full_coverage)
```

### Step 3: Run Pilot

```bash
# Execute pilot in R
Rscript bootstrap_simulation.R

# Expected output:
# === PILOT RUN ===
# Running 4000 total replications...
# [████████████████████████] 100% ETA: 0s
#
#      n theta coverage_perc coverage_bca width_perc width_bca  reps
#  1 100   0.0         0.942        0.951      0.191     0.183  1000
#  2 100   0.1         0.938        0.949      0.195     0.188  1000
#  3 100   0.3         0.945        0.952      0.224     0.219  1000
#  4 100   0.5         0.941        0.950      0.262     0.255  1000
```

**Interpretation:**

- Coverage close to 0.95 (good!)
- BCa slightly better coverage
- BCa slightly narrower (more efficient)
- Code runs without errors → proceed to full simulation

### Step 4: Full Simulation

Uncomment the full simulation section in the R script and run:

```bash
# Full run (8 hours with 8 cores)
Rscript bootstrap_simulation.R

# Monitor progress
tail -f simulation.log
```

### Step 5: Analyze Results

```bash
/research:simulation:analysis full_results.csv
```

### Generated Analysis Output

```markdown
## Simulation Results Analysis

### Performance Summary

**Coverage Rates by Method and Sample Size:**

| n   | θ   | Percentile | BCa   | Difference |
|-----|-----|------------|-------|------------|
| 50  | 0.0 | 0.923      | 0.944 | +0.021     |
| 50  | 0.1 | 0.919      | 0.942 | +0.023     |
| 50  | 0.3 | 0.928      | 0.948 | +0.020     |
| 50  | 0.5 | 0.932      | 0.951 | +0.019     |
| 100 | 0.0 | 0.941      | 0.950 | +0.009     |
| 100 | 0.1 | 0.939      | 0.949 | +0.010     |
| 100 | 0.3 | 0.944      | 0.952 | +0.008     |
| 100 | 0.5 | 0.943      | 0.951 | +0.008     |
| 200 | 0.0 | 0.947      | 0.951 | +0.004     |
| 200 | 0.1 | 0.946      | 0.950 | +0.004     |
| 200 | 0.3 | 0.948      | 0.952 | +0.004     |
| 200 | 0.5 | 0.949      | 0.952 | +0.003     |
| 500 | 0.0 | 0.949      | 0.950 | +0.001     |
| 500 | 0.1 | 0.950      | 0.950 | +0.000     |
| 500 | 0.3 | 0.950      | 0.951 | +0.001     |
| 500 | 0.5 | 0.951      | 0.951 | +0.000     |

### Key Findings

1. **Undercoverage in small samples:**
   - Percentile method undercovers at n=50 (92.3%-93.2% vs nominal 95%)
   - BCa corrects this, achieving 94.2%-95.1% coverage

2. **Convergence to nominal:**
   - Both methods approach 95% as n increases
   - At n ≥ 200, both achieve acceptable coverage

3. **CI width comparison:**
   - BCa consistently 3-5% narrower than percentile
   - Greater precision without sacrificing coverage

4. **Error balance:**
   - Percentile: asymmetric errors (more left than right)
   - BCa: balanced errors (symmetric)

### Recommendations

- **n < 100:** Use BCa to avoid undercoverage
- **n ≥ 200:** Either method acceptable; percentile is faster
- **Trade-off:** BCa worth ~15% extra computation time for better small-sample performance

### Suggested Manuscript Text

**Methods:**
"We conducted a Monte Carlo simulation study with 5,000 replications per
scenario to compare bootstrap percentile and BCa confidence intervals for
indirect effects. Data were generated from a single-mediator model with
sample sizes ranging from 50 to 500 and indirect effects from 0 to 0.5."

**Results:**
"The BCa method achieved near-nominal coverage across all sample sizes
(94.4%-95.1%), whereas the percentile method exhibited undercoverage at
n=50 (92.3%, 95% CI: [90.8, 93.7]). BCa intervals were also 3-5% narrower
on average, indicating improved efficiency without compromising coverage."
```

### Step 6: Visualization

```r
library(ggplot2)

# Read analysis results
coverage <- read.csv("coverage_summary.csv")

# Reshape for plotting
coverage_long <- coverage %>%
  select(n, theta, coverage_perc, coverage_bca) %>%
  tidyr::pivot_longer(
    cols = c(coverage_perc, coverage_bca),
    names_to = "method",
    values_to = "coverage"
  ) %>%
  mutate(
    method = recode(method,
      coverage_perc = "Percentile",
      coverage_bca = "BCa"
    )
  )

# Coverage plot
ggplot(coverage_long, aes(x = n, y = coverage, color = method, linetype = method)) +
  geom_hline(yintercept = 0.95, linetype = "dashed", color = "gray40") +
  geom_line(size = 1) +
  geom_point(size = 2) +
  facet_wrap(~ theta, labeller = label_both) +
  scale_x_continuous(trans = "log10", breaks = c(50, 100, 200, 500)) +
  scale_y_continuous(limits = c(0.90, 0.96), breaks = seq(0.90, 0.96, 0.02)) +
  scale_color_manual(values = c("Percentile" = "#E69F00", "BCa" = "#56B4E9")) +
  labs(
    title = "Coverage Rates of Bootstrap CIs for Indirect Effects",
    subtitle = "Nominal level: 0.95 (dashed line)",
    x = "Sample Size",
    y = "Coverage Rate",
    color = "Method",
    linetype = "Method"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    legend.position = "bottom",
    panel.grid.minor = element_blank()
  )

ggsave("coverage_plot.pdf", width = 10, height = 6)
```

### Checkpoint

- Coverage rates computed for 32 scenarios
- BCa superior in small samples
- Both methods acceptable for n ≥ 200
- Publication-ready figures generated
- Methods and results text drafted

---

## Example 2: Power Analysis

**Research Question:** What sample size is needed to achieve 80% power for detecting an indirect effect of 0.15?

### Scenario

You're planning a mediation study and need to justify your sample size to a grant reviewer. You'll simulate power across sample sizes 50 to 500.

### Step 1: Design

```bash
/research:simulation:design "Determine sample size needed to achieve 80% power for detecting indirect effect of 0.15 in mediation analysis, varying sample sizes 50 to 500 in steps of 25"
```

### Generated Design

```markdown
## Power Analysis for Mediation Study

### Objective
Estimate the relationship between sample size and statistical power for
detecting an indirect effect of θ = 0.15 using bootstrap percentile CIs.

### Data Generation

**True Parameters:**
- Indirect effect: θ = αβ = 0.15 (small-to-medium effect)
- Path coefficients: α = 0.39, β = 0.39 (balanced mediation)
- Error variances: σ²_M = σ²_Y = 1

**Sample Sizes:**
n ∈ {50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500}

### Statistical Test

**Null Hypothesis:** H₀: θ = 0 (no indirect effect)
**Alternative:** H₁: θ = 0.15
**Significance Level:** α = 0.05 (two-tailed)
**Test:** Reject H₀ if 95% bootstrap percentile CI excludes 0

### Performance Metric

**Power:** Proportion of replications where 95% CI excludes 0

**Target:** 80% power (conventional threshold for adequacy)

### Design

| Factor | Levels | Total |
|--------|--------|-------|
| Sample size | 13 values (50-500) | 13 |
| Replications | 5,000 per sample size | 5,000 |

**Total datasets:** 65,000

### Expected Results

Based on asymptotic approximations, we expect:
- n = 100: ~50% power
- n = 150: ~70% power
- n = 200: ~85% power

The simulation will provide empirical power estimates to validate these predictions.
```

### Step 2: Implement

```r
# =============================================================================
# Power Analysis for Mediation
# =============================================================================

library(dplyr)
library(boot)
library(parallel)

set.seed(20260131)

# Sample size grid
sample_sizes <- c(seq(50, 200, by = 25), seq(250, 500, by = 50))

# True parameters
alpha <- 0.39
beta <- 0.39
theta_true <- alpha * beta  # 0.15

# -----------------------------------------------------------------------------
# Simulation function
# -----------------------------------------------------------------------------
power_simulation <- function(n, alpha, beta, B = 5000) {
  # Generate data
  Z <- rbinom(n, 1, 0.5)
  M <- alpha * Z + rnorm(n)
  Y <- beta * M + rnorm(n)

  data <- data.frame(Z = Z, M = M, Y = Y)

  # Bootstrap
  indirect <- function(data, indices) {
    d <- data[indices, ]
    fit_m <- lm(M ~ Z, data = d)
    fit_y <- lm(Y ~ M + Z, data = d)
    coef(fit_m)["Z"] * coef(fit_y)["M"]
  }

  boot_res <- boot(data, indirect, R = B)
  ci <- tryCatch(
    boot.ci(boot_res, type = "perc")$percent[4:5],
    error = function(e) c(NA, NA)
  )

  # Test: CI excludes 0?
  reject <- !is.na(ci[1]) && (ci[1] > 0 || ci[2] < 0)

  list(ci_lower = ci[1], ci_upper = ci[2], reject = reject)
}

# -----------------------------------------------------------------------------
# Run power analysis
# -----------------------------------------------------------------------------
run_power_analysis <- function(sample_sizes, reps = 5000, cores = 8) {
  design <- expand.grid(
    n = sample_sizes,
    rep = 1:reps
  )

  cat(sprintf("Power analysis: %d scenarios\n", nrow(design)))

  results <- mclapply(1:nrow(design), function(i) {
    row <- design[i, ]
    res <- power_simulation(n = row$n, alpha = alpha, beta = beta)

    data.frame(
      n = row$n,
      rep = row$rep,
      ci_lower = res$ci_lower,
      ci_upper = res$ci_upper,
      reject = res$reject
    )
  }, mc.cores = cores)

  bind_rows(results)
}

# Execute
power_results <- run_power_analysis(sample_sizes, reps = 5000, cores = 8)
saveRDS(power_results, "power_results.rds")

# Compute power
power_summary <- power_results %>%
  group_by(n) %>%
  summarize(
    power = mean(reject, na.rm = TRUE),
    power_se = sqrt(power * (1 - power) / n()),
    .groups = "drop"
  )

write.csv(power_summary, "power_summary.csv", row.names = FALSE)
print(power_summary)
```

### Step 3: Analyze

```bash
/research:simulation:analysis power_results.csv
```

### Results

```markdown
## Power Analysis Results

### Power by Sample Size

| n   | Power | 95% CI           | Adequate? |
|-----|-------|------------------|-----------|
| 50  | 0.32  | [0.31, 0.33]     | No        |
| 75  | 0.47  | [0.46, 0.48]     | No        |
| 100 | 0.61  | [0.60, 0.62]     | No        |
| 125 | 0.72  | [0.71, 0.73]     | No        |
| 150 | 0.80  | [0.79, 0.81]     | **Yes**   |
| 175 | 0.86  | [0.85, 0.87]     | Yes       |
| 200 | 0.90  | [0.89, 0.91]     | Yes       |
| 250 | 0.95  | [0.94, 0.96]     | Yes       |
| 300 | 0.97  | [0.97, 0.98]     | Yes       |

### Recommendation

**Minimum sample size: n = 150** to achieve 80% power for detecting
indirect effect θ = 0.15 with α = 0.05.

**Conservative choice: n = 175** provides 86% power, buffering against
participant attrition (~15% dropout still yields n ≈ 150).

### Grant Justification Text

"Based on Monte Carlo simulation with 5,000 replications per sample size,
we determined that n = 150 provides 80% power (95% CI: [0.79, 0.81]) to
detect an indirect effect of 0.15 using bootstrap percentile confidence
intervals at α = 0.05. Accounting for anticipated 15% attrition, we will
recruit n = 175 participants."
```

### Visualization

```r
# Power curve
ggplot(power_summary, aes(x = n, y = power)) +
  geom_hline(yintercept = 0.80, linetype = "dashed", color = "red") +
  geom_line(size = 1, color = "#56B4E9") +
  geom_point(size = 2, color = "#56B4E9") +
  geom_ribbon(aes(ymin = power - 1.96*power_se, ymax = power + 1.96*power_se),
              alpha = 0.2, fill = "#56B4E9") +
  annotate("text", x = 150, y = 0.75, label = "n = 150\nPower = 0.80",
           hjust = 0, vjust = 1, size = 4) +
  scale_y_continuous(limits = c(0, 1), breaks = seq(0, 1, 0.1)) +
  labs(
    title = "Statistical Power for Detecting Indirect Effect θ = 0.15",
    subtitle = "Bootstrap percentile CI, α = 0.05, 5000 replications",
    x = "Sample Size",
    y = "Power"
  ) +
  theme_minimal()

ggsave("power_curve.pdf", width = 8, height = 5)
```

---

## Example 3: Robustness Study

**Research Question:** How robust is the bootstrap method to non-normality and heteroscedasticity?

### Scenario

Reviewers question your normality assumption. You'll evaluate method performance under various distributional violations.

### Step 1: Design

```bash
/research:simulation:design "Evaluate robustness of bootstrap mediation intervals to non-normality and heteroscedasticity. Compare performance under normal, skewed (chi-square), and heavy-tailed (t3) error distributions with homoscedastic and heteroscedastic variance structures"
```

### Generated Design

```markdown
## Robustness Study: Distributional Violations

### Research Question
Does bootstrap CI performance degrade under non-normal and heteroscedastic errors?

### Data Generation

**Base Model:**
- M = αZ + ε_M
- Y = βM + γZ + ε_Y

**Design Factors:**

1. **Error Distribution:**
   - Normal: ε ~ N(0, 1)
   - Right-skewed: ε ~ (χ²₃ - 3)/√6 (standardized)
   - Heavy-tailed: ε ~ t₃/√3 (standardized to variance 1)

2. **Variance Structure:**
   - Homoscedastic: Var(ε|Z) = 1
   - Heteroscedastic: Var(ε|Z) = 1 + 0.5Z (50% variance inflation)

3. **Sample Size:**
   - n ∈ {100, 300} (moderate and large)

4. **Effect Size:**
   - θ = 0.3 (medium indirect effect)

### Factorial Design

| Distribution | Variance     | n   | Scenarios |
|--------------|-------------|-----|-----------|
| Normal       | Homoscedastic| 100 | 1         |
| Normal       | Homoscedastic| 300 | 1         |
| Normal       | Heteroscedastic| 100 | 1       |
| Normal       | Heteroscedastic| 300 | 1       |
| Chi-square   | Homoscedastic| 100 | 1         |
| Chi-square   | Homoscedastic| 300 | 1         |
| Chi-square   | Heteroscedastic| 100 | 1       |
| Chi-square   | Heteroscedastic| 300 | 1       |
| t₃           | Homoscedastic| 100 | 1         |
| t₃           | Homoscedastic| 300 | 1         |
| t₃           | Heteroscedastic| 100 | 1       |
| t₃           | Heteroscedastic| 300 | 1       |

**Total:** 12 scenarios × 5,000 reps = 60,000 datasets

### Performance Metrics

- Coverage rate (target: 0.95)
- CI width (compare to Normal baseline)
- Bias of point estimate
- MSE of point estimate
```

### Step 2: Implementation

```r
# =============================================================================
# Robustness Study
# =============================================================================

library(dplyr)
library(boot)
library(parallel)

# -----------------------------------------------------------------------------
# Data generation functions
# -----------------------------------------------------------------------------

# Generate errors from specified distribution
generate_errors <- function(n, distribution = "normal") {
  switch(distribution,
    "normal" = rnorm(n, 0, 1),
    "chisq" = (rchisq(n, df = 3) - 3) / sqrt(6),  # Standardized
    "t3" = rt(n, df = 3) / sqrt(3),               # Standardized to var=1
    stop("Unknown distribution")
  )
}

# Add heteroscedasticity
add_heteroscedasticity <- function(errors, Z, heteroscedastic = FALSE) {
  if (!heteroscedastic) {
    return(errors)
  }

  # Variance inflation factor based on treatment
  variance_factor <- sqrt(1 + 0.5 * Z)
  errors * variance_factor
}

# Simulate one dataset with specified conditions
simulate_robustness <- function(n, alpha = 0.52, beta = 0.58,
                                distribution = "normal",
                                heteroscedastic = FALSE,
                                B = 5000) {
  # Treatment
  Z <- rbinom(n, 1, 0.5)

  # Mediator
  epsilon_M <- generate_errors(n, distribution)
  epsilon_M <- add_heteroscedasticity(epsilon_M, Z, heteroscedastic)
  M <- alpha * Z + epsilon_M

  # Outcome
  epsilon_Y <- generate_errors(n, distribution)
  epsilon_Y <- add_heteroscedasticity(epsilon_Y, Z, heteroscedastic)
  Y <- beta * M + epsilon_Y

  # Bootstrap
  data <- data.frame(Z = Z, M = M, Y = Y)

  indirect <- function(data, indices) {
    d <- data[indices, ]
    fit_m <- lm(M ~ Z, data = d)
    fit_y <- lm(Y ~ M + Z, data = d)
    coef(fit_m)["Z"] * coef(fit_y)["M"]
  }

  boot_res <- boot(data, indirect, R = B)
  ci <- tryCatch(
    boot.ci(boot_res, type = "perc")$percent[4:5],
    error = function(e) c(NA, NA)
  )

  list(
    estimate = boot_res$t0,
    ci_lower = ci[1],
    ci_upper = ci[2]
  )
}

# -----------------------------------------------------------------------------
# Run robustness study
# -----------------------------------------------------------------------------
run_robustness_study <- function(reps = 5000, cores = 8) {
  # Design grid
  design <- expand.grid(
    distribution = c("normal", "chisq", "t3"),
    heteroscedastic = c(FALSE, TRUE),
    n = c(100, 300),
    rep = 1:reps,
    stringsAsFactors = FALSE
  )

  cat(sprintf("Robustness study: %d conditions\n", nrow(design)))

  results <- mclapply(1:nrow(design), function(i) {
    row <- design[i, ]

    res <- simulate_robustness(
      n = row$n,
      distribution = row$distribution,
      heteroscedastic = row$heteroscedastic
    )

    data.frame(
      distribution = row$distribution,
      heteroscedastic = row$heteroscedastic,
      n = row$n,
      rep = row$rep,
      estimate = res$estimate,
      ci_lower = res$ci_lower,
      ci_upper = res$ci_upper,
      stringsAsFactors = FALSE
    )
  }, mc.cores = cores)

  bind_rows(results)
}

# Execute
theta_true <- 0.52 * 0.58  # ≈ 0.30

robust_results <- run_robustness_study(reps = 5000, cores = 8)
saveRDS(robust_results, "robustness_results.rds")

# Compute metrics
robust_summary <- robust_results %>%
  group_by(distribution, heteroscedastic, n) %>%
  summarize(
    coverage = mean(theta_true >= ci_lower & theta_true <= ci_upper, na.rm = TRUE),
    width = mean(ci_upper - ci_lower, na.rm = TRUE),
    bias = mean(estimate - theta_true, na.rm = TRUE),
    mse = mean((estimate - theta_true)^2, na.rm = TRUE),
    .groups = "drop"
  )

write.csv(robust_summary, "robustness_summary.csv", row.names = FALSE)
print(robust_summary)
```

### Step 3: Analyze

```bash
/research:simulation:analysis robustness_results.csv
```

### Results

```markdown
## Robustness Analysis Results

### Coverage Rates

| Distribution | Heteroscedastic | n=100 | n=300 |
|--------------|----------------|-------|-------|
| Normal       | No             | 0.949 | 0.951 |
| Normal       | Yes            | 0.942 | 0.948 |
| Chi-square   | No             | 0.946 | 0.950 |
| Chi-square   | Yes            | 0.938 | 0.947 |
| t₃           | No             | 0.943 | 0.949 |
| t₃           | Yes            | 0.936 | 0.946 |

### CI Width (relative to Normal/Homoscedastic)

| Distribution | Heteroscedastic | n=100 | n=300 |
|--------------|----------------|-------|-------|
| Normal       | No             | 1.00  | 1.00  |
| Normal       | Yes            | 1.12  | 1.10  |
| Chi-square   | No             | 1.05  | 1.03  |
| Chi-square   | Yes            | 1.18  | 1.13  |
| t₃           | No             | 1.23  | 1.15  |
| t₃           | Yes            | 1.34  | 1.24  |

### Bias

All conditions showed negligible bias (< 0.01 in absolute value).

### Key Findings

1. **Robustness to distribution:**
   - Coverage rates remain near nominal (93.6%-95.1%) across all distributions
   - Bootstrap is robust to moderate departures from normality

2. **Heteroscedasticity impact:**
   - Slight undercoverage (1-2 percentage points) with heteroscedastic errors
   - Wider CIs compensate partially but not fully

3. **Heavy tails:**
   - t₃ errors increase width by 23% (n=100) to 15% (n=300)
   - Reduced precision but maintained validity

4. **Sample size:**
   - Larger n reduces heteroscedasticity impact
   - All conditions converge to nominal at n=300

### Recommendation

Bootstrap CIs are robust to non-normality and mild heteroscedasticity.
For heavy-tailed distributions or strong heteroscedasticity, consider:
- Larger sample sizes (n ≥ 200)
- Robust SE estimates
- Transformation of skewed variables
```

---

## Example 4: Method Comparison

**Research Question:** Which mediation estimator has lowest MSE: product-of-coefficients, difference-in-coefficients, or SEM?

### Design

```bash
/research:simulation:design "Compare bias and efficiency of product-of-coefficients vs difference-in-coefficients vs structural equation model approaches for mediation analysis across sample sizes 50, 100, 200, 500"
```

### Implementation

```r
# =============================================================================
# Method Comparison: Three Mediation Estimators
# =============================================================================

library(dplyr)
library(lavaan)
library(parallel)

# Three estimators
estimate_indirect_product <- function(Z, M, Y) {
  fit_m <- lm(M ~ Z)
  fit_y <- lm(Y ~ M + Z)
  coef(fit_m)["Z"] * coef(fit_y)["M"]
}

estimate_indirect_difference <- function(Z, M, Y) {
  fit_total <- lm(Y ~ Z)
  fit_direct <- lm(Y ~ M + Z)
  coef(fit_total)["Z"] - coef(fit_direct)["Z"]
}

estimate_indirect_sem <- function(Z, M, Y) {
  data <- data.frame(Z = Z, M = M, Y = Y)

  model <- '
    M ~ a*Z
    Y ~ b*M + c*Z
    indirect := a*b
  '

  fit <- sem(model, data = data, se = "none")  # Point estimate only
  parameterEstimates(fit)[parameterEstimates(fit)$label == "indirect", "est"]
}

# Simulation
simulate_methods <- function(n, theta = 0.3, alpha = 0.55, beta = theta/alpha) {
  Z <- rbinom(n, 1, 0.5)
  M <- alpha * Z + rnorm(n)
  Y <- beta * M + rnorm(n)

  tryCatch({
    list(
      product = estimate_indirect_product(Z, M, Y),
      difference = estimate_indirect_difference(Z, M, Y),
      sem = estimate_indirect_sem(Z, M, Y)
    )
  }, error = function(e) {
    list(product = NA, difference = NA, sem = NA)
  })
}

# Full simulation
run_method_comparison <- function(reps = 5000, cores = 8) {
  design <- expand.grid(
    n = c(50, 100, 200, 500),
    theta = 0.3,
    rep = 1:reps
  )

  results <- mclapply(1:nrow(design), function(i) {
    row <- design[i, ]
    res <- simulate_methods(n = row$n, theta = row$theta)

    data.frame(
      n = row$n,
      theta = row$theta,
      rep = row$rep,
      product = res$product,
      difference = res$difference,
      sem = res$sem
    )
  }, mc.cores = cores)

  bind_rows(results)
}

# Execute
method_results <- run_method_comparison(reps = 5000, cores = 8)
saveRDS(method_results, "method_comparison.rds")

# Compute performance
theta_true <- 0.3

method_summary <- method_results %>%
  group_by(n) %>%
  summarize(
    bias_product = mean(product - theta_true, na.rm = TRUE),
    bias_difference = mean(difference - theta_true, na.rm = TRUE),
    bias_sem = mean(sem - theta_true, na.rm = TRUE),

    mse_product = mean((product - theta_true)^2, na.rm = TRUE),
    mse_difference = mean((difference - theta_true)^2, na.rm = TRUE),
    mse_sem = mean((sem - theta_true)^2, na.rm = TRUE),

    .groups = "drop"
  )

print(method_summary)
```

### Results

```markdown
## Method Comparison Results

### Bias

| n   | Product | Difference | SEM   |
|-----|---------|------------|-------|
| 50  | -0.002  | -0.003     | -0.002|
| 100 | -0.001  | -0.001     | -0.001|
| 200 |  0.000  |  0.000     |  0.000|
| 500 |  0.000  |  0.000     |  0.000|

All methods are essentially unbiased.

### Mean Squared Error (×1000)

| n   | Product | Difference | SEM   | Best    |
|-----|---------|------------|-------|---------|
| 50  | 12.3    | 14.7       | 12.1  | **SEM** |
| 100 |  5.8    |  6.9       |  5.7  | **SEM** |
| 200 |  2.7    |  3.2       |  2.7  | Tie     |
| 500 |  1.1    |  1.3       |  1.1  | Tie     |

### Efficiency (relative to Product)

| n   | Product | Difference | SEM  |
|-----|---------|------------|------|
| 50  | 1.00    | 0.84       | 1.02 |
| 100 | 1.00    | 0.84       | 1.02 |
| 200 | 1.00    | 0.84       | 1.00 |
| 500 | 1.00    | 0.85       | 1.00 |

### Recommendations

1. **Difference-in-coefficients** is less efficient (~15% larger MSE)
2. **Product and SEM** are equivalent in large samples
3. **SEM** slightly better in small samples (n < 200)
4. **Default:** Use product-of-coefficients (simplest, equivalent performance)
```

---

## Example 5: Factorial Design

**Research Question:** 2×3×4 factorial to understand interactions

### Design

```bash
/research:simulation:design "2x3x4 factorial design comparing methods (product-of-coefficients vs difference-in-coefficients) × distributions (normal, chi-square, t3) × sample sizes (50, 100, 200, 500) for mediation estimation"
```

### Implementation Notes

```r
# Factorial design
design <- expand.grid(
  method = c("product", "difference"),
  distribution = c("normal", "chisq", "t3"),
  n = c(50, 100, 200, 500),
  rep = 1:5000
)

# 2 × 3 × 4 × 5000 = 120,000 datasets
# Runtime: ~16 hours on 8 cores
```

### Analysis Strategy

```markdown
## Factorial Analysis Plan

### Main Effects
- Method: product vs difference (averaged over distributions and n)
- Distribution: normal vs chisq vs t3 (averaged over methods and n)
- Sample size: 50/100/200/500 (averaged over methods and distributions)

### Two-Way Interactions
- Method × Distribution: Is method ranking distribution-dependent?
- Method × Sample size: Does gap narrow with larger n?
- Distribution × Sample size: Do distributions converge?

### Three-Way Interaction
- Method × Distribution × Sample size: Complex interaction?

### Visualization
- Heatmap of MSE across all 24 conditions
- Interaction plots for key comparisons
- Ranking plots showing method preference by condition
```

---

## Complete Workflow: Publication-Ready Study

Full end-to-end example from design to manuscript submission.

### Research Question

"Are bootstrap confidence intervals for mediation effects robust to violations of normality?"

### Step 1: Design

```bash
/research:simulation:design "Comprehensive evaluation of bootstrap percentile and BCa confidence intervals for indirect effects under normal and non-normal (skewed, heavy-tailed) error distributions, with sample sizes 50-500"
```

### Step 2: Implementation (with best practices)

```r
# =============================================================================
# Publication-Quality Simulation Study
# Author: [Your Name]
# Date: 2026-01-31
# Description: Robustness of bootstrap CIs for mediation
# =============================================================================

# ---- Setup ----
library(dplyr)
library(boot)
library(parallel)
library(here)  # For reproducible paths

# Set seed for reproducibility
set.seed(20260131)

# Create output directories
dir.create(here("results"), showWarnings = FALSE)
dir.create(here("figures"), showWarnings = FALSE)

# ---- Parameters ----
N_REPS <- 5000
N_BOOT <- 5000
N_CORES <- 8

SAMPLE_SIZES <- c(50, 75, 100, 150, 200, 300, 500)
DISTRIBUTIONS <- c("normal", "chisq3", "t3")
METHODS <- c("percentile", "bca")

ALPHA <- 0.39
BETA <- 0.39
THETA_TRUE <- ALPHA * BETA  # 0.15

# ---- Data Generation ----
generate_data <- function(n, alpha, beta, distribution) {
  Z <- rbinom(n, 1, 0.5)

  # Generate errors based on distribution
  eps_M <- switch(distribution,
    "normal" = rnorm(n),
    "chisq3" = (rchisq(n, 3) - 3) / sqrt(6),
    "t3" = rt(n, 3) / sqrt(3)
  )

  eps_Y <- switch(distribution,
    "normal" = rnorm(n),
    "chisq3" = (rchisq(n, 3) - 3) / sqrt(6),
    "t3" = rt(n, 3) / sqrt(3)
  )

  M <- alpha * Z + eps_M
  Y <- beta * M + eps_Y

  data.frame(Z = Z, M = M, Y = Y)
}

# ---- Estimation ----
compute_ci <- function(data, method, B) {
  indirect <- function(data, indices) {
    d <- data[indices, ]
    fit_m <- lm(M ~ Z, data = d)
    fit_y <- lm(Y ~ M + Z, data = d)
    coef(fit_m)["Z"] * coef(fit_y)["M"]
  }

  boot_res <- boot(data, indirect, R = B)

  ci <- tryCatch({
    if (method == "percentile") {
      boot.ci(boot_res, type = "perc")$percent[4:5]
    } else {
      boot.ci(boot_res, type = "bca")$bca[4:5]
    }
  }, error = function(e) c(NA, NA))

  list(
    estimate = boot_res$t0,
    ci_lower = ci[1],
    ci_upper = ci[2]
  )
}

# ---- Simulation ----
run_one_replication <- function(n, distribution, method) {
  data <- generate_data(n, ALPHA, BETA, distribution)
  res <- compute_ci(data, method, N_BOOT)

  data.frame(
    n = n,
    distribution = distribution,
    method = method,
    estimate = res$estimate,
    ci_lower = res$ci_lower,
    ci_upper = res$ci_upper,
    stringsAsFactors = FALSE
  )
}

# Design grid
design <- expand.grid(
  n = SAMPLE_SIZES,
  distribution = DISTRIBUTIONS,
  method = METHODS,
  rep = 1:N_REPS,
  stringsAsFactors = FALSE
)

cat(sprintf("Total replications: %d\n", nrow(design)))
cat(sprintf("Estimated runtime: %.1f hours\n", nrow(design) * 2 / 3600 / N_CORES))

# Run simulation with progress tracking
start_time <- Sys.time()

results <- mclapply(1:nrow(design), function(i) {
  row <- design[i, ]

  # Progress logging
  if (i %% 1000 == 0) {
    elapsed <- as.numeric(difftime(Sys.time(), start_time, units = "hours"))
    pct_done <- i / nrow(design)
    eta <- elapsed / pct_done * (1 - pct_done)
    cat(sprintf("[%s] %.1f%% complete, ETA: %.1fh\n",
                Sys.time(), pct_done * 100, eta))
  }

  # Run replication
  res <- run_one_replication(
    n = row$n,
    distribution = row$distribution,
    method = row$method
  )

  cbind(rep = row$rep, res)
}, mc.cores = N_CORES)

# Combine and save
all_results <- bind_rows(results)
saveRDS(all_results, here("results", "simulation_results.rds"))
write.csv(all_results, here("results", "simulation_results.csv"), row.names = FALSE)

end_time <- Sys.time()
cat(sprintf("Total runtime: %.2f hours\n",
            as.numeric(difftime(end_time, start_time, units = "hours"))))

# ---- Performance Metrics ----
performance <- all_results %>%
  group_by(n, distribution, method) %>%
  summarize(
    coverage = mean((ci_lower <= THETA_TRUE) & (THETA_TRUE <= ci_upper), na.rm = TRUE),
    width = mean(ci_upper - ci_lower, na.rm = TRUE),
    bias = mean(estimate - THETA_TRUE, na.rm = TRUE),
    mse = mean((estimate - THETA_TRUE)^2, na.rm = TRUE),
    n_valid = sum(!is.na(ci_lower)),
    .groups = "drop"
  )

write.csv(performance, here("results", "performance_summary.csv"), row.names = FALSE)
print(performance)

# ---- Generate Figures ----
library(ggplot2)

# Coverage plot
p1 <- ggplot(performance, aes(x = n, y = coverage, color = method, linetype = distribution)) +
  geom_hline(yintercept = 0.95, linetype = "dashed", color = "gray40") +
  geom_line(size = 1) +
  geom_point(size = 2) +
  scale_x_continuous(trans = "log10") +
  scale_y_continuous(limits = c(0.90, 0.96)) +
  labs(
    title = "Coverage Rates of Bootstrap CIs Across Distributions",
    x = "Sample Size",
    y = "Coverage Rate",
    color = "Method",
    linetype = "Distribution"
  ) +
  theme_minimal()

ggsave(here("figures", "coverage_plot.pdf"), p1, width = 10, height = 6)

# Width plot
p2 <- ggplot(performance, aes(x = n, y = width, color = method, linetype = distribution)) +
  geom_line(size = 1) +
  geom_point(size = 2) +
  scale_x_continuous(trans = "log10") +
  labs(
    title = "Average CI Width Across Distributions",
    x = "Sample Size",
    y = "Average Width"
  ) +
  theme_minimal()

ggsave(here("figures", "width_plot.pdf"), p2, width = 10, height = 6)
```

### Step 3: Analyze Results

```bash
/research:simulation:analysis results/simulation_results.csv
```

### Step 4: Write Methods Section

```bash
/research:manuscript:methods "$(cat results/performance_summary.csv)"
```

### Generated Methods Text

```markdown
## Monte Carlo Simulation Study

### Simulation Design

We conducted a Monte Carlo simulation study to evaluate the finite-sample
performance of bootstrap confidence intervals for indirect effects under
violations of normality. We compared two bootstrap methods (percentile and
BCa) across three error distributions (normal, right-skewed, heavy-tailed)
and seven sample sizes (n = 50, 75, 100, 150, 200, 300, 500).

### Data Generating Process

Data were generated from a simple mediation model:

$$
M_i = \alpha Z_i + \epsilon_{Mi}
$$
$$
Y_i = \beta M_i + \epsilon_{Yi}
$$

where $Z_i \sim \text{Bernoulli}(0.5)$ is the treatment indicator, and the
true indirect effect is $\theta = \alpha \beta = 0.15$ (corresponding to
$\alpha = \beta = 0.39$).

We varied the error distributions:

1. **Normal**: $\epsilon \sim N(0, 1)$
2. **Right-skewed**: $\epsilon \sim (\chi^2_3 - 3)/\sqrt{6}$ (standardized chi-square)
3. **Heavy-tailed**: $\epsilon \sim t_3/\sqrt{3}$ (standardized Student's t)

All error distributions were standardized to have mean 0 and variance 1 for
comparability.

### Confidence Interval Methods

We computed 95% bootstrap confidence intervals using two methods:

1. **Percentile Method**: The 95% CI is the interval between the 2.5th and
   97.5th percentiles of the bootstrap distribution based on B = 5,000
   bootstrap samples.

2. **BCa Method**: The bias-corrected and accelerated (BCa) method adjusts
   the percentile method to account for bias and skewness in the bootstrap
   distribution (Efron & Tibshirani, 1993).

### Performance Metrics

Performance was evaluated using 5,000 replications per scenario (total:
210,000 datasets). We computed:

- **Coverage rate**: Proportion of 95% CIs containing the true θ = 0.15
- **Average width**: Mean CI length (precision)
- **Bias**: Mean estimation error
- **MSE**: Mean squared error

Monte Carlo standard errors for coverage rates were approximately 0.003,
providing adequate precision for detecting departures from nominal coverage.

### Implementation

All simulations were implemented in R 4.3.1 using the boot package (version 1.3-28)
for bootstrap resampling. Computations were parallelized across 8 cores using
the parallel package. Code is available at [repository URL].
```

### Step 5: Write Results Section

```bash
/research:manuscript:results "$(cat results/performance_summary.csv)"
```

### Generated Results Text

```markdown
## Results

### Coverage Performance

Table 1 presents coverage rates across all conditions. Under normality, both
methods achieved near-nominal coverage across all sample sizes (percentile:
0.942-0.951; BCa: 0.948-0.952). The percentile method exhibited slight
undercoverage at n = 50 (0.923, 95% CI: [0.910, 0.936]), while BCa maintained
adequate coverage (0.947, 95% CI: [0.936, 0.958]).

**[Table 1: Coverage rates by method, distribution, and sample size]**

Under right-skewed errors (χ²₃), both methods remained robust, with coverage
rates between 0.936 and 0.952 across all sample sizes. The percentile method
showed marginal undercoverage at n = 50 (0.936), while BCa achieved 0.946.

Heavy-tailed errors (t₃) produced similar patterns. Coverage rates ranged
from 0.928 to 0.951, with BCa consistently outperforming percentile by 1-2
percentage points in small samples.

### Precision and Efficiency

Figure 1 displays average CI widths. Under normality, widths decreased with
sample size as expected (n = 50: 0.24; n = 500: 0.08). BCa intervals were
3-5% narrower than percentile intervals while maintaining better coverage.

**[Figure 1: Average CI width by method, distribution, and sample size]**

Distributional departures increased CI width. Heavy-tailed errors (t₃)
inflated widths by 15-25% relative to normal errors, reflecting increased
sampling variability. Skewed errors (χ²₃) had minimal impact (< 5% increase).

### Bias and Mean Squared Error

All estimators exhibited negligible bias (|bias| < 0.01) across conditions,
confirming theoretical expectations. MSE decreased with sample size at the
expected rate of O(1/n).

### Recommendations

Based on these results, we recommend:

1. **BCa intervals** for n < 200, particularly under distributional violations
2. **Either method** for n ≥ 200, as performance converges
3. **Caution** with heavy-tailed errors: consider robust methods or larger samples

The percentile method's simplicity and speed make it attractive for large
samples, while BCa's improved small-sample performance justifies its added
computational cost when n < 200.
```

### Step 6: Create Supplementary Materials

```r
# Generate supplementary tables
library(knitr)
library(kableExtra)

# Detailed coverage table
coverage_table <- performance %>%
  select(n, distribution, method, coverage) %>%
  tidyr::pivot_wider(names_from = method, values_from = coverage) %>%
  mutate(
    difference = bca - percentile,
    across(c(percentile, bca, difference), ~sprintf("%.3f", .))
  )

kable(coverage_table, format = "latex", booktabs = TRUE,
      caption = "Coverage rates by sample size, distribution, and method") %>%
  kable_styling(latex_options = c("striped", "hold_position")) %>%
  writeLines(here("results", "table_coverage.tex"))

# Supplementary figures: bias, MSE, etc.
# [Additional visualization code]
```

### Step 7: Archive and Share

```bash
# Create reproducible archive
mkdir -p simulation_archive/
cp -r results/ figures/ simulation_archive/
cp bootstrap_simulation.R simulation_archive/code.R
tar -czf simulation_study_archive.tar.gz simulation_archive/

# Upload to repository
git add simulation_archive/
git commit -m "Add simulation study archive for manuscript"
git push
```

### Checkpoint: Publication Ready

- Simulation completed (210,000 datasets)
- Performance metrics computed and validated
- Methods section drafted
- Results section drafted
- Tables and figures generated
- Code archived for reproducibility
- Ready for manuscript integration

---

## Computational Strategies

Best practices for efficient large-scale simulations.

### Parallel Processing

```r
# ---- Basic Parallelization ----
library(parallel)

# Detect cores
n_cores <- detectCores() - 1  # Leave one for OS

# Simple parallel loop
results <- mclapply(1:nrow(design), function(i) {
  # Simulation code
}, mc.cores = n_cores)

# ---- Advanced: Load Balancing ----
library(foreach)
library(doParallel)

cl <- makeCluster(n_cores)
registerDoParallel(cl)

results <- foreach(i = 1:nrow(design), .combine = rbind) %dopar% {
  # Simulation code
}

stopCluster(cl)

# ---- Cluster Computing (Slurm) ----
# Array job: run 100 jobs, each with 5,000 reps
# slurm_array.sh:
#!/bin/bash
#SBATCH --array=1-100
#SBATCH --cpus-per-task=8
#SBATCH --time=4:00:00

Rscript simulation.R --scenario $SLURM_ARRAY_TASK_ID --reps 5000
```

### Progress Tracking

```r
# ---- Simple Progress Bar ----
library(progress)

pb <- progress_bar$new(
  format = "[:bar] :percent ETA: :eta",
  total = nrow(design),
  clear = FALSE,
  width = 60
)

for (i in 1:nrow(design)) {
  # Simulation
  pb$tick()
}

# ---- Progress with Logging ----
log_progress <- function(i, total, start_time) {
  if (i %% 100 == 0) {
    elapsed <- difftime(Sys.time(), start_time, units = "hours")
    pct <- i / total
    eta <- elapsed / pct * (1 - pct)

    msg <- sprintf("[%s] %d/%d (%.1f%%) | Elapsed: %.1fh | ETA: %.1fh",
                   Sys.time(), i, total, pct * 100, elapsed, eta)
    cat(msg, "\n", file = "simulation.log", append = TRUE)
  }
}

# ---- Intermediate Saves ----
# Save every 1,000 reps to avoid data loss
if (i %% 1000 == 0) {
  saveRDS(results[1:i], sprintf("checkpoint_%06d.rds", i))
}
```

### Optimization Techniques

```r
# ---- Vectorization ----
# BAD: Loop over observations
for (i in 1:n) {
  y[i] <- alpha * x[i] + rnorm(1)
}

# GOOD: Vectorized
y <- alpha * x + rnorm(n)

# ---- Pre-allocation ----
# BAD: Growing vector
results <- c()
for (i in 1:10000) {
  results <- c(results, simulation(i))  # Slow!
}

# GOOD: Pre-allocate
results <- vector("list", 10000)
for (i in 1:10000) {
  results[[i]] <- simulation(i)
}

# ---- Caching ----
# Cache expensive computations
library(memoise)

expensive_function <- memoise(function(x) {
  Sys.sleep(1)  # Simulate slow computation
  x^2
})

# First call: slow
expensive_function(5)

# Second call: instant (cached)
expensive_function(5)

# ---- Profiling ----
# Find bottlenecks
library(profvis)

profvis({
  # Your simulation code
})
```

### Memory Management

```r
# ---- Monitor Memory Usage ----
library(pryr)

mem_used()  # Current memory usage
mem_change({ simulation_code })  # Memory delta

# ---- Reduce Memory Footprint ----
# Store only essential results
results <- mclapply(1:10000, function(i) {
  # Full simulation output
  full_output <- run_simulation(i)

  # Extract only needed metrics
  list(
    coverage = full_output$ci_covers,
    width = full_output$ci_width
  )
  # Discard full_output (garbage collected)
}, mc.cores = 8)

# ---- Batch Processing ----
# For very large simulations, process in batches
n_batches <- 10
batch_size <- nrow(design) / n_batches

for (batch in 1:n_batches) {
  start <- (batch - 1) * batch_size + 1
  end <- batch * batch_size

  batch_results <- run_simulation(design[start:end, ])
  saveRDS(batch_results, sprintf("batch_%02d.rds", batch))

  rm(batch_results)  # Free memory
  gc()  # Garbage collect
}

# Combine batches
all_results <- lapply(1:n_batches, function(i) {
  readRDS(sprintf("batch_%02d.rds", i))
}) %>% bind_rows()
```

---

## Visualization Gallery

Publication-ready figures for simulation results.

### Coverage Heatmap

```r
library(ggplot2)
library(viridis)

# Coverage heatmap
ggplot(performance, aes(x = n, y = distribution, fill = coverage)) +
  geom_tile(color = "white", size = 0.5) +
  geom_text(aes(label = sprintf("%.3f", coverage)), color = "white", size = 3) +
  facet_wrap(~ method) +
  scale_fill_viridis(
    option = "plasma",
    limits = c(0.92, 0.96),
    breaks = seq(0.92, 0.96, 0.01),
    guide = guide_colorbar(barwidth = 15, barheight = 0.5)
  ) +
  scale_x_continuous(trans = "log10", breaks = c(50, 100, 200, 500)) +
  labs(
    title = "Coverage Rate Heatmap",
    subtitle = "Nominal level: 0.95",
    x = "Sample Size",
    y = "Error Distribution",
    fill = "Coverage"
  ) +
  theme_minimal() +
  theme(
    legend.position = "bottom",
    panel.grid = element_blank()
  )

ggsave("coverage_heatmap.pdf", width = 10, height = 5)
```

### Bias-Variance Tradeoff Plot

```r
# Bias vs variance scatter
performance_summary <- performance %>%
  mutate(
    variance = mse - bias^2,
    method_dist = paste(method, distribution, sep = "_")
  )

ggplot(performance_summary, aes(x = bias^2, y = variance, color = method, shape = distribution)) +
  geom_abline(slope = 1, intercept = 0, linetype = "dashed", color = "gray50") +
  geom_point(size = 3, alpha = 0.7) +
  facet_wrap(~ n, scales = "free", labeller = label_both) +
  scale_color_brewer(palette = "Set1") +
  labs(
    title = "Bias-Variance Decomposition of MSE",
    subtitle = "Points below diagonal have MSE dominated by variance",
    x = expression(Bias^2),
    y = "Variance",
    color = "Method",
    shape = "Distribution"
  ) +
  theme_minimal()

ggsave("bias_variance_tradeoff.pdf", width = 12, height = 8)
```

### CI Width Distribution

```r
# Violin plot of CI widths
ggplot(all_results, aes(x = factor(n), y = ci_upper - ci_lower, fill = method)) +
  geom_violin(alpha = 0.6, position = position_dodge(width = 0.9)) +
  geom_boxplot(width = 0.1, position = position_dodge(width = 0.9), outlier.size = 0.5) +
  facet_wrap(~ distribution) +
  scale_fill_brewer(palette = "Set2") +
  labs(
    title = "Distribution of CI Widths",
    x = "Sample Size",
    y = "CI Width",
    fill = "Method"
  ) +
  theme_minimal()

ggsave("ci_width_distribution.pdf", width = 12, height = 6)
```

### Method Ranking Plot

```r
# Rank methods by MSE within each condition
performance_ranked <- performance %>%
  group_by(n, distribution) %>%
  mutate(rank = rank(mse)) %>%
  ungroup()

ggplot(performance_ranked, aes(x = n, y = rank, color = method)) +
  geom_line(size = 1) +
  geom_point(size = 2) +
  facet_wrap(~ distribution) +
  scale_y_continuous(breaks = 1:3, labels = c("1st", "2nd", "3rd")) +
  scale_x_continuous(trans = "log10") +
  labs(
    title = "Method Performance Ranking by MSE",
    subtitle = "Lower rank = better performance",
    x = "Sample Size",
    y = "Rank",
    color = "Method"
  ) +
  theme_minimal()

ggsave("method_ranking.pdf", width = 10, height = 5)
```

---

## Real Research Examples

Examples from published simulation studies in statistical methodology.

### Example: Preacher & Hayes (2008) - Mediation Bootstrap

**Citation:** Preacher, K. J., & Hayes, A. F. (2008). Asymptotic and resampling
strategies for assessing and comparing indirect effects in multiple mediator
models. *Behavior Research Methods, 40*(3), 879-891.

**Research Question:** How do bootstrap CIs compare to Sobel test and
distribution-of-the-product methods for mediation analysis?

**Design:**

- 3 methods × 4 sample sizes × 5 effect sizes × 5,000 reps
- Total: 300,000 datasets

**Key Finding:** Bootstrap had superior coverage and power, especially for
small effects and small samples.

**Replication with Scholar:**

```bash
/research:simulation:design "Replicate Preacher & Hayes (2008): Compare bootstrap percentile CI, Sobel test, and distribution-of-the-product method for indirect effects across sample sizes 50, 100, 200, 500 and effect sizes 0.0, 0.14, 0.26, 0.39, 0.59"
```

### Example: MacKinnon et al. (2004) - Power Comparison

**Citation:** MacKinnon, D. P., Lockwood, C. M., & Williams, J. (2004).
Confidence limits for the indirect effect: Distribution of the product and
resampling methods. *Multivariate Behavioral Research, 39*(1), 99-128.

**Research Question:** Which method has best power for detecting mediation?

**Design:**

- 14 methods including joint significance, Sobel, bootstrap
- Sample sizes 50-200
- Various effect size combinations

**Key Finding:** Bootstrap and distribution-of-product had highest power.

**Replication:**

```bash
/research:simulation:design "Replicate MacKinnon et al. (2004): Compare power of joint significance test, Sobel test, bootstrap percentile, bootstrap BCa, and distribution-of-the-product for mediation detection across sample sizes 50, 100, 200"
```

### Example: Your Own Study Template

```bash
# Step 1: Literature gap analysis
/research:lit-gap "bootstrap confidence intervals mediation analysis"

# Step 2: Design study addressing gap
/research:simulation:design "RESEARCH QUESTION FROM GAP ANALYSIS"

# Step 3: Implement and run
# [R code]

# Step 4: Analyze
/research:simulation:analysis results.csv

# Step 5: Write manuscript
/research:manuscript:methods "SIMULATION DESIGN"
/research:manuscript:results "ANALYSIS OUTPUT"

# Step 6: Prepare for submission
/research:manuscript:proof "MATHEMATICAL DERIVATIONS"
```

---

## Additional Resources

### Recommended Reading

1. **Morris, T. P., White, I. R., & Crowther, M. J. (2019).** Using simulation
   studies to evaluate statistical methods. *Statistics in Medicine, 38*(11),
   2074-2102.

2. **Burton, A., Altman, D. G., Royston, P., & Holder, R. L. (2006).** The
   design of simulation studies in medical statistics. *Statistics in Medicine,
   25*(24), 4279-4292.

3. **Efron, B., & Tibshirani, R. J. (1993).** *An introduction to the bootstrap.*
   Chapman & Hall/CRC.

### Software

- **R packages:** `boot`, `parallel`, `future`, `furrr`
- **Python:** `numpy`, `scipy`, `joblib`, `dask`
- **High-performance:** `Rcpp`, `Julia`, `numba`

### Templates

All code examples are available at:

- GitHub: [Data-Wise/scholar-examples](https://github.com/Data-Wise/scholar-examples)
- Zenodo: [DOI:10.5281/zenodo.XXXXXXX](https://zenodo.org/)

---

**Document Info:**

- **Created:** 2026-01-31
- **Target:** Scholar v2.6.0+
- **Length:** ~2,000 lines
- **Examples:** 5 complete workflows + 1 publication-ready study
