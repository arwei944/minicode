# Minicode

> 从 opencode 精确裁剪的极简 AI 编码智能体。
> 5378 文件 → ~50 文件 · 200+ 依赖 → 5 依赖 · 157MB → ~5MB

## 安装

```bash
bun install
```

## 使用

```bash
# 单次模式
bun run dev "写一个斐波那契函数"

# 交互模式
bun run dev

# 查看可用免费模型
bun run dev models

# 管道模式
cat main.ts | bun run dev pipe
```

## 免费模型

无需 API Key，开箱即用（通过 models.dev 代理，有每日免费额度）。
设置 `OPENCODE_API_KEY` 可解除限制。

## 内置工具

read · write · edit · grep · glob · bash

## 仪表盘

实时进度追踪: [GitHub](https://github.com/arwei944/minicode)
