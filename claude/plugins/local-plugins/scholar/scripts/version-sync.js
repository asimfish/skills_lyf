#!/usr/bin/env node

/**
 * Version Sync Script
 *
 * Syncs version strings across files that can't use MkDocs macros
 * (e.g., viewed raw on GitHub). Reads package.json as the authoritative
 * source and updates version references in README.md, CLAUDE.md,
 * plugin.json, tests/README.md, and mkdocs.yml.
 *
 * Usage:
 *   node scripts/version-sync.js                  # Sync version from package.json
 *   node scripts/version-sync.js --version 3.0.0  # Sync specific version
 *   node scripts/version-sync.js --tests 2500     # Also update test counts
 *   node scripts/version-sync.js --dry-run        # Preview changes without writing
 *
 * Exit codes:
 *   0 - Success
 *   1 - Errors occurred
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// ANSI colours
// ---------------------------------------------------------------------------
const C = {
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
  reset:  '\x1b[0m',
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function argValue(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const rootDir    = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Read authoritative version from package.json
// ---------------------------------------------------------------------------
const pkgPath = join(rootDir, 'package.json');
const pkg     = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const version = argValue('--version') || pkg.version;
const testCountRaw = argValue('--tests');
const testCount = testCountRaw ? Number(testCountRaw) : undefined;

// Read command count from mkdocs.yml (authoritative for macros-disabled doc files)
const mkdocsPath = join(rootDir, 'mkdocs.yml');
const mkdocsContent = existsSync(mkdocsPath) ? readFileSync(mkdocsPath, 'utf-8') : '';
const commandCountMatch = mkdocsContent.match(/command_count:\s*(\d+)/);
const commandCount = commandCountMatch ? Number(commandCountMatch[1]) : 28;

// Format number with commas (e.g. 2252 -> "2,252")
function formatCount(n) {
  return n.toLocaleString('en-US');
}

// Today's date in YYYY-MM-DD format
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------
let changeCount = 0;
let skipCount   = 0;
let errorCount  = 0;

function logChange(file, description, before, after) {
  changeCount++;
  console.log(`  ${C.green}CHANGE${C.reset} ${description}`);
  if (dryRun) {
    console.log(`         ${C.red}- ${before}${C.reset}`);
    console.log(`         ${C.green}+ ${after}${C.reset}`);
  }
}

function logSkip(file, reason) {
  skipCount++;
  console.log(`  ${C.yellow}SKIP${C.reset}   ${reason}`);
}

function logError(file, reason) {
  errorCount++;
  console.log(`  ${C.red}ERROR${C.reset}  ${reason}`);
}

// ---------------------------------------------------------------------------
// Generic regex-replace helper — applies all patterns and tracks changes
// ---------------------------------------------------------------------------
function applyReplacements(content, patterns, filePath) {
  let updated = content;
  for (const { regex, replacement, label } of patterns) {
    // Reset lastIndex for global regexes to ensure .test()/.match() start from 0
    if (regex.global) regex.lastIndex = 0;
    const match = updated.match(regex);
    if (match) {
      // For global regexes, match[0] is just the first match string;
      // use a non-global copy to get a proper before/after for logging
      const singleRegex = regex.global
        ? new RegExp(regex.source, regex.flags.replace('g', ''))
        : regex;
      const firstMatch = match[0];
      const after = firstMatch.replace(singleRegex, replacement);
      if (firstMatch !== after) {
        if (regex.global) regex.lastIndex = 0;
        updated = updated.replace(regex, replacement);
        logChange(filePath, label, firstMatch.trim(), after.trim());
      } else {
        logSkip(filePath, `${label} (already up to date)`);
      }
    } else {
      logSkip(filePath, `${label} (pattern not found)`);
    }
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Target file definitions
// ---------------------------------------------------------------------------

function syncReadme(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const patterns = [];

  // Badge: version-X.Y.Z-blue
  patterns.push({
    regex:       /(version-)\d+\.\d+\.\d+(-blue)/,
    replacement: `$1${version}$2`,
    label:       'Badge version',
  });

  // Badge: releases/tag/vX.Y.Z
  patterns.push({
    regex:       /(releases\/tag\/v)\d+\.\d+\.\d+/,
    replacement: `$1${version}`,
    label:       'Badge release URL',
  });

  // Badge: tests-NNNN%20passing
  if (testCount !== undefined) {
    patterns.push({
      regex:       /(tests-)\d[\d,]*(%20passing)/,
      replacement: `$1${testCount}$2`,
      label:       'Badge test count',
    });
  }

  // "**Latest version:** vX.Y.Z"
  patterns.push({
    regex:       /(\*\*Latest version:\*\* v)\d+\.\d+\.\d+/,
    replacement: `$1${version}`,
    label:       'Latest version text',
  });

  // Inline test counts: "2,252 tests" (in the latest version section)
  if (testCount !== undefined) {
    patterns.push({
      regex:       /(- )\d[\d,]* tests/,
      replacement: `$1${formatCount(testCount)} tests`,
      label:       'Inline test count',
    });
  }

  // Architecture section: "2,252 unit tests"
  if (testCount !== undefined) {
    patterns.push({
      regex:       /(\d[\d,]*) unit tests \(100% passing\)/,
      replacement: `${formatCount(testCount)} unit tests (100% passing)`,
      label:       'Architecture test count',
    });
  }

  // "v2.8.0 verified" in expected output
  patterns.push({
    regex:       /(- v)\d+\.\d+\.\d+( verified)/,
    replacement: `$1${version}$2`,
    label:       'Verification output version',
  });

  return applyReplacements(content, patterns, filePath);
}

function syncClaudeMd(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const patterns = [];

  // "Current State (vX.Y.Z"
  patterns.push({
    regex:       /(Current State \(v)\d+\.\d+\.\d+/,
    replacement: `$1${version}`,
    label:       'Current State version',
  });

  // Test counts: "2,252 tests"
  if (testCount !== undefined) {
    patterns.push({
      regex:       /(\*\*Tests:\*\* )\d[\d,]* tests/,
      replacement: `$1${formatCount(testCount)} tests`,
      label:       'Tests line count',
    });
  }

  // Test counts in Key Directories comment: "Jest, 2,024" -> update number
  if (testCount !== undefined) {
    // We don't update the Jest sub-count since we don't know the split
    // Only update the top-level test count reference
  }

  // Release URL
  patterns.push({
    regex:       /(releases\/tag\/v)\d+\.\d+\.\d+/,
    replacement: `$1${version}`,
    label:       'Release URL',
  });

  return applyReplacements(content, patterns, filePath);
}

function syncPluginJson(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let pluginData;
  try {
    pluginData = JSON.parse(content);
  } catch (e) {
    logError(filePath, `Failed to parse JSON: ${e.message}`);
    return content;
  }

  const before = pluginData.version;
  if (before === version) {
    logSkip(filePath, `version field (already ${version})`);
    return content;
  }

  pluginData.version = version;
  logChange(filePath, 'version field', `"version": "${before}"`, `"version": "${version}"`);
  return JSON.stringify(pluginData, null, 2) + '\n';
}

function syncTestsReadme(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  if (testCount === undefined) {
    logSkip(filePath, 'No --tests flag provided, skipping');
    return content;
  }

  const patterns = [];

  // "**Total:** 2,252 tests"
  patterns.push({
    regex:       /(\*\*Total:\*\* )\d[\d,]* tests/,
    replacement: `$1${formatCount(testCount)} tests`,
    label:       'Total test count',
  });

  // "2,252 unit tests"
  patterns.push({
    regex:       /\d[\d,]* unit tests/,
    replacement: `${formatCount(testCount)} unit tests`,
    label:       'Unit test count reference',
  });

  return applyReplacements(content, patterns, filePath);
}

function syncMkdocsYml(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const patterns = [];

  // version: "X.Y.Z" under extra.scholar
  patterns.push({
    regex:       /(version: ")\d+\.\d+\.\d+(")/,
    replacement: `$1${version}$2`,
    label:       'scholar.version',
  });

  // test_count: "X,XXX"
  if (testCount !== undefined) {
    patterns.push({
      regex:       /(test_count: ")\d[\d,]*(")/,
      replacement: `$1${formatCount(testCount)}$2`,
      label:       'scholar.test_count',
    });
  }

  // release_date: "YYYY-MM-DD"
  patterns.push({
    regex:       /(release_date: ")\d{4}-\d{2}-\d{2}(")/,
    replacement: `$1${todayISO()}$2`,
    label:       'scholar.release_date',
  });

  return applyReplacements(content, patterns, filePath);
}

// ---------------------------------------------------------------------------
// Doc files with render_macros: false (can't use MkDocs macros due to
// Jinja2 conflicts with {#id} anchors, {{Handlebars}}, or BibTeX syntax)
// ---------------------------------------------------------------------------

function syncDocFile(filePath, patterns) {
  const content = readFileSync(filePath, 'utf-8');
  return applyReplacements(content, patterns, filePath);
}

// Reusable pattern builders for doc files
const docPatterns = {
  // > **Version:** X.Y.Z or **Version:** X.Y.Z (footer)
  versionFooter: {
    regex:       /(\*\*Version:\*\* )\d+\.\d+\.\d+/g,
    replacement: `$1${version}`,
    label:       'Version footer',
  },
  // > Version: X.Y.Z (alt footer without bold)
  versionAltFooter: {
    regex:       /(> Version: )\d+\.\d+\.\d+/,
    replacement: `$1${version}`,
    label:       'Version alt footer',
  },
  // **Document Version:** X.Y.Z or **Document Version:** vX.Y.Z
  docVersionFooter: {
    regex:       /(\*\*Document Version:\*\* v?)\d+\.\d+\.\d+/,
    replacement: `$1${version}`,
    label:       'Document Version footer',
  },
  // Scholar vX.Y.Z (in titles, footers, inline refs)
  scholarVersion: {
    regex:       /(Scholar v)\d+\.\d+\.\d+/g,
    replacement: `$1${version}`,
    label:       'Scholar version ref',
  },
  // XX commands (command count)
  commandCount: {
    regex:       /(\ball )(\d+)( commands\b)/,
    replacement: `$1${commandCount}$3`,
    label:       'Command count',
  },
  // Should be X.Y.Z+ (troubleshooting expected output)
  shouldBeVersion: {
    regex:       /(Should be )\d+\.\d+\.\d+(\+)/,
    replacement: `$1${version}$2`,
    label:       'Expected version output',
  },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const targets = [
  { rel: 'README.md',                    sync: syncReadme     },
  { rel: 'CLAUDE.md',                    sync: syncClaudeMd   },
  { rel: '.claude-plugin/plugin.json',   sync: syncPluginJson },
  { rel: 'tests/README.md',             sync: syncTestsReadme },
  { rel: 'mkdocs.yml',                  sync: syncMkdocsYml  },

  // Doc files with render_macros: false
  // Source files with hardcoded version constants
  { rel: 'src/teaching/ai/prompt-config-bridge.js', sync: (f) => syncDocFile(f, [{
    regex:       /(const SCHOLAR_VERSION = ')\d+\.\d+\.\d+(')/,
    replacement: `$1${version}$2`,
    label:       'SCHOLAR_VERSION constant',
  }])},

  // Doc files with render_macros: false
  { rel: 'docs/API-REFERENCE.md', sync: (f) => syncDocFile(f, [
    docPatterns.versionFooter,
  ])},
  { rel: 'docs/TEACHING-WORKFLOWS.md', sync: (f) => syncDocFile(f, [
    docPatterns.versionFooter,
  ])},
  { rel: 'docs/help/FAQ-research.md', sync: (f) => syncDocFile(f, [
    docPatterns.commandCount,
  ])},
  { rel: 'docs/help/FAQ-teaching.md', sync: (f) => syncDocFile(f, [
    docPatterns.scholarVersion,
    docPatterns.commandCount,
  ])},
  { rel: 'docs/help/TROUBLESHOOTING-teaching.md', sync: (f) => syncDocFile(f, [
    docPatterns.versionAltFooter,
    docPatterns.scholarVersion,
    docPatterns.shouldBeVersion,
  ])},
  { rel: 'docs/workflows/research/latex-integration.md', sync: (f) => syncDocFile(f, [
    docPatterns.docVersionFooter,
  ])},
  { rel: 'docs/workflows/research/literature-review.md', sync: (f) => syncDocFile(f, [
    docPatterns.docVersionFooter,
  ])},
  { rel: 'docs/workflows/research/manuscript-writing.md', sync: (f) => syncDocFile(f, [
    docPatterns.docVersionFooter,
  ])},
];

console.log(`\n${C.bold}Scholar Version Sync${C.reset}`);
console.log(`${C.dim}──────────────────────────────────────${C.reset}`);
console.log(`  Version:    ${C.cyan}${version}${C.reset}`);
if (testCount !== undefined) {
  console.log(`  Tests:      ${C.cyan}${formatCount(testCount)}${C.reset}`);
}
if (dryRun) {
  console.log(`  Mode:       ${C.yellow}DRY RUN${C.reset}`);
}
console.log(`${C.dim}──────────────────────────────────────${C.reset}\n`);

for (const { rel, sync } of targets) {
  const filePath = join(rootDir, rel);
  console.log(`${C.bold}${rel}${C.reset}`);

  if (!existsSync(filePath)) {
    logSkip(filePath, 'File not found');
    console.log();
    continue;
  }

  try {
    const updated = sync(filePath);
    const original = readFileSync(filePath, 'utf-8');

    if (updated !== original && !dryRun) {
      writeFileSync(filePath, updated, 'utf-8');
    }
  } catch (e) {
    logError(rel, e.message);
  }

  console.log();
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`${C.dim}──────────────────────────────────────${C.reset}`);
console.log(
  `  ${C.green}${changeCount} change${changeCount !== 1 ? 's' : ''}${C.reset}` +
  `  ${C.yellow}${skipCount} skip${skipCount !== 1 ? 's' : ''}${C.reset}` +
  `  ${C.red}${errorCount} error${errorCount !== 1 ? 's' : ''}${C.reset}`
);

if (dryRun && changeCount > 0) {
  console.log(`\n  ${C.yellow}Run without --dry-run to apply changes.${C.reset}`);
}
console.log();

process.exit(errorCount > 0 ? 1 : 0);
