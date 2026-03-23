#!/usr/bin/env node

/**
 * Fix duplicate headings (MD024) by adding unique suffixes
 * Uses parent context or numbering to make headings unique
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function processDir(dir, recursive = false) {
  const files = [];
  try {
    for (const item of readdirSync(dir)) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && recursive) {
        files.push(...processDir(fullPath, true));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

function fixDuplicateHeadings(content) {
  const lines = content.split('\n');
  const result = [];

  // Track headings at each level for parent context
  const headingStack = ['', '', '', '', '', ''];  // h1-h6
  // Track seen headings and their counts for making unique
  const seenHeadings = {};

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);

    if (match) {
      const hashes = match[1];
      const level = hashes.length;
      const text = match[2].trim();

      // Update heading stack
      headingStack[level - 1] = text;
      // Clear deeper levels
      for (let i = level; i < 6; i++) {
        headingStack[i] = '';
      }

      // Check if we've seen this exact heading before
      if (seenHeadings[text]) {
        seenHeadings[text]++;

        // Find parent heading for context
        let parentContext = '';
        for (let i = level - 2; i >= 0; i--) {
          if (headingStack[i]) {
            parentContext = headingStack[i];
            break;
          }
        }

        let newText;
        if (parentContext) {
          // Shorten parent context
          let shortParent = parentContext
            .replace(/[:`'"()]/g, '')
            .split(/\s+/)
            .slice(0, 3)
            .join(' ')
            .trim();

          // Remove trailing numbers if any
          shortParent = shortParent.replace(/\s+\d+$/, '');

          if (shortParent.length > 25) {
            shortParent = shortParent.slice(0, 25).trim();
          }

          newText = `${text} - ${shortParent}`;

          // If this combination is also duplicate, add number
          if (seenHeadings[newText]) {
            seenHeadings[newText]++;
            newText = `${text} - ${shortParent} ${seenHeadings[newText]}`;
          }
        } else {
          // No parent, use numbering
          newText = `${text} ${seenHeadings[text]}`;
        }

        seenHeadings[newText] = 1;
        result.push(`${hashes} ${newText}`);
        headingStack[level - 1] = newText;
        continue;
      } else {
        seenHeadings[text] = 1;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

function main() {
  const docsDir = join(process.cwd(), 'docs');
  const files = processDir(docsDir, true);
  let totalFixed = 0;

  for (const filePath of files) {
    const original = readFileSync(filePath, 'utf-8');
    const fixed = fixDuplicateHeadings(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
