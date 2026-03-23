/**
 * Edge Case Tests
 *
 * Tests boundary conditions, special characters, and error handling
 * for the conversational exam generator and LaTeX export system.
 */

import { validateExam } from './src/teaching/generators/exam-conversational.js';
import { LatexExporter } from './src/teaching/formatters/latex-export.js';

console.log('🧪 Edge Case Tests\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

// Edge Case 1: Special characters in question text
test('Special characters in question text', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'short-answer',
        text: 'Explain the difference between < and > operators. Use $, %, &, _, {, } in your answer.',
        points: 10,
        difficulty: 'medium'
      }
    ],
    answer_key: {
      Q1: 'Sample answer with special chars: $ % & _ { }'
    }
  };

  const validated = validateExam(exam, { strict: false });
  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Verify special characters are escaped
  if (!latex.includes('\\$')) throw new Error('Dollar sign not escaped');
  if (!latex.includes('\\%')) throw new Error('Percent not escaped');
  if (!latex.includes('\\&')) throw new Error('Ampersand not escaped');
  if (!latex.includes('\\_')) throw new Error('Underscore not escaped');
  if (!latex.includes('\\{')) throw new Error('Left brace not escaped');
  if (!latex.includes('\\}')) throw new Error('Right brace not escaped');
});

// Edge Case 2: Very long question text
test('Very long question text', () => {
  const longText = 'This is a very long question that goes on and on. '.repeat(20);

  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'essay',
        text: longText,
        points: 20,
        difficulty: 'hard'
      }
    ],
    answer_key: {
      Q1: 'Sample answer'
    }
  };

  const validated = validateExam(exam, { strict: false });
  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Should contain the long text
  if (!latex.includes('This is a very long question')) throw new Error('Long text not included');
  // Should compile to valid LaTeX
  if (!latex.includes('\\end{document}')) throw new Error('Invalid LaTeX structure');
});

// Edge Case 3: Empty answer key
test('Empty answer key', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'short-answer',
        text: 'Question without answer',
        points: 10,
        difficulty: 'medium'
      }
    ],
    answer_key: {}
  };

  const validated = validateExam(exam, { strict: false });
  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Should still generate valid LaTeX
  if (!latex.includes('\\end{document}')) throw new Error('Invalid LaTeX structure');
});

// Edge Case 4: Unicode characters
test('Unicode characters', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'short-answer',
        text: 'Explain: α, β, γ, δ, θ, π, Σ, √, ∞, ≈, ≠',
        points: 10,
        difficulty: 'medium'
      }
    ],
    answer_key: {
      Q1: 'Greek letters and symbols'
    }
  };

  const validated = validateExam(exam, { strict: false });
  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Should generate valid LaTeX (may not preserve exact unicode, but should not break)
  if (!latex.includes('\\end{document}')) throw new Error('Invalid LaTeX structure');
});

// Edge Case 5: Nested LaTeX math mode
test('Nested LaTeX math mode', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'short-answer',
        text: 'Solve: $\\frac{a + b}{c}$ where $a = 1$, $b = 2$, $c = 3$',
        points: 10,
        difficulty: 'medium'
      }
    ],
    answer_key: {
      Q1: 'Answer: $\\frac{1 + 2}{3} = 1$'
    }
  };

  const validated = validateExam(exam, { strict: false });
  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // All math modes should be preserved
  const mathCount = (latex.match(/\$/g) || []).length;
  if (mathCount < 6) throw new Error(`Expected at least 6 $ symbols, found ${mathCount}`);
});

// Edge Case 6: Question with no options (malformed MC)
test('Malformed multiple-choice (no options)', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'multiple-choice',
        text: 'What is 2+2?',
        options: [],
        points: 5,
        difficulty: 'easy'
      }
    ],
    answer_key: {
      Q1: 'A'
    }
  };

  const validated = validateExam(exam, { strict: false });

  // Should have warnings about empty options
  if (validated.validation.warnings.length === 0) {
    throw new Error('Should warn about empty options');
  }
});

// Edge Case 7: Exam with no formula sheet
test('Exam with no formula sheet', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'short-answer',
        text: 'Simple question',
        points: 10,
        difficulty: 'easy'
      }
    ],
    answer_key: {
      Q1: 'Simple answer'
    }
  };

  const validated = validateExam(exam, { strict: false });
  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();

  // Should not have formula sheet section
  if (latex.includes('Formula Sheet')) throw new Error('Should not have formula sheet');
  // But should still be valid
  if (!latex.includes('\\end{document}')) throw new Error('Invalid LaTeX structure');
});

