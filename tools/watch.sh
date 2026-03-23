#!/usr/bin/env bash
# watch.sh — 后台启动 skill 自动同步守护进程
# 用法: ./watch.sh [start|stop|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$HOME/.claude/skills_lyf_watch.pid"
LOG_FILE="$HOME/.claude/skills_lyf_watch.log"

case "${1:-start}" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
      echo "Already running (PID $(cat $PID_FILE))"
      exit 0
    fi
    nohup python3 "$SCRIPT_DIR/sync.py" watch --interval 3 \
      >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Started skill sync watcher (PID $!, log: $LOG_FILE)"
    ;;
  stop)
    if [ -f "$PID_FILE" ]; then
      kill "$(cat $PID_FILE)" 2>/dev/null && echo "Stopped" || echo "Process not running"
      rm -f "$PID_FILE"
    else
      echo "Not running"
    fi
    ;;
  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
      echo "Running (PID $(cat $PID_FILE))"
      tail -5 "$LOG_FILE"
    else
      echo "Not running"
    fi
    ;;
  *)
    echo "Usage: $0 [start|stop|status]"
    ;;
esac
