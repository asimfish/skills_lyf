# Phase 0: Foundation Architecture

**Status:** ✅ Complete (2026-01-11)
**Version:** 1.0.0
**Test Coverage:** {{ scholar.test_count }} tests, 100% passing

---

## Overview

Phase 0 establishes the foundational architecture for the scholar teaching features. It provides four core components that all teaching commands (exam, quiz, slides, feedback) will build upon.

### Design Principles

- **Separation of Concerns** - Each component has a single, well-defined responsibility
- **Composability** - Components work independently but integrate seamlessly
- **Testability** - Every component has comprehensive unit tests (>95% coverage)
- **Extensibility** - Easy to add new templates, validators, and content types

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Teaching Command Layer"
        EXAM[/teaching:exam]
        QUIZ[/teaching:quiz]
        SLIDES[/teaching:slides]
        FEEDBACK[/teaching:feedback]
    end

    subgraph "Phase 0 Foundation"
        subgraph "Template System"
            BASE[Base Template<br/>base.json]
            LOADER[Template Loader<br/>loader.js]
            BASE --> LOADER
        end

        subgraph "Configuration"
            CONFIG[Config Loader<br/>loader.js]
            YAML[.flow/teach-config.yml]
            YAML -.->|searches parent dirs| CONFIG
        end

        subgraph "Validation Engine"
            ENGINE[Validator Engine<br/>engine.js]
            LATEX[LaTeX Validator<br/>latex.js]
            ENGINE --> LATEX
        end

        subgraph "AI Generation"
            PROVIDER[AI Provider<br/>provider.js]
            ANTHROPIC[Claude API]
            PROVIDER -.->|future integration| ANTHROPIC
        end
    end

    EXAM --> LOADER
    EXAM --> CONFIG
    EXAM --> ENGINE
    EXAM --> PROVIDER

    QUIZ --> LOADER
    QUIZ --> CONFIG
    QUIZ --> ENGINE
    QUIZ --> PROVIDER

    SLIDES --> LOADER
    SLIDES --> CONFIG
    SLIDES --> ENGINE
    SLIDES --> PROVIDER

    FEEDBACK --> LOADER
    FEEDBACK --> CONFIG
    FEEDBACK --> ENGINE
    FEEDBACK --> PROVIDER

    style BASE fill:#e1f5ff
    style LOADER fill:#e1f5ff
    style CONFIG fill:#fff4e1
    style ENGINE fill:#f0ffe1
    style LATEX fill:#f0ffe1
    style PROVIDER fill:#ffe1f5
```

---

## Component Architecture

### 1. Template System

**Location:** `src/teaching/templates/`

```mermaid
graph LR
    subgraph "Template System"
        BASE[Base Template<br/>Common Fields]
        SPECIFIC[Specific Template<br/>exam.json / quiz.json]
        MERGED[Merged Template<br/>Full Schema]

        BASE --> MERGE[mergeTemplates]
        SPECIFIC --> MERGE
        MERGE --> MERGED

        MERGED --> INJECT[injectAutoFields]
        INJECT --> DEFAULTS[applyDefaults]
        DEFAULTS --> FINAL[Final Content]
    end

    style BASE fill:#e1f5ff
    style MERGED fill:#c1e5ff
    style FINAL fill:#a1d5ff
```

### Responsibilities (Component Architecture)

- Define common schema fields (schema_version, metadata, generated_by)
- Load and merge base + specific templates
- Auto-inject generated metadata (timestamp, model info)
- Apply default values from schema

### Key Functions (Component Architecture)

- `loadTemplate(type)` - Load base template for content type
- `mergeTemplates(base, specific)` - Deep merge with array handling
- `injectAutoFields(content, template, options)` - Auto-populate metadata
- `applyDefaults(content, template)` - Apply schema defaults

**Test Coverage:** 19 tests

---

### 2. Configuration Loader

**Location:** `src/teaching/config/`

```mermaid
graph TB
    START[Teaching Command Invoked]
    START --> SEARCH[Search for .flow/teach-config.yml]

    SEARCH --> CHECK{Config Found?}
    CHECK -->|Yes| LOAD[Load YAML Config]
    CHECK -->|No| PARENT{Parent Directory?}

    PARENT -->|Yes| SEARCH
    PARENT -->|No| DEFAULT[Use Default Config]

    LOAD --> VALIDATE[Validate Config]
    VALIDATE --> VALID{Valid?}

    VALID -->|Yes| MERGE[Merge with Defaults]
    VALID -->|No| WARN[Warning + Merge]

    WARN --> MERGE
    DEFAULT --> MERGE
    MERGE --> FINAL[Final Config]

    style LOAD fill:#fff4e1
    style MERGE fill:#ffd4a1
    style FINAL fill:#ffb481
