#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Dogfooding Test Suite: /teaching:validate-r
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Interactive test suite for manually testing the validate-r
# command with Claude Code. Tests cover the full workflow:
# single file, batch, dry-run, lint, fix, and CI output.
#
# Usage:
#   bash tests/e2e/dogfood-validate-r.sh          # Full suite
#   bash tests/e2e/dogfood-validate-r.sh --quick   # Smoke tests only
#
# Prerequisites:
#   - Rscript installed (which Rscript)
#   - Scholar plugin installed in Claude Code
#   - Running from project root
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FIXTURES="$SCRIPT_DIR/fixtures"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/dogfood-validate-r-$TIMESTAMP.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

PASS=0
FAIL=0
SKIP=0
TOTAL=0
QUICK_MODE=false

if [[ "${1:-}" == "--quick" ]]; then
  QUICK_MODE=true
fi

mkdir -p "$LOG_DIR"

# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

log() {
  echo "$@" | tee -a "$LOG_FILE"
}

header() {
  log ""
  log -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  log -e "${BOLD}  $1${RESET}"
  log -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

run_test() {
  local test_num=$1
  local test_name=$2
  local test_cmd=$3
  local expected=$4

  TOTAL=$((TOTAL + 1))
  log ""
  log -e "${BLUE}TEST $test_num: $test_name${RESET}"
  log -e "  Command:  ${YELLOW}$test_cmd${RESET}"
  log -e "  Expected: $expected"
  log ""

  # Run the command and capture output
  local output
  local exit_code=0
  output=$(eval "$test_cmd" 2>&1) || exit_code=$?

  log -e "  Exit code: $exit_code"
  log -e "  Output (first 20 lines):"
  echo "$output" | head -20 | sed 's/^/    /' | tee -a "$LOG_FILE"
  log ""

  # Ask for judgment
  echo -en "  ${BOLD}Pass? [y/n/s(kip)] ${RESET}"
  read -r -n 1 answer
  echo ""

  case "$answer" in
    y|Y)
      PASS=$((PASS + 1))
      log -e "  ${GREEN}PASS${RESET}"
      ;;
    s|S)
      SKIP=$((SKIP + 1))
      log -e "  ${YELLOW}SKIP${RESET}"
      ;;
    *)
      FAIL=$((FAIL + 1))
      log -e "  ${RED}FAIL${RESET}"
      echo -en "  Notes: "
      read -r notes
      log "  Notes: $notes"
      ;;
  esac
}

# ─────────────────────────────────────────────────────────
# Pre-flight checks
# ─────────────────────────────────────────────────────────

header "Pre-flight Checks"

# Check Rscript
if command -v Rscript &>/dev/null; then
  R_VERSION=$(Rscript --version 2>&1 | head -1)
  log -e "  ${GREEN}Rscript found:${RESET} $R_VERSION"
else
  log -e "  ${RED}Rscript NOT found${RESET}"
  log "  Some tests will need to be skipped."
  log "  Install R: brew install r (macOS) or apt install r-base (Linux)"
fi

# Check fixtures exist
if [[ -d "$FIXTURES" ]]; then
  FIXTURE_COUNT=$(find "$FIXTURES" -name "*.qmd" | wc -l | tr -d ' ')
  log -e "  ${GREEN}Fixtures:${RESET} $FIXTURE_COUNT .qmd files in $FIXTURES"
else
  log -e "  ${RED}Fixtures directory not found:${RESET} $FIXTURES"
  exit 1
fi

# Check plugin structure
if [[ -f "$PROJECT_ROOT/src/plugin-api/commands/teaching/validate-r.md" ]]; then
  log -e "  ${GREEN}Command file:${RESET} validate-r.md present"
else
  log -e "  ${RED}Command file missing:${RESET} validate-r.md"
fi

if [[ -f "$PROJECT_ROOT/src/teaching/validators/r-code.js" ]]; then
  log -e "  ${GREEN}Validator module:${RESET} r-code.js present"
