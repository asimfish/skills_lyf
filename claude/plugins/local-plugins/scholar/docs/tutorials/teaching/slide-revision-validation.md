# Revising and Validating Lecture Slides

> **⏱️ Time to Complete:** 45 minutes
> **Level:** Intermediate
> **Prerequisites:** Existing slide deck, lesson plans, basic Scholar knowledge

Learn to use Scholar's v2.8.0 slide revision and validation features to iteratively improve your lecture slides and ensure they align with your learning objectives.

---

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Check slide deck quality with `--check`
- Understand the 3-layer validation report (coverage, structure, style)
- Perform targeted revisions with `--revise`
- Use auto-analysis for smart improvements
- Establish an iterative revision workflow
- Configure validation rules in `teach-config.yml`

---

## Prerequisites

**Required:**
- Existing Quarto slide deck (`.qmd` file)
- Scholar plugin v2.8.0+
- Course configuration in `.flow/teach-config.yml`
- Lesson plan in `content/lesson-plans/`

**Helpful:**
- Understanding of Quarto presentations
- Familiarity with Scholar's teaching commands

---

## Tutorial Overview

| Step | Task | Time |
|------|------|------|
| 1 | Understand slide validation layers | 5 min |
| 2 | Run baseline check | 5 min |
| 3 | Targeted section revision | 10 min |
| 4 | Targeted range revision | 5 min |
| 5 | Targeted type revision | 5 min |
| 6 | Auto-analysis revision | 10 min |
| 7 | Configure validation rules | 5 min |

---

## Step 1: Understand Slide Validation Layers

Scholar's `--check` validates slides across three independent layers.

### Layer 1: Coverage

**What it checks:** Every learning objective from the lesson plan appears in slide content.

**Why it matters:** Missing objectives mean students won't learn what they're supposed to.

**Example:**
```
COVERAGE (3/3 objectives) ........................ PASS
  [x] Construct and interpret planned comparisons
  [x] Verify orthogonality of contrast sets
  [x] Implement Scheffé and Bonferroni adjustments
```

### Layer 2: Structure

**What it checks:** Slide composition meets pedagogical guidelines.

**Metrics validated:**
- Total slide count (based on expected minutes per slide)
- Content vs practice slide ratio
- Quiz distribution across sections
- Slide type balance

**Why it matters:** Too many content slides without practice overwhelms students. Too few slides rushes through material.

**Example:**
```
STRUCTURE ...................................... WARN
  Slide count: 22 (expected ~20, OK)
  Content: 68% (expected ~70%, OK)
  Practice: 9% (expected ~15%, LOW)
  Quiz: 0 slides (expected >= 1, MISSING)
```

### Layer 3: Style

**What it checks:** Teaching style compliance based on your course configuration.

**Rules validated:**
- Math notation present when required
- Code visibility settings consistent
- Callout usage for definitions
- dtslides CSS class usage
- Hand calculations before R output

**Why it matters:** Consistent style helps students follow along. Missing callouts hide important definitions.

**Example:**
```
STYLE (advisory) ............................... WARN
  [x] Math notation: Present
  [x] Code visibility: Consistent
  [!] Callouts: Slide 8 defines "orthogonal contrasts" without {.callout-important}
  [x] dtslides classes: Appropriate
  [!] Hand calculations: Slide 14 shows R output without preceding derivation
```

**✅ Checkpoint:** Review your existing slide deck and think about which layer might need most work.

---

## Step 2: Run Baseline Check

Start with a validation report to understand your slide deck's current state.

### Basic Check Command

```bash
/teaching:slides --check slides/week-03_contrasts_slides.qmd --from-plan=week03
```

**What happens:**
1. Scholar loads `content/lesson-plans/week03.yml`
2. Parses all slides from your `.qmd` file
3. Validates across 3 layers
4. Generates actionable report with suggested fixes

### Understanding the Report

**Full report structure:**

```
=== Slide Check: slides/week-03_contrasts_slides.qmd ===
Plan: week03 (Planned Comparisons and Contrasts)

COVERAGE (3/3 objectives) ........................ PASS
  [x] Construct and interpret planned comparisons
  [x] Verify orthogonality of contrast sets
  [x] Implement Scheffé and Bonferroni adjustments

STRUCTURE ...................................... WARN
  Slide count: 22 (expected ~20, OK)
  Content: 68% (expected ~70%, OK)
  Practice: 9% (expected ~15%, LOW)
  Quiz: 0 slides (expected >= 1, MISSING)

STYLE (advisory) ............................... WARN
  [x] Math notation: Present
  [x] Code visibility: Consistent
  [!] Callouts: Slide 8 defines "orthogonal contrasts" without {.callout-important}
  [x] dtslides classes: Appropriate
  [!] Hand calculations: Slide 14 shows R output without preceding derivation

Overall: WARN (3 issues)

Suggested fixes:
  → /teaching:slides --revise slides/week-03_contrasts_slides.qmd --section "Comparisons" \
      --instruction "Add a practice slide after the worked example"
  → /teaching:slides --revise slides/week-03_contrasts_slides.qmd --section "Comparisons" \
      --instruction "Add a quiz slide to test understanding"
  → /teaching:slides --revise slides/week-03_contrasts_slides.qmd --slides 8 \
      --instruction "Wrap the orthogonal contrasts definition in {.callout-important}"
  → /teaching:slides --revise slides/week-03_contrasts_slides.qmd --slides 14 \
      --instruction "Add hand calculation derivation before the R output"
```

### Interpreting Results

| Symbol | Meaning | Priority |
|--------|---------|----------|
| `PASS` | All checks passed | Low - review for improvements |
| `WARN` | Issues found, fixable | Medium - address before teaching |
| `FAIL` | Critical issues | High - must fix |

**Example:** Coverage `FAIL` means students will miss learning objectives. Structure `WARN` means deck is usable but could be better.

### JSON Output for CI

Add `--json` for machine-readable output:

```bash
/teaching:slides --check slides/week-03_contrasts_slides.qmd --from-plan=week03 --json
```

**Output:**
```json
{
  "file": "slides/week-03_contrasts_slides.qmd",
  "plan": "week03",
  "coverage": {
    "status": "PASS",
    "objectives_covered": 3,
    "objectives_total": 3,
    "details": [...]
  },
  "structure": {
    "status": "WARN",
    "issues": [
      "practice_ratio_low",
      "quiz_missing"
    ],
    "metrics": {...}
  },
  "style": {
    "status": "WARN",
    "violations": [...]
  },
  "overall": "WARN",
  "suggestions": [...]
}
```

**✅ Checkpoint:** Run `--check` on your slide deck and identify which layers need attention.

---

## Step 3: Targeted Section Revision

Fix specific sections without regenerating the entire deck.

### Revise by Section Title

Use `--section` with fuzzy matching:

```bash
# Target the "Methods" section
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --section "Methods" \
  --instruction "Add a worked example showing contrast coefficient calculation"
```

**What happens:**
1. Scholar finds the "Methods" section (fuzzy match: "methods", "Methods", "statistical-methods")
2. Loads all slides in that section
3. Applies your instruction
4. Rewrites only those slides
5. Updates generation metadata

### When to Use Section Targeting

| Scenario | Command |
|----------|---------|
| Section too theoretical | `--section "Theory" --instruction "Add a practical example"` |
| Missing examples | `--section "Contrasts" --instruction "Add step-by-step calculation"` |
| Outdated notation | `--section "ANOVA" --instruction "Use hat notation for estimates"` |
| Too dense | `--section "Results" --instruction "Split into two slides"` |

### Fuzzy Section Matching

Scholar uses flexible matching for section titles:

```bash
# These all match "Statistical Methods" section:
--section "Methods"
--section "statistical"
--section "statistical-methods"  # slug format
--section "stat methods"

# Minimum 4 characters required to prevent false matches
```

### Preview Before Applying

Use `--dry-run` to see what will change:

```bash
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --section "Methods" \
  --instruction "Add quiz questions" \
  --dry-run
```

**Output:**
```
🔍 DRY RUN: Preview of changes (will not be saved)

Section: Statistical Methods (slides 8-14)

Changes:
  - Slide 11 (new): Quiz slide "Testing Understanding"
  - Slide 13 (new): Quiz slide "Applying Contrasts"

Would affect 7 slides in section.
```

**When satisfied, rerun without `--dry-run` to apply.**

