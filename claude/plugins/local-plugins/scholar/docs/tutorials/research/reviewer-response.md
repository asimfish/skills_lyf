# Tutorial: Your First Reviewer Response

**Target Audience:** Researchers responding to peer review for the first time
**Time:** 45-60 minutes
**Difficulty:** Intermediate

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Parse and categorize reviewer comments systematically
- Craft professional responses to different types of feedback
- Use `/research:manuscript:reviewer` to draft response letters
- Revise manuscript sections based on reviewer feedback
- Format a complete response letter ready for submission
- Handle disagreements professionally and constructively
- Integrate version control for tracking changes
- Link responses to specific manuscript line numbers

## Prerequisites

Before starting, make sure you have:

- [ ] Scholar installed (`brew install data-wise/tap/scholar` or npm global install)
- [ ] Claude Code running
- [ ] Your manuscript draft
- [ ] Reviewer comments (in text file or PDF)
- [ ] Git repository for version tracking (recommended)
- [ ] LaTeX or Markdown knowledge for manuscript editing
- [ ] Basic understanding of academic publishing process

**Installation Check:**

```bash
scholar --version
# Should show: scholar v2.6.0 or later

# Verify manuscript commands are available
scholar list-commands | grep manuscript
# Should show: research:manuscript:reviewer, research:manuscript:methods, etc.
```

---

## Step 1: Organize Reviewer Comments ⏱️ 10 minutes

### What You'll Do

Before generating responses, organize all reviewer comments into a structured format. This makes parsing easier and ensures nothing gets missed.

### Create a Review File

**Structure your review file like this:**

```text
JOURNAL: Biostatistics
MANUSCRIPT: Bootstrap Methods for Causal Mediation Analysis
DATE RECEIVED: 2025-01-15
DECISION: Major Revision

====================
ASSOCIATE EDITOR
====================

The reviewers have raised several important concerns about the methodology
and presentation. Please address all comments carefully.

====================
REVIEWER 1
====================

MAJOR COMMENTS:

1. The bootstrap procedure is not clearly described. How many replicates
   were used? What confidence interval method (percentile, BCa, studentized)?
   This is critical for reproducibility.

2. The simulation study does not compare your method to existing approaches.
   You should include comparisons to the mediation package in R and the
   PROCESS macro.

3. Power analysis is missing. What sample size is needed to detect
   mediation effects of various sizes with your method?

MINOR COMMENTS:

4. Table 2 is difficult to read. Consider splitting into two tables
   or reformatting.

5. Line 234: "statistically significant" should specify the alpha level.

6. The notation switches between X/M/Y and T/M/O inconsistently.

====================
REVIEWER 2
====================

MAJOR COMMENTS:

1. The assumption of no unmeasured confounding is critical but not
   thoroughly discussed. How sensitive are your results to violations
   of this assumption? A sensitivity analysis would strengthen the paper.

2. The real data example is interesting but the sample size (n=150)
   seems small. Can you justify this or provide power calculations?

MINOR COMMENTS:

3. Figure 1 caption should explain all abbreviations (e.g., NIE, NDE).

4. References 12 and 23 appear to be duplicates.

5. The supplementary materials link is broken.
```

**Save this as:** `reviews/review-2025-01-15.txt`

### Why This Structure?

- **Journal header**: Reminds you of context and timeline
- **Separated by reviewer**: Easy to track which comments are from whom
- **Major/Minor labels**: Helps prioritize your efforts
- **Numbered comments**: Makes it easy to reference in responses
- **Verbatim quotes**: Ensures accuracy

### Try It Now

1. Copy your reviewer comments
2. Paste into a text editor
3. Add structure markers (reviewer sections, numbering)
4. Save with descriptive filename: `reviews/review-[JOURNAL]-[DATE].txt`

### ✅ Checkpoint 1

- [ ] Review file is created and saved
- [ ] Comments are separated by reviewer
- [ ] Each comment is numbered
- [ ] Major/minor distinction is clear
- [ ] You can read it easily

**Troubleshooting:**

- **PDF comments**: Copy-paste from PDF, clean up formatting artifacts
- **Multiple rounds**: Create separate files like `review-round1.txt`, `review-round2.txt`
- **Comments in email**: Forward to yourself, copy into text file

---

## Step 2: Categorize and Prioritize ⏱️ 15 minutes

