---
name: teaching:preflight
description: Pre-release health checks for Scholar projects — version sync, conflict markers, cache cleanup, changelog, and status file
---

# Pre-Release Health Checks

Run pre-release validation checks to ensure a Scholar project is ready for release.

**Usage:** `/teaching:preflight [options]`

**Examples:**
- `/teaching:preflight` - Run all checks
- `/teaching:preflight --fix` - Auto-fix what's possible
- `/teaching:preflight --json` - Machine-readable output
- `/teaching:preflight --quick` - Skip slow checks (test counts)
- `/teaching:preflight --debug` - Verbose diagnostics

**Options:**
- `--fix` - Auto-fix fixable issues (delete stale cache, etc.)
- `--json` - Output results as JSON
- `--quick` - Skip slow checks (test count verification)
- `--debug` - Enable debug logging

<system>
This command runs pre-release health checks. NO AI calls — pure validation only.

## Implementation

```javascript
import { runAllChecks } from '../../../teaching/validators/preflight.js';

// Parse user input
const args = parseArgs(userInput);
const fix = args.fix || false;
const jsonOutput = args.json || false;
const quick = args.quick || false;
const debug = args.debug || process.env.SCHOLAR_DEBUG === 'true';

// ANSI colors
const useColor = !args['no-color'] && !jsonOutput;
const c = useColor ? {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
  gray: '\x1b[90m', bold: '\x1b[1m'
} : { reset: '', red: '', green: '', yellow: '', blue: '', cyan: '', gray: '', bold: '' };

if (!jsonOutput) {
  console.log(`${c.bold}Scholar Pre-flight Checks${c.reset}\n`);
}

const results = await runAllChecks({ fix, quick, debug });

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const check of results.checks) {
    const icon = check.status === 'pass'
      ? `${c.green}PASS${c.reset}`
      : check.status === 'warn'
        ? `${c.yellow}WARN${c.reset}`
        : `${c.red}FAIL${c.reset}`;
    const fixLabel = check.fixable && check.status !== 'pass'
      ? ` ${c.cyan}[fixable]${c.reset}`
      : '';
    const fixedLabel = check.fixed
      ? ` ${c.green}[fixed]${c.reset}`
      : '';
    console.log(`  ${icon}  ${check.name}${fixLabel}${fixedLabel}`);
    console.log(`       ${c.gray}${check.detail}${c.reset}`);
  }

  console.log('');
  console.log('─'.repeat(55));

  const parts = [];
  if (results.passed > 0) parts.push(`${c.green}${results.passed} passed${c.reset}`);
  if (results.warned > 0) parts.push(`${c.yellow}${results.warned} warned${c.reset}`);
  if (results.failed > 0) parts.push(`${c.red}${results.failed} failed${c.reset}`);
  console.log(`Preflight: ${parts.join(', ')}`);

  if (fix && results.fixedCount > 0) {
    console.log(`\n${c.green}Fixed ${results.fixedCount} issue(s).${c.reset} Re-run to verify.`);
  }
}

const exitCode = results.failed > 0 ? 1 : 0;
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

## Checks Performed

| Check | What It Does | Fixable? |
|-------|-------------|----------|
| **version-sync** | Compares versions in package.json, plugin.json, mkdocs.yml | No |
| **conflict-markers** | Scans src/ and docs/ for `<<<<<<` merge conflict markers | No |
| **test-counts** | Verifies mkdocs.yml test counts match expectations | Yes |
| **cache-cleanup** | Checks for stale discovery cache.json | Yes (delete) |
| **changelog** | Checks CHANGELOG.md first version matches package.json | No |
| **status-file** | Checks .STATUS file freshness (warns if > 7 days old) | No |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed (or only warnings) |
| 1 | One or more checks failed |

## Follow-up Actions

After preflight:
- Fix any failed checks before release
- Run `/teaching:validate --all` for config validation
- Run `/teaching:sync` to ensure JSON/YAML consistency
</system>
