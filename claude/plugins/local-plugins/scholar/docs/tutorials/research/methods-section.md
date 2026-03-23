# Tutorial: Writing Statistical Methods Sections

**Target Audience:** Researchers writing their first statistical methods section
**Time:** 60-90 minutes
**Difficulty:** Intermediate

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Structure a complete statistical methods section
- Write clear descriptions of statistical models with proper notation
- Explain estimation procedures for reproducibility
- Include appropriate software and implementation details
- Address assumptions and limitations transparently
- Use `/research:manuscript:methods` to draft methods content
- Progress from simple to complex statistical descriptions
- Format methods for different journal styles (APA, AMA, Nature, etc.)
- Integrate with reproducible research workflows

## Prerequisites

Before starting, make sure you have:

- [ ] Scholar installed (`brew install data-wise/tap/scholar` or npm install)
- [ ] Claude Code running
- [ ] Your statistical analysis completed
- [ ] R/Python/SPSS code for your analysis
- [ ] Data description and study design documented
- [ ] Understanding of your statistical method
- [ ] Target journal identified (for style requirements)
- [ ] LaTeX or Markdown knowledge for equations

**Installation Check:**

```bash
scholar --version
# Should show: scholar v2.6.0 or later

# Verify manuscript commands
scholar list-commands | grep "manuscript"
# Should show: research:manuscript:methods, research:manuscript:results, etc.
```

---

## Step 1: Understand Your Analysis ⏱️ 15 minutes

### What You'll Do

Before writing anything, clearly articulate what statistical analysis you performed. This prevents the most common mistake: vague methods descriptions.

### The Four Core Questions

Answer these before writing:

#### 1. What is your research question?

**Example:**

> "Do sleep duration and exercise frequency mediate the relationship between
> stress and depression symptoms in college students?"

#### 2. What data do you have?

**Example:**

```markdown
## Data Overview

- **Design**: Cross-sectional survey
- **Sample size**: n = 350 undergraduate students
- **Sampling**: Convenience sample from Intro Psych courses
- **Measures**:
  - Stress: Perceived Stress Scale (PSS-10), continuous, 0-40
  - Sleep: Average hours per night, continuous
  - Exercise: Days per week with 30+ min activity, count (0-7)
  - Depression: PHQ-9, continuous, 0-27
- **Covariates**: Age, sex, year in school
```

#### 3. What statistical model did you use?

**Example:**

> "We used causal mediation analysis to estimate direct and indirect effects.
> The indirect effects represent the pathway through sleep duration and
> exercise frequency. We estimated effects using bootstrap resampling with
> bias-corrected confidence intervals."

#### 4. What software did you use?

**Example:**

> "All analyses were conducted in R 4.3.2 using the mediation package (v4.5.0)
> with 5,000 bootstrap replicates. Code is available at [GitHub link]."

### Create an Analysis Summary Document

```markdown
# Analysis Summary: Stress-Depression Mediation Study

## Research Question

Does sleep duration and exercise frequency mediate the relationship between
stress and depression in college students?

## Data Structure

| Variable | Type | Range | Mean (SD) | Missingness |
|----------|------|-------|-----------|-------------|
| Stress (PSS-10) | Continuous | 0-40 | 24.3 (6.2) | 0% |
| Sleep (hours) | Continuous | 3-10 | 6.8 (1.1) | 2% |
| Exercise (days/week) | Count | 0-7 | 2.4 (1.8) | 1% |
| Depression (PHQ-9) | Continuous | 0-27 | 11.2 (5.8) | 0% |
| Age | Continuous | 18-24 | 19.8 (1.4) | 0% |
| Sex | Binary | M/F | 62% F | 0% |

**Sample size:** n = 350 (after listwise deletion: n = 343)

## Statistical Model

**Type:** Causal mediation analysis with multiple mediators

**Estimand:**
- Total effect (TE): Effect of stress on depression
- Natural direct effect (NDE): Effect not through mediators
- Natural indirect effect (NIE): Effect through sleep and exercise

**Equations:**

Mediator models:
- Sleep ~ Stress + Age + Sex
- Exercise ~ Stress + Age + Sex

Outcome model:
- Depression ~ Stress + Sleep + Exercise + Age + Sex

**Estimation:** Bootstrap with 5,000 replicates, percentile confidence intervals

**Software:** R 4.3.2, mediation package v4.5.0

## Key Assumptions

1. No unmeasured confounding of stress-mediator relationships
2. No unmeasured confounding of mediator-depression relationships
3. No unmeasured confounding of stress-depression relationship
4. No mediator-outcome confounding affected by exposure
5. Linear relationships (checked with residual plots)
6. Homoscedasticity (checked with Breusch-Pagan test)

## Reproducibility

- Data: Available upon request (IRB restrictions)
- Code: https://github.com/username/stress-mediation
- R version: 4.3.2
- Key packages: mediation 4.5.0, tidyverse 2.0.0
- Random seed: 20250201
```

**Save as:** `analysis-summary.md`

### Try It Now

1. Create your own analysis summary document
2. Fill in each section with your specific details
3. Include all variables, sample sizes, and missing data
4. Document your software and package versions

### ✅ Checkpoint 1

- [ ] Research question is clear and specific
- [ ] Data structure is documented (variables, types, ranges)
- [ ] Statistical model is named and described
- [ ] Software and versions are recorded
- [ ] Key assumptions are listed
- [ ] Reproducibility information is complete

**Troubleshooting:**

- **Unclear research question**: Ask "What causal/associational claim am I making?"
- **Missing details**: Check your analysis script for all model specifications
- **Don't know the assumptions**: Look up your method in a textbook
- **Software versions unknown**: Check with `R.version` or `python --version`

---

## Step 2: Structure Your Methods Section ⏱️ 10 minutes

### What You'll Do

Organize your methods into standard subsections. This structure works for most statistical papers.

### Standard Structure

```markdown
## Statistical Methods

### 2.1 Study Design and Participants

[Who, what, when, where, how recruited]

### 2.2 Measures

[Description of each variable]

### 2.3 Statistical Analysis

#### 2.3.1 Descriptive Statistics

[What summaries you computed]

#### 2.3.2 Primary Analysis

[Your main statistical model]

#### 2.3.3 Assumptions and Diagnostics

[How you checked assumptions]

#### 2.3.4 Missing Data

[How you handled missing data]

#### 2.3.5 Sensitivity Analyses

[Alternative specifications you tried]

#### 2.3.6 Software

[What you used for computations]
```

### Variation by Field

#### Psychology / Social Sciences

- More emphasis on measures (reliability, validity)
- Detailed participant demographics
- Often uses APA 7th edition style

#### Biostatistics / Epidemiology

