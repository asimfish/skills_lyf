# Tutorial: Creating Quizzes

**Time:** 5-7 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- Access to Claude API (ANTHROPIC_API_KEY set)

**What you'll learn:**

- Generate quiz questions quickly for any topic
- Customize question count and difficulty level
- Mix multiple question types (multiple-choice, true/false, short-answer)
- Export to multiple formats (Markdown, Canvas QTI, PDF)
- Create answer keys with explanations

---

## Step 1: Quick Quiz Generation ⏱️ 2 minutes

**What to do:**

Generate a basic 10-question quiz on any topic using default settings. Scholar will create a mix of question types with an answer key and explanations.

**Example:**

```bash
/teaching:quiz "Linear Regression"
```

**What you'll see:**

Scholar will generate a quiz file with multiple question types:

```markdown
# Quiz: Linear Regression

**Instructions:** Select the best answer for each question.

---

## Question 1 (Multiple Choice)

What is the primary purpose of linear regression analysis?

A) To establish causation between variables
B) To predict values of a dependent variable based on independent variables
C) To test for statistical independence
D) To calculate probability distributions

**Answer:** B
**Explanation:** Linear regression is primarily used for prediction and modeling
the relationship between dependent and independent variables, not for establishing
causation.
**Learning Objective:** Understand the purpose and applications of regression analysis
**Difficulty:** Easy

---

## Question 2 (True/False)

The coefficient of determination (R²) can be negative in linear regression.

**Answer:** False
**Explanation:** R² ranges from 0 to 1, representing the proportion of variance
explained by the model. It cannot be negative.
**Difficulty:** Medium

---

## Question 3 (Multiple Choice)

Which assumption of linear regression is violated when residuals show a pattern?

A) Linearity
B) Independence
C) Homoscedasticity
D) Normality

**Answer:** C
**Explanation:** When residuals show a pattern (like a funnel shape), it indicates
heteroscedasticity - non-constant variance of errors.
**Difficulty:** Medium

---

## Question 4 (Short Answer)

Explain what the slope coefficient represents in a simple linear regression model.

**Sample Answer:** The slope coefficient represents the expected change in the
dependent variable for a one-unit increase in the independent variable, holding
all else constant.

**Grading Rubric:**
- Full credit (2 pts): Mentions change in Y, one-unit change in X, and direction
- Partial credit (1 pt): Mentions relationship but lacks specifics

---

[Continues for 10 questions total]

---

## Answer Key

1. B  2. False  3. C  4. [See sample answer]  5. A  6. True  7. D  8. [See sample]
9. B  10. C
```

The quiz will be saved to `quiz-linear-regression.md` in your current directory.

**Checkpoint:**

- Run `ls -l quiz-*.md` to verify the file exists
- Open the file and confirm it contains 10 questions
- Check for a mix of multiple-choice, true/false, and short-answer questions
- Verify each question includes an answer and explanation

---

## Step 2: Specify Question Count and Types ⏱️ 2 minutes

**What to do:**

Customize the number of questions and difficulty level to match your course needs. You can create shorter quizzes for formative assessment or longer ones for comprehensive review.

**Example:**

```bash
# Short quiz with 5 questions
/teaching:quiz "Confidence Intervals" 5

# Longer quiz with specific question count
/teaching:quiz "Hypothesis Testing" --questions 15

# Mix difficulty levels
/teaching:quiz "ANOVA" 12 --difficulty mixed
```

**What you'll see:**

A quiz with your specified parameters:

```markdown
# Quiz: Confidence Intervals

**Instructions:** Select the best answer for each question.
**Time Estimate:** 5-7 minutes
**Total Questions:** 5

---

## Question 1 (Multiple Choice) - Easy

What does a 95% confidence interval mean?

A) There is a 95% chance the true parameter is in the interval
B) 95% of the data falls within the interval
C) If we repeated sampling many times, 95% of intervals would contain the true parameter
D) The parameter has a 95% probability of being correct

**Answer:** C
[Explanation provided]

---

## Question 2 (Multiple Choice) - Medium

How does increasing the sample size affect the width of a confidence interval?

A) Makes it wider
B) Makes it narrower
C) Has no effect
D) Depends on the confidence level

**Answer:** B
[Explanation provided]

---

[Questions 3-5 continue with mixed difficulty]
```

**Question distribution for 10-question quiz:**

