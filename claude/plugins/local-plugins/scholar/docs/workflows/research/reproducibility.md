# Reproducible Research Workflows

**Time to Setup:** 4-8 hours (one-time infrastructure)
**Difficulty:** Intermediate to Advanced
**Prerequisites:** Git, Docker (optional), R/Python, Quarto/RMarkdown
**Output:** Fully reproducible research project with computational guarantees

---

## Overview

### What is Computational Reproducibility?

Computational reproducibility means that independent researchers can re-run your analysis code on your data and obtain identical numerical results. It requires:

1. **Version control** - Track every change to code and documents
2. **Environment management** - Document software versions and dependencies
3. **Data provenance** - Record data sources and transformations
4. **Automation** - Scripts to regenerate all results from raw data
5. **Documentation** - Clear instructions for reproduction

### Why Reproducibility Matters

**For science:**
- Enables verification and validation
- Facilitates cumulative knowledge building
- Increases trust in findings

**For researchers:**
- Prevents errors and inconsistencies
- Speeds up collaboration and onboarding
- Simplifies manuscript revisions
- Meets journal and funder requirements

**For your future self:**
- Re-run analyses after 6 months (during revisions)
- Extend work to new datasets
- Debug issues reported by collaborators

### Reproducibility Spectrum

| Level | Description | Tools | Effort |
|-------|-------------|-------|--------|
| **Level 0** | Code available | GitHub | 1 hour |
| **Level 1** | Code + data available | GitHub + OSF/Zenodo | 2 hours |
| **Level 2** | Code + data + instructions | + README.md | 4 hours |
| **Level 3** | Documented dependencies | + renv/conda | 8 hours |
| **Level 4** | One-click reproduction | + Makefile/drake | 16 hours |
| **Level 5** | Containerized | + Docker/Singularity | 24 hours |

**Minimum recommendation:** Level 3 (documented dependencies)
**Gold standard:** Level 4 (one-click reproduction)
**Platinum standard:** Level 5 (containerized)

---

## FAIR Principles for Research Data

### Findable

- **F1:** Assign globally unique persistent identifiers (DOIs)
- **F2:** Describe data with rich metadata
- **F3:** Register data in searchable resources (OSF, Dataverse, Zenodo)
- **F4:** Specify data identifier in publications

### Accessible

- **A1:** Data retrievable via standard protocols (HTTP, FTP)
- **A2:** Metadata accessible even if data restricted
- **A3:** Clear data access procedures

### Interoperable

- **I1:** Use open, standard file formats (CSV, JSON, HDF5)
- **I2:** Use FAIR-compliant vocabularies
- **I3:** Include qualified references to other data

### Reusable

- **R1:** Provide rich metadata (README, codebook)
- **R2:** Associate data with clear usage license (CC0, CC-BY)
- **R3:** Meet domain-relevant community standards
- **R4:** Provide detailed provenance

---

## Scholar Commands for Reproducibility

### Reproducibility-Enhancing Commands

| Command | Reproducibility Benefit |
|---------|-------------------------|
| `/research:analysis-plan` | Pre-register analysis before seeing data |
| `/research:simulation` | Validate methods on known ground truth |
| `/manuscript:write` | Generate consistent documentation |
| `/research:codebook` | Document variables and transformations |
| `/research:bib:add` | Track literature provenance |

### Provenance Tracking

Scholar automatically embeds metadata in generated files:

```yaml
# Embedded in manuscript YAML frontmatter
scholar_metadata:
  version: "2.5.0"
  generated_date: "2026-02-01T14:32:10Z"
  command: "/manuscript:write introduction"
  config_file: ".flow/teach-config.yml"
  git_commit: "a1b2c3d4"
  dependencies:
    - quarto: "1.4.5"
    - R: "4.3.2"
    - tidyverse: "2.0.0"
```

This metadata enables:

- Auditing of AI-generated content
- Reconstruction of analysis environment
- Verification of software versions

---

## Version Control with Git

### Essential Git Practices

#### 1. Initialize Repository Early

```bash
# Start every research project with git
mkdir my-research-project
cd my-research-project
git init
git remote add origin git@github.com:username/my-research-project.git

# Create .gitignore
cat > .gitignore <<'EOF'
# R
.Rproj.user
.Rhistory
.RData
.Ruserdata
*.Rproj

# Python
__pycache__/
*.py[cod]
*$py.class
.ipynb_checkpoints/

# Data (large files - use Git LFS or external storage)
data/raw/*.csv
data/raw/*.rds
*.h5
*.hdf5

# Outputs (regenerable)
output/figures/*.pdf
output/figures/*.png
output/tables/*.tex
output/simulations/*.rds

# System
.DS_Store
Thumbs.db

# Temporary
*.log
*.tmp
*.swp

# Sensitive (NEVER commit)
.env
credentials.json
*.key
EOF

# Initial commit
git add .gitignore
git commit -m "Initial commit with .gitignore"
git push -u origin main
```

