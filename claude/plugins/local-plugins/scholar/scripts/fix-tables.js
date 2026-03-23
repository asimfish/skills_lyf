#!/usr/bin/env node

/**
 * Fix markdown table formatting for MD060 compliance
 * Normalizes tables to "aligned" style with proper spacing
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIRS = [
  join(process.cwd(), 'docs'),
  join(process.cwd(), 'docs', 'specs'),
  join(process.cwd(), 'docs', 'architecture')
];

// Calculate visual width considering emoji and special characters
function visualWidth(str) {
  // Regex to match emoji and other wide characters
  // Includes: checkmarks, x marks, various emoji ranges
  const wideCharRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2000}-\u{206F}]|[\u{2500}-\u{25FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{274C}]|[\u{2705}]|[\u{2713}]|[\u{2714}]|[\u{2717}]|[\u{2718}]/gu;

  // Count wide characters (each may take extra space)
  let wideCount = 0;
  const matches = str.match(wideCharRegex);
  if (matches) {
    wideCount = matches.length;
  }

  // String length plus extra width for wide characters
  return str.length + wideCount;
}

function normalizeTable(tableLines) {
  // Parse table to get column widths
  const rows = tableLines.map(line => {
    // Split by | and trim each cell
    const cells = line.split('|').slice(1, -1);  // Remove empty first/last from split
    return cells.map(cell => cell.trim());
  });

  if (rows.length < 2) return tableLines;

  // Calculate max width for each column (using visual width)
  const numCols = rows[0].length;
  const colWidths = Array(numCols).fill(0);

  for (const row of rows) {
    for (let i = 0; i < numCols && i < row.length; i++) {
      // Skip separator row for width calculation
      if (!row[i].match(/^-+$/)) {
        colWidths[i] = Math.max(colWidths[i], visualWidth(row[i]));
      }
    }
  }

  // Ensure minimum width of 3 for separator
  for (let i = 0; i < colWidths.length; i++) {
    colWidths[i] = Math.max(colWidths[i], 3);
  }

  // Rebuild table with aligned spacing
  const result = [];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const cells = [];

    for (let i = 0; i < numCols; i++) {
      const cell = row[i] || '';
      const width = colWidths[i];

      if (rowIdx === 1 && cell.match(/^-+$/)) {
        // Separator row - use dashes
        cells.push('-'.repeat(width));
      } else {
        // Content row - pad with spaces (accounting for visual width)
        const visualLen = visualWidth(cell);
        const padding = Math.max(0, width - visualLen);
        cells.push(cell + ' '.repeat(padding));
      }
    }

    result.push('| ' + cells.join(' | ') + ' |');
  }

  return result;
}

function processMarkdown(content) {
  const lines = content.split('\n');
  const result = [];
  let tableBuffer = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

    if (isTableLine) {
      if (!inTable) {
        inTable = true;
        tableBuffer = [];
      }
      tableBuffer.push(line);
    } else {
      if (inTable) {
        // End of table - process it
        const normalized = normalizeTable(tableBuffer);
        result.push(...normalized);
        tableBuffer = [];
        inTable = false;
      }
      result.push(line);
    }
  }

  // Handle table at end of file
  if (inTable && tableBuffer.length > 0) {
    const normalized = normalizeTable(tableBuffer);
    result.push(...normalized);
  }

  return result.join('\n');
}

function main() {
  let totalFixed = 0;

  for (const dir of DIRS) {
    try {
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const filePath = join(dir, file);
        const original = readFileSync(filePath, 'utf-8');
        const fixed = processMarkdown(original);

        if (original !== fixed) {
          writeFileSync(filePath, fixed);
          console.log(`Fixed: ${filePath.replace(process.cwd() + '/', '')}`);
          totalFixed++;
        }
      }
    } catch (e) {
      console.warn(`Skipping ${dir}: ${e.message}`);
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

main();
