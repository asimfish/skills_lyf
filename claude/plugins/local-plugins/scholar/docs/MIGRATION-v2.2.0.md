# Migration Guide: v2.1.0 → v2.2.0

**Author:** Scholar Development Team
**Date:** 2026-01-15
**Upgrade Time:** ~15 minutes
**Breaking Changes:** None
**Backward Compatibility:** 100% (v2.1.0 configs work as-is)

---

## Overview

Scholar v2.2.0 introduces automatic YAML→JSON synchronization, validation tools, and GitHub Actions integration. All v2.1.0 features continue to work unchanged.

### What's New

- ✨ `--config` flag for all teaching commands (flow-cli integration)
- ✨ Automatic YAML→JSON sync with hash-based change detection
- ✨ 3 new commands: `/teaching:validate`, `/teaching:diff`, `/teaching:sync`
- ✨ Pre-commit hook for validation and sync
- ✨ GitHub Actions workflow for CI/CD

### No Action Required

- Existing v2.1.0 configs work without changes
- No schema changes to YAML files
- Commands have same interface (new `--config` flag is optional)

---

## Quick Upgrade

### Option 1: Homebrew (Recommended)

```bash
# Update tap
brew update

# Upgrade scholar
brew upgrade scholar

# Verify version
ls -la ~/.claude/plugins/scholar
cat ~/.claude/plugins/scholar/.claude-plugin/plugin.json | grep version
```

**Expected:** `"version": "2.2.0"`

### Option 2: Manual (Development)

```bash
# Navigate to source directory
cd ~/projects/dev-tools/scholar

# Pull latest changes
git checkout main
git pull origin main

# Reinstall plugin
./scripts/install.sh --dev

# Verify installation
npm test
```

---

## What Changed

### 1. New Commands (Phase C)

Three new validation and sync commands:

```bash
# Validate YAML configuration
/teaching:validate .flow/teach-config.yml

# Check YAML→JSON sync status
/teaching:diff teach-config.yml

# Manually sync YAML to JSON
/teaching:sync
```

### 2. -config Flag (Phase A)

All teaching commands now accept explicit config path:

```bash
# Before (v2.1.0 - still works)
/teaching:quiz "Linear Regression"

# After (v2.2.0 - new option)
/teaching:quiz "Linear Regression" --config /path/to/config.yml
```

### Use Cases

- Automation tools (flow-cli, scripts)
- Non-standard config locations
- Testing with multiple configs

### 3. Sync Engine (Phase B)

Automatic YAML→JSON synchronization with < 100ms latency:

```
YAML (edit)  ──→  JSON (auto-generated)
     ↓
  Validation
     ↓
  Hash cache
```

### Features

- Hash-based change detection (SHA-256)
- Skip unchanged files (~5ms overhead)
- Pre-command hook integration
- Cache: `.scholar-cache/sync-status.json`

### 4. GitHub Actions Integration (Phase D)

Optional CI/CD validation workflows:

```yaml
# .github/workflows/scholar-validate.yml
uses: data-wise/scholar/.github/workflows/scholar-validate.yml@main
```

See `docs/github-actions-setup.md` for setup instructions.

---

## Migration Steps

### Step 1: Upgrade Scholar

