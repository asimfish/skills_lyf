# Research Commands - Quick Reference Card

## TL;DR (30 seconds)

- Search literature: `/research:arxiv "causal mediation analysis"`
- Write methods section: `/research:manuscript:methods "bootstrap mediation analysis"`
- Design simulation: `/research:simulation:design "compare bootstrap methods"`

## Quick Command Reference

| Command | Use Case | Example | Time |
|---------|----------|---------|------|
| `/research:arxiv` | Search arXiv papers | `/research:arxiv "mediation" --recent` | 1 min |
| `/research:doi` | Lookup by DOI | `/research:doi 10.1080/01621459.2020` | 30 sec |
| `/research:bib:search` | Search BibTeX files | `/research:bib:search "Pearl" refs.bib` | 30 sec |
| `/research:bib:add` | Add to bibliography | `/research:bib:add entry.bib refs.bib` | 30 sec |
| `/research:manuscript:methods` | Write methods section | `/research:manuscript:methods "RCT design"` | 3 min |
| `/research:manuscript:results` | Write results section | `/research:manuscript:results "findings"` | 3 min |
| `/research:manuscript:reviewer` | Respond to reviewers | `/research:manuscript:reviewer "R2 Q3"` | 5 min |
| `/research:manuscript:proof` | Review proofs | `/research:manuscript:proof "Appendix A"` | 5 min |
| `/research:simulation:design` | Design simulation study | `/research:simulation:design "bootstrap"` | 10 min |
| `/research:simulation:analysis` | Analyze simulation results | `/research:simulation:analysis results.csv` | 5 min |
| `/research:lit-gap` | Identify literature gaps | `/research:lit-gap "unmeasured confounding"` | 5 min |
| `/research:hypothesis` | Generate hypotheses | `/research:hypothesis "treatment heterogeneity"` | 3 min |
| `/research:analysis-plan` | Create analysis plan | `/research:analysis-plan "RCT mediation"` | 10 min |
| `/research:method-scout` | Find statistical methods | `/research:method-scout "high-dim mediation"` | 3 min |

## Common Workflows

### Workflow 1: Literature Review ⏱️ 2-4 hours

```bash
# Phase 1: Initial search (30 min)
/research:arxiv "causal mediation analysis" --recent
/research:doi "10.1080/01621459.2020.1765785"

# Phase 2: Gap analysis (1 hour)
/research:lit-gap "mediation with unmeasured confounding"
/research:method-scout "sensitivity analysis methods"

# Phase 3: Bibliography management (30 min)
/research:bib:search "Pearl" references.bib
/research:bib:add new-entry.bib references.bib

# Phase 4: Hypothesis development (1 hour)
/research:hypothesis "treatment effect heterogeneity in mediation"
/research:analysis-plan "sensitivity analysis for mediation"
```

### Workflow 2: Manuscript Methods Section ⏱️ 1-2 hours

```bash
# Step 1: Draft methods (30 min)
/research:manuscript:methods "Bootstrap confidence intervals for indirect effects in mediation analysis"

# Step 2: Add statistical details (30 min)
/research:manuscript:methods "Describe the percentile bootstrap procedure with 10,000 replications"

# Step 3: Review proofs (if applicable, 30 min)
/research:manuscript:proof "Check identifiability assumptions in Section 2.1"

# Step 4: Literature support (30 min)
/research:bib:search "bootstrap" references.bib
/research:arxiv "bootstrap mediation" --since 2020
```

### Workflow 3: Simulation Study Design ⏱️ 2-3 hours

```bash
# Step 1: Design simulation (30 min)
/research:simulation:design "Compare bootstrap and asymptotic CI for indirect effects"

# Step 2: Literature review (1 hour)
/research:method-scout "bootstrap mediation methods"
/research:arxiv "bootstrap confidence intervals mediation"

# Step 3: Refine design (30 min)
/research:analysis-plan "Monte Carlo study with 1000 replications per condition"

# Step 4: Analysis planning (1 hour)
/research:simulation:analysis --plan  # Preview analysis approach
/research:manuscript:results "Describe expected output tables and figures"
```

### Workflow 4: Reviewer Response ⏱️ 3-5 hours

