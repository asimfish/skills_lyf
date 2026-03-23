# Test Strategy: Config-Flow Integration Features

**Date:** 2026-02-02
**Branch:** feature/config-flow-integration
**Baseline:** 1,793 tests, 100% pass rate
**Target:** ~190 new tests across 4 features

---

## Summary

| Feature | Test File(s) | Unit | Integration | Total |
|---------|-------------|------|-------------|-------|
| 1. Wire /teaching:demo to manifest | 2 files | 32 | 10 | **42** |
| 2. /teaching:migrate --to-manifest | 2 files | 38 | 14 | **52** |
| 3. Schema Export (npm + CLI) | 2 files | 28 | 8 | **36** |
| 4. Week-level Bidirectional Sync | 2 files | 42 | 16 | **58** |
| **TOTAL** | **8 files** | **140** | **48** | **~188** |

New fixture files: 8
Modified fixture files: 0 (existing fixtures remain untouched)

---

## 1. Test File Organization

### New Test Files

```
tests/teaching/
  commands/
    demo-manifest-wiring.test.js        # Feature 1: unit tests
    migrate-to-manifest.test.js         # Feature 2: unit tests
  schemas/
    schema-export.test.js               # Feature 3: unit tests
  config/
    week-sync.test.js                   # Feature 4: unit tests
  integration/
    demo-flow-setup.test.js             # Feature 1: integration
    migrate-to-manifest-e2e.test.js     # Feature 2: integration
    schema-export-cli.test.js           # Feature 3: integration
    week-sync-roundtrip.test.js         # Feature 4: integration
```

### New Fixture Files

```
tests/teaching/fixtures/
  teach-config-with-topics.yml          # Full teach-config with 10+ topics array
  teach-config-minimal.yml              # teach-config with only course_info, no topics
  teach-config-graduate.yml             # Graduate-level teach-config for level testing
  week-files/
    week01.yml                          # Standalone week file (pre-migration format)
    week02.yml                          # Standalone week file with missing fields
    week05.yml                          # Standalone week file with extra fields
    week-sparse.yml                     # Week file with only title and week number
  manifest-15-weeks.yml                 # Full 15-week manifest for sync testing
```

---

## 2. Feature 1: Wire /teaching:demo to Manifest

### What It Does

The demo command copies `lesson-plans.yml` from demo-templates into `.flow/` alongside `teach-config.yml`. For weeks not covered by the 3 demo weeks (weeks 4-15), it generates stub entries from the `topics` array in teach-config.

### Test File: `tests/teaching/commands/demo-manifest-wiring.test.js`

**32 unit tests across 5 describe blocks**

#### describe('demo manifest file placement')

```
it('should copy lesson-plans.yml into .flow/ directory')
it('should place lesson-plans.yml alongside teach-config.yml')
it('should create .flow/ directory if it does not exist')
it('should not overwrite existing lesson-plans.yml without --force flag')
it('should overwrite existing lesson-plans.yml when --force is true')
it('should preserve teach-config.yml when copying lesson-plans.yml')
```

#### describe('stub generation from teach-config topics')

```
it('should generate stub entries for weeks 4-15 from topics array')
it('should map topics array index to week number starting at 4')
it('should set status to draft for all generated stubs')
it('should include title from topic name in each stub')
it('should produce valid YAML that parses without errors')
it('should set week numbers sequentially from 4 to total_weeks minus milestones')
it('should handle teach-config with fewer than 12 topics gracefully')
it('should handle teach-config with more than 12 topics by capping at total_weeks')
it('should skip milestone weeks (midterm, break) when assigning topics')
```

#### describe('merged manifest structure')

```
it('should contain schema_version 1.0 in merged output')
it('should preserve all 3 demo weeks (1-3) with full detail')
it('should append stubs after the 3 demo weeks')
it('should produce a valid manifest that passes loadManifest validation')
it('should preserve semester metadata from demo template')
it('should preserve milestones array from demo template')
```

#### describe('error handling')

```
it('should return error when teach-config.yml is missing')
it('should return error when teach-config has no topics array')
it('should return error when demo template lesson-plans.yml is missing')
it('should handle teach-config with empty topics array')
it('should return descriptive error when .flow directory creation fails')
```

