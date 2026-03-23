/**
 * Lecture Notes AI Prompt Templates
 *
 * Provides prompt builders for section-by-section lecture generation:
 * - Outline generation (first API call)
 * - Section content generation (one call per section)
 * - Teaching style integration
 *
 * Design principles:
 * - Continuity: Pass previous section summaries for coherent narrative
 * - Teaching style: Integrate 4-layer style into all prompts
 * - Structure: Request JSON output matching lecture-notes.json schema
 * - Length guidance: Target page counts per section type
 */

import { SECTION_TYPES } from '../generators/lecture-notes.js';

/**
 * Build prompt for generating lecture outline
 * @param {Object} options - Lecture options
 * @param {string} options.topic - Lecture topic
 * @param {string} options.level - Course level (undergraduate/graduate/both)
 * @param {string} options.language - Programming language (r/python)
 * @param {string} options.field - Academic field (e.g., statistics)
 * @param {string} options.courseCode - Course code (e.g., STAT 440)
 * @param {string} options.courseName - Course name
 * @param {Object} teachingStyle - Teaching style configuration
 * @param {Object|null} lessonPlan - Lesson plan if using --from-plan
 * @returns {string} Formatted prompt for outline generation
 */
export function buildOutlinePrompt(options, teachingStyle, lessonPlan = null) {
  const {
    topic,
    level = 'undergraduate',
    language = 'r',
    field = 'statistics',
    courseCode = '',
    courseName = ''
  } = options;

  // Build objectives section from lesson plan or generate
  const objectivesSection = lessonPlan?.learning_objectives?.length > 0
    ? `Use these learning objectives from the lesson plan:
${lessonPlan.learning_objectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}`
    : `Generate 4-6 learning objectives using Bloom's taxonomy action verbs (understand, apply, analyze, evaluate, create).`;

  // Teaching style guidance
  const styleGuidance = buildStyleGuidance(teachingStyle);

  // Course context
  const courseContext = courseCode
    ? `Course: ${courseCode} - ${courseName}\nLevel: ${level}`
    : `Level: ${level}`;

  return `
Generate a detailed outline for lecture notes on "${topic}" for a ${field} course.

${courseContext}

${objectivesSection}

Teaching Style Requirements:
${styleGuidance}

Outline Requirements:
- Generate 8-12 top-level sections covering the topic comprehensively
- Target total length: 20-30 pages
- Include a mix of section types:
  * introduction (1 section at start)
  * concept (2-4 sections for core theory)
  * definition (1-2 sections for key terms)
  * example (2-3 sections with worked problems)
  * code (1-2 sections with ${language.toUpperCase()} implementation)
  * practice (1 section with 3-5 problems)
  * summary (1 section at end)
- Subsections (level 2) for complex topics

Section IDs should follow pattern: S1, S2, S2.1, S2.2, S3, etc.

Programming language for code sections: ${language}

Format your response as JSON:
{
  "title": "Full lecture title",
  "topic": "${topic}",
  "learning_objectives": [
    "Objective 1 using Bloom's verb",
    "Objective 2 using Bloom's verb",
    "..."
  ],
  "sections": [
    {
      "id": "S1",
      "type": "introduction",
      "title": "Introduction to ${topic}",
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
- Include at least 3 references to standard textbooks in ${field}
- Keep section titles specific to the topic, not generic
`.trim();
}

/**
 * Build prompt for generating a single section's content
 * @param {Object} sectionOutline - Section from outline
 * @param {Object} options - Lecture options
 * @param {Object} teachingStyle - Teaching style configuration
 * @param {string} previousContext - Summary of previous sections
 * @param {Array} learningObjectives - Learning objectives for context
 * @returns {string} Formatted prompt for section generation
 */
