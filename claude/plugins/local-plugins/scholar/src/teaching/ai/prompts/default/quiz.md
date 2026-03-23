---
prompt_version: "2.0"
prompt_type: quiz
prompt_description: "Quiz generation prompt for formative assessment"
min_scholar_version: "2.0.0"
required_variables:
  - topic
  - course_level
optional_variables:
  - num_questions
  - question_types
  - difficulty
  - time_limit
---

# Quiz Generator Prompt

Generate a quiz for formative assessment on the following topic.

## Topic
{{topic}}

## Course Level
{{course_level}}

{{#if num_questions}}
## Number of Questions
{{num_questions}}
{{/if}}

{{#if difficulty}}
## Difficulty Level
{{difficulty}}
{{/if}}

## Question Types
{{#if question_types}}
Include: {{question_types}}
{{/if}}
{{#if question_types == ""}}
Include a mix of:
- Multiple choice (4 options each)
- Short answer
- True/False with explanation
{{/if}}

## Requirements

1. Questions should assess understanding at appropriate depth for {{course_level}} students
2. Provide clear, unambiguous question stems
3. For multiple choice, include plausible distractors
4. Include answer key with brief explanations

{{#if time_limit}}
## Time Limit
Estimated completion time: {{time_limit}} minutes
{{/if}}

## Output Format

Return the quiz in markdown format with:
- Clear question numbering
- Answer key section at the end
- Point values for each question
