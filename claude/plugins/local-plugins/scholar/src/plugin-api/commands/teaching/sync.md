---
name: sync
description: Sync YAML configuration files to JSON, or bidirectional sync of lesson-plans manifests
---

# Sync Configuration Files

Synchronize YAML configuration files to JSON format, or perform bidirectional sync of `.flow/lesson-plans.yml` manifests between Scholar and flow-cli.

**Usage:**
```
/teaching:sync [options]
```

**Examples:**
```
/teaching:sync                              # Sync changed files only
/teaching:sync --all                        # Sync all files (ignore cache)
/teaching:sync --file content/lesson-plans/week03.yml
/teaching:sync --status                     # Show sync status
/teaching:sync --dry-run                    # Preview without writing
/teaching:sync --manifest                   # Bidirectional manifest sync
/teaching:sync --manifest --dry-run         # Preview manifest merge
/teaching:sync --manifest --strategy theirs # Resolve conflicts with flow-cli's version
```

**Options:**
- `--all` - Sync all files, ignoring cache (forces resync)
- `--file <path>` - Sync specific file only
- `--status` - Show sync status for all files
- `--dry-run` - Preview what would be synced without writing
- `--force` - Force sync even if file unchanged (alias for --all with single file)
- `--manifest` - Bidirectional sync of `.flow/lesson-plans.yml` with flow-cli
- `--theirs <path>` - Path to flow-cli's manifest (default: `.flow/lesson-plans-flow.yml`)
- `--strategy <ours|theirs>` - Conflict resolution strategy (default: `ours`)
- `--quiet` - Suppress output except errors
- `--debug` - Enable debug logging

**YAML → JSON Sync (default):**
- Hash-based change detection skips unchanged files
- <100ms sync latency per file
- Creates JSON adjacent to YAML (e.g., `week03.yml` → `week03.json`)
- Pre-commit hook available via `scripts/sync-yaml.js`

**Manifest Sync (`--manifest`):**
- Three-way merge using stored base hash for conflict detection
- Week-level atomic merge (each week is an independent unit)
- Non-conflicting changes auto-merged (e.g., Scholar edits week 3, flow-cli edits week 5)
- Conflicting changes resolved by strategy (`ours` default, or `theirs`)
- Semester metadata uses last-writer-wins
- Backup created before writing merged result

**Directories Monitored:**
- `content/lesson-plans/**/*.yml` - Lesson plan configurations
- `.claude/**/*.yml` - Teaching style and local configs
- `.flow/lesson-plans.yml` - Manifest (with `--manifest`)

<system>
This command wraps the sync engine for YAML → JSON synchronization, and ManifestSyncEngine for bidirectional manifest sync.

## Implementation

