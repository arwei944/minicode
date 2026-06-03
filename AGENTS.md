# Minicode 开发指南

## 项目简介
minicode 是从 opencode 源码精确裁剪而来的极简 AI 编码智能体。
核心保留 opencode 的免费模型能力（通过 models.dev），砍掉所有周边设施。

## 架构规则
- 所有代码在 `src/` 下，不拆分多 package
- 使用 Bun 运行时，TypeScript 严格模式
- 不引入 Effect 框架，使用原生 async/await
- 不引入数据库 ORM，内存存储优先
- 外部依赖 ≤ 5 个

## 代码风格
- 使用中文注释
- 避免抽象，单文件内完成功能
- 优先使用 Bun API（Bun.file, Bun.write 等）
- 工具函数直接放在对应文件，不提取 helpers

## Commit 规范
- 使用 conventional commit: `type(scope): message`
- type: feat / fix / chore / refactor / test / docs
- 中文 message

## 测试
- 使用 `bun test`
- 从 `packages/opencode` 复制核心测试，精简到仅测当前功能
