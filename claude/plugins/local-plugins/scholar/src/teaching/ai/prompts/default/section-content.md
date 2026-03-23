---
prompt_version: "2.0"
prompt_type: "section-content"
prompt_description: "Generate content for a single lecture section"
author: "Scholar"
last_updated: "2026-01-28"
variables:
  required:
    - section_id
    - section_type
    - section_title
    - section_level
    - topic
    - estimated_pages
    - language
  optional:
    - previous_context
    - learning_objectives
    - course_level
    - field
    - tone
    - pedagogical_approach
    - explanation_style
    - proof_style
    - notation_fixed_effects
    - notation_random_effects
---

Generate content for section "{{section_title}}" (ID: {{section_id}}) of a lecture on "{{topic}}".

Section Type: {{section_type}}
Target Length: ~{{estimated_pages}} pages (approximately {{estimated_pages}}00 words)
Section Level: {{section_level}} (heading depth)

{{#if previous_context}}
Previous sections covered:
{{previous_context}}

Build on this context appropriately.
{{else}}
This is the first section of the lecture.
{{/if}}

{{#if learning_objectives}}
Learning Objectives for this lecture:
{{learning_objectives}}
{{/if}}

{{#if tone}}
Teaching Style:
  - Tone: {{tone}}{{#if tone == "formal"}} - Use formal academic language appropriate for a textbook. Avoid colloquialisms.{{/if}}{{#if tone == "conversational"}} - Use a conversational but professional tone. Include rhetorical questions to engage readers.{{/if}}{{#if tone == "engaging"}} - Use an engaging, dynamic tone. Include "you" statements and encourage active reading.{{/if}}
{{/if}}
{{#if pedagogical_approach}}
  - Approach: {{pedagogical_approach}}{{#if pedagogical_approach == "lecture-based"}} - Present information in a linear, expository manner. Focus on clarity and completeness.{{/if}}{{#if pedagogical_approach == "active-learning"}} - Include "Stop and Think" prompts. Pose questions before revealing answers.{{/if}}{{#if pedagogical_approach == "problem-based"}} - Start with motivating problems. Derive theory from the need to solve them.{{/if}}{{#if pedagogical_approach == "flipped"}} - Assume students have some prior exposure. Focus on deepening understanding and application.{{/if}}
{{/if}}
{{#if explanation_style}}
  - Explanation: {{explanation_style}}{{#if explanation_style == "rigorous"}} - Prioritize mathematical rigor. Include formal definitions and proofs.{{/if}}{{#if explanation_style == "intuitive"}} - Focus on intuition and visual explanations. Use analogies liberally.{{/if}}{{#if explanation_style == "rigorous-with-intuition"}} - Balance rigor with intuition. State theorems formally, then explain why they make sense.{{/if}}
{{/if}}

{{#if course_level}}
Academic Level:
{{#if course_level == "undergraduate"}}
- Undergraduate Level:
  * Assume familiarity with calculus and basic probability
  * Explain terminology when first introduced
  * Use more concrete examples and less abstraction
  * Proofs should be accessible (can omit very technical details)
  * Focus on computation and interpretation over theory
{{/if}}
{{#if course_level == "graduate"}}
- Graduate Level:
  * Assume strong mathematical background (real analysis, linear algebra, probability theory)
  * Use precise mathematical notation throughout
  * Include rigorous proofs with all details
  * Discuss connections to research literature
  * Include more advanced applications and edge cases
{{/if}}
{{#if course_level == "both"}}
- Cross-Listed Course (both levels):
  * Write main content accessible to undergraduates
  * Include clearly marked "Graduate Level" callout blocks for:
    - Rigorous proofs
    - Advanced theoretical extensions
    - Research connections
  * Use Quarto callout syntax: ::: {.callout-note title="Graduate Level"}
{{/if}}
{{/if}}

{{#if notation_fixed_effects}}
Notation Standards:
- Fixed effects: {{notation_fixed_effects}}
{{#if notation_random_effects}}
- Random effects: {{notation_random_effects}}
{{/if}}
{{/if}}

{{#if section_type == "introduction"}}
Introduction Section Requirements:
- Open with motivation: Why is this topic important?
- Provide historical context or real-world applications
- Preview what will be covered in this lecture
- Connect to previous material if applicable
- End with learning objectives or key questions to be answered
- NO code or complex math in introduction
{{/if}}

{{#if section_type == "concept"}}
Concept Section Requirements:
- Explain the core idea clearly and thoroughly
- Include mathematical formulation where appropriate
- Use multiple representations (verbal, mathematical, graphical descriptions)
- Provide intuition before or after formal definitions
- Include at least one concrete example to illustrate
- Use callouts for important insights or common misconceptions
{{/if}}

{{#if section_type == "definition"}}
Definition Section Requirements:
- State the formal definition clearly using mathematical notation
- Explain each component of the definition
- Provide the intuition behind the definition
- Give simple examples that satisfy (and don't satisfy) the definition
- Connect to related definitions if relevant
- Keep prose focused and precise
{{/if}}

{{#if section_type == "theorem"}}
Theorem Section Requirements:
- State the theorem formally with all conditions
- Explain what the theorem says in plain language
- Discuss why this result is important or useful
- Mention key applications
- If appropriate, give intuition for why the theorem is true
- Reference related theorems or lemmas
{{/if}}

{{#if section_type == "proof"}}
Proof Section Requirements:
- Present the proof in clear, logical steps
- Explain the strategy before diving into details
- Use align environments for multi-step derivations
- Highlight key steps or techniques used
- Include commentary on non-obvious steps
- End with "QED" or equivalent conclusion
{{/if}}

{{#if section_type == "example"}}
Worked Example Section Requirements:
- Present a realistic problem with clear context
- Show the complete solution step-by-step
- Include {{language}} code that solves the problem
- Interpret results in context of the problem
- Discuss what the results mean practically
- Code should be executable and well-commented
{{/if}}

{{#if section_type == "code"}}
Code Section Requirements:
- Write complete, executable {{language}} code
- Include comprehensive comments explaining each step
- Follow {{language}} best practices and style guidelines
- Show expected output inline or describe it
- Use realistic data or provide sample data generation
- Include error handling or note assumptions
{{#if language == "r"}}
- Use tidyverse style where appropriate
{{/if}}
{{#if language == "python"}}
- Use PEP 8 style
{{/if}}
{{/if}}

{{#if section_type == "practice"}}
Practice Problems Section Requirements:
- Include 3-5 problems of varying difficulty (easy, medium, hard)
- Each problem should have:
  * Clear problem statement
  * Complete solution
  * Hint (optional)
  * Difficulty rating
- Problems should reinforce key concepts from the lecture
- Include at least one computational problem requiring {{language}}
{{/if}}

{{#if section_type == "discussion"}}
Discussion Section Requirements:
- Pose open-ended questions for reflection
- Connect the material to broader themes
- Suggest extensions or related topics
- Identify limitations or assumptions
- Encourage critical thinking
- May include prompts for class discussion
{{/if}}

{{#if section_type == "summary"}}
Summary Section Requirements:
- Provide 4-6 key takeaways as bullet points
- Briefly recap the main concepts covered
- Connect back to learning objectives
- Preview what comes next (if applicable)
- Include suggestions for further reading
- Keep it concise - this is a reference, not explanation
{{/if}}

Format your response as JSON matching this structure:
{
  "id": "{{section_id}}",
  "type": "{{section_type}}",
  "title": "{{section_title}}",
  "level": {{section_level}},
  "estimated_pages": {{estimated_pages}},
  "content": "Main prose content with clear explanations. Use \\( inline math \\) and \\[ display math \\] for LaTeX.",
  {{#if section_type == "theorem"}}
  "math": "Primary equation or theorem in LaTeX (without delimiters)",
  {{/if}}
  {{#if section_type == "definition"}}
  "math": "Primary equation or theorem in LaTeX (without delimiters)",
  {{/if}}
  {{#if section_type == "example"}}
  "code": {
    "language": "{{language}}",
    "source": "Executable {{language}} code",
    "echo": true,
    "eval": true
  },
  {{/if}}
  {{#if section_type == "code"}}
  "code": {
    "language": "{{language}}",
    "source": "Executable {{language}} code",
    "echo": true,
    "eval": true
  },
  {{/if}}
  {{#if section_type == "practice"}}
  "problems": [{"id": "P1", "text": "Problem", "solution": "Solution", "difficulty": "medium"}],
  {{/if}}
  {{#if section_type == "summary"}}
  "bullets": ["Key point 1", "Key point 2"],
  {{/if}}
  {{#if section_type == "discussion"}}
  "bullets": ["Key point 1", "Key point 2"],
  {{/if}}
  "summary": "Brief 1-2 sentence summary for continuity context"
}

IMPORTANT:
- LaTeX: Use double backslashes (\\frac, \\alpha, etc.) for JSON escaping
- Content should be comprehensive, not placeholder text
- Code must be syntactically valid {{language}} that would execute
{{#if course_level}}
- Write at {{course_level}} level with appropriate rigor and vocabulary
{{/if}}
- Do NOT include subsections in this response (they will be generated separately)
