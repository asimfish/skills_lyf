#!/bin/bash
# ============================================================================
# Interactive Test Suite for: scholar (Claude Plugin)
# Generated: 2026-01-13
# Run: bash tests/cli/interactive-tests.sh
#
# This suite runs tests and asks you to verify the output.
# Press: y = pass, n = fail, s = skip, q = quit
# ============================================================================

set -uo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'
DIM='\033[2m'

# Counters
PASS=0
FAIL=0
SKIP=0
CURRENT=0
TOTAL=25

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Log file
LOG_DIR="${PROJECT_ROOT}/tests/cli/logs"
LOG_FILE="${LOG_DIR}/interactive-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$LOG_DIR"

# ============================================================================
# Helper Functions
# ============================================================================

log() {
    echo "[$(date +%H:%M:%S)] $*" >> "$LOG_FILE"
}

clear_screen() {
    printf '\033[2J\033[H'
}

header() {
    echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

section() {
    echo -e "\n${CYAN}── $1 ──${NC}\n"
}

wait_key() {
    read -rsn1 key
    echo "$key"
}

# Run a test interactively
# Usage: run_test "Test Name" "Expected" "command to run"
run_test() {
    local name="$1"
    local expected="$2"
    local cmd="$3"

    ((CURRENT++))

    clear_screen

    echo -e "${BOLD}${MAGENTA}┌────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BOLD}${MAGENTA}│  TEST ${CURRENT}/${TOTAL}: ${name}${NC}"
    echo -e "${BOLD}${MAGENTA}└────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    echo -e "${DIM}Command:${NC} ${CYAN}${cmd}${NC}"
    echo ""

    echo -e "${BOLD}Expected:${NC}"
    echo -e "${YELLOW}${expected}${NC}"
    echo ""

    echo -e "${BOLD}Actual Output:${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"

    # Run the command and capture output
    local output
    output=$(eval "$cmd" 2>&1)
    local exit_code=$?

    echo "$output"
    echo -e "${BLUE}────────────────────────────────────────${NC}"
    echo -e "${DIM}Exit code: ${exit_code}${NC}"
    echo ""

    echo -e "${BOLD}Does the output match expected? ${GREEN}[y]${NC}es ${RED}[n]${NC}o ${YELLOW}[s]${NC}kip ${DIM}[q]${NC}uit"
    echo -n "> "

    local key
    key=$(wait_key)
    echo ""

    case "$key" in
        y|Y)
            ((PASS++))
            echo -e "  ${GREEN}✓ PASS${NC}"
            log "PASS: $name"
            ;;
        n|N)
            ((FAIL++))
            echo -e "  ${RED}✗ FAIL${NC}"
            log "FAIL: $name"
            log "  Expected: $expected"
            log "  Got: $output"
            ;;
        s|S)
            ((SKIP++))
            echo -e "  ${YELLOW}○ SKIP${NC}"
            log "SKIP: $name"
            ;;
        q|Q)
            echo -e "\n${YELLOW}Quitting...${NC}\n"
            print_summary
            exit 0
            ;;
        *)
            ((SKIP++))
            echo -e "  ${YELLOW}○ SKIP (unknown key)${NC}"
            log "SKIP: $name (unknown key: $key)"
            ;;
    esac

    sleep 0.5
}