else
  log -e "  ${RED}Validator module missing:${RESET} r-code.js"
fi

log ""
log "  Log file: $LOG_FILE"

# ─────────────────────────────────────────────────────────
# Category 1: Smoke Tests (Structure & Discovery)
# ─────────────────────────────────────────────────────────

header "Category 1: Smoke Tests"

run_test 1 \
  "Command file has valid frontmatter" \
  "head -5 $PROJECT_ROOT/src/plugin-api/commands/teaching/validate-r.md" \
  "YAML frontmatter with name: teaching:validate-r"

run_test 2 \
  "Discovery finds validate-r" \
  "node -e \"import('$PROJECT_ROOT/src/discovery/index.js').then(m => { const d = m.getCommandDetail('validate-r'); console.log(JSON.stringify({name: d?.name, category: d?.category, subcategory: d?.subcategory})) })\"" \
  "name=teaching:validate-r, category=teaching, subcategory=content"

run_test 3 \
  "Command stats reflect 31 total commands" \
  "node -e \"import('$PROJECT_ROOT/src/discovery/index.js').then(m => console.log(JSON.stringify(m.getCommandStats())))\"" \
  "{ research: 14, teaching: 16, total: 31 } (includes hub)"

run_test 4 \
  "Validator module exports all 12 functions" \
  "node -e \"import('$PROJECT_ROOT/src/teaching/validators/r-code.js').then(m => console.log(Object.keys(m).sort().join(', ')))\"" \
  "12 exported function names"

run_test 5 \
  "Validator re-exported from validators/index.js" \
  "node -e \"import('$PROJECT_ROOT/src/teaching/validators/index.js').then(m => console.log(typeof m.extractRChunks, typeof m.buildValidationScript, typeof m.lintRChunk))\"" \
  "function function function"

if $QUICK_MODE; then
  header "Quick Mode Complete"
  log ""
  log -e "  ${GREEN}Passed:${RESET}  $PASS"
  log -e "  ${RED}Failed:${RESET}  $FAIL"
  log -e "  ${YELLOW}Skipped:${RESET} $SKIP"
  log -e "  Total:   $TOTAL"
  exit $((FAIL > 0 ? 1 : 0))
fi

# ─────────────────────────────────────────────────────────
# Category 2: Chunk Extraction (pure JS, no R needed)
# ─────────────────────────────────────────────────────────

header "Category 2: Chunk Extraction"

run_test 6 \
  "Extract chunks from assignment4-solution.qmd (5 expected)" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/assignment4-solution.qmd', 'utf-8');
    const chunks = extractRChunks(content);
    console.log('Chunks:', chunks.length);
    chunks.forEach(c => console.log('  -', c.label, '(line', c.lineNumber + ')'));
  \"" \
  "5 chunks: setup, normality-check, levene-test, diagnostic-plots, optional-advanced"

run_test 7 \
  "Mixed-languages.qmd: only R chunks extracted (2 expected)" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/mixed-languages.qmd', 'utf-8');
    const chunks = extractRChunks(content);
    console.log('Chunks:', chunks.length);
    chunks.forEach(c => console.log('  -', c.label));
  \"" \
  "2 chunks: r-chunk, second-r (Python and bash ignored)"

run_test 8 \
  "No-r-chunks.qmd: zero chunks extracted" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/no-r-chunks.qmd', 'utf-8');
    console.log('Chunks:', extractRChunks(content).length);
  \"" \
  "0 chunks"

run_test 9 \
  "eval:false chunk detected as skip" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks, shouldValidateChunk } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/assignment4-solution.qmd', 'utf-8');
    const chunks = extractRChunks(content);
    const skip = chunks.filter(c => !shouldValidateChunk(c));
    console.log('Skipped:', skip.length, skip.map(c => c.label).join(', '));
  \"" \
  "1 skipped: optional-advanced"

# ─────────────────────────────────────────────────────────
# Category 3: Lint (static analysis, no R needed)
# ─────────────────────────────────────────────────────────

