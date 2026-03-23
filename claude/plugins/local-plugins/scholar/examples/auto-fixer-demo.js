#!/usr/bin/env node
/**
 * Auto-fixer Demo
 *
 * Demonstrates the auto-fixer capabilities for scholar v2.3.0
 *
 * Usage:
 *   node examples/auto-fixer-demo.js
 */

import { createAutoFixer } from '../src/teaching/validators/auto-fixer.js';
import yaml from 'js-yaml';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('');
  log('='.repeat(70), 'cyan');
  log(title, 'bright');
  log('='.repeat(70), 'cyan');
  console.log('');
}

// ============================================================================
// Demo 1: QW1 - Syntax Auto-fix (Safe, Auto-apply)
// ============================================================================

section('Demo 1: QW1 - Syntax Auto-fix (Safe, Auto-apply)');

const syntaxErrorYaml = `
week: 1
title: "Introduction to Statistics"

content:
   topics:
      - "Descriptive Statistics"
      - 'Probability Basics'
   objectives:
    - "Understand mean and median"
    - 'Calculate variance'

   materials:
    - Textbook Chapter 1
    -  "Lecture slides"
`;

log('Original YAML (with inconsistent indentation and trailing whitespace):', 'yellow');
console.log(syntaxErrorYaml);

const fixer = createAutoFixer();
const syntaxResult = fixer.fixSyntaxErrors(syntaxErrorYaml);

if (syntaxResult.success) {
  log('✅ Syntax fixes applied automatically:', 'green');
  syntaxResult.changes.forEach((change) => {
    console.log(`  - ${change}`);
  });

  log('\nFixed YAML:', 'yellow');
  console.log(syntaxResult.fixed);
} else {
  log(`❌ Error: ${syntaxResult.error}`, 'red');
  log(`Hint: ${syntaxResult.hint}`, 'yellow');
}

// ============================================================================
// Demo 2: M1.1 - Schema Violation Fixes (Requires Confirmation)
// ============================================================================

section('Demo 2: M1.1 - Schema Violation Fixes (Requires Confirmation)');

const schemaViolationYaml = `
week: 1
title: "Introduction to Statistics"

content:
  topics:
    - "Descriptive Statistics"
`;

log('Original YAML (missing required fields):', 'yellow');
console.log(schemaViolationYaml);

const data = yaml.load(schemaViolationYaml);

// Simulate schema errors from ajv
const schemaErrors = [
  {
    keyword: 'required',
    params: { missingProperty: 'schema_version' },
    instancePath: '',
  },
  {
    keyword: 'required',
    params: { missingProperty: 'learning_objectives' },
    instancePath: '/content',
  },
];

const schema = {
  type: 'object',
  required: ['schema_version'],
  properties: {
    schema_version: { type: 'string', default: '2.0' },
    content: {
      type: 'object',
      required: ['learning_objectives'],
    },
  },
};

const schemaFixes = fixer.fixSchemaViolations(data, schemaErrors, schema);

log(`\n⚠️  Found ${schemaFixes.length} schema violations (require confirmation):`, 'yellow');
schemaFixes.forEach((fix, i) => {
  console.log(`\nFix #${i + 1}: ${fix.description}`);
  console.log(`  Type: ${fix.type}`);
  console.log(`  Safe: ${fix.safe ? '✓' : '✗ (requires confirmation)'}`);
  console.log(`  Before: ${fix.before}`);
  console.log(`  After: ${fix.after}`);
});

// Simulate applying fixes
log('\nSimulating user confirmation and applying fixes...', 'cyan');
schemaFixes.forEach((fix) => (fix.applied = true));
const fixedData = fixer.applyFixes(data, schemaFixes);

log('\nFixed YAML:', 'green');
console.log(yaml.dump(fixedData, { indent: 2 }));

// ============================================================================
// Demo 3: M1.2 - Type Conversion Fixes (Requires Confirmation)
// ============================================================================

section('Demo 3: M1.2 - Type Conversion Fixes (Requires Confirmation)');

const typeErrorYaml = `
schema_version: "2.0"
metadata:
  week: "1"

content:
  topics: "Descriptive Statistics, Probability"
  learning_objectives:
    - "Understand statistics"
  materials: "Textbook Chapter 1"
`;

log('Original YAML (type mismatches):', 'yellow');
console.log(typeErrorYaml);

const typeData = yaml.load(typeErrorYaml);

// Simulate type errors from ajv
const typeErrors = [
  {
    keyword: 'type',
    params: { type: 'number' },
    instancePath: '/metadata/week',
  },
  {
    keyword: 'type',
    params: { type: 'array' },
    instancePath: '/content/topics',
  },
  {
    keyword: 'type',
    params: { type: 'array' },
    instancePath: '/content/materials',
  },
];

const typeFixes = fixer.fixTypeErrors(typeData, typeErrors);