```javascript
import { ConfigSyncEngine } from '../../../teaching/config/sync-engine.js';
import { ManifestSyncEngine } from '../../../teaching/config/manifest-sync.js';
import { formatErrors, formatSummary, formatProgress, supportsColor } from '../../../teaching/formatters/error-formatter.js';
import { formatDryRunReport, formatFileDiff } from '../../../teaching/formatters/diff-formatter.js';
import { existsSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { promisify } from 'util';
import { glob } from 'glob';
import yaml from 'js-yaml';

// Parse user input
const args = parseArgs(userInput);

const cwd = process.cwd();
const showStatus = args.status || false;
const syncAll = args.all || false;
const forceSync = args.force || false;
const dryRun = args['dry-run'] || false;
const quiet = args.quiet || false;
const debug = args.debug || process.env.SCHOLAR_DEBUG === 'true';
const specificFile = args.file || null;
const manifestMode = args.manifest || false;
const conflictStrategy = args.strategy || 'ours';
const theirsPath = args.theirs || null;
const useColor = supportsColor() && !args['no-color'];

// Initialize sync engine
const engine = new ConfigSyncEngine({
  rootDir: cwd,
  debug,
  dryRun
});

// Build glob patterns
const patterns = [];
if (existsSync(join(cwd, 'content', 'lesson-plans'))) {
  patterns.push('content/lesson-plans/**/*.yml');
  patterns.push('content/lesson-plans/**/*.yaml');
}
if (existsSync(join(cwd, '.claude'))) {
  patterns.push('.claude/**/*.yml');
  patterns.push('.claude/**/*.yaml');
}

// ANSI colors
const c = useColor ? {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m'
} : { reset: '', red: '', green: '', yellow: '', cyan: '', gray: '', bold: '' };

// === MANIFEST SYNC MODE ===
if (manifestMode) {
  const engine = new ManifestSyncEngine({ courseRoot: cwd, debug, dryRun });

  const oursPath = join(cwd, '.flow', 'lesson-plans.yml');
  const resolvedTheirsPath = theirsPath
    ? (theirsPath.startsWith('/') ? theirsPath : join(cwd, theirsPath))
    : join(cwd, '.flow', 'lesson-plans-flow.yml');

  // Check files exist
  if (!existsSync(oursPath)) {
    console.log(`${c.red}Error:${c.reset} Manifest not found: .flow/lesson-plans.yml`);
    console.log(`\nCreate one with: ${c.cyan}/teaching:migrate --to-manifest${c.reset}`);
    process.exit(1);
  }
  if (!existsSync(resolvedTheirsPath)) {
    console.log(`${c.yellow}No external manifest found:${c.reset} ${relative(cwd, resolvedTheirsPath)}`);
    console.log(`\nManifest sync requires two manifests to compare.`);
    console.log(`Use ${c.cyan}--theirs <path>${c.reset} to specify flow-cli's manifest.`);
    process.exit(0);
  }

  // Load both sides
  const pair = engine.loadSyncPair(oursPath, resolvedTheirsPath);

  if (pair.errors.length > 0) {
    for (const err of pair.errors) {
      console.log(`${c.red}✗${c.reset} ${err}`);
    }
    process.exit(1);
  }

  if (pair.identical) {
    console.log(`${c.green}✓${c.reset} Manifests are identical — nothing to sync`);
    process.exit(0);
  }

  // Load base for three-way diff
  const storedBaseHash = engine.getBaseHash(cwd);
  let base = null;
  if (storedBaseHash) {
    // Use ours as base approximation if hash matches, otherwise treat as fresh
    if (storedBaseHash === pair.oursHash) {
      base = pair.ours;
    }
  }
  // If no base, treat ours as base (two-way diff)
  if (!base) base = pair.ours;

  // Compute diff
  const diff = engine.computeWeekDiff(base, pair.ours, pair.theirs);

  if (!quiet) {
    console.log(`${c.bold}Manifest Sync${c.reset}\n`);
    console.log(`  Ours: .flow/lesson-plans.yml`);
    console.log(`  Theirs: ${relative(cwd, resolvedTheirsPath)}`);
    console.log(`  Strategy: ${conflictStrategy}\n`);

    if (diff.oursChanged.length > 0) {
      console.log(`  ${c.cyan}Ours changed:${c.reset} weeks ${diff.oursChanged.join(', ')}`);
    }
    if (diff.theirsChanged.length > 0) {
      console.log(`  ${c.green}Theirs changed:${c.reset} weeks ${diff.theirsChanged.join(', ')}`);
    }
    if (diff.conflicts.length > 0) {
      console.log(`  ${c.red}Conflicts:${c.reset} ${diff.conflicts.length}`);
      for (const conflict of diff.conflicts) {
        console.log(`    Week ${conflict.week}: fields ${conflict.conflictingFields.join(', ')}`);
      }
    }
    if (diff.unchanged.length > 0) {
      console.log(`  ${c.gray}Unchanged:${c.reset} weeks ${diff.unchanged.join(', ')}`);
    }
    if (diff.semesterDiff) {
      console.log(`  ${c.yellow}⚠${c.reset} Semester metadata differs (last-writer-wins from theirs)`);
    }
  }

  if (dryRun) {
    // Preview merge
    const mergeResult = engine.mergeManifests(base, pair.ours, pair.theirs, { conflictStrategy });
    console.log(`\n${c.bold}Dry-run: Merged Preview${c.reset}\n`);
    console.log(`Auto-merged weeks: ${mergeResult.autoMerged.join(', ') || 'none'}`);
    console.log(`Conflicts resolved (${conflictStrategy}): ${mergeResult.conflicts.length}`);
    console.log(`\n${c.gray}Merged YAML:${c.reset}`);
    console.log(mergeResult.mergedYaml);
    console.log(`\n${c.gray}Run without --dry-run to apply.${c.reset}`);
    process.exit(0);
  }

  // Apply merge
  const mergeResult = engine.mergeManifests(base, pair.ours, pair.theirs, { conflictStrategy });

  if (!mergeResult.success) {
    console.error(`${c.red}✗ Merge failed${c.reset}`);
    process.exit(1);
  }

  const writeResult = engine.writeMergedManifest(oursPath, mergeResult.mergedYaml, { backup: true });

  if (!writeResult.success) {
    console.error(`${c.red}✗ Write failed${c.reset}`);
    process.exit(1);
  }

  // Store new base hash
  engine.storeBaseHash(cwd, writeResult.newHash);

  console.log(`\n${c.green}${c.bold}✓ Manifest synced!${c.reset}\n`);
  console.log(`  Auto-merged: ${mergeResult.autoMerged.length > 0 ? `weeks ${mergeResult.autoMerged.join(', ')}` : 'none'}`);
  if (mergeResult.conflicts.length > 0) {
    console.log(`  Conflicts resolved (${conflictStrategy}): ${mergeResult.conflicts.length}`);
  }
  if (writeResult.backupPath) {
    console.log(`  Backup: ${relative(cwd, writeResult.backupPath)}`);
  }
  console.log(`\n${c.bold}Next steps:${c.reset}`);
  console.log(`  1. Review: ${c.cyan}cat .flow/lesson-plans.yml${c.reset}`);
  console.log(`  2. Validate: ${c.cyan}/teaching:validate${c.reset}`);
  process.exit(0);
}

