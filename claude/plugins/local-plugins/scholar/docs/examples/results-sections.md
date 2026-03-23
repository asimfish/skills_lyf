# Results Section Examples

Complete examples demonstrating how to use Scholar to write clear, reproducible results sections for academic manuscripts across different study designs.

---

## Overview

This guide provides worked examples of results sections for various research designs. Each example includes:

- Study context and research questions
- Scholar commands used
- Complete results section with tables and figures
- Statistical reporting best practices
- Integration with methods sections

---

## Example 1: Experimental Design (Simple Comparison)

### Research Context

**Study**: Effect of active learning on perceived stress (continuation from methods example)

**Research Question**: Do students in active learning conditions report lower perceived stress than those in traditional lecture conditions?

**Analysis**: Independent samples t-test

**Key Results**: Active learning group showed significantly lower stress

### Scholar Commands

```bash
# Generate results section from analysis output
/manuscript:results \
  --analysis "t-test" \
  --outcome "perceived stress" \
  --groups "traditional lecture, active learning" \
  --include-table \
  --include-figure

# Create publication-ready table
/manuscript:table \
  --type "descriptive" \
  --variables "stress scores" \
  --by-group "teaching method"
```

### Generated Results Section

#### Preliminary Analyses

Prior to hypothesis testing, we examined the distribution of perceived stress scores within each condition. Shapiro-Wilk tests indicated approximate normality for both the traditional lecture group (W = 0.97, p = .18) and active learning group (W = 0.98, p = .34). Levene's test for homogeneity of variance was non-significant (F(1, 118) = 0.64, p = .43), supporting the assumption of equal variances.

#### Primary Analysis