#### 2. Commit Atomic Changes

**Good commits:**

```bash
git commit -m "Add power analysis simulation (sim01-power.R)"
git commit -m "Fix bias in mediation estimator (line 234)"
git commit -m "Update Figure 2 with new color scheme"
```

**Bad commits:**

```bash
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "WIP" (unless on feature branch)
```

#### 3. Use Branches for Experiments

```bash
# Create feature branch
git checkout -b simulation-expansion

# Make changes
# ... edit files ...

# Commit on branch
git add content/simulations/sim04-new-scenario.R
git commit -m "Add simulation scenario 4: heterogeneous effects"

# Merge back when validated
git checkout main
git merge simulation-expansion
git branch -d simulation-expansion
```

#### 4. Tag Milestones

```bash
# Tag analysis freeze (before seeing data)
git tag -a "analysis-freeze-v1" -m "Pre-registered analysis plan frozen"

# Tag manuscript submissions
git tag -a "submission-jasa-v1" -m "Initial submission to JASA"
git tag -a "revision-jasa-v2" -m "First revision"
git tag -a "accepted-jasa" -m "Accepted version"
git tag -a "published-jasa-doi-10.1080/..." -m "Published version with DOI"

# Push tags
git push --tags
```

---

## Environment Management

### R: renv Package

**renv** creates isolated, reproducible R environments.

#### Setup

```r
# Install renv
install.packages("renv")

# Initialize renv in project
renv::init()

# This creates:
# - renv/ directory (project library)
# - renv.lock (dependency snapshot)
# - .Rprofile (activation script)
```

#### Workflow

```r
# 1. Work normally - install packages as needed
install.packages("tidyverse")
install.packages("mediation")

# 2. Snapshot dependencies when stable
renv::snapshot()

# 3. Restore environment later (or on different machine)
renv::restore()

# 4. Update packages
renv::update()

# 5. Check project status
renv::status()
```

#### Example: renv.lock

```json
{
  "R": {
    "Version": "4.3.2",
    "Repositories": [
      {
        "Name": "CRAN",
        "URL": "https://cran.rstudio.com"
      }
    ]
  },
  "Packages": {
    "tidyverse": {
      "Package": "tidyverse",
      "Version": "2.0.0",
      "Source": "Repository",
      "Repository": "CRAN"
    },
    "mediation": {
      "Package": "mediation",
      "Version": "4.5.0",
      "Source": "Repository",
      "Repository": "CRAN"
    }
  }
}
```

#### Commit renv Files

```bash
git add renv.lock .Rprofile
git commit -m "Add renv for reproducible R environment"

# DO NOT commit renv/ directory itself
echo "renv/" >> .gitignore
```

---

### Python: conda/mamba + pip

**conda** manages Python environments and non-Python dependencies.

#### Setup

```bash
# Create environment
conda create -n research-project python=3.11

# Activate
conda activate research-project

# Install packages
conda install numpy pandas scipy matplotlib seaborn jupyter
pip install scikit-learn statsmodels

# Export environment
conda env export > environment.yml

# Or for pip-only
pip freeze > requirements.txt
```

#### environment.yml

```yaml
name: research-project
channels:
  - conda-forge
  - defaults
dependencies:
  - python=3.11
  - numpy=1.26.0
  - pandas=2.1.0
  - scipy=1.11.0
  - matplotlib=3.8.0
  - seaborn=0.13.0
  - jupyter=1.0.0
  - pip
  - pip:
    - scikit-learn==1.3.0
    - statsmodels==0.14.0
```

#### Restore Environment

```bash
# From environment.yml
conda env create -f environment.yml

# Or from requirements.txt
conda create -n research-project python=3.11
conda activate research-project
pip install -r requirements.txt
```

#### Commit Environment Files

```bash
git add environment.yml requirements.txt
git commit -m "Add conda environment specification"
```

---

### System Dependencies: Docker

**Docker** containers package entire software stacks (OS, R/Python, packages, system libraries).

#### Why Docker?

- Guarantees exact software environment
- Portable across machines (Mac, Linux, Windows, HPC clusters)
- Isolates system dependencies (GDAL, GSL, Java, etc.)
- Enables long-term archival (containers work decades later)

#### Create Dockerfile

