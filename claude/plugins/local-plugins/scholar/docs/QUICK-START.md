# Scholar Plugin - Quick Start

> **Get up and running in 5 minutes**
> **Latest:** v{{ scholar.version }} ({{ scholar.command_count }} commands, {{ scholar.test_count }} tests)

---

## Install (2 minutes)

### Option 1: Homebrew (Recommended)

> **💡 ⚡ Fully Automatic Installation**
>
> Homebrew handles **everything automatically** via post-install hooks - just restart Claude Code!
>

```bash
# Install
brew tap data-wise/tap
brew install scholar
```

### What happens automatically

1. ✅ Plugin installed to `~/.claude/plugins/scholar`
2. ✅ Plugin cache synced with `claude plugin update scholar@local-plugins`
3. ✅ Ready to use - just restart Claude Code

### Upgrading

```bash
brew upgrade scholar
# Post-install hook automatically runs: claude plugin update scholar@local-plugins
# Just restart Claude Code - no manual plugin commands needed!
```

### Manual activation (if needed)

```bash
claude plugin install scholar@local-plugins
```

### Option 2: Manual Installation

```bash
cd ~/projects/dev-tools/scholar
./scripts/install.sh --dev

# Enable the plugin
claude plugin install scholar@local-plugins
```

**Done!** Restart Claude Code to load the plugin.

---

## First Commands (1 minute)

Try these commands to see the plugin in action:

### Teaching: Generate an Exam

```
/teaching:exam midterm --questions 10
```

**What it does:** Creates a complete exam with questions, answer key, and optional LaTeX export.

### Teaching: Create a Quiz

```
/teaching:quiz "Chapter 5: Hypothesis Testing"
```

**What it does:** Generates a quick quiz with multiple question types and solutions.

### Research: Search arXiv for Papers

```
/arxiv "mediation analysis"
```

**What it does:** Searches arXiv for statistical papers, returns titles, authors, and abstracts.

### Research: Find Literature Gaps

```
/scholar:lit-gap "causal mediation with time-varying confounders"
```

**What it does:** Identifies gaps in the literature for your research area.

---

## The 5 Command Categories

**Teaching** (`/teaching:*`) - Course materials and assessments ({{ scholar.teaching_commands }} commands)

```bash
/teaching:exam midterm      # Generate comprehensive exam
/teaching:quiz "topic"      # Create quick quiz
/teaching:syllabus "course" # Build course syllabus
/teaching:assignment        # Create homework
/teaching:rubric            # Generate grading rubric
/teaching:migrate           # Batch migrate v1→v2 schema (NEW in v2.3.0)
/teaching:validate          # Validate YAML configs with auto-fixer
```

**Literature** (`/arxiv`, `/doi`, `/bib:*`) - Manage papers and citations

```bash
/arxiv "topic"           # Search arXiv
/doi 10.xxxx/yyyy        # Lookup by DOI
/bib:add                 # Add to BibTeX
/bib:search "author"     # Search your .bib file
```

**Manuscript** (`/manuscript:*`) - Write and improve papers

```bash
/manuscript:methods    # Write methods section
/manuscript:results    # Write results section
/manuscript:proof      # Review mathematical proofs
/manuscript:reviewer   # Respond to peer reviews
```

**Simulation** (`/simulation:*`) - Monte Carlo studies

```bash
/simulation:design    # Design simulation study
/simulation:analysis  # Analyze simulation results
```

**Research** (`/scholar:*`) - Planning and ideation (10 commands total)

```bash
/scholar:hypothesis     # Generate hypotheses
/scholar:analysis-plan  # Create analysis plan
/scholar:lit-gap        # Find literature gaps
/scholar:method-scout   # Scout statistical methods
```

---

## Auto-Activating Skills

You don't need to invoke skills manually - they activate automatically when relevant:

**Working on proofs?** → Proof Architect skill activates
**Designing simulations?** → Simulation Architect skill activates
**Writing methods?** → Methods Paper Writer skill activates

**17 skills total** across 4 categories:

- Mathematical (4 skills)
- Implementation (5 skills)
- Writing (3 skills)
- Research (5 skills)

See full list: `docs/REFCARD.md`

---

## Common Workflows

### Create a Midterm Exam

```bash
# 1. Generate exam with questions and answers
/teaching:exam midterm --questions 15

# 2. Export to LaTeX for printing
# (Claude will offer export options after generation)

# 3. Create grading rubric
/teaching:rubric "midterm exam"
```

**Output formats:** Markdown, LaTeX (student + answer key + rubric), Canvas QTI, Quarto

### Build Course Materials

```bash
# 1. Create course syllabus
/teaching:syllabus "Introduction to Statistics" "Spring 2026"

# 2. Generate weekly quiz
/teaching:quiz "Week 3: Probability Distributions"

# 3. Create homework assignment
/teaching:assignment "Linear Regression Basics"
```

### Literature Review

```bash
# 1. Search for papers
/arxiv "your topic"

# 2. Look up specific papers
/doi 10.1037/met0000425

# 3. Add to bibliography
/bib:add

# 4. Find gaps
/scholar:lit-gap "your area"
```

### Writing a Paper

```bash
# 1. Write methods section
/manuscript:methods

# 2. Write results section
/manuscript:results

# 3. Review proofs (if applicable)
/manuscript:proof

# 4. Respond to reviewers (after submission)
/manuscript:reviewer
```

### Simulation Study

```bash
# 1. Design study
/simulation:design

# 2. Run your simulations (outside Claude)

# 3. Analyze results
/simulation:analysis
```

---

## Tips for Best Results

1. **Be specific** - Better: `/lit:arxiv "causal mediation bootstrap"` vs `/lit:arxiv "mediation"`

2. **Use natural language** - The skills understand context:
   - "I need to prove this estimator is consistent" → Triggers Asymptotic Theory
   - "Help me design a simulation" → Triggers Simulation Architect

3. **BibTeX commands need .bib files** - Make sure you have a `.bib` file in your project directory

4. **Skills don't need invocation** - Just describe your task naturally and relevant skills activate

---

## What's Next?

- **Full command list:** See `docs/REFCARD.md`
- **What's new:** See `docs/WHATS-NEW-v2.5.0.md` (lecture production) and `docs/WHATS-NEW-v2.4.0.md` (prompt discovery)
- **Testing guide:** See `docs/TESTING-GUIDE.md`
- **Auto-fixer guide:** See `docs/AUTO-FIXER-GUIDE.md`
- **Developer guide:** See `docs/DEVELOPER-GUIDE.md`
- **Plugin source:** https://github.com/Data-Wise/scholar
- **Releases:** https://github.com/Data-Wise/scholar/releases

---

## Uninstall

```bash
# If installed via Homebrew
brew uninstall scholar

# If installed manually
cd ~/projects/dev-tools/scholar
./scripts/uninstall.sh
```

---

## Troubleshooting

### Commands not showing up?

- If using Homebrew: `brew upgrade scholar` (auto-syncs plugin cache)
- Restart Claude Code
- Manually sync: `claude plugin update scholar@local-plugins`
- Check installation: `ls ~/.claude/plugins/scholar`

### Exam generation issues?

- Ensure you're in a project directory
- Check `.flow/teach-config.yml` exists for course-specific settings (optional)

### arXiv search not working?

- Check internet connection
- Try a simpler query

### LaTeX export not compiling?

- Ensure `pdflatex` is installed (`brew install basictex` on macOS)
- Check the generated `.tex` file for syntax errors

### BibTeX commands fail?

- Ensure `.bib` file exists in your project
- Check file path in command

---

**You're ready!** Try `/teaching:exam midterm` or `/arxiv "your research topic"` to get started.