### What You'll Do

Not all reviewer comments require the same response strategy. Categorize each comment before drafting responses.

### The Three Categories

#### 1. Accept and Revise

**Characteristics:**
- Reviewer points out genuine weakness
- Improvement is feasible and appropriate
- You agree with the concern

**Examples:**
- Unclear methodology description
- Missing citations
- Insufficient detail in methods
- Typos and formatting issues

**Response strategy:** "We thank the reviewer and have revised..."

#### 2. Accept with Modification

**Characteristics:**
- Valid concern but suggested solution isn't optimal
- You have a better approach to address the issue
- Partial implementation makes sense

**Examples:**
- Reviewer suggests one analysis, you propose alternative
- Request for additional content when space is limited
- Suggestion that's technically infeasible but spirit is valid

**Response strategy:** "We appreciate this suggestion. Instead of [X], we have [Y] because..."

#### 3. Respectfully Disagree

**Characteristics:**
- Request conflicts with journal guidelines
- Methodological disagreement based on literature
- Impossible to implement (e.g., new data collection)
- Misunderstanding of your method

**Examples:**
- "Sample size is too small" when you have sufficient power
- Requesting analyses outside paper scope
- Suggesting deprecated methods

**Response strategy:** "We appreciate the reviewer's concern. However, we respectfully note that..."

### Create a Categorization Document

```markdown
# Review Response Strategy
**Manuscript:** Bootstrap Mediation Analysis
**Date:** 2025-01-15

## Category 1: Accept and Revise (DO THESE FIRST)

| Reviewer | Comment | Action Required | Priority |
|----------|---------|----------------|----------|
| R1 | #1 - Bootstrap procedure unclear | Expand methods section, add replicates count | HIGH |
| R1 | #5 - Alpha level not specified | Add "α = 0.05" to line 234 | LOW |
| R1 | #6 - Inconsistent notation | Change T/M/O to X/M/Y throughout | MEDIUM |
| R2 | #3 - Figure caption incomplete | Add definitions for NIE, NDE, TE | LOW |
| R2 | #5 - Broken link | Fix supplementary materials URL | HIGH |

## Category 2: Accept with Modification

| Reviewer | Comment | Proposed Solution | Rationale |
|----------|---------|------------------|-----------|
| R1 | #2 - Compare to existing methods | Add comparison in simulation (mediation package only) | PROCESS is SPSS-based, not comparable in R context |
| R1 | #4 - Table 2 difficult to read | Move half to supplementary materials | Journal page limits prevent two tables |

## Category 3: Respectfully Disagree

| Reviewer | Comment | Reasoning | Supporting Evidence |
|----------|---------|-----------|-------------------|
| R1 | #3 - Missing power analysis | We DID include power analysis (Supp. S3) | Point reviewer to correct location |
| R2 | #1 - Need sensitivity analysis | Addressed via bootstrap robustness | Cite Tingley et al. (2014) on bootstrap properties |
| R2 | #2 - Sample size too small | Power calculations show n=150 adequate for δ=0.20 | Include power calculation in response |

## Timeline

- **Week 1**: Address all HIGH priority items
- **Week 2**: Address MEDIUM/LOW priority, draft responses
- **Week 3**: Revise manuscript, format response letter
- **Week 4**: Proofread and submit
```

**Save this as:** `reviews/response-strategy.md`

### Try It Now

1. Read through all reviewer comments
2. Assign each comment to a category
3. Note your proposed action for each
4. Rank by priority and difficulty

### ✅ Checkpoint 2

- [ ] Every comment is categorized
- [ ] You have a plan for each comment
- [ ] Priorities are clear
- [ ] You know which comments need most work

**Common Pitfalls:**

- **Over-agreeing**: Don't accept everything. It's OK to disagree politely.
- **Under-revising**: Even simple comments deserve thorough responses.
- **Missing comments**: Double-check you haven't skipped any reviewer feedback.

---

## Step 3: Draft Responses with Scholar ⏱️ 20 minutes

### What You'll Do

Use `/research:manuscript:reviewer` to generate professional response drafts for each category.

### Using the Command

**Basic usage:**

```bash
/research:manuscript:reviewer reviews/review-2025-01-15.txt
```

**What Scholar does:**

1. Reads the review file
2. Identifies distinct comments
3. Categorizes by severity
4. Generates response templates
5. Suggests specific revisions
6. Recommends additional analyses