```dockerfile
# Dockerfile
FROM rocker/verse:4.3.2

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgsl-dev \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy renv files
COPY renv.lock renv.lock
COPY .Rprofile .Rprofile
COPY renv/activate.R renv/activate.R

# Restore R packages
RUN R -e "renv::restore()"

# Set working directory
WORKDIR /project

# Default command
CMD ["bash"]
```

#### Build and Run

```bash
# Build container
docker build -t mediation-analysis:v1 .

# Run interactively
docker run -it --rm -v $(pwd):/project mediation-analysis:v1 bash

# Inside container:
# Rscript analysis/run-all-simulations.R
# quarto render manuscript/main.qmd

# Run specific script
docker run --rm -v $(pwd):/project mediation-analysis:v1 \
  Rscript analysis/run-all-simulations.R
```

#### Commit Dockerfile

```bash
git add Dockerfile
git commit -m "Add Docker container for reproducible environment"
```

#### Push Container to Registry

```bash
# Tag for Docker Hub
docker tag mediation-analysis:v1 username/mediation-analysis:v1

# Push
docker push username/mediation-analysis:v1

# Document in README
echo "
## Reproduce with Docker

\`\`\`bash
docker pull username/mediation-analysis:v1
docker run -v \$(pwd):/project username/mediation-analysis:v1 bash
Rscript analysis/run-all-simulations.R
\`\`\`
" >> README.md
```

---

## Data Management

### Data Directory Structure

```
data/
├── raw/                      # Original, immutable data
│   ├── study-2020.csv        # Never modify!
│   ├── README.md             # Data provenance
│   └── codebook.md           # Variable descriptions
├── processed/                # Cleaned, analysis-ready data
│   ├── study-cleaned.rds     # Derived from raw/
│   └── preprocessing.R       # Script that created this
└── simulated/                # Simulated datasets
    ├── sim-scenario1.rds
    └── generate-sims.R
```

### Raw Data Provenance

**data/raw/README.md:**

```markdown
# Raw Data Provenance

## study-2020.csv

**Source:** National Health Survey 2020
**Downloaded:** 2025-01-15
**URL:** https://data.example.gov/nhs2020
**DOI:** 10.1234/nhs-2020-data
**Version:** 2.1 (final release)
**SHA-256:** a3f5c9e2b8d4f7a1c3e5b9d2f4a6c8e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3

**License:** Public Domain (CC0)

**Collection Method:**
- Survey period: January-December 2020
- Sample size: 10,000 participants
- Sampling: Stratified random sampling by state
- Response rate: 68%

**Known Issues:**
- Missing data in income variable (12% missing)
- Age top-coded at 85
- Some states oversampled (survey weights provided)

**Changes from Version 2.0:**
- Added survey weights (variable: weight)
- Corrected coding error in variable X12 (see errata)
```

### Data Codebook

**data/raw/codebook.md:**

```markdown
# Data Codebook - National Health Survey 2020

## Variables

### id (integer)
Unique participant identifier

- **Range:** 1 to 10,000
- **Missing:** None

### age (integer)
Age in years at survey date

- **Range:** 18 to 85 (top-coded)
- **Missing:** 0
- **Note:** Values 85 represent "85 or older"

### income (numeric)
Annual household income in USD

- **Range:** 0 to 500,000
- **Missing:** 1,200 (12%)
- **Note:** Top-coded at $500,000

### treatment (factor)
Treatment group indicator

- **Levels:**
  - 0 = Control
  - 1 = Treatment A
  - 2 = Treatment B
- **Missing:** 0

### outcome (numeric)
Primary outcome measure

- **Range:** 0 to 100
- **Missing:** 45 (0.45%)
- **Measurement:** Self-reported health score
- **Scale:** 0 (worst) to 100 (best)

## Derived Variables

These variables are computed in `data/processed/preprocessing.R`:

### income_log (numeric)
Log-transformed income: log(income + 1)

### age_group (factor)
Age categories: 18-34, 35-49, 50-64, 65+

### treatment_binary (integer)
Binary treatment: 0 = Control, 1 = Treatment (A or B combined)
```

### Data Preprocessing Script

**data/processed/preprocessing.R:**

