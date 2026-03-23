#!/usr/bin/env bash
# iterate.sh — 自动实验迭代主循环
# 用法: ./iterate.sh <初始代码目录> "实验目标" [最大迭代次数]
#
# 流程:
#   1. 上传初始代码到服务器
#   2. 运行实验，下载结果
#   3. Claude 分析结果，给出改进建议
#   4. Claude 自动修改代码
#   5. 重复 2-4，共 N 轮
#   6. 生成总结报告

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")""; pwd)"
source "$DIR/config.sh"

log()  { echo "[$(date '+%H:%M:%S')] [iterate] $*" | tee -a "$EXP_LOGS_DIR/iterate.log"; }
info() { echo ""; echo "══════════════════════════════════════════"; echo "  $*"; echo "══════════════════════════════════════════"; echo ""; }

# ── 参数 ──────────────────────────────────────────
INIT_CODE_DIR="${1:-}"
USER_GOAL="${2:-提升实验性能}"
MAX_ITERS="${3:-$EXP_MAX_ITERS}"

if [ -z "$INIT_CODE_DIR" ] || [ ! -d "$INIT_CODE_DIR" ]; then
  echo "用法: $0 <初始代码目录> \"实验目标\" [迭代次数]"
  echo ""
  echo "示例:"
  echo "  $0 templates/example_mnist \"训练 MNIST 分类器，目标 acc > 98%\" 10"
  echo ""
  echo "实验模板: $DIR/templates/"
  exit 1
fi

# ── 初始化 ────────────────────────────────────────
check_exp_deps || exit 1

EXP_ID="exp_$(date +%Y%m%d_%H%M%S)"
EXP_WORK_DIR="$EXP_RESULTS_DIR/$EXP_ID"
mkdir -p "$EXP_WORK_DIR"

# 保存实验元信息
jq -n \
  --arg id "$EXP_ID" \
  --arg goal "$USER_GOAL" \
  --arg iters "$MAX_ITERS" \
  --arg init_code "$(realpath $INIT_CODE_DIR)" \
  --arg started "$(date -Iseconds)" \
  '{id:$id, goal:$goal, max_iters:($iters|tonumber), init_code:$init_code, started_at:$started, status:"running"}' \
  > "$EXP_WORK_DIR/meta.json"

info "实验开始: $EXP_ID"
log "目标: $USER_GOAL"
log "最大迭代: $MAX_ITERS"
log "初始代码: $INIT_CODE_DIR"
log "结果目录: $EXP_WORK_DIR"

# 复制初始代码到 iter_0
ITER_CODE_DIR="$EXP_WORK_DIR/iter_0_code"
cp -r "$INIT_CODE_DIR" "$ITER_CODE_DIR"
chmod +x "$ITER_CODE_DIR/run.sh" 2>/dev/null || true

# ── 主循环 ────────────────────────────────────────
BEST_METRIC="0"
BEST_ITER=0

