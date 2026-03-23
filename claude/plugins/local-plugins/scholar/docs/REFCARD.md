# Scholar Plugin - Reference Card

> **Version:** {{ scholar.version }} | **Last Updated:** 2026-02-27

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCHOLAR PLUGIN REFERENCE                                   v2.16.0        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TEACHING (18 commands)            │  LITERATURE (4 commands)               │
│  ────────                          │  ──────────                            │
│  /teaching:exam                    │  /arxiv                                │
│    Generate comprehensive exam     │    Search arXiv papers                 │
│  /teaching:quiz                    │  /doi                                  │
│    Create quiz with answers        │    Lookup by DOI                       │
│  /teaching:syllabus                │  /bib:add                              │
│    Build course syllabus           │    Add to BibTeX                       │
│  /teaching:assignment              │  /bib:search                           │
│    Create homework                 │    Search BibTeX library               │
│  /teaching:rubric                  │                                        │
│    Generate grading rubric         │  MANUSCRIPT (4 commands)               │
│  /teaching:slides (UPDATED v2.8.0) │  ──────────                            │
│    Create/revise/check slides     │  /manuscript:methods                   │
│  /teaching:lecture                 │    Write methods section               │
│    Generate lecture notes (Quarto) │  /manuscript:results                   │
│  /teaching:feedback                │    Write results section               │
│    Generate student feedback       │  /manuscript:proof                     │
│  /teaching:demo                    │    Review mathematical proof           │
│    Create demo course environment  │  /manuscript:reviewer                  │
│  /teaching:validate                │    Respond to reviewers                │
│    Validate YAML configs           │                                        │
│  /teaching:diff                    │  SIMULATION (2 commands)               │
│    Compare YAML/JSON sync          │  ──────────                            │
│  /teaching:sync                    │  /simulation:design                    │
│    Sync YAML to JSON               │    Design Monte Carlo study            │
│  /teaching:migrate                 │  /simulation:analysis                  │
│    Batch migrate v1→v2 schema      │    Analyze simulation results          │
│  /teaching:solution (NEW)          │                                        │
│    Generate solution keys          │  RESEARCH (4 commands)                 │
│  /teaching:config (NEW)            │  ────────                              │
│    Config management & provenance  │                                        │
│  /teaching:validate-r              │                                        │
│    Validate R code in .qmd files   │                                        │
│  /teaching:preflight               │                                        │
│    Pre-release health checks       │                                        │
│  /teaching:canvas (NEW)            │                                        │
│    Export QMD exam to Canvas QTI   │                                        │
│                                    │  /scholar:hypothesis                   │
│                                    │    Generate hypotheses                 │
│                                    │  /scholar:analysis-plan                │
│                                    │    Create analysis plan                │
│                                    │  /scholar:lit-gap                      │
│                                    │    Find literature gaps                │
│                                    │  /scholar:method-scout                 │
│                                    │    Scout statistical methods           │
│                                    │                                        │
│                                    │  HUB (1 command) NEW                   │
│                                    │  ───                                   │
│                                    │  /scholar:hub                          │
│                                    │    Browse & discover all commands      │
├─────────────────────────────────────────────────────────────────────────────┤
│  EXAM EXPORT FORMATS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Format        │ Use Case                    │ Output                       │
│  ─────────     │ ────────                    │ ──────                       │
│  LaTeX         │ Print exams, academic style │ .tex (student/key/rubric)    │
│  Markdown      │ Static sites, quick edit    │ .md with YAML frontmatter    │
│  Canvas QTI    │ LMS import                  │ .zip via examark             │
│  Quarto        │ Reproducible documents      │ .qmd with code chunks        │
│  JSON          │ Custom processing           │ .json structured data        │
├─────────────────────────────────────────────────────────────────────────────┤
│  AUTO-ACTIVATING SKILLS (17)                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  MATHEMATICAL (4)                  │  WRITING (3)                           │
│  • Asymptotic Theory               │  • Methods Communicator                │
│  • Identification Theory           │  • Methods Paper Writer                │
│  • Mathematical Foundations        │  • Publication Strategist              │
│  • Proof Architect                 │                                        │
│                                    │  RESEARCH (5)                          │
│  IMPLEMENTATION (5)                │  • Cross-Disciplinary Ideation         │
│  • Algorithm Designer              │  • Literature Gap Finder               │
│  • Computational Inference         │  • Mediation Meta-Analyst              │
│  • Numerical Methods               │  • Method Transfer Engine              │
│  • Simulation Architect            │  • Sensitivity Analyst                 │
│  • Statistical Software QA         │                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  COMMON WORKFLOWS                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Try Demo Course                   │  Build Course Materials                │
│  1. /teaching:demo                 │  1. /teaching:syllabus "Course"        │
│  2. cd demo-course/                │  2. /teaching:quiz "Topic"             │
│  3. /teaching:exam midterm         │  3. /teaching:assignment               │
│                                    │                                        │
│  Slide Revision (NEW v2.8.0)       │  Slide Validation (NEW v2.8.0)        │
│  1. /teaching:slides "Topic"       │  1. /teaching:slides --check           │
│  2. --revise slides.qmd --dry-run  │       slides.qmd --from-plan week03   │
│  3. --revise slides.qmd            │  2. Copy suggested --revise commands   │
│                                    │  3. Re-check after fixes               │
│                                    │                                        │
│  Literature Review                 │  Manuscript Writing                    │
│  1. /arxiv "topic"                 │  1. /manuscript:methods                │
│  2. /doi 10.xxxx/yyyy              │  2. /manuscript:results                │
│  3. /bib:add                       │  3. /manuscript:proof                  │
│  4. /scholar:lit-gap               │  4. /manuscript:reviewer               │
├─────────────────────────────────────────────────────────────────────────────┤
│  INSTALLATION                                                               │
│  brew tap data-wise/tap && brew install scholar                             │
│  OR: cd scholar && ./scripts/install.sh --dev                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Command Reference