### Example: Responding to a Methodology Concern

**Reviewer Comment:**

> "The bootstrap procedure is not clearly described. How many replicates were used? What confidence interval method?"

**Scholar Command:**

```bash
/research:manuscript:reviewer --comment "Reviewer 1 Comment 1: Bootstrap procedure not clearly described"
```

**Scholar's Draft Response:**

```markdown
**Reviewer 1, Comment 1:**

> The bootstrap procedure is not clearly described. How many replicates
> were used? What confidence interval method (percentile, BCa, studentized)?

**Response:**

We thank the reviewer for identifying this important omission. We have
substantially revised the methods section to clarify our bootstrap procedure.
Specifically:

1. **Number of replicates**: We used B = 5,000 bootstrap replicates, which
   provides stable confidence intervals based on simulation studies
   (Efron & Tibshirani, 1993).

2. **Confidence interval method**: We employed the percentile method for
   constructing 95% confidence intervals. This approach is appropriate for
   our estimand (indirect effect) and has been validated in previous
   mediation studies (MacKinnon et al., 2004; Preacher & Hayes, 2008).

3. **Implementation details**: We added algorithmic steps to the methods
   section (page 8, lines 156-172) showing the exact resampling procedure
   and CI calculation.

**Changes in Manuscript:**

- **Page 8, Lines 156-172**: Added new subsection "3.2 Bootstrap Implementation"
  with algorithmic description
- **Page 9, Lines 180-182**: Added sentence specifying B = 5,000 and percentile CI
- **Table 1**: Added column showing bootstrap standard errors alongside
  asymptotic SEs for comparison
- **Supplementary Section S2**: Added R code demonstrating implementation

**New References:**

- Efron, B., & Tibshirani, R. J. (1993). *An Introduction to the Bootstrap*.
  Chapman & Hall.
- MacKinnon, D. P., Lockwood, C. M., & Williams, J. (2004). Confidence limits
  for the indirect effect. *Multivariate Behavioral Research*, 39(1), 99-128.
```

### Example: Disagreeing Politely

**Reviewer Comment:**

> "The sample size (n=150) seems small."

**Scholar Command:**

```bash
/research:manuscript:reviewer --comment "Reviewer 2 Comment 2: Sample size concerns" --disagree
```

**Scholar's Draft Response:**

```markdown
**Reviewer 2, Comment 2:**

> The real data example is interesting but the sample size (n=150) seems
> small. Can you justify this or provide power calculations?

**Response:**

We appreciate the reviewer's attention to sample size considerations. While
we agree that larger samples are generally preferable, we respectfully note
that our sample size of n = 150 is adequate for detecting mediation effects
of substantive interest in our application. Specifically:

1. **A priori power analysis**: Prior to data collection, we conducted power
   calculations (now detailed in Supplementary Section S4) indicating that
   n = 150 provides 80% power to detect an indirect effect of δ = 0.20,
   which is consistent with effect sizes reported in similar studies
   (Cohen's d = 0.15-0.25; see Davis et al., 2018; Lee & Kim, 2020).

2. **Empirical justification**: Our observed bootstrap confidence intervals
   exclude zero with adequate precision (95% CI: [0.18, 0.44]), suggesting
   sufficient information in the data to estimate the indirect effect.

3. **Comparison to literature**: The sample size is comparable to or larger
   than previous mediation studies in this domain (typical range: n = 100-200;
   see systematic review by Thompson et al., 2021).

4. **Limitation acknowledged**: We have added a limitation paragraph (page 15,
   lines 320-328) discussing sample size considerations and noting that
   replication in larger samples would strengthen confidence in the findings.

**Changes in Manuscript:**

- **Page 6, Lines 115-118**: Added power analysis results from Supplementary S4
- **Page 15, Lines 320-328**: Added limitation paragraph on sample size
- **Supplementary Section S4**: Added detailed power calculations with code

**New References:**

- Davis, M., et al. (2018). Mediation in small samples. *Psych Methods*, 23(2).
- Lee, S., & Kim, Y. (2020). Effect sizes in mediation. *JEBS*, 45(1).
- Thompson, R., et al. (2021). Sample sizes in mediation studies. *Ann Rev*.
```

### Try It Now

For each major comment:

