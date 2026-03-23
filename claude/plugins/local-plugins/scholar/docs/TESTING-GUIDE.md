# Scholar Testing Guide

> **Comprehensive testing documentation for developers**
> Last updated: 2026-01-29 (v2.5.0)

---

## Overview

Scholar has **1,739 tests** across 50 test suites, covering unit tests, integration tests, E2E tests, security tests, performance tests, and snapshot tests. This guide explains the testing infrastructure, how to run tests, and how to write new tests.

**What's New in v2.5.0:**

- 80 new tests for v2.5.0 feature validation
- Comprehensive security testing suite (30 tests)
- E2E tests using demo course as fixture (35 tests)
- Regression tests for Session 38 security fixes (15 tests)
- 100% pass rate on all runnable tests

---

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern="auto-fixer"

# Run with coverage
npm test -- --coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Run specific test file
npm test tests/teaching/validators/auto-fixer.test.js

# Run tests matching pattern
npm test -- -t "syntax errors"
```

### Test Output

```
Test Suites: 47 passed, 47 total
Tests:       1,391 passed, 1,391 total
Snapshots:   44 passed, 44 total
Time:        3.2s
```

---

## Test Architecture

### Directory Structure

```
tests/
├── teaching/                    # Teaching command tests
│   ├── commands/                # Command tests ({{ scholar.test_count }} tests)
│   │   ├── exam.test.js
│   │   ├── quiz.test.js
│   │   ├── assignment.test.js
│   │   ├── syllabus.test.js
│   │   ├── slides.test.js
│   │   ├── lecture.test.js
│   │   └── demo.test.js
│   ├── validators/              # Validator tests (203 tests)
│   │   ├── auto-fixer.test.js
│   │   ├── auto-fixer-comprehensive.test.js
│   │   ├── yaml-validator.test.js
│   │   ├── schema-validator.test.js
│   │   ├── latex-validator.test.js
│   │   └── completeness-validator.test.js
│   ├── formatters/              # Formatter tests (54 tests)
│   │   ├── diff-formatter.test.js
│   │   └── output-formatter.test.js
│   ├── config/                  # Config tests (89 tests)
│   │   ├── config-loader.test.js
│   │   ├── sync-engine.test.js
│   │   └── migration.test.js
│   ├── templates/               # Template tests (201 tests)
│   │   └── template-system.test.js
│   ├── integration/             # Integration tests (211 tests)
│   │   ├── e2e-fix-workflow.test.js
│   │   ├── cli-integration.test.js
│   │   ├── sync-engine-integration.test.js
│   │   ├── batch-processing.test.js
│   │   └── error-recovery.test.js
│   ├── ai/                      # AI provider tests (28 tests)
│   │   └── ai-provider.test.js
│   ├── v2.5.0-unit-security.test.js     # v2.5.0 security tests (30 tests)
│   ├── v2.5.0-e2e-demo-course.test.js   # v2.5.0 E2E tests (35 tests)
│   ├── v2.5.0-regression.test.js        # v2.5.0 regression tests (15 tests)
│   ├── v2.5.0-test-plan.md              # Test documentation
│   └── v2.5.0-TEST-RESULTS.md           # Test results summary
├── setup.js                     # Global test setup
└── fixtures/                    # Test data and fixtures
```

### Test Categories

| Category              | Tests       | Purpose                           | Runtime  |
| --------------------- | ----------- | --------------------------------- | -------- |
| **Unit Tests**        | 926 (53%)   | Test individual functions/modules | 1.9s     |
| **Integration Tests** | 211 (12%)   | Test component interactions       | 0.9s     |
| **E2E Tests**         | 177 (10%)   | Test complete workflows           | 0.6s     |
| **Security Tests**    | 30 (2%)     | Validate security fixes           | 0.1s     |
| **Performance Tests** | 74 (4%)     | Benchmark performance             | 0.3s     |
| **Snapshot Tests**    | 44 (3%)     | Track output changes              | 0.2s     |
| **Regression Tests**  | 277 (16%)   | Prevent past bugs                 | 0.4s     |
| **Total**             | **1,739**   |                                   | **3.6s** |

> **Note:** v2.5.0 added 80 new tests (30 security, 35 E2E, 15 regression).
> See [v2.5.0 Test Suite](#v250-test-suite) for details.

---

---

## v2.5.0 Test Suite

> **Comprehensive security and E2E validation for Weekly Lecture Production**
> Added: 2026-01-29 (Session 41)

The v2.5.0 test suite validates all features released in the Weekly Lecture Production update, with emphasis on security hardening and real-world E2E scenarios using the demo course.

### Overview

- **Total Tests:** 80 (30 security, 35 E2E, 15 regression)
- **Pass Rate:** 100% (72/72 runnable, 8 intentionally skipped)
- **Coverage:** All 6 v2.5.0 features + 10 Session 38 security fixes
- **Runtime:** ~0.4s

### Test Files

| File | Tests | Purpose | Status |
|------|-------|---------|--------|
| `v2.5.0-unit-security.test.js` | 30 | Security validation | ✅ 100% pass |
| `v2.5.0-e2e-demo-course.test.js` | 35 | Real-world scenarios | ✅ 77% pass, 23% skip |
| `v2.5.0-regression.test.js` | 15 | Session 38 fixes | ✅ 100% pass |

### Running v2.5.0 Tests

```bash
# Run all v2.5.0 tests
npm test -- --testPathPattern="v2.5.0"

