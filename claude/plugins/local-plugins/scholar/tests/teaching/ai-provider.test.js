/**
 * Unit tests for AI Provider
 */

import {
  AIProvider,
  createProvider,
  generate,
} from '../../src/teaching/ai/provider.js';

describe('AI Provider', () => {
  describe('AIProvider class', () => {
    it('should create provider with default options', () => {
      const provider = new AIProvider();
      expect(provider.model).toBe('claude-3-5-sonnet-20241022');
      expect(provider.maxRetries).toBe(3);
      expect(provider.timeout).toBe(30000);
      expect(provider.maxTokens).toBe(4096);
      expect(provider.debug).toBe(false);
    });

    it('should create provider with custom options', () => {
      const provider = new AIProvider({
        model: 'claude-opus-4',
        maxRetries: 5,
        timeout: 60000,
        maxTokens: 8192,
        debug: true,
      });

      expect(provider.model).toBe('claude-opus-4');
      expect(provider.maxRetries).toBe(5);
      expect(provider.timeout).toBe(60000);
      expect(provider.maxTokens).toBe(8192);
      expect(provider.debug).toBe(true);
    });

    it('should initialize statistics', () => {
      const provider = new AIProvider();
      const stats = provider.getStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.retriedRequests).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });

    it('should use environment variable for API key', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'test-key-from-env';

      const provider = new AIProvider();
      expect(provider.apiKey).toBe('test-key-from-env');

      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should prefer provided API key over environment', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'env-key';

      const provider = new AIProvider({ apiKey: 'provided-key' });
      expect(provider.apiKey).toBe('provided-key');

      process.env.ANTHROPIC_API_KEY = originalKey;
    });
  });

  describe('generate', () => {
    // Helper to create a mock makeRequest function
    const createMockMakeRequest = (response = {}) => {
      return async () => ({
        content: { test: true, ...response.content },
        metadata: { model: 'test', tokens: 100, ...response.metadata },
      });
    };

    it('should generate content successfully', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      provider.makeRequest = createMockMakeRequest();
      const result = await provider.generate('Test prompt');

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    });

    it('should track successful request in stats', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      provider.makeRequest = createMockMakeRequest();
      await provider.generate('Test prompt');

      const stats = provider.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(0);
    });

    it('should fail without API key', async () => {
      const provider = new AIProvider({ apiKey: null });
      provider.apiKey = ''; // Force empty key
      const result = await provider.generate('Test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key not configured');
    });

    it('should track failed request in stats', async () => {
      const provider = new AIProvider({ apiKey: null });
      provider.apiKey = ''; // Force empty key
      await provider.generate('Test prompt');

      const stats = provider.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(1);
    });

    it('should pass options to request', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      let capturedOptions = {};
      provider.makeRequest = async (prompt, options) => {
        capturedOptions = options;
        return {
          content: { test: true },
          metadata: { model: 'test', tokens: 100 },
        };
      };

      const result = await provider.generate('Test prompt', {
        format: 'markdown',
        temperature: 0.5,
      });

      expect(result.success).toBe(true);
      expect(capturedOptions.format).toBe('markdown');
      expect(capturedOptions.temperature).toBe(0.5);
    });

    it('should include attempt count in metadata', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      provider.makeRequest = createMockMakeRequest();
      const result = await provider.generate('Test prompt');

      expect(result.metadata.attempts).toBe(1);
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      const provider = new AIProvider({ apiKey: 'test-key', maxRetries: 3 });

      // Speed up backoff for testing
      provider.exponentialBackoff = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      // Mock makeRequest to fail twice then succeed
      let attemptCount = 0;
      provider.makeRequest = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Rate limit exceeded');
          throw error;
        }
        return {
          content: { success: true },
          metadata: { model: 'test', tokens: 100 },
        };
      };

      const result = await provider.generate('Test prompt');

      expect(result.success).toBe(true);
      expect(result.metadata.attempts).toBe(3);
      expect(provider.getStats().retriedRequests).toBe(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const provider = new AIProvider({ apiKey: 'test-key', maxRetries: 3 });

      // Mock makeRequest to throw non-retryable error
      provider.makeRequest = async () => {
        throw new Error('Invalid input');
      };

      const result = await provider.generate('Test prompt');

      expect(result.success).toBe(false);
      expect(result.metadata.attempts).toBe(1);
      expect(provider.getStats().retriedRequests).toBe(0);
    });

    it('should fail after max retries', async () => {
      const provider = new AIProvider({ apiKey: 'test-key', maxRetries: 2 });

      // Mock makeRequest to always fail with retryable error
      provider.makeRequest = async () => {
        throw new Error('Service unavailable');
      };

      const result = await provider.generate('Test prompt');

      expect(result.success).toBe(false);
      expect(result.metadata.attempts).toBe(2);
      expect(result.error).toContain('Service unavailable');
    });

    it('should apply exponential backoff', async () => {
      const provider = new AIProvider({ apiKey: 'test-key', maxRetries: 3 });

      const delays = [];
      const originalSetTimeout = global.setTimeout;

      // Mock setTimeout to track delays
      global.setTimeout = (fn, delay) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0); // Execute immediately for test
      };

      // Mock makeRequest to fail twice
      let attemptCount = 0;
      provider.makeRequest = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Rate limit exceeded');
        }
        return {
          content: { success: true },
          metadata: { model: 'test', tokens: 100 },
        };
      };

      await provider.generate('Test prompt');

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;

      // Check that delays increased (exponential backoff)
      expect(delays.length).toBeGreaterThan(0);
      // First retry should have longer delay than rate limit
      const backoffDelays = delays.filter((d) => d > 200);
      expect(backoffDelays.length).toBeGreaterThan(0);
    });
  });

  describe('rate limiting', () => {
    // Helper mock
    const mockMakeRequest = async () => ({
      content: { test: true },
      metadata: { model: 'test', tokens: 100 },
    });

    it('should enforce minimum interval between requests', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      provider.minRequestInterval = 200;
      provider.makeRequest = mockMakeRequest;

      const start = Date.now();

      await provider.generate('Prompt 1');
      await provider.generate('Prompt 2');

      const duration = Date.now() - start;

      // Should take at least minRequestInterval
      expect(duration).toBeGreaterThanOrEqual(200);
    });

    it('should not delay if enough time has passed', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      provider.minRequestInterval = 50;
      provider.makeRequest = mockMakeRequest;

      await provider.generate('Prompt 1');

      // Wait longer than interval
      await new Promise((resolve) => setTimeout(resolve, 100));

      const start = Date.now();
      await provider.generate('Prompt 2');
      const duration = Date.now() - start;

      // Should not add significant delay
      expect(duration).toBeLessThan(150);
    });
  });

  describe('isRetryable', () => {
    const provider = new AIProvider();

    it('should identify retryable errors', () => {
      const retryableErrors = [
        new Error('ECONNRESET'),
        new Error('ETIMEDOUT'),
        new Error('Rate limit exceeded'),
        new Error('Service unavailable'),
        new Error('Internal server error'),
      ];

      retryableErrors.forEach((error) => {
        expect(provider.isRetryable(error)).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        new Error('Invalid input'),
        new Error('Authentication failed'),
        new Error('Resource not found'),
      ];

      nonRetryableErrors.forEach((error) => {
        expect(provider.isRetryable(error)).toBe(false);
      });
    });
  });

  describe('statistics', () => {
    // Helper mock
    const mockMakeRequest = async () => ({
      content: { test: true },
      metadata: { model: 'test', tokens: 100 },
    });

    it('should calculate success rate', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      provider.makeRequest = mockMakeRequest;

      await provider.generate('Success 1');
      await provider.generate('Success 2');

      // Force a failure
      provider.makeRequest = async () => {
        throw new Error('Invalid input');
      };
      await provider.generate('Failure');

      const stats = provider.getStats();
      expect(stats.successRate).toBeCloseTo(66.67, 1);
    });

    it('should track total tokens', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });

      // Mock to return specific token counts
      provider.makeRequest = async () => ({
        content: { test: true },
        metadata: { model: 'test', tokens: 150 },
      });

      await provider.generate('Prompt 1');
      await provider.generate('Prompt 2');

      const stats = provider.getStats();
      expect(stats.totalTokens).toBe(300);
      expect(stats.averageTokens).toBe(150);
    });

    it('should reset statistics', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });
      provider.makeRequest = mockMakeRequest;

      await provider.generate('Prompt');
      expect(provider.getStats().totalRequests).toBe(1);

      provider.resetStats();
      const stats = provider.getStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
    });
  });

  describe('logging', () => {
    // Helper mock
    const mockMakeRequest = async () => ({
      content: { test: true },
      metadata: { model: 'test', tokens: 100 },
    });

    it('should not log by default', async () => {
      const provider = new AIProvider({ apiKey: 'test-key', debug: false });
      provider.makeRequest = mockMakeRequest;

      // Capture console.log calls
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args);

      await provider.generate('Test');

      console.log = originalLog;
      expect(logs.length).toBe(0);
    });

    it('should log in debug mode', async () => {
      const provider = new AIProvider({ apiKey: 'test-key', debug: true });
      provider.makeRequest = mockMakeRequest;

      // Capture console.log calls
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args);

      await provider.generate('Test');

      console.log = originalLog;
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log[0].includes('[AIProvider]'))).toBe(true);
    });
  });

  describe('convenience functions', () => {
    it('should create provider with createProvider', () => {
      const provider = createProvider({ model: 'test-model' });
      expect(provider).toBeInstanceOf(AIProvider);
      expect(provider.model).toBe('test-model');
    });

    it('should generate with convenience function', async () => {
      // Mock fetch globally for this test
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: '{"test": true}' }],
          model: 'test',
          usage: { output_tokens: 100 }
        })
      });

      const result = await generate('Test prompt', { apiKey: 'test-key' });
      expect(result.success).toBe(true);

      global.fetch = originalFetch;
    });
  });

  describe('error handling', () => {
    it('should include error type in metadata', async () => {
      const provider = new AIProvider({ apiKey: 'test-key' });

      provider.makeRequest = async () => {
        const error = new Error('Test error');
        error.name = 'CustomError';
        throw error;
      };

      const result = await provider.generate('Test');

      expect(result.success).toBe(false);
      expect(result.metadata.errorType).toBe('CustomError');
    });

    it('should handle timeout errors', async () => {
      const provider = new AIProvider({ apiKey: 'test-key', timeout: 50 });

      provider.makeRequest = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        throw new Error('Request timeout');
      };

      const result = await provider.generate('Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });
});
