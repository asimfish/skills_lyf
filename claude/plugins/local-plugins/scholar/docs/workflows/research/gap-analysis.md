# Research Gap Analysis Workflow

**Time to Complete:** 3-6 hours
**Difficulty:** Intermediate
**Prerequisites:** Familiarity with Scholar research commands
**Output:** Comprehensive gap analysis document, hypothesis set, research plan

---

## Overview

### What is Research Gap Analysis?

Research gap analysis is the systematic process of identifying unexplored or underexplored areas in the scientific literature. It reveals opportunities for novel contributions by finding:

- **Methodological gaps** - Missing or inadequate statistical methods
- **Application gaps** - Unstudied contexts or populations
- **Theoretical gaps** - Incomplete conceptual frameworks
- **Empirical gaps** - Lack of evidence for existing theories
- **Synthesis gaps** - Missing connections between research streams

A well-executed gap analysis transforms broad research interests into specific, publishable research questions.

---

### Why Gap Analysis Matters for Publications

Journals seek papers that make novel contributions. Gap analysis helps you:

1. **Demonstrate novelty** - Show reviewers exactly what's new
2. **Justify the study** - Explain why the research is needed
3. **Position the work** - Place your contribution in context
4. **Identify target journals** - Match gaps to journal scopes
5. **Strengthen proposals** - Build compelling grant applications

**Impact on manuscript sections:**

- **Introduction** - "Despite extensive research on X, no studies have examined Y"
- **Methods** - "To address this gap, we developed Z approach"
- **Discussion** - "Our findings fill a critical gap by demonstrating..."

---

### Integration with Scholar

Scholar provides AI-powered commands that streamline each phase of gap analysis:

| Phase | Scholar Command | Output |
|-------|----------------|---------|
| Topic exploration | `/research:arxiv` | Recent papers in your area |
| Gap identification | `/research:lit-gap` | Structured gap analysis |
| Hypothesis formation | `/research:hypothesis` | Testable hypotheses with power considerations |
| Method selection | `/research:method-scout` | Statistical methods, R/Python packages |
| Study design | `/research:analysis-plan` | Complete statistical analysis plan |
| Citation management | `/research:bib:add` | Organized bibliography |

These commands work together to create a complete research development pipeline from initial idea to study protocol.

---

## Step 1: Topic Identification

**Time:** 30-60 minutes
**Goal:** Define a focused research area with clear boundaries

### Define Your Research Area

Start broad, then narrow systematically:

```bash
# Example: Starting with "mediation analysis"
Research Area: Causal mediation analysis
├── Broad: Mediation in general
├── Focused: Causal mediation with multiple mediators
└── Specific: Mediation with unmeasured confounding in RCTs
```

### Identify Key Themes

Break your topic into component themes:

**Example: Causal Mediation Analysis**

1. **Methods**: Product-of-coefficients, difference-in-coefficients, weighting
2. **Assumptions**: Sequential ignorability, no unmeasured confounding
3. **Contexts**: RCTs, observational studies, longitudinal designs
4. **Outcomes**: Binary, continuous, time-to-event
5. **Extensions**: Multiple mediators, moderated mediation, sensitivity

### Determine Scope

Set clear boundaries to keep the analysis manageable:

| Dimension | Include | Exclude |
|-----------|---------|---------|
| **Time Period** | Last 10 years (2015-2025) | Older foundational work (cite separately) |
| **Methods** | Frequentist, Bayesian | Machine learning methods (separate review) |
| **Study Designs** | RCTs, observational studies | Case studies, qualitative research |
| **Software** | R, Python, SAS | Proprietary software, closed-source tools |
| **Populations** | Human subjects | Animal studies, simulations-only papers |

**Scholar Command:**

```bash
# Get recent papers to understand current scope
/research:arxiv "causal mediation analysis" --since 2020 --max 20
```

**Expected Output:**

```
Found 18 papers on arXiv since 2020:

1. "Nonparametric Causal Mediation Analysis with High-Dimensional Mediators"
   Authors: Zhang, L., et al.
   arXiv:2401.12345 (2024-01-15)

2. "Sensitivity Analysis for Unmeasured Confounding in Mediation"
   Authors: Smith, A., et al.
   arXiv:2312.54321 (2023-12-20)

[... 16 more papers ...]
```

---

## Step 2: Literature Search

**Time:** 1-2 hours
**Goal:** Systematically collect relevant papers

### Systematic Search Strategy

Use a multi-phase search approach:

#### Phase 1: Core Papers (30 minutes)

```bash
# Search for methodological papers
/research:arxiv "causal mediation methods" --recent --max 15

# Search for specific methods
/research:arxiv "bootstrap mediation indirect effects" --since 2018

# Search for applications
/research:arxiv "mediation analysis unmeasured confounding" --recent
```

#### Phase 2: DOI Lookup for Key Papers (20 minutes)

When you find important papers, get proper citations:

```bash
# Look up specific papers
/research:doi "10.1080/01621459.2020.1765785"
/research:doi "10.1214/aos/1176349847"
/research:doi "10.1037/a0020761"
```

**Example Output:**

```
@article{vanderweele2015explanation,
  title={Explanation in Causal Inference: Methods for Mediation and Interaction},
  author={VanderWeele, Tyler J},
  journal={Journal of the American Statistical Association},
  volume={110},
  number={510},
  pages={1-22},
  year={2015},
  doi={10.1080/01621459.2020.1765785}
}
```

#### Phase 3: Build Bibliography (30 minutes)

Organize citations as you go:

```bash
# Create a new BibTeX file for this project
touch mediation-gaps-references.bib

# Add foundational papers
/research:bib:add pearl2001.bib mediation-gaps-references.bib
/research:bib:add vanderweele2015.bib mediation-gaps-references.bib
/research:bib:add imai2010.bib mediation-gaps-references.bib

# Verify entries
/research:bib:search "mediation" mediation-gaps-references.bib
```

#### Phase 4: Organize by Theme (20 minutes)

Create a literature map:

```markdown
## Literature Map: Causal Mediation Analysis

### Foundational Theory (n=5)
- Pearl (2001) - Counterfactual framework
- Robins & Greenland (1992) - Natural direct/indirect effects
- Baron & Kenny (1986) - Classical mediation
- ...

### Statistical Methods (n=12)
- VanderWeele (2015) - Unified framework
- Imai et al. (2010) - Sequential ignorability
- Preacher & Hayes (2008) - Bootstrap methods
- ...

### Sensitivity Analysis (n=8)
- Imai et al. (2010) - Sensitivity parameters
- VanderWeele (2010) - E-value approach
- Smith et al. (2023) - New sensitivity methods
- ...

### Applications (n=15)
- Psychology: Emotion regulation, therapy outcomes
- Medicine: Treatment mechanisms, drug pathways
- Education: Intervention effects, learning mechanisms
- ...
```

---

## Step 3: Gap Identification

**Time:** 1-2 hours
**Goal:** Systematically identify research opportunities

### Use the `/research:lit-gap` Command

This is the core gap analysis command. Provide rich context:

