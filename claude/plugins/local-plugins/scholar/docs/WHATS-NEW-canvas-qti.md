# What's New: Canvas QTI Enhancements

Release notes for the Canvas QTI pipeline enhancements (E1-E7).

## Summary

Seven enhancements to the Canvas QTI export pipeline, improving type coverage, error handling, section support, and image bundling.

## Enhancements

### E1: Upload Type Warning

**Problem:** `[Upload]` questions produced 0 QTI items because examark silently drops them.

**Fix:** Upload questions are now mapped to Essay with a prepended note explaining the degradation. A warning is emitted via `formatter.warnings` so callers can surface it to users.

### E2: Rich Demo Fixture

**New:** `quiz-mixed.json` demo fixture covering all 10 supported question types (MC, MA, TF, Short, Numeric, Essay, Match, FMB, FIB, Upload). Used for comprehensive e2e testing.

### E3: Verify Tolerance

**Problem:** `examark verify` exits non-zero for Essay/Short/Numeric questions (no correct answer in QTI), killing the pipeline.

**Fix:** `CanvasFormatter.validateQTI()` now parses stderr to separate expected "No correct answer defined" warnings from real structural errors. When only warnings are present, the result is `valid: true`.

### E4: Section / Question Group Support

**Problem:** QMD `## Section` headers existed but weren't mapped to Canvas question groups.

**Fix:** QMD H1 sections now propagate as `sectionName` on parsed questions. `ExamarkFormatter` emits H1 headers when the section changes, which examark maps to Canvas question groups. Only activates when 2+ H1 sections exist (a single H1 is treated as the exam title).

### E5: Point Redistribution

**Verified:** Sub-part point distribution already worked correctly — parent points are divided equally when sub-parts lack explicit `[N pts]`. Added regression tests to lock in this behavior.

### E6: Matching Distractors (Deferred)

examark ignores distractor items in QTI output, so implementing parser support would be misleading. Deferred until examark adds distractor support.

### E7: Image Support

**Problem:** `![alt](path)` in QMD was untested through the pipeline.

**Fix:** Added `extractImages()` helper to the QMD parser that finds image references and stores them on question objects. `CanvasFormatter` accepts a `sourceDir` option that sets the working directory for examark CLI, enabling image bundling into QTI zip packages.

## Test Coverage

- 45 new examark formatter tests (total: 45)
- 72 QMD parser tests (up from 61)
- 31 e2e canvas QTI tests (up from 28)
- 7 canvas formatter unit tests (new)
- All tests passing with `npm test`

## Files Changed

### Source
- `src/teaching/formatters/examark.js` — warnings array, Upload→Essay mapping, section headers
- `src/teaching/formatters/canvas.js` — verify tolerance, sourceDir threading, warning surfacing
- `src/teaching/parsers/qmd-exam.js` — section name propagation, image extraction

### Tests
- `tests/teaching/examark-formatter.test.js` — Upload, section header tests
- `tests/teaching/formatters/canvas-formatter.test.js` — new: verify tolerance tests
- `tests/teaching/parsers/qmd-exam.test.js` — point redistribution, section, image tests
- `tests/e2e/canvas-qti-e2e.test.js` — mixed quiz, image bundling tests

### Fixtures
- `src/teaching/demo-templates/examples/quiz-mixed.json` — new: 10-type quiz
- `tests/teaching/fixtures/canvas/test-image.png` — new: 1x1 test image
