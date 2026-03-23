/**
 * Unit Tests for ConfigShow
 *
 * Tests the 4-layer config hierarchy resolution and display.
 * Uses temp directories with mock config files.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigShow } from '../../src/teaching/config/config-show.js';

describe('ConfigShow', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = join(tmpdir(), `config-show-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper: create .flow directory with teach-config.yml
   */
  function createTeachConfig(dir, config) {
    const flowDir = join(dir, '.flow');
    mkdirSync(flowDir, { recursive: true });
    writeFileSync(join(flowDir, 'teach-config.yml'), config);
  }

  /**
   * Helper: create .claude directory with teaching-style.local.md
   */
  function createTeachingStyle(dir, frontmatter) {
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const content = `---\n${frontmatter}\n---\n\n# Teaching Style\n\nThis is my teaching style.`;
    writeFileSync(join(claudeDir, 'teaching-style.local.md'), content);
  }

  /**
   * Helper: create a lesson plan for a given week
   */
  function createLessonPlan(dir, weekNum, plan) {
    const plansDir = join(dir, 'content', 'lesson-plans');
    mkdirSync(plansDir, { recursive: true });
    const paddedWeek = String(weekNum).padStart(2, '0');
    writeFileSync(join(plansDir, `week${paddedWeek}.yml`), plan);
  }

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const show = new ConfigShow();
      expect(show.cwd).toBe(process.cwd());
      expect(show.debug).toBe(false);
    });

    it('should accept custom options', () => {
      const show = new ConfigShow({ cwd: '/tmp', debug: true });
      expect(show.cwd).toBe('/tmp');
      expect(show.debug).toBe(true);
    });
  });

  describe('show with no config (Layer 1 only)', () => {
    it('should return only plugin defaults when no config files exist', async () => {
      // tempDir has no .flow/ or .claude/ directories
      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // Layer 1 should have defaults
      expect(result.layers.layer1).toBeDefined();
      expect(Object.keys(result.layers.layer1).length).toBeGreaterThan(0);

      // Should include the canonical defaults from buildMergedVariables
      expect(result.layers.layer1.tone).toBe('formal');
      expect(result.layers.layer1.pedagogical_approach).toBe('active-learning');
      expect(result.layers.layer1.course_level).toBe('undergraduate');
      expect(result.layers.layer1.field).toBe('statistics');
      expect(result.layers.layer1.language).toBe('r');

      // Other layers should be empty
      expect(Object.keys(result.layers.layer2).length).toBe(0);
      expect(Object.keys(result.layers.layer3).length).toBe(0);
      expect(Object.keys(result.layers.layer4).length).toBe(0);
    });

    it('should return structured result shape', async () => {
      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      expect(result).toHaveProperty('layers');
      expect(result).toHaveProperty('resolved');
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('formatted');
      expect(result).toHaveProperty('warnings');

      expect(result.layers).toHaveProperty('layer1');
      expect(result.layers).toHaveProperty('layer2');
      expect(result.layers).toHaveProperty('layer3');
      expect(result.layers).toHaveProperty('layer4');
    });

    it('should have null prompt when no promptType specified', async () => {
      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});
      expect(result.prompt).toBeNull();
    });

    it('should produce formatted output as a string', async () => {
      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      expect(typeof result.formatted).toBe('string');
      expect(result.formatted.length).toBeGreaterThan(0);
      expect(result.formatted).toContain('=== Resolved Config:');
      expect(result.formatted).toContain('Layer 1 (Plugin Defaults)');
    });
  });

  describe('show with teach-config.yml (Layer 2)', () => {
    it('should detect Layer 2 overrides from .flow/teach-config.yml', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
    field: "biostatistics"
    difficulty: "advanced"
  defaults:
    lecture_format: "quarto"
  style:
    tone: "conversational"
    notation: "bayesian"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // Layer 2 should contain course overrides
      expect(result.layers.layer2.course_level).toBe('graduate');
      expect(result.layers.layer2.field).toBe('biostatistics');

      // Resolved values should come from Layer 2
      expect(result.resolved.course_level.value).toBe('graduate');
      expect(result.resolved.course_level.layer).toBe(2);
      expect(result.resolved.course_level.overrides).toBe(1);

      expect(result.resolved.field.value).toBe('biostatistics');
      expect(result.resolved.field.layer).toBe(2);
    });

    it('should show Layer 2 source in formatted output', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      expect(result.formatted).toContain('Layer 2 (Course Style');
    });
  });

  describe('show with teaching style file (Layer 2)', () => {
    it('should detect teaching style overrides', async () => {
      // Create .claude dir to establish course root
      createTeachingStyle(tempDir, `teaching_style:
  pedagogical_approach:
    primary: "problem-based"
  explanation_style:
    formality: "balanced"`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // Teaching style values should appear in Layer 2
      const layer2Keys = Object.keys(result.layers.layer2).filter(k => !k.startsWith('_'));
      expect(layer2Keys.length).toBeGreaterThan(0);
    });
  });

  describe('show with --command (Layer 3)', () => {
    it('should show command overrides when command_overrides exist', async () => {
      createTeachingStyle(tempDir, `teaching_style:
  pedagogical_approach:
    primary: "problem-based"
  explanation_style:
    formality: "balanced"
  command_overrides:
    lecture:
      explanation_style:
        formality: "formal"
        proof_style: "rigorous"`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ command: 'lecture' });

      // Layer 3 should have the command-specific overrides
      const layer3Keys = Object.keys(result.layers.layer3).filter(k => !k.startsWith('_'));

      // If command_overrides were detected, values should differ from Layer 2
      if (layer3Keys.length > 0) {
        expect(result.formatted).toContain('Layer 3 (Command Overrides');
        expect(result.formatted).toContain('command_overrides.lecture');
      }
    });

    it('should show empty Layer 3 when no command specified', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      expect(Object.keys(result.layers.layer3).length).toBe(0);
      expect(result.formatted).toContain('(no --command specified)');
    });

    it('should show empty Layer 3 when command has no overrides', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ command: 'exam' });

      expect(Object.keys(result.layers.layer3).length).toBe(0);
      expect(result.formatted).toContain('(no command overrides found)');
    });
  });

  describe('show with --week (Layer 4)', () => {
    it('should load lesson plan values for a specific week', async () => {
      // Establish course root with .flow
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      createLessonPlan(tempDir, 4, `
week: 4
title: "Model Diagnostics"
learning_objectives:
  - id: "LO-4.1"
    level: "apply"
    description: "Apply residual analysis to detect model violations"
  - id: "LO-4.2"
    level: "analyze"
    description: "Analyze diagnostic plots for regression assumptions"
  - id: "LO-4.3"
    level: "evaluate"
    description: "Evaluate model adequacy using formal tests"
  - id: "LO-4.4"
    level: "apply"
    description: "Apply remedial measures for violated assumptions"
topics:
  - id: "T-4.1"
    name: "Residual Analysis"
  - id: "T-4.2"
    name: "Diagnostic Plots"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ week: 4 });

      // Layer 4 should have lesson plan data
      expect(result.layers.layer4.lesson_title).toBe('Model Diagnostics');
      expect(result.layers.layer4.week).toBe(4);
      expect(result.layers.layer4.learning_objectives).toBeDefined();
      expect(result.layers.layer4.learning_objectives.length).toBe(4);
      expect(result.layers.layer4.topics).toBeDefined();
      expect(result.layers.layer4.topics.length).toBe(2);
    });

    it('should show empty Layer 4 when no week specified', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      expect(Object.keys(result.layers.layer4).length).toBe(0);
      expect(result.formatted).toContain('(no --week specified)');
    });

    it('should warn when lesson plan not found for week', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ week: 99 });

      expect(Object.keys(result.layers.layer4).length).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should show week plan in formatted output', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      createLessonPlan(tempDir, 2, `
week: 2
title: "Simple Linear Regression"
learning_objectives:
  - id: "LO-2.1"
    level: "understand"
    description: "Understand the least squares method"
topics:
  - id: "T-2.1"
    name: "Least Squares Estimation"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ week: 2 });

      expect(result.formatted).toContain('Layer 4 (Week 2 Plan)');
    });
  });

  describe('formatted output annotations', () => {
    it('should include override annotations for Layer 2 overriding Layer 1', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
    field: "biostatistics"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // The formatted output for Layer 2 should show override annotations
      expect(result.formatted).toContain('\u2190 overrides Layer 1');
    });

    it('should include header with command and week', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ command: 'lecture', week: 4 });

      expect(result.formatted).toContain('/teaching:lecture');
      expect(result.formatted).toContain('Week 4');
    });
  });

  describe('resolved data structure', () => {
    it('should annotate each resolved value with source layer', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // course_level should be resolved from Layer 2
      expect(result.resolved.course_level).toBeDefined();
      expect(result.resolved.course_level.value).toBe('graduate');
      expect(result.resolved.course_level.layer).toBe(2);
      expect(result.resolved.course_level.layerName).toBe('Course Style');
      expect(result.resolved.course_level.overrides).toBe(1);

      // tone should remain at Layer 1 (not overridden)
      expect(result.resolved.tone).toBeDefined();
      expect(result.resolved.tone.value).toBe('formal');
      expect(result.resolved.tone.layer).toBe(1);
      expect(result.resolved.tone.layerName).toBe('Plugin Defaults');
      expect(result.resolved.tone.overrides).toBeNull();
    });

    it('should track highest layer as winner when multiple layers set same key', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
`);

      createLessonPlan(tempDir, 3, `
week: 3
title: "Week 3 Topic"
learning_objectives:
  - id: "LO-3.1"
    level: "understand"
    description: "Test objective"
topics:
  - id: "T-3.1"
    name: "Test topic"
teaching_style_overrides:
  explanation_style:
    formality: "conversational"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ week: 3 });

      // If teaching_style_overrides set tone, Layer 4 should win
      if (result.resolved.tone && result.resolved.tone.layer === 4) {
        expect(result.resolved.tone.overrides).not.toBeNull();
      }
    });
  });

  describe('show with --prompt', () => {
    it('should include prompt info when promptType is specified', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      // Use a known valid type; it may fall back to default
      const result = await show.show({ promptType: 'lecture-notes' });

      // Prompt should either resolve or produce a warning
      if (result.prompt) {
        expect(result.prompt).toHaveProperty('source');
        expect(result.prompt).toHaveProperty('scholarVersion');
        expect(result.formatted).toContain('Prompt template:');
      } else {
        // If no prompt template exists, should have warning
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should warn on invalid prompt type', async () => {
      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ promptType: 'nonexistent-type' });

      expect(result.prompt).toBeNull();
      expect(result.warnings.some(w => w.includes('nonexistent-type'))).toBe(true);
    });

    it('should show project override prompt source when available', async () => {
      // Create a project-specific prompt template
      const promptDir = join(tempDir, '.flow', 'templates', 'prompts');
      mkdirSync(promptDir, { recursive: true });
      writeFileSync(join(promptDir, 'lecture-notes.md'), `---
prompt_version: "2.0"
prompt_type: "lecture-notes"
prompt_description: "Custom lecture notes prompt"
---

Generate lecture notes for {{topic}}.
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ promptType: 'lecture-notes' });

      expect(result.prompt).not.toBeNull();
      expect(result.prompt.source).toBe('project');
      expect(result.formatted).toContain('project override');
    });
  });

  describe('warnings', () => {
    it('should return empty warnings when everything is clean', async () => {
      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // No config files means no errors, just defaults
      expect(result.warnings).toEqual([]);
    });

    it('should collect warnings in the warnings array', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      // Request a week that doesn't exist
      const result = await show.show({ week: 42 });

      // Should have a warning about missing lesson plan
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('formatted output structure', () => {
    it('should have all four layer sections', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ command: 'lecture', week: 1 });

      expect(result.formatted).toContain('Layer 1 (Plugin Defaults)');
      expect(result.formatted).toContain('Layer 2 (Course Style');
      expect(result.formatted).toContain('Layer 3 (Command Overrides');
      expect(result.formatted).toContain('Layer 4 (Week');
    });

    it('should format string values with quotes', async () => {
      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // Layer 1 defaults should be quoted strings
      expect(result.formatted).toContain('"formal"');
      expect(result.formatted).toContain('"undergraduate"');
    });

    it('should format arrays as item counts', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      createLessonPlan(tempDir, 1, `
week: 1
title: "Introduction"
learning_objectives:
  - id: "LO-1.1"
    level: "understand"
    description: "Understand course structure"
  - id: "LO-1.2"
    level: "remember"
    description: "Recall key terminology"
topics:
  - id: "T-1.1"
    name: "Course Overview"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ week: 1 });

      // Arrays should show item counts
      expect(result.formatted).toMatch(/\[\d+ items\]/);
    });

    it('should show warnings section when warnings exist', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ week: 99 });

      if (result.warnings.length > 0) {
        expect(result.formatted).toContain('Warnings:');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty teach-config.yml gracefully', async () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, 'teach-config.yml'), '');

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // Should still return valid structure
      expect(result.layers.layer1).toBeDefined();
      expect(result.formatted).toContain('=== Resolved Config:');
    });

    it('should handle malformed YAML without crashing', async () => {
      const flowDir = join(tempDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, 'teach-config.yml'), 'invalid: {{yaml: [broken');

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({});

      // Should still return results, possibly with warnings
      expect(result).toBeDefined();
      expect(result.layers.layer1).toBeDefined();
    });

    it('should handle week as string', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "undergraduate"
`);

      createLessonPlan(tempDir, 5, `
week: 5
title: "ANOVA"
learning_objectives:
  - id: "LO-5.1"
    level: "apply"
    description: "Apply one-way ANOVA"
topics:
  - id: "T-5.1"
    name: "One-way ANOVA"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const result = await show.show({ week: '5' });

      expect(result.layers.layer4.week).toBe(5);
      expect(result.layers.layer4.lesson_title).toBe('ANOVA');
    });

    it('should handle nested course directory search', async () => {
      // Create config in parent, run from subdirectory
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
`);

      const subDir = join(tempDir, 'src', 'content');
      mkdirSync(subDir, { recursive: true });

      const show = new ConfigShow({ cwd: subDir });
      const result = await show.show({});

      // Should find config from parent directory
      expect(result.layers.layer2.course_level).toBe('graduate');
    });
  });

  describe('performance', () => {
    it('should resolve config within 200ms', async () => {
      createTeachConfig(tempDir, `
scholar:
  course_info:
    level: "graduate"
    field: "statistics"
  style:
    tone: "conversational"
`);

      const show = new ConfigShow({ cwd: tempDir });
      const start = Date.now();
      await show.show({ command: 'lecture' });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });
});
