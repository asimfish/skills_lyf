/**
 * Custom Jest Matchers for Integration Tests
 *
 * Provides domain-specific assertions for teaching config validation and fixing
 */

import yaml from 'js-yaml';
import { expect } from '@jest/globals';

/**
 * Custom matchers for Jest
 */
export const customMatchers = {
  /**
   * Assert that two YAML contents are equivalent
   */
  toMatchYAML(received, expected) {
    const receivedObj = typeof received === 'string' ? yaml.load(received) : received;
    const expectedObj = typeof expected === 'string' ? yaml.load(expected) : expected;

    const pass = JSON.stringify(receivedObj) === JSON.stringify(expectedObj);

    return {
      pass,
      message: () =>
        pass
          ? `Expected YAML not to match:\n${JSON.stringify(receivedObj, null, 2)}`
          : `Expected YAML to match:\n\nReceived:\n${JSON.stringify(receivedObj, null, 2)}\n\nExpected:\n${JSON.stringify(expectedObj, null, 2)}`,
    };
  },

  /**
   * Assert that a fix has specific type
   */
  toHaveFixType(received, expectedType) {
    const pass = received.type === expectedType;

    return {
      pass,
      message: () =>
        pass
          ? `Expected fix type not to be ${expectedType}`
          : `Expected fix type to be ${expectedType}, got: ${received.type}`,
    };
  },

  /**
   * Assert that a config passes validation
   */
  toBeValidConfig(received) {
    try {
      const parsed = typeof received === 'string' ? yaml.load(received) : received;
      const isValid = parsed && typeof parsed === 'object';

      return {
        pass: isValid,
        message: () =>
          isValid
            ? 'Expected config not to be valid'
            : 'Expected config to be valid',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Expected valid config, got parse error: ${error.message}`,
      };
    }
  },

  /**
   * Assert that validation result has specific error count
   */
  toHaveErrorCount(received, expectedCount) {
    const actualCount = received.errors ? received.errors.length : 0;
    const pass = actualCount === expectedCount;

    return {
      pass,
      message: () =>
        pass
          ? `Expected not to have ${expectedCount} errors`
          : `Expected ${expectedCount} errors, got: ${actualCount}`,
    };
  },

  /**
   * Assert that validation result has specific error type
   */
  toHaveErrorType(received, expectedType) {
    const hasType = received.errors?.some((err) => err.type === expectedType);

    return {
      pass: hasType,
      message: () =>
        hasType
          ? `Expected not to have error type: ${expectedType}`
          : `Expected to have error type: ${expectedType}`,
    };
  },

  /**
   * Assert that fix result has specific safety level
   */
  toBeSafeFix(received) {
    const pass = received.safe === true;

    return {
      pass,
      message: () =>
        pass
          ? 'Expected fix not to be safe'
          : 'Expected fix to be safe (auto-applicable)',
    };
  },

  /**
   * Assert that fix was applied successfully
   */
  toBeApplied(received) {
    const pass = received.applied === true;

    return {
      pass,
      message: () =>
        pass ? 'Expected fix not to be applied' : 'Expected fix to be applied',
    };
  },

  /**
   * Assert that content contains no syntax errors
   */
  toHaveValidSyntax(received) {
    try {
      yaml.load(received);
      return {
        pass: true,
        message: () => 'Expected content to have invalid syntax',
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Expected valid syntax, got error: ${error.message}`,
      };
    }
  },
};

/**
 * Register custom matchers with Jest
 */
export function registerCustomMatchers() {
  expect.extend(customMatchers);
}

/**
 * Helper: Assert that fix priority is correct
 * @param {Object} fix - Fix object
 * @param {number} expectedPriority - Expected priority value
 */
export function assertFixPriority(fix, expectedPriority) {
  expect(fix.priority).toBe(expectedPriority);
}

/**
 * Helper: Assert that fixes are ordered by priority
 * @param {Array<Object>} fixes - Array of fix objects
 */
export function assertFixesOrdered(fixes) {
  for (let i = 1; i < fixes.length; i++) {
    expect(fixes[i].priority).toBeGreaterThanOrEqual(fixes[i - 1].priority);
  }
}

/**
 * Helper: Assert that config has required fields
 * @param {Object} config - Parsed config object
 * @param {Array<string>} requiredFields - Array of required field paths
 */
export function assertRequiredFields(config, requiredFields) {
  for (const field of requiredFields) {
    const parts = field.split('.');
    let current = config;

    for (const part of parts) {
      expect(current).toHaveProperty(part);
      current = current[part];
    }
  }
}
