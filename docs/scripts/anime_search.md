# anime_search.user.js 架构

- **SPA 换页不补挂**：一次性执行，站内换页后按钮不补挂——用户决策：刷新页面即可，不为该场景加轮询。
- **标题提取不做正则剥字**：防误剥标题原文；自挂按钮不进标题（提取跳过 button 子树）。
- **选择器失效史**：B 站 2026-08 改版后 `#__next` 6 层 div 旧选择器已失效，现用媒体信息区标题链接的 class 前缀匹配。
- **图标钮与文字钮中线对齐**：基线不同（img 底边 vs 文字基线），须 `verticalAlign: 'middle'`。

验证：`node --test tests/anime_search.test.mjs`。
