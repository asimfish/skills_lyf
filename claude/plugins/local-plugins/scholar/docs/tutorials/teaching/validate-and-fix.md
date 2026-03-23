# Tutorial: Validating and Fixing Configuration

**Time:** 15 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- At least one YAML configuration file (lesson plan, teaching style, or course config)

**What you'll learn:**

- Run validation checks on configuration files
- Understand the four validation levels (syntax, schema, semantic, cross-file)
- Use auto-fix to correct common errors safely
- Preview fixes before applying them with dry-run
- Create backups before making changes
- Batch validate multiple files for CI/CD

---

## Step 1: Basic Validation ⏱️ 2 minutes

**What to do:**

Run a basic validation check on a single configuration file. This will check the YAML syntax, schema compliance, business logic rules, and cross-file references.

**Example:**

```bash
/teaching:validate content/lesson-plans/week03.yml
```

**What you'll see:**

Scholar will analyze the file at all four validation levels:

```
Validating 1 file(s)...

Level: cross-file
Strict: no

✓ content/lesson-plans/week03.yml

───────────────────────────────────────────────────────
✓ All 1 file(s) valid (45ms)
```

If there are issues, you'll see detailed error messages:

```
✗ content/lesson-plans/week03.yml

  content/lesson-plans/week03.yml:15:3: error: Missing required field: level
    Rule: schema:required
    Suggestion: Add "level" with Bloom's taxonomy value

  content/lesson-plans/week03.yml:42: warning: Activity time (90 min) exceeds lecture time (75 min)
    Rule: semantic:duration-overflow

───────────────────────────────────────────────────────
Validation: 1 error, 1 warning in 1 file (45ms)
```

**✅ Checkpoint:**

- The validator shows file path and validation results
- Errors include line numbers, rule names, and suggestions
- Warnings are displayed separately from errors
- Summary shows total errors/warnings and execution time

---

## Step 2: Understanding Validation Levels ⏱️ 3 minutes

**What to do:**

Scholar validates at four progressive levels. Understanding these levels helps you isolate issues quickly.

**The four levels:**

| Level | Checks | Exit Fast | Use Case |
|-------|--------|-----------|----------|
| **syntax** | YAML parsing only | Parse errors | Quick syntax check |
| **schema** | Structure and types | Schema errors | Verify structure |
| **semantic** | Business logic | Logic errors | Content validation |
| **cross-file** | References | Missing refs | Full validation (default) |

**Example:**

Check only YAML syntax:

```bash
/teaching:validate content/lesson-plans/ --level=syntax
```

Check syntax and schema compliance:

```bash
/teaching:validate content/lesson-plans/ --level=schema
```

Check everything except cross-file references:

```bash
/teaching:validate content/lesson-plans/week03.yml --level=semantic
```

Full validation (default, checks everything):

```bash
/teaching:validate content/lesson-plans/week03.yml --level=cross-file
```

**What you'll see:**

When you specify a level, validation stops at that level:

```
Validating 1 file(s)...

Level: schema
Strict: no

✓ content/lesson-plans/week03.yml
  → Skipped: semantic, cross-file (use --level=cross-file for full validation)

───────────────────────────────────────────────────────
✓ All 1 file(s) valid at schema level (23ms)
```

**Common validation rules:**

**Syntax level:**
- `syntax:parse-error` - Invalid YAML syntax
- `syntax:indentation` - Incorrect indentation
- `syntax:duplicate-key` - Duplicate keys in object

**Schema level:**
- `schema:required` - Missing required field
- `schema:type` - Wrong data type (e.g., string instead of array)
- `schema:enum` - Value not in allowed list
- `schema:pattern` - String doesn't match pattern (e.g., `LO-1.1`)

**Semantic level:**
- `semantic:duration-overflow` - Activity time exceeds lecture time
- `semantic:unassessed-objective` - Learning objective has no assessment
- `semantic:self-prerequisite` - Topic references itself as prerequisite
- `semantic:invalid-date-range` - Start date after end date

**Cross-file level:**
- `cross-file:missing-dataset` - Referenced dataset file not found
- `cross-file:future-prerequisite` - Prerequisite from future week
- `cross-file:unverified-prerequisite` - Cannot verify prerequisite (file missing)

**✅ Checkpoint:**