1. Run `/research:manuscript:reviewer` with the comment text
2. Review the generated response
3. Customize the response with your specific details
4. Add precise page/line numbers from your manuscript
5. Verify all citations are accurate

### Response Quality Checklist

For each response, verify:

- [ ] Thanks reviewer (except for minor typos)
- [ ] Acknowledges the concern explicitly
- [ ] Explains what was done (not just "we revised")
- [ ] References specific manuscript locations (page X, lines Y-Z)
- [ ] Provides rationale for decisions
- [ ] Includes citations when appropriate
- [ ] Maintains professional, respectful tone
- [ ] Is specific and concrete (not vague)

### ✅ Checkpoint 3

- [ ] You have draft responses for all major comments
- [ ] Responses follow the quality checklist
- [ ] You've added your specific details (page numbers, etc.)
- [ ] Tone is professional throughout

**Troubleshooting:**

- **Response too generic**: Add specific details from your manuscript
- **Too defensive**: Reframe as "we appreciate" rather than "we disagree"
- **Too brief**: Expand with reasoning and evidence
- **Missing context**: Add background for why you made choices

---

## Step 4: Revise the Manuscript ⏱️ Variable (hours to days)

### What You'll Do

Make the actual changes you promised in your responses. This is the most time-intensive step.

### Track Changes with Git

**Set up version control:**

```bash
# If not already a git repo
cd ~/Documents/manuscripts/mediation-paper
git init
git add manuscript.tex references.bib figures/
git commit -m "Original submission version"

# Create revision branch
git checkout -b revision-round1

# As you make changes, commit frequently
git add manuscript.tex
git commit -m "Clarify bootstrap procedure (R1 Comment 1)"

git add manuscript.tex
git commit -m "Fix notation consistency (R1 Comment 6)"
```

**Why use git?**

- Track exactly what changed between versions
- Generate diff for editor if requested
- Easy to revert if you need to undo changes
- Shows progression of revisions

### Using Scholar Commands for Revisions

**Rewrite methods section:**

```bash
# Generate improved methods description
/research:manuscript:methods "bootstrap mediation analysis with percentile confidence intervals"

# Scholar will ask about:
# - Sample size and study design
# - Specific bootstrap parameters (B, CI method)
# - Software implementation
# - Assumptions and limitations

# Copy generated text to manuscript
```

**Add new results:**

```bash
# Generate power analysis results
/research:manuscript:results "power analysis for mediation effects"

# Add sensitivity analysis
/research:manuscript:results "sensitivity analysis for unmeasured confounding"
```

**Find supporting citations:**

```bash
# Find bootstrap mediation papers
/research:bib:search "bootstrap confidence intervals mediation"

# Look up specific DOIs reviewers mentioned
/research:doi "10.1037/met0000086"

# Add to references.bib
```

### Revision Checklist by Comment Category

#### For "Accept and Revise" Comments

- [ ] Make the requested change in manuscript
- [ ] Verify change is clearly visible
- [ ] Note exact location (page, line numbers)
- [ ] Add to response letter with specifics
- [ ] Commit change to git

#### For "Accept with Modification" Comments

- [ ] Make your alternative change in manuscript
- [ ] Explain in response why alternative is better
- [ ] Show that it addresses the spirit of the comment
- [ ] Add citations supporting your approach
- [ ] Commit change to git

#### For "Respectfully Disagree" Comments

- [ ] Add clarification to manuscript (if appropriate)
- [ ] Add limitation paragraph (if warranted)
- [ ] Point to existing content reviewer missed
- [ ] Strengthen argument with additional citations
- [ ] Commit any changes to git

### Track Line Numbers for Final Response

**Create a change log:**

```markdown
# Manuscript Changes Log

## Major Changes

### R1 Comment 1: Bootstrap procedure
- **Lines 156-172**: Added new subsection "Bootstrap Implementation"
- **Lines 180-182**: Added B = 5,000 specification
- **Table 1**: Added bootstrap SE column
- **Supplementary S2**: Added R code

### R1 Comment 2: Method comparisons
- **Lines 210-225**: Added simulation comparison to mediation package
- **Table 3**: New table comparing performance metrics
- **Figure 2**: Visual comparison of CI coverage

### R2 Comment 1: Sensitivity analysis
- **Lines 188-195**: Added sensitivity discussion
- **Supplementary S3**: Added ρ-sensitivity plots
- **References**: Added Tingley et al. (2014)

## Minor Changes

### R1 Comment 5: Alpha level
- **Line 234**: Changed "significant" to "significant (α = 0.05)"

### R1 Comment 6: Notation consistency
- **Throughout**: Changed T/M/O to X/M/Y (12 instances)
- **Figure 1**: Updated labels to match

### R2 Comment 3: Figure caption
- **Figure 1 caption**: Added NIE = natural indirect effect, NDE = natural direct effect, TE = total effect
```

