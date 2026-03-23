/**
 * Unit tests for Lecture Notes AI Prompt Templates
 *
 * Tests the prompt builders used for section-by-section lecture generation:
 * - Outline generation prompts
 * - Section content prompts
 * - Teaching style integration
 * - Continuity context handling
 */

import {
  buildOutlinePrompt,
  buildSectionPrompt,
  buildStyleGuidance,
  buildRetryPrompt,
  extractSectionSummary,
  buildTeachingStylePrompt,
  getSectionTypePrompt,
  getLevelPrompt
} from '../../src/teaching/ai/lecture-prompts.js';

describe('Lecture Prompts', () => {
  // Common test fixtures
  const defaultOptions = {
    topic: 'Multiple Linear Regression',
    level: 'undergraduate',
    language: 'r',
    field: 'statistics',
    courseCode: 'STAT 440',
    courseName: 'Regression Analysis'
  };

  const defaultTeachingStyle = {
    tone: 'formal',
    pedagogical_approach: 'active-learning',
    explanation_style: 'rigorous-with-intuition'
  };

  const sampleLessonPlan = {
    learning_objectives: [
      'Understand the assumptions of multiple linear regression',
      'Apply OLS estimation to multivariate data',
      'Interpret coefficient estimates in context'
    ]
  };

  describe('buildOutlinePrompt', () => {
    it('should build a valid outline prompt with all options', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);

      expect(prompt).toContain('Multiple Linear Regression');
      expect(prompt).toContain('STAT 440');
      expect(prompt).toContain('Regression Analysis');
      expect(prompt).toContain('statistics');
      expect(prompt).toContain('undergraduate');
    });

    it('should include teaching style guidance', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);

      expect(prompt).toContain('Tone: formal');
      expect(prompt).toContain('Approach: active-learning');
      expect(prompt).toContain('rigorous-with-intuition');
    });

    it('should generate objectives when no lesson plan provided', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle, null);

      expect(prompt).toContain("Generate 4-6 learning objectives using Bloom's taxonomy");
    });

    it('should use lesson plan objectives when provided', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle, sampleLessonPlan);

      expect(prompt).toContain('Use these learning objectives from the lesson plan');
      expect(prompt).toContain('Understand the assumptions of multiple linear regression');
      expect(prompt).toContain('Apply OLS estimation to multivariate data');
    });

    it('should include JSON format specification', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);

      expect(prompt).toContain('Format your response as JSON');
      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"sections"');
      expect(prompt).toContain('"learning_objectives"');
    });

    it('should specify section types in prompt', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);

      expect(prompt).toContain('introduction');
      expect(prompt).toContain('concept');
      expect(prompt).toContain('definition');
      expect(prompt).toContain('example');
      expect(prompt).toContain('code');
      expect(prompt).toContain('practice');
      expect(prompt).toContain('summary');
    });

    it('should include target page count', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);

      expect(prompt).toContain('20-30 pages');
      expect(prompt).toContain('8-12 top-level sections');
    });

    it('should specify programming language for code sections', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);
      expect(prompt).toContain('R implementation');

      const pythonOptions = { ...defaultOptions, language: 'python' };
      const pythonPrompt = buildOutlinePrompt(pythonOptions, defaultTeachingStyle);
      expect(pythonPrompt).toContain('PYTHON implementation');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalOptions = {
        topic: 'Basic Statistics'
      };

      const prompt = buildOutlinePrompt(minimalOptions, defaultTeachingStyle);

      expect(prompt).toContain('Basic Statistics');
      expect(prompt).toContain('Level: undergraduate'); // default
      expect(prompt).not.toContain('undefined');
    });

    it('should omit course info when not provided', () => {
      const noCourseOptions = {
        topic: 'Basic Statistics',
        level: 'graduate',
        field: 'statistics'
      };

      const prompt = buildOutlinePrompt(noCourseOptions, defaultTeachingStyle);

      expect(prompt).toContain('Level: graduate');
      expect(prompt).not.toContain('Course:');
    });

    it('should include section ID pattern guidance', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);

      expect(prompt).toContain('S1, S2, S2.1, S2.2');
    });

    it('should include reference requirements', () => {
      const prompt = buildOutlinePrompt(defaultOptions, defaultTeachingStyle);

      expect(prompt).toContain('references');
      expect(prompt).toContain('textbooks in statistics');
    });
  });

  describe('buildSectionPrompt', () => {
    const sectionOutline = {
      id: 'S2',
      type: 'concept',
      title: 'OLS Estimation',
      level: 1,
      estimated_pages: 3
    };

    const learningObjectives = [
      'Understand OLS estimation',
      'Apply regression techniques'
    ];

    it('should build a valid section prompt', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('OLS Estimation');
      expect(prompt).toContain('S2');
      expect(prompt).toContain('concept');
      expect(prompt).toContain('3 pages');
    });

    it('should include previous context when provided', () => {
      const previousContext = 'Section 1 covered basic introduction to regression.';

      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        previousContext,
        learningObjectives
      );

      expect(prompt).toContain('Previous sections covered');
      expect(prompt).toContain('Section 1 covered basic introduction');
      expect(prompt).toContain('Build on this context');
    });

    it('should indicate first section when no previous context', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('This is the first section');
    });

    it('should include learning objectives', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('Understand OLS estimation');
      expect(prompt).toContain('Apply regression techniques');
    });

    it('should include teaching style guidance', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('Tone: formal');
      expect(prompt).toContain('Approach: active-learning');
    });

    it('should include JSON format specification', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('Format your response as JSON');
      expect(prompt).toContain('"content"');
      expect(prompt).toContain('"summary"');
    });

    it('should include LaTeX escaping instructions', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('double backslashes');
      expect(prompt).toContain('\\\\frac');
    });

    it('should include type-specific instructions for concept section', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('Concept Section Requirements');
      expect(prompt).toContain('core idea');
      expect(prompt).toContain('mathematical formulation');
    });

    it('should include type-specific instructions for example section', () => {
      const exampleSection = {
        id: 'S3',
        type: 'example',
        title: 'Worked Example: House Prices',
        level: 1,
        estimated_pages: 2
      };

      const prompt = buildSectionPrompt(
        exampleSection,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('Worked Example Section Requirements');
      expect(prompt).toContain('realistic problem');
      expect(prompt).toContain('complete solution');
    });

    it('should include type-specific instructions for code section', () => {
      const codeSection = {
        id: 'S4',
        type: 'code',
        title: 'R Implementation',
        level: 1,
        estimated_pages: 2
      };

      const prompt = buildSectionPrompt(
        codeSection,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('Code Section Requirements');
      expect(prompt).toContain('executable R code');
      expect(prompt).toContain('tidyverse style');
    });

    it('should include type-specific instructions for practice section', () => {
      const practiceSection = {
        id: 'S5',
        type: 'practice',
        title: 'Practice Problems',
        level: 1,
        estimated_pages: 2
      };

      const prompt = buildSectionPrompt(
        practiceSection,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('Practice Problems Section Requirements');
      expect(prompt).toContain('3-5 problems');
      expect(prompt).toContain('difficulty');
    });

    it('should include word count approximation', () => {
      const prompt = buildSectionPrompt(
        sectionOutline,
        defaultOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      // 3 pages * 400 words = 1200
      expect(prompt).toContain('1200 words');
    });

    it('should include Python-specific guidance when language is python', () => {
      const pythonOptions = { ...defaultOptions, language: 'python' };
      const codeSection = {
        id: 'S4',
        type: 'code',
        title: 'Python Implementation',
        level: 1,
        estimated_pages: 2
      };

      const prompt = buildSectionPrompt(
        codeSection,
        pythonOptions,
        defaultTeachingStyle,
        '',
        learningObjectives
      );

      expect(prompt).toContain('PEP 8 style');
      expect(prompt).toContain('PYTHON');
    });
  });

  describe('buildStyleGuidance', () => {
    it('should build guidance for formal tone', () => {
      const guidance = buildStyleGuidance({ tone: 'formal' });

      expect(guidance).toContain('Tone: formal');
      expect(guidance).toContain('formal academic language');
    });

    it('should build guidance for conversational tone', () => {
      const guidance = buildStyleGuidance({ tone: 'conversational' });

      expect(guidance).toContain('Tone: conversational');
      expect(guidance).toContain('conversational but professional');
      expect(guidance).toContain('rhetorical questions');
    });

    it('should build guidance for engaging tone', () => {
      const guidance = buildStyleGuidance({ tone: 'engaging' });

      expect(guidance).toContain('Tone: engaging');
      expect(guidance).toContain('"you" statements');
    });

    it('should build guidance for lecture-based approach', () => {
      const guidance = buildStyleGuidance({ pedagogical_approach: 'lecture-based' });

      expect(guidance).toContain('Approach: lecture-based');
      expect(guidance).toContain('linear, expository');
    });

    it('should build guidance for active-learning approach', () => {
      const guidance = buildStyleGuidance({ pedagogical_approach: 'active-learning' });

      expect(guidance).toContain('active-learning');
      expect(guidance).toContain('Stop and Think');
    });

    it('should build guidance for problem-based approach', () => {
      const guidance = buildStyleGuidance({ pedagogical_approach: 'problem-based' });

      expect(guidance).toContain('problem-based');
      expect(guidance).toContain('motivating problems');
    });

    it('should build guidance for flipped approach', () => {
      const guidance = buildStyleGuidance({ pedagogical_approach: 'flipped' });

      expect(guidance).toContain('flipped');
      expect(guidance).toContain('prior exposure');
    });

    it('should build guidance for rigorous explanation style', () => {
      const guidance = buildStyleGuidance({ explanation_style: 'rigorous' });

      expect(guidance).toContain('rigorous');
      expect(guidance).toContain('mathematical rigor');
      expect(guidance).toContain('proofs');
    });

    it('should build guidance for intuitive explanation style', () => {
      const guidance = buildStyleGuidance({ explanation_style: 'intuitive' });

      expect(guidance).toContain('intuitive');
      expect(guidance).toContain('visual explanations');
      expect(guidance).toContain('analogies');
    });

    it('should build guidance for rigorous-with-intuition explanation style', () => {
      const guidance = buildStyleGuidance({ explanation_style: 'rigorous-with-intuition' });

      expect(guidance).toContain('rigorous-with-intuition');
      expect(guidance).toContain('Balance rigor with intuition');
    });

    it('should use defaults for empty style object', () => {
      const guidance = buildStyleGuidance({});

      expect(guidance).toContain('Tone: formal');
      expect(guidance).toContain('active-learning');
      expect(guidance).toContain('rigorous-with-intuition');
    });

    it('should handle unknown values gracefully', () => {
      const guidance = buildStyleGuidance({
        tone: 'unknown-tone',
        pedagogical_approach: 'unknown-approach',
        explanation_style: 'unknown-style'
      });

      // Should fall back to defaults
      expect(guidance).toContain('Tone: unknown-tone');
      expect(guidance).toContain('formal academic language'); // default guidance
    });
  });

  describe('buildRetryPrompt', () => {
    const failedSection = {
      id: 'S2',
      type: 'concept',
      title: 'OLS Estimation'
    };

    it('should include error message in retry prompt', () => {
      const prompt = buildRetryPrompt(
        failedSection,
        defaultOptions,
        null,
        'JSON parse error at position 42'
      );

      expect(prompt).toContain('JSON parse error at position 42');
    });

    it('should include section information', () => {
      const prompt = buildRetryPrompt(
        failedSection,
        defaultOptions,
        null,
        'Invalid JSON'
      );

      expect(prompt).toContain('OLS Estimation');
      expect(prompt).toContain('concept');
    });

    it('should include previous attempt excerpt when provided', () => {
      const previousAttempt = '{ "id": "S2", "content": "This is some content that was incorrectly formatted...';

      const prompt = buildRetryPrompt(
        failedSection,
        defaultOptions,
        previousAttempt,
        'Missing closing brace'
      );

      expect(prompt).toContain('Previous attempt');
      expect(prompt).toContain('incorrectly formatted');
    });

    it('should truncate long previous attempts', () => {
      const longAttempt = 'x'.repeat(1000);

      const prompt = buildRetryPrompt(
        failedSection,
        defaultOptions,
        longAttempt,
        'Error'
      );

      // Should truncate to 500 chars + ...
      expect(prompt.length).toBeLessThan(longAttempt.length);
    });

    it('should include JSON format requirements', () => {
      const prompt = buildRetryPrompt(
        failedSection,
        defaultOptions,
        null,
        'Invalid JSON'
      );

      expect(prompt).toContain('Valid JSON format');
      expect(prompt).toContain('proper escaping');
    });

    it('should include LaTeX escaping reminder', () => {
      const prompt = buildRetryPrompt(
        failedSection,
        defaultOptions,
        null,
        'Parse error'
      );

      expect(prompt).toContain('double backslashes');
      expect(prompt).toContain('\\\\frac');
    });

    it('should include language-specific code reminder', () => {
      const prompt = buildRetryPrompt(
        failedSection,
        defaultOptions,
        null,
        'Code error'
      );

      expect(prompt).toContain('valid R');

      const pythonPrompt = buildRetryPrompt(
        failedSection,
        { ...defaultOptions, language: 'python' },
        null,
        'Code error'
      );

      expect(pythonPrompt).toContain('valid PYTHON');
    });
  });

  describe('extractSectionSummary', () => {
    it('should return explicit summary when provided', () => {
      const section = {
        title: 'Test Section',
        content: 'This is a long content...',
        summary: 'This is the explicit summary.'
      };

      expect(extractSectionSummary(section)).toBe('This is the explicit summary.');
    });

    it('should fall back to bullets when no summary', () => {
      const section = {
        title: 'Test Section',
        content: 'Some content',
        bullets: ['First key point', 'Second key point', 'Third key point']
      };

      const result = extractSectionSummary(section);

      expect(result).toContain('First key point');
      expect(result).toContain('Second key point');
      expect(result).not.toContain('Third key point'); // Only first 2
    });

    it('should fall back to first sentence of content', () => {
      const section = {
        title: 'Test Section',
        content: 'This is the first sentence. This is the second sentence. More content here.'
      };

      const result = extractSectionSummary(section);

      expect(result).toBe('This is the first sentence.');
    });

    it('should handle content with question marks', () => {
      const section = {
        title: 'Test Section',
        content: 'What is regression? It is a statistical method. More follows.'
      };

      const result = extractSectionSummary(section);

      expect(result).toBe('What is regression?');
    });

    it('should handle content with exclamation marks', () => {
      const section = {
        title: 'Test Section',
        content: 'This is important! Pay attention to this.'
      };

      const result = extractSectionSummary(section);

      expect(result).toBe('This is important!');
    });

    it('should truncate long first sentences', () => {
      const section = {
        title: 'Test Section',
        content: 'A'.repeat(200) + '. Second sentence.'
      };

      const result = extractSectionSummary(section);

      expect(result.length).toBeLessThanOrEqual(150);
    });

    it('should fall back to content excerpt when no sentence boundary', () => {
      const section = {
        title: 'Test Section',
        content: 'This is content without any sentence ending punctuation just going on and on'
      };

      const result = extractSectionSummary(section);

      expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(result).toContain('...');
    });

    it('should fall back to title when no content', () => {
      const section = {
        title: 'Test Section'
      };

      expect(extractSectionSummary(section)).toBe('Test Section');
    });

    it('should handle empty bullets array', () => {
      const section = {
        title: 'Test Section',
        content: 'Some content.',
        bullets: []
      };

      expect(extractSectionSummary(section)).toBe('Some content.');
    });

    it('should handle single bullet', () => {
      const section = {
        title: 'Test Section',
        bullets: ['Only one bullet']
      };

      expect(extractSectionSummary(section)).toBe('Only one bullet');
    });
  });

  describe('Exported aliases', () => {
    it('should export buildStyleGuidance as buildTeachingStylePrompt', () => {
      expect(buildTeachingStylePrompt).toBe(buildStyleGuidance);
    });

    it('should export buildTypeInstructions as getSectionTypePrompt', () => {
      expect(typeof getSectionTypePrompt).toBe('function');
    });

    it('should export buildLevelGuidance as getLevelPrompt', () => {
      expect(typeof getLevelPrompt).toBe('function');
    });
  });

  describe('Level guidance', () => {
    // Access through the alias
    it('should provide undergraduate level guidance', () => {
      const guidance = getLevelPrompt('undergraduate');

      expect(guidance).toContain('Undergraduate Level');
      expect(guidance).toContain('calculus and basic probability');
      expect(guidance).toContain('concrete examples');
    });

    it('should provide graduate level guidance', () => {
      const guidance = getLevelPrompt('graduate');

      expect(guidance).toContain('Graduate Level');
      expect(guidance).toContain('real analysis');
      expect(guidance).toContain('rigorous proofs');
      expect(guidance).toContain('research literature');
    });

    it('should provide cross-listed course guidance', () => {
      const guidance = getLevelPrompt('both');

      expect(guidance).toContain('Cross-Listed Course');
      expect(guidance).toContain('accessible to undergraduates');
      expect(guidance).toContain('Graduate Level');
      expect(guidance).toContain('callout');
    });

    it('should default to undergraduate for unknown level', () => {
      const guidance = getLevelPrompt('unknown');

      expect(guidance).toContain('Undergraduate Level');
    });
  });

  describe('Section type instructions', () => {
    it('should provide introduction section instructions', () => {
      const instructions = getSectionTypePrompt('introduction', 'r', 2);

      expect(instructions).toContain('Introduction Section');
      expect(instructions).toContain('motivation');
      expect(instructions).toContain('Preview');
    });

    it('should provide theorem section instructions', () => {
      const instructions = getSectionTypePrompt('theorem', 'r', 2);

      expect(instructions).toContain('Theorem Section');
      expect(instructions).toContain('formally');
      expect(instructions).toContain('conditions');
    });

    it('should provide proof section instructions', () => {
      const instructions = getSectionTypePrompt('proof', 'r', 2);

      expect(instructions).toContain('Proof Section');
      expect(instructions).toContain('logical steps');
      expect(instructions).toContain('QED');
    });

    it('should provide discussion section instructions', () => {
      const instructions = getSectionTypePrompt('discussion', 'r', 1);

      expect(instructions).toContain('Discussion Section');
      expect(instructions).toContain('open-ended questions');
      expect(instructions).toContain('critical thinking');
    });

    it('should provide summary section instructions', () => {
      const instructions = getSectionTypePrompt('summary', 'r', 1);

      expect(instructions).toContain('Summary Section');
      expect(instructions).toContain('key takeaways');
      expect(instructions).toContain('learning objectives');
    });

    it('should provide definition section instructions', () => {
      const instructions = getSectionTypePrompt('definition', 'r', 1);

      expect(instructions).toContain('Definition Section');
      expect(instructions).toContain('formal definition');
      expect(instructions).toContain('notation');
    });

    it('should provide generic instructions for unknown type', () => {
      const instructions = getSectionTypePrompt('unknown', 'r', 2);

      expect(instructions).toContain('General Section');
      expect(instructions).toContain('2 pages');
    });

    it('should include language-specific info in code instructions', () => {
      const rInstructions = getSectionTypePrompt('code', 'r', 2);
      expect(rInstructions).toContain('tidyverse');

      const pyInstructions = getSectionTypePrompt('code', 'python', 2);
      expect(pyInstructions).toContain('PEP 8');
    });
  });
});
