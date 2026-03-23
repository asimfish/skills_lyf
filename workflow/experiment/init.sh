#!/usr/bin/env bash
# init.sh — 初始化实验环境（服务器端），首次使用前运行
# 用法: ./init.sh

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")""; pwd)"
source "$DIR/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [init] $*"; }

log "=== 初始化实验环境 ==="
log "服务器: ${EXP_SSH_USER}@${EXP_SSH_HOST}:${EXP_SSH_PORT}"
log "SSH Key: $EXP_SSH_KEY"

# 1. 检查本地依赖
check_exp_deps || exit 1
log "本地依赖检查通过"

# 2. 测试 SSH
log "测试 SSH 连接..."
$EXP_SSH ${EXP_SSH_USER}@${EXP_SSH_HOST} "echo 'SSH OK: $(hostname)'" || {
  echo ""
  echo "[ERROR] SSH 连接失败！请检查:"
  echo "  1. 服务器地址/端口是否正确: $EXP_SSH_HOST:$EXP_SSH_PORT"
  echo "  2. 用户名是否正确: $EXP_SSH_USER"
  echo "  3. SSH 私钥是否存在: $EXP_SSH_KEY"
  echo "  4. 服务器上 ~/.ssh/authorized_keys 是否包含你的公钥"
  exit 1
}
log "SSH 连接正常"

# 3. 创建服务器端目录
log "创建服务器端实验目录: $EXP_REMOTE_BASE"
$EXP_SSH ${EXP_SSH_USER}@${EXP_SSH_HOST} "mkdir -p $EXP_REMOTE_BASE"
log "服务器端目录创建完成"

# 4. 检查服务器 Python
log "检查服务器 Python..."
PY_VER=$($EXP_SSH ${EXP_SSH_USER}@${EXP_SSH_HOST} "$EXP_REMOTE_PYTHON --version 2>&1" || echo "未找到")
log "服务器 Python: $PY_VER"

# 5. 使脚本可执行
chmod +x "$DIR"/*.sh
log "本地脚本权限设置完成"

echo ""
echo "====================================="
echo "  初始化完成！"
echo "====================================="
echo ""
echo "使用方法:"
echo "  cd $DIR"
echo "  ./iterate.sh <你的实验代码目录> \"实验目标描述\" [迭代次数]"
echo ""
echo "示例:"
echo "  ./iterate.sh ~/my_exp \"训练分类模型，目标 acc>90%\" 10"
echo ""
echo "实验模板参考: $DIR/templates/"
echo ""
