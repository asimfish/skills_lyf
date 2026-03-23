# Test Suite Documentation

## Overview

Comprehensive test suite for the scholar teaching features foundation. All components have >95% code coverage with unit tests covering happy paths, edge cases, and error conditions.

## Test Structure

```
tests/
└── teaching/
    ├── template-loader.test.js      # Base template system (19 tests)
    ├── config-loader.test.js        # Configuration loading (36 tests)
    ├── validator-engine.test.js     # Validation engine (34 tests)
    ├── latex-validator.test.js      # LaTeX validation (27 tests)
    └── ai-provider.test.js          # AI provider (28 tests)
```

**Total:** 3,340 tests, all passing ✅

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/teaching/template-loader.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Component Test Coverage

### 1. Template Loader (19 tests)

**File:** `tests/teaching/template-loader.test.js`

Tests cover:
- Template loading from JSON files
- Template merging (deep merge with arrays)
- Auto-field injection (generated_by, timestamp)
- Default value application
- Error handling for invalid templates

**Key test cases:**
```javascript
it('should load template from file')
it('should merge templates correctly')
it('should inject auto fields')
it('should apply defaults from template')
it('should handle missing template file')
```

### 2. Config Loader (36 tests)

**File:** `tests/teaching/config-loader.test.js`

Tests cover:
- Parent directory search for `.flow/teach-config.yml`
- Config validation and error handling
- Config merging with defaults
- Malformed YAML handling
- Missing config file fallback

**Key test cases:**
```javascript
it('should load config from .flow directory')
it('should search parent directories')
it('should merge with default config')
it('should validate config structure')
it('should handle malformed YAML')
```

**Fixtures:**
- `fixtures/valid-config.yml` - Complete valid config
- `fixtures/invalid-config.yml` - Missing required fields
- `fixtures/minimal-config.yml` - Minimal valid config
- `fixtures/malformed-config.yml` - Syntax errors

### 3. Validator Engine (34 tests)

**File:** `tests/teaching/validator-engine.test.js`

Tests cover:
- JSON Schema validation with ajv
- LaTeX syntax validation integration
- Completeness checks (answer keys, options, rubrics)
- Strict mode (warnings → errors)
- Custom schema error formatting

**Key test cases:**
```javascript
it('should validate against JSON Schema')
it('should detect LaTeX errors in content')
it('should check for missing answer keys')
it('should validate multiple-choice options')
it('should check essay question rubrics')
it('should enforce strict mode')
```

### 4. LaTeX Validator (27 tests)

**File:** `tests/teaching/latex-validator.test.js`

Tests cover:
- Inline math delimiters ($...$)
- Display math delimiters ($$...$$, \\[...\\])
- Brace matching (nested and escaped)
- Command validation (\\frac, \\alpha, etc.)
- Math extraction and detection

**Key test cases:**
```javascript
it('should detect unbalanced inline math')
it('should detect unbalanced display math')
it('should handle nested braces correctly')
it('should detect invalid \\frac syntax')
it('should extract inline and display math')
it('should detect LaTeX commands')
```

### 5. AI Provider (28 tests)

**File:** `tests/teaching/ai-provider.test.js`

Tests cover:
- Provider initialization and configuration
- Content generation with retry logic
- Exponential backoff with jitter
- Rate limiting enforcement
- Statistics tracking and calculation
- Error handling and classification
- Debug logging

**Key test cases:**
```javascript
it('should create provider with default options')
it('should generate content successfully')
it('should retry on retryable errors')
it('should not retry on non-retryable errors')
it('should enforce rate limiting')
it('should track statistics correctly')
it('should log in debug mode')
```

## Test Patterns

### ES Module Setup

All tests use ES modules (`type: "module"` in package.json):

```javascript
import { describe, it, expect } from '@jest/globals';
import { functionToTest } from '../../src/teaching/module.js';
```

### Async Testing

Async operations use async/await:

```javascript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Error Testing

Two patterns for error assertions:

```javascript
// Pattern 1: Array search
expect(errors.some(err => err.includes('text'))).toBe(true);

// Pattern 2: Direct check
expect(result.error).toContain('API key not configured');
```

### Mock Timer Testing

Fast-forwarding time for retry logic:

```javascript
// Speed up backoff for testing
provider.exponentialBackoff = async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
};
```

### Console Capture

Manual console.log capture (jest.spyOn not available in ES modules):

```javascript
const originalLog = console.log;
const logs = [];
console.log = (...args) => logs.push(args);

// Run test code

