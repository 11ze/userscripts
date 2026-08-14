# anime_search 候选 3：addButton 拆为按钮渲染深模块

> 状态：已完成 · 2026-08-14 · 出自 architecture-review-20260814-165829.html 的候选 3

## 决策记录

| 决策 | 结论 | 依据 |
|------|------|------|
| 接口 | `createButtonPair(title)` 返回 `[🔍按钮, 🏆按钮]`，目标站常量闭包内引用 | 报告卡 3「4 参数 → 1 参数」；url_viewer COLORS 闭包先例 |
| 工具函数 | 从 url_viewer 复制最小集：`COLORS` / `setStyles` / `setHover` / `createEl` | 仓库约定「脚本相互独立，无共享依赖」；报告卡 3「对照 url_viewer 形状」 |
| hover | 改用 setHover（mouseover/mouseout），样式值与现状逐值一致 | 按钮无子元素，与 mouseenter/mouseleave 行为等价 |
| `from` 参数 | 删除，连同 `console.log(from)`；入口日志保留 | 报告卡 3 确认的浅接口证据 |
| 外层循环 | 保持 for + break，职责收敛为「找到标题元素 → 挂一对按钮 → break」 | 外科手术式改动 |
| 版本号 | 候选 3 完成 即攒批 `0.6.11 → 0.6.12`，@description 更新 2026-08-14 | 候选 1+2 的 Q6 决策；发版（OpenUserJS）仍由用户手动 |
| 转发层 | 不引入 | plans/ 候选 4/5 既有决策 |

## 改动清单

1. `src/anime_search.user.js`
   - 删 `addButton(selector, targetWeb, from, buttonName)` 四参数函数
   - 新增 `COLORS` 常量、`setStyles` / `setHover` / `createEl` 最小工具集、`createButtonPair(title)`
   - 主循环改为：命中选择器 → `extractTitle` → `createButtonPair` → 逐个 `appendChild` → break
   - `createButtonPair` 进 `__ANIME_SEARCH_TEST__` 钩子
   - 头部 `@version 0.6.12`、`@description 2026-08-14`
2. `tests/anime_search.test.mjs`：新增「按钮渲染」「按钮挂载」两组测试；`loadScriptHooks` 拆出可注入 `querySelector` 的 `loadScriptSandbox`
3. `CLAUDE.md`：anime_search 小节的「按钮挂载」描述同步更新

## 测试用例

按钮渲染（`createButtonPair`）：

- 返回 2 个按钮，`textContent` 分别为 `🔍`、`🏆`
- 每个按钮绑定 hover（mouseover/mouseout 各一对）
- 点击分别 `window.open('https://so.wangze.tech?q=' + title)` 与豆瓣搜索 URL

按钮挂载（主循环，注入假 hDom）：

- 首个命中的选择器挂载一对按钮（`appendChild` 调 2 次）
- 命中后 break（`document.querySelector` 只被调 1 次）

## 验证方案

1. `node --test tests/anime_search.test.mjs tests/url_viewer.url.test.mjs tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs tests/jvs.paint.test.mjs` 全绿
2. 浏览器实测（复用已开的豆瓣条目页）：刷新后按钮渲染、hover 变色、点击跳转目标搜索站

## 插队修复（2026-08-14）：B 站番剧页按钮消失

- **根因**：B 站播放页改版，`#__next` 下固定 6 层 div 的标题 `a` 不复存在，选择器 `#__next > div > div > div > div > div > div > a` 0 命中——与候选 1+2 重构无关（0.6.11 选择器逐字节相同、`detectSite` 闸门对 `/bangumi/play/*` 等价）。浏览器证据：`#__next` 仅 2 个直接子 div；媒体信息区标题链接类名为 `mediainfo_mediaTitle__<hash>`。
- **修复**：选择器表 B 站条目改为 `a[class*='mediainfo_mediaTitle']`（class 前缀匹配，hash 无关）。该元素 domcontentloaded 即存在（SSR）、无子 span、textContent 即番名，`extractTitle` 走 textContent 路径输出正确。
- **Sibling sweep**：豆瓣 `h1 > span:nth-child(1)` ✓（2026-08-14 实测）；AGE `div.body_content_wrapper h2` ✓（agedm.io/detail/20260212 命中 1，文本即番名）；`#content > h1`（AGE3）在 agedm.io 不命中但排在 h2 之后无影响；agedm.org 已停靠（官方最新域名 agedm.io，见 github.com/agefanscom/website）。
- **待决（不动代码）**：AGE 官方备用域名 age.tv 的 hostname 不含 `agedm`/`agefans` 子串，闸门不覆盖——0.6.11 同样不覆盖（parity）。是否扩 `detectSite` 覆盖 age.tv 由用户拍板。
- **可重复验证**：Tampermonkey 更新脚本 → 开任意 B 站番剧播放页（如 `/bangumi/play/ss45574`）→ 媒体信息区标题旁出现 🔍/🏆 按钮 → 点击分别跳转 `so.wangze.tech?q=咒术回战 第二季` 与豆瓣搜索。node 侧 `extractTitle` textContent 回退测试已覆盖「无 span 元素」路径。

## 不做什么

- 不动选择器表 `list` 的条目与顺序（候选 4 才考虑轮询补挂）
- 不改 `extractTitle` / `detectSite` / `uniqueText`（候选 1+2 已定稿）
- 不修 `uniqueText` 跨字形截断偏差（已记录待决）
