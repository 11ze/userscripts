# bilibili-live-mask.user.js 架构

纯 CSS 注入，无 JS 逻辑：

- **移除直播遮挡**：`.web-player-module-area-mask` 宽高归零（B 站直播间播放器上的活动遮挡浮层）
- **隐藏品牌图标**：`.radio-room-brand-icon` 直接 `display: none`（电台房间水印角标）
- 经 `GM_addStyle` 注入，规则均带 `!important` 压过站点样式

测试：无。验证方式：任意 B 站直播间页面安装后遮挡区域消失。
