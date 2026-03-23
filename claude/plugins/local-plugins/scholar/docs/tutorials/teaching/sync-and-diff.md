# Tutorial: Syncing and Comparing Configurations

**Time:** 12 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- At least one YAML configuration file (lesson plan or teaching style)

**What you'll learn:**

- Sync YAML files to JSON format automatically
- Understand sync direction (YAML is source of truth)
- Compare YAML and JSON files to detect differences
- Review diff output (additions, changes, removals)
- Integrate sync into your development workflow
- Use bidirectional manifest sync for flow-cli integration

---

## Step 1: Sync YAML to JSON ⏱️ 2 minutes

**What to do:**

Scholar uses JSON files internally for performance, but you edit YAML files because they're more human-friendly. The sync command keeps them in sync automatically.

**Example:**

Sync all changed YAML files to JSON:

```bash
/teaching:sync
```

Sync a specific file:

```bash
/teaching:sync --file content/lesson-plans/week03.yml
```

**What you'll see:**

Scholar will create or update JSON files based on your YAML:

```
Syncing YAML → JSON...
├─ ✓ content/lesson-plans/week03.yml → week03.json (12ms)
├─ ✓ content/lesson-plans/week04.yml → week04.json (8ms)
├─ ○ content/lesson-plans/week05.yml (unchanged)
└─ Done: 2 synced, 1 unchanged, 0 failed (35ms)
```

The JSON files will be created in the same directory:

```
content/lesson-plans/
  week03.yml      # Source (you edit this)
  week03.json     # Generated (used internally by Scholar)
  week04.yml
  week04.json
```

**How it works:**

- Scholar calculates a hash of the YAML content
- If the hash changed since last sync, JSON is regenerated
- If unchanged, sync is skipped (fast)
- Sync latency is under 100ms per file

**✅ Checkpoint:**

- JSON files appear in the same directory as YAML files
- Unchanged files show `○` and are skipped
- Synced files show `✓` with duration in milliseconds
- Summary shows total synced/unchanged/failed

---

## Step 2: Understand Sync Direction ⏱️ 2 minutes

**What to do:**

It's critical to understand that YAML is always the source of truth. Never edit JSON files directly—they will be overwritten on the next sync.

**The sync direction:**

```
YAML  →  JSON
(you edit)  (auto-generated)
```

**Why YAML is the source:**

- **Human-readable:** YAML is easy to read and edit
- **Comments:** YAML supports comments, JSON doesn't
- **Version control:** YAML diffs are cleaner in Git
- **Validation:** YAML can be validated before conversion

**Why JSON is generated:**

- **Performance:** JSON parsing is faster than YAML
- **Compatibility:** Many tools prefer JSON
- **Type safety:** JSON Schema validation
- **Size:** JSON is more compact (no comments/whitespace)

**Example:**

Edit the YAML file:

```yaml
# content/lesson-plans/week03.yml
week: 3
title: "Linear Regression"
duration: 75  # Changed from 60
```

Sync to update JSON:

```bash
/teaching:sync --file content/lesson-plans/week03.yml
```

Now the JSON reflects the change:

```json
{
  "week": 3,
  "title": "Linear Regression",
  "duration": 75
}
```

**Never do this:**

```bash
# DON'T edit JSON directly
vi content/lesson-plans/week03.json  # Changes will be lost!
```

**Workflow rule:**

1. Edit YAML files only
2. Run `/teaching:sync` to update JSON
3. Commit both YAML and JSON to version control
4. Never manually edit JSON files

**✅ Checkpoint:**

- YAML is the source of truth (you edit this)
- JSON is auto-generated (never edit manually)
- Always sync after editing YAML
- Commit both YAML and JSON to Git

---

## Step 3: Compare Files with Diff ⏱️ 3 minutes

**What to do:**

Use the `diff` command to check if YAML and JSON are in sync. This helps catch cases where you edited YAML but forgot to sync.

**Example:**

Compare a single file:

```bash
/teaching:diff content/lesson-plans/week03.yml
```

Compare all files:

```bash
/teaching:diff --all
```

**What you'll see:**

If files are in sync:

```
Comparing: content/lesson-plans/week03.yml ↔ week03.json

Status: ✓ In sync

───────────────────────────────────────────────────────
Summary: 0 differences (12ms)
```

If files are out of sync:

```
Comparing: content/lesson-plans/week03.yml ↔ week03.json

Status: ✗ Out of sync

  ~ learning_objectives[0].level:15: "understand" → "apply"
  + topics[3]:45: added in JSON → {"id": "T-3.4", "name": "Extra topic"}
  - materials.datasets[1]:62: missing in JSON ← {"name": "extra-data"}

───────────────────────────────────────────────────────
Summary: +1 added, -1 removed, ~1 changed (23ms)
Run /teaching:sync --force to resync
```

