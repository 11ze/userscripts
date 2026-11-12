# AGE 动漫优化设计稿

统一入口为 `index.html`（屏蔽与评分），通过顶部导航切换到 `search.html`（搜索按钮）。两类场景共用本目录资源与设计记录。

页面参考：[AGE 一周更新](https://www.agedm.io/update)，2026-10-31 获取。`site-reference.html` 保存原站导航和前两组更新列表。`assets/` 保存这部分使用的海报、标志、原站 Bootstrap、Bootstrap Icons 和 main.css；字体地址改为本地路径。原站脚本、登录和导航行为不运行。原站区域使用 iframe，与脚本组件的样式隔离。

设计范围：屏蔽按钮、名单管理、确认框、评分框、提示。名单面板仅保留标题、数量、启用状态和操作，不添加页面标签或开关说明。右上角“屏”按钮切换面板显示与隐藏。名单面板为非模态浮层，不锁定网站滚动；鼠标在名单内滚动名单，在网站区域滚动网站。确认框和评分框仍为模态弹窗。脚本行为参考 `src/agedm.user.js` 的 `buildPanel`、`showDialog`、`renderRatingChoice` 和 `renderManualRating`。不修改 AGE 原站页面样式。定稿已应用到 `src/agedm.user.js`（0.2.8）。脚本保留原来的评分归一化与存储行为；手动评分仍按原逻辑四舍五入到一位小数。

卡片上的 × 使用对称 SVG 路径和 grid 居中。避免文本字形在行框内偏移。按钮沿用原脚本的 22px 大小和右上角 4px 间距。评分仅演示反馈；名单仅保存在页面内存，刷新后重置。

## 预览与验证

在仓库目录执行 `python3 -m http.server 4312 --bind 127.0.0.1 --directory designs`，打开 `http://localhost:4312/agedm/`。

1. 连续点击右上角“屏”按钮，检查面板依次显示、隐藏、再次显示；关闭后重新打开应保留名单和启用状态。聚焦或悬停卡片的屏蔽按钮，检查 × 位置；点击后先取消，再确认。确认后对应卡片隐藏。
2. 打开名单，停用屏蔽，检查隐藏卡片恢复；重新启用后再次隐藏。移出名单后恢复卡片。取消清空应保留名单，确认清空应显示空状态。
3. 导出名单后重新导入，检查去重；导入 JSON 对象应显示错误。此项需手动验证。
4. 打开评分框，手动改分。空值、11、9.45 应被拒绝；9.4 应关闭弹窗并提示。检查返回及其他记录选项。
5. 面板打开时，鼠标在网站区域滚动，网站应移动且面板位置不变；鼠标在名单内滚动时仅名单移动。名单到达边界不将滚动传给网站。二层确认框按 Esc 仅关闭确认框，名单仍保留；再次按 Esc 关闭名单。

## 像素中心回归检查

`verify-alignment.py` 读取真实截图，不检查 CSS 字符串。依赖本机 Pillow。传入按钮周围的小矩形，区域内只能有一个红色按钮：

```sh
python3 designs/agedm/verify-alignment.py /path/to/screenshot.png left top right bottom
```

检查红色圆形与内部白色交叉线的可见像素中心，允许 0.5px 栅格误差。空区域和无交叉线会失败。旧版文本按钮截图检查失败（纵向偏差 1.5px）；新版 SVG 截图检查通过（横纵偏差均 0px）。

原站 CSS 来源为页面 head 中的三个 stylesheet：Bootstrap、Bootstrap Icons、`https://cdn.xmfxgjzx.com/age/statics/css/main.css?v=2026082402`。本地快照用于设计预览，不发布。

## 脚本验证

执行 `node --test tests/agedm.test.mjs`。入口连续切换、无名单遮罩与背景滚动锁、开关可访问状态、名单移出后的数量刷新，以及图形按钮的名称隔离均有测试。原站页面快照中还需验证滚轮分别作用于网站和名单，按钮的 SVG 与圆形按钮中心一致。此稿对应合并前 0.2.8 的名单与评分外观；当前脚本为 0.3.0，搜索按钮见同目录 `search.html`。

## 搜索按钮场景

已选定 A「紧凑图标」。设计稿只保留该方案，所有站点共用样式，无外部设计系统。图标沿用脚本现有 SVG / favicon，详情保留文字。

参考：`src/agedm.user.js` 的现有操作与颜色，以及用户提供的页面：

- https://www.agedm.io/detail/20260139
- https://www.agedm.io/play/20260139/1/1
- https://www.bilibili.com/bangumi/play/ep173287

标题来自页面 HTML；AGE 字体取自站点 main.css，B 站标题字号和行高取自 mediainfo_mediaTitle 样式。场景为重绘片段，未复制整站；图标字标是占位，实施时沿用原 favicon。所选方案将操作放在标题下方，避免长标题与按钮挤在同一行。

## 重复验证

在仓库运行 `python3 -m http.server 4312 --directory designs`，打开 http://localhost:4312/agedm/search.html 。

- 画板有 AGE 详情、AGE 播放、B 站三个场景。
- AGE 详情有 3 个操作，播放有 4 个，B 站有 2 个。
- 点击画板右上角 Focus 放大；Esc 返回。
- A 按钮悬停或键盘聚焦显示用途；所有操作均有焦点轮廓。
- 搜索链接携带完整标题；详情仅在 AGE 播放场景出现。
- 检查 320px 容器内按钮是否溢出。

视觉稿以浏览器检查为准；脚本修改按 Red → Green 执行，运行 `node --test tests/agedm.test.mjs`。React、ReactDOM、Babel 为固定版本本地副本，画布来自 baoyu-design starter。Babel 的浏览器编译提示适用于原型，正式脚本不引入这些库。
