# Simulation Commands Reference

Complete reference for Scholar's Monte Carlo simulation study commands with computational focus and real code examples.

## Navigation

- [Overview](#overview)
- [Commands](#commands)
  - [/research:simulation:design](#researchsimulationdesign)
  - [/research:simulation:analysis](#researchsimulationanalysis)
- [Performance Metrics](#performance-metrics)
- [Computational Optimization](#computational-optimization)
- [R/Python Integration](#rpython-integration)
- [Design Patterns](#design-patterns)
- [Publication Workflow](#publication-workflow)

---

## Overview

Simulation studies (Monte Carlo studies) are computational experiments that evaluate the performance of statistical methods under controlled conditions. Scholar provides two specialized commands for designing and analyzing simulation studies:

### When to Use Simulation Studies

Simulations are essential for:

- **Method Comparison:** Compare performance of multiple estimators or tests
- **Sample Size Planning:** Determine adequate sample size for target power
- **Robustness Checking:** Verify method performance under assumption violations
- **Type I Error Control:** Verify nominal error rates under null hypothesis
- **Bias Assessment:** Evaluate unbiasedness of estimators
- **Coverage Analysis:** Check if confidence intervals achieve nominal coverage
- **Power Analysis:** Evaluate statistical power across effect sizes
- **Algorithm Validation:** Test new or modified statistical procedures

### Simulation Study Workflow

```
Research Question
        ↓
    Design Study → Define data generation, methods, metrics
        ↓
Implementation → Write code, test with pilots
        ↓
     Execution → Run full simulation with proper bookkeeping
        ↓
    Analysis → Calculate metrics, visualize results
        ↓
   Publication → Document methods, report findings
```

---

## Commands

### /research:simulation:design

Design comprehensive Monte Carlo simulation studies with complete specifications.

**Syntax:**

```bash
/research:simulation:design "simulation description"
/research:simulation:design "Compare bootstrap methods for mediation"
/research:simulation:design "Evaluate Type I error of Wald test under null"
```

#### Purpose

Creates a detailed, publication-ready simulation study design document that specifies:

- Data generating process
- Estimation methods to compare
- Simulation scenarios (factorial design)
- Number of replications with justification
- Performance metrics
- Computational considerations
- R/Python code template

#### Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `description` | String | Research question/purpose for simulation | "Compare bias of MLE vs robust estimator under contaminated normal" |

#### Output Structure

**A complete simulation design includes:**

**1. Research Question**

- Clear statement of what simulation answers
- Why comparison/evaluation is important

**2. Data Generation**

- **Parameters:** Sample sizes, effect sizes, distributions
- **Model:** Mathematical specification of data generating process
- **Example values:** Concrete ranges for each factor

**3. Estimation Methods**

- **Method 1:** Description and procedure
- **Method 2:** Alternative approach
- **Comparison:** What distinguishes methods

**4. Performance Metrics**

- **Bias:** Systematic error of estimator
- **RMSE:** Overall accuracy measure
- **Coverage:** Confidence interval performance
- **Power:** Hypothesis test performance
- **Efficiency:** Computational speed

**5. Design Factors**

- **Sample size:** Levels to test (e.g., 50, 100, 200, 500)
- **Effect size:** Null and alternative values
- **Distribution:** Normal, skewed, heavy-tailed, etc.
- **Factorial combinations:** Total number of scenarios

**6. Replications**

- **Recommended number:** Based on target precision
- **Justification:** Monte Carlo error calculation
- **Pilot design:** How to test before full run

**7. Implementation Plan**

- **Phase 1 (Pilot):** Minimal replication for code testing
- **Phase 2 (Full):** Complete study with proper parallelization
- **Computational resources:** CPU, memory, time estimates

**8. Code Template**

- **R/Python starter code:** Ready to implement
- **Simulation function:** Core computation
- **Execution script:** Orchestrate full study

---

#### Real Examples

##### Example 1: Bootstrap Confidence Interval Methods

**Command:**

```bash
/research:simulation:design "Compare bootstrap percentile vs BCa confidence intervals for mediation effects across sample sizes 50, 100, 200, 500 with effect sizes 0, 0.1, 0.3, 0.5"
```

**Generated Design (excerpt):**

```markdown
## Simulation Design: Bootstrap CI Methods for Mediation

### Research Question

Compare the performance of bootstrap percentile and BCa (bias-corrected
accelerated) confidence intervals for indirect effects in mediation
analysis, evaluating coverage probability and interval width across
varying sample sizes and effect sizes.

### Data Generating Process

**Model Specification:**
$$M_i = \alpha Z_i + \epsilon_{Mi}$$
$$Y_i = \beta M_i + \gamma Z_i + \epsilon_{Yi}$$

where:
- $Z_i \in \{0,1\}$ is binary treatment
- $M_i$ is mediator (continuous)
- $Y_i$ is outcome (continuous)
- $\epsilon_{Mi}, \epsilon_{Yi} \sim N(0,1)$ are errors
- Indirect effect: $\theta = \alpha \times \beta$

**Parameter Settings:**
- $\alpha = 0.3$ (treatment → mediator)
- $\beta$ varies to achieve target indirect effect
- $\gamma = 0.1$ (direct effect)
- Sample size: n ∈ {50, 100, 200, 500}
- True indirect effect: θ ∈ {0, 0.1, 0.3, 0.5}

### Estimation Methods

**Method 1: Bootstrap Percentile CI**
- 5,000 bootstrap resamples with replacement
- 95% CI from 2.5th and 97.5th percentiles
- Simple to compute, requires only resampling

**Method 2: Bootstrap BCa CI**
- Bias correction: $z_0 = \Phi^{-1}(P(\hat{\theta}^* < \hat{\theta}))$
- Acceleration: Jackknife-based adjustment
- Correction formula applied to percentiles
- More complex but better coverage properties

**Indirect Effect Estimation:** Both methods use $\hat{\theta} = \hat{\alpha} \times \hat{\beta}$

### Performance Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Coverage | $\frac{1}{R}\sum_r I(\theta \in \text{CI}_r)$ | 0.95 |
| Avg Width | $\frac{1}{R}\sum_r (\text{UL}_r - \text{LL}_r)$ | Minimal |
| Lower-tail Error | $\frac{1}{R}\sum_r I(\theta < \text{LL}_r)$ | ~0.025 |
| Upper-tail Error | $\frac{1}{R}\sum_r I(\theta > \text{UL}_r)$ | ~0.025 |

### Factorial Design

| Factor | Levels | Number |
|--------|--------|--------|
| Sample size | 50, 100, 200, 500 | 4 |
| Effect size | 0, 0.1, 0.3, 0.5 | 4 |
| CI method | Percentile, BCa | 2 |
| **Total scenarios** | | **32** |

### Number of Replications

- **Target:** 5,000 replications per scenario
- **Justification:** Monte Carlo SE for coverage ≈ √(0.95×0.05/5000) ≈ 0.003
  - Allows detection of coverage deviations > 1% with reasonable precision
- **Pilot:** 1,000 replications for n=100, effect=0.3 only (faster iteration)

### R Code Template

```r
library(boot)
library(parallel)

# Core simulation function
simulate_ci <- function(n, alpha = 0.3, beta, method = "percentile") {
  # Generate data
  z <- rbinom(n, 1, 0.5)
  m <- alpha * z + rnorm(n)
  y <- beta * m + 0.1 * z + rnorm(n)

  # Estimate coefficients via regression
  fit_m <- lm(m ~ z)
  fit_y <- lm(y ~ m + z)

  alpha_hat <- coef(fit_m)["z"]
  beta_hat <- coef(fit_y)["m"]
  theta_hat <- alpha_hat * beta_hat

  # Bootstrap confidence interval
  boot_fun <- function(data, idx) {
    z_b <- z[idx]
    m_b <- m[idx]
    y_b <- y[idx]

    fit_m_b <- lm(m_b ~ z_b)
    fit_y_b <- lm(y_b ~ m_b + z_b)

    coef(fit_m_b)["z_b"] * coef(fit_y_b)["m_b"]
  }

  boot_res <- boot(1:n, boot_fun, R = 5000)

  # Extract CI
  if (method == "percentile") {
    ci <- quantile(boot_res$t, c(0.025, 0.975))
  } else if (method == "bca") {
    bca_res <- boot.ci(boot_res, type = "bca")
    ci <- bca_res$bca[4:5]
  }

  return(list(estimate = theta_hat, ci = ci))
}

# Scenario setup
scenarios <- expand.grid(
  n = c(50, 100, 200, 500),
  theta = c(0, 0.1, 0.3, 0.5),
  method = c("percentile", "bca")
)

# Run simulation (parallel)
results <- mclapply(1:nrow(scenarios), function(i) {
  scenario <- scenarios[i, ]

  # Map theta to beta (for given alpha=0.3)
  beta <- scenario$theta / 0.3

  replicate(5000, {
    res <- simulate_ci(scenario$n, beta = beta, method = scenario$method)
    c(
      estimate = res$estimate,
      ci_lower = res$ci[1],
      ci_upper = res$ci[2]
    )
  }, simplify = "matrix")
}, mc.cores = 8)

# Organize results
results_df <- bind_rows(lapply(1:nrow(scenarios), function(i) {
  res_matrix <- results[[i]]
  data.frame(
    scenario_id = i,
    n = scenarios$n[i],
    theta = scenarios$theta[i],
    method = scenarios$method[i],
    estimate = res_matrix["estimate", ],
    ci_lower = res_matrix["ci_lower", ],
    ci_upper = res_matrix["ci_upper", ]
  )
}))

# Save results
saveRDS(results_df, "simulation_results.rds")
```

### Analysis Plan

1. **Coverage Analysis**
   - Calculate proportion of CIs containing true θ
   - Target: 0.95 (nominal level)
   - Acceptable range: 0.93-0.97 (accounting for Monte Carlo error)

2. **Width Analysis**
   - Average CI width by scenario
   - Narrower CIs preferred (better precision)
   - Compare coverage vs. width trade-off

3. **Error Balance**
   - Proportion of CIs below true θ
   - Proportion of CIs above true θ
   - Should be approximately equal (symmetric coverage)

4. **Visualizations**
   - Coverage vs. sample size (by method and effect size)
   - CI width vs. sample size
   - Coverage comparison plot (method by sample size)

### Recommendations

1. Start with **pilot study** (n=100, 1,000 reps) to validate code
2. Run full study using **parallel processing** (8+ cores)
3. Save intermediate results every 1,000 replications
4. Monitor computational progress with progress bars
5. Check for convergence failures and investigate

```

---

##### Example 2: Type I Error and Power Analysis

**Command:**
```bash
/research:simulation:design "Evaluate Type I error rate and power of Wald test for indirect effects under varying distributions (normal, t(5), skewed)"
```

**Generated Key Sections (excerpt):**

```markdown
## Simulation Design: Type I Error and Power of Mediation Test

### Research Question

Evaluate whether the Wald test for indirect effects maintains nominal
Type I error rate under null hypothesis (θ = 0) and achieves adequate
power under true effects. Compare performance across different outcome
distributions.

### Data Generating Process

**Parameters:**
- Sample size: n ∈ {50, 100, 200, 500}
- True indirect effect: θ ∈ {0, 0.1, 0.3, 0.5} (0 = null, others = alternatives)
- Distribution (outcome errors):
  - Normal: ε_Y ~ N(0, 1)
  - Heavy-tailed: ε_Y ~ t(5) [standardized]
  - Skewed: ε_Y ~ exp(1) - 1 [mean-centered]

### Performance Metrics

| Condition | Metric | Formula | Target |
|-----------|--------|---------|--------|
| **Type I Error** | Null rejection rate | P(reject H₀ \| θ = 0) | α = 0.05 |
| **Power** | Alternative rejection rate | P(reject H₀ \| θ ≠ 0) | 0.80 |
| **Sensitivity** | Type S error | P(effect sign wrong) | < 0.05 |

### Scenarios

| Factor | Levels |
|--------|--------|
| Type I Error | n=100, θ=0 (null condition) |
| Power | n=50-500, θ=0.1-0.5 (alternatives) |
| Distribution | Normal, t(5), Skewed |
| **Total scenarios** | 3 × 3 + (4 × 3) × 3 = 45 |

### Replications

- **Type I Error:** 10,000 reps (more precision needed for error rates)
- **Power:** 5,000 reps per scenario
- **Justification:**
  - Type I error Monte Carlo SE = √(0.05 × 0.95 / 10000) ≈ 0.002
  - Power at 0.80: SE ≈ √(0.80 × 0.20 / 5000) ≈ 0.006
```

---

##### Example 3: Method Comparison Study

**Command:**

```bash
/research:simulation:design "Compare bias and MSE of product-of-coefficients vs difference-in-coefficients for estimating mediation effects in three-variable system"
```

**Generated Key Sections (excerpt):**

```markdown
## Simulation Design: Mediation Method Comparison

### Research Question

Compare the bias, MSE, and coverage properties of two popular methods
for estimating indirect effects in mediation analysis:
1. Product-of-coefficients (α̂ × β̂)
2. Difference-in-coefficients (total - direct effect)

### Estimation Methods

**Method 1: Product-of-Coefficients (POC)**
$$\hat{\theta}_{POC} = \hat{\alpha} \times \hat{\beta}$$

**Method 2: Difference-in-Coefficients (DOC)**
$$\hat{\theta}_{DOC} = (\hat{\gamma}_{total} - \hat{\gamma}_{direct})$$

where γ_total = total effect, γ_direct = direct effect

### Performance Comparison

| Aspect | POC | DOC |
|--------|-----|-----|
| **Bias** | Often biased (nonlinear transformation) | Unbiased |
| **Variance** | Smaller in small samples | Larger in small samples |
| **MSE** | Trade-off: bias × variance | Often larger |
| **Interpretation** | Product of paths | Difference of effects |
| **CI Methods** | Bootstrap preferred | Delta method OK |
| **Computation** | Simple | Simple |

### Design Factors

| Factor | Levels |
|--------|--------|
| Sample size | 50, 100, 200, 500 |
| Effect size | Small (0.2), Medium (0.5), Large (0.8) |
| Correlation structure | Uncorrelated, Moderate (r=0.3), High (r=0.7) |

### Metrics

- **Bias:** E[θ̂] - θ
- **MSE:** E[(θ̂ - θ)²]
- **RMSE:** √MSE
- **Relative Efficiency:** MSE_POC / MSE_DOC

### Recommendations

1. **Small samples (n < 100):** POC preferred (lower RMSE)
2. **Large samples (n > 200):** Either method acceptable
3. **Confidence intervals:** Always use bootstrap (better coverage)
4. **Report both:** Use POC for point estimate, DOC for robustness check
```

---

#### Best Practices for Design

**1. Research Question Clarity**

```bash
# Too vague:
/research:simulation:design "Bootstrap simulation"

# Better:
/research:simulation:design "Compare coverage of bootstrap percentile vs BCa for mediation CI"
```

**2. Specific Parameters**

```bash
# Too general:
/research:simulation:design "Study sample size effects"

# Better:
/research:simulation:design "Evaluate power of t-test across sample sizes 30, 50, 100, 200 for detecting effect size d=0.5"
```

**3. Include Realistic Scenarios**

```bash
# Unrealistic:
/research:simulation:design "Test method under normal data only"

# Realistic:
/research:simulation:design "Test method under normal, skewed, and heavy-tailed distributions"
```

**4. Define Clear Stopping Rules**

```bash
# Vague:
/research:simulation:design "Run simulation until convergence"

# Clear:
/research:simulation:design "Run 5000 replications per scenario, stopping early if convergence failures exceed 10"
```

---

### /research:simulation:analysis

Analyze Monte Carlo simulation results with performance metrics, visualizations, and interpretation guidance.

**Syntax:**

```bash
/research:simulation:analysis results.csv
/research:simulation:analysis results/simulation_output.rds
/research:simulation:analysis data/monte_carlo_results.csv
```

#### Purpose

Transforms raw simulation output into publication-ready analysis including:

- Performance metric calculations (bias, MSE, RMSE, coverage, power)
- Summary tables by scenario
- Visualization R code (ggplot2)
- Statistical comparisons between methods
- Interpretation guidance
- Recommendations for method selection

#### Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `file` | String | Path to results CSV or RDS | `results/simulation_results.csv` |

#### Input Data Format

**Required Columns:**

```csv
scenario_id,method,n,effect_size,replicate,estimate,se,ci_lower,ci_upper,pvalue
1,method1,100,0.5,1,0.48,0.12,0.24,0.72,0.034
1,method1,100,0.5,2,0.52,0.11,0.30,0.74,0.021
1,method2,100,0.5,1,0.50,0.14,0.23,0.77,0.045
...
```

**Flexible Column Names:**

- Estimator names: `estimate`, `theta_hat`, `coef`, `result`
- Standard error: `se`, `std_error`, `sigma_hat`
- Confidence bounds: `ci_lower`/`ci_upper`, `lower_bound`/`upper_bound`, `ll`/`ul`
- P-values: `pvalue`, `p_val`, `adj_pvalue`

**Optional Columns:**

```
true_value      - True parameter for bias calculation
convergence     - Did algorithm converge? (0/1)
time_seconds    - Computation time per replication
replicate_id    - Unique ID per replication
group           - Grouping variable
```

---

#### Output Structure

**A complete simulation analysis includes:**

**1. Summary Tables**

**Performance Summary:**

```markdown
| Method | n | Bias | RMSE | Coverage | Avg Width |
|--------|---|------|------|----------|-----------|
| Method1| 100| -0.01| 0.18 | 0.947 | 0.81 |
| Method2| 100|  0.03| 0.22 | 0.932 | 0.95 |
```

**Bias by Scenario:**

```markdown
| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| M1 | -0.02 | -0.01 | 0.00 | 0.00 |
| M2 |  0.05 |  0.03 | 0.01 | 0.00 |
```

**Coverage Rates (nominal = 0.95):**

```markdown
| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| M1 | 0.93 | 0.94 | 0.95 | 0.95 |
| M2 | 0.89 | 0.92 | 0.94 | 0.95 |
```

**2. Performance Metrics**

All standard metrics calculated with formulas:

- **Bias:** $\text{Bias}(\hat{\theta}) = \frac{1}{R}\sum_{r=1}^R \hat{\theta}_r - \theta$
- **Variance:** $\text{Var}(\hat{\theta}) = \frac{1}{R}\sum_{r=1}^R (\hat{\theta}_r - \bar{\theta})^2$
- **MSE:** $\text{MSE}(\hat{\theta}) = \frac{1}{R}\sum_{r=1}^R (\hat{\theta}_r - \theta)^2$
- **RMSE:** $\sqrt{\text{MSE}(\hat{\theta})}$
- **Coverage:** $\text{Coverage} = \frac{1}{R}\sum_{r=1}^R I(\theta \in \text{CI}_r)$
- **Power:** $\text{Power} = \frac{1}{R}\sum_{r=1}^R I(p_r < \alpha)$
- **Type I Error:** $\text{Type I} = \frac{1}{R}\sum_{r=1}^R I(p_r < \alpha | H_0 \text{ true})$

**3. Method Comparisons**

Statistical comparison of methods:

```markdown
### Method Comparison (Sample Size n=100)

**RMSE Comparison:**
- Method 1: 0.183 [95% CI: 0.179, 0.187]
- Method 2: 0.217 [95% CI: 0.212, 0.223]
- Difference: 0.034 (Method 1 superior)

**Coverage Adequacy:**
- Method 1: 0.948 (within acceptable range [0.93, 0.97])
- Method 2: 0.924 (below nominal, investigate)

**Winner:** Method 1 (better RMSE and coverage)
```

**4. Visualizations with Code**

Ready-to-run R code for publication-quality plots:

```r
library(ggplot2)
library(dplyr)

# Bias plot
results %>%
  group_by(method, n) %>%
  summarize(
    bias = mean(estimate - true_value),
    se = sd(estimate - true_value) / sqrt(n())
  ) %>%
  ggplot(aes(x = n, y = bias, color = method)) +
  geom_line(size = 1) +
  geom_point(size = 3) +
  geom_hline(yintercept = 0, linetype = "dashed", color = "gray") +
  scale_x_log10(breaks = c(50, 100, 200, 500)) +
  labs(
    title = "Bias by Sample Size and Method",
    x = "Sample Size (log scale)",
    y = "Bias: E[θ̂] - θ",
    color = "Method"
  ) +
  theme_minimal() +
  theme(legend.position = "bottom")

# Coverage plot
results %>%
  group_by(method, n) %>%
  summarize(
    coverage = mean(ci_lower <= true_value & ci_upper >= true_value),
    se = sqrt(coverage * (1 - coverage) / n())
  ) %>%
  ggplot(aes(x = n, y = coverage, color = method)) +
  geom_line(size = 1) +
  geom_point(size = 3) +
  geom_hline(yintercept = 0.95, linetype = "dashed", color = "gray") +
  geom_ribbon(aes(ymin = coverage - 1.96*se, ymax = coverage + 1.96*se,
                  fill = method), alpha = 0.1, color = NA) +
  scale_y_continuous(limits = c(0.88, 0.98)) +
  labs(
    title = "Coverage Rates by Sample Size",
    x = "Sample Size",
    y = "Coverage Probability",
    color = "Method"
  ) +
  theme_minimal()

# RMSE comparison
results %>%
  group_by(method, n, effect_size) %>%
  summarize(rmse = sqrt(mean((estimate - true_value)^2))) %>%
  ggplot(aes(x = n, y = rmse, color = method)) +
  facet_wrap(~effect_size, labeller = labeller(effect_size = c(
    "0" = "Null (θ=0)",
    "0.3" = "Small (θ=0.3)",
    "0.5" = "Medium (θ=0.5)"
  ))) +
  geom_line() +
  geom_point() +
  scale_x_log10() +
  labs(
    title = "RMSE by Sample Size, Effect Size, and Method",
    x = "Sample Size (log scale)",
    y = "RMSE"
  ) +
  theme_minimal() +
  theme(legend.position = "bottom")
```

**5. Interpretation Guidance**

Expert interpretation of results:

```markdown
### Key Findings

1. **Bias Patterns**
   - Both methods show unbiased estimates at large sample sizes
   - Method 2 has upward bias in small samples (n < 100)
   - Bias decreases proportionally to n⁻¹

2. **Efficiency (MSE)**
   - Method 1 is more efficient overall (lower RMSE)
   - Efficiency gain is greatest for small to medium samples (n < 200)
   - At n = 500, methods are comparable

3. **Coverage Adequacy**
   - Method 1 achieves nominal coverage for n ≥ 100
   - Method 2 under-covers for n < 200 (Type I error too high)
   - Both achieve nominal coverage for n ≥ 200

4. **Practical Recommendations**
   - **Use Method 1** for all practical purposes
   - **Use Method 2** only for robustness checks with large samples
   - **Always use bootstrap CI** for both methods
```

---

#### Real Examples

##### Example 1: Bootstrap CI Methods Analysis

**Input File:** `results_bootstrap_ci.csv` (10,000 rows)

**Command:**

```bash
/research:simulation:analysis results_bootstrap_ci.csv
```

**Generated Analysis (excerpt):**

```markdown
## Simulation Results: Bootstrap CI Methods

### Design Summary

- **Study:** Compare bootstrap percentile vs BCa for mediation
- **Scenarios:** 32 (4 sample sizes × 4 effect sizes × 2 methods)
- **Replications:** 5,000 per scenario (160,000 total)
- **Total observations:** 160,000

### Performance Summary

**Bias by Method:**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Percentile | -0.008 | -0.003 | 0.001 | 0.000 |
| BCa | -0.002 | -0.001 | 0.000 | 0.000 |

**Root Mean Squared Error:**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Percentile | 0.287 | 0.191 | 0.132 | 0.087 |
| BCa | 0.289 | 0.193 | 0.134 | 0.088 |

**Coverage Rates (nominal = 0.95):**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Percentile | 0.921 | 0.938 | 0.947 | 0.950 |
| BCa | 0.932 | 0.945 | 0.951 | 0.952 |

**Average Confidence Interval Width:**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Percentile | 1.146 | 0.762 | 0.531 | 0.347 |
| BCa | 1.178 | 0.794 | 0.553 | 0.363 |

### Interpretation

#### Bias Analysis
- Both methods show minimal bias across all sample sizes
- Bias decreases toward zero as expected with larger samples
- BCa is slightly less biased, particularly in small samples
- **Conclusion:** Both methods suitable from bias perspective

#### Coverage Analysis
- **Percentile method:** Under-covers when n ≤ 100 (coverage ≈ 0.92-0.94)
- **BCa method:** Achieves nominal coverage for n ≥ 50 (coverage ≥ 0.93)
- BCa maintains nominal coverage better in small samples
- Coverage error (nominal - actual) for percentile:
  - n=50: -0.029 (too liberal)
  - n=100: -0.012 (slightly liberal)
  - n=200: -0.003 (acceptable)

#### Efficiency Analysis
- RMSE nearly identical between methods (difference < 2%)
- Width of BCa slightly larger (by ~3-4%)
- Trade-off: BCa pays small precision cost for better coverage
- **Value gained:** Correct coverage at smaller sample sizes

#### Power and Precision
- Precision increases proportionally to n⁻¹ for both methods
- For a study requiring n=100, percentile achieves only 93.8% coverage
- For same sample size, BCa achieves 94.5% coverage (nominally correct)

### Recommendations

**Primary recommendation:** **Use bootstrap BCa method**

**Rationale:**
1. **Coverage:** Maintains nominal 95% coverage for n ≥ 50
2. **Robustness:** Better performance in small samples
3. **Complexity:** Only marginally more complex than percentile
4. **Precision:** No meaningful efficiency loss

**Alternative:** Percentile method acceptable only if n ≥ 200

**For practitioners:**
```r
# Recommended workflow
library(boot)

# Estimate indirect effect with BCa CI
boot_res <- boot(data, function(d, i) {
  # Mediation analysis on bootstrap sample
  # Return indirect effect estimate
}, R = 5000)

# Extract BCa CI
ci <- boot.ci(boot_res, type = "bca")$bca[4:5]

# Report effect with CI
sprintf("Indirect effect: %.3f [95%% CI: %.3f, %.3f]",
        boot_res$t0, ci[1], ci[2])
```

### Visualization Code

```r
library(ggplot2)
library(dplyr)
library(tidyr)

# Coverage by sample size and method
coverage_data <- results %>%
  group_by(method, n) %>%
  summarize(
    coverage = mean(ci_lower <= true_value & ci_upper >= true_value),
    se = sqrt(coverage * (1 - coverage) / n()),
    lower = coverage - 1.96 * se,
    upper = coverage + 1.96 * se
  )

ggplot(coverage_data, aes(x = n, y = coverage, color = method, shape = method)) +
  geom_line(size = 1.2) +
  geom_point(size = 3) +
  geom_hline(yintercept = 0.95, linetype = "dashed", color = "red",
             size = 1, alpha = 0.5, label = "Nominal") +
  geom_ribbon(aes(ymin = lower, ymax = upper, fill = method),
              alpha = 0.15, color = NA) +
  scale_y_continuous(
    limits = c(0.90, 0.96),
    labels = scales::percent_format(accuracy = 1)
  ) +
  scale_x_continuous(breaks = c(50, 100, 200, 500)) +
  labs(
    title = "Coverage Rates: Bootstrap Percentile vs BCa",
    x = "Sample Size (n)",
    y = "Coverage Probability",
    color = "Method",
    shape = "Method"
  ) +
  theme_minimal() +
  theme(
    legend.position = "bottom",
    plot.title = element_text(size = 14, face = "bold"),
    panel.grid.minor = element_blank()
  )
```

---

##### Example 2: Type I Error and Power Analysis

**Input File:** `results_type1_power.csv`

**Command:**

```bash
/research:simulation:analysis results_type1_power.csv
```

**Generated Analysis (excerpt):**

```markdown
## Simulation Results: Type I Error and Power

### Study Design

- **Methods:** Wald test for indirect effect
- **Distributions:** Normal, t(5), Skewed
- **Type I Error scenarios:** n ∈ {100, 200, 500}, θ = 0
- **Power scenarios:** n ∈ {50, 100, 200, 500}, θ ∈ {0.1, 0.3, 0.5}
- **Replications:** 10,000 (Type I), 5,000 (Power)

### Type I Error Results

**Overall Type I Error Rate (nominal α = 0.05):**

| Distribution | Rate | 95% CI | Assessment |
|-------------|------|--------|------------|
| Normal | 0.0512 | [0.0489, 0.0535] | ✓ Acceptable |
| t(5) | 0.0548 | [0.0524, 0.0573] | ✓ Acceptable |
| Skewed | 0.0629 | [0.0604, 0.0655] | ✗ Inflated |

**By Sample Size and Distribution:**

| Distribution | n=100 | n=200 | n=500 |
|-------------|-------|-------|-------|
| Normal | 0.0506 | 0.0509 | 0.0510 |
| t(5) | 0.0531 | 0.0550 | 0.0562 |
| Skewed | 0.0712 | 0.0633 | 0.0551 |

**Interpretation:**
- Test maintains nominal Type I error under normality
- Robust to heavy tails (t(5) distribution)
- **Inflated error under skewness** when n < 200
  - Suggests violation of normality assumption
  - Recommendation: Use permutation test for skewed data

### Power Analysis

**Power by Effect Size and Sample Size (Normal distribution):**

```

Effect Size θ = 0.1 (Small)
├─ n = 50:   Power = 0.124 (under-powered)
├─ n = 100:  Power = 0.238 (under-powered)
├─ n = 200:  Power = 0.432 (under-powered)
└─ n = 500:  Power = 0.798 (adequate)

Effect Size θ = 0.3 (Medium)
├─ n = 50:   Power = 0.651 (adequate)
├─ n = 100:  Power = 0.878 (good)
├─ n = 200:  Power = 0.981 (excellent)
└─ n = 500:  Power = 0.9998 (ceiling)

Effect Size θ = 0.5 (Large)
├─ n = 50:   Power = 0.962 (excellent)
├─ n = 100:  Power = 0.9997 (ceiling)
├─ n = 200:  Power = 1.000 (ceiling)
└─ n = 500:  Power = 1.000 (ceiling)

```

**Sample Size Recommendations:**

For 80% power (with α = 0.05):
- Small effect (θ = 0.1): n ≈ 480 required
- Medium effect (θ = 0.3): n ≈ 65 required
- Large effect (θ = 0.5): n ≈ 45 required

### Distribution Robustness

**Power by Distribution (n = 100, θ = 0.3):**

| Distribution | Power |
|-------------|-------|
| Normal | 0.878 |
| t(5) | 0.845 |
| Skewed | 0.812 |

**Conclusion:** Power decreases ~3-4% per distribution deviation from normality

### Recommendations

1. **Sample Size:** Plan for n ≥ 65 to detect medium effects (θ = 0.3) with 80% power
2. **Assumption Checking:** Always check for skewness; if present, increase sample size by ~10-15%
3. **Robustness:** Consider permutation test if normality is violated
```

---

##### Example 3: Method Comparison Analysis

**Input File:** `results_methods.csv`

**Command:**

```bash
/research:simulation:analysis results_methods.csv
```

**Generated Key Tables (excerpt):**

```markdown
## Simulation Results: Estimation Method Comparison

### Performance Summary

**Bias (expected zero):**

| Method | Small Effect | Medium Effect | Large Effect |
|--------|--------------|---------------|--------------|
| POC* | -0.018 | -0.042 | -0.081 |
| DOC† | 0.001 | 0.000 | -0.002 |

*Product-of-coefficients; †Difference-in-coefficients

**Root Mean Squared Error (lower is better):**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| POC | 0.287 | 0.198 | 0.137 | 0.085 |
| DOC | 0.315 | 0.221 | 0.156 | 0.098 |

**Relative Efficiency (POC / DOC):**

| Sample Size | Efficiency | Interpretation |
|------------|-----------|-----------------|
| n=50 | 0.84 | POC is 16% more efficient |
| n=100 | 0.80 | POC is 20% more efficient |
| n=200 | 0.88 | POC is 12% more efficient |
| n=500 | 0.87 | POC is 13% more efficient |

### Winner: Product-of-Coefficients

**Recommendation:** Use POC for point estimates in all scenarios.
For confidence intervals, use bootstrap (works well with both methods).
```

---

#### Best Practices for Analysis

**1. Check Data Quality**

```r
# Before analysis
summary(results)  # Check for NAs, outliers
mean(results$convergence)  # Should be near 1.0
sum(is.na(results$estimate))  # Should be 0 or small
```

**2. Verify Calculations**

```r
# Spot-check a few scenarios
scenario_1 <- results %>% filter(scenario_id == 1)
manual_bias <- mean(scenario_1$estimate) - scenario_1$true_value[1]
# Should match automated calculation
```

**3. Assess Monte Carlo Error**

```r
# Coverage SE: sqrt(p * (1-p) / R)
coverage <- 0.95
n_replicates <- 5000
se_coverage <- sqrt(0.95 * 0.05 / n_replicates)
# SE ≈ 0.003, so 95% CI is roughly [0.94, 0.96]
```

**4. Document Results**

```r
# Save analysis with timestamp
saveRDS(analysis_results, paste0("analysis_", Sys.Date(), ".rds"))
write.csv(summary_tables, paste0("summary_", Sys.Date(), ".csv"))
```

---

## Performance Metrics

### Bias

**Definition:** Systematic error of an estimator.

**Formula:** $\text{Bias}(\hat{\theta}) = E[\hat{\theta}] - \theta = \frac{1}{R}\sum_{r=1}^R \hat{\theta}_r - \theta$

**Interpretation:**

- Bias = 0: Unbiased estimator (desired)
- Bias > 0: Positive bias (tends to overestimate)
- Bias < 0: Negative bias (tends to underestimate)

**Acceptability:**

- In small samples: Some bias acceptable if offset by lower variance
- In large samples: Should approach zero (consistency requirement)
- Practical importance: Bias > 0.05σ may be concerning

**Examples:**

```
θ = 0.5, Bias = 0.02   → Acceptable (relative bias = 4%)
θ = 0.5, Bias = 0.15   → Concerning (relative bias = 30%)
```

---

### Mean Squared Error (MSE)

**Definition:** Expected squared distance from estimator to true value.

**Formula:** $\text{MSE}(\hat{\theta}) = E[(\hat{\theta} - \theta)^2] = \frac{1}{R}\sum_{r=1}^R (\hat{\theta}_r - \theta)^2$

**Decomposition:** $\text{MSE} = \text{Bias}^2 + \text{Var}$

**Interpretation:**

- Combines bias and variance (variance-bias trade-off)
- Lower is better
- Gold standard for comparing estimators

**Examples:**

```
Method A: Bias = 0.01, Var = 0.03 → MSE = 0.0301
Method B: Bias = 0.05, Var = 0.01 → MSE = 0.0125  (better overall)
```

---

### Root Mean Squared Error (RMSE)

**Definition:** Square root of MSE.

**Formula:** $\text{RMSE}(\hat{\theta}) = \sqrt{\text{MSE}(\hat{\theta})}$

**Interpretation:**

- In units of the parameter (easier to interpret than MSE)
- Expected magnitude of error
- Compare across methods on same scale

**Examples:**

```
θ = 1.0
Method A: RMSE = 0.20 (±20% error on average)
Method B: RMSE = 0.15 (±15% error on average, superior)
```

---

### Coverage Probability

**Definition:** Proportion of confidence intervals containing true parameter.

**Formula:** $\text{Coverage} = \frac{1}{R}\sum_{r=1}^R I(\theta \in [\text{CI}_r^L, \text{CI}_r^U])$

**Nominal Level:**

- 95% CI should have coverage ≈ 0.95
- 90% CI should have coverage ≈ 0.90

**Interpretation:**

- Coverage > nominal: Conservative (CI too wide)
- Coverage < nominal: Liberal (CI too narrow, high Type I error risk)
- Acceptable range: nominal ± 3 × Monte Carlo SE
  - For 95% CI with R = 5000: nominal ± 0.003 → [0.947, 0.953]

**Examples:**

```
95% nominal
├─ Coverage = 0.97 → Too conservative (wider than needed)
├─ Coverage = 0.95 → Perfect
└─ Coverage = 0.91 → Too liberal (too narrow, risky)
```

---

### Power

**Definition:** Probability of rejecting null hypothesis when it is false.

**Formula:** $\text{Power} = \frac{1}{R}\sum_{r=1}^R I(p_r < \alpha | H_1 \text{ true})$

**Standard Target:** 80% power (also written as 1 - β = 0.80, so β = 0.20)

**Interpretation:**

- Power < 0.50: Under-powered (likely to miss true effects)
- Power = 0.50-0.80: Moderately powered
- Power = 0.80: Conventional standard
- Power > 0.90: Well-powered (may be over-powered)

**Factors affecting power:**

- **Sample size:** Larger n increases power
- **Effect size:** Larger effect easier to detect
- **Significance level:** Larger α increases power (but increases Type I error)
- **Test type:** One-tailed more powerful than two-tailed

**Examples:**

```
Effect size = 0.3, α = 0.05, two-tailed
├─ n = 50:   Power ≈ 0.35 (under-powered)
├─ n = 100:  Power ≈ 0.55 (under-powered)
├─ n = 200:  Power ≈ 0.80 (adequate)
└─ n = 500:  Power ≈ 0.99 (over-powered)
```

---

### Type I Error Rate

**Definition:** Probability of rejecting null hypothesis when it is true.

**Formula:** $\text{Type I Error} = \frac{1}{R}\sum_{r=1}^R I(p_r < \alpha | H_0 \text{ true})$

**Nominal Level:** α = 0.05 (5% Type I error)

**Interpretation:**

- Type I Error > α: Inflated error (test is too liberal)
- Type I Error ≈ α: Correct (test is nominal)
- Type I Error < α: Conservative (test is too strict)

**Acceptable Range:** nominal ± 2 × Monte Carlo SE

- For α = 0.05, R = 10000: nominal ± 0.004 → [0.046, 0.054]

**Examples:**

```
Nominal α = 0.05
├─ Actual = 0.042 → Conservative (missed some signals)
├─ Actual = 0.050 → Perfect
└─ Actual = 0.068 → Liberal (false positives 36% too frequent)
```

---

### Confidence Interval Width

**Definition:** Average length of confidence intervals.

**Formula:** $\text{Width} = \frac{1}{R}\sum_{r=1}^R (\text{CI}_r^U - \text{CI}_r^L)$

**Interpretation:**

- Width × √R / estimate = Relative precision
- Narrower width preferred (more precise estimates)
- Trade-off with coverage: wider CI → higher coverage (usually)

**Minimum Width:**

- No CI can be arbitrarily narrow while maintaining coverage
- For symmetric CI: Width ≈ 2 × z_{α/2} × SE(θ̂)

**Examples:**

```
Method A: Coverage = 0.95, Width = 0.8  → Well-designed
Method B: Coverage = 0.95, Width = 1.2  → Less precise
Method C: Coverage = 0.97, Width = 0.6  → Trade-off (over-cover for precision)
```

---

### Relative Efficiency

**Definition:** Ratio of MSE of two estimators (or methods).

**Formula:** $\text{RE} = \frac{\text{MSE}_{\text{Method A}}}{\text{MSE}_{\text{Method B}}}$

**Interpretation:**

- RE < 1: Method A is more efficient (lower MSE)
- RE = 1: Methods equally efficient
- RE > 1: Method B is more efficient
- RE = 0.80: Method A needs only 80% of sample size for same precision

**Examples:**

```
MSE_A = 0.10, MSE_B = 0.125
RE_A/B = 0.10 / 0.125 = 0.80

Interpretation: Method A is 20% more efficient (or requires 80%
of the sample size for equivalent precision)
```

---

## Computational Optimization

### Parallel Processing in R

**Single-core baseline (slow):**

```r
# Serial execution
results <- lapply(1:1000, function(i) {
  # Simulation function
})
# Time: ~30 minutes
```

**Parallel processing (fast):**

```r
library(parallel)

# Detect cores
n_cores <- detectCores()  # e.g., 8 cores

# Method 1: mclapply (Unix/Mac only)
results <- mclapply(1:1000, function(i) {
  # Simulation function
}, mc.cores = n_cores)
# Time: ~4 minutes (8x speedup)

# Method 2: parLapply (Cross-platform)
cl <- makeCluster(n_cores)
clusterExport(cl, c("data", "functions"), envir = environment())
results <- parLapply(cl, 1:1000, function(i) {
  # Simulation function
})
stopCluster(cl)
# Time: ~4-5 minutes (slight overhead from cluster setup)
```

**Speed comparison:**

```
Scenarios: 32
Replications: 5,000
Total iterations: 160,000

Single-core:     ~6 hours
Parallel (4):    ~1.5 hours (4x faster)
Parallel (8):    ~45 minutes (8x faster)
Parallel (16):   ~30 minutes (16x faster, diminishing returns)
```

---

### Memory Management

**Check memory usage:**

```r
# Memory before
mem_before <- object.size(ls())

# Run simulation
results <- simulate(...)

# Memory after
mem_after <- object.size(results)

# Check available memory
gc()  # Garbage collection
```

**Optimize storage:**

```r
# Store only summary statistics (not full results)
# Instead of storing all 160,000 point estimates:
results <- data.frame(
  scenario_id = rep(1:32, each = 5000),
  replicate = rep(1:5000, 32),
  estimate = rnorm(160000)
)
# Size: ~5 MB (with compression)

# Store all bootstrap replicates (for visualization):
# Results grow to ~500 MB with bootstrap distributions
# Consider saving to disk and loading selectively
```

---

### Progress Tracking

**Simple progress bar (base R):**

```r
n_scenarios <- 32
for (i in 1:n_scenarios) {
  cat(sprintf("\r[%d%%] Scenario %d/%d",
              100 * i / n_scenarios, i, n_scenarios))

  # Simulation
  results[[i]] <- simulate_scenario(i)
}
cat("\n")
```

**Advanced progress bar (pbapply):**

```r
library(pbapply)

results <- pblapply(1:1000, function(i) {
  # Simulation
  simulate_scenario(i)
})
# Shows estimated time remaining
```

**Checkpoint/Resume:**

```r
# Save intermediate results
checkpoint_interval <- 100
for (i in 1:n_scenarios) {
  results[[i]] <- simulate_scenario(i)

  # Save every N scenarios
  if (i %% checkpoint_interval == 0) {
    saveRDS(results[1:i], paste0("checkpoint_", i, ".rds"))
  }
}

# Resume from checkpoint if interrupted
if (file.exists("checkpoint_800.rds")) {
  results <- readRDS("checkpoint_800.rds")
  # Continue from scenario 801
  for (i in 801:n_scenarios) {
    results[[i]] <- simulate_scenario(i)
  }
}
```

---

### Cloud Computing Integration

**AWS EC2 for large simulations:**

```bash
# Launch instance (large compute)
aws ec2 run-instances --image-id ami-0c55b159cbfafe1f0 \
  --instance-type c5.4xlarge --key-name my-key

# Connect
ssh -i my-key.pem ec2-user@instance-ip

# Install R and packages
sudo yum install -y R
R CMD BATCH install_packages.R

# Run simulation
Rscript simulation.R --scenarios 32 --reps 5000 --output s3://bucket/results.csv

# Monitor
tail -f simulation.log

# Stop instance
aws ec2 terminate-instances --instance-ids i-xxxxx
```

**Cost estimate:**

```
c5.4xlarge: $0.68/hour
32 scenarios × 5,000 reps ÷ 8 cores ÷ 4 = ~45 min

Cost: 0.75 hours × $0.68 = $0.51
```

---

## R/Python Integration

### R Simulation Template

**Complete working example:**

```r
# simulation.R
library(dplyr)
library(parallel)
library(boot)

# Data generation
generate_data <- function(n, alpha, beta, direct_effect = 0) {
  z <- rbinom(n, 1, 0.5)
  m <- alpha * z + rnorm(n)
  y <- beta * m + direct_effect * z + rnorm(n)
  data.frame(z = z, m = m, y = y)
}

# Analysis: return point estimate and SE
analyze <- function(data) {
  fit_m <- lm(m ~ z, data = data)
  fit_y <- lm(y ~ m + z, data = data)

  alpha_hat <- coef(fit_m)["z"]
  beta_hat <- coef(fit_y)["m"]

  # Delta method SE for product
  var_alpha <- vcov(fit_m)["z", "z"]
  var_beta <- vcov(fit_y)["m", "m"]

  theta_hat <- alpha_hat * beta_hat
  se_theta <- sqrt((beta_hat^2 * var_alpha + alpha_hat^2 * var_beta))

  list(estimate = theta_hat, se = se_theta)
}

# Simulation for one scenario
simulate_scenario <- function(n, alpha, beta, true_theta, R = 5000) {
  results <- replicate(R, {
    data <- generate_data(n, alpha, beta)
    analysis <- analyze(data)
    c(estimate = analysis$estimate, se = analysis$se)
  }, simplify = "matrix")

  data.frame(
    n = n,
    true_theta = true_theta,
    estimate = results["estimate", ],
    se = results["se", ],
    replicate = 1:R
  )
}

# Setup scenarios
scenarios <- expand.grid(
  n = c(50, 100, 200, 500),
  alpha = 0.3,
  beta = c(0, 0.1, 0.3, 0.5) / 0.3,  # Map to desired theta
  true_theta = c(0, 0.1, 0.3, 0.5)
)

# Run parallel simulation
cl <- makeCluster(detectCores())
clusterExport(cl, c("generate_data", "analyze"), envir = environment())

system.time({
  results <- parLapply(cl, 1:nrow(scenarios), function(i) {
    row <- scenarios[i, ]
    simulate_scenario(
      n = row$n,
      alpha = row$alpha,
      beta = row$beta,
      true_theta = row$true_theta,
      R = 5000
    )
  })
})

stopCluster(cl)

# Combine results
all_results <- bind_rows(results)

# Save
write.csv(all_results, "simulation_results.csv", row.names = FALSE)
```

**Run from command line:**

```bash
Rscript simulation.R > simulation.log 2>&1 &
tail -f simulation.log  # Monitor progress
```

---

### Python Simulation Template

**Complete working example:**

```python
# simulation.py
import numpy as np
import pandas as pd
from scipy import stats
from multiprocessing import Pool
import time

# Data generation
def generate_data(n, alpha, beta, direct_effect=0):
    z = np.random.binomial(1, 0.5, n)
    m = alpha * z + np.random.normal(0, 1, n)
    y = beta * m + direct_effect * z + np.random.normal(0, 1, n)
    return z, m, y

# Analysis
def analyze(z, m, y):
    # Mediator model: m ~ z
    z_with_const = np.column_stack([np.ones(len(z)), z])
    alpha_hat = np.linalg.lstsq(z_with_const, m, rcond=None)[0][1]
    residuals_m = m - (z_with_const @ np.linalg.lstsq(z_with_const, m, rcond=None)[0])
    var_alpha = np.sum(residuals_m**2) / (len(z) - 2) / np.sum((z - z.mean())**2)

    # Outcome model: y ~ m + z
    zz_with_const = np.column_stack([np.ones(len(z)), m, z])
    beta_hat = np.linalg.lstsq(zz_with_const, y, rcond=None)[0][1]
    residuals_y = y - (zz_with_const @ np.linalg.lstsq(zz_with_const, y, rcond=None)[0])
    var_beta = np.sum(residuals_y**2) / (len(z) - 3) / np.sum((m - m.mean())**2)

    # Indirect effect and SE
    theta_hat = alpha_hat * beta_hat
    se_theta = np.sqrt(beta_hat**2 * var_alpha + alpha_hat**2 * var_beta)

    return theta_hat, se_theta

# Simulation for one scenario
def simulate_scenario(scenario):
    n, alpha, beta, true_theta = scenario
    R = 5000

    results = []
    for r in range(R):
        z, m, y = generate_data(n, alpha, beta)
        estimate, se = analyze(z, m, y)
        results.append({
            'n': n,
            'true_theta': true_theta,
            'estimate': estimate,
            'se': se,
            'replicate': r + 1
        })

    return pd.DataFrame(results)

# Setup scenarios
scenarios = []
for n in [50, 100, 200, 500]:
    for true_theta in [0, 0.1, 0.3, 0.5]:
        beta = (true_theta / 0.3) if true_theta > 0 else 0
        scenarios.append((n, 0.3, beta, true_theta))

# Run parallel simulation
if __name__ == '__main__':
    print(f"Running {len(scenarios)} scenarios with 5,000 replications each")
    print(f"Total iterations: {len(scenarios) * 5000:,}")

    start_time = time.time()

    with Pool() as pool:
        all_results = pool.map(simulate_scenario, scenarios)

    elapsed = time.time() - start_time

    # Combine results
    results_df = pd.concat(all_results, ignore_index=True)

    # Save
    results_df.to_csv('simulation_results.csv', index=False)

    print(f"Completed in {elapsed:.1f} seconds")
    print(f"Results saved to simulation_results.csv")
    print(f"Shape: {results_df.shape}")
```

**Run from command line:**

```bash
python simulation.py > simulation.log 2>&1 &
tail -f simulation.log
```

---

## Design Patterns

### Pattern 1: Type I Error Control

**Goal:** Verify test maintains nominal significance level under null.

**Setup:**

```markdown
- Parameter of interest: θ (true value = 0)
- Sample size: n ∈ {50, 100, 200, 500}
- Distributions: Normal, t(5), Skewed
- Replications: 10,000 (for precision on error rate)
- Significance level: α = 0.05

Design: 4 × 3 = 12 scenarios
```

**Analysis:**

```r
# Type I error calculation
type1_results <- results %>%
  filter(true_theta == 0) %>%
  group_by(distribution, n) %>%
  summarize(
    type1_error = mean(pvalue < 0.05),
    se = sqrt(mean(pvalue < 0.05) * (1 - mean(pvalue < 0.05)) / n()),
    lower = type1_error - 1.96 * se,
    upper = type1_error + 1.96 * se
  )
```

---

### Pattern 2: Power Analysis

**Goal:** Evaluate statistical power across effect sizes and sample sizes.

**Setup:**

```markdown
- Parameter of interest: θ
- Effect sizes: 0.1, 0.3, 0.5 (small, medium, large)
- Sample size: n ∈ {50, 100, 200, 500}
- Replications: 5,000
- Significance level: α = 0.05

Design: 3 × 4 = 12 scenarios
```

**Analysis:**

```r
# Power calculation
power_results <- results %>%
  filter(true_theta != 0) %>%
  group_by(true_theta, n) %>%
  summarize(
    power = mean(pvalue < 0.05),
    se = sqrt(power * (1 - power) / n())
  )

# Sample size for 80% power
sample_sizes_80 <- power_results %>%
  group_by(true_theta) %>%
  filter(power >= 0.80) %>%
  slice_min(n, n = 1)
```

---

### Pattern 3: Coverage Assessment

**Goal:** Evaluate confidence interval coverage under various conditions.

**Setup:**

```markdown
- Parameter of interest: θ
- Effect sizes: 0, 0.1, 0.3, 0.5
- Sample size: n ∈ {50, 100, 200, 500}
- CI levels: 90%, 95%, 99%
- Replications: 5,000

Design: 4 × 4 × 3 = 48 scenarios
```

**Analysis:**

```r
# Coverage calculation
coverage_results <- results %>%
  mutate(
    covers_90 = ci_lower <= true_theta & ci_upper >= true_theta,
    ci_width = ci_upper - ci_lower
  ) %>%
  group_by(ci_level, true_theta, n) %>%
  summarize(
    coverage = mean(covers_90),
    avg_width = mean(ci_width),
    se_coverage = sqrt(coverage * (1 - coverage) / n())
  )
```

---

### Pattern 4: Method Comparison

**Goal:** Compare performance of multiple estimation methods.

**Setup:**

```markdown
- Methods: Method A, Method B, Method C
- Parameter of interest: θ
- Effect sizes: 0.1, 0.3, 0.5
- Sample size: n ∈ {100, 200, 500}
- Replications: 5,000

Design: 3 × 3 × 3 = 27 scenarios
```

**Analysis:**

```r
# Efficiency comparison
efficiency <- results %>%
  group_by(method, n, true_theta) %>%
  summarize(
    bias = mean(estimate - true_theta),
    mse = mean((estimate - true_theta)^2),
    rmse = sqrt(mse)
  ) %>%
  pivot_wider(names_from = method, values_from = c(bias, rmse)) %>%
  mutate(
    relative_efficiency = rmse_A / rmse_B
  )
```

---

### Pattern 5: Sensitivity Analysis

**Goal:** Evaluate robustness to assumption violations.

**Setup:**

```markdown
- Base scenario: Normal distribution, no confounding
- Violation levels:
  - Non-normality: Light tail, heavy tail, skewed
  - Confounding: Small, moderate, large unmeasured confounder
  - Missing data: 0%, 10%, 30% Missing at Random
- Sample size: n = 200
- Replications: 5,000

Design: 3 × 3 × 3 = 27 scenarios
```

**Analysis:**

```r
# Sensitivity summary
sensitivity <- results %>%
  group_by(violation_type, violation_severity) %>%
  summarize(
    bias = mean(estimate - true_theta),
    coverage = mean(ci_lower <= true_theta & ci_upper >= true_theta),
    rmse = sqrt(mean((estimate - true_theta)^2))
  ) %>%
  mutate(
    acceptable = abs(bias) < 0.05 & coverage > 0.90
  )
```

---

## Publication Workflow

### Step 1: Design Documentation

Create detailed simulation design document (from `/research:simulation:design`).

**Checklist:**

- [ ] Research question clearly stated
- [ ] Data generation model specified with mathematical notation
- [ ] All parameters enumerated with justification
- [ ] Estimation methods described
- [ ] Performance metrics defined
- [ ] Number of replications justified (Monte Carlo error < threshold)
- [ ] Computational resources estimated
- [ ] Code template provided

**Publication requirements:**

- Include in Appendix or supplementary materials
- Provide enough detail for reproducibility
- Cite any novel design elements

---

### Step 2: Results Summary Tables

Create publication-ready tables from analysis.

**Bias Table:**

```markdown
| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| A      | -0.02| -0.01 |  0.00 |  0.00 |
| B      |  0.05|  0.03 |  0.01 |  0.00 |

Note: Entries are bias estimates. Values ≤ 0.01 considered unbiased.
```

**Coverage Table:**

```markdown
| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| A      | 0.93 | 0.94  | 0.95  | 0.95  |
| B      | 0.89 | 0.92  | 0.94  | 0.95  |

Note: Nominal coverage = 0.95. Acceptable range [0.93, 0.97].
```

---

### Step 3: Figures

Create publication-quality plots with code provided by analysis command.

**Recommended figures:**

1. **Bias Comparison**
   - X-axis: Sample size (log scale if wide range)
   - Y-axis: Bias
   - Lines: One per method
   - Facets: By effect size

2. **Coverage Plot**
   - X-axis: Sample size
   - Y-axis: Coverage rate
   - Reference line: Nominal level (0.95)
   - Shaded band: Acceptable range (accounting for MC error)

3. **Power Curves**
   - X-axis: Effect size
   - Y-axis: Power
   - Lines: One per sample size
   - Reference line: 0.80 (conventional standard)

4. **Method Comparison**
   - X-axis: Sample size
   - Y-axis: RMSE
   - Lines: One per method
   - Shows relative efficiency

---

### Step 4: Methods Section

Use `/research:manuscript:methods` with simulation details.

**Template for simulation methods:**

```markdown
## Simulation Study

### Objective

We conducted a Monte Carlo simulation study to evaluate [objective].

### Data Generation

Data were generated from the model:

[Mathematical specification]

where [parameter interpretations].

### Design Factors

The simulation varied the following factors:

| Factor | Levels | Rationale |
|--------|--------|-----------|
| Sample size | 50, 100, 200, 500 | Practical range |
| Effect size | 0, 0.1, 0.3, 0.5 | Null to large |
| Distribution | Normal, t(5), Skewed | Robustness |

### Performance Metrics

We evaluated methods on the following metrics:

1. **Bias:** E[θ̂] - θ (unbiasedness)
2. **RMSE:** √(E[(θ̂ - θ)²]) (overall accuracy)
3. **Coverage:** Proportion of 95% CIs containing θ (nominal = 0.95)

### Implementation

We implemented simulations in R using [packages]. Each scenario involved
5,000 Monte Carlo replications. Code is available in Supplementary Materials.

### Monte Carlo Error

With R = 5,000 replications, Monte Carlo standard error for coverage
estimates is √(0.95 × 0.05 / 5000) ≈ 0.003, allowing detection of
coverage deviations > 1% with 95% confidence.
```

---

### Step 5: Results Section

Use `/research:manuscript:results` with simulation findings.

**Template for simulation results:**

```markdown
## Simulation Results

### Overall Performance

[Summary of which method(s) performed best]

### Bias Analysis

[Bias patterns across conditions]

All methods showed unbiased estimates with increasing sample size.
Method A exhibited negligible bias (|bias| < 0.01) for n ≥ 100,
while Method B required n ≥ 200 for similar bias reduction.

### Coverage Analysis

[Coverage of confidence intervals]

Coverage rates are presented in Table X. Method A achieved nominal
95% coverage for all sample sizes, while Method B showed under-coverage
(coverage = 0.92) for n = 50.

### Efficiency Comparison

[Relative efficiency across methods]

Method A was more efficient overall, with 15-20% lower RMSE than
Method B across most scenarios.

### Robustness to Distributional Assumptions

[Performance under assumption violations]

Both methods showed robustness to moderate deviations from normality,
with performance degradation < 5% under t(5) or skewed errors.
```

---

### Step 6: Supplementary Materials

Provide complete documentation for reproducibility.

**Include in supplements:**

1. **Complete R/Python code** (annotated)
2. **Simulation design document**
3. **Detailed results tables** (all scenarios)
4. **Additional figures** (exploratory visualizations)
5. **Computational details:**
   - Hardware specifications
   - Software versions
   - Execution time
   - Random seed for reproducibility

---

### Step 7: Reproducibility

Ensure others can reproduce results.

**R package for reproducibility:**

```r
# Create reproducible package
library(devtools)
create_package("mediationSim")

# Structure:
# mediationSim/
# ├── R/
# │   ├── generate_data.R
# │   ├── analyze.R
# │   └── simulate.R
# ├── data/
# │   └── results.rda
# ├── man/
# │   └── [documentation]
# ├── vignettes/
# │   └── "Reproducing the simulation"

# vignette excerpt:
# library(mediationSim)
# results <- run_simulation()
# # Generates identical results to published paper
```

---

### Publishing Checklist

- [ ] Simulation design documented clearly
- [ ] Research question justified (why simulation needed?)
- [ ] Data generation model reproducible
- [ ] All parameters enumerated
- [ ] Performance metrics defined
- [ ] Number of replications justified
- [ ] Monte Carlo error quantified
- [ ] Results tables complete
- [ ] Figures publication-quality
- [ ] Methods section detailed
- [ ] Results section interpretive (not just numbers)
- [ ] Code available (GitHub, supplementary, OSF)
- [ ] Random seed documented
- [ ] Computational details provided
- [ ] Reproducibility verified (re-run code, compare results)

---

## See Also

- **[Research Commands Reference](RESEARCH-COMMANDS-REFERENCE.md)** - Complete 14-command reference
- **[Literature Commands](LITERATURE-COMMANDS.md)** - Literature management and search
- **[Manuscript Commands](MANUSCRIPT-COMMANDS.md)** - Writing methods, results, and proofs
- **[Simulation Study Tutorial](../tutorials/research/simulation-study.md)** - Step-by-step guide
- **[Workflows](../workflows/research/simulation-study.md)** - Integration with flow-cli

### External Resources

- **Monte Carlo Methods:** Gentle, J.E. (2009). "Computational Statistics"
- **Simulation Design:** Burton, A., et al. (2006). "The design of simulation studies in medical statistics"
- **R Packages:**
  - `parallel` - Parallel computation
  - `boot` - Bootstrap methods
  - `pbapply` - Progress bars
  - `ggplot2` - Publication-quality graphics

---

**Document Version:** {{ scholar.version }}
**Last Updated:** 2026-01-31
**Status:** Complete
**Total Lines of Documentation:** 2,500+
**Code Examples:** 40+
**Real Scenarios Covered:** 10+
