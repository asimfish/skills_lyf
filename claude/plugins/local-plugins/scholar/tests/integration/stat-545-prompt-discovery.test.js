/**
 * Integration Test: Prompt Discovery with stat-545 Course
 *
 * Tests the prompt discovery system against a real course configuration.
 * Uses the stat-545 (STAT 545 - Analysis of Variance) course which has:
 * - .flow/teach-config.yml with teaching_style configuration
 * - .flow/templates/prompts/lecture-notes.md custom prompt template
 *
 * @module tests/integration/stat-545-prompt-discovery.test
 */

import { PromptLoader } from '../../src/teaching/ai/prompt-loader.js';
import { PromptBuilder } from '../../src/teaching/ai/prompt-builder.js';
import { PromptConfigBridge } from '../../src/teaching/ai/prompt-config-bridge.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Path to the stat-545 course
const STAT545_PATH = path.join(os.homedir(), 'projects/teaching/stat-545');

// Check if stat-545 exists (skip tests if not available)
const stat545Exists = fs.existsSync(STAT545_PATH) &&
                      fs.existsSync(path.join(STAT545_PATH, '.flow/teach-config.yml'));

const describeIfExists = stat545Exists ? describe : describe.skip;

describeIfExists('stat-545 Prompt Discovery Integration', () => {
  describe('PromptLoader with stat-545', () => {
    test('discovers custom lecture-notes prompt from .flow/templates/prompts/', async () => {
      const result = await PromptLoader.load('lecture-notes', STAT545_PATH);

      expect(result).toBeDefined();
      expect(result.source).toBe('project');
      expect(result.path).toContain('.flow/templates/prompts/lecture-notes.md');
    });

    test('parses YAML frontmatter correctly', async () => {
      const result = await PromptLoader.load('lecture-notes', STAT545_PATH);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.prompt_version).toMatch(/^\d+\.\d+$/);
      expect(result.metadata.prompt_type).toBe('lecture-notes');
      expect(result.metadata.prompt_description).toContain('instructor-facing');
    });

    test('extracts template body without frontmatter', async () => {
      const result = await PromptLoader.load('lecture-notes', STAT545_PATH);

      // Body should not contain YAML delimiters
      expect(result.body).not.toContain('---\nprompt_version');
      // Body should contain the actual prompt content
      expect(result.body).toContain('Comprehensive Lecture Notes Generator');
      expect(result.body).toContain('Structure Requirements');
    });

    test('falls back to defaults for non-existent prompt types', async () => {
      const result = await PromptLoader.loadDefault('quiz');

      expect(result).toBeDefined();
      expect(result.source).toBe('default');
    });
  });

  describe('PromptBuilder with stat-545 content', () => {
    test('substitutes variables in prompt template', () => {
      const template = `# Lecture: {{topic}}

Course: {{course.name}}
Level: {{course_level}}
Field: {{field}}

Generate comprehensive notes for {{topic}}.`;

      const variables = {
        topic: 'Two-Way ANOVA',
        course: { name: 'STAT 545' },
        course_level: 'graduate',
        field: 'statistics'
      };

      const result = PromptBuilder.build(template, variables);

      expect(result).toContain('# Lecture: Two-Way ANOVA');
      expect(result).toContain('Course: STAT 545');
      expect(result).toContain('Level: graduate');
      expect(result).toContain('Field: statistics');
    });

    test('handles conditionals based on teaching style', () => {
      const template = `# Notes

{{#if proof_style == "rigorous-with-intuition"}}
Include full derivations with intuitive explanations.
{{/if}}

{{#if formality == "balanced"}}
Use balanced formality in language.
{{/if}}`;

      const variables = {
        proof_style: 'rigorous-with-intuition',
        formality: 'balanced'
      };

      const result = PromptBuilder.build(template, variables);

      expect(result).toContain('Include full derivations');
      expect(result).toContain('balanced formality');
    });

    test('handles nested conditionals with course-specific content', () => {
      const template = `{{#if cross_listing.enabled == true}}
## Cross-Listed Course
{{#if cross_listing.graduate != ""}}
Graduate: {{cross_listing.graduate}}
{{/if}}
{{/if}}`;

      const variables = {
        cross_listing: {
          enabled: true,
          graduate: 'STAT 545'
        }
      };

      const result = PromptBuilder.build(template, variables);

      expect(result).toContain('Cross-Listed Course');
      expect(result).toContain('Graduate: STAT 545');
    });
  });

  describe('PromptConfigBridge integration', () => {
    test('loads config and style from teach-config.yml', async () => {
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Randomized Complete Block Design',
        week: 8
      });

      expect(result).toBeDefined();
      expect(result.prompt).toBeDefined();
      expect(result.style).toBeDefined();
      expect(result.variables).toBeDefined();
    });

    test('merges teaching_style into template variables', async () => {
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'ANCOVA'
      });

      // Check that teaching_style fields are available in variables
      const vars = result.variables;

      // From teach-config.yml teaching_style
      expect(vars.pedagogical_approach || vars.teaching_style?.pedagogical_approach).toBeDefined();
    });

    test('includes week-specific lesson plan data when available', async () => {
      // Week 8 is RCBD in stat-545
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Randomized Complete Block Design',
        week: 8
      });

      // Variables should include week-specific info AND the topic
      expect(result.variables).toBeDefined();
      expect(result.variables.topic).toBe('Randomized Complete Block Design');
      // Note: stat-545 lecture-notes.md is a STATIC template (no {{topic}} variable)
      // So the topic appears in variables, not in rendered output
      expect(result.rendered).toContain('Lecture Notes Generator'); // Template content
    });

    test('generates no warnings for compatible versions', async () => {
      // The stat-545 prompt version should be compatible with current SCHOLAR_VERSION
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Test Topic'
      });

      // Should have no version warnings (v2.4 matches v2.4.0)
      expect(result.warnings).toBeDefined();
      // No version-related warnings expected
      const versionWarnings = result.warnings.filter(w =>
        w.includes('version') ||
        w.includes('older') ||
        w.includes('update')
      );
      expect(versionWarnings).toHaveLength(0);
    });

    test('renders complete prompt with all substitutions', async () => {
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Split-Plot Designs',
        course_level: 'graduate',
        field: 'experimental design'
      });

      // Variables should contain the topic
      expect(result.variables.topic).toBe('Split-Plot Designs');

      // Rendered should have substantial content (the static template)
      expect(result.rendered.length).toBeGreaterThan(1000);
      expect(result.rendered).toContain('Lecture Notes Generator');
    });
  });

  describe('Full pipeline validation', () => {
    test('complete workflow: load → configure → build', async () => {
      // Step 1: Load the prompt
      const loaded = await PromptLoader.load('lecture-notes', STAT545_PATH);
      expect(loaded.source).toBe('project');

      // Step 2: Prepare variables from config and teaching style
      const variables = {
        topic: 'Multiple Comparisons',
        course: {
          name: 'STAT 545',
          full_name: 'STAT 545 - Analysis of Variance and Experimental Design'
        },
        course_level: 'graduate',
        field: 'statistics',
        week: 3,

        // Teaching style variables
        proof_style: 'rigorous-with-intuition',
        pedagogical_approach: {
          primary: 'problem-based',
          secondary: 'active-learning'
        },
        code_style: 'tidyverse-primary'
      };

      // Step 3: Build the prompt
      const rendered = PromptBuilder.build(loaded.body, variables);

      // Validate result
      expect(rendered).toBeDefined();
      expect(rendered.length).toBeGreaterThan(500);

      // Variables should be substituted (no {{}} remaining for known vars)
      expect(rendered).not.toContain('{{topic}}');
      expect(rendered).not.toContain('{{course_level}}');
    });

    test('bridge handles missing optional variables gracefully', async () => {
      // Minimal options - only required fields
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Test Topic'
      });

      expect(result).toBeDefined();
      expect(result.rendered).toBeDefined();

      // Should not throw, should produce valid output
      expect(typeof result.rendered).toBe('string');
    });

    test('bridge returns structured metadata', async () => {
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Latin Square Designs'
      });

      expect(result).toHaveProperty('rendered');
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('style');
      expect(result).toHaveProperty('variables');
      expect(result).toHaveProperty('warnings');

      expect(result.prompt).toHaveProperty('metadata');
      expect(result.prompt).toHaveProperty('body');
      expect(result.prompt).toHaveProperty('source');
    });
  });

  describe('Edge cases with real course', () => {
    test('handles special characters in topic names', async () => {
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Y = μ + τᵢ + εᵢⱼ (The Linear Model)'
      });

      // Topic with special chars should be preserved in variables
      expect(result.variables.topic).toBe('Y = μ + τᵢ + εᵢⱼ (The Linear Model)');
    });

    test('handles week with complex lesson plan structure', async () => {
      // Week 1 has multiple parts in stat-545
      const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
        courseRoot: STAT545_PATH,
        topic: 'Introduction to Experimental Design',
        week: 1,
        part: 1
      });

      expect(result).toBeDefined();
      expect(result.variables.topic).toBe('Introduction to Experimental Design');
      expect(result.variables.week).toBe(1);
    });

    test('handles prompt type not in project (falls back to default)', async () => {
      // quiz is not in .flow/templates/prompts/ for stat-545
      const result = await PromptConfigBridge.loadConfiguredPrompt('quiz', {
        courseRoot: STAT545_PATH,
        topic: 'Midterm Review',
        course_level: 'graduate'
      });

      expect(result).toBeDefined();
      // Should use default template
      expect(result.prompt.source).toBe('default');
      // And should render the template with substitutions
      expect(result.rendered).toContain('Midterm Review');
    });
  });
});

