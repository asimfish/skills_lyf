#!/usr/bin/env bash
# run.sh — 实验入口（服务器上执行）
set -e
cd "$(dirname "$0")"

echo "=== 开始实验: $(date) ==="
echo "工作目录: $(pwd)"
echo "Python: $(python3 --version 2>&1)"
echo ""

# 安装依赖（若有 requirements.txt）
if [ -f requirements.txt ]; then
  echo "安装依赖..."
  pip install -q -r requirements.txt
fi

# 运行主实验
python3 main.py

echo ""
echo "=== 实验完成: $(date) ==="
