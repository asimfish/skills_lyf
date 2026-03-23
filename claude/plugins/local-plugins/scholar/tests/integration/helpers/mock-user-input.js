/**
 * Mock User Input Helper
 *
 * Simulates user input for interactive mode testing
 */

/**
 * Create a mock stdin that provides predefined inputs
 * @param {Array<string>} inputs - Array of user inputs
 * @returns {Object} Mock stdin object
 */
export function createMockStdin(inputs) {
  let inputIndex = 0;

  return {
    inputs,
    inputIndex,

    read() {
      if (inputIndex < inputs.length) {
        return inputs[inputIndex++];
      }
      return null;
    },

    hasMoreInputs() {
      return inputIndex < inputs.length;
    },

    reset() {
      inputIndex = 0;
    },
  };
}

/**
 * Mock user responses for confirmation prompts
 * @param {Object} responses - Map of prompt text to user response
 * @returns {Function} Mock prompt function
 */
export function createMockPrompt(responses = {}) {
  return async function mockPrompt(question) {
    // Look for matching response
    for (const [key, value] of Object.entries(responses)) {
      if (question.includes(key)) {
        return value;
      }
    }

    // Default response
    return 'y';
  };
}

/**
 * Create a sequence of user inputs for testing
 * @param {Array<Object>} sequence - Array of {prompt, response} pairs
 * @returns {Object} Input sequence handler
 */
export function createInputSequence(sequence) {
  let currentIndex = 0;

  return {
    sequence,
    currentIndex,

    getNextResponse(prompt) {
      if (currentIndex >= sequence.length) {
        throw new Error(`Unexpected prompt: ${prompt}`);
      }

      const expected = sequence[currentIndex];
      if (!prompt.includes(expected.prompt)) {
        throw new Error(
          `Expected prompt containing "${expected.prompt}", got: ${prompt}`
        );
      }

      currentIndex++;
      return expected.response;
    },

    isComplete() {
      return currentIndex === sequence.length;
    },

    reset() {
      currentIndex = 0;
    },
  };
}

/**
 * Simulate interactive fix workflow
 * @param {Array<Object>} fixes - Array of fix objects
 * @param {Array<string>} userResponses - User responses (y/n/skip)
 * @returns {Object} Simulation result
 */
export function simulateInteractiveFixing(fixes, userResponses) {
  const results = {
    applied: [],
    skipped: [],
    declined: [],
  };

  fixes.forEach((fix, i) => {
    const response = userResponses[i] || 'n';

    if (response === 'y' || response === 'yes') {
      results.applied.push(fix);
    } else if (response === 'skip' || response === 's') {
      results.skipped.push(fix);
    } else {
      results.declined.push(fix);
    }
  });

  return results;
}
