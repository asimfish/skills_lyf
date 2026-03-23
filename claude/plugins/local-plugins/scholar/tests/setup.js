/**
 * Jest Global Setup
 *
 * Mocks global fetch to prevent real API calls during tests.
 * Tests that call generateAssignment/generateSyllabus etc. will
 * fail fast with authentication errors instead of timing out.
 */

const originalFetch = global.fetch;

// Mock fetch for Anthropic API calls
global.fetch = async (url, options = {}) => {
  // Check if this is an Anthropic API call
  if (url && url.includes('api.anthropic.com')) {
    // Check for test API key
    const apiKey = options?.headers?.['x-api-key'];

    if (!apiKey || apiKey === 'test-api-key' || apiKey.startsWith('test-')) {
      // Return immediate authentication error for test API keys
      return {
        ok: false,
        status: 401,
        text: async () => JSON.stringify({
          type: 'error',
          error: {
            type: 'authentication_error',
            message: 'Invalid API key (test environment)'
          }
        }),
        json: async () => ({
          type: 'error',
          error: {
            type: 'authentication_error',
            message: 'Invalid API key (test environment)'
          }
        })
      };
    }
  }

  // Pass through other requests to real fetch
  return originalFetch(url, options);
};

// Restore original fetch after all tests
afterAll(() => {
  global.fetch = originalFetch;
});