Descriptive statistics for perceived stress scores by teaching condition are presented in Table 1. The active learning group (M = 21.8, SD = 5.9) reported significantly lower perceived stress than the traditional lecture group (M = 24.3, SD = 6.2), t(118) = -2.45, p = .016, 95% CI [-4.43, -0.47]. The effect size was medium (Cohen's d = -0.45, 95% CI [-0.81, -0.09]), indicating a practically meaningful difference between conditions.

**Table 1**
*Descriptive Statistics for Perceived Stress by Teaching Condition*

| Condition | n | M | SD | 95% CI | Min | Max |
|-----------|---|---|----|---------| ----|-----|
| Traditional Lecture | 60 | 24.3 | 6.2 | [22.7, 25.9] | 12 | 38 |
| Active Learning | 60 | 21.8 | 5.9 | [20.3, 23.3] | 10 | 35 |

*Note.* M = mean; SD = standard deviation; CI = confidence interval. Perceived stress measured on 0-40 scale, with higher scores indicating greater stress.

#### Exploratory Analyses

To assess the robustness of our findings, we conducted several exploratory analyses. First, we re-analyzed the data using a non-parametric Mann-Whitney U test, which yielded consistent results (U = 1345, p = .018). Second, we examined whether the effect varied by student gender; the interaction was non-significant (p = .42), suggesting the teaching method effect generalizes across genders.

#### Effect Size Interpretation

The observed effect size (d = -0.45) corresponds to a stress reduction of approximately 7 percentile points for the average student in the active learning condition compared to traditional lecture. Using benchmarks from educational psychology (Hattie, 2009), this effect size falls in the "medium" range and is comparable to other evidence-based pedagogical interventions.

### Key Elements

- **Assumption checks reported**: Normality and homogeneity of variance results
- **Complete statistics**: t-value, df, p-value, confidence intervals, effect sizes
- **Descriptive table**: Means, SDs, CIs for transparency
- **Robustness checks**: Non-parametric alternative, moderation analysis
- **Interpretation**: Practical significance beyond statistical significance

---

## Example 2: Observational Study (Multiple Regression)

### Research Context

**Study**: Predicting GPA from study habits, sleep, and motivation (continuation from methods)

**Research Question**: What combination of study habits, sleep, and motivation best predicts academic performance?

**Analysis**: Multiple linear regression

**Key Results**: All three predictors significant, motivation strongest predictor

### Scholar Commands

```bash
# Generate results for regression model
/manuscript:results \
  --analysis "multiple regression" \
  --outcome "GPA" \
  --predictors "study hours, sleep hours, intrinsic motivation" \
  --include-table \
  --include-diagnostics

# Create regression table
/manuscript:table \
  --type "regression" \
  --model "full model" \
  --show-standardized
```

### Generated Results Section

#### Descriptive Statistics and Correlations

Descriptive statistics and bivariate correlations among all study variables are presented in Table 1. GPA was positively correlated with study hours (r = .28, p < .001), sleep hours (r = .19, p = .003), and intrinsic motivation (r = .42, p < .001). Notably, the predictor variables showed low-to-moderate intercorrelations (rs = .14 to .26), suggesting acceptable independence among predictors.

**Table 1**
*Descriptive Statistics and Bivariate Correlations*

| Variable | M | SD | 1 | 2 | 3 | 4 |
|----------|---|----|----|----|----|-----|
| 1. GPA | 3.12 | 0.58 | — |  |  |  |
| 2. Study hours/week | 18.3 | 8.4 | .28*** | — |  |  |
| 3. Sleep hours/night | 7.1 | 1.3 | .19** | .14* | — |  |
| 4. Intrinsic motivation | 5.2 | 1.1 | .42*** | .26*** | .18** | — |
| 5. Age (covariate) | 19.4 | 1.2 | .08 | -.05 | -.11 | .02 |

*Note.* N = 250. * p < .05, ** p < .01, *** p < .001.

#### Multiple Regression Analysis

We conducted a hierarchical multiple regression analysis predicting GPA from study hours, sleep hours, and intrinsic motivation, controlling for age and gender (Table 2). The full model accounted for 24% of the variance in GPA, F(5, 244) = 15.6, p < .001, adjusted R² = .22.

**Table 2**
*Hierarchical Multiple Regression Predicting GPA*

| Predictor | b | SE | β | t | p | 95% CI | VIF |
|-----------|---|----|---|---|---|---------|----|
| **Step 1: Covariates** |  |  |  |  |  |  |  |
| Age | 0.04 | 0.03 | .08 | 1.33 | .185 | [-0.02, 0.10] | 1.02 |
| Gender (1 = female) | 0.11 | 0.08 | .09 | 1.38 | .169 | [-0.05, 0.27] | 1.04 |
| |  |  |  |  |  |  |  |
| **Step 2: Predictors** |  |  |  |  |  |  |  |
| Study hours/week | 0.012 | 0.004 | .18 | 3.15 | .002 | [0.004, 0.020] | 1.09 |
| Sleep hours/night | 0.045 | 0.025 | .10 | 1.80 | .073 | [-0.004, 0.094] | 1.06 |
| Intrinsic motivation | 0.19 | 0.03 | .36 | 6.33 | < .001 | [0.13, 0.25] | 1.12 |

*Note.* N = 250. b = unstandardized coefficient; SE = standard error; β = standardized coefficient; CI = confidence interval; VIF = variance inflation factor. Step 1: R² = .01, F(2, 247) = 1.24, p = .291. Step 2: ΔR² = .23, ΔF(3, 244) = 24.6, p < .001. Full model: R² = .24, adjusted R² = .22, F(5, 244) = 15.6, p < .001.

#### Interpretation of Regression Coefficients

**Study hours/week** was a significant positive predictor of GPA (b = 0.012, p = .002). Each additional hour of weekly study was associated with a 0.012-point increase in GPA, holding other variables constant. For a typical student increasing study time by 5 hours per week, the predicted GPA increase is approximately 0.06 points.

**Sleep hours/night** showed a positive trend but did not reach statistical significance (b = 0.045, p = .073). The confidence interval included zero but was close to significance, suggesting a potential small positive effect.

**Intrinsic motivation** was the strongest predictor of GPA (b = 0.19, β = .36, p < .001). A one-point increase on the motivation scale (range 1-7) predicted a 0.19-point GPA increase. Students at the 75th percentile of motivation (M = 6.0) were predicted to have GPAs 0.30 points higher than students at the 25th percentile (M = 4.4), holding other factors constant.

#### Model Diagnostics

We examined regression diagnostics to verify model assumptions. Residual plots indicated approximately linear relationships with no evidence of heteroscedasticity. No observations had standardized residuals exceeding ±3 or Cook's distance values greater than 1, suggesting no influential outliers. All VIF values were below 2.0, confirming negligible multicollinearity.

#### Supplementary Analyses

To assess model robustness, we conducted two supplementary analyses. First, we re-fit the model after removing 8 observations with studentized deleted residuals exceeding ±2.5 SD; results were virtually identical (all βs within .02 of original values). Second, we tested for non-linear effects by adding quadratic terms for continuous predictors; none were significant (all ps > .15), supporting the linear specification.

### Key Elements

- **Correlation matrix**: Bivariate relationships and multicollinearity assessment
- **Hierarchical structure**: Covariates entered first, focal predictors second
- **Complete regression table**: Unstandardized and standardized coefficients, SEs, p-values, CIs, VIF
- **Substantive interpretation**: Real-world meaning of coefficients
- **Diagnostics**: Assumption checks, outliers, influence statistics
- **Robustness checks**: Sensitivity to outliers, non-linear effects

---

## Example 3: Longitudinal Study (Mixed-Effects Models)

### Research Context

**Study**: Therapy effectiveness over time (continuation from methods example)

**Research Questions**:
1. Do clients show improvement in depression symptoms over the 20-week treatment period?
2. Does the rate of improvement differ between CBT and supportive therapy?

**Analysis**: Linear mixed-effects model with three-level structure

**Key Results**: Both conditions showed improvement; CBT showed faster decline

### Scholar Commands

```bash
# Generate results for multilevel model
/manuscript:results \
  --analysis "mixed-effects" \
  --outcome "depression severity" \
  --predictors "time, treatment" \
  --random-effects "therapist, client" \
  --include-table \
  --include-figure

# Create growth trajectory figure
/manuscript:figure \
  --type "trajectory" \
  --x-axis "weeks" \
  --y-axis "depression severity" \
  --by-group "treatment condition"
```

### Generated Results Section

#### Descriptive Statistics

Table 1 presents descriptive statistics for depression severity (BDI-II scores) at each assessment point by treatment condition. Mean depression scores decreased over time in both conditions, with the CBT group showing a steeper decline.

**Table 1**
*Descriptive Statistics for Depression Severity by Time and Treatment Condition*

| Time Point | CBT (n = 90) |  |  | Supportive Therapy (n = 90) |  |  |
|------------|-------------|-----|-----|-------------|-----|-----|
|  | M | SD | n | M | SD | n |
| Baseline (Week 0) | 28.4 | 7.2 | 90 | 28.1 | 7.5 | 90 |
| Week 4 | 25.3 | 7.8 | 87 | 26.2 | 7.9 | 86 |
| Week 8 | 22.1 | 8.2 | 85 | 24.8 | 8.1 | 84 |
| Week 12 | 18.9 | 8.5 | 83 | 23.1 | 8.4 | 82 |
| Week 16 | 16.2 | 8.9 | 81 | 21.5 | 8.7 | 79 |
| Week 20 | 14.3 | 9.1 | 79 | 20.3 | 9.0 | 78 |

*Note.* M = mean; SD = standard deviation; n = number of observations. BDI-II scores range from 0-63, with higher scores indicating greater depression severity. Clinical cutoffs: 0-13 = minimal, 14-19 = mild, 20-28 = moderate, 29-63 = severe depression.

#### Intraclass Correlations

The unconditional means model (no predictors) partitioned variance in depression severity across the three levels. The ICC at the therapist level was .15, indicating that 15% of the total variance in depression scores was attributable to differences between therapists. The ICC at the client level (within therapist) was .62, indicating that 62% of variance was between clients. The remaining 23% of variance was within clients over time. These substantial ICCs justified the multilevel modeling approach.

#### Unconditional Growth Model

The unconditional growth model (time as sole predictor) revealed significant linear change in depression severity over the 20-week period (γ₁₀₀ = -0.68, SE = 0.06, p < .001). On average, depression scores decreased by 0.68 points per week, corresponding to a total reduction of 13.6 points over 20 weeks. A quadratic time term was non-significant (p = .34), supporting a linear growth specification.

Significant variance components indicated individual differences in both initial severity (σ²ᵤ₀₀ = 8.34, p < .001) and rate of change (σ²ᵤ₁₀ = 0.41, p < .001) at the therapist level, as well as at the client level (σ²ᵣ₀ = 15.67, p < .001; σ²ᵣ₁ = 0.89, p < .001). These random effects justify modeling individual trajectories rather than assuming a common growth curve.

#### Conditional Growth Model: Treatment Effects

Table 2 presents results from the conditional growth model testing the effect of treatment condition on depression trajectories. The treatment × time interaction was statistically significant (γ₁₁₀ = -0.31, SE = 0.09, p < .001), indicating that the rate of depression decline differed between CBT and supportive therapy.

**Table 2**
*Fixed Effects from Conditional Growth Model Predicting Depression Severity*

| Fixed Effect | Estimate (γ) | SE | df | t | p | 95% CI |
|--------------|-------------|-----|-----|-----|-----|---------|
| Intercept (CBT, Week 0) | 28.42 | 1.12 | 28 | 25.38 | < .001 | [26.13, 30.71] |
| Time (weeks) | -0.82 | 0.08 | 178 | -10.25 | < .001 | [-0.98, -0.66] |
| Treatment (ST vs. CBT) | -0.28 | 1.58 | 178 | -0.18 | .859 | [-3.39, 2.83] |
| Time × Treatment | 0.31 | 0.09 | 889 | 3.44 | < .001 | [0.13, 0.49] |
| Baseline depression | 0.51 | 0.08 | 178 | 6.38 | < .001 | [0.35, 0.67] |

*Note.* N = 180 clients, 30 therapists, 1,080 observations. CBT = cognitive-behavioral therapy; ST = supportive therapy. Treatment coded 0 = CBT, 1 = ST. Model fit: AIC = 8,234, BIC = 8,301, -2LL = 8,202.

**Table 3**
*Random Effects and Variance Components from Conditional Growth Model*

| Random Effect | Variance | SD | χ² | p |
|---------------|----------|-----|-----|-----|
| **Therapist Level (Level 3)** |  |  |  |  |
| Intercept (u₀₀ⱼ) | 8.34 | 2.89 | 124.5 | < .001 |
| Slope (u₁₀ⱼ) | 0.41 | 0.64 | 42.3 | .046 |
| **Client Level (Level 2)** |  |  |  |  |
| Intercept (r₀ᵢⱼ) | 15.67 | 3.96 | 892.4 | < .001 |
| Slope (r₁ᵢⱼ) | 0.89 | 0.94 | 215.6 | < .001 |
| **Residual (Level 1)** |  |  |  |  |
| Within-client (eₜᵢⱼ) | 12.23 | 3.50 | — | — |

*Note.* χ² tests compare model with random effect to model without random effect.

#### Interpretation of Treatment Effects

**Main effect of time**: Clients in CBT (reference group) showed significant improvement, declining 0.82 BDI-II points per week (p < .001). Over 20 weeks, the predicted change for CBT clients was -16.4 points (95% CI [-19.6, -13.2]).

**Main effect of treatment**: At baseline (Week 0), CBT and supportive therapy groups had equivalent depression severity (difference = -0.28 points, p = .859), confirming successful randomization.

**Treatment × time interaction**: The positive coefficient (γ₁₁₀ = 0.31, p < .001) indicates that supportive therapy clients improved more slowly than CBT clients. Specifically, supportive therapy clients declined 0.51 points per week (0.82 - 0.31 = 0.51), compared to 0.82 points per week for CBT clients. This difference of 0.31 points per week accumulates over time: by Week 20, CBT clients showed 6.2 additional points of improvement beyond supportive therapy (0.31 × 20 = 6.2).

**Clinical significance**: Using established BDI-II cutoffs, CBT clients moved from moderate depression (M = 28.4) to minimal depression (M = 14.3) by Week 20, whereas supportive therapy clients moved to mild depression (M = 20.3). The additional 6-point reduction in CBT represents movement across one full severity category.

#### Simple Slopes Analysis

To aid interpretation, we computed predicted depression trajectories for each treatment condition (Figure 1). Simple slopes analysis revealed significant improvement in both CBT (b = -0.82, SE = 0.08, t(178) = -10.25, p < .001) and supportive therapy (b = -0.51, SE = 0.07, t(178) = -7.29, p < .001). However, CBT showed a 61% faster rate of decline than supportive therapy.

**Figure 1**
*Predicted Depression Trajectories by Treatment Condition*

[Figure would show two declining lines from Week 0 to Week 20, with CBT (solid line) declining more steeply than Supportive Therapy (dashed line). Both start at approximately 28 and diverge over time, with CBT ending at 14.3 and ST at 20.3]

*Note.* Lines represent predicted values from the conditional growth model. Shaded regions indicate 95% confidence intervals. CBT = cognitive-behavioral therapy; ST = supportive therapy.

#### Model Comparison and Fit

We compared nested models using likelihood ratio tests (Table 4). Adding random slopes for time at both therapist and client levels significantly improved model fit (χ²(3) = 67.4, p < .001). Adding the treatment × time interaction also significantly improved fit (χ²(1) = 11.8, p < .001), justifying retention in the final model.

**Table 4**
*Model Comparison Statistics*

| Model | -2LL | AIC | BIC | Δχ² | Δdf | p |
|-------|------|-----|-----|-----|-----|-----|
| 1. Unconditional means | 8,478 | 8,486 | 8,505 | — | — | — |
| 2. Unconditional growth | 8,342 | 8,354 | 8,381 | 136.0 | 3 | < .001 |
| 3. Random slopes | 8,274 | 8,292 | 8,335 | 68.0 | 5 | < .001 |
| 4. Add treatment | 8,268 | 8,288 | 8,335 | 6.0 | 1 | .014 |
| 5. Add interaction (final) | 8,202 | 8,234 | 8,301 | 66.0 | 1 | < .001 |

*Note.* -2LL = -2 log-likelihood; AIC = Akaike information criterion; BIC = Bayesian information criterion. Lower values indicate better fit.

#### Sensitivity Analyses

To assess robustness, we conducted several sensitivity analyses:

1. **Completer vs. ITT analysis**: Results were consistent when restricting to completers (n = 157) versus intent-to-treat with all available data (all γs within .05).
2. **Alternative time coding**: Re-analyzing with time centered at Week 10 (midpoint) yielded equivalent treatment effects.
3. **Outlier influence**: Removing 3 clients with extreme baseline scores (BDI-II > 50) did not substantively alter findings.
4. **Therapist effects**: The treatment effect remained significant when controlling for therapist experience and theoretical orientation.

### Key Elements

- **Three-level structure**: Variance partitioned across time, clients, therapists
- **ICCs reported**: Justifies multilevel approach
- **Model building sequence**: Unconditional → conditional models with LRTs
- **Complete tables**: Fixed effects, random effects, model fit statistics
- **Growth trajectory figure**: Visual representation aids interpretation
- **Clinical significance**: Movement across diagnostic categories
- **Simple slopes**: Decompose interaction for clarity
- **Sensitivity analyses**: Robustness to missing data, outliers, alternative specifications

---

## Example 4: Mediation Study (Causal Inference)

### Research Context

**Study**: Emotion regulation mediating mindfulness → anxiety effect (continuation from methods)

**Research Questions**:
1. Does mindfulness training reduce anxiety symptoms?
2. Is this effect mediated by improvements in emotion regulation?
3. What proportion of the total effect operates through the mediator?

**Analysis**: Causal mediation analysis with bootstrap inference

**Key Results**: 46% of mindfulness effect on anxiety mediated by emotion regulation

### Scholar Commands

```bash
# Generate mediation results
/manuscript:results \
  --analysis "mediation" \
  --outcome "anxiety" \
  --predictor "mindfulness training" \
  --mediator "emotion regulation" \
  --include-table \
  --include-diagram

# Create path diagram
/manuscript:figure \
  --type "mediation-diagram" \
  --paths "a, b, c, c-prime"
```

### Generated Results Section

#### Preliminary Analyses and Randomization Check

We first verified the success of random assignment by comparing baseline characteristics between MBSR and waitlist conditions (Table 1). No significant differences emerged for age, gender, baseline anxiety, or baseline emotion regulation (all ps > .30), confirming successful randomization.

**Table 1**
*Baseline Characteristics by Treatment Condition*

| Variable | MBSR (n = 100) | Waitlist (n = 100) | Test Statistic | p |
|----------|---------------|------------------|----------------|-----|
| Age (years), M (SD) | 38.7 (9.4) | 38.1 (8.9) | t(198) = 0.46 | .648 |
| Female, n (%) | 65 (65%) | 63 (63%) | χ²(1) = 0.09 | .764 |
| Baseline GAD-7, M (SD) | 14.2 (3.1) | 14.0 (3.3) | t(198) = 0.44 | .661 |
| Baseline DERS-SF, M (SD) | 58.3 (12.4) | 57.8 (11.9) | t(198) = 0.29 | .772 |

*Note.* MBSR = mindfulness-based stress reduction; GAD-7 = Generalized Anxiety Disorder-7; DERS-SF = Difficulties in Emotion Regulation Scale-Short Form. Higher DERS-SF scores indicate greater emotion regulation difficulties.

#### Descriptive Statistics and Change Scores

Table 2 presents means and standard deviations for the mediator and outcome variables at baseline and post-intervention by treatment condition. The MBSR group showed larger improvements (pre-post reductions) in both emotion regulation difficulties and anxiety symptoms compared to the waitlist control.

**Table 2**
*Descriptive Statistics for Mediator and Outcome Variables*

| Variable | Time | MBSR (n = 100) | Waitlist (n = 100) | Cohen's d [95% CI] |
|----------|------|----------------|-------------------|-------------------|
| **Emotion Regulation (DERS-SF)** |  |  |  |  |
|  | Baseline | 58.3 (12.4) | 57.8 (11.9) | 0.04 [-0.24, 0.32] |
|  | Post | 47.2 (11.8) | 54.1 (12.2) | -0.58 [-0.86, -0.30] |
|  | Change | -11.1 (9.3) | -3.7 (8.1) | -0.84 [-1.13, -0.56]*** |
| **Anxiety Symptoms (GAD-7)** |  |  |  |  |
|  | Baseline | 14.2 (3.1) | 14.0 (3.3) | 0.06 [-0.22, 0.34] |
|  | Post | 10.5 (3.4) | 12.4 (3.6) | -0.54 [-0.82, -0.26] |
|  | Change | -3.7 (2.8) | -1.6 (2.5) | -0.79 [-1.07, -0.51]*** |

*Note.* Values are M (SD) unless otherwise noted. Change = Post - Baseline (negative values indicate improvement). Cohen's d calculated on change scores. *** p < .001.

#### Mediation Analysis: Path Coefficients

We tested the hypothesized mediation model using causal mediation analysis (Figure 1). Table 3 presents the regression coefficients for each pathway.

**Figure 1**
*Mediation Model: Mindfulness Training → Emotion Regulation → Anxiety*

```
                      a = -7.4***
         ┌─────────────────────────────────────┐
         │                                     ▼
    Treatment                          Emotion Regulation
    (MBSR vs. WL)                      (DERS-SF Change)
         │                                     │
         │                                     │ b = 0.13***
         │                                     ▼
         └─────────────────────────────────►Anxiety
                   c' = -1.12*             (GAD-7 Change)
                   c = -2.09***
```

*Note.* Values are unstandardized coefficients. a = effect of treatment on mediator; b = effect of mediator on outcome controlling for treatment; c = total effect of treatment on outcome; c' = direct effect of treatment on outcome controlling for mediator. * p < .05, *** p < .001.

**Table 3**
*Mediation Path Coefficients*

| Path | Effect | Coefficient | SE | t | p | 95% CI |
|------|--------|-------------|-----|-----|-----|---------|
| a | Treatment → DERS-SF change | -7.40 | 1.24 | -5.97 | < .001 | [-9.84, -4.96] |
| b | DERS-SF change → GAD-7 change | 0.13 | 0.02 | 6.50 | < .001 | [0.09, 0.17] |
| c | Treatment → GAD-7 change (total) | -2.09 | 0.39 | -5.36 | < .001 | [-2.86, -1.32] |
| c' | Treatment → GAD-7 change (direct) | -1.12 | 0.35 | -3.20 | .002 | [-1.81, -0.43] |

*Note.* N = 200. Treatment coded 0 = Waitlist, 1 = MBSR. DERS-SF change = emotion regulation improvement (negative values indicate improvement). GAD-7 change = anxiety reduction (negative values indicate improvement). Coefficients are unstandardized.

#### Interpretation of Path Coefficients

**a-path (Treatment → Emotion Regulation)**: MBSR participants showed significantly greater improvement in emotion regulation than waitlist controls (b = -7.40, p < .001). The MBSR group reduced DERS-SF scores by 7.40 points more than waitlist, representing a 0.60 SD improvement.

**b-path (Emotion Regulation → Anxiety)**: Each 1-point improvement in emotion regulation (DERS-SF reduction) was associated with a 0.13-point reduction in anxiety symptoms (b = 0.13, p < .001), controlling for treatment assignment. Clients who improved emotion regulation by 10 points showed approximately 1.3 additional points of anxiety reduction.

**c-path (Total Effect)**: Without considering the mediator, MBSR reduced anxiety symptoms by 2.09 points more than waitlist (b = -2.09, p < .001), representing a 0.66 SD reduction.

**c'-path (Direct Effect)**: After accounting for emotion regulation improvements, MBSR still reduced anxiety by 1.12 points more than waitlist (b = -1.12, p = .002), indicating partial (not full) mediation.

#### Indirect Effect and Mediation Tests

The indirect effect (product of a and b paths) quantifies the anxiety reduction attributable to emotion regulation improvements. Using bias-corrected bootstrap confidence intervals (10,000 resamples), we found a significant indirect effect (ab = -0.97, 95% CI [-1.84, -0.32]). The confidence interval excluded zero, providing strong evidence for mediation.

**Table 4**
*Mediation Effect Estimates*

| Effect | Estimate | SE | 95% Bootstrap CI | p |
|--------|----------|-----|------------------|-----|
| Indirect effect (ab) | -0.97 | 0.38 | [-1.84, -0.32] | < .001 |
| Direct effect (c') | -1.12 | 0.35 | [-1.81, -0.43] | .002 |
| Total effect (c) | -2.09 | 0.39 | [-2.86, -1.32] | < .001 |
| Proportion mediated (ab/c) | 0.46 | 0.14 | [0.23, 0.78] | < .001 |
| Ratio (indirect/direct) | 0.87 | 0.39 | [0.29, 1.92] | — |

*Note.* N = 200. Bootstrap estimates based on 10,000 resamples with bias-corrected confidence intervals. Proportion mediated = percentage of total effect explained by mediator.

#### Interpretation of Mediation Effects

**Indirect effect**: Approximately 0.97 points (46%) of MBSR's 2.09-point anxiety reduction operated through improved emotion regulation. This translates to nearly half of the treatment benefit being attributable to the hypothesized mediating mechanism.

**Direct effect**: The remaining 1.12 points (54%) of anxiety reduction occurred through mechanisms other than emotion regulation improvements. These could include increased present-moment awareness, reduced rumination, or other mindfulness-related processes not captured by the DERS-SF.

**Proportion mediated**: The 46% mediation proportion indicates substantial but partial mediation, consistent with theoretical models positing emotion regulation as one of multiple mechanisms underlying mindfulness-based interventions.

#### Sensitivity Analysis

We assessed the robustness of the mediation findings to potential violations of the sequential ignorability assumption. Sensitivity analysis (Imai et al., 2010) indicated that an unobserved confounder would need to induce a correlation of ρ = .35 between residuals in the mediator and outcome models to nullify the indirect effect. This threshold exceeds typical effects of measured confounders, suggesting the mediation finding is reasonably robust to unmeasured confounding.

We also examined sensitivity to several analytic choices:

1. **Covariates**: Including baseline anxiety, depression, age, and gender as covariates reduced the indirect effect by less than 10% (ab = -0.89, 95% CI [-1.72, -0.29]).
2. **Missing data**: Multiple imputation (50 datasets) yielded nearly identical estimates (ab = -0.95, 95% CI [-1.81, -0.34]).
3. **Alternative mediators**: Testing mindfulness skills and rumination as alternative mediators revealed smaller indirect effects (proportion mediated: 28% and 31%, respectively), suggesting emotion regulation is a relatively more important pathway.

#### Clinical Implications

The mediation findings have practical implications for optimizing MBSR interventions. First, the 46% mediation through emotion regulation suggests that techniques specifically targeting emotion regulation skills (e.g., labeling emotions, acceptance of emotional experiences) may be particularly valuable components. Second, the substantial direct effect (54%) indicates that additional unmeasured mechanisms also contribute to anxiety reduction, warranting investigation of alternative pathways (e.g., reduced cognitive reactivity, increased self-compassion).

From a clinical screening perspective, clients who show early gains in emotion regulation (e.g., by Week 4) may be more likely to achieve substantial anxiety reductions by intervention completion. Therapists could monitor DERS-SF scores at mid-treatment to identify clients who may benefit from supplemental emotion regulation training.

### Key Elements

- **Randomization check**: Verifies baseline equivalence
- **Descriptive statistics**: Pre-post changes by condition
- **Path diagram**: Visual representation of mediation model
- **All path coefficients**: a, b, c, c' with full statistics
- **Indirect effect**: Bootstrap CIs, proportion mediated
- **Substantive interpretation**: Clinical meaning of mediation percentage
- **Sensitivity analysis**: Robustness to unmeasured confounding, alternative mediators
- **Clinical implications**: Practical applications of findings

---

## Example 5: Coverage Study (Simulation)

### Research Context

**Study**: Monte Carlo evaluation of confidence interval coverage for the indirect effect in mediation analysis across bootstrap methods and sample sizes

**Research Questions**:
1. Do BCa bootstrap intervals achieve nominal 95% coverage for indirect effects across conditions?
2. How do sample size and effect magnitude influence coverage probability?

**Analysis**: Monte Carlo simulation with 5,000 replications per condition

**Key Results**: BCa maintains near-nominal coverage; percentile method under-covers at small N

### Scholar Commands

```bash
# Generate results for coverage study
/manuscript:results \
  --analysis "Monte Carlo coverage study" \
  --outcome "empirical coverage probability" \
  --conditions "sample size (50, 100, 200, 500), effect size (0, 0.14, 0.39, 0.59)" \
  --replications 5000 \
  --include-table \
  --include-figure
```

### Generated Results Section

#### Simulation Design Summary

We evaluated the empirical coverage probability of 95% confidence intervals for the indirect effect $\theta = \alpha\beta$ across a fully crossed design: 4 sample sizes ($n \in \{50, 100, 200, 500\}$) $\times$ 4 effect magnitudes ($\theta \in \{0, 0.014, 0.117, 0.348\}$, corresponding to zero, small, medium, and large indirect effects per Miocevic et al., 2018) $\times$ 3 bootstrap methods (percentile, BCa, double bootstrap). Each of the 48 conditions was replicated $R = 5{,}000$ times. The Monte Carlo standard error for a true 95% coverage rate is $\sqrt{0.95 \times 0.05 / 5000} = 0.0031$, ensuring that departures of 1 percentage point from nominal are detectable.

#### Coverage Results

Table 1 presents empirical coverage rates by method, sample size, and effect magnitude. Under the null ($\theta = 0$), all three methods maintained nominal coverage (range: 0.946-0.953). For non-null effects, the percentile method showed systematic under-coverage that worsened with smaller samples and larger effects. At $n = 50$ and $\theta = 0.348$, percentile coverage dropped to 0.884, nearly 7 percentage points below nominal. BCa intervals maintained coverage within 2 percentage points of nominal across all non-null conditions (range: 0.933-0.952). The double bootstrap achieved the tightest adherence to 95% (range: 0.944-0.953) but required approximately 100 times the computation.

**Table 1**
*Empirical Coverage Probability (95% CI Target) by Method and Condition*

| n | $\theta$ | Percentile | BCa | Double Bootstrap |
|---|----------|-----------|-----|-----------------|
| 50 | 0.000 | 0.949 | 0.951 | 0.950 |
| 50 | 0.014 | 0.923 | 0.942 | 0.948 |
| 50 | 0.117 | 0.908 | 0.937 | 0.946 |
| 50 | 0.348 | 0.884 | 0.933 | 0.944 |
| 200 | 0.000 | 0.951 | 0.950 | 0.951 |
| 200 | 0.014 | 0.943 | 0.949 | 0.950 |
| 200 | 0.117 | 0.938 | 0.948 | 0.950 |
| 200 | 0.348 | 0.935 | 0.947 | 0.951 |
| 500 | 0.000 | 0.950 | 0.950 | 0.951 |
| 500 | 0.014 | 0.948 | 0.950 | 0.951 |
| 500 | 0.117 | 0.946 | 0.950 | 0.950 |
| 500 | 0.348 | 0.944 | 0.949 | 0.950 |

*Note.* Values are proportions of 5,000 replications where the 95% CI contained the true parameter. Monte Carlo SE $\approx$ 0.003. Bold indicates coverage below 0.925 (Bradley's liberal criterion).

#### Tail Error Analysis

Coverage alone does not reveal whether under-coverage is symmetric. We decomposed non-coverage into lower-tail (CI above true value) and upper-tail (CI below true value) error rates. The percentile method exhibited asymmetric tail errors for skewed indirect-effect distributions: lower-tail error was 1.8-3.4 times the upper-tail error at $n = 50$ for non-null effects. BCa's bias and acceleration corrections restored approximate tail symmetry (ratio range: 0.85-1.15 across all conditions).

### Key Elements

- **Monte Carlo SE**: Precision of coverage estimates quantified
- **Condition crossing**: Systematic variation of sample size and effect magnitude
- **Three methods compared**: Percentile, BCa, double bootstrap with trade-offs
- **Tail error decomposition**: Asymmetry diagnosed beyond aggregate coverage
- **Bradley's criterion**: Formal benchmark for acceptable coverage departures

---

## Example 6: Power Analysis (Simulation)

### Research Context

**Study**: Empirical power evaluation for detecting mediation indirect effects across sample sizes, path strengths, and significance testing methods

**Research Questions**:
1. What sample sizes are required to achieve 80% power for small, medium, and large indirect effects?
2. How do Sobel, percentile bootstrap, and joint significance tests compare in power?

**Analysis**: Monte Carlo power simulation with 10,000 replications per condition

**Key Results**: Bootstrap methods substantially outperform Sobel test for small effects; N = 200 needed for 80% power with medium effect

### Scholar Commands

```bash
# Generate results for power analysis
/manuscript:results \
  --analysis "Monte Carlo power simulation" \
  --outcome "empirical rejection rate" \
  --conditions "sample size, path strengths, test method" \
  --replications 10000 \
  --include-table \
  --include-figure
```

### Generated Results Section

#### Power Simulation Design

We evaluated the empirical power (probability of rejecting $H_0: \theta = 0$ when $\theta \neq 0$) of three tests for the indirect effect: the Sobel normal-theory test, the percentile bootstrap test (B = 5,000), and the joint significance test (requiring both $a \neq 0$ and $b \neq 0$). We crossed 5 sample sizes ($n \in \{50, 100, 200, 500, 1000\}$) with 9 combinations of path coefficients ($a, b \in \{0.14, 0.39, 0.59\}$, representing small, medium, and large effects). Each of the 135 conditions used $R = 10{,}000$ replications. The nominal significance level was $\alpha = .05$.

#### Type I Error Verification

Under the complete null ($a = 0, b = 0$) and partial nulls ($a \neq 0, b = 0$ and $a = 0, b \neq 0$), all three tests maintained appropriate Type I error rates ($\hat{\alpha} \in [0.042, 0.055]$) across sample sizes, confirming valid size control.

#### Empirical Power Results

Table 1 presents power for selected conditions. For large indirect effects ($a = b = 0.59$, $\theta = 0.348$), all methods achieved near-complete power ($\geq 0.99$) even at $n = 50$. For medium effects ($a = b = 0.39$, $\theta = 0.152$), the bootstrap test reached 80% power at $n = 200$, the joint significance test at $n = 250$, and the Sobel test at $n = 300$. For small effects ($a = b = 0.14$, $\theta = 0.020$), even $n = 1{,}000$ yielded only 52% power with the bootstrap, underscoring the difficulty of detecting small indirect effects.

**Table 1**
*Empirical Power (%) for Detecting the Indirect Effect*

| $a$ | $b$ | $\theta$ | Method | n=50 | n=100 | n=200 | n=500 | n=1000 |
|-----|-----|----------|--------|------|-------|-------|-------|--------|
| 0.14 | 0.14 | 0.020 | Sobel | 5.8 | 8.1 | 12.4 | 25.3 | 41.6 |
|  |  |  | Bootstrap | 7.2 | 10.8 | 16.9 | 33.1 | 52.0 |
|  |  |  | Joint Sig. | 6.5 | 9.4 | 14.5 | 29.2 | 47.1 |
| 0.39 | 0.39 | 0.152 | Sobel | 28.4 | 52.3 | 73.8 | 96.2 | 99.8 |
|  |  |  | Bootstrap | 37.6 | 62.1 | 82.4 | 98.1 | 99.9 |
|  |  |  | Joint Sig. | 33.2 | 57.5 | 78.0 | 97.4 | 99.9 |
| 0.59 | 0.59 | 0.348 | Sobel | 85.2 | 97.4 | 99.9 | 100 | 100 |
|  |  |  | Bootstrap | 91.3 | 98.8 | 100 | 100 | 100 |
|  |  |  | Joint Sig. | 88.7 | 98.1 | 99.9 | 100 | 100 |

*Note.* Power = proportion of 10,000 replications rejecting $H_0: \theta = 0$ at $\alpha = .05$. Bootstrap uses 5,000 resamples with percentile CI.

#### Power Advantage of Bootstrap Methods

The bootstrap test consistently outperformed both the Sobel and joint significance tests, with the largest advantage at small to moderate sample sizes. At $n = 100$ with medium paths ($a = b = 0.39$), the bootstrap provided 62.1% power compared to 52.3% for Sobel, a relative gain of 18.7%. This advantage stems from the bootstrap's ability to accommodate the non-normal sampling distribution of the product $ab$ without relying on the delta method approximation.

### Key Elements

- **Complete design**: Sample sizes, path strengths, and test methods fully crossed
- **Type I error verification**: Valid size confirmed before interpreting power
- **Minimum required N**: Explicit sample size guidance for 80% power
- **Method ranking**: Bootstrap > joint significance > Sobel, quantified
- **Small effect difficulty**: Honest reporting of limited power for small effects

---

## Example 7: Method Comparison (Simulation)

### Research Context

**Study**: Comparing five estimators for the average treatment effect (ATE) under varying degrees of confounding, model misspecification, and overlap violations

**Research Questions**:
1. Which estimators are most robust to model misspecification?
2. How does poor covariate overlap affect estimator performance?

**Analysis**: Monte Carlo simulation with 2,000 replications per condition

**Key Results**: Doubly robust estimators outperform single-model approaches; all estimators degrade under severe overlap violations

### Scholar Commands

```bash
# Generate results for method comparison
/manuscript:results \
  --analysis "estimator comparison simulation" \
  --outcome "bias, RMSE, coverage for ATE" \
  --methods "OLS, IPW, AIPW, TMLE, matching" \
  --conditions "confounding strength, misspecification, overlap" \
  --replications 2000 \
  --include-table
```

### Generated Results Section

#### Estimator Performance Under Correct Specification

Table 1 presents bias, root mean squared error (RMSE), and 95% CI coverage for the five estimators when both the outcome model and propensity score model are correctly specified. All five estimators were approximately unbiased (|bias| $< 0.05$) with coverage near 95%. AIPW and TMLE had the lowest RMSE, reflecting their efficiency gains from using both outcome and propensity models.

**Table 1**
*Estimator Performance Under Correct Model Specification (True ATE = 2.00)*

| Estimator | Bias | SD | RMSE | Coverage | CI Width |
|-----------|------|----|------|----------|----------|
| OLS | 0.02 | 0.41 | 0.41 | 0.948 | 1.62 |
| IPW | 0.01 | 0.52 | 0.52 | 0.951 | 2.05 |
| AIPW | 0.01 | 0.38 | 0.38 | 0.953 | 1.50 |
| TMLE | 0.01 | 0.39 | 0.39 | 0.952 | 1.53 |
| Matching (1:1) | -0.03 | 0.48 | 0.48 | 0.944 | 1.85 |

*Note.* N = 500, 2,000 replications. Bias = mean estimate minus true ATE. SD = standard deviation of estimates. RMSE = root mean squared error. Coverage = proportion of 95% CIs containing 2.00.

#### Impact of Model Misspecification

Table 2 reports results when either the outcome model or the propensity score model is misspecified (omitting a quadratic confounder term). When only the outcome model was misspecified, OLS showed substantial bias (0.38) while IPW remained unbiased. When only the propensity model was misspecified, IPW became biased (0.42) while OLS was unaffected. The doubly robust estimators (AIPW and TMLE) remained approximately unbiased (|bias| $< 0.06$) under either single misspecification, confirming their double robustness property.

**Table 2**
*Bias Under Model Misspecification*

| Misspecification | OLS | IPW | AIPW | TMLE | Matching |
|------------------|-----|-----|------|------|----------|
| None | 0.02 | 0.01 | 0.01 | 0.01 | -0.03 |
| Outcome only | 0.38 | 0.01 | 0.04 | 0.03 | -0.03 |
| Propensity only | 0.02 | 0.42 | 0.05 | 0.06 | 0.31 |
| Both | 0.41 | 0.45 | 0.34 | 0.32 | 0.35 |

*Note.* N = 500, 2,000 replications. Bold indicates |bias| > 0.10.

#### Impact of Overlap Violations

When the propensity score distribution included extreme values near 0 and 1 (poor overlap), all estimators showed increased RMSE. IPW was most severely affected, with RMSE increasing 3.2-fold under severe overlap violation due to extreme weights. TMLE with truncated weights and matching showed greatest robustness, with RMSE increases of 1.4-fold and 1.3-fold, respectively.

### Key Elements

- **Five estimators**: Comprehensive comparison spanning parametric, semiparametric, and nonparametric
- **Bias, RMSE, coverage**: Full performance profile beyond a single metric
- **Double robustness demonstrated**: AIPW and TMLE unbiased under single misspecification
- **Overlap sensitivity**: Practical guidance on estimator choice under limited overlap
- **Both misspecified**: Honest reporting that no estimator rescues dual misspecification

---

## Example 8: Robustness Study (Simulation)

### Research Context

**Study**: Sensitivity analysis evaluating how violations of key assumptions affect inference for the indirect effect in mediation analysis

**Research Questions**:
1. How sensitive are indirect effect estimates to non-normal errors?
2. What is the impact of omitted confounders on indirect effect bias and coverage?
3. How does measurement error in the mediator distort mediation inference?

**Analysis**: Monte Carlo simulation with 5,000 replications per condition

**Key Results**: Bootstrap inference is robust to non-normality; omitted confounders and mediator measurement error produce substantial bias

### Scholar Commands

```bash
# Generate results for robustness study
/manuscript:results \
  --analysis "robustness and sensitivity simulation" \
  --outcome "bias and coverage of indirect effect" \
  --violations "non-normality, omitted confounders, measurement error" \
  --replications 5000 \
  --include-table
```

### Generated Results Section

#### Robustness to Non-Normality

Table 1 presents indirect effect bias and BCa coverage under four error distributions: normal, $t_5$ (heavy-tailed), $\chi^2_3$ (skewed), and a contaminated normal (90% $\mathcal{N}(0,1)$ + 10% $\mathcal{N}(0,9)$). Across all non-normal distributions, bias remained negligible (|bias/$\theta$| $< 3\%$) and BCa coverage stayed within 1.5 percentage points of nominal 95% for $n \geq 100$. At $n = 50$, the $\chi^2_3$ distribution caused coverage to drop to 0.921, reflecting the combined effect of skewness and small samples on the BCa acceleration constant.

**Table 1**
*Indirect Effect Bias and Coverage Under Non-Normal Errors ($n = 200$, $\theta = 0.152$)*

| Error Distribution | Skewness | Kurtosis | Bias | Relative Bias (%) | BCa Coverage |
|-------------------|----------|----------|------|--------------------|--------------|
| Normal | 0.0 | 3.0 | 0.001 | 0.7 | 0.949 |
| $t_5$ | 0.0 | 9.0 | 0.002 | 1.3 | 0.946 |
| $\chi^2_3$ | 1.6 | 7.0 | -0.003 | -2.0 | 0.937 |
| Contaminated Normal | 0.0 | 7.2 | 0.001 | 0.7 | 0.943 |

*Note.* 5,000 replications. Relative bias = 100 $\times$ bias/$\theta$. BCa bootstrap with $B = 5{,}000$ resamples.

#### Sensitivity to Omitted Confounders

We introduced an omitted confounder $U$ that simultaneously affected both the mediator and the outcome with path strengths $\gamma_M$ and $\gamma_Y$. Table 2 shows that even moderate confounding ($\gamma_M = \gamma_Y = 0.3$) produced 18% upward bias in the indirect effect, with coverage declining to 0.89. Strong confounding ($\gamma_M = \gamma_Y = 0.5$) inflated the indirect effect by 41% and reduced coverage to 0.72. These results underscore the importance of the sequential ignorability assumption and the need for sensitivity analysis.

**Table 2**
*Impact of Omitted Confounder on Indirect Effect Estimates ($n = 200$, true $\theta = 0.152$)*

| $\gamma_M$ | $\gamma_Y$ | Mean Estimate | Bias | Relative Bias (%) | BCa Coverage |
|-------------|-------------|--------------|------|--------------------|--------------|
| 0.0 | 0.0 | 0.153 | 0.001 | 0.7 | 0.949 |
| 0.1 | 0.1 | 0.159 | 0.007 | 4.6 | 0.941 |
| 0.3 | 0.3 | 0.179 | 0.027 | 17.8 | 0.891 |
| 0.5 | 0.5 | 0.214 | 0.062 | 40.8 | 0.723 |

*Note.* 5,000 replications. $\gamma_M$ = confounder effect on mediator; $\gamma_Y$ = confounder effect on outcome. Coverage is for 95% BCa intervals centered on biased point estimates.

#### Sensitivity to Mediator Measurement Error

Classical measurement error in the mediator (reliability $\rho_{MM} \in \{1.0, 0.8, 0.6, 0.4\}$) attenuated the $b$-path estimate by a factor of approximately $\rho_{MM}$, consistent with the attenuation paradox in mediation (Ledgerwood & Shrout, 2011). With $\rho_{MM} = 0.6$, the indirect effect was underestimated by 38% on average. The direct effect ($c'$) was correspondingly overestimated, leading to a systematic understatement of the mediator's importance. Disattenuated estimates using known reliability values recovered the true indirect effect (bias $< 2\%$), but this correction requires accurate reliability information.

### Key Elements

- **Three violation types**: Non-normality, omitted confounders, measurement error
- **Relative bias**: Percentage bias for interpretable magnitude assessment
- **Coverage degradation**: Quantified relationship between violation severity and CI failure
- **Practical thresholds**: Confounding strength at which inference breaks down
- **Correction strategies**: Disattenuation approach for measurement error when reliability is known
- **Sequential ignorability**: Empirical demonstration of sensitivity to this key assumption

---

## Best Practices Summary

### Universal Reporting Standards

**All Results Sections Should Include:**

1. **Preliminary analyses**: Randomization checks, assumption verification, data screening
2. **Descriptive statistics**: Means, SDs, ranges, frequencies
3. **Inferential statistics**: Test statistics, degrees of freedom, exact p-values
4. **Effect sizes**: With 95% confidence intervals
5. **Tables and figures**: Publication-ready formatting with clear notes
6. **Interpretation**: Substantive meaning beyond statistical significance
7. **Robustness checks**: Sensitivity analyses, alternative specifications

### Table Formatting Guidelines

**Professional APA-Style Tables:**

- Use horizontal lines only (top, bottom, header separator)
- Left-align text, decimal-align numbers
- Include detailed notes (e.g., "Note. M = mean; SD = standard deviation")
- Report statistical significance with asterisks (*, **, ***)
- Include confidence intervals where applicable
- Ensure tables are self-contained (interpretable without text)

**Example Table Template:**

```markdown
**Table X**
*Descriptive Title in Title Case Italics*

| Variable | Group 1 | Group 2 | Effect Size |
|----------|---------|---------|-------------|
| Outcome | M (SD) | M (SD) | d [95% CI] |

*Note.* Define all abbreviations. Explain statistical tests and significance levels.
```

### Figure Guidelines

**Effective Data Visualization:**

- Clear axis labels with units
- Legible font sizes (minimum 10-12 pt)
- Error bars (SE or 95% CI) with legend
- Color-blind friendly palettes
- Minimal chart junk (no 3D effects, unnecessary gridlines)
- Comprehensive caption explaining all elements

### Statistical Reporting Format

**Complete Reporting Examples:**

```
t-test: t(df) = value, p = .XXX, d = value, 95% CI [LL, UL]

ANOVA: F(df1, df2) = value, p = .XXX, ηp² = value

Regression: b = value, SE = value, β = value, t(df) = value, p = .XXX, 95% CI [LL, UL]

Chi-square: χ²(df) = value, p = .XXX, Cramer's V = value

Correlation: r(df) = value, p = .XXX, 95% CI [LL, UL]
```

### Common Pitfalls to Avoid

- **Naked p-values**: Always include effect sizes and confidence intervals
- **Imprecise language**: "Marginally significant" is ambiguous; report exact p-value
- **Table overload**: Limit to essential information; supplementary tables online
- **Cherry-picking**: Report all planned analyses, not just significant findings
- **Interpretation errors**: Distinguish statistical from practical significance

---

## See Also

### Related Documentation

- [Methods Section Examples](methods-sections.md) - Companion guide for analysis design
- [Manuscript Writing Workflow](../workflows/research/manuscript-writing.md) - End-to-end publication process
- [Output Formats Guide](../OUTPUT-FORMATS-GUIDE.md) - Formatting and output options

### External Resources

- [APA Style Results Section](https://apastyle.apa.org/jars/quantitative) - Official guidelines
- [Reporting Statistics in APA Style](https://my.ilstu.edu/~jhkahn/apastats.html) - Comprehensive reference
- [CONSORT Statement](http://www.consort-statement.org/) - RCT reporting standards
- [STROBE Statement](https://www.strobe-statement.org/) - Observational study reporting

### Scholar Commands

- `/manuscript:results` - Generate results sections
- `/manuscript:table` - Create publication-ready tables
- `/manuscript:figure` - Generate data visualizations
- `/simulation:analysis` - Statistical power and effect size calculations

---

**Last Updated**: 2026-02-01
**Version**: v2.8.0
**Authors**: Scholar Development Team
