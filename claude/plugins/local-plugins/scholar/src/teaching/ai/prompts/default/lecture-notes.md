---
prompt_version: "2.0"
prompt_type: "lecture-notes"
prompt_description: "Comprehensive instructor-facing lecture notes in Quarto format"
target_template: "content/lecture.qmd"
author: "Scholar"
last_updated: "2026-01-28"
variables:
  required:
    - topic
    - course_level
    - field
  optional:
    - course_code
    - course_name
    - pages
    - language
    - tone
    - pedagogical_approach
    - explanation_style
    - proof_style
    - notation_fixed_effects
    - notation_random_effects
    - has_lesson_plan
    - learning_objectives
    - week
---

# Comprehensive Lecture Notes: {{topic}}

Generate comprehensive, instructor-facing lecture notes on "{{topic}}" for a {{course_level}} {{field}} course.

## Course Context

{{#if course_code}}
Course: {{course_code}} - {{course_name}}
{{/if}}
Level: {{course_level}}
Field: {{field}}
{{#if week}}
Week: {{week}}
{{/if}}

## Learning Objectives

{{#if has_lesson_plan}}
Use these learning objectives from the lesson plan:
{{learning_objectives}}
{{else}}
Generate 4-6 learning objectives using Bloom's taxonomy action verbs (understand, apply, analyze, evaluate, create) that cover:
- Conceptual understanding of {{topic}}
- Practical application and computation
- Interpretation of results
- Connections to broader {{field}} concepts
{{/if}}

## Teaching Style Requirements

{{#if tone}}
### Tone and Style
{{#if tone == "formal"}}
Use formal academic language appropriate for a textbook. Avoid colloquialisms. Write in third person with precise mathematical terminology.
{{/if}}
{{#if tone == "conversational"}}
Use a conversational but professional tone. Include rhetorical questions to engage readers. Address the instructor in second person when appropriate.
{{/if}}
{{#if tone == "engaging"}}
Use an engaging, dynamic tone. Include "you" statements and encourage active reading. Make the material accessible while maintaining rigor.
{{/if}}
{{#if tone == "balanced"}}
Use a balanced tone that is professional but approachable. Combine formal definitions with intuitive explanations. Vary between third and second person as appropriate.
{{/if}}
{{/if}}

{{#if pedagogical_approach}}
### Pedagogical Approach
{{#if pedagogical_approach == "lecture-based"}}
Present information in a linear, expository manner. Focus on clarity and completeness. Structure content for sequential presentation.
{{/if}}
{{#if pedagogical_approach == "active-learning"}}
Include "Stop and Think" prompts throughout. Pose questions before revealing answers. Suggest opportunities for student engagement and discussion.
{{/if}}
{{#if pedagogical_approach == "problem-based"}}
Start with motivating problems before introducing theory. Derive theoretical concepts from the need to solve practical problems. Use realistic examples throughout.
{{/if}}
{{#if pedagogical_approach == "flipped"}}
Assume students have some prior exposure from readings or videos. Focus on deepening understanding and application rather than initial exposure. Include more advanced examples and extensions.
{{/if}}
{{/if}}

{{#if explanation_style}}
### Explanation Style
{{#if explanation_style == "rigorous"}}
Prioritize mathematical rigor throughout. Include formal definitions with all conditions stated precisely. Provide complete proofs with all steps justified.
{{/if}}
{{#if explanation_style == "intuitive"}}
Focus on intuition and visual explanations. Use analogies and examples liberally. Mathematical formalism should support understanding, not replace it.
{{/if}}
{{#if explanation_style == "rigorous-with-intuition"}}
Balance rigor with intuition. State theorems formally with precise conditions, then explain why they make sense and what they mean practically. Provide both formal and intuitive explanations.
{{/if}}
{{/if}}

{{#if notation_fixed_effects}}
## Notation Standards

Maintain consistent notation throughout:
- Fixed effects: {{notation_fixed_effects}}
{{#if notation_random_effects}}
- Random effects: {{notation_random_effects}}
{{/if}}
{{#if notation_nesting}}
- Nesting structures: {{notation_nesting}}
{{/if}}

Use LaTeX notation consistently. Define all symbols on first use.
{{/if}}

## Content Requirements

### Structure
- Target length: {{#if pages}}{{pages}}{{else}}20-30{{/if}} pages
- Include 8-12 major sections covering {{topic}} comprehensively
- Use a mix of section types:
  * Introduction (motivation and context)
  * Concepts (theoretical foundations)
  * Definitions (precise mathematical statements)
  * Theorems (key results with statements and discussion)
  * Proofs (when appropriate for {{course_level}} level)
  * Examples (worked problems with complete solutions)
  * Code ({{#if language}}{{language}}{{else}}R{{/if}} implementation)
  * Practice problems (3-5 problems with solutions)
  * Summary (key takeaways and connections)

### Mathematical Content
- Use LaTeX for all mathematical notation
- For inline math: \\( expression \\)
- For display math: \\[ expression \\]
- Use align environments for multi-step derivations
- Define all notation clearly
- Include references to standard textbooks in {{field}}

### Code Requirements
{{#if language}}
- Write executable {{language}} code
- Follow {{language}} best practices
{{#if language == "r"}}
- Use tidyverse style where appropriate
- Include library() calls for required packages
- Use meaningful variable names
- Add comments explaining key steps
{{/if}}
{{#if language == "python"}}
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Include import statements
- Add docstrings for functions
{{/if}}
{{else}}
- Write executable R code following tidyverse style
- Include library() calls for required packages
- Use meaningful variable names
- Add comments explaining key steps
{{/if}}

### Examples and Applications
- Use realistic data and scenarios relevant to {{field}}
- Show complete worked solutions with interpretation
- Include computational examples using {{#if language}}{{language}}{{else}}R{{/if}}
- Interpret results in context of the problem
- Discuss practical implications

{{#if course_level == "undergraduate"}}
### Undergraduate Level Guidelines
- Assume familiarity with calculus and basic probability
- Explain technical terminology when first introduced
- Use more concrete examples and less abstraction
- Proofs should be accessible (can sketch technical details)
- Focus on computation and interpretation over theoretical depth
- Include more step-by-step worked examples
{{/if}}

{{#if course_level == "graduate"}}
### Graduate Level Guidelines
- Assume strong mathematical background (real analysis, linear algebra, probability theory)
- Use precise mathematical notation throughout
- Include rigorous proofs with all technical details
- Discuss connections to research literature
- Include more advanced applications and edge cases
- Reference current research and open problems
{{/if}}

{{#if course_level == "both"}}
### Cross-Listed Course Guidelines
- Write main content accessible to undergraduates
- Include clearly marked "Graduate Level" callout blocks for:
  * Rigorous proofs with technical details
  * Advanced theoretical extensions
  * Connections to research literature
- Use Quarto callout syntax for graduate content:
  ::: {.callout-note title="Graduate Level"}
  Advanced content here
  :::
{{/if}}

### Instructor Notes
Include pedagogical guidance:
- Common student misconceptions
- Challenging concepts that need extra emphasis
- Suggested board examples or demonstrations
- Discussion questions for class engagement
- Connections to previous/future topics

## Output Format

Generate content in Quarto markdown format (.qmd) with:
- YAML frontmatter (title, author, date, format options)
- Proper heading hierarchy (# for main sections, ## for subsections)
- LaTeX math using \\( \\) for inline and \\[ \\] for display
- R/Python code chunks with {r} or {python} syntax
- Quarto callouts for notes, warnings, important points
- References in appropriate citation format

## Quality Standards

- Content must be comprehensive and pedagogically sound
- All code must be executable and correct
- Mathematical notation must be consistent
- Examples must be realistic and well-explained
- Coverage should be complete for {{topic}} at {{course_level}} level
- Include 3-5 standard textbook references in {{field}}

{{#if proof_style}}
### Proof Guidelines
{{#if proof_style == "sketch-only"}}
Provide proof sketches highlighting key ideas. Omit technical details that don't aid understanding.
{{/if}}
{{#if proof_style == "complete-formal"}}
Present complete, rigorous proofs with all steps justified. Use formal mathematical language throughout.
{{/if}}
{{#if proof_style == "rigorous-with-intuition"}}
Present rigorous proofs but include intuitive commentary. Explain the strategy before diving into details. Highlight key insights.
{{/if}}
{{/if}}
