# Phase 0 Quick Reference

### Fast lookup guide for Phase 0 components

---

## Template System

### Import (Template System)

```javascript
import {
  loadTemplate,
  mergeTemplates,
  injectAutoFields,
  applyDefaults
} from '../src/teaching/templates/loader.js';
```

### Quick Start (Template System)

```javascript
// Load template
const template = loadTemplate('exam');

// Inject metadata
const enriched = injectAutoFields(content, template, {
  course: { code: 'STAT-101', title: 'Statistics' },
  generated_by: { tool: 'scholar', version: '1.0.0' }
});

// Apply defaults
const complete = applyDefaults(content, template);
```

### Functions

| Function                                       | Purpose                     | Returns              |
| ---------------------------------------------- | --------------------------- | -------------------- |
| `loadTemplate(type)`                           | Load base template          | Object (JSON Schema) |
| `mergeTemplates(base, specific)`               | Deep merge two templates    | Object               |
| `injectAutoFields(content, template, options)` | Add auto-generated metadata | Object               |
| `applyDefaults(content, template)`             | Fill in default values      | Object               |

---

## Configuration Loader

### Import (Configuration Loader)

```javascript
import { loadTeachConfig } from '../src/teaching/config/loader.js';
```

### Quick Start (Configuration Loader)

```javascript
// Load config (searches parent directories)
const config = loadTeachConfig(process.cwd());

// Access values
config.course_info.code              // "STAT-101"
config.teaching_preferences.difficulty_default  // "intermediate"
config.ai_generation.model           // "claude-3-5-sonnet-20241022"
```

### Config File: `.flow/teach-config.yml`

```yaml
course_info:
  code: "STAT-101"
  title: "Introduction to Statistics"
  semester: "Spring 2026"
  level: "undergraduate"  # or "graduate"
  instructor:
    name: "Dr. Jane Smith"
    email: "jane.smith@university.edu"

teaching_preferences:
  difficulty_default: "intermediate"  # easy | intermediate | hard
  include_solutions: true
  latex_format: "inline"  # inline | display
  output_format: "markdown"  # markdown | json | latex

ai_generation:
  model: "claude-3-5-sonnet-20241022"
  temperature: 0.7
  max_tokens: 4096
  timeout: 30000
```

---

## Validator Engine

### Import (Validator Engine)

```javascript
import { ValidatorEngine } from '../src/teaching/validators/engine.js';
import { validateLatex, extractMath, hasLatex } from '../src/teaching/validators/latex.js';
```

### Quick Start (Validator Engine)

```javascript
// Create validator
const validator = new ValidatorEngine({
  strictMode: false,      // warnings don't fail validation
  validateLatex: true,    // check LaTeX syntax
  checkCompleteness: true // check answer keys, etc.
});

// Validate content
const result = validator.validate(content, template);

if (result.isValid) {
  console.log('✓ Valid');
} else {
  result.errors.forEach(err => {
    console.error(`${err.field}: ${err.message}`);
  });
}
```

### Validation Methods

| Method                                 | Purpose           | Speed  |
| -------------------------------------- | ----------------- | ------ |
| `validate(content, template)`          | Full validation   | Normal |
| `quickValidate(content, template)`     | Schema only       | Fast   |
| `validateSchema(content, template)`    | JSON Schema only  | Fast   |
| `validateLatexContent(content)`        | LaTeX only        | Normal |
| `checkCompleteness(content, template)` | Answer keys, etc. | Fast   |

### LaTeX Functions

```javascript
// Check if text contains LaTeX
hasLatex('Formula: $x^2$')  // true

// Validate LaTeX syntax
const errors = validateLatex('$x^{2$');  // [{ message: 'Unmatched brace', ... }]

// Extract math blocks
const blocks = extractMath('$a$ and $$b$$');
// [{ type: 'inline', content: 'a' }, { type: 'display', content: 'b' }]
```

---

## AI Provider

### Import (AI Provider)

```javascript
import { AIProvider } from '../src/teaching/ai/provider.js';
```

### Quick Start (AI Provider)

