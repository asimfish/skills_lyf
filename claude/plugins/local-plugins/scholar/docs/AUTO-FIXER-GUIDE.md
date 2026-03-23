# Auto-fixer Guide - Scholar v{{ scholar.version }}

**Status:** Phase 1 Complete
**Created:** 2026-01-15
**Last Updated:** 2026-01-15

---

## Overview

The Auto-fixer Engine automatically detects and fixes common YAML configuration errors in scholar teaching configs. It provides four types of fixes organized by safety level and complexity.

### Quick Summary

| Fix Type             | Priority | Safety               | Confirmation  | Examples                        |
| -------------------- | -------- | -------------------- | ------------- | ------------------------------- |
| **QW1: Syntax**      | 1        | Yes Safe             | Auto-apply    | Indentation, quotes, whitespace |
| **M1.1: Schema**     | 2        | Warn Requires review | User confirms | Missing fields, invalid enums   |
| **M1.2: Type**       | 3        | Warn Requires review | User confirms | string→array, number→string     |
| **M1.3: Deprecated** | 4        | Warn Requires review | User confirms | v1→v2 field renames             |
| **QW4: Math**      | 5        | Yes Safe             | Auto-apply    | Blank lines in `$$...$$` blocks |

---

## Installation

The auto-fixer is included in scholar v2.3.0+:

```bash
npm install @data-wise/scholar
```

Or for development:

```bash
git clone https://github.com/Data-Wise/scholar.git
cd scholar
npm install
```

---

## Quick Start

### Basic Usage

```javascript
import { createAutoFixer } from '@data-wise/scholar/validators';
import yaml from 'js-yaml';

const fixer = createAutoFixer();

// 1. Fix syntax errors (safe, auto-apply)
const yamlContent = `
week: 1
content:
   topics:
      - Statistics
`;

const syntaxResult = fixer.fixSyntaxErrors(yamlContent);
if (syntaxResult.success) {
  console.log('Fixed YAML:', syntaxResult.fixed);
  console.log('Changes:', syntaxResult.changes);
}

// 2. Fix schema violations (requires confirmation)
const data = yaml.load(syntaxResult.fixed);
const schemaErrors = [/* from ajv validation */];
const schemaFixes = fixer.fixSchemaViolations(data, schemaErrors, schema);

// 3. Fix type mismatches (requires confirmation)
const typeFixes = fixer.fixTypeErrors(data, typeErrors);

// 4. Fix deprecated fields (v1 → v2 migration)
const deprecatedFixes = fixer.fixDeprecatedFields(data);

// Apply fixes
schemaFixes.forEach(fix => fix.applied = true);
const fixedData = fixer.applyFixes(data, schemaFixes);
```

### Command Line (Coming in v2.3.0)

```bash
# Interactive mode (asks for confirmation)
scholar validate --fix week-01.yml

# Auto mode (applies safe fixes only)
scholar validate --fix --auto week-01.yml

# Dry-run mode (preview changes)
scholar validate --fix --dry-run week-01.yml
```

---

## Fix Types in Detail

### QW1: Syntax Auto-fix (Priority 1)

### Safe fixes that auto-apply without confirmation

#### What It Fixes (Safe fixes that)

1. **Inconsistent Indentation** → Normalizes to 2 spaces
2. **Trailing Whitespace** → Removes from all lines
3. **Mixed Quotes** → Standardizes to double quotes
4. **Line Endings** → Normalizes to LF (`\n`)

#### Example

### Before (Fix Types in Detail)

```yaml
week: 1
content:
   topics:
      - "Statistics"
      - 'Probability'
   objectives:
    - "Learn basics"
```

### After

```yaml
week: 1
content:
  topics:
    - Statistics
    - Probability
  objectives:
    - Learn basics
```

#### API (After)

```javascript
const result = fixer.fixSyntaxErrors(yamlContent);

if (result.success) {
  console.log(result.fixed);        // Fixed YAML
  console.log(result.changes);      // ['Normalized indentation', ...]
} else {
  console.error(result.error);      // Error message
  console.log(result.hint);         // Helpful hint
}
```

#### Error Hints

