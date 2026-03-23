#!/bin/bash
# ============================================================================
# Automated Test Suite for: scholar (Claude Plugin)
# Generated: 2026-01-13
# Run: bash tests/cli/automated-tests.sh
# ============================================================================

set -uo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Counters
PASS=0
FAIL=0
SKIP=0
TOTAL=0

# Project root (relative to test location)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Log file
LOG_DIR="${PROJECT_ROOT}/tests/cli/logs"
LOG_FILE="${LOG_DIR}/automated-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$LOG_DIR"

# ============================================================================
# Test Framework Functions
# ============================================================================

log() {
    echo "[$(date +%H:%M:%S)] $*" >> "$LOG_FILE"
}

header() {
    echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    log "SECTION: $1"
}

test_pass() {
    ((PASS++))
    ((TOTAL++))
    echo -e "  ${GREEN}✓${NC} $1"
    log "PASS: $1"
}

test_fail() {
    ((FAIL++))
    ((TOTAL++))
    echo -e "  ${RED}✗${NC} $1"
    log "FAIL: $1 -- $2"
}

test_skip() {
    ((SKIP++))
    ((TOTAL++))
    echo -e "  ${YELLOW}○${NC} $1 (skipped)"
    log "SKIP: $1"
}

# Check if file exists
file_exists() {
    [[ -f "$1" ]]
}

# Check if directory exists
dir_exists() {
    [[ -d "$1" ]]
}

# Check if file is non-empty
file_non_empty() {
    [[ -s "$1" ]]
}

# Check if file contains pattern
file_contains() {
    grep -q "$2" "$1" 2>/dev/null
}

# Check if JSON is valid
json_valid() {
    python3 -c "import json; json.load(open('$1'))" 2>/dev/null
}

# Check YAML frontmatter in markdown
has_frontmatter() {
    head -1 "$1" 2>/dev/null | grep -q "^---$"
}

# Count files matching pattern
count_files() {
    find "$1" -name "$2" -type f 2>/dev/null | wc -l | tr -d ' '
}

# ============================================================================
# 1. Plugin Structure Tests
# ============================================================================

header "1. PLUGIN STRUCTURE"

# Test 1.1: plugin.json exists
if file_exists "${PROJECT_ROOT}/.claude-plugin/plugin.json"; then
    test_pass "plugin.json exists"
else
    test_fail "plugin.json exists" "File not found"
fi

# Test 1.2: plugin.json is valid JSON
if json_valid "${PROJECT_ROOT}/.claude-plugin/plugin.json"; then
    test_pass "plugin.json is valid JSON"
else
    test_fail "plugin.json is valid JSON" "Invalid JSON syntax"
fi

# Test 1.3: plugin.json has required fields
if file_contains "${PROJECT_ROOT}/.claude-plugin/plugin.json" '"name"'; then
    test_pass "plugin.json has 'name' field"
else
    test_fail "plugin.json has 'name' field" "Missing field"
fi

if file_contains "${PROJECT_ROOT}/.claude-plugin/plugin.json" '"version"'; then
    test_pass "plugin.json has 'version' field"
else
    test_fail "plugin.json has 'version' field" "Missing field"
fi

if file_contains "${PROJECT_ROOT}/.claude-plugin/plugin.json" '"description"'; then
    test_pass "plugin.json has 'description' field"
else
    test_fail "plugin.json has 'description' field" "Missing field"
fi

# Test 1.4: package.json exists and valid
if file_exists "${PROJECT_ROOT}/package.json"; then
    test_pass "package.json exists"
    if json_valid "${PROJECT_ROOT}/package.json"; then
        test_pass "package.json is valid JSON"
    else
        test_fail "package.json is valid JSON" "Invalid JSON"
    fi
else
    test_fail "package.json exists" "File not found"
fi

# ============================================================================
# 2. Commands Directory Tests
# ============================================================================

header "2. COMMANDS STRUCTURE"

COMMANDS_DIR="${PROJECT_ROOT}/src/plugin-api/commands"

# Test 2.1: Commands directory exists
if dir_exists "$COMMANDS_DIR"; then
    test_pass "commands/ directory exists"
else
    test_fail "commands/ directory exists" "Directory not found"
fi

# Test 2.2: Expected command namespaces
for ns in literature manuscript research simulation teaching; do
    if dir_exists "${COMMANDS_DIR}/${ns}"; then
        test_pass "commands/${ns}/ namespace exists"
    else
        test_fail "commands/${ns}/ namespace exists" "Directory not found"
    fi
