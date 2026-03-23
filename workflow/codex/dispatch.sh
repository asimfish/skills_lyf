#!/usr/bin/env bash
# Codex 任务分发器
# 用法: ./dispatch.sh <task_id> 或 ./dispatch.sh --file <task.json>

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../config/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [dispatch] $*" | tee -a "$LOG_DIR/dispatch.log"; }

dispatch_task() {
  local task_file="$1"
  [ -f "$task_file" ] || { log "ERROR: 任务文件不存在: $task_file"; exit 1; }

  local task_id prompt work_dir model
  task_id=$(jq -r '.id' "$task_file")
  prompt=$(jq -r '.prompt' "$task_file")
  work_dir=$(jq -r '.work_dir // "'$WORKFLOW_ROOT'"' "$task_file")
  model=$(jq -r '.model // "'$CODEX_MODEL'"' "$task_file")

  log "分发任务 [$task_id]: ${prompt:0:60}..."

  local result_file="$CODEX_RESULT_DIR/${task_id}.json"
  local log_file="$LOG_DIR/task_${task_id}.log"

  # 调用 claude (--print 非交互模式)
  {
    echo "{\"id\":\"$task_id\",\"status\":\"running\",\"started_at\":\"$(date -Iseconds)\"}"
  } > "$result_file"

  claude --print "$prompt" \
    --model "$model" \
    2>"$log_file" | tee -a "$log_file" | \
  (
    output=$(cat)
    jq -n \
      --arg id "$task_id" \
      --arg status "completed" \
      --arg output "$output" \
      --arg finished "$(date -Iseconds)" \
      '{id:$id, status:$status, output:$output, finished_at:$finished}' \
    > "$result_file"
    log "任务完成: $task_id"
  )
}

case "${1:-}" in
  --file)
    dispatch_task "$2"
    ;;
  "")
    echo "用法: $0 <task_id> | --file <task.json>"
    exit 1
    ;;
  *)
    dispatch_task "$CODEX_TASK_DIR/${1}.json"
    ;;
esac
