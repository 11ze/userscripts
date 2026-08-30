# CLAUDE.md

Tampermonkey 用户脚本集合：原生 JavaScript，无构建工具、无包管理器，每个 `src/*.user.js` 独立安装运行。目标浏览器 Chromium 120+（可用 `:has()` 与 CSS nesting）。

## 硬约束

- 脚本相互独立，禁止跨脚本引入或共享依赖
- `'use strict'` 严格模式
- 测试为 `node --test tests/<script>.test.mjs`，通过 `window.__*_TEST__` 条件钩子取用 IIFE 内部函数（浏览器中该钩子永不激活）

## 按需阅读

| 何时 | 读什么 |
|---|---|
| 新建或修改任何脚本前 | [docs/userscript-conventions.md](docs/userscript-conventions.md) |
| 写 UI（颜色、圆角、阴影、动画） | [docs/design.md](docs/design.md) |
| 改 `src/<script>.user.js` | [docs/scripts/<script>.md](docs/scripts/<script>.md) |
| 发版 | [docs/release.md](docs/release.md) |

## Agent skills

### Issue tracker

议题存放在仓库内 `.scratch/<feature>/` 下的 markdown 文件（本地跟踪，不用 GitHub Issues）。见 [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md)。

### Triage labels

五个分诊角色直接用默认标签名。见 [docs/agents/triage-labels.md](docs/agents/triage-labels.md)。

### Domain docs

单上下文：根 `CONTEXT.md` + `docs/adr/`（按需懒创建）。见 [docs/agents/domain.md](docs/agents/domain.md)。
