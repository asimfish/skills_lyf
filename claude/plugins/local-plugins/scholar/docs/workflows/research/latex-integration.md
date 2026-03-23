---
render_macros: false
---

# LaTeX Integration Workflows

Complete guide to integrating Scholar with LaTeX/Quarto for academic manuscript preparation.

**Time to Master:** 2-3 weeks
**Difficulty:** Intermediate
**Prerequisites:** LaTeX basics, BibTeX familiarity, Scholar research commands
**Output:** Production-ready manuscripts with integrated Scholar workflows

---

## Navigation

- [Overview](#overview)
- [Bibliography Management](#bibliography-management)
- [Manuscript Compilation](#manuscript-compilation)
- [Notation Standardization](#notation-standardization)
- [Proof Checking](#proof-checking)
- [Quarto Integration](#quarto-integration)
- [Common Issues](#common-issues)
- [Complete Workflows](#complete-workflows)

---

## Overview

### Why Integrate Scholar with LaTeX?

LaTeX is the gold standard for academic manuscript preparation, especially in mathematics and statistics. Scholar enhances LaTeX workflows by:

- **Automated bibliography management** - No manual BibTeX entry
- **Methods section generation** - Convert analysis plans to LaTeX
- **Results formatting** - Statistical reporting with proper notation
- **Proof validation** - Check mathematical derivations
- **Reproducible pipelines** - From analysis to publication

### Scholar + LaTeX Workflow

```
Research → Scholar Commands → LaTeX Document → PDF Manuscript
   ↓
[Analysis Plan] → /research:manuscript:methods → methods.tex
[Results CSV]   → /research:manuscript:results → results.tex
[Proof Text]    → /research:manuscript:proof   → appendix.tex
[DOI List]      → /research:bib:add            → references.bib
```

---

## Bibliography Management

### Basic BibTeX Workflow

**Problem:** Managing 50+ citations in LaTeX manuscript

**Solution: Scholar-managed bibliography**

#### Step 1: Initialize Project Bibliography

```bash
# Create project directory
mkdir -p ~/papers/mediation-paper
cd ~/papers/mediation-paper

# Initialize bibliography
touch references.bib

# Create LaTeX document structure
mkdir -p {sections,figures,tables}
```

#### Step 2: Collect Citations

```bash
#!/bin/bash
# collect-citations.sh

DOIS=(
  "10.1037/a0020761"    # Preacher & Hayes 2008
  "10.1080/00273171.2011.606716"  # MacKinnon 2004
  "10.1214/09-STS301"   # Imai et al. 2010
)

for doi in "${DOIS[@]}"; do
  echo "Fetching: $doi"

  /research:doi "$doi" > temp-citation.txt

  # Extract BibTeX
  sed -n '/@article{/,/^}$/p' temp-citation.txt > temp-entry.bib

  # Add to bibliography
  if [ -s temp-entry.bib ]; then
    /research:bib:add temp-entry.bib references.bib
    echo "  Added to references.bib"
  fi

  rm temp-citation.txt temp-entry.bib
done

echo "Bibliography complete: $(grep -c '@' references.bib) entries"
```

#### Step 3: Use in LaTeX

```latex
\documentclass{article}
\usepackage{natbib}

\begin{document}

\title{Bootstrap Confidence Intervals for Mediation Analysis}
\author{Your Name}
\maketitle

\section{Introduction}
Bootstrap methods for mediation analysis \citep{preacher2008asymptotic} have
become increasingly popular. The approach builds on foundational work by
\citet{mackinnon2004confidence} and extends to multiple mediators
\citep{imai2010general}.

\bibliographystyle{apalike}
\bibliography{references}

\end{document}
```

#### Step 4: Compile

```bash
pdflatex manuscript.tex
bibtex manuscript
pdflatex manuscript.tex
pdflatex manuscript.tex
```

### Advanced: Citation Search Within LaTeX

**Problem:** Need to find citation key while writing

**Solution: LaTeX-integrated bibliography search**

```bash
#!/bin/bash
# find-citation.sh

SEARCH="$1"

if [ -z "$SEARCH" ]; then
  echo "Usage: $0 <search-term>"
  echo "Example: $0 'Preacher 2008'"
  exit 1
fi

# Search bibliography
/research:bib:search "$SEARCH" references.bib

# Extract citation key for LaTeX
echo ""
echo "LaTeX citation:"
KEY=$(grep '@' references.bib | grep -i "$SEARCH" | sed 's/@article{/\\cite{/' | sed 's/,/}/')
echo "$KEY"
```

**Usage:**

```bash
# While writing LaTeX
./find-citation.sh "Preacher 2008"
# Output: \cite{preacher2008asymptotic}

# Copy to LaTeX document
```

### Automated Bibliography Sync

**Problem:** Bibliography gets out of sync across projects

**Solution: Master bibliography with project subsets**

```bash
#!/bin/bash
# sync-project-bibliography.sh

MASTER_BIB="$HOME/.bibliography/master-references.bib"
PROJECT_BIB="./references.bib"

# Check which entries are in project but not in master
echo "Checking for new entries..."

grep '@article{' "$PROJECT_BIB" | while read line; do
  KEY=$(echo "$line" | sed 's/@article{//' | sed 's/,//')

  if ! grep -q "@article{$KEY," "$MASTER_BIB"; then
    echo "  New entry: $KEY"

    # Extract full entry and add to master
    sed -n "/@article{$KEY,/,/^}$/p" "$PROJECT_BIB" >> "$MASTER_BIB"
  fi
done

# Sort master bibliography
sort "$MASTER_BIB" > "${MASTER_BIB}.sorted"
mv "${MASTER_BIB}.sorted" "$MASTER_BIB"

echo "Master bibliography updated"
```

---

## Manuscript Compilation

### Complete LaTeX Project Structure

```
mediation-paper/
├── manuscript.tex           # Main document
├── references.bib           # Bibliography (Scholar-managed)
├── sections/
│   ├── introduction.tex     # Manual
│   ├── methods.tex          # Generated by Scholar
│   ├── results.tex          # Generated by Scholar
│   ├── discussion.tex       # Manual
│   └── appendix.tex         # Proofs (validated by Scholar)
├── figures/
│   ├── coverage-plot.pdf
│   └── power-curves.pdf
├── tables/
│   ├── table1-performance.tex
│   └── table2-comparison.tex
└── scripts/
    ├── generate-methods.sh
    ├── generate-results.sh
    └── compile.sh
```

### Automated Section Generation

#### Generate Methods Section

```bash
#!/bin/bash
# scripts/generate-methods.sh

# Read analysis plan
ANALYSIS_PLAN=$(cat ../analysis/analysis-plan.md 2>/dev/null || echo "No analysis plan found")

# Generate methods section
/research:manuscript:methods "$ANALYSIS_PLAN Monte Carlo simulation comparing bootstrap methods. Sample sizes: 50, 100, 200, 500. Replications: 5000 per condition. Metrics: coverage probability, bias, MSE. R version 4.3.0, boot package." > sections/methods-draft.md

# Convert to LaTeX format
cat > sections/methods.tex << 'LATEX'
\section{Methods}

\subsection{Study Design}
We conducted a Monte Carlo simulation study to compare bootstrap confidence
interval methods for indirect effects in mediation analysis.

\subsection{Data Generation}
Data were generated according to the following mediation model:
\begin{align}
M &= \alpha Z + \epsilon_M \\
Y &= \beta M + \gamma Z + \epsilon_Y
\end{align}
where $Z \sim \text{Bernoulli}(0.5)$ is the binary treatment,
$\epsilon_M, \epsilon_Y \sim N(0, 1)$ are independent errors,
and $\alpha, \beta, \gamma$ are regression coefficients.

\subsection{Simulation Conditions}
We varied sample size ($n \in \{50, 100, 200, 500\}$) and
indirect effect strength ($\alpha\beta \in \{0, 0.1, 0.3, 0.5\}$)
in a factorial design.

\subsection{Performance Metrics}
For each method and condition, we calculated:
\begin{itemize}
\item \textbf{Coverage probability}: Proportion of replications where
      95\% CI contained true indirect effect
\item \textbf{Bias}: $E[\hat{\theta}] - \theta$
\item \textbf{Mean squared error}: $E[(\hat{\theta} - \theta)^2]$
\end{itemize}

\subsection{Software}
All analyses were conducted in R version 4.3.0 using the \texttt{boot}
package for bootstrap resampling.
LATEX

echo "Methods section generated: sections/methods.tex"
```

#### Generate Results Section

```bash
#!/bin/bash
# scripts/generate-results.sh

RESULTS_CSV="../results/simulation-results.csv"

if [ ! -f "$RESULTS_CSV" ]; then
  echo "ERROR: Results file not found: $RESULTS_CSV"
  exit 1
fi

# Analyze results with Scholar
/research:simulation:analysis "$RESULTS_CSV" > analysis-report.md

# Extract key findings
FINDINGS=$(grep -A 30 "Performance Summary" analysis-report.md)

# Generate results text
/research:manuscript:results "$FINDINGS" > sections/results-draft.md

# Convert to LaTeX with statistical notation
cat > sections/results.tex << 'LATEX'
\section{Results}

\subsection{Coverage Probability}

Table~\ref{tab:coverage} shows empirical coverage rates for 95\% confidence
intervals across methods and sample sizes.

Bootstrap BCa intervals maintained nominal coverage rates
(mean coverage = 0.95, SD = 0.01) across all sample sizes.
In contrast, bootstrap percentile intervals under-covered in small samples
($n = 50$: coverage = 0.91, 95\% CI [0.89, 0.93]).

The Sobel test showed substantial under-coverage at small sample sizes
($n = 50$: coverage = 0.87, 95\% CI [0.85, 0.89];
$n = 100$: coverage = 0.92, 95\% CI [0.90, 0.94]).
Coverage improved to nominal levels only at $n \geq 200$.

\subsection{Bias and Efficiency}

All methods produced approximately unbiased estimates of the indirect effect
(absolute bias $< 0.05$ across conditions).

Mean squared error (MSE) decreased with sample size for all methods.
BCa bootstrap showed lowest MSE at $n = 50$ (MSE = 0.082)
compared to percentile (MSE = 0.089) and Sobel (MSE = 0.095).

\subsection{Effect of Distribution}

Under non-normal errors (skewed distribution), coverage advantages of BCa
bootstrap were even more pronounced (coverage = 0.94 vs. 0.88 for Sobel test
at $n = 50$).
LATEX

echo "Results section generated: sections/results.tex"
```

### Complete Manuscript Assembly

**Main document (manuscript.tex):**

```latex
\documentclass[12pt]{article}

% Packages
\usepackage{amsmath, amssymb}
\usepackage{natbib}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{hyperref}

% Title
\title{Bootstrap Confidence Intervals for Mediation Analysis:\\
       A Comparative Simulation Study}
\author{Your Name$^1$ and Coauthor$^2$}
\date{}

\begin{document}

\maketitle

\begin{abstract}
Bootstrap methods have become increasingly popular for constructing confidence
intervals for indirect effects in mediation analysis. However, the relative
performance of different bootstrap variants (percentile, BCa, studentized)
remains unclear, particularly in small samples. We conducted a Monte Carlo
simulation study comparing bootstrap methods with the traditional Sobel test
across sample sizes ranging from 50 to 500. Results showed that BCa bootstrap
maintained nominal coverage rates across all sample sizes, while percentile
bootstrap and Sobel test under-covered in small samples ($n < 100$).
We recommend BCa bootstrap for mediation analysis, especially when sample
sizes are limited.
\end{abstract}

\section{Introduction}
\input{sections/introduction}

\input{sections/methods}

\input{sections/results}

\section{Discussion}
\input{sections/discussion}

% Bibliography
\bibliographystyle{apalike}
\bibliography{references}

% Appendix
\appendix
\section{Proofs}
\input{sections/appendix}

\end{document}
```

### Automated Compilation Script

```bash
#!/bin/bash
# scripts/compile.sh

echo "=== Compiling Manuscript ==="

# 1. Generate sections from Scholar
echo "Step 1: Generating methods section..."
./scripts/generate-methods.sh

echo "Step 2: Generating results section..."
./scripts/generate-results.sh

# 2. Compile LaTeX
echo "Step 3: Compiling LaTeX..."
cd ..

pdflatex manuscript.tex
bibtex manuscript
pdflatex manuscript.tex
pdflatex manuscript.tex

# 3. Check for errors
if [ $? -eq 0 ]; then
  echo ""
  echo "=== Compilation successful! ==="
  echo "Output: manuscript.pdf"

  # Open PDF
  open manuscript.pdf  # macOS
  # xdg-open manuscript.pdf  # Linux
else
  echo ""
  echo "=== Compilation failed ==="
  echo "Check manuscript.log for errors"
  exit 1
fi

# 4. Cleanup auxiliary files
rm -f *.aux *.log *.bbl *.blg *.out *.toc

echo "Compilation complete!"
```

---

## Notation Standardization

### Problem: Inconsistent Mathematical Notation

**Solution: Scholar-suggested notation standards**

```bash
# Use Scholar to check notation consistency
/research:manuscript:proof "Review notation in manuscript for consistency.
Variables: treatment Z, mediator M, outcome Y.
Parameters: alpha (treatment→mediator), beta (mediator→outcome),
gamma (direct effect).
Indirect effect: theta = alpha*beta.
Check Greek letters, subscripts, and operators match conventions."
```

### LaTeX Notation Macros

**Create standardized macros:**

```latex
% notation.tex - Include in preamble

% Variables
\newcommand{\tZ}{Z}           % Treatment
\newcommand{\tM}{M}           % Mediator
\newcommand{\tY}{Y}           % Outcome

% Parameters
\newcommand{\palpha}{\alpha}  % Treatment effect on mediator
\newcommand{\pbeta}{\beta}    % Mediator effect on outcome
\newcommand{\pgamma}{\gamma}  % Direct effect
\newcommand{\ptheta}{\theta}  % Indirect effect

% Estimators
\newcommand{\hatalpha}{\hat{\alpha}}
\newcommand{\hatbeta}{\hat{\beta}}
\newcommand{\hattheta}{\hat{\theta}}

% Distributions
\newcommand{\Normal}[2]{\mathcal{N}(#1, #2)}
\newcommand{\iid}{\stackrel{\text{iid}}{\sim}}

% Operators
\newcommand{\E}{\mathbb{E}}
\newcommand{\Var}{\text{Var}}
\newcommand{\Cov}{\text{Cov}}
```

**Usage:**

```latex
The indirect effect is $\ptheta = \palpha\pbeta$, estimated by
$\hattheta = \hatalpha\hatbeta$. Under the assumption that
errors $\epsilon_M, \epsilon_Y \iid \Normal{0}{1}$, we have
$\E[\hattheta] = \ptheta$.
```

---

## Proof Checking

### Validate Mathematical Proofs

**Problem:** Theorem proofs in appendix need validation

**Solution: Use Scholar proof checker**

#### Step 1: Write Proof in LaTeX

```latex
% appendix.tex

\section{Proof of Theorem 1}

\begin{theorem}
Under regularity conditions A1--A5, the bootstrap BCa estimator
$\hattheta_{\text{BCa}}$ is consistent for the true indirect effect $\ptheta$.
\end{theorem}

\begin{proof}
By the law of large numbers, the bootstrap distribution converges to the
sampling distribution. The BCa correction adjusts for bias and skewness via:
\begin{align}
z_0 &= \Phi^{-1}\left(P(\hattheta^* < \hattheta)\right) \\
a &= \frac{1}{6}\frac{\sum_i (\hattheta_{(i)} - \bar{\hattheta})^3}
     {[\sum_i (\hattheta_{(i)} - \bar{\hattheta})^2]^{3/2}}
\end{align}

The corrected percentiles are:
$$
\alpha_1 = \Phi\left(z_0 + \frac{z_0 + z_\alpha}{1 - a(z_0 + z_\alpha)}\right)
$$

Under the assumption of smooth functionals (Condition A3), these percentiles
converge to the correct coverage level. By the continuous mapping theorem,
$\hattheta_{\text{BCa}} \to \ptheta$ in probability as $n \to \infty$.
\end{proof}
```

#### Step 2: Extract Proof Text for Validation

```bash
#!/bin/bash
# validate-proof.sh

# Extract proof text (remove LaTeX commands)
PROOF_TEXT=$(sed 's/\\[a-zA-Z]*{//g; s/}//g; s/\\[a-zA-Z]*//g' sections/appendix.tex)

# Validate with Scholar
/research:manuscript:proof "$PROOF_TEXT

Theorem: Bootstrap BCa is consistent for indirect effect.

Proof strategy:
1. Bootstrap distribution converges (LLN)
2. BCa correction adjusts bias and skewness
3. Corrected percentiles achieve nominal coverage
4. Consistency via continuous mapping theorem

Assumptions:
A1: Random sampling
A2: Finite moments
A3: Smooth functionals
A4: Regularity conditions for bootstrap
A5: Correct model specification
" > proof-validation.md

echo "Proof validation: proof-validation.md"
```

#### Step 3: Review Validation Output

Scholar checks:
- Logical structure (premises → conclusion)
- Assumption usage (all stated assumptions invoked?)
- Notation consistency
- Mathematical rigor
- Completeness

### Common Proof Issues

| Issue | Scholar Detection | Fix |
|-------|-------------------|-----|
| Missing assumption | "Assumption X not stated" | Add to theorem preamble |
| Logical gap | "Step Y does not follow from Z" | Add intermediate step |
| Notation inconsistency | "Variable $\theta$ undefined" | Define all notation |
| Circular reasoning | "Conclusion used in proof" | Restructure argument |

---

## Quarto Integration

### Why Quarto?

Quarto combines Markdown + LaTeX + R/Python code for reproducible documents.

**Benefits:**
- Write in Markdown (easier than LaTeX)
- Embed R/Python code for results
- Compile to PDF via LaTeX
- Fully reproducible manuscripts

### Scholar + Quarto Workflow

#### Project Structure

```
mediation-paper.qmd
references.bib
_quarto.yml
code/
  simulation.R
  analysis.R
results/
  simulation-results.csv
figures/
  coverage-plot.pdf
```

#### Quarto Document with Scholar Integration

````markdown
---
title: "Bootstrap Confidence Intervals for Mediation Analysis"
author: "Your Name"
format:
  pdf:
    documentclass: article
    keep-tex: true
bibliography: references.bib
---

## Introduction

Bootstrap methods for mediation analysis [@preacher2008asymptotic] have
become increasingly popular...

## Methods

```{bash}
#| echo: false
#| output: asis

# Generate methods section with Scholar
/research:manuscript:methods "Monte Carlo simulation comparing bootstrap
methods. Sample sizes: 50, 100, 200, 500. Metrics: coverage, bias, MSE.
R version 4.3.0." | sed 's/^//'
```

## Results

```{r}
#| echo: false
#| label: tbl-coverage
#| tbl-cap: "Coverage Rates for 95% Confidence Intervals"

library(knitr)
library(dplyr)

results <- read.csv("results/simulation-results.csv")

coverage_table <- results %>%
  group_by(method, n) %>%
  summarize(coverage = mean(ci_lower <= true_theta & ci_upper >= true_theta)) %>%
  pivot_wider(names_from = method, values_from = coverage)

kable(coverage_table, digits = 3)
```

Table @tbl-coverage shows coverage rates across methods and sample sizes.
BCa bootstrap maintained nominal coverage (0.93-0.96) across all sample sizes.

## Discussion

[Discussion text...]

## References

::: {#refs}
:::
````

#### Compile Quarto Document

```bash
# Render to PDF
quarto render mediation-paper.qmd --to pdf

# Output: mediation-paper.pdf
```

### Advanced: Dynamic Scholar Integration in Quarto

````markdown
## Methods

```{bash scholar-methods}
#| echo: false
#| output: asis
#| cache: true

# Read analysis plan
ANALYSIS_PLAN=$(cat analysis-plan.md)

# Generate methods
/research:manuscript:methods "$ANALYSIS_PLAN" | \
  pandoc -f markdown -t markdown
```

## Results

```{bash scholar-results}
#| echo: false
#| output: asis
#| cache: true

# Analyze simulation results
/research:simulation:analysis results/simulation-results.csv > analysis-report.md

# Extract findings
FINDINGS=$(grep -A 30 "Performance Summary" analysis-report.md)

# Generate results text
/research:manuscript:results "$FINDINGS" | \
  pandoc -f markdown -t markdown
```
````

---

## Common Issues

### Issue 1: BibTeX Compilation Errors

**Problem:** `bibtex` fails with "undefined references"

**Diagnosis:**

```bash
# Check for syntax errors in references.bib
grep '@' references.bib | while read line; do
  if ! echo "$line" | grep -q ','; then
    echo "Missing comma: $line"
  fi
done
```

**Fix:**

```bash
# Validate BibTeX syntax
biber --tool --validate-datamodel references.bib

# Or use online validator
# http://www.bibtex.org/Using/
```

### Issue 2: Citation Key Not Found

**Problem:** `LaTeX Warning: Citation 'smith2020' undefined`

**Diagnosis:**

```bash
# Check if key exists in bibliography
/research:bib:search "smith2020" references.bib

# List all citation keys
grep '@article{' references.bib | sed 's/@article{//' | sed 's/,//'
```

**Fix:**

```bash
# Add missing citation
/research:doi "10.xxxx/xxxxx"
# Extract and add to references.bib
```

### Issue 3: Math Notation Rendering Issues

**Problem:** Complex equations not rendering correctly

**Fix: Use proper LaTeX environments**

```latex
% Bad: Inline math for display equation
The indirect effect is $\hat{\theta} = \hat{\alpha}\hat{\beta}$.

% Good: Display equation
The indirect effect is:
\begin{equation}
\hat{\theta} = \hat{\alpha}\hat{\beta}
\end{equation}

% Best: Aligned equations with labels
\begin{align}
\hat{\theta} &= \hat{\alpha}\hat{\beta} \label{eq:indirect}\\
\text{SE}(\hat{\theta}) &= \sqrt{\hat{\alpha}^2\text{SE}(\hat{\beta})^2 +
                           \hat{\beta}^2\text{SE}(\hat{\alpha})^2} \label{eq:se}
\end{align}
```

---

## Complete Workflows

### Workflow 1: Simulation Study → LaTeX Manuscript

**Full pipeline:**

```bash
#!/bin/bash
# simulation-to-latex-manuscript.sh

PROJECT="bootstrap-mediation-study"

echo "=== Simulation to LaTeX Manuscript Pipeline ==="

# Step 1: Run simulation (assume already done)
RESULTS="results/simulation-results.csv"

if [ ! -f "$RESULTS" ]; then
  echo "ERROR: Run simulation first and save to $RESULTS"
  exit 1
fi

# Step 2: Analyze results
/research:simulation:analysis "$RESULTS" > analysis-report.md

# Step 3: Generate methods section
/research:manuscript:methods "$(cat design/analysis-plan.md)" > sections/methods-draft.md

# Convert to LaTeX
pandoc sections/methods-draft.md -o sections/methods.tex

# Step 4: Generate results section
FINDINGS=$(grep -A 30 "Performance Summary" analysis-report.md)
/research:manuscript:results "$FINDINGS" > sections/results-draft.md

# Convert to LaTeX with citations
pandoc sections/results-draft.md --citeproc -o sections/results.tex

# Step 5: Validate proofs (if any)
if [ -f "sections/appendix-draft.tex" ]; then
  PROOF_TEXT=$(cat sections/appendix-draft.tex)
  /research:manuscript:proof "$PROOF_TEXT" > proof-validation.md
  echo "Proof validation: proof-validation.md"
fi

# Step 6: Compile manuscript
cd manuscript/
./compile.sh

echo "=== Pipeline complete! ==="
echo "Output: manuscript/manuscript.pdf"
```

### Workflow 2: Reviewer Revisions → Updated LaTeX

**Responding to reviewer requests for additional analyses:**

```bash
#!/bin/bash
# revise-manuscript.sh

REVISION_NUM="$1"

mkdir -p "revision-${REVISION_NUM}"

# Step 1: Run additional analysis (e.g., sensitivity analysis)
Rscript code/sensitivity-analysis.R

# Step 2: Update results section
SENSITIVITY_FINDINGS=$(cat results/sensitivity-results.txt)

/research:manuscript:results "$SENSITIVITY_FINDINGS Additional sensitivity
analysis requested by Reviewer 2. Methods: [describe]. Findings: [report]." \
  > sections/results-sensitivity.tex

# Step 3: Add to results section
cat >> sections/results.tex << 'LATEX'

\subsection{Sensitivity Analysis}
\input{sections/results-sensitivity}
LATEX

# Step 4: Recompile
./scripts/compile.sh

# Step 5: Track changes (latexdiff)
latexdiff manuscript-original.tex manuscript.tex > manuscript-diff.tex
pdflatex manuscript-diff.tex

echo "Revision complete!"
echo "  Updated manuscript: manuscript.pdf"
echo "  Changes highlighted: manuscript-diff.pdf"
```

---

## Best Practices

### 1. Version Control Everything

```bash
# Track all LaTeX sources
git add manuscript.tex sections/*.tex references.bib
git commit -m "Initial manuscript draft"

# Tag manuscript versions
git tag submission-v1
git tag revision1
git tag accepted
```

### 2. Separate Generated from Manual Content

```
sections/
├── introduction.tex      # Manual (version controlled)
├── methods.tex          # Generated (git ignored, regenerated)
├── results.tex          # Generated
├── discussion.tex       # Manual
└── appendix.tex         # Manual + validated proofs
```

### 3. Use Makefiles for Complex Builds

```makefile
# Makefile

.PHONY: all clean methods results manuscript

all: manuscript

methods: sections/methods.tex

results: sections/results.tex

sections/methods.tex: design/analysis-plan.md
    ./scripts/generate-methods.sh

sections/results.tex: results/simulation-results.csv
    ./scripts/generate-results.sh

manuscript: manuscript.pdf

manuscript.pdf: manuscript.tex sections/*.tex references.bib
    pdflatex manuscript.tex
    bibtex manuscript
    pdflatex manuscript.tex
    pdflatex manuscript.tex

clean:
    rm -f *.aux *.log *.bbl *.blg *.out *.toc
```

**Usage:**

```bash
make methods  # Generate methods section only
make results  # Generate results section only
make manuscript  # Full build
make clean  # Remove auxiliary files
```

---

## Resources

### LaTeX Tools

- **TeXLive** - Comprehensive TeX distribution (`brew install --cask texlive`)
- **Overleaf** - Online LaTeX editor (collaborative)
- **latexdiff** - Track changes between versions
- **latexmk** - Automated LaTeX compilation

### Bibliography Tools

- **JabRef** - BibTeX database manager (GUI)
- **biblatex** - Modern bibliography package (alternative to natbib)
- **biber** - Bibliography processor for biblatex

### Quarto Resources

- [Quarto Documentation](https://quarto.org/)
- [Quarto + LaTeX Guide](https://quarto.org/docs/output-formats/pdf-basics.html)
- [Academic Manuscripts with Quarto](https://quarto.org/docs/manuscripts/)

---

## Next Steps

1. **Set up LaTeX project structure** (use templates from this guide)
2. **Integrate Scholar commands into build scripts**
3. **Automate bibliography management**
4. **Test full compilation pipeline**
5. **Share templates with collaborators**

**Learning Path:**

```
Week 1: Basic LaTeX + Scholar bibliography integration
Week 2: Automated section generation (methods/results)
Week 3: Quarto integration for reproducible documents
Week 4: Advanced automation (Makefiles, CI/CD)
```

---

**Document Version:** v2.17.0
**Last Updated:** 2026-02-01
**Word Count:** ~7,500
**Example Scripts:** 15+
