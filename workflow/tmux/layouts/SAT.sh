#!/usr/bin/env bash
# SAT 会话: 状态总览
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../../config/config.sh" 2>/dev/null || true

SESSION="SAT"
tmux new-session -d -s "$SESSION" -n 'status' -x 220 -y 50

# 窗口 0: 任务统计
TASK_DIR="${WORKFLOW_DIR:-$DIR/../..}/codex/tasks"
RESULT_DIR="${WORKFLOW_DIR:-$DIR/../..}/codex/results"
WATCH_CMD="echo '=== 任务队列 ===' && ls \"$TASK_DIR\" 2>/dev/null | wc -l && echo '=== 完成 ===' && ls \"$RESULT_DIR\" 2>/dev/null | wc -l"
tmux send-keys -t "$SESSION:status" "watch -n 5 '$WATCH_CMD'" C-m

# 窗口 1: git log
tmux new-window -t "$SESSION" -n 'git-log'
tmux send-keys -t "$SESSION:git-log" \
  "watch -n 30 'git -C ${WORKFLOW_ROOT:-$HOME/projects} log --oneline --graph --all -15 2>/dev/null'" C-m

# 窗口 2: PRs
tmux new-window -t "$SESSION" -n 'prs'
tmux send-keys -t "$SESSION:prs" \
  "watch -n 60 'gh pr list --repo ${GH_REPO:-asimfish/agent-workflow} 2>/dev/null'" C-m

# 窗口 3: 通知日志
tmux new-window -t "$SESSION" -n 'notifs'
tmux send-keys -t "$SESSION:notifs" \
  "tail -f ${LOG_DIR:-$HOME/projects/logs}/notify.log 2>/dev/null || echo '等待通知日志...'" C-m

# 窗口 4: Obsidian
tmux new-window -t "$SESSION" -n 'obsidian'
tmux send-keys -t "$SESSION:obsidian" \
  "ls -lt ${OBSIDIAN_VAULT:-$HOME/Desktop/agent/obsidian}/ 2>/dev/null | head -20" C-m

tmux select-window -t "$SESSION:status"
echo "[SAT] 会话已启动"
