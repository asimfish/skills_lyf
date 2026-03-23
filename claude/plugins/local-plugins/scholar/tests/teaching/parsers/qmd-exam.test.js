import { describe, it, expect } from '@jest/globals';
import {
  parseExamContent,
  parseQuestion,
  extractPointsFromTitle,
  extractOptions,
  extractAnswer,
  extractMatchingPairs,
  extractBlanks,
  extractSubParts,
  extractImages,
} from '../../../src/teaching/parsers/qmd-exam.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal QMD exam string with frontmatter and questions.
 */
function buildExam({ title, instructions, questions, frontmatter }) {
  const parts = [];

  if (frontmatter) {
    parts.push('---');
    parts.push(frontmatter);
    parts.push('---');
    parts.push('');
  }

  if (title) {
    parts.push(`# ${title}`);
    parts.push('');
  }

  if (instructions) {
    parts.push(instructions);
    parts.push('');
  }

  if (questions) {
    for (const q of questions) {
      parts.push(q);
      parts.push('');
    }
  }

  return parts.join('\n');
}

/**
 * Build a single ## question section string.
 */
function buildQuestion(title, body) {
  return `## ${title}\n\n${body}`;
}

// ---------------------------------------------------------------------------
// parseExamContent
// ---------------------------------------------------------------------------

