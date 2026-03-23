---
render_macros: false
---

# Version Sync System

How Scholar keeps version strings, test counts, and command counts consistent across 40+ files.

---

## Architecture

Scholar uses a **two-layer approach** because not all files can use the same mechanism:

| Layer | Mechanism | Files | When it runs |
|-------|-----------|-------|-------------|
| **MkDocs macros** | `{{ scholar.version }}` Jinja2 variables | ~30 doc files | At `mkdocs build` time |
| **version-sync.js** | Regex-based find-and-replace | 12 target files | At `npm version` time |

```
package.json (authoritative source)
    │
    ├── npm version hook ──► scripts/version-sync.js
    │                            ├── README.md (badges, counts)
    │                            ├── CLAUDE.md (heading, tests, URL)
    │                            ├── .claude-plugin/plugin.json
    │                            ├── tests/README.md
    │                            ├── mkdocs.yml (extra.scholar.*)
    │                            └── 7 docs/* files (render_macros: false)
    │
    └── mkdocs build ──► macros plugin reads extra.scholar.*
                             └── ~30 docs files use {{ scholar.version }}
```

### Why two layers?

**MkDocs macros** (Jinja2) can't be used everywhere:

- **GitHub-visible files** (README, CLAUDE.md) are rendered raw, not through MkDocs
- **Doc files with `{#id}` anchors** — Jinja2 interprets `{#` as comment start
- **Doc files with `{{ }}` syntax** — Handlebars templates, BibTeX entries

These files get `render_macros: false` frontmatter and are handled by the sync script instead.

---

## Source of Truth

```
mkdocs.yml
  extra:
    scholar:
      version: "2.9.0"          ← synced FROM package.json
      prev_version: "2.8.0"     ← manual
      release_date: "2026-02-09" ← auto-set to today by sync script
      test_count: "2,630"        ← synced via --tests flag
      jest_count: "2,583"        ← manual
      node_test_count: "47"      ← manual
      command_count: 29           ← manual (rarely changes)
      teaching_commands: 14       ← manual
      research_commands: 14       ← manual
      hub_commands: 1             ← manual
      suite_count: 98             ← manual
```

**`package.json` version** is the single authoritative source. Everything else derives from it.

---

## Usage

### Standard Release (recommended)

```bash
# 1. Edit package.json version, then:
npm version 2.9.0
# Runs: tests → sync → stage → commit → tag

# 2. Push
git push && git push --tags
```

The `npm version` lifecycle hooks handle everything:

| Hook | Action |
|------|--------|
| `preversion` | `npm test` — abort if tests fail |
| `version` | `version-sync.js` + `git add -A` — sync all files into the version commit |
| `postversion` | Prints push reminder |

### Manual Sync

```bash
# Preview what would change
node scripts/version-sync.js --version 2.9.0 --tests 2300 --dry-run

# Apply changes
node scripts/version-sync.js --version 2.9.0 --tests 2300

# Sync from current package.json (no --version flag)
node scripts/version-sync.js
```

### CLI Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--version X.Y.Z` | Override version (default: reads `package.json`) | `--version 3.0.0` |
| `--tests N` | Update test counts | `--tests 2500` |
| `--dry-run` | Preview changes without writing | |

---

## What Gets Synced

### version-sync.js Targets (12 files)

| File | Patterns |
|------|----------|
| `README.md` | Badge version, badge URL, test count badge, latest version text, inline test count, architecture test count, verification output |
| `CLAUDE.md` | Current State heading, tests line, release URL |
| `.claude-plugin/plugin.json` | `"version"` field (JSON) |
| `tests/README.md` | Total test count, unit test count |
| `mkdocs.yml` | `scholar.version`, `scholar.test_count`, `scholar.release_date` |
| `docs/TEACHING-WORKFLOWS.md` | Version footer (2 occurrences) |
| `docs/help/FAQ-research.md` | Command count |
| `docs/help/FAQ-teaching.md` | Scholar version ref, command count |
| `docs/help/TROUBLESHOOTING-teaching.md` | Version alt footer, Scholar version ref, expected version output |
| `docs/workflows/research/latex-integration.md` | Document Version footer |
| `docs/workflows/research/literature-review.md` | Document Version footer |
| `docs/workflows/research/manuscript-writing.md` | Document Version footer |

