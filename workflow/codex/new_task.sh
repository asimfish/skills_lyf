#!/usr/bin/env bash
# 快速创建新 Codex 任务
# 用法: ./new_task.sh "任务描述" [work_dir] [model]

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../config/config.sh"

PROMPT="${1:-}"
[ -z "$PROMPT" ] && { echo "用法: $0 \"任务描述\" [work_dir] [model]"; exit 1; }

WORK_DIR="${2:-$WORKFLOW_ROOT}"
MODEL="${3:-$CODEX_MODEL}"
TASK_ID="task_$(date +%Y%m%d_%H%M%S)_$$"

TASK_FILE="$CODEX_TASK_DIR/${TASK_ID}.json"
jq -n \
  --arg id "$TASK_ID" \
  --arg prompt "$PROMPT" \
  --arg work_dir "$WORK_DIR" \
  --arg model "$MODEL" \
  --arg created "$(date -Iseconds)" \
  '{id:$id, prompt:$prompt, work_dir:$work_dir, model:$model, created_at:$created, status:"pending"}' \
> "$TASK_FILE"

echo "[new_task] 已创建: $TASK_ID"
echo "[new_task] 文件: $TASK_FILE"
echo ""
echo "运行任务: $DIR/dispatch.sh $TASK_ID"