```r
# Data Preprocessing
# Author: Alice Smith
# Date: 2026-01-15
# Purpose: Clean raw data and create analysis-ready dataset

library(tidyverse)

# Load raw data
raw <- read_csv("data/raw/study-2020.csv")

# Cleaning steps (record every transformation)
processed <- raw %>%
  # 1. Remove invalid ages
  filter(age >= 18 & age <= 85) %>%

  # 2. Recode missing income as NA
  mutate(income = if_else(income < 0, NA_real_, income)) %>%

  # 3. Create derived variables
  mutate(
    income_log = log(income + 1),
    age_group = cut(age, breaks = c(18, 35, 50, 65, 85),
                    labels = c("18-34", "35-49", "50-64", "65+"),
                    right = FALSE),
    treatment_binary = if_else(treatment > 0, 1L, 0L)
  ) %>%

  # 4. Drop observations with missing outcome
  filter(!is.na(outcome)) %>%

  # 5. Apply survey weights normalization
  mutate(weight_normalized = weight / sum(weight) * n())

# Validation checks
stopifnot(
  nrow(processed) >= 9500,  # Expect ~5% missingness
  all(processed$age >= 18 & processed$age <= 85),
  all(processed$outcome >= 0 & processed$outcome <= 100)
)

# Save processed data
saveRDS(processed, "data/processed/study-cleaned.rds")

# Log summary statistics
cat(sprintf("
Preprocessing Summary:
- Raw observations: %d
- Processed observations: %d
- Dropped due to missing outcome: %d
- Mean outcome: %.2f
- SD outcome: %.2f
",
  nrow(raw),
  nrow(processed),
  nrow(raw) - nrow(processed),
  mean(processed$outcome),
  sd(processed$outcome)
))
```

### Data Archiving

**Use Git LFS for large files:**

```bash
# Install Git LFS
git lfs install

# Track large data files
git lfs track "data/raw/*.csv"
git lfs track "data/processed/*.rds"

# Commit .gitattributes
git add .gitattributes
git commit -m "Track data files with Git LFS"

# Commit data (stored in LFS)
git add data/
git commit -m "Add raw and processed data"
```

**Or use external storage (OSF, Zenodo, Dataverse):**

```bash
# Upload to OSF
osf upload <project-id> data/raw/ /data/

# Document in README
cat >> README.md <<'EOF'

## Data Availability

Raw data available at: https://osf.io/<project-id>/

Download:
```bash
osf fetch <project-id> /data/ data/raw/
```
EOF
```

---

## Computational Workflow Automation

### Make-Based Workflows

**Makefile** defines dependencies between analysis steps.

#### Example Makefile

```makefile
# Makefile for reproducible research project

.PHONY: all clean data analysis manuscript

all: manuscript

# Data processing
data/processed/study-cleaned.rds: data/raw/study-2020.csv data/processed/preprocessing.R
    Rscript data/processed/preprocessing.R

# Simulations
output/simulations/sim01-power.rds: analysis/sim01-power.R data/processed/study-cleaned.rds
    Rscript analysis/sim01-power.R

output/simulations/sim02-bias.rds: analysis/sim02-bias.R data/processed/study-cleaned.rds
    Rscript analysis/sim02-bias.R

# Figures
output/figures/figure1-power-curves.pdf: output/simulations/sim01-power.rds analysis/figures/generate-figure1.R
    Rscript analysis/figures/generate-figure1.R

output/figures/figure2-bias.pdf: output/simulations/sim02-bias.rds analysis/figures/generate-figure2.R
    Rscript analysis/figures/generate-figure2.R

# Tables
output/tables/table1-scenarios.tex: output/simulations/sim01-power.rds analysis/tables/generate-table1.R
    Rscript analysis/tables/generate-table1.R

# Manuscript
manuscript/main.pdf: manuscript/main.qmd output/figures/*.pdf output/tables/*.tex
    cd manuscript && quarto render main.qmd --to pdf

# Targets
data: data/processed/study-cleaned.rds

analysis: output/simulations/sim01-power.rds output/simulations/sim02-bias.rds

figures: output/figures/figure1-power-curves.pdf output/figures/figure2-bias.pdf

tables: output/tables/table1-scenarios.tex

manuscript: manuscript/main.pdf

# Clean up (be careful!)
clean:
    rm -f data/processed/*.rds
    rm -f output/simulations/*.rds
    rm -f output/figures/*.pdf
    rm -f output/tables/*.tex
    rm -f manuscript/main.pdf
```

#### Usage

```bash
# Reproduce entire project
make all

# Or step-by-step
make data
make analysis
make figures
make tables
make manuscript

# Check what would be rebuilt
make -n all

# Clean and rebuild everything
make clean
make all
```

---

### drake/targets Package (R)

**targets** provides advanced dependency tracking for R workflows.

#### Setup: _targets.R

