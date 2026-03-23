# SPEC: Hub Flag Discovery Enhancement

**Status:** done
**Created:** 2026-02-13
**Target Version:** v2.12.0
**From Brainstorm:** This session (gap analysis + deep brainstorm)

---

## Overview

Enhance the Scholar Hub discovery engine to parse, cache, and display command flags/options. Currently, `/scholar:hub exam` shows only name, description, usage, and examples — users cannot discover the `-i` flag or any other options without reading raw `.md` files. This spec adds flag extraction to the discovery engine, flag display to all hub layers, and contextual tips to smart-help.

---

## Primary User Story

**As a** Scholar user exploring commands via `/scholar:hub`,
**I want to** see available flags and options for each command,
**So that** I can discover features like `-i` (custom instructions) without reading documentation files.

### Acceptance Criteria

- [ ] `/scholar:hub exam` (Layer 3) shows a flags/options section with all documented flags
- [ ] `/scholar:hub teaching` (Layer 2) shows count hint per command: `exam (12 flags)`
- [ ] `/scholar:hub` (Layer 1) shows `[AI]` marker next to commands that support `-i`
- [ ] `cache.json` includes parsed flags for all commands
- [ ] Smart-help teaching tips mention the `-i` flag
- [ ] All 14 teaching command `.md` files have standardized **Options:** sections
- [ ] All existing tests pass; new tests cover flag extraction

---

## Secondary User Stories

**As a** power user, I want the hub quick reference card to indicate which commands accept `-i`, so I can quickly scan AI-capable commands.

**As a** contributor adding a new command, I want the Options section format to be standardized, so the discovery engine reliably parses my flags.

---

## Architecture

### Data Flow

```mermaid
flowchart LR
    MD["Command .md files<br/>(Options section)"] -->|extractFlags()| DE["Discovery Engine<br/>index.js"]
    DE -->|write| Cache["cache.json<br/>+ flags array"]
    Cache -->|read| Hub["Hub Command<br/>hub.md"]
    Hub -->|Layer 1| L1["Overview<br/>[AI] markers"]
    Hub -->|Layer 2| L2["Category<br/>flag count hints"]
    Hub -->|Layer 3| L3["Detail<br/>full Options table"]
    Cache -->|read| SH["Smart Help<br/>smart-help.js"]
    SH -->|tip| Tip["Tip: Use -i for<br/>custom instructions"]
```

### Components Modified

| File | Change | Lines Est. |
|------|--------|-----------|
| `src/discovery/index.js` | Add `extractFlags()`, include in command metadata, bump CACHE_VERSION | ~60 |
| `src/discovery/smart-help.js` | Add `-i` tip to teaching context | ~5 |
| `src/plugin-api/commands/hub.md` | Update Layer 1/2/3 rendering specs | ~40 |
| `src/plugin-api/commands/teaching/*.md` (14 files) | Standardize Options sections | ~10 each |
| `tests/discovery/discovery.test.js` | Test flag extraction + cache schema | ~80 |
| `tests/discovery/smart-help.test.js` | Test new tip text | ~10 |
| `tests/commands/hub.test.js` | Test flag display in layers | ~40 |

---

## Detailed Design

### 1. Standardize Options Format (14 command .md files)

All teaching command `.md` files must use this consistent format:

```markdown
**Options:**
- `--flag-name VALUE` - Description of what it does
- `--flag-name` / `-short` - Description (short alias noted)
- `-i "text"` / `--instructions "text"` - Custom instructions for AI generation
- `-i @file.txt` - Load instructions from a file
```

**Rules:**
- Section header: exactly `**Options:**` (bold, with colon)
- Each flag on its own line starting with `- \``
- Long flag first, short alias after `/`
- Description after ` - ` (space-dash-space)
- VALUE placeholder in CAPS when flag takes an argument

**Files to standardize (9 already have Options, 5 need verification):**

| File | Has Options | Has `-i` | Action |
|------|-------------|----------|--------|
| exam.md | Yes | Yes | Verify format |
| quiz.md | Yes | Yes | Verify format |
| slides.md | Yes | Yes | Verify format |
| lecture.md | Yes | Yes | Verify format |
| assignment.md | Yes | Yes | Verify format |
| syllabus.md | Yes | Yes | Verify format |
| feedback.md | Yes | Yes | Verify format |
| rubric.md | Yes | Yes | Verify format |
| validate.md | Check | No | Standardize if present |
| diff.md | Check | No | Standardize if present |
| sync.md | Check | No | Standardize if present |
| migrate.md | Check | No | Standardize if present |
| demo.md | Check | No | Standardize if present |
| config.md | Subcommands | No | Skip (different pattern) |

### 2. Discovery Engine: `extractFlags()` (index.js)

Add a new extraction function alongside `extractUsage()` and `extractExamples()`:

```javascript
/**
 * Extract flags/options from the markdown body.
 *
 * Looks for an **Options:** section and parses flag definitions.
 *
 * @param {string} body - Markdown body (after frontmatter).
 * @returns {Array<{name: string, short: string|null, description: string, takesValue: boolean}>}
 */
function extractFlags(body) {
  const flags = [];

  // Match **Options:** section followed by bullet list
  const optionsMatch = body.match(
    /\*\*Options:\*\*\s*\r?\n((?:\s*-\s+.+\r?\n?)+)/
  );
  if (!optionsMatch) return flags;

  const lines = optionsMatch[1].split('\n');
  for (const line of lines) {
    // Pattern: - `--name VALUE` / `-s` - Description
    const m = line.match(
      /^\s*-\s+`([^`]+)`(?:\s*\/\s*`([^`]+)`)?\s*-\s+(.+)$/
    );
    if (m) {
      const longFlag = m[1].trim();
      const shortFlag = m[2]?.trim() || null;
      const description = m[3].trim();
      const takesValue = /\s+[A-Z"@]/.test(longFlag);

      flags.push({
        name: longFlag.replace(/\s+.*/, ''),  // --instructions
        short: shortFlag?.replace(/\s+.*/, '') || null,  // -i
        description,
        takesValue,
      });
    }
  }

  return flags;
}
```

**Integration point** (line ~245 in scanCommands):

```javascript
commands.push({
  name: frontmatter.name || `${dirName}:${cmdBaseName}`,
  description: frontmatter.description || '',
  category,
  subcategory,
  directory: dirName,
  file: join(COMMANDS_REL, dirName, file),
  usage: extractUsage(body),
  examples: extractExamples(body),
  flags: extractFlags(body),         // NEW
  hasInstructions: extractFlags(body) // NEW — convenience boolean
    .some(f => f.name === '--instructions' || f.short === '-i'),
});
```

### 3. Cache Schema Update

Bump `CACHE_VERSION` from `1` to `2`. New cache entry shape:

```json
{
  "version": 2,
  "fileCount": 29,
  "commands": [
    {
      "name": "teaching:exam",
      "description": "Generate comprehensive exams...",
      "category": "teaching",
      "subcategory": "content",
      "usage": "/teaching:exam [type] [options]",
      "examples": [...],
      "flags": [
        { "name": "--questions", "short": null, "description": "Number of questions (default: 10)", "takesValue": true },
        { "name": "--instructions", "short": "-i", "description": "Custom instructions for AI generation", "takesValue": true }
      ],
      "hasInstructions": true
    }
  ]
}
```

**Migration:** When loading cache with `version < 2`, delete and regenerate (existing behavior).

### 4. Hub Layer Updates (hub.md)

#### Layer 1: `[AI]` Markers

```
| TEACHING (14 commands)                                    |
|   Content ..... exam [AI], quiz [AI], slides [AI],        |
|                 assignment [AI], syllabus [AI],            |
|                 lecture [AI]                               |
|   Assessment .. rubric [AI], feedback [AI]                |
|   Config ...... validate, diff, sync, migrate, demo       |
```

**Rule:** Append `[AI]` after command name if `hasInstructions === true`.

#### Layer 2: Flag Count Hint

```
| CONTENT                                                  |
|   exam             Generate comprehensive exams          |
|                    (12 options — see details)             |
|   quiz             Create a quiz                         |
|                    (10 options — see details)             |
```

**Rule:** Below each description, show `(N options — see details)` if `flags.length > 0`.

#### Layer 3: Full Options Display

```
+-----------------------------------------------------------+
| COMMAND: exam                                             |
+-----------------------------------------------------------+
|                                                           |
| Name:        teaching:exam                                |
| Category:    teaching > content                           |
| Description: Generate comprehensive exams with AI-powered |
|              questions and answer keys                    |
|                                                           |
| Usage:                                                    |
|   /teaching:exam [type] [options...] (12 options)         |
|                                                           |
| Options:                                                  |
|   --questions N ........... Number of questions           |
|   --difficulty LEVEL ...... easy, medium, hard            |
|   --duration N ............ Duration in minutes           |
|   --topics "t1,t2" ....... Specific topics to cover      |
|   --instructions / -i ..... Custom instructions for AI    |
|   --dry-run ............... Preview without API calls     |
|   --config PATH ........... Explicit config file path     |
|   --debug ................. Enable debug logging          |
|   ... (+ 4 more)                                          |
|                                                           |
| Examples:                                                 |
|   /teaching:exam midterm                                  |
|   /teaching:exam final --questions 15 -i "Use healthcare" |
|                                                           |
+-----------------------------------------------------------+
```

**Rules:**
- Show up to 8 flags with dotted leaders for alignment
- If more than 8, show `... (+ N more)` footer
- Usage line shows count hint: `[options...] (N options)`
- Examples should include `-i` example if `hasInstructions`

### 5. Smart Help Enhancement (smart-help.js)

Update the teaching suggestions and auto-tip:

```javascript
// In SUGGESTIONS.teaching, add tip property:
teaching: [
  { command: 'teaching:exam', description: 'Generate an exam', tip: 'Use -i for custom instructions' },
  { command: 'teaching:quiz', description: 'Create a quiz', tip: 'Use -i for custom instructions' },
  // ...
],

// In getAutoTip():
case 'teaching':
  return "Tip: You're in a teaching project. Try /teaching:exam or /scholar:hub for all commands. Use -i to customize AI generation.";
```

---

## API Design

N/A — No external API changes. All changes are internal to the discovery engine and hub rendering.

---

## Data Models

### Flag Object

```typescript
interface Flag {
  name: string;        // e.g., "--instructions"
  short: string|null;  // e.g., "-i"
  description: string; // e.g., "Custom instructions for AI generation"
  takesValue: boolean; // true if flag expects an argument
}
```

### Extended Command Object

```typescript
interface Command {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  directory: string;
  file: string;
  usage: string|null;
  examples: string[];
  flags: Flag[];           // NEW
  hasInstructions: boolean; // NEW — convenience for [AI] markers
}
```

---

## Dependencies

No new dependencies. Uses existing:
- `js-yaml` (frontmatter parsing)
- `fs`, `path` (file operations)

---

## UI/UX Specifications

N/A — CLI only. Output format specified in Layer 1/2/3 sections above.

---

## Testing Strategy

### Unit Tests (discovery.test.js)

| Test | What it validates |
|------|-------------------|
| `extractFlags() parses standard format` | Correct flag name, short, description, takesValue |
| `extractFlags() handles no Options section` | Returns empty array |
| `extractFlags() handles malformed lines` | Skips invalid, parses valid |
| `extractFlags() handles multi-alias format` | `-i "text"` / `--instructions "text"` |
| `cache v2 includes flags array` | Cache schema has flags field |
| `cache v1 triggers regeneration` | Old cache is invalidated |
| `hasInstructions is true for exam` | Convenience boolean works |
| `hasInstructions is false for validate` | No `-i` flag detected |
| `all 14 teaching commands parse flags` | Every command has flags array |
| `flag count matches Options section` | Parsed count equals actual count |

### Smart Help Tests (smart-help.test.js)

| Test | What it validates |
|------|-------------------|
| `teaching tip mentions -i` | Auto-tip includes "Use -i" |
| `teaching suggestions have tip property` | Each suggestion has tip field |

### Hub Tests (hub.test.js)

| Test | What it validates |
|------|-------------------|
| `Layer 1 shows [AI] markers` | Commands with `-i` have marker |
| `Layer 2 shows flag count` | "(N options)" appears |
| `Layer 3 shows Options section` | Full flag list rendered |
| `Layer 3 truncates at 8 flags` | Shows "... (+ N more)" |

**Estimated new tests:** ~25

---

## Open Questions

1. **Should research commands also get flag parsing?** — Research commands have simpler flag sets; could do in follow-up.
2. **Should `[AI]` marker appear in quick reference card?** — Probably yes, but may clutter the compact format.

---

## Review Checklist

- [ ] All 14 teaching `.md` files have standardized Options format
- [ ] `extractFlags()` has unit tests for edge cases
- [ ] `CACHE_VERSION` bumped to 2
- [ ] Hub Layer 1/2/3 rendering updated
- [ ] Smart-help tip updated
- [ ] Existing tests pass (2,783 tests)
- [ ] New tests pass (~25 new)
- [ ] `cache.json` deleted before running `npm run test:discovery`
- [ ] Documentation updated (hub.md spec, WHATS-NEW)

---

## Implementation Notes

### Incremental Approach (4 phases)

**Phase 1: Standardize Options format** (~30 min)
- Audit and normalize all 14 teaching command `.md` files
- Verify consistent `**Options:**` header and bullet format

**Phase 2: Discovery engine + cache** (~1 hr)
- Implement `extractFlags()` in `index.js`
- Add `flags` and `hasInstructions` to command objects
- Bump `CACHE_VERSION` to 2
- Write unit tests

**Phase 3: Hub rendering** (~1 hr)
- Update `hub.md` Layer 1 spec for `[AI]` markers
- Update Layer 2 spec for flag count hints
- Update Layer 3 spec for full Options display
- Write hub rendering tests

**Phase 4: Smart help + polish** (~30 min)
- Update `smart-help.js` tips
- Update examples in hub to include `-i`
- Final test run + documentation

**Total estimate:** ~3 hours across 4 phases

---

## History

| Date | Change |
|------|--------|
| 2026-02-13 | Initial spec from deep brainstorm (gap analysis session) |
| 2026-02-13 | Implementation complete — all acceptance criteria met |