# Run a file check test
# Usage: run_file_test "Test Name" "Expected" "file_path"
run_file_test() {
    local name="$1"
    local expected="$2"
    local filepath="$3"

    ((CURRENT++))

    clear_screen

    echo -e "${BOLD}${MAGENTA}┌────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BOLD}${MAGENTA}│  TEST ${CURRENT}/${TOTAL}: ${name}${NC}"
    echo -e "${BOLD}${MAGENTA}└────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    echo -e "${DIM}File:${NC} ${CYAN}${filepath}${NC}"
    echo ""

    echo -e "${BOLD}Expected:${NC}"
    echo -e "${YELLOW}${expected}${NC}"
    echo ""

    echo -e "${BOLD}File Content (first 30 lines):${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"

    if [[ -f "$filepath" ]]; then
        head -30 "$filepath"
        local line_count
        line_count=$(wc -l < "$filepath" | tr -d ' ')
        if [[ "$line_count" -gt 30 ]]; then
            echo -e "${DIM}... (${line_count} total lines)${NC}"
        fi
    else
        echo -e "${RED}FILE NOT FOUND${NC}"
    fi

    echo -e "${BLUE}────────────────────────────────────────${NC}"
    echo ""

    echo -e "${BOLD}Does the content look correct? ${GREEN}[y]${NC}es ${RED}[n]${NC}o ${YELLOW}[s]${NC}kip ${DIM}[q]${NC}uit"
    echo -n "> "

    local key
    key=$(wait_key)
    echo ""

    case "$key" in
        y|Y)
            ((PASS++))
            echo -e "  ${GREEN}✓ PASS${NC}"
            log "PASS: $name"
            ;;
        n|N)
            ((FAIL++))
            echo -e "  ${RED}✗ FAIL${NC}"
            log "FAIL: $name"
            ;;
        s|S)
            ((SKIP++))
            echo -e "  ${YELLOW}○ SKIP${NC}"
            log "SKIP: $name"
            ;;
        q|Q)
            echo -e "\n${YELLOW}Quitting...${NC}\n"
            print_summary
            exit 0
            ;;
        *)
            ((SKIP++))
            echo -e "  ${YELLOW}○ SKIP (unknown key)${NC}"
            ;;
    esac

    sleep 0.5
}

print_summary() {
    clear_screen
    header "TEST SUMMARY"

    echo -e "  ${GREEN}Passed:${NC}  $PASS"
    echo -e "  ${RED}Failed:${NC}  $FAIL"
    echo -e "  ${YELLOW}Skipped:${NC} $SKIP"
    echo -e "  ${BOLD}Total:${NC}   $((PASS + FAIL + SKIP)) / $TOTAL"
    echo ""

    if [[ "$FAIL" -eq 0 && "$PASS" -gt 0 ]]; then
        echo -e "  ${GREEN}${BOLD}✓ ALL COMPLETED TESTS PASSED${NC}"
    elif [[ "$FAIL" -gt 0 ]]; then
        echo -e "  ${RED}${BOLD}✗ ${FAIL} TEST(S) FAILED${NC}"
    fi

    echo ""
    echo -e "  Log saved to: ${LOG_FILE}"
    echo ""
}

# ============================================================================
# INTRO
# ============================================================================

clear_screen
header "INTERACTIVE TEST SUITE: scholar"

echo -e "  This interactive test suite will walk you through ${TOTAL} tests."
echo -e "  Each test shows expected output vs actual output."
echo ""
echo -e "  ${BOLD}Keys:${NC}"
echo -e "    ${GREEN}y${NC} = Pass (output matches)"
echo -e "    ${RED}n${NC} = Fail (output doesn't match)"
echo -e "    ${YELLOW}s${NC} = Skip (can't determine)"
echo -e "    ${DIM}q${NC} = Quit (show summary)"
echo ""
echo -e "  Press any key to start..."
wait_key

# ============================================================================
# TESTS
# ============================================================================

# --- Plugin Structure ---

run_file_test \
    "Plugin JSON Structure" \
    "Should contain name, version, description fields" \
    "${PROJECT_ROOT}/.claude-plugin/plugin.json"

run_test \
    "Plugin Name Extraction" \
    "Should output: scholar" \
    "grep -o '\"name\": \"[^\"]*\"' ${PROJECT_ROOT}/.claude-plugin/plugin.json | cut -d'\"' -f4"

run_test \
    "Plugin Version" \
    "Should output a semantic version like: 1.0.0" \
    "grep -o '\"version\": \"[^\"]*\"' ${PROJECT_ROOT}/.claude-plugin/plugin.json | cut -d'\"' -f4"

# --- Command Structure ---

run_test \
    "Command Namespaces" \
    "Should list: literature, manuscript, research, simulation, teaching" \
    "ls ${PROJECT_ROOT}/src/plugin-api/commands/"

run_test \
    "Teaching Commands Count" \
    "Should show 7 files (6 commands + possible readme)" \
    "ls -la ${PROJECT_ROOT}/src/plugin-api/commands/teaching/ | wc -l"