```r
# _targets.R
library(targets)
library(tarchetypes)

# Set options
tar_option_set(
  packages = c("tidyverse", "mediation"),
  format = "rds"
)

# Define pipeline
list(
  # Data
  tar_target(
    raw_data,
    read_csv("data/raw/study-2020.csv"),
    format = "file"
  ),

  tar_target(
    processed_data,
    preprocess_data(raw_data)
  ),

  # Simulations
  tar_target(
    sim_power,
    run_power_simulation(processed_data, replicates = 5000)
  ),

  tar_target(
    sim_bias,
    run_bias_simulation(processed_data, replicates = 5000)
  ),

  # Figures
  tar_target(
    figure1,
    generate_figure1(sim_power),
    format = "file"
  ),

  tar_target(
    figure2,
    generate_figure2(sim_bias),
    format = "file"
  ),

  # Manuscript
  tar_quarto(manuscript, path = "manuscript/main.qmd")
)
```

#### Usage

```r
# Visualize pipeline
tar_visnetwork()

# Run pipeline
tar_make()

# Check status
tar_progress()

# Load results
tar_read(sim_power)

# Rebuild only outdated targets
tar_make()  # Only reruns what changed
```

**Advantages over Makefile:**

- Automatically tracks R object dependencies
- Stores intermediate results in cache
- Parallel execution across cores
- Smart caching (skips unchanged steps)

---

## Pre-Registration and Analysis Plans

### Why Pre-Register?

**Scientific integrity:**

- Distinguishes confirmatory from exploratory analyses
- Prevents p-hacking and HARKing (Hypothesizing After Results are Known)
- Increases credibility of findings

**Practical benefits:**

- Forces careful planning before analysis
- Documents original hypotheses
- Simplifies manuscript writing (intro/methods already written)

### Pre-Registration Platforms

| Platform | Focus | Public/Private | Embargo |
|----------|-------|----------------|---------|
| **OSF** | General | Both | Yes (4 years) |
| **AsPredicted** | Quick | Public | No |
| **ClinicalTrials.gov** | Clinical | Public | No |
| **EGAP** | Political science | Public | No |
| **GitHub** (with hash) | Technical | Public | No (timestamp) |

### Create Pre-Registration with Scholar

```bash
# Generate analysis plan
claude "/research:analysis-plan \
  --hypotheses 'H1: Treatment increases outcome; H2: Effect mediated by M' \
  --sample-size 1000 \
  --alpha 0.05 \
  --output docs/analysis-plan.md"
```

**Example output:**

```markdown
# Pre-Registered Analysis Plan

**Study Title:** Mediation Analysis of Treatment Effects
**Registration Date:** 2026-02-01
**Analysis Plan Version:** 1.0

## Hypotheses

**H1 (Primary):** Treatment increases outcome (Y) compared to control.
- **Direction:** Positive effect (β > 0)
- **Significance:** α = 0.05, two-sided

**H2 (Secondary):** Treatment effect on outcome is mediated by mediator (M).
- **Mediation estimate:** Indirect effect > 0
- **Significance:** α = 0.05, two-sided

## Study Design

**Type:** Randomized controlled trial
**Sample Size:** N = 1,000 (500 per arm)
**Power:** 80% to detect effect size d = 0.25

## Variables

### Primary Outcome
- **Variable:** Y (outcome score)
- **Type:** Continuous
- **Range:** 0-100
- **Missing data:** Exclude if > 20% missing

### Treatment
- **Variable:** T (treatment indicator)
- **Levels:** 0 = Control, 1 = Treatment
- **Randomization:** Simple randomization (1:1)

### Mediator
- **Variable:** M (mediator score)
- **Type:** Continuous
- **Range:** 0-50

### Covariates
- Age (continuous)
- Sex (binary: 0 = Female, 1 = Male)
- Baseline outcome (continuous)

## Statistical Methods

### Primary Analysis (H1)
**Model:** Linear regression

\`\`\`
Y ~ β₀ + β₁·T + β₂·Age + β₃·Sex + β₄·Baseline + ε
\`\`\`

**Null Hypothesis:** β₁ = 0
**Alternative:** β₁ ≠ 0
**Significance:** Reject H₀ if p < 0.05

### Mediation Analysis (H2)
**Method:** Product-of-coefficients estimator

**Model 1 (Mediator model):**
\`\`\`
M ~ α₀ + α₁·T + α₂·Age + α₃·Sex + α₄·Baseline + ε₁
\`\`\`

**Model 2 (Outcome model):**
\`\`\`
Y ~ β₀ + β₁'·T + β₂·M + β₃·Age + β₄·Sex + β₅·Baseline + ε₂
\`\`\`

**Indirect Effect:** IE = α₁ × β₂
**Standard Error:** Bootstrap (10,000 replicates)
**95% CI:** Percentile method

**Null Hypothesis:** IE = 0
**Alternative:** IE > 0
**Significance:** Reject H₀ if 95% CI excludes 0

### Sensitivity Analysis
**Method:** VanderWeele's E-value

Calculate E-value for observed mediation effect to assess robustness to unmeasured confounding.

## Missing Data

**Strategy:** Complete case analysis
**Threshold:** Exclude participants with > 20% missing data
**Imputation:** None (sensitivity analysis with multiple imputation in appendix)

## Multiple Comparisons

No adjustment for H1 (primary). Bonferroni correction for exploratory subgroup analyses (k = 4 subgroups, α = 0.05/4 = 0.0125).

## Deviations from Plan

Any deviations will be documented in final manuscript with justification.

---

**Analysis Code:** Will be archived on GitHub (https://github.com/username/project)
**Data:** Will be shared on OSF (https://osf.io/xxxxx/) upon acceptance
```

