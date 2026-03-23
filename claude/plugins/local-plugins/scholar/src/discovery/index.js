/**
 * Discovery Engine for Scholar Hub
 *
 * Scans command .md files in src/plugin-api/commands/, parses YAML frontmatter,
 * derives categories from directory structure, and caches results to JSON.
 *
 * @module discovery
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, basename, dirname, resolve } from 'path';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Root of the plugin-api commands directory (relative to project root). */
const COMMANDS_REL = 'src/plugin-api/commands';

/** Cache file path (relative to project root). */
const CACHE_REL = 'src/discovery/cache.json';

/**
 * Directories that map to the "teaching" top-level category.
 * Everything else rolls up to "research".
 */
const TEACHING_DIRS = new Set(['teaching']);

/**
 * Subcategory mapping for research commands.
 * Key = directory name under commands/, value = subcategory label.
 */
const RESEARCH_SUBCATEGORY_MAP = {
  research: 'planning',
  manuscript: 'manuscript',
  literature: 'literature',
  simulation: 'simulation',
};

/**
 * Subcategory mapping for teaching commands.
 * Key = subcategory label, value = list of command base names (without .md).
 */
const TEACHING_SUBCATEGORY_MAP = {
  content: ['exam', 'quiz', 'slides', 'assignment', 'syllabus', 'lecture', 'solution', 'validate-r', 'canvas'],
  assessment: ['rubric', 'feedback'],
  config: ['validate', 'diff', 'sync', 'migrate', 'demo', 'config', 'preflight'],
};

/**
 * Inverted index: command base name -> teaching subcategory.
 * Built once from TEACHING_SUBCATEGORY_MAP.
 */
const TEACHING_CMD_TO_SUBCATEGORY = Object.create(null);
for (const [subcategory, commands] of Object.entries(TEACHING_SUBCATEGORY_MAP)) {
  for (const cmd of commands) {
    TEACHING_CMD_TO_SUBCATEGORY[cmd] = subcategory;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the project root directory.
 * Walks up from this file's location until we find package.json.
 *
 * @returns {string} Absolute path to project root.
 */
function getProjectRoot() {
  let dir = dirname(new URL(import.meta.url).pathname);
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  // Fallback: two levels up from src/discovery/
  return resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
}

/**
 * Parse YAML frontmatter from a markdown string.
 *
 * Expects the file to start with `---`, followed by YAML, followed by `---`.
 *
 * @param {string} content - Raw file content.
 * @returns {{ frontmatter: object, body: string }} Parsed frontmatter and remaining body.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  let frontmatter;
  try {
    frontmatter = yaml.load(match[1]) || {};
  } catch {
    frontmatter = {};
  }
  return { frontmatter, body: match[2] };
}

/**
 * Extract the Usage line from the markdown body.
 *
 * Looks for a line starting with `**Usage:**` (possibly inside a code block on
 * the next line) or a fenced block immediately following a `**Usage:**` header.
 *
 * @param {string} body - Markdown body (after frontmatter).
 * @returns {string|null} The usage string, or null if not found.
 */
function extractUsage(body) {
  // Pattern 1: **Usage:** `/command arg` (inline, possibly with backticks)
  const inlineMatch = body.match(/\*\*Usage:\*\*\s*`?([^`\n]+)`?/);
  if (inlineMatch) {
    return inlineMatch[1].trim();
  }

  // Pattern 2: **Usage:** followed by a fenced code block
  const blockMatch = body.match(/\*\*Usage:\*\*\s*\r?\n```[^\n]*\r?\n([\s\S]*?)```/);
  if (blockMatch) {
    return blockMatch[1].trim();
  }

  return null;
}

/**
 * Extract 1-2 example invocations from the markdown body.
 *
 * Looks for an **Examples:** section and pulls example lines that start with
 * `- ` or `/` (inside a code block).
 *
 * @param {string} body - Markdown body (after frontmatter).
 * @returns {string[]} Array of example strings (max 2).
 */
function extractExamples(body) {
  const examples = [];

  // Pattern 1: **Examples:** followed by bullet list with backtick-wrapped commands
  const bulletMatch = body.match(/\*\*Examples:\*\*\s*\r?\n((?:\s*-\s+.+\r?\n?)+)/);
  if (bulletMatch) {
    const lines = bulletMatch[1].split('\n');
    for (const line of lines) {
      if (examples.length >= 2) break;
      const m = line.match(/^\s*-\s+`?([^`\n]+)`?\s*$/);
      if (m) {
        examples.push(m[1].trim());
      }
    }
    if (examples.length > 0) return examples;
  }

  // Pattern 2: **Examples:** followed by fenced code block
  const fencedMatch = body.match(/\*\*Examples:\*\*\s*\r?\n```[^\n]*\r?\n([\s\S]*?)```/);
  if (fencedMatch) {
    const lines = fencedMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (examples.length >= 2) break;
      // Skip comment lines
      if (line.startsWith('#')) continue;
      examples.push(line);
    }
    return examples;
  }

  return examples;
}

