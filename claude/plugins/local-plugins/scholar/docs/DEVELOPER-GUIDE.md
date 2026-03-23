# Phase 0 Developer Guide

### For developers implementing teaching commands using the Phase 0 foundation

This guide shows you how to use the Template System, Config Loader, Validator Engine, and AI Provider to build robust teaching commands.

---

## Quick Start

### Minimal Example: Simple Quiz Generator

```javascript
import { loadTemplate, injectAutoFields } from '../src/teaching/templates/loader.js';
import { loadTeachConfig } from '../src/teaching/config/loader.js';
import { ValidatorEngine } from '../src/teaching/validators/engine.js';
import { AIProvider } from '../src/teaching/ai/provider.js';

async function generateQuiz(topic) {
  // 1. Load configuration
  const config = loadTeachConfig(process.cwd());

  // 2. Load template
  const template = loadTemplate('quiz');

  // 3. Generate content with AI
  const ai = new AIProvider({ apiKey: config.ai_generation.api_key });
  const result = await ai.generate(
    `Create a quiz about ${topic}`,
    { temperature: config.ai_generation.temperature }
  );

  if (!result.success) {
    throw new Error(`Generation failed: ${result.error}`);
  }

  // 4. Inject auto-fields
  const content = injectAutoFields(result.content, template, {
    course: config.course_info,
    generated_by: { model: config.ai_generation.model }
  });

  // 5. Validate
  const validator = new ValidatorEngine();
  const validation = validator.validate(content, template);

  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    throw new Error('Generated content is invalid');
  }

  return content;
}

// Usage
const quiz = await generateQuiz('Linear Regression');
console.log(quiz);
```

---

## Component Usage

### 1. Template System

#### Loading Templates

```javascript
import { loadTemplate } from '../src/teaching/templates/loader.js';

// Load base template
const examTemplate = loadTemplate('exam');

// Returns JSON Schema with common fields:
// - schema_version
// - template_type
// - metadata (title, course, date, author)
// - generated_by (tool, version, timestamp, model)
```

#### Merging Templates

```javascript
import { mergeTemplates } from '../src/teaching/templates/loader.js';

// Base template (common fields)
const base = {
  properties: {
    title: { type: 'string' },
    metadata: { type: 'object' }
  }
};

// Specific template (exam-specific fields)
const examSpecific = {
  properties: {
    questions: {
      type: 'array',
      items: { type: 'object' }
    },
    answer_key: { type: 'object' }
  }
};

// Deep merge
const fullTemplate = mergeTemplates(base, examSpecific);

// Result has both sets of properties
console.log(fullTemplate.properties.title);      // from base
console.log(fullTemplate.properties.questions);  // from specific
```

### Array Handling

```javascript
// Arrays are concatenated, not replaced
const base = {
  required: ['title', 'metadata']
};

const specific = {
  required: ['questions', 'answer_key']
};

const merged = mergeTemplates(base, specific);
// merged.required = ['title', 'metadata', 'questions', 'answer_key']
```

#### Injecting Auto-Fields

```javascript
import { injectAutoFields } from '../src/teaching/templates/loader.js';

const content = {
  title: 'Midterm Exam',
  questions: [/* ... */]
};

const template = loadTemplate('exam');

// Inject metadata automatically
const enriched = injectAutoFields(content, template, {
  course: {
    code: 'STAT-101',
    title: 'Introduction to Statistics'
  },
  generated_by: {
    tool: 'scholar',
    version: '1.0.0',
    model: 'claude-3-5-sonnet-20241022'
  }
});

// Now includes:
// - schema_version: "1.0"
// - metadata.date: "2026-01-11"
// - metadata.course: "STAT-101: Introduction to Statistics"
// - generated_by.timestamp: "2026-01-11T12:34:56Z"
```

#### Applying Defaults

```javascript
import { applyDefaults } from '../src/teaching/templates/loader.js';

// Template with defaults
const template = {
  properties: {
    difficulty: {
      type: 'string',
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    time_limit: {
      type: 'number',
      default: 60
    }
  }
};

// Content missing some fields
const content = {
  title: 'Quiz 1'
  // difficulty and time_limit missing
};

// Apply defaults
const complete = applyDefaults(content, template);

console.log(complete.difficulty);  // 'medium' (from default)
console.log(complete.time_limit);  // 60 (from default)
console.log(complete.title);       // 'Quiz 1' (preserved)
```

