# jump_bottom.user.js 架构

顶/底双按钮挂在页面右缘中线（`if (self == top)` 只在顶层 frame 挂），点击按三段式策略滚动：

- **三段式滚动策略**（优先级从高到低）：window 可滚直接 `window.scrollTo` → QQ 邮箱特例（`mainFrame` iframe 内 `qqmail_mailcontainer` `scrollIntoView`，https://mail.qq.com/cgi-bin/frame_html）→ 常见滚动容器兜底 `runScrollableElements`——只查常见选择器（`[class*="scroll"]`、`main`、`.content` 等 13 个）避免选择所有元素，命中 `scrollHeight > clientHeight` 且高宽均 >300 且非嵌套 html 的容器全部滚到顶/底
- **按钮**：span + `cssText` 内联样式，奶黄底 `rgba(247,220,111,0.667)`，hover 时透明度 0.3 → 0.8（移出回落 0.2）；图标为 base64 PNG 常量
- **已知问题**：全仓唯一没有 `'use strict'` 的脚本（补上可能显形隐藏错误，待单独任务处理）；`self == top` 为宽松相等

测试：无。验证方式：任意长页面点顶/底按钮观察滚动目标；QQ 邮箱邮件详情页点按钮观察 iframe 内滚动。
