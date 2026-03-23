---
name: migrate
description: Migrate YAML configuration files from v1 to v2 schema, or convert directory-based week files to a manifest
---

# Migrate Configuration Files

Automatically upgrade YAML configuration files from schema v1 to v2, or convert directory-based week files into a single `.flow/lesson-plans.yml` manifest.

**Usage:**
```
/teaching:migrate [options]
```

**Examples:**
```
/teaching:migrate --detect           # Find v1 files with complexity
/teaching:migrate --dry-run          # Preview migration changes
/teaching:migrate                    # Apply migration with git commit
/teaching:migrate --file week-01.yml # Migrate single file
/teaching:migrate --no-git           # Apply without git commit
/teaching:migrate --to-manifest              # Convert week files to manifest
/teaching:migrate --to-manifest --dry-run    # Preview manifest migration
/teaching:migrate --to-manifest --detect     # Detect week files across directories
```

**Options:**
- `--detect` - Find v1 schema files and show complexity (or detect week files with `--to-manifest`)
- `--dry-run` - Preview migration changes without modifying files
- `--file <path>` - Migrate specific file only
- `--no-git` - Skip git commit (still applies migration)
- `--no-git-check` - Skip git safety check (dangerous - may lose uncommitted work)
- `--patterns <glob>` - Custom glob patterns (comma-separated)
- `--to-manifest` - Convert directory-based week files into `.flow/lesson-plans.yml`
- `--defaults <json>` - Custom default values for `--to-manifest` (e.g., `--defaults '{"status":"reviewed"}'`)
- `--debug` - Enable debug logging

**Schema Migration (default):**
- **Atomic semantics:** All-or-nothing (if ANY file fails, ALL rollback)
- **Git safety:** Checks for uncommitted changes before migration
- **Auto-commit:** Creates descriptive commit with file list and stats
- **Rollback guarantee:** Restores exact original content on failure

**Schema Detection:**
- Finds files without `schema_version` field
- Finds files with `schema_version: "1.0"`
- Skips files already at `schema_version: "2.0"`

**Migration Rules:**
- Field renames (e.g., `topics` → `content.topics`)
- Type conversions (e.g., string → array)
- Add missing required fields
- Update `schema_version` to "2.0"

**Manifest Migration (`--to-manifest`):**
- Scans `content/lesson-plans/`, `lesson-plans/`, `.flow/weeks/` for week files
- Merges all week data into a single `.flow/lesson-plans.yml` manifest
- Fills missing fields with sensible defaults (status: draft, empty arrays)
- Detects duplicate week numbers across directories
- Creates backup of existing manifest before overwriting
- Warns about missing fields (learning_objectives, topics, activities)

<system>
This command wraps BatchMigrator for v1→v2 schema migration, and ManifestMigrator for directory-to-manifest conversion.

## Implementation

