# color_mode_switch.user.js 架构

- **iframe 闸门**：`@noframes` 只在顶层 frame 运行，跨 frame 写同一存储键的失步问题随之消除。
- **存储异常语义**：读异常出关闭、写异常返回 false，toggle 写失败即短路——内存态、存储态、视觉态三方一致。
- **CSS filter 约束**：子树无法脱离整页反转，媒体与自挂按钮只能二次反转抵消。
- **逃生舱边界**：仅 `.reverse-color-mode-ignore`，且只对覆盖媒体二次反转有效；禁用 data-theme 之类的属性选择器——特异性高于 `html`，会把挂在 `<html>` 上的站点（GitHub、Docusaurus）整页反转反杀成 filter:none，图片仍负片。
- **图标分家**：按钮图标 fill `#fff`（底 `#000`，黑底白月）；`@icon` currentColor（底是油猴浅色管理面板，回落黑）。img 加载的 SVG 是独立文档，currentColor 一律回落黑色——一份 SVG 无法同时满足两处，两份 base64 人肉同步，形状一致性（剥 fill 后逐字节一致）由测试锁定。v0.1.1 曾一刀切 `#fff` 致 @icon 面板不可见。
- **按钮黑底白月（定稿「墨盘」）**：按钮只在反转开启时显示（关闭态 `display:none`）；主场景暗转亮，反转后的亮页上黑底白月对比度最高。黑底唯一隐身场景是亮转暗的反转后暗页——罕用方向，v0.1.3 起用发丝描边 `rgba(255,255,255,.22)` 勾出边界兜底，另配轻阴影防反转后亮页上悬空。
- **常态全不透明**：v0.1.2 常态 0.7 透明度在 v0.1.3 移除——0.7 会把发丝描边压没，暗页存活失效。
- **hover 三联动**：容器监听 mouseenter/mouseleave（不冒泡，mouseover 会在容器与子元素间连击抖动），经闭包同时作用于按钮（上浮 2px、描边变亮）与 tooltip（浮出「还原配色」），容器自身无样式变化。
- **tooltip 挂 button 内**：`<span>` 绝对定位探出按钮左侧。挂按钮内两个原因：关闭态 `display:none` 级联隐藏无需同步显隐；随按钮 hover 位移一起动。按钮需 `position:relative`（定位锚点）+ `overflow:visible`（防站点样式裁切探出部分）；tooltip `pointerEvents:none` 不参与 hover。暗页上黑底气泡不可见边界，自带描边与按钮同理。
- **图标防站点样式污染**：按钮图标是 `<img>`，会被站点全局 img 样式（border/outline/padding/background）命中打出方框——黑底时代深色边框看不出来，2026-10-15 浅色图标期暴露后修复。图标样式必须内联重置这四项。
- **图标反转层数**：切换容器在二次反转组内，容器内 img 若再被媒体规则命中会叠成三层（奇数）反转——白色图标渲染成黑色，黑底黑字。容器内 img 必须豁免（`[id=...] img { filter: none }`，特异性压过媒体组）。
- **document-start 时序**：样式与菜单命令在 document-start 即生效防加载期闪白；按钮挂载等 DOMContentLoaded（此前 body 未就绪）。

验证：`node --test tests/color_mode_switch.test.mjs`。
