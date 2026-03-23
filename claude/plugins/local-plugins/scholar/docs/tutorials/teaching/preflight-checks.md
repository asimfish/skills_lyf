# Tutorial: Preflight Checks

**Time:** 10 minutes
**Prerequisites:**

- Scholar plugin installed ({{ scholar.version }}+)
- Claude Code running with ANTHROPIC_API_KEY set
- A Scholar project with `package.json`, `mkdocs.yml`, and `CHANGELOG.md`

**What you'll learn:**

- Run pre-release health checks with `/teaching:preflight`
- Understand pass/warn/fail output for each check
- Use `--fix` to auto-correct common issues
- Use `--json` for CI pipeline integration
- Use `--quick` to skip slow checks
- Integrate preflight into your release workflow

---

## Overview

`/teaching:preflight` runs six project health checks in one command, catching the issues that most commonly cause CI failures and release friction: version drift, merge conflict markers, stale test counts, leftover cache files, CHANGELOG mismatches, and outdated `.STATUS` files.

**Why run preflight checks?**

- Version strings drift across `package.json`, `plugin.json`, and `mkdocs.yml`
- Merge conflict markers (`<<<<<<<`) can survive into commits unnoticed
- Test counts in `mkdocs.yml` go stale after adding or removing tests
- `src/discovery/cache.json` should not exist in committed code
- CHANGELOG entries get missed during multi-phase releases

**What you'll get:**

```
/teaching:preflight

  Preflight checks for scholar v2.15.0

  ┌──────────────────┬────────┬──────────────────────────┐
  │ Check            │ Status │ Detail                   │
  ├──────────────────┼────────┼──────────────────────────┤
  │ Version sync     │ PASS   │ v2.15.0 everywhere       │
  │ Conflict markers │ PASS   │ No markers found         │
  │ Test counts      │ PASS   │ 2,960 matches mkdocs.yml │
  │ Cache cleanup    │ PASS   │ No stale cache           │
  │ CHANGELOG        │ PASS   │ v2.15.0 entry found      │
  │ .STATUS          │ PASS   │ Updated today            │
  └──────────────────┴────────┴──────────────────────────┘

  Result: 6 passed, 0 warnings, 0 failed
```

---

## Step 1: Run Basic Preflight Checks

**What to do:**

Run `/teaching:preflight` with no flags to check all six areas.

**Example:**

```bash
/teaching:preflight
```

**What happens:**

1. Scholar reads `package.json`, `plugin.json`, and `mkdocs.yml` to compare version strings
2. All `.md` and `.js` files are scanned for merge conflict markers
3. The test suite runs and actual counts are compared to `mkdocs.yml` values
4. `src/discovery/cache.json` is checked for existence
5. `CHANGELOG.md` is checked for an entry matching the current version
6. `.STATUS` is checked for recency

**Checkpoint:**

- All six checks should appear in the output table
- Review any WARN or FAIL entries before proceeding with your release

---

## Step 2: Understand the Output

Each check gets one of three statuses:

| Status | Meaning | Action Needed |
|--------|---------|---------------|
| **PASS** | Check passed | None |
| **WARN** | Non-critical issue detected | Review but not blocking |
| **FAIL** | Critical issue found | Fix before releasing |

The exit code reflects the overall result: **0** if all checks pass, **1** if any check fails. Warnings do not cause a non-zero exit.

---

## Step 3: The Six Checks Explained

### Check 1: Version Sync

Compares the version string in `package.json`, `plugin.json`, and `mkdocs.yml extra.scholar.version`. All three must match.

```
  │ Version sync     │ FAIL   │ package.json=2.15.0, mkdocs.yml=2.14.0 │
```

**Common cause:** You bumped `package.json` but forgot to run the version sync script.

**Fix:** Run `node scripts/version-sync.js --version 2.15.0` or use `--fix` (see Step 4).

### Check 2: Conflict Markers

Scans all `.md` and `.js` files for Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).

```
  │ Conflict markers │ FAIL   │ src/plugin-api/commands/teaching/solution.md:90 │
```

**Common cause:** A merge or rebase left conflict markers that were accidentally committed.

**Fix:** Open the file, resolve the conflict manually, and commit the fix.

### Check 3: Test Counts

