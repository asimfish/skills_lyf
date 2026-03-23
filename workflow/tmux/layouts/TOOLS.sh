#!/usr/bin/env bash
# TOOLS 会话: Shell 工具
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../../config/config.sh" 2>/dev/null || true

SESSION="TOOLS"
tmux new-session -d -s "$SESSION" -n 'shell' -x 220 -y 50
tmux send-keys -t "$SESSION:shell" \
  "source ${WORKFLOW_DIR}/config/config.sh && cd ${WORKFLOW_DIR} && echo '=== TOOLS Shell ===' && echo \"WORKFLOW_DIR=$WORKFLOW_DIR\"" C-m

tmux new-window -t "$SESSION" -n 'htop'
tmux send-keys -t "$SESSION:htop" 'htop' C-m

tmux new-window -t "$SESSION" -n 'git'
tmux send-keys -t "$SESSION:git" \
  "cd ${WORKFLOW_ROOT:-$HOME/projects} && git status" C-m

tmux new-window -t "$SESSION" -n 'dispatch'
tmux send-keys -t "$SESSION:dispatch" \
  "cd ${WORKFLOW_DIR} && echo '新建任务: ./codex/new_task.sh \"描述\" ~/project'" C-m

tmux select-window -t "$SESSION:shell"
echo "[TOOLS] 会话已启动"
