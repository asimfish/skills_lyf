# Tutorial: Your First Literature Search

**Target Audience:** Researchers new to Scholar's literature tools
**Time:** 15 minutes
**Difficulty:** Beginner

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Search arXiv for recent papers in your field
- Look up specific papers by DOI
- Build a bibliography with BibTeX entries
- Organize citations systematically
- Export references to your reference manager
- Chain commands for efficient workflows

## Prerequisites

Before starting, make sure you have:

- [ ] Scholar installed (`brew install data-wise/tap/scholar`)
- [ ] Claude Code running
- [ ] Internet connection
- [ ] A research topic in mind
- [ ] (Optional) A `.bib` file for your bibliography

**Installation Check:**

```bash
scholar --version
# Should show: scholar v2.6.0 or later
```

---

## Step 1: Search arXiv for Recent Papers ⏱️ 3 minutes

### What You'll Do

Use `/research:arxiv` to search the arXiv statistics repository for papers on your topic. This returns titles, authors, abstracts, PDF links, and DOIs.

### Example Command

```bash
# Basic search for your topic
/research:arxiv "causal mediation analysis"

# More targeted searches
/research:arxiv "bootstrap confidence intervals" --recent
/research:arxiv "Monte Carlo simulation" --max 10
/research:arxiv "missing data imputation" --since 2023
```

### Try It Now

Pick a topic you're researching and run your first search:

```bash
/research:arxiv "YOUR TOPIC HERE"
```

### Expected Output

You should see formatted results like:

```
Found 8 papers on arXiv matching "causal mediation analysis":

1. **Causal Mediation Analysis with Multiple Mediators**
   Authors: Smith, J., Johnson, A., Lee, K.
   Date: 2024-01-15
   arXiv: 2401.12345

   Abstract: We propose a novel approach to causal mediation analysis
   when multiple mediators are present. The method uses semiparametric
   efficient estimation with cross-fitting...

   PDF: https://arxiv.org/pdf/2401.12345.pdf
   DOI: 10.48550/arXiv.2401.12345

2. **Bootstrap Inference for Indirect Effects**
   Authors: Chen, M., Rodriguez, P.
   Date: 2023-11-20
   arXiv: 2311.54321
   ...
```

### ✅ Checkpoint 1

- [ ] You see a list of papers with titles and authors
- [ ] Each paper has an abstract
- [ ] PDF and DOI links are provided
- [ ] Papers are relevant to your search term

**Troubleshooting:**

- **"No results found"**: Try a broader search term or remove date filters
- **Connection error**: Check internet with `ping arxiv.org`
- **Results not relevant**: Use more specific statistical terms

### What to Do Next

1. Read through the abstracts
2. Note 2-3 papers that look most relevant
3. Copy their DOIs for the next step

---

## Step 2: Look Up Papers by DOI ⏱️ 2 minutes

### What You'll Do

When you find a relevant paper, use `/research:doi` to get its complete citation information and ready-to-use BibTeX entry.

### Example Command

```bash
# Look up a journal article
/research:doi "10.1080/01621459.2020.1765785"

# Look up an arXiv preprint from Step 1
/research:doi "10.48550/arXiv.2401.12345"
```

### Try It Now

Pick a DOI from your arXiv search results:

```bash
/research:doi "DOI FROM STEP 1"
```

### Expected Output

```
Title: Causal Mediation Analysis After Controlling for Time-Varying Confounding
Authors: Imai, K., Keele, L., Tingley, D., Yamamoto, T.
Journal: Journal of the American Statistical Association
Volume: 116, Issue: 534
Pages: 652-665
Year: 2021
DOI: 10.1080/01621459.2020.1765785

Abstract: Estimating causal mediation effects is central to many scientific
investigations. This article develops a new class of causal mediation estimators
that account for time-varying confounding using sequential ignorability...

BibTeX Entry:
---
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
---
```

### ✅ Checkpoint 2

- [ ] Complete BibTeX entry is displayed
- [ ] All fields are properly formatted
- [ ] Citation key is meaningful (e.g., `imai2021causal`)
- [ ] DOI is included in the entry

**Troubleshooting:**

- **"DOI not found"**: Verify format is `10.XXXX/...` without URL
- **Incomplete entry**: Some preprints have limited metadata - this is normal
- **Wrong paper**: Double-check DOI against original source

### What to Do Next

1. Copy the entire BibTeX entry (between the `---` markers)
2. Save it to a temporary file for Step 4
3. Repeat for 1-2 more papers from Step 1

---

## Step 3: Build Your Bibliography ⏱️ 5 minutes

### What You'll Do

