#!/usr/bin/env bash
# analyzer.sh — 用 Claude 分析实验结果，输出改进建议
# 用法: ./analyzer.sh <result_dir> <iter_num> <user_goal>
# 输出: 分析报告写入 <result_dir>/analysis.md

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")""; pwd)"
source "$DIR/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [analyzer] $*" | tee -a "$EXP_LOGS_DIR/analyzer.log"; }

RESULT_DIR="${1:-}"
ITER="${2:-1}"
USER_GOAL="${3:-提升实验性能}"

[ -d "$RESULT_DIR" ] || { log "ERROR: 结果目录不存在: $RESULT_DIR"; exit 1; }

log "=== 分析迭代 $ITER 结果 ==="

# ── 收集实验输出 ──────────────────────────────────
RUN_LOG="$RESULT_DIR/run.log"
METRICS_FILE="$RESULT_DIR/code_out/metrics.json"

# 读取运行日志（最多200行）
RUN_OUTPUT=""
if [ -f "$RUN_LOG" ]; then
  RUN_OUTPUT=$(tail -200 "$RUN_LOG")
else
  RUN_OUTPUT="(无运行日志)"
fi

# 读取 metrics
METRICS_JSON=""
if [ -f "$METRICS_FILE" ]; then
  METRICS_JSON=$(cat "$METRICS_FILE")
elif [ -f "$RESULT_DIR/code_out/metrics.json" ]; then
  METRICS_JSON=$(cat "$RESULT_DIR/code_out/metrics.json")
else
  # 尝试在 code_out 里找任何 json 文件
  JSON_FILE=$(find "$RESULT_DIR" -name '*.json' -not -name 'run_info.json' 2>/dev/null | head -1)
  [ -n "$JSON_FILE" ] && METRICS_JSON=$(cat "$JSON_FILE") || METRICS_JSON="(无 metrics 文件)"
fi

# 读取当前代码（主文件）
CODE_CONTENT=""
CODE_DIR="$RESULT_DIR/code"
if [ -d "$CODE_DIR" ]; then
  for f in "$CODE_DIR/main.py" "$CODE_DIR/train.py" "$CODE_DIR/run.sh" "$CODE_DIR/model.py"; do
    if [ -f "$f" ]; then
      CODE_CONTENT+="\n=== $(basename $f) ===\n$(cat $f)\n"
    fi
  done
  # 补充其他 py 文件（最多3个）
  OTHER_PY=$(find "$CODE_DIR" -name '*.py' -not -name 'main.py' -not -name 'train.py' -not -name 'model.py' 2>/dev/null | head -3)
  for f in $OTHER_PY; do
    CODE_CONTENT+="\n=== $(basename $f) ===\n$(cat $f)\n"
  done
fi
[ -z "$CODE_CONTENT" ] && CODE_CONTENT="(无法读取代码)"

# ── 构建分析 Prompt ───────────────────────────────
PROMPT="你是一位经验丰富的机器学习研究员和代码专家。请分析以下实验结果并给出具体的改进建议。

## 实验目标
$USER_GOAL

## 当前迭代
$ITER

## 实验指标 (metrics.json)
\`\`\`json
$METRICS_JSON
\`\`\`

## 实验输出日志（最后200行）
\`\`\`
$RUN_OUTPUT
\`\`\`

## 当前代码
\`\`\`python
$CODE_CONTENT
\`\`\`

## 请输出分析报告，格式如下：

### 1. 当前性能总结
- 量化当前结果（准确率/loss/速度等）
- 与目标的差距

### 2. 问题诊断
- 列出3-5个主要问题或瓶颈

### 3. 下一轮改进计划（具体可执行）
- 改进点1: [具体修改内容，包含超参数数值]
- 改进点2: ...
- 改进点3: ...

### 4. 预期效果
- 预计改进后的性能
- 改进的理由

要求：改进建议必须具体（包含具体数值/代码改动），不要泛泛而谈。"

# ── 调用 Claude 分析 ──────────────────────────────
log "调用 Claude 分析（模型: $EXP_CLAUDE_MODEL）..."

ANALYSIS_FILE="$RESULT_DIR/analysis.md"

{
  echo "# 实验分析报告 - 迭代 $ITER"
  echo ""
  echo "**分析时间**: $(date)"
  echo "**实验目标**: $USER_GOAL"
  echo ""
  echo "---"
  echo ""
  claude --print "$PROMPT" --model "$EXP_CLAUDE_MODEL" 2>>"$EXP_LOGS_DIR/analyzer.log"
} > "$ANALYSIS_FILE"

log "分析完成: $ANALYSIS_FILE"
cat "$ANALYSIS_FILE"
