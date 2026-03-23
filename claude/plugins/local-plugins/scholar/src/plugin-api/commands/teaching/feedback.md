---
name: teaching:feedback
description: Generate constructive feedback for student work
---

# Generate Student Feedback

I'll help you create personalized, constructive feedback for student assignments, exams, or projects.

**Usage:** `/teaching:feedback <assignment-type>` or `/teaching:feedback <assignment-type> <score>`

**Examples:**
- `/teaching:feedback "Homework 3"`
- `/teaching:feedback "Midterm Exam" 72`
- `/teaching:feedback "Research Paper" B+`
- `/teaching:feedback "Lab Report" 85 --areas "analysis,interpretation"`
- `/teaching:feedback "Project" --dry-run`

**Options:**
- `--score N` - Student score (numeric or letter grade)
- `--areas LIST` - Focus areas for feedback (comma-separated)
- `--format FMT` - Output format: markdown, pdf
- `--dry-run` - Preview what would be generated without API calls
- `--json` - Output dry-run as JSON (requires --dry-run)
- `--config PATH` - Explicit config file path (bypasses .flow/teach-config.yml discovery)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--debug` - Enable debug logging

<system>
## Implementation

Generate comprehensive feedback with:
1. **Overall assessment** - Summary of performance
2. **Strengths identified** - What the student did well
3. **Areas for improvement** - Specific, actionable feedback
4. **Detailed comments** - Section-by-section or question-by-question
5. **Resources for improvement** - Study materials, office hours, tutoring
6. **Encouragement** - Motivational closing

### Feedback Structure Template

```markdown
# Feedback: [Assignment Name]

**Student:** [Name placeholder]
**Score:** [X]/[Total] ([X]%)
**Date:** [Date]

---

## Overall Assessment

[2-3 sentence summary of performance - balanced and specific]

**Grade:** [Letter grade or percentage]

---

## Strengths

Your work demonstrated several strengths:

✓ [Specific strength 1 with example]
✓ [Specific strength 2 with example]
✓ [Specific strength 3 with example]

---

## Areas for Improvement

To strengthen your work, focus on:

1. **[Area 1]**
   - [Specific issue observed]
   - [Concrete suggestion for improvement]
   - [Resource or strategy to help]

2. **[Area 2]**
   - [Specific issue]
   - [Suggestion]
   - [Resource]

3. **[Area 3]**
   - [Specific issue]
   - [Suggestion]
   - [Resource]

---

## Detailed Comments

### [Section 1 / Question 1]
**Points:** [X]/[Total]

[Specific feedback on this section]

### [Section 2 / Question 2]
**Points:** [X]/[Total]

[Specific feedback]

[Continue for each major section or question]

---

## Recommendations

**To improve your understanding:**
- [Study recommendation 1]
- [Practice problem recommendation]
- [Resource recommendation (textbook section, video, etc.)]

**Office Hours:** [Times]
**Tutoring Center:** [Information]

---

## Looking Ahead

[Encouragement and forward-looking statement]

**Next Steps:**
- [Action item 1]
- [Action item 2]

Remember, [positive closing message about learning and growth]

---

