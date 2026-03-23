# Tutorial: Generating Student Feedback

**Time:** 5-7 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- Access to Claude API (ANTHROPIC_API_KEY set)

**What you'll learn:**

- Generate personalized, constructive feedback for student work
- Customize feedback tone and focus areas
- Provide balanced feedback with strengths and improvements
- Create actionable suggestions for student growth
- Adapt feedback for different performance levels

---

## Step 1: Basic Feedback Generation ⏱️ 2 minutes

**What to do:**

Generate comprehensive feedback for any assignment type. Scholar creates balanced feedback including strengths, areas for improvement, and actionable recommendations.

**Example:**

```bash
/teaching:feedback "Homework 3"
```

**What you'll see:**

Scholar will generate a detailed feedback document:

```markdown
# Feedback: Homework 3

**Student:** [Name placeholder]
**Score:** [X]/[Total] ([X]%)
**Date:** [Current date]

---

## Overall Assessment

Your work demonstrates good understanding of the core concepts covered in this
assignment. You've shown strong analytical skills in applying statistical methods,
though there are opportunities to strengthen your interpretation of results.

**Grade:** [Letter grade]

---

## Strengths

Your work demonstrated several strengths:

✓ **Clear problem setup** - You correctly identified the null and alternative
  hypotheses with appropriate notation

✓ **Accurate calculations** - All numerical computations were performed correctly
  with proper formulas applied

✓ **Organized presentation** - Your work was well-structured and easy to follow,
  with clear labels for each step

---

## Areas for Improvement

To strengthen your work, focus on:

1. **Statistical Interpretation**
   - Your conclusions stated results but didn't explain what they mean in context
   - Suggestion: After stating "p < 0.05", explain the practical implications
   - Resource: Review Section 4.3 on interpreting hypothesis test results

2. **Assumption Checking**
   - You applied the t-test without verifying the normality assumption
   - Suggestion: Always check assumptions before applying statistical tests
   - Resource: Complete Practice Problem Set 3 on diagnostic checks

3. **Notation Consistency**
   - Variable notation switched between problems (sometimes x̄, sometimes m)
   - Suggestion: Use consistent statistical notation throughout
   - Resource: Reference the notation guide on course website

---

## Detailed Comments

### Problem 1: Hypothesis Testing (8/10 points)
Your hypothesis test setup was excellent, and calculations were correct.
However, the interpretation lacked context - you stated the statistical
conclusion but didn't explain what it means for the research question.

### Problem 2: Confidence Interval (7/10 points)
Good calculation of the confidence interval. The interpretation was close but
technically imprecise. Remember: we're confident about the interval, not the
parameter being in it.

### Problem 3: Power Analysis (10/10 points)
Excellent work! You correctly computed power and provided clear interpretation
of what the power value means for the study.

---

## Recommendations

**To improve your understanding:**
- Review textbook Section 4.3 on hypothesis test interpretation
- Complete additional practice problems from Section 4.5
- Watch the supplemental video on practical vs. statistical significance

**Additional Resources:**
- Statistics tutoring center (Walker Hall 102): MWF 2-4 PM
- Office hours: Wednesdays 10-11 AM and by appointment

---

## Looking Ahead

You're building strong computational skills - now focus on developing your
ability to interpret results in context. This skill becomes increasingly
important as we move into more complex statistical methods.

**Next Steps:**
- Review feedback comments before starting Homework 4
- Practice interpreting results using the extra problems provided
- Consider attending office hours to discuss interpretation strategies

Remember, developing statistical thinking is a process. Your computational
accuracy shows you understand the mechanics - now we're adding the critical
thinking layer that makes statistics powerful.

---

**Questions?** Please come to office hours or email me if you'd like to
discuss this feedback.
```

The feedback will be saved to `feedback-homework-3.md` in your current directory.

**Checkpoint:**

- Run `ls -l feedback-*.md` to verify the file exists
- Open the file and confirm it includes all sections (strengths, areas for improvement, recommendations)
- Verify the feedback is balanced (both positive and constructive elements)
- Check that suggestions are specific and actionable

---

## Step 2: Customize Feedback with Score and Focus Areas ⏱️ 2 minutes

**What to do:**

Provide additional context to tailor the feedback to the student's performance level and specific issues you want to address.