for ITER in $(seq 1 "$MAX_ITERS"); do
  info "迭代 $ITER / $MAX_ITERS"

  ITER_RESULT_DIR="$EXP_WORK_DIR/iter_${ITER}"
  mkdir -p "$ITER_RESULT_DIR"

  # ── 步骤1: 运行实验 ──────────────────────────────
  log "[步骤1] 运行实验..."
  CODE_TO_RUN="$EXP_WORK_DIR/iter_$((ITER-1))_code"
  # iter_1 使用 iter_0_code，后续使用上轮 patcher 产生的代码
  if [ $ITER -gt 1 ]; then
    CODE_TO_RUN="$EXP_WORK_DIR/iter_$((ITER-1))_patched"
    [ -d "$CODE_TO_RUN" ] || CODE_TO_RUN="$EXP_WORK_DIR/iter_$((ITER-1))_code"
  fi

  log "使用代码: $CODE_TO_RUN"

  # 运行并获取结果目录
  RUN_OUTPUT=$("$DIR/runner.sh" "$CODE_TO_RUN" "$ITER" 2>&1 | tee -a "$EXP_LOGS_DIR/iterate.log")
  ACTUAL_RESULT_DIR=$(echo "$RUN_OUTPUT" | tail -1)

  # 同步 result dir 引用
  if [ -d "$ACTUAL_RESULT_DIR" ]; then
    ITER_RESULT_DIR="$ACTUAL_RESULT_DIR"
  fi

  # 把代码也复制一份到 iter result dir
  cp -r "$CODE_TO_RUN" "$ITER_RESULT_DIR/code" 2>/dev/null || true

  # ── 步骤2: 分析结果 ──────────────────────────────
  log "[步骤2] Claude 分析结果..."
  "$DIR/analyzer.sh" "$ITER_RESULT_DIR" "$ITER" "$USER_GOAL" \
    2>&1 | tee -a "$EXP_LOGS_DIR/iterate.log"

  ANALYSIS_FILE="$ITER_RESULT_DIR/analysis.md"

  # 提取指标（尝试从 metrics.json）
  METRICS_FILE="$ITER_RESULT_DIR/code_out/metrics.json"
  [ -f "$METRICS_FILE" ] || METRICS_FILE=$(find "$ITER_RESULT_DIR" -name 'metrics.json' 2>/dev/null | head -1)
  if [ -f "$METRICS_FILE" ]; then
    CURR_METRIC=$(jq -r '.best_acc // .accuracy // .score // 0' "$METRICS_FILE" 2>/dev/null || echo 0)
    log "当前指标: $CURR_METRIC"
    if awk "BEGIN {exit !($CURR_METRIC > $BEST_METRIC)}"; then
      BEST_METRIC="$CURR_METRIC"
      BEST_ITER=$ITER
      log "★ 新最佳! 迭代 $ITER: $BEST_METRIC"
    fi
  fi

  # ── 步骤3: 生成下一轮代码（最后一轮不需要）────────
  if [ $ITER -lt $MAX_ITERS ]; then
    log "[步骤3] 生成迭代 $((ITER+1)) 代码..."
    NEXT_CODE=$("$DIR/patcher.sh" "$CODE_TO_RUN" "$ANALYSIS_FILE" "$ITER" "$USER_GOAL" \
      2>&1 | tee -a "$EXP_LOGS_DIR/iterate.log" | tail -1)

    if [ -d "$NEXT_CODE" ]; then
      # 将生成的代码移到规范位置
      TARGET="$EXP_WORK_DIR/iter_${ITER}_patched"
      [ "$NEXT_CODE" != "$TARGET" ] && mv "$NEXT_CODE" "$TARGET" 2>/dev/null || true
      chmod +x "$TARGET/run.sh" 2>/dev/null || true
      log "下一轮代码: $TARGET"
    else
      log "WARN: patcher 未返回有效代码目录，复用当前代码"
      cp -r "$CODE_TO_RUN" "$EXP_WORK_DIR/iter_${ITER}_patched"
    fi
  fi

  # 飞书通知（若配置）
  if [ -f "$DIR/../openclaw/notify.sh" ]; then
    "$DIR/../openclaw/notify.sh" \
      "实验迭代 $ITER/$MAX_ITERS 完成" \
      "实验: $EXP_ID\n目标: $USER_GOAL\n当前最佳指标: $BEST_METRIC (迭代$BEST_ITER)" \
      "info" 2>/dev/null || true
  fi

  log "=== 迭代 $ITER 完成 ==="
done

# ── 生成总结报告 ──────────────────────────────────
info "生成总结报告"

SUMMARY_FILE="$EXP_WORK_DIR/summary.md"
{
  echo "# 实验总结报告"
  echo ""
  echo "- **实验ID**: $EXP_ID"
  echo "- **目标**: $USER_GOAL"
  echo "- **总迭代**: $MAX_ITERS"
  echo "- **最佳指标**: $BEST_METRIC (迭代 $BEST_ITER)"
  echo "- **完成时间**: $(date)"
  echo ""
  echo "## 各轮分析摘要"
  echo ""
  for ITER in $(seq 1 "$MAX_ITERS"); do
    ITER_DIR="$EXP_RESULTS_DIR/iter_${ITER}"
    [ -d "$ITER_DIR" ] || ITER_DIR="$EXP_WORK_DIR/iter_${ITER}"
    ANALYSIS_FILE="$ITER_DIR/analysis.md"
    if [ -f "$ANALYSIS_FILE" ]; then
      echo "### 迭代 $ITER"
      echo ""
      head -30 "$ANALYSIS_FILE"
      echo "..."
      echo ""
    fi
  done
} > "$SUMMARY_FILE"

# 更新 meta.json
jq --arg end "$(date -Iseconds)" \
   --arg best "$BEST_METRIC" \
   --arg best_iter "$BEST_ITER" \
   '.status="completed" | .ended_at=$end | .best_metric=$best | .best_iter=($best_iter|tonumber)' \
   "$EXP_WORK_DIR/meta.json" > /tmp/meta_tmp.json && mv /tmp/meta_tmp.json "$EXP_WORK_DIR/meta.json"

# 飞书最终通知
if [ -f "$DIR/../openclaw/notify.sh" ]; then
  "$DIR/../openclaw/notify.sh" \
    "🎉 实验完成: $EXP_ID" \
    "目标: $USER_GOAL\n总迭代: $MAX_ITERS 轮\n最佳指标: $BEST_METRIC (第 $BEST_ITER 轮)\n报告: $SUMMARY_FILE" \
    "info" 2>/dev/null || true
fi

info "实验全部完成！"
log "最佳指标: $BEST_METRIC (迭代 $BEST_ITER)"
log "总结报告: $SUMMARY_FILE"
log "结果目录: $EXP_WORK_DIR"

cat "$SUMMARY_FILE"
