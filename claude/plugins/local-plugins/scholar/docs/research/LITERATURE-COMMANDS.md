# Literature Management Commands

Comprehensive guide to the 4 literature management commands in Scholar.

## Navigation

- [Overview](#overview)
- [Commands](#commands)
  - [/research:arxiv](#researcharxiv) - Search arXiv for papers
  - [/research:doi](#researchdoi) - Look up paper metadata
  - [/research:bib:search](#researchbibsearch) - Search BibTeX files
  - [/research:bib:add](#research

bibadd) - Add BibTeX entries

- [Workflows](#workflows)
- [Integration](#integration-with-reference-managers)
- [Best Practices](#best-practices)

---

## Overview

Literature management commands help you discover, retrieve, and organize academic references efficiently.

### Command Summary

| Command | Purpose | Output |
|---------|---------|--------|
| `/research:arxiv` | Search arXiv | Title, authors, abstract, PDF link |
| `/research:doi` | DOI lookup | Citation, BibTeX, abstract |
| `/research:bib:search` | Search .bib files | Matching BibTeX entries |
| `/research:bib:add` | Add to bibliography | Updated .bib file |

### Typical Workflow

```bash
# 1. Discover papers
/research:arxiv "causal mediation analysis"

# 2. Get full metadata
/research:doi "10.1080/01621459.2020.1765785"

# 3. Check for duplicates
/research:bib:search "Author 2020" references.bib

# 4. Add to bibliography
/research:bib:add entry.bib references.bib
```

---

## Commands

### /research:arxiv

Search arXiv for statistical papers with full-text search capabilities.

**Syntax:**

```bash
/research:arxiv "search query"
/research:arxiv "causal mediation analysis"
/research:arxiv "bootstrap confidence intervals"
/research:arxiv "high-dimensional regression penalization"
```

**Search Scope:**

- **Primary:** arXiv stat.* categories (stat.ME, stat.ML, stat.TH, etc.)
- **Coverage:** Preprints and working papers
- **Date range:** All available years (typically 1991-present)
- **Fields searched:** Title, abstract, author names

**Output Format:**

```
=== Paper 1 ===
Title: Causal Mediation Analysis Using R
Authors: Tingley, D., Yamamoto, T., Hirose, K., Keele, L., Imai, K.
arXiv ID: 1309.2432
Category: stat.ME
Date: 2013-09-10
Abstract: In this paper we describe the R package mediation for conducting
causal mediation analysis in applied empirical research...

PDF: https://arxiv.org/pdf/1309.2432.pdf
DOI: 10.18637/jss.v059.i05

=== Paper 2 ===
[Additional results...]
```

**Search Strategies:**

1. **Method-Focused Search:**

   ```bash
   /research:arxiv "bootstrap mediation confidence intervals"
   /research:arxiv "Bayesian causal inference"
   /research:arxiv "robust regression outliers"
   ```

2. **Author Search:**

   ```bash
   /research:arxiv "Pearl causal inference"
   /research:arxiv "Imai mediation"
   /research:arxiv "Efron bootstrap"
   ```

3. **Topic Search:**

   ```bash
   /research:arxiv "instrumental variables"
   /research:arxiv "propensity score matching"
   /research:arxiv "survival analysis time-varying"
   ```

4. **Combined Search:**

   ```bash
   /research:arxiv "high-dimensional mediation penalized"
   /research:arxiv "causal inference unmeasured confounding sensitivity"
   ```

**Advanced Search Tips:**

- **Use specific terms:** "causal mediation" > "mediation"
- **Include methodology:** "bootstrap", "Bayesian", "frequentist"
- **Add context:** "time-varying", "longitudinal", "high-dimensional"
- **Combine related terms:** "indirect effect mediation"

**Filtering Results:**

- **By date:** Scan publication dates in output
- **By category:** Note stat.ME (methodology) vs. stat.AP (applications)
- **By citations:** Cross-reference with Google Scholar for impact

**Limitations:**

- **arXiv only:** Does not search journal databases (PubMed, Web of Science)
- **Preprints:** May include early versions; check for published version
- **Statistics focus:** Limited to stat.* categories
- **No PDF parsing:** Returns abstracts only, not full-text content

**Common Use Cases:**

1. **Literature Review:**

   ```bash
   # Cast wide net
   /research:arxiv "mediation analysis"

   # Narrow to method
   /research:arxiv "mediation bootstrap percentile BCa"

   # Find recent work
   /research:arxiv "mediation 2023 2024"
   ```

2. **Method Discovery:**

   ```bash
   /research:arxiv "high-dimensional mediation"
   # Compare with:
   /research:method-scout "high-dimensional mediation"
   ```

3. **Citation Hunting:**

   ```bash
   /research:arxiv "author name methodology"
   # Get arXiv ID or DOI
   /research:doi "10.xxxx/xxxxx"
   ```

**Integration with Other Commands:**

```bash
# arXiv → DOI → Bibliography workflow:
/research:arxiv "topic"
# Copy DOI from results (if available)
/research:doi "10.xxxx/xxxxx"
# Save BibTeX output to file
/research:bib:add entry.bib references.bib
```

**Best Practices:**

1. **Start broad, narrow down:**
   - First search: general topic
   - Second search: specific method or context

2. **Check publication status:**
   - Look for DOI in arXiv results
   - Many arXiv papers are later published in journals
   - Use DOI lookup for final citation

3. **Save promising papers immediately:**
   - Don't rely on recreating searches
   - Download PDFs or save to reference manager
   - Note arXiv ID for future reference

4. **Cross-reference sources:**
   - Compare arXiv results with Google Scholar
   - Check journal websites for published versions
   - Look for code/data repositories linked in abstracts

---

### /research:doi

Look up paper metadata by DOI (Digital Object Identifier).

**Syntax:**

```bash
/research:doi "DOI"
/research:doi "10.1080/01621459.2020.1765785"
/research:doi "10.1093/biostatistics/kxaa030"
/research:doi "10.18637/jss.v059.i05"
```

**DOI Format:**

- Standard: `10.xxxx/xxxxx` (always starts with "10.")
- Example: `10.1080/01621459.2020.1765785`
- Case-insensitive (though typically lowercase)

**Output Format:**

```
=== Paper Metadata ===

Citation (APA):
Tingley, D., Yamamoto, T., Hirose, K., Keele, L., & Imai, K. (2014).
mediation: R Package for Causal Mediation Analysis. Journal of Statistical
Software, 59(5), 1-38. https://doi.org/10.18637/jss.v059.i05

BibTeX:
@article{tingley2014mediation,
  author = {Tingley, Dustin and Yamamoto, Teppei and Hirose, Kentaro and
            Keele, Luke and Imai, Kosuke},
  title = {mediation: {R} Package for Causal Mediation Analysis},
  journal = {Journal of Statistical Software},
  year = {2014},
  volume = {59},
  number = {5},
  pages = {1--38},
  doi = {10.18637/jss.v059.i05},
  url = {https://doi.org/10.18637/jss.v059.i05}
}

Abstract:
In this paper we describe the R package mediation for conducting causal
mediation analysis in applied empirical research. In many scientific
disciplines, the goal of researchers is not only estimating causal effects
of a treatment but also understanding the process in which the treatment
causally affects the outcome...

Publication Details:
Journal: Journal of Statistical Software
Volume: 59
Issue: 5
Pages: 1-38
Published: 2014-07-03
DOI: 10.18637/jss.v059.i05
URL: https://doi.org/10.18637/jss.v059.i05
```

**Where to Find DOIs:**

1. **Journal websites:** Near article title or in citation info
2. **arXiv:** Listed in paper metadata (if published)
3. **Google Scholar:** Click "Cite" → "BibTeX" to see DOI
4. **CrossRef search:** https://search.crossref.org/
5. **Publisher pages:** Usually in article header/footer

**Returns:**

- **Full citation:** APA, MLA, Chicago formats
- **BibTeX entry:** Ready for LaTeX bibliography
- **Abstract:** Full abstract text
- **Publication details:** Journal, volume, issue, pages, date
- **URLs:** DOI link and publisher URL
- **Authors:** Full author list with affiliations (when available)
- **Keywords:** Subject categories and keywords (when available)

**Common Use Cases:**

1. **Get Proper Citation:**

   ```bash
   # From paper you're reading
   /research:doi "10.xxxx/xxxxx"
   # Copy BibTeX entry
   ```

2. **Verify Reference:**

   ```bash
   # Check if DOI is valid
   /research:doi "10.xxxx/xxxxx"
   # Verify author names, year, journal
   ```

3. **Build Bibliography:**

   ```bash
   /research:doi "10.xxxx/xxxxx"
   # Save BibTeX to temp file
   echo "@article{...}" > entry.bib
   /research:bib:add entry.bib references.bib
   ```

4. **Find Related Work:**

   ```bash
   /research:doi "10.xxxx/xxxxx"
   # Read abstract
   # Search for cited/citing papers
   ```

**Integration Workflows:**

1. **arXiv to DOI to Bibliography:**

   ```bash
   /research:arxiv "causal mediation"
   # Find paper with DOI in results
   /research:doi "10.xxxx/xxxxx"
   # Copy BibTeX
   /research:bib:add entry.bib references.bib
   ```

2. **DOI to Analysis Plan:**

   ```bash
   /research:doi "10.xxxx/xxxxx"
   # Read about method
   /research:method-scout "method from paper"
   # Find R implementation
   ```

3. **Literature Review Chain:**

   ```bash
   /research:doi "foundational paper DOI"
   # Note key citations in abstract
   /research:arxiv "refining search based on abstract"
   # Find recent extensions
   ```

**Error Handling:**

- **Invalid DOI format:** Check for typos (common: missing "10." prefix)
- **DOI not found:** May be incorrect, or paper not registered with CrossRef
- **Access restrictions:** DOI resolves, but full text requires subscription
- **Old DOIs:** May redirect to updated DOI

**Best Practices:**

1. **Always prefer DOI over manual citations:**
   - More reliable than typing citations manually
   - Guaranteed to match published version
   - Includes all metadata automatically

2. **Verify before adding to bibliography:**
   - Check author names (spelling, order)
   - Verify publication year
   - Confirm journal name and volume/issue

3. **Save BibTeX immediately:**
   - Don't re-run DOI lookup multiple times
   - Save to temp file or clipboard
   - Add to bibliography in single batch

4. **Use DOI for permanent links:**
   - DOI URLs (https://doi.org/10.xxxx/xxxxx) are permanent
   - Better than journal-specific URLs that may change
   - Include in manuscripts for reviewer access

**CrossRef API Notes:**

- Scholar uses CrossRef API for DOI resolution
- Free and open access (no API key required)
- Covers most major publishers
- May not include preprints without DOIs

---

### /research:bib:search

Search BibTeX bibliography files for specific entries.

**Syntax:**

```bash
/research:bib:search "search term" file.bib
/research:bib:search "Pearl" references.bib
/research:bib:search "mediation" ~/papers/main.bib
/research:bib:search "2020" bibliography.bib
```

**Wildcard Patterns:**

```bash
# All .bib files in current directory
/research:bib:search "term" *.bib

# All .bib files in subdirectory
/research:bib:search "term" refs/*.bib

# Recursive search (all subdirectories)
/research:bib:search "term" **/*.bib
```

**Search Targets:**

The command searches across multiple BibTeX fields:

- **Authors:** `author = {Pearl, Judea}`
- **Titles:** `title = {Causality: Models, Reasoning and Inference}`
- **Years:** `year = {2009}`
- **Journal:** `journal = {Journal of the American Statistical Association}`
- **BibTeX key:** `@article{pearl2009causality,`
- **Keywords:** `keywords = {causal inference, mediation}`
- **DOI:** `doi = {10.xxxx/xxxxx}`

**Output Format:**

```
Found 3 matches in references.bib:

Match 1:
@article{pearl2014interpretation,
  author = {Pearl, Judea},
  title = {Interpretation and Identification of Causal Mediation},
  journal = {Psychological Methods},
  year = {2014},
  volume = {19},
  number = {4},
  pages = {459--481},
  doi = {10.1037/a0036434}
}

Match 2:
@book{pearl2009causality,
  author = {Pearl, Judea},
  title = {Causality: Models, Reasoning and Inference},
  publisher = {Cambridge University Press},
  year = {2009},
  edition = {2nd}
}

Match 3:
@article{pearl2012mediation,
  author = {Pearl, Judea},
  title = {The Causal Mediation Formula: A Guide to the Assessment of Pathways and Mechanisms},
  journal = {Prevention Science},
  year = {2012},
  volume = {13},
  pages = {426--436},
  doi = {10.1007/s11121-011-0270-1}
}

Total: 3 matches
```

**Search Strategies:**

1. **By Author:**

   ```bash
   /research:bib:search "Pearl" references.bib
   /research:bib:search "Imai" references.bib
   /research:bib:search "Tingley" references.bib
   ```

2. **By Year:**

   ```bash
   /research:bib:search "2020" references.bib
   /research:bib:search "2019" references.bib
   ```

3. **By Keyword/Topic:**

   ```bash
   /research:bib:search "mediation" references.bib
   /research:bib:search "bootstrap" references.bib
   /research:bib:search "causal" references.bib
   ```

4. **By Journal:**

   ```bash
   /research:bib:search "JASA" references.bib
   /research:bib:search "Biometrics" references.bib
   ```

5. **By BibTeX Key:**

   ```bash
   /research:bib:search "pearl2014" references.bib
   /research:bib:search "imai" references.bib
   ```

**Common Use Cases:**

1. **Check for Duplicates:**

   ```bash
   # Before adding new entry
   /research:bib:search "Pearl 2014" references.bib
   # If found, don't add duplicate
   ```

2. **Find Citation Key:**

   ```bash
   # Need to cite paper in LaTeX
   /research:bib:search "Pearl causality" references.bib
   # Use BibTeX key in \cite{pearl2009causality}
   ```

3. **Verify Entry Exists:**

   ```bash
   # LaTeX compile error: undefined reference
   /research:bib:search "pearl2009" references.bib
   # Check if key matches
   ```

4. **Collect Related Papers:**

   ```bash
   # Gather all mediation papers
   /research:bib:search "mediation" *.bib
   # Review for literature review section
   ```

5. **Cross-File Search:**

   ```bash
   # Check if paper in any project bibliography
   /research:bib:search "Tingley 2014" ~/papers/**/*.bib
   ```

**Integration Workflows:**

1. **Pre-Add Duplicate Check:**

   ```bash
   /research:doi "10.xxxx/xxxxx"
   # Copy author and year from output
   /research:bib:search "Author 2020" references.bib
   # If not found, safe to add
   /research:bib:add entry.bib references.bib
   ```

2. **Citation Workflow:**

   ```bash
   # Writing LaTeX manuscript
   /research:bib:search "Pearl causal" references.bib
   # Get BibTeX key from output
   # Use in \cite{pearl2009causality}
   ```

3. **Bibliography Maintenance:**

   ```bash
   # Find all 2020 papers
   /research:bib:search "2020" references.bib
   # Review for relevance
   # Remove outdated or unused entries
   ```

**Best Practices:**

1. **Use specific search terms:**
   - "mediation" > "med"
   - "Pearl 2014" > "Pearl"
   - Reduces false positives

2. **Search before adding:**
   - Always check for duplicates
   - Prevents bibliography bloat
   - Ensures consistent citation keys

3. **Multi-file searches:**
   - Use wildcards for project-wide searches
   - Helps find previously added papers
   - Useful for cross-project references

4. **Verify keys match usage:**
   - Check LaTeX \cite{} commands
   - Ensure BibTeX key exists in .bib file
   - Catches typos in citation keys

**Performance Notes:**

- Fast for files < 1000 entries
- Scales well to 10,000+ entries
- Case-insensitive search
- Partial matching supported

---

### /research:bib:add

Add BibTeX entries to bibliography files with duplicate detection and validation.

**Syntax:**

```bash
/research:bib:add entry.bib target.bib
/research:bib:add new-paper.bib references.bib
/research:bib:add ~/Downloads/citation.bib ~/papers/main.bib
```

**Requirements:**

- **entry.bib:** Source file with BibTeX entry (single or multiple)
- **target.bib:** Destination bibliography file
- Both files must contain valid BibTeX syntax

**Workflow:**

1. **Create Entry File:**

   ```bash
   # From DOI lookup
   /research:doi "10.xxxx/xxxxx"
   # Copy BibTeX output to file
   cat > entry.bib << 'EOF'
   @article{author2020title,
     author = {...},
     title = {...},
     ...
   }
   EOF
   ```

2. **Check for Duplicates:**

   ```bash
   /research:bib:search "author 2020" references.bib
   # If not found, proceed
   ```

3. **Add to Bibliography:**

   ```bash
   /research:bib:add entry.bib references.bib
   ```

4. **Verify:**

   ```bash
   /research:bib:search "author 2020" references.bib
   # Confirm entry was added
   ```

**Features:**

- **Duplicate Detection:** Warns if entry key already exists
- **Syntax Validation:** Checks BibTeX format before adding
- **Backup Creation:** Saves backup of target.bib before modification
- **Alphabetical Sorting:** Optionally sorts entries (configurable)
- **Merge Mode:** Can add multiple entries at once

**Output:**

```
Checking entry.bib...
Valid BibTeX: ✓

Checking for duplicates in references.bib...
No duplicates found: ✓

Backup created: references.bib.backup

Adding entry to references.bib...
Added: pearl2014interpretation

Success: 1 entry added to references.bib
Total entries: 247
```

**Duplicate Handling:**

If duplicate detected:

```
Warning: Duplicate entry key found!

Existing entry in references.bib:
@article{pearl2014interpretation,
  author = {Pearl, Judea},
  ...
}

New entry in entry.bib:
@article{pearl2014interpretation,
  author = {Pearl, J.},
  ...
}

Action:
[S]kip (keep existing)
[R]eplace (use new)
[M]erge (manual edit required)
[C]ancel
```

**Common Workflows:**

1. **Single Paper Addition:**

   ```bash
   # Get BibTeX from DOI
   /research:doi "10.xxxx/xxxxx" > temp.bib

   # Extract @article{...} block, save to entry.bib

   # Add to bibliography
   /research:bib:add entry.bib references.bib

   # Cleanup
   rm temp.bib entry.bib
   ```

2. **Batch Addition from Export:**

   ```bash
   # Export from Zotero/Mendeley to zotero-export.bib

   # Add all entries
   /research:bib:add zotero-export.bib main.bib
   ```

3. **Cross-Project Sharing:**

   ```bash
   # Add shared reference to multiple projects
   /research:bib:add shared-entry.bib ~/project-a/refs.bib
   /research:bib:add shared-entry.bib ~/project-b/refs.bib
   /research:bib:add shared-entry.bib ~/project-c/refs.bib
   ```

**Safety Features:**

1. **Backup Before Modification:**
   - Creates `target.bib.backup` automatically
   - Restore with: `mv target.bib.backup target.bib`

2. **Syntax Validation:**
   - Checks for missing braces `{}`
   - Validates entry types (@article, @book, etc.)
   - Ensures required fields present

3. **Confirmation Prompts:**
   - Asks before overwriting duplicates
   - Confirms large batch additions
   - Warns if target file will be significantly changed

**Integration with Reference Managers:**

1. **Zotero:**

   ```bash
   # In Zotero: Right-click → Export Collection → BibTeX
   # Save as zotero-export.bib
   /research:bib:add zotero-export.bib main.bib
   ```

2. **Mendeley:**

   ```bash
   # In Mendeley: File → Export → BibTeX
   /research:bib:add mendeley-export.bib main.bib
   ```

3. **Papers:**

   ```bash
   # In Papers: Select papers → Export → BibTeX
   /research:bib:add papers-export.bib main.bib
   ```

**Best Practices:**

1. **Always check for duplicates first:**

   ```bash
   /research:bib:search "author year" target.bib
   # If not found:
   /research:bib:add entry.bib target.bib
   ```

2. **Use temporary files for single entries:**

   ```bash
   # Create entry
   echo "@article{key, ...}" > /tmp/entry.bib
   # Add
   /research:bib:add /tmp/entry.bib references.bib
   # Cleanup
   rm /tmp/entry.bib
   ```

3. **Maintain project-specific bibliographies:**

   ```bash
   # Don't share .bib files across unrelated projects
   # Create separate bibliographies per project
   # Use /research:bib:add to sync shared references
   ```

4. **Version control your .bib files:**

   ```bash
   git add references.bib
   git commit -m "Add Pearl (2014) to bibliography"
   ```

**Common Errors:**

1. **Invalid BibTeX syntax:**

   ```
   Error: Invalid BibTeX in entry.bib
   Missing closing brace on line 5
   ```

   **Fix:** Validate syntax before adding

2. **Duplicate key:**

   ```
   Warning: Entry 'pearl2014' already exists
   ```

   **Fix:** Use /research:bib:search first, or rename key

3. **File not found:**

   ```
   Error: Cannot find entry.bib
   ```

   **Fix:** Check file path, use absolute paths

---

## Workflows

### Complete Literature Review Workflow

```bash
# Step 1: Discover papers
/research:arxiv "causal mediation bootstrap"

# Step 2: Get metadata for promising papers
/research:doi "10.1037/a0036434"  # From arXiv results

# Step 3: Save BibTeX
cat > pearl2014.bib << 'EOF'
@article{pearl2014interpretation,
  author = {Pearl, Judea},
  title = {Interpretation and Identification of Causal Mediation},
  ...
}
EOF

# Step 4: Check for duplicates
/research:bib:search "Pearl 2014" references.bib

# Step 5: Add to bibliography
/research:bib:add pearl2014.bib references.bib

# Step 6: Cleanup
rm pearl2014.bib

# Step 7: Use in manuscript
# LaTeX: \cite{pearl2014interpretation}
```

### Rapid Reference Building

```bash
# Batch collect DOIs from reading
DOIS=(
  "10.1037/a0036434"
  "10.18637/jss.v059.i05"
  "10.1080/00273171.2011.606716"
)

# Create temp bibliography
> temp.bib

# Look up each DOI
for doi in "${DOIS[@]}"; do
  /research:doi "$doi" >> temp.bib
  echo "" >> temp.bib
done

# Add all to main bibliography
/research:bib:add temp.bib references.bib

# Cleanup
rm temp.bib
```

### Cross-Project Reference Sync

```bash
# Find paper in any project
/research:bib:search "Imai 2010" ~/papers/**/*.bib

# If found in project-a but needed in project-b
# Extract entry
/research:bib:search "imai2010" ~/papers/project-a/refs.bib > entry.bib

# Add to project-b
/research:bib:add entry.bib ~/papers/project-b/refs.bib
```

---

## Integration with Reference Managers

### Zotero Integration

**Export from Zotero:**

1. Select collection or papers
2. Right-click → "Export Collection..." or "Export Items..."
3. Format: "BibTeX"
4. Save as `zotero-export.bib`

**Add to Scholar Bibliography:**

```bash
/research:bib:add zotero-export.bib main.bib
```

**Sync Workflow:**

```bash
# Periodic sync from Zotero
# 1. Export full library to zotero-full.bib
# 2. Search for papers needed in current project
/research:bib:search "mediation" zotero-full.bib > mediation-papers.bib
# 3. Add subset to project bibliography
/research:bib:add mediation-papers.bib project-refs.bib
```

### Mendeley Integration

**Export from Mendeley:**

1. File → Export...
2. Select papers or folder
3. Format: "BibTeX (*.bib)"
4. Save as `mendeley-export.bib`

**Add to Bibliography:**

```bash
/research:bib:add mendeley-export.bib references.bib
```

### Papers Integration

**Export from Papers:**

1. Select papers
2. Export → BibTeX
3. Save as `papers-export.bib`

```bash
/research:bib:add papers-export.bib references.bib
```

### Google Scholar Integration

**Manual Workflow:**

1. Search in Google Scholar
2. Click "Cite" under paper
3. Click "BibTeX" link
4. Copy BibTeX entry
5. Save to temp file
6. Add to bibliography

```bash
# Save BibTeX from Google Scholar
cat > gs-entry.bib << 'EOF'
[paste BibTeX]
EOF

/research:bib:add gs-entry.bib references.bib
rm gs-entry.bib
```

**Note:** Consider using DOI lookup instead for more reliable metadata:

```bash
# Get DOI from Google Scholar
/research:doi "10.xxxx/xxxxx"
# More accurate than Google Scholar BibTeX
```

---

## Best Practices

### Organization

1. **One Bibliography Per Project:**
   - Don't share .bib files across unrelated projects
   - Keeps bibliographies focused and manageable
   - Easier to track which papers are actually cited

2. **Descriptive File Names:**
   - `references.bib` for main bibliography
   - `supplementary-refs.bib` for supplementary materials
   - `methods-refs.bib` for methodology papers

3. **Version Control:**

   ```bash
   git add references.bib
   git commit -m "Add Pearl (2014) mediation paper"
   git push
   ```

### Citation Keys

1. **Consistent Naming:**
   - Format: `authorYEARkeyword`
   - Example: `pearl2014interpretation`, `imai2010mediation`
   - Lowercase, no special characters

2. **Unique Keys:**
   - Add keyword if author has multiple papers same year
   - `pearl2014interpretation` vs. `pearl2014causality`

3. **Search-Friendly:**
   - Include enough info to find with `/research:bib:search`
   - Author name + year usually sufficient

### Maintenance

1. **Regular Cleanup:**

   ```bash
   # Find unused entries (papers cited but not used)
   # Compare .bib file with LaTeX .aux file
   ```

2. **Avoid Duplicates:**

   ```bash
   # Always search before adding
   /research:bib:search "author year" references.bib
   /research:bib:add entry.bib references.bib
   ```

3. **Validate Entries:**

   ```bash
   # Check for common errors:
   # - Missing required fields (author, title, year)
   # - Unmatched braces {}
   # - Special characters not escaped
   ```

### Workflow Automation

1. **DOI to BibTeX Script:**

   ```bash
   #!/bin/bash
   # doi2bib.sh
   DOI="$1"
   BIBFILE="${2:-references.bib}"

   /research:doi "$DOI" > temp.bib
   /research:bib:add temp.bib "$BIBFILE"
   rm temp.bib
   ```

   Usage: `./doi2bib.sh "10.xxxx/xxxxx" references.bib`

2. **Batch arXiv Collection:**

   ```bash
   #!/bin/bash
   # arxiv-collect.sh
   QUERY="$1"

   /research:arxiv "$QUERY" | grep "DOI:" | cut -d' ' -f2 | while read doi; do
     /research:doi "$doi" >> collected.bib
     echo "" >> collected.bib
   done

   /research:bib:add collected.bib references.bib
   rm collected.bib
   ```

### Quality Control

1. **Verify Critical Citations:**

   ```bash
   # For papers you're actually citing
   /research:doi "DOI"
   # Double-check author names, year, title
   ```

2. **Check for Updates:**

   ```bash
   # Periodically re-lookup arXiv papers
   # Many get published after appearing on arXiv
   /research:doi "published version DOI"
   # Update bibliography with journal version
   ```

3. **Standardize Formatting:**
   - Use consistent capitalization in titles
   - Protect proper nouns: `{Bayesian}`, `{Monte Carlo}`
   - Standardize journal names (abbreviations vs. full)

---

## See Also

- **[Research Commands Reference](RESEARCH-COMMANDS-REFERENCE.md)** - All {{ scholar.research_commands }} research commands
- **[Manuscript Commands](MANUSCRIPT-COMMANDS.md)** - Writing assistance commands
- **[Simulation Commands](SIMULATION-COMMANDS.md)** - Simulation study commands

---

**Document Version:** {{ scholar.version }}
**Last Updated:** 2026-01-31
**Commands Documented:** 4
