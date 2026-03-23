#!/usr/bin/env node

/**
 * Convert standalone bold text to proper headings (MD036)
 * Only converts lines that are pure bold text standing alone
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

function convertBoldToHeadings(content) {
  const lines = content.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is standalone bold text: **text** or __text__
    // Must be preceded and followed by blank lines (or start/end of file)
    const boldMatch = trimmed.match(/^(\*\*|__)(.+?)(\*\*|__)$/);

    if (boldMatch) {
      const text = boldMatch[2];
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

      // Only convert if it's truly standalone (blank before, content/blank after)
      if (prevLine === '') {
        // Remove trailing punctuation for heading (except ?)
        let headingText = text.replace(/[:.]$/, '');

        // Determine heading level based on context
        // If text starts with a number, use ####
        // If it's a short label, use ###
        const isNumbered = /^\d+\.?\s/.test(headingText);
        const isLayer = /^Layer\s+\d+/i.test(headingText);
        const isStep = /^Step\s+\d+/i.test(headingText);

        let prefix = '###';
        if (isNumbered || isLayer || isStep) {
          prefix = '####';
        }

        result.push(`${prefix} ${headingText}`);
        continue;
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
    const fixed = convertBoldToHeadings(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
