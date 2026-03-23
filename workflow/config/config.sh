#!/usr/bin/env bash
# agent-workflow 全局配置
# 使用方式: source config/config.sh

# ── 项目根目录 ──────────────────────────────────────
export WORKFLOW_ROOT="${WORKFLOW_ROOT:-$HOME/projects}"
export WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"

# ── 日志 ────────────────────────────────────────────
export LOG_DIR="$WORKFLOW_ROOT/logs"
mkdir -p "$LOG_DIR"

# ── Codex ────────────────────────────────────────────
export CODEX_MODEL="${CODEX_MODEL:-claude-sonnet-4-6}"
# 兼容自定义 API 代理
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://code.aipor.cc}"
export CODEX_WORKERS="${CODEX_WORKERS:-3}"
export CODEX_TASK_DIR="$WORKFLOW_DIR/codex/tasks"
export CODEX_RESULT_DIR="$WORKFLOW_DIR/codex/results"
mkdir -p "$CODEX_TASK_DIR" "$CODEX_RESULT_DIR"

# ── GitHub ───────────────────────────────────────────
export GH_REPO="${GH_REPO:-asimfish/agent-workflow}"  # 格式: owner/repo
export GH_DEFAULT_BRANCH="${GH_DEFAULT_BRANCH:-main}"

# ── Obsidian ─────────────────────────────────────────
export OBSIDIAN_VAULT="${OBSIDIAN_VAULT:-$HOME/Desktop/agent/obsidian}"

# ── 飞书 OpenClaw ─────────────────────────────────────
# 敏感信息放 config/secrets.sh (已加入 .gitignore)
[ -f "$WORKFLOW_DIR/config/secrets.sh" ] && source "$WORKFLOW_DIR/config/secrets.sh"

# ── 工具检查 ──────────────────────────────────────────
check_deps() {
  local missing=()
  for cmd in tmux gh claude jq; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "[WARN] 缺少工具: ${missing[*]}"
    return 1
  fi
  return 0
}