### Teaching Commands

| Command                | Purpose                     | Example                                         |
| ---------------------- | --------------------------- | ----------------------------------------------- |
| `/teaching:exam`       | Generate exam               | `/teaching:exam midterm --questions 15`         |
| `/teaching:quiz`       | Create quiz                 | `/teaching:quiz "Chapter 5"`                    |
| `/teaching:syllabus`   | Course syllabus             | `/teaching:syllabus "Stats 101" "Spring 2026"`  |
| `/teaching:assignment` | Homework                    | `/teaching:assignment "Linear Regression"`      |
| `/teaching:rubric`     | Grading rubric              | `/teaching:rubric "data analysis project"`      |
| `/teaching:slides`     | Create/revise/check slides  | `/teaching:slides "Hypothesis Testing"`         |
| `/teaching:lecture`    | Lecture notes               | `/teaching:lecture "Multiple Regression"`       |
| `/teaching:feedback`   | Student feedback            | `/teaching:feedback` (interactive)              |
| `/teaching:demo`       | Demo course setup           | `/teaching:demo ~/test-course --force --verify` |
| `/teaching:validate`   | Validate YAML configs       | `/teaching:validate --fix --auto`               |
| `/teaching:diff`       | Compare YAML/JSON           | `/teaching:diff week-01.yml`                    |
| `/teaching:sync`       | Sync YAML to JSON           | `/teaching:sync --watch`                        |
| `/teaching:migrate`    | Batch v1→v2 migration (NEW) | `/teaching:migrate --dry-run`                   |
| `/teaching:solution`   | Generate solution keys      | `/teaching:solution assignments/hw3.qmd`        |
| `/teaching:config`     | Config management           | `/teaching:config --inspect`                    |
| `/teaching:validate-r` | Validate R code in .qmd (NEW) | `/teaching:validate-r solutions/hw4.qmd`      |
| `/teaching:preflight`  | Pre-release health checks (NEW) | `/teaching:preflight`                        |
| `/teaching:canvas`     | Export QMD exam to Canvas QTI (NEW) | `/teaching:canvas exam.qmd --validate`     |

### All teaching commands support `-dry-run` to preview without API calls