- Emphasis on study design (cohort, case-control, RCT)
- Clear definition of exposure and outcome
- Adjustment for confounding

#### Statistics / Machine Learning

- Focus on methodology and algorithms
- Simulation study details
- Computational complexity

### Using Scholar to Generate Structure

```bash
/research:manuscript:methods "stress depression mediation study" --outline-only
```

**Scholar will generate:**

```markdown
## Recommended Structure for Mediation Study

### Data and Study Design
- Participants and recruitment
- Measures and instruments
- Sample size justification

### Statistical Model
- Mediation framework
- Model equations
- Parameter definitions

### Estimation Procedure
- Bootstrap methodology
- Confidence interval construction
- Algorithm details

### Assumptions
- Causal assumptions (no unmeasured confounding)
- Statistical assumptions (linearity, homoscedasticity)
- Diagnostics performed

### Software Implementation
- R version and packages
- Random seed
- Reproducibility statement

### Sensitivity Analyses
- Alternative specifications
- Robustness checks
```

### Choose Your Target Journal's Style

```bash
# Check journal requirements
/research:journal:requirements "Journal of the American Statistical Association"

# Returns:
# - Methods section location (after intro or in supplement?)
# - Typical length (words or pages)
# - Equation numbering style
# - Reference style for software
# - Supplementary materials policy
```

### ✅ Checkpoint 2

- [ ] You have a clear structure outline
- [ ] Structure matches your journal's requirements
- [ ] All necessary subsections are included
- [ ] Order is logical (general → specific)

---

## Step 3: Draft with Scholar (Simple Example) ⏱️ 15 minutes

### What You'll Do

Start with a simple example to learn the command, then move to your actual analysis.

### Simple Example: t-test

**Research question:** Do male and female students differ in exam scores?

**Command:**

```bash
/research:manuscript:methods "independent samples t-test comparing exam scores by gender"
```

**Scholar will ask:**

```
I'll help you write a methods section for an independent samples t-test.

Can you provide:
1. Sample sizes for each group?
2. What assumptions did you check?
3. What software did you use?
4. Two-tailed or one-tailed test?
5. Significance level?
```

**Your responses:**

```
1. n = 150 males, 200 females
2. Checked normality (Shapiro-Wilk) and homogeneity of variance (Levene's test)
3. R 4.3.2, base stats package
4. Two-tailed
5. α = 0.05
```

**Scholar generates:**

```markdown
### Statistical Analysis

We compared exam scores between male (n = 150) and female (n = 200) students
using an independent samples t-test. Prior to analysis, we evaluated
assumptions of normality and homogeneity of variance. Normality was assessed
using Shapiro-Wilk tests for each group (males: W = 0.98, p = .13; females:
W = 0.99, p = .28), indicating no substantial departures from normality.
Homogeneity of variance was evaluated using Levene's test (F(1, 348) = 2.14,
p = .14), suggesting the equal variance assumption was tenable.

The test statistic is defined as:

$$
t = \frac{\bar{X}_M - \bar{X}_F}{\sqrt{s_p^2(1/n_M + 1/n_F)}}
$$

where $\bar{X}_M$ and $\bar{X}_F$ are the sample means for males and females,
respectively, $n_M$ and $n_F$ are the sample sizes, and $s_p^2$ is the pooled
variance estimate:

$$
s_p^2 = \frac{(n_M - 1)s_M^2 + (n_F - 1)s_F^2}{n_M + n_F - 2}
$$

Under the null hypothesis of equal population means, the test statistic
follows a t-distribution with $n_M + n_F - 2$ degrees of freedom. We used a
two-tailed test with significance level $\alpha = 0.05$.

All analyses were conducted in R version 4.3.2 (R Core Team, 2023) using the
base stats package. Analysis code is available at [GitHub repository link].
```

### What Scholar Did Well

- ✅ Reported assumption checks with test statistics
- ✅ Defined the test statistic mathematically
- ✅ Explained the null distribution
- ✅ Specified two-tailed test and alpha level
- ✅ Included software citation
- ✅ Mentioned reproducibility

### What You Should Add

Based on your specific context:

```markdown
### Statistical Analysis

**[Keep Scholar's generated content]**

We computed 95% confidence intervals for the mean difference using the
classical t-distribution approach. We also calculated Cohen's d as a
standardized effect size measure to quantify the magnitude of the difference.
Effect sizes were interpreted using Cohen's guidelines: |d| < 0.2 (negligible),
0.2-0.5 (small), 0.5-0.8 (medium), and > 0.8 (large).

Given the unequal sample sizes, we verified results using Welch's t-test,
which does not assume equal variances, as a sensitivity analysis.
```

### Try It Now: Your Turn

Use Scholar for your analysis:

```bash
/research:manuscript:methods "[YOUR ANALYSIS HERE]"

# Examples:
/research:manuscript:methods "linear regression with multiple predictors"
/research:manuscript:methods "mixed effects model with random intercepts"
/research:manuscript:methods "logistic regression for binary outcome"
/research:manuscript:methods "survival analysis with Cox proportional hazards"
```

### ✅ Checkpoint 3

- [ ] Scholar generated a methods draft
- [ ] Draft includes mathematical notation
- [ ] Assumptions are mentioned
- [ ] Software is cited
- [ ] You understand the generated content
- [ ] You know what to customize

**Troubleshooting:**

- **Too generic**: Provide more details in your prompt
- **Wrong method**: Be more specific about the exact statistical approach
- **Missing details**: Use follow-up commands to add specifics
- **Too technical**: Ask Scholar to simplify for broader audience

---

## Step 4: Complex Example with Notation ⏱️ 20 minutes

### What You'll Do

Learn to write methods for more complex analyses with proper statistical notation.

### Example: Bootstrap Mediation Analysis

**Command:**

```bash
/research:manuscript:methods "bootstrap mediation analysis with multiple mediators sleep and exercise"
```

**Scholar asks for details:**

```
I'll help you write a mediation analysis methods section.

Please provide:
1. What is your exposure (X)?
2. What are your mediators (M)?
3. What is your outcome (Y)?
4. What covariates are you adjusting for?
5. How many bootstrap replicates?
6. What confidence interval method (percentile, BCa, studentized)?
7. What assumptions are you willing to make?
```

**Your responses:**

```
1. Exposure: Perceived stress (continuous, PSS-10 scale)
2. Mediators: Sleep duration (hours) and exercise frequency (days/week)
3. Outcome: Depression symptoms (PHQ-9)
4. Covariates: Age, sex, year in school
5. Bootstrap replicates: 5,000
6. CI method: Percentile
7. Assumptions: Sequential ignorability (no unmeasured confounding)
```

**Scholar generates (excerpt):**

