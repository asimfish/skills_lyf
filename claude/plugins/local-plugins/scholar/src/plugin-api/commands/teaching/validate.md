---
name: validate
description: Validate YAML configuration files against schemas with multi-level checks
---

# Validate Configuration Files

Validate YAML configuration files (lesson plans, teaching styles) against JSON schemas with four levels of validation.

**Usage:**
```
/teaching:validate [file] [options]
```

**Examples:**
```
# Basic validation
/teaching:validate content/lesson-plans/week03.yml

# Validate all files
/teaching:validate --all

# Schema level only
/teaching:validate --level=schema content/lesson-plans/

# Strict mode (warnings = errors)
/teaching:validate --strict --all

# Auto-fix (interactive)
/teaching:validate --fix content/lesson-plans/week03.yml

# Auto-fix in CI/CD (safe fixes only)
/teaching:validate --fix --auto --all

# Preview fixes without applying (dry-run)
/teaching:validate --fix --dry-run content/lesson-plans/week03.yml
```

**Options:**
- `--all` - Validate all YAML files in standard locations
- `--level <level>` - Stop after validation level (default: cross-file)
  - `syntax` - Only check YAML syntax
  - `schema` - Check YAML syntax + JSON Schema compliance
  - `semantic` - Above + business logic rules
  - `cross-file` - Above + cross-file references (full validation)
- `--strict` - Treat warnings as errors (fail on any issue)
- `--quiet` - Only show errors, suppress warnings
- `--json` - Output results as JSON
- `--fix` - Auto-fix simple issues where possible (interactive mode)
- `--auto` - Auto-fix mode: apply only safe fixes, skip unsafe (for CI/CD)
- `--dry-run` - Preview fixes without applying (use with --fix)
- `--debug` - Enable debug logging

**Validation Levels:**

| Level | Checks | Example Errors |
|-------|--------|----------------|
| **syntax** | YAML parsing | Indentation errors, invalid syntax |
| **schema** | Structure | Missing required fields, wrong types |
| **semantic** | Logic | Activity time > lecture time, unassessed objectives |
| **cross-file** | References | Missing dataset files, invalid prerequisites |

**Output Format:**

IDE-compatible output (eslint-style):
```
content/lesson-plans/week03.yml:15:3: error: Missing required field: level
  Rule: schema:required
  Suggestion: Add "level" with Bloom's taxonomy value

content/lesson-plans/week03.yml:42: warning: Activity time (90 min) exceeds lecture time (75 min)
  Rule: semantic:duration-overflow

───────────────────────────────────────────────────────
Validation: 1 error, 1 warning in 1 file (45ms)
```

**Auto-Fix Mode:**

When using `--fix`, the validator will attempt to automatically fix errors:

```
✗ content/lesson-plans/week03.yml

  Available fixes:

  ✓ Auto-fixable (2):
    1. [syntax] Normalize YAML formatting
       → Normalized indentation to 2 spaces
       → Removed trailing whitespace

  ⚠ Requires confirmation (1):
    3. [schema] Add required field 'duration' with default value
       Before: { title: "Lecture" }
       After:  { title: "Lecture", duration: 30 }

  Apply unsafe fixes? (Y/n) y
  Fix: Add required field 'duration' with default value
    Apply? (Y/n) y

  ✓ Applied 3 fix(es) to content/lesson-plans/week03.yml

  ✓ Re-validation: File is now valid
```

**Fix Types:**

| Type | Safe? | Examples |
|------|-------|----------|
| **syntax** | Yes (auto-apply) | Normalize indentation, remove trailing whitespace, add quotes |
| **schema** | No (confirm) | Add missing required fields, remove invalid properties |
| **type** | No (confirm) | Convert string to array, number to string |
| **deprecated** | No (confirm) | Migrate v1 fields to v2 schema |

**CI/CD Usage:**

Use `--auto` flag to apply only safe fixes without prompts:
```bash
/teaching:validate --fix --auto --all
# Exit code 0 if all errors fixed
# Exit code 1 if manual fixes needed
```

