# Configuring Scholar for Your Course

> **⏱️ Time to Complete:** 45 minutes
> **Level:** Beginner to Intermediate
> **Prerequisites:** Scholar plugin installed, basic YAML knowledge

Learn to configure Scholar's teaching commands for your specific course using `.flow/teach-config.yml`.

---

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Create and structure `.flow/teach-config.yml` for your course
- Configure course information (level, field, difficulty)
- Set teaching style preferences (tone, notation, examples)
- Configure default formats and question types
- Understand configuration inheritance (Global → Course → Command → Lesson)
- Validate your configuration with `/teaching:validate`
- Troubleshoot common configuration issues

---

## Prerequisites

**Required:**
- Scholar plugin installed
- Text editor (VS Code, Sublime, vim, etc.)
- Basic understanding of YAML syntax

**Helpful:**
- Familiarity with your course structure
- Teaching philosophy/preferences defined

---

## Tutorial Overview

| Step | Task | Time |
|------|------|------|
| 1 | Understand configuration hierarchy | 5 min |
| 2 | Create teach-config.yml | 10 min |
| 3 | Configure course information | 5 min |
| 4 | Set teaching style preferences | 10 min |
| 5 | Configure defaults | 5 min |
| 6 | Validate configuration | 5 min |
| 7 | Test with actual commands | 5 min |

---

## Step 1: Understand Configuration Hierarchy

Scholar uses a 4-layer configuration system:

```
Layer 1: Global (Plugin defaults)
  ↓
Layer 2: Course (.flow/teach-config.yml)
  ↓
Layer 3: Command (command-specific overrides)
  ↓
Layer 4: Lesson (week-specific in lesson plans)
```

### Layer Priority

**Higher layers override lower layers:**

```yaml
# Layer 1 (Global - Scholar defaults)
tone: "formal"
examples: true

# Layer 2 (Course - your .flow/teach-config.yml)
tone: "conversational"  # ✓ Overrides global

# Layer 3 (Command - command_overrides.exam)
difficulty: "advanced"  # ✓ Overrides course default

# Layer 4 (Lesson - week03.yml)
tone: "formal"  # ✓ Overrides all for this specific lesson
```

**Result:** Scholar uses most specific setting available.

### Why This Matters

**Flexibility:**
- Set course-wide defaults (Layer 2)
- Override for specific activities (Layer 3-4)
- Maintain consistency without repetition

**Example Scenario:**
- Course tone: "conversational" (undergrads)
- Exam tone: "formal" (institutional requirement)
- Week 12 (guest lecture): "technical" (visiting researcher)

**✅ Checkpoint:** Understand that `.flow/teach-config.yml` is Layer 2 (course-wide).

---

## Step 2: Create teach-config.yml

### File Location

Configuration must be in `.flow/teach-config.yml` at project root:

```bash
# Your course project structure
your-course/
├── .flow/
│   └── teach-config.yml    # ← This file
├── content/
│   ├── lesson-plans/
│   ├── lectures/
│   └── exams/
└── README.md
```

### Create Configuration File

```bash
# Navigate to your course directory
cd ~/projects/teaching/stat-545

# Create .flow directory
mkdir -p .flow

# Create configuration file
touch .flow/teach-config.yml
```

### Basic Template

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"

  defaults:
    exam_format: "markdown"
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"

  style:
    tone: "conversational"
    notation: "statistical"
    examples: true
```

**✅ Checkpoint:** Create `.flow/teach-config.yml` with the basic template.

---

## Step 3: Configure Course Information

### Course Level

Specifies your target audience:

```yaml
scholar:
  course_info:
    level: "undergraduate"  # or "graduate"
```

**Options:**
- `undergraduate` - Bachelor's level (100-400 courses)
- `graduate` - Master's/PhD level (500-700 courses)

**Impact:**
- Mathematical rigor
- Prerequisite assumptions
- Example complexity
- Notation formality

**Example:**

```yaml
# Undergraduate (STAT 301)
level: "undergraduate"
# Result: Uses basic notation, fewer proofs, more intuition

