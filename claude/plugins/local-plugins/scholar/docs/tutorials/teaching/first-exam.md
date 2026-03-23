# Tutorial: Your First Exam

**Time:** 10 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- Access to Claude API (ANTHROPIC_API_KEY set)

**What you'll learn:**

- Generate your first exam with AI assistance
- Customize difficulty and question types
- Export to multiple formats (Markdown, Quarto, LaTeX, Canvas QTI)
- Preview exams without API calls
- Create grading rubrics automatically

---

## Step 1: Basic Exam Generation ⏱️ 2 minutes

**What to do:**

Generate a basic midterm exam using the default settings. This will create a 10-question exam with mixed question types (multiple-choice, short-answer, and essay questions).

**Example:**

```bash
/teaching:exam midterm
```

**What you'll see:**

Scholar will generate an exam file with the following structure:

```markdown
# Midterm Exam - [Course]

**Duration:** 60 minutes
**Total Points:** 100

## Instructions
- Show all work for full credit
- Calculator permitted
- No notes or textbooks allowed

## Part I: Multiple Choice (60 points)

**Question 1** (10 points)
What is the primary purpose of linear regression?

A) To determine causation between variables
B) To predict values of a dependent variable
C) To test for independence
D) To calculate probabilities

## Part II: Short Answer (30 points)

**Question 7** (10 points)
Explain the difference between Type I and Type II errors...

## Part III: Essay (10 points)

**Question 10** (10 points)
Discuss the assumptions of linear regression...

---

## Answer Key

**Question 1:** B
**Question 2:** C
...
```

The exam will be saved to `exam-midterm.md` in your current directory.

**✅ Checkpoint:**

- Run `ls -l exam-midterm.md` to verify the file exists
- Open the file and confirm it contains 10 questions
- Check that you see multiple-choice, short-answer, and essay questions

---

## Step 2: Customize Difficulty ⏱️ 3 minutes

**What to do:**

Create a configuration file to customize the difficulty level and course information. This allows Scholar to tailor questions to your specific course and difficulty expectations.

First, create the configuration directory structure:

```bash
mkdir -p .flow
```

Then create a configuration file at `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"  # Options: beginner, intermediate, advanced

  defaults:
    exam_format: "markdown"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "numerical"

  style:
    tone: "formal"
    notation: "statistical"
    examples: true
    difficulty_progression: "gradual"
```

**Example:**

Now generate a new exam with your customized settings:

```bash
/teaching:exam final --questions 15 --difficulty hard
```

**What you'll see:**

A more challenging exam tailored to your course configuration:

```markdown
# Final Exam - STAT-440: Regression Analysis

**Duration:** 120 minutes
**Total Points:** 150

## Instructions
- Show all work including statistical notation
- Graphing calculator permitted
- Formula sheet provided

## Part I: Multiple Choice (90 points)

**Question 1** (6 points)
In multiple linear regression with multicollinearity, which of the following statements is true?

A) The variance inflation factor (VIF) will be less than 1
B) Standard errors of coefficient estimates will be inflated
C) R² will necessarily decrease
D) Residuals will exhibit heteroscedasticity

...
```

**✅ Checkpoint:**

- Verify the exam header shows your course code and title
- Questions should reflect the "hard" difficulty level with more complex concepts
- Numerical questions should appear (if specified in question_types)
- Check that questions progress from easier to harder concepts

---

## Step 3: Export to Different Formats ⏱️ 2 minutes

**What to do:**

Scholar supports multiple output formats for different use cases. Generate the same exam in Markdown, Quarto, and LaTeX formats.

**Example:**

```bash
# Markdown format (human-readable, examark-compatible)
/teaching:exam midterm --format md

# Quarto format (for PDF/HTML rendering via Quarto)
/teaching:exam midterm --format qmd

# LaTeX format (for academic typesetting)
/teaching:exam midterm --format tex

# Canvas QTI format (for LMS import via examark)
/teaching:exam midterm --format canvas
```

**What you'll see:**

Three different files will be created in your current directory:

**1. Markdown (`exam-midterm.md`):**

