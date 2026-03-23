/**
 * Slide Refiner
 *
 * Revises specific slides or sections of an existing .qmd slide deck
 * without redoing the full document. Supports:
 * - Section-level targeting: revise slides under a section heading
 * - Range targeting: revise slides N through M by number
 * - Type targeting: revise all slides of a given type (quiz, practice, etc.)
 * - Full-deck revision: apply instruction globally
 * - Combined targeting: section + type, etc.
 * - Auto-analysis: bare --revise without --instruction runs 7-dimension heuristic analysis
 *
 * Used by: /teaching:slides --revise=<file> [--section=<title>] [--slides=N-M] [--type=TYPE] [--instruction=<text>]
 */

import { writeFileSync, existsSync } from 'fs';
import { AIProvider } from '../ai/provider.js';
import { loadTeachConfig } from '../config/loader.js';
import {
  parseSlidesFromFile,
  filterByType,
  filterByRange,
  filterBySection
} from '../utils/slide-parser.js';
import {
  appendRefinementRecord
} from '../utils/qmd-parser.js';

/**
 * Revise options
 * @typedef {Object} ReviseOptions
 * @property {string} revise - Path to existing .qmd slide deck
 * @property {string} [instruction] - Revision instruction
 * @property {string} [section] - Target section title (fuzzy matched)
 * @property {string} [slides] - Target slide range "N-M" or "N"
 * @property {string} [type] - Target slide type
 * @property {boolean} [dryRun] - Preview without applying
 * @property {boolean} [debug] - Debug logging
 */

/**
 * Revise an existing slide deck .qmd file
 * @param {ReviseOptions} options - Revision options
 * @returns {Promise<Object>} Revision result
 */
