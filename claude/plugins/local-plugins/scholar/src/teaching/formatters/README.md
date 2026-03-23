# Exam Formatters

Multi-format export for scholar exam generator.

## Overview

Convert exam JSON content to multiple output formats:

- **Markdown** (`.md`) - Human-readable, examark-compatible
- **Canvas QTI** (`.qti.zip`) - LMS import package
- **Quarto** (`.qmd`) - Literate documents with PDF rendering
- **LaTeX** (`.tex`) - Academic typesetting

## Usage

### Basic Example

```javascript
import { MarkdownFormatter } from './formatters/index.js';

const formatter = new MarkdownFormatter();
const markdown = formatter.format(examContent);
```

### With Exam Generator

```javascript
import { generateAndSaveExam } from './generators/exam.js';

// Generate markdown
await generateAndSaveExam(
  { type: 'midterm', topics: ['regression'] },
  'exam.md',
  'md'
);

// Generate Canvas QTI
await generateAndSaveExam(
  { type: 'midterm', topics: ['regression'] },
  'exam.qti.zip',
  'canvas'
);

// Generate Quarto
await generateAndSaveExam(
  { type: 'midterm', topics: ['regression'] },
  'exam.qmd',
  'qmd'
);

// Generate LaTeX
await generateAndSaveExam(
  { type: 'midterm', topics: ['regression'] },
  'exam.tex',
  'tex'
);
```

## Formatters

### MarkdownFormatter

Converts JSON → examark-compatible Markdown.

**Features:**
- YAML frontmatter
- LaTeX math preservation
- Multiple-choice with correct answer marking (`*`)
- Answer keys for all question types
- Formula sheet appendix

**Options:**
```javascript
formatter.format(content, {
  skipFrontmatter: false,
  includeAnswers: true,
  includeMetadata: true
});
```

### CanvasFormatter

Converts JSON → Markdown → Canvas QTI package.

**Requirements:**
- examark installed (`npm install -g examark`)

**Features:**
- Automatic QTI .zip generation
- Built-in validation
- Canvas import simulation
- Secure command execution (uses `execFile`)

**Options:**
```javascript
await formatter.format(content, {
  output: 'exam.qti.zip',
  validate: true,
  cleanupTemp: true
});
```

**Methods:**
- `validateQTI(path)` - Verify QTI package
- `emulateCanvasImport(path)` - Simulate Canvas import

### QuartoFormatter

Converts JSON → Quarto document.

**Features:**
- Enhanced YAML frontmatter
- PDF/HTML output formats
- Exam metadata table
- Instruction callout boxes
- LaTeX package configuration

**Options:**
```javascript
formatter.format(content, {
  documentClass: 'exam',
  format: 'pdf',
  pdfOptions: {
    toc: false,
    numberSections: false,
    geometry: { margin: '1in' },
    packages: ['tikz']
  }
});
```

### LaTeXFormatter

Converts JSON → LaTeX exam class.

**Features:**
- exam documentclass
- Proper math escaping
- Multiple-choice as `\begin{choices}`
- Rubric formatting
- Formula sheet appendix

**Options:**
```javascript
formatter.format(content, {
  documentClass: 'exam',
  fontSize: '12pt',
  solutions: false,
  answers: true
});
```

## Architecture

All formatters extend `BaseFormatter`:

```javascript
class BaseFormatter {
  format(content, options) { /* abstract */ }
  validate(output) { /* optional */ }
  getFileExtension() { /* abstract */ }

  // Helpers
  formatLatex(text, format)
  escapeMarkdown(text)
  escapeLatex(text)
  validateContent(content)
}
```

## Testing

Run formatter tests:

```bash
npm test -- tests/teaching/formatters.test.js
```

Integration tests (requires examark):

```bash
npm run test:integration
```

## Dependencies

| Formatter | Dependencies |
|-----------|-------------|
| Markdown | None (built-in) |
| Canvas | examark (optional) |
| Quarto | None (runtime: quarto) |
| LaTeX | None (runtime: texlive) |

Install optional dependencies:

```bash
npm install --save-optional examark@^0.6.6
```

## Security

**Command Injection Prevention:**

Canvas formatter uses `execFile` (not `exec`) to safely execute examark.

✅ **Safe implementation (used in CanvasFormatter):**
```javascript
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

// Safe: Array args prevent injection
await execFileAsync('examark', [mdPath, '-o', qtiPath]);
```

❌ **Unsafe pattern (DO NOT USE):**
```javascript
// VULNERABLE to command injection
// DO NOT USE THIS PATTERN
const unsafe = `examark "${userInput}" -o output.zip`;
```

All command execution in this codebase uses `execFile` with array arguments to prevent shell injection attacks.

## Examples

### Generate All Formats

```javascript
const formats = ['json', 'md', 'canvas', 'qmd', 'tex'];

for (const format of formats) {
  await generateAndSaveExam(options, `exam.${format}`, format);
}
```

### Custom Formatter

```javascript
import { BaseFormatter } from './formatters/base.js';

class HTMLFormatter extends BaseFormatter {
  format(content, options) {
    // Custom HTML generation
    return `<html>...</html>`;
  }

  getFileExtension() {
    return '.html';
  }
}
```

## Validation

All formatters support output validation:

```javascript
const markdown = formatter.format(content);
const result = formatter.validate(markdown);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Error Handling

```javascript
try {
  const qti = await canvasFormatter.format(content);
} catch (error) {
  if (error.message.includes('examark not installed')) {
    console.error('Install examark: npm install -g examark');
  } else {
    console.error('Conversion failed:', error.message);
  }
}
```

## Integration

### With flow-cli

```yaml
# .flow/teach-config.yml
scholar:
  defaults:
    exam_format: "canvas"  # Default format
```

### With examark CLI

```bash
# Generate markdown
scholar exam --format md --output exam.md

# Convert to Canvas
examark exam.md -o exam.qti.zip --validate

# Verify QTI
examark verify exam.qti.zip

# Simulate Canvas import
examark emulate-canvas exam.qti.zip
```

## See Also

- [Exam Generator](../generators/README.md)
- [Template System](../templates/README.md)
- [examark Documentation](https://github.com/Data-Wise/examark)
