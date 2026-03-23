#!/usr/bin/env node

/**
 * Scholar Pre-Commit Hook Setup Script
 *
 * Installs the pre-commit hook to automatically sync YAML → JSON.
 *
 * Usage:
 *   node scripts/setup-hooks.js           # Install hook
 *   node scripts/setup-hooks.js --uninstall  # Remove hook
 *   node scripts/setup-hooks.js --status     # Check hook status
 *   node scripts/setup-hooks.js --force      # Overwrite existing hook
 *
 * Features:
 *   - Handles worktree setups (finds main repo's .git/hooks/)
 *   - Colorful CLI output
 *   - Cross-platform (macOS/Linux)
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, chmodSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// CLI arguments
const args = process.argv.slice(2);
const uninstall = args.includes('--uninstall') || args.includes('-u');
const showStatus = args.includes('--status') || args.includes('-s');
const forceInstall = args.includes('--force') || args.includes('-f');
const help = args.includes('--help') || args.includes('-h');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Styled output helpers
const styled = {
  success: (msg) => `${colors.green}${colors.bold}✓${colors.reset} ${colors.green}${msg}${colors.reset}`,
  error: (msg) => `${colors.red}${colors.bold}✗${colors.reset} ${colors.red}${msg}${colors.reset}`,
  warning: (msg) => `${colors.yellow}${colors.bold}⚠${colors.reset} ${colors.yellow}${msg}${colors.reset}`,
  info: (msg) => `${colors.cyan}${colors.bold}ℹ${colors.reset} ${colors.cyan}${msg}${colors.reset}`,
  header: (msg) => `\n${colors.bold}${colors.magenta}━━━ ${msg} ━━━${colors.reset}\n`,
  dim: (msg) => `${colors.dim}${msg}${colors.reset}`,
  highlight: (msg) => `${colors.bold}${colors.white}${msg}${colors.reset}`,
};

/**
 * Print usage help
 */
function printHelp() {
  console.log(`
${colors.bold}${colors.cyan}Scholar Pre-Commit Hook Setup${colors.reset}

${colors.bold}Usage:${colors.reset}
  node scripts/setup-hooks.js [options]

${colors.bold}Options:${colors.reset}
  ${colors.green}--help, -h${colors.reset}       Show this help message
  ${colors.green}--status, -s${colors.reset}     Check if hook is installed
  ${colors.green}--uninstall, -u${colors.reset}  Remove the pre-commit hook
  ${colors.green}--force, -f${colors.reset}      Overwrite existing hook without asking

${colors.bold}What it does:${colors.reset}
  Installs a pre-commit hook that automatically syncs YAML → JSON
  configuration files before each commit. This ensures your JSON
  files are always up-to-date with their YAML sources.

${colors.bold}Hook features:${colors.reset}
  - Validates YAML syntax before sync
  - Auto-stages generated JSON files
  - Supports --validate flag for full validation
  - Skips when no YAML files are staged

${colors.bold}Examples:${colors.reset}
  ${colors.dim}# Install the hook${colors.reset}
  node scripts/setup-hooks.js

  ${colors.dim}# Check current status${colors.reset}
  node scripts/setup-hooks.js --status

  ${colors.dim}# Force reinstall${colors.reset}
  node scripts/setup-hooks.js --force

  ${colors.dim}# Remove the hook${colors.reset}
  node scripts/setup-hooks.js --uninstall
`);
}

/**
 * Find the git directory (handles worktrees)
 * @returns {Object} Git directory info
 */
function findGitDir() {
  const gitPath = join(projectRoot, '.git');

  if (!existsSync(gitPath)) {
    return { found: false, error: 'Not a git repository' };
  }

  const stat = statSync(gitPath);

  if (stat.isDirectory()) {
    // Regular git repository
    return {
      found: true,
      gitDir: gitPath,
      hooksDir: join(gitPath, 'hooks'),
      isWorktree: false,
    };
  }

  if (stat.isFile()) {
    // Worktree - .git is a file pointing to the main repo
    try {
      const content = readFileSync(gitPath, 'utf8').trim();
      // Format: "gitdir: /path/to/main/.git/worktrees/name"
      const match = content.match(/^gitdir:\s*(.+)$/);

      if (match) {
        const worktreeGitDir = resolve(projectRoot, match[1]);

        // Find the main .git directory (go up from worktrees/<name>)
        const mainGitDir = dirname(dirname(worktreeGitDir));

        return {
          found: true,
          gitDir: worktreeGitDir,
          mainGitDir: mainGitDir,
          hooksDir: join(mainGitDir, 'hooks'),
          isWorktree: true,
        };
      }
    } catch (err) {
      return { found: false, error: `Failed to read .git file: ${err.message}` };
    }
  }

  return { found: false, error: 'Unknown .git format' };
}

/**
 * Check if our hook is installed
 * @param {string} hookPath - Path to pre-commit hook
 * @returns {Object} Hook status
 */
function checkHookStatus(hookPath) {
  if (!existsSync(hookPath)) {
    return { installed: false, isOurs: false };
  }

  try {
    const content = readFileSync(hookPath, 'utf8');
    const isOurs = content.includes('Scholar Pre-Commit Hook') ||
                   content.includes('scholar-sync') ||
                   content.includes('sync-yaml.js');

    return {
      installed: true,
      isOurs,
      content,
    };
  } catch (err) {
    return { installed: true, isOurs: false, error: err.message };
  }
}

