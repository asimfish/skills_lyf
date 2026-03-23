/**
 * E2E tests for the Flag Discovery Pipeline
 *
 * Tests the complete flow: .md files → extractFlags() → cache v2 →
 * query helpers (getCommandDetail, getCategoryInfo) → correct flag data.
 *
 * Exercises cache invalidation, roundtrip consistency, and the
 * integration of flags into all query entry points.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
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

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const CACHE_FILE = join(PROJECT_ROOT, 'src', 'discovery', 'cache.json');

// ---------------------------------------------------------------------------
// Pipeline: discoverCommands → flags present
// ---------------------------------------------------------------------------

describe('E2E: discoverCommands → flags pipeline', () => {
  let commands;

  before(() => {
    commands = discoverCommands();
  });

  it('all 32 commands have flags array after discovery', () => {
    assert.equal(commands.length, 32);
    for (const cmd of commands) {
      assert.ok(Array.isArray(cmd.flags), `${cmd.name} missing flags array`);
    }
  });

  it('all 32 commands have hasInstructions boolean', () => {
    for (const cmd of commands) {
      assert.ok(
        typeof cmd.hasInstructions === 'boolean',
        `${cmd.name} missing hasInstructions boolean`
      );
    }
  });

  it('flags survive cache roundtrip', () => {
    // Clear cache first
    if (existsSync(CACHE_FILE)) {
      unlinkSync(CACHE_FILE);
    }

    // Load through cache (triggers regeneration)
    const cached = loadCachedCommands();

    // Compare flags from discovery vs cache
    for (let i = 0; i < commands.length; i++) {
      const disc = commands[i];
      const cach = cached[i];

      assert.equal(cach.name, disc.name, `Name mismatch at index ${i}`);
      assert.equal(cach.flags.length, disc.flags.length, `Flag count mismatch for ${disc.name}`);
      assert.equal(cach.hasInstructions, disc.hasInstructions, `hasInstructions mismatch for ${disc.name}`);

      // Deep compare each flag
      for (let j = 0; j < disc.flags.length; j++) {
        assert.deepEqual(
          cach.flags[j],
          disc.flags[j],
          `Flag ${j} mismatch for ${disc.name}`
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Pipeline: cache v2 format
// ---------------------------------------------------------------------------

describe('E2E: cache v2 format', () => {
  // Snapshot cache content once in before() to avoid races with other test
  // files that may delete/regenerate cache.json concurrently.
  let cacheData;

  before(() => {
    // Ensure cache exists and capture its content atomically.
    // Retry once if another test file races (deletes/rewrites cache mid-read).
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        loadCachedCommands();
        const raw = readFileSync(CACHE_FILE, 'utf-8');
        cacheData = JSON.parse(raw);
        break;
      } catch {
        if (attempt === 1) throw new Error('cache.json unreadable after retry');
      }
    }
  });

  it('cache.json has version=2', () => {
    assert.equal(cacheData.version, 2, 'cache version should be 2');
  });

  it('cache.json has fileCount matching actual .md file count', () => {
    assert.equal(cacheData.fileCount, 32, `fileCount should be 32, got ${cacheData.fileCount}`);
  });

  it('cache.json has commands array with 32 entries', () => {
    assert.ok(Array.isArray(cacheData.commands), 'commands should be an array');
    assert.equal(cacheData.commands.length, 32, `should have 32 commands, got ${cacheData.commands.length}`);
  });

  it('cached commands include flags and hasInstructions fields', () => {
    for (const cmd of cacheData.commands) {
      assert.ok('flags' in cmd, `cached ${cmd.name} should have flags`);
      assert.ok('hasInstructions' in cmd, `cached ${cmd.name} should have hasInstructions`);
    }
  });
});

// ---------------------------------------------------------------------------
// Pipeline: cache invalidation
// ---------------------------------------------------------------------------

describe('E2E: cache invalidation on version mismatch', () => {
  after(() => {
    // Restore valid cache so subsequent test files aren't poisoned
    if (existsSync(CACHE_FILE)) {
      unlinkSync(CACHE_FILE);
    }
    loadCachedCommands();
  });

  it('stale v1 cache is regenerated as v2', () => {
    // Write a fake v1 cache
    const staleCache = {
      version: 1,
      fileCount: 29,
      commands: [{ name: 'fake:command', flags: [] }],
    };
    writeFileSync(CACHE_FILE, JSON.stringify(staleCache), 'utf-8');

    // Load should detect version mismatch and regenerate
    const commands = loadCachedCommands();
    assert.equal(commands.length, 32, 'should regenerate with all 32 commands');

    // Verify cache was updated to v2
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    assert.equal(data.version, 2, 'regenerated cache should be v2');
  });

  it('corrupted cache is regenerated cleanly', () => {
    writeFileSync(CACHE_FILE, '{ invalid json!!!', 'utf-8');

    const commands = loadCachedCommands();
    assert.equal(commands.length, 32, 'should regenerate from corrupted cache');

    // Verify cache was rewritten correctly
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    assert.equal(data.version, 2);
  });
});

// ---------------------------------------------------------------------------
// Pipeline: getCommandDetail → flags
// ---------------------------------------------------------------------------

describe('E2E: getCommandDetail → flags', () => {
  it('getCommandDetail re-parses flags from .md source (not just cache)', () => {
    const detail = getCommandDetail('exam');
    assert.ok(detail, 'exam should be found');
    assert.ok(detail.flags.length > 0, 'exam detail should have flags');
    assert.ok(detail.hasInstructions === true, 'exam detail should have instructions');
  });

  it('getCommandDetail flags match discoverCommands flags for exam', () => {
    const commands = discoverCommands();
    const discovered = commands.find(c => c.file.endsWith('/exam.md'));
    const detail = getCommandDetail('exam');

    assert.equal(
      detail.flags.length,
      discovered.flags.length,
      'flag count should match between detail and discovery'
    );

    for (let i = 0; i < discovered.flags.length; i++) {
      assert.deepEqual(detail.flags[i], discovered.flags[i], `flag ${i} should match`);
    }
  });

  it('getCommandDetail returns flags for validate (config command)', () => {
    const detail = getCommandDetail('validate');
    assert.ok(detail, 'validate should be found');
    assert.ok(detail.flags.length > 0, 'validate should have flags');
    assert.equal(detail.hasInstructions, false, 'validate should not have instructions');
  });

  it('getCommandDetail returns 0 flags for research command without Options', () => {
    const detail = getCommandDetail('research:analysis-plan');
    assert.ok(detail, 'analysis-plan should be found');
    assert.equal(detail.flags.length, 0, 'analysis-plan should have no flags');
    assert.equal(detail.hasInstructions, false);
  });
});

// ---------------------------------------------------------------------------
// Pipeline: getCategoryInfo → flags integrated
// ---------------------------------------------------------------------------

describe('E2E: getCategoryInfo → flags in category data', () => {
  it('teaching content commands have flags in category info', () => {
    const info = getCategoryInfo('teaching');
    for (const cmd of info.content) {
      assert.ok(Array.isArray(cmd.flags), `${cmd.name} should have flags array in category info`);
      assert.ok(cmd.flags.length > 0, `${cmd.name} content command should have flags`);
    }
  });

  it('teaching assessment commands have flags with hasInstructions=true', () => {
    const info = getCategoryInfo('teaching');
    for (const cmd of info.assessment) {
      assert.ok(Array.isArray(cmd.flags), `${cmd.name} should have flags array`);
      assert.equal(cmd.hasInstructions, true, `${cmd.name} assessment command should have instructions`);
    }
  });

  it('teaching config commands have flags but hasInstructions=false', () => {
    const info = getCategoryInfo('teaching');
    for (const cmd of info.config) {
      assert.ok(Array.isArray(cmd.flags), `${cmd.name} should have flags array`);
      assert.equal(cmd.hasInstructions, false, `${cmd.name} config command should not have instructions`);
    }
  });

  it('research commands have flags arrays (may be empty)', () => {
    const info = getCategoryInfo('research');
    for (const subcat of Object.values(info)) {
      for (const cmd of subcat) {
        assert.ok(Array.isArray(cmd.flags), `${cmd.name} should have flags array`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Pipeline: getCommandStats unchanged by flags
// ---------------------------------------------------------------------------

describe('E2E: getCommandStats still works with flag-enhanced data', () => {
  it('returns correct counts: { research: 14, teaching: 18, total: 32 }', () => {
    const stats = getCommandStats();
    assert.deepEqual(stats, { research: 14, teaching: 18, total: 32 });
  });
});
