# Minicode 精简计划

> 从 opencode (5378 文件 / 24 packages / 200+ 依赖) → 裸智能体 (~50 文件 / 1 package / ~5 依赖)

## 核心架构

```
用户输入 → Agent.cycle() → LLM (models.dev 免费 / 自备 Key)
  → 解析 tool_calls → 执行工具(read/write/edit/grep/glob/shell)
  → 返回结果 → 继续对话
```

## 阶段与任务

### 🟢 Phase 1: 基础骨架（当前）
| 任务 | 状态 | 文件 | 代码行 |
|------|------|------|--------|
| 项目配置文件 | ✅ | package.json, tsconfig.json | 2 |
| CLI 入口 | ✅ | src/cli.ts | 75 |
| Agent 主循环 | ✅ | src/agent.ts | 100 |
| 配置管理 | ✅ | src/config.ts | 40 |
| 会话管理（内存） | ✅ | src/session.ts | 55 |
| 模型目录加载 | ✅ | src/models.ts | 100 |
| LLM 调用层 | ✅ | src/llm.ts | 50 |
| 工具: read | ✅ | src/tool/read.ts | 30 |
| 工具: write | ✅ | src/tool/write.ts | 30 |
| 工具: edit | ✅ | src/tool/edit.ts | 35 |
| 工具: grep | ✅ | src/tool/grep.ts | 35 |
| 工具: glob | ✅ | src/tool/glob.ts | 30 |
| 工具: shell | ✅ | src/tool/shell.ts | 40 |

### 🟡 Phase 2: 质量提升
| 任务 | 状态 | 预计代码行 |
|------|------|------------|
| 错误处理完善 | ⬜ | +50 |
| 免费额度超限自动降级 | ⬜ | +30 |
| 工具链: websearch/webfetch | ⬜ | +80 |
| 工具链: apply_patch | ⬜ | +60 |
| 权限控制（白名单模式） | ⬜ | +80 |
| 日志系统 | ⬜ | +40 |
| 会话持久化（SQLite） | ⬜ | +100 |

### 🔵 Phase 3: 生态扩展
| 任务 | 状态 | 预计代码行 |
|------|------|------------|
| 多提供商支持（Anthropic, Google） | ⬜ | +80 |
| MCP 轻量接口 | ⬜ | +100 |
| VSCode 扩展 | ⬜ | +200 |
| Docker 镜像 | ⬜ | +30 |

## 代码质量指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 总代码行 | < 5000 | ~700 |
| 外部依赖数 | ≤ 5 | 5 |
| TypeScript 严格模式 | ✅ | ✅ |
| 测试覆盖率 | ≥ 70% | 0% |
| lint 违规 | 0 | N/A |
| 单文件最大行 | ≤ 200 | 100 |

## 与 opencode 对比

| 维度 | opencode | minicode | 精简比例 |
|------|----------|----------|----------|
| packages | 24 | 1 | 96% |
| 源文件 | 5378 | ~50 | 99% |
| 外部依赖 | 200+ | 5 | 97.5% |
| 安装体积 | ~157MB | ~5MB | 97% |
| 启动时间 | ~2s | ~0.3s | 85% |
| 核心功能 | 完整 | 70% | — |
