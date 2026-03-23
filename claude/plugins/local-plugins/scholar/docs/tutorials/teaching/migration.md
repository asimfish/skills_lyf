# Tutorial: Migrating to Manifest Format

**Time:** 7 minutes
**Prerequisites:**

- Scholar plugin installed (`brew install scholar` or manual installation)
- Claude Code running
- Existing course with `content/lesson-plans/week*.yml` files (or similar)

**What you'll learn:**

- Understand the old directory-based format vs new manifest format
- Preview migration changes before applying
- Migrate week files to a unified manifest
- Handle common migration issues (missing fields, duplicates)
- Validate migrated content

---

## Step 1: Understanding the Old Format ⏱️ 1 minute

**What to know:**

Before Phase 2, Scholar expected separate YAML files for each week:

```
content/lesson-plans/
├── week01.yml       # Week 1 lesson plan
├── week02.yml       # Week 2 lesson plan
├── week03.yml       # Week 3 lesson plan
└── ...
```

Each file contained structured data:

```yaml
# content/lesson-plans/week03.yml
week: 3
title: "Introduction to Linear Regression"
learning_objectives:
  - "Understand regression concepts"
  - "Apply simple linear models"
topics:
  - "Regression basics"
  - "Least squares estimation"
```

**Problems with this approach:**

- No single view of the full semester
- Manual synchronization across files
- Difficult to track course-wide changes
- Limited external tool integration
- No structured metadata (status, IDs, milestones)

**The new manifest format (Phase 2):**

A single `.flow/lesson-plans.yml` file containing:

```yaml
schema_version: "1.0"
semester:
  total_weeks: 15
  schedule: "TR"
  milestones: []

weeks:
  - week: 1
    title: "Course Introduction"
    status: draft
    learning_objectives: []
    topics: []
  - week: 3
    title: "Introduction to Linear Regression"
    status: reviewed
    learning_objectives:
      - id: LO-3.1
        text: "Understand regression concepts"
    # ... all weeks in one file
```

**Checkpoint:**

You understand the difference: multiple week files vs single unified manifest.

---

## Step 2: Preview Migration ⏱️ 2 minutes

**What to do:**

Before changing anything, preview what the migration will do.

**Example:**

```bash
/teaching:migrate --to-manifest --dry-run
```

**What you'll see:**

```
Detecting week files...

Found 12 week file(s)

  ○ Week 1: content/lesson-plans/week01.yml (missing: status, activities)
  ○ Week 2: content/lesson-plans/week02.yml (missing: status)
  ○ Week 3: content/lesson-plans/week03.yml
  ○ Week 4: content/lesson-plans/week04.yml (missing: learning_objectives, status)
  ...
  ○ Week 12: content/lesson-plans/week12.yml (missing: status, topics)

Dry-run: Manifest Preview

Would create: .flow/lesson-plans.yml
Weeks: 12
Fields to fill: 18 (defaults: status=draft, empty arrays for missing fields)

Warnings:
  ⚠ Week 5 missing learning_objectives (will use empty array)
  ⚠ Week 8 missing topics (will use empty array)
  ⚠ Week 12 missing both learning_objectives and topics

YAML preview:
---
schema_version: "1.0"
semester:
  total_weeks: 15
  schedule: "MWF"
  milestones: []
weeks:
  - week: 1
    title: "Course Introduction"
    status: draft
    learning_objectives: []
    topics:
      - id: T-1.1
        text: "Course overview"
  ...

Run without --dry-run to apply.
```

**What this tells you:**

- Scholar found 12 week files across your directories
- Some weeks are missing optional fields (learning_objectives, topics, activities)
- Migration will fill missing fields with sensible defaults:
  - `status: draft` for all weeks
  - Empty arrays `[]` for missing learning_objectives, topics, activities
- You can review the exact YAML that would be created

**Checkpoint:**

You've previewed the migration and understand what will be generated.

---

## Step 3: Run Migration ⏱️ 1 minute

