<p align="center">
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="零依赖">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT">
  <img src="https://img.shields.io/github/v/release/arwei944/minicode" alt="版本">
  <img src="https://img.shields.io/github/last-commit/arwei944/minicode" alt="最后提交">
</p>

<h1 align="center">Minicode</h1>
<p align="center"><b>从 opencode 精确裁剪的极致精简 AI 编码智能体</b></p>
<p align="center">
  <code>opencode (5378 文件 / 200+ 依赖 / 157MB)</code><br>
  <code>→ minicode (15 文件 / 0 依赖 / 0.5MB)</code>
</p>

---

## 特色

- **零外部依赖** — 纯原生 `fetch`，无 npm 包袱
- **开箱即用** — 无需注册、无需 API Key，自带免费模型
- **200+ 免费模型** — 通过 models.dev / opencode Zen 免费使用
- **6 大核心工具** — read / write / edit / grep / glob / shell
- **跨平台** — Windows / macOS / Linux
- **Web 界面** — `bun run serve` 浏览器中使用
- **极致精简** — 16 个源文件，1000 行代码

## 安装

```bash
# 只需 Bun 运行时
git clone https://github.com/arwei944/minicode.git
cd minicode
bun install       # 仅安装 @types/bun（可选）
```

## 使用

### 单次模式

```bash
bun run dev "用 Python 写一个冒泡排序"
```

### 交互模式

```bash
bun run dev
```

### 列出免费模型

```bash
bun run dev models
```

### 管道模式

```bash
cat main.py | bun run dev pipe
```

### Web 界面

```bash
bun run serve
```

打开浏览器访问 `http://localhost:3000`，在图形界面中使用 Minicode：

![Web 界面](https://img.shields.io/badge/界面-暗色风格-0d1117)

## 免费模型

Minicode 内置 **200+ 免费模型**，无需任何配置即可使用：

| 推荐模型 | 说明 |
|---------|------|
| `opencode/big-pickle` | 默认模型，高性价比 |
| `opencode/grok-code` | 快速编码模型 |
| `opencode/deepseek-v4-flash-free` | DeepSeek V4 Flash 免费版 |
| `opencode/glm-4.7-free` | GLM-4.7 免费版 |
| `opencode/mimo-v2.5-free` | MiMo V2.5 免费版 |

设置 `OPENCODE_API_KEY` 可解除免费额度限制，使用完整模型列表。

## 内置工具

| 工具 | 说明 |
|------|------|
| `read` | 读取文件内容 |
| `write` | 创建/写入文件 |
| `edit` | 替换编辑文件 |
| `grep` | 正则搜索内容 |
| `glob` | 通配符搜索文件 |
| `shell` | 执行 Shell 命令 |

## 与 opencode 对比

| 维度 | opencode | minicode |
|------|----------|----------|
| Packages | 24 | 1 |
| 源文件 | 5378 | 15 |
| 外部依赖 | 200+ | 0 |
| 安装体积 | ~157MB | ~0.5MB |
| 运行时 | Bun | Bun |
| 免费模型 | ✅ | ✅ |
| 核心工具 | 完整 | 6 个核心 |
| 启动时间 | ~2s | ~0.1s |

## 架构

```
用户输入 → Agent 主循环 → LLM (fetch)
  → 解析 tool_calls → 执行工具
  → 返回结果 → 继续对话
```

## 实时仪表盘

[https://arwei944.github.io/minicode/](https://arwei944.github.io/minicode/)

## 许可证

MIT