The auto-fixer provides contextual hints for unfixable syntax errors:

- **Tab characters** → "Replace tabs with spaces"
- **Bad indentation** → "Check indentation - use 2 spaces consistently"
- **Unexpected tokens** → "Check for missing quotes around special characters"
- **Duplicate keys** → "Remove duplicate keys in YAML object"

---

### M1.1: Schema Violation Fixes (Priority 2)

### Detects missing fields, invalid values, and extra properties. Requires user confirmation

#### What It Fixes (Detects missing fields,)

1. **Missing Required Fields** → Proposes defaults from schema
2. **Invalid Enum Values** → Suggests valid alternatives
3. **Additional Properties** → Offers to remove disallowed fields

#### Example: Missing Required Field

### Before

```yaml
week: 1
content:
  topics:
    - "Statistics"
```

### Fix Proposal (Fix Types in Detail)

```
Add required field 'schema_version' with default value

Before: { week: 1, content: {...} }
After:  { week: 1, content: {...}, schema_version: "2.0" }

Apply this fix? (Y/n)
```

#### Example: Invalid Enum

### Before - Fix Types in

```yaml
style:
  teaching_approach: "invalid_value"
```

### Fix Proposal

```
Change 'invalid_value' to valid value 'interactive'

Before: teaching_approach: "invalid_value"
After:  teaching_approach: "interactive"

Apply this fix? (Y/n)
```

#### API (Fix Proposal)

```javascript
const schemaFixes = fixer.fixSchemaViolations(data, schemaErrors, schema);

schemaFixes.forEach(fix => {
  console.log(fix.description);  // Human-readable description
  console.log(fix.before);       // Preview of original
  console.log(fix.after);        // Preview of fix

  // User confirms
  fix.applied = getUserConfirmation(fix.description);
});

const fixedData = fixer.applyFixes(data, schemaFixes);
```

#### Default Values

The fixer uses smart defaults based on field names:

- `duration` → `30` (minutes)
- `enabled`, `required` → `false`
- `*_list`, `*_items` → `[]`
- `*_count`, `*_number` → `0`
- `*_name`, `*_title` → `""`
- `*_config`, `*_settings` → `{}`

Schema-defined defaults take precedence over these heuristics.

---

### M1.2: Type Conversion Fixes (Priority 3)

### Detects type mismatches and provides converters. Requires user confirmation

#### Supported Conversions

| From    | To      | Conversion Logic            | Example                 |
| ------- | ------- | --------------------------- | ----------------------- |
| string  | array   | Split by comma or wrap      | `"A, B"` → `["A", "B"]` |
| string  | number  | Parse with `Number()`       | `"42"` → `42`           |
| string  | boolean | Parse `"true"` or `"false"` | `"true"` → `true`       |
| number  | string  | Convert with `String()`     | `440` → `"440"`         |
| array   | string  | Join with `", "`            | `["A", "B"]` → `"A, B"` |
| boolean | string  | Convert to string           | `true` → `"true"`       |

#### Example: String to Array

### Before - Fix Types in 2

```yaml
content:
  topics: "Statistics, Probability, Inference"
```

### Fix Proposal - Fix Types in

```
Convert 'topics' from string to array

Before: topics: "Statistics, Probability, Inference"
After:  topics: ["Statistics", "Probability", "Inference"]

Apply this fix? (Y/n)
```

#### API

```javascript
const typeErrors = schemaErrors.filter(e => e.keyword === 'type');
const typeFixes = fixer.fixTypeErrors(data, typeErrors);

typeFixes.forEach(fix => {
  console.log(`Convert '${fix.description}'`);
  console.log(`  Before: ${fix.before}`);
  console.log(`  After:  ${fix.after}`);

  fix.applied = getUserConfirmation();
});

const fixedData = fixer.applyFixes(data, typeFixes);
```

---

### M1.3: Deprecated Field Migration (Priority 4)

### Detects v1 schema fields and proposes v2 migration. Requires user confirmation

#### Migration Rules (v1 → v2)

