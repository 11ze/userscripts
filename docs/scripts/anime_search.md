# anime_search.user.js 架构

按「站点判定 → 标题提取 → 按钮挂载」组织：

- **站点判定**：`detectSite(href)` 用 hostname + pathname 推出所属站点（`'age' | 'douban' | 'bilibili' | null`），query 不参与判定，`null` 即早退；入口闸门与 AGE 页面清理 CSS 共用这一个答案
- **标题提取**：`extractTitle(el)` 吸收 span→textContent 回退、自挂按钮 emoji（🔍🏆ℹ️）剥离、`uniqueText` 译名去重（豆瓣「原名称 译名」并列时，按空格分词后从首个与首词同首字的词处截断）
- **按钮渲染**：`createButtonPair(title)` 一对跨站搜索按钮（🔍 聚合搜索 / 🏆 豆瓣），内部走 `COLORS`/`setStyles`/`setHover`/`createEl` 最小工具集（自 url_viewer 复制）；主循环命中首个选择器挂一对按钮即止——一次性执行，SPA 站内换页后按钮不补挂（用户决策：刷新页面即可，不为该场景加轮询）
- **详情跳转**：AGE play 页挂载点在搜索按钮对后追加 ℹ️ 按钮，`buildDetailHref(pathname, origin)` 从 `/play/{id}/...` 提取番剧 id 拼站内 `/detail/{id}`，当前标签页跳转；origin 随当前站点拼接，AGE 镜像域自适应
- **选择器适配**：B 站挂载点是媒体信息区标题链接 `a[class*='mediainfo_mediaTitle']`（class 前缀匹配，2026-08 改版后 `#__next` 6 层 div 旧选择器已失效）

测试：`node --test tests/anime_search.test.mjs` 覆盖站点判定（含 query 泄漏回归）、标题提取、按钮渲染、详情跳转与挂载循环。
