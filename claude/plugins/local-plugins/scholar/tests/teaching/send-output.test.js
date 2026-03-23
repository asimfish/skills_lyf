/**
 * Unit Tests: Send Output Utility
 *
 * Tests recipient resolution, email formatting, and send instruction
 * building for the shared email sending utility used by teaching commands.
 */

import { describe, it, expect } from '@jest/globals';
import {
  resolveRecipient,
  formatEmail,
  buildSendInstructions
} from '../../src/teaching/utils/send-output.js';

// ─────────────────────────────────────────────────────────────
// resolveRecipient
// ─────────────────────────────────────────────────────────────

describe('resolveRecipient()', () => {
  it('should return explicit email string from options.send', () => {
    const options = { send: 'ta@university.edu' };
    const config = {};
    expect(resolveRecipient(options, config)).toBe('ta@university.edu');
  });

  it('should ignore "true" string and fall through to config', () => {
    const options = { send: 'true' };
    const config = {
      scholar: { course: { staff: { ta_email: 'config-ta@uni.edu' } } }
    };
    expect(resolveRecipient(options, config)).toBe('config-ta@uni.edu');
  });

  it('should return ta_email from config when send is boolean true', () => {
    const options = { send: true };
    const config = {
      scholar: { course: { staff: { ta_email: 'ta@school.edu' } } }
    };
    expect(resolveRecipient(options, config)).toBe('ta@school.edu');
  });

  it('should fall back to instructor_email when no ta_email', () => {
    const options = { send: true };
    const config = {
      scholar: { course_info: { instructor_email: 'prof@school.edu' } }
    };
    expect(resolveRecipient(options, config)).toBe('prof@school.edu');
  });

  it('should return null when no email found anywhere', () => {
    const options = { send: true };
    const config = { scholar: {} };
    expect(resolveRecipient(options, config)).toBeNull();
  });

  it('should return null with empty config', () => {
    const options = { send: true };
    expect(resolveRecipient(options, {})).toBeNull();
  });

  it('should return null with null config', () => {
    const options = { send: true };
    expect(resolveRecipient(options, null)).toBeNull();
  });

  it('should return null with undefined config', () => {
    const options = { send: true };
    expect(resolveRecipient(options, undefined)).toBeNull();
  });

  it('should ignore empty string in options.send', () => {
    const options = { send: '' };
    const config = {
      scholar: { course: { staff: { ta_email: 'ta@uni.edu' } } }
    };
    // Empty string is falsy but resolveRecipient checks length
    expect(resolveRecipient(options, config)).toBe('ta@uni.edu');
  });

  it('should prefer ta_email over instructor_email', () => {
    const options = { send: true };
    const config = {
      scholar: {
        course: { staff: { ta_email: 'ta@uni.edu' } },
        course_info: { instructor_email: 'prof@uni.edu' }
      }
    };
    expect(resolveRecipient(options, config)).toBe('ta@uni.edu');
  });

  it('should handle config without scholar wrapper', () => {
    const options = { send: true };
    const config = {
      course: { staff: { ta_email: 'ta@direct.edu' } }
    };
    // Config is accessed as config.scholar || config
    expect(resolveRecipient(options, config)).toBe('ta@direct.edu');
  });
});

// ─────────────────────────────────────────────────────────────
// formatEmail
// ─────────────────────────────────────────────────────────────

