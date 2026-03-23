#!/usr/bin/env node

/**
 * Fix emphasis used as heading (MD036)
 * Converts standalone bold lines to proper headings or regular text
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

function fixEmphasisHeadings(content) {
  const lines = content.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is standalone bold text (potential heading)
    // Pattern: **text** or __text__ on its own line
    const boldMatch = trimmed.match(/^(\*\*|__)(.+?)(\*\*|__)$/);

    if (boldMatch) {
      const text = boldMatch[2];
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

      // If it's a standalone bold line preceded by blank and followed by content/blank
      // Convert to a heading or keep as inline bold
      if (prevLine === '' && (nextLine === '' || nextLine.startsWith('|') || nextLine.startsWith('-') || nextLine.startsWith('*'))) {
        // This looks like a heading - convert to ### (or keep context-appropriate)
        // Use #### for step-like content, ### otherwise
        const isStep = text.match(/^Step\s+\d+/i);
        const prefix = isStep ? '####' : '###';
        result.push(`${prefix} ${text}`);
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
    const fixed = fixEmphasisHeadings(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