export async function reviseSlides(options) {
  const startTime = Date.now();

  if (!options.revise) {
    throw new Error('--revise requires a path to an existing .qmd slide deck');
  }

  if (!existsSync(options.revise)) {
    throw new Error(`File not found: ${options.revise}`);
  }

  const isAutoMode = !options.instruction;

  // 1. Parse the slide deck
  const { slides, parsed } = parseSlidesFromFile(options.revise);

  if (slides.length === 0) {
    throw new Error(`No slides found in ${options.revise}. The file must have ## headings.`);
  }

  // 2. Resolve target slides
  const targetSlides = resolveTargets(slides, options);

  if (options.debug) {
    console.log(`[SlideRefiner] Targeting ${targetSlides.length} of ${slides.length} slides`);
    console.log(`[SlideRefiner] Targets: ${targetSlides.map(s => `#${s.number} "${s.title}"`).join(', ')}`);
    if (isAutoMode) {
      console.log(`[SlideRefiner] Auto-analysis mode (no --instruction)`);
    }
  }

  // 3. Auto-analysis mode: run 7-dimension heuristics
  if (isAutoMode) {
    let config;
    try {
      config = loadTeachConfig(process.cwd());
    } catch {
      config = null;
    }

    const analysisResult = autoAnalyze(targetSlides, config);

    // Dry-run in auto mode: return analysis report, no AI call
    if (options.dryRun) {
      const elapsed = Date.now() - startTime;
      return {
        file: options.revise,
        mode: 'auto-analysis',
        slidesAffected: targetSlides.length,
        targetSlides: targetSlides.map(s => ({ number: s.number, title: s.title, type: s.type })),
        strategy: 'full',
        analysis: analysisResult,
        elapsed: Math.round(elapsed / 1000),
        dryRun: true
      };
    }

    // Build auto-revision prompt from analysis
    const autoInstruction = buildAutoRevisePrompt(targetSlides, analysisResult, config);

    // If analysis found no issues, return early
    if (!autoInstruction) {
      const elapsed = Date.now() - startTime;
      return {
        file: options.revise,
        mode: 'auto-analysis',
        slidesAffected: 0,
        analysis: analysisResult,
        elapsed: Math.round(elapsed / 1000),
        content: parsed.raw,
        message: 'All dimensions passed — no revisions needed.'
      };
    }

    // Use auto-generated instruction for AI revision
    options = { ...options, instruction: autoInstruction };

    // Build context for AI call
    const { context: contextSlides, strategy } = buildContext(slides, targetSlides);
    const isFullRevision = isFullDeck(slides, targetSlides);
    let revisedContent;
    const ai = createAIProvider(options);

    if (isFullRevision) {
      revisedContent = await reviseFullDeck(parsed, slides, options, ai);
    } else {
      revisedContent = await reviseTargetedSlides(parsed, slides, targetSlides, contextSlides, strategy, options, ai);
    }

    // Update provenance metadata with auto-analysis label
    const updatedFrontmatter = appendRefinementRecord(
      parsed.frontmatter,
      'auto-analysis',
      new Date().toISOString()
    );

    if (updatedFrontmatter !== parsed.frontmatter) {
      const contentLines = revisedContent.split('\n');
      const bodyLines = contentLines.slice(parsed.frontmatterEndLine);
      revisedContent = '---\n' + updatedFrontmatter + '\n---\n' + bodyLines.join('\n');
    }

    writeFileSync(options.revise, revisedContent, 'utf-8');

    const elapsed = Date.now() - startTime;
    return {
      file: options.revise,
      mode: 'auto-analysis',
      slidesAffected: targetSlides.length,
      analysis: analysisResult,
      instruction: autoInstruction,
      elapsed: Math.round(elapsed / 1000),
      content: revisedContent
    };
  }

  // 4. Build context (instruction mode)
  const { context: contextSlides, strategy } = buildContext(slides, targetSlides);

  if (options.debug) {
    console.log(`[SlideRefiner] Context strategy: ${strategy} (${contextSlides.length} slides in context)`);
  }

  // 5. Dry-run: return preview without writing
  if (options.dryRun) {
    const elapsed = Date.now() - startTime;
    return {
      file: options.revise,
      mode: isFullDeck(slides, targetSlides) ? 'full' : 'targeted',
      slidesAffected: targetSlides.length,
      targetSlides: targetSlides.map(s => ({ number: s.number, title: s.title, type: s.type })),
      strategy,
      instruction: options.instruction,
      elapsed: Math.round(elapsed / 1000),
      dryRun: true
    };
  }

  // 6. Build prompt and call AI
  const isFullRevision = isFullDeck(slides, targetSlides);
  let revisedContent;

  const ai = createAIProvider(options);

  if (isFullRevision) {
    revisedContent = await reviseFullDeck(parsed, slides, options, ai);
  } else {
    revisedContent = await reviseTargetedSlides(parsed, slides, targetSlides, contextSlides, strategy, options, ai);
  }

  // 7. Update provenance metadata
  const provenanceLabel = buildProvenanceLabel(options, targetSlides, isFullRevision);
  const updatedFrontmatter = appendRefinementRecord(
    parsed.frontmatter,
    provenanceLabel,
    new Date().toISOString()
  );

  // Reconstruct document with updated frontmatter
  if (updatedFrontmatter !== parsed.frontmatter) {
    const contentLines = revisedContent.split('\n');
    const bodyLines = contentLines.slice(parsed.frontmatterEndLine);
    revisedContent = '---\n' + updatedFrontmatter + '\n---\n' + bodyLines.join('\n');
  }

  // 8. Write back
  writeFileSync(options.revise, revisedContent, 'utf-8');

  const elapsed = Date.now() - startTime;
  return {
    file: options.revise,
    mode: isFullRevision ? 'full' : 'targeted',
    slidesAffected: targetSlides.length,
    instruction: options.instruction,
    elapsed: Math.round(elapsed / 1000),
    content: revisedContent
  };
}

/**
 * Resolve which slides to target based on options
 * @param {Array} slides - All slides in the deck
 * @param {Object} options - Revision options
 * @returns {Array} Target slides
 */
export function resolveTargets(slides, options) {
  const hasSection = Boolean(options.section);
  const hasRange = Boolean(options.slides);
  const hasType = Boolean(options.type);

  // No targeting = all slides
  if (!hasSection && !hasRange && !hasType) {
    return slides;
  }

  let result = slides;

  // Apply section filter
  if (hasSection) {
    result = filterBySection(result, options.section);
    if (result.length === 0) {
      const sectionTitles = [...new Set(slides.map(s => s.sectionTitle))];
      throw new Error(
        `No slides found in section "${options.section}".\n\nAvailable sections:\n` +
        sectionTitles.map(t => `  - ${t}`).join('\n')
      );
    }
  }

  // Apply range filter
  if (hasRange) {
    const range = parseSlideRange(options.slides);
    result = filterByRange(result, range.start, range.end);
    if (result.length === 0) {
      throw new Error(
        `No slides found in range "${options.slides}". Deck has ${slides.length} slides (1-${slides.length}).`
      );
    }
  }

  // Apply type filter
  if (hasType) {
    result = filterByType(result, options.type);
    if (result.length === 0) {
      const availableTypes = [...new Set(slides.map(s => s.type))].sort();
      throw new Error(
        `No slides of type "${options.type}" found` +
        (hasSection ? ` in section "${options.section}"` : '') +
        `.\n\nAvailable types: ${availableTypes.join(', ')}`
      );
    }
  }

  return result;
}

/**
 * Parse a slide range string into start/end numbers
 * @param {string} rangeStr - Range string (e.g., "5-12", "5", "5-")
 * @returns {{ start: number, end: number }}
 */
export function parseSlideRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') {
    throw new Error('Invalid slide range: must be a non-empty string (e.g., "5-12", "5", "5-")');
  }

  const trimmed = rangeStr.trim();

  // "N-" → open-ended range
  const openEndMatch = trimmed.match(/^(\d+)-$/);
  if (openEndMatch) {
    const start = parseInt(openEndMatch[1], 10);
    return { start, end: Infinity };
  }

  // "N-M" → closed range
  const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (start > end) {
      throw new Error(
        `Invalid slide range "${rangeStr}": start (${start}) must not be greater than end (${end})`
      );
    }
    return { start, end };
  }

  // "N" → single slide
  const singleMatch = trimmed.match(/^(\d+)$/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    return { start: num, end: num };
  }

  throw new Error(
    `Invalid slide range "${rangeStr}". Expected formats: "5-12", "5", or "5-"`
  );
}

