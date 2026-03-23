# What's New in Scholar v2.2.0

**Release Date:** January 15, 2026
**Release Type:** Feature Release
**Backward Compatibility:** 100% (all v2.1.0 configs work unchanged)

---

## 🎉 Highlights

Scholar v2.2.0 brings **automatic YAML→JSON synchronization**, **validation tools**, and **GitHub Actions integration** to streamline your teaching workflow. Edit human-friendly YAML configs and let Scholar handle the rest—sync, validation, and error checking happen automatically.

### In a nutshell

- ✨ `--config` flag for all 11 teaching commands (flow-cli integration)
- ✨ Automatic YAML→JSON sync with < 100ms latency
- ✨ 3 new commands for validation and sync management
- ✨ Pre-commit hooks for automatic validation
- ✨ GitHub Actions workflows for CI/CD
- ✨ Hash-based caching for lightning-fast performance

---

## 🚀 Key Features

### 1. -config Flag (Flow-CLI Integration)

**Problem:** Automation tools couldn't explicitly pass config paths to Scholar commands

**Solution:** All teaching commands now accept `--config` flag

### Before v2.2.0 (🚀 Key Features)

```bash
# flow-cli had to rely on directory search
/teaching:quiz "Linear Regression"
```

### With v2.2.0 (flow-cli had to)

```bash
# flow-cli can pass explicit config path
/teaching:quiz "Linear Regression" --config /path/to/config.yml
```

### Why it matters (flow-cli can pass)

- **Automation-friendly** - Scripts and tools can specify exact config
- **Multi-config testing** - Test with different configs easily
- **CI/CD ready** - No ambiguity about which config is used
- **Debugging** - Clear visibility into config source with `[scholar:config]` logs

### Who benefits

- flow-cli users (automatic integration)
- Automation script writers
- CI/CD pipeline maintainers
- Multi-course instructors

---

### 2. Automatic YAML→JSON Sync

**Problem:** Manual YAML→JSON conversion was error-prone and slow

**Solution:** Automatic sync with hash-based change detection

### How it works

```
┌─────────────────┐         ┌──────────────────┐
│  YAML (source)  │ ────→   │  JSON (auto)     │
│  You edit this  │  sync   │  Never edit this │
└─────────────────┘         └──────────────────┘
     ↓                            ↓
  Validation                 Auto-generated
     ↓
  Hash cache (SHA-256)
```

### Workflow (flow-cli can pass)

```bash
# 1. Edit YAML (source of truth)
vim .flow/teach-config.yml

# 2. Sync happens automatically (pre-command hook)
/teaching:quiz "Hypothesis Testing"
# ↑ Sync runs before command executes

# 3. Or sync manually
/teaching:sync
```

### Performance

- **Unchanged files:** ~5ms (hash check only)
- **Changed files:** ~80ms (parse + validate + write)
- **Typical project (10 files):** ~150ms total

### Why it matters (3. Or sync manually)

- **Zero cognitive load** - Edit YAML, forget about JSON
- **Fast iteration** - No manual conversion steps
- **Always in sync** - Pre-command hook ensures configs are current
- **Safe** - Validation errors prevent broken configs

---

### 3. Three New Validation Commands

#### `/teaching:validate` - Schema Validation

Validate YAML configs against schema before commits:

```bash
/teaching:validate .flow/teach-config.yml
```

### 4-Level Validation

1. ✅ YAML Syntax (indentation, colons, quotes)
2. ✅ JSON Schema (required fields, data types, enums)
3. ✅ LaTeX Validation (math notation compiles)
4. ✅ Completeness (all required sections present)

### Output (3. Or sync manually)

```
teach-config.yml:12:5: error: Invalid Bloom's taxonomy level "remeber" (did you mean "remember"?)
teach-config.yml:18:3: warning: Missing "examples" field (recommended for intermediate difficulty)

❌ Validation failed (1 error, 1 warning)
```

### Use cases

- Pre-commit validation (catch errors before they hit main)
- CI/CD pipelines (block merges with invalid configs)
- Development debugging (find typos and schema errors)
- Migration testing (verify configs after upgrades)

---

#### `/teaching:diff` - Sync Status Checker

Check YAML→JSON sync status:

```bash
/teaching:diff teach-config.yml
```

### Output

```json
{
  "file": "teach-config.yml",
  "inSync": true,
  "yamlHash": "a3b2c1d4e5f6...",
  "jsonHash": "a3b2c1d4e5f6...",
  "lastSync": "2026-01-15T10:30:00Z",
  "cacheAge": "5m 30s"
}
```

