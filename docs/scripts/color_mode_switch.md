# color_mode_switch.user.js 架构

- **iframe 闸门**：`@noframes` 只在顶层 frame 运行，跨 frame 写同一存储键的失步问题随之消除。
- **存储异常语义**：读异常出关闭、写异常返回 false，toggle 写失败即短路——内存态、存储态、视觉态三方一致。
- **CSS filter 约束**：子树无法脱离整页反转，媒体与自挂按钮只能二次反转抵消。
- **逃生舱边界**：仅 `.reverse-color-mode-ignore`，且只对覆盖媒体二次反转有效；禁用 data-theme 之类的属性选择器——特异性高于 `html`，会把挂在 `<html>` 上的站点（GitHub、Docusaurus）整页反转反杀成 filter:none，图片仍负片。
- **图标分家**：按钮图标 fill `#fff`（底 `#000`，黑底白月）；`@icon` currentColor（底是油猴浅色管理面板，回落黑）。img 加载的 SVG 是独立文档，currentColor 一律回落黑色——一份 SVG 无法同时满足两处，两份 base64 人肉同步，形状一致性（剥 fill 后逐字节一致）由测试锁定。v0.1.1 曾一刀切 `#fff` 致 @icon 面板不可见。
- **按钮黑底白月**：按钮只在反转开启时显示（关闭态 `display:none`）；主场景暗转亮，反转后的亮页上黑底白月对比度最高、无需阴影。黑底唯一隐身场景是亮转暗的反转后暗页——罕用方向，油猴菜单命令兜底。
- **图标防站点样式污染**：按钮图标是 `<img>`，会被站点全局 img 样式（border/outline/padding/background）命中打出方框——黑底时代深色边框看不出来，2026-10-15 浅色图标期暴露后修复。图标样式必须内联重置这四项。
- **图标反转层数**：切换容器在二次反转组内，容器内 img 若再被媒体规则命中会叠成三层（奇数）反转——白色图标渲染成黑色，黑底黑字。容器内 img 必须豁免（`[id=...] img { filter: none }`，特异性压过媒体组）。
- **document-start 时序**：样式与菜单命令在 document-start 即生效防加载期闪白；按钮挂载等 DOMContentLoaded（此前 body 未就绪）。

验证：`node --test tests/color_mode_switch.test.mjs`。