/**
 * Build context for the revision (surrounding slides)
 * @param {Array} slides - All slides in the deck
 * @param {Array} targetSlides - Slides being revised
 * @returns {{ context: Array, strategy: string }}
 */
export function buildContext(slides, targetSlides) {
  // If fewer than 30 slides, include entire deck
  if (slides.length < 30) {
    return { context: slides, strategy: 'full' };
  }

  // For large decks, include targets + 1 neighbor each side
  const contextNumbers = new Set();

  for (const target of targetSlides) {
    contextNumbers.add(target.number);

    // Previous neighbor
    const prev = target.number - 1;
    if (prev >= 1) {
      contextNumbers.add(prev);
    }

    // Next neighbor
    const next = target.number + 1;
    if (next <= slides.length) {
      contextNumbers.add(next);
    }
  }

  const contextSlides = slides.filter(s => contextNumbers.has(s.number));
  return { context: contextSlides, strategy: 'targeted' };
}

/**
 * Build revision prompt for targeted slides
 * @param {Array} targetSlides - Slides to revise
 * @param {string} instruction - Revision instruction
 * @param {Array} contextSlides - Context slides (may overlap targets)
 * @param {string} strategy - Context strategy ('full' or 'targeted')
 * @returns {string} Revision prompt
 */
export function buildSlideRevisionPrompt(targetSlides, instruction, contextSlides, strategy) {
  let prompt = `You are revising slide content in a Quarto reveal.js deck (.qmd).

## Target Slides
`;

  for (const slide of targetSlides) {
    prompt += `\n### Slide ${slide.number}: ${slide.title} (type: ${slide.type})
${slide.content}

`;
  }

  prompt += `## Revision Instruction
${instruction}

`;

  // Include context if we are using targeted strategy
  if (strategy === 'targeted') {
    const nonTargetContext = contextSlides.filter(
      s => !targetSlides.some(t => t.number === s.number)
    );

    if (nonTargetContext.length > 0) {
      prompt += `## Context (surrounding slides for coherence)
`;
      for (const slide of nonTargetContext) {
        prompt += `\n### Slide ${slide.number}: ${slide.title}
${slide.body ? slide.body.substring(0, 300) : '(empty)'}

`;
      }
    }
  }

  prompt += `## Output Requirements
- Return ONLY the revised slide content for the targeted slides
- Preserve ## headings and slide numbers
- Keep Quarto formatting: code blocks, math, callouts, CSS classes
- Maintain speaker notes (if present)
- Do NOT include frontmatter or non-targeted slides`;

  return prompt;
}

