# What's New in Scholar v2.11.0

**Released:** 2026-02-12 | **PR:** [#76](https://github.com/Data-Wise/scholar/pull/76)

## Custom Instructions — `--instructions` / `-i` Flag

Scholar v2.11.0 adds the `--instructions` / `-i` flag to all 8 AI-generating teaching commands. Instructions are AI-categorized, merged into your active prompt, and presented for approval before generation begins.

### How It Works

```
Your instructions ──→ AI categorizer (Haiku) ──→ Merge with prompt ──→ Approval ──→ Generate
```

1. **You provide** instructions inline or from a file
2. **Haiku categorizes** each instruction into content, style, format, or constraints
3. **Scholar merges** instructions into the active prompt at the right sections
4. **You review** a summary with conflict notices before generation
5. **Accept, modify, or cancel** — unlimited modification rounds

### Supported Commands

| Command | What `-i` Controls |
|---------|-------------------|
| `/teaching:exam` | Question types, datasets, difficulty focus |
| `/teaching:quiz` | Question style, examples, tone |
| `/teaching:assignment` | Problem types, tools, complexity |
| `/teaching:syllabus` | Policy emphasis, schedule structure |
| `/teaching:slides` | Slide count, animations, depth |
| `/teaching:lecture` | Notation style, examples, R vs. Python |
| `/teaching:feedback` | Tone, specificity, improvement focus |
| `/teaching:rubric` | Criteria weighting, grading philosophy |

**Not supported (no AI generation):** config, demo, diff, migrate, sync, validate

### Inline Instructions

```bash
# Healthcare-focused exam
/teaching:exam midterm -i "Use clinical trial datasets, include R code"

# Conversational quiz with specific examples
/teaching:quiz "ANOVA" 10 -i "Use penguin dataset, keep it conversational"

# Slides with constraints
/teaching:slides "Bayesian Inference" -i "Max 20 slides, no proofs, focus on intuition"
```

### File-Based Instructions

Save reusable instructions to a file and reference with `@`:

```bash
# Create instruction file
cat > course-style.txt << 'EOF'
Use healthcare and epidemiology datasets
Include R code with tidyverse syntax
Conversational but precise tone
Always show hand calculations before R output
Maximum 3 essay questions per exam
EOF

# Use with any command
/teaching:exam final -i @course-style.txt
/teaching:slides "Regression" -i @course-style.txt
```

### Approval Workflow

When you use `-i`, Scholar shows a categorized summary before generating:

```
## Generation Plan

**Base:** Default exam prompt
**Custom instructions:** 4 applied

| Category    | Instructions                          |
|-------------|---------------------------------------|
| Content     | Use healthcare datasets               |
| Format      | Include R code snippets               |
| Style       | Conversational tone                   |
| Constraints | No more than 3 essay questions        |

### Notices
- [i] Style instructions may override config tone "formal"

---
**Accept** to generate | **Modify** to change instructions | **Cancel** to abort
```

**Conflict detection:** Scholar flags when your instructions conflict with existing config (e.g., you request "conversational tone" but config says `tone: formal`). You decide which wins.

**Unlimited modifications:** After reviewing, you can modify instructions as many times as needed. New instructions accumulate across rounds.

---

## Architecture

### InstructionMerger Engine

The core engine (`src/teaching/ai/instruction-merger.js`) handles the full pipeline:

| Method | Purpose |
|--------|---------|
| `analyze()` | Parse and validate raw instructions |
| `categorize()` | AI classification via Haiku into 4 categories |
| `merge()` | Inject instructions into prompt at section markers |
| `summarize()` | Generate human-readable approval summary |
| `detectConflicts()` | Compare instructions against active config |

**Factory function:** `createMerger(options)` for simplified instantiation.

### Prompt Injection Points

Instructions are injected at semantic markers in the prompt template:

| Marker | Category | Example |
|--------|----------|---------|
| `## Topic` | Content | "Use healthcare datasets" |
| `## Teaching Style` | Style | "Conversational tone" |
| `## Output Format` | Format | "Include R code" |
| `## Constraints` | Constraints | "Max 20 slides" |

### Security

- XML delimiters isolate user instructions from system prompt
- Path traversal protection in `@file` loading (rejects `..`, `/`, `\`)
- Instructions are sandboxed — cannot override system-level directives

---

## New Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/teaching/ai/instruction-merger.js` | ~350 | Core InstructionMerger engine |
| `src/teaching/ai/prompts/system/categorizer.md` | ~50 | Haiku categorization prompt |
| `tests/teaching/instruction-merger.test.js` | ~800 | 66 unit tests |
| `tests/teaching/e2e/instruction-merger-e2e.test.js` | ~600 | 36 E2E tests |
| `tests/teaching/fixtures/instruction-*.json` | — | 5 test fixtures |

---

## Stats

| Metric | v2.10.0 | v2.11.0 | Change |
|--------|---------|---------|--------|
| Commands | 29 | 29 | — |
| Commands with `-i` | 0 | 8 | +8 |
| Tests | 2,630 | 2,725 | +95 |
| Test suites | 98 | 103 | +5 |
| New source files | — | 2 | — |
| New test files | — | 7 | — |

---

## Backward Compatibility

No breaking changes. The `-i` flag is entirely additive — existing commands work exactly as before when `-i` is not provided. No configuration changes required.

---

## Getting Started

```bash
# Try it now — add instructions to any generation command
/teaching:exam midterm -i "Focus on Bayesian methods"

# Load from file for reusable course-wide instructions
/teaching:slides "Regression" -i @my-style.txt

# Check what your merged prompt looks like
/teaching:exam midterm -i "Use healthcare data" --dry-run
```

**Tutorial:** [Custom Instructions Tutorial](tutorials/teaching/custom-instructions.md)

---

## Related

- [CHANGELOG](https://github.com/Data-Wise/scholar/blob/main/CHANGELOG.md)
- [Teaching Commands Reference](TEACHING-COMMANDS-REFERENCE.md)
- [Teaching Examples Hub](examples/teaching.md#custom-instructions)
- [v2.10.0 Release Notes](WHATS-NEW-v2.9.0.md) (previous feature release)
