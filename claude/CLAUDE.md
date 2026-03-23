# CLAUDE.md - 工作指导
# 版本: ssx(260228.0)

## 版本标识规范
═══════════════

每次回复开头称呼: ssx(版本号)

1. ~/.claude/CLAUDE.md 版本标识: ssx(yymmdd.n)
   - 每次更新此文件时，如果 yymmdd 是当天则 n+1，否则重置为 yymmdd.0
   - 每次回复开头使用此称呼，以便确认规则是否生效

2. ./CLAUDE.md 版本标识: <yymmdd.n>
   - 每次更新项目 CLAUDE.md 时，按同样规则更新版本号
   - 在对话结尾显示此标识，以便确认项目规则版本

## CRITICAL CONSTRAINTS - 违反=任务失败
═══════════════════════════════════════

- 必须使用中文回复
- 必须先获取上下文
- 禁止生成恶意代码
- 必须存储重要知识
- 必须执行检查清单
- 必须遵循质量标准

## MANDATORY WORKFLOWS
═════════════════════

执行前检查清单：
[ ] 中文 [ ] 上下文 [ ] 工具 [ ] 安全 [ ] 质量

标准工作流：
1. 分析需求 → 2. 获取上下文 → 3. 选择工具 → 4. 执行任务 → 5. 验证质量 → 6. 存储知识

研究-计划-实施模式：
研究阶段: 读取文件理解问题，禁止编码
计划阶段: 创建详细计划
实施阶段: 实施解决方案
验证阶段: 运行测试验证
提交阶段: 创建提交和文档

## MANDATORY TOOL STRATEGY
═════════════════════════

任务开始前必须执行：
1. memory 查询相关概念
2. code-search 查找代码片段
3. sequential-thinking 分析问题
4. 选择合适子代理

任务结束后必须执行：
1. memory 存储重要概念
2. code-search 存储代码片段
3. 知识总结归档

优先级调用策略：
- Microsoft技术 → microsoft.docs.mcp
- GitHub文档 → context7 → deepwiki
- 网页搜索 → 内置搜索 → fetch → duckduckgo-search

文件写入规范：
- 单次使用 Write 工具写入不要超过 5k token
- 大文件必须分批写入，避免超出限制

## GIT 操作安全规范
═══════════════════

### 禁止的破坏性操作
**绝对禁止**在未经用户明确授权的情况下执行以下命令：
- `git checkout <file>` - 会丢弃工作区修改
- `git reset --hard` - 会丢弃所有未提交修改
- `git clean -f` - 会删除未跟踪文件
- `git restore <file>` - 会丢弃工作区修改
- `git checkout .` - 会丢弃所有工作区修改
- `git stash` - 会隐藏工作区修改（除非用户明确要求）

### 文件修复原则
当文件出现问题时：
1. **优先使用 Read + Edit/Write 修复**，不要用 git 命令回滚
2. 如果必须回滚，先用 `git diff <file>` 检查会丢失什么
3. 如果有其他文件依赖当前文件的修改，**绝对不能**回滚
4. 向用户说明影响范围，等待明确授权

### 批量修改安全规范
使用 sed/awk 等批量修改工具时：
1. **先在测试文件上验证**命令正确性
2. 或者先用 `sed -n 'p'` 预览效果（不修改文件）
3. 如果命令复杂，优先使用 Read + Edit 逐个修改
4. 批量修改后**立即验证**文件语法（如 TypeScript 用 `tsc --noEmit`）

### 依赖关系检查
修改文件前必须检查：
1. 是否有其他文件导入/引用当前文件的导出
2. 使用 Grep 搜索 `import.*from.*<filename>` 确认依赖
3. 如果有依赖，修改后必须验证依赖文件是否受影响

### 文件操作优先级
1. **Read + Edit/Write** - 最安全，可追踪每个修改
2. **sed/awk（简单替换）** - 适合单行简单替换，必须先验证
3. **Python 脚本** - 适合复杂批量修改，但要先测试
4. **git 命令** - 仅用于查询（status/diff/log），禁止修改操作

