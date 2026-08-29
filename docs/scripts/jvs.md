# jvs.user.js 架构

采用模块化操作函数架构：

- **环境检测**：`isJVS()` 检测 JVS UI 相关 link 标签，非 JVS 站点早退
- **新旧双版**：站点有新版（qicong-edf）与旧版（jyy-dev）两套环境，DOM 结构不同（如应用中心容器新版 `.app-page`、旧版 `.jvs-layout-tempOpen > .template-content-box`）；改动时若注释或本文档提到旧版，必须兼顾旧版场景并在两版实测
- **操作队列**：`operations` 混合数组由 `createOperationRunner` 调度，每 400ms 执行一次。普通函数每 tick 执行；`{ name, probe, apply }` 对象由 probe 返回的键控制——返回 null/undefined 表示本 tick 不适用，键不变时跳过 apply
- **状态管理**：`STATE` 对象管理页面级闩锁状态；配置常量（`CONFIG`、`COLORS`、`DESIGN_CONFIG`、`APP_NAME_SELECTORS`）均在 IIFE 闭包内
- **设计器类型**：支持逻辑、列表、表单、流程设计；`getTabType()` 判定当前设计器类型——须同时满足 `.design-header-box`（设计器头部）存在且 `#tab-design > span` 文本是 `DESIGN_CONFIG` 已知类型，旧版 JVS 非设计页面残留的「逻辑设计」页签因此被排除，favicon 不再误显「逻」图标
- **旧版节点展开名称**：旧版 JVS 逻辑设计节点源自 easy-flow（jsPlumber，`.jtk-droppable`），按单行排版（`.ef-node-text` line-height 46px 撑起 ~48px 文字框，节点高 ~97px 固定）；`white-space: normal` 折行后第二行被 `overflow: hidden` 裁掉，且折行时 `text-overflow: ellipsis` 失效——只压缩 `.ef-node-text` 行高（20px，两行共 40px 装进原文字框）并框内垂直居中（min-height 48px 维持占位），节点框/`.top`/连线锚点零改动（`height: auto` 会让节点形态重算、锚点错位，已被用户截图否决）
- **应用中心星标**：`highlightApps()` 往 `.application` 卡片右上角注入星标按钮（`.ze-star-btn`，不走 `createButton`——其皮肤类与星标透明形态冲突）并切换 `.ze-marked` 类，视觉全由 JVS_STYLES 承担——`.application:has(.ze-star-btn)` 提供卡片定位与透明占位边框（防抖动）、`:has(.ze-star-btn.ze-marked)` 特异性更高只覆盖 `border-color` 为金色（`#FAAD14`）；按钮平时 `opacity: 0`、悬停卡片浮现、点击切换标记并立即刷新该卡片（不等 400ms 轮询）；标记按应用名存 localStorage `HIGHLIGHT_APPS`，渲染与点击均现读存储（多标签页同开不互相覆盖），实心星由 CSS 覆盖 SVG 的 `fill="none"` 属性实现（fill 与 stroke 都走 `currentColor` 跟随按钮 color）
- **只看星标过滤**：`filterStarredApps()` 注入「★ 只看星标」pill 开关（`.ze-star-filter-btn`）与空态提示元素——新版钉 `.app-page` 顶部，旧版按钮插进 `.filter-bar` 筛选行（全部分类 + 搜索框）搜索框右侧、对齐与间距交给该行 flex 的 `align-items/gap`（CSS 清掉钉顶 margin），空态提示插到卡片流开头（第一张卡的父级；filter-bar 实际嵌在卡片区容器内部，prepend 容器会把提示顶到筛选行上方——空态时卡片全隐藏，提示落进空白卡片区）；JS 只产出 `body.ze-star-filter-on` 这一个事实——非星标卡片隐藏、无星标部门组整组隐藏（连标题，仅新版有分组）、空态提示全由 CSS `:has()` 驱动，按钮激活金色也由 body class 派生（无第二事实源）；开关状态存 localStorage `STARRED_FILTER`（布尔，现读同步，多标签页自动一致），点击立即生效不等轮询；离开应用中心（`.app-page` 与旧版 `.jvs-layout-tempOpen > .template-content-box` 都查不到）时清理 body class，开关按钮随 SPA DOM 销毁

## 柔和色彩方案

```javascript
const colorScheme = {
  data: '#FFD6E7',      // 数据 - 柔和粉色
  logic: '#D6E4FF',     // 逻辑 - 柔和蓝色
  loop: '#D9F7D9',      // 循环 - 柔和绿色
  warning: '#FEF0C7',   // 警告 - 柔和黄色
  variable: '#EFDBFF',  // 变量 - 柔和紫色
};
```

测试：`node --test tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs tests/jvs.paint.test.mjs tests/jvs.tabtype.test.mjs tests/jvs.styles.test.mjs tests/jvs.highlight.test.mjs` 覆盖调度器契约、存储域规则（过期剪切、去重、目录幂等写入）、组件上色机制、设计器类型判定、旧版节点展开名称样式、星标与只看星标过滤的存储联动。
