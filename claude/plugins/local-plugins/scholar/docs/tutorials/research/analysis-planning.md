---
render_macros: false
---

# Creating Statistical Analysis Plans

A comprehensive tutorial for developing rigorous, pre-registered analysis plans for empirical research.

**Learning Objectives**: By the end of this tutorial, you will be able to:
- Create comprehensive statistical analysis plans (SAPs)
- Use Scholar's `/research:analysis-plan` command effectively
- Specify statistical models with clarity and precision
- Plan sensitivity analyses systematically
- Pre-register analysis plans on OSF or protocols.io
- Implement analysis plans reproducibly in R
- Avoid common planning pitfalls

**Prerequisites**:
- Intermediate statistics knowledge
- Understanding of your research design
- Familiarity with R for data analysis
- Scholar plugin installed (v2.5.0+)

**⏱️ Estimated Time**: 45-60 minutes

---

## Table of Contents

1. [Why Analysis Plans Matter](#why-plans-matter)
2. [The Analysis Planning Process](#planning-process)
3. [Step 1: Define Analysis Objectives](#step-1)
4. [Step 2: Use Scholar's Planning Command](#step-2)
5. [Step 3: Specify Statistical Models](#step-3)
6. [Step 4: Plan Sensitivity Analyses](#step-4)
7. [Step 5: Pre-Register Your Plan](#step-5)
8. [Step 6: Implement in R](#step-6)
9. [Analysis Plans for Different Study Types](#study-types)
10. [Integration with OSF and Protocols.io](#integration)
11. [Best Practices for Reproducibility](#best-practices)
12. [Common Planning Pitfalls](#common-pitfalls)
13. [Troubleshooting](#troubleshooting)
14. [Next Steps](#next-steps)

---

## Why Analysis Plans Matter {#why-plans-matter}

### The Problem: Researcher Degrees of Freedom

Without a pre-specified plan, researchers face countless decisions during analysis:
- Which variables to include?
- How to handle outliers?
- What transformations to apply?
- Which covariates to adjust for?
- How to deal with missing data?

These decisions, made after seeing the data, can lead to:
- **P-hacking**: Trying multiple analyses until finding p < 0.05
- **HARKing**: Hypothesizing After Results are Known
- **Selective Reporting**: Publishing only "significant" findings

### The Solution: Pre-Registration

A statistical analysis plan (SAP) is a detailed document specifying:
1. Research questions and hypotheses
2. Statistical models and estimands
3. Variable definitions and transformations
4. Missing data handling strategies
5. Sensitivity analyses
6. Multiple testing corrections

**Benefits**:
- Increases transparency and credibility
- Distinguishes confirmatory from exploratory analyses
- Protects against unconscious bias
- Makes replication easier
- Required by many journals and funders

### Real-World Impact

Studies show that pre-registered analyses:
- Have smaller effect sizes (less publication bias)
- Are more likely to replicate
- Receive higher credibility ratings
- Are increasingly required for publication

---

## The Analysis Planning Process {#planning-process}

```
Research Question → Primary Analysis → Secondary Analyses
       ↓                    ↓                 ↓
  Estimands        Statistical Models    Sensitivity Tests
       ↓                    ↓                 ↓
Pre-Registration ← Documentation ← Implementation Plan
```

### Timeline

| Phase | When | Duration | Activities |
|-------|------|----------|------------|
| **Planning** | Before data collection | 2-5 hours | Define objectives, specify models |
| **Pre-Registration** | Before seeing data | 30-60 min | Upload to OSF/protocols.io |
| **Implementation** | After data collection | Varies | Code analysis scripts |
| **Execution** | With data | Varies | Run pre-specified analyses |
| **Reporting** | After analysis | 1-2 hours | Document deviations |

### Key Principle: Lock in Decisions Early

The closer you are to seeing the data, the more bias can creep in. Plan as much as possible before data collection begins.

---

## Step 1: Define Analysis Objectives {#step-1}

### Types of Research Objectives

**1. Confirmatory (Hypothesis-Testing)**
- Pre-specified hypotheses
- Primary outcome clearly defined
- Statistical significance testing
- Example: "Does cognitive behavioral therapy reduce depression symptoms?"

**2. Exploratory (Hypothesis-Generating)**
- Open-ended questions
- Multiple outcomes considered
- Focus on effect size estimation
- Example: "What factors predict treatment response?"

**3. Descriptive**
- Characterize population
- No formal hypothesis
- Report frequencies, means, associations
- Example: "What is the prevalence of anxiety disorders in medical students?"

### Exercise: Classify Your Study

**Research Question**: "Does a mindfulness intervention improve academic performance in college students?"

**Classify each objective**:

| Objective | Type | Rationale |
|-----------|------|-----------|
| Primary: Does mindfulness improve GPA? | Confirmatory | Pre-specified hypothesis with primary outcome |
| Secondary: Does effect vary by stress level? | Confirmatory | Pre-planned moderation analysis |
| Exploratory: What other outcomes are affected? | Exploratory | Open-ended, multiple outcomes |

### Specify Your Estimands

**Estimand**: The quantity you want to estimate (the "target" of inference)

**Examples**:

```
Confirmatory:
- Average Treatment Effect (ATE): E[Y(1) - Y(0)]
- Risk Ratio: P(Y = 1 | X = 1) / P(Y = 1 | X = 0)
- Hazard Ratio: HR = h1(t) / h0(t)

Exploratory:
- Correlation matrix among stress measures
- Predictors of treatment dropout
- Subgroup-specific treatment effects
```

**Template**:

```
Primary Estimand:
- Parameter: Average treatment effect on GPA
- Population: Full-time undergraduates at University X
- Contrast: Post-intervention GPA (mindfulness) vs. Control
- Scale: Raw GPA points (0-4.0 scale)
```

---

## Step 2: Use Scholar's Planning Command {#step-2}

Now we'll use Scholar to create a structured analysis plan.

### Basic Command Usage

```bash
/research:analysis-plan
```

This launches an interactive session to build your plan.

### Example: RCT Analysis Plan

Let's plan an analysis for a randomized controlled trial:

```bash
/research:analysis-plan
```

**Scholar's Questions and Your Responses**:

```
Q: What is your research question?
A: Does an 8-week mindfulness intervention improve academic performance
   compared to waitlist control in undergraduate students?

Q: What type of study is this?
A: Randomized controlled trial (RCT)

Q: What is your primary outcome?
A: End-of-semester GPA (continuous, 0-4.0 scale)

Q: What is your primary predictor/exposure?
A: Treatment assignment (mindfulness vs. waitlist control)

Q: Planned sample size?
A: N = 200 (100 per arm)

Q: What covariates will you adjust for?
A: - Baseline GPA
   - Gender
   - Year in school
   - Baseline stress score (PSS-10)

Q: What secondary outcomes will you examine?
A: - Stress levels (PSS-10)
   - Sleep quality (PSQI)
   - Study hours per week

Q: Planned sensitivity analyses?
A: - Per-protocol analysis (exclude non-compliers)
   - Complete case analysis (no imputation)
   - Adjustment for multiple testing (Bonferroni)
```

### Generated Output

Scholar creates a comprehensive markdown document:

````markdown
# Statistical Analysis Plan: Mindfulness RCT

**Study Title**: Mindfulness Intervention for Academic Performance
**Principal Investigator**: [Your Name]
**Date Created**: 2026-02-01
**Version**: 1.0
**Registration**: OSF (pending)

---

## 1. Study Overview

### 1.1 Research Question
Does an 8-week mindfulness intervention improve academic performance
compared to waitlist control in undergraduate students?

### 1.2 Study Design
- **Design**: Parallel-group randomized controlled trial
- **Randomization**: 1:1 allocation to mindfulness or waitlist control
- **Blinding**: Outcome assessors blinded to treatment assignment
- **Duration**: 8 weeks intervention + 1 semester follow-up

### 1.3 Sample
- **Population**: Full-time undergraduate students at University X
- **Target N**: 200 (100 per arm)
- **Recruitment**: Campus-wide email, flyers, psychology courses
- **Eligibility**: See inclusion/exclusion criteria below

---

## 2. Outcomes and Variables

### 2.1 Primary Outcome
**Variable**: End-of-semester GPA
- **Type**: Continuous
- **Scale**: 0-4.0 (standard US GPA scale)
- **Source**: Registrar records
- **Timing**: Assessed at end of spring semester (Week 16)

### 2.2 Secondary Outcomes

| Outcome | Measure | Scale | Timing |
|---------|---------|-------|--------|
| Stress | PSS-10 | 0-40 (higher = more stress) | Baseline, Week 8, Week 16 |
| Sleep Quality | PSQI | 0-21 (higher = worse sleep) | Baseline, Week 8, Week 16 |
| Study Hours | Self-report | Hours per week | Baseline, Week 8, Week 16 |

### 2.3 Covariates

| Variable | Type | Coding | Missingness Strategy |
|----------|------|--------|----------------------|
| Baseline GPA | Continuous | 0-4.0 | Exclude if missing (eligibility) |
| Gender | Categorical | Male / Female / Other | No missing expected |
| Year in School | Ordinal | 1, 2, 3, 4+ | No missing expected |
| Baseline Stress | Continuous | PSS-10 score | Mean imputation if < 5% missing |

---

## 3. Statistical Hypotheses

### 3.1 Primary Hypothesis
**H0**: μ_mindfulness - μ_control = 0 (no difference in GPA)
**HA**: μ_mindfulness - μ_control ≠ 0 (two-sided test)
**α**: 0.05 (two-tailed)

### 3.2 Secondary Hypotheses
1. Mindfulness reduces stress (PSS-10) at Week 8
2. Mindfulness improves sleep quality (PSQI) at Week 8
3. Effect on GPA is moderated by baseline stress

---

## 4. Statistical Analysis Plan

### 4.1 Primary Analysis

**Model**: ANCOVA (Analysis of Covariance)

```r
lm(gpa_final ~ treatment + gpa_baseline + gender + year + stress_baseline,
   data = analysis_data)
```

**Estimand**: Adjusted mean difference in final GPA between treatment arms

**Interpretation**:
- Coefficient for `treatment` = average treatment effect, adjusted for covariates
- 95% CI and p-value reported
- Effect size: Cohen's d computed from adjusted means

**Assumptions**:
- Linearity: Examine residual plots
- Homoscedasticity: Levene's test
- Normality: Q-Q plots, Shapiro-Wilk if needed
- Independence: Verified by randomization

**Diagnostics**:
- Check for influential points (Cook's distance > 1)
- Examine residuals for outliers (|residual| > 3 SD)
- Test covariate balance between arms

### 4.2 Secondary Analyses

**Analysis 1: Stress Reduction**

```r
lm(stress_week8 ~ treatment + stress_baseline + gender + year,
   data = analysis_data)
```

**Analysis 2: Sleep Quality**

```r
lm(psqi_week8 ~ treatment + psqi_baseline + gender + year,
   data = analysis_data)
```

**Analysis 3: Moderation by Baseline Stress**

```r
lm(gpa_final ~ treatment * stress_baseline + gpa_baseline + gender + year,
   data = analysis_data)
```

- Test interaction term: `treatment:stress_baseline`
- If significant (p < 0.05), probe at ±1 SD of stress

### 4.3 Adjustment for Multiple Testing

**Method**: Bonferroni correction
- Primary analysis: No adjustment (single primary outcome)
- Secondary analyses: Adjust α for 3 tests → α = 0.05 / 3 = 0.0167

---

## 5. Missing Data

### 5.1 Expected Missingness
- Anticipated dropout: ~15% by Week 16
- Mechanism: Missing At Random (MAR) assumed

### 5.2 Handling Strategy

**Primary Analysis**: Multiple imputation
- Method: Predictive mean matching (PMM)
- Imputations: m = 20
- Model: Include treatment, baseline covariates, auxiliary variables
- Software: `mice` package in R

**Sensitivity Analysis**: Complete case analysis
- Report if conclusions differ from imputed analysis

### 5.3 Reporting
- Flowchart showing dropout by arm (CONSORT diagram)
- Comparison of completers vs. dropouts on baseline characteristics
- Results from both imputed and complete case analyses

---

## 6. Sensitivity Analyses

### 6.1 Per-Protocol Analysis
- **Definition**: Exclude participants with < 6/8 session attendance
- **Rationale**: Test intervention efficacy among compliers
- **Comparison**: Compare to intent-to-treat results

### 6.2 Outlier Robustness
- **Method**: Winsorize GPA values > 3 SD from mean
- **Comparison**: Re-run primary analysis with winsorized data

### 6.3 Alternative Model Specifications
- **Model 1**: Add interaction between baseline GPA and treatment
- **Model 2**: Include quadratic term for baseline stress
- **Model 3**: Include compliance (session attendance) as covariate

---

## 7. Subgroup Analyses (Exploratory)

**Note**: These are hypothesis-generating only, not pre-specified hypotheses.

| Subgroup | Variable | Test |
|----------|----------|------|
| Gender | Male vs. Female vs. Other | Interaction term |
| Year | Underclassmen (1-2) vs. Upperclassmen (3-4+) | Interaction |
| Baseline Stress | Low (< 20) vs. High (≥ 20) | Interaction |

**Reporting**: Clearly label as exploratory, report effect sizes and CIs (not p-values)

---

## 8. Sample Size and Power

### 8.1 Primary Analysis
- **Target**: N = 200 (100 per arm)
- **Effect Size**: Cohen's d = 0.4 (medium effect)
- **Power**: 80% to detect d = 0.4 at α = 0.05 (two-tailed)
- **Calculation**: G*Power 3.1, ANCOVA with 4 covariates

### 8.2 Minimum Detectable Effect
- With N = 200 and 80% power: MDES = 0.40
- With 15% dropout (N = 170): MDES = 0.43

---

## 9. Deviations from Plan

Any deviations from this pre-registered plan will be documented and justified in the final manuscript. Examples of acceptable deviations:

- **Discovered data issues**: e.g., GPA scale changed mid-study
- **Violated assumptions**: e.g., non-normality requires transformation
- **Higher missingness**: e.g., COVID-19 impact on data collection

All deviations will be reported transparently.

---

## 10. Software and Code

### 10.1 Software Versions
- R version: 4.3.2
- Key packages: `tidyverse`, `mice`, `emmeans`, `effectsize`

### 10.2 Reproducibility
- Analysis code available at: [GitHub repository URL]
- Simulated data for code verification available
- Random seeds set for all stochastic procedures

---

## Appendix A: R Code Template

```r
# ============================================================================
# Analysis Script: Mindfulness RCT
# ============================================================================

# Load packages
library(tidyverse)
library(mice)
library(emmeans)
library(effectsize)

# Set seed for reproducibility
set.seed(20260201)

# ----------------------------------------------------------------------------
# 1. Load and Prepare Data
# ----------------------------------------------------------------------------

data <- read_csv("mindfulness_data.csv")

# Recode variables
data <- data %>%
  mutate(
    treatment = factor(treatment, levels = c("control", "mindfulness")),
    gender = factor(gender),
    year = as.integer(year)
  )

# ----------------------------------------------------------------------------
# 2. Descriptive Statistics
# ----------------------------------------------------------------------------

# Baseline characteristics table
table1::table1(~ gpa_baseline + gender + year + stress_baseline | treatment,
               data = data)

# ----------------------------------------------------------------------------
# 3. Missing Data Analysis
# ----------------------------------------------------------------------------

# Missingness pattern
md.pattern(data)

# Multiple imputation
imputed <- mice(data, m = 20, method = "pmm", seed = 123)

# ----------------------------------------------------------------------------
# 4. Primary Analysis
# ----------------------------------------------------------------------------

# Fit model on each imputed dataset
fit_primary <- with(imputed, {
  lm(gpa_final ~ treatment + gpa_baseline + gender + year + stress_baseline)
})

# Pool results
pooled <- pool(fit_primary)
summary(pooled)

# Extract treatment effect
emmeans(pooled, specs = "treatment", data = data)

# ----------------------------------------------------------------------------
# 5. Sensitivity Analysis: Complete Case
# ----------------------------------------------------------------------------

complete_data <- data %>% drop_na()

fit_complete <- lm(
  gpa_final ~ treatment + gpa_baseline + gender + year + stress_baseline,
  data = complete_data
)

summary(fit_complete)
```
````

---

## Step 3: Specify Statistical Models {#step-3}

### Anatomy of a Model Specification

Every statistical model in your plan should include:

1. **Model Equation**: Mathematical formula
2. **Variables**: Outcome, predictors, covariates
3. **Distributional Assumptions**: Link function, error distribution
4. **Estimand**: What you're estimating
5. **Software**: R function or package

### Example: Linear Regression

**Scenario**: Examining association between exercise and mental health.

**Full Specification**:

```
Model: Linear Regression

Equation:
  mental_health_score = β0 + β1*exercise_hours + β2*age + β3*gender + ε

Variables:
  - Outcome: Mental health score (continuous, 0-100, higher = better)
  - Predictor: Exercise hours per week (continuous)
  - Covariates: Age (continuous), Gender (categorical: M/F/Other)

Assumptions:
  - Linear relationship between predictors and outcome
  - Errors normally distributed: ε ~ N(0, σ²)
  - Homoscedasticity: constant variance across fitted values
  - Independence: observations are independent

Estimand:
  β1 = Change in mental health score per 1-hour increase in weekly exercise,
       adjusting for age and gender

Software:
  lm(mental_health ~ exercise_hours + age + gender, data = data)

Diagnostics:
  - Residual plots for linearity and homoscedasticity
  - Q-Q plot for normality
  - VIF < 5 for multicollinearity
```

### Example: Logistic Regression

**Scenario**: Predicting treatment adherence (binary outcome).

**Full Specification**:

```
Model: Logistic Regression

Equation:
  logit(P(adherent = 1)) = β0 + β1*motivation + β2*age + β3*previous_adherence

Variables:
  - Outcome: Treatment adherence (binary: 0 = non-adherent, 1 = adherent)
  - Predictors:
    * Motivation score (continuous, 1-7 scale)
    * Age (continuous, years)
    * Previous adherence (binary: 0/1)

Assumptions:
  - Linearity of log-odds
  - Independence of observations
  - No perfect multicollinearity

Estimand:
  - OR for motivation: Odds ratio for adherence per 1-point motivation increase
  - Interpretation: OR > 1 means higher motivation increases adherence odds

Software:
  glm(adherent ~ motivation + age + previous_adherence,
      family = binomial(link = "logit"),
      data = data)

Diagnostics:
  - Hosmer-Lemeshow goodness-of-fit test
  - ROC curve and AUC
  - Leverage and influence diagnostics
```

### Example: Mixed-Effects Model

**Scenario**: Longitudinal data with repeated measures.

**Full Specification**:

```
Model: Linear Mixed-Effects Model

Equation:
  Y_ij = (β0 + b0_i) + (β1 + b1_i)*time_ij + β2*treatment_i +
         β3*treatment_i*time_ij + ε_ij

  Where:
    Y_ij = outcome for person i at time j
    b0_i ~ N(0, σ²_b0) = random intercept
    b1_i ~ N(0, σ²_b1) = random slope
    ε_ij ~ N(0, σ²_ε) = residual error

Variables:
  - Outcome: Depression score (continuous, 0-63)
  - Time: Weeks since baseline (0, 4, 8, 12)
  - Treatment: Intervention vs. Control (fixed effect)

Random Effects:
  - Random intercept: Individual baseline differences
  - Random slope for time: Individual growth trajectories

Estimand:
  β3 = Treatment effect on rate of change (interaction)
  - Positive β3: Intervention group improves faster

Software:
  library(lme4)
  lmer(depression ~ time * treatment + (1 + time | subject_id),
       data = long_data)

Diagnostics:
  - Residual plots by subject
  - Random effects distribution (Q-Q plots)
  - Check convergence warnings
```

### Creating a Model Comparison Table

When you have multiple candidate models, plan your comparison strategy:

| Model | Equation | AIC | BIC | R² | Notes |
|-------|----------|-----|-----|-----|-------|
| M1: Unadjusted | Y ~ treatment | - | - | - | Baseline |
| M2: + Demographics | Y ~ treatment + age + gender | - | - | - | Demographic adjustment |
| M3: + Baseline Y | Y ~ treatment + age + gender + Y_baseline | - | - | - | **Primary model** |
| M4: + Interaction | Y ~ treatment * Y_baseline + age + gender | - | - | - | Moderation test |

**Pre-specify**:
- Which model is primary (M3 in this case)
- Criteria for model selection (lowest BIC, interpretability)
- How to report model comparisons

---

## Step 4: Plan Sensitivity Analyses {#step-4}

### What Are Sensitivity Analyses?

Sensitivity analyses test the robustness of your conclusions to:
- Analytical decisions (model specification)
- Assumptions (normality, linearity)
- Missing data mechanisms
- Outliers or influential points

### Types of Sensitivity Analyses

#### 1. Missing Data Methods

**Primary Analysis**: Multiple imputation (assumes MAR)

**Sensitivity Tests**:
- Complete case analysis (assumes MCAR)
- Pattern mixture models (explore MNAR)
- Tipping point analysis (how much MNAR bias needed to change conclusion?)

```r
# Complete case
fit_complete <- lm(Y ~ X, data = data %>% drop_na())

# Compare to imputed results
summary(fit_complete)
summary(fit_imputed)
```

#### 2. Outlier Handling

**Primary Analysis**: All data included

**Sensitivity Tests**:
- Exclude observations with |studentized residual| > 3
- Winsorize at 1st and 99th percentiles
- Robust regression (M-estimation)

```r
# Identify outliers
outliers <- which(abs(rstudent(fit)) > 3)

# Exclude outliers
fit_no_outliers <- update(fit, subset = -outliers)

# Robust regression
library(MASS)
fit_robust <- rlm(Y ~ X, data = data)
```

#### 3. Model Specification

**Primary Analysis**: Linear model with chosen covariates

**Sensitivity Tests**:
- Add/remove covariates
- Include interaction terms
- Non-linear terms (polynomials, splines)

```r
# Add quadratic term
fit_quadratic <- lm(Y ~ X + I(X^2), data = data)

# Add interaction
fit_interaction <- lm(Y ~ X * Z, data = data)
```

#### 4. Assumption Violations

**Primary Analysis**: Assumes normality

**Sensitivity Tests**:
- Non-parametric tests (e.g., Mann-Whitney U)
- Bootstrap confidence intervals
- Permutation tests

```r
# Non-parametric test
wilcox.test(Y ~ group, data = data)

# Bootstrap CI
library(boot)
boot_mean <- function(data, indices) {
  mean(data[indices, "Y"])
}
boot_results <- boot(data, boot_mean, R = 10000)
boot.ci(boot_results)
```

### Pre-Specify Your Sensitivity Analyses

**Template**:

```markdown
## Sensitivity Analyses

### 1. Missing Data
**Primary**: Multiple imputation (m = 20, PMM method)
**Sensitivity**: Complete case analysis
**Decision Rule**: If conclusions differ, prioritize imputed results
                   unless > 30% missingness

### 2. Outliers
**Primary**: Include all data
**Sensitivity**: Exclude observations with Cook's D > 1 OR |studentized residual| > 3
**Decision Rule**: If > 5 influential points change conclusion, report both

### 3. Covariate Adjustment
**Primary**: Adjust for age, gender, baseline outcome
**Sensitivity**:
  - Model A: Unadjusted
  - Model B: + socioeconomic status
  - Model C: + comorbidities
**Decision Rule**: Report all models, use primary for inference

### 4. Effect Modifiers
**Primary**: No moderation assumed
**Sensitivity**: Test treatment × baseline_severity interaction
**Decision Rule**: If p_interaction < 0.05, report subgroup effects
```

---

## Step 5: Pre-Register Your Plan {#step-5}

### Why Pre-Register?

Pre-registration creates a timestamped, publicly available record of your analysis plan before seeing the outcome data.

**Benefits**:
- Distinguishes confirmatory from exploratory findings
- Prevents p-hacking and HARKing
- Increases trust in your results
- Many journals now require or encourage pre-registration

### Platforms for Pre-Registration

| Platform | Best For | URL |
|----------|----------|-----|
| **OSF** | General research, free | https://osf.io |
| **AsPredicted** | Quick pre-registration | https://aspredicted.org |
| **ClinicalTrials.gov** | Clinical trials (required in US) | https://clinicaltrials.gov |
| **Protocols.io** | Detailed protocols with versioning | https://protocols.io |

### Pre-Registration on OSF

#### Step 1: Create OSF Account

1. Go to https://osf.io
2. Create free account
3. Verify email

#### Step 2: Create New Project

```
Click "Create new project"
  → Title: "Mindfulness RCT Analysis Plan"
  → Description: "Pre-registered analysis plan for..."
  → Category: Project
  → Click "Create"
```

#### Step 3: Upload Analysis Plan

```
In project page:
  → Files tab
  → Upload "analysis_plan.md" (from Scholar)
  → Add description: "Statistical Analysis Plan v1.0"
```

#### Step 4: Register

```
Click "Registrations" tab
  → "New Registration"
  → Choose template: "OSF Preregistration"
  → Fill out form (or attach your SAP)
  → Review
  → "Register" (creates timestamped, immutable copy)
```

#### Step 5: Get DOI

```
After registration:
  → Click "Create DOI"
  → Cite in manuscript: "Analysis plan pre-registered at https://osf.io/xxxxx"
```

### Pre-Registration Checklist

Before submitting your registration:

- [ ] Research question clearly stated
- [ ] Hypotheses are directional (if applicable)
- [ ] Primary outcome explicitly defined
- [ ] Sample size and power calculation included
- [ ] Statistical models fully specified
- [ ] Missing data handling described
- [ ] Sensitivity analyses planned
- [ ] Subgroup analyses labeled as exploratory
- [ ] Timeline indicates plan was registered BEFORE data access

---

## Step 6: Implement in R {#step-6}

### Translating Your Plan to Code

Once data collection is complete, implement your pre-registered plan in R.

### Project Structure

```
mindfulness-rct/
├── data/
│   ├── raw/
│   │   └── participant_data.csv
│   └── processed/
│       └── analysis_data.csv
├── scripts/
│   ├── 01_data_cleaning.R
│   ├── 02_descriptives.R
│   ├── 03_primary_analysis.R
│   ├── 04_secondary_analyses.R
│   └── 05_sensitivity_analyses.R
├── output/
│   ├── figures/
│   └── tables/
├── docs/
│   └── analysis_plan_preregistered.md
├── README.md
└── renv.lock  # For reproducibility
```

### Script Template: Primary Analysis

```r
# ============================================================================
# Primary Analysis: Mindfulness RCT
# Pre-registered plan: https://osf.io/xxxxx
# ============================================================================

# Setup ----
library(tidyverse)
library(mice)
library(emmeans)
library(effectsize)

# Set seed (from pre-registration)
set.seed(20260201)

# Load data ----
data <- read_csv("data/processed/analysis_data.csv")

# Verify sample size matches plan ----
stopifnot(nrow(data) >= 170)  # Minimum after dropout

# Verify variables exist ----
required_vars <- c("gpa_final", "treatment", "gpa_baseline",
                   "gender", "year", "stress_baseline")
stopifnot(all(required_vars %in% names(data)))

# ============================================================================
# PRIMARY ANALYSIS (Pre-Registered)
# ============================================================================

# 1. Multiple Imputation ----
# (As specified in pre-registration: m = 20, PMM method)

imputation_model <- mice(
  data = data,
  m = 20,
  method = "pmm",
  seed = 12345,  # Specified in pre-registration
  printFlag = FALSE
)

# 2. Fit Primary Model ----
# Model: gpa_final ~ treatment + covariates

fit_primary <- with(imputation_model, {
  lm(gpa_final ~ treatment + gpa_baseline + gender + year + stress_baseline)
})

# 3. Pool Results ----
pooled_results <- pool(fit_primary)
summary(pooled_results, conf.int = TRUE)

# 4. Extract Treatment Effect ----
# Adjusted mean difference between arms

emm <- emmeans(pooled_results, specs = "treatment")
contrast(emm, method = "pairwise")

# 5. Effect Size ----
# Cohen's d from adjusted means

cohens_d <- effectsize::cohens_d(
  gpa_final ~ treatment,
  data = data,
  pooled_sd = TRUE
)

# 6. Model Diagnostics ----
# Check assumptions (on one imputed dataset for visualization)

fit_check <- lm(
  gpa_final ~ treatment + gpa_baseline + gender + year + stress_baseline,
  data = complete(imputation_model, 1)
)

# Residual plots
par(mfrow = c(2, 2))
plot(fit_check)

# VIF for multicollinearity
car::vif(fit_check)

# ============================================================================
# SAVE RESULTS
# ============================================================================

# Create results table
results_table <- summary(pooled_results, conf.int = TRUE) %>%
  as.data.frame() %>%
  filter(term == "treatmentmindfulness") %>%
  mutate(
    cohens_d = cohens_d$Cohens_d,
    interpretation = case_when(
      p.value < 0.05 ~ "Statistically significant",
      TRUE ~ "Not statistically significant"
    )
  )

write_csv(results_table, "output/tables/primary_results.csv")

# Print summary
cat("\n========================================\n")
cat("PRIMARY ANALYSIS RESULTS\n")
cat("Pre-registered plan: https://osf.io/xxxxx\n")
cat("========================================\n\n")
print(results_table)
```

### Documenting Deviations

If you deviate from your pre-registered plan, document it:

```r
# ============================================================================
# DEVIATIONS FROM PRE-REGISTRATION
# ============================================================================

# Deviation 1: Outcome transformation
# Reason: GPA distribution was highly skewed (checked with histogram)
# Decision: Log-transformed outcome
# Impact: Results qualitatively similar, see sensitivity analysis

# SENSITIVITY: Re-run with original (untransformed) outcome
fit_original_scale <- with(imputation_model, {
  lm(gpa_final ~ treatment + gpa_baseline + gender + year + stress_baseline)
})

# Deviation 2: Covariate modification
# Reason: "Year in school" had only 5 seniors, collapsed with juniors
# Decision: Recode year as 1, 2, 3-4
# Impact: Minimal, see Table S2

# SENSITIVITY: Re-run with original year coding
# [Code here]
```

---

## Analysis Plans for Different Study Types {#study-types}

### Observational Studies

**Key Considerations**:
- Cannot claim causality
- Confounding is major concern
- Need careful covariate selection

**Template**:

````markdown
## Analysis Plan: Observational Study

### Exposure
Physical activity level (low, moderate, high)

### Outcome
Cardiovascular disease (binary: 0/1)

### Covariates (Pre-specified)
- **Confounders**: Age, sex, smoking status, BMI, family history
- **Effect Modifiers** (test interactions): Age group, baseline CVD risk

### Analysis Strategy
1. **Descriptive**: Compare groups on baseline characteristics
2. **Unadjusted**: Crude odds ratios
3. **Adjusted**: Logistic regression with confounders
4. **Sensitivity**: Propensity score matching

### Causal Assumptions
- **Exchangeability**: Conditional on measured covariates (untestable)
- **Positivity**: All covariate strata have some treated and untreated (check)
- **No unmeasured confounding**: Strong assumption, discuss in limitations
````

### Mediation Analysis

**Key Considerations**:
- Specify causal pathways
- Address confounding of mediator-outcome relationship
- Sensitivity to unmeasured confounding

**Template**:

````markdown
## Analysis Plan: Mediation Analysis

### Conceptual Model
X (Exercise) → M (Stress Reduction) → Y (Depression)

### Estimands
- **Total Effect**: c = effect of X on Y
- **Direct Effect**: c' = effect of X on Y, controlling for M
- **Indirect Effect**: ab = effect of X on Y through M

### Statistical Models
1. Outcome model: Y = c'X + bM + covariates + ε₁
2. Mediator model: M = aX + covariates + ε₂

### Software
```r
library(mediation)
med_fit <- mediate(
  model.m = lm(stress_reduction ~ exercise + covariates),
  model.y = lm(depression ~ exercise + stress_reduction + covariates),
  treat = "exercise",
  mediator = "stress_reduction",
  boot = TRUE,
  sims = 10000
)
```

### Assumptions
- Sequential ignorability (no unmeasured confounding)
- No mediator-outcome confounding

### Sensitivity Analysis
- Sensitivity to unmeasured confounding (ρ parameter)
````

### Meta-Analysis

**Key Considerations**:
- Pre-specify inclusion criteria
- Define effect size metric
- Plan for heterogeneity

**Template**:

````markdown
## Analysis Plan: Meta-Analysis

### Research Question
Efficacy of mindfulness interventions for depression

### Inclusion Criteria
- RCTs with mindfulness intervention
- Depression outcome (any validated scale)
- Adults (18+)
- Published 2000-2025

### Effect Size Metric
Standardized mean difference (Hedges' g)

### Analysis Strategy
1. **Fixed-Effect Model**: If I² < 25%
2. **Random-Effects Model**: If I² ≥ 25%
3. **Meta-Regression**: Moderators = intervention length, control type

### Heterogeneity Assessment
- I² statistic
- τ² (between-study variance)
- Q-test for heterogeneity

### Publication Bias
- Funnel plot
- Egger's test
- Trim-and-fill method

### Software
```r
library(metafor)
rma(yi = effect_size, vi = variance, data = studies, method = "REML")
```
````

---

## Integration with OSF and Protocols.io {#integration}

### Using Scholar with OSF

Scholar can generate OSF-ready analysis plans:

```bash
/research:analysis-plan --format osf
```

This creates a markdown file formatted for OSF pre-registration templates.

### Protocols.io Integration

For detailed, versioned protocols:

```bash
/research:analysis-plan --format protocols
```

This creates a JSON file compatible with protocols.io import.

### Version Control with Git

Track changes to your analysis plan:

```bash
# Initialize git repo
git init
git add analysis_plan.md
git commit -m "Initial analysis plan v1.0"

# After pre-registration, tag the version
git tag -a v1.0 -m "Pre-registered version"

# Any subsequent changes are tracked
git diff v1.0 analysis_plan.md  # See what changed
```

---

## Best Practices for Reproducibility {#best-practices}

### 1. Reproducible Environments

Use `renv` to lock package versions:

```r
# Initialize renv in your project
renv::init()

# Install packages as usual
install.packages("tidyverse")

# Take snapshot of package versions
renv::snapshot()

# Share renv.lock file with collaborators
```

### 2. Literate Programming

Use R Markdown to combine code and narrative:

```rmarkdown
---
title: "Primary Analysis: Mindfulness RCT"
author: "Your Name"
date: "`r Sys.Date()`"
output:
  html_document:
    toc: true
    code_folding: hide
---

## Pre-Registration

This analysis follows the pre-registered plan available at: https://osf.io/xxxxx

## Load Data

```{r load-data}
data <- read_csv("data/analysis_data.csv")
```

## Primary Analysis

As specified in the pre-registration, we fit an ANCOVA model:

```{r primary-analysis}
fit <- lm(gpa_final ~ treatment + gpa_baseline + gender + year, data = data)
summary(fit)
```

The treatment effect is `r coef(fit)["treatmentmindfulness"]` (p = `r summary(fit)$coefficients["treatmentmindfulness", "Pr(>|t|)"]`).
```

### 3. Automated Reporting

Create functions to generate result summaries:

```r
#' Format regression results for reporting
#'
#' @param model Fitted lm or glm object
#' @param term Name of term to report
#' @return Formatted string for inline reporting
report_coef <- function(model, term) {
  coef_val <- coef(model)[term]
  se <- summary(model)$coefficients[term, "Std. Error"]
  p_val <- summary(model)$coefficients[term, "Pr(>|t|)"]
  ci_lower <- coef_val - 1.96 * se
  ci_upper <- coef_val + 1.96 * se

  sprintf(
    "β = %.3f, 95%% CI [%.3f, %.3f], p = %.3f",
    coef_val, ci_lower, ci_upper, p_val
  )
}

# Usage in text:
# The treatment effect was `r report_coef(fit, "treatmentmindfulness")`.
```

---

## Common Planning Pitfalls {#common-pitfalls}

### Pitfall 1: Vague Hypotheses

**Problem**: "We predict that mindfulness will improve outcomes."

**Why It's Bad**: What outcomes? How much improvement? One-sided or two-sided test?

**Solution**: Be specific:
- "We hypothesize that mindfulness will increase end-of-semester GPA by at least 0.2 points (Cohen's d = 0.4) compared to waitlist control (two-sided test, α = 0.05)."

### Pitfall 2: Forgetting Multiple Testing

**Problem**: Testing 10 secondary outcomes at α = 0.05 without correction.

**Why It's Bad**: Family-wise Type I error rate is 1 - (1 - 0.05)^10 = 0.40 (not 0.05!)

**Solution**: Pre-specify correction method:
- Bonferroni: α_adjusted = 0.05 / 10 = 0.005
- Holm-Bonferroni (less conservative)
- Or don't adjust but report all p-values and let readers judge

### Pitfall 3: Unclear Estimands

**Problem**: "We will test the effect of treatment on outcome."

**Why It's Bad**: Effect in whom? Average? Per-protocol? As-treated?

**Solution**: Define estimand clearly:
- **Intention-to-Treat (ITT)**: Effect in all randomized participants (regardless of compliance)
- **Per-Protocol (PP)**: Effect among those who completed treatment as assigned
- **As-Treated (AT)**: Effect comparing actual treatment received

### Pitfall 4: Data-Driven Model Selection

**Problem**: "We will test several models and report the best-fitting one."

**Why It's Bad**: This is p-hacking in disguise. Model selection using the outcome inflates Type I error.

**Solution**: Pre-specify your primary model. If you must compare models:
- Use a separate training/validation split
- Pre-register model comparison criteria (AIC, BIC)
- Report all models tested, not just the "winner"

### Pitfall 5: Ignoring Assumptions

**Problem**: "We will use linear regression" (no mention of assumptions).

**Why It's Bad**: Results may be invalid if assumptions are violated.

**Solution**: Pre-specify:
- Assumption checks you'll perform
- What you'll do if assumptions are violated (e.g., "If residuals are non-normal, we will use bootstrap CIs")

---

## Troubleshooting {#troubleshooting}

### Issue 1: Can't Decide Which Covariates to Include

**Symptoms**: 20 potential covariates, unsure which to adjust for.

**Solution**:
1. **Literature Review**: What do other studies adjust for?
2. **Causal Diagrams**: Draw a DAG to identify confounders
3. **Conservative Approach**: Pre-specify multiple models (unadjusted, minimally adjusted, fully adjusted)
4. **Primary Model**: Choose one as primary based on theory

**Resources**:
- DAGitty: http://dagitty.net/ (draw causal diagrams)
- VanderWeele (2019): *Principles of confounder selection*

### Issue 2: Missing Data Mechanism Unclear

**Symptoms**: Unsure if data are MCAR, MAR, or MNAR.

**Solution**:
1. **Plan Primary Analysis**: Assume MAR (most common), use multiple imputation
2. **Plan Sensitivity Analyses**:
   - Complete case (MCAR)
   - Pattern mixture models (MNAR)
   - Tipping point analysis
3. **Report**: Present all analyses, discuss plausibility of mechanisms

### Issue 3: Pre-Registration Feels Too Constraining

**Symptoms**: Worried about being "locked in" to a suboptimal plan.

**Solution**:
- Pre-registration is not a prison! You CAN deviate if:
  1. You document the deviation
  2. You justify it (e.g., assumption violated)
  3. You report both pre-registered and exploratory analyses
- Think of it as a commitment to transparency, not perfection

### Issue 4: Study Design Changed After Pre-Registration

**Symptoms**: COVID-19 forced study online, different measures used.

**Solution**:
1. **Update Pre-Registration**: Create a new version (v2.0) documenting changes
2. **Timestamp**: Note the date of changes relative to data collection
3. **Report**: Clearly state in manuscript what changed and why
4. **Transparency**: Provide link to both original and updated pre-registrations

---

## Next Steps {#next-steps}

### Immediate Actions

1. **Draft Your Plan**: Use `/research:analysis-plan` to create your first analysis plan
2. **Get Feedback**: Share with a colleague or mentor
3. **Pre-Register**: Upload to OSF before data collection (or before seeing outcomes if data exist)
4. **Code Template**: Create analysis scripts following your plan

### Deepen Your Knowledge

**Related Tutorials**:
- [Designing Monte Carlo Simulations](simulation-design.md) - Test your analysis plan via simulation

**Key Topics**:
- Power analysis workflows for determining sample size needs
- Causal inference analysis plans
- Research commands via `/analysis:plan` and `/analysis:review`
- Pre-registration templates and model specification guidance

**External Resources**:
- [OSF Pre-Registration Templates](https://osf.io/zab38/)
- [AsPredicted Quick Registration](https://aspredicted.org/)
- [PLOS ONE Study Protocol Template](https://journals.plos.org/plosone/s/submission-guidelines#loc-methods)

### Advanced Topics

Once comfortable with basic analysis plans, explore:

1. **Bayesian Analysis Plans**: Pre-specifying priors, Bayes factors
2. **Adaptive Designs**: Sequential testing, sample size re-estimation
3. **Causal Mediation**: Mediation analysis with strong causal assumptions
4. **Equivalence Testing**: Planning non-inferiority or equivalence trials
5. **Individual Participant Data (IPD) Meta-Analysis**: Pre-specifying multi-study analyses

---

## Summary

You've learned how to:

- Define clear analysis objectives and estimands
- Use Scholar's `/research:analysis-plan` command
- Specify statistical models with precision
- Plan comprehensive sensitivity analyses
- Pre-register plans on OSF and protocols.io
- Implement pre-registered plans reproducibly in R
- Avoid common analysis planning mistakes
- Troubleshoot planning challenges

**Key Takeaway**: A detailed analysis plan, created before seeing outcome data, is the foundation of transparent, credible research. Scholar makes it easy to create, document, and implement these plans.

**Next Tutorial**: [Designing Monte Carlo Simulation Studies](simulation-design.md)

---

**Last Updated**: 2026-02-01
**Scholar Version**: 2.5.0
**Maintainer**: Data-Wise Team