---

### 2. Configuration Loader

#### Basic Usage

```javascript
import { loadTeachConfig } from '../src/teaching/config/loader.js';

// Search from current directory upward
const config = loadTeachConfig(process.cwd());

// Access configuration
console.log(config.course_info.code);           // "STAT-101"
console.log(config.teaching_preferences.difficulty_default); // "intermediate"
console.log(config.ai_generation.model);        // "claude-3-5-sonnet-20241022"
```

#### Custom Search Options

```javascript
// Strict mode: throw error if config not found
const config = loadTeachConfig(process.cwd(), { strict: true });

// Custom max search depth (default: 10)
const config = loadTeachConfig(process.cwd(), { maxDepth: 5 });

// Provide defaults
const config = loadTeachConfig(process.cwd(), {
  defaults: {
    course_info: {
      level: 'undergraduate'
    }
  }
});
```

#### Configuration File Format

Create `.flow/teach-config.yml` in your project:

```yaml
course_info:
  code: "STAT-440"
  title: "Regression Analysis"
  semester: "Spring 2026"
  level: "undergraduate"
  instructor:
    name: "Dr. Jane Smith"
    email: "jane.smith@university.edu"
    office: "Statistics Building 301"
    office_hours: "MWF 2-3pm"

teaching_preferences:
  difficulty_default: "intermediate"
  include_solutions: true
  latex_format: "inline"
  output_format: "markdown"
  question_numbering: "auto"

ai_generation:
  model: "claude-3-5-sonnet-20241022"
  temperature: 0.7
  max_tokens: 4096
  timeout: 30000
```

#### Validation and Warnings

```javascript
// Invalid config triggers warnings but continues
const config = loadTeachConfig('/path/with/invalid/config');

// Warnings logged to console:
// Warning: Configuration validation failed:
// Invalid course_info.level: "invalid". Must be "undergraduate" or "graduate"
// Proceeding with merged configuration.

// Config still usable (merged with defaults)
console.log(config.course_info.level);  // "undergraduate" (from defaults)
```

---

### 3. Validator Engine

#### Full Validation

```javascript
import { ValidatorEngine } from '../src/teaching/validators/engine.js';

const validator = new ValidatorEngine({
  strictMode: false,      // warnings don't fail validation
  validateLatex: true,    // check LaTeX syntax
  checkCompleteness: true // check answer keys, etc.
});

const content = {
  title: 'Midterm Exam',
  questions: [
    {
      id: 'Q1',
      type: 'multiple-choice',
      text: 'What is $\\frac{a}{b}$?',
      options: ['A', 'B', 'C', 'D']
    }
  ],
  answer_key: {
    Q1: 'B'
  }
};

const template = loadTemplate('exam');
const result = validator.validate(content, template);

if (result.isValid) {
  console.log('✓ Content is valid');
} else {
  console.error('Validation failed:');
  result.errors.forEach(err => {
    console.error(`  ${err.field}: ${err.message}`);
  });
}

// Check warnings
if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

#### Quick Validation (Schema Only)

```javascript
// Skip LaTeX and completeness checks for speed
const result = validator.quickValidate(content, template);

// Only validates JSON Schema
// Useful for rapid iteration during development
```

#### Strict Mode

```javascript
const validator = new ValidatorEngine({ strictMode: true });

// In strict mode, warnings become errors
const result = validator.validate(content, template);

// result.isValid will be false if ANY warnings exist
```

#### Error Handling Examples

### Schema Errors

```javascript
const content = {
  title: 123,  // should be string
  questions: 'not an array'
};

const result = validator.validate(content, template);

// result.errors:
// [
//   { field: 'title', message: 'Invalid type: expected string, got number', type: 'schema' },
//   { field: 'questions', message: 'Invalid type: expected array, got string', type: 'schema' }
// ]
```

### LaTeX Errors

```javascript
const content = {
  title: 'Exam',
  questions: [
    {
      text: 'What is $x^{2$?'  // unbalanced brace
    }
  ]
};

