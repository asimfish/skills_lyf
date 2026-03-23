#!/usr/bin/env node

/**
 * Convert MkDocs admonitions to regular markdown blockquotes
 * Admonition syntax: !!! type "title"
 *     content indented by 4 spaces
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const TYPE_EMOJI = {
  'note': '📝',
  'tip': '💡',
  'warning': '⚠️',
  'danger': '🚨',
  'success': '✅',
  'info': 'ℹ️',
  'example': '📋',
  'question': '❓',
  'quote': '💬',
  'abstract': '📄',
  'bug': '🐛',
  'failure': '❌',
};

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

function convertAdmonitions(content) {
  const lines = content.split('\n');
  const result = [];
  let inAdmonition = false;
  let admonitionTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for admonition header: !!! type "title" or !!! type
    const admonitionMatch = line.match(/^!!!\s+(\w+)(?:\s+"(.+?)")?/);

    if (admonitionMatch) {
      const type = admonitionMatch[1].toLowerCase();
      const title = admonitionMatch[2] || type.charAt(0).toUpperCase() + type.slice(1);
      const emoji = TYPE_EMOJI[type] || '📌';

      // Start blockquote with title
      result.push(`> **${emoji} ${title}**`);
      result.push('>');
      inAdmonition = true;
      admonitionTitle = title;
      continue;
    }

    if (inAdmonition) {
      // Check if line is indented (part of admonition content)
      if (line.startsWith('    ')) {
        // Remove 4-space indent and add blockquote prefix
        const unindented = line.slice(4);
        result.push(`> ${unindented}`);
      } else if (line.trim() === '') {
        // Empty line inside admonition
        result.push('>');
      } else {
        // Non-indented, non-empty line - end of admonition
        inAdmonition = false;
        result.push('');  // Add blank line after blockquote
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

    // Only process files that have admonitions
    if (!original.includes('!!! ')) {
      continue;
    }

    const fixed = convertAdmonitions(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
