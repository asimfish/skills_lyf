# skills_lyf

> 个人 Claude Code / Codex / Cursor 配置一键部署套件

本仓库汇总了在 macOS 上使用 Claude Code、Codex CLI、Cursor 进行 AI 辅助开发的全套配置，包含：

- **128 个 Claude Code skills**（含 [ARIS](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) 研究自动化全集）
- **21 个 subagents**（code-reviewer、architect、ml-debugger 等）
- **14 条 rules**（common + python，编码规范、安全、测试等）
- **3 个自研 MCP servers**（codex-dispatch、git-orchestra、llm-chat）
- **5 个 Cursor skills**
- **scholar local plugin**（arxiv / crossref 学术搜索）
- **ccline 状态栏**（主题配置）
- **workflow** — tmux + Claude + Codex + GitHub + Obsidian + 飞书 多项目开发工作流

## 快速开始

```bash
# 1. 克隆
git clone https://github.com/YOUR_USERNAME/skills_lyf ~/Desktop/agent/skills_lyf

# 2. 一键部署
bash ~/Desktop/agent/skills_lyf/install.sh

# 3. 填入密钥
vim ~/.claude/settings.json          # ANTHROPIC_AUTH_TOKEN
vim ~/Desktop/agent/workflow/config/secrets.sh   # 飞书 Webhook 等
```

## 目录结构

```
skills_lyf/
├── install.sh                  # 一键部署（幂等，已存在则跳过）
├── .gitignore
├── claude/
│   ├── CLAUDE.md               # 全局系统提示
│   ├── settings.json.example   # 配置模板（密钥留空）
│   ├── agents/                 # 21 个 subagent 定义
│   ├── skills/                 # 128 个 skill 目录
│   ├── rules/
│   │   ├── common/             # 9 条通用规则
│   │   └── python/             # 5 条 Python 规则
│   ├── mcp-servers/
│   │   ├── codex-dispatch/     # Codex 任务分发 MCP
│   │   ├── git-orchestra/      # 并行 git 工作流 MCP
│   │   └── llm-chat/           # 通用 OpenAI-compatible LLM MCP
│   ├── plugins/local-plugins/
│   │   └── scholar/            # arxiv / crossref 学术插件
│   └── ccline/
│       ├── models.toml         # 模型显示名配置
│       └── themes/             # 5 个状态栏主题
├── cursor/
│   ├── mcp.json.example        # Cursor MCP 配置模板
│   └── skills-cursor/          # 5 个 Cursor skill 目录
└── workflow/                   # 多项目 AI 开发工作流
    ├── install.sh
    ├── claude/CLAUDE.md
    ├── codex/dispatch.sh
    ├── experiment/iterate.sh
    ├── github/scripts/
    ├── obsidian/sync.sh
    ├── openclaw/notify.sh
    └── tmux/
```

## 关键组件说明

### Claude Code Agents

| Agent | 用途 |
|-------|------|
| code-reviewer | 代码审查，写完代码自动触发 |
| architect | 系统设计与架构决策 |
| ml-debugger | 训练不收敛、loss 异常诊断 |
| paper-researcher | 论文精读与文献综述 |
| experiment-designer | 消融实验与评估方案设计 |
| ai-engineer | LLM 应用与 RAG 系统构建 |
| ... | 共 21 个，见 claude/agents/ |

### MCP Servers

| Server | 功能 | 依赖 |
|--------|------|------|
| codex-dispatch | 向 Codex CLI 分发编码任务，支持并行 | Python 3.10+ |
| git-orchestra | 多 worktree 并行开发 + AI 冲突解决 | Python 3.10+ |
| llm-chat | 对接任意 OpenAI-compatible API (DeepSeek/Kimi/MiniMax) | Python 3.10+ |

MCP servers 依赖安装：
```bash
pip3 install -r ~/.claude/mcp-servers/codex-dispatch/requirements.txt
pip3 install -r ~/.claude/mcp-servers/git-orchestra/requirements.txt
pip3 install -r ~/.claude/mcp-servers/llm-chat/requirements.txt
```

在 `~/.claude/settings.json` 的 `mcpServers` 中注册：
```json
{
  "mcpServers": {
    "codex-dispatch": {
      "command": "python3",
      "args": ["~/.claude/mcp-servers/codex-dispatch/server.py"]
    },
    "git-orchestra": {
      "command": "python3",
      "args": ["~/.claude/mcp-servers/git-orchestra/server.py"]
    },
    "llm-chat": {
      "command": "python3",
      "args": ["~/.claude/mcp-servers/llm-chat/server.py"],
      "env": {
        "LLM_API_KEY": "YOUR_KEY",
        "LLM_BASE_URL": "https://api.deepseek.com/v1",
        "LLM_MODEL": "deepseek-chat"
      }
    }
  }
}
```

### ccline 状态栏

ccline 二进制需手动安装（macOS arm64）：
```bash
# 从 release 下载或自行编译
# 安装后放到 ~/.claude/ccline/ccline
chmod +x ~/.claude/ccline/ccline
```

主题切换：编辑 `~/.claude/settings.json` 中的 `statusLine.command`。

### workflow 多项目工作流

```bash
cd ~/Desktop/agent/workflow
bash install.sh          # 首次初始化
vim config/secrets.sh    # 填入飞书 Webhook、SSH Key 路径等
bash tmux/scripts/start.sh  # 启动四会话 tmux
```

详见 `workflow/README.md`。

## 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| macOS | 14+ | Apple Silicon 推荐 |
| Claude Code (claude) | latest | `npm i -g @anthropic-ai/claude-code` |
| Codex CLI (codex) | latest | `npm i -g @openai/codex` |
| Python | 3.10+ | MCP servers 依赖 |
| tmux | 3.0+ | workflow 多会话 |
| gh | 2.0+ | GitHub CLI |
| jq | 1.6+ | JSON 处理 |

## 安全说明

- `settings.json` 中的 `ANTHROPIC_AUTH_TOKEN` **不在仓库中**，使用 `settings.json.example` 模板
- `workflow/config/secrets.sh` 已加入 `.gitignore`
- MCP server 的 API Key 通过环境变量注入，不硬编码

## 致谢

- [ARIS](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) — 研究自动化 skill 体系（已集成全集）
- [Everything Claude Code](https://github.com/hesreallyhim/everything-claude-code) — skill 框架

## License

MIT
