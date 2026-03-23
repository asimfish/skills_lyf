---
render_macros: false
---

# Tutorial: Manuscript Writing with Scholar

**Target Audience:** Researchers writing methods, results, or responding to reviews
**Time:** 60-90 minutes (broken into 6 focused sessions)
**Difficulty:** Intermediate

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Write statistically rigorous methods sections
- Generate properly formatted results sections
- Craft professional responses to reviewer comments
- Validate mathematical proofs for correctness
- Integrate AI-generated content into LaTeX/Quarto manuscripts
- Customize output to match journal style guides
- Build complete manuscript sections progressively

## Prerequisites

Before starting, make sure you have:

- [ ] Scholar installed (`brew install data-wise/tap/scholar`)
- [ ] Claude Code running
- [ ] Basic statistical knowledge (regression, hypothesis testing)
- [ ] A research project or paper in progress
- [ ] (Optional) LaTeX or Quarto setup
- [ ] (Optional) Overleaf account for collaboration

**Installation Check:**

```bash
scholar --version
# Should show: scholar v2.6.0 or later

# Verify manuscript commands are available
/research:manuscript:methods --help
```

---

## Tutorial Structure

This tutorial is organized into 6 progressive sessions, each building on the previous:

| Session | Topic | Time | Skill Level |
|---------|-------|------|-------------|
| [1](#session-1-your-first-methods-section-10-minutes) | First methods section | 10 min | Beginner |
| [2](#session-2-writing-results-sections-15-minutes) | Results section | 15 min | Beginner |
| [3](#session-3-responding-to-reviewers-20-minutes) | Reviewer responses | 20 min | Intermediate |
| [4](#session-4-proof-validation-15-minutes) | Mathematical proofs | 15 min | Intermediate |
| [5](#session-5-advanced-customization-15-minutes) | Custom notation & style | 15 min | Advanced |
| [6](#session-6-complete-manuscript-workflow-20-minutes) | Full workflow | 20 min | Advanced |

**Recommended Learning Path:**

- **Quick Start:** Sessions 1-2 (25 minutes)
- **Writing a Paper:** Sessions 1-3 (45 minutes)
- **Complete Mastery:** All sessions (90 minutes)

You can complete these sessions in one sitting or spread them across multiple writing sessions.

---

## Session 1: Your First Methods Section ⏱️ 10 minutes

### Learning Objectives

- Understand what makes a good statistical methods section
- Generate a basic methods section using Scholar
- Edit and customize generated content
- Export to your manuscript format

### What You'll Build

A complete methods section for a mediation analysis study with:

- Clear statistical framework
- Proper mathematical notation
- Parameter definitions
- Estimation procedures
- Stated assumptions

### Step 1.1: Simple Methods Generation (3 min)

**Scenario:** You conducted a randomized controlled trial testing if a behavioral intervention reduces depression symptoms through increased social support.

**Try this command:**

```bash
/research:manuscript:methods "Describe the statistical methods for a randomized controlled trial examining the indirect effect of a behavioral intervention on depression symptoms mediated by social support. Use the product-of-coefficients method with bootstrap confidence intervals."
```

**What Happens:**

Scholar generates a complete methods section with:

- Causal mediation framework
- Model specification
- Parameter definitions
- Bootstrap procedure
- Assumptions

### Expected Output

```markdown
## Statistical Analysis

### Causal Mediation Framework

We employed the counterfactual framework for causal mediation analysis
(Pearl, 2001; Imai et al., 2010) to decompose the total treatment effect
into direct and indirect components. Let Y denote the outcome variable
(depression symptoms measured by BDI-II), M denote the mediator (social
support measured by MSPSS), and Z denote the binary treatment indicator
(Z = 1 for intervention, Z = 0 for control).

The total effect (TE) can be expressed as:

TE = E[Y(1, M(1))] - E[Y(0, M(0))]

where Y(z, m) represents the potential outcome under treatment z and
mediator value m.

### Mediation Analysis

We estimated the natural indirect effect (NIE) using the product-of-
coefficients method (MacKinnon et al., 2007). Under sequential ignorability
(Imai et al., 2010), the NIE is identified by:

NIE = α × β

where:
- α = treatment effect on the mediator (Z → M)
- β = mediator effect on outcome (M → Y | Z)

### Statistical Models

**Mediator model:**
M = α₀ + α₁Z + ε_M

**Outcome model:**
Y = β₀ + β₁Z + β₂M + ε_Y

where ε_M and ε_Y are error terms assumed independent.

### Parameter Estimation

We estimated model parameters using ordinary least squares regression.
The indirect effect θ = αβ was calculated as the product of coefficients
from the two regression models.

### Confidence Intervals

We constructed 95% confidence intervals using the percentile bootstrap
method (Efron & Tibshirani, 1993) with 10,000 bootstrap resamples. The
bootstrap procedure involved:

1. Resample n observations with replacement from the original data
2. Estimate α and β on the bootstrap sample
3. Calculate θ* = α*β*
4. Repeat steps 1-3 B = 10,000 times
5. Obtain CI from 2.5th and 97.5th percentiles of bootstrap distribution

### Assumptions

The causal interpretation of indirect effects requires:

1. **No unmeasured confounding** of the treatment-outcome relationship
2. **No unmeasured confounding** of the mediator-outcome relationship
3. **No unmeasured confounding** of the treatment-mediator relationship
4. **No mediator-outcome confounder** affected by treatment

Assumption 1 is satisfied by randomization. Assumptions 2-4 require
careful study design and covariate adjustment.

### Software

All analyses were conducted in R version 4.3.0 (R Core Team, 2023)
using the mediation package (Tingley et al., 2014) for bootstrap
inference.
```

### ✅ Checkpoint 1.1

- [ ] Output includes a clear framework section
- [ ] Mathematical notation is properly formatted
- [ ] All parameters are defined (α, β, θ, etc.)
- [ ] Assumptions are stated explicitly
- [ ] References are included (Pearl, MacKinnon, etc.)

**Troubleshooting:**

- **Output too brief:** Add more specifics to your prompt (sample size, controls)
- **Missing notation:** Request "with full mathematical notation" in prompt
- **Wrong method:** Be very specific about statistical approach

### Step 1.2: Refining the Output (3 min)

The generated section is good, but you might want to customize it. Here are common refinements:

**Add more statistical detail:**

```bash
/research:manuscript:methods "Describe the statistical methods for a randomized controlled trial examining the indirect effect of a behavioral intervention on depression symptoms mediated by social support. Use the product-of-coefficients method with bootstrap confidence intervals (10,000 replicates). Include power analysis, sample size justification, and handling of missing data using multiple imputation."
```

**Change notation style:**

```bash
/research:manuscript:methods "Describe the statistical methods for mediation analysis. Use matrix notation for regression models, bold for vectors, and mathcal for sets. Specify all distributional assumptions explicitly."
```

**Match journal requirements:**

```bash
/research:manuscript:methods "Describe the statistical methods for mediation analysis following APA reporting guidelines. Include effect sizes, confidence intervals (not p-values), and specify all model assumptions."
```

### Step 1.3: Exporting to Your Manuscript (2 min)

**For LaTeX/Overleaf:**

```bash
# Generate and copy to clipboard (macOS)
/research:manuscript:methods "your description" | pbcopy

# Or save to file
/research:manuscript:methods "your description" > methods-draft.tex
```

**For Quarto/R Markdown:**

```bash
# Save as markdown
/research:manuscript:methods "your description" > methods.md

# Then include in your .qmd:
# ```{r child = "methods.md"}
# ```
```

**For Word/Google Docs:**

1. Generate output
2. Copy markdown text
3. Use Pandoc to convert: `pandoc methods.md -o methods.docx`
4. Or paste directly and format manually

### Step 1.4: Editing Best Practices (2 min)

**Always customize the generated content:**

1. **Add study-specific details:**
   - Your actual sample size
   - Specific measurement scales used
   - Actual control variables
   - Data collection procedures

2. **Check all citations:**
   - Verify year and author names
   - Add missing references
   - Use your bibliography format

3. **Adjust notation:**
   - Match your existing manuscript notation
   - Be consistent with figures/tables
   - Follow journal style guide

4. **Add context:**
   - Why you chose this method
   - How it addresses your research question
   - Advantages over alternatives

### ✅ Checkpoint 1.2

- [ ] You can generate methods sections in under 1 minute
- [ ] You know how to refine prompts for better output
- [ ] You can export to your manuscript format
- [ ] You understand what to customize in generated content

### Practice Exercise 1

Generate a methods section for your own research project. Try:

```bash
/research:manuscript:methods "[YOUR STUDY DESIGN] examining [YOUR OUTCOME] [YOUR PREDICTORS/TREATMENT]. Use [YOUR STATISTICAL METHOD]. Include [SPECIFIC REQUIREMENTS]."
```

**Example for your context:**

- RCT with parallel groups
- Observational study with propensity scores
- Simulation study design
- Meta-analysis approach

---

## Session 2: Writing Results Sections ⏱️ 15 minutes

### Learning Objectives

- Structure results sections for clarity
- Report statistics with proper formatting
- Create table and figure descriptions
- Interpret findings statistically and scientifically

### What You'll Build

A complete results section including:

- Descriptive statistics
- Primary analysis results
- Secondary analyses
- Table/figure descriptions
- Statistical interpretation

### Step 2.1: Basic Results Section (5 min)

**Scenario:** You analyzed your mediation data and found a significant indirect effect.

```bash
/research:manuscript:results "Report results from a mediation analysis examining the indirect effect of a behavioral intervention on depression through social support. Sample size n=200, indirect effect estimate = 0.45, 95% CI [0.21, 0.73], p < 0.001. The direct effect was not significant."
```

### Expected Output

```markdown
## Results

### Sample Characteristics

A total of N = 200 participants completed the study and were included in
the analysis (intervention: n = 100, control: n = 100). [Note: Add
descriptive statistics table here based on your actual data]

### Primary Analysis: Mediation Effects

We tested whether social support mediated the effect of the behavioral
intervention on depression symptoms using the product-of-coefficients
approach with bootstrap confidence intervals.

**Indirect Effect:**
The intervention had a significant positive indirect effect on depression
reduction through increased social support (θ = 0.45, 95% CI [0.21, 0.73],
p < .001). This indicates that approximately 45% of a standard deviation
improvement in depression symptoms was attributable to the intervention's
effect on social support.

**Direct Effect:**
The direct effect of the intervention on depression, controlling for
social support, was not statistically significant (β₁ = 0.12, 95% CI
[-0.08, 0.32], p = .24), suggesting that the intervention's beneficial
effect operated primarily through enhancing social support rather than
through other mechanisms.

**Total Effect:**
The total intervention effect (combining direct and indirect pathways)
was θ_total = 0.57, 95% CI [0.33, 0.81], p < .001, representing a
moderate-to-large effect size (Cohen's d ≈ 0.57).

### Model Components

**Treatment Effect on Mediator:**
The intervention significantly increased social support compared to
control (α = 0.62, 95% CI [0.41, 0.83], p < .001), with intervention
participants reporting approximately 0.62 SD higher social support
scores.

**Mediator Effect on Outcome:**
Higher social support was significantly associated with lower depression
symptoms, adjusting for treatment assignment (β₂ = 0.73, 95% CI [0.54,
0.92], p < .001). Each standard deviation increase in social support
was associated with a 0.73 SD decrease in depression.

### Effect Decomposition

The proportion of the total effect mediated through social support was
79% (calculated as NIE/TE = 0.45/0.57), indicating that social support
was the primary mechanism through which the intervention reduced
depression symptoms.

### Sensitivity Analysis

[Note: Add sensitivity analysis results if conducted, such as testing
for unmeasured confounding using sensitivity parameters]
```

### ✅ Checkpoint 2.1

- [ ] Results are reported with effect sizes and CIs
- [ ] Statistical significance is stated clearly
- [ ] Interpretation connects statistics to research question
- [ ] Proper formatting (italics for statistics, correct decimal places)

### Step 2.2: Reporting Simulation Results (5 min)

**Scenario:** You ran a Monte Carlo simulation comparing bootstrap methods.

```bash
/research:manuscript:results "Report Monte Carlo simulation results comparing percentile bootstrap vs BCa bootstrap for mediation confidence intervals. Sample sizes: 50, 100, 200, 500. True indirect effect = 0.3. Results: Coverage rates for percentile method ranged from 0.89 (n=50) to 0.95 (n=500). BCa method achieved 0.93-0.96 coverage across all sample sizes. Mean bias was -0.02 for both methods."
```

### Expected Output

```markdown
## Simulation Results

### Design

We conducted a Monte Carlo simulation study with 5,000 replications
per condition to compare the performance of percentile bootstrap and
bias-corrected accelerated (BCa) bootstrap confidence intervals for
indirect effects. Sample sizes of n = 50, 100, 200, and 500 were
examined, with a true indirect effect of θ = 0.30.

### Coverage Rates

Table 1 presents the empirical coverage rates for 95% confidence
intervals across methods and sample sizes.

**Table 1.** Empirical Coverage Rates for 95% Confidence Intervals

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Percentile | 0.890 | 0.923 | 0.941 | 0.950 |
| BCa | 0.931 | 0.952 | 0.956 | 0.960 |

The percentile method showed under-coverage for small samples (n ≤ 100),
achieving only 89.0% coverage at n = 50, falling short of the nominal
95% level. Coverage improved with increasing sample size, reaching
95.0% at n = 500.

The BCa method achieved near-nominal or slightly conservative coverage
across all sample sizes, ranging from 93.1% (n = 50) to 96.0% (n = 500).
Notably, BCa maintained appropriate coverage even at the smallest sample
size examined.

### Bias

Both methods exhibited minimal bias in point estimation:
- Percentile method: Mean bias = -0.02, SD = 0.01
- BCa method: Mean bias = -0.02, SD = 0.01

The similarity in bias suggests that differences in coverage were driven
by interval construction rather than point estimation.

### Interval Width

**Table 2.** Mean Confidence Interval Width

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Percentile | 0.512 | 0.361 | 0.255 | 0.161 |
| BCa | 0.548 | 0.381 | 0.267 | 0.168 |

BCa intervals were slightly wider than percentile intervals across all
conditions (approximately 7% wider on average), reflecting the bias
correction that improves coverage at the cost of slightly reduced
precision.

### Computational Efficiency

Mean computation time (1,000 bootstrap replicates):
- Percentile method: 2.3 seconds
- BCa method: 3.1 seconds (35% slower)

### Recommendations

For mediation analysis with bootstrap inference:
1. **Use BCa when n < 200** to ensure adequate coverage
2. **Either method acceptable when n ≥ 200**, with percentile slightly
   more efficient
3. **Minimum sample size recommendation:** n ≥ 100 for reliable inference
4. **Use ≥ 5,000 bootstrap replicates** for stable interval estimates
```

### ✅ Checkpoint 2.2

- [ ] Simulation design is clearly described
- [ ] Tables summarize key performance metrics
- [ ] Coverage rates are compared to nominal levels
- [ ] Practical recommendations are provided

### Step 2.3: Table and Figure Descriptions (3 min)

When reporting results, Scholar helps you describe what tables and figures should show:

```bash
/research:manuscript:results "Describe tables and figures for reporting multiple regression results with 5 predictors, adjusted R-squared = 0.42, and individual coefficient tests. Include model diagnostics."
```

The output will suggest:

**Table 1: Regression Coefficients**

- Columns: Predictor, B, SE(B), β, 95% CI, t, p
- Rows: Each predictor + intercept
- Footer: Model R² and F-test

**Table 2: Model Diagnostics**

- Normality tests (Shapiro-Wilk)
- Homoscedasticity (Breusch-Pagan)
- Multicollinearity (VIF values)
- Influential observations (Cook's D)

**Figure 1: Residual Diagnostic Plots**

- Panel A: Residuals vs. Fitted values
- Panel B: Q-Q plot for normality
- Panel C: Scale-location plot
- Panel D: Cook's distance plot

### Step 2.4: Integration with Analysis Code (2 min)

**For R users:**

```r
# Run your analysis
mediation_results <- mediate(model.m, model.y, treat = "Z", mediator = "M",
                              boot = TRUE, sims = 10000)

# Generate results section with actual numbers
summary_text <- sprintf(
  "indirect effect = %.2f, 95%% CI [%.2f, %.2f]",
  mediation_results$d0,
  mediation_results$d0.ci[1],
  mediation_results$d0.ci[2]
)

# Pass to Scholar
system(paste0('/research:manuscript:results "', summary_text, '"'))
```

**For Python users:**

```python
from statsmodels.regression.linear_model import OLS
import subprocess

# Run mediation analysis
# ... your analysis code ...

# Generate results section
results_prompt = f"Report mediation results with indirect effect = {indirect_effect:.2f}, 95% CI [{ci_lower:.2f}, {ci_upper:.2f}]"

subprocess.run(['/research:manuscript:results', results_prompt])
```

### ✅ Checkpoint 2.3

- [ ] You can generate results sections from your data
- [ ] Tables and figures are described appropriately
- [ ] You know how to integrate with analysis code
- [ ] Statistical reporting follows APA/journal guidelines

### Practice Exercise 2

Generate a results section for your own analysis. Include:

- Your actual effect sizes and CIs
- p-values (if required by journal)
- Sample sizes
- Any subgroup analyses

---

## Session 3: Responding to Reviewers ⏱️ 20 minutes

### Learning Objectives

- Craft professional, respectful responses
- Provide statistical justification for choices
- Suggest additional analyses when appropriate
- Structure point-by-point responses
- Maintain productive tone even for harsh criticism

### What You'll Build

Complete reviewer response letters with:

- Acknowledgment of valid concerns
- Evidence-based rebuttals
- Additional analyses
- Manuscript revision tracking

### Step 3.1: Handling Methodological Questions (5 min)

**Scenario:** Reviewer 2 questions your choice of the product-of-coefficients method over the difference-in-coefficients approach.

```bash
/research:manuscript:reviewer "Reviewer 2 comments: 'The authors use the product-of-coefficients method for mediation analysis but do not justify why this was chosen over the difference-in-coefficients approach. The latter is more robust to model misspecification.'"
```

### Expected Output

```markdown
## Response to Reviewer 2, Comment 1

**Reviewer Comment:**
"The authors use the product-of-coefficients method for mediation analysis
but do not justify why this was chosen over the difference-in-coefficients
approach. The latter is more robust to model misspecification."

**Response:**

We thank the reviewer for this important methodological comment. We have
now added explicit justification for our choice of the product-of-
coefficients method in the revised manuscript.

**Justification for Method Choice:**

While we acknowledge that both approaches have merit, we selected the
product-of-coefficients method for the following reasons:

1. **Statistical Power:** The product method has been shown to have
   higher statistical power than the difference method in randomized
   trials where there is no baseline confounding of the treatment-
   mediator relationship (MacKinnon et al., 2002). In our RCT design,
   randomization ensures no such confounding, making the product method
   more efficient.

2. **Direct Interpretation:** The product αβ has a clear causal
   interpretation as the natural indirect effect under sequential
   ignorability (Imai et al., 2010), which aligns with our research
   questions about the mediation mechanism.

3. **Established Practice:** The product-of-coefficients approach is
   the most widely used method in our field (psychology/behavioral
   science), facilitating comparison with existing literature. Over 80%
   of mediation studies in [Journal Name] use this approach (see
   systematic review by Smith et al., 2020).

**Addressing Robustness Concerns:**

We agree that robustness to model misspecification is important. To
address this concern, we have conducted the following sensitivity
analyses (now included in the revised manuscript):

1. **Alternative Estimation:** We re-estimated the indirect effect using
   the difference-in-coefficients method and found substantively similar
   results (θ_diff = 0.43, 95% CI [0.19, 0.71] vs. θ_product = 0.45,
   95% CI [0.21, 0.73]). This convergence of methods provides reassurance
   about our conclusions. (New Table S3, Supplementary Materials)

2. **Nonparametric Bootstrap:** We used bootstrap resampling rather than
   delta-method standard errors, which is robust to non-normality and
   other distributional assumption violations.

3. **Model Diagnostics:** We added diagnostic checks for linearity,
   homoscedasticity, and normality (New Figure S2, Supplementary
   Materials), which support the appropriateness of our linear models.

**Changes Made:**

1. Added methodological justification in Methods section (Page 8, Lines
   234-248)
2. Added sensitivity analysis comparing product vs. difference methods
   (Page 15, Lines 412-428; Table S3)
3. Added model diagnostic section (Supplementary Materials, Section 2.3)

**Supporting Citations:**

- MacKinnon, D. P., Lockwood, C. M., Hoffman, J. M., West, S. G., &
  Sheets, V. (2002). A comparison of methods to test mediation and
  other intervening variable effects. *Psychological Methods*, *7*(1), 83.
- Imai, K., Keele, L., & Tingley, D. (2010). A general approach to
  causal mediation analysis. *Psychological Methods*, *15*(4), 309.

We believe these additions and analyses adequately address the reviewer's
concerns about method choice and robustness. We appreciate the reviewer's
careful attention to methodological details, which has strengthened the
manuscript.
```

### ✅ Checkpoint 3.1

- [ ] Response acknowledges the reviewer's concern
- [ ] Justification is evidence-based with citations
- [ ] Additional analysis is offered
- [ ] Changes to manuscript are clearly documented
- [ ] Tone is respectful and appreciative

### Step 3.2: Addressing Sample Size Concerns (5 min)

**Scenario:** Reviewer raises concern about statistical power.

```bash
/research:manuscript:reviewer "Reviewer 3 states: 'The sample size of N=150 seems small for a mediation analysis. The authors should provide a power analysis or justify why this sample size is adequate.'"
```

### Expected Output

```markdown
## Response to Reviewer 3, Comment 2

**Reviewer Comment:**
"The sample size of N=150 seems small for a mediation analysis. The
authors should provide a power analysis or justify why this sample size
is adequate."

**Response:**

We thank the reviewer for raising this important question about statistical
power. We have now added a comprehensive power analysis to the revised
manuscript.

**A Priori Power Analysis:**

We conducted an a priori power analysis using the approach of Schoemann
et al. (2017) for mediation analysis. The key parameters were:

- **Effect Sizes:**
  - Treatment → Mediator (α): Expected d = 0.50 (medium effect)
  - Mediator → Outcome (β): Expected d = 0.50 (medium effect)
  - Indirect effect: Expected θ = 0.25 (αβ product)

- **Target Power:** 0.80
- **Significance Level:** α = .05 (two-tailed)
- **Method:** Bootstrap confidence intervals (10,000 replicates)

**Power Analysis Results:**

Using Monte Carlo simulation (5,000 replications), our sample size of
N = 150 provides:
- **Power = 0.82** for detecting the indirect effect
- **Power = 0.91** for detecting the treatment effect on mediator
- **Power = 0.88** for detecting the mediator effect on outcome

This exceeds the conventional 0.80 threshold for adequate power.

**Comparison to Published Studies:**

A systematic review of mediation studies in [Journal/Field] (Jones et al.,
2019) found a median sample size of N = 145 (IQR: 98-210). Our sample
size is thus consistent with published practice in the field.

**Empirical Verification:**

Our bootstrap confidence intervals for the indirect effect did not include
zero (95% CI [0.21, 0.73]), and the interval width (0.52) suggests
adequate precision for detecting meaningful effects. The fact that we
obtained a statistically significant result provides empirical evidence
that the study was adequately powered.

**Sensitivity Analysis:**

To address concerns about potential inflation of effects due to small
sample size, we conducted:

1. **Bias-Corrected Bootstrap:** BCa intervals (95% CI [0.19, 0.71])
   were similar to percentile intervals, suggesting minimal small-sample
   bias.

2. **Cross-Validation:** We used 5-fold cross-validation to assess
   model stability. The cross-validated indirect effect estimate was
   θ_cv = 0.43 (SE = 0.09), very close to the full-sample estimate
   (θ = 0.45), indicating robust findings.

**Changes Made:**

1. Added power analysis section to Methods (Page 9, Lines 267-285)
2. Added Table 2: Power Analysis Results
3. Added sensitivity analysis for small-sample bias (Supplementary
   Materials, Section 2.4)
4. Cited Schoemann et al. (2017) power analysis approach

**Supporting Citations:**

- Schoemann, A. M., Boulton, A. J., & Short, S. D. (2017). Determining
  power and sample size for simple and complex mediation models. *Social
  Psychological and Personality Science*, *8*(4), 379-386.
- Jones, L., et al. (2019). Sample size practices in mediation studies:
  A systematic review. [Journal details]

We believe these additions demonstrate that our sample size was adequate
for the research question and that our findings are robust.
```

### ✅ Checkpoint 3.2

- [ ] Power analysis is provided with specific numbers
- [ ] Effect sizes are justified with literature
- [ ] Empirical verification supports adequacy
- [ ] Additional robustness checks are included

### Step 3.3: Handling Assumption Violations (5 min)

```bash
/research:manuscript:reviewer "Reviewer 1 notes: 'The authors assume normality but do not test this assumption. Residual plots should be provided, and if normality is violated, robust methods should be used.'"
```

### Expected Output

```markdown
## Response to Reviewer 1, Comment 3

**Reviewer Comment:**
"The authors assume normality but do not test this assumption. Residual
plots should be provided, and if normality is violated, robust methods
should be used."

**Response:**

We thank the reviewer for this careful attention to model assumptions.
We have now added comprehensive diagnostic checks for all model
assumptions.

**Normality Diagnostics:**

We assessed normality of residuals using:

1. **Visual Inspection:**
   - Q-Q plots (New Figure 2, Panels A-B) show residuals closely follow
     the theoretical normal distribution for both mediator and outcome
     models.
   - Histogram of residuals (Figure S1, Supplementary) shows
     approximately normal distribution.

2. **Formal Tests:**
   - Shapiro-Wilk test for mediator model: W = 0.986, p = .18
   - Shapiro-Wilk test for outcome model: W = 0.983, p = .12
   - Both tests fail to reject normality at α = .05

**Results:**

The diagnostic analyses indicate that the normality assumption is
reasonable for our data. Nonetheless, we agree that robust methods provide
valuable sensitivity checks.

**Robustness Analyses:**

To ensure our findings are not dependent on the normality assumption, we
conducted the following additional analyses:

1. **Bootstrap Inference:**
   - Our primary inference already uses nonparametric bootstrap confidence
     intervals (10,000 replicates), which do not require normality
     assumptions and are robust to distributional violations.
   - Bootstrap CIs remain valid under quite general conditions (Efron &
     Tibshirani, 1993).

2. **Robust Standard Errors:**
   - We re-estimated models using heteroscedasticity-consistent (HC3)
     standard errors.
   - Results were substantively unchanged:
     - Original: θ = 0.45, 95% CI [0.21, 0.73]
     - Robust SE: θ = 0.45, 95% CI [0.20, 0.74]

3. **Permutation Test:**
   - We conducted a permutation test (10,000 permutations) for the
     indirect effect, which is fully distribution-free.
   - Permutation p-value = 0.002, consistent with bootstrap inference
     (p < .001).

4. **Rank-Based Methods:**
   - As an additional robustness check, we estimated the indirect effect
     using Spearman rank correlations rather than Pearson.
   - Rank-based indirect effect: θ_rank = 0.41, similar to parametric
     estimate (θ = 0.45).

**Other Assumptions:**

We also checked:

- **Homoscedasticity:** Breusch-Pagan test (p = .34) and residual plots
  (Figure 2, Panels C-D) suggest constant variance.
- **Linearity:** Component-plus-residual plots (Figure S2) support linear
  relationships.
- **Independence:** Durbin-Watson statistic (DW = 1.98) indicates no
  autocorrelation.

**Changes Made:**

1. Added "Assumption Diagnostics" subsection to Methods (Page 10, Lines
   298-315)
2. Added Figure 2: Diagnostic Plots (Q-Q plots, residual plots)
3. Added Table 3: Formal Diagnostic Tests (normality, homoscedasticity)
4. Added robustness analyses (Supplementary Materials, Section 2.5)
5. Reported robust standard errors alongside original estimates

We appreciate the reviewer's suggestion to thoroughly examine model
assumptions. The comprehensive diagnostics and robustness analyses
strengthen confidence in our findings.
```

### ✅ Checkpoint 3.3

- [ ] Diagnostic tests are clearly reported
- [ ] Multiple robustness checks are provided
- [ ] Results are compared across methods
- [ ] Figures and tables are referenced specifically

### Step 3.4: Responding to Harsh Criticism (3 min)

Sometimes reviewers are critical or dismissive. Here's how to respond professionally:

```bash
/research:manuscript:reviewer "Reviewer 2 writes: 'The authors' approach is fundamentally flawed. They clearly don't understand the assumptions of causal mediation analysis. This manuscript should be rejected.'"
```

Scholar helps you craft a measured, professional response that:

- Acknowledges the concern without being defensive
- Provides clear explanation and evidence
- Suggests revisions to clarify
- Maintains respectful tone

**Key Principles:**

- Never say "The reviewer is wrong" or "The reviewer misunderstands"
- Instead: "We appreciate the opportunity to clarify" or "We have now made this more explicit"
- Provide education without being condescending
- Show how you've improved the manuscript

### Step 3.5: Complete Response Letter Template (2 min)

Structure your full response letter like this:

```markdown
# Response to Reviewers

We thank the editor and reviewers for their thoughtful and constructive
feedback. We have carefully addressed all comments and believe the
manuscript is substantially improved as a result. Below we provide point-
by-point responses to each comment. Changes to the manuscript are
highlighted in blue in the revised version, and we reference specific
page and line numbers.

---

## Reviewer 1

### Comment 1.1: [Topic]
[Reviewer's comment verbatim]

**Response:**
[Your response following the patterns above]

**Changes Made:**
- [Specific change 1] (Page X, Lines Y-Z)
- [Specific change 2] (New Table/Figure N)

---

### Comment 1.2: [Topic]
...

---

## Reviewer 2
[Continue same format]

---

## Reviewer 3
[Continue same format]

---

## Summary of Major Changes

We have made the following major revisions to address reviewer concerns:

1. Added comprehensive power analysis (Reviewer 3)
2. Included model diagnostics and robustness checks (Reviewer 1)
3. Expanded methodological justification (Reviewer 2)
4. Added 3 new supplementary tables and 2 new figures

We believe these revisions have substantially strengthened the manuscript
and adequately addressed all reviewer concerns.

Thank you for the opportunity to revise and resubmit our work.

Sincerely,
[Authors]
```

### ✅ Checkpoint 3.4

- [ ] You can generate professional responses to any reviewer comment
- [ ] You know how to structure a complete response letter
- [ ] You can maintain respectful tone even with harsh criticism
- [ ] Changes to manuscript are clearly documented

### Practice Exercise 3

Take a real reviewer comment from your research (or make one up) and generate a response:

```bash
/research:manuscript:reviewer "YOUR REVIEWER COMMENT HERE"
```

Review the output and refine it with study-specific details.

---

## Session 4: Proof Validation ⏱️ 15 minutes

### Learning Objectives

- Validate mathematical proofs for logical correctness
- Check assumption completeness
- Identify gaps in reasoning
- Ensure proper notation usage
- Prepare proofs for publication

### What You'll Build

Validated mathematical proofs with:

- Logical flow verification
- Assumption checking
- Notation consistency review
- Completeness assessment
- Suggested improvements

### Step 4.1: Simple Consistency Proof (5 min)

**Scenario:** You have a proof that your estimator is consistent.

```bash
/research:manuscript:proof "Verify the following proof of consistency: We show that the indirect effect estimator θ-hat = α-hat × β-hat is consistent for θ = αβ. Proof: By the law of large numbers, α-hat converges in probability to α, and β-hat converges in probability to β. By the continuous mapping theorem, the product α-hat × β-hat converges in probability to αβ. Therefore θ-hat is consistent for θ."
```

### Expected Output

```markdown
## Proof Validation Report

### Overall Assessment
**Status:** PASS with suggested improvements

The proof is logically sound and reaches the correct conclusion. However,
some assumptions are implicit and should be stated explicitly for rigor.

---

### Logical Structure ✓

**Strengths:**
- Proof follows a clear logical progression
- Each step builds on the previous
- Conclusion follows from premises
- Continuous mapping theorem is applied correctly

**Structure:**
1. α-hat → α (in probability)
2. β-hat → β (in probability)
3. Product → product via continuous mapping theorem
4. Conclusion: θ-hat consistent for θ

This is the standard proof structure for consistency of derived
estimators and is valid.

---

### Mathematical Rigor ✓

**Correct Applications:**
- Law of large numbers invoked for primitive estimators
- Continuous mapping theorem applied appropriately (multiplication is
  continuous)
- Convergence in probability defined correctly

**Notation:**
- θ-hat, α-hat, β-hat are standard and clear
- Convergence notation (→_p) should be made explicit

---

### Assumptions Analysis ⚠️

**Stated Assumptions:**
None explicitly stated

**Implicit Assumptions Requiring Clarification:**

1. **Regularity Conditions for α-hat:**
   - What estimator is used for α? (OLS, MLE, etc.)
   - What are the required moment conditions?
   - Is the model correctly specified?

2. **Regularity Conditions for β-hat:**
   - Same questions as for α-hat
   - Are there any endogeneity concerns?

3. **Sample Size Conditions:**
   - Both estimators must be based on the same sample (or related samples)
   - Independent observations required for LLN

4. **Boundedness:**
   - Are α and β finite? (Needed for continuous mapping)
   - Are variances finite? (Needed for LLN)

**Suggested Addition:**

"Assume the following regularity conditions:
(A1) α-hat is the OLS estimator from the model M = α₀ + α₁Z + ε_M with
      E[ε_M] = 0 and Var(ε_M) = σ²_M < ∞
(A2) β-hat is the OLS estimator from the model Y = β₀ + β₁Z + β₂M + ε_Y
      with E[ε_Y | Z, M] = 0 and Var(ε_Y) = σ²_Y < ∞
(A3) Observations are independent and identically distributed
(A4) |α| < ∞ and |β| < ∞

Under these conditions, by the law of large numbers for OLS estimators
(White, 1984), α-hat →_p α and β-hat →_p β. Since the product function
is continuous, by the continuous mapping theorem (van der Vaart, 1998),
θ-hat = α-hat β-hat →_p αβ = θ."

---

### Completeness Analysis

**What's Missing:**

1. **Rate of Convergence:**
   - The proof shows consistency but not the rate
   - For inference, we need √n-consistency
   - Consider adding: "At rate √n under standard regularity conditions"

2. **Joint Convergence:**
   - The proof assumes α-hat and β-hat can be treated independently
   - They are estimated from overlapping data, so joint distribution matters
   - For precision, state: "Using joint convergence of (α-hat, β-hat) by
     multivariate CLT"

3. **Identification:**
   - Consistency requires the parameter to be identified
   - Add: "Assuming θ is identified by the model specification"

**Edge Cases Not Addressed:**

- What if α = 0 or β = 0? (Trivial but should note)
- What if σ²_M = 0? (Degenerate mediator)

---

### Notation Consistency ✓

**Current Notation:**
- θ-hat: Estimator (good)
- θ: Population parameter (good)
- α-hat, β-hat: Component estimators (good)

**Suggested Improvements:**
- Use →_p explicitly for convergence in probability
- Define n (sample size) and let n → ∞
- Use standard probability notation: plim_{n→∞} θ-hat = θ

---

### Suggested Improved Version

**Theorem:** Consistency of Indirect Effect Estimator

Let θ-hat_n = α-hat_n β-hat_n denote the product-of-coefficients estimator
of the indirect effect based on a sample of size n.

**Assumptions:**
(A1) α-hat_n is the OLS estimator from M_i = α₀ + α₁Z_i + ε_{Mi}
(A2) β-hat_n is the OLS estimator from Y_i = β₀ + β₁Z_i + β₂M_i + ε_{Yi}
(A3) {(Z_i, M_i, Y_i)} are i.i.d. for i = 1, ..., n
(A4) E[ε_{Mi}] = 0, E[ε_{Yi} | Z_i, M_i] = 0
(A5) Var(ε_{Mi}) = σ²_M < ∞, Var(ε_{Yi}) = σ²_Y < ∞
(A6) E[Z²_i] < ∞, E[M²_i] < ∞
(A7) The design matrices are full rank (identification)

**Proof:**
Under assumptions (A1)-(A7), the OLS estimators α-hat_n and β-hat_n are
consistent by standard results for linear regression (Greene, 2003):

plim_{n→∞} α-hat_n = α
plim_{n→∞} β-hat_n = β

Since the product function g(x,y) = xy is continuous on ℝ², the continuous
mapping theorem (van der Vaart, 1998, Theorem 2.3) implies:

plim_{n→∞} θ-hat_n = plim_{n→∞} (α-hat_n β-hat_n)
                   = g(plim_{n→∞} α-hat_n, plim_{n→∞} β-hat_n)
                   = g(α, β)
                   = αβ
                   = θ

Therefore, θ-hat_n is a consistent estimator of θ.  ∎

---

### References to Add

- Greene, W. H. (2003). *Econometric Analysis* (5th ed.). Prentice Hall.
- van der Vaart, A. W. (1998). *Asymptotic Statistics*. Cambridge
  University Press.
- White, H. (1984). *Asymptotic Theory for Econometricians*. Academic
  Press.

---

### Summary

**Verdict:** The proof is correct in its basic logic but needs more rigorous
statement of assumptions and notation. With the suggested improvements,
it would be publication-ready.

**Required Changes:**
1. Add explicit assumptions (A1)-(A7)
2. Use formal convergence notation (plim)
3. Cite continuous mapping theorem
4. Define sample size n → ∞

**Optional Enhancements:**
1. Add rate of convergence (√n-consistency)
2. Discuss joint distribution of (α-hat, β-hat)
3. Provide asymptotic distribution for inference
```

### ✅ Checkpoint 4.1

- [ ] Proof validation identifies logical correctness
- [ ] Missing assumptions are highlighted
- [ ] Notation improvements are suggested
- [ ] Complete version is provided for comparison

### Step 4.2: Identifiability Proof (5 min)

```bash
/research:manuscript:proof "Review this identifiability argument: We show that the indirect effect θ = αβ is identified from observable data under sequential ignorability. Under randomization of treatment Z, α is identified from E[M|Z=1] - E[M|Z=0]. Under conditional ignorability of M given Z, β is identified from the regression of Y on M controlling for Z. Therefore θ = αβ is identified."
```

### Expected Output

Scholar will check:

- Are the ignorability assumptions sufficient?
- Is the identification argument complete?
- Are there hidden confounders that break identification?
- Is the proof constructive (shows how to compute from data)?
- Are all necessary assumptions stated?

### Step 4.3: Asymptotic Normality Proof (3 min)

For more complex proofs about asymptotic distributions:

```bash
/research:manuscript:proof "Verify asymptotic normality derivation: We derive the asymptotic distribution of √n(θ-hat - θ). By multivariate CLT, √n(α-hat - α, β-hat - β) converges in distribution to bivariate normal. By delta method with g(α,β) = αβ, we have √n(θ-hat - θ) converges to N(0, σ²_θ) where σ²_θ = β²σ²_α + α²σ²_β + 2αβσ_αβ."
```

Scholar checks:

- Is the delta method applied correctly?
- Is the variance formula derived properly?
- Are the partial derivatives correct?
- Is the joint distribution specified?

### Step 4.4: When to Use Proof Validation (2 min)

**Use proof validation for:**

1. **Before Submission:**
   - Check all proofs in manuscript
   - Verify technical appendices
   - Ensure notation consistency

2. **After Reviewer Comments:**
   - "The proof on page 12 seems incomplete"
   - "I don't follow the logic in Step 3"
   - Validation helps you respond

3. **When Adapting Literature Proofs:**
   - You're extending someone else's proof
   - Changing assumptions
   - Applying to new setting

4. **When Learning:**
   - Working through textbook proofs
   - Understanding methodology papers
   - Building intuition

**Don't use for:**

- Computational proofs (run simulation instead)
- Proofs involving measure theory beyond basics
- Proofs requiring deep topology/analysis background

### ✅ Checkpoint 4.2

- [ ] You know when to use proof validation
- [ ] You can identify proof gaps
- [ ] You understand what makes a rigorous proof
- [ ] You can improve your own proofs using feedback

### Practice Exercise 4

Take a proof from your manuscript (or a paper you're reading) and validate it:

```bash
/research:manuscript:proof "YOUR PROOF TEXT HERE"
```

Check the validation report against your understanding.

---

## Session 5: Advanced Customization ⏱️ 15 minutes

### Learning Objectives

- Customize notation to match your manuscript
- Adapt style to specific journals
- Control technical depth
- Match collaborator preferences
- Create reusable templates

### What You'll Build

Customized manuscript sections that:

- Use your preferred notation system
- Match target journal requirements
- Adjust technical level appropriately
- Integrate seamlessly with existing text

### Step 5.1: Custom Notation Systems (5 min)

**Different fields use different notation conventions.** Scholar can adapt.

**Example 1: Econometrics Style (bold for vectors, capitals for matrices)**

```bash
/research:manuscript:methods "Describe instrumental variables estimation for treatment effect. Use bold lowercase for vectors (\\mathbf{x}), bold uppercase for matrices (\\mathbf{X}), and explicit expectation operators E[·]. Include both reduced form and structural equations."
```

**Example 2: Biostatistics Style (survival analysis notation)**

```bash
/research:manuscript:methods "Describe Cox proportional hazards model for time-to-event analysis. Use standard survival notation: S(t), h(t), H(t) for survival, hazard, and cumulative hazard. Include partial likelihood and proportional hazards assumption."
```

**Example 3: Machine Learning Style (algorithmic pseudocode)**

```bash
/research:manuscript:methods "Describe random forest algorithm for classification. Present as algorithm pseudocode with:
- Input: training data (X, y)
- Output: trained model
- Steps in algorithmic format
- Complexity analysis O(·) notation"
```

### Step 5.2: Journal-Specific Formatting (4 min)

**American Psychological Association (APA) Style:**

```bash
/research:manuscript:results "Report mediation results following APA 7th edition guidelines:
- Effect sizes with 95% CIs (not p-values)
- Italicized statistics (M, SD, r, t, F)
- Exact p-values (p = .034, not p < .05)
- Decimal places: 2 for descriptive, 3 for test statistics
- Sample sizes with subscripts"
```

**American Statistical Association (ASA) Style for JASA:**

```bash
/research:manuscript:methods "Describe Bayesian hierarchical model following Journal of the American Statistical Association style:
- Formal mathematical notation
- Explicit prior specifications
- MCMC algorithm details
- Convergence diagnostics
- No use of 'significant' (only report posterior probabilities)"
```

**Nature/Science Style (concise, minimal math):**

```bash
/research:manuscript:methods "Describe causal inference approach for Nature Methods:
- Maximum 200 words
- Minimal equations (key results only)
- Emphasize intuition over formalism
- Note that details are in Supplementary Methods"
```

### Step 5.3: Technical Depth Control (3 min)

**For Technical Audiences (statisticians, methodologists):**

```bash
/research:manuscript:methods "Describe semiparametric efficient estimation for causal inference. Target audience: statisticians. Include:
- Influence function derivation
- Semiparametric efficiency bound
- Double robustness property
- Asymptotic efficiency comparisons"
```

**For Applied Audiences (clinicians, social scientists):**

```bash
/research:manuscript:methods "Describe semiparametric efficient estimation for causal inference. Target audience: clinical researchers. Include:
- Intuitive explanation (avoid heavy math)
- Why this method is better than alternatives
- Practical interpretation
- Implementation in standard software"
```

**For Mixed Audiences (general science journals):**

```bash
/research:manuscript:methods "Describe causal inference approach for mixed audience:
- Main text: intuitive explanation with minimal math
- Box 1: Technical details for specialists
- Note detailed derivations in Supplementary Materials"
```

### Step 5.4: Creating Reusable Templates (3 min)

Save frequently used prompts for your research:

**Create a template file: `~/research/scholar-templates.sh`**

```bash
#!/bin/bash

# Mediation analysis methods template
mediation_methods() {
    local study_type=$1  # RCT or observational
    local sample_size=$2
    local mediator=$3
    local outcome=$4

    /research:manuscript:methods "Describe statistical methods for ${study_type} examining the indirect effect of treatment on ${outcome} mediated by ${mediator}. Sample size n=${sample_size}. Use the product-of-coefficients method with bootstrap confidence intervals (10,000 replicates). Include sequential ignorability assumptions and sensitivity analysis for unmeasured confounding. Use formal mathematical notation with LaTeX."
}

# Simulation study methods template
simulation_methods() {
    local method_comparison=$1
    local scenarios=$2
    local replications=$3

    /research:manuscript:methods "Describe Monte Carlo simulation study comparing ${method_comparison}. Scenarios: ${scenarios}. Number of replications: ${replications}. Include data generation process, performance metrics (bias, RMSE, coverage), and analysis plan."
}

# Results template
report_results() {
    local analysis_type=$1
    local key_findings=$2

    /research:manuscript:results "Report results from ${analysis_type}. Key findings: ${key_findings}. Include effect sizes with 95% CIs, statistical tests, and table/figure descriptions. Follow APA format."
}

# Reviewer response template
respond_reviewer() {
    local reviewer=$1
    local comment_num=$2
    local comment_text=$3

    /research:manuscript:reviewer "Reviewer ${reviewer}, Comment ${comment_num}: ${comment_text}"
}
```

**Usage:**

```bash
source ~/research/scholar-templates.sh

# Generate methods section
mediation_methods "randomized controlled trial" 200 "social support" "depression"

# Generate results section
report_results "mediation analysis" "significant indirect effect (θ=0.45, 95% CI [0.21, 0.73]), non-significant direct effect"

# Respond to reviewer
respond_reviewer 2 3 "The sample size seems inadequate for mediation analysis"
```

### ✅ Checkpoint 5

- [ ] You can customize notation to match your field
- [ ] You know how to adapt style for different journals
- [ ] You can control technical depth for different audiences
- [ ] You've created reusable templates for your research

---

## Session 6: Complete Manuscript Workflow ⏱️ 20 minutes

### Learning Objectives

- Integrate all manuscript commands
- Build complete manuscript sections progressively
- Version control your writing
- Collaborate with co-authors
- Automate repetitive tasks

### What You'll Build

A complete manuscript writing workflow from blank page to submission-ready.

### Step 6.1: Complete Workflow Example (15 min)

**Scenario:** You're writing a methodological paper comparing bootstrap methods for mediation analysis.

**Week 1-2: Introduction & Literature Review**

```bash
# Step 1: Identify gap in literature
/research:lit-gap "bootstrap confidence intervals for mediation analysis"
# Save output to intro/motivation

# Step 2: Find recent papers
/research:arxiv "bootstrap mediation" --since 2020
/research:arxiv "BCa bootstrap indirect effects"

# Step 3: Get citations
/research:doi "10.1037/met0000310"
/research:doi "10.1080/00273171.2019.1624273"
# Add to bibliography with /research:bib:add
```

**Week 3-4: Methods Section**

```bash
# Step 4: Design simulation study
/research:simulation:design "Compare percentile bootstrap, BCa bootstrap, and bootstrap-t for mediation analysis confidence intervals. Sample sizes: 50, 100, 200, 500. True indirect effect sizes: 0, 0.1, 0.3, 0.5. Data: normal and skewed distributions. Performance metrics: coverage, power, interval width."

# Save design to file
/research:simulation:design "..." > simulation-design.md

# Step 5: Write methods section
/research:manuscript:methods "Describe Monte Carlo simulation study comparing three bootstrap methods for mediation analysis: percentile, BCa, and bootstrap-t. Include: (1) data generation process for normal and skewed distributions, (2) sample sizes 50-500, (3) true indirect effect sizes 0-0.5, (4) performance metrics: coverage rates, power, mean interval width, (5) 5,000 replications per scenario, (6) R implementation details."

# Save to manuscript
/research:manuscript:methods "..." > methods-section.md
```

**Week 5-6: Run Simulation & Write Results**

```bash
# Step 6: Implement simulation in R
# (Run your R code based on simulation-design.md)
# Rscript run-simulation.R --design simulation-design.md --output results/sim-results.csv

# Step 7: Analyze results
/research:simulation:analysis results/sim-results.csv > analysis-report.md

# Step 8: Write results section
/research:manuscript:results "Report Monte Carlo simulation comparing percentile, BCa, and bootstrap-t methods for mediation CIs. Key findings:
- Coverage rates: Percentile 0.89-0.95 (poor at n=50), BCa 0.93-0.96 (good across all n), Bootstrap-t 0.92-0.97 (best but most variable)
- Power: Similar across methods (0.78-0.82 for medium effects)
- Interval width: Percentile narrowest, Bootstrap-t widest
- Recommendation: Use BCa for n<200, any method for n≥200"

# Save results
/research:manuscript:results "..." > results-section.md
```

**Week 7-8: Discussion & Proof Appendix**

```bash
# Step 9: Validate any theoretical proofs
/research:manuscript:proof "Verify that BCa bootstrap is second-order accurate. Proof sketch: The BCa interval adjusts for bias and skewness, reducing coverage error from O(n⁻¹/²) to O(n⁻¹)."

# Step 10: Check related methods
/research:method-scout "alternative confidence interval methods for mediation analysis"
# Use for Discussion section (alternative approaches)
```

**Week 9-10: Submission & Review**

```bash
# Step 11: Submit to journal
# ... (wait for reviews)

# Step 12: Respond to reviewers
/research:manuscript:reviewer "Reviewer 2: The authors should compare their methods to the delta method standard errors, which is the most common approach in practice."

/research:manuscript:reviewer "Reviewer 1: What about non-normal mediators? The simulation only covers normal and skewed distributions."

/research:manuscript:reviewer "Reviewer 3: Please provide R code for practitioners to implement the recommended BCa method."

# Save responses
/research:manuscript:reviewer "..." > response-to-reviewers.md
```

**Week 11-12: Revisions & Resubmission**

```bash
# Step 13: Additional analyses requested by reviewers
/research:simulation:design "Additional scenarios for revision: binary mediator, count outcome, small n=30"

# Step 14: Update results section
/research:manuscript:results "Additional results for binary mediator and count outcome scenarios..."

# Step 15: Final proof checking
/research:manuscript:proof "Verify all proofs in Appendix A-C"
```

### Step 6.2: Automation Script (3 min)

Create a master script to automate common tasks:

**File: `manuscript-workflow.sh`**

```bash
#!/bin/bash
# Complete manuscript writing workflow automation

PROJECT="mediation-bootstrap-paper"
MANUSCRIPT_DIR="$HOME/Documents/research/$PROJECT"
SECTIONS_DIR="$MANUSCRIPT_DIR/sections"
RESULTS_DIR="$MANUSCRIPT_DIR/results"

# Create directory structure
mkdir -p "$SECTIONS_DIR" "$RESULTS_DIR"

# Function: Generate methods section
generate_methods() {
    echo "Generating methods section..."
    /research:manuscript:methods "$1" > "$SECTIONS_DIR/methods-$(date +%Y%m%d).md"
    echo "Saved to $SECTIONS_DIR/methods-$(date +%Y%m%d).md"
}

# Function: Generate results section
generate_results() {
    echo "Generating results section..."
    /research:manuscript:results "$1" > "$SECTIONS_DIR/results-$(date +%Y%m%d).md"
    echo "Saved to $SECTIONS_DIR/results-$(date +%Y%m%d).md"
}

# Function: Analyze simulation results
analyze_simulation() {
    local sim_file=$1
    echo "Analyzing simulation results from $sim_file..."
    /research:simulation:analysis "$sim_file" > "$RESULTS_DIR/analysis-$(date +%Y%m%d).md"
    echo "Saved to $RESULTS_DIR/analysis-$(date +%Y%m%d).md"
}

# Function: Respond to all reviewer comments from file
respond_reviewers() {
    local comments_file=$1
    echo "Generating responses to reviewer comments..."

    # Read comments file and generate responses
    while IFS= read -r comment; do
        /research:manuscript:reviewer "$comment" >> "$MANUSCRIPT_DIR/reviewer-responses-$(date +%Y%m%d).md"
    done < "$comments_file"

    echo "Saved to $MANUSCRIPT_DIR/reviewer-responses-$(date +%Y%m%d).md"
}

# Function: Complete manuscript build
build_manuscript() {
    echo "Building complete manuscript..."

    # Combine all sections
    cat > "$MANUSCRIPT_DIR/manuscript-draft.md" <<EOF
# [Manuscript Title]

## Authors
[Author list]

## Abstract
[Abstract from file or prompt]

$(cat "$SECTIONS_DIR/methods-$(ls -t "$SECTIONS_DIR"/methods-*.md | head -1)")

$(cat "$SECTIONS_DIR/results-$(ls -t "$SECTIONS_DIR"/results-*.md | head -1)")

## Discussion
[To be written]

## References
[From references.bib]
EOF

    echo "Draft manuscript created: $MANUSCRIPT_DIR/manuscript-draft.md"
}

# Main workflow
case "$1" in
    methods)
        generate_methods "$2"
        ;;
    results)
        generate_results "$2"
        ;;
    analyze)
        analyze_simulation "$2"
        ;;
    reviewers)
        respond_reviewers "$2"
        ;;
    build)
        build_manuscript
        ;;
    *)
        echo "Usage: $0 {methods|results|analyze|reviewers|build} [args]"
        echo ""
        echo "Examples:"
        echo "  $0 methods 'Describe bootstrap mediation methods...'"
        echo "  $0 results 'Report simulation findings...'"
        echo "  $0 analyze results/simulation.csv"
        echo "  $0 reviewers reviewer-comments.txt"
        echo "  $0 build"
        ;;
esac
```

**Usage:**

```bash
chmod +x manuscript-workflow.sh

# Generate sections
./manuscript-workflow.sh methods "Describe your methods here"
./manuscript-workflow.sh results "Report your results here"

# Analyze simulation
./manuscript-workflow.sh analyze results/sim-results.csv

# Respond to reviewers
./manuscript-workflow.sh reviewers reviewer-comments.txt

# Build complete draft
./manuscript-workflow.sh build
```

### Step 6.3: Integration with LaTeX/Quarto (2 min)

**For LaTeX users (Overleaf):**

```bash
# Generate section
/research:manuscript:methods "..." > methods.tex

# Upload to Overleaf
# Include in main document:
# \input{methods}
```

**For Quarto users:**

```bash
# Generate sections as markdown
/research:manuscript:methods "..." > _methods.md
/research:manuscript:results "..." > _results.md

# In your main .qmd file:
# {{< include _methods.md >}}
# {{< include _results.md >}}
```

**For R Markdown users:**

```bash
# Generate and include
# ```{r child = 'methods.md'}
# ```
```

### ✅ Final Checkpoint

- [ ] You can execute a complete manuscript writing workflow
- [ ] You know how to automate repetitive tasks
- [ ] You can integrate with LaTeX/Quarto/R Markdown
- [ ] You have a reusable workflow for future papers

---

## Common Patterns & Best Practices

### Pattern 1: Iterative Refinement

```bash
# First draft (high-level)
/research:manuscript:methods "bootstrap mediation analysis"

# Second draft (more specific)
/research:manuscript:methods "bootstrap mediation with 10,000 replicates, BCa intervals"

# Final draft (complete details)
/research:manuscript:methods "bootstrap mediation with 10,000 replicates, BCa intervals, sensitivity to unmeasured confounding, multiple imputation for missing data"
```

### Pattern 2: Literature → Methods → Results Chain

```bash
# Find methods in literature
/research:method-scout "high-dimensional mediation"

# Design based on literature
/research:simulation:design "compare methods found in scout"

# Write methods section
/research:manuscript:methods "based on simulation design"

# Analyze results
/research:simulation:analysis results.csv

# Write results
/research:manuscript:results "based on simulation analysis"
```

### Pattern 3: Reviewer-Driven Workflow

```bash
# Get reviewer comment
COMMENT="Reviewer 2: Add robustness check for non-normality"

# Generate response strategy
/research:manuscript:reviewer "$COMMENT"

# Implement suggested analysis
# (run additional simulation or analysis)

# Update methods
/research:manuscript:methods "updated with robustness check"

# Update results
/research:manuscript:results "with new robustness results"
```

---

## Tips for Efficiency

### 1. Save and Version All Outputs

```bash
# Create versioned output
DATE=$(date +%Y%m%d-%H%M)
/research:manuscript:methods "..." > methods-v${DATE}.md

# Track in git
git add methods-v${DATE}.md
git commit -m "Methods section draft ${DATE}"
```

### 2. Use Shell Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias rmmethods='function _m(){ /research:manuscript:methods "$1"; }; _m'
alias rmresults='function _r(){ /research:manuscript:results "$1"; }; _r'
alias rmreview='function _rv(){ /research:manuscript:reviewer "$1"; }; _rv'
alias rmproof='function _p(){ /research:manuscript:proof "$1"; }; _p'

# Usage
rmmethods "describe bootstrap methods"
rmresults "report findings"
rmreview "reviewer comment here"
```

### 3. Batch Process Multiple Sections

```bash
# Process all reviewer comments at once
for comment in "comment 1" "comment 2" "comment 3"; do
    /research:manuscript:reviewer "$comment" >> responses.md
    echo "---" >> responses.md
done
```

### 4. Integrate with Reference Manager

```bash
# Find papers for citations
/research:arxiv "bootstrap mediation" > papers-to-cite.txt

# Get BibTeX
grep "DOI:" papers-to-cite.txt | while read -r doi; do
    /research:doi "${doi##* }" >> citations.bib
done
```

---

## Troubleshooting

### Issue 1: Output Too Generic

**Problem:** Generated content lacks specificity

**Solution:** Add more details to your prompt

```bash
# Too generic
/research:manuscript:methods "mediation analysis"

# Better - add specifics
/research:manuscript:methods "mediation analysis with:
- Sample size: n=200
- Intervention: cognitive behavioral therapy
- Mediator: rumination (RSS scale)
- Outcome: depression (BDI-II)
- Controls: age, gender, baseline depression
- Method: product-of-coefficients with BCa bootstrap"
```

### Issue 2: Wrong Statistical Notation

**Problem:** Notation doesn't match your manuscript

**Solution:** Specify notation style explicitly

```bash
/research:manuscript:methods "use econometrics notation: bold for vectors (\\mathbf{x}), uppercase for matrices (X), Greek for parameters (β, θ)"
```

### Issue 3: Citations Don't Match Your References

**Problem:** Generated text cites papers not in your bibliography

**Solution:** Either add those citations or specify which ones to use

```bash
/research:manuscript:methods "... Cite only: MacKinnon (2008), Preacher & Hayes (2008)"
```

### Issue 4: Too Technical or Not Technical Enough

**Problem:** Depth doesn't match your audience

**Solution:** Specify target audience

```bash
# For clinical journal
/research:manuscript:methods "... Target audience: clinicians with basic statistics training. Minimize equations, emphasize interpretation."

# For statistical journal
/research:manuscript:methods "... Target audience: methodologists. Include full technical details, derivations, and formal assumptions."
```

---

## Next Steps

### Continue Learning

**Beginner → Intermediate:**

- [ ] [Simulation Study Tutorial](simulation-study.md) - Design and analyze simulations
- [ ] [Literature Review Tutorial](first-literature-search.md) - Build bibliography for citations

**Intermediate → Advanced:**

- [ ] [Custom Prompts Guide](../advanced/custom-prompts.md) - Create domain-specific templates
- [ ] [LMS Integration](../advanced/lms-integration.md) - Advanced integration workflows

### Explore Related Tools

**Research Workflow:**

- Use `/research:analysis-plan` before writing methods
- Use `/research:hypothesis` to formalize research questions
- Use `/research:method-scout` to find alternative approaches

**Teaching Integration:**

- Adapt manuscript examples for teaching ([Teaching Tutorials](../teaching/first-exam.md))
- Create exam questions from methods sections
- Use proofs for advanced problem sets

### Share Your Workflow

If this tutorial helped you write better, faster manuscripts:

- Share your workflow in [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions)
- Contribute templates to the community
- Report bugs or suggest improvements

---

## Success Metrics

After completing this tutorial and practicing with 2-3 of your own manuscripts, you should be able to:

- ⏱️ Generate a complete methods section in under 5 minutes
- 📝 Write properly formatted results sections with all required statistics
- 💬 Craft professional reviewer responses in under 10 minutes per comment
- ✓ Validate mathematical proofs for publication readiness
- 🎨 Customize output to match any journal's style guide
- 🔄 Integrate manuscript writing with your analysis workflow
- 🚀 Reduce manuscript writing time by 30-50%

---

## Resources

**Documentation:**

- [Research Commands Reference](../../research/RESEARCH-COMMANDS-REFERENCE.md) - All 14 commands
- [Manuscript Commands Guide](../../research/MANUSCRIPT-COMMANDS.md) - Deep dive
- [Quick Reference Card](../../refcards/research-commands.md) - Command cheat sheet

**Examples:**

- [Example Methods Sections](../../examples/methods-sections.md) - Real examples
- [Example Results Sections](../../examples/results-sections.md) - Across methods
- [Example Reviewer Responses](../../examples/reviewer-responses.md) - Various scenarios

**Help:**

- [FAQ](../../help/FAQ-research.md) - Common questions
- [GitHub Issues](https://github.com/Data-Wise/scholar/issues) - Report bugs
- [Discussions](https://github.com/Data-Wise/scholar/discussions) - Ask questions

---

**Tutorial Complete!** 🎉

You now have the skills to write statistically rigorous manuscripts efficiently using Scholar's AI-powered tools.

**Questions or issues?** See the [FAQ](../../help/FAQ-research.md) section or open an issue on [GitHub](https://github.com/Data-Wise/scholar/issues).

**Share your success:** If this tutorial accelerated your manuscript writing, share your workflow in [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions).

---

**Last Updated:** 2026-01-31
**Version:** v2.6.0
**Author:** Data-Wise Team
**License:** MIT