export function buildSectionPrompt(sectionOutline, options, teachingStyle, previousContext, learningObjectives = []) {
  const {
    topic,
    level = 'undergraduate',
    language = 'r'
  } = options;

  const { id, type, title, estimated_pages } = sectionOutline;

  // Get section type characteristics
  const typeInfo = SECTION_TYPES[type] || { hasCode: false, hasMath: false };

  // Teaching style guidance
  const styleGuidance = buildStyleGuidance(teachingStyle);

  // Build type-specific instructions
  const typeInstructions = buildTypeInstructions(type, language, estimated_pages);

  // Context from previous sections
  const contextSection = previousContext
    ? `Previous sections covered:\n${previousContext}\n\nBuild on this context appropriately.`
    : 'This is the first section of the lecture.';

  // Level-specific guidance
  const levelGuidance = buildLevelGuidance(level);

  return `
Generate content for section "${title}" (ID: ${id}) of a lecture on "${topic}".

Section Type: ${type}
Target Length: ~${estimated_pages} pages (${estimated_pages * 400} words approximately)
Section Level: ${sectionOutline.level} (heading depth)

${contextSection}

Learning Objectives for this lecture:
${learningObjectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}

Teaching Style:
${styleGuidance}

Academic Level:
${levelGuidance}

${typeInstructions}

Format your response as JSON matching this structure:
{
  "id": "${id}",
  "type": "${type}",
  "title": "${title}",
  "level": ${sectionOutline.level},
  "estimated_pages": ${estimated_pages},
  "content": "Main prose content with clear explanations. Use \\\\( inline math \\\\) and \\\\[ display math \\\\] for LaTeX.",
  ${typeInfo.hasMath ? '"math": "Primary equation or theorem in LaTeX (without delimiters)",' : ''}
  ${typeInfo.hasCode ? `"code": {
    "language": "${language}",
    "source": "Executable ${language.toUpperCase()} code",
    "echo": true,
    "eval": true
  },` : ''}
  ${type === 'practice' ? '"problems": [{"id": "P1", "text": "Problem", "solution": "Solution", "difficulty": "medium"}],' : ''}
  ${type === 'summary' || type === 'discussion' ? '"bullets": ["Key point 1", "Key point 2"],' : ''}
  "summary": "Brief 1-2 sentence summary for continuity context"
}

IMPORTANT:
- LaTeX: Use double backslashes (\\\\frac, \\\\alpha, etc.) for JSON escaping
- Content should be comprehensive, not placeholder text
- Code must be syntactically valid ${language.toUpperCase()} that would execute
- Write at ${level} level with appropriate rigor and vocabulary
- Do NOT include subsections in this response (they will be generated separately)
`.trim();
}

/**
 * Build teaching style guidance section for prompts
 * @param {Object} style - Teaching style configuration
 * @returns {string} Formatted style guidance
 */
export function buildStyleGuidance(style) {
  const {
    tone = 'formal',
    pedagogical_approach = 'active-learning',
    explanation_style = 'rigorous-with-intuition'
  } = style;

  const toneGuide = {
    formal: 'Use formal academic language appropriate for a textbook. Avoid colloquialisms.',
    conversational: 'Use a conversational but professional tone. Include rhetorical questions to engage readers.',
    engaging: 'Use an engaging, dynamic tone. Include "you" statements and encourage active reading.'
  };

  const approachGuide = {
    'lecture-based': 'Present information in a linear, expository manner. Focus on clarity and completeness.',
    'active-learning': 'Include "Stop and Think" prompts. Pose questions before revealing answers.',
    'problem-based': 'Start with motivating problems. Derive theory from the need to solve them.',
    'flipped': 'Assume students have some prior exposure. Focus on deepening understanding and application.'
  };

  const explanationGuide = {
    rigorous: 'Prioritize mathematical rigor. Include formal definitions and proofs.',
    intuitive: 'Focus on intuition and visual explanations. Use analogies liberally.',
    'rigorous-with-intuition': 'Balance rigor with intuition. State theorems formally, then explain why they make sense.'
  };

  return `
  - Tone: ${tone} - ${toneGuide[tone] || toneGuide.formal}
  - Approach: ${pedagogical_approach} - ${approachGuide[pedagogical_approach] || approachGuide['active-learning']}
  - Explanation: ${explanation_style} - ${explanationGuide[explanation_style] || explanationGuide['rigorous-with-intuition']}
`.trim();
}

/**
 * Build type-specific instructions for section generation
 * @param {string} type - Section type
 * @param {string} language - Programming language
 * @param {number} pages - Estimated page count
 * @returns {string} Type-specific instructions
 */
