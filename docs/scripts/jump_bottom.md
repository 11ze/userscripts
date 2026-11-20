# jump_bottom.user.js 架构

- **window 直滚判定**：`scrollHeight` 是 Element 属性，`window.scrollHeight` 恒 `undefined`——主路径曾是死分支，v0.0.16 改 `document.documentElement.scrollHeight > clientHeight` 判定（无匹配容器的长页按钮曾无效）。
- **QQ 邮箱特例**：邮件详情页滚动目标在 mainFrame iframe 内，走 `scrollIntoView` 特例（https://mail.qq.com/cgi-bin/frame_html）。
- **全局隔离**：v0.0.17 起包 IIFE 并启用严格模式。此前 `createButton` 等函数声明挂在页面全局，任意站点都有撞名风险；`self == top` 仍为宽松相等（保持原行为）。
- **按钮语义（v0.0.18）**：`<span>` 换成原生 `<button type="button">`，补 `aria-label`（回到顶部/回到底部），Tab 可聚焦、Enter/Space 可触发；只在顶层 frame 注入，`@match *` 下 iframe 不重复建钮。
- **状态收进 CSS（v0.0.18）**：常态 `opacity:.55`，`:hover`/`:focus-visible`/`:active` 统一到 1，删除 JS 的 mouseover/mouseout 改透明度。旧实现移开后落到 0.2，比初始 0.3 更淡，是缺陷不是设计。
- **两钮相接（v0.0.18）**：顶钮 `bottom:50%`、底钮 `top:50%`，不按视口高度留 1% 缝；固定像素缝会随视口高度变形。
- **样式表而非内联**：样式集中在 `<style id="11ze-jump-button-style">`，含焦点环与 `:active` 回弹；只用标准属性，不再写 `-moz-`/`-webkit-` 前缀。

自动验证：`node --test tests/jump_bottom.test.mjs`，通过完整脚本挂出的顶/底按钮验证三条滚动路径及优先级、按钮语义、样式表与 50% 相接；DOM 替身不验证浏览器布局与 iframe 访问权限。

浏览器验证：任意长页面点顶/底按钮观察滚动目标；QQ 邮箱邮件详情页观察 iframe 内滚动。