/**
 * Build revision prompt for full deck
 * @param {Array} slides - All slides
 * @param {string} instruction - Revision instruction
 * @returns {string} Revision prompt
 */
export function buildFullDeckRevisionPrompt(slides, instruction) {
  let prompt = `You are revising slide content in a Quarto reveal.js deck (.qmd).

## Current Deck (${slides.length} slides)
`;

  for (const slide of slides) {
    prompt += `\n${slide.content}\n`;
  }

  prompt += `
## Revision Instruction
${instruction}

## Output Requirements
- Return the ENTIRE slide deck body (everything after the YAML frontmatter)
- Do NOT include the YAML frontmatter (--- block)
- Preserve the existing slide structure and ## headings
- Apply the revision instruction globally across all slides
- Keep all code blocks, math equations, callout blocks, and CSS classes
- Maintain speaker notes (if present)
- This is a global revision — the instruction applies to every slide`;

  return prompt;
}

/**
 * Revise the full deck (all slides targeted)
 * @param {Object} parsed - Parsed QMD document
 * @param {Array} slides - All slides
 * @param {Object} options - Revision options
 * @param {AIProvider|null} ai - AI provider (null for fallback)
 * @returns {Promise<string>} Updated document content
 */
async function reviseFullDeck(parsed, slides, options, ai) {
  const prompt = buildFullDeckRevisionPrompt(slides, options.instruction);

  if (!ai) {
    // Fallback: return original with comment
    return parsed.raw + '\n\n<!-- Full revision instruction: ' + options.instruction + ' -->';
  }

  const result = await ai.generate(prompt, {
    format: 'text',
    temperature: 0.7,
    maxTokens: 16384
  });

  if (!result.success) {
    throw new Error(`AI slide revision failed: ${result.error}`);
  }

  // Preserve original frontmatter, replace body
  const frontmatterBlock = '---\n' + parsed.frontmatter + '\n---';
  return frontmatterBlock + '\n\n' + result.content;
}

/**
 * Revise targeted slides only
 * @param {Object} parsed - Parsed QMD document
 * @param {Array} slides - All slides
 * @param {Array} targetSlides - Slides to revise
 * @param {Array} contextSlides - Context slides
 * @param {string} strategy - Context strategy
 * @param {Object} options - Revision options
 * @param {AIProvider|null} ai - AI provider (null for fallback)
 * @returns {Promise<string>} Updated document content
 */
