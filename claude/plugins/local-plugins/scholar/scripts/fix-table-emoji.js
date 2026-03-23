#!/usr/bin/env node

/**
 * Replace emoji in tables with text equivalents for consistent alignment
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const EMOJI_MAP = {
  '✅': 'Yes',
  '❌': 'No',
  '✓': 'Yes',
  '✗': 'No',
  '⚠️': 'Warn',
  '🔄': 'Sync',
  '📁': 'Dir',
  '📄': 'File',
  '🔧': 'Tool',
  '⚡': 'Fast',
  '🎯': 'Target',
  '💡': 'Tip',
  '🚀': 'New',
  '⏱️': 'Time',
  '👨‍🏫': 'Teach',
  '🔬': 'Research',
  '⚙️': 'Config',
  '🧠': 'Brain',
  '❓': '?',
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

function replaceEmojiInTables(content) {
  const lines = content.split('\n');
  const result = [];
  let inTable = false;

  for (const line of lines) {
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

    if (isTableLine) {
      inTable = true;
      let fixedLine = line;

      // Replace emoji only in table lines
      for (const [emoji, text] of Object.entries(EMOJI_MAP)) {
        fixedLine = fixedLine.split(emoji).join(text);
      }

      result.push(fixedLine);
    } else {
      if (inTable && line.trim() === '') {
        inTable = false;
      }
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
    const fixed = replaceEmojiInTables(original);

    if (original !== fixed) {
      writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
      totalFixed++;
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