Before adding new papers, search your existing bibliography to avoid duplicates and find related references.

### Example Commands

```bash
# Search by author last name
/research:bib:search "Pearl" ~/Documents/research/references.bib

# Search by keyword
/research:bib:search "mediation" ~/Documents/research/references.bib

# Search by year
/research:bib:search "2020" references.bib

# Search multiple files
/research:bib:search "bootstrap" ~/Documents/**/*.bib
```

### Try It Now

If you have an existing `.bib` file:

```bash
/research:bib:search "YOUR TOPIC" /path/to/your/references.bib
```

If you don't have a bibliography yet, create one:

```bash
# Create a new bibliography file
touch ~/Documents/research/references.bib
```

### Expected Output

```
Found 3 matching entries in references.bib:

Entry 1: pearl2009causality
---
@book{pearl2009causality,
  title={Causality: Models, Reasoning and Inference},
  author={Pearl, Judea},
  year={2009},
  edition={2nd},
  publisher={Cambridge University Press}
}
---

Entry 2: pearl2014external
---
@article{pearl2014external,
  title={External Validity: From Do-Calculus to Transportability Across Populations},
  author={Pearl, Judea and Bareinboim, Elias},
  journal={Statistical Science},
  volume={29},
  number={4},
  pages={579--595},
  year={2014}
}
---

Total: 2 entries found
```

### ✅ Checkpoint 3

- [ ] Search returns existing entries (if any)
- [ ] Entries are properly formatted BibTeX
- [ ] You know what papers are already in your bibliography
- [ ] File path is correct and accessible

**Troubleshooting:**

- **"File not found"**: Use absolute paths (`~/Documents/...`)
- **"No matches"**: This is fine if you're starting fresh
- **Permission denied**: Check file permissions with `ls -la`

### Adding New Papers

Now add the BibTeX entries from Step 2:

```bash
# Save a BibTeX entry to temporary file
cat > /tmp/new-paper.bib << 'EOF'
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
EOF

# Add to your bibliography
/research:bib:add /tmp/new-paper.bib ~/Documents/research/references.bib
```

### Expected Output

```
Adding BibTeX entry to references.bib...

Entry: imai2021causal
Title: Causal Mediation Analysis After Controlling for Time-Varying Confounding
Authors: Imai, Kosuke and Keele, Luke and Tingley, Dustin and Yamamoto, Teppei

Checking for duplicates...
No duplicates found.

✓ Successfully added 1 entry to references.bib

Bibliography now contains 47 entries.
```

### ✅ Checkpoint 4

- [ ] Entry was added successfully
- [ ] No duplicate errors
- [ ] Bibliography count increased
- [ ] File is still valid BibTeX format

**Verification:**

```bash
# Check the file was updated
tail -20 ~/Documents/research/references.bib
```

---

## Step 4: Organize Your Citations ⏱️ 3 minutes

### What You'll Do

Organize your new papers by topic, verify all citations are complete, and prepare for use in your manuscript.

### Organizing Strategies

**Strategy 1: Single master file**

```bash
# Keep everything in one references.bib
/research:bib:add paper1.bib references.bib
/research:bib:add paper2.bib references.bib
/research:bib:add paper3.bib references.bib
```

**Strategy 2: Topic-specific files**

```bash
# Organize by research area
/research:bib:add mediation-paper.bib mediation-refs.bib
/research:bib:add bootstrap-paper.bib bootstrap-refs.bib
/research:bib:add simulation-paper.bib simulation-refs.bib
```

**Strategy 3: Project-specific files**

```bash
# One bibliography per manuscript
/research:bib:add paper.bib ~/projects/manuscript-2024/refs.bib
```

### Try It Now

Organize your bibliography using your preferred strategy:

```bash
# Example: Add all papers from this tutorial to one file
/research:bib:add /tmp/new-paper.bib ~/Documents/research/references.bib
```

### Verify Your Bibliography

```bash
# Count total entries
/research:bib:search "" references.bib | grep "Total:"

# Check recent additions
/research:bib:search "2024" references.bib

# Verify specific authors
/research:bib:search "Imai" references.bib
```

### ✅ Checkpoint 5

- [ ] All papers from Steps 1-2 are in your bibliography
- [ ] No duplicate entries
- [ ] Citations are organized logically
- [ ] File is valid BibTeX format

---

## Step 5: Export to Reference Manager ⏱️ 2 minutes

### What You'll Do

Integrate your Scholar-generated bibliography with popular reference managers like Zotero, Mendeley, or Papers.

### For Zotero Users

