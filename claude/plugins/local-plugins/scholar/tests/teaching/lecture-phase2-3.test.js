/**
 * Tests for Phase 2 (F3: --refine) and Phase 3 (F4-F6)
 *
 * F3: Section-level refinement
 * F4: Previous week context
 * F5: Coverage validation
 * F6: Auto-preview (--open)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// QMD Parser
import {
  parseQmdContent,
  matchSection,
  flattenSections,
  replaceSection,
  listSections,
  extractProvenance,
  appendRefinementRecord
} from '../../src/teaching/utils/qmd-parser.js';

// Coverage validator
import {
  extractKeywords,
  findMatchingSections
} from '../../src/teaching/validators/lecture-coverage.js';

// Previous week context
import {
  loadPreviousWeekContext,
  formatPreviousWeekContext,
  parseWeekId
} from '../../src/teaching/utils/lesson-plan-loader.js';

// Preview launcher
import { isQuartoAvailable } from '../../src/teaching/utils/preview-launcher.js';

// Refiner prompts
import {
  buildSectionRefinePrompt,
  buildFullRefinePrompt
} from '../../src/teaching/generators/lecture-refiner.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

// ─────────────────────────────────────────────────────────────
// Sample QMD for testing
// ─────────────────────────────────────────────────────────────

const SAMPLE_QMD = `---
title: "Randomized Complete Block Design"
# --- Scholar Generation Metadata ---
# generated: 2026-02-03T14:30:00.000Z
# scholar_version: 2.5.0
# prompt_template: lecture-notes.md (v2.4)
# config_source: .flow/teach-config.yml
# generation_time: 45s
# sections: 4
# ---
format:
  html:
    toc: true
---

::: {.callout-tip title="Learning Objectives"}
1. Understand RCBD design
2. Implement in R
:::

## Introduction to RCBD {#sec-intro}

Randomized Complete Block Design is a fundamental
experimental design in statistics.

## Core Concepts {#sec-concepts}

### Block Effects

Block effects control for known sources of variability.

### Treatment Effects

Treatment effects are the primary interest in the experiment.

## Worked Examples {#sec-examples}

Here we work through a complete RCBD analysis.

\`\`\`{r}
# RCBD analysis in R
model <- aov(yield ~ treatment + block, data = rcbd_data)
summary(model)
\`\`\`

## Key Takeaways {#sec-summary}

- RCBD controls for known variability
- Blocks should be homogeneous within
- F-test for treatment significance
`;

// ═════════════════════════════════════════════════════════════
// F3: QMD Parser Tests
// ═════════════════════════════════════════════════════════════

describe('F3: QMD Parser', () => {
  describe('parseQmdContent()', () => {
    it('should extract frontmatter', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      expect(parsed.frontmatter).toContain('title: "Randomized Complete Block Design"');
      expect(parsed.frontmatter).toContain('format:');
    });

    it('should identify frontmatter end line', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      expect(parsed.frontmatterEndLine).toBeGreaterThan(0);
    });

    it('should extract top-level sections', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      expect(parsed.sections.length).toBe(4);
      expect(parsed.sections.map(s => s.title)).toEqual([
        'Introduction to RCBD',
        'Core Concepts',
        'Worked Examples',
        'Key Takeaways'
      ]);
    });

    it('should extract subsections under Core Concepts', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      const coreConcepts = parsed.sections.find(s => s.title === 'Core Concepts');
      expect(coreConcepts.subsections.length).toBe(2);
      expect(coreConcepts.subsections[0].title).toBe('Block Effects');
      expect(coreConcepts.subsections[1].title).toBe('Treatment Effects');
    });

    it('should set correct heading levels', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      expect(parsed.sections[0].level).toBe(2); // ##
      const sub = parsed.sections[1].subsections[0];
      expect(sub.level).toBe(3); // ###
    });

    it('should capture heading IDs', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      expect(parsed.sections[0].headingId).toBe('sec-intro');
      expect(parsed.sections[2].headingId).toBe('sec-examples');
    });

    it('should slugify section titles', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      expect(parsed.sections[0].slug).toBe('introduction-to-rcbd');
      expect(parsed.sections[2].slug).toBe('worked-examples');
    });

    it('should include section body content', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      const intro = parsed.sections[0];
      expect(intro.body).toContain('Randomized Complete Block Design');
      expect(intro.body).toContain('experimental design');
    });

    it('should handle line ranges correctly', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      // Each section should have startLine < endLine
      for (const section of parsed.sections) {
        expect(section.endLine).toBeGreaterThan(section.startLine);
      }
    });

    it('should extract preamble between frontmatter and first section', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      expect(parsed.preamble).toContain('Learning Objectives');
    });

    it('should handle document without frontmatter', () => {
      const noFm = '## Section One\n\nContent here.\n\n## Section Two\n\nMore content.';
      const parsed = parseQmdContent(noFm);
      expect(parsed.frontmatter).toBe('');
      expect(parsed.sections.length).toBe(2);
    });
  });

  describe('matchSection()', () => {
    let sections;

    beforeEach(() => {
      sections = parseQmdContent(SAMPLE_QMD).sections;
    });

    it('should match exact title', () => {
      const match = matchSection(sections, 'Worked Examples');
      expect(match).not.toBeNull();
      expect(match.title).toBe('Worked Examples');
    });

    it('should match via slug (case insensitive)', () => {
      const match = matchSection(sections, 'worked examples');
      expect(match).not.toBeNull();
      expect(match.title).toBe('Worked Examples');
    });

    it('should fuzzy match partial slug', () => {
      const match = matchSection(sections, 'Examples');
      expect(match).not.toBeNull();
      expect(match.title).toBe('Worked Examples');
    });

    it('should match subsections', () => {
      const match = matchSection(sections, 'Block Effects');
      expect(match).not.toBeNull();
      expect(match.title).toBe('Block Effects');
    });

    it('should return null for no match', () => {
      const match = matchSection(sections, 'Nonexistent Section');
      expect(match).toBeNull();
    });
  });

  describe('flattenSections()', () => {
    it('should flatten nested sections', () => {
      const sections = parseQmdContent(SAMPLE_QMD).sections;
      const flat = flattenSections(sections);
      // 4 top-level + 2 subsections = 6
      expect(flat.length).toBe(6);
    });
  });

  describe('replaceSection()', () => {
    it('should replace a section content', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      const section = parsed.sections[0]; // Introduction
      const newContent = '## Introduction to RCBD {#sec-intro}\n\nNew introduction content.';
      const result = replaceSection(parsed.lines, section, newContent);
      expect(result).toContain('New introduction content.');
      expect(result).toContain('Core Concepts'); // Other sections preserved
    });
  });

  describe('listSections()', () => {
    it('should format section list with indentation', () => {
      const sections = parseQmdContent(SAMPLE_QMD).sections;
      const list = listSections(sections);
      expect(list).toContain('- Introduction to RCBD');
      expect(list).toContain('- Core Concepts');
      expect(list).toContain('  - Block Effects'); // Indented subsection
    });
  });
});

// ═════════════════════════════════════════════════════════════
// F3: Provenance Metadata Parsing
// ═════════════════════════════════════════════════════════════

describe('F3: Provenance metadata', () => {
  describe('extractProvenance()', () => {
    it('should extract provenance from frontmatter', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      const prov = extractProvenance(parsed.frontmatter);
      expect(prov).not.toBeNull();
      expect(prov.generated).toBe('2026-02-03T14:30:00.000Z');
      expect(prov.scholar_version).toBe('2.5.0');
      expect(prov.sections).toBe('4');
    });

    it('should return null for frontmatter without provenance', () => {
      const prov = extractProvenance('title: "Test"\nformat:\n  html: {}');
      expect(prov).toBeNull();
    });
  });

  describe('appendRefinementRecord()', () => {
    it('should append a refinement record before closing marker', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      const updated = appendRefinementRecord(
        parsed.frontmatter,
        'Worked Examples',
        '2026-02-05T10:00:00.000Z'
      );
      expect(updated).toContain('# refined: "Worked Examples" on 2026-02-05');
      // Refinement record should appear before the closing # --- marker
      const refinedIdx = updated.indexOf('# refined:');
      const closingIdx = updated.indexOf('# ---', refinedIdx);
      expect(closingIdx).toBeGreaterThan(refinedIdx);
    });

    it('should use "full lecture" label for full refinement', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      const updated = appendRefinementRecord(
        parsed.frontmatter,
        'full',
        '2026-02-05T10:00:00.000Z'
      );
      expect(updated).toContain('# refined: full lecture on 2026-02-05');
    });

    it('should return unchanged if no metadata block exists', () => {
      const plainFm = 'title: "Test"\nformat:\n  html: {}';
      const updated = appendRefinementRecord(plainFm, 'Test', '2026-01-01');
      expect(updated).toBe(plainFm);
    });
  });
});

// ═════════════════════════════════════════════════════════════
// F3: Refiner Prompt Builder Tests
// ═════════════════════════════════════════════════════════════

describe('F3: Refiner prompt builders', () => {
  describe('buildSectionRefinePrompt()', () => {
    it('should include section content and instruction', () => {
      const section = {
        title: 'Worked Examples',
        level: 2,
        content: '## Worked Examples\n\nHere is an example.',
        body: 'Here is an example.'
      };
      const prompt = buildSectionRefinePrompt(section, 'Add two more examples', null, null);
      expect(prompt).toContain('Worked Examples');
      expect(prompt).toContain('Add two more examples');
      expect(prompt).toContain('Here is an example');
    });

    it('should include previous section context when available', () => {
      const section = { title: 'Examples', level: 2, content: '## Examples\n\nContent.', body: 'Content.' };
      const prev = { title: 'Core Concepts', body: 'Core concept content goes here.' };
      const prompt = buildSectionRefinePrompt(section, 'Expand', prev, null);
      expect(prompt).toContain('Previous Section');
      expect(prompt).toContain('Core Concepts');
    });

    it('should include next section context when available', () => {
      const section = { title: 'Examples', level: 2, content: '## Examples\n\nContent.', body: 'Content.' };
      const next = { title: 'Summary', body: 'Summary content.' };
      const prompt = buildSectionRefinePrompt(section, 'Expand', null, next);
      expect(prompt).toContain('Next Section');
      expect(prompt).toContain('Summary');
    });
  });

  describe('buildFullRefinePrompt()', () => {
    it('should include full body and instruction', () => {
      const parsed = parseQmdContent(SAMPLE_QMD);
      const prompt = buildFullRefinePrompt(parsed, 'Use tidyverse syntax');
      expect(prompt).toContain('Use tidyverse syntax');
      expect(prompt).toContain('Introduction to RCBD');
      expect(prompt).toContain('Worked Examples');
    });
  });
});

// ═════════════════════════════════════════════════════════════
// F4: Previous Week Context Tests
// ═════════════════════════════════════════════════════════════

describe('F4: Previous week context', () => {
  describe('parseWeekId()', () => {
    it('should parse "week08" to 8', () => {
      expect(parseWeekId('week08')).toBe(8);
    });

    it('should parse bare number "5"', () => {
      expect(parseWeekId('5')).toBe(5);
    });

    it('should return null for invalid input', () => {
      expect(parseWeekId(null)).toBeNull();
      expect(parseWeekId('')).toBeNull();
    });

    it('should parse numeric type', () => {
      expect(parseWeekId(3)).toBe(3);
    });
  });

  describe('loadPreviousWeekContext()', () => {
    it('should return empty for week 1 (no previous weeks)', () => {
      const result = loadPreviousWeekContext({
        weekId: 1,
        courseRoot: '/nonexistent',
        count: 3
      });
      expect(result).toEqual([]);
    });

    it('should return empty for null weekId', () => {
      const result = loadPreviousWeekContext({
        weekId: null,
        courseRoot: '/nonexistent'
      });
      expect(result).toEqual([]);
    });

    it('should return empty when no lesson plans directory exists', () => {
      const result = loadPreviousWeekContext({
        weekId: 5,
        courseRoot: '/tmp/nonexistent-course-root',
        count: 3
      });
      expect(result).toEqual([]);
    });
  });

  describe('formatPreviousWeekContext()', () => {
    it('should format context array into prompt text', () => {
      const contexts = [
        { week: 5, topic: 'Simple Regression', objectives: ['Fit models', 'Interpret'], keyConcepts: ['slope', 'intercept'] },
        { week: 6, topic: 'Multiple Regression', objectives: ['Multiple predictors'], keyConcepts: ['R-squared', 'VIF'] }
      ];
      const result = formatPreviousWeekContext(contexts);
      expect(result).toContain('Previous Weeks Context');
      expect(result).toContain('Week 5: Simple Regression');
      expect(result).toContain('Week 6: Multiple Regression');
      expect(result).toContain('slope, intercept');
    });

    it('should return empty string for empty contexts', () => {
      expect(formatPreviousWeekContext([])).toBe('');
      expect(formatPreviousWeekContext(null)).toBe('');
    });
  });
});

// ═════════════════════════════════════════════════════════════
// F5: Coverage Validator Tests
// ═════════════════════════════════════════════════════════════

describe('F5: Coverage validator', () => {
  describe('extractKeywords()', () => {
    it('should extract content words and filter stop words', () => {
      const keywords = extractKeywords('Understand the fundamental concepts of regression analysis');
      expect(keywords).toContain('fundamental');
      expect(keywords).toContain('concepts');
      expect(keywords).toContain('regression');
      expect(keywords).toContain('analysis');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('of');
    });

    it('should filter Bloom taxonomy verbs', () => {
      const keywords = extractKeywords('Analyze and evaluate the regression model');
      expect(keywords).not.toContain('analyze');
      expect(keywords).not.toContain('evaluate');
      expect(keywords).toContain('regression');
      expect(keywords).toContain('model');
    });

    it('should handle empty input', () => {
      expect(extractKeywords('')).toEqual([]);
      expect(extractKeywords(null)).toEqual([]);
    });

    it('should lowercase and strip punctuation', () => {
      const keywords = extractKeywords('ANOVA (One-Way) Analysis!');
      expect(keywords).toContain('anova');
      expect(keywords).toContain('way');
    });
  });

  describe('findMatchingSections()', () => {
    const sectionContents = [
      { title: 'Introduction', slug: 'introduction', searchText: 'introduction to regression analysis and linear models' },
      { title: 'ANOVA Table', slug: 'anova-table', searchText: 'anova table interpretation f-test significance treatment effects' },
      { title: 'R Code', slug: 'r-code', searchText: 'r implementation code aov function summary model' }
    ];

    it('should find matching section by keywords', () => {
      const matches = findMatchingSections(['regression', 'linear', 'models'], sectionContents);
      expect(matches).toContain('Introduction');
    });

    it('should require at least half the keywords to match', () => {
      // Only 1 of 4 keywords matches — should NOT match
      const matches = findMatchingSections(['regression', 'bayesian', 'posterior', 'prior'], sectionContents);
      expect(matches).not.toContain('Introduction');
    });

    it('should return empty for no keywords', () => {
      expect(findMatchingSections([], sectionContents)).toEqual([]);
    });
  });
});

// ═════════════════════════════════════════════════════════════
// F6: Preview Launcher Tests
// ═════════════════════════════════════════════════════════════

describe('F6: Preview launcher', () => {
  it('should export isQuartoAvailable function', () => {
    expect(typeof isQuartoAvailable).toBe('function');
    // The result depends on the environment
    const result = isQuartoAvailable();
    expect(typeof result).toBe('boolean');
  });
});

// ═════════════════════════════════════════════════════════════
// Integration: End-to-end section replacement
// ═════════════════════════════════════════════════════════════

describe('Integration: Section replacement workflow', () => {
  it('should parse, match, replace, and preserve document structure', () => {
    // 1. Parse
    const parsed = parseQmdContent(SAMPLE_QMD);

    // 2. Match
    const matched = matchSection(parsed.sections, 'Worked Examples');
    expect(matched).not.toBeNull();

    // 3. Replace
    const newContent = '## Worked Examples {#sec-examples}\n\nReplacement content with new examples.\n\n```{r}\n# New code\nsummary(new_model)\n```';
    const updated = replaceSection(parsed.lines, matched, newContent);

    // 4. Verify structure preserved
    expect(updated).toContain('title: "Randomized Complete Block Design"'); // Frontmatter
    expect(updated).toContain('Introduction to RCBD'); // Section 1 preserved
    expect(updated).toContain('Core Concepts'); // Section 2 preserved
    expect(updated).toContain('Replacement content with new examples'); // Section 3 replaced
    expect(updated).toContain('Key Takeaways'); // Section 4 preserved

    // 5. Verify old content removed
    expect(updated).not.toContain('Here we work through a complete RCBD analysis');
  });

  it('should handle refinement metadata update', () => {
    const parsed = parseQmdContent(SAMPLE_QMD);

    // Append refinement record
    const updatedFm = appendRefinementRecord(
      parsed.frontmatter,
      'Worked Examples',
      '2026-02-10T08:00:00Z'
    );

    expect(updatedFm).toContain('# refined: "Worked Examples" on 2026-02-10');
    // Original metadata still present
    expect(updatedFm).toContain('# scholar_version: 2.5.0');
  });
});
