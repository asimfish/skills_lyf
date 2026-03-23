---
name: diff
description: Compare YAML source files with generated JSON to detect sync issues
---

# Diff YAML vs JSON

Compare YAML configuration files with their auto-generated JSON counterparts to detect synchronization issues.

**Usage:**
```
/teaching:diff <file> [options]
/teaching:diff --all [options]
```

**Examples:**
```
/teaching:diff content/lesson-plans/week03.yml
/teaching:diff --all
/teaching:diff --all --summary
/teaching:diff content/lesson-plans/week03.yml --force-sync
```

**Options:**
- `--all` - Compare all YAML/JSON pairs in standard locations
- `--summary` - Show only summary (no individual differences)
- `--verbose` - Show modification timestamps and additional details
- `--json` - Output results as JSON
- `--force-sync` - Auto-sync files that are out of sync
- `--quiet` - Only show out-of-sync files
- `--debug` - Enable debug logging

**Output Format:**

```
Comparing: content/lesson-plans/week03.yml ↔ week03.json

Status: ✗ Out of sync

  ~ learning_objectives[0].level:15: "understand" → "apply"
  + topics[3]:45: added in JSON → {"id": "T-3.4", "name": "Extra topic"}
  - materials.datasets[1]:62: missing in JSON ← {"name": "extra-data"}

───────────────────────────────────────────────────────
Summary: +1 added, -1 removed, ~1 changed (23ms)
Run /teaching:sync --force to resync
```

**Change Types:**

| Symbol | Type | Description |
|--------|------|-------------|
| `+` | added | Present in JSON but not in YAML |
| `-` | removed | Present in YAML but not in JSON |
| `~` | changed | Different values in YAML vs JSON |
| `!` | type-changed | Data type differs (e.g., array → object) |

<system>
This command compares YAML files with their generated JSON counterparts.

## Implementation

