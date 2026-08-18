# CLAUDE.md

Tampermonkey 用户脚本集合：原生 JavaScript，无构建工具、无包管理器，每个 `src/*.user.js` 独立安装运行。目标浏览器 Chromium 120+。

## 硬约束（适用于所有脚本）

- 脚本相互独立，禁止跨脚本引入或共享依赖
- `'use strict'` 严格模式
- 测试为 `node --test tests/<script>.test.mjs`（与脚本同名对应），通过 `window.__*_TEST__` 条件钩子取用 IIFE 内部函数（浏览器中该钩子永不激活）

## 按需阅读

| 何时 | 读什么 |
|---|---|
| 新建或修改任何脚本前 | [docs/userscript-conventions.md](docs/userscript-conventions.md) |
| 写 UI（颜色、圆角、阴影、动画） | [docs/design.md](docs/design.md) |
| 改 `src/<script>.user.js` | [docs/scripts/<script>.md](docs/scripts/<script>.md) |
| 发版 | [docs/release.md](docs/release.md) |