```

### Responsibilities

- Search parent directories for `.flow/teach-config.yml`
- Parse and validate YAML configuration
- Merge user config with sensible defaults
- Provide config to all teaching commands

### Configuration Structure

```yaml
course_info:
  code: "STAT-101"
  title: "Introduction to Statistics"
  semester: "Spring 2026"
  level: "undergraduate"
  instructor:
    name: "Dr. Jane Smith"
    email: "jane.smith@university.edu"

teaching_preferences:
  difficulty_default: "intermediate"
  include_solutions: true
  latex_format: "inline"
  output_format: "markdown"

ai_generation:
  model: "claude-3-5-sonnet-20241022"
  temperature: 0.7
  max_tokens: 4096
```

### Key Functions

- `loadTeachConfig(startDir, options)` - Load config with parent search
- `findConfigFile(dir)` - Recursive parent directory search
- `mergeConfig(user, defaults)` - Deep merge configurations
- `validateConfig(config)` - Schema validation

**Test Coverage:** 36 tests

---

### 3. Validation Engine

**Location:** `src/teaching/validators/`

```mermaid
graph TB
    CONTENT[Generated Content]
    TEMPLATE[Template Schema]

    CONTENT --> ENGINE[Validation Engine]
    TEMPLATE --> ENGINE

    ENGINE --> SCHEMA[JSON Schema<br/>Validation]
    ENGINE --> LATEX[LaTeX Syntax<br/>Checking]
    ENGINE --> COMPLETE[Completeness<br/>Checks]

    SCHEMA --> SCHEMA_ERR{Errors?}
    LATEX --> LATEX_ERR{Errors?}
    COMPLETE --> COMPLETE_ERR{Errors?}

    SCHEMA_ERR -->|Yes| ERRORS[Error List]
    LATEX_ERR -->|Yes| ERRORS
    COMPLETE_ERR -->|Yes| ERRORS

    SCHEMA_ERR -->|No| PASS
    LATEX_ERR -->|No| PASS
    COMPLETE_ERR -->|No| PASS

    ERRORS --> RESULT[Validation Result]
    PASS[All Passed] --> RESULT

    style SCHEMA fill:#f0ffe1
    style LATEX fill:#d0f0c1
    style COMPLETE fill:#b0e0a1
    style ERRORS fill:#ffcccc
    style PASS fill:#ccffcc