```bash
/research:lit-gap "Causal mediation analysis in randomized controlled trials with multiple mediators and unmeasured confounding. Current literature focuses on single mediator scenarios with sequential ignorability assumptions. Limited work on sensitivity analysis for multiple mediators simultaneously. Few applications in clinical trials with high-dimensional mediators (e.g., metabolomics, proteomics). Open questions about identifiability, estimation efficiency, and practical implementation."
```

**Expected Output Structure:**

```markdown
## Literature Gap Analysis: Causal Mediation with Multiple Mediators and Unmeasured Confounding

### 1. Methodological Gaps

#### Gap 1.1: Sensitivity Analysis for Multiple Mediators
**Current State:**
- Existing sensitivity methods (Imai et al., 2010; VanderWeele, 2010)
  designed for single mediator scenarios
- No unified framework for assessing confounding across multiple mediators

**Gap:**
- How do sensitivity parameters interact when multiple mediators present?
- What bounds can be placed on indirect effects under complex confounding?
- How to visualize sensitivity across multiple mediation pathways?

**Opportunity:** Develop multivariate sensitivity analysis framework
**Impact:** High - addresses critical limitation in applied research
**Feasibility:** Medium - requires theoretical derivations and simulation validation

#### Gap 1.2: High-Dimensional Mediator Selection
**Current State:**
- Regularization methods (lasso, ridge) applied to mediation
- No consensus on selection criteria (prediction vs. causal inference)

**Gap:**
- When does variable selection preserve valid causal inference?
- How to account for selection uncertainty in indirect effect estimates?
- Post-selection inference for mediated effects?

**Opportunity:** Develop selection-corrected mediation estimators
**Impact:** High - enables omics applications
**Feasibility:** High - can adapt existing post-selection methods

#### Gap 1.3: Bootstrap CI Coverage in Complex Designs
**Current State:**
- Bootstrap percentile method widely used
- Limited evidence for coverage in small samples, non-normal mediators

**Gap:**
- What is the finite-sample performance of different bootstrap approaches?
- When do percentile vs. BCa vs. studentized methods excel?
- How do repeated measures or clustering affect bootstrap validity?

**Opportunity:** Large-scale simulation comparing bootstrap methods
**Impact:** Medium - improves applied practice
**Feasibility:** High - simulation study with existing methods


### 2. Application Gaps

#### Gap 2.1: Clinical Trials with Biomarker Mediators
**Current State:**
- Few published mediation analyses in Phase III trials
- Regulatory guidance unclear on mediation evidence standards

**Gap:**
- How to design RCTs with pre-specified mediation hypotheses?
- What sample size needed for adequately powered mediation analysis?
- How to handle missing mediator data in intent-to-treat framework?

**Opportunity:** Case studies from completed trials with reanalysis
**Impact:** High - bridges methods and practice
**Feasibility:** Medium - requires industry collaboration


### 3. Theoretical Gaps

#### Gap 3.1: Identifiability Under Mediator-Outcome Confounding
**Current State:**
- Sequential ignorability rules out M-Y confounding
- Instrumental variable methods require strong assumptions

**Gap:**
- Can weaker assumptions identify subsets of mediation effects?
- What are the sharpest bounds under partial identification?
- How to combine multiple weak instruments?

**Opportunity:** Develop partial identification framework
**Impact:** High - relaxes strong assumptions
**Feasibility:** Low - requires advanced theory


### 4. Emerging Trends

#### Trend 4.1: Machine Learning for Mediation
**Current Work:**
- Double machine learning applied to mediation (Chernozhukov et al.)
- Causal forests for heterogeneous mediation

**Opportunity:**
- Combine ML flexibility with sensitivity analysis
- Develop interpretable ML mediation methods
- Cross-validation approaches for mediator selection


### 5. Synthesis Gaps

#### Gap 5.1: No Unified Software Implementation
**Current State:**
- R packages: mediation, medflex, causalweight
- Each implements different subset of methods
- Inconsistent syntax and output formats

**Gap:**
- Comprehensive package comparing multiple estimators
- Automated sensitivity analysis reporting
- Publication-ready output tables and figures

**Opportunity:** Develop {mediationverse} R package ecosystem
**Impact:** High - improves reproducibility and adoption
**Feasibility:** High - software development project


## Summary: Top 3 High-Impact Gaps

1. **Multivariate Sensitivity Analysis** - Critical methodological need
2. **High-Dimensional Mediator Selection** - Enables modern biomarker studies
3. **Unified Software Implementation** - Improves research reproducibility

**Recommended Focus:** Start with #2 (high impact, high feasibility)
while developing theory for #1 in parallel.
```

### Analyze Gap Types Systematically

Classify each identified gap:

| Gap Type | Description | Example | Publication Outlet |
|----------|-------------|---------|-------------------|
| **Methodological** | Missing statistical methods | New estimator, test, CI method | JASA, Biometrics, Biometrika |
| **Application** | Unstudied contexts | Clinical trials, education, policy | JAMA, *Psychological Methods* |
| **Theoretical** | Incomplete proofs, bounds | Identifiability conditions, efficiency | *Annals of Statistics*, *JRSS-B* |
| **Computational** | Software, algorithms | R packages, efficient computation | *JSS*, *R Journal*, *JCGS* |
| **Synthesis** | Literature reviews, comparisons | Systematic review, method comparison | *Statistical Science*, *AnnRev* |

### Prioritization Matrix

Rank gaps by impact and feasibility:

```
High Impact    │ □ Multivariate sensitivity  │ ■ High-dim selection     │
               │   (Low feasibility)         │   (High feasibility)     │
               │                            │                          │
───────────────┼────────────────────────────┼──────────────────────────┤
               │ □ Partial identification   │ ■ Bootstrap comparison   │
Low Impact     │   (Low feasibility)        │   (High feasibility)     │
               │                            │                          │
               └────────────────────────────┴──────────────────────────┘
                 Low Feasibility              High Feasibility

■ = Recommended Focus
□ = Future Work
```

---

## Step 4: Hypothesis Generation

**Time:** 30-60 minutes
**Goal:** Transform gaps into testable hypotheses

### Use the `/research:hypothesis` Command

For each prioritized gap, generate specific hypotheses:

```bash
/research:hypothesis "High-dimensional mediator selection in causal mediation analysis. Investigate whether regularization methods (lasso, elastic net) can select true mediators while preserving valid inference on indirect effects. Study design: Monte Carlo simulation comparing lasso-based mediation with traditional single-mediator analysis. Sample sizes 100, 200, 500. Number of candidate mediators: 50, 100, 200. Sparse truth: 3-5 true mediators."
```

**Expected Output:**

