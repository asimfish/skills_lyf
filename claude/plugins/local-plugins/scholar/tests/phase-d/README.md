# Phase D: GitHub Actions - Test Suite

Test suite for validating the Phase D GitHub Actions integration implementation.

## Overview

Phase D adds:
- **D1**: Pre-commit hook setup script (`setup-hooks.js`)
- **D2**: GitHub Action workflow template (`scholar-validate.yml`)
- **D3**: CI validation jobs (updates to `ci.yml`)

## Quick Start

```bash
# Run automated tests (CI-ready)
bash tests/phase-d/automated-tests.sh

# Run with verbose output
bash tests/phase-d/automated-tests.sh --verbose

# Run interactive tests (human QA)
bash tests/phase-d/interactive-tests.sh
```

## Test Suites

### Automated Tests (`automated-tests.sh`)

Non-interactive tests suitable for CI/CD:

| Category | Tests | Description |
|----------|-------|-------------|
| D1: setup-hooks.js | 10 | File exists, syntax, CLI options, execution |
| D1: pre-commit-hook.sh | 8 | File exists, bash syntax, features |
| D2: scholar-validate.yml | 12 | YAML syntax, workflow structure, jobs |
| D2: Documentation | 3 | File exists, key sections |
| D3: ci.yml | 5 | New jobs, Node.js setup |
| Package.json | 6 | npm scripts |
| Integration | 2 | Full test suite, module loading |

**Exit codes:**
- `0` - All tests passed
- `1` - One or more tests failed

### Interactive Tests (`interactive-tests.sh`)

Human-guided QA with visual inspection:

| Test | What to Verify |
|------|----------------|
| setup-hooks.js --help | Colorful help with all sections |
| setup-hooks.js --status | Hook status with git directory info |
| Worktree detection | Correct handling of worktree vs regular repo |
| pre-commit-hook.sh format | Colorful output, icons, header function |
| SCHOLAR_VALIDATE support | Conditional validation block |
| Workflow triggers | Path filters, event types |
| Jobs structure | Three jobs: validate-configs, sync-check, summary |
| Safe patterns | Uses env: and GITHUB_OUTPUT |
| Documentation | Comprehensive setup guide |
| CI test job | Node.js setup, npm test |
| Schema validation | Validates lesson-plan and teaching-style schemas |
| Full test suite | 2,024+ tests passing |

**Controls:**
- `y` - Test passed
- `n` - Test failed
- `s` - Skip test
- `q` - Quit testing

## Test Logs

Logs are saved to `tests/phase-d/logs/`:

```
logs/
├── automated-YYYYMMDD-HHMMSS.log
└── interactive-YYYYMMDD-HHMMSS.log
```

## Adding to CI

Add to `.github/workflows/ci.yml`:

```yaml
  phase-d-tests:
    name: Phase D Tests
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Phase D automated tests
        run: bash tests/phase-d/automated-tests.sh
```

## Test Coverage

### Files Tested

| File | Tests |
|------|-------|
| `scripts/setup-hooks.js` | Syntax, CLI, help, status |
| `scripts/pre-commit-hook.sh` | Syntax, features, worktree support |
| `.github/workflows/scholar-validate.yml` | YAML, structure, security |
| `.github/workflows/ci.yml` | New jobs, schema validation |
| `docs/github-actions-setup.md` | Existence, key sections |
| `package.json` | npm scripts |

### Validated Features

- [x] ES module syntax in Node.js scripts
- [x] Bash script syntax
- [x] YAML workflow syntax
- [x] CLI argument parsing
- [x] Worktree handling
- [x] Security (no command injection)
- [x] Integration with existing test suite

## Troubleshooting

### "command not found: node"

Ensure Node.js 20+ is installed:
```bash
node --version  # Should be v20+
```

### "js-yaml not found"

Install dependencies:
```bash
npm install
```

### Automated tests fail in CI

Check the log file for details:
```bash
cat tests/phase-d/logs/automated-*.log
```

## Related

- [docs/github-actions-setup.md](../../docs/github-actions-setup.md) - User setup guide
- [docs/VALIDATION-TOOLS.md](../../docs/VALIDATION-TOOLS.md) - Validation tools reference
- [.STATUS](../../.STATUS) - Project status tracking