**✅ Checkpoint:** Use `--section` to improve one section of your deck.

---

## Step 4: Targeted Range Revision

Fix a specific range of slides by number.

### Revise by Slide Range

```bash
# Fix slides 5-12
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --slides 5-12 \
  --instruction "Simplify mathematical notation for undergraduate audience"
```

**What happens:**
1. Scholar extracts slides 5 through 12
2. Includes 1 neighbor slide on each side for context (slides 4 and 13)
3. Applies your instruction
4. Rewrites slides 5-12 only
5. Preserves surrounding slides

### When to Use Range Targeting

| Scenario | Command |
|----------|---------|
| Dense middle section | `--slides 10-18 --instruction "Split complex slides"` |
| Notation inconsistency | `--slides 5-15 --instruction "Use consistent beta notation"` |
| Code block issues | `--slides 20-25 --instruction "Add echo: true to all code blocks"` |
| After student feedback | `--slides 8-12 --instruction "Add more explanation"` |

### Single Slide Revision

Target one slide:

```bash
# Fix just slide 14
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --slides 14 \
  --instruction "Add {.callout-important} around the definition"
```

### Context Strategy

**For decks < 30 slides:** Scholar sends the full deck to AI for context.

**For decks >= 30 slides:** Scholar sends only targeted slides + 1 neighbor on each side to stay within token limits.

**Example with 40 slides:**
```bash
--slides 20-25  # Sends slides 19-26 to AI (targeted + neighbors)
```

**✅ Checkpoint:** Use `--slides` to fix a problematic range in your deck.

---

## Step 5: Targeted Type Revision

Revise all slides of a specific type.

### Slide Types

Scholar recognizes these slide types:

| Type | Description | Example |
|------|-------------|---------|
| `title` | Section title slides | "Part 2: Contrasts" |
| `content` | Explanation slides | Bullet points, definitions |
| `example` | Worked examples | Step-by-step calculations |
| `practice` | Student exercises | "Try it yourself" |
| `quiz` | Quiz questions | Multiple choice, short answer |
| `summary` | Recap slides | "Key takeaways" |
| `definition` | Term definitions | "Orthogonal contrasts are..." |
| `theorem` | Mathematical results | "The F-test statistic is..." |
| `discussion` | Open questions | "What would happen if..." |
| `questions` | Q&A slides | "Questions?" |

### Revise by Type

```bash
# Make all quiz slides harder
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --type quiz \
  --instruction "Add a fourth option to each question and increase difficulty"
```

**What happens:**
1. Scholar finds all `quiz` slides (via CSS classes, heading patterns, or content heuristics)
2. Loads each quiz slide with context
3. Applies instruction to all quiz slides
4. Rewrites only quiz slides

### Common Type-Based Revisions

| Goal | Command |
|------|---------|
| Improve examples | `--type example --instruction "Add numerical data and R output"` |
| Enhance practice | `--type practice --instruction "Add solutions"` |
| Update summaries | `--type summary --instruction "Add visual diagram"` |
| Fix definitions | `--type definition --instruction "Wrap in {.callout-important}"` |
| Harder quizzes | `--type quiz --instruction "Increase difficulty"` |

### Type Classification

Scholar uses a hybrid approach to classify slides:

1. **CSS classes** (most reliable): `{.quiz-question}`, `{.section-slide}`, `{.practice}`
2. **Heading patterns**: "Quiz:", "Example:", "Practice:" prefixes
3. **Content heuristics**:
   - `{.correct}` or `{.incorrect}` → quiz
   - `{.callout-important}` → definition
   - R code with `echo: true` → example
   - Bullet list only → content
4. **Default**: If uncertain → `content`

**✅ Checkpoint:** Use `--type` to improve all slides of one type.

---

## Step 6: Auto-Analysis Revision

Let Scholar automatically identify and fix issues.

### Bare `--revise` (No Instruction)

Run revision without `--instruction` for AI auto-analysis:

```bash
# Preview auto-analysis suggestions
/teaching:slides --revise slides/week-03_contrasts_slides.qmd --dry-run
```

