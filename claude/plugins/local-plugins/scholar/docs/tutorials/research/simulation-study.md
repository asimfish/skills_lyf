# Tutorial: Designing Your First Simulation Study

**Target Audience:** Researchers designing Monte Carlo simulation studies
**Time:** 25 minutes
**Difficulty:** Intermediate

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Design simulation study parameters systematically
- Generate R/Python code templates for simulations
- Run pilot simulations to test your design
- Analyze simulation results with proper metrics
- Scale from pilot to full simulation study
- Write methods sections documenting your simulation

## Prerequisites

Before starting, make sure you have:

- [ ] Scholar installed (`brew install data-wise/tap/scholar`)
- [ ] A clear research question defined
- [ ] Basic knowledge of R or Python
- [ ] Understanding of statistical concepts (bias, MSE, coverage)
- [ ] (Optional) Access to computational resources for large simulations

**Research Question Check:**

Your simulation should answer a specific question:

- "Which method performs better in small samples?"
- "Does the test maintain Type I error under null?"
- "How does bias change with sample size?"
- "Are confidence intervals achieving nominal coverage?"

---

## Step 1: Design Simulation Parameters ⏱️ 5 minutes

### What You'll Do

Use `/research:simulation:design` to create a comprehensive simulation study design. This command generates parameters, sample sizes, performance metrics, and analysis plans.

### Example Command

```bash
# Design a study comparing two estimation methods
/research:simulation:design "Compare bootstrap percentile vs BCa confidence intervals for mediation effects across sample sizes 50, 100, 200, 500"

# More specific design
/research:simulation:design "Evaluate Type I error and power of Wald test for indirect effects under normal and non-normal mediator distributions"

# Method comparison study
/research:simulation:design "Compare bias and efficiency of product-of-coefficients vs difference-in-coefficients for mediation in 2x2 factorial design"
```

### Try It Now

Formulate your research question and generate a design:

```bash
/research:simulation:design "YOUR RESEARCH QUESTION HERE"
```

### Expected Output

You'll receive a structured design document:

```markdown
## Simulation Design: Bootstrap CI Methods for Mediation

### Research Question
Compare the performance of bootstrap percentile and BCa confidence intervals
for indirect effects in terms of coverage probability and interval width
across varying sample sizes.

### Data Generation

**Parameters:**
- Sample sizes: n = 50, 100, 200, 500
- True indirect effect: θ = 0, 0.1, 0.3, 0.5 (null, small, medium, large)
- Distributions: Normal(0,1) for mediator and outcome errors
- Treatment effect on mediator: α = 0.3
- Mediator effect on outcome: β varies to achieve target θ

**Data Generating Model:**
$$
M_i = \alpha Z_i + \epsilon_{Mi}, \quad \epsilon_{Mi} \sim N(0, 1)
$$
$$
Y_i = \beta M_i + \gamma Z_i + \epsilon_{Yi}, \quad \epsilon_{Yi} \sim N(0, 1)
$$

where $Z_i \in \{0, 1\}$ is treatment, $M_i$ is mediator, $Y_i$ is outcome.

### Estimation Methods

Compare the following confidence interval methods:

1. **Bootstrap Percentile**: 95th percentile CI from 5,000 bootstrap samples
2. **BCa (Bias-Corrected Accelerated)**: Adjusted for bias and skewness

Both methods estimate the indirect effect as $\hat{\theta} = \hat{\alpha} \times \hat{\beta}$

### Performance Metrics

- **Coverage Rate**: Proportion of 95% CIs containing true θ (target: 0.95)
- **Average Width**: Mean CI width (smaller = more precise)
- **Non-coverage Error Balance**: P(θ < CI) vs P(θ > CI) (should be equal)
- **Computation Time**: Mean time per replication

### Design Factors

| Factor | Levels |
|--------|--------|
| Sample size (n) | 50, 100, 200, 500 |
| Effect size (θ) | 0.0, 0.1, 0.3, 0.5 |
| CI method | Percentile, BCa |

**Total scenarios:** 4 × 4 × 2 = 32 conditions

### Number of Replications

- **Recommended:** 5,000 replications per scenario
- **Justification:** Monte Carlo error for coverage ≈ 0.003 (acceptable precision)
- **Pilot run:** 1,000 replications to test code (faster iteration)

### Implementation Plan

**Phase 1: Pilot (1-2 hours)**
- Run 1,000 reps with n = 100 only
- Verify code correctness
- Check computation time
- Debug any issues

**Phase 2: Full Study (4-8 hours)**
- Run 5,000 reps across all conditions
- Use parallel processing (8 cores)
- Save intermediate results every 1,000 reps
- Monitor progress with progress bars

### R Code Template

```r
library(dplyr)
library(parallel)
library(boot)

# Simulation function
simulate_mediation <- function(n, alpha = 0.3, beta, B = 5000, method = "percentile") {
  # Generate data
  Z <- rbinom(n, 1, 0.5)
  M <- alpha * Z + rnorm(n)
  Y <- beta * M + rnorm(n)

  # Bootstrap function
  boot_indirect <- function(data, indices) {
    d <- data[indices, ]
    fit_m <- lm(M ~ Z, data = d)
    fit_y <- lm(Y ~ M + Z, data = d)
    coef(fit_m)["Z"] * coef(fit_y)["M"]
  }

  # Run bootstrap
  data <- data.frame(Z = Z, M = M, Y = Y)
  boot_results <- boot(data, boot_indirect, R = B)

  # Compute CI
  if (method == "percentile") {
    ci <- boot.ci(boot_results, type = "perc")$percent[4:5]
  } else if (method == "bca") {
    ci <- boot.ci(boot_results, type = "bca")$bca[4:5]
  }

  return(list(
    estimate = boot_results$t0,
    ci_lower = ci[1],
    ci_upper = ci[2],
    width = ci[2] - ci[1]
  ))
}

# Full simulation
run_simulation <- function(reps = 5000, cores = 8) {
  # Design grid
  design <- expand.grid(
    n = c(50, 100, 200, 500),
    theta = c(0, 0.1, 0.3, 0.5),
    method = c("percentile", "bca"),
    rep = 1:reps
  )

  # Add beta values (since theta = alpha * beta, beta = theta / alpha)
  design$beta <- design$theta / 0.3

  # Parallel execution
  results <- mclapply(1:nrow(design), function(i) {
    row <- design[i, ]
    res <- simulate_mediation(
      n = row$n,
      beta = row$beta,
      method = row$method
    )
    cbind(row[1:3], res)  # Combine design with results
  }, mc.cores = cores)

  # Combine results
  bind_rows(results)
}

# Run pilot
pilot_results <- run_simulation(reps = 1000, cores = 4)
saveRDS(pilot_results, "pilot_results.rds")

# After verifying pilot, run full simulation
# full_results <- run_simulation(reps = 5000, cores = 8)
# saveRDS(full_results, "full_results.rds")
```

### Analysis Plan

After collecting results:

1. **Coverage Analysis:**
   - Calculate coverage rate per condition
   - Plot coverage vs sample size
   - Identify under/over-coverage patterns

2. **Width Analysis:**
   - Compare average CI width by method
   - Plot width vs sample size (should decrease)
   - Trade-off: coverage vs precision

3. **Error Balance:**
   - Check symmetry of non-coverage errors
   - BCa should improve left/right balance

4. **Recommendations:**
   - Which method for which sample size?
   - When is BCa worth the extra computation?

```

### ✅ Checkpoint 1

- [ ] Design includes clear research question
- [ ] Data generating model is specified
- [ ] Sample sizes and effect sizes are appropriate
- [ ] Performance metrics are defined
- [ ] Number of replications is justified
- [ ] R code template is provided

**Troubleshooting:**
- **Design too simple**: Add more factors (distributions, missingness, violations)
- **Design too complex**: Start with fewer levels, add complexity later
- **Unclear metrics**: Focus on 2-3 key metrics (coverage, bias, RMSE)

### What to Do Next