```markdown
## Research Hypotheses: High-Dimensional Mediator Selection

### Primary Hypothesis

**H₁: Regularization-based mediator selection improves estimation efficiency**

**Formal Statement:**
Let θ̂_lasso denote the indirect effect estimated using lasso-selected mediators,
and θ̂_full denote the estimate using all candidate mediators. We hypothesize:

H₀: MSE(θ̂_lasso) ≥ MSE(θ̂_full)
H₁: MSE(θ̂_lasso) < MSE(θ̂_full)

**Rationale:** Lasso should reduce variance by excluding noise variables while
maintaining low bias if true mediators are selected with high probability.


### Secondary Hypotheses

#### H₂: Selection Probability Depends on Signal Strength
**Statement:**
P(true mediator selected | effect size δ) is monotone increasing in δ

**Test:**
Logistic regression of selection indicator on true effect size across
simulation conditions

**Expected Pattern:**
- Small effects (δ < 0.1): Selection probability < 0.5
- Medium effects (0.1 ≤ δ < 0.3): Selection probability 0.5-0.8
- Large effects (δ ≥ 0.3): Selection probability > 0.8


#### H₃: Coverage Degrades Without Selection Correction
**Statement:**
95% CI coverage for selected mediators without correction: < 0.90

**Test:**
Calculate empirical coverage rates:
- Naive CI (ignore selection): Expected coverage ≈ 0.85
- Selection-corrected CI: Expected coverage ≈ 0.95

**Method:**
Post-selection inference (PoSI) approach or data splitting


#### H₄: Elastic Net Outperforms Pure Lasso with Correlated Mediators
**Statement:**
When mediators are correlated (ρ > 0.5), elastic net (α = 0.5) achieves
better selection accuracy than lasso (α = 1)

**Test:**
Compare selection accuracy (sensitivity/specificity) across α values

**Conditions:**
- Correlation structures: Independent, AR(1) with ρ = 0.3, 0.5, 0.7
- Elastic net mixing: α ∈ {0.1, 0.5, 0.9, 1.0}


### Test Procedures

#### Power Analysis
**Effect Size:** Medium (Cohen's f² = 0.15)
**Alpha Level:** 0.05
**Power Target:** 0.80
**Sample Size:** n = 200 provides adequate power for primary hypothesis

**Calculation:**
```r
library(pwr)
pwr.f2.test(u = 4, f2 = 0.15, sig.level = 0.05, power = 0.80)
# Required n ≈ 180 per condition
```

#### Statistical Tests

1. **Primary:** Paired t-test comparing MSE across methods
2. **H₂:** Logistic regression with effect size predictor
3. **H₃:** One-sample proportion test (H₀: coverage = 0.95)
4. **H₄:** Two-sample comparison of selection accuracy (McNemar's test)

### Performance Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Bias** | E[θ̂] - θ | < 0.05 |
| **MSE** | E[(θ̂ - θ)²] | Minimize |
| **Coverage** | P(θ ∈ CI) | 0.93-0.97 |
| **Sensitivity** | P(select | true mediator) | > 0.80 |
| **Specificity** | P(exclude | noise variable) | > 0.90 |
| **FDR** | E[FP / (FP + TP)] | < 0.10 |

### Sample Size Considerations

**Simulation Replications:** 1,000 per condition
**Conditions:** 3 (n) × 3 (p) × 2 (correlation) = 18 total
**Total Datasets:** 18,000

**Computational Cost:**

- Estimation time per dataset: ~2 seconds
- Total time: 18,000 × 2s = 36,000s ≈ 10 hours
- Recommend: Parallel processing on 10 cores → 1 hour

### Expected Challenges

1. **Tuning parameter selection:** CV may be unstable in small samples
   - *Mitigation:* Compare CV, AIC, BIC for λ selection

2. **Post-selection inference:** Complex CI construction
   - *Mitigation:* Use {selectiveInference} R package

3. **Multiple testing:** Many hypotheses tested per simulation
   - *Mitigation:* Bonferroni correction or FDR control

```

### Formulate Testable Hypotheses

Convert each hypothesis into a specific, testable form:

**Template:**
```

Research Question: [What do you want to know?]
   ↓
Hypothesis: [What do you expect?]
   ↓
Null Hypothesis H₀: [Statement to reject]
Alternative H₁: [What you're testing for]
   ↓
Test Procedure: [How will you test it?]
   ↓
Decision Rule: [When do you reject H₀?]

```

**Example:**
```

RQ: Do bootstrap CIs have better coverage than asymptotic CIs for small samples?
   ↓
Hypothesis: Bootstrap percentile CIs maintain nominal coverage in small samples
   ↓
H₀: Coverage_bootstrap ≤ 0.90
H₁: Coverage_bootstrap > 0.93 (within 2% of nominal 95%)
   ↓
Test: Monte Carlo simulation, n=50, 1000 reps, calculate empirical coverage
   ↓
Decision: Reject H₀ if 95% CI for coverage excludes 0.90

```

### Power Considerations

For each hypothesis, assess statistical power:

```bash
# Add power analysis to hypothesis generation
/research:hypothesis "... [hypothesis] ... Target power: 0.80, alpha: 0.05, expected effect size: Cohen's d = 0.4"
```

**Power Analysis Checklist:**

- [ ] Effect size specified (small/medium/large or numeric)
- [ ] Alpha level stated (typically 0.05)
- [ ] Power target set (typically 0.80)
- [ ] Sample size calculated or justified
- [ ] Sensitivity analysis for effect size uncertainty

---

## Step 5: Analysis Planning

**Time:** 1-2 hours
**Goal:** Create a complete statistical analysis plan

### Use the `/research:analysis-plan` Command

Transform hypotheses into detailed analysis protocols:

```bash
/research:analysis-plan "Monte Carlo simulation study comparing lasso-based mediator selection with full-model mediation analysis. Primary outcome: mean squared error of indirect effect estimates. Secondary outcomes: selection accuracy (sensitivity/specificity), CI coverage, computational time. Sample sizes: 100, 200, 500. Number of candidate mediators: 50, 100, 200. True mediators: 3-5 with effect sizes sampled from N(0.3, 0.1). 1000 replications per condition. Analysis: two-way ANOVA for MSE with factors (sample size, number of mediators), visualizations showing performance across conditions."
```

**Expected Output:**

```markdown
## Statistical Analysis Plan: Lasso-Based Mediator Selection Study

### 1. Study Overview

**Study Type:** Monte Carlo simulation study
**Objective:** Compare lasso-based mediator selection with full-model mediation
**Design:** 3×3 factorial (sample size × number of mediators)
**Replications:** 1,000 per condition
**Total Datasets:** 9,000


### 2. Simulation Parameters

#### Design Factors
| Factor | Levels | Values |
|--------|--------|--------|
| Sample size (n) | 3 | 100, 200, 500 |
| Candidate mediators (p) | 3 | 50, 100, 200 |
| True mediators (k) | 1 | 5 (fixed) |

#### Data Generation Process

**Step 1: Generate Covariates**
```r
# Treatment assignment (randomized)
Z <- rbinom(n, 1, 0.5)

# Candidate mediators (multivariate normal)
Sigma <- toeplitz(0.3^(0:(p-1)))  # AR(1) correlation
M <- MASS::mvrnorm(n, mu = rep(0, p), Sigma = Sigma)
```

**Step 2: Specify True Causal Structure**

```r
# Select k=5 true mediators randomly
true_mediators <- sample(1:p, size = 5)

# True effects (treatment → mediators)
alpha <- rep(0, p)
alpha[true_mediators] <- rnorm(5, mean = 0.3, sd = 0.1)

# Add treatment effects to mediators
M <- M + Z %*% t(alpha)
```

**Step 3: Generate Outcome**

```r
# True mediator effects
beta <- rep(0, p)
beta[true_mediators] <- rnorm(5, mean = 0.3, sd = 0.1)

# Outcome model
Y <- 0.5 * Z +  # Direct effect
     M %*% beta +  # Mediated effects
     rnorm(n, sd = 1)  # Noise
```

**True Indirect Effect:**

```r
theta_true <- sum(alpha[true_mediators] * beta[true_mediators])
```

### 3. Analysis Methods

#### Method 1: Lasso Selection + Bootstrap Mediation

```r
# Step 1: Lasso for mediator selection
library(glmnet)
cv_fit <- cv.glmnet(M, Y, alpha = 1)
selected <- which(coef(cv_fit)[-1] != 0)

# Step 2: Mediation analysis on selected mediators
library(mediation)
if (length(selected) > 0) {
  M_selected <- M[, selected, drop = FALSE]
  fit_m <- lm(M_selected ~ Z)
  fit_y <- lm(Y ~ Z + M_selected)
  med_fit <- mediate(fit_m, fit_y, treat = "Z", mediator = colnames(M_selected))
  theta_lasso <- med_fit$d0  # Indirect effect
  ci_lasso <- c(med_fit$d0.ci[1], med_fit$d0.ci[2])
} else {
  theta_lasso <- 0
  ci_lasso <- c(0, 0)
}
```

#### Method 2: Full-Model Mediation (Oracle)

```r
# Use all mediators
fit_m_full <- lm(M ~ Z)
fit_y_full <- lm(Y ~ Z + M)
med_full <- mediate(fit_m_full, fit_y_full, treat = "Z", mediator = "M")
theta_full <- med_full$d0
ci_full <- c(med_full$d0.ci[1], med_full$d0.ci[2])
```

#### Method 3: True-Model Mediation (Gold Standard)

```r
# Use only true mediators (oracle knowledge)
M_true <- M[, true_mediators]
fit_m_true <- lm(M_true ~ Z)
fit_y_true <- lm(Y ~ Z + M_true)
med_true <- mediate(fit_m_true, fit_y_true, treat = "Z", mediator = "M_true")
theta_oracle <- med_true$d0
ci_oracle <- c(med_true$d0.ci[1], med_true$d0.ci[2])
```

### 4. Performance Metrics

For each method in each replication, calculate:

#### Primary Outcome: Mean Squared Error

```r
MSE <- mean((theta_hat - theta_true)^2)
```

#### Secondary Outcomes

**Bias:**

```r
Bias <- mean(theta_hat - theta_true)
```

**Variance:**

```r
Variance <- var(theta_hat)
```

**Coverage (95% CI):**

```r
Coverage <- mean(ci_lower <= theta_true & theta_true <= ci_upper)
```

**Selection Accuracy:**

```r
Sensitivity <- length(intersect(selected, true_mediators)) / length(true_mediators)
Specificity <- sum(!(1:p %in% selected) & !(1:p %in% true_mediators)) / (p - length(true_mediators))
FDR <- sum(selected %in% setdiff(1:p, true_mediators)) / max(length(selected), 1)
```

### 5. Primary Analysis

#### Analysis 1: Two-Way ANOVA for MSE

**Model:**

```r
anova_fit <- aov(MSE ~ factor(n) * factor(p) * method, data = results)
summary(anova_fit)
```

**Hypotheses:**

- H₀: No main effect of method on MSE
- H₁: Lasso-based method reduces MSE vs. full-model

**Decision Rule:** Reject H₀ if p < 0.05 for method main effect

#### Analysis 2: Pairwise Comparisons

**Post-hoc tests:**

```r
library(emmeans)
emm <- emmeans(anova_fit, ~ method | n + p)
pairs(emm, adjust = "bonferroni")
```

### 6. Secondary Analyses

#### Analysis S1: Coverage Comparison

```r
# One-sample proportion tests
binom.test(sum(coverage_lasso >= 0.93), n_reps, p = 0.95)
binom.test(sum(coverage_full >= 0.93), n_reps, p = 0.95)
```

#### Analysis S2: Selection Performance

```r
# Sensitivity/specificity across conditions
selection_results <- results %>%
  group_by(n, p) %>%
  summarize(
    mean_sensitivity = mean(sensitivity),
    mean_specificity = mean(specificity),
    mean_fdr = mean(fdr)
  )
```

#### Analysis S3: Computational Efficiency

```r
# Compare computation times
wilcox.test(time_lasso, time_full, paired = TRUE)
```

### 7. Sensitivity Analyses

#### S1: Alternative Correlation Structures

Repeat simulation with:

- Independent mediators (Σ = I)
- Compound symmetry (Σ_ij = 0.5 for i ≠ j)
- Block structure (high correlation within blocks)

#### S2: Non-normal Distributions

Replace normal errors with:

- t-distribution (df = 5) - heavy tails
- Skewed distribution (gamma, log-normal)

#### S3: Missing Data

Introduce MAR missingness in mediators:

- 10%, 20%, 30% missing
- Multiple imputation vs. complete-case analysis

### 8. Visualization Plan

#### Figure 1: MSE by Sample Size and Method

```r
ggplot(results, aes(x = n, y = MSE, color = method)) +
  geom_line(stat = "summary", fun = mean) +
  geom_point(stat = "summary", fun = mean) +
  facet_wrap(~ p, labeller = label_both) +
  scale_x_continuous(trans = "log10") +
  labs(title = "MSE Comparison Across Conditions",
       x = "Sample Size", y = "Mean Squared Error",
       color = "Method")
```

#### Figure 2: Coverage Rates Heatmap

```r
coverage_summary <- results %>%
  group_by(n, p, method) %>%
  summarize(coverage = mean(in_ci))

ggplot(coverage_summary, aes(x = factor(n), y = factor(p), fill = coverage)) +
  geom_tile() +
  facet_wrap(~ method) +
  scale_fill_gradient2(low = "red", mid = "yellow", high = "green",
                       midpoint = 0.95, limits = c(0.85, 1)) +
  labs(title = "95% CI Coverage Rates", x = "Sample Size", y = "# Mediators")
```

#### Figure 3: Selection Accuracy (Sensitivity vs. Specificity)

```r
ggplot(results_lasso, aes(x = 1 - specificity, y = sensitivity)) +
  geom_point(aes(color = factor(n)), alpha = 0.3) +
  geom_abline(slope = 1, linetype = "dashed") +
  facet_wrap(~ p) +
  labs(title = "Selection Performance (ROC-style)",
       x = "False Positive Rate", y = "True Positive Rate",
       color = "Sample Size")
