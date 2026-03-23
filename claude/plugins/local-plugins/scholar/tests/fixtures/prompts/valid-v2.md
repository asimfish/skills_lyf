---
prompt_version: "2.0"
prompt_type: "lecture-notes"
prompt_description: "Comprehensive instructor-facing lecture notes"
target_template: "content/lecture.qmd"
author: "Test Author"
last_updated: "2026-01-28"
variables:
  required:
    - topic
    - course_level
  optional:
    - language
    - tone
---

# Lecture Notes: {{topic}}

Generate comprehensive lecture notes on "{{topic}}" for a {{course_level}} course.

## Content Requirements

- Include 8-12 major sections
- Use LaTeX for mathematical notation
- Include worked examples
