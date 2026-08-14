# CONTEXT.md

领域词汇表。架构评审（/improve-codebase-architecture）与深化讨论使用这里的名字，新概念在定名时补进来。

## anime_search

- **站点判定（detectSite）**：由 hostname + pathname 推出当前页面所属站点（`'age' | 'douban' | 'bilibili' | null`）。query 参数不参与判定；`null` 即早退。入口闸门与 AGE 页面清理 CSS 共用这一个答案。
- **标题提取（extractTitle）**：从站点标题元素取出干净的番剧名——span 优先回退 textContent、剥离自挂按钮的 🔍🏆、再做译名去重。
- **译名去重（uniqueText）**：豆瓣标题里「原名称 译名」并列时只留前者的启发式——按空格分词后，从首个与首词同首字的词处截断。
