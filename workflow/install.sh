#!/usr/bin/env bash
# agent-workflow 一键安装脚本
# 用法: bash install.sh

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

WORKFLOW_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      agent-workflow  安装程序            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. 依赖检查 ─────────────────────────────────────
echo "[1/5] 检查依赖..."
MISSING=()
for cmd in tmux gh claude jq curl; do
  if command -v "$cmd" &>/dev/null; then
    ok "$cmd: $(command -v $cmd)"
  else
    warn "缺少: $cmd"
    MISSING+=("$cmd")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  warn "以下工具未安装: ${MISSING[*]}"
  warn "macOS 安装建议:"
  [ " ${MISSING[*]} " =~ " tmux " ] && echo "  brew install tmux"
  [ " ${MISSING[*]} " =~ " gh " ]   && echo "  brew install gh && gh auth login"
  [ " ${MISSING[*]} " =~ " jq " ]   && echo "  brew install jq"
  [ " ${MISSING[*]} " =~ " claude " ] && echo "  npm install -g @anthropic-ai/claude-code"
  echo ""
  read -r -p "继续安装? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || die "安装中止"
fi

# ── 2. 目录结构 ─────────────────────────────────────
echo "[2/5] 创建目录结构..."
PROJECT_DIR="${WORKFLOW_ROOT:-$HOME/projects}"
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$WORKFLOW_DIR/codex/tasks"
mkdir -p "$WORKFLOW_DIR/codex/results"
ok "目录就绪: $PROJECT_DIR"

# ── 3. 脚本权限 ─────────────────────────────────────
echo "[3/5] 设置脚本权限..."
find "$WORKFLOW_DIR" -name '*.sh' -exec chmod +x {} \;
ok "所有 .sh 文件已设为可执行"

# ── 4. secrets.sh 配置 ──────────────────────────────
echo "[4/5] 配置密钥文件..."
SECRETS="$WORKFLOW_DIR/config/secrets.sh"
if [ ! -f "$SECRETS" ]; then
  cp "$WORKFLOW_DIR/config/secrets.sh.example" "$SECRETS"
  warn "已创建 config/secrets.sh，请填入真实值:"
  warn "  - FEISHU_WEBHOOK_URL"
  warn "  - ANTHROPIC_API_KEY (如需)"
else
  ok "secrets.sh 已存在"
fi

# ── 5. .gitignore ───────────────────────────────────
echo "[5/5] 更新 .gitignore..."
GITIGNORE="$WORKFLOW_DIR/.gitignore"
for entry in "config/secrets.sh" "codex/tasks/" "codex/results/" "logs/" ".env"; do
  grep -qF "$entry" "$GITIGNORE" 2>/dev/null || echo "$entry" >> "$GITIGNORE"
done
ok ".gitignore 已更新"

# ── 完成 ─────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         安装完成！快速开始:              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  1. 编辑 config/secrets.sh 填入密钥"
echo "  2. 设置项目目录: export WORKFLOW_ROOT=~/your-project"
echo "  3. 启动所有会话: ./tmux/scripts/start.sh"
echo "  4. 进入编排器:   ./tmux/scripts/attach.sh OT"
echo ""