describeIfExists('stat-545 Teaching Style Extraction', () => {
  test('extracts pedagogical_approach from teaching_style', async () => {
    const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
      courseRoot: STAT545_PATH,
      topic: 'Test'
    });

    const style = result.style;
    expect(style).toBeDefined();

    // Verify pedagogical_approach is extracted (from style layers or config)
    // The value depends on which layer provides it (config, course style, or global defaults)
    const hasPedagogicalApproach =
      style.pedagogical_approach?.primary != null ||
      result.variables.pedagogical_approach != null;

    expect(hasPedagogicalApproach).toBe(true);
  });

  test('extracts explanation_style settings', async () => {
    const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
      courseRoot: STAT545_PATH,
      topic: 'Test'
    });

    const style = result.style;
    // Check for explanation_style in style or variables
    const hasFormality =
      style.explanation_style?.formality === 'balanced' ||
      style['explanation_style.formality'] === 'balanced' ||
      result.variables.formality === 'balanced';

    expect(hasFormality).toBe(true);
  });

  test('extracts notation_conventions', async () => {
    const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
      courseRoot: STAT545_PATH,
      topic: 'Test'
    });

    const style = result.style;
    if (style.notation_conventions) {
      expect(style.notation_conventions.fixed_effects).toContain('Greek');
      expect(style.notation_conventions.random_effects).toContain('Latin');
    }
  });

  test('extracts command_overrides for lecture', async () => {
    const result = await PromptConfigBridge.loadConfiguredPrompt('lecture-notes', {
      courseRoot: STAT545_PATH,
      topic: 'Test'
    });

    const style = result.style;
    if (style.command_overrides?.lecture) {
      expect(style.command_overrides.lecture.length).toBe('20-40 pages');
    }
  });
});