describe('formatEmail()', () => {
  it('should format solution email with course code', () => {
    const content = {
      assignment_title: 'HW1',
      solutions: { P1: { answer: 'x=5' }, P2: { answer: 'y=3' } }
    };
    const result = formatEmail('solution', content, {
      courseCode: 'STAT-440',
      topic: 'Linear Regression'
    });

    expect(result.subject).toBe('[STAT-440] Solution Key: Linear Regression');
    expect(result.body).toContain('Course: STAT-440');
    expect(result.body).toContain('Topic: Linear Regression');
    expect(result.body).toContain('Type: Solution Key');
    expect(result.body).toContain('Solutions for 2 problem(s) included.');
  });

  it('should format assignment email', () => {
    const content = {
      title: 'Homework 3',
      problems: [{ id: 'P1' }, { id: 'P2' }, { id: 'P3' }],
      total_points: 100
    };
    const result = formatEmail('assignment', content, {
      courseCode: 'STAT-440',
      topic: 'ANOVA'
    });

    expect(result.subject).toBe('[STAT-440] Assignment: ANOVA');
    expect(result.body).toContain('Assignment with 3 problem(s).');
    expect(result.body).toContain('Total points: 100');
  });

  it('should format exam email', () => {
    const content = {
      title: 'Midterm Exam',
      questions: [{ id: 'Q1' }, { id: 'Q2' }],
      duration_minutes: 90
    };
    const result = formatEmail('exam', content, {
      topic: 'Midterm Exam'
    });

    expect(result.subject).toBe('Exam: Midterm Exam');
    expect(result.body).toContain('Exam with 2 question(s).');
    expect(result.body).toContain('Duration: 90 minutes');
  });

  it('should format quiz email', () => {
    const content = {
      title: 'Quiz 5',
      questions: [{ id: 'Q1' }, { id: 'Q2' }, { id: 'Q3' }]
    };
    const result = formatEmail('quiz', content, { topic: 'Hypothesis Testing' });

    expect(result.subject).toBe('Quiz: Hypothesis Testing');
    expect(result.body).toContain('Quiz with 3 question(s).');
  });

  it('should format rubric email', () => {
    const content = {
      title: 'Data Analysis Rubric',
      criteria: [{ name: 'Code Quality' }, { name: 'Analysis' }],
      total_points: 50
    };
    const result = formatEmail('rubric', content, {
      courseCode: 'STAT-545',
      topic: 'Data Analysis Project'
    });

    expect(result.subject).toBe('[STAT-545] Grading Rubric: Data Analysis Project');
    expect(result.body).toContain('Rubric with 2 criterion(a).');
    expect(result.body).toContain('Total points: 50');
  });

  it('should include output path when provided', () => {
    const result = formatEmail('solution', {}, {
      outputPath: 'solutions/hw1-solution.qmd'
    });
    expect(result.body).toContain('File: solutions/hw1-solution.qmd');
  });

  it('should include course code in subject when available', () => {
    const result = formatEmail('exam', {}, { courseCode: 'MATH-201' });
    expect(result.subject.startsWith('[MATH-201]')).toBe(true);
  });

  it('should omit course code bracket when not available', () => {
    const result = formatEmail('exam', {}, { topic: 'Final' });
    expect(result.subject).toBe('Exam: Final');
    expect(result.subject).not.toContain('[');
  });

  it('should use "Generated Content" as fallback topic', () => {
    const result = formatEmail('quiz', {}, {});
    expect(result.subject).toContain('Generated Content');
  });

  it('should handle content with title property', () => {
    const result = formatEmail('assignment', { title: 'HW5' }, {});
    expect(result.subject).toContain('HW5');
  });

  it('should handle content with assignment_title property', () => {
    const result = formatEmail('solution', { assignment_title: 'Lab 3' }, {});
    expect(result.subject).toContain('Lab 3');
  });

  it('should include JSON serialized content in body', () => {
    const content = { title: 'Test', value: 42 };
    const result = formatEmail('quiz', content, {});
    expect(result.body).toContain('--- Content (JSON) ---');
    expect(result.body).toContain('"title": "Test"');
    expect(result.body).toContain('"value": 42');
  });

  it('should include generation date in body', () => {
    const result = formatEmail('exam', {}, {});
    const today = new Date().toISOString().split('T')[0];
    expect(result.body).toContain(`Generated: ${today}`);
  });

  it('should handle empty options gracefully', () => {
    const result = formatEmail('solution', {});
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('body');
    expect(typeof result.subject).toBe('string');
    expect(typeof result.body).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────
// buildSendInstructions
// ─────────────────────────────────────────────────────────────

describe('buildSendInstructions()', () => {
  it('should return a string with email details', () => {
    const result = buildSendInstructions({
      to: 'ta@university.edu',
      subject: '[STAT-440] Solution Key: ANOVA',
      body: 'Here is the solution...'
    });

    expect(typeof result).toBe('string');
    expect(result).toContain('To: ta@university.edu');
    expect(result).toContain('Subject: [STAT-440] Solution Key: ANOVA');
    expect(result).toContain('compose_email');
  });

  it('should include body preview', () => {
    const result = buildSendInstructions({
      to: 'test@test.com',
      subject: 'Test',
      body: 'Short body'
    });
    expect(result).toContain('Body preview: Short body');
  });

  it('should truncate long body in preview', () => {
    const longBody = 'x'.repeat(300);
    const result = buildSendInstructions({
      to: 'test@test.com',
      subject: 'Test',
      body: longBody
    });
    expect(result).toContain('...');
    // Preview should be truncated, not the full 300 chars
    expect(result).not.toContain('x'.repeat(300));
  });

  it('should include himalaya MCP tool reference', () => {
    const result = buildSendInstructions({
      to: 'ta@uni.edu',
      subject: 'Test',
      body: 'Test body'
    });
    expect(result).toContain('himalaya');
    expect(result).toContain('compose_email');
  });

  it('should instruct to ask user for confirmation', () => {
    const result = buildSendInstructions({
      to: 'ta@uni.edu',
      subject: 'Test',
      body: 'Test body'
    });
    expect(result).toContain('confirm');
  });

  it('should include email preview section header', () => {
    const result = buildSendInstructions({
      to: 'test@test.com',
      subject: 'Sub',
      body: 'Body'
    });
    expect(result).toContain('--- Email Preview ---');
  });
});

// ─────────────────────────────────────────────────────────────
// JSON serialization of email objects
// ─────────────────────────────────────────────────────────────

describe('Email object JSON serialization', () => {
  it('should produce JSON-serializable email from formatEmail', () => {
    const email = formatEmail('solution', { title: 'Test' }, { courseCode: 'STAT-100' });
    const serialized = JSON.stringify(email);
    const parsed = JSON.parse(serialized);

    expect(parsed).toHaveProperty('subject');
    expect(parsed).toHaveProperty('body');
    expect(parsed.subject).toBe(email.subject);
    expect(parsed.body).toBe(email.body);
  });

  it('should handle special characters in content', () => {
    const content = { title: 'Test "with" special <chars> & symbols' };
    const email = formatEmail('assignment', content, { topic: content.title });
    const serialized = JSON.stringify(email);
    const parsed = JSON.parse(serialized);
    expect(parsed.subject).toContain('special <chars>');
  });

  it('should handle unicode in content', () => {
    const content = { title: 'Regression: $\\beta_0 + \\beta_1 X$' };
    const email = formatEmail('exam', content, { topic: content.title });
    const serialized = JSON.stringify(email);
    const parsed = JSON.parse(serialized);
    expect(parsed.subject).toContain('\\beta');
  });
});
