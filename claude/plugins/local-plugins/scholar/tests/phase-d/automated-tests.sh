#!/bin/bash
# Automated Test Suite for Scholar Phase D - GitHub Actions Integration
# Generated: 2026-01-15
#
# Tests:
#   - D1: Pre-commit hook setup script (setup-hooks.js)
#   - D2: GitHub Action workflow (scholar-validate.yml)
#   - D3: CI validation jobs (ci.yml)
#
# Usage:
#   bash tests/phase-d/automated-tests.sh
#   bash tests/phase-d/automated-tests.sh --verbose
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
SKIP=0
TOTAL=0

# Verbose mode
VERBOSE="${1:-}"

# Project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

# Log file
LOG_FILE="$SCRIPT_DIR/logs/automated-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$SCRIPT_DIR/logs"

# Logging
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

log_verbose() {
    if [ "$VERBOSE" = "--verbose" ] || [ "$VERBOSE" = "-v" ]; then
        echo -e "${DIM}$@${NC}" | tee -a "$LOG_FILE"
    fi
}

# Test runner
run_test() {
    local name="$1"
    local cmd="$2"
    local expected_exit="${3:-0}"
    local expected_pattern="${4:-}"

    TOTAL=$((TOTAL + 1))
    printf "${CYAN}TEST %02d:${NC} %-50s " "$TOTAL" "$name"

    # Run command and capture output
    local output
    local exit_code
    output=$(eval "$cmd" 2>&1) && exit_code=0 || exit_code=$?

    # Log output
    log_verbose "Command: $cmd"
    log_verbose "Exit code: $exit_code (expected: $expected_exit)"
    log_verbose "Output: $output"

    # Check exit code
    if [ "$exit_code" -ne "$expected_exit" ]; then
        echo -e "${RED}FAIL${NC} (exit $exit_code, expected $expected_exit)"
        log "FAIL: $name - wrong exit code ($exit_code vs $expected_exit)"
        FAIL=$((FAIL + 1))
        return 1
    fi

    # Check pattern if provided
    if [ -n "$expected_pattern" ]; then
        if ! echo "$output" | grep -qE "$expected_pattern"; then
            echo -e "${RED}FAIL${NC} (pattern not found)"
            log "FAIL: $name - pattern '$expected_pattern' not found"
            log "Output was: $output"
            FAIL=$((FAIL + 1))
            return 1
        fi
    fi

    echo -e "${GREEN}PASS${NC}"
    log "PASS: $name"
    PASS=$((PASS + 1))
    return 0
}

# Skip test
skip_test() {
    local name="$1"
    local reason="${2:-}"

    TOTAL=$((TOTAL + 1))
    SKIP=$((SKIP + 1))
    printf "${CYAN}TEST %02d:${NC} %-50s " "$TOTAL" "$name"
    echo -e "${YELLOW}SKIP${NC} ${DIM}($reason)${NC}"
    log "SKIP: $name - $reason"
}