/**
 * Extract flags/options from the markdown body.
 *
 * Looks for an **Options:** section and parses flag definitions.
 *
 * @param {string} body - Markdown body (after frontmatter).
 * @returns {Array<{name: string, short: string|null, description: string, takesValue: boolean}>}
 */
function extractFlags(body) {
  const flags = [];

  // Match **Options:** section followed by bullet list
  const optionsMatch = body.match(
    /\*\*Options:\*\*\s*\r?\n((?:\s*-\s+.+\r?\n?)+)/
  );
  if (!optionsMatch) return flags;

  const lines = optionsMatch[1].split('\n');
  for (const line of lines) {
    // Pattern: - `--name VALUE` / `-s` - Description
    const m = line.match(
      /^\s*-\s+`([^`]+)`(?:\s*\/\s*`([^`]+)`)?\s*-\s+(.+)$/
    );
    if (m) {
      const longFlag = m[1].trim();
      const shortFlag = m[2]?.trim() || null;
      const description = m[3].trim();
      // Uppercase word (VALUE), quote ("text"), or @ (@file) after a space signals a value-taking flag.
      // All .md files use uppercase placeholders by convention (e.g., --questions N, --format FORMAT).
      const takesValue = /\s+[A-Z"@]/.test(longFlag);

      flags.push({
        name: longFlag.replace(/\s+.*/, ''),  // --instructions
        short: shortFlag?.replace(/\s+.*/, '') || null,  // -i
        description,
        takesValue,
      });
    }
  }

  return flags;
}

/**
 * Check whether a flags array includes -i / --instructions support.
 *
 * @param {Array<{name: string, short: string|null}>} flags
 * @returns {boolean}
 */
function hasInstructionsFlag(flags) {
  return flags.some(
    f => f.name === '--instructions' || f.short === '-i' ||
         f.name === '-i' || f.short === '--instructions'
  );
}

/**
 * Derive the top-level category from the directory name.
 *
 * @param {string} dirName - Immediate parent directory name (e.g. "teaching", "research").
 * @returns {"research"|"teaching"} The category.
 */
function deriveCategory(dirName) {
  return TEACHING_DIRS.has(dirName) ? 'teaching' : 'research';
}

/**
 * Derive the subcategory for a command.
 *
 * @param {string} category - "research" or "teaching".
 * @param {string} dirName - Immediate parent directory name.
 * @param {string} cmdBaseName - Base filename without extension (e.g. "exam").
 * @returns {string} Subcategory label.
 */
function deriveSubcategory(category, dirName, cmdBaseName) {
  if (category === 'research') {
    return RESEARCH_SUBCATEGORY_MAP[dirName] || dirName;
  }
  // Teaching
  return TEACHING_CMD_TO_SUBCATEGORY[cmdBaseName] || 'other';
}