| v1 Field          | v2 Field                      | Migration Type |
| ----------------- | ----------------------------- | -------------- |
| `topics`          | `content.topics`              | Nested rename  |
| `objectives`      | `content.learning_objectives` | Nested rename  |
| `materials`       | `content.materials`           | Nested rename  |
| `week`            | `metadata.week`               | Nested rename  |
| `date`            | `metadata.date`               | Nested rename  |
| `teaching_style`  | `style.teaching_approach`     | Nested rename  |
| `assessment_type` | `style.assessment_approach`   | Nested rename  |

#### Example: v1 → v2 Migration

### Before (v1)

```yaml
week: 1
topics:
  - "Introduction to Statistics"
  - "Descriptive Statistics"

objectives:
  - "Understand mean and median"

materials: "Textbook Chapter 1"
```

### Fix Proposals

```
1. Migrate 'week' to 'metadata.week' (v2 schema)
   Before: week: 1
   After:  metadata.week: 1

2. Migrate 'topics' to 'content.topics' (v2 schema)
   Before: topics: [...]
   After:  content.topics: [...]

3. Migrate 'objectives' to 'content.learning_objectives' (v2 schema)
   Before: objectives: [...]
   After:  content.learning_objectives: [...]
```

### After (v2)

```yaml
metadata:
  week: 1

content:
  topics:
    - "Introduction to Statistics"
    - "Descriptive Statistics"

  learning_objectives:
    - "Understand mean and median"

  materials:
    - "Textbook Chapter 1"
```

#### API (After (v2))

```javascript
const deprecatedFixes = fixer.fixDeprecatedFields(data);

console.log(`Found ${deprecatedFixes.length} deprecated fields`);

deprecatedFixes.forEach(fix => {
  console.log(fix.description);
  console.log(`  Before: ${fix.before}`);
  console.log(`  After:  ${fix.after}`);

  fix.applied = getUserConfirmation();
});

const v2Data = fixer.applyFixes(data, deprecatedFixes);
```

### QW4: Math Blank-Line Auto-Fix (Priority 5)

### Safe fix that auto-applies on Quarto lecture output

Blank lines inside `$$...$$` display math blocks create paragraph breaks in LaTeX, exiting math mode and causing "Missing $ inserted" or "Undefined control sequence" errors. MathJax (HTML) tolerates them, so the problem only appears when rendering to PDF.

#### What It Fixes

1. **Blank lines inside `$$...$$` blocks** → Removes the blank lines silently

#### Example

### Before

```markdown
$$
\hat{\beta} = (X^T X)^{-1} X^T y

\text{where } X \text{ is the design matrix}
$$
```

### After

```markdown
$$
\hat{\beta} = (X^T X)^{-1} X^T y
\text{where } X \text{ is the design matrix}
$$
```

#### How It Works

- **Detection:** `checkMathBlankLines(text)` in `src/teaching/validators/latex.js` reports each blank line as a `LatexError` with position and context
- **Auto-fix:** `stripMathBlankLines(text)` removes blank lines inside `$$...$$` blocks
- **Integration:** `formatLectureNotesAsQuarto()` calls `stripMathBlankLines()` automatically on all output — no user action required

#### API

```javascript
import { stripMathBlankLines } from './validators/latex.js';

const cleaned = stripMathBlankLines(quartoContent);
// Blank lines inside $$...$$ blocks are removed
```

#### Scope

- Only targets multi-line `$$...$$` blocks (where `$$` appears on its own line)
- Does not modify `\[...\]` display math or inline `$...$` math
- Does not modify blank lines outside math blocks

---

## Complete Workflow

### Recommended Order

1. **Syntax fixes** (safe, auto-apply)
2. **Schema fixes** (confirm each)
3. **Type fixes** (confirm each)
4. **Deprecated fixes** (confirm each)

### All-in-One API

