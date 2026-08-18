# 用户脚本通用规范

适用于所有 `src/*.user.js`。

## 脚本头部

```javascript
// ==UserScript==
// @name         脚本名称
// @namespace    https://github.com/11ze
// @version      x.y.z
// @description  日期描述 (YYYY-MM-DD)
// @author       11ze
// @license      MIT
// @match        模式匹配规则
// @icon         图标 (data URI 或 URL)
// @grant        GM_* 权限声明
// ==/UserScript==
```

## 事件处理

- **工具函数必须使用 `addEventListener`**：避免覆盖已有事件处理器
- **一次性处理器可用事件属性**：`.onclick`、`.onmouseover` 等（创建元素时设置）

## 编码规范

- **样式常量（COLORS / STYLES）**：统一管理颜色、动画配置，避免硬编码
- **工具函数**：提取 `setStyles`、`setHover`、`createEl` 最小工具集（各脚本自带一份，自最相近的脚本复制）
- **优先使用 CSS**：`white-space`、`display` 等 CSS 替代频繁 DOM 操作，CSS 动画替代 JS 动画
- **资源清理**：页面卸载时清理定时器（`beforeunload` 事件）
- **复用现有 CSS 类**：添加新组件时先搜索现有类名（如 `.log-11ze-*`）
- **z-index**：Toast/弹窗用高 z-index 避开站点 UI（现有日志弹窗固定 `9998`）；多个弹窗互相遮挡时用递增 z-index 保证后弹在上