const result = validator.validate(content, template);

// result.errors:
// [
//   { field: 'questions[0].text', message: 'LaTeX error: Unmatched opening brace', type: 'latex' }
// ]
```

### Completeness Errors

```javascript
const content = {
  title: 'Exam',
  questions: [
    { id: 'Q1', type: 'multiple-choice', text: 'Question?' }
    // missing options!
  ]
  // missing answer_key!
};

const result = validator.validate(content, template);

// result.errors:
// [
//   { field: 'answer_key', message: 'Missing answer key for exam questions', type: 'completeness' },
//   { field: 'questions[0].options', message: 'Multiple-choice question Q1 missing options', type: 'completeness' }
// ]
```

---

### 4. LaTeX Validator

#### Standalone Usage

```javascript
import { validateLatex, extractMath, hasLatex } from '../src/teaching/validators/latex.js';

// Check if text contains LaTeX
const text = 'The formula is $E = mc^2$';
console.log(hasLatex(text));  // true

// Validate LaTeX syntax
const errors = validateLatex('Formula: $x^{2$');
// errors: [{ message: 'Unmatched opening brace', position: 13, context: '...' }]

// Extract math blocks
const blocks = extractMath('Inline $a$ and display $$b$$');
// blocks: [
//   { type: 'inline', content: 'a', position: 7 },
//   { type: 'display', content: 'b', position: 23 }
// ]
```

#### Common LaTeX Issues

### Unbalanced Delimiters

```javascript
// Single $ must be paired
validateLatex('Formula: $x^2');  // ERROR: unbalanced $

// Double $$ must be paired
validateLatex('$$x^2');  // ERROR: unbalanced $$

// Brackets must match
validateLatex('\\[x^2');  // ERROR: unbalanced \[
```

### Brace Matching

```javascript
// Opening braces need closing
validateLatex('$x^{2$');   // ERROR: unmatched opening brace

// Closing braces need opening
validateLatex('$x^2}$');   // ERROR: unmatched closing brace

// Nested braces work
validateLatex('$\\frac{x^{2}}{y}$');  // OK
```

### Command Syntax

```javascript
// \frac needs braces
validateLatex('$\\frac x$');        // ERROR: invalid \frac syntax
validateLatex('$\\frac{a}{b}$');    // OK

// Backslash + space is likely typo
validateLatex('$\\ alpha$');        // WARNING: backslash followed by space
validateLatex('$\\alpha$');         // OK
```

---

### 5. AI Provider

#### Basic Generation

```javascript
import { AIProvider } from '../src/teaching/ai/provider.js';

const provider = new AIProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  maxRetries: 3,
  timeout: 30000,
  maxTokens: 4096,
  debug: false
});

const result = await provider.generate(
  'Create 5 multiple-choice questions about linear regression',
  {
    format: 'json',
    temperature: 0.7,
    context: {
      course: 'STAT-440',
      difficulty: 'intermediate'
    }
  }
);

if (result.success) {
  console.log('Generated content:', result.content);
  console.log('Tokens used:', result.metadata.tokens);
  console.log('Duration:', result.metadata.duration, 'ms');
} else {
  console.error('Generation failed:', result.error);
  console.error('Attempts made:', result.metadata.attempts);
}
```

#### Handling Errors

```javascript
const result = await provider.generate('prompt');

if (!result.success) {
  // Check error type
  console.log('Error type:', result.metadata.errorType);

  // Retryable errors (rate limit, network issues)
  if (provider.isRetryable(new Error(result.error))) {
    console.log('This was a transient error, already retried');
  }

  // Non-retryable errors (invalid input, auth failure)
  console.error('Permanent failure:', result.error);
}
```

#### Statistics Tracking

```javascript
// Generate multiple times
await provider.generate('prompt 1');
await provider.generate('prompt 2');
await provider.generate('prompt 3');

// Get statistics
const stats = provider.getStats();

