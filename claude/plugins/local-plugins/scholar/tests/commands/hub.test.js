/**
 * Tests for the Hub Command
 *
 * Verifies that hub.md exists with correct frontmatter and is
 * discoverable by the discovery engine.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const COMMANDS_DIR = join(PROJECT_ROOT, 'src', 'plugin-api', 'commands');

/**
 * Search for hub.md in the commands directory tree.
 * It could be at the root of commands/ or inside a subdirectory.
 *
 * @returns {string|null} Absolute path to hub.md if found.
 */
function findHubMd() {
  // Check root of commands dir
  const rootPath = join(COMMANDS_DIR, 'hub.md');
  if (existsSync(rootPath)) {
    return rootPath;
  }

  // Check all subdirectories
  if (!existsSync(COMMANDS_DIR)) return null;

  const entries = readdirSync(COMMANDS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = join(COMMANDS_DIR, entry.name, 'hub.md');
      if (existsSync(subPath)) {
        return subPath;
      }
    }
  }

  return null;
}

/**
 * Parse YAML frontmatter from a markdown file.
 *
 * @param {string} content - Raw file content.
 * @returns {object} Parsed frontmatter, or empty object.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return yaml.load(match[1]) || {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('hub command', () => {
  const hubPath = findHubMd();

  it('hub.md exists in the commands directory', () => {
    assert.ok(hubPath !== null, 'hub.md should exist somewhere under src/plugin-api/commands/');
    assert.ok(existsSync(hubPath), `hub.md should exist at: ${hubPath}`);
  });

  it('hub.md has valid YAML frontmatter with name field', () => {
    if (!hubPath) {
      // Skip if hub.md doesn't exist yet -- test will be validated once created
      assert.ok(true, 'Skipped: hub.md not yet created');
      return;
    }

    const content = readFileSync(hubPath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    assert.ok(frontmatter.name, 'Frontmatter should have a "name" field');
    assert.ok(
      frontmatter.name.includes('hub'),
      `Frontmatter name should contain "hub", got: "${frontmatter.name}"`
    );
  });

  it('hub.md has a non-empty description', () => {
    if (!hubPath) {
      assert.ok(true, 'Skipped: hub.md not yet created');
      return;
    }

    const content = readFileSync(hubPath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    assert.ok(frontmatter.description, 'Frontmatter should have a "description" field');
    assert.ok(
      typeof frontmatter.description === 'string' && frontmatter.description.length > 0,
      'Description should be a non-empty string'
    );
  });

  it('hub.md frontmatter name is "hub" or contains "hub"', () => {
    if (!hubPath) {
      assert.ok(true, 'Skipped: hub.md not yet created');
      return;
    }

    const content = readFileSync(hubPath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    // The name could be 'hub', 'scholar:hub', etc.
    assert.ok(
      typeof frontmatter.name === 'string',
      'Frontmatter name should be a string'
    );
    assert.match(
      frontmatter.name,
      /hub/,
      `Expected name to match /hub/, got: "${frontmatter.name}"`
    );
  });
});

// ---------------------------------------------------------------------------
// hub flag rendering spec
// ---------------------------------------------------------------------------

describe('hub flag rendering spec', () => {
  const hubPath = findHubMd();

  it('hub.md mentions [AI] marker', () => {
    if (!hubPath) { assert.ok(true, 'Skipped'); return; }
    const content = readFileSync(hubPath, 'utf-8');
    assert.ok(content.includes('[AI]'), 'hub.md should specify [AI] markers');
  });

  it('hub.md mentions Options display', () => {
    if (!hubPath) { assert.ok(true, 'Skipped'); return; }
    const content = readFileSync(hubPath, 'utf-8');
    assert.ok(content.includes('Options'), 'hub.md should specify Options display');
  });

  it('hub.md mentions flag count', () => {
    if (!hubPath) { assert.ok(true, 'Skipped'); return; }
    const content = readFileSync(hubPath, 'utf-8');
    assert.ok(content.includes('options') || content.includes('flags'), 'hub.md should mention options/flags');
  });
});
