# Proposal: Unified `--revise` and `--check` for Teaching Commands

**Status:** Approved (brainstorm review 2026-02-09)
**Created:** 2026-02-09
**Author:** DT
**Affects:** Scholar plugin v2.8+, flow-cli v6.6+

---

## Summary

Extend `--revise` (refinement) and `--check` (validation) support to all teaching commands. Currently only `/teaching:lecture` supports these modes. This proposal adds them to slides first (MVP), then quiz, exam, and assignment.

Additionally, rename `--refine` to `--revise` across Scholar to unify naming with flow-cli.

## Motivation

After generating slides, quizzes, or assignments, the only options are:

1. **Manual editing** — tedious, loses AI assistance
2. **Full regeneration** — discards all manual tweaks

Lectures already solve this with `--refine` (targeted updates) and `--check` (plan validation). Other commands should have the same capability.

### Current State

| Command | Generate | Revise | Check |
| --- | --- | --- | --- |
| `/teaching:lecture` | Yes | Yes (`--refine`) | Yes (`--check`) |
| `/teaching:slides` | Yes | **No** | **No** |
| `/teaching:quiz` | Yes | **No** | **No** |
| `/teaching:exam` | Yes | **No** | **No** |
| `/teaching:assignment` | Yes | **No** | **No** |
| `/teaching:rubric` | Yes | No | No |
| `/teaching:feedback` | Yes | No | No |
| `/teaching:syllabus` | Yes | No | No |

---

## Design Decisions

Resolved during interactive brainstorm review (2026-02-09):

| Decision | Choice | Rationale |
| --- | --- | --- |
| v2.8.0 scope | Both `--revise` + `--check` for slides | More useful together; slides are the primary post-edit content type |
| Naming | Unify on `--revise` | Matches flow-cli; simpler verb than "refine" |
| Instruction required? | Optional | Bare `--revise` = auto-analysis improvement pass |
| Slide targeting | Section + range + type | Maximum flexibility for slide-specific workflows |
| Slide parser location | New `src/teaching/utils/slide-parser.js` | Wraps existing `qmd-parser.js`; clean separation of concerns |
| QMD splitting | `##` headings only | DT's decks use `##` exclusively; no `---` separator logic needed |
| Type classification | Hybrid: CSS classes → heading patterns → content heuristics | CSS classes from dtslides are reliable primary signal |
| Bare `--revise` mode | Apply directly, `--dry-run` for preview | Fast workflow; 7 analysis dimensions |
| Context strategy | Adaptive: full deck if <30 slides, targeted + neighbors if >= 30 | Balances coherence vs token limits |
| Style rules location | Extend `teach-config.yml` with `style.validation` section | One source of truth, customizable per course |
| Style strictness | Configurable: `advisory` or `strict` | User controls whether style issues are WARN or FAIL |
| `--check` suggestions | Include ready-to-run `--revise` commands | Seamless check → fix workflow |
| `--check` scope | All commands eventually | Consistent validation across content types |
| flow-cli integration | Pass-through | flow-cli forwards `--instruction`, `--section` to Scholar |

---

## 1. Rename `--refine` to `--revise`

**Breaking change** affecting `/teaching:lecture` only.

### Migration Plan

| Release | Behavior |
| --- | --- |
| v2.8.0 | `--revise` added as primary flag. `--refine` works silently as alias. |
| v2.9.0 | `--refine` prints deprecation warning, still works. |
| v3.0.0 | `--refine` removed. |

### Changes Required

- `src/plugin-api/commands/teaching/lecture.md` — Update flag name in docs and `<system>` block
- `src/teaching/generators/lecture-refiner.js` — Accept both `--revise` and `--refine` in arg parsing
- flow-cli — No changes needed (already uses `--revise`)

---

## 2. Slides `--revise` (MVP — Phase 1)

### New Syntax

```
# General improvement (no instruction)
/teaching:slides --revise slides/week-03_contrasts_slides.qmd

# With instruction
/teaching:slides --revise slides/week-03.qmd --instruction "Add quiz slides after each section"

# Target by section header (fuzzy matched)
/teaching:slides --revise slides/week-03.qmd --section "Factorial Effects" \
  --instruction "Add a worked example"

# Target by slide range
/teaching:slides --revise slides/week-03.qmd --slides 5-12 \
  --instruction "Simplify notation"

# Target by slide type
/teaching:slides --revise slides/week-03.qmd --type quiz \
  --instruction "Make questions harder"

# Dry run (preview only)
/teaching:slides --revise slides/week-03.qmd --dry-run
```

