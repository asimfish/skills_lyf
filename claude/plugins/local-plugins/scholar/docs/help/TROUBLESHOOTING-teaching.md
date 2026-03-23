---
render_macros: false
---

# Troubleshooting Guide - Scholar Teaching Commands

> **Quick Fixes for Common Issues**
> Version: 2.17.0 | Last Updated: 2026-02-09

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation & Setup Issues](#installation-setup-issues)
3. [Command Execution Errors](#command-execution-errors)
4. [Content Generation Problems](#content-generation-problems)
5. [Output Format Issues](#output-format-issues)
6. [Configuration Problems](#configuration-problems)
7. [Config Management Issues](#config-management-issues)
8. [Integration Issues](#integration-issues)
9. [Performance & Quality](#performance-quality)
10. [Diagnostic Checklist](#diagnostic-checklist)
11. [Advanced Debugging](#advanced-debugging)

---

## Quick Diagnostics

Run these checks first to identify your issue. Most problems fall into one of these categories.

### Check 1: Is Scholar Installed?

```bash
scholar --version
```

**Expected output:**

```
Scholar v2.17.0
```

**If not found:**

- Try: `brew install scholar`
- Or: `npm list -g @data-wise/scholar`
- See [Scholar command not found](#problem-scholar-command-not-found)

---

### Check 2: Is Claude API Key Set?

```bash
echo $ANTHROPIC_API_KEY
```

**Expected output:**

```
sk-ant-...
```

**If empty:**

- Set it: `export ANTHROPIC_API_KEY=sk-ant-your-key`
- Add to `~/.bashrc` or `~/.zshrc` for persistence
- See [API authentication failures](#problem-api-authentication-failures)

---

### Check 3: Is Config File Detected?

```bash
ls -la .flow/teach-config.yml
```

**Expected:**
File exists in current directory or parent directory.

**If missing:**

- Create it: `mkdir -p .flow && touch .flow/teach-config.yml`
- See [Config file not detected](#problem-config-file-not-detected)

---

### Check 4: Are You in the Right Directory?

```bash
pwd
ls -la
```

You should be in your course root directory (where teaching files live).

**Not sure?** Look for:

- `.flow/teach-config.yml`
- `exams/`, `slides/`, `assignments/` directories
- `.git/` folder (if using version control)

---

### Check 5: Is Your Command Syntax Correct?

```bash
# Basic test - should show help if supported
/teaching:exam --help
/teaching:quiz --help
```

**Common syntax mistakes:**

- Missing colon: `/teaching exam` ❌ (should be `/teaching:exam`)
- Wrong quotes: `topic "with quotes"` ❌ (use single or no quotes)
- Flags after topic: `/teaching:exam --format qmd midterm` ❌ (put flags after topic)
- Wrong order: `/teaching:exam "topic" --questions 20` ✅ (correct)

See [Teaching Commands Refcard](../refcards/teaching-commands.md) for correct syntax.

---

## Installation & Setup Issues

### Problem: Scholar command not found

**Symptoms:**

- `-bash: /teaching:exam: command not found`
- `Unknown command: /teaching:exam`
- Commands don't appear in Claude Code

**Causes:**

- Scholar not installed
- Plugin not loaded in Claude Code
- Wrong PATH environment variable
- Installation incomplete

**Solution:**

**Step 1: Verify installation**

```bash
which scholar
npm list -g @data-wise/scholar
brew list scholar
```

**Step 2: Install if missing**

```bash
# Recommended (Homebrew)
brew tap data-wise/tap
brew install scholar

# Or direct npm
npm install -g @data-wise/scholar
```

**Step 3: Register plugin (Claude Code)**

```bash
claude plugin list | grep scholar
# If not listed:
claude plugin install scholar@local-plugins
# OR
claude plugin install scholar
```

**Step 4: Restart Claude Code**

- Close and reopen Claude Code
- Or reload the extension

**Step 5: Verify**

```bash
/teaching:exam --help
# Should show help text
```

**Prevention:**

- Keep Scholar updated: `brew upgrade scholar`
- Verify after major macOS/Claude Code updates

---

### Problem: Plugin not loading in Claude Code

**Symptoms:**

- Teaching commands not showing up
- `Unknown command: /teaching:*` errors
- Plugin marked as "disabled" or "inactive"

**Causes:**

- Plugin installation failed
- Claude Code cache corrupted
- Permissions issue
- Plugin incompatible with Claude version

**Solution:**

**Step 1: Check plugin status**

```bash
# In Claude Code terminal
/scholar --version
# or
claude plugin list
```

**Step 2: Reinstall plugin**

```bash
claude plugin uninstall scholar
claude plugin install scholar
```

**Step 3: Clear cache**

```bash
# macOS
rm -rf ~/Library/Caches/Claude\ Code/
rm -rf ~/.claude/plugins/cache/

# Restart Claude Code
```

**Step 4: Verify installation file**

```bash
# Check if plugin files exist
ls -la ~/.claude/plugins/
ls -la /opt/homebrew/opt/scholar/libexec/  # If installed via Homebrew
```

**Step 5: Check permissions**

```bash
# Scholar plugin should be readable
chmod +r ~/.claude/plugins/scholar/*
chmod +x ~/.claude/plugins/scholar/bin/*
```

**Prevention:**

- Don't disable Scholar plugin in Claude Code settings
- Keep Claude Code updated
- Reinstall after Claude major updates

---

### Problem: Config file not detected

**Symptoms:**

- "No teach-config.yml found, using defaults"
- Warnings in output
- Commands use generic defaults instead of your settings

**Causes:**

- Config file in wrong location
- Wrong filename (case-sensitive, must be `.flow/teach-config.yml`)
- File has YAML syntax errors (treated as missing)
- Config discovery stopped before finding file

**Solution:**

**Step 1: Check file location**

```bash
# Current directory
ls -la .flow/teach-config.yml

# Or search up the tree
cd exams
ls -la ../.flow/teach-config.yml
ls -la ../../.flow/teach-config.yml
```

**Expected search path (in order):**

```
./.flow/teach-config.yml           ← Current directory
../.flow/teach-config.yml          ← Parent directory
../../.flow/teach-config.yml       ← Grandparent directory
/etc/scholar/teach-config.yml      ← System (optional)
```

**Step 2: Create config in correct location**

```bash
# From any subdirectory within your course
mkdir -p .flow
cat > .flow/teach-config.yml << 'EOF'
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
EOF
```

**Step 3: Validate YAML syntax**

```bash
# Use YAML validator
python -m yaml < .flow/teach-config.yml
# Or check manually (look for indentation errors)
```

**Step 4: Test detection**

```bash
# Explicit path (overrides search)
/teaching:exam midterm --config .flow/teach-config.yml

# Or enable debug mode
SCHOLAR_DEBUG=1 /teaching:exam midterm
```

**Step 5: If still not found**

```bash
# Check if file is readable
ls -la .flow/teach-config.yml
file .flow/teach-config.yml
# Should show "YAML document text"

# Check YAML is valid
ruby -ryaml -e 'YAML.load_file(".flow/teach-config.yml")'
```

**Prevention:**

- Place `.flow/teach-config.yml` at course root
- Use relative path from any subdirectory
- Keep YAML valid (check indentation - spaces, not tabs)
- Test with: `/teaching:validate`

---

### Problem: Permission denied errors

**Symptoms:**

- `EACCES: permission denied` when creating files
- `Cannot write to output directory`
- `Operation not permitted`

**Causes:**

- Output directory not writable
- File ownership issue
- Disk is read-only
- File locked by another process

**Solution:**

**Step 1: Check directory permissions**

```bash
ls -ld .           # Current directory
ls -ld exams/      # Output directory
```

**Output should show `rwx` for owner (first 3 chars):**

```
drwxr-xr-x   # Good (owner can read/write/execute)
dr-xr-xr-x   # Bad (owner cannot write)
```

**Step 2: Fix permissions**

```bash
# Make directory writable
chmod u+w .
chmod u+w exams/

# Or fix ownership
chown $(whoami) exams/
```

**Step 3: Check disk space**

```bash
df -h
# Should show available space (not 100%)
```

**Step 4: Check for locked files**

```bash
# See if files are open
lsof +D ./exams/

# Or in activity monitor
# Check if Scholar processes are running
pgrep -f scholar
```

**Step 5: Try different output location**

```bash
# Generate to /tmp first (should always work)
/teaching:exam midterm --output /tmp/exam.md

# If that works, original directory has permission issue
```

**Prevention:**

- Don't run Scholar with `sudo` (causes permission issues)
- Keep course directory in user home (`~/teaching/`)
- Avoid shared/network drives for course files
- Use `.gitignore` to track permission issues

---

### Problem: Path issues

**Symptoms:**

- `Cannot find module`, `ENOENT: no such file`
- Files generated to wrong location
- Cannot read config files from subdirectories

**Causes:**

- Working directory is wrong
- Relative paths not resolved correctly
- Symbolic links broken
- Installation in unusual location

**Solution:**

**Step 1: Check current working directory**

```bash
pwd
# Output should show course root
/Users/prof/courses/stat440
```

**Step 2: Verify relative paths**

```bash
# If in subdirectory, verify paths work
cd exams
ls -la ../.flow/teach-config.yml  # Should exist

# Test path resolution
/teaching:validate
# Should find config even from subdirectory
```

**Step 3: Use absolute paths for clarity**

```bash
# Instead of relative:
/teaching:exam --config .flow/teach-config.yml

# Use absolute:
/teaching:exam --config /Users/prof/courses/stat440/.flow/teach-config.yml
```

**Step 4: Check for symbolic links**

```bash
# If course is symlinked
ls -la ~/teaching
# Check if target exists
ls -la $(readlink ~/teaching)
```

**Step 5: Verify Scholar installation path**

```bash
# Where is Scholar installed?
which scholar
ls -la $(which scholar)

# For npm global install:
npm list -g @data-wise/scholar --depth=0
```

**Prevention:**

- Use absolute paths in scripts
- Verify paths work from all subdirectories
- Avoid complex directory nesting (limit depth to 5 levels)
- Use consistent directory names (no spaces)

---

## Command Execution Errors

### Problem: "Command not found" errors

**Symptoms:**

- `-bash: /teaching:exam: command not found`
- `Unknown command: /teaching:*`
- Command works sometimes, not others

**Causes:**

- Command name misspelled
- Plugin not installed or loaded
- Plugin version too old
- Shell not recognizing plugin prefix

**Solution:**

**Step 1: Check command name**

```bash
# Correct names (with colon)
/teaching:exam
/teaching:quiz
/teaching:slides
/teaching:assignment
/teaching:lecture
/teaching:syllabus
/teaching:rubric
/teaching:feedback
/teaching:demo

# Wrong (no colon) - won't work
/teaching exam
/teaching quiz
```

**Step 2: List available commands**

```bash
# In Claude Code
/teaching:  # Type this and hit Tab for autocomplete
# Should show list of commands

# Or check plugin
scholar --help
scholar teaching --help
```

**Step 3: Verify plugin loaded**

```bash
claude plugin list | grep scholar
# Should show: scholar (active/enabled)

# If not:
claude plugin install scholar
```

**Step 4: Check command spelling**

```bash
# Common misspellings:
/teaching:assignment  ✅ (correct)
/teaching:assigment   ❌ (missing 'n')
/teaching:syllabus    ✅ (correct)
/teaching:silabus     ❌ (wrong spelling)
```

**Step 5: Update plugin if old**

```bash
# Check version
scholar --version    # Should be 2.17.0+

# Update if older
brew upgrade scholar
npm update -g @data-wise/scholar
```

**Prevention:**

- Use autocomplete (Tab key) to avoid typos
- Keep Scholar updated
- Bookmark [Teaching Commands Refcard](../refcards/teaching-commands.md)

---

### Problem: API authentication failures

**Symptoms:**

- `Unauthorized: API key not valid`
- `401 Unauthorized`
- `ANTHROPIC_API_KEY not found`
- `Invalid API key format`

**Causes:**

- API key not set
- API key incorrect/expired
- API key doesn't have permissions
- Wrong API key format

**Solution:**

**Step 1: Check if API key exists**

```bash
echo $ANTHROPIC_API_KEY
# Should show: sk-ant-xxxxx...

# If empty, it's not set
```

**Step 2: Get valid API key**

- Visit: https://console.anthropic.com/keys
- Create new key if needed
- Copy the key (starts with `sk-ant-`)

**Step 3: Set API key temporarily (test)**

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
/teaching:exam test --dry-run
# Should work if key is valid
```

**Step 4: Set API key permanently**

**For Bash (macOS):**

```bash
# Edit ~/.bashrc
echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.bashrc
source ~/.bashrc
```

**For Zsh (newer macOS):**

```bash
# Edit ~/.zshrc
echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.zshrc
source ~/.zshrc
```

**For Fish shell:**

```bash
# Edit ~/.config/fish/config.fish
set -Ux ANTHROPIC_API_KEY sk-ant-your-key-here
```

**Step 5: Verify API key works**

```bash
# Simple test
/teaching:exam test --dry-run --questions 1

# Should show preview without using API
```

**Step 6: Check API account status**

- Visit: https://console.anthropic.com/account/billing
- Verify account is active
- Check usage limits haven't been exceeded

**Prevention:**

- Never hardcode API keys in scripts or config files
- Rotate keys periodically
- Use environment variable for security
- Check API quota before large batch operations

---

### Problem: Rate limit errors

**Symptoms:**

- `429 Too Many Requests`
- `Rate limit exceeded`
- `Please try again in X seconds`
- Timeout after waiting

**Causes:**

- Making too many API requests too quickly
- API quota exceeded for the month
- Anthropic rate limiting active
- Network interference

**Solution:**

**Step 1: Check rate limit error details**

```bash
# Error message should indicate:
# - Time to wait before retry
# - Number of requests allowed
# - Your current usage
```

**Step 2: Wait before retrying**

```bash
# If error says "wait 10 seconds", do:
sleep 10
/teaching:exam midterm  # Retry
```

**Step 3: Reduce question count**

```bash
# Instead of large batch:
/teaching:exam final --questions 50

# Use smaller batches:
/teaching:exam final --questions 15
sleep 60  # Wait 1 minute
/teaching:exam practice --questions 15
```

**Step 4: Enable request throttling (in config)**

```yaml
scholar:
  ai_generation:
    rate_limit:
      max_requests_per_minute: 5
      batch_delay_seconds: 60
```

**Step 5: Batch with delays**

```bash
#!/bin/bash
# Script to generate multiple items with delays
for week in {1..5}; do
    echo "Generating week $week..."
    /teaching:slides "Week $week"
    sleep 60  # Wait 1 minute between requests
done
```

**Step 6: Check monthly quota**

```bash
# Visit: https://console.anthropic.com/account/billing/limits
# See your monthly API limit and current usage
```

**Step 7: Contact support if quota exceeded**

- Email: support@anthropic.com
- Include: API key (last 8 chars), usage details

**Prevention:**

- Batch requests with 30-60 second delays
- Generate content during off-peak hours
- Monitor API usage monthly
- Use `--dry-run` to preview before generation

---

### Problem: Timeout errors

**Symptoms:**

- `ETIMEDOUT: connection timed out`
- `Timeout waiting for response`
- Command hangs (no output for 5+ minutes)
- Generation appears stuck

**Causes:**

- Network connection slow/unstable
- API server slow to respond
- Request too complex (too many questions)
- Local system overloaded

**Solution:**

**Step 1: Check network connection**

```bash
# Test internet connectivity
ping google.com
# Or
curl -I https://api.anthropic.com/

# Should get response quickly
```

**Step 2: Test with smaller request**

```bash
# Instead of:
/teaching:exam final --questions 50

# Try:
/teaching:quiz test --questions 3
```

**Step 3: Increase timeout (in config)**

```yaml
scholar:
  ai_generation:
    timeout: 60000  # 60 seconds (default: 30)
    max_retries: 5  # More retry attempts (default: 3)
```

**Step 4: Enable verbose logging**

```bash
SCHOLAR_DEBUG=1 /teaching:exam test --questions 5
# Shows detailed timing information
```

**Step 5: Check system resources**

```bash
# See if system is overloaded
top -n 1 -l 5 | head -15
# Or Activity Monitor > CPU tab

# Free up memory if needed
```

**Step 6: Check API status**

- Visit: https://status.anthropic.com/
- See if API is experiencing issues

**Step 7: Retry with exponential backoff**

```bash
#!/bin/bash
# Retry with increasing delays
for attempt in {1..3}; do
    /teaching:exam test && break
    sleep $((2 ** attempt))  # 2, 4, 8 seconds
done
```

**Prevention:**

- Don't timeout after 10 minutes of waiting - it's likely working
- Use `--dry-run` for initial preview (no API call)
- Generate at off-peak times
- Check network before starting long operations

---

### Problem: Invalid arguments

**Symptoms:**

- `Invalid argument`, `Unknown option`
- `Expected value for flag`
- Command partially executes then errors

**Causes:**

- Wrong flag name or spelling
- Missing value for flag that requires one
- Invalid value for flag (wrong type)
- Flags in wrong position

**Solution:**

**Step 1: Check flag names**

```bash
# Correct flag names (with double dash)
/teaching:exam midterm --questions 20
/teaching:exam midterm --difficulty hard
/teaching:exam midterm --format qmd

# Wrong (single dash)
/teaching:exam midterm -questions 20  ❌
```

**Step 2: Check flag values**

```bash
# Flags that require values:
--questions N           # Must be a number
--difficulty LEVEL      # Must be: beginner|intermediate|advanced
--format FORMAT         # Must be: md|qmd|tex|json
--duration MINUTES      # Must be a number
--variations N          # Must be a number

# Boolean flags (no value needed)
--no-solutions          # Just flag, no value
--no-formulas           # Just flag, no value
--dry-run               # Just flag, no value
```

**Step 3: Verify flag order**

```bash
# Correct order (topic first, then flags)
/teaching:exam midterm --questions 20

# Wrong order (flags before topic)
/teaching:exam --questions 20 midterm  ❌
```

**Step 4: Check valid values**

For `--difficulty`:

- `beginner` - Introductory concepts
- `intermediate` - Mid-level application
- `advanced` - Graduate-level synthesis

For `--format`:

- `md` - Markdown
- `qmd` - Quarto (reproducible)
- `tex` - LaTeX
- `json` - Machine-readable
- `canvas` - LMS import

For `--question-types`:

- `multiple-choice`
- `short-answer`
- `essay`
- `true-false`
- `numerical`

**Step 5: Test with --help**

```bash
/teaching:exam --help
# Shows all valid options and examples
```

**Prevention:**

- Use tab completion in Claude Code
- Reference [Teaching Commands Refcard](../refcards/teaching-commands.md)
- Test with `--dry-run` first
- Check help before running

---

### Problem: Missing required parameters

**Symptoms:**

- `Missing required parameter: topic`
- `Topic is required`
- Command runs but generates generic content

**Causes:**

- Forgot to provide topic name
- Topic in quotes but empty
- Command used without arguments

**Solution:**

**Step 1: Add topic parameter**

Each command needs a topic/name:

```bash
# Exam - requires exam name
/teaching:exam midterm          ✅
/teaching:exam                  ❌ (missing topic)

# Quiz - requires topic
/teaching:quiz "Linear Regression"   ✅
/teaching:quiz                       ❌ (missing topic)

# Slides - requires topic
/teaching:slides "ANOVA"        ✅
/teaching:slides                ❌ (missing topic)

# Syllabus - requires course name and semester
/teaching:syllabus "STAT 440" "Spring 2026"  ✅
/teaching:syllabus                           ❌ (missing both)
```

**Step 2: Use proper quoting**

```bash
# With quotes (for multi-word topics)
/teaching:exam "Final Exam"
/teaching:quiz "Hypothesis Testing Concepts"

# Without quotes (single word)
/teaching:exam midterm
/teaching:quiz regression
```

**Step 3: Check command syntax**

```bash
# Get help for specific command
/teaching:exam --help
# Shows required and optional parameters
```

**Step 4: Verify config provides defaults**

```yaml
scholar:
  defaults:
    exam_name: "default"  # Some defaults available
```

**Prevention:**

- Always include topic as first parameter
- Use `--help` to check required parameters
- Use tab completion (auto-suggests format)
- Test with simple example first

---

### Problem: Config parsing errors

**Symptoms:**

- `Invalid YAML syntax`
- `JSON parse error`
- `Config file malformed`
- Specific line number shown in error

**Causes:**

- YAML indentation wrong (tabs instead of spaces)
- Unclosed quotes or brackets
- Invalid field names
- Comments in wrong place

**Solution:**

**Step 1: Check YAML syntax**

```bash
# Validate YAML file
ruby -ryaml -e 'YAML.load_file(".flow/teach-config.yml")'
# If valid, returns data; if invalid, shows error

# Or use Python
python -m yaml < .flow/teach-config.yml
```

**Step 2: Check indentation**

**Wrong (tabs):**

```yaml
scholar:
→ course_info:       # Tab character (shown as →)
```

**Correct (spaces):**

```yaml
scholar:
  course_info:       # 2 spaces
```

**Step 3: Fix common errors**

**Unclosed quotes:**

```yaml
# Wrong
field: "statistics  # Missing closing quote

# Correct
field: "statistics"
```

**Missing colons:**

```yaml
# Wrong
course_info
  level: "undergraduate"

# Correct
course_info:
  level: "undergraduate"
```

**Unquoted special characters:**

```yaml
# Wrong
title: Regression: Analysis & Theory

# Correct
title: "Regression: Analysis & Theory"
```

**Step 4: Use auto-fixer**

```bash
/teaching:fix
# Automatically detects and repairs common errors
```

**Step 5: Validate entire config**

```bash
/teaching:validate .flow/teach-config.yml
# Shows all validation errors
```

**Step 6: Create minimal config**

If config is corrupted, start fresh:

```bash
# Backup old config
mv .flow/teach-config.yml .flow/teach-config.yml.bak

# Create minimal config
cat > .flow/teach-config.yml << 'EOF'
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"
EOF
```

**Prevention:**

- Use proper YAML editor (VS Code with YAML extension)
- Validate after each edit
- Use auto-fixer regularly
- Keep backup of working config

---

### Problem: Output directory issues

**Symptoms:**

- `Cannot create output file`, `ENOENT`
- Files not being written
- Files appear but are empty
- Permission errors

**Causes:**

- Output directory doesn't exist
- Directory not writable
- Path is relative and working directory wrong
- Disk full

**Solution:**

**Step 1: Check output directory exists**

```bash
# Default output location (current directory)
pwd
ls -la

# Or check if subdirectory exists
ls -la exams/   # If using exams/ subdirectory
```

**Step 2: Create output directory if missing**

```bash
# Create exam subdirectory
mkdir -p exams
mkdir -p quizzes
mkdir -p slides
mkdir -p assignments

# Verify
ls -la exams/
```

**Step 3: Verify directory is writable**

```bash
# Check permissions (owner should have 'w')
ls -ld exams/
# Should show: drwxr-xr-x or similar

# Fix if not writable
chmod u+w exams/
```

**Step 4: Use explicit output path**

```bash
# Specify exact output location
/teaching:exam midterm --output exams/exam-midterm.md

# Or output to temp for testing
/teaching:exam test --output /tmp/exam-test.md
```

**Step 5: Check available disk space**

```bash
df -h /
# Should show available space > 100MB

# If full, clean up
rm -rf ~/Library/Caches/*
```

**Step 6: Test file creation**

```bash
# Simple write test
touch exams/test.txt
echo "test" > exams/test.txt
ls -la exams/test.txt

# If this works, Scholar should work too
```

**Prevention:**

- Create directory structure first
- Use consistent paths (no spaces, no special chars)
- Run from course root directory
- Check disk space before batch operations

---

## Content Generation Problems

### Problem: Generated content too generic

**Symptoms:**

- Content lacks specific details
- Examples are vague or generic
- Doesn't match course context
- Could apply to any subject

**Causes:**

- Topic too vague
- Config missing course context
- Custom prompts not specific enough
- AI model set to low temperature

**Solution:**

**Step 1: Provide more specific topic**

Instead of:

```bash
/teaching:slides "ANOVA"
```

Use:

```bash
/teaching:slides "One-way ANOVA with agricultural examples and multiple comparisons testing"
```

**Step 2: Add course context to config**

```yaml
scholar:
  course_info:
    field: "agricultural science"
    examples:
      datasets:
        - "crop yield data"
        - "fertilizer experiments"
      contexts:
        - "crop growth studies"
        - "pesticide effectiveness"
```

**Step 3: Create custom prompt**

```yaml
scholar:
  prompts:
    slides: |
      Create slides focused on ONE-WAY ANOVA in agricultural research.

      Include:
      - Real crop/soil examples (not generic)
      - Worked calculations with actual data
      - Agricultural applications
      - Common assumptions in field experiments

      Audience: Agriculture students (not statistics majors)
```

**Step 4: Adjust AI temperature**

```yaml
scholar:
  ai_generation:
    temperature: 0.5  # Lower = more consistent (0.0-0.3 for precise)
                      # Higher = more varied (0.7-0.9 for creative)
```

**Step 5: Review and refine**

```bash
# Generate initial version
/teaching:slides "ANOVA in Agriculture"

# Use refine command to improve
/teaching:lecture --refine slides-anova.qmd \
  --section "Examples" \
  --instruction "Add 3 specific agricultural examples with real numbers"
```

**Prevention:**

- Spend 30 seconds writing detailed topic description
- Include field/discipline in config
- Review first draft and refine
- Use `--dry-run` to preview before committing

---

### Problem: Wrong difficulty level

**Symptoms:**

- Content too easy for students
- Content too hard/advanced
- Doesn't match course level setting
- Inconsistent difficulty across questions

**Causes:**

- Course level not set in config
- Command flag overrides config incorrectly
- Difficulty level not matching student level
- Mix of difficulty levels in same assignment

**Solution:**

**Step 1: Check global difficulty setting**

```bash
# View current config
grep -A 3 "difficulty:" .flow/teach-config.yml
# Should show: beginner|intermediate|advanced
```

**Step 2: Adjust in config**

```yaml
scholar:
  course_info:
    level: "undergraduate"      # undergraduate|graduate
    difficulty: "intermediate"  # beginner|intermediate|advanced
```

**Mapping:**

```
beginner      ← Introductory level (concepts, definitions)
intermediate  ← Mid-level (application, analysis)
advanced      ← Graduate/honors (synthesis, proofs)
```

**Step 3: Override per-command**

```bash
# Easier quiz for beginners
/teaching:quiz "Linear Regression Intro" --difficulty beginner

# Harder exam for advanced students
/teaching:exam "Final Exam" --difficulty advanced
```

**Step 4: Remove mixed difficulties**

When generating multiple questions, ensure consistency:

```bash
# Good - all same difficulty
/teaching:exam final --difficulty intermediate

# Avoid - could have mixed difficulty
/teaching:exam final  # Uses config, which varies
```

**Step 5: Check question types**

Difficulty also depends on question type:

```yaml
defaults:
  question_types:
    - "multiple-choice"    # Usually easier
    - "short-answer"       # Medium difficulty
    - "essay"              # Harder (requires analysis)
```

For easier content, use more MC and fewer essays:

```yaml
defaults:
  question_types:
    - "multiple-choice"
    - "true-false"
    # Remove "essay"
```

**Step 6: Review and adjust**

After generation, manually review:

1. Multiple-choice options: Are distractors plausible but clearly wrong?
2. Short-answer: Can typical student answer in 2-3 minutes?
3. Essays: Can student respond in 10-15 minutes?

**Prevention:**

- Set difficulty in config at course start
- Test with one exam/quiz before doing full semester
- Get student feedback on difficulty
- Adjust based on actual performance

---

### Problem: Missing question types

**Symptoms:**

- All questions are multiple-choice (no variety)
- Short-answer questions missing
- Essay questions not included
- Wrong distribution (not 60/30/10)

**Causes:**

- Question types not configured
- Default configuration doesn't include desired types
- Override flag not applied correctly
- AI model didn't follow type distribution

**Solution:**

**Step 1: Check configured question types**

```bash
# View config
grep -A 5 "question_types:" .flow/teach-config.yml
```

**Step 2: Add missing types to config**

```yaml
scholar:
  defaults:
    question_types:
      - "multiple-choice"    # 60% (4 options)
      - "short-answer"       # 30% (few sentences)
      - "essay"              # 10% (paragraph+)
```

**Include other types:**

```yaml
question_types:
  - "multiple-choice"
  - "short-answer"
  - "essay"
  - "true-false"      # Add for variety
  - "numerical"       # Add for math/stats courses
```

**Step 3: Override per-command**

```bash
# Generate exam with custom type distribution
/teaching:exam midterm --question-types "multiple-choice,short-answer,essay"

# For quiz, increase true/false
/teaching:quiz concepts --question-types "multiple-choice,true-false"
```

**Step 4: Regenerate if wrong mix**

```bash
# If previous exam was all MC, regenerate
rm exam-midterm.md
/teaching:exam midterm --question-types "multiple-choice,short-answer,essay"
```

**Step 5: Verify question distribution**

In generated file, count questions by type:

```bash
# Example output shows distribution:
# Multiple-choice: 12 (60%)
# Short-answer: 6 (30%)
# Essay: 2 (10%)
```

**Prevention:**

- Configure question types once at course start
- Use `--dry-run` to preview before committing
- Verify distribution meets your needs
- Test with simple quiz first

---

### Problem: Incorrect formatting in output

**Symptoms:**

- Headers formatted wrong
- Code blocks not properly marked
- Math notation broken
- Lists not rendering correctly

**Causes:**

- Output format not specified
- Wrong markdown syntax in template
- Conversion between formats corrupted
- LaTeX special characters not escaped

**Solution:**

**Step 1: Specify output format**

Instead of:

```bash
/teaching:exam midterm
```

Use:

```bash
/teaching:exam midterm --format md
# Or
/teaching:exam midterm --format qmd
```

**Step 2: Check generated format**

View first 20 lines:

```bash
head -20 exam-midterm.md
# Should show proper markdown headers (#, ##, ###)
```

**Step 3: Fix common formatting issues**

**Headers:**

```markdown
# Main title (1 hash)
## Section (2 hashes)
### Subsection (3 hashes)
```

**Code blocks:**

```markdown
\`\`\`r
# R code here
model <- lm(y ~ x)
\`\`\`

\`\`\`python
# Python code here
import numpy as np
\`\`\`
```

**Math notation:**

```markdown
Inline math: $\beta_1$
Display math: $$\hat{y} = \beta_0 + \beta_1 x$$
```

**Lists:**

```markdown
- Item 1
- Item 2
  - Nested item 2a
  - Nested item 2b
```

**Step 4: Validate markdown**

```bash
# Check markdown syntax
mdl exam-midterm.md  # If markdownlint installed

# Or convert to see errors
pandoc exam-midterm.md -o exam-midterm.html
```

**Step 5: Fix formatting in Markdown editor**

Open in VS Code:

- Install "Markdown Preview Enhanced" extension
- Check preview matches expected output
- Manual fixes if needed

**Step 6: Re-export if severely broken**

```bash
# Delete broken version
rm exam-midterm.md

# Regenerate
/teaching:exam midterm --format qmd

# Convert to markdown if needed
quarto convert exam-midterm.qmd
```

**Prevention:**

- Specify format explicitly
- Preview before using content
- Test format conversions early
- Don't manually edit if regenerating

---

### Problem: Solution quality issues

**Symptoms:**

- Solutions contain errors
- Explanations unclear or incomplete
- Answers are wrong or inconsistent
- Derivations skip steps

**Causes:**

- AI model hallucination
- Topic too complex/ambiguous
- Solution detail level set too low
- No review/validation

**Solution:**

**Step 1: Check solution detail level**

Current config setting:

```yaml
scholar:
  defaults:
    solution_detail: "step-by-step"  # Full derivations
```

Options:

```yaml
solution_detail: "step-by-step"   # Full derivations with explanations
solution_detail: "answer-only"    # Just final answers
solution_detail: "hints"          # Guidance without full solution
```

**Step 2: Increase detail level**

```bash
# Regenerate with more detail
/teaching:exam --solution-detail "step-by-step" midterm
```

**Step 3: Verify mathematically**

For each solution, check:

1. Are all steps logically sound?
2. Does answer satisfy original equation?
3. Are assumptions stated?
4. Is interpretation correct?

**Step 4: Add specific instructions**

Custom prompt with rigor requirements:

```yaml
scholar:
  prompts:
    exam: |
      When providing solutions:
      - Show ALL algebraic steps
      - Clearly state assumptions
      - Verify final answer
      - Explain reasoning for each step
      - Include interpretation if applicable
```

**Step 5: Have peer review**

Before using in class:

1. Ask colleague to check solutions
2. Run problem through solution
3. Compare with textbook answers

**Step 6: Regenerate problematic questions**

If specific solutions are wrong:

```bash
# Remove bad version
rm exam-midterm.md

# Regenerate with adjusted prompt
/teaching:exam midterm --refine "Question 5"
```

**Prevention:**

- Always review solutions before using
- Start with `--dry-run` (no API cost)
- Test with simple questions first
- Keep custom prompts precise

---

### Problem: Rubric not detailed enough

**Symptoms:**

- Rubric criteria too vague
- Point deductions unclear
- Doesn't distinguish between levels
- Missing common error guidance

**Causes:**

- Rubric detail level set too low
- No performance level definitions
- Missing point distribution
- Overly generic criteria

**Solution:**

**Step 1: Check rubric configuration**

```bash
grep -A 5 "rubric:" .flow/teach-config.yml
```

**Step 2: Generate with more criteria**

Instead of:

```bash
/teaching:rubric "Assignment 5"
```

Use:

```bash
/teaching:rubric "Assignment 5" 100 \
  --criteria 8 \
  --levels 4 \
  --include-common-errors
```

Options:

```bash
--points N          # Total points (default: 100)
--criteria N        # Number of criteria (default: 5)
--levels N          # Performance levels (default: 4)
--include-common-errors  # Add common mistake guidance
```

**Step 3: Review rubric structure**

Good rubric includes:

```markdown
### Criterion 1: Problem Setup (25 points)

| Score | Description |
|-------|------------|
| 23-25 | Correct setup with clear notation |
| 20-22 | Setup correct, minor notation issues |
| 15-19 | Setup mostly correct, some confusion |
| 0-14  | Incorrect setup or missing |

Common errors:
- Forgot to define variables → -2 pts
- Wrong equation form → -5 pts
```

**Step 4: Customize for your course**

Create rubric template:

```yaml
scholar:
  defaults:
    rubric_style:
      criteria_count: 8
      performance_levels: 5
      include_common_errors: true
      include_feedback: true
      include_point_ranges: true
```

**Step 5: Add specific scoring guidance**

If generated rubric is too generic:

```bash
/teaching:rubric "Assignment 5" --refine \
  --instruction "Add specific point deductions for common algebra errors"
```

**Step 6: Export to preferred format**

```bash
# Generate as markdown
/teaching:rubric assignment --format md

# Or JSON for custom processing
/teaching:rubric assignment --format json
```

**Prevention:**

- Use `--criteria N` with N ≥ 6
- Include common errors in config
- Test rubric with one assignment first
- Provide examples of full/partial credit

---

### Problem: Code examples missing

**Symptoms:**

- No code blocks in generated content
- Examples are pseudocode, not real code
- Language wrong or mixed
- Code won't run

**Causes:**

- `--include-code` flag not used
- Language not specified
- Code format not configured
- No executable code in template

**Solution:**

**Step 1: Enable code examples**

When generating content:

```bash
# Without code (default)
/teaching:slides "ANOVA"

# With code examples
/teaching:slides "ANOVA" --include-code --language R
```

**Step 2: Specify language**

Supported languages:

```bash
--language R        # R code
--language python   # Python code
--language julia    # Julia code
```

**Example:**

```bash
/teaching:assignment "Linear Regression" \
  --include-code \
  --language R
```

**Step 3: Configure default language**

```yaml
scholar:
  defaults:
    include_code: true
    code_language: "R"  # Default language
```

**Step 4: Configure output format**

For code to render properly:

```yaml
defaults:
  include_code: true
  code_format: "executable"    # or "pseudocode"
```

**Step 5: Verify code quality**

Generated code should:

- Have correct syntax for the language
- Include comments explaining steps
- Be executable (runnable as-is)
- Use standard libraries only

**Test code:**

```bash
# Copy code from generated file and test
R CMD BATCH code.R
# or
python code.py
```

**Step 6: If code is wrong**

Regenerate with better specification:

```bash
/teaching:assignment "Regression" \
  --include-code \
  --language R \
  --code-libraries "tidyverse,broom" \
  --code-style "modern"
```

**Prevention:**

- Always use `--include-code` for quantitative courses
- Test code from generated materials
- Specify libraries if needed
- Review before sharing with students

---

## Output Format Issues

### Problem: LaTeX compilation errors

**Symptoms:**

- `pdflatex` returns errors
- PDF doesn't generate
- "Undefined control sequence" errors
- Missing packages

**Causes:**

- LaTeX not installed
- Generated LaTeX has syntax errors
- Required packages missing
- Special characters not escaped properly

**Solution:**

**Step 1: Check if LaTeX installed**

```bash
which pdflatex
# Should show: /usr/local/bin/pdflatex or similar

# If not found:
brew install basictex
# or
brew install --cask mactex
```

**Step 2: Generate LaTeX format**

```bash
/teaching:exam midterm --format tex
# Creates: exam-midterm.tex
```

**Step 3: Test compilation**

```bash
cd directory-with-tex-file
pdflatex exam-midterm.tex

# Check for errors
echo $?  # Should show: 0 (success)
```

**Step 4: Common LaTeX errors and fixes**

**Error: "Undefined control sequence"**

```latex
# Wrong:
\beta_1  (outside math mode)

# Correct:
$\beta_1$ or $$\beta_1$$
```

**Error: "Missing package"**

```bash
# Install full LaTeX
brew install mactex

# Or install minimal with tinytex
quarto install tinytex
```

**Error: "Special character"**

```latex
# Wrong:
2_3 or 50% accuracy

# Correct:
2\_3 or 50\% accuracy
```

**Step 5: Check generated LaTeX**

View first part of file:

```bash
head -50 exam-midterm.tex
# Should show proper \documentclass, \begin{document}
```

**Step 6: Compile with verbose output**

```bash
pdflatex -interaction=nonstopmode exam-midterm.tex > build.log
cat build.log | grep -i error
```

**Step 7: Use Quarto instead (easier)**

Instead of plain LaTeX:

```bash
/teaching:exam midterm --format qmd

# Then render with Quarto
quarto render exam-midterm.qmd --to pdf
```

**Prevention:**

- Use Quarto format (handles LaTeX automatically)
- Test compilation immediately after generation
- Keep LaTeX updated: `brew upgrade mactex`
- Use `--dry-run` to preview before committing

---

### Problem: Blank lines in display math blocks break PDF

**Symptoms:**

- PDF rendering fails with `$$...$$` display math blocks
- "Missing $ inserted" error near math content
- "Undefined control sequence" in or after math blocks
- Math renders fine in HTML but breaks in PDF

**Causes:**

- Blank lines inside `$$...$$` blocks create LaTeX paragraph breaks
- LaTeX exits math mode at paragraph boundaries, causing compilation errors
- MathJax (HTML) tolerates blank lines, masking the problem until PDF rendering

**Solution:**

**For Quarto lecture output:** Scholar auto-fixes this. The `formatLectureNotesAsQuarto()` function automatically strips blank lines from `$$...$$` blocks. No action needed.

**For manual LaTeX/Quarto files:** Remove blank lines inside `$$...$$` blocks:

```markdown
# Wrong — blank line breaks PDF:
$$
\hat{\beta} = (X^T X)^{-1} X^T y

\text{where } X \text{ is the design matrix}
$$

# Correct — no blank lines inside $$:
$$
\hat{\beta} = (X^T X)^{-1} X^T y
\text{where } X \text{ is the design matrix}
$$
```

**Prevention:**

- Use Scholar's lecture generator — math blocks are auto-fixed
- When writing math manually, avoid blank lines inside `$$...$$`
- Use `\\` for line breaks within math instead of blank lines
- Run `/teaching:validate` to detect math blank-line issues

---

### Problem: Quarto rendering failures

**Symptoms:**

- `quarto render` returns errors
- HTML won't generate
- Code blocks don't execute
- "Could not find Quarto"

**Causes:**

- Quarto not installed or wrong version
- R/Python not in PATH
- Quarto YAML syntax wrong
- Missing dependencies

**Solution:**

**Step 1: Check Quarto installation**

```bash
quarto --version
# Should show: 1.3.0+ (not 1.2.x)

# If not found:
brew install quarto
```

**Step 2: Update Quarto if old**

```bash
brew upgrade quarto
quarto --version  # Verify update
```

**Step 3: Check R/Python available**

```bash
# Check if R installed
which R
R --version

# Check if Python installed
which python3
python3 --version
```

**Step 4: Install missing dependencies**

For R code blocks:

```bash
# In R console
install.packages("tidyverse")
install.packages("knitr")
```

For Python code blocks:

```bash
pip install matplotlib pandas numpy
```

**Step 5: Check Quarto YAML syntax**

First lines of `.qmd` file should look like:

```yaml
---
title: "My Slides"
format:
  revealjs:
    theme: simple
---
```

Common errors:

```yaml
# Wrong (no dashes or bad indent)
title: "My Slides"

# Correct
---
title: "My Slides"
---
```

**Step 6: Test rendering**

```bash
# Simple test document
cat > test.qmd << 'EOF'
---
title: "Test"
---

# Hello

\`\`\`{r}
print("Hello")
\`\`\`
EOF

quarto render test.qmd
```

**Step 7: Render with verbose output**

```bash
quarto render exam-midterm.qmd --verbose

# Check for specific errors
```

**Step 8: Use Quarto troubleshoot**

```bash
quarto check
# Shows environment status
```

**Prevention:**

- Keep Quarto updated regularly
- Test render immediately after generation
- Use `--format qmd` instead of plain markdown
- Install necessary R/Python packages upfront

---

### Problem: Markdown formatting problems

**Symptoms:**

- Headers not rendering
- Code blocks broken
- Math notation doesn't display
- Lists broken/indented wrong

**Causes:**

- Generated markdown has syntax errors
- Special characters not escaped
- Inconsistent spacing/indentation
- Mixed formatting styles

**Solution:**

**Step 1: Check markdown structure**

First 50 lines should show:

```markdown
# Title

## Section 1

Content here

### Subsection 1.1

More content
```

Use proper heading hierarchy (no gaps):

```markdown
# Main         ✅
## Section     ✅
### Subsub     ✅

# Main         ✅
### Subsub     ❌ (skipped ##)
```

**Step 2: Fix common formatting**

**Code blocks:**

```markdown
\`\`\`
code here
\`\`\`

\`\`\`python
python_code here
\`\`\`
```

**Inline code:**

```markdown
Use \`variable_name\` for code
```

**Bold/italic:**

```markdown
**bold text**
_italic text_
```

**Lists:**

```markdown
- Item 1
- Item 2
  - Indented item (2-4 spaces)

1. Number 1
2. Number 2
```

**Step 3: Validate with markdown linter**

```bash
# Install markdownlint
npm install -g markdownlint-cli

# Check file
markdownlint exam-midterm.md
# Shows errors with line numbers
```

**Step 4: View in markdown preview**

Open in VS Code:

1. Open file
2. Press `Cmd+Shift+V` for preview
3. Compare preview with source
4. Fix mismatches

**Step 5: Convert between formats**

If markdown is broken, regenerate:

```bash
# Delete broken version
rm exam-midterm.md

# Generate as Quarto (more robust)
/teaching:exam midterm --format qmd

# Convert Quarto to markdown if needed
quarto convert exam-midterm.qmd
```

**Step 6: Manual fixes**

If regenerating takes too long:

```bash
# Open in editor
nano exam-midterm.md

# Or use sed for simple fixes
sed -i '' 's/^##  /## /g' exam-midterm.md  # Fix double spaces
```

**Prevention:**

- Always preview in VS Code before using
- Use `--dry-run` to catch errors early
- Prefer Quarto (`.qmd`) over plain Markdown (`.md`)
- Validate with markdownlint after generation

---

### Problem: JSON validation errors

**Symptoms:**

- `SyntaxError: Unexpected token`
- JSON parser fails
- Cannot import JSON file
- Malformed JSON

**Causes:**

- Generated JSON has syntax errors
- Trailing commas in objects/arrays
- Unescaped special characters
- Missing required fields

**Solution:**

**Step 1: Validate JSON syntax**

```bash
# Validate JSON file
python -m json.tool exam-midterm.json > /dev/null
echo $?  # 0 = valid, non-zero = error

# Or with jq
jq . exam-midterm.json > /dev/null
```

**Step 2: Check JSON structure**

Valid JSON quiz:

```json
{
  "questions": [
    {
      "id": 1,
      "text": "Question here?",
      "options": ["A", "B", "C", "D"],
      "answer": 0
    }
  ]
}
```

**Step 3: Common JSON errors**

**Trailing comma:**

```json
{
  "field": "value",   # Remove comma
}
```

**Unescaped characters:**

```json
{
  "text": "Quote: "He said"",    # Wrong: unescaped quotes
  "text": "Quote: \"He said\""   # Right: escaped quotes
}
```

**Step 4: Pretty-print for review**

```bash
# Format JSON nicely
python -m json.tool exam-midterm.json | head -100

# Or with jq
jq . exam-midterm.json | head -100
```

**Step 5: Regenerate if corrupted**

```bash
# Delete broken version
rm exam-midterm.json

# Regenerate
/teaching:exam midterm --format json
```

**Step 6: Programmatic validation**

```python
import json
try:
    with open('exam-midterm.json') as f:
        data = json.load(f)
    print("Valid JSON")
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}")
    print(f"Line {e.lineno}, Col {e.colno}")
```

**Prevention:**

- Generate and validate immediately
- Use `jq` for quick validation
- Keep JSON backup before modifications
- Use JSON editor with syntax highlighting

---

### Problem: Canvas QTI upload problems

**Symptoms:**

- Canvas won't accept import
- "Invalid QTI package" error
- Questions don't import correctly
- Formatting lost in import

**Causes:**

- `examark` not installed
- QTI format incompatible with Canvas version
- File permissions issues
- Corrupted ZIP file

**Solution:**

**Step 1: Install examark**

```bash
npm install -g examark
examark --version
# Should show: 1.0.0+
```

**Step 2: Generate Canvas format**

```bash
/teaching:exam midterm --format canvas
# Creates: exam-midterm.zip
```

**Step 3: Verify ZIP file**

```bash
# Check file exists and is valid
ls -lh exam-midterm.zip

# Test ZIP integrity
unzip -t exam-midterm.zip
# Should show "All files OK"
```

**Step 4: Check Canvas version**

Canvas QTI support varies by version:

- Canvas 2021.02+ - Full QTI 1.2 support
- Canvas 2020.x - Limited support

Check your Canvas version in settings.

**Step 5: Manual upload to Canvas**

1. Go to Canvas course
2. Click "Settings" → "Import Content"
3. Choose "QTI/.zip file"
4. Upload exam-midterm.zip
5. Click "Import"
6. Review imported questions

**Step 6: If import fails**

Try alternative formats:

```bash
# Download Canvas-compatible format
/teaching:exam midterm --format canvas-qti-v2

# Or generate as Markdown and manually create
/teaching:exam midterm --format md
# Then manually recreate in Canvas
```

**Step 7: Check imported questions**

After import:

- Do all questions appear?
- Are point values correct?
- Are options in right order?
- Is answer key preserved?

**Step 8: Troubleshoot specific errors**

**"Invalid QTI package":**

- Verify ZIP integrity
- Regenerate with latest examark

**"Questions imported but no answers":**

- Canvas version may not support answer import
- Manually verify answers

**"Formatting lost":**

- Canvas may not support all LaTeX
- Review and fix math notation in Canvas

**Prevention:**

- Test with small exam first (5 questions)
- Verify import immediately after
- Keep markdown version as backup
- Document Canvas-compatible features

---

## Configuration Problems

### Problem: YAML syntax errors

**Symptoms:**

- `Invalid YAML syntax`
- Config file "not found" even though it exists
- Line number shown in error message
- Indentation warnings

**Causes:**

- Tabs instead of spaces for indentation
- Unclosed or mismatched quotes
- Missing colons after field names
- Incorrect nesting level

**Solution:**

**Step 1: Use YAML validator**

```bash
# Validate syntax
ruby -ryaml -e 'YAML.load_file(".flow/teach-config.yml")' 2>&1

# Or Python
python -c "import yaml; yaml.safe_load(open('.flow/teach-config.yml'))"
```

**Step 2: Check indentation**

Use spaces (not tabs):

```yaml
scholar:          # 0 spaces
  course_info:    # 2 spaces
    level: "undergraduate"  # 4 spaces
```

Verify in editor:

- VS Code: Show whitespace (Cmd+Shift+P → "Toggle Whitespace")
- Look for dots (spaces) not arrows (tabs)

**Step 3: Check quotes**

Proper quoting:

```yaml
# Strings with special chars need quotes
field: "value with: colon"
field: "value with - dash"

# Simple strings don't need quotes
field: undergraduate

# Numbers
points: 100
temperature: 0.7
```

**Step 4: Check colons**

Every field needs a colon:

```yaml
# Wrong - missing colon
course_info
  level: "undergraduate"

# Correct - has colon
course_info:
  level: "undergraduate"
```

**Step 5: Use auto-fixer**

```bash
/teaching:fix
# Automatically repairs common YAML errors
```

**Step 6: Create from template**

If config is corrupt, start over:

```bash
# Backup old config
mv .flow/teach-config.yml .flow/teach-config.yml.bak

# Copy template
curl -s https://example.com/teach-config-template.yml \
  > .flow/teach-config.yml

# Customize
nano .flow/teach-config.yml
```

**Prevention:**

- Use VS Code with YAML extension
- Validate after each edit
- Use consistent indentation (2 spaces per level)
- Keep valid backup

---

### Problem: Invalid configuration values

**Symptoms:**

- `Invalid value for field`
- `Unexpected enum value`
- Config loaded but settings ignored
- Commands use defaults instead

**Causes:**

- Typo in field value
- Value not in allowed list
- Wrong data type (string vs number)
- Case sensitivity issue

**Solution:**

**Step 1: Check field name and value**

Valid `course_info` fields:

```yaml
level: "undergraduate"  or "graduate"  ← case-sensitive
difficulty: "beginner", "intermediate", or "advanced"
field: any string (e.g., "statistics")
```

**Step 2: Validate each field**

```yaml
# Correct format
scholar:
  course_info:
    level: "undergraduate"         ✅
    level: "Undergraduate"         ❌ (wrong case)
    level: undergraduate           ❌ (no quotes, should be)
    difficulty: "intermediate"     ✅
    difficulty: "intermediate"     ❌ (case wrong)
```

**Step 3: Check enum values**

Allowed values for key fields:

**level:**

- `"undergraduate"`
- `"graduate"`

**difficulty:**

- `"beginner"`
- `"intermediate"`
- `"advanced"`

**tone:**

- `"formal"`
- `"conversational"`

**exam_format:**

- `"md"` (markdown)
- `"qmd"` (quarto)
- `"tex"` (latex)
- `"json"`
- `"canvas"`

**Step 4: Validate config**

```bash
/teaching:validate .flow/teach-config.yml
# Shows all validation errors with line numbers
```

**Step 5: Fix invalid values**

Example config with errors:

```yaml
# Wrong
scholar:
  course_info:
    level: Undergrad          # Not in enum
    difficulty: hard          # Should be "advanced"
    exam_format: markdown     # Should be "md"

# Correct
scholar:
  course_info:
    level: "undergraduate"
    difficulty: "advanced"
  defaults:
    exam_format: "md"
```

**Step 6: Test after fixing**

```bash
/teaching:exam test --dry-run
# Should work without validation errors
```

**Prevention:**

- Reference config documentation before editing
- Use auto-complete (if editor supports)
- Validate after every change
- Keep list of valid values nearby

---

### Problem: Config not being applied

**Symptoms:**

- Config settings ignored
- Uses defaults instead of configured values
- Changes don't take effect
- Per-command flags work but config doesn't

**Causes:**

- Config file in wrong location
- Config syntax error (silently fails)
- Command flag overrides config
- Cache not cleared

**Solution:**

**Step 1: Verify config found**

```bash
# Enable debug mode
SCHOLAR_DEBUG=1 /teaching:exam test --questions 1

# Output should show:
# Config loaded from: .flow/teach-config.yml
# Difficulty: intermediate (from config)
```

**Step 2: Check config location**

```bash
# Current directory
ls -la .flow/teach-config.yml

# Parent directory
ls -la ../.flow/teach-config.yml

# Check search path
pwd
cd exams
pwd
# Config should be found in both
```

**Step 3: Verify config is valid**

```bash
# Check syntax
ruby -ryaml -e 'puts YAML.load_file(".flow/teach-config.yml").inspect'

# If error, config is invalid (silently ignored)
```

**Step 4: Check for overrides**

Command flags override config:

```bash
# Config says difficulty: intermediate
# But flag says:
/teaching:exam midterm --difficulty hard

# Flag wins! (overrides config)

# To use config, don't specify flag:
/teaching:exam midterm
```

**Step 5: Clear cache and retry**

```bash
# Clear Scholar cache
rm -rf ~/.cache/scholar/

# Clear other caches
rm -rf ~/Library/Caches/Claude\ Code/

# Restart Claude Code and try again
```

**Step 6: Test config discovery**

```bash
# From course root
/teaching:exam test --dry-run

# From subdirectory
cd exams
/teaching:exam test --dry-run

# Both should find same config
```

**Step 7: Verify specific settings**

Check if specific config values are used:

```bash
# Config says: questions: 8
/teaching:quiz test
# Count questions in output - should be 8

# Config says: difficulty: beginner
/teaching:exam test
# Review - should be beginner level
```

**Prevention:**

- Place config at course root
- Validate syntax after editing
- Don't use `--` flags to test config
- Check debug output when uncertain

---

### Problem: Defaults not working

**Symptoms:**

- Default settings ignored
- Must specify flags every time
- Config changes have no effect
- Unexpected values in output

**Causes:**

- Defaults section missing in config
- Wrong nesting level
- Syntax error in defaults
- Fallback defaults take precedence

**Solution:**

**Step 1: Check defaults section exists**

```yaml
scholar:
  course_info:
    level: "undergraduate"

  defaults:              # ← This section
    exam_format: "markdown"
    question_types:
      - "multiple-choice"
```

**Step 2: Add missing defaults**

Complete defaults section:

```yaml
defaults:
  exam_format: "markdown"       # md, qmd, tex, json
  lecture_format: "quarto"      # qmd or md
  exam_questions: 15            # Default number
  quiz_questions: 8
  assignment_problems: 5

  question_types:
    - "multiple-choice"
    - "short-answer"
    - "essay"

  solution_detail: "step-by-step"  # or "answer-only"

  style:
    tone: "formal"              # or "conversational"
    include_examples: true
```

**Step 3: Fix indentation**

Defaults must be at same level as course_info:

```yaml
scholar:                    # Level 0
  course_info:             # Level 1
    ...
  defaults:                # Level 1 (NOT nested under course_info!)
    exam_format: "markdown"
```

**Step 4: Validate structure**

Use schema validator:

```bash
/teaching:validate .flow/teach-config.yml

# Check for "Missing required fields" errors
```

**Step 5: Test each default**

Verify each default is used:

```bash
# After setting exam_format: "markdown" in defaults
/teaching:exam test

# Check generated file extension
ls -la exam-*.md  # Should exist (not .qmd or .tex)
```

**Step 6: Override specific defaults**

If you want to override for single command:

```bash
# Config says: exam_format: markdown
# But you want Quarto:
/teaching:exam final --format qmd
# This generates .qmd file despite config
```

**Prevention:**

- Include full defaults section in config
- Test each default after creating config
- Use `--dry-run` to verify before committing
- Keep config backup

---

### Problem: Custom prompts failing

**Symptoms:**

- Custom prompts ignored
- Content doesn't match prompt instructions
- "Prompt not found" errors
- Wrong section regenerated

**Causes:**

- Prompt syntax wrong
- Variable names incorrect
- Prompt not in right command section
- Prompt too complex

**Solution:**

**Step 1: Check prompt syntax**

Prompts go in `prompts` section:

```yaml
scholar:
  prompts:
    exam: |              # ← Command name
      You are a statistics instructor.

      Generate exam focused on applications.
      Include real-world examples.
```

**Step 2: Verify command name**

Valid command names:

```yaml
prompts:
  exam: |          # /teaching:exam
  quiz: |          # /teaching:quiz
  slides: |        # /teaching:slides
  assignment: |    # /teaching:assignment
  lecture: |       # /teaching:lecture
  syllabus: |      # /teaching:syllabus
  rubric: |        # /teaching:rubric
```

**Step 3: Check variable syntax**

Valid variables (enclosed in double braces):

```yaml
prompts:
  exam: |
    Generate exam for {{course_code}}.
    Level: {{level}}
    Difficulty: {{difficulty}}
```

Valid variables:

- `{{course_code}}`
- `{{course_title}}`
- `{{level}}`
- `{{difficulty}}`
- `{{topic}}` (command-specific)

**Step 4: Test simple prompt**

Start with basic prompt:

```yaml
prompts:
  exam: "Create a focused exam with 10 questions."
```

If that works, gradually add complexity.

**Step 5: Check multiline syntax**

For multiline prompts, use `|`:

```yaml
prompts:
  exam: |
    Line 1
    Line 2
    Line 3
```

Or use `|-` to remove trailing newline:

```yaml
prompts:
  exam: |-
    Line 1
    Line 2
```

**Step 6: Validate prompt YAML**

```bash
# Test config syntax
ruby -ryaml -e 'yaml = YAML.load_file(".flow/teach-config.yml"); puts yaml["scholar"]["prompts"]["exam"]'

# Should print your prompt text
```

**Step 7: Use refine instead**

If custom prompts are complex, use refine:

```bash
# Generate initial version
/teaching:exam midterm

# Refine specific section
/teaching:lecture --refine exam-midterm.md \
  --section "Question 5" \
  --instruction "Make this more practical, add real example"
```

**Prevention:**

- Start with simple, direct prompts
- Test each prompt after adding it
- Use `--dry-run` to preview
- Keep prompts under 500 characters

---

## Config Management Issues

### Problem: `/teaching:config scaffold` says type is invalid

**Symptom:** Error: Unknown prompt type "xyz"

**Solution:** Valid types are: lecture-notes, lecture-outline, section-content, exam, quiz, slides, revealjs-slides, assignment, syllabus, rubric, feedback. Only 4 have Scholar defaults (lecture-notes, lecture-outline, quiz, section-content); others create minimal templates.

```bash
# These have full Scholar default prompts:
/teaching:config scaffold lecture-notes
/teaching:config scaffold lecture-outline
/teaching:config scaffold quiz
/teaching:config scaffold section-content

# These create minimal starter templates:
/teaching:config scaffold exam
/teaching:config scaffold slides
/teaching:config scaffold assignment
/teaching:config scaffold syllabus
/teaching:config scaffold rubric
/teaching:config scaffold feedback
/teaching:config scaffold revealjs-slides
```

---

### Problem: `/teaching:config show` shows unexpected values

**Symptom:** Config values don't match what you expect

**Solution:**

1. Run `/teaching:config show --command CMD --week N` to see layer-by-layer resolution
2. Higher layers override lower layers (Layer 4 > Layer 3 > Layer 2 > Layer 1)
3. Check for `command_overrides` in teach-config.yml that may be overriding course defaults
4. Check for `prompt_hints` in lesson-plans.yml that may be overriding for specific weeks

```bash
# See full hierarchy for a specific command and week
/teaching:config show --command lecture --week 4

# See just the resolved config (no layer breakdown)
/teaching:config show
```

**Layer priority (highest to lowest):**

| Priority | Layer | Source |
|----------|-------|--------|
| 4 (highest) | Week lesson plan | lesson-plans.yml `prompt_hints` |
| 3 | Command overrides | teach-config.yml `command_overrides` |
| 2 | Course style | teach-config.yml course settings |
| 1 (lowest) | Plugin defaults | Scholar built-in defaults |

---

### Problem: `/teaching:config validate` reports errors

**Symptom:** Validation errors or warnings

**Solution:**

1. Read error messages -- they indicate file, field, and expected value
2. Common issues: YAML syntax errors, missing required fields, invalid enum values
3. Fix errors first (prevent generation), then warnings (may cause unexpected behavior)
4. Run `--strict` mode before deploying to catch all potential issues

```bash
# Run basic validation
/teaching:config validate

# Strict mode: treat warnings as errors
/teaching:config validate --strict

# JSON output for CI/CD integration
/teaching:config validate --json
```

---

### Problem: `/teaching:config diff` shows unexpected changes

**Symptom:** Diff reports changes you didn't make

**Solution:**

1. Check `based_on_scholar_version` in your prompt frontmatter
2. If Scholar was upgraded, defaults may have changed
3. Run `/teaching:config scaffold <type>` to get the latest default
4. Compare and merge changes manually

```bash
# See all diffs
/teaching:config diff

# See diff for a specific type
/teaching:config diff lecture-notes

# Re-scaffold to get latest default for comparison
/teaching:config scaffold lecture-notes
```

---

### Problem: `/teaching:config trace` shows "No Scholar generation metadata"

**Symptom:** File has no provenance data

**Solution:**

1. File was generated before provenance tracking (requires Scholar v2.17.0+)
2. File was not generated by Scholar (e.g., manually created)
3. Frontmatter was modified and metadata comments were removed
4. Re-generate the file with current Scholar version to add provenance

```bash
# Check provenance on a generated file
/teaching:config trace content/lectures/week04-regression.qmd

# If no metadata, regenerate the file to add provenance
/teaching:lecture --from-plan=content/lesson-plans/week04.yml
```

---

## Integration Issues

### Problem: flow-cli not found

**Symptoms:**

- `work teaching`: command not found
- `tweek`, `tlec`: not found
- flow-cli commands don't work
- Integration broken

**Causes:**

- flow-cli not installed
- Wrong shell (not sourcing setup)
- PATH misconfigured
- Installation incomplete

**Solution:**

**Step 1: Check if flow-cli installed**

```bash
which flow
flow --version

# Or check npm
npm list -g flow-cli
```

**Step 2: Install flow-cli**

```bash
# Via Homebrew
brew tap data-wise/tap
brew install flow-cli

# Or via npm
npm install -g flow-cli
```

**Step 3: Check shell configuration**

Ensure shell sources setup:

```bash
# For Bash (~/.bashrc):
source ~/.bashrc

# For Zsh (~/.zshrc):
source ~/.zshrc

# For Fish (~/.config/fish/config.fish):
# Should auto-load on login
```

**Step 4: Verify PATH**

```bash
echo $PATH | grep flow

# Should show flow-cli directory in PATH
```

**Step 5: Reload shell**

```bash
# Restart shell or source config
exec zsh

# Or manually source
source ~/.zshrc
```

**Step 6: Test flow-cli**

```bash
work teaching
# Should start teaching workflow
```

**Prevention:**

- Install flow-cli at project start
- Add to shell startup file
- Keep flow-cli updated

---

### Problem: Git operations failing

**Symptoms:**

- `git add` fails
- `.gitignore` not working
- Commits fail
- Push/pull errors

**Causes:**

- Not in git repository
- Git not installed
- File permissions
- Network issues

**Solution:**

**Step 1: Check git status**

```bash
git status
# Should show current branch and changes

# If error: "not a git repository"
git init   # Initialize if needed
```

**Step 2: Initialize if needed**

```bash
cd ~/teaching/stat440
git init
git config user.name "Your Name"
git config user.email "your.email@university.edu"

# Create initial commit
git add .flow/teach-config.yml
git commit -m "Initial course setup"
```

**Step 3: Check git configuration**

```bash
git config user.name
git config user.email

# Should show your name and email
```

**Step 4: Verify .gitignore**

```bash
# Create gitignore for teaching files
cat > .gitignore << 'EOF'
# Compiled output
*.pdf
*.html

# Solution files
*-solutions.md
*-key.md
*-answer-key.*

# Cached files
.DS_Store
*.swp
*.tmp

# Large files
data/*.csv
data/*.xlsx
EOF

git add .gitignore
git commit -m "Add .gitignore"
```

**Step 5: Add and commit generated content**

```bash
# After generating materials
git add exams/
git add slides/
git commit -m "feat: add week 5 materials"
```

**Step 6: Push to remote**

```bash
# First time (create remote)
git remote add origin https://github.com/username/course-repo.git
git branch -M main
git push -u origin main

# Subsequent pushes
git push
```

**Step 7: Troubleshoot push errors**

**"Authentication failed":**

```bash
# Use HTTPS token or SSH key
git remote set-url origin git@github.com:username/course-repo.git
```

**"Rejected (non-fast-forward)":**

```bash
# Someone else pushed changes
git pull origin main
git push origin main
```

**Prevention:**

- Initialize git early in course
- Commit regularly (weekly minimum)
- Use meaningful commit messages
- Keep .gitignore updated

---

### Problem: GitHub Pages deployment errors

**Symptoms:**

- `tpublish` fails
- Site doesn't update
- 404 errors on published site
- Build action fails

**Causes:**

- GitHub Pages not enabled
- Wrong branch selected
- Build errors in Quarto
- Permissions issue

**Solution:**

**Step 1: Enable GitHub Pages**

On GitHub:

1. Go to repo settings
2. Find "Pages" in left menu
3. Set source to `main` (or `gh-pages` if using Actions)
4. Save

**Step 2: Check build settings**

Recommended setup:

```
Source: Deploy from a branch
Branch: gh-pages (or main)
Folder: / (root)
```

Or with GitHub Actions (better):

```
Source: GitHub Actions
```

**Step 3: Verify site URL**

After enabling Pages:

- Site available at: `https://username.github.io/course-repo/`
- Check it's accessible

**Step 4: Ensure Quarto renders**

Before publishing:

```bash
quarto render
# Should create _site/ directory

ls -la _site/index.html
# Should exist
```

**Step 5: Use GitHub Actions (recommended)**

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Site

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: quarto-dev/quarto-actions/setup@v2
      - name: Render
        run: quarto render
      - name: Publish to gh-pages
        uses: quarto-dev/quarto-actions/publish@v2
        with:
          target: gh-pages
```

**Step 6: Commit and push**

```bash
git add .github/workflows/
git commit -m "Add GitHub Pages automation"
git push origin main

# Site auto-publishes after push
```

**Step 7: Troubleshoot build failures**

Check Actions tab on GitHub:

1. Go to repo → Actions tab
2. Click last workflow run
3. See error details
4. Common errors: Quarto not found, R package missing

**Prevention:**

- Test locally: `quarto render`
- Use GitHub Actions for automation
- Keep Quarto updated
- Test site before announcing to students

---

### Problem: Version control conflicts

**Symptoms:**

- `CONFLICT (content merge)`
- Cannot pull/push
- File shows conflict markers
- Merge fails

**Causes:**

- Same file edited in two places
- Pulling without committing local changes
- Pushing without pulling first

**Solution:**

**Step 1: Check status**

```bash
git status
# Should show conflicting files
```

**Step 2: See conflict details**

```bash
# View conflicting file
cat exam-midterm.md | grep -A 10 "<<<<<<"
# Shows conflict markers
```

**Step 3: Resolve conflicts**

Conflict markers:

```
<<<<<<< HEAD
Your local changes
=======
Changes from remote
>>>>>>> branch-name
```

Edit file to keep what you want:

```markdown
# Remove conflict markers and keep correct content

<<<<<<< HEAD
Local version of section
=======
Remote version of section
>>>>>>> origin/main
```

Becomes (pick one):

```markdown
Local version of section
# or
Remote version of section
```

**Step 4: Mark as resolved**

```bash
git add exam-midterm.md
git commit -m "Resolve merge conflict in exam-midterm.md"
```

**Step 5: Complete merge**

```bash
git push origin main
```

**Step 6: Prevent future conflicts**

**Good practice:**

- Pull before working: `git pull`
- Commit frequently
- Push regularly

**For teaching materials (usually not conflicting):**

```bash
# Each week in separate directory/files
exams/week01-exam.md
exams/week02-exam.md

# Less likely to conflict
```

**Prevention:**

- Pull before starting work
- Commit before pulling
- Use separate files for different content
- Communicate with collaborators

---

## Performance & Quality

### Problem: Generation taking too long

**Symptoms:**

- Command seems stuck (no output for minutes)
- Takes 10+ minutes to generate
- API response slow
- System unresponsive

**Causes:**

- Large request (many questions)
- Slow internet connection
- API server overloaded
- System resources exhausted

**Solution:**

**Step 1: Monitor progress**

Enable debug output:

```bash
SCHOLAR_DEBUG=1 /teaching:exam final --questions 5
# Shows detailed timing
```

**Step 2: Reduce request size**

Instead of:

```bash
/teaching:exam final --questions 50
```

Use:

```bash
/teaching:exam final --questions 15
```

**Step 3: Generate in batches**

```bash
#!/bin/bash
# Generate with delays between requests
for i in {1..5}; do
    echo "Generating exam part $i..."
    /teaching:exam "Part $i" --questions 10
    sleep 60  # Wait 1 minute between requests
done
```

**Step 4: Check network**

```bash
# Test internet speed
ping -c 5 8.8.8.8
# Should be < 100ms

# Test API connectivity
curl -I https://api.anthropic.com/
# Should respond quickly
```

**Step 5: Check system resources**

```bash
# See CPU/memory usage
top -l 1 | head -20

# If >90% CPU or >80% memory, close other apps
```

**Step 6: Increase timeout**

```yaml
scholar:
  ai_generation:
    timeout: 120000  # 2 minutes (up from default 30s)
```

**Step 7: Generate during off-peak**

API is faster when:

- Late evening (10 PM - 6 AM)
- Weekends
- Off-peak hours

**Prevention:**

- Use `--dry-run` for previews (no API call)
- Generate content before you need it
- Batch with delays between requests
- Monitor performance early

---

### Problem: Poor content quality

**Symptoms:**

- Content seems generic or repetitive
- Examples don't match course context
- Answers have errors
- Difficulty inconsistent

**Causes:**

- Generic topic description
- No course context in config
- AI temperature set too high
- Insufficient review

**Solution:**

**Step 1: Improve topic description**

Instead of:

```bash
/teaching:exam statistics
```

Use:

```bash
/teaching:exam "Hypothesis Testing in Applied Statistics with Real Data"
```

Be specific about:

- Topic focus
- Real-world context
- Target audience level

**Step 2: Add course context to config**

```yaml
scholar:
  course_info:
    field: "applied statistics"
    level: "undergraduate"
    difficulty: "intermediate"

  examples:
    contexts:
      - "business analytics"
      - "public health"
      - "agriculture"
    datasets:
      - "company sales data"
      - "epidemiological studies"
```

**Step 3: Create detailed custom prompt**

```yaml
scholar:
  prompts:
    exam: |
      Create an exam for undergraduate applied statistics.

      Context: Students are learning to apply statistical
      methods to real business problems.

      Requirements:
      - Include realistic datasets and scenarios
      - Focus on practical interpretation, not theory
      - All answers should be verifiable
      - Provide worked solutions with explanations

      Difficulty: intermediate (application-level)
```

**Step 4: Adjust AI parameters**

```yaml
ai_generation:
  temperature: 0.6    # Lower = more consistent
                      # Higher = more varied (0.7-0.9)
  max_tokens: 4000    # Longer responses if needed
```

**Step 5: Review and refine**

After generating:

1. Read through entire document
2. Check for errors/inconsistencies
3. Use refine command for weak sections

```bash
/teaching:exam --refine exam-final.md \
  --section "Question 3" \
  --instruction "Add more realistic scenario with actual numbers"
```

**Step 6: Get peer feedback**

Have colleague review:

- Accuracy of content
- Appropriateness for students
- Quality of explanations

**Prevention:**

- Spend time on topic description (30+ words)
- Configure course context once, reuse
- Review first generation thoroughly
- Refine weak sections immediately

---

### Problem: Inconsistent formatting

**Symptoms:**

- Formatting varies throughout document
- Headers different styles
- Code blocks inconsistent
- Lists have different indentation

**Causes:**

- Generated from template with inconsistencies
- Mixed manual editing with generated content
- Format conversion issues
- Multiple formats merged

**Solution:**

**Step 1: Check source format**

```bash
# What format was generated?
ls -la exam-*.*
# Check file extensions

head -20 exam-midterm.md
# Check first lines for format indicators
```

**Step 2: Standardize format**

Pick one format and stick with it:

- `md` (Markdown) - simplest
- `qmd` (Quarto) - better for reproducible content
- `tex` (LaTeX) - for printing

**Step 3: Regenerate in single format**

```bash
# Delete all format versions
rm exam-midterm.*

# Regenerate in one format
/teaching:exam midterm --format qmd
```

**Step 4: Fix specific formatting issues**

**Headers inconsistent:**

```bash
# Standardize to H2 for sections
sed -i '' 's/^# /## /g' exam-midterm.md
sed -i '' 's/^#### /### /g' exam-midterm.md
```

**Code blocks inconsistent:**

```bash
# Use fenced code blocks consistently
sed -i '' 's/^    /\`\`\`\n/g' exam-midterm.md
```

**Step 5: Use formatter tool**

Install Prettier (for Markdown):

```bash
npm install -g prettier

# Auto-format file
prettier --write exam-midterm.md
```

**Step 6: Review formatted output**

Open in VS Code and visually inspect:

- All headers consistent?
- All code blocks properly marked?
- Lists properly indented?

**Prevention:**

- Generate in one format initially
- Don't mix formats
- Use formatter after generation
- Commit formatted version to git

---

### Problem: Inconsistent formatting

**Symptoms:**

- Cache issues causing stale content
- Same topic generates differently
- Settings not updating

**Causes:**

- Scholar cache corrupted
- Browser cache interfering
- Configuration cache stale

**Solution:**

**Step 1: Clear Scholar cache**

```bash
rm -rf ~/.cache/scholar/
rm -rf ~/.scholar/cache/
```

**Step 2: Clear other caches**

```bash
# Claude Code cache
rm -rf ~/Library/Caches/Claude\ Code/

# Node cache
npm cache clean --force
```

**Step 3: Restart completely**

```bash
# Kill all Scholar processes
pkill -f scholar

# Close Claude Code
# Reopen Claude Code
```

**Step 4: Regenerate test content**

```bash
/teaching:exam test --questions 3
# Should generate fresh
```

**Prevention:**

- Clear cache monthly
- Restart Claude Code after updates
- Don't rely on cache for critical content

---

## Diagnostic Checklist

Use this checklist when troubleshooting:

### Initial Diagnosis

- [ ] Scholar installed? `scholar --version`
- [ ] API key set? `echo $ANTHROPIC_API_KEY`
- [ ] Config file exists? `ls .flow/teach-config.yml`
- [ ] In correct directory? `pwd`
- [ ] Command syntax correct? Check [refcard](../refcards/teaching-commands.md)

### Installation Check

- [ ] Plugin loaded in Claude Code? `claude plugin list`
- [ ] PATH includes Scholar? `which scholar`
- [ ] Latest version installed? `scholar --version` (should be 2.6.0+)
- [ ] Permissions OK? `ls -la ~/.claude/plugins/`

### Configuration Check

- [ ] Config location correct? `.flow/teach-config.yml`
- [ ] YAML syntax valid? `ruby -ryaml < .flow/teach-config.yml`
- [ ] Required fields present? `scholar validate`
- [ ] Values in allowed set? Check enum values

### Content Check

- [ ] Topic specified? `/teaching:exam midterm` (has topic)
- [ ] Parameters correct? Check `--help`
- [ ] No typos in flags? Use tab completion
- [ ] Output format valid? Use `md`, `qmd`, `tex`, `json`

### Performance Check

- [ ] Internet connected? `ping google.com`
- [ ] API responding? `curl -I api.anthropic.com`
- [ ] Disk space OK? `df -h`
- [ ] System not overloaded? `top -l 1`

### Output Check

- [ ] Files generated? `ls -la *.md`
- [ ] File not empty? `wc -l *.md`
- [ ] Format valid? Try opening in editor
- [ ] Can render? `quarto render` or `pdflatex`

---

## Advanced Debugging

### Enable debug mode

```bash
# Show detailed logging
SCHOLAR_DEBUG=1 /teaching:exam test

# Show timing information
SCHOLAR_TIMING=1 /teaching:exam test

# Show all debug info
SCHOLAR_DEBUG=1 SCHOLAR_TIMING=1 /teaching:exam test
```

### Check environment

```bash
# Environment variables
env | grep SCHOLAR

# Shell configuration
cat ~/.zshrc | grep scholar

# Plugin configuration
cat ~/.claude/settings.json | grep scholar
```

### Verify API connectivity

```bash
# Test Claude API
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-opus-4-5-20251101","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
```

### Check file permissions

```bash
# See if directories are writable
touch test-write.txt
rm test-write.txt
echo $?  # 0 = success

# Check Scholar executable
file $(which scholar)
# Should show "executable"
```

### Monitor API usage

Visit: https://console.anthropic.com/account/billing/usage

---

## Getting Help

**Not found here?** Check these resources:

- **[FAQ - Teaching](FAQ-teaching.md)** - Common questions
- **[Teaching Commands Refcard](../refcards/teaching-commands.md)** - Command reference
- **[Configuration Guide](../CONFIGURATION.md)** - Config options
- **[GitHub Issues](https://github.com/Data-Wise/scholar/issues)** - Report bugs
- **[GitHub Discussions](https://github.com/Data-Wise/scholar/discussions)** - Ask questions

---

**Questions? Spotted an issue?** Open a GitHub issue: https://github.com/Data-Wise/scholar/issues

**Last Updated:** 2026-02-09 for Scholar v2.17.0