**Change types:**

| Symbol | Type | Meaning |
|--------|------|---------|
| `+` | added | Present in JSON but not in YAML (shouldn't happen) |
| `-` | removed | Present in YAML but missing in JSON (needs sync) |
| `~` | changed | Different values between YAML and JSON |
| `!` | type-changed | Data type differs (e.g., array vs object) |

**Quick summary mode:**

```bash
/teaching:diff --all --summary
```

This shows only status for each file:

```
✓ content/lesson-plans/week01.yml: in-sync
✓ content/lesson-plans/week02.yml: in-sync
✗ content/lesson-plans/week03.yml: out-of-sync (3 changes)
✓ content/lesson-plans/week04.yml: in-sync
○ content/lesson-plans/week05.yml: never-synced

═══════════════════════════════════════════════════════
Summary: 5 file(s) compared (67ms)
  ✓ In sync: 3
  ○ Never synced: 1
  ✗ Out of sync: 1

Run /teaching:diff --all --force-sync to auto-sync
```

**✅ Checkpoint:**

- Diff shows exact differences between YAML and JSON
- Change symbols indicate type of difference (+, -, ~, !)
- Line numbers help locate changes in YAML
- Summary shows how many differences exist

---

## Step 4: Review Diff Output ⏱️ 2 minutes

**What to do:**

Understanding diff output helps you identify why files are out of sync and what needs to be fixed.

**Reading the diff output:**

Each difference shows:
1. Change type symbol (`+`, `-`, `~`, `!`)
2. Field path (e.g., `learning_objectives[0].level`)
3. Line number in YAML (e.g., `:15`)
4. Change direction arrow (`→` for forward, `←` for backward)
5. Values (old and new)

**Example 1: Changed value**

```
~ learning_objectives[0].level:15: "understand" → "apply"
```

This means:
- Field: `learning_objectives[0].level`
- Location: Line 15 in YAML
- Change: Value changed from "understand" to "apply"
- Type: Modified (~)

**Example 2: Removed value**

```
- materials.datasets[1]:62: missing in JSON ← {"name": "extra-data"}
```

This means:
- Field: `materials.datasets[1]`
- Location: Line 62 in YAML
- Issue: YAML has this value but JSON doesn't
- Type: Removed (-)
- Cause: YAML was edited but not synced

**Example 3: Added value**

```
+ topics[3]:45: added in JSON → {"id": "T-3.4", "name": "Extra topic"}
```

This means:
- Field: `topics[3]`
- Location: Line 45 in YAML
- Issue: JSON has this value but YAML doesn't
- Type: Added (+)
- Cause: Shouldn't happen (indicates manual JSON edit or sync bug)

**Example 4: Type changed**

```
! duration:20: type changed: string → number
```

This means:
- Field: `duration`
- Location: Line 20 in YAML
- Issue: YAML has string "75" but JSON has number 75
- Type: Type mismatch (!)
- Cause: YAML needs quotes removed or JSON needs sync

**Common causes of differences:**

| Difference | Cause | Solution |
|------------|-------|----------|
| `-` (removed) | YAML edited but not synced | Run `/teaching:sync` |
| `~` (changed) | YAML edited but not synced | Run `/teaching:sync` |
| `+` (added) | JSON manually edited | Don't edit JSON, edit YAML instead |
| `!` (type) | YAML syntax error | Fix YAML type, then sync |

**✅ Checkpoint:**

- Each difference shows field path, line number, and values
- Symbols indicate type of change (+, -, ~, !)
- Most differences indicate YAML needs syncing
- Added (+) values suggest manual JSON edits (don't do this)

---

## Step 5: Integrate Sync Into Your Workflow ⏱️ 3 minutes

**What to do:**

Make syncing automatic so you never commit out-of-sync files. Scholar provides several integration points.

**Option 1: Manual sync (basic workflow)**

Edit YAML, then sync manually:

```bash
vi content/lesson-plans/week03.yml
/teaching:sync --file content/lesson-plans/week03.yml
git add content/lesson-plans/week03.*
git commit -m "Update week 3 lesson plan"
```

**Option 2: Pre-commit hook (automatic)**

Scholar can sync automatically before every commit:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
node scripts/sync-yaml.js --quiet
if [ $? -ne 0 ]; then
  echo "YAML sync failed. Please fix errors before committing."
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

Now syncing happens automatically:

```bash
vi content/lesson-plans/week03.yml
git commit -am "Update week 3"
# Pre-commit hook runs /teaching:sync automatically
```

**Option 3: Status check (before committing)**

Check sync status before committing:

```bash
/teaching:sync --status
```

This shows which files need syncing:

```
YAML → JSON Sync Status

✓ content/lesson-plans/week01.yml (in-sync)
✓ content/lesson-plans/week02.yml (in-sync)
✗ content/lesson-plans/week03.yml (out-of-sync)
○ content/lesson-plans/week04.yml (never-synced)

───────────────────────────────────────────────────────
Total: 4 files
  ✓ In sync: 2
  ○ Never synced: 1
  ✗ Out of sync: 1

Run `/teaching:sync` to sync files.
```

Then sync before committing:

```bash
/teaching:sync
git commit -am "Update lesson plans"
```

**Option 4: CI/CD integration**

Add sync validation to CI pipeline:

```yaml
# .github/workflows/validate.yml
name: Validate Configuration

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check sync status
        run: /teaching:diff --all --json

      - name: Fail if out of sync
        run: |
          if /teaching:diff --all --quiet; then
            echo "✓ All files in sync"
          else
            echo "✗ Files out of sync"
            exit 1
          fi
```

**Option 5: Auto-sync mode (force sync)**

Automatically sync out-of-sync files:

```bash
/teaching:diff --all --force-sync
```

This will:
1. Check all files
2. Sync any out-of-sync files
3. Report what was synced

**Best practice workflow:**

```bash
# 1. Edit YAML files
vi content/lesson-plans/week03.yml

# 2. Validate YAML (catches errors early)
/teaching:validate content/lesson-plans/week03.yml

# 3. Sync to JSON
/teaching:sync

# 4. Verify sync (optional but recommended)
/teaching:diff --all --summary

# 5. Commit both YAML and JSON
git add content/lesson-plans/
git commit -m "Update week 3 lesson plan"
```

**✅ Checkpoint:**

- Add `/teaching:sync` to your workflow
- Use pre-commit hooks for automatic syncing
- Check status with `/teaching:sync --status` before commits
- Validate sync status in CI/CD pipelines
- Always commit both YAML and JSON together

---

## Advanced: Bidirectional Manifest Sync ⏱️ (Optional)

**What to do:**

If you use flow-cli alongside Scholar, you can perform bidirectional manifest sync. This merges changes from both Scholar and flow-cli using a three-way merge strategy.

**When to use this:**

- You maintain `.flow/lesson-plans.yml` in both Scholar and flow-cli
- Scholar edits some weeks, flow-cli edits others
- You need to merge changes from both tools

**Example:**

Merge Scholar's manifest with flow-cli's:

```bash
/teaching:sync --manifest
```

Specify flow-cli's manifest location:

```bash
/teaching:sync --manifest --theirs .flow/lesson-plans-flow.yml
```

Choose conflict resolution strategy:

```bash
# Use Scholar's version for conflicts (default)
/teaching:sync --manifest --strategy ours

# Use flow-cli's version for conflicts
/teaching:sync --manifest --strategy theirs
```

**What you'll see:**

```
Manifest Sync

  Ours: .flow/lesson-plans.yml
  Theirs: .flow/lesson-plans-flow.yml
  Strategy: ours

  Ours changed: weeks 3, 5
  Theirs changed: weeks 4, 6
  Conflicts: 1
    Week 7: fields topic, duration

✓ Manifest synced!

  Auto-merged: weeks 3, 4, 5, 6
  Conflicts resolved (ours): 1
  Backup: .flow/lesson-plans.yml.backup-20260203-143022

Next steps:
  1. Review: cat .flow/lesson-plans.yml
  2. Validate: /teaching:validate
```

**How it works:**

- **Three-way merge:** Compares base, Scholar's version, flow-cli's version
- **Week-level atomic merge:** Each week is an independent unit
- **Auto-merge non-conflicts:** Scholar edits week 3, flow-cli edits week 5 → both merged
- **Conflict resolution:** When both edit same week, strategy decides winner
- **Semester metadata:** Last-writer-wins for course-level fields

**Preview merge (dry-run):**

```bash
/teaching:sync --manifest --dry-run
```

This shows what would be merged without applying changes.

**✅ Checkpoint:**

- Use `--manifest` for bidirectional sync with flow-cli
- Auto-merge works for non-conflicting changes
- Use `--strategy` to resolve conflicts (ours/theirs)
- Always creates backup before writing
- Preview with `--dry-run` first

---

## Common Issues

### Issue 1: "No YAML configs found"

**Symptoms:**

- Message: "No YAML configs found"
- Sync command finds no files

**Solution:**

1. Verify you're in the correct directory:

   ```bash
   pwd
   # Should be course root with content/lesson-plans/ or .claude/
   ```

2. Check directory structure:

   ```bash
   ls -la content/lesson-plans/
   ls -la .claude/
   ```

3. Create directories if missing:

   ```bash
   mkdir -p content/lesson-plans
   ```

4. Verify YAML file extensions (`.yml` or `.yaml`):

   ```bash
   ls content/lesson-plans/*.yml
   ```

### Issue 2: Sync creates JSON but shows "unchanged"

**Symptoms:**

- JSON file created
- Subsequent syncs show "unchanged" even though YAML changed
- Changes not reflected in JSON

**Solution:**

1. Force sync (ignores cache):

   ```bash
   /teaching:sync --all
   ```

2. Or force sync specific file:

   ```bash
   /teaching:sync --file content/lesson-plans/week03.yml --force
   ```

3. Check YAML syntax is valid:

   ```bash
   /teaching:validate content/lesson-plans/week03.yml --level=syntax
   ```

4. Delete JSON and resync:

   ```bash
   rm content/lesson-plans/week03.json
   /teaching:sync --file content/lesson-plans/week03.yml
   ```

### Issue 3: Diff shows "never-synced"

**Symptoms:**

- Status: "never-synced"
- No JSON file exists
- Can't compare files

**Solution:**

1. This is normal for new YAML files. Run sync:

   ```bash
   /teaching:sync --file content/lesson-plans/week03.yml
   ```

2. Or sync all files:

   ```bash
   /teaching:sync --all
   ```

3. Verify JSON was created:

   ```bash
   ls -la content/lesson-plans/week03.json
   ```

### Issue 4: Diff shows added values (+) in JSON

**Symptoms:**

- Diff shows `+` (added) for values in JSON
- Values exist in JSON but not in YAML
- Shouldn't happen in normal workflow

**Solution:**

This indicates JSON was manually edited (don't do this) or a sync bug. Fix:

1. JSON is auto-generated, so regenerate from YAML:

   ```bash
   rm content/lesson-plans/week03.json
   /teaching:sync --file content/lesson-plans/week03.yml
   ```

2. If you want those values, add them to YAML first:

   ```yaml
   # content/lesson-plans/week03.yml
   topics:
     - id: "T-3.4"
       name: "Extra topic"
   ```

3. Then sync:

   ```bash
   /teaching:sync --file content/lesson-plans/week03.yml
   ```

**Remember:** Never edit JSON directly.

### Issue 5: Manifest sync conflicts

**Symptoms:**

- Message: "Conflicts: 2"
- Weeks edited by both Scholar and flow-cli
- Don't know which version to keep

**Solution:**

1. Review the conflict details:

   ```bash
   /teaching:sync --manifest --dry-run
   ```

2. Choose conflict resolution strategy:

   ```bash
   # Keep Scholar's changes
   /teaching:sync --manifest --strategy ours

   # Or keep flow-cli's changes
   /teaching:sync --manifest --strategy theirs
   ```

3. Review the merged result:

   ```bash
   cat .flow/lesson-plans.yml
   ```

4. If wrong, restore from backup:

   ```bash
   cp .flow/lesson-plans.yml.backup-* .flow/lesson-plans.yml
   ```

5. Manually merge if needed:

   ```bash
   # Edit to combine both versions
   vi .flow/lesson-plans.yml
   /teaching:validate .flow/lesson-plans.yml
   ```

---

## Next Steps

Congratulations! You now know how to sync and compare configuration files with Scholar.

### Related Tutorials

- **[Validating and Fixing Configuration](validate-and-fix.md)** - Validate before syncing
- **[Course Configuration](configuration.md)** - Set up configuration files
- **[Semester Setup](semester-setup.md)** - Organize semester content

### Workflow Integration

**Recommended workflow order:**

1. Edit YAML files
2. Validate: `/teaching:validate`
3. Sync: `/teaching:sync`
4. Diff: `/teaching:diff --all --summary`
5. Commit: `git commit -am "Update lesson plans"`

**Pre-commit hook setup:**

```bash
# Install hook
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Test it
git commit -am "Test commit"
```

**CI/CD validation:**

```yaml
# .github/workflows/validate.yml
- name: Validate sync status
  run: |
    /teaching:diff --all --json
    /teaching:validate --all --strict
```

### Quick References

- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md#teachingsync)** - Full sync command docs
- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md#teachingdiff)** - Full diff command docs
- **[Developer Guide](../../DEVELOPER-GUIDE.md)** - Development workflow patterns

---

**Happy syncing with Scholar!**