#### describe('edge cases')

```
it('should handle topics with special characters in names')
it('should handle topics array with null entries by skipping them')
it('should handle teach-config where total_weeks differs from topics count')
it('should not duplicate weeks already present in demo template')
it('should handle concurrent demo runs without corrupting manifest')
it('should produce deterministic output for same input')
```

### Test File: `tests/teaching/integration/demo-flow-setup.test.js`

**10 integration tests**

```
it('should create complete .flow directory with both teach-config.yml and lesson-plans.yml')
it('should produce a manifest loadable by loadManifest()')
it('should produce a manifest where listLessonPlans returns all weeks')
it('should produce stubs that loadLessonPlan can retrieve individually')
it('should work with the valid-config.yml fixture as teach-config input')
it('should work with the graduate-course.yml fixture as teach-config input')
it('should generate weeks that pass schema validation with validate=true')
it('should produce manifest where getSemesterInfo returns correct total_weeks')
it('should round-trip: demo -> loadManifest -> extractWeekFromManifest for each week')
it('should produce stubs where updateWeekStatus can transition stub to generated')
```

### Fixture Requirements

- **`teach-config-with-topics.yml`**: Full teach-config matching demo-templates format, 10 topics in `scholar.topics` array, complete `course_info`, `defaults`, `style`, `grading` sections.
- **`teach-config-minimal.yml`**: Only `scholar.course_info` with `code`, `title`, `level`. No `topics` array. Tests error path.
- **`teach-config-graduate.yml`**: Graduate-level with `difficulty: advanced`, different topic set. Tests level-specific behavior.

### Mock Strategy

| Dependency | Mock Approach |
|-----------|---------------|
| Filesystem (write) | Real temp dirs via `mkdtempSync`, cleanup in `afterEach` |
| Demo template files | Read from actual `src/teaching/demo-templates/` (template validation) |
| teach-config loader | Real loader against fixture files |

---

## 3. Feature 2: /teaching:migrate --to-manifest

### What It Does

Detects individual week YAML files scattered across directories, merges them into a single `lesson-plans.yml` manifest, fills missing fields with sensible defaults (emitting warnings), and optionally prompts about creating a git commit.

### Test File: `tests/teaching/commands/migrate-to-manifest.test.js`

**38 unit tests across 6 describe blocks**

#### describe('week file auto-detection')

```
it('should detect week files in content/lesson-plans/ directory')
it('should detect week files matching weekNN.yml pattern')
it('should detect week files matching week-NN.yml pattern')
it('should detect week files matching week_NN.yml pattern')
it('should detect week files in .flow/ directory')
it('should detect week files in .claude/ directory')
it('should sort detected files by week number ascending')
it('should ignore non-week YAML files (teach-config.yml, style.yml)')
it('should handle directories with no week files')
it('should handle mixed naming conventions in same directory')
```

#### describe('merge into single manifest')

```
it('should combine multiple week files into single weeks array')
it('should add schema_version 1.0 to merged manifest')
it('should generate semester metadata with total_weeks matching highest week number')
it('should preserve all fields from source week files')
it('should set schedule to default value when not specified')
it('should handle week files with overlapping week numbers by taking the first')
it('should handle gaps in week numbering (e.g., weeks 1,2,5 with no 3,4)')
```

#### describe('default filling and warnings')

```
it('should fill missing learning_objectives with empty array and emit warning')
it('should fill missing topics with empty array and emit warning')
it('should fill missing status with draft')
it('should fill missing title with placeholder and emit warning')
it('should not overwrite existing fields with defaults')
it('should collect all warnings into a warnings array')
it('should include week number in each warning message')
it('should handle week files with missing learning_objectives')
it('should handle week files with only title and week number')
```

#### describe('output writing')

```
it('should write merged manifest to .flow/lesson-plans.yml')
it('should create .flow/ directory if it does not exist')
it('should create backup of existing lesson-plans.yml before overwriting')
it('should produce valid YAML output parseable by js-yaml')
it('should preserve YAML comments in output where possible')
```

#### describe('git commit prompt')

```
it('should detect git repository in course root')
it('should not prompt for commit when --no-git flag is set')
it('should include migration summary in commit message')
it('should include file count in commit message')
```