// Edge Case 8: Mixed question types with all edge cases
test('Mixed question types with edge cases', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'exam',
    duration_minutes: 60,
    questions: [
      {
        id: 'Q1',
        type: 'multiple-choice',
        text: 'What is $e^{i\\pi}$?',
        options: ['-1', '1', '0', '$\\pi$'],
        points: 5,
        difficulty: 'medium'
      },
      {
        id: 'Q2',
        type: 'true-false',
        text: 'Special chars: $, %, &, _',
        options: ['True', 'False'],
        points: 3,
        difficulty: 'easy'
      },
      {
        id: 'Q3',
        type: 'numerical',
        text: 'Calculate: 50% of 200',
        points: 5,
        difficulty: 'easy'
      },
      {
        id: 'Q4',
        type: 'short-answer',
        text: 'Explain θ ≈ sin(θ) for small θ',
        points: 10,
        difficulty: 'medium'
      }
    ],
    answer_key: {
      Q1: 'A',
      Q2: 'A',
      Q3: { answer: '100', solution: '$0.5 \\times 200 = 100$' },
      Q4: 'For small angles (θ ≈ 0), sin(θ) ≈ θ'
    }
  };

  const validated = validateExam(exam, { strict: false });
  const exporter = new LatexExporter(validated.content);
  const latex = exporter.exportStudentVersion();
  const answerKey = exporter.exportAnswerKey();
  const rubric = exporter.exportRubric();

  // All should be valid LaTeX
  if (!latex.includes('\\end{document}')) throw new Error('Student version invalid');
  if (!answerKey.includes('\\end{document}')) throw new Error('Answer key invalid');
  if (!rubric.includes('\\end{document}')) throw new Error('Rubric invalid');

  // All questions should be present (check by partial text to avoid escaping issues)
  const questionChecks = [
    { text: 'What is', desc: 'Q1 (e^iπ)' },
    { text: 'Special chars', desc: 'Q2 (special chars)' },
    { text: 'Calculate:', desc: 'Q3 (numerical)' },  // Percent sign gets escaped
    { text: 'Explain', desc: 'Q4 (theta approximation)' }
  ];
  questionChecks.forEach(({ text, desc }) => {
    if (!latex.includes(text)) {
      throw new Error(`Missing ${desc} in latex`);
    }
  });
});

// Edge Case 9: Validation strict mode
test('Validation strict mode', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'multiple-choice',
        text: 'Question with insufficient options',
        options: ['A'], // Only 1 option (should warn)
        points: 5,
        difficulty: 'easy'
      }
    ],
    answer_key: {
      Q1: 'A'
    }
  };

  const validated = validateExam(exam, { strict: true });

  // In strict mode, warnings become errors
  if (validated.validation.isValid) {
    throw new Error('Should fail in strict mode with warnings');
  }
});

// Edge Case 10: Custom LaTeX export options
test('Custom LaTeX export options', () => {
  const exam = {
    schema_version: '1.0',
    template_type: 'exam',
    metadata: { title: 'Test', date: '2025-01-12' },
    title: 'Test Exam',
    exam_type: 'quiz',
    duration_minutes: 30,
    questions: [
      {
        id: 'Q1',
        type: 'short-answer',
        text: 'Simple question',
        points: 10,
        difficulty: 'easy'
      }
    ],
    answer_key: {
      Q1: 'Simple answer'
    }
  };

  const validated = validateExam(exam, { strict: false });

  // Test different format styles
  const exporterExam = new LatexExporter(validated.content, {
    formatStyle: 'exam-class',
    fontSize: '11pt',
    pageSize: 'letter'
  });

  const exporterArticle = new LatexExporter(validated.content, {
    formatStyle: 'article',
    fontSize: '12pt',
    pageSize: 'a4paper'
  });

  const latexExam = exporterExam.exportStudentVersion();
  const latexArticle = exporterArticle.exportStudentVersion();

  // Verify custom options applied
  if (!latexExam.includes('\\documentclass[11pt,letterpaper]{exam}')) {
    throw new Error('Exam format options not applied');
  }
  if (!latexArticle.includes('\\documentclass[12pt,a4paper]{article}')) {
    throw new Error('Article format options not applied');
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  console.log('\n❌ Edge case tests FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All edge case tests PASSED!');
  console.log('\n🛡️  Verified edge cases:');
  console.log('   • Special characters escaped properly');
  console.log('   • Very long text handled');
  console.log('   • Empty/missing fields graceful');
  console.log('   • Unicode characters processed');
  console.log('   • Nested math mode preserved');
  console.log('   • Malformed input detected');
  console.log('   • Strict validation mode works');
  console.log('   • Custom export options respected');
}
