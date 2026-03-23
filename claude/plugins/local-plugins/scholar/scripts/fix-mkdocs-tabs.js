#!/usr/bin/env node

/**
 * Convert MkDocs Material tabs to regular sections with fenced code blocks
 * Tabs syntax: === "Tab Name"
 *     content indented by 4 spaces
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

function convertTabs(content) {
  const lines = content.split('\n');
  const result = [];
  let inTab = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for tab header: === "Tab Name" or === 'Tab Name'
    const tabMatch = line.match(/^===\s+["'](.+?)["']/);

    if (tabMatch) {
      const tabName = tabMatch[1];
      // Convert tab header to H3 heading
      result.push(`### ${tabName}`);
      result.push('');
      inTab = true;
      continue;
    }

    if (inTab) {
      // Check if line is indented (part of tab content)
      if (line.startsWith('    ')) {
        // Remove 4-space indent
        const unindented = line.slice(4);

        // Check if this is an indented code block inside tab
        if (unindented.startsWith('```')) {
          // It's already a fenced block, just unindent
          result.push(unindented);
        } else {
          result.push(unindented);
        }
      } else if (line.trim() === '') {
        // Empty line - could be end of tab or just whitespace
        result.push(line);
      } else {
        // Non-indented, non-empty line - end of tab section
        inTab = false;
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

function main() {
  const docsDir = join(process.cwd(), 'docs');
  const files = processDir(docsDir, true);
  let totalFixed = 0;

  for (const filePath of files) {
    const original = readFileSync(filePath, 'utf-8');

    // Only process files that have tabs
    if (!original.includes('=== "') && !original.includes("=== '")) {
      continue;
    }

    const fixed = convertTabs(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
