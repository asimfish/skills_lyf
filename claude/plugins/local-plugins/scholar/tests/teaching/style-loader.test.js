/**
 * Tests for 4-Layer Teaching Style Loader
 *
 * Tests the hierarchical style system:
 * - Layer 1: Global (~/.claude/CLAUDE.md)
 * - Layer 2: Course (.claude/teaching-style.local.md)
 * - Layer 3: Command (command_overrides)
 * - Layer 4: Lesson plan (teaching_style_overrides)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  getDefaultTeachingStyle,
  parseYamlFrontmatter,
  readTeachingStyleFile,
  findCourseRoot,
  loadCourseStyle,
  extractCommandOverrides,
  deepMerge,
  mergeTeachingStyles,
  toPromptStyle,
  loadTeachingStyle,
  validateTeachingStyle,
  getStyleSummary
} from '../../src/teaching/config/style-loader.js';

describe('Teaching Style Loader', () => {
  let testDir;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `style-loader-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getDefaultTeachingStyle', () => {
    it('should return a valid default style object', () => {
      const style = getDefaultTeachingStyle();

      expect(style).toHaveProperty('pedagogical_approach');
      expect(style).toHaveProperty('explanation_style');
      expect(style).toHaveProperty('assessment_philosophy');
      expect(style).toHaveProperty('student_interaction');
      expect(style).toHaveProperty('content_preferences');
    });

    it('should have active-learning as default pedagogical approach', () => {
      const style = getDefaultTeachingStyle();

      expect(style.pedagogical_approach.primary).toBe('active-learning');
    });

    it('should have balanced as default formality', () => {
      const style = getDefaultTeachingStyle();

      expect(style.explanation_style.formality).toBe('balanced');
    });

    it('should have intuition-first as default proof style', () => {
      const style = getDefaultTeachingStyle();

      expect(style.explanation_style.proof_style).toBe('intuition-first');
    });
  });

  describe('parseYamlFrontmatter', () => {
    it('should parse valid YAML frontmatter', () => {
      const content = `---
teaching_style:
  tone: formal
  approach: lecture
---

# Some Markdown Content
`;
      const result = parseYamlFrontmatter(content);

      expect(result).toHaveProperty('teaching_style');
      expect(result.teaching_style.tone).toBe('formal');
    });

    it('should return null for content without frontmatter', () => {
      const content = `# Just Markdown

No frontmatter here.`;

      const result = parseYamlFrontmatter(content);

      expect(result).toBeNull();
    });

    it('should return null for invalid YAML', () => {
      const content = `---
teaching_style:
  invalid: [unclosed
---`;

      const result = parseYamlFrontmatter(content);

      expect(result).toBeNull();
    });

    it('should return null for null/undefined input', () => {
      expect(parseYamlFrontmatter(null)).toBeNull();
      expect(parseYamlFrontmatter(undefined)).toBeNull();
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---

Content`;

      const result = parseYamlFrontmatter(content);

      expect(result).toBeNull();
    });
  });

  describe('readTeachingStyleFile', () => {
    it('should read and parse teaching style from markdown file', () => {
      const filePath = join(testDir, 'teaching-style.md');
      writeFileSync(filePath, `---
teaching_style:
  pedagogical_approach:
    primary: flipped
  explanation_style:
    formality: formal
---

# Teaching Philosophy
`);

      const style = readTeachingStyleFile(filePath);

      expect(style).toHaveProperty('pedagogical_approach');
      expect(style.pedagogical_approach.primary).toBe('flipped');
      expect(style.explanation_style.formality).toBe('formal');
    });

    it('should return null for non-existent file', () => {
      const result = readTeachingStyleFile('/nonexistent/path.md');

      expect(result).toBeNull();
    });

    it('should return null if file has no teaching_style key', () => {
      const filePath = join(testDir, 'no-style.md');
      writeFileSync(filePath, `---
other_key: value
---

Content`);

      const result = readTeachingStyleFile(filePath);

      expect(result).toBeNull();
    });
  });

  describe('findCourseRoot', () => {
    it('should find course root with .claude directory', () => {
      const courseDir = join(testDir, 'course');
      const claudeDir = join(courseDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });

      const result = findCourseRoot(courseDir);

      expect(result).toBe(courseDir);
    });

    it('should find course root with .flow directory', () => {
      const courseDir = join(testDir, 'course');
      const flowDir = join(courseDir, '.flow');
      mkdirSync(flowDir, { recursive: true });

      const result = findCourseRoot(courseDir);

      expect(result).toBe(courseDir);
    });

    it('should search parent directories', () => {
      const courseDir = join(testDir, 'course');
      const subDir = join(courseDir, 'src', 'components');
      mkdirSync(subDir, { recursive: true });
      mkdirSync(join(courseDir, '.claude'), { recursive: true });

      const result = findCourseRoot(subDir);

      expect(result).toBe(courseDir);
    });

    it('should return null if no course root found', () => {
      const result = findCourseRoot(testDir);

      expect(result).toBeNull();
    });
  });

  describe('extractCommandOverrides', () => {
    it('should extract command-specific overrides', () => {
      const courseStyle = {
        formality: 'balanced',
        command_overrides: {
          exam: { formality: 'formal', show_solutions: false },
          quiz: { formality: 'conversational', show_solutions: true }
        }
      };

      const examOverrides = extractCommandOverrides(courseStyle, 'exam');
      const quizOverrides = extractCommandOverrides(courseStyle, 'quiz');

      expect(examOverrides.formality).toBe('formal');
      expect(examOverrides.show_solutions).toBe(false);
      expect(quizOverrides.formality).toBe('conversational');
      expect(quizOverrides.show_solutions).toBe(true);
    });

    it('should return null if no command_overrides', () => {
      const courseStyle = { formality: 'balanced' };

      const result = extractCommandOverrides(courseStyle, 'exam');

      expect(result).toBeNull();
    });

    it('should return null for unknown command', () => {
      const courseStyle = {
        command_overrides: {
          exam: { formality: 'formal' }
        }
      };

      const result = extractCommandOverrides(courseStyle, 'unknown');

      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      expect(extractCommandOverrides(null, 'exam')).toBeNull();
    });
  });

  describe('deepMerge', () => {
    it('should merge nested objects', () => {
      const target = {
        a: { b: 1, c: 2 },
        d: 3
      };
      const source = {
        a: { b: 10, e: 4 },
        f: 5
      };

      const result = deepMerge(target, source);

      expect(result.a.b).toBe(10);  // Overwritten
      expect(result.a.c).toBe(2);   // Preserved
      expect(result.a.e).toBe(4);   // Added
      expect(result.d).toBe(3);     // Preserved
      expect(result.f).toBe(5);     // Added
    });

    it('should not modify original objects', () => {
      const target = { a: 1 };
      const source = { b: 2 };

      const result = deepMerge(target, source);

      expect(target).toEqual({ a: 1 });
      expect(source).toEqual({ b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should handle null/undefined gracefully', () => {
      expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
      expect(deepMerge({ a: 1 }, null)).toEqual({ a: 1 });
    });

    it('should override arrays, not merge them', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5] };

      const result = deepMerge(target, source);

      expect(result.arr).toEqual([4, 5]);
    });
  });

  describe('mergeTeachingStyles', () => {
    it('should start with defaults when no styles provided', () => {
      const result = mergeTeachingStyles({});

      expect(result.pedagogical_approach.primary).toBe('active-learning');
    });

    it('should apply global style over defaults', () => {
      const globalStyle = {
        pedagogical_approach: { primary: 'lecture-based' }
      };

      const result = mergeTeachingStyles({ globalStyle });

      expect(result.pedagogical_approach.primary).toBe('lecture-based');
    });

    it('should apply course style over global', () => {
      const globalStyle = {
        pedagogical_approach: { primary: 'lecture-based' }
      };
      const courseStyle = {
        pedagogical_approach: { primary: 'flipped' }
      };

      const result = mergeTeachingStyles({ globalStyle, courseStyle });

      expect(result.pedagogical_approach.primary).toBe('flipped');
    });

    it('should apply command overrides with highest priority', () => {
      const globalStyle = { explanation_style: { formality: 'balanced' } };
      const courseStyle = { explanation_style: { formality: 'conversational' } };
      const commandOverrides = { explanation_style: { formality: 'formal' } };

      const result = mergeTeachingStyles({ globalStyle, courseStyle, commandOverrides });

      expect(result.explanation_style.formality).toBe('formal');
    });

    it('should exclude command_overrides from course style merge', () => {
      const courseStyle = {
        pedagogical_approach: { primary: 'flipped' },
        command_overrides: { exam: { formality: 'formal' } }
      };

      const result = mergeTeachingStyles({ courseStyle });

      expect(result.command_overrides).toBeUndefined();
    });
  });

  describe('toPromptStyle', () => {
    it('should convert full style to prompt-friendly format', () => {
      const style = getDefaultTeachingStyle();
      const promptStyle = toPromptStyle(style);

      expect(promptStyle).toHaveProperty('tone');
      expect(promptStyle).toHaveProperty('pedagogical_approach');
      expect(promptStyle).toHaveProperty('explanation_style');
      expect(promptStyle).toHaveProperty('_full');
    });

    it('should map formality to tone', () => {
      const style = { explanation_style: { formality: 'formal' } };
      const promptStyle = toPromptStyle(style);

      expect(promptStyle.tone).toBe('formal');
    });

    it('should map pedagogical_approach.primary to pedagogical_approach', () => {
      const style = { pedagogical_approach: { primary: 'flipped' } };
      const promptStyle = toPromptStyle(style);

      expect(promptStyle.pedagogical_approach).toBe('flipped');
    });

    it('should include additional attributes', () => {
      const style = getDefaultTeachingStyle();
      const promptStyle = toPromptStyle(style);

      expect(promptStyle).toHaveProperty('example_depth');
      expect(promptStyle).toHaveProperty('analogies');
      expect(promptStyle).toHaveProperty('real_world_examples');
      expect(promptStyle).toHaveProperty('computational_tools');
    });
  });

  describe('loadTeachingStyle', () => {
    it('should load default style when no files exist', () => {
      const result = loadTeachingStyle({ startDir: testDir });

      expect(result).toHaveProperty('style');
      expect(result).toHaveProperty('promptStyle');
      expect(result).toHaveProperty('sources');
      expect(result.sources.global).toBeNull();
      expect(result.sources.course).toBeNull();
    });

    it('should load course style when available', () => {
      const courseDir = join(testDir, 'course');
      const claudeDir = join(courseDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });

      writeFileSync(join(claudeDir, 'teaching-style.local.md'), `---
teaching_style:
  pedagogical_approach:
    primary: problem-based
  explanation_style:
    formality: conversational
---

# Course Notes
`);

      const result = loadTeachingStyle({ startDir: courseDir });

      expect(result.sources.course).toBeTruthy();
      expect(result.style.pedagogical_approach.primary).toBe('problem-based');
      expect(result.promptStyle.pedagogical_approach).toBe('problem-based');
    });

    it('should apply command overrides for lecture', () => {
      const courseDir = join(testDir, 'course');
      const claudeDir = join(courseDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });

      writeFileSync(join(claudeDir, 'teaching-style.local.md'), `---
teaching_style:
  explanation_style:
    formality: balanced
  command_overrides:
    lecture:
      explanation_style:
        formality: formal
---
`);

      const result = loadTeachingStyle({ command: 'lecture', startDir: courseDir });

      expect(result.sources.command).toBeTruthy();
      expect(result.style.explanation_style.formality).toBe('formal');
    });

    it('should apply lesson plan style overrides', () => {
      const lessonPlan = {
        teaching_style_overrides: {
          explanation_style: { formality: 'engaging' }
        }
      };

      const result = loadTeachingStyle({ lessonPlan, startDir: testDir });

      expect(result.sources.lesson).toBe('lesson-plan');
      expect(result.style.explanation_style.formality).toBe('engaging');
    });
  });

  describe('validateTeachingStyle', () => {
    it('should validate a correct style', () => {
      const style = getDefaultTeachingStyle();
      const result = validateTeachingStyle(style);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about unknown pedagogical approach', () => {
      const style = {
        pedagogical_approach: { primary: 'unknown-approach' }
      };
      const result = validateTeachingStyle(style);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('Unknown pedagogical_approach.primary')
      );
    });

    it('should warn about unknown formality', () => {
      const style = {
        explanation_style: { formality: 'super-casual' }
      };
      const result = validateTeachingStyle(style);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('Unknown explanation_style.formality')
      );
    });

    it('should warn about unknown command override keys', () => {
      const style = {
        command_overrides: { unknown_command: { formality: 'formal' } }
      };
      const result = validateTeachingStyle(style);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('Unknown command_overrides key')
      );
    });

    it('should error on non-object input', () => {
      const result = validateTeachingStyle(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual('Teaching style must be an object');
    });
  });

  describe('getStyleSummary', () => {
    it('should generate human-readable summary', () => {
      const loadResult = loadTeachingStyle({ startDir: testDir });
      const summary = getStyleSummary(loadResult);

      expect(summary).toContain('Teaching Style Configuration');
      expect(summary).toContain('Sources');
      expect(summary).toContain('Applied Style');
      expect(summary).toContain('Tone');
    });

    it('should show source files when available', () => {
      const courseDir = join(testDir, 'course');
      const claudeDir = join(courseDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });

      writeFileSync(join(claudeDir, 'teaching-style.local.md'), `---
teaching_style:
  pedagogical_approach:
    primary: flipped
---
`);

      const loadResult = loadTeachingStyle({ startDir: courseDir });
      const summary = getStyleSummary(loadResult);

      expect(summary).toContain('Course:');
    });
  });

  describe('Edge Cases and Error Paths', () => {
    it('should handle file with valid YAML but wrong structure', () => {
      const filePath = join(testDir, 'wrong-structure.md');
      writeFileSync(filePath, `---
not_teaching_style:
  key: value
---
Content`);

      const result = readTeachingStyleFile(filePath);
      expect(result).toBeNull();
    });

    it('should handle deeply nested directory search', () => {
      const deepDir = join(testDir, 'a', 'b', 'c', 'd', 'e');
      mkdirSync(deepDir, { recursive: true });
      mkdirSync(join(testDir, 'a', '.claude'), { recursive: true });

      const result = findCourseRoot(deepDir);
      expect(result).toBe(join(testDir, 'a'));
    });

    it('should handle loadCourseStyle with null courseRoot', () => {
      const result = loadCourseStyle(null);
      expect(result).toBeNull();
    });

    it('should preserve undefined values in deepMerge', () => {
      const target = { a: 1, b: 2 };
      const source = { a: undefined, c: 3 };

      const result = deepMerge(target, source);
      expect(result.a).toBe(1);  // Undefined doesn't override
      expect(result.c).toBe(3);
    });

    it('should validate all known command types', () => {
      const style = {
        command_overrides: {
          exam: {},
          quiz: {},
          lecture: {},
          assignment: {},
          slides: {},
          syllabus: {},
          rubric: {},
          feedback: {}
        }
      };

      const result = validateTeachingStyle(style);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about multiple unknown values', () => {
      const style = {
        pedagogical_approach: { primary: 'unknown1', secondary: 'unknown2' },
        explanation_style: { formality: 'unknown3', proof_style: 'unknown4' }
      };

      const result = validateTeachingStyle(style);
      expect(result.warnings.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle mergeTeachingStyles with all null layers', () => {
      const result = mergeTeachingStyles({
        globalStyle: null,
        courseStyle: null,
        commandOverrides: null,
        lessonStyle: null
      });

      // Should still return defaults
      expect(result.pedagogical_approach.primary).toBe('active-learning');
    });

    it('should handle toPromptStyle with empty style', () => {
      const result = toPromptStyle({});

      expect(result.tone).toBe('balanced');  // Falls back to default
      expect(result.pedagogical_approach).toBe('active-learning');
    });

    it('should handle toPromptStyle with partial nested structure', () => {
      const style = {
        explanation_style: {},  // Empty nested object
        pedagogical_approach: {}
      };

      const result = toPromptStyle(style);
      expect(result.tone).toBe('balanced');
      expect(result.pedagogical_approach).toBe('active-learning');
    });
  });

  describe('Integration Scenarios', () => {
    it('should correctly cascade 4 layers of style', () => {
      const courseDir = join(testDir, 'course');
      const claudeDir = join(courseDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });

      // Create course style with command overrides
      writeFileSync(join(claudeDir, 'teaching-style.local.md'), `---
teaching_style:
  pedagogical_approach:
    primary: flipped
  explanation_style:
    formality: conversational
  command_overrides:
    lecture:
      explanation_style:
        formality: formal
---
`);

      // Lesson plan with style overrides
      const lessonPlan = {
        teaching_style_overrides: {
          explanation_style: { proof_style: 'proof-first' }
        }
      };

      const result = loadTeachingStyle({
        command: 'lecture',
        startDir: courseDir,
        lessonPlan
      });

      // Command override wins for formality
      expect(result.style.explanation_style.formality).toBe('formal');
      // Course style provides pedagogical_approach
      expect(result.style.pedagogical_approach.primary).toBe('flipped');
    });

    it('should handle quiz command differently from lecture', () => {
      const courseDir = join(testDir, 'course');
      const claudeDir = join(courseDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });

      writeFileSync(join(claudeDir, 'teaching-style.local.md'), `---
teaching_style:
  explanation_style:
    formality: balanced
  command_overrides:
    lecture:
      explanation_style:
        formality: formal
    quiz:
      explanation_style:
        formality: conversational
---
`);

      const lectureResult = loadTeachingStyle({ command: 'lecture', startDir: courseDir });
      const quizResult = loadTeachingStyle({ command: 'quiz', startDir: courseDir });

      expect(lectureResult.style.explanation_style.formality).toBe('formal');
      expect(quizResult.style.explanation_style.formality).toBe('conversational');
    });
  });
});
