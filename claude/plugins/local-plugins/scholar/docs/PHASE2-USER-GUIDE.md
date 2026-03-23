# Scholar Plugin Phase 2 User Guide

> **Phase 2:** Config & Flow-CLI Integration
> **Version:** {{ scholar.version }}
> **Audience:** Instructors, course designers

---

## Table of Contents

1. [What's New in Phase 2](#whats-new-in-phase-2)
2. [Quick Start](#quick-start)
3. [The Lesson Plans Manifest](#the-lesson-plans-manifest)
   - [Structure](#structure)
   - [Week Status Lifecycle](#week-status-lifecycle)
   - [ID Conventions](#id-conventions)
4. [Workflows](#workflows)
   - [Creating a New Course (Demo Scaffolding)](#creating-a-new-course-demo-scaffolding)
   - [Migrating from Directory Layout](#migrating-from-directory-layout)
   - [Generating Weekly Lectures](#generating-weekly-lectures)
   - [Syncing with flow-cli](#syncing-with-flow-cli)
   - [Exporting Schemas](#exporting-schemas)
5. [Configuration Reference](#configuration-reference)
   - [.flow/teach-config.yml](#flowteach-configyml)
   - [.flow/lesson-plans.yml](#flowlesson-plansyml)
6. [Troubleshooting](#troubleshooting)

---

## What's New in Phase 2

Phase 2 introduces a **unified manifest-based approach** to lesson planning that simplifies course management and enables powerful integrations:

**Before Phase 2:**
- Lesson plans scattered across `content/lesson-plans/week01.yml`, `week02.yml`, etc.
- Manual synchronization between Scholar and flow-cli
- No centralized view of semester structure
- Limited external tool integration

**After Phase 2:**
- **Single-file manifest** (`.flow/lesson-plans.yml`) contains all semester planning
- **Bidirectional sync** with flow-cli for workflow automation
- **Schema export** for VS Code YAML validation and external tools
- **Demo scaffolding** (`/teaching:demo`) for quick course setup
- **Migration tools** to convert existing directory layouts
- **Structured metadata** for milestones, schedules, and learning objectives

This phase transforms Scholar from a content generator into a complete course planning system.

---

## Quick Start

Get started with a new course in three steps:

### Step 1: Create a Demo Course

```bash
/teaching:demo
```

This scaffolds a complete `.flow/` directory with:
- `teach-config.yml` - Course configuration and style preferences
- `lesson-plans.yml` - Semester manifest with 15 weeks of sample content

### Step 2: Examine the Manifest

Open `.flow/lesson-plans.yml` to see:

```yaml
schema_version: "1.0"
semester:
  total_weeks: 15
  schedule: "TR"        # Tuesday/Thursday classes
  milestones:
    - week: 8
      type: midterm
    - week: 10
      type: break
    - week: 16
      type: final

weeks:
  - week: 1
    title: "Course Introduction"
    status: draft
  - week: 3
    title: "Introduction to Linear Regression"
    status: reviewed
    learning_objectives:
      - id: LO-3.1
        text: "Understand the concept of linear regression"
    topics:
      - id: T-3.1
        text: "Simple linear regression model"
    activities:
      - id: A-3.1
        type: "lecture"
        duration: 75
        description: "Interactive lecture on regression basics"
```

### Step 3: Generate Your First Lecture

```bash
/teaching:lecture --week 3 --format qmd
```

Scholar reads the manifest, generates lecture content, and updates the week's status to `generated`.

---

## The Lesson Plans Manifest

### Structure

The `.flow/lesson-plans.yml` file has three main sections:

#### 1. Schema Version

```yaml
schema_version: "1.0"
```

Ensures compatibility with future manifest format changes.

#### 2. Semester Metadata

```yaml
semester:
  total_weeks: 15          # Typical semester length
  schedule: "TR"           # Meeting days (M/T/W/R/F)
  milestones:              # Key semester events
    - week: 8
      type: midterm
      description: "Midterm Exam - Weeks 1-7"
    - week: 10
      type: break
      description: "Spring Break"
    - week: 16
      type: final
      description: "Final Exam - Comprehensive"
```

**Schedule Codes:**
- `M` = Monday
- `T` = Tuesday
- `W` = Wednesday
- `R` = Thursday
- `F` = Friday
- Examples: `"MWF"`, `"TR"`, `"MW"`

**Milestone Types:**
- `midterm` - Mid-semester examination
- `break` - Academic break (no classes)
- `final` - Final examination
- `project` - Major project deadline
- `custom` - Instructor-defined milestone

#### 3. Weeks Array

```yaml
weeks:
  - week: 1                # Week number (1-based)
    title: "Course Introduction"
    status: draft          # draft|generated|reviewed|published

    # Optional fields (populated as course develops)
    learning_objectives:
      - id: LO-1.1
        text: "Understand course expectations and grading"
        bloom_level: "understand"
      - id: LO-1.2
        text: "Apply regression thinking to real-world problems"
        bloom_level: "apply"

    topics:
      - id: T-1.1
        text: "Course overview and expectations"
        estimated_time: 30
      - id: T-1.2
        text: "Introduction to statistical modeling"
        estimated_time: 45

    activities:
      - id: A-1.1
        type: "lecture"
        duration: 75
        description: "Welcome and syllabus review"
      - id: A-1.2
        type: "discussion"
        duration: 30
        description: "Student introductions and goals"

    assessments:
      - id: "HW-1"
        type: "homework"
        due_week: 2
        points: 20
        description: "R installation and first regression"

    materials:
      - type: "slides"
        path: "content/slides/week01-intro.qmd"
      - type: "readings"
        items:
          - "Textbook Chapter 1"
          - "R for Data Science - Introduction"

    notes: "First day - keep it light and engaging"
```

### Week Status Lifecycle

Each week progresses through four states:

```
draft → generated → reviewed → published
```

| Status | Description | How to Achieve |
|--------|-------------|----------------|
| `draft` | Week is planned but content not yet generated | Manual creation or `/teaching:demo` |
| `generated` | AI-generated content exists but needs instructor review | `/teaching:lecture` command |
| `reviewed` | Instructor has reviewed and approved content | Manual status update after review |
| `published` | Content is finalized and distributed to students | Manual status update or LMS integration |

**Status Updates:**

```bash
# Generate content (draft → generated)
/teaching:lecture --week 3

# Mark as reviewed (manual edit of lesson-plans.yml)
# Change: status: generated → status: reviewed

# Publish to students (manual edit of lesson-plans.yml)
# Change: status: reviewed → status: published
```

### ID Conventions

Scholar uses structured IDs for cross-referencing and tracking:

| Element | Format | Example | Purpose |
|---------|--------|---------|---------|
| Learning Objectives | `LO-W.N` | `LO-3.1`, `LO-3.2` | Week 3, objectives 1 and 2 |
| Topics | `T-W.N` | `T-5.1`, `T-5.2` | Week 5, topics 1 and 2 |
| Activities | `A-W.N` | `A-7.1`, `A-7.2` | Week 7, activities 1 and 2 |
| Assessments | `TYPE-W` | `HW-4`, `QUIZ-6` | Homework 4, Quiz 6 |

**Benefits:**
- Unique identifiers for each learning element
- Easy cross-referencing in materials
- Alignment tracking (objectives → assessments)
- Progress monitoring across weeks

**Example Cross-Reference:**

```yaml
weeks:
  - week: 5
    learning_objectives:
      - id: LO-5.1
        text: "Interpret multiple regression coefficients"
    assessments:
      - id: HW-5
        alignment:
          - LO-5.1  # This homework assesses objective LO-5.1
          - LO-4.2  # Also assesses previous week's objective
```

---

## Workflows

### Creating a New Course (Demo Scaffolding)

Use `/teaching:demo` to scaffold a complete course structure.

#### Step-by-Step Process

**1. Run the Demo Command**

```bash
/teaching:demo
```

**2. Provide Course Information**

You'll be prompted for:
- Course name (e.g., "Introduction to Regression Analysis")
- Course level (undergraduate or graduate)
- Field (statistics, mathematics, data science, etc.)
- Number of weeks (default: 15)
- Meeting schedule (e.g., "TR" for Tuesday/Thursday)

**3. Review Generated Files**

The command creates:

```
.flow/
├── teach-config.yml       # Course configuration
└── lesson-plans.yml       # Semester manifest
```

**teach-config.yml** contains:

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"

  defaults:
    exam_format: "markdown"
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"

  style:
    tone: "conversational"
    notation: "statistical"
    examples: true
```

**lesson-plans.yml** contains:

```yaml
schema_version: "1.0"
semester:
  total_weeks: 15
  schedule: "TR"
  milestones:
    - week: 8
      type: midterm
    - week: 16
      type: final

weeks:
  - week: 1
    title: "Course Introduction"
    status: draft
  # ... 14 more weeks
```

**4. Customize the Manifest**

Edit `.flow/lesson-plans.yml` to add:
- Week titles specific to your course
- Milestones (breaks, exams, projects)
- Initial learning objectives
- Notes and planning ideas

**5. Start Generating Content**

```bash
# Generate first lecture
/teaching:lecture --week 1 --format qmd

# Generate an exam
/teaching:exam --topics "regression basics" --weeks 1-3
```

### Migrating from Directory Layout

If you have existing content in `content/lesson-plans/week01.yml`, `week02.yml`, etc., use `/teaching:migrate` to consolidate into a manifest.

#### Migration Process

**1. Check for Existing Week Files**

The migration tool scans these directories:
- `content/lesson-plans/`
- `lessons/`
- `weeks/`
- `teaching/lesson-plans/`

**2. Preview Migration**

```bash
/teaching:migrate --preview
```

Shows:
- Which week files will be merged
- What default values will be filled
- Any conflicts or missing data

Example output:

```
Migration Preview:
==================

Found 12 week files:
  content/lesson-plans/week01.yml → Week 1: "Course Introduction"
  content/lesson-plans/week02.yml → Week 2: "Simple Linear Regression"
  ...
  content/lesson-plans/week12.yml → Week 12: "Model Diagnostics"

Missing weeks (will use defaults):
  Week 13, 14, 15

Conflicts:
  None

Default values to be filled:
  - schema_version: "1.0"
  - semester.total_weeks: 15 (inferred from max week number)
  - semester.schedule: "TR" (default)
  - status: "draft" (for weeks with no content)
  - status: "reviewed" (for weeks with existing content)
```

**3. Execute Migration**

```bash
/teaching:migrate
```

Actions performed:
- Creates `.flow/lesson-plans.yml` with merged content
- Backs up existing manifest (if any) to `.flow/lesson-plans.yml.backup-TIMESTAMP`
- Preserves all learning objectives, topics, activities from week files
- Assigns appropriate statuses based on content completeness
- Backs up original week files to `content/lesson-plans/.archive/`

**4. Verify the Manifest**

Open `.flow/lesson-plans.yml` and check:
- All weeks are present
- Learning objectives transferred correctly
- Topics and activities preserved
- Milestones added appropriately

**5. Clean Up (Optional)**

```bash
# Remove archived week files if migration successful
rm -rf content/lesson-plans/.archive/
```

#### Post-Migration Best Practices

1. **Add Milestones**: Update `semester.milestones` with exams, breaks, project deadlines
2. **Review Statuses**: Ensure weeks have correct status (draft/generated/reviewed/published)
3. **Fill Gaps**: Add learning objectives for weeks that were incomplete
4. **Test Generation**: Try generating a lecture to ensure manifest works correctly

### Generating Weekly Lectures

Use `/teaching:lecture` to create lecture materials from the manifest.

#### Basic Usage

```bash
# Generate lecture for week 3 in Quarto format
/teaching:lecture --week 3 --format qmd

# Generate in Markdown
/teaching:lecture --week 5 --format md

# Generate in LaTeX Beamer
/teaching:lecture --week 8 --format tex
```

#### What Happens Internally

1. **Read Manifest**: Loads `.flow/lesson-plans.yml`
2. **Extract Week Data**: Gets learning objectives, topics, activities for specified week
3. **Apply Style**: Uses `teach-config.yml` preferences (tone, notation, examples)
4. **Generate Content**: AI creates lecture slides/notes based on manifest data
5. **Update Status**: Changes week status from `draft` → `generated`
6. **Save File**: Writes to `content/slides/weekNN-title.qmd` (or .md/.tex)

#### Generated Content Includes

- Title slide with week number and title
- Learning objectives section
- Slides for each topic (with estimated timing)
- Examples and exercises (if enabled in style config)
- Summary and next steps

#### After Generation

**Review the Output:**

```bash
# Preview Quarto lecture
quarto preview content/slides/week03-linear-regression.qmd

# Compile LaTeX lecture
cd content/slides
pdflatex week03-linear-regression.tex
```

**Update Manifest Status:**

After reviewing and approving the content, manually update the status:

```yaml
weeks:
  - week: 3
    title: "Introduction to Linear Regression"
    status: reviewed  # Changed from 'generated'
```

**Refine Content:**

Use `/teaching:lecture:refine` to improve specific sections:

```bash
# Add more examples to a topic
/teaching:lecture:refine --week 3 --section "Simple Linear Regression" --add-examples

# Simplify explanation
/teaching:lecture:refine --week 3 --section "Least Squares Estimation" --simplify
```

### Syncing with flow-cli

When both Scholar and flow-cli modify `.flow/lesson-plans.yml`, use `/teaching:sync` to merge changes.

#### Why Sync is Needed

**Scholar** updates the manifest when:
- Generating lectures (status changes)
- Creating assessments (adds to weeks array)
- Running demos (scaffolds new manifest)

**flow-cli** updates the manifest when:
- Scheduling tasks (`flow schedule --week 5 --task "Review regression notes"`)
- Tracking progress (`flow progress --week 3 --status completed`)
- Planning milestones (`flow milestone --week 10 --type break`)

#### Sync Strategies

| Strategy | Behavior | When to Use |
|----------|----------|-------------|
| `ours` | Scholar changes win | Default - trust Scholar's AI-generated content |
| `theirs` | flow-cli changes win | When flow-cli has manual instructor updates |
| `manual` | Show conflicts, user decides | Complex courses with frequent changes |

#### Sync Workflow

**1. Detect Conflicts**

```bash
/teaching:sync --check
```

Output:

```
Sync Status:
============

Base hash: a3f2c1b (stored in .scholar-cache/manifest-base-hash.txt)
Scholar version: b7e4d2f (current manifest)
flow-cli version: c9a1e3d (detected from flow-cli cache)

Conflicts:
  Week 5:
    - Scholar: status = 'generated'
    - flow-cli: status = 'reviewed'

  Week 7:
    - Scholar: added assessment HW-7
    - flow-cli: added milestone (project due)

Non-conflicting changes (will auto-merge):
  Week 3: learning_objectives updated (flow-cli only)
  Week 8: topics expanded (Scholar only)
```

**2. Perform Three-Way Merge**

```bash
# Use default strategy (ours)
/teaching:sync

# Use flow-cli changes
/teaching:sync --strategy theirs

# Manual resolution
/teaching:sync --strategy manual
```

**3. Verify Merge**

```bash
# Check updated manifest
cat .flow/lesson-plans.yml

# View merge log
cat .scholar-cache/last-sync.log
```

**4. Update Base Hash**

After successful merge, Scholar stores the new base hash:

```
.scholar-cache/
└── manifest-base-hash.txt    # Updated with merged version hash
```

#### Manual Conflict Resolution

For `--strategy manual`, Scholar presents conflicts:

```yaml
# Conflict in week 5 status
# <<<<<<< SCHOLAR
status: generated
# =======
status: reviewed
# >>>>>>> FLOW-CLI

# Your choice (1=Scholar, 2=flow-cli, 3=custom):
```

### Exporting Schemas

Scholar provides JSON schemas for external tool integration (VS Code, other editors, validation pipelines).

#### Available Schemas

| Schema | Export Path | Use Case |
|--------|-------------|----------|
| Lesson Plan (single week) | `./schemas/lesson-plan` | Validate individual week YAML |
| Teaching Style | `./schemas/teaching-style` | Validate `teach-config.yml` |
| Lesson Plans Manifest | `./schemas/lesson-plans-manifest` | Validate `.flow/lesson-plans.yml` |

#### Export to JSON Files

```bash
# Export all schemas
/teaching:schema:export --output-dir schemas/

# Export specific schema
/teaching:schema:export --schema lesson-plans-manifest --output schemas/manifest-schema.json
```

Generated files:

```
schemas/
├── lesson-plan-schema.json           # Single week structure
├── teaching-style-schema.json        # teach-config.yml structure
└── lesson-plans-manifest-schema.json # Full manifest structure
```

#### VS Code Integration

**1. Install YAML Extension**

```bash
code --install-extension redhat.vscode-yaml
```

**2. Add Schema Association**

In `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "./schemas/lesson-plans-manifest-schema.json": ".flow/lesson-plans.yml",
    "./schemas/teaching-style-schema.json": ".flow/teach-config.yml"
  }
}
```

**3. Enable Validation**

Now VS Code provides:
- Auto-completion for manifest fields
- Inline error highlighting
- Hover documentation for properties
- Validation on save

#### Programmatic Schema Access

For build tools, linters, or custom validation:

```javascript
// Import schema from Scholar package
import manifestSchema from 'scholar/schemas/lesson-plans-manifest';

// Use with AJV for validation
import Ajv from 'ajv';
const ajv = new Ajv();
const validate = ajv.compile(manifestSchema);

const isValid = validate(manifestData);
if (!isValid) {
  console.error(validate.errors);
}
```

---

## Configuration Reference

### .flow/teach-config.yml

Course-level configuration for Scholar's teaching commands.

```yaml
scholar:
  # Course identification and level
  course_info:
    level: "undergraduate"        # or "graduate"
    field: "statistics"           # domain area
    difficulty: "intermediate"    # "beginner" | "intermediate" | "advanced"

  # Default formats and preferences
  defaults:
    exam_format: "markdown"       # Default: md, qmd, tex, json
    lecture_format: "quarto"      # Default: quarto, markdown, beamer
    question_types:               # Allowed question types
      - "multiple-choice"
      - "short-answer"
      - "essay"
      - "true-false"
      - "coding"

  # AI generation style
  style:
    tone: "conversational"        # "formal" | "conversational" | "technical"
    notation: "statistical"       # Math notation style (e.g., "statistical", "pure-math")
    examples: true                # Include worked examples in lectures
    difficulty_progression: true  # Gradually increase difficulty within topics
    real_world_context: true      # Use applied examples from course field
```

**Field Options:**
- `statistics`, `mathematics`, `data-science`, `computer-science`, `economics`, `psychology`, `biology`, `chemistry`, `physics`, `engineering`

**Tone Examples:**
- `formal`: "One shall observe that the regression coefficient represents..."
- `conversational`: "Notice how the regression coefficient shows us..."
- `technical`: "The OLS estimator β̂ minimizes the sum of squared residuals..."

### .flow/lesson-plans.yml

Semester-wide manifest containing all lesson plans.

Full structure documented in [The Lesson Plans Manifest](#the-lesson-plans-manifest) section above.

**Key Sections:**
- `schema_version`: Format version for compatibility
- `semester`: Metadata (total_weeks, schedule, milestones)
- `weeks`: Array of weekly lesson plans

**Required Fields:**
- `schema_version` (string)
- `semester.total_weeks` (integer)
- `weeks` (array)
- Each week must have: `week` (number), `title` (string), `status` (string)

**Optional Fields:**
- `semester.schedule` (string)
- `semester.milestones` (array)
- Week fields: `learning_objectives`, `topics`, `activities`, `assessments`, `materials`, `notes`

---

## Troubleshooting

### "No manifest found"

**Problem:**

```
Error: Lesson plans manifest not found at .flow/lesson-plans.yml
```

**Solutions:**

1. **Create a new course:**
   ```bash
   /teaching:demo
   ```

2. **Migrate existing week files:**
   ```bash
   /teaching:migrate
   ```

3. **Manually create minimal manifest:**
   ```yaml
   # .flow/lesson-plans.yml
   schema_version: "1.0"
   semester:
     total_weeks: 15
   weeks:
     - week: 1
       title: "Week 1"
       status: draft
   ```

### "Schema validation failed"

**Problem:**

```
Error: Manifest validation failed:
  - weeks[2] missing required property: title
  - weeks[5].status must be one of: draft, generated, reviewed, published
```

**Solutions:**

1. **Check required fields for each week:**
   - `week` (number)
   - `title` (string)
   - `status` (one of: draft, generated, reviewed, published)

2. **Validate status values:**
   ```yaml
   # Wrong
   status: complete

   # Correct
   status: published
   ```

3. **Use schema export for IDE validation:**
   ```bash
   /teaching:schema:export --output-dir schemas/
   # Then configure VS Code YAML extension
   ```

4. **Run manual validation:**
   ```bash
   /teaching:validate --manifest .flow/lesson-plans.yml
   ```

### "Merge conflicts"

**Problem:**

```
Error: Cannot auto-merge changes from flow-cli
Conflicts found in weeks: 3, 7, 12
```

**Solutions:**

1. **Use explicit strategy:**
   ```bash
   # Trust Scholar changes
   /teaching:sync --strategy ours

   # Trust flow-cli changes
   /teaching:sync --strategy theirs
   ```

2. **Manual resolution:**
   ```bash
   # Review conflicts interactively
   /teaching:sync --strategy manual
   ```

3. **Check sync status before syncing:**
   ```bash
   /teaching:sync --check
   # Review conflicts before executing merge
   ```

4. **Reset to base version:**
   ```bash
   # If merge failed, restore from backup
   cp .flow/lesson-plans.yml.backup-TIMESTAMP .flow/lesson-plans.yml
   ```

### "Invalid week number"

**Problem:**

```
Error: Week 18 not found in manifest (total_weeks: 15)
```

**Solutions:**

1. **Check semester total_weeks:**
   ```yaml
   semester:
     total_weeks: 15  # Increase if needed
   ```

2. **Generate lecture for valid week:**
   ```bash
   /teaching:lecture --week 12  # Must be ≤ total_weeks
   ```

3. **Add weeks to manifest:**
   ```yaml
   weeks:
     - week: 16
       title: "Finals Week"
       status: draft
   ```

### "Missing teach-config.yml"

**Problem:**

```
Warning: teach-config.yml not found, using defaults
```

**Solutions:**

1. **Run demo to create config:**
   ```bash
   /teaching:demo
   ```

2. **Copy from Scholar defaults:**
   ```bash
   cp node_modules/scholar/templates/teach-config.yml .flow/
   ```

3. **Manually create minimal config:**
   ```yaml
   # .flow/teach-config.yml
   scholar:
     course_info:
       level: "undergraduate"
       field: "statistics"
     defaults:
       lecture_format: "quarto"
   ```

### "Cannot update week status"

**Problem:**

```
Error: Cannot update status for week 5 (current: published, requested: generated)
```

**Solutions:**

Status transitions must follow lifecycle:
```
draft → generated → reviewed → published
```

**Cannot go backwards** (published → generated is invalid).

If you need to regenerate published content:
1. Manually edit manifest to change status back to `draft`
2. Run `/teaching:lecture` again
3. Progress through lifecycle again

### "Schema version mismatch"

**Problem:**

```
Warning: Manifest schema version 0.9 is older than current version 1.0
Migration recommended
```

**Solutions:**

1. **Run migration tool:**
   ```bash
   /teaching:migrate:schema --from 0.9 --to 1.0
   ```

2. **Backup and update manually:**
   ```bash
   cp .flow/lesson-plans.yml .flow/lesson-plans.yml.v0.9-backup
   # Update schema_version field to "1.0"
   ```

---

## Next Steps

After mastering Phase 2 workflows:

1. **Explore Advanced Features:**
   - Custom templates for course-specific content
   - Alignment matrices (objectives → assessments)
   - Bloom's taxonomy tagging

2. **Integrate with External Tools:**
   - Export to LMS (Canvas, Blackboard)
   - Version control lesson plans with git
   - Automate content generation in CI/CD

3. **Share Templates:**
   - Contribute course templates to Scholar community
   - Create discipline-specific schemas
   - Build custom formatters for institutional standards

4. **Provide Feedback:**
   - Report issues: https://github.com/Data-Wise/scholar/issues
   - Request features: Phase 3 planning
   - Share success stories: Community showcases

---

**For More Information:**
- [Scholar Documentation](https://Data-Wise.github.io/scholar/)
- [Flow-CLI Integration Guide](https://github.com/Data-Wise/flow-cli)
- [API Reference](./API-REFERENCE.md)
