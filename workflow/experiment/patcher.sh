#!/usr/bin/env bash
# patcher.sh — 根据 Claude 分析结果，自动修改代码生成下一轮实验代码
# 用法: ./patcher.sh <current_code_dir> <analysis_file> <iter_num> <user_goal>

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")""; pwd)"
source "$DIR/config.sh"

log() { echo "[$(date '+%H:%M:%S')] [patcher] $*" | tee -a "$EXP_LOGS_DIR/patcher.log"; }

CURRENT_CODE_DIR="${1:-}"
ANALYSIS_FILE="${2:-}"
ITER="${3:-1}"
USER_GOAL="${4:-提升实验性能}"

[ -d "$CURRENT_CODE_DIR" ] || { log "ERROR: 代码目录不存在: $CURRENT_CODE_DIR"; exit 1; }
[ -f "$ANALYSIS_FILE" ]    || { log "ERROR: 分析文件不存在: $ANALYSIS_FILE"; exit 1; }

NEXT_ITER=$((ITER + 1))
NEXT_CODE_DIR="$EXP_RESULTS_DIR/iter_${NEXT_ITER}/code"
mkdir -p "$NEXT_CODE_DIR"

log "=== 生成迭代 $NEXT_ITER 代码 ==="

# 复制当前代码作为基础
cp -r "$CURRENT_CODE_DIR/" "$NEXT_CODE_DIR/"

# 读取代码和分析
ANALYSIS=$(cat "$ANALYSIS_FILE")
CODE_FILES=$(find "$CURRENT_CODE_DIR" -name '*.py' -o -name '*.sh' -o -name '*.yaml' -o -name '*.yml' -o -name '*.json' | head -20)

CODE_CONTENT=""
for f in $CODE_FILES; do
  [ -f "$f" ] || continue
  REL=$(realpath --relative-to="$CURRENT_CODE_DIR" "$f" 2>/dev/null || echo "$(basename $f)")
  CODE_CONTENT+="\n=== $REL ===\n$(cat $f)\n"
done

# 调用 Claude 生成修改后的完整代码
PROMPT="你是一个代码改进专家。根据实验分析报告，对代码进行具体修改，输出修改后的完整代码文件。

## 用户实验目标
$USER_GOAL

## 当前迭代
$ITER -> $NEXT_ITER

## 当前代码
$CODE_CONTENT

## 分析报告（包含改进建议）
$ANALYSIS

## 输出要求
严格按照以下格式输出，每个需要修改的文件用分隔符包裹：

<<<FILE: 文件名>>>
完整文件内容
<<<END>>>

规则：
1. 只输出需要修改的文件
2. 输出完整文件内容，不要省略
3. 改动要具体、有针对性，直接实现分析报告中的改进建议
4. 不要输出解释，只输出文件内容块
5. 如果是 run.sh 确保它能被 bash 直接执行"

log "调用 Claude 生成修改代码..."
CLAUDE_OUTPUT=$(claude --print "$PROMPT" --model "$EXP_CLAUDE_MODEL" 2>>"$EXP_LOGS_DIR/patcher.log")

# 解析 Claude 输出，写入文件
echo "$CLAUDE_OUTPUT" | awk '
  /^<<<FILE: / {
    if (outfile != "") close(outfile)
    match($0, /<<<FILE: (.+)>>>/, arr)
    outfile = ENVIRON["NEXT_CODE_DIR"] "/" arr[1]
    # 确保父目录存在
    cmd = "mkdir -p \"" outfile "\""
    gsub(/\/[^\/]*$/, "", cmd)
    system("mkdir -p \"" gensub(/\/[^\/]*$/, "", 1, outfile) "\"")
    writing = 1
    next
  }
  /^<<<END>>>/ {
    if (outfile != "") close(outfile)
    outfile = ""
    writing = 0
    next
  }
  writing && outfile != "" {
    print > outfile
  }
' NEXT_CODE_DIR="$NEXT_CODE_DIR"

# 确保 run.sh 可执行
[ -f "$NEXT_CODE_DIR/run.sh" ] && chmod +x "$NEXT_CODE_DIR/run.sh"

# 保存原始 Claude 输出
echo "$CLAUDE_OUTPUT" > "$EXP_RESULTS_DIR/iter_${NEXT_ITER}/patch_raw.txt"

log "=== 迭代 $NEXT_ITER 代码生成完成: $NEXT_CODE_DIR ==="
echo "$NEXT_CODE_DIR"
