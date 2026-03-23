---
render_macros: false
---

# Manuscript Writing Workflow Guide

Complete guide to publishing research papers from initial idea to journal acceptance, integrating Scholar's research commands with real-world academic workflows.

## Navigation

- [Overview](#overview)
- [Phase 1: Planning](#phase-1-planning-week-1-2)
- [Phase 2: Methods Development](#phase-2-methods-development-week-3-4)
- [Phase 3: Data Analysis](#phase-3-data-analysis-week-5-8)
- [Phase 4: Results Writing](#phase-4-results-writing-week-9-10)
- [Phase 5: Review & Revision](#phase-5-review-revision-week-11-12)
- [Phase 6: Submission & Peer Review](#phase-6-submission-peer-review-week-13)
- [Automation & Efficiency](#automation-efficiency)
- [Collaboration Workflows](#collaboration-workflows)
- [Best Practices](#best-practices)
- [Common Challenges](#common-challenges)

---

## Overview

### Complete Manuscript Lifecycle

Publishing a manuscript involves six major phases, each with specific Scholar commands and workflows:

```
Idea Generation → Planning → Methods → Analysis → Writing → Review → Publication
     ↓              ↓          ↓          ↓          ↓         ↓          ↓
  Research     Literature   Design    Execute    Draft    Revise    Publish
  Question     Review       Study     Analysis   Paper    Paper     & Share
```

### Expected Timeline

**Typical project:** 12-16 weeks from conception to submission

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Planning | 2 weeks | Research question, analysis plan, literature |
| Methods Development | 2 weeks | Statistical design, simulation validation |
| Data Analysis | 4 weeks | Results, tables, figures |
| Results Writing | 2 weeks | Complete draft manuscript |
| Review & Revision | 2 weeks | Polished manuscript ready for submission |
| Submission & Peer Review | Variable | Reviewer responses, final acceptance |

### Scholar Command Integration

**Throughout the workflow, use these commands:**

| Phase | Primary Commands | Purpose |
|-------|------------------|---------|
| Planning | `/research:lit-gap`, `/research:arxiv` | Identify research gaps |
| | `/research:hypothesis`, `/research:analysis-plan` | Formalize research |
| Methods | `/research:simulation:design` | Validate statistical approach |
| | `/research:manuscript:methods` | Write methods section |
| Analysis | `/research:simulation:analysis` | Analyze simulation results |
| Results | `/research:manuscript:results` | Generate results section |
| Writing | `/research:manuscript:proof` | Validate theoretical proofs |
| Review | `/research:manuscript:reviewer` | Respond to peer review |

---

## Phase 1: Planning (Week 1-2)

### Research Question Formulation

**Week 1: Identify Gap**

Start with a broad research question and narrow to a specific, answerable hypothesis.

**Step 1.1: Literature Gap Analysis**

```bash
# Identify what's missing in the literature
/research:lit-gap "bootstrap confidence intervals for mediation analysis"
```

**Output provides:**

- Current state of knowledge
- Identified gaps or limitations
- Research opportunities
- Suggested research questions

**Step 1.2: Systematic Literature Search**

```bash
# Find recent papers on your topic
/research:arxiv "bootstrap mediation indirect effects"

# Get specific foundational papers
/research:doi "10.1037/met0000310"  # Key citation from lit-gap
/research:doi "10.1080/00273171.2019.1624273"  # Another important paper
```

**Save citations immediately:**

```bash
# Create bibliography for this project
mkdir -p ~/papers/bootstrap-mediation-paper/
cd ~/papers/bootstrap-mediation-paper/

# Add papers to bibliography
cat > temp.bib << 'EOF'
@article{mackinnon2020bootstrap,
  author = {MacKinnon, David P. and Fritz, Matthew S.},
  title = {Bootstrap Confidence Intervals for Indirect Effects},
  journal = {Psychological Methods},
  year = {2020},
  ...
}
EOF

/research:bib:add temp.bib references.bib
rm temp.bib
```

**Week 2: Formalize Research Question**

**Step 1.3: Hypothesis Development**

```bash
# Formalize your research hypothesis
/research:hypothesis "Bootstrap BCa confidence intervals achieve better coverage than percentile intervals for indirect effects in mediation analysis, especially in small samples (n < 100)"
```

**Output provides:**

- Null hypothesis (H₀)
- Alternative hypothesis (H₁)
- Statistical framework
- Required sample size estimates
- Expected effect sizes

**Step 1.4: Analysis Plan**

```bash
# Create detailed analysis plan
/research:analysis-plan "Compare bootstrap percentile vs BCa confidence intervals for mediation analysis across sample sizes 50, 100, 200, 500 using Monte Carlo simulation with 5,000 replications per scenario. Primary metric: coverage probability (nominal = 0.95). Secondary metrics: interval width, bias."
```

**Output provides:**

- Data collection requirements
- Sample size justification
- Statistical tests to use
- Analysis sequence
- Contingency plans

**Save the analysis plan:**

```bash
/research:analysis-plan "..." > analysis-plan.md
git add analysis-plan.md
git commit -m "Add analysis plan for bootstrap mediation study"
```

### Deliverables (End of Week 2)

- [ ] Research question clearly stated
- [ ] Literature review complete (15-30 papers)
- [ ] Bibliography file created (`references.bib`)
- [ ] Hypothesis formalized with statistical framework
- [ ] Analysis plan documented and saved
- [ ] Project directory structured

**Project Structure:**

```
~/papers/bootstrap-mediation-paper/
├── references.bib          # Bibliography
├── analysis-plan.md        # Analysis plan
├── literature/             # PDFs of papers
├── methods/                # Methods drafts
├── results/                # Analysis output
├── figures/                # Plots
└── manuscript/             # Main paper files
```

---

## Phase 2: Methods Development (Week 3-4)

### Statistical Methods Design

**Week 3: Simulation Study Design**

**Step 2.1: Design Monte Carlo Simulation**

```bash
# Design simulation study to validate methods
/research:simulation:design "Compare bootstrap percentile vs BCa confidence intervals for mediation analysis. Sample sizes: 50, 100, 200, 500. True indirect effects: 0, 0.1, 0.3, 0.5. Data: normal and skewed distributions. Performance metrics: coverage, power, interval width. 5,000 replications per scenario."
```

**Output provides:**

- Complete data generation process
- Simulation scenarios (factorial design)
- Performance metrics with formulas
- R/Python code template
- Computational resource estimates

**Save simulation design:**

```bash
/research:simulation:design "..." > simulation-design.md
git add simulation-design.md
git commit -m "Add simulation study design"
```

**Step 2.2: Pilot Simulation**

Implement a small-scale pilot to test code:

```r
# pilot-simulation.R
# Test with n=100, effect=0.3, 1,000 reps (not full 5,000)

source("simulation-design.md")  # Code from design document

# Run pilot
pilot_results <- simulate_scenario(
  n = 100,
  alpha = 0.3,
  beta = 1.0,  # indirect effect = 0.3
  R = 1000     # Reduced replications for speed
)

# Check for errors
summary(pilot_results)
mean(pilot_results$convergence)  # Should be ~1.0

# If successful, proceed to full simulation
```

**Week 4: Methods Section Writing**

**Step 2.3: Draft Methods Section**

```bash
# Generate methods section from simulation design
/research:manuscript:methods "Monte Carlo simulation study comparing bootstrap percentile and BCa confidence intervals for mediation analysis. Data generation: M = αZ + ε_M, Y = βM + γZ + ε_Y where Z is binary treatment, M is mediator, Y is outcome, ε ~ N(0,1). Sample sizes: 50, 100, 200, 500. True indirect effects (αβ): 0, 0.1, 0.3, 0.5. Bootstrap: 5,000 resamples per replication. Replications: 5,000 per scenario. Performance metrics: coverage probability (nominal = 0.95), average interval width, Type I error. R version 4.3.0, boot package."
```

**Output provides:**

- Complete statistical framework
- Model specification with notation
- Estimation procedures
- Assumptions explicitly stated
- Implementation details
- Software citations

**Save methods section:**

```bash
/research:manuscript:methods "..." > methods/methods-section-draft1.md
git add methods/methods-section-draft1.md
git commit -m "Draft initial methods section"
```

**Step 2.4: Refine Methods with Co-Authors**

Iterate on methods section:

```bash
# Version 2: Add more detail based on feedback
/research:manuscript:methods "Previous prompt + Include data generation process for skewed distribution (exponential errors), add sensitivity analysis for varying correlation between M and Y, specify convergence criteria for bootstrap"

# Save refined version
/research:manuscript:methods "..." > methods/methods-section-draft2.md
```

### Deliverables (End of Week 4)

- [ ] Simulation design documented
- [ ] Pilot simulation successful (code validated)
- [ ] Methods section drafted and saved
- [ ] Co-authors reviewed methods (if applicable)
- [ ] Ready to execute full simulation

---

## Phase 3: Data Analysis (Week 5-8)

### Execute Analysis

**Week 5-6: Run Full Simulation**

**Step 3.1: Execute Simulation Study**

```r
# full-simulation.R
source("simulation-design.md")

# Setup parallel processing
library(parallel)
n_cores <- detectCores()
cl <- makeCluster(n_cores)

# Export functions to cluster
clusterExport(cl, c("generate_data", "analyze_mediation"),
              envir = environment())

# Run full simulation (all 32 scenarios)
scenarios <- expand.grid(
  n = c(50, 100, 200, 500),
  effect_size = c(0, 0.1, 0.3, 0.5),
  method = c("percentile", "bca")
)

# Execute (may take 2-4 hours depending on hardware)
system.time({
  results <- parLapply(cl, 1:nrow(scenarios), function(i) {
    row <- scenarios[i, ]
    simulate_scenario(
      n = row$n,
      effect_size = row$effect_size,
      method = row$method,
      R = 5000
    )
  })
})

stopCluster(cl)

# Save results
all_results <- bind_rows(results)
write.csv(all_results, "results/simulation-results.csv", row.names = FALSE)
saveRDS(all_results, "results/simulation-results.rds")

# Verify data quality
cat("Total observations:", nrow(all_results), "\n")
cat("Scenarios:", nrow(scenarios), "\n")
cat("Convergence rate:", mean(all_results$convergence), "\n")
```

**Step 3.2: Backup and Version Control**

```bash
# Commit results to git (use Git LFS for large files)
git lfs track "*.rds"
git add results/simulation-results.rds results/simulation-results.csv
git commit -m "Add full simulation results (5000 reps × 32 scenarios)"
git push
```

**Week 7-8: Analyze Results**

**Step 3.3: Simulation Analysis**

```bash
# Analyze simulation results with Scholar
/research:simulation:analysis results/simulation-results.csv
```

**Output provides:**

- Performance summary tables
- Coverage rates by scenario
- Bias and RMSE calculations
- Method comparisons
- Publication-quality plot code (ggplot2)
- Interpretation guidance

**Save analysis:**

```bash
/research:simulation:analysis results/simulation-results.csv > results/analysis-report.md
```

**Step 3.4: Generate Figures**

Run the ggplot2 code from analysis output:

```r
# figures.R
library(ggplot2)
library(dplyr)

# Load results
results <- read.csv("results/simulation-results.csv")

# Coverage plot (from analysis output)
coverage_plot <- results %>%
  group_by(method, n) %>%
  summarize(
    coverage = mean(ci_lower <= true_theta & ci_upper >= true_theta),
    se = sqrt(coverage * (1 - coverage) / n())
  ) %>%
  ggplot(aes(x = n, y = coverage, color = method)) +
  geom_line(size = 1.2) +
  geom_point(size = 3) +
  geom_hline(yintercept = 0.95, linetype = "dashed") +
  geom_ribbon(aes(ymin = coverage - 1.96*se, ymax = coverage + 1.96*se,
                  fill = method), alpha = 0.15, color = NA) +
  scale_y_continuous(limits = c(0.88, 0.98)) +
  labs(
    title = "Coverage Rates: Bootstrap Percentile vs BCa",
    x = "Sample Size (n)",
    y = "Coverage Probability"
  ) +
  theme_minimal()

ggsave("figures/coverage-plot.pdf", coverage_plot, width = 8, height = 6)

# Additional plots: RMSE, power, etc.
# (Use code from analysis output)
```

### Deliverables (End of Week 8)

- [ ] Full simulation executed successfully
- [ ] Results saved (CSV and RDS formats)
- [ ] Analysis report generated
- [ ] Publication-quality figures created
- [ ] Results backed up and version controlled

---

## Phase 4: Results Writing (Week 9-10)

### Draft Results Section

**Week 9: Generate Results Text**

**Step 4.1: Write Results Section**

```bash
# Generate results section from simulation analysis
/research:manuscript:results "Monte Carlo simulation comparing bootstrap percentile vs BCa for mediation confidence intervals. Key findings: Coverage rates - Percentile: 0.89-0.95 across n=50-500, BCa: 0.93-0.96 (consistently near nominal). Percentile under-covers at n=50 (0.89) and n=100 (0.94). BCa maintains nominal coverage for all n. Interval width: BCa 3-4% wider than percentile. Power: Similar across methods. Recommendation: Use BCa for n<200, either method acceptable for n≥200."
```

**Output provides:**

- Descriptive statistics summary
- Primary findings with statistics
- Secondary analyses
- Table recommendations
- Figure descriptions
- Interpretation of results

**Save results:**

```bash
/research:manuscript:results "..." > results/results-section-draft1.md
```

**Step 4.2: Create Results Tables**

Based on analysis output, create publication tables:

```r
# tables.R
library(dplyr)
library(knitr)
library(kableExtra)

results <- read.csv("results/simulation-results.csv")

# Table 1: Coverage Rates
coverage_table <- results %>%
  group_by(method, n) %>%
  summarize(coverage = mean(ci_lower <= true_theta & ci_upper >= true_theta)) %>%
  pivot_wider(names_from = method, values_from = coverage) %>%
  kable(
    caption = "Coverage Rates for 95% Confidence Intervals",
    digits = 3,
    col.names = c("Sample Size", "Percentile", "BCa")
  ) %>%
  kable_styling(bootstrap_options = c("striped", "hover"))

# Save as LaTeX
cat(coverage_table, file = "results/table1-coverage.tex")

# Table 2: Average CI Width
# Table 3: Bias and RMSE
# (Similar structure)
```

**Week 10: Refine Results**

**Step 4.3: Iterate on Results Section**

```bash
# Version 2: Add more detail based on co-author feedback
/research:manuscript:results "Previous prompt + Add sensitivity analysis results for skewed distribution: Coverage for skewed data: Percentile 0.87-0.93, BCa 0.91-0.95. BCa maintains better coverage under non-normality. Include comparison to existing literature (cite MacKinnon 2020): Our findings replicate coverage issues with percentile method in small samples."

# Save refined version
/research:manuscript:results "..." > results/results-section-draft2.md
```

### Deliverables (End of Week 10)

- [ ] Results section drafted
- [ ] Results tables created (LaTeX and/or Markdown)
- [ ] Figures finalized with captions
- [ ] Interpretation matches analysis findings
- [ ] Co-authors reviewed results (if applicable)

---

## Phase 5: Review & Revision (Week 11-12) {#phase-5-review-revision-week-11-12}

### Internal Review

**Week 11: Proof Validation**

**Step 5.1: Validate Theoretical Proofs**

If your paper includes mathematical proofs (Appendix):

```bash
# Validate proof of consistency
/research:manuscript:proof "Theorem 1: Under regularity conditions A1-A5, the bootstrap BCa estimator θ̂_{BCa} is consistent for θ. Proof: By the LLN, the bootstrap distribution converges to the sampling distribution. The BCa correction adjusts for bias and skewness via bias correction z₀ = Φ⁻¹(P(θ̂* < θ̂)) and acceleration a = (1/6)Σᵢ(θ̂₍ᵢ₎ - θ̂̄)³ / [Σᵢ(θ̂₍ᵢ₎ - θ̂̄)²]^(3/2). Under continuity of quantiles, the corrected percentiles converge to the correct coverage level."
```

**Output provides:**

- Logical structure assessment
- Assumption verification
- Completeness check
- Notation consistency review
- Suggested improvements

**Step 5.2: Incorporate Proof Feedback**

```bash
# If proof validation identifies gaps, regenerate with fixes
/research:manuscript:proof "[Revised proof text with explicit assumptions A1-A5 stated, continuity of quantiles justified, convergence mode specified]"

# Iterate until validation passes
```

**Week 12: Manuscript Assembly**

**Step 5.3: Combine All Sections**

Create complete manuscript:

```bash
# manuscript-build.sh
#!/bin/bash

cat > manuscript/draft.md << 'EOF'
# Bootstrap Confidence Intervals for Mediation Analysis: A Simulation Study

## Abstract
[Write 150-250 word abstract]

## Introduction
[Write introduction citing literature from references.bib]

EOF

# Append methods section
cat methods/methods-section-draft2.md >> manuscript/draft.md

# Append results section
cat results/results-section-draft2.md >> manuscript/draft.md

# Append discussion
cat discussion/discussion-section.md >> manuscript/draft.md

# Compile to PDF with Pandoc
pandoc manuscript/draft.md \
  --bibliography references.bib \
  --csl american-psychological-association.csl \
  -o manuscript/draft.pdf
```

**Step 5.4: Proof Read and Polish**

```bash
# Check manuscript for:
# - [ ] All citations in references.bib
# - [ ] All figures referenced in text
# - [ ] All tables numbered correctly
# - [ ] Methods match analysis plan
# - [ ] Results match simulation output
# - [ ] Discussion addresses research question

# Commit final pre-submission draft
git add manuscript/draft.pdf manuscript/draft.md
git commit -m "Final draft before submission"
```

### Deliverables (End of Week 12)

- [ ] Complete manuscript draft (PDF)
- [ ] All proofs validated
- [ ] Figures and tables polished
- [ ] References complete and formatted
- [ ] Manuscript reviewed by co-authors
- [ ] Ready for journal submission

---

## Phase 6: Submission & Peer Review (Week 13+) {#phase-6-submission-peer-review-week-13}

### Journal Submission

**Week 13: Submission**

**Step 6.1: Select Target Journal**

Identify appropriate journal based on:

- Scope matches your topic (methodological vs. applied)
- Impact factor and prestige
- Turnaround time
- Open access options

**Typical targets for simulation studies:**

- *Psychological Methods* (methodological focus)
- *Journal of Statistical Software* (software implementation)
- *Behavior Research Methods* (broader audience)
- *Multivariate Behavioral Research* (mediation focus)

**Step 6.2: Format for Journal**

Each journal has specific requirements. Common tasks:

```bash
# Convert to journal-specific format
# Example: APA 7th edition for Psychological Methods

# Install journal CSL file
curl -o apa.csl https://raw.githubusercontent.com/citation-style-language/styles/master/apa.csl

# Rebuild with journal style
pandoc manuscript/draft.md \
  --bibliography references.bib \
  --csl apa.csl \
  --template apa-template.tex \
  -o manuscript/submission.pdf
```

**Step 6.3: Submit via Journal Portal**

Upload:

- Manuscript PDF
- Figures (separate files, high resolution)
- Tables (separate files or embedded)
- Supplementary materials (code, extended results)
- Cover letter

### Peer Review Process

**Weeks 14-20: Under Review**

Wait for reviewer comments (typical: 6-12 weeks).

**Step 6.4: Receive Reviewer Comments**

When you get reviews, organize them:

```bash
# Create reviewer response directory
mkdir -p reviews/round1/

# Save reviewer comments
cat > reviews/round1/reviewer-comments.txt << 'EOF'
Reviewer 1:
- Comment 1: Sample size seems small for detecting coverage differences
- Comment 2: Why not compare to Sobel test as well?
- Comment 3: Add sensitivity analysis for non-normality

Reviewer 2:
- Comment 1: Methods section should include power analysis
- Comment 2: Results should report effect sizes
- Comment 3: Discussion should address practical implications

Reviewer 3:
- Comment 1: Excellent study design
- Comment 2: Minor: Figure 1 caption is unclear
EOF
```

**Step 6.5: Generate Responses**

Use `/research:manuscript:reviewer` for each comment:

```bash
# Reviewer 1, Comment 1
/research:manuscript:reviewer "Reviewer 1: The sample size of N=150 seems small for mediation analysis. The authors should provide a power analysis or justify why this sample size is adequate."

# Save response
/research:manuscript:reviewer "..." > reviews/round1/response-R1-C1.md

# Reviewer 1, Comment 2
/research:manuscript:reviewer "Reviewer 1: Why not compare bootstrap methods to the Sobel test, which is more standard?"

# Save response
/research:manuscript:reviewer "..." > reviews/round1/response-R1-C2.md

# Repeat for all comments
```

**Step 6.6: Implement Revisions**

Based on responses, make manuscript changes:

```bash
# Add power analysis as requested
/research:manuscript:methods "Add to previous methods: Power analysis using approach of Schoemann et al. (2017). Target power: 0.80 for detecting indirect effect of 0.25. Sample size n=150 provides power = 0.82 for this effect size. Monte Carlo simulation (5,000 reps) confirms adequate power."

# Save updated methods
/research:manuscript:methods "..." > methods/methods-section-revision1.md

# Run additional analysis (Sobel test comparison)
# Add results to manuscript

# Update results section
/research:manuscript:results "Add Sobel test comparison: Coverage for Sobel test: 0.87-0.92 (under-covers relative to bootstrap). Bootstrap BCa superior to both percentile and Sobel methods."

# Save updated results
/research:manuscript:results "..." > results/results-section-revision1.md
```

**Step 6.7: Compile Response Letter**

```bash
# response-letter.md
cat > reviews/round1/response-letter.md << 'EOF'
# Response to Reviewers

Dear Editor,

Thank you for the opportunity to revise our manuscript. We have carefully
addressed all reviewer comments and believe the manuscript is substantially
improved. Below we provide point-by-point responses.

---

## Reviewer 1

### Comment 1.1: Sample Size Justification

**Reviewer Comment:**
"The sample size of N=150 seems small for mediation analysis. The authors
should provide a power analysis or justify why this sample size is adequate."

**Response:**

We appreciate this important comment about statistical power. We have now
added a comprehensive power analysis to the revised manuscript.

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

**Changes Made:**

1. Added power analysis section to Methods (Page 9, Lines 267-285)
2. Added Table 2: Power Analysis Results
3. Cited Schoemann et al. (2017) power analysis approach

[Continue for all comments...]

EOF

# Combine individual responses
cat reviews/round1/response-R1-C1.md >> reviews/round1/response-letter.md
cat reviews/round1/response-R1-C2.md >> reviews/round1/response-letter.md
# ... etc
```

**Step 6.8: Resubmit Revised Manuscript**

```bash
# Rebuild manuscript with revisions
./manuscript-build.sh

# Commit revision
git add manuscript/ methods/ results/ reviews/
git commit -m "Revision 1: Address reviewer comments"
git tag revision1

# Submit via journal portal
```

### Acceptance

**Weeks 21-24: Final Decision**

Possible outcomes:

- **Accept:** Proceed to production
- **Minor revisions:** Quick fixes, resubmit
- **Major revisions:** Substantial changes, another review round
- **Reject:** Consider alternative journal

If accepted:

```bash
# Celebrate!
# Prepare final files for production
# Submit copyright forms
# Prepare data/code for public repository

# Archive final version
git tag accepted
git push --tags
```

### Deliverables (End of Peer Review)

- [ ] Reviewer comments addressed systematically
- [ ] Response letter complete
- [ ] Manuscript revised based on feedback
- [ ] Additional analyses conducted (if requested)
- [ ] Resubmitted to journal
- [ ] Final acceptance received

---

## Automation & Efficiency {#automation-efficiency}

### Shell Scripts for Repeated Tasks

**Script 1: Literature Collection**

```bash
#!/bin/bash
# collect-literature.sh

TOPIC="$1"
BIBFILE="${2:-references.bib}"

echo "Collecting literature on: $TOPIC"

# Search arXiv
/research:arxiv "$TOPIC" > arxiv-results.txt

# Extract DOIs
grep "DOI:" arxiv-results.txt | cut -d' ' -f2 > dois.txt

# Fetch each DOI and add to bibliography
while read doi; do
  echo "Fetching $doi..."
  /research:doi "$doi" > temp.bib
  /research:bib:add temp.bib "$BIBFILE"
  rm temp.bib
done < dois.txt

# Cleanup
rm arxiv-results.txt dois.txt

echo "Added $(grep -c '@' $BIBFILE) entries to $BIBFILE"
```

**Usage:**

```bash
chmod +x collect-literature.sh
./collect-literature.sh "bootstrap mediation" references.bib
```

**Script 2: Methods Generation**

```bash
#!/bin/bash
# generate-methods.sh

DESCRIPTION="$1"
OUTPUT_FILE="${2:-methods/methods-draft.md}"

echo "Generating methods section..."

/research:manuscript:methods "$DESCRIPTION" > "$OUTPUT_FILE"

echo "Methods section saved to: $OUTPUT_FILE"

# Automatically open in editor
if command -v code &> /dev/null; then
  code "$OUTPUT_FILE"
elif command -v vim &> /dev/null; then
  vim "$OUTPUT_FILE"
fi
```

**Usage:**

```bash
./generate-methods.sh "Monte Carlo simulation comparing bootstrap methods for mediation CI" methods/draft1.md
```

**Script 3: Reviewer Response Generator**

```bash
#!/bin/bash
# respond-to-reviewers.sh

COMMENTS_FILE="$1"
OUTPUT_DIR="${2:-reviews/responses/}"

mkdir -p "$OUTPUT_DIR"

# Read comments file (one comment per line, prefixed with reviewer number)
while IFS= read -r line; do
  # Extract reviewer number and comment
  reviewer=$(echo "$line" | cut -d: -f1)
  comment=$(echo "$line" | cut -d: -f2-)

  # Generate response
  response_file="${OUTPUT_DIR}/response-${reviewer}.md"
  /research:manuscript:reviewer "$comment" > "$response_file"

  echo "Generated response for $reviewer"
done < "$COMMENTS_FILE"

echo "All responses saved to $OUTPUT_DIR"
```

**Usage:**

```bash
# Create comments file
cat > reviewer-comments.txt << 'EOF'
R1-C1: Sample size seems inadequate for mediation analysis
R1-C2: Why not compare to Sobel test?
R2-C1: Add sensitivity analysis for non-normality
R2-C2: Results should include effect sizes
EOF

./respond-to-reviewers.sh reviewer-comments.txt reviews/round1/
```

### Template Reuse

**Create reusable templates for common scenarios:**

```bash
# ~/.scholar-templates.sh

# Template: Simulation study methods
simulation_methods() {
  local method="$1"
  local sample_sizes="$2"
  local replications="${3:-5000}"

  /research:manuscript:methods "Monte Carlo simulation study comparing $method. Sample sizes: $sample_sizes. Replications: $replications per scenario. Bootstrap: 5,000 resamples. Performance metrics: coverage, bias, RMSE. R version 4.3.0."
}

# Template: Results for simulation
simulation_results() {
  local findings="$1"

  /research:manuscript:results "Monte Carlo simulation results. $findings Include performance tables (bias, RMSE, coverage by sample size and method). Recommend method based on overall performance."
}

# Template: Power analysis
power_analysis() {
  local n="$1"
  local effect="$2"

  /research:manuscript:methods "Add power analysis for n=$n detecting effect size d=$effect. Use Schoemann et al. (2017) approach. Report power with 95% CI from simulation (5,000 reps)."
}

# Source in your .zshrc or .bashrc
```

**Usage:**

```bash
source ~/.scholar-templates.sh

simulation_methods "bootstrap percentile vs BCa" "50, 100, 200, 500" 5000
simulation_results "BCa superior to percentile for n<200. Coverage: BCa 0.93-0.96, Percentile 0.89-0.95."
power_analysis 150 0.25
```

### Batch Processing

**Process multiple sections simultaneously:**

```bash
# batch-manuscript.sh
#!/bin/bash

# Generate all manuscript sections in parallel

(
  /research:manuscript:methods "simulation study" > methods.md
) &

(
  /research:manuscript:results "simulation findings" > results.md
) &

(
  /research:manuscript:proof "consistency theorem" > proof.md
) &

# Wait for all background jobs to complete
wait

echo "All sections generated:"
ls -lh methods.md results.md proof.md
```

### LaTeX Automation

**Automate LaTeX compilation and integration:**

```bash
# build-manuscript.sh
#!/bin/bash

PROJECT_DIR="$(pwd)"
MANUSCRIPT_DIR="$PROJECT_DIR/manuscript"

# Generate sections
/research:manuscript:methods "[your methods description]" > "$MANUSCRIPT_DIR/methods.tex"
/research:manuscript:results "[your results description]" > "$MANUSCRIPT_DIR/results.tex"

# Build main manuscript
cd "$MANUSCRIPT_DIR"

# Compile with BibTeX
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex  # Second pass for references

# Open PDF
if [[ "$OSTYPE" == "darwin"* ]]; then
  open main.pdf
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open main.pdf
fi

echo "Manuscript built: $MANUSCRIPT_DIR/main.pdf"
```

**LaTeX main.tex template:**

```latex
\documentclass[12pt]{article}

\usepackage{amsmath, amssymb}
\usepackage{graphicx}
\usepackage{natbib}

\title{Bootstrap Confidence Intervals for Mediation Analysis}
\author{Your Name}
\date{\today}

\begin{document}

\maketitle

\begin{abstract}
[Your abstract here]
\end{abstract}

\section{Introduction}
[Your introduction here]

\section{Methods}
\input{methods}  % Generated by Scholar

\section{Results}
\input{results}  % Generated by Scholar

\section{Discussion}
[Your discussion here]

\bibliographystyle{apa}
\bibliography{references}

\end{document}
```

---

## Collaboration Workflows

### Multi-Author Coordination

**Workflow for teams:**

**Role 1: Statistical Methods Lead**

```bash
# Person A: Generate methods section
/research:manuscript:methods "[statistical approach]" > methods-draft-A.md

# Commit to shared repository
git add methods-draft-A.md
git commit -m "Initial methods draft (Author A)"
git push
```

**Role 2: Empirical Analysis Lead**

```bash
# Person B: Generate results section
git pull  # Get latest changes
/research:manuscript:results "[findings]" > results-draft-B.md

git add results-draft-B.md
git commit -m "Initial results draft (Author B)"
git push
```

**Role 3: Handling Revisions**

```bash
# Person C: Respond to reviewers
git pull
/research:manuscript:reviewer "Reviewer 1 comment" > response-R1.md
/research:manuscript:reviewer "Reviewer 2 comment" > response-R2.md

git add response-*.md
git commit -m "Reviewer responses (Author C)"
git push
```

**Role 4: Theory/Appendix Lead**

```bash
# Person D: Validate proofs
git pull
/research:manuscript:proof "[proof text]" > proof-validation.md

git add proof-validation.md
git commit -m "Proof validation (Author D)"
git push
```

### Coordination Checklist

**Before writing:**

- [ ] Assign specific sections to each author
- [ ] Agree on notation conventions
- [ ] Decide on citation style
- [ ] Set up shared Git repository
- [ ] Establish review timeline

**During writing:**

- [ ] Regular meetings (weekly) to sync progress
- [ ] Use Git branches for major changes
- [ ] Review each other's sections before merging
- [ ] Maintain shared bibliography file
- [ ] Keep changelog of major decisions

**Before submission:**

- [ ] All authors review complete manuscript
- [ ] Notation consistent across sections
- [ ] All references formatted correctly
- [ ] Figures and tables numbered consistently
- [ ] Supplementary materials complete

### Version Control Best Practices

**Git workflow for manuscripts:**

```bash
# Main branch: stable drafts
# Feature branches: experiments or major revisions

# Create feature branch for major revision
git checkout -b revision-sensitivity-analysis

# Make changes
/research:manuscript:methods "Add sensitivity analysis section"
/research:manuscript:results "Add sensitivity results"

# Commit
git add methods/ results/
git commit -m "Add sensitivity analysis (Reviewer 1 request)"

# Merge back to main when approved by co-authors
git checkout main
git merge revision-sensitivity-analysis
git push

# Tag important milestones
git tag submission-v1
git tag revision1
git tag accepted
git push --tags
```

---

## Best Practices

### Reproducible Research Practices

**1. Document Everything**

```bash
# Project README.md
cat > README.md << 'EOF'
# Bootstrap Mediation Analysis Study

## Authors
- Jane Doe (lead, analysis)
- John Smith (co-author, methods)

## Abstract
[Brief summary]

## Project Structure
- `data/`: Raw data (excluded from Git for privacy)
- `analysis/`: R scripts for analysis
- `results/`: Analysis output (CSVs, plots)
- `manuscript/`: LaTeX files
- `reviews/`: Reviewer comments and responses

## Reproducibility
To reproduce results:
1. Install R 4.3.0 and required packages (see `requirements.R`)
2. Run `analysis/simulation.R` (takes ~2 hours on 8-core machine)
3. Output saved to `results/simulation-results.csv`
4. Run `analysis/figures.R` to regenerate plots

## Citation
[Published citation when available]
EOF
```

**2. Version Software and Dependencies**

```r
# requirements.R
# Document exact package versions for reproducibility

# CRAN packages
install.packages("boot", version = "1.3-28")
install.packages("dplyr", version = "1.0.10")
install.packages("ggplot2", version = "3.4.0")

# Save session info
sink("session-info.txt")
sessionInfo()
sink()
```

**3. Use Random Seeds**

```r
# simulation.R
# Set seed for reproducibility
set.seed(20240131)  # Use YYYYMMDD format

# Run simulation
results <- simulate_study(...)

# Document seed in manuscript methods section
# "We set the random seed to 20240131 for reproducibility."
```

**4. Archive Code and Data**

```bash
# When manuscript is accepted, archive to public repository

# Create archive
tar -czf mediation-study-archive.tar.gz \
  analysis/ \
  results/ \
  manuscript/ \
  references.bib \
  README.md \
  requirements.R

# Upload to OSF, Zenodo, or GitHub release
# Include DOI in manuscript
```

### Data Management

**Organize data files clearly:**

```
data/
├── raw/                    # Original data (never modify)
│   └── study-data.csv
├── processed/              # Cleaned data
│   └── study-data-clean.csv
├── simulation/             # Simulation results
│   ├── pilot-results.rds
│   └── full-results.rds
└── README.md               # Data dictionary
```

**Create data dictionary:**

```bash
cat > data/README.md << 'EOF'
# Data Dictionary

## study-data.csv

| Variable | Type | Description | Range |
|----------|------|-------------|-------|
| id | integer | Participant ID | 1-500 |
| treatment | binary | Treatment assignment (0=control, 1=intervention) | {0, 1} |
| mediator | continuous | Social support score (MSPSS) | 1-7 |
| outcome | continuous | Depression score (BDI-II) | 0-63 |

## simulation-results.rds

Monte Carlo simulation output. Each row is one replication.

| Variable | Type | Description |
|----------|------|-------------|
| scenario_id | integer | Scenario identifier |
| n | integer | Sample size |
| method | character | CI method (percentile, bca) |
| estimate | numeric | Point estimate of indirect effect |
| ci_lower | numeric | CI lower bound |
| ci_upper | numeric | CI upper bound |
EOF
```

### Code Documentation

**Document all analysis code:**

```r
# simulation.R

#' Bootstrap Mediation Simulation Study
#'
#' Compare coverage of bootstrap percentile vs BCa confidence intervals
#' for indirect effects in mediation analysis.
#'
#' @author Jane Doe
#' @date 2024-01-31
#' @version 1.0

# Setup ----
library(boot)
library(dplyr)
library(parallel)

# Parameters ----
SAMPLE_SIZES <- c(50, 100, 200, 500)
EFFECT_SIZES <- c(0, 0.1, 0.3, 0.5)
N_REPS <- 5000
BOOTSTRAP_REPS <- 5000
SEED <- 20240131

#' Generate mediation data
#'
#' @param n Sample size
#' @param alpha Treatment effect on mediator
#' @param beta Mediator effect on outcome
#' @return data.frame with columns z, m, y
generate_data <- function(n, alpha, beta) {
  z <- rbinom(n, 1, 0.5)
  m <- alpha * z + rnorm(n)
  y <- beta * m + 0.1 * z + rnorm(n)
  data.frame(z = z, m = m, y = y)
}

#' Estimate indirect effect with bootstrap CI
#'
#' @param data Data frame with z, m, y
#' @param method CI method ("percentile" or "bca")
#' @param R Number of bootstrap replicates
#' @return list with estimate and ci
analyze <- function(data, method = "percentile", R = 5000) {
  # [Implementation details]
}

# Main simulation ----
set.seed(SEED)

# [Rest of code]
```

### Archive Preparation

**When manuscript is accepted, prepare archive:**

```bash
# archive-prepare.sh
#!/bin/bash

ARCHIVE_DIR="mediation-study-archive"
mkdir -p "$ARCHIVE_DIR"

# Copy essential files
cp -r analysis/ "$ARCHIVE_DIR/"
cp -r results/ "$ARCHIVE_DIR/"
cp -r manuscript/ "$ARCHIVE_DIR/"
cp references.bib "$ARCHIVE_DIR/"
cp README.md "$ARCHIVE_DIR/"
cp requirements.R "$ARCHIVE_DIR/"

# Remove intermediate files
find "$ARCHIVE_DIR" -name "*.aux" -delete
find "$ARCHIVE_DIR" -name "*.log" -delete

# Create compressed archive
tar -czf mediation-study-archive.tar.gz "$ARCHIVE_DIR"

# Generate checksum
sha256sum mediation-study-archive.tar.gz > checksum.txt

echo "Archive ready: mediation-study-archive.tar.gz"
echo "Upload to OSF/Zenodo and include DOI in manuscript"
```

---

## Common Challenges

### Challenge 1: Reviewer Requests for Additional Analyses

**Problem:** Reviewers ask for analysis not in original plan.

**Solution:**

```bash
# Assess feasibility
# - Can it be done with existing data?
# - Does it require new data collection?
# - Is it within scope of the paper?

# If feasible:

# 1. Design additional analysis
/research:analysis-plan "Additional sensitivity analysis for non-normal errors as requested by Reviewer 2"

# 2. Run analysis
# [Execute analysis]

# 3. Generate results
/research:manuscript:results "Sensitivity analysis results: method performance under skewed distribution"

# 4. Respond to reviewer
/research:manuscript:reviewer "Reviewer 2 requests sensitivity analysis for non-normal errors. We have now conducted this analysis (see new Table 3 and Section 3.4). Results show [summary]."

# 5. Update manuscript
# [Add new section]
```

**If not feasible:**

```bash
# Politely decline with justification
/research:manuscript:reviewer "Reviewer 2 requests analysis of longitudinal mediation, which is beyond the scope of this cross-sectional study. We have added a limitation note in Discussion (page 18) and suggest this as future research."
```

### Challenge 2: Methodological Disagreements

**Problem:** Reviewer disagrees with your methodological choice.

**Solution:**

```bash
# Generate evidence-based response
/research:manuscript:reviewer "Reviewer 1 questions our use of bootstrap over Sobel test, arguing Sobel is more standard and computationally simpler."

# Response will include:
# - Acknowledgment of reviewer's perspective
# - Justification with citations (simulation studies showing bootstrap superiority)
# - Offer to add comparison as sensitivity analysis
# - Maintain respectful tone

# If adding comparison:
# Run Sobel test analysis
# Show both methods reach same conclusion
# Justify why bootstrap is preferred (better coverage)
```

### Challenge 3: Tight Deadlines

**Problem:** Need to submit manuscript quickly (e.g., conference deadline).

**Solution:**

**Rapid workflow (7-day sprint):**

```bash
# Day 1-2: Planning
/research:lit-gap "topic"
/research:hypothesis "research question"
/research:analysis-plan "study design"

# Day 3-4: Analysis
# Run simulation (overnight if needed)
/research:simulation:analysis results.csv

# Day 5: Writing
/research:manuscript:methods "..." > methods.md
/research:manuscript:results "..." > results.md

# Day 6: Assembly
# Combine sections, write intro/discussion
pandoc manuscript.md -o manuscript.pdf

# Day 7: Review and submit
# Proofread, co-author review, submit
```

**Prioritize:**

- Focus on core analysis (skip nice-to-have sensitivity checks)
- Use existing figures/tables (don't perfect aesthetics)
- Write concise intro/discussion (expand in revision)

### Challenge 4: Multiple Revisions

**Problem:** Paper goes through 2-3 revision rounds.

**Solution:**

**Track changes systematically:**

```bash
# Version control for revisions
git tag submission-original
git tag revision-round1
git tag revision-round2

# Organize reviewer responses by round
reviews/
├── round1/
│   ├── comments.txt
│   ├── responses.md
│   └── revised-manuscript.pdf
├── round2/
│   ├── comments.txt
│   ├── responses.md
│   └── revised-manuscript.pdf
└── round3/
    └── [if needed]

# Maintain changelog
cat >> CHANGELOG.md << 'EOF'
## Revision Round 2 (2024-03-15)

### Changes
- Added power analysis (Reviewer 1)
- Included Sobel test comparison (Reviewer 1)
- Expanded discussion of limitations (Reviewer 2)
- Fixed Figure 1 caption (Reviewer 3)

### Files modified
- methods/methods-section-v3.md
- results/results-section-v3.md
- discussion/discussion-v2.md
EOF
```

### Challenge 5: Co-author Coordination

**Problem:** Multiple authors with different schedules and writing styles.

**Solution:**

**Clear communication protocol:**

```bash
# 1. Assign sections explicitly
# author-assignments.md
cat > author-assignments.md << 'EOF'
## Author Responsibilities

- **Jane Doe** (lead): Introduction, Discussion, overall coordination
- **John Smith**: Methods section, statistical consultation
- **Alice Johnson**: Results section, figures
- **Bob Williams**: Proof validation, appendix

## Timeline
- Draft due: 2024-02-15
- Internal review: 2024-02-22
- Revisions: 2024-03-01
- Submission: 2024-03-08
EOF

# 2. Schedule regular check-ins
# Weekly 30-minute video call to sync progress

# 3. Use GitHub issues for tracking
gh issue create --title "Methods section: add sensitivity analysis" --assignee john-smith
gh issue create --title "Results: create Table 2" --assignee alice-johnson

# 4. Review process
# Each author reviews others' sections before merging
git checkout -b methods-draft
# [Author writes methods]
git push
gh pr create --title "Methods section draft" --assignee jane-doe
# Jane reviews and approves
gh pr merge
```

---

## Complete Workflow Example

### Scenario: Publishing a Simulation Study Comparing Bootstrap Methods

**Timeline: 12 weeks**

**Week 1: Literature Review**

```bash
# Monday: Identify gap
/research:lit-gap "bootstrap confidence intervals mediation"
# Output: Several papers compare bootstrap methods, but none systematically evaluate BCa vs percentile in small samples

# Tuesday-Wednesday: Collect papers
/research:arxiv "bootstrap mediation"
/research:doi "10.1037/a0036434"  # Pearl on causal mediation
/research:doi "10.18637/jss.v059.i05"  # Tingley mediation package
# [10 more papers]

# Thursday: Build bibliography
/research:bib:add temp.bib references.bib
# Result: 15 key papers in references.bib

# Friday: Formalize hypothesis
/research:hypothesis "Bootstrap BCa achieves nominal coverage for indirect effects in small samples (n=50-100), while percentile method under-covers"
```

**Week 2: Analysis Planning**

```bash
# Monday: Create analysis plan
/research:analysis-plan "Monte Carlo simulation: percentile vs BCa bootstrap for mediation CI. Sample sizes 50-500, effect sizes 0-0.5, 5,000 reps per scenario."
# Save to analysis-plan.md

# Tuesday: Design simulation
/research:simulation:design "Compare bootstrap percentile vs BCa for mediation CI. Sample sizes: 50, 100, 200, 500. Effects: 0, 0.1, 0.3, 0.5. Normal and skewed errors. Metrics: coverage, width."
# Save to simulation-design.md

# Wednesday-Friday: Implement pilot
# Code simulation based on design document
# Run pilot (n=100, 1,000 reps)
# Debug and refine code
```

**Week 3: Methods Writing**

```bash
# Monday: Generate methods section
/research:manuscript:methods "Monte Carlo simulation comparing bootstrap methods. [Details from simulation design]. 5,000 reps, R 4.3.0, boot package."
# Save to methods-draft1.md

# Tuesday: Iterate methods
# Co-author review, add more detail
/research:manuscript:methods "[Revised prompt with more specifics]"
# Save to methods-draft2.md

# Wednesday-Friday: Finalize methods
# Polish notation, add references
# Commit final methods section
```

**Week 4: Execute Simulation**

```bash
# Monday-Thursday: Run full simulation
Rscript full-simulation.R  # 4 hours on 8-core machine
# Save results: simulation-results.csv, simulation-results.rds

# Friday: Verify results
# Check convergence, summarize
/research:simulation:analysis results/simulation-results.csv
# Generate analysis-report.md
```

**Week 5-6: Create Figures and Tables**

```r
# Generate plots using ggplot2 code from analysis
# Table 1: Coverage rates
# Table 2: Average CI width
# Figure 1: Coverage by sample size and method
# Figure 2: RMSE comparison
# Figure 3: Power curves

# Save publication-quality outputs
ggsave("figures/coverage-plot.pdf", width=8, height=6, dpi=300)
```

**Week 7: Results Writing**

```bash
# Monday: Generate results section
/research:manuscript:results "Simulation findings: BCa coverage 0.93-0.96, percentile 0.89-0.95. BCa maintains nominal coverage for all n. Percentile under-covers at n=50 (0.89). BCa 3-4% wider. Recommendation: BCa for n<200."
# Save to results-draft1.md

# Tuesday-Friday: Refine results
# Add interpretation, cross-check with tables
# Co-author review and approval
```

**Week 8-9: Write Introduction and Discussion**

```bash
# No Scholar commands for these sections (creative writing)
# Cite papers from references.bib
# Discuss implications of findings
# Acknowledge limitations
```

**Week 10: Assemble Manuscript**

```bash
# Combine all sections
./manuscript-build.sh

# Generate PDF
pandoc manuscript.md --bibliography references.bib -o manuscript.pdf

# Internal review by all co-authors
```

**Week 11: Proof Validation and Polishing**

```bash
# Validate appendix proofs
/research:manuscript:proof "Consistency of BCa estimator under regularity conditions"

# Proofread entire manuscript
# Check references, figures, tables
# Final polishing
```

**Week 12: Submission**

```bash
# Submit to journal (e.g., Psychological Methods)
# Upload manuscript, figures, supplementary materials
# Wait for reviewer comments (6-12 weeks)
```

**Week 18: Receive Reviews**

```bash
# Generate responses to all comments
/research:manuscript:reviewer "Reviewer 1: Add power analysis"
/research:manuscript:reviewer "Reviewer 2: Compare to Sobel test"
/research:manuscript:reviewer "Reviewer 3: Sensitivity to skewness"

# Implement revisions
# Update methods and results sections
# Resubmit
```

**Week 22: Acceptance**

```bash
# Paper accepted!
# Prepare final files for production
# Archive code and data to OSF
# Celebrate
```

---

## Resources

**Documentation:**

- [Manuscript Commands Reference](../../research/MANUSCRIPT-COMMANDS.md)
- [Simulation Commands Reference](../../research/SIMULATION-COMMANDS.md)
- [Literature Commands Reference](../../research/LITERATURE-COMMANDS.md)
- [Tutorial: Manuscript Writing](../../tutorials/research/manuscript-writing.md)

**Examples:**

- [Example Methods Sections](../../examples/methods-sections.md)
- [Example Results Sections](../../examples/results-sections.md)
- [Example Reviewer Responses](../../examples/reviewer-responses.md)

**Help:**

- [FAQ: Manuscript Writing](../../help/FAQ-research.md)
- [GitHub Issues](https://github.com/Data-Wise/scholar/issues)
- [Discussions](https://github.com/Data-Wise/scholar/discussions)

---

**Document Version:** 2.17.0
**Last Updated:** 2026-02-04
**Author:** Data-Wise Team
**Status:** Complete
**Word Count:** ~12,000