# File existence check
check_file() {
    local name="$1"
    local path="$2"

    TOTAL=$((TOTAL + 1))
    printf "${CYAN}TEST %02d:${NC} %-50s " "$TOTAL" "$name"

    if [ -f "$path" ]; then
        echo -e "${GREEN}PASS${NC}"
        log "PASS: $name - file exists"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (file not found)"
        log "FAIL: $name - $path not found"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# Check file is executable
check_executable() {
    local name="$1"
    local path="$2"

    TOTAL=$((TOTAL + 1))
    printf "${CYAN}TEST %02d:${NC} %-50s " "$TOTAL" "$name"

    if [ -x "$path" ]; then
        echo -e "${GREEN}PASS${NC}"
        log "PASS: $name - file is executable"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (not executable)"
        log "FAIL: $name - $path not executable"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# Check file contains pattern
check_pattern() {
    local name="$1"
    local path="$2"
    local pattern="$3"

    TOTAL=$((TOTAL + 1))
    printf "${CYAN}TEST %02d:${NC} %-50s " "$TOTAL" "$name"

    if grep -qE "$pattern" "$path" 2>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        log "PASS: $name - pattern found"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (pattern not found)"
        log "FAIL: $name - pattern '$pattern' not in $path"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# Validate YAML syntax
check_yaml_syntax() {
    local name="$1"
    local path="$2"

    TOTAL=$((TOTAL + 1))
    printf "${CYAN}TEST %02d:${NC} %-50s " "$TOTAL" "$name"

    if node -e "require('js-yaml').load(require('fs').readFileSync('$path', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        log "PASS: $name - valid YAML"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC} (invalid YAML)"
        log "FAIL: $name - $path has YAML syntax errors"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# Header
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}  Phase D: GitHub Actions - Automated Test Suite   ${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
log "Test run started: $(date)"
log "Project root: $PROJECT_ROOT"
echo ""

# ============================================================================
# D1: Pre-Commit Hook Setup Script Tests
# ============================================================================
echo -e "${BOLD}${CYAN}D1: Pre-Commit Hook Setup Script${NC}"
echo -e "${DIM}────────────────────────────────────────────────────${NC}"

# File existence
check_file "setup-hooks.js exists" "scripts/setup-hooks.js"
check_executable "setup-hooks.js is executable" "scripts/setup-hooks.js"

# Shebang check
check_pattern "setup-hooks.js has node shebang" "scripts/setup-hooks.js" "^#!/usr/bin/env node"

# ES module syntax
check_pattern "setup-hooks.js uses ES modules" "scripts/setup-hooks.js" "^import.*from"

# CLI options
check_pattern "setup-hooks.js has --help" "scripts/setup-hooks.js" "(-h|--help)"
check_pattern "setup-hooks.js has --status" "scripts/setup-hooks.js" "(-s|--status)"
check_pattern "setup-hooks.js has --uninstall" "scripts/setup-hooks.js" "(-u|--uninstall)"
check_pattern "setup-hooks.js has --force" "scripts/setup-hooks.js" "(-f|--force)"

# Node syntax check
run_test "setup-hooks.js syntax valid" "node --check scripts/setup-hooks.js"

# Help output
run_test "setup-hooks.js --help works" "node scripts/setup-hooks.js --help" 0 "Scholar Pre-Commit Hook"

# Status check (non-destructive)
run_test "setup-hooks.js --status works" "node scripts/setup-hooks.js --status" 0 "Scholar Hook Status"

echo ""

# ============================================================================
# D1: Pre-Commit Hook Shell Script Tests
# ============================================================================
echo -e "${BOLD}${CYAN}D1: Pre-Commit Hook Shell Script${NC}"
echo -e "${DIM}────────────────────────────────────────────────────${NC}"

# File existence
check_file "pre-commit-hook.sh exists" "scripts/pre-commit-hook.sh"
check_executable "pre-commit-hook.sh is executable" "scripts/pre-commit-hook.sh"

# Bash shebang
check_pattern "pre-commit-hook.sh has bash shebang" "scripts/pre-commit-hook.sh" "^#!/bin/bash"

# Bash syntax check
run_test "pre-commit-hook.sh syntax valid" "bash -n scripts/pre-commit-hook.sh"

# Key features
check_pattern "pre-commit-hook.sh detects staged YAML" "scripts/pre-commit-hook.sh" "git diff --cached.*name-only"
check_pattern "pre-commit-hook.sh handles worktrees" "scripts/pre-commit-hook.sh" "commondir|worktree"
check_pattern "pre-commit-hook.sh stages JSON files" "scripts/pre-commit-hook.sh" "git add.*json"
check_pattern "pre-commit-hook.sh supports SCHOLAR_VALIDATE" "scripts/pre-commit-hook.sh" "SCHOLAR_VALIDATE"

echo ""

# ============================================================================
# D2: GitHub Action Workflow Tests
# ============================================================================
echo -e "${BOLD}${CYAN}D2: GitHub Action Workflow${NC}"
echo -e "${DIM}────────────────────────────────────────────────────${NC}"

# File existence
check_file "scholar-validate.yml exists" ".github/workflows/scholar-validate.yml"

# YAML syntax
check_yaml_syntax "scholar-validate.yml valid YAML" ".github/workflows/scholar-validate.yml"

# Workflow structure
check_pattern "Has workflow name" ".github/workflows/scholar-validate.yml" "^name:"
check_pattern "Has on: triggers" ".github/workflows/scholar-validate.yml" "^on:"
check_pattern "Has jobs: section" ".github/workflows/scholar-validate.yml" "^jobs:"

# Triggers
check_pattern "Triggers on push" ".github/workflows/scholar-validate.yml" "push:"
check_pattern "Triggers on pull_request" ".github/workflows/scholar-validate.yml" "pull_request:"
check_pattern "Has workflow_dispatch" ".github/workflows/scholar-validate.yml" "workflow_dispatch:"

# Jobs
check_pattern "Has validate-configs job" ".github/workflows/scholar-validate.yml" "validate-configs:"
check_pattern "Has sync-check job" ".github/workflows/scholar-validate.yml" "sync-check:"
check_pattern "Has summary job" ".github/workflows/scholar-validate.yml" "summary:"

# Security - no command injection
run_test "No direct github.event interpolation in run" \
    "! grep -E 'run:.*\\\$\\{\\{.*github\\.event\\.' .github/workflows/scholar-validate.yml" 0

echo ""

# ============================================================================
# D2: Documentation Tests
# ============================================================================
echo -e "${BOLD}${CYAN}D2: GitHub Actions Documentation${NC}"
echo -e "${DIM}────────────────────────────────────────────────────${NC}"

# File existence
check_file "github-actions-setup.md exists" "docs/github-actions-setup.md"

# Key sections
check_pattern "Has Quick Start section" "docs/github-actions-setup.md" "## Quick Start"
check_pattern "Has Troubleshooting section" "docs/github-actions-setup.md" "## Troubleshooting"
check_pattern "References workflow file" "docs/github-actions-setup.md" "scholar-validate.yml"

echo ""

# ============================================================================
# D3: CI Workflow Updates Tests
# ============================================================================
echo -e "${BOLD}${CYAN}D3: CI Workflow Updates${NC}"
echo -e "${DIM}────────────────────────────────────────────────────${NC}"

# File existence
check_file "ci.yml exists" ".github/workflows/ci.yml"

# YAML syntax
check_yaml_syntax "ci.yml valid YAML" ".github/workflows/ci.yml"

# New jobs
check_pattern "Has test job" ".github/workflows/ci.yml" "test:|Run Test Suite"
check_pattern "Has validate-schemas job" ".github/workflows/ci.yml" "validate-schemas:|Validate JSON Schemas"

# Test job structure
check_pattern "Uses Node.js 20" ".github/workflows/ci.yml" "node-version.*20|'20'"
check_pattern "Runs npm test" ".github/workflows/ci.yml" "npm test|npm ci"

echo ""

# ============================================================================
# Package.json Updates Tests
# ============================================================================
echo -e "${BOLD}${CYAN}Package.json npm Scripts${NC}"
echo -e "${DIM}────────────────────────────────────────────────────${NC}"

# npm scripts
check_pattern "Has setup-hooks script" "package.json" '"setup-hooks":'
check_pattern "Has sync script" "package.json" '"sync":'
check_pattern "Has sync:status script" "package.json" '"sync:status":'
check_pattern "Has validate script" "package.json" '"validate":'

# npm script execution tests
run_test "npm run sync:status works" "npm run sync:status 2>&1" 0 "No YAML configs|YAML|Sync"
run_test "npm run setup-hooks -- --status works" "npm run setup-hooks -- --status 2>&1" 0 "Scholar Hook Status"

echo ""

# ============================================================================
# Integration Tests
# ============================================================================
echo -e "${BOLD}${CYAN}Integration Tests${NC}"
echo -e "${DIM}────────────────────────────────────────────────────${NC}"

# Full test suite still passes
run_test "npm test passes" "npm test 2>&1 | tail -5" 0 "passed"

# Sync engine can be imported
run_test "Sync engine loads" \
    "node -e \"import('./src/teaching/config/sync-engine.js').then(m => console.log('OK:', typeof m.ConfigSyncEngine))\"" \
    0 "OK: function"

echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}  Test Summary${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}PASS:${NC} $PASS"
echo -e "  ${RED}FAIL:${NC} $FAIL"
echo -e "  ${YELLOW}SKIP:${NC} $SKIP"
echo -e "  ${CYAN}TOTAL:${NC} $TOTAL"
echo ""

log ""
log "Summary: PASS=$PASS FAIL=$FAIL SKIP=$SKIP TOTAL=$TOTAL"
log "Test run completed: $(date)"

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}${BOLD}Some tests failed!${NC}"
    echo -e "${DIM}Log: $LOG_FILE${NC}"
    exit 1
else
    echo -e "${GREEN}${BOLD}All tests passed!${NC}"
    echo -e "${DIM}Log: $LOG_FILE${NC}"
    exit 0
fi