### Sync states

- ✅ **In Sync** - YAML and JSON hashes match
- ⚠️ **Out of Sync** - YAML changed, need to run `/teaching:sync`
- ❌ **Missing JSON** - JSON file doesn't exist
- ❌ **Invalid YAML** - Validation errors

### Why it's useful

- **Debug sync issues** - See exactly what's out of sync
- **Pre-deployment checks** - Verify configs before going live
- **CI/CD validation** - Ensure all configs are synced
- **Cache inspection** - Check cache age and validity

---

#### `/teaching:sync` - Manual Sync Trigger

Force YAML→JSON sync:

```bash
/teaching:sync                    # Sync all YAML files
/teaching:sync teach-config.yml  # Sync specific file
/teaching:sync --force            # Force re-sync (ignore cache)
```

### When to use

- Testing config changes before committing
- Forcing full re-sync after cache issues
- Manual sync when pre-commit hook is disabled
- Debugging validation errors

### Output - 3. Or sync

```
Syncing 10 YAML files...

✅ teach-config.yml → teach-config.json (80ms)
⏭️ week01.yml (unchanged, skipped)
✅ week03.yml → week03.json (75ms)
❌ week04.yml (validation failed)

Summary:
  2 synced, 7 skipped, 1 failed
  Total time: 155ms
```

---

### 4. Pre-Commit Hook Integration

### Automatic validation on every commit

```bash
# Install hook (one-time setup)
scholar setup-hooks

# Now every commit validates configs automatically
git add .flow/teach-config.yml
git commit -m "Update grading policy"
# ↑ Hook validates and syncs before commit
```

### What the hook does

1. Finds all `*.yml` files in `.flow/` and `content/`
2. Validates each file (4-level validation)
3. Syncs YAML→JSON
4. Blocks commit if validation fails

### Benefits (↑ Hook validates)

- **Prevent broken configs** - Can't commit invalid YAML
- **Always synced** - JSON files stay current automatically
- **Team consistency** - Everyone's configs validated
- **Zero extra steps** - Happens transparently

---

### 5. GitHub Actions Integration

### Automated CI/CD validation

```yaml
# .github/workflows/validate.yml
name: Validate Configs

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Scholar
        run: npm install -g @data-wise/scholar

      - name: Validate Configs
        run: scholar validate .flow/teach-config.yml

      - name: Check Sync Status
        run: scholar diff .flow/teach-config.yml
```

### Benefits (.github/workflows/validate.yml)

- **Block broken merges** - Invalid configs can't get to main
- **Team protection** - Everyone's changes validated automatically
- **Deployment safety** - Ensure configs are valid before deploy
- **Documentation** - CI logs show validation history

See `docs/github-actions-setup.md` for complete workflow templates.

---

## 📊 Performance Improvements

### Hash-Based Caching

Scholar v2.2.0 uses SHA-256 hashing to skip unchanged files:

### Before v2.2.0 (📊 Performance Improvements)

- Parse every YAML file on every command (~200ms for 10 files)

### With v2.2.0 (📊 Performance Improvements)

- Hash check for unchanged files (~5ms per file)
- Parse only changed files (~80ms per file)
- **10x faster** for typical workflows

### Cache location

```
.scholar-cache/
  sync-status.json    # Tracks file hashes and sync timestamps
```

---

## 🎯 Use Cases

### Use Case 1: Solo Instructor (Rapid Iteration)

### Workflow (🎯 Use Cases)

```bash
# Edit course config
vim .flow/teach-config.yml

# Test quiz generation (sync happens automatically)
/teaching:quiz "Linear Regression"

# Commit (pre-commit hook validates)
git add .flow/teach-config.yml
git commit -m "Add regression quiz"
```

### Benefits (Commit (pre-commit hook)

- Zero manual sync steps
- Validation prevents typos
- Fast iteration (< 100ms sync)

---

### Use Case 2: Team Course Development

### Workflow (Commit (pre-commit hook)

```yaml
# PR workflow with GitHub Actions
1. Developer edits YAML in feature branch
2. Push to GitHub
3. CI runs validation (blocks merge if invalid)
4. Team reviews PR
5. Merge to main (configs guaranteed valid)
```

### Benefits (PR workflow with)

