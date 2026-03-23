---
render_macros: false
---

# Generating Weekly Lecture Notes

> **⏱️ Time to Complete:** 60 minutes
> **Level:** Intermediate
> **Prerequisites:** Basic Scholar knowledge, familiarity with Quarto

Learn to use Scholar's v2.5.0 lecture production features to generate comprehensive instructor lecture notes for semester-long courses.

---

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Generate lecture notes from lesson plans with `/teaching:lecture`
- Use v2.5.0 features: `--output-dir`, `--refine`, `--context`, `--check`, `--open`
- Refine specific sections without regenerating entire lectures
- Validate coverage against lesson plans
- Integrate lecture production into your weekly workflow

---

## Prerequisites

**Required:**
- Scholar plugin installed and working
- Course configuration in `.flow/teach-config.yml`
- Lesson plans in `content/lesson-plans/`
- Quarto installed (for rendering)

**Helpful:**
- Git for version control
- Text editor or IDE

---

## Tutorial Overview

| Step | Task | Time |
|------|------|------|
| 1 | Understand lecture structure | 5 min |
| 2 | Generate first lecture | 10 min |
| 3 | Use predictable output paths | 5 min |
| 4 | Refine specific sections | 10 min |
| 5 | Use context from previous lectures | 10 min |
| 6 | Validate coverage | 5 min |
| 7 | Preview with Quarto | 10 min |
| 8 | Establish weekly workflow | 5 min |

---

## Step 1: Understand Lecture Structure

Scholar generates lectures as Quarto (.qmd) files with multiple sections.

### Lecture Sections

A typical lecture includes:

1. **Introduction** - Context, learning objectives, connections
2. **Theory** - Conceptual foundation with notation
3. **Worked Example** - Step-by-step demonstration
4. **R Code** - Implementation with comments
5. **Interpretation** - Results explanation
6. **Common Mistakes** - Pitfalls to avoid
7. **Practice Problems** - Student exercises
8. **Summary** - Key takeaways
9. **Resources** - Further reading

### Lesson Plan Integration

Lectures are generated from `content/lesson-plans/weekNN.yml`:

```yaml
week: 3
topic: "Simple Linear Regression"
learning_objectives:
  - "Understand least squares estimation"
  - "Interpret regression coefficients"
  - "Assess model assumptions"

materials:
  - "ISLR Chapter 3"
  - "Dataset: advertising.csv"

activities:
  - type: "lecture"
    duration: 50
    description: "Regression fundamentals"
  - type: "lab"
    duration: 50
    description: "Hands-on regression in R"
```

**✅ Checkpoint:** Verify your lesson plan files are in `content/lesson-plans/`.

---

## Step 2: Generate Your First Lecture

### Basic Command

Generate a lecture from your lesson plan:

```bash
/teaching:lecture --from-plan=week03
```

**What happens:**
1. Scholar reads `content/lesson-plans/week03.yml`
2. Loads your teaching style from `.flow/teach-config.yml`
3. Generates 8-10 sections using AI
4. Saves to `content/lectures/week03-[topic-slug].qmd`

**Expected output:**

```
✓ Loaded lesson plan: week03.yml (Simple Linear Regression)
✓ Applied teaching style: intermediate statistics
⚙ Generating lecture sections...
  ✓ Introduction
  ✓ Theory: Least Squares Estimation
  ✓ Worked Example: Advertising Data
  ✓ R Code: lm() function
  ✓ Interpretation: Coefficient meaning
  ✓ Common Mistakes: Correlation vs causation
  ✓ Practice Problems: 3 exercises
  ✓ Summary
  ✓ Resources

✓ Lecture saved: content/lectures/week03-simple-linear-regression.qmd (487 lines)
```

**⏱️ Generation time:** ~3-5 minutes (depending on complexity)

**✅ Checkpoint:** Open the generated `.qmd` file and verify it has all sections.

---

## Step 3: Use Predictable Output Paths (v2.5.0 Feature)

### The `--output-dir` Flag

By default, Scholar saves lectures to `content/lectures/`. Use `--output-dir` for custom paths:

```bash
# Save to custom directory
/teaching:lecture --from-plan=week03 --output-dir=notes/instructor

# Result: notes/instructor/week03-simple-linear-regression.qmd
```

### Why This Matters

**Before v2.5.0:**
- Lectures saved to current directory
- Hard to organize semester-long content
- Difficult to batch process

**After v2.5.0:**
- Consistent output location
- Easy to integrate with Git
- Simplifies Quarto project structure