**Questions?** Please come to office hours or email me if you'd like to discuss this feedback.
```

### Feedback Tone Guidelines

Use constructive, growth-oriented language:

**Constructive Phrasing:**
- ✓ "Consider adding..." not "You forgot to..."
- ✓ "This section could be strengthened by..." not "This is wrong"
- ✓ "For even better results..." not "This isn't good enough"
- ✓ "Next time, try..." not "You should have..."

**Specific vs. Vague:**
- ✓ "Your hypothesis test correctly identified the null and alternative" (specific)
- ✗ "Good job" (vague)

**Balanced Feedback:**
- Always include both strengths and areas for improvement
- Even for high-performing work, suggest ways to go deeper
- Even for struggling work, identify something done correctly

### Performance Level Templates

**Excellent Performance (A, 90-100%):**
```
Your work demonstrates strong mastery of [topic]. You've shown excellent
understanding in [specific areas]. To challenge yourself further, consider
exploring [advanced topic or extension].
```

**Good Performance (B, 80-89%):**
```
Your work shows good understanding of [topic]. You've done well with [strengths].
To reach the next level, focus on [specific improvements with concrete suggestions].
```

**Satisfactory Performance (C, 70-79%):**
```
Your work demonstrates basic understanding of [topic]. You've grasped [fundamentals].
To improve, focus on [2-3 key areas] and utilize [specific resources]. I'm available
during office hours to help.
```

**Needs Improvement (D, 60-69%):**
```
Your work shows some understanding, but several key concepts need attention. Let's
meet during office hours to discuss [specific topics]. I recommend [specific study
strategies and resources]. With focused effort, you can improve significantly.
```

**Unsatisfactory (F, <60%):**
```
This work indicates significant gaps in understanding. Please schedule an appointment
with me immediately to create an improvement plan. We'll identify specific areas to
focus on and strategies to help you succeed. [List resources and support available].
```

### Feedback Types by Assignment

**Homework/Problem Sets:**
- Correctness of solutions
- Quality of explanations
- Proper notation and formatting
- Completeness of work shown
- Understanding of concepts

**Exams/Quizzes:**
- Performance by section/topic
- Common errors and how to avoid
- Study strategies for next time
- Concepts to review
- Test-taking strategies

**Papers/Reports:**
- Organization and structure
- Argument quality and evidence
- Writing clarity and style
- Citation and formatting
- Depth of analysis
- Critical thinking

**Projects/Labs:**
- Methodology and approach
- Data quality and analysis
- Interpretation of results
- Presentation and communication
- Collaboration (if group work)
- Creativity and innovation

**Presentations:**
- Content accuracy and depth
- Organization and flow
- Delivery and engagement
- Visual aids quality
- Response to questions
- Time management

### Actionable Improvement Suggestions

Make suggestions specific and actionable:

**Vague:** "Work on your writing"
**Specific:** "Practice topic sentences: start each paragraph with a clear claim that you then support with evidence"

**Vague:** "Study more"
**Specific:** "Complete the additional practice problems in Section 4.3 of the textbook, focusing on hypothesis test setup"

**Vague:** "Review lecture notes"
**Specific:** "Re-watch the Week 5 video on confidence intervals and work through the examples pausing to solve before seeing the solution"

### Resource Recommendations

Include specific resources:
- Textbook sections to review
- Video lectures or tutorials
- Practice problem sets
- Study groups or tutoring
- Office hours schedule
- Online resources (Khan Academy, etc.)
- Writing center or math lab
- Previous assignments to revisit

### Growth Mindset Language

Use language that promotes learning:
- "This is challenging, and with practice you'll improve"
- "Mistakes are opportunities to learn"
- "Your effort is evident, let's channel it effectively"
- "You're developing these skills"
- "I've seen improvement in [area]"
- "With focused practice on [X], you'll master this"

### Feedback Timing

Provide timely feedback:
- **Quizzes:** Within 1 week
- **Homework:** Within 1-2 weeks
- **Exams:** Within 2 weeks
- **Papers:** Within 2-3 weeks
- **Projects:** Within 2-3 weeks

Indicate when major assignments will be returned.

### Special Situations

**High performer:** Challenge them to go deeper, explore extensions, mentor others

**Struggling student:** Offer extra support, break down concepts, identify prerequisite gaps

**Improved performance:** Acknowledge growth, reinforce what's working

**Declined performance:** Express concern, offer to meet, identify potential issues

**Suspected academic integrity:** Refer to policy, discuss concerns objectively

## Follow-up Actions

After generating feedback, offer:
- Create personalized study plan
- Generate practice problems for weak areas
- Prepare talking points for student meeting
- Create class-wide feedback summary (common errors)
- Generate rubric for similar future assignments
- Suggest alternative assessment formats

## Related Commands

- `/teaching:rubric` - Generate grading rubrics
- `/teaching:exam` - Create comprehensive exams
- `/teaching:quiz` - Generate quiz questions
- `/teaching:assignment` - Create homework assignments

## Dry-Run Handler

```javascript
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';

// Parse user input
const args = parseArgs(userInput);

const options = {
  assignmentType: args._[0] || '',
  score: args.score || args._[1] || null,
  focusAreas: args.areas ? args.areas.split(',').map(a => a.trim()) : [],
  format: args.format || 'markdown',
  instructions: args.instructions || args.i || null,
  dryRun: args['dry-run'] || false,
  json: args.json || false
};

// ─── Custom Instructions Pipeline ───
if (options.instructions) {
  const { InstructionMerger } = await import('../../../teaching/ai/instruction-merger.js');
  const { AIProvider } = await import('../../../teaching/ai/provider.js');
  const { loadTeachConfig } = await import('../../../teaching/config/loader.js');

  let instructionText = options.instructions;
  if (instructionText.startsWith('@')) {
    instructionText = await InstructionMerger.loadFromFile(instructionText.slice(1));
  }

  const config = loadTeachConfig(process.cwd());

  const haiku = new AIProvider({
    model: 'claude-haiku-4-5-20251001',
    apiKey: config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
    debug: options.debug
  });

  const merger = new InstructionMerger(haiku, { debug: options.debug });

  let basePrompt;
  let isCustomPrompt = false;

  try {
    const { PromptLoader } = await import('../../../teaching/ai/prompt-loader.js');
    const { PromptBuilder } = await import('../../../teaching/ai/prompt-builder.js');
    const loaded = PromptLoader.load('feedback', process.cwd());
    basePrompt = PromptBuilder.build(loaded.body, {
      assignmentType: options.assignmentType,
      score: options.score,
      focusAreas: options.focusAreas
    });
    isCustomPrompt = true;
  } catch {
    basePrompt = null;
  }

  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    const categories = await merger.analyze(allInstructions, 'feedback');
    const previewPrompt = basePrompt || `[Default feedback prompt]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'feedback'
    });

    const summary = merger.summarize(mergeResult);
    console.log(summary);
    console.log('---');
    console.log('**Accept** to generate | **Modify** to change instructions | **Cancel** to abort');

    const userResponse = await waitForUserResponse();

    if (userResponse.action === 'accept') {
      if (isCustomPrompt) {
        options.mergedPrompt = mergeResult.mergedPrompt;
      }
      options.instructionText = allInstructions;
      options.mergedCategories = categories;
      accepted = true;
    } else if (userResponse.action === 'modify') {
      allInstructions = allInstructions + '\n' + userResponse.newInstructions;
    } else if (userResponse.action === 'cancel') {
      console.log('❌ Generation cancelled.');
      process.exit(0);
    }
  }
}

// Handle dry-run mode
if (isDryRun(options)) {
  executeDryRun('feedback', options);
}

// Continue with generation...
```
</system>
