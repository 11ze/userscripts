# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

Tampermonkey 用户脚本集合，使用原生 JavaScript 编写，无需构建工具。

| 脚本 | 功能 | 目标网站 |
|------|------|----------|
| [jvs.user.js](src/jvs.user.js) | 改善 JVS 低代码平台开发体验 | JVS 相关域名 |
| [url_viewer.user.js](src/url_viewer.user.js) | 解析和显示当前页面 URL 参数 | 所有网站 |
| [anime_search.user.js](src/anime_search.user.js) | 添加动漫聚合搜索和豆瓣评分 | AGE、Bilibili、豆瓣 |
| [color_mode_switch.user.js](src/color_mode_switch.user.js) | 网站亮暗色模式切换 | 所有网站 |
| [age-video-download.user.js](src/age-video-download.user.js) | AGE 网站视频下载辅助 | AGE |
| [bilibili-live-mask.user.js](src/bilibili-live-mask.user.js) | 移除 B 站直播遮挡区域 | Bilibili |
| [jump_bottom.user.js](src/jump_bottom.user.js) | 快速跳转到页面顶部/底部 | 所有网站 |

## 开发指南

### 脚本头部规范

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

### 常用 GM_* API

- `GM_addStyle` - 动态添加 CSS 样式
- `GM_registerMenuCommand` - 注册 Tampermonkey 菜单命令

### 架构模式

**1. 域名检测模式**：使用域名列表判断是否运行脚本

```javascript
const domainList = ['example.com', 'test.org'];
if (!domainList.some((domain) => window.location.href.includes(domain))) return;
```

**2. 轮询执行模式**：对动态加载内容使用 `setInterval` 持续检测 DOM

**3. 本地存储工具**：统一的 localStorage 封装处理 JSON 数据

### JVS 脚本架构

[jvs.user.js](src/jvs.user.js) 采用模块化操作函数架构：

- **环境检测**：`isJVS()` 检测 JVS UI 相关 link 标签
- **操作队列**：`operations` 数组包含所有功能函数，每 400ms 执行一次
- **全局变量**：使用 `window` 对象共享配置和工具函数
- **设计器类型**：支持逻辑、列表、表单、流程设计
- **性能优化**：使用 CSS 替代 DOM 操作，减少内存占用

关键全局配置：
- `window.designSetting` - 设计器类型对应的颜色和简称
- `window.appNameSelectorList` - 应用名称的 DOM 选择器列表
- `window.logOptions` - 日志过滤选项

## 代码规范

### 事件处理

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

### 性能优化

- **样式常量对象**：统一管理颜色、动画配置
- **工具函数**：提取 `setStyles`、`setHover`、`createEl`
- **CSS 动画替代 JS 动画**：使用 GPU 加速
- **避免通配符选择器**：不用 `querySelectorAll('*')`
- **使用标准 API**：`URLSearchParams` 处理 URL 参数
- **函数参数校验**：在入口处验证参数

```javascript
const COLORS = {
  bg: '#ffffff',
  border: '#e2e8f0',
  primary: '#3b82f6',
  success: '#10b981',
  error: '#ef4444',
};

function setStyles(el, styles) {
  Object.assign(el.style, styles);
}

function createEl(tag, styles = {}, props = {}) {
  const el = document.createElement(tag);
  setStyles(el, styles);
  Object.assign(el, props);
  return el;
}
```

### 代码质量

- **避免样式硬编码**：使用 `STYLES` 常量对象
- **代码分层**：样式常量 → 工具函数 → 业务逻辑
- **优先使用 CSS**：使用 `white-space`、`display` 控制 UI，避免频繁 DOM 操作
- **状态标记**：使用 `getAttribute`/`setAttribute` 避免重复操作
- **资源清理**：页面卸载时清理定时器（`beforeunload` 事件）

### z-index 管理

Toast/弹窗使用递增 z-index 避免覆盖：

```javascript
let toastZIndex = 10000;
toast.style.zIndex = String(toastZIndex++);
```

## UI/UX 设计规范

### 柔和色彩方案（JVS 脚本）

```javascript
const colorScheme = {
  data: '#FFD6E7',      // 数据 - 柔和粉色
  logic: '#D6E4FF',     // 逻辑 - 柔和蓝色
  loop: '#D9F7D9',      // 循环 - 柔和绿色
  warning: '#FEF0C7',   // 警告 - 柔和黄色
  variable: '#EFDBFF',  // 变量 - 柔和紫色
};
```

### 主题色系统

```javascript
const theme = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryBg: '#eff6ff',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  success: '#10b981',
  error: '#ef4444',
};
```

### 统一设计元素

- **圆角**：6px-12px
- **阴影**：`0 2px 8px rgba(0, 0, 0, 0.06)`
- **动画时长**：200ms
- **动画缓动**：`cubic-bezier(0.4, 0, 0.2, 1)`

## 发布流程

1. 更新脚本版本号和日期
2. 在 [OpenUserJS](https://openuserjs.org/) 上传新版本
3. 更新 README.md 中的脚本链接

## 注意事项

- 所有脚本针对最新版浏览器（Chromium 100+）
- 脚本之间相互独立，无共享依赖
- 可使用 ES6+ 特性（箭头函数、模板字符串、const/let、解构赋值等）
- 使用 `'use strict'` 严格模式
- 图标优先使用 data URI 以避免外部依赖
- 脚本头部使用语义化版本号 `x.y.z`
- `@description` 字段包含最后更新日期 (YYYY-MM-DD)
