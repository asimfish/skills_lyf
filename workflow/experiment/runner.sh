#!/usr/bin/env bash
# runner.sh — 上传代码到服务器、执行实验、下载结果
# 用法: ./runner.sh <code_dir> <iter_num>
# 最后一行输出结果目录路径

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")""; pwd)"
source "$DIR/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [runner] $*" | tee -a "$EXP_LOGS_DIR/runner.log"; }

CODE_DIR="${1:-}"
ITER="${2:-1}"

[ -d "$CODE_DIR" ] || { log "ERROR: 代码目录不存在: $CODE_DIR"; exit 1; }

REMOTE_JOB_DIR="$EXP_REMOTE_BASE/iter_${ITER}_$(date +%H%M%S)"
LOCAL_RESULT_DIR="$EXP_RESULTS_DIR/iter_${ITER}"
mkdir -p "$LOCAL_RESULT_DIR"

log "=== 迭代 $ITER: 上传代码 ==="
log "本地: $CODE_DIR"
log "远程: ${EXP_SSH_USER}@${EXP_SSH_HOST}:$REMOTE_JOB_DIR"

# 1. 创建远程目录
$EXP_SSH ${EXP_SSH_USER}@${EXP_SSH_HOST} "mkdir -p $REMOTE_JOB_DIR"

# 2. 上传代码
$EXP_SCP -r "$CODE_DIR/" "${EXP_SSH_USER}@${EXP_SSH_HOST}:${REMOTE_JOB_DIR}/"
log "代码上传完成"

# 3. 执行实验
log "=== 执行实验 (超时: ${EXP_TIMEOUT}s) ==="
RUN_LOG="$LOCAL_RESULT_DIR/run.log"

$EXP_SSH ${EXP_SSH_USER}@${EXP_SSH_HOST} bash <<REMOTE_EOF 2>&1 | tee "$RUN_LOG"
set -e
cd "$REMOTE_JOB_DIR"
echo "[远程] 工作目录: \$(pwd)"
echo "[远程] 时间: \$(date)"

# 激活 conda 环境（若配置）
if [ -n "$EXP_REMOTE_CONDA_ENV" ]; then
  source ~/miniconda3/etc/profile.d/conda.sh 2>/dev/null || \
  source ~/anaconda3/etc/profile.d/conda.sh 2>/dev/null || true
  conda activate "$EXP_REMOTE_CONDA_ENV" 2>/dev/null || true
  echo "[远程] conda 环境: $EXP_REMOTE_CONDA_ENV"
fi

# 找到入口
if [ -f run.sh ]; then
  chmod +x run.sh
  timeout $EXP_TIMEOUT bash run.sh
elif [ -f main.py ]; then
  timeout $EXP_TIMEOUT $EXP_REMOTE_PYTHON main.py
elif [ -f train.py ]; then
  timeout $EXP_TIMEOUT $EXP_REMOTE_PYTHON train.py
else
  echo "[ERROR] 未找到入口文件 (run.sh / main.py / train.py)"
  exit 1
fi

echo "[远程] 实验完成: \$(date)"
REMOTE_EOF

EXIT_CODE=${PIPESTATUS[0]}
if [ $EXIT_CODE -ne 0 ]; then
  log "WARN: 实验退出码 $EXIT_CODE，继续分析已有输出"
fi

# 4. 下载结果
log "=== 下载结果 ==="
# 下载整个远程目录
$EXP_SCP -r "${EXP_SSH_USER}@${EXP_SSH_HOST}:${REMOTE_JOB_DIR}/" \
  "$LOCAL_RESULT_DIR/code_out/" 2>/dev/null || true

# 也把代码本身存一份
cp -r "$CODE_DIR" "$LOCAL_RESULT_DIR/code" 2>/dev/null || true

# 5. 清理远程（保留最近5轮，删旧的）
$EXP_SSH ${EXP_SSH_USER}@${EXP_SSH_HOST} \
  "ls -dt $EXP_REMOTE_BASE/iter_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true"

log "=== 迭代 $ITER 完成，结果: $LOCAL_RESULT_DIR ==="
echo "$LOCAL_RESULT_DIR"