1. Review the design carefully
2. Verify data generating model matches your research context
3. Adjust sample sizes or effect sizes if needed
4. Copy the R code template to a file
5. Proceed to Step 2 to implement the code

---

## Step 2: Generate R/Python Code Template ⏱️ 3 minutes

### What You'll Do

Take the code template from Step 1 and customize it for your specific needs. The template provides a starting point that you'll refine.

### Customization Steps

**1. Save the template:**
```bash
# Create simulation directory
mkdir -p ~/research/simulations/bootstrap-ci-comparison
cd ~/research/simulations/bootstrap-ci-comparison

# Save the R code from Step 1
cat > simulation.R << 'EOF'
# [Paste R code template from Step 1]
EOF
```

**2. Customize for your study:**

```r
# Modify the data generating function
generate_data <- function(n, alpha, beta, distribution = "normal") {
  Z <- rbinom(n, 1, 0.5)

  # Add distribution options
  if (distribution == "normal") {
    epsilon_M <- rnorm(n)
    epsilon_Y <- rnorm(n)
  } else if (distribution == "t5") {
    epsilon_M <- rt(n, df = 5)
    epsilon_Y <- rt(n, df = 5)
  } else if (distribution == "skewed") {
    epsilon_M <- rchisq(n, df = 3) - 3  # Standardize
    epsilon_Y <- rchisq(n, df = 3) - 3
  }

  M <- alpha * Z + epsilon_M
  Y <- beta * M + epsilon_Y

  data.frame(Z = Z, M = M, Y = Y)
}
```

**3. Add progress tracking:**

```r
library(pbapply)  # Progress bars for apply functions

# Replace mclapply with pbmclapply
results <- pbmclapply(1:nrow(design), function(i) {
  # ... simulation code ...
}, mc.cores = cores)
```

**4. Add error handling:**

```r
simulate_with_error_handling <- function(...) {
  tryCatch({
    simulate_mediation(...)
  }, error = function(e) {
    # Return NA on error instead of crashing
    list(estimate = NA, ci_lower = NA, ci_upper = NA, width = NA, error = e$message)
  })
}
```

### Try It Now

Create and customize your simulation script:

```bash
# Navigate to your simulation directory
mkdir -p ~/research/simulations/my-study
cd ~/research/simulations/my-study

# Create the simulation file
touch simulation.R

# Open in your editor
# [Add customized code here]
```

### ✅ Checkpoint 2

- [ ] Simulation code is saved to a file
- [ ] Data generation function is customized
- [ ] Progress tracking is added
- [ ] Error handling is in place
- [ ] Random seed is set for reproducibility

**Verification:**

```r
# Test the code with minimal parameters
source("simulation.R")

# Run one replication
test_result <- simulate_mediation(n = 100, beta = 0.1, method = "percentile")
print(test_result)

# Should return: list with estimate, ci_lower, ci_upper, width
```

---

## Step 3: Run Pilot Simulation ⏱️ 5 minutes

### What You'll Do

Before running the full simulation (which may take hours), run a pilot study with fewer replications to test your code and estimate runtime.

### Pilot Parameters

```r
# Pilot configuration (10-20% of full study)
pilot_config <- list(
  reps = 1000,           # Instead of 5,000
  sample_sizes = 100,    # Just one sample size
  cores = 4,             # Conservative parallelization
  bootstrap_reps = 1000  # Instead of 5,000
)
```

### Run Pilot

```r
# Set random seed for reproducibility
set.seed(20240131)

# Time the pilot run
system.time({
  pilot_results <- run_simulation(
    reps = 1000,
    sample_sizes = c(100),  # Single sample size
    effect_sizes = c(0, 0.3),  # Just null and medium effect
    cores = 4
  )
})

# Save results
saveRDS(pilot_results, "pilot_results.rds")
```

### Expected Output

```
   user  system elapsed
 45.231   2.104  12.583
```

**Interpretation:**

- Elapsed time: 12.6 seconds for 1,000 reps
- Full study: 5,000 reps × 16 conditions = 80,000 total runs
- Estimated time: 12.6 × (80,000 / 1,000) ≈ 17 minutes
- With 8 cores: ~8-9 minutes