```javascript
import { BatchMigrator } from '../../../teaching/validators/batch-migrator.js';
import { ManifestMigrator } from '../../../teaching/validators/manifest-migrator.js';
import { existsSync } from 'fs';
import { join, relative } from 'path';

// Parse user input
const args = parseArgs(userInput);

const cwd = process.cwd();
const detectMode = args.detect || false;
const dryRun = args['dry-run'] || false;
const noGit = args['no-git'] || false;
const noGitCheck = args['no-git-check'] || false;
const specificFile = args.file || null;
const debug = args.debug || process.env.SCHOLAR_DEBUG === 'true';
const toManifest = args['to-manifest'] || false;
let customDefaults = {};
if (args.defaults) {
  try {
    customDefaults = JSON.parse(args.defaults);
  } catch (e) {
    console.error(`\x1b[31m✗ Invalid JSON for --defaults:\x1b[0m ${e.message}`);
    console.error(`  Example usage: --defaults '{"status":"reviewed"}'`);
    process.exit(1);
  }
}
const customPatterns = args.patterns ? args.patterns.split(',').map(p => p.trim()) : null;

// ANSI colors
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

// === TO-MANIFEST MODE ===
if (toManifest) {
  const migrator = new ManifestMigrator({ courseRoot: cwd, debug });

  // Step 1: Detect week files
  console.log(`${c.bold}Detecting week files...${c.reset}\n`);
  const files = migrator.detectWeekFiles();

  if (files.length === 0) {
    console.log(`${c.yellow}No week files found${c.reset}`);
    console.log(`Expected: content/lesson-plans/, lesson-plans/, or .flow/weeks/`);
    process.exit(0);
  }

  console.log(`${c.cyan}Found ${files.length} week file(s)${c.reset}\n`);

  for (const file of files) {
    const missing = file.missingFields.length > 0
      ? ` ${c.yellow}(missing: ${file.missingFields.join(', ')})${c.reset}`
      : '';
    console.log(`  ${c.green}○${c.reset} Week ${file.weekNumber}: ${file.relativePath}${missing}`);
  }

  if (detectMode) {
    // Show preview
    const preview = migrator.previewMigration(files);
    console.log(`\n${c.bold}Preview${c.reset}`);
    console.log(`  Weeks: ${preview.weekCount}`);
    console.log(`  Fields to fill: ${preview.fieldsToFill}`);
    if (preview.conflicts.length > 0) {
      console.log(`  ${c.red}Conflicts: ${preview.conflicts.length}${c.reset}`);
      for (const conflict of preview.conflicts) {
        console.log(`    Week ${conflict.week}: ${conflict.sources.join(' vs ')}`);
      }
    }
    for (const warning of preview.warnings) {
      console.log(`  ${c.yellow}⚠${c.reset} ${warning}`);
    }
    console.log(`\n${c.bold}Next steps:${c.reset}`);
    console.log(`  1. Preview YAML: ${c.cyan}/teaching:migrate --to-manifest --dry-run${c.reset}`);
    console.log(`  2. Apply: ${c.cyan}/teaching:migrate --to-manifest${c.reset}`);
    process.exit(0);
  }

  if (dryRun) {
    const preview = migrator.previewMigration(files);
    console.log(`\n${c.bold}Dry-run: Manifest Preview${c.reset}\n`);
    console.log(`Would create: .flow/lesson-plans.yml`);
    console.log(`Weeks: ${preview.weekCount}`);
    console.log(`Fields to fill: ${preview.fieldsToFill}`);
    if (preview.warnings.length > 0) {
      console.log(`\n${c.yellow}Warnings:${c.reset}`);
      for (const w of preview.warnings) {
        console.log(`  ⚠ ${w}`);
      }
    }
    console.log(`\n${c.gray}YAML preview:${c.reset}`);
    console.log(preview.manifestYaml);
    console.log(`\n${c.gray}Run without --dry-run to apply.${c.reset}`);
    process.exit(0);
  }

  // Apply manifest migration
  console.log(`\n${c.bold}Creating manifest...${c.reset}`);
  const result = await migrator.migrate(files, { dryRun: false, defaults: customDefaults });

  if (!result.success) {
    console.error(`${c.red}✗ Migration failed:${c.reset} ${result.error}`);
    process.exit(1);
  }

  console.log(`\n${c.green}${c.bold}✓ Manifest created!${c.reset}\n`);
  console.log(`  File: ${relative(cwd, result.manifestPath)}`);
  console.log(`  Weeks merged: ${result.weeksMerged}`);
  console.log(`  Defaults filled: ${result.defaultsFilled}`);
  if (result.backupPath) {
    console.log(`  Backup: ${relative(cwd, result.backupPath)}`);
  }
  if (result.warnings.length > 0) {
    console.log(`\n${c.yellow}Warnings:${c.reset}`);
    for (const w of result.warnings.slice(0, 10)) {
      console.log(`  ⚠ ${w}`);
    }
    if (result.warnings.length > 10) {
      console.log(`  ... and ${result.warnings.length - 10} more`);
    }
  }
  console.log(`\n${c.bold}Next steps:${c.reset}`);
  console.log(`  1. Review manifest: ${c.cyan}cat .flow/lesson-plans.yml${c.reset}`);
  console.log(`  2. Validate: ${c.cyan}/teaching:validate${c.reset}`);
  console.log(`  3. Sync: ${c.cyan}/teaching:sync --manifest${c.reset}`);
  process.exit(0);
}

// Initialize migrator
const migrator = new BatchMigrator({
  rootDir: cwd,
  debug,
  patterns: customPatterns
});

// Build glob patterns
let patterns = customPatterns;
if (!patterns) {
  patterns = [];
  if (existsSync(join(cwd, 'content', 'lesson-plans'))) {
    patterns.push('content/lesson-plans/**/*.yml');
    patterns.push('content/lesson-plans/**/*.yaml');
  }
  if (existsSync(join(cwd, '.claude'))) {
    patterns.push('.claude/**/*.yml');
    patterns.push('.claude/**/*.yaml');
  }
  if (existsSync(join(cwd, '.flow'))) {
    patterns.push('.flow/**/*.yml');
    patterns.push('.flow/**/*.yaml');
  }
}

// Handle no config directories
if (patterns.length === 0) {
  console.log(`${c.yellow}No YAML configs found${c.reset}`);
  console.log(`Expected: content/lesson-plans/, .claude/, or .flow/`);
  console.log(`\nUse ${c.cyan}--patterns${c.reset} to specify custom locations.`);
  process.exit(0);
}

try {
  // Handle single file migration
  if (specificFile) {
    console.log(`${c.bold}Migrating single file${c.reset}\n`);

    const filePath = join(cwd, specificFile);

    if (!existsSync(filePath)) {
      console.error(`${c.red}✗ Error:${c.reset} File not found: ${specificFile}`);
      process.exit(1);
    }

    // Detect if v1
    const files = await migrator.detectV1Schemas({
      patterns: [relative(cwd, filePath)]
    });

    if (files.length === 0) {
      console.log(`${c.green}✓${c.reset} File is already v2 schema: ${specificFile}`);
      process.exit(0);
    }

    if (detectMode) {
      // Show detection info
      const file = files[0];
      console.log(`${c.cyan}${file.relativePath}${c.reset}`);
      console.log(`  Schema version: ${file.schema_version}`);
      console.log(`  Complexity: ${file.complexityDesc} (${file.complexity}/10)`);
      console.log(`\n  Changes needed:`);
      for (const change of file.preview) {
        console.log(`    ${c.yellow}~${c.reset} ${change.oldPath} → ${change.newPath}`);
      }
      console.log(`\nNext steps:`);
      console.log(`  1. Preview: /teaching:migrate --file ${specificFile} --dry-run`);
      console.log(`  2. Apply: /teaching:migrate --file ${specificFile}`);
      process.exit(0);
    }

    if (dryRun) {
      // Show preview
      const previews = await migrator.previewMigration(files, { color: true });
      console.log(`${c.bold}Dry-run: Migration Preview${c.reset}\n`);
      console.log(previews[0].preview);
      console.log(`\n${c.gray}Run without --dry-run to apply changes.${c.reset}`);
      process.exit(0);
    }

    // Apply migration
    const result = await migrator.migrate(files, {
      dryRun: false,
      gitCommit: !noGit,
      gitCheck: !noGitCheck
    });

    if (result.success) {
      console.log(`${c.green}✓ Migration complete!${c.reset}\n`);
      console.log(`Migrated: ${specificFile}`);
      console.log(`Fixes applied: ${result.results[0].fixesApplied}`);
      if (result.commitHash) {
        console.log(`Commit: ${result.commitHash.substring(0, 7)}`);
      }
    } else {
      console.error(`${c.red}✗ Migration failed:${c.reset} ${result.error}`);
      process.exit(1);
    }

    process.exit(0);
  }

  // Batch migration
  console.log(`${c.bold}Step 1: Detecting v1 schema files...${c.reset}`);

  const files = await migrator.detectV1Schemas({ patterns });

  if (files.length === 0) {
    console.log(`${c.green}✓ No v1 schema files found${c.reset}`);
    console.log(`\nAll files are already v2 schema or no config files exist.`);
    process.exit(0);
  }

  console.log(`${c.cyan}Found ${files.length} v1 schema file(s)${c.reset}\n`);

  // Calculate average complexity
  const avgComplexity = files.reduce((sum, f) => sum + f.complexity, 0) / files.length;
  const estimatedMinutes = Math.ceil(files.length * 0.2); // ~12 seconds per file

  if (detectMode) {
    // Show detection results
    for (const file of files) {
      console.log(`${c.cyan}○ ${file.relativePath}${c.reset}`);
      console.log(`  Complexity: ${file.complexityDesc} (${file.complexity}/10)`);
      console.log(`  Changes needed:`);
      for (const change of file.preview.slice(0, 3)) {
        console.log(`    ${c.yellow}~${c.reset} ${change.oldPath} → ${change.newPath}`);
      }
      if (file.preview.length > 3) {
        console.log(`    ${c.gray}... and ${file.preview.length - 3} more${c.reset}`);
      }
      console.log('');
    }

    console.log(`${c.bold}Summary${c.reset}`);
    console.log(`Files found: ${files.length}`);
    console.log(`Average complexity: ${avgComplexity.toFixed(1)}/10`);
    console.log(`Estimated time: ${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''}`);
    console.log(`\n${c.bold}Next steps:${c.reset}`);
    console.log(`  1. Preview changes: ${c.cyan}/teaching:migrate --dry-run${c.reset}`);
    console.log(`  2. Apply migration: ${c.cyan}/teaching:migrate${c.reset}`);

    process.exit(0);
  }

  if (dryRun) {
    // Show preview for all files
    console.log(`${c.bold}Dry-run: Migration Preview${c.reset}\n`);

    const previews = await migrator.previewMigration(files, { color: true });

    for (const preview of previews) {
      console.log(preview.preview);
      console.log('');
    }

    console.log(`${c.bold}Summary${c.reset}`);
    console.log(`Would migrate: ${files.length} file(s)`);
    console.log(`\n${c.gray}Run without --dry-run to apply changes.${c.reset}`);

    process.exit(0);
  }

  // Apply migration
  console.log(`${c.bold}Step 2: Checking git status...${c.reset}`);

  if (noGitCheck) {
    console.log(`${c.yellow}⚠ Skipping git check (--no-git-check)${c.reset}\n`);
  } else {
    try {
      await migrator.checkGitStatus();
      console.log(`${c.green}✓ Clean working directory${c.reset}\n`);
    } catch (error) {
      console.error(`${c.red}✗ ${error.message}${c.reset}`);
      process.exit(1);
    }
  }

  console.log(`${c.bold}Step 3: Migrating files...${c.reset}\n`);

  const result = await migrator.migrate(files, {
    dryRun: false,
    gitCommit: !noGit,
    gitCheck: false // Already checked above
  });

  if (!result.success) {
    console.error(`${c.red}✗ Migration failed:${c.reset} ${result.error}`);
    process.exit(1);
  }

  // Show progress
  for (let i = 0; i < result.results.length; i++) {
    const fileResult = result.results[i];
    const fileName = relative(cwd, fileResult.file);
    const progress = `[${i + 1}/${result.results.length}]`;

    if (fileResult.success) {
      console.log(`${progress} ${fileName}... ${c.green}✅${c.reset}`);
    } else {
      console.log(`${progress} ${fileName}... ${c.red}✗${c.reset}`);
    }
  }

  console.log(`\n${c.green}${c.bold}✓ Migration complete!${c.reset}\n`);
  console.log(`Processed: ${result.filesProcessed} file(s)`);

  if (result.commitHash) {
    console.log(`Commit: ${result.commitHash.substring(0, 7)}`);
    console.log(`\n${c.bold}Next steps:${c.reset}`);
    console.log(`  1. Review changes: ${c.cyan}git show ${result.commitHash.substring(0, 7)}${c.reset}`);
    console.log(`  2. Validate configs: ${c.cyan}/teaching:validate${c.reset}`);
    console.log(`  3. Push to remote: ${c.cyan}git push${c.reset}`);
  } else {
    console.log(`\n${c.yellow}Note:${c.reset} Changes applied but not committed (--no-git)`);
    console.log(`\n${c.bold}Next steps:${c.reset}`);
    console.log(`  1. Review changes: ${c.cyan}git diff${c.reset}`);
    console.log(`  2. Validate configs: ${c.cyan}/teaching:validate${c.reset}`);
    console.log(`  3. Commit manually: ${c.cyan}git add . && git commit${c.reset}`);
  }

} catch (error) {
  console.error(`${c.red}✗ Error:${c.reset} ${error.message}`);
  if (debug) {
    console.error(error.stack);
  }
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

## Error Handling

- **File not found:** Shows clear error with path
- **Not a v1 file:** Informs user file is already v2
- **Git uncommitted changes:** Lists files and suggests fixes
- **Migration failure:** Rolls back all changes, shows error
- **Malformed YAML:** Skips file during detection, reports error
- **No week files (--to-manifest):** Lists expected directories
- **Duplicate weeks (--to-manifest):** Reports conflict sources, first-found wins

## Security

- Uses `execFileNoThrow` for all git operations (prevents command injection)
- Git safety checks prevent data loss from uncommitted changes
- Atomic rollback ensures no partial migrations
- All file operations are synchronous for consistency
- Backup created before overwriting existing manifests

</system>