```

### 9. Reporting Plan

#### Table 1: Performance Summary

| Method | n | p | Bias | MSE | Coverage | Sensitivity | Specificity |
|--------|---|---|------|-----|----------|-------------|-------------|
| Lasso | 100 | 50 | ... | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... | ... | ... |

#### Table 2: ANOVA Results

| Source | df | F | p-value | η² |
|--------|----|----|---------|-----|
| Method | 2 | ... | ... | ... |
| n | 2 | ... | ... | ... |
| p | 2 | ... | ... | ... |
| Method × n | 4 | ... | ... | ... |
| ... | ... | ... | ... | ... |

### 10. Software & Reproducibility

**R Packages:**

```r
library(glmnet)      # v4.1-8 - Lasso regression
library(mediation)   # v4.5.0 - Mediation analysis
library(MASS)        # v7.3-60 - Multivariate normal
library(tidyverse)   # v2.0.0 - Data manipulation
library(emmeans)     # v1.8.9 - Post-hoc tests
```

**Reproducibility:**

```r
set.seed(20260131)  # Set seed for reproducibility
sessionInfo()       # Record R and package versions
```

**Code Repository:** GitHub (https://github.com/user/lasso-mediation-sim)
**Data Archiving:** OSF (https://osf.io/xxxxx/)

### 11. Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Week 1** | 5 days | Code development, testing, debugging |
| **Week 2** | 3 days | Pilot simulation (100 reps) |
| **Week 3** | 7 days | Full simulation (parallel processing) |
| **Week 4** | 5 days | Analysis, visualization, interpretation |
| **Week 5** | 5 days | Manuscript writing |
| **Total** | 5 weeks | From design to draft manuscript |

### 12. Power & Sample Size

**Simulation Replications:**

- Minimum: 1,000 per condition for stable MSE estimates
- Monte Carlo SE for MSE ≈ SD(MSE²) / √(1000) ≈ 0.03
- Adequate precision for detecting 10% MSE reduction

**Effect Size:**

- Expected MSE reduction: 15-20%
- Detectable with n=1000 reps per condition at α=0.05, power=0.90

```

### Specify Analysis Components

Ensure your plan includes:

**Checklist:**
- [ ] **Primary analysis** clearly stated
- [ ] **Secondary analyses** listed
- [ ] **Sensitivity analyses** planned
- [ ] **Statistical tests** specified with decision rules
- [ ] **Multiple testing correction** addressed (if applicable)
- [ ] **Software/packages** identified with versions
- [ ] **Reproducibility** plan (seeds, code sharing)
- [ ] **Visualization** plan (figures/tables)
- [ ] **Timeline** estimated
- [ ] **Power/sample size** justified

---

## Step 6: Method Scouting

**Time:** 30-60 minutes
**Goal:** Identify statistical methods and software implementations

### Use the `/research:method-scout` Command

Find methods, packages, and papers for implementation:

```bash
/research:method-scout "High-dimensional mediation analysis with regularization. Need R packages for lasso-based variable selection in mediation models, post-selection inference methods, and bootstrap confidence intervals. Interested in recent methodological papers (2018-2025) comparing different selection approaches."
```

**Expected Output:**

```markdown
## Method Scouting: High-Dimensional Mediation with Regularization

### Recommended Methods

#### Method 1: Lasso-Penalized Mediation (High Priority)
**Approach:** Apply lasso regression for mediator selection, then estimate indirect effects

**R Packages:**
1. **`{glmnet}`** - Lasso/elastic net regression
   - Function: `cv.glmnet()` for cross-validation
   - Version: 4.1-8 (CRAN)
   - Citation: Friedman et al. (2010) JSS

2. **`{hdi}`** - Post-selection inference
   - Function: `lasso.proj()` for selection-corrected CIs
   - Version: 0.1-9 (CRAN)
   - Citation: Dezeure et al. (2015) EJS

3. **`{mediation}`** - Causal mediation analysis
   - Function: `mediate()` for indirect effects
   - Version: 4.5.0 (CRAN)
   - Citation: Tingley et al. (2014) JSS

**Implementation Steps:**
```r
# Step 1: Lasso for mediator selection
library(glmnet)
cv_fit <- cv.glmnet(x = M, y = Y, alpha = 1)
selected_mediators <- which(coef(cv_fit, s = "lambda.min")[-1] != 0)

# Step 2: Post-selection inference
library(hdi)
post_sel <- lasso.proj(x = M, y = Y, family = "gaussian")

# Step 3: Mediation analysis on selected mediators
library(mediation)
fit_m <- lm(M[, selected_mediators] ~ Z)
fit_y <- lm(Y ~ Z + M[, selected_mediators])
med_result <- mediate(fit_m, fit_y, treat = "Z",
                      mediator = names(selected_mediators))
```

**Key Papers:**

- Chernozhukov et al. (2018). "Double/debiased machine learning for treatment and structural parameters." *Econometrics Journal*, 21(1), C1-C68.
- Dezeure et al. (2015). "High-dimensional inference: Confidence intervals, p-values and R-package hdi." *Electronic Journal of Statistics*, 9, 2969-3034.

#### Method 2: HIMA (High-dimensional Mediation Analysis) (Medium Priority)

**Approach:** Joint variable selection and indirect effect estimation

**R Package:**

- **`{HIMA}`** - High-dimensional mediation
  - Function: `hima()` for joint selection/estimation
  - Version: 2.2.1 (CRAN)
  - Citation: Zhang et al. (2021) Bioinformatics

**Advantages:**

- Designed specifically for mediation with many mediators
- Handles false discovery rate control
- Computationally efficient for p >> n

**Implementation:**

```r
library(HIMA)
result <- hima(X = Z, Y = Y, M = M,
               penalty = "MCP",  # Or "SCAD", "lasso"
               scale = TRUE,
               verbose = TRUE)

# Extract significant mediators
sig_mediators <- result$alpha * result$beta  # Indirect effects
```

**Key Paper:**

- Zhang, H., Zheng, Y., Zhang, Z., Gao, T., Joyce, B., Yoon, G., ... & Hou, L. (2016). "Estimating and testing high-dimensional mediation effects in epigenetic studies." *Bioinformatics*, 32(20), 3150-3154.

#### Method 3: Stability Selection for Mediation (Lower Priority)

**Approach:** Repeated subsampling + lasso to improve selection stability

**R Package:**

- **`{stabs}`** - Stability selection
  - Function: `stabsel()` for stable variable selection
  - Version: 0.6-4 (CRAN)
  - Citation: Hofner et al. (2015) JMLR

**Implementation:**

```r
library(stabs)
library(glmnet)

# Stability selection for mediators
stab_result <- stabsel(x = M, y = Y,
                       fitfun = glmnet.lasso,
                       cutoff = 0.75,  # Selection frequency threshold
                       PFER = 1)       # Per-family error rate

selected_stable <- which(stab_result$selected)
```

**Key Paper:**

- Meinshausen, N., & Bühlmann, P. (2010). "Stability selection." *JRSS-B*, 72(4), 417-473.

### Alternative Approaches

#### Bayesian Variable Selection

**R Package:** `{MBSGS}` - Mediation analysis via Bayesian sparse group selection

**When to Use:**

- Prior information available about mediator groups
- Want posterior probabilities of mediation pathways
- Small to moderate p (< 500)

**Implementation:**

```r
library(MBSGS)
result <- MBSGS(Z = Z, M = M, Y = Y,
                niter = 10000, burnin = 5000)
