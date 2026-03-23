# What's New in Scholar v2.13.0

**Released:** 2026-02-16 | **PR:** [#83](https://github.com/Data-Wise/scholar/pull/83)

## Solution Key Generator — `/teaching:solution`

Scholar v2.13.0 adds the `/teaching:solution` command — a standalone solution key generator that creates answer keys from existing `.qmd` or `.json` assignment files. This is the 15th teaching command and the 9th AI-capable command (supporting `-i`/`--instructions`).

### The Problem

After creating assignments with `/teaching:assignment`, instructors needed a separate workflow to generate solution keys. Solution creation required manually re-reading the assignment and crafting answers, with no way to leverage the structured data already in the assignment files.

### The Solution

`/teaching:solution` parses existing assignment files and generates comprehensive solution keys with AI-powered answers:

```bash
# Generate solution key from a QMD assignment
/teaching:solution homework-03.qmd

# Include rubric scoring information
/teaching:solution midterm.qmd --include-rubric

# Preview without generating (dry run)
/teaching:solution homework-03.qmd --dry-run

# Custom instructions for solution style
/teaching:solution homework-03.qmd -i "Show all intermediate steps, use R code examples"
```

### QMD Parser

The built-in QMD parser recognizes 5 heading patterns for extracting problems:

| Pattern | Example |
|---------|---------|
| `## Problem N` | `## Problem 1: Linear Regression` |
| `## Exercise N` | `## Exercise 3` |
| `## Question N` | `## Question 2: Hypothesis Testing` |
| `## N.` | `## 1. Descriptive Statistics` |
| `**Problem N**` | `**Problem 4: ANOVA**` |

### Output Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| Quarto | `.qmd` | Default — renders to HTML/PDF with math support |
| Markdown | `.md` | Simple, portable solution keys |
| JSON | `.json` | Programmatic access, LMS integration |

### Options

| Option | Description |
|--------|-------------|
| `--format` | Output format: `qmd` (default), `md`, `json` |
| `--output` | Custom output path (default: `solutions/<name>-solution.qmd`) |
| `--include-rubric` | Include rubric/scoring information in solutions |
| `--include-code` | Include code examples in solutions |
| `--no-code` | Exclude all code from solutions |
| `--language` | Programming language for code examples (default: R) |
| `-i`, `--instructions` | Custom instructions for AI generation |
| `--dry-run` | Preview parsed problems without generating |
| `--json` | Force JSON output |
| `--send [EMAIL]` | Email solution to TA via himalaya MCP |
| `--debug` | Show detailed processing information |
| `--config` | Path to config file |

### Workflow Integration

The solution command fits naturally into the assignment workflow:

```bash
# Step 1: Create assignment
/teaching:assignment "Multiple Regression" --problems 5

# Step 2: Review and customize the .qmd file
# (edit homework-05-multiple-regression.qmd)

# Step 3: Generate solution key
/teaching:solution homework-05-multiple-regression.qmd --include-rubric

# Output: solutions/homework-05-multiple-regression-solution.qmd
```

### Email Delivery (`--send`)

Send generated solution keys directly to your TA via email:

```bash
# Email using configured TA address from teach-config.yml
/teaching:solution homework-03.qmd --send

# Email to explicit address
/teaching:solution homework-03.qmd --send ta@university.edu
```

The `--send` flag uses the himalaya MCP for email composition with a preview-before-send workflow. The recipient is resolved from: (1) the explicit email argument, or (2) `course.staff.ta_email` in `.flow/teach-config.yml`.

Emails include a formatted subject line with course code, solution metadata, and a confidentiality warning.

### Default Output Directory

Solutions are written to a `solutions/` subdirectory by convention. This directory should be added to `.gitignore` to prevent accidental publication of answer keys.

## Documentation Updates

- Hub documentation updated with 30 commands
- Learning path synced with all 17 teaching tutorials
- Documentation gaps filled for solution command and stale command counts

## Stats

| Metric | v2.12.0 | v2.13.0 | Change |
|--------|---------|---------|--------|
| Commands | 30 | 30 | — |
| Teaching commands | 15 | 15 | — |
| AI-capable commands | 8 | 9 | +1 |
| Tests | 2,873 | 2,906 | +33 |
| Test suites | 125 | 126 | +1 |

**Full Changelog:** [v2.12.0...v2.13.0](https://github.com/Data-Wise/scholar/compare/v2.12.0...v2.13.0)

**Previous release:** [What's New in v2.12.0](WHATS-NEW-v2.12.0.md) — Hub Flag Discovery
