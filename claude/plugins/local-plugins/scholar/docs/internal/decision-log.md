# Decision Log

Architecture Decision Records (ADRs) for Scholar. Each records the context, decision, and consequences of a significant technical choice.

> **See also:** [Architecture Overview](../ARCHITECTURE.md) for system diagrams. This page captures the *reasoning* behind the architecture.

---

## ADR Template

When adding a new decision, copy this template:

```
### ADR-NNN: Title

- **Date:** YYYY-MM-DD
- **Status:** Accepted | Superseded | Deprecated
- **Context:** What prompted this decision?
- **Decision:** What did we decide?
- **Consequences:** What are the trade-offs?
```

---

## Accepted Decisions

### ADR-001: Manifest-First Discovery with Directory Fallback

- **Date:** 2026-02-02 (Session 47)
- **Status:** Accepted
- **Context:** Scholar needed to discover lesson plans. Two approaches: scan directories for YAML files, or use a manifest file (`.flow/lesson-plans.yml`) that explicitly lists them.
- **Decision:** Use manifest-first discovery. When a manifest exists, use it as the authoritative source. Fall back to directory scanning when no manifest is present.
- **Consequences:** Manifest provides explicit ordering and metadata. Directory fallback preserves backward compatibility with pre-v2.6.0 courses. Slightly more complex discovery logic but cleaner semantics.

### ADR-002: SHA-256 Hash-Based Change Detection

- **Date:** 2026-02-02 (Session 47)
- **Status:** Accepted
- **Context:** Bidirectional sync between YAML and JSON needs to detect which side changed. Timestamps are unreliable across git operations and CI environments.
- **Decision:** Use SHA-256 content hashes stored alongside each file. On sync, compare current hash to stored hash to determine which side (YAML, JSON, or both) changed.
- **Consequences:** Deterministic detection regardless of filesystem timestamps. Small overhead of hash computation. Requires storing hash metadata (in manifest or sidecar).

### ADR-003: Two Prompt Systems (Markdown Templates + JS Builders)

- **Date:** 2026-01-28 (Session ~43)
- **Status:** Accepted
- **Context:** Scholar needs prompt templates for AI generation. Simple prompts (quiz, basic exam) need easy editing. Complex prompts (lecture notes with 20+ variables and conditional sections) need programmatic construction.
- **Decision:** Maintain two systems: (1) `.md` template files in `src/teaching/ai/prompts/default/` with YAML frontmatter and Handlebars-like syntax for user-customizable prompts, and (2) programmatic JS prompt builders in command handlers for complex multi-step generation.
- **Consequences:** Users can override `.md` templates via `.flow/templates/prompts/`. Complex prompts get full programming power. Maintainers must know which system to use for new features.

### ADR-004: ES Modules Throughout

- **Date:** 2026-01-15 (Session ~38)
- **Status:** Accepted
- **Context:** Scholar started with CommonJS. As the codebase grew, ESM offered better tree-shaking, top-level await, and alignment with modern Node.js.
- **Decision:** Use ES modules (`"type": "module"` in package.json) for all source and test files. Jest runs with `--experimental-vm-modules`.
- **Consequences:** Modern syntax and imports. Requires Node.js >= 18. Jest ESM support requires `NODE_OPTIONS='--experimental-vm-modules'`. Cannot use `require()` anywhere.

### ADR-005: Homebrew as Primary Distribution Channel

- **Date:** 2026-01-28
- **Status:** Accepted
- **Context:** Scholar is a Claude Code plugin. Users install it via `brew install` or by cloning and running `install.sh`. npm publishing is possible but not yet needed.
- **Decision:** Use Homebrew tap (`data-wise/tap`) as the primary distribution channel. Automated via `homebrew-release.yml` workflow that calculates SHA-256 and updates the formula on each GitHub release.
- **Consequences:** Simple install experience (`brew install data-wise/tap/scholar`). Requires maintaining the Homebrew tap repo. npm publishing deferred.

### ADR-006: Backup-on-Write with Last-Write-Wins

- **Date:** 2026-02-02 (Session 48)
- **Status:** Accepted
- **Context:** Bidirectional sync can encounter conflicts when both YAML and JSON change simultaneously. Full conflict resolution (3-way merge) adds significant complexity.
- **Decision:** Use backup-on-write (`.bak` files) with last-write-wins semantics. When a conflict is detected, the most recently modified side wins and a backup of the other side is preserved.
- **Consequences:** Simple and predictable. Users can recover from `.bak` files. No complex merge UI needed. Risk of silent data loss if users aren't aware of the `.bak` convention.

### ADR-007: Status Lifecycle for Content