# Graduate (STAT 701)
level: "graduate"
# Result: Rigorous proofs, advanced notation, research papers
```

### Field

Specifies subject area:

```yaml
course_info:
  field: "statistics"
```

**Common fields:**
- `statistics`
- `biostatistics`
- `econometrics`
- `data-science`
- `machine-learning`
- `mathematics`
- `psychology` (for research methods courses)

**Impact:**
- Domain-specific examples
- Appropriate software (R, Python, SPSS, Stata)
- Field-specific terminology

### Difficulty

Fine-tunes within level:

```yaml
course_info:
  difficulty: "intermediate"
```

**Options:**
- `beginner` - First course in subject
- `intermediate` - Standard course
- `advanced` - Capstone or specialized topic

**✅ Checkpoint:** Configure your course's level, field, and difficulty.

---

## Step 4: Set Teaching Style Preferences

### Tone

Controls formality of generated content:

```yaml
style:
  tone: "conversational"
```

**Options:**

| Tone | Best For | Example |
|------|----------|---------|
| `formal` | Traditional lectures, exams | "The null hypothesis states that..." |
| `conversational` | Engaging lectures, online courses | "Let's think about what happens when..." |
| `technical` | Advanced courses, research seminars | "The asymptotic distribution of the estimator..." |

**Example:**

```yaml
# For undergraduate intro course
tone: "conversational"
# "Think of regression as drawing the 'best fit' line through your data."

# For graduate theory course
tone: "technical"
# "The OLS estimator β̂ = (X'X)⁻¹X'y is BLUE under Gauss-Markov assumptions."
```

### Notation Style

Controls mathematical notation conventions:

```yaml
style:
  notation: "statistical"
```

**Options:**
- `statistical` - Classical stats notation (μ, σ, β, H₀)
- `mathematical` - Pure math notation (f, g, ∫, ∑)
- `machine-learning` - ML notation (w, b, θ, ŷ)

**Impact on notation:**

```yaml
# notation: "statistical"
E[Y] = β₀ + β₁X
H₀: β₁ = 0

# notation: "machine-learning"
ŷ = w₀ + w₁x
θ* = argmin L(θ)
```

### Examples

Controls inclusion of worked examples:

```yaml
style:
  examples: true  # Include worked examples
```

**Options:**
- `true` - Always include examples (recommended for teaching)
- `false` - Theory only (for reference materials)

**Impact:**

```yaml
# examples: true
# Results in:
# - Numerical examples with datasets
# - Step-by-step worked solutions
# - R code demonstrations

# examples: false
# Results in:
# - Definitions and theorems only
# - No computational examples
# - Abstract notation
```

### Complete Style Section

```yaml
style:
  tone: "conversational"
  notation: "statistical"
  examples: true

  # Optional advanced settings
  proof_style: "intuitive"  # or "rigorous"
  code_comments: "verbose"  # or "minimal"
  figure_style: "ggplot2"   # or "base-r"
```

**✅ Checkpoint:** Configure style preferences matching your teaching philosophy.

---

## Step 5: Configure Defaults

### Default Formats

Set preferred output formats for each command:

```yaml
defaults:
  exam_format: "markdown"
  quiz_format: "markdown"
  assignment_format: "quarto"
  lecture_format: "quarto"
  syllabus_format: "markdown"
```

**Available formats:**
- `markdown` - Plain Markdown (.md)
- `quarto` - Quarto document (.qmd)
- `latex` - LaTeX document (.tex)
- `json` - Structured data (.json)

**When to use each:**

| Format | Best For | Tools Needed |
|--------|----------|--------------|
| `markdown` | Quick previews, GitHub | None |
| `quarto` | Reproducible docs, HTML/PDF | Quarto |
| `latex` | Professional typesetting | LaTeX |
| `json` | Programmatic processing | Custom scripts |

### Question Types

Specify allowed question types for assessments:

```yaml
defaults:
  question_types:
    - "multiple-choice"
    - "true-false"
    - "short-answer"
    - "essay"
    - "fill-in-blank"
    - "matching"
    - "calculation"