Runs the test suite and compares actual pass counts to the values stored in `mkdocs.yml` (`extra.scholar.jest_count`, `extra.scholar.node_test_count`).

```
  │ Test counts      │ WARN   │ Jest: 2,960 actual vs 2,877 in mkdocs.yml │
```

**Common cause:** New tests were added but `mkdocs.yml` was not updated.

**Fix:** Update the counts in `mkdocs.yml` or use `--fix` to auto-update them.

### Check 4: Cache Cleanup

Checks whether `src/discovery/cache.json` exists. This file is generated at runtime and should not be committed.

```
  │ Cache cleanup    │ WARN   │ src/discovery/cache.json exists │
```

**Common cause:** Running discovery tests locally generates the cache file.

**Fix:** Delete the file (`rm src/discovery/cache.json`) or use `--fix`.

### Check 5: CHANGELOG Lint

Verifies that `CHANGELOG.md` has an entry for the current version (from `package.json`).

```
  │ CHANGELOG        │ FAIL   │ No entry for v2.15.0 │
```

**Common cause:** Version was bumped but the CHANGELOG entry has not been written yet.

**Fix:** Add a `## v2.15.0` section to `CHANGELOG.md` with the release notes.

### Check 6: .STATUS Freshness

Checks when `.STATUS` was last modified relative to today.

```
  │ .STATUS          │ WARN   │ Last updated 5 days ago │
```

**Common cause:** Development continued but `.STATUS` was not kept current.

**Fix:** Update `.STATUS` with the current project state.

---

## Step 4: Auto-Fix Issues with `--fix`

Use `--fix` to automatically correct issues that have deterministic solutions:

```bash
/teaching:preflight --fix
```

**What `--fix` can repair:**

| Check | Auto-Fix Action |
|-------|----------------|
| Version sync | Runs `version-sync.js` to align all version strings |
| Cache cleanup | Deletes `src/discovery/cache.json` |
| Test counts | Updates `mkdocs.yml` with actual test counts |

**What `--fix` cannot repair:**

| Check | Why Manual |
|-------|-----------|
| Conflict markers | Requires human judgment to resolve |
| CHANGELOG | Release notes must be written by hand |
| .STATUS | Project status requires human context |

**Example output with `--fix`:**

```
  Preflight checks for scholar v2.15.0 (auto-fix enabled)

  ┌──────────────────┬────────┬──────────────────────────────────┐
  │ Check            │ Status │ Detail                           │
  ├──────────────────┼────────┼──────────────────────────────────┤
  │ Version sync     │ FIXED  │ Updated mkdocs.yml → v2.15.0    │
  │ Conflict markers │ PASS   │ No markers found                 │
  │ Test counts      │ FIXED  │ Updated mkdocs.yml → 2,960      │
  │ Cache cleanup    │ FIXED  │ Deleted cache.json               │
  │ CHANGELOG        │ PASS   │ v2.15.0 entry found              │
  │ .STATUS          │ WARN   │ Last updated 2 days ago          │
  └──────────────────┴────────┴──────────────────────────────────┘

  Result: 3 passed, 1 warning, 0 failed, 3 fixed
```

---

## Step 5: JSON Output for CI Integration

Use `--json` to get machine-readable output for automated pipelines:

```bash
/teaching:preflight --json
```

**Output:**

```json
{
  "version": "2.15.0",
  "checks": [
    {"name": "version_sync", "status": "pass", "detail": "v2.15.0 everywhere"},
    {"name": "conflict_markers", "status": "pass", "detail": "No markers found"},
    {"name": "test_counts", "status": "pass", "detail": "2,960 matches mkdocs.yml"},
    {"name": "cache_cleanup", "status": "pass", "detail": "No stale cache"},
    {"name": "changelog", "status": "pass", "detail": "v2.15.0 entry found"},
    {"name": "status_file", "status": "warn", "detail": "Last updated 2 days ago"}
  ],
  "summary": {"pass": 5, "warn": 1, "fail": 0},
  "exit_code": 0
}
```

### GitHub Actions integration