async function reviseTargetedSlides(parsed, slides, targetSlides, contextSlides, strategy, options, ai) {
  const prompt = buildSlideRevisionPrompt(targetSlides, options.instruction, contextSlides, strategy);

  if (!ai) {
    // Fallback: append revision instruction comments to each target slide
    let lines = [...parsed.lines];

    // Work backwards to preserve line numbers
    const sortedTargets = [...targetSlides].sort((a, b) => b.startLine - a.startLine);

    for (const target of sortedTargets) {
      const commentLine = `\n<!-- Revision instruction: ${options.instruction} -->`;
      const targetEndLine = target.endLine;

      // Insert comment before the end of the target slide
      const before = lines.slice(0, targetEndLine);
      const after = lines.slice(targetEndLine);
      const commentLines = commentLine.split('\n');
      lines = [...before, ...commentLines, ...after];
    }

    return lines.join('\n');
  }

  const result = await ai.generate(prompt, {
    format: 'text',
    temperature: 0.7
  });

  if (!result.success) {
    throw new Error(`AI slide revision failed: ${result.error}`);
  }

  // Reconstruct document: replace target slide content with AI output
  // For now, use a simple approach: replace each target slide's lines
  let lines = [...parsed.lines];
  const revisedSlideContents = parseRevisedOutput(result.content, targetSlides);

  // Work backwards to preserve line numbers
  const sortedTargets = [...targetSlides].sort((a, b) => b.startLine - a.startLine);

  for (const target of sortedTargets) {
    const revised = revisedSlideContents.get(target.number);
    if (revised) {
      const newLines = revised.split('\n');
      lines = [
        ...lines.slice(0, target.startLine),
        ...newLines,
        ...lines.slice(target.endLine)
      ];
    }
  }

  return lines.join('\n');
}

/**
 * Parse AI-revised output back into individual slide contents
 * @param {string} output - AI output
 * @param {Array} targetSlides - Original target slides
 * @returns {Map<number, string>} Map of slide number to revised content
 */