<system>
This command validates YAML configuration files against v2 schemas.

## Implementation

```javascript
import { ConfigValidator, validateConfigFile } from '../../../teaching/validators/config-validator.js';
import { formatSummary, supportsColor } from '../../../teaching/formatters/error-formatter.js';
import { createAutoFixer } from '../../../teaching/validators/auto-fixer.js';
import { existsSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import { promisify } from 'util';
import { glob } from 'glob';
import yaml from 'js-yaml';

// Parse user input
const args = parseArgs(userInput);

const cwd = process.cwd();
const validateAll = args.all || false;
const level = args.level || 'cross-file';
const strict = args.strict || false;
const quiet = args.quiet || false;
const jsonOutput = args.json || false;
const autoFix = args.fix || false;
const autoApply = args.auto || false; // Non-interactive mode
const dryRun = args['dry-run'] || false; // Dry-run mode
const debug = args.debug || process.env.SCHOLAR_DEBUG === 'true';
const specificFile = args._[0] || args.file || null;
const useColor = supportsColor() && !args['no-color'] && !jsonOutput;

// ANSI colors
const c = useColor ? {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
  gray: '\x1b[90m', bold: '\x1b[1m'
} : { reset: '', red: '', green: '', yellow: '', blue: '', cyan: '', gray: '', bold: '' };

// Create validator
const validator = new ConfigValidator({
  strict,
  maxLevel: level,
  color: useColor,
  cwd,
  debug
});

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
    // Validate all YAML files in directory
    const dirFiles = await glob('**/*.{yml,yaml}', { cwd: filePath, absolute: true });
    files = dirFiles;
  } else {
    files = [filePath];
  }
} else if (validateAll) {
  // Find all YAML files in standard locations
  const patterns = [
    'content/lesson-plans/**/*.yml',
    'content/lesson-plans/**/*.yaml',
    '.claude/**/*.yml',
    '.claude/**/*.yaml'
  ];

  for (const pattern of patterns) {
    const found = await glob(pattern, { cwd, absolute: true });
    files.push(...found);
  }
} else {
  console.log(`${c.bold}Usage:${c.reset} /teaching:validate <file> [options]`);
  console.log(`       /teaching:validate --all [options]`);
  console.log(`\nOptions:`);
  console.log(`  --all          Validate all YAML files`);
  console.log(`  --level <lvl>  Validation level: syntax, schema, semantic, cross-file`);
  console.log(`  --strict       Treat warnings as errors`);
  console.log(`  --quiet        Only show errors`);
  console.log(`  --json         Output as JSON`);
  console.log(`  --fix          Auto-fix issues (interactive)`);
  console.log(`  --auto         Auto-fix safe issues only (for CI/CD)`);
  console.log(`  --dry-run      Preview fixes without applying (use with --fix)`);
  console.log(`  --debug        Enable debug logging`);
  process.exit(0);
}

if (files.length === 0) {
  console.log(`${c.yellow}No YAML files found to validate${c.reset}`);
  process.exit(0);
}

// Validate files
const startTime = Date.now();
const allResults = [];
let totalErrors = 0;
let totalWarnings = 0;

if (!quiet && !jsonOutput) {
  console.log(`${c.bold}Validating ${files.length} file(s)...${c.reset}\n`);
  console.log(`Level: ${level}`);
  console.log(`Strict: ${strict ? 'yes' : 'no'}\n`);
}

for (const file of files) {
  const relativePath = relative(cwd, file);
  const result = validator.validateFile(file);

  allResults.push({ file: relativePath, ...result });

  totalErrors += result.errors.length;
  totalWarnings += result.warnings.length;

  if (!jsonOutput) {
    // Print file header
    const statusIcon = result.isValid
      ? `${c.green}✓${c.reset}`
      : `${c.red}✗${c.reset}`;

    if (!quiet || !result.isValid) {
      console.log(`${statusIcon} ${c.bold}${relativePath}${c.reset}`);
    }

    // Print errors
    for (const error of result.errors) {
      const col = error.column ? `:${error.column}` : '';
      console.log(`  ${c.red}${relativePath}:${error.line}${col}${c.reset}: ${c.red}error${c.reset}: ${error.message}`);
      if (error.rule) {
        console.log(`    ${c.gray}Rule: ${error.rule}${c.reset}`);
      }
      if (error.suggestion) {
        console.log(`    ${c.cyan}Suggestion: ${error.suggestion}${c.reset}`);
      }
    }

    // Print warnings (unless quiet)
    if (!quiet) {
      for (const warning of result.warnings) {
        const levelColor = warning.level === 'info' ? c.blue : c.yellow;
        const levelText = warning.level === 'info' ? 'info' : 'warning';
        const col = warning.column ? `:${warning.column}` : '';
        console.log(`  ${c.yellow}${relativePath}:${warning.line}${col}${c.reset}: ${levelColor}${levelText}${c.reset}: ${warning.message}`);
        if (warning.rule) {
          console.log(`    ${c.gray}Rule: ${warning.rule}${c.reset}`);
        }
        if (warning.suggestion) {
          console.log(`    ${c.cyan}Suggestion: ${warning.suggestion}${c.reset}`);
        }
      }
    }

    if (!quiet || !result.isValid) {
      console.log('');
    }
  }

  // Auto-fix logic
  if (autoFix && !result.isValid) {
    try {
      const yamlContent = readFileSync(file, 'utf-8');
      const fixer = createAutoFixer();

      // Get schema for this file
      const schema = validator.getSchemaForFile(file);

      // Get all available fixes
      const allFixes = fixer.getAllFixes(yamlContent, result.schemaErrors || [], schema);

      // Organize fixes
      const safeFixes = [];
      const unsafeFixes = [];

      // Syntax fixes are always safe
      if (allFixes.syntax && allFixes.syntax.success) {
        const changes = allFixes.syntax.changes;
        if (changes.length > 0 && changes[0] !== 'No syntax changes needed') {
          safeFixes.push({
            type: 'syntax',
            description: 'Normalize YAML formatting',
            safe: true,
            changes: changes,
            applied: true,
            content: allFixes.syntax.fixed
          });
        }
      }

      // Schema, type, and deprecated fixes require confirmation
      for (const fix of [...allFixes.schema, ...allFixes.type, ...allFixes.deprecated]) {
        unsafeFixes.push(fix);
      }

      const totalFixes = safeFixes.length + unsafeFixes.length;

      if (totalFixes === 0) {
        if (!jsonOutput && !quiet) {
          console.log(`  ${c.yellow}No auto-fixes available for this file${c.reset}\n`);
        }
        continue;
      }

      // Dry-run mode: Show what would be fixed without applying
      if (dryRun) {
        if (!jsonOutput && !quiet) {
          console.log(`  ${c.bold}${c.cyan}Would apply ${totalFixes} fix(es) (dry-run):${c.reset}\n`);

          // Show safe fixes
          if (safeFixes.length > 0) {
            console.log(`  ${c.green}✓ Safe fixes (${safeFixes.length}):${c.reset}`);
            for (let i = 0; i < safeFixes.length; i++) {
              const fix = safeFixes[i];
              console.log(`    ${i + 1}. [${fix.type}] ${fix.description}`);
              if (fix.changes) {
                fix.changes.forEach(change => {
                  console.log(`       ${c.gray}→ ${change}${c.reset}`);
                });
              }
            }
            console.log('');
          }

          // Show unsafe fixes
          if (unsafeFixes.length > 0) {
            console.log(`  ${c.yellow}⚠ Requires confirmation (${unsafeFixes.length}):${c.reset}`);
            for (let i = 0; i < unsafeFixes.length; i++) {
              const fix = unsafeFixes[i];
              const num = safeFixes.length + i + 1;
              console.log(`    ${num}. [${fix.type}] ${fix.description}`);
              console.log(`       ${c.gray}Before: ${fix.before}${c.reset}`);
              console.log(`       ${c.gray}After:  ${fix.after}${c.reset}`);
            }
            console.log('');
          }

          console.log(`  ${c.cyan}Run without --dry-run to apply these fixes.${c.reset}\n`);
        }
        continue;
      }

      // Display available fixes
      if (!jsonOutput && !quiet) {
        console.log(`  ${c.bold}${c.cyan}Available fixes:${c.reset}\n`);

        // Show safe fixes
        if (safeFixes.length > 0) {
          console.log(`  ${c.green}✓ Auto-fixable (${safeFixes.length}):${c.reset}`);
          for (let i = 0; i < safeFixes.length; i++) {
            const fix = safeFixes[i];
            console.log(`    ${i + 1}. [${fix.type}] ${fix.description}`);
            if (fix.changes) {
              fix.changes.forEach(change => {
                console.log(`       ${c.gray}→ ${change}${c.reset}`);
              });
            }
          }
          console.log('');
        }

        // Show unsafe fixes
        if (unsafeFixes.length > 0) {
          console.log(`  ${c.yellow}⚠ Requires confirmation (${unsafeFixes.length}):${c.reset}`);
          for (let i = 0; i < unsafeFixes.length; i++) {
            const fix = unsafeFixes[i];
            const num = safeFixes.length + i + 1;
            console.log(`    ${num}. [${fix.type}] ${fix.description}`);
            console.log(`       ${c.gray}Before: ${fix.before}${c.reset}`);
            console.log(`       ${c.gray}After:  ${fix.after}${c.reset}`);
          }
          console.log('');
        }
      }

      // Apply fixes based on mode
      let appliedFixes = [];
      let fixedContent = yamlContent;
      let fixedData = result.data;

      // Auto-apply safe fixes (always in both modes)
      if (safeFixes.length > 0) {
        for (const fix of safeFixes) {
          if (fix.content) {
            fixedContent = fix.content;
          }
          appliedFixes.push(fix);
        }
      }

      // Handle unsafe fixes
      if (unsafeFixes.length > 0) {
        if (autoApply) {
          // Non-interactive mode: skip unsafe fixes
          if (!jsonOutput && !quiet) {
            console.log(`  ${c.yellow}Skipping ${unsafeFixes.length} unsafe fix(es) in --auto mode${c.reset}\n`);
          }
        } else {
          // Interactive mode: ask for confirmation
          if (!jsonOutput) {
            const readline = await import('readline');
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            const question = (prompt) => new Promise((resolve) => {
              rl.question(prompt, resolve);
            });

            // Ask about all unsafe fixes
            const applyAll = await question(`  Apply unsafe fixes? (Y/n) `);

            if (applyAll.toLowerCase() !== 'n' && applyAll.toLowerCase() !== 'no') {
              // Parse the fixed content to apply data fixes
              let currentData = yaml.load(fixedContent);

              for (const fix of unsafeFixes) {
                const applyThis = await question(`  Fix: ${fix.description}\n    Apply? (Y/n) `);

                if (applyThis.toLowerCase() !== 'n' && applyThis.toLowerCase() !== 'no') {
                  fix.applied = true;
                  if (fix.apply) {
                    currentData = fix.apply(currentData);
                  }
                  appliedFixes.push(fix);
                }
              }

              // Re-serialize fixed data
              fixedContent = yaml.dump(currentData, {
                indent: 2,
                lineWidth: 80,
                noRefs: true,
                sortKeys: false,
                quotingType: '"',
                forceQuotes: false
              });

              // Remove trailing whitespace
              fixedContent = fixedContent.split('\n').map(line => line.trimEnd()).join('\n').trimEnd();
            }

            rl.close();
          }
        }
      }

      // Write fixed file if any fixes were applied
      if (appliedFixes.length > 0) {
        writeFileSync(file, fixedContent, 'utf-8');

        if (!jsonOutput && !quiet) {
          console.log(`  ${c.green}✓ Applied ${appliedFixes.length} fix(es) to ${relativePath}${c.reset}\n`);
        }

        // Re-validate fixed file
        const revalidated = validator.validateFile(file);

        if (!jsonOutput && !quiet) {
          if (revalidated.isValid) {
            console.log(`  ${c.green}✓ Re-validation: File is now valid${c.reset}\n`);
          } else {
            console.log(`  ${c.yellow}⚠ Re-validation: ${revalidated.errors.length} error(s) remaining${c.reset}`);
            for (const error of revalidated.errors) {
              console.log(`    ${c.red}${error.message}${c.reset}`);
            }
            console.log('');
          }
        }

        // Update results
        allResults[allResults.length - 1] = { file: relativePath, ...revalidated };
        totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);
        totalWarnings = allResults.reduce((sum, r) => sum + r.warnings.length, 0);
      } else if (!jsonOutput && !quiet) {
        console.log(`  ${c.gray}No fixes applied${c.reset}\n`);
      }

    } catch (error) {
      if (!jsonOutput) {
        console.log(`  ${c.red}Error during auto-fix: ${error.message}${c.reset}\n`);
      }
      if (debug) {
        console.error(error);
      }
    }
  }
}

const totalDuration = Date.now() - startTime;

// Output summary
if (jsonOutput) {
  const output = {
    summary: {
      files: files.length,
      errors: totalErrors,
      warnings: totalWarnings,
      duration: totalDuration,
      level,
      strict,
      valid: strict ? (totalErrors === 0 && totalWarnings === 0) : (totalErrors === 0)
    },
    results: allResults
  };
  console.log(JSON.stringify(output, null, 2));
} else {
  // Print summary line
  console.log('─'.repeat(55));

  const errorText = totalErrors > 0
    ? `${c.red}${totalErrors} error${totalErrors !== 1 ? 's' : ''}${c.reset}`
    : null;
  const warningText = totalWarnings > 0
    ? `${c.yellow}${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}${c.reset}`
    : null;

  const parts = [errorText, warningText].filter(Boolean);

  if (parts.length === 0) {
    console.log(`${c.green}✓ All ${files.length} file(s) valid${c.reset} (${totalDuration}ms)`);
  } else {
    console.log(`Validation: ${parts.join(', ')} in ${files.length} file(s) (${totalDuration}ms)`);
  }
}

// Exit code
const exitCode = strict
  ? (totalErrors > 0 || totalWarnings > 0 ? 1 : 0)
  : (totalErrors > 0 ? 1 : 0);

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

## Schema Types

The validator auto-detects schema type based on file path:

| Path Pattern | Schema |
|--------------|--------|
| `**/lesson-plan*.yml` | lesson-plan.schema.json |
| `**/week*.yml` | lesson-plan.schema.json |
| `**/teaching-style*.yml` | teaching-style.schema.json |

## Validation Rules

### Schema Rules (Level 2)

| Rule | Description |
|------|-------------|
| `schema:required` | Required field missing |
| `schema:type` | Wrong data type |
| `schema:enum` | Value not in allowed list |
| `schema:pattern` | String doesn't match pattern (e.g., LO-X.Y) |
| `schema:format` | Invalid format (date, uri, etc.) |

### Semantic Rules (Level 3)

| Rule | Description |
|------|-------------|
| `semantic:duration-overflow` | Activities exceed lecture time |
| `semantic:unassessed-objective` | Learning objective has no assessment |
| `semantic:self-prerequisite` | Topic references prerequisite from same week |
| `semantic:invalid-date-range` | Start date after end date |

### Cross-file Rules (Level 4)

| Rule | Description |
|------|-------------|
| `cross-file:missing-dataset` | Referenced dataset file not found |
| `cross-file:future-prerequisite` | Prerequisite from future week |
| `cross-file:unverified-prerequisite` | Cannot verify prerequisite (file missing) |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Validation passed |
| 1 | Validation failed (errors found, or warnings in strict mode) |

## Follow-up Actions

After validation, you can:
- Fix reported issues in YAML files
- Run `/teaching:sync` to regenerate JSON
- Run `/teaching:diff` to compare YAML vs JSON
- Use `--json` output for CI integration
</system>