### New Flags

| Flag | Description | Required | Example |
| --- | --- | --- | --- |
| `--revise PATH` | Path to existing slide deck | Yes (revise mode) | `--revise slides/week-03.qmd` |
| `--instruction TEXT` | What to change | No | `--instruction "Add quizzes"` |
| `--section TITLE` | Target section heading (fuzzy) | No | `--section "ANOVA Results"` |
| `--slides N-M` | Target slide range by number | No | `--slides 5-12` |
| `--type TYPE` | Target by slide type | No | `--type quiz` |
| `--dry-run` | Preview changes without applying | No | `--dry-run` |

**Slide types for `--type`:** `title`, `content`, `example`, `practice`, `quiz`, `summary`, `definition`, `theorem`, `discussion`, `questions`

### Behavior: Bare `--revise` (No Instruction)

When `--instruction` is omitted, Scholar performs an AI auto-analysis pass across 7 dimensions:

1. **Slide density** — flag overcrowded/sparse slides, suggest splits or merges
2. **Practice distribution** — ensure practice slides spread evenly, not clustered
3. **Style compliance** — match teaching style config rules
4. **Math depth** — formulas must have conceptual explanation/derivation
5. **Worked examples** — numerical examples present for key concepts
6. **Content completeness** — sufficient explanation of underlying concepts
7. **R output interpretation** — code output slides should include interpretation guidance

Changes are applied directly. Use `--dry-run` to preview suggestions without applying.

### Implementation: Slide Parser

New module: `src/teaching/utils/slide-parser.js`

**Architecture:** Wraps existing `qmd-parser.js` (second pass adding slide semantics).

```
parseQmdFile()          ← existing qmd-parser.js
     │
     ▼
parseSlides(parsed)     ← NEW slide-parser.js
     │
     ├─ Assign slide numbers (sequential from 1)
     ├─ Classify each slide type (hybrid: CSS → heading → heuristic)
     ├─ Group slides into sections (by ## boundaries)
     └─ Map slide numbers → source line ranges
```

**Slide object output:**

```js
{
  number: 5,              // Sequential slide number
  type: 'example',        // Classified type
  title: 'Worked Example: Contrast Coefficients',
  sectionTitle: 'Planned Comparisons',  // Parent ## section
  startLine: 45,
  endLine: 62,
  content: '...',
  classes: ['small-slide'],  // CSS classes found
  hasCode: true,
  hasMath: true
}
```

**Type classification cascade:**

1. CSS classes → `{.quiz-question}` = quiz, `{.section-slide}` = title
2. Heading text → "Quiz:", "Example:", "Practice:" prefixes
3. Content heuristics:
   - Has `{.correct}` or `{.incorrect}` → quiz
   - Has `{.callout-important}` → definition/theorem
   - Has R code block with `echo: true` → example
   - Has bullet list only → content
   - First slide after `##` → title (if short)
   - Last slide with "Summary"/"Takeaway" → summary
4. Default → content

### Implementation: Slide Refiner

New module: `src/teaching/generators/slide-refiner.js`

**Target resolver:** Unified function normalizes `--section`, `--slides N-M`, `--type` into a `Slide[]` array passed to the AI.

**Context strategy:** Adaptive — send full deck to AI if <30 slides, send targeted slides + 1 neighbor on each side if >= 30.

---

## 3. `--check` Expansion

### Slides `--check` (Phase 2)

```
/teaching:slides --check slides/week-03.qmd --from-plan=week03
```

**Three validation layers:**

#### Layer 1: Coverage

Verify every lesson plan objective appears in slide content.

- Extract objectives from lesson plan for the specified week
- Scan slide content for keyword/semantic matches (reuse `lecture-coverage.js` pattern)
- Coverage checked **across all slides in a section** (not slide-by-slide, since slides are shorter than lecture sections)
- Report: `PASS` (all covered), `WARN` (partial), `FAIL` (objectives missing)

#### Layer 2: Structure

Verify slide composition meets guidelines. Expected ratios from `teach-config.yml`:

```yaml
scholar:
  style:
    structure:
      content_ratio: 0.70    # ~70% content slides
      practice_ratio: 0.15   # ~15% practice slides
      minutes_per_slide: 2.5 # For expected count calculation
      tolerance: 0.20        # 20% tolerance on ratios
      quiz_per_section: 1    # Minimum quiz slides per ## section
```

