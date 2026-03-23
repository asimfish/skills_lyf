#!/bin/bash
# Interactive Test Suite for Scholar Phase D - GitHub Actions Integration
# Generated: 2026-01-15
#
# Human-guided QA tests with expected/actual comparison
#
# Usage:
#   bash tests/phase-d/interactive-tests.sh
#
# Controls:
#   y - Test passed
#   n - Test failed
#   s - Skip test
#   q - Quit testing

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
SKIP=0
TOTAL=0
TESTS_RUN=0

# Project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

# Log file
LOG_FILE="$SCRIPT_DIR/logs/interactive-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$SCRIPT_DIR/logs"

# Total number of tests
TOTAL_TESTS=12

# Clear screen helper
clear_section() {
    echo ""
    echo -e "${DIM}────────────────────────────────────────────────────────────${NC}"
    echo ""
}

# Run interactive test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected="$3"

    TESTS_RUN=$((TESTS_RUN + 1))
    TOTAL=$((TOTAL + 1))

    clear_section
    echo -e "${BOLD}${CYAN}TEST $TESTS_RUN/$TOTAL_TESTS: $test_name${NC}"
    echo ""
    echo -e "${BLUE}Command:${NC}"
    echo -e "  ${DIM}$command${NC}"
    echo ""
    echo -e "${BLUE}Expected:${NC}"
    echo -e "  $expected"
    echo ""
    echo -e "${BLUE}Running...${NC}"
    echo ""

    # Run command and show output
    echo -e "${MAGENTA}───── Output ─────${NC}"
    eval "$command" 2>&1 | head -30 || true
    echo -e "${MAGENTA}──────────────────${NC}"
    echo ""

    # Ask user
    echo -e "${YELLOW}Did it match? (y=pass, n=fail, s=skip, q=quit)${NC}"
    read -n 1 -s answer
    echo ""

    case "$answer" in
        y|Y)
            echo -e "${GREEN}✓ PASS${NC}"
            PASS=$((PASS + 1))
            echo "PASS: $test_name" >> "$LOG_FILE"
            ;;
        n|N)
            echo -e "${RED}✗ FAIL${NC}"
            FAIL=$((FAIL + 1))
            echo "FAIL: $test_name" >> "$LOG_FILE"
            ;;
        s|S)
            echo -e "${YELLOW}○ SKIP${NC}"
            SKIP=$((SKIP + 1))
            echo "SKIP: $test_name" >> "$LOG_FILE"
            ;;
        q|Q)
            echo ""
            echo -e "${YELLOW}Testing aborted${NC}"
            print_summary
            exit 0
            ;;
        *)
            echo -e "${YELLOW}○ SKIP (invalid input)${NC}"
            SKIP=$((SKIP + 1))
            ;;
    esac
}

# Print final summary
print_summary() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  Interactive Test Summary${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${GREEN}PASS:${NC} $PASS"
    echo -e "  ${RED}FAIL:${NC} $FAIL"
    echo -e "  ${YELLOW}SKIP:${NC} $SKIP"
    echo -e "  ${CYAN}RUN:${NC}  $TESTS_RUN / $TOTAL_TESTS"
    echo ""

    local PASS_RATE=0
    if [ "$TOTAL" -gt 0 ]; then
        PASS_RATE=$((PASS * 100 / TOTAL))
    fi

    if [ "$FAIL" -eq 0 ] && [ "$TESTS_RUN" -gt 0 ]; then
        echo -e "${GREEN}${BOLD}All run tests passed! (${PASS_RATE}%)${NC}"
    elif [ "$FAIL" -gt 0 ]; then
        echo -e "${RED}${BOLD}Some tests failed (${PASS_RATE}% pass rate)${NC}"
    fi

    echo ""
    echo -e "${DIM}Log saved to: $LOG_FILE${NC}"
}

# Header
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}  Phase D: GitHub Actions - Interactive Test Suite${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${DIM}Controls: y=pass, n=fail, s=skip, q=quit${NC}"
echo -e "${DIM}$TOTAL_TESTS tests total${NC}"

echo "Interactive test session started: $(date)" >> "$LOG_FILE"
echo "Project: $PROJECT_ROOT" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# ============================================================================
# D1: setup-hooks.js Interactive Tests
# ============================================================================

run_test "setup-hooks.js --help shows usage" \
    "node scripts/setup-hooks.js --help" \
    "Shows colorful help with Usage, Options, What it does, Examples sections"

run_test "setup-hooks.js --status shows hook status" \
    "node scripts/setup-hooks.js --status" \
    "Shows 'Scholar Hook Status' with git directory info, worktree detection if applicable, and hook installation status"

run_test "setup-hooks.js detects worktree correctly" \
    "node scripts/setup-hooks.js --status 2>&1 | grep -E 'Worktree|Main repo|Git directory'" \
    "If in worktree: shows 'Worktree detected' and 'Main repo hooks' path. If not: shows 'Git directory' only"

# ============================================================================
# D1: pre-commit-hook.sh Preview Tests
# ============================================================================

run_test "pre-commit-hook.sh header format" \
    "head -50 scripts/pre-commit-hook.sh" \
    "Shows bash script with colorful output definitions, icons (CHECK, CROSS, WARN, INFO), and proper header function"

run_test "pre-commit-hook.sh SCHOLAR_VALIDATE support" \
    "grep -A5 'SCHOLAR_VALIDATE' scripts/pre-commit-hook.sh" \
    "Shows conditional block that runs full validation when SCHOLAR_VALIDATE=1"

# ============================================================================
# D2: scholar-validate.yml Workflow Tests
# ============================================================================

run_test "scholar-validate.yml workflow triggers" \
    "head -50 .github/workflows/scholar-validate.yml" \
    "Shows workflow name, triggers (push, pull_request, workflow_dispatch), path filters for YAML files"

run_test "scholar-validate.yml jobs structure" \
    "grep -E '^  [a-z].*:$' .github/workflows/scholar-validate.yml" \
    "Shows three jobs: validate-configs, sync-check, summary (indented at job level)"

run_test "scholar-validate.yml uses safe patterns" \
    "grep -E 'env:|GITHUB_OUTPUT' .github/workflows/scholar-validate.yml | head -10" \
    "Uses env: variables and GITHUB_OUTPUT for safe parameter passing (no direct github.event in run:)"

# ============================================================================
# D2: Documentation Tests
# ============================================================================

run_test "github-actions-setup.md content" \
    "head -80 docs/github-actions-setup.md" \
    "Shows comprehensive documentation with Overview, Quick Start (copy or reference workflow), setup instructions"

# ============================================================================
# D3: ci.yml Updates Tests
# ============================================================================

run_test "ci.yml new test job" \
    "grep -A15 'name: Run Test Suite' .github/workflows/ci.yml" \
    "Shows test job with Node.js setup, npm ci, npm test, and summary step"

run_test "ci.yml schema validation job" \
    "grep -A20 'name: Validate JSON Schemas' .github/workflows/ci.yml" \
    "Shows validate-schemas job with schema validation steps for lesson-plan and teaching-style schemas"

# ============================================================================
# Integration Test
# ============================================================================

run_test "Full npm test suite passes" \
    "npm test 2>&1 | tail -10" \
    "Shows test summary with all tests passed (1024 passed, X total), no failures"

# Summary
print_summary