# Run only security tests
npm test tests/teaching/v2.5.0-unit-security.test.js

# Run only E2E tests
npm test tests/teaching/v2.5.0-e2e-demo-course.test.js

# Run only regression tests
npm test tests/teaching/v2.5.0-regression.test.js

# View detailed results
cat tests/teaching/v2.5.0-TEST-RESULTS.md
```

### Security Tests (30 tests)

Validates security hardening against injection attacks and unsafe operations.

#### Test Coverage

**slugify.js Security (22 tests):**

- ✅ Path traversal prevention (`../../../etc/passwd`)
- ✅ Shell injection prevention (`` `whoami` ``, `$(rm -rf /)`)
- ✅ Unicode normalization attacks
- ✅ Null byte injection (`\x00`)
- ✅ Filename length limits (80 chars)
- ✅ Reserved filenames (CON, PRN, AUX, NUL)
- ✅ HTML/XML injection (`<script>`, `<?xml>`)

**qmd-parser.js Security (7 tests):**

- ✅ ReDoS prevention (pathological regex)
- ✅ Query length limits (min 4 chars)
- ✅ Path traversal in section references
- ✅ One-directional fuzzy matching

**Cross-module Security (1 test):**

- ✅ Malicious input through full pipeline

#### Example Security Test

```javascript
describe('slugify() - Security', () => {
  describe('Shell Injection Prevention', () => {
    it('should remove command substitution $(…)', () => {
      const result = slugify('$(rm -rf /)');
      expect(result).not.toContain('$');
      expect(result).not.toContain('(');
      expect(result).toBe('rm-rf');
    });

    it('should remove pipe operators', () => {
      const result = slugify('foo | cat /etc/passwd');
      expect(result).not.toContain('|');
      expect(result).toBe('foo-cat-etc-passwd');
    });
  });
});
```

### E2E Tests (35 tests)

Validates complete workflows using the demo course as a real-world fixture.

#### Test Coverage by Feature

**F1: Output Directory (5 tests, all passing):**

- ✅ Generate correct filename for topic
- ✅ Use week prefix when `--from-plan` provided
- ✅ Handle spaces in topic
- ✅ Truncate long topics to 80 chars
- ✅ Sanitize special characters

**F2: Generation Metadata (3 tests, all passing):**

- ✅ Parse frontmatter from demo lecture
- ✅ Track refinement history if refined
- ✅ Provenance comments in frontmatter

**F3: Section Refinement (2 tests, all passing):**

- ✅ Parse sections from demo lecture
- ✅ Identify section boundaries correctly

**F4: Context-Aware Generation (3 tests, all skipped):**

- ⏭️ Use previous 3 weeks as context (requires API key)
- ⏭️ Handle early weeks gracefully (requires API key)
- ⏭️ Cap context to 1-10 weeks (requires API key)

**F5: Coverage Validation (3 tests, 1 passing, 2 skipped):**

- ✅ Validate coverage of demo lecture
- ⏭️ Report 100% coverage (requires full course context)
- ⏭️ Include confidence note (requires full validation)

**F6: Preview Launch (2 tests, 1 passing, 1 skipped):**

- ✅ Sanitize paths before preview launch
- ⏭️ Launch quarto preview (would open window)

**Demo Course Structure (3 tests, all passing):**

- ✅ Has valid config file
- ✅ Has lectures directory
- ✅ Has at least one lecture file

**Atomic Workflows (2 tests, all skipped):**

- ⏭️ Generate → Check → Refine → Check cycle (requires API key)
- ⏭️ Context chain Week 1 → 2 → 3 (requires API key)

#### Why Tests Are Skipped

Tests marked as skipped require:

- **API keys:** Tests that call Claude API for generation
- **GUI windows:** Tests that would launch Quarto preview
- **Full course context:** Tests that need complete lesson plans

These are documented as manual E2E test procedures in the test files.

#### Example E2E Test

```javascript
describe('F1: --output-dir', () => {
  it('should generate correct filename for topic', () => {
    const filename = generateLectureFilename({ 
      topic: 'Correlation Analysis' 
    });
    expect(filename).toBe('lecture-correlation-analysis.qmd');
  });

  it('should use week prefix when fromPlan provided', () => {
    const filename = generateLectureFilename({
      topic: 'Correlation Analysis',
      fromPlan: 'week04'
    });
    expect(filename).toBe('week04-correlation-analysis.qmd');
  });
});
```

### Regression Tests (15 tests)

Validates that all 10 security and quality fixes from Session 38 remain fixed.

#### Session 38 Critical Fixes (7 tests, all passing)

1. ✅ Shell injection in preview-launcher (uses spawn, not exec)
2. ✅ Path traversal in --output-dir (uses resolve())
3. ✅ API key validation timing (early check)
4. ✅ Provenance update (parsed boundaries, not string search)
5. ✅ TOCTOU race in file creation (atomic write)

#### Session 38 Important Fixes (8 tests, all passing)

1. ✅ One-directional section matching (query ⊂ title)
2. ✅ Slug truncation (80 chars)
3. ✅ Context count capping (1-10 range)
4. ✅ Metadata missing warning
5. ✅ Coverage confidence note

#### Regression Prevention (3 tests, all passing)

- ✅ No shell injection reintroduction
- ✅ Safe path operations
- ✅ User input validation

#### Example Regression Test

```javascript
describe('Session 38 Critical Fixes', () => {
  describe('Fix 1: Shell injection in preview-launcher', () => {
    it('should use spawn instead of shell execution', () => {
      const launcherPath = join(process.cwd(), 
        'src/teaching/utils/preview-launcher.js');
      const content = readFileSync(launcherPath, 'utf-8');

      // Should use spawn (safe)
      expect(content).toContain('spawn(');

      // Should NOT use dangerous patterns
      expect(content).not.toContain('exec(`');
      expect(content).not.toContain('exec("');
    });
  });
});
```

### Test Documentation

- **Test Plan:** `tests/teaching/v2.5.0-test-plan.md`
  - Comprehensive coverage analysis
  - Implementation strategy
  - Success criteria

- **Test Results:** `tests/teaching/v2.5.0-TEST-RESULTS.md`
  - Detailed test execution summary
  - Failure analysis
  - Next steps

### Key Insights

**Security-First Testing:**
All v2.5.0 modules have dedicated security tests covering:

- Injection attacks (shell, path, XSS)
- Input validation (length, charset, format)
- Filesystem safety (atomic operations, traversal prevention)

**Real-World Validation:**
E2E tests use the actual demo course (`~/projects/teaching/scholar-demo-course`) as a fixture, not mocked data. This ensures tests reflect real usage.

**Regression Prevention:**
Every Session 38 fix has a dedicated regression test that will fail if the vulnerability is reintroduced.

### Related Documentation

- [Security Testing Guide](SECURITY-TESTING-GUIDE.md) - Deep dive into security testing
- [Security Testing Guide](SECURITY-TESTING-GUIDE.md) - Security test details

## Writing Tests

### Unit Test Example

```javascript
// tests/teaching/validators/auto-fixer.test.js
import { AutoFixer } from '../../../src/teaching/validators/auto-fixer.js';

