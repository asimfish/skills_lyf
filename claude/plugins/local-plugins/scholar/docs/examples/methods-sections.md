# Methods Section Examples

Complete examples demonstrating how to use Scholar to write rigorous statistical methods sections for academic manuscripts.

---

## Overview

This guide provides worked examples progressing from simple to complex statistical analyses. Each example includes:

- Research context and study design
- Scholar commands used
- Generated methods section
- LaTeX notation and statistical reporting standards
- Tips for clarity and reproducibility

---

## Example 1: Independent Samples t-Test (Simple)

### Research Context

**Study**: Comparing stress levels between two teaching methods (traditional lecture vs. active learning)

**Design**: Between-subjects experimental design with random assignment

**Sample**: N = 120 undergraduate students (60 per group)

**Outcome**: Perceived stress scale (0-40, continuous)

### Scholar Commands

```bash
# Generate methods section for simple comparison
/manuscript:methods \
  --design "between-subjects experimental" \
  --analysis "independent samples t-test" \
  --outcome "perceived stress" \
  --sample-size 120

# Check assumptions and power
/simulation:design \
  --effect-size 0.5 \
  --power 0.8 \
  --alpha 0.05
```

### Generated Methods Section

#### Participants

A total of 120 undergraduate students enrolled in introductory psychology courses participated in this study. Participants were randomly assigned to either the traditional lecture condition (n = 60) or the active learning condition (n = 60). The study was approved by the university's institutional review board, and all participants provided informed consent.

#### Measures