```

**Impact:** Scholar only generates questions of these types.

**Example:**

```yaml
# For auto-graded online exams
question_types:
  - "multiple-choice"
  - "true-false"
  # No essay or short-answer

# For in-person comprehensive exams
question_types:
  - "short-answer"
  - "essay"
  - "calculation"
  # No multiple-choice (reduce guessing)
```

### Number of Questions

Set default quantity for each assessment type:

```yaml
defaults:
  exam_questions: 50
  quiz_questions: 10
  assignment_problems: 8
```

**✅ Checkpoint:** Set formats and question types for your course.

---

## Step 6: Validate Configuration

### Use /teaching:validate

Scholar provides validation to catch errors:

```bash
/teaching:validate
```

**Example output:**

```
📋 VALIDATING CONFIGURATION

Config file: .flow/teach-config.yml

✓ Schema Validation
  ✓ course_info.level: "undergraduate" (valid)
  ✓ course_info.field: "statistics" (valid)
  ✓ course_info.difficulty: "intermediate" (valid)
  ✓ defaults.exam_format: "markdown" (valid)
  ✓ style.tone: "conversational" (valid)
  ✓ style.notation: "statistical" (valid)

✓ 15 validation rules passed
✗ 2 warnings found

Warnings:
  ⚠ style.proof_style: "rigorous-with-intuition" not in enum
     → Did you mean "intuitive" or "rigorous"?

  ⚠ defaults.question_types: "free-response" deprecated
     → Use "short-answer" instead

Recommendations:
  • Set exam_questions default (currently using plugin default: 30)
  • Consider adding R package preferences
  • Add LaTeX configuration for consistent notation

✓ Configuration is valid (with warnings)
```

### Common Validation Errors

**Error 1: Invalid level**
```yaml
course_info:
  level: "masters"  # ✗ Invalid
```
**Fix:**
```yaml
course_info:
  level: "graduate"  # ✓ Valid
```

**Error 2: Unknown field**
```yaml
course_info:
  subject: "statistics"  # ✗ Wrong key
```
**Fix:**
```yaml
course_info:
  field: "statistics"  # ✓ Correct key
```

**Error 3: Invalid format**
```yaml
defaults:
  exam_format: "word"  # ✗ Not supported
```
**Fix:**
```yaml
defaults:
  exam_format: "markdown"  # ✓ Supported
```

> **New in v2.9.0:** For more comprehensive validation, use `/teaching:config validate` which checks prompts, lesson plans, and teaching styles in addition to `teach-config.yml`. See [Config Management Tutorial](config-management.md) for details.

**✅ Checkpoint:** Run `/teaching:validate` and fix any errors.

---

## Step 7: Test with Actual Commands

### Generate a Sample Quiz

Test your configuration:

```bash
/teaching:quiz "Hypothesis Testing"
```

**Expected behavior:**
- Uses `defaults.quiz_format` (e.g., markdown)
- Uses `defaults.question_types` (only allowed types)
- Uses `style.tone` (e.g., conversational)
- Uses `style.examples` (includes worked examples if true)

### Verify Configuration Applied

Check generated quiz file for evidence:

```markdown
# Hypothesis Testing Quiz

**Instructions:** Select the best answer for each question.

<!-- Configuration Applied:
  Level: undergraduate
  Field: statistics
  Tone: conversational
  Format: markdown
  Generated: 2026-02-01
-->

## Question 1 (Multiple Choice)

When testing H₀: μ = 50, which statement is most accurate?

a) If we reject H₀, we've proven μ ≠ 50
b) If we fail to reject H₀, we've proven μ = 50
c) Rejecting H₀ means we have evidence against μ = 50
d) The p-value tells us the probability H₀ is true

**Answer:** c

