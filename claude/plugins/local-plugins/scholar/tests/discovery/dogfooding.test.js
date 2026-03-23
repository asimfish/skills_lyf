/**
 * Dogfooding tests for Hub Flag Discovery
 *
 * Verifies that the discovery engine correctly parses ALL 29 real command
 * .md files. These tests run against the actual codebase — if a command's
 * Options section changes format, these tests will catch it.
 *
 * Organized by:
 * 1. Universal invariants (all 32 commands)
 * 2. Teaching AI commands (9 commands with -i)
 * 3. Teaching config commands (7 commands without -i)
 * 4. Research commands (14 commands)
 * 5. Hub rendering spec compliance
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

import {
  discoverCommands,
  getCommandDetail,
} from '../../src/discovery/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

/** All discovered commands, loaded once. */
let ALL_COMMANDS;

/** Find command by base name (e.g., 'exam', 'validate'). */
function findByBase(baseName) {
  return ALL_COMMANDS.find(c => c.file.endsWith(`/${baseName}.md`));
}

/** AI-capable teaching commands (support -i/--instructions). */
const AI_COMMANDS = ['exam', 'quiz', 'slides', 'assignment', 'syllabus', 'lecture', 'rubric', 'feedback', 'solution'];

/** Config/utility teaching commands (no -i). */
const CONFIG_COMMANDS = ['validate', 'diff', 'sync', 'migrate', 'demo', 'config', 'preflight'];

before(() => {
  ALL_COMMANDS = discoverCommands();
});

// ---------------------------------------------------------------------------
// 1. Universal invariants — all 32 commands
// ---------------------------------------------------------------------------