```bash
# Step 1: Initial responses (1 hour)
/research:manuscript:reviewer "Reviewer 2 questions the choice of bootstrap method"
/research:manuscript:reviewer "Reviewer 1 asks for sensitivity analysis"

# Step 2: Literature support (1 hour)
/research:arxiv "sensitivity analysis mediation"
/research:method-scout "alternative bootstrap methods"

# Step 3: Additional analysis (2 hours)
/research:simulation:design "Sensitivity analysis for unmeasured confounding"
/research:manuscript:methods "Describe sensitivity analysis approach"

# Step 4: Proof checking (1 hour, if needed)
/research:manuscript:proof "Verify revised identifiability argument"
```

## Keyboard Shortcuts / Flags

### Search & Discovery

| Flag | Effect | Example |
|------|--------|---------|
| `--recent` | Recent papers only | `/research:arxiv "topic" --recent` |
| `--since YYYY` | Papers since year | `/research:arxiv "topic" --since 2020` |
| `--max N` | Limit results | `/research:arxiv "topic" --max 10` |

### Manuscript Commands

| Flag | Effect | Example |
|------|--------|---------|
| `--format md` | Markdown output | `/research:manuscript:methods --format md` |
| `--format tex` | LaTeX output | `/research:manuscript:methods --format tex` |
| `--citations` | Include citations | `/research:manuscript:methods --citations refs.bib` |
| `--notation` | Math notation style | `/research:manuscript:methods --notation statistical` |

### Simulation Commands

| Flag | Effect | Example |
|------|--------|---------|
| `--plan` | Design only (no code) | `/research:simulation:design --plan` |
| `--language R` | R code output | `/research:simulation:design --language R` |
| `--replications N` | Set replications | `/research:simulation:design --replications 1000` |

### Bibliography Management

| Flag | Effect | Example |
|------|--------|---------|
| `--author` | Search by author | `/research:bib:search --author "Pearl"` |
| `--year YYYY` | Filter by year | `/research:bib:search --year 2020` |
| `--deduplicate` | Remove duplicates | `/research:bib:add --deduplicate` |

### General Flags

| Flag | Effect | Example |
|------|--------|---------|
| `--dry-run` | Preview without API | `/research:arxiv --dry-run "topic"` |
| `--verbose` | Detailed output | `/research:manuscript:methods --verbose` |
| `--output FILE` | Save to file | `/research:arxiv "topic" --output results.md` |

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Commands not showing | `claude plugin update scholar@local-plugins` |
| arXiv search fails | Check internet connection, try `--max 5` to reduce results |
| DOI lookup error | Verify DOI format: `10.XXXX/...` |
| BibTeX file not found | Use absolute path: `/research:bib:search "author" ~/refs.bib` |
| Methods section too generic | Add specific details in prompt: `/research:manuscript:methods "RCT with 200 participants, bootstrap CIs, 10k reps"` |
| Simulation code errors | Specify language: `/research:simulation:design --language R` |
| Missing citations | Use `--citations` flag and provide `.bib` file path |
| API key error | Set `ANTHROPIC_API_KEY` environment variable |
| Output format wrong | Use `--format md/tex/json` flag explicitly |
| Reviewer response too brief | Provide specific context: `/research:manuscript:reviewer "R2 Q3: Why not use permutation test?"` |

## Research Workflow Cheatsheet

### Literature Phase

```bash
# Discovery
/research:arxiv "topic" --recent --max 10

# Deep dive
/research:doi "10.XXXX/..."
/research:lit-gap "research area"

# Organize
/research:bib:search "keyword" refs.bib
/research:bib:add entry.bib refs.bib
```

### Planning Phase

```bash
# Generate ideas
/research:lit-gap "topic"
/research:hypothesis "research question"

# Design study
/research:analysis-plan "study design"
/research:method-scout "statistical approach"
```

### Execution Phase

```bash
# Simulations
/research:simulation:design "comparison study"
/research:simulation:analysis results.csv

# Writing
/research:manuscript:methods "methodology"
/research:manuscript:results "findings"
```

### Revision Phase

```bash
# Review
/research:manuscript:proof "theorem"
/research:manuscript:reviewer "reviewer comments"

# Update bibliography
/research:bib:search "new topic" refs.bib
/research:bib:add new-refs.bib refs.bib
```

## Quick Tips

### Literature Search

- **Be specific**: `/research:arxiv "bootstrap mediation indirect effects"` > `/research:arxiv "mediation"`
- **Use date filters**: `--recent` or `--since 2020` for current methods
- **Combine with DOI**: Find paper on arXiv → get DOI → get BibTeX

### Manuscript Writing

