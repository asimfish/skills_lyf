#!/usr/bin/env bash
# skills_lyf — 一键部署脚本
# 用法: bash install.sh

set -e
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { echo -e "${GREEN}[+]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

echo ""
echo "=== skills_lyf 一键部署 ==="
echo ""

# ── 1. 检查依赖 ───────────────────────────────────────────────────────────────
MISSING=()
for cmd in git claude jq tmux gh curl; do
  command -v "$cmd" &>/dev/null || MISSING+=("$cmd")
done
[ ${#MISSING[@]} -gt 0 ] && warn "以下工具未安装，部分功能不可用: ${MISSING[*]}"

CLAUDE_DST="$HOME/.claude"
CURSOR_DST="$HOME/.cursor"

# ── 2. CLAUDE.md ──────────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DST"
if [ ! -f "$CLAUDE_DST/CLAUDE.md" ]; then
  cp "$REPO_DIR/claude/CLAUDE.md" "$CLAUDE_DST/CLAUDE.md"
  info "CLAUDE.md 已复制"
else
  warn "CLAUDE.md 已存在，跳过"
fi

# ── 3. settings.json ──────────────────────────────────────────────────────────
if [ ! -f "$CLAUDE_DST/settings.json" ]; then
  cp "$REPO_DIR/claude/settings.json.example" "$CLAUDE_DST/settings.json"
  warn "settings.json 已从模板创建 — 请编辑填入 ANTHROPIC_AUTH_TOKEN"
else
  warn "settings.json 已存在，跳过"
fi

# ── 4. agents ─────────────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DST/agents"
for f in "$REPO_DIR/claude/agents/"*.md; do
  dst="$CLAUDE_DST/agents/$(basename "$f")"
  [ -f "$dst" ] || cp "$f" "$dst"
done
info "agents 已部署 ($(ls "$REPO_DIR/claude/agents/" | wc -l | tr -d ' ') 个)"

# ── 5. skills ─────────────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DST/skills"
for d in "$REPO_DIR/claude/skills/"/*/; do
  name="$(basename "$d")"
  dst="$CLAUDE_DST/skills/$name"
  [ -d "$dst" ] || cp -r "$d" "$dst"
done
info "skills 已部署 ($(ls "$REPO_DIR/claude/skills/" | wc -l | tr -d ' ') 个)"

# ── 6. rules ──────────────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DST/rules/common" "$CLAUDE_DST/rules/python"
for f in "$REPO_DIR/claude/rules/common/"*.md; do
  dst="$CLAUDE_DST/rules/common/$(basename "$f")"
  [ -f "$dst" ] || cp "$f" "$dst"
done
for f in "$REPO_DIR/claude/rules/python/"*.md; do
  dst="$CLAUDE_DST/rules/python/$(basename "$f")"
  [ -f "$dst" ] || cp "$f" "$dst"
done
info "rules 已部署"

# ── 7. mcp-servers ────────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DST/mcp-servers"
for d in "$REPO_DIR/claude/mcp-servers/"/*/; do
  name="$(basename "$d")"
  dst="$CLAUDE_DST/mcp-servers/$name"
  if [ ! -d "$dst" ]; then
    cp -r "$d" "$dst"
    if [ -f "$dst/requirements.txt" ]; then
      pip3 install -q -r "$dst/requirements.txt" 2>/dev/null && info "  $name Python 依赖已安装"
    fi
  fi
done
info "mcp-servers 已部署"

# ── 8. ccline 配置（二进制需手动安装）────────────────────────────────────────
mkdir -p "$CLAUDE_DST/ccline/themes"
for f in "$REPO_DIR/claude/ccline/themes/"*.toml; do
  cp "$f" "$CLAUDE_DST/ccline/themes/$(basename "$f")" 2>/dev/null || true
done
[ -f "$REPO_DIR/claude/ccline/models.toml" ] && cp "$REPO_DIR/claude/ccline/models.toml" "$CLAUDE_DST/ccline/models.toml"
info "ccline 配置已部署"
[ ! -f "$CLAUDE_DST/ccline/ccline" ] && warn "ccline 二进制未找到 — 请参考 README 安装"

# ── 9. scholar plugin ─────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DST/plugins/local-plugins"
if [ ! -d "$CLAUDE_DST/plugins/local-plugins/scholar" ]; then
  cp -r "$REPO_DIR/claude/plugins/local-plugins/scholar" "$CLAUDE_DST/plugins/local-plugins/"
  info "scholar plugin 已部署"
fi

# ── 10. Cursor skills ─────────────────────────────────────────────────────────
mkdir -p "$CURSOR_DST/skills-cursor"
for d in "$REPO_DIR/cursor/skills-cursor/"/*/; do
  name="$(basename "$d")"
  dst="$CURSOR_DST/skills-cursor/$name"
  [ -d "$dst" ] || cp -r "$d" "$dst"
done
info "Cursor skills 已部署 ($(ls "$REPO_DIR/cursor/skills-cursor/" | wc -l | tr -d ' ') 个)"

if [ ! -f "$CURSOR_DST/mcp.json" ]; then
  cp "$REPO_DIR/cursor/mcp.json.example" "$CURSOR_DST/mcp.json"
  warn "cursor/mcp.json 已从模板创建，请按需修改"
else
  warn "cursor/mcp.json 已存在，跳过"
fi

# ── 11. workflow ──────────────────────────────────────────────────────────────
WORKFLOW_DST="$HOME/Desktop/agent/workflow"
if [ ! -d "$WORKFLOW_DST" ]; then
  mkdir -p "$(dirname "$WORKFLOW_DST")"
  cp -r "$REPO_DIR/workflow" "$WORKFLOW_DST"
  info "workflow 已部署到 $WORKFLOW_DST"
  if [ ! -f "$WORKFLOW_DST/config/secrets.sh" ] && [ -f "$WORKFLOW_DST/config/secrets.sh.example" ]; then
    cp "$WORKFLOW_DST/config/secrets.sh.example" "$WORKFLOW_DST/config/secrets.sh"
    warn "请编辑 $WORKFLOW_DST/config/secrets.sh 填入飞书 Webhook 等密钥"
  fi
else
  warn "workflow 已存在于 $WORKFLOW_DST，跳过"
fi

# ── 完成 ──────────────────────────────────────────────────────────────────────
echo ""
echo "=== 部署完成 ==="
echo ""
echo "后续步骤:"
echo "  1. 编辑 ~/.claude/settings.json        — 填入 ANTHROPIC_AUTH_TOKEN"
echo "  2. 编辑 ~/Desktop/agent/workflow/config/secrets.sh — 填入飞书 Webhook"
echo "  3. (可选) 安装 ccline 二进制，见 README"
echo "  4. 启动 workflow: cd ~/Desktop/agent/workflow && bash install.sh"
echo ""
