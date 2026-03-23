# Scholar Plugin

> **Academic workflows for research and teaching** - Literature management, manuscript writing, simulation studies, course material generation, and 17 A-grade research skills

A comprehensive Claude Code plugin for academic workflows combining research and teaching. Features unified Plugin + MCP architecture with {{ scholar.command_count }} slash commands and research skills.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-{{ scholar.version }}-blue.svg)](https://github.com/Data-Wise/scholar/releases/tag/v{{ scholar.version }})
[![Tests](https://img.shields.io/badge/tests-{{ scholar.test_count }}%20passing-brightgreen.svg)](https://github.com/Data-Wise/scholar)

---

> **💡 ⚡ Quick Start - Get Up and Running in 2 Minutes**
>
> ```bash
> # 1. Install
> brew tap data-wise/tap && brew install scholar
>
> # 2. Try it
> /teaching:exam midterm  # or /arxiv "your topic"
> ```
>
> **New to Scholar?** → [ADHD Quick Start](ADHD-QUICK-START.md) (5-minute guide)
>

---

## Features (Scholar Plugin)

### {{ scholar.command_count }} Slash Commands

### Literature Management (4 commands)

- `/arxiv <query>` - Search arXiv for papers (top-level command)
- `/doi <doi>` - Look up paper metadata by DOI (top-level command)
- `/bib:search <query>` - Search BibTeX files for entries
- `/bib:add <file>` - Add BibTeX entries to bibliography

### Manuscript Writing (4 commands)

- `/manuscript:methods` - Write methods sections
- `/manuscript:results` - Write results sections
- `/manuscript:reviewer` - Generate reviewer responses
- `/manuscript:proof` - Review mathematical proofs

### Simulation Studies (2 commands)

- `/simulation:design` - Design Monte Carlo studies
- `/simulation:analysis` - Analyze simulation results

### Research Planning (4 commands)

- `/scholar:lit-gap <topic>` - Identify literature gaps
- `/scholar:hypothesis <topic>` - Generate research hypotheses
- `/scholar:analysis-plan` - Create statistical analysis plans
- `/scholar:method-scout <problem>` - Scout statistical methods for research problems

### Teaching ({{ scholar.teaching_commands }} commands)

- `/teaching:quiz <topic>` - Generate quiz questions with answer keys
- `/teaching:exam <type>` - Create comprehensive exams with rubrics
- `/teaching:assignment <topic>` - Create homework assignments with solutions
- `/teaching:syllabus <course>` - Generate comprehensive course syllabus
- `/teaching:slides <topic>` - Create lecture slides with speaker notes
- `/teaching:rubric <type>` - Generate detailed grading rubrics
- `/teaching:feedback <assignment>` - Generate constructive student feedback
- `/teaching:demo [path]` - Create demo course environment
- `/teaching:lecture <topic>` - Generate comprehensive lecture notes
- `/teaching:validate` - Validate YAML configuration files
- `/teaching:diff` - Check YAML/JSON sync status
- `/teaching:sync` - Synchronize YAML to JSON
- `/teaching:migrate` - Batch migrate v1→v2 schema
- `/teaching:solution` - Generate standalone solution keys from existing assignment files (NEW v2.13.0)
- `/teaching:config` - Manage prompts, config inspection, validation, drift detection, provenance (NEW v2.9.0)
- `/teaching:validate-r` - Validate R code chunks in .qmd files via Rscript (NEW v2.14.0)
- `/teaching:preflight` - Run 6 pre-release health checks (version sync, conflicts, tests, cache, changelog, status) (NEW v2.15.0)
- `/teaching:canvas` - Convert QMD exam files to Canvas LMS QTI format via examark (NEW v2.16.0)

### Command Discovery (1 command)

- `/scholar:hub` - Browse all commands with `[AI]` markers, drill into categories with option counts, get usage details and flags (NEW v2.7.0, flag discovery v2.12.0)

### 🎯 17 A-Grade Skills

Skills automatically activate when relevant to your work:

### Mathematical (4 skills)

- `proof-architect` - Rigorous proof construction and validation
- `mathematical-foundations` - Statistical theory foundations
- `identification-theory` - Parameter identifiability analysis
- `asymptotic-theory` - Large-sample theory

### Implementation (5 skills)

- `simulation-architect` - Monte Carlo study design
- `algorithm-designer` - Statistical algorithm development
- `numerical-methods` - Numerical optimization and computation
- `computational-inference` - Computational statistical inference
- `statistical-software-qa` - Statistical software quality assurance

### Writing (3 skills)

- `methods-paper-writer` - Statistical methods manuscripts
- `publication-strategist` - Journal selection and positioning
- `methods-communicator` - Clear statistical communication

### Research (5 skills)

- `literature-gap-finder` - Research gap identification
- `cross-disciplinary-ideation` - Cross-field method transfer
- `method-transfer-engine` - Adapting methods across domains
- `mediation-meta-analyst` - Mediation analysis meta-analysis
- `sensitivity-analyst` - Sensitivity analysis design

### 🔧 Shell API Wrappers

Lightweight shell-based APIs for research tools:

- `arxiv-api.sh` - arXiv paper search and PDF download
- `crossref-api.sh` - DOI lookup and BibTeX retrieval
- `bibtex-utils.sh` - BibTeX file search, add, format

### 🏗️ Architecture

### Unified Plugin + MCP Pattern (Features (Scholar Plugin))

- `src/core/` - Framework-agnostic business logic
- `src/plugin-api/` - Claude Plugin commands and skills
- `src/mcp-server/` - MCP Protocol tools
- `lib/` - External API wrappers (arXiv, Crossref, BibTeX)

This architecture eliminates IPC overhead by sharing core logic directly between both APIs.

---

## Installation

### From Homebrew (Recommended)

> **💡 ⚡ Fully Automatic - No Manual Steps Required**
>
> Homebrew automatically installs **and activates** the plugin via post-install hooks!
>

```bash
brew tap data-wise/tap
brew install scholar
```

### What happens automatically

1. ✅ Plugin installed to `~/.claude/plugins/scholar`
2. ✅ Registered in `~/.claude/local-marketplace` (plugin discovery)
3. ✅ Plugin cache synced with `claude plugin update scholar@local-plugins`
4. ✅ Ready to use - just restart Claude Code

**First install?** Restart Claude Code to load the plugin.

---

### Upgrading

When you upgrade via Homebrew, the post-install hook automatically updates the plugin:

```bash
brew upgrade scholar
# ↓ Post-install hook runs automatically
# claude plugin update scholar@local-plugins
```

### You don't need to run any plugin commands manually

Just restart Claude Code to load the new version.

---

### How It Works

Homebrew uses a symlink chain to integrate with Claude Code:

```
~/.claude/local-marketplace/scholar  ← Plugin discovery
    ↓ (symlink)
~/.claude/plugins/scholar
    ↓ (symlink)
/opt/homebrew/opt/scholar/libexec  ← Stable path (survives upgrades)
    ↓ (symlink)
/opt/homebrew/Cellar/scholar/<version>/libexec  ← Actual files
```

### Claude Code Plugin System

| Component       | Purpose                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| **Marketplace** | `~/.claude/local-marketplace` - Plugin discovery                          |
| **Registry**    | `~/.claude/plugins/installed_plugins.json` - Version tracking             |
| **Cache**       | `~/.claude/plugins/cache/local-plugins/scholar/<version>/` - Loaded files |

When you upgrade via Homebrew:

1. New version installed to `/opt/homebrew/Cellar/scholar/<new-version>/`
2. Stable symlink updated: `/opt/homebrew/opt/scholar` → new version
3. Post-install hook runs: `claude plugin update scholar@local-plugins`
4. Claude Code cache updated with new version
5. Restart Claude Code → new version loads

---

### Manual Activation (if needed)

If Claude Code was running during installation, auto-enable is skipped to avoid conflicts:

```bash
claude plugin install scholar@local-plugins
```

This is expected behavior and only needed once.

### From Source (Development)

```bash
# Navigate to scholar repository
cd ~/projects/dev-tools/scholar

# Install in development mode (symlink - changes reflected immediately)
./scripts/install.sh --dev

# Or install in production mode (copy)
./scripts/install.sh

# Enable the plugin
claude plugin install scholar@local-plugins
```

### Verify Installation

```bash
# Check plugin is installed
ls -la ~/.claude/plugins/scholar

# Verify plugin is enabled
claude plugin list | grep scholar

# Run tests
./tests/test-plugin-structure.sh
```

---

## Quick Start

> **📝 🎯 Choose Your Path**
>
>

| I want to...          | Use this command              | Time    |
| --------------------- | ----------------------------- | ------- |
| Teach Create an exam  | `/teaching:exam midterm`      | ~30 sec |
| 📝 Make a quiz       | `/teaching:quiz "Topic"`      | ~20 sec |
| 📚 Find papers       | `/arxiv "topic"`              | ~10 sec |
| ✍️ Write methods     | `/manuscript:methods`         | ~60 sec |
| 📊 Generate syllabus | `/teaching:syllabus "Course"` | ~45 sec |

### Literature Search

```bash
# Search arXiv
/arxiv "bootstrap mediation analysis"

# Look up specific paper
/doi "10.1080/00273171.2014.962683"

# Search your BibTeX files
/bib:search "mediation"
```

### Manuscript Writing (Search your BibTeX)

```bash
# Generate methods section
/manuscript:methods

# Write results section with statistical details
/manuscript:results

# Respond to reviewer comments
/manuscript:reviewer
```

### Teaching

```bash
# Create course syllabus
/teaching:syllabus "Introduction to Statistics" --semester "Fall 2026"

# Generate lecture slides (75-minute class)
/teaching:slides "Multiple Regression" 75 --format "reveal.js"

# Create quiz with answer key
/teaching:quiz "Hypothesis Testing" --count 10 --types "multiple-choice,short-answer"

# Generate homework assignment
/teaching:assignment "Linear Regression" --problems 5 --difficulty intermediate
```

### Research Planning (Generate homework assignment)

```bash
# Identify literature gaps
/scholar:lit-gap "causal mediation analysis"

# Generate hypotheses
/scholar:hypothesis "mediation moderation"

# Create analysis plan
/scholar:analysis-plan
```

---

## What's New in v{{ scholar.version }}

**Release Date:** {{ scholar.release_date }}

### Canvas QTI Export (v2.16.0)

- **`/teaching:canvas`:** Convert QMD exam files to Canvas LMS QTI format via examark CLI
- **10 question types:** MC, MA, TF, Short Answer, Numeric, Essay, Matching, FMB, FIB, Upload — auto-detected from QMD content
- **Full pipeline:** QMD parser → type detector → ExamarkFormatter → examark CLI → `.qti.zip`
- **Validation:** `--validate` flag runs examark dry-run, `--emulate` simulates Canvas import behavior
- **Documentation:** API reference, pipeline guide, troubleshooting table, Canvas integration tutorial

### Previous Releases

- **v2.15.0** — Insights-driven: `/teaching:preflight` (6 health checks), R validation pipeline (`--validate` flag on 4 commands), email integration (`--send` on 5 commands)
- **v2.14.0** — R code validator: `/teaching:validate-r`, per-chunk reporting, static lint, CI-friendly
- **v2.13.0** — Solution key generator: `/teaching:solution`, QMD parser, `--send` email, md/qmd/json formats
- **v2.12.0** — Hub flag discovery: `[AI]` markers, option counts, full Options display, `extractFlags()` engine
- **v2.11.0** — Custom instructions: `--instructions` / `-i` flag on 8 commands, InstructionMerger engine
- **v2.10.0** — Maintenance sprint: ESLint 10, Jest 30, glob 13, security fixes, Node >=20.19

### 📊 Stats

| Metric              | v2.3.0 | v{{ scholar.version }} | Change         |
| ------------------- | ------ | ------ | -------------- |
| Commands            | 22     | {{ scholar.command_count }}     | +11            |
| Tests               | 1,391  | {{ scholar.test_count }}  | +1,911 (+137%) |
| Documentation Pages | 45     | 230+   | +185           |

**See release notes:** [v2.16.0](WHATS-NEW-v2.16.0.md) | [v2.15.0](WHATS-NEW-v2.15.0.md) | [v2.14.0](WHATS-NEW-v2.14.0.md) | [v2.13.0](WHATS-NEW-v2.13.0.md) | [v2.12.0](WHATS-NEW-v2.12.0.md) | [v2.11.0](WHATS-NEW-v2.11.0.md) | [v2.9.0](WHATS-NEW-v2.9.0.md) | [v2.8.0](WHATS-NEW-v2.8.0.md) | [v2.7.0](WHATS-NEW-v2.7.0.md) | [v2.6.0](WHATS-NEW-v2.6.0.md) | [v2.5.0](WHATS-NEW-v2.5.0.md) | [v2.4.0](WHATS-NEW-v2.4.0.md)

---

## Command Reference

### Literature Management

#### `/arxiv <query> [limit]`

Search arXiv for papers matching your query.

### Examples (Command Reference)

```bash
/arxiv "bootstrap mediation"
/arxiv "causal inference" 20
```

**Output:** Title, authors, arXiv ID, publication date, abstract preview

**Follow-up Actions:** Get full details, download PDF, add BibTeX entry

---

#### `/doi <doi>`

Look up paper metadata by DOI using Crossref API.

### Examples

```bash
/doi "10.1037/met0000165"
/doi 10.1080/00273171.2014.962683
```

**Output:** Full citation, BibTeX entry, journal information

---

#### `/bib:search <query>`

Search BibTeX files in your project for entries matching keywords.

### Examples - Command Reference

```bash
/bib:search "mediation"
/bib:search "Baron Kenny"
```

**Output:** Matching BibTeX entries with citation keys

---

#### `/bib:add <file>`

Add BibTeX entries to your bibliography file.

### Examples - Command Reference 2

```bash
/bib:add references.bib
```

---

### Manuscript Writing (Command Reference)

#### `/manuscript:methods`

Generate a methods section for statistical manuscript.

### Includes (Command Reference)

- Study design description
- Statistical methods with mathematical notation
- Software and implementation details
- Assumptions and diagnostics

---

#### `/manuscript:results`

Write a results section with statistical findings.

### Includes

- Descriptive statistics
- Model fit and diagnostics
- Parameter estimates with uncertainty
- Interpretation in context

---

#### `/manuscript:reviewer`

Generate responses to reviewer comments.

### Features (Command Reference)

- Point-by-point responses
- Additional analyses if requested
- Clarifications and revisions
- Professional academic tone

---

#### `/manuscript:proof`

Review mathematical proofs in manuscript for correctness and clarity.

---

### Simulation Studies

#### `/simulation:design`

Design a Monte Carlo simulation study.

### Includes - Command Reference

- Data generation mechanisms
- Estimator implementations
- Performance metrics
- Parallelization strategy

---

#### `/simulation:analysis`

Analyze simulation results and create summary tables.

### Output (Command Reference)

- Bias, variance, MSE, coverage
- Publication-quality tables
- Convergence diagnostics

---

### Research Planning (Command Reference)

#### `/scholar:lit-gap <topic>`

Identify gaps in literature for a research area.

### Output

- Current state of literature
- Identified gaps and opportunities
- Potential research questions

---

#### `/scholar:hypothesis <topic>`

Generate testable research hypotheses.

### Output - Command Reference

- Theoretical hypotheses
- Statistical hypotheses
- Expected findings

---

#### `/scholar:analysis-plan`

Create a comprehensive statistical analysis plan.

### Includes - Command Reference 2

- Research questions
- Statistical methods
- Sample size justification
- Analysis workflow

---

### Teaching Commands

#### `/teaching:quiz <topic> [options]`

Generate quiz questions with answer keys.

### Examples - Command Reference 3

```bash
/teaching:quiz "Hypothesis Testing"
/teaching:quiz "ANOVA" --count 15 --types "multiple-choice,short-answer"
```

**Options:** `--count`, `--types`, `--difficulty`, `--format` (markdown, json, qti)

### Includes - Command Reference 3

- Varied question types and difficulty levels
- Answer key with explanations
- Point allocations
- Canvas QTI export for LMS integration

---

#### `/teaching:assignment <topic> [options]`

Create homework assignments with solutions.

### Examples - Command Reference 4

```bash
/teaching:assignment "Linear Regression"
/teaching:assignment "Probability" --problems 8 --difficulty intermediate
```

**Options:** `--problems`, `--difficulty`, `--format` (markdown, json, latex)

### Includes - Command Reference 4

- Clear problem statements
- Mix of conceptual and computational problems
- Detailed step-by-step solutions
- Grading rubric

---

#### `/teaching:slides <topic> [duration] [options]`

Create lecture slides with speaker notes.

### Examples - Command Reference 5

```bash
/teaching:slides "Multiple Regression"
/teaching:slides "Bootstrap Methods" 75 --format "reveal.js"
```

**Options:** `--format` (markdown, "reveal.js", beamer, quarto), `--level`, `--include-code`

### Includes - Command Reference 5

- Optimized slide count for duration (~2.5 min/slide)
- Learning objectives and key takeaways
- Content, example, and practice slides
- Speaker notes with timing suggestions
- LaTeX math notation

---

#### `/teaching:syllabus <course> [options]`

Generate comprehensive course syllabus.

### Examples - Command Reference 6

```bash
/teaching:syllabus "Introduction to Statistics"
/teaching:syllabus "STAT 440" --semester "Fall 2026"
```

**Options:** `--semester`, `--format` (markdown, json, latex, html), `--weeks`

### Includes - Command Reference 6

- Course and instructor information
- Learning outcomes (Bloom's taxonomy)
- Grading policy with components and scale
- Week-by-week schedule
- Course policies (academic integrity, accessibility)

---

## Skills Reference

Skills automatically activate based on context. See `src/plugin-api/skills/README.md` for detailed documentation of all 17 A-grade skills.

### When do skills activate?

- Writing methods → `methods-paper-writer`, `methods-communicator`
- Designing simulations → `simulation-architect`, `numerical-methods`
- Mathematical proofs → `proof-architect`, `mathematical-foundations`
- Literature review → `literature-gap-finder`, `cross-disciplinary-ideation`

---

## Architecture Details

### Unified Plugin + MCP Pattern (Architecture Details)

```
scholar/
├── src/
│   ├── core/              # Business logic (framework-agnostic)
│   │   ├── literature/    # Literature search, metadata
│   │   ├── manuscript/    # Writing assistance
│   │   └── teaching/      # Course material generation
│   ├── plugin-api/        # Claude Plugin commands/skills
│   │   ├── commands/
│   │   └── skills/
│   └── mcp-server/        # MCP Protocol tools (future)
├── lib/                   # External API wrappers
│   ├── arxiv-api.sh
│   ├── crossref-api.sh
│   └── bibtex-utils.sh
├── tests/                 # Test suite
└── scripts/               # Installation scripts
```

### Benefits

- No IPC overhead (shared core library)
- Single source of truth for business logic
- Both APIs consume the same tested code
- Easy to maintain and extend

---

## Development

### Running Tests

```bash
cd scholar
./tests/test-plugin-structure.sh
```

### Test Coverage

- ✅ Required files present
- ✅ Valid JSON in plugin.json
- ✅ Directory structure
- ✅ 17+ commands exist
- ✅ Teaching commands present (quiz, assignment, slides, syllabus)
- ✅ 15+ skills exist
- ✅ API wrappers present
- ✅ No hardcoded paths
- ✅ Valid command frontmatter
- ✅ Teaching generators ({{ scholar.test_count }}+ unit tests)
- ✅ Template validation
- ✅ Export format tests

### Modifying Commands

Commands are in `src/plugin-api/commands/`. Each command is a markdown file with:

1. **YAML frontmatter** (name, description)
2. **User-facing documentation**
3. **`<system>` block** with implementation details

### Example

```markdown
---
name: arxiv
description: Search arXiv for papers
---

# Search arXiv 2

User-facing instructions here...

<system>
Implementation details for Claude...
</system>
```

### Adding New Commands

1. Create `.md` file in appropriate category directory
2. Add frontmatter with `name:` and `description:`
3. Write user-facing documentation
4. Add `<system>` block with implementation
5. Test: `/namespace:command "test input"`

---

## Roadmap

### Phase 1: Research Foundation (Complete)

- ✅ 13 research commands from statistical-research
- ✅ 17 A-grade skills
- ✅ Shell API wrappers
- ✅ Unified directory structure
- ✅ Installation scripts

### Phase 2: Teaching Commands (Complete) ⭐

- ✅ `/teaching:quiz` - Quiz generation with Canvas QTI export
- ✅ `/teaching:assignment` - Homework with solutions
- ✅ `/teaching:slides` - Lecture slides (4 formats)
- ✅ `/teaching:syllabus` - Course syllabus generation
- ✅ Comprehensive test suite ({{ scholar.test_count }}+ tests)
- ✅ JSON Schema validation for all content
- ✅ Multiple export formats per command

### Phase 3: Advanced Features (Future)

- [ ] MCP Server integration
- [x] LMS integration (Canvas QTI export via `/teaching:canvas`)
- [ ] PDF/Word export
- [ ] Calendar integration
- [x] Examark integration for exam building (`/teaching:canvas`)

---

## Contributing

Contributions are welcome! This is a standalone project focused on academic workflows.

### Development workflow

1. Fork the repository: https://github.com/Data-Wise/scholar
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `./tests/test-plugin-structure.sh`
5. Commit with clear messages
6. Push and submit a pull request

### See also

- [claude-plugins monorepo](https://github.com/Data-Wise/claude-plugins) for shared tooling and standards
- [craft](https://github.com/Data-Wise/craft) and [rforge](https://github.com/Data-Wise/claude-plugins/tree/main/rforge) - Related projects

---

## License

MIT License - see [LICENSE](https://github.com/Data-Wise/scholar/blob/main/LICENSE) file for details.

---

## Support

- **Issues:** https://github.com/Data-Wise/scholar/issues
- **Repository:** https://github.com/Data-Wise/scholar
- **Documentation:** See `docs/` directory for comprehensive guides

---

## Related Projects

- **[craft](https://github.com/Data-Wise/craft)** - Full-stack developer toolkit (86 commands, 8 agents, 21 skills)
- **[rforge](https://github.com/Data-Wise/claude-plugins/tree/main/rforge)** - R package ecosystem orchestrator with mode system
- **[claude-plugins](https://github.com/Data-Wise/claude-plugins)** - Shared tooling and plugin development standards

### Migration from older plugins

- `workflow` → Merged into craft (v1.17.0)
- `statistical-research` → Superseded by scholar (v1.0.0)

---

**Ready to use!** Try: `/arxiv "your research topic"`
