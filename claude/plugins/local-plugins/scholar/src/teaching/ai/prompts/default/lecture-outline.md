---
prompt_version: "2.0"
prompt_type: "lecture-outline"
prompt_description: "Generate structured outline for lecture notes"
target_template: "content/lecture.qmd"
author: "Scholar"
last_updated: "2026-01-28"
variables:
  required:
    - topic
    - course_level
    - field
    - language
  optional:
    - course_code
    - course_name
    - learning_objectives
    - pedagogical_approach
    - tone
    - explanation_style
    - proof_style
---

Generate a detailed outline for lecture notes on "{{topic}}" for a {{field}} course.

{{#if course_code}}
Course: {{course_code}} - {{course_name}}
Level: {{course_level}}
{{else}}
Level: {{course_level}}
{{/if}}

{{#if has_lesson_plan}}
Use these learning objectives from the lesson plan:
{{learning_objectives}}
{{else}}
Generate 4-6 learning objectives using Bloom's taxonomy action verbs (understand, apply, analyze, evaluate, create).
{{/if}}

Teaching Style Requirements:
{{#if tone}}
  - Tone: {{tone}}{{#if tone == "formal"}} - Use formal academic language appropriate for a textbook. Avoid colloquialisms.{{/if}}{{#if tone == "conversational"}} - Use a conversational but professional tone. Include rhetorical questions to engage readers.{{/if}}{{#if tone == "engaging"}} - Use an engaging, dynamic tone. Include "you" statements and encourage active reading.{{/if}}
{{/if}}
{{#if pedagogical_approach}}
  - Approach: {{pedagogical_approach}}{{#if pedagogical_approach == "lecture-based"}} - Present information in a linear, expository manner. Focus on clarity and completeness.{{/if}}{{#if pedagogical_approach == "active-learning"}} - Include "Stop and Think" prompts. Pose questions before revealing answers.{{/if}}{{#if pedagogical_approach == "problem-based"}} - Start with motivating problems. Derive theory from the need to solve them.{{/if}}{{#if pedagogical_approach == "flipped"}} - Assume students have some prior exposure. Focus on deepening understanding and application.{{/if}}
{{/if}}
{{#if explanation_style}}
  - Explanation: {{explanation_style}}{{#if explanation_style == "rigorous"}} - Prioritize mathematical rigor. Include formal definitions and proofs.{{/if}}{{#if explanation_style == "intuitive"}} - Focus on intuition and visual explanations. Use analogies liberally.{{/if}}{{#if explanation_style == "rigorous-with-intuition"}} - Balance rigor with intuition. State theorems formally, then explain why they make sense.{{/if}}
{{/if}}

Outline Requirements:
- Generate 8-12 top-level sections covering the topic comprehensively
- Target total length: 20-30 pages
- Include a mix of section types:
  * introduction (1 section at start)
  * concept (2-4 sections for core theory)
  * definition (1-2 sections for key terms)
  * example (2-3 sections with worked problems)
  * code (1-2 sections with {{language}} implementation)
  * practice (1 section with 3-5 problems)
  * summary (1 section at end)
- Subsections (level 2) for complex topics

Section IDs should follow pattern: S1, S2, S2.1, S2.2, S3, etc.

Programming language for code sections: {{language}}

Format your response as JSON:
{
  "title": "Full lecture title",
  "topic": "{{topic}}",
  "learning_objectives": [
    "Objective 1 using Bloom's verb",
    "Objective 2 using Bloom's verb",
    "..."
  ],
  "sections": [
    {
      "id": "S1",
      "type": "introduction",
      "title": "Introduction to {{topic}}",
      "level": 1,
      "estimated_pages": 2
    },
    {
      "id": "S2",
      "type": "concept",
      "title": "Core Concepts",
      "level": 1,
      "estimated_pages": 4,
      "subsections": [
        {
          "id": "S2.1",
          "type": "definition",
          "title": "Key Definitions",
          "level": 2,
          "estimated_pages": 1
        }
      ]
    }
  ],
  "references": [
    "Author, A. (Year). Title. Publisher.",
    "Author, B. (Year). Title. Publisher."
  ],
  "estimated_total_pages": 25
}

IMPORTANT:
- Section types must be one of: introduction, concept, definition, theorem, proof, example, code, practice, discussion, summary
- Page estimates should sum to 20-30 total
- Include at least 3 references to standard textbooks in {{field}}
- Keep section titles specific to the topic, not generic
