# jvs.user.js 架构

采用模块化操作函数架构：

- **环境检测**：`isJVS()` 检测 JVS UI 相关 link 标签，非 JVS 站点早退
- **操作队列**：`operations` 混合数组由 `createOperationRunner` 调度，每 400ms 执行一次。普通函数每 tick 执行；`{ name, probe, apply }` 对象由 probe 返回的键控制——返回 null/undefined 表示本 tick 不适用，键不变时跳过 apply
- **状态管理**：`STATE` 对象管理页面级闩锁状态；配置常量（`CONFIG`、`COLORS`、`DESIGN_CONFIG`、`APP_NAME_SELECTORS`）均在 IIFE 闭包内
- **设计器类型**：支持逻辑、列表、表单、流程设计；`getTabType()` 判定当前设计器类型——须同时满足 `.design-header-box`（设计器头部）存在且 `#tab-design > span` 文本是 `DESIGN_CONFIG` 已知类型，旧版 JVS 非设计页面残留的「逻辑设计」页签因此被排除，favicon 不再误显「逻」图标
- **旧版节点展开名称**：旧版 JVS 逻辑设计节点源自 easy-flow（jsPlumber，`.jtk-droppable`），按单行排版（`.ef-node-text` line-height 46px 撑起 ~48px 文字框，节点高 ~97px 固定）；`white-space: normal` 折行后第二行被 `overflow: hidden` 裁掉，且折行时 `text-overflow: ellipsis` 失效——只压缩 `.ef-node-text` 行高（20px，两行共 40px 装进原文字框）并框内垂直居中（min-height 48px 维持占位），节点框/`.top`/连线锚点零改动（`height: auto` 会让节点形态重算、锚点错位，已被用户截图否决）
- **性能优化**：使用 CSS 替代 DOM 操作，减少内存占用

测试：`node --test tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs tests/jvs.paint.test.mjs tests/jvs.tabtype.test.mjs tests/jvs.styles.test.mjs` 覆盖调度器契约、存储域规则（过期剪切、去重、目录幂等写入）、组件上色机制、设计器类型判定和旧版节点展开名称样式。
