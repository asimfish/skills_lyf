#!/usr/bin/env bash
# agent-workflow: 关闭指定或全部会话
# 用法: ./kill.sh [session|all]

case "${1:-all}" in
  all)
    for s in OT WAM SAT TOOLS; do
      tmux kill-session -t "$s" 2>/dev/null && echo "[KILL] $s" || echo "[SKIP] $s 不存在"
    done
    ;;
  *)
    tmux kill-session -t "$1" 2>/dev/null && echo "[KILL] $1" || echo "[SKIP] $1 不存在"
    ;;
esac