```

### Responsibilities - Component Architecture

- **JSON Schema Validation** - Enforce structure and types (ajv + ajv-keywords)
- **LaTeX Syntax Checking** - Validate math delimiters, braces, commands
- **Completeness Checks** - Ensure answer keys, MC options, rubrics present
- **Error Reporting** - Clear, actionable error messages with context

### Validation Layers

#### Layer 1: JSON Schema (ajv)

- Required field checking
- Type validation (string, number, array, object)
- Enum validation for fixed values
- Conditional schema (if/then/else)

#### Layer 2: LaTeX Syntax

- Inline math delimiters: `$...$`
- Display math delimiters: `$$...$$` and `\[...\]`
- Brace matching: `{...}`
- Command syntax: `\frac{a}{b}`, `\alpha`, etc.

#### Layer 3: Completeness

- Exam/quiz: Answer key required
- Multiple-choice: Options required (≥2)
- Essay questions: Rubric required
- All questions: ID consistency

### Key Functions - Component Architecture

- `validate(content, template)` - Full validation pipeline
- `validateSchema(content, template)` - JSON Schema validation
- `validateLatexContent(content)` - Recursive LaTeX checking
- `checkCompleteness(content, template)` - Domain-specific checks
- `quickValidate(content, template)` - Schema-only (fast)

### LaTeX Validator Functions

- `validateLatex(text)` - Check all LaTeX syntax
- `extractMath(text)` - Extract inline/display math blocks
- `hasLatex(text)` - Detect LaTeX presence
- `checkInlineMath(text)` - Validate `$...$`
- `checkDisplayMath(text)` - Validate `$$...$$` and `\[...\]`
- `checkBraces(text)` - Match opening/closing braces
- `checkCommands(text)` - Validate command syntax

**Test Coverage:** 61 tests (34 engine + 27 LaTeX)

---

### 4. AI Provider

**Location:** `src/teaching/ai/`

```mermaid
sequenceDiagram
    participant CMD as Teaching Command
    participant PROVIDER as AI Provider
    participant LIMITER as Rate Limiter
    participant RETRY as Retry Logic
    participant API as Claude API (Future)
    participant STATS as Statistics

    CMD->>PROVIDER: generate(prompt, options)
    PROVIDER->>STATS: Increment totalRequests
    PROVIDER->>LIMITER: enforceRateLimit()
    LIMITER-->>PROVIDER: OK (waited if needed)

    loop Retry Loop (max 3 attempts)
        PROVIDER->>RETRY: Attempt N
        RETRY->>API: makeRequest()

        alt Success
            API-->>RETRY: Response
            RETRY-->>PROVIDER: Content
            PROVIDER->>STATS: Increment successfulRequests
            PROVIDER-->>CMD: {success: true, content, metadata}
        else Retryable Error
            API-->>RETRY: Error (rate limit, timeout, etc.)
            RETRY->>RETRY: exponentialBackoff(attempt)
            Note over RETRY: Wait: 1s, 2s, 4s (with jitter)
            PROVIDER->>STATS: Increment retriedRequests
        else Non-Retryable Error
            API-->>RETRY: Error (invalid input, etc.)
            RETRY-->>PROVIDER: Error
            PROVIDER->>STATS: Increment failedRequests
            PROVIDER-->>CMD: {success: false, error, metadata}
        end
    end
```

### Responsibilities - Component Architecture 2

- **Content Generation** - AI-powered content creation (mock in Phase 0)
- **Retry Logic** - Exponential backoff for transient failures
- **Rate Limiting** - Prevent API throttling
- **Error Handling** - Classify retryable vs non-retryable errors
- **Statistics Tracking** - Success rate, token usage, performance metrics

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: 1s delay (±20% jitter)
Attempt 3: 2s delay (±20% jitter)
Attempt 4: 4s delay (±20% jitter)
Max delay: 10s
```

### Retryable Errors

- Network errors: `ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`
- API errors: `Rate limit exceeded`, `Service unavailable`, `Internal server error`

### Non-Retryable Errors

- Client errors: `Invalid input`, `Authentication failed`, `Resource not found`

### Statistics

- `totalRequests` - All generation attempts
- `successfulRequests` - Successful completions
- `failedRequests` - Final failures
- `retriedRequests` - Retry attempts made
- `totalTokens` - Token usage tracking
- `successRate` - Success percentage
- `averageTokens` - Mean tokens per request

### Key Functions - Component Architecture 2

- `generate(prompt, options)` - Main generation method with retry
- `makeRequest(prompt, options)` - API call (mock in Phase 0)
- `enforceRateLimit()` - Delay between requests if needed
- `exponentialBackoff(attempt)` - Calculate retry delay
- `isRetryable(error)` - Classify error type
- `getStats()` - Retrieve statistics
- `resetStats()` - Clear statistics

**Test Coverage:** 28 tests

---

## Data Flow

### Complete Workflow: Exam Generation

```mermaid
sequenceDiagram
    participant USER as User
    participant CMD as /teaching:exam
    participant CONFIG as Config Loader
    participant TEMPLATE as Template System
    participant AI as AI Provider
    participant VALIDATOR as Validator Engine
    participant OUTPUT as Output File

    USER->>CMD: /teaching:exam "midterm"

    CMD->>CONFIG: loadTeachConfig(cwd)
    CONFIG->>CONFIG: Search for .flow/teach-config.yml
    CONFIG-->>CMD: Course info + preferences

    CMD->>TEMPLATE: loadTemplate('exam')
    TEMPLATE-->>CMD: Base template schema

    CMD->>AI: generate(prompt, context)
    AI->>AI: Retry with backoff if needed
    AI-->>CMD: Generated exam content

    CMD->>TEMPLATE: injectAutoFields(content)
    TEMPLATE-->>CMD: Content with metadata

    CMD->>VALIDATOR: validate(content, schema)

    VALIDATOR->>VALIDATOR: validateSchema()
    VALIDATOR->>VALIDATOR: validateLatexContent()
    VALIDATOR->>VALIDATOR: checkCompleteness()

    alt Validation Passed
        VALIDATOR-->>CMD: {isValid: true}
        CMD->>OUTPUT: Write exam file
        OUTPUT-->>USER: exam-midterm.json
    else Validation Failed
        VALIDATOR-->>CMD: {isValid: false, errors}
        CMD-->>USER: Show validation errors
        CMD->>AI: Regenerate with fixes
    end
```