### Quick Analysis

```r
# Load and check pilot results
pilot <- readRDS("pilot_results.rds")

# Check for errors
sum(is.na(pilot$estimate))  # Should be 0 or very small

# Quick coverage check (target: 0.95)
pilot %>%
  group_by(theta, method) %>%
  summarize(
    coverage = mean(theta >= ci_lower & theta <= ci_upper),
    avg_width = mean(width)
  )

# Expected output:
#   theta  method      coverage avg_width
# 1   0.0  percentile     0.943     0.234
# 2   0.0  bca            0.951     0.239
# 3   0.3  percentile     0.938     0.256
# 4   0.3  bca            0.948     0.262
```

### ✅ Checkpoint 3

- [ ] Pilot completes without errors
- [ ] Runtime is reasonable (< 5 minutes for pilot)
- [ ] Results are plausible (coverage near 0.95)
- [ ] No NA or missing values
- [ ] Random seed is documented

**Troubleshooting:**

- **Too slow**: Reduce bootstrap replications or parallelize more
- **Many NAs**: Check for numerical issues or model convergence
- **Coverage way off**: Verify data generation or CI calculation
- **Errors**: Add error handling and check function inputs

### What to Do Next

1. Review pilot results
2. Fix any issues discovered
3. Adjust full simulation parameters if needed
4. Proceed to Step 4

---

## Step 4: Analyze Preliminary Results ⏱️ 4 minutes

### What You'll Do

Use `/research:simulation:analysis` to generate performance summaries, visualizations, and interpretations of your pilot results.

### Prepare Results File

```r
# Convert pilot results to CSV for analysis
pilot <- readRDS("pilot_results.rds")

# Add coverage indicator
pilot <- pilot %>%
  mutate(
    covers = (theta >= ci_lower & theta <= ci_upper),
    true_effect = theta
  )

# Save to CSV
write.csv(pilot, "pilot_results.csv", row.names = FALSE)
```

### Run Analysis

```bash
# Analyze simulation results
/research:simulation:analysis ~/research/simulations/my-study/pilot_results.csv
```

### Expected Output

```markdown
## Simulation Results Analysis: Pilot Study

### Performance Summary

**Coverage Rates (Nominal = 0.95):**

| Method      | θ=0.0 | θ=0.3 | Overall |
|-------------|-------|-------|---------|
| Percentile  | 0.943 | 0.938 | 0.941   |
| BCa         | 0.951 | 0.948 | 0.950   |

**Average CI Width:**

| Method      | θ=0.0 | θ=0.3 | Overall |
|-------------|-------|-------|---------|
| Percentile  | 0.234 | 0.256 | 0.245   |
| BCa         | 0.239 | 0.262 | 0.251   |

**Non-Coverage Error Balance:**

| Method      | Left Tail | Right Tail | Ratio |
|-------------|-----------|------------|-------|
| Percentile  | 0.038     | 0.021      | 1.81  |
| BCa         | 0.028     | 0.022      | 1.27  |

### Interpretation

**Key Findings:**

1. **Coverage Performance:**
   - BCa achieves near-nominal coverage (0.950 vs target 0.95)
   - Percentile slightly under-covers (0.941), especially for null effect
   - Both methods perform acceptably for this sample size

2. **Precision:**
   - BCa intervals are ~2.5% wider on average
   - Trade-off: Better coverage at cost of slightly wider intervals
   - Width increases with effect size (as expected)

3. **Error Balance:**
   - Percentile shows asymmetric errors (left > right)
   - BCa improves balance (ratio closer to 1.0)
   - BCa correction working as intended

4. **Practical Implications:**
   - For n=100: BCa recommended for better coverage
   - Extra width (2.5%) is acceptable cost
   - Need to test smaller samples (n=50) where BCa may help more

### Recommendations for Full Study

1. **Proceed with full simulation** - Pilot results are promising
2. **Add n=50 condition** - BCa advantage may be larger in small samples
3. **Consider skewed distributions** - Test robustness to non-normality
4. **Increase bootstrap reps to 5,000** - Reduce simulation variability

### Visualization Code

```r
library(ggplot2)
library(dplyr)

