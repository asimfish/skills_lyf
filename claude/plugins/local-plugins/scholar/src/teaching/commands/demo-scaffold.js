/**
 * Demo course scaffolding
 *
 * Creates a complete .flow/ directory structure for the demo course,
 * including teach-config.yml and a full lesson-plans.yml manifest
 * with detailed weeks + draft stubs.
 *
 * @module teaching/commands/demo-scaffold
 */

import { existsSync, readFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { generateManifestFromConfig } from '../utils/manifest-generator.js';
import { safeWriteYaml } from '../utils/safe-write.js';
import { validateManifest } from '../utils/manifest-validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'demo-templates');

/**
 * Scaffold the full .flow/ directory at a target path.
 *
 * Creates:
 * - targetPath/.flow/teach-config.yml (copied from demo template)
 * - targetPath/.flow/lesson-plans.yml (generated with stubs)
 * - targetPath/README.md, TEST-CHECKLIST.md, sample-student-work.md
 * - targetPath/examples/ (copied from demo templates)
 *
 * @param {Object} options
 * @param {string} options.targetPath - Course root directory to scaffold
 * @param {boolean} [options.force=false] - Overwrite existing files
 * @param {boolean} [options.dryRun=false] - Preview without writing
 * @returns {Promise<ScaffoldResult>}
 *
 * @typedef {Object} ScaffoldResult
 * @property {boolean} success
 * @property {string[]} filesCreated
 * @property {string[]} filesSkipped
 * @property {number} weekStubsGenerated
 * @property {string[]} warnings
 */
export async function scaffoldFlowDirectory({ targetPath, force = false, dryRun = false } = {}) {
  const filesCreated = [];
  const filesSkipped = [];
  const warnings = [];

  if (!targetPath) {
    return { success: false, filesCreated, filesSkipped, weekStubsGenerated: 0, warnings: ['No target path specified'] };
  }

  // Step 1: Create directory structure
  const flowDir = join(targetPath, '.flow');
  const examplesDir = join(targetPath, 'examples');

  if (!dryRun) {
    mkdirSync(flowDir, { recursive: true });
    mkdirSync(examplesDir, { recursive: true });
  }

  // Step 2: Copy teach-config.yml
  const configSource = join(TEMPLATES_DIR, 'teach-config.yml');
  const configTarget = join(flowDir, 'teach-config.yml');

  if (existsSync(configTarget) && !force) {
    filesSkipped.push('.flow/teach-config.yml');
  } else if (!dryRun) {
    copyFileSync(configSource, configTarget);
    filesCreated.push('.flow/teach-config.yml');
  } else {
    filesCreated.push('.flow/teach-config.yml');
  }

  // Step 3: Generate lesson-plans.yml manifest
  const templateManifestPath = join(TEMPLATES_DIR, 'lesson-plans.yml');
  let templateManifest;
  let teachConfig;
  try {
    templateManifest = yaml.load(readFileSync(templateManifestPath, 'utf8'));
  } catch (err) {
    return { success: false, filesCreated, filesSkipped, weekStubsGenerated: 0, warnings: [`Failed to read template manifest: ${err.message}`] };
  }
  try {
    teachConfig = yaml.load(readFileSync(configSource, 'utf8'));
  } catch (err) {
    return { success: false, filesCreated, filesSkipped, weekStubsGenerated: 0, warnings: [`Failed to read teach config: ${err.message}`] };
  }

  // Extract existing weeks from the template (weeks 1-3)
  const existingWeeks = templateManifest.weeks || [];
  const milestones = (templateManifest.semester && templateManifest.semester.milestones) || [];

  const { manifest, yaml: manifestYaml } = generateManifestFromConfig({
    teachConfig: teachConfig.scholar,
    totalWeeks: templateManifest.semester?.total_weeks || 15,
    schedule: templateManifest.semester?.schedule || 'TR',
    milestones,
    existingWeeks
  });

  // Validate generated manifest
  const { valid, errors: validationErrors } = validateManifest(manifest);
  if (!valid) {
    warnings.push(`Generated manifest has validation issues: ${validationErrors.join('; ')}`);
  }

  // Count stubs (weeks beyond existing template weeks)
  const weekStubsGenerated = manifest.weeks.length - existingWeeks.length;

  // Write manifest
  const manifestTarget = join(flowDir, 'lesson-plans.yml');
  if (existsSync(manifestTarget) && !force) {
    filesSkipped.push('.flow/lesson-plans.yml');
  } else if (!dryRun) {
    safeWriteYaml(manifestTarget, manifestYaml, { backup: force });
    filesCreated.push('.flow/lesson-plans.yml');
  } else {
    filesCreated.push('.flow/lesson-plans.yml');
  }

  // Step 4: Copy remaining template files
  const rootTemplates = ['README.md', 'TEST-CHECKLIST.md', 'sample-student-work.md'];
  for (const file of rootTemplates) {
    const source = join(TEMPLATES_DIR, file);
    const target = join(targetPath, file);
    if (!existsSync(source)) continue;

    if (existsSync(target) && !force) {
      filesSkipped.push(file);
    } else if (!dryRun) {
      copyFileSync(source, target);
      filesCreated.push(file);
    } else {
      filesCreated.push(file);
    }
  }

  // Step 5: Copy example files
  const examplesSource = join(TEMPLATES_DIR, 'examples');
  if (existsSync(examplesSource)) {
    const exampleFiles = readdirSync(examplesSource);
    for (const file of exampleFiles) {
      const source = join(examplesSource, file);
      const target = join(examplesDir, file);

      if (existsSync(target) && !force) {
        filesSkipped.push(`examples/${file}`);
      } else if (!dryRun) {
        copyFileSync(source, target);
        filesCreated.push(`examples/${file}`);
      } else {
        filesCreated.push(`examples/${file}`);
      }
    }
  }

  return {
    success: true,
    filesCreated,
    filesSkipped,
    weekStubsGenerated,
    warnings
  };
}