posterior_prob <- result$post_prob_mediation
```

#### Machine Learning Approaches

**R Package:** `{causalweight}` - Double machine learning for mediation

**When to Use:**

- Non-linear relationships suspected
- Want to avoid parametric assumptions
- Large sample size (n > 500)

### Comparison Table

| Method | Package | Selection | Inference | Complexity | Best For |
|--------|---------|-----------|-----------|------------|----------|
| Lasso + Mediation | `glmnet` + `mediation` | Yes | Bootstrap | Medium | General use |
| HIMA | `HIMA` | Yes | Asymptotic | Low | Omics data |
| Post-Selection | `hdi` | No | Valid CIs | High | Correct inference |
| Stability Selection | `stabs` | Yes | None | Medium | Stable selection |
| Bayesian | `MBSGS` | Yes | Posterior | High | Prior knowledge |

### Recommended Workflow

1. **Exploratory Phase:** Use `HIMA` for fast screening
2. **Primary Analysis:** Lasso selection via `glmnet`
3. **Inference:** Post-selection correction via `hdi`
4. **Validation:** Stability selection via `stabs`
5. **Sensitivity:** Compare with Bayesian approach

### Methodological Papers (2018-2025)

**Recent Reviews:**

1. VanderWeele, T.J. (2020). "Optimal approximate conversions of odds ratios and hazard ratios to risk ratios." *Biometrics*, 76(3), 746-752.

**Comparison Studies:**
2. Zhao, Y., & Luo, X. (2022). "Pathway lasso: Pathway estimation and selection with high-dimensional mediators." *Statistics in Medicine*, 41(12), 2359-2373.

**New Methods:**
3. Tai, A.S., et al. (2023). "High-dimensional mediation analysis for selecting DNA methylation loci mediating childhood trauma and cortisol stress reactivity." *Journal of the American Statistical Association*, 118(541), 1-13.

### Software Recommendations Summary

**For Your Project (High-Dimensional Mediation):**

**Primary Toolchain:**

```r
install.packages(c("glmnet", "mediation", "hdi", "HIMA"))
```

**Analysis Pipeline:**

1. `glmnet::cv.glmnet()` - Select mediators
2. `mediation::mediate()` - Estimate indirect effects
3. `hdi::lasso.proj()` - Corrected confidence intervals
4. `HIMA::hima()` - Sensitivity analysis

**Expected Computation Time:**

- n=200, p=100: ~5 seconds per dataset
- n=500, p=200: ~15 seconds per dataset

```

### Evaluate Methods

Create a comparison matrix:

| Method | Pros | Cons | When to Use |
|--------|------|------|-------------|
| Lasso | Fast, interpretable | Biased estimates | Screening, p >> n |
| Post-selection | Valid inference | Computationally expensive | Final analysis |
| Stability selection | Robust to perturbations | No inference | Exploratory |
| Bayesian | Uncertainty quantification | Requires priors, slow | Rich prior information |

---

## Complete Workflow Example

**Scenario:** Finding gaps in causal mediation literature to design a new simulation study

**Timeline:** One afternoon (4 hours)

### Step-by-Step with Commands

#### Hour 1: Topic Exploration & Scoping (30 min exploration + 30 min reading)

```bash
# Define topic
TOPIC="causal mediation analysis with multiple mediators"

# Initial arXiv search
/research:arxiv "$TOPIC" --since 2020 --max 20 --output literature/initial-search.md

# Broad method scouting to understand landscape
/research:method-scout "multiple mediator analysis methods" --output literature/methods-landscape.md
```

**Actions:**

- Read abstracts from initial-search.md
- Identify 3-5 key papers
- Note recurring themes and gaps mentioned in papers

#### Hour 2: Gap Analysis & Hypothesis Development (45 min gap analysis + 15 min synthesis)

```bash
# Focused gap analysis based on Hour 1 reading
/research:lit-gap "Causal mediation analysis with multiple mediators. Current methods assume sequential ignorability and often analyze mediators separately. Limited work on joint modeling of correlated mediators, sensitivity analysis for complex confounding structures, and high-dimensional mediator settings common in genomics." --output analysis/gap-analysis.md

# Generate hypotheses for top 2-3 gaps
/research:hypothesis "Joint modeling of correlated mediators improves efficiency over separate analyses. Study design: Simulation comparing joint vs. separate estimation with varying mediator correlation (ρ = 0, 0.3, 0.6, 0.9). Sample sizes 100, 200, 500." --output analysis/hypothesis-joint-modeling.md

/research:hypothesis "Sensitivity analysis for unmeasured confounding in multiple mediator models. Extend single-mediator sensitivity parameters to multivariate case. Test via simulation with varying confounding strength." --output analysis/hypothesis-sensitivity.md
```

**Actions:**

- Review gap-analysis.md
- Select 1-2 gaps to pursue (feasibility + impact)
- Refine hypotheses based on initial formulations

#### Hour 3: Method Selection & Analysis Planning (30 min methods + 30 min planning)

```bash
# Scout methods for top hypothesis (joint modeling)
/research:method-scout "multivariate mediation analysis correlated mediators R packages" --output methods/joint-modeling-methods.md

# Create detailed analysis plan
/research:analysis-plan "Monte Carlo simulation study comparing joint vs. separate mediation analysis. Primary outcome: MSE of total indirect effect. Design: 3 sample sizes (100, 200, 500) × 4 correlation levels (0, 0.3, 0.6, 0.9) × 2 methods (joint, separate). 1000 replications per condition. Data generation: Multivariate normal mediators with specified correlation structure, treatment randomized, outcome linear in mediators." --output plans/simulation-analysis-plan.md
```

**Actions:**

- Review available R packages
- Confirm methods are implementable
- Validate analysis plan completeness

#### Hour 4: Citation Management & Synthesis (30 min citations + 30 min writeup)

```bash
# Get key papers as BibTeX
/research:doi "10.1037/a0020761"  # Preacher & Hayes bootstrap
/research:doi "10.1080/01621459.2020.1765785"  # VanderWeele 2015
/research:doi "10.1198/016214508000000878"  # Imai et al. 2010

# Save to project bibliography
/research:bib:add pearl2001.bib references.bib
/research:bib:add vanderweele2015.bib references.bib
/research:bib:add imai2010.bib references.bib
/research:bib:add preacher2008.bib references.bib

# Search for any existing sensitivity analysis work
/research:bib:search "sensitivity" references.bib
```

**Final Actions:**

- Organize all generated files into project structure
- Write 1-page executive summary
- Create prioritized next steps list

**Output Structure:**

```
mediation-gap-analysis/
├── literature/
│   ├── initial-search.md
│   └── methods-landscape.md
├── analysis/
│   ├── gap-analysis.md
│   ├── hypothesis-joint-modeling.md
│   └── hypothesis-sensitivity.md
├── methods/
│   └── joint-modeling-methods.md
├── plans/
│   └── simulation-analysis-plan.md
├── references.bib
└── EXECUTIVE-SUMMARY.md
```

---

## Best Practices

### Systematic Approach

**Do:**

