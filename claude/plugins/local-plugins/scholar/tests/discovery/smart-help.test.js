/**
 * Tests for the Smart Help Engine
 *
 * Verifies context detection, command suggestions, and auto-tips
 * from src/discovery/smart-help.js.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  detectContext,
  getSuggestions,
  getAutoTip,
} from '../../src/discovery/smart-help.js';

// ---------------------------------------------------------------------------
// detectContext()
// ---------------------------------------------------------------------------

describe('detectContext()', () => {
  it('returns "mixed" for empty/null cwd', () => {
    assert.equal(detectContext(null), 'mixed');
    assert.equal(detectContext(''), 'mixed');
    assert.equal(detectContext(undefined), 'mixed');
  });

  it('returns "mixed" for a directory with no signals', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'scholar-ctx-empty-'));
    try {
      const result = detectContext(tmpDir);
      assert.equal(result, 'mixed', 'Empty directory should return mixed');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('teaching context', () => {
    let tmpDir;

    before(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'scholar-ctx-teach-'));
      // Create strong teaching signal: .flow/teach-config.yml (weight 3)
      const flowDir = join(tmpDir, '.flow');
      mkdirSync(flowDir, { recursive: true });
      writeFileSync(join(flowDir, 'teach-config.yml'), 'scholar:\n  course_info:\n    level: undergraduate\n');
    });

    after(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns "teaching" when teaching signals dominate', () => {
      const result = detectContext(tmpDir);
      assert.equal(result, 'teaching', 'Directory with teach-config.yml should be teaching');
    });
  });

  describe('research context', () => {
    let tmpDir;

    before(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'scholar-ctx-research-'));
      // Create strong research signal: manuscript/ directory (weight 3)
      mkdirSync(join(tmpDir, 'manuscript'), { recursive: true });
    });

    after(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns "research" when research signals dominate', () => {
      const result = detectContext(tmpDir);
      assert.equal(result, 'research', 'Directory with manuscript/ should be research');
    });
  });

  describe('mixed context (equal signals)', () => {
    let tmpDir;

    before(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'scholar-ctx-mixed-'));
      // Create equal-weight signals for both contexts
      // Teaching: content/lesson-plans dir (weight 2)
      mkdirSync(join(tmpDir, 'content', 'lesson-plans'), { recursive: true });
      // Research: simulation dir (weight 2)
      mkdirSync(join(tmpDir, 'simulation'), { recursive: true });
    });

    after(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns "mixed" when signals are equal', () => {
      const result = detectContext(tmpDir);
      assert.equal(result, 'mixed', 'Equal signals should return mixed');
    });
  });

  it('returns "mixed" for nonexistent directory', () => {
    const result = detectContext('/tmp/nonexistent-dir-scholar-test-xyz');
    assert.equal(result, 'mixed', 'Nonexistent directory should return mixed');
  });
});

// ---------------------------------------------------------------------------
// getSuggestions()
// ---------------------------------------------------------------------------

describe('getSuggestions()', () => {
  it('returns 5 commands for "research" context', () => {
    const suggestions = getSuggestions('research');
    assert.equal(suggestions.length, 5, `Expected 5 research suggestions, got ${suggestions.length}`);
  });

  it('returns 5 commands for "teaching" context', () => {
    const suggestions = getSuggestions('teaching');
    assert.equal(suggestions.length, 5, `Expected 5 teaching suggestions, got ${suggestions.length}`);
  });

  it('returns 1 command (hub) for "mixed" context', () => {
    const suggestions = getSuggestions('mixed');
    assert.equal(suggestions.length, 1, `Expected 1 mixed suggestion, got ${suggestions.length}`);
    assert.ok(suggestions[0].command.includes('hub'), 'Mixed suggestion should be the hub command');
  });

  it('each suggestion has command and description fields', () => {
    for (const context of ['research', 'teaching', 'mixed']) {
      const suggestions = getSuggestions(context);
      for (const suggestion of suggestions) {
        assert.ok(
          typeof suggestion.command === 'string' && suggestion.command.length > 0,
          `Suggestion in "${context}" context should have non-empty command`
        );
        assert.ok(
          typeof suggestion.description === 'string' && suggestion.description.length > 0,
          `Suggestion in "${context}" context should have non-empty description`
        );
      }
    }
  });

  it('falls back to mixed suggestions for unknown context', () => {
    const suggestions = getSuggestions('unknown');
    assert.equal(suggestions.length, 1, 'Unknown context should fall back to mixed');
    assert.ok(suggestions[0].command.includes('hub'), 'Fallback should be the hub command');
  });
});

// ---------------------------------------------------------------------------
// getAutoTip()
// ---------------------------------------------------------------------------

describe('getAutoTip()', () => {
  it('returns string containing "research" for research context', () => {
    const tip = getAutoTip('research');
    assert.ok(typeof tip === 'string', 'Tip should be a string');
    assert.ok(tip.includes('research'), `Research tip should contain "research", got: "${tip}"`);
  });

  it('returns string containing "teaching" for teaching context', () => {
    const tip = getAutoTip('teaching');
    assert.ok(typeof tip === 'string', 'Tip should be a string');
    assert.ok(tip.includes('teaching'), `Teaching tip should contain "teaching", got: "${tip}"`);
  });

  it('returns string containing "/scholar:hub" for mixed context', () => {
    const tip = getAutoTip('mixed');
    assert.ok(typeof tip === 'string', 'Tip should be a string');
    assert.ok(tip.includes('/scholar:hub'), `Mixed tip should contain "/scholar:hub", got: "${tip}"`);
  });

  it('all tips mention /scholar:hub', () => {
    for (const context of ['research', 'teaching', 'mixed']) {
      const tip = getAutoTip(context);
      assert.ok(
        tip.includes('/scholar:hub') || tip.includes('scholar:hub'),
        `Tip for "${context}" should reference scholar:hub`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// teaching tips
// ---------------------------------------------------------------------------

describe('teaching tips', () => {
  it('teaching auto-tip mentions -i flag', () => {
    const tip = getAutoTip('teaching');
    assert.ok(tip.includes('-i'), 'teaching tip should mention -i flag');
  });

  it('teaching suggestions have tip property', () => {
    const suggestions = getSuggestions('teaching');
    for (const s of suggestions) {
      assert.ok('tip' in s, `suggestion for ${s.command} should have tip`);
    }
  });
});
