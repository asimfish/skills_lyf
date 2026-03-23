/**
 * Manual e2e test: parser → pre-flight → QTI → validate → emulate
 * Run: node tests/e2e/manual-canvas-pipeline.mjs
 */

import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// ── 1. Parse QMD ──────────────────────────────────────────────────────────────
const { parseExamContent } = await import(`${ROOT}/src/teaching/parsers/qmd-exam.js`);
const { CanvasFormatter } = await import(`${ROOT}/src/teaching/formatters/canvas.js`);
const { runCanvasPreflightValidation } = await import(`${ROOT}/src/teaching/validators/canvas-preflight.js`);

const qmdPath = join(ROOT, 'tests/teaching/fixtures/canvas/mixed-types.qmd');
const content = readFileSync(qmdPath, 'utf-8');

console.log('── Step 1: Parse QMD ───────────────────────────────────────────');
const exam = parseExamContent(content, { splitParts: true, defaultType: 'Essay' });
console.log(`   Title: ${exam.title}`);
console.log(`   Questions: ${exam.questions.length}`);
console.log(`   Total points: ${exam.total_points}`);
const typeCount = {};
exam.questions.forEach(q => { typeCount[q.type] = (typeCount[q.type] || 0) + 1; });
console.log(`   Types: ${Object.entries(typeCount).map(([t,c]) => `${t}(${c})`).join(', ')}`);

// ── 2. Pre-flight validation ───────────────────────────────────────────────────
console.log('\n── Step 1.5: Pre-flight Canvas Validation ──────────────────────');
const { errors: preflightErrors, warnings: preflightWarnings } =
  runCanvasPreflightValidation(exam.questions, exam.answer_key);

preflightWarnings.forEach(w => console.log(`   WARNING: ${w}`));
if (preflightErrors.length > 0) {
  console.log('   ERRORS (would abort in /teaching:canvas):');
  preflightErrors.forEach(e => console.log(`   - ${e}`));
} else if (preflightWarnings.length === 0) {
  console.log('   All questions valid for Canvas import');
}

// ── 3. Convert to QTI ─────────────────────────────────────────────────────────
console.log('\n── Step 2: Convert to QTI ──────────────────────────────────────');
const canvasFormatter = new CanvasFormatter({ debug: false });
const outputPath = join(ROOT, 'tests/e2e/tmp-test-output.qti.zip');

let qtiPath;
try {
  qtiPath = await canvasFormatter.format(exam, {
    output: outputPath,
    sourceDir: ROOT,
    cleanupTemp: true
  });
  console.log(`   QTI package: ${qtiPath}`);
  console.log(`   Exists: ${existsSync(qtiPath)}`);
} catch (err) {
  console.log(`   FAILED: ${err.message}`);
  if (err.message.includes('examark')) {
    console.log('   (examark not installed — install with: npm install -g examark)');
  }
  process.exit(1);
}

// ── 4. Validate QTI ───────────────────────────────────────────────────────────
console.log('\n── Step 3: Validate QTI ────────────────────────────────────────');
const validation = await canvasFormatter.validateQTI(qtiPath);
if (validation.valid) {
  console.log('   QTI validated — ready to import');
} else {
  console.log(`   Validation issues (${validation.errors.length}):`);
  validation.errors.forEach(e => console.log(`   - ${e}`));
}

// ── 5. Emulate Canvas import ──────────────────────────────────────────────────
console.log('\n── Step 4: Emulate Canvas Import ───────────────────────────────');
const emulation = await canvasFormatter.emulateCanvasImport(qtiPath);
if (emulation.success) {
  console.log('   Canvas import simulation passed');
} else {
  console.log(`   Import simulation issues:`);
  console.log(`   ${emulation.error || emulation.output}`);
}

// Cleanup
if (existsSync(qtiPath)) unlinkSync(qtiPath);

console.log('\n── Summary ─────────────────────────────────────────────────────');
console.log(`   Parse:      OK (${exam.questions.length} questions)`);
console.log(`   Pre-flight: ${preflightErrors.length === 0 ? 'OK' : `${preflightErrors.length} error(s)`}`);
console.log(`   QTI gen:    OK`);
console.log(`   Validate:   ${validation.valid ? 'OK' : 'issues found'}`);
console.log(`   Emulate:    ${emulation.success ? 'OK' : 'issues found'}`);
