/**
 * Validators Module - Public API
 *
 * Exports all validation-related functionality
 */

export { ValidatorEngine, createValidator, validate } from './engine.js';
export { runCanvasPreflightValidation } from './canvas-preflight.js';
export { validateLatex } from './latex.js';
export { ConfigValidator } from './config-validator.js';
export { AutoFixer, createAutoFixer } from './auto-fixer.js';
export {
  migrationRules,
  getMigrationComplexity,
  getComplexityDescription,
} from './migration-rules.js';
export {
  extractRChunks,
  shouldValidateChunk,
  buildValidationScript,
  parseValidationOutput,
  scanDataFiles,
  formatValidationReport,
  extractSummaryAndChunks,
  findMatchingLecture,
  findMatchingLab,
  suggestPackageInstall,
  lintRChunk,
  parseChunkOptions,
} from './r-code.js';