**Save as:** `reviews/change-log.md`

### ✅ Checkpoint 4

- [ ] All promised changes are made in manuscript
- [ ] Changes are committed to git with descriptive messages
- [ ] Change log documents all modifications
- [ ] Line numbers are accurate (use most recent PDF)
- [ ] New citations are added to references.bib

**Troubleshooting:**

- **Line numbers changed**: Generate final PDF, use those line numbers
- **Change too extensive**: Break into smaller commits
- **Forgot what you changed**: Use `git diff` to see differences
- **Need to undo**: Use `git revert` or `git reset`

---

## Step 5: Format the Response Letter ⏱️ 15 minutes

### What You'll Do

Compile all your individual responses into a properly formatted response letter.

### Response Letter Template

```latex
\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\usepackage{xcolor}

\title{Response to Reviewers}
\author{} % Your names
\date{\today}

\begin{document}

\maketitle

\section*{Cover Letter}

We thank the Associate Editor and reviewers for their thoughtful and
constructive feedback on our manuscript, ``Bootstrap Methods for Causal
Mediation Analysis.'' We have carefully addressed all comments and believe
the manuscript is substantially improved as a result.

Major changes include:
\begin{itemize}
\item Expanded description of bootstrap procedure with algorithmic details
\item Added simulation comparison to existing methods (mediation package)
\item Included power analysis and sample size justification
\item Clarified notation and improved figure captions
\item Fixed all minor presentation issues
\end{itemize}

Below we provide detailed responses to each comment. Reviewer comments are
in \textcolor{blue}{blue}, and our responses follow. All page and line
numbers refer to the revised manuscript with track changes.

\newpage

\section*{Associate Editor}

\textbf{Comment:}

\textcolor{blue}{The reviewers have raised several important concerns about
the methodology and presentation. Please address all comments carefully.}

\textbf{Response:}

We have addressed all reviewer comments as detailed below. We believe the
manuscript is now clearer and more rigorous as a result of this revision.

\newpage

\section*{Reviewer 1}

\subsection*{Major Comments}

\textbf{Comment 1:}

\textcolor{blue}{The bootstrap procedure is not clearly described. How many
replicates were used? What confidence interval method (percentile, BCa,
studentized)? This is critical for reproducibility.}

\textbf{Response:}

We thank the reviewer for identifying this important omission...

[Continue with your full response from Step 3]

\textbf{Changes in Manuscript:}
\begin{itemize}
\item Page 8, Lines 156-172: Added new subsection ``Bootstrap Implementation''
\item Page 9, Lines 180-182: Specified $B = 5{,}000$ and percentile CI method
\item Table 1: Added bootstrap standard errors for comparison
\item Supplementary Section S2: Added R implementation code
\end{itemize}

\textbf{Comment 2:}

\textcolor{blue}{The simulation study does not compare your method...}

[Continue for all comments]

\newpage

\section*{Reviewer 2}

[Repeat structure for Reviewer 2]

\end{document}
```

**Save as:** `reviews/response-letter.tex`

### Compile and Check

```bash
# Compile the response letter
cd reviews/
pdflatex response-letter.tex
pdflatex response-letter.tex  # Run twice for references

# Open and review
open response-letter.pdf

# Check for:
# - All comments addressed
# - Consistent formatting
# - Correct page/line numbers
# - Professional tone throughout
# - No typos or errors
```

### Alternative: Markdown Format

Some journals prefer Word documents. Use Markdown:

```markdown
# Response to Reviewers

**Manuscript:** Bootstrap Methods for Causal Mediation Analysis
**Journal:** Biostatistics
**Date:** 2025-02-15

---

## Cover Letter

We thank the Associate Editor and reviewers for their thoughtful feedback...

[Same structure as LaTeX but in Markdown]

---

## Associate Editor

**Comment:**

> The reviewers have raised several important concerns...

**Response:**

We have addressed all reviewer comments...

---

## Reviewer 1

### Major Comments

**Comment 1:**

> The bootstrap procedure is not clearly described...

**Response:**

We thank the reviewer for identifying this important omission...

**Changes in Manuscript:**

- Page 8, Lines 156-172: Added new subsection "Bootstrap Implementation"
- Page 9, Lines 180-182: Specified B = 5,000 and percentile CI method
- Table 1: Added bootstrap standard errors for comparison
- Supplementary Section S2: Added R implementation code

[Continue...]
```

**Convert to Word:**

```bash
# Using pandoc
pandoc response-letter.md -o response-letter.docx --reference-doc=template.docx

# Or use Scholar's formatter
/research:format response-letter.md --to docx
```

### ✅ Checkpoint 5

- [ ] Response letter is complete
- [ ] All comments have responses
- [ ] Format matches journal requirements
- [ ] Page/line numbers are correct
- [ ] PDF/Word document is generated
- [ ] No formatting errors

---

## Step 6: Final Review and Submission ⏱️ 15 minutes

### Pre-Submission Checklist

#### Manuscript Changes

- [ ] All promised changes are made
- [ ] Track changes enabled (if required)
- [ ] Figures/tables updated
- [ ] References updated
- [ ] Supplementary materials revised
- [ ] Line numbers added (if required)
- [ ] PDF generated without errors

#### Response Letter

- [ ] Every comment has a response
- [ ] Page/line numbers verified
- [ ] Professional tone throughout
- [ ] No defensive language
- [ ] All citations included
- [ ] Formatting is clean
- [ ] PDF generated successfully

#### Supporting Documents

- [ ] Updated cover letter
- [ ] Revised supplementary materials
- [ ] New/updated figures
- [ ] Response letter PDF
- [ ] Manuscript PDF with changes highlighted
- [ ] All files named correctly per journal guidelines

### Git Final Commit

```bash
# Commit final version
git add .
git commit -m "Final revision addressing all reviewer comments"

# Tag the submission version
git tag -a v2.0-revision -m "Revision submitted 2025-02-15"

# Generate summary of changes
git diff v1.0-submission v2.0-revision > revision-changes.diff

# Archive the submission
git archive -o mediation-revision-2025-02-15.zip HEAD
```

### Upload to Journal System

1. Log into journal submission system
2. Navigate to manuscript
3. Click "Submit Revision"
4. Upload revised manuscript (with track changes if required)
5. Upload response letter
6. Upload supplementary materials
7. Update cover letter if needed
8. Review all uploads
9. Submit

### Celebrate!

You've completed a thorough, professional revision. This is hard work, and you should be proud.

---

## Common Pitfalls and How to Avoid Them

### 1. Being Too Brief

**Bad Example:**

> We have revised the methods section as suggested.

**Good Example:**

> We thank the reviewer for this suggestion. We have substantially expanded
> the methods section (page 8, lines 156-172) to include: (1) the number of
> bootstrap replicates (B = 5,000), (2) the confidence interval method
> (percentile), and (3) step-by-step algorithmic details. We also added R
> code to the supplementary materials (Section S2) for full reproducibility.

**Why it matters:** Editors need to verify you actually addressed concerns.

### 2. Being Defensive

**Bad Example:**

> The reviewer clearly didn't read our paper carefully. We already stated
> the sample size in the abstract.

**Good Example:**

> We apologize if our original presentation was unclear. While the sample
> size was mentioned in the abstract, we agree it deserves more prominent
> placement. We have added it to the first paragraph of the methods section
> (page 7, line 128) and included power calculations (Supplementary S4) to
> justify this choice.

**Why it matters:** Defensive responses alienate reviewers and editors.

### 3. Ignoring "Minor" Comments

**Bad Example:**

> [No response to typo corrections]

**Good Example:**

> We thank the reviewer for these careful corrections. We have fixed all
> typos (lines 45, 127, 234, 456) and reformatted Table 2 for clarity.

**Why it matters:** Ignoring even small comments looks careless.

### 4. Vague Change Descriptions

**Bad Example:**

> We have improved the figure caption.

**Good Example:**