console.log('Total requests:', stats.totalRequests);
console.log('Successful:', stats.successfulRequests);
console.log('Failed:', stats.failedRequests);
console.log('Retried:', stats.retriedRequests);
console.log('Success rate:', stats.successRate.toFixed(2), '%');
console.log('Total tokens:', stats.totalTokens);
console.log('Average tokens:', stats.averageTokens.toFixed(0));

// Reset statistics
provider.resetStats();
```

#### Custom Retry Logic

```javascript
const provider = new AIProvider({
  maxRetries: 5,  // increase retries
  timeout: 60000  // 60 second timeout
});

// Provider automatically retries on:
// - Network errors (ECONNRESET, ETIMEDOUT)
// - Rate limits
// - Service unavailable (503)
// - Internal server errors (500)

// With exponential backoff:
// Attempt 1: immediate
// Attempt 2: ~1s delay
// Attempt 3: ~2s delay
// Attempt 4: ~4s delay
// Attempt 5: ~8s delay
```

#### Rate Limiting

```javascript
const provider = new AIProvider();

// Default: 100ms between requests
provider.minRequestInterval = 200; // 200ms between requests

// Provider automatically delays if needed
await provider.generate('prompt 1');
await provider.generate('prompt 2');  // waits 200ms after previous
```

#### Debug Mode

```javascript
const provider = new AIProvider({ debug: true });

// Logs all operations:
await provider.generate('prompt');

// Console output:
// [AIProvider] Generating content...
// [AIProvider] Rate limiting: waiting 50ms
// [AIProvider] Attempt 1/3
// [AIProvider] Generation successful in 123ms
```

---

## Complete Example: Exam Generator

### File: `commands/teaching/exam.js`

```javascript
import { loadTemplate, injectAutoFields, applyDefaults } from '../../core/teaching/templates/loader.js';
import { loadTeachConfig } from '../../core/teaching/config/loader.js';
import { ValidatorEngine } from '../../core/teaching/validators/engine.js';
import { AIProvider } from '../../core/teaching/ai/provider.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate an exam with AI
 * @param {string} type - Exam type (midterm, final, practice)
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated exam content
 */
export async function generateExam(type, options = {}) {
  // 1. Load configuration
  console.log('📋 Loading configuration...');
  const config = loadTeachConfig(process.cwd());

  // 2. Load template
  console.log('📄 Loading exam template...');
  const template = loadTemplate('exam');

  // 3. Prepare AI prompt
  const prompt = buildExamPrompt(type, config, options);

  // 4. Generate content with AI
  console.log('🤖 Generating exam content...');
  const ai = new AIProvider({
    apiKey: config.ai_generation.api_key,
    model: config.ai_generation.model,
    maxTokens: config.ai_generation.max_tokens,
    timeout: config.ai_generation.timeout,
    debug: options.debug || false
  });

  const result = await ai.generate(prompt, {
    format: 'json',
    temperature: config.ai_generation.temperature,
    context: {
      course: config.course_info,
      difficulty: options.difficulty || config.teaching_preferences.difficulty_default
    }
  });

  if (!result.success) {
    throw new Error(`AI generation failed: ${result.error}`);
  }

  // 5. Enrich content
  console.log('✨ Enriching content with metadata...');
  let content = result.content;

  // Apply defaults
  content = applyDefaults(content, template);

  // Inject auto-fields
  content = injectAutoFields(content, template, {
    course: config.course_info,
    generated_by: {
      tool: 'scholar',
      version: '1.0.0',
      model: result.metadata.model,
      tokens: result.metadata.tokens
    }
  });

  // 6. Validate
  console.log('✅ Validating content...');
  const validator = new ValidatorEngine({
    strictMode: options.strict || false,
    validateLatex: true,
    checkCompleteness: true
  });

  const validation = validator.validate(content, template);

  if (!validation.isValid) {
    console.error('❌ Validation failed:');
    validation.errors.forEach(err => {
      console.error(`  ${err.field}: ${err.message}`);
    });
    throw new Error('Generated content failed validation');
  }

  // Show warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  ${warning}`);
    });
  }

  // 7. Save to file
  const filename = `exam-${type}-${Date.now()}.json`;
  const filepath = path.join(process.cwd(), filename);

  console.log(`💾 Saving to ${filename}...`);
  await fs.writeFile(filepath, JSON.stringify(content, null, 2));

  // 8. Display statistics
  const stats = ai.getStats();
  console.log('\n📊 Generation Statistics:');
  console.log(`  Tokens used: ${result.metadata.tokens}`);
  console.log(`  Duration: ${result.metadata.duration}ms`);
  console.log(`  Attempts: ${result.metadata.attempts}`);
  console.log(`  Success rate: ${stats.successRate.toFixed(1)}%`);

  return {
    content,
    filepath,
    validation,
    metadata: result.metadata
  };
}

