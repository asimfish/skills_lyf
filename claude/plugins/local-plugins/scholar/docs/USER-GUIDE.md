# Scholar Plugin - User Guide

> **Version:** 2.5.0
> **Last Updated:** 2026-01-29
> **Audience:** Educators, researchers, and academic professionals
>
> **📌 TL;DR - 30 Second Version**
>
> **Install:** `brew install scholar` ⏱️ 2 min
>
> **Try:** `/teaching:lecture "Your Topic"` or `/teaching:exam midterm` or `/arxiv "your topic"` ⏱️ 30 sec
>
> **Configure (optional):** Create `.flow/teach-config.yml` ⏱️ 5 min
>
> **Full guide below** ↓
>

This guide helps you get the most out of Scholar for your teaching and research workflows.

---

## Table of Contents

- [Getting Started](#getting-started-5-minutes-total)
- [Teaching Workflows](#teaching-workflows)
  - [Lecture Notes (v2.5.0)](#generating-lecture-notes-v250)
- [Research Workflows](#research-workflows)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Getting Started ⏱️ 5 minutes total

### Installation ⏱️ 2 minutes

> **💡 ⚡ Homebrew Auto-Installation**
>
> Homebrew handles **everything automatically** via post-install hooks - no manual steps!
>

### Option 1: Homebrew (macOS) - Recommended

```bash
brew tap data-wise/tap
brew install scholar
```

### Automatic post-install

- ✅ Creates symlink to `~/.claude/plugins/scholar`
- ✅ Syncs plugin cache with `claude plugin update scholar@local-plugins`
- ✅ Ready after restarting Claude Code

### Upgrading

```bash
brew upgrade scholar
# Post-install hook automatically updates plugin - just restart Claude Code!
```

### Manual activation (if needed)

```bash
claude plugin install scholar@local-plugins
```

### Option 2: Manual (Developers)

```bash
git clone https://github.com/Data-Wise/scholar
cd scholar
npm install
./scripts/install.sh

# Enable the plugin
claude plugin install scholar@local-plugins
```

### First Steps ⏱️ 3 minutes

1. **Verify installation**

   ```
   Type /teaching:exam or /arxiv in Claude Code
   ```

2. **Set up configuration (optional)**

   ```bash
   mkdir -p .flow
   # Create teach-config.yml for course-specific settings
   ```

3. **Try your first command**

   ```
   /teaching:quiz "Introduction to Statistics"
   ```

---

## Teaching Workflows

Scholar provides {{ scholar.teaching_commands }} teaching commands to automate course material creation.

### Creating Exams

> **💡 ⚡ Quick Win - Use --dry-run First**
>
> Preview exam structure without API calls:
>
> ```

/teaching:exam midterm --dry-run
    ```
    Instant feedback, no cost, adjust parameters before generating.

### Basic usage

```
/teaching:exam midterm
```

### Customized exam

```
/teaching:exam final --questions 20 --difficulty hard --duration 120
```

### Output formats

- Markdown (default)
- Quarto (.qmd for rendering)
- LaTeX (.tex for printing)
- Canvas QTI (for LMS upload)
- JSON (for programmatic use)

> **⚠️ ⚠️ Always Review AI-Generated Content**
>
> Never use exam questions without human review:
>
> - ✅ Verify factual accuracy
> - ✅ Check difficulty alignment
> - ✅ Ensure question clarity
> - ✅ Confirm learning objective match
>

### Example workflow

1. Generate exam: `/teaching:exam midterm --questions 15`
2. Review JSON output
3. Export to LaTeX: Convert using formatters
4. Print for students

### Creating Quizzes

### Quick quiz

```
/teaching:quiz "Linear Regression"
```

### Weekly quiz

```
/teaching:quiz "Week 5: Hypothesis Testing" --questions 5 --difficulty easy
```

### Generating Course Materials

### Syllabus

```
/teaching:syllabus "Introduction to Statistics" "Spring 2026"
```

### Assignments

```
/teaching:assignment "Regression Analysis Lab"
```

### Lecture slides

```
/teaching:slides "Introduction to Probability" --format quarto
```

### Grading rubrics

```
/teaching:rubric "Final Project"
```

### Providing Feedback

```
/teaching:feedback
# Claude will help you generate constructive feedback for student work
```

### Generating Lecture Notes (v2.5.0)

The `/teaching:lecture` command generates 20-40 page instructor-facing lecture notes in Quarto format. It supports three modes: **generate**, **refine**, and **validate**.

### Generate from a topic or lesson plan

```
/teaching:lecture "Multiple Regression"
/teaching:lecture --from-plan=week03 --output-dir=content/lectures/
/teaching:lecture "ANOVA" --from-plan=week08 --context=previous --open
```

### Refine specific sections

```
/teaching:lecture --refine=content/lectures/week08-rcbd.qmd \
  --section="Worked Examples" \
  --instruction="Add two more worked examples with R code"
```

### Validate coverage against a lesson plan

```
/teaching:lecture --check=content/lectures/week08-rcbd.qmd --from-plan=week08
```

> **💡 ⚡ Lecture Workflow - Weekly Production Pipeline**
>
> For weekly lecture prep, combine all three modes:
>
> 1. Generate: `/teaching:lecture --from-plan=week08 --output-dir=content/lectures/ --context=previous`
> 2. Validate: `/teaching:lecture --check=content/lectures/week08-rcbd.qmd --from-plan=week08`
> 3. Refine gaps: `/teaching:lecture --refine=content/lectures/week08-rcbd.qmd --section="..." --instruction="..."`
> 4. Preview: `/teaching:lecture --refine=content/lectures/week08-rcbd.qmd --open`
>

### Key options

- `--from-plan=WEEK` - Use lesson plan as source (e.g., `week03`)
- `--output-dir PATH` - Write to a specific directory
- `--context=previous` - Load prior weeks for continuity (default: 3 weeks)
- `--open` - Launch Quarto preview after generation
- `--force` - Skip overwrite confirmation
- `--language LANG` - Code language: `r` or `python` (default: `r`)

### Custom Prompt Templates (v2.4.0)

Place custom prompt templates in `.flow/templates/prompts/` to customize AI-generated content. Scholar auto-discovers and merges them with your teaching style.

```
course/
├── .flow/
│   ├── teach-config.yml
│   └── templates/
│       └── prompts/
│           └── lecture-notes.md   # Custom lecture prompt
```

---

## Research Workflows

Scholar supports literature management, manuscript writing, and simulation design.

### Literature Management

### Search arXiv

```
/arxiv "causal mediation analysis"
```

### Look up paper by DOI

```
/doi 10.1037/met0000425
```

### Add to BibTeX

```
/bib:add
# Follow prompts to add citation to your .bib file
```

### Search your bibliography

```
/bib:search "Pearl"
```

### Manuscript Writing

### Write methods section

```
/manuscript:methods
# Describe your statistical approach, Scholar helps structure it
```

### Write results section

```
/manuscript:results
# Provide your findings, Scholar helps present them clearly
```

### Review proofs

```
/manuscript:proof
# Scholar checks mathematical proofs for correctness
```

### Respond to reviewers

```
/manuscript:reviewer
# Draft responses to peer review comments
```

### Simulation Studies

### Design simulation

```
/simulation:design
# Plan Monte Carlo simulation studies
```

### Analyze results

```
/simulation:analysis
# Interpret simulation output
```

### Research Planning

### Find literature gaps

```
/scholar:lit-gap "your research area"
```

### Generate hypotheses

```
/scholar:hypothesis
```

### Create analysis plan

```
/scholar:analysis-plan
```

### Scout statistical methods

```
/scholar:method-scout
```

---

## Configuration

> **📝 💡 Configuration is Optional**
>
> Scholar works without config files - they just customize behavior. Skip this section if you're happy with defaults.
>

### Course Configuration

**File:** `.flow/teach-config.yml`

> **💡 🎯 Pro Tip - One Config, All Courses**
>
> Set up once per course, saves time on every command:
>
> ```bash
> mkdir -p .flow
> # Create teach-config.yml
> ```
>
> Now all `/teaching:*` commands use your preferences automatically.
>

```yaml
scholar:
  course_info:
    level: "undergraduate"  # or "graduate"
    field: "statistics"
    difficulty: "intermediate"  # beginner, intermediate, advanced

  defaults:
    exam_format: "markdown"  # md, qmd, tex, json
    lecture_format: "quarto"
    question_types:
      - "multiple-choice"
      - "short-answer"
      - "essay"

  style:
    tone: "formal"  # formal, conversational
    notation: "statistical"
    examples: true
```

> **⚠️ ⚠️ Common Mistake - YAML Indentation**
>
> **YAML requires exactly 2 spaces** for indentation:
>
> ❌ Wrong: Uses tabs or 4 spaces
>
> ```yaml
>     difficulty: "hard"  # 4 spaces - breaks!
> ```
>
> ✅ Correct: Exactly 2 spaces
>
> ```yaml
>   difficulty: "hard"  # 2 spaces - works!
> ```
>

### Configuration Discovery

Scholar automatically searches for `.flow/teach-config.yml`:

1. Current directory
2. Parent directories (up to 5 levels)

### Override with

```
/teaching:exam midterm --config /path/to/custom-config.yml
```

### Migrating Configurations

If you have v1 configs from Scholar < 2.0:

```
/teaching:migrate --detect   # Find v1 files
/teaching:migrate --dry-run  # Preview changes
/teaching:migrate            # Apply migration
```

---

## Best Practices

### For Teaching

1. **Start with configuration**
   - Create `.flow/teach-config.yml` at the start of semester
   - Set course level, field, and style preferences
   - Saves time on every command

2. **Use --dry-run first**

   ```
   /teaching:exam midterm --dry-run
   ```

   - Preview what will be generated
   - No API calls, instant feedback
   - Adjust parameters before final generation

3. **Use the lecture pipeline weekly**
   - Generate from lesson plans with `--from-plan`
   - Use `--context=previous` to build on earlier weeks
   - Validate coverage with `--check` before class
   - Refine sections iteratively with `--refine --section`

4. **Organize by semester**

   ```
   course/
   ├── .flow/
   │   └── teach-config.yml
   ├── content/
   │   ├── lectures/          # Generated .qmd lecture notes
   │   └── lesson-plans/      # Source YAML lesson plans
   ├── exams/
   ├── quizzes/
   └── assignments/
   ```

5. **Version control everything**
   - Track exams, quizzes, configs in Git
   - Easy to see changes over semesters
   - Rollback if needed

### For Research

1. **Maintain a bibliography file**
   - Use `/bib:add` to build your .bib file incrementally
   - Keep it in version control
   - Reference it in all papers

2. **Document your analysis**
   - Use `/manuscript:methods` early in the project
   - Update as your approach evolves
   - Easier than writing from scratch later

3. **Plan simulations carefully**
   - Use `/simulation:design` before coding
   - Helps identify edge cases
   - Saves time debugging later

---

## Troubleshooting

### Commands not working?

### Check installation

```bash
ls ~/.claude/plugins/scholar
```

### Reinstall if needed

```bash
brew upgrade scholar
# or
cd ~/projects/dev-tools/scholar && ./scripts/install.sh
```

### Configuration not found?

### Check search path

Scholar looks for `.flow/teach-config.yml` in:

1. Current directory
2. Parent directories (up to 5 levels)

### Create config

```bash
mkdir -p .flow
# Add teach-config.yml with your settings
```

### Validation errors?

### Use the validator

```
/teaching:validate --all
```

### Auto-fix common issues

```
/teaching:validate --fix
```

### Check syntax

```yaml
# Common issues:
# - Missing quotes around strings with colons
# - Inconsistent indentation (use 2 spaces)
# - Mixing tabs and spaces (use spaces only)
```

### Exam/quiz generation failed?

### Check API key

```bash
echo $ANTHROPIC_API_KEY
```

### Reduce complexity

```
/teaching:exam midterm --questions 5
# Try with fewer questions first
```

### Check config

```
/teaching:validate
```

---

## FAQ

### General Questions

### Q: How much does Scholar cost?

A: Scholar is free and open source. You need a Claude API key for AI generation features.

### Q: Can I use Scholar offline?

A: Commands that don't require AI (like `/teaching:validate`, `/teaching:migrate`) work offline. Generation commands need internet access.

### Q: What file formats are supported?

A: Markdown (.md), Quarto (.qmd), LaTeX (.tex), JSON, Canvas QTI (.xml)

### Teaching Questions

### Q: Can I customize exam templates?

A: Yes, configure question types, difficulty, and style in `.flow/teach-config.yml`

### Q: How do I export to Canvas?

A: Generate with Canvas QTI format, then import the .xml file to Canvas

### Q: Can I reuse questions across exams?

A: Yes, generate exams as JSON and extract/modify questions programmatically

### Q: How do I generate lecture notes?

A: Use `/teaching:lecture "Topic"` for a standalone topic, or `/teaching:lecture --from-plan=week03` to generate from a lesson plan. See [Generating Lecture Notes](#generating-lecture-notes-v250) for the full workflow.

### Q: Can I refine just one section of a lecture?

A: Yes. Use `--refine=path/to/file.qmd --section="Section Title" --instruction="your changes"`. Scholar fuzzy-matches section titles so you don't need the exact heading.

### Q: Does Scholar support multiple languages?

A: Currently English only. Internationalization planned for future releases.

### Research Questions

### Q: Can Scholar access my Zotero library?

A: Not directly. Use BibTeX export from Zotero, then use `/bib:*` commands

### Q: Does Scholar support R/Python code?

A: Results sections can include code snippets. Full code generation planned for v3.0

### Q: Can I cite papers from my BibTeX file?

A: Yes, use `/bib:search` to find citations, then reference in your manuscript

### Configuration Questions

### Q: What's the difference between v1 and v2 schemas?

A: v2 uses clearer field names (e.g., `course_title` vs `title`). Use `/teaching:migrate` to upgrade.

### Q: Can I have different configs for different courses?

A: Yes! Each course directory can have its own `.flow/teach-config.yml`

### Q: Do I need a config file?

A: No, Scholar uses sensible defaults. Config files let you customize behavior.

---

## Getting Help

### Documentation

- [Quick Start Guide](QUICK-START.md) - 5-minute introduction
- [Teaching Commands Reference](TEACHING-COMMANDS-REFERENCE.md) - Complete command list
- [Auto-Fixer Guide](AUTO-FIXER-GUIDE.md) - Configuration troubleshooting
- [What's New v2.5.0](WHATS-NEW-v2.5.0.md) - Latest features (lecture production pipeline)
- [What's New v2.4.0](WHATS-NEW-v2.4.0.md) - Prompt discovery system

### Community

- [GitHub Issues](https://github.com/Data-Wise/scholar/issues) - Report bugs, request features
- [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions) - Ask questions, share tips
- [Release Notes](https://github.com/Data-Wise/scholar/releases) - Version history

### Examples

See real-world examples in:

- `docs/examples.md` - Example commands and outputs
- `docs/TEACHING-WORKFLOWS.md` - Complete workflows (coming soon)

---

## Tips for Success

### Time-Saving Tips

1. **Create templates**
   - Set up `.flow/teach-config.yml` once
   - Reuse for all courses in that field

2. **Use batch commands**

   ```
   /teaching:migrate  # Migrate all configs at once
   /teaching:validate --all  # Check all configs
   ```

3. **Combine with version control**

   ```bash
   git commit -m "Add midterm exam"
   ```

   - Track changes over semesters
   - Easy to revert mistakes

### Quality Tips

1. **Review AI-generated content**
   - Always verify exam questions for accuracy
   - Check that difficulty matches your students' level
   - Ensure alignment with learning objectives

2. **Iterate and refine**
   - Use `--dry-run` to preview
   - Adjust parameters based on output
   - Regenerate with different settings

3. **Maintain consistency**
   - Use config files for consistent style
   - Follow naming conventions for files
   - Document your workflows

### Collaboration Tips

1. **Share configs**
   - Post your `.flow/teach-config.yml` to GitHub
   - Help colleagues get started faster

2. **Report issues**
   - If you find bugs, report on GitHub
   - Include examples and error messages
   - Help improve Scholar for everyone

3. **Contribute**
   - See [Developer Guide](DEVELOPER-GUIDE.md) for contributing
   - Add commands for your field
   - Share your workflows

---

**Last updated:** 2026-01-29
**Version:** 2.5.0
**Need help?** [Open an issue](https://github.com/Data-Wise/scholar/issues)
