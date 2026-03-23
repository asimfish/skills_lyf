/**
 * Lecture Refiner
 *
 * Regenerates specific sections of an existing .qmd lecture without
 * redoing the full document. Supports:
 * - Section-level refinement: replace one section with AI-regenerated content
 * - Full-lecture refinement: apply instruction globally while preserving structure
 *
 * Used by: /teaching:lecture --revise=<file> [--section=<title>] --instruction=<text>
 * (--refine is a silent alias for --revise)
 */

import { writeFileSync } from 'fs';
import { AIProvider } from '../ai/provider.js';
import { loadTeachConfig } from '../config/loader.js';
import {
  parseQmdFile,
  matchSection,
  flattenSections,
  replaceSection,
  listSections,
  appendRefinementRecord
} from '../utils/qmd-parser.js';

/**
 * Refine options
 * @typedef {Object} RefineOptions
 * @property {string} refine - Path to existing .qmd file
 * @property {string} [section] - Section title to refine (fuzzy matched)
 * @property {string} instruction - Refinement instruction
 * @property {boolean} [force] - Skip overwrite confirmation
 * @property {boolean} [debug] - Debug logging
 */

/**
 * Refine an existing lecture .qmd file
 * @param {RefineOptions} options - Refinement options
 * @returns {Promise<Object>} Refinement result
 */
export async function refineLecture(options) {
  const startTime = Date.now();

  if (!options.refine) {
    throw new Error('--revise requires a path to an existing .qmd file');
  }
  if (!options.instruction) {
    throw new Error('--revise requires --instruction to describe the changes');
  }

  // 1. Parse the existing document
  const parsed = parseQmdFile(options.refine);

  if (parsed.sections.length === 0) {
    throw new Error(`No sections found in ${options.refine}. The file must have ## headings.`);
  }

  // 2. Determine refinement mode
  const isFullRefine = !options.section;
  let result;

  if (isFullRefine) {
    result = await refineFullLecture(parsed, options);
  } else {
    result = await refineSingleSection(parsed, options);
  }

  // 3. Update provenance metadata
  const sectionLabel = isFullRefine ? 'full' : options.section;
  const updatedFrontmatter = appendRefinementRecord(
    parsed.frontmatter,
    sectionLabel,
    new Date().toISOString()
  );

  // Reconstruct document with updated frontmatter
  let updatedContent = result.content;
  if (updatedFrontmatter !== parsed.frontmatter) {
    // Reconstruct using parsed boundary lines (not string search)
    // This avoids false matches on '---' elsewhere in the content
    const contentLines = updatedContent.split('\n');
    const bodyLines = contentLines.slice(parsed.frontmatterEndLine);
    updatedContent = '---\n' + updatedFrontmatter + '\n---\n' + bodyLines.join('\n');
  }

  // 4. Write back
  writeFileSync(options.refine, updatedContent, 'utf-8');

  const elapsed = Date.now() - startTime;
  return {
    file: options.refine,
    mode: isFullRefine ? 'full' : 'section',
    section: options.section || null,
    instruction: options.instruction,
    elapsed: Math.round(elapsed / 1000),
    content: updatedContent
  };
}

/**
 * Refine a single section of the lecture
 * @param {Object} parsed - Parsed QMD document
 * @param {Object} options - Refine options
 * @returns {Promise<{ content: string }>}
 */
async function refineSingleSection(parsed, options) {
  // Match section by title
  const matched = matchSection(parsed.sections, options.section);

  if (!matched) {
    const available = listSections(parsed.sections);
    throw new Error(
      `Section "${options.section}" not found.\n\nAvailable sections:\n${available}`
    );
  }

  if (options.debug) {
    console.log(`[Refiner] Matched section: "${matched.title}" (slug: ${matched.slug})`);
  }

  // Build context from surrounding sections
  const allSections = flattenSections(parsed.sections);
  const matchedIdx = allSections.findIndex(s => s.startLine === matched.startLine);
  const prevSection = matchedIdx > 0 ? allSections[matchedIdx - 1] : null;
  const nextSection = matchedIdx < allSections.length - 1 ? allSections[matchedIdx + 1] : null;

  // Build refinement prompt
  const prompt = buildSectionRefinePrompt(matched, options.instruction, prevSection, nextSection);

  // Generate replacement
  const ai = createAIProvider(options);
  if (!ai) {
    // Fallback: return original content with a note
    const fallbackContent = matched.content + '\n\n<!-- Refinement instruction: ' + options.instruction + ' -->';
    return {
      content: replaceSection(parsed.lines, matched, fallbackContent)
    };
  }

  const result = await ai.generate(prompt, {
    format: 'text',
    temperature: 0.7
  });

  if (!result.success) {
    throw new Error(`AI refinement failed: ${result.error}`);
  }

  // The AI returns the full section content (including heading)
  let newContent = result.content;

  // Ensure the heading is preserved
  const headingLine = parsed.lines[matched.startLine];
  if (!newContent.startsWith('#')) {
    newContent = headingLine + '\n\n' + newContent;
  }

  return {
    content: replaceSection(parsed.lines, matched, newContent)
  };
}