- **NEW in v2.13.0:** `/teaching:solution` for standalone solution keys from `.qmd` files, with `--send` email support
- **NEW in v2.8.0:** `/teaching:slides --revise` for targeted/auto slide revision, `--check` for 3-layer validation
- **NEW in v2.8.0:** `/teaching:lecture --revise` replaces `--refine` (silent alias preserved)
- **NEW in v2.3.0:** `/teaching:migrate` for batch v1→v2 schema migration with atomic rollback
- **NEW in v2.2.0:** `/teaching:validate`, `/teaching:diff`, `/teaching:sync` for config management
- **NEW in v2.1.0:** `/teaching:lecture` for instructor-facing lecture notes (20-40 pages)

```bash
/teaching:exam midterm --dry-run        # Human-readable preview
/teaching:lecture "ANOVA" --dry-run     # Preview lecture outline
/teaching:quiz "Regression" --dry-run --json  # JSON preview
```

### Lecture Notes vs Slides

| Feature      | `/teaching:slides`      | `/teaching:lecture`                 |
| ------------ | ----------------------- | ----------------------------------- |
| **Output**   | Reveal.js/Beamer slides | Quarto document (20-40 pages)       |
| **Content**  | Bullets, minimal text   | Comprehensive prose, derivations    |
| **Code**     | Display snippets        | Full executable R/Python blocks     |
| **Math**     | Inline equations        | Full LaTeX (align, cases, matrices) |
| **Use**      | Project in class        | Read/reference while teaching       |
| **Revise**   | `--revise` + auto-analysis (v2.8.0) | `--revise` section/full (v2.5.0) |
| **Validate** | `--check` 3-layer (v2.8.0) | `--check` coverage (v2.5.0)     |

### Exam Export Formats

| Format         | Command/Option          | Output Files                                          |
| -------------- | ----------------------- | ----------------------------------------------------- |
| **LaTeX**      | Export after generation | `exam-student.tex`, `exam-key.tex`, `exam-rubric.tex` |
| **Markdown**   | Default format          | `.md` with YAML frontmatter                           |
| **Canvas QTI** | Via examark             | `.zip` package for LMS import                         |
| **Quarto**     | For reproducible docs   | `.qmd` with code chunks                               |
| **JSON**       | For custom processing   | Structured `.json` file                               |

### Literature Commands

| Command       | Purpose       | Example                                 |
| ------------- | ------------- | --------------------------------------- |
| `/arxiv`      | Search arXiv  | `/arxiv "mediation analysis bootstrap"` |
| `/doi`        | Lookup by DOI | `/doi 10.1037/met0000425`               |
| `/bib:add`    | Add citation  | `/bib:add` (interactive)                |
| `/bib:search` | Search BibTeX | `/bib:search "MacKinnon"`               |

### Manuscript Commands

| Command                | Purpose              | When to Use                           |
| ---------------------- | -------------------- | ------------------------------------- |
| `/manuscript:methods`  | Write methods        | New paper or updating methods section |
| `/manuscript:results`  | Write results        | After analysis complete               |
| `/manuscript:proof`    | Review proof         | Mathematical proofs in paper          |
| `/manuscript:reviewer` | Respond to reviewers | After receiving peer reviews          |

### Simulation Commands

| Command                | Purpose         | Output                                 |
| ---------------------- | --------------- | -------------------------------------- |
| `/simulation:design`   | Design study    | Simulation parameters, estimands, DGP  |
| `/simulation:analysis` | Analyze results | Bias, coverage, power, recommendations |

### Research Commands

| Command                  | Purpose              | Best For                                |
| ------------------------ | -------------------- | --------------------------------------- |
| `/scholar:hypothesis`    | Generate hypotheses  | Early research planning                 |
| `/scholar:analysis-plan` | Create analysis plan | Pre-registration, planning              |
| `/scholar:lit-gap`       | Find gaps            | Literature review, proposal writing     |
| `/scholar:method-scout`  | Scout methods        | Finding appropriate statistical methods |

### Hub (1 command)

| Command          | Purpose                | Example                           |
| ---------------- | ---------------------- | --------------------------------- |
| `/scholar:hub`   | Browse all commands    | `/scholar:hub`                    |
| `/scholar:hub`   | Drill into category    | `/scholar:hub research`           |
| `/scholar:hub`   | Command detail         | `/scholar:hub exam`               |
| `/scholar:hub`   | Quick reference card   | `/scholar:hub quick`              |

