/**
 * AI Provider for Teaching Content Generation
 *
 * Handles AI-powered content generation with:
 * - Retry logic with exponential backoff
 * - Rate limiting
 * - Error handling and logging
 * - Timeout management
 * - Structured output validation
 */

/**
 * AI Generation result
 * @typedef {Object} GenerationResult
 * @property {boolean} success - Whether generation succeeded
 * @property {Object|null} content - Generated content (if successful)
 * @property {string|null} error - Error message (if failed)
 * @property {Object} metadata - Generation metadata (model, tokens, duration)
 */

/**
 * AI Provider class
 */
export class AIProvider {
  /**
   * Create a new AI provider
   * @param {Object} options - Provider options
   * @param {string} options.apiKey - API key (optional, reads from env if not provided)
   * @param {string} options.model - Model to use (default: 'claude-3-5-sonnet-20241022')
   * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
   * @param {number} options.timeout - Request timeout in ms (default: 30000)
   * @param {number} options.maxTokens - Maximum tokens to generate (default: 4096)
   * @param {boolean} options.debug - Enable debug logging (default: false)
   * @param {string} options.apiVersion - Anthropic API version (default: '2023-06-01')
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    this.model = options.model || 'claude-3-5-sonnet-20241022';
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 30000;
    this.maxTokens = options.maxTokens || 4096;
    this.debug = options.debug || false;
    this.apiVersion = options.apiVersion || '2023-06-01';

    // Rate limiting state
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // ms between requests

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      totalTokens: 0,
    };
  }

  /**
   * Generate content using AI
   * @param {string} prompt - Generation prompt
   * @param {Object} options - Generation options
   * @param {Object} options.context - Additional context (config, template, etc.)
   * @param {string} options.format - Expected output format (json, markdown)
   * @param {number} options.temperature - Sampling temperature (0-1)
   * @returns {Promise<GenerationResult>} Generation result
   */
  async generate(prompt, options = {}) {
    const {
      context = {},
      format = 'json',
      temperature = 0.7,
    } = options;

    this.stats.totalRequests++;
    const startTime = Date.now();

    // Apply rate limiting
    await this.enforceRateLimit();

    // Retry loop
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.stats.retriedRequests++;
          this.log(`Retry attempt ${attempt}/${this.maxRetries}`);
          await this.exponentialBackoff(attempt);
        }

        // Make API request (with timeout)
        const result = await this.makeRequest(prompt, {
          format,
          temperature,
          context,
        });

        // Success
        this.stats.successfulRequests++;
        this.stats.totalTokens += (result.metadata.tokens || 0) + (result.metadata.inputTokens || 0);

        this.log(`Generation successful in ${Date.now() - startTime}ms`);

        return {
          success: true,
          content: result.content,
          error: null,
          metadata: {
            ...result.metadata,
            duration: Date.now() - startTime,
            attempts: attempt + 1,
          },
        };
      } catch (error) {
        this.log(`Attempt ${attempt + 1} failed: ${error.message}`);

        // Check if error is retryable
        if (!this.isRetryable(error) || attempt === this.maxRetries - 1) {
          // Final failure
          this.stats.failedRequests++;

          return {
            success: false,
            content: null,
            error: error.message,
            metadata: {
              model: this.model,
              duration: Date.now() - startTime,
              attempts: attempt + 1,
              errorType: error.name,
            },
          };
        }
      }
    }

    // Should not reach here, but handle gracefully
    this.stats.failedRequests++;
    return {
      success: false,
      content: null,
      error: 'Maximum retries exceeded',
      metadata: {
        model: this.model,
        duration: Date.now() - startTime,
        attempts: this.maxRetries,
      },
    };
  }

  /**
   * Make API request to Claude Messages API
   * @param {string} prompt - Generation prompt
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   * @private
   */
  async makeRequest(prompt, options = {}) {
    if (!this.apiKey || this.apiKey === '') {
      const error = new Error('API key not configured');
      error.name = 'ConfigurationError';
      throw error;
    }

    const { format = 'json', temperature = 0.7 } = options;

    // Build system prompt for JSON output
    const systemPrompt = format === 'json'
      ? 'You are an expert academic content generator. You MUST respond with valid JSON only. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks.'
      : 'You are an expert academic content generator.';

    // Build request body
    const requestBody = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      this.log(`Making API request to ${this.model}...`);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const error = new Error(`API error ${response.status}: ${errorBody}`);
        error.name = 'APIError';
        error.status = response.status;

        // Mark rate limit errors for retry
        if (response.status === 429) {
          error.message = 'Rate limit exceeded';
        } else if (response.status >= 500) {
          error.message = 'Service unavailable';
        }

        throw error;
      }

      const data = await response.json();

      // Extract content from response
      const textContent = data.content?.find(c => c.type === 'text')?.text || '';

      // Parse JSON if expected
      let content = textContent;
      if (format === 'json') {
        try {
          // Try to extract JSON from the response (handle potential markdown wrapping)
          let jsonStr = textContent;

          // Remove markdown code blocks if present
          const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }

          content = JSON.parse(jsonStr);
        } catch (parseError) {
          this.log(`JSON parse warning: ${parseError.message}`);
          // Return raw text if JSON parsing fails - let caller handle it
          content = textContent;
        }
      }

      return {
        content,
        metadata: {
          model: data.model,
          tokens: data.usage?.output_tokens || 0,
          inputTokens: data.usage?.input_tokens || 0,
          stopReason: data.stop_reason
        }
      };

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }

      throw error;
    }
  }

  /**
   * Enforce rate limiting between requests
   * @private
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      this.log(`Rate limiting: waiting ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Exponential backoff delay
   * @param {number} attempt - Attempt number (0-indexed)
   * @returns {Promise<void>}
   * @private
   */
  async exponentialBackoff(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    const totalDelay = delay + jitter;

    this.log(`Backing off for ${Math.round(totalDelay)}ms`);
    await new Promise((resolve) => setTimeout(resolve, totalDelay));
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} True if error is retryable
   * @private
   */
  isRetryable(error) {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'Rate limit exceeded',
      'Service unavailable',
      'Internal server error',
    ];

    return retryableErrors.some((retryable) =>
      error.message.includes(retryable)
    );
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @private
   */
  log(message) {
    if (this.debug) {
      console.log(`[AIProvider] ${message}`);
    }
  }

  /**
   * Get provider statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0,
      averageTokens: this.stats.successfulRequests > 0
        ? this.stats.totalTokens / this.stats.successfulRequests
        : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      totalTokens: 0,
    };
  }
}

/**
 * Create an AI provider with options
 * @param {Object} options - Provider options
 * @returns {AIProvider} Provider instance
 */
export function createProvider(options = {}) {
  return new AIProvider(options);
}

/**
 * Generate content with retry (convenience function)
 * @param {string} prompt - Generation prompt
 * @param {Object} options - Generation and provider options
 * @returns {Promise<GenerationResult>} Generation result
 */
export async function generate(prompt, options = {}) {
  const provider = new AIProvider(options);
  return provider.generate(prompt, options);
}