#### describe('error handling and edge cases')

```
it('should handle malformed week files by skipping and warning')
it('should handle empty week files by skipping and warning')
it('should handle week files where week is a string instead of number')
it('should handle read-only .flow directory gracefully')
it('should handle week file with YAML parse error')
it('should return error when no week files found in any search directory')
it('should not modify source week files during migration')
```

### Test File: `tests/teaching/integration/migrate-to-manifest-e2e.test.js`

**14 integration tests**

```
it('should detect files, merge, and produce loadable manifest in single pipeline')
it('should produce manifest that passes schema validation')
it('should preserve all data from week01.yml fixture through round-trip')
it('should handle migration of 15 week files without data loss')
it('should produce manifest compatible with loadLessonPlan for each migrated week')
it('should produce manifest compatible with listLessonPlans')
it('should produce manifest where getSemesterInfo reflects correct week count')
it('should migrate sparse week files and fill defaults correctly')
it('should work with BatchMigrator patterns for auto-detection')
it('should not break existing manifest-loader functionality after migration')
it('should produce deterministic output across multiple runs')
it('should handle migration when teach-config.yml also exists in .flow/')
it('should preserve existing teach-config.yml in .flow/ during migration')
it('should create valid backup that can be restored')
```

### Fixture Requirements

- **`week-files/week01.yml`**: Complete week file with all fields (learning_objectives, topics, materials, activities, lecture_structure).
- **`week-files/week02.yml`**: Week file missing `learning_objectives` and `materials`. Tests default filling.
- **`week-files/week05.yml`**: Week file with extra non-standard fields (`custom_notes`, `instructor_comments`). Tests field preservation.
- **`week-files/week-sparse.yml`**: Only `week: 3` and `title: "Sparse Week"`. Tests minimal input.

### Mock Strategy

| Dependency | Mock Approach |
|-----------|---------------|
| Filesystem | Real temp dirs with fixture files copied in. Matches existing `batch-migrator.test.js` pattern. |
| Git operations | Mock `execFileNoThrow` for git commands. Return predefined status/commit results. |
| User prompt (commit) | Mock via options object: `{ gitCommit: false }` bypasses prompt entirely. For prompt testing, mock the prompt function. |
| glob patterns | Real glob against temp directories. No mock needed. |

---

## 4. Feature 3: Schema Export (npm + CLI)

### What It Does

Exposes the `lesson-plans-manifest` JSON Schema through two channels:
1. **npm import**: `import { lessonPlansManifestSchema } from '@data-wise/scholar'`
2. **CLI export**: `/teaching:validate --export-schema [--output path]` writes schema to stdout or file

### Test File: `tests/teaching/schemas/schema-export.test.js`

**28 unit tests across 5 describe blocks**

#### describe('npm export - lessonPlansManifestSchema')

```
it('should export lessonPlansManifestSchema as a function')
it('should return a valid JSON Schema object with $schema field')
it('should return schema with type: object')
it('should include required properties: schema_version, semester, weeks')
it('should define weeks as an array type')
it('should define week entry with required fields: week, title, status')
it('should return deep copy on each call (no cross-mutation)')
it('should match the schema loaded from lesson-plans-manifest.schema.json')
it('should be compilable by Ajv without errors')
it('should validate the valid-manifest.yml fixture successfully')
it('should reject the invalid-manifest.yml fixture')
it('should reject the malformed-manifest.yml fixture')
```

#### describe('npm export - getSchema integration')

```
it('should return manifest schema via getSchema("lesson-plans-manifest")')
it('should include lesson-plans-manifest in listSchemas() output')
it('should match getLessonPlansManifestSchema() output')
```

#### describe('CLI --export-schema to stdout')

```
it('should write valid JSON to stdout when no --output flag')
it('should produce output parseable by JSON.parse')
it('should include $schema field in output')
it('should include title field in output')
it('should produce identical schema to npm export')
```

#### describe('CLI --export-schema --output <path>')

```
it('should write schema to specified file path')
it('should create parent directories if they do not exist')
it('should overwrite existing file at output path')
it('should produce file with valid JSON content')
it('should produce file with same content as stdout export')
it('should return success result with file path')
```

#### describe('error handling')