header "Category 3: Static Lint"

run_test 10 \
  "Lint detects all 4 anti-patterns in lint-warnings.qmd" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks, lintRChunk } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/lint-warnings.qmd', 'utf-8');
    const chunks = extractRChunks(content);
    const warnings = chunks.flatMap(c => lintRChunk(c));
    console.log('Total warnings:', warnings.length);
    warnings.forEach(w => console.log('  [' + w.severity + '] ' + w.rule + ': ' + w.message));
  \"" \
  "At least 4 warnings: no-setwd, no-absolute-paths, no-install-packages, no-rm-list-ls"

run_test 11 \
  "Clean chunk in lint-warnings.qmd produces 0 warnings" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks, lintRChunk } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/lint-warnings.qmd', 'utf-8');
    const chunks = extractRChunks(content);
    const clean = chunks.find(c => c.label === 'clean');
    console.log('Clean chunk warnings:', lintRChunk(clean).length);
  \"" \
  "0 warnings"

run_test 12 \
  "assignment4-solution.qmd has no lint warnings (clean code)" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks, lintRChunk } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/assignment4-solution.qmd', 'utf-8');
    const chunks = extractRChunks(content);
    const warnings = chunks.flatMap(c => lintRChunk(c));
    const nonInfo = warnings.filter(w => w.severity !== 'info');
    console.log('Non-info warnings:', nonInfo.length);
    if (nonInfo.length > 0) nonInfo.forEach(w => console.log('  -', w.rule));
  \"" \
  "0 non-info warnings"

# ─────────────────────────────────────────────────────────
# Category 4: Script Generation & Output Parsing
# ─────────────────────────────────────────────────────────

header "Category 4: Script Generation & Report"

run_test 13 \
  "Build validation script from assignment4 chunks" \
  "node -e \"
    import { readFileSync } from 'fs';
    import { extractRChunks, shouldValidateChunk, buildValidationScript } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const content = readFileSync('$FIXTURES/assignment4-solution.qmd', 'utf-8');
    const chunks = extractRChunks(content).filter(shouldValidateChunk);
    const script = buildValidationScript(chunks, { projectRoot: '/tmp/test' });
    console.log('Script lines:', script.split('\\\n').length);
    console.log('Has pdf(NULL):', script.includes('pdf(NULL)'));
    console.log('Has tryCatch:', (script.match(/tryCatch/g) || []).length, 'blocks');
    console.log('Has setwd:', script.includes('setwd'));
  \"" \
  "Script with pdf(NULL), 4 tryCatch blocks, setwd"

run_test 14 \
  "Format validation report with eslint-style output" \
  "node -e \"
    import { parseValidationOutput, formatValidationReport } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
    const stdout = '[PASS] setup\n[PASS] normality-check\n[FAIL] levene-test: error in test\n[WARN] plots: some warning';
    const report = parseValidationOutput(stdout, '', 1);
    const formatted = formatValidationReport(report, [{label: 'optional', options: {}}], 'test.qmd');
    console.log(formatted);
  \"" \
  "eslint-style with dot-alignment, PASS/FAIL/WARN/SKIP, summary line"

# ─────────────────────────────────────────────────────────
# Category 5: Real R Execution (requires Rscript)
# ─────────────────────────────────────────────────────────

header "Category 5: Real R Execution"

if ! command -v Rscript &>/dev/null; then
  log -e "  ${YELLOW}Skipping — Rscript not installed${RESET}"
  SKIP=$((SKIP + 3))
  TOTAL=$((TOTAL + 3))