# Load data
results <- read.csv("pilot_results.csv")

# Coverage plot
coverage_data <- results %>%
  group_by(theta, method) %>%
  summarize(coverage = mean(covers))

ggplot(coverage_data, aes(x = factor(theta), y = coverage, fill = method)) +
  geom_col(position = "dodge") +
  geom_hline(yintercept = 0.95, linetype = "dashed", color = "red") +
  labs(
    title = "Coverage Rates by Effect Size",
    x = "True Indirect Effect (θ)",
    y = "Coverage Probability",
    fill = "CI Method"
  ) +
  theme_minimal()

# Width plot
width_data <- results %>%
  group_by(theta, method) %>%
  summarize(avg_width = mean(width))

ggplot(width_data, aes(x = factor(theta), y = avg_width, fill = method)) +
  geom_col(position = "dodge") +
  labs(
    title = "Average CI Width by Effect Size",
    x = "True Indirect Effect (θ)",
    y = "Average Width",
    fill = "CI Method"
  ) +
  theme_minimal()
```

```

### Create Visualizations

```r
# Source the visualization code from the analysis
source("analysis_plots.R")

# Generate plots
ggsave("coverage_plot.png", width = 8, height = 6)
ggsave("width_plot.png", width = 8, height = 6)
```

### ✅ Checkpoint 4

- [ ] Coverage rates are near nominal (0.93-0.97)
- [ ] Patterns make statistical sense
- [ ] Visualizations are informative
- [ ] Interpretation identifies key findings
- [ ] Recommendations for full study are clear

**Red Flags:**

- Coverage < 0.90 or > 0.98: Check code
- Negative bias where not expected: Verify estimator
- No difference between methods: May need stronger test conditions

---

## Step 5: Scale to Full Study ⏱️ 3 minutes

### What You'll Do

After successful pilot, scale up to the full simulation with all conditions and more replications.

### Adjust Parameters

```r
# Full simulation configuration
full_config <- list(
  reps = 5000,                          # Full replications
  sample_sizes = c(50, 100, 200, 500),  # All sample sizes
  effect_sizes = c(0, 0.1, 0.3, 0.5),   # All effect sizes
  methods = c("percentile", "bca"),
  bootstrap_reps = 5000,                # Full bootstrap
  cores = 8                             # Max parallelization
)
```

### Run Full Simulation

```r
# Set random seed
set.seed(20240131)

# Track total time
start_time <- Sys.time()

# Run full simulation
full_results <- run_simulation(
  reps = full_config$reps,
  sample_sizes = full_config$sample_sizes,
  effect_sizes = full_config$effect_sizes,
  cores = full_config$cores
)

end_time <- Sys.time()
runtime <- difftime(end_time, start_time, units = "mins")

# Save results
saveRDS(full_results, "full_results.rds")
write.csv(full_results, "full_results.csv", row.names = FALSE)

# Save metadata
metadata <- list(
  date = Sys.Date(),
  runtime = runtime,
  config = full_config,
  seed = 20240131,
  r_version = R.version.string
)
saveRDS(metadata, "simulation_metadata.rds")

cat(sprintf("Simulation completed in %.2f minutes\n", runtime))
```

### Monitoring Long Simulations

```r
# Option 1: Save intermediate results
run_simulation_with_checkpoints <- function(..., checkpoint_every = 1000) {
  # ... simulation code ...

  if (i %% checkpoint_every == 0) {
    saveRDS(results_so_far, sprintf("checkpoint_%05d.rds", i))
    cat(sprintf("Checkpoint: %d/%d complete\n", i, total))
  }
}

# Option 2: Use a progress file
writeLines(as.character(Sys.time()), "simulation_started.txt")
# ... run simulation ...
writeLines(as.character(Sys.time()), "simulation_finished.txt")
```

### ✅ Checkpoint 5

- [ ] Full simulation completes without errors
- [ ] Results are saved to multiple formats (RDS, CSV)
- [ ] Metadata is documented (seed, runtime, config)
- [ ] Backup copies are created
- [ ] Total runtime is reasonable (< 12 hours)