```
it('should return error when output directory is read-only')
it('should handle schema loading failure gracefully')
it('should not export internal metadata fields (_hash, _path, _loadedAt)')
```

### Test File: `tests/teaching/integration/schema-export-cli.test.js`

**8 integration tests**

```
it('should export schema that validates demo-templates/lesson-plans.yml')
it('should export schema that validates valid-manifest.yml fixture')
it('should export schema that rejects manifest missing schema_version')
it('should export schema where Ajv validates all 3 demo weeks individually')
it('should produce schema file usable by external tools (ajv-cli pattern)')
it('should produce schema matching the on-disk lesson-plans-manifest.schema.json')
it('should not include any $ref references that require resolution')
it('should export schema that round-trips through JSON.stringify/parse')
```

### Fixture Requirements

No new fixtures needed. Uses existing:
- `valid-manifest.yml`
- `invalid-manifest.yml`
- `malformed-manifest.yml`
- `src/teaching/demo-templates/lesson-plans.yml`
- `src/teaching/schemas/v2/lesson-plans-manifest.schema.json`

### Mock Strategy

| Dependency | Mock Approach |
|-----------|---------------|
| Schema files | Read real schema files from `src/teaching/schemas/v2/` |
| stdout capture | Capture via jest spy on `process.stdout.write` or intercept return value |
| File output | Real temp dirs for `--output` path testing |
| Ajv | Real Ajv instances (no mock -- schema validation must be real) |

---

## 5. Feature 4: Week-level Bidirectional Sync

### What It Does

Provides atomic, week-level merge between the manifest and individual week operations. Uses SHA-256 hash detection to identify which weeks changed. Creates `.bak` backup files before writing.

### Test File: `tests/teaching/config/week-sync.test.js`

**42 unit tests across 7 describe blocks**

#### describe('SHA-256 hash detection')

```
it('should compute SHA-256 hash for a week entry')
it('should return consistent hash for identical week content')
it('should return different hash when week content changes')
it('should detect no changes when manifest is unmodified')
it('should detect change when single field is modified')
it('should detect change when learning_objectives array is modified')
it('should detect change when topic subtopics are reordered')
it('should ignore metadata fields (_hash, _path, _loadedAt) in hash computation')
it('should handle null/undefined week fields without crashing')
```

#### describe('week-level atomic merge')

```
it('should merge updated week back into manifest')
it('should preserve all other weeks when merging one week')
it('should preserve semester metadata during merge')
it('should preserve milestones during merge')
it('should update only the targeted week by week number')
it('should add new week if week number does not exist in manifest')
it('should maintain week ordering after merge (sorted by week number)')
it('should handle merging week with new fields not in original')
it('should handle merging week with removed fields')
it('should reject merge when manifest hash has changed since read (conflict)')
```

#### describe('backup-on-write with .bak files')

```
it('should create .bak file before writing manifest')
it('should create .bak file with original manifest content')
it('should overwrite previous .bak file on subsequent writes')
it('should skip .bak creation when backup option is false')
it('should create .bak with identical content to pre-write manifest')
it('should allow restore from .bak file after write')
```

#### describe('conflict detection')

```
it('should detect conflict when manifest changed between read and write')
it('should return conflict error with both expected and actual hash')
it('should not modify manifest when conflict is detected')
it('should not create .bak file when conflict is detected')
it('should allow forced write that ignores conflict via force option')
```

#### describe('status transitions')

```
it('should allow draft -> generated transition')
it('should allow generated -> reviewed transition')
it('should allow reviewed -> published transition')
it('should allow any status -> draft transition (reset)')
it('should reject invalid status values')
it('should update status and preserve all other week fields')
```

#### describe('roundtrip serialization')

```
it('should preserve YAML formatting through read-modify-write cycle')
it('should preserve Unicode content through roundtrip')
it('should preserve multiline strings in learning_objectives')
it('should not add extra whitespace on each write cycle')
```

#### describe('edge cases')

```
it('should handle manifest with single week')
it('should handle manifest with 52 weeks (maximum)')
it('should handle week entry with deeply nested objects')
it('should handle concurrent writes by detecting hash mismatch')
```

### Test File: `tests/teaching/integration/week-sync-roundtrip.test.js`