**Best Practice:**

```bash
# Standard structure
content/
  lectures/          # Instructor notes (detailed)
  handouts/          # Student handouts (summary)
  lesson-plans/      # Weekly plans (source)
```

**✅ Checkpoint:** Generate a lecture with `--output-dir` and verify the file location.

---

## Step 4: Refine Specific Sections (v2.5.0 Feature)

### The `--refine` Flag

Don't regenerate entire lectures - refine just what needs improvement!

#### Refine by Section Title

```bash
# Regenerate just the "Worked Example" section
/teaching:lecture --from-plan=week03 --refine="Worked Example"
```

**What happens:**
1. Scholar finds the "Worked Example" section (fuzzy matching)
2. Regenerates just that section
3. Replaces it in the existing file
4. Updates generation metadata

#### Refine Entire Lecture

```bash
# Regenerate all sections (preserves structure)
/teaching:lecture --from-plan=week03 --refine
```

### When to Refine

| Scenario | Command |
|----------|---------|
| Section too technical | `--refine="Theory"` |
| Example needs improvement | `--refine="Worked Example"` |
| Code has errors | `--refine="R Code"` |
| After student feedback | `--refine` (full lecture) |
| Notation inconsistency | `--refine="Theory"` |

### Fuzzy Section Matching

Scholar uses fuzzy matching for section titles:

```bash
# These all work for "Worked Example: Advertising Data"
--refine="Worked Example"
--refine="example"
--refine="advertising"
--refine="worked-example"  # slugified
```

**⚠️ Important:** Minimum 4 characters required to prevent false matches.

**✅ Checkpoint:** Refine one section and verify only that section changed.

---

## Step 5: Use Context from Previous Lectures (v2.5.0 Feature)

### The `--context=previous` Flag

Help Scholar maintain continuity across weeks:

```bash
# Use previous 3 weeks as context
/teaching:lecture --from-plan=week08 --context=previous
```

**What happens:**
1. Scholar reads `week05.qmd`, `week06.qmd`, `week07.qmd` (previous 3 weeks)
2. Extracts key concepts, notation, examples
3. Uses ~1,500 tokens of context for generation
4. Ensures consistent terminology and progressive complexity

### Context Window

- **Default:** 3 weeks (configurable in teaching style)
- **Early semester:** Falls back to available lectures (weeks 1-2 use fewer)
- **Token limit:** ~1,500 tokens to preserve generation quality

### When to Use Context

| Week | Use Context? | Reason |
|------|--------------|--------|
| Week 1-2 | Optional | No prior material |
| Week 3-5 | **Recommended** | Building on foundations |
| Week 6+ | **Required** | Complex material needs continuity |
| After break | **Required** | Re-establish context |

**Example - Week 8 Linear Regression:**

```bash
/teaching:lecture --from-plan=week08 --context=previous
```

**Context used from weeks 5-7:**
- Week 5: Exploratory Data Analysis → informs regression diagnostics
- Week 6: Probability Distributions → connects to regression assumptions
- Week 7: Hypothesis Testing → builds to regression inference

**Result:** Week 8 lecture references EDA plots from week 5, uses notation from week 6, and extends hypothesis testing framework from week 7.

**✅ Checkpoint:** Generate a mid-semester lecture with and without context. Compare continuity.

---

## Step 6: Validate Coverage (v2.5.0 Feature)

### The `--check` Flag

Ensure lectures cover all learning objectives:

```bash
/teaching:lecture --from-plan=week03 --check
```

**Output:**

```
📊 COVERAGE VALIDATION

Lesson Plan: week03.yml
Learning Objectives: 3
Topics: 5

Coverage Analysis:
  ✓ Understand least squares estimation (Section: Theory)
  ✓ Interpret regression coefficients (Section: Interpretation)
  ✓ Assess model assumptions (Section: Common Mistakes)

Topics Covered:
  ✓ least squares
  ✓ coefficient interpretation
  ✓ residual analysis
  ✓ R-squared
  ✓ assumptions

✓ All learning objectives covered
✓ All topics addressed

⚠ Note: Coverage based on keyword matching. Manual review recommended.
```

### Coverage Report Details

**What's Validated:**
- Learning objectives presence
- Key topics from lesson plan
- Suggested materials mentioned
- Activities alignment

**How It Works:**
- Fuzzy string matching
- Section title analysis
- Content keyword scanning
- Confidence scoring