done

# Test 2.3: Command file counts
LITERATURE_COUNT=$(count_files "${COMMANDS_DIR}/literature" "*.md")
if [[ "$LITERATURE_COUNT" -ge 4 ]]; then
    test_pass "literature/ has ${LITERATURE_COUNT} commands (≥4)"
else
    test_fail "literature/ has sufficient commands" "Found ${LITERATURE_COUNT}, expected ≥4"
fi

MANUSCRIPT_COUNT=$(count_files "${COMMANDS_DIR}/manuscript" "*.md")
if [[ "$MANUSCRIPT_COUNT" -ge 4 ]]; then
    test_pass "manuscript/ has ${MANUSCRIPT_COUNT} commands (≥4)"
else
    test_fail "manuscript/ has sufficient commands" "Found ${MANUSCRIPT_COUNT}, expected ≥4"
fi

RESEARCH_COUNT=$(count_files "${COMMANDS_DIR}/research" "*.md")
if [[ "$RESEARCH_COUNT" -ge 3 ]]; then
    test_pass "research/ has ${RESEARCH_COUNT} commands (≥3)"
else
    test_fail "research/ has sufficient commands" "Found ${RESEARCH_COUNT}, expected ≥3"
fi

TEACHING_COUNT=$(count_files "${COMMANDS_DIR}/teaching" "*.md")
if [[ "$TEACHING_COUNT" -ge 5 ]]; then
    test_pass "teaching/ has ${TEACHING_COUNT} commands (≥5)"
else
    test_fail "teaching/ has sufficient commands" "Found ${TEACHING_COUNT}, expected ≥5"
fi

# Test 2.4: Command files have frontmatter
echo -e "\n  ${CYAN}Checking command frontmatter...${NC}"
COMMANDS_WITH_FRONTMATTER=0
COMMANDS_MISSING_FRONTMATTER=0
while IFS= read -r cmd; do
    if has_frontmatter "$cmd"; then
        ((COMMANDS_WITH_FRONTMATTER++))
    else
        ((COMMANDS_MISSING_FRONTMATTER++))
        log "Missing frontmatter: $cmd"
    fi
done < <(find "$COMMANDS_DIR" -name "*.md" -type f)

if [[ "$COMMANDS_MISSING_FRONTMATTER" -eq 0 ]]; then
    test_pass "All ${COMMANDS_WITH_FRONTMATTER} commands have YAML frontmatter"
else
    test_fail "Command frontmatter check" "${COMMANDS_MISSING_FRONTMATTER} commands missing frontmatter"
fi

# Test 2.5: Specific expected commands exist
EXPECTED_COMMANDS=(
    "literature/arxiv.md"
    "literature/doi.md"
    "literature/bib-search.md"
    "manuscript/methods.md"
    "manuscript/reviewer.md"
    "research/hypothesis.md"
    "research/analysis-plan.md"
    "teaching/exam.md"
    "teaching/quiz.md"
    "teaching/syllabus.md"
    "teaching/assignment.md"
)

echo -e "\n  ${CYAN}Checking expected commands...${NC}"
for cmd in "${EXPECTED_COMMANDS[@]}"; do
    if file_exists "${COMMANDS_DIR}/${cmd}"; then
        test_pass "Command ${cmd} exists"
    else
        test_fail "Command ${cmd} exists" "File not found"
    fi
done

# ============================================================================
# 3. Skills Directory Tests
# ============================================================================

header "3. SKILLS STRUCTURE"

SKILLS_DIR="${PROJECT_ROOT}/src/plugin-api/skills"

# Test 3.1: Skills directory exists
if dir_exists "$SKILLS_DIR"; then
    test_pass "skills/ directory exists"
else
    test_fail "skills/ directory exists" "Directory not found"
fi

# Test 3.2: Skill categories exist
for cat in implementation mathematical research writing; do
    if dir_exists "${SKILLS_DIR}/${cat}"; then
        test_pass "skills/${cat}/ category exists"
    else
        test_fail "skills/${cat}/ category exists" "Directory not found"
    fi
done

# Test 3.3: Skills have SKILL.md or skill.md files
SKILL_COUNT=$(find "$SKILLS_DIR" -type f \( -name "SKILL.md" -o -name "skill.md" \) | wc -l | tr -d ' ')
if [[ "$SKILL_COUNT" -ge 15 ]]; then
    test_pass "Found ${SKILL_COUNT} skill definitions (≥15)"
