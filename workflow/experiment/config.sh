#!/usr/bin/env bash
# 实验迭代 workflow 配置
# source 此文件后可用所有变量

# ── 服务器配置 ────────────────────────────────────
export EXP_SSH_HOST="172.16.12.3"
export EXP_SSH_USER="admin"
export EXP_SSH_PORT="22"
export EXP_SSH_KEY="${HOME}/.ssh/id_ed25519"
export EXP_SSH="ssh -i $EXP_SSH_KEY -p $EXP_SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10"
export EXP_SCP="scp -i $EXP_SSH_KEY -P $EXP_SSH_PORT -o StrictHostKeyChecking=no"

# ── 服务器端路径 ──────────────────────────────────
export EXP_REMOTE_BASE="/home/admin/experiments"
export EXP_REMOTE_CONDA_ENV=""  # 留空则不激活 conda，可设为 "base" 或具体环境名
export EXP_REMOTE_PYTHON="python3"

# ── 本地路径 ──────────────────────────────────────
EXP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")""; pwd)"
export EXP_DIR
export EXP_RESULTS_DIR="$EXP_DIR/results"
export EXP_LOGS_DIR="$EXP_DIR/logs"
export EXP_TEMPLATES_DIR="$EXP_DIR/templates"

# ── 迭代配置 ──────────────────────────────────────
export EXP_MAX_ITERS="${EXP_MAX_ITERS:-10}"
export EXP_TIMEOUT="${EXP_TIMEOUT:-3600}"   # 单次实验超时秒数
export EXP_CLAUDE_MODEL="${EXP_CLAUDE_MODEL:-claude-sonnet-4-6}"

# ── 工具检查 ──────────────────────────────────────
check_exp_deps() {
  local missing=()
  for cmd in ssh scp claude jq; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
  done
  [ ${#missing[@]} -gt 0 ] && { echo "[ERROR] 缺少工具: ${missing[*]}"; return 1; }
  return 0
}

mkdir -p "$EXP_RESULTS_DIR" "$EXP_LOGS_DIR" "$EXP_TEMPLATES_DIR"
