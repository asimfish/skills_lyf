# Command Chaining for Research

Advanced workflows combining multiple Scholar commands to create powerful research pipelines.

**Time to Master:** 1-2 weeks of practice
**Difficulty:** Advanced
**Prerequisites:** Familiarity with all Scholar research commands, shell piping concepts
**Output:** Complex, automated research workflows

---

## Navigation

- [Overview](#overview)
- [Basic Chaining Patterns](#basic-chaining-patterns)
- [Research Lifecycle Chains](#research-lifecycle-chains)
- [Error Handling](#error-handling)
- [flow-cli Integration Patterns](#flow-cli-integration-patterns)
- [Advanced Techniques](#advanced-techniques)
- [Real-World Examples](#real-world-examples)

---

## Overview

### What is Command Chaining?

Command chaining links multiple Scholar commands to create workflows where:

- **Output from one command** feeds into the next
- **Decisions are made** based on intermediate results
- **Complex pipelines** automate multi-step processes
- **Error recovery** handles failures gracefully

### Benefits of Chaining

| Benefit | Example |
|---------|---------|
| **Efficiency** | Literature → Gap Analysis → Hypothesis in one script |
| **Consistency** | Same workflow every project |
| **Reproducibility** | Document entire pipeline |
| **Error Reduction** | Automated validation at each step |
| **Scalability** | Handle 100 papers as easily as 1 |

### Command Chain Categories

**1. Linear Chains** - Sequential steps, A → B → C

```bash
/research:arxiv "topic" | extract_dois | /research:doi | /research:bib:add
```

**2. Conditional Chains** - Branching logic based on results

```bash
if papers_found; then
  analyze_gaps
else
  expand_search
fi
```

**3. Parallel Chains** - Multiple independent paths

```bash
/research:arxiv "topic1" &
/research:arxiv "topic2" &
/research:arxiv "topic3" &
wait
```

**4. Iterative Chains** - Loops until condition met

```bash
while not_enough_papers; do
  expand_search_terms
done
```

---

## Basic Chaining Patterns

### Pattern 1: Literature → Analysis

**Chain: Discover papers → Get citations → Add to bibliography**

```bash
#!/bin/bash
# literature-to-bibliography.sh

TOPIC="$1"

# Step 1: Search arXiv
echo "Searching arXiv for: $TOPIC"
/research:arxiv "$TOPIC" > search-results.md

# Step 2: Extract DOIs
echo "Extracting DOIs..."
grep "DOI:" search-results.md | \
  cut -d' ' -f2 > dois.txt

# Step 3: Lookup each DOI
echo "Fetching citations..."
while read doi; do
  echo "  Processing: $doi"
  /research:doi "$doi" > temp-citation.txt

  # Extract BibTeX
  sed -n '/@article{/,/^}$/p' temp-citation.txt > temp-entry.bib

  # Add to bibliography
  if [ -s temp-entry.bib ]; then
    /research:bib:add temp-entry.bib references.bib
    echo "    Added to bibliography"
  fi

  rm temp-citation.txt temp-entry.bib
done < dois.txt

echo "Complete! $(wc -l < dois.txt) papers processed"
```

**Usage:**

```bash
./literature-to-bibliography.sh "bootstrap mediation confidence intervals"
```

### Pattern 2: Gap Analysis → Hypothesis → Study Design

**Chain: Identify gaps → Generate hypotheses → Create analysis plan**

```bash
#!/bin/bash
# gap-to-design.sh

TOPIC="$1"
OUTPUT_DIR="research-design-$(date +%Y%m%d)"

mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Step 1: Gap analysis
echo "Step 1: Analyzing literature gaps..."
/research:lit-gap "$TOPIC Current work shows [summary]. Gaps include: [list gaps]" > gap-analysis.md

# Extract top gap (first one mentioned)
TOP_GAP=$(grep -A 5 "Gap 1:" gap-analysis.md)

# Step 2: Generate hypothesis
echo "Step 2: Generating hypothesis..."
/research:hypothesis "$TOP_GAP" > hypothesis.md

# Extract hypothesis statement for analysis plan
HYPOTHESIS=$(grep -A 10 "Primary Hypothesis" hypothesis.md)

# Step 3: Create analysis plan
echo "Step 3: Creating analysis plan..."
/research:analysis-plan "$HYPOTHESIS. Study design: [simulation/empirical]. Sample sizes: [specify]. Metrics: [list]." > analysis-plan.md

# Step 4: Scout methods
echo "Step 4: Scouting methods..."
METHOD_TOPIC=$(echo "$TOPIC" | head -c 50)
/research:method-scout "$METHOD_TOPIC" > methods-scout.md

# Generate summary
cat > DESIGN-SUMMARY.md << EOF
# Research Design Summary

**Topic:** $TOPIC
**Date:** $(date +%Y-%m-%d)

## Files Generated
1. \`gap-analysis.md\` - Literature gaps identified
2. \`hypothesis.md\` - Testable hypotheses
3. \`analysis-plan.md\` - Statistical analysis plan
4. \`methods-scout.md\` - Available methods

## Next Steps
1. Review gap analysis, select focus gap
2. Refine hypothesis based on feasibility
3. Implement analysis plan
EOF

echo "Design complete: $OUTPUT_DIR/DESIGN-SUMMARY.md"
```

### Pattern 3: Simulation → Results → Manuscript

**Chain: Design simulation → Run analysis → Write results → Draft methods**

```bash
#!/bin/bash
# simulation-to-draft.sh

RESULTS_FILE="$1"

if [ ! -f "$RESULTS_FILE" ]; then
  echo "Usage: $0 <simulation-results.csv>"
  exit 1
fi

OUTPUT_DIR="manuscript-draft"
mkdir -p "$OUTPUT_DIR"

# Step 1: Analyze simulation results
echo "Step 1: Analyzing simulation results..."
/research:simulation:analysis "$RESULTS_FILE" > analysis-report.md

# Step 2: Extract key findings
FINDINGS=$(grep -A 20 "## Performance Summary" analysis-report.md)

# Step 3: Generate results section
echo "Step 2: Writing results section..."
/research:manuscript:results "$FINDINGS Primary metric: MSE. Secondary: coverage, bias. Findings: [summarize]" > "$OUTPUT_DIR/results-section.md"

# Step 4: Generate methods section (from analysis plan)
if [ -f "analysis-plan.md" ]; then
  echo "Step 3: Writing methods section..."
  DESIGN=$(cat analysis-plan.md)
  /research:manuscript:methods "$DESIGN" > "$OUTPUT_DIR/methods-section.md"
fi

# Step 5: Create manuscript shell
cat > "$OUTPUT_DIR/manuscript-draft.md" << 'EOF'
# [Title]

## Abstract
[To be written]

## Introduction
[To be written]

## Methods
EOF

cat "$OUTPUT_DIR/methods-section.md" >> "$OUTPUT_DIR/manuscript-draft.md"

cat >> "$OUTPUT_DIR/manuscript-draft.md" << 'EOF'

## Results
EOF

cat "$OUTPUT_DIR/results-section.md" >> "$OUTPUT_DIR/manuscript-draft.md"

cat >> "$OUTPUT_DIR/manuscript-draft.md" << 'EOF'

## Discussion
[To be written]

## References
[From references.bib]
EOF

echo "Manuscript draft complete: $OUTPUT_DIR/manuscript-draft.md"
```

---

## Research Lifecycle Chains

### Complete Research Pipeline: Idea → Publication

**Full chain: Literature search → Gap analysis → Hypothesis → Design → Analysis → Manuscript → Submission**

```bash
#!/bin/bash
# complete-research-pipeline.sh

TOPIC="$1"

if [ -z "$TOPIC" ]; then
  echo "Usage: $0 '<research topic>'"
  exit 1
fi

PROJECT_NAME=$(echo "$TOPIC" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
PROJECT_DIR="$HOME/research/$PROJECT_NAME"

echo "========================================="
echo "Complete Research Pipeline"
echo "Topic: $TOPIC"
echo "========================================="

# Phase 1: Literature Review (Week 1)
echo ""
echo "PHASE 1: Literature Review"
echo "--------------------------"
mkdir -p "$PROJECT_DIR/literature"
cd "$PROJECT_DIR"

# 1.1: Search arXiv
echo "  [1/4] Searching arXiv..."
/research:arxiv "$TOPIC" > literature/arxiv-search.md
PAPERS_FOUND=$(grep -c "=== Paper" literature/arxiv-search.md)
echo "    Found $PAPERS_FOUND papers"

# 1.2: Extract and collect DOIs
echo "  [2/4] Collecting citations..."
grep "DOI:" literature/arxiv-search.md | cut -d' ' -f2 | head -20 > literature/dois.txt

while read doi; do
  /research:doi "$doi" > temp-citation.txt
  sed -n '/@article{/,/^}$/p' temp-citation.txt > temp-entry.bib
  [ -s temp-entry.bib ] && /research:bib:add temp-entry.bib references.bib
  rm temp-citation.txt temp-entry.bib
done < literature/dois.txt

CITATIONS=$(grep -c '@' references.bib)
echo "    Added $CITATIONS citations"

# 1.3: Gap analysis
echo "  [3/4] Analyzing gaps..."
/research:lit-gap "$TOPIC [based on $PAPERS_FOUND papers searched]. Current methods: [summarize]. Limitations: [list]. Opportunities: [identify]" > literature/gap-analysis.md

# 1.4: Select focus gap
FOCUS_GAP=$(sed -n '/### Gap 1/,/### Gap 2/p' literature/gap-analysis.md | head -20)
echo "    Gap identified"

# Phase 2: Study Design (Week 2)
echo ""
echo "PHASE 2: Study Design"
echo "---------------------"
mkdir -p "$PROJECT_DIR/design"

# 2.1: Generate hypotheses
echo "  [1/3] Generating hypotheses..."
/research:hypothesis "$FOCUS_GAP Target power: 0.80. Expected effect size: medium (d=0.5)." > design/hypotheses.md

# 2.2: Create analysis plan
echo "  [2/3] Creating analysis plan..."
HYPOTHESIS=$(sed -n '/## Primary Hypothesis/,/## Secondary/p' design/hypotheses.md)
/research:analysis-plan "$HYPOTHESIS Study type: Monte Carlo simulation. Conditions: 3 sample sizes × 2 methods. Replications: 1000. Primary metric: MSE. Analysis: Two-way ANOVA." > design/analysis-plan.md

# 2.3: Scout methods
echo "  [3/3] Scouting methods..."
/research:method-scout "$TOPIC R packages and implementations" > design/methods-available.md

# Phase 3: Implementation (Week 3-4)
echo ""
echo "PHASE 3: Implementation"
echo "-----------------------"
mkdir -p "$PROJECT_DIR/analysis"

# 3.1: Generate simulation design
echo "  [1/2] Designing simulation..."
/research:simulation:design "$(cat design/analysis-plan.md | head -50)" > analysis/simulation-design.md

# 3.2: Create placeholder for results
echo "  [2/2] Setting up analysis directory..."
mkdir -p results/{figures,tables}
touch results/simulation-results.csv

# Phase 4: Analysis (Week 5)
echo ""
echo "PHASE 4: Analysis"
echo "-----------------"
echo "  NOTE: Run simulation manually, then continue with:"
echo "    ./complete-research-pipeline.sh --analyze results/simulation-results.csv"

# Phase 5: Writing (Week 6-8)
echo ""
echo "PHASE 5: Manuscript Writing"
echo "---------------------------"
mkdir -p "$PROJECT_DIR/manuscript"

# 5.1: Generate methods section
echo "  [1/3] Writing methods section..."
/research:manuscript:methods "$(cat design/analysis-plan.md)" > manuscript/methods-section.md

# 5.2: Placeholder for results (after analysis)
echo "  [2/3] Results section placeholder..."
echo "[Run analysis first, then generate with /research:manuscript:results]" > manuscript/results-section.md

# 5.3: Create manuscript template
echo "  [3/3] Creating manuscript template..."
cat > manuscript/manuscript.md << 'TEMPLATE'
# [Title]

## Abstract
[150-250 words]

## Introduction
### Background
[Literature review from literature/]

### Research Gap
[From literature/gap-analysis.md]

### Study Objectives
[From design/hypotheses.md]

## Methods
TEMPLATE

cat manuscript/methods-section.md >> manuscript/manuscript.md

cat >> manuscript/manuscript.md << 'TEMPLATE'

## Results
[Include after analysis]

## Discussion
### Main Findings
[Summarize]

### Implications
[Theory and practice]

### Limitations
[Acknowledge]

### Future Directions
[Based on findings]

## References
[From references.bib]
TEMPLATE

# Phase 6: Finalization
echo ""
echo "PHASE 6: Project Structure"
echo "--------------------------"

# Create README
cat > README.md << EOF
# $PROJECT_NAME

**Created:** $(date +%Y-%m-%d)
**Topic:** $TOPIC
**Status:** Analysis phase

## Project Structure
- \`literature/\`: Literature search, gap analysis ($CITATIONS papers)
- \`design/\`: Hypotheses, analysis plan, methods
- \`analysis/\`: Simulation design, analysis scripts
- \`results/\`: Simulation results, figures, tables
- \`manuscript/\`: Draft manuscript sections

## Timeline
- Week 1: Literature review (COMPLETE)
- Week 2: Study design (COMPLETE)
- Week 3-4: Implementation (IN PROGRESS)
- Week 5: Analysis (PENDING)
- Week 6-8: Writing (PENDING)

## Next Steps
1. Review \`literature/gap-analysis.md\`
2. Refine \`design/hypotheses.md\` if needed
3. Implement simulation from \`analysis/simulation-design.md\`
4. Run analysis and save to \`results/simulation-results.csv\`
5. Continue pipeline with: ./complete-research-pipeline.sh --analyze results/simulation-results.csv
EOF

# Initialize git
git init
cat > .gitignore << 'GITIGNORE'
# Results
*.rds
*.RData

# Temp files
temp-*
*~

# OS
.DS_Store
GITIGNORE

git add .
git commit -m "Initial project setup via complete-research-pipeline.sh"

echo ""
echo "========================================="
echo "Pipeline Setup Complete!"
echo "========================================="
echo "Project directory: $PROJECT_DIR"
echo ""
echo "Generated:"
echo "  - Literature review ($PAPERS_FOUND papers, $CITATIONS citations)"
echo "  - Gap analysis"
echo "  - Hypotheses"
echo "  - Analysis plan"
echo "  - Simulation design"
echo "  - Manuscript template"
echo ""
echo "Next: Implement and run simulation"
echo "  cd $PROJECT_DIR"
echo "  # Implement simulation from analysis/simulation-design.md"
echo "  # Save results to results/simulation-results.csv"
echo "  # Then continue: ./complete-research-pipeline.sh --analyze results/simulation-results.csv"
```

**Usage:**

```bash
./complete-research-pipeline.sh "Bootstrap confidence intervals for small sample mediation analysis"
```

---

## Error Handling

### Pattern: Try-Catch-Retry

**Handle failures gracefully:**

```bash
#!/bin/bash
# robust-doi-lookup.sh

DOI="$1"
MAX_RETRIES=3
RETRY_DELAY=5

for attempt in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $attempt/$MAX_RETRIES: Fetching DOI $DOI"

  # Try to fetch
  OUTPUT=$(/research:doi "$DOI" 2>&1)
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ] && echo "$OUTPUT" | grep -q "@article{"; then
    # Success
    echo "$OUTPUT"
    exit 0
  else
    # Failure
    echo "  Failed: $(echo $OUTPUT | head -1)"

    if [ $attempt -lt $MAX_RETRIES ]; then
      echo "  Retrying in $RETRY_DELAY seconds..."
      sleep $RETRY_DELAY
    fi
  fi
done

echo "ERROR: Failed to fetch DOI after $MAX_RETRIES attempts"
exit 1
```

### Pattern: Validate-Then-Proceed

**Check results before continuing:**

```bash
#!/bin/bash
# validated-literature-pipeline.sh

TOPIC="$1"

# Step 1: Search
/research:arxiv "$TOPIC" > search-results.md

# Validate: Did we find papers?
PAPERS=$(grep -c "=== Paper" search-results.md)

if [ $PAPERS -eq 0 ]; then
  echo "ERROR: No papers found for topic: $TOPIC"
  echo "Suggestions:"
  echo "  - Broaden search terms"
  echo "  - Check spelling"
  echo "  - Try related terms"
  exit 1
fi

echo "Found $PAPERS papers"

# Step 2: Extract DOIs
grep "DOI:" search-results.md | cut -d' ' -f2 > dois.txt

# Validate: Did we find DOIs?
DOIS=$(wc -l < dois.txt)

if [ $DOIS -eq 0 ]; then
  echo "WARNING: No DOIs found in results"
  echo "  Papers found but may be preprints without DOIs"
  echo "  Consider manual citation entry"
  exit 1
fi

echo "Extracted $DOIS DOIs"

# Step 3: Process (only if validation passed)
echo "Proceeding with citation collection..."
# ... continue pipeline
```

### Pattern: Checkpoint-Resume

**Save progress and resume on failure:**

```bash
#!/bin/bash
# resumable-pipeline.sh

CHECKPOINT_DIR=".pipeline-checkpoints"
mkdir -p "$CHECKPOINT_DIR"

# Function to save checkpoint
checkpoint() {
  local step="$1"
  local data="$2"
  echo "$data" > "$CHECKPOINT_DIR/$step.done"
  echo "  Checkpoint saved: $step"
}

# Function to check if step completed
is_completed() {
  local step="$1"
  [ -f "$CHECKPOINT_DIR/$step.done" ]
}

# Pipeline with checkpoints

# Step 1: Literature search
if ! is_completed "search"; then
  echo "Step 1: Searching literature..."
  /research:arxiv "topic" > search-results.md
  checkpoint "search" "$(date)"
else
  echo "Step 1: Skipped (already completed)"
fi

# Step 2: Gap analysis
if ! is_completed "gap-analysis"; then
  echo "Step 2: Gap analysis..."
  /research:lit-gap "..." > gap-analysis.md
  checkpoint "gap-analysis" "$(date)"
else
  echo "Step 2: Skipped (already completed)"
fi

# Step 3: Hypothesis generation
if ! is_completed "hypothesis"; then
  echo "Step 3: Generating hypotheses..."
  /research:hypothesis "..." > hypotheses.md
  checkpoint "hypothesis" "$(date)"
else
  echo "Step 3: Skipped (already completed)"
fi

echo "Pipeline complete or resumed successfully"

# Clean checkpoints after full success
rm -rf "$CHECKPOINT_DIR"
```

---

## flow-cli Integration Patterns

### Pattern: Unified Scholar/flow Commands

**Seamless integration with project workflow:**

```bash
# ~/.config/flow-cli/extensions/scholar-integration.sh

# Override flow research commands to use Scholar

flow_research_search() {
  local topic="$*"

  # Use Scholar for search
  /research:arxiv "$topic" | tee research/arxiv-search-$(date +%Y%m%d).md

  # Auto-extract DOIs and prompt to collect
  local dois=$(grep "DOI:" research/arxiv-search-*.md | tail -50 | cut -d' ' -f2)
  local doi_count=$(echo "$dois" | wc -l)

  echo ""
  echo "Found $doi_count papers with DOIs"
  read -p "Collect citations? (y/n) " response

  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "$dois" | while read doi; do
      /research:doi "$doi" > temp.txt
      sed -n '/@article{/,/^}$/p' temp.txt > temp.bib
      [ -s temp.bib ] && /research:bib:add temp.bib references.bib
      rm temp.txt temp.bib
    done
    echo "Citations collected!"
  fi
}

flow_research_gap() {
  local context="$*"

  # Generate gap analysis
  /research:lit-gap "$context" | tee research/gap-analysis-$(date +%Y%m%d).md

  # Auto-generate hypotheses for top gap
  echo ""
  read -p "Generate hypotheses for top gap? (y/n) " response

  if [[ "$response" =~ ^[Yy]$ ]]; then
    local top_gap=$(sed -n '/### Gap 1/,/### Gap 2/p' research/gap-analysis-*.md | head -20)
    /research:hypothesis "$top_gap" > research/hypotheses-$(date +%Y%m%d).md
    echo "Hypotheses generated!"
  fi
}

flow_research_design() {
  local study="$*"

  # Create complete study design
  /research:analysis-plan "$study" > design/analysis-plan.md
  /research:simulation:design "$(cat design/analysis-plan.md)" > design/simulation-design.md
  /research:method-scout "$study" > design/methods-scout.md

  echo "Study design complete:"
  echo "  - design/analysis-plan.md"
  echo "  - design/simulation-design.md"
  echo "  - design/methods-scout.md"
}

flow_research_manuscript() {
  local results_file="$1"

  # Generate manuscript sections from results
  if [ ! -f "$results_file" ]; then
    echo "ERROR: Results file not found: $results_file"
    return 1
  fi

  /research:simulation:analysis "$results_file" > analysis-report.md

  local findings=$(grep -A 20 "Performance Summary" analysis-report.md)

  /research:manuscript:results "$findings" > manuscript/results-section.md
  /research:manuscript:methods "$(cat design/analysis-plan.md 2>/dev/null || echo '[Methods TBD]')" > manuscript/methods-section.md

  echo "Manuscript sections generated:"
  echo "  - manuscript/methods-section.md"
  echo "  - manuscript/results-section.md"
}
```

**Usage with flow-cli:**

```bash
flow research search "causal mediation"
flow research gap "causal mediation literature shows..."
flow research design "Bootstrap comparison study"
flow research manuscript results/simulation-results.csv
```

---

## Advanced Techniques

### Technique 1: Parallel Command Execution

**Run multiple Scholar commands simultaneously:**

```bash
#!/bin/bash
# parallel-literature-collection.sh

TOPICS=(
  "causal mediation"
  "bootstrap confidence intervals"
  "sensitivity analysis"
)

# Launch searches in parallel
for topic in "${TOPICS[@]}"; do
  (
    echo "Searching: $topic"
    /research:arxiv "$topic" > "search-${topic// /-}.md"
  ) &
done

# Wait for all to complete
wait

echo "All searches complete!"

# Combine results
cat search-*.md > combined-search-results.md
echo "Combined $(grep -c '=== Paper' combined-search-results.md) papers"
```

### Technique 2: Dynamic Parameter Generation

**Chain commands where output determines next input:**

```bash
#!/bin/bash
# adaptive-hypothesis-generation.sh

TOPIC="$1"

# Step 1: Gap analysis
/research:lit-gap "$TOPIC" > gap-analysis.md

# Step 2: Extract all gaps
GAPS=$(grep -oP '(?<=### Gap \d: ).*' gap-analysis.md)

# Step 3: Generate hypothesis for each gap
GAP_NUM=1
echo "$GAPS" | while read gap_title; do
  echo "Generating hypothesis for: $gap_title"

  # Extract full gap description
  GAP_DESC=$(sed -n "/### Gap $GAP_NUM:/,/### Gap $((GAP_NUM+1)):/p" gap-analysis.md)

  # Generate hypothesis
  /research:hypothesis "$GAP_DESC" > "hypothesis-gap${GAP_NUM}.md"

  ((GAP_NUM++))
done

echo "Generated hypotheses for all identified gaps"
```

### Technique 3: Conditional Chaining

**Branch based on intermediate results:**

```bash
#!/bin/bash
# conditional-research-pipeline.sh

TOPIC="$1"

# Search
/research:arxiv "$TOPIC" > search-results.md
PAPERS=$(grep -c "=== Paper" search-results.md)

if [ $PAPERS -lt 10 ]; then
  echo "Few papers found ($PAPERS). Expanding search..."

  # Broaden search
  BROAD_TOPIC=$(echo "$TOPIC" | awk '{print $1, $2}')  # First 2 words
  /research:arxiv "$BROAD_TOPIC" > search-results-broad.md

  PAPERS_BROAD=$(grep -c "=== Paper" search-results-broad.md)
  echo "Broader search found $PAPERS_BROAD papers"

  if [ $PAPERS_BROAD -gt 50 ]; then
    echo "Too many results. Running gap analysis to focus..."
    /research:lit-gap "$BROAD_TOPIC. Need to narrow focus." > gap-analysis.md
    # User reviews gap-analysis.md and refines search
  fi
elif [ $PAPERS -gt 100 ]; then
  echo "Many papers found ($PAPERS). Narrowing scope..."

  # Suggest narrowing
  echo "Consider adding specificity:"
  echo "  - Sample size constraints (e.g., 'small samples')"
  echo "  - Statistical properties (e.g., 'Type I error')"
  echo "  - Application domain (e.g., 'clinical trials')"

else
  echo "Good number of papers ($PAPERS). Proceeding with analysis..."
  /research:lit-gap "$TOPIC" > gap-analysis.md
fi
```

### Technique 4: Feedback Loops

**Iterative refinement:**

```bash
#!/bin/bash
# iterative-hypothesis-refinement.sh

TOPIC="$1"
MAX_ITERATIONS=3

for iteration in $(seq 1 $MAX_ITERATIONS); do
  echo "Iteration $iteration"

  # Generate hypothesis
  /research:hypothesis "$TOPIC" > hypothesis-v${iteration}.md

  # Extract testability score (if included in output)
  # TESTABLE=$(grep "Testability:" hypothesis-v${iteration}.md | grep -oP '\d+')

  # Simulating testability check
  TESTABLE=$((50 + iteration * 15))

  echo "  Testability score: $TESTABLE%"

  if [ $TESTABLE -gt 80 ]; then
    echo "  Hypothesis sufficiently testable!"
    cp hypothesis-v${iteration}.md hypothesis-final.md
    break
  else
    echo "  Refining hypothesis..."
    # Add constraints for next iteration
    TOPIC="$TOPIC [more specific: add sample size, effect size, metrics]"
  fi
done

echo "Final hypothesis: hypothesis-final.md"
```

---

## Real-World Examples

### Example 1: Meta-Analysis Workflow

**Complete chain: Search → Screen → Extract → Meta-analyze**

```bash
#!/bin/bash
# meta-analysis-workflow.sh

TOPIC="$1"

echo "=== Meta-Analysis Workflow ==="

# Phase 1: Literature collection
echo "Phase 1: Literature collection"
/research:arxiv "$TOPIC meta-analysis" > search-results.md
grep "DOI:" search-results.md | cut -d' ' -f2 > dois.txt

echo "  Found $(wc -l < dois.txt) papers with DOIs"

# Phase 2: Collect citations
echo "Phase 2: Collecting citations"
while read doi; do
  /research:doi "$doi" > temp.txt
  sed -n '/@article{/,/^}$/p' temp.txt > temp.bib
  [ -s temp.bib ] && /research:bib:add temp.bib references.bib
  rm temp.txt temp.bib
done < dois.txt

# Phase 3: Screen titles (manual, but scripted template)
echo "Phase 3: Title screening"
grep '@article{' references.bib | sed 's/@article{//' | sed 's/,//' > citation-keys.txt

cat > screening-template.csv << 'CSV'
Citation_Key,Title,Include,Exclude,Reason
CSV

while read key; do
  TITLE=$(grep -A 5 "^@article{$key," references.bib | grep "title" | cut -d'{' -f2 | cut -d'}' -f1)
  echo "$key,\"$TITLE\",,,\"\"" >> screening-template.csv
done < citation-keys.txt

echo "  Screening template: screening-template.csv"
echo "  Review and mark Include/Exclude columns"

# Phase 4: Extract data (after manual screening)
# (Placeholder for manual data extraction)

echo ""
echo "Next steps:"
echo "  1. Complete screening-template.csv"
echo "  2. Extract effect sizes from included papers"
echo "  3. Run meta-analysis with R metafor package"
```

### Example 2: Rapid Review for Grant Proposal

**Fast chain: Search → Summarize → Generate hypotheses → Draft proposal**

```bash
#!/bin/bash
# rapid-grant-proposal.sh

TOPIC="$1"
DUE_DATE="$2"

echo "Rapid Grant Proposal Pipeline"
echo "Topic: $TOPIC"
echo "Due: $DUE_DATE"
echo ""

# Day 1: Literature
echo "[Day 1] Literature review"
/research:arxiv "$TOPIC" --recent --max 20 > literature-recent.md

# Extract top 10 most relevant (by recency)
head -500 literature-recent.md > literature-top10.md

# Day 2: Gap analysis
echo "[Day 2] Gap analysis"
/research:lit-gap "$TOPIC Recent literature ($(grep -c '=== Paper' literature-top10.md) papers) shows [summarize findings]. Identify high-impact gaps for 3-year R01 proposal." > gap-analysis.md

# Extract innovation opportunity
INNOVATION=$(sed -n '/## Summary:/,//p' gap-analysis.md | head -20)

# Day 3: Aims
echo "[Day 3] Generating aims"
/research:hypothesis "$INNOVATION Target: 3-year R01. Aims: Generate 2-3 specific aims addressing identified gaps." > specific-aims.md

# Day 4: Methods overview
echo "[Day 4] Methods overview"
/research:method-scout "$TOPIC" > methods-available.md

# Extract recommended methods
METHODS=$(grep -A 10 "Recommended" methods-available.md)

# Day 5: Draft proposal shell
echo "[Day 5] Creating proposal template"
cat > proposal-draft.md << PROPOSAL
# Grant Proposal: $TOPIC

**Submission Date:** $DUE_DATE

## Specific Aims

$(cat specific-aims.md)

## Significance and Innovation

### Significance
[Justify importance based on gap-analysis.md]

### Innovation
$(echo "$INNOVATION")

## Approach

### Overall Strategy
[Describe approach]

### Specific Aim 1
#### Rationale
#### Methods
$(echo "$METHODS")

#### Analysis Plan
[To be detailed]

### Specific Aim 2
[Similar structure]

## Timeline
Year 1: [Tasks]
Year 2: [Tasks]
Year 3: [Tasks]

## References
[From references.bib]
PROPOSAL

echo ""
echo "Proposal shell complete: proposal-draft.md"
echo "Generated documents:"
echo "  - literature-recent.md (20 papers)"
echo "  - gap-analysis.md"
echo "  - specific-aims.md"
echo "  - methods-available.md"
echo "  - proposal-draft.md"
```

### Example 3: Reviewer Response Automation

**Chain: Parse comments → Generate responses → Update manuscript**

```bash
#!/bin/bash
# reviewer-response-automation.sh

COMMENTS_FILE="$1"
MANUSCRIPT="$2"

# Parse comments by reviewer
awk '/^R[0-9]:/ {rev=$1; sub(/:/, "", rev); getline; print rev ":::" $0}' \
  "$COMMENTS_FILE" > parsed-comments.txt

# Generate responses
while IFS=':::' read reviewer comment; do
  echo "Responding to $reviewer"

  /research:manuscript:reviewer "$comment" > \
    "response-${reviewer}-$(echo $comment | md5 | cut -c1-6).md"

  # Extract action items from response
  grep -i "change\|add\|modify\|revise" \
    "response-${reviewer}-$(echo $comment | md5 | cut -c1-6).md" >> action-items.txt

done < parsed-comments.txt

# Compile response letter
cat > response-letter.md << 'LETTER'
# Response to Reviewers

Dear Editor,

We thank the reviewers for their constructive feedback. Below are point-by-point responses.

---

LETTER

cat response-*.md >> response-letter.md

echo ""
echo "Response letter: response-letter.md"
echo "Action items: action-items.txt"
echo ""
echo "Next: Review action-items.txt and update manuscript"
```

---

## Best Practices

### 1. Design for Failure

**Always assume commands can fail:**

```bash
# Bad: No error handling
/research:doi "$doi"
/research:bib:add temp.bib refs.bib

# Good: Check exit codes
if /research:doi "$doi" > temp.txt; then
  if grep -q "@article{" temp.txt; then
    /research:bib:add temp.bib refs.bib || echo "Failed to add entry"
  else
    echo "No BibTeX found in DOI output"
  fi
else
  echo "DOI lookup failed for: $doi"
fi
```

### 2. Save Intermediate Results

**Don't lose work if pipeline fails:**

```bash
# Save output at each step
/research:arxiv "topic" | tee step1-search.md
/research:lit-gap "..." | tee step2-gaps.md
/research:hypothesis "..." | tee step3-hypothesis.md
```

### 3. Document Pipelines

**Include usage documentation in scripts:**

```bash
#!/bin/bash
# Script: literature-to-analysis-pipeline.sh
#
# Description:
#   Complete pipeline from literature search to analysis plan
#
# Usage:
#   ./literature-to-analysis-pipeline.sh "<topic>" [output-dir]
#
# Example:
#   ./literature-to-analysis-pipeline.sh "bootstrap mediation" ~/research/project
#
# Requirements:
#   - Scholar research commands installed
#   - Internet connection for arXiv/DOI lookups
#
# Output:
#   - literature/: Search results, citations
#   - analysis/: Gap analysis, hypotheses, analysis plan
#   - references.bib: Collected citations

[... script content ...]
```

### 4. Make Chains Modular

**Break complex chains into reusable functions:**

```bash
search_literature() {
  local topic="$1"
  /research:arxiv "$topic" > search-results.md
  echo "$(grep -c '=== Paper' search-results.md)"
}

collect_citations() {
  local search_file="$1"
  grep "DOI:" "$search_file" | cut -d' ' -f2 | while read doi; do
    /research:doi "$doi" > temp.txt
    sed -n '/@article{/,/^}$/p' temp.txt > temp.bib
    [ -s temp.bib ] && /research:bib:add temp.bib references.bib
    rm temp.txt temp.bib
  done
}

# Use functions
PAPERS=$(search_literature "causal mediation")
echo "Found $PAPERS papers"
collect_citations "search-results.md"
```

---

## Command Chaining Reference

### Quick Reference Table

| Pattern | When to Use | Complexity |
|---------|-------------|------------|
| Linear chain | Sequential steps, no branching | Simple |
| Conditional chain | Decision points based on results | Medium |
| Parallel chain | Independent tasks can run simultaneously | Medium |
| Iterative chain | Refinement through loops | Advanced |
| Feedback loop | Output informs next iteration | Advanced |
| Checkpoint-resume | Long pipelines, need fault tolerance | Advanced |

### Common Chains

**Literature Collection:**
```bash
arxiv → doi → bib:add
```

**Research Design:**
```bash
lit-gap → hypothesis → analysis-plan → method-scout
```

**Manuscript Generation:**
```bash
simulation:analysis → manuscript:results → manuscript:methods
```

**Peer Review:**
```bash
parse comments → manuscript:reviewer (batch) → compile letter
```

---

## Resources

### Example Scripts Repository

All scripts from this guide available at:
```
~/projects/dev-tools/scholar/examples/command-chains/
```

### Related Documentation

- [Research Commands Reference](../../research/RESEARCH-COMMANDS-REFERENCE.md)
- [Automation Workflows](automation.md)
- [flow-cli Integration Guide](flow-integration.md)

---

**Document Version:** v{{ scholar.version }}
**Last Updated:** 2026-02-01
**Word Count:** ~10,000
**Example Scripts:** 20+