describe('parseExamContent', () => {
  describe('basic exam parsing', () => {
    it('extracts title from H1 heading', () => {
      const content = buildExam({
        title: 'Statistics Midterm',
        questions: [buildQuestion('Question 1 [10 pts]', 'What is 2+2?')],
      });
      const result = parseExamContent(content);
      expect(result.title).toBe('Statistics Midterm');
    });

    it('extracts title from frontmatter when no H1', () => {
      const content = [
        '---',
        'title: "Calculus Final"',
        'format: pdf',
        '---',
        '',
        '## Question 1 [5 pts]',
        '',
        'Differentiate $f(x) = x^2$.',
      ].join('\n');
      const result = parseExamContent(content);
      expect(result.title).toBe('Calculus Final');
    });

    it('extracts instructions from preamble', () => {
      const content = buildExam({
        title: 'Quiz 1',
        instructions: 'Answer all questions. Show your work.',
        questions: [buildQuestion('Question 1 [5 pts]', 'What is 1+1?')],
      });
      const result = parseExamContent(content);
      expect(result.instructions).toBe('Answer all questions. Show your work.');
    });

    it('counts questions from ## sections', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Question 1 [5 pts]', 'Q1 body'),
          buildQuestion('Question 2 [5 pts]', 'Q2 body'),
          buildQuestion('Question 3 [5 pts]', 'Q3 body'),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions).toHaveLength(3);
    });

    it('calculates total_points', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [10 pts]', 'Body 1'),
          buildQuestion('Q2 [20 pts]', 'Body 2'),
          buildQuestion('Q3 [15 pts]', 'Body 3'),
        ],
      });
      const result = parseExamContent(content);
      expect(result.total_points).toBe(45);
    });

    it('assigns sequential question IDs', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [5 pts]', 'Body 1'),
          buildQuestion('Q2 [5 pts]', 'Body 2'),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].id).toBe('Q1');
      expect(result.questions[1].id).toBe('Q2');
    });
  });

  // -------------------------------------------------------------------------
  // Question parsing
  // -------------------------------------------------------------------------

  describe('question parsing', () => {
    it('parses multiple-choice question with options', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [10 pts]', [
            'What is the mean of 2, 4, 6?',
            '',
            'a) Three',
            'b) Four',
            'c) Five',
            'd) Six',
            '',
            '**Answer:** b',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('multiple-choice');
      expect(result.questions[0].options).toEqual(['Three', 'Four', 'Five', 'Six']);
      expect(result.answer_key.Q1).toBe('B');
    });

    it('parses true-false question', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [5 pts]', [
            'Variance can be negative.',
            '',
            'a) True',
            'b) False',
            '',
            '**Answer:** b) False',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('true-false');
      expect(result.answer_key.Q1).toBe('False');
    });

    it('parses essay question (no options)', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [15 pts]', 'Explain the concept of variance in your own words. Provide detailed examples from real-world datasets and discuss its importance in statistical analysis. How does variance relate to standard deviation, and when would you prefer one over the other in practice?'),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('essay');
      expect(result.answer_key.Q1).toBe(null);
    });

    it('parses numerical question', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [10 pts]', [
            'Calculate the sample mean of {3, 5, 7, 9}.',
            '',
            '**Answer:** 6',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('numerical');
      expect(result.answer_key.Q1).toBe('6');
    });

    it('parses short-answer question', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [5 pts]', [
            'What is the name for the middle value in a sorted dataset?',
            '',
            '**Answer:** median',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('short-answer');
      expect(result.answer_key.Q1).toBe('median');
    });

    it('parses matching question with :: pairs', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [10 pts]', [
            'Match the following terms with their definitions:',
            '',
            '- Mean :: Average value',
            '- Median :: Middle value',
            '- Mode :: Most frequent value',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('matching');
      expect(result.questions[0].pairs).toEqual([
        { left: 'Mean', right: 'Average value' },
        { left: 'Median', right: 'Middle value' },
        { left: 'Mode', right: 'Most frequent value' },
      ]);
      expect(result.answer_key.Q1).toBe(null);
    });

    it('parses fill-in-multiple-blanks', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [10 pts]', [
            'The [blank1] measures spread, while the [blank2] measures center.',
            '',
            '[blank1]: variance, standard deviation',
            '[blank2]: mean, average',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('fill-in-multiple-blanks');
      expect(result.answer_key.Q1).toEqual({ blank1: 'variance', blank2: 'mean' });
    });

    it('parses fill-in-blank', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [5 pts]', [
            'The [___] is the most commonly used measure of central tendency.',
            '',
            '**Answer:** mean',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].type).toBe('fill-in-blank');
    });
  });

  // -------------------------------------------------------------------------
  // Points extraction
  // -------------------------------------------------------------------------

  describe('points extraction', () => {
    it('extracts [10 pts] from title', () => {
      const { points, cleanTitle } = extractPointsFromTitle('Question 1 [10 pts]');
      expect(points).toBe(10);
      expect(cleanTitle).toBe('Question 1');
    });

    it('extracts [10pts] from title (no space)', () => {
      const { points, cleanTitle } = extractPointsFromTitle('Question 1 [10pts]');
      expect(points).toBe(10);
      expect(cleanTitle).toBe('Question 1');
    });

    it('extracts [10 points] from title', () => {
      const { points, cleanTitle } = extractPointsFromTitle('Question 1 [10 points]');
      expect(points).toBe(10);
      expect(cleanTitle).toBe('Question 1');
    });

    it('extracts (10 pts) from title', () => {
      const { points, cleanTitle } = extractPointsFromTitle('Question 1 (10 pts)');
      expect(points).toBe(10);
      expect(cleanTitle).toBe('Question 1');
    });

    it('extracts (10 points) from title', () => {
      const { points, cleanTitle } = extractPointsFromTitle('Question 1 (10 points)');
      expect(points).toBe(10);
      expect(cleanTitle).toBe('Question 1');
    });

    it('extracts trailing "N points"', () => {
      const { points, cleanTitle } = extractPointsFromTitle('Question 1 10 points');
      expect(points).toBe(10);
      expect(cleanTitle).toBe('Question 1');
    });

    it('uses default points when none specified', () => {
      const content = buildExam({
        title: 'Test',
        questions: [buildQuestion('Question 1', 'Some question')],
      });
      const result = parseExamContent(content, { defaultPoints: 5 });
      expect(result.questions[0].points).toBe(5);
    });

    it('returns null points when no pattern matches', () => {
      const { points } = extractPointsFromTitle('Question 1');
      expect(points).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Answer extraction
  // -------------------------------------------------------------------------

  describe('answer extraction', () => {
    it('extracts **Answer:** marker', () => {
      const body = 'Some text\n\n**Answer:** 42';
      const result = extractAnswer(body);
      expect(result.value).toBe('42');
    });

    it('extracts **Solution:** marker', () => {
      const body = 'Some text\n\n**Solution:** x = 5';
      const result = extractAnswer(body);
      expect(result.value).toBe('x = 5');
    });

    it('extracts > Answer: blockquote marker', () => {
      const body = 'Some text\n\n> Answer: 42';
      const result = extractAnswer(body);
      expect(result.value).toBe('42');
    });

    it('extracts [x] correct markers from options', () => {
      const body = 'a) Wrong\nb) Correct [x]\nc) Wrong';
      const result = extractOptions(body);
      expect(result.correctAnswers).toEqual([1]);
    });

    it('extracts **bold** correct markers', () => {
      const body = 'a) Wrong\nb) **Correct**\nc) Wrong';
      const result = extractOptions(body);
      expect(result.correctAnswers).toEqual([1]);
      expect(result.options[1]).toBe('Correct');
    });

    it('extracts checkmark correct markers', () => {
      const body = 'a) Wrong\nb) Correct ✓\nc) Wrong';
      const result = extractOptions(body);
      expect(result.correctAnswers).toEqual([1]);
    });

    it('handles missing answers gracefully', () => {
      const body = 'Just a question with no answer.';
      const result = extractAnswer(body);
      expect(result.value).toBeNull();
    });

    it('removes answer line from remaining text', () => {
      const body = 'Question text\n\n**Answer:** B\n\nMore text';
      const result = extractAnswer(body);
      expect(result.value).toBe('B');
      expect(result.remainingText).not.toContain('**Answer:**');
      expect(result.remainingText).toContain('Question text');
    });
  });

  // -------------------------------------------------------------------------
  // Matching pairs
  // -------------------------------------------------------------------------

  describe('matching pairs', () => {
    it('extracts :: separator pairs', () => {
      const body = '- Mean :: Average value\n- Median :: Middle value';
      const result = extractMatchingPairs(body);
      expect(result.pairs).toEqual([
        { left: 'Mean', right: 'Average value' },
        { left: 'Median', right: 'Middle value' },
      ]);
    });

    it('extracts => separator pairs', () => {
      const body = '- Term A => Definition A\n- Term B => Definition B';
      const result = extractMatchingPairs(body);
      expect(result.pairs).toEqual([
        { left: 'Term A', right: 'Definition A' },
        { left: 'Term B', right: 'Definition B' },
      ]);
    });

    it('extracts = separator pairs with leading dash (examark format)', () => {
      const body = '- Mean = Average\n- Median = Middle';
      const result = extractMatchingPairs(body);
      expect(result.pairs).toEqual([
        { left: 'Mean', right: 'Average' },
        { left: 'Median', right: 'Middle' },
      ]);
    });

    it('ignores bare = in equations (no leading dash)', () => {
      const body = 'n = 100\nβ = 1.23';
      const result = extractMatchingPairs(body);
      expect(result).toBeNull();
    });

    it('returns null when no pairs found', () => {
      const body = 'Just regular text.';
      const result = extractMatchingPairs(body);
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Blanks
  // -------------------------------------------------------------------------

  describe('blanks extraction', () => {
    it('extracts single blank definition', () => {
      const body = '[blank1]: variance, standard deviation';
      const result = extractBlanks(body);
      expect(result).toEqual({ blank1: 'variance' });
    });

    it('extracts multiple blank definitions', () => {
      const body = '[blank1]: variance\n[blank2]: mean';
      const result = extractBlanks(body);
      expect(result).toEqual({ blank1: 'variance', blank2: 'mean' });
    });

    it('returns null when no blanks found', () => {
      const body = 'Regular text without blanks.';
      const result = extractBlanks(body);
      expect(result).toBeNull();
    });

    it('takes first answer as primary from comma-separated list', () => {
      const body = '[blank1]: variance, standard deviation, spread';
      const result = extractBlanks(body);
      expect(result).toEqual({ blank1: 'variance' });
    });
  });

  // -------------------------------------------------------------------------
  // Sub-parts
  // -------------------------------------------------------------------------

  describe('sub-parts', () => {
    it('splits **(a)** **(b)** into separate questions when splitParts=true', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [20 pts]', [
            '**(a)** [8 pts] Calculate the sample mean of {3, 5, 7, 9}.',
            '',
            '**(b)** [12 pts] Compute the standard deviation.',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content, { splitParts: true });
      // Multi-part splits into 2 questions
      expect(result.questions.length).toBe(2);
      expect(result.questions[0].points).toBe(8);
      expect(result.questions[1].points).toBe(12);
    });

    it('keeps combined when splitParts=false', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [20 pts]', [
            '**(a)** [8 pts] Calculate the sample mean.',
            '',
            '**(b)** [12 pts] Compute the standard deviation.',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content, { splitParts: false });
      expect(result.questions.length).toBe(1);
    });

    it('extracts points from sub-parts', () => {
      const body = '**(a)** [8 pts] Part A text.\n\n**(b)** [12 pts] Part B text.';
      const parts = extractSubParts(body, true);
      expect(parts).toHaveLength(2);
      expect(parts[0].points).toBe(8);
      expect(parts[0].text).toContain('Part A text');
      expect(parts[1].points).toBe(12);
      expect(parts[1].text).toContain('Part B text');
    });

    it('returns null when fewer than 2 parts found', () => {
      const body = 'Just a regular question with no sub-parts.';
      const parts = extractSubParts(body, true);
      expect(parts).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // LaTeX preservation
  // -------------------------------------------------------------------------

  describe('LaTeX preservation', () => {
    it('preserves inline $...$ math', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [10 pts]', 'Calculate $\\bar{x} = \\frac{1}{n}\\sum x_i$ for the dataset.'),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].text).toContain('$\\bar{x} = \\frac{1}{n}\\sum x_i$');
    });

    it('preserves display $$...$$ math', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [10 pts]', 'Evaluate:\n\n$$\\int_0^1 x^2 \\, dx$$'),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].text).toContain('$$\\int_0^1 x^2 \\, dx$$');
    });

    it('preserves LaTeX in options', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [5 pts]', [
            'Which is the derivative of $x^2$?',
            '',
            'a) $2x$',
            'b) $x$',
            'c) $2$',
            'd) $x^2$',
          ].join('\n')),
        ],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].options[0]).toBe('$2x$');
      expect(result.questions[0].options[1]).toBe('$x$');
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles empty question body', () => {
      const content = buildExam({
        title: 'Test',
        questions: [buildQuestion('Q1 [5 pts]', '')],
      });
      const result = parseExamContent(content);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].text).toBe('');
    });

    it('handles question with no points', () => {
      const content = buildExam({
        title: 'Test',
        questions: [buildQuestion('Question 1', 'What is 2+2?')],
      });
      const result = parseExamContent(content);
      expect(result.questions[0].points).toBe(1); // default
    });

    it('handles exam with only title', () => {
      const content = '# Empty Exam\n';
      const result = parseExamContent(content);
      expect(result.title).toBe('Empty Exam');
      expect(result.questions).toHaveLength(0);
      expect(result.total_points).toBe(0);
    });

    it('handles frontmatter without title', () => {
      const content = [
        '---',
        'format: pdf',
        '---',
        '',
        '## Q1 [5 pts]',
        '',
        'What is 1+1?',
      ].join('\n');
      const result = parseExamContent(content);
      expect(result.title).toBe('');
    });

    it('builds correct answer_key for all question IDs', () => {
      const content = buildExam({
        title: 'Test',
        questions: [
          buildQuestion('Q1 [5 pts]', 'a) True\nb) False\n\n**Answer:** a) True'),
          buildQuestion('Q2 [10 pts]', 'Explain something in great detail. Use examples and discuss implications for the broader field.'),
        ],
      });
      const result = parseExamContent(content);
      expect(result.answer_key).toHaveProperty('Q1');
      expect(result.answer_key).toHaveProperty('Q2');
      expect(result.answer_key.Q2).toBeNull(); // essay
    });
  });

  // -------------------------------------------------------------------------
  // Full exam integration
  // -------------------------------------------------------------------------

  describe('full exam integration', () => {
    it('parses a complete mixed-type exam', () => {
      const content = [
        '---',
        'title: "Statistics Midterm"',
        'format: pdf',
        '---',
        '',
        '# Statistics Midterm Exam',
        '',
        'Answer all questions. Show your work.',
        '',
        '## Question 1 [10 pts]',
        '',
        'What is the mean of 2, 4, 6?',
        '',
        'a) Three',
        'b) Four',
        'c) Five',
        'd) Six',
        '',
        '**Answer:** b',
        '',
        '## Question 2 [5 pts]',
        '',
        'Variance can be negative.',
        '',
        'a) True',
        'b) False',
        '',
        '**Answer:** b) False',
        '',
        '## Question 3 [15 pts]',
        '',
        'Explain the concept of variance in your own words. Discuss its role in statistical inference and how it relates to the standard deviation. Provide examples from at least two different fields, and explain why variance is preferred over range in many statistical applications.',
        '',
        '## Question 4 [10 pts]',
        '',
        'Match the following terms with their definitions:',
        '',
        '- Mean :: Average value',
        '- Median :: Middle value',
        '- Mode :: Most frequent value',
        '',
        '## Question 5 [10 pts]',
        '',
        'The [blank1] measures spread, while the [blank2] measures center.',
        '',
        '[blank1]: variance, standard deviation',
        '[blank2]: mean, average',
      ].join('\n');

      const result = parseExamContent(content);

      expect(result.title).toBe('Statistics Midterm Exam');
      expect(result.instructions).toBe('Answer all questions. Show your work.');
      expect(result.questions).toHaveLength(5);
      expect(result.total_points).toBe(50);

      // Q1: MC
      expect(result.questions[0].type).toBe('multiple-choice');
      expect(result.answer_key.Q1).toBe('B');

      // Q2: TF
      expect(result.questions[1].type).toBe('true-false');
      expect(result.answer_key.Q2).toBe('False');

      // Q3: Essay
      expect(result.questions[2].type).toBe('essay');
      expect(result.answer_key.Q3).toBeNull();

      // Q4: Matching
      expect(result.questions[3].type).toBe('matching');
      expect(result.questions[3].pairs).toHaveLength(3);

      // Q5: FMB
      expect(result.questions[4].type).toBe('fill-in-multiple-blanks');
      expect(result.answer_key.Q5).toEqual({ blank1: 'variance', blank2: 'mean' });
    });
  });
});

