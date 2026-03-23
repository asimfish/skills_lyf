/**
 * Unit tests for LaTeX Validator
 */

import {
  validateLatex,
  extractMath,
  hasLatex,
  stripMathBlankLines,
} from '../../src/teaching/validators/latex.js';

describe('LaTeX Validator', () => {
  describe('validateLatex', () => {
    it('should return empty array for no errors', () => {
      const text = 'Normal text without math';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should return empty array for null/undefined', () => {
      expect(validateLatex(null)).toHaveLength(0);
      expect(validateLatex(undefined)).toHaveLength(0);
      expect(validateLatex('')).toHaveLength(0);
    });

    it('should validate correct inline math', () => {
      const text = 'Formula: $x^2 + y^2 = z^2$';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should validate correct display math', () => {
      const text = 'Formula: $$x^2 + y^2 = z^2$$';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should validate bracket display math', () => {
      const text = 'Formula: \\[x^2 + y^2 = z^2\\]';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });
  });

  describe('inline math validation', () => {
    it('should detect unbalanced single dollar', () => {
      const text = 'Formula: $x^2 + y^2';
      const errors = validateLatex(text);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unbalanced inline math');
    });

    it('should ignore escaped dollars', () => {
      const text = 'Price: \\$10 and \\$20';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should handle multiple inline math blocks', () => {
      const text = 'First: $x^2$ and second: $y^2$';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should detect odd number of dollars', () => {
      const text = 'One $x$ two $y$ three $z';
      const errors = validateLatex(text);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('display math validation', () => {
    it('should detect unbalanced double dollars', () => {
      const text = 'Formula: $$x^2 + y^2';
      const errors = validateLatex(text);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unbalanced display math');
    });

    it('should detect unbalanced brackets', () => {
      const text = 'Formula: \\[x^2 + y^2';
      const errors = validateLatex(text);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unbalanced display math');
    });

    it('should handle mixed math modes', () => {
      const text = 'Inline $x$ and display $$y$$';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });
  });

  describe('brace validation', () => {
    it('should detect unmatched opening brace', () => {
      const text = 'Formula: $x^{2$';
      const errors = validateLatex(text);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes('brace'))).toBe(true);
    });

    it('should detect unmatched closing brace', () => {
      const text = 'Formula: $x^2}$';
      const errors = validateLatex(text);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes('brace'))).toBe(true);
    });

    it('should handle nested braces correctly', () => {
      const text = 'Formula: $\\frac{x^{2}}{y}$';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should ignore escaped braces', () => {
      const text = 'Use \\{ and \\} for sets';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should detect multiple unmatched braces', () => {
      const text = 'Formula: $x^{2 + y^{3$';
      const errors = validateLatex(text);
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe('command validation', () => {
    it('should detect backslash followed by space', () => {
      const text = 'Formula: $\\ alpha$';
      const errors = validateLatex(text);
      expect(errors.some((e) => e.message.includes('Backslash'))).toBe(true);
    });

    it('should allow double backslash', () => {
      const text = 'Line break: \\\\ next line';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid frac syntax', () => {
      const text = 'Formula: $\\frac x$';
      const errors = validateLatex(text);
      expect(errors.some((e) => e.message.includes('frac'))).toBe(true);
    });

    it('should validate correct frac syntax', () => {
      const text = 'Formula: $\\frac{a}{b}$';
      const errors = validateLatex(text);
      expect(errors).toHaveLength(0);
    });
  });

  describe('math blank line detection', () => {
    it('should detect blank line inside $$...$$ block', () => {
      const text = '$$\nx + y\n\n= z\n$$';
      const errors = validateLatex(text);
      expect(errors.some(e => e.message.includes('Blank line inside'))).toBe(true);
    });

    it('should detect multiple blank lines in one math block', () => {
      const text = '$$\nx\n\ny\n\nz\n$$';
      const errors = validateLatex(text);
      const blankLineErrors = errors.filter(e => e.message.includes('Blank line inside'));
      expect(blankLineErrors.length).toBe(2);
    });

    it('should not flag blank lines outside math blocks', () => {
      const text = 'Some text\n\nMore text\n\n$$\nx + y = z\n$$';
      const errors = validateLatex(text);
      expect(errors.some(e => e.message.includes('Blank line inside'))).toBe(false);
    });

    it('should report correct opening line number in error message', () => {
      const text = 'text\n$$\nx\n\ny\n$$';
      const errors = validateLatex(text);
      const err = errors.find(e => e.message.includes('Blank line inside'));
      expect(err.message).toContain('line 2');
    });

    it('should handle multiple separate math blocks', () => {
      const text = '$$\nx\n$$\n\ntext\n\n$$\ny\n\nz\n$$';
      const errors = validateLatex(text);
      const blankLineErrors = errors.filter(e => e.message.includes('Blank line inside'));
      // Only the second block has a blank line
      expect(blankLineErrors.length).toBe(1);
    });

    it('should not flag $$ used inline (not on own line)', () => {
      const text = 'Inline $$x + y$$ text\n\nMore text';
      const errors = validateLatex(text);
      expect(errors.some(e => e.message.includes('Blank line inside'))).toBe(false);
    });

    it('should include position in error', () => {
      const text = '$$\nx\n\ny\n$$';
      const errors = validateLatex(text);
      const err = errors.find(e => e.message.includes('Blank line inside'));
      expect(err.position).toBeDefined();
      expect(typeof err.position).toBe('number');
    });
  });

  describe('extractMath', () => {
    it('should extract inline math', () => {
      const text = 'Formula: $x^2$ and $y^2$';
      const blocks = extractMath(text);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('inline');
      expect(blocks[0].content).toBe('x^2');
      expect(blocks[1].content).toBe('y^2');
    });

    it('should extract display math with $$', () => {
      const text = 'Formula: $$x^2 + y^2 = z^2$$';
      const blocks = extractMath(text);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('display');
      expect(blocks[0].content).toBe('x^2 + y^2 = z^2');
    });

    it('should extract display math with brackets', () => {
      const text = 'Formula: \\[x^2 + y^2\\]';
      const blocks = extractMath(text);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('display');
    });

    it('should handle mixed math modes', () => {
      const text = 'Inline $a$ and display $$b$$ and inline $c$';
      const blocks = extractMath(text);
      expect(blocks).toHaveLength(3);
      expect(blocks.filter((b) => b.type === 'inline')).toHaveLength(2);
      expect(blocks.filter((b) => b.type === 'display')).toHaveLength(1);
    });

    it('should return empty array for no math', () => {
      const text = 'No math here';
      const blocks = extractMath(text);
      expect(blocks).toHaveLength(0);
    });

    it('should include position information', () => {
      const text = 'Start $x$ middle';
      const blocks = extractMath(text);
      expect(blocks[0].position).toBeDefined();
      expect(typeof blocks[0].position).toBe('number');
    });
  });

  describe('hasLatex', () => {
    it('should detect inline math', () => {
      expect(hasLatex('Formula: $x^2$')).toBe(true);
    });

    it('should detect display math', () => {
      expect(hasLatex('Formula: $$x^2$$')).toBe(true);
    });

    it('should detect bracket math', () => {
      expect(hasLatex('Formula: \\[x^2\\]')).toBe(true);
    });

    it('should detect LaTeX commands', () => {
      expect(hasLatex('Use \\alpha for alpha')).toBe(true);
      expect(hasLatex('\\frac{a}{b}')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(hasLatex('No math here')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(hasLatex(null)).toBe(false);
      expect(hasLatex(undefined)).toBe(false);
      expect(hasLatex('')).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(hasLatex(123)).toBe(false);
      expect(hasLatex({})).toBe(false);
    });
  });

  describe('stripMathBlankLines', () => {
    it('should remove blank lines inside $$...$$ blocks', () => {
      const input = '$$\nx + y\n\n= z\n$$';
      const result = stripMathBlankLines(input);
      expect(result).toBe('$$\nx + y\n= z\n$$');
    });

    it('should preserve blank lines outside math blocks', () => {
      const input = 'Paragraph 1\n\nParagraph 2\n\n$$\nx = y\n$$';
      const result = stripMathBlankLines(input);
      expect(result).toBe(input);
    });

    it('should handle multiple blank lines in one block', () => {
      const input = '$$\na\n\nb\n\nc\n$$';
      const result = stripMathBlankLines(input);
      expect(result).toBe('$$\na\nb\nc\n$$');
    });

    it('should handle multiple math blocks independently', () => {
      const input = '$$\nx\n$$\n\ntext\n\n$$\ny\n\nz\n$$';
      const result = stripMathBlankLines(input);
      expect(result).toBe('$$\nx\n$$\n\ntext\n\n$$\ny\nz\n$$');
    });

    it('should return null/undefined as-is', () => {
      expect(stripMathBlankLines(null)).toBe(null);
      expect(stripMathBlankLines(undefined)).toBe(undefined);
      expect(stripMathBlankLines('')).toBe('');
    });

    it('should return non-string input as-is', () => {
      expect(stripMathBlankLines(123)).toBe(123);
    });

    it('should handle text with no math blocks', () => {
      const input = 'Just regular\n\ntext with blanks\n\n';
      const result = stripMathBlankLines(input);
      expect(result).toBe(input);
    });

    it('should preserve indentation within math blocks', () => {
      const input = '$$\n  x + y\n  = z\n$$';
      const result = stripMathBlankLines(input);
      expect(result).toBe(input);
    });
  });

  describe('error context', () => {
    it('should provide context for errors', () => {
      const text = 'Some text before $bad math and some text after';
      const errors = validateLatex(text);
      expect(errors[0].context).toBeDefined();
      expect(typeof errors[0].context).toBe('string');
    });

    it('should include position information', () => {
      const text = 'Error here: $bad';
      const errors = validateLatex(text);
      expect(errors[0].position).toBeDefined();
      expect(typeof errors[0].position).toBe('number');
    });
  });
});
