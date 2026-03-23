# Scholar - ADHD Quick Start 🧠⚡

> **Ultra-condensed 5-minute guide** - Get Scholar working FAST, understand it LATER

**Last Updated:** 2026-02-09 | **Version:** {{ scholar.version }}

---

## ⚡ 2-Minute Install → Try

```bash
# 1. Install (30 seconds - fully automatic!)
brew tap data-wise/tap && brew install scholar

# 2. Restart Claude Code (30 seconds)
# Just restart the app - Homebrew already installed everything!

# 3. Try it (30 seconds)
/teaching:exam midterm

# 4. Done!
```

> **✅ ✨ Homebrew Auto-Magic**
>
> Post-install hooks automatically:
>
> - ✅ Install plugin to `~/.claude/plugins/scholar`
> - ✅ Sync plugin cache with `claude plugin update scholar@local-plugins`
> - ✅ No manual steps required!
>

### Upgrading? (30 seconds)

```bash
brew upgrade scholar  # Auto-updates plugin - just restart Claude Code!
```

### Manual activation (if needed)

```bash
claude plugin install scholar@local-plugins
```

**What you get:** A complete exam with questions, answer key, ready to use.

---

## 🔍 Don't Know Where to Start?

```bash
/scholar:hub                   # Browse ALL {{ scholar.command_count }} commands
/scholar:hub quick             # Compact one-liner reference
```

---

## 🎯 Choose Your Path

### 👨‍🏫 Teaching

### One command per task (🎯 Choose Your Path)

```bash
/teaching:exam midterm         # Comprehensive exam
/teaching:quiz "Topic"         # Quick quiz
/teaching:syllabus "Course"    # Course syllabus
/teaching:assignment "Topic"   # Homework
/teaching:rubric "Assignment"  # Grading rubric
```

**💡 Pro tip:** Add `--dry-run` to preview before generating

**Next:** [Teaching Workflows](TEACHING-WORKFLOWS.md) for complete examples

### 🔬 Research

### One command per task

```bash
/arxiv "your topic"           # Search papers
/doi 10.xxxx/yyyy             # Look up by DOI
/manuscript:methods           # Write methods section
/simulation:design            # Plan simulation
```

**💡 Pro tip:** Use specific queries for better results