- Run validation at different levels to isolate issues
- Lower levels are faster (syntax < schema < semantic < cross-file)
- Use `--level=syntax` for quick checks during editing
- Use `--level=cross-file` (default) before committing

---

## Step 3: Use Auto-Fix for Safe Fixes ⏱️ 4 minutes

**What to do:**

Use the `--fix` flag to automatically correct simple issues. Scholar will apply safe fixes automatically and ask for confirmation before making potentially unsafe changes.

**Example:**

Auto-fix with interactive confirmation:

```bash
/teaching:validate --fix content/lesson-plans/week03.yml
```

**What you'll see:**

Scholar will show available fixes organized by safety level:

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

**Fix types:**

| Type | Safe? | Auto-apply? | Examples |
|------|-------|-------------|----------|
| **syntax** | Yes | Always | Normalize indentation, remove trailing whitespace |
| **schema** | No | Ask first | Add missing required fields, remove invalid properties |
| **type** | No | Ask first | Convert string to array, number to string |
| **deprecated** | No | Ask first | Migrate v1 fields to v2 schema |

**When to use interactive mode:**

- During development when you want control
- When fixing files you didn't create
- When you want to review each change
- When learning what fixes are available

**CI/CD mode (auto-apply safe fixes only):**

Use `--auto` to apply only safe fixes without prompts:

```bash
/teaching:validate --fix --auto content/lesson-plans/week03.yml
```

This will:
- Apply all syntax fixes automatically
- Skip schema/type/deprecated fixes that need review
- Exit code 0 if all errors fixed
- Exit code 1 if manual fixes needed

**✅ Checkpoint:**

- Safe fixes (syntax) are applied automatically
- Unsafe fixes (schema, type, deprecated) require confirmation
- The validator re-checks the file after applying fixes
- Use `--auto` for CI/CD to apply only safe fixes

---

## Step 4: Preview Fixes with Dry-Run ⏱️ 2 minutes

**What to do:**

Use the `--dry-run` flag to preview what would be fixed without actually modifying the file. This is perfect for understanding what changes will be made before committing to them.

**Example:**

```bash
/teaching:validate --fix --dry-run content/lesson-plans/week03.yml
```

**What you'll see:**

Scholar will show all available fixes without applying them:

```
✗ content/lesson-plans/week03.yml

  Would apply 3 fix(es) (dry-run):

  ✓ Safe fixes (2):
    1. [syntax] Normalize YAML formatting
       → Normalized indentation to 2 spaces
       → Removed trailing whitespace

  ⚠ Requires confirmation (1):
    3. [schema] Add required field 'duration' with default value
       Before: { title: "Lecture" }
       After:  { title: "Lecture", duration: 30 }

  Run without --dry-run to apply these fixes.
```

**Why this matters:**

- **Learn before fixing:** See what auto-fix does before running it
- **Verify safety:** Check that fixes won't break your file
- **Plan changes:** Know what needs manual attention
- **Test scripts:** Validate fix commands in automated workflows

**Common workflow:**

1. Run with `--dry-run` to preview fixes
2. Review the changes
3. Run without `--dry-run` to apply fixes
4. Commit the fixed files

**✅ Checkpoint:**

- Dry-run shows all fixes but doesn't modify files
- Use dry-run to understand what auto-fix will do
- Remove `--dry-run` flag to actually apply fixes
- Combine with `--auto` for CI testing: `--fix --auto --dry-run`

---

## Step 5: Create Backups Before Fixing ⏱️ 2 minutes

**What to do:**

When using auto-fix, Scholar can create backups of your files before modifying them. This provides a safety net if fixes cause unexpected issues.

**Example:**

```bash
/teaching:validate --fix --backup content/lesson-plans/week03.yml
```

**What you'll see:**

Scholar will create a timestamped backup before applying fixes:

```
✗ content/lesson-plans/week03.yml

  Backup: content/lesson-plans/week03.yml.backup-20260203-143022

  Available fixes:
  ...

  ✓ Applied 3 fix(es) to content/lesson-plans/week03.yml

  ✓ Re-validation: File is now valid
```

The backup file will be saved in the same directory as the original file:

```
content/lesson-plans/
  week03.yml                          # Fixed file
  week03.yml.backup-20260203-143022   # Original backup
```

**Restoring from backup:**

If you need to restore the original file:

```bash
cp content/lesson-plans/week03.yml.backup-20260203-143022 content/lesson-plans/week03.yml
```

**Why use backups:**

- **Safety net:** Restore original if fixes cause issues
- **Compare changes:** Diff backup against fixed version
- **Rollback:** Quick recovery if auto-fix breaks something
- **Confidence:** Fix files without fear of data loss

**Best practices:**

- Use `--backup` when fixing important files
- Use `--backup` in CI/CD for auditing
- Clean up old backups periodically (they're not auto-deleted)
- Combine with `--dry-run` first to minimize backup clutter

**✅ Checkpoint:**

- Backups are created before any fixes are applied
- Backup filename includes timestamp
- Backups are saved in the same directory as the original
- Manual cleanup required (backups don't auto-delete)

---

## Step 6: Batch Validate Multiple Files ⏱️ 2 minutes

**What to do:**

Validate all configuration files in your project at once. This is essential for CI/CD integration and keeping your entire project valid.

**Example:**

Validate all YAML files in standard locations:

```bash
/teaching:validate --all
```

Validate all files in a specific directory:

```bash
/teaching:validate content/lesson-plans/
```

Validate with strict mode (treat warnings as errors):

```bash
/teaching:validate --all --strict
```

**What you'll see:**

Scholar will validate all files and show a summary:

```
Validating 12 file(s)...

Level: cross-file
Strict: no

✓ content/lesson-plans/week01.yml
✓ content/lesson-plans/week02.yml
✗ content/lesson-plans/week03.yml

  content/lesson-plans/week03.yml:15:3: error: Missing required field: level
    Rule: schema:required
    Suggestion: Add "level" with Bloom's taxonomy value

✓ content/lesson-plans/week04.yml
✓ .claude/teaching-style.yml
...

───────────────────────────────────────────────────────
Validation: 1 error, 0 warnings in 12 files (234ms)
```

**Quiet mode (errors only):**

Use `--quiet` to suppress warnings:

```bash
/teaching:validate --all --quiet
```

**JSON output (for CI/CD):**

Use `--json` for machine-readable output:

```bash
/teaching:validate --all --json
```

This produces structured JSON:

```json
{
  "summary": {
    "files": 12,
    "errors": 1,
    "warnings": 0,
    "duration": 234,
    "level": "cross-file",
    "strict": false,
    "valid": false
  },
  "results": [
    {
      "file": "content/lesson-plans/week03.yml",
      "isValid": false,
      "errors": [
        {
          "message": "Missing required field: level",
          "line": 15,
          "column": 3,
          "rule": "schema:required"
        }
      ],
      "warnings": []
    }
  ]
}
```

**Batch auto-fix:**

Fix all files at once (safe fixes only):

```bash
/teaching:validate --all --fix --auto
```

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | All files valid |
| 1 | Errors found (or warnings in strict mode) |

**CI/CD integration example:**

```yaml
# .github/workflows/validate.yml
- name: Validate configuration files
  run: /teaching:validate --all --strict --json
```

**✅ Checkpoint:**

- Use `--all` to validate all files at once
- Use `--strict` to enforce zero warnings in CI/CD
- Use `--json` for machine-readable output
- Exit code indicates pass/fail for automated checks
- Combine `--all --fix --auto` for batch fixing

---

## Common Issues

### Issue 1: "File not found" error

**Symptoms:**

- Error: "File not found: content/lesson-plans/week03.yml"
- Command runs but no files validated

**Solution:**

1. Verify the file exists:

   ```bash
   ls -la content/lesson-plans/week03.yml
   ```

2. Check you're running the command from the correct directory:

   ```bash
   pwd
   # Should be your course root directory
   ```

3. Use absolute path if needed:

   ```bash
   /teaching:validate /full/path/to/content/lesson-plans/week03.yml
   ```

### Issue 2: Too many validation errors

**Symptoms:**

- Dozens of errors reported
- Errors from multiple validation levels
- Hard to identify root cause

**Solution:**

1. Validate one level at a time:

   ```bash
   # Start with syntax
   /teaching:validate --level=syntax content/lesson-plans/week03.yml
   ```

2. Fix syntax errors first, then move to schema:

   ```bash
   /teaching:validate --level=schema content/lesson-plans/week03.yml
   ```

3. Use auto-fix to resolve simple issues:

   ```bash
   /teaching:validate --fix --auto content/lesson-plans/week03.yml
   ```

4. Focus on one file at a time rather than using `--all`.

### Issue 3: Auto-fix doesn't fix everything

**Symptoms:**

- Auto-fix runs but errors remain
- Message: "X error(s) remaining" after re-validation
- Some fixes require manual intervention

**Solution:**

1. Understand that auto-fix only handles predictable fixes:
   - Safe: formatting, whitespace, basic structure
   - Unsafe: adding content, changing types, business logic

2. Review the remaining errors:

   ```bash
   /teaching:validate content/lesson-plans/week03.yml
   ```

3. Manually fix errors that require domain knowledge:
   - Missing required content (e.g., learning objectives)
   - Business logic issues (e.g., duration overflow)
   - Cross-file references (e.g., missing datasets)

4. Re-run validation after manual fixes:

   ```bash
   /teaching:validate content/lesson-plans/week03.yml
   ```

### Issue 4: Validation passes but file seems wrong

**Symptoms:**

- File validates successfully
- Content doesn't look right
- Expected errors but got none

**Solution:**

1. Verify you're using the correct validation level:

   ```bash
   # Use full validation (default)
   /teaching:validate content/lesson-plans/week03.yml --level=cross-file
   ```

2. Check the schema version:

   ```bash
   # Look for $schema field in YAML
   cat content/lesson-plans/week03.yml | grep '$schema'
   ```

3. Enable debug mode to see what's being checked:

   ```bash
   /teaching:validate --debug content/lesson-plans/week03.yml
   ```

4. Try strict mode to catch warnings:

   ```bash
   /teaching:validate --strict content/lesson-plans/week03.yml
   ```

### Issue 5: Permission denied writing fixes

**Symptoms:**

- Error: "EACCES: permission denied"
- Auto-fix can't write to file
- Backup creation fails

**Solution:**

1. Check file permissions:

   ```bash
   ls -la content/lesson-plans/week03.yml
   ```

2. Make file writable:

   ```bash
   chmod u+w content/lesson-plans/week03.yml
   ```

3. Check directory permissions:

   ```bash
   ls -la content/lesson-plans/
   chmod u+w content/lesson-plans/
   ```

4. If using Git, check if file is locked:

   ```bash
   git status
   # If locked, unlock it first
   ```

---

## Next Steps

Congratulations! You now know how to validate and fix configuration files with Scholar.

> **Tip:** Scholar also auto-fixes math blank lines in generated Quarto lecture output. Blank lines inside `$$...$$` blocks break PDF rendering, and Scholar strips them automatically. See the [Auto-Fixer Guide](../../AUTO-FIXER-GUIDE.md#qw4-math-blank-line-auto-fix-priority-5) for details.

### Related Tutorials

- **[Syncing and Comparing Configurations](sync-and-diff.md)** - Keep YAML and JSON in sync
- **[Course Configuration](configuration.md)** - Set up `.flow/teach-config.yml`
- **[First Exam](first-exam.md)** - Generate your first exam with validated configs

### Advanced Workflows

- **[Semester Setup](semester-setup.md)** - Validate entire semester of content
- **[Weekly Content Generation](weekly-content.md)** - Validation in weekly workflows

### Best Practices

**Daily workflow:**
1. Edit YAML files
2. Run `/teaching:validate --level=syntax` frequently while editing
3. Run `/teaching:validate --level=cross-file` before committing
4. Use `/teaching:sync` to regenerate JSON after validation passes

**CI/CD workflow:**
1. Add validation to pre-commit hooks
2. Use `/teaching:validate --all --strict --json` in CI pipeline
3. Use `/teaching:validate --fix --auto` for automated fixes
4. Block merges if validation fails

**Team workflow:**
1. Validate before pushing to shared repo
2. Use `--strict` mode to enforce quality standards
3. Share validation errors in code reviews
4. Document custom validation rules in project README

### Quick References

- **[Teaching Commands Reference](../../TEACHING-COMMANDS-REFERENCE.md#teachingvalidate)** - Full command documentation
- **JSON Schemas** - Schema definitions are in `src/teaching/schemas/` in the project source
- **[API Reference](../../API-REFERENCE.md)** - Validator API for custom integration

---

**Happy validating with Scholar!**