else
  run_test 15 \
    "Execute generated script for simple R code" \
    "node -e \"
      import { buildValidationScript } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
      import { writeFileSync, unlinkSync } from 'fs';
      import { execFileSync } from 'child_process';
      const chunks = [
        { label: 'add', code: 'cat(1+1)', options: {}, lineNumber: 1 },
        { label: 'vec', code: 'x <- 1:10; cat(mean(x))', options: {}, lineNumber: 5 }
      ];
      const script = buildValidationScript(chunks, { projectRoot: '/tmp' });
      writeFileSync('/tmp/validate-r-test.R', script);
      try {
        const out = execFileSync('Rscript', ['/tmp/validate-r-test.R'], { encoding: 'utf-8', timeout: 30000 });
        console.log(out);
      } finally {
        try { unlinkSync('/tmp/validate-r-test.R'); } catch {}
      }
    \"" \
    "[PASS] add and [PASS] vec in output"

  run_test 16 \
    "Execute script with intentional failure" \
    "node -e \"
      import { buildValidationScript, parseValidationOutput } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
      import { writeFileSync, unlinkSync } from 'fs';
      import { execFileSync } from 'child_process';
      const chunks = [
        { label: 'good', code: 'cat(42)', options: {}, lineNumber: 1 },
        { label: 'bad', code: 'stop(\\\"intentional error\\\")', options: {}, lineNumber: 3 }
      ];
      const script = buildValidationScript(chunks);
      writeFileSync('/tmp/validate-r-fail-test.R', script);
      let out = '';
      try {
        out = execFileSync('Rscript', ['/tmp/validate-r-fail-test.R'], { encoding: 'utf-8', timeout: 30000 });
      } catch (e) { out = e.stdout || ''; }
      const report = parseValidationOutput(out, '', 0);
      console.log('Pass:', report.summary.pass, 'Fail:', report.summary.fail);
      report.results.forEach(r => console.log('  [' + r.status + '] ' + r.label + (r.message ? ': ' + r.message : '')));
      try { unlinkSync('/tmp/validate-r-fail-test.R'); } catch {}
    \"" \
    "1 PASS (good), 1 FAIL (bad: intentional error)"

  run_test 17 \
    "Full round-trip: assignment4-solution.qmd extract->build->run->parse" \
    "node -e \"
      import { readFileSync, writeFileSync, unlinkSync } from 'fs';
      import { execFileSync } from 'child_process';
      import { extractRChunks, shouldValidateChunk, buildValidationScript, parseValidationOutput, formatValidationReport } from '$PROJECT_ROOT/src/teaching/validators/r-code.js';
      const content = readFileSync('$FIXTURES/assignment4-solution.qmd', 'utf-8');
      const chunks = extractRChunks(content);
      const validatable = chunks.filter(shouldValidateChunk);
      const skipped = chunks.filter(c => !shouldValidateChunk(c));
      const script = buildValidationScript(validatable, { projectRoot: '$FIXTURES' });
      const scriptPath = '/tmp/validate-r-roundtrip.R';
      writeFileSync(scriptPath, script);
      let out = '', err = '', exitCode = 0;
      try {
        out = execFileSync('Rscript', [scriptPath], { encoding: 'utf-8', timeout: 60000 });
      } catch (e) {
        out = e.stdout || '';
        err = e.stderr || '';
        exitCode = e.status || 1;
      }
      const report = parseValidationOutput(out, err, exitCode);
      console.log(formatValidationReport(report, skipped, 'assignment4-solution.qmd'));
      console.log();
      console.log('Summary: pass=' + report.summary.pass + ' fail=' + report.summary.fail + ' skip=' + skipped.length);
      try { unlinkSync(scriptPath); } catch {}
    \"" \
    "Multiple PASS/FAIL results, 1 SKIP. Exact results depend on R packages installed."
fi

# ─────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────

header "Results"

log ""
log -e "  ${GREEN}Passed:${RESET}  $PASS"
log -e "  ${RED}Failed:${RESET}  $FAIL"
log -e "  ${YELLOW}Skipped:${RESET} $SKIP"
log -e "  Total:   $TOTAL"
log ""
log "  Log: $LOG_FILE"
log ""

if [[ $FAIL -gt 0 ]]; then
  log -e "  ${RED}Some tests failed. Review log for details.${RESET}"
  exit 1
else
  log -e "  ${GREEN}All tests passed!${RESET}"
  exit 0
fi