log(`\n⚠️  Found ${typeFixes.length} type mismatches (require confirmation):`, 'yellow');
typeFixes.forEach((fix, i) => {
  console.log(`\nFix #${i + 1}: ${fix.description}`);
  console.log(`  Before: ${fix.before}`);
  console.log(`  After: ${fix.after}`);
});

// Apply fixes
log('\nApplying type conversions...', 'cyan');
typeFixes.forEach((fix) => (fix.applied = true));
const typeFixedData = fixer.applyFixes(typeData, typeFixes);

log('\nFixed YAML:', 'green');
console.log(yaml.dump(typeFixedData, { indent: 2 }));

// ============================================================================
// Demo 4: M1.3 - Deprecated Field Migration (v1 → v2)
// ============================================================================

section('Demo 4: M1.3 - Deprecated Field Migration (v1 → v2)');

const v1Yaml = `
week: 1
date: "2026-01-15"

topics:
  - "Introduction to Linear Models"
  - "Simple Regression"

objectives:
  - "Understand linear relationships"
  - "Fit regression models"

materials: "Textbook Chapter 3"

teaching_style: "interactive"
assessment_type: "formative"
`;

log('Original v1 YAML (deprecated fields):', 'yellow');
console.log(v1Yaml);

const v1Data = yaml.load(v1Yaml);

const deprecatedFixes = fixer.fixDeprecatedFields(v1Data);

log(`\n⚠️  Found ${deprecatedFixes.length} deprecated fields (v1 → v2 migration):`, 'yellow');
deprecatedFixes.forEach((fix, i) => {
  console.log(`\nFix #${i + 1}: ${fix.description}`);
  console.log(`  Before: ${fix.before}`);
  console.log(`  After: ${fix.after}`);
});

// Apply migration
log('\nApplying v1 → v2 migration...', 'cyan');
deprecatedFixes.forEach((fix) => (fix.applied = true));
const v2Data = fixer.applyFixes(v1Data, deprecatedFixes);

log('\nMigrated v2 YAML:', 'green');
console.log(yaml.dump(v2Data, { indent: 2 }));

// ============================================================================
// Demo 5: Complete Workflow (All Fix Types)
// ============================================================================

section('Demo 5: Complete Workflow (Syntax + Schema + Type + Deprecated)');

const messyYaml = `
week: "1"
topics: "Statistics, Probability"
objectives:
   - "Learn basics"

materials: Textbook Ch 1

teaching_style: "interactive"
`;

log('Original messy YAML:', 'yellow');
console.log(messyYaml);

// Get all fixes
const allSchemaErrors = [
  {
    keyword: 'required',
    params: { missingProperty: 'schema_version' },
    instancePath: '',
  },
  {
    keyword: 'type',
    params: { type: 'number' },
    instancePath: '/week',
  },
  {
    keyword: 'type',
    params: { type: 'array' },
    instancePath: '/topics',
  },
];

const allFixes = fixer.getAllFixes(messyYaml, allSchemaErrors, schema);

log('\nFixes Summary:', 'cyan');
console.log(`  Syntax fixes: ${allFixes.syntax ? allFixes.syntax.changes.length : 0} changes`);
console.log(`  Schema fixes: ${allFixes.schema.length} fixes`);
console.log(`  Type fixes: ${allFixes.type.length} fixes`);
console.log(`  Deprecated fixes: ${allFixes.deprecated.length} fixes`);

// Apply all safe fixes (syntax)
if (allFixes.syntax && allFixes.syntax.success) {
  log('\n✅ Applied syntax fixes automatically', 'green');
  const parsedData = yaml.load(allFixes.syntax.fixed);

  // Mark all other fixes for confirmation
  const allOtherFixes = [
    ...allFixes.schema,
    ...allFixes.type,
    ...allFixes.deprecated,
  ];

  log(`\n⚠️  ${allOtherFixes.length} fixes require confirmation:`, 'yellow');
  allOtherFixes.forEach((fix, i) => {
    console.log(`  ${i + 1}. [${fix.type}] ${fix.description}`);
  });

  // Simulate confirmation and apply
  log('\nApplying all fixes...', 'cyan');
  allOtherFixes.forEach((fix) => (fix.applied = true));
  const fullyFixed = fixer.applyFixes(parsedData, allOtherFixes);

  log('\nFully Fixed YAML:', 'green');
  console.log(yaml.dump(fullyFixed, { indent: 2 }));
}

// ============================================================================
// Summary
// ============================================================================

section('Summary');

log('Auto-fixer Features:', 'bright');
console.log('  ✓ QW1: Syntax auto-fix (safe, no confirmation)');
console.log('  ✓ M1.1: Schema violation fixes (requires confirmation)');
console.log('  ✓ M1.2: Type conversion fixes (requires confirmation)');
console.log('  ✓ M1.3: Deprecated field migration (requires confirmation)');
console.log('');
log('All demos completed successfully!', 'green');
console.log('');