```markdown
### Statistical Analysis

#### Causal Mediation Analysis

We used causal mediation analysis to estimate the extent to which sleep
duration and exercise frequency mediate the relationship between perceived
stress and depression symptoms. This approach, based on the potential
outcomes framework (Imai et al., 2010), decomposes the total effect of
stress on depression into direct and indirect components.

**Notation and Estimands**

Let $X$ denote perceived stress (PSS-10 score), $M = (M_1, M_2)$ denote the
mediators (sleep duration $M_1$ and exercise frequency $M_2$), and $Y$ denote
depression symptoms (PHQ-9 score). Let $\mathbf{C}$ represent the vector of
covariates (age, sex, year in school).

We estimate three causal quantities:

1. **Total Effect (TE)**: The overall effect of stress on depression,
   $$\text{TE}(x, x') = E[Y(x, M(x))] - E[Y(x', M(x'))]$$
   comparing stress levels $x$ and $x'$ (e.g., 75th vs 25th percentile).

2. **Natural Direct Effect (NDE)**: The effect of stress on depression not
   mediated through sleep or exercise,
   $$\text{NDE}(x, x') = E[Y(x, M(x'))] - E[Y(x', M(x'))]$$

3. **Natural Indirect Effect (NIE)**: The effect of stress on depression
   operating through the mediators,
   $$\text{NIE}(x, x') = E[Y(x, M(x))] - E[Y(x, M(x'))]$$

The total effect decomposes as $\text{TE} = \text{NDE} + \text{NIE}$.

**Statistical Models**

We estimated the mediation effects using a two-stage regression approach.

*Mediator models:*
$$M_1 = \alpha_1 + \beta_1 X + \gamma_1^T \mathbf{C} + \epsilon_1$$
$$M_2 = \alpha_2 + \beta_2 X + \gamma_2^T \mathbf{C} + \epsilon_2$$

*Outcome model:*
$$Y = \alpha_3 + \beta_3 X + \theta_1 M_1 + \theta_2 M_2 + \gamma_3^T \mathbf{C} + \epsilon_3$$

where $\epsilon_1, \epsilon_2, \epsilon_3$ are error terms assumed independent
and normally distributed.

**Causal Identification**

Identification of causal mediation effects requires the sequential ignorability
assumption (Imai et al., 2010):

1. No unmeasured confounding of the stress-mediator relationships,
   conditional on covariates $\mathbf{C}$

2. No unmeasured confounding of the mediator-depression relationships,
   conditional on stress and covariates

3. No mediator-outcome confounders affected by stress

While these assumptions are untestable, we argue they are plausible given our
adjustment for age, sex, and year in school, which are likely common causes
of all variables in the model.

**Bootstrap Estimation**

We estimated confidence intervals for the direct and indirect effects using
the nonparametric bootstrap (Efron & Tibshirani, 1993). The bootstrap procedure
consisted of the following steps:

1. Draw a bootstrap sample of size $n = 343$ with replacement from the
   original data

2. Fit the three regression models (two mediator models, one outcome model)
   to the bootstrap sample

3. Compute $\widehat{\text{NIE}}^b$ and $\widehat{\text{NDE}}^b$ using the
   fitted models and averaging over the empirical distribution of covariates

4. Repeat steps 1-3 for $B = 5{,}000$ bootstrap replicates

We constructed 95% confidence intervals using the percentile method: the 2.5th
and 97.5th percentiles of the bootstrap distribution. This approach does not
assume normality of the sampling distribution and has been shown to have good
coverage properties for mediation effects (MacKinnon et al., 2004).

**Software Implementation**

All analyses were conducted in R version 4.3.2 (R Core Team, 2023). Mediation
effects were estimated using the mediation package version 4.5.0 (Tingley et al.,
2014) with the following key function call:

```r
mediate(model.m1, model.y, treat = "stress", mediator = "sleep",
        boot = TRUE, sims = 5000, seed = 20250201)
```

Random seeds were set for reproducibility (seed = 20250201). Complete analysis
code is available at https://github.com/username/stress-mediation.

**References**

Efron, B., & Tibshirani, R. J. (1993). *An Introduction to the Bootstrap*.
Chapman & Hall/CRC.

Imai, K., Keele, L., & Tingley, D. (2010). A general approach to causal
mediation analysis. *Psychological Methods*, 15(4), 309-334.

MacKinnon, D. P., Lockwood, C. M., & Williams, J. (2004). Confidence limits
for the indirect effect: Distribution of the product and resampling methods.
*Multivariate Behavioral Research*, 39(1), 99-128.

Tingley, D., Yamamoto, T., Hirose, K., Keele, L., & Imai, K. (2014).
mediation: R package for causal mediation analysis. *Journal of Statistical
Software*, 59(5), 1-38.
```

### What Makes This Excellent

1. **Clear notation**: Variables defined with mathematical symbols
2. **Estimand definitions**: Precise mathematical expressions for what you're estimating
3. **Model specification**: Equations for all models
4. **Assumptions explicit**: Causal assumptions stated and justified
5. **Algorithm details**: Step-by-step bootstrap procedure
6. **Reproducible**: Software versions, packages, random seed, code link
7. **Proper citations**: Methods papers and software packages cited

### Customize for Your Analysis

Add these elements based on your specific study:

```markdown
**Assumption Diagnostics**

We evaluated the linear relationships assumption by inspecting residual plots
for each model. No substantial departures from linearity were evident. We
assessed homoscedasticity using Breusch-Pagan tests, which indicated no
significant heteroscedasticity (all p > .10).

**Sensitivity to Unmeasured Confounding**

To assess robustness to potential unmeasured confounding, we computed
sensitivity parameters following Imai et al. (2010). These parameters quantify
how strong unmeasured confounding would need to be to reduce the indirect
effect to zero. Results indicated that confounding would need to explain at
least 20% of residual variance in both mediators and outcome to nullify the
effect, suggesting robustness to moderate confounding.

**Missing Data**

Missing data were minimal (2% for sleep, 1% for exercise, 0% for other
variables). We used listwise deletion, resulting in a final sample of n = 343
(98% of original sample). Given the low rate and random pattern of missingness
(assessed via Little's MCAR test: χ² = 12.4, df = 15, p = .65), bias from
deletion is expected to be negligible.
```

### ✅ Checkpoint 4

- [ ] Mathematical notation is clear and consistent
- [ ] All estimands are precisely defined
- [ ] Model equations are complete
- [ ] Assumptions are stated and justified
- [ ] Algorithm/procedure is described step-by-step
- [ ] Software details enable reproduction
- [ ] Citations support all methods claims

---

## Step 5: Add Reproducibility Details ⏱️ 10 minutes

### What You'll Do

Modern statistical practice requires complete reproducibility information. Add these details to your methods section.

### Essential Reproducibility Elements

#### 1. Software Versions

```markdown
### Computational Environment

All analyses were conducted in R version 4.3.2 (R Core Team, 2023) running
on macOS 14.2. Key packages included:

- mediation v4.5.0 (Tingley et al., 2014) - mediation analysis
- tidyverse v2.0.0 (Wickham et al., 2019) - data manipulation
- ggplot2 v3.4.4 (Wickham, 2016) - visualization
- lavaan v0.6-17 (Rosseel, 2012) - structural equation models

A complete list of package versions is available in the supplementary
materials (Table S1).
```

#### 2. Random Seeds

```markdown
### Reproducibility

For all procedures involving random number generation (bootstrap resampling,
permutation tests), we set the random seed to 20250201 to ensure
reproducibility. The seed value was chosen as the date of analysis (YYYYMMDD).
```

#### 3. Code Availability

**Option A: Public Repository (Best)**

```markdown
### Data and Code Availability

Complete analysis code is publicly available at
https://github.com/username/stress-mediation. The repository includes:

- Data cleaning scripts (01-clean-data.R)
- Main analysis (02-mediation-analysis.R)
- Sensitivity analyses (03-sensitivity.R)
- Figure generation (04-figures.R)
- R Markdown manuscript (manuscript.Rmd)

The repository uses the renv package for dependency management, ensuring all
package versions are locked and reproducible.
```

**Option B: Supplementary Materials**

```markdown
### Data and Code Availability

Complete R code for all analyses is provided in Supplementary File S1
(analysis-code.R). The code includes inline comments explaining each step
and can be executed to reproduce all reported results.
```

**Option C: Available Upon Request (Acceptable, but discouraged)**

```markdown
### Data and Code Availability

Data cannot be publicly shared due to IRB restrictions, but are available
from the corresponding author upon reasonable request with appropriate
data use agreements. Analysis code is available upon request.
```

#### 4. Data Availability

```markdown
### Data Sharing

De-identified participant data are publicly available at the Open Science
Framework (https://osf.io/a1b2c/) under a CC-BY 4.0 license. Data include
all variables used in analyses and a codebook describing variable names,
types, and value labels.

[OR, if data restricted:]

De-identified participant data are available to researchers who meet criteria
for access to confidential data. Requests should be directed to the
corresponding author and require approval from the Institutional Review Board.
```

#### 5. Computational Time (for complex methods)

```markdown
### Computational Considerations

The bootstrap procedure with 5,000 replicates required approximately 8 minutes
on a 2020 MacBook Pro with M1 chip and 16GB RAM. For researchers with limited
computational resources, we found that 1,000 replicates provided nearly
identical confidence intervals (differing by < 0.01 in width), requiring
only 1.5 minutes.
```

### Pre-Registration (if applicable)

```markdown
### Pre-Registration

This study was pre-registered on the Open Science Framework prior to data
analysis (https://osf.io/x1y2z/, registered 2024-12-01). Pre-registered
analyses included the mediation model with sleep and exercise as mediators
and all specified covariates. Sensitivity analyses examining alternative
model specifications were exploratory and not pre-registered.

[OR:]

This study used archival data collected for other purposes and was not
pre-registered. All analyses reported here should be considered exploratory.
```

### Using Scholar to Generate Reproducibility Section

```bash
/research:manuscript:reproducibility --software R --packages "mediation, tidyverse" --seed 20250201 --github "username/repo"
```

**Scholar generates:**

```markdown
### Reproducibility and Open Science

To ensure computational reproducibility, we:

1. **Version control**: Managed all code using Git with commits tagged for
   each manuscript version

2. **Dependency management**: Used renv to lock package versions

3. **Random seeds**: Set seed = 20250201 for all random procedures

4. **Code sharing**: Published complete code at https://github.com/username/repo

5. **Data sharing**: De-identified data available at OSF [link]

6. **Documentation**: Provided README with step-by-step instructions

This study adheres to TIER Protocol 4.0 standards for computational
reproducibility (TIER, 2022).
```

### ✅ Checkpoint 5

- [ ] Software versions specified
- [ ] Random seeds reported
- [ ] Code availability stated clearly
- [ ] Data availability/restrictions noted
- [ ] Reproducibility standard met (TIER, TOP, etc.)

**Common Mistakes:**

- Saying "latest version of R" (too vague)
- Omitting package versions
- No code sharing plan
- Unclear data access policy

---

## Step 6: Format for Your Journal ⏱️ 15 minutes

### What You'll Do

Adapt your methods section to match your target journal's style requirements.

### APA Style (Psychology Journals)

**Characteristics:**
- Methods after Introduction
- Participants subsection first
- Measures described in detail
- "Data analysis" or "Statistical analysis" subsection last
- Past tense for procedures, present tense for current standards

**Example structure:**

```markdown
## Method

### Participants

We recruited 350 undergraduate students (62% female, 38% male) from
Introduction to Psychology courses at [University]. Ages ranged from 18 to
24 years (M = 19.8, SD = 1.4)...

### Measures

**Perceived Stress Scale (PSS-10).** We assessed perceived stress using the
PSS-10 (Cohen & Williamson, 1988), a 10-item self-report questionnaire...

**Sleep Duration.** Participants reported typical sleep duration by
responding to the question...

**Patient Health Questionnaire (PHQ-9).** Depression symptoms were measured...

### Procedure

Participants completed all measures online via Qualtrics...

### Data Analysis

We used causal mediation analysis...
```

### Biostatistics / Epidemiology Style

**Characteristics:**
- Methods after Introduction or in Supplement
- Study design emphasized
- Clear exposure/outcome definitions
- Adjustment variables justified
- Present tense for general methods, past tense for what you did

**Example structure:**

```markdown
## Methods

### Study Population and Design

This cross-sectional study recruited undergraduate students...

### Exposure, Mediators, and Outcome

The exposure was perceived stress, assessed using... Potential mediators
included sleep duration and exercise frequency... The outcome was depression
symptoms, measured with...

### Covariates

We adjusted for age, sex, and year in school based on their established
associations with both stress and depression in prior literature (citations).

### Statistical Analysis

We used causal mediation analysis to quantify direct and indirect effects...
```

### Journal of the American Statistical Association (JASA)

**Characteristics:**
- Methods can be extensive (main text or supplement)
- Heavy emphasis on statistical methodology
- Mathematical notation expected
- Simulation studies often included
- "Application" section separate from methods

**Example structure:**

```markdown
## Methodology

### 3.1 Causal Mediation Framework

Let $X, M, Y$ denote exposure, mediator, and outcome...

### 3.2 Identification

Under the sequential ignorability assumption...

### 3.3 Estimation

We estimate mediation effects via a two-stage approach...

### 3.4 Bootstrap Inference

Confidence intervals are constructed via...

### 3.5 Implementation

The estimator is implemented in the mediation R package...

## Application to Stress and Depression Data

### 4.1 Data Description

We applied the proposed method to data from...
```

### Nature / Science Short Format

**Characteristics:**
- Extremely brief methods in main text (200-400 words)
- Detailed methods in supplement
- Focus on what's essential for interpretation
- Present tense

**Main text:**

```markdown
We analyzed data from 350 undergraduate students using causal mediation
analysis with bootstrap confidence intervals (5,000 replicates). The analysis
quantified how much of the stress-depression relationship operates through
sleep duration and exercise frequency. We controlled for age, sex, and year
in school. Detailed methods are in Supplementary Methods.
```

**Supplementary Methods (detailed):**

```markdown
## Supplementary Methods

### Study Design and Participants

[Full details]

### Statistical Analysis

[Complete methods with equations, assumptions, etc.]
```

### Using Scholar for Formatting

```bash
# Format for specific journal
/research:manuscript:methods --format "APA 7th edition"
/research:manuscript:methods --format "Biostatistics journal"
/research:manuscript:methods --format "JASA"
/research:manuscript:methods --format "Nature brief"

# Scholar adapts:
# - Section headers
# - Verb tense
# - Level of mathematical detail
# - Citation style
# - Length (brief vs. detailed)
```

### ✅ Checkpoint 6

- [ ] Format matches journal requirements
- [ ] Section headers follow journal style
- [ ] Length is appropriate (word count)
- [ ] Mathematical notation level is right
- [ ] Citation style is correct
- [ ] Tone and tense are appropriate

---

## Step 7: Common Mistakes and How to Avoid Them ⏱️ 10 minutes

### What You'll Do

Learn the most frequent methods section mistakes and how Scholar helps you avoid them.

### Mistake 1: Vague Procedure Descriptions

**Bad Example:**

> "We used bootstrap methods to compute confidence intervals."

**What's Wrong:**
- How many bootstrap replicates?
- What CI method (percentile, BCa, studentized)?
- What was the random seed?

**Good Example:**

> "We computed 95% confidence intervals using the nonparametric percentile
> bootstrap with B = 5,000 replicates (random seed = 20250201)."

**Scholar Check:**

```bash
/research:validate methods-draft.md --check-specificity

# Returns:
# Warning: "bootstrap methods" is vague. Specify:
#   - Number of replicates
#   - CI method
#   - Random seed
```

### Mistake 2: Missing Software Citations

**Bad Example:**

> "All analyses were conducted in R."

**What's Wrong:**
- R version not specified
- Packages not cited
- Methods papers not referenced

**Good Example:**

> "All analyses were conducted in R version 4.3.2 (R Core Team, 2023) using
> the mediation package version 4.5.0 (Tingley et al., 2014). The mediation
> approach follows Imai et al. (2010)."

**Scholar automatically adds proper citations:**

```bash
/research:manuscript:methods --auto-cite
```

### Mistake 3: Assumptions Not Stated

**Bad Example:**

> "We used linear regression to examine the relationship between stress and
> depression."

**What's Wrong:**
- Linearity assumed but not stated
- Other assumptions (homoscedasticity, normality) not mentioned
- No diagnostics reported

**Good Example:**

> "We used linear regression to examine the relationship between stress and
> depression. This approach assumes a linear relationship between predictor
> and outcome, homoscedasticity, and normally distributed errors. We evaluated
> linearity via residual plots and homoscedasticity via Breusch-Pagan test
> (p = .32). Residuals were approximately normally distributed (Shapiro-Wilk
> W = 0.99, p = .18)."

**Scholar reminds you:**

```bash
/research:manuscript:methods "linear regression"

# Scholar includes:
# - Standard assumptions section
# - Common diagnostic tests
# - How to report results
```

### Mistake 4: Inconsistent Notation

**Bad Example:**

Throughout the text:
- "X is stress" (page 5)
- "T denotes stress" (page 7)
- "S represents stress" (page 9)

**What's Wrong:**
- Confusing for readers
- Suggests carelessness

**Good Example:**

Define notation once, use consistently:
- "Let X denote stress" (first mention)
- Use X throughout

**Scholar helps:**

```bash
/research:manuscript:check-notation methods.tex

# Returns:
# Found inconsistent notation:
#   - X, T, S all used for stress
#   - M, Med used for mediator
# Recommendation: standardize on X and M
```

### Mistake 5: Missing Justification for Decisions

**Bad Example:**

> "We controlled for age and sex."

**What's Wrong:**
- Why these covariates?
- Why not others?

**Good Example:**

> "We controlled for age and sex as they are established confounders of the
> stress-depression relationship (Smith et al., 2018; Jones & Lee, 2020) and
> were available in our dataset."

### Mistake 6: No Sample Size Justification

**Bad Example:**

> "We recruited 150 participants."

**What's Wrong:**
- Why 150?
- Was this planned?
- Is it adequate?

**Good Example:**

> "An a priori power analysis indicated n = 150 would provide 80% power to
> detect a mediation effect of δ = 0.20 at α = 0.05, based on expected effect
> sizes from prior research (Cohen, 2017). We recruited 150 participants to
> meet this target."

**OR (for archival data):**

> "The dataset included 150 participants. Post-hoc power analysis indicated
> 78% power to detect a mediation effect of δ = 0.20, consistent with effect
> sizes in the literature."

### Mistake 7: Reproducibility Lip Service

**Bad Example:**

> "Code is available upon request."

**What's Wrong:**
- Vague, often unfulfilled
- No version control mentioned
- Doesn't actually enable reproduction

**Good Example:**

> "Complete analysis code is archived at https://github.com/user/repo (DOI:
> 10.5281/zenodo.1234567) with version-locked dependencies via renv.
> README.md provides step-by-step reproduction instructions."

### Using Scholar's Quality Checks

```bash
# Comprehensive methods check
/research:manuscript:validate methods.md --check-all

# Specific checks
/research:manuscript:validate methods.md --check specificity
/research:manuscript:validate methods.md --check citations
/research:manuscript:validate methods.md --check assumptions
/research:manuscript:validate methods.md --check notation
/research:manuscript:validate methods.md --check reproducibility

# Returns:
# ✅ PASS: Software versions specified
# ⚠️  WARNING: Bootstrap replicates not specified
# ❌ FAIL: No random seed provided
# ✅ PASS: Assumptions stated
# ⚠️  WARNING: Assumption diagnostics not reported
```

### ✅ Checkpoint 7

- [ ] All procedures are specific (not vague)
- [ ] Software and packages are cited
- [ ] Assumptions are explicitly stated
- [ ] Notation is consistent throughout
- [ ] Decisions are justified
- [ ] Sample size is explained
- [ ] Reproducibility is concrete