**Example:**

```bash
# Include numeric score
/teaching:feedback "Midterm Exam" 72

# Specify focus areas for targeted feedback
/teaching:feedback "Research Paper" B+ --areas "analysis,interpretation,writing"

# Letter grade with focus areas
/teaching:feedback "Lab Report" C --areas "methodology,results"
```

**What you'll see:**

Feedback adapted to the performance level and focus areas:

```markdown
# Feedback: Midterm Exam

**Score:** 72/100 (72%)
**Grade:** C+

---

## Overall Assessment

Your exam performance indicates understanding of basic concepts but reveals
gaps in applying methods to more complex scenarios. You scored well on
straightforward computational problems but struggled with interpretation
and analysis questions.

**Grade:** C+

---

## Strengths

Your work demonstrated several strengths:

✓ **Fundamental calculations** - You correctly executed basic formulas and
  computational procedures in Parts I and II

✓ **Problem identification** - You generally recognized which statistical
  method to apply to each scenario

✓ **Clear work** - Your solution steps were organized and easy to follow

---

## Areas for Improvement

To strengthen your performance, focus on:

1. **Conceptual Understanding (Primary focus)**
   - Many errors occurred in interpretation rather than calculation
   - Suggestion: Practice explaining what results mean, not just computing them
   - Resource: Review lecture notes with emphasis on "interpretation" sections

2. **Assumption Checking**
   - Several problems where you applied methods without verifying conditions
   - Suggestion: Create a checklist of assumptions for each statistical test
   - Resource: Assumption reference sheet on course website

3. **Complex Problem Solving**
   - Struggled with multi-step problems requiring integration of concepts
   - Suggestion: Work through textbook examples completely before checking solutions
   - Resource: Additional practice problems in Chapter 5 (odd numbers have solutions)

---

## Detailed Comments

### Part I: Multiple Choice (42/60 points)
You did well on definition and formula questions but struggled with scenario-based
questions requiring deeper understanding. Focus on connecting concepts to applications.

### Part II: Short Answer (20/30 points)
Calculations were generally accurate, but explanations were incomplete or imprecise.
Statistical writing requires precision - review example solutions for language to use.

### Part III: Essay (10/10 points)
Excellent work! Your discussion of regression assumptions was thorough and well-explained.

---

## Recommendations

**Immediate actions for improvement:**
- Schedule office hours appointment to review challenging concepts
- Complete practice exam problems in Section 5.8 (with solutions)
- Join study group or attend tutoring sessions weekly

**Resources:**
- Statistics tutoring center (Walker Hall 102): MWF 2-4 PM
- Online practice quizzes on course website with instant feedback
- Textbook supplemental materials (videos and interactive exercises)

**For the final exam:**
- Start preparing at least two weeks in advance
- Focus study time on interpretation and application, not just formulas
- Practice with cumulative review problems from chapters 1-8

---

## Looking Ahead

This grade is concerning, but you can improve significantly with focused effort.
The remaining coursework (30% of your grade) and the final exam (30%) provide
opportunities to demonstrate growth. I'm committed to helping you succeed -
please take advantage of office hours and available resources.

**Next Steps:**
- Email me within 48 hours to schedule a meeting
- Review this feedback carefully and identify specific topics to review
- Start working on practice problems immediately

Remember, struggling with statistics is normal - but seeking help early and
practicing regularly makes all the difference. Let's work together to turn
this around before the final.

---

**Important:** Please schedule an appointment within the next week to discuss
your performance and create an improvement plan.
```

**Performance-adapted tone:**

- **High scores (A, 90-100%):** Praise accomplishment, suggest advanced challenges
- **Good scores (B, 80-89%):** Acknowledge success, provide specific improvements
- **Satisfactory (C, 70-79%):** Balanced feedback, clear improvement path
- **Needs improvement (D, 60-69%):** Supportive but direct, emphasize resources
- **Unsatisfactory (F, <60%):** Concerned tone, urgent call for meeting and support

**Checkpoint:**

- Verify feedback tone matches the performance level provided
- Check that focus areas are prominently addressed in "Areas for Improvement"
- Confirm recommendations are appropriate for the score level
- Review that encouragement level is calibrated to performance

---

## Step 3: Adapt Feedback Style ⏱️ 1 minute

