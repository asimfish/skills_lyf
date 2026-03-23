---
name: config
description: Manage teaching configuration — scaffold prompts, show resolved config, validate settings
---

# Teaching Configuration Management

Manage `.flow/` prompts, teaching style configs, and per-week variables.

**Usage:**
```
/teaching:config <subcommand> [options]
```

**Subcommands:**
```
# Copy a default prompt template to .flow/ for customization
/teaching:config scaffold <type>

# Display the resolved 4-layer config hierarchy
/teaching:config show [--command CMD] [--week N] [--prompt TYPE]

# Pre-flight validation of all .flow/ configuration
/teaching:config validate [--strict] [--json]

# Compare project prompts against Scholar defaults (Phase 2)
/teaching:config diff [TYPE]

# Show generation provenance for a file (Phase 3)
/teaching:config trace <file>
```

**Scaffold Examples:**
```
# Copy lecture-notes prompt for customization
/teaching:config scaffold lecture-notes

# Copy quiz prompt
/teaching:config scaffold quiz
```

**Show Examples:**
```
# Show all resolved config
/teaching:config show

# Show config for a specific command
/teaching:config show --command lecture

# Show config for a specific week
/teaching:config show --command lecture --week 4

# Show resolved prompt template
/teaching:config show --prompt lecture-notes
```

**Validate Examples:**
```
# Validate all configuration
/teaching:config validate

# Strict mode (warnings = errors)
/teaching:config validate --strict

# JSON output for CI/CD
/teaching:config validate --json
```

**Valid Scaffold Types:**
- `lecture-notes`, `lecture-outline`, `section-content`
- `exam`, `quiz`, `slides`, `revealjs-slides`
- `assignment`, `syllabus`, `rubric`, `feedback`

<system>
This command manages teaching configuration with subcommand routing.

## Implementation

