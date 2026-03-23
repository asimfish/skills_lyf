#!/usr/bin/env bash
# 将 GitHub Issues (label: agent-task) 同步为本地 Codex 任务
# 用法: ./sync_issues.sh [--dispatch]

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../../config/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [sync_issues] $*" | tee -a "$LOG_DIR/github.log"; }

[ -z "$GH_REPO" ] && { log "ERROR: GH_REPO 未配置"; exit 1; }

AUTO_DISPATCH="${1:-}"

log "拉取 Issues from $GH_REPO ..."

gh issue list \
  --repo "$GH_REPO" \
  --label "agent-task" \
  --state open \
  --json number,title,body,labels \
  --limit 50 | \
jq -c '.[]' | \
while read -r issue; do
  NUM=$(echo "$issue" | jq -r '.number')
  TITLE=$(echo "$issue" | jq -r '.title')
  BODY=$(echo "$issue" | jq -r '.body // ""')
  TASK_ID="gh_issue_${NUM}"
  TASK_FILE="$CODEX_TASK_DIR/${TASK_ID}.json"

  if [ -f "$TASK_FILE" ]; then
    log "[SKIP] Issue #$NUM 已存在任务文件"
    continue
  fi

  log "[NEW] Issue #$NUM: $TITLE"
  jq -n \
    --arg id "$TASK_ID" \
    --arg prompt "$TITLE\n\n$BODY" \
    --arg work_dir "$WORKFLOW_ROOT" \
    --arg model "$CODEX_MODEL" \
    --arg created "$(date -Iseconds)" \
    --argjson issue_num "$NUM" \
    '{id:$id, prompt:$prompt, work_dir:$work_dir, model:$model,
      created_at:$created, status:"pending", github_issue:$issue_num}' \
  > "$TASK_FILE"

  if [ "$AUTO_DISPATCH" = "--dispatch" ]; then
    log "[DISPATCH] $TASK_ID"
    bash "$DIR/../../codex/dispatch.sh" "$TASK_ID" &
  fi
done

log "同步完成"