/**
 * Prompt user for confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} User's answer
 */
function askQuestion(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Show hook status
 */
async function showHookStatus() {
  console.log(styled.header('Scholar Hook Status'));

  const gitInfo = findGitDir();

  if (!gitInfo.found) {
    console.log(styled.error(gitInfo.error));
    process.exit(1);
  }

  console.log(styled.info(`Git directory: ${styled.dim(gitInfo.gitDir)}`));

  if (gitInfo.isWorktree) {
    console.log(styled.info(`Worktree detected`));
    console.log(styled.info(`Main repo hooks: ${styled.dim(gitInfo.hooksDir)}`));
  }

  const hookPath = join(gitInfo.hooksDir, 'pre-commit');
  const status = checkHookStatus(hookPath);

  console.log('');

  if (!status.installed) {
    console.log(styled.warning('Pre-commit hook is NOT installed'));
    console.log(styled.dim('  Run: node scripts/setup-hooks.js'));
  } else if (status.isOurs) {
    console.log(styled.success('Scholar pre-commit hook is installed'));
    console.log(styled.dim(`  Location: ${hookPath}`));
  } else {
    console.log(styled.warning('A different pre-commit hook is installed'));
    console.log(styled.dim('  Use --force to overwrite, or manually integrate'));
  }
}

/**
 * Install the pre-commit hook
 */
async function installHook() {
  console.log(styled.header('Installing Scholar Pre-Commit Hook'));

  // Find git directory
  const gitInfo = findGitDir();

  if (!gitInfo.found) {
    console.log(styled.error(gitInfo.error));
    process.exit(1);
  }

  if (gitInfo.isWorktree) {
    console.log(styled.info('Worktree detected'));
    console.log(styled.dim(`  Installing to main repo: ${gitInfo.mainGitDir}`));
  }

  // Ensure hooks directory exists
  const hooksDir = gitInfo.hooksDir;
  if (!existsSync(hooksDir)) {
    console.log(styled.error(`Hooks directory not found: ${hooksDir}`));
    process.exit(1);
  }

  // Check for existing hook
  const hookPath = join(hooksDir, 'pre-commit');
  const status = checkHookStatus(hookPath);

  if (status.installed && !forceInstall) {
    if (status.isOurs) {
      console.log(styled.success('Scholar hook is already installed!'));
      console.log(styled.dim('  Use --force to reinstall'));
      return;
    }

    console.log(styled.warning('A pre-commit hook already exists'));
    console.log(styled.dim(`  Location: ${hookPath}`));

    const overwrite = await askQuestion('Overwrite existing hook? (y/n)');

    if (!overwrite) {
      console.log(styled.info('Installation cancelled'));
      return;
    }
  }

  // Read the hook template
  const templatePath = join(__dirname, 'pre-commit-hook.sh');

  if (!existsSync(templatePath)) {
    console.log(styled.error(`Hook template not found: ${templatePath}`));
    process.exit(1);
  }

  const hookContent = readFileSync(templatePath, 'utf8');

  // Write the hook
  try {
    writeFileSync(hookPath, hookContent, { mode: 0o755 });
    chmodSync(hookPath, 0o755);

    console.log(styled.success('Pre-commit hook installed!'));
    console.log(styled.dim(`  Location: ${hookPath}`));
    console.log('');
    console.log(styled.info('The hook will:'));
    console.log(styled.dim('  • Validate YAML syntax before sync'));
    console.log(styled.dim('  • Sync YAML → JSON for staged files'));
    console.log(styled.dim('  • Auto-stage generated JSON files'));
    console.log('');
    console.log(styled.info('Hook options:'));
    console.log(styled.dim('  • SCHOLAR_VALIDATE=1 git commit  # Full validation'));
    console.log(styled.dim('  • git commit --no-verify          # Skip hook'));
  } catch (err) {
    console.log(styled.error(`Failed to install hook: ${err.message}`));
    process.exit(1);
  }
}

/**
 * Uninstall the pre-commit hook
 */
async function uninstallHook() {
  console.log(styled.header('Uninstalling Scholar Pre-Commit Hook'));

  const gitInfo = findGitDir();

  if (!gitInfo.found) {
    console.log(styled.error(gitInfo.error));
    process.exit(1);
  }

  const hookPath = join(gitInfo.hooksDir, 'pre-commit');
  const status = checkHookStatus(hookPath);

  if (!status.installed) {
    console.log(styled.info('No pre-commit hook is installed'));
    return;
  }

  if (!status.isOurs && !forceInstall) {
    console.log(styled.warning('The installed hook is not from Scholar'));

    const remove = await askQuestion('Remove anyway? (y/n)');

    if (!remove) {
      console.log(styled.info('Uninstall cancelled'));
      return;
    }
  }

  try {
    unlinkSync(hookPath);
    console.log(styled.success('Pre-commit hook removed'));
    console.log(styled.dim(`  Was at: ${hookPath}`));
  } catch (err) {
    console.log(styled.error(`Failed to remove hook: ${err.message}`));
    process.exit(1);
  }
}

// Main execution
async function main() {
  if (help) {
    printHelp();
    return;
  }

  if (showStatus) {
    await showHookStatus();
    return;
  }

  if (uninstall) {
    await uninstallHook();
    return;
  }

  await installHook();
}

main().catch((err) => {
  console.log(styled.error(`Unexpected error: ${err.message}`));
  process.exit(1);
});