---

## Testing Strategy

### Test Organization

```
tests/teaching/
├── template-loader.test.js      # 19 tests - Template system
├── config-loader.test.js        # 36 tests - Configuration
│   └── fixtures/
│       ├── valid-config.yml
│       ├── invalid-config.yml
│       ├── minimal-config.yml
│       └── malformed-config.yml
├── validator-engine.test.js     # 34 tests - Validation engine
├── latex-validator.test.js      # 27 tests - LaTeX validation
└── ai-provider.test.js          # 28 tests - AI provider
```

**Total:** {{ scholar.test_count }} tests, 100% passing

### Test Patterns

#### 1. Happy Path Testing

```javascript
it('should load template from file', () => {
  const template = loadTemplate('exam');
  expect(template).toBeDefined();
  expect(template.schema_version).toBe('1.0');
});
```

#### 2. Error Handling

```javascript
it('should handle missing config file', () => {
  const config = loadTeachConfig('/nonexistent');
  expect(config).toEqual(getDefaultConfig());
});
```

#### 3. Edge Cases

```javascript
it('should handle nested braces correctly', () => {
  const text = '$\\frac{x^{2}}{y}$';
  const errors = validateLatex(text);
  expect(errors).toHaveLength(0);
});
```

#### 4. Async Operations

```javascript
it('should retry on retryable errors', async () => {
  provider.makeRequest = mockFailTwiceThenSucceed();
  const result = await provider.generate('prompt');
  expect(result.metadata.attempts).toBe(3);
});
```

#### 5. Statistics Tracking

```javascript
it('should calculate success rate', async () => {
  await provider.generate('success1');
  await provider.generate('success2');
  await provider.generate('failure');
  const stats = provider.getStats();
  expect(stats.successRate).toBeCloseTo(66.67, 1);
});
```

---

## Integration Points

### With Existing Scholar Architecture

Phase 0 teaching components integrate with the existing scholar plugin structure:

```
scholar/
├── src/
│   ├── core/
│   │   ├── literature/        # Existing research features
│   │   ├── manuscript/        # Existing research features
│   │   └── teaching/          # ← Phase 0 Foundation
│   │       ├── ai/
│   │       ├── config/
│   │       ├── templates/
│   │       └── validators/
│   ├── plugin-api/
│   │   ├── commands/
│   │   │   ├── literature/    # Existing commands
│   │   │   ├── manuscript/    # Existing commands
│   │   │   └── teaching/      # ← Future Phase 1+ commands
│   │   └── skills/            # 17 existing research skills
│   └── mcp-server/            # Future MCP integration
├── lib/                       # Shell API wrappers
├── tests/
│   └── teaching/              # ← Phase 0 Tests
└── docs/
    └── architecture/          # ← This document
```

### Integration Benefits

- Shared core logic (no duplication)
- Consistent patterns across research and teaching
- Unified testing strategy
- Single plugin installation

---

## Performance Characteristics

### Component Performance

| Component        | Operation       | Typical Duration | Notes                         |
| ---------------- | --------------- | ---------------- | ----------------------------- |
| Template Loader  | Load + merge    | <10ms            | Synchronous file I/O          |
| Config Loader    | Search + parse  | <50ms            | Searches up to 10 parent dirs |
| Validator Engine | Full validation | <100ms           | Depends on content size       |
| LaTeX Validator  | Syntax check    | <20ms            | Per 1000 characters           |
| AI Provider      | Generate (mock) | 100ms            | Real API: 2-10 seconds        |

### Scalability

### Template System

- ✅ Handles deeply nested schemas (10+ levels)
- ✅ Efficient array merging (no quadratic behavior)
- ✅ Memory-efficient (no template caching needed)

