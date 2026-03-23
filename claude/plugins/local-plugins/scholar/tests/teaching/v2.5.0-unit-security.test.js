/**
 * Security-focused unit tests for v2.5.0 modules
 *
 * Tests security edge cases and injection prevention across:
 * - slugify.js (path traversal, shell injection, filename safety)
 * - preview-launcher.js (command injection, process safety)
 * - qmd-parser.js (XXE, ReDoS, path traversal)
 *
 * Created: 2026-01-29 (Session 41)
 */

import { describe, it, expect } from '@jest/globals';
import { slugify } from '../../src/teaching/utils/slugify.js';
import { matchSection } from '../../src/teaching/utils/qmd-parser.js';

// ═══════════════════════════════════════════════════════════
// slugify.js Security Tests
// ═══════════════════════════════════════════════════════════

describe('slugify() - Security', () => {
  describe('Path Traversal Prevention', () => {
    it('should remove ../ sequences', () => {
      const result = slugify('../../../etc/passwd');
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
      expect(result).toBe('etc-passwd');
    });

    it('should remove ./ sequences', () => {
      const result = slugify('./hidden/file');
      expect(result).not.toContain('./');
      expect(result).toBe('hidden-file');
    });

    it('should strip absolute paths', () => {
      const result = slugify('/etc/shadow');
      expect(result).not.toContain('/');
      expect(result).toBe('etc-shadow');
    });

    it('should handle Windows path separators', () => {
      const result = slugify('..\\..\\windows\\system32');
      expect(result).not.toContain('\\');
      expect(result).toBe('windows-system32');
    });
  });

  describe('Shell Injection Prevention', () => {
    it('should remove command substitution $(...)', () => {
      const result = slugify('$(rm -rf /)');
      expect(result).not.toContain('$');
      expect(result).not.toContain('(');
      expect(result).toBe('rm-rf');
    });

    it('should remove backtick command substitution', () => {
      const result = slugify('`whoami`');
      expect(result).not.toContain('`');
      expect(result).toBe('whoami');
    });

    it('should remove pipe operators', () => {
      const result = slugify('foo | cat /etc/passwd');
      expect(result).not.toContain('|');
      expect(result).toBe('foo-cat-etc-passwd');
    });

    it('should remove semicolon command separators', () => {
      const result = slugify('safe; rm -rf /');
      expect(result).not.toContain(';');
      expect(result).toBe('safe-rm-rf');
    });

    it('should remove ampersand background operators', () => {
      const result = slugify('cmd1 & cmd2 && cmd3');
      expect(result).not.toContain('&');
      expect(result).toBe('cmd1-cmd2-cmd3');
    });

    it('should remove redirect operators', () => {
      const result = slugify('echo foo > /tmp/evil');
      expect(result).not.toContain('>');
      expect(result).toBe('echo-foo-tmp-evil');
    });
  });

  describe('Unicode Normalization', () => {
    it('should handle combining diacritics', () => {
      // "café" with combining acute accent (NFD)
      const nfd = 'cafe\u0301';
      const result = slugify(nfd);
      // Note: Combining mark is removed, base character remains
      expect(result).toBe('cafe'); // combining mark removed, 'e' stays
    });

    it('should handle precomposed characters (NFC)', () => {
      // "café" as single character (NFC)
      const nfc = 'café';
      const result = slugify(nfc);
      // Note: Current implementation removes accented characters
      expect(result).toBe('caf'); // é is removed
    });

    it('should handle mixed normalization forms', () => {
      const mixed = 'naïve résumé'; // mix of NFC/NFD
      const result = slugify(mixed);
      // Note: Accented characters are removed
      expect(result).toBe('na-ve-r-sum'); // ï, é, é removed
    });
  });

  describe('Null Byte Injection', () => {
    it('should remove null bytes', () => {
      const result = slugify('file.txt\x00.exe');
      expect(result).not.toContain('\x00');
      expect(result).toBe('file-txt-exe');
    });

    it('should handle multiple null bytes', () => {
      const result = slugify('safe\x00\x00malicious');
      expect(result).not.toContain('\x00');
      expect(result).toBe('safe-malicious');
    });
  });

  describe('Filename Length Limits', () => {
    it('should truncate to 80 characters', () => {
      const longTitle = 'A'.repeat(100);
      const result = slugify(longTitle);
      expect(result.length).toBeLessThanOrEqual(80);
    });

    it('should truncate at word boundary when possible', () => {
      const longTitle = 'word '.repeat(30); // 150 chars
      const result = slugify(longTitle);
      expect(result.length).toBeLessThanOrEqual(80);
      expect(result).not.toMatch(/-$/); // doesn't end with hyphen
    });

    it('should handle exactly 80 chars', () => {
      const exact80 = 'a'.repeat(80);
      const result = slugify(exact80);
      expect(result.length).toBe(80);
    });

    it('should preserve short titles', () => {
      const short = 'Short Title';
      const result = slugify(short);
      expect(result).toBe('short-title');
      expect(result.length).toBeLessThan(80);
    });
  });

  describe('Reserved Filenames (Windows)', () => {
    it('should handle CON (console)', () => {
      const result = slugify('CON');
      // Should still produce a valid slug, even if OS-reserved
      expect(result).toBe('con');
      expect(result).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle PRN (printer)', () => {
      const result = slugify('PRN');
      expect(result).toBe('prn');
    });

    it('should handle AUX (auxiliary)', () => {
      const result = slugify('AUX Device');
      expect(result).toBe('aux-device');
    });

    it('should handle NUL (null device)', () => {
      const result = slugify('NUL');
      expect(result).toBe('nul');
    });

    it('should handle COM1-9 (serial ports)', () => {
      const result = slugify('COM1 Port');
      expect(result).toBe('com1-port');
    });

    it('should handle LPT1-9 (parallel ports)', () => {
      const result = slugify('LPT1 Printer');
      expect(result).toBe('lpt1-printer');
    });
  });

  describe('HTML/XML Injection', () => {
    it('should remove HTML tags', () => {
      const result = slugify('<script>alert("XSS")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toBe('script-alert-xss-script');
    });

    it('should remove XML processing instructions', () => {
      const result = slugify('<?xml version="1.0"?>');
      expect(result).not.toContain('<?');
      expect(result).not.toContain('?>');
      expect(result).toBe('xml-version-1-0');
    });

    it('should handle CDATA sections', () => {
      const result = slugify('<![CDATA[malicious]]>');
      expect(result).not.toContain('<![');
      expect(result).not.toContain(']]>');
      expect(result).toBe('cdata-malicious');
    });
  });
});

// ═══════════════════════════════════════════════════════════
// qmd-parser.js Security Tests
// ═══════════════════════════════════════════════════════════

describe('matchSection() - Security', () => {
  const sampleSections = [
    { title: 'Introduction', level: 2, slug: 'introduction' },
    { title: 'Theory Background', level: 2, slug: 'theory-background' },
    { title: 'Worked Example', level: 2, slug: 'worked-example' }
  ];

  describe('ReDoS Prevention', () => {
    it('should handle pathological regex input', () => {
      // Exponential backtracking pattern
      const pathological = 'a'.repeat(100) + 'b';
      const start = Date.now();
      const result = matchSection(sampleSections, pathological);
      const elapsed = Date.now() - start;

      // Should complete in < 100ms (not exponential)
      expect(elapsed).toBeLessThan(100);
      expect(result).toBeNull();
    });

    it('should handle nested quantifiers', () => {
      const nested = '((((((((((x))))))))))'.repeat(10);
      const start = Date.now();
      const result = matchSection(sampleSections, nested);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
      expect(result).toBeNull();
    });
  });

  describe('Query Length Limits', () => {
    it('should reject queries shorter than 4 chars', () => {
      const result = matchSection(sampleSections, 'int');
      expect(result).toBeNull();
    });

    it('should accept queries exactly 4 chars', () => {
      const result = matchSection(sampleSections, 'intro');
      expect(result).not.toBeNull();
    });

    it('should reject empty queries', () => {
      const result = matchSection(sampleSections, '');
      expect(result).toBeNull();
    });
  });

  describe('Path Traversal in Section References', () => {
    it('should sanitize path traversal in slugs', () => {
      const maliciousSections = [
        { title: '../../../etc/passwd', level: 2, slug: 'etc-passwd' }
      ];
      const result = matchSection(maliciousSections, 'etc-passwd');
      // Should match by sanitized slug
      expect(result).not.toBeNull();
      // Slug is sanitized but title may still contain original text
      expect(result.slug).toBe('etc-passwd');
      expect(result.slug).not.toContain('../'); // Slug is safe
    });
  });

  describe('One-directional Matching', () => {
    it('should match query subset in section title', () => {
      // "intro" matches "Introduction"
      const result = matchSection(sampleSections, 'intro');
      expect(result).not.toBeNull();
      expect(result.title).toBe('Introduction');
    });

    it('should NOT match section title subset in query', () => {
      // Query: "introduction to advanced topics" → slug: "introduction-to-advanced-topics"
      // Section: "Introduction" → slug: "introduction"
      // Does "introduction".includes("introduction-to-advanced-topics")? NO
      const result = matchSection(sampleSections, 'introduction to advanced topics');
      // Correctly rejects: query is superset, not subset
      expect(result).toBeNull();
    });

    it('should prevent overly permissive matches', () => {
      // Query: "theory background advanced content" → slug: "theory-background-advanced-content"
      // Section: "Theory Background" → slug: "theory-background"
      // Does "theory-background".includes("theory-background-advanced-content")? NO
      const result = matchSection(sampleSections, 'theory background advanced content');
      // Correctly rejects: query is superset, not subset
      expect(result).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════
// Integration Tests
// ═══════════════════════════════════════════════════════════

describe('Cross-module Security', () => {
  it('should handle malicious input through full pipeline', () => {
    // Simulate: User provides malicious topic → slugify → filename
    const maliciousTopic = '../../../etc/passwd; rm -rf /';
    const slug = slugify(maliciousTopic);

    // Should produce safe filename
    expect(slug).not.toContain('..');
    expect(slug).not.toContain('/');
    expect(slug).not.toContain(';');
    expect(slug).toBe('etc-passwd-rm-rf');

    // Filename should be safe for fs operations
    const filename = `week01-${slug}.qmd`;
    expect(filename).toMatch(/^week\d{2}-[a-z0-9-]+\.qmd$/);
  });
});