run_test \
    "Teaching Commands List" \
    "Should include: exam.md, quiz.md, assignment.md, syllabus.md, rubric.md, slides.md, feedback.md" \
    "ls ${PROJECT_ROOT}/src/plugin-api/commands/teaching/"

# --- Command Content ---

run_file_test \
    "Quiz Command Frontmatter" \
    "Should have YAML frontmatter with name: teaching:quiz" \
    "${PROJECT_ROOT}/src/plugin-api/commands/teaching/quiz.md"

run_file_test \
    "Exam Command Frontmatter" \
    "Should have YAML frontmatter with name: teaching:exam" \
    "${PROJECT_ROOT}/src/plugin-api/commands/teaching/exam.md"

# --- Skills Structure ---

run_test \
    "Skill Categories" \
    "Should list: implementation, mathematical, research, teaching, writing" \
    "ls ${PROJECT_ROOT}/src/plugin-api/skills/"

run_test \
    "Total Skill Count" \
    "Should show 17 or more skill files (SKILL.md or skill.md)" \
    "find ${PROJECT_ROOT}/src/plugin-api/skills -type f \\( -name 'SKILL.md' -o -name 'skill.md' \\) | wc -l"

# --- Teaching Module ---

run_test \
    "Teaching Module Structure" \
    "Should list: ai, config, formatters, generators, templates, validators" \
    "ls ${PROJECT_ROOT}/src/teaching/"

run_test \
    "Generator Files" \
    "Should include: exam.js, exam-conversational.js, quiz.js, quiz-conversational.js" \
    "ls ${PROJECT_ROOT}/src/teaching/generators/"

run_file_test \
    "Quiz Template Schema" \
    "Should be valid JSON with quiz_type enum and quiz-specific fields" \
    "${PROJECT_ROOT}/src/teaching/templates/quiz.json"

run_file_test \
    "Exam Template Schema" \
    "Should be valid JSON with exam_type enum and question structure" \
    "${PROJECT_ROOT}/src/teaching/templates/exam.json"

# --- Formatters ---

run_test \
    "Formatter Files" \
    "Should include: base.js, canvas.js, examark.js, index.js, markdown.js, quarto.js, latex.js" \
    "ls ${PROJECT_ROOT}/src/teaching/formatters/"

run_file_test \
    "Formatter Index Exports" \
    "Should export MarkdownFormatter, CanvasFormatter, QuartoFormatter, LaTeXFormatter" \
    "${PROJECT_ROOT}/src/teaching/formatters/index.js"

# --- Tests ---

run_test \
    "Test Files Count" \
    "Should show 10+ test files in tests/teaching/" \
    "ls ${PROJECT_ROOT}/tests/teaching/*.test.js | wc -l"

run_test \
    "Jest Test Suite" \
    "Should show all tests passing (look for 'passed' and no 'failed')" \
    "cd ${PROJECT_ROOT} && npm test -- --no-coverage --silent 2>&1 | tail -5"

run_test \
    "Test Count Summary" \
    "Should show 300+ tests total" \
    "cd ${PROJECT_ROOT} && npm test -- --no-coverage --silent 2>&1 | grep -E 'Tests:.*passed'"

# --- Documentation ---

run_file_test \
    "README Content" \
    "Should describe the scholar plugin with installation and usage info" \
    "${PROJECT_ROOT}/README.md"

run_file_test \
    "CLAUDE.md Project Instructions" \
    "Should contain project-specific instructions for Claude Code" \
    "${PROJECT_ROOT}/CLAUDE.md"

# --- Package Configuration ---

run_test \
    "Package Dependencies" \
    "Should include: ajv, ajv-keywords, js-yaml" \
    "cat ${PROJECT_ROOT}/package.json | grep -A5 'dependencies'"

run_test \
    "NPM Test Script" \
    "Should show test script that runs jest" \
    "cat ${PROJECT_ROOT}/package.json | grep -A1 '\"test\"'"

# --- Status ---

run_file_test \
    "Project Status File" \
    "Should show progress, current milestone, and next steps" \
    "${PROJECT_ROOT}/.STATUS"

# ============================================================================
# SUMMARY
# ============================================================================

print_summary

if [[ "$FAIL" -gt 0 ]]; then
    exit 1
else
    exit 0
fi