- Team protection (can't merge broken configs)
- Consistent validation across team
- Audit trail in CI logs

---

### Use Case 3: Multi-Course Instructor

### Workflow (PR workflow with)

```bash
# Use -config to switch between courses
/teaching:quiz "Regression" --config ~/stat440/.flow/teach-config.yml
/teaching:quiz "ANOVA" --config ~/stat579/.flow/teach-config.yml
```

### Benefits (Use -config to)

- No directory switching required
- Clear config selection
- Test with different configs easily

---

### Use Case 4: Automation with flow-cli

### Workflow (Use -config to)

```bash
# flow-cli automatically passes config path
tweek        # Current week info
tlec 3       # Open week 3 lecture
tquiz 3      # Generate week 3 quiz
# ↑ flow-cli passes -config automatically
```

### Benefits (↑ flow-cli passes)

- Seamless integration with flow-cli
- No manual config path management
- Automation-ready

---

## 📚 Documentation

### New Documentation

- **MIGRATION-v2.2.0.md** - Upgrade guide from v2.1.0
- **WHATS-NEW-v2.2.0.md** - This file (feature overview)
- **docs/github-actions-setup.md** - CI/CD workflow setup
- **Updated README.md** - New commands, --config flag, sync workflow

### Updated Documentation

- **README.md** - Added Configuration & Sync Management section
- **USER-GUIDE.md** - v2.2.0 workflows and examples
- **ARCHITECTURE.md** - Sync engine architecture details
- **REFCARD.md** - Quick reference updated to v2.2.0

---

## 🔄 Backward Compatibility

### 100% backward compatible with v2.1.0

✅ All v2.1.0 configs work unchanged
✅ Commands have same interface (--config is optional)
✅ No schema changes to YAML files
✅ Directory search still works (no --config required)
✅ Can upgrade without changing any configs

### What's optional

- `--config` flag (directory search still works)
- Pre-commit hook (validation is optional)
- GitHub Actions (CI/CD is optional)
- Manual sync (auto-sync via pre-command hook)

---

## 🐛 Bug Fixes

### v2.2.0 Bug Fixes

1. **Config validation timeout** - Fixed 30s timeout in assignment/syllabus generators
2. **Glob import inconsistency** - Fixed compatibility with glob v7.x
3. **Test mock setup** - Added global fetch mock for Anthropic API
4. **ajv-formats dependency** - Added for URI/email validation

---

## 📈 Test Coverage

**Total Tests:** 1,024 (100% pass rate)

### New Tests in v2.2.0

- Phase A (--config flag): 37 tests
- Phase B (Sync engine): 54 tests
- Phase C (Validation tools): 125 tests
- Phase D (GitHub Actions): 49 tests

**Test Runtime:** ~3 seconds (entire suite)

---

## 🔮 What's Next: v2.3.0

### Planned features for v2.3.0

1. **Auto-Fix Engine** - Automatic YAML error correction
2. **Dry-Run Mode** - Preview changes before applying
3. **Schema Migration** - Auto-migrate v1→v2 configs
4. **Enhanced Errors** - Better error messages with suggestions

**Timeline:** February 2026 (estimated)

See `.STATUS` file for v2.3.0 planning details.

---

## 🙏 Credits

### Development Team

- Core architecture: DT (@Data-Wise)
- Sync engine: DT
- Validation tools: DT
- Documentation: Claude Code + DT

### Community

- flow-cli integration: Requested by @Data-Wise
- GitHub Actions: Based on community feedback
- Pre-commit hooks: Industry best practice

---

## 📞 Support

### Get Help

- **Issues:** https://github.com/Data-Wise/scholar/issues
- **Discussions:** https://github.com/Data-Wise/scholar/discussions
- **Documentation:** `docs/` directory in repo

### Quick Links

- [Installation Guide](https://github.com/Data-Wise/scholar/blob/main/README.md#installation)
- [Migration Guide](MIGRATION-v2.2.0.md)
- [GitHub Actions Setup](github-actions-setup.md)
- [Architecture Details](https://github.com/Data-Wise/scholar/blob/main/README.md#architecture-details)

---

## 🎓 Try It Now

### Upgrade to v2.2.0

```bash
# Homebrew
brew upgrade scholar

# Manual
cd ~/projects/dev-tools/scholar
git pull origin main
./scripts/install.sh --dev
```

### Test new features

```bash
# Validate your config
/teaching:validate .flow/teach-config.yml

# Check sync status
/teaching:diff teach-config.yml

# Try -config flag
/teaching:quiz "Your Topic" --config /path/to/config.yml
```

---

### Welcome to Scholar v2.2.0! 🎉

*Making academic workflows faster, safer, and more automated.*
