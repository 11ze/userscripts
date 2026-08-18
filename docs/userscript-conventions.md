# 用户脚本通用规范

适用于所有 `src/*.user.js`。新建或修改任何脚本前先读本文。

## 脚本头部规范

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
- **使用命名函数引用**：便于移除监听器

```javascript
// ✅ 工具函数
function setHover(el, hoverStyles, normalStyles = {}) {
  el.addEventListener('mouseover', () => setStyles(el, hoverStyles));
  el.addEventListener('mouseout', () => setStyles(el, normalStyles));
}

// ✅ 一次性处理器
button.onclick = () => console.log('clicked');
```

## 编码规范

- **样式常量（COLORS / STYLES）**：统一管理颜色、动画配置，避免样式硬编码；样式常量 → 工具函数 → 业务逻辑分层
- **工具函数**：提取 `setStyles`、`setHover`、`createEl` 最小工具集（各脚本自带一份，自最相近的脚本复制）

- **优先使用 CSS**：`white-space`、`display` 等 CSS 替代频繁 DOM 操作；CSS 动画替代 JS 动画（GPU 加速）
- **避免通配符选择器**：不用 `querySelectorAll('*')`
- **使用标准 API**：`URLSearchParams` 处理 URL 参数
- **函数参数校验**：在入口处验证参数
- **状态标记**：使用 `getAttribute`/`setAttribute` 避免重复操作
- **资源清理**：页面卸载时清理定时器（`beforeunload` 事件）

## UI 组件开发

- **复用现有 CSS 类**：添加新组件时先用 Grep 搜索现有类名（如 `.log-11ze-*`），避免重复定义

## z-index 管理

Toast/弹窗用高 z-index 避开站点 UI（现有日志弹窗固定 `9998`）；同时弹出多个且会互相遮挡时，用递增 z-index 保证后弹在上。

## 其他注意事项

- 所有脚本针对最新版浏览器（Chromium 120+，代码已使用 `:has()` 与 CSS nesting）
- 图标优先使用 data URI 以避免外部依赖；如果是网站 icon，则可以拼接 /favicon.ico