---

## Step 8: Integration with Reproducible Workflows ⏱️ 15 minutes

### What You'll Do

Connect your methods section to actual analysis code for true reproducibility.

### The Ideal Workflow

```
analysis.R → methods.Rmd → manuscript.pdf
   ↑              ↓
   └──────────────┘
   (automatic sync)
```

### Using R Markdown for Methods

**File:** `methods.Rmd`

```markdown
---
title: "Statistical Methods"
output: pdf_document
---

## Data Analysis

We analyzed data from `r nrow(data)` participants using causal mediation
analysis. The mediation model estimated effects of stress (M = `r mean(data$stress)`,
SD = `r sd(data$stress)`) on depression symptoms (M = `r mean(data$depression)`,
SD = `r sd(data$depression)`) operating through sleep duration and exercise
frequency.

We used bootstrap resampling with `r boot_reps` replicates. The random seed
was set to `r seed_value` for reproducibility.

```{r estimation}
# Bootstrap mediation
set.seed(seed_value)
med_results <- mediate(
  model.m = lm(sleep ~ stress + age + sex, data = data),
  model.y = lm(depression ~ stress + sleep + exercise + age + sex, data = data),
  treat = "stress",
  mediator = "sleep",
  boot = TRUE,
  sims = boot_reps
)

# Extract effects
nie <- med_results$d.avg
nde <- med_results$z.avg
```

The natural indirect effect was `r round(nie, 2)` (95% CI: [`r round(med_results$d.avg.ci[1], 2)`,
`r round(med_results$d.avg.ci[2], 2)`]).

**Software Implementation**

All analyses were conducted in R version `r R.version.string` using:

- mediation package v`r packageVersion("mediation")`
- tidyverse v`r packageVersion("tidyverse")`

## Reproducibility

Complete code is available at https://github.com/username/stress-mediation
(DOI: 10.5281/zenodo.1234567).
```

**Benefits:**
- Numbers automatically update when data changes
- Impossible to have typos in sample size, means, etc.
- Software versions auto-populated
- True computational reproducibility

### Using Scholar with R Markdown

```bash
# Generate methods template
/research:manuscript:methods "bootstrap mediation" --format rmarkdown

# Scholar creates methods.Rmd with:
# - Inline R code chunks
# - Automatic value extraction
# - Version reporting
# - Proper citations
```

### Quarto Alternative (Modern)

**File:** `methods.qmd`

```markdown
---
title: "Statistical Methods"
format: pdf
---

## Statistical Analysis

```{r}
#| label: setup
#| include: false
library(mediation)
library(tidyverse)
source("01-load-data.R")
```

We analyzed data from `{r} nrow(data)` participants...

[Same as R Markdown but with Quarto syntax]
```

**Advantages over R Markdown:**
- Cleaner syntax
- Better error messages
- Multiple output formats (PDF, HTML, Word)
- Better cross-referencing

### Version Control for Methods

```bash
# Track changes to methods section
git add methods.Rmd
git commit -m "Add bootstrap procedure description"

git add methods.Rmd
git commit -m "Add sensitivity analysis to methods"

# See what changed between versions
git diff v1.0..v2.0 methods.Rmd

# Tag submitted versions
git tag -a submission-v1 -m "Initial submission 2024-12-01"
git tag -a revision-v1 -m "Revision submitted 2025-01-15"
```

### Pre-Commit Hooks for Quality

**File:** `.git/hooks/pre-commit`

```bash
#!/bin/bash

# Check that methods section includes required elements
/research:manuscript:validate methods.md --check-all

# If validation fails, prevent commit
if [ $? -ne 0 ]; then
  echo "❌ Methods validation failed. Fix issues before committing."
  exit 1
fi

echo "✅ Methods validation passed"
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

Now every commit validates your methods section.

### Continuous Integration (Advanced)

**File:** `.github/workflows/check-methods.yml`

```yaml
name: Check Methods Section

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Scholar
        run: npm install -g @data-wise/scholar
      - name: Validate methods
        run: scholar validate methods.md --check-all
      - name: Check reproducibility
        run: |
          Rscript -e "rmarkdown::render('methods.Rmd')"
          # Ensures methods.Rmd compiles without errors
```

**Benefits:**
- Automatic validation on every push
- Catches errors before submission
- Ensures reproducibility

### ✅ Checkpoint 8

- [ ] Methods integrated with analysis code
- [ ] Using R Markdown or Quarto for dynamic documents
- [ ] Version control tracks methods changes
- [ ] Validation checks in place
- [ ] CI/CD pipeline (optional but recommended)

---

## Complete Example: Putting It All Together ⏱️ 15 minutes

### Scenario

You're writing methods for a paper on mediation analysis with bootstrap inference.

### Step-by-Step Complete Workflow

#### 1. Summarize Analysis

```markdown
# Analysis Summary