function buildTypeInstructions(type, language, pages) {
  const instructions = {
    introduction: `
Introduction Section Requirements:
- Open with motivation: Why is this topic important?
- Provide historical context or real-world applications
- Preview what will be covered in this lecture
- Connect to previous material if applicable
- End with learning objectives or key questions to be answered
- NO code or complex math in introduction`,

    concept: `
Concept Section Requirements:
- Explain the core idea clearly and thoroughly
- Include mathematical formulation where appropriate
- Use multiple representations (verbal, mathematical, graphical descriptions)
- Provide intuition before or after formal definitions
- Include at least one concrete example to illustrate
- Use callouts for important insights or common misconceptions`,

    definition: `
Definition Section Requirements:
- State the formal definition clearly using mathematical notation
- Explain each component of the definition
- Provide the intuition behind the definition
- Give simple examples that satisfy (and don't satisfy) the definition
- Connect to related definitions if relevant
- Keep prose focused and precise`,

    theorem: `
Theorem Section Requirements:
- State the theorem formally with all conditions
- Explain what the theorem says in plain language
- Discuss why this result is important or useful
- Mention key applications
- If appropriate, give intuition for why the theorem is true
- Reference related theorems or lemmas`,

    proof: `
Proof Section Requirements:
- Present the proof in clear, logical steps
- Explain the strategy before diving into details
- Use align environments for multi-step derivations
- Highlight key steps or techniques used
- Include commentary on non-obvious steps
- End with "QED" or equivalent conclusion`,

    example: `
Worked Example Section Requirements:
- Present a realistic problem with clear context
- Show the complete solution step-by-step
- Include ${language.toUpperCase()} code that solves the problem
- Interpret results in context of the problem
- Discuss what the results mean practically
- Code should be executable and well-commented`,

    code: `
Code Section Requirements:
- Write complete, executable ${language.toUpperCase()} code
- Include comprehensive comments explaining each step
- Follow ${language.toUpperCase()} best practices and style guidelines
- Show expected output inline or describe it
- Use realistic data or provide sample data generation
- Include error handling or note assumptions
${language === 'r' ? '- Use tidyverse style where appropriate' : '- Use PEP 8 style'}`,

    practice: `
Practice Problems Section Requirements:
- Include 3-5 problems of varying difficulty (easy, medium, hard)
- Each problem should have:
  * Clear problem statement
  * Complete solution
  * Hint (optional)
  * Difficulty rating
- Problems should reinforce key concepts from the lecture
- Include at least one computational problem requiring ${language.toUpperCase()}`,

    discussion: `
Discussion Section Requirements:
- Pose open-ended questions for reflection
- Connect the material to broader themes
- Suggest extensions or related topics
- Identify limitations or assumptions
- Encourage critical thinking
- May include prompts for class discussion`,

    summary: `
Summary Section Requirements:
- Provide 4-6 key takeaways as bullet points
- Briefly recap the main concepts covered
- Connect back to learning objectives
- Preview what comes next (if applicable)
- Include suggestions for further reading
- Keep it concise - this is a reference, not explanation`
  };

  return instructions[type] || `
General Section Requirements:
- Write ${pages} pages of clear, well-organized content
- Include relevant mathematical notation where appropriate
- Ensure content is self-contained but connects to overall lecture`;
}

/**
 * Build level-specific guidance
 * @param {string} level - Course level
 * @returns {string} Level-specific guidance
 */
function buildLevelGuidance(level) {
  const guidance = {
    undergraduate: `
- Undergraduate Level:
  * Assume familiarity with calculus and basic probability
  * Explain terminology when first introduced
  * Use more concrete examples and less abstraction
  * Proofs should be accessible (can omit very technical details)
  * Focus on computation and interpretation over theory`,

    graduate: `
- Graduate Level:
  * Assume strong mathematical background (real analysis, linear algebra, probability theory)
  * Use precise mathematical notation throughout
  * Include rigorous proofs with all details
  * Discuss connections to research literature
  * Include more advanced applications and edge cases`,

    both: `
- Cross-Listed Course (both levels):
  * Write main content accessible to undergraduates
  * Include clearly marked "Graduate Level" callout blocks for:
    - Rigorous proofs
    - Advanced theoretical extensions
    - Research connections
  * Use Quarto callout syntax: ::: {.callout-note title="Graduate Level"}`
  };

  return guidance[level] || guidance.undergraduate;
}

/**
 * Build prompt for regenerating a failed section
 * @param {Object} sectionOutline - Section outline
 * @param {Object} options - Lecture options
 * @param {string} previousAttempt - Previous failed content (for context)
 * @param {string} errorMessage - What went wrong
 * @returns {string} Retry prompt
 */
export function buildRetryPrompt(sectionOutline, options, previousAttempt, errorMessage) {
  return `
The previous attempt to generate section "${sectionOutline.title}" failed with error:
${errorMessage}

${previousAttempt ? `Previous attempt (for reference, do not repeat the error):\n${previousAttempt.substring(0, 500)}...\n` : ''}

Please regenerate this section, ensuring:
1. Valid JSON format with proper escaping
2. All required fields are present
3. LaTeX uses double backslashes (\\\\frac not \\frac)
4. Code is syntactically valid ${options.language.toUpperCase()}

Generate valid JSON for section "${sectionOutline.title}" (type: ${sectionOutline.type}).
`.trim();
}

/**
 * Extract summary from generated section for continuity context
 * @param {Object} section - Generated section
 * @returns {string} Brief summary for next section's context
 */
export function extractSectionSummary(section) {
  // Use explicit summary if provided
  if (section.summary) {
    return section.summary;
  }

  // Fall back to bullets or content excerpt
  if (section.bullets && section.bullets.length > 0) {
    return section.bullets.slice(0, 2).join('; ');
  }

  if (section.content) {
    // Extract first sentence
    const firstSentence = section.content.match(/^[^.!?]+[.!?]/);
    if (firstSentence) {
      return firstSentence[0].substring(0, 150);
    }
    return section.content.substring(0, 100) + '...';
  }

  return section.title;
}

export {
  buildStyleGuidance as buildTeachingStylePrompt,
  buildTypeInstructions as getSectionTypePrompt,
  buildLevelGuidance as getLevelPrompt
};