- **NEW in v2.7.0:** `/scholar:hub` for command discovery with smart context detection

---

## LaTeX Export Features

The exam generator produces three LaTeX documents:

| Document            | Contents                                    | Use Case             |
| ------------------- | ------------------------------------------- | -------------------- |
| **Student Version** | Questions only, answer spaces               | Print for students   |
| **Answer Key**      | Questions + highlighted answers + solutions | Instructor reference |
| **Grading Rubric**  | Point breakdown, criteria, expected answers | Grader guide         |

### Math Support

- Preserves LaTeX notation: `$\beta_0$`, `$R^2$`, `$\sum_{i=1}^n$`
- Automatic escaping of special characters
- Formula sheet support in exam header

---

## Skill Activation Triggers

Skills activate automatically when you're working on relevant tasks:

| Skill                     | Activates When...                          |
| ------------------------- | ------------------------------------------ |
| **Asymptotic Theory**     | Discussing convergence, CLT, consistency   |
| **Identification Theory** | Parameter identification, causal inference |
| **Proof Architect**       | Writing or reviewing mathematical proofs   |
| **Simulation Architect**  | Designing Monte Carlo studies              |
| **Algorithm Designer**    | Developing statistical algorithms          |
| **Methods Paper Writer**  | Writing methodology papers                 |
| **Literature Gap Finder** | Conducting literature reviews              |
| **Sensitivity Analyst**   | Assessing assumption robustness            |

---

## Installation

### Homebrew (Recommended)

```bash
brew tap data-wise/tap
brew install scholar
```

### Manual Installation

```bash
cd ~/projects/dev-tools/scholar
./scripts/install.sh --dev
```

### Uninstall

```bash
brew uninstall scholar
# OR
./scripts/uninstall.sh
```

---

## File Structure

```
scholar/
├── src/
│   ├── plugin-api/
│   │   ├── commands/          # 33 slash commands
│   │   │   ├── literature/    # 4 commands
│   │   │   ├── manuscript/    # 4 commands
│   │   │   ├── simulation/    # 2 commands
│   │   │   ├── research/      # 4 commands
│   │   │   ├── teaching/      # 18 commands
│   │   │   └── hub.md         # Hub command (NEW v2.7.0)
│   │   └── skills/            # 17 A-grade skills
│   ├── discovery/             # Discovery engine + smart help (NEW v2.7.0)
│   └── teaching/              # Teaching module
│       ├── ai/                # AI provider
│       ├── config/            # Config loader
│       ├── demo-templates/    # Demo course templates
│       ├── formatters/        # Export formats
│       ├── generators/        # Exam/quiz/lecture/slide generation
│       ├── templates/         # JSON templates
│       └── validators/        # Validation + slide coverage
├── lib/                       # API wrappers
├── tests/                     # {{ scholar.test_count }} tests
└── docs/                      # Documentation
```

---

## Troubleshooting

| Issue                 | Solution                                                   |
| --------------------- | ---------------------------------------------------------- |
| Commands not showing  | Restart Claude Code, check `~/.claude/plugins/scholar`     |
| Exam generation fails | Check course config in `.flow/teach-config.yml` (optional) |
| LaTeX not compiling   | Install pdflatex: `brew install basictex`                  |
| arXiv search fails    | Check internet connection, try simpler query               |
| BibTeX not found      | Ensure `.bib` file in current project directory            |
| Skills not activating | They auto-activate - use natural language tasks            |

---

## More Documentation

- **Quick Start:** `docs/QUICK-START.md`
- **Exam Generator:** `docs/EXAM-GENERATOR.md`
- **Developer Guide:** `docs/DEVELOPER-GUIDE.md`
- **Architecture:** `docs/architecture/PHASE-0-FOUNDATION.md`
- **Changelog:** `CHANGELOG.md`
- **Repository:** https://github.com/Data-Wise/scholar

---

**Quick Start:** `/teaching:demo` → Create demo course | `/teaching:exam midterm` → Generate exam | `/arxiv "topic"` → Search papers