### Config Loader

- ✅ Stops at first config found (no unnecessary I/O)
- ✅ YAML parsing is fast (<10ms for typical configs)
- ✅ Validation is O(n) where n = config properties

### Validator Engine

- ✅ Schema validation is O(n) where n = content size
- ✅ LaTeX validation is O(m) where m = string characters
- ✅ Parallelizable (validate multiple documents independently)

### AI Provider

- ✅ Rate limiting prevents API throttling
- ✅ Exponential backoff handles load gracefully
- ✅ Statistics tracking is O(1) per request

---

## Future Enhancements

### Phase 1: Command Implementation (Week 1-4)

### Week 1: `/teaching:exam`

- Build on template system
- Use validator for answer keys
- AI-generated question banks

### Week 2: `/teaching:quiz`

- Similar to exam, lighter weight
- Time limits and randomization
- Instant feedback mode

### Week 3: `/teaching:slides`

- LaTeX Beamer support
- Reveal.js HTML slides
- Progressive disclosure

### Week 4: `/teaching:feedback`

- Constructive criticism generation
- Rubric-based evaluation
- Personalized improvement suggestions

### Phase 2: Advanced Features (Future)

### Real Claude API Integration

```javascript
async makeRequest(prompt, options) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.maxTokens,
      temperature: options.temperature
    })
  });
  return response.json();
}
```

### Template Extensions

- Template versioning and migration
- Template inheritance (multilevel)
- Custom template plugins

### Validator Extensions

- Citation validation (BibTeX)
- Style guide checking (APA, MLA)
- Accessibility validation (WCAG)

### Config Extensions

- LMS integration (Canvas, Blackboard)
- Calendar sync
- Student roster management

---

## Migration Guide

### From statistical-research Plugin

Phase 0 foundation is brand new - no migration needed. Teaching features are additive to existing research commands.

### Coexistence

- Research commands: `/arxiv`, `/doi`, `/manuscript:methods`, etc.
- Teaching commands: `/teaching:exam`, `/teaching:quiz`, etc.
- Shared foundation: Both use core utilities

### For Plugin Developers

### Using Phase 0 Components in Your Plugin

```javascript
// Template System
import { loadTemplate, mergeTemplates } from 'scholar/src/teaching/templates/loader.js';

// Configuration
import { loadTeachConfig } from 'scholar/src/teaching/config/loader.js';

// Validation
import { ValidatorEngine } from 'scholar/src/teaching/validators/engine.js';
import { validateLatex } from 'scholar/src/teaching/validators/latex.js';

// AI Generation
import { AIProvider } from 'scholar/src/teaching/ai/provider.js';
```

All components are framework-agnostic and work in any Node.js environment.

---

## Documentation

### Phase 0 Documentation

- `tests/README.md` - Comprehensive test documentation
- `src/teaching/templates/base.json` - Schema documentation
- `docs/architecture/PHASE-0-FOUNDATION.md` - This document

### Future Documentation (Phase 1+)

- Command guides for each teaching command
- Tutorial: Creating custom templates
- Tutorial: Extending validators
- API reference for each component

---

## Changelog

### v1.0.0 (2026-01-11) - Phase 0 Complete

✅ **Template System**

- Base template with common fields
- Template loader with deep merging
- Auto-field injection
- Default value application
- 19 unit tests

✅ **Configuration Loader**

- Parent directory search for `.flow/teach-config.yml`
- YAML parsing and validation
- Deep config merging
- Comprehensive error handling
- 36 unit tests with fixtures

✅ **Validation Engine**

- JSON Schema validation (ajv + ajv-keywords)
- LaTeX syntax checking (inline, display, braces, commands)
- Completeness checks (answer keys, options, rubrics)
- 61 unit tests (34 engine + 27 LaTeX)

✅ **AI Provider**

- Content generation with retry logic
- Exponential backoff with jitter
- Rate limiting
- Statistics tracking
- 28 unit tests

**Total:** {{ scholar.test_count }} tests, 100% passing, >95% code coverage

---

## Contributors

Phase 0 Foundation implemented with Claude Sonnet 4.5

### Development Timeline

- 2026-01-11: Phase 0 complete (4-6 hours estimated, actual)

---

## License

MIT License - Part of the scholar plugin project
