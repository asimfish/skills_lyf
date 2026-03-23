# Research Commands Reference

**Comprehensive reference for Scholar's {{ scholar.research_commands }} research commands**

This document provides detailed technical reference for all research commands in the Scholar plugin. For troubleshooting and workflows, see [FAQ-research.md](FAQ-research.md) and [TROUBLESHOOTING-research.md](TROUBLESHOOTING-research.md).

**Version:** {{ scholar.version }}
**Last Updated:** 2026-02-05
**Status:** Production-ready

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Command Categories](#command-categories)
- [Literature Management](#literature-management)
  - [`/research:arxiv`](#researcharxiv)
  - [`/research:doi`](#researchdoi)
  - [`/research:bib:search`](#researchbibsearch)
  - [`/research:bib:add`](#researchbibadd)
- [Manuscript Writing](#manuscript-writing)
  - [`/research:manuscript:methods`](#researchmanuscriptmethods)
  - [`/research:manuscript:results`](#researchmanuscriptresults)
  - [`/research:manuscript:reviewer`](#researchmanuscriptreviewer)
  - [`/research:manuscript:proof`](#researchmanuscriptproof)
- [Simulation Studies](#simulation-studies)
  - [`/research:simulation:design`](#researchsimulationdesign)
  - [`/research:simulation:analysis`](#researchsimulationanalysis)
- [Research Planning](#research-planning)
  - [`/research:lit-gap`](#researchlit-gap)
  - [`/research:hypothesis`](#researchhypothesis)
  - [`/research:analysis-plan`](#researchanalysis-plan)
  - [`/research:method-scout`](#researchmethod-scout)
- [Command Chaining & Workflows](#command-chaining-workflows)
- [Integration with Flow-CLI](#integration-with-flow-cli)
- [Configuration Options](#configuration-options)
- [Error Messages & Solutions](#error-messages-solutions)
- [Performance Tips](#performance-tips)
- [Version History](#version-history)

---

## Quick Reference

| Command | Category | Purpose | Output |
|---------|----------|---------|--------|
| `/research:arxiv` | Literature | Search arXiv papers | Paper metadata |
| `/research:doi` | Literature | Look up by DOI | Full citation + BibTeX |
| `/research:bib:search` | Literature | Search BibTeX files | Matching entries |
| `/research:bib:add` | Literature | Add to bibliography | Updated .bib file |
| `/research:manuscript:methods` | Manuscript | Write methods section | LaTeX/Markdown text |
| `/research:manuscript:results` | Manuscript | Write results section | Statistical text |
| `/research:manuscript:reviewer` | Manuscript | Respond to reviewers | Point-by-point response |
| `/research:manuscript:proof` | Manuscript | Review proofs | Proof validation |
| `/research:simulation:design` | Simulation | Design Monte Carlo study | Study plan |
| `/research:simulation:analysis` | Simulation | Analyze results | Tables + plots |
| `/research:lit-gap` | Planning | Find literature gaps | Gap analysis |
| `/research:hypothesis` | Planning | Generate hypotheses | Hypothesis document |
| `/research:analysis-plan` | Planning | Create analysis plan | Statistical plan |
| `/research:method-scout` | Planning | Find methods | Method recommendations |

---

## Command Categories

### Literature Management (4 commands)
Search papers, look up citations, manage bibliographies

**When to use:**
- Starting literature review
- Finding recent papers
- Adding references to manuscript
- Managing BibTeX files

**Key workflows:**
- arXiv search → DOI lookup → BibTeX add
- BibTeX search → DOI lookup → full citation

---

### Manuscript Writing (4 commands)
Write sections, respond to reviewers, validate proofs

**When to use:**
- Drafting methods/results sections
- Responding to peer review
- Checking mathematical proofs
- Preparing manuscript for submission

**Key workflows:**
- Methods → Results → Reviewer response
- Proof validation → Methods writing

---

### Simulation Studies (2 commands)
Design simulations, analyze results

**When to use:**
- Planning Monte Carlo studies
- Comparing statistical methods
- Analyzing simulation output
- Creating performance tables

**Key workflows:**
- Design → Implementation → Analysis
- Design → Analysis plan → Methods writing

---

### Research Planning (4 commands)
Identify gaps, generate hypotheses, plan analyses

**When to use:**
- Starting new research project
- Finding research opportunities
- Formulating testable hypotheses
- Creating pre-registration plans

**Key workflows:**
- Lit-gap → Hypothesis → Analysis plan
- Method-scout → Hypothesis → Simulation design

---

## Literature Management

### `/research:arxiv`

Search arXiv for papers matching your query using the arXiv API.

#### Syntax

```bash
/research:arxiv <query>
/research:arxiv <query> [limit]
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | String | ✅ Yes | — | Search terms (quoted if multi-word) |
| `limit` | Integer | ❌ No | 10 | Maximum results to return |

#### Examples

```bash
# Basic search (returns 10 results)
/research:arxiv "bootstrap mediation analysis"

# Search with custom limit
/research:arxiv "causal inference" 20

# Single-word search
/research:arxiv mediation
```

#### Output Format

For each matching paper:

```
Title: [Paper title]
Authors: [First 3 authors], et al.
arXiv ID: [arXiv identifier, e.g., 2301.12345]
Published: [YYYY-MM-DD]
Abstract: [First 200 characters...]
```

#### Implementation Details

**API Wrapper:** `${CLAUDE_PLUGIN_ROOT}/lib/arxiv-api.sh`

**Functions used:**
- `arxiv_search(query, limit)` - Main search function
- `arxiv_get_details(arxiv_id)` - Full paper details
- `arxiv_download_pdf(arxiv_id, output_path)` - PDF download

**Rate limits:**
- 3 requests per second
- Built-in 1-second delay between calls

**Search fields:**
- Title (weighted heavily)
- Abstract
- Author names
- arXiv categories

#### Follow-up Actions

After search results are displayed:

1. **Get full details:** Provide arXiv ID for complete metadata
2. **Download PDF:** Download paper to local directory
3. **Add BibTeX entry:** Use `/research:bib:add` to add citation
4. **Search related:** Find similar papers using "Related" API

#### Common Use Cases

**Starting literature review:**
```bash
# Find foundational papers
/research:arxiv "causal mediation Baron Kenny" 5

# Recent developments
/research:arxiv "bootstrap mediation 2024" 15
```

**Finding specific author's work:**
```bash
/research:arxiv "MacKinnon mediation" 20
```

**Domain-specific search:**
```bash
/research:arxiv "indirect effect psychology" 10
```

#### Integration with Other Commands

```bash
# Workflow: arXiv → DOI → BibTeX
/research:arxiv "mediation analysis"
# Find paper, note DOI
/research:doi 10.1037/met0000310
# Get BibTeX entry
/research:bib:add references.bib
```

#### Troubleshooting

**No results found:**
- Try broader search terms
- Check spelling
- Use fewer keywords
- Try author names only

**Timeout errors:**
- Reduce limit parameter
- Wait 30 seconds and retry
- Check internet connection

**Irrelevant results:**
- Use more specific terms
- Add year constraint in query
- Use arXiv category codes (e.g., "stat.ME")

#### Configuration

No configuration required. Uses public arXiv API.

**Optional environment variables:**
- `ARXIV_API_BASE` - Override API endpoint (default: `http://export.arxiv.org/api/query`)
- `ARXIV_TIMEOUT` - Request timeout in seconds (default: 30)

#### Related Commands

- `/research:doi` - Look up DOI from arXiv paper
- `/research:bib:search` - Search existing bibliography
- `/research:lit-gap` - Identify gaps from literature

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Migrated to scholar plugin from statistical-research
- **v2.5.0** (2026-01) - No changes

---

### `/research:doi`

Look up paper metadata by DOI (Digital Object Identifier) using the Crossref API.

#### Syntax

```bash
/research:doi <doi>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `doi` | String | ✅ Yes | — | DOI identifier (with or without "10." prefix) |

#### Examples

```bash
# Full DOI
/research:doi 10.1037/met0000310

# Without prefix (auto-corrected)
/research:doi 1037/met0000310

# Psychology/Statistics DOI patterns
/research:doi 10.1080/00273171.2017.1354758
```

#### Output Format

```
Title: [Full paper title]
Authors: [All authors, full names]
Journal: [Journal name]
Year: [Publication year]
Volume: [Volume number]
Issue: [Issue number]
Pages: [Page range]
DOI: [Full DOI]

BibTeX Entry:
@article{citation_key,
  title = {...},
  author = {...},
  journal = {...},
  year = {...},
  volume = {...},
  number = {...},
  pages = {...},
  doi = {...}
}
```

#### Implementation Details

**API Wrapper:** `${CLAUDE_PLUGIN_ROOT}/lib/crossref-api.sh`

**Functions used:**
- `crossref_lookup_doi(doi)` - Fetch metadata
- `crossref_get_bibtex(doi)` - Get BibTeX formatted citation
- `crossref_citation_count(doi)` - Get citation count (if available)

**Validation:**
- DOI format: Must match pattern `10\.[0-9]+/.*`
- Automatic "10." prefix addition if missing
- URL-encoded for API requests

**Rate limits:**
- Crossref API: ~50 requests/second (public pool)
- Polite mode: 1 request/second (recommended)
- Plus mode requires registration

#### Follow-up Actions

1. **Get BibTeX:** Formatted citation ready to paste
2. **Citation count:** See how many times cited
3. **Add to bibliography:** Use `/research:bib:add`
4. **Open in browser:** DOI resolver link
5. **Find related:** Papers citing this work

#### Common Use Cases

**From paper references:**
```bash
# Look up citation from reference list
/research:doi 10.1037/met0000310
```

**From arXiv paper:**
```bash
# After arXiv search, get published version
/research:arxiv "mediation bootstrap"
# Note DOI from results
/research:doi 10.1080/00273171.2014.962683
```

**Verify citation:**
```bash
# Check if citation details are correct
/research:doi 10.1037/met0000165
```

#### Integration with Other Commands

```bash
# Complete workflow: Search → DOI → BibTeX
/research:arxiv "causal mediation"
# Find paper with DOI
/research:doi 10.1080/00273171.2017.1354758
# Add to bibliography
/research:bib:add ~/Documents/references.bib
```

#### Troubleshooting

**DOI not found:**
- Verify DOI is correct (copy-paste from source)
- Some very recent papers may not be indexed yet
- Try removing any URL prefix (https://doi.org/)

**Timeout:**
- Wait 30 seconds and retry
- Check internet connection
- Crossref API may be temporarily unavailable

**Incomplete metadata:**
- Some publishers provide minimal metadata
- Try alternative sources (PubMed, Google Scholar)
- BibTeX may be more complete than JSON

**Invalid DOI format:**
- Ensure DOI starts with "10."
- Remove any surrounding whitespace
- Check for typos in numeric portion

#### Configuration

**Environment variables:**
- `CROSSREF_EMAIL` - Polite pool access (faster, optional)
- `CROSSREF_PLUS_TOKEN` - Plus API token (optional, premium)

**Setup polite mode:**
```bash
export CROSSREF_EMAIL="your.email@university.edu"
```

#### Related Commands

- `/research:arxiv` - Search for papers first
- `/research:bib:add` - Add retrieved citation
- `/research:bib:search` - Search existing bibliography

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Improved error handling
- **v2.5.0** (2026-01) - No changes

---

### `/research:bib:search`

Search BibTeX files for entries matching keywords.

#### Syntax

```bash
/research:bib:search <query>
/research:bib:search <query> <bib-file>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | String | ✅ Yes | — | Search keywords (author, title, year, etc.) |
| `bib-file` | Path | ❌ No | Auto-detect | Specific .bib file to search |

#### Examples

```bash
# Search all .bib files
/research:bib:search "mediation"

# Search specific author
/research:bib:search "MacKinnon"

# Search in specific file
/research:bib:search "bootstrap" ~/Documents/references/mediation.bib

# Multi-word search
/research:bib:search "Baron Kenny 1986"
```

#### Output Format

For each matching entry:

```
Entry Type: article
Cite Key: mackinnon2004
Title: Confidence Limits for the Indirect Effect...
Author: MacKinnon, D. P., Lockwood, C. M., Williams, J.
Year: 2004
Journal: Multivariate Behavioral Research
```

#### Implementation Details

**API Wrapper:** `${CLAUDE_PLUGIN_ROOT}/lib/bibtex-utils.sh`

**Functions used:**
- `bib_search(query, [file])` - Search with keywords
- `bib_get_entry(cite_key, [file])` - Get full entry by key
- `bib_format_entry(cite_key)` - Pretty print entry

**Search locations (if no file specified):**
1. `$HOME/Zotero/bibtex/` (Zotero export directory)
2. `$HOME/Documents/references/` (Common reference location)
3. Current working directory (`./*.bib`)
4. Project directory (`./references/*.bib`)

**Search fields:**
- Author names (last, first, all authors)
- Title (partial matches)
- Year (exact match)
- Journal/booktitle
- Keywords/tags (if present)
- Abstract (if present)
- Cite key

**Matching:**
- Case-insensitive
- Partial matches allowed
- Boolean AND (all terms must match)
- Supports regex patterns

#### Follow-up Actions

1. **View full entry:** Display complete BibTeX
2. **Copy cite key:** For use in LaTeX
3. **Export entries:** Save subset to new .bib file
4. **Look up DOI:** Get latest metadata
5. **Open PDF:** If linked in BibTeX entry

#### Common Use Cases

**Find all papers by author:**
```bash
/research:bib:search "MacKinnon"
# Returns all entries with MacKinnon as author
```

**Find paper from memory:**
```bash
# Recall approximate title
/research:bib:search "confidence limits indirect"
```

**Check if paper is in library:**
```bash
/research:bib:search "Baron Kenny 1986"
# Verify if classic paper is cited
```

**Build themed bibliography:**
```bash
# Find all mediation papers
/research:bib:search "mediation"
# Export to new file
```

#### Integration with Other Commands

```bash
# Workflow: Check existing → Search new → Add
/research:bib:search "bootstrap mediation"
# If not found, search arXiv
/research:arxiv "bootstrap mediation"
# Add new papers
/research:bib:add references.bib
```

#### Troubleshooting

**No .bib files found:**
- Specify explicit path to .bib file
- Check default search locations
- Verify .bib files have `.bib` extension

**No matches found:**
- Try broader search terms
- Check spelling (especially author names)
- Try searching just year or just author
- Use `/research:arxiv` for new papers

**Too many results:**
- Add more specific terms
- Include year to narrow down
- Specify journal name
- Search specific .bib file

**Malformed BibTeX:**
- Some entries may be incomplete
- Check .bib file syntax
- Use BibTeX validator
- Re-export from reference manager

#### Configuration

**Environment variables:**
- `BIB_SEARCH_PATHS` - Colon-separated search directories
- `BIB_DEFAULT_FILE` - Default .bib file path

**Example setup:**
```bash
export BIB_SEARCH_PATHS="$HOME/Zotero/bibtex:$HOME/references"
export BIB_DEFAULT_FILE="$HOME/Documents/main-references.bib"
```

#### Related Commands

- `/research:bib:add` - Add new entries
- `/research:doi` - Look up by DOI
- `/research:arxiv` - Search for new papers

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.1.0** (2026-01) - Added regex support
- **v2.5.0** (2026-01) - No changes

---

### `/research:bib:add`

Add BibTeX entries to bibliography file.

#### Syntax

```bash
/research:bib:add <file>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file` | Path | ✅ Yes | — | Target .bib file (created if doesn't exist) |

#### Examples

```bash
# Add to main bibliography
/research:bib:add references.bib

# Add to project-specific file
/research:bib:add ~/projects/mediation/literature.bib

# Create new bibliography
/research:bib:add new-references.bib
```

#### Output Format

```
Added entry to references.bib:
  Cite key: mackinnon2004
  Type: article
  Title: Confidence Limits for the Indirect Effect

Total entries in file: 247
```

#### Implementation Details

**API Wrapper:** `${CLAUDE_PLUGIN_ROOT}/lib/bibtex-utils.sh`

**Functions used:**
- `bib_add_entry(bibtex_string, file)` - Add single entry
- `bib_validate_entry(bibtex_string)` - Check syntax
- `bib_check_duplicates(cite_key, file)` - Prevent duplicates

**Validation:**
- BibTeX syntax checking
- Required fields verification
- Duplicate cite key detection
- Malformed entry warnings

**Duplicate handling:**
- Check cite key before adding
- Prompt user if duplicate exists
- Option to skip or replace
- Preserve original by default

#### Follow-up Actions

1. **Verify entry:** Display added entry
2. **Format file:** Run BibTeX formatter
3. **Update cite keys:** Standardize naming
4. **Sync to Zotero:** If using Zotero integration
5. **Commit changes:** If .bib is version-controlled

#### Common Use Cases

**Add from DOI lookup:**
```bash
# Get BibTeX from DOI
/research:doi 10.1037/met0000310
# Add to bibliography
/research:bib:add references.bib
```

**Add from arXiv:**
```bash
# Search arXiv
/research:arxiv "mediation bootstrap"
# Get BibTeX for specific paper
# Add to bibliography
/research:bib:add references.bib
```

**Build new bibliography:**
```bash
# Start fresh file
/research:bib:add mediation-lit.bib
# Add multiple papers sequentially
```

#### Integration with Other Commands

```bash
# Complete workflow: Search → Lookup → Add
/research:arxiv "causal mediation"
# Find paper, get DOI
/research:doi 10.1080/00273171.2017.1354758
# BibTeX displayed, now add
/research:bib:add ~/Documents/references.bib
```

#### Troubleshooting

**Permission denied:**
- Check file permissions
- Verify directory exists
- Try absolute path

**Invalid BibTeX:**
- Validate entry before adding
- Check for missing required fields
- Ensure proper brace matching

**Duplicate cite key:**
- Choose to skip or rename
- Modify cite key manually
- Check if truly duplicate or variant

**File not found:**
- New files are created automatically
- Verify directory path exists
- Check for typos in filename

#### Configuration

**Environment variables:**
- `BIB_AUTO_FORMAT` - Auto-format after adding (default: true)
- `BIB_CHECK_DUPLICATES` - Enable duplicate checking (default: true)
- `BIB_BACKUP` - Create backup before modifying (default: true)

**Example setup:**
```bash
export BIB_AUTO_FORMAT=true
export BIB_BACKUP=true
```

#### Related Commands

- `/research:doi` - Get BibTeX from DOI
- `/research:arxiv` - Search for papers
- `/research:bib:search` - Search existing entries

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Added duplicate detection
- **v2.2.0** (2026-01) - Auto-formatting support
- **v2.5.0** (2026-01) - No changes

---

## Manuscript Writing

### `/research:manuscript:methods`

Write comprehensive methods section for statistical manuscripts.

#### Syntax

```bash
/research:manuscript:methods
/research:manuscript:methods <topic>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | String | ❌ No | Interactive | Method/analysis description |

#### Examples

```bash
# Interactive mode
/research:manuscript:methods

# With topic
/research:manuscript:methods "bootstrap mediation analysis"

# Specific method
/research:manuscript:methods "mixed effects model with mediation"
```

#### Output Format

```markdown
## Methods

### Study Design
[Description of design, sample, data collection]

### Statistical Model
[Model specification with equations]

### Estimation
[Estimation procedure, software, settings]

### Inference
[Hypothesis tests, confidence intervals, diagnostics]

### Software
[Software packages and versions]
```

#### Implementation Details

**Activated Skills:**
- `methods-paper-writer` (writing/methods-paper-writer.md)
- `methods-communicator` (writing/methods-communicator.md)
- `mathematical-foundations` (mathematical/mathematical-foundations.md)

**Process:**
1. Understand research question and method
2. Structure methods outline
3. Write each section with detail
4. Add mathematical notation
5. Include reproducibility information

**Sections generated:**
- **Data description:** Sample size, variables, measurement
- **Statistical model:** Equations, parameters, assumptions
- **Estimation:** Method, software, convergence criteria
- **Inference:** Tests, intervals, model comparison
- **Sensitivity:** Robustness checks, diagnostics

#### Follow-up Actions

1. **Add citations:** Use `/research:bib:search` for references
2. **Validate notation:** Ensure consistency
3. **Add software details:** Versions, packages
4. **Include equations:** Number for reference
5. **Check assumptions:** Explicitly state

#### Common Use Cases

**Mediation analysis:**
```bash
/research:manuscript:methods "bootstrap mediation with clustered data"
```

**Simulation study:**
```bash
/research:manuscript:methods "Monte Carlo comparison of estimators"
```

**Applied analysis:**
```bash
/research:manuscript:methods "multilevel mediation in longitudinal data"
```

#### Best Practices

**Mathematical Notation:**
- Define all symbols on first use
- Use consistent notation throughout
- Number important equations
- Reference equations in text

**Reproducibility:**
- Software versions: R 4.3.0, lavaan 0.6-17
- Random seeds if applicable
- Convergence criteria
- Computational environment

**Assumptions:**
- State all assumptions explicitly
- Justify why reasonable
- Describe diagnostic checks
- Note sensitivity analyses

#### Integration with Other Commands

```bash
# Complete manuscript workflow
/research:lit-gap "causal mediation"
/research:hypothesis "bootstrap vs delta method"
/research:simulation:design
# Run simulation
/research:simulation:analysis
/research:manuscript:methods
/research:manuscript:results
```

#### Troubleshooting

**Too generic:**
- Provide more specific method details
- Include data structure information
- Specify exact estimator/test used

**Missing mathematical detail:**
- Ask for equation specifications
- Request model formulation
- Add parameter definitions

**Unclear assumptions:**
- Explicitly list all assumptions
- Add justification for each
- Include diagnostic procedures

#### Configuration

No explicit configuration. Adapts to:
- Statistical method type
- Journal requirements
- Level of technical detail
- Target audience

#### Related Commands

- `/research:manuscript:results` - Write results section
- `/research:simulation:design` - Design supporting simulation
- `/research:bib:search` - Find method citations

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced skill activation
- **v2.5.0** (2026-01) - No changes

---

### `/research:manuscript:results`

Write results section with statistical findings.

#### Syntax

```bash
/research:manuscript:results
/research:manuscript:results <analysis-type>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `analysis-type` | String | ❌ No | Interactive | Type of analysis results |

#### Examples

```bash
# Interactive mode
/research:manuscript:results

# Specific analysis
/research:manuscript:results "mediation analysis"

# Multiple analyses
/research:manuscript:results "primary and sensitivity analyses"
```

#### Output Format

```markdown
## Results

### Descriptive Statistics
[Sample characteristics, missingness, distributions]

### Primary Analysis
[Main findings with estimates, SEs, p-values, CIs]

### Model Diagnostics
[Fit indices, residuals, assumption checks]

### Sensitivity Analyses
[Robustness checks, alternative specifications]

### Tables and Figures
[Reference to tables/figures with descriptions]
```

#### Implementation Details

**Activated Skills:**
- `methods-paper-writer` (writing/methods-paper-writer.md)
- `methods-communicator` (writing/methods-communicator.md)
- `computational-inference` (implementation/computational-inference.md)

**Process:**
1. Understand analysis performed
2. Structure results logically
3. Report estimates with uncertainty
4. Include diagnostic information
5. Interpret in context

**Components:**
- **Descriptive statistics:** Mean, SD, range, missingness
- **Parameter estimates:** Point estimates, SEs, CIs
- **Hypothesis tests:** Test statistics, p-values, decisions
- **Model fit:** Fit indices, diagnostics, comparisons
- **Interpretation:** Practical significance, context

#### Follow-up Actions

1. **Create tables:** Format for publication
2. **Generate figures:** Visualize key findings
3. **Add interpretation:** Explain practical meaning
4. **Cross-reference:** Link to methods section
5. **Check reporting:** APA/journal guidelines

#### Common Use Cases

**Mediation results:**
```bash
/research:manuscript:results "mediation with bootstrap CIs"
```

**Simulation results:**
```bash
/research:manuscript:results "Monte Carlo performance comparison"
```

**Applied analysis:**
```bash
/research:manuscript:results "multilevel regression with interactions"
```

#### Best Practices

**Statistical Reporting:**
- Always report effect sizes
- Include confidence intervals
- Report exact p-values (not just < .05)
- State statistical and practical significance

**Transparency:**
- Report all planned analyses
- Note exploratory analyses
- Disclose negative findings
- Include all relevant diagnostics

**Interpretation:**
- Connect to research question
- Provide context for magnitudes
- Acknowledge limitations
- Avoid causal language unless warranted

#### Integration with Other Commands

```bash
# Complete results workflow
/research:simulation:analysis
# Analyze simulation results
/research:manuscript:results
# Write up findings
/research:manuscript:reviewer
# Address reviewer questions about results
```

#### Troubleshooting

**Missing key statistics:**
- Verify all estimates reported
- Add confidence intervals
- Include sample sizes
- Report effect sizes

**Unclear interpretation:**
- Add context for magnitudes
- Explain practical significance
- Reference research question
- Avoid jargon

**Table/figure references:**
- Number all tables/figures
- Reference in text
- Provide descriptive captions
- Follow journal format

#### Configuration

Adapts to:
- Analysis type (descriptive, inferential, simulation)
- Journal requirements (APA, AMA, etc.)
- Target audience (methodologists vs. applied)
- Statistical framework (frequentist, Bayesian)

#### Related Commands

- `/research:manuscript:methods` - Write methods first
- `/research:simulation:analysis` - Analyze simulation data
- `/research:manuscript:reviewer` - Respond to results questions

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced interpretation guidance
- **v2.5.0** (2026-01) - No changes

---

### `/research:manuscript:reviewer`

Generate responses to peer reviewer comments.

#### Syntax

```bash
/research:manuscript:reviewer
/research:manuscript:reviewer <comment-text>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `comment-text` | String | ❌ No | Interactive | Reviewer comment to address |

#### Examples

```bash
# Interactive mode
/research:manuscript:reviewer

# Specific comment
/research:manuscript:reviewer "Please clarify the assumptions"

# Multiple comments
/research:manuscript:reviewer "Comments 1-3 from Reviewer 2"
```

#### Output Format

```markdown
## Response to Reviewers

### Reviewer 1, Comment 1

**Comment:**
[Original reviewer comment]

**Response:**
[Point-by-point response]

**Changes Made:**
[Specific manuscript changes]

**Location:**
[Page/line numbers in revised manuscript]

---

### Reviewer 1, Comment 2
[Same structure]
```

#### Implementation Details

**Activated Skills:**
- `methods-paper-writer` (writing/methods-paper-writer.md)
- `methods-communicator` (writing/methods-communicator.md)
- `publication-strategist` (writing/publication-strategist.md)

**Process:**
1. Understand reviewer concern
2. Acknowledge valid points
3. Provide clear response
4. Describe changes made
5. Add new analyses if needed

**Response types:**
- **Accept and revise:** Agree and make changes
- **Clarify:** Explain existing approach better
- **Provide evidence:** Add analysis/citation
- **Respectfully disagree:** Explain rationale with evidence

#### Follow-up Actions

1. **Make manuscript changes:** Implement revisions
2. **Add analyses:** If requested by reviewer
3. **Update references:** Add citations suggested
4. **Track changes:** Highlight changes in document
5. **Verify consistency:** Check response matches changes

#### Common Use Cases

**Clarification requests:**
```bash
/research:manuscript:reviewer "Please explain why bootstrap was chosen"
```

**Additional analyses:**
```bash
/research:manuscript:reviewer "Add sensitivity analysis for outliers"
```

**Methodological concerns:**
```bash
/research:manuscript:reviewer "Assumptions seem violated"
```

#### Best Practices

**Tone:**
- Professional and respectful
- Thank reviewers for comments
- Acknowledge valid concerns
- Explain disagreements tactfully

**Thoroughness:**
- Address every comment
- Number responses to match comments
- Be specific about changes
- Provide page/line numbers

**Transparency:**
- Admit limitations honestly
- Don't overstate changes
- Acknowledge when suggestions improve paper
- Explain decisions clearly

#### Integration with Other Commands

```bash
# Address reviewer requests
/research:manuscript:reviewer "Add sensitivity analysis"
# Design and run analysis
/research:simulation:design
/research:simulation:analysis
# Update results section
/research:manuscript:results
```

#### Troubleshooting

**Unclear comment:**
- Interpret most reasonable meaning
- Offer multiple possible responses
- Ask for clarification if possible

**Contradictory reviewers:**
- Acknowledge disagreement
- Explain middle-ground approach
- Defer to editor if necessary

**Major revisions:**
- Break into smaller tasks
- Prioritize critical issues
- Track all changes carefully
- Consider additional analyses

#### Configuration

Adapts to:
- Journal norms
- Review type (major/minor revision)
- Reviewer expertise level
- Manuscript type (methods/applied)

#### Related Commands

- `/research:manuscript:methods` - Update methods section
- `/research:manuscript:results` - Update results section
- `/research:simulation:analysis` - Add requested analyses

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced tone guidance
- **v2.5.0** (2026-01) - No changes

---

### `/research:manuscript:proof`

Review mathematical proofs for correctness and clarity.

#### Syntax

```bash
/research:manuscript:proof
/research:manuscript:proof <proof-description>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `proof-description` | String | ❌ No | Interactive | Description of theorem/proof |

#### Examples

```bash
# Interactive mode
/research:manuscript:proof

# Specific proof
/research:manuscript:proof "asymptotic normality of bootstrap estimator"

# Multiple proofs
/research:manuscript:proof "Theorems 1-3 in appendix"
```

#### Output Format

```markdown
## Proof Review

### Theorem Statement
[Clear statement of result to be proven]

### Proof Structure
[Outline of proof approach]

### Detailed Review
[Line-by-line analysis]

### Corrections Needed
[List of errors or unclear steps]

### Suggestions
[Improvements for clarity]
```

#### Implementation Details

**Activated Skills:**
- `proof-architect` (mathematical/proof-architect.md)
- `mathematical-foundations` (mathematical/mathematical-foundations.md)
- `asymptotic-theory` (mathematical/asymptotic-theory.md)

**Checks performed:**
- **Logical validity:** Each step follows from previous
- **Completeness:** All cases covered
- **Assumptions:** Clearly stated and used correctly
- **Notation:** Consistent and standard
- **Clarity:** Steps explained sufficiently

**Common issues detected:**
- Missing conditions in theorem statement
- Unjustified steps in proof
- Circular reasoning
- Notational inconsistencies
- Missing boundary cases

#### Follow-up Actions

1. **Revise proof:** Fix identified errors
2. **Add lemmas:** Break complex proofs
3. **Clarify steps:** Add explanatory text
4. **Verify assumptions:** Check necessity
5. **Simplify:** Remove unnecessary complexity

#### Common Use Cases

**Asymptotic theory:**
```bash
/research:manuscript:proof "consistency of indirect effect estimator"
```

**Identification:**
```bash
/research:manuscript:proof "parameter identifiability under mediation"
```

**Optimality:**
```bash
/research:manuscript:proof "efficiency of proposed estimator"
```

#### Best Practices

**Theorem Statements:**
- State all assumptions explicitly
- Define all notation used
- Be precise about conditions
- State result clearly

**Proof Structure:**
- Outline strategy first
- Break into logical steps
- Number important equations
- Reference lemmas/theorems

**Clarity:**
- Explain motivation for steps
- Define new notation immediately
- Highlight key insights
- Connect to broader result

#### Integration with Other Commands

```bash
# Proof development workflow
/research:hypothesis "bootstrap consistency"
# Develop proof
/research:manuscript:proof
# Write up in methods appendix
/research:manuscript:methods
```

#### Troubleshooting

**Circular reasoning:**
- Check proof doesn't assume conclusion
- Verify each step independently justified
- Identify which result comes first

**Missing conditions:**
- Check all variables defined
- Verify regularity conditions stated
- Ensure boundary cases covered

**Unclear steps:**
- Add intermediate equations
- Explain why step is valid
- Reference supporting results

#### Configuration

Adapts to:
- Proof complexity
- Mathematical subfield
- Target audience
- Journal standards

#### Related Commands

- `/research:manuscript:methods` - Methods with proofs
- `/research:hypothesis` - Generate formal hypotheses
- `/research:lit-gap` - Find proof gaps in literature

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced error detection
- **v2.5.0** (2026-01) - No changes

---

## Simulation Studies

### `/research:simulation:design`

Design Monte Carlo simulation study for statistical research.

#### Syntax

```bash
/research:simulation:design
/research:simulation:design <topic>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | String | ❌ No | Interactive | Research question or method |

#### Examples

```bash
# Interactive mode
/research:simulation:design

# Specific topic
/research:simulation:design "bootstrap mediation CI coverage"

# Method comparison
/research:simulation:design "compare robust estimators under contamination"
```

#### Output Format

```markdown
# Simulation Study Plan

## Research Question
[Clear statement of investigation]

## Methods Being Compared
1. Method 1: [Description]
2. Method 2: [Description]

## Data-Generating Conditions

### Fixed Parameters
- [Parameters held constant]

### Varied Factors
1. Sample size (n): [values]
2. Effect size (δ): [values]
3. [Other factors]

Total conditions: [factorial combination count]

## Performance Metrics
1. Bias: E(θ̂) - θ
2. RMSE: sqrt(bias² + variance)
3. Coverage: P(θ ∈ CI)
4. [Other metrics]

## Implementation Plan
- Software: [R/Python/Julia]
- Iterations: [number]
- Parallelization: [strategy]
- Estimated runtime: [time]

## Quality Checks
- Pilot study design
- Validation against known results
- Convergence diagnostics
```

#### Implementation Details

**Activated Skills:**
- `simulation-architect` (implementation/simulation-architect.md)
- `algorithm-designer` (implementation/algorithm-designer.md)
- `numerical-methods` (implementation/numerical-methods.md)

**Process:**
1. Clarify research question
2. Identify methods to compare
3. Design factorial conditions
4. Define performance metrics
5. Plan implementation

**Design dimensions:**
- Sample sizes (n)
- Effect sizes
- Distribution types
- Model complexity
- Violation scenarios
- Missing data patterns

#### Follow-up Actions

1. **Implement simulation:** Write R/Python code
2. **Run pilot:** Small-scale test
3. **Validate:** Check against known results
4. **Scale up:** Full simulation run
5. **Analyze:** Use `/research:simulation:analysis`

#### Common Use Cases

**Coverage probability:**
```bash
/research:simulation:design "bootstrap vs delta method CI coverage"
```

**Bias comparison:**
```bash
/research:simulation:design "compare bias of ML vs robust estimators"
```

**Power analysis:**
```bash
/research:simulation:design "power for mediation test under various conditions"
```

#### Best Practices

**Factorial Design:**
- Not too many factors (combinatorial explosion)
- Focus on theoretically interesting conditions
- Include realistic scenarios
- Balance breadth and depth

**Performance Metrics:**
- Choose metrics matching research question
- Include both bias and variance
- Consider computational cost
- Plan for diagnostic plots

**Iterations:**
- Pilot: 1,000-5,000 iterations
- Final: 10,000+ iterations
- More iterations for rare events
- Check Monte Carlo error

**Validation:**
- Test with known results first
- Check asymptotic properties
- Verify parameter recovery
- Compare to published simulations

#### Integration with Other Commands

```bash
# Complete simulation workflow
/research:hypothesis "bootstrap outperforms delta method"
/research:simulation:design
# Implement and run simulation
/research:simulation:analysis
/research:manuscript:methods
/research:manuscript:results
```

#### Troubleshooting

**Too many conditions:**
- Reduce number of levels per factor
- Focus on most interesting contrasts
- Run in phases
- Consider Latin hypercube sampling

**Computational constraints:**
- Reduce iterations for pilot
- Parallelize across cores
- Use high-performance computing
- Simplify data-generating process

**Unclear metrics:**
- Review research question
- Check literature for standard metrics
- Consider multiple metrics
- Plan for robustness checks

#### Configuration

Adapts to:
- Statistical method type
- Research question focus
- Computational resources
- Timeline constraints

#### Related Commands

- `/research:simulation:analysis` - Analyze results
- `/research:hypothesis` - Generate hypotheses to test
- `/research:manuscript:methods` - Document design

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced design templates
- **v2.5.0** (2026-01) - No changes

---

### `/research:simulation:analysis`

Analyze Monte Carlo simulation results and create summary tables/plots.

#### Syntax

```bash
/research:simulation:analysis
/research:simulation:analysis <results-file>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `results-file` | Path | ❌ No | Interactive | Path to simulation results file |

#### Examples

```bash
# Interactive mode
/research:simulation:analysis

# Specific results file
/research:simulation:analysis results.RData

# Full path
/research:simulation:analysis ~/projects/simulations/bootstrap-mediation/results.csv
```

#### Output Format

```markdown
# Simulation Analysis Results

## Performance Tables

### Table 1: Bias and RMSE
| Method | n   | Effect | Bias   | RMSE  |
|--------|-----|--------|--------|-------|
| Boot   | 100 | 0.3    | -0.002 | 0.051 |
| Delta  | 100 | 0.3    | 0.015  | 0.048 |

### Table 2: Coverage Probability
| Method | n   | Effect | Coverage | Width |
|--------|-----|--------|----------|-------|
| Boot   | 100 | 0.3    | 0.947    | 0.198 |
| Delta  | 100 | 0.3    | 0.922    | 0.187 |

## Figures
- figure1_bias.pdf
- figure2_coverage.pdf
- figure3_power.pdf

## Interpretation
[Narrative summary of findings]
```

#### Implementation Details

**Activated Skills:**
- `simulation-architect` (implementation/simulation-architect.md)
- `computational-inference` (implementation/computational-inference.md)
- `statistical-software-qa` (implementation/statistical-software-qa.md)

**Process:**
1. Load simulation results
2. Compute performance metrics
3. Create summary tables
4. Generate plots
5. Interpret findings

**Metrics computed:**
- **Bias:** `mean(estimates) - true_value`
- **Empirical SE:** `sd(estimates)`
- **RMSE:** `sqrt(mean((estimates - true_value)^2))`
- **Coverage:** `mean(ci_lower <= true_value & ci_upper >= true_value)`
- **Power:** `mean(p_values < alpha)` under alternative

**Monte Carlo error:**
- SE of coverage: `sqrt(p * (1-p) / R)` where R = iterations
- SE of bias: `sd(estimates) / sqrt(R)`
- Reported in tables

#### Follow-up Actions

1. **Create publication tables:** LaTeX format
2. **Generate figures:** Publication-quality plots
3. **Write interpretation:** Narrative summary
4. **Check convergence:** Diagnostic plots
5. **Report findings:** Use in manuscript

#### Common Use Cases

**Coverage evaluation:**
```bash
/research:simulation:analysis coverage-results.RData
# Evaluate CI coverage across conditions
```

**Bias comparison:**
```bash
/research:simulation:analysis bias-simulation.csv
# Compare bias of competing methods
```

**Power analysis:**
```bash
/research:simulation:analysis power-results.RData
# Evaluate power across effect sizes
```

#### Best Practices

**Quality Checks:**
- Verify all conditions present
- Check for missing data
- Identify convergence failures
- Flag outliers

**Visualization:**
- Use appropriate plot types
- Include confidence bands for MC error
- Facet by key factors
- Label axes clearly

**Reporting:**
- Always include Monte Carlo SE
- Report number of iterations
- Note any convergence issues
- Acknowledge MC uncertainty

**Tables:**
- Organize logically (methods × conditions)
- Round appropriately
- Include confidence intervals
- Note significance carefully

#### Integration with Other Commands

```bash
# Complete workflow
/research:simulation:design
# Implement and run
/research:simulation:analysis results.RData
/research:manuscript:results
# Write up findings
```

#### Troubleshooting

**Large MC error:**
- Increase iterations
- Check for high variance conditions
- Consider variance reduction
- Report uncertainty clearly

**Missing conditions:**
- Verify all design cells ran
- Check for crashes/timeouts
- Re-run failed conditions
- Note missing in report

**Unexpected results:**
- Validate against known results
- Check implementation
- Review data generation
- Consider edge cases

#### Configuration

Adapts to:
- Results file format (RData, CSV, JSON)
- Statistical framework
- Number of conditions
- Performance metrics of interest

#### Related Commands

- `/research:simulation:design` - Design the study
- `/research:manuscript:results` - Write up findings
- `/research:manuscript:methods` - Document approach

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced plotting
- **v2.5.0** (2026-01) - No changes

---

## Research Planning

### `/research:lit-gap`

Identify research gaps in statistical literature.

#### Syntax

```bash
/research:lit-gap <topic>
/research:lit-gap
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | String | ❌ No | Interactive | Research area to analyze |

#### Examples

```bash
# Specific topic
/research:lit-gap "causal mediation analysis"

# Broad area
/research:lit-gap "bootstrap inference"

# Interactive mode
/research:lit-gap
```

#### Output Format

```markdown
# Literature Gaps: [Topic]

## Summary
[1-2 sentence overview]

## Current State of Literature

### Well-Developed Areas
1. [Established methods and results]
2. [Settled questions]

### Active Research Areas
1. [Current work in progress]
2. [Recent developments]

## Identified Gaps

### Gap 1: [Title]
**Type:** Methodological / Applied / Theoretical / Computational

**Description:** [What's missing]

**Importance:** [Why it matters]

**Feasibility:** High / Medium / Low

**Potential Impact:** High / Medium / Low

**Possible Approaches:** [How to tackle]

## Promising Research Directions
[Combinations of gaps, novel contributions]

## Cross-Disciplinary Opportunities
[Connections to other fields]

## Recommended Next Steps
1. [Immediate action]
2. [Literature review focus]
```

#### Implementation Details

**Activated Skills:**
- `literature-gap-finder` (research/literature-gap-finder.md)
- `cross-disciplinary-ideation` (research/cross-disciplinary-ideation.md)
- `method-transfer-engine` (research/method-transfer-engine.md)

**Process:**
1. Understand research area
2. Review current literature (can use `/research:arxiv`)
3. Identify well-developed vs. unexplored areas
4. Categorize gaps by type
5. Evaluate feasibility and impact
6. Suggest research directions

**Gap types:**
- **Methodological:** New methods needed
- **Applied:** Underserved application domains
- **Theoretical:** Missing proofs/properties
- **Computational:** Algorithmic improvements needed

**Integration with literature search:**
```bash
# Can be combined with arXiv search
source "${CLAUDE_PLUGIN_ROOT}/lib/arxiv-api.sh"
arxiv_search "$TOPIC" 20
```

#### Follow-up Actions

1. **Literature review:** Deep dive into gap area
2. **Generate hypotheses:** Use `/research:hypothesis`
3. **Plan study:** Use `/research:analysis-plan`
4. **Collaborate:** Identify potential co-authors
5. **Write proposal:** Grant or dissertation proposal

#### Common Use Cases

**Dissertation planning:**
```bash
/research:lit-gap "mediation with time-varying confounding"
```

**Grant proposals:**
```bash
/research:lit-gap "robust causal inference methods"
```

**New project:**
```bash
/research:lit-gap "machine learning for causal discovery"
```

#### Best Practices

**Gap Evaluation:**
- **Impact:** Will it advance the field?
- **Feasibility:** Can it be done with current tools?
- **Novelty:** Truly unexplored or just incremental?
- **Fit:** Matches your expertise and interests?

**Search Strategies:**
- Recent reviews ("future research" sections)
- Limitation sections in papers
- Unanswered questions in discussions
- Computational complaints
- Failed approaches

**Cross-Disciplinary:**
- Look for method transfer opportunities
- Check related statistical areas
- Explore domain-specific variations
- Consider machine learning connections

#### Integration with Other Commands

```bash
# Complete research planning workflow
/research:lit-gap "bootstrap mediation"
# Identify gaps
/research:hypothesis
# Generate hypotheses from gaps
/research:analysis-plan
# Plan study to fill gap
/research:simulation:design
# Design validation study
```

#### Troubleshooting

**Too broad:**
- Narrow to specific method
- Focus on one application domain
- Limit to methodological type
- Choose one statistical framework

**No gaps found:**
- Area may be mature
- Try related/adjacent areas
- Look for application extensions
- Consider computational improvements

**Gaps too ambitious:**
- Break into smaller sub-gaps
- Focus on feasible portion
- Collaborate with experts
- Start with theoretical foundation

#### Configuration

Adapts to:
- Research area maturity
- Statistical subfield
- Methodological vs. applied focus
- Interdisciplinary connections

#### Related Commands

- `/research:arxiv` - Search recent literature
- `/research:hypothesis` - Generate hypotheses
- `/research:method-scout` - Find related methods

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced gap categorization
- **v2.5.0** (2026-01) - No changes

---

### `/research:hypothesis`

Generate testable statistical research hypotheses.

#### Syntax

```bash
/research:hypothesis <topic>
/research:hypothesis
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | String | ❌ No | Interactive | Research area or question |

#### Examples

```bash
# Specific topic
/research:hypothesis "bootstrap mediation intervals"

# Method comparison
/research:hypothesis "robust estimation under contamination"

# Interactive mode
/research:hypothesis
```

#### Output Format

```markdown
# Research Hypotheses: [Topic]

## Background
[Brief context]

## Primary Hypothesis

**Statement:**
H₁: Under [conditions], [estimator/method] will [property]

**Notation:**
- θ: [parameter]
- θ̂: [estimator]
- [other symbols]

**Conditions:**
1. [Regularity condition 1]
2. [Regularity condition 2]

**Rationale:**
[Why you expect this]

**Implications:**
[What it means if true]

## Secondary Hypotheses

### H₁a: [Related hypothesis]
[Same structure]

### H₁b: [Boundary condition]
[Same structure]

## Testing Strategy
[How to test - simulation, theory, application]

## Next Steps
1. [Immediate action]
2. [Follow-up]
```

#### Implementation Details

**Activated Skills:**
- `mathematical-foundations` (mathematical/mathematical-foundations.md)
- `asymptotic-theory` (mathematical/asymptotic-theory.md)
- `cross-disciplinary-ideation` (research/cross-disciplinary-ideation.md)

**Process:**
1. Understand research question
2. Formulate primary hypothesis
3. Define notation precisely
4. State conditions explicitly
5. Generate secondary hypotheses
6. Plan testing approach

**Hypothesis types:**
1. **Theoretical properties:** Consistency, asymptotic normality, efficiency
2. **Comparative:** Method A vs. Method B performance
3. **Generalization:** Property extends to weaker conditions
4. **Computational:** Algorithm improvements

#### Follow-up Actions

1. **Test hypotheses:** Design simulation or theoretical proof
2. **Formalize:** Convert to mathematical statements
3. **Literature:** Search for related work
4. **Plan study:** Design validation study
5. **Pre-register:** If empirical study

#### Common Use Cases

**Theoretical properties:**
```bash
/research:hypothesis "bootstrap consistency for mediation"
```

**Method comparison:**
```bash
/research:hypothesis "bootstrap vs delta method coverage"
```

**Generalization:**
```bash
/research:hypothesis "extend to discrete mediators"
```

#### Best Practices

**Hypothesis Quality:**
- **Clear and Precise:** All terms defined, no ambiguity
- **Testable:** Can design study to test it
- **Novel:** Not already proven or trivial
- **Motivated:** Clear rationale and importance

**Multiple Hypotheses:**
- Primary hypothesis (main claim)
- Secondary hypotheses (supporting)
- Boundary conditions (when it fails)
- Mechanism hypotheses (why it works)

**Formalization:**
- Mathematical notation for precision
- Explicit conditions
- Quantifiable predictions
- Falsifiable claims

#### Integration with Other Commands

```bash
# Research development workflow
/research:lit-gap "mediation analysis"
/research:hypothesis "bootstrap improvements"
/research:simulation:design
# Test hypotheses via simulation
/research:manuscript:methods
# Write up with hypotheses
```

#### Troubleshooting

**Too vague:**
- Add mathematical formulation
- Specify conditions explicitly
- Define success criteria
- Make quantitative

**Not testable:**
- Identify observable quantities
- Design falsification approach
- Specify data requirements
- Consider alternative designs

**Not novel:**
- Search literature more carefully
- Extend to new conditions
- Apply to different domain
- Combine with other methods

#### Configuration

Adapts to:
- Hypothesis type (theoretical/empirical)
- Statistical framework
- Research maturity
- Testing approach available

#### Related Commands

- `/research:lit-gap` - Generate from gaps
- `/research:simulation:design` - Test hypotheses
- `/research:analysis-plan` - Plan empirical testing

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Enhanced formalization
- **v2.5.0** (2026-01) - No changes

---

### `/research:analysis-plan`

Create comprehensive statistical analysis plan.

#### Syntax

```bash
/research:analysis-plan
/research:analysis-plan <study-description>
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `study-description` | String | ❌ No | Interactive | Brief study description |

#### Examples

```bash
# Interactive mode
/research:analysis-plan

# Specific study
/research:analysis-plan "mediation in longitudinal RCT"

# Observational study
/research:analysis-plan "causal inference with confounding"
```

#### Output Format

```markdown
# Statistical Analysis Plan

## Study Overview
[Brief description of study and goals]

## Research Questions
1. Primary: [Main question]
2. Secondary: [Supporting questions]

## Data Description
- Sample size: [n]
- Design: [Cross-sectional, longitudinal, experimental]
- Variables: [List with types]
- Missing data: [Expected patterns]

## Statistical Methods

### Primary Analysis
- Method: [e.g., regression, SEM, mixed models]
- Model specification: [Equations]
- Estimation: [ML, Bayesian, etc.]
- Software: [R packages, versions]

### Secondary Analyses
- [Additional analyses]

### Sensitivity Analyses
1. [Robustness check 1]
2. [Robustness check 2]

## Sample Size Justification
[Power analysis or other rationale]

## Inference Approach
- Confidence intervals: [Method, level]
- Hypothesis tests: [Tests, α level]
- Multiple testing: [Adjustment if needed]

## Assumptions and Diagnostics
- Assumptions: [List]
- Diagnostics: [How to check]
- Violations: [Contingency plans]

## Analysis Workflow
1. [Data preparation]
2. [Descriptive statistics]
3. [Primary analysis]
4. [Sensitivity analyses]
5. [Reporting]

## Pre-Registration
[If applicable, what will be pre-registered]
```

#### Implementation Details

**Activated Skills:**
- `simulation-architect` (implementation/simulation-architect.md)
- `methods-paper-writer` (writing/methods-paper-writer.md)
- `sensitivity-analyst` (research/sensitivity-analyst.md)

**Process:**
1. Understand research questions
2. Specify data structure
3. Choose appropriate methods
4. Plan sensitivity analyses
5. Determine sample size needs
6. Define success criteria

**Components:**
- **Research questions:** Primary and secondary
- **Methods:** Statistical approach with justification
- **Sample size:** Power analysis or rationale
- **Assumptions:** Explicit listing
- **Diagnostics:** How to check assumptions
- **Sensitivity:** Robustness checks
- **Software:** Specific packages and versions

#### Follow-up Actions

1. **Pre-register:** Submit to OSF or registry
2. **Implement:** Write analysis code
3. **Pilot:** Test with simulated/pilot data
4. **Execute:** Run planned analyses
5. **Report:** Follow plan in manuscript

#### Common Use Cases

**RCT analysis:**
```bash
/research:analysis-plan "mediation in randomized trial"
```

**Observational study:**
```bash
/research:analysis-plan "propensity score matching for causal effect"
```

**Methodological study:**
```bash
/research:analysis-plan "compare bootstrap methods via simulation"
```

#### Best Practices

**Specificity:**
- Exact models to be fitted
- Precise hypothesis tests
- Specific software packages
- Explicit decision rules

**Transparency:**
- Exploratory vs. confirmatory
- Multiple testing adjustments
- Handling of missing data
- Outlier treatment

**Flexibility:**
- Pre-specify sensitivity analyses
- Note assumptions to check
- Plan for violations
- Allow for unexpected patterns

**Pre-Registration:**
- Complete before data access
- Include all planned analyses
- Specify stopping rules
- Note exploratory analyses separately

#### Integration with Other Commands

```bash
# Complete study planning
/research:lit-gap "mediation methods"
/research:hypothesis "bootstrap vs delta method"
/research:analysis-plan
# Create detailed plan
/research:simulation:design
# Validate with simulation first
```

#### Troubleshooting

**Too many analyses:**
- Focus on primary question
- Distinguish primary vs. exploratory
- Use multiple testing correction
- Consider sequential testing

**Unclear methods:**
- Specify model equations explicitly
- Name exact estimation procedure
- List software packages
- Reference methodology papers

**Sample size uncertain:**
- Conduct pilot study
- Use simulation for power
- Plan adaptive design
- Report post-hoc power

#### Configuration

Adapts to:
- Study design type
- Research question complexity
- Pre-registration requirements
- Journal guidelines

#### Related Commands

- `/research:hypothesis` - Generate hypotheses first
- `/research:simulation:design` - Validate plan
- `/research:manuscript:methods` - Document plan

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Added pre-registration section
- **v2.5.0** (2026-01) - No changes

---

### `/research:method-scout`

Find statistical methods suitable for research problem.

#### Syntax

```bash
/research:method-scout <problem>
/research:method-scout
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `problem` | String | ❌ No | Interactive | Research problem or question |

#### Examples

```bash
# Specific problem
/research:method-scout "mediation with clustered data"

# General area
/research:method-scout "causal inference with confounding"

# Interactive mode
/research:method-scout
```

#### Output Format

```markdown
# Statistical Methods for: [Problem]

## Problem Summary
[Restatement of research problem]

## Recommended Methods

### Method 1: [Name]
**Category:** [Regression, SEM, Bayesian, ML, etc.]

**Description:**
[Brief explanation of method]

**Strengths:**
- [Pro 1]
- [Pro 2]

**Limitations:**
- [Con 1]
- [Con 2]

**When to Use:**
[Specific scenarios where this method excels]

**Key References:**
- [Citation 1]
- [Citation 2]

**Software:**
- R: [package names]
- Python: [package names]

---

### Method 2: [Name]
[Same structure]

## Method Comparison

| Method | Assumptions | Complexity | Software | Best For |
|--------|-------------|------------|----------|----------|
| Method 1 | [List] | Low/Med/High | [Packages] | [Use case] |
| Method 2 | [List] | Low/Med/High | [Packages] | [Use case] |

## Recommended Approach
[Which method(s) to try first and why]

## Learning Resources
- Tutorials
- Textbooks
- Online courses
- Example analyses
```

#### Implementation Details

**Activated Skills:**
- `method-transfer-engine` (research/method-transfer-engine.md)
- `cross-disciplinary-ideation` (research/cross-disciplinary-ideation.md)
- `literature-gap-finder` (research/literature-gap-finder.md)

**Process:**
1. Understand research problem
2. Identify data structure and goals
3. Match problem to method families
4. Evaluate method appropriateness
5. Recommend specific approaches
6. Provide implementation guidance

**Method categories considered:**
- Regression-based (linear, logistic, etc.)
- Structural equation modeling
- Bayesian methods
- Machine learning approaches
- Causal inference methods
- Robust/nonparametric methods

#### Follow-up Actions

1. **Literature review:** Read key references
2. **Learn method:** Study tutorials/textbooks
3. **Try example:** Replicate published analysis
4. **Simulate:** Test method with simulated data
5. **Apply:** Use on real data

#### Common Use Cases

**Data structure problem:**
```bash
/research:method-scout "mediation with time-varying treatment"
```

**Assumption violations:**
```bash
/research:method-scout "robust inference under non-normality"
```

**New application:**
```bash
/research:method-scout "causal mediation in network data"
```

#### Best Practices

**Method Selection:**
- Match to research question
- Consider data structure
- Evaluate assumptions
- Check software availability
- Consider interpretability

**Comparison:**
- Try multiple methods if uncertain
- Use simulation to compare
- Check sensitivity to assumptions
- Consider computational cost

**Learning:**
- Start with tutorials
- Replicate published examples
- Validate with simulated data
- Consult methodological experts

#### Integration with Other Commands

```bash
# Method discovery workflow
/research:method-scout "mediation with confounding"
# Learn about recommended methods
/research:hypothesis "compare recommended methods"
/research:simulation:design
# Compare methods via simulation
```

#### Troubleshooting

**Too many options:**
- Focus on most common methods
- Start with simpler approaches
- Consider practical constraints
- Consult domain experts

**No perfect method:**
- Methods often have tradeoffs
- Try multiple approaches
- Report sensitivity
- Acknowledge limitations

**Unfamiliar methods:**
- Start with literature review
- Find tutorial papers
- Look for example code
- Consider collaboration

#### Configuration

Adapts to:
- Problem complexity
- Data structure
- Researcher expertise level
- Software preferences (R/Python)

#### Related Commands

- `/research:lit-gap` - Find methodological gaps
- `/research:hypothesis` - Generate method hypotheses
- `/research:analysis-plan` - Plan method application

#### Version History

- **v1.0.0** (2025-12) - Initial release
- **v2.0.0** (2026-01) - Expanded method database
- **v2.5.0** (2026-01) - No changes

---

## Command Chaining & Workflows

### Complete Research Project Workflow

```bash
# 1. Literature review and gap identification
/research:arxiv "causal mediation"
/research:lit-gap "causal mediation analysis"

# 2. Method discovery and hypothesis generation
/research:method-scout "mediation with time-varying confounding"
/research:hypothesis "bootstrap vs delta method for indirect effects"

# 3. Study design and planning
/research:simulation:design "compare bootstrap and delta method coverage"
/research:analysis-plan

# 4. Implementation (external: write R/Python code)

# 5. Analysis and interpretation
/research:simulation:analysis results.RData

# 6. Manuscript writing
/research:manuscript:methods
/research:manuscript:results

# 7. Peer review response
/research:manuscript:reviewer

# 8. Bibliography management throughout
/research:bib:search "mediation"
/research:doi 10.1037/met0000310
/research:bib:add references.bib
```

### Literature Review Workflow

```bash
# Search and collect papers
/research:arxiv "bootstrap mediation" 20

# Look up specific citations
/research:doi 10.1080/00273171.2014.962683

# Check existing bibliography
/research:bib:search "bootstrap"

# Add new references
/research:bib:add ~/Documents/references.bib

# Identify gaps
/research:lit-gap "bootstrap inference for mediation"
```

### Method Development Workflow

```bash
# Identify problem and gap
/research:lit-gap "robust mediation analysis"

# Scout existing methods
/research:method-scout "mediation with outliers"

# Generate hypotheses
/research:hypothesis "robust bootstrap vs standard bootstrap"

# Design validation study
/research:simulation:design

# Analyze results (after implementation)
/research:simulation:analysis

# Write manuscript
/research:manuscript:methods
/research:manuscript:results
```

### Manuscript Writing Workflow

```bash
# Write methods section
/research:manuscript:methods "bootstrap mediation with clustered data"

# Write results section
/research:manuscript:results "simulation and empirical results"

# Review mathematical proofs
/research:manuscript:proof "bootstrap consistency theorem"

# Manage citations throughout
/research:bib:search "relevant keywords"
/research:doi "DOI from references"
/research:bib:add references.bib

# Respond to reviewers
/research:manuscript:reviewer "reviewer comments"
```

---

## Integration with Flow-CLI

Scholar research commands integrate seamlessly with flow-cli for ADHD-friendly academic workflows.

### Flow-CLI Commands

```bash
# Start research session
work research-project

# Quick research commands
rst                    # Research dashboard
rms                    # Open manuscript
rsim [MODE]           # Run simulation
rlit [QUERY]          # Literature search (uses /research:arxiv)

# Build and preview
pb                    # Build manuscript (Quarto/LaTeX)
pv                    # Preview output

# Finish session
finish "completed simulation analysis"
```

### Integration Examples

**Literature search via flow-cli:**
```bash
# flow-cli wraps Scholar command
rlit "bootstrap mediation"
# Executes: /research:arxiv "bootstrap mediation"
```

**Simulation workflow:**
```bash
# Design simulation using Scholar
/research:simulation:design "bootstrap coverage study"

# Run simulation via flow-cli
rsim run

# Analyze using Scholar
/research:simulation:analysis results/bootstrap-sim.RData

# Build manuscript
pb
```

**Manuscript workflow:**
```bash
# Open manuscript in editor
rms

# Write methods section
/research:manuscript:methods

# Build and preview
pb && pv
```

### .STATUS File Integration

Research projects use `.STATUS` files tracked by flow-cli:

```yaml
status: Active
progress: 60
next: Run final simulation with n=1000
target: Journal of Statistical Software
```

Scholar commands automatically update `.STATUS` after major milestones.

---

## Configuration Options

Scholar research commands require minimal configuration. Most use shell API wrappers with sensible defaults.

### Environment Variables

```bash
# arXiv API
export ARXIV_API_BASE="http://export.arxiv.org/api/query"
export ARXIV_TIMEOUT=30

# Crossref API
export CROSSREF_EMAIL="your.email@university.edu"  # Polite pool access
export CROSSREF_PLUS_TOKEN="optional-premium-token"

# BibTeX utilities
export BIB_SEARCH_PATHS="$HOME/Zotero/bibtex:$HOME/Documents/references"
export BIB_DEFAULT_FILE="$HOME/Documents/main-references.bib"
export BIB_AUTO_FORMAT=true
export BIB_BACKUP=true

# Claude API (for manuscript commands)
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Shell API Wrappers

Located in `${CLAUDE_PLUGIN_ROOT}/lib/`:

**arxiv-api.sh:**
- `arxiv_search(query, limit)`
- `arxiv_get_details(arxiv_id)`
- `arxiv_download_pdf(arxiv_id, path)`

**crossref-api.sh:**
- `crossref_lookup_doi(doi)`
- `crossref_get_bibtex(doi)`
- `crossref_citation_count(doi)`
- `crossref_search(query, limit)`

**bibtex-utils.sh:**
- `bib_search(query, [file])`
- `bib_add_entry(bibtex, file)`
- `bib_get_entry(cite_key, [file])`
- `bib_format_entry(cite_key)`
- `bib_validate_entry(bibtex)`

### Plugin Root

All commands use `${CLAUDE_PLUGIN_ROOT}` variable:
- Homebrew: `/opt/homebrew/opt/scholar/libexec`
- Manual install: `~/.claude/plugins/scholar`

### No Configuration Needed

These commands work without any setup:
- `/research:manuscript:methods`
- `/research:manuscript:results`
- `/research:manuscript:reviewer`
- `/research:manuscript:proof`
- `/research:simulation:design`
- `/research:lit-gap`
- `/research:hypothesis`
- `/research:analysis-plan`
- `/research:method-scout`

---

## Error Messages & Solutions

### Common Errors

#### arXiv API Errors

**Error:** `arXiv API timeout`
**Solution:**
- Reduce limit parameter
- Wait 30 seconds and retry
- Check internet connection
- Verify arXiv is accessible

**Error:** `No results found`
**Solution:**
- Try broader search terms
- Check spelling
- Use fewer keywords
- Try author names only

#### Crossref/DOI Errors

**Error:** `DOI not found`
**Solution:**
- Verify DOI is correct
- Check DOI format (should start with "10.")
- Try without URL prefix
- Paper may not be indexed yet

**Error:** `Invalid DOI format`
**Solution:**
- Ensure DOI starts with "10."
- Remove whitespace
- Remove URL portion
- Check for typos

#### BibTeX Errors

**Error:** `No .bib files found`
**Solution:**
- Specify explicit file path
- Check `BIB_SEARCH_PATHS` variable
- Verify files have `.bib` extension
- Create new file with `/research:bib:add`

**Error:** `Malformed BibTeX entry`
**Solution:**
- Validate BibTeX syntax
- Check brace matching
- Ensure required fields present
- Re-export from reference manager

**Error:** `Duplicate cite key`
**Solution:**
- Choose to skip or rename
- Modify cite key manually
- Check if truly duplicate

#### Claude API Errors (Manuscript Commands)

**Error:** `ANTHROPIC_API_KEY not set`
**Solution:**
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Error:** `API rate limit exceeded`
**Solution:**
- Wait 60 seconds
- Reduce request frequency
- Check API quota

**Error:** `API timeout`
**Solution:**
- Retry request
- Check internet connection
- Reduce complexity of request

### Debugging

**Enable debug output:**
```bash
# For shell scripts
set -x
source "${CLAUDE_PLUGIN_ROOT}/lib/arxiv-api.sh"
arxiv_search "test query" 5

# Check plugin root
echo $CLAUDE_PLUGIN_ROOT
ls -la $CLAUDE_PLUGIN_ROOT/lib/

# Test API wrappers directly
bash $CLAUDE_PLUGIN_ROOT/lib/arxiv-api.sh
```

**Common debugging checks:**
1. Verify plugin installed: `ls ~/.claude/plugins/scholar`
2. Check environment variables: `env | grep -E '(ARXIV|CROSSREF|BIB)'`
3. Test internet: `ping arxiv.org`
4. Verify API key: `echo $ANTHROPIC_API_KEY`
5. Check permissions: `ls -la ~/.claude/plugins/scholar/lib/`

---

## Performance Tips

### Literature Search Optimization

**Reduce API calls:**
```bash
# Instead of multiple small searches
/research:arxiv "mediation" 5
/research:arxiv "bootstrap" 5

# Do one larger search
/research:arxiv "mediation bootstrap" 10
```

**Cache results:**
- Save arXiv results to file
- Build local bibliography first with `/research:bib:search`
- Use DOI lookup only when needed

### BibTeX Management

**Organize files:**
```bash
# Use topic-specific .bib files
~/Documents/references/
  ├── mediation.bib
  ├── bootstrap.bib
  └── causal-inference.bib

# Specify file for faster search
/research:bib:search "MacKinnon" ~/Documents/references/mediation.bib
```

**Optimize search paths:**
```bash
# Set most common location first
export BIB_SEARCH_PATHS="$HOME/Documents/references:$HOME/Zotero/bibtex"
```

### Manuscript Writing

**Batch processing:**
```bash
# Write all sections in one session
/research:manuscript:methods
# Write methods
/research:manuscript:results
# Write results
/research:manuscript:proof
# Review proofs
```

**Reuse outputs:**
- Save generated text to files
- Iterate on sections incrementally
- Use version control for manuscripts

### Simulation Studies

**Pilot first:**
```bash
# Design full study
/research:simulation:design "coverage comparison"

# But run pilot first (fewer iterations, fewer conditions)
# Then scale up after validation

# Analyze pilot
/research:simulation:analysis pilot-results.RData

# Analyze full study
/research:simulation:analysis full-results.RData
```

**Parallelize:**
- Use parallel computing for simulations
- Run independent conditions separately
- Combine results before analysis

---

## Version History

### By Command Category

#### Literature Management Commands

**v1.0.0** (2025-12-15) - Statistical Research Plugin
- Initial release of 4 literature commands
- arXiv, DOI, BibTeX search, BibTeX add
- Shell API wrapper architecture

**v2.0.0** (2026-01-15) - Scholar Plugin Migration
- Migrated from statistical-research to scholar
- Improved error handling
- Added duplicate detection for BibTeX

**v2.1.0** (2026-01-20)
- Regex support in BibTeX search
- Enhanced search locations

**v2.5.0** (2026-01-29)
- No changes (focus on teaching commands)

#### Manuscript Writing Commands

**v1.0.0** (2025-12-15)
- Initial release of 4 manuscript commands
- Methods, results, reviewer, proof commands
- Skill activation framework

**v2.0.0** (2026-01-15)
- Enhanced interpretation guidance (results)
- Improved tone guidance (reviewer)
- Better error detection (proof)

**v2.5.0** (2026-01-29)
- No changes

#### Simulation Study Commands

**v1.0.0** (2025-12-15)
- Initial release of 2 simulation commands
- Design and analysis commands
- Template-based design generation

**v2.0.0** (2026-01-15)
- Enhanced design templates
- Improved plotting capabilities (analysis)

**v2.5.0** (2026-01-29)
- No changes

#### Research Planning Commands

**v1.0.0** (2025-12-15)
- Initial release of 4 planning commands
- Lit-gap, hypothesis, analysis-plan, method-scout
- Cross-disciplinary skill integration

**v2.0.0** (2026-01-15)
- Enhanced gap categorization (lit-gap)
- Improved formalization (hypothesis)
- Added pre-registration section (analysis-plan)
- Expanded method database (method-scout)

**v2.5.0** (2026-01-29)
- No changes (focus on teaching commands)

### Major Milestones

- **v1.0.0** (2025-12-15): Initial 14 research commands in statistical-research plugin
- **v2.0.0** (2026-01-15): Migration to scholar plugin, unified architecture
- **v2.5.0** (2026-01-29): Teaching commands production-ready, research commands stable

---

## Related Documentation

- [FAQ-research.md](FAQ-research.md) - Frequently asked questions
- [TROUBLESHOOTING-research.md](TROUBLESHOOTING-research.md) - Detailed troubleshooting
- [Research Workflows](../workflows/research/flow-integration.md) - Complete workflow examples
- [API-REFERENCE.md](../API-REFERENCE.md) - Technical API documentation
- [Skills Reference](../skills.md) - Research skills documentation

---

**Last Updated:** 2026-02-01
**Plugin Version:** 2.5.1
**Maintained By:** Scholar Development Team