**What to do:**

Customize the tone and style of feedback to match your teaching philosophy and course culture. Scholar can adapt from formal to conversational, from brief to detailed.

**Example:**

Create a configuration file at `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"

  style:
    tone: "conversational"      # Options: "formal", "conversational"
    examples: true              # Include specific examples
```

Then generate feedback:

```bash
/teaching:feedback "Final Project" A-
```

**What you'll see:**

**Conversational tone (when configured):**
```markdown
# Feedback: Final Project

Great work on your final project! You've really pulled together everything
we've learned this semester.

## What You Did Well

I was impressed by several aspects of your project:

✓ **Creative research question** - You chose a genuinely interesting question
  that mattered to you, and that enthusiasm showed in your work

✓ **Thorough analysis** - You went beyond basic requirements and explored
  multiple analytical approaches

✓ **Beautiful visualizations** - Your graphs were clear, properly labeled,
  and really helped tell the story of your data

## Where You Can Grow

Here are a few areas to think about for future projects:

[Rest of feedback in conversational tone]
```

**Formal tone (default):**
```markdown
# Feedback: Final Project

Your final project demonstrates strong command of statistical methods and
clear analytical thinking.

## Strengths

Your work exhibited several notable strengths:

✓ **Research question formulation** - The question was well-defined,
  appropriately scoped, and addressed a meaningful problem

[Rest of feedback in formal academic tone]
```

**Checkpoint:**

- Verify the tone matches your configuration (formal vs. conversational)
- Check that the style feels appropriate for your course level
- Confirm examples are included if requested
- Review that the tone is consistent throughout the document

---

## Step 4: Generate Feedback for Different Assignment Types ⏱️ 1 minute

**What to do:**

Scholar adapts feedback structure and focus based on assignment type. Homework feedback emphasizes problem-solving, exam feedback focuses on content mastery, and paper feedback addresses writing and analysis.

**Example:**

```bash
# Homework/problem set feedback
/teaching:feedback "Problem Set 5" 85

# Exam feedback
/teaching:feedback "Final Exam" 78

# Paper/report feedback
/teaching:feedback "Research Paper" B+ --areas "writing,analysis"

# Lab/project feedback
/teaching:feedback "Lab 3" 92 --areas "methodology,interpretation"

# Presentation feedback
/teaching:feedback "Class Presentation" A- --areas "delivery,content"
```

**What you'll see:**

Feedback adapted to assignment type:

**Homework/Problem Sets:**
- Focus on problem-solving process
- Emphasis on showing work and explanation
- Comments on computational accuracy
- Suggestions for approaching similar problems

**Exams/Quizzes:**
- Performance by section/topic area
- Time management comments if relevant
- Study strategies for future exams
- Concepts requiring additional review

**Papers/Reports:**
- Organization and structure
- Argument quality and evidence
- Writing clarity and academic style
- Citation and formatting
- Depth of analysis

**Labs/Projects:**
- Methodology and experimental design
- Data collection and analysis
- Interpretation of results
- Presentation quality
- Collaboration (if group work)

**Checkpoint:**

- Verify feedback addresses aspects relevant to the assignment type
- Check that criteria match what you emphasize for that assignment type
- Confirm suggestions are appropriate for the specific assignment context

---

## Step 5: Preview Feedback Structure ⏱️ 1 minute

**What to do:**

Use `--dry-run` to preview the feedback structure before generating content. This helps ensure settings are correct and lets you verify the approach.

**Example:**

```bash
/teaching:feedback "Midterm Exam" 75 --areas "interpretation,assumptions" --dry-run
```

**What you'll see:**

```
🔍 DRY RUN MODE - No API calls will be made

Feedback Generation Plan:
  Assignment: Midterm Exam
  Score: 75/100 (C)
  Focus Areas: interpretation, assumptions

Feedback Structure:
  ✓ Overall Assessment (performance-appropriate for C grade)
  ✓ Strengths Section (3-4 specific positive points)
  ✓ Areas for Improvement (emphasis on focus areas)
    - Interpretation skills (primary focus)
    - Assumption checking (primary focus)
    - Additional areas as needed
  ✓ Detailed Comments (section-by-section)
  ✓ Recommendations (resources and study strategies)
  ✓ Looking Ahead (encouraging, appropriate for score level)

Tone & Style:
  Performance level: Satisfactory (C) - balanced, supportive
  Focus: Growth-oriented with clear action steps
  Resources: Office hours, tutoring, textbook sections

Configuration:
  Course level: undergraduate
  Field: statistics
  Tone: formal (from teach-config.yml)

Estimated API Costs:
  Input tokens: ~2,500
  Output tokens: ~3,800
  Estimated cost: $0.06

Output Files:
  - feedback-midterm-exam.md

To proceed with generation, remove --dry-run flag
```