**16 integration tests**

```
it('should load manifest, modify week, write back, and reload successfully')
it('should update week 2 status and verify via loadManifest')
it('should update week content and verify via extractWeekFromManifest')
it('should merge new learning_objective into week and verify via loadLessonPlan')
it('should handle full lifecycle: create stub -> generate -> review -> publish')
it('should not corrupt other weeks during rapid sequential updates')
it('should create backup that exactly matches pre-update manifest')
it('should restore from backup after failed write')
it('should detect stale manifest after external modification')
it('should handle update to week that was just added as stub')
it('should produce valid manifest after 10 sequential week updates')
it('should work with valid-manifest.yml fixture through full sync cycle')
it('should work with minimal-manifest.yml fixture through full sync cycle')
it('should handle sync when manifest has both detailed and stub weeks')
it('should preserve demo template content through multiple sync cycles')
it('should not regress updateWeekStatus from manifest-loader.test.js scenarios')
```

### Fixture Requirements

- **`manifest-15-weeks.yml`**: Full 15-week manifest with weeks 1-3 detailed (matching `valid-manifest.yml` style), weeks 4-15 as stubs with only `week`, `title`, `status: draft`. Used for large-scale sync testing.

### Mock Strategy

| Dependency | Mock Approach |
|-----------|---------------|
| Filesystem | Real temp dirs. Copy fixtures into temp `.flow/` directories. Pattern matches existing `manifest-loader.test.js`. |
| crypto (SHA-256) | Real `createHash` -- hashing must be real for integrity tests. |
| Time/dates | No mock needed. `_loadedAt` metadata is not part of hash. |
| Concurrent access | Simulate by modifying manifest file between read and write operations in same test. |

---

## 6. Cross-Cutting Concerns

### Known Flaky Test

The existing `config-validator` test with `duration < 50ms` assertion is pre-existing and unrelated. If it surfaces during test runs, increase the threshold to 100ms or use `expect(duration).toBeLessThan(200)`. Do not let it block this feature's test suite.

### Test Runner Configuration

All tests use the existing Jest configuration:

```bash
NODE_OPTIONS='--experimental-vm-modules' npx jest
```

No changes to `jest.config` or `package.json` test scripts required.

### Temp Directory Cleanup Pattern

Follow the established pattern from `manifest-loader.test.js`:

```javascript
const tempDirs = [];

function makeCourse(fixture) {
  const dir = mkdtempSync(join(tmpdir(), 'scholar-test-'));
  tempDirs.push(dir);
  // setup...
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  tempDirs.length = 0;
});
```

### Import Convention

All test files use ESM imports matching the existing pattern:

```javascript
import { describe, it, expect, afterEach, beforeEach } from '@jest/globals';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import yaml from 'js-yaml';
```

### Assertion Patterns

Use these matchers consistently (matching existing test style):

| Pattern | Usage |
|---------|-------|
| `expect(x).toBe(y)` | Primitives, exact equality |
| `expect(x).toHaveLength(n)` | Arrays |
| `expect(x).toBeDefined()` | Non-null checks |
| `expect(x).toBeNull()` | Explicit null |
| `expect(x).toMatch(/regex/)` | String patterns, error messages |
| `expect(x).toHaveProperty('key')` | Object shape validation |
| `expect(x).toContain(item)` | Array membership |
| `expect(() => fn()).toThrow(/msg/)` | Error throwing |

---

## 7. Critical Path Tests

These are the tests that **must pass** before any feature can be considered complete. If time is constrained, implement these first.

### Feature 1 Critical (8 tests)

1. `it('should copy lesson-plans.yml into .flow/ directory')`
2. `it('should generate stub entries for weeks 4-15 from topics array')`
3. `it('should set status to draft for all generated stubs')`
4. `it('should produce a valid manifest that passes loadManifest validation')`
5. `it('should preserve all 3 demo weeks (1-3) with full detail')`
6. `it('should return error when teach-config.yml is missing')`
7. `it('should create complete .flow directory with both teach-config.yml and lesson-plans.yml')`
8. `it('should produce a manifest loadable by loadManifest()')`

### Feature 2 Critical (9 tests)

