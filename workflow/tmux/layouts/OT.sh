#!/usr/bin/env bash
# OT 会话: Claude 主编排器
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../../config/config.sh" 2>/dev/null || true

SESSION="OT"
tmux new-session -d -s "$SESSION" -n 'orchestrator' -x 220 -y 50
tmux send-keys -t "$SESSION:orchestrator" \
  "cd ${WORKFLOW_ROOT:-$HOME/projects} && echo '=== OT: Claude Orchestrator ===' && claude" C-m

tmux new-window -t "$SESSION" -n 'tasks'
tmux send-keys -t "$SESSION:tasks" \
  "watch -n 3 'ls -lt ${WORKFLOW_DIR}/codex/tasks/ 2>/dev/null | head -20'" C-m

tmux new-window -t "$SESSION" -n 'results'
tmux send-keys -t "$SESSION:results" \
  "watch -n 3 'ls -lt ${WORKFLOW_DIR}/codex/results/ 2>/dev/null | head -20'" C-m

tmux select-window -t "$SESSION:orchestrator"
echo "[OT] 会话已启动"
