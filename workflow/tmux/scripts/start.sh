#!/usr/bin/env bash
# agent-workflow: 启动所有 tmux 会话
# 用法: ./start.sh [session] (不传参数则启动全部)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYOUTS_DIR="$SCRIPT_DIR/../layouts"
CONFIG_FILE="$SCRIPT_DIR/../../config/config.sh"

# 加载全局配置
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

start_session() {
  local name=$1
  local layout="$LAYOUTS_DIR/$name.sh"
  if [ ! -f "$layout" ]; then
    echo "[WARN] 布局文件不存在: $layout"
    return 1
  fi
  if tmux has-session -t "$name" 2>/dev/null; then
    echo "[SKIP] 会话已存在: $name"
    return 0
  fi
  echo "[START] 启动会话: $name"
  bash "$layout"
}

case "${1:-all}" in
  all)
    start_session OT
    start_session WAM
    start_session SAT
    start_session TOOLS
    echo "[DONE] 所有会话已启动，使用 ./attach.sh 进入"
    ;;
  OT|WAM|SAT|TOOLS)
    start_session "$1"
    ;;
  *)
    echo "用法: $0 [all|OT|WAM|SAT|TOOLS]"
    exit 1
    ;;
esac