1. `it('should detect week files in content/lesson-plans/ directory')`
2. `it('should combine multiple week files into single weeks array')`
3. `it('should add schema_version 1.0 to merged manifest')`
4. `it('should fill missing status with draft')`
5. `it('should write merged manifest to .flow/lesson-plans.yml')`
6. `it('should handle malformed week files by skipping and warning')`
7. `it('should return error when no week files found in any search directory')`
8. `it('should detect files, merge, and produce loadable manifest in single pipeline')`
9. `it('should not modify source week files during migration')`

### Feature 3 Critical (7 tests)

1. `it('should export lessonPlansManifestSchema as a function')`
2. `it('should return a valid JSON Schema object with $schema field')`
3. `it('should be compilable by Ajv without errors')`
4. `it('should validate the valid-manifest.yml fixture successfully')`
5. `it('should return manifest schema via getSchema("lesson-plans-manifest")')`
6. `it('should write valid JSON to stdout when no --output flag')`
7. `it('should write schema to specified file path')`

### Feature 4 Critical (10 tests)

1. `it('should compute SHA-256 hash for a week entry')`
2. `it('should detect change when single field is modified')`
3. `it('should merge updated week back into manifest')`
4. `it('should preserve all other weeks when merging one week')`
5. `it('should create .bak file before writing manifest')`
6. `it('should detect conflict when manifest changed between read and write')`
7. `it('should not modify manifest when conflict is detected')`
8. `it('should allow draft -> generated transition')`
9. `it('should load manifest, modify week, write back, and reload successfully')`
10. `it('should not corrupt other weeks during rapid sequential updates')`

**Total critical path: 34 tests** (implement these first, then fill in remaining)

---

## 8. Edge Cases That Could Cause Regressions

### Cross-Feature Regressions

| Scenario | Risk | Test Coverage |
|----------|------|---------------|
| Demo generates manifest, then migrate tries to re-migrate it | Migrate should detect existing manifest and warn, not re-merge demo weeks | Feature 2 integration |
| Schema export after schema file is deleted from disk | `resetCache()` + missing file should throw clear error | Feature 3 error handling |
| Week sync writes manifest, but demo-generated stubs lack all required fields | Week sync must handle partial week entries (stubs) gracefully | Feature 4 edge cases |
| Updating a stub week (no learning_objectives) via sync then validating | Validation should pass in lenient mode, warn in strict | Feature 4 status transitions |

### Filesystem Edge Cases

| Scenario | Tests |
|----------|-------|
| `.flow/` directory exists but is read-only | Features 1, 2, 4 error handling |
| `lesson-plans.yml` exists but is 0 bytes | Features 2, 4 edge cases |
| `lesson-plans.yml` contains only YAML comments | Features 2, 4 edge cases |
| Very large manifest (52 weeks, all detailed) | Feature 4 performance |
| `.bak` file exists but is read-only | Feature 4 backup tests |
| Symlinked `.flow/` directory | All features filesystem tests |

### YAML Edge Cases

| Scenario | Tests |
|----------|-------|
| Week title contains colons (`"ANOVA: One-Way"`) | Features 1, 2 roundtrip |
| Learning objectives contain LaTeX (`$\beta_1$`) | Feature 4 roundtrip serialization |
| Topics contain Unicode (accented characters, CJK) | Feature 4 roundtrip serialization |
| Multiline descriptions using YAML `\|` syntax | Feature 4 roundtrip serialization |
| YAML anchors/aliases in manifest | Feature 4 merge (aliases resolve before merge) |
| Trailing whitespace differences affecting hash | Feature 4 hash detection |

### Concurrency/Timing Edge Cases

| Scenario | Tests |
|----------|-------|
| Manifest modified between read and write | Feature 4 conflict detection |
| Two week updates in rapid succession | Feature 4 integration: sequential updates |
| Backup file creation fails mid-write | Feature 4 error handling |
| Hash mismatch due to whitespace-only change | Feature 4 hash detection |

---

## 9. Implementation Order

Recommended implementation sequence based on dependency graph:

1. **Feature 3 (Schema Export)** -- No dependencies on other features. Validates that the schema infrastructure works before other features use it. Fastest to implement (~36 tests).

