# Canvas (QTI Export)

Convert QMD exam files to Canvas LMS QTI format.

## Usage

```bash
/teaching:canvas <input-file> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--output PATH` | Output file path (default: `<input>.qti.zip`) |
| `--dry-run` | Parse and show detected questions without converting |
| `--intermediate` | Keep the intermediate examark `.md` file |
| `--validate` | Run `examark verify` on the generated QTI package |
| `--emulate` | Simulate Canvas import |
| `--split-parts` | Split multi-part questions (default: true) |
| `--default-type TYPE` | Fallback question type (default: Essay) |

## Pipeline

```
.qmd → parse → detect types → examark MD → examark CLI → .qti.zip
```

## Supported Question Types

- Multiple Choice (`[MC]`)
- Multiple Answer (`[MA]`)
- True/False (`[TF]`)
- Short Answer (`[Short]`)
- Numeric (`[Numeric]`)
- Essay (`[Essay]`)
- Matching (`[Match]`)
- Fill-in-Multiple-Blanks (`[FMB]`)
- Fill-in-Blank (`[FIB]`)
- File Upload (`[Upload]`) — degrades to Essay

For the full pipeline guide, see [Canvas QTI Pipeline Guide](../canvas-qti-guide.md).

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `examark not installed` | `npm install -g examark` or `brew install examark` |
| `QTI file not generated` | Check examark version: `examark --version` (needs v0.6.6+) |
| `No questions detected` | Ensure questions use `##` headings with point values |
| `Wrong question type` | Use `--dry-run` to preview, then add explicit `[MC]` tags |

## Examples

```bash
/teaching:canvas midterm.qmd
/teaching:canvas midterm.qmd --output midterm.qti.zip
/teaching:canvas midterm.qmd --dry-run
/teaching:canvas midterm.qmd --validate --emulate
```

## Also Available Via

- `/teaching:exam --format canvas` — generate exam and export to QTI
- `/teaching:quiz --format canvas` — generate quiz and export to QTI
- `/teaching:assignment --format canvas` — generate assignment and export to QTI

## Requirements

- [examark](https://github.com/Data-Wise/examark) v0.6.6+ (`npm install -g examark`)