### Register Analysis Plan

```bash
# Option 1: OSF
# Manual upload via https://osf.io/registrations/

# Option 2: GitHub with hash
git add docs/analysis-plan.md
git commit -m "Pre-register analysis plan (before data access)"
git tag -a "analysis-freeze-v1.0" -m "Analysis plan frozen: $(sha256sum docs/analysis-plan.md)"
git push --tags

# Document commitment
cat > docs/PRE-REGISTRATION.md <<EOF
# Pre-Registration Commitment

**Analysis plan:** docs/analysis-plan.md
**Git commit:** $(git rev-parse HEAD)
**Timestamp:** $(git log -1 --format=%ai)
**SHA-256 hash:** $(sha256sum docs/analysis-plan.md | cut -d' ' -f1)
**Public archive:** https://github.com/username/project/tree/analysis-freeze-v1.0

This analysis plan was committed **before** accessing the outcome data (Y). Changes after this point will be clearly marked as deviations in the final manuscript.
EOF

git add docs/PRE-REGISTRATION.md
git commit -m "Document pre-registration commitment"
git push
```

---

## Computational Reproducibility Checklist

### Before Manuscript Submission

Use this checklist to ensure reproducibility:

```markdown
# Reproducibility Checklist

## Version Control
- [ ] All code in Git repository
- [ ] Meaningful commit messages
- [ ] Manuscript submission tagged in Git
- [ ] Repository public (or will be upon acceptance)

## Environment
- [ ] Software versions documented (R: sessionInfo(), Python: pip freeze)
- [ ] System dependencies listed (GDAL, GSL, etc.)
- [ ] Environment management file present (renv.lock, environment.yml)
- [ ] Optional: Docker container available

## Data
- [ ] Raw data preserved (never modified)
- [ ] Data provenance documented (README.md)
- [ ] Codebook provided for all variables
- [ ] Preprocessing script generates processed data
- [ ] Data sharing plan specified (OSF, Zenodo, etc.)

## Code
- [ ] All analyses automated (no manual steps)
- [ ] Master script runs full pipeline (run-all.R or Makefile)
- [ ] Code commented and readable
- [ ] No hard-coded absolute paths
- [ ] Random seeds set for reproducibility
- [ ] Intermediate results cached (optional)

## Figures & Tables
- [ ] All figures generated by code (no manual editing)
- [ ] All tables generated by code (no manual editing)
- [ ] Figure/table generation scripts documented
- [ ] High-resolution versions saved (300+ DPI for publication)

## Manuscript
- [ ] Manuscript compiled from source (Quarto, RMarkdown, LaTeX)
- [ ] References managed with BibTeX/CSL JSON
- [ ] No manual formatting (use styles/templates)
- [ ] Inline code for numbers reported in text (e.g., \`r mean(x)\`)

## Documentation
- [ ] README with reproduction instructions
- [ ] Installation instructions for dependencies
- [ ] Estimated computation time documented
- [ ] Hardware requirements specified (if intensive)
- [ ] Troubleshooting section for common issues

## Testing
- [ ] Successfully reproduced on clean machine
- [ ] Tested by independent researcher (co-author)
- [ ] Numerical results match manuscript exactly
- [ ] Runtime reasonable (< 24 hours ideal)

## Legal & Ethical
- [ ] License specified (MIT, GPL, CC-BY for docs/data)
- [ ] Data use complies with IRB/ethics approval
- [ ] No sensitive data in public repository
- [ ] Citation information provided (CITATION.cff)
```

---

## Real-World Example: Complete Reproducible Project

### Project: Mediation Sensitivity Analysis

**Goal:** Fully reproducible statistical research project.

**Structure:**

