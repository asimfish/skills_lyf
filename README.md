# skills_lyf

> AI 工具 skill 统一管理套件 — 把 Codex、Cursor、OpenClaw 的 skill 汇聚到 Claude 统一管理，再按需分发到各工具，附带 162 个开箱即用的 skill 配置

[![GitHub stars](https://img.shields.io/github/stars/asimfish/skills_lyf?style=flat-square)](https://github.com/asimfish/skills_lyf)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## 两种使用方式

**方式一：只用 sync.py 统一管理自己机器上已有的 skill**（不安装本仓库任何 skill）

```bash
git clone https://github.com/asimfish/skills_lyf ~/Desktop/agent/skills_lyf
cd ~/Desktop/agent/skills_lyf
# 把各工具已有的 skill 先汇聚到 Claude，统一管理后再分发回各工具
python3 tools/sync.py import          # 把 Codex/Cursor/OpenClaw 的 skill 导入 Claude
python3 tools/sync.py stage           # 预览 Claude → 各工具的转换结果
python3 tools/sync.py deploy --merge  # 增量分发到各工具（不覆盖已有）
```

**方式二：安装本仓库的 162 个 skill + 全套配置**

```bash
git clone https://github.com/asimfish/skills_lyf ~/Desktop/agent/skills_lyf
cd ~/Desktop/agent/skills_lyf
bash install.sh   # 只新增，不覆盖已有配置
```

> 无论哪种方式，`deploy` 操作请**务必加 `--merge`**，否则会覆盖目标目录已有的 skill。
> 详见[安全警告](#deploy-安全警告覆盖风险)。

---

本仓库包含：

- **162 个 Claude Code skills**（含 [ARIS](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) 研究自动化全集）
- **21 个 subagents**（code-reviewer、architect、ml-debugger 等）
- **14 条 rules**（编码规范、安全、测试等）
- **3 个自研 MCP servers**（codex-dispatch、git-orchestra、llm-chat）
- **5 个 Cursor skills**
- **scholar local plugin**（arxiv / crossref 学术搜索）
- **ccline 状态栏主题**
- **workflow** — tmux + Claude + Codex + GitHub + Obsidian + 飞书多项目开发工作流
- **tools/sync.py** — 多工具 skill 双向互通系统

---

## 目录

- [deploy 安全警告](#deploy-安全警告覆盖风险)
- [独立使用：只同步自己的 skill](#独立使用只同步自己的-skill)
- [快速开始（安装完整套件）](#快速开始安装完整套件)
- [目录结构](#目录结构)
- [跨工具 Skill 同步](#跨工具-skill-同步)
- [模块详解](#模块详解)
- [环境要求](#环境要求)
- [安全说明](#安全说明)
- [致谢](#致谢)

---

## deploy 安全警告：覆盖风险

> **警告**：不带 `--merge` 的 `deploy` 会**完全替换**目标目录，导致已有 skill 丢失。

| 命令 | 行为 |
|------|------|
| `python3 tools/sync.py deploy` | **覆盖**目标目录（先自动备份到 `staging/backups/`）|
| `python3 tools/sync.py deploy --merge` | **增量新增**，跳过已有 skill，**推荐** |

**强烈建议始终使用 `--merge`**，除非你明确要用本仓库的 skill 替换掉目标目录的全部内容。

即使使用不带 `--merge` 的 deploy，操作前也会自动备份到 `staging/backups/YYYYMMDD_HHMMSS/`，可随时回滚：

```bash
# 查看备份
ls staging/backups/
# 回滚 Cursor skills
rm -rf ~/.cursor/skills-cursor && cp -r staging/backups/20260323_210753/cursor ~/.cursor/skills-cursor
```

---

## 独立使用：只同步自己的 skill

**不想安装本仓库的 skill，只想让自己机器上各工具的 skill 互相同步？**

clone 仓库后，只需使用 `sync.py`，完全不运行 `install.sh`：

```bash
git clone https://github.com/asimfish/skills_lyf ~/Desktop/agent/skills_lyf
cd ~/Desktop/agent/skills_lyf
```

### 第一步：把各工具已有的 skill 汇聚到 Claude

```bash
# 扫描 Codex / Cursor / OpenClaw 中有但 Claude 没有的 skill，导入到 ~/.claude/skills/
python3 tools/sync.py import
```

`import` 只新增，不覆盖 Claude 中已有的 skill。

### 第二步：查看汇聚结果

```bash
python3 tools/sync.py status
```

### 第三步：预览转换（不改任何 live 目录）

```bash
python3 tools/sync.py stage
# 检查预览
ls staging/codex-skills/
ls staging/cursor-skills/
```

### 第四步：增量同步回各工具

```bash
# --merge 模式：只新增，跳过各工具中已有的 skill
python3 tools/sync.py deploy --merge
```

这样就实现了：你在任意工具里写的新 skill → 通过 `import` 汇聚 → 通过 `deploy --merge` 分发到其他工具，各工具原有 skill 不受影响。

### 持续自动同步

```bash
# 后台守护进程，有变化自动 stage（不自动 deploy）
python3 tools/sync.py watch &
# 确认 staging 无误后手动 deploy
python3 tools/sync.py deploy --merge
```

---

## 快速开始（安装完整套件）

### 第一步：克隆仓库

```bash
git clone https://github.com/asimfish/skills_lyf ~/Desktop/agent/skills_lyf
cd ~/Desktop/agent/skills_lyf
```

### 第二步：一键部署

```bash
bash install.sh
```

install.sh 只新增文件，**不覆盖已有配置**：
- 将 agents、skills、rules、mcp-servers、plugins 复制到 `~/.claude/`（跳过已有）
- 将 Cursor skills 复制到 `~/.cursor/skills-cursor/`（跳过已有）
- 复制 `settings.json.example` → `~/.claude/settings.json`（仅当不存在时）

### 第三步：填入密钥

```bash
# 编辑 Claude Code 配置，填入你的 API Token
vim ~/.claude/settings.json
```

找到这一行并替换：
```json
"ANTHROPIC_AUTH_TOKEN": "YOUR_ANTHROPIC_AUTH_TOKEN"
```

如果使用自定义 API 代理（如 aipor.cc），同时修改：
```json
"ANTHROPIC_BASE_URL": "https://your-proxy.com"
```

### 第四步（可选）：把本仓库 skill 同步到所有工具

```bash
# 先预览转换结果（不修改任何 live 目录）
python3 tools/sync.py stage

# 确认无误后，增量部署（推荐，不覆盖已有）
python3 tools/sync.py deploy --merge

# 或启动后台守护进程，有新 skill 时自动 stage
python3 tools/sync.py watch
```

---

## 目录结构

```
skills_lyf/
├── install.sh                    # 一键部署脚本
├── tools/
│   ├── sync.py                   # 跨工具 skill 同步核心脚本
│   └── watch.sh                  # 后台自动同步守护进程
├── claude/
│   ├── CLAUDE.md                 # 全局系统提示（行为规范）
│   ├── settings.json.example     # 配置模板（密钥留空）
│   ├── agents/                   # 21 个 subagent 定义
│   ├── skills/                   # 162 个 skill 目录
│   ├── rules/
│   │   ├── common/               # 9 条通用规则
│   │   └── python/               # 5 条 Python 规则
│   ├── mcp-servers/
│   │   ├── codex-dispatch/       # Codex 任务分发
│   │   ├── git-orchestra/        # 并行 git 工作流
│   │   └── llm-chat/             # 通用 LLM 对话
│   ├── plugins/local-plugins/
│   │   └── scholar/              # 学术搜索插件
│   └── ccline/
│       ├── models.toml           # 模型显示名
│       └── themes/               # 5 个状态栏主题
├── cursor/
│   ├── mcp.json.example          # Cursor MCP 配置模板
│   └── skills-cursor/            # 5 个 Cursor skill 目录
└── workflow/                     # 多项目 AI 开发工作流
    ├── install.sh
    ├── claude/CLAUDE.md
    ├── codex/dispatch.sh
    ├── experiment/iterate.sh
    ├── github/scripts/
    ├── obsidian/sync.sh
    └── openclaw/notify.sh
```

---

## 跨工具 Skill 同步

不同 AI 工具各有自己的 skill 格式，手动维护多份配置非常繁琐。`tools/sync.py` 以 **Claude 为统一管理中心**，分两步解决：

1. **汇聚**：把 Codex / Cursor / OpenClaw 的 skill 导入 Claude 格式，在 Claude 中统一整理、筛选
2. **分发**：把 Claude 中好用的 skill 转换成各工具格式，按需部署出去

- **非破坏性**：`import` 和 `deploy --merge` 均只新增，不覆盖已有 skill
- **格式自动转换**：一份 skill，自动适配各工具的 frontmatter 格式

### 支持的工具及格式

| 工具 | 路径 | 格式说明 |
|------|------|----------|
| Claude Code | `~/.claude/skills/NAME/SKILL.md` | 完整 frontmatter，canonical 格式 |
| Codex CLI | `~/.codex/skills/NAME/SKILL.md` | 与 Claude 格式完全相同，双向同步 |
| Cursor | `~/.cursor/skills-cursor/NAME/SKILL.md` | 简化 frontmatter（name + description）|
| Cursor MDC | `~/.cursor/rules/skills/NAME.mdc` | globs + alwaysApply 格式 |
| OpenClaw | `~/clawd/skills/NAME/SKILL.md` | description 作为 instructions 格式 |

### 工作原理

```
【第一步：汇聚】

~/.codex/skills/          ┐
~/.cursor/skills-cursor/  ├──→ import ──→ ~/.claude/skills/   ← 统一管理中心
~/clawd/skills/           ┘       （只新增，不覆盖已有）

                               在此整理、筛选、新建 skill

【第二步：分发】

~/.claude/skills/
        │
        stage（预览转换结果，不改任何 live 目录）
        │
        ├──→ staging/codex-skills/
        ├──→ staging/cursor-skills/
        ├──→ staging/cursor-mdc/
        └──→ staging/openclaw-skills/
        │
        deploy --merge（增量新增，推荐）
        deploy        （完全替换，自动备份）
        │
        ├──→ ~/.codex/skills/
        ├──→ ~/.cursor/skills-cursor/
        ├──→ ~/.cursor/rules/skills/
        └──→ ~/clawd/skills/
```

`import` 扫描 Codex / Cursor / OpenClaw 中有但 Claude 没有的 skill，导入到 Claude（不覆盖已有）。整理好后，通过 `stage` + `deploy` 分发回各工具。

### 命令说明

#### 1. 查看当前状态

```bash
python3 tools/sync.py status
```

输出示例：
```
Claude skills (live)   : 162
Codex skills (live)    : 162
Cursor skills (live)   : 162
MDC rules (live)       : 162
OpenClaw skills (live) : 162
Staging codex          : 162
Staging cursor         : 162
Staging MDC            : 162
Staging openclaw       : 162
```

#### 2. 生成预览（不修改任何 live 配置）

```bash
python3 tools/sync.py stage
```

转换结果写入仓库内 `staging/` 目录（已加入 .gitignore），**不会修改任何 live 目录**。

可以先检查 staging 里的文件确认无误：
```bash
ls staging/codex-skills/     # 预览 Codex skills
ls staging/cursor-skills/    # 预览 Cursor skills
ls staging/cursor-mdc/       # 预览 MDC rules
ls staging/openclaw-skills/  # 预览 OpenClaw skills
```

#### 3. 审计评分（安全检查 + 工具适用性）

```bash
python3 tools/sync.py audit
```

输出示例：
```
[ML] (29 skills)
  Name                                Codex Cursor  MDC OpenClaw  Issues
  accelerate                           Good     OK Poor     Good
  deepspeed                            Good     OK Poor     Good
  vllm                                 Good     OK Poor     Good
  grpo-rl-training                     Good     OK Poor     Good  *
                                         -> reward_functions_library.py: dynamic code execution
```

评分含义：`Good` = 推荐  `OK` = 可用  `Poor` = 不适合该工具

安全检查项：hardcoded secret、curl-pipe-shell、动态代码执行、`rm -rf` 危险命令

```bash
# 输出 JSON 供脚本处理
python3 tools/sync.py audit --json > audit.json
```

#### 4. 打包分发（安全 skill 一键打包）

```bash
# 打包为 Claude 原始格式（默认）
python3 tools/sync.py pack

# 打包为 Cursor 格式（推荐分发给 Cursor 用户）
python3 tools/sync.py pack --format cursor

# 打包为 MDC rule 格式
python3 tools/sync.py pack --format mdc

# 指定输出路径
python3 tools/sync.py pack --format cursor --out ~/Desktop/cursor-skills.zip
```

`pack` 会自动：
1. 扫描全部 skill，排除有安全隐患的
2. 按 `--format` 转换为目标格式
3. 输出可分发 zip，附排除清单

安装别人分享的 Cursor skills 包：
```bash
unzip cursor-skills.zip -d ~/.cursor/
```

#### 5. 部署到 live（自动备份）

```bash
# 部署全部工具
python3 tools/sync.py deploy

# 仅部署指定工具
python3 tools/sync.py deploy codex cursor
python3 tools/sync.py deploy mdc openclaw
```

deploy 会自动备份所有 live 目录到 `staging/backups/YYYYMMDD_HHMMSS/`，如需回滚：
```bash
# 查看备份
ls staging/backups/

# 还原某个工具
rm -rf ~/.cursor/skills-cursor && cp -r staging/backups/20260323_210753/cursor ~/.cursor/skills-cursor
```

#### 6. 增量合并（不覆盖已有配置）

```bash
# 只新增用户没有的 skill，已有的一律跳过
python3 tools/sync.py deploy --merge

# 只对指定工具做增量合并
python3 tools/sync.py deploy cursor mdc --merge
```

适合把 skill 包分发给他人后，对方用 `--merge` 安全合并，不会覆盖他们已有的配置。

#### 7. 从其他工具导入新 skill

```bash
python3 tools/sync.py import
```

扫描 Codex / Cursor / OpenClaw 中存在但 Claude 中没有的 skill，导入到 `~/.claude/skills/`（不覆盖已有）。

#### 8. 后台自动 stage 守护进程

```bash
# 启动（每5秒检测 Claude skills 变化，自动 stage）
python3 tools/sync.py watch

# 自定义间隔（秒）
python3 tools/sync.py watch --interval 10
```

> watch 只做 stage（安全），不自动 deploy。确认 staging 无误后手动 `deploy` 一次即可。

### 典型工作流

**日常新建 skill 后同步到所有工具：**
```bash
# 1. 用 /create-skill 在 Claude Code 里新建 skill
# 2. 预览转换结果（不修改 live）
python3 tools/sync.py stage
# 3. 一键部署到全部工具
python3 tools/sync.py deploy
```

**审计 + 打包分发给朋友（Cursor 版）：**
```bash
# 先看哪些 skill 有问题
python3 tools/sync.py audit
# 打包安全的 skill 为 Cursor 格式
python3 tools/sync.py pack --format cursor --out ~/Desktop/cursor-skills.zip
# 朋友收到后增量安装，不覆盖已有配置
unzip cursor-skills.zip -d ~/.cursor/
# 或用 merge 模式（更安全）
python3 tools/sync.py deploy --merge
```

**后台守护 + 随时 deploy：**
```bash
python3 tools/sync.py watch &   # 后台自动 stage
# ... 工作中新建 skill ...
python3 tools/sync.py deploy    # 随时部署最新 staging
```

---

## 模块详解

### Claude Code Skills（162个）

所有 skill 位于 `claude/skills/`，部署后 symlink 到 `~/.claude/skills/`。

主要分类：

| 分类 | 代表 skill | 说明 |
|------|-----------|------|
| 研究自动化 | `research-pipeline` `auto-review-loop` `idea-discovery` | 来自 ARIS，睡觉期间自动做科研 |
| 论文写作 | `paper-write` `paper-reviewer` `paper-summarizer` | 学术论文全流程 |
| ML 训练 | `deepspeed` `grpo-rl-training` `vllm` | 分布式训练、RLHF |
| 代码质量 | `coding-standards` `tdd-workflow` `verification-loop` | 编码规范、测试驱动 |
| 后端开发 | `backend-patterns` `django-patterns` `postgres-patterns` | 框架最佳实践 |
| 内容创作 | `article-writing` `content-engine` | 文章、营销内容 |

### Subagents（21个）

位于 `claude/agents/`，使用 `Agent` tool 自动调用：

| Agent | 触发时机 |
|-------|----------|
| `code-reviewer` | 写完/修改代码后 |
| `architect` | 系统设计决策 |
| `ml-debugger` | 训练不收敛、loss 异常 |
| `paper-researcher` | 论文精读、文献综述 |
| `security-reviewer` | 涉及认证、用户输入时 |
| `tdd-guide` | 新功能、bug 修复 |

### MCP Servers（3个）

位于 `claude/mcp-servers/`，需在 `settings.json` 中注册：

#### codex-dispatch
Codex 任务分发，支持并行执行多个编码任务。

#### git-orchestra
并行 git 工作流，自动创建 worktree 隔离并行开发。

#### llm-chat
通用 OpenAI-compatible LLM 对话，支持 DeepSeek / Kimi / MiniMax 等：

```json
// settings.json 中配置
{
  "mcpServers": {
    "llm-chat": {
      "command": "python3",
      "args": ["~/.claude/mcp-servers/llm-chat/server.py"],
      "env": {
        "LLM_API_KEY": "your-key",
        "LLM_BASE_URL": "https://api.deepseek.com/v1",
        "LLM_MODEL": "deepseek-chat"
      }
    }
  }
}
```

### workflow 多项目工作流

4个 tmux 会话协作：

| 会话 | 用途 |
|------|------|
| `OT` | Claude 主编排器 |
| `WAM` | Codex Worker 监控 |
| `SAT` | GitHub / 成本 / Obsidian 状态 |
| `TOOLS` | 系统监控 / 临时 shell |

```bash
cd workflow
bash install.sh
vim config/secrets.sh      # 飞书 Webhook 等
bash tmux/scripts/start.sh # 启动
```

---

## 环境要求

| 工具 | 最低版本 | 安装方式 |
|------|---------|----------|
| macOS | 14+ | — |
| Claude Code | latest | `npm i -g @anthropic-ai/claude-code` |
| Python | 3.10+ | `brew install python` |
| tmux | 3.0+ | `brew install tmux` |
| gh | 2.0+ | `brew install gh` |
| jq | 1.6+ | `brew install jq` |
| Cursor | latest | [cursor.sh](https://cursor.sh) |

> Codex CLI 和 ccline 为可选，不影响 Claude Code 核心功能。

---

## 安全说明

- `settings.json` 中的 `ANTHROPIC_AUTH_TOKEN` **不在仓库中**，使用 `settings.json.example` 模板手动填写
- `workflow/config/secrets.sh`（飞书 Webhook 等）已加入 `.gitignore`
- MCP server 的 API Key 通过环境变量注入，不硬编码在代码里
- sync.py 的 deploy 操作会在修改前自动备份，可随时回滚

---

## 致谢

- [ARIS](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) — 研究自动化 skill 体系（已集成全集）
- [Everything Claude Code](https://github.com/hesreallyhim/everything-claude-code) — skill 框架设计

---

## License

MIT