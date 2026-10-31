# color_mode_switch.user.js 架构

- **iframe 闸门**：`@noframes` 只在顶层 frame 运行，跨 frame 写同一存储键的失步问题随之消除。
- **存储异常语义**：读异常出关闭、写异常返回 false，toggle 写失败即短路——内存态、存储态、视觉态三方一致。
- **CSS filter 约束**：子树无法脱离整页反转，媒体与自挂按钮只能二次反转抵消。
- **柔化与保色取舍**：整页反转后压缩黑白端点，减轻纯白刺眼和纯黑底上的强反差；不加色温、饱和度或额外亮度调整。媒体使用逆序滤镜补偿，保住中间灰阶。输出黑白端点收在 `#0d0d0d` 至 `#f2f2f2`；高光、阴影和高饱和颜色仍受矩阵运算与色域裁切影响，不承诺无损。恢复配色会移除整套滤镜。
- **媒体只抵消一次**：`picture` 是包装层，滤镜只挂内部图片；嵌套 SVG 共享最外层的处理。包装层和内容同时抵消会重新变成负片。
- **SVG 图标与图表**：用 `currentColor` 属性标记的图标随页面变色；显式填色或描边优先按彩色媒体处理，防图表内的 `currentColor` 标签触发图标规则。只识别属性，无法完整识别样式表、CSS 变量或固定黑白色表示的单色图标。
- **背景图取舍**：不对背景图容器整体抵消反转，否则正文也会恢复原配色，且内联与样式表背景得到不同结果。背景图跟随页面反转；轻量滤镜方案无法通用地只保留容器背景图原色。
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

视觉验收：启动 `python3 -m http.server 4311 --directory designs`，打开 `http://localhost:4311/color-mode-switch/index.html`。两个画板只展示改进后的亮色、暗色，都运行实际脚本。检查正文与次要文字的对比度、图片高光与阴影、单色图标、混合图表和嵌套 SVG；输入文字、滚动并点击月亮，确认还原后滤镜移除。用「重新预览」恢复两个画板。

设计目录只保留 `index.html` 这一份设计稿，不保留旧稿与对照页。页面内嵌当前脚本快照，避免预览依赖仓库外文件；修改脚本后同步 `script-source`，测试检查快照一致性。森林照片源自 [Unsplash](https://images.unsplash.com/photo-1441974231531-c6227db76b6e)，按 [Unsplash License](https://unsplash.com/license) 保存在设计目录，不参与用户脚本运行。
