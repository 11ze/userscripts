# jump_bottom.user.js 架构

- **QQ 邮箱特例**：邮件详情页滚动目标在 mainFrame iframe 内，走 `scrollIntoView` 特例（https://mail.qq.com/cgi-bin/frame_html）。
- **已知问题**：全仓唯一没有 `'use strict'` 的脚本（补上可能显形隐藏错误，待单独任务处理）；`self == top` 为宽松相等。

验证：任意长页面点顶/底按钮观察滚动目标；QQ 邮箱邮件详情页观察 iframe 内滚动。