/**
 * Build AI prompt for exam generation
 */
function buildExamPrompt(type, config, options) {
  return `
Generate a ${type} exam for ${config.course_info.code}: ${config.course_info.title}.

Requirements:
- Difficulty: ${options.difficulty || config.teaching_preferences.difficulty_default}
- Number of questions: ${options.questionCount || 10}
- Question types: multiple-choice, short-answer, essay
- Include LaTeX math notation where appropriate
- Provide complete answer key

Course context:
- Level: ${config.course_info.level}
- Instructor: ${config.course_info.instructor.name}

Format the output as JSON matching this structure:
{
  "title": "Exam title",
  "questions": [
    {
      "id": "Q1",
      "type": "multiple-choice",
      "text": "Question text with $\\LaTeX$ if needed",
      "options": ["A", "B", "C", "D"],
      "points": 10
    }
  ],
  "answer_key": {
    "Q1": "B"
  }
}
`.trim();
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, type = 'midterm', ...args] = process.argv;

  generateExam(type, {
    difficulty: args.includes('--easy') ? 'easy' :
                args.includes('--hard') ? 'hard' : 'intermediate',
    debug: args.includes('--debug'),
    strict: args.includes('--strict')
  })
    .then(result => {
      console.log('\n✅ Exam generated successfully!');
      console.log(`📁 File: ${result.filepath}`);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}
```

### Usage

```bash
# Generate midterm exam
node commands/teaching/exam.js midterm

# Generate with options
node commands/teaching/exam.js final --hard --debug

# Generate with strict validation
node commands/teaching/exam.js practice --strict
```

---

## Testing Your Implementation

### Unit Test Template

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateExam } from '../commands/teaching/exam.js';
import { loadTeachConfig } from '../core/teaching/config/loader.js';

describe('Exam Generator', () => {
  let config;

  beforeEach(() => {
    config = loadTeachConfig(process.cwd());
  });

  it('should generate valid exam', async () => {
    const result = await generateExam('midterm', {
      questionCount: 5,
      difficulty: 'easy'
    });

    expect(result.content).toBeDefined();
    expect(result.content.questions).toHaveLength(5);
    expect(result.validation.isValid).toBe(true);
  });

  it('should include answer key', async () => {
    const result = await generateExam('practice');

    expect(result.content.answer_key).toBeDefined();
    expect(Object.keys(result.content.answer_key).length).toBeGreaterThan(0);
  });

  it('should validate LaTeX syntax', async () => {
    const result = await generateExam('final');

    // If there's LaTeX, it should be valid
    const hasLatex = JSON.stringify(result.content).includes('$');
    if (hasLatex) {
      const latexErrors = result.validation.errors.filter(e => e.type === 'latex');
      expect(latexErrors).toHaveLength(0);
    }
  });

  it('should respect difficulty setting', async () => {
    const easy = await generateExam('practice', { difficulty: 'easy' });
    const hard = await generateExam('practice', { difficulty: 'hard' });

    // Both should be valid
    expect(easy.validation.isValid).toBe(true);
    expect(hard.validation.isValid).toBe(true);
  });
});
```

---

## Best Practices

### 1. Error Handling

```javascript
// Always check AI generation success
const result = await ai.generate(prompt);
if (!result.success) {
  // Log error details
  console.error('Generation failed:', result.error);
  console.error('Attempts:', result.metadata.attempts);

  // Provide fallback or rethrow
  throw new Error(`AI generation failed: ${result.error}`);
}
```

### 2. Validation Strategy

```javascript
// Use quickValidate during development for speed
const quickResult = validator.quickValidate(content, template);

// Use full validation before saving/publishing
const fullResult = validator.validate(content, template);

// Handle validation failures gracefully
if (!fullResult.isValid) {
  // Show errors to user
  console.error('Validation errors:', fullResult.errors);

  // Option 1: Regenerate with fixes
  // Option 2: Allow manual editing
  // Option 3: Save as draft
}
```

### 3. Configuration Management

```javascript
// Load config once at startup
const config = loadTeachConfig(process.cwd());

// Use config throughout
const ai = new AIProvider({
  model: config.ai_generation.model,
  temperature: config.ai_generation.temperature
});

// Respect user preferences
if (config.teaching_preferences.include_solutions) {
  // Include solutions
}
```

### 4. Template Reuse

```javascript
// Load template once
const template = loadTemplate('exam');

// Reuse for multiple validations
const validator = new ValidatorEngine();

for (const content of contents) {
  const result = validator.validate(content, template);
  // ...
}
```

### 5. Statistics Tracking

```javascript
// Track across batch operations
const ai = new AIProvider();

for (const topic of topics) {
  await ai.generate(`Generate quiz about ${topic}`);
}

// Analyze batch performance
const stats = ai.getStats();
console.log('Batch complete:');
console.log(`  Success rate: ${stats.successRate}%`);
console.log(`  Total tokens: ${stats.totalTokens}`);
console.log(`  Retries needed: ${stats.retriedRequests}`);
```

---

## Troubleshooting

### Issue: Config Not Found

```javascript
// Problem: loadTeachConfig returns default config
const config = loadTeachConfig(process.cwd());

// Solution: Check search path
const config = loadTeachConfig(process.cwd(), { debug: true });
// Logs: "Searching for .flow/teach-config.yml in /path/to/project"
// Logs: "Not found, checking parent directory..."

// Create config file in .flow/ directory
mkdir -p .flow
cat > .flow/teach-config.yml << EOF
course_info:
  code: "STAT-101"
EOF
```

### Issue: Validation Fails on LaTeX

```javascript
// Problem: LaTeX validation errors
const result = validator.validate(content, template);
// Error: "Unbalanced inline math delimiter ($)"

// Solution: Check LaTeX syntax
import { validateLatex } from '../core/teaching/validators/latex.js';

const text = content.questions[0].text;
const latexErrors = validateLatex(text);
latexErrors.forEach(err => {
  console.log(`Position ${err.position}: ${err.message}`);
  console.log(`Context: ${err.context}`);
});

// Fix: Ensure paired delimiters
// Wrong: $x^2
// Right: $x^2$
```

### Issue: AI Generation Timeout

```javascript
// Problem: Requests timing out
const result = await ai.generate(longPrompt);
// Error: "Request timeout"

// Solution: Increase timeout
const ai = new AIProvider({
  timeout: 60000  // 60 seconds
});

// Or reduce prompt length / token count
const ai = new AIProvider({
  maxTokens: 2048  // smaller responses
});
```

### Issue: Rate Limiting

```javascript
// Problem: Getting rate limited
// Error: "Rate limit exceeded"

// Solution 1: Increase delay between requests
const ai = new AIProvider();
ai.minRequestInterval = 500;  // 500ms between requests

// Solution 2: Use retry logic (automatic)
// Provider will automatically retry with backoff

// Solution 3: Batch operations with delays
for (const topic of topics) {
  await ai.generate(`Topic: ${topic}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

---

## Next Steps

### Implement Your First Command

1. Start with the exam generator example above
2. Test with simple prompts first
3. Add error handling for edge cases
4. Write unit tests for core functionality
5. Add integration tests for full workflow

### Extend Phase 0

- Add custom template schemas
- Implement custom validators
- Create prompt templates
- Build command-line interfaces

### See Also

- [Phase 0 Architecture](architecture/PHASE-0-FOUNDATION.md) - Full system design
- [Test Documentation](https://github.com/Data-Wise/scholar/blob/main/tests/README.md) - Testing patterns and examples
- `src/teaching/` - Source code with inline documentation
