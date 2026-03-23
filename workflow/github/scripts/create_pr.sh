#!/usr/bin/env bash
# 从 Codex 结果自动创建 PR
# 用法: ./create_pr.sh <task_id> <branch>

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../../config/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [github] $*" | tee -a "$LOG_DIR/github.log"; }

TASK_ID="${1:-}"
BRANCH="${2:-}"
[ -z "$TASK_ID" ] || [ -z "$BRANCH" ] && { echo "用法: $0 <task_id> <branch>"; exit 1; }

RESULT_FILE="$CODEX_RESULT_DIR/${TASK_ID}.json"
[ -f "$RESULT_FILE" ] || { log "ERROR: 结果文件不存在: $RESULT_FILE"; exit 1; }

SUMMARY=$(jq -r '.output // "无描述"' "$RESULT_FILE" | head -5)
TITLE="[Codex] ${TASK_ID}: $(jq -r '.prompt // "task"' "$CODEX_TASK_DIR/${TASK_ID}.json" | head -c 60)"

log "创建 PR: $TITLE (branch: $BRANCH)"

gh pr create \
  --title "$TITLE" \
  --body "$(cat <<EOF
## 任务
任务 ID: \`$TASK_ID\`

## 摘要
$SUMMARY

## 测试清单
- [ ] 代码已通过 lint
- [ ] 主要逻辑已验证
- [ ] 无硬编码密钥

---
> 由 agent-workflow Codex Worker 自动生成
EOF
)" \
  --base "$GH_DEFAULT_BRANCH" \
  --head "$BRANCH" && log "PR 已创建" || log "PR 创建失败"
