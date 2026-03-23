# What's New in Scholar v2.12.0

**Released:** 2026-02-13 | **Branch:** `feature/hub-flag-discovery`

## Hub Flag Discovery — See Command Options at a Glance

Scholar v2.12.0 enhances the Hub discovery engine to parse, cache, and display command flags/options. Users can now discover features like `-i` (custom instructions) directly from `/scholar:hub` without reading raw `.md` files.

### The Problem

Scholar v2.11.0 added the powerful `-i` flag to 8 teaching commands, but discoverability was poor. The hub showed command names and descriptions but not their options. Users had to read individual command docs to learn about available flags.

### The Solution

The discovery engine now extracts flags from `**Options:**` sections in command `.md` files and exposes them through three hub layers:

| Layer | What's New |
|-------|-----------|
| Overview (Layer 1) | `[AI]` markers on commands that support custom instructions |
| Category (Layer 2) | `(N options -- see details)` hints below each command |
| Detail (Layer 3) | Full Options section with dotted-leader alignment |

### How It Works

```
Command .md files --> extractFlags() --> flags[] + hasInstructions --> cache v2 --> hub rendering
```

1. **`extractFlags()`** parses `**Options:**` sections from each command's `.md` file
2. Each flag gets a structured object: `{ name, short, description, takesValue }`
3. **`hasInstructions`** convenience boolean flags commands with `-i` support
4. Results cached in `cache.json` with version 2 (auto-invalidates old caches)
5. Hub renders flags in all three navigation layers

### Layer 1: AI Markers

The overview now marks AI-capable commands with `[AI]`:

```
| TEACHING (14 commands)                                    |
|   Content ..... exam [AI], quiz [AI], slides [AI],        |
|                 assignment [AI], syllabus [AI],            |
|                 lecture [AI]                               |
|   Assessment .. rubric [AI], feedback [AI]                |
|   Config ...... validate, diff, sync, migrate, demo       |
```

### Layer 2: Flag Count Hints

Category drill-down shows option counts:

```
| CONTENT                                                   |
|   exam             Generate comprehensive exams           |
|                    (12 options -- see details)             |
|   validate         Validate config files                  |
```

Commands with zero flags (config utilities) show no hint.

### Layer 3: Options Section

Detail view includes a full Options display between Usage and Examples:

```
| Options:                                                  |
|   --questions N ........... Number of questions           |
|   --difficulty LEVEL ...... easy, medium, hard            |
|   --instructions / -i ..... Custom instructions for AI    |
|   ... (+ 4 more)                                          |
```

Rules: up to 8 flags with dotted leaders, `... (+ N more)` footer for additional flags, and an `(N options)` count on the Usage line.

---

## Smart Help Enhancements

### Teaching Tips with `-i` Flag

The smart help engine now mentions the `-i` flag in teaching context tips:

```
Tip: You're in a teaching project. Try /teaching:exam or /scholar:hub for all commands.
     Use -i to customize AI generation.
```

Teaching command suggestions include a `tip` property:

```javascript
{ command: 'teaching:exam', description: 'Generate an exam', tip: 'Use -i for custom instructions' }
```

---

## Standardized Options Format

All 8 AI-generating teaching commands now use consistent flag ordering in their `.md` files:

```
- `-i "text"` / `--instructions "text"` - Custom instructions for AI generation
```

Short form (`-i`) comes first, long form (`--instructions`) second. This ensures the discovery engine parses flags consistently.

**Commands updated:** exam, quiz, slides, assignment, syllabus, lecture, feedback, rubric

---

## Architecture

### Flag Object

Each extracted flag is a plain object:

```javascript
{
  name: string,           // e.g. "--questions", "-i"
  short: string | null,   // e.g. "-q", "--instructions"
  description: string,    // e.g. "Number of questions"
  takesValue: boolean     // true if flag accepts a value (VALUE, "text", @file)
}
```

### Extended Command Object

Commands now include two new fields:

| Field | Type | Description |
|-------|------|-------------|
| `flags` | `Flag[]` | Array of parsed flag objects |
| `hasInstructions` | `boolean` | `true` if command supports `-i` / `--instructions` |

### Cache Version

`CACHE_VERSION` bumped from `1` to `2`. Old caches are automatically invalidated and regenerated on first access.

---

## Modified Files

| File | Change |
|------|--------|
| `src/discovery/index.js` | Added `extractFlags()`, `flags` + `hasInstructions` fields, `CACHE_VERSION` 1 -> 2 |
| `src/discovery/smart-help.js` | Added `tip` property to teaching suggestions, `-i` in auto-tip |
| `src/plugin-api/commands/hub.md` | Layer 1/2/3 flag display rendering specs |
| 8 teaching `.md` files | Standardized `-i` / `--instructions` flag order |

## New Tests

| File | Tests | Description |
|------|-------|-------------|
| `tests/discovery/discovery.test.js` | +10 | Flag extraction: shape, content/assessment/config coverage, specific flags |
| `tests/discovery/smart-help.test.js` | +2 | Teaching tip `-i` mention, suggestion `tip` property |
| `tests/commands/hub.test.js` | +3 | Hub rendering: `[AI]` markers, Options display, flag count |

---

## Stats

| Metric | v2.11.0 | v2.12.0 | Change |
|--------|---------|---------|--------|
| Commands | 29 | 29 | -- |
| Commands with flags | 0 (not tracked) | 28 | +28 |
| Commands with `-i` | 8 | 8 | -- |
| node:test tests | 47 | 62 | +15 |
| Cache version | 1 | 2 | +1 |

---

## Backward Compatibility

No breaking changes. The `flags` and `hasInstructions` fields are additive. Existing code that accesses command objects without these fields continues to work. Old v1 caches are silently regenerated as v2 on first access.

---

## Getting Started

```bash
# See AI markers in the overview
/scholar:hub

# See flag count hints in category view
/scholar:hub teaching

# See full Options section for a command
/scholar:hub exam

# Smart help now mentions -i in teaching projects
# (automatic when working in a teaching directory)
```

---

## Related

- [Hub Tutorial](tutorials/getting-started-with-hub.md)
- [API Reference -- Discovery Engine](API-REFERENCE.md#discovery-engine-api-v2120)
- [Custom Instructions (v2.11.0)](WHATS-NEW-v2.11.0.md)
- [CHANGELOG](https://github.com/Data-Wise/scholar/blob/main/CHANGELOG.md)
