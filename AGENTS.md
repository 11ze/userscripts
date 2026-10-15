# AGENTS.md

Tampermonkey 用户脚本集合：原生 JavaScript，无构建工具、无包管理器，每个 `src/*.user.js` 独立安装运行。目标浏览器 Chromium 120+（可用 `:has()` 与 CSS nesting）。

## 硬约束

- 脚本相互独立，禁止跨脚本引入或共享依赖
- `'use strict'` 严格模式
- 测试为 `node --test tests/<script>.test.mjs`，通过 `window.__*_TEST__` 条件钩子取用 IIFE 内部函数（浏览器中该钩子永不激活）
- 文档只记代码推不出的约束与决策；函数清单、选择器、色值等看代码即知的内容不写

## 按需阅读

| 何时 | 读什么 |
|---|---|
| 新建或修改任何脚本前 | [docs/userscript-conventions.md](docs/userscript-conventions.md) |
| 改 `src/<script>.user.js` | [docs/scripts/<script>.md](docs/scripts/<script>.md) |
| 发版 | [docs/release.md](docs/release.md) |
| 新概念定名时 | 补进 [docs/scripts/<script>.md](docs/scripts/<script>.md)（术语、否决、坑） |
