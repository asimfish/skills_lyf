---
render_macros: false
---

# Research FAQ

Frequently asked questions about Scholar's research commands, organized by topic.

**Quick Navigation:**

- [General Questions](#general-questions)
- [Literature Management](#literature-management)
- [Manuscript Writing](#manuscript-writing)
- [Simulation Studies](#simulation-studies)
- [Research Planning](#research-planning)
- [Integration & Workflow](#integration-workflow)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

---

## Installation

See [General Questions](#general-questions) section for installation help. For detailed setup instructions, see [Installation & Setup Issues](../help/TROUBLESHOOTING-research.md#installation-setup-issues).

### How do I set up authentication?

See [General Questions](#general-questions) section and [Installation & Setup Issues](../help/TROUBLESHOOTING-research.md#installation-setup-issues) for API key setup.

---

## Responding to Reviewers

See the [Manuscript Commands](../research/MANUSCRIPT-COMMANDS.md) documentation for the `/research:manuscript:reviewer` command which helps generate responses to peer review comments.

---

## General Questions

### What research commands does Scholar provide?

Scholar provides 14 specialized research commands across 4 categories:

**Literature Management (4 commands):**

- `/research:arxiv` - Search arXiv for papers
- `/research:doi` - Look up papers by DOI
- `/research:bib:search` - Search BibTeX files
- `/research:bib:add` - Add entries to bibliography

**Manuscript Writing (4 commands):**

- `/research:manuscript:methods` - Write methods sections
- `/research:manuscript:results` - Generate results sections
- `/research:manuscript:reviewer` - Respond to reviewer comments
- `/research:manuscript:proof` - Review mathematical proofs

**Simulation Studies (2 commands):**

- `/research:simulation:design` - Design Monte Carlo studies
- `/research:simulation:analysis` - Analyze simulation results

**Research Planning (4 commands):**

- `/research:lit-gap` - Identify literature gaps
- `/research:hypothesis` - Generate testable hypotheses
- `/research:analysis-plan` - Create statistical analysis plans
- `/research:method-scout` - Find statistical methods

**See also:** [Research Commands Reference](../research/RESEARCH-COMMANDS-REFERENCE.md) | Run `/scholar:hub research` for a live listing

---

### How do I discover all available commands?

Use `/scholar:hub` to browse all {{ scholar.command_count }} commands (research + teaching) from one place:

```bash
/scholar:hub              # Full overview
/scholar:hub research     # All research commands with descriptions
/scholar:hub analysis-plan  # Details for a specific command
/scholar:hub quick        # Compact one-line reference card
```

The hub detects your project context and suggests relevant commands. See [Scholar Hub Tutorial](../tutorials/getting-started-with-hub.md).

---

### Who should use Scholar research tools?

Scholar is designed for:

**Graduate Students:**

- Literature reviews for dissertations
- Methods sections for thesis chapters
- Simulation studies for methodological research
- Responding to committee feedback

**Academic Researchers:**

- Manuscript preparation for journals
- Grant proposal development
- Research planning and hypothesis generation
- Peer review responses

**Statistical Methodologists:**

- Designing simulation studies
- Comparing estimation methods
- Developing new statistical procedures
- Writing technical appendices

**Data Scientists in Academia:**

- Bridging research and application
- Publishing methodological work
- Literature-informed method selection
- Reproducible research workflows

Scholar is most effective for researchers in statistics, biostatistics, epidemiology, quantitative social sciences, and related fields where statistical rigor and mathematical notation are essential.

---

### How do research commands differ from teaching commands?

Research and teaching commands serve different purposes:

| Aspect | Research Commands | Teaching Commands |
|--------|------------------|-------------------|
| **Audience** | Researchers, peers, reviewers | Students, learners |
| **Tone** | Formal, technical, rigorous | Pedagogical, explanatory |
| **Depth** | Detailed methodology, proofs | Conceptual understanding |
| **Output** | Methods sections, simulations | Exams, quizzes, slides |
| **Citations** | Extensive literature references | Learning objectives |
| **Notation** | Full mathematical rigor | Student-appropriate level |

**Example - Same topic, different commands:**

```bash
# Research: Technical methods section
/research:manuscript:methods "bootstrap mediation analysis"
# Output: Formal statistical methodology with assumptions,
# estimation procedures, mathematical notation, citations

# Teaching: Exam question
/teaching:exam "bootstrap mediation" --level graduate
# Output: Conceptual question testing understanding,
# with multiple-choice or short-answer format
```

**Related commands:**

- Teaching: `/teaching:lecture`, `/teaching:exam`, `/teaching:assignment`
- Research: `/research:manuscript:methods`, `/research:simulation:design`

---

### What statistical methods are supported?

Scholar supports a wide range of statistical methods, with particular strength in:

**Causal Inference:**

- Mediation analysis (direct/indirect effects)
- Propensity score methods
- Instrumental variables
- Difference-in-differences
- Regression discontinuity

**Resampling Methods:**

- Bootstrap (percentile, BCa, studentized)
- Permutation tests
- Cross-validation
- Jackknife

**Regression & GLMs:**

- Linear regression
- Logistic regression
- Poisson regression
- Mixed-effects models
- GEE (generalized estimating equations)

**High-Dimensional Methods:**

- Lasso, ridge, elastic net
- Variable selection
- Dimension reduction
- Regularization

**Bayesian Methods:**

- Prior specification
- MCMC sampling
- Posterior inference
- Model comparison

**Simulation Studies:**

- Monte Carlo simulation
- Performance evaluation (bias, MSE, coverage)
- Power analysis
- Method comparison

**Example - Method scouting:**

```bash
/research:method-scout "causal mediation with unmeasured confounding"
# Returns: Sensitivity analysis methods, R packages, key papers
```

**See also:** [Method Scout Command](../research/RESEARCH-COMMANDS-REFERENCE.md#researchmethod-scout)

---

### How does Scholar ensure academic rigor?

Scholar maintains academic standards through:

**1. Statistical Rigor:**

- Proper notation and mathematical formulation
- Explicit assumptions stated
- Parameter definitions before use
- Estimation procedures detailed step-by-step

**2. Literature Grounding:**

- Citations to foundational papers
- References to methodological validation studies
- Software package citations
- Recent literature integration

**3. Reproducibility:**

- Clear methodology descriptions
- Parameter specifications
- Software version recommendations
- Code templates for simulations

**4. Quality Checks:**

- Assumption verification guidance
- Diagnostic procedures included
- Sensitivity analyses recommended
- Limitations acknowledged

**5. Peer Review Standards:**

- Journal-appropriate formatting
- Statistical reporting standards (APA, etc.)
- Complete effect size reporting
- Confidence interval inclusion

**Example - Methods section output:**

```markdown
## Methods

### Statistical Framework
[High-level overview with citations]

### Assumptions
1. Sequential ignorability (Imai et al., 2010)
2. No unmeasured confounding of M→Y
3. Positivity: P(M|Z,X) > 0 for all X

### Estimation
We estimate the indirect effect using the product-of-coefficients
method (MacKinnon et al., 2007):

θ = α × β

where α is estimated from [model], β from [model]...
```

**Important:** Scholar assists with writing but does not replace statistical expertise. Always verify outputs match your study design and consult with statistical collaborators.

---

### Can Scholar help with qualitative research?

Scholar is optimized for **quantitative research** in statistics and data science. The research commands focus on:

- Statistical methodology
- Mathematical proofs
- Simulation studies
- Quantitative literature (arXiv stat.* categories)

**Limited support for qualitative research:**

**What Scholar can do:**

- Search arXiv for mixed-methods papers
- Help write quantitative portions of mixed-methods studies
- Generate hypotheses for quantitative testing
- Literature management (BibTeX works for all fields)

**What Scholar cannot do:**

- Thematic analysis or coding
- Qualitative data interpretation
- Interview guide development
- Ethnographic methodology

**For mixed-methods researchers:**

```bash
# Use Scholar for quantitative components:
/research:manuscript:methods "quantitative phase: survey analysis"
/research:analysis-plan "quantitative strand of mixed-methods study"

# For qualitative portions: use standard qualitative tools
# (NVivo, Atlas.ti, MAXQDA, etc.)
```

---

## Literature Management

### How do I search for papers?

Use `/research:arxiv` to search the arXiv statistics repository:

**Basic search:**

```bash
/research:arxiv "causal mediation analysis"
```

**Targeted searches:**

```bash
# Recent papers only
/research:arxiv "bootstrap confidence intervals" --recent

# Limit number of results
/research:arxiv "Monte Carlo simulation" --max 10

# Papers since specific year
/research:arxiv "missing data imputation" --since 2023
```

**Search strategies:**

**1. Method-focused:**

```bash
/research:arxiv "bootstrap mediation"
/research:arxiv "Bayesian hierarchical models"
/research:arxiv "propensity score matching"
```

**2. Author search:**

```bash
/research:arxiv "Pearl causal inference"
/research:arxiv "Imai mediation"
```

**3. Concept combination:**

```bash
/research:arxiv "high-dimensional mediation penalization"
/research:arxiv "survival analysis time-varying confounding"
```

**Output includes:**

- Paper title and authors
- Publication date and arXiv ID
- Abstract
- PDF link
- DOI (if available)

**Tips:**

- Start broad, then narrow with specific terms
- Include statistical keywords: "inference", "estimation", "testing"
- Use methodological terms: "bootstrap", "MCMC", "cross-validation"

**See also:** [First Literature Search Tutorial](../tutorials/research/first-literature-search.md)

---

### Can I search by topic or author?

Yes, `/research:arxiv` searches across multiple fields:

**Search by topic:**

```bash
# Statistical topics
/research:arxiv "causal inference"
/research:arxiv "survival analysis"
/research:arxiv "longitudinal data analysis"

# Application areas
/research:arxiv "clinical trials statistics"
/research:arxiv "epidemiological methods"
/research:arxiv "econometric models"
```

**Search by author:**

```bash
# Include author name in query
/research:arxiv "Judea Pearl causality"
/research:arxiv "Kosuke Imai mediation"
/research:arxiv "Bradley Efron bootstrap"

# Multiple authors
/research:arxiv "Pearl Robins causal"
```

**Combined searches:**

```bash
# Author + method
/research:arxiv "Imai sensitivity analysis mediation"

# Topic + methodology
/research:arxiv "mediation analysis machine learning"
```

**Note:** arXiv search covers title, abstract, and author fields. For author-specific searches, combine name with research area for better targeting.

**Alternative for published papers:**

```bash
# Use DOI lookup for specific papers
/research:doi "10.1080/01621459.2020.1765785"
```

---

### How do I get BibTeX entries?

Use `/research:doi` to get formatted BibTeX entries:

**From DOI:**

```bash
/research:doi "10.1080/01621459.2020.1765785"
```

**Output includes ready-to-use BibTeX:**

```bibtex
@article{imai2021causal,
  title={Causal Mediation Analysis After Controlling for Time-Varying Confounding},
  author={Imai, Kosuke and Keele, Luke and Tingley, Dustin and Yamamoto, Teppei},
  journal={Journal of the American Statistical Association},
  volume={116},
  number={534},
  pages={652--665},
  year={2021},
  publisher={Taylor \& Francis},
  doi={10.1080/01621459.2020.1765785}
}
```

**Workflow:**

1. Find paper on arXiv:

   ```bash
   /research:arxiv "mediation analysis"
   ```

2. Copy DOI from results

3. Look up full citation:

   ```bash
   /research:doi "DOI from arXiv"
   ```

4. Copy BibTeX entry

5. Add to bibliography:

   ```bash
   # Save to temp file
   cat > entry.bib << 'EOF'
   [paste BibTeX]
   EOF

   # Add to bibliography
   /research:bib:add entry.bib references.bib
   ```

**Where to find DOIs:**

- arXiv results (when paper is published)
- Journal websites (near title)
- Google Scholar (click "Cite" → "BibTeX")
- CrossRef search: https://search.crossref.org/

**See also:** [Literature Commands Guide](../research/LITERATURE-COMMANDS.md#researchdoi)

---

### What's the difference between /research:arxiv and /research:doi?

These commands serve different purposes in the literature discovery workflow:

| Feature | `/research:arxiv` | `/research:doi` |
|---------|------------------|-----------------|
| **Purpose** | Discover papers | Get full metadata |
| **Input** | Search query | Specific DOI |
| **Scope** | Multiple papers | Single paper |
| **Output** | Titles, abstracts, links | Complete citation + BibTeX |
| **Source** | arXiv repository | CrossRef API |
| **Best for** | Exploration | Citation management |

**Use `/research:arxiv` when:**

- Starting a literature review
- Exploring a new topic
- Finding recent work
- Discovering related papers
- Don't know specific papers yet

**Use `/research:doi` when:**

- You have a specific paper's DOI
- Need formatted citation
- Want BibTeX entry
- Building bibliography
- Verifying citation details

**Typical workflow:**

```bash
# 1. Discover papers (arxiv)
/research:arxiv "bootstrap mediation" --recent

# 2. Get full citations (doi)
/research:doi "10.1080/01621459.2020.1765785"  # From arxiv results

# 3. Add to bibliography
/research:bib:add entry.bib references.bib
```

**Pro tip:** Use `arxiv` for broad discovery, then `doi` for precise citation management.

---

### How do I add papers to my bibliography?

Use `/research:bib:add` to add BibTeX entries to your bibliography file:

**Step-by-step:**

**1. Get BibTeX entry:**

```bash
/research:doi "10.1080/01621459.2020.1765785"
# Copy BibTeX output
```

**2. Save to temporary file:**

```bash
cat > entry.bib << 'EOF'
@article{imai2021causal,
  title={...},
  author={...},
  ...
}
EOF
```

**3. Check for duplicates (recommended):**

```bash
/research:bib:search "Imai 2021" references.bib
```

**4. Add to bibliography:**

```bash
/research:bib:add entry.bib references.bib
```

**5. Verify:**

```bash
/research:bib:search "Imai" references.bib
```

**Batch addition:**

```bash
# Add multiple entries at once
cat > papers.bib << 'EOF'
@article{paper1, ...}
@article{paper2, ...}
@article{paper3, ...}
EOF

/research:bib:add papers.bib references.bib
```

**Safety features:**

- Duplicate detection (warns if key exists)
- Syntax validation (checks BibTeX format)
- Backup creation (saves `.backup` file)
- Confirmation prompts (for overwrites)

**Common workflow:**

```bash
# DOI → BibTeX → Bibliography pipeline
/research:doi "10.xxxx/xxxxx" > temp.bib
/research:bib:add temp.bib references.bib
rm temp.bib
```

**See also:** [Literature Commands Guide](../research/LITERATURE-COMMANDS.md#researchbibadd)

---

### Can I integrate with Zotero/Mendeley?

Yes, Scholar works with all major reference managers:

**Zotero Integration:**

**Option 1: Import Scholar .bib file**

```bash
# In Zotero: File → Import → Select references.bib
# All entries imported to new collection
```

**Option 2: Export from Zotero to Scholar**

```bash
# In Zotero: Right-click collection → Export → BibTeX
# Save as zotero-export.bib

# Add to Scholar bibliography
/research:bib:add zotero-export.bib references.bib --deduplicate
```

**Option 3: Sync workflow**

```bash
# Keep Zotero as primary, Scholar as supplementary
# Export from Zotero periodically
# Use Scholar for quick arXiv searches
```

**Mendeley Integration:**

```bash
# Export from Mendeley
# File → Export → BibTeX (.bib)
# Save as mendeley-export.bib

# Import to Scholar
/research:bib:add mendeley-export.bib references.bib
```

**Papers Integration:**

```bash
# Export from Papers
# Select papers → Export → BibTeX
# Save as papers-export.bib

# Add to Scholar bibliography
/research:bib:add papers-export.bib references.bib
```

**Bidirectional workflow:**

```bash
# Scholar → Zotero:
cp references.bib ~/Dropbox/
# Import in Zotero

# Zotero → Scholar:
# Export from Zotero → zotero.bib
/research:bib:add zotero.bib references.bib --deduplicate
```

**Best practice:** Choose one as your primary reference manager, use Scholar for quick literature discovery and arXiv searches.

**See also:** [Integration Guide](../research/LITERATURE-COMMANDS.md#integration-with-reference-managers)

---

### How do I organize citations?

Scholar supports multiple organization strategies:

**Strategy 1: Single Master File**

One `references.bib` for all your research:

```bash
# Add everything to one file
/research:bib:add paper1.bib ~/Documents/research/references.bib
/research:bib:add paper2.bib ~/Documents/research/references.bib

# Search when needed
/research:bib:search "mediation" ~/Documents/research/references.bib
/research:bib:search "2024" ~/Documents/research/references.bib
```

**Pros:** Simple, one place to search
**Cons:** Can become large (100s-1000s of entries)

**Strategy 2: Project-Specific Files**

One `.bib` file per manuscript/project:

```bash
# Project 1: Mediation manuscript
/research:bib:add paper.bib ~/projects/mediation-ms/references.bib

# Project 2: Simulation study
/research:bib:add paper.bib ~/projects/simulation/references.bib

# Project 3: Review paper
/research:bib:add paper.bib ~/projects/review/references.bib
```

**Pros:** Focused, only relevant papers per project
**Cons:** Duplicates across projects, must track multiple files

**Strategy 3: Topic-Based Files**

Organize by research area:

```bash
# By methodology
/research:bib:add paper.bib ~/refs/mediation-refs.bib
/research:bib:add paper.bib ~/refs/bootstrap-refs.bib
/research:bib:add paper.bib ~/refs/causal-inference-refs.bib

# By application
/research:bib:add paper.bib ~/refs/clinical-trials-refs.bib
/research:bib:add paper.bib ~/refs/epidemiology-refs.bib
```

**Pros:** Thematic organization, easy to find related work
**Cons:** Papers may fit multiple categories

**Search across all files:**

```bash
# Find paper in any .bib file
/research:bib:search "Pearl" ~/refs/**/*.bib
/research:bib:search "2024" ~/Documents/**/*.bib
```

**Recommended approach:**

- **Master file:** Keep all papers in `~/Documents/research/references.bib`
- **Project copies:** Copy relevant entries to project-specific files
- **Version control:** Track all `.bib` files in git

**See also:** [Best Practices](../research/LITERATURE-COMMANDS.md#best-practices)

---

### What citation formats are supported?

Scholar outputs **BibTeX format** by default, which is compatible with:

**LaTeX/BibTeX:**

```latex
\documentclass{article}
\usepackage{natbib}

\begin{document}
As shown by \citet{imai2021causal}, mediation analysis...

\bibliographystyle{apalike}
\bibliography{references}
\end{document}
```

**Quarto/R Markdown:**

```yaml
---
title: "My Paper"
bibliography: references.bib
csl: apa.csl
---

As shown by @imai2021causal, mediation analysis...
```

**Pandoc:**

```bash
pandoc paper.md --bibliography references.bib --csl apa.csl -o paper.pdf
```

**Converting BibTeX to other formats:**

**To RIS (EndNote):**

```bash
# Use online converters or bibutils
bib2xml references.bib | xml2ris > references.ris
```

**To CSL JSON (Zotero):**

```bash
# Import .bib to Zotero, export as CSL JSON
```

**To plain text citations:**

```bash
# Use DOI lookup output (includes formatted citation)
/research:doi "10.xxxx/xxxxx"
# Copy "Citation (APA):" section
```

**Citation styles:**

BibTeX works with any citation style (APA, Chicago, MLA, etc.) via:

- `.bst` files in LaTeX (e.g., `\bibliographystyle{apa}`)
- `.csl` files in Pandoc/Quarto (e.g., `csl: apa.csl`)
- Style settings in reference managers

**See also:** [LaTeX Integration](../workflows/research/manuscript-writing.md)

---

## Manuscript Writing

### How do I write a methods section?

Use `/research:manuscript:methods` with a detailed description of your methodology:

**Basic usage:**

```bash
/research:manuscript:methods "Describe the statistical methods for analyzing mediation in a randomized trial"
```

**Detailed prompt (recommended):**

```bash
/research:manuscript:methods "Describe the bootstrap confidence interval procedure for indirect effects in mediation analysis. Include: (1) product-of-coefficients estimation, (2) percentile bootstrap with 10,000 replications, (3) sequential ignorability assumptions, (4) sensitivity analysis for unmeasured confounding"
```

**Output structure:**

```markdown
## Statistical Analysis

### Causal Framework
[Description of causal mediation model with notation]

Let Y denote the outcome, M the mediator, Z the treatment indicator...

### Model Specification
**Mediator model:**
M = α₀ + α₁Z + εₘ

**Outcome model:**
Y = β₀ + β₁Z + β₂M + εᵧ

### Estimation
The indirect effect is estimated as θ = α × β...

### Assumptions
1. Sequential ignorability (Imai et al., 2010)
2. No unmeasured confounding...

### Inference
We constructed 95% bootstrap confidence intervals using 10,000
bootstrap replicates. The percentile method was applied...

### Sensitivity Analysis
We assessed sensitivity to unmeasured confounding using...
```

**Tips for better output:**

**1. Be specific about your design:**

```bash
# Vague
/research:manuscript:methods "regression analysis"

# Better
/research:manuscript:methods "multiple linear regression with bootstrap standard errors, adjusting for baseline covariates age, sex, and BMI"
```

**2. Include sample size and parameters:**

```bash
/research:manuscript:methods "RCT with n=200 participants, 2:1 randomization to treatment vs control, mediation analysis with 10,000 bootstrap replications"
```

**3. Specify statistical details:**

```bash
/research:manuscript:methods "Bayesian mediation analysis with weakly informative priors N(0, 10²) on regression coefficients, 4 MCMC chains with 2000 iterations each, Gelman-Rubin diagnostic < 1.1"
```

**See also:** [Manuscript Commands Guide](../research/MANUSCRIPT-COMMANDS.md)

---

### Can Scholar help with results sections?

Yes, use `/research:manuscript:results` to generate results sections with proper statistical reporting:

**Basic usage:**

```bash
/research:manuscript:results "Report findings from mediation analysis of treatment effects"
```

**Detailed prompt:**

```bash
/research:manuscript:results "Report results from bootstrap mediation analysis: indirect effect = 0.42, 95% CI [0.18, 0.66], p = .03. Direct effect = 0.28, 95% CI [-0.05, 0.61], p = .09. Total effect = 0.70, 95% CI [0.35, 1.05], p < .001. Sample size n=150."
```

**Output includes:**

**1. Formatted results:**

```markdown
## Results

### Descriptive Statistics
Table 1 presents baseline characteristics...

### Primary Analysis
The mediation analysis revealed a statistically significant indirect
effect of treatment on outcome through the mediator (θ = 0.42, 95% CI
[0.18, 0.66], p = .03). This indicates that approximately 60% of the
total effect was mediated.

The direct effect was not statistically significant (θ = 0.28, 95% CI
[-0.05, 0.61], p = .09), suggesting that the treatment effect operates
primarily through the mediator.
```

**2. Table formatting guidance:**

```markdown
**Table 1:** Mediation Analysis Results

| Effect | Estimate | 95% CI | p-value |
|--------|----------|--------|---------|
| Indirect | 0.42 | [0.18, 0.66] | .03 |
| Direct | 0.28 | [-0.05, 0.61] | .09 |
| Total | 0.70 | [0.35, 1.05] | <.001 |
```

**3. Figure descriptions:**

```markdown
**Figure 1:** Path diagram showing treatment effect decomposition.
The indirect path (Z→M→Y) accounts for 60% of the total effect, with
significant mediation through social support (p = .03).
```

**Statistical reporting standards included:**

- Exact p-values (not just "p < .05")
- Effect sizes with confidence intervals
- Sample sizes for each analysis
- Test statistics and degrees of freedom
- Missing data handling description

**See also:** [Results Section Examples](../examples/manuscripts.md#results-sections)

---

### How do I respond to reviewer comments?

Use `/research:manuscript:reviewer` to generate professional, evidence-based responses:

**Basic usage:**

```bash
/research:manuscript:reviewer "Reviewer 2 questions the choice of bootstrap over asymptotic CIs"
```

**Detailed prompt (recommended):**

```bash
/research:manuscript:reviewer "Reviewer 2, Comment 3: The authors use bootstrap confidence intervals but do not justify this choice over asymptotic methods. Please provide statistical justification and compare performance in your sample size range (n=150)"
```

**Output structure:**

```markdown
## Response to Reviewer 2, Comment 3

**Reviewer Comment:**
The authors use bootstrap confidence intervals but do not justify this
choice over asymptotic methods. Please provide statistical justification
and compare performance in your sample size range (n=150).

**Response:**
We thank the reviewer for this important observation. We have now added
justification for our choice of bootstrap confidence intervals in the
Methods section (Page 8, Lines 234-248) and conducted additional analyses
to address this concern.

**Statistical Justification:**
Bootstrap confidence intervals are preferred for mediation analysis
because the sampling distribution of the indirect effect is typically
non-normal, especially for moderate sample sizes (MacKinnon et al., 2004).
For sample sizes like ours (n=150), bootstrap methods have been shown to
provide better coverage rates than asymptotic methods based on the delta
method (Fritz & MacKinnon, 2007).

**Additional Analysis:**
To address the reviewer's concern, we conducted a supplementary simulation
study (new Appendix B) comparing bootstrap and asymptotic CIs for our
sample size (n=150) and effect size (d=0.4). Results show:

- Bootstrap CI coverage: 94.2% (close to nominal 95%)
- Asymptotic CI coverage: 89.1% (under-coverage)
- Bootstrap CI width: 0.48 (slightly wider, more conservative)

These findings support our methodological choice.

**Changes Made:**
1. Added justification in Methods (Page 8, Lines 234-248)
2. Created new Appendix B with simulation study
3. Added citations: MacKinnon et al. (2004), Fritz & MacKinnon (2007)

**References:**
MacKinnon, D. P., Lockwood, C. M., & Williams, J. (2004). Confidence
limits for the indirect effect... Multivariate Behavioral Research,
39(1), 99-128.
```

**Response tone:**

- Professional and respectful
- Acknowledge valid points
- Provide statistical justification
- Offer additional analyses
- Specific page/line references

**See also:** [Reviewer Response Tutorial](../tutorials/research/reviewer-response.md)

---

### Can Scholar review mathematical proofs?

Yes, use `/research:manuscript:proof` to review mathematical proofs for logical correctness and completeness:

**Usage:**

```bash
/research:manuscript:proof "Review the identifiability proof in Appendix A showing that the natural direct and indirect effects are identified under sequential ignorability"
```

**Detailed prompt (recommended):**

```bash
/research:manuscript:proof "Check the proof of Theorem 1: Under assumptions (i) sequential ignorability and (ii) positivity, the natural indirect effect NIE = E[Y(1,M(1)) - Y(1,M(0))] is identified and equals the product of coefficients αβ in the linear SEM. The proof uses the tower property and iterated expectations."
```

**Output - Validation Report:**

```markdown
## Proof Validation: Theorem 1 (Identifiability)

### Overall Assessment
**Status:** PASS with minor suggestions

### Logical Structure ✓
- Proof starts from stated assumptions (sequential ignorability, positivity)
- Each step follows logically from previous
- Conclusion (NIE = αβ) follows from premises

### Mathematical Rigor ✓
- Notation defined before use (Y(z,m), M(z))
- Probabilistic statements precise
- Use of tower property correct
- Iterated expectations properly applied

### Assumptions ✓
- Sequential ignorability stated explicitly
- Positivity requirement noted
- No hidden assumptions detected
- Conditions are sufficient for result

### Completeness - MINOR ISSUES
- Step 3→4: Intermediate algebra could be shown
  Suggestion: Add line showing E[Y(1,M(1))|M] calculation

- Uniqueness not addressed
  Suggestion: Note that identification is point-identified, not set-identified

### Notation ✓
- Consistent use of counterfactual notation
- Clear distinction between observed (Y,M,Z) and potential outcomes Y(z,m)
- Standard conventions followed

### Suggested Improvements
1. **Line 234:** Add intermediate step:
   E[Y(1,M(1))] = E[E[Y(1,M(1))|M(1)]] = E[β₀ + β₁ + β₂M(1)]

2. **Assumption 1:** Clarify that sequential ignorability requires:
   - Y(z,m) ⊥ Z | X  (treatment randomization)
   - Y(z,m) ⊥ M | Z, X  (no unmeasured M→Y confounding)

3. **Completeness:** Add statement that NIE is point-identified (unique value)

### References to Check
- Pearl (2001): Original formulation of natural effects
- Imai et al. (2010): Sequential ignorability formalization
- Robins & Greenland (1992): Identifiability conditions

### Overall Rating
**8/10** - Proof is sound and logically correct. Minor additions would
improve clarity and completeness for readers.
```

**What the proof checker validates:**

1. **Logical flow:** Each step follows from previous
2. **Mathematical correctness:** Equations and inequalities valid
3. **Assumptions:** All stated upfront, no hidden conditions
4. **Completeness:** No gaps in reasoning
5. **Notation:** Consistent and standard usage

**Limitations:**

- Cannot verify computational proofs (simulation-based)
- May miss subtle measure-theoretic issues
- Best used as supplement to peer review, not replacement

**See also:** [Proof Review Examples](../examples/manuscripts.md#proof-checking)

---

### What notation styles are supported?

Scholar uses **standard statistical notation** with LaTeX formatting:

**Supported notation styles:**

**1. Statistical Notation (default):**

```latex
- Parameters: θ, β, α, σ²
- Estimators: θ̂, β̂
- Random variables: X, Y, Z (uppercase)
- Realizations: x, y, z (lowercase)
- Expectations: E[X], Var(X), Cov(X,Y)
- Probability: P(X = x), P(Y|X)
```

**2. Causal Notation:**

```latex
- Potential outcomes: Y(z), Y(z,m)
- Interventions: do(Z=z)
- Counterfactuals: Y_z, Y_{z,m}
- Causal effects: τ = E[Y(1) - Y(0)]
- Conditional independence: X ⊥ Y | Z
```

**3. Matrix Notation:**

```latex
- Vectors: bold lowercase (𝐱, 𝐲, 𝛃)
- Matrices: bold uppercase (𝐗, 𝛀, 𝚺)
- Transpose: 𝐱ᵀ or 𝐱'
- Inverse: 𝐗⁻¹
```

**4. Bayesian Notation:**

```latex
- Priors: π(θ)
- Likelihood: L(θ|𝐲)
- Posterior: p(θ|𝐲) ∝ L(θ|𝐲)π(θ)
- Hyperparameters: α, β (depends on context)
```

**Customizing notation:**

```bash
# Specify notation preference in prompt
/research:manuscript:methods "Use matrix notation with bold uppercase for design matrix X and bold lowercase for parameter vector β. Describe the least squares estimator β̂ = (XᵀX)⁻¹Xᵀy"

# Causal notation
/research:manuscript:methods "Use potential outcomes notation Y(z,m) for causal mediation. Define natural direct effect NDE and natural indirect effect NIE"

# Bayesian notation
/research:manuscript:methods "Use Bayesian notation with π(·) for priors and p(·|𝐲) for posteriors. Include full conditionals for Gibbs sampler"
```

**Output is LaTeX-compatible:**

```markdown
The indirect effect is estimated as:

$$\hat{\theta} = \hat{\alpha} \times \hat{\beta}$$

where $\hat{\alpha}$ is the estimated treatment effect on the mediator
and $\hat{\beta}$ is the estimated mediator effect on the outcome.
```

**See also:** [Mathematical Notation Guide](../research/MANUSCRIPT-COMMANDS.md#notation)

---

### How detailed are the generated sections?

Generated sections are **journal-submission ready** with adjustable detail levels:

**Default detail level:**

- ~500-800 words for methods sections
- ~300-500 words for results sections
- Includes key elements: framework, model, estimation, assumptions, inference
- Journal-appropriate depth (not too superficial, not overly technical)

**Factors affecting detail:**

**1. Prompt specificity:**

```bash
# Brief prompt → concise output
/research:manuscript:methods "bootstrap mediation"

# Detailed prompt → comprehensive output
/research:manuscript:methods "Describe bootstrap mediation analysis including: data generation model, sequential ignorability assumptions, product-of-coefficients estimation, percentile bootstrap procedure with 10,000 replications, bandwidth selection for kernel density estimation, sensitivity analysis using Imai's ρ parameter"
```

**2. Complexity of method:**

- Simple methods (t-test): 300-400 words
- Moderate methods (bootstrap CIs): 500-700 words
- Complex methods (Bayesian hierarchical models): 800-1200 words

**3. Statistical rigor requirements:**

- All outputs include proper notation
- Assumptions always stated
- Estimation procedures detailed
- Citations to key papers included

**Example output lengths:**

**Methods section (bootstrap mediation):**

```markdown
## Statistical Analysis  [~650 words]

### Causal Framework  [~150 words]
[Counterfactual framework, notation, causal estimands]

### Model Specification  [~100 words]
[Mediator model, outcome model, parameter interpretation]

### Assumptions  [~150 words]
[Sequential ignorability, positivity, model assumptions]

### Estimation  [~150 words]
[Product-of-coefficients, implementation details]

### Inference  [~100 words]
[Bootstrap procedure, CI construction]
```

**Results section (simulation study):**

```markdown
## Results  [~500 words]

### Performance Summary  [~200 words]
[Bias, RMSE, coverage across conditions]

### Key Findings  [~200 words]
[Interpretation of performance metrics]

### Visualizations  [~100 words]
[Figure descriptions and code]
```

**Can request more/less detail:**

```bash
# Brief version
/research:manuscript:methods "Provide a brief (300-word) description of bootstrap mediation for supplementary methods"

# Extended version
/research:manuscript:methods "Provide detailed (1000+ word) methods section for bootstrap mediation including full mathematical derivations and computational details"
```

**See also:** [Manuscript Examples](../examples/manuscripts.md)

---

### Can I customize the writing style?

Yes, you can specify tone, audience, and format in your prompts:

**Tone options:**

**Formal/technical (default):**

```bash
/research:manuscript:methods "Describe propensity score matching with formal statistical notation and journal-appropriate language"
```

**Accessible/pedagogical:**

```bash
/research:manuscript:methods "Describe propensity score matching for mixed-methods paper aimed at non-statistician audience. Use minimal notation, focus on intuition"
```

**Applied/practical:**

```bash
/research:manuscript:methods "Describe propensity score matching for applied clinical journal. Emphasize practical implementation, software, diagnostic checks"
```

**Audience specification:**

```bash
# For statisticians
/research:manuscript:methods "Mediation analysis for JASA submission. Full technical details, asymptotic theory, efficiency considerations"

# For subject-matter experts
/research:manuscript:methods "Mediation analysis for epidemiology journal. Causal interpretation, practical considerations, minimal mathematical notation"

# For interdisciplinary journal
/research:manuscript:methods "Mediation analysis for Science/Nature. Balance rigor with accessibility, technical details in supplementary materials"
```

**Format customization:**

```bash
# Markdown (default)
/research:manuscript:methods "..." --format md

# LaTeX
/research:manuscript:methods "..." --format tex

# Plain text
/research:manuscript:methods "..." --format txt
```

**Journal-specific styles:**

```bash
# APA style (psychology/social sciences)
/research:manuscript:results "Report results in APA format with statistical reporting per APA 7th edition guidelines"

# JASA style (statistics)
/research:manuscript:methods "Methods section for JASA: emphasize theoretical properties, asymptotic behavior, technical appendix references"

# BMJ/JAMA style (medical)
/research:manuscript:methods "Clinical trial methods for BMJ: CONSORT guidelines, intention-to-treat analysis, sensitivity analyses"
```

**Example - Same content, different audiences:**

**For statisticians:**

```markdown
We employ the nonparametric bootstrap to construct confidence intervals
for the indirect effect θ = αβ. Under sequential ignorability, θ is
identified and estimated via the product-of-coefficients estimator. The
bootstrap distribution is obtained by resampling observations with
replacement B = 10,000 times, yielding θ̂*₁,...,θ̂*_B. The 95% CI is
constructed using the percentile method: [θ̂*_(0.025), θ̂*_(0.975)].
```

**For applied researchers:**

```markdown
We used bootstrap confidence intervals to test whether the treatment
effect operates through the mediator. Bootstrap is a resampling method
that doesn't assume the indirect effect follows a normal distribution
(which often isn't true for moderate sample sizes). We created 10,000
simulated datasets by randomly sampling from our data with replacement,
calculated the indirect effect in each, and used the middle 95% of values
as our confidence interval.
```

**See also:** [Writing Style Guide](../research/MANUSCRIPT-COMMANDS.md#style-customization)

---

### How do I ensure statistical rigor?

Scholar maintains statistical rigor through built-in quality checks and best practices:

**Automatic quality features:**

**1. Complete methodology description:**

```markdown
✓ Statistical framework defined
✓ Notation introduced before use
✓ Model specifications with equations
✓ Parameter interpretations
✓ Estimation procedures (step-by-step)
✓ Assumptions stated explicitly
✓ Inference methods detailed
```

**2. Proper statistical reporting:**

```markdown
✓ Effect sizes with confidence intervals
✓ Exact p-values (not "p < .05")
✓ Sample sizes for each analysis
✓ Test statistics and df
✓ Missing data handling
✓ Multiple testing corrections
```

**3. Literature grounding:**

```markdown
✓ Citations to foundational papers
✓ Methodological validation studies
✓ Software package citations
✓ Recent advances noted
```

**Your responsibilities:**

**1. Verify outputs match your study:**

```bash
# After generating methods section:
# - Check assumptions match your data
# - Verify sample size/design details
# - Confirm estimation procedure is what you used
# - Update any study-specific details
```

**2. Add study-specific information:**

```bash
# Generated output provides template
# You add:
# - Actual sample sizes
# - Observed effect sizes
# - Your specific covariates
# - Your software/package versions
```

**3. Consult statistical collaborators:**

```bash
# Scholar assists, doesn't replace statistical expertise
# Always have statistical co-authors review:
# - Methodology appropriateness
# - Assumption verification
# - Results interpretation
# - Causal claims
```

**Quality checklist:**

Before submission, verify:

- [ ] All notation defined before use
- [ ] Assumptions stated explicitly and match your study
- [ ] Estimation procedure matches what you implemented
- [ ] Inference method appropriate for your design
- [ ] Sample size and effect sizes match your data
- [ ] Software/packages cited with versions
- [ ] Limitations acknowledged
- [ ] Causal language appropriate (RCT vs observational)
- [ ] Multiple testing addressed if applicable
- [ ] Missing data handling described
- [ ] Sensitivity analyses included
- [ ] Statistical review by qualified collaborator

**Red flags to watch for:**

❌ Claiming causation from observational data without strong assumptions
❌ p-values without effect sizes and CIs
❌ Assumptions not verified (just stated)
❌ Model without diagnostics
❌ Cherry-picked significant results
❌ HARKing (hypothesizing after results known)
❌ Multiple testing without correction
❌ Missing data ignored

**See also:** [Statistical Standards Checklist](../research/MANUSCRIPT-COMMANDS.md#quality-standards)

---

## Simulation Studies

### How do I design a simulation study?

Use `/research:simulation:design` with a clear description of what you want to evaluate:

**Basic usage:**

```bash
/research:simulation:design "Compare bootstrap and asymptotic confidence intervals for mediation effects"
```

**Detailed prompt (recommended):**

```bash
/research:simulation:design "Compare bias, MSE, and coverage of: (1) percentile bootstrap, (2) BCa bootstrap, (3) asymptotic delta method CIs for indirect effects. Sample sizes: 50, 100, 200, 500. Effect sizes: small (0.2), medium (0.5), large (0.8). Data: normal and non-normal (skewed). 5000 replications per condition."
```

**Output includes:**

**1. Research question:**

```markdown
### Research Question
Evaluate performance of three CI methods for indirect effects across
sample sizes and effect sizes.
```

**2. Data generation:**

```markdown
### Data Generation Process

**Parameters:**
- Sample sizes: n ∈ {50, 100, 200, 500}
- Effect sizes: α,β ∈ {0.2, 0.5, 0.8}
- True indirect effect: θ = α × β
- Error distributions: Normal(0,1) and Skewed-t(df=5)

**Model:**
M = α·Z + εₘ,  εₘ ~ N(0, 1)
Y = β·M + τ·Z + εᵧ,  εᵧ ~ N(0, 1)

where Z ~ Bernoulli(0.5) for treatment indicator
```

**3. Methods to compare:**

```markdown
### Estimation Methods

**Method 1: Percentile Bootstrap**
- Resample with replacement B = 1000 times
- Compute θ̂* for each bootstrap sample
- CI: [θ̂*_(0.025), θ̂*_(0.975)]

**Method 2: BCa Bootstrap**
- Bias-corrected and accelerated bootstrap
- Adjust percentiles for bias and skewness

**Method 3: Asymptotic Delta Method**
- θ̂ ~ N(θ, σ²θ) asymptotically
- CI: θ̂ ± 1.96·SE(θ̂)
```

**4. Performance metrics:**

```markdown
### Performance Metrics

**Bias:** E[θ̂] - θ
**RMSE:** √E[(θ̂ - θ)²]
**Coverage:** P(θ ∈ CI)  [target: 0.95]
**CI Width:** Average width of 95% CI
**Power:** P(reject H₀: θ = 0 | θ ≠ 0)
```

**5. Design table:**

```markdown
### Design Factors

| Factor | Levels | Total |
|--------|--------|-------|
| Sample size | 4 | |
| Effect size | 3 | |
| Distribution | 2 | |
| Method | 3 | |
| **Total scenarios** | | **72** |
| **Replications per scenario** | | **5000** |
| **Total simulations** | | **360,000** |
```

**6. R code template:**

```r
# Simulation function
simulate_mediation <- function(n, alpha, beta, dist = "normal") {
  # Generate data
  Z <- rbinom(n, 1, 0.5)
  M <- alpha * Z + rnorm(n)
  Y <- beta * M + 0.2 * Z + rnorm(n)

  # Estimate indirect effect
  fit_m <- lm(M ~ Z)
  fit_y <- lm(Y ~ Z + M)

  alpha_hat <- coef(fit_m)["Z"]
  beta_hat <- coef(fit_y)["M"]
  theta_hat <- alpha_hat * beta_hat

  # Bootstrap CI
  boot_results <- boot::boot(data.frame(Z, M, Y),
                             statistic = indirect_effect,
                             R = 1000)
  boot_ci <- boot::boot.ci(boot_results, type = c("perc", "bca"))

  # Asymptotic CI
  se_theta <- asymptotic_se(fit_m, fit_y)  # Delta method SE
  asym_ci <- theta_hat + c(-1, 1) * 1.96 * se_theta

  return(list(
    theta_hat = theta_hat,
    boot_perc_ci = boot_ci$percent[4:5],
    boot_bca_ci = boot_ci$bca[4:5],
    asym_ci = asym_ci
  ))
}

# Run simulation
results <- expand.grid(
  n = c(50, 100, 200, 500),
  alpha = c(0.2, 0.5, 0.8),
  beta = c(0.2, 0.5, 0.8),
  dist = c("normal", "skewed")
) %>%
  rowwise() %>%
  mutate(
    replicate(5000, simulate_mediation(n, alpha, beta, dist))
  )

saveRDS(results, "simulation_results.rds")
```

**See also:** [Simulation Study Tutorial](../tutorials/research/simulation-study.md)

---

### What parameters should I specify?

Include these key parameters in your simulation design prompt:

**1. Sample sizes:**

```bash
"Sample sizes: n = 50, 100, 200, 500"

# Why vary sample size:
# - Small (50-100): tests performance in realistic scenarios
# - Medium (100-200): typical study sizes
# - Large (500+): asymptotic behavior
```

**2. Effect sizes:**

```bash
"Effect sizes: small (Cohen's d = 0.2), medium (d = 0.5), large (d = 0.8)"
"True indirect effect θ: 0, 0.1, 0.2, 0.3, 0.5"

# Why vary effect size:
# - Null (0): Type I error rate
# - Small: Realistic effect sizes, power
# - Large: Confirm methods work when signal strong
```

**3. Data distributions:**

```bash
"Data: Normal(0,1) and heavy-tailed t(df=5)"
"Error terms: Normal and skewed chi-square(df=3)"

# Why vary distributions:
# - Normal: Verify performance under ideal conditions
# - Non-normal: Test robustness to violations
```

**4. Number of replications:**

```bash
"5000 replications per scenario"

# Standard choices:
# - Pilot: 1,000 (quick check)
# - Standard: 5,000 (typical)
# - Publication: 10,000+ (high precision)

# Monte Carlo error: SE ∝ 1/√R
# For coverage (binary): SE ≈ √(0.95×0.05/R)
#   R=1000  → SE ≈ 0.007
#   R=5000  → SE ≈ 0.003
#   R=10000 → SE ≈ 0.002
```

**5. Methods to compare:**

```bash
"Compare: (1) percentile bootstrap, (2) BCa bootstrap, (3) asymptotic normal"
"Estimators: OLS, robust regression, weighted least squares"
```

**6. Design factors:**

```bash
"Vary: sample size (4 levels), effect size (3 levels), distribution (2 levels), method (3 levels)"

# Total scenarios = 4 × 3 × 2 × 3 = 72 scenarios
# With 5000 reps each = 360,000 simulation runs
```

**Complete example:**

```bash
/research:simulation:design "
Compare bias and coverage of bootstrap vs asymptotic CIs for mediation.

Parameters:
- Sample sizes: 50, 100, 200, 500
- True indirect effects: 0, 0.2, 0.4
- Error distributions: Normal(0,1), t(df=5)
- Bootstrap replications: 1000
- Simulation replications: 5000

Methods:
1. Percentile bootstrap (B=1000)
2. Delta method asymptotic CI

Performance metrics:
- Bias: E[θ̂] - θ
- RMSE: √MSE
- Coverage: P(θ ∈ CI), target 95%
- CI width: mean interval width

Analysis: Plot bias, RMSE, coverage vs n for each method and distribution
"
```

**See also:** [Simulation Design Guide](../research/SIMULATION-COMMANDS.md#researchsimulationdesign)

---

### Can Scholar generate R/Python code?

Yes, simulation designs include **code templates** in R (default) or Python:

**R code (default):**

```bash
/research:simulation:design "Compare bootstrap methods for mediation"
```

Output includes:

```r
library(boot)
library(MASS)
library(dplyr)

# Simulation function
simulate_once <- function(n, alpha, beta) {
  # Generate data
  Z <- rbinom(n, 1, 0.5)
  M <- alpha * Z + rnorm(n)
  Y <- beta * M + rnorm(n)

  # Fit models
  fit_m <- lm(M ~ Z)
  fit_y <- lm(Y ~ Z + M)

  # Estimate indirect effect
  alpha_hat <- coef(fit_m)["Z"]
  beta_hat <- coef(fit_y)["M"]
  theta_hat <- alpha_hat * beta_hat

  # Bootstrap
  boot_fn <- function(data, indices) {
    d <- data[indices, ]
    m_fit <- lm(M ~ Z, data = d)
    y_fit <- lm(Y ~ Z + M, data = d)
    coef(m_fit)["Z"] * coef(y_fit)["M"]
  }

  boot_results <- boot(data.frame(Z, M, Y), boot_fn, R = 1000)
  ci <- boot.ci(boot_results, type = "perc")

  return(c(theta_hat = theta_hat,
           ci_lower = ci$percent[4],
           ci_upper = ci$percent[5],
           covers = (beta * alpha >= ci$percent[4] &
                     beta * alpha <= ci$percent[5])))
}

# Design
design <- expand.grid(
  n = c(50, 100, 200, 500),
  alpha = c(0.2, 0.5),
  beta = c(0.2, 0.5),
  rep = 1:5000
)

# Run simulation (parallel)
library(parallel)
results <- mclapply(1:nrow(design), function(i) {
  with(design[i, ], simulate_once(n, alpha, beta))
}, mc.cores = 8)

# Combine results
results_df <- design %>%
  mutate(result = results) %>%
  unnest_wider(result)

# Save
saveRDS(results_df, "simulation_results.rds")
```

**Python code:**

```bash
/research:simulation:design "Compare bootstrap methods" --language python
```

Output includes:

```python
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.utils import resample
from joblib import Parallel, delayed

def simulate_once(n, alpha, beta, B=1000):
    """Simulate one dataset and estimate indirect effect"""
    # Generate data
    Z = np.random.binomial(1, 0.5, n)
    M = alpha * Z + np.random.normal(0, 1, n)
    Y = beta * M + np.random.normal(0, 1, n)

    # Estimate indirect effect
    from sklearn.linear_model import LinearRegression

    # M ~ Z
    lr_m = LinearRegression()
    lr_m.fit(Z.reshape(-1, 1), M)
    alpha_hat = lr_m.coef_[0]

    # Y ~ Z + M
    lr_y = LinearRegression()
    lr_y.fit(np.column_stack([Z, M]), Y)
    beta_hat = lr_y.coef_[1]

    theta_hat = alpha_hat * beta_hat

    # Bootstrap CI
    theta_boot = []
    for _ in range(B):
        idx = resample(range(n))
        Z_b, M_b, Y_b = Z[idx], M[idx], Y[idx]

        lr_m_b = LinearRegression().fit(Z_b.reshape(-1, 1), M_b)
        lr_y_b = LinearRegression().fit(np.column_stack([Z_b, M_b]), Y_b)

        theta_boot.append(lr_m_b.coef_[0] * lr_y_b.coef_[1])

    ci_lower, ci_upper = np.percentile(theta_boot, [2.5, 97.5])
    covers = (alpha * beta >= ci_lower) and (alpha * beta <= ci_upper)

    return {
        'theta_hat': theta_hat,
        'ci_lower': ci_lower,
        'ci_upper': ci_upper,
        'covers': covers
    }

# Design
design = pd.DataFrame([
    {'n': n, 'alpha': alpha, 'beta': beta}
    for n in [50, 100, 200, 500]
    for alpha in [0.2, 0.5]
    for beta in [0.2, 0.5]
])

# Run simulation (parallel)
results = Parallel(n_jobs=8)(
    delayed(simulate_once)(row['n'], row['alpha'], row['beta'])
    for _, row in design.iterrows()
    for _ in range(5000)
)

# Combine
results_df = pd.concat([design] * 5000, ignore_index=True)
results_df = results_df.join(pd.DataFrame(results))

# Save
results_df.to_csv('simulation_results.csv', index=False)
```

**Specify language in prompt:**

```bash
# R (default)
/research:simulation:design "study design"

# Python
/research:simulation:design "study design" --language python

# Both
/research:simulation:design "study design" --language both
```

**Code templates include:**

- Data generation
- Estimation functions
- Bootstrap procedures
- Parallel processing
- Results storage
- Basic analysis/plotting

**See also:** [Code Generation Examples](../examples/simulations.md)

---

### How do I analyze simulation results?

Use `/research:simulation:analysis` to analyze completed simulation output:

**Basic usage:**

```bash
/research:simulation:analysis results/simulation_results.csv
```

**Expected data format:**

CSV file with columns:

```csv
scenario,method,n,effect_size,replicate,estimate,se,ci_lower,ci_upper,pvalue
1,bootstrap,100,0.5,1,0.48,0.12,0.24,0.72,0.03
1,bootstrap,100,0.5,2,0.52,0.11,0.30,0.74,0.02
1,asymptotic,100,0.5,1,0.49,0.10,0.29,0.69,0.04
...
```

**Required columns:**

- `method`: Method identifier
- `n`: Sample size
- `estimate`: Point estimate
- `ci_lower`, `ci_upper`: CI bounds (for coverage)
- `replicate`: Replication number

**Output includes:**

**1. Performance summary tables:**

```markdown
### Bias by Method and Sample Size

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Bootstrap | -0.02 | -0.01 | 0.00 | 0.00 |
| Asymptotic | 0.05 | 0.03 | 0.01 | 0.00 |

### RMSE by Method and Sample Size

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Bootstrap | 0.18 | 0.12 | 0.08 | 0.05 |
| Asymptotic | 0.22 | 0.15 | 0.10 | 0.06 |

### Coverage Rates (nominal = 0.95)

| Method | n=50 | n=100 | n=200 | n=500 |
|--------|------|-------|-------|-------|
| Bootstrap | 0.93 | 0.94 | 0.95 | 0.95 |
| Asymptotic | 0.89 | 0.92 | 0.94 | 0.95 |
```

**2. Key findings:**

```markdown
### Key Findings

1. **Bias:**
   - Bootstrap shows minimal bias across all sample sizes
   - Asymptotic method is biased upward for n < 200
   - Both methods are essentially unbiased for n ≥ 200

2. **Efficiency:**
   - RMSE decreases at expected n⁻¹/² rate
   - Bootstrap is more efficient than asymptotic for n < 200
   - Methods are equivalent for n ≥ 500

3. **Coverage:**
   - Bootstrap achieves nominal coverage for n ≥ 100
   - Asymptotic method under-covers for n < 200
   - Both achieve 95% coverage for large samples

4. **Recommendation:**
   - Use bootstrap for n < 200
   - Either method acceptable for n ≥ 200
   - Bootstrap preferred for conservative inference
```

**3. Visualization code:**

```r
library(ggplot2)
library(dplyr)

results <- read.csv("simulation_results.csv")

# Bias plot
results %>%
  group_by(method, n) %>%
  summarize(bias = mean(estimate - true_value)) %>%
  ggplot(aes(x = n, y = bias, color = method)) +
  geom_line() +
  geom_point() +
  geom_hline(yintercept = 0, linetype = "dashed") +
  scale_x_log10() +
  labs(title = "Bias vs Sample Size",
       x = "Sample Size (log scale)",
       y = "Bias") +
  theme_minimal()

# Coverage plot
results %>%
  group_by(method, n) %>%
  summarize(coverage = mean(ci_lower <= true_value &
                            ci_upper >= true_value)) %>%
  ggplot(aes(x = n, y = coverage, color = method)) +
  geom_line() +
  geom_point() +
  geom_hline(yintercept = 0.95, linetype = "dashed") +
  ylim(0.85, 1.0) +
  labs(title = "Coverage Rates",
       x = "Sample Size",
       y = "Coverage Rate") +
  theme_minimal()

ggsave("bias_plot.pdf", width = 6, height = 4)
ggsave("coverage_plot.pdf", width = 6, height = 4)
```

**4. Statistical tests:**

```markdown
### Method Comparison Tests

**Bootstrap vs Asymptotic RMSE:**
Paired t-test across 72 scenarios: t(71) = -3.45, p = .001
Bootstrap has significantly lower RMSE.

**Coverage rate comparison:**
McNemar test: χ²(1) = 12.4, p < .001
Bootstrap has higher coverage for n < 200.
```

**See also:** [Simulation Analysis Guide](../research/SIMULATION-COMMANDS.md#researchsimulationanalysis)

---

### What performance metrics are included?

Simulation analysis automatically computes standard performance metrics:

**1. Bias:**

```
Bias(θ̂) = E[θ̂] - θ = (1/R) Σᵢ θ̂ᵢ - θ
```

- Measures systematic error
- Should be ≈ 0 for unbiased estimators
- Relative bias = Bias/θ (expressed as %)

**2. Mean Squared Error (MSE):**

```
MSE(θ̂) = E[(θ̂ - θ)²] = (1/R) Σᵢ (θ̂ᵢ - θ)²
       = Var(θ̂) + Bias²(θ̂)
```

- Combines bias and variance
- Lower is better
- Units: squared scale of θ

**3. Root MSE (RMSE):**

```
RMSE(θ̂) = √MSE(θ̂)
```

- Same units as θ
- Easier to interpret than MSE
- Common metric for method comparison

**4. Coverage Rate:**

```
Coverage = P(θ ∈ CI) = (1/R) Σᵢ I(θ ∈ CIᵢ)
```

- For 95% CI, target is 0.95
- Under-coverage (< 0.95): liberal, anti-conservative
- Over-coverage (> 0.95): conservative, loss of power
- Monte Carlo SE ≈ √(0.95×0.05/R)

**5. CI Width:**

```
Width = E[CI_upper - CI_lower] = (1/R) Σᵢ (CIᵢ_upper - CIᵢ_lower)
```

- Average confidence interval width
- Narrower is better (more precise)
- Trade-off with coverage

**6. Power:**

```
Power = P(reject H₀ | H₁ true) = (1/R) Σᵢ I(pᵢ < α)
```

- For testing H₀: θ = 0 when θ ≠ 0
- Target: ≥ 0.80 typically
- Increases with n and effect size

**7. Type I Error Rate:**

```
Type I error = P(reject H₀ | H₀ true) = (1/R) Σᵢ I(pᵢ < α | θ = 0)
```

- When true effect is zero
- Target: α (e.g., 0.05)
- Related to coverage: Type I error ≈ 1 - Coverage (for two-sided tests)

**8. Relative Efficiency:**

```
RE(θ̂₁, θ̂₂) = MSE(θ̂₂) / MSE(θ̂₁)
```

- Compares two estimators
- RE > 1: θ̂₁ is more efficient than θ̂₂
- Can be expressed as % gain

**Example output:**

```markdown
### Performance Metrics (n = 100, θ = 0.5)

| Metric | Bootstrap | Asymptotic |
|--------|-----------|------------|
| Bias | -0.008 | 0.032 |
| Rel. Bias (%) | -1.6% | 6.4% |
| MSE | 0.0144 | 0.0229 |
| RMSE | 0.120 | 0.151 |
| Coverage (95%) | 0.943 | 0.892 |
| Mean CI Width | 0.471 | 0.452 |
| Power (α=.05) | 0.847 | 0.821 |

**Relative Efficiency:** RE = 0.0229/0.0144 = 1.59
Bootstrap is 59% more efficient than asymptotic for n=100.
```

**See also:** [Performance Metrics Guide](../research/SIMULATION-COMMANDS.md#performance-metrics)

---

### How do I optimize computational performance?

Scholar simulation designs include optimization recommendations:

**1. Parallel processing:**

**R (parallel package):**

```r
library(parallel)

# Detect cores
n_cores <- detectCores() - 1  # Leave 1 for OS

# Parallel lapply
results <- mclapply(scenarios, simulate_once, mc.cores = n_cores)

# Parallel for loop (Windows-compatible)
cl <- makeCluster(n_cores)
clusterExport(cl, c("simulate_once", "helper_functions"))
results <- parLapply(cl, scenarios, simulate_once)
stopCluster(cl)
```

**Python (joblib):**

```python
from joblib import Parallel, delayed

results = Parallel(n_jobs=-1)(  # -1 = all cores
    delayed(simulate_once)(params)
    for params in scenarios
)
```

**2. Vectorization:**

```r
# Slow: Loop over replications
results <- list()
for (i in 1:5000) {
  results[[i]] <- simulate_once(n, alpha, beta)
}

# Fast: Vectorize data generation
Z <- matrix(rbinom(5000 * n, 1, 0.5), nrow = 5000)
M <- alpha * Z + matrix(rnorm(5000 * n), nrow = 5000)
# ... vectorized estimation
```

**3. Reduce bootstrap replications:**

```r
# Pilot simulation: B = 500-1000
boot_results <- boot(data, statistic, R = 500)

# Full simulation: B = 1000-2000 sufficient for most cases
boot_results <- boot(data, statistic, R = 1000)

# Publication (high precision): B = 5000-10000
boot_results <- boot(data, statistic, R = 10000)
```

**4. Save intermediate results:**

```r
# Save every 100 iterations
for (i in seq(1, nrow(design), by = 100)) {
  batch <- design[i:(i+99), ]
  results <- lapply(batch, simulate_once)
  saveRDS(results, paste0("results_batch_", i, ".rds"))
}

# Combine later
all_results <- do.call(rbind, lapply(
  list.files(pattern = "results_batch_"),
  readRDS
))
```

**5. Use compiled code:**

```r
# Rcpp for computational bottlenecks
library(Rcpp)

cppFunction('
NumericVector simulate_cpp(int n, double alpha, double beta) {
  NumericVector Z = rbinom(n, 1, 0.5);
  NumericVector M = alpha * Z + rnorm(n);
  NumericVector Y = beta * M + rnorm(n);
  return Y;
}
')
```

**6. Smart design:**

```bash
# Start with small pilot
/research:simulation:design "study with 1000 reps for pilot"

# Check computational time
# Scale to full study if reasonable

# Reduce scenarios if needed:
# - Fewer sample sizes (just 50, 100, 200 instead of 50, 75, 100, ...)
# - Fewer effect sizes
# - Fewer distributional scenarios
```

**7. Cluster computing:**

```r
# PBS/SLURM job array
# Run scenarios in parallel across cluster nodes

# scenarios.txt:
# 1,50,0.2,0.2
# 2,50,0.2,0.5
# ...

# R script: sim.R
args <- commandArgs(trailingOnly = TRUE)
scenario_id <- as.integer(args[1])

params <- read.csv("scenarios.txt")[scenario_id, ]
result <- simulate_once(params$n, params$alpha, params$beta)
saveRDS(result, paste0("result_", scenario_id, ".rds"))

# Submit: sbatch -array=1-72 run_sim.sh
```

**Estimated run times:**

| Scenarios | Reps | Cores | Time per rep | Total time |
|-----------|------|-------|--------------|------------|
| 24 | 1,000 | 1 | 1 sec | 6.7 hours |
| 24 | 1,000 | 8 | 1 sec | 50 min |
| 72 | 5,000 | 1 | 1 sec | 100 hours |
| 72 | 5,000 | 8 | 1 sec | 12.5 hours |

**See also:** [Computational Guide](../research/SIMULATION-COMMANDS.md#computational-optimization)

---

## Research Planning

### How do I identify research gaps?

Use `/research:lit-gap` to identify opportunities in the literature:

**Basic usage:**

```bash
/research:lit-gap "causal mediation with unmeasured confounding"
```

**Detailed prompt:**

```bash
/research:lit-gap "Analyze gaps in the literature on causal mediation analysis with unmeasured confounding. Focus on: (1) sensitivity analysis methods, (2) applications in clinical trials, (3) high-dimensional mediators, (4) time-varying treatments"
```

**Output structure:**

**1. Current state of literature:**

```markdown
### Established Methods

1. **Imai et al. (2010) Sensitivity Analysis**
   - ρ parameter for correlation of errors
   - Implemented in R package `mediation`
   - Widely used in social sciences

2. **VanderWeele (2010) Bias Formulas**
   - E-value approach
   - Quantifies strength of unmeasured confounding
   - Applied to binary outcomes

3. **Robins & Richardson (2010) g-computation**
   - Semiparametric methods
   - Handling time-varying confounding
   - Limited to low dimensions
```

**2. Identified gaps:**

```markdown
### Methodological Gaps

**Gap 1: High-Dimensional Sensitivity Analysis**
- **Current**: Imai's ρ limited to single unmeasured confounder
- **Needed**: Extension to multiple unmeasured confounders
- **Impact**: Critical for complex observational studies
- **Difficulty**: Moderate (identifiability challenges)
- **Potential approach**: Penalized sensitivity parameters

**Gap 2: Bayesian Sensitivity Analysis**
- **Current**: Mostly frequentist methods
- **Needed**: Prior specification for confounding strength
- **Impact**: Natural framework for uncertainty quantification
- **Difficulty**: Moderate
- **Potential approach**: Informative priors from subject knowledge

**Gap 3: Machine Learning Integration**
- **Current**: Parametric models only
- **Needed**: Sensitivity analysis for ML-based estimators
- **Impact**: Enables use in high-dimensional settings
- **Difficulty**: Hard (complex estimators)
```

**3. Application gaps:**

```markdown
### Application Gaps

**Understudied Domains:**
- Clinical trials with compliance issues
- Epidemiology with time-varying exposures
- Health services research with selection bias
- Economics with instrumental variable violations
```

**4. Research opportunities:**

```markdown
### Research Opportunities

**Short-term (1-2 papers):**
1. **Bayesian Sensitivity for Mediation**
   - Contribution: Prior specification framework
   - Required expertise: Bayesian methods, mediation
   - Target journal: Biostatistics, JASA
   - Timeline: 12-18 months

**Medium-term (2-3 years):**
1. **High-Dimensional Sensitivity Methods**
   - Contribution: Lasso-penalized sensitivity
   - Collaboration potential: ML researchers
   - Target: Biometrika, Annals of Statistics

**High-impact (ambitious):**
1. **Unified Sensitivity Framework**
   - Contribution: General theory across methods
   - Computational breakthrough: Scalable algorithms
   - Target: JASA, JRSS-B
```

**5. Next steps:**

```markdown
### Recommended Actions

1. Literature review of recent sensitivity analysis papers (2020-2026)
2. Simulation study comparing existing methods
3. Develop prototype Bayesian approach
4. Seek collaboration with domain experts
5. Attend JSM/ENAR sessions on sensitivity analysis
```

**See also:** [Gap Analysis Workflow](../workflows/research/gap-analysis.md)

---

### Can Scholar help generate hypotheses?

Yes, use `/research:hypothesis` to generate testable statistical hypotheses:

**Basic usage:**

```bash
/research:hypothesis "treatment effect heterogeneity in mediation"
```

**Detailed prompt:**

```bash
/research:hypothesis "Generate hypotheses about whether the indirect effect of a behavioral intervention on depression varies by baseline severity. Consider moderated mediation framework, sample size n=200, binary moderator (low vs high severity)"
```

**Output includes:**

**1. Formal hypotheses:**

```markdown
### Primary Hypothesis: Moderated Mediation

**Research Question:**
Does the indirect effect of treatment on depression through social support
vary by baseline depression severity?

**Formal Statement:**

H₀: θ(W=0) = θ(W=1)

vs

H₁: θ(W=0) ≠ θ(W=1)

where θ(W) is the indirect effect for moderator level W.

**Equivalently:**
H₀: Index of moderated mediation = 0
H₁: Index of moderated mediation ≠ 0

where Index = αβ₃ (interaction of treatment-on-mediator with moderator)
```

**2. Statistical models:**

```markdown
### Statistical Framework

**Mediator Model:**
M = α₀ + α₁Z + α₂W + α₃(Z×W) + εₘ

**Outcome Model:**
Y = β₀ + β₁Z + β₂M + β₃W + εᵧ

**Indirect Effect (conditional on W):**
θ(W) = [α₁ + α₃W] × β₂

**Index of Moderated Mediation:**
θ(1) - θ(0) = α₃β₂
```

**3. Test procedures:**

```markdown
### Test Procedure

**Test Statistic:**
t = α̂₃β̂₂ / SE(α̂₃β̂₂)

**Standard Error:**
SE(α̂₃β̂₂) via bootstrap or delta method:
SE² ≈ α₃²·Var(β̂₂) + β₂²·Var(α̂₃) + 2α₃β₂·Cov(α̂₃,β̂₂)

**Inference:**
- Bootstrap percentile CI for α₃β₂
- Reject H₀ if CI excludes 0
- Alternative: Wald test with z-statistic
```

**4. Power analysis:**

```markdown
### Power Considerations

**Effect Size:**
For Cohen's d = 0.5 (medium effect):
- α₃ = 0.3 (treatment-moderator interaction on mediator)
- β₂ = 0.4 (mediator-outcome path)
- Index = 0.12

**Sample Size:**
For 80% power with α = .05, n ≈ 200

**Sensitivity:**
- Power increases with larger α₃ or β₂
- Reduces if measurement error in moderator
- Bootstrap has better power than delta method for n < 300
```

**5. Secondary hypotheses:**

```markdown
### Secondary Hypotheses

**H2: Direct effect moderation**
H₀: Direct effect does not vary by W
H₁: Direct effect varies by W
Test: Interaction Z×W in outcome model

**H3: Total effect moderation**
H₀: Total effect does not vary by W
H₁: Total effect varies by W
Test: Reduced model Y ~ Z + W + Z×W
```

**6. Interpretation guide:**

```markdown
### Result Interpretation

**If reject H₀ (moderated mediation):**
- Indirect effect differs between low/high severity groups
- Mechanism of treatment effect is baseline-dependent
- Precision medicine implications: target treatment based on severity

**If fail to reject H₀:**
- Insufficient evidence for moderation
- Indirect effect may be homogeneous
- Alternative: Insufficient power (increase n or effect size)
```

**See also:** [Hypothesis Generation Guide](../research/RESEARCH-COMMANDS-REFERENCE.md#researchhypothesis)

---

### What's included in an analysis plan?

`/research:analysis-plan` creates a comprehensive statistical analysis plan (SAP):

**Basic usage:**

```bash
/research:analysis-plan "randomized trial with mediation analysis"
```

**Detailed prompt:**

```bash
/research:analysis-plan "Create statistical analysis plan for RCT testing whether a behavioral intervention reduces depression symptoms through increased social support. Sample size n=200, 1:1 randomization, primary outcome: PHQ-9 score at 12 weeks, mediator: social support scale at 6 weeks. Include primary mediation analysis, secondary outcomes, sensitivity analyses, missing data handling."
```

**Output structure:**

**1. Study overview:**

```markdown
## Statistical Analysis Plan

### Study Design
- Design: Randomized controlled trial
- Randomization: 1:1 (treatment vs control)
- Sample size: n = 200 (100 per arm)
- Primary outcome: PHQ-9 score at 12 weeks
- Mediator: Social support scale at 6 weeks
- Treatment: Behavioral activation intervention
```

**2. Primary analysis:**

```markdown
### Primary Analysis: Mediation

**Objective:**
Test whether the treatment effect on depression is mediated by social
support.

**Hypotheses:**
H₀: Indirect effect θ = 0
H₁: Indirect effect θ ≠ 0

**Statistical Model:**
Mediator (social support at 6 weeks):
M = α₀ + α₁Z + α₂X₁ + α₃X₂ + εₘ

Outcome (PHQ-9 at 12 weeks):
Y = β₀ + β₁Z + β₂M + β₃X₁ + β₄X₂ + εᵧ

where Z = treatment (1 = intervention, 0 = control)
      X₁ = baseline PHQ-9
      X₂ = age

**Estimation:**
Indirect effect: θ = α₁ × β₂ (product of coefficients)
Direct effect: δ = β₁
Total effect: τ = θ + δ

**Inference:**
- 95% bootstrap confidence interval (10,000 replications)
- Percentile method
- Significance: α = .05, two-sided

**Assumptions:**
1. Sequential ignorability (ensured by randomization)
2. No treatment-mediator interaction
3. Linear relationships
4. Homoscedastic errors
```

**3. Secondary analyses:**

```markdown
### Secondary Analyses

**Analysis 1: Treatment Effect on Anxiety**
- Outcome: GAD-7 score at 12 weeks
- Model: Linear regression, same covariates
- Hypothesis: τ ≠ 0

**Analysis 2: Subgroup Analysis by Baseline Severity**
- Moderator: Baseline PHQ-9 (low vs high, median split)
- Test for moderated mediation
- Index of moderated mediation = α₃β₂

**Analysis 3: Multiple Mediators**
- Add physical activity as second mediator
- Parallel mediation model
- Estimate indirect effects through each path
```

**4. Sensitivity analyses:**

```markdown
### Sensitivity Analyses

**Purpose:** Assess robustness to assumptions

**Sensitivity 1: Alternative Bootstrap Methods**
- Compare percentile vs BCa bootstrap
- Should yield similar results
- If different, BCa preferred (adjusts for bias/skew)

**Sensitivity 2: Unmeasured Confounding**
- Imai et al. (2010) ρ sensitivity parameter
- Report range of ρ that would nullify result
- Interpret strength of confounding required

**Sensitivity 3: Model Misspecification**
- Nonlinear models (GAM for M and Y)
- Compare to linear model results
- Assess impact of linearity assumption

**Sensitivity 4: Outlier Influence**
- Remove observations with |residual| > 3 SD
- Rerun primary analysis
- Compare to full sample results
```

**5. Multiple testing:**

```markdown
### Multiple Testing Adjustment

**Strategy:**
- Primary hypothesis (indirect effect): No adjustment, α = .05
- Secondary hypotheses (k=3): Bonferroni correction, α = .05/3 = .017
- Exploratory analyses: Reported as exploratory, no adjustment

**Justification:**
Primary analysis is prespecified in protocol. Secondary analyses are
hypothesis-generating. Clear distinction prevents inflation of Type I error.
```

**6. Missing data:**

```markdown
### Missing Data Handling

**Expected missingness:** 15% at 12 weeks (based on pilot)

**Primary approach:** Multiple imputation
- Method: MICE (Multivariate Imputation by Chained Equations)
- M = 50 imputations
- Include baseline covariates, treatment, and outcome in imputation model
- Pool estimates using Rubin's rules

**Sensitivity approach:** Complete case analysis
- Restrict to participants with complete data
- Compare to MI results
- If similar, supports MAR assumption

**Missingness analysis:**
- Compare baseline characteristics of complete vs incomplete cases
- Logistic regression: missingness ~ treatment + baseline covariates
- If related to treatment, investigate further
```

**7. Sample size justification:**

```markdown
### Sample Size and Power

**Primary analysis power calculation:**
- Effect size: Indirect effect θ = 0.15 (standardized)
- Power: 80%
- Significance: α = .05, two-sided
- Required n: 200 (100 per arm)

**Assumptions:**
- Correlation(M,Y) ≈ 0.3
- Treatment explains 10% variance in M
- Mediator explains 15% variance in Y
- Calculation via Monte Carlo simulation (10,000 reps)

**Attrition:**
- Expected: 15%
- Recruit n = 236 to achieve n = 200 completers
```

**See also:** [Analysis Plan Tutorial](../tutorials/research/analysis-planning.md)

---

### How does method scouting work?

`/research:method-scout` finds relevant statistical methods and R/Python packages:

**Basic usage:**

```bash
/research:method-scout "high-dimensional mediation analysis"
```

**Detailed prompt:**

```bash
/research:method-scout "Find statistical methods for mediation analysis when there are 500+ potential mediators and sample size n=150. Need: variable selection, false discovery control, computational efficiency"
```

**Output includes:**

**1. Recommended methods:**

```markdown
### Method 1: HIMA (High-Dimensional Mediation Analysis)

**Description:**
Sure independence screening combined with penalized regression to identify
active mediators among thousands of candidates.

**When to Use:**
- p (mediators) >> n (sample size)
- Sparse mediation (few true mediators among many)
- Need computational efficiency

**Assumptions:**
- Sparsity: Only small fraction of mediators are active
- Linear relationships (M~Z, Y~M)
- Independence across mediators (or weak correlation)

**R Implementation:**
```r
library(HIMA)

# Run HIMA
result <- hima(X = treatment,  # n x 1
               Y = outcome,    # n x 1
               M = mediators,  # n x p matrix
               penalty = "MCP",
               ncore = 4)

# Extract significant mediators
sig_mediators <- result[result$alpha.p < 0.05 & result$beta.p < 0.05, ]
```

**Key Papers:**

1. Zhang et al. (2016): "Estimating and Testing High-dimensional Mediation
   Effects in Epigenetic Studies" - Bioinformatics
2. Perera et al. (2022): "Statistical Analysis Plan: HIMA Extensions" -
   BMC Bioinformatics

**Pros:**

- Scales to p > 10,000
- Fast computation (parallel)
- Identifies active mediators
- FDR control available

**Cons:**

- Assumes sparsity
- Selection uncertainty not accounted for
- Bootstrap inference computationally expensive
- May miss weak mediators

```

**2. Alternative methods:**
```markdown
### Method 2: LPME (Lasso-Penalized Mediation)

**Description:**
Two-stage lasso for mediator selection, then estimate indirect effects.

**R Implementation:**
```r
library(glmnet)

# Stage 1: Select mediators via lasso
fit_m <- cv.glmnet(X, M, family = "mgaussian")
selected <- which(coef(fit_m)[-1] != 0)

# Stage 2: Estimate effects for selected mediators
fit_y <- lm(Y ~ X + M[, selected])
```

**When preferred:** More flexible, allows correlated mediators

### Method 3: BSLMM (Bayesian Sparse Linear Mixed Model)

**Description:**
Bayesian variable selection with spike-and-slab priors.

**R Implementation:**

```r
library(BSLMM)

fit <- bslmm(Y ~ X + M, prior = "spike-slab")
posterior_prob <- extract_pip(fit)  # Posterior inclusion probabilities
```

**When preferred:** Want uncertainty quantification, Bayesian framework

```

**3. Method comparison:**
```markdown
### Method Comparison

| Criterion | HIMA | LPME | BSLMM |
|-----------|------|------|-------|
| Max p | 10,000+ | 1,000 | 500 |
| Speed | Fast | Medium | Slow |
| Selection | MCP/SCAD | Lasso | Spike-slab |
| FDR control | Yes | No | Via posterior |
| Uncertainty | Bootstrap | Bootstrap | Bayesian credible intervals |
| R package | `HIMA` | `glmnet` + custom | `BSLMM` |
```

**4. Recommendations:**

```markdown
### Recommendation

**Primary choice:** HIMA

**Reasoning:**
- Sample size (n=150) and dimension (p=500+) match HIMA design
- Fast computation enables bootstrap inference
- Built-in FDR control
- Validated in epigenetic studies (similar p >> n setting)

**Alternative:** LPME if mediators are highly correlated

**Implementation roadmap:**
1. Install: `install.packages("HIMA")`
2. Prepare data: Treatment (n×1), Outcome (n×1), Mediators (n×p)
3. Run HIMA with MCP penalty
4. Select mediators with FDR < 0.05
5. Validate on held-out data if available
6. Bootstrap for inference (may be slow for large p)
```

**5. Additional resources:**

```markdown
### Resources

**Tutorials:**
- HIMA vignette: `vignette("HIMA", package="HIMA")`
- GitHub: https://github.com/YinanZheng/HIMA

**Related Papers:**
- Huang & Pan (2016): "Hypothesis test of mediation effect in causal
  mediation model with high-dimensional continuous mediators" - Biometrics
- Boca et al. (2014): "Testing multiple biological mediators
  simultaneously" - Bioinformatics

**Software:**
- R package `HIMA`: https://cran.r-project.org/package=HIMA
- Python equivalent: `medinco` (experimental)
```

**See also:** [Method Scout Guide](../research/RESEARCH-COMMANDS-REFERENCE.md#researchmethod-scout)

---

### Can Scholar recommend statistical methods?

Yes, that's exactly what `/research:method-scout` does. It provides:

**1. Context-aware recommendations:**

- Matches methods to your problem characteristics
- Considers sample size, data structure, goals
- Accounts for computational constraints

**2. Implementation guidance:**

- R/Python packages with code examples
- Installation instructions
- Usage patterns and syntax

**3. Literature references:**

- Foundational papers for each method
- Recent methodological advances
- Validation studies

**4. Comparison framework:**

- Pros and cons of each approach
- When to use which method
- Trade-offs between methods

**Example use cases:**

**Causal inference:**

```bash
/research:method-scout "estimate treatment effects with unmeasured confounding in observational study, n=500"

# Recommends:
# - Propensity score matching
# - Inverse probability weighting
# - Doubly robust estimation
# - Instrumental variables (if available)
# - Sensitivity analysis (for unmeasured confounding)
```

**High-dimensional problems:**

```bash
/research:method-scout "regression with 200 predictors and 100 observations"

# Recommends:
# - Lasso (L1 penalization)
# - Elastic net (L1 + L2)
# - Ridge regression
# - Sure independence screening
# - Comparison based on correlation structure
```

**Complex data structures:**

```bash
/research:method-scout "analyze longitudinal data with missing values and time-varying covariates"

# Recommends:
# - Linear mixed models (lme4, nlme)
# - GEE (geepack)
# - Multiple imputation (mice)
# - Marginal structural models (ipw)
```

**Scholar provides the statistical knowledge; you provide the domain expertise.**

---

## Integration & Workflow

### How does Scholar fit into my research workflow?

Scholar integrates at multiple stages of the research process:

**1. Planning Stage:**

```bash
# Identify what's already known
/research:arxiv "your research area"
/research:lit-gap "specific focus"

# Generate research questions
/research:hypothesis "research problem"

# Design study
/research:analysis-plan "study design"
/research:method-scout "statistical approach"
```

**2. Literature Review:**

```bash
# Systematic search
/research:arxiv "topic" --recent
/research:doi "papers from search"

# Organize references
/research:bib:add entry.bib references.bib
/research:bib:search "topic" references.bib
```

**3. Simulation/Validation:**

```bash
# Design Monte Carlo study
/research:simulation:design "method comparison"

# [Run simulation in R/Python]

# Analyze results
/research:simulation:analysis results.csv
```

**4. Writing:**

```bash
# Draft sections
/research:manuscript:methods "methodology"
/research:manuscript:results "findings"

# Review proofs
/research:manuscript:proof "theorem statement"
```

**5. Revision:**

```bash
# Respond to reviews
/research:manuscript:reviewer "reviewer comments"

# Additional analyses
/research:simulation:design "sensitivity check"
```

**Integration with existing tools:**

| Tool | Scholar's Role |
|------|----------------|
| **Zotero/Mendeley** | Export to Scholar for arXiv discovery, import back for bibliography |
| **R/Python** | Scholar designs simulations, you run code, Scholar analyzes results |
| **LaTeX/Overleaf** | Scholar generates BibTeX entries and formatted sections |
| **Quarto/RMarkdown** | Scholar provides markdown-formatted methods/results |
| **Git** | Version control `.bib` files and generated content |

**Example daily workflow:**

```bash
# Morning: Literature review (30 min)
/research:arxiv "yesterday's topic" --since 2024-01-01
/research:bib:add new-papers.bib references.bib

# Midday: Writing (2 hours)
/research:manuscript:methods "current section"
# [Edit and refine]

# Afternoon: Analysis (3 hours)
# [Run simulations, analyze data in R]
/research:simulation:analysis results.csv

# Evening: Planning (30 min)
/research:lit-gap "follow-up question"
```

---

### Can I automate literature reviews?

Yes, with bash scripting and Scholar commands:

**Simple automated search:**

```bash
#!/bin/bash
# lit-review-automation.sh

TOPIC="causal mediation"
OUTPUT_DIR="literature-review-$(date +%Y%m%d)"
REFS="references.bib"

mkdir -p "$OUTPUT_DIR"

# 1. Search arXiv
echo "Searching arXiv for: $TOPIC"
/research:arxiv "$TOPIC" --recent --max 20 > "$OUTPUT_DIR/arxiv-results.md"

# 2. Extract DOIs from results (manual step needed)
# You review arxiv-results.md and create dois.txt with relevant DOIs

# 3. Get BibTeX for each DOI
while read doi; do
  echo "Fetching $doi..."
  /research:doi "$doi" >> "$OUTPUT_DIR/bibtex-entries.bib"
  echo "" >> "$OUTPUT_DIR/bibtex-entries.bib"
done < dois.txt

# 4. Add to bibliography
/research:bib:add "$OUTPUT_DIR/bibtex-entries.bib" "$REFS"

# 5. Analyze gaps
/research:lit-gap "$TOPIC" > "$OUTPUT_DIR/gap-analysis.md"

echo "Literature review complete. Results in $OUTPUT_DIR/"
```

**Scheduled weekly updates:**

```bash
#!/bin/bash
# weekly-lit-update.sh
# Add to cron: 0 9 * * 1 /path/to/weekly-lit-update.sh

TOPICS=("causal mediation" "bootstrap inference" "sensitivity analysis")
REPORT="lit-update-$(date +%Y%m%d).md"

echo "# Weekly Literature Update - $(date +%Y-%m-%d)" > "$REPORT"
echo "" >> "$REPORT"

for topic in "${TOPICS[@]}"; do
  echo "## Topic: $topic" >> "$REPORT"
  echo "" >> "$REPORT"

  /research:arxiv "$topic" --since $(date -d "7 days ago" +%Y-%m-%d) --max 5 >> "$REPORT"
  echo "" >> "$REPORT"
done

# Email report
mail -s "Weekly Literature Update" you@email.com < "$REPORT"
```

**Advanced: Topic tracking with alerts:**

```bash
#!/bin/bash
# track-topics.sh
# Monitors arXiv for papers on specific topics, alerts on new findings

CONFIG="topics.conf"  # One topic per line
LAST_CHECK="last-check.txt"
ALERTS="new-papers-$(date +%Y%m%d).txt"

# Read last check date
if [ -f "$LAST_CHECK" ]; then
  SINCE=$(cat "$LAST_CHECK")
else
  SINCE=$(date -d "30 days ago" +%Y-%m-%d)
fi

echo "Checking for papers since $SINCE"
> "$ALERTS"

while read topic; do
  echo "Searching: $topic"

  results=$(/research:arxiv "$topic" --since "$SINCE" --max 10)

  if [ -n "$results" ]; then
    echo "=== New papers on: $topic ===" >> "$ALERTS"
    echo "$results" >> "$ALERTS"
    echo "" >> "$ALERTS"
  fi
done < "$CONFIG"

# Update last check
date +%Y-%m-%d > "$LAST_CHECK"

# Send alert if new papers found
if [ -s "$ALERTS" ]; then
  mail -s "New arXiv papers on your topics" you@email.com < "$ALERTS"
fi
```

**Limitations:**

- arXiv search is not exhaustive (misses journals, books, non-stat papers)
- DOI extraction from arXiv results requires manual review
- No automatic quality filtering (you must review papers)
- Automated systems should augment, not replace, manual literature review

**See also:** [Automation Workflows](../workflows/research/automation.md)

---

### How do I combine multiple commands?

Scholar commands are designed to chain together. Here are common patterns:

**Pattern 1: arXiv → DOI → BibTeX → Bibliography**

```bash
# Step 1: Discover
/research:arxiv "bootstrap mediation" --recent

# Step 2: Get citation (using DOI from step 1)
/research:doi "10.1080/01621459.2020.1765785" > temp.bib

# Step 3: Check duplicates
/research:bib:search "Imai 2021" references.bib

# Step 4: Add if not duplicate
/research:bib:add temp.bib references.bib
rm temp.bib
```

**Pattern 2: Gap → Hypothesis → Analysis Plan**

```bash
# Identify opportunity
/research:lit-gap "unmeasured confounding mediation"

# Formulate hypothesis
/research:hypothesis "sensitivity analysis improves robustness"

# Design study
/research:analysis-plan "RCT with sensitivity analysis for mediation"
```

**Pattern 3: Method Scout → Simulation → Analysis → Results**

```bash
# Find methods
/research:method-scout "bootstrap vs asymptotic CIs for mediation"

# Design comparison
/research:simulation:design "compare bootstrap and delta method"

# [Implement and run simulation in R]

# Analyze
/research:simulation:analysis results.csv

# Write up
/research:manuscript:results "simulation study findings"
```

**Pattern 4: Literature → Methods → Reviewer Response**

```bash
# Reviewer asks for justification
/research:manuscript:reviewer "R2: Why bootstrap over asymptotic?"

# Find supporting literature
/research:arxiv "bootstrap mediation confidence intervals"

# Add citations
/research:doi "10.1037/met0000038"
/research:bib:add entry.bib references.bib

# Update methods section with citations
/research:manuscript:methods "bootstrap mediation with citations from references.bib"
```

**Piping between commands (advanced):**

```bash
# Save intermediate outputs
/research:arxiv "topic" > papers.txt

# Extract DOIs (manual or scripted)
grep "DOI:" papers.txt | cut -d' ' -f2 > dois.txt

# Batch process
while read doi; do
  /research:doi "$doi" >> all-papers.bib
done < dois.txt

/research:bib:add all-papers.bib references.bib
```

**Workflow scripts:**

```bash
#!/bin/bash
# complete-lit-review.sh
# Combines discovery, citation, and gap analysis

TOPIC="$1"
OUTPUT="review-$TOPIC-$(date +%Y%m%d)"

mkdir -p "$OUTPUT"

echo "Step 1: Searching arXiv..."
/research:arxiv "$TOPIC" --max 20 > "$OUTPUT/01-arxiv.md"

echo "Step 2: Gap analysis..."
/research:lit-gap "$TOPIC" > "$OUTPUT/02-gaps.md"

echo "Step 3: Method scouting..."
/research:method-scout "$TOPIC" > "$OUTPUT/03-methods.md"

echo "Complete! See $OUTPUT/"
```

**See also:** [Command Chaining Guide](../workflows/research/command-chaining.md)

---

### Can I use Scholar with LaTeX/Overleaf?

Yes, Scholar integrates seamlessly with LaTeX workflows:

**BibTeX integration:**

```bash
# Generate bibliography
/research:doi "10.xxxx/xxxxx" > entry.bib
/research:bib:add entry.bib references.bib

# Upload references.bib to Overleaf
# Or keep in local LaTeX project:
cp references.bib ~/Documents/manuscript/
```

**LaTeX document:**

```latex
\documentclass{article}
\usepackage{natbib}

\begin{document}

\section{Introduction}
As shown by \citet{imai2021causal}, mediation analysis...

\section{Methods}
% Paste output from /research:manuscript:methods here
We employed the bootstrap confidence interval procedure...

\section{Results}
% Paste output from /research:manuscript:results here
The indirect effect was significant...

\bibliographystyle{apalike}
\bibliography{references}  % references.bib

\end{document}
```

**Generating LaTeX-ready content:**

```bash
# Methods section with LaTeX math
/research:manuscript:methods "bootstrap mediation" --format tex

# Output uses LaTeX notation:
# \begin{equation}
# \hat{\theta} = \hat{\alpha} \times \hat{\beta}
# \end{equation}
```

**Overleaf workflow:**

1. **Local development:**

   ```bash
   # Build bibliography locally
   /research:bib:add papers.bib references.bib
   ```

2. **Upload to Overleaf:**
   - Upload `references.bib` to Overleaf project
   - Use `\bibliography{references}` in LaTeX

3. **Generate content:**

   ```bash
   # Methods section
   /research:manuscript:methods "your methods" > methods.tex

   # Include in Overleaf:
   # \input{methods}
   ```

4. **Keep in sync:**

   ```bash
   # Update bibliography
   /research:bib:add new-paper.bib references.bib

   # Re-upload references.bib to Overleaf
   ```

**LaTeX packages for statistical notation:**

```latex
\usepackage{amsmath}   % Advanced math
\usepackage{amssymb}   % Math symbols
\usepackage{bm}        % Bold math
\usepackage{natbib}    % Citation management

% Example from Scholar output:
The indirect effect is estimated as:
\begin{equation}
\hat{\theta} = \hat{\alpha} \times \hat{\beta}
\end{equation}
where $\hat{\alpha}$ is the treatment effect on the mediator
and $\hat{\beta}$ is the mediator effect on the outcome.
```

**Citation styles:**

```latex
% APA style
\bibliographystyle{apalike}

% Nature style
\bibliographystyle{naturemag}

% Custom .bst file
\bibliographystyle{my-journal-style}
```

**See also:** [LaTeX Integration Guide](../workflows/research/latex-integration.md)

---

### How does Scholar work with flow-cli?

Scholar integrates with flow-cli for enhanced research workflows:

**Combined capabilities:**

**flow-cli provides:**

- Project context and configuration
- Course/research project management
- Workflow automation
- Status tracking

**Scholar provides:**

- Statistical methods expertise
- Literature discovery
- Manuscript generation
- Simulation design

**Example integration:**

```bash
# Start research session with flow-cli
work research-project

# flow-cli sets context, Scholar commands available
/research:arxiv "project topic"
/research:simulation:design "study for project"

# End session
finish "Added literature review and simulation design"
```

**Project configuration (`.flow/research-config.yml`):**

```yaml
scholar:
  research_area: "causal mediation analysis"

  defaults:
    arxiv_max_results: 10
    simulation_reps: 5000
    bibliography: "references.bib"

  literature:
    topics:
      - "mediation analysis"
      - "sensitivity analysis"
      - "bootstrap inference"

  current_manuscript:
    title: "Bootstrap Sensitivity Analysis for Mediation"
    target_journal: "JASA"
    bibliography: "manuscript/refs.bib"
```

**Automated workflows:**

```bash
# flow-cli can trigger Scholar commands
flow research:lit-update
# Internally calls: /research:arxiv for each topic in config

flow research:weekly-summary
# Generates summary using Scholar gap analysis

flow manuscript:methods-draft
# Calls /research:manuscript:methods with project-specific context
```

**Status tracking:**

```bash
# .STATUS file integration
status: "Active"
progress: 60
next: "Run simulation study from /research:simulation:design output"

# flow-cli displays Scholar command outputs in dashboard
```

**See also:**

- [flow-cli Documentation](https://github.com/Data-Wise/flow-cli)
- [Scholar + flow-cli Integration Guide](../workflows/research/flow-integration.md)

---

## Troubleshooting

### API authentication issues

**Problem:** "Authentication failed" or "API key not found"

**Solutions:**

**1. Set API key:**

```bash
# In ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-..."

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**2. Verify key is set:**

```bash
echo $ANTHROPIC_API_KEY
# Should show: sk-ant-...
```

**3. Check API key validity:**

```bash
# Test with simple command
/research:arxiv "test" --max 1

# If still fails, key may be invalid/expired
# Generate new key: https://console.anthropic.com/
```

**4. Permission issues:**

```bash
# Ensure key has proper permissions
# API keys should have research/command access enabled
```

**5. Rate limiting:**

```bash
# If "rate limit exceeded":
# - Wait a few minutes
# - Reduce number of concurrent requests
# - Check account tier limits
```

---

### No results from arXiv search

**Problem:** Search returns "No papers found" or empty results

**Solutions:**

**1. Broaden search terms:**

```bash
# Too specific
/research:arxiv "bootstrap percentile confidence intervals for indirect effects in causal mediation"

# Better
/research:arxiv "bootstrap mediation"
/research:arxiv "mediation analysis"
```

**2. Remove date filters:**

```bash
# If --since or -recent returns nothing
/research:arxiv "topic"  # No date filter
```

**3. Try alternative terminology:**

```bash
# If "causal mediation" finds nothing:
/research:arxiv "indirect effects"
/research:arxiv "path analysis"
/research:arxiv "mediation mechanisms"
```

**4. Check spelling:**

```bash
# Common mistakes:
"medeation" → "mediation"
"boostrap" → "bootstrap"
"analisys" → "analysis"
```

**5. Search broader categories:**

```bash
# Instead of very specific method:
/research:arxiv "resampling methods"  # includes bootstrap
/research:arxiv "causal inference"    # includes mediation
```

**6. Verify internet connection:**

```bash
ping arxiv.org
# Should show responses
```

---

### DOI not found errors

**Problem:** "Unable to retrieve metadata for DOI" or "DOI not found"

**Solutions:**

**1. Verify DOI format:**

```bash
# Correct format
/research:doi "10.1080/01621459.2020.1765785"

# Wrong (missing quotes)
/research:doi 10.1080/01621459.2020.1765785

# Wrong (includes URL)
/research:doi "https://doi.org/10.1080/..."

# Wrong (spaces)
/research:doi "10.1080 / 01621459.2020.1765785"
```

**2. Check for typos:**

```bash
# DOIs are case-insensitive but exact
# Double-check each character, especially:
# - Dots vs commas
# - Zeros vs letter O
# - One vs lowercase L
```

**3. Verify DOI exists:**

```bash
# Test in browser:
https://doi.org/10.1080/01621459.2020.1765785

# Should redirect to publisher page
# If browser shows "DOI not found", DOI is invalid
```

**4. Try CrossRef search:**

```bash
# Search for paper on CrossRef:
# https://search.crossref.org/
# Find correct DOI, copy exactly
```

**5. arXiv DOIs:**

```bash
# arXiv papers have special DOI format
/research:doi "10.48550/arXiv.2401.12345"

# Note: Some old arXiv papers don't have DOIs
# Use arXiv ID instead if DOI unavailable
```

**6. Preprints without DOIs:**

```bash
# Not all preprints have DOIs
# If paper is only on arXiv without journal publication:
# - May not have DOI yet
# - Use arXiv metadata from /research:arxiv instead
```

---

### BibTeX parsing problems

**Problem:** "Invalid BibTeX syntax" or entry not added correctly

**Solutions:**

**1. Check for balanced braces:**

```bibtex
# Wrong (missing closing brace)
@article{key,
  title={My Paper

# Correct
@article{key,
  title={My Paper}
}
```

**2. Validate entry type:**

```bibtex
# Valid entry types:
@article{...}   # Journal article
@book{...}      # Book
@inproceedings{...}  # Conference paper
@phdthesis{...} # Dissertation
@techreport{...}  # Technical report

# Invalid
@paper{...}     # Not a valid type
```

**3. Required fields:**

```bibtex
# @article requires: author, title, journal, year
@article{key,
  author = {Author, First},  # Required
  title = {Paper Title},     # Required
  journal = {Journal Name},  # Required
  year = {2024}              # Required
}

# Optional but recommended: volume, number, pages, doi
```

**4. Special characters:**

```bibtex
# Escape special LaTeX characters
title = {The \& Symbol}  # Ampersand
title = {50\% Reduction}  # Percent
title = {\$100 Cost}      # Dollar sign

# Protect capitalization
title = {{Bayesian} Analysis}  # Keeps capital B
title = {{COVID-19} Impact}    # Keeps all caps
```

**5. Author formatting:**

```bibtex
# Correct formats:
author = {Smith, John}
author = {Smith, John and Jones, Mary}
author = {Smith, J. and Jones, M. and Brown, K.}

# Wrong
author = {John Smith}  # Difficult to parse correctly
author = {Smith J, Jones M}  # Missing "and"
```

**6. Validate before adding:**

```bash
# Use online BibTeX validator:
# https://www.bibtex.com/c/bibtex-validator/

# Or check locally
biber --tool --validate-datamodel entry.bib
```

---

### Methods section quality concerns

**Problem:** Generated methods section is too generic or doesn't match study

**Solutions:**

**1. Provide more specific prompts:**

```bash
# Generic prompt
/research:manuscript:methods "regression analysis"

# Specific prompt (better)
/research:manuscript:methods "Multiple linear regression predicting depression (PHQ-9) from treatment assignment, controlling for baseline depression, age, sex. Sample size n=150. Bootstrap standard errors with 10,000 replications. Intention-to-treat analysis with multiple imputation for missing data (15% dropout expected)."
```

**2. Include study design details:**

```bash
# Add information about:
# - Study design (RCT, observational, etc.)
# - Sample size and power
# - Outcome measures (with abbreviations)
# - Covariates/confounders
# - Statistical models with equations
# - Estimation methods (OLS, MLE, Bayesian, etc.)
# - Inference procedures (CIs, hypothesis tests)
# - Software/packages used
```

**3. Iterate and refine:**

```bash
# First draft
/research:manuscript:methods "initial description"

# Review output, identify gaps

# Second draft with more detail
/research:manuscript:methods "refined description with specific parameters from first review"

# Repeat until satisfied
```

**4. Add domain-specific context:**

```bash
# For clinical trial:
/research:manuscript:methods "RCT following CONSORT guidelines, registered at ClinicalTrials.gov. Intention-to-treat analysis. Primary outcome: change in PHQ-9 from baseline to 12 weeks. Secondary: anxiety (GAD-7), quality of life (SF-12)."
```

**5. Specify notation preference:**

```bash
/research:manuscript:methods "Use potential outcomes notation Y(z,m) for causal mediation. Define natural direct and indirect effects. Include sequential ignorability assumptions."
```

**6. Always review and edit:**

- Scholar provides a template/starting point
- You must verify it matches your actual study
- Add study-specific details (actual sample size, observed effects, etc.)
- Consult with statistical collaborators
- Never submit generated content without review

---

### Simulation design too generic

**Problem:** Simulation design lacks specificity for your research question

**Solutions:**

**1. State research question explicitly:**

```bash
# Vague
/research:simulation:design "compare methods"

# Specific
/research:simulation:design "Compare Type I error rate and power of bootstrap percentile vs BCa confidence intervals for indirect effects when sample size is 50-200 and effect size varies from 0 to 0.5. Focus on non-normal error distributions."
```

**2. Specify all design factors:**

```bash
/research:simulation:design "
Research question: Does bootstrap improve coverage over asymptotic CIs for mediation?

Sample sizes: 50, 100, 200, 500
True indirect effects: 0 (null), 0.1, 0.2, 0.3, 0.5
Error distributions: Normal(0,1), t(df=5), Skewed chi-square(df=3)
Methods: Percentile bootstrap (B=1000), BCa bootstrap, Delta method

Performance metrics:
- Type I error (when θ=0)
- Coverage (when θ≠0)
- Power
- CI width

Replications: 5000 per scenario
Total scenarios: 4 sample sizes × 5 effects × 3 distributions × 3 methods = 180
"
```

**3. Include computational constraints:**

```bash
/research:simulation:design "... with computational constraints: must complete in < 12 hours on 8-core machine. If design exceeds this, suggest reduced scenarios."
```

**4. Request specific code features:**

```bash
/research:simulation:design "... Generate R code with parallel processing using {parallel} package, progress tracking with {pbapply}, and automatic saving of intermediate results every 100 iterations."
```

**5. Provide context from literature:**

```bash
/research:simulation:design "Replicate simulation study from MacKinnon et al. (2004) but extend to larger sample sizes (n=500, 1000) and add BCa bootstrap method. Same data generation process as original paper."
```

---

### Reviewer response too brief

**Problem:** Generated response doesn't fully address reviewer concern

**Solutions:**

**1. Include full reviewer comment:**

```bash
# Brief
/research:manuscript:reviewer "R2 asks about assumptions"

# Detailed (better)
/research:manuscript:reviewer "Reviewer 2, Comment 3: The authors state that sequential ignorability is satisfied but do not provide evidence. Please demonstrate that (i) there are no unmeasured confounders of M→Y relationship, and (ii) the treatment is randomized. If observational, justify these assumptions with directed acyclic graph or sensitivity analysis."
```

**2. Provide context:**

```bash
/research:manuscript:reviewer "
Reviewer comment: [full quote]

Our study context:
- Randomized controlled trial (n=200)
- Treatment randomized 1:1
- Mediator measured at 6 weeks (between treatment and outcome)
- Outcome at 12 weeks

We included: baseline covariates (age, sex, baseline outcome)
We did NOT include: genetics, unmeasured behaviors

Request: Generate response explaining how randomization ensures (i) but (ii) may be violated, and provide sensitivity analysis approach.
"
```

**3. Specify response elements needed:**

```bash
/research:manuscript:reviewer "... Include in response: (1) acknowledgment of reviewer concern, (2) statistical justification with citations, (3) new analysis we will add (sensitivity analysis), (4) specific page/line numbers where we will make changes, (5) estimated timeline for revisions."
```

**4. Request specific tone:**

```bash
# For overly harsh reviewer
/research:manuscript:reviewer "... Response should be diplomatic but firm. Acknowledge valid points but politely disagree where reviewer misunderstood our methods. Maintain professional tone throughout."

# For valid criticism
/research:manuscript:reviewer "... Response should acknowledge this excellent point, thank reviewer, and describe substantial revisions we will make to address it fully."
```

**5. Add additional analyses:**

```bash
# After generating response, if additional analysis needed:
/research:simulation:design "sensitivity analysis as suggested in response to Reviewer 2"

# Then update response:
/research:manuscript:reviewer "Update previous R2 response to include results from new sensitivity analysis: [results summary]"
```

---

## Advanced Topics

### Custom prompts for manuscripts

You can fine-tune manuscript generation with advanced prompts:

**1. Journal-specific formatting:**

```bash
/research:manuscript:methods "
Methods for JASA submission:
- Include full asymptotic theory (consistency, asymptotic normality)
- Provide regularity conditions as formal assumptions
- Reference technical proofs to appendix
- Use measure-theoretic language where appropriate
- Follow JASA author guidelines for notation
"
```

**2. Audience-specific writing:**

```bash
# For methodological journal
/research:manuscript:methods "Technical methods for statistical audience. Include derivations, proofs, asymptotic properties."

# For applied journal
/research:manuscript:methods "Methods for applied epidemiology audience. Minimize notation, emphasize interpretation and practical implementation."

# For interdisciplinary journal
/research:manuscript:methods "Methods for Science/Nature. High-level overview in main text, technical details in supplementary methods. Emphasize novelty and impact."
```

**3. Section-specific instructions:**

```bash
/research:manuscript:methods "
Write methods section with structure:
1. Study design and participants (1 paragraph)
2. Statistical framework (2 paragraphs with equations)
3. Estimation procedures (2 paragraphs with algorithm)
4. Assumptions and diagnostics (1 paragraph)
5. Inference and sensitivity analysis (1 paragraph)
6. Software and reproducibility (1 paragraph)

Total target: 1000-1200 words.
Use Harvard referencing style.
"
```

**4. Notation customization:**

```bash
/research:manuscript:methods "
Use notation:
- Observed data: (Yᵢ, Mᵢ, Zᵢ, 𝐗ᵢ) for i=1,...,n
- Potential outcomes: Yᵢ(z,m) and Mᵢ(z)
- Parameters: bold Greek (𝛃, 𝛂) for vectors
- Estimators: hat notation θ̂
- Distributions: script letters (𝒩, 𝒰)
- Matrices: bold uppercase (𝐗, 𝛀)
"
```

**5. Integration with existing text:**

```bash
/research:manuscript:methods "
Continue from existing Section 2.1:

[paste existing text]

Now add Section 2.2 describing bootstrap procedure to follow directly after Section 2.1. Match writing style, notation, and level of detail from Section 2.1.
"
```

**See also:** [Advanced Manuscript Techniques](../research/MANUSCRIPT-COMMANDS.md#advanced-techniques)

---

### Integrating with research data

Scholar focuses on methodology and literature, not data analysis. However, you can integrate outputs:

**1. Simulation results → Scholar analysis:**

```bash
# You run simulation in R
Rscript my_simulation.R  # Produces results.csv

# Scholar analyzes
/research:simulation:analysis results.csv

# Scholar provides:
# - Performance summaries
# - Interpretation
# - Visualization code
```

**2. Study results → Methods/Results sections:**

```bash
# You have analysis results (estimates, CIs, p-values)

# Generate methods describing what you did
/research:manuscript:methods "Describe bootstrap mediation analysis for RCT with n=150"

# Generate results reporting your findings
/research:manuscript:results "Report mediation results: indirect effect = 0.42, 95% CI [0.18, 0.66], p=.03; direct effect = 0.28, 95% CI [-0.05, 0.61], p=.09"
```

**3. Data characteristics → Simulation design:**

```bash
# Your data: n=200, 30% missing, skewed outcome

/research:simulation:design "
Design simulation matching my data:
- Sample size: 200
- Missing data: 30% MCAR
- Outcome distribution: log-normal (skewed)
- Compare complete case vs multiple imputation
"
```

**4. Workflow integration:**

```r
# In R script:

# 1. Run your analysis
results <- analyze_my_data(data)

# 2. Save results
write.csv(results, "analysis_results.csv")

# 3. Switch to terminal, use Scholar
# /research:simulation:analysis analysis_results.csv

# 4. Scholar provides interpretation and visualization code

# 5. Back to R: run visualization code from Scholar output
```

**Important:** Scholar does NOT:

- Access your datasets directly
- Run statistical analyses on your data
- Connect to databases or data warehouses
- Perform data cleaning/preprocessing

Scholar DOES:

- Design analyses and simulations
- Interpret completed analysis results
- Generate methodology descriptions
- Provide visualization code templates

---

### Publication workflow automation

Automate repetitive manuscript preparation tasks:

**1. Methods section generation:**

```bash
#!/bin/bash
# generate-methods.sh
# Generates all methods sections for manuscript

PROJECT="my-manuscript"
OUTPUT_DIR="manuscript/sections"

mkdir -p "$OUTPUT_DIR"

# Study design
/research:manuscript:methods "RCT design with mediation analysis" \
  > "$OUTPUT_DIR/methods-study-design.tex"

# Statistical analysis
/research:manuscript:methods "Bootstrap confidence intervals for indirect effects" \
  > "$OUTPUT_DIR/methods-statistical-analysis.tex"

# Sensitivity analysis
/research:manuscript:methods "Sensitivity analysis for unmeasured confounding" \
  > "$OUTPUT_DIR/methods-sensitivity.tex"

echo "Methods sections generated in $OUTPUT_DIR"
```

**2. Bibliography maintenance:**

```bash
#!/bin/bash
# update-bibliography.sh
# Checks for new papers and updates bibliography

TOPICS_FILE="research-topics.txt"
REFS="manuscript/references.bib"
REPORT="bib-update-$(date +%Y%m%d).md"

echo "# Bibliography Update - $(date +%Y-%m-%d)" > "$REPORT"
echo "" >> "$REPORT"

while read topic; do
  echo "Checking: $topic"

  # Search for recent papers
  results=$(/research:arxiv "$topic" --since $(date -d "30 days ago" +%Y-%m-%d) --max 5)

  if [ -n "$results" ]; then
    echo "## New papers: $topic" >> "$REPORT"
    echo "$results" >> "$REPORT"
    echo "" >> "$REPORT"
  fi
done < "$TOPICS_FILE"

# Review report manually, add relevant papers to bibliography
echo "Review $REPORT for papers to add"
```

**3. Submission checklist automation:**

```bash
#!/bin/bash
# submission-checklist.sh
# Verifies manuscript completeness

PROJECT_DIR="manuscript"
ERRORS=0

echo "Manuscript Submission Checklist"
echo "================================"
echo ""

# Check files exist
for file in main.tex references.bib figures/*.pdf; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    ((ERRORS++))
  else
    echo "✓ Found: $file"
  fi
done

# Check citation completeness
echo ""
echo "Citation Check:"
# Extract \cite{} commands
CITED=$(grep -oh '\\cite{[^}]*}' main.tex | sed 's/\\cite{//;s/}//' | tr ',' '\n' | sort -u)

# Check each citation exists in .bib
for cite in $CITED; do
  if ! /research:bib:search "$cite" references.bib > /dev/null 2>&1; then
    echo "❌ Citation not in bibliography: $cite"
    ((ERRORS++))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo ""
  echo "✅ Manuscript ready for submission!"
else
  echo ""
  echo "⚠️  $ERRORS issues found. Fix before submission."
  exit 1
fi
```

**4. Reviewer response template:**

```bash
#!/bin/bash
# reviewer-responses.sh
# Generates structured responses to all reviewer comments

REVIEWS_FILE="reviewer-comments.txt"
OUTPUT="responses.md"

echo "# Responses to Reviewers" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "We thank the reviewers for their thoughtful comments..." >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Process each comment (assumes format: "R1-C1: comment text")
grep "^R[0-9]-C[0-9]:" "$REVIEWS_FILE" | while read line; do
  comment=$(echo "$line" | sed 's/^R[0-9]-C[0-9]: //')

  echo "Generating response for: $comment"

  response=$(/research:manuscript:reviewer "$comment")

  echo "## $line" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "$response" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "---" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
done

echo "Responses generated in $OUTPUT"
echo "Review and edit before submission!"
```

**See also:** [Publication Automation Workflows](../workflows/research/publication-automation.md)

---

### Reproducibility best practices

Ensure your research is reproducible:

**1. Version control all Scholar outputs:**

```bash
# Track generated content
git add manuscript/methods.md
git add manuscript/results.md
git add references.bib

git commit -m "Add methods and results sections generated by Scholar v2.6.0"
```

**2. Document Scholar commands used:**

```bash
# Create SCHOLAR-LOG.md in your project
cat > SCHOLAR-LOG.md << 'EOF'
# Scholar Commands Log

## Methods Section
Generated: 2026-01-31
Command:
```

/research:manuscript:methods "Bootstrap confidence intervals for indirect effects in RCT with n=200, 10,000 bootstrap replications"

```

Output: manuscript/methods.md
Scholar version: 2.6.0

## Simulation Study
Generated: 2026-02-01
Command:
```

/research:simulation:design "Compare bootstrap vs asymptotic CIs, sample sizes 50-500, 5000 replications"

```

Output: simulation/design.md
Scholar version: 2.6.0

Implemented in: simulation/run_simulation.R
Results: simulation/results.csv

Analysis command:
```

/research:simulation:analysis simulation/results.csv

```

Output: simulation/analysis.md
EOF

git add SCHOLAR-LOG.md
git commit -m "Add Scholar commands log for reproducibility"
```

**3. Save bibliographic search history:**

```bash
# Log all literature searches
echo "$(date +%Y-%m-%d): /research:arxiv 'causal mediation'" >> literature-search-log.txt
echo "$(date +%Y-%m-%d): /research:doi '10.1080/01621459.2020.1765785'" >> literature-search-log.txt

git add literature-search-log.txt
git commit -m "Update literature search log"
```

**4. Include Scholar version in methods:**

```markdown
## Software

Statistical analyses were conducted in R version 4.3.2. Methods sections
were drafted using Scholar v2.6.0 (https://github.com/Data-Wise/scholar),
an AI-assisted academic research tool, and subsequently reviewed and
edited by the authors. Literature searches were conducted using Scholar's
arXiv integration in January 2026.

Simulation study design was generated using Scholar v2.6.0 and implemented
in R using the {boot} package (Canty & Ripley, 2024). All analysis code
is available at: https://github.com/username/project-name
```

**5. Archive final state:**

```bash
# Create reproducibility package
mkdir reproducibility-package
cp manuscript/*.tex reproducibility-package/
cp manuscript/references.bib reproducibility-package/
cp SCHOLAR-LOG.md reproducibility-package/
cp -r simulation/ reproducibility-package/

tar -czf reproducibility-$(date +%Y%m%d).tar.gz reproducibility-package/

# Upload to repository (Zenodo, OSF, etc.)
```

**6. Share Scholar prompts in supplementary materials:**

```markdown
# Supplementary Materials

## Appendix A: Scholar Command Prompts

All sections of the manuscript were drafted with assistance from Scholar
v2.6.0. Below are the exact prompts used:

### Methods Section (Section 2)
**Prompt:**
"Describe the bootstrap confidence interval procedure for indirect effects
in a randomized controlled trial. Include: (1) study design with n=200
participants, (2) product-of-coefficients estimation, (3) percentile
bootstrap with 10,000 replications, (4) sequential ignorability assumptions,
(5) R implementation using {mediation} package."

**Output:** Reviewed and edited for study-specific details (actual sample
size, observed effect estimates, etc.). Final version approved by all authors.

### Simulation Study Design (Section 3)
**Prompt:**
[full prompt text]

**Implementation:** Code template provided by Scholar was adapted for our
specific research question and validated through pilot runs before full
execution.
```

**See also:** [Reproducibility Guide](../workflows/research/reproducibility.md)

---

## Additional Resources

**Documentation:**

- [Research Commands Reference](../research/RESEARCH-COMMANDS-REFERENCE.md) - Complete 14-command guide
- [Literature Commands Guide](../research/LITERATURE-COMMANDS.md) - Deep dive into literature management
- [Manuscript Commands Guide](../research/MANUSCRIPT-COMMANDS.md) - Writing assistance details
- [Simulation Commands Guide](../research/SIMULATION-COMMANDS.md) - Monte Carlo study reference

**Tutorials:**

- [First Literature Search](../tutorials/research/first-literature-search.md) - 15-minute beginner tutorial
- [Simulation Study Design](../tutorials/research/simulation-study.md) - Complete workflow

**Workflows:**

- [Literature Review Workflow](../workflows/research/literature-review.md) - 2-4 hour systematic review
- [Manuscript Writing Workflow](../workflows/research/manuscript-writing.md) - 8-12 week timeline
- [Reviewer Response Workflow](../workflows/research/reviewer-response.md) - Handling peer review

**Quick References:**

- [Research Commands Quick Reference](../refcards/research-commands.md) - TL;DR cheat sheet
- [Troubleshooting Guide](TROUBLESHOOTING-research.md) - Error reference and troubleshooting

**Community:**

- [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions) - Ask questions, share workflows
- [GitHub Issues](https://github.com/Data-Wise/scholar/issues) - Report bugs, request features
- [Examples Repository](../examples/research.md) - Real-world use cases

---

**Last Updated:** 2026-01-31
**Version:** 2.6.0
**Questions covered:** 50+

**Can't find your question?**

- Check the [Teaching FAQ](FAQ-teaching.md) for non-research questions
- Search [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions)
- Open an [issue](https://github.com/Data-Wise/scholar/issues/new) with the "question" label