```yaml
# .github/workflows/release-preflight.yml
name: Release Preflight
on:
  pull_request:
    branches: [main]
jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run preflight checks
        run: |
          # Run preflight in JSON mode, skip test counts (slow in CI)
          npx scholar teaching:preflight --json --quick > preflight.json
          # Fail if any check failed
          EXIT=$(jq '.exit_code' preflight.json)
          if [ "$EXIT" -ne 0 ]; then
            echo "Preflight failed:"
            jq '.checks[] | select(.status == "fail")' preflight.json
            exit 1
          fi
```

---

## Step 6: Quick Mode with `--quick`

Use `--quick` to skip slow checks (test count validation requires running the full test suite):

```bash
/teaching:preflight --quick
```

**What `--quick` skips:**

- Test count validation (saves 30-60 seconds)

**What `--quick` still runs:**

- Version sync (fast file reads)
- Conflict marker scan (fast grep)
- Cache cleanup check (file existence)
- CHANGELOG lint (fast file read)
- .STATUS freshness (file metadata)

This is useful during active development when you want a quick sanity check without waiting for the full test suite.

---

## Step 7: Integrate into Your Release Workflow

The recommended release workflow uses preflight as the first step:

```
1. /teaching:preflight --fix     ← Fix what can be fixed
2. Review remaining WARN/FAIL    ← Fix manually
3. /teaching:preflight            ← Confirm all green
4. git add . && git commit        ← Commit the fixes
5. gh pr create --base dev        ← Open the PR
```

### Pre-commit hook

Add preflight as a pre-commit hook to catch issues before they enter version control:

```bash
#!/bin/bash
# .git/hooks/pre-commit — run quick preflight checks

# Only run on dev and main branches
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "dev" && "$BRANCH" != "main" ]]; then
  exit 0
fi

echo "Running preflight checks..."
npx scholar teaching:preflight --quick --json > /tmp/preflight.json 2>/dev/null

FAILS=$(jq '.summary.fail' /tmp/preflight.json)
if [ "$FAILS" -gt 0 ]; then
  echo "Preflight failed. Run '/teaching:preflight' for details."
  exit 1
fi

echo "Preflight passed."
exit 0
```

---

## Troubleshooting

### "package.json not found"

**Cause:** The command was run outside a Scholar project directory.

**Solution:** Navigate to the project root where `package.json` exists, or specify the project path.

### "Test count check timed out"

**Cause:** The test suite took longer than the default timeout.

**Solution:** Use `--quick` to skip test count validation, or increase the timeout with `--timeout 120`.

### "CHANGELOG entry not found" but it exists

**Cause:** The CHANGELOG heading format does not match the expected pattern. Preflight looks for `## v2.15.0` or `## [2.15.0]` at the start of a line.

**Solution:** Ensure your CHANGELOG uses a standard heading format:

```markdown
## v2.15.0 (2026-02-23)

### Features
- Added preflight checks
```

### "Version sync FAIL" after running `--fix`

**Cause:** The version sync script encountered an error or a file has `render_macros: false` set, requiring manual update.

**Solution:** Check the output of `node scripts/version-sync.js --dry-run` for the list of files that need updating, and fix any that the script cannot handle.

---

## Additional Options

| Flag | Purpose | Example |
|------|---------|---------|
| `--fix` | Auto-fix correctable issues | `/teaching:preflight --fix` |
| `--json` | JSON output for CI | `/teaching:preflight --json` |
| `--quick` | Skip slow checks (test counts) | `/teaching:preflight --quick` |
| `--debug` | Show detailed check internals | `/teaching:preflight --debug` |

---

## Next Steps

### Integrate into your workflow

1. Run `/teaching:preflight` before every PR
2. Add `--fix` to your release preparation checklist
3. Use `--json --quick` in CI pipelines
4. Add the pre-commit hook for automatic checks

### Related Tutorials

- **[R Code Validation](r-code-validation.md)** -- Validate R code in `.qmd` files
- **[Config Management](config-management.md)** -- Manage teach-config.yml settings
- **[Sync & Diff Workflows](sync-and-diff.md)** -- Keep configuration in sync across environments

### Related Commands

- **`/teaching:validate`** -- Validate YAML configuration files
- **`/teaching:validate-r`** -- Validate R code in `.qmd` files
- **`/teaching:config`** -- Manage teaching configuration

---

**You've learned how to run preflight checks before releases.** Use `/teaching:preflight` as the first step in every release to catch issues early and avoid CI failures.