**Output:**
```
🔍 AUTO-ANALYSIS: 7-dimension scan

Issues found:
  1. Slide density: Slides 8-10 overcrowded (6+ bullets each)
  2. Practice distribution: All practice slides clustered at end (slides 18-22)
  3. Style compliance: Math notation missing in slides 5, 7, 12
  4. Math depth: Formulas lack conceptual explanation (slides 11, 13)
  5. Worked examples: No numerical examples for contrast calculation
  6. Content completeness: Insufficient explanation of orthogonality concept
  7. R output interpretation: Code output slides lack interpretation (slides 14-16)

Suggested improvements:
  - Split dense slides into smaller units
  - Distribute practice slides throughout deck
  - Add LaTeX notation for key formulas
  - Add conceptual scaffolding before complex math
  - Include worked example with real data
  - Expand orthogonality explanation with visual
  - Add interpretation callouts after R output

Apply changes? (Use --dry-run to preview first)
```

### 7 Analysis Dimensions

Scholar checks these aspects automatically:

1. **Slide Density**
   - Flags slides with 6+ bullets or 300+ words
   - Suggests splits or condensing

2. **Practice Distribution**
   - Checks for clustered practice slides
   - Suggests even spacing throughout deck

3. **Style Compliance**
   - Validates against `teach-config.yml` rules
   - Checks math notation, callouts, CSS classes

4. **Math Depth**
   - Ensures formulas have conceptual scaffolding
   - No "magic formulas" without explanation

5. **Worked Examples**
   - Verifies numerical examples present for key concepts
   - Checks for step-by-step calculations

6. **Content Completeness**
   - Evaluates explanation depth
   - Flags concepts without sufficient detail

7. **R Output Interpretation**
   - Checks code output slides have interpretation
   - Ensures students understand what results mean

### Apply Auto-Improvements

After reviewing suggestions, apply changes:

```bash
# Apply all auto-analysis improvements
/teaching:slides --revise slides/week-03_contrasts_slides.qmd
```

**What happens:**
1. Scholar performs 7-dimension analysis
2. Generates targeted improvements for each issue
3. Applies all changes at once
4. Updates slide deck with provenance metadata

### When to Use Auto-Analysis

| Scenario | Use Auto-Analysis |
|----------|-------------------|
| First draft from generator | ✅ Yes - catches common issues |
| After manual edits | ✅ Yes - ensures consistency |
| Student feedback | ❌ No - use targeted `--instruction` |
| Specific known issue | ❌ No - use `--section`, `--slides`, or `--type` |
| Final polish | ✅ Yes - one last quality check |

**Best practice:** Run auto-analysis after generation, then use targeted revisions for specific improvements.

**✅ Checkpoint:** Run bare `--revise` with `--dry-run` to see what Scholar finds.

---

## Step 7: Configure Validation Rules

Customize validation rules in your course configuration.

### Structure Configuration

Edit `.flow/teach-config.yml`:

```yaml
scholar:
  style:
    structure:
      content_ratio: 0.70      # ~70% content slides
      practice_ratio: 0.15     # ~15% practice slides
      minutes_per_slide: 2.5   # Expected pace
      tolerance: 0.20          # 20% tolerance on ratios
      quiz_per_section: 1      # Minimum quiz slides per section
```

**Effect on validation:**

```
STRUCTURE ...................................... WARN
  Slide count: 22 (expected ~20, OK)        # duration / 2.5
  Content: 68% (expected ~70%, OK)          # content_ratio ± tolerance
  Practice: 9% (expected ~15%, LOW)         # practice_ratio - tolerance
  Quiz: 0 slides (expected >= 1, MISSING)   # quiz_per_section
```

### Style Validation Configuration

```yaml
scholar:
  style:
    validation:
      strictness: advisory    # advisory | strict
      rules:
        math_notation: warn   # LaTeX present when math: true
        code_visibility: warn # echo: settings consistent
        callout_usage: warn   # Key concepts use {.callout-important}
        dtslides_classes: warn # Appropriate CSS class usage
        hand_calculations: warn # Present before R code
```

**Strictness modes:**

| Mode | Behavior |
|------|----------|
| `advisory` | All violations produce `WARN` (deck usable) |
| `strict` | Violations produce `FAIL` (must fix before teaching) |

**Rule levels:**

Each rule can be:
- `warn` - Report but don't fail
- `error` - Report and fail check
- `off` - Skip this rule