**Best Practices:**

- Run overnight if > 1 hour runtime
- Save to multiple locations (local + cloud)
- Document random seed and R version
- Keep raw results (don't overwrite)

---

## Step 6: Write Methods Section ⏱️ 5 minutes

### What You'll Do

Use `/research:manuscript:methods` to generate a publication-ready methods section documenting your simulation study.

### Generate Methods Text

```bash
/research:manuscript:methods "Describe a Monte Carlo simulation study comparing bootstrap percentile and BCa confidence intervals for indirect effects. The study used 5,000 replications across sample sizes 50, 100, 200, and 500, with true indirect effects of 0, 0.1, 0.3, and 0.5. Data were generated from a linear mediation model with normal errors. Performance was evaluated using coverage probability, average interval width, and non-coverage error balance."
```

### Expected Output

```markdown
## Methods: Simulation Study

### Overview

We conducted a Monte Carlo simulation study to compare the performance of
bootstrap percentile and bias-corrected accelerated (BCa) confidence
intervals for estimating indirect effects in mediation analysis. The
simulation evaluated coverage probability, interval width, and error
balance across varying sample sizes and effect sizes.

### Data Generation

Data were generated from a linear mediation model with two paths:

**Mediator model:**
$$
M_i = \alpha Z_i + \epsilon_{Mi}, \quad \epsilon_{Mi} \sim N(0, 1)
$$

**Outcome model:**
$$
Y_i = \beta M_i + \gamma Z_i + \epsilon_{Yi}, \quad \epsilon_{Yi} \sim N(0, 1)
$$

where $Z_i \in \{0, 1\}$ is the binary treatment indicator randomly
assigned with probability 0.5, $M_i$ is the mediator variable, and
$Y_i$ is the continuous outcome.

The indirect effect is defined as $\theta = \alpha \beta$, representing
the effect of treatment on outcome mediated through $M$.

### Design Factors

The simulation crossed the following factors:

- **Sample size:** $n \in \{50, 100, 200, 500\}$
- **Indirect effect:** $\theta \in \{0, 0.1, 0.3, 0.5\}$ (null, small, medium, large)
- **CI method:** Bootstrap percentile vs. BCa

For each of the 32 conditions (4 × 4 × 2), we generated 5,000 independent
datasets, yielding 160,000 total simulation runs.

### Estimation Procedures

For each simulated dataset, we estimated the indirect effect using the
product-of-coefficients method:

$$
\hat{\theta} = \hat{\alpha} \times \hat{\beta}
$$

where $\hat{\alpha}$ and $\hat{\beta}$ are ordinary least squares
estimates from the mediator and outcome models, respectively.

**Bootstrap Confidence Intervals:**

1. **Percentile Method:** We drew 5,000 bootstrap samples with replacement,
   re-estimated $\hat{\theta}$ in each sample, and computed the 2.5th and
   97.5th percentiles of the bootstrap distribution.

2. **BCa Method:** We computed bias-corrected and accelerated intervals
   using the bias-correction factor $z_0$ and acceleration constant $a$
   (Efron & Tibshirani, 1993). The BCa method adjusts percentiles to
   account for bias and skewness in the bootstrap distribution.

### Performance Metrics

We evaluated three performance metrics:

1. **Coverage Probability:** The proportion of 95% confidence intervals
   containing the true $\theta$. The nominal level is 0.95.

2. **Average Interval Width:** The mean width of confidence intervals,
   calculated as $\text{width} = \text{CI}_{\text{upper}} - \text{CI}_{\text{lower}}$.
   Narrower intervals indicate greater precision.

3. **Non-Coverage Error Balance:** The ratio of left-tail errors
   $(P(\theta < \text{CI}_{\text{lower}}))$ to right-tail errors
   $(P(\theta > \text{CI}_{\text{upper}}))$. Values near 1.0 indicate
   symmetric errors.

### Computational Implementation

Simulations were implemented in R (version 4.3.2) using the `boot` package
for bootstrap resampling. Parallel processing was employed using 8 CPU
cores to reduce computation time. The complete simulation required
approximately 4 hours of runtime. All analyses used a fixed random seed
(20240131) for reproducibility.

### References

Efron, B., & Tibshirani, R. J. (1993). *An Introduction to the Bootstrap*.
Chapman & Hall/CRC.
```

### Customize for Your Paper

```markdown
# Add these sections as needed:

### Sensitivity Analyses

To assess robustness, we conducted sensitivity analyses varying:
- Error distributions (normal vs. t(5) vs. chi-squared)
- Missing data mechanisms (MCAR, MAR)
- Model misspecification (omitted covariates)

### Software

All analyses were conducted in R (version 4.3.2). Key packages included:
- `boot` for bootstrap resampling
- `dplyr` for data manipulation
- `ggplot2` for visualization
- `parallel` for parallel processing

Code is available at: https://github.com/username/simulation-study
```

### ✅ Checkpoint 6

- [ ] Methods section is complete and publication-ready
- [ ] Data generation is clearly specified
- [ ] Estimation procedures are described
- [ ] Performance metrics are defined
- [ ] Computational details are documented
- [ ] References are included

**Final Checks:**

- All mathematical notation is defined
- Sample sizes match your actual simulation
- Random seed is documented
- Software versions are stated

---

## Complete Workflow Summary

Here's the full workflow from design to publication:

```bash
# Step 1: Design (5 min)
/research:simulation:design "YOUR RESEARCH QUESTION" > design.md

# Step 2: Implement code (30 min)
# [Copy R code template, customize, add error handling]

# Step 3: Pilot run (10 min)
Rscript pilot_simulation.R

# Step 4: Analyze pilot (5 min)
/research:simulation:analysis pilot_results.csv > pilot_analysis.md

# Step 5: Full simulation (2-8 hours)
Rscript full_simulation.R

# Step 6: Final analysis (10 min)
/research:simulation:analysis full_results.csv > final_analysis.md

# Step 7: Methods section (5 min)
/research:manuscript:methods "$(cat design.md)" > methods.md

# Step 8: Results section (10 min)
/research:manuscript:results "$(cat final_analysis.md)" > results.md
```

**Total active time:** ~90 minutes
**Total elapsed time:** 4-12 hours (mostly computation)

---

## Common Issues and Solutions

### Issue 1: Simulation Takes Too Long

**Symptoms:** Estimated runtime > 12 hours

**Solutions:**

1. **Reduce bootstrap replications:**

   ```r
   # Instead of 10,000
   bootstrap_reps <- 5000  # Still gives good precision
   ```

2. **Parallelize more aggressively:**

   ```r
   # Use more cores
   cores <- detectCores() - 1  # Leave one core free
   ```

3. **Reduce design complexity:**

   ```r
   # Fewer levels
   sample_sizes <- c(100, 500)  # Just small and large
   effect_sizes <- c(0, 0.3)    # Just null and medium
   ```

4. **Use cloud computing:**

   ```bash
   # AWS, Google Cloud, or university cluster
   # Can run 100+ cores in parallel
   ```

### Issue 2: Coverage Far from Nominal

**Symptoms:** Coverage < 0.90 or > 0.98

**Solutions:**

1. **Check data generation:**

   ```r
   # Verify true effect is what you think
   mean(alpha * beta)  # Should equal theta
   ```

2. **Check CI calculation:**

   ```r
   # Manually verify one bootstrap sample
   boot_one <- boot(data, statistic = boot_fn, R = 5000)
   boot.ci(boot_one, type = "perc")
   ```

3. **Check coverage indicator:**

   ```r
   # Make sure inequality is correct
   covers <- (true_theta >= ci_lower) & (true_theta <= ci_upper)
   ```

### Issue 3: Too Many NA Results

**Symptoms:** > 5% of results are NA

**Solutions:**

1. **Add error handling:**

   ```r
   tryCatch({
     simulate_mediation(...)
   }, error = function(e) {
     return(list(estimate = NA, error = e$message))
   })
   ```

2. **Check for numerical issues:**

   ```r
   # Standardize variables
   M <- scale(M)
   Y <- scale(Y)
   ```

3. **Increase sample size:**

   ```r
   # Convergence issues in n=50? Try n=100 minimum
   ```

### Issue 4: Methods Don't Differ

**Symptoms:** Bootstrap percentile and BCa give same results

**Solutions:**

1. **Increase effect sizes:**

   ```r
   # Larger effects = more skewness = bigger BCa correction
   effect_sizes <- c(0, 0.3, 0.5, 0.8)
   ```

2. **Add non-normal distributions:**

   ```r
   # BCa helps more with skewed data
   epsilon_M <- rchisq(n, df = 3)
   ```

3. **Use smaller samples:**

   ```r
   # BCa advantage larger in n=50 vs n=500
   sample_sizes <- c(50, 100)
   ```

---

## Next Steps

Congratulations! You've completed your first simulation study.

### Recommended Tutorials

**Continue Learning:**

- [ ] [Results Section Examples](../../examples/results-sections.md) - Report simulation findings
- [ ] [Tutorial: First Literature Search](first-literature-search.md) - Find related simulation studies
- [ ] [Tutorial: Responding to Reviewers](reviewer-response.md) - Defend simulation choices

**Advanced Topics:**

- [ ] [Simulation Study Workflow](../../workflows/research/simulation-study.md)
- [ ] [Simulation Examples](../../examples/simulations.md)
- [ ] [Reproducibility Guide](../../workflows/research/reproducibility.md)

### Share Your Work

**Code Sharing:**

```bash
# Create a GitHub repository
mkdir simulation-study
cd simulation-study
git init
git add *.R *.csv *.md
git commit -m "Initial simulation study"
gh repo create --public
git push
```

**Write It Up:**

- Use methods section from Step 6
- Add results section with `/research:manuscript:results`
- Include figures from Step 4
- Cite relevant simulation studies from literature

### Performance Optimization

**For future simulations:**

1. **Use compiled code:**

   ```r
   library(Rcpp)
   # Write bottleneck functions in C++
   ```

2. **Efficient data structures:**

   ```r
   # Pre-allocate results
   results <- vector("list", length = n_scenarios)
   ```

3. **Profiling:**

   ```r
   library(profvis)
   profvis({
     # Your simulation code
   })
   ```

---

## Success Metrics

After completing this tutorial, you should be able to:

- ⏱️ Design a simulation study in under 10 minutes
- 💻 Generate working R code from templates
- 🧪 Run pilot studies to validate designs
- 📊 Analyze results with proper metrics
- 📈 Create publication-quality visualizations
- 📝 Write methods sections documenting simulations

**Time to mastery:** After 2-3 simulation studies, you should complete the entire workflow (design → analysis → writing) in under 2 hours of active work.

---

## Resources

**Documentation:**

- [Research Commands Reference](../../research/RESEARCH-COMMANDS-REFERENCE.md) - All 14 commands
- [Simulation Commands Guide](../../research/SIMULATION-COMMANDS.md) - Deep dive
- [Quick Reference Card](../../refcards/research-commands.md) - Command cheat sheet

**External Resources:**

- Morris et al. (2019). [Using simulation studies to evaluate statistical methods](https://doi.org/10.1002/sim.8086)
- Burton et al. (2006). [The design of simulation studies in medical statistics](https://doi.org/10.1002/sim.2673)

**Help:**

- [FAQ](../../help/FAQ-research.md) - Common questions
- [GitHub Issues](https://github.com/Data-Wise/scholar/issues) - Report bugs
- [Discussions](https://github.com/Data-Wise/scholar/discussions) - Share simulation studies

---

**Tutorial Complete!** 🎉

You now have the skills to design, implement, analyze, and write up Monte Carlo simulation studies using Scholar's research commands.

**Questions or issues?** See the [FAQ](../../help/FAQ-research.md) section or open an issue on [GitHub](https://github.com/Data-Wise/scholar/issues).

**Share your simulation:** If this tutorial helped you complete a simulation study, consider sharing your code and results in [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions).
