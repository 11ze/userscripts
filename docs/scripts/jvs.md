# jvs.user.js 架构

采用模块化操作函数架构：

- **环境检测**：`isJVS()` 检测 JVS UI 相关 link 标签，非 JVS 站点早退
- **新旧双版**：站点有新版（qicong-edf）与旧版（jyy-dev）两套环境，DOM 结构不同（如应用中心容器新版 `.app-page`、旧版 `.jvs-layout-tempOpen > .template-content-box`）；改动时若注释或本文档提到旧版，必须兼顾旧版场景并在两版实测
- **操作队列**：`operations` 混合数组由 `createOperationRunner` 调度，每 400ms 执行一次。普通函数每 tick 执行；`{ name, probe, apply }` 对象由 probe 返回的键控制——返回 null/undefined 表示本 tick 不适用，键不变时跳过 apply
- **状态管理**：`STATE` 对象管理页面级闩锁状态；配置常量（`CONFIG`、`COLORS`、`DESIGN_CONFIG`、`APP_NAME_SELECTORS`）均在 IIFE 闭包内
- **设计器类型**：支持逻辑、列表、表单、流程设计；`getTabType()` 判定当前设计器类型——须同时满足 `.design-header-box`（设计器头部）存在且 `#tab-design > span` 文本是 `DESIGN_CONFIG` 已知类型，旧版 JVS 非设计页面残留的「逻辑设计」页签因此被排除，favicon 不再误显「逻」图标
- **旧版节点展开名称**：旧版 JVS 逻辑设计节点源自 easy-flow（jsPlumber，`.jtk-droppable`），按单行排版（`.ef-node-text` line-height 46px 撑起 ~48px 文字框，节点高 ~97px 固定）；`white-space: normal` 折行后第二行被 `overflow: hidden` 裁掉，且折行时 `text-overflow: ellipsis` 失效——只压缩 `.ef-node-text` 行高（20px，两行共 40px 装进原文字框）并框内垂直居中（min-height 48px 维持占位），节点框/`.top`/连线锚点零改动（`height: auto` 会让节点形态重算、锚点错位，已被用户截图否决）
- **新版节点名称完整显示与精修**：新版节点源自 Butterfly（Vue 响应式）；框与 `.top` 维持原生固定高（36/32px），只放开文本层 `.ef-node-text` 的溢出（祖先层全是 visible）——折行名称完整「画」到框外，不占布局、不推锚点、无省略号（省略、名称牌、变高装框均被用户否决，宽度维持 160px 不加宽）；左侧图标（`.ef-node-left-ico`，类名带 flow-node-drag 但实测非拖拽把手）隐藏让文字左移占满；右侧执行结果图标槽（`.ef-node-right-ico`，原生 16px 常驻占位）用 `:not(:has([class*="el-node-state"]))` 判空收起——有结果时应用给槽内 reference 图标挂 `el-node-state-success`/`el-node-state-error` 字体图标类，空置时没有（图标是 Element 字体不是 svg，`:empty` 也不可用），有执行结果图标时恢复原生占位不压字；规则一律 `:not(.jtk-droppable)` 隔离旧版（旧版节点类名包含新版选择器）；`paintComponents` 命中时顺带加 `.ze-typed` 类与 `--ze-type-color` 变量（单一事实源）；所有新版节点统一精修——1px 中性灰实线描边（`#c0c4cc`，原生是 2px 白色占位边框）+ 8px 圆角 + 轻投影，常驻实线顺带压掉应用原生 hover 的虚线边框，命中类型节点由 ze-typed 块把描边色换成 color-mix 同色深一阶；连线只把静止灰线（`:not` 排除 active/success/error/abnormal/async——应用状态类词表快照，应用加新状态类须回来补，否则新状态线会被压平成实线）的虚线改实线（粗细、颜色刻意都保持原生——stroke 与 stroke-width 由应用按状态控制，覆盖会压掉变色；success 绿虚线是日志回放动画，绝不能碰），端点（`.butterflie-circle-endpoint`，原生 8px 透明 div 挂 wrapper 下）显形为白底灰圈圆点（纯 CSS 改观感不碰坐标，连线数据零影响），入边箭头（`.jvs-rule-node.ef-node-container:not(.jtk-droppable) .top-endpoint`，应用渲染在节点顶部的 border 实心三角，原生 8宽×8高浅灰不起眼——12px 是含底部透明 border 的盒高）加大加深为 14×12 `#909399`，尖角钉在节点顶边不扎进节点（top = 负的三角高，left 补偿值 = 加大后左右 border 一半保持居中；原生扎进节点 4px 的位置被用户否决；细杆 + V 形尖角方案试过被用户否决，勿改回），Butterfly 类名与旧版 jsPlumber 天然隔离。教训：给 `.jvs-rule-node` 本体加任何定位都会激活 inline 里的画布坐标冗余导致节点飞偏；变高（`height: auto`）会让 Butterfly 锚点按节点渲染高算出线点，连线错位约 20px 且污染保存的 `breakPoints`（后端按 36px 固定模型渲染）——框高不可动
- **应用中心星标**：`highlightApps()` 往 `.application` 卡片右上角注入星标按钮（`.ze-star-btn`，不走 `createButton`——其皮肤类与星标透明形态冲突）并切换 `.ze-marked` 类，视觉全由 JVS_STYLES 承担——`.application:has(.ze-star-btn)` 提供卡片定位与透明占位边框（防抖动）、`:has(.ze-star-btn.ze-marked)` 特异性更高只覆盖 `border-color` 为金色（`#FAAD14`）；按钮平时 `opacity: 0`、悬停卡片浮现、点击切换标记并立即刷新该卡片（不等 400ms 轮询）；标记按应用名存 localStorage `HIGHLIGHT_APPS`，渲染与点击均现读存储（多标签页同开不互相覆盖），实心星由 CSS 覆盖 SVG 的 `fill="none"` 属性实现（fill 与 stroke 都走 `currentColor` 跟随按钮 color）
- **只看星标过滤**：`filterStarredApps()` 注入「★ 只看星标」pill 开关（`.ze-star-filter-btn`）与空态提示元素——新版钉 `.app-page` 顶部，旧版按钮插进 `.filter-bar` 筛选行（全部分类 + 搜索框）搜索框右侧、对齐与间距交给该行 flex 的 `align-items/gap`（CSS 清掉钉顶 margin）；按钮与提示分别判重注入——旧版筛选行是静态标记挂载即渲染，卡片列表由异步数据 v-for 晚于筛选行出现，提示须等第一张卡出现后插进其父级（卡片流开头），卡片没出来就等下一个 tick（往容器 prepend 会把提示顶到筛选行上方，曾致此 bug）；JS 只产出 `body.ze-star-filter-on` 这一个事实——非星标卡片隐藏、无星标部门组整组隐藏（连标题，仅新版有分组）、空态提示全由 CSS `:has()` 驱动，按钮激活金色也由 body class 派生（无第二事实源）；开关状态存 localStorage `STARRED_FILTER`（布尔，现读同步，多标签页自动一致），点击立即生效不等轮询；离开应用中心（`.app-page` 与旧版 `.jvs-layout-tempOpen > .template-content-box` 都查不到）时清理 body class，开关按钮随 SPA DOM 销毁
- **应用中心地址栏同步**：新版应用中心不写 hash、地址栏停留在进站前路由，`syncAppCenterUrl()` 在 `.app-page` 显示且 hash 非 `#/wel/index` 时用 `history.replaceState` 统一替换——不触发 hashchange/vue-router、页面不动，刷新后 `enterAppCenter()` 的 `wel/index` 自动点击得以衔接；轮询幂等（条件不满足即 return），点进具体应用后 `.app-page` 随路由销毁、不再误覆盖；旧版容器不是 `.app-page`，天然不处理
- **应用中心侧边栏收起**：`toggleAppCenterSidebar()` 往 `.sidebar-col`（分类侧边栏，办公室/教务处/…）父级容器注入 «/» 浮动开关（`.ze-side-toggle-btn`，fixed 白色圆角方块，仿应用内样式）——展开态 left 由 JS 按 `sidebar.getBoundingClientRect().right - 16` 每 tick 校准（骑在侧边栏右缘、距底 48px），收起态侧边栏 `display:none` 后 rect 归零不可读，left 直接取 6px 贴左缘；与 filterStarredApps 同一范式：JS 只产出 `body.ze-appcenter-side-collapsed`，分类列与其右侧空白间隔列隐藏、卡片区（`.sidebar-col + .el-col + .el-col`）拉满、`.app-page` 归位（站点自带 `margin-left: -128px` 跨列偏移，侧边栏没了会推出屏幕外）全由 CSS 驱动；状态存 localStorage `APPCENTER_SIDEBAR`（刷新保持），按钮随宿主容器在 SPA 路由切换时销毁，离开时清 body class；选择器通用化——Formal mode 等同带 `.sidebar-col` 的列表页自动生效，旧版（jyy-dev）是否有此类名未实测
- **日志按钮模式换色**：日志按钮与拖拽把手共享仿应用内 Element plain 蓝样式（白底、蓝字 `#409EFF`、边 `#B3D8FF`，hover 只动底色与边框，无常驻阴影）；把手图标为十字箭头 SVG（`MOVE_SVG`，stroke 走 currentColor 跟随按钮字色）；带模式时整钮按 `data-mode` 纯 CSS 换色（测试=绿 plain、正式=红 plain，开发/无模式用默认蓝），文案由 `getLogButtonName()` 产出——模式前缀与「日志」同字号同色、6px 间距替代全角「｜」（前缀缩字号、黑色前缀两个方案已被用户否决，勿改回）；模式变化走容器 remove+重建（`updateLogButtonOperation` 键对比），不播 transition；日志表格行色仍走 `getModeColor` 关键字色板，与按钮 CSS 色板并存待统一
- **设置栏按钮间距**：`.el-form-item.form-btn-bar .el-form-item__content > button.el-button:last-of-type`（被调用逻辑设置栏「结构定义」按钮）`margin-left: 22px !important` 盖过应用 inline 写死的 10px——纯间距微调，不碰颜色与功能；「测试」按钮外包两层 span、在其 span 父级里也是 last-of-type（须 `>` 限定 content 直接子级摘出去），且在自己盒内 margin-left 10px 溢出 span 右侧、会吃掉相邻间距——实测 22px 视觉缝才追平左缝（10px）

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

测试：`node --test tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs tests/jvs.paint.test.mjs tests/jvs.tabtype.test.mjs tests/jvs.styles.test.mjs tests/jvs.log-button.test.mjs tests/jvs.highlight.test.mjs tests/jvs.appcenter-url.test.mjs tests/jvs.sidebar-toggle.test.mjs` 覆盖调度器契约、存储域规则（过期剪切、去重、目录幂等写入）、组件上色机制（含 ze-typed 类与颜色变量）、设计器类型判定、旧版节点展开名称样式、新版节点文字溢出显示与 ze-typed 精修、星标与只看星标过滤的存储联动、应用中心地址栏同步的新旧版边界、应用中心侧边栏收起的存储联动、全局按钮 plain 蓝与模式换色色板、日志按钮文案契约。