function parseRevisedOutput(output, targetSlides) {
  const result = new Map();

  // Split by ## headings
  const slideBlocks = output.split(/(?=^## )/m).filter(b => b.trim());

  // Try to match each block to a target slide
  for (let i = 0; i < Math.min(slideBlocks.length, targetSlides.length); i++) {
    result.set(targetSlides[i].number, slideBlocks[i].trimEnd());
  }

  return result;
}

/**
 * Check if all slides are targeted (full deck revision)
 * @param {Array} slides - All slides
 * @param {Array} targetSlides - Target slides
 * @returns {boolean}
 */
function isFullDeck(slides, targetSlides) {
  return targetSlides.length === slides.length;
}

/**
 * Build provenance label for the refinement record
 * @param {Object} options - Revision options
 * @param {Array} targetSlides - Target slides
 * @param {boolean} isFullRevision - Whether targeting all slides
 * @returns {string}
 */
function buildProvenanceLabel(options, targetSlides, isFullRevision) {
  if (isFullRevision) return 'full';

  const parts = [];
  if (options.section) parts.push(`section "${options.section}"`);
  if (options.slides) parts.push(`slides ${options.slides}`);
  if (options.type) parts.push(`type=${options.type}`);

  return parts.join(', ') || 'targeted';
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

// ─────────────────────────────────────────────────────────────
// Auto-analysis: 7-dimension heuristic analysis
// ─────────────────────────────────────────────────────────────

/**
 * Analysis result for a single dimension
 * @typedef {Object} DimensionResult
 * @property {string} dimension - Dimension name
 * @property {string} status - 'ok' or 'warn'
 * @property {string[]} findings - Human-readable findings
 * @property {number[]} slideNumbers - Affected slide numbers
 */

/**
 * Perform 7-dimension heuristic analysis on slides WITHOUT AI.
 *
 * Dimensions:
 * 1. density — flag overcrowded (>20 lines) and sparse (<3 lines) slides
 * 2. practice-distribution — check practice/quiz slides are spread evenly
 * 3. style-compliance — check against teaching style config rules
 * 4. math-depth — flag math without surrounding explanation
 * 5. worked-examples — flag concepts without nearby examples
 * 6. content-completeness — flag slides with thin body content
 * 7. r-output-interpretation — flag code blocks with echo:true but no interpretation
 *
 * @param {Array} slides - Parsed slide objects
 * @param {Object|null} [config=null] - Teaching config from loadTeachConfig()
 * @returns {DimensionResult[]} Array of 7 dimension results
 */
export function autoAnalyze(slides, config = null) {
  return [
    analyzeDensity(slides),
    analyzePracticeDistribution(slides),
    analyzeStyleCompliance(slides, config),
    analyzeMathDepth(slides),
    analyzeWorkedExamples(slides),
    analyzeContentCompleteness(slides),
    analyzeROutputInterpretation(slides),
  ];
}

/**
 * Dimension 1: Slide density
 * Flag slides with >20 content lines as overcrowded and <3 as sparse.
 *
 * @param {Array} slides - Parsed slide objects
 * @returns {DimensionResult}
 */
function analyzeDensity(slides) {
  const findings = [];
  const slideNumbers = [];

  for (const slide of slides) {
    const bodyLines = (slide.body || '').split('\n').filter(l => l.trim().length > 0);
    const lineCount = bodyLines.length;

    if (lineCount > 20) {
      findings.push(`Slide ${slide.number} "${slide.title}" is overcrowded (${lineCount} content lines > 20). Consider splitting.`);
      slideNumbers.push(slide.number);
    } else if (lineCount < 3 && slide.type !== 'title') {
      findings.push(`Slide ${slide.number} "${slide.title}" is sparse (${lineCount} content lines < 3). Consider merging or expanding.`);
      slideNumbers.push(slide.number);
    }
  }

  return {
    dimension: 'density',
    status: findings.length > 0 ? 'warn' : 'ok',
    findings,
    slideNumbers,
  };
}

/**
 * Dimension 2: Practice distribution
 * Check that practice/quiz slides are spread across sections, not clustered.
 * Flag if >50% of practice slides are in one section.
 *
 * @param {Array} slides - Parsed slide objects
 * @returns {DimensionResult}
 */
function analyzePracticeDistribution(slides) {
  const findings = [];
  const slideNumbers = [];

  const practiceSlides = slides.filter(
    s => s.type === 'practice' || s.type === 'quiz'
  );

  if (practiceSlides.length < 2) {
    return { dimension: 'practice-distribution', status: 'ok', findings, slideNumbers };
  }

  // Count practice slides per section
  const sectionCounts = {};
  for (const s of practiceSlides) {
    const section = s.sectionTitle || '(no section)';
    sectionCounts[section] = (sectionCounts[section] || 0) + 1;
  }

  const totalPractice = practiceSlides.length;
  const sectionNames = Object.keys(sectionCounts);

  for (const section of sectionNames) {
    const count = sectionCounts[section];
    const ratio = count / totalPractice;

    if (ratio > 0.5 && sectionNames.length > 1) {
      findings.push(
        `${Math.round(ratio * 100)}% of practice/quiz slides (${count}/${totalPractice}) are in section "${section}". Distribute more evenly.`
      );
      // Collect the slide numbers in that section
      for (const s of practiceSlides) {
        if ((s.sectionTitle || '(no section)') === section) {
          slideNumbers.push(s.number);
        }
      }
    }
  }

  return {
    dimension: 'practice-distribution',
    status: findings.length > 0 ? 'warn' : 'ok',
    findings,
    slideNumbers,
  };
}

/**
 * Dimension 3: Style compliance
 * Check slides against teaching style config rules. E.g., if tone is "formal",
 * flag conversational language patterns.
 *
 * @param {Array} slides - Parsed slide objects
 * @param {Object|null} config - Teaching config
 * @returns {DimensionResult}
 */
function analyzeStyleCompliance(slides, config) {
  const findings = [];
  const slideNumbers = [];

  const tone = config?.scholar?.style?.tone || 'formal';

  // Conversational patterns to detect when formal tone is expected
  const conversationalPatterns = [
    /\blet's\b/i,
    /\byou'll\b/i,
    /\bwe'll\b/i,
    /\bdon't\b/i,
    /\bcan't\b/i,
    /\bwon't\b/i,
    /\bgonna\b/i,
    /\bwanna\b/i,
    /\bkinda\b/i,
    /\bsorta\b/i,
    /\bokay\b/i,
    /\bcool\b/i,
    /\bawesome\b/i,
  ];

  // Formal patterns to detect when conversational tone is expected
  const formalPatterns = [
    /\bhenceforth\b/i,
    /\btherein\b/i,
    /\bwhereupon\b/i,
    /\bnotwithstanding\b/i,
    /\baforementioned\b/i,
  ];

  for (const slide of slides) {
    const body = slide.body || '';

    if (tone === 'formal') {
      for (const pattern of conversationalPatterns) {
        if (pattern.test(body)) {
          const match = body.match(pattern);
          findings.push(
            `Slide ${slide.number} "${slide.title}" uses conversational language ("${match[0]}") but style.tone is "formal".`
          );
          if (!slideNumbers.includes(slide.number)) {
            slideNumbers.push(slide.number);
          }
          break; // one finding per slide for tone
        }
      }
    } else if (tone === 'conversational') {
      for (const pattern of formalPatterns) {
        if (pattern.test(body)) {
          const match = body.match(pattern);
          findings.push(
            `Slide ${slide.number} "${slide.title}" uses overly formal language ("${match[0]}") but style.tone is "conversational".`
          );
          if (!slideNumbers.includes(slide.number)) {
            slideNumbers.push(slide.number);
          }
          break;
        }
      }
    }
  }

  return {
    dimension: 'style-compliance',
    status: findings.length > 0 ? 'warn' : 'ok',
    findings,
    slideNumbers,
  };
}

/**
 * Dimension 4: Math depth
 * Flag slides with math expressions but without surrounding explanation
 * (less than 2 lines of non-math text).
 *
 * @param {Array} slides - Parsed slide objects
 * @returns {DimensionResult}
 */
function analyzeMathDepth(slides) {
  const findings = [];
  const slideNumbers = [];

  for (const slide of slides) {
    if (!slide.hasMath) continue;

    const body = slide.body || '';
    // Remove code blocks
    const withoutCode = body.replace(/```[\s\S]*?```/g, '');
    // Remove math expressions (both inline and display)
    const withoutMath = withoutCode.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$\n]+\$/g, '');
    // Count non-empty non-math text lines
    const textLines = withoutMath.split('\n').filter(l => l.trim().length > 0);

    if (textLines.length < 2) {
      findings.push(
        `Slide ${slide.number} "${slide.title}" has math expressions but insufficient explanation text (${textLines.length} non-math lines < 2).`
      );
      slideNumbers.push(slide.number);
    }
  }

  return {
    dimension: 'math-depth',
    status: findings.length > 0 ? 'warn' : 'ok',
    findings,
    slideNumbers,
  };
}

/**
 * Dimension 5: Worked examples
 * Flag content slides that introduce key concepts (definition/theorem types)
 * without having a corresponding example slide nearby (within 3 slides).
 *
 * @param {Array} slides - Parsed slide objects
 * @returns {DimensionResult}
 */
function analyzeWorkedExamples(slides) {
  const findings = [];
  const slideNumbers = [];

  const conceptTypes = ['definition', 'theorem'];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    if (!conceptTypes.includes(slide.type)) continue;

    // Look for example slide within 3 positions (before or after)
    let hasNearbyExample = false;
    for (let j = Math.max(0, i - 3); j <= Math.min(slides.length - 1, i + 3); j++) {
      if (j === i) continue;
      if (slides[j].type === 'example') {
        hasNearbyExample = true;
        break;
      }
    }

    if (!hasNearbyExample) {
      findings.push(
        `Slide ${slide.number} "${slide.title}" (type: ${slide.type}) has no example slide within 3 slides. Add a worked example nearby.`
      );
      slideNumbers.push(slide.number);
    }
  }

  return {
    dimension: 'worked-examples',
    status: findings.length > 0 ? 'warn' : 'ok',
    findings,
    slideNumbers,
  };
}