**Example - Strict Math Notation:**

```yaml
scholar:
  style:
    validation:
      strictness: strict
      rules:
        math_notation: error  # FAIL if LaTeX missing
```

**Result:**
```
STYLE (strict) ................................. FAIL
  [!] Math notation: Missing in slides 5, 7, 12
```

### Per-Course Customization

Different courses need different rules:

**Undergraduate introductory course:**
```yaml
scholar:
  style:
    structure:
      content_ratio: 0.60     # Less content
      practice_ratio: 0.25    # More practice
      minutes_per_slide: 3.0  # Slower pace
    validation:
      strictness: advisory
      rules:
        math_notation: warn   # Optional LaTeX
        hand_calculations: off # Skip this rule
```

**Graduate seminar:**
```yaml
scholar:
  style:
    structure:
      content_ratio: 0.80     # More content
      practice_ratio: 0.10    # Less practice
      minutes_per_slide: 2.0  # Faster pace
    validation:
      strictness: strict
      rules:
        math_notation: error  # LaTeX required
        hand_calculations: error # Always show derivations
```

**✅ Checkpoint:** Customize your validation rules and re-run `--check`.

---

## Complete Revision Workflow

Integrate checking and revising into your slide development process.

### Weekly Workflow

**Sunday: Generate Slides**

```bash
/teaching:slides --from-plan=week03 --output-dir=slides
```

**Monday: Initial Check**

```bash
/teaching:slides --check slides/week-03_contrasts_slides.qmd --from-plan=week03
```

Review the report, note issues.

**Monday: Auto-Analysis**

```bash
# Preview improvements
/teaching:slides --revise slides/week-03_contrasts_slides.qmd --dry-run

# Apply if satisfied
/teaching:slides --revise slides/week-03_contrasts_slides.qmd
```

**Tuesday: Targeted Fixes**

Copy suggested `--revise` commands from check report:

```bash
# Fix practice distribution
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --section "Methods" \
  --instruction "Add practice slide after worked example"

# Fix missing quiz
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --section "Contrasts" \
  --instruction "Add quiz slide testing understanding of orthogonality"

# Fix callout usage
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --slides 8 \
  --instruction "Wrap orthogonal contrasts definition in {.callout-important}"
```

**Tuesday: Final Check**

```bash
/teaching:slides --check slides/week-03_contrasts_slides.qmd --from-plan=week03
```

Verify all issues resolved.

**Wednesday: Preview & Commit**

```bash
quarto preview slides/week-03_contrasts_slides.qmd
git add slides/week-03_contrasts_slides.qmd
git commit -m "feat: week 3 slides - contrasts (validated)"
```

### Semester-Long Batch Validation

Validate all slide decks at once:

```bash
# Check all weeks
for week in {01..15}; do
  /teaching:slides --check slides/week-${week}_*.qmd \
    --from-plan=week${week} \
    --json >> validation-report.json
done

# Parse JSON for issues
cat validation-report.json | jq '.[] | select(.overall != "PASS")'
```

### CI Integration

Add to `.github/workflows/validate-slides.yml`:

```yaml
name: Validate Slides

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Scholar
        run: npm install -g @data-wise/scholar

      - name: Validate all slides
        run: |
          for file in slides/*.qmd; do
            week=$(basename "$file" | grep -oP 'week-\K\d+')
            /teaching:slides --check "$file" --from-plan="week${week}" --json
          done

      - name: Check for failures
        run: |
          if grep -q '"overall": "FAIL"' validation-report.json; then
            echo "❌ Slide validation failed"
            exit 1
          fi
```

---

## Advanced Techniques

### 1. Combining Targeting Modes

Use multiple flags together:

```bash
# Target quiz slides in specific section
/teaching:slides --revise slides/week-03_contrasts_slides.qmd \
  --section "Methods" \
  --type quiz \
  --instruction "Add explanation after each answer"
```

**Note:** When combining flags, Scholar applies narrowest targeting (intersection of filters).

### 2. Iterative Refinement

Use check → revise → re-check loop:

```bash
# Check
/teaching:slides --check slides/week-03_contrasts_slides.qmd --from-plan=week03

# Revise (using suggested commands from report)
/teaching:slides --revise slides/week-03_contrasts_slides.qmd --section "Methods" --instruction "..."

# Re-check
/teaching:slides --check slides/week-03_contrasts_slides.qmd --from-plan=week03
```

Continue until `Overall: PASS`.

### 3. Style Template Revision

Create consistent style across all decks:

```bash
# Fix all slides to use consistent notation
for file in slides/week-*.qmd; do
  /teaching:slides --revise "$file" \
    --instruction "Use hat notation for all parameter estimates (e.g., \hat{\beta})"
done
```

---

## Troubleshooting

### Issue 1: Section Not Found

**Error:**
```
Warning: Section "exmple" not found (did you mean "Worked Example"?)
```

**Solution:**
- Use at least 4 characters for fuzzy matching
- Check exact section title in `.qmd` file
- Try slug format: `--section "worked-example"`

---

### Issue 2: Coverage False Negative

**Report shows objective missing, but it's actually covered:**

```
✗ Verify orthogonality of contrast sets (not found)
```

**Solution:**
- Coverage uses keyword matching - objective might be covered under different wording
- Manual review recommended
- Consider updating lesson plan objective to match slide terminology

---

### Issue 3: Structure Validation Too Strict

**All decks fail structure checks:**

```
STRUCTURE ...................................... FAIL
  Practice: 8% (expected ~15%, LOW)
```

**Solution:**
- Adjust `tolerance` in config:
  ```yaml
  scholar:
    style:
      structure:
        tolerance: 0.30  # 30% tolerance instead of 20%
  ```

---

### Issue 4: Auto-Analysis Changes Too Much

**Bare `--revise` rewrites large portions of deck:**

**Solution:**
- Use `--dry-run` first to preview
- Apply targeted revisions instead:
  ```bash
  /teaching:slides --revise slides/week-03.qmd --section "Methods" --instruction "..."
  ```
- Adjust teaching style config to match your existing decks

---

### Issue 5: Type Classification Wrong

**Quiz slides classified as content:**

**Solution:**
- Add explicit CSS classes:
  ```markdown
  ## Quiz Question {.quiz-question}
  ```
- Or use heading patterns:
  ```markdown
  ## Quiz: Testing Understanding
  ```

---

## Best Practices

### DO ✅

- **Start with `--check`** - Understand issues before revising
- **Use `--dry-run`** - Preview changes before applying
- **Target specifically** - Use `--section`, `--slides`, or `--type` for known issues
- **Run auto-analysis early** - Catches common problems in first draft
- **Validate after revisions** - Re-run `--check` to verify improvements
- **Configure per course** - Adjust rules for undergraduate vs graduate

### DON'T ❌

- **Skip validation** - Issues compound over semester
- **Apply blind auto-analysis** - Always use `--dry-run` first
- **Over-revise** - Too many passes can lose your voice
- **Ignore style layer** - Consistency helps student learning
- **Use same config for all courses** - Adjust rules per audience

---

## Next Steps

Now that you can revise and validate slides:

1. **Explore lecture generation**: [Generating Weekly Lecture Notes](lecture-notes.md)
2. **Configure your course**: [Course Configuration Tutorial](configuration.md)
3. **Understand workflows**: [Teaching Workflows](../../TEACHING-WORKFLOWS.md)
4. **Join the community**: [FAQ](../../help/FAQ-teaching.md)

---

## Summary

You've learned to:

- ✅ Validate slides across coverage, structure, and style layers
- ✅ Run targeted revisions by section, range, or type
- ✅ Use auto-analysis for smart improvements
- ✅ Configure validation rules per course
- ✅ Establish iterative revision workflow
- ✅ Integrate checks into CI pipeline

**Time saved per deck:** ~1-2 hours (automated validation + targeted fixes vs manual review)

**Key takeaway:** Scholar's check and revise features enable iterative improvement of slide decks, ensuring quality and alignment with learning objectives before you teach.

---

## See Also

- [Teaching Workflows](../../TEACHING-WORKFLOWS.md)
- [Lecture Notes Tutorial](lecture-notes.md)
- [Configuration Tutorial](configuration.md)
- [Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md)
- [v2.8.0 Spec](../../specs/SPEC-2026-02-09-unified-revise-check.md)