| Metric | Expected | Source |
| --- | --- | --- |
| Slide count | duration / 2.5 (within 20%) | `minutes_per_slide` in config |
| Content slides | ~70% of total | `content_ratio` in config |
| Practice slides | ~15% of total | `practice_ratio` in config |
| Other (title, objectives, summary) | ~15% | Remainder |
| Quiz slides | At least 1 per major section | `quiz_per_section` in config |

#### Layer 3: Style

Verify teaching style compliance. Configurable strictness:

```yaml
scholar:
  style:
    validation:
      strictness: advisory    # advisory | strict
      rules:
        math_notation: warn   # LaTeX present when math: true
        code_visibility: warn # echo: settings match guide
        callout_usage: warn   # Key concepts use {.callout-important}
        dtslides_classes: warn # Appropriate CSS class usage
        hand_calculations: warn # Present before R code for priority topics
```

| Rule | What It Checks | PASS | WARN/FAIL |
| --- | --- | --- | --- |
| `math_notation` | LaTeX (`$...$` or `$$...$$`) present when config says `math: true` | Found in content slides | No math despite config |
| `code_visibility` | `echo:` chunk options match teaching config | Consistent | Mixed or missing |
| `callout_usage` | `{.callout-important}` for definitions, `{.callout-tip}` for tips | Present for key concepts | Key concept without callout |
| `dtslides_classes` | `.small-slide`, `.section-slide` used appropriately | Correct usage | Misused or missing on dense slides |
| `hand_calculations` | Manual calculation shown before R output for priority topics | Present | R output without preceding math |

When `strictness: advisory`, all rule violations produce WARN. When `strictness: strict`, violations produce FAIL.

### Quiz `--check` (Phase 3)

```
/teaching:quiz --check quiz-week03.qmd --from-plan=week03
```

Validates:
- Topic coverage against lesson plan objectives
- Difficulty distribution (matches `--difficulty` setting)
- Question type mix (MC, SA, calculation, essay)

### Exam `--check` (Phase 3)

```
/teaching:exam --check midterm.qmd --from-plan=week01,week02,week03,week04,week05,week06
```

Validates:
- Cumulative coverage across multiple weeks
- Difficulty distribution
- Time budget per question vs total duration
- Question type distribution

### Assignment `--check` (Phase 3)

```
/teaching:assignment --check hw03.qmd --from-plan=week03
```

Validates:
- Objective alignment
- Problem difficulty curve (progressive)
- Point distribution

### Output Format

All `--check` commands produce a consistent report with actionable `--revise` commands:

```
=== Slide Check: slides/week-03.qmd ===
Plan: week03 (Planned Comparisons and Contrasts)

COVERAGE (3/3 objectives) ........................ PASS
  [x] Construct and interpret planned comparisons
  [x] Verify orthogonality of contrast sets
  [x] Implement Scheffé and Bonferroni adjustments

STRUCTURE ...................................... WARN
  Slide count: 22 (expected ~20, OK)
  Content: 68% (expected ~70%, OK)
  Practice: 9% (expected ~15%, LOW)
  Quiz: 0 slides (expected >= 1, MISSING)

STYLE (advisory) ............................... WARN
  [x] Math notation: Present
  [x] Code visibility: Consistent
  [!] Callouts: Slide 8 defines "orthogonal contrasts" without {.callout-important}
  [x] dtslides classes: Appropriate
  [!] Hand calculations: Slide 14 shows R output without preceding derivation

Overall: WARN (3 issues)

Suggested fixes:
  → /teaching:slides --revise slides/week-03.qmd --section "Comparisons" \
      --instruction "Add a practice slide after the worked example"
  → /teaching:slides --revise slides/week-03.qmd --section "Comparisons" \
      --instruction "Add a quiz slide to test understanding"
  → /teaching:slides --revise slides/week-03.qmd --slides 8 \
      --instruction "Wrap the orthogonal contrasts definition in {.callout-important}"
  → /teaching:slides --revise slides/week-03.qmd --slides 14 \
      --instruction "Add hand calculation derivation before the R output"
```

Add `--json` flag for CI integration. JSON schema extends lecture's `validateCoverage()` output with `structure` and `style` layers.

---

## 4. flow-cli Pass-Through

Update flow-cli to forward new flags to Scholar:

### Phase 1 (slides --revise)

```bash
teach slides --revise FILE
teach slides --revise FILE --instruction "Add quizzes"
teach slides --revise FILE --section "ANOVA" --instruction "More examples"
teach slides --revise FILE --slides 5-12 --instruction "Simplify"
teach slides --revise FILE --type quiz --instruction "Harder"
teach slides --revise FILE --dry-run
```

### Phase 2+ (--check for all)