```markdown
# Midterm Exam

**Question 1** (10 points)
What is the purpose of...
```

**2. Quarto (`exam-midterm.qmd`):**

```markdown
---
title: "Midterm Exam"
format: pdf
---

## Question 1 {points="10"}

What is the purpose of...
```

**3. LaTeX (`exam-midterm.tex`):**

```latex
\documentclass{article}
\begin{document}

\section*{Midterm Exam}

\begin{question}{10}
What is the purpose of...
\end{question}

\end{document}
```

**Use cases:**

- **Markdown (`.md`):** Quick review, examark integration, version control
- **Quarto (`.qmd`):** Professional PDF generation with `quarto render exam-midterm.qmd`
- **LaTeX (`.tex`):** Academic publishing, precise typesetting control

**✅ Checkpoint:**

- Run `ls -l exam-midterm.*` and verify all three files exist
- Check file sizes are reasonable (not empty)
- Open each file to verify proper formatting for that format type
- If you have Quarto installed, test rendering: `quarto render exam-midterm.qmd`

---

## Step 4: Preview Without API Calls ⏱️ 1 minute

**What to do:**

Use the `--dry-run` flag to preview the exam generation process without making actual API calls. This is useful for:

- Testing your configuration
- Estimating API costs before generation
- Verifying command syntax
- Saving API credits during development

**Example:**

```bash
/teaching:exam final --questions 20 --difficulty hard --dry-run
```

**What you'll see:**

Scholar will display the generation plan without executing it:

```
🔍 DRY RUN MODE - No API calls will be made

Exam Generation Plan:
  Type: final
  Questions: 20
  Difficulty: hard
  Duration: 120 minutes
  Format: markdown (default)

Configuration:
  Course: STAT-440 - Regression Analysis
  Level: undergraduate
  Field: statistics

Question Distribution:
  Multiple-choice: 12 questions (60%)
  Short-answer: 6 questions (30%)
  Essay: 2 questions (10%)

Estimated API Costs:
  Input tokens: ~3,500
  Output tokens: ~8,000
  Estimated cost: $0.12

Output Files:
  - exam-final.md (Markdown)

To proceed with generation, remove --dry-run flag
```

**Why this matters:**

- **Save money:** Verify settings before spending API credits
- **Catch errors:** Find configuration issues before generation
- **Plan budgets:** Estimate costs for batch exam generation
- **Test workflows:** Validate command syntax in scripts

**✅ Checkpoint:**

