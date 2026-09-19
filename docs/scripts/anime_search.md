# anime_search.user.js 架构

按「站点判定 → 标题提取 → 按钮挂载」组织：

- **站点判定**：`detectSite(href)` 用 hostname + pathname 推出所属站点（`'age' | 'douban' | 'bilibili' | null`），query 不参与判定，`null` 即早退；入口闸门与 AGE 页面清理 CSS 共用这一个答案
- **标题提取**：`extractTitle(el)` 吸收 span→元素文本回退、`uniqueText` 译名去重（豆瓣「原名称 译名」并列时，按空格分词后从首个与首词同首字的词处截断）；回退路径走 `collectText(node)` 递归收集文本并跳过 button 子树——自挂按钮不进标题，也不做正则剥字（防误剥标题原文）
- **按钮渲染**：`createButton(content, onClick)` 统一按钮脚手架（样式/hover/文字与 img 内容分派）；`createSearchButton(content, target, title)` 与 `createDetailButton(href)` 在其上薄封装导航策略（新标签页打开 `target + title` / 当前页跳转）；`createButtonPair(title)` 一对跨站搜索按钮（🔍 聚合搜索 / 豆瓣 favicon 图标，`createFaviconImg` 造 14x14、alt 留空的 img——尺寸与按钮字号共用单一 `fontSize` 常量，图标钮与文字钮同高），内部走 `COLORS`/`setStyles`/`setHover`/`createEl` 最小工具集（自 url_viewer 复制）；`BUTTON_STYLES` 带 `verticalAlign: 'middle'`，图标钮（基线是 img 底边）与文字钮（基线是文字基线）不按默认基线对齐而是中线对齐；主循环命中首个选择器挂按钮组即止——一次性执行，SPA 站内换页后按钮不补挂（用户决策：刷新页面即可，不为该场景加轮询）
- **站内搜索**：AGE 站挂载点在搜索按钮对后追加站内搜索钮，`createAgeSearchButton(origin, title)` 图标取当前镜像域 `/favicon.ico`、跳转 `${origin}/search?query=标题`，域自适应
- **详情跳转**：AGE play 页挂载点在按钮组末尾追加「详情」按钮，`buildDetailHref(pathname, origin)` 从 `/play/{id}/...` 提取番剧 id 拼站内 `/detail/{id}`，当前标签页跳转；origin 随当前站点拼接，AGE 镜像域自适应
- **选择器适配**：B 站挂载点是媒体信息区标题链接 `a[class*='mediainfo_mediaTitle']`（class 前缀匹配，2026-08 改版后 `#__next` 6 层 div 旧选择器已失效）

测试：`node --test tests/anime_search.test.mjs` 覆盖站点判定（含 query 泄漏回归）、标题提取、按钮渲染、站内搜索、详情跳转与挂载循环。
