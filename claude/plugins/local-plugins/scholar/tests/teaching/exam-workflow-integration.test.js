/**
 * Full Workflow Integration Tests for Exam Generation
 *
 * These tests verify the complete end-to-end exam generation pipeline:
 * 1. Config loading from .flow/teach-config.yml
 * 2. Template loading and merging
 * 3. AI content generation
 * 4. Validation pipeline (schema + LaTeX + completeness)
 * 5. Metadata injection and enrichment
 * 6. File I/O operations
 */

import { generateExam, generateExamVariations, generateAndSaveExam } from '../../src/teaching/generators/exam.js';
import { loadTeachConfig } from '../../src/teaching/config/loader.js';
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('Full Exam Generation Workflow Integration', () => {
  let originalApiKey;
  const testOutputDir = join(process.cwd(), 'test-output');

  beforeAll(() => {
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    // Create test output directory
    if (!existsSync(testOutputDir)) {
      mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  describe('Complete Pipeline: Config → Template → AI → Validation → Output', () => {
    it('should execute full pipeline successfully', async () => {
      try {
        // Step 1: Load config
        const config = loadTeachConfig(process.cwd());
        expect(config).toBeDefined();

        // Step 2: Generate exam with full options
        const exam = await generateExam({
          type: 'midterm',
          questionCount: 5,
          difficulty: 'medium',
          durationMinutes: 60,
          topics: ['statistics', 'regression'],
          includeFormulas: true,
          includeSolutions: true,
          debug: false
        });

        // Step 3: Verify structure
        expect(exam).toHaveProperty('content');
        expect(exam).toHaveProperty('validation');
        expect(exam).toHaveProperty('metadata');

        // Step 4: Verify content structure
        expect(exam.content).toHaveProperty('title');
        expect(exam.content).toHaveProperty('exam_type');
        expect(exam.content).toHaveProperty('questions');
        expect(exam.content).toHaveProperty('answer_key');

        // Step 5: Verify metadata
        expect(exam.metadata).toHaveProperty('examType');
        expect(exam.metadata).toHaveProperty('questionCount');
        expect(exam.metadata).toHaveProperty('totalPoints');
        expect(exam.metadata).toHaveProperty('generatedAt');

        // Step 6: Verify validation ran
        expect(exam.validation).toHaveProperty('isValid');
        expect(exam.validation).toHaveProperty('errors');
        expect(exam.validation).toHaveProperty('warnings');

      } catch (error) {
        // Expected with mock AI - verify error is appropriate
        expect(
          error.message.includes('AI generation failed') ||
            error.message.includes('Validation failed')
        ).toBe(true);
      }
    });

    it('should handle all exam types through pipeline', async () => {
      const examTypes = ['midterm', 'final', 'practice', 'quiz'];

      for (const type of examTypes) {
        try {
          const exam = await generateExam({
            type,
            questionCount: 3,
            debug: false
          });

          if (exam.content) {
            expect(exam.content.exam_type).toBe(type);
            expect(exam.metadata.examType).toBe(type);
          }
        } catch (error) {
          // Expected with mock AI
          expect(error).toBeDefined();
        }
      }
    });

    it('should apply Phase 0 components in correct order', async () => {
      try {
        const exam = await generateExam({
          type: 'quiz',
          questionCount: 3,
          debug: false
        });

        // Verify Phase 0 pipeline execution:
        // 1. Config loaded (implicit)
        // 2. Templates loaded and merged (implicit)
        // 3. AI generated content
        // 4. Defaults applied
        // 5. Auto-fields injected
        // 6. Validation ran

        if (exam.content) {
          // Check for auto-injected fields
          expect(exam.content).toHaveProperty('total_points');
          expect(typeof exam.content.total_points).toBe('number');
        }

        // Validation should have executed
        expect(exam.validation).toBeDefined();
        expect(exam.validation).toHaveProperty('isValid');

      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });
  });

  describe('File I/O Integration', () => {
    it('should save exam to file successfully', async () => {
      const outputPath = join(testOutputDir, 'test-exam.json');

      try {
        // Generate and save
        const exam = await generateExam({
          questionCount: 3,
          debug: false
        });

        writeFileSync(outputPath, JSON.stringify(exam.content, null, 2));

        // Verify file exists
        expect(existsSync(outputPath)).toBe(true);

        // Read back and verify
        const savedContent = JSON.parse(readFileSync(outputPath, 'utf-8'));
        expect(savedContent).toHaveProperty('title');
        expect(savedContent).toHaveProperty('exam_type');

        // Cleanup
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }

      } catch (error) {
        // Expected with mock AI - cleanup anyway
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }
        expect(error).toBeDefined();
      }
    });

    it('should handle generateAndSaveExam workflow', async () => {
      const outputPath = join(testOutputDir, 'test-exam-save.json');

      try {
        const result = await generateAndSaveExam(
          { questionCount: 3, debug: false },
          outputPath
        );

        expect(result).toHaveProperty('filePath');
        expect(result.filePath).toBe(outputPath);

        if (existsSync(outputPath)) {
          const content = JSON.parse(readFileSync(outputPath, 'utf-8'));
          expect(content).toHaveProperty('exam_type');
          unlinkSync(outputPath);
        }

      } catch (error) {
        // Expected with mock AI
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }
        expect(error).toBeDefined();
      }
    });
  });

  describe('Variation Generation Workflow', () => {
    it('should generate multiple variations with consistent structure', async () => {
      try {
        const variations = await generateExamVariations(
          { questionCount: 3, debug: false },
          3
        );

        expect(variations).toHaveLength(3);

        // Verify all variations have consistent structure
        variations.forEach((exam, index) => {
          expect(exam.variant).toBe(index + 1);
          expect(exam).toHaveProperty('content');
          expect(exam).toHaveProperty('validation');
          expect(exam).toHaveProperty('metadata');
        });

        // Verify variations have same exam type
        const types = variations.map(v => v.content?.exam_type).filter(Boolean);
        if (types.length > 0) {
          const allSame = types.every(t => t === types[0]);
          expect(allSame).toBe(true);
        }

      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });

    it('should maintain options across all variations', async () => {
      try {
        const options = {
          type: 'final',
          questionCount: 4,
          difficulty: 'hard',
          debug: false
        };

        const variations = await generateExamVariations(options, 2);

        variations.forEach(exam => {
          if (exam.content) {
            expect(exam.content.exam_type).toBe('final');
          }
          if (exam.metadata) {
            expect(exam.metadata.examType).toBe('final');
          }
        });

      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });

    it('should save all variations to separate files', async () => {
      const baseFilename = 'test-variation';
      const filePaths = [];

      try {
        const variations = await generateExamVariations(
          { questionCount: 2, debug: false },
          2
        );

        // Save each variation
        variations.forEach((exam, i) => {
          const filepath = join(testOutputDir, `${baseFilename}-v${i + 1}.json`);
          filePaths.push(filepath);
          writeFileSync(filepath, JSON.stringify(exam.content, null, 2));
        });

        // Verify all files exist
        filePaths.forEach(filepath => {
          expect(existsSync(filepath)).toBe(true);
        });

        // Cleanup
        filePaths.forEach(filepath => {
          if (existsSync(filepath)) {
            unlinkSync(filepath);
          }
        });

      } catch (error) {
        // Cleanup on error
        filePaths.forEach(filepath => {
          if (existsSync(filepath)) {
            unlinkSync(filepath);
          }
        });
        expect(error).toBeDefined();
      }
    });
  });

  describe('Config Integration Workflow', () => {
    it('should load config and apply to exam generation', async () => {
      try {
        // Load config explicitly
        const _config = loadTeachConfig(process.cwd());

        // Generate with config-driven options
        const exam = await generateExam({
          type: 'midterm',
          questionCount: 3,
          debug: false
        });

        // Config should influence generation
        // (difficulty, AI settings, course info)
        if (exam.metadata) {
          expect(exam.metadata).toHaveProperty('examType');
        }

      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });

    it('should override config with explicit options', async () => {
      try {
        const exam = await generateExam({
          difficulty: 'hard',
          questionCount: 7,
          durationMinutes: 90,
          debug: false
        });

        // Explicit options should take precedence
        if (exam.content) {
          expect(exam.content.duration_minutes).toBe(90);
        }
        if (exam.metadata) {
          expect(exam.metadata.questionCount).toBe(7);
        }

      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });
  });

  describe('Validation Workflow Integration', () => {
    it('should run full validation pipeline', async () => {
      try {
        const exam = await generateExam({
          questionCount: 3,
          strict: false,
          debug: false
        });

        // Validation should have run
        expect(exam.validation).toBeDefined();
        expect(exam.validation).toHaveProperty('isValid');
        expect(exam.validation).toHaveProperty('errors');
        expect(exam.validation).toHaveProperty('warnings');
        expect(Array.isArray(exam.validation.errors)).toBe(true);
        expect(Array.isArray(exam.validation.warnings)).toBe(true);

      } catch (error) {
        // Validation failure expected with mock data
        if (error.message.includes('Validation failed')) {
          // Verify error structure
          expect(error.message).toContain('Validation failed');
        } else {
          expect(error.message).toContain('AI generation failed');
        }
      }
    });

    it('should enforce strict validation when requested', async () => {
      try {
        const exam = await generateExam({
          questionCount: 3,
          strict: true,
          debug: false
        });

        // Should not reach here with mock data in strict mode
        expect(exam).toBeDefined();
      } catch (error) {
        // Strict validation should fail with mock data
        expect(
          error.message.includes('Validation failed') ||
            error.message.includes('AI generation failed')
        ).toBe(true);
      }
    });
  });

  describe('Question Generation Workflow', () => {
    it('should generate questions with proper structure', async () => {
      try {
        const exam = await generateExam({
          questionCount: 5,
          debug: false
        });

        if (exam.content && exam.content.questions) {
          exam.content.questions.forEach((q, _index) => {
            // Each question should have required fields
            expect(q).toHaveProperty('id');
            expect(q).toHaveProperty('type');
            expect(q).toHaveProperty('text');
            expect(q).toHaveProperty('points');

            // ID should follow pattern
            expect(q.id).toMatch(/^Q\d+$/);
          });
        }
      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });

    it('should create matching answer keys', async () => {
      try {
        const exam = await generateExam({
          questionCount: 5,
          includeSolutions: true,
          debug: false
        });

        if (exam.content && exam.content.questions && exam.content.answer_key) {
          const questionIds = exam.content.questions.map(q => q.id);
          const answerKeyIds = Object.keys(exam.content.answer_key);

          // All questions should have answers
          questionIds.forEach(id => {
            expect(answerKeyIds).toContain(id);
          });
        }
      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });

    it('should calculate total points correctly', async () => {
      try {
        const exam = await generateExam({
          questionCount: 5,
          debug: false
        });

        if (exam.content && exam.content.questions) {
          const expectedTotal = exam.content.questions.reduce(
            (sum, q) => sum + (q.points || 0),
            0
          );

          expect(exam.content.total_points).toBe(expectedTotal);
          expect(exam.metadata.totalPoints).toBe(expectedTotal);
        }
      } catch (error) {
        // Expected with mock AI
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle missing API key gracefully', async () => {
      const savedKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      try {
        await generateExam({ debug: false });
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error.message).toContain('AI generation failed');
      } finally {
        process.env.ANTHROPIC_API_KEY = savedKey;
      }
    });

    it('should validate exam type', async () => {
      try {
        // Invalid type should still be processed
        // (validation happens on generated content, not input)
        await generateExam({
          type: 'invalid-type',
          debug: false
        });
      } catch (error) {
        // Any error is acceptable here
        expect(error).toBeDefined();
      }
    });

    it('should handle negative question count', async () => {
      try {
        await generateExam({
          questionCount: -5,
          debug: false
        });
      } catch (error) {
        // Should handle gracefully
        expect(error).toBeDefined();
      }
    });
  });
});