- Confirm no files were created (dry run doesn't generate files)
- Verify the plan shows your expected settings
- Note the estimated API cost
- If the plan looks wrong, adjust your command and re-run dry-run

---

## Step 5: Create Grading Rubric ⏱️ 2 minutes

**What to do:**

Generate a grading rubric to accompany your exam. This provides detailed scoring criteria for subjective questions (short-answer and essay questions).

**Example:**

```bash
/teaching:rubric midterm
```

**What you'll see:**

A detailed rubric file (`rubric-midterm.md`) with scoring criteria:

```markdown
# Grading Rubric - Midterm Exam

## Multiple Choice Questions (60 points)
- Each question: 10 points (correct) or 0 points (incorrect)
- No partial credit

## Short Answer Questions (30 points)

### Question 7: Type I and Type II Errors (10 points)

| Criteria | Excellent (9-10) | Good (7-8) | Fair (5-6) | Poor (0-4) |
|----------|-----------------|------------|-----------|-----------|
| **Definition Accuracy** | Both errors defined correctly with precise statistical language | Both defined correctly with minor imprecision | One error defined correctly | Neither error defined correctly |
| **Real-world Example** | Clear, relevant example demonstrating understanding | Adequate example with some relevance | Weak or generic example | No example or incorrect example |
| **Trade-off Explanation** | Clearly explains relationship between errors | Mentions relationship | Vague understanding | No mention of relationship |

**Key Points to Award Credit:**
- Type I: Rejecting true null hypothesis (2 points)
- Type II: Failing to reject false null hypothesis (2 points)
- Example demonstrating Type I (2 points)
- Example demonstrating Type II (2 points)
- Explanation of trade-off (2 points)

### Question 8: Confidence Intervals (10 points)

| Criteria | Excellent (9-10) | Good (7-8) | Fair (5-6) | Poor (0-4) |
|----------|-----------------|------------|-----------|-----------|
| **Interpretation** | Correct interpretation of 95% confidence | Minor interpretation issues | Significant misunderstanding | Incorrect interpretation |
| **Calculation** | All steps shown, correct answer | Correct method with minor errors | Conceptual understanding, major errors | No understanding of method |

## Essay Questions (10 points)

### Question 10: Linear Regression Assumptions (10 points)

**Scoring Breakdown:**
- **Linearity** (2 points): Explains relationship between X and Y is linear
- **Independence** (2 points): Observations are independent
- **Homoscedasticity** (2 points): Constant variance of residuals
- **Normality** (2 points): Residuals normally distributed
- **Organization & Clarity** (2 points): Well-structured response with examples

**Deductions:**
- Missing assumption: -2 points each
- No examples: -1 point
- Poor organization: -1 point

---

## Total Points: 100

### Grade Scale
- A: 90-100 points
- B: 80-89 points
- C: 70-79 points
- D: 60-69 points
- F: Below 60 points
```

**Use the rubric for:**

- Consistent grading across students
- Faster grading with clear criteria
- Transparent expectations for students
- Teaching assistant training
- Grade appeals and justification

**✅ Checkpoint:**

- Run `ls -l rubric-midterm.md` to verify the file exists
- Open the file and confirm it includes criteria for essay/short-answer questions
- Check that point values match your exam
- Verify rubric covers all subjective questions (not multiple-choice)

---

## Common Issues

### Issue 1: "Command not found" or "Scholar plugin not recognized"

**Symptoms:**

- `/teaching:exam` shows "Unknown command"
- Scholar commands don't appear in autocomplete
- Error: "Plugin 'scholar' not found"

**Solution:**

1. Verify installation:

   ```bash
   claude plugin list
   ```

   Look for `scholar@local-plugins` in the output.

2. If not listed, install the plugin:

   ```bash
   # If installed via Homebrew
   claude plugin install scholar@local-plugins

   # If installed manually
   cd ~/projects/dev-tools/scholar
   ./scripts/install.sh --dev
   claude plugin install scholar@local-plugins
   ```

3. Restart Claude Code completely:
   - Exit Claude Code
   - Restart your terminal (or source your shell config)
   - Start Claude Code again

4. Verify the plugin loaded:

   ```bash
   /teaching:demo
   ```

   This should generate sample content if the plugin is working.

### Issue 2: "Configuration file not found" warning

**Symptoms:**

- Warning message: "No teach-config.yml found, using defaults"
- Generated content doesn't match your course
- Missing course code/title in exam headers

**Solution:**

1. Create the configuration directory structure:

   ```bash
   mkdir -p .flow
   ```

2. Create `.flow/teach-config.yml` in your course root directory:

   ```yaml
   scholar:
     course_info:
       code: "STAT-440"
       title: "Regression Analysis"
       level: "undergraduate"
       field: "statistics"
       difficulty: "intermediate"
   ```

3. Verify the file is readable:

   ```bash
   cat .flow/teach-config.yml
   ```

4. Re-run your exam generation command from within the course directory (or any subdirectory).

**Note:** Scholar searches parent directories for `.flow/teach-config.yml`, so you can run commands from subdirectories like `exams/` or `quizzes/` and the config will still be found.

### Issue 3: "Exam too easy" or "Exam too hard"

**Symptoms:**

- Questions don't match expected difficulty level
- Questions are too simple for your advanced course
- Questions are too complex for introductory students

**Solution:**

1. Adjust the difficulty in `.flow/teach-config.yml`:

   ```yaml
   scholar:
     course_info:
       difficulty: "beginner"    # For introductory courses
       # OR
       difficulty: "intermediate" # For mid-level courses
       # OR
       difficulty: "advanced"     # For graduate/advanced courses
   ```

2. Use the `--difficulty` flag to override for a specific exam:

   ```bash
   # Make this exam easier
   /teaching:exam midterm --difficulty easy

   # Make this exam harder
   /teaching:exam final --difficulty hard
   ```

3. Adjust question types to control complexity:

   ```yaml
   defaults:
     question_types:
       - "multiple-choice"    # Easier to grade, good for concepts
       - "true-false"         # Simple recall
       - "short-answer"       # Moderate difficulty
       - "numerical"          # Good for calculations
       - "essay"              # Highest difficulty, deepest understanding
   ```

4. Review and regenerate:
   - Use `--dry-run` to preview the difficulty level
   - Generate and review a sample exam
   - Adjust configuration based on the output
   - Regenerate until questions match your expectations

### Issue 4: "API rate limit exceeded" or timeout errors

**Symptoms:**

- Error: "Rate limit exceeded"
- Error: "Request timeout"
- Partial exam generation

**Solution:**

1. Check your API key is set:

   ```bash
   echo $ANTHROPIC_API_KEY
   ```

2. Reduce the number of questions for large exams:

   ```bash
   # Instead of 50 questions at once
   /teaching:exam midterm --questions 10
   ```

3. Increase timeout in configuration (if needed):

   ```yaml
   ai_generation:
     timeout: 60000  # 60 seconds instead of default 30
     max_retries: 5   # More retry attempts
   ```

4. Generate in smaller batches:

   ```bash
   # Generate 3 separate 10-question exams
   /teaching:exam part1 --questions 10
   /teaching:exam part2 --questions 10
   /teaching:exam part3 --questions 10
   ```

5. Wait and retry:
   - Rate limits reset after a few minutes
   - Try again in 5-10 minutes
   - Consider upgrading your API tier if you hit limits frequently

---

## Next Steps

Congratulations! You've generated your first exam with Scholar. Now explore more advanced features:

### Related Tutorials

- **[Weekly Content](weekly-content.md)** - Generate lecture content and slides for your course
- **[Lecture Notes](lecture-notes.md)** - Create lecture notes for your course
- **[Building a Syllabus](syllabus.md)** - Generate a complete course syllabus with Scholar

### Advanced Workflows

- **[Semester Setup](semester-setup.md)** - Plan and generate a full semester of content
- **[Weekly Content](weekly-content.md)** - Automate weekly material creation

### Customize Your Exams

- **[Teaching Style Guide](../../TEACHING-STYLE-GUIDE.md)** - Control tone, notation, and pedagogical style
- **[Prompt Customization](../../PROMPT-CUSTOMIZATION-GUIDE.md)** - Fine-tune AI generation prompts
- **[Output Formats Guide](../../OUTPUT-FORMATS-GUIDE.md)** - Master all export formats (Canvas QTI, LaTeX, etc.)

### Integration Examples

- **[LMS Integration](../advanced/lms-integration.md)** - Import exams into Canvas, Moodle, Blackboard
- **[LMS Integration](../advanced/lms-integration.md)** - Import exams into Canvas, Moodle, Blackboard
- **[Custom Prompts](../advanced/custom-prompts.md)** - Create your own prompt templates

### Quick References

- **[Teaching Commands Refcard](../../refcards/teaching-commands.md)** - One-page reference for all commands
- **[Teaching Workflows Refcard](../../refcards/teaching-workflows.md)** - Common workflow patterns
- **[FAQ](../../help/FAQ-teaching.md)** - Frequently asked questions
- **[Common Issues](../../help/COMMON-ISSUES.md)** - Troubleshooting guide

---

## Additional Resources

### Command Reference

Full documentation for `/teaching:exam`:

- [TEACHING-COMMANDS-REFERENCE.md](../../TEACHING-COMMANDS-REFERENCE.md#teachingexam)

### Examples

See real-world exam examples:

- [Teaching Examples](../../examples/teaching.md)
- [Command Examples](../../COMMAND-EXAMPLES.md)

### Get Help

- [FAQ](../../help/FAQ-teaching.md) - Common questions
- [Troubleshooting](../../help/TROUBLESHOOTING-teaching.md) - Troubleshooting techniques

---

**🎓 Happy teaching with Scholar!**