**Interpreting Results:**

| Symbol | Meaning | Action |
|--------|---------|--------|
| ✓ | Covered with confidence | None - looks good |
| ~ | Partially covered | Review manually |
| ✗ | Missing coverage | Refine or add section |

**✅ Checkpoint:** Run `--check` and verify all objectives are covered.

---

## Step 7: Preview with Quarto (v2.5.0 Feature)

### The `--open` Flag

Auto-launch Quarto preview after generation:

```bash
/teaching:lecture --from-plan=week03 --open
```

**What happens:**
1. Lecture generated
2. Quarto preview server starts
3. Browser opens to rendered HTML
4. Live reload enabled

**Preview workflow:**

```bash
# Generate and preview
/teaching:lecture --from-plan=week03 --output-dir=content/lectures --open

# Quarto starts:
# → Rendering week03-simple-linear-regression.qmd
# → Server started at http://localhost:4321
# → Browser opened
```

**Hot Reload:**
- Edit `.qmd` file
- Save changes
- Browser auto-refreshes
- No manual rebuild needed

### Math Auto-Fix

Scholar automatically cleans blank lines from display math blocks (`$$...$$`) in generated Quarto output, preventing PDF rendering failures. No action needed — see the [Auto-Fixer Guide](../../AUTO-FIXER-GUIDE.md#qw4-math-blank-line-auto-fix-priority-5) for details.

### Preview Modes

**HTML Preview (default):**
```bash
/teaching:lecture --from-plan=week03 --open
# Opens HTML in browser
```

**PDF Preview:**
```bash
quarto render content/lectures/week03-simple-linear-regression.qmd --to pdf
open content/lectures/week03-simple-linear-regression.pdf
```

**All Formats:**
```bash
quarto render content/lectures/ --to all
# Generates HTML, PDF, DOCX for all lectures
```

**✅ Checkpoint:** Generate lecture with `--open` and verify preview works.

---

## Step 8: Establish Weekly Workflow

### Complete Weekly Process

Integrate lecture generation into your weekly teaching routine:

#### Sunday Evening (15 minutes)

1. **Review lesson plan for upcoming week:**
   ```bash
   cat content/lesson-plans/week04.yml
   ```

2. **Generate lecture with context:**
   ```bash
   /teaching:lecture \
     --from-plan=week04 \
     --context=previous \
     --output-dir=content/lectures \
     --check \
     --open
   ```

3. **Review coverage report**
   - Verify all objectives covered
   - Check topic alignment

4. **Preview in browser**
   - Skim all sections
   - Note sections needing refinement

#### Monday Morning (30 minutes)

5. **Refine weak sections:**
   ```bash
   # Example: Improve worked example
   /teaching:lecture --from-plan=week04 --refine="Worked Example"
   ```

6. **Add instructor notes:**
   - Timing estimates
   - Discussion questions
   - Common student misconceptions

7. **Final preview:**
   ```bash
   quarto render content/lectures/week04-multiple-regression.qmd
   ```

8. **Commit to Git:**
   ```bash
   git add content/lectures/week04-multiple-regression.qmd
   git commit -m "feat: add week 4 lecture (multiple regression)"
   ```

### Semester-Long Batch Generation

Generate all 15 lectures at once:

```bash
# Week 1-15
for week in {01..15}; do
  /teaching:lecture \
    --from-plan=week$week \
    --context=previous \
    --output-dir=content/lectures \
    --check
  sleep 300  # 5 min between generations (API rate limits)
done
```

**⏱️ Total time:** ~90 minutes (15 lectures × 6 min each)

**Best for:**
- Preparing entire semester before teaching
- Establishing consistent structure
- Sharing with co-instructors

**✅ Checkpoint:** Set up your weekly workflow and generate 2-3 lectures.

---

## Advanced Techniques

### 1. Custom Prompts (v2.4.0+)

Override default prompts:

```bash
# Create custom prompt
mkdir -p .flow/templates/prompts
cat > .flow/templates/prompts/lecture-notes.md << 'EOF'
---
prompt_version: "2.5"
---

Generate comprehensive instructor lecture notes for {{course_level}} {{field}} course.

Topic: {{topic}}
Objectives: {{objectives}}

Tone: {{style.tone}}
Include: {{#if style.examples}}worked examples{{/if}}

Structure:
1. Introduction with motivation
2. Theory with mathematical rigor
3. Worked example with R code
4. Interpretation and visualization
...
EOF

# Use custom prompt
/teaching:lecture --from-plan=week03
```

### 2. Multiple Output Formats

Generate in different formats simultaneously:

```bash
# Generate Quarto lecture
/teaching:lecture --from-plan=week03 --output-dir=content/lectures

# Render all formats
cd content/lectures
quarto render week03-simple-linear-regression.qmd --to all

# Results:
# - week03-simple-linear-regression.html (web viewing)
# - week03-simple-linear-regression.pdf (printing)
# - week03-simple-linear-regression.docx (sharing with co-instructors)
```

### 3. Student Handout Version

Create condensed handout from lecture:

```bash
# Generate full lecture
/teaching:lecture --from-plan=week03 --output-dir=content/lectures

# Create handout (manual editing)
# - Remove instructor-only sections
# - Add student exercise placeholders
# - Simplify worked examples

# Save as:
# content/handouts/week03-handout.qmd
```

---

## Troubleshooting

### Issue 1: Lecture Generation Fails

**Error:**
```
Error: Failed to load lesson plan: week03.yml
```

**Solution:**
- Verify file exists: `ls content/lesson-plans/week03.yml`
- Check YAML syntax: `cat content/lesson-plans/week03.yml | yamllint`
- Ensure `week:` field matches filename

---

### Issue 2: Section Not Found During Refine

**Error:**
```
Warning: Section "exmple" not found (did you mean "Worked Example"?)
```

**Solution:**
- Use at least 4 characters: `--refine="example"` not `--refine="ex"`
- Check exact section title in `.qmd` file
- Use slug format: `--refine="worked-example"`

---

### Issue 3: Context Not Applied

**Symptom:** Week 8 lecture doesn't reference previous material

**Solution:**
- Verify previous weeks exist: `ls content/lectures/week0{5..7}*.qmd`
- Use explicit context: `--context=previous`
- Check lecture frontmatter for context metadata

---

### Issue 4: Coverage Validation Shows Missing Objectives

**Output:**
```
✗ Assess model assumptions (not found)
```

**Solution:**
1. Manual check: Objective might be covered under different wording
2. Add explicit section: `--refine` to add "Model Assumptions" section
3. Update lesson plan if objective was incorrect

---

### Issue 5: Quarto Preview Won't Open

**Error:**
```
Error: Could not start Quarto preview server
```

**Solution:**
```bash
# Check Quarto installation
quarto check

# Manually start preview
cd content/lectures
quarto preview week03-simple-linear-regression.qmd
```

---

## Best Practices

### DO ✅

- **Start early in the semester** - Generate lectures 1-2 weeks ahead
- **Use context for week 3+** - Maintains terminology consistency
- **Validate coverage** - Always use `--check` before teaching
- **Version control lectures** - Commit to Git after refinement
- **Refine incrementally** - One section at a time based on student feedback

### DON'T ❌

- **Generate without lesson plans** - Always start with structured YAML
- **Skip coverage validation** - Missed objectives frustrate students
- **Regenerate entire lectures** - Use `--refine` for targeted improvements
- **Ignore context** - Mid-semester lectures need prior week references
- **Forget to preview** - Always check rendered output before teaching

---

## Next Steps

Now that you can generate weekly lecture notes:

1. **Explore assignments**: [Creating Assignments with Solutions & Rubrics](assignments-solutions-rubrics.md)
2. **Configure your course**: [Course Configuration Tutorial](configuration.md)
3. **Understand workflows**: [Teaching Workflows](../../TEACHING-WORKFLOWS.md)
4. **Join the community**: [FAQ](../../help/FAQ-teaching.md)

---

## Summary

You've learned to:

- ✅ Generate lectures from lesson plans with Scholar
- ✅ Use v2.5.0 features for efficient workflow
- ✅ Refine sections without full regeneration
- ✅ Maintain continuity with context
- ✅ Validate coverage before teaching
- ✅ Preview lectures in Quarto
- ✅ Establish a sustainable weekly routine

**Time saved per semester:** ~30-40 hours (15 lectures × 2-3 hours each)

**Key takeaway:** Scholar automates lecture structure generation, letting you focus on refinement, examples, and student engagement rather than starting from scratch each week.

---

## See Also

- [Teaching Workflows](../../TEACHING-WORKFLOWS.md)
- [Assignments Tutorial](assignments-solutions-rubrics.md)
- [Configuration Tutorial](configuration.md)
- [Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md)
- [v2.5.0 What's New](../../WHATS-NEW-v2.5.0.md)