- 6 Multiple Choice (60%)
- 2 True/False (20%)
- 1 Short Answer (10%)
- 1 Calculation (10%)

This distribution adjusts proportionally for different quiz lengths.

**Checkpoint:**

- Verify the quiz has the requested number of questions
- Check that difficulty labels appear on each question
- Confirm question types are distributed appropriately
- Review that time estimate reflects question count (1-2 min per question)

---

## Step 3: Set Difficulty Level ⏱️ 1 minute

**What to do:**

Control quiz difficulty to match your assessment goals. Use easier quizzes for formative assessment and harder quizzes for summative evaluation.

**Example:**

```bash
# Easy quiz for beginners or review
/teaching:quiz "Basic Probability" 8 --difficulty easy

# Hard quiz for advanced students
/teaching:quiz "Bayesian Analysis" 10 --difficulty hard

# Mixed difficulty (default)
/teaching:quiz "Sampling Methods" 10 --difficulty mixed
```

**What you'll see:**

**Easy Difficulty:**
```markdown
## Question 1 (Multiple Choice) - Easy

What is probability?

A) A measure of uncertainty for an event
B) The number of favorable outcomes
C) A percentage greater than 100
D) A type of statistic

[Simple recall questions, basic concepts]
```

**Hard Difficulty:**
```markdown
## Question 1 (Multiple Choice) - Hard

In a Bayesian framework with a Beta(2,5) prior and observing 8 successes
in 10 trials, what is the posterior distribution?

A) Beta(10, 7)
B) Beta(10, 12)
C) Beta(8, 5)
D) Beta(2, 13)

[Complex application questions requiring multi-step reasoning]
```

**Mixed Difficulty (default):**
- 40% Easy (knowledge recall)
- 40% Medium (comprehension and application)
- 20% Hard (analysis and synthesis)

**Checkpoint:**

- Review questions to confirm they match the specified difficulty
- For mixed difficulty, verify questions progress from easier to harder
- Check that easy questions focus on definitions and basic concepts
- Verify hard questions require application and analysis

---

## Step 4: Preview Quiz Output ⏱️ 1 minute

**What to do:**

Use `--dry-run` to preview the quiz structure and settings before generating content. This helps verify your settings and estimate API costs.

**Example:**

```bash
/teaching:quiz "Statistical Tests" 12 --difficulty mixed --dry-run
```

**What you'll see:**

```
🔍 DRY RUN MODE - No API calls will be made

Quiz Generation Plan:
  Topic: Statistical Tests
  Questions: 12
  Difficulty: mixed

Question Type Distribution:
  Multiple Choice: 7 questions (58%)
  True/False: 3 questions (25%)
  Short Answer: 1 question (8%)
  Calculation: 1 question (8%)

Difficulty Distribution:
  Easy: 5 questions (42%)
  Medium: 5 questions (42%)
  Hard: 2 questions (16%)

Configuration:
  Course: [From teach-config.yml if present]
  Level: undergraduate
  Field: statistics

Estimated API Costs:
  Input tokens: ~2,800
  Output tokens: ~5,000
  Estimated cost: $0.07

Output Files:
  - quiz-statistical-tests.md (Markdown)

Time Estimate: 12-24 minutes for students to complete

To proceed with generation, remove --dry-run flag
```

**Checkpoint:**

