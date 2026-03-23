#!/usr/bin/env bash
# 飞书 Webhook 通知脚本
# 用法: ./notify.sh <title> <content> [level: info|warn|error]

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/../config/config.sh"

TITLE="${1:-通知}"
CONTENT="${2:-}"
LEVEL="${3:-info}"

[ -z "$FEISHU_WEBHOOK_URL" ] && { echo "[notify] FEISHU_WEBHOOK_URL 未配置，跳过通知"; exit 0; }

case $LEVEL in
  warn)  COLOR="yellow" ;;
  error) COLOR="red"    ;;
  *)     COLOR="green"  ;;
esac

PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg content "$CONTENT" \
  --arg color "$COLOR" \
  '{
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: $title },
        template: $color
      },
      elements: [{
        tag: "div",
        text: { tag: "lark_md", content: $content }
      }]
    }
  }')

curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD" \
  "$FEISHU_WEBHOOK_URL" \
  | tee -a "$LOG_DIR/feishu.log" \
  | jq -r '.msg // .StatusMessage // "发送完成"'
