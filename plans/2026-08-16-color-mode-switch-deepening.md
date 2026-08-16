# color_mode_switch 深化：状态模块 + iframe seam + 样式收编

> 状态：已完成 · 2026-08-16 · 出自 architecture-review-20260816-113501.html 的候选 1、候选 2、候选 3（用户授权全做）

## 决策记录（用户授权代理决定）

| 决策 | 结论 |
|------|------|
| 候选顺序 | 2 → 1 → 3：先一行 `@noframes` 清场（消除 iframe 幽灵按钮与跨 frame 失步，测试少一个维度），再深化状态模块（主菜），最后样式收编（行为不变） |
| 接口形状 | 三函数进钩子：`readState(storage)` / `writeState(storage, enabled)` / `buildReverseColorCss()`，另暴露 `STORAGE_KEY` |
| 写失败策略 | `writeState` 返回 boolean；toggle 在写失败时直接 return、不翻内存态不切 UI——内存/存储/视觉三方一致 |
| 读容错 | `readState` try/catch：Storage 抛异常（隐私模式 SecurityError）返回 false，不再炸整个 IIFE |
| CSS 生成 | 删死规则 `[style*="background-image:"]`（其匹配集是 `[style*="background-image"]` 的子集）；按钮容器 id 追加进媒体双反转组——按钮自身不再被反转渲染 |
| 样式收编 | `STYLES`/`ICONS` 常量 + `setStyles`/`setHover`/`createEl` 最小工具集（自 anime_search 复制，脚本相互独立是仓库既定决策）；hover 用命名函数；z-index 进常量 |
| 元数据 | 头部加 `@noframes`（对齐 jvs/url_viewer）；双 `@description` 合并为一条含日期 |
| 版本节奏 | 0.0.5 → 0.1.0，日期 2026-08-16（行为变更：iframe 不再注入、隐私模式不炸、按钮不再被反转） |
| 文档 | AGENTS.md（软链 CLAUDE.md，只改一份）新增架构小节；CONTEXT.md 新增术语 |

## 改动清单

1. `src/color_mode_switch.user.js`
   - 头部：`@noframes`、合并 `@description`、版本 0.1.0
   - 状态模块：`readState`/`writeState`/`buildReverseColorCss` 三个窄 interface；`toggleReverseColorMode` 只做「翻转 → 写 → 切 UI」，写失败短路
   - 样式层：常量 + 工具函数，消灭内联 cssText/innerHTML/匿名 hover/硬编码 z-index
   - IIFE 尾部挂 `__COLOR_MODE_SWITCH_TEST__` 钩子（jvs/url_viewer/anime_search 一致）
2. `tests/color_mode_switch.test.mjs`（新增）：vm sandbox 手法照 anime_search 变体
3. `AGENTS.md`：新增 color_mode_switch 脚本架构小节
4. `CONTEXT.md`：术语「反转色模式 reverse color mode」「状态存取 readState/writeState」「反转样式表 buildReverseColorCss」

## 测试用例

`readState`：

- `'true'` → true；`'false'` / null → false
- `getItem` 抛 SecurityError → false（隐私模式回归）

`writeState`：

- 写 true/false 后存储值正确，返回 true
- `setItem` 抛 QuotaExceeded → 返回 false，存储值未变

`buildReverseColorCss`：

- 含 `html` invert + hue-rotate、媒体双反转、`.reverse-color-mode-ignore` 逃生舱
- **死规则回归**：不含 `[style*="background-image:"]`
- **按钮自反回归**：按钮容器 id 出现在双反转组里

元数据（读源文件文本断言，可重复执行）：

- 头部含 `@noframes`
- `@description` 恰一条且含日期

DOM 行为（vm + createElement stub，若 stub 成本可控）：

- init 后按钮容器挂到 body；toggle 后按钮 display 切换

## 验证方案

1. `node --test tests/color_mode_switch.test.mjs`（新增）
2. `node --test tests/`（全量，确认 jvs / url_viewer / anime_search 无回归）
3. 手动验证清单（浏览器）：任意页面 GM 菜单/按钮切换反转、刷新后状态保持、含 iframe 的页面上 iframe 内不再出现按钮、反转下按钮呈原始黑底

## 不做什么

- 不加 `storage` 事件跨 tab 同步（YAGNI，单页场景够用）
- 不做站点白名单/黑名单（@noframes 已消除主要痛点）
- 不动 `display: none` 隐藏方式（对 fixed 单元素是正确选择）
- 不共享工具函数到其他脚本（仓库既定：脚本相互独立）
- 不发版（OpenUserJS 上传由用户执行）