- **Date:** 2026-02-02 (Session 47)
- **Status:** Accepted
- **Context:** Generated content (lesson plans, lectures) goes through stages: initial creation, AI generation, instructor review, and publication.
- **Decision:** Define a 5-stage lifecycle: `draft` → `generated` → `reviewed` → `published` → `archived`. Stored in metadata.status field of lesson plan YAML.
- **Consequences:** Clear tracking of content maturity. Commands can filter by status (e.g., only publish `reviewed` content). Adds a required field to lesson plan schema.

### ADR-008: JSON Schema Draft-07 for Validation

- **Date:** 2026-01-15
- **Status:** Accepted
- **Context:** Need to validate lesson plans, teaching styles, and manifests. Options: custom validation, Zod, JSON Schema.
- **Decision:** Use JSON Schema Draft-07 with AJV (+ ajv-keywords, ajv-formats) for all validation. Schemas live in `src/teaching/schemas/v2/` as `.schema.json` files.
- **Consequences:** Standard schema format, good tooling support, schemas are exportable for external consumers (`package.json` exports). AJV adds ~200KB to dependencies. Draft-07 (not 2020-12) for broader compatibility.

### ADR-009: IEEE LOM Alignment for Lesson Plans

- **Date:** 2026-02-02 (Session 47)
- **Status:** Accepted
- **Context:** Lesson plan schema needed a structure. Could invent our own or align with an educational metadata standard.
- **Decision:** Align lesson plan schema with IEEE Learning Object Metadata (LOM) standard. Properties map to LOM categories (Educational.LearningResourceType, Educational.Content, Technical.Format).
- **Consequences:** Interoperable with other educational tools. Familiar structure for instructional designers. Some LOM fields are verbose for our use case but provide future extensibility.

### ADR-010: Package.json Exports for Schema Sharing

- **Date:** 2026-02-02 (Session 48)
- **Status:** Accepted
- **Context:** flow-cli and other tools need to validate lesson plans against Scholar's schemas. Schemas should be the single source of truth.
- **Decision:** Export schemas via `package.json` `"exports"` field. External consumers import with `import schema from '@data-wise/scholar/schemas/lesson-plan'`.
- **Consequences:** Scholar owns the schemas. Consumers always get the latest version. Requires proper semver for schema changes (breaking schema change = major version bump).

### ADR-011: Remove --send from exam.md and quiz.md

- **Date:** 2026-03-04 (Session 87)
- **Status:** Accepted
- **Context:** The `--send` flag was added to `/teaching:exam` and `/teaching:quiz` in v2.15.0 but contained a critical bug: static `import` statements inside an `if (options.send)` conditional block — invalid ES module syntax. Additionally, `exam` and `filepath` variables were scoped only to the non-`--variations` branch but accessed unconditionally. The flag never worked correctly.
- **Decision:** Remove `--send` entirely from exam.md and quiz.md rather than fix and re-test. Email delivery for exams/quizzes can be done manually. `--send` remains on solution, assignment, and rubric commands where it works correctly.
- **Consequences:** Simpler command surface. Eliminates a crash. Email delivery for exams requires manual step. Could be re-added in a future version if needed with proper implementation.

### ADR-012: parseArgs Regex Tokenizer as Standard

- **Date:** 2026-03-04 (Session 87)
- **Status:** Accepted
- **Context:** `exam.md` used `input.split(/\s+/)` for argument parsing, which breaks multi-word quoted strings like `--topics "linear regression, ANOVA"`. `canvas.md` already used the correct regex tokenizer pattern.
- **Decision:** Use the regex tokenizer `/"([^"]+)"|'([^']+)'|(\S+)/g` as the standard `parseArgs` implementation across all teaching commands. The canonical source is `canvas.md`. Long-term: extract to `src/teaching/utils/args.js`.
- **Consequences:** Quoted arguments work correctly. All commands should adopt this pattern. Audit remaining commands (slides, lecture, assignment) for the naive split pattern.

### ADR-013: Pre-flight Canvas Validation Before Conversion

- **Date:** 2026-03-04 (Session 87)
- **Status:** Accepted
- **Context:** Canvas QTI imports fail silently when questions have wrong structure (MA with rcardinality="Single", short answers with no varequal, etc.). Users only discover failures after uploading — too late.
- **Decision:** Add a pre-flight validation step in `/teaching:canvas` that checks Canvas-specific requirements before invoking examark. Blocking errors exit with code 1; warnings proceed. Mirrors the `examark check` pre-conversion lint philosophy.
- **Consequences:** Faster feedback loop. Prevents wasted examark runs. Requires knowledge of Canvas QTI constraints in the command layer. False positives possible if validation logic drifts from actual Canvas behavior.
