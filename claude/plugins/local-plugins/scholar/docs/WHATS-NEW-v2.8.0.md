# What's New in Scholar v2.8.0

**Release:** Unified Slide Revision & Coverage Validation
**Date:** February 2026

---

## Highlights

Scholar v2.8.0 adds iterative slide refinement with `--revise` and comprehensive validation with `--check` to `/teaching:slides`. The slide parser module introduces semantic type classification for 11 slide types, while the refiner enables targeted revision by section, slide range, or type. Coverage validation ensures every lesson plan objective appears in slide content and structural ratios match configuration.

### `--revise` for Slides — Targeted Refinement

Revise existing slides with AI guidance, targeting specific sections, ranges, or types:

```bash
# Full deck revision
/teaching:slides --revise slides.qmd --instruction "Add more examples"

# Section-specific revision
/teaching:slides --revise slides.qmd --section "Methods" --instruction "Simplify"

# Slide range revision
/teaching:slides --revise slides.qmd --slides 5-12 --instruction "Add notes"

# Type-specific revision
/teaching:slides --revise slides.qmd --type quiz --instruction "Add 4th option"

# Auto-analysis preview
/teaching:slides --revise slides.qmd --dry-run
```

The refiner supports auto-analysis mode (bare `--revise` without `--instruction`) which evaluates slides across 7 dimensions:

1. **density** — Flag overcrowded (>20 lines) or sparse (<3 lines) slides
2. **practice-distribution** — Ensure even spread of practice/quiz slides across sections
3. **style-compliance** — Match configured tone and formatting rules
4. **math-depth** — Formulas with explanation and derivation
5. **worked-examples** — Numerical examples for key concepts
6. **content-completeness** — Sufficient concept explanation
7. **r-output-interpretation** — Code output with interpretation

Adaptive context mode provides full deck context for small decks (<30 slides) and targeted context with neighboring slides for large decks.

### `--check` for Slides — Coverage Validation

Validate slides against lesson plans with 3-layer verification:

```bash
# Standard coverage check
/teaching:slides --check slides/week-03.qmd --from-plan week03

# JSON output for automation
/teaching:slides --check slides/week-03.qmd --from-plan week03 --json
```

Validation layers:

1. **Coverage** — Every lesson plan objective appears in slide content (keyword matching)
2. **Structure** — Slide ratios match config (`content_ratio: 0.70`, `practice_ratio: 0.15`, `minutes_per_slide: 2.5`)
3. **Style** — Teaching style compliance (5 rules: math notation, code visibility, callout usage, dtslides classes, hand calculations)

Reports include suggested `--revise` commands for failed checks. Strictness is configurable (`advisory` or `strict` mode) in `teach-config.yml`.

### Slide Parser — Type Classification

New semantic parser wraps `qmd-parser.js` with slide-specific classification cascade:

- **CSS classes** — `{.quiz}`, `{.practice}`, etc.
- **Heading patterns** — "Example:", "Practice:", "Summary"
- **Content heuristics** — Quiz markup, code blocks, definition lists
- **Default** — Falls back to 'content' type

11 slide types: `title`, `content`, `example`, `practice`, `quiz`, `summary`, `definition`, `theorem`, `discussion`, `questions`, `objectives`

Exports: `parseSlides()`, `parseSlidesFromContent()`, `parseSlidesFromFile()`, `classifySlideType()`, `extractCssClasses()`, `filterByType()`, `filterByRange()`, `filterBySection()`, `getSlideSummary()`

### `/teaching:lecture` — `--refine` Rename

`--refine` is now aliased to `--revise` for terminology consistency across commands:

```bash
# New preferred syntax
/teaching:lecture --revise lecture-notes.md --instruction "Add examples"

# Old syntax (still works, silent alias)
/teaching:lecture --refine lecture-notes.md --instruction "Add examples"
```

Migration timeline:
- **v2.8.0:** `--refine` works as silent alias
- **v2.9.0:** `--refine` shows deprecation warning
- **v3.0.0:** `--refine` removed

## New Files

| File | Purpose |
| ---- | ------- |
| `src/teaching/utils/slide-parser.js` | Slide-specific parser with type classification (394 lines) |
| `src/teaching/generators/slide-refiner.js` | Targeted slide revision engine (1,052 lines) |
| `src/teaching/validators/slide-coverage.js` | 3-layer slide validation (672 lines) |
| `tests/teaching/slide-parser.test.js` | Slide parser unit tests |
| `tests/teaching/slide-refiner.test.js` | Refiner unit tests |
| `tests/teaching/slide-refiner-auto.test.js` | Auto-analysis tests |
| `tests/teaching/slide-coverage.test.js` | Coverage validator tests |
| `tests/teaching/lecture-refiner-alias.test.js` | Refine/revise alias tests |
| `tests/e2e/slides-revise-check.test.js` | End-to-end integration tests |

## Stats

| Metric | v2.7.0 | v2.8.0 | Change |
| ------ | ------ | ------ | ------ |
| Commands | 28 | 28 | — |
| Tests | 2,071 | 2,252 | +181 |
| Test Suites | 76 | 77 | +1 (e2e suite) |
| Source Files | — | — | +3 (parser, refiner, validator) |

## Configuration

### teach-config.yml Extensions

```yaml
scholar:
  defaults:
    # Slide structure ratios (for --check validation)
    content_ratio: 0.70      # 70% content/example/definition slides
    practice_ratio: 0.15     # 15% practice/quiz slides
    minutes_per_slide: 2.5   # Average time per slide

  validation:
    strictness: "advisory"   # or "strict" (fail on any violation)

  style:
    # Teaching style rules (for --check validation)
    math_notation: "statistical"
    code_visibility: true
    callout_usage: true
    dtslides_classes: true
    hand_calculations: true
```

## Upgrade Notes

v2.8.0 is fully backward compatible. Existing slide generation workflows are unchanged. The `--revise` and `--check` modes are additive features.

**Migration for `/teaching:lecture`:**
- Update command invocations from `--refine` to `--revise` before v3.0.0
- Both flags work identically in v2.8.0 (no behavior change)

**AI Fallback:**
- When no Claude API key is configured, `--revise` injects HTML comments as revision suggestions instead of rewriting content

---

## See Also

- [What's New in v2.7.0](WHATS-NEW-v2.7.0.md) - Scholar Hub
- [What's New in v2.6.0](WHATS-NEW-v2.6.0.md) - Config-Flow Integration
- [What's New in v2.5.0](WHATS-NEW-v2.5.0.md) - Weekly Lecture Production
- [Architecture Diagrams](ARCHITECTURE-DIAGRAMS.md) - System overview