```bash
# Option 1: Import .bib file directly
# File → Import → Select references.bib

# Option 2: Add individual entries
# Copy BibTeX entry from Scholar
# Zotero → Add Item by Identifier → Paste BibTeX

# Option 3: Keep Scholar .bib as supplementary file
# Zotero can export to .bib and you can merge
```

### For Mendeley Users

```bash
# Import BibTeX file
# File → Import → BibTeX (.bib) → Select references.bib

# Mendeley will create a new folder with imported references
# Review for duplicates
```

### For LaTeX/Overleaf Users

```bash
# Upload references.bib to Overleaf project
# No conversion needed - use directly in \bibliography{}

# Local LaTeX:
cp ~/Documents/research/references.bib ~/Documents/manuscript/
```

### For Plain Text Workflow

```bash
# Keep .bib files in version control
cd ~/Documents/research
git add references.bib
git commit -m "Add mediation analysis references"

# Backup to cloud
cp references.bib ~/Dropbox/research/backups/
```

### ✅ Checkpoint 6

- [ ] Bibliography is accessible in your reference manager
- [ ] Papers are searchable and organized
- [ ] No import errors or duplicates
- [ ] Backup copy exists

---

## Complete Workflow Example

Now that you know each step, here's a complete literature search workflow:

```bash
# 1. Search for recent papers
/research:arxiv "mediation analysis sensitivity" --recent --max 10

# 2. Look up the 3 most relevant papers
/research:doi "10.1080/01621459.2020.1765785"
/research:doi "10.1093/biomet/asaa095"
/research:doi "10.48550/arXiv.2401.12345"

# 3. Check existing bibliography for related work
/research:bib:search "mediation" references.bib
/research:bib:search "Imai" references.bib

# 4. Save new entries to temporary files
# (Copy BibTeX outputs from step 2)

# 5. Add to bibliography with duplicate checking
/research:bib:add paper1.bib references.bib --deduplicate
/research:bib:add paper2.bib references.bib --deduplicate
/research:bib:add paper3.bib references.bib --deduplicate

# 6. Verify final bibliography
/research:bib:search "2024" references.bib
```

### Advanced: Script the Workflow

```bash
#!/bin/bash
# lit-search.sh - Automated literature search workflow

TOPIC="$1"
REFS="$HOME/Documents/research/references.bib"
OUTPUT="search-results-$(date +%Y%m%d).md"

echo "=== Literature Search: $TOPIC ===" | tee "$OUTPUT"
echo "" | tee -a "$OUTPUT"

# Step 1: Search arXiv
echo "Step 1: Searching arXiv..." | tee -a "$OUTPUT"
/research:arxiv "$TOPIC" --recent --max 10 | tee -a "$OUTPUT"

# Step 2: Check existing references
echo "" | tee -a "$OUTPUT"
echo "Step 2: Checking existing references..." | tee -a "$OUTPUT"
/research:bib:search "$TOPIC" "$REFS" | tee -a "$OUTPUT"

echo "" | tee -a "$OUTPUT"
echo "Review $OUTPUT for papers to add."
echo "Use /research:doi to get BibTeX entries for relevant papers."
```

**Usage:**

```bash
chmod +x lit-search.sh
./lit-search.sh "bootstrap mediation"
```

---

## Common Issues and Solutions

### Issue 1: No arXiv Results

**Symptoms:** Search returns "No papers found"

**Solutions:**

1. Broaden your search terms:

   ```bash
   # Too specific
   /research:arxiv "bootstrap percentile confidence intervals for indirect effects"

   # Better
   /research:arxiv "bootstrap mediation"
   ```

2. Remove date filters:

   ```bash
   # Instead of -since 2024
   /research:arxiv "topic" --max 20
   ```

3. Try alternative terms:

   ```bash
   # If "causal mediation" finds nothing
   /research:arxiv "indirect effects"
   /research:arxiv "mediation analysis"
   ```

### Issue 2: DOI Lookup Failed

**Symptoms:** "Unable to retrieve metadata for DOI"

**Solutions:**

1. Verify DOI format:

   ```bash
   # Correct
   /research:doi "10.1080/01621459.2020.1765785"

   # Wrong (no quotes)
   /research:doi 10.1080/01621459.2020.1765785

   # Wrong (includes URL)
   /research:doi "https://doi.org/10.1080/..."
   ```

2. Check if it's an arXiv preprint:

   ```bash
   # arXiv DOI format
   /research:doi "10.48550/arXiv.2401.12345"
   ```

3. Verify on CrossRef:
   - Visit https://search.crossref.org/
   - Search for the paper
   - Copy exact DOI

### Issue 3: File Not Found

**Symptoms:** "Unable to read file: references.bib"

