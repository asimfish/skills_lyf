#!/usr/bin/env bash
# agent-workflow: 进入指定 tmux 会话
# 用法: ./attach.sh [session]

SESSION=\"${1:-OT}\"

if ! tmux has-session -t \"$SESSION\" 2>/dev/null; then
  echo \"[ERROR] 会话不存在: $SESSION，先运行 ./start.sh $SESSION\"
  exit 1
fi

# 如果在 tmux 内则切换，否则直接 attach
if [ -n \"$TMUX\" ]; then
  tmux switch-client -t \"$SESSION\"
else
  tmux attach-session -t \"$SESSION\"
fi
