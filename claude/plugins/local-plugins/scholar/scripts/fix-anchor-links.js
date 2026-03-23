#!/usr/bin/env node

/**
 * Fix anchor links to match markdownlint's heading ID algorithm
 * Standard markdown ID: lowercase, spaces to hyphens, remove special chars
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
  } catch (e) {
    // Directory not found
  }
  return files;
}

// Generate heading ID from text (matches markdownlint algorithm)
function generateHeadingId(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')       // Spaces to hyphens
    .replace(/-+/g, '-')        // Collapse hyphens
    .replace(/^-|-$/g, '');     // Trim hyphens
}

function fixAnchorLinks(content) {
  const lines = content.split('\n');
  const result = [];

  for (const line of lines) {
    let fixedLine = line;

    // Find markdown links with fragments: [text](#fragment)
    const linkPattern = /\[([^\]]+)\]\(#([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(line)) !== null) {
      const linkText = match[1];
      const fragment = match[2];

      // Generate expected ID from link text
      const expectedId = generateHeadingId(linkText);

      // If fragment doesn't match expected, fix it
      if (fragment !== expectedId && expectedId.length > 0) {
        fixedLine = fixedLine.replace(
          `](#${fragment})`,
          `](#${expectedId})`
        );
      }
    }

    result.push(fixedLine);
  }

  return result.join('\n');
}

function main() {
  const docsDir = join(process.cwd(), 'docs');
  const files = processDir(docsDir, true);
  let totalFixed = 0;

  for (const filePath of files) {
    const original = readFileSync(filePath, 'utf-8');
    const fixed = fixAnchorLinks(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