> We have revised the Figure 1 caption to define all abbreviations (NIE =
> natural indirect effect, NDE = natural direct effect, TE = total effect)
> and clarify that error bars represent 95% bootstrap confidence intervals.

**Why it matters:** Specificity shows thoroughness and helps editor verify.

### 5. Over-Promising

**Bad Example:**

> We will conduct an entirely new study with n = 500 to address this concern.

**Good Example:**

> While a larger replication study would be valuable, it is beyond the scope
> of this manuscript. We have instead: (1) added power calculations showing
> n = 150 is adequate (Supplementary S4), (2) acknowledged this limitation
> (page 15, lines 320-328), and (3) suggested replication as future research.

**Why it matters:** Only promise what you can deliver in this revision.

### 6. Missing Page Numbers

**Bad Example:**

> We have revised the methods section.

**Good Example:**

> We have revised the methods section (page 8, lines 156-172) to clarify
> the bootstrap procedure.

**Why it matters:** Editors verify your changes. Make it easy for them.

---

## Advanced Techniques

### Handling Multiple Rounds of Review

If you receive second-round reviews:

```markdown
# Response to Reviewers - Round 2

## Changes Since Round 1

In our first revision, we:
1. Clarified the bootstrap procedure (R1.1)
2. Added method comparisons (R1.2)
3. Included power analysis (R2.1)

We thank the reviewers for their continued feedback. Below we address
the remaining concerns.

## Reviewer 1

**Comment 1 (Round 2):**

> The new simulation results are helpful. However, the comparison to PROCESS
> would still be valuable.

**Response:**

We appreciate the reviewer's persistence on this point. As noted in Round 1,
PROCESS is SPSS-based and not directly comparable in our R framework.
However, we have added a paragraph (page 10, lines 205-212) discussing
conceptual similarities and differences between our approach and PROCESS,
with citations to Hayes (2018) for readers interested in that implementation.

[Continue...]
```

### Creating a Summary Table

For complex revisions, add a summary table at the beginning:

```latex
\begin{table}[h]
\centering
\caption{Summary of Major Changes}
\begin{tabular}{|l|l|p{6cm}|}
\hline
\textbf{Reviewer} & \textbf{Comment} & \textbf{Action Taken} \\
\hline
R1.1 & Bootstrap procedure & Expanded methods (p.8), added code (Supp. S2) \\
R1.2 & Method comparisons & Added simulation study (p.10, Table 3) \\
R1.3 & Power analysis & Added to supplementary (S4) \\
R2.1 & Sensitivity analysis & Added discussion (p.9), plots (Supp. S3) \\
R2.2 & Sample size & Justified with power analysis \\
\hline
\end{tabular}
\end{table}
```

### Dealing with Contradictory Reviewers

When reviewers disagree:

```markdown
**Response to Contradictory Comments:**

We note that Reviewer 1 suggested expanding the methods section while
Reviewer 2 suggested moving details to supplementary materials. We have
attempted to balance these concerns by:

1. Keeping essential methodological details in the main text (page 8)
2. Moving implementation specifics to supplementary materials (Section S2)
3. Ensuring both the main text and supplement are self-contained

We believe this approach satisfies both reviewers' concerns while maintaining
readability.
```

### Using Scholar's Integration Features

**Link related commands:**

```bash
# Find supporting literature
/research:bib:search "bootstrap mediation confidence intervals"

# Generate methods revision
/research:manuscript:methods "bootstrap with percentile CI"

# Draft response
/research:manuscript:reviewer --comment "R1.1" --with-citations

# Format for submission
/research:format response-letter.md --to pdf --style apa
```

---

## Troubleshooting Guide

### Problem: Reviewer misunderstood your method

**Solution:**

1. Don't assume bad faith
2. Explain more clearly in response
3. Add clarifying text to manuscript
4. Use analogies or examples
5. Add a schematic figure if helpful

**Example response:**

> We apologize for the confusion. To clarify: our method differs from
> traditional mediation analysis in that [clear explanation]. We have
> revised the introduction (page 4, lines 75-82) to emphasize this
> distinction and added Figure 1 to illustrate the conceptual framework.

### Problem: Requested analysis is impossible

**Solution:**

1. Explain why it's infeasible
2. Offer alternative that addresses the concern
3. Acknowledge value of suggestion for future work

**Example response:**

