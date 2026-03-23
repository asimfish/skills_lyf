---
name: hub
description: Command discovery and navigation hub for all scholar commands
---

# Scholar Hub

Discover and navigate all 33 scholar commands across research and teaching workflows.

**Usage:** `/scholar:hub [argument]`

**Examples:**
- `/scholar:hub` - Show the full command overview
- `/scholar:hub research` - Drill into research commands
- `/scholar:hub teaching` - Drill into teaching commands
- `/scholar:hub exam` - Show details for a specific command
- `/scholar:hub quick` - Compact one-line reference card

## Navigation Layers

| Layer | Argument | What you see |
|-------|----------|--------------|
| Overview | *(none)* | All commands grouped by category |
| Category | `research` or `teaching` | Commands with descriptions and usage |
| Detail | `<command-name>` | Full info, usage, and examples |
| Quick | `quick` | One-line-per-command reference table |

<system>
This command implements a 3-layer navigation hub for discovering all scholar commands.
It uses the discovery engine and smart-help engine to produce formatted output.

## Data Sources

Load command metadata from the discovery engine and context tips from smart-help:

```javascript
import { loadCachedCommands, getCategoryInfo, getCommandDetail } from '${CLAUDE_PLUGIN_ROOT}/src/discovery/index.js';
import { detectContext, getAutoTip } from '${CLAUDE_PLUGIN_ROOT}/src/discovery/smart-help.js';
```

## Argument Parsing

Parse the argument provided after `/scholar:hub`:

- No argument -> Layer 1 (Overview)
- `research` -> Layer 2 (Research drill-down)
- `teaching` -> Layer 2 (Teaching drill-down)
- `quick` -> Quick reference card
- Anything else -> Layer 3 (Command detail lookup)

## Layer 1: Overview (no argument)

Call `loadCachedCommands()` to get all commands. Group them by category and subcategory,
then render the following box-drawing layout:

```
+-----------------------------------------------------------+
| SCHOLAR HUB                                               |
| Academic workflows for research and teaching              |
+-----------------------------------------------------------+
|                                                           |
| RESEARCH (14 commands)                                    |
|   Planning .... analysis-plan, hypothesis, lit-gap,       |
|                 method-scout                              |
|   Manuscript .. methods, proof, results, reviewer         |
|   Literature .. arxiv, bib-add, bib-search, doi           |
|   Simulation .. design, analysis                          |
|                                                           |
| TEACHING (15 commands)                                    |
|   Content ..... exam, quiz, slides, assignment,           |
|                 solution, syllabus, lecture                |
|   Assessment .. rubric, feedback                          |
|   Config ...... validate, diff, sync, migrate, demo,      |
|                 config                                    |
|                                                           |
+-----------------------------------------------------------+
| /scholar:hub research    Drill into research commands     |
| /scholar:hub teaching    Drill into teaching commands     |
| /scholar:hub quick       Compact reference card           |
+-----------------------------------------------------------+
```

Rules for Layer 1 rendering:
- Count commands per category dynamically from `loadCachedCommands()`
- Group research commands by subcategory: planning, manuscript, literature, simulation
- Group teaching commands by subcategory: content, assessment, config
- Use dotted leaders (periods) to align subcategory names with command lists
- Wrap long command lists onto the next line, indented to align with the first command
- After the box, call `detectContext(process.cwd())` from smart-help and append
  the result of `getAutoTip(context)` as a final line below the box

### AI Markers in Layer 1

For each command in the overview, check `hasInstructions` from the discovery engine.
If `hasInstructions === true`, append `[AI]` after the command's short name.

Example with AI markers applied:

```
| TEACHING (15 commands)                                    |
|   Content ..... exam [AI], quiz [AI], slides [AI],        |
|                 assignment [AI], solution [AI],            |
|                 syllabus [AI], lecture [AI]                |
|   Assessment .. rubric [AI], feedback [AI]                |
|   Config ...... validate, diff, sync, migrate, demo,      |
|                 config                                    |
```

Rules for AI markers:
- Only display `[AI]` when the command's `hasInstructions` field is `true`
- The marker goes immediately after the short name, before the comma or line end
- The 9 AI-capable teaching commands are: exam, quiz, slides, assignment, solution, syllabus, lecture, rubric, feedback
- Research commands may also have AI markers — always derive from `hasInstructions`, not a hardcoded list
- Account for the extra width of `[AI]` markers when wrapping command lists within the box

## Layer 2: Category Drill-Down (`research` or `teaching`)

Call `getCategoryInfo(category)` which returns an object keyed by subcategory,
each value being an array of command objects with `name`, `description`, `usage`, `examples`.

Render a box for the category with each subcategory as a section:

```
+-----------------------------------------------------------+
| RESEARCH COMMANDS (14)                                    |
+-----------------------------------------------------------+
|                                                           |
| PLANNING                                                  |
|   analysis-plan  Create comprehensive statistical         |
|                  analysis plan                            |
|   hypothesis     Formulate and refine hypotheses          |
|   lit-gap        Identify literature gaps                 |
|   method-scout   Scout statistical methods for a problem  |
|                                                           |
| MANUSCRIPT                                                |
|   methods        Draft methods section                    |
|   proof          Proofread manuscript                     |
|   results        Write results section                    |
|   reviewer       Simulate peer reviewer                   |
|                                                           |
| LITERATURE                                                |
|   arxiv          Search arXiv preprints                   |
|   bib-add        Add citation to bibliography             |
|   bib-search     Search bibliography database             |
|   doi            Look up paper by DOI                     |
|                                                           |
| SIMULATION                                                |
|   design         Design a simulation study                |
|   analysis       Analyze simulation results               |
|                                                           |
+-----------------------------------------------------------+
| Run /scholar:hub <command> for details and examples       |
+-----------------------------------------------------------+
```

Rules for Layer 2 rendering:
- Display the category name in uppercase in the header
- Show the command count in parentheses
- For each subcategory, show the subcategory name in uppercase as a section header
- List each command with its short name (strip the namespace prefix) and description
- If a description is longer than ~40 characters, wrap it to the next line with indentation
- Include a footer line directing users to Layer 3

### Flag Count Hints in Layer 2

For each command that has `flags.length > 0`, show a hint line below its description
indicating how many options are available.

Example with flag count hints:

```
| CONTENT                                                   |
|   exam             Generate comprehensive exams           |
|                    (12 options — see details)              |
|   quiz             Create quizzes from course material    |
|                    (10 options — see details)              |
|   slides           Build lecture slides                   |
|                    (8 options — see details)               |
|   validate         Validate config files                  |
```

Rules for flag count hints:
- Only show the hint when `flags.length > 0` for that command
- Format: `(N options — see details)` where N is `flags.length`
- Indent the hint to align with the description column (same column as description text)
- Commands with zero flags (e.g., config commands) show no hint line
- The em dash (`—`) is literal, not two hyphens

## Layer 3: Command Detail (specific command name)

Call `getCommandDetail(name)` which accepts full names like `research:analysis-plan`
or short names like `analysis-plan` or `exam`.

If the command is found, render:

```
+-----------------------------------------------------------+
| COMMAND: analysis-plan                                    |
+-----------------------------------------------------------+
|                                                           |
| Name:        research:analysis-plan                       |
| Category:    research > planning                          |
| Description: Create comprehensive statistical analysis    |
|              plan                                         |
|                                                           |
| Usage:                                                    |
|   /research:analysis-plan <study-description>             |
|                                                           |
| Examples:                                                 |
|   /research:analysis-plan "mediation analysis with        |
|     binary outcome"                                       |
|   /research:analysis-plan "longitudinal study with        |
|     missing data"                                         |
|                                                           |
+-----------------------------------------------------------+
```

If the command is not found, show:

```
Command "<name>" not found.

Did you mean one of these?
  /scholar:hub research   - Browse research commands
  /scholar:hub teaching   - Browse teaching commands
  /scholar:hub quick      - See all commands at a glance
```

Rules for Layer 3 rendering:
- Show the short name in the header
- Show full namespaced name, category > subcategory path, and description
- Show usage if available (from `usage` field)
- Show the Options section (see below) between Usage and Examples
- Show up to 2 examples if available (from `examples` array)
- If `hasInstructions === true`, include an example using `-i` in the Examples section
- Wrap long lines within the box at ~55 characters

### Options Section in Layer 3

When the command has `flags.length > 0`, render an Options section between Usage and
Examples. Show up to 8 flags with dotted leaders for alignment, then a `... (+ N more)`
footer if additional flags exist.

Also append a count hint to the Usage line: `(N options)` after the usage pattern.

Example detail view with Options:

```
+-----------------------------------------------------------+
| COMMAND: exam                                             |
+-----------------------------------------------------------+
|                                                           |
| Name:        teaching:exam                                |
| Category:    teaching > content                           |
| Description: Generate comprehensive exams from course     |
|              material                                     |
|                                                           |
| Usage:                                                    |
|   /teaching:exam <topic> (12 options)                     |
|                                                           |
| Options:                                                  |
|   --questions N ........... Number of questions           |
|   --difficulty LEVEL ...... easy, medium, hard            |
|   --format FORMAT ......... md, qmd, tex, json            |
|   --time-limit MINS ...... Exam duration in minutes       |
|   --question-types TYPES .. mc, short, essay, calc        |
|   --points N .............. Total point value             |
|   --instructions / -i ..... Custom instructions for AI    |
|   --solution .............. Include answer key            |
|   ... (+ 4 more)                                          |
|                                                           |
| Examples:                                                 |
|   /teaching:exam "intro stats midterm"                    |
|   /teaching:exam "regression" --questions 15              |
|   /teaching:exam "ANOVA" -i "focus on repeated           |
|     measures designs"                                     |
|                                                           |
+-----------------------------------------------------------+
```

