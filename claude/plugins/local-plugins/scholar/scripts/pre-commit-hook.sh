#!/bin/bash

# Scholar Pre-Commit Hook
#
# Validates and syncs YAML configs to JSON before committing.
#
# Install:
#   node scripts/setup-hooks.js
#
# Manual install:
#   cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# Options:
#   SCHOLAR_VALIDATE=1 git commit   # Run full validation
#   git commit --no-verify          # Skip this hook

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Icons
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"
INFO="${CYAN}ℹ${NC}"

# Header
print_header() {
    echo -e "\n${BOLD}${MAGENTA}━━━ Scholar Pre-Commit ━━━${NC}\n"
}

# Check if we have YAML files staged
STAGED_YAML=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ya?ml)$' || true)

if [ -z "$STAGED_YAML" ]; then
    # No YAML files staged, skip entirely
    exit 0
fi

print_header

echo -e "${INFO} ${CYAN}Staged YAML files:${NC}"
echo "$STAGED_YAML" | while read -r file; do
    echo -e "   ${DIM}${file}${NC}"
done
echo ""

# Find the project root (where scripts/ is located)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Handle worktree setups - hooks are in main repo
if [ -f "$(git rev-parse --git-dir)/commondir" ]; then
    # Worktree: find actual project root
    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
else
    # Regular repo: go up from .git/hooks/
    PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
fi

# Verify we found the right directory
if [ ! -f "$PROJECT_ROOT/scripts/sync-yaml.js" ]; then
    # Try current working directory
    PROJECT_ROOT="$(pwd)"
fi

# Step 1: Validation check (status only - quick check)
echo -e "${INFO} ${CYAN}Checking sync status...${NC}"

if [ -f "$PROJECT_ROOT/scripts/sync-yaml.js" ]; then
    # Run status check to see if files are out of sync
    STATUS_OUTPUT=$(cd "$PROJECT_ROOT" && node scripts/sync-yaml.js --status 2>&1) || true

    # Check for out-of-sync files
    if echo "$STATUS_OUTPUT" | grep -q "✗"; then
        echo -e "${WARN} ${YELLOW}Some files are out of sync${NC}"
    else
        echo -e "${CHECK} ${GREEN}All files in sync${NC}"
    fi
fi

# Step 2: Full validation (if SCHOLAR_VALIDATE=1)
if [ "${SCHOLAR_VALIDATE:-0}" = "1" ]; then
    echo ""
    echo -e "${INFO} ${CYAN}Running full validation (SCHOLAR_VALIDATE=1)...${NC}"

    # Check for validation script
    VALIDATE_SCRIPT="$PROJECT_ROOT/scripts/validate-yaml.js"

    if [ -f "$VALIDATE_SCRIPT" ]; then
        if ! node "$VALIDATE_SCRIPT" --staged; then
            echo -e "\n${CROSS} ${RED}Validation failed. Fix errors before committing.${NC}"
            echo -e "${DIM}   Use 'git commit --no-verify' to skip validation${NC}"
            exit 1
        fi
        echo -e "${CHECK} ${GREEN}Validation passed${NC}"
    else
        # Fallback: Use ConfigValidator directly
        if [ -f "$PROJECT_ROOT/src/teaching/validators/config-validator.js" ]; then
            echo -e "${DIM}   Running config validation...${NC}"

            # Validate each staged YAML file
            VALIDATION_FAILED=0
            echo "$STAGED_YAML" | while read -r yaml_file; do
                if [ -f "$yaml_file" ]; then
                    # Simple syntax check via yaml load
                    if ! node -e "
                        import yaml from 'js-yaml';
                        import { readFileSync } from 'fs';
                        try {
                            yaml.load(readFileSync('$yaml_file', 'utf8'));
                            process.exit(0);
                        } catch (e) {
                            console.error('YAML syntax error in $yaml_file:', e.message);
                            process.exit(1);
                        }
                    " 2>/dev/null; then
                        VALIDATION_FAILED=1
                    fi
                fi
            done

            if [ "$VALIDATION_FAILED" = "1" ]; then
                echo -e "\n${CROSS} ${RED}YAML validation failed${NC}"
                exit 1
            fi
            echo -e "${CHECK} ${GREEN}YAML syntax valid${NC}"
        else
            echo -e "${WARN} ${YELLOW}Validation skipped (validator not found)${NC}"
        fi
    fi
fi

# Step 3: Sync YAML → JSON
echo ""
echo -e "${INFO} ${CYAN}Syncing YAML → JSON...${NC}"

SYNC_SCRIPT="$PROJECT_ROOT/scripts/sync-yaml.js"

if [ -f "$SYNC_SCRIPT" ]; then
    cd "$PROJECT_ROOT"

    if ! node "$SYNC_SCRIPT" --quiet; then
        echo -e "\n${CROSS} ${RED}YAML → JSON sync failed${NC}"
        echo -e "${DIM}   Check for syntax errors in staged YAML files${NC}"
        echo -e "${DIM}   Run 'node scripts/sync-yaml.js' for details${NC}"
        exit 1
    fi

    echo -e "${CHECK} ${GREEN}Sync complete${NC}"
elif [ -f "$(which npx 2>/dev/null)" ]; then
    # Try npx as fallback
    if command -v npx &> /dev/null && npx -y @data-wise/scholar sync --quiet 2>/dev/null; then
        echo -e "${CHECK} ${GREEN}Sync complete (via npx)${NC}"
    else
        echo -e "${WARN} ${YELLOW}Sync skipped (script not available)${NC}"
    fi
else
    echo -e "${WARN} ${YELLOW}Sync skipped (scripts/sync-yaml.js not found)${NC}"
    exit 0
fi

# Step 4: Stage generated JSON files
echo ""
echo -e "${INFO} ${CYAN}Staging generated JSON files...${NC}"

STAGED_COUNT=0

# For each staged YAML, stage its corresponding JSON
# Note: Using here-string to avoid subshell (pipe would lose STAGED_COUNT changes)
while read -r yaml_file; do
    [ -z "$yaml_file" ] && continue

    # Convert .yml/.yaml to .json
    json_file=$(echo "$yaml_file" | sed -E 's/\.ya?ml$/.json/')

    if [ -f "$json_file" ]; then
        # Check if JSON was modified
        if ! git diff --quiet "$json_file" 2>/dev/null || ! git diff --cached --quiet "$json_file" 2>/dev/null; then
            git add "$json_file"
            echo -e "   ${CHECK} ${DIM}${json_file}${NC}"
            STAGED_COUNT=$((STAGED_COUNT + 1))
        fi
    fi
done <<< "$STAGED_YAML"

if [ "$STAGED_COUNT" -eq 0 ]; then
    echo -e "   ${DIM}No JSON files needed staging${NC}"
fi

# Success
echo ""
echo -e "${CHECK} ${GREEN}${BOLD}Pre-commit checks passed${NC}"
exit 0