/**
 * Dimension 6: Content completeness
 * Flag slides where the body has fewer than 3 substantive lines
 * (excluding blank lines, heading line, and speaker notes).
 *
 * @param {Array} slides - Parsed slide objects
 * @returns {DimensionResult}
 */
function analyzeContentCompleteness(slides) {
  const findings = [];
  const slideNumbers = [];

  // Types exempt from completeness check
  const exemptTypes = ['title', 'questions', 'summary'];

  for (const slide of slides) {
    if (exemptTypes.includes(slide.type)) continue;

    const body = slide.body || '';

    // Remove speaker notes (:::notes ... :::)
    const withoutNotes = body.replace(/:{3,}\s*notes[\s\S]*?:{3,}/gi, '');
    // Count substantive lines (non-empty, not just a heading marker)
    const substantiveLines = withoutNotes
      .split('\n')
      .filter(l => {
        const trimmed = l.trim();
        return trimmed.length > 0 && !trimmed.startsWith('#');
      });

    if (substantiveLines.length < 3) {
      findings.push(
        `Slide ${slide.number} "${slide.title}" has thin content (${substantiveLines.length} substantive lines < 3).`
      );
      slideNumbers.push(slide.number);
    }
  }

  return {
    dimension: 'content-completeness',
    status: findings.length > 0 ? 'warn' : 'ok',
    findings,
    slideNumbers,
  };
}