```javascript
// Create provider
const ai = new AIProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  maxRetries: 3,
  timeout: 30000,
  maxTokens: 4096,
  debug: false
});

// Generate content
const result = await ai.generate(
  'Create 5 quiz questions about linear regression',
  {
    format: 'json',
    temperature: 0.7,
    context: { course: 'STAT-440' }
  }
);

if (result.success) {
  console.log(result.content);
  console.log(`Used ${result.metadata.tokens} tokens`);
} else {
  console.error(result.error);
}
```

### Constructor Options

| Option       | Type    | Default           | Purpose                |
| ------------ | ------- | ----------------- | ---------------------- |
| `apiKey`     | string  | env var           | API key                |
| `model`      | string  | claude-3-5-sonnet | Model to use           |
| `maxRetries` | number  | 3                 | Max retry attempts     |
| `timeout`    | number  | 30000             | Request timeout (ms)   |
| `maxTokens`  | number  | 4096              | Max tokens to generate |
| `debug`      | boolean | false             | Enable logging         |

### Generate Options

| Option        | Type   | Purpose                        |
| ------------- | ------ | ------------------------------ |
| `format`      | string | Output format (json, markdown) |
| `temperature` | number | Sampling temperature (0-1)     |
| `context`     | object | Additional context             |

### Statistics

```javascript
const stats = ai.getStats();

stats.totalRequests       // Total requests made
stats.successfulRequests  // Successful completions
stats.failedRequests      // Final failures
stats.retriedRequests     // Retry attempts
stats.totalTokens         // Total tokens used
stats.successRate         // Success percentage
stats.averageTokens       // Mean tokens per request

ai.resetStats();  // Clear statistics
```

---

## Common Patterns

### Pattern 1: Full Workflow

```javascript
import { loadTemplate, injectAutoFields } from '../templates/loader.js';
import { loadTeachConfig } from '../config/loader.js';
import { ValidatorEngine } from '../validators/engine.js';
import { AIProvider } from '../ai/provider.js';

async function generate() {
  // 1. Load config
  const config = loadTeachConfig(process.cwd());

  // 2. Load template
  const template = loadTemplate('exam');

  // 3. Generate with AI
  const ai = new AIProvider(config.ai_generation);
  const result = await ai.generate(prompt);

  // 4. Enrich content
  const content = injectAutoFields(result.content, template, {
    course: config.course_info
  });

  // 5. Validate
  const validator = new ValidatorEngine();
  const validation = validator.validate(content, template);

  if (!validation.isValid) {
    throw new Error('Validation failed');
  }

  return content;
}
```

### Pattern 2: Error Handling

```javascript
try {
  const result = await ai.generate(prompt);

  if (!result.success) {
    console.error(`Generation failed: ${result.error}`);
    console.error(`Attempts: ${result.metadata.attempts}`);
    throw new Error(result.error);
  }

  return result.content;
} catch (error) {
  console.error('Fatal error:', error.message);
  throw error;
}
```

### Pattern 3: Validation with Retry

```javascript
const validator = new ValidatorEngine();
let content;
let attempts = 0;

while (attempts < 3) {
  const result = await ai.generate(prompt);
  content = result.content;

  const validation = validator.validate(content, template);

  if (validation.isValid) {
    break; // Success!
  }

  // Add validation errors to prompt for next attempt
  prompt += `\n\nPrevious attempt had errors: ${JSON.stringify(validation.errors)}`;
  attempts++;
}

if (attempts === 3) {
  throw new Error('Could not generate valid content after 3 attempts');
}
```

### Pattern 4: Batch Processing

```javascript
const topics = ['topic1', 'topic2', 'topic3'];
const results = [];

for (const topic of topics) {
  const result = await ai.generate(`Generate quiz about ${topic}`);

  if (result.success) {
    results.push(result.content);
  }

  // Rate limiting (500ms between requests)
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log(`Generated ${results.length}/${topics.length} successfully`);
```

---

## Error Types

### Template System Errors

