# What's New in Scholar v2.16.0

**Released:** 2026-02-27 | **Spec:** [Examark/QTI Canvas Integration](specs/SPEC-2026-02-26-examark-qti-integration.md)

## Overview

Scholar v2.16.0 adds Canvas LMS integration via a new `/teaching:canvas` command that converts QMD exam files to Canvas-importable QTI format using the examark CLI. The release also includes comprehensive documentation for the QMD parser, question type detector, and ExamarkFormatter APIs.

---

## `/teaching:canvas` Command

Convert QMD exam files to Canvas LMS QTI format:

```bash
# Basic conversion
/teaching:canvas exam.qmd

# With validation (dry-run + verify)
/teaching:canvas exam.qmd --validate

# Emulate Canvas import behavior
/teaching:canvas exam.qmd --emulate
```

### Pipeline

```
.qmd file → QMD Parser → Type Detector → ExamarkFormatter → examark CLI → .qti.zip
```

### 10 Supported Question Types

| Type | Examark Tag | Auto-Detection |
|------|------------|----------------|
| Multiple Choice | `[MC]` | Options with single correct answer |
| Multiple Answer | `[MA]` | Options with multiple correct answers |
| True/False | `[TF]` | Exactly two options (True/False) |
| Short Answer | `[Short]` | Free-text with expected answer |
| Numeric | `[Numeric]` | Answer is a number with tolerance |
| Essay | `[Essay]` | Open-ended, no single correct answer |
| Matching | `[Match]` | Paired items (term → definition) |
| Fill Multiple Blanks | `[FMB]` | Text with `[blank1]` placeholders |
| Fill in the Blank | `[FIB]` | Single blank completion |
| Upload | `[Upload]` | File submission (degrades to Essay) |

### Features

- **Auto-detection:** 11-step heuristic cascade identifies question types from QMD content
- **Section support:** QMD `## Section` headers map to Canvas question groups
- **Image bundling:** Local images embedded in QTI zip
- **Validation:** `--validate` runs examark dry-run before conversion
- **Canvas emulation:** `--emulate` simulates Canvas import behavior
- **Warning system:** Upload degradation, verify tolerance, and other edge cases surfaced as warnings

---

## Documentation Enhancements

### New API Documentation

- **ExamarkFormatter API** — `format()`, `validate()`, `getFileExtension()` methods
- **CanvasFormatter API** — `validateQTI()`, `emulateCanvasImport()`, `validate()`, all `format()` options
- **QMD Exam Parser API** — `parseExamFile()`, `parseExamContent()`, 7 helper functions
- **Question Type Detector API** — `detectQuestionType()`, `typeToTag()`, `tagToType()`

### New Guides

- [Canvas QTI Pipeline Guide](canvas-qti-guide.md) — End-to-end pipeline walkthrough
- [Canvas QTI Enhancements](WHATS-NEW-canvas-qti.md) — Detailed E1-E7 enhancement notes
- [Canvas Reference](teaching/canvas.md) — Quick reference with troubleshooting table

---

## Stats

| Metric | v2.15.0 | v2.16.0 | Change |
|--------|---------|---------|--------|
| Commands | 32 | {{ scholar.command_count }} | +1 |
| Tests | 3,092 | {{ scholar.test_count }} | +210 |
| Test Suites | 131 | {{ scholar.suite_count }} | +5 |

---

## Upgrade

```bash
brew upgrade scholar
```

Or from source:

```bash
git pull origin main
./scripts/install.sh --dev
```

---

**See also:** [CHANGELOG](https://github.com/Data-Wise/scholar/blob/main/CHANGELOG.md) | [Full Documentation](https://data-wise.github.io/scholar/)
