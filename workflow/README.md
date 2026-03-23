# agent-workflow

> tmux + Claude + Codex + GitHub + Obsidian + 飞书 的多项目 AI 开发工作流

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                   tmux 会话层                            │
│  OT (编排器) │ WAM (工作者监控) │ SAT (状态) │ TOOLS    │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────────────────────┐
│  Claude 编排器  │────▶│  Codex Workers (并行执行)    │
│  CLAUDE.md      │     │  dispatch.sh → claude --print │
└────────┬────────┘     └──────────────┬───────────────┘
         │                             │
         ▼                             ▼
┌────────────────┐          ┌─────────────────────┐
│  GitHub        │          │  结果合并 & 审查     │
│  Issue → Task  │          │  create_pr.sh        │
│  sync_issues   │          └──────────┬──────────┘
└────────────────┘                     │
         │              ┌──────────────┼──────────────┐
         │              ▼              ▼               ▼
         │     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
         └────▶│  Obsidian    │ │  飞书    │ │  日志        │
               │  sync.sh     │ │notify.sh │ │  logs/       │
               └──────────────┘ └──────────┘ └──────────────┘
```

## 快速开始

```bash
# 1. 克隆项目
git clone <repo> ~/Desktop/agent/workflow
cd ~/Desktop/agent/workflow

# 2. 安装
bash install.sh

# 3. 配置
export WORKFLOW_ROOT=~/your-project
export GH_REPO=owner/repo
vim config/secrets.sh   # 填入飞书 Webhook 等

# 4. 启动
./tmux/scripts/start.sh
./tmux/scripts/attach.sh OT
```

## tmux 会话说明

| 会话 | 用途 | 进入方式 |
|------|------|----------|
| `OT` | Claude 主编排器 | `./tmux/scripts/attach.sh OT` |
| `WAM` | Codex Worker 监控 | `./tmux/scripts/attach.sh WAM` |
| `SAT` | GitHub/成本/Obsidian 状态 | `./tmux/scripts/attach.sh SAT` |
| `TOOLS` | 系统监控 / 临时 shell | `./tmux/scripts/attach.sh TOOLS` |

## 核心命令

```bash
# 创建并分发任务
./codex/new_task.sh "实现用户登录功能" ~/projects/my-app
./codex/dispatch.sh task_20250322_120000_1234

# 从 GitHub Issues 同步任务 (label: agent-task)
./github/scripts/sync_issues.sh --dispatch

# 创建 PR
./github/scripts/create_pr.sh task_id feature/branch

# 飞书通知
./openclaw/notify.sh "任务完成" "task_id 已合并" info

# Obsidian 笔记同步
./obsidian/sync.sh task_id
```

## 目录结构

```
workflow/
├── install.sh              # 一键安装
├── config/
│   ├── config.sh           # 全局配置
│   └── secrets.sh.example  # 密钥模板 (复制为 secrets.sh)
├── tmux/
│   ├── layouts/            # OT / WAM / SAT / TOOLS 布局
│   └── scripts/            # start / attach / kill
├── claude/
│   └── CLAUDE.md           # 编排器系统提示
├── codex/
│   ├── dispatch.sh         # 任务分发器
│   ├── new_task.sh         # 快速创建任务
│   ├── tasks/              # 待处理任务 JSON (gitignored)
│   └── results/            # Worker 结果 (gitignored)
├── github/
│   ├── templates/          # Issue/PR 模板
│   └── scripts/            # sync_issues / create_pr
├── obsidian/
│   ├── sync.sh             # 结果写入 Vault
│   └── templates/          # 笔记模板
└── openclaw/
    └── notify.sh           # 飞书 Webhook 通知
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WORKFLOW_ROOT` | 项目根目录 | `~/projects` |
| `GH_REPO` | GitHub 仓库 | 必填 |
| `OBSIDIAN_VAULT` | Obsidian Vault 路径 | `~/Desktop/agent/obsidian` |
| `FEISHU_WEBHOOK_URL` | 飞书机器人 Webhook | 见 secrets.sh |
| `CODEX_MODEL` | 默认模型 | `claude-sonnet-4-6` |
| `CODEX_WORKERS` | 并行 Worker 数 | `3` |

## 依赖

- [tmux](https://github.com/tmux/tmux) `>= 3.0`
- [gh](https://cli.github.com/) — GitHub CLI
- [claude](https://www.npmjs.com/package/@anthropic-ai/claude-code) — Claude Code CLI
- [jq](https://stedolan.github.io/jq/) — JSON 处理
- `curl` — 飞书通知