- ✅ Follow a structured process (don't skip steps)
- ✅ Document all searches and decisions
- ✅ Maintain bibliography as you go
- ✅ Prioritize gaps by impact × feasibility
- ✅ Generate multiple hypotheses, then narrow

**Don't:**

- ❌ Jump directly to hypothesis without gap analysis
- ❌ Ignore feasibility constraints
- ❌ Overlook existing solutions in literature
- ❌ Forget to save intermediate outputs
- ❌ Neglect power/sample size considerations

### Documentation

Keep a research journal documenting:

```markdown
## Research Gap Analysis Journal

**Date:** 2026-01-31
**Topic:** High-dimensional mediation analysis

### Session 1: Initial Exploration
- Searched arXiv for "high-dimensional mediation" (18 results)
- Key themes: lasso selection, sensitivity analysis, omics applications
- Noted gap: no unified software for multiple methods

### Session 2: Gap Deep Dive
- Used `/research:lit-gap` to structure analysis
- Identified 3 high-priority gaps:
  1. Post-selection inference for mediation
  2. Correlated mediator handling
  3. Software integration

### Decision: Focus on #1 (post-selection)
- Reason: High impact, medium feasibility, clear path to publication
- Target journal: JASA or Biometrics
```

### Citation Management

**Best Practices:**

1. **Single source of truth** - One main `.bib` file per project
2. **Immediate capture** - Add entries as you find papers
3. **Consistent format** - Use `/research:doi` for standardization
4. **Deduplicate regularly** - Run `/research:bib:search` before adding
5. **Backup** - Version control your `.bib` file

**File Naming:**

```
project-name-references.bib  # Main bibliography
project-name-todo.bib        # Papers to read
project-name-excluded.bib    # Screened out papers
```

### Iterative Refinement

Gap analysis is not one-and-done:

**Iteration Cycle:**

```
Round 1: Broad exploration (4 hours)
   ↓
Round 2: Focused deep dive on top 2 gaps (2 hours)
   ↓
Round 3: Hypothesis refinement + pilot data (2 hours)
   ↓
Round 4: Full analysis plan + power analysis (2 hours)
```

**When to iterate:**

- New papers published in your area
- Reviewer feedback suggests different gaps
- Pilot results reveal unexpected issues
- Collaborator input identifies missed opportunities

---

## Integration with Other Workflows

### Link to Manuscript Workflow

Gap analysis feeds directly into manuscript introduction:

**Template:**

```markdown
## Introduction

### Background (Literature Review)
[Synthesize existing work from Step 2]

### Research Gap (Gap Analysis Output)
Despite extensive research on [topic], three critical gaps remain:

1. **Methodological Gap** - [From Step 3]
   [Evidence from literature]

2. **Application Gap** - [From Step 3]
   [Evidence from literature]

### Study Objectives (Hypothesis → Objectives)
To address these gaps, we conducted a [study type] with three objectives:

1. [Hypothesis 1 → Objective 1]
2. [Hypothesis 2 → Objective 2]
```

**Scholar Command:**

```bash
# Use gap analysis to write introduction
/research:manuscript:methods "$(cat analysis/gap-analysis.md)" --section introduction
```

### Connect with Simulation Design

Gap analysis informs simulation parameters:

```bash
# Gap analysis identifies need to study small samples
# → Simulation includes n = 50, 100, 200

# Gap analysis shows debate about CI methods
# → Simulation compares percentile, BCa, studentized bootstrap

# Direct pipeline:
cat analysis/hypothesis-joint-modeling.md | \
  /research:simulation:design --input - --output simulation-design.R
```

### Feed into Methods Development

For methodological gaps requiring new estimators:

**Workflow:**

```
Gap Analysis → Hypothesis → Methods Development → Simulation → Paper

Step 1: /research:lit-gap "missing methods"
Step 2: /research:hypothesis "new estimator properties"
Step 3: Develop statistical methodology
Step 4: /research:simulation:design "validate new method"
Step 5: /research:manuscript:methods "write methodology"
```

---

## Common Patterns by Gap Type

### Methodological Gaps

**Pattern: "Method X exists for simple case, but not complex case"**

Example:

- Gap: Bootstrap CIs for single mediator, not multiple
- Hypothesis: Extend bootstrap to joint null distribution
- Method: Multivariate percentile bootstrap
- Validation: Simulation comparing to asymptotic theory

**Scholar Workflow:**

```bash
/research:lit-gap "single vs. multiple mediator bootstrap methods"
/research:hypothesis "multivariate bootstrap maintains coverage"
/research:method-scout "multivariate bootstrap R packages"
/research:simulation:design "compare univariate vs. multivariate bootstrap"
```

### Application Gaps

**Pattern: "Method used in field A, not applied to field B"**

Example:

- Gap: Mediation widely used in psychology, rare in genomics
- Hypothesis: High-dimensional mediation reveals biological mechanisms
- Method: Apply HIMA to metabolomics data
- Validation: Real data application + simulation

**Scholar Workflow:**

```bash
/research:lit-gap "mediation in genomics vs. psychology"
/research:hypothesis "metabolomics mediates treatment-outcome relationship"
/research:method-scout "high-dimensional mediation genomics"
/research:analysis-plan "metabolomics mediation analysis protocol"
```

### Extension Opportunities

**Pattern: "Method A and Method B exist separately, combining them would be useful"**

Example:

- Gap: Sensitivity analysis exists; variable selection exists; not combined
- Hypothesis: Can perform valid sensitivity analysis after selection
- Method: Post-selection sensitivity bounds
- Validation: Theoretical derivation + simulation

**Scholar Workflow:**

```bash
/research:lit-gap "combining sensitivity analysis with variable selection"
/research:hypothesis "selection-corrected sensitivity parameters"
/research:method-scout "post-selection inference methods"
/research:manuscript:proof "derive selection-corrected sensitivity bounds"
```

### Synthesis Needs

**Pattern: "Many methods exist, no comparison or guidance"**

Example:

- Gap: 5+ bootstrap methods for mediation, no clear recommendations
- Hypothesis: Performance varies by sample size, distribution, effect size
- Method: Comprehensive simulation comparison
- Validation: Real data validation across multiple datasets

**Scholar Workflow:**

```bash
/research:lit-gap "bootstrap mediation methods comparison"
/research:hypothesis "bootstrap method performance depends on context"
/research:method-scout "all bootstrap mediation packages"
/research:simulation:design "comprehensive bootstrap comparison study"
```

---

## Tips for Success

### Balance Breadth and Depth

**Breadth (Week 1):**

- Cast wide net in literature search
- Explore adjacent research areas
- Read abstracts and conclusions only
- Create broad literature map

**Depth (Week 2):**

- Focus on 3-5 key papers per gap
- Read methods sections carefully
- Trace citations backward and forward
- Understand technical details

**Scholar Strategy:**

```bash
# Week 1: Breadth
/research:arxiv "topic" --since 2015 --max 50  # Wide search
/research:lit-gap "broad topic area"  # Identify many gaps

# Week 2: Depth
/research:arxiv "specific gap" --recent --max 10  # Narrow search
/research:method-scout "specific technical approach"  # Deep dive
/research:manuscript:proof "key technical result"  # Understand details
```

### Prioritize Recent vs. Foundational Work

**Foundational Papers (Always Cite):**

- Seminal theoretical papers
- First introduction of methods
- Highly cited classics (>500 citations)

**Recent Papers (Focus on Gaps):**

- Last 5 years for active research areas
- Last 2 years for fast-moving fields (ML, genomics)
- Last year for emerging topics

**Search Strategy:**

```bash
# Foundational: No date filter, sort by citations
/research:arxiv "topic" --max 20  # Gets most cited

# Recent: Strict date filter
/research:arxiv "topic" --since 2023 --recent  # Gets cutting-edge

# Gap identification: Focus on recent
/research:lit-gap "topic [based on 2020-2025 literature]"
```

### Focus on Emerging vs. Established Areas

**Emerging Areas (Higher Risk, Higher Reward):**

- Rapid growth in publications (>30% year-over-year)
- Few established leaders
- Methods still being developed
- High uncertainty but high novelty potential

**Established Areas (Lower Risk, Incremental Progress):**

- Slow, steady publication rate
- Clear methodological consensus
- Well-studied problems
- Lower novelty threshold but safer bets

**How to Identify:**

```bash
# Check publication trends
/research:arxiv "topic" --since 2020 | wc -l  # Count 2020-2025
/research:arxiv "topic" --since 2015 | wc -l  # Count 2015-2020

# If ratio > 1.5, emerging area
# If ratio ≈ 1, established area
```

### Balance Practical vs. Theoretical Gaps

**Practical Gaps (Applied Journals):**

- Software implementation needs
- Computational efficiency
- Ease of use, interpretation
- Real data applications

**Target Journals:** *Biometrics*, *Statistics in Medicine*, *Epidemiology*

**Theoretical Gaps (Methodological Journals):**

- Asymptotic properties
- Identifiability conditions
- Efficiency bounds
- Novel estimators

**Target Journals:** *Annals of Statistics*, *JASA*, *JRSS-B*

**Scholar Approach:**

```bash
# Practical focus
/research:lit-gap "computational barriers in mediation software"
/research:method-scout "user-friendly mediation packages"

# Theoretical focus
/research:lit-gap "identifiability of mediation effects"
/research:manuscript:proof "efficiency bounds for indirect effects"
```

**Hybrid Strategy (Best for JASA, Biometrics):**

- Develop theory (Sections 2-3)
- Validate in simulation (Section 4)
- Apply to real data (Section 5)
- Provide software (Supplement)

---

## Troubleshooting

### Issue: Gap analysis too broad/unfocused

**Symptom:** `/research:lit-gap` returns generic, obvious gaps

**Solution:**

```bash
# Add specific context and constraints
/research:lit-gap "Causal mediation analysis [SPECIFIC CONTEXT: in RCTs with binary outcomes and multiple correlated mediators]. Existing work [WHAT EXISTS: assumes single mediator or independent mediators]. Gap [SPECIFIC GAP: joint modeling of correlated mediators with binary outcomes]."
```

### Issue: No obvious gaps found

**Symptom:** Literature seems complete, no clear research opportunities

**Solution:**

1. **Look for synthesis gaps:** Compare methods that haven't been compared
2. **Check adjacent fields:** Methods from one area applicable to another
3. **Examine assumptions:** Can restrictive assumptions be relaxed?
4. **Software gaps:** Are methods implemented? User-friendly?

```bash
# Search for comparison studies
/research:arxiv "comparison mediation methods" --recent

# If few/none found → synthesis gap exists
/research:lit-gap "lack of comprehensive comparison of mediation methods"
```

### Issue: Too many gaps, can't prioritize

**Symptom:** Gap analysis identifies 10+ opportunities

**Solution:** Use prioritization matrix

| Gap | Impact | Feasibility | Priority |
|-----|--------|-------------|----------|
| Gap 1: Sensitivity analysis | High | Medium | **P1** |
| Gap 2: Software package | Medium | High | **P1** |
| Gap 3: Theoretical bounds | High | Low | P2 |
| Gap 4: New application | Medium | Medium | P2 |
| Gap 5: Review paper | Low | High | P3 |

**Decision Rule:**

- **P1 (Pursue now):** High impact + High feasibility, OR High impact + Medium feasibility
- **P2 (Pursue later):** Everything else worth doing
- **P3 (Low priority):** Low impact regardless of feasibility

### Issue: Hypotheses are not testable

**Symptom:** Vague hypotheses like "Method A is better than B"

**Solution:** Make testable with specific metrics

**Bad:**

```
H: Lasso-based mediation is better than full-model mediation
```

**Good:**

```
H₀: MSE(θ̂_lasso) ≥ MSE(θ̂_full)
H₁: MSE(θ̂_lasso) < MSE(θ̂_full) by at least 10%

Test: Two-sided paired t-test on log(MSE) across simulation conditions
Decision: Reject H₀ if p < 0.05 AND mean difference > 0.1
```

### Issue: Analysis plan missing details

**Symptom:** `/research:analysis-plan` output too high-level

**Solution:** Add explicit details to prompt

```bash
/research:analysis-plan "
Study: [DESIGN]
Primary outcome: [SPECIFIC METRIC]
Sample sizes: [EXACT VALUES]
Conditions: [ALL FACTORS WITH LEVELS]
Replications: [NUMBER]
Statistical tests: [SPECIFIC TESTS WITH DECISION RULES]
Software: [PACKAGES AND VERSIONS]
Timeline: [WEEKS FOR EACH PHASE]
"
```

---

## Related Resources

### Documentation

- [Research Commands Index](../../research/index.md) - Overview of all research commands
- [Literature Management Guide](../../research/LITERATURE-COMMANDS.md) - arXiv, DOI, BibTeX tools
- [Simulation Study Workflow](simulation-study.md) - From design to manuscript
- [Manuscript Writing Workflow](manuscript-writing.md) - Methods, results, reviewer responses

### Tutorials

- [First Literature Search](../../tutorials/research/first-literature-search.md) - 15-minute intro
- [Manuscript Writing Tutorial](../../tutorials/research/manuscript-writing.md) - Complete 6-phase workflow

### Reference Cards

- [Research Commands Quick Reference](../../refcards/research-commands.md) - TL;DR for all commands

### Help

- [Research FAQ](../../help/FAQ-research.md) - Common questions
- [Common Issues](../../help/COMMON-ISSUES.md#research-commands) - Troubleshooting

---

## Next Steps

After completing gap analysis:

1. **Present to advisor/collaborators** (1-2 weeks)
   - Share gap-analysis.md
   - Discuss priorities
   - Get feedback on feasibility

2. **Pilot study** (2-4 weeks)
   - Implement methods from Step 6
   - Run small simulation (100 reps)
   - Validate approach

3. **Full study** (4-8 weeks)
   - Follow analysis plan from Step 5
   - Scale up simulations
   - Analyze results

4. **Manuscript writing** (8-12 weeks)
   - Use `/research:manuscript:methods`
   - Use `/research:manuscript:results`
   - Submit to target journal

**Complete Pipeline:**

```bash
# Today: Gap analysis (this guide)
./gap-analysis-workflow.sh

# Week 2: Pilot simulation
/research:simulation:design "pilot study" --output pilot-design.R
Rscript pilot-design.R --reps 100

# Week 6: Full simulation
/research:simulation:design "full study" --output full-design.R
Rscript full-design.R --reps 1000

# Week 10: Manuscript
/research:manuscript:methods "$(cat full-design.R)" > methods.md
/research:manuscript:results "$(cat results.csv)" > results.md
```

---

**Last Updated:** 2026-01-31
**Version:** v2.8.0
**Estimated Reading Time:** 30 minutes
**Estimated Completion Time:** 4-6 hours