**Next:** [USER-GUIDE.md](USER-GUIDE.md#research-workflows) for research workflows

### ⚙️ Configure

### Only if you want customization

```bash
mkdir -p .flow
# Create .flow/teach-config.yml with your preferences
```

### Example config

```yaml
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
  defaults:
    exam_format: "markdown"
```

**Next:** [Configuration Guide](USER-GUIDE.md#configuration)

---

## 🧠 ADHD-Friendly Features

### Visual Workflow (No Reading Required)

```mermaid
graph LR
    A[Install Scholar] --> B{What do you need?}
    B -->|Exam| C[/teaching:exam]
    B -->|Quiz| D[/teaching:quiz]
    B -->|Papers| E[/arxiv search]
    C --> F[Review Output]
    D --> F
    E --> F
    F --> G[Use It!]
```

### Quick Decision Tree

### ❓ "Which command should I use?"

| I need to...      | Command                       | Time    |
| ----------------- | ----------------------------- | ------- |
| Create an exam    | `/teaching:exam midterm`      | ~30 sec |
| Make a quiz       | `/teaching:quiz "Topic"`      | ~20 sec |
| Find papers       | `/arxiv "topic"`              | ~10 sec |
| Write methods     | `/manuscript:methods`         | ~60 sec |
| Generate syllabus | `/teaching:syllabus "Course"` | ~45 sec |

---

## ⚡ Quick Wins (Do These First)

### 1. Generate Your First Exam ⏱️ 30 seconds

```bash
/teaching:exam midterm --questions 5
```

### What happens (⚡ Quick Wins)

- Scholar generates 5 exam questions
- Includes answer key
- Returns as Markdown (ready to use)

**🎯 Success marker:** You see questions and answers displayed

---

### 2. Search for Research Papers ⏱️ 15 seconds

```bash
/arxiv "mediation analysis"
```

### What happens

- Searches arXiv database
- Returns top 10 papers
- Shows titles, authors, abstracts

**🎯 Success marker:** You see a list of papers

---

### 3. Create a Quiz ⏱️ 20 seconds

```bash
/teaching:quiz "Hypothesis Testing"
```

### What happens - ⚡ Quick Wins

- Generates quiz with multiple question types
- Includes solutions and explanations
- Returns as JSON/Markdown

**🎯 Success marker:** You see quiz questions with answers

---

## 🚨 Common Mistakes (Avoid These)

> **⚠️ ❌ Don't: Run commands outside Claude Code**
>
> Scholar is a Claude Code plugin - it won't work in terminal or web interface
>
> **⚠️ ❌ Don't: Expect instant results for long exams**
>
> `/teaching:exam final --questions 50` takes ~2 minutes
>
> **⚠️ ❌ Don't: Skip YAML validation**
>
> If you create `.flow/teach-config.yml`, run `/teaching:validate` first
>

---

## 💡 Pro Tips (Time Savers)

### Tip 1: Use `-dry-run` for previews ⏱️ Saves 30+ seconds

```bash
/teaching:exam midterm --dry-run
# See what will be generated WITHOUT API calls
```

### Tip 2: Batch generate quizzes ⏱️ Saves hours

```bash
# Create weekly quizzes for entire semester
/teaching:quiz "Week 1: Intro"
/teaching:quiz "Week 2: Probability"
# ... etc
```

### Tip 3: Save configs for reuse ⏱️ Saves 5+ min per course

```yaml
# One config file = consistent style across all materials
.flow/teach-config.yml
```

---

## 📊 Progress Checklist

Track your Scholar onboarding:

- [ ] **Installed Scholar** ⏱️ 2 min
- [ ] **Ran first command** (`/teaching:exam` or `/arxiv`) ⏱️ 1 min
- [ ] **Reviewed output** (checked questions/papers) ⏱️ 2 min
- [ ] **Tried second command** (different category) ⏱️ 1 min
- [ ] **Read USER-GUIDE.md** (optional) ⏱️ 10 min
- [ ] **Created config file** (optional) ⏱️ 5 min

**Total time:** 5-15 minutes depending on depth

---

## 🎓 What's Next?

### If you want to learn more

| Goal               | Read This                                                      | Time   |
| ------------------ | -------------------------------------------------------------- | ------ |
| Teaching workflows | [TEACHING-WORKFLOWS.md](TEACHING-WORKFLOWS.md)                 | 15 min |
| All commands       | [REFCARD.md](REFCARD.md)                                       | 10 min |
| Configuration      | [USER-GUIDE.md#configuration](USER-GUIDE.md#configuration)     | 10 min |
| Troubleshooting    | [USER-GUIDE.md#troubleshooting](USER-GUIDE.md#troubleshooting) | 5 min  |

### If you just want to use it

**✅ You're done!** Use the commands above and refer back when needed.

---

## 🆘 Stuck? (Troubleshooting)

### Commands not showing up?

```bash
# Reload plugin
brew upgrade scholar
# Restart Claude Code
```

### Exam generation failed?

```bash
# Try simpler version first
/teaching:exam midterm --questions 3
```

### Config validation errors?

```bash
# Auto-fix common issues
/teaching:validate --fix
```

---

## 📚 Full Documentation

This is the **ultra-condensed** version. For complete documentation:

- **Main docs:** https://data-wise.github.io/scholar/
- **GitHub:** https://github.com/Data-Wise/scholar
- **Quick Start:** [QUICK-START.md](QUICK-START.md) (5-minute version)
- **User Guide:** [USER-GUIDE.md](USER-GUIDE.md) (complete guide)

---

## 🎯 Summary (TL;DR of TL;DR)

```bash
# 1. Install
brew install scholar

# 2. Use
/teaching:exam midterm  # or /arxiv "topic"

# 3. Profit!
```

**That's it.** Everything else is optional customization.

---

**Made for ADHD brains by ADHD brains** 🧠⚡

**Questions?** [GitHub Issues](https://github.com/Data-Wise/scholar/issues)
