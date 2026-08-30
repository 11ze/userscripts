# CONTEXT.md

领域词汇表（术语名 + 一句话）。技能输出命名时用这里的术语；机制细节看 `docs/scripts/<script>.md`，新概念定名时补进来。

## anime_search

- **站点判定（detectSite）**：由 hostname + pathname 推出所属站点，`null` 即早退。
- **标题提取（extractTitle）**：从站点标题元素取出干净番剧名，剥离自挂按钮 emoji。
- **译名去重（uniqueText）**：豆瓣「原名称 译名」并列只留前者的启发式。

## color_mode_switch

- **反转色模式（reverse color mode）**：整页 `filter: invert(1) hue-rotate(180deg)`，媒体与自挂按钮二次反转抵消。
- **状态存取（readState/writeState）**：注入式存储端口，异常时读出关闭、写返回 false。
- **反转样式表（buildReverseColorCss）**：纯函数生成的反色 CSS，样式变更只改这一处。

## jvs

- **环境检测（isJVS）**：按页面 link 标签判定是否 JVS 站点，非 JVS 早退。
- **新旧双版**：新版（qicong-edf）与旧版（jyy-dev）两套 DOM 并存，改动须两版兼顾。
- **操作队列（operations）**：`createOperationRunner` 每 400ms 调度的混合数组，probe 键控跳过无变化 tick。
- **设计器类型（getTabType）**：逻辑/列表/表单/流程四类，须设计器头部与页签文本同时满足。
- **星标（highlightApps）**：应用卡片右上角星标按钮，标记按应用名存 localStorage。
- **只看星标过滤（filterStarredApps）**：JS 只产出 body class，卡片显隐全由 CSS `:has()` 驱动的 pill 开关。
- **地址栏同步（syncAppCenterUrl）**：应用中心用 `replaceState` 把地址栏统一到 `#/wel/index`。
- **侧边栏收起（toggleAppCenterSidebar）**：body class 驱动分类侧边栏隐藏、卡片区拉满。
- **画布滚轮平移（canvasScrollOperation）**：wheel 走 Butterfly `canvas.move`，画布重建带回平移、切换画布清记录不重放。