/**
 * Dimension 7: R output interpretation
 * Flag slides with R/Python code blocks that have echo: true but no
 * interpretation text following the code block.
 *
 * @param {Array} slides - Parsed slide objects
 * @returns {DimensionResult}
 */
function analyzeROutputInterpretation(slides) {
  const findings = [];
  const slideNumbers = [];

  // Regex to find code blocks with echo: true
  const codeBlockRegex = /```\{(?:r|python)[^}]*\}[^\n]*\n((?:#\|[^\n]*\n)*)[\s\S]*?```/g;

  for (const slide of slides) {
    const body = slide.body || '';

    let match;
    codeBlockRegex.lastIndex = 0;

    while ((match = codeBlockRegex.exec(body)) !== null) {
      const headerLines = match[1] || '';
      if (!/echo:\s*true/i.test(headerLines)) continue;

      // Check for text after this code block
      const afterBlock = body.substring(match.index + match[0].length);
      const afterLines = afterBlock.split('\n').filter(l => l.trim().length > 0);

      // Filter out lines that are just another code block start
      const interpretationLines = afterLines.filter(
        l => !l.trim().startsWith('```') && !l.trim().startsWith('#|')
      );

      if (interpretationLines.length === 0) {
        findings.push(
          `Slide ${slide.number} "${slide.title}" has R/Python output (echo: true) but no interpretation text after the code block.`
        );
        if (!slideNumbers.includes(slide.number)) {
          slideNumbers.push(slide.number);
        }
      }
    }
  }

  return {
    dimension: 'r-output-interpretation',
    status: findings.length > 0 ? 'warn' : 'ok',
    findings,
    slideNumbers,
  };
}

/**
 * Build a revision prompt from auto-analysis findings.
 * Only includes dimensions with status='warn'.
 * Returns null when all dimensions pass (no revision needed).
 *
 * @param {Array} slides - Parsed slide objects
 * @param {DimensionResult[]} analysis - Results from autoAnalyze()
 * @param {Object|null} [config=null] - Teaching config
 * @returns {string|null} Revision prompt string, or null if no issues found
 */
export function buildAutoRevisePrompt(slides, analysis, config = null) {
  const warnDimensions = analysis.filter(d => d.status === 'warn');

  if (warnDimensions.length === 0) {
    return null;
  }

  const tone = config?.scholar?.style?.tone || 'formal';
  const notation = config?.scholar?.style?.notation || 'standard';

  let prompt = `Auto-analysis found issues in ${warnDimensions.length} dimension(s). Please revise the following:\n\n`;

  for (const dim of warnDimensions) {
    prompt += `### ${dim.dimension} (slides: ${dim.slideNumbers.join(', ')})\n`;
    for (const finding of dim.findings) {
      prompt += `- ${finding}\n`;
    }
    prompt += '\n';
  }

  prompt += `Style preferences: tone=${tone}, notation=${notation}.\n`;
  prompt += `Fix the flagged issues while preserving the overall deck structure and Quarto formatting.`;

  return prompt;
}

// Exports for testing
export {
  reviseFullDeck,
  reviseTargetedSlides,
  createAIProvider
};