**Explanation:** Rejecting the null hypothesis means our data provided sufficient evidence *against* H₀ = 50, but doesn't *prove* it's false. We never prove hypotheses—we gather evidence.
```

**Signs configuration worked:**
- ✓ Conversational tone ("most accurate", "doesn't prove")
- ✓ Multiple choice question (from question_types)
- ✓ Undergraduate level (no advanced calculus)
- ✓ Statistical notation (H₀, μ)
- ✓ Markdown format

### Generate a Sample Lecture

```bash
/teaching:lecture --topic="Simple Linear Regression" --duration=50
```

**Verify:**
- Format matches `defaults.lecture_format`
- Tone matches `style.tone`
- Examples included if `style.examples: true`
- Notation matches `style.notation`

**✅ Checkpoint:** Generate quiz and lecture, verify config applied.

---

## Advanced Configuration

### Command-Specific Overrides

Override course defaults for specific commands:

```yaml
scholar:
  course_info:
    level: "undergraduate"

  style:
    tone: "conversational"  # Default for all commands

  command_overrides:
    exam:
      tone: "formal"  # ✓ Override for exams only
      examples: false # ✓ Theory-focused exams

    lecture:
      examples: true  # ✓ Lots of examples in lectures
      code_comments: "verbose"
```

**Result:**
- Lectures: Conversational with many examples
- Exams: Formal with theory focus
- Quizzes: Use course default (conversational)

### R Package Preferences

Specify preferred R packages for code examples:

```yaml
style:
  r_packages:
    - "tidyverse"   # Data manipulation
    - "ggplot2"     # Plotting
    - "broom"       # Model tidying
    - "patchwork"   # Multi-panel figures

  # Avoid base R vs tidyverse debates
  pipe_style: "native"  # |> (R 4.1+) or %>% (magrittr)
```

### LaTeX Notation Configuration

Customize mathematical notation:

```yaml
style:
  notation_rules:
    vectors: "bold"              # Bold (v) or arrow (⃗v)
    matrices: "capital-bold"     # Bold caps (X)
    parameters: "greek"          # Greek (β) or letters (b)
    random_variables: "capital"  # Caps (X) or any (x)

  equation_numbering: true       # Number equations
  theorem_style: "theorem-proof" # or "informal"
```

### Full Advanced Example

```yaml
scholar:
  course_info:
    level: "graduate"
    field: "statistics"
    difficulty: "advanced"
    institution: "University"
    department: "Statistics"

  defaults:
    exam_format: "latex"
    lecture_format: "quarto"
    assignment_format: "quarto"
    exam_questions: 60
    quiz_questions: 15
    assignment_problems: 10

    question_types:
      - "short-answer"
      - "calculation"
      - "proof"

  style:
    tone: "technical"
    notation: "statistical"
    examples: true
    proof_style: "rigorous"

    r_packages:
      - "tidyverse"
      - "broom"
      - "patchwork"

    notation_rules:
      vectors: "bold"
      matrices: "capital-bold"
      parameters: "greek"

    equation_numbering: true

  command_overrides:
    exam:
      examples: false        # Theory-focused
      proof_style: "rigorous"

    lecture:
      examples: true         # Example-heavy
      code_comments: "verbose"

  metadata:
    course_code: "STAT 701"
    semester: "Spring 2026"
    instructor: "Dr. Smith"
```

---

## Configuration Discovery

### How Scholar Finds Config

Scholar searches for `.flow/teach-config.yml` in this order:

1. Current directory: `./flow/teach-config.yml`
2. Parent directory: `../flow/teach-config.yml`
3. Grandparent: `../../flow/teach-config.yml`
4. ... (up to 5 levels)

**Stops at first match.**

### Multiple Course Scenario

```
teaching/
├── stat-301/
│   ├── .flow/teach-config.yml  # Undergrad config
│   └── content/
└── stat-701/
    ├── .flow/teach-config.yml  # Graduate config
    └── content/
```

Scholar uses correct config based on working directory.

### Explicit Config Path

Override automatic discovery:

```bash
/teaching:exam "Midterm" --config=/path/to/custom-config.yml
```

---

## Troubleshooting

### Issue 1: Config Not Found

**Error:**
```
Warning: No .flow/teach-config.yml found, using plugin defaults
```

**Solution:**
```bash
# Verify file exists
ls .flow/teach-config.yml