> We appreciate this suggestion. However, implementing this analysis would
> require [specific reason why impossible: e.g., data not available, method
> not yet developed, computational infeasibility]. As an alternative, we
> have [alternative analysis] which addresses the underlying concern about
> [issue]. We have added this to supplementary materials (Section S5).

### Problem: Major revision would require new data

**Solution:**

1. Acknowledge limitation
2. Add limitation paragraph to manuscript
3. Suggest as future research
4. Show current data are still valuable

**Example response:**

> We agree that longitudinal data would strengthen causal claims. However,
> our study was cross-sectional and additional data collection is not
> feasible. We have: (1) added a limitation paragraph discussing this
> (page 15, lines 325-335), (2) softened causal language throughout,
> and (3) suggested longitudinal replication as critical future work.
> We believe the current results still contribute valuable insights about
> [specific contribution].

### Problem: Running out of time before deadline

**Priority order:**

1. Major methodological concerns (must address fully)
2. Major presentation issues (must address fully)
3. Minor substantive comments (brief but complete responses)
4. Formatting/typos (quick fixes)
5. Editorial suggestions (can note "will implement in proofs")

**Consider requesting extension:**

> Dear Dr. Editor,
>
> I am writing to request a brief extension on the revision deadline for
> manuscript #12345. The reviewers have raised important methodological
> concerns that require additional analyses (power calculations and
> sensitivity analyses). I am confident I can address all comments
> thoroughly with an additional two weeks. Would a deadline of March 1
> be acceptable?

---

## Integration with Other Scholar Commands

### Complete Workflow

```bash
# 1. Parse review
/research:manuscript:reviewer reviews/review-2025-01-15.txt

# 2. Find supporting citations for responses
/research:bib:search "bootstrap mediation"
/research:doi "10.1037/met0000086"

# 3. Revise methods section
/research:manuscript:methods "bootstrap with percentile CI and sensitivity"

# 4. Add new results
/research:manuscript:results "power analysis for mediation"

# 5. Update bibliography
/research:bib:format references.bib --style apa --sort author

# 6. Generate response letter
/research:format response-draft.md --to pdf --template response-letter

# 7. Check for completeness
/research:validate response-letter.pdf --check-all-comments-addressed
```

### Links to Related Tutorials

- [Writing Methods Sections](methods-section.md) - Detailed guide for methods
- [Manuscript Writing](manuscript-writing.md) - Full manuscript workflow
- [Literature Search](first-literature-search.md) - Finding citations

---

## Summary

You've learned how to:

✅ Organize reviewer comments systematically
✅ Categorize feedback (accept/modify/disagree)
✅ Use `/research:manuscript:reviewer` effectively
✅ Draft professional responses with proper tone
✅ Revise manuscripts based on feedback
✅ Track changes with git version control
✅ Format complete response letters
✅ Handle complex situations (contradictions, disagreements)
✅ Avoid common pitfalls
✅ Submit successful revisions

## Next Steps

1. **Practice**: Try drafting responses to hypothetical reviews
2. **Read examples**: Study published response letters (some journals post them)
3. **Get feedback**: Have advisor or colleague review your response draft
4. **Build templates**: Save your response letter template for future use
5. **Track outcomes**: Note which response strategies worked best

## Additional Resources

### Recommended Reading

- [How to respond to peer review](https://www.nature.com/articles/d41586-020-03394-y) (Nature Career Column)
- [The Reviewer's Guide to Reviewing](https://www.cell.com/cell/pdf/S0092-8674(20)30248-5.pdf)
- [Responding to Reviewers](https://authorservices.wiley.com/Reviewers/journal-reviewers/how-to-perform-a-peer-review/responding-to-reviewers.html) (Wiley)

### Scholar Documentation

- [Research Commands Reference](../../research/RESEARCH-COMMANDS-REFERENCE.md)
- [Manuscript Commands](../../research/MANUSCRIPT-COMMANDS.md)
- [Examples: Reviewer Responses](../../examples/reviewer-responses.md)

### Tools

- Git for version control: https://git-scm.com
- LaTeX for response letters: https://www.overleaf.com
- Pandoc for format conversion: https://pandoc.org

---

**Tutorial created:** 2026-02-01
**Scholar version:** 2.6.0
**Maintainer:** Data-Wise team

**Feedback:** Found an issue or have suggestions? [Open an issue](https://github.com/Data-Wise/scholar/issues)