**Solutions:**

1. Use absolute paths:

   ```bash
   # Relative path (might fail)
   /research:bib:search "topic" references.bib

   # Absolute path (better)
   /research:bib:search "topic" ~/Documents/research/references.bib
   ```

2. Create file if missing:

   ```bash
   mkdir -p ~/Documents/research
   touch ~/Documents/research/references.bib
   ```

3. Check permissions:

   ```bash
   ls -la ~/Documents/research/references.bib
   chmod 644 ~/Documents/research/references.bib
   ```

### Issue 4: Duplicate Entries

**Symptoms:** "Entry already exists in bibliography"

**Solutions:**

1. Search first before adding:

   ```bash
   /research:bib:search "author2021" references.bib
   ```

2. Use automatic deduplication:

   ```bash
   /research:bib:add paper.bib references.bib --deduplicate
   ```

3. Manually remove duplicates:

   ```bash
   # Find duplicates
   grep -n "@article{author2021" references.bib

   # Edit file
   nano references.bib  # or your preferred editor
   ```

---

## Next Steps

Congratulations! You've completed your first literature search with Scholar.

### Recommended Tutorials

**Continue Learning:**

- [ ] [Tutorial: Simulation Study Design](simulation-study.md) - Design Monte Carlo studies
- [ ] [Tutorial: Writing Methods Sections](methods-section.md) - Use literature in writing
- [ ] [Tutorial: Responding to Reviewers](reviewer-response.md) - Support responses with citations

**Explore Workflows:**

- [ ] [Complete Literature Review Workflow](../../research/index.md#workflow-1-literature-review-2-4-hours) - Systematic 2-4 hour review
- [ ] [Manuscript Writing Workflow](../../research/index.md#workflow-2-manuscript-writing-8-12-weeks) - 8-12 week timeline
- [ ] [Gap Analysis Workflow](../../research/index.md#common-workflows) - Identify research opportunities

### Advanced Commands to Explore

Once comfortable with literature search:

```bash
# Identify research gaps
/research:lit-gap "causal mediation unmeasured confounding"

# Generate hypotheses from literature
/research:hypothesis "effect heterogeneity in mediation"

# Find methods for your problem
/research:method-scout "high-dimensional mediation analysis"

# Create analysis plans
/research:analysis-plan "mediation analysis in RCT"
```

### Tips for Efficiency

**1. Create aliases for common searches:**

```bash
# Add to ~/.bashrc or ~/.zshrc
alias lit='function _lit(){ /research:arxiv "$1" --recent --max 10; }; _lit'
alias paper='function _p(){ /research:doi "$1"; }; _p'

# Usage
lit "mediation"
paper "10.1080/01621459.2020.1765785"
```

**2. Save search results:**

```bash
/research:arxiv "topic" --output search-log-$(date +%Y%m%d).md
```

**3. Batch process DOIs:**

```bash
for doi in "10.1080/..." "10.1093/..." "10.48550/..."; do
  /research:doi "$doi" >> papers-to-review.txt
done
```

**4. Regular bibliography maintenance:**

```bash
# Monthly: check for new papers on your topics
/research:arxiv "your research area" --since 2024-01

# Before submission: verify all citations
/research:bib:search "" references.bib | grep "Total"
```

---

## Success Metrics

After 2-3 practice sessions, you should be able to:

- ⏱️ Complete a literature search in under 5 minutes
- 📚 Find and add 5+ relevant papers to your bibliography
- 🔍 Search existing citations before adding new ones
- 📝 Generate ready-to-use BibTeX entries
- 🔄 Integrate with your reference manager seamlessly

---

## Resources

**Documentation:**

- [Research Commands Reference](../../research/RESEARCH-COMMANDS-REFERENCE.md) - All 14 commands
- [Literature Commands Guide](../../research/LITERATURE-COMMANDS.md) - Deep dive
- [Quick Reference Card](../../refcards/research-commands.md) - Command cheat sheet

**Help:**

- [FAQ](../../help/FAQ-research.md) - Common questions
- [GitHub Issues](https://github.com/Data-Wise/scholar/issues) - Report bugs
- [Discussions](https://github.com/Data-Wise/scholar/discussions) - Ask questions

---

**Tutorial Complete!** 🎉

You now have the skills to conduct efficient literature searches, manage bibliographies, and integrate research papers into your workflow.

**Questions or issues?** See the [FAQ](../../help/FAQ-research.md) section or open an issue on [GitHub](https://github.com/Data-Wise/scholar/issues).

**Share your success:** If this tutorial helped you, consider sharing your workflow in [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions).