// ---------------------------------------------------------------------------
// Core scanning
// ---------------------------------------------------------------------------

/**
 * Scan all .md command files, parse frontmatter, and return structured data.
 *
 * Each entry contains:
 * - name: command name from frontmatter (e.g. "research:analysis-plan")
 * - description: one-line description from frontmatter
 * - category: "research" or "teaching"
 * - subcategory: e.g. "planning", "content", "config"
 * - directory: immediate parent dir name (e.g. "research", "teaching")
 * - file: relative path from project root
 * - usage: extracted usage line (or null)
 * - examples: up to 2 example invocations
 *
 * @returns {object[]} Array of command metadata objects.
 */
export function discoverCommands() {
  const root = getProjectRoot();
  const commandsDir = join(root, COMMANDS_REL);

  if (!existsSync(commandsDir)) {
    return [];
  }

  const commands = [];
  // Only scan subdirectories — root-level files (e.g., hub.md) are excluded by design
  const subdirs = readdirSync(commandsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dirName of subdirs) {
    const subPath = join(commandsDir, dirName);
    const files = readdirSync(subPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = join(subPath, file);
      const content = readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);

      const cmdBaseName = basename(file, '.md');
      const category = deriveCategory(dirName);
      const subcategory = deriveSubcategory(category, dirName, cmdBaseName);

      const flags = extractFlags(body);

      commands.push({
        name: frontmatter.name || `${dirName}:${cmdBaseName}`,
        description: frontmatter.description || '',
        category,
        subcategory,
        directory: dirName,
        file: join(COMMANDS_REL, dirName, file),
        usage: extractUsage(body),
        examples: extractExamples(body),
        flags,
        hasInstructions: hasInstructionsFlag(flags),
      });
    }
  }

  // Sort by category then name for deterministic output
  commands.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  return commands;
}

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------

/** Current cache format version. Bump when the cache schema changes. */
const CACHE_VERSION = 2;

/**
 * Count all .md command files in subdirectories of the commands directory.
 *
 * @param {string} commandsDir - Absolute path to the commands directory.
 * @returns {number} Total number of .md files found.
 */
function countCommandFiles(commandsDir) {
  let count = 0;
  const subdirs = readdirSync(commandsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dirName of subdirs) {
    try {
      const files = readdirSync(join(commandsDir, dirName)).filter(f => f.endsWith('.md'));
      count += files.length;
    } catch {
      // Skip unreadable directories
    }
  }
  return count;
}

/**
 * Check whether the cache file is still fresh.
 *
 * The cache is considered stale when:
 * - The cache file does not exist or is unreadable
 * - The cache version does not match CACHE_VERSION
 * - The number of .md command files has changed (detects additions/deletions)
 * - Any .md command file has a modification time newer than the cache file
 *
 * @param {string} cacheFile - Absolute path to cache.json.
 * @param {string} commandsDir - Absolute path to the commands directory.
 * @returns {boolean} True if cache exists and is up to date.
 */