| Error                     | Cause          | Solution                 |
| ------------------------- | -------------- | ------------------------ |
| `Template file not found` | Invalid type   | Check template name      |
| `Invalid template JSON`   | Malformed JSON | Validate JSON syntax     |
| `Merge failed`            | Type mismatch  | Check template structure |

### Config Loader Errors

| Error                 | Cause                            | Solution            |
| --------------------- | -------------------------------- | ------------------- |
| `No config found`     | Missing `.flow/teach-config.yml` | Create config file  |
| `Invalid YAML syntax` | Malformed YAML                   | Check YAML syntax   |
| `Validation failed`   | Invalid values                   | Check config values |

### Validator Errors

| Type           | Example                                | Fix                   |
| -------------- | -------------------------------------- | --------------------- |
| `schema`       | `Missing required field: title`        | Add required field    |
| `latex`        | `Unbalanced inline math delimiter ($)` | Add closing `$`       |
| `completeness` | `Missing answer key`                   | Add answer_key object |

### AI Provider Errors

| Error                    | Retryable | Solution                  |
| ------------------------ | --------- | ------------------------- |
| `API key not configured` | No        | Set ANTHROPIC_API_KEY     |
| `Rate limit exceeded`    | Yes       | Wait or increase interval |
| `Request timeout`        | Yes       | Increase timeout          |
| `Invalid input`          | No        | Fix prompt                |
| `Service unavailable`    | Yes       | Retry automatically       |

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Specific file
npm test -- tests/teaching/ai-provider.test.js

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Template

```javascript
import { describe, it, expect } from '@jest/globals';

describe('Feature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });

  it('should handle async', async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
  });
});
```

---

## File Locations

```
src/teaching/
├── ai/
│   └── provider.js         # AI Provider
├── config/
│   └── loader.js           # Config Loader
├── templates/
│   ├── base.json          # Base template
│   └── loader.js          # Template loader
└── validators/
    ├── engine.js          # Validator engine
    └── latex.js           # LaTeX validator

tests/teaching/
├── ai-provider.test.js     # 28 tests
├── config-loader.test.js   # 36 tests
├── latex-validator.test.js # 27 tests
├── template-loader.test.js # 19 tests
├── validator-engine.test.js# 34 tests
└── README.md              # Test documentation

docs/
├── architecture/
│   └── PHASE-0-FOUNDATION.md  # Architecture guide
├── DEVELOPER-GUIDE.md         # This guide
└── QUICK-REFERENCE.md         # Quick reference
```

---

## Cheat Sheet

### Essential Imports

```javascript
// Template System
import { loadTemplate, injectAutoFields, applyDefaults } from './templates/loader.js';

// Config
import { loadTeachConfig } from './config/loader.js';

// Validation
import { ValidatorEngine } from './validators/engine.js';
import { validateLatex } from './validators/latex.js';

// AI
import { AIProvider } from './ai/provider.js';
```

### Minimal Working Example

```javascript
import { loadTemplate, injectAutoFields } from './templates/loader.js';
import { loadTeachConfig } from './config/loader.js';
import { ValidatorEngine } from './validators/engine.js';
import { AIProvider } from './ai/provider.js';

// Load config and template
const config = loadTeachConfig(process.cwd());
const template = loadTemplate('exam');

// Generate with AI
const ai = new AIProvider(config.ai_generation);
const result = await ai.generate('Create an exam');

// Enrich and validate
const content = injectAutoFields(result.content, template, { course: config.course_info });
const validator = new ValidatorEngine();
const validation = validator.validate(content, template);

console.log(validation.isValid ? '✓ Valid' : '✗ Invalid');
```

---

## Next Steps

1. **Read:** [Developer Guide](DEVELOPER-GUIDE.md) for detailed examples
2. **Review:** [Architecture Docs](architecture/PHASE-0-FOUNDATION.md) for system design
3. **Explore:** Source code in `src/teaching/` with inline documentation
4. **Test:** Run `npm test` to see all tests in action

---

**Version:** 1.0.0 | **Phase:** 0 | **Status:** Complete ✅
