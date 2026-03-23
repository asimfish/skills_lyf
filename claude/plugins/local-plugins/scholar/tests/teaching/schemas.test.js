/**
 * Unit Tests for JSON Schemas
 *
 * Tests schema structure and validation using ajv.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  getLessonPlanSchema,
  getTeachingStyleSchema,
  getSchema,
  listSchemas
} from '../../src/teaching/schemas/v2/index.js';

describe('Schema Index', () => {
  describe('listSchemas', () => {
    it('should return available schema names', () => {
      const schemas = listSchemas();

      expect(schemas).toContain('lesson-plan');
      expect(schemas).toContain('teaching-style');
    });
  });

  describe('getSchema', () => {
    it('should return lesson-plan schema', () => {
      const schema = getSchema('lesson-plan');

      expect(schema).toBeDefined();
      expect(schema.title).toContain('Lesson Plan');
    });

    it('should return teaching-style schema', () => {
      const schema = getSchema('teaching-style');

      expect(schema).toBeDefined();
      expect(schema.title).toContain('Teaching Style');
    });

    it('should throw for unknown schema', () => {
      expect(() => getSchema('unknown')).toThrow(/Unknown schema/);
    });
  });

  describe('schema isolation', () => {
    it('should return deep copies to prevent cross-test pollution', () => {
      const schema1 = getLessonPlanSchema();
      const schema2 = getLessonPlanSchema();

      // Should be equal content but different instances
      expect(schema1).toStrictEqual(schema2);
      expect(schema1).not.toBe(schema2);
    });

    it('should allow independent mutation of schemas', () => {
      const schema1 = getLessonPlanSchema();
      const schema2 = getLessonPlanSchema();

      // Mutate schema1
      schema1.customField = 'test';

      // schema2 should not be affected
      expect(schema1.customField).toBe('test');
      expect(schema2.customField).toBeUndefined();
    });
  });
});

describe('Lesson Plan Schema', () => {
  let ajv;
  let validate;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    validate = ajv.compile(getLessonPlanSchema());
  });

  describe('required fields', () => {
    it('should require week, title, learning_objectives, topics', () => {
      const valid = validate({});

      expect(valid).toBe(false);
      const missingFields = validate.errors
        .filter(e => e.keyword === 'required')
        .map(e => e.params.missingProperty);

      expect(missingFields).toContain('week');
      expect(missingFields).toContain('title');
      expect(missingFields).toContain('learning_objectives');
      expect(missingFields).toContain('topics');
    });
  });

  describe('week field', () => {
    const minimalPlan = (overrides = {}) => ({
      week: 1,
      title: 'Test',
      learning_objectives: [{ id: 'LO-1.1', level: 'understand', description: 'Test objective description' }],
      topics: [{ id: 'T-1.1', name: 'Test topic' }],
      ...overrides
    });

    it('should accept valid week numbers', () => {
      expect(validate(minimalPlan({ week: 1 }))).toBe(true);
      expect(validate(minimalPlan({ week: 16 }))).toBe(true);
      expect(validate(minimalPlan({ week: 52 }))).toBe(true);
    });

    it('should reject week < 1', () => {
      expect(validate(minimalPlan({ week: 0 }))).toBe(false);
    });

    it('should reject week > 52', () => {
      expect(validate(minimalPlan({ week: 53 }))).toBe(false);
    });
  });

  describe('learning_objectives field', () => {
    const basePlan = {
      week: 1,
      title: 'Test',
      topics: [{ id: 'T-1.1', name: 'Test topic' }]
    };

    it('should require at least one objective', () => {
      const plan = { ...basePlan, learning_objectives: [] };
      expect(validate(plan)).toBe(false);
    });

    it('should validate objective ID pattern', () => {
      const plan = {
        ...basePlan,
        learning_objectives: [
          { id: 'INVALID', level: 'understand', description: 'Test objective description' }
        ]
      };
      expect(validate(plan)).toBe(false);
    });

    it('should accept valid ID pattern (LO-X.Y)', () => {
      const plan = {
        ...basePlan,
        learning_objectives: [
          { id: 'LO-1.1', level: 'understand', description: 'Test objective description' }
        ]
      };
      expect(validate(plan)).toBe(true);
    });

    it('should validate Bloom taxonomy levels', () => {
      const validLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

      validLevels.forEach(level => {
        const plan = {
          ...basePlan,
          learning_objectives: [
            { id: 'LO-1.1', level, description: 'Test objective' }
          ]
        };
        expect(validate(plan)).toBe(true);
      });
    });

    it('should reject invalid Bloom level', () => {
      const plan = {
        ...basePlan,
        learning_objectives: [
          { id: 'LO-1.1', level: 'invalid-level', description: 'Test objective description' }
        ]
      };
      expect(validate(plan)).toBe(false);
    });

    it('should require description with minimum length', () => {
      const plan = {
        ...basePlan,
        learning_objectives: [
          { id: 'LO-1.1', level: 'understand', description: 'Short' }  // Less than 10 chars
        ]
      };
      expect(validate(plan)).toBe(false);
    });
  });

  describe('topics field', () => {
    const basePlan = {
      week: 1,
      title: 'Test',
      learning_objectives: [{ id: 'LO-1.1', level: 'understand', description: 'Test objective description' }]
    };

    it('should require at least one topic', () => {
      const plan = { ...basePlan, topics: [] };
      expect(validate(plan)).toBe(false);
    });

    it('should validate topic ID pattern', () => {
      const plan = {
        ...basePlan,
        topics: [{ id: 'INVALID', name: 'Test' }]
      };
      expect(validate(plan)).toBe(false);
    });

    it('should accept valid topic ID pattern (T-X.Y)', () => {
      const plan = {
        ...basePlan,
        topics: [{ id: 'T-1.1', name: 'Test topic' }]
      };
      expect(validate(plan)).toBe(true);
    });

    it('should validate prerequisite references', () => {
      const plan = {
        ...basePlan,
        topics: [{
          id: 'T-1.1',
          name: 'Test',
          prerequisites: ['T-0.1', 'T-0.2']
        }]
      };
      expect(validate(plan)).toBe(true);
    });

    it('should reject invalid prerequisite format', () => {
      const plan = {
        ...basePlan,
        topics: [{
          id: 'T-1.1',
          name: 'Test',
          prerequisites: ['invalid']
        }]
      };
      expect(validate(plan)).toBe(false);
    });
  });

  describe('activities field', () => {
    const minimalPlan = {
      week: 1,
      title: 'Test',
      learning_objectives: [{ id: 'LO-1.1', level: 'understand', description: 'Test objective' }],
      topics: [{ id: 'T-1.1', name: 'Test' }]
    };

    it('should validate activity types', () => {
      const validTypes = [
        'in-class-practice', 'group-discussion', 'individual-exercise',
        'lab-activity', 'peer-review', 'presentation', 'think-pair-share', 'demonstration'
      ];

      validTypes.forEach(type => {
        const plan = {
          ...minimalPlan,
          activities: [{ id: 'A-1.1', type, title: 'Test activity' }]
        };
        expect(validate(plan)).toBe(true);
      });
    });

    it('should reject invalid activity type', () => {
      const plan = {
        ...minimalPlan,
        activities: [{ id: 'A-1.1', type: 'invalid', title: 'Test' }]
      };
      expect(validate(plan)).toBe(false);
    });

    it('should validate duration range', () => {
      const plan = {
        ...minimalPlan,
        activities: [{ id: 'A-1.1', type: 'in-class-practice', title: 'Test', duration_minutes: 30 }]
      };
      expect(validate(plan)).toBe(true);
    });

    it('should reject duration < 5 minutes', () => {
      const plan = {
        ...minimalPlan,
        activities: [{ id: 'A-1.1', type: 'in-class-practice', title: 'Test', duration_minutes: 2 }]
      };
      expect(validate(plan)).toBe(false);
    });
  });

  describe('materials field', () => {
    const minimalPlan = {
      week: 1,
      title: 'Test',
      learning_objectives: [{ id: 'LO-1.1', level: 'understand', description: 'Test objective' }],
      topics: [{ id: 'T-1.1', name: 'Test' }]
    };

    it('should validate reading types', () => {
      const plan = {
        ...minimalPlan,
        materials: {
          readings: [{ type: 'textbook', title: 'Book Title' }]
        }
      };
      expect(validate(plan)).toBe(true);
    });

    it('should validate DOI format', () => {
      const plan = {
        ...minimalPlan,
        materials: {
          readings: [{
            type: 'article',
            title: 'Article',
            doi: '10.1234/example.2024'
          }]
        }
      };
      expect(validate(plan)).toBe(true);
    });

    it('should validate datasets', () => {
      const plan = {
        ...minimalPlan,
        materials: {
          datasets: [{ name: 'test-data', file: 'datasets/test.csv' }]
        }
      };
      expect(validate(plan)).toBe(true);
    });
  });

  describe('date_range field', () => {
    const minimalPlan = {
      week: 1,
      title: 'Test',
      learning_objectives: [{ id: 'LO-1.1', level: 'understand', description: 'Test objective' }],
      topics: [{ id: 'T-1.1', name: 'Test' }]
    };

    it('should accept valid date format', () => {
      const plan = {
        ...minimalPlan,
        date_range: {
          start: '2026-01-15',
          end: '2026-01-19'
        }
      };
      expect(validate(plan)).toBe(true);
    });

    it('should reject invalid date format', () => {
      const plan = {
        ...minimalPlan,
        date_range: {
          start: '01/15/2026',
          end: '01/19/2026'
        }
      };
      expect(validate(plan)).toBe(false);
    });
  });
});

describe('Teaching Style Schema', () => {
  let ajv;
  let validate;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    validate = ajv.compile(getTeachingStyleSchema());
  });

  describe('pedagogical_approach', () => {
    it('should accept valid primary approaches', () => {
      const validApproaches = ['active-learning', 'lecture', 'flipped', 'socratic', 'inquiry-based', 'project-based'];

      validApproaches.forEach(approach => {
        const style = {
          teaching_style: {
            pedagogical_approach: { primary: approach }
          }
        };
        expect(validate(style)).toBe(true);
      });
    });

    it('should reject invalid approach', () => {
      const style = {
        teaching_style: {
          pedagogical_approach: { primary: 'invalid' }
        }
      };
      expect(validate(style)).toBe(false);
    });
  });

  describe('explanation_style', () => {
    it('should accept valid formality levels', () => {
      const style = {
        teaching_style: {
          explanation_style: { formality: 'balanced' }
        }
      };
      expect(validate(style)).toBe(true);
    });

    it('should accept valid proof styles', () => {
      const validStyles = ['proof-first', 'intuition-first', 'both-parallel'];

      validStyles.forEach(proofStyle => {
        const style = {
          teaching_style: {
            explanation_style: { proof_style: proofStyle }
          }
        };
        expect(validate(style)).toBe(true);
      });
    });

    it('should accept valid example depths', () => {
      const validDepths = ['single-detailed', 'multiple-varied', 'minimal'];

      validDepths.forEach(depth => {
        const style = {
          teaching_style: {
            explanation_style: { example_depth: depth }
          }
        };
        expect(validate(style)).toBe(true);
      });
    });
  });

  describe('assessment_philosophy', () => {
    it('should accept valid focus types', () => {
      const validFocus = ['formative', 'summative', 'balanced'];

      validFocus.forEach(focus => {
        const style = {
          teaching_style: {
            assessment_philosophy: { primary_focus: focus }
          }
        };
        expect(validate(style)).toBe(true);
      });
    });

    it('should accept boolean partial_credit', () => {
      const style = {
        teaching_style: {
          assessment_philosophy: { partial_credit: true }
        }
      };
      expect(validate(style)).toBe(true);
    });
  });

  describe('command_overrides', () => {
    it('should accept exam overrides', () => {
      const style = {
        teaching_style: {
          command_overrides: {
            exam: {
              formality: 'formal',
              time_pressure: 'strict'
            }
          }
        }
      };
      expect(validate(style)).toBe(true);
    });

    it('should accept quiz overrides', () => {
      const style = {
        teaching_style: {
          command_overrides: {
            quiz: {
              difficulty_adjustment: 'easier'
            }
          }
        }
      };
      expect(validate(style)).toBe(true);
    });

    it('should accept lecture overrides', () => {
      const style = {
        teaching_style: {
          command_overrides: {
            lecture: {
              proof_style: 'intuition-first'
            }
          }
        }
      };
      expect(validate(style)).toBe(true);
    });
  });

  describe('complete example', () => {
    it('should validate complete teaching style', () => {
      const completeStyle = {
        teaching_style: {
          pedagogical_approach: {
            primary: 'active-learning',
            secondary: 'socratic',
            class_structure: [
              '5-min review',
              '15-min lecture',
              '30-min practice',
              '10-min discussion'
            ]
          },
          explanation_style: {
            formality: 'balanced',
            proof_style: 'intuition-first',
            notation_preference: 'standard',
            example_depth: 'multiple-varied',
            analogies: 'frequent'
          },
          assessment_philosophy: {
            primary_focus: 'formative',
            feedback_style: 'descriptive',
            revision_policy: 'encouraged',
            partial_credit: true
          },
          student_interaction: {
            questioning: 'socratic',
            group_work: 'structured',
            discussion_format: 'whole-class'
          },
          content_preferences: {
            real_world_examples: 'frequent',
            historical_context: 'moderate',
            computational_tools: 'R-heavy',
            interdisciplinary_connections: 'statistics-economics'
          }
        }
      };

      expect(validate(completeStyle)).toBe(true);
    });
  });
});