function isCacheFresh(cacheFile, commandsDir) {
  if (!existsSync(cacheFile)) {
    return false;
  }

  let cacheMtime;
  try {
    cacheMtime = statSync(cacheFile).mtimeMs;
  } catch {
    return false;
  }

  // Check version and file count from cache metadata
  try {
    const raw = readFileSync(cacheFile, 'utf-8');
    const cached = JSON.parse(raw);
    if (cached.version !== CACHE_VERSION) return false;
    if (cached.fileCount !== countCommandFiles(commandsDir)) return false;
  } catch {
    return false;
  }

  // Walk all subdirs and check every .md file for mtime
  const subdirs = readdirSync(commandsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dirName of subdirs) {
    const subPath = join(commandsDir, dirName);
    let files;
    try {
      files = readdirSync(subPath).filter(f => f.endsWith('.md'));
    } catch {
      continue;
    }
    for (const file of files) {
      const fileMtime = statSync(join(subPath, file)).mtimeMs;
      if (fileMtime > cacheMtime) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Return cached command data if fresh, otherwise regenerate and persist.
 *
 * On first call (or when any .md file is newer than the cache), runs
 * `discoverCommands()`, writes the result to `src/discovery/cache.json`,
 * and returns the data.
 *
 * @returns {object[]} Array of command metadata objects.
 */
export function loadCachedCommands() {
  const root = getProjectRoot();
  const cacheFile = join(root, CACHE_REL);
  const commandsDir = join(root, COMMANDS_REL);

  if (isCacheFresh(cacheFile, commandsDir)) {
    try {
      const raw = readFileSync(cacheFile, 'utf-8');
      const cached = JSON.parse(raw);
      return cached.commands || cached; // Support both new and legacy format
    } catch {
      // Corrupted cache, fall through to regenerate
    }
  }

  // Regenerate
  const commands = discoverCommands();

  // Write cache with metadata for staleness detection
  try {
    const cacheData = {
      version: CACHE_VERSION,
      fileCount: countCommandFiles(commandsDir),
      commands,
    };
    writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf-8');
  } catch {
    // Non-fatal: cache write may fail in read-only environments
  }

  return commands;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Return aggregate counts of research and teaching commands.
 *
 * @returns {{ research: number, teaching: number, total: number }}
 */
export function getCommandStats() {
  const commands = loadCachedCommands();
  const research = commands.filter(c => c.category === 'research').length;
  const teaching = commands.filter(c => c.category === 'teaching').length;
  return { research, teaching, total: research + teaching };
}

/**
 * Return commands in a given category, grouped by subcategory.
 *
 * @param {"research"|"teaching"} category - Top-level category.
 * @returns {Object<string, object[]>} Map of subcategory -> array of commands.
 */
export function getCategoryInfo(category) {
  const commands = loadCachedCommands();
  const filtered = commands.filter(c => c.category === category);

  const grouped = Object.create(null);
  for (const cmd of filtered) {
    if (!grouped[cmd.subcategory]) {
      grouped[cmd.subcategory] = [];
    }
    grouped[cmd.subcategory].push(cmd);
  }

  return grouped;
}

/**
 * Return full metadata for a single command.
 *
 * Accepts either the full frontmatter name (e.g. "research:analysis-plan")
 * or just the base name (e.g. "analysis-plan", "exam").
 *
 * When requesting detail, the markdown body is re-parsed to extract usage
 * and examples fresh (in case the cached data was built without them).
 *
 * @param {string} commandName - Full or partial command name.
 * @returns {object|null} Full command metadata including usage and examples,
 *   or null if not found.
 */
export function getCommandDetail(commandName) {
  const commands = loadCachedCommands();

  // Try exact match on frontmatter name first
  let cmd = commands.find(c => c.name === commandName);

  // Try matching on the last segment (base name)
  if (!cmd) {
    cmd = commands.find(c => {
      const parts = c.name.split(':');
      return parts[parts.length - 1] === commandName;
    });
  }

  // Try partial / fuzzy match as last resort
  if (!cmd) {
    cmd = commands.find(c => c.name.includes(commandName));
  }

  if (!cmd) {
    return null;
  }

  // Re-read the source file to get full detail (usage, examples)
  const root = getProjectRoot();
  const filePath = join(root, cmd.file);

  if (!existsSync(filePath)) {
    return { ...cmd };
  }

  const content = readFileSync(filePath, 'utf-8');
  const { body } = parseFrontmatter(content);

  const flags = extractFlags(body);

  return {
    name: cmd.name,
    description: cmd.description,
    category: cmd.category,
    subcategory: cmd.subcategory,
    directory: cmd.directory,
    file: cmd.file,
    usage: extractUsage(body),
    examples: extractExamples(body),
    flags,
    hasInstructions: hasInstructionsFlag(flags),
  };
}
