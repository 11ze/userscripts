# color_mode_switch.user.js 架构

- **iframe 闸门**：`@noframes` 只在顶层 frame 运行，跨 frame 写同一存储键的失步问题随之消除。
- **存储异常语义**：读异常出关闭、写异常返回 false，toggle 写失败即短路——内存态、存储态、视觉态三方一致。
- **CSS filter 约束**：子树无法脱离整页反转，媒体与自挂按钮只能二次反转抵消。
- **逃生舱边界**：仅 `.reverse-color-mode-ignore`，且只对覆盖媒体二次反转有效；禁用 data-theme 之类的属性选择器——特异性高于 `html`，会把挂在 `<html>` 上的站点（GitHub、Docusaurus）整页反转反杀成 filter:none，图片仍负片。
- **图标固定色值**：img 加载的 SVG 是独立文档，拿不到页面颜色，currentColor 解析为黑色，`#000` 按钮底上不可见。
- **图标反转层数**：切换容器在二次反转组内，容器内 img 若再被媒体规则命中会叠成三层（奇数）反转——白色图标渲染成黑色，黑底黑字。容器内 img 必须豁免（`[id=...] img { filter: none }`，特异性压过媒体组）。
- **document-start 时序**：样式与菜单命令在 document-start 即生效防加载期闪白；按钮挂载等 DOMContentLoaded（此前 body 未就绪）。

验证：`node --test tests/color_mode_switch.test.mjs`。
