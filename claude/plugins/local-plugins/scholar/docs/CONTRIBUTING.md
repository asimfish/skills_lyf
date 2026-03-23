# Contributing to Scholar

Welcome to Scholar! This guide will help you contribute effectively to the academic workflows plugin for Claude Code.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Adding New Features](#adding-new-features)
4. [Testing](#testing)
5. [Documentation](#documentation)
6. [Code Style](#code-style)
7. [Release Process](#release-process)
8. [Community Guidelines](#community-guidelines)

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.19.0
- **Git** >= 2.30
- **Claude Code CLI** or **Claude Desktop** app
- (Optional) **Quarto** for testing lecture generation
- (Optional) **pdflatex** for testing LaTeX exports

### Fork and Clone

```bash
# Fork the repository on GitHub first
# https://github.com/Data-Wise/scholar/fork

# Clone your fork
git clone https://github.com/YOUR-USERNAME/scholar.git
cd scholar

# Add upstream remote
git remote add upstream https://github.com/Data-Wise/scholar.git
```

### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install dev dependencies
npm install --include=dev
```

### Set Up Development Environment

```bash
# Install plugin in development mode (symlink)
./scripts/install.sh --dev

# Verify installation
ls -la ~/.claude/plugins/scholar

# Run test suite
npm test
```

Expected output:
```
Test Suites: 56 passed, 56 total
Tests:       {{ scholar.test_count }} passed, {{ scholar.test_count }} total
Time:        3.17s
```

### Verify Plugin Structure

```bash
./tests/test-plugin-structure.sh
```

Expected output:
```
✅ All tests passed (10/10)
- Plugin structure valid
- {{ scholar.command_count }} commands present ({{ scholar.teaching_commands }} teaching + {{ scholar.research_commands }} research + {{ scholar.hub_commands }} hub)
- 17 skills present
- No hardcoded paths
- v2.8.0 verified
```

---

## Development Workflow

Scholar follows a **strict Git workflow** to maintain code quality and prevent accidental commits to protected branches.

### Branch Architecture

```
main (production)
  ↑ PR only
dev (planning & integration hub)
  ↑ branch from here
feature/* (isolated implementation)
```

| Branch | Purpose | Direct Commits | Protection |
|--------|---------|----------------|------------|
| `main` | Production release | ❌ NEVER | ✅ Protected |
| `dev` | Planning & integration | ⚠️ Planning only | Merge destination |
| `feature/*` | Implementation work | ✅ Yes | Isolated in worktrees |

### Workflow Steps

#### Step 1: Plan on `dev` (BEFORE coding)

**Main repo stays on `main`** - Never switch to dev!

```bash
cd ~/projects/dev-tools/scholar
git branch --show-current  # Should show: main

# Sync with upstream
git fetch upstream
git merge upstream/dev
```

Analyze requirements, create a plan, and **wait for approval** in a GitHub issue or PR discussion.

#### Step 2: Create Worktree (AFTER approval)

```bash
# Create a feature worktree branching FROM dev
git worktree add ~/.git-worktrees/scholar/feature-<name> -b feature/<name> dev

# Example: Adding a new teaching command
git worktree add ~/.git-worktrees/scholar/feature-teaching-demo -b feature/teaching-demo dev
```

**CRITICAL:**
- ❌ NEVER `git checkout dev` in main repo
- ❌ NEVER write feature code on dev branch
- ✅ ALWAYS create worktree branching FROM dev

#### Step 3: Atomic Development (in worktree)

```bash
cd ~/.git-worktrees/scholar/feature-<name>

# Make changes
# ...

# Commit with conventional commits format
git add src/teaching/commands/demo.js
git commit -m "feat(teaching): add demo course generator"

# Continue development
git commit -m "test(teaching): add 35 tests for demo templates"
git commit -m "docs(teaching): add demo command documentation"
```

#### Step 4: Integration (feature → dev)

```bash
# Push feature branch
git push origin feature/<name>

# Create PR targeting dev branch
gh pr create --base dev --head feature/<name> \
  --title "feat: Add teaching demo command" \
  --body "Implements #42. Adds /teaching:demo command with..."

# After merge, cleanup
git worktree remove ~/.git-worktrees/scholar/feature-<name>
git branch -d feature/<name>
```

#### Step 5: Release (dev → main)

Releases are managed by maintainers only.

```bash
# Maintainer creates release PR
gh pr create --base main --head dev \
  --title "Release: v2.6.0" \
  --body "See CHANGELOG.md for details"
```

### Conventional Commits Format

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring without behavior change
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `chore:` - Build process, dependencies, tooling

**Scopes:**
- `teaching` - Teaching module changes
- `research` - Research module changes
- `core` - Core infrastructure
- `ci` - CI/CD configuration
- `schemas` - JSON Schema changes

**Examples:**
```bash
git commit -m "feat(teaching): add lecture refinement with --refine flag"
git commit -m "fix(teaching): resolve path traversal in --output-dir"
git commit -m "test(teaching): add 30 security tests for v2.5.0"
git commit -m "docs(teaching): update API reference with new flags"
```

### Quick Reference

| Scenario | Command |
|----------|---------|
| Start feature | `git worktree add ~/.git-worktrees/scholar/feature-<name> -b feature/<name> dev` |
| Check branch | `git branch --show-current` |
| List worktrees | `git worktree list` |
| Create PR | `gh pr create --base dev` |
| Release | `gh pr create --base main --head dev` |

---

## Adding New Features

### Teaching Commands vs Research Commands

Scholar has two main command namespaces:

**Teaching Commands** (`/teaching:*`)
- Located in `src/teaching/commands/`
- Use AI generation, templates, config loader
- Require validation and formatting
- Example: `/teaching:quiz`, `/teaching:exam`, `/teaching:lecture`

**Research Commands** (`/scholar:*`, `/manuscript:*`, `/simulation:*`)
- Located in `src/plugin-api/commands/`
- May use shell API wrappers (`lib/`)
- Focus on literature, manuscript writing, analysis
- Example: `/arxiv`, `/doi`, `/manuscript:methods`

### Plugin Architecture Overview

```
scholar/
├── src/
│   ├── teaching/              # Teaching module (Phase 0 foundation)
│   │   ├── commands/          # Teaching command handlers
│   │   ├── templates/         # JSON templates for exams, quizzes, etc.
│   │   ├── validators/        # Schema validation + coverage
│   │   ├── generators/        # AI generation (lecture-notes, lecture-refiner)
│   │   ├── formatters/        # Output formatters (md/qmd/tex/json)
│   │   ├── utils/             # Utilities (slugify, qmd-parser, preview-launcher)
│   │   ├── ai/                # AI provider wrapper + prompt discovery
│   │   └── config/            # Config loader + sync engine
│   ├── plugin-api/            # Plugin command definitions
│   │   ├── commands/          # Research command markdown files
│   │   └── skills/            # A-grade skills (17 total)
│   └── core/                  # Business logic (future MCP)
├── lib/                       # Shell API wrappers
│   ├── arxiv-api.sh
│   ├── crossref-api.sh
│   └── bibtex-utils.sh
├── tests/                     # Test suite ({{ scholar.test_count }} tests)
│   ├── teaching/              # Teaching command tests
│   ├── integration/           # Integration tests
│   └── fixtures/              # Test fixtures
└── docs/                      # Documentation (94 markdown files)
```

### Creating New Teaching Commands

#### Step 1: Create Template

Create a JSON template in `src/teaching/templates/<command>.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Demo Course Template",
  "type": "object",
  "properties": {
    "course_name": { "type": "string" },
    "files": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["course_name", "files"]
}
```

#### Step 2: Create Worktree

```bash
git worktree add ~/.git-worktrees/scholar/feature-teaching-demo \
  -b feature/teaching-demo dev
cd ~/.git-worktrees/scholar/feature-teaching-demo
```

#### Step 3: Implement Command Handler

Create `src/teaching/commands/<command>.js`:

```javascript
import { loadTemplate } from '../templates/loader.js';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';

export async function generateDemo(options) {
  // 1. Load config
  const config = loadTeachConfig(process.cwd());

  // 2. Load template
  const template = loadTemplate('demo');

  // 3. Generate content
  const content = {
    course_name: options.courseName || 'STAT-101',
    files: ['README.md', 'teach-config.yml', 'week01.yml']
  };

  // 4. Validate
  const validator = new ValidatorEngine();
  const validation = validator.validate(content, template);

  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  return content;
}
```

#### Step 4: Add Command Definition

Create `src/plugin-api/commands/teaching/demo.md`:

```markdown
---
name: teaching:demo
description: Create demo course environment with sample materials
---

# Demo Course Generator

Create a complete demo course environment for testing Scholar commands.

## Usage

```bash
/teaching:demo [path]
/teaching:demo --verify
```

## Options

- `path` - Output directory (default: ./scholar-demo-course)
- `--verify` - Run smoke tests after creation
- `--force` - Overwrite existing files
- `--quiet` - Suppress output (CI mode)

<system>
This command creates a demo course with:
- teach-config.yml configuration
- Sample lesson plans (week01-04.yml)
- README with quick start instructions
- Example outputs for all teaching commands

Implementation in src/teaching/commands/demo.js
</system>
```

#### Step 5: Add Formatters (if needed)

Create formatters in `src/teaching/formatters/<format>.js`:

```javascript
export function formatDemo(content, template) {
  // Convert content to markdown, Quarto, LaTeX, or JSON
  return {
    content: formattedString,
    filename: 'demo-course.md',
    format: 'markdown'
  };
}
```

#### Step 6: Write Unit Tests

Create `tests/teaching/<command>.test.js`:

```javascript
import { describe, it, expect } from '@jest/globals';
import { generateDemo } from '../../src/teaching/commands/demo.js';

describe('Demo Course Generator', () => {
  it('creates demo course with default options', async () => {
    const result = await generateDemo({});
    expect(result.course_name).toBe('STAT-101');
    expect(result.files).toHaveLength(3);
  });

  it('validates course name is required', async () => {
    await expect(generateDemo({ courseName: '' }))
      .rejects.toThrow('course_name is required');
  });

  // Add 30+ more tests...
});
```

#### Step 7: Test Manually

```bash
# In worktree
npm test -- --testPathPattern="demo"

# Test with real usage
claude

> /teaching:demo ./test-course
```

#### Step 8: Update Documentation

Update relevant docs:
- `docs/API-REFERENCE.md` - Add command API
- `docs/REFCARD.md` - Add quick reference
- `README.md` - Add to command list
- `CHANGELOG.md` - Add to [Unreleased] section

#### Step 9: Rebase and Merge

```bash
# In worktree, rebase on latest dev
git fetch origin
git rebase origin/dev

# Push and create PR
git push origin feature/teaching-demo
gh pr create --base dev --head feature/teaching-demo
```

### Creating New Skills

Skills are markdown files in `src/plugin-api/skills/`. They automatically activate based on context.

#### Step 1: Create Skill File

Create `src/plugin-api/skills/<skill-name>.md`:

```markdown
---
name: proof-architect
grade: A+
expertise: Mathematical proofs and theorem proving
activation_context: ["proof", "theorem", "lemma", "proposition"]
---

# Proof Architect

Expert in rigorous proof construction and validation.

## Capabilities

- Construct rigorous mathematical proofs
- Validate proof correctness
- Identify gaps in reasoning
- Suggest proof strategies

## Activation

This skill activates when:
- Writing mathematical proofs
- Reviewing theorem statements
- Validating lemmas
- Constructing derivations

<system>
When this skill is active:
1. Use precise mathematical language
2. Cite relevant theorems and definitions
3. Show all intermediate steps
4. Validate assumptions and conditions
5. Provide alternative proof approaches
</system>
```

#### Step 2: Test Skill Activation

```bash
claude

> I need to prove that OLS estimators are unbiased under classical assumptions
# proof-architect skill should activate
```

### Adding New Output Formats

Create formatter in `src/teaching/formatters/<format>.js`:

```javascript
export function formatCustom(content, template) {
  // Transform content to custom format
  const output = transformContent(content);

  return {
    content: output,
    filename: generateFilename(content, 'custom'),
    format: 'custom'
  };
}

function transformContent(content) {
  // Implementation...
  return formattedString;
}
```

Add format to command handlers:

```javascript
// In src/teaching/commands/<command>.js
import { formatCustom } from '../formatters/custom.js';

const formatters = {
  markdown: formatMarkdown,
  quarto: formatQuarto,
  latex: formatLatex,
  custom: formatCustom  // Add new formatter
};
```

Add conversion tests:

```javascript
// In tests/teaching/<command>.test.js
describe('Custom format export', () => {
  it('converts to custom format', () => {
    const result = formatCustom(sampleContent, template);
    expect(result.format).toBe('custom');
    expect(result.content).toContain('<!-- custom format -->');
  });
});
```

---

## Testing

Scholar uses Jest for testing with ES modules support.

### Test Coverage Requirements

**Minimum 80% coverage** for new code.

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern="teaching/lecture"

# Run with coverage
npm test -- --coverage

# Watch mode (for development)
npm test -- --watch
```

### Test Structure

```
tests/
├── teaching/              # Teaching command tests ({{ scholar.test_count }} tests)
│   ├── exam.test.js
│   ├── quiz.test.js
│   ├── lecture-notes.test.js
│   ├── lecture-refiner.test.js
│   ├── lecture-coverage.test.js
│   └── ...
├── integration/           # Integration tests (271 tests)
│   ├── e2e-fix-workflow.test.js
│   ├── batch-migration.test.js
│   └── ...
├── fixtures/              # Test fixtures
│   ├── teach-config.yml
│   ├── week01.yml
│   └── ...
└── setup.js              # Test setup (mock Anthropic API)
```

### Unit Tests

Test individual functions and modules in isolation.

```javascript
import { describe, it, expect } from '@jest/globals';
import { slugify } from '../../src/teaching/utils/slugify.js';

describe('slugify()', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Linear Regression')).toBe('linear-regression');
  });

  it('removes special characters', () => {
    expect(slugify('Stats 101: Intro')).toBe('stats-101-intro');
  });

  it('truncates to 80 characters', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });

  // Edge cases
  it('handles empty string', () => {
    expect(slugify('')).toBe('untitled');
  });

  it('handles path traversal attempts', () => {
    expect(slugify('../../../etc/passwd')).not.toContain('..');
  });
});
```

### Integration Tests

Test interactions between multiple components.

```javascript
import { describe, it, expect } from '@jest/globals';
import { generateLecture } from '../../src/teaching/commands/lecture.js';

describe('Lecture Generation Integration', () => {
  it('generates lecture from lesson plan', async () => {
    const result = await generateLecture({
      fromPlan: 'week03',
      format: 'quarto',
      outputDir: './content/lectures'
    });

    expect(result.success).toBe(true);
    expect(result.file).toContain('week03-');
    expect(result.sections).toHaveLength(6);
  });

  it('validates generated content', async () => {
    const result = await generateLecture({ topic: 'Linear Regression' });
    expect(result.validation.isValid).toBe(true);
  });
});
```

### E2E Tests

Test complete user workflows end-to-end.

```javascript
import { describe, it, expect } from '@jest/globals';
import fs from 'fs';

describe('E2E: Weekly Lecture Production', () => {
  it('generates, refines, and validates lecture', async () => {
    // Step 1: Generate initial lecture
    const generate = await generateLecture({
      fromPlan: 'week03',
      outputDir: './test-output'
    });
    expect(generate.success).toBe(true);

    // Step 2: Refine a section
    const refine = await refineLecture({
      file: generate.file,
      section: 'Introduction',
      instruction: 'Add more motivation'
    });
    expect(refine.success).toBe(true);

    // Step 3: Validate coverage
    const validate = await validateCoverage({
      file: generate.file,
      weekId: 'week03'
    });
    expect(validate.coverage).toBeGreaterThan(90);

    // Cleanup
    fs.unlinkSync(generate.file);
  });
});
```

### Running Specific Test Suites

```bash
# Teaching commands only
npm test -- --testPathPattern="tests/teaching"

# Integration tests only
npm test -- --testPathPattern="tests/integration"

# Specific command
npm test -- --testPathPattern="lecture-notes"

# Security tests
npm test -- --testPathPattern="security"

# Coverage report
npm test -- --coverage --coverageReporters=text
```

### Test Fixtures

Use fixtures for consistent test data:

```javascript
// tests/fixtures/teach-config.yml
scholar:
  course_info:
    course_code: "STAT-101"
    course_name: "Introduction to Statistics"
    level: "undergraduate"
    field: "statistics"
  defaults:
    exam_format: "markdown"
    question_types:
      - "multiple-choice"
      - "short-answer"
```

Load fixtures in tests:

```javascript
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');

function loadFixture(filename) {
  const content = fs.readFileSync(path.join(fixturesDir, filename), 'utf8');
  return yaml.load(content);
}

const config = loadFixture('teach-config.yml');
```

### Debugging Test Failures

```bash
# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- tests/teaching/lecture-notes.test.js

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Check test output directory
ls -la tests/teaching/output/
```

---

## Documentation

Scholar uses MkDocs for documentation with 94 markdown files.

### MkDocs Structure

```
docs/
├── index.md                    # Homepage
├── REFCARD.md                  # Quick reference
├── USER-GUIDE.md               # User guide
├── API-REFERENCE.md            # API documentation
├── TEACHING-COMMANDS-API.md    # Teaching command reference
├── ARCHITECTURE-DIAGRAMS.md    # System architecture
├── LECTURE-PIPELINE-DIAGRAMS.md # Lecture generation flows
├── TEACHING-STYLE-GUIDE.md     # Style configuration guide
├── OUTPUT-FORMATS-GUIDE.md     # Format conversion guide
├── TESTING-GUIDE.md            # Testing documentation
├── SECURITY-TESTING-GUIDE.md   # Security threat model
├── specs/                      # Technical specifications
│   ├── SPEC-v2.5.0-*.md
│   ├── SPEC-v2.6.0-*.md
│   └── ...
├── teaching/                   # Teaching documentation
│   ├── getting-started.md
│   ├── commands/
│   └── tutorials/
└── research/                   # Research documentation
    ├── getting-started.md
    └── commands/
```

### Writing Tutorials vs References

**Tutorials** (task-oriented):
- Step-by-step instructions
- Real-world examples
- Assumes beginner knowledge
- Located in `docs/teaching/tutorials/`

**References** (information-oriented):
- Complete API documentation
- All options and flags
- Technical details
- Located in `docs/API-REFERENCE.md`

### Adding Examples

Add examples to `docs/COMMAND-EXAMPLES.md`:

```markdown
### Example: Generate Weekly Lecture

Generate a lecture for week 3 with previous context:

```bash
/teaching:lecture "Linear Regression" \
  --from-plan=week03 \
  --context=previous \
  --output-dir=content/lectures
```

**Output:**
- File: `content/lectures/week03-linear-regression.qmd`
- Sections: 6 (introduction, theory, worked-example, visualization, summary, exercises)
- Context: Weeks 1-2 lesson plans included
- Metadata: Scholar provenance in YAML comments
```

### Updating CHANGELOG.md

Add entries to `[Unreleased]` section:

```markdown
## [Unreleased]

### Added

- `/teaching:demo` command for creating demo course environments
- Support for custom prompt templates in `.flow/templates/prompts/`

### Changed

- Improved error messages in validation engine
- Updated dependency `ajv` to v8.17.1

### Fixed

- Path traversal vulnerability in `--output-dir` flag
- Shell injection in preview-launcher (now uses spawn)
```

### Version Numbering

Scholar follows [Semantic Versioning](https://semver.org/):

- **Major** (v3.0.0): Breaking changes
- **Minor** (v2.6.0): New features, backward compatible
- **Patch** (v2.8.0): Bug fixes, no new features

Update version in:
- `package.json`
- `.claude-plugin/plugin.json`
- `docs/index.md` (version badge)

### Building Documentation Locally

```bash
# Install MkDocs
pip install mkdocs mkdocs-material

# Serve locally
mkdocs serve

# Open http://localhost:8000
```

### Documentation Style Guide

- Use **bold** for UI elements and file paths
- Use `code` for commands, variables, and code snippets
- Use > blockquotes for important notes
- Use tables for structured data
- Use Mermaid diagrams for architecture
- Use numbered lists for sequential steps
- Use bullet lists for non-sequential items

---

## Code Style

### ESLint Configuration

Scholar uses ESLint v9 with flat config:

```javascript
// eslint.config.js
export default [
  { ignores: ["node_modules/", "coverage/", "site/"] },
  {
    files: ["src/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.jest }
    },
    rules: {
      "no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error"
    }
  }
];
```

Run linter:

```bash
# Check for errors
npm run lint

# Auto-fix errors
npm run lint:fix
```

### Naming Conventions

**Files:**
- Commands: `kebab-case.js` (e.g., `lecture-notes.js`)
- Tests: `kebab-case.test.js` (e.g., `lecture-notes.test.js`)
- Utilities: `kebab-case.js` (e.g., `qmd-parser.js`)

**Variables:**
- Functions: `camelCase` (e.g., `generateLecture()`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Classes: `PascalCase` (e.g., `AIProvider`)
- Private: `_leadingUnderscore` (e.g., `_parseYaml()`)

**Exports:**
- Named exports for utilities: `export function slugify() {}`
- Default exports for classes: `export default class AIProvider {}`

### Comment Standards

Use JSDoc comments for all public functions:

```javascript
/**
 * Generate lecture notes from topic or lesson plan.
 *
 * @param {Object} options - Generation options
 * @param {string} options.topic - Lecture topic (required if no fromPlan)
 * @param {string} [options.fromPlan] - Lesson plan week ID (e.g., 'week03')
 * @param {number} [options.duration=50] - Lecture duration in minutes
 * @param {string} [options.format='quarto'] - Output format (markdown/quarto/json)
 * @param {string} [options.outputDir] - Output directory path
 * @returns {Promise<Object>} Generation result with file path and sections
 * @throws {Error} If validation fails or API call errors
 *
 * @example
 * const result = await generateLecture({
 *   fromPlan: 'week03',
 *   format: 'quarto',
 *   outputDir: './content/lectures'
 * });
 */
export async function generateLecture(options) {
  // Implementation...
}
```

Use inline comments for complex logic:

```javascript
// Use Unicode Private Use Area as placeholders to preserve LaTeX math
// while escaping special characters
const mathPlaceholders = [];
let id = 0;

text = text.replace(/\$([^$]+)\$/g, (match, content) => {
  mathPlaceholders.push(match);
  return `\uE000${id++}\uE001`;  // U+E000 and U+E001 are safe placeholders
});
```

### File Organization

**Command files:**
```javascript
// 1. Imports
import { loadTemplate } from '../templates/loader.js';
import { loadTeachConfig } from '../config/loader.js';

// 2. Constants
const MAX_RETRIES = 3;
const DEFAULT_DURATION = 50;

// 3. Main export function
export async function generateCommand(options) {
  // Implementation
}

// 4. Helper functions (private)
function _validateOptions(options) {
  // Validation logic
}

function _formatOutput(content, format) {
  // Formatting logic
}
```

**Test files:**
```javascript
// 1. Imports
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { generateCommand } from '../../src/teaching/commands/command.js';

// 2. Test fixtures
const sampleConfig = { /* ... */ };
const sampleTemplate = { /* ... */ };

// 3. Test suites
describe('Command Generator', () => {
  describe('Basic functionality', () => {
    it('generates with default options', async () => {
      // Test implementation
    });
  });

  describe('Error handling', () => {
    it('throws on invalid input', async () => {
      // Test implementation
    });
  });
});
```

---

## Release Process

Releases are managed by maintainers. Contributors should focus on creating PRs to the `dev` branch.

### Version Bumping

Update version in 3 files:
- `package.json`
- `.claude-plugin/plugin.json`
- `docs/index.md` (badge)

### GitHub Releases

Maintainers create releases from the `main` branch:

```bash
# On main branch after PR merge
gh release create v2.6.0 \
  --title "v2.6.0 - Documentation Reorganization" \
  --notes-file RELEASE-NOTES.md \
  --target main
```

### Homebrew Formula Updates

Homebrew formula is automatically updated via GitHub Actions:

`.github/workflows/homebrew-release.yml` triggers on release creation and:
1. Calculates SHA-256 of tarball
2. Updates formula in `data-wise/homebrew-tap`
3. Commits and pushes changes

### npm Publishing (Future)

Scholar is not yet published to npm. When ready:

```bash
# After version bump
npm publish --access public
```

---

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the Golden Rule

### Issue Reporting

Create issues at https://github.com/Data-Wise/scholar/issues

**Bug Report Template:**
```markdown
**Bug Description:**
Clear description of the bug.

**Steps to Reproduce:**
1. Run command `/teaching:quiz "topic"`
2. Observe error message

**Expected Behavior:**
What should happen.

**Actual Behavior:**
What actually happens.

**Environment:**
- Scholar version: v2.8.0
- Node version: 18.19.0
- OS: macOS 14.2
- Claude Code version: 0.4.0
```

**Feature Request Template:**
```markdown
**Feature Description:**
Clear description of the feature.

**Use Case:**
Why is this feature needed? What problem does it solve?

**Proposed Solution:**
How might this feature be implemented?

**Alternatives Considered:**
Other approaches you've thought about.
```

### Feature Requests

Submit feature requests as GitHub issues with the `enhancement` label.

**Before requesting:**
1. Search existing issues to avoid duplicates
2. Check the project roadmap to see if it's planned
3. Provide concrete use cases and examples
4. Consider implementation complexity

### Getting Help

**Resources:**
- Documentation: https://Data-Wise.github.io/scholar/
- GitHub Issues: https://github.com/Data-Wise/scholar/issues
- Discussions: https://github.com/Data-Wise/scholar/discussions

**Questions:**
- Open a GitHub Discussion for general questions
- Open a GitHub Issue for specific bugs or feature requests
- Check existing docs before asking

**Response Time:**
- Bug reports: 1-3 business days
- Feature requests: 1-2 weeks
- Documentation questions: 1-3 business days

### Contact Information

**Maintainer:** Data-Wise (dt@stat-wise.com)

**Repository:** https://github.com/Data-Wise/scholar

**Related Projects:**
- [craft](https://github.com/Data-Wise/craft) - Full-stack developer toolkit
- [rforge](https://github.com/Data-Wise/claude-plugins/tree/main/rforge) - R package ecosystem orchestrator
- [flow-cli](https://github.com/Data-Wise/flow-cli) - ZSH workflow automation

---

## Troubleshooting Common Setup Issues

### Plugin Not Loading

**Symptom:** Commands not available in Claude Code

**Solution:**
```bash
# Verify installation
ls -la ~/.claude/plugins/scholar

# Check plugin.json is valid
cat ~/.claude/plugins/scholar/.claude-plugin/plugin.json | jq

# Reinstall in dev mode
cd ~/projects/dev-tools/scholar
./scripts/install.sh --dev

# Restart Claude Code
```

### Test Failures

**Symptom:** `npm test` fails with module errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Ensure ES modules support
node --version  # Should be >= 20.19.0

# Check NODE_OPTIONS in package.json
grep NODE_OPTIONS package.json
# Should see: NODE_OPTIONS='--experimental-vm-modules'
```

### ESLint Errors

**Symptom:** `npm run lint` fails with config errors

**Solution:**
```bash
# Ensure ESLint v9 is installed
npm list eslint
# Should see: eslint@9.0.0 or higher

# Check flat config exists
ls -la eslint.config.js

# Reinstall ESLint
npm install --save-dev eslint@^9.0.0 @eslint/js@^9.0.0 globals@^15.0.0
```

### Worktree Issues

**Symptom:** `git worktree add` fails

**Solution:**
```bash
# List existing worktrees
git worktree list

# Remove stale worktree
git worktree remove ~/.git-worktrees/scholar/feature-old

# Prune stale references
git worktree prune

# Try again
git worktree add ~/.git-worktrees/scholar/feature-new -b feature/new dev
```

### Permission Errors

**Symptom:** `EACCES` errors during installation

**Solution:**
```bash
# Fix permissions on ~/.claude
chmod -R u+w ~/.claude/plugins/

# Reinstall
./scripts/install.sh --dev

# If still failing, use sudo (not recommended)
sudo ./scripts/install.sh
```

---

## Quick Links

- **Repository:** https://github.com/Data-Wise/scholar
- **Documentation:** https://Data-Wise.github.io/scholar/
- **Issues:** https://github.com/Data-Wise/scholar/issues
- **Pull Requests:** https://github.com/Data-Wise/scholar/pulls
- **Releases:** https://github.com/Data-Wise/scholar/releases
- **Changelog:** [CHANGELOG.md](https://github.com/Data-Wise/scholar/blob/main/CHANGELOG.md)
- **Developer Guide:** [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)
- **Testing Guide:** [TESTING-GUIDE.md](TESTING-GUIDE.md)

---

**Thank you for contributing to Scholar!**

We appreciate your time and effort in making this project better for the academic community.