**Checkpoint:**

- Confirm no files were created (dry run doesn't generate content)
- Verify focus areas will be emphasized appropriately
- Check that tone and structure match your expectations
- Note the estimated cost

---

## Common Issues

### Issue 1: "Feedback too generic or not specific enough"

**Symptoms:**

- Feedback uses placeholder language
- Comments don't reference actual assignment content
- Suggestions aren't actionable

**Solution:**

Scholar generates template feedback that you should customize:

1. **Add specific examples:**
   ```markdown
   # Before (generic)
   Your calculations were accurate.

   # After (specific)
   Your calculation of the confidence interval in Problem 3 was correct,
   including proper use of the t-distribution.
   ```

2. **Reference actual student work:**
   - Add specific problem numbers or sections
   - Quote or paraphrase student responses
   - Reference particular errors or successes

3. **Use as a starting point:**
   - Generate feedback with Scholar
   - Customize with student-specific details
   - Add references to specific content

### Issue 2: "Tone doesn't match my teaching style"

**Symptoms:**

- Feedback feels too formal or too casual
- Language doesn't reflect your voice
- Doesn't match how you normally communicate

**Solution:**

1. Adjust tone in configuration:

   ```yaml
   scholar:
     style:
       tone: "conversational"    # or "formal"
   ```

2. Edit generated feedback to match your voice:
   - Replace formal phrases with your typical language
   - Adjust level of formality
   - Add personal touches

3. Create custom feedback templates:
   - Save edited feedback as templates
   - Reuse structure with your preferred style

### Issue 3: "Need to generate feedback for many students"

**Symptoms:**

- Time-consuming to generate individual feedback for each student
- Want consistent structure across all feedback
- Need to track common issues across class

**Solution:**

**For batch feedback:**

1. Generate one feedback template per score level:
   ```bash
   /teaching:feedback "Exam 2" 95  # High performers
   /teaching:feedback "Exam 2" 85  # Good performers
   /teaching:feedback "Exam 2" 75  # Average performers
   /teaching:feedback "Exam 2" 65  # Struggling students
   ```

2. Customize each template with student-specific details

3. Track common issues to address in class review session

**For class-wide feedback:**
- Use generated feedback to identify common areas for improvement
- Create a "General Feedback" document highlighting class-wide patterns
- Combine with individualized comments on specific student work

---

## Next Steps

Congratulations! You've learned to generate constructive student feedback with Scholar. Now explore related features:

### Related Tutorials

- **[Creating Quizzes](quiz.md)** - Generate assessments that pair with feedback
- **[Your First Exam](first-exam.md)** - Create exams and then provide feedback
- **[Semester Setup](semester-setup.md)** - Plan feedback opportunities throughout term

### Follow-up Actions

After generating feedback, you can:

- **Create grading rubric** - `/teaching:rubric` for consistent evaluation
- **Generate study guide** - Help students prepare based on common issues
- **Create practice problems** - Address common misconceptions
- **Plan review session** - Focus on areas identified in feedback

### Best Practices

**Effective feedback includes:**
- Specific examples from student work
- Balance of strengths and improvements
- Actionable suggestions for growth
- Resources for further learning
- Encouragement and support

**Timing matters:**
- Provide feedback quickly (within 1-2 weeks)
- Include time for students to act on feedback
- Allow questions and follow-up discussions
- Reference feedback in future assignments

### Quick References

- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md#teachingfeedback)** - Complete command documentation
- **[Teaching Style Guide](../../TEACHING-STYLE-GUIDE.md)** - Pedagogical approach customization
- **[Common Issues](../../help/COMMON-ISSUES.md)** - Troubleshooting guide

---

**Happy teaching with Scholar!**