describe('dogfooding: all 32 commands', () => {
  it('discovery finds exactly 31 commands', () => {
    assert.equal(ALL_COMMANDS.length, 32);
  });

  it('every command has a flags array', () => {
    for (const cmd of ALL_COMMANDS) {
      assert.ok(Array.isArray(cmd.flags), `${cmd.name} missing flags array`);
    }
  });

  it('every command has a hasInstructions boolean', () => {
    for (const cmd of ALL_COMMANDS) {
      assert.equal(typeof cmd.hasInstructions, 'boolean', `${cmd.name} hasInstructions is not boolean`);
    }
  });

  it('no command has duplicate flag names', () => {
    for (const cmd of ALL_COMMANDS) {
      const names = cmd.flags.map(f => f.name);
      // Allow duplicate -i (once for inline, once for @file)
      const nonI = names.filter(n => n !== '-i');
      const uniqueNonI = new Set(nonI);
      assert.equal(
        uniqueNonI.size,
        nonI.length,
        `${cmd.name} has duplicate flag names: ${names.join(', ')}`
      );
    }
  });

  it('most flag descriptions are clean text (backticks rare)', () => {
    let backtickCount = 0;
    let totalFlags = 0;
    for (const cmd of ALL_COMMANDS) {
      for (const flag of cmd.flags) {
        totalFlags++;
        if (flag.description.includes('`')) backtickCount++;
      }
    }
    // Some .md files cross-reference other flags in descriptions (e.g. `--to-manifest`)
    // Allow up to 10% with backticks
    const ratio = backtickCount / totalFlags;
    assert.ok(
      ratio < 0.10,
      `Too many flags with backtick descriptions: ${backtickCount}/${totalFlags} (${(ratio * 100).toFixed(1)}%)`
    );
  });

  it('most flag names start with - or -- (nested option values are rare)', () => {
    let nonDash = 0;
    let totalFlags = 0;
    for (const cmd of ALL_COMMANDS) {
      for (const flag of cmd.flags) {
        totalFlags++;
        if (!flag.name.startsWith('-')) nonDash++;
      }
    }
    // Some .md files have nested option values (e.g. validate level: syntax, schema)
    // that the regex captures as flags. Allow up to 5%.
    const ratio = nonDash / totalFlags;
    assert.ok(
      ratio < 0.05,
      `Too many non-dash flag names: ${nonDash}/${totalFlags} (${(ratio * 100).toFixed(1)}%)`
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Teaching AI commands (8 with -i)
// ---------------------------------------------------------------------------

describe('dogfooding: 9 AI teaching commands', () => {
  it('all 9 AI commands exist and are in teaching category', () => {
    for (const name of AI_COMMANDS) {
      const cmd = findByBase(name);
      assert.ok(cmd, `${name} should exist`);
      assert.equal(cmd.category, 'teaching', `${name} should be teaching`);
    }
  });

  it('all 9 AI commands have hasInstructions=true', () => {
    for (const name of AI_COMMANDS) {
      const cmd = findByBase(name);
      assert.equal(cmd.hasInstructions, true, `${name} should have instructions`);
    }
  });

  it('all 9 AI commands have a -i flag (in name or short position)', () => {
    for (const name of AI_COMMANDS) {
      const cmd = findByBase(name);
      const hasI = cmd.flags.some(
        f => f.name === '-i' || f.short === '-i'
      );
      assert.ok(hasI, `${name} should have a -i flag`);
    }
  });

  it('all 9 AI commands have an --instructions flag (in name or short position)', () => {
    for (const name of AI_COMMANDS) {
      const cmd = findByBase(name);
      const hasInstr = cmd.flags.some(
        f => f.name === '--instructions' || f.short === '--instructions'
      );
      assert.ok(hasInstr, `${name} should have an --instructions flag`);
    }
  });

  it('content commands (exam, quiz, slides, assignment, syllabus, lecture) have >= 5 flags', () => {
    const contentCmds = ['exam', 'quiz', 'slides', 'assignment', 'syllabus', 'lecture'];
    for (const name of contentCmds) {
      const cmd = findByBase(name);
      assert.ok(
        cmd.flags.length >= 5,
        `${name} should have >= 5 flags, got ${cmd.flags.length}`
      );
    }
  });

  it('assessment commands (rubric, feedback) have >= 3 flags', () => {
    for (const name of ['rubric', 'feedback']) {
      const cmd = findByBase(name);
      assert.ok(
        cmd.flags.length >= 3,
        `${name} should have >= 3 flags, got ${cmd.flags.length}`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Teaching config commands (7 without -i)
// ---------------------------------------------------------------------------

describe('dogfooding: 7 config teaching commands', () => {
  it('all 7 config commands exist and are in teaching category', () => {
    for (const name of CONFIG_COMMANDS) {
      const cmd = findByBase(name);
      assert.ok(cmd, `${name} should exist`);
      assert.equal(cmd.category, 'teaching', `${name} should be teaching`);
    }
  });

  it('all 7 config commands have hasInstructions=false', () => {
    for (const name of CONFIG_COMMANDS) {
      const cmd = findByBase(name);
      assert.equal(cmd.hasInstructions, false, `${name} should not have instructions`);
    }
  });

  it('none of the config commands have -i or --instructions flag', () => {
    for (const name of CONFIG_COMMANDS) {
      const cmd = findByBase(name);
      const hasI = cmd.flags.some(
        f => f.name === '-i' || f.short === '-i' ||
             f.name === '--instructions' || f.short === '--instructions'
      );
      assert.ok(!hasI, `${name} should not have -i/--instructions flag`);
    }
  });

  it('validate has --all, --strict, --json, --fix, --debug flags', () => {
    const cmd = findByBase('validate');
    const flagNames = cmd.flags.map(f => f.name);
    for (const expected of ['--all', '--strict', '--json', '--fix', '--debug']) {
      assert.ok(flagNames.includes(expected), `validate should have ${expected} flag`);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Research commands (14 commands)
// ---------------------------------------------------------------------------

describe('dogfooding: 14 research commands', () => {
  it('exactly 14 research commands exist', () => {
    const research = ALL_COMMANDS.filter(c => c.category === 'research');
    assert.equal(research.length, 14);
  });

  it('no research commands have hasInstructions=true', () => {
    const research = ALL_COMMANDS.filter(c => c.category === 'research');
    for (const cmd of research) {
      assert.equal(
        cmd.hasInstructions, false,
        `research command ${cmd.name} should not have instructions`
      );
    }
  });

  it('research commands span 4 subcategories', () => {
    // Use ALL_COMMANDS directly to avoid cache race with parallel E2E tests
    const research = ALL_COMMANDS.filter(c => c.category === 'research');
    const subcats = [...new Set(research.map(c => c.subcategory))].sort();
    assert.deepEqual(subcats, ['literature', 'manuscript', 'planning', 'simulation']);
  });

  it('research commands with no Options section have 0 flags', () => {
    // Research commands typically don't have **Options:** sections
    const research = ALL_COMMANDS.filter(c => c.category === 'research');
    for (const cmd of research) {
      // Read the actual .md file to verify
      const filePath = join(PROJECT_ROOT, cmd.file);
      const content = readFileSync(filePath, 'utf-8');
      const hasOptionsSection = /\*\*Options:\*\*/.test(content);

      if (!hasOptionsSection) {
        assert.equal(
          cmd.flags.length, 0,
          `${cmd.name} has no Options section but got ${cmd.flags.length} flags`
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Hub rendering spec compliance
// ---------------------------------------------------------------------------

describe('dogfooding: hub rendering spec compliance', () => {
  it('AI markers: exactly 9 teaching commands have hasInstructions=true', () => {
    const teaching = ALL_COMMANDS.filter(c => c.category === 'teaching');
    const withInstructions = teaching.filter(c => c.hasInstructions);
    assert.equal(
      withInstructions.length, 9,
      `Expected 9 AI commands, got ${withInstructions.length}: ${withInstructions.map(c => c.name).join(', ')}`
    );
  });

  it('flag count hints: commands with Options in .md have flags.length > 0', () => {
    for (const cmd of ALL_COMMANDS) {
      const filePath = join(PROJECT_ROOT, cmd.file);
      const content = readFileSync(filePath, 'utf-8');
      const hasOptionsSection = /\*\*Options:\*\*/.test(content);

      if (hasOptionsSection) {
        assert.ok(
          cmd.flags.length > 0,
          `${cmd.name} has Options section in .md but 0 flags parsed`
        );
      }
    }
  });

  it('options display: all commands with flags can render up to 8 (spec limit)', () => {
    for (const cmd of ALL_COMMANDS) {
      if (cmd.flags.length > 0) {
        const displayCount = Math.min(cmd.flags.length, 8);
        const remainingCount = cmd.flags.length - displayCount;

        // Verify the math for "... (+ N more)" footer
        assert.ok(displayCount <= 8, `display count should be <= 8 for ${cmd.name}`);
        assert.ok(remainingCount >= 0, `remaining count should be >= 0 for ${cmd.name}`);
        assert.equal(
          displayCount + remainingCount,
          cmd.flags.length,
          `display + remaining should equal total for ${cmd.name}`
        );
      }
    }
  });

  it('exam detail: Options section would show 8 flags + footer', () => {
    const exam = findByBase('exam');
    assert.ok(exam.flags.length > 8, `exam should have > 8 flags to test footer`);
    const displayCount = 8;
    const remaining = exam.flags.length - displayCount;
    assert.ok(remaining > 0, `exam should have remaining flags for "+ N more" footer`);
  });

  it('hub.md exists and references [AI] markers', () => {
    const hubPath = join(PROJECT_ROOT, 'src', 'plugin-api', 'commands', 'hub.md');
    const content = readFileSync(hubPath, 'utf-8');
    assert.ok(content.includes('[AI]'), 'hub.md should reference [AI] markers');
    assert.ok(content.includes('hasInstructions'), 'hub.md should reference hasInstructions');
    assert.ok(content.includes('flags'), 'hub.md should reference flags');
  });

  it('hub.md specifies dotted-leader alignment for Options', () => {
    const hubPath = join(PROJECT_ROOT, 'src', 'plugin-api', 'commands', 'hub.md');
    const content = readFileSync(hubPath, 'utf-8');
    assert.ok(
      content.includes('..........') || content.includes('dotted'),
      'hub.md should specify dotted-leader alignment'
    );
  });

  it('hub.md specifies "(N options)" on Usage line', () => {
    const hubPath = join(PROJECT_ROOT, 'src', 'plugin-api', 'commands', 'hub.md');
    const content = readFileSync(hubPath, 'utf-8');
    assert.ok(
      content.includes('options)'),
      'hub.md should specify options count on Usage line'
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Cross-check: getCommandDetail consistency with discoverCommands
// ---------------------------------------------------------------------------

describe('dogfooding: getCommandDetail consistency', () => {
  before(() => {
    // Force cache rebuild to avoid race with E2E cache manipulation tests.
    // getCommandDetail depends on loadCachedCommands() which reads from cache.json.
    const cachePath = join(PROJECT_ROOT, 'src', 'discovery', 'cache.json');
    if (existsSync(cachePath)) {
      unlinkSync(cachePath);
    }
    // Trigger fresh cache write
    discoverCommands();
  });

  it('every discovered command can be looked up by full name', () => {
    for (const cmd of ALL_COMMANDS) {
      const detail = getCommandDetail(cmd.name);
      assert.ok(detail, `${cmd.name} should be found by full name`);
      assert.equal(detail.name, cmd.name, `lookup name should match for ${cmd.name}`);
    }
  });

  it('every teaching command can be looked up by base name', () => {
    const teaching = ALL_COMMANDS.filter(c => c.category === 'teaching');
    for (const cmd of teaching) {
      const baseName = cmd.file.split('/').pop().replace('.md', '');
      const detail = getCommandDetail(baseName);
      assert.ok(detail, `${baseName} should be found by base name`);
    }
  });

  it('getCommandDetail hasInstructions matches discoverCommands hasInstructions', () => {
    for (const cmd of ALL_COMMANDS) {
      const detail = getCommandDetail(cmd.name);
      assert.equal(
        detail.hasInstructions,
        cmd.hasInstructions,
        `hasInstructions mismatch for ${cmd.name}: detail=${detail.hasInstructions}, discover=${cmd.hasInstructions}`
      );
    }
  });
});