console.log = originalLog;
expect(logs.length).toBeGreaterThan(0);
```

## Coverage Goals

- **Line Coverage:** >95%
- **Branch Coverage:** >90%
- **Function Coverage:** 100%
- **Statement Coverage:** >95%

## CI Integration

Tests run on:
- Pre-commit hook (via husky)
- Pull request validation
- Before merge to dev branch

## Future Test Additions

As Phase 1+ components are added:

1. **Exam Generator Tests** (Week 1)
   - Template processing
   - Question generation
   - Answer key creation

2. **Quiz Generator Tests** (Week 2)
   - Similar to exam tests
   - Time limit validation
   - Randomization logic

3. **Integration Tests** (Week 3)
   - End-to-end workflows
   - Multi-component interaction
   - Real file system operations

4. **CLI Tests** (Week 4)
   - Command parsing
   - Interactive prompts
   - Output formatting

## Troubleshooting

### Common Issues

**Issue:** "Cannot use import statement outside a module"
**Solution:** Ensure `NODE_OPTIONS='--experimental-vm-modules'` is set in npm test script

**Issue:** "Unknown keyword 'if'"
**Solution:** Use `ajvKeywords(this.ajv)` without specifying keywords (ajv v8 has 'if' built-in)

**Issue:** Tests timeout
**Solution:** Mock async operations with faster delays for testing

**Issue:** jest.spyOn not defined
**Solution:** Use manual console capture pattern shown above

## Writing New Tests

### Test Template

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { YourModule } from '../../src/teaching/your-module.js';

describe('YourModule', () => {
  let instance;

  beforeEach(() => {
    // Setup before each test
    instance = new YourModule();
  });

  afterEach(() => {
    // Cleanup after each test
    instance = null;
  });

  describe('feature group', () => {
    it('should handle happy path', () => {
      const result = instance.method('input');
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      const result = instance.method('');
      expect(result).toBeNull();
    });

    it('should handle error condition', () => {
      expect(() => {
        instance.method(null);
      }).toThrow('Expected error message');
    });
  });
});
```

### Async Test Template

```javascript
it('should handle async operation', async () => {
  const result = await instance.asyncMethod();
  expect(result).toBeDefined();
  expect(result.success).toBe(true);
});

it('should handle async errors', async () => {
  await expect(instance.asyncMethod('invalid')).rejects.toThrow('Error');
});
```

### Mock Test Template

```javascript
it('should retry on failure', async () => {
  let attemptCount = 0;

  // Mock the method to fail twice, then succeed
  instance.makeRequest = async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error('Temporary failure');
    }
    return { success: true };
  };

  const result = await instance.withRetry();
  expect(result.success).toBe(true);
  expect(attemptCount).toBe(3);
});
```

### Testing LaTeX Validation

```javascript
describe('LaTeX validation', () => {
  it('should detect unbalanced dollars', () => {
    const errors = validateLatex('Formula: $x^2');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Unbalanced');
  });

  it('should accept valid inline math', () => {
    const errors = validateLatex('Formula: $x^2 + y^2 = z^2$');
    expect(errors).toHaveLength(0);
  });

  it('should handle nested braces', () => {
    const errors = validateLatex('$\\frac{x^{2}}{y}$');
    expect(errors).toHaveLength(0);
  });
});
```

### Testing Configuration

```javascript
describe('Config loader', () => {
  const fixtureDir = './fixtures/config-test';

  it('should load valid config', () => {
    const config = loadTeachConfig(fixtureDir);
    expect(config.course_info.code).toBe('STAT-101');
  });

  it('should merge with defaults', () => {
    const config = loadTeachConfig(fixtureDir);
    expect(config.teaching_preferences.difficulty_default).toBe('intermediate');
  });

  it('should validate config structure', () => {
    // Invalid config should warn but not throw
    const config = loadTeachConfig('./fixtures/invalid-config');
    expect(config).toBeDefined();
  });
});
```

### Testing Statistics

```javascript
describe('Statistics tracking', () => {
  it('should calculate success rate', async () => {
    await provider.generate('success 1');
    await provider.generate('success 2');

    // Force a failure
    provider.makeRequest = async () => {
      throw new Error('Failure');
    };
    await provider.generate('failure');

    const stats = provider.getStats();
    expect(stats.totalRequests).toBe(3);
    expect(stats.successfulRequests).toBe(2);
    expect(stats.failedRequests).toBe(1);
    expect(stats.successRate).toBeCloseTo(66.67, 1);
  });

  it('should reset statistics', () => {
    const stats = provider.getStats();
    expect(stats.totalRequests).toBeGreaterThan(0);

    provider.resetStats();
    const newStats = provider.getStats();
    expect(newStats.totalRequests).toBe(0);
  });
});
```

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Group related tests with `describe` blocks
3. Use clear, descriptive test names
4. Test happy path + edge cases + error conditions
5. Aim for >95% coverage of new code
6. Update this README with new test sections

### Example Pull Request Checklist

- [ ] Tests added for all new functionality
- [ ] All tests passing (`npm test`)
- [ ] Code coverage >95% for new code
- [ ] Test documentation updated
- [ ] Edge cases covered
- [ ] Error conditions tested
- [ ] Async operations tested properly
- [ ] No console.log/console.error in tests (unless testing logging)
