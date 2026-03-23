/**
 * Shared test helpers for slide-related tests.
 *
 * Used by:
 *   - slide-refiner-auto.test.js
 *   - slide-coverage.test.js
 */

/**
 * Build a single slide object for testing.
 * @param {Object} overrides - Fields to override
 * @returns {Object} Slide object
 */
export function makeSlide(overrides = {}) {
  return {
    number: 1,
    type: 'content',
    title: 'Test Slide',
    sectionTitle: 'Test Section',
    startLine: 0,
    endLine: 10,
    content: '## Test Slide\nContent here',
    body: 'Content here',
    classes: [],
    hasCode: false,
    hasMath: false,
    headingId: '',
    ...overrides,
  };
}

/**
 * Build a mock slides array from compact specs.
 * Each spec can override any slide field.
 * @param {Array<Object>} specs - Array of field overrides
 * @returns {Array<Object>} Array of slide objects
 */
export function makeMockSlides(specs) {
  return specs.map((spec, i) => ({
    number: spec.number ?? (i + 1),
    type: spec.type || 'content',
    title: spec.title || `Slide ${i + 1}`,
    sectionTitle: spec.section || 'Main',
    content: spec.content || '',
    body: spec.body || '',
    classes: spec.classes || [],
    hasCode: spec.hasCode || false,
    hasMath: spec.hasMath || false,
    startLine: 0,
    endLine: 10,
    headingId: ''
  }));
}

/**
 * Generate a line-heavy body for density tests.
 * @param {number} count - Number of lines to generate
 * @returns {string} Multi-line content string
 */
export function makeLines(count) {
  return Array.from({ length: count }, (_, i) => `Line ${i + 1} of content.`).join('\n');
}

/**
 * Build a minimal lesson plan with learning objectives.
 * @param {Array<string|Object>} objectives - Objectives (strings or objects)
 * @param {string} [title] - Plan title
 * @returns {Object} Lesson plan object
 */
export function makeMockPlan(objectives, title) {
  return {
    title: title || 'Mock Lesson Plan',
    week: 3,
    learning_objectives: objectives.map(o =>
      typeof o === 'string' ? o : o
    )
  };
}