else
    test_fail "Skill count check" "Found ${SKILL_COUNT}, expected ≥15"
fi

# Test 3.4: Skills README exists
if file_exists "${SKILLS_DIR}/README.md"; then
    test_pass "skills/README.md exists"
else
    test_fail "skills/README.md exists" "File not found"
fi

# ============================================================================
# 4. Teaching Module Tests
# ============================================================================

header "4. TEACHING MODULE"

TEACHING_DIR="${PROJECT_ROOT}/src/teaching"

# Test 4.1: Teaching module directories exist
for dir in ai config formatters generators templates validators; do
    if dir_exists "${TEACHING_DIR}/${dir}"; then
        test_pass "teaching/${dir}/ exists"
    else
        test_fail "teaching/${dir}/ exists" "Directory not found"
    fi
done

# Test 4.2: Core generators exist
GENERATORS=(
    "exam.js"
    "exam-conversational.js"
    "quiz.js"
    "quiz-conversational.js"
)
for gen in "${GENERATORS[@]}"; do
    if file_exists "${TEACHING_DIR}/generators/${gen}"; then
        test_pass "Generator ${gen} exists"
    else
        test_fail "Generator ${gen} exists" "File not found"
    fi
done

# Test 4.3: Templates exist and are valid JSON
TEMPLATES=(
    "base.json"
    "exam.json"
    "quiz.json"
)
for tmpl in "${TEMPLATES[@]}"; do
    if file_exists "${TEACHING_DIR}/templates/${tmpl}"; then
        test_pass "Template ${tmpl} exists"
        if json_valid "${TEACHING_DIR}/templates/${tmpl}"; then
            test_pass "Template ${tmpl} is valid JSON"
        else
            test_fail "Template ${tmpl} is valid JSON" "Invalid JSON"
        fi
    else
        test_fail "Template ${tmpl} exists" "File not found"
    fi
done

# Test 4.4: Formatters exist
FORMATTERS=(
    "base.js"
    "canvas.js"
    "examark.js"
    "index.js"
)
for fmt in "${FORMATTERS[@]}"; do
    if file_exists "${TEACHING_DIR}/formatters/${fmt}"; then
        test_pass "Formatter ${fmt} exists"
    else
        test_fail "Formatter ${fmt} exists" "File not found"
    fi
done

# Test 4.5: AI Provider exists
if file_exists "${TEACHING_DIR}/ai/provider.js"; then
    test_pass "AI provider exists"
else
    test_fail "AI provider exists" "File not found"
fi

# Test 4.6: Config loader exists
if file_exists "${TEACHING_DIR}/config/loader.js"; then
    test_pass "Config loader exists"
else
    test_fail "Config loader exists" "File not found"
fi

# Test 4.7: Validator engine exists
if file_exists "${TEACHING_DIR}/validators/engine.js"; then
    test_pass "Validator engine exists"
else
    test_fail "Validator engine exists" "File not found"
fi

# ============================================================================
# 5. JavaScript Syntax Tests
# ============================================================================

header "5. JAVASCRIPT SYNTAX"

# Test 5.1: Check JS files for syntax errors using Node
JS_SYNTAX_ERRORS=0
JS_FILES_CHECKED=0

echo -e "  ${CYAN}Checking JavaScript syntax...${NC}"
while IFS= read -r jsfile; do
    ((JS_FILES_CHECKED++))
    if ! node --check "$jsfile" 2>/dev/null; then
        ((JS_SYNTAX_ERRORS++))
        log "Syntax error: $jsfile"
    fi
done < <(find "${TEACHING_DIR}" -name "*.js" -type f)

if [[ "$JS_SYNTAX_ERRORS" -eq 0 ]]; then
    test_pass "All ${JS_FILES_CHECKED} JavaScript files have valid syntax"
else
    test_fail "JavaScript syntax check" "${JS_SYNTAX_ERRORS} files have syntax errors"
fi

# ============================================================================
# 6. Test Suite Tests
# ============================================================================

header "6. TEST SUITE"

TESTS_DIR="${PROJECT_ROOT}/tests/teaching"

# Test 6.1: Test directory exists
if dir_exists "$TESTS_DIR"; then
    test_pass "tests/teaching/ directory exists"
else
    test_fail "tests/teaching/ directory exists" "Directory not found"
fi

