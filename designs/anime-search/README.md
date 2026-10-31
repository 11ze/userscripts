# 搜索动漫按钮方案

已选定 A「紧凑图标」。设计稿只保留该方案，所有站点共用样式，无外部设计系统。图标沿用脚本现有 SVG / favicon，详情保留文字。

参考：`src/anime_search.user.js` 的现有操作与颜色，以及用户提供的页面：

- https://www.agedm.io/detail/20260139
- https://www.agedm.io/play/20260139/1/1
- https://www.bilibili.com/bangumi/play/ep173287

标题来自页面 HTML；AGE 字体取自站点 main.css，B 站标题字号和行高取自 mediainfo_mediaTitle 样式。场景为重绘片段，未复制整站；图标字标是占位，实施时沿用原 favicon。所选方案将操作放在标题下方，避免长标题与按钮挤在同一行。

## 重复验证

在仓库运行 `python3 -m http.server 4312 --directory designs`，打开 http://localhost:4312/anime-search/index.html 。

- 画板有 AGE 详情、AGE 播放、B 站三个场景。
- AGE 详情有 3 个操作，播放有 4 个，B 站有 2 个。
- 点击画板右上角 Focus 放大；Esc 返回。
- A 按钮悬停或键盘聚焦显示用途；所有操作均有焦点轮廓。
- 搜索链接携带完整标题；详情仅在 AGE 播放场景出现。
- 检查 320px 容器内按钮是否溢出。

视觉稿以浏览器检查为准；脚本修改按 Red → Green 执行，运行 `node --test tests/anime_search.test.mjs`。React、ReactDOM、Babel 为固定版本本地副本，画布来自 baoyu-design starter。Babel 的浏览器编译提示适用于原型，正式脚本不引入这些库。
