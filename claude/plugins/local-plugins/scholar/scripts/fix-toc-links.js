#!/usr/bin/env node

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

function generateId(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function fixTocLinks(content) {
  const lines = content.split('\n');
  const headings = new Map();
  const idCounts = {};

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const text = match[2].trim();
      let id = generateId(text);
      if (idCounts[id]) {
        idCounts[id]++;
        id = id + '-' + (idCounts[id] - 1);
      } else {
        idCounts[id] = 1;
      }
      headings.set(text, id);
    }
  }

  const result = [];
  for (const line of lines) {
    let fixedLine = line;
    const linkPattern = /\[([^\]]+)\]\(#([^)]+)\)/g;
    let match;
    while ((match = linkPattern.exec(line)) !== null) {
      const linkText = match[1];
      const fragment = match[2];
      if (headings.has(linkText)) {
        const correctId = headings.get(linkText);
        if (fragment !== correctId) {
          fixedLine = fixedLine.replace('](#' + fragment + ')', '](#' + correctId + ')');
        }
      }
    }
    result.push(fixedLine);
  }
  return result.join('\n');
}

const docsDir = join(process.cwd(), 'docs');
const files = processDir(docsDir, true);
let totalFixed = 0;

for (const filePath of files) {
  const original = readFileSync(filePath, 'utf-8');
  const fixed = fixTocLinks(original);
  if (original !== fixed) {
    writeFileSync(filePath, fixed);
    console.log('Fixed: ' + filePath.replace(process.cwd() + '/', ''));
    totalFixed++;
  }
}

console.log('\nTotal files fixed: ' + totalFixed);
