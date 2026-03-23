/**
 * SHA-256 hashing utility
 *
 * Extracted from manifest-loader.js for reuse across
 * manifest generation, migration, and sync features.
 *
 * @module teaching/utils/hash
 */

import { createHash } from 'crypto';

/**
 * Compute SHA-256 hex digest of a string
 * @param {string} content - Raw string content to hash
 * @returns {string} SHA-256 hex digest (64 chars)
 *
 * @example
 * const hash = sha256('hello world');
 * // => '...' (64-char hex string)
 */
export function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}