```javascript
import { ConfigScaffolder } from '../../../teaching/config/scaffolder.js';
import { ConfigShow } from '../../../teaching/config/config-show.js';
import { ConfigPreflightValidator } from '../../../teaching/config/config-preflight.js';
import { PromptDiffEngine } from '../../../teaching/config/prompt-diff.js';
import { ProvenanceTracer, ProvenanceError } from '../../../teaching/config/provenance.js';
import { existsSync } from 'fs';
import { join, relative } from 'path';

// Parse user input
const args = parseArgs(userInput);
const subcommand = args._[0];
const debug = args.debug || process.env.SCHOLAR_DEBUG === 'true';
const cwd = process.cwd();

// ANSI colors
const useColor = !args['no-color'] && !args.json;
const c = useColor ? {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
  gray: '\x1b[90m', bold: '\x1b[1m', dim: '\x1b[2m'
} : { reset: '', red: '', green: '', yellow: '', blue: '', cyan: '', gray: '', bold: '', dim: '' };

if (!subcommand) {
  console.log(`${c.bold}Usage:${c.reset} /teaching:config <subcommand> [options]\n`);
  console.log(`${c.bold}Subcommands:${c.reset}`);
  console.log(`  ${c.cyan}scaffold${c.reset} <type>    Copy default prompt to .flow/ for customization`);
  console.log(`  ${c.cyan}show${c.reset}              Display resolved 4-layer config hierarchy`);
  console.log(`  ${c.cyan}validate${c.reset}          Pre-flight check of all .flow/ configuration`);
  console.log(`  ${c.cyan}diff${c.reset} [type]       Compare project prompts vs Scholar defaults`);
  console.log(`  ${c.cyan}trace${c.reset} <file>      Show generation provenance for a file`);
  console.log(`\nRun /teaching:config <subcommand> --help for details.`);
  process.exit(0);
}

switch (subcommand) {
  case 'scaffold': {
    const type = args._[1];
    if (!type) {
      console.log(`${c.red}Error:${c.reset} Missing prompt type.`);
      console.log(`${c.bold}Usage:${c.reset} /teaching:config scaffold <type>`);
      console.log(`\n${c.bold}Valid types:${c.reset} lecture-notes, lecture-outline, section-content, exam, quiz, slides, revealjs-slides, assignment, syllabus, rubric, feedback`);
      process.exit(1);
    }

    const scaffolder = new ConfigScaffolder({ cwd, debug });
    const result = await scaffolder.scaffold(type);

    if (result.alreadyExists) {
      console.log(`${c.yellow}Warning:${c.reset} Project prompt already exists: ${relative(cwd, result.targetPath)}`);
      console.log(`  Delete the file to revert to Scholar defaults.`);
      process.exit(0);
    }

    console.log(`${c.green}Created:${c.reset} ${relative(cwd, result.targetPath)}`);
    console.log(`  Source: Scholar v${result.scholarVersion} default prompt`);
    console.log(`  Variables: ${result.requiredVars} required, ${result.optionalVars} optional`);
    console.log(`\nEdit this file to customize ${type} generation.`);
    console.log(`The original default is preserved in Scholar — delete your copy to revert.`);
    break;
  }

  case 'show': {
    const command = args.command || args.cmd || null;
    const week = args.week ? parseInt(args.week, 10) : null;
    const promptType = args.prompt || null;

    const configShow = new ConfigShow({ cwd, debug });
    const result = await configShow.show({ command, week, promptType });

    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.formatted);
    }
    break;
  }

  case 'validate': {
    const strict = args.strict || false;
    const jsonOutput = args.json || false;
    const quiet = args.quiet || false;

    const validator = new ConfigPreflightValidator({ cwd, debug, strict });
    const result = await validator.validate();

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.formatted);
    }

    const exitCode = strict
      ? (result.errors + result.warnings > 0 ? 1 : 0)
      : (result.errors > 0 ? 1 : 0);
    process.exit(exitCode);
  }

  case 'diff': {
    const diffType = args._[1] || null;
    const diffEngine = new PromptDiffEngine({ cwd, debug });

    try {
      if (diffType) {
        const result = await diffEngine.diffType(diffType);
        if (args.json) {
          const { formatted, ...data } = result;
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(result.formatted);
        }
      } else {
        const result = await diffEngine.diffAll();
        if (args.json) {
          const data = {
            prompts: result.prompts.map(({ formatted, ...rest }) => rest),
            summary: result.summary
          };
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(result.formatted);
        }
      }
    } catch (err) {
      console.log(`${c.red}Error:${c.reset} ${err.message}`);
      process.exit(1);
    }
    break;
  }

  case 'trace': {
    const traceFile = args._[1];
    if (!traceFile) {
      console.log(`${c.red}Error:${c.reset} Missing file path.`);
      console.log(`${c.bold}Usage:${c.reset} /teaching:config trace <file>`);
      console.log(`\nExample: /teaching:config trace lectures/week-04_model-diagnostics.qmd`);
      process.exit(1);
    }

    const tracer = new ProvenanceTracer({ cwd, debug });

    try {
      const result = await tracer.trace(traceFile);

      if (args.json) {
        const { formatted, ...data } = result;
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(result.formatted);
      }
    } catch (err) {
      if (err instanceof ProvenanceError) {
        console.log(`${c.red}Error:${c.reset} ${err.message}`);
      } else {
        console.log(`${c.red}Error:${c.reset} ${err.message}`);
      }
      process.exit(1);
    }
    break;
  }

  default: {
    console.log(`${c.red}Error:${c.reset} Unknown subcommand: "${subcommand}"`);
    console.log(`${c.bold}Valid subcommands:${c.reset} scaffold, show, validate, diff, trace`);
    process.exit(1);
  }
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

## Subcommands

| Subcommand | Module | Status |
|------------|--------|--------|
| `scaffold` | `src/teaching/config/scaffolder.js` | Phase 1 |
| `show` | `src/teaching/config/config-show.js` | Phase 1 |
| `validate` | `src/teaching/config/config-preflight.js` | Phase 1 |
| `diff` | `src/teaching/config/prompt-diff.js` | Phase 2 (implemented) |
| `trace` | `src/teaching/config/provenance.js` | Phase 3 (implemented) |

## Follow-up Actions

After using config commands:
- `scaffold` → Edit the copied prompt to customize generation
- `show` → Review config hierarchy for unexpected overrides
- `validate` → Fix reported issues, then run `/teaching:sync`
</system>