```
mediation-sensitivity/
├── .git/                       # Version control
├── .gitignore                  # Ignore outputs and sensitive files
├── .github/
│   └── workflows/
│       └── reproduce.yml       # CI/CD to test reproduction
├── renv/                       # R environment (not committed)
├── renv.lock                   # R package versions
├── Dockerfile                  # Container definition
├── Makefile                    # Build automation
├── README.md                   # Reproduction instructions
├── LICENSE                     # MIT license
├── CITATION.cff                # Citation metadata
├── data/
│   ├── raw/                    # Original data (external)
│   │   ├── README.md
│   │   └── codebook.md
│   ├── processed/              # Derived data (regenerable)
│   │   └── preprocessing.R
│   └── simulated/              # Simulated datasets
│       └── generate-sims.R
├── analysis/
│   ├── 01-descriptive.R        # Descriptive statistics
│   ├── 02-main-analysis.R      # Primary analysis
│   ├── 03-mediation.R          # Mediation analysis
│   ├── 04-sensitivity.R        # Sensitivity analysis
│   └── run-all.R               # Master script
├── output/
│   ├── figures/                # Generated figures (PDF)
│   ├── tables/                 # Generated tables (LaTeX)
│   └── simulations/            # Simulation results (RDS)
├── manuscript/
│   ├── main.qmd                # Manuscript source
│   ├── references.bib          # Bibliography
│   └── jasa-style.csl          # Citation style
├── docs/
│   ├── analysis-plan.md        # Pre-registered plan
│   └── PRE-REGISTRATION.md     # Registration record
└── scripts/
    └── reproduce.sh            # One-click reproduction script
```

### Master Reproduction Script

**scripts/reproduce.sh:**

```bash
#!/bin/bash
set -e  # Exit on error

echo "🔬 Reproducing: Mediation Sensitivity Analysis"
echo "Estimated time: 2 hours"
echo ""

# 1. Check environment
echo "Step 1: Checking environment..."
command -v R >/dev/null 2>&1 || { echo "❌ R not installed"; exit 1; }
command -v quarto >/dev/null 2>&1 || { echo "❌ Quarto not installed"; exit 1; }

# 2. Restore R environment
echo "Step 2: Restoring R environment (renv)..."
R -e "if (!requireNamespace('renv', quietly = TRUE)) install.packages('renv')"
R -e "renv::restore()"

# 3. Download data
echo "Step 3: Downloading data from OSF..."
if [ ! -f "data/raw/study-2020.csv" ]; then
  osf fetch <project-id> /data/raw/ data/raw/
fi

# 4. Preprocess data
echo "Step 4: Preprocessing data..."
Rscript data/processed/preprocessing.R

# 5. Run analyses
echo "Step 5: Running analyses..."
Rscript analysis/run-all.R

# 6. Generate figures
echo "Step 6: Generating figures..."
Rscript analysis/figures/generate-all-figures.R

# 7. Generate tables
echo "Step 7: Generating tables..."
Rscript analysis/tables/generate-all-tables.R

# 8. Compile manuscript
echo "Step 8: Compiling manuscript..."
cd manuscript
quarto render main.qmd --to pdf
cd ..

echo ""
echo "✅ Reproduction complete!"
echo "Outputs:"
echo "  - Manuscript: manuscript/main.pdf"
echo "  - Figures: output/figures/*.pdf"
echo "  - Tables: output/tables/*.tex"
echo ""

# 9. Verify checksums
echo "Step 9: Verifying numerical results..."
R -e "
library(digest)
results <- readRDS('output/simulations/main-results.rds')
checksum <- digest(results, algo = 'sha256')
expected <- '3a8f7c9e2b4d6f1a8c3e5b9d7f2a4c6e8b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1'
if (checksum == expected) {
  cat('✅ Numerical results match expected values\n')
} else {
  cat('⚠️ Warning: Results differ from expected\n')
  cat('Expected:', expected, '\n')
  cat('Got:', checksum, '\n')
}
"
```

### Usage

```bash
# Reproduce with one command
bash scripts/reproduce.sh

# Or with Docker
docker build -t mediation-sensitivity:v1 .
docker run -v $(pwd):/project mediation-sensitivity:v1 bash scripts/reproduce.sh
```

### README.md

