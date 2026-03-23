#!/usr/bin/env bash
# WAM 会话: Worker 监控 + GitHub Actions
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../../config/config.sh" 2>/dev/null || true

SESSION="WAM"
tmux new-session -d -s "$SESSION" -n 'monitor' -x 220 -y 50
tmux send-keys -t "$SESSION:monitor" \
  "tail -f ${LOG_DIR}/codex.log 2>/dev/null || echo '等待日志...' && sleep 1" C-m

tmux new-window -t "$SESSION" -n 'gh-actions'
tmux send-keys -t "$SESSION:gh-actions" \
  "watch -n 30 'gh run list --repo ${GH_REPO} --limit 10 2>/dev/null'" C-m

tmux new-window -t "$SESSION" -n 'issues'
tmux send-keys -t "$SESSION:issues" \
  "watch -n 60 'gh issue list --repo ${GH_REPO} --label agent-task 2>/dev/null'" C-m

tmux new-window -t "$SESSION" -n 'workers'
tmux send-keys -t "$SESSION:workers" \
  "watch -n 5 'ps aux | grep claude | grep -v grep'" C-m

tmux select-window -t "$SESSION:monitor"
echo "[WAM] 会话已启动"