// Handle no config directories
if (patterns.length === 0) {
  if (!quiet) {
    console.log(`${c.yellow}No YAML configs found${c.reset}`);
    console.log(`Expected: content/lesson-plans/ or .claude/`);
  }
  process.exit(0);
}

// === STATUS MODE ===
if (showStatus) {
  console.log(`${c.bold}YAML → JSON Sync Status${c.reset}\n`);

  let totalFiles = 0;
  let inSyncCount = 0;
  let outOfSyncCount = 0;
  let neverSyncedCount = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, { cwd, absolute: true });
    for (const file of files) {
      totalFiles++;
      const status = engine.getSyncStatus(file);
      const relativePath = relative(cwd, file);

      let indicator, color, statusText;
      if (status.status === 'in-sync') {
        indicator = '✓'; color = c.green; statusText = 'in-sync';
        inSyncCount++;
      } else if (status.status === 'never-synced') {
        indicator = '○'; color = c.yellow; statusText = 'never-synced';
        neverSyncedCount++;
      } else if (status.status === 'out-of-sync') {
        indicator = '✗'; color = c.red; statusText = 'out-of-sync';
        outOfSyncCount++;
      } else {
        indicator = '?'; color = c.gray; statusText = status.status;
      }

      console.log(`${color}${indicator}${c.reset} ${relativePath} (${statusText})`);
    }
  }

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`Total: ${totalFiles} files`);
  console.log(`  ${c.green}✓${c.reset} In sync: ${inSyncCount}`);
  console.log(`  ${c.yellow}○${c.reset} Never synced: ${neverSyncedCount}`);
  console.log(`  ${c.red}✗${c.reset} Out of sync: ${outOfSyncCount}`);

  if (outOfSyncCount > 0 || neverSyncedCount > 0) {
    console.log(`\n${c.cyan}Run \`/teaching:sync\` to sync files.${c.reset}`);
  }

  process.exit(0);
}