Perceived stress was assessed using a validated 40-item scale (Cohen et al., 1983), where higher scores indicate greater perceived stress. The scale demonstrated excellent internal consistency in our sample (Cronbach's α = 0.91).

#### Statistical Analysis

We compared perceived stress scores between teaching conditions using an independent samples t-test. Prior to analysis, we verified assumptions of normality (Shapiro-Wilk test) and homogeneity of variance (Levene's test). We report two-tailed p-values with α = .05. Effect sizes are reported as Cohen's d with 95% confidence intervals. Our sample size (N = 120) provided 80% power to detect a medium effect size (d = 0.5) at α = .05 (G*Power 3.1; Faul et al., 2007).

All analyses were conducted using R version 4.3.0 (R Core Team, 2023). Raw data and analysis scripts are available at [repository link].

### LaTeX Notation

```latex
% Reporting t-test results
t(118) = -2.45, p = .016, d = -0.45, 95\% CI [-0.81, -0.09]

% Sample statistics
M_{lecture} = 24.3, SD = 6.2; M_{active} = 21.8, SD = 5.9
```

### Key Elements

- **Design clarity**: Between-subjects, random assignment
- **Sample size justification**: Power analysis referenced
- **Assumption checks**: Normality, homogeneity of variance
- **Effect sizes**: Cohen's d with confidence intervals
- **Reproducibility**: Software versions, data availability

---

## Example 2: Multiple Regression (Intermediate)

### Research Context

**Study**: Predicting academic performance from study habits, sleep, and motivation

**Design**: Cross-sectional observational study

**Sample**: N = 250 college students

**Outcome**: GPA (continuous, 0-4.0)

**Predictors**: Study hours/week, sleep hours/night, intrinsic motivation (scale)

### Scholar Commands

```bash
# Generate methods for multiple regression
/manuscript:methods \
  --design "cross-sectional observational" \
  --analysis "multiple linear regression" \
  --outcome "GPA" \
  --predictors "study hours, sleep hours, intrinsic motivation" \
  --sample-size 250 \
  --covariates "age, gender"

# Check multicollinearity and power
/simulation:design \
  --n-predictors 3 \
  --sample-size 250 \
  --expected-r2 0.25
```

### Generated Methods Section

#### Participants

Participants were 250 undergraduate students (63% female, 37% male) recruited from introductory psychology courses at a large public university. Mean age was 19.4 years (SD = 1.2, range = 18-24). The study was approved by the institutional review board, and participants received course credit for participation.

#### Measures

**Academic Performance**. Cumulative GPA was obtained from official university records at the end of the fall semester (M = 3.12, SD = 0.58, range = 1.85-4.00).

**Study Habits**. Participants reported typical weekly study hours outside of class using a single item ("How many hours per week do you typically spend studying?"). Responses ranged from 5 to 45 hours (M = 18.3, SD = 8.4).

**Sleep Duration**. Average nightly sleep hours over the past month were assessed using the Pittsburgh Sleep Quality Index (Buysse et al., 1989). Responses ranged from 4.5 to 10.0 hours (M = 7.1, SD = 1.3).

**Intrinsic Motivation**. The Intrinsic Motivation Inventory (Ryan, 1982) assessed motivation to learn (7 items, 1-7 scale). The scale showed good reliability (α = 0.84). Scale scores ranged from 2.3 to 7.0 (M = 5.2, SD = 1.1).

#### Statistical Analysis

We used multiple linear regression to examine the simultaneous prediction of GPA from study hours, sleep hours, and intrinsic motivation. Age and gender were included as covariates. Prior to analysis, we examined assumptions:

1. **Linearity**: Scatterplots and partial regression plots revealed approximately linear relationships
2. **Independence**: Durbin-Watson test indicated independent residuals (d = 1.98)
3. **Normality**: Residuals were approximately normally distributed (Shapiro-Wilk p = .12)
4. **Homoscedasticity**: Residual plots showed constant variance across fitted values
5. **Multicollinearity**: All variance inflation factors (VIF) were below 2.0, indicating negligible multicollinearity

We report unstandardized (b) and standardized (β) regression coefficients with 95% confidence intervals. Model fit is assessed using R² and adjusted R². Statistical significance was evaluated at α = .05. Our sample size (N = 250) exceeded the minimum required for detecting a medium-sized multiple correlation (R² = .13) with 5 predictors at 80% power and α = .05 (minimum N = 91; Cohen, 1988).

We conducted sensitivity analyses to assess the influence of potential outliers (|standardized residual| > 3) and high-leverage points (Cook's D > 1). No observations met these criteria.

All analyses were performed using R version 4.3.0 (R Core Team, 2023) with the **car** package version 3.1-2 (Fox & Weisberg, 2019) for diagnostics. Analysis code and de-identified data are available at [repository link].

### LaTeX Notation

```latex
% Regression equation
\text{GPA} = b_0 + b_1(\text{Study}) + b_2(\text{Sleep}) + b_3(\text{Motivation}) + \epsilon

% Results reporting
b = 0.012, SE = 0.004, \beta = .18, 95\% CI [0.004, 0.020], t(244) = 3.15, p = .002

% Model fit
R^2 = .24, F(5, 244) = 15.6, p < .001
```

### Key Elements

- **Descriptive statistics**: Means, SDs, ranges for all variables
- **Reliability**: Cronbach's α for multi-item scales
- **Assumption checks**: All five regression assumptions verified
- **Multicollinearity**: VIF values reported
- **Power justification**: Sample size exceeds minimum requirement
- **Sensitivity analyses**: Outlier and leverage diagnostics
- **Reproducibility**: Package versions, data sharing statement

---

## Example 3: Mixed-Effects Models (Advanced)

### Research Context

**Study**: Longitudinal study of therapy effectiveness with clients nested within therapists

**Design**: Multilevel clustered design with repeated measures

**Sample**: N = 180 clients, 30 therapists, 6 time points

**Outcome**: Depression symptom severity (continuous)

**Predictors**: Time, treatment condition, client characteristics

### Scholar Commands

```bash
# Generate methods for multilevel model
/manuscript:methods \
  --design "multilevel longitudinal" \
  --analysis "linear mixed-effects model" \
  --outcome "depression severity" \
  --predictors "time, treatment condition, baseline severity" \
  --random-effects "therapist, client" \
  --sample-size "180 clients, 30 therapists, 6 timepoints"

# Power analysis for clustered design
/simulation:design \
  --design "multilevel" \
  --n-level-1 180 \
  --n-level-2 30 \
  --icc 0.15 \
  --timepoints 6
```

### Generated Methods Section

#### Study Design and Participants

This study used a two-level clustered longitudinal design with clients (Level 1) nested within therapists (Level 2). A total of 180 adult clients (ages 18-65, M = 34.2, SD = 11.3; 58% female) seeking treatment for depression were recruited from 30 licensed therapists at four community mental health clinics. Therapists (mean 8.4 years experience, SD = 4.2) were randomly assigned to deliver either cognitive-behavioral therapy (CBT, n = 15 therapists, 90 clients) or supportive therapy (ST, n = 15 therapists, 90 clients). The study was approved by the university and clinic institutional review boards.

#### Measures

**Depression Severity**. The Beck Depression Inventory-II (BDI-II; Beck et al., 1996) assessed depression symptom severity at intake (baseline) and at weeks 4, 8, 12, 16, and 20 (6 time points). The BDI-II is a 21-item self-report measure with scores ranging from 0 to 63, where higher scores indicate greater depression severity. The BDI-II demonstrated excellent internal consistency across time points (αs = .91-.94).

**Baseline Characteristics**. We assessed potential covariates including age, gender, education level, prior therapy history, and baseline depression severity.

#### Data Structure and Missing Data

The dataset contained 1,080 possible observations (180 clients × 6 time points). A total of 137 observations (12.7%) were missing due to client dropout (n = 23 clients) or missed assessments (n = 114 isolated time points). We compared clients with complete data (n = 157) to those with missing data (n = 23) on baseline characteristics; no significant differences emerged (all ps > .10), supporting the assumption of data missing at random (MAR). Linear mixed-effects models use all available data under MAR, providing less biased estimates than listwise deletion (Enders, 2010).

#### Statistical Analysis

We used linear mixed-effects models to examine change in depression severity over time and to test whether the rate of change differed between treatment conditions. The multilevel structure accounts for the nested and repeated-measures design:

**Level 1 (Within-Client)**:
```latex
Y_{tij} = \pi_{0ij} + \pi_{1ij}(\text{Time}_{tij}) + e_{tij}
```

where $Y_{tij}$ is the depression score for client i within therapist j at time t, $\pi_{0ij}$ is client i's initial depression level, $\pi_{1ij}$ is client i's rate of change over time, and $e_{tij}$ is the within-client residual.

**Level 2 (Between-Client)**:
```latex
\begin{aligned}
\pi_{0ij} &= \beta_{00j} + \beta_{01}(\text{Treatment}_{ij}) + \beta_{02}(\text{Baseline}_{ij}) + r_{0ij} \\
\pi_{1ij} &= \beta_{10j} + \beta_{11}(\text{Treatment}_{ij}) + r_{1ij}
\end{aligned}
```

**Level 3 (Between-Therapist)**:
```latex
\begin{aligned}
\beta_{00j} &= \gamma_{000} + u_{00j} \\
\beta_{10j} &= \gamma_{100} + u_{10j}
\end{aligned}
```

#### Model Building Strategy

We used a systematic model-building approach (Singer & Willett, 2003):

1. **Unconditional means model**: Partitioned variance across levels (ICC calculation)
2. **Unconditional growth model**: Examined average trajectory (linear vs. quadratic time)
3. **Conditional growth model**: Added treatment condition and baseline severity
4. **Random effects structure**: Tested random slopes for time at both client and therapist levels
5. **Cross-level interactions**: Tested Treatment × Time interaction

Models were compared using likelihood ratio tests (LRT) for nested models and Akaike Information Criterion (AIC) for non-nested models. We used restricted maximum likelihood (REML) estimation for final models.

#### Assumptions

We evaluated multilevel model assumptions through diagnostic plots:

- **Linearity**: Scatterplots suggested linear change over time
- **Normality of random effects**: Q-Q plots indicated approximately normal distributions
- **Homoscedasticity**: Residual plots showed constant variance across time and fitted values
- **Independence**: Residuals within clients were assumed independent conditional on random effects

#### Intraclass Correlations

The unconditional means model revealed significant clustering at both levels:

- **Therapist level**: ICC = .15 (15% of variance between therapists)
- **Client level**: ICC = .62 (62% of variance between clients within therapists)

These ICCs justify the multilevel modeling approach and indicate substantial non-independence that would violate standard regression assumptions.

#### Sample Size and Power

Power for multilevel models depends on the number of clusters (therapists), cluster size (clients per therapist), and effect size. With 30 therapists and 6 clients per therapist, our design provided 80% power to detect a small-to-medium cross-level interaction (d = 0.35) at α = .05 (Snijders & Bosker, 2012). The 6 time points per client provided adequate power to detect within-client change (Raudenbush & Xiao-Feng, 2001).

#### Software

All models were fitted using the **lme4** package version 1.1-33 (Bates et al., 2015) in R version 4.3.0 (R Core Team, 2023). P-values for fixed effects were obtained using Satterthwaite approximations for degrees of freedom (**lmerTest** package version 3.1-3; Kuznetsova et al., 2017). Model assumptions were assessed using the **performance** package version 0.10.4 (Lüdecke et al., 2021). Complete analysis code and de-identified data are available at [repository link].

### LaTeX Notation

```latex
% Three-level model equation
Y_{tij} = \gamma_{000} + \gamma_{100}(\text{Time}_{tij}) + \gamma_{010}(\text{Treatment}_{ij})
          + \gamma_{110}(\text{Treatment}_{ij} \times \text{Time}_{tij})
          + u_{10j}(\text{Time}_{tij}) + u_{00j} + r_{1ij}(\text{Time}_{tij}) + r_{0ij} + e_{tij}

% Fixed effects reporting
\gamma_{110} = -0.82, SE = 0.31, 95\% CI [-1.42, -0.22], t(178) = -2.65, p = .009

% Random effects variance components
\sigma^2_{u_{00}} = 8.34, \sigma^2_{u_{10}} = 0.41, \sigma^2_{r_{0}} = 15.67, \sigma^2_{e} = 12.23

% ICC calculations
\text{ICC}_{\text{therapist}} = \frac{\sigma^2_{u_{00}}}{\sigma^2_{u_{00}} + \sigma^2_{r_{0}} + \sigma^2_{e}} = .15
```

### Key Elements

- **Design description**: Three-level structure explicitly defined
- **Mathematical notation**: Level 1, 2, and 3 equations
- **Missing data**: Pattern, missingness mechanism, handling strategy
- **Model building**: Systematic hypothesis testing sequence
- **ICCs**: Variance partitioning at each level
- **Assumption checks**: Multilevel-specific diagnostics
- **Power justification**: Cluster-level power considerations
- **Random effects**: Variance components reported
- **Software details**: Specific packages for p-values and diagnostics

---

## Example 4: Mediation Analysis (Complex)

### Research Context

**Study**: Testing whether emotion regulation mediates the effect of mindfulness training on anxiety

**Design**: Randomized controlled trial with pre-post assessments

**Sample**: N = 200 adults (100 per condition)

**Mediation model**: X (mindfulness training) → M (emotion regulation) → Y (anxiety symptoms)

### Scholar Commands

```bash
# Generate mediation methods section
/manuscript:methods \
  --design "randomized controlled trial mediation" \
  --analysis "causal mediation analysis" \
  --outcome "anxiety symptoms" \
  --predictor "mindfulness training" \
  --mediator "emotion regulation" \
  --sample-size 200

# Power analysis for mediation
/simulation:design \
  --analysis "mediation" \
  --path-a 0.4 \
  --path-b 0.4 \
  --sample-size 200 \
  --bootstrap 5000
```

### Generated Methods Section

#### Study Design

This randomized controlled trial (RCT) examined whether changes in emotion regulation ability mediate the effect of mindfulness-based stress reduction (MBSR) on anxiety symptoms. Participants were randomly assigned 1:1 to either an 8-week MBSR program (n = 100) or a waitlist control condition (n = 100). Assessments occurred at baseline (Week 0), post-intervention (Week 8), and 3-month follow-up (Week 20). This report focuses on baseline to post-intervention changes.

#### Participants

A total of 200 adults (ages 25-60, M = 38.4, SD = 9.2; 64% female) with elevated anxiety symptoms (Generalized Anxiety Disorder-7 score ≥ 10) were recruited from community health clinics. Exclusion criteria included current psychotherapy, psychotropic medication changes in the past 3 months, and lifetime diagnosis of psychotic or bipolar disorder. The study was registered at ClinicalTrials.gov (NCT########) and approved by the institutional review board. All participants provided written informed consent.

#### Intervention

The MBSR intervention followed the standardized 8-week protocol (Kabat-Zinn, 1990), including weekly 2.5-hour group sessions and a full-day retreat in Week 6. Participants were instructed to practice mindfulness meditation 45 minutes daily using guided audio recordings. Adherence was tracked via practice logs (M = 5.3 days/week, SD = 1.6). Waitlist participants received no intervention during the 8-week period and were offered MBSR after study completion.

#### Measures

**Anxiety Symptoms (Y, Outcome)**. The Generalized Anxiety Disorder-7 (GAD-7; Spitzer et al., 2006) assessed anxiety symptom severity over the past 2 weeks. Scores range from 0 to 21, with higher scores indicating greater anxiety. The GAD-7 showed excellent reliability in our sample (baseline α = .89, post-intervention α = .91).

**Emotion Regulation (M, Mediator)**. The Difficulties in Emotion Regulation Scale-Short Form (DERS-SF; Kaufman et al., 2016) assessed emotion regulation difficulties across six domains (18 items, 1-5 scale). Lower scores indicate better emotion regulation ability. The DERS-SF demonstrated strong reliability (baseline α = .91, post-intervention α = .93).

**Mindfulness Training (X, Predictor)**. Treatment assignment (MBSR = 1, Waitlist = 0) served as the independent variable in the mediation model.

#### Statistical Analysis

We tested the hypothesized mediation model whereby mindfulness training (X) reduces anxiety symptoms (Y) indirectly through improved emotion regulation (M). Following modern causal mediation analysis recommendations (Imai et al., 2010; VanderWeele, 2015), we used a counterfactual framework to decompose the total effect into natural direct and indirect effects.

#### Mediation Framework

The causal mediation model estimates three key pathways:

1. **a-path**: Effect of X (treatment) on M (emotion regulation)
   ```latex
   M = i_M + a \cdot X + e_M
   ```

2. **b-path**: Effect of M (emotion regulation) on Y (anxiety), controlling for X
   ```latex
   Y = i_Y + b \cdot M + c' \cdot X + e_Y
   ```

3. **c-path (total effect)**: Effect of X on Y without the mediator
   ```latex
   Y = i_Y + c \cdot X + e_Y
   ```

The indirect effect (IE) quantifies the pathway through the mediator (IE = a × b), and the direct effect (DE = c') represents the treatment effect not explained by the mediator. The total effect is the sum: c = c' + ab.

#### Estimation and Inference

We used bias-corrected bootstrap confidence intervals (Efron & Tibshirani, 1993) to test mediation, as this approach provides accurate inference without assuming normality of the sampling distribution (MacKinnon et al., 2004). We generated 10,000 bootstrap samples with replacement and computed the 95% confidence interval for the indirect effect. Mediation is supported if the confidence interval excludes zero.

We calculated three effect size measures:

1. **Proportion mediated**: PM = ab/c (percentage of total effect via mediator)
2. **Ratio of indirect to direct effect**: ab/c'
3. **Standardized indirect effect**: Completely standardized ab using SD units

#### Sequential Ignorability Assumption

Causal interpretation of mediation effects requires the sequential ignorability assumption (Imai et al., 2010): (1) treatment assignment is independent of potential outcomes and mediators (ensured by randomization), and (2) the mediator is independent of potential outcomes conditional on treatment and pre-treatment covariates. To strengthen the second assumption, we included baseline anxiety, depression symptoms, age, and gender as covariates in sensitivity analyses.

#### Sensitivity Analysis

We assessed robustness of the mediation findings to potential violations of sequential ignorability using sensitivity analysis (Imai et al., 2010). The sensitivity parameter ρ represents the correlation between residuals in the mediator and outcome models after conditioning on treatment and covariates. We calculated the minimum value of ρ that would nullify the indirect effect (ρ threshold).

We also conducted several supplementary analyses:

1. **Alternative mediators**: Tested competing mediators (e.g., mindfulness skills, rumination)
2. **Moderated mediation**: Examined whether baseline anxiety severity moderated the mediation pathway
3. **Reverse mediation**: Tested whether anxiety reduction mediates the effect on emotion regulation
4. **Missing data**: Multiple imputation (m = 50 datasets) using chained equations

#### Sample Size and Power

Power analysis for mediation depends on both path strengths (a and b) and their correlation. Assuming medium effects (a = b = 0.39), our sample size (N = 200) provided 80% power to detect the indirect effect with 5,000 bootstrap samples at α = .05 (Schoemann et al., 2017). This calculation assumed no dropout; our observed completion rate was 91% (n = 182), slightly reducing power.

#### Software

Mediation analyses were conducted using the **mediation** package version 4.5.0 (Tingley et al., 2014) in R version 4.3.0 (R Core Team, 2023). Bootstrap confidence intervals used 10,000 resamples with parallel processing. Sensitivity analyses used the **medsens** function. Multiple imputation used the **mice** package version 3.16.0 (van Buuren & Groothuis-Oudshoorn, 2011). Complete reproducible analysis code and de-identified data are available at [repository link].

### LaTeX Notation

```latex
% Mediation paths
a = -3.45, SE = 0.82, 95\% CI [-5.05, -1.85], p < .001
b = -0.28, SE = 0.09, 95\% CI [-0.45, -0.11], p = .001
c' = -1.12, SE = 0.51, 95\% CI [-2.12, -0.12], p = .028

% Indirect effect (bootstrap CI)
ab = 0.97, 95\% CI [0.32, 1.84]

% Total effect
c = 2.09, 95\% CI [0.89, 3.29]

% Proportion mediated
PM = \frac{ab}{c} = \frac{0.97}{2.09} = .46 \text{ (46\%)}

% Sensitivity analysis
\rho_{\text{threshold}} = 0.35
```

### Key Elements

- **Causal framework**: Counterfactual mediation approach
- **Path definitions**: a, b, c, c' paths explicitly defined with equations
- **Bootstrap inference**: 10,000 resamples for accurate CIs
- **Effect sizes**: Proportion mediated, standardized effects
- **Sequential ignorability**: Assumption stated and justified
- **Sensitivity analysis**: Robustness to unmeasured confounding (ρ threshold)
- **Alternative models**: Competing mediators, reverse causation tested
- **Power justification**: Path-specific power analysis
- **Reproducibility**: Package versions, bootstrap seed, code sharing

---

## Example 5: Logistic Regression (Intermediate)

### Research Context

**Study**: Predicting disease classification (diabetic vs. non-diabetic) from clinical biomarkers

**Design**: Cross-sectional diagnostic study

**Sample**: N = 400 adult patients (200 diabetic, 200 non-diabetic)

**Outcome**: Diabetes status (binary: 0 = non-diabetic, 1 = diabetic)

**Predictors**: Fasting glucose, HbA1c, BMI, age, family history

### Scholar Commands

```bash
# Generate methods for logistic regression
/manuscript:methods \
  --design "cross-sectional diagnostic" \
  --analysis "binary logistic regression" \
  --outcome "diabetes status" \
  --predictors "fasting glucose, HbA1c, BMI, age, family history" \
  --sample-size 400
```

### Generated Methods Section

#### Statistical Analysis

We used binary logistic regression to model the probability of diabetes classification as a function of clinical biomarkers. The model relates predictors to the log-odds of the outcome:

$$\log\left(\frac{p_i}{1 - p_i}\right) = \beta_0 + \beta_1 X_{1i} + \beta_2 X_{2i} + \cdots + \beta_k X_{ki}$$

where $p_i = P(Y_i = 1 \mid \mathbf{X}_i)$ is the probability of diabetes for patient $i$. Model parameters were estimated via maximum likelihood. Odds ratios ($\text{OR} = e^{\beta}$) with 95% Wald confidence intervals quantify the multiplicative change in odds per unit increase in each predictor.

We assessed model discrimination using the area under the receiver operating characteristic curve (AUC-ROC) and calibration using the Hosmer-Lemeshow goodness-of-fit test with $g = 10$ groups. Classification performance was evaluated at the optimal probability threshold determined by Youden's J statistic ($J = \text{Sensitivity} + \text{Specificity} - 1$). We report sensitivity, specificity, positive predictive value (PPV), and negative predictive value (NPV).

Multicollinearity among predictors was assessed using variance inflation factors (VIF < 5 threshold). Model comparison between the full model and reduced models used likelihood ratio tests. Internal validation employed 10-fold cross-validation to estimate optimism-corrected AUC. Our sample size (N = 400, 200 events) exceeds the recommended minimum of 10 events per predictor variable (Peduzzi et al., 1996).

All analyses were conducted using R version 4.3.0 with the **glm** function for model fitting and the **pROC** package version 1.18.4 (Robin et al., 2011) for ROC analysis.

### Key Elements

- **Model specification**: Log-odds equation with clear notation
- **Odds ratios**: Exponentiated coefficients for interpretability
- **Discrimination**: AUC-ROC for classification performance
- **Calibration**: Hosmer-Lemeshow goodness-of-fit
- **Internal validation**: Cross-validated AUC to guard against overfitting
- **Events-per-variable**: Sample size justification for logistic regression

---

## Example 6: Poisson Regression (Intermediate)

### Research Context

**Study**: Modeling hospital readmission counts within 12 months following cardiac surgery

**Design**: Retrospective cohort study

**Sample**: N = 850 patients from a regional hospital network

**Outcome**: Number of readmissions (count, range 0-8)

**Predictors**: Comorbidity index, procedure type, age, discharge disposition

### Scholar Commands

```bash
# Generate methods for count data analysis
/manuscript:methods \
  --design "retrospective cohort" \
  --analysis "Poisson regression with overdispersion check" \
  --outcome "readmission count" \
  --predictors "comorbidity index, procedure type, age, discharge disposition" \
  --sample-size 850 \
  --offset "log follow-up time"
```

### Generated Methods Section

#### Statistical Analysis

We modeled hospital readmission counts using Poisson regression with a log link, specifying the natural logarithm of follow-up time (in months) as an offset to account for varying exposure periods:

$$\log(\mu_i) = \log(t_i) + \beta_0 + \beta_1 X_{1i} + \cdots + \beta_k X_{ki}$$

where $\mu_i = E(Y_i \mid \mathbf{X}_i)$ is the expected readmission count and $t_i$ is the follow-up duration. Incidence rate ratios ($\text{IRR} = e^{\beta}$) with 95% confidence intervals were used to express the relative change in readmission rates per unit change in each predictor. Parameters were estimated via maximum likelihood.

We tested for overdispersion by comparing the residual deviance to its degrees of freedom and by fitting a negative binomial model as a formal alternative. If the dispersion parameter $\alpha$ in the negative binomial model differed significantly from zero (likelihood ratio test), we adopted the negative binomial specification. We also assessed zero-inflation by comparing the observed proportion of zero counts to the Poisson-predicted proportion using the Vuong test.

Model fit was evaluated using deviance residuals and the Akaike Information Criterion (AIC). Influential observations were identified using Cook's distance and leverage values. Our sample (N = 850 with a mean of 1.4 readmissions) satisfies the asymptotic requirements for Poisson maximum likelihood estimation.

All analyses were performed in R version 4.3.0 using the **glm** function for Poisson models, the **MASS** package version 7.3-60 (Venables & Ripley, 2002) for negative binomial regression, and the **pscl** package version 1.5.5 (Zeileis et al., 2008) for zero-inflated models.

### Key Elements

- **Log-link and offset**: Proper count model specification with exposure time
- **Incidence rate ratios**: Exponentiated coefficients for clinical interpretation
- **Overdispersion check**: Negative binomial as a formal alternative
- **Zero-inflation assessment**: Vuong test for excess zeros
- **Model comparison**: AIC-based selection among Poisson, NB, and zero-inflated variants

---

## Example 7: Survival Analysis (Advanced)

### Research Context

**Study**: Time to relapse following substance abuse treatment comparing two intervention programs

**Design**: Prospective randomized controlled trial with staggered enrollment and right censoring

**Sample**: N = 320 adults (160 per arm), median follow-up 18 months

**Outcome**: Time to first relapse (days)

**Predictors**: Treatment arm, baseline severity, prior treatment history, age

### Scholar Commands

```bash
# Generate methods for survival analysis
/manuscript:methods \
  --design "prospective RCT survival" \
  --analysis "Cox proportional hazards with Kaplan-Meier" \
  --outcome "time to relapse" \
  --predictors "treatment arm, baseline severity, prior treatment, age" \
  --sample-size 320 \
  --censoring "administrative and loss to follow-up"
```

### Generated Methods Section

#### Statistical Analysis

We estimated the survival function for time to first relapse using the Kaplan-Meier product-limit estimator within each treatment arm. Median survival times with 95% confidence intervals were obtained using the Brookmeyer-Crowley method. Between-group differences in survival distributions were tested using the log-rank test.

The hazard of relapse was modeled using the Cox proportional hazards model:

$$h(t \mid \mathbf{X}_i) = h_0(t) \exp(\beta_1 X_{1i} + \beta_2 X_{2i} + \cdots + \beta_k X_{ki})$$

where $h_0(t)$ is the unspecified baseline hazard function. Hazard ratios ($\text{HR} = e^{\beta}$) with 95% confidence intervals quantify the relative hazard of relapse associated with each predictor. We assessed the proportional hazards assumption using scaled Schoenfeld residuals and the global test of Grambsch and Therneau (1994). For any covariate violating proportionality, we considered stratification or time-varying coefficient extensions.

Participants who had not relapsed by the end of follow-up or who were lost to follow-up were treated as right-censored observations. We report the censoring proportion by treatment arm and compare censored versus uncensored participants on baseline characteristics to evaluate potential informative censoring. A total of 64 participants (20%) were censored; baseline comparisons revealed no significant differences (all $p > .10$).

We conducted a power analysis using the Schoenfeld (1983) formula: the study required 240 events to detect a hazard ratio of 0.65 with 80% power at $\alpha = .05$ (two-sided). With 256 observed events, the study was adequately powered.

All analyses used R version 4.3.0 with the **survival** package version 3.5-7 (Therneau, 2023) for Cox models and the **survminer** package version 0.4.9 (Kassambara et al., 2021) for Kaplan-Meier visualization.

### Key Elements

- **Kaplan-Meier estimation**: Non-parametric survival curves with median survival
- **Cox PH model**: Semi-parametric hazard model with baseline hazard left unspecified
- **Proportional hazards check**: Schoenfeld residual diagnostics
- **Censoring description**: Right censoring mechanism and informative censoring assessment
- **Event-driven power**: Schoenfeld formula for required number of events
- **Hazard ratios**: Clinical interpretation of relative hazard

---

## Example 8: Time Series (Advanced)

### Research Context

**Study**: Modeling monthly emergency department visits to assess the impact of a policy intervention (mandatory insurance expansion)

**Design**: Interrupted time series with pre- and post-intervention periods

**Sample**: T = 96 monthly observations (48 pre-intervention, 48 post-intervention)

**Outcome**: Monthly ED visit count (seasonally adjusted)

**Predictors**: Time trend, intervention indicator, post-intervention slope change

### Scholar Commands

```bash
# Generate methods for time series analysis
/manuscript:methods \
  --design "interrupted time series" \
  --analysis "ARIMA with intervention analysis" \
  --outcome "monthly ED visits" \
  --predictors "time, intervention, post-intervention slope" \
  --timepoints 96
```

### Generated Methods Section

#### Statistical Analysis

We used an interrupted time series (ITS) design to evaluate the impact of the insurance expansion policy on monthly emergency department visits. The segmented regression model for the series $\{Y_t\}$ is:

$$Y_t = \beta_0 + \beta_1 T_t + \beta_2 D_t + \beta_3 P_t + \epsilon_t$$

where $T_t$ is the time index (months since start), $D_t$ is the binary intervention indicator (0 = pre, 1 = post), $P_t$ is the time since intervention (0 for pre-intervention months), and $\epsilon_t$ is the error term. The coefficient $\beta_2$ captures the immediate level change at intervention onset, and $\beta_3$ captures the change in trend (slope) following the intervention.

We first examined the autocorrelation function (ACF) and partial autocorrelation function (PACF) of the pre-intervention series to identify appropriate ARIMA$(p, d, q)$ orders. Stationarity was assessed using the augmented Dickey-Fuller (ADF) test and the Kwiatkowski-Phillips-Schmidt-Shin (KPSS) test. Seasonal patterns were addressed by including Fourier terms or seasonal differencing as needed.

The final model was selected based on AIC among candidate ARIMA specifications, with Ljung-Box tests confirming that residuals were consistent with white noise ($Q(12) = 14.3, p = .28$). We report Newey-West heteroskedasticity and autocorrelation consistent (HAC) standard errors to ensure valid inference under potential residual correlation.

Sensitivity analyses included varying the bandwidth of the Newey-West estimator, testing for nonlinear pre-intervention trends, and excluding an adjustment period of 3 months around the intervention date. Our series length (T = 96 with 48 pre-intervention observations) exceeds the recommended minimum of 24 pre-intervention time points for ITS studies (Bernal et al., 2017).

All analyses were conducted in R version 4.3.0 using the **forecast** package version 8.21 (Hyndman & Khandakar, 2008) for ARIMA modeling and the **sandwich** package version 3.0-2 (Zeileis, 2004) for HAC standard errors.

### Key Elements

- **ITS model specification**: Segmented regression with level and slope change parameters
- **ARIMA identification**: ACF/PACF examination, stationarity tests (ADF, KPSS)
- **Model selection**: AIC-based comparison of candidate specifications
- **Residual diagnostics**: Ljung-Box test for white noise residuals
- **Robust inference**: Newey-West HAC standard errors
- **Sensitivity analyses**: Bandwidth variation, nonlinear trends, adjustment period exclusion

---

## Example 9: Bayesian Methods (Advanced)

### Research Context

**Study**: Estimating treatment efficacy for a rare pediatric condition using Bayesian hierarchical modeling to incorporate historical control data

**Design**: Single-arm clinical trial with informative priors from historical studies

**Sample**: N = 45 patients (current trial), N = 120 (historical controls across 3 prior studies)

**Outcome**: Symptom severity reduction (continuous)

**Parameters**: Treatment effect, between-study heterogeneity, borrowing weight

### Scholar Commands

```bash
# Generate methods for Bayesian analysis
/manuscript:methods \
  --design "single-arm trial with historical borrowing" \
  --analysis "Bayesian hierarchical model with MCMC" \
  --outcome "symptom severity reduction" \
  --priors "informative from historical data" \
  --sample-size 45
```

### Generated Methods Section

#### Statistical Analysis

We adopted a Bayesian hierarchical framework to estimate the treatment effect on symptom severity reduction, leveraging historical control data to supplement the current single-arm trial. The model is specified as:

$$Y_{ij} \mid \mu_j, \sigma^2 \sim \mathcal{N}(\mu_j, \sigma^2), \quad j = 0, 1, \ldots, J$$

$$\mu_j \mid \theta, \tau^2 \sim \mathcal{N}(\theta, \tau^2)$$

where $Y_{ij}$ denotes the outcome for patient $i$ in study $j$, $\mu_j$ is the study-specific mean, $\theta$ is the overall population mean, and $\tau^2$ is the between-study variance capturing heterogeneity across historical controls and the current trial.

Prior distributions were specified as follows:

- **Treatment effect**: $\theta \sim \mathcal{N}(5.0, 10^2)$, a weakly informative prior centered on the pooled historical estimate with a variance wide enough to accommodate substantial uncertainty
- **Between-study heterogeneity**: $\tau \sim \text{Half-Cauchy}(0, 2.5)$, following recommendations of Gelman (2006) for variance components in hierarchical models
- **Within-study variance**: $\sigma^2 \sim \text{Inv-Gamma}(0.01, 0.01)$, a standard diffuse prior

Posterior distributions were estimated via Markov chain Monte Carlo (MCMC) using the No-U-Turn Sampler (NUTS; Hoffman & Gelman, 2014). We ran four parallel chains for 10,000 iterations each, discarding the first 5,000 as warmup, yielding 20,000 posterior draws. Convergence was assessed using the Gelman-Rubin $\hat{R}$ statistic ($\hat{R} < 1.01$ for all parameters), effective sample size ($n_{\text{eff}} > 1000$), and visual inspection of trace plots.

We report posterior means with 95% highest density intervals (HDI). The probability of a clinically meaningful effect ($P(\theta > 3.0)$) was computed directly from the posterior. Prior sensitivity analysis compared results across three prior specifications: (1) the informative prior above, (2) a skeptical prior ($\theta \sim \mathcal{N}(0, 5^2)$), and (3) a non-informative prior ($\theta \sim \mathcal{N}(0, 100^2)$) to evaluate the influence of prior choice on posterior inference.

All analyses were conducted in R version 4.3.0 using the **brms** package version 2.20.4 (Burkner, 2017), which interfaces with Stan (Carpenter et al., 2017) for MCMC sampling.

### Key Elements

- **Hierarchical model**: Formal specification with likelihood and priors
- **Prior justification**: Informative, skeptical, and diffuse priors with rationale
- **MCMC details**: Sampler, chains, iterations, warmup, total posterior draws
- **Convergence diagnostics**: Gelman-Rubin $\hat{R}$, effective sample size, trace plots
- **Credible intervals**: 95% HDI rather than equal-tailed intervals
- **Prior sensitivity**: Three-prior comparison to assess robustness to prior specification

---

## Example 10: Propensity Score Methods (Advanced)

### Research Context

**Study**: Estimating the effect of a job training program on subsequent employment using observational data

**Design**: Non-randomized quasi-experimental study with selection bias

**Sample**: N = 1,200 (400 treated, 800 controls) from an administrative database

**Outcome**: Employment status at 12 months (binary)

**Treatment**: Participation in a workforce development program

### Scholar Commands

```bash
# Generate methods for propensity score analysis
/manuscript:methods \
  --design "quasi-experimental observational" \
  --analysis "propensity score matching and weighting" \
  --outcome "employment status" \
  --treatment "job training program" \
  --confounders "age, education, prior earnings, industry, region" \
  --sample-size 1200
```

### Generated Methods Section

#### Statistical Analysis

Because treatment assignment was non-random, we used propensity score methods to reduce confounding bias. The propensity score $e(\mathbf{X}_i) = P(Z_i = 1 \mid \mathbf{X}_i)$ is the conditional probability of receiving treatment given observed covariates $\mathbf{X}_i$. Under the strong ignorability assumption (Rosenbaum & Rubin, 1983), conditioning on the propensity score removes confounding from observed covariates.

We estimated propensity scores using logistic regression with all baseline covariates (age, education, prior 3-year earnings trajectory, industry sector, and geographic region) plus clinically motivated interaction terms and quadratic terms for continuous variables. The resulting propensity score distributions were examined for overlap; participants with estimated scores outside the region of common support ($0.05 < e(\mathbf{X}) < 0.95$) were trimmed, yielding an analytic sample of $N = 1,\!142$.

We estimated the average treatment effect on the treated (ATT) using two complementary approaches:

1. **Nearest-neighbor matching** (1:1 without replacement, caliper = 0.2 SD of logit propensity score): Matched treated participants to the nearest control on the propensity score. Covariate balance was assessed using standardized mean differences (SMD), targeting $|\text{SMD}| < 0.10$ for all covariates after matching.

2. **Inverse probability of treatment weighting (IPTW)**: Weighted controls by $e(\mathbf{X})/(1 - e(\mathbf{X}))$ to create a pseudo-population in which treatment is independent of observed covariates. Stabilized weights were used to reduce variance, and extreme weights were truncated at the 1st and 99th percentiles.

For each approach, we estimated the ATT as the weighted difference in outcome proportions and computed 95% confidence intervals using robust (sandwich) standard errors that account for the matching or weighting structure. Sensitivity to unmeasured confounding was assessed using Rosenbaum bounds, reporting the critical value of $\Gamma$ at which the treatment effect would be nullified.

All analyses were performed in R version 4.3.0 using the **MatchIt** package version 4.5.5 (Ho et al., 2011) for matching, the **WeightIt** package version 0.14.2 (Greifer, 2023) for IPTW, and the **cobalt** package version 4.5.1 (Greifer, 2023) for balance diagnostics.

### Key Elements

- **Propensity score estimation**: Logistic regression with flexible specification
- **Common support**: Overlap assessment and trimming
- **Matching and weighting**: Two complementary ATT estimators for robustness
- **Balance diagnostics**: Standardized mean differences with explicit threshold
- **Sensitivity analysis**: Rosenbaum bounds for unmeasured confounding
- **Robust inference**: Sandwich standard errors appropriate for the design

---

## Example 11: Instrumental Variables (Advanced)

### Research Context

**Study**: Estimating the causal effect of education on earnings using compulsory schooling laws as an instrument

**Design**: Cross-sectional observational study with potential endogeneity

**Sample**: N = 5,000 working adults from a national labor survey

**Outcome**: Log annual earnings (continuous)

**Endogenous variable**: Years of education

**Instrument**: Quarter of birth interacted with state compulsory schooling laws

### Scholar Commands

```bash
# Generate methods for IV estimation
/manuscript:methods \
  --design "cross-sectional observational with endogeneity" \
  --analysis "two-stage least squares" \
  --outcome "log earnings" \
  --endogenous "years of education" \
  --instrument "quarter of birth x compulsory schooling" \
  --sample-size 5000
```

### Generated Methods Section

#### Statistical Analysis

Ordinary least squares (OLS) estimates of the return to education may be biased by unobserved ability and measurement error in schooling. To obtain consistent estimates, we used two-stage least squares (2SLS) with quarter of birth interacted with state compulsory schooling laws as instruments for years of education, following the identification strategy of Angrist and Krueger (1991).

The 2SLS procedure estimates the structural equation:

$$\text{First stage:} \quad S_i = \pi_0 + \pi_1 Z_i + \mathbf{X}_i'\boldsymbol{\gamma} + v_i$$

$$\text{Second stage:} \quad \log(W_i) = \beta_0 + \beta_1 \hat{S}_i + \mathbf{X}_i'\boldsymbol{\delta} + u_i$$

where $S_i$ is years of education, $Z_i$ is the instrument vector, $\mathbf{X}_i$ is a vector of exogenous covariates (age, age$^2$, gender, race, state of birth, year of birth), $W_i$ is annual earnings, and $\hat{S}_i$ is the predicted value from the first stage. The coefficient $\beta_1$ estimates the local average treatment effect (LATE) of education on log earnings among compliers.

We assessed instrument validity through three diagnostic tests. First, the first-stage F-statistic tested instrument relevance; we require $F > 10$ to avoid weak-instrument bias (Stock & Yogo, 2005). Second, the Sargan-Hansen J-test of overidentifying restrictions evaluated instrument exogeneity under the assumption that at least one instrument is valid. Third, the Durbin-Wu-Hausman test compared OLS and 2SLS estimates to formally assess the endogeneity of education.

We also report weak-instrument robust inference using the Anderson-Rubin (AR) test, which provides valid confidence intervals regardless of instrument strength. Standard errors were clustered at the state-of-birth level to account for within-state correlation in compulsory schooling exposure.

All analyses used R version 4.3.0 with the **ivreg** package version 0.6-2 (Fox et al., 2023) for 2SLS estimation and the **lmtest** and **sandwich** packages for cluster-robust inference.

### Key Elements

- **Endogeneity motivation**: OLS bias from ability and measurement error
- **Two-stage specification**: First and second stage equations with notation
- **LATE interpretation**: Complier-specific causal effect
- **Instrument diagnostics**: Relevance (F > 10), exogeneity (Sargan-Hansen), endogeneity (Hausman)
- **Weak-instrument robustness**: Anderson-Rubin test for valid inference
- **Clustered standard errors**: Account for within-state instrument correlation

---

## Example 12: Difference-in-Differences (Advanced)

### Research Context

**Study**: Evaluating the effect of a state-level minimum wage increase on employment in the restaurant industry

**Design**: Quasi-experimental difference-in-differences with multiple time periods

**Sample**: N = 2,400 county-quarter observations (50 treated counties, 50 control counties, 24 quarters)

**Outcome**: Restaurant employment per 1,000 population

**Treatment**: State minimum wage increase (effective Q1 2022)

### Scholar Commands

```bash
# Generate methods for DiD analysis
/manuscript:methods \
  --design "quasi-experimental difference-in-differences" \
  --analysis "two-way fixed effects with parallel trends" \
  --outcome "restaurant employment rate" \
  --treatment "minimum wage increase" \
  --panel "county-quarter" \
  --sample-size "2400 county-quarter observations"
```

### Generated Methods Section

#### Statistical Analysis

We estimated the causal effect of the minimum wage increase on restaurant employment using a difference-in-differences (DiD) design. The canonical two-way fixed effects (TWFE) specification is:

$$Y_{ct} = \alpha_c + \lambda_t + \beta \cdot D_{ct} + \mathbf{X}_{ct}'\boldsymbol{\gamma} + \epsilon_{ct}$$

where $Y_{ct}$ is restaurant employment per 1,000 population in county $c$ at quarter $t$, $\alpha_c$ are county fixed effects absorbing time-invariant county characteristics, $\lambda_t$ are quarter fixed effects absorbing common temporal shocks, $D_{ct}$ is the treatment indicator (1 for treated counties in post-intervention quarters), and $\mathbf{X}_{ct}$ is a vector of time-varying county covariates (population, median income, unemployment rate). The coefficient $\beta$ identifies the average treatment effect on the treated (ATT) under the parallel trends assumption.

We assessed the parallel trends assumption using an event-study specification that replaces the single treatment indicator with a full set of leads and lags:

$$Y_{ct} = \alpha_c + \lambda_t + \sum_{k=-8}^{-2} \mu_k \cdot \mathbf{1}[t - t^* = k] + \sum_{k=0}^{8} \mu_k \cdot \mathbf{1}[t - t^* = k] + \epsilon_{ct}$$

where $t^*$ is the treatment adoption date and the period $k = -1$ is omitted as the reference. Pre-treatment coefficients $\mu_{-8}, \ldots, \mu_{-2}$ that are individually and jointly insignificant ($F$-test $p > .05$) support parallel pre-trends.

Standard errors were clustered at the county level, the unit of treatment assignment, following Bertrand et al. (2004). Given the moderate number of clusters (100 counties), we verified inference using the wild cluster bootstrap (Cameron et al., 2008) with 1,000 replications. Sensitivity analyses included (1) varying the control group using synthetic control methods, (2) testing for spillover effects in bordering counties, and (3) placebo tests assigning a false treatment date 12 months prior.

All analyses were conducted in R version 4.3.0 using the **fixest** package version 0.11.2 (Berge, 2018) for TWFE estimation and the **fwildclusterboot** package version 0.14 (Fischer & Roodman, 2021) for wild cluster bootstrap inference.

### Key Elements

- **TWFE specification**: County and time fixed effects with clear notation
- **Parallel trends**: Event-study specification with leads/lags and joint F-test
- **Clustered inference**: County-level clustering with wild bootstrap robustness
- **Sensitivity analyses**: Synthetic controls, spillovers, placebo tests
- **ATT identification**: Clear statement of identifying assumption

---

## Example 13: Bootstrap Methods (Intermediate)

### Research Context

**Study**: Constructing confidence intervals for the indirect effect in a mediation model when the sampling distribution is non-normal

**Design**: Cross-sectional observational study

**Sample**: N = 150 employees in an organizational behavior study

**Outcome**: Job performance rating (continuous)

**Parameters**: Indirect effect of leadership style on performance through employee engagement

### Scholar Commands

```bash
# Generate methods for bootstrap inference
/manuscript:methods \
  --design "cross-sectional mediation" \
  --analysis "bootstrap BCa confidence intervals" \
  --outcome "job performance" \
  --predictor "leadership style" \
  --mediator "employee engagement" \
  --bootstrap 10000 \
  --sample-size 150
```

### Generated Methods Section

#### Statistical Analysis

We used nonparametric bootstrap resampling to construct confidence intervals for the indirect effect, which is known to have a non-normal sampling distribution in finite samples (MacKinnon et al., 2004). The bootstrap procedure was implemented as follows:

1. Draw $B = 10{,}000$ bootstrap samples of size $n = 150$ with replacement from the observed data
2. For each bootstrap sample $b$, estimate the indirect effect $\hat{\theta}^{*}_b = \hat{a}^{*}_b \hat{b}^{*}_b$
3. Construct confidence intervals from the bootstrap distribution $\{\hat{\theta}^{*}_1, \ldots, \hat{\theta}^{*}_B\}$

We computed three types of bootstrap confidence intervals for comparison:

- **Percentile interval**: $[\hat{\theta}^{*}_{(\alpha/2)}, \hat{\theta}^{*}_{(1-\alpha/2)}]$, using the $\alpha/2$ and $1-\alpha/2$ quantiles of the bootstrap distribution
- **Bias-corrected and accelerated (BCa)** interval (Efron, 1987): Adjusts percentile endpoints for median bias ($z_0$) and skewness (acceleration constant $a$), yielding second-order accurate coverage
- **Percentile-$t$ (bootstrap-$t$)** interval: Uses the bootstrap distribution of the studentized statistic $t^* = (\hat{\theta}^* - \hat{\theta}) / \widehat{SE}^*$, requiring a nested (double) bootstrap for each resample to estimate $\widehat{SE}^*$

We assessed bootstrap stability by examining the Monte Carlo standard error of the confidence interval endpoints across 50 independent bootstrap runs, confirming that $B = 10{,}000$ provided stable estimates (endpoint SE $< 0.005$). The bootstrap distribution of $\hat{\theta}^*$ was examined for skewness and kurtosis to justify the need for BCa corrections over the simpler percentile method.

We also conducted a permutation test of the null hypothesis $H_0: \theta = 0$ by permuting the treatment variable 10,000 times and computing the proportion of permuted indirect effects exceeding the observed value, providing an exact $p$-value without distributional assumptions.

All analyses were conducted in R version 4.3.0 using the **boot** package version 1.3-28.1 (Canty & Ripley, 2022) for BCa intervals and the **lavaan** package version 0.6-16 (Rosseel, 2012) for mediation model estimation.

### Key Elements

- **Bootstrap algorithm**: Step-by-step resampling procedure
- **Three CI types**: Percentile, BCa, and bootstrap-$t$ for comparison
- **BCa correction**: Bias and acceleration parameters explained
- **Bootstrap stability**: Monte Carlo SE of endpoints to justify $B$
- **Permutation test**: Exact $p$-value as a complementary non-parametric test
- **Reproducibility**: Number of resamples, software, and package versions

---

## Example 14: Permutation Tests (Intermediate)

### Research Context

**Study**: Testing for group differences in brain connectivity patterns when distributional assumptions are uncertain

**Design**: Between-subjects neuroimaging study

**Sample**: N = 60 (30 patients with major depressive disorder, 30 healthy controls)

**Outcome**: Functional connectivity matrix (high-dimensional)

**Test**: Global test of group differences in connectivity patterns

### Scholar Commands

```bash
# Generate methods for permutation testing
/manuscript:methods \
  --design "between-subjects neuroimaging" \
  --analysis "permutation tests for high-dimensional data" \
  --outcome "functional connectivity" \
  --groups "MDD patients, healthy controls" \
  --sample-size 60
```

### Generated Methods Section

#### Statistical Analysis

We used a non-parametric permutation testing framework to assess group differences in whole-brain functional connectivity, avoiding distributional assumptions that may not hold for high-dimensional neuroimaging data.

The test statistic was the maximum of voxel-wise two-sample $t$-statistics across all $p = 4{,}950$ unique pairwise connections (from 100 brain regions). Under the null hypothesis of no group difference, the group labels are exchangeable. We generated the null distribution by:

1. Randomly permuting the $N = 60$ group labels across all $\binom{60}{30}$ possible arrangements
2. Computing the maximum $t$-statistic $T^*_{\max}$ for each permutation
3. Constructing the null distribution $\{T^*_{\max,1}, \ldots, T^*_{\max,B}\}$

We used $B = 10{,}000$ random permutations to approximate the exact null distribution. The $p$-value for the global test was computed as:

$$p = \frac{1 + \sum_{b=1}^{B} \mathbf{1}[T^*_{\max,b} \geq T_{\max,\text{obs}}]}{1 + B}$$

where the $+1$ in the numerator and denominator ensures a valid (conservative) $p$-value (Phipson & Smyth, 2010). This max-statistic approach inherently controls the family-wise error rate (FWER) at $\alpha = .05$ across all connections without requiring Bonferroni or other multiplicity corrections, as the null distribution accounts for the correlation structure among tests.

For connections identified as significant under the global test, we report individual permutation $p$-values with false discovery rate (FDR) control using the Benjamini-Hochberg procedure at $q = 0.05$ to identify specific connections driving the group difference.

To assess the sensitivity of our findings to the choice of test statistic, we repeated the analysis using the sum of squared $t$-statistics and the number of $t$-statistics exceeding a threshold as alternative omnibus statistics.

All analyses were conducted in R version 4.3.0 using custom permutation code validated against the **coin** package version 1.4-3 (Hothorn et al., 2008) for standard permutation tests and the **brainGraph** package version 3.0.0 (Watson, 2020) for connectivity analysis.

### Key Elements

- **Exchangeability**: Null hypothesis and justification for label permutation
- **Max-statistic approach**: Automatic FWER control through the null distribution
- **Exact $p$-value formula**: Conservative permutation $p$-value with Phipson-Smyth correction
- **Multiple comparisons**: Max-statistic for global FWER, BH-FDR for follow-up tests
- **Sensitivity**: Alternative test statistics to assess robustness
- **Computational detail**: Number of permutations specified

---

## Example 15: Cross-Validation (Intermediate)

### Research Context

**Study**: Comparing predictive performance of competing regression models for patient hospital length of stay

**Design**: Retrospective cohort with model development and validation

**Sample**: N = 1,500 surgical patients

**Outcome**: Hospital length of stay (days, continuous)

**Candidate models**: Linear regression, LASSO, ridge regression, elastic net, random forest

### Scholar Commands

```bash
# Generate methods for cross-validation
/manuscript:methods \
  --design "retrospective cohort model comparison" \
  --analysis "k-fold cross-validation and information criteria" \
  --outcome "length of stay" \
  --models "OLS, LASSO, ridge, elastic net, random forest" \
  --sample-size 1500
```

### Generated Methods Section

#### Statistical Analysis

We compared five candidate prediction models for hospital length of stay using a rigorous cross-validation framework. Model performance was assessed using both resampling-based and information-theoretic approaches.

**$k$-Fold Cross-Validation.** We implemented 10-fold cross-validation (CV) by randomly partitioning the sample into 10 equal-sized folds stratified by outcome quartile. For each fold $k = 1, \ldots, 10$, the model was trained on the remaining 9 folds and predictions were generated for the held-out fold. The CV estimate of prediction error is:

$$\text{CV}(10) = \frac{1}{10} \sum_{k=1}^{10} \frac{1}{n_k} \sum_{i \in \mathcal{F}_k} (Y_i - \hat{Y}_i^{(-k)})^2$$

where $\hat{Y}_i^{(-k)}$ is the prediction for observation $i$ from the model trained without fold $k$. We report the root mean squared error ($\text{RMSE} = \sqrt{\text{CV}(10)}$), mean absolute error (MAE), and the coefficient of determination ($R^2_{\text{CV}}$).

**Repeated Cross-Validation.** To reduce variance in CV estimates, we repeated the 10-fold procedure 50 times with different random partitions, reporting means and standard deviations of performance metrics across repetitions. Model comparison was based on paired $t$-tests of fold-level RMSE values (Dietterich, 1998), with Bonferroni correction for $\binom{5}{2} = 10$ pairwise comparisons.

**Information Criteria.** For parametric models (OLS, LASSO, ridge, elastic net), we also computed the Akaike Information Criterion (AIC) and the corrected AIC (AICc) for small-sample bias adjustment:

$$\text{AICc} = -2\log L + 2k + \frac{2k(k+1)}{n - k - 1}$$

where $k$ is the effective number of parameters and $n$ is the sample size. Model weights based on AICc quantify relative support for each model. For regularized models, the effective degrees of freedom were computed from the trace of the hat matrix.

**Leave-One-Out Cross-Validation.** As a supplementary analysis, we computed LOOCV estimates for the linear models using the efficient hat-matrix formula $\text{LOOCV} = \frac{1}{n}\sum_{i=1}^{n}\left(\frac{Y_i - \hat{Y}_i}{1 - h_{ii}}\right)^2$ to verify consistency with 10-fold results.

All analyses were performed in R version 4.3.0 using the **caret** package version 6.0-94 (Kuhn, 2023) for cross-validation, the **glmnet** package version 4.1-8 (Friedman et al., 2010) for regularized regression, and the **ranger** package version 0.16.0 (Wright & Ziegler, 2017) for random forests.

### Key Elements

- **$k$-fold CV**: Formal definition with prediction error formula
- **Repeated CV**: Variance reduction through 50 repetitions
- **Model comparison**: Paired tests with multiplicity correction
- **Information criteria**: AICc with effective degrees of freedom for regularized models
- **LOOCV**: Efficient computation via hat-matrix shortcut
- **Multiple metrics**: RMSE, MAE, and $R^2_{\text{CV}}$ for comprehensive assessment

---

## Best Practices Summary

### Reporting Standards

**All Analyses Should Include:**

1. **Sample description**: N, demographics, inclusion/exclusion criteria
2. **Measures**: Reliability estimates, score ranges, response options
3. **Statistical test choice**: Justification for selected method
4. **Assumptions**: Verification procedures and results
5. **Effect sizes**: Appropriate measures with confidence intervals
6. **Power analysis**: Sample size justification
7. **Software**: Versions for R, packages, and key functions
8. **Reproducibility**: Data and code availability statement

### LaTeX Notation Tips

```latex
% Use \text{} for subscript words
M_{\text{treatment}} \text{ not } M_{treatment}

% Italicize statistics, not symbols
t(118) = 2.45, p = .016, \textit{d} = 0.45

% 95% CI format
95\% \text{ CI } [0.12, 0.78]

% R-squared
R^2 = .24, R^2_{\text{adj}} = .22

% Greek letters
\beta, \alpha, \sigma^2, \rho

% Conditional notation
Y \mid X, M \mid X, Y \mid (X, M)
```

### Common Pitfalls

- **Omitting assumption checks**: Always verify before reporting results
- **P-value only**: Include effect sizes and confidence intervals
- **Software vagueness**: Specify package versions, not just "R"
- **No power analysis**: Justify sample size prospectively
- **Missing data ignored**: State missing data pattern and handling
- **Reproducibility**: Code and data availability strengthen rigor

---

## See Also

### Related Documentation

- [Results Section Examples](results-sections.md) - Companion guide for reporting findings
- [Simulation Study Examples](simulations.md) - Power analysis and design
- [Output Formats Guide](../OUTPUT-FORMATS-GUIDE.md) - Equation formatting and output options
- [API Reference](../API-REFERENCE.md) - Full Scholar command documentation

### External Resources

- [APA Style 7th Edition](https://apastyle.apa.org/) - Publication manual
- [JARS Guidelines](https://www.apa.org/pubs/journals/resources/jars) - Journal article reporting standards
- [Equator Network](https://www.equator-network.org/) - Reporting guidelines for health research
- [Open Science Framework](https://osf.io/) - Data and materials sharing

### Scholar Commands

- `/manuscript:methods` - Generate methods sections
- `/manuscript:results` - Generate results sections
- `/simulation:design` - Power analysis and sample size planning
- `/literature:search` - Find methodological references

---

**Last Updated**: 2026-02-01
**Version**: v2.8.0
**Authors**: Scholar Development Team
