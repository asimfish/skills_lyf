# CI/CD Pipeline Guide

Scholar runs 5 GitHub Actions workflows. This page documents their triggers, jobs, and common failure patterns.

> **See also:** [GitHub Actions Setup](../github-actions-setup.md) for course repository integration. This page covers Scholar's own CI pipelines.

---

## Workflow Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| [Scholar CI](#scholar-ci) | `ci.yml` | Push/PR to main, dev | Tests, structure validation, schema validation |
| [Documentation Validation](#documentation-validation) | `docs-validation.yml` | Push/PR with `.md` changes | Link checking, linting, spell check |
| [Deploy Documentation](#deploy-documentation) | `docs.yml` | Push to main | Deploy MkDocs to GitHub Pages |
| [Homebrew Release](#homebrew-release) | `homebrew-release.yml` | Release published | Update Homebrew formula |
| [Scholar Config Validation](#scholar-config-validation) | `scholar-validate.yml` | Push with YAML config changes | Validate YAML configs, check sync |

---

## Scholar CI

**File:** `.github/workflows/ci.yml`

**Triggers:** Push or PR to `main` or `dev`

### Jobs

| Job | Purpose | Failure = Block? |
|-----|---------|-----------------|
| `validate` | Check plugin structure (files, dirs, command count, hardcoded paths) | Yes |
| `test` | Run full Jest test suite (`npm test`) | Yes |
| `validate-schemas` | Validate JSON schemas with AJV, verify sync engine loads | Yes |
| `audit` | Dependency audit (`npm audit`) | No (`continue-on-error: true`) |

### Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Missing plugin.json` | File deleted or renamed | Restore `.claude-plugin/plugin.json` |
| `Expected at least 21 commands` | Command file removed | Check `src/plugin-api/commands/` for missing `.md` files |
| `Found hardcoded /Users/ paths` | Absolute path in command/lib file | Replace with relative path or `CLAUDE_PLUGIN_ROOT` |
| `Schema validation failed` | Invalid JSON Schema syntax | Fix schema against Draft-07 spec |
| Test failures | Code regression | Run `npm test` locally, check error output |

---

## Documentation Validation

**File:** `.github/workflows/docs-validation.yml`

**Triggers:**

- Push to `main` or `dev` when `.md`, `docs/**`, `.markdownlint.json` change
- PRs with markdown changes
- Manual dispatch (`workflow_dispatch`)

### Jobs

| Job | Purpose | Failure = Block? |
|-----|---------|-----------------|
| `markdown-link-check` | Verify all links resolve (uses `markdown-link-check`) | Yes |
| `markdown-lint` | Lint markdown style (uses `markdownlint-cli2`) | Yes |
| `doc-structure-check` | Verify required doc files exist, check internal links | Yes |
| `spell-check` | Spell check with `cspell` | No (warnings only) |

### Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Broken links | File renamed or deleted | Update all references or add to `.github/markdown-link-check-config.json` ignore list |
| MD010 (tabs) | Tab character in markdown | Replace with spaces |
| MD003 (heading style) | Setext headings (`===`) | Convert to ATX headings (`#`) |
| Missing required files | Required doc deleted | Restore the file (README.md, QUICK-START.md, etc.) |
| Spell check warnings | Technical terms | Add to `.cspell.json` words list |

### Exclusions

- `BRAINSTORM*.md` files are excluded from both linting and spell check
- `node_modules/` and `.git/` are always excluded
- Link check uses `.github/markdown-link-check-config.json` for ignore patterns

---

## Deploy Documentation

**File:** `.github/workflows/docs.yml`

**Triggers:** Push to `main`, or manual dispatch

**Jobs:** Single `deploy` job that:

1. Checks out repo (with `fetch-depth: 0` for git history)
2. Installs Python + `mkdocs-material`
3. Runs `mkdocs gh-deploy --force`

**Permissions:** Requires `contents: write` for pushing to `gh-pages` branch.

### Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build fails | Broken mkdocs.yml or missing referenced files | Run `mkdocs build` locally |
| Warning: page not in nav | File exists in `docs/` but not in `mkdocs.yml` nav | Add to nav or remove file |
| Deploy fails | GitHub Pages not configured | Ensure repo Settings > Pages > Source = gh-pages branch |

---

## Homebrew Release

**File:** `.github/workflows/homebrew-release.yml`

**Triggers:**

- Release published on GitHub
- Manual dispatch (with version input)

### Jobs

| Job | Purpose |
|-----|---------|
| `prepare` | Extract version, download release tarball, calculate SHA-256 |
| `update-homebrew` | Call reusable workflow in `Data-Wise/homebrew-tap` to update formula |

### How It Works

1. On release, extracts version from tag (strips `v` prefix)
2. Downloads tarball from `https://github.com/Data-Wise/scholar/archive/refs/tags/vX.Y.Z.tar.gz`
3. Computes SHA-256 of the tarball
4. Calls `Data-Wise/homebrew-tap/.github/workflows/update-formula.yml` with version and SHA
5. That workflow updates the formula file and optionally auto-merges

### Secrets Required

- `HOMEBREW_TAP_GITHUB_TOKEN` — PAT with access to `Data-Wise/homebrew-tap` repo

### Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| SHA mismatch | Tarball not yet available when workflow runs | Re-run the workflow after the release assets are published |
| Token expired | PAT expired | Regenerate and update in repo Settings > Secrets |
| Formula syntax error | Upstream formula template changed | Check `homebrew-tap` repo for breaking changes |

---

## Scholar Config Validation

**File:** `.github/workflows/scholar-validate.yml`

**Triggers:** Push or PR with changes to YAML config files (`.flow/*.yml`, `content/lesson-plans/*.yml`, `.claude/*.yml`)

### Jobs

| Job | Dependencies | Purpose |
|-----|-------------|---------|
| `validate-configs` | — | Validate YAML syntax, `teach-config.yml` schema, `teaching-style.yml` schema |
| `sync-check` | `validate-configs` | Check YAML-to-JSON synchronization status |
| `summary` | Both | Report overall status |

### Behavior by Event

- **Pull request:** Out-of-sync files produce a **warning** (non-blocking)
- **Push:** Out-of-sync files produce an **error** (blocking)

### Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| YAML syntax error | Invalid YAML in config file | Fix YAML syntax (check indentation) |
| Schema validation failed | Config value outside allowed enum | Check [Configuration Reference](../CONFIGURATION.md) for valid values |
| Files out of sync | YAML edited without re-syncing JSON | Run `node scripts/sync-yaml.js --force` locally |

---

## Adding a New Workflow

1. Create `.github/workflows/<name>.yml`
2. Define triggers (`on:`) — prefer path filters to avoid unnecessary runs
3. Use `actions/checkout@v4` and `actions/setup-node@v4` with Node 20
4. Add `npm ci` for dependency installation (not `npm install`)
5. Use `continue-on-error: true` for advisory checks (audit, spell check)
6. Document the workflow in this file
7. Test with `workflow_dispatch` before relying on automatic triggers
