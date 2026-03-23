/**
 * Tests for the Discovery Engine
 *
 * Verifies command scanning, caching, stats, category grouping,
 * and detail lookup from src/discovery/index.js.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

import {
  discoverCommands,
  loadCachedCommands,
  getCommandStats,
  getCategoryInfo,
  getCommandDetail,
} from '../../src/discovery/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve project root (two levels up from tests/discovery/) */
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const CACHE_FILE = join(PROJECT_ROOT, 'src', 'discovery', 'cache.json');

// ---------------------------------------------------------------------------
// discoverCommands()
// ---------------------------------------------------------------------------

describe('discoverCommands()', () => {
  let commands;

  before(() => {
    commands = discoverCommands();
  });

  it('returns an array', () => {
    assert.ok(Array.isArray(commands), 'Expected an array of commands');
  });

  it('finds exactly 32 commands', () => {
    assert.equal(commands.length, 32, `Expected 32 commands, got ${commands.length}`);
  });

  it('each command has required fields: name, description, category, subcategory, directory, file', () => {
    const requiredFields = ['name', 'description', 'category', 'subcategory', 'directory', 'file'];
    for (const cmd of commands) {
      for (const field of requiredFields) {
        assert.ok(
          field in cmd,
          `Command "${cmd.name || '(unnamed)'}" is missing field "${field}"`
        );
      }
    }
  });

  it('all 14 research commands are present', () => {
    const research = commands.filter(c => c.category === 'research');
    assert.equal(research.length, 14, `Expected 14 research commands, got ${research.length}`);
  });

  it('all 18 teaching commands are present', () => {
    const teaching = commands.filter(c => c.category === 'teaching');
    assert.equal(teaching.length, 18, `Expected 18 teaching commands, got ${teaching.length}`);
  });

  it('derives category "teaching" from the teaching directory', () => {
    const teachingCmds = commands.filter(c => c.directory === 'teaching');
    for (const cmd of teachingCmds) {
      assert.equal(cmd.category, 'teaching', `Command "${cmd.name}" in teaching dir should be category "teaching"`);
    }
  });

  it('derives category "research" from non-teaching directories', () => {
    const nonTeaching = commands.filter(c => c.directory !== 'teaching');
    for (const cmd of nonTeaching) {
      assert.equal(cmd.category, 'research', `Command "${cmd.name}" in "${cmd.directory}" dir should be category "research"`);
    }
  });

  it('maps research directories to correct subcategories', () => {
    const expected = {
      research: 'planning',
      manuscript: 'manuscript',
      literature: 'literature',
      simulation: 'simulation',
    };
    const researchCmds = commands.filter(c => c.category === 'research');
    for (const cmd of researchCmds) {
      const expectedSubcat = expected[cmd.directory];
      assert.ok(expectedSubcat, `Unknown research directory "${cmd.directory}" for command "${cmd.name}"`);
      assert.equal(
        cmd.subcategory,
        expectedSubcat,
        `Command "${cmd.name}" in "${cmd.directory}" should have subcategory "${expectedSubcat}", got "${cmd.subcategory}"`
      );
    }
  });

  it('maps teaching commands to correct subcategories', () => {
    const contentCmds = ['exam', 'quiz', 'slides', 'assignment', 'syllabus', 'lecture', 'solution', 'validate-r', 'canvas'];
    const assessmentCmds = ['rubric', 'feedback'];
    const configCmds = ['validate', 'diff', 'sync', 'migrate', 'demo', 'config', 'preflight'];

    const teachingCmds = commands.filter(c => c.category === 'teaching');

    for (const cmd of teachingCmds) {
      // Extract base name from the file path (last segment without .md)
      const baseName = cmd.file.split('/').pop().replace('.md', '');

      if (contentCmds.includes(baseName)) {
        assert.equal(cmd.subcategory, 'content', `Teaching command "${cmd.name}" (${baseName}) should be subcategory "content"`);
      } else if (assessmentCmds.includes(baseName)) {
        assert.equal(cmd.subcategory, 'assessment', `Teaching command "${cmd.name}" (${baseName}) should be subcategory "assessment"`);
      } else if (configCmds.includes(baseName)) {
        assert.equal(cmd.subcategory, 'config', `Teaching command "${cmd.name}" (${baseName}) should be subcategory "config"`);
      } else {
        assert.fail(`Teaching command "${cmd.name}" (${baseName}) has unexpected subcategory "${cmd.subcategory}"`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// loadCachedCommands()
// ---------------------------------------------------------------------------

describe('loadCachedCommands()', () => {
  before(() => {
    // Remove existing cache to test fresh generation
    if (existsSync(CACHE_FILE)) {
      unlinkSync(CACHE_FILE);
    }
  });

  it('returns same data as discoverCommands()', () => {
    const discovered = discoverCommands();
    const cached = loadCachedCommands();

    assert.equal(cached.length, discovered.length, 'Cached and discovered command counts should match');
    for (let i = 0; i < discovered.length; i++) {
      assert.equal(cached[i].name, discovered[i].name, `Command name at index ${i} should match`);
      assert.equal(cached[i].category, discovered[i].category, `Category at index ${i} should match`);
    }
  });

  it('creates cache.json file after first call', () => {
    // loadCachedCommands was already called in the previous test
    // Ensure cache was written
    loadCachedCommands();
    assert.ok(existsSync(CACHE_FILE), 'cache.json should exist after loadCachedCommands()');
  });

  it('returns cached data on subsequent calls (cache file exists)', () => {
    assert.ok(existsSync(CACHE_FILE), 'cache.json should exist before second call');

    const result = loadCachedCommands();
    assert.ok(Array.isArray(result), 'Should return an array from cache');
    assert.equal(result.length, 32, 'Should have 32 commands from cache');
  });
});

// ---------------------------------------------------------------------------
// getCommandStats()
// ---------------------------------------------------------------------------

describe('getCommandStats()', () => {
  it('returns { research: 14, teaching: 18, total: 32 }', () => {
    const stats = getCommandStats();
    assert.deepEqual(stats, { research: 14, teaching: 18, total: 32 });
  });
});

// ---------------------------------------------------------------------------
// getCategoryInfo()
// ---------------------------------------------------------------------------

describe('getCategoryInfo()', () => {
  describe('research category', () => {
    let info;

    before(() => {
      info = getCategoryInfo('research');
    });

    it('groups into 4 subcategories: planning, manuscript, literature, simulation', () => {
      const subcategories = Object.keys(info).sort();
      assert.deepEqual(subcategories, ['literature', 'manuscript', 'planning', 'simulation']);
    });

    it('planning has 4 commands', () => {
      assert.equal(info.planning.length, 4, `Expected 4 planning commands, got ${info.planning.length}`);
    });

    it('manuscript has 4 commands', () => {
      assert.equal(info.manuscript.length, 4, `Expected 4 manuscript commands, got ${info.manuscript.length}`);
    });

    it('literature has 4 commands', () => {
      assert.equal(info.literature.length, 4, `Expected 4 literature commands, got ${info.literature.length}`);
    });

    it('simulation has 2 commands', () => {
      assert.equal(info.simulation.length, 2, `Expected 2 simulation commands, got ${info.simulation.length}`);
    });
  });

  describe('teaching category', () => {
    let info;

    before(() => {
      info = getCategoryInfo('teaching');
    });

    it('groups into 3 subcategories: assessment, config, content', () => {
      const subcategories = Object.keys(info).sort();
      assert.deepEqual(subcategories, ['assessment', 'config', 'content']);
    });

    it('content has 9 commands', () => {
      assert.equal(info.content.length, 9, `Expected 9 content commands, got ${info.content.length}`);
    });

    it('assessment has 2 commands', () => {
      assert.equal(info.assessment.length, 2, `Expected 2 assessment commands, got ${info.assessment.length}`);
    });

    it('config has 7 commands', () => {
      assert.equal(info.config.length, 7, `Expected 7 config commands, got ${info.config.length}`);
    });
  });
});

// ---------------------------------------------------------------------------
// getCommandDetail()
// ---------------------------------------------------------------------------

describe('getCommandDetail()', () => {
  it('finds command by full name: "research:analysis-plan"', () => {
    const detail = getCommandDetail('research:analysis-plan');
    assert.ok(detail, 'Should find research:analysis-plan');
    assert.equal(detail.name, 'research:analysis-plan');
    assert.equal(detail.category, 'research');
  });

  it('finds command by base name: "exam"', () => {
    const detail = getCommandDetail('exam');
    assert.ok(detail, 'Should find exam command by base name');
    assert.equal(detail.category, 'teaching');
    assert.equal(detail.subcategory, 'content');
  });

  it('finds command by partial name: "bib:search"', () => {
    const detail = getCommandDetail('bib:search');
    assert.ok(detail, 'Should find bib:search by partial match');
    assert.equal(detail.category, 'research');
    assert.equal(detail.subcategory, 'literature');
  });

  it('returns null for nonexistent command', () => {
    const detail = getCommandDetail('nonexistent-command-xyz');
    assert.equal(detail, null, 'Should return null for unknown command');
  });

  it('returns usage for known commands', () => {
    const detail = getCommandDetail('research:analysis-plan');
    assert.ok(detail, 'Should find the command');
    assert.ok(typeof detail.usage === 'string', 'usage should be a string');
    assert.ok(detail.usage.length > 0, 'usage should be non-empty');
  });

  it('returns examples array for known commands', () => {
    const detail = getCommandDetail('research:analysis-plan');
    assert.ok(detail, 'Should find the command');
    assert.ok(Array.isArray(detail.examples), 'examples should be an array');
    assert.ok(detail.examples.length > 0, 'examples should be non-empty');
  });
});

// ---------------------------------------------------------------------------
// flag extraction
// ---------------------------------------------------------------------------

describe('flag extraction', () => {
  let commands;

  /** Find a teaching command by its base filename (e.g. 'exam', 'validate'). */
  function findTeaching(baseName) {
    return commands.find(
      c => c.category === 'teaching' && c.file.endsWith(`/${baseName}.md`)
    );
  }

  before(() => {
    commands = discoverCommands();
  });

  it('exam has hasInstructions === true', () => {
    const cmd = findTeaching('exam');
    assert.ok(cmd, 'exam command should exist');
    assert.equal(cmd.hasInstructions, true);
  });

  it('validate has hasInstructions === false', () => {
    const cmd = findTeaching('validate');
    assert.ok(cmd, 'validate command should exist');
    assert.equal(cmd.hasInstructions, false);
  });

  it('all commands have flags array', () => {
    for (const cmd of commands) {
      assert.ok(Array.isArray(cmd.flags), `${cmd.name} should have flags array`);
    }
  });

  it('flag objects have name, short, description, takesValue', () => {
    const exam = findTeaching('exam');
    assert.ok(exam.flags.length > 0, 'exam should have flags');
    const flag = exam.flags[0];
    assert.ok('name' in flag, 'flag should have name');
    assert.ok('short' in flag, 'flag should have short (can be null)');
    assert.ok('description' in flag, 'flag should have description');
    assert.ok('takesValue' in flag, 'flag should have takesValue');
  });

  it('content commands with Options section have -i flag', () => {
    // These content commands have an **Options:** section with -i flag
    const contentWithOptions = ['exam', 'quiz', 'slides', 'assignment', 'syllabus'];
    for (const baseName of contentWithOptions) {
      const cmd = findTeaching(baseName);
      assert.ok(cmd, `${baseName} command should exist`);
      assert.equal(cmd.hasInstructions, true, `${baseName} should have instructions`);
    }
  });

  it('assessment commands have -i flag', () => {
    const assessCmds = ['rubric', 'feedback'];
    for (const baseName of assessCmds) {
      const cmd = findTeaching(baseName);
      assert.ok(cmd, `${baseName} command should exist`);
      assert.equal(cmd.hasInstructions, true, `${baseName} should have instructions`);
    }
  });

  it('config commands do not have -i flag', () => {
    const configCmds = ['validate', 'diff', 'sync', 'migrate', 'demo', 'preflight'];
    for (const baseName of configCmds) {
      const cmd = findTeaching(baseName);
      assert.ok(cmd, `${baseName} command should exist`);
      assert.equal(cmd.hasInstructions, false, `${baseName} should not have instructions`);
    }
  });

  it('exam flags include --questions and --difficulty', () => {
    const exam = findTeaching('exam');
    const flagNames = exam.flags.map(f => f.name);
    assert.ok(flagNames.includes('--questions'), 'should have --questions');
    assert.ok(flagNames.includes('--difficulty'), 'should have --difficulty');
  });

  it('exam has at least 8 flags', () => {
    const exam = findTeaching('exam');
    assert.ok(exam.flags.length >= 8, `exam should have >= 8 flags, got ${exam.flags.length}`);
  });

  it('all 18 teaching commands have flags', () => {
    const teachingCmds = commands.filter(c => c.category === 'teaching');
    assert.equal(teachingCmds.length, 18);
    for (const cmd of teachingCmds) {
      assert.ok(Array.isArray(cmd.flags), `${cmd.name} should have flags array`);
    }
  });
});