// === SINGLE FILE MODE ===
if (specificFile) {
  const filePath = specificFile.startsWith('/') ? specificFile : join(cwd, specificFile);

  if (!existsSync(filePath)) {
    console.log(`${c.red}Error:${c.reset} File not found: ${specificFile}`);
    process.exit(1);
  }

  const relativePath = relative(cwd, filePath);

  if (!quiet) {
    console.log(`${c.bold}Syncing:${c.reset} ${relativePath}`);
  }

  const result = engine.syncFile(filePath, { force: forceSync });

  if (dryRun && result.dryRun) {
    // Show dry-run preview
    const jsonPath = relative(cwd, result.jsonPath);
    console.log('');
    console.log(formatFileDiff(relativePath, jsonPath, result.changes, { color: useColor }));
    console.log('');
    console.log(`${c.cyan}Run without --dry-run to apply changes.${c.reset}`);
    process.exit(0);
  }

  if (result.success) {
    if (result.skipped) {
      console.log(`${c.yellow}○${c.reset} Unchanged (skipped)`);
    } else {
      console.log(`${c.green}✓${c.reset} Synced → ${relative(cwd, result.jsonPath)} (${result.duration}ms)`);
    }
  } else {
    console.log(`${c.red}✗${c.reset} Failed: ${result.error}`);
    process.exit(1);
  }

  process.exit(0);
}

// === BATCH MODE ===
const startTime = Date.now();

if (!quiet && !dryRun) {
  console.log(`${c.bold}Syncing YAML → JSON...${c.reset}`);
}

// Execute sync (with or without dry-run)
const results = await engine.syncAll({
  patterns,
  force: syncAll || forceSync
});

// Handle dry-run output
if (dryRun) {
  // Make paths relative for display
  const displayResults = results.map(r => ({
    ...r,
    yamlPath: relative(cwd, r.yamlPath),
    jsonPath: relative(cwd, r.jsonPath)
  }));

  console.log(formatDryRunReport(displayResults, { color: useColor }));
  process.exit(0);
}

// Summarize results
const synced = results.filter(r => r.success && !r.skipped);
const skipped = results.filter(r => r.skipped);
const failed = results.filter(r => !r.success);

if (!quiet) {
  for (const result of synced) {
    const relativePath = relative(cwd, result.yamlPath);
    const jsonRelative = relative(cwd, result.jsonPath);
    console.log(`├─ ${c.green}✓${c.reset} ${relativePath} → ${jsonRelative} (${result.duration}ms)`);
  }

  if (debug) {
    for (const result of skipped) {
      const relativePath = relative(cwd, result.yamlPath);
      console.log(`├─ ${c.yellow}○${c.reset} ${relativePath} (unchanged)`);
    }
  }

  for (const result of failed) {
    const relativePath = relative(cwd, result.yamlPath);
    console.log(`├─ ${c.red}✗${c.reset} ${relativePath}`);
    console.log(`│   └─ ${result.error}`);
  }

  const totalDuration = Date.now() - startTime;
  console.log(`└─ ${c.bold}Done:${c.reset} ${synced.length} synced, ${skipped.length} unchanged, ${failed.length} failed (${totalDuration}ms)`);
}

if (failed.length > 0) {
  process.exit(1);
}

// Helper to parse command line arguments
function parseArgs(input) {
  const parts = input.split(/\s+/);
  const args = { _: [] };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith('--')) {
      const key = part.substring(2);
      const next = parts[i + 1];

      if (next && !next.startsWith('--')) {
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

## Pre-commit Hook Integration

The sync can be invoked via pre-commit hook for automatic synchronization:

```bash
# .git/hooks/pre-commit
#!/bin/bash
node scripts/sync-yaml.js --quiet
if [ $? -ne 0 ]; then
  echo "YAML sync failed. Please fix errors before committing."
  exit 1
fi
```

## Pre-command Hook

Scholar commands automatically sync before execution via `pre-command-hook.js`.

## Error Handling

- **File not found:** Shows clear error with path
- **YAML parse errors:** Shows line number and syntax hint
- **Permission errors:** Suggests checking file permissions
- **Empty files:** Warning (not error), skipped

## Follow-up Actions

After syncing, you can:
- Run `/teaching:validate` to check schema compliance
- Run `/teaching:diff` to see YAML vs JSON comparison
- Use `--status` to verify all files are in sync
- Use `--manifest` for bidirectional manifest sync with flow-cli
</system>