2. **Feature 1 (Demo Wiring)** -- Depends on working manifest-loader (already tested). Produces the manifests that Feature 4 will sync. (~42 tests).

3. **Feature 4 (Week Sync)** -- Depends on manifest-loader and schema validation. Core engine that Feature 2 may use for writing. (~58 tests).

4. **Feature 2 (Migrate)** -- Depends on all other features being stable. Uses detection patterns, writes manifests, and validates output. Most complex integration surface. (~52 tests).

### Parallelization

Features 1 and 3 can be developed in parallel since they have no shared dependencies. Features 2 and 4 should be sequential.

---

## 10. Fixture File Specifications

### `teach-config-with-topics.yml`

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: undergraduate
    field: statistics
    difficulty: intermediate
    semester: "Spring 2026"
    instructor:
      name: "Dr. Test Instructor"
  defaults:
    exam_format: markdown
    lecture_format: quarto
  style:
    tone: formal
    notation: statistical
  topics:
    - "Simple Linear Regression"
    - "Multiple Regression"
    - "Model Diagnostics"
    - "Variable Selection"
    - "Polynomial Regression"
    - "Interaction Effects"
    - "Logistic Regression"
    - "Model Comparison"
    - "Prediction and Inference"
    - "Time Series Introduction"
    - "Mixed Effects Models"
    - "Review and Applications"
  grading:
    homework: 25
    midterm: 25
    final: 35
    participation: 15
```

### `teach-config-minimal.yml`

```yaml
scholar:
  course_info:
    code: "STAT-100"
    title: "Intro Stats"
    level: undergraduate
```

### `teach-config-graduate.yml`

```yaml
scholar:
  course_info:
    code: "STAT-579"
    title: "Causal Inference"
    level: graduate
    field: statistics
    difficulty: advanced
  topics:
    - "Potential Outcomes Framework"
    - "Randomized Experiments"
    - "Propensity Score Methods"
    - "Instrumental Variables"
    - "Regression Discontinuity"
    - "Difference-in-Differences"
    - "Sensitivity Analysis"
    - "Mediation Analysis"
```

### `week-files/week01.yml`

```yaml
week: 1
title: "Introduction to Regression"
status: published
learning_objectives:
  - id: LO-1.1
    level: understand
    description: "Understand the concept of simple linear regression"
topics:
  - id: T-1.1
    name: "Simple Linear Regression"
    subtopics:
      - "Least squares estimation"
      - "Residuals and fitted values"
materials:
  readings:
    - type: textbook
      title: "Applied Linear Regression"
      chapter: "Ch. 1"
activities:
  - id: A-1.1
    type: in-class-practice
    title: "Fit a simple regression model"
    duration_minutes: 25
lecture_structure:
  - segment: introduction
    duration_minutes: 30
  - segment: practice
    duration_minutes: 25
```

### `week-files/week02.yml`

```yaml
week: 2
title: "Multiple Regression"
status: draft
topics:
  - id: T-2.1
    name: "Multiple Regression"
```

### `week-files/week05.yml`

```yaml
week: 5
title: "Polynomial Regression"
status: draft
learning_objectives:
  - id: LO-5.1
    level: apply
    description: "Fit and interpret polynomial regression models"
topics:
  - id: T-5.1
    name: "Polynomial Regression"
custom_notes: "Instructor prefers to use R for all demonstrations"
instructor_comments: "Students found this topic challenging last year"
```

### `week-files/week-sparse.yml`

```yaml
week: 3
title: "Sparse Week"
```

### `manifest-15-weeks.yml`

Full 15-week manifest with weeks 1-3 matching `valid-manifest.yml` content and weeks 4-15 as stubs:

```yaml
schema_version: "1.0"
semester:
  total_weeks: 15
  schedule: "TR"
  milestones:
    - week: 8
      type: midterm
      label: "Midterm Exam"
    - week: 10
      type: break
      label: "Spring Break"
    - week: 16
      type: final
      label: "Final Exam"
weeks:
  # Weeks 1-3: detailed (copy from valid-manifest.yml)
  # Weeks 4-15: stubs
  - week: 4
    title: "Variable Selection"
    status: draft
  - week: 5
    title: "Polynomial Regression"
    status: draft
  # ... through week 15
```