Follow [Quick Upgrade](#quick-upgrade) instructions above.

### Step 2: Verify Installation

```bash
# Check plugin directory
ls -la ~/.claude/plugins/scholar

# Run tests (if installed from source)
cd ~/projects/dev-tools/scholar
npm test
```

**Expected:** All tests pass (1,024 tests)

### Step 3: Test Existing Configs

Your v2.1.0 configs should work without changes:

```bash
# Test a command with existing config
/teaching:quiz "Linear Regression"

# Validate your existing config (optional)
/teaching:validate .flow/teach-config.yml
```

**Expected:** No errors (warnings OK)

### Step 4: Enable Auto-Sync (Optional)

To enable automatic YAML→JSON sync, set up the pre-commit hook:

```bash
cd your-course-repo

# Install pre-commit hook
npm install -g @data-wise/scholar
scholar setup-hooks

# Verify hook installed
ls -la .git/hooks/pre-commit
```

### What it does

- Validates YAML on every commit
- Syncs YAML→JSON automatically
- Blocks commits with validation errors

### Step 5: Test Sync Engine

```bash
# Edit your YAML config
vim .flow/teach-config.yml

# Check sync status
/teaching:diff teach-config.yml

# Manual sync (if needed)
/teaching:sync
```

**Expected:** `inSync: true`, JSON file updated

---

## Configuration Changes

### No Schema Changes

YAML schema is **unchanged** from v2.1.0:

```yaml
# v2.1.0 config (still valid in v2.2.0)
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
```

### New .gitignore Entries (Recommended)

Add to your `.gitignore`:

```gitignore
# Scholar auto-generated files
*.json        # Auto-generated from YAML
.scholar-cache/
```

**Why:** JSON files are generated from YAML, no need to track both

### New Directory Structure (Auto-Created)

```
course-repo/
├── .scholar-cache/          # Hash tracking (auto-created)
│   └── sync-status.json
└── .flow/
    ├── teach-config.yml     # Source (you edit)
    └── teach-config.json    # Generated (auto-synced)
```

---

## Testing the Upgrade

### 1. Command Compatibility

Test that existing commands work:

```bash
# All v2.1.0 commands should work unchanged
/teaching:quiz "Hypothesis Testing"
/teaching:exam midterm
/teaching:syllabus "Statistics 101"
/teaching:lecture "Linear Regression"
```

### 2. New -config Flag

Test explicit config path:

```bash
/teaching:quiz "ANOVA" --config $(pwd)/.flow/teach-config.yml
```

**Expected:** Quiz generated using specified config

### 3. Validation

Test config validation:

```bash
/teaching:validate .flow/teach-config.yml
```

### Expected

- ✅ Valid config: "Validation passed"
- ❌ Invalid config: IDE-style error messages

### 4. Sync Status

Test YAML→JSON sync:

```bash
# Check sync status 2
/teaching:diff teach-config.yml

# Manual sync
/teaching:sync

# Verify JSON created
ls -la .flow/teach-config.json
```

**Expected:** JSON file matches YAML content

---

## Troubleshooting

### Issue: "Command not found: /teaching:validate"

**Cause:** Plugin not properly upgraded

### Fix (Troubleshooting)

```bash
# Reinstall plugin 2
cd ~/projects/dev-tools/scholar
./scripts/install.sh --dev

# Restart Claude Code
exit
claude
```

### Issue: "Config validation failed"

**Cause:** Invalid YAML syntax or schema

### Fix (Restart Claude Code)

```bash
# Run validator to see detailed errors
/teaching:validate .flow/teach-config.yml

# Fix errors (file:line:col shown)
vim .flow/teach-config.yml

# Re-validate
/teaching:validate .flow/teach-config.yml
```

### Issue: "Sync status out of date"

**Cause:** Hash cache stale or corrupted

### Fix (Re-validate)

```bash
# Clear cache
rm -rf .scholar-cache/

# Re-sync
/teaching:sync

# Verify
/teaching:diff teach-config.yml
```

### Issue: "Pre-commit hook not running"

**Cause:** Hook not executable or not installed

### Fix (Verify)

```bash
# Reinstall hook
scholar setup-hooks

# Make executable
chmod +x .git/hooks/pre-commit

# Test manually
.git/hooks/pre-commit
```

### Issue: "-config flag not working"

**Cause:** Old version still loaded

### Fix (Test manually)

```bash
# Verify version 2
cat ~/.claude/plugins/scholar/.claude-plugin/plugin.json | grep version

# Should show: "version": "2.2.0"

# If not, reinstall
./scripts/install.sh --dev

# Restart Claude
exit
claude
```

---

## Rollback (if needed)

If you need to revert to v2.1.0:

### Homebrew

```bash
# Uninstall v2.2.0
brew uninstall scholar

# Install specific version (when available)
brew install scholar@2.1.0
```

### Manual

```bash
cd ~/projects/dev-tools/scholar

# Checkout v2.1.0
git checkout v2.1.0

# Reinstall
./scripts/install.sh --dev
```

**Note:** v2.2.0 is backward compatible, so rollback should rarely be needed

---

## New Workflows

### Workflow 1: Automated Config Validation

### Before v2.2.0 (New Workflows)

```bash
# Manual validation required
vim .flow/teach-config.yml
# Hope it's valid...
git commit -m "Update config"
```

### With v2.2.0 (Hope its valid...)

```bash
# Automatic validation on commit
vim .flow/teach-config.yml
git add .flow/teach-config.yml
git commit -m "Update config"
# Hook validates and syncs automatically
```

### Workflow 2: CI/CD Integration

### Before v2.2.0 (Hook validates and)

```bash
# No automated validation in CI
```

### With v2.2.0 (No automated validation)

```yaml
# .github/workflows/validate.yml
name: Validate Configs
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate
        run: |
          npm install -g @data-wise/scholar
          scholar validate .flow/teach-config.yml
```

### Workflow 3: flow-cli Integration

### Before v2.2.0 (.github/workflows/validate.yml)

```bash
# flow-cli relies on directory search
claude --print "/teaching:exam Midterm"
```

### With v2.2.0 (flow-cli relies on)

```bash
# flow-cli passes explicit config
claude --print "/teaching:exam Midterm --config $(pwd)/.flow/teach-config.yml"
```

---

## Performance Impact

### Before v2.2.0 (Performance Impact)

- Command execution: ~1.5s
- Config loading: ~20ms (directory search)

### After v2.2.0

- Command execution: ~1.5s (unchanged)
- Config loading: ~25ms (5ms hash check + 20ms load)
- Sync overhead: < 5ms (if unchanged), ~80ms (if changed)

**Net Impact:** < 5ms per command (negligible)

---

## FAQ

### Q: Do I need to update my YAML configs?

**A:** No. All v2.1.0 configs work unchanged in v2.2.0.

### Q: Can I keep using commands without -config flag?

**A:** Yes. The `--config` flag is optional. Directory search still works.

### Q: What happens to my JSON files?

**A:** They're auto-generated from YAML. Add `*.json` to `.gitignore` and let Scholar manage them.

### Q: Can I edit JSON files directly?

**A:** No. YAML is the source of truth. JSON files are overwritten on sync.

### Q: Do I need to set up pre-commit hooks?

**A:** No, it's optional. Hooks provide automatic validation but aren't required.

### Q: Can I use v2.2.0 without the sync engine?

**A:** Yes. The sync engine is automatic but you can ignore it. Commands work the same way.

### Q: What if validation fails on commit?

**A:** Fix the errors shown in the output, then re-commit. The hook blocks invalid configs.

### Q: Can I use custom validation rules?

**A:** Not yet. Custom rules planned for v2.3.0.

---

## Next Steps

After upgrading to v2.2.0:

1. ✅ **Test existing workflows** - Verify all commands work
2. ✅ **Enable pre-commit hook** - Automatic validation (optional)
3. ✅ **Add GitHub Actions** - CI/CD validation (optional)
4. ✅ **Update .gitignore** - Exclude auto-generated files
5. ✅ **Read WHATS-NEW-v2.2.0.md** - Learn about new features

---

## Support

**Issues:** https://github.com/Data-Wise/scholar/issues
**Discussions:** https://github.com/Data-Wise/scholar/discussions
**Documentation:** `docs/` directory

---

## Version History

| Version | Release Date | Key Features                                 |
| ------- | ------------ | -------------------------------------------- |
| v2.2.0  | 2026-01-15   | Sync engine, validation tools, --config flag |
| v2.1.0  | 2026-01-15   | /teaching:lecture command                    |
| v2.0.1  | 2026-01-14   | Bug fixes                                    |
| v2.0.0  | 2026-01-13   | Teaching commands foundation                 |

---

**Ready to upgrade!** Follow [Quick Upgrade](#quick-upgrade) to get started.
