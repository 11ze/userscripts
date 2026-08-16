# CONTEXT.md

领域词汇表。架构评审（/improve-codebase-architecture）与深化讨论使用这里的名字，新概念在定名时补进来。

## anime_search

- **站点判定（detectSite）**：由 hostname + pathname 推出当前页面所属站点（`'age' | 'douban' | 'bilibili' | null`）。query 参数不参与判定；`null` 即早退。入口闸门与 AGE 页面清理 CSS 共用这一个答案。
- **标题提取（extractTitle）**：从站点标题元素取出干净的番剧名——span 优先回退 textContent、剥离自挂按钮的 🔍🏆、再做译名去重。
- **译名去重（uniqueText）**：豆瓣标题里「原名称 译名」并列时只留前者的启发式——按空格分词后，从首个与首词同首字的词处截断。

## color_mode_switch

- **反转色模式（reverse color mode）**：往页面注入 `filter: invert(1) hue-rotate(180deg)` 样式表的整页反色方案；媒体元素与自挂按钮容器二次反转抵消，`.reverse-color-mode-ignore` 与 `[data-theme]` / `[data-color-mode]` 元素仅清除自身 filter（CSS filter 下子树无法脱离整页反转）。状态按站点存入 localStorage，只在顶层 frame 运行（`@noframes`）。
- **状态存取（readState(storage) / writeState(storage, reverseColorMode)）**：注入式存储端口——storage 由调用方传入，异常时读出关闭、写返回 false；toggle 写失败即短路，内存态、存储态、视觉态三方一致。
- **反转样式表（buildReverseColorCss）**：纯函数生成的反色 CSS——整页反转 + 媒体/自挂按钮二次反转抵消 + 逃生舱规则；样式变更只改这一处。