# Test 6.2: Test files exist
TEST_FILES=(
    "ai-provider.test.js"
    "config-loader.test.js"
    "exam-generator.test.js"
    "quiz-generator.test.js"
    "validator-engine.test.js"
    "formatters.test.js"
)
for test in "${TEST_FILES[@]}"; do
    if file_exists "${TESTS_DIR}/${test}"; then
        test_pass "Test file ${test} exists"
    else
        test_fail "Test file ${test} exists" "File not found"
    fi
done

# Test 6.3: Jest config exists
if file_exists "${PROJECT_ROOT}/jest.config.js"; then
    test_pass "jest.config.js exists"
else
    test_fail "jest.config.js exists" "File not found"
fi

# Test 6.4: Run actual test suite
echo -e "\n  ${CYAN}Running Jest test suite...${NC}"
cd "$PROJECT_ROOT"
if npm test -- --no-coverage --silent 2>/dev/null; then
    JEST_OUTPUT=$(npm test -- --no-coverage --silent 2>&1 | tail -3)
    test_pass "Jest test suite passes"
    log "Jest output: $JEST_OUTPUT"
else
    test_fail "Jest test suite passes" "Tests failed"
fi

# ============================================================================
# 7. Documentation Tests
# ============================================================================

header "7. DOCUMENTATION"

# Test 7.1: README exists
if file_exists "${PROJECT_ROOT}/README.md"; then
    test_pass "README.md exists"
else
    test_fail "README.md exists" "File not found"
fi

# Test 7.2: CLAUDE.md exists
if file_exists "${PROJECT_ROOT}/CLAUDE.md"; then
    test_pass "CLAUDE.md exists"
else
    test_fail "CLAUDE.md exists" "File not found"
fi

# Test 7.3: Docs directory exists
if dir_exists "${PROJECT_ROOT}/docs"; then
    test_pass "docs/ directory exists"

    # Check for key docs
    KEY_DOCS=(
        "QUICK-START.md"
        "QUICK-REFERENCE.md"
    )
    for doc in "${KEY_DOCS[@]}"; do
        if file_exists "${PROJECT_ROOT}/docs/${doc}"; then
            test_pass "docs/${doc} exists"
        else
            test_skip "docs/${doc}"
        fi
    done
else
    test_fail "docs/ directory exists" "Directory not found"
fi

# ============================================================================
# 8. Configuration Files Tests
# ============================================================================

header "8. CONFIGURATION FILES"

# Test 8.1: ESLint config
if file_exists "${PROJECT_ROOT}/.eslintrc.json"; then
    test_pass ".eslintrc.json exists"
    if json_valid "${PROJECT_ROOT}/.eslintrc.json"; then
        test_pass ".eslintrc.json is valid JSON"
    else
        test_fail ".eslintrc.json is valid JSON" "Invalid JSON"
    fi
else
    test_skip ".eslintrc.json"
fi

# Test 8.2: Prettier config
if file_exists "${PROJECT_ROOT}/.prettierrc.json"; then
    test_pass ".prettierrc.json exists"
else
    test_skip ".prettierrc.json"
fi

# Test 8.3: GitHub workflows
WORKFLOW_DIR="${PROJECT_ROOT}/.github/workflows"
if dir_exists "$WORKFLOW_DIR"; then
    test_pass ".github/workflows/ exists"
    WORKFLOW_COUNT=$(count_files "$WORKFLOW_DIR" "*.yml")
    if [[ "$WORKFLOW_COUNT" -ge 1 ]]; then
        test_pass "Found ${WORKFLOW_COUNT} workflow file(s)"
    else
        test_fail "Workflow files exist" "No workflows found"
    fi
else
    test_skip ".github/workflows/"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  TEST SUMMARY${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "  ${GREEN}Passed:${NC}  $PASS"
echo -e "  ${RED}Failed:${NC}  $FAIL"
echo -e "  ${YELLOW}Skipped:${NC} $SKIP"
echo -e "  ${BOLD}Total:${NC}   $TOTAL"
echo -e ""
echo -e "  Log: ${LOG_FILE}"
echo -e ""

if [[ "$FAIL" -eq 0 ]]; then
    echo -e "  ${GREEN}${BOLD}✓ ALL TESTS PASSED${NC}\n"
    exit 0
else
    echo -e "  ${RED}${BOLD}✗ ${FAIL} TEST(S) FAILED${NC}\n"
    exit 1
fi