// ---------------------------------------------------------------------------
// extractOptions (standalone)
// ---------------------------------------------------------------------------

describe('extractOptions', () => {
  it('parses a) style options', () => {
    const body = 'a) First\nb) Second\nc) Third';
    const result = extractOptions(body);
    expect(result.options).toEqual(['First', 'Second', 'Third']);
  });

  it('parses (a) style options', () => {
    const body = '(a) First\n(b) Second\n(c) Third';
    const result = extractOptions(body);
    expect(result.options).toEqual(['First', 'Second', 'Third']);
  });

  it('separates question text from options', () => {
    const body = 'What is the answer?\n\na) Yes\nb) No';
    const result = extractOptions(body);
    expect(result.remainingText).toBe('What is the answer?');
    expect(result.options).toEqual(['Yes', 'No']);
  });

  it('detects multiple correct answers', () => {
    const body = 'a) Wrong\nb) **Right**\nc) Wrong\nd) **Also right**';
    const result = extractOptions(body);
    expect(result.correctAnswers).toEqual([1, 3]);
  });

  it('returns empty arrays when no options found', () => {
    const body = 'Just plain text.';
    const result = extractOptions(body);
    expect(result.options).toEqual([]);
    expect(result.correctAnswers).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractMatchingPairs (standalone)
// ---------------------------------------------------------------------------

describe('extractMatchingPairs', () => {
  it('handles mixed separator styles', () => {
    const body = '- A :: 1\n- B => 2';
    const result = extractMatchingPairs(body);
    expect(result.pairs).toEqual([
      { left: 'A', right: '1' },
      { left: 'B', right: '2' },
    ]);
  });

  it('preserves remaining text', () => {
    const body = 'Match these:\n\n- A :: 1\n- B :: 2\n\nDo your best.';
    const result = extractMatchingPairs(body);
    expect(result.remainingText).toContain('Match these:');
    expect(result.remainingText).toContain('Do your best.');
  });
});

// ---------------------------------------------------------------------------
// extractSubParts (standalone)
// ---------------------------------------------------------------------------

describe('extractSubParts', () => {
  it('parses bold-style sub-parts', () => {
    const body = '**(a)** First part.\n\n**(b)** Second part.';
    const parts = extractSubParts(body, true);
    expect(parts).toHaveLength(2);
    expect(parts[0].label).toBe('a');
    expect(parts[1].label).toBe('b');
  });

  it('includes continuation lines in sub-part text', () => {
    const body = '**(a)** [5 pts] First line.\nSecond line of part a.\n\n**(b)** [5 pts] Part b.';
    const parts = extractSubParts(body, true);
    expect(parts[0].text).toContain('First line.');
    expect(parts[0].text).toContain('Second line of part a.');
  });

  it('returns null for single sub-part', () => {
    const body = '**(a)** Only one part.';
    const parts = extractSubParts(body, true);
    expect(parts).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Point redistribution for implicit sub-parts (E5)
// ---------------------------------------------------------------------------

describe('sub-part point redistribution', () => {
  it('divides parent points equally when sub-parts lack explicit points', () => {
    const content = buildExam({
      title: 'Test',
      questions: [
        buildQuestion('Q1 [30 pts]', [
          '**(a)** Calculate the mean.',
          '',
          '**(b)** Calculate the median.',
          '',
          '**(c)** Calculate the mode.',
        ].join('\n')),
      ],
    });
    const result = parseExamContent(content, { splitParts: true });
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].points).toBe(10);
    expect(result.questions[1].points).toBe(10);
    expect(result.questions[2].points).toBe(10);
    expect(result.total_points).toBe(30);
  });

  it('does not inflate sub-part points to parent total', () => {
    const content = buildExam({
      title: 'Test',
      questions: [
        buildQuestion('Q1 [20 pts]', [
          '**(a)** First part.',
          '',
          '**(b)** Second part.',
        ].join('\n')),
      ],
    });
    const result = parseExamContent(content, { splitParts: true });
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].points).toBe(10);
    expect(result.questions[1].points).toBe(10);
    expect(result.total_points).toBe(20);
  });

  it('preserves explicit sub-part points when provided', () => {
    const content = buildExam({
      title: 'Test',
      questions: [
        buildQuestion('Q1 [30 pts]', [
          '**(a)** [10 pts] Part A.',
          '',
          '**(b)** [20 pts] Part B.',
        ].join('\n')),
      ],
    });
    const result = parseExamContent(content, { splitParts: true });
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].points).toBe(10);
    expect(result.questions[1].points).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Section name propagation (E4)
// ---------------------------------------------------------------------------

describe('section name propagation', () => {
  it('propagates parent section name to questions under H1 headings', () => {
    // Structure: # Exam Title > ## Section A > ### Q1, ### Q2
    // But our parser uses ## for questions, so the QMD structure is:
    // # Exam Title
    //   ## Section A (level-2 under H1)
    // This doesn't quite work because the parser treats ## as questions.
    // The real pattern for sections is when there are intermediate H1 sections:
    //
    // # Part 1: Basics
    // ## Q1 [10 pts]
    // ...
    // # Part 2: Analysis
    // ## Q2 [10 pts]
    //
    // This gives us H1 sections with H2 subsections.
    const content = [
      '# Part 1: Basics',
      '',
      '## Question 1 [10 pts]',
      '',
      'What is 2+2?',
      '',
      '## Question 2 [5 pts]',
      '',
      'Is 1+1=2?',
      '',
      '# Part 2: Analysis',
      '',
      '## Question 3 [15 pts]',
      '',
      'Explain variance in detail. Discuss its role in hypothesis testing.',
    ].join('\n');

    const result = parseExamContent(content);
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].sectionName).toBe('Part 1: Basics');
    expect(result.questions[1].sectionName).toBe('Part 1: Basics');
    expect(result.questions[2].sectionName).toBe('Part 2: Analysis');
  });

  it('does not set sectionName for flat ## questions without H1 parent', () => {
    const content = buildExam({
      title: 'Test',
      questions: [
        buildQuestion('Q1 [5 pts]', 'Body 1'),
        buildQuestion('Q2 [5 pts]', 'Body 2'),
      ],
    });
    const result = parseExamContent(content);
    expect(result.questions[0].sectionName).toBeUndefined();
    expect(result.questions[1].sectionName).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Image extraction (E7)
// ---------------------------------------------------------------------------

describe('extractImages', () => {
  it('extracts single image reference', () => {
    const body = 'Look at this chart:\n\n![scatter plot](images/scatter.png)\n\nWhat pattern do you see?';
    const images = extractImages(body);
    expect(images).toHaveLength(1);
    expect(images[0].alt).toBe('scatter plot');
    expect(images[0].path).toBe('images/scatter.png');
  });

  it('extracts multiple image references', () => {
    const body = '![fig1](a.png)\n\nCompare with:\n\n![fig2](b.png)';
    const images = extractImages(body);
    expect(images).toHaveLength(2);
    expect(images[0].path).toBe('a.png');
    expect(images[1].path).toBe('b.png');
  });

  it('returns empty array when no images', () => {
    const body = 'Just text with no images.';
    const images = extractImages(body);
    expect(images).toHaveLength(0);
  });

  it('handles images with empty alt text', () => {
    const body = '![](diagram.png)';
    const images = extractImages(body);
    expect(images).toHaveLength(1);
    expect(images[0].alt).toBe('');
    expect(images[0].path).toBe('diagram.png');
  });
});

describe('image extraction in parsed questions', () => {
  it('populates images array on question objects', () => {
    const content = buildExam({
      title: 'Test',
      questions: [
        buildQuestion('Q1 [10 pts]', 'Look at this:\n\n![chart](images/chart.png)\n\nDescribe the trend.'),
      ],
    });
    const result = parseExamContent(content);
    expect(result.questions[0].images).toEqual([
      { alt: 'chart', path: 'images/chart.png' },
    ]);
  });

  it('does not set images when no images present', () => {
    const content = buildExam({
      title: 'Test',
      questions: [
        buildQuestion('Q1 [5 pts]', 'What is 2+2?'),
      ],
    });
    const result = parseExamContent(content);
    expect(result.questions[0].images).toBeUndefined();
  });
});