/**
 * Refine the entire lecture (apply instruction globally)
 * @param {Object} parsed - Parsed QMD document
 * @param {Object} options - Refine options
 * @returns {Promise<{ content: string }>}
 */
async function refineFullLecture(parsed, options) {
  const prompt = buildFullRefinePrompt(parsed, options.instruction);

  const ai = createAIProvider(options);
  if (!ai) {
    // Fallback: return original with comment
    return {
      content: parsed.raw + '\n\n<!-- Full refinement instruction: ' + options.instruction + ' -->'
    };
  }

  const result = await ai.generate(prompt, {
    format: 'text',
    temperature: 0.7,
    maxTokens: 16384 // Full lecture needs more tokens
  });

  if (!result.success) {
    throw new Error(`AI full refinement failed: ${result.error}`);
  }

  // Preserve original frontmatter, replace body
  const frontmatterBlock = '---\n' + parsed.frontmatter + '\n---';
  return {
    content: frontmatterBlock + '\n\n' + result.content
  };
}

/**
 * Build prompt for section-level refinement
 * @param {Object} section - Matched section
 * @param {string} instruction - User instruction
 * @param {Object|null} prevSection - Previous section for context
 * @param {Object|null} nextSection - Next section for context
 * @returns {string} Refinement prompt
 */
function buildSectionRefinePrompt(section, instruction, prevSection, nextSection) {
  let prompt = `You are refining a section of instructor lecture notes in Quarto format (.qmd).

## Current Section
Title: ${section.title}
Level: ${'#'.repeat(section.level)} heading

Current content:
${section.content}

## Refinement Instruction
${instruction}

`;

  if (prevSection) {
    prompt += `## Context: Previous Section
Title: ${prevSection.title}
Summary: ${prevSection.body.substring(0, 300)}...

`;
  }

  if (nextSection) {
    prompt += `## Context: Next Section
Title: ${nextSection.title}

`;
  }

  prompt += `## Output Requirements
- Return ONLY the refined section content
- Start with the ${'#'.repeat(section.level)} heading: ${section.title}
- Preserve the Quarto heading ID if present (e.g., {#sec-name})
- Keep the same markdown/Quarto formatting style
- Maintain any code blocks, math equations, or callout blocks
- Apply the refinement instruction while preserving overall structure
- Do NOT include any frontmatter or other sections`;

  return prompt;
}

/**
 * Build prompt for full-lecture refinement
 * @param {Object} parsed - Parsed QMD document
 * @param {string} instruction - User instruction
 * @returns {string} Refinement prompt
 */
function buildFullRefinePrompt(parsed, instruction) {
  // Extract body (everything after frontmatter)
  const body = parsed.lines.slice(parsed.frontmatterEndLine).join('\n');

  return `You are refining instructor lecture notes in Quarto format (.qmd).

## Current Lecture Content
${body}

## Refinement Instruction
${instruction}

## Output Requirements
- Return the ENTIRE lecture body (everything after the YAML frontmatter)
- Do NOT include the YAML frontmatter (--- block)
- Preserve the existing section structure and headings
- Apply the refinement instruction globally across all sections
- Keep all code blocks, math equations, callout blocks, and practice problems
- Maintain the same Quarto formatting style
- This is a global refinement — the instruction applies to every section`;
}

/**
 * Create AI provider if API key is available
 * @param {Object} options - Options with debug flag
 * @returns {AIProvider|null}
 */
function createAIProvider(options) {
  try {
    const config = loadTeachConfig(process.cwd());
    const apiKey = config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    return new AIProvider({
      apiKey,
      model: config.scholar?.ai_generation?.model || 'claude-sonnet-4-20250514',
      maxTokens: config.scholar?.ai_generation?.max_tokens || 8192,
      timeout: config.scholar?.ai_generation?.timeout || 60000,
      debug: options.debug || false
    });
  } catch {
    return null;
  }
}

// Exports for testing
export {
  refineSingleSection,
  refineFullLecture,
  buildSectionRefinePrompt,
  buildFullRefinePrompt,
  createAIProvider
};