describe('AutoFixer', () => {
  let fixer;

  beforeEach(() => {
    fixer = new AutoFixer();
  });

  test('fixes syntax errors: extra whitespace', () => {
    const yamlContent = 'key:    value   \nanother:  test  \n';
    const result = fixer.fixSyntaxErrors(yamlContent);

    expect(result.success).toBe(true);
    expect(result.fixed).toBe('key: value\nanother: test\n');
    expect(result.changes).toHaveLength(2);
  });

  test('handles invalid YAML gracefully', () => {
    const yamlContent = 'key: [unclosed array';
    const result = fixer.fixSyntaxErrors(yamlContent);

    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid YAML');
  });
});
```

### Integration Test Example

```javascript
// tests/teaching/integration/e2e-fix-workflow.test.js
import { Validator } from '../../../src/teaching/validators/validator.js';
import { AutoFixer } from '../../../src/teaching/validators/auto-fixer.js';

describe('E2E Fix Workflow', () => {
  test('complete fix workflow: syntax error', async () => {
    const yamlContent = 'key:    value   \nanother:  test  \n';
    const validator = new Validator();
    const fixer = new AutoFixer();

    // Step 1: Validate (should fail)
    const validation = await validator.validate(yamlContent);
    expect(validation.errors.length).toBeGreaterThan(0);

    // Step 2: Fix
    const fixed = fixer.fixSyntaxErrors(yamlContent);
    expect(fixed.success).toBe(true);

    // Step 3: Re-validate (should pass)
    const revalidation = await validator.validate(fixed.fixed);
    expect(revalidation.errors.length).toBe(0);
  });
});
```

### Performance Test Example

```javascript
// tests/teaching/validators/auto-fixer-comprehensive.test.js
describe('Performance Tests', () => {
  test('fix 100 small files < 1 second', () => {
    const files = Array.from({ length: 100 }, (_, i) => ({
      name: `file${i}.yml`,
      content: `week: ${i}\ntitle: "Week ${i}"\ntopics: []\n`,
    }));

    const start = Date.now();
    const results = files.map(f => fixer.fixSyntaxErrors(f.content));
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    expect(results.every(r => r.success)).toBe(true);
  });
});
```

### Snapshot Test Example

```javascript
// tests/teaching/validators/auto-fixer-comprehensive.test.js
describe('Snapshot Tests', () => {
  test('fix summary report', () => {
    const yamlContent = 'key:    value   \nanother:  test  \n';
    const result = fixer.fixSyntaxErrors(yamlContent);

    const summary = {
      success: result.success,
      changesCount: result.changes?.length || 0,
      changeTypes: result.changes?.map(c => c.type) || [],
    };

    expect(summary).toMatchSnapshot('fix-summary-report');
  });
});
```

---

## Custom Matchers

Scholar provides custom Jest matchers for YAML testing.

### toMatchYAML

Compare YAML content semantically (ignores whitespace differences).

```javascript
expect(actual).toMatchYAML(expected);

