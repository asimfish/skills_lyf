/**
 * Integration tests for Lecture Notes Generation Flow
 *
 * Tests the interaction between:
 * - AI Provider (mocked via dependency injection)
 * - Lecture Notes Generator
 * - Prompt Builders
 * - Progress Reporting
 *
 * Uses the exported functions with mock AI provider instances.
 */

import {
  generateOutline,
  generateSections,
  SECTION_TYPES,
  loadTeachingStyle,
  calculateMetadata,
  getFallbackOutline,
  getFallbackSectionContent,
  countSections
} from '../../src/teaching/generators/lecture-notes.js';

describe('Lecture Notes Integration', () => {
  // Mock AI provider that can be configured per test
  function createMockAI(responses = {}) {
    let callCount = 0;
    const calls = [];

    return {
      generate: async (prompt, options) => {
        calls.push({ prompt, options });
        const responseKey = callCount;
        callCount++;

        if (responses.sequence) {
          return responses.sequence[responseKey] || responses.default || {
            success: false,
            error: 'No mock response configured'
          };
        }

        if (responses.outline && callCount === 1) {
          return responses.outline;
        }

        if (responses.section) {
          return responses.section;
        }

        return responses.default || {
          success: true,
          content: { placeholder: true },
          metadata: { model: 'mock', tokens: 100 }
        };
      },
      getStats: () => responses.stats || {
        totalRequests: callCount,
        successfulRequests: callCount,
        failedRequests: 0,
        retriedRequests: 0,
        totalTokens: callCount * 100,
        successRate: 100
      },
      resetStats: () => { callCount = 0; },
      getCalls: () => calls
    };
  }

  // Sample test data
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

  const mockOutlineResponse = {
    success: true,
    content: {
      title: 'Introduction to Multiple Linear Regression',
      topic: 'Multiple Linear Regression',
      learning_objectives: [
        'Understand the assumptions of multiple linear regression',
        'Apply OLS estimation to multivariate data',
        'Interpret coefficient estimates in context'
      ],
      sections: [
        { id: 'S1', type: 'introduction', title: 'Introduction', level: 1, estimated_pages: 2 },
        { id: 'S2', type: 'concept', title: 'The Linear Model', level: 1, estimated_pages: 3 },
        { id: 'S3', type: 'example', title: 'Worked Example', level: 1, estimated_pages: 2 },
        { id: 'S4', type: 'code', title: 'R Implementation', level: 1, estimated_pages: 2 },
        { id: 'S5', type: 'practice', title: 'Practice Problems', level: 1, estimated_pages: 2 },
        { id: 'S6', type: 'summary', title: 'Key Takeaways', level: 1, estimated_pages: 1 }
      ],
      references: ['Kutner et al. (2005). Applied Linear Statistical Models.'],
      estimated_total_pages: 12
    },
    metadata: { model: 'claude-3-5-sonnet', tokens: 500, inputTokens: 100 }
  };

  const createMockSectionResponse = (id, type, title) => ({
    success: true,
    content: {
      id,
      type,
      title,
      level: 1,
      estimated_pages: 2,
      content: `This is the content for section ${id} about ${title}.`,
      summary: `Summary of ${title}`,
      ...(SECTION_TYPES[type]?.hasCode ? {
        code: {
          language: 'r',
          source: '# Sample R code\nprint("Hello")',
          echo: true,
          eval: true
        }
      } : {}),
      ...(SECTION_TYPES[type]?.hasMath ? {
        math: 'Y = X\\beta + \\epsilon'
      } : {})
    },
    metadata: { model: 'claude-3-5-sonnet', tokens: 300, inputTokens: 150 }
  });

  describe('generateOutline', () => {
    it('should generate outline via AI provider', async () => {
      const mockAI = createMockAI({ outline: mockOutlineResponse });

      const outline = await generateOutline(defaultOptions, defaultTeachingStyle, null, mockAI);

      expect(outline.title).toBe('Introduction to Multiple Linear Regression');
      expect(outline.sections).toHaveLength(6);
      expect(outline.learning_objectives).toHaveLength(3);
    });

    it('should include topic in prompt', async () => {
      const mockAI = createMockAI({ outline: mockOutlineResponse });

      await generateOutline(defaultOptions, defaultTeachingStyle, null, mockAI);

      const calls = mockAI.getCalls();
      expect(calls[0].prompt).toContain('Multiple Linear Regression');
    });

    it('should use lesson plan objectives when provided', async () => {
      const mockAI = createMockAI({ outline: mockOutlineResponse });
      const lessonPlan = {
        learning_objectives: [
          'Custom objective 1',
          'Custom objective 2'
        ]
      };

      await generateOutline(defaultOptions, defaultTeachingStyle, lessonPlan, mockAI);

      const calls = mockAI.getCalls();
      expect(calls[0].prompt).toContain('Custom objective 1');
    });

    it('should return fallback outline when AI unavailable', async () => {
      const outline = await generateOutline(defaultOptions, defaultTeachingStyle, null, null);

      expect(outline.topic).toBe('Multiple Linear Regression');
      expect(outline.sections).toBeDefined();
      expect(outline.sections.length).toBeGreaterThan(0);
    });

    it('should return fallback when AI fails', async () => {
      const mockAI = createMockAI({
        outline: { success: false, error: 'API error' }
      });

      const outline = await generateOutline(defaultOptions, defaultTeachingStyle, null, mockAI);

      // Should get fallback outline
      expect(outline.topic).toBe('Multiple Linear Regression');
      expect(outline.sections.some(s => s.type === 'introduction')).toBe(true);
    });

    it('should handle malformed JSON response', async () => {
      const mockAI = createMockAI({
        outline: { success: true, content: 'not valid json' }
      });

      const outline = await generateOutline(defaultOptions, defaultTeachingStyle, null, mockAI);

      // Should get fallback outline
      expect(outline.sections).toBeDefined();
    });

    it('should augment outline with missing section types', async () => {
      const incompleteOutline = {
        success: true,
        content: {
          title: 'Test',
          topic: 'Test',
          sections: [
            { id: 'S1', type: 'introduction', title: 'Intro', level: 1, estimated_pages: 2 }
          ]
        }
      };

      const mockAI = createMockAI({ outline: incompleteOutline });
      const outline = await generateOutline(defaultOptions, defaultTeachingStyle, null, mockAI);

      // Should augment with required types
      const sectionTypes = outline.sections.map(s => s.type);
      expect(sectionTypes).toContain('introduction');
      expect(sectionTypes).toContain('concept');
      expect(sectionTypes).toContain('example');
      expect(sectionTypes).toContain('practice');
      expect(sectionTypes).toContain('summary');
    });
  });

  describe('generateSections', () => {
    const outline = {
      title: 'Test Lecture',
      learning_objectives: ['Objective 1', 'Objective 2'],
      sections: [
        { id: 'S1', type: 'introduction', title: 'Introduction', level: 1, estimated_pages: 2 },
        { id: 'S2', type: 'concept', title: 'Core Concept', level: 1, estimated_pages: 3 },
        { id: 'S3', type: 'example', title: 'Example', level: 1, estimated_pages: 2 }
      ]
    };

    it('should generate content for each section', async () => {
      const mockAI = createMockAI({
        sequence: [
          createMockSectionResponse('S1', 'introduction', 'Introduction'),
          createMockSectionResponse('S2', 'concept', 'Core Concept'),
          createMockSectionResponse('S3', 'example', 'Example')
        ]
      });

      const sections = await generateSections(outline, defaultOptions, defaultTeachingStyle, mockAI);

      expect(sections).toHaveLength(3);
      expect(sections[0].id).toBe('S1');
      expect(sections[1].id).toBe('S2');
      expect(sections[2].id).toBe('S3');
    });

    it('should report progress for each section', async () => {
      const mockAI = createMockAI({
        sequence: [
          createMockSectionResponse('S1', 'introduction', 'Introduction'),
          createMockSectionResponse('S2', 'concept', 'Core Concept'),
          createMockSectionResponse('S3', 'example', 'Example')
        ]
      });

      const progressCalls = [];
      await generateSections(outline, defaultOptions, defaultTeachingStyle, mockAI, (current, total, title) => {
        progressCalls.push({ current, total, title });
      });

      expect(progressCalls).toHaveLength(3);
      expect(progressCalls[0].current).toBe(1);
      expect(progressCalls[1].current).toBe(2);
      expect(progressCalls[2].current).toBe(3);
      expect(progressCalls.every(p => p.total === 3)).toBe(true);
    });

    it('should pass previous context to subsequent sections', async () => {
      const calls = [];
      const mockAI = {
        generate: async (prompt, _options) => {
          calls.push(prompt);
          const sectionId = prompt.match(/ID: (S\d+)/)?.[1] || 'S1';
          return createMockSectionResponse(sectionId, 'concept', 'Test');
        },
        getStats: () => ({ totalRequests: 3, totalTokens: 300 })
      };

      await generateSections(outline, defaultOptions, defaultTeachingStyle, mockAI);

      // First section should indicate it's the first
      expect(calls[0]).toContain('first section');

      // Second section should have context from first
      expect(calls[1]).toContain('Previous sections');

      // Third section should have context from first and second
      expect(calls[2]).toContain('Previous sections');
    });

    it('should return fallback content when AI unavailable', async () => {
      const sections = await generateSections(outline, defaultOptions, defaultTeachingStyle, null);

      expect(sections).toHaveLength(3);
      sections.forEach(section => {
        expect(section.content).toBeDefined();
      });
    });

    it('should handle subsections recursively', async () => {
      const outlineWithSubsections = {
        ...outline,
        sections: [
          {
            id: 'S1',
            type: 'concept',
            title: 'Main',
            level: 1,
            estimated_pages: 3,
            subsections: [
              { id: 'S1.1', type: 'definition', title: 'Def 1', level: 2, estimated_pages: 1 },
              { id: 'S1.2', type: 'definition', title: 'Def 2', level: 2, estimated_pages: 1 }
            ]
          }
        ]
      };

      const mockAI = createMockAI({
        sequence: [
          createMockSectionResponse('S1', 'concept', 'Main'),
          createMockSectionResponse('S1.1', 'definition', 'Def 1'),
          createMockSectionResponse('S1.2', 'definition', 'Def 2')
        ]
      });

      const sections = await generateSections(outlineWithSubsections, defaultOptions, defaultTeachingStyle, mockAI);

      expect(sections).toHaveLength(1);
      expect(sections[0].subsections).toHaveLength(2);
    });
  });

  describe('countSections', () => {
    it('should count flat sections', () => {
      const sections = [
        { id: 'S1', type: 'intro' },
        { id: 'S2', type: 'concept' },
        { id: 'S3', type: 'summary' }
      ];

      expect(countSections(sections)).toBe(3);
    });

    it('should count nested subsections', () => {
      const sections = [
        {
          id: 'S1',
          subsections: [
            { id: 'S1.1' },
            { id: 'S1.2', subsections: [{ id: 'S1.2.1' }] }
          ]
        },
        { id: 'S2' }
      ];

      expect(countSections(sections)).toBe(5);
    });

    it('should handle empty array', () => {
      expect(countSections([])).toBe(0);
    });
  });

  describe('getFallbackOutline', () => {
    it('should create outline with required sections', () => {
      const outline = getFallbackOutline(defaultOptions);

      expect(outline.topic).toBe('Multiple Linear Regression');
      expect(outline.sections.length).toBeGreaterThan(0);

      const types = outline.sections.map(s => s.type);
      expect(types).toContain('introduction');
      expect(types).toContain('concept');
      expect(types).toContain('example');
      expect(types).toContain('practice');
      expect(types).toContain('summary');
    });

    it('should use lesson plan objectives when provided', () => {
      const lessonPlan = {
        learning_objectives: ['Objective A', 'Objective B']
      };

      const outline = getFallbackOutline(defaultOptions, lessonPlan);

      expect(outline.learning_objectives).toContain('Objective A');
      expect(outline.learning_objectives).toContain('Objective B');
    });

    it('should generate default objectives when no lesson plan', () => {
      const outline = getFallbackOutline(defaultOptions);

      expect(outline.learning_objectives.length).toBeGreaterThan(0);
      expect(outline.learning_objectives[0]).toContain('Multiple Linear Regression');
    });
  });

  describe('getFallbackSectionContent', () => {
    it('should generate introduction content', () => {
      const section = getFallbackSectionContent(
        { id: 'S1', type: 'introduction', title: 'Intro', level: 1, estimated_pages: 2 },
        defaultOptions
      );

      expect(section.content).toContain('introduce');
      expect(section.content).toContain(defaultOptions.topic);
    });

    it('should generate concept content with math', () => {
      const section = getFallbackSectionContent(
        { id: 'S2', type: 'concept', title: 'Concept', level: 1, estimated_pages: 3 },
        defaultOptions
      );

      expect(section.content).toBeDefined();
      expect(section.math).toBeDefined();
    });

    it('should generate example content with code', () => {
      const section = getFallbackSectionContent(
        { id: 'S3', type: 'example', title: 'Example', level: 1, estimated_pages: 2 },
        defaultOptions
      );

      expect(section.code).toBeDefined();
      expect(section.code.language).toBe('r');
    });

    it('should generate Python code when language is python', () => {
      const section = getFallbackSectionContent(
        { id: 'S3', type: 'code', title: 'Code', level: 1, estimated_pages: 2 },
        { ...defaultOptions, language: 'python' }
      );

      expect(section.code.language).toBe('python');
      expect(section.code.source).toContain('def ');  // Python function definition
    });

    it('should generate practice problems', () => {
      const section = getFallbackSectionContent(
        { id: 'S5', type: 'practice', title: 'Practice', level: 1, estimated_pages: 2 },
        defaultOptions
      );

      expect(section.problems).toBeDefined();
      expect(section.problems.length).toBeGreaterThan(0);
      expect(section.problems[0].solution).toBeDefined();
    });

    it('should generate summary with bullets', () => {
      const section = getFallbackSectionContent(
        { id: 'S6', type: 'summary', title: 'Summary', level: 1, estimated_pages: 1 },
        defaultOptions
      );

      expect(section.bullets).toBeDefined();
      expect(section.bullets.length).toBeGreaterThan(0);
    });
  });

  describe('calculateMetadata', () => {
    it('should calculate section counts', () => {
      const lectureNotes = {
        sections: [
          { estimated_pages: 2 },
          { estimated_pages: 3, code: { source: '...' } },
          { estimated_pages: 2, math: 'x = y' }
        ]
      };

      const metadata = calculateMetadata(lectureNotes, 5000);

      expect(metadata.totalSections).toBe(3);
      expect(metadata.totalPages).toBe(7);
      expect(metadata.codeBlocks).toBe(1);
      expect(metadata.mathEquations).toBe(1);
    });

    it('should count practice problems', () => {
      const lectureNotes = {
        sections: [
          { estimated_pages: 2, problems: [{ id: 'P1' }, { id: 'P2' }] }
        ]
      };

      const metadata = calculateMetadata(lectureNotes, 3000);

      expect(metadata.practiceProblems).toBe(2);
    });

    it('should calculate generation time in seconds', () => {
      const metadata = calculateMetadata({ sections: [] }, 5500);

      expect(metadata.generationTime).toBe(6); // Rounded
    });

    it('should include AI stats', () => {
      const aiStats = {
        totalRequests: 10,
        totalTokens: 5000,
        successRate: 90,
        retriedRequests: 2
      };

      const metadata = calculateMetadata({ sections: [] }, 1000, aiStats);

      expect(metadata.apiCalls).toBe(10);
      expect(metadata.totalTokens).toBe(5000);
      expect(metadata.successRate).toBe(90);
      expect(metadata.retriedRequests).toBe(2);
    });

    it('should handle nested subsections', () => {
      const lectureNotes = {
        sections: [
          {
            estimated_pages: 2,
            subsections: [
              { estimated_pages: 1, code: { source: '...' } },
              { estimated_pages: 1 }
            ]
          }
        ]
      };

      const metadata = calculateMetadata(lectureNotes, 1000);

      expect(metadata.totalSections).toBe(3);
      expect(metadata.totalPages).toBe(4);
      expect(metadata.codeBlocks).toBe(1);
    });
  });

  describe('loadTeachingStyle', () => {
    it('should return default style when no config', () => {
      const style = loadTeachingStyle({}, {});

      // New 4-layer system defaults
      expect(style.tone).toBe('balanced');  // Default is balanced, not formal
      expect(style.pedagogical_approach).toBe('active-learning');
      expect(style.explanation_style).toBe('intuition-first');  // Default changed
    });

    it('should return prompt-friendly style format', () => {
      const style = loadTeachingStyle({}, {});

      // The 4-layer system returns a promptStyle object
      expect(style).toHaveProperty('tone');
      expect(style).toHaveProperty('pedagogical_approach');
      expect(style).toHaveProperty('explanation_style');
      expect(style).toHaveProperty('example_depth');
      expect(style).toHaveProperty('_full');  // Full style object for advanced use
    });
  });

  describe('SECTION_TYPES', () => {
    it('should define all expected section types', () => {
      const expectedTypes = [
        'introduction', 'concept', 'definition', 'theorem', 'proof',
        'example', 'code', 'practice', 'discussion', 'summary'
      ];

      expectedTypes.forEach(type => {
        expect(SECTION_TYPES[type]).toBeDefined();
      });
    });

    it('should have page constraints for each type', () => {
      Object.entries(SECTION_TYPES).forEach(([_type, config]) => {
        expect(config.minPages).toBeDefined();
        expect(config.maxPages).toBeDefined();
        expect(config.minPages).toBeLessThanOrEqual(config.maxPages);
      });
    });

    it('should mark code-having sections correctly', () => {
      expect(SECTION_TYPES.code.hasCode).toBe(true);
      expect(SECTION_TYPES.example.hasCode).toBe(true);
      expect(SECTION_TYPES.introduction.hasCode).toBe(false);
    });

    it('should mark math-having sections correctly', () => {
      expect(SECTION_TYPES.theorem.hasMath).toBe(true);
      expect(SECTION_TYPES.proof.hasMath).toBe(true);
      expect(SECTION_TYPES.definition.hasMath).toBe(true);
      expect(SECTION_TYPES.code.hasMath).toBe(false);
    });
  });
});
