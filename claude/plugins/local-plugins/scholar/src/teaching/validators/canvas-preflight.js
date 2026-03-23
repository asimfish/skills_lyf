/**
 * Canvas Pre-flight Validation
 *
 * Validates exam questions for Canvas LMS import compatibility.
 * Used by both /teaching:canvas (QMD-parsed data) and
 * /teaching:exam --format canvas (AI-generated JSON data).
 *
 * Both sources use hyphen-separated type names and store correct
 * answers in an answer_key object keyed by question ID.
 *
 * @module teaching/validators/canvas-preflight
 */

/**
 * Validate exam questions for Canvas import compatibility.
 *
 * @param {Array} questions - Array of question objects with `id`, `type`, and optionally `blanks`
 * @param {Object} answerKey - Map of question ID → answer (string, array, or object for FMB)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function runCanvasPreflightValidation(questions, answerKey) {
  const errors = [];
  const warnings = [];

  for (const q of questions) {
    const answer = answerKey[q.id];

    switch (q.type) {
      case 'multiple-choice':
      case 'true-false': {
        if (!answer) {
          const label = q.type === 'multiple-choice' ? 'MC' : 'TF';
          errors.push(`${q.id} [${label}]: no correct answer marked`);
        }
        break;
      }

      case 'multiple-answers': {
        const answers = Array.isArray(answer) ? answer : (answer ? [answer] : []);
        if (answers.length < 2) {
          errors.push(`${q.id} [MA]: ${answers.length} correct answer(s) — Canvas requires 2+`);
        }
        break;
      }

      case 'short-answer':
      case 'fill-in-blank': {
        if (!answer) {
          warnings.push(`${q.id} [Short]: no sample answer — will be manually graded in Canvas`);
        }
        break;
      }

      case 'fill-in-multiple-blanks': {
        const blankAnswers = (answer && typeof answer === 'object') ? answer : {};
        const undefinedBlanks = (q.blanks || []).filter(b => !blankAnswers[b.blankId]);
        if (undefinedBlanks.length > 0) {
          errors.push(`${q.id} [FMB]: blank(s) ${undefinedBlanks.map(b => b.blankId).join(', ')} have no answers`);
        }
        break;
      }
    }
  }

  return { errors, warnings };
}