// Example
const actual = 'key:   value';
const expected = 'key: value';
expect(actual).toMatchYAML(expected);  // ✅ Pass
```

### toHaveValidSyntax

Validate YAML syntax.

```javascript
expect(yamlContent).toHaveValidSyntax();

// Example
const valid = 'key: value';
const invalid = 'key: [unclosed';

expect(valid).toHaveValidSyntax();    // ✅ Pass
expect(invalid).not.toHaveValidSyntax();  // ✅ Pass
```

### Implementation

```javascript
// tests/setup.js
expect.extend({
  toMatchYAML(actual, expected) {
    const actualParsed = yaml.load(actual);
    const expectedParsed = yaml.load(expected);
    const pass = JSON.stringify(actualParsed) === JSON.stringify(expectedParsed);

    return {
      pass,
      message: () =>
        pass
          ? `Expected YAML not to match`
          : `Expected YAML to match\n` +
            `  Expected: ${JSON.stringify(expectedParsed)}\n` +
            `  Received: ${JSON.stringify(actualParsed)}`,
    };
  },

  toHaveValidSyntax(yamlContent) {
    try {
      yaml.load(yamlContent);
      return {
        pass: true,
        message: () => 'Expected YAML to be invalid',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Expected valid YAML, got error: ${error.message}`,
      };
    }
  },
});
```

---

## Mocking

### AI Provider Mocking

```javascript
// tests/setup.js
import { jest } from '@jest/globals';

global.fetch = jest.fn((url, options) => {
  if (url.includes('anthropic.com')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: 'Mock AI response' }],
        }),
    });
  }
  return Promise.reject(new Error('Unmocked fetch'));
});
```

### File System Mocking

```javascript
import { jest } from '@jest/globals';
import fs from 'fs';

jest.spyOn(fs, 'readFileSync').mockReturnValue('mock content');
jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
```

---

## Test Coverage

### Viewing Coverage

```bash
npm test -- --coverage

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Coverage Report

```
---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |   90.12 |    88.45 |   91.23 |   90.34 |
 validators/         |   95.23 |    92.11 |   96.45 |   95.67 |
  auto-fixer.js      |   96.78 |    94.23 |   98.12 |   97.34 |
  validator.js       |   94.56 |    91.34 |   95.23 |   94.89 |
 commands/           |   85.34 |    82.12 |   86.45 |   85.78 |
 config/             |   90.12 |    87.23 |   91.34 |   90.45 |
---------------------|---------|----------|---------|---------|
```

### Coverage Goals

| Component  | Target | Current | Status |
| ---------- | ------ | ------- | ------ |
| Validators | >90%   | 95%     | Yes    |
| Config     | >85%   | 90%     | Yes    |
| Commands   | >80%   | 85%     | Yes    |
| Templates  | >90%   | 93%     | Yes    |
| Overall    | >85%   | 90%     | Yes    |

---

## Fixtures

### Creating Fixtures

```javascript
// tests/fixtures/sample-config.yml
course_info:
  course_title: "Introduction to Statistics"
  course_code: "STAT 101"
  instructor_name: "Dr. Jane Smith"

defaults:
  exam_format: "markdown"
  difficulty: "intermediate"

style:
  tone: "formal"
  notation: "statistical"
```

### Using Fixtures

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('Config Loader', () => {
  test('loads sample config', () => {
    const configPath = path.join(fixturesDir, 'sample-config.yml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);

    expect(config.course_info.course_title).toBe('Introduction to Statistics');
  });
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Attach debugger in Chrome
chrome://inspect
```

### Verbose Output

```bash
# Show individual test results
npm test -- --verbose

# Show test names only
npm test -- --listTests
```

### Isolate Failing Tests

```bash
# Run only failing tests
npm test -- --onlyFailures

# Run tests matching pattern 2
npm test -- -t "syntax errors"

# Run single test file
npm test tests/teaching/validators/auto-fixer.test.js
```

---

## Test Patterns

### Arrange-Act-Assert (AAA)

```javascript
test('fixes syntax errors', () => {
  // Arrange
  const fixer = new AutoFixer();
  const yamlContent = 'key:    value   \n';

  // Act
  const result = fixer.fixSyntaxErrors(yamlContent);

  // Assert
  expect(result.success).toBe(true);
  expect(result.fixed).toBe('key: value\n');
});
```

### Given-When-Then

```javascript
test('migration workflow', async () => {
  // Given
  const v1Config = 'title: "Stats 101"\n';
  const migrator = new BatchMigrator();

  // When
  const result = await migrator.migrate([{ path: 'config.yml', content: v1Config }]);

  // Then
  expect(result.success).toBe(true);
  expect(result.migrated).toHaveLength(1);
});
```

### Test Data Builders

```javascript
// Test data builder pattern
class ConfigBuilder {
  constructor() {
    this.config = {
      course_info: {},
      defaults: {},
      style: {},
    };
  }

  withCourseTitle(title) {
    this.config.course_info.course_title = title;
    return this;
  }

  withDifficulty(level) {
    this.config.defaults.difficulty = level;
    return this;
  }

  build() {
    return this.config;
  }
}

test('validates config', () => {
  const config = new ConfigBuilder()
    .withCourseTitle('Stats 101')
    .withDifficulty('intermediate')
    .build();

  expect(validator.validate(config)).toHaveLength(0);
});
```

---

## Best Practices

### Test Naming

```javascript
// ✅ Good: Descriptive test names
test('fixes syntax errors: extra whitespace', () => {});
test('validates YAML syntax before parsing', () => {});
test('migrates v1 config to v2 schema', () => {});

// ❌ Bad: Vague test names
test('works', () => {});
test('test1', () => {});
test('should validate', () => {});
```

### Test Organization

```javascript
describe('AutoFixer', () => {
  describe('fixSyntaxErrors', () => {
    test('fixes extra whitespace', () => {});
    test('fixes indentation', () => {});
    test('fixes quotes', () => {});
  });

  describe('fixSchemaErrors', () => {
    test('fixes missing fields', () => {});
    test('fixes type mismatches', () => {});
  });
});
```

### Avoid Test Interdependence

```javascript
// ❌ Bad: Tests depend on each other
let result;
test('step 1', () => { result = doSomething(); });
test('step 2', () => { expect(result).toBe('value'); });

// ✅ Good: Independent tests
test('step 1', () => {
  const result = doSomething();
  expect(result).toBeDefined();
});

test('step 2', () => {
  const result = doSomething();
  expect(result).toBe('value');
});
```

### Use beforeEach/afterEach

```javascript
describe('AutoFixer', () => {
  let fixer;
  let tempFiles = [];

  beforeEach(() => {
    fixer = new AutoFixer();
  });

  afterEach(() => {
    // Cleanup temp files
    tempFiles.forEach(f => fs.unlinkSync(f));
    tempFiles = [];
  });

  test('fixes syntax errors', () => {
    const tempFile = '/tmp/test.yml';
    tempFiles.push(tempFile);
    // Test logic
  });
});
```

---

## Troubleshooting

### Common Issues

### Issue: Tests timeout

```javascript
// Increase timeout for slow tests
test('slow operation', async () => {
  // ...
}, 10000);  // 10 second timeout
```

### Issue: Snapshot mismatch

```bash
# Update snapshots
npm test -- -u
```

### Issue: Module not found

```bash
# Ensure ES modules are enabled
export NODE_OPTIONS='--experimental-vm-modules'
npm test
```

### Issue: Fetch not mocked

```javascript
// Ensure setup.js is loaded
// Check jest.config.js has setupFilesAfterEnv: ['./tests/setup.js']
```

---

## Performance Optimization

### Parallel Execution

```bash
# Run tests in parallel (default)
npm test

# Run serially (slower but easier to debug)
npm test -- --runInBand
```

### Test Filtering

```bash
# Skip slow tests
npm test -- --testPathIgnorePatterns="e2e"

# Run only fast tests
npm test -- --testPathPattern="unit"
```

### Cache Usage

```bash
# Clear Jest cache
npm test -- --clearCache

# Disable cache (for debugging)
npm test -- --no-cache
```

---

## Resources

### Jest Documentation

- https://jestjs.io/docs/getting-started
- https://jestjs.io/docs/expect
- https://jestjs.io/docs/mock-functions

### Testing Best Practices

- https://github.com/goldbergyoni/javascript-testing-best-practices
- https://testingjavascript.com/

### Scholar Test Docs

- [Auto-Fixer Comprehensive Tests](https://github.com/Data-Wise/scholar/blob/main/tests/teaching/validators/AUTO-FIXER-COMPREHENSIVE-TESTS.md)

---

## Summary

Scholar's test suite provides:

✅ **1,391 comprehensive tests** (90% coverage)
✅ **Multiple test categories** (unit, integration, E2E, performance, snapshot)
✅ **Custom matchers** (toMatchYAML, toHaveValidSyntax)
✅ **Fast execution** (3.2s for all tests)
✅ **CI/CD integration** (GitHub Actions)
✅ **Easy debugging** (verbose mode, isolate failures)

### Quick commands

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
npm test auto-fixer         # Specific suite
```