**Question:** Does sleep mediate stress → depression?
**Design:** Cross-sectional survey
**N:** 350 undergraduates
**Method:** Bootstrap mediation (5,000 reps)
**Software:** R 4.3.2, mediation 4.5.0
```

#### 2. Generate Initial Draft with Scholar

```bash
/research:manuscript:methods "bootstrap mediation analysis stress sleep depression"
```

**Scholar generates 800-word draft with:**
- Mathematical notation
- Model specification
- Bootstrap algorithm
- Assumptions
- Software details

#### 3. Customize with Your Details

```markdown
[Add to Scholar's draft:]

**Participants**

We recruited 350 undergraduate students (62% female) from Introduction to
Psychology courses at State University. Ages ranged from 18-24 (M = 19.8,
SD = 1.4).

**Measures**

[Detailed measure descriptions]

**Sensitivity Analysis**

We assessed sensitivity to unmeasured confounding using ρ-sensitivity
parameters (Imai et al., 2010). Results indicated confounding would need
to explain ≥20% of residual variance to nullify effects.
```

#### 4. Add Reproducibility Details

```markdown
**Reproducibility**

Complete analysis code: https://github.com/user/stress-mediation
Random seed: 20250201
R version: 4.3.2
Package versions: See Supplementary Table S1
```

#### 5. Validate

```bash
/research:manuscript:validate methods.md --check-all

# Results:
# ✅ Software specified
# ✅ Assumptions stated
# ✅ Random seed provided
# ⚠️  Consider adding sample size justification
```

#### 6. Address Validation Warnings

```markdown
**Sample Size**

An a priori power analysis indicated n = 350 provides >95% power to detect
indirect effects of δ = 0.15 (medium effect size) at α = 0.05.
```

#### 7. Format for Journal

```bash
/research:manuscript:methods methods.md --format "Psychological Science"

# Scholar reformats to match journal style:
# - Adds "Method" header
# - Reorders sections (Participants, Measures, Data Analysis)
# - Adjusts tone and tense
# - Shortens for length requirements
```

#### 8. Generate PDF

```bash
pandoc methods.md -o methods.pdf --template psych-science-template.tex
```

#### 9. Integrate into Manuscript

Copy the methods section into your full manuscript, ensuring:
- Citation format matches
- Equation numbering is consistent
- Cross-references work
- Supplementary materials are linked

#### 10. Final Check

```bash
/research:manuscript:validate full-manuscript.pdf --section methods

# ✅ All checks passed
# Ready for submission
```

### The Complete Methods Section (Final Product)

**File:** `complete-methods-example.md`

```markdown
## Method

### Participants

We recruited 350 undergraduate students (218 female, 132 male) from
Introduction to Psychology courses at State University during Fall 2024.
Participants ranged in age from 18 to 24 years (M = 19.8, SD = 1.4) and
included students from all four undergraduate years. The study was approved
by the Institutional Review Board, and all participants provided informed
consent. Participants received course credit for participation.

### Measures

**Perceived Stress Scale (PSS-10).** We assessed perceived stress using the
PSS-10 (Cohen & Williamson, 1988), a widely used 10-item self-report measure.
Items (e.g., "How often have you felt nervous or stressed?") are rated on a
5-point scale (0 = never, 4 = very often). Scores range from 0-40, with
higher scores indicating greater perceived stress. Internal consistency was
excellent (α = .89).

**Sleep Duration.** Participants reported typical sleep duration on weeknights
by responding to: "On average, how many hours of sleep do you get per night
during the week?" Responses were continuous (range: 3-10 hours).

**Exercise Frequency.** Participants indicated how many days per week they
engaged in moderate-to-vigorous physical activity for at least 30 minutes.
Responses ranged from 0-7 days.

**Patient Health Questionnaire (PHQ-9).** We assessed depression symptoms
using the PHQ-9 (Kroenke et al., 2001), a 9-item self-report measure based
on DSM-5 criteria for major depression. Items are rated on a 4-point scale
(0 = not at all, 3 = nearly every day). Scores range from 0-27, with scores
≥10 indicating moderate-to-severe depression. Internal consistency was good
(α = .87).

**Covariates.** We collected demographic information including age (continuous),
sex (male/female), and year in school (freshman, sophomore, junior, senior).

### Procedure

Participants completed all measures online via Qualtrics. The survey took
approximately 15 minutes. Measures were presented in randomized order to
control for order effects.

### Data Analysis

#### Preliminary Analyses

We examined data for missingness, outliers, and normality. Missing data were
minimal (2% for sleep, 1% for exercise, 0% for other variables). Little's
MCAR test indicated data were missing completely at random (χ² = 12.4, df = 15,
p = .65), so we used listwise deletion, resulting in n = 343 (98% of sample).
We inspected univariate distributions and found no extreme outliers (all
values within 3 SD of the mean).

#### Causal Mediation Analysis

We used causal mediation analysis to estimate the extent to which sleep
duration mediates the relationship between perceived stress and depression
symptoms. This approach, grounded in the potential outcomes framework
(Imai et al., 2010), decomposes the total effect of stress on depression
into direct and indirect components.

**Notation and Estimands.** Let X denote perceived stress (PSS-10 score),
M denote the mediator (sleep duration), Y denote depression symptoms (PHQ-9
score), and C represent covariates (age, sex, year in school). We estimated:

1. **Total Effect (TE)**: The overall effect of stress on depression,
   comparing high stress (75th percentile) to low stress (25th percentile)

2. **Natural Direct Effect (NDE)**: The effect of stress on depression not
   mediated through sleep

3. **Natural Indirect Effect (NIE)**: The effect of stress on depression
   operating through sleep

The proportion mediated is calculated as NIE / TE.

**Statistical Models.** We estimated mediation effects using a regression
framework. The mediator model regressed sleep on stress and covariates:

$$M = \alpha_1 + \beta_1 X + \gamma_1^T \mathbf{C} + \epsilon_1$$

The outcome model regressed depression on stress, sleep, and covariates:

$$Y = \alpha_2 + \beta_2 X + \theta M + \gamma_2^T \mathbf{C} + \epsilon_2$$

where ε₁ and ε₂ are error terms assumed independent and normally distributed.

**Causal Assumptions.** Identification of causal mediation effects requires
sequential ignorability (Imai et al., 2010): (1) no unmeasured confounding
of the stress-sleep relationship, (2) no unmeasured confounding of the
sleep-depression relationship, and (3) no sleep-depression confounders
affected by stress. While these assumptions are untestable, we argue they
are plausible given our adjustment for age, sex, and year in school.

**Bootstrap Inference.** We estimated 95% confidence intervals for mediation
effects using the nonparametric bootstrap with B = 5,000 replicates. For
each bootstrap sample (drawn with replacement), we re-estimated the mediation
model and computed NIE and NDE. Confidence intervals were constructed using
the percentile method (2.5th and 97.5th percentiles of the bootstrap
distribution). This approach requires no distributional assumptions and has
good coverage properties for mediation effects (MacKinnon et al., 2004).

**Assumption Diagnostics.** We evaluated the linear relationship assumption
via residual plots, which revealed no substantial departures from linearity.
We assessed homoscedasticity using Breusch-Pagan tests (mediator model:
p = .43; outcome model: p = .31), indicating no significant heteroscedasticity.
Residuals were approximately normally distributed (Shapiro-Wilk tests:
both p > .15).

**Sensitivity Analysis.** To assess robustness to potential unmeasured
confounding, we computed sensitivity parameters following Imai et al. (2010).
These parameters quantify how strong an unmeasured confounder would need to
be to reduce the indirect effect to zero. Results indicated confounding would
need to explain at least 20% of residual variance in both sleep and depression
to nullify the effect, suggesting robustness to moderate unmeasured confounding.

**Software.** All analyses were conducted in R version 4.3.2 (R Core Team,
2023). Mediation effects were estimated using the mediation package version
4.5.0 (Tingley et al., 2014). Random seeds were set to 20250201 for
reproducibility. Complete analysis code is available at
https://github.com/username/stress-mediation.

#### Power Analysis

An a priori power analysis (conducted using the powerMediation R package;
Qiu, 2018) indicated that n = 350 provides >95% power to detect an indirect
effect of δ = 0.15 (medium effect size; Cohen, 1988) at α = 0.05, assuming
moderate correlations among variables (r = .30).
```

**Length:** ~1,200 words
**Equations:** 2 (clearly explained)
**Citations:** 8 (methods and measures)
**Reproducibility:** Excellent (software, seed, code link)
**Assumptions:** All stated and checked
**Style:** APA 7th edition

### ✅ Final Checklist

- [ ] Research question is clear
- [ ] Participants fully described
- [ ] Measures have psychometric properties (α, validity)
- [ ] Procedure is explained
- [ ] Statistical model is specified mathematically
- [ ] Estimands are precisely defined
- [ ] Assumptions are stated and justified
- [ ] Diagnostics are reported
- [ ] Inference method is detailed (bootstrap specifics)
- [ ] Sensitivity analysis included
- [ ] Software and versions specified
- [ ] Reproducibility ensured (seed, code link)
- [ ] Power analysis included
- [ ] All methods have citations
- [ ] Length appropriate for journal
- [ ] Style matches journal requirements

---

## Troubleshooting Common Issues

### Issue 1: Methods section is too long

**Problem:** You have 2,000 words but journal limit is 800.

**Solutions:**

1. **Move details to supplement**
   - Main text: Overview and essential details
   - Supplement: Full equations, diagnostics, sensitivity

2. **Use Scholar to condense**
   ```bash
   /research:manuscript:methods methods.md --shorten 800
   ```

3. **Remove redundancy**
   - Don't repeat measure descriptions if in main text
   - Combine similar procedures

**Example condensing:**

**Original (200 words):**
> We used the nonparametric bootstrap to estimate confidence intervals. The
> bootstrap procedure consisted of the following steps: (1) draw a bootstrap
> sample of size n with replacement, (2) fit the mediation model to the
> bootstrap sample, (3) compute the indirect effect, (4) repeat 5,000 times,
> (5) construct 95% confidence intervals using the percentile method by taking
> the 2.5th and 97.5th percentiles of the bootstrap distribution.

**Condensed (50 words):**
> We computed 95% confidence intervals using the nonparametric percentile
> bootstrap with 5,000 replicates. Full algorithmic details are in
> Supplementary Methods.

### Issue 2: Equations are too complex for journal

**Problem:** Journal discourages extensive mathematical notation.

**Solutions:**

1. **Move equations to supplement**
   - Main text: Verbal description
   - Supplement: Full mathematical treatment

2. **Use Scholar to simplify**
   ```bash
   /research:manuscript:methods --simplify-math
   ```

**Example:**

**Original:**
> $$\text{NIE} = \int_{c} \{E[Y(x, M(x), c)] - E[Y(x, M(x'), c)]\} dF(c)$$

**Simplified:**
> The natural indirect effect (NIE) quantifies the extent to which the effect
> of stress on depression operates through sleep, averaging over the
> distribution of covariates.

### Issue 3: Reviewers say methods are unclear

**Problem:** Reviewers ask for clarification of specific procedures.

**Solutions:**

1. **Add step-by-step algorithm**
   ```markdown
   The bootstrap procedure consisted of:
   1. Draw bootstrap sample of size n = 343 with replacement
   2. Fit mediator model: Sleep ~ Stress + Covariates
   3. Fit outcome model: Depression ~ Stress + Sleep + Covariates
   4. Compute NIE and NDE from fitted models
   5. Repeat steps 1-4 for B = 5,000 replicates
   6. Construct 95% CI from 2.5th and 97.5th percentiles
   ```

2. **Add visual diagram**
   ```bash
   /research:diagram mediation-model
   # Generates visual representation of mediation framework
   ```

3. **Expand reproducibility section**
   - Include code snippet in supplement
   - Add worked example with toy data

### Issue 4: Can't find proper citations

**Problem:** You don't know which papers to cite for your method.

**Solutions:**

```bash
# Find methods papers
/research:bib:search "bootstrap mediation confidence intervals"

# Look up package citation
/research:bib:package mediation R

# Find sensitivity analysis papers
/research:bib:search "sensitivity analysis unmeasured confounding mediation"
```

**Scholar returns:**
- Imai et al. (2010) - General mediation approach
- MacKinnon et al. (2004) - Bootstrap CIs for mediation
- Tingley et al. (2014) - mediation package citation
- VanderWeele (2015) - Sensitivity analysis methods

---

## Summary

You've learned how to:

✅ Structure a complete statistical methods section
✅ Write clear descriptions with proper mathematical notation
✅ Explain estimation procedures for reproducibility
✅ State and check statistical assumptions
✅ Use `/research:manuscript:methods` effectively
✅ Progress from simple to complex examples
✅ Format for different journal styles
✅ Integrate with reproducible workflows (R Markdown, Quarto)
✅ Avoid common methods writing mistakes
✅ Validate methods quality systematically

## Next Steps

1. **Practice**: Write methods for a completed analysis
2. **Study examples**: Read methods sections in top journals in your field
3. **Get feedback**: Have advisor or colleague review your draft
4. **Build template**: Save your methods as a template for future papers
5. **Learn advanced topics**:
   - Bayesian methods descriptions
   - Machine learning model documentation
   - Causal inference frameworks
   - Simulation study protocols

## Additional Resources

### Recommended Reading

- [Reporting Standards for Statistical Methods](https://www.apa.org/pubs/journals/resources/statistical-methods)
- [STROBE Guidelines](https://www.strobe-statement.org/) (Observational studies)
- [CONSORT Statement](http://www.consort-statement.org/) (Randomized trials)
- [Wilkinson, L., & Task Force on Statistical Inference. (1999). Statistical methods in psychology journals: Guidelines and explanations. *American Psychologist*, 54(8), 594-604.](https://psycnet.apa.org/doi/10.1037/0003-066X.54.8.594)

### Scholar Documentation

- [Research Commands Reference](../../research/RESEARCH-COMMANDS-REFERENCE.md)
- [Manuscript Writing Tutorial](manuscript-writing.md)
- [Examples: Methods Sections](../../examples/methods-sections.md)
- [Reviewer Response Tutorial](reviewer-response.md)

### Books on Statistical Writing

- Nicol, A. A., & Pexman, P. M. (2010). *Presenting Your Findings: A Practical Guide for Creating Tables* (6th ed.). APA.
- Wilkinson, A. M. (1991). *The Scientist's Handbook for Writing Papers and Dissertations*. Prentice Hall.
- Katz, M. J. (2009). *From Research to Manuscript: A Guide to Scientific Writing* (2nd ed.). Springer.

### Statistical Methods Resources

- [Cross Validated (stats.stackexchange.com)](https://stats.stackexchange.com/) - Q&A for statistics
- [Journal of Statistical Software](https://www.jstatsoft.org/) - Software implementation papers
- [R Journal](https://journal.r-project.org/) - R package methodology

---

**Tutorial created:** 2026-02-01
**Scholar version:** 2.6.0
**Maintainer:** Data-Wise team

**Feedback:** Found an issue or have suggestions? [Open an issue](https://github.com/Data-Wise/scholar/issues)