```javascript
import { ConfigDiffEngine, compareFile } from '../../../teaching/config/diff-engine.js';
import { ConfigSyncEngine } from '../../../teaching/config/sync-engine.js';
import { supportsColor } from '../../../teaching/formatters/error-formatter.js';
import { existsSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { promisify } from 'util';
import { glob } from 'glob';

// Parse user input
const args = parseArgs(userInput);

const cwd = process.cwd();
const diffAll = args.all || false;
const summaryOnly = args.summary || false;
const verbose = args.verbose || false;
const jsonOutput = args.json || false;
const forceSync = args['force-sync'] || false;
const quiet = args.quiet || false;
const debug = args.debug || process.env.SCHOLAR_DEBUG === 'true';
const specificFile = args._[0] || args.file || null;
const useColor = supportsColor() && !args['no-color'] && !jsonOutput;

// ANSI colors
const c = useColor ? {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m'
} : { reset: '', red: '', green: '', yellow: '', cyan: '', gray: '', bold: '' };

// Create engines
const diffEngine = new ConfigDiffEngine({ cwd, debug });
const syncEngine = forceSync ? new ConfigSyncEngine({ rootDir: cwd, debug }) : null;

// Build file list
let files = [];

if (specificFile) {
  const filePath = specificFile.startsWith('/') ? specificFile : join(cwd, specificFile);

  if (!existsSync(filePath)) {
    console.log(`${c.red}Error:${c.reset} File not found: ${specificFile}`);
    process.exit(1);
  }

  const stat = statSync(filePath);
  if (stat.isDirectory()) {
    const dirFiles = await glob('**/*.{yml,yaml}', { cwd: filePath, absolute: true });
    files = dirFiles.filter(f => !f.endsWith('.schema.yml'));
  } else {
    files = [filePath];
  }
} else if (diffAll) {
  const patterns = [
    'content/lesson-plans/**/*.yml',
    'content/lesson-plans/**/*.yaml',
    '.claude/**/*.yml',
    '.claude/**/*.yaml'
  ];

  for (const pattern of patterns) {
    const found = await glob(pattern, { cwd, absolute: true });
    files.push(...found.filter(f => !f.endsWith('.schema.yml')));
  }
} else {
  console.log(`${c.bold}Usage:${c.reset} /teaching:diff <file> [options]`);
  console.log(`       /teaching:diff --all [options]`);
  console.log(`\nOptions:`);
  console.log(`  --all          Compare all YAML/JSON pairs`);
  console.log(`  --summary      Show only summary`);
  console.log(`  --verbose      Show timestamps and details`);
  console.log(`  --force-sync   Auto-sync out-of-sync files`);
  console.log(`  --json         Output as JSON`);
  console.log(`  --quiet        Only show out-of-sync files`);
  process.exit(0);
}

if (files.length === 0) {
  console.log(`${c.yellow}No YAML files found to compare${c.reset}`);
  process.exit(0);
}

// Compare files
const startTime = Date.now();
const allResults = [];
let inSyncCount = 0;
let outOfSyncCount = 0;
let neverSyncedCount = 0;
let errorCount = 0;
let syncedCount = 0;

for (const file of files) {
  const result = diffEngine.compareFile(file);
  allResults.push(result);

  if (result.error) {
    errorCount++;
  } else if (result.status === 'never-synced') {
    neverSyncedCount++;
  } else if (result.inSync) {
    inSyncCount++;
  } else {
    outOfSyncCount++;
  }

  // Auto-sync if requested
  if (forceSync && !result.inSync && !result.error && syncEngine) {
    const syncResult = syncEngine.syncFile(file, { force: true });
    if (syncResult.success) {
      syncedCount++;
      result.synced = true;
    }
  }

  // Output (unless JSON mode)
  if (!jsonOutput) {
    const relativePath = relative(cwd, file);

    // Skip in-sync files in quiet mode
    if (quiet && result.inSync) {
      continue;
    }

    if (summaryOnly) {
      // Summary line only
      const icon = result.inSync
        ? `${c.green}✓${c.reset}`
        : result.status === 'never-synced'
          ? `${c.yellow}○${c.reset}`
          : `${c.red}✗${c.reset}`;

      const status = result.error
        ? `${c.red}error${c.reset}`
        : result.status === 'never-synced'
          ? `${c.yellow}never-synced${c.reset}`
          : result.inSync
            ? `${c.green}in-sync${c.reset}`
            : `${c.red}out-of-sync (${result.differences.length} changes)${c.reset}`;

      const synced = result.synced ? ` ${c.cyan}→ synced${c.reset}` : '';
      console.log(`${icon} ${relativePath}: ${status}${synced}`);
    } else {
      // Full output
      console.log(diffEngine.formatResult(result, { color: useColor, verbose }));

      if (result.synced) {
        console.log(`${c.cyan}✓ Auto-synced${c.reset}`);
      }

      console.log('');
    }
  }
}

const totalDuration = Date.now() - startTime;

// JSON output
if (jsonOutput) {
  const output = {
    summary: {
      files: files.length,
      inSync: inSyncCount,
      outOfSync: outOfSyncCount,
      neverSynced: neverSyncedCount,
      errors: errorCount,
      synced: syncedCount,
      duration: totalDuration
    },
    results: allResults.map(r => ({
      yamlPath: relative(cwd, r.yamlPath),
      jsonPath: relative(cwd, r.jsonPath),
      inSync: r.inSync,
      status: r.error ? 'error' : r.status || (r.inSync ? 'in-sync' : 'out-of-sync'),
      differences: r.differences,
      stats: r.stats,
      synced: r.synced || false,
      error: r.error
    }))
  };
  console.log(JSON.stringify(output, null, 2));
} else {
  // Final summary
  console.log(`${c.gray}═══════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bold}Summary:${c.reset} ${files.length} file(s) compared (${totalDuration}ms)`);
  console.log(`  ${c.green}✓${c.reset} In sync: ${inSyncCount}`);

  if (neverSyncedCount > 0) {
    console.log(`  ${c.yellow}○${c.reset} Never synced: ${neverSyncedCount}`);
  }

  if (outOfSyncCount > 0) {
    console.log(`  ${c.red}✗${c.reset} Out of sync: ${outOfSyncCount}`);
  }

  if (errorCount > 0) {
    console.log(`  ${c.red}!${c.reset} Errors: ${errorCount}`);
  }

  if (syncedCount > 0) {
    console.log(`  ${c.cyan}↻${c.reset} Auto-synced: ${syncedCount}`);
  }

  if (outOfSyncCount > 0 && !forceSync) {
    console.log(`\n${c.cyan}Run /teaching:diff --all --force-sync to auto-sync${c.reset}`);
  }
}

// Exit code
const exitCode = errorCount > 0 || outOfSyncCount > 0 ? 1 : 0;
process.exit(exitCode);

// Helper to parse command line arguments
function parseArgs(input) {
  const parts = input.split(/\s+/);
  const args = { _: [] };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith('--')) {
      const key = part.substring(2);
      const next = parts[i + 1];

      if (next && !next.startsWith('--') && !next.startsWith('/')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (!part.startsWith('/')) {
      args._.push(part);
    }
  }

  return args;
}
```

## Use Cases

### 1. Check Single File

```bash
/teaching:diff content/lesson-plans/week03.yml
```

Shows detailed comparison with line numbers for each difference.

### 2. Check All Files

```bash
/teaching:diff --all --summary
```

Quick overview of sync status across all files.

### 3. Auto-fix Sync Issues

```bash
/teaching:diff --all --force-sync
```

Automatically regenerate JSON for any out-of-sync files.

### 4. CI Integration

```bash
/teaching:diff --all --json
```

JSON output for automated checks in CI/CD pipelines.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All files in sync |
| 1 | Some files out of sync or errors |

## Related Commands

- `/teaching:sync` - Sync YAML to JSON
- `/teaching:validate` - Validate against schemas

## Troubleshooting

**"Never synced" status:**
Run `/teaching:sync` to generate the JSON file.

**"Type changed" errors:**
Usually indicates YAML was edited incorrectly. Check the YAML syntax at the reported line.

**Unexpected differences:**
YAML might have been edited without running sync. Use `--force-sync` to regenerate.
</system>
