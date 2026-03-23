# GitHub Actions Setup for Scholar

This guide explains how to set up automated validation for your course repositories using the Scholar GitHub Actions workflow.

## Overview

The Scholar validation workflow provides:

1. **YAML Syntax Validation** - Ensures all YAML configuration files are valid
2. **Schema Validation** - Validates `teach-config.yml` and `teaching-style.yml` against expected schemas
3. **Sync Check** - Verifies YAML and JSON files are synchronized

## Quick Start

### Option 1: Copy the Workflow (Recommended)

Copy the workflow file to your course repository:

```bash
# From your course repository root
mkdir -p .github/workflows
curl -o .github/workflows/scholar-validate.yml \
  https://raw.githubusercontent.com/Data-Wise/scholar/main/.github/workflows/scholar-validate.yml
```

Commit and push:

```bash
git add .github/workflows/scholar-validate.yml
git commit -m "ci: add Scholar config validation"
git push
```

### Option 2: Reference as Reusable Workflow

Create `.github/workflows/validate.yml` in your repository:

```yaml
name: Validate Course Configs

on:
  push:
    branches: ['*']
  pull_request:
    branches: [main]

jobs:
  validate:
    uses: Data-Wise/scholar/.github/workflows/scholar-validate.yml@main
```

## Workflow Triggers

The workflow runs automatically when:

| Event        | Trigger                                            |
| ------------ | -------------------------------------------------- |
| Push         | Any branch, when YAML files in config paths change |
| Pull Request | To `main` or `dev`, when YAML files change         |
| Manual       | Via "Run workflow" button in GitHub Actions        |

### Monitored Paths

The workflow watches these paths for changes:

- `content/lesson-plans/**/*.yml`
- `content/lesson-plans/**/*.yaml`
- `.claude/**/*.yml`
- `.claude/**/*.yaml`
- `.flow/teach-config.yml`
- `.flow/teaching-style.yml`

## Jobs Explained

### 1. validate-configs

Validates all YAML configuration files:

- **YAML Syntax Check** - Ensures files are valid YAML
- **teach-config Schema** - Validates course configuration structure
- **teaching-style Schema** - Validates teaching style configuration

#### teach-config.yml Schema

Required structure:

```yaml
scholar:
  course_info:
    level: undergraduate | graduate
    field: string
    difficulty: beginner | intermediate | advanced

  defaults:
    exam_format: markdown | md | quarto | qmd | latex | tex | json
    lecture_format: markdown | md | quarto | qmd | latex | tex | json
    question_types:
      - multiple-choice
      - short-answer
      - essay

  style:
    tone: formal | conversational
    notation: string
    examples: boolean
```

#### teaching-style.yml Schema

Expected structure:

```yaml
teaching_style:
  philosophy:
    approach: string

  pedagogy:
    scaffolding: minimal | moderate | extensive

  tone:
    formality: casual | conversational | formal | academic

  notation:
    math_style: inline | display | mixed
```

### 2. sync-check

Ensures YAML source files are synchronized with their JSON counterparts:

- Compares `*.yml` files with corresponding `*.json` files
- Reports files that need synchronization
- On **push**: Fails if files are out of sync
- On **PR**: Issues a warning but doesn't block

#### Fixing Sync Issues

If the sync check fails, run locally:

```bash
# Using the sync script
node scripts/sync-yaml.js --force

# Or using npm script (if configured)
npm run sync

# Then commit
git add -A
git commit -m "chore: sync YAML to JSON"
git push
```

### 3. summary

Provides a final summary of all validation results.

## Manual Workflow Run

You can manually trigger the workflow from the GitHub Actions tab:

1. Go to **Actions** tab in your repository
2. Select **Scholar Config Validation**
3. Click **Run workflow**
4. Optional: Enable debug logging or force sync

### Workflow Dispatch Inputs

| Input        | Description                            | Default |
| ------------ | -------------------------------------- | ------- |
| `force_sync` | Force re-sync all files (ignore cache) | `false` |
| `debug`      | Enable debug logging                   | `false` |

## Example Repository Structure

A typical course repository using Scholar:

```
my-course/
├── .github/
│   └── workflows/
│       └── scholar-validate.yml    # The validation workflow
├── .flow/
│   ├── teach-config.yml            # Course configuration
│   └── teaching-style.yml          # Teaching style preferences
├── content/
│   └── lesson-plans/
│       ├── week-01/
│       │   ├── lecture-01.yml      # Lesson plan (YAML source)
│       │   └── lecture-01.json     # Generated JSON (synced)
│       └── week-02/
│           ├── lecture-02.yml
│           └── lecture-02.json
├── .claude/
│   └── course-config.yml           # Optional Claude-specific config
└── package.json                    # Optional, for npm dependencies
```

## Troubleshooting

### "No YAML config files found"

This is normal if your repository doesn't have any YAML files in the expected locations. The workflow will exit successfully with a notice.

### "YAML/JSON files are out of sync"

Run the sync script locally:

```bash
node scripts/sync-yaml.js --force
```

If you don't have the script, install Scholar:

```bash
npm install @data-wise/scholar
npx scholar sync
```

### Schema Validation Errors

Check your configuration files match the expected schema. Common issues:

- Missing `scholar:` root key in `teach-config.yml`
- Invalid `level` value (must be `undergraduate` or `graduate`)
- Invalid `difficulty` value (must be `beginner`, `intermediate`, or `advanced`)
- Invalid `tone` value (must be `formal` or `conversational`)

### "Module not found: js-yaml"

The workflow automatically installs `js-yaml` for course repositories without `package.json`. If you see this error, ensure you're using Node.js 20+.

## Best Practices

1. **Always validate locally first** - Run `node scripts/sync-yaml.js --status` before pushing
2. **Use pre-commit hooks** - Set up a pre-commit hook to auto-sync YAML files
3. **Keep JSON files committed** - While generated, they should be in version control for CI validation
4. **Review PR warnings** - The sync check warns on PRs but doesn't block; fix before merging

## Pre-commit Hook Setup

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
node scripts/sync-yaml.js --quiet
if [ $? -ne 0 ]; then
  echo "YAML sync failed. Please fix errors before committing."
  exit 1
fi

# Stage any synced JSON files
git add content/lesson-plans/**/*.json .claude/**/*.json 2>/dev/null || true
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

## Related Resources

- [Scholar Plugin Documentation](https://github.com/Data-Wise/scholar/blob/main/README.md)
- [Sync Engine API](https://github.com/Data-Wise/scholar/blob/main/src/teaching/config/sync-engine.js)
- [Configuration Loader](https://github.com/Data-Wise/scholar/blob/main/src/teaching/config/loader.js)

## Support

- **Issues**: [GitHub Issues](https://github.com/Data-Wise/scholar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions)