- Confirm no files were created (dry run doesn't generate content)
- Verify question count and types match your expectations
- Review difficulty distribution
- Note the estimated API cost and student completion time

---

## Step 5: Export to Multiple Formats ⏱️ 1 minute

**What to do:**

Generate quizzes in different formats for various platforms. Markdown is best for review, Canvas format for LMS import, and PDF for printed quizzes.

**Example:**

```bash
# Markdown format (default, human-readable)
/teaching:quiz "Sampling" 8 --format markdown

# Canvas QTI format (for Canvas LMS import)
/teaching:quiz "Sampling" 8 --format canvas

# PDF format (for printing)
/teaching:quiz "Sampling" 8 --format pdf

# LaTeX format (for custom formatting)
/teaching:quiz "Sampling" 8 --format latex
```

**What you'll see:**

Different formats for the same quiz content:

**Markdown (`quiz-sampling.md`):**
```markdown
# Quiz: Sampling

## Question 1 (Multiple Choice)
[Human-readable markdown format]
```

**Canvas QTI (`quiz-sampling-canvas.xml`):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<questestinterop>
  <assessment title="Quiz: Sampling">
    <section>
      <item title="Question 1">
        [Canvas-compatible QTI format for direct import]
      </item>
    </section>
  </assessment>
</questestinterop>
```

**PDF (`quiz-sampling.pdf`):**
```
[Formatted PDF with questions on first pages, answer key on last page]
```

**Use cases:**

- **Markdown (`.md`):** Quick review, version control, manual LMS entry
- **Canvas QTI (`.xml`):** Direct import to Canvas LMS (upload to Canvas quiz tool)
- **PDF (`.pdf`):** Printed quizzes, in-class assessments
- **LaTeX (`.tex`):** Custom formatting, academic typesetting

**Checkpoint:**

- Run `ls -l quiz-sampling.*` to verify all formats were generated
- For Canvas format, verify the XML file is well-formed
- If you have LaTeX, test compilation: `pdflatex quiz-sampling.tex`
- Upload Canvas XML to test LMS import (Canvas → Quizzes → Import QTI)

---

## Common Issues

### Issue 1: "Questions too easy/hard for my students"

**Symptoms:**

- Questions don't match expected difficulty level
- Students find quiz too challenging or too simple
- Questions assume wrong knowledge level

**Solution:**

1. Adjust difficulty setting:

   ```bash
   # For introductory courses
   /teaching:quiz "Topic" --difficulty easy

   # For advanced courses
   /teaching:quiz "Topic" --difficulty hard
   ```

2. Update course configuration in `.flow/teach-config.yml`:

   ```yaml
   scholar:
     course_info:
       level: "undergraduate"    # or "graduate"
       difficulty: "beginner"    # "beginner", "intermediate", "advanced"
   ```

3. Review and manually adjust questions after generation

### Issue 2: "Not enough calculation questions"

**Symptoms:**

- Quiz has mostly multiple-choice questions
- Need more computational problems
- Students need practice with formulas

**Solution:**

The default question type distribution is:
- 60% Multiple Choice
- 20% True/False
- 10% Short Answer
- 10% Calculation

After generation, you can:

1. Generate a separate calculation-focused quiz:
   ```bash
   /teaching:quiz "Statistical Formulas" 5 --difficulty medium
   ```
   Then manually curate to emphasize calculation questions

2. Manually add more calculation questions to the generated quiz

3. Request specific question types in your prompt (future enhancement)

### Issue 3: "Canvas import fails"

**Symptoms:**

- Canvas returns error when importing QTI file
- Questions don't appear correctly in Canvas
- Formatting issues in imported quiz

**Solution:**

1. Verify Canvas format was specified:

   ```bash
   /teaching:quiz "Topic" --format canvas
   ```

2. Check Canvas QTI import process:
   - Go to Canvas → Quizzes → Import Quiz
   - Upload the `.xml` file (not `.md` or `.pdf`)
   - Select "QTI 1.2" format
   - Review preview before importing

3. If import still fails, use Markdown format and manually enter questions:
   ```bash
   /teaching:quiz "Topic" --format markdown
   ```

4. Report XML validation errors (Scholar aims for Canvas compatibility)

---

## Next Steps

Congratulations! You've created your first quiz with Scholar. Now explore related features:

### Related Tutorials

- **[Your First Exam](first-exam.md)** - Create comprehensive exams with multiple sections
- **[Generating Student Feedback](feedback.md)** - Provide personalized feedback after grading
- **[Semester Setup](semester-setup.md)** - Plan quizzes throughout your semester

### Follow-up Actions

After generating a quiz, you can:

- **Create answer key document** - Extract answers to separate file for grading
- **Generate quiz variants** - Create multiple versions to prevent cheating
- **Build practice quiz** - Generate similar questions for student review
- **Create grading rubric** - `/teaching:rubric` for short-answer questions

### Advanced Usage

- **Question Banks** - Generate 20+ questions and select the best subset
- **Progressive Quizzes** - Create series of quizzes increasing in difficulty
- **Topic Coverage** - Generate quizzes to cover all syllabus topics
- **Practice Tests** - Create low-stakes practice before major exams

### Quick References

- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md#teachingquiz)** - Complete command documentation
- **[Output Formats Guide](../../OUTPUT-FORMATS-GUIDE.md)** - Details on all export formats
- **[LMS Integration](../advanced/lms-integration.md)** - Canvas, Moodle, Blackboard integration

---

**Happy teaching with Scholar!**
