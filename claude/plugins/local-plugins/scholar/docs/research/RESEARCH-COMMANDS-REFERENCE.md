# Research Commands Reference

Complete reference for all {{ scholar.research_commands }} research commands organized by category.

## Navigation

- [Overview](#overview)
- [Literature Management](#literature-management) (4 commands)
- [Manuscript Writing](#manuscript-writing) (4 commands)
- [Simulation Studies](#simulation-studies) (2 commands)
- [Research Planning](#research-planning) (4 commands)

### Detailed Guides

For in-depth information on specific command categories:

- **[Literature Commands](LITERATURE-COMMANDS.md)** - Comprehensive guide to literature management
- **[Manuscript Commands](MANUSCRIPT-COMMANDS.md)** - Detailed manuscript writing reference
- **[Simulation Commands](SIMULATION-COMMANDS.md)** - Complete simulation study guide

---

## Overview

Scholar provides {{ scholar.research_commands }} research commands across 4 functional categories:

### 1. Literature Management (4 commands)

Discover, retrieve, and manage academic literature:

- `/research:arxiv` - Search arXiv for statistical papers
- `/research:doi` - Look up paper metadata by DOI
- `/research:bib:search` - Search BibTeX files for entries
- `/research:bib:add` - Add BibTeX entry to bibliography

**Use Cases:**

- Literature reviews
- Reference management
- Citation discovery
- Bibliography building

### 2. Manuscript Writing (4 commands)

Accelerate academic writing with AI assistance:

- `/research:manuscript:methods` - Write methods sections with statistical rigor
- `/research:manuscript:results` - Generate results sections with proper reporting
- `/research:manuscript:reviewer` - Generate responses to reviewer comments
- `/research:manuscript:proof` - Review mathematical proofs for correctness

**Use Cases:**

- Paper drafting
- Peer review responses
- Proof validation
- Statistical reporting

### 3. Simulation Studies (2 commands)

Design and analyze Monte Carlo simulations:

- `/research:simulation:design` - Design Monte Carlo simulation studies
- `/research:simulation:analysis` - Analyze simulation results

**Use Cases:**

- Method comparison
- Performance evaluation
- Sample size planning
- Robustness checks

### 4. Research Planning (4 commands)

Strategic research planning and method selection:

- `/research:lit-gap` - Identify literature gaps
- `/research:hypothesis` - Generate testable hypotheses
- `/research:analysis-plan` - Create statistical analysis plans
- `/research:method-scout` - Scout statistical methods for problems

**Use Cases:**

- Project planning
- Grant proposals
- Study design
- Method selection

---

## Literature Management

### /research:arxiv

Search arXiv for statistical papers.

**Syntax:**

```bash
/research:arxiv "search query"
/research:arxiv "causal mediation analysis"
/research:arxiv "bootstrap confidence intervals"
```

**Features:**

- Full-text search across arXiv stat category
- Returns title, authors, abstract, PDF link
- Date filtering available
- Results sorted by relevance

**Search Tips:**

- Use specific methodological terms: "causal mediation", "bootstrap methods"
- Include statistical keywords: "inference", "estimation", "hypothesis testing"
- Combine concepts: "high-dimensional regression penalization"
- Use author names for targeted searches: "Pearl causal inference"

**Output Format:**

```
Title: [Paper Title]
Authors: [Author List]
arXiv ID: [ID]
Date: [Publication Date]
Abstract: [Abstract Text]
PDF: [Direct PDF Link]
```

**Integration:**

- Copy DOI/arXiv ID for `/research:doi` lookup
- Use PDF links for `/research:bib:add` workflow
- Feed abstracts to `/research:lit-gap` for gap analysis

**Common Workflows:**

1. **Literature Review:**

   ```bash
   /research:arxiv "mediation analysis"
   # Review abstracts
   /research:doi "10.xxxx/xxxxx"  # For papers with DOIs
   /research:bib:add entry.bib references.bib
   ```

2. **Method Discovery:**

   ```bash
   /research:arxiv "high-dimensional mediation"
   /research:method-scout "high-dimensional mediation"
   # Compare arXiv results with method scout suggestions
   ```

**Limitations:**

- Only searches arXiv stat category (stat.*)
- Does not search journal articles directly
- Limited to publicly available preprints
- No full-text PDF parsing (abstracts only)

**Best Practices:**

- Start broad, then narrow searches
- Check publication dates for recent methods
- Cross-reference with journal publications
- Save promising papers immediately to reference manager

---

### /research:doi

Look up paper metadata by DOI.

**Syntax:**

```bash
/research:doi "DOI"
/research:doi "10.1080/01621459.2020.1765785"
/research:doi "10.1093/biostatistics/kxaa030"
```

**Returns:**

- Full citation (APA, Chicago, BibTeX)
- BibTeX entry (ready for bibliography)
- Abstract
- Publication details (journal, volume, pages)
- Authors and affiliations
- Keywords and subject categories

**Output Format:**

```
Citation:
[Full formatted citation]

BibTeX:
@article{key,
  author = {...},
  title = {...},
  journal = {...},
  year = {...},
  doi = {...}
}

Abstract:
[Abstract text]

Publication Details:
Journal: [Journal Name]
Volume: [Volume]
Issue: [Issue]
Pages: [Page Range]
Published: [Date]
```

**DOI Sources:**

- Journal websites (most reliable)
- arXiv papers with published versions
- CrossRef DOI search: https://search.crossref.org/
- Google Scholar (under paper title)

**Integration:**

1. **From arXiv to Bibliography:**

   ```bash
   /research:arxiv "bootstrap mediation"
   # Copy DOI from results
   /research:doi "10.xxxx/xxxxx"
   # Save BibTeX output
   /research:bib:add doi-entry.bib references.bib
   ```

2. **Citation Management:**

   ```bash
   /research:doi "10.xxxx/xxxxx"
   # Copy BibTeX to .bib file
   /research:bib:search "author name" references.bib
   # Verify entry was added
   ```

**Best Practices:**

- Always use DOI when available (more reliable than manual citations)
- Verify BibTeX entries before adding to bibliography
- Check for typos in DOI (common error source)
- Use DOI for permanent links in manuscripts

**Common Issues:**

- **Invalid DOI:** Double-check format (10.xxxx/xxxxx)
- **Access restrictions:** Some DOIs require subscriptions for full text
- **Preprint DOIs:** May differ from published version DOI

---

### /research:bib:search

Search BibTeX files for entries.

**Syntax:**

```bash
/research:bib:search "search term" file.bib
/research:bib:search "Pearl" references.bib
/research:bib:search "mediation" *.bib
/research:bib:search "2020" ~/papers/main.bib
```

**Search Targets:**

- Author names
- Titles
- Years
- Keywords
- Journal names
- BibTeX keys

**Output:**

```
Found 3 matches in references.bib:

@article{pearl2014,
  author = {Pearl, Judea},
  title = {Interpretation and identification of causal mediation},
  ...
}

@book{pearl2009causality,
  author = {Pearl, Judea},
  title = {Causality: Models, Reasoning and Inference},
  ...
}

@article{pearl2012mediation,
  ...
}
```

**Wildcard Patterns:**

- `*.bib` - All .bib files in current directory
- `refs/*.bib` - All .bib files in refs/ directory
- `**/*.bib` - Recursive search in subdirectories

**Use Cases:**

1. **Find Duplicate Entries:**

   ```bash
   /research:bib:search "Pearl 2014" references.bib
   # Check if paper already in bibliography
   ```

2. **Verify Citations:**

   ```bash
   /research:bib:search "pearl2014" manuscript.bib
   # Confirm citation key exists before using in LaTeX
   ```

3. **Organize References:**

   ```bash
   /research:bib:search "mediation" *.bib
   # Collect all mediation papers across files
   ```

**Best Practices:**

- Use unique, descriptive search terms
- Search before adding new entries (avoid duplicates)
- Check multiple .bib files for cross-project references
- Verify BibTeX keys match manuscript citations

**Integration with Zotero:**

```bash
# Export from Zotero to .bib
# Then search exported file
/research:bib:search "bootstrap" zotero-export.bib
```

---

### /research:bib:add

Add BibTeX entry to bibliography.

**Syntax:**

```bash
/research:bib:add entry.bib target.bib
/research:bib:add new-paper.bib references.bib
/research:bib:add doi-entry.bib ~/papers/main.bib
```

**Workflow:**

1. **Get BibTeX entry:**

   ```bash
   /research:doi "10.xxxx/xxxxx"
   # Copy BibTeX output to entry.bib
   ```

2. **Check for duplicates:**

   ```bash
   /research:bib:search "author year" references.bib
   ```

3. **Add to bibliography:**

   ```bash
   /research:bib:add entry.bib references.bib
   ```

**Features:**

- Duplicate detection
- BibTeX syntax validation
- Preserves existing entries
- Alphabetical sorting (optional)

**Safety Checks:**

- Validates BibTeX syntax before adding
- Warns if entry key already exists
- Creates backup before modification
- Confirms successful addition

**Best Practices:**

1. **Single Entry Files:**

   ```bash
   # Create temporary file for each new entry
   echo "@article{key, ...}" > temp-entry.bib
   /research:bib:add temp-entry.bib references.bib
   rm temp-entry.bib
   ```

2. **Batch Addition:**

   ```bash
   # Add multiple entries from exported file
   /research:bib:add zotero-export.bib main.bib
   ```

3. **Project-Specific Bibliographies:**

   ```bash
   # Maintain separate .bib files per project
   /research:bib:add shared-entry.bib project-a/refs.bib
   /research:bib:add shared-entry.bib project-b/refs.bib
   ```

**Integration with Reference Managers:**

- **Zotero:** Export to BibTeX → Add to main bibliography
- **Mendeley:** Export collection → Merge with existing .bib
- **Papers:** Export citations → Validate and add

**Common Workflows:**

1. **DOI to Bibliography:**

   ```bash
   /research:doi "10.xxxx/xxxxx" > temp.bib
   /research:bib:add temp.bib references.bib
   ```

2. **arXiv to Bibliography:**

   ```bash
   /research:arxiv "topic"
   # Find paper with DOI
   /research:doi "DOI from arXiv"
   /research:bib:add entry.bib references.bib
   ```

---

## Manuscript Writing

### /research:manuscript:methods

Write methods sections with statistical rigor.

**Syntax:**

```bash
/research:manuscript:methods "method description"
/research:manuscript:methods "Describe the bootstrap mediation analysis"
/research:manuscript:methods "Explain the Bayesian hierarchical model"
```

**Generates:**

- **Statistical Methodology:** Clear description of methods
- **Proper Notation:** LaTeX mathematical notation
- **Parameter Definitions:** All symbols defined
- **Estimation Procedures:** Step-by-step algorithms
- **Assumptions:** Explicit statistical assumptions
- **Justification:** Why this method was chosen

**Output Structure:**

```markdown
## Methods

### Statistical Framework

[High-level overview of approach]

### Notation

Let $Y$ denote [definition]...
Let $X$ denote [definition]...

### Model Specification

The model is specified as:
$$
[Model equations]
$$

where [parameter interpretations].

### Estimation

We estimate parameters using [method]:

1. [Step 1]
2. [Step 2]
...

### Assumptions

The following assumptions are required:

1. [Assumption 1]: [Justification]
2. [Assumption 2]: [Justification]

### Inference

Inference is conducted via [method]...
```

**Best Practices:**

1. **Be Specific:**

   ```bash
   # Too vague:
   /research:manuscript:methods "regression analysis"

   # Better:
   /research:manuscript:methods "multiple linear regression with bootstrap confidence intervals for indirect effects"
   ```

2. **Include Context:**

   ```bash
   /research:manuscript:methods "Bayesian mediation analysis for three-variable system with prior specifications and MCMC sampling details"
   ```

3. **Reference Key Papers:**
   - Generated methods should cite foundational papers
   - Include statistical software citations
   - Reference simulation studies validating the method

**Common Use Cases:**

1. **Bootstrap Methods:**

   ```bash
   /research:manuscript:methods "percentile bootstrap for mediation with 10,000 resamples"
   ```

2. **Causal Inference:**

   ```bash
   /research:manuscript:methods "propensity score matching with inverse probability weighting"
   ```

3. **Bayesian Analysis:**

   ```bash
   /research:manuscript:methods "Bayesian hierarchical model with weakly informative priors"
   ```

**Integration:**

- Export to LaTeX manuscript
- Convert to Quarto for reproducible documents
- Include in R Markdown analysis files

**Statistical Rigor Checklist:**

- [ ] All notation defined before use
- [ ] Model assumptions stated explicitly
- [ ] Estimation procedure described step-by-step
- [ ] Inference method specified (CI, hypothesis tests, etc.)
- [ ] Software and packages cited
- [ ] Simulation/validation studies referenced
- [ ] Limitations acknowledged

---

### /research:manuscript:results

Generate results sections with proper reporting.

**Syntax:**

```bash
/research:manuscript:results "result description"
/research:manuscript:results "Report simulation study findings"
/research:manuscript:results "Summarize regression analysis of treatment effects"
```

**Includes:**

- **Statistical Test Results:** p-values, test statistics, degrees of freedom
- **Effect Sizes with CI:** Point estimates and confidence intervals
- **Table Formatting Guidance:** APA/journal-specific formatting
- **Figure Descriptions:** What plots to include and why
- **Interpretation:** What results mean statistically and scientifically

**Output Structure:**

```markdown
## Results

### Descriptive Statistics

Table 1 presents descriptive statistics for [variables]...

### Primary Analysis

[Statistical test] revealed [finding] (test statistic = X.XX, df = XX, p = .XXX).
The effect size was [magnitude] (95% CI: [lower, upper]).

### Secondary Analyses

[Additional findings]...

### Sensitivity Analyses

Results were robust to [assumptions/choices]:
- [Sensitivity check 1]: [Result]
- [Sensitivity check 2]: [Result]

### Tables and Figures

**Table 1:** [Description]
**Figure 1:** [Description] - [Interpretation]
```

**Statistical Reporting Standards:**

1. **Always Include:**
   - Exact p-values (not just "p < .05")
   - Effect sizes (not just significance)
   - Confidence intervals (95% standard)
   - Sample sizes for each analysis
   - Missing data handling description

2. **Format Standards:**
   - APA: *p* = .034 (italicized, leading zero omitted for p-values)
   - Effect size: Cohen's *d* = 0.42, 95% CI [0.18, 0.66]
   - Test statistic: *t*(98) = 2.13, *p* = .036

**Common Use Cases:**

1. **Regression Results:**

   ```bash
   /research:manuscript:results "multiple regression with three predictors, adjusted R-squared, and individual coefficient tests"
   ```

2. **Group Comparisons:**

   ```bash
   /research:manuscript:results "t-test comparing treatment and control groups on outcome Y"
   ```

3. **Simulation Findings:**

   ```bash
   /research:manuscript:results "Monte Carlo simulation comparing bias and coverage of five estimation methods"
   ```

**Table Formatting:**

Generated results include guidance for:

- **Regression tables:** Coefficients, SE, CI, p-values
- **Descriptive tables:** Mean, SD, Min, Max, N
- **Simulation tables:** Bias, RMSE, Coverage, Power

**Figure Recommendations:**

- **Scatter plots:** For relationships between continuous variables
- **Box plots:** For group comparisons
- **Forest plots:** For meta-analysis or multiple effect sizes
- **ROC curves:** For classification performance

**Best Practices:**

1. **Report All Preregistered Analyses:**
   - Don't cherry-pick significant results
   - Report null findings with same detail

2. **Separate Exploratory from Confirmatory:**
   - Clearly label post-hoc analyses
   - Adjust for multiple comparisons when appropriate

3. **Provide Context:**
   - Compare effect sizes to prior literature
   - Discuss practical significance, not just statistical

**Integration:**

- Export to LaTeX tables (booktabs, apa7)
- Convert to Quarto for reproducible reports
- Include in supplementary materials

---

### /research:manuscript:reviewer

Generate responses to reviewer comments.

**Syntax:**

```bash
/research:manuscript:reviewer "reviewer comment"
/research:manuscript:reviewer "Reviewer 2 questions significance testing approach"
/research:manuscript:reviewer "Reviewer asks for sensitivity analysis to unmeasured confounding"
```

**Provides:**

- **Respectful, Professional Tone:** Courteous responses
- **Statistical Justification:** Evidence-based explanations
- **Additional Analysis Suggestions:** New analyses to address concerns
- **Revision Guidance:** How to modify manuscript
- **Literature Support:** Citations backing your approach

**Response Structure:**

```markdown
## Response to Reviewer Comment

**Reviewer Comment:**
[Quote verbatim]

**Response:**

We thank the reviewer for this insightful comment. [Acknowledgment]

[Point-by-point response addressing each concern]

**Changes Made:**

1. [Revision 1] (Page X, Lines Y-Z)
2. [Revision 2] (New section added: ...)
3. [Additional analysis] (New Table X)

**Justification:**

[Statistical reasoning with citations to support approach]
```

**Common Reviewer Concerns:**

1. **"Sample size seems small"**

   ```bash
   /research:manuscript:reviewer "Reviewer concerned about sample size of n=150 for mediation analysis"
   ```

   **Response elements:**
   - Power analysis justification
   - Simulation studies showing adequate power
   - Comparison to published studies
   - Sensitivity analyses

2. **"Multiple testing not addressed"**

   ```bash
   /research:manuscript:reviewer "Reviewer notes no correction for multiple comparisons"
   ```

   **Response elements:**
   - Primary vs. secondary distinction
   - Bonferroni/FDR correction if appropriate
   - Preregistration of hypotheses
   - Exploratory vs. confirmatory framing

3. **"Assumptions not verified"**

   ```bash
   /research:manuscript:reviewer "Reviewer asks for normality checks and linearity diagnostics"
   ```

   **Response elements:**
   - Diagnostic plots (Q-Q, residual plots)
   - Formal tests (Shapiro-Wilk, etc.)
   - Robustness checks (bootstrap, permutation)
   - Supplementary materials additions

**Tone Guidelines:**

- **Acknowledge valid points:** "We thank the reviewer for identifying this oversight"
- **Explain politely when you disagree:** "We respectfully note that..."
- **Show appreciation:** "This suggestion has strengthened the manuscript"
- **Be specific about changes:** "We have added Table 3 (page 12) showing..."

**Red Flags to Avoid:**

- ❌ "The reviewer misunderstands..."
- ❌ "This is obvious..."
- ❌ "As we already stated..."
- ✅ "To clarify..." or "We have now made this more explicit..."

**Additional Analysis Strategies:**

1. **Robustness Checks:**
   - Alternative estimators
   - Subsample analyses
   - Sensitivity to outliers

2. **Extended Results:**
   - Supplementary tables
   - Additional diagnostic plots
   - Simulation studies

3. **Methodological Clarifications:**
   - Expanded methods section
   - Algorithm pseudocode
   - Implementation details

**Best Practices:**

1. **Track Changes Meticulously:**
   - Document every revision
   - Use line numbers in references
   - Highlight additions in revised manuscript

2. **Provide New Analyses Promptly:**
   - Run suggested analyses
   - Include in supplementary materials
   - Reference in response letter

3. **Cite Supporting Literature:**
   - Back up methodological choices
   - Show awareness of alternative approaches
   - Demonstrate engagement with recent work

**Integration:**

```bash
# Workflow for responding to reviews:
/research:manuscript:reviewer "Reviewer comment text"
# Review suggested response
# Run additional analyses if needed
/research:simulation:design "robustness check suggested by reviewer"
# Update manuscript
/research:manuscript:results "new sensitivity analysis results"
```

---

### /research:manuscript:proof

Review mathematical proofs for correctness.

**Syntax:**

```bash
/research:manuscript:proof "proof description"
/research:manuscript:proof "Check identifiability proof in Appendix A"
/research:manuscript:proof "Verify consistency proof for M-estimator"
```

**Validates:**

- **Logical Flow:** Each step follows from previous
- **Mathematical Rigor:** Formal correctness
- **Assumptions Stated:** All conditions explicit
- **Completeness:** No gaps in reasoning
- **Notation Consistency:** Symbols used correctly throughout

**Review Checklist:**

```markdown
## Proof Validation Report

### Overall Assessment
[Pass/Fail/Needs Revision]

### Logical Structure
- [ ] Proof starts from stated assumptions
- [ ] Each step is justified
- [ ] Conclusion follows from premises

### Mathematical Rigor
- [ ] All quantities defined before use
- [ ] Inequalities/equalities are valid
- [ ] Limits and convergence properly handled
- [ ] Probabilistic statements precise

### Assumptions
- [ ] All assumptions stated upfront
- [ ] No hidden assumptions
- [ ] Assumptions are reasonable
- [ ] Counterexamples when assumptions fail

### Completeness
- [ ] No logical gaps
- [ ] Edge cases addressed
- [ ] Uniqueness established (if claimed)

### Notation
- [ ] Consistent throughout
- [ ] Standard conventions followed
- [ ] Clear distinction between random/fixed

### Suggested Improvements
1. [Improvement 1]
2. [Improvement 2]
```

**Common Proof Types:**

1. **Identifiability Proofs:**

   ```bash
   /research:manuscript:proof "identifiability of causal effects under unmeasured confounding"
   ```

   **Key checks:**
   - Existence of solution
   - Uniqueness of solution
   - Observability from data

2. **Consistency Proofs:**

   ```bash
   /research:manuscript:proof "consistency of bootstrap variance estimator"
   ```

   **Key checks:**
   - Convergence in probability
   - Rate of convergence
   - Required regularity conditions

3. **Asymptotic Normality:**

   ```bash
   /research:manuscript:proof "asymptotic normality of indirect effect estimator"
   ```

   **Key checks:**
   - Central limit theorem application
   - Variance formula derivation
   - Delta method correctness

**Common Errors Detected:**

1. **Missing Steps:**
   - "Therefore A = C" when intermediate step B is needed
   - Solution: Add explicit intermediate steps

2. **Circular Reasoning:**
   - Assuming what you're trying to prove
   - Solution: Start from first principles

3. **Unstated Assumptions:**
   - Using regularity conditions without stating them
   - Solution: Enumerate all assumptions upfront

4. **Notation Confusion:**
   - Using same symbol for different quantities
   - Solution: Adopt consistent notation system

**Best Practices:**

1. **Provide Full Context:**

   ```bash
   /research:manuscript:proof "Show that under assumptions A1-A3, the estimator theta-hat is consistent for theta. The proof uses the continuous mapping theorem and the law of large numbers."
   ```

2. **Specify Proof Location:**

   ```bash
   /research:manuscript:proof "Lemma 2 in Appendix B, proving identifiability of direct effects"
   ```

3. **Include Surrounding Text:**
   - Theorem statement
   - Assumption list
   - Proof sketch (if separate from full proof)

**Integration with Writing:**

```bash
# Workflow for proof verification:
/research:manuscript:proof "draft proof from manuscript"
# Review validation report
# Fix identified issues
# Re-verify:
/research:manuscript:proof "revised proof"
```

**When to Use:**

- Before submission (catch errors early)
- After reviewer comments (verify requested revisions)
- When extending existing proofs
- When adapting proofs from literature

**Limitations:**

- Cannot verify computational proofs (simulation-based)
- May miss subtle measure-theoretic issues
- Best used as supplement to peer review, not replacement

---

## Simulation Studies

### /research:simulation:design

Design Monte Carlo simulation studies.

**Syntax:**

```bash
/research:simulation:design "simulation description"
/research:simulation:design "Compare bootstrap methods for mediation"
/research:simulation:design "Evaluate Type I error of proposed test under null"
```

**Provides:**

- **Simulation Parameters:** Sample sizes, effect sizes, scenarios
- **Sample Size Considerations:** Power and precision planning
- **Number of Replications:** How many Monte Carlo draws
- **Performance Metrics:** What to measure (bias, MSE, coverage, power)
- **Analysis Plan:** How to summarize and visualize results
- **R Code Template:** Starter code for implementation

**Output Structure:**

```markdown
## Simulation Design

### Research Question
[What are you trying to learn from simulation?]

### Data Generation

**Parameters:**
- Sample sizes: [n1, n2, n3, ...]
- Effect sizes: [small, medium, large]
- Distributions: [Normal, t, skewed, etc.]
- Missing data: [%, mechanism]

**Model:**
$$
[Data generating process]
$$

### Estimation Methods

Compare the following methods:
1. [Method 1]: [Brief description]
2. [Method 2]: [Brief description]
...

### Performance Metrics

- **Bias:** $E[\hat{\theta}] - \theta$
- **RMSE:** $\sqrt{E[(\hat{\theta} - \theta)^2]}$
- **Coverage:** $P(\theta \in CI)$
- **Power:** $P(\text{reject } H_0 | H_1 \text{ true})$

### Design Factors

| Factor | Levels |
|--------|--------|
| Sample size | 50, 100, 200, 500 |
| Effect size | 0, 0.2, 0.5, 0.8 |
| Distribution | Normal, t(5), Skewed |

**Total scenarios:** [N scenarios]

### Number of Replications

- Target: [N] replications per scenario
- Justification: [Monte Carlo error < threshold]

### Implementation

**R Code Outline:**

```r
# Simulation function
simulate_scenario <- function(n, effect_size, distribution) {
  # Generate data
  # Apply methods
  # Return results
}

# Run simulation
results <- expand.grid(
  n = c(50, 100, 200, 500),
  effect_size = c(0, 0.2, 0.5, 0.8),
  distribution = c("normal", "t5", "skewed")
) %>%
  rowwise() %>%
  mutate(replicate(1000, simulate_scenario(n, effect_size, distribution)))
```

### Analysis Plan

1. Summarize bias and RMSE by scenario
2. Plot coverage rates (should be ~0.95)
3. Create power curves across effect sizes
4. Identify optimal method for each scenario

```

**Sample Size Guidance:**

- **Small effects:** n ≥ 200 for adequate power
- **Medium effects:** n ≥ 100 reasonable
- **Large effects:** n ≥ 50 may suffice
- **Rule of thumb:** Power ≥ 0.80 for effect size of interest

**Number of Replications:**

| Goal | Replications |
|------|-------------|
| Rough estimates | 1,000 |
| Standard practice | 5,000 |
| High precision | 10,000 |
| Publication quality | 10,000-50,000 |

**Monte Carlo error:** $SE = \sigma / \sqrt{R}$ where R = replications

**Design Principles:**

1. **Vary One Factor at a Time:**
   - Easier to interpret interactions
   - Clearer main effects

2. **Include Null Condition:**
   - Effect size = 0 for Type I error
   - Verify nominal coverage under null

3. **Realistic Scenarios:**
   - Match real data characteristics
   - Include violations of assumptions

4. **Sufficient Range:**
   - Small to large sample sizes
   - Weak to strong effects
   - Mild to severe assumption violations

**Common Simulation Types:**

1. **Type I Error / Coverage:**
   ```bash
   /research:simulation:design "Verify Type I error rate of Wald test under null hypothesis across sample sizes"
   ```

1. **Power Analysis:**

   ```bash
   /research:simulation:design "Compare power of t-test vs. Wilcoxon test under normal and t-distributed data"
   ```

2. **Bias/Efficiency:**

   ```bash
   /research:simulation:design "Compare bias and MSE of MLE vs. robust estimator under contaminated normal"
   ```

3. **Method Comparison:**

   ```bash
   /research:simulation:design "Compare bootstrap percentile vs. BCa confidence intervals for indirect effects"
   ```

**Best Practices:**

1. **Set Random Seed:**

   ```r
   set.seed(12345)  # Reproducibility
   ```

2. **Parallelize:**

   ```r
   library(parallel)
   mclapply(scenarios, simulate_scenario, mc.cores = 8)
   ```

3. **Save Intermediate Results:**

   ```r
   saveRDS(results, "simulation_results.rds")
   ```

4. **Monitor Progress:**

   ```r
   library(pbapply)
   pblapply(scenarios, simulate_scenario)
   ```

**Integration:**

```bash
# Full simulation workflow:
/research:simulation:design "compare two methods"
# Implement R code
# Run simulation
/research:simulation:analysis results.csv
# Analyze and visualize
```

---

### /research:simulation:analysis

Analyze simulation results.

**Syntax:**

```bash
/research:simulation:analysis results.csv
/research:simulation:analysis results/simulation_output.rds
/research:simulation:analysis data/monte_carlo_results.csv
```

**Generates:**

- **Performance Summaries:** Bias, RMSE, coverage, power by scenario
- **Bias and MSE Calculations:** Formulas and numerical results
- **Coverage Rate Analysis:** CI performance assessment
- **Visualization Code:** R/ggplot2 code for publication-quality plots
- **Statistical Tests:** Comparing methods formally

**Expected Data Format:**

```csv
scenario,method,n,effect_size,replicate,estimate,se,ci_lower,ci_upper,pvalue
1,method1,100,0.5,1,0.48,0.12,0.24,0.72,0.03
1,method1,100,0.5,2,0.52,0.11,0.30,0.74,0.02
...
```

**Required Columns:**

- `method`: Method identifier
- `n`: Sample size
- `estimate`: Point estimate
- `ci_lower`, `ci_upper`: Confidence interval bounds
- `replicate`: Replication number

**Output Structure:**

```markdown
## Simulation Results Analysis

### Performance Summary

**Bias by Method:**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Method1| -0.02| -0.01 |  0.00 |  0.00 |
| Method2|  0.05|  0.03 |  0.01 |  0.00 |

**RMSE by Method:**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Method1| 0.18 | 0.12  |  0.08 |  0.05 |
| Method2| 0.22 | 0.15  |  0.10 |  0.06 |

**Coverage Rates (nominal = 0.95):**

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Method1| 0.93 | 0.94  |  0.95 |  0.95 |
| Method2| 0.89 | 0.92  |  0.94 |  0.95 |

### Interpretation

- **Method1** shows minimal bias across all sample sizes
- **Method2** is biased upward for small samples (n < 200)
- **Coverage** is below nominal for Method2 when n < 200
- **RMSE** decreases as expected with larger n

### Recommendations

1. Use **Method1** for all sample sizes
2. **Method2** acceptable only for n ≥ 200
3. Bootstrap CI may improve Method2 coverage

### Visualization Code

```r
library(ggplot2)
library(dplyr)

# Bias plot
results %>%
  group_by(method, n) %>%
  summarize(bias = mean(estimate - true_value)) %>%
  ggplot(aes(x = n, y = bias, color = method)) +
  geom_line() +
  geom_hline(yintercept = 0, linetype = "dashed") +
  labs(title = "Bias by Sample Size",
       x = "Sample Size", y = "Bias") +
  theme_minimal()

# Coverage plot
results %>%
  group_by(method, n) %>%
  summarize(coverage = mean(ci_lower <= true_value & ci_upper >= true_value)) %>%
  ggplot(aes(x = n, y = coverage, color = method)) +
  geom_line() +
  geom_hline(yintercept = 0.95, linetype = "dashed") +
  labs(title = "Coverage Rates",
       x = "Sample Size", y = "Coverage") +
  theme_minimal()
```

```

**Performance Metrics Formulas:**

1. **Bias:**
   $$\text{Bias}(\hat{\theta}) = \frac{1}{R}\sum_{r=1}^R \hat{\theta}_r - \theta$$

2. **Mean Squared Error:**
   $$\text{MSE}(\hat{\theta}) = \frac{1}{R}\sum_{r=1}^R (\hat{\theta}_r - \theta)^2$$

3. **Root MSE:**
   $$\text{RMSE}(\hat{\theta}) = \sqrt{\text{MSE}(\hat{\theta})}$$

4. **Coverage:**
   $$\text{Coverage} = \frac{1}{R}\sum_{r=1}^R I(\theta \in \text{CI}_r)$$

5. **Power:**
   $$\text{Power} = \frac{1}{R}\sum_{r=1}^R I(p_r < \alpha)$$

**Visualization Types:**

1. **Bias Plots:**
   - Line plots: Bias vs. sample size
   - Faceted by effect size
   - Separate lines for each method

2. **RMSE Plots:**
   - Log scale for sample size if wide range
   - Add theoretical RMSE curve if available

3. **Coverage Plots:**
   - Horizontal line at nominal level (0.95)
   - Shaded region for Monte Carlo error

4. **Power Curves:**
   - Power vs. effect size
   - Faceted by sample size
   - Compare methods

**Best Practices:**

1. **Check Monte Carlo Error:**
   ```r
   # SE of coverage estimate
   se_coverage <- sqrt(0.95 * 0.05 / n_replications)
   ```

1. **Report Summary Statistics:**
   - Mean, median, SD of estimates
   - Min/max for outlier detection
   - Convergence failures

2. **Identify Winner:**
   - Method with lowest RMSE across scenarios
   - Or best coverage closest to nominal
   - Consider practical constraints (speed, implementation)

**Common Issues:**

1. **Outliers:**
   - Check for simulation failures
   - Remove or investigate separately

2. **Low Coverage:**
   - May indicate bias
   - Or SE underestimation
   - Try bootstrap SE

3. **High Variability:**
   - Increase replications
   - Or use variance reduction techniques

**Integration:**

```bash
# Complete workflow:
/research:simulation:design "method comparison"
# Run R simulation
/research:simulation:analysis results.csv
# Review plots and tables
/research:manuscript:results "simulation study findings"
```

**Publication Checklist:**

- [ ] Report all performance metrics
- [ ] Include coverage rates (critical for CI methods)
- [ ] Show power curves if hypothesis testing
- [ ] Provide R code in supplementary materials
- [ ] Discuss failures/non-convergence
- [ ] Compare to theoretical results if available

---

## Research Planning

### /research:lit-gap

Identify literature gaps.

**Syntax:**

```bash
/research:lit-gap "research area"
/research:lit-gap "mediation analysis with unmeasured confounding"
/research:lit-gap "high-dimensional causal inference"
```

**Identifies:**

- **Methodological Gaps:** Missing statistical methods
- **Application Areas:** Understudied domains
- **Research Opportunities:** Novel research directions
- **Novel Contributions:** What you could uniquely contribute
- **Recent Advances:** What's been done recently
- **Open Problems:** Known unsolved questions

**Output Structure:**

```markdown
## Literature Gap Analysis

### Research Area
[Topic description]

### Current State of Literature

**Established Methods:**
1. [Method 1]: [Brief description, key papers]
2. [Method 2]: [Brief description, key papers]

**Recent Developments (2020-present):**
- [Recent paper 1]: [Key contribution]
- [Recent paper 2]: [Key contribution]

### Identified Gaps

#### 1. Methodological Gaps

**Gap:** [Description]
**Why it matters:** [Practical/theoretical importance]
**Potential approach:** [How you might address it]
**Difficulty:** [Easy/Moderate/Hard]

#### 2. Application Gaps

**Understudied domains:**
- [Domain 1]: [Why important, what's missing]
- [Domain 2]: [Why important, what's missing]

#### 3. Computational Gaps

**Scalability issues:**
- [Current methods limited to n < X]
- [Opportunity for faster algorithms]

### Research Opportunities

**Short-term (1-2 papers):**
1. [Opportunity 1]
   - Expected contribution
   - Required expertise
   - Target journal

**Medium-term (2-3 years):**
1. [Opportunity 2]
   - Bigger scope
   - Collaboration potential

**High-impact (ambitious):**
1. [Opportunity 3]
   - Major theoretical advance
   - Computational breakthrough

### Recommended Next Steps

1. [Immediate action 1]
2. [Immediate action 2]
3. [Literature to review]
```

**Use Cases:**

1. **Grant Proposals:**

   ```bash
   /research:lit-gap "causal mediation in complex longitudinal studies"
   # Identify gaps for proposal
   # Justify research significance
   ```

2. **PhD Research Planning:**

   ```bash
   /research:lit-gap "robust inference for indirect effects"
   # Find dissertation topic
   # Scope feasibility
   ```

3. **Manuscript Introduction:**

   ```bash
   /research:lit-gap "your research area"
   # Craft motivation section
   # Justify novelty
   ```

**Gap Types:**

1. **Methodological:**
   - No existing method for scenario X
   - Current methods inefficient
   - Theoretical properties unknown

2. **Computational:**
   - Methods don't scale
   - No software implementation
   - Numerical instability

3. **Application:**
   - Methods exist but not applied to domain Y
   - Real data characteristics not studied
   - Practice lags behind theory

**Best Practices:**

1. **Be Specific:**

   ```bash
   # Too broad:
   /research:lit-gap "statistics"

   # Better:
   /research:lit-gap "Bayesian methods for mediation with time-varying confounding"
   ```

2. **Update Regularly:**
   - Literature changes rapidly
   - Run periodically during project
   - Check for preprints (arXiv)

3. **Cross-Reference:**

   ```bash
   /research:lit-gap "topic"
   /research:arxiv "topic"
   # Compare gaps with recent arXiv papers
   ```

**Integration:**

```bash
# Research planning workflow:
/research:lit-gap "research area"
# Identify promising gap
/research:method-scout "gap area"
# Find existing tools
/research:hypothesis "specific gap"
# Formulate testable hypotheses
```

---

### /research:hypothesis

Generate testable hypotheses.

**Syntax:**

```bash
/research:hypothesis "research question"
/research:hypothesis "treatment effect heterogeneity"
/research:hypothesis "Does bootstrap improve coverage for mediation CI?"
```

**Produces:**

- **Formal Statistical Hypotheses:** Mathematical formulation
- **Null and Alternative:** H₀ and H₁ precisely stated
- **Test Procedures:** How to test each hypothesis
- **Power Considerations:** Sample size and effect size
- **Interpretation:** What results would mean

**Output Structure:**

```markdown
## Research Hypotheses

### Research Question
[High-level question]

### Hypothesis 1: [Name]

**Formal Statement:**

$$H_0: \theta = \theta_0 \quad \text{vs.} \quad H_1: \theta \neq \theta_0$$

or

$$H_0: \theta_1 = \theta_2 \quad \text{vs.} \quad H_1: \theta_1 \neq \theta_2$$

**Statistical Test:**
- Test statistic: $T = [formula]$
- Null distribution: [distribution]
- Rejection region: $|T| > c_{\alpha}$

**Power Analysis:**
- Effect size: [small/medium/large]
- Required n for 80% power: [N]

**Interpretation:**
- If reject H₀: [Meaning]
- If fail to reject: [Meaning]

### Hypothesis 2: [Name]
[Similar structure]

### Testing Strategy

**Primary Hypothesis:**
[Which hypothesis is primary]

**Adjustment for Multiple Testing:**
[Bonferroni, Holm, FDR, etc.]

**Sensitivity Analyses:**
1. [Sensitivity check 1]
2. [Sensitivity check 2]
```

**Common Hypothesis Types:**

1. **Equality Hypotheses:**

   ```bash
   /research:hypothesis "Test if indirect effect equals zero"
   ```

   **Output:**
   $$H_0: \alpha\beta = 0 \quad \text{vs.} \quad H_1: \alpha\beta \neq 0$$

2. **Superiority Hypotheses:**

   ```bash
   /research:hypothesis "Test if Method A has lower RMSE than Method B"
   ```

   **Output:**
   $$H_0: \text{RMSE}_A \geq \text{RMSE}_B \quad \text{vs.} \quad H_1: \text{RMSE}_A < \text{RMSE}_B$$

3. **Equivalence Hypotheses:**

   ```bash
   /research:hypothesis "Test if two methods are equivalent within margin"
   ```

   **Output:**
   $$H_0: |\theta_1 - \theta_2| \geq \delta \quad \text{vs.} \quad H_1: |\theta_1 - \theta_2| < \delta$$

**Test Procedure Guidance:**

1. **Parametric Tests:**
   - t-test, F-test, Wald test
   - Assumptions required
   - When to use

2. **Nonparametric Tests:**
   - Wilcoxon, Kruskal-Wallis, permutation
   - Fewer assumptions
   - Lower power

3. **Bootstrap/Resampling:**
   - Distribution-free
   - Computationally intensive
   - Good for complex statistics

**Power Considerations:**

```markdown
### Power Analysis

**Parameters:**
- Significance level: α = 0.05
- Desired power: 1 - β = 0.80
- Effect size: [Cohen's d, correlation, etc.]

**Sample Size Calculation:**

For two-sample t-test with d = 0.5:
- Required n per group: ~64
- Total N: ~128

**Power Curve:**
[Code to generate power curve across effect sizes]
```

**Best Practices:**

1. **Preregister Hypotheses:**
   - Specify before seeing data
   - Distinguish confirmatory from exploratory

2. **One-Sided vs. Two-Sided:**
   - Use two-sided unless strong prior justification
   - One-sided increases power but requires theoretical support

3. **Composite Hypotheses:**
   - Break complex questions into multiple testable hypotheses
   - Adjust for multiple testing

**Integration:**

```bash
# Hypothesis development workflow:
/research:lit-gap "research area"
# Identify gap
/research:hypothesis "specific research question from gap"
# Formulate hypotheses
/research:analysis-plan "study to test hypotheses"
# Design study
/research:simulation:design "evaluate power of tests"
# Validate with simulation
```

**Common Mistakes to Avoid:**

- ❌ Vague hypotheses: "X affects Y"
- ✅ Precise hypotheses: "μ₁ > μ₂ by at least 0.5σ"

- ❌ Testing after seeing results
- ✅ Prespecify hypotheses before analysis

- ❌ Ignoring multiple testing
- ✅ Adjust α or report adjusted p-values

---

### /research:analysis-plan

Create statistical analysis plans.

**Syntax:**

```bash
/research:analysis-plan "study description"
/research:analysis-plan "randomized trial with mediation"
/research:analysis-plan "observational study with propensity scores"
```

**Includes:**

- **Primary Analysis:** Main statistical test/model
- **Secondary Analyses:** Additional questions
- **Sensitivity Analyses:** Robustness checks
- **Multiple Testing Procedures:** How to adjust for multiple comparisons
- **Missing Data Handling:** Imputation strategy
- **Sample Size Justification:** Power calculation

**Output Structure:**

```markdown
## Statistical Analysis Plan

### Study Design
[Brief description: RCT, observational, simulation, etc.]

### Primary Outcome
[What is primary outcome variable]

### Primary Analysis

**Objective:**
Test whether [research question]

**Statistical Model:**
$$
[Model specification]
$$

**Estimation:**
[Method: MLE, Bayesian, etc.]

**Inference:**
- Hypothesis test: [H₀ vs. H₁]
- Confidence interval: [95% CI method]
- Significance level: α = 0.05

**Assumptions:**
1. [Assumption 1]
2. [Assumption 2]

**Diagnostics:**
- [Check 1]: [Method]
- [Check 2]: [Method]

### Secondary Analyses

**Analysis 1: [Description]**
- Research question
- Statistical approach
- Interpretation

**Analysis 2: [Description]**
- Research question
- Statistical approach
- Interpretation

### Sensitivity Analyses

**Purpose:** Assess robustness to assumptions

1. **Alternative model specification:**
   - [Specification]
   - Compare to primary analysis

2. **Outlier influence:**
   - Remove extreme observations
   - Compare results

3. **Missing data mechanism:**
   - Alternative imputation methods
   - Complete case analysis

### Multiple Testing

**Strategy:**
- Primary hypothesis: No adjustment (α = 0.05)
- Secondary hypotheses: Bonferroni correction
- Exploratory analyses: Reported as such, no adjustment

### Missing Data

**Expected missingness:** [%]

**Mechanism assumption:** [MAR, MCAR, NMAR]

**Handling:**
- Primary: [Multiple imputation, MICE, etc.]
- Sensitivity: [Complete case analysis]

### Sample Size

**Primary analysis power calculation:**
- Effect size: [d = 0.5, etc.]
- Power: 80%
- Significance: α = 0.05
- **Required N:** [N]

**Recruited/Available N:** [N]
**Expected attrition:** [%]
**Final expected N:** [N]

### Analysis Timeline

1. Data cleaning and QC
2. Descriptive statistics
3. Primary analysis
4. Secondary analyses
5. Sensitivity analyses
6. Manuscript draft

### Software

- R version [X.X.X]
- Packages: [list]
- Code repository: [GitHub URL if applicable]
```

**SAP Principles:**

1. **Written Before Data Collection:**
   - Preregistration (ClinicalTrials.gov, OSF)
   - Timestamp and version control
   - Reduces researcher degrees of freedom

2. **Comprehensive but Flexible:**
   - Specify primary analysis precisely
   - Allow for exploratory analyses (labeled as such)
   - Document deviations in final report

3. **Reproducible:**
   - Include software versions
   - Specify random seeds
   - Share code and data (when possible)

**Use Cases:**

1. **Clinical Trials:**

   ```bash
   /research:analysis-plan "Phase III RCT comparing Drug A vs. Placebo on survival"
   ```

   **Key elements:**
   - ITT and per-protocol analyses
   - Interim analysis plan
   - Stopping rules

2. **Observational Studies:**

   ```bash
   /research:analysis-plan "cohort study with time-varying confounding and mediation"
   ```

   **Key elements:**
   - Confounding adjustment strategy
   - Causal framework (DAG)
   - Sensitivity to unmeasured confounding

3. **Methodological Research:**

   ```bash
   /research:analysis-plan "simulation study comparing five mediation CI methods"
   ```

   **Key elements:**
   - Simulation scenarios
   - Performance metrics
   - Winner selection criteria

**Integration with Other Commands:**

```bash
# Complete study planning workflow:
/research:lit-gap "research area"
# Identify gap
/research:hypothesis "research question"
# Formulate hypotheses
/research:analysis-plan "study design"
# Detailed SAP
/research:simulation:design "pilot simulation for power"
# Validate assumptions
```

**Best Practices:**

1. **Involve Collaborators:**
   - Get input from PI, co-investigators
   - Domain experts for clinical relevance
   - Statistician for technical review

2. **Version Control:**
   - SAP v1.0 at study start
   - SAP v1.1 if amendments needed (with justification)
   - Final SAP locked before data lock

3. **Public Registration:**
   - Upload to OSF, GitHub, or journal supplementary
   - Timestamped proof of prespecification

**Common Mistakes:**

- ❌ Writing SAP after seeing results
- ✅ Write before data collection/analysis

- ❌ Vague: "We will use regression"
- ✅ Specific: "Linear regression with robust SE, adjusted for baseline covariates X, Y, Z"

- ❌ No plan for missing data
- ✅ Explicit imputation strategy with sensitivity analysis

---

### /research:method-scout

Scout statistical methods for problems.

**Syntax:**

```bash
/research:method-scout "statistical problem"
/research:method-scout "high-dimensional mediation"
/research:method-scout "causal inference with unmeasured confounding"
```

**Suggests:**

- **Relevant Methods:** Established and recent approaches
- **R Packages:** Implementation tools
- **Key Papers:** Foundational and recent literature
- **Implementation Guidance:** How to apply methods
- **Method Comparison:** Pros/cons of each approach
- **When to Use:** Guidance for method selection

**Output Structure:**

```markdown
## Statistical Method Recommendations

### Problem Description
[Your statistical problem]

### Recommended Methods

#### Method 1: [Name]

**Description:**
[What the method does, key idea]

**When to Use:**
- [Scenario 1]
- [Scenario 2]

**Assumptions:**
- [Assumption 1]
- [Assumption 2]

**R Implementation:**
- Package: `packagename`
- Function: `function_name()`
- Example:
  ```r
  library(packagename)
  result <- function_name(data, formula)
  ```

**Key Papers:**

1. [Author (Year)]: [Title] - [Journal]
2. [Author (Year)]: [Title] - [Journal]

**Pros:**

- [Advantage 1]
- [Advantage 2]

**Cons:**

- [Limitation 1]
- [Limitation 2]

---

#### Method 2: [Name]

[Similar structure]

### Method Comparison

| Criterion | Method 1 | Method 2 | Method 3 |
|-----------|----------|----------|----------|
| Assumptions | [Few/Many] | [Few/Many] | [Few/Many] |
| Computation | [Fast/Slow] | [Fast/Slow] | [Fast/Slow] |
| R Package | [Name] | [Name] | [Name] |
| Best for | [Scenario] | [Scenario] | [Scenario] |

### Recommendation

**Primary choice:** [Method X]
**Reason:** [Justification based on your problem]

**Alternative:** [Method Y]
**When to use alternative:** [Conditions]

### Implementation Roadmap

1. Install packages: `install.packages(c("pkg1", "pkg2"))`
2. Prepare data: [Format requirements]
3. Run primary method
4. Check diagnostics
5. Run sensitivity analysis with alternative method
6. Compare results

### Additional Resources

- Tutorial: [URL]
- Vignette: `vignette("name", package = "pkg")`
- GitHub examples: [URL]

```

**Common Problem Types:**

1. **Causal Inference:**
   ```bash
   /research:method-scout "estimate causal effects with confounding"
   ```

   **Methods suggested:**

- Propensity score matching (`MatchIt`)
- Inverse probability weighting (`survey`)
- Doubly robust estimation (`tmle`)
- Instrumental variables (`ivreg`)

1. **High-Dimensional Data:**

   ```bash
   /research:method-scout "regression with p > n"
   ```

   **Methods suggested:**
   - Lasso (`glmnet`)
   - Ridge regression (`glmnet`)
   - Elastic net (`glmnet`)
   - Sure independence screening (`SIS`)

2. **Mediation Analysis:**

   ```bash
   /research:method-scout "test indirect effects"
   ```

   **Methods suggested:**
   - Sobel test (`mediation`)
   - Bootstrap CI (`boot`, `mediation`)
   - Bayesian mediation (`blavaan`)
   - Sensitivity analysis (`medflex`)

3. **Longitudinal Data:**

   ```bash
   /research:method-scout "analyze repeated measures"
   ```

   **Methods suggested:**
   - Mixed models (`lme4`, `nlme`)
   - GEE (`geepack`)
   - Marginal structural models (`ipw`)

**Package Recommendations:**

For each method, includes:

- **Installation:** `install.packages("pkg")` or `remotes::install_github("user/repo")`
- **Documentation:** `?function_name` or `vignette("name")`
- **Maintainer:** Active development status
- **Dependencies:** Required packages

**Best Practices:**

1. **Compare Multiple Methods:**

   ```bash
   /research:method-scout "problem"
   # Review all suggestions
   # Try 2-3 methods as sensitivity analyses
   ```

2. **Check Recent Literature:**

   ```bash
   /research:method-scout "problem"
   # Note recommended papers
   /research:arxiv "problem"
   # Check for newer methods
   ```

3. **Validate with Simulation:**

   ```bash
   /research:method-scout "problem"
   # Choose promising method
   /research:simulation:design "compare recommended methods"
   # Verify performance for your scenario
   ```

**Integration:**

```bash
# Method discovery workflow:
/research:lit-gap "research area"
# Identify methodological gap
/research:method-scout "gap description"
# Find existing methods (or confirm gap)
/research:simulation:design "compare methods from scout"
# Evaluate methods
/research:analysis-plan "chosen method for real data"
# Apply to study
```

**Output Example:**

```markdown
## Statistical Method Recommendations

### Problem: High-Dimensional Mediation

#### Method 1: Sparse Mediation (HIMA)

**Description:**
High-dimensional mediation analysis using sure independence screening
and penalized regression to identify active mediators.

**When to Use:**
- p (mediators) >> n (sample size)
- Sparse mediation structure (few true mediators)

**R Implementation:**
```r
library(HIMA)
hima_fit <- hima(X, Y, M,
                 penalty = "MCP",
                 ncore = 4)
```

**Key Papers:**

1. Zhang et al. (2016): HIMA - Bioinformatics
2. Perera et al. (2022): Extensions - BMC Bioinformatics

**Pros:**

- Handles p >> n
- Identifies active mediators
- Fast computation

**Cons:**

- Assumes sparsity
- Selection uncertainty
- Bootstrap CI computationally expensive

```

---

## See Also

- **[Skills Guide](../skills.md)** - 17 research skills for interactive assistance
- **[Examples](../examples/research.md)** - Real-world usage examples
- **[API Wrappers](../api-wrappers.md)** - Shell-based command APIs

### Category-Specific Guides

- **[Literature Commands](LITERATURE-COMMANDS.md)** - Deep dive into literature management
- **[Manuscript Commands](MANUSCRIPT-COMMANDS.md)** - Comprehensive manuscript writing guide
- **[Simulation Commands](SIMULATION-COMMANDS.md)** - Complete simulation study reference

---

**Document Version:** {{ scholar.version }}
**Last Updated:** 2026-01-31
**Total Commands Documented:** 14