# Check working directory
pwd

# Should be in course root, not subdirectory
```

### Issue 2: YAML Syntax Error

**Error:**
```
Error: Invalid YAML in teach-config.yml line 12
```

**Solution:**
```bash
# Validate YAML syntax
yamllint .flow/teach-config.yml

# Common issues:
# - Missing space after colon (key:value should be key: value)
# - Inconsistent indentation (use 2 spaces)
# - Unquoted strings with special characters
```

### Issue 3: Changes Not Applied

**Symptom:** Modified config but output unchanged

**Solution:**
```bash
# 1. Validate config
/teaching:validate

# 2. Verify Scholar sees changes
/teaching:validate --verbose

# 3. Check command uses correct config
# Look for "[scholar:config]" debug logs
```

### Issue 4: Field Not Recognized

**Error:**
```
Warning: course_info.field "data science" not in schema
```

**Solution:**
```yaml
# Use hyphenated, not space
field: "data-science"  # ✓ Valid
field: "data science"  # ✗ Invalid
```

---

## Best Practices

### DO ✅

- **Start with minimal config** - Add settings as needed
- **Use validate often** - Catch errors early
- **Document custom settings** - Add YAML comments
- **Version control config** - Track changes over time
- **Test with sample commands** - Verify changes work

### DON'T ❌

- **Don't copy configs blindly** - Adapt to your course
- **Don't ignore warnings** - They indicate likely issues
- **Don't skip validation** - Prevents mysterious errors
- **Don't use spaces in field names** - Use hyphens
- **Don't nest too deeply** - Keep config readable

---

## Example Configurations

### Undergraduate Intro Course

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "beginner"

  defaults:
    exam_format: "markdown"
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"

  style:
    tone: "conversational"
    notation: "statistical"
    examples: true
```

### Graduate Theory Course

```yaml
scholar:
  course_info:
    level: "graduate"
    field: "statistics"
    difficulty: "advanced"

  defaults:
    exam_format: "latex"
    lecture_format: "latex"
    question_types:
      - "proof"
      - "calculation"

  style:
    tone: "technical"
    notation: "mathematical"
    examples: false
    proof_style: "rigorous"
```

### Data Science Bootcamp

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "data-science"
    difficulty: "intermediate"

  defaults:
    exam_format: "quarto"
    assignment_format: "quarto"
    question_types:
      - "short-answer"
      - "coding"

  style:
    tone: "conversational"
    notation: "machine-learning"
    examples: true

    r_packages:
      - "tidyverse"
      - "tidymodels"
      - "ggplot2"
```

---

## Next Steps

Now that you've configured Scholar:

1. **Generate course materials**: [Lecture Notes Tutorial](lecture-notes.md)
2. **Create assessments**: [Assignments Tutorial](assignments-solutions-rubrics.md)
3. **Explore workflows**: [Teaching Workflows](../../TEACHING-WORKFLOWS.md)
4. **Get help**: [Teaching FAQ](../../help/FAQ-teaching.md)
5. **Manage config & prompts**: [Config Management Tutorial](config-management.md)

---

## Summary

You've learned to:

- ✅ Understand Scholar's 4-layer configuration hierarchy
- ✅ Create `.flow/teach-config.yml` for your course
- ✅ Configure course information and teaching style
- ✅ Set default formats and question types
- ✅ Validate configuration for errors
- ✅ Test configuration with actual commands
- ✅ Troubleshoot common configuration issues

**Time investment:** 45 minutes
**Time saved:** Consistent course materials throughout semester

**Key takeaway:** Proper configuration ensures all Scholar-generated materials match your teaching philosophy, course level, and institutional requirements without manual adjustment.

---

## See Also

- [Teaching Workflows](../../TEACHING-WORKFLOWS.md)
- [Lecture Notes Tutorial](lecture-notes.md)
- [Assignments Tutorial](assignments-solutions-rubrics.md)
- [Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md)
- [Teaching Style Guide](../../TEACHING-STYLE-GUIDE.md)
- [Config Management Tutorial](config-management.md)