**What to do:**

Apply the migration to create `.flow/lesson-plans.yml`.

**Example:**

```bash
/teaching:migrate --to-manifest
```

**What happens:**

```
Detecting week files...

Found 12 week file(s)

Creating manifest...

✓ Manifest created!

  File: .flow/lesson-plans.yml
  Weeks merged: 12
  Defaults filled: 18 (status, empty arrays)
  Backup: .flow/lesson-plans.yml.backup-2026-02-03T18-30-45

Warnings:
  ⚠ Week 1 missing learning_objectives (filled with empty array)
  ⚠ Week 4 missing learning_objectives (filled with empty array)
  ⚠ Week 5 missing learning_objectives (filled with empty array)
  ⚠ Week 8 missing topics (filled with empty array)
  ⚠ Week 12 missing learning_objectives and topics (filled with empty arrays)

Next steps:
  1. Review manifest: cat .flow/lesson-plans.yml
  2. Validate: /teaching:validate
  3. Sync: /teaching:sync --manifest
```

**What got created:**

- `.flow/lesson-plans.yml` - Your new unified manifest
- `.flow/lesson-plans.yml.backup-2026-02-03T18-30-45` - Backup of existing file (if one existed)

**What happened to original files:**

Scholar does NOT delete your original `content/lesson-plans/week*.yml` files. They remain untouched. You can manually delete them after verifying the manifest is correct.

**Checkpoint:**

You now have a `.flow/lesson-plans.yml` manifest file.

---

## Step 4: Verify the Generated Manifest ⏱️ 2 minutes

**What to do:**

Review the manifest and check for data accuracy.

**Example:**

```bash
cat .flow/lesson-plans.yml
```

**What to check:**

### 1. Schema version is present

```yaml
schema_version: "1.0"
```

### 2. Semester metadata is reasonable

```yaml
semester:
  total_weeks: 15          # Should match your course length
  schedule: "MWF"          # May need manual adjustment
  milestones: []           # Empty by default, add manually
```

**Note:** Migration cannot infer your class schedule or milestones, so these may need manual editing.

### 3. All weeks are present

```yaml
weeks:
  - week: 1
    title: "Course Introduction"
    status: draft
  - week: 2
    title: "Descriptive Statistics"
    status: draft
  # ... through week 12 or 15
```

Check that week numbers are sequential and all expected weeks are present.

### 4. Content was preserved

Compare an original week file:

```yaml
# content/lesson-plans/week03.yml (old)
week: 3
title: "Introduction to Linear Regression"
topics:
  - "Regression basics"
  - "Least squares estimation"
```

To the migrated manifest entry:

```yaml
# .flow/lesson-plans.yml (new)
weeks:
  - week: 3
    title: "Introduction to Linear Regression"
    status: draft
    learning_objectives: []
    topics:
      - id: T-3.1
        text: "Regression basics"
      - id: T-3.2
        text: "Least squares estimation"
```

**What changed:**

- Added `status: draft` field
- Added `learning_objectives: []` (was missing)
- Wrapped topic strings in structured objects with IDs (`id: T-3.1`)

**Checkpoint:**

The manifest contains all your original week data with added structure.

---

## Step 5: Handle Common Migration Issues ⏱️ 1 minute

**Issue 1: Missing weeks**

**Problem:** Migration found weeks 1, 3, 5, 7 but no weeks 2, 4, 6.

**Solution:** Manually add stub entries in the manifest:

```yaml
weeks:
  - week: 1
    title: "Course Introduction"
    status: draft
  - week: 2           # Add missing week
    title: "TBD"
    status: draft
    learning_objectives: []
    topics: []
  - week: 3
    title: "Regression Intro"
    status: draft
```

**Issue 2: Duplicate week numbers**

**Problem:** Migration reports "Conflicts: Week 3 found in content/lesson-plans/ vs lesson-plans/"

**Solution:** First-found wins. Scholar uses the first week file it encounters. Review both versions and manually merge any unique content:

```bash
cat content/lesson-plans/week03.yml
cat lesson-plans/week03.yml
```

Then edit `.flow/lesson-plans.yml` to include content from both sources.

**Issue 3: Unstructured topic/objective text**

**Problem:** Old format used plain strings:

```yaml
topics:
  - "Topic 1"
  - "Topic 2"
```

New format uses objects:

```yaml
topics:
  - id: T-3.1
    text: "Topic 1"
  - id: T-3.2
    text: "Topic 2"
```

**Solution:** Migration auto-converts strings to objects with generated IDs. No action needed.

**Checkpoint:**

You've addressed any migration warnings and ensured all weeks are present.

---

## Step 6: Validate and Next Steps ⏱️ 30 seconds

**What to do:**

Confirm the manifest is valid and ready for use.

**Example:**

```bash
/teaching:validate
```

**Expected output:**

```
Validating .flow/lesson-plans.yml...

✓ Schema version: 1.0
✓ Semester metadata valid
✓ 12 weeks defined
✓ All required fields present

Summary:
  Total weeks: 12
  Status breakdown:
    draft: 12
  Milestones: 0

✓ Manifest is valid!
```

**If validation fails:**

Fix reported errors (usually YAML syntax issues) and run `/teaching:validate` again.

**Next steps after successful migration:**

1. **Edit semester metadata** - Add your class schedule and milestones:

```yaml
semester:
  schedule: "TR"        # Update from default MWF
  milestones:
    - week: 8
      type: midterm
      description: "Midterm Exam"
```

2. **Update week statuses** - Change `draft` to `reviewed` for finalized weeks:

```yaml
- week: 3
  status: reviewed    # Changed from draft
```

3. **Optionally delete old files** - After verifying everything migrated correctly:

```bash
rm content/lesson-plans/week*.yml    # Or move to archive/
```

4. **Sync with flow-cli** (if you use it):

```bash
/teaching:sync --manifest
```

---

## Troubleshooting

**Problem:** Migration says "No week files found"

**Solution:** Migration looks in these locations:
- `content/lesson-plans/`
- `lesson-plans/`
- `.flow/weeks/`

If your files are elsewhere, move them to one of these directories, or specify custom patterns:

```bash
/teaching:migrate --to-manifest --patterns "my-weeks/**/*.yml"
```

---

**Problem:** Manifest has wrong total_weeks value

**Solution:** Edit `.flow/lesson-plans.yml` and update:

```yaml
semester:
  total_weeks: 15    # Change to match your actual semester length
```

---

**Problem:** Some weeks have richer data than others

**Solution:** This is expected. Migration preserves exactly what was in each week file. Weeks with missing fields get empty defaults. Gradually fill in learning objectives and topics as you develop your course.

---

**Problem:** Migration created IDs I don't like (T-3.1, T-3.2, etc.)

**Solution:** IDs are auto-generated during migration. You can manually edit them in the manifest:

```yaml
topics:
  - id: regression-intro     # Change from T-3.1
    text: "Introduction to linear regression"
```

Just ensure IDs remain unique across your course.

---

## Summary

You've learned how to:

- Understand the difference between directory-based week files and unified manifests
- Preview migration with `--dry-run` to see what will change
- Migrate week files to `.flow/lesson-plans.yml` with `/teaching:migrate --to-manifest`
- Verify migrated content and check for data accuracy
- Handle common issues (missing weeks, duplicates, missing fields)
- Validate the final manifest with `/teaching:validate`

**Next steps:**

- [Working with Lesson Plans Manifests](lesson-plans-manifest.md) - Edit and maintain manifests
- [Creating a Demo Course](demo-course.md) - Start fresh with scaffolded templates
- [Phase 2 User Guide](../../PHASE2-USER-GUIDE.md) - Complete manifest reference

**See also:**

- [Command Reference: migrate](../../API-REFERENCE.md) - All migration options
