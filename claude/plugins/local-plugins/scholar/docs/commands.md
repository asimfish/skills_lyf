# Scholar Commands Reference

Complete reference for all {{ scholar.command_count }} commands organized by category.

## Command Categories

### Research Commands (14)

- [Literature Management](#literature-management) (4 commands)
- [Manuscript Writing](#manuscript-writing) (4 commands)
- [Simulation Studies](#simulation-studies) (2 commands)
- [Research Planning](#research-planning) (4 commands)

### Teaching Commands ({{ scholar.teaching_commands }})

- [Teaching](#teaching-commands) ({{ scholar.teaching_commands }} commands)

## Literature Management

### /research:arxiv

Search arXiv for statistical papers.

```bash
/research:arxiv "causal mediation analysis"
/research:arxiv "bootstrap confidence intervals"
```

**Features:**

- Full-text search across arXiv stat category
- Returns title, authors, abstract, PDF link
- Date filtering available

### /research:doi

Look up paper metadata by DOI.

```bash
/research:doi "10.1080/01621459.2020.1765785"
```

**Returns:**

- Full citation
- BibTeX entry
- Abstract
- Publication details

### /research:bib:search

Search BibTeX files for entries.

```bash
/research:bib:search "Pearl" references.bib
/research:bib:search "mediation" *.bib
```

### /research:bib:add

Add BibTeX entry to bibliography.

```bash
/research:bib:add entry.bib references.bib
```

## Manuscript Writing

### /research:manuscript:methods

Write methods sections with statistical rigor.

```bash
/research:manuscript:methods "Describe the bootstrap mediation analysis"
```

**Generates:**

- Statistical methodology
- Proper notation
- Parameter definitions
- Estimation procedures

### /research:manuscript:results

Generate results sections with proper reporting.

```bash
/research:manuscript:results "Report simulation study findings"
```

**Includes:**

- Statistical test results
- Effect sizes with CI
- Table formatting guidance
- Figure descriptions

### /research:manuscript:reviewer

Generate responses to reviewer comments.

```bash
/research:manuscript:reviewer "Reviewer 2 questions significance testing"
```

**Provides:**

- Respectful, professional responses
- Statistical justification
- Additional analysis suggestions
- Revision guidance

### /research:manuscript:proof

Review mathematical proofs for correctness.

```bash
/research:manuscript:proof "Check identifiability proof in Appendix A"
```

**Validates:**

- Logical flow
- Mathematical rigor
- Assumptions stated
- Completeness

## Simulation Studies

### /research:simulation:design

Design Monte Carlo simulation studies.

```bash
/research:simulation:design "Compare bootstrap methods for mediation"
```

**Provides:**

- Simulation parameters
- Sample size considerations
- Number of replications
- Performance metrics
- Analysis plan

### /research:simulation:analysis

Analyze simulation results.

```bash
/research:simulation:analysis results/simulation.csv
```

**Generates:**

- Performance summaries
- Bias and MSE calculations
- Coverage rate analysis
- Visualization code

## Research Planning

### /research:lit-gap

Identify literature gaps.

```bash
/research:lit-gap "mediation analysis with unmeasured confounding"
```

**Identifies:**

- Methodological gaps
- Application areas
- Research opportunities
- Novel contributions

### /research:hypothesis

Generate testable hypotheses.

```bash
/research:hypothesis "treatment effect heterogeneity"
```

**Produces:**

- Formal statistical hypotheses
- Null and alternative
- Test procedures
- Power considerations

### /research:analysis-plan

Create statistical analysis plans.

```bash
/research:analysis-plan "randomized trial with mediation"
```

**Includes:**

- Primary analysis
- Secondary analyses
- Sensitivity analyses
- Multiple testing procedures

### /research:method-scout

Scout statistical methods for problems.

```bash
/research:method-scout "high-dimensional mediation"
```

**Suggests:**

- Relevant methods
- R packages
- Key papers
- Implementation guidance

## Teaching Commands

### Common Options (All Teaching Commands)

All teaching commands support these options:

| Option         | Description                                          |
| -------------- | ---------------------------------------------------- |
| `--dry-run`    | Preview what would be generated without API calls    |
| `--json`       | Output dry-run as JSON (requires `--dry-run`)        |
| `--format FMT` | Output format: markdown, json, latex, quarto, canvas |

**Dry-Run Example:**

```bash
/teaching:exam midterm --dry-run
```

Output:

```
DRY RUN: /teaching:exam

Would generate:
  Format: markdown
  Output: exam-midterm-2026-01-13.md
  Template: exam

Parameters:
  Type: midterm
  Question count: 10

Course info:
  Code: STAT-440
  Level: undergraduate

No API calls would be made.
```

### /teaching:exam

Generate comprehensive exams with AI-powered questions and answer keys.

```bash
/teaching:exam midterm
/teaching:exam final --questions 15 --difficulty hard
/teaching:exam practice --topics "linear regression,hypothesis testing"
/teaching:exam midterm --dry-run --json  # Preview as JSON
```

**Options:**

- `--questions N` - Number of questions (default: 10)
- `--difficulty LEVEL` - easy, medium, hard
- `--duration N` - Duration in minutes
- `--topics "topic1,topic2"` - Specific topics
- `--variations N` - Generate N variations
- `--dry-run` - Preview without API calls
- `--json` - JSON output (with `--dry-run`)

**Question Types:**

- Multiple-choice (4 options)
- True/false
- Short-answer
- Numerical
- Essay with rubrics

**Output:**

- JSON file with complete exam structure
- LaTeX export support
- Canvas QTI export
- Automatic answer key

### /teaching:quiz

Generate quick quiz questions.

```bash
/teaching:quiz "Probability Basics"
/teaching:quiz "Normal Distribution" --questions 5
```

**Features:**

- Rapid question generation
- Answer key included
- Multiple choice and short answer
- Configurable difficulty

### /teaching:syllabus

Generate comprehensive course syllabus.

```bash
/teaching:syllabus "Introduction to Statistics"
/teaching:syllabus "Regression Analysis" "Fall 2026"
```

**Includes:**

- Course information and objectives
- Learning outcomes (measurable, actionable)
- Grading policy breakdown
- Week-by-week schedule
- Course policies (attendance, academic integrity, accommodations)

### /teaching:assignment

Create homework assignments with solutions.

```bash
/teaching:assignment "Linear Regression"
/teaching:assignment "Hypothesis Testing" "intermediate"
```

**Includes:**

- Clear learning objectives
- Multiple problem types (conceptual, computational, applied)
- Submission requirements
- Grading criteria

### /teaching:solution

Generate standalone solution keys from existing assignment files.

```bash
/teaching:solution assignments/assignment1.qmd
/teaching:solution assignments/hw3.json --format md --include-rubric
```

**Includes:**

- Step-by-step worked solutions
- R/Python code solutions (optional)
- Common mistakes and grading notes (optional)
- LaTeX math notation
- Email delivery to TA (`--send`)

### /teaching:validate-r

Validate R code chunks in `.qmd` files by executing them via Rscript.

```bash
/teaching:validate-r solutions/hw4-solution.qmd
/teaching:validate-r --all solutions/
/teaching:validate-r solutions/hw4.qmd --fix --verbose
```

**Features:**

- Extracts fenced R chunks, executes sequentially via `Rscript`
- Per-chunk PASS/FAIL/SKIP/WARN in eslint-style report
- Static lint: `setwd()`, absolute paths, `install.packages()`, `rm(list=ls())`
- `--fix` mode re-generates failing chunks (1 retry max)
- `--json` for CI pipelines, `--quiet` for minimal output
- Exit codes: 0 (pass), 1 (failures), 2 (lint warnings only)

### /teaching:rubric

Generate detailed grading rubrics.

```bash
/teaching:rubric "data analysis project"
/teaching:rubric "research paper" 100
```

**Includes:**

- Clear criteria for each performance level
- Point allocations
- Observable, measurable descriptors

### /teaching:slides

Create lecture slides with examples.

```bash
/teaching:slides "Multiple Regression"
/teaching:slides "Hypothesis Testing" 75
/teaching:slides "ANOVA" 50 --format reveal.js
```

**Includes:**

- Title slide with placeholders
- Learning objectives (3-5 outcomes)
- Content organized by subtopics
- Examples and visualizations
- Practice problems
- Summary with key takeaways

**Formats:**

- Markdown (default)
- LaTeX Beamer
- Reveal.js

### /teaching:feedback

Generate constructive student feedback.

```bash
/teaching:feedback "student-submission.pdf"
/teaching:feedback "homework-3" --rubric rubric.md
```

**Features:**

- Constructive, encouraging tone
- Specific improvement suggestions
- Rubric-aligned feedback
- Grade justification

### /teaching:demo

Create a complete demo course environment for testing and exploring teaching commands.

```bash
/teaching:demo
/teaching:demo ~/my-test-course
/teaching:demo --verify
/teaching:demo --force
/teaching:demo ~/test-course --force --verify --quiet
```

**Options:**

- `[path]` - Target directory (default: `./demo-course/`)
- `--verify` - Run smoke tests after creation
- `--force` - Overwrite existing directory without prompting
- `--quiet` - Minimal output for CI/CD

**Creates:**

- `.flow/teach-config.yml` - Course configuration (STAT-101)
- `README.md` - Quick start guide and testing instructions
- `TEST-CHECKLIST.md` - Manual testing checklist
- `sample-student-work.md` - Sample submission for feedback testing
- `examples/` - Pre-generated sample files:
  - `exam-midterm.json` - 10-question midterm
  - `quiz-descriptive.md` - Descriptive statistics quiz
  - `syllabus-stat101.md` - 15-week course syllabus
  - `assignment-regression.md` - Regression homework
  - `rubric-project.md` - Project grading rubric
  - `slides-probability.md` - Probability lecture slides

**Use Cases:**

- Testing all teaching commands with realistic data
- Onboarding new users to the plugin
- CI/CD validation of teaching features
- Learning what each command produces

### /teaching:lecture

Generate comprehensive instructor lecture notes in Quarto format.

```bash
/teaching:lecture "ANOVA"
/teaching:lecture "Multiple Regression" --depth advanced --exercises 10
```

**Includes:**

- 20-40 page Quarto documents with YAML frontmatter
- Learning objectives and key takeaways
- Worked examples with R code
- Practice exercises with solutions

### /teaching:validate

Validate YAML configuration files against Scholar's JSON Schema v2.

```bash
/teaching:validate configs/exam-config.yml
/teaching:validate --all --strict
```

**Features:**

- Multi-level validation (structure, semantic, cross-field)
- Auto-fixer for common issues (`--fix`)
- JSON output for CI integration (`--json`)

### /teaching:diff

Compare YAML source files with their generated JSON counterparts.

```bash
/teaching:diff configs/exam-config.yml
```

### /teaching:sync

Synchronize YAML configuration files to JSON, or bidirectional sync.

```bash
/teaching:sync configs/exam-config.yml
/teaching:sync --all
```

### /teaching:migrate

Batch migrate YAML configuration files from v1 to v2 schema.

```bash
/teaching:migrate configs/
/teaching:migrate --dry-run
```

### /teaching:config

Manage teaching configuration — scaffold prompts, inspect config, validate, detect drift, and track provenance.

```bash
/teaching:config scaffold
/teaching:config inspect
/teaching:config validate
/teaching:config drift
/teaching:config provenance
```

### /teaching:preflight

Run pre-release health checks on the Scholar plugin.

```bash
/teaching:preflight
/teaching:preflight --fix
/teaching:preflight --json
```

### /teaching:canvas

Convert QMD exam files to Canvas LMS QTI format via examark.

```bash
/teaching:canvas midterm.qmd
/teaching:canvas midterm.qmd --output midterm.qti.zip
/teaching:canvas midterm.qmd --validate --emulate
/teaching:canvas midterm.qmd --dry-run
```

---

## See Also

- **[Skills Guide](skills.md)** - 17 research skills
- **[API Wrappers](api-wrappers.md)** - Shell-based APIs
- **[Examples](COMMAND-EXAMPLES.md)** - Usage examples
