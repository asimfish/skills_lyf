# Exam Generator Examples

This directory contains practical examples demonstrating different use cases for the exam generator.

## 📁 Examples

| Example | Description | Difficulty | Questions | Duration |
|---------|-------------|------------|-----------|----------|
| [01-basic-midterm.js](01-basic-midterm.js) | Simple midterm with defaults | Medium | 10 | 60 min |
| [02-comprehensive-final.js](02-comprehensive-final.js) | Advanced final with custom settings | Hard | 20 | 180 min |
| [03-quick-quiz.js](03-quick-quiz.js) | Short MC-only quiz | Easy | 5 | 15 min |
| [04-practice-with-topics.js](04-practice-with-topics.js) | Topic-focused practice exam | Medium | 8 | 45 min |
| [05-multiple-variations.js](05-multiple-variations.js) | Generate 4 exam variations | Medium | 10 | 60 min |

## 🚀 Running Examples

### Prerequisites

```bash
# Set API key (required)
export ANTHROPIC_API_KEY='your-api-key'

# Or add to .flow/teach-config.yml
```

### Run Individual Examples

```bash
# Basic midterm
node examples/exams/01-basic-midterm.js

# Comprehensive final
node examples/exams/02-comprehensive-final.js

# Quick quiz
node examples/exams/03-quick-quiz.js

# Practice exam
node examples/exams/04-practice-with-topics.js

# Multiple variations
node examples/exams/05-multiple-variations.js
```

### Run All Examples

```bash
# Run each example sequentially
for example in examples/exams/0*.js; do
  echo "Running $example..."
  node "$example"
  echo
done
```

## 📊 What Each Example Demonstrates

### 1. Basic Midterm (`01-basic-midterm.js`)

**Use Case:** Getting started with exam generation

**Features:**
- Minimal configuration
- Default question distribution (60% MC, 30% short, 10% essay)
- Standard validation
- File saving

**Key Code:**
```javascript
const exam = await generateExam({
  type: 'midterm',
  questionCount: 10,
  difficulty: 'medium'
});
```

### 2. Comprehensive Final (`02-comprehensive-final.js`)

**Use Case:** End-of-semester comprehensive exam

**Features:**
- Custom question type distribution
- Specific topic selection
- Extended duration (3 hours)
- Hard difficulty
- Formula sheet included
- Detailed statistics output

**Key Code:**
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
  }
});
```

### 3. Quick Quiz (`03-quick-quiz.js`)

**Use Case:** In-class assessment or weekly check

**Features:**
- 100% multiple-choice questions
- Short duration (15 minutes)
- Easy difficulty
- No formula sheet
- Displays full quiz with answer key

**Key Code:**
```javascript
const exam = await generateExam({
  type: 'quiz',
  questionCount: 5,
  difficulty: 'easy',
  durationMinutes: 15,
  questionTypes: {
    'multiple-choice': 1.0  // 100%
  }
});
```

### 4. Practice Exam with Topics (`04-practice-with-topics.js`)

**Use Case:** Focused review for specific topics

**Features:**
- Specific topic targeting
- Balanced question types (50/50 MC and short-answer)
- Study recommendations
- Topic grouping display

**Key Code:**
```javascript
const exam = await generateExam({
  type: 'practice',
  questionCount: 8,
  topics: [
    'simple linear regression',
    'residual analysis',
    'confidence intervals'
  ]
});
```

### 5. Multiple Variations (`05-multiple-variations.js`)

**Use Case:** Large classes needing different exam versions

**Features:**
- Generates 4 variations (A, B, C, D)
- Consistency verification
- Point distribution comparison
- Distribution instructions

**Key Code:**
```javascript
const variations = await generateExamVariations(
  {
    type: 'midterm',
    questionCount: 10,
    difficulty: 'medium'
  },
  4  // Number of variations
);
```

## 📤 Output

All examples save generated exams to `examples/exams/output/` with timestamped filenames:

```
examples/exams/output/
├── basic-midterm-1736652000000.json
├── comprehensive-final-1736652100000.json
├── quick-quiz-1736652200000.json
├── practice-exam-1736652300000.json
├── midterm-version-A-1736652400000.json
├── midterm-version-B-1736652400000.json
├── midterm-version-C-1736652400000.json
└── midterm-version-D-1736652400000.json
```

## 🔧 Customization

Each example can be customized by modifying the options:

```javascript
const exam = await generateExam({
  type: 'midterm' | 'final' | 'practice' | 'quiz',
  questionCount: 5-50,
  difficulty: 'easy' | 'medium' | 'hard',
  durationMinutes: 15-300,
  topics: ['topic1', 'topic2', ...],
  questionTypes: {
    'multiple-choice': 0.0-1.0,
    'short-answer': 0.0-1.0,
    'essay': 0.0-1.0,
    'true-false': 0.0-1.0,
    'numerical': 0.0-1.0
  },
  includeFormulas: true | false,
  includeSolutions: true | false,
  strict: true | false,
  debug: true | false
});
```

## 💡 Tips

**For First-Time Users:**
1. Start with Example 1 (basic midterm)
2. Check the output JSON file structure
3. Review validation warnings if any
4. Experiment with different question counts

**For Advanced Users:**
1. Use Example 2 for comprehensive exams
2. Customize question type distribution
3. Specify detailed topics
4. Use strict validation for production

**For Large Classes:**
1. Use Example 5 to generate variations
2. Verify point consistency across versions
3. Print equal numbers of each version
4. Track which version each student receives

## 🐛 Troubleshooting

**Error: "AI generation failed"**
```bash
# Check API key is set
echo $ANTHROPIC_API_KEY

# Set if missing
export ANTHROPIC_API_KEY='your-key'
```

**Error: "Validation failed"**
```javascript
// Enable debug mode to see details
const exam = await generateExam({
  debug: true,
  strict: false
});
```

**Error: "Cannot find module"**
```bash
# Run from repository root
cd /path/to/scholar
node examples/exams/01-basic-midterm.js
```

## 📚 Further Reading

- [Exam Generator Documentation](../../docs/EXAM-GENERATOR.md)
- [Quick Reference](../../docs/QUICK-REFERENCE.md)
- [API Reference](../../docs/api-wrappers.md)
- [Phase 0 Foundation](../../docs/architecture/PHASE-0-FOUNDATION.md)

## 🤝 Contributing Examples

To add a new example:

1. Create `examples/exams/0X-your-example.js`
2. Follow the existing pattern:
   - Clear comment header explaining use case
   - Detailed console output
   - Error handling
   - File saving to `output/`
3. Update this README with your example
4. Test with `node examples/exams/0X-your-example.js`

## 📝 License

Part of the Scholar teaching toolkit - MIT License