```bash
teach slides --check FILE --from-plan=week03
teach slides --check FILE --from-plan=week03 --json
teach quiz --check FILE --from-plan=week03
teach exam --check FILE --from-plan=week01-week06
teach assignment --check FILE --from-plan=week03
```

### Implementation

flow-cli already has `--revise` for lectures. Extend the flag forwarding to:
1. Accept `--revise`, `--instruction`, `--section`, `--slides`, `--type`, `--dry-run` for slides
2. Accept `--check`, `--from-plan`, `--json` for all teaching commands
3. Forward to Scholar plugin via the existing invocation mechanism

---

## 5. Implementation Phases

| Phase | Scope | Commands | Target Version |
| --- | --- | --- | --- |
| **1** | `--revise` for slides + rename `--refine` to `--revise` | slides, lecture | v2.8.0 |
| **2** | `--check` for slides (coverage + structure + style) | slides | v2.8.0 |
| **3** | `--check` for quiz, exam, assignment | quiz, exam, assignment | v2.9.0 |
| **4** | `--revise` for quiz, exam, assignment | quiz, exam, assignment | v2.9.0 |
| **5** | flow-cli pass-through for all new flags | flow-cli | v6.6.0 |

---

## 6. Open Questions — RESOLVED

All open questions were resolved during interactive brainstorm review (2026-02-09):

| # | Question | Resolution |
| --- | --- | --- |
| 1 | Slide parser design | `##` headings only — DT's decks don't use `---` separators |
| 2 | Fuzzy matching threshold | Reuse lecture's slug-based matching from `qmd-parser.js` (`matchSection()`) |
| 3 | Bare `--revise` prompt | 7-dimension auto-analysis: density, practice, style, math depth, worked examples, content completeness, R output interpretation |
| 4 | `--check` output format | Text report + `--json` flag. JSON extends lecture's `validateCoverage()` with structure + style layers |
| 5 | Style validation codification | Rules live in `teach-config.yml` under `style.validation` section. Configurable strictness: `advisory` or `strict` |
| 6 | Slide type classification | Hybrid: CSS classes first (`{.quiz-question}`, `{.section-slide}`), then heading patterns, then content heuristics, default `content` |

---

## Files Affected

### Scholar Plugin (Phases 1-2, v2.8.0)

| File | Change |
| --- | --- |
| `src/plugin-api/commands/teaching/slides.md` | Add `--revise`, `--check` docs and `<system>` implementation |
| `src/plugin-api/commands/teaching/lecture.md` | Rename `--refine` to `--revise` (keep alias) |
| `src/teaching/utils/slide-parser.js` | **New** — slide deck parser (wraps qmd-parser) |
| `src/teaching/generators/slide-refiner.js` | **New** — slide refinement engine with target resolver |
| `src/teaching/validators/slide-coverage.js` | **New** — slide 3-layer validator (coverage + structure + style) |
| `src/teaching/generators/lecture-refiner.js` | Accept `--revise` as alias for `--refine` |

### Scholar Plugin (Phases 3-4, v2.9.0)

| File | Change |
| --- | --- |
| `src/plugin-api/commands/teaching/quiz.md` | Add `--check` docs |
| `src/plugin-api/commands/teaching/exam.md` | Add `--check` docs |
| `src/plugin-api/commands/teaching/assignment.md` | Add `--check` docs |
| `src/teaching/validators/quiz-coverage.js` | **New** — quiz coverage validator |
| `src/teaching/validators/exam-coverage.js` | **New** — exam coverage validator |
| `src/teaching/validators/assignment-coverage.js` | **New** — assignment coverage validator |

### flow-cli (Phase 5, v6.6.0)

| File | Change |
| --- | --- |
| `lib/commands/slides.zsh` | Forward `--revise`, `--instruction`, `--section`, `--slides`, `--type`, `--dry-run`, `--check` |
| `lib/commands/quiz.zsh` | Forward `--check`, `--from-plan`, `--json` |
| `lib/commands/exam.zsh` | Forward `--check`, `--from-plan`, `--json` |
| `lib/commands/assignment.zsh` | Forward `--check`, `--from-plan`, `--json` |

---

## Related

- `.flow/teach-config.yml` — Teaching style config (source for style validation rules)
- `.flow/templates/prompts/` — Prompt templates (will need new `slide-revision.md`)

---

## History

| Date | Change |
| --- | --- |
| 2026-02-09 | Initial draft |
| 2026-02-09 | Interactive brainstorm review: resolved all 6 open questions, added slide parser architecture, refiner design, validation layer details, config schema, and `--dry-run` flag |
