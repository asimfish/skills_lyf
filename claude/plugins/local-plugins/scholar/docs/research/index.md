# Research with Scholar

**Quick Links:** [Commands](#commands-overview) | [Workflows](#common-workflows) | [Examples](#examples) | [Help](#need-help)

---

## What is Scholar Research?

Scholar provides {{ scholar.research_commands }} specialized AI-powered commands for academic research workflows in statistics and data science. From literature discovery to manuscript writing, simulation studies to research planning, Scholar automates the repetitive parts of research while maintaining statistical rigor and academic standards.

Whether you're conducting a systematic literature review, writing methods sections for a manuscript, designing a Monte Carlo simulation study, or planning a new research project, Scholar's research commands integrate seamlessly with your academic workflow. All commands are designed for researchers who need quick, reliable assistance without leaving their terminal.

---

## Quick Start ⏱️ 5 minutes

Get started with Scholar research commands in three simple steps:

### 1. Installation ⏱️ 2 minutes

```bash
# Install via Homebrew
brew install data-wise/tap/scholar

# Verify installation
scholar --version
```

### 2. Try Your First Command ⏱️ 1 minute

```bash
# Search arXiv for recent papers
/research:arxiv "causal mediation analysis" --recent

# Look up a paper by DOI
/research:doi "10.1080/01621459.2020.1765785"
```

### 3. Explore Workflows ⏱️ 2 minutes

```bash
# Literature review workflow
/research:arxiv "bootstrap confidence intervals"
/research:bib:add entry.bib references.bib

# Manuscript writing workflow
/research:manuscript:methods "Describe the bootstrap mediation analysis"
/research:manuscript:results "Report simulation study findings"

# Simulation study workflow
/research:simulation:design "Compare bootstrap methods for mediation"
/research:simulation:analysis results/simulation.csv
```

**Next Steps:**

- Read the [Quick Reference Card](../refcards/research-commands.md) for all commands
- Follow the [First Literature Search Tutorial](../tutorials/research/first-literature-search.md)
- Explore [Common Workflows](#common-workflows)

---

## Commands Overview

Scholar provides {{ scholar.research_commands }} research commands organized into 4 categories:

### Literature Management (4 commands)

Discover, organize, and manage academic literature with arXiv search, DOI lookup, and BibTeX integration.

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| `/research:arxiv` | Search arXiv for papers | `/research:arxiv "causal mediation" --recent` | 30s |
| `/research:doi` | Look up paper by DOI | `/research:doi 10.1080/01621459.2020.1765785` | 15s |
| `/research:bib:search` | Search BibTeX files | `/research:bib:search "Pearl" references.bib` | 10s |
| `/research:bib:add` | Add entry to bibliography | `/research:bib:add entry.bib references.bib` | 5s |

**Common Use Cases:**

- Systematic literature reviews
- Citation management
- Finding recent methodological advances
- Building bibliographies for manuscripts

→ [Full Literature Commands Reference](LITERATURE-COMMANDS.md)

---

### Manuscript Writing (4 commands)

Write methods sections, results sections, reviewer responses, and review mathematical proofs with statistical rigor.

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| `/research:manuscript:methods` | Write methods section | `/research:manuscript:methods "bootstrap mediation"` | 2-5 min |
| `/research:manuscript:results` | Generate results section | `/research:manuscript:results "simulation findings"` | 2-5 min |
| `/research:manuscript:reviewer` | Respond to reviewers | `/research:manuscript:reviewer "Reviewer 2 comment"` | 3-8 min |
| `/research:manuscript:proof` | Review mathematical proofs | `/research:manuscript:proof "Appendix A proof"` | 2-5 min |

**What You Get:**

**Methods Section:**

- Statistical methodology with proper notation
- Parameter definitions
- Estimation procedures
- Assumption statements

**Results Section:**

- Statistical test results
- Effect sizes with confidence intervals
- Table formatting guidance
- Figure descriptions

**Reviewer Responses:**

- Professional, respectful tone
- Statistical justification
- Additional analysis suggestions
- Revision guidance

**Proof Review:**

- Logical flow validation
- Mathematical rigor check
- Assumption verification
- Completeness assessment

→ [Full Manuscript Commands Reference](MANUSCRIPT-COMMANDS.md)

---

### Simulation Studies (2 commands)

Design Monte Carlo simulations and analyze simulation results with proper performance metrics.

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| `/research:simulation:design` | Design simulation study | `/research:simulation:design "bootstrap methods"` | 3-8 min |
| `/research:simulation:analysis` | Analyze simulation results | `/research:simulation:analysis results.csv` | 2-5 min |

**Simulation Design Includes:**

- Simulation parameters (sample sizes, effect sizes)
- Number of replications
- Performance metrics (bias, MSE, coverage)
- Data generation process
- Analysis plan

**Simulation Analysis Provides:**

- Performance summaries
- Bias and MSE calculations
- Coverage rate analysis
- Visualization code (R/Python)
- Interpretation guidance

→ [Full Simulation Commands Reference](SIMULATION-COMMANDS.md)

---

### Research Planning (4 commands)

Identify literature gaps, generate hypotheses, create analysis plans, and scout statistical methods.

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| `/research:lit-gap` | Identify literature gaps | `/research:lit-gap "unmeasured confounding"` | 2-5 min |
| `/research:hypothesis` | Generate testable hypotheses | `/research:hypothesis "effect heterogeneity"` | 2-4 min |
| `/research:analysis-plan` | Create analysis plan | `/research:analysis-plan "mediation RCT"` | 3-8 min |
| `/research:method-scout` | Evaluate statistical methods | `/research:method-scout "high-dim mediation"` | 2-5 min |

**Research Planning Features:**

**Literature Gap Analysis:**

- Methodological gaps in existing literature
- Application areas needing research
- Research opportunities
- Novel contribution ideas

**Hypothesis Generation:**

- Formal statistical hypotheses (H₀ and H₁)
- Test procedures
- Power considerations
- Sample size guidance

**Analysis Plans:**

- Primary analysis specification
- Secondary analyses
- Sensitivity analyses
- Multiple testing procedures

**Method Scouting:**

- Relevant statistical methods
- R/Python packages
- Key methodological papers
- Implementation guidance

→ [Full Research Planning Reference](RESEARCH-COMMANDS-REFERENCE.md#research-planning)

---

## Common Workflows

### Workflow 1: Literature Review ⏱️ 2-4 hours

**Goal:** Conduct a systematic literature review from topic exploration to citation management.

**Phases:**

1. **Topic Exploration** (30-60 min)
   - Use `/research:arxiv` to find recent papers
   - Use `/research:method-scout` to identify relevant methods

2. **Gap Analysis** (60-90 min)
   - Use `/research:lit-gap` to identify research gaps
   - Use `/research:hypothesis` to generate testable hypotheses

3. **Citation Management** (30-60 min)
   - Use `/research:doi` to get BibTeX entries
   - Use `/research:bib:add` to build bibliography
   - Use `/research:bib:search` to find existing entries

**Example Timeline:**

```
Hour 1: arXiv search + initial reading
Hour 2: Gap analysis + hypothesis generation
Hour 3: Citation collection + bibliography building
Hour 4: Organization + next steps
```

**Tools Used:**

- `/research:arxiv` - Find papers
- `/research:lit-gap` - Identify gaps
- `/research:doi` - Get citations
- `/research:bib:add` - Build bibliography

→ [Full Literature Review Workflow](../workflows/research/literature-review.md)

---

### Workflow 2: Manuscript Writing ⏱️ 8-12 weeks

**Goal:** Write a complete manuscript from methods section to final revision.

**Weekly Timeline:**

**Weeks 1-2: Methods Section**

- Use `/research:manuscript:methods` for methodology
- Write 3-5 drafts with iterative refinement
- Get co-author feedback

**Weeks 3-4: Results Section**

- Use `/research:manuscript:results` for results
- Create tables and figures
- Write result descriptions

**Weeks 5-6: Proof Review**

- Use `/research:manuscript:proof` for mathematical proofs
- Validate assumptions and logic
- Revise technical appendices

**Weeks 7-8: Submission & Revision**

- Submit manuscript
- Receive reviewer comments
- Use `/research:manuscript:reviewer` for responses

**Weeks 9-10: Revisions**

- Address reviewer comments
- Additional analyses if needed
- Resubmit manuscript

**Weeks 11-12: Final Review**

- Copy-editing
- Final proofs
- Acceptance

**Example Gantt Chart:**

```
Week 1-2   [████████████] Methods
Week 3-4   [████████████] Results
Week 5-6   [████████████] Proofs
Week 7-8   [████████] Submit + Reviews
Week 9-10  [████████] Revisions
Week 11-12 [████] Final
```

**Tools Used:**

- `/research:manuscript:methods` - Write methods
- `/research:manuscript:results` - Write results
- `/research:manuscript:proof` - Review proofs
- `/research:manuscript:reviewer` - Respond to reviewers

→ [Full Manuscript Writing Workflow](../workflows/research/manuscript-writing.md)

---

### Workflow 3: Simulation Study ⏱️ 4-8 weeks

**Goal:** Design, implement, and analyze a Monte Carlo simulation study.

**Phases:**

**Week 1: Design Phase** ⏱️ 8-12 hours

- Use `/research:simulation:design` to create study design
- Specify parameters, sample sizes, replications
- Define performance metrics
- Plan computational resources

**Weeks 2-3: Implementation Phase** ⏱️ 20-30 hours

- Write simulation code (R/Python)
- Test with small replications
- Scale to full study
- Monitor computational progress

**Week 4: Analysis Phase** ⏱️ 8-12 hours

- Use `/research:simulation:analysis` for results
- Calculate bias, MSE, coverage
- Create visualizations
- Interpret findings

**Weeks 5-6: Writing Phase** ⏱️ 12-16 hours

- Use `/research:manuscript:methods` for simulation methods
- Use `/research:manuscript:results` for simulation results
- Create tables and figures
- Draft manuscript section

**Weeks 7-8: Revision & Finalization** ⏱️ 8-12 hours

- Additional simulations if needed
- Sensitivity analyses
- Co-author feedback
- Final polishing

**Example Bash Automation:**

```bash
# Design simulation
/research:simulation:design "Compare bootstrap CI methods" > design.md

# Run simulation (R script)
Rscript simulation.R --design design.md --reps 1000 --output results.csv

# Analyze results
/research:simulation:analysis results.csv > analysis.md

# Write methods section
/research:manuscript:methods "$(cat design.md)" > methods.md
```

**Tools Used:**

- `/research:simulation:design` - Design study
- `/research:simulation:analysis` - Analyze results
- `/research:manuscript:methods` - Write methods
- `/research:manuscript:results` - Write results

→ [Full Simulation Study Workflow](../workflows/research/simulation-study.md)

---

## Examples

### Example 1: Literature Search - arXiv to BibTeX

**Goal:** Find recent papers on causal mediation and add to bibliography.

```bash
# Step 1: Search arXiv
/research:arxiv "causal mediation analysis" --recent

# Output:
# 1. "Nonparametric Causal Mediation Analysis"
#    Authors: Pearl, J., et al.
#    arXiv:2401.12345
#    PDF: https://arxiv.org/pdf/2401.12345.pdf

# Step 2: Get BibTeX entry
/research:doi "10.48550/arXiv.2401.12345"

# Output:
# @article{pearl2024nonparametric,
#   title={Nonparametric Causal Mediation Analysis},
#   author={Pearl, Judea and others},
#   journal={arXiv preprint arXiv:2401.12345},
#   year={2024}
# }

# Step 3: Add to bibliography
/research:bib:add pearl2024.bib references.bib

# Success: Added 1 entry to references.bib
```

**Time:** ~2 minutes

---

### Example 2: Methods Section - Statistical Methods for RCT

**Goal:** Write methods section for a randomized controlled trial with mediation analysis.

```bash
/research:manuscript:methods "Describe the statistical methods for a randomized controlled trial examining the indirect effect of a behavioral intervention on depression symptoms mediated by social support. Include the causal mediation analysis framework, estimation procedure using the product-of-coefficients method, bootstrap confidence intervals (10,000 replicates), and sensitivity analysis for unmeasured confounding."
```

**Generated Output:**

```markdown
## Statistical Analysis

### Causal Mediation Framework

We employed the counterfactual framework for causal mediation analysis
(Pearl, 2001; Robins & Greenland, 1992) to decompose the total effect
of the intervention into direct and indirect effects. Let Y denote the
outcome (depression symptoms), M denote the mediator (social support),
and Z denote the binary treatment indicator (Z=1 for intervention,
Z=0 for control).

The total effect (TE) can be decomposed as:

    TE = NDE + NIE

where NDE is the natural direct effect and NIE is the natural indirect
effect (mediated effect).

### Estimation Procedure

We estimated the indirect effect using the product-of-coefficients
method (MacKinnon et al., 2007). Under the sequential ignorability
assumption (Imai et al., 2010), the indirect effect equals:

    θ = α × β

where α is the treatment effect on the mediator and β is the mediator
effect on the outcome adjusting for treatment.

### Statistical Models

**Mediator model:**
    M = α₀ + α₁Z + εₘ

**Outcome model:**
    Y = β₀ + β₁Z + β₂M + εᵧ

### Confidence Intervals

We constructed 95% bootstrap confidence intervals using 10,000 bootstrap
replicates (Efron & Tibshirani, 1994). The percentile method was used
to obtain interval estimates.

### Sensitivity Analysis

We conducted sensitivity analysis for unmeasured confounding using the
approach of Imai et al. (2010), examining how strong unmeasured
confounding would need to be to nullify the observed indirect effect.
```

**Time:** ~3 minutes

---

### Example 3: Simulation Study - Monte Carlo Bias Estimation

**Goal:** Design and analyze a simulation comparing bias of different estimators.

```bash
# Step 1: Design simulation
/research:simulation:design "Compare bias and efficiency of the product-of-coefficients method vs. difference-in-coefficients method for estimating mediated effects in a 2x2 factorial design with sample sizes 50, 100, 200, 500"

# Step 2: Run simulation (external R script)
Rscript simulation.R --config design.json --reps 5000

# Step 3: Analyze results
/research:simulation:analysis results/simulation_results.csv
```

**Generated Analysis:**

```markdown
## Simulation Results

### Performance Summary

| Method | n | Bias | MSE | Coverage (95% CI) |
|--------|---|------|-----|-------------------|
| Product | 50 | 0.012 | 0.045 | 0.932 |
| Product | 100 | 0.008 | 0.021 | 0.941 |
| Product | 200 | 0.004 | 0.010 | 0.947 |
| Product | 500 | 0.002 | 0.004 | 0.950 |
| Difference | 50 | -0.018 | 0.052 | 0.918 |
| Difference | 100 | -0.011 | 0.024 | 0.928 |
| Difference | 200 | -0.006 | 0.011 | 0.939 |
| Difference | 500 | -0.003 | 0.005 | 0.948 |

### Key Findings

1. **Bias:** Both methods show decreasing bias with increasing sample
   size. Product method has slightly lower bias across all conditions.

2. **Efficiency:** MSE decreases at expected n⁻¹ rate for both methods.
   Product method is more efficient for n < 200.

3. **Coverage:** Both methods achieve nominal coverage for n ≥ 200.
   Under-coverage observed for n = 50, particularly for difference
   method.

### Visualization Code (R)

```r
library(ggplot2)
ggplot(results, aes(x = n, y = bias, color = method)) +
  geom_line() +
  geom_point() +
  geom_hline(yintercept = 0, linetype = "dashed") +
  scale_x_log10() +
  labs(title = "Bias Comparison", x = "Sample Size", y = "Bias")
```

```

**Time:** Design 5 min + Run 2 hours + Analysis 3 min = ~2 hours 8 min

---

→ [See all research examples](../examples/research.md)

---

## Need Help?

### Documentation

- **[Quick Reference Card](../refcards/research-commands.md)** - TL;DR for all 14 commands
- **[Full Commands Reference](RESEARCH-COMMANDS-REFERENCE.md)** - Complete documentation (6,000 lines)
- **[Tutorials](../tutorials/research/first-literature-search.md)** - Step-by-step guides
- **[Workflows](../workflows/research/literature-review.md)** - Common research workflows

### Troubleshooting

- **[FAQ](../help/FAQ-research.md)** - Frequently asked questions
- **[Common Issues](../help/COMMON-ISSUES.md#research-commands)** - Error messages and fixes
- **[Troubleshooting](../help/TROUBLESHOOTING-research.md)** - Advanced troubleshooting

### Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/Data-Wise/scholar/issues)
- **Discussions:** [Ask questions or share workflows](https://github.com/Data-Wise/scholar/discussions)

---

## What's Next?

### For First-Time Users
1. Follow the [First Literature Search Tutorial](../tutorials/research/first-literature-search.md)
2. Read the [Quick Reference Card](../refcards/research-commands.md)
3. Try a [simple workflow](#common-workflows)

### For Experienced Users
1. Explore [Advanced Tutorials](../tutorials/advanced/custom-prompts.md)
2. Learn about [Custom Prompts](../tutorials/advanced/custom-prompts.md)
3. Integrate with [flow-cli workflows](../workflows/research/flow-integration.md)

### For Power Users
1. Automate with bash scripts (see [Simulation Workflow](#workflow-3-simulation-study-4-8-weeks))
2. Create custom templates
3. Contribute workflows to the community

---

**Last Updated:** 2026-01-31
**Version:** v2.8.0
**License:** MIT
