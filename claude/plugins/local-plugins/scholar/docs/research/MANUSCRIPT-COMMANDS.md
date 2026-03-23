# Manuscript Commands Reference

Comprehensive guide to the 4 manuscript writing commands in Scholar's research namespace.

## Navigation

- [Overview](#overview)
- [Commands](#commands)
  - [/research:manuscript:methods](#researchmanuscriptmethods) - Write methods sections
  - [/research:manuscript:results](#researchmanuscriptresults) - Generate results sections
  - [/research:manuscript:reviewer](#researchmanuscriptreviewer) - Respond to reviewer comments
  - [/research:manuscript:proof](#researchmanuscriptproof) - Validate mathematical proofs
- [Workflows](#workflows)
- [Advanced Topics](#advanced-topics)
- [Quality Standards](#quality-standards)
- [Integration](#integration-with-other-commands)
- [Troubleshooting](#troubleshooting)

---

## Overview

Manuscript commands accelerate academic writing by generating well-structured, statistically rigorous content that integrates seamlessly into journals and conference submissions.

### Command Summary

| Command | Purpose | Output |
|---------|---------|--------|
| `/research:manuscript:methods` | Write methods sections with statistical rigor | Markdown/LaTeX methods section with notation, assumptions, estimation procedures |
| `/research:manuscript:results` | Generate results sections with tables/figures | Results section with statistical reporting, table formatting guidance, figure descriptions |
| `/research:manuscript:reviewer` | Professional responses to reviewer comments | Structured response letter with justification and revision guidance |
| `/research:manuscript:proof` | Review proofs for mathematical correctness | Validation report with completeness checks and suggested improvements |

### Typical Workflow

```bash
# 1. Draft methods section
/research:manuscript:methods "describe your statistical approach"

# 2. Generate results section
/research:manuscript:results "summarize your findings"

# 3. Handle peer review
/research:manuscript:reviewer "reviewer comment about methods"

# 4. Validate appendix proofs
/research:manuscript:proof "provide proof text"
```

### Quality Standards

All generated content meets these standards:

- **Academic Rigor:** Statistical correctness and precision
- **Publication-Ready:** Formatted for immediate journal submission
- **Notation Consistency:** All symbols defined before use
- **Assumption Transparency:** Explicit statement of all conditions
- **Peer Review Readiness:** Anticipates common reviewer concerns

---

## Commands

### /research:manuscript:methods

Write methods sections with statistical rigor, proper notation, and complete exposition.

#### Syntax

```bash
/research:manuscript:methods "method description"
/research:manuscript:methods "bootstrap percentile confidence intervals for mediation analysis"
/research:manuscript:methods "Bayesian hierarchical model with weakly informative priors and MCMC sampling"
/research:manuscript:methods "propensity score matching with inverse probability weighting"
```

#### What It Generates

The command produces a complete methods section including:

- **Statistical Framework:** High-level overview of your approach
- **Notation Section:** All symbols defined with mathematical precision
- **Model Specification:** Formal equations with parameter interpretations
- **Estimation Procedure:** Step-by-step algorithm with justification
- **Assumptions:** Explicit list of statistical assumptions
- **Inference Method:** How confidence intervals or tests are conducted
- **Software Implementation:** Packages and specific functions used

#### Output Structure

```markdown
## Methods

### Statistical Framework

[High-level overview explaining the general approach and its advantages]

### Notation and Definitions

Let $Y$ denote [outcome definition]...
Let $X$ denote [treatment/predictor definition]...
Let $M$ denote [mediator definition, if applicable]...

[All quantities defined precisely]

### Model Specification

The statistical model is specified as:

$$
[Primary model equation]
$$

where [parameter definitions and interpretations].

Additional equations for sub-models (mediator, outcome, etc.):

$$
[Secondary equations if applicable]
$$

### Estimation Procedure

Parameters are estimated using [method name]:

1. [Step 1]: [Detailed description]
2. [Step 2]: [Detailed description]
3. [Step 3]: [Detailed description]

[Algorithm convergence criteria, if applicable]

### Statistical Assumptions

The following assumptions are required for valid inference:

1. **[Assumption 1]:** [Mathematical formulation and justification]
   - Why needed: [Theoretical reason]
   - How to verify: [Diagnostic method]

2. **[Assumption 2]:** [Mathematical formulation and justification]
   - Why needed: [Theoretical reason]
   - How to verify: [Diagnostic method]

### Inference

Inference is conducted via [method]. Specifically:

- **Point estimate:** $\hat{\theta} = [formula]$
- **Standard error:** $\text{SE}(\hat{\theta}) = [formula]$
- **Confidence interval:** [Method for obtaining CI with formula]
- **Hypothesis testing:** Test $H_0: \theta = 0$ vs. $H_1: \theta \neq 0$ using [test]

### Software Implementation

Analysis is conducted using [software] with the following packages:

```r
library(package1)  # For [purpose]
library(package2)  # For [purpose]

# Function call
result <- function_name(data, formula, options)
```

Reproducible code and documentation available at [repository/appendix reference].

```

#### Common Use Cases

##### 1. Bootstrap Methods

```bash
/research:manuscript:methods "percentile bootstrap confidence intervals for indirect effects with 10,000 resamples and bias correction"
```

**What this generates:**

- Precise definition of the bootstrap indirect effect
- Resampling algorithm (sampling with replacement from observations)
- CI calculation steps (percentile vs. BCa methods)
- Assumptions (exchangeability of observations, finite variances)
- Convergence checking (SE stability across replicate numbers)

**Key elements in output:**

- Bootstrap sample size justification (N ≥ 10,000 for 95% CI)
- Calculation of CI as empirical quantiles
- Bias-correction formula if requested
- Discussion of open vs. closed-form alternatives

##### 2. Causal Inference Methods

```bash
/research:manuscript:methods "doubly robust estimation for average treatment effect with propensity score weighting and outcome regression"
```

**What this generates:**

- Definition of causal parameters (ATE, ATT, CATE)
- Propensity score model specification
- Outcome regression model specification
- Doubly robust combination formula
- Assumptions: overlap, consistency, unconfoundedness (SUTVA)
- Variance formula accounting for nuisance parameter estimation

**Key elements in output:**

- Identification assumptions with clear DAG structure
- Propensity score model (e.g., logistic regression for binary treatment)
- Outcome model specification
- Combination of both estimators
- Asymptotic normality result for inference

##### 3. Bayesian Hierarchical Models

```bash
/research:manuscript:methods "Bayesian hierarchical model with normal priors on fixed effects, inverse-gamma priors on variance components, and Hamiltonian MCMC sampling"
```

**What this generates:**

- Complete model specification (data, process, parameter levels)
- Prior specification for each parameter type
- Justification for prior choices (weakly informative, sensitivity)
- MCMC sampling algorithm details (HMC, Metropolis-Hastings)
- Convergence diagnostics (Gelman-Rubin statistic, effective sample size)
- Posterior inference (point estimates, credible intervals)

**Key elements in output:**

- Likelihood specification
- Prior distributions with hyperparameter values
- Full conditional distributions
- Sampling algorithm pseudocode
- Convergence assessment procedures
- Posterior predictive checking for model validation

##### 4. High-Dimensional Methods

```bash
/research:manuscript:methods "elastic net regression with cross-validation for variable selection in p > n setting"
```

**What this generates:**

- Penalized regression formulation (loss + penalty)
- Regularization path and tuning parameter selection
- Cross-validation procedure (k-fold, LOOCV)
- Asymptotic properties (consistency, convergence rates)
- Implementation details (algorithms, initialization)
- Relationship to unpenalized methods

**Key elements in output:**

- Loss function and penalty specification
- Tuning parameter space and selection procedure
- Bias-variance tradeoff discussion
- Assumptions on sparse true model
- Computational complexity
- Software packages and their defaults

#### Best Practices

##### 1. Be Specific About Your Method

**Too vague:**

```bash
/research:manuscript:methods "regression analysis"
```

**Better:**

```bash
/research:manuscript:methods "multiple linear regression with heteroscedasticity-robust standard errors and bootstrapped confidence intervals for coefficients"
```

**Even better:**

```bash
/research:manuscript:methods "ordinary least squares estimation with Huber-White sandwich estimator for standard errors, bootstrapped via percentile method with 5,000 resamples"
```

**Why:** Specificity ensures the output matches your actual implementation.

##### 2. Include Important Context

```bash
/research:manuscript:methods "mediation analysis using product-of-coefficients method with Sobel test for significance and percentile bootstrap for 95% confidence intervals, adjusting for potential unmeasured confounding"
```

The context helps generate:

- Discussion of assumptions violated (unmeasured confounding)
- Sensitivity analysis guidance
- Appropriate caveats in interpretation

##### 3. Reference Implementation Details

```bash
/research:manuscript:methods "random forest with 1,000 trees for variable importance estimation using mean decrease in impurity, with 80/20 train/test split for out-of-sample validation"
```

This ensures output includes:

- Hyperparameter choices (why 1,000 trees?)
- Validation strategy
- How variable importance is calculated
- Generalization error estimation

##### 4. Match Your Actual Analysis

```bash
# If you used this R code:
library(mediation)
summary(mediate(model.m, model.y, treat="X", mediator="M",
                boot=TRUE, sims=10000))

# Use this command:
/research:manuscript:methods "mediation analysis using the mediation R package with 10,000 bootstrap simulations for confidence intervals on natural indirect and direct effects"
```

##### 5. Explain Why You Chose the Method

```bash
/research:manuscript:methods "propensity score matching rather than covariate adjustment because of the high-dimensional covariate space (p=25) and to reduce model extrapolation"
```

This generates discussion of:

- Advantages of your method over alternatives
- Assumptions being made
- When the approach is valid

#### Statistical Notation Standards

All methods sections follow these notation conventions:

**Random Variables and Parameters:**

- $Y, X, M$ for random variables (capital letters)
- $y, x, m$ for observations (lowercase)
- $\theta, \beta, \mu$ for parameters (Greek letters)
- $\hat{\theta}$ for estimates (hat notation)
- $\tilde{\theta}$ for alternatives/adjusted versions

**Sample Size and Indices:**

- $n$ for sample size
- $i, j, k$ for indexing observations
- $(X_1, \ldots, X_n)$ for data

**Distributions:**

- $N(\mu, \sigma^2)$ for normal
- $\text{Bin}(n, p)$ for binomial
- $\text{Exp}(\lambda)$ for exponential

**Matrix Notation:**

- $\mathbf{X}$ for matrices (bold)
- $\mathbf{x}$ for vectors (bold lowercase)
- $x_{ij}$ for matrix elements

**Conditional Statements:**

- $X \mid Y$ for conditioning
- $X \perp Y \mid Z$ for conditional independence
- $X \rightarrow Y \leftarrow Z$ for DAG notation

#### Integration with Your Manuscript

**Export to LaTeX:**

```bash
# Copy generated section directly into .tex file
# All math notation is LaTeX-ready
```

**Export to Quarto:**

```bash
# Generated markdown + LaTeX works in Quarto
# Use for reproducible documents
```

**Export to R Markdown:**

```bash
# Copy to methods R chunk or standalone markdown file
# All notation renders in compiled document
```

#### Output Customization

While the command uses a standard structure, you can customize:

**Via Prompt Specification:**

```bash
# Emphasize assumptions
/research:manuscript:methods "your method [Include detailed discussion of all assumptions and their implications]"

# Emphasize computational aspects
/research:manuscript:methods "your method [With emphasis on computational complexity and scalability]"

# Emphasize comparison to alternatives
/research:manuscript:methods "your method [Compare and contrast to [alternative method]]"
```

#### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Methods section is too long | Method description was too detailed | Summarize key steps, move algorithm details to appendix |
| Mathematical notation doesn't match literature | Conflicting conventions | Specify the notation system you prefer (e.g., "using Imai et al. notation") |
| Missing software details | Implementation not mentioned | Specify exact R packages: "mediation package version 4.5.0" |
| Assumptions not clear | Generic method description | List specific assumptions relevant to your data and research question |
| Too much jargon for target audience | Method is advanced | Add brief intuitive explanation before formal definitions |

---

### /research:manuscript:results

Generate results sections with proper statistical reporting, formatting guidance, and figure/table recommendations.

#### Syntax

```bash
/research:manuscript:results "result description"
/research:manuscript:results "report simulation study comparing five estimation methods"
/research:manuscript:results "summarize multiple regression analysis of treatment effects with sensitivity checks"
```

#### What It Generates

The command produces a complete results section including:

- **Descriptive Statistics:** Sample characteristics, data summary
- **Primary Analysis Results:** Main findings with test statistics and p-values
- **Secondary Analyses:** Additional research questions
- **Sensitivity/Robustness Checks:** Results under alternative specifications
- **Statistical Tables:** Guidance on formatting and content
- **Figure Descriptions:** What plots to create and how to interpret them
- **Effect Size Reporting:** Point estimates with confidence intervals

#### Output Structure

```markdown
## Results

### Descriptive Statistics

[Description of sample and variables]

**Table 1:** Descriptive statistics for [variables]

| Variable | N | Mean | SD | Min | Max |
|----------|---|------|-----|-----|-----|
| [Var1] | [N] | [M] | [SD] | [Min] | [Max] |
| [Var2] | [N] | [M] | [SD] | [Min] | [Max] |

Across the sample of [N] participants, [key descriptive finding].

### Primary Analysis

[Research question being addressed]

**Statistical Model:**
[Which test/model was used and why]

**Results:**
[Finding in plain language, followed by statistical details]

[Test statistic] = [value], [df information], *p* = [exact p-value]

The effect size was [magnitude] (95% CI: [lower, upper]).

**Interpretation:**
[What the result means scientifically and practically]

### Secondary Analyses

**[Secondary Question 1]:**
[Methods and results]

**[Secondary Question 2]:**
[Methods and results]

### Sensitivity Analyses

We assessed robustness to [key assumptions/choices]:

**[Sensitivity Check 1]:**
[Alternative specification and results] (compare to primary: [comparison])

**[Sensitivity Check 2]:**
[Alternative specification and results] (compare to primary: [comparison])

Results were robust to [list of sensitivity checks performed].

### Tables and Figures

**Table 1:** [Descriptive statistics / Regression coefficients / Simulation results]

**Figure 1:** [Plot type and what it shows] - [Key finding from visualization]

**Table 2:** [Additional results from secondary analyses]

**Figure 2:** [Sensitivity analysis visualization]
```

#### Common Use Cases

##### 1. Regression Analysis Results

```bash
/research:manuscript:results "multiple regression with three predictors (X1, X2, X3), adjusted R-squared, individual coefficient tests, and collinearity diagnostics"
```

**What this generates:**

- Regression equation display
- Coefficient table with standard errors, t-statistics, p-values, CI
- Model fit statistics (R², adjusted R², F-test for overall model)
- Assumption diagnostics (VIF for collinearity, residual plots)
- Effect size interpretation (e.g., "For every unit increase in X1...")

**Standard table format:**

```
Table 1: Multiple Regression Model

| Predictor | β | SE | t | p | 95% CI |
|-----------|---|----|----|-------|---------|
| (Intercept) | ... | ... | ... | ... | [..., ...] |
| X1 | ... | ... | ... | ... | [..., ...] |
| X2 | ... | ... | ... | ... | [..., ...] |
| X3 | ... | ... | ... | ... | [..., ...] |
```

##### 2. Group Comparison Results

```bash
/research:manuscript:results "independent samples t-test comparing treatment and control on primary outcome Y, with equal variance test and effect size calculation"
```

**What this generates:**

- Descriptive statistics for each group (N, mean, SD)
- Levene's test for equal variances
- t-test statistic, degrees of freedom, p-value
- Cohen's d effect size with 95% CI
- Interpretation of practical significance

**Output example:**

```
The treatment group (M = 23.5, SD = 4.2, n = 50) had significantly
higher scores than the control group (M = 19.3, SD = 5.1, n = 48),
t(96) = 4.23, p < .001, d = 0.86, 95% CI [0.47, 1.24].
```

##### 3. Simulation Study Results

```bash
/research:manuscript:results "Monte Carlo simulation comparing bias and coverage of five estimation methods across four sample sizes and three effect sizes"
```

**What this generates:**

- Performance summary table (bias, RMSE, coverage, power by method and scenario)
- Best-performing method identification
- Method comparisons with visual recommendations
- Code for publication-quality plots
- Recommendations for practitioner use

**Standard simulation table:**

```
Table 2: Simulation Study Results (10,000 replicates)

| Method | n | Bias | RMSE | Coverage |
|--------|-----|------|------|----------|
| Method1 | 50 | -0.02 | 0.18 | 0.93 |
| Method1 | 100 | -0.01 | 0.12 | 0.94 |
| Method2 | 50 | 0.05 | 0.22 | 0.89 |
| Method2 | 100 | 0.03 | 0.15 | 0.92 |
```

##### 4. Time-to-Event/Survival Analysis Results

```bash
/research:manuscript:results "Cox proportional hazards model with three covariates, Kaplan-Meier curves for treatment comparison, log-rank test"
```

**What this generates:**

- Hazard ratios with 95% CI and interpretation
- Assumption check results (proportional hazards test)
- Number at risk table for main figure
- Interpretation of survival curves
- Median survival times and follow-up duration

##### 5. Meta-Analysis Results

```bash
/research:manuscript:results "fixed-effects and random-effects meta-analysis of 25 studies with Q-test for heterogeneity and publication bias assessment"
```

**What this generates:**

- Forest plot description with effect sizes and CI
- Pooled effect estimate with heterogeneity statistics
- I² statistic interpretation
- Funnel plot recommendation
- Subgroup analysis results (if applicable)

#### Statistical Reporting Standards

All results sections follow these standards:

##### Fundamental Reporting Rules

1. **Always Report:**
   - Exact p-values (not "p < .05"), unless p < .001 (report as "p < .001")
   - Effect sizes (not just significance tests)
   - Confidence intervals (95% standard, or justify otherwise)
   - Sample sizes for each analysis
   - How missing data was handled

2. **Format Standards:**

   **APA Style:**
   - P-values: *p* = .034 (italics, no leading zero for p-values)
   - Test statistics: *t*(98) = 2.13, *p* = .036
   - F-ratios: *F*(3, 96) = 4.52, *p* = .005
   - Effect sizes: Cohen's *d* = 0.42, 95% CI [0.18, 0.66]
   - Regression: β = 0.34, *SE* = 0.12, 95% CI [0.11, 0.58], *p* = .002

3. **Confidence Interval Format:**
   - 95% CI [lower, upper]
   - CI [.24, .72] not CI (.24, .72)
   - Always report CI endpoints with same decimal places

#### Table Formatting Best Practices

##### Table Structure

```markdown
Table 1: [Descriptive Title]

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| [Data] | [Data] | [Data] |

Note: [Explanation of abbreviations, statistical tests, footnotes]
```

##### Regression Tables

```markdown
Table 2: Multiple Regression Predicting [Outcome]

| Variable | β | SE(β) | 95% CI | *t* | *p* |
|----------|---|-------|--------|-----|-----|
| Intercept | 10.24 | 2.15 | [5.99, 14.49] | 4.77 | < .001 |
| Predictor 1 | 0.34 | 0.12 | [0.11, 0.58] | 2.89 | .005 |
| Predictor 2 | -0.19 | 0.08 | [-0.35, -0.03] | -2.38 | .020 |

Note: *R*² = .42, *F*(2, 97) = 35.2, *p* < .001
```

##### Simulation Tables

```markdown
Table 3: Performance Metrics by Method and Sample Size (10,000 replicates)

| Method | N | Bias | RMSE | Coverage | Power |
|--------|-----|------|------|----------|-------|
| Method A | 50 | -0.02 | 0.18 | 0.93 | 0.72 |
| Method A | 100 | -0.01 | 0.12 | 0.94 | 0.89 |
| Method B | 50 | 0.05 | 0.22 | 0.89 | 0.68 |
| Method B | 100 | 0.03 | 0.15 | 0.92 | 0.86 |

Note: RMSE = root mean squared error
```

#### Figure Recommendations

The command provides specific guidance on plots:

##### Plot Types and When to Use

| Analysis Type | Recommended Plot | Why |
|---------------|-----------------|-----|
| Regression | Scatter plot with regression line | Shows relationship and spread |
| Group comparison | Box plots or violin plots | Displays distribution and medians |
| Effect sizes | Forest plot | Compares multiple estimates |
| Simulation results | Line plots (bias/RMSE by N) | Shows convergence properties |
| Proportional hazards | Kaplan-Meier survival curves | Standard for time-to-event |
| Meta-analysis | Forest plot | Standard for combining effects |
| High-dimensional | Heatmap or Manhattan plot | Visualizes many variables |

##### Plot Quality Standards

- **Resolution:** 300 DPI for publication (600 DPI for figures with text)
- **Size:** Readable at half page width (typically 3-4 inches)
- **Colors:** Colorblind-friendly palette (avoid red/green)
- **Legends:** Clear labels, positioned for readability
- **Captions:** Informative title and description

#### Output Customization

**Specify table preferences:**

```bash
/research:manuscript:results "your results [Format as APA regression table with standardized coefficients]"
```

**Request specific visualizations:**

```bash
/research:manuscript:results "your results [Include forest plot comparing methods and violin plots showing distributions]"
```

**Emphasize certain aspects:**

```bash
/research:manuscript:results "your results [Emphasize robustness to assumption violations and include sensitivity analysis details]"
```

#### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Too many decimal places | Unspecified precision | Request specific precision: "round to 2 decimal places" |
| Table formatting looks wrong | Markdown inconsistency | Verify all rows have same column count |
| Missing key comparison | Not mentioned in prompt | Explicitly request comparison: "compare to null hypothesis" |
| Results text doesn't match table | Discrepancy between generated sections | Review both; specify format you prefer |
| Effect sizes missing | Generic results description | Request: "include 95% confidence intervals and effect sizes for all estimates" |

---

### /research:manuscript:reviewer

Generate professional, detailed responses to reviewer comments with statistical justification and revision guidance.

#### Syntax

```bash
/research:manuscript:reviewer "reviewer comment"
/research:manuscript:reviewer "Reviewer 2 questions whether sample size is adequate for mediation analysis"
/research:manuscript:reviewer "Reviewer 1 asks for sensitivity analysis to unmeasured confounding"
```

#### What It Generates

The command produces:

- **Professional Tone Response:** Courteous, appreciative acknowledgment
- **Point-by-Point Answers:** Addresses each concern systematically
- **Statistical Justification:** Evidence-based explanations with citations
- **Revision Guidance:** What to add/modify in manuscript
- **Supporting Analyses:** Suggestions for additional analyses if needed
- **Literature Citations:** References backing your methodological choices

#### Output Structure

```markdown
## Response to Reviewer [Number] Comment [Number]

### Reviewer Comment

[Quote verbatim from review]

### Response

We thank the reviewer for this [insightful/important/constructive] comment.

[Acknowledgment that shows you understand the concern]

#### [Specific Point 1]

[Explanation addressing this aspect of the criticism]

[Statistical justification or explanation]

#### [Specific Point 2]

[Explanation addressing next aspect]

[Additional evidence or reasoning]

### Changes Made to Manuscript

We have made the following revisions to address this comment:

1. **[Revision 1]:** [Description] (Page [X], Lines [Y-Z])
2. **[Revision 2]:** [Description] (New section added: [Location])
3. **[New Analysis]:** [Analysis type] added as Table [X] / Figure [Y]

### Supporting Justification

[Statistical reasoning with citations]

[Explanation of why your approach is valid]

[If applicable: comparison to reviewer's suggested approach]

---
```

#### Common Reviewer Concerns and Responses

##### 1. Sample Size Concerns

**Reviewer Comment:**

```
"The sample size of n=150 seems quite small for mediation analysis.
How do you ensure adequate statistical power?"
```

**Use:**

```bash
/research:manuscript:reviewer "Reviewer concerned about sample size of n=150 for mediation analysis and power to detect indirect effects"
```

**What the response includes:**

- Power analysis justification (reference simulation studies if available)
- Comparison to published studies in field
- Effect size assumptions and sensitivity
- Specific power calculations (80% power for effect size of d = 0.2)
- Bootstrap/resampling methods that may help with smaller N
- Sensitivity analysis for weaker effects

**Sample response language:**

```
We appreciate this concern about statistical power. For mediation analysis
with moderate indirect effects (e.g., indirect effect = 0.15), our power
analysis based on [paper citation] shows that N=150 provides approximately
80% power to detect effects at the α = .05 level using bootstrap confidence
intervals. This is consistent with recent Monte Carlo simulations [citations]
showing that bootstrap methods are reliable with this sample size.

To address potential underpowering, we conducted supplementary sensitivity
analyses varying the effect size (Appendix, Table A1), showing robust
conclusions even with weaker effects.
```

##### 2. Multiple Testing Concerns

**Reviewer Comment:**

```
"You tested 15 hypotheses but I see no correction for multiple comparisons.
This inflates Type I error."
```

**Use:**

```bash
/research:manuscript:reviewer "Reviewer notes no correction for multiple comparisons across 15 statistical tests"
```

**What the response includes:**

- Distinction between primary and secondary hypotheses
- Justification for no correction (e.g., tests are dependent, prespecified primary hypothesis)
- Bonferroni or FDR correction application if needed
- Preregistration information if available
- Exploratory vs. confirmatory labeling

**Sample response language:**

```
We designated the three hypotheses concerning [variables] as primary,
prespecified in our analysis plan (available at OSF: [URL]). The remaining
12 tests were secondary/exploratory and labeled as such in the manuscript
[page X]. However, to be conservative and address your concern, we applied
Bonferroni correction to the secondary hypotheses (adjusted α = .05/12 = .0042).
Results remain significant for [X] of the [Y] secondary tests (Table [Z]).
```

##### 3. Assumption Violations Concerns

**Reviewer Comment:**

```
"Did you verify the normality assumption for your linear regression?
The data may be skewed."
```

**Use:**

```bash
/research:manuscript:reviewer "Reviewer asks for normality checks and linearity diagnostics for regression assumptions"
```

**What the response includes:**

- Specific diagnostic plots (Q-Q plots, residual plots with interpretations)
- Formal tests (Shapiro-Wilk, Anderson-Darling)
- Robustness checks (bootstrap, permutation tests, trimmed means)
- Non-parametric alternatives considered
- Supporting Figures added to appendix

**Sample response language:**

```
We have now added comprehensive assumption diagnostics to Appendix B:

- Figure B1: Q-Q plots and histograms of standardized residuals show
  approximate normality with slight left tail deviation
- Shapiro-Wilk test: W = 0.97, p = .18 (not rejecting normality)
- Residual plots (Figure B2) show no concerning patterns

To ensure robustness, we conducted supplementary analyses using:
- Bootstrap confidence intervals for coefficients (Table B1)
- Permutation test for overall model significance (p = .001)
- Robust regression using Huber weighting (Table B2)

All approaches yield consistent conclusions, confirming robustness to
mild normality deviations.
```

##### 4. Methodological Disagreement

**Reviewer Comment:**

```
"Why use bootstrap instead of the Sobel test for mediation?
The Sobel test is more standard."
```

**Use:**

```bash
/research:manuscript:reviewer "Reviewer questions choice of bootstrap over Sobel test for mediation confidence intervals"
```

**What the response includes:**

- Methodological justification with citations
- Comparison of methods (bootstrap vs. Sobel)
- Your method's advantages and limitations
- Respectful tone if maintaining your position
- Supplementary results using alternative if reconsidering

**Sample response language:**

```
We appreciate this suggestion to compare methods. We selected bootstrap
confidence intervals based on recent simulation research [citations]
demonstrating superior performance:

1. **Accuracy:** Bootstrap coverage is consistently at 95% across effect
   sizes; Sobel coverage drops below 90% for indirect effects near zero [paper]

2. **Validity:** Bootstrap makes fewer distributional assumptions and
   accommodates non-normal data

3. **Generality:** Bootstrap applies to complex mediation models; Sobel
   requires specific functional forms

To address this comment, we have added results using the Sobel test as
a sensitivity analysis (Table [X]). Both approaches lead to the same
substantive conclusion ([effect is/is not significant]).
```

##### 5. Missing Analysis Requests

**Reviewer Comment:**

```
"Have you considered potential confounding by [variable]?
The results could be spurious if this is uncontrolled."
```

**Use:**

```bash
/research:manuscript:reviewer "Reviewer asks for adjustment for potential confounder X and sensitivity analysis to unmeasured confounding"
```

**What the response includes:**

- Analysis including confounding variable
- Comparison of results with/without confounder
- Sensitivity analysis framework
- Discussion of unmeasured confounding implications
- New tables/figures demonstrating robustness

**Sample response language:**

```
We thank the reviewer for this important suggestion. We have now:

1. **Added [variable] as covariate** (Table [X], Model 2): The primary
   effect estimate remains significant (β = 0.42, p = .003) and substantively
   similar to the original estimate (β = 0.45, p = .001).

2. **Conducted E-value sensitivity analysis** (Appendix): An unmeasured
   confounder would need to have an association with both the exposure and
   outcome of at least E = 1.5 (95% CI) to explain away our result. This
   is a relatively large unmeasured effect, making confounding-induced spuriousness
   less likely [paper citation].

3. **Discussed other potential confounders** (pages [X-Y]) and why we
   consider them unlikely to substantially bias results.
```

##### 6. Statistical Testing Approach Criticism

**Reviewer Comment:**

```
"Using frequentist hypothesis testing with a fixed α = .05 is arbitrary.
Why not use Bayesian methods?"
```

**Use:**

```bash
/research:manuscript:reviewer "Reviewer suggests Bayesian approach instead of frequentist hypothesis testing"
```

**What the response includes:**

- Explanation of your chosen framework
- Acknowledgment of Bayesian alternative
- Conditions under which each is appropriate
- Supplementary Bayesian analysis if feasible
- Consistent methodological justification

**Sample response language:**

```
We appreciate this perspective on inferential frameworks. Our choice of
frequentist testing reflects the study's confirmatory nature and the field's
standard practice. However, we recognize the reviewer's point about Bayesian
advantages (quantifying evidence in favor of H₀, incorporating prior information).

To address this comment, we have added supplementary Bayesian analysis
(Appendix C) using weakly informative priors. Results show:
- Posterior probability of effect > 0: 99%
- 95% credible interval: [0.18, 0.68]
- Bayes factor (H₁:H₀) = 45.3

Both frequentist and Bayesian approaches reach the same conclusion about
effect presence and direction.
```

#### Tone Guidelines

**Strong Acknowledgment:**

- "We thank the reviewer for this insightful comment"
- "We appreciate this important observation"
- "This comment significantly strengthens the manuscript"

**Gentle Disagreement:**

- "We respectfully note that..."
- "While we understand this perspective, our approach..."
- "We considered this alternative and selected [our approach] because..."

**Expressing Implemented Changes:**

- "We have now added..."
- "We have revised the manuscript to include..."
- "As suggested, we have conducted..."

**Claiming Robustness:**

- "Results remain robust across all specifications"
- "This finding is consistent across multiple analyses"
- "Our conclusion is unchanged despite..."

#### Red Flags to Avoid

| Don't Say | Why | Say Instead |
|-----------|-----|-------------|
| "The reviewer misunderstands..." | Defensive, dismissive | "To clarify..." or "We have made this more explicit" |
| "This is obvious..." | Condescending | "We recognize this point and have addressed it by..." |
| "As we already stated..." | Implies poor reading | "To reiterate and clarify..." |
| "This suggestion is incorrect" | Confrontational | "We respectfully disagree and note that..." |

#### Response Letter Structure

```markdown
# Response to Editor and Reviewers

Dear [Editor Name],

Thank you for the opportunity to revise our manuscript and for the
constructive comments from the reviewers. We have carefully considered
each comment and made substantive revisions.

## Summary of Major Revisions

1. [Major revision 1 and why made]
2. [Major revision 2 and why made]
3. [Major revision 3 and why made]

---

## Response to Reviewer 1

### Comment 1.1: [Reviewer comment topic]

[Response as generated by /research:manuscript:reviewer]

### Comment 1.2: [Next reviewer comment topic]

[Response as generated by /research:manuscript:reviewer]

---

## Response to Reviewer 2

### Comment 2.1: [Reviewer comment topic]

[Response as generated by /research:manuscript:reviewer]

...

---

Sincerely,
[Author names]
```

#### Integration with Manuscript Revision

**Workflow for handling revisions:**

```bash
# 1. Read reviewer comment
# 2. Generate response
/research:manuscript:reviewer "exact reviewer comment"

# 3. Use response to guide revision
# 4. Implement suggested analysis
/research:manuscript:results "new analysis results"

# 5. Add results to manuscript
# 6. Reference revision in response letter
```

#### Advanced: Multi-Step Response to Complex Comments

**For compound comments with multiple parts:**

```bash
# Break into components
/research:manuscript:reviewer "Part 1: sample size concern"
/research:manuscript:reviewer "Part 2: multiple testing issue"
/research:manuscript:reviewer "Part 3: missing robustness check"

# Compile into unified response
# Using each as building block
```

---

### /research:manuscript:proof

Review mathematical proofs for correctness, completeness, and logical rigor.

#### Syntax

```bash
/research:manuscript:proof "proof description"
/research:manuscript:proof "Check identifiability proof in Appendix A"
/research:manuscript:proof "Verify asymptotic normality proof for M-estimator with details"
```

#### What It Generates

The command produces a validation report including:

- **Logical Structure Assessment:** Each step follows from previous
- **Mathematical Rigor Check:** Formal correctness of derivations
- **Assumption Verification:** All conditions are explicit
- **Completeness Analysis:** No logical gaps or missing steps
- **Notation Consistency:** Symbols used correctly throughout
- **Suggested Improvements:** How to strengthen the proof

#### Output Structure

```markdown
## Proof Validation Report

### Proof Title
[Name or theorem being proved]

### Overall Assessment

**Status:** ✓ Pass / ⚠ Needs Revision / ✗ Fails

**Summary:** [One sentence assessment of proof quality]

### Logical Structure

The proof follows this logical chain:

1. [Starting assumption] →
2. [Intermediate step 1] →
3. [Intermediate step 2] →
...
N. [Final conclusion]

**Clarity:** [Assessment of logical flow]

#### Detailed Step Review

**Step 1: [Description]**
- Status: ✓ Justified / ⚠ Needs clarification / ✗ Invalid
- Assessment: [Comment on this step]

**Step 2: [Description]**
- Status: ✓ Justified / ⚠ Needs clarification / ✗ Invalid
- Assessment: [Comment on this step]

[Additional steps...]

### Mathematical Rigor

#### Definitions
- [ ] All quantities defined before use
- [ ] Symbols used consistently
- [ ] Notation follows standard conventions

**Comments:** [Assessment of definitional precision]

#### Derivations
- [ ] Algebraic manipulations are valid
- [ ] Inequalities/equalities justified
- [ ] No implicit assumptions in steps

**Comments:** [Assessment of mathematical correctness]

#### Limits and Convergence
- [ ] Limits are taken correctly
- [ ] Convergence is properly established
- [ ] Mode of convergence specified (a.s., in probability, in distribution)

**Comments:** [Assessment of limiting operations]

#### Probabilistic Statements
- [ ] Probability statements are precise
- [ ] Events are well-defined
- [ ] Independence assumptions stated

**Comments:** [Assessment of probabilistic reasoning]

### Assumption Review

**Explicit Assumptions:**
1. [Assumption 1]: [Statement]
2. [Assumption 2]: [Statement]
...

**Hidden Assumptions:**
- [Potentially unstated assumption 1]
- [Potentially unstated assumption 2]

**Assessment:** All assumptions are [clearly stated / partially stated / inadequately stated]

**Suggestions:** [What assumptions should be made explicit]

### Completeness Check

- [ ] No gaps in logical chain
- [ ] Edge cases discussed
- [ ] Uniqueness established (if claimed)
- [ ] Special cases verified

**Potential gaps identified:**
1. [Gap 1]: [What's missing, how to address]
2. [Gap 2]: [What's missing, how to address]

### Notation Assessment

| Notation | Consistent? | Follows convention? | Notes |
|----------|-------------|--------------------|-------|
| [Symbol] | ✓/✗ | ✓/✗ | [Comment] |

**Overall notation quality:** [Assessment]

### Strengths

1. [Strength 1]
2. [Strength 2]
3. [Strength 3]

### Areas for Improvement

#### Minor Issues (editorial)

1. **[Issue 1]:** [Description and suggestion]
2. **[Issue 2]:** [Description and suggestion]

#### Moderate Issues (clarity)

1. **[Issue 1]:** [Description and solution]
2. **[Issue 2]:** [Description and solution]

#### Major Issues (correctness)

1. **[Issue 1]:** [Description of problem and required fix]
   - Impact: [What this affects]
   - Suggested fix: [How to address]

2. **[Issue 2]:** [Description of problem and required fix]
   - Impact: [What this affects]
   - Suggested fix: [How to address]

### Suggested Revisions

#### Revision 1: [Title]

**Current:** [Original text]

**Suggested:** [Improved version]

**Rationale:** [Why this improves the proof]

#### Revision 2: [Title]

[Similar structure]

### Recommendations

**For publication:** [Conditional acceptance statement]

**Next steps:**
1. [Revision 1]
2. [Revision 2]
3. [Verification step: "Re-verify proof after revisions"]

---
```

#### Common Proof Types and Validation Foci

##### 1. Identifiability Proofs

```bash
/research:manuscript:proof "Show that causal effects are identifiable from observed data under no unmeasured confounding"
```

**Key checks performed:**

- Existence: Does a solution exist?
- Uniqueness: Is the solution unique?
- Observability: Can we determine the effect from available data?
- Assumptions: Are causal assumptions (graphical) explicit?

**What the validation report includes:**

- DAG representation of causal assumptions
- Mathematical conditions for identification
- Verification that parameters can be uniquely determined
- Discussion of what happens if assumptions violated

##### 2. Consistency Proofs

```bash
/research:manuscript:proof "Prove consistency of the OLS estimator under standard assumptions"
```

**Key checks performed:**

- Convergence mode specified (almost surely, in probability, etc.)
- Required regularity conditions enumerated
- Law of large numbers or equivalent invoked correctly
- Continuity of limiting operation established

**What the validation report includes:**

- Explicit statement of assumptions (A1, A2, ...)
- Verification of each assumption's role
- Convergence rate if available (Op(1/√n), etc.)
- Handling of dependent observations if applicable

##### 3. Asymptotic Normality Proofs

```bash
/research:manuscript:proof "Show asymptotic normality of bootstrap indirect effect estimator"
```

**Key checks performed:**

- Central limit theorem correctly applied
- Lindeberg conditions or Lyapunov conditions verified
- Variance formula properly derived
- Delta method correctly used (if applicable)
- Consistency of variance estimator confirmed

**What the validation report includes:**

- Statement of limiting distribution with variance formula
- Conditions under which CLT applies
- How bootstrap replicates the asymptotic distribution
- Finite sample performance discussion

##### 4. Equivalence Proofs

```bash
/research:manuscript:proof "Prove equivalence between propensity score matching and regression adjustment for causal effect estimation"
```

**Key checks performed:**

- Both approaches defined precisely
- Under what conditions equivalence holds
- Assumptions required for each method
- Which method is preferred (efficiency, interpretability)

**What the validation report includes:**

- Mathematical equivalence statement
- Conditions and assumptions
- Discussion of when one method might be preferred
- Practical implications

#### Statistical Proof Validation Checklist

```markdown
## Proof Validation Checklist

### Foundational Elements
- [ ] Theorem statement is clear and complete
- [ ] All assumptions listed before proof begins
- [ ] Notation is standard and defined
- [ ] Proof sketch provided before full proof (for complex proofs)

### Logical Flow
- [ ] Proof starts from stated assumptions
- [ ] Each step follows logically from previous
- [ ] Conclusion is justified by premises
- [ ] No circular reasoning

### Mathematical Correctness
- [ ] All quantities defined before use
- [ ] Algebraic manipulations are valid
- [ ] Equalities and inequalities justified
- [ ] No unjustified sign changes
- [ ] Matrix operations valid (invertibility checked, dimensions match)

### Limiting Operations
- [ ] All limits properly evaluated
- [ ] Mode of convergence specified (a.s., p, d)
- [ ] Justification for limit-exchanging operations
- [ ] Borel-Cantelli, monotone convergence, dominated convergence lemmas applied correctly

### Probabilistic Arguments
- [ ] Events clearly defined
- [ ] Probability statements precise
- [ ] Independence assumptions explicit
- [ ] Use of conditional expectation justified
- [ ] Martingale or submartingale properties verified (if used)

### Edge Cases and Boundaries
- [ ] What happens if assumption nearly violated?
- [ ] Behavior at parameter space boundaries
- [ ] Degenerate cases handled
- [ ] Uniqueness when claimed

### Assumptions
- [ ] No hidden assumptions
- [ ] All assumptions reasonable and stated
- [ ] Necessity of assumptions discussed
- [ ] How violation affects conclusion
```

#### Common Errors Detected and Corrections

| Error Type | Example | How Detected | Fix |
|-----------|---------|--------------|-----|
| **Missing step** | "Therefore A = C" without B | Reviewers ask "why?" | Insert intermediate steps A → B → C |
| **Circular reasoning** | Using desired result in proof | Logical chain repeats | Start from first principles only |
| **Unstated assumption** | Using regularity conditions not listed | Conditions violated case exists | List all assumptions in proof opening |
| **Notation confusion** | Same symbol for two quantities | Symbol appears contradictorily | Establish unique symbol for each quantity |
| **Invalid operation** | Taking limit of non-convergent sequence | Expression oscillates or diverges | Verify convergence before taking limit |
| **Matrix error** | Inverting singular matrix | Determinant is zero | Check invertibility first, use generalized inverse if needed |
| **Probability error** | P(A ∪ B) = P(A) + P(B) without assuming disjoint | Not stated explicitly | Verify disjointness or use inclusion-exclusion |

#### Best Practices for Proof Submission

##### 1. Provide Full Context

**Minimal context (risky):**

```bash
/research:manuscript:proof "prove consistency"
```

**Better:**

```bash
/research:manuscript:proof "Lemma 2: Under assumptions A1-A5, the estimator θ̂ₙ is consistent for θ, i.e., θ̂ₙ →ᵖ θ as n → ∞"
```

**Even better:**

```bash
/research:manuscript:proof "Lemma 2 (Consistency of OLS) in Appendix A:
Under standard assumptions (linearity, full rank X, E[u|X]=0, finite variance),
the OLS estimator β̂ = (X'X)⁻¹X'y is consistent for β.
Proof uses law of large numbers and Slutsky's theorem."
```

##### 2. Specify Proof Location and Surrounding Context

```bash
/research:manuscript:proof "Theorem 1 on page 15 with proof in Appendix B.
Context: We've just established that E[û|X]=0 in equation (5) and need to
show this implies consistency of our estimator."
```

##### 3. Include Exact Assumption Statements

```bash
/research:manuscript:proof "[Provide proof text along with]:
Assumption A1: Linear model: Y = Xβ + u
Assumption A2: E[u|X] = 0 (conditional mean zero)
Assumption A3: X has full column rank
Assumption A4: E[u²|X] = σ² (homoscedasticity)
Assumption A5: uᵢ ⊥ uⱼ for i ≠ j (no autocorrelation)"
```

##### 4. Verify After Revision

After making suggested edits:

```bash
# Re-verify the revised proof
/research:manuscript:proof "[revised proof text]"

# Iterate until validation confirms all checks pass
```

#### When to Use Proof Validation

**Before submission:**

- Catch logical errors early
- Strengthen weak arguments
- Verify technical claims

**After reviewer comments:**

- Verify reviewer criticisms are addressed
- Check revised proofs haven't introduced errors
- Ensure corrections maintain rigor

**When extending proofs:**

- Adapting proofs from literature
- Modifying for your problem
- Combining multiple approaches

**For collaborative work:**

- Getting feedback before sharing with collaborators
- Standardizing notation across papers
- Documenting proof assumptions

#### Integration with Manuscript Development

```bash
# Workflow:
1. Write draft proof
/research:manuscript:proof "draft proof text"

2. Review validation report
3. Implement major revisions from report
4. Re-verify revised proof
/research:manuscript:proof "revised proof text"

5. Once validated, integrate into manuscript appendix
```

---

## Workflows

### Complete Manuscript Development Pipeline

```bash
# Phase 1: Planning
/research:lit-gap "research area"
/research:hypothesis "research question"
/research:analysis-plan "study design"

# Phase 2: Methods Writing
/research:manuscript:methods "your specific method"
# Review generated section
# Adapt as needed
# Insert into manuscript draft

# Phase 3: Results Generation
/research:manuscript:results "your findings and analysis"
# Generate results section and tables
# Add figures and visualizations
# Integrate into manuscript

# Phase 4: Appendix Development
/research:manuscript:proof "theoretical results in appendix"
# Validate all proofs
# Correct identified issues

# Phase 5: Submission and Peer Review
# Submit to journal
# Receive reviewer comments

# Phase 6: Revision
/research:manuscript:reviewer "reviewer comment 1"
/research:manuscript:reviewer "reviewer comment 2"
/research:manuscript:reviewer "reviewer comment 3"
# Implement revisions
# Re-verify proofs if modified
/research:manuscript:proof "revised proof if applicable"
# Generate revision response letter
```

### Rapid Iteration for Multiple Submissions

```bash
# Start with validated methods section
/research:manuscript:methods "core method"

# Generate multiple results sections for different analyses
/research:manuscript:results "Analysis 1"
/research:manuscript:results "Analysis 2"
/research:manuscript:results "Analysis 3"

# Test different results configurations
# Keep best version with highest quality methods section
```

### Collaborative Writing Workflow

```bash
# Author A: Generate methods
/research:manuscript:methods "method"

# Author B: Generate results
/research:manuscript:results "findings"

# Author C: Handle reviewers
/research:manuscript:reviewer "comment 1"
/research:manuscript:reviewer "comment 2"

# All authors: Validate proofs
/research:manuscript:proof "theoretical result"
```

---

## Advanced Topics

### Notation

See [Custom Notation Systems](#custom-notation-systems) section below for details on notation customization.

### Style Customization

See [Custom Notation Systems](#custom-notation-systems) and [Quality Standards](#quality-standards) sections for style customization options.

### Advanced Techniques

This section covers advanced manuscript writing techniques including custom notation, quality standards, and integration patterns. See sections below for details.

---

### Custom Notation Systems

Some fields use non-standard notation. Specify your convention:

```bash
# Causal inference with Pearl's notation
/research:manuscript:methods "mediation analysis [Use Pearl's do-calculus notation: do(X=x), direct effect via do(M=m), indirect effect via natural experiment]"

# Bayesian notation
/research:manuscript:methods "hierarchical model [Use hierarchical Bayes notation: x|θ ~ p(x|θ), θ|ψ ~ p(θ|ψ), ψ ~ p(ψ)]"

# Dynamic systems
/research:manuscript:methods "time-varying analysis [Use differential equation notation: dX/dt = f(X,t), with Itô processes for stochastic components]"
```

### Multi-Author Coordination

**Author roles:**

- Statistical methods lead: Uses `/research:manuscript:methods`
- Empirical analysis lead: Uses `/research:manuscript:results`
- Handling revisions: Uses `/research:manuscript:reviewer`
- Theory/appendix lead: Uses `/research:manuscript:proof`

**Coordination checklist:**

- [ ] Methods section approved before results writing
- [ ] Notation unified across all sections
- [ ] Table formatting consistent
- [ ] Proofs reviewed and validated before submission

### Version Control for Manuscripts

```bash
# Track which command generated which section
git commit -m "methods: generated via /research:manuscript:methods"
git commit -m "results: generated via /research:manuscript:results"
git commit -m "appendix: proof validated via /research:manuscript:proof"
```

### Reproducible Manuscript Pipeline

```bash
# Create standalone script that regenerates manuscript
#!/bin/bash

# Generate all sections
scholar /research:manuscript:methods "method description" > methods.md
scholar /research:manuscript:results "results description" > results.md
scholar /research:manuscript:reviewer "comments" > reviews.md

# Compile full manuscript
pandoc methods.md results.md -o manuscript.pdf
```

---

## Quality Standards

### Academic Rigor Requirements

**All generated content must:**

1. **Use correct statistical terminology**
   - "significantly different" only if p < α
   - "correlation" for association, not causation
   - "confidence interval" not "probability interval"

2. **Report all required statistics**
   - Exact p-values (unless p < .001)
   - Confidence intervals (standard 95%)
   - Effect sizes (Cohen's d, r, β, OR)
   - Sample sizes

3. **Justify methodological choices**
   - Why this method over alternatives
   - Assumptions required
   - When conclusions are valid

4. **Acknowledge limitations**
   - Sample size constraints
   - Assumption violations
   - Generalizability bounds

### Peer Review Readiness

Generated content anticipates reviewer concerns:

| Common Concern | How Addressed in Generated Content |
|----------------|-----------------------------------|
| Methods are vague | Precise notation, step-by-step procedures |
| Statistical reporting incomplete | All required statistics included |
| Assumptions not verified | Diagnostic results and robustness checks |
| Findings seem cherry-picked | Discussion of all analyses, sensitivity checks |
| Notation inconsistent | Unified system throughout |
| Proofs have gaps | Step-by-step justification with citations |

### Common Quality Issues and Prevention

| Issue | Prevention |
|-------|-----------|
| Overstated conclusions | Generated text uses appropriately qualified language |
| Missing methods details | Command requests specific, detailed descriptions |
| Incomplete results reporting | Output includes all major statistics in tables |
| Unjustified methodological choices | Response letter provides citations and reasoning |

---

## Integration with Other Commands

### Literature Integration

```bash
# Workflow connecting literature to manuscript:

# 1. Search literature
/research:arxiv "your topic"
/research:method-scout "statistical problem"

# 2. Get citations
/research:doi "DOI from literature search"

# 3. Add to bibliography
/research:bib:add entry.bib references.bib

# 4. Write methods citing discovered papers
/research:manuscript:methods "method [cite papers from literature search]"

# 5. Write results with methodology context
/research:manuscript:results "findings [in context of literature methods]"
```

### Simulation Integration

```bash
# Design and validate with simulation:

# 1. Plan study
/research:analysis-plan "study design"

# 2. Write planned methods section
/research:manuscript:methods "planned statistical approach"

# 3. Design simulation to validate
/research:simulation:design "validate method performance"

# 4. Analyze simulation results
/research:simulation:analysis results.csv

# 5. Reference simulation in methods and results
/research:manuscript:results "simulation validation results [cite simulation results]"
```

### Review Response Integration

```bash
# Complete review handling workflow:

# 1. Get reviewer suggestions
/research:manuscript:reviewer "reviewer comment"

# 2. Run suggested analyses
/research:simulation:design "analysis suggested by reviewer"

# 3. Generate updated results
/research:manuscript:results "new analysis findings"

# 4. Update methods if needed
/research:manuscript:methods "updated method incorporating reviewer suggestion"

# 5. Validate any new proofs
/research:manuscript:proof "new theoretical result"
```

---

## Troubleshooting

### Common Issues and Solutions

#### Methods Section

| Problem | Cause | Solution |
|---------|-------|----------|
| **Too technical for target audience** | Used overly specialized terminology | Re-run with request: "explain in terms accessible to [field] researchers without [specialty]" |
| **Missing important details** | Vague method description | Be more specific: instead of "mediation analysis," say "bootstrap percentile mediation with 10,000 resamples" |
| **Notation doesn't match literature** | No notation preference specified | Specify: "using Hayes (2013) notation" or "using Pearl's causal calculus" |
| **Assumptions seem too restrictive** | Didn't mention your data context | Add: "with appropriate handling of [specific data feature]" |

#### Results Section

| Problem | Cause | Solution |
|---------|-------|----------|
| **Numbers don't match my analysis** | Description was unclear or inconsistent with actual analysis | Specify exact output: paste test statistics or regression table values |
| **Table formatting looks wrong** | Markdown syntax issues | Verify all cells have data, check column count consistency |
| **Missing comparison between groups** | Didn't explicitly request comparison | Request: "compare Method 1 and Method 2 directly in results" |
| **Effect sizes are in different units** | Used heterogeneous measures | Request: "standardize all effect sizes to Cohen's d equivalents" |

#### Reviewer Responses

| Problem | Cause | Solution |
|---------|-------|----------|
| **Tone seems defensive** | Response emphasized methodology disagreement | Re-run focusing on: "acknowledge value of reviewer's perspective, explain why we used different approach" |
| **Doesn't address specific point** | Reviewer comment was compound or multi-part | Break into components: run separately for each concern |
| **Too much jargon for editor** | Used specialized statistical language | Request: "use language accessible to editor and non-specialist reviewers" |
| **Suggests analyses we can't do** | Misunderstood the data or constraints | Clarify in prompt: "given that data lacks [variable], what alternative analysis addresses this concern?" |

#### Proof Validation

| Problem | Cause | Solution |
|---------|-------|----------|
| **Report says proof fails** | Logical gap or invalid step exists | Review identified issues, revise proof, re-submit for validation |
| **Suggests changes we disagree with** | Different proof approach preferred | Consider both: implement suggestion or justify your approach in appendix discussion |
| **Notation inconsistencies identified** | Used different notation for same quantity | Standardize notation throughout, re-verify |

### Getting Better Results

**Be specific in descriptions:**

```bash
# ❌ Too vague
/research:manuscript:methods "statistical analysis"

# ✅ Good specificity
/research:manuscript:methods "ordinary least squares regression with robust Huber-White standard errors, testing coefficients with two-tailed t-tests at α=0.05"
```

**Include context and constraints:**

```bash
# ❌ Missing context
/research:manuscript:results "results of hypothesis test"

# ✅ With context
/research:manuscript:results "t-test comparing two independent groups (N=150 total), with equal variance assumption tested via Levene's test, primary outcome is continuous measure of depression"
```

**Reference your actual implementation:**

```bash
# ❌ Generic
/research:manuscript:methods "Bayesian model"

# ✅ Implementation-specific
/research:manuscript:methods "Bayesian hierarchical model fit using Stan (4 chains, 2000 iterations, 1000 warmup) with normal(0,10) priors on fixed effects and exponential(1) on SD parameters"
```

---

## See Also

- **[Research Commands Reference](RESEARCH-COMMANDS-REFERENCE.md)** - Overview of all {{ scholar.research_commands }} research commands
- **[Literature Commands](LITERATURE-COMMANDS.md)** - Comprehensive literature management guide
- **[Simulation Commands](SIMULATION-COMMANDS.md)** - Complete simulation study reference
- **[Skills Guide](../skills.md)** - 17 research skills for interactive assistance
- **[Examples](../examples/research.md)** - Real-world usage examples

### Related Documentation

- **[Teaching Style Guide](../TEACHING-STYLE-GUIDE.md)** - Standards for reporting statistics and notation
- **[API Wrappers](../api-wrappers.md)** - Shell-based command APIs
- **[COMMAND-EXAMPLES](../COMMAND-EXAMPLES.md)** - Real-world usage scenarios

---

**Document Version:** {{ scholar.version }}
**Last Updated:** 2026-01-31
**Total Commands Documented:** 4
**Status:** Complete reference for manuscript writing commands
