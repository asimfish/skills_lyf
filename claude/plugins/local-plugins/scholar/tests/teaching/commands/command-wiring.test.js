/**
 * Integration tests for command layer wiring.
 *
 * Verifies that .md skill files in plugin-api/commands/teaching/
 * reference importable modules and that the modules export the
 * expected functions/classes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const COMMANDS_DIR = path.join(ROOT, 'src', 'plugin-api', 'commands', 'teaching');

describe('Command Wiring', () => {
  describe('migrate.md', () => {
    let content;

    beforeAll(() => {
      content = fs.readFileSync(path.join(COMMANDS_DIR, 'migrate.md'), 'utf8');
    });

    it('should reference ManifestMigrator', () => {
      expect(content).toContain('ManifestMigrator');
    });

    it('should reference manifest-migrator.js module path', () => {
      expect(content).toContain('manifest-migrator.js');
    });

    it('should reference BatchMigrator for schema migration', () => {
      expect(content).toContain('BatchMigrator');
    });

    it('should document --to-manifest flag', () => {
      expect(content).toContain('--to-manifest');
    });

    it('should document --defaults flag', () => {
      expect(content).toContain('--defaults');
    });

    it('should document detect mode for --to-manifest', () => {
      expect(content).toContain('--to-manifest --detect');
    });

    it('should document dry-run mode for --to-manifest', () => {
      expect(content).toContain('--to-manifest --dry-run');
    });
  });

  describe('sync.md', () => {
    let content;

    beforeAll(() => {
      content = fs.readFileSync(path.join(COMMANDS_DIR, 'sync.md'), 'utf8');
    });

    it('should reference ManifestSyncEngine', () => {
      expect(content).toContain('ManifestSyncEngine');
    });

    it('should reference manifest-sync.js module path', () => {
      expect(content).toContain('manifest-sync.js');
    });

    it('should reference ConfigSyncEngine for YAML sync', () => {
      expect(content).toContain('ConfigSyncEngine');
    });

    it('should document --manifest flag', () => {
      expect(content).toContain('--manifest');
    });

    it('should document --strategy flag', () => {
      expect(content).toContain('--strategy');
    });

    it('should document --theirs flag', () => {
      expect(content).toContain('--theirs');
    });

    it('should document conflict resolution strategies', () => {
      expect(content).toContain('ours');
      expect(content).toContain('theirs');
    });
  });

  describe('demo.md', () => {
    let content;

    beforeAll(() => {
      content = fs.readFileSync(path.join(COMMANDS_DIR, 'demo.md'), 'utf8');
    });

    it('should reference scaffoldFlowDirectory', () => {
      expect(content).toContain('scaffoldFlowDirectory');
    });

    it('should reference demo-scaffold.js module path', () => {
      expect(content).toContain('demo-scaffold.js');
    });

    it('should reference generateManifestFromConfig', () => {
      expect(content).toContain('generateManifestFromConfig');
    });

    it('should include lesson-plans.yml in directory structure', () => {
      expect(content).toContain('lesson-plans.yml');
    });
  });

  describe('Module imports', () => {
    it('should import ManifestMigrator', async () => {
      const { ManifestMigrator } = await import(
        '../../../src/teaching/validators/manifest-migrator.js'
      );
      expect(ManifestMigrator).toBeDefined();
      expect(typeof ManifestMigrator).toBe('function');
    });

    it('should import ManifestSyncEngine', async () => {
      const { ManifestSyncEngine } = await import(
        '../../../src/teaching/config/manifest-sync.js'
      );
      expect(ManifestSyncEngine).toBeDefined();
      expect(typeof ManifestSyncEngine).toBe('function');
    });

    it('should import scaffoldFlowDirectory', async () => {
      const { scaffoldFlowDirectory } = await import(
        '../../../src/teaching/commands/demo-scaffold.js'
      );
      expect(scaffoldFlowDirectory).toBeDefined();
      expect(typeof scaffoldFlowDirectory).toBe('function');
    });

    it('should import generateManifestFromConfig', async () => {
      const { generateManifestFromConfig } = await import(
        '../../../src/teaching/utils/manifest-generator.js'
      );
      expect(generateManifestFromConfig).toBeDefined();
      expect(typeof generateManifestFromConfig).toBe('function');
    });

    it('should import ManifestMigrator with correct methods', async () => {
      const { ManifestMigrator } = await import(
        '../../../src/teaching/validators/manifest-migrator.js'
      );
      const migrator = new ManifestMigrator({ courseRoot: '/tmp/test' });
      expect(typeof migrator.detectWeekFiles).toBe('function');
      expect(typeof migrator.previewMigration).toBe('function');
      expect(typeof migrator.migrate).toBe('function');
      expect(typeof migrator.fillDefaults).toBe('function');
    });

    it('should import ManifestSyncEngine with correct methods', async () => {
      const { ManifestSyncEngine } = await import(
        '../../../src/teaching/config/manifest-sync.js'
      );
      const engine = new ManifestSyncEngine({ courseRoot: '/tmp/test' });
      expect(typeof engine.loadSyncPair).toBe('function');
      expect(typeof engine.computeWeekDiff).toBe('function');
      expect(typeof engine.mergeManifests).toBe('function');
      expect(typeof engine.writeMergedManifest).toBe('function');
      expect(typeof engine.storeBaseHash).toBe('function');
      expect(typeof engine.getBaseHash).toBe('function');
    });
  });

  describe('Command file structure', () => {
    const commandFiles = ['migrate.md', 'sync.md', 'demo.md'];

    for (const file of commandFiles) {
      describe(file, () => {
        let content;

        beforeAll(() => {
          content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf8');
        });

        it('should have frontmatter with name', () => {
          expect(content).toMatch(/^---\nname:/);
        });

        it('should have frontmatter with description', () => {
          expect(content).toMatch(/description:/);
        });

        it('should have <system> implementation section', () => {
          expect(content).toContain('<system>');
          expect(content).toContain('</system>');
        });

        it('should have ## Implementation heading', () => {
          expect(content).toContain('## Implementation');
        });
      });
    }
  });
});