### MkDocs Macros Variables (~30 files)

Doc files without `render_macros: false` can use these variables:

| Variable | Value | Usage |
|----------|-------|-------|
| `{{ scholar.version }}` | `2.9.0` | Version badges, footers |
| `{{ scholar.test_count }}` | `2,630` | Test count references |
| `{{ scholar.command_count }}` | `29` | Total command count |
| `{{ scholar.teaching_commands }}` | `14` | Teaching command count |
| `{{ scholar.research_commands }}` | `14` | Research command count |
| `{{ scholar.hub_commands }}` | `1` | Hub command count |
| `{{ scholar.suite_count }}` | `98` | Test suite count |
| `{{ scholar.release_date }}` | `2026-02-09` | Release date |
| `{{ scholar.prev_version }}` | `2.8.0` | Previous version |

---

## CI Validation

The GitHub Actions CI workflow (`.github/workflows/ci.yml`) includes a **version consistency check** that compares three sources:

1. `package.json` → `version`
2. `.claude-plugin/plugin.json` → `version`
3. `mkdocs.yml` → `extra.scholar.version`

If any mismatch is detected, CI fails with `::error::` annotations showing which files disagree.

---

## Files with render_macros: false

25 doc files have `render_macros: false` YAML frontmatter. These files are **excluded from Jinja2 processing** because they contain syntax that conflicts with the macros plugin:

| Conflict Type | Example | Files |
|---------------|---------|-------|
| Pandoc heading IDs | `## Step 1 {#step-1}` | analysis-planning, simulation-design, TEACHING-WORKFLOWS, literature-review, manuscript-writing, latex-integration |
| Handlebars templates | `{{topic}}`, `{{#if level}}` | custom-prompts, PROMPT-CUSTOMIZATION, WHATS-NEW-v2.4.0, FAQ-teaching |
| BibTeX entries | `{{Bayesian} Analysis}` | FAQ-research |
| Quarto attributes | `{#sec-name}` | v2.5.0-weekly-lecture-production |

**To add a new file with render_macros: false:**

1. Add YAML frontmatter at the top of the file:
   ```yaml
   ---
   render_macros: false
   ---
   ```
2. If the file has version strings, add it as a target in `scripts/version-sync.js`

---

## Adding a New Sync Target

To add a new file to `version-sync.js`:

1. Create a sync entry in the `targets` array using `syncDocFile` and reusable patterns:

```javascript
{ rel: 'docs/my-new-file.md', sync: (f) => syncDocFile(f, [
  docPatterns.versionFooter,      // **Version:** X.Y.Z
  docPatterns.docVersionFooter,   // **Document Version:** X.Y.Z
  docPatterns.scholarVersion,     // Scholar vX.Y.Z
  docPatterns.commandCount,       // all N commands
  docPatterns.versionAltFooter,   // > Version: X.Y.Z
  docPatterns.shouldBeVersion,    // Should be X.Y.Z+
])},
```

2. Test with `--dry-run`:
   ```bash
   node scripts/version-sync.js --version 9.9.9 --dry-run
   ```

3. Verify the patterns match and the before/after diff is correct.

### Available Reusable Patterns

| Pattern | Matches | Global |
|---------|---------|--------|
| `versionFooter` | `**Version:** X.Y.Z` | Yes |
| `versionAltFooter` | `> Version: X.Y.Z` | No |
| `docVersionFooter` | `**Document Version:** [v]X.Y.Z` | No |
| `scholarVersion` | `Scholar vX.Y.Z` | Yes |
| `commandCount` | `all N commands` | No |
| `shouldBeVersion` | `Should be X.Y.Z+` | No |
