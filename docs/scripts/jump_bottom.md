# jump_bottom.user.js 架构

- **window 直滚判定**：`scrollHeight` 是 Element 属性，`window.scrollHeight` 恒 `undefined`——主路径曾是死分支，v0.0.16 改 `document.documentElement.scrollHeight > clientHeight` 判定（无匹配容器的长页按钮曾无效）。
- **QQ 邮箱特例**：邮件详情页滚动目标在 mainFrame iframe 内，走 `scrollIntoView` 特例（https://mail.qq.com/cgi-bin/frame_html）。
- **全局隔离**：v0.0.17 起包 IIFE 并启用严格模式。此前 `createButton` 等函数声明挂在页面全局，任意站点都有撞名风险；`self == top` 仍为宽松相等（保持原行为）。

自动验证：`node --test tests/jump_bottom.test.mjs`，通过完整脚本挂出的顶/底按钮验证三条滚动路径及优先级；DOM 替身不验证浏览器布局与 iframe 访问权限。

浏览器验证：任意长页面点顶/底按钮观察滚动目标；QQ 邮箱邮件详情页观察 iframe 内滚动。
