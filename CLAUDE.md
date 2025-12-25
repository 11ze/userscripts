# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

这是一个 Tampermonkey 用户脚本集合，包含多个针对特定网站的增强脚本。所有脚本使用原生 JavaScript 编写，无需构建工具或包管理器。

### 脚本列表

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

所有脚本必须包含标准的 UserScript 头部元数据：

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
// @noframes     (可选，禁止在 iframe 中运行)
// ==/UserScript==
```

### 常用 GM_* API

- `GM_addStyle` - 动态添加 CSS 样式
- `GM_registerMenuCommand` - 注册 Tampermonkey 菜单命令

### 架构模式

#### 1. 域名检测模式
使用域名列表判断是否运行脚本：

```javascript
const domainList = ['example.com', 'test.org'];
if (!domainList.some((domain) => window.location.href.includes(domain))) {
  return;
}
```

#### 2. 轮询执行模式
对于动态加载内容的网站，使用 `setInterval` 持续检测 DOM：

```javascript
const timer = setInterval(() => {
  // 检测并操作 DOM
  const element = document.querySelector(selector);
  if (element) {
    clearInterval(timer);
    // 执行操作
  }
}, 400);
```

#### 3. 本地存储工具
统一的 localStorage 封装用于处理 JSON 数据：

```javascript
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`读取失败 [${key}]:`, error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`写入失败 [${key}]:`, error);
    }
  },
  remove: (key) => {
    localStorage.removeItem(key);
  },
};
```

### JVS 脚本架构

[jvs.user.js](src/jvs.user.js) 是最复杂的脚本，采用模块化操作函数架构：

- **环境检测**：`isJVS()` 检测页面是否包含 JVS UI 相关的 link 标签
- **操作队列**：`operations` 数组包含所有功能函数，每 400ms 执行一次
- **全局变量**：使用 `window` 对象共享配置和工具函数
- **设计器类型**：支持逻辑设计、列表设计、表单设计、流程设计

关键全局配置：
- `window.designSetting` - 设计器类型对应的颜色和简称
- `window.appNameSelectorList` - 应用名称的 DOM 选择器列表
- `window.logOptions` - 日志过滤选项

### CSS 样式规范

使用 `GM_addStyle` 添加样式，或使用内联样式：

```javascript
// 使用 GM_addStyle（推荐）
GM_addStyle(`
  .my-class {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
  }
`);

// 或内联样式
element.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
`;
```

### 版本管理

脚本头部使用语义化版本号 `x.y.z`：
- 主版本号 (x)：重大功能变更
- 次版本号 (y)：新增功能
- 修订号 (z)：bug 修复和优化

`@description` 字段包含最后更新日期 (YYYY-MM-DD)。

## 发布流程

1. 更新脚本版本号和日期
2. 在 [OpenUserJS](https://openuserjs.org/) 上传新版本
3. 更新 README.md 中的脚本链接

## 注意事项

- 所有脚本针对最新版浏览器（Chromium 100+）
- 脚本之间相互独立，无共享依赖
- 避免使用 ES6+ 新特性以保证兼容性
- 使用 `'use strict'` 严格模式
- 图标优先使用 data URI 以避免外部依赖
