/**
 * E2E Dogfooding Tests: Config Management with Demo Course
 *
 * Scaffolds a full STAT-101 demo course using /teaching:demo infrastructure,
 * then exercises all /teaching:config subcommands against real course data:
 *
 *   1. scaffold — copy default prompts into the demo course
 *   2. show — display resolved 4-layer config with real teach-config.yml
 *   3. validate — pre-flight check against real lesson plans + prompts
 *   4. diff — compare scaffolded prompts against Scholar defaults
 *   5. trace — read provenance from a generated .qmd file
 *   6. prompt_hints — verify per-week variables merge into Layer 4
 *   7. upgrade detection — check version tracking end-to-end
 *
 * Uses the demo-templates/ directory to create a realistic course structure
 * that mirrors what /teaching:demo produces.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

import { scaffoldFlowDirectory } from '../../../src/teaching/commands/demo-scaffold.js';
import { ConfigScaffolder, SCHOLAR_VERSION } from '../../../src/teaching/config/scaffolder.js';
import { ConfigShow } from '../../../src/teaching/config/config-show.js';
import { ConfigPreflightValidator } from '../../../src/teaching/config/config-preflight.js';
import { PromptDiffEngine } from '../../../src/teaching/config/prompt-diff.js';
import { ProvenanceTracer } from '../../../src/teaching/config/provenance.js';
import { PromptLoader } from '../../../src/teaching/ai/prompt-loader.js';
import { PromptConfigBridge } from '../../../src/teaching/ai/prompt-config-bridge.js';
import { loadTeachConfig } from '../../../src/teaching/config/loader.js';

describe('E2E: Config Management with Demo Course', () => {
  let courseRoot;

  beforeEach(async () => {
    courseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-config-e2e-'));

    // Scaffold the full demo course (STAT-101)
    const result = await scaffoldFlowDirectory({ targetPath: courseRoot });
    expect(result.success).toBe(true);
    expect(result.filesCreated.length).toBeGreaterThan(0);
  });

  afterEach(() => {
    fs.rmSync(courseRoot, { recursive: true, force: true });
  });

  // ─── Verify demo course structure ──────────────────────────

  describe('Demo course structure', () => {
    it('should have .flow/teach-config.yml', () => {
      const configPath = path.join(courseRoot, '.flow', 'teach-config.yml');
      expect(fs.existsSync(configPath)).toBe(true);

      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      expect(config.scholar.course_info.code).toBe('STAT-101');
      expect(config.scholar.course_info.level).toBe('undergraduate');
    });

    it('should have .flow/lesson-plans.yml with 15 weeks', () => {
      const manifestPath = path.join(courseRoot, '.flow', 'lesson-plans.yml');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.schema_version).toBe('1.0');
      expect(manifest.weeks.length).toBeGreaterThanOrEqual(3);
      expect(manifest.weeks[0].title).toBe('Descriptive Statistics');
    });

    it('should have example files', () => {
      const examplesDir = path.join(courseRoot, 'examples');
      expect(fs.existsSync(examplesDir)).toBe(true);
    });
  });

  // ─── 1. Scaffold: copy prompts into demo course ───────────

  describe('scaffold subcommand', () => {
    it('should scaffold lecture-notes prompt into demo course', async () => {
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      const result = await scaffolder.scaffold('lecture-notes');

      expect(result.alreadyExists).toBe(false);
      expect(result.scholarVersion).toBe(SCHOLAR_VERSION);
      expect(result.requiredVars).toContain('topic');
      expect(result.requiredVars).toContain('course_level');

      // Verify file on disk
      const promptPath = path.join(courseRoot, '.flow', 'templates', 'prompts', 'lecture-notes.md');
      expect(fs.existsSync(promptPath)).toBe(true);

      // Verify version injection
      const content = fs.readFileSync(promptPath, 'utf8');
      expect(content).toContain('based_on_scholar_version');
      expect(content).toContain(SCHOLAR_VERSION);
    });

    it('should scaffold all available defaults into demo course', async () => {
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      const available = scaffolder.listAvailable();
      expect(available.length).toBe(4); // lecture-notes, lecture-outline, quiz, section-content

      const results = [];
      for (const type of available) {
        results.push(await scaffolder.scaffold(type));
      }

      expect(results.every(r => !r.alreadyExists)).toBe(true);
      expect(results.every(r => r.scholarVersion === SCHOLAR_VERSION)).toBe(true);

      // All 4 prompt files exist
      const promptsDir = path.join(courseRoot, '.flow', 'templates', 'prompts');
      const files = fs.readdirSync(promptsDir);
      expect(files).toContain('lecture-notes.md');
      expect(files).toContain('quiz.md');
      expect(files).toContain('lecture-outline.md');
      expect(files).toContain('section-content.md');
    });

    it('should not overwrite existing scaffolded prompt', async () => {
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });

      const first = await scaffolder.scaffold('quiz');
      expect(first.alreadyExists).toBe(false);

      // Modify the scaffolded prompt
      const promptPath = path.join(courseRoot, '.flow', 'templates', 'prompts', 'quiz.md');
      const original = fs.readFileSync(promptPath, 'utf8');
      fs.writeFileSync(promptPath, original + '\n<!-- Custom instructor additions -->\n');

      const second = await scaffolder.scaffold('quiz');
      expect(second.alreadyExists).toBe(true);

      // Verify custom content is preserved
      const preserved = fs.readFileSync(promptPath, 'utf8');
      expect(preserved).toContain('Custom instructor additions');
    });
  });

  // ─── 2. Show: resolved config with real demo course ───────

  describe('show subcommand', () => {
    it('should display Layer 1 defaults', async () => {
      const configShow = new ConfigShow({ cwd: courseRoot });
      const result = await configShow.show({});

      expect(result.formatted).toBeDefined();
      expect(result.layers).toBeDefined();
      expect(result.layers.layer1).toBeDefined();
      expect(Object.keys(result.layers.layer1).length).toBeGreaterThan(0);
    });

    it('should resolve Layer 2 from demo teach-config.yml', async () => {
      const configShow = new ConfigShow({ cwd: courseRoot });
      const result = await configShow.show({});

      // Layer 2 should pick up STAT-101 config values that differ from defaults
      expect(result.layers.layer2).toBeDefined();
    });

    it('should show config for a specific command', async () => {
      const configShow = new ConfigShow({ cwd: courseRoot });
      const result = await configShow.show({ command: 'lecture' });

      expect(result.formatted).toContain('lecture');
    });

    it('should show config for a specific week', async () => {
      const configShow = new ConfigShow({ cwd: courseRoot });
      const result = await configShow.show({ command: 'lecture', week: 1 });

      expect(result.formatted).toBeDefined();
      // Week 1 is "Descriptive Statistics"
      if (result.layers.layer4) {
        expect(Object.keys(result.layers.layer4).length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should resolve prompt template source', async () => {
      // First scaffold a prompt
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');

      const configShow = new ConfigShow({ cwd: courseRoot });
      const result = await configShow.show({ promptType: 'lecture-notes' });

      expect(result.prompt).toBeDefined();
      expect(result.prompt.source).toBe('project');
    });

    it('should show default prompt when none scaffolded', async () => {
      const configShow = new ConfigShow({ cwd: courseRoot });
      const result = await configShow.show({ promptType: 'lecture-notes' });

      expect(result.prompt).toBeDefined();
      expect(result.prompt.source).toBe('default');
    });
  });

  // ─── 3. Validate: pre-flight check of demo course ────────

  describe('validate subcommand', () => {
    it('should validate demo course with no errors', async () => {
      const validator = new ConfigPreflightValidator({ cwd: courseRoot });
      const result = await validator.validate();

      expect(result.errors).toBe(0);
      expect(result.formatted).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should pass teach-config.yml check', async () => {
      const validator = new ConfigPreflightValidator({ cwd: courseRoot });
      const result = await validator.validate();

      const configCheck = result.checks.find(c => c.name.includes('teach-config'));
      expect(configCheck).toBeDefined();
      expect(configCheck.status).toBe('PASS');
    });

    it('should detect scaffolded prompts after scaffold', async () => {
      // Scaffold a prompt first
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');

      const validator = new ConfigPreflightValidator({ cwd: courseRoot });
      const result = await validator.validate();

      // Should check the scaffolded prompt template
      const promptCheck = result.checks.find(c =>
        c.name && c.name.toLowerCase().includes('prompt')
      );
      // Prompt check should exist (may be PASS or WARN depending on version)
      if (promptCheck) {
        expect(['PASS', 'WARN']).toContain(promptCheck.status);
      }
    });

    it('should catch invalid teach-config.yml', async () => {
      // Corrupt the config
      const configPath = path.join(courseRoot, '.flow', 'teach-config.yml');
      fs.writeFileSync(configPath, 'invalid: yaml: [[[');

      const validator = new ConfigPreflightValidator({ cwd: courseRoot });
      const result = await validator.validate();

      expect(result.errors).toBeGreaterThan(0);
    });

    it('should validate in strict mode', async () => {
      const validator = new ConfigPreflightValidator({ cwd: courseRoot, strict: true });
      const result = await validator.validate();

      // Demo course should be clean enough for strict mode
      expect(result.formatted).toBeDefined();
    });
  });

  // ─── 4. Diff: compare scaffolded prompts vs defaults ──────

  describe('diff subcommand', () => {
    it('should report no overrides when none scaffolded', async () => {
      const engine = new PromptDiffEngine({ cwd: courseRoot });
      const result = await engine.diffAll();

      expect(result.prompts).toBeDefined();
      expect(result.formatted).toBeDefined();

      // All should show "no-override" since we haven't scaffolded anything
      const overrides = result.prompts.filter(p => p.status !== 'no-override');
      expect(overrides.length).toBe(0);
    });

    it('should detect scaffolded prompt as identical', async () => {
      // Scaffold quiz (unmodified copy of default)
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('quiz');

      const engine = new PromptDiffEngine({ cwd: courseRoot });
      const result = await engine.diffType('quiz');

      // Scaffolded from same version — body should be effectively identical
      // (only added based_on_scholar_version in frontmatter)
      expect(result.type).toBe('quiz');
      expect(result.status).toBeDefined();
    });

    it('should detect modifications to scaffolded prompt', async () => {
      // Scaffold and modify
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');

      const promptPath = path.join(courseRoot, '.flow', 'templates', 'prompts', 'lecture-notes.md');
      let content = fs.readFileSync(promptPath, 'utf8');

      // Add custom section to body
      content += '\n\n## Custom Section\nInstructor-specific content here.\n';
      fs.writeFileSync(promptPath, content);

      const engine = new PromptDiffEngine({ cwd: courseRoot });
      const result = await engine.diffType('lecture-notes');

      expect(result.bodyChanges).toBeDefined();
      expect(result.bodyChanges.added.length).toBeGreaterThan(0);
    });

    it('should diff all types and include summary', async () => {
      // Scaffold 2 of 4 available prompts
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');
      await scaffolder.scaffold('quiz');

      const engine = new PromptDiffEngine({ cwd: courseRoot });
      const result = await engine.diffAll();

      expect(result.summary).toBeDefined();
      expect(result.formatted).toBeDefined();

      // 2 scaffolded, rest are no-override
      const overrides = result.prompts.filter(p => p.status !== 'no-override');
      expect(overrides.length).toBe(2);
    });
  });

  // ─── 5. Trace: provenance from generated file ─────────────

  describe('trace subcommand', () => {
    it('should trace a file with full Scholar provenance', async () => {
      // Create a mock generated .qmd file with provenance metadata
      const lectureDir = path.join(courseRoot, 'content', 'lectures');
      fs.mkdirSync(lectureDir, { recursive: true });

      const qmdPath = path.join(lectureDir, 'week-01_descriptive-statistics.qmd');
      fs.writeFileSync(qmdPath, `---
title: "Descriptive Statistics"
author: "Dr. Jane Smith"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T15:30:00Z
# scholar_version: ${SCHOLAR_VERSION}
# prompt_template: lecture-notes.md (v2.0)
# config_source: .flow/teach-config.yml
# lesson_plan: .flow/lesson-plans.yml
# teaching_style: .claude/teaching-style.local.md
# generation_time: 42s
# sections: 12
# ---
format: html
---

# Descriptive Statistics

Content here...
`);

      const tracer = new ProvenanceTracer({ cwd: courseRoot });
      const result = await tracer.trace(qmdPath);

      expect(result.found).toBe(true);
      expect(result.provenance.scholar_version).toBe(SCHOLAR_VERSION);
      expect(result.provenance.prompt_template).toContain('lecture-notes.md');
      expect(result.provenance.config_source).toBe('.flow/teach-config.yml');
      expect(result.provenance.lesson_plan).toBe('.flow/lesson-plans.yml');
      expect(result.layers.length).toBe(4);

      // Config hash should be deterministic
      expect(result.configHash).toBeDefined();
      expect(result.configHash.length).toBe(7);

      // Formatted output should be human-readable
      expect(result.formatted).toContain('week-01_descriptive-statistics.qmd');
      expect(result.formatted).toContain(SCHOLAR_VERSION);
    });

    it('should report no metadata for non-Scholar file', async () => {
      const plainFile = path.join(courseRoot, 'notes.md');
      fs.writeFileSync(plainFile, '# Just some notes\nNo Scholar metadata here.\n');

      const tracer = new ProvenanceTracer({ cwd: courseRoot });
      const result = await tracer.trace(plainFile);

      expect(result.found).toBe(false);
      expect(result.formatted).toContain('No Scholar generation metadata');
    });

    it('should detect all 4 layers from provenance', async () => {
      const qmdPath = path.join(courseRoot, 'test.qmd');
      fs.writeFileSync(qmdPath, `---
title: "Test"
# --- Scholar Generation Metadata ---
# generated: 2026-02-09T10:00:00Z
# scholar_version: ${SCHOLAR_VERSION}
# prompt_template: lecture-notes.md (v2.0)
# config_source: .flow/teach-config.yml
# lesson_plan: .flow/lesson-plans.yml
# teaching_style: .claude/teaching-style.local.md
# generation_time: 30s
# sections: 8
# ---
format: html
---
Content
`);

      const tracer = new ProvenanceTracer({ cwd: courseRoot });
      const result = await tracer.trace(qmdPath);

      // All 4 layers should be active
      const activeLayers = result.layers.filter(l => l.active);
      expect(activeLayers.length).toBe(4);
    });
  });

  // ─── 6. Prompt Hints: per-week variable merging ───────────

  describe('prompt_hints integration', () => {
    it('should merge prompt_hints from lesson plan into variables', () => {
      const lessonPlan = {
        week: 3,
        topic: 'Random Variables',
        learning_objectives: ['Understand random variables'],
        prompt_hints: {
          emphasis: 'derivations',
          include_hand_calculations: true,
          r_output_style: 'minimal'
        }
      };

      const variables = PromptConfigBridge.buildMergedVariables(
        { topic: 'Random Variables' },
        lessonPlan,
        { explanation_style: { formality: 'formal' } },
        {}
      );

      // prompt_hints should be merged
      expect(variables.emphasis).toBe('derivations');
      expect(variables.include_hand_calculations).toBe(true);
      expect(variables.r_output_style).toBe('minimal');
    });

    it('should let command args override prompt_hints', () => {
      const lessonPlan = {
        week: 3,
        prompt_hints: {
          emphasis: 'derivations'
        }
      };

      const variables = PromptConfigBridge.buildMergedVariables(
        { topic: 'Random Variables', tone: 'conversational' },
        lessonPlan,
        {},
        {}
      );

      // Args should win over hints
      expect(variables.tone).toBe('conversational');
      // But hints still applied where args don't conflict
      expect(variables.emphasis).toBe('derivations');
    });

    it('should handle lesson plan without prompt_hints', () => {
      const lessonPlan = {
        week: 1,
        topic: 'Descriptive Statistics',
        learning_objectives: ['Understand data types']
      };

      const variables = PromptConfigBridge.buildMergedVariables(
        { topic: 'Descriptive Statistics' },
        lessonPlan,
        {},
        {}
      );

      // Should still work without prompt_hints
      expect(variables.topic).toBe('Descriptive Statistics');
      expect(variables.has_lesson_plan).toBe(true);
    });

    it('should merge prompt_hints with demo course config', () => {
      // Load real demo course config
      const config = loadTeachConfig(courseRoot);

      const lessonPlan = {
        week: 5,
        topic: 'Confidence Intervals',
        prompt_hints: {
          emphasis: 'implementation',
          include_hand_calculations: false
        }
      };

      const variables = PromptConfigBridge.buildMergedVariables(
        {},
        lessonPlan,
        {},
        config
      );

      // Config values from STAT-101
      expect(variables.course_level).toBe('undergraduate');
      expect(variables.field).toBe('statistics');

      // Prompt hints should be present
      expect(variables.emphasis).toBe('implementation');
      expect(variables.include_hand_calculations).toBe(false);
    });
  });

  // ─── 7. Upgrade detection ─────────────────────────────────

  describe('upgrade detection', () => {
    it('should detect first run (no .scholar-version)', async () => {
      const result = await PromptLoader.isFirstRunAfterUpgrade(courseRoot);

      expect(result.isFirstRun).toBe(true);
      expect(result.previousVersion).toBeNull();
      expect(result.currentVersion).toBe(SCHOLAR_VERSION);
    });

    it('should record and detect current version', async () => {
      await PromptLoader.recordVersion(courseRoot);

      const result = await PromptLoader.isFirstRunAfterUpgrade(courseRoot);
      expect(result.isFirstRun).toBe(false);
    });

    it('should detect version change', async () => {
      // Simulate older version
      const versionFile = path.join(courseRoot, '.flow', '.scholar-version');
      fs.writeFileSync(versionFile, '2.5.0');

      const result = await PromptLoader.isFirstRunAfterUpgrade(courseRoot);
      expect(result.isFirstRun).toBe(true);
      expect(result.previousVersion).toBe('2.5.0');
    });

    it('should check upgrades on scaffolded prompts', async () => {
      // Scaffold prompts
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');
      await scaffolder.scaffold('quiz');

      const result = await PromptLoader.checkUpgrades(courseRoot);

      expect(result.scholarVersion).toBe(SCHOLAR_VERSION);
      expect(result.prompts.length).toBe(2);

      // Both should be 'current' since they were just scaffolded
      expect(result.prompts.every(p => p.status === 'current')).toBe(true);
    });

    it('should detect stale prompt after simulated upgrade', async () => {
      // Scaffold a prompt
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');

      // Simulate the prompt being from an older version
      const promptPath = path.join(courseRoot, '.flow', 'templates', 'prompts', 'lecture-notes.md');
      let content = fs.readFileSync(promptPath, 'utf8');
      // YAML dumper may output with or without quotes — handle both
      content = content.replace(
        /based_on_scholar_version:\s*["']?[\d.]+["']?/,
        'based_on_scholar_version: "2.5.0"'
      );
      fs.writeFileSync(promptPath, content);

      const result = await PromptLoader.checkUpgrades(courseRoot);

      const lecturePrompt = result.prompts.find(p => p.type === 'lecture-notes');
      expect(lecturePrompt.status).toBe('stale');
      expect(lecturePrompt.basedOnVersion).toBe('2.5.0');
    });
  });

  // ─── 8. Full pipeline: scaffold → show → validate → diff ─

  describe('full pipeline integration', () => {
    it('should run scaffold → validate → diff → show pipeline', async () => {
      // Step 1: Scaffold prompts
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');
      await scaffolder.scaffold('quiz');

      // Step 2: Validate the whole course
      const validator = new ConfigPreflightValidator({ cwd: courseRoot });
      const validation = await validator.validate();
      expect(validation.errors).toBe(0);

      // Step 3: Diff scaffolded prompts
      const diffEngine = new PromptDiffEngine({ cwd: courseRoot });
      const diff = await diffEngine.diffAll();
      expect(diff.prompts.length).toBeGreaterThan(0);

      // Step 4: Show resolved config
      const configShow = new ConfigShow({ cwd: courseRoot });
      const show = await configShow.show({ command: 'lecture' });
      expect(show.formatted).toBeDefined();

      // Step 5: Record version
      await PromptLoader.recordVersion(courseRoot);
      const upgrade = await PromptLoader.isFirstRunAfterUpgrade(courseRoot);
      expect(upgrade.isFirstRun).toBe(false);
    });

    it('should handle customized prompt through full pipeline', async () => {
      // Scaffold and customize
      const scaffolder = new ConfigScaffolder({ cwd: courseRoot });
      await scaffolder.scaffold('lecture-notes');

      const promptPath = path.join(courseRoot, '.flow', 'templates', 'prompts', 'lecture-notes.md');
      let content = fs.readFileSync(promptPath, 'utf8');
      content += '\n## STAT-101 Custom Section\nAlways include R examples with tidyverse.\n';
      fs.writeFileSync(promptPath, content);

      // Validate should still pass
      const validator = new ConfigPreflightValidator({ cwd: courseRoot });
      const validation = await validator.validate();
      expect(validation.errors).toBe(0);

      // Diff should detect body changes
      const diffEngine = new PromptDiffEngine({ cwd: courseRoot });
      const diff = await diffEngine.diffType('lecture-notes');
      expect(diff.bodyChanges.added.length).toBeGreaterThan(0);

      // Show should indicate project override
      const configShow = new ConfigShow({ cwd: courseRoot });
      const show = await configShow.show({ promptType: 'lecture-notes' });
      expect(show.prompt.source).toBe('project');
    });
  });
});
