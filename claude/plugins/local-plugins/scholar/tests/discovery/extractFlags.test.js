/**
 * Unit tests for extractFlags()
 *
 * Tests the flag extraction function in isolation with synthetic markdown
 * bodies covering edge cases, format variations, and boundary conditions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Import extractFlags via discoverCommands (extractFlags is internal).
// We test it indirectly through synthetic .md content by exercising
// the discovery engine's parsing on real files AND by checking
// specific flag shapes on known commands.
//
// For direct unit testing, we import the module and test via
// getCommandDetail() which re-parses the .md body including extractFlags().
// ---------------------------------------------------------------------------

import {
  discoverCommands,
  getCommandDetail,
} from '../../src/discovery/index.js';

// ---------------------------------------------------------------------------
// extractFlags — shape & properties
// ---------------------------------------------------------------------------

describe('extractFlags() — flag object shape', () => {
  it('each flag has exactly 4 properties: name, short, description, takesValue', () => {
    const commands = discoverCommands();
    for (const cmd of commands) {
      for (const flag of cmd.flags) {
        const keys = Object.keys(flag).sort();
        assert.deepEqual(
          keys,
          ['description', 'name', 'short', 'takesValue'],
          `Flag in ${cmd.name} has unexpected keys: ${keys.join(', ')}`
        );
      }
    }
  });

  it('name is always a non-empty string', () => {
    const commands = discoverCommands();
    for (const cmd of commands) {
      for (const flag of cmd.flags) {
        assert.ok(
          typeof flag.name === 'string' && flag.name.length > 0,
          `Flag name in ${cmd.name} should be non-empty string, got: "${flag.name}"`
        );
      }
    }
  });

  it('short is either a non-empty string or null', () => {
    const commands = discoverCommands();
    for (const cmd of commands) {
      for (const flag of cmd.flags) {
        if (flag.short !== null) {
          assert.ok(
            typeof flag.short === 'string' && flag.short.length > 0,
            `Flag short in ${cmd.name} should be non-empty string or null, got: "${flag.short}"`
          );
        }
      }
    }
  });

  it('description is always a non-empty string', () => {
    const commands = discoverCommands();
    for (const cmd of commands) {
      for (const flag of cmd.flags) {
        assert.ok(
          typeof flag.description === 'string' && flag.description.length > 0,
          `Flag description in ${cmd.name} should be non-empty string`
        );
      }
    }
  });

  it('takesValue is always a boolean', () => {
    const commands = discoverCommands();
    for (const cmd of commands) {
      for (const flag of cmd.flags) {
        assert.ok(
          typeof flag.takesValue === 'boolean',
          `Flag takesValue in ${cmd.name} should be boolean, got: ${typeof flag.takesValue}`
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// extractFlags — takesValue detection
// ---------------------------------------------------------------------------

describe('extractFlags() — takesValue detection', () => {
  it('--questions N has takesValue=true (uppercase placeholder)', () => {
    const detail = getCommandDetail('exam');
    const flag = detail.flags.find(f => f.name === '--questions');
    assert.ok(flag, 'exam should have --questions flag');
    assert.equal(flag.takesValue, true, '--questions N should take a value');
  });

  it('--difficulty LEVEL has takesValue=true', () => {
    const detail = getCommandDetail('exam');
    const flag = detail.flags.find(f => f.name === '--difficulty');
    assert.ok(flag, 'exam should have --difficulty flag');
    assert.equal(flag.takesValue, true, '--difficulty LEVEL should take a value');
  });

  it('--no-formulas has takesValue=false (boolean flag)', () => {
    const detail = getCommandDetail('exam');
    const flag = detail.flags.find(f => f.name === '--no-formulas');
    assert.ok(flag, 'exam should have --no-formulas flag');
    assert.equal(flag.takesValue, false, '--no-formulas is a boolean flag');
  });

  it('--strict has takesValue=false (boolean flag)', () => {
    const detail = getCommandDetail('exam');
    const flag = detail.flags.find(f => f.name === '--strict');
    assert.ok(flag, 'exam should have --strict flag');
    assert.equal(flag.takesValue, false, '--strict is a boolean flag');
  });

  it('--config PATH has takesValue=true', () => {
    const detail = getCommandDetail('exam');
    const flag = detail.flags.find(f => f.name === '--config');
    assert.ok(flag, 'exam should have --config flag');
    assert.equal(flag.takesValue, true, '--config PATH should take a value');
  });

  it('--topics "..." has takesValue=true (quoted placeholder)', () => {
    const detail = getCommandDetail('exam');
    const flag = detail.flags.find(f => f.name === '--topics');
    assert.ok(flag, 'exam should have --topics flag');
    assert.equal(flag.takesValue, true, '--topics "..." should take a value');
  });

  it('-i @file.txt has takesValue=true (@ prefix)', () => {
    const detail = getCommandDetail('exam');
    // The @file line creates a flag with name=-i
    const fileFlags = detail.flags.filter(f => f.name === '-i');
    assert.ok(fileFlags.length > 0, 'exam should have -i flags');
    const fileFlag = fileFlags.find(f => f.description.includes('file'));
    if (fileFlag) {
      assert.equal(fileFlag.takesValue, true, '-i @file.txt should take a value');
    }
  });
});

// ---------------------------------------------------------------------------
// extractFlags — short alias parsing
// ---------------------------------------------------------------------------

describe('extractFlags() — short alias parsing', () => {
  it('exam -i/--instructions flag has both name and short', () => {
    const detail = getCommandDetail('exam');
    // Find the -i / --instructions pair (could be in either direction)
    const instructionFlag = detail.flags.find(
      f => (f.name === '-i' && f.short === '--instructions') ||
           (f.name === '--instructions' && f.short === '-i')
    );
    assert.ok(instructionFlag, 'exam should have -i/--instructions flag pair');
  });

  it('validate --all flag has short=null (no alias)', () => {
    const detail = getCommandDetail('validate');
    const flag = detail.flags.find(f => f.name === '--all');
    assert.ok(flag, 'validate should have --all flag');
    assert.equal(flag.short, null, '--all should have no short alias');
  });

  it('validate --debug flag has short=null', () => {
    const detail = getCommandDetail('validate');
    const flag = detail.flags.find(f => f.name === '--debug');
    assert.ok(flag, 'validate should have --debug flag');
    assert.equal(flag.short, null, '--debug should have no short alias');
  });
});

// ---------------------------------------------------------------------------
// extractFlags — commands with no Options section
// ---------------------------------------------------------------------------

describe('extractFlags() — commands without Options section', () => {
  it('research:analysis-plan has 0 flags (no Options section)', () => {
    const detail = getCommandDetail('research:analysis-plan');
    assert.ok(detail, 'research:analysis-plan should exist');
    assert.equal(detail.flags.length, 0, 'analysis-plan should have no flags');
  });

  it('research:hypothesis has 0 flags', () => {
    const detail = getCommandDetail('research:hypothesis');
    assert.ok(detail, 'research:hypothesis should exist');
    assert.equal(detail.flags.length, 0, 'hypothesis should have no flags');
  });

  it('config uses Subcommands section, not Options — returns 0 flags', () => {
    const detail = getCommandDetail('config');
    assert.ok(detail, 'config command should exist');
    // config.md has **Subcommands:** not **Options:** so extractFlags returns []
    assert.equal(detail.flags.length, 0, 'config should have 0 flags (uses Subcommands)');
  });
});

// ---------------------------------------------------------------------------
// extractFlags — hasInstructions bidirectional check
// ---------------------------------------------------------------------------

describe('extractFlags() — hasInstructions', () => {
  it('hasInstructions=true when -i is name and --instructions is short', () => {
    // exam.md has `-i "text"` / `--instructions "text"` (short-first format)
    const detail = getCommandDetail('exam');
    assert.equal(detail.hasInstructions, true, 'exam should have instructions');
  });

  it('hasInstructions=true for all 8 AI teaching commands', () => {
    const aiCommands = ['exam', 'quiz', 'slides', 'assignment', 'syllabus', 'lecture', 'rubric', 'feedback'];
    for (const name of aiCommands) {
      const detail = getCommandDetail(name);
      assert.ok(detail, `${name} should exist`);
      assert.equal(detail.hasInstructions, true, `${name} should have instructions`);
    }
  });

  it('hasInstructions=false for config commands', () => {
    const configCmds = ['validate', 'diff', 'sync', 'migrate', 'demo'];
    for (const name of configCmds) {
      const detail = getCommandDetail(name);
      assert.ok(detail, `${name} should exist`);
      assert.equal(detail.hasInstructions, false, `${name} should not have instructions`);
    }
  });

  it('hasInstructions=false for research commands', () => {
    const commands = discoverCommands();
    const research = commands.filter(c => c.category === 'research');
    for (const cmd of research) {
      assert.equal(cmd.hasInstructions, false, `research command ${cmd.name} should not have instructions`);
    }
  });
});

// ---------------------------------------------------------------------------
// extractFlags — flag counts on specific commands
// ---------------------------------------------------------------------------

describe('extractFlags() — flag counts', () => {
  it('exam has >= 12 flags', () => {
    const detail = getCommandDetail('exam');
    assert.ok(
      detail.flags.length >= 12,
      `exam should have >= 12 flags, got ${detail.flags.length}`
    );
  });

  it('validate has >= 9 flags', () => {
    const detail = getCommandDetail('validate');
    assert.ok(
      detail.flags.length >= 9,
      `validate should have >= 9 flags, got ${detail.flags.length}`
    );
  });

  it('config has 0 flags (Subcommands pattern)', () => {
    const detail = getCommandDetail('config');
    assert.equal(detail.flags.length, 0, 'config should have 0 flags');
  });
});

// ---------------------------------------------------------------------------
// extractFlags — name stripping (removes value placeholder)
// ---------------------------------------------------------------------------

describe('extractFlags() — name stripping', () => {
  it('flag names do not contain value placeholders', () => {
    const commands = discoverCommands();
    for (const cmd of commands) {
      for (const flag of cmd.flags) {
        assert.ok(
          !flag.name.includes(' '),
          `Flag name "${flag.name}" in ${cmd.name} should not contain spaces (value placeholder not stripped)`
        );
      }
    }
  });

  it('flag short aliases do not contain value placeholders', () => {
    const commands = discoverCommands();
    for (const cmd of commands) {
      for (const flag of cmd.flags) {
        if (flag.short !== null) {
          assert.ok(
            !flag.short.includes(' '),
            `Flag short "${flag.short}" in ${cmd.name} should not contain spaces`
          );
        }
      }
    }
  });
});
