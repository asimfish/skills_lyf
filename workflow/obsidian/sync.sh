#!/usr/bin/env bash
# Obsidian 笔记同步 — 将任务结果写入 Vault
# 用法: ./sync.sh <task_id> [note_path]

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../config/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [obsidian] $*" | tee -a "$LOG_DIR/obsidian_sync.log"; }

TASK_ID="${1:-}"
[ -z "$TASK_ID" ] && { echo "用法: $0 <task_id>"; exit 1; }

[ -d "$OBSIDIAN_VAULT" ] || { log "WARN: Vault 不存在: $OBSIDIAN_VAULT，跳过同步"; exit 0; }

RESULT_FILE="$CODEX_RESULT_DIR/${TASK_ID}.json"
[ -f "$RESULT_FILE" ] || { log "ERROR: 结果文件不存在"; exit 1; }

TASK_FILE="$CODEX_TASK_DIR/${TASK_ID}.json"
PROMPT=$(jq -r '.prompt // "unknown"' "$TASK_FILE" 2>/dev/null || echo "unknown")
OUTPUT=$(jq -r '.output // "无输出"' "$RESULT_FILE")
FINISHED=$(jq -r '.finished_at // "unknown"' "$RESULT_FILE")
DATE=$(date '+%Y-%m-%d')

NOTE_DIR="$OBSIDIAN_VAULT/agent-workflow/$DATE"
mkdir -p "$NOTE_DIR"
NOTE_FILE="$NOTE_DIR/${TASK_ID}.md"

cat > "$NOTE_FILE" <<EOF
---
tags: [agent-workflow, codex, task]
task_id: $TASK_ID
date: $DATE
finished_at: $FINISHED
---

# 任务: $TASK_ID

## 描述
$PROMPT

## 输出
$OUTPUT
EOF

log "已写入: $NOTE_FILE"