### 错误恢复原则
当操作失误时：
1. **不要用 git 命令"修复"** - 可能造成更大损失
2. 立即停止，向用户说明情况
3. 使用 `git diff` 查看丢失的内容
4. 如果内容简单，手动重新添加
5. 如果内容复杂，请求用户提供备份或重新生成

## CODING RESTRICTIONS
═══════════════════

编码前强制要求：
- 无明确编写命令禁止编码
- 无明确授权禁止修改文件
- 必须先完成sequential-thinking分析

## QUALITY STANDARDS
═══════════════════

工程原则：SOLID、DRY、关注点分离
代码质量：清晰命名、合理抽象、必要注释
性能意识：算法复杂度、内存使用、IO优化
测试思维：可测试设计、边界条件、错误处理

## SUBAGENT SELECTION
════════════════════

必须主动调用合适子代理：
- Python项目 → python-pro
- C#/.NET项目 → csharp-pro
- JavaScript/TypeScript → javascript-pro/typescript-pro
- Unity开发 → unity-developer
- 前端开发 → frontend-developer
- 后端架构 → backend-architect
- 云架构 → cloud-architect/hybrid-cloud-architect
- 数据库优化 → database-optimizer
- 安全审计 → security-auditor
- 代码审查 → code-reviewer
- 测试自动化 → test-automator
- 性能优化 → performance-engineer
- DevOps部署 → deployment-engineer
- 文档编写 → docs-architect
- 错误调试 → debugger/error-detective

## ENFORCEMENT
══════════════

强制触发器：会话开始→检查约束，工具调用前→检查流程，回复前→验证清单
自我改进：成功→存储，失败→更新规则，持续→优化策略

## 默认值和回退值使用规范

**严禁**使用 `||` 运算符或类似模式提供默认值/回退值，除非满足以下条件之一：
1. 用户明确要求，或
2. 值来自外部、不可信来源（用户输入、外部 API）

对于内部配置和环境变量：
- 信任必需的值已正确配置
- **禁止**添加防御性回退，如 `env.value || 'default'`
- 如果值缺失，让应用立即失败，而不是用默认值掩盖问题
- 配置文件（.env）是真实来源 - 信任它们

**禁止**的模式示例：
```typescript
// ❌ 对内部配置绝对不要这样做
const timeout = env.timeout || 30
const port = config.port || 3000
const url = env.apiUrl || 'http://localhost'

// ✅ 应该这样做
const timeout = env.timeout
const port = config.port
const url = env.apiUrl
```

理由：为配置错误场景添加默认值会掩盖真实问题。如果 env.timeout 是
undefined，应用应该在启动时失败，而不是静默使用硬编码的回退值。快速失败优于使用错误的配置运行。

## 项目特定配置 (PROJECT-SPECIFIC CONFIGS)
═══════════════════════════════════════

## 通用项目原则
- 文件名都用小写，用 _ 连接
- 文字最小 14px
- http_api 调用有封装不会 reject，检查 api 调用不用 try-catch
- 需要安装卸载的依赖告诉我，我自己安装运行测试
- 定义方法用 const 不要用 function
- 代码注释都用单行注释
- 保持代码简洁，函数能一行返回就一行返回
- 数据库只用最简单的数据类型，不要搞数据库关系，都用程序关联
- 第三方库统一放在 lib 文件导出（如 dayjs、decimal.js）
- 项目内导入：`import { xxx } from "@/libs"`
- 库导入放顶部，项目内导入放下面，中间空一行
- 导入项超过3个时用命名空间导入：`import * as httpApis from '@/xxx/http_api'`
- API 函数必须以 Api 结尾：`getXxxApi`、`createXxxApi`、`updateXxxApi`、`deleteXxxApi`
- 禁止 `;(xxx as any).prop = value` 绕过类型检查，应定义正确类型或用展开运算符

## Vue 项目通用
- 不要用 || 加默认值
- css 都用 tailwind css4
- 时间用 dayjs 格式化为 YYYY-MM-DD HH:mm:ss
- 项目用 pnpm 管理，需要安装的依赖告诉我
- 注意现有代码风格，新代码尽量简单粗暴
- 代码不要加 emoji