```javascript
const allFixes = fixer.getAllFixes(yamlContent, schemaErrors, schema);

// 1. Apply syntax fixes automatically
if (allFixes.syntax && allFixes.syntax.success) {
  console.log('✅ Syntax fixes applied:');
  allFixes.syntax.changes.forEach(c => console.log(`  - ${c}`));
}

// 2. Get all other fixes
const otherFixes = [
  ...allFixes.schema,
  ...allFixes.type,
  ...allFixes.deprecated
];

console.log(`\n⚠️  ${otherFixes.length} fixes require confirmation:`);

// 3. Confirm and apply
for (const fix of otherFixes) {
  console.log(`\n[${fix.type}] ${fix.description}`);
  console.log(`  Before: ${fix.before}`);
  console.log(`  After:  ${fix.after}`);

  const response = await askUser('Apply this fix? (Y/n)');
  fix.applied = response.toLowerCase() !== 'n';
}

// 4. Apply all confirmed fixes
const data = yaml.load(allFixes.syntax.fixed);
const fullyFixed = fixer.applyFixes(data, otherFixes);

// 5. Save to file
fs.writeFileSync('config.yml', yaml.dump(fullyFixed, { indent: 2 }));
```

---

## Configuration

### Auto-apply Safe Fixes

```javascript
const fixer = createAutoFixer({ autoApplySafe: true });

// Syntax fixes will auto-apply without returning the result
const fixes = fixer.getAllFixes(yamlContent, schemaErrors, schema);
```

---

## Testing

### Run Tests

```bash
# All auto-fixer tests (47 tests)
npm test -- tests/teaching/validators/auto-fixer.test.js

# With coverage
npm run test:coverage
```

### Test Fixtures

Located in `tests/teaching/validators/auto-fixer-fixtures/`:

- `syntax-errors.yml` - Indentation, quotes, whitespace issues
- `schema-violations.yml` - Missing fields, invalid enums
- `type-errors.yml` - String/number/array mismatches
- `deprecated-fields.yml` - v1 schema fields
- `valid-v2.yml` - Correct v2 schema (no fixes needed)

### Run Demo

```bash
node examples/auto-fixer-demo.js
```

---

## Error Handling

### Unfixable Errors

Some YAML errors cannot be automatically fixed:

```javascript
const result = fixer.fixSyntaxErrors(invalidYaml);

if (!result.success) {
  console.error(`Error: ${result.error}`);
  console.log(`Hint: ${result.hint}`);
  // Manual fix required
}
```

### Common Unfixable Cases

- **Duplicate keys** - Ambiguous which to keep
- **Invalid colon placement** - `message: Hello: World` (which is the value?)
- **Unmatched brackets** - `[1, 2, 3` (missing `]`)
- **Circular references** - YAML anchors with loops

---

## Migration Complexity

### Assess Migration Complexity

```javascript
import { getMigrationComplexity, getComplexityDescription } from '@data-wise/scholar/validators';

const v1Data = yaml.load(v1YamlContent);
const complexity = getMigrationComplexity(v1Data);

console.log(`Complexity: ${complexity}/10`);
console.log(`Description: ${getComplexityDescription(complexity)}`);

// Output:
// Complexity: 6/10
// Description: Medium (field renames + type conversions)
```

### Complexity Levels

- **0** - Trivial (no changes)
- **1-3** - Low (simple renames)
- **4-6** - Medium (renames + type conversions)
- **7-9** - High (structural changes)
- **10** - Very High (extensive restructuring)

---

## API Reference

### AutoFixer Class

```typescript
class AutoFixer {
  constructor(options?: {
    autoApplySafe?: boolean;  // Default: false
  });

  // QW1: Syntax fixes
  fixSyntaxErrors(yamlContent: string): {
    success: boolean;
    fixed?: string;
    changes?: string[];
    error?: string;
    hint?: string;
  };

  // M1.1: Schema violation fixes
  fixSchemaViolations(
    data: object,
    schemaErrors: AjvError[],
    schema: object
  ): Fix[];

  // M1.2: Type conversion fixes
  fixTypeErrors(
    data: object,
    schemaErrors: AjvError[]
  ): Fix[];

  // M1.3: Deprecated field fixes
  fixDeprecatedFields(data: object): Fix[];

  // Get all fixes at once
  getAllFixes(
    yamlContent: string,
    schemaErrors: AjvError[],
    schema: object
  ): {
    syntax: SyntaxResult | null;
    schema: Fix[];
    type: Fix[];
    deprecated: Fix[];
  };

  // Apply fixes to data
  applyFixes(data: object, fixes: Fix[]): object;
}
```

### Fix Object

```typescript
interface Fix {
  type: 'syntax' | 'schema' | 'type' | 'deprecated';
  description: string;
  safe: boolean;          // true = auto-apply, false = confirm
  before: string;         // Preview of original
  after: string;          // Preview of fix
  applied: boolean;       // Set to true to apply
  apply: (obj: object) => object;  // Apply function
}
```

---

## Best Practices

### 1. Always Fix Syntax First

```javascript
// ✅ Good: Fix syntax before other operations
const syntaxResult = fixer.fixSyntaxErrors(yamlContent);
if (syntaxResult.success) {
  const data = yaml.load(syntaxResult.fixed);
  // Now validate schema, types, etc.
}

// ❌ Bad: Skip syntax fixes
const data = yaml.load(yamlContent);  // May fail with syntax errors
```

### 2. Preview Before Applying

```javascript
// ✅ Good: Show preview and confirm
fixes.forEach(fix => {
  console.log(fix.description);
  console.log(`Before: ${fix.before}`);
  console.log(`After: ${fix.after}`);
  fix.applied = confirm();
});

// ❌ Bad: Auto-apply without preview
fixes.forEach(fix => fix.applied = true);
```

### 3. Handle Partial Success

```javascript
// ✅ Good: Track which fixes were applied
const appliedFixes = fixes.filter(f => f.applied);
const skippedFixes = fixes.filter(f => !f.applied);

console.log(`Applied ${appliedFixes.length}/${fixes.length} fixes`);
if (skippedFixes.length > 0) {
  console.log('Manual fixes required for:');
  skippedFixes.forEach(f => console.log(`  - ${f.description}`));
}
```

### 4. Use in CI/CD

```javascript
// For automated environments, use --auto flag
const fixer = createAutoFixer({ autoApplySafe: true });

const fixes = fixer.getAllFixes(yamlContent, schemaErrors, schema);

// Only apply safe fixes
const safeFixes = fixes.schema.filter(f => f.safe);
safeFixes.forEach(f => f.applied = true);

const result = fixer.applyFixes(data, safeFixes);

// Exit with error if manual fixes needed
const unsafeFixes = fixes.schema.filter(f => !f.safe);
if (unsafeFixes.length > 0) {
  console.error('Manual fixes required');
  process.exit(1);
}
```

---

## Troubleshooting

### Q: Why didn't syntax fixes apply?

**A:** The YAML has unfixable syntax errors. Check the error message and hint.

```javascript
const result = fixer.fixSyntaxErrors(yamlContent);
if (!result.success) {
  console.log(result.hint);  // Follow the hint
}
```

### Q: How do I skip a fix?

**A:** Set `applied: false` or don't include it in the fixes array.

```javascript
fixes.forEach(fix => {
  if (fix.description.includes('schema_version')) {
    fix.applied = false;  // Skip this fix
  } else {
    fix.applied = true;
  }
});
```

### Q: Can I undo applied fixes?

**A:** The fixer doesn't mutate the original data. Keep a copy:

```javascript
const originalData = JSON.parse(JSON.stringify(data));
const fixedData = fixer.applyFixes(data, fixes);

// Revert if needed
if (somethingWrong) {
  data = originalData;
}
```

### Q: Why are v2 fields flagged as deprecated?

**A:** The detection checks if fields are in the correct nested location. Fields like `topics` under `content` are correct in v2.

---

## Next Steps

- **Phase 2:** Dry-run mode integration
- **Phase 3:** Schema migration CLI command
- **Phase 4:** Interactive confirmation prompts in commands

---

## Related Documentation

- [Migration Rules](https://github.com/Data-Wise/scholar/blob/main/src/teaching/validators/migration-rules.js)
- [Test Suite](https://github.com/Data-Wise/scholar/blob/main/tests/teaching/validators/auto-fixer.test.js)
- [API Reference](https://github.com/Data-Wise/scholar/blob/main/src/teaching/validators/auto-fixer.js)

---

**Version:** v2.8.0
**Last Updated:** 2026-01-15