```markdown
# Mediation Sensitivity Analysis

**Authors:** Alice Smith, Bob Jones
**Status:** Published in *Journal of the American Statistical Association* (2026)
**DOI:** https://doi.org/10.1080/01621459.2026.1234567

## Abstract

[Abstract text]

## Reproduction

### Quick Start

```bash
git clone https://github.com/username/mediation-sensitivity.git
cd mediation-sensitivity
bash scripts/reproduce.sh
```

**Estimated time:** 2 hours
**Hardware:** 8 GB RAM, 4 cores (recommended)

### Detailed Instructions

#### 1. Prerequisites

- R >= 4.3.0
- Quarto >= 1.4.0
- OSF CLI (for data download): `pip install osfclient`

#### 2. Restore R Environment

```bash
R -e "renv::restore()"
```

This installs all required R packages at exact versions specified in `renv.lock`.

#### 3. Download Data

```bash
osf fetch <project-id> /data/ data/
```

Or manually download from: https://osf.io/<project-id>/

#### 4. Run Full Pipeline

```bash
make all
```

This runs:
- Data preprocessing
- All simulations (5,000 replicates each)
- Figure generation
- Table generation
- Manuscript compilation

#### 5. Verify Results

Expected output checksums (SHA-256):

| File | SHA-256 |
|------|---------|
| `output/simulations/main-results.rds` | `3a8f7c9e...` |
| `manuscript/main.pdf` | `7c2e4b8d...` |

```bash
sha256sum output/simulations/main-results.rds
sha256sum manuscript/main.pdf
```

### Docker Reproduction

For guaranteed reproducibility across systems:

```bash
docker pull username/mediation-sensitivity:v1
docker run -v $(pwd):/project username/mediation-sensitivity:v1 bash scripts/reproduce.sh
```

### File Structure

- `data/raw/` - Original data (from OSF)
- `data/processed/` - Cleaned data (generated by `preprocessing.R`)
- `analysis/` - Analysis scripts (R)
- `output/` - Results (figures, tables, simulations)
- `manuscript/` - Manuscript source (Quarto)
- `docs/` - Documentation and pre-registration

### Citation

```bibtex
@article{smith2026mediation,
  title={Sensitivity Analysis for Causal Mediation with Unmeasured Confounding},
  author={Smith, Alice and Jones, Bob},
  journal={Journal of the American Statistical Association},
  year={2026},
  volume={121},
  number={543},
  pages={123--145},
  doi={10.1080/01621459.2026.1234567}
}
```

### License

- Code: MIT License (see LICENSE)
- Data: CC0 (public domain)
- Manuscript: All rights reserved (published version)

### Contact

Alice Smith (alice.smith@university.edu)

### Acknowledgments

This work was supported by NSF grant DMS-1234567. We thank reviewers for helpful feedback.
```

---

## GitHub Actions for Continuous Reproducibility

### Automatic Reproduction Testing

**`.github/workflows/reproduce.yml`:**

```yaml
name: Reproducibility Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 1 * *'  # Monthly on 1st

jobs:
  reproduce:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup R
        uses: r-lib/actions/setup-r@v2
        with:
          r-version: '4.3.2'

      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libgsl-dev libgdal-dev

      - name: Restore R packages (renv)
        uses: r-lib/actions/setup-renv@v2

      - name: Install Quarto
        uses: quarto-dev/quarto-actions/setup@v2

      - name: Run preprocessing
        run: Rscript data/processed/preprocessing.R

      - name: Run simulations (reduced)
        run: Rscript analysis/sim01-power.R --replicates 100  # Fast CI test

      - name: Compile manuscript
        run: |
          cd manuscript
          quarto render main.qmd --to pdf

      - name: Upload manuscript
        uses: actions/upload-artifact@v3
        with:
          name: manuscript
          path: manuscript/main.pdf

      - name: Verify checksums
        run: |
          sha256sum output/simulations/sim01-power.rds > checksums.txt
          cat checksums.txt
```

**Benefits:**

- Automatically tests reproducibility on every commit
- Catches environment issues early
- Provides public proof of reproducibility
- Creates artifact (PDF) for inspection

---

## Summary

Reproducible research workflows with Scholar:

1. **Version Control**: Git for all code and documents
2. **Environment Management**: renv (R), conda (Python), Docker (system)
3. **Data Management**: Immutable raw data, documented provenance, external storage
4. **Automation**: Makefiles or targets for one-click reproduction
5. **Pre-Registration**: Freeze analysis plan before data access
6. **Testing**: Continuous integration to verify reproducibility
7. **Documentation**: Comprehensive README with step-by-step instructions
8. **Archival**: OSF/Zenodo for long-term preservation

**Key Scholar commands for reproducibility:**

- `/research:analysis-plan` - Generate pre-registered plans
- `/research:codebook` - Document data variables
- `/manuscript:write` - Create consistent documentation
- `/research:simulation` - Validate methods reproducibly

**Reproducibility levels:**

- **Minimum:** Code + data on GitHub/OSF (Level 2)
- **Recommended:** + renv/conda + Makefile (Level 4)
- **Gold Standard:** + Docker + CI testing (Level 5)

**Next steps:**

- Explore [flow-cli Integration](flow-integration.md) for workflow automation
- Learn [Publication Workflow Automation](publication-automation.md) for manuscript submission
- Read [Scholar Research Commands Reference](../../research/RESEARCH-COMMANDS-REFERENCE.md)