- **Provide context**: Include study design, sample size, methods in prompt
- **Iterate**: Start broad → refine with specific statistical details
- **Use citations**: Always provide `--citations refs.bib` for proper references

### Simulations

- **Start with design**: Use `/research:simulation:design` before coding
- **Literature first**: Run `/research:method-scout` to find existing approaches
- **Plan analysis**: Use `--plan` flag to preview without generating code

### Bibliography Management

- **Central file**: Keep one main `references.bib` file
- **Deduplicate**: Use `--deduplicate` when adding entries
- **Search first**: Always `/research:bib:search` before adding

## Common Use Cases

| Scenario | Command Chain |
|----------|---------------|
| **Starting new project** | `arxiv` → `lit-gap` → `hypothesis` → `analysis-plan` |
| **Writing methods** | `method-scout` → `manuscript:methods` → `bib:search` |
| **Designing simulation** | `arxiv` → `simulation:design` → `analysis-plan` |
| **Responding to reviewers** | `manuscript:reviewer` → `arxiv` → `manuscript:methods` |
| **Literature review** | `arxiv` → `doi` → `bib:add` → `lit-gap` |
| **Proof checking** | `manuscript:proof` → `method-scout` → `arxiv` |

## Integration with Other Tools

### With Zotero

```bash
# Export from Zotero → Add to project bibliography
/research:bib:add zotero-export.bib references.bib --deduplicate
```

### With R/Python

```bash
# Design simulation → Copy R code → Run in IDE
/research:simulation:design "study" --language R --output sim-design.R
```

### With LaTeX

```bash
# Generate methods → LaTeX format → Insert in manuscript
/research:manuscript:methods "approach" --format tex --output methods.tex
```

### With Quarto/RMarkdown

```bash
# Generate methods → Markdown format → Include in document
/research:manuscript:methods "approach" --format md --output methods.md
```

## Time-Saving Combinations

### Quick Literature Review (30 min)

```bash
/research:arxiv "topic" --recent --max 10 --output lit-search.md
/research:lit-gap "topic" --output gaps.md
```

### Rapid Methods Section (1 hour)

```bash
/research:method-scout "approach" --output methods-options.md
/research:manuscript:methods "chosen approach" --citations refs.bib --format tex
```

### Fast Reviewer Response (2 hours)

```bash
/research:manuscript:reviewer "comment" --verbose --output response-R1.md
/research:arxiv "related topic" --recent --max 5
/research:bib:add new-support.bib refs.bib
```

### Complete Simulation Pipeline (4 hours)

```bash
/research:simulation:design "comparison" --language R --output design.R
# [Run simulation in R]
/research:simulation:analysis results.csv --output analysis-report.md
/research:manuscript:results "simulation findings" --format tex
```

## More Information

### Full Guides

- [Research Commands Reference](../research/RESEARCH-COMMANDS-REFERENCE.md) - Complete command documentation
- [Research Workflows Guide](../research/RESEARCH-WORKFLOWS-SECTION-3.md) - Detailed workflow examples
- [Literature Management](../research/LITERATURE-COMMANDS.md) - arXiv, DOI, BibTeX tools
- [Manuscript Writing](../research/MANUSCRIPT-COMMANDS.md) - Methods, results, proofs
- [Simulation Studies](../research/SIMULATION-COMMANDS.md) - Design and analysis

### Tutorials

- [Your First Literature Search](../tutorials/research/first-literature-search.md) - 15-minute tutorial
- [Writing a Methods Section](../tutorials/research/methods-section.md) - Step-by-step guide
- [Designing Simulations](../tutorials/research/simulation-design.md) - Complete workflow
- [Responding to Reviewers](../tutorials/research/reviewer-response.md) - Best practices

### Examples

- [Research Examples](../examples/research.md) - Real-world use cases
- [Simulation Examples](../examples/simulations.md) - Complete simulation studies
- [Manuscript Examples](../examples/manuscripts.md) - Methods and results sections

### Help & Support

- [FAQ](../help/FAQ-research.md) - Common questions
- [Common Issues](../help/COMMON-ISSUES.md#research-commands) - Troubleshooting
- [Troubleshooting Guide](../help/TROUBLESHOOTING-research.md) - Error reference and troubleshooting

### Related Resources

- [Research Hub](../research/index.md) - Overview of research capabilities
- [Configuration Guide](../CONFIGURATION.md) - Configure research settings
- [API Reference](../API-REFERENCE.md) - Developer documentation