Rules for Options section:
- Only render the Options section when `flags.length > 0`
- Show each flag as `--name VALUE ......... description` with dotted leaders
- If a flag has an `alias`, show it as `--name / -alias` (e.g., `--instructions / -i`)
- Show up to 8 flags maximum
- If `flags.length > 8`, show `... (+ N more)` where N = `flags.length - 8`
- The dotted leaders align all descriptions to the same column
- On the Usage line, append `(N options)` after the usage pattern where N = `flags.length`
- If `hasInstructions === true`, add a third example demonstrating the `-i` flag
  with a realistic custom instruction string for that command's domain

## Quick Reference Card (`quick`)

Call `loadCachedCommands()` and render a compact table:

```
+-----------------------------------------------------------+
| SCHOLAR QUICK REFERENCE                                   |
+-----------------------------------------------------------+
|                                                           |
| RESEARCH                                                  |
|   /research:analysis-plan ... Statistical analysis plan   |
|   /research:hypothesis ...... Formulate hypotheses        |
|   /research:lit-gap ......... Identify literature gaps    |
|   /research:method-scout .... Scout statistical methods   |
|   /manuscript:methods ....... Draft methods section       |
|   /manuscript:proof ......... Proofread manuscript        |
|   /manuscript:results ....... Write results section       |
|   /manuscript:reviewer ...... Simulate peer reviewer      |
|   /literature:arxiv ......... Search arXiv preprints      |
|   /literature:bib-add ....... Add citation to bib         |
|   /literature:bib-search .... Search bibliography         |
|   /literature:doi ........... Look up paper by DOI        |
|   /simulation:design ........ Design simulation study     |
|   /simulation:analysis ...... Analyze simulation results  |
|                                                           |
| TEACHING                                                  |
|   /teaching:exam [AI] ....... Generate exams              |
|   /teaching:quiz [AI] ....... Create quizzes              |
|   /teaching:slides [AI] ..... Build lecture slides        |
|   /teaching:assignment [AI] . Create assignments          |
|   /teaching:solution [AI] ... Generate solution keys      |
|   /teaching:syllabus [AI] ... Generate syllabus           |
|   /teaching:lecture [AI] .... Produce lecture notes        |
|   /teaching:rubric [AI] ..... Create grading rubric       |
|   /teaching:feedback [AI] ... Generate student feedback   |
|   /teaching:validate ........ Validate config files       |
|   /teaching:diff ............ Diff config versions        |
|   /teaching:sync ............ Sync config changes         |
|   /teaching:migrate ......... Migrate config schema       |
|   /teaching:demo ............ Scaffold demo course        |
|   /teaching:config .......... Manage config & prompts     |
|                                                           |
+-----------------------------------------------------------+
| /scholar:hub <command>  for details and examples          |
+-----------------------------------------------------------+
```

Rules for Quick Reference rendering:
- One line per command, using dotted leaders to align descriptions
- Use the full namespaced command name (as it would be invoked)
- Truncate descriptions to fit within the box width
- Group under RESEARCH and TEACHING headers
- Append `[AI]` after the command name when `hasInstructions === true`
- Adjust dotted leaders to account for `[AI]` marker width
- Include a footer directing users to Layer 3

## Smart Help Integration

On Layer 1 (overview) only, after rendering the main box, append a context-aware tip:

```javascript
const context = detectContext(process.cwd());
const tip = getAutoTip(context);
```

Display the tip on a line below the box, for example:

```
Tip: You're in a teaching project. Try /teaching:exam or /scholar:hub for all commands
```

This helps first-time users discover relevant commands for their current project.

## Formatting Rules

1. Use `+` for corners, `-` for horizontal borders, `|` for vertical borders
2. Box width is 61 characters (including the border characters)
3. Left-pad content with one space after the `|` border
4. Right-pad content with spaces before the closing `|` to maintain box width
5. Render the output as a single fenced code block so it displays with monospace font
6. All command names in the box use their short form (no `/scholar:` prefix) except
   in the quick reference where full invocation names are shown
7. Category and subcategory headers are UPPERCASE
8. The overview footer shows the three navigation options with aligned descriptions
</system>
