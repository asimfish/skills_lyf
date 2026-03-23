# Scholar Plugin Phase 2: Config & Flow-CLI Integration - API Reference

> **Version:** {{ scholar.version }}
> **Last Updated:** 2026-02-02
> **Audience:** Plugin developers and contributors

This document provides comprehensive API reference for the Config & Flow-CLI Integration phase (Phase 2) of the Scholar plugin. It covers 10 core modules organized into 3 architectural layers: shared utilities, manifest operations, and orchestration.

---

## Table of Contents

- [Overview](#overview)
- [Layer 1: Shared Utilities](#layer-1-shared-utilities)
  - [SHA-256 Hash Utility](#sha-256-hash-utility)
  - [Safe YAML Writer](#safe-yaml-writer)
  - [Week File Discovery](#week-file-discovery)
- [Layer 2: Manifest Operations](#layer-2-manifest-operations)
  - [Manifest Validator](#manifest-validator)
  - [Manifest Generator](#manifest-generator)
  - [Manifest Loader](#manifest-loader)
  - [Schema Index](#schema-index)
- [Layer 3: Orchestration](#layer-3-orchestration)
  - [Manifest Migrator](#manifest-migrator)
  - [Manifest Sync Engine](#manifest-sync-engine)
  - [Demo Course Scaffolder](#demo-course-scaffolder)
- [Error Handling Pattern](#error-handling-pattern)
- [Week Status Lifecycle](#week-status-lifecycle)
- [Dependencies Graph](#dependencies-graph)
- [Quick Reference](#quick-reference)

---

## Overview

Phase 2 introduces bidirectional manifest synchronization between Scholar and flow-cli, enabling:

1. **Lesson Plan Manifests** - Single `.flow/lesson-plans.yml` file managing all weekly topics, status, and metadata
2. **Configuration Discovery** - Automatic `.flow/teach-config.yml` loading with fallback chains
3. **Migration Support** - Converting legacy directory-based week files to unified manifest format
4. **Atomic Operations** - Safe file writing with backup and atomic semantics
5. **Three-Way Merge** - Conflict resolution when both Scholar and flow-cli modify manifests

### Key Concepts

| Term | Definition |
|------|-----------|
| **Manifest** | `.flow/lesson-plans.yml` — single source of truth for all weeks in a course |
| **Week File** | Individual `.yml` file (e.g., `week03.yml`) located in multiple known directories |
| **Week Status** | Lifecycle state: `draft` → `generated` → `reviewed` → `published` |
| **Sync Pair** | Two manifests being compared (Scholar's and flow-cli's versions) |
| **Base Hash** | SHA-256 hash of last mutual state, stored for three-way merge conflict detection |

---

## Layer 1: Shared Utilities

### SHA-256 Hash Utility

**Location:** `src/teaching/utils/hash.js`

Simple cryptographic hashing extracted for reuse across manifest generation, migration, and sync features.

#### `sha256(content: string): string`

Compute SHA-256 hex digest of a string.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `content` | string | Yes | Raw string content to hash |

**Returns:** `string` — SHA-256 hex digest (64 characters)

**Example:**

```javascript
import { sha256 } from './teaching/utils/hash.js';

const hash = sha256('hello world');
// => 'b94d27b9934d3e0893a6d0e80c7d4e8c1837c58ba7e6b0c83'

// Used for change detection
const manifestContent = readFileSync('.flow/lesson-plans.yml', 'utf8');
const contentHash = sha256(manifestContent);
```

**See Also:**
- `ManifestSyncEngine.loadSyncPair()` — Uses hash to detect identical manifests
- `ManifestLoader.loadManifest()` — Returns hash for change detection

---

### Safe YAML Writer

**Location:** `src/teaching/utils/safe-write.js`

Provides atomic-ish YAML write operations with automatic `.bak` backup creation and optional transactional semantics via temporary file + rename.

#### `safeWriteYaml(targetPath: string, data: Object|string, options?: Object): { success: boolean, backupPath: string|null, error?: string }`

Safely write data as YAML to a file path.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `targetPath` | string | Yes | - | Full path to write the YAML file |
| `data` | Object \| string | Yes | - | Object to serialize as YAML, or raw YAML string |
| `options.backup` | boolean | No | `true` | Create `.bak` backup before overwriting |
| `options.atomic` | boolean | No | `false` | Write to `.tmp` then rename (atomic) |
| `options.yamlOptions` | Object | No | `{}` | Options passed to js-yaml `dump()` |

**Returns:**

```javascript
{
  success: boolean,           // Write succeeded
  backupPath: string | null,  // Path to .bak file if created, null otherwise
  error?: string              // Error message if success === false
}
```

**Default YAML Options:**

```javascript
{
  lineWidth: 120,
  noRefs: true,
  quotingType: '"',
  forceQuotes: false
}
```

**Examples:**

```javascript
import { safeWriteYaml } from './teaching/utils/safe-write.js';

// Basic write with backup
const result = safeWriteYaml('/path/to/.flow/lesson-plans.yml', manifestData);
if (result.success) {
  console.log(`Backed up to: ${result.backupPath}`);
}

// Atomic write (via .tmp + rename)
const result = safeWriteYaml('/path/to/manifest.yml', manifestData, {
  backup: true,
  atomic: true,
  yamlOptions: { lineWidth: 80 }
});

// Write raw YAML string
const yamlString = 'weeks:\n  - week: 1\n    title: "Introduction"';
safeWriteYaml('/path/to/manifest.yml', yamlString, { backup: false });
```

**Behavior:**

- Creates parent directories if they don't exist
- If `backup: true` and target file exists, copies it to `targetPath.bak`
- If `atomic: true`, writes to `.tmp` file first, then renames (prevents partial writes)
- If `data` is string, uses it directly; if object, serializes via js-yaml
- Returns error in `{ success: false, error: '...' }` format

**See Also:**
- `ManifestMigrator.migrate()` — Uses safeWriteYaml to write merged manifest
- `ManifestSyncEngine.writeMergedManifest()` — Uses safeWriteYaml with atomic option

---

### Week File Discovery

**Location:** `src/teaching/utils/discovery.js`

Centralizes knowledge of where week-level lesson plan files can be found across different project layouts.

#### `WEEK_FILE_LOCATIONS: string[]`

Known directory locations where week files may reside, searched in order of preference.

```javascript
export const WEEK_FILE_LOCATIONS = [
  'content/lesson-plans',
  'lesson-plans',
  'content/plans',
  'plans',
  '.flow/weeks'
];
```

**Usage:**

```javascript
import { WEEK_FILE_LOCATIONS } from './teaching/utils/discovery.js';

// Check which known directories exist
for (const dir of WEEK_FILE_LOCATIONS) {
  if (existsSync(join(courseRoot, dir))) {
    console.log(`Found week files in: ${dir}`);
  }
}
```

#### `parseWeekNumber(filename: string): number|null`

Parse week number from a filename.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `filename` | string | Yes | Filename to parse (e.g., `week03.yml`, `week-01.yaml`) |

**Returns:** `number|null` — Week number or null if filename doesn't match pattern

**Pattern:** `week[-_]?0*(\d+)\.(yml|yaml)` (case-insensitive)

**Examples:**

```javascript
import { parseWeekNumber } from './teaching/utils/discovery.js';

parseWeekNumber('week01.yml');        // => 1
parseWeekNumber('week-03.yaml');      // => 3
parseWeekNumber('week_10.yml');       // => 10
parseWeekNumber('Week003.YML');       // => 3
parseWeekNumber('lesson01.yml');      // => null (doesn't match pattern)
parseWeekNumber('week.yml');          // => null (no number)
```

#### `findAllWeekFiles(courseRoot: string): Array<{ path: string, relativePath: string, weekNumber: number, source: string, filename: string }>`

Find all week files across all known locations in a course root.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |

**Returns:** Array sorted by `weekNumber` ascending

```javascript
{
  path: string,           // Full absolute path to file
  relativePath: string,   // Path relative to courseRoot
  weekNumber: number,     // Parsed week number (1-based)
  source: string,         // Which WEEK_FILE_LOCATIONS directory it came from
  filename: string        // Filename only
}
```

**Example:**

```javascript
import { findAllWeekFiles } from './teaching/utils/discovery.js';

const files = findAllWeekFiles('/Users/dt/teaching/stat-440');
// => [
//   {
//     path: '/Users/dt/teaching/stat-440/content/lesson-plans/week01.yml',
//     relativePath: 'content/lesson-plans/week01.yml',
//     weekNumber: 1,
//     source: 'content/lesson-plans',
//     filename: 'week01.yml'
//   },
//   {
//     path: '/Users/dt/teaching/stat-440/content/lesson-plans/week02.yml',
//     relativePath: 'content/lesson-plans/week02.yml',
//     weekNumber: 2,
//     source: 'content/lesson-plans',
//     filename: 'week02.yml'
//   },
//   // ... more weeks sorted by number
// ]
```

#### `findExistingWeekDirs(courseRoot: string): string[]`

Find which known directories exist in a course root.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |

**Returns:** Array of existing directory paths (relative to courseRoot)

**Example:**

```javascript
import { findExistingWeekDirs } from './teaching/utils/discovery.js';

const existingDirs = findExistingWeekDirs('/Users/dt/teaching/stat-440');
// => ['content/lesson-plans', 'content/plans']
```

---

## Layer 2: Manifest Operations

### Manifest Validator

**Location:** `src/teaching/utils/manifest-validator.js`

Validates manifest objects against the `lesson-plans-manifest` JSON Schema using AJV.

#### `validateManifest(manifest: Object): { valid: boolean, errors: string[] }`

Validate a manifest object against the lesson-plans-manifest schema.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `manifest` | Object | Yes | Parsed manifest data to validate |

**Returns:**

```javascript
{
  valid: boolean,     // true if valid, false otherwise
  errors: string[]    // Array of validation error messages (empty if valid)
}
```

**Example:**

```javascript
import { validateManifest } from './teaching/utils/manifest-validator.js';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';

const content = readFileSync('.flow/lesson-plans.yml', 'utf8');
const manifest = yaml.load(content);

const { valid, errors } = validateManifest(manifest);
if (!valid) {
  console.error('Manifest validation errors:');
  errors.forEach(err => console.error(`  - ${err}`));
}
```

#### `createManifestValidator(): Function|null`

Create a reusable compiled validator function.

**Returns:** Compiled AJV validate function, or `null` if schema unavailable

**Useful when validating multiple manifests in sequence (avoid recompiling schema).**

**Example:**

```javascript
import { createManifestValidator } from './teaching/utils/manifest-validator.js';

const validate = createManifestValidator();
if (!validate) {
  throw new Error('Could not load manifest schema');
}

const results = [];
for (const manifestPath of manifestPaths) {
  const manifest = yaml.load(readFileSync(manifestPath, 'utf8'));
  const valid = validate(manifest);
  results.push({ manifestPath, valid });
}
```

**See Also:**
- `ManifestMigrator.migrate()` — Validates merged manifest
- `ManifestSyncEngine.mergeManifests()` — Validates merged result

---

### Manifest Generator

**Location:** `src/teaching/utils/manifest-generator.js`

Generates a complete `lesson-plans.yml` manifest from teach-config topics, including draft stubs for unmapped weeks.

#### `generateDraftStub(weekNumber: number, topicTitle: string): { week: number, title: string, status: string }`

Generate a single draft stub entry for a topic.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `weekNumber` | number | Yes | Week number (1-based) |
| `topicTitle` | string | Yes | Display title for the topic |

**Returns:**

```javascript
{
  week: number,         // Week number
  title: string,        // Topic title
  status: 'draft'       // Always 'draft' for generated stubs
}
```

**Example:**

```javascript
import { generateDraftStub } from './teaching/utils/manifest-generator.js';

const stub = generateDraftStub(4, 'Sampling Distributions');
// => { week: 4, title: 'Sampling Distributions', status: 'draft' }
```

#### `mapTopicsToWeeks(topics: string[], startWeek?: number, milestones?: Array): Array<{ week: number, title: string }>`

Map teach-config topics to week numbers, skipping milestone weeks.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `topics` | string[] | Yes | - | Array of topic title strings |
| `startWeek` | number | No | `4` | First week number to assign |
| `milestones` | Array | No | DEFAULT_MILESTONES | Milestone entries with `{ week, type, label }` |

**Default Milestones:**

```javascript
[
  { week: 8, type: 'midterm', label: 'Midterm Exam' },
  { week: 10, type: 'break', label: 'Spring Break' },
  { week: 16, type: 'final', label: 'Final Exam' }
]
```

**Returns:** Array of `{ week, title }` sorted by week number

**Example:**

```javascript
import { mapTopicsToWeeks } from './teaching/utils/manifest-generator.js';

const topics = ['Hypothesis Testing', 'ANOVA', 'Regression'];
const mapped = mapTopicsToWeeks(topics, 4, [
  { week: 5, type: 'break', label: 'Spring Break' },
  { week: 8, type: 'midterm', label: 'Midterm' }
]);

// => [
//   { week: 4, title: 'Hypothesis Testing' },
//   { week: 6, title: 'ANOVA' },
//   { week: 7, title: 'Regression' }
// ]
```

#### `generateManifestFromConfig(options: Object): { manifest: Object, yaml: string }`

Generate a full `lesson-plans.yml` manifest from teach-config topics.

Merges existing detailed weeks (e.g., weeks 1-3 from the demo template) with generated draft stubs for remaining topics.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `options.teachConfig` | Object | Yes | - | Parsed teach-config.yml `scholar.*` section |
| `options.totalWeeks` | number | No | `15` | Total semester weeks |
| `options.schedule` | string | No | `'TR'` | Schedule pattern (e.g., `'TR'`, `'MWF'`) |
| `options.milestones` | Array | No | DEFAULT_MILESTONES | Milestone entries |
| `options.existingWeeks` | Array | No | `[]` | Pre-populated week entries (e.g., weeks 1-3 from demo) |

**Returns:**

```javascript
{
  manifest: Object,   // Complete manifest object
  yaml: string        // YAML string ready to write to file
}
```

**Example:**

```javascript
import { generateManifestFromConfig } from './teaching/utils/manifest-generator.js';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';

const configContent = readFileSync('.flow/teach-config.yml', 'utf8');
const config = yaml.load(configContent);

const { manifest, yaml: manifestYaml } = generateManifestFromConfig({
  teachConfig: config.scholar,
  totalWeeks: 15,
  schedule: 'TR',
  existingWeeks: [
    { week: 1, title: 'Introduction', status: 'published' },
    { week: 2, title: 'Foundations', status: 'published' },
    { week: 3, title: 'Fundamentals', status: 'published' }
  ]
});

console.log(`Generated manifest with ${manifest.weeks.length} weeks`);
console.log(manifestYaml);
```

**See Also:**
- `scaffoldFlowDirectory()` — Uses this to generate manifest during demo setup

---

### Manifest Loader

**Location:** `src/teaching/utils/manifest-loader.js`

Loads, validates, and manages the `.flow/lesson-plans.yml` manifest file. Provides semester-level view of all weekly topics, schedule metadata, and milestone markers.

#### `findManifest(courseRoot: string): string|null`

Find the `.flow/lesson-plans.yml` manifest in a course root.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |

**Returns:** Full path to manifest file, or `null` if not found

**Example:**

```javascript
import { findManifest } from './teaching/utils/manifest-loader.js';

const manifestPath = findManifest('/Users/dt/teaching/stat-440');
// => '/Users/dt/teaching/stat-440/.flow/lesson-plans.yml' or null
```

#### `loadManifest(courseRoot: string, options?: { validate?: boolean }): Object`

Load and optionally validate the lesson plans manifest.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `courseRoot` | string | Yes | - | Course root directory |
| `options.validate` | boolean | No | `true` | Whether to validate against JSON Schema |

**Returns:**

```javascript
{
  manifest: Object | null,      // Parsed manifest data (with internal _fields)
  path: string | null,          // Path to manifest file
  errors: string[],             // Array of error messages
  warnings: string[],           // Array of warning messages
  hash: string | null           // SHA-256 hash of file content
}
```

**Internal Fields (on manifest):**

```javascript
{
  _hash: string,           // SHA-256 of file content
  _path: string,           // Full path to .yml file
  _loadedAt: ISO8601       // Timestamp when loaded
}
```

**Example:**

```javascript
import { loadManifest } from './teaching/utils/manifest-loader.js';

const { manifest, errors, warnings, hash } = loadManifest('/Users/dt/teaching/stat-440');

if (manifest) {
  console.log(`Loaded ${manifest.weeks.length} weeks`);
  console.log(`Content hash: ${hash}`);
  manifest.weeks.forEach(w => console.log(`  Week ${w.week}: ${w.title}`));
}

if (errors.length > 0) {
  console.error('Load errors:', errors);
}

if (warnings.length > 0) {
  console.warn('Warnings:', warnings);
}
```

#### `getManifestHash(courseRoot: string): string|null`

Quick hash for change detection (without full load/parse).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |

**Returns:** SHA-256 hash of manifest content, or `null` if not found

**Example:**

```javascript
import { getManifestHash } from './teaching/utils/manifest-loader.js';

const hash1 = getManifestHash(courseRoot);
// ... some time passes ...
const hash2 = getManifestHash(courseRoot);

if (hash1 !== hash2) {
  console.log('Manifest has changed!');
}
```

#### `updateWeekStatus(courseRoot: string, weekId: number|string, newStatus: string, options?: Object): Object`

Update week status (draft → generated → reviewed → published).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |
| `weekId` | number \| string | Yes | Week number to update |
| `newStatus` | string | Yes | New status: `'draft'`, `'generated'`, `'reviewed'`, `'published'` |
| `options` | Object | No | Write options (backup, atomic) |

**Returns:**

```javascript
{
  success: boolean,
  previousStatus: string | null,
  newStatus: string,
  backupPath: string | null,
  error?: string
}
```

**Example:**

```javascript
import { updateWeekStatus } from './teaching/utils/manifest-loader.js';

const result = updateWeekStatus(courseRoot, 3, 'generated');
if (result.success) {
  console.log(`Week 3: ${result.previousStatus} → ${result.newStatus}`);
  console.log(`Backed up to: ${result.backupPath}`);
}
```

#### `getSemesterInfo(courseRoot: string): Object|null`

Lightweight semester metadata read (without loading full manifest).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |

**Returns:**

```javascript
{
  total_weeks: number,
  schedule: string,
  milestones: Array,
  weekCount: number
} | null
```

**Example:**

```javascript
import { getSemesterInfo } from './teaching/utils/manifest-loader.js';

const info = getSemesterInfo(courseRoot);
if (info) {
  console.log(`Semester: ${info.total_weeks} weeks, Schedule: ${info.schedule}`);
  console.log(`Weeks in manifest: ${info.weekCount}`);
}
```

#### `extractWeekFromManifest(manifest: Object, weekId: number|string): Object|null`

Extract single week from loaded manifest.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `manifest` | Object | Yes | Manifest object (from `loadManifest()`) |
| `weekId` | number \| string | Yes | Week number to extract |

**Returns:** Week object, or `null` if not found

**Example:**

```javascript
import { loadManifest, extractWeekFromManifest } from './teaching/utils/manifest-loader.js';

const { manifest } = loadManifest(courseRoot);
const week3 = extractWeekFromManifest(manifest, 3);
if (week3) {
  console.log(`Week 3: ${week3.title} (${week3.status})`);
}
```

**See Also:**
- `ManifestMigrator.migrate()` — Writes merged manifest via safeWriteYaml
- `ManifestSyncEngine.computeWeekDiff()` — Compares loaded manifests

---

### Schema Index

**Location:** `src/teaching/schemas/v2/index.js`

Exports all v2 JSON schemas with lazy-loading and deep-cloning to prevent mutation.

#### `getLessonPlanSchema(): Object`

Get Lesson Plan Schema (IEEE LOM compliant).

**Returns:** Deep copy of lesson plan JSON schema

**Example:**

```javascript
import { getLessonPlanSchema } from './teaching/schemas/v2/index.js';
import Ajv from 'ajv';

const schema = getLessonPlanSchema();
const ajv = new Ajv();
const validate = ajv.compile(schema);

const lessonPlan = {
  week: 3,
  title: 'Linear Regression',
  learning_objectives: ['Understand regression model']
  // ...
};

if (validate(lessonPlan)) {
  console.log('Lesson plan is valid');
} else {
  console.error('Validation errors:', validate.errors);
}
```

#### `getTeachingStyleSchema(): Object`

Get Teaching Style Schema.

**Returns:** Deep copy of teaching style JSON schema

#### `getLessonPlansManifestSchema(): Object`

Get Lesson Plans Manifest Schema.

Validates `.flow/lesson-plans.yml` manifest files.

**Returns:** Deep copy of lesson plans manifest JSON schema

#### `getSchema(name: string): Object`

Get schema by name.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `name` | string | Yes | Schema name: `'lesson-plan'`, `'teaching-style'`, or `'lesson-plans-manifest'` |

**Returns:** JSON Schema object

**Throws:** Error if schema name is unknown

**Example:**

```javascript
import { getSchema, listSchemas } from './teaching/schemas/v2/index.js';

const availableSchemas = listSchemas();
console.log('Available schemas:', availableSchemas);

const manifestSchema = getSchema('lesson-plans-manifest');
```

#### `listSchemas(): string[]`

List available schema names.

**Returns:** Array of schema names: `['lesson-plan', 'teaching-style', 'lesson-plans-manifest']`

#### `exportSchema(name: string, options?: { pretty?: boolean }): string`

Export schema as JSON string.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `name` | string | Yes | - | Schema name |
| `options.pretty` | boolean | No | `true` | Pretty-print JSON with indentation |

**Returns:** JSON string representation of schema

**Example:**

```javascript
import { exportSchema } from './teaching/schemas/v2/index.js';

const json = exportSchema('lesson-plans-manifest', { pretty: true });
console.log(json);
```

#### `resetCache(): void`

Clear lazy-loaded cache.

**Testing only.** Clears internal cached schemas.

**Example:**

```javascript
import { resetCache, getLessonPlanSchema } from './teaching/schemas/v2/index.js';

resetCache();
const schema = getLessonPlanSchema();  // Reloads from disk
```

---

## Layer 3: Orchestration

### Manifest Migrator

**Location:** `src/teaching/validators/manifest-migrator.js`

Migrates directory-based week files into a single `.flow/lesson-plans.yml` manifest. Detects week files across all known locations, fills missing fields with defaults, and merges into a validated manifest.

#### `class ManifestMigrator`

Constructor:

```javascript
constructor({ courseRoot, debug = false })
```

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `courseRoot` | string | Yes | - | Course root directory |
| `debug` | boolean | No | `false` | Enable debug logging |

**Example:**

```javascript
import { ManifestMigrator } from './teaching/validators/manifest-migrator.js';

const migrator = new ManifestMigrator({
  courseRoot: '/Users/dt/teaching/stat-440',
  debug: true
});
```

#### `.detectWeekFiles(): Array<{ path, relativePath, weekNumber, source, data, missingFields }>`

Scan all known locations for week files.

**Returns:** Array of detected week files with parsed data and missing field analysis

```javascript
{
  path: string,                  // Full absolute path
  relativePath: string,          // Relative to courseRoot
  weekNumber: number,            // Parsed week number
  source: string,                // Which WEEK_FILE_LOCATIONS dir
  data: Object,                  // Parsed YAML data
  missingFields: string[]        // Fields needing defaults
}
```

**Example:**

```javascript
const files = migrator.detectWeekFiles();
files.forEach(f => {
  console.log(`Week ${f.weekNumber}: ${f.relativePath}`);
  if (f.missingFields.length > 0) {
    console.log(`  Missing fields: ${f.missingFields.join(', ')}`);
  }
});
```

#### `.previewMigration(files): { weekCount, fieldsToFill, conflicts, warnings, manifestYaml }`

Dry-run preview of migration (no writing).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `files` | Array | Yes | Result from `detectWeekFiles()` |

**Returns:**

```javascript
{
  weekCount: number,        // Number of weeks detected
  fieldsToFill: number,     // Total missing fields to fill with defaults
  conflicts: Array,         // Duplicate week numbers (if any)
  warnings: string[],       // Human-readable warnings
  manifestYaml: string      // Preview of resulting manifest YAML
}
```

**Example:**

```javascript
const detected = migrator.detectWeekFiles();
const preview = migrator.previewMigration(detected);

console.log(`Found ${preview.weekCount} weeks`);
console.log(`Will fill ${preview.fieldsToFill} missing fields`);

if (preview.conflicts.length > 0) {
  console.error('Conflicts detected:');
  preview.conflicts.forEach(c => {
    console.error(`  Week ${c.week}: ${c.sources.join(' and ')}`);
  });
}

preview.warnings.forEach(w => console.warn(`  ${w}`));

console.log('\nPreview of manifest:');
console.log(preview.manifestYaml);
```

#### `.migrate(files, options?): Promise<{ success, manifestPath, weeksMerged, defaultsFilled, warnings, backupPath, error? }>`

Execute migration: merge week files into `.flow/lesson-plans.yml`.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `files` | Array | Yes | - | Result from `detectWeekFiles()` |
| `options.dryRun` | boolean | No | `false` | Preview without writing |
| `options.preserveOriginals` | boolean | No | `true` | Keep original week files after merge |
| `options.defaults` | Object | No | `{}` | Custom default values for missing fields |

**Returns:**

```javascript
{
  success: boolean,
  manifestPath: string,           // Path to created/updated manifest
  weeksMerged: number,            // Number of weeks merged
  defaultsFilled: number,         // Fields filled with defaults
  warnings: string[],             // Migration warnings
  backupPath: string | null,      // .bak path if existing manifest was backed up
  error?: string                  // Error message if success === false
}
```

**Example:**

```javascript
const detected = migrator.detectWeekFiles();

// Preview first
const preview = migrator.previewMigration(detected);
console.log(preview.manifestYaml);

// Execute migration
const result = await migrator.migrate(detected, {
  dryRun: false,
  preserveOriginals: true,
  defaults: { status: 'draft' }
});

if (result.success) {
  console.log(`Migrated ${result.weeksMerged} weeks to ${result.manifestPath}`);
  if (result.backupPath) {
    console.log(`Previous manifest backed up to: ${result.backupPath}`);
  }
} else {
  console.error('Migration failed:', result.error);
}
```

#### `.fillDefaults(weekData, weekNumber, customDefaults?): { filled, warnings, count }`

Fill missing fields in a single week entry.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `weekData` | Object | Yes | Week data object to fill |
| `weekNumber` | number | Yes | Week number (for reference) |
| `customDefaults` | Object | No | Override default values |

**Returns:**

```javascript
{
  filled: Object,     // Week data with defaults filled
  warnings: string[], // Warnings for fields that were filled
  count: number       // Number of fields filled
}
```

**Example:**

```javascript
const weekData = {
  week: 5,
  title: 'ANOVA'
  // missing: status, learning_objectives, topics, activities, materials, lecture_structure
};

const { filled, count, warnings } = migrator.fillDefaults(weekData, 5);
console.log(`Filled ${count} missing fields`);
console.log(`Result:`, filled);
// => {
//   week: 5,
//   title: 'ANOVA',
//   status: 'draft',
//   learning_objectives: [],
//   topics: [],
//   activities: [],
//   materials: {},
//   lecture_structure: []
// }
```

---

### Manifest Sync Engine

**Location:** `src/teaching/config/manifest-sync.js`

Implements three-way merge for `.flow/lesson-plans.yml` manifests. Compares Scholar's manifest (ours) with flow-cli's version (theirs) using a stored base hash for conflict detection.

#### `class ManifestSyncEngine`

Constructor:

```javascript
constructor({ courseRoot, debug = false, dryRun = false })
```

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `courseRoot` | string | Yes | - | Course root directory |
| `debug` | boolean | No | `false` | Enable debug logging |
| `dryRun` | boolean | No | `false` | Preview without writing |

**Example:**

```javascript
import { ManifestSyncEngine } from './teaching/config/manifest-sync.js';

const engine = new ManifestSyncEngine({
  courseRoot: '/Users/dt/teaching/stat-440',
  debug: false,
  dryRun: true  // Preview only
});
```

#### `.loadSyncPair(oursPath, theirsPath): { ours, theirs, oursHash, theirsHash, identical, errors }`

Load both sides for comparison.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `oursPath` | string | Yes | Path to Scholar's manifest |
| `theirsPath` | string | Yes | Path to flow-cli's manifest |

**Returns:**

```javascript
{
  ours: Object | null,           // Parsed Scholar manifest
  theirs: Object | null,         // Parsed flow-cli manifest
  oursHash: string | null,       // SHA-256 of ours
  theirsHash: string | null,     // SHA-256 of theirs
  identical: boolean,            // true if hashes match
  errors: string[]               // Load errors
}
```

**Example:**

```javascript
const pair = engine.loadSyncPair(
  '/Users/dt/teaching/.flow/lesson-plans.yml',
  '/Users/dt/teaching/.flow-cli/lesson-plans.yml'
);

if (pair.errors.length > 0) {
  console.error('Load errors:', pair.errors);
}

if (pair.identical) {
  console.log('Manifests are identical, no sync needed');
} else {
  console.log(`Ours hash:   ${pair.oursHash}`);
  console.log(`Theirs hash: ${pair.theirsHash}`);
}
```

#### `.computeWeekDiff(base, ours, theirs): { oursChanged, theirsChanged, conflicts, unchanged, semesterDiff }`

Compute week-level diff using three-way comparison.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `base` | Object | Yes | Base manifest (from stored hash point) |
| `ours` | Object | Yes | Scholar's current manifest |
| `theirs` | Object | Yes | flow-cli's current manifest |

**Returns:**

```javascript
{
  oursChanged: number[],         // Week numbers changed only by us
  theirsChanged: number[],       // Week numbers changed only by them
  conflicts: Array<{             // Week numbers changed by both (conflicting)
    week: number,
    oursVersion: Object,
    theirsVersion: Object,
    conflictingFields: string[]
  }>,
  unchanged: number[],           // Week numbers unchanged by either side
  semesterDiff: boolean          // Semester metadata differs
}
```

**Example:**

```javascript
const baseManifest = getStoredBaseManifest();
const oursManifest = engine.loadSyncPair(oursPath, theirsPath).ours;
const theirsManifest = engine.loadSyncPair(oursPath, theirsPath).theirs;

const diff = engine.computeWeekDiff(baseManifest, oursManifest, theirsManifest);

console.log(`Weeks changed by us:   ${diff.oursChanged.join(', ')}`);
console.log(`Weeks changed by them: ${diff.theirsChanged.join(', ')}`);
console.log(`Conflicts: ${diff.conflicts.length}`);

diff.conflicts.forEach(c => {
  console.log(`  Week ${c.week}: conflicting fields: ${c.conflictingFields.join(', ')}`);
});
```

#### `.mergeManifests(base, ours, theirs, options?): { success, merged, mergedYaml, autoMerged, conflicts, backupPath, error? }`

Perform three-way merge at week level.

**Merge Strategy:**

- **Non-conflicting:** Scholar modifies week 3, flow-cli modifies week 5 → auto-merge
- **Conflicting:** Both modify week 3 → use `conflictStrategy` (default: `'ours'`)
- **Semester metadata:** Last-writer-wins with warning

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `base` | Object | Yes | - | Base manifest (from stored hash point) |
| `ours` | Object | Yes | - | Scholar's current manifest |
| `theirs` | Object | Yes | - | flow-cli's current manifest |
| `options.conflictStrategy` | string | No | `'ours'` | How to resolve conflicts: `'ours'` or `'theirs'` |

**Returns:**

```javascript
{
  success: boolean,
  merged: Object | null,         // Merged manifest (null if conflicts exist)
  mergedYaml: string | null,     // YAML string of merged manifest
  autoMerged: number,            // Number of weeks auto-merged
  conflicts: Array,              // Unresolved conflicts (if conflictStrategy='abort')
  backupPath: string | null,     // Backup of merged manifest written
  error?: string
}
```

**Example:**

```javascript
const baseManifest = engine.getBaseHash(courseRoot);
const { ours, theirs } = engine.loadSyncPair(oursPath, theirsPath);

const merge = engine.mergeManifests(baseManifest, ours, theirs, {
  conflictStrategy: 'ours'
});

if (merge.success) {
  console.log(`Merged ${merge.autoMerged} weeks automatically`);
  console.log(merge.mergedYaml);
} else if (merge.conflicts.length > 0) {
  console.error('Unresolved conflicts:');
  merge.conflicts.forEach(c => {
    console.error(`  Week ${c.week}: ${c.conflictingFields.join(', ')}`);
  });
}
```

#### `.writeMergedManifest(targetPath, mergedYaml, options?): { success, backupPath, newHash, error? }`

Write merged manifest to file with backup.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `targetPath` | string | Yes | Path to write merged manifest |
| `mergedYaml` | string | Yes | YAML string from `mergeManifests()` |
| `options` | Object | No | Write options (backup, atomic) |

**Returns:**

```javascript
{
  success: boolean,
  backupPath: string | null,     // Path to .bak if created
  newHash: string,               // SHA-256 of written file
  error?: string
}
```

**Example:**

```javascript
const merge = engine.mergeManifests(base, ours, theirs);

if (merge.success) {
  const written = engine.writeMergedManifest(
    targetPath,
    merge.mergedYaml,
    { backup: true, atomic: true }
  );

  if (written.success) {
    console.log(`Wrote merged manifest to: ${targetPath}`);
    console.log(`New hash: ${written.newHash}`);
    engine.storeBaseHash(courseRoot, written.newHash);
  }
}
```

#### `.storeBaseHash(courseRoot, hash): void`

Store base hash in `.scholar-cache/` for future three-way merge reference.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |
| `hash` | string | Yes | SHA-256 hash to store |

**Example:**

```javascript
const written = engine.writeMergedManifest(targetPath, mergedYaml);
engine.storeBaseHash(courseRoot, written.newHash);
```

#### `.getBaseHash(courseRoot): string|null`

Retrieve stored base hash from `.scholar-cache/`.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|---|
| `courseRoot` | string | Yes | Course root directory |

**Returns:** Stored hash, or `null` if not found

**Example:**

```javascript
const baseHash = engine.getBaseHash(courseRoot);
if (baseHash) {
  console.log(`Last sync point: ${baseHash}`);
}
```

---

### Demo Course Scaffolder

**Location:** `src/teaching/commands/demo-scaffold.js`

Creates a complete `.flow/` directory structure for the demo course, including `teach-config.yml` and a full `lesson-plans.yml` manifest with detailed weeks + draft stubs.

#### `scaffoldFlowDirectory(options): Promise<{ success, filesCreated, filesSkipped, weekStubsGenerated, warnings }>`

Scaffold the full `.flow/` directory at a target path.

**Creates:**

- `targetPath/.flow/teach-config.yml` (copied from demo template)
- `targetPath/.flow/lesson-plans.yml` (generated with stubs)
- `targetPath/README.md`, `TEST-CHECKLIST.md`, `sample-student-work.md`
- `targetPath/examples/` (copied from demo templates)

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|---|
| `options.targetPath` | string | Yes | - | Course root directory to scaffold |
| `options.force` | boolean | No | `false` | Overwrite existing files |
| `options.dryRun` | boolean | No | `false` | Preview without writing |

**Returns:**

```javascript
{
  success: boolean,
  filesCreated: string[],        // Paths to created files
  filesSkipped: string[],        // Paths skipped (already exist)
  weekStubsGenerated: number,    // Count of draft week stubs created
  warnings: string[]             // Non-fatal warnings
}
```

**Example:**

```javascript
import { scaffoldFlowDirectory } from './teaching/commands/demo-scaffold.js';

const result = await scaffoldFlowDirectory({
  targetPath: '/Users/dt/teaching/stat-440-fall-2026',
  force: false,
  dryRun: false
});

if (result.success) {
  console.log('Scaffolding complete!');
  console.log(`Created ${result.filesCreated.length} files`);
  console.log(`Generated ${result.weekStubsGenerated} week stubs`);

  result.filesCreated.forEach(f => console.log(`  ✓ ${f}`));

  if (result.filesSkipped.length > 0) {
    console.log('\nSkipped (already exist):');
    result.filesSkipped.forEach(f => console.log(`  - ${f}`));
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }
}
```

**Typical Workflow:**

```javascript
// 1. Dry run to preview
const preview = await scaffoldFlowDirectory({
  targetPath: courseRoot,
  dryRun: true
});

console.log('Will create:', preview.filesCreated);
console.log('Week stubs:', preview.weekStubsGenerated);

// 2. If satisfied, execute
if (userConfirms()) {
  const result = await scaffoldFlowDirectory({
    targetPath: courseRoot,
    dryRun: false
  });
}
```

---

## Error Handling Pattern

All Phase 2 APIs follow a consistent error handling pattern:

### Standard Response Object

```javascript
{
  success: boolean,           // Operation succeeded
  // ... operation-specific fields ...
  error?: string,             // Error message (only if success === false)
  warnings: string[]          // Non-fatal issues (always present in some APIs)
}
```

### Function Categories

#### 1. Simple Functions (Boolean/String Returns)

Return error info inline:

```javascript
// safeWriteYaml()
const result = safeWriteYaml(path, data);
if (!result.success) {
  console.error('Write failed:', result.error);
}
```

#### 2. Complex Operations (Manifest Operations)

Return comprehensive result objects:

```javascript
// ManifestMigrator.migrate()
const result = await migrator.migrate(files);
if (result.success) {
  console.log(`Migrated ${result.weeksMerged} weeks`);
} else {
  console.error('Migration failed:', result.error);
}
```

#### 3. Validation Functions

Return `{ valid, errors }`:

```javascript
// validateManifest()
const { valid, errors } = validateManifest(manifest);
if (!valid) {
  errors.forEach(err => console.error(`  - ${err}`));
}
```

### Error Recovery

**Golden Rule:** Always check `success` or `valid` before using operation results:

```javascript
// ✓ CORRECT
const { manifest } = loadManifest(courseRoot);
if (manifest) {
  processManifest(manifest);
}

// ✗ WRONG (manifest could be null)
const { manifest } = loadManifest(courseRoot);
processManifest(manifest);  // Could crash!
```

---

## Week Status Lifecycle

All weeks in the manifest have a `status` field that tracks their state through the teaching cycle:

```
draft → generated → reviewed → published
```

### Status Definitions

| Status | Description | Typical User | How to Enter |
|--------|---|---|---|
| `draft` | Placeholder week stub, no content generated | Instructor planning | Default for migration; manual creation |
| `generated` | AI-generated lecture, exam, or materials ready for review | Claude/Scholar | Auto-updated after AI generation commands |
| `reviewed` | Content reviewed and approved by instructor | Instructor | Manual status update via `updateWeekStatus()` |
| `published` | Finalized and deployed to students | Instructor | Manual status update via `updateWeekStatus()` |

### Status Transitions

- **Forward:** `draft` → `generated` → `reviewed` → `published`
- **Backward:** Allowed (e.g., revert from `published` to `generated` for edits)
- **Skip:** Allowed (e.g., `draft` → `published` for manually-created weeks)

### Practical Example

```javascript
import { updateWeekStatus } from './teaching/utils/manifest-loader.js';

// Week 3 is a draft placeholder
const week3 = manifest.weeks.find(w => w.week === 3);
console.log(week3.status);  // => 'draft'

// Scholar generates lecture content
const result = await generateLectureNotes({ topic: week3.title });

// Update manifest to reflect generated state
const updated = updateWeekStatus(courseRoot, 3, 'generated');
console.log(updated.newStatus);  // => 'generated'

// Instructor reviews and approves
const approved = updateWeekStatus(courseRoot, 3, 'reviewed');

// Publish to students
const published = updateWeekStatus(courseRoot, 3, 'published');
```

---

## Dependencies Graph

```
Layer 1: Shared Utilities
  ├── hash.js (no dependencies)
  ├── safe-write.js (uses: js-yaml, fs)
  └── discovery.js (uses: fs)

Layer 2: Manifest Operations
  ├── manifest-validator.js (uses: ajv, Layer1/hash, schemas/v2)
  ├── manifest-generator.js (uses: js-yaml)
  ├── manifest-loader.js (uses: Layer1/hash, Layer1/safe-write, manifest-validator, js-yaml)
  └── schemas/v2/index.js (no dependencies, except fs for loading .json files)

Layer 3: Orchestration
  ├── manifest-migrator.js (uses: discovery, safe-write, manifest-validator, js-yaml)
  ├── manifest-sync.js (uses: hash, safe-write, js-yaml)
  └── demo-scaffold.js (uses: manifest-generator, safe-write, manifest-validator, js-yaml)
```

### Import Chains (Common Patterns)

**Pattern 1: Load and Validate**

```javascript
import { loadManifest } from '../utils/manifest-loader.js';

const { manifest, errors } = loadManifest(courseRoot);
// manifest-loader internally uses:
//   - hash.js (for computing SHA-256)
//   - manifest-validator.js (for schema validation)
//   - schemas/v2 (for JSON schema)
```

**Pattern 2: Migrate Directory → Manifest**

```javascript
import { ManifestMigrator } from '../validators/manifest-migrator.js';

const migrator = new ManifestMigrator({ courseRoot });
const detected = migrator.detectWeekFiles();
// internally uses:
//   - discovery.js (to find week files)
//   - manifest-validator.js (to validate merged result)
```

**Pattern 3: Sync Two Manifests**

```javascript
import { ManifestSyncEngine } from '../config/manifest-sync.js';

const engine = new ManifestSyncEngine({ courseRoot });
const merged = engine.mergeManifests(base, ours, theirs);
// internally uses:
//   - hash.js (for change detection)
//   - safe-write.js (for writing merged result)
```

**Pattern 4: Generate New Manifest from Config**

```javascript
import { generateManifestFromConfig } from '../utils/manifest-generator.js';
import { validateManifest } from '../utils/manifest-validator.js';

const { manifest, yaml } = generateManifestFromConfig(options);
const { valid, errors } = validateManifest(manifest);
// uses:
//   - manifest-generator.js (to create structure)
//   - manifest-validator.js (to validate result)
//   - schemas/v2 (for JSON schema)
```

---

## Quick Reference

### Common Tasks

#### Load manifest and inspect weeks

```javascript
import { loadManifest, extractWeekFromManifest } from './teaching/utils/manifest-loader.js';

const { manifest } = loadManifest(courseRoot);
manifest.weeks.forEach(w => {
  console.log(`Week ${w.week}: ${w.title} (${w.status})`);
});
```

#### Discover existing week files

```javascript
import { findAllWeekFiles } from './teaching/utils/discovery.js';

const weekFiles = findAllWeekFiles(courseRoot);
weekFiles.forEach(f => {
  console.log(`${f.relativePath} → Week ${f.weekNumber}`);
});
```

#### Migrate directory-based weeks to manifest

```javascript
import { ManifestMigrator } from './teaching/validators/manifest-migrator.js';

const migrator = new ManifestMigrator({ courseRoot, debug: true });
const detected = migrator.detectWeekFiles();
const preview = migrator.previewMigration(detected);
console.log(preview.manifestYaml);

const result = await migrator.migrate(detected);
```

#### Validate manifest against schema

```javascript
import { loadManifest } from './teaching/utils/manifest-loader.js';
import { validateManifest } from './teaching/utils/manifest-validator.js';

const { manifest } = loadManifest(courseRoot);
const { valid, errors } = validateManifest(manifest);
if (!valid) errors.forEach(e => console.error(e));
```

#### Sync two manifests (three-way merge)

```javascript
import { ManifestSyncEngine } from './teaching/config/manifest-sync.js';

const engine = new ManifestSyncEngine({ courseRoot, dryRun: false });
const baseHash = engine.getBaseHash(courseRoot);
const { ours, theirs } = engine.loadSyncPair(path1, path2);

const merged = engine.mergeManifests(baseManifest, ours, theirs, {
  conflictStrategy: 'ours'
});

if (merged.success) {
  engine.writeMergedManifest(targetPath, merged.mergedYaml);
  engine.storeBaseHash(courseRoot, merged.newHash);
}
```

#### Scaffold new course with demo templates

```javascript
import { scaffoldFlowDirectory } from './teaching/commands/demo-scaffold.js';

const result = await scaffoldFlowDirectory({
  targetPath: '/path/to/new-course',
  force: false
});

console.log(`Created ${result.filesCreated.length} files`);
console.log(`Generated ${result.weekStubsGenerated} week stubs`);
```

#### Update week status

```javascript
import { updateWeekStatus } from './teaching/utils/manifest-loader.js';

// After AI generation
const result = updateWeekStatus(courseRoot, 3, 'generated');

// After instructor review
updateWeekStatus(courseRoot, 3, 'reviewed');

// When published to students
updateWeekStatus(courseRoot, 3, 'published');
```

---

## Related Documentation

- [API Reference (v2.5.0)](API-REFERENCE.md) — Full Scholar plugin API
- [Developer Guide](DEVELOPER-GUIDE.md) — Development workflow
- [Phase 2 Architecture Diagrams](PHASE2-ARCHITECTURE-DIAGRAMS.md) — Architecture and design decisions
- [Testing Guide](TESTING-GUIDE.md) — Test organization and patterns

---

**Last updated:** 2026-02-02
**API Version:** {{ scholar.version }}
**Status:** Phase 2 Implementation
**Contributors:** Data-Wise team
