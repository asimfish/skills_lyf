/**
 * Flow-CLI Integration Tests
 *
 * Tests that verify Scholar correctly receives and uses config paths
 * passed from flow-cli via the --config flag (RFC-001 compliance).
 *
 * These tests simulate the flow-cli → Scholar integration:
 * - flow-cli discovers config at .flow/teach-config.yml
 * - flow-cli passes explicit path via --config flag
 * - Scholar uses explicit path, bypassing its own discovery
 */

// Jest test file - no vitest import needed
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadTeachConfig, getDefaultConfig } from '../../src/teaching/config/loader.js';

describe('Flow-CLI Integration', () => {
  let tempDir;
  let flowCliConfigDir;
  let scholarDiscoveryDir;

  beforeEach(() => {
    // Create temp directories simulating real project structure
    tempDir = join(tmpdir(), `flow-cli-integration-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });

    // Simulate flow-cli's config location (.flow/teach-config.yml)
    flowCliConfigDir = join(tempDir, 'course-project', '.flow');
    mkdirSync(flowCliConfigDir, { recursive: true });

    // Simulate a different directory where Scholar might search
    scholarDiscoveryDir = join(tempDir, 'course-project', 'lectures', 'week03');
    mkdirSync(scholarDiscoveryDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('RFC-001 Compliance: Explicit Config Passing', () => {
    it('should use explicit config path from flow-cli', () => {
      // flow-cli creates config at .flow/teach-config.yml
      const flowCliConfig = join(flowCliConfigDir, 'teach-config.yml');
      writeFileSync(
        flowCliConfig,
        `scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    field: "statistics"
`
      );

      // flow-cli passes explicit path: --config /path/to/.flow/teach-config.yml
      const config = loadTeachConfig(scholarDiscoveryDir, {
        configPath: flowCliConfig
      });

      // Verify Scholar used the explicit path
      expect(config.scholar.course_info.code).toBe('STAT-440');
      expect(config.scholar.course_info.title).toBe('Regression Analysis');
    });

    it('should bypass discovery when explicit path provided', () => {
      // Create a config that would be found by discovery
      const discoveryConfig = join(scholarDiscoveryDir, '..', '..', '.flow');
      mkdirSync(discoveryConfig, { recursive: true });
      writeFileSync(
        join(discoveryConfig, 'teach-config.yml'),
        `scholar:
  course_info:
    code: "DISCOVERED"
    title: "Should Not Be Used"
`
      );

      // Create the config that flow-cli passes explicitly
      const explicitConfig = join(tempDir, 'explicit-config.yml');
      writeFileSync(
        explicitConfig,
        `scholar:
  course_info:
    code: "EXPLICIT"
    title: "Flow-CLI Passed This"
`
      );

      // flow-cli passes explicit path
      const config = loadTeachConfig(scholarDiscoveryDir, {
        configPath: explicitConfig
      });

      // Should use explicit, not discovered
      expect(config.scholar.course_info.code).toBe('EXPLICIT');
      expect(config.scholar.course_info.title).toBe('Flow-CLI Passed This');
    });

    it('should fall back to defaults when explicit path is invalid (non-strict)', () => {
      const nonExistentPath = join(tempDir, 'does-not-exist.yml');

      // Non-strict mode: return defaults
      const config = loadTeachConfig(scholarDiscoveryDir, {
        configPath: nonExistentPath,
        strict: false
      });

      expect(config).toEqual(getDefaultConfig());
    });

    it('should throw when explicit path is invalid (strict mode)', () => {
      const nonExistentPath = join(tempDir, 'does-not-exist.yml');

      // Strict mode: throw error
      expect(() =>
        loadTeachConfig(scholarDiscoveryDir, {
          configPath: nonExistentPath,
          strict: true
        })
      ).toThrow(/Config file not found/);
    });
  });

  describe('Debug Logging', () => {
    it('should log config source when debug enabled', () => {
      const flowCliConfig = join(flowCliConfigDir, 'teach-config.yml');
      writeFileSync(
        flowCliConfig,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      // Capture console.log output
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        loadTeachConfig(scholarDiscoveryDir, {
          configPath: flowCliConfig,
          debug: true
        });

        // Verify debug logs were emitted
        const logOutput = logs.join('\n');
        expect(logOutput).toContain('[scholar:config]');
        expect(logOutput).toContain('Source: explicit');
        expect(logOutput).toContain(flowCliConfig);
      } finally {
        console.log = originalLog;
      }
    });

    it('should log discovered source when no explicit path', () => {
      // Create config at discoverable location
      const discoveryPath = join(scholarDiscoveryDir, '..', '..', '.flow');
      mkdirSync(discoveryPath, { recursive: true });
      writeFileSync(
        join(discoveryPath, 'teach-config.yml'),
        `scholar:
  course_info:
    level: "undergraduate"
`
      );

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      try {
        loadTeachConfig(scholarDiscoveryDir, {
          debug: true
        });

        const logOutput = logs.join('\n');
        expect(logOutput).toContain('[scholar:config]');
        expect(logOutput).toContain('Source: discovered');
      } finally {
        console.log = originalLog;
      }
    });

    it('should respect SCHOLAR_DEBUG environment variable', () => {
      const flowCliConfig = join(flowCliConfigDir, 'teach-config.yml');
      writeFileSync(
        flowCliConfig,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      const logs = [];
      const originalLog = console.log;
      const originalEnv = process.env.SCHOLAR_DEBUG;
      console.log = (...args) => logs.push(args.join(' '));
      process.env.SCHOLAR_DEBUG = 'true';

      try {
        loadTeachConfig(scholarDiscoveryDir, {
          configPath: flowCliConfig
          // debug: false (not passed, but SCHOLAR_DEBUG should trigger)
        });

        const logOutput = logs.join('\n');
        expect(logOutput).toContain('[scholar:config]');
      } finally {
        console.log = originalLog;
        if (originalEnv === undefined) {
          delete process.env.SCHOLAR_DEBUG;
        } else {
          process.env.SCHOLAR_DEBUG = originalEnv;
        }
      }
    });
  });

  describe('Config Ownership Protocol (RFC-001)', () => {
    it('should read flow-cli owned sections', () => {
      const flowCliConfig = join(flowCliConfigDir, 'teach-config.yml');
      writeFileSync(
        flowCliConfig,
        `# Flow-CLI owned sections (read-only for Scholar)
course:
  name: "STAT 440"
  semester: "Spring"
  year: 2026

semester_info:
  start_date: "2026-01-13"
  end_date: "2026-05-01"

# Scholar owned section
scholar:
  course_info:
    level: "undergraduate"
    field: "statistics"
`
      );

      const config = loadTeachConfig(scholarDiscoveryDir, {
        configPath: flowCliConfig
      });

      // Scholar can read flow-cli sections
      expect(config.course?.name).toBe('STAT 440');
      expect(config.semester_info?.start_date).toBe('2026-01-13');

      // Scholar owns its section
      expect(config.scholar.course_info.level).toBe('undergraduate');
    });

    it('should handle config with only scholar section', () => {
      const minimalConfig = join(tempDir, 'minimal.yml');
      writeFileSync(
        minimalConfig,
        `scholar:
  course_info:
    level: "graduate"
`
      );

      const config = loadTeachConfig(scholarDiscoveryDir, {
        configPath: minimalConfig
      });

      expect(config.scholar.course_info.level).toBe('graduate');
      // Defaults should be merged
      expect(config.scholar.course_info.difficulty).toBe('intermediate');
    });
  });

  describe('Lenient Validation', () => {
    it('should warn but not error on unknown fields (non-strict)', () => {
      const configWithUnknown = join(tempDir, 'unknown-fields.yml');
      writeFileSync(
        configWithUnknown,
        `scholar:
  course_info:
    level: "undergraduate"
  custom_field: "should not cause error"
  another_unknown:
    nested: "value"
`
      );

      // Should not throw
      const config = loadTeachConfig(scholarDiscoveryDir, {
        configPath: configWithUnknown,
        strict: false
      });

      // Config should still be usable
      expect(config.scholar.course_info.level).toBe('undergraduate');
      expect(config.scholar.custom_field).toBe('should not cause error');
    });

    it('should warn on invalid enum values (non-strict)', () => {
      const configWithInvalid = join(tempDir, 'invalid-enum.yml');
      writeFileSync(
        configWithInvalid,
        `scholar:
  course_info:
    level: "invalid-level"
`
      );

      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (...args) => warnings.push(args.join(' '));

      try {
        const config = loadTeachConfig(scholarDiscoveryDir, {
          configPath: configWithInvalid,
          strict: false
        });

        // Should have logged warning
        expect(warnings.some((w) => w.includes('validation') || w.includes('level'))).toBe(true);

        // Config should still load with the invalid value
        expect(config.scholar.course_info.level).toBe('invalid-level');
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle flow-cli teach command workflow', () => {
      // Simulate: user runs `teach exam "Midterm"` from lectures/week03/
      // flow-cli finds config at .flow/teach-config.yml
      // flow-cli passes: --config /path/to/.flow/teach-config.yml

      const projectRoot = join(tempDir, 'stat-440');
      const flowConfig = join(projectRoot, '.flow');
      mkdirSync(flowConfig, { recursive: true });

      const userCwd = join(projectRoot, 'lectures', 'week03');
      mkdirSync(userCwd, { recursive: true });

      // flow-cli's config
      writeFileSync(
        join(flowConfig, 'teach-config.yml'),
        `scholar:
  course_info:
    code: "STAT-440"
    title: "Regression Analysis"
    level: "undergraduate"
    field: "statistics"
    difficulty: "intermediate"

  style:
    tone: "formal"
    notation: "statistical"
    examples: true
`
      );

      // flow-cli passes explicit config to Scholar
      const config = loadTeachConfig(userCwd, {
        configPath: join(flowConfig, 'teach-config.yml')
      });

      expect(config.scholar.course_info.code).toBe('STAT-440');
      expect(config.scholar.style.tone).toBe('formal');
    });

    it('should handle CI/CD scenario with absolute paths', () => {
      // CI runner clones repo to /tmp/runner/project/
      // Config is at /tmp/runner/project/.flow/teach-config.yml
      // Script passes absolute path

      const ciProjectRoot = join(tempDir, 'ci-runner', 'project');
      const ciConfig = join(ciProjectRoot, '.flow');
      mkdirSync(ciConfig, { recursive: true });

      writeFileSync(
        join(ciConfig, 'teach-config.yml'),
        `scholar:
  course_info:
    level: "graduate"
`
      );

      // CI script uses absolute path
      const absolutePath = join(ciConfig, 'teach-config.yml');
      const config = loadTeachConfig('/some/other/directory', {
        configPath: absolutePath
      });

      expect(config.scholar.course_info.level).toBe('graduate');
    });
  });
});
