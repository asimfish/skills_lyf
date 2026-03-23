/**
 * Unit Tests for Diff Engine
 *
 * Tests YAML vs JSON comparison and change detection.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigDiffEngine, createDiffEngine, compareFile } from '../../src/teaching/config/diff-engine.js';

describe('ConfigDiffEngine', () => {
  let tempDir;
  let engine;

  beforeEach(() => {
    tempDir = join(tmpdir(), `diff-engine-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    engine = new ConfigDiffEngine({ cwd: tempDir });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create engine with default options', () => {
      const e = new ConfigDiffEngine();
      expect(e.options.cwd).toBe(process.cwd());
    });

    it('should accept custom options', () => {
      const e = new ConfigDiffEngine({ cwd: tempDir, ignoreOrder: true });
      expect(e.options.cwd).toBe(tempDir);
      expect(e.options.ignoreOrder).toBe(true);
    });
  });

  describe('getJsonPath', () => {
    it('should convert .yml to .json', () => {
      expect(engine.getJsonPath('/path/file.yml')).toBe('/path/file.json');
    });

    it('should convert .yaml to .json', () => {
      expect(engine.getJsonPath('/path/file.yaml')).toBe('/path/file.json');
    });
  });

  describe('compareFile - in sync', () => {
    it('should report in sync when files match', () => {
      const yamlPath = join(tempDir, 'config.yml');
      const jsonPath = join(tempDir, 'config.json');

      writeFileSync(yamlPath, 'key: value\nnumber: 42');
      writeFileSync(jsonPath, JSON.stringify({ key: 'value', number: 42 }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it('should handle nested objects', () => {
      const yamlPath = join(tempDir, 'nested.yml');
      const jsonPath = join(tempDir, 'nested.json');

      writeFileSync(yamlPath, 'parent:\n  child:\n    key: value');
      writeFileSync(jsonPath, JSON.stringify({ parent: { child: { key: 'value' } } }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(true);
    });

    it('should handle arrays', () => {
      const yamlPath = join(tempDir, 'arrays.yml');
      const jsonPath = join(tempDir, 'arrays.json');

      writeFileSync(yamlPath, 'items:\n  - one\n  - two\n  - three');
      writeFileSync(jsonPath, JSON.stringify({ items: ['one', 'two', 'three'] }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(true);
    });
  });

  describe('compareFile - out of sync', () => {
    it('should detect value changes', () => {
      const yamlPath = join(tempDir, 'changed.yml');
      const jsonPath = join(tempDir, 'changed.json');

      writeFileSync(yamlPath, 'version: 2');
      writeFileSync(jsonPath, JSON.stringify({ version: 1 }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      expect(result.differences).toHaveLength(1);
      expect(result.differences[0].type).toBe('changed');
      expect(result.differences[0].path).toBe('version');
      expect(result.differences[0].yamlValue).toBe(2);
      expect(result.differences[0].jsonValue).toBe(1);
    });

    it('should detect added keys in JSON', () => {
      const yamlPath = join(tempDir, 'added.yml');
      const jsonPath = join(tempDir, 'added.json');

      writeFileSync(yamlPath, 'key: value');
      writeFileSync(jsonPath, JSON.stringify({ key: 'value', extra: 'added' }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      const addedDiff = result.differences.find(d => d.type === 'added');
      expect(addedDiff).toBeDefined();
      expect(addedDiff.path).toBe('extra');
    });

    it('should detect removed keys from JSON', () => {
      const yamlPath = join(tempDir, 'removed.yml');
      const jsonPath = join(tempDir, 'removed.json');

      writeFileSync(yamlPath, 'key1: value1\nkey2: value2');
      writeFileSync(jsonPath, JSON.stringify({ key1: 'value1' }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      const removedDiff = result.differences.find(d => d.type === 'removed');
      expect(removedDiff).toBeDefined();
      expect(removedDiff.path).toBe('key2');
    });

    it('should detect type changes', () => {
      const yamlPath = join(tempDir, 'type.yml');
      const jsonPath = join(tempDir, 'type.json');

      writeFileSync(yamlPath, 'value: "42"'); // String
      writeFileSync(jsonPath, JSON.stringify({ value: 42 }, null, 2)); // Number

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      const typeChangedDiff = result.differences.find(d => d.type === 'type-changed');
      expect(typeChangedDiff).toBeDefined();
    });

    it('should detect array length changes', () => {
      const yamlPath = join(tempDir, 'array-len.yml');
      const jsonPath = join(tempDir, 'array-len.json');

      writeFileSync(yamlPath, 'items:\n  - one\n  - two\n  - three');
      writeFileSync(jsonPath, JSON.stringify({ items: ['one', 'two'] }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
    });

    it('should detect nested changes', () => {
      const yamlPath = join(tempDir, 'nested-change.yml');
      const jsonPath = join(tempDir, 'nested-change.json');

      writeFileSync(yamlPath, 'parent:\n  child:\n    key: new-value');
      writeFileSync(jsonPath, JSON.stringify({
        parent: { child: { key: 'old-value' } }
      }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      const changedDiff = result.differences.find(d => d.path === 'parent.child.key');
      expect(changedDiff).toBeDefined();
    });
  });

  describe('compareFile - missing files', () => {
    it('should handle missing YAML file', () => {
      const result = engine.compareFile(join(tempDir, 'missing.yml'));

      expect(result.inSync).toBe(false);
      expect(result.error || result.differences[0].yamlValue).toBeTruthy();
    });

    it('should handle missing JSON file', () => {
      const yamlPath = join(tempDir, 'no-json.yml');
      writeFileSync(yamlPath, 'key: value');

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      expect(result.status).toBe('never-synced');
    });

    it('should handle invalid YAML', () => {
      const yamlPath = join(tempDir, 'invalid.yml');
      const jsonPath = join(tempDir, 'invalid.json');

      writeFileSync(yamlPath, 'invalid: yaml: {{{{');
      writeFileSync(jsonPath, '{}');

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      expect(result.error).toContain('YAML');
    });

    it('should handle invalid JSON', () => {
      const yamlPath = join(tempDir, 'badjson.yml');
      const jsonPath = join(tempDir, 'badjson.json');

      writeFileSync(yamlPath, 'key: value');
      writeFileSync(jsonPath, 'not valid json');

      const result = engine.compareFile(yamlPath);

      expect(result.inSync).toBe(false);
      expect(result.error).toContain('JSON');
    });
  });

  describe('stats calculation', () => {
    it('should calculate correct stats', () => {
      const yamlPath = join(tempDir, 'stats.yml');
      const jsonPath = join(tempDir, 'stats.json');

      writeFileSync(yamlPath, 'added: new\nchanged: two\nremoved: gone');
      writeFileSync(jsonPath, JSON.stringify({
        extra: 'in-json',
        changed: 'one'
      }, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.stats.added).toBeGreaterThan(0);
      expect(result.stats.removed).toBeGreaterThan(0);
      expect(result.stats.changed).toBeGreaterThan(0);
    });
  });

  describe('line number mapping', () => {
    it('should include line numbers in differences', () => {
      const yamlPath = join(tempDir, 'lines.yml');
      const jsonPath = join(tempDir, 'lines.json');

      writeFileSync(yamlPath, `key1: value1
key2: value2
key3: changed`);
      writeFileSync(jsonPath, JSON.stringify({
        key1: 'value1',
        key2: 'value2',
        key3: 'original'
      }, null, 2));

      const result = engine.compareFile(yamlPath);

      const changedDiff = result.differences.find(d => d.path === 'key3');
      expect(changedDiff).toBeDefined();
      expect(changedDiff.line).toBeGreaterThan(0);
    });
  });

  describe('formatDiff', () => {
    it('should format added diff', () => {
      const output = engine.formatDiff({
        path: 'key',
        type: 'added',
        yamlValue: undefined,
        jsonValue: 'value'
      }, { color: false });

      expect(output).toContain('+');
      expect(output).toContain('added');
    });

    it('should format removed diff', () => {
      const output = engine.formatDiff({
        path: 'key',
        type: 'removed',
        yamlValue: 'value',
        jsonValue: undefined
      }, { color: false });

      expect(output).toContain('-');
      expect(output).toContain('missing');
    });

    it('should format changed diff', () => {
      const output = engine.formatDiff({
        path: 'key',
        type: 'changed',
        yamlValue: 'old',
        jsonValue: 'new'
      }, { color: false });

      expect(output).toContain('~');
      expect(output).toContain('old');
      expect(output).toContain('new');
    });

    it('should format type-changed diff', () => {
      const output = engine.formatDiff({
        path: 'key',
        type: 'type-changed',
        yamlValue: '42',
        jsonValue: 42
      }, { color: false });

      expect(output).toContain('!');
      expect(output).toContain('type');
    });
  });

  describe('formatResult', () => {
    it('should format in-sync result', () => {
      const yamlPath = join(tempDir, 'sync.yml');
      const jsonPath = join(tempDir, 'sync.json');

      writeFileSync(yamlPath, 'key: value');
      writeFileSync(jsonPath, JSON.stringify({ key: 'value' }, null, 2));

      const result = engine.compareFile(yamlPath);
      const output = engine.formatResult(result, { color: false });

      expect(output).toContain('In sync');
    });

    it('should format out-of-sync result', () => {
      const yamlPath = join(tempDir, 'out.yml');
      const jsonPath = join(tempDir, 'out.json');

      writeFileSync(yamlPath, 'key: new');
      writeFileSync(jsonPath, JSON.stringify({ key: 'old' }, null, 2));

      const result = engine.compareFile(yamlPath);
      const output = engine.formatResult(result, { color: false });

      expect(output).toContain('Out of sync');
      expect(output).toContain('sync');
    });
  });

  describe('convenience functions', () => {
    it('createDiffEngine should return instance', () => {
      const e = createDiffEngine();
      expect(e).toBeInstanceOf(ConfigDiffEngine);
    });

    it('compareFile should compare single file', () => {
      const yamlPath = join(tempDir, 'conv.yml');
      const jsonPath = join(tempDir, 'conv.json');

      writeFileSync(yamlPath, 'key: value');
      writeFileSync(jsonPath, JSON.stringify({ key: 'value' }, null, 2));

      const result = compareFile(yamlPath, { cwd: tempDir });

      expect(result.inSync).toBe(true);
    });
  });

  describe('performance', () => {
    it('should compare within 50ms', () => {
      const yamlPath = join(tempDir, 'perf.yml');
      const jsonPath = join(tempDir, 'perf.json');

      const data = {
        learning_objectives: Array.from({ length: 10 }, (_, i) => ({
          id: `LO-1.${i}`,
          level: 'understand',
          description: `Objective ${i}`
        })),
        topics: Array.from({ length: 10 }, (_, i) => ({
          id: `T-1.${i}`,
          name: `Topic ${i}`,
          subtopics: ['a', 'b', 'c']
        }))
      };

      // Write YAML representation
      let yamlContent = 'learning_objectives:\n';
      data.learning_objectives.forEach(lo => {
        yamlContent += `  - id: "${lo.id}"\n    level: "${lo.level}"\n    description: "${lo.description}"\n`;
      });
      yamlContent += 'topics:\n';
      data.topics.forEach(t => {
        yamlContent += `  - id: "${t.id}"\n    name: "${t.name}"\n    subtopics:\n      - a\n      - b\n      - c\n`;
      });

      writeFileSync(yamlPath, yamlContent);
      writeFileSync(jsonPath, JSON.stringify(data, null, 2));

      const result = engine.compareFile(yamlPath);

      expect(result.duration).toBeLessThan(50);
    });
  });
});
