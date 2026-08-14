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

- **环境检测**：`isJVS()` 检测 JVS UI 相关 link 标签，非 JVS 站点早退
- **操作队列**：`operations` 混合数组由 `createOperationRunner` 调度，每 400ms 执行一次。普通函数每 tick 执行；`{ name, probe, apply }` 对象由 probe 返回的键控制——返回 null/undefined 表示本 tick 不适用，键不变时跳过 apply
- **状态管理**：`STATE` 对象管理页面级闩锁状态；配置常量（`CONFIG`、`COLORS`、`DESIGN_CONFIG`、`APP_NAME_SELECTORS`）均在 IIFE 闭包内
- **设计器类型**：支持逻辑、列表、表单、流程设计
- **性能优化**：使用 CSS 替代 DOM 操作，减少内存占用

测试：`node --test tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs tests/jvs.paint.test.mjs` 覆盖调度器契约、存储域规则（过期剪切、去重、目录幂等写入）和组件上色机制；测试通过 `window.__JVS_TEST__` 条件钩子取用 IIFE 内部函数（浏览器中该钩子永不激活）。

### url_viewer 脚本架构

[url_viewer.user.js](src/url_viewer.user.js) 的 URL 解析采用结构化模型：

- **解析模型**：`parseUrl` 返回 `[{host, params: [{key, value}]}]`，段内取第一个 `?` 之后的全部作为查询串（参数值里的 `?` 不截断），渲染循环直接按结构遍历，重复参数键保留多行
- **解码顺序**：先对整串 `decodeURIComponent` 再按 `#` 分段——让参数里编码的 # 炸开成独立段，iframe 嵌套路由才能分节展示
- **编辑路径**：以 DOM 为数据模型（`dataset.hashIndex`/`hashHost`/`paramKey`），重建 URL 时主 URL 与 hash 段都用 `URLSearchParams.append` 保留重复键

测试：`node --test tests/url_viewer.url.test.mjs` 覆盖 URL 解析行为；测试通过 `window.__URL_VIEWER_TEST__` 条件钩子取用 IIFE 内部函数（浏览器中该钩子永不激活）。

### anime_search 脚本架构

[anime_search.user.js](src/anime_search.user.js) 按「站点判定 → 标题提取 → 按钮挂载」组织：

- **站点判定**：`detectSite(href)` 用 hostname + pathname 推出所属站点（`'age' | 'douban' | 'bilibili' | null`），query 不参与判定，`null` 即早退；入口闸门与 AGE 页面清理 CSS 共用这一个答案
- **标题提取**：`extractTitle(el)` 吸收 span→textContent 回退、自挂按钮 emoji（🔍🏆ℹ️）剥离、`uniqueText` 译名去重（豆瓣「原名称 译名」并列时，按空格分词后从首个与首词同首字的词处截断）
- **按钮渲染**：`createButtonPair(title)` 一对跨站搜索按钮（🔍 聚合搜索 / 🏆 豆瓣），内部走 `COLORS`/`setStyles`/`setHover`/`createEl` 最小工具集（自 url_viewer 复制，脚本相互独立）；主循环命中首个选择器挂一对按钮即止——一次性执行，SPA 站内换页后按钮不补挂（用户决策：刷新页面即可，不为该场景加轮询）
- **详情跳转**：AGE play 页挂载点在搜索按钮对后追加 ℹ️ 按钮，`buildDetailHref(pathname, origin)` 从 `/play/{id}/...` 提取番剧 id 拼站内 `/detail/{id}`，当前标签页跳转；origin 随当前站点拼接，AGE 镜像域自适应
- **选择器适配**：B 站挂载点是媒体信息区标题链接 `a[class*='mediainfo_mediaTitle']`（class 前缀匹配，2026-08 改版后 `#__next` 6 层 div 旧选择器已失效）

测试：`node --test tests/anime_search.test.mjs` 覆盖站点判定（含 query 泄漏回归）、标题提取、按钮渲染、详情跳转与挂载循环；测试通过 `window.__ANIME_SEARCH_TEST__` 条件钩子取用 IIFE 内部函数（浏览器中该钩子永不激活）。

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

### UI 组件开发

- **复用现有 CSS 类**：添加新组件时先用 Grep 搜索现有类名（如 `.log-11ze-*`），避免重复定义

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
