/**
 * Tests for SHA-256 hashing utility
 */

import { sha256 } from '../../../src/teaching/utils/hash.js';

describe('sha256', () => {
  it('should return a 64-character hex string', () => {
    const result = sha256('hello');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return consistent hash for same input', () => {
    const hash1 = sha256('test content');
    const hash2 = sha256('test content');
    expect(hash1).toBe(hash2);
  });

  it('should return different hash for different input', () => {
    const hash1 = sha256('content A');
    const hash2 = sha256('content B');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty string', () => {
    const result = sha256('');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle unicode content', () => {
    const result = sha256('日本語テスト');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle multiline YAML content', () => {
    const yaml = `schema_version: "1.0"
semester:
  total_weeks: 15
weeks:
  - week: 1
    title: "Test"`;
    const result = sha256(yaml);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce known SHA-256 for known input', () => {
    // SHA-256 of empty string is well-known
    const emptyHash = sha256('');
    expect(emptyHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should detect single-character changes', () => {
    const hash1 = sha256('status: draft');
    const hash2 = sha256('status: Draft');
    expect(hash1).not.toBe(hash2);
  });
});
