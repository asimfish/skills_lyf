# Exam Generator

AI-powered comprehensive exam generation with Phase 0 foundation integration.

## Quick Start

```bash
# Generate a midterm exam
/teaching:exam midterm --questions 10

# JavaScript API
import { generateExam } from './src/teaching/generators/exam.js';

const exam = await generateExam({
  type: 'midterm',
  questionCount: 10,
  difficulty: 'medium'
});
```

## Features

- ✅ **5 Question Types**: Multiple-choice, short-answer, essay, true/false, numerical
- ✅ **Automatic Generation**: Questions, answer keys, LaTeX support
- ✅ **Full Validation**: Schema, LaTeX syntax, completeness checks
- ✅ **Variations**: Generate multiple exam versions
- ✅ **Phase 0 Integration**: Template System, Config Loader, Validator Engine, AI Provider

## API Reference

### `generateExam(options)`

```typescript
interface ExamOptions {
  type?: 'midterm' | 'final' | 'practice' | 'quiz';  // default: 'midterm'
  questionCount?: number;                             // default: 10
  difficulty?: 'easy' | 'medium' | 'hard';           // default: from config
  durationMinutes?: number;                          // default: 60
  topics?: string[];                                 // default: []
  questionTypes?: {                                  // default: see below
    'multiple-choice'?: number;
    'short-answer'?: number;
    'essay'?: number;
  };
  includeFormulas?: boolean;                         // default: true
  includeSolutions?: boolean;                        // default: true
  strict?: boolean;                                  // default: false
  debug?: boolean;                                   // default: false
}
```

### Default Question Distribution

```javascript
{
  'multiple-choice': 0.6,  // 60%
  'short-answer': 0.3,     // 30%
  'essay': 0.1             // 10%
}
```

### `generateExamVariations(options, count)`

Generate multiple exam variations with the same structure but different questions.

```javascript
const variations = await generateExamVariations(
  { type: 'midterm', questionCount: 10 },
  3  // Number of variations
);
```

## Configuration

Create `.flow/teach-config.yml`:

```yaml
scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    difficulty: "intermediate"
    instructor:
      name: "Dr. Jane Smith"

  ai_generation:
    model: "claude-3-5-sonnet-20241022"
    temperature: 0.7
    max_tokens: 4096
    api_key: "sk-..."  # Optional, uses ANTHROPIC_API_KEY env var
```

## Examples

### Basic Midterm

```javascript
const exam = await generateExam({
  type: 'midterm',
  questionCount: 10,
  difficulty: 'medium'
});

console.log(exam.content);
```

### Advanced Final Exam

```javascript
const exam = await generateExam({
  type: 'final',
  questionCount: 20,
  difficulty: 'hard',
  durationMinutes: 180,
  topics: ['regression', 'ANOVA', 'diagnostics'],
  questionTypes: {
    'multiple-choice': 0.4,
    'short-answer': 0.3,
    'essay': 0.2,
    'numerical': 0.1
  },
  includeFormulas: true,
  strict: true
});
```

### Generate Variations

```javascript
const variations = await generateExamVariations(
  {
    type: 'midterm',
    questionCount: 10,
    topics: ['hypothesis testing']
  },
  4  // A, B, C, D versions
);

variations.forEach((exam, i) => {
  fs.writeFileSync(
    `exam-v${i + 1}.json`,
    JSON.stringify(exam.content, null, 2)
  );
});
```

## Output Structure

```json
{
  "content": {
    "title": "Midterm Exam - Statistics 440",
    "exam_type": "midterm",
    "duration_minutes": 60,
    "total_points": 100,
    "questions": [
      {
        "id": "Q1",
        "type": "multiple-choice",
        "text": "What is the interpretation of $R^2$?",
        "options": ["...", "...", "...", "..."],
        "points": 10,
        "difficulty": "medium",
        "topic": "regression"
      }
    ],
    "answer_key": {
      "Q1": "B"
    },
    "formula_sheet": "$$R^2 = 1 - \\frac{SSE}{SST}$$"
  },
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "metadata": {
    "examType": "midterm",
    "questionCount": 10,
    "totalPoints": 100,
    "duration": 60,
    "generatedAt": "2025-01-12T00:00:00.000Z",
    "model": "claude-3-5-sonnet-20241022",
    "tokens": 3000
  }
}
```

## LaTeX Support

Use double backslashes for LaTeX notation:

```javascript
// Inline math
"Calculate $\\alpha$ when $x = 5$"

// Display math
"Solve: $$\\frac{a}{b} = \\frac{c}{d}$$"

// Complex expressions
"Find $\\bar{x}$ when $x_i \\sim N(\\mu, \\sigma^2)$"
```

## Validation

All exams go through 3-stage validation:

1. **Schema Validation** - JSON structure compliance
2. **LaTeX Validation** - Math notation syntax
3. **Completeness Validation** - Answer keys, options, rubrics

```javascript
const exam = await generateExam({ strict: true });

// Check results
console.log(exam.validation.isValid);
console.log(exam.validation.errors);
console.log(exam.validation.warnings);
```

## Testing

```bash
# Run all tests
npm test

# Run exam generator tests only
npm test tests/teaching/exam-generator.test.js

# Current test coverage:
# ✓ 5 smoke tests
# ✓ 4 unit tests
# ✓ Total: 9 tests
```

## Troubleshooting

### "AI generation failed"

```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Set if missing
export ANTHROPIC_API_KEY='your-key'
```

### "Validation failed"

```javascript
// Enable debug mode
const exam = await generateExam({ debug: true });

// Check specific errors
exam.validation.errors.forEach(err => {
  console.log(`${err.field}: ${err.message}`);
});
```

### LaTeX Errors

```javascript
// Use double backslashes
"$$\\frac{a}{b}$$"  // ✓ Correct
"$$\frac{a}{b}$$"   // ✗ Wrong

// Check warnings
exam.validation.warnings.forEach(console.log);
```

## Performance

| Questions | Time | Tokens | Cost* |
| --------- | ---- | ------ | ----- |
| 5         | ~5s  | ~1.5K  | $0.02 |
| 10        | ~10s | ~3K    | $0.05 |
| 20        | ~20s | ~6K    | $0.10 |

*Approximate with Claude Sonnet 4.5

## Best Practices

1. **Review Before Use** - Always review generated exams
2. **Use Variations** - Generate multiple versions for large classes
3. **Specify Topics** - Be specific for better questions
4. **Balance Types** - Mix question types appropriately
5. **Strict Mode** - Use for production exams

## Integration with Phase 0

The exam generator uses all Phase 0 components:

```javascript
// 1. Load config
const config = loadTeachConfig(process.cwd());

// 2. Load templates
const template = loadTemplate('exam');

// 3. Generate with AI
const ai = new AIProvider(config.scholar?.ai_generation);
const result = await ai.generate(prompt);

// 4. Validate
const validator = new ValidatorEngine({ strict: true });
const validation = validator.validate(content, template);
```

## See Also

- [Quick Reference](QUICK-REFERENCE.md) - Command cheat sheet
- [Developer Guide](DEVELOPER-GUIDE.md) - Implementation details
- [Examples](COMMAND-EXAMPLES.md) - More examples
