#!/usr/bin/env node

/**
 * Fix indented code blocks (4 spaces) to fenced code blocks (```)
 * For MD046 compliance
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function processDir(dir, recursive = false) {
  const files = [];

  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && recursive) {
      files.push(...processDir(fullPath, true));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixIndentedCodeBlocks(content) {
  const lines = content.split('\n');
  const result = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let prevLineWasBlank = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isIndented = line.startsWith('    ') && !line.startsWith('     ');  // Exactly 4 spaces
    const isBlank = line.trim() === '';
    const isFencedStart = line.trim().startsWith('```');

    // Skip if we're in a fenced code block
    if (isFencedStart && !inCodeBlock) {
      result.push(line);
      inCodeBlock = true;
      continue;
    }
    if (isFencedStart && inCodeBlock) {
      result.push(line);
      inCodeBlock = false;
      continue;
    }
    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Handle indented code blocks
    if (isIndented && (prevLineWasBlank || codeBuffer.length > 0)) {
      codeBuffer.push(line.slice(4));  // Remove 4-space indent
    } else {
      if (codeBuffer.length > 0) {
        // End of indented code block - convert to fenced
        result.push('```');
        result.push(...codeBuffer);
        result.push('```');
        codeBuffer = [];
      }
      result.push(line);
    }

    prevLineWasBlank = isBlank;
  }

  // Handle code block at end of file
  if (codeBuffer.length > 0) {
    result.push('```');
    result.push(...codeBuffer);
    result.push('```');
  }

  return result.join('\n');
}

function main() {
  const docsDir = join(process.cwd(), 'docs');
  const files = processDir(docsDir, true);
  let totalFixed = 0;

  for (const filePath of files) {
    const original = readFileSync(filePath, 'utf-8');
    const fixed = fixIndentedCodeBlocks(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
