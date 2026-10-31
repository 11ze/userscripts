# url_viewer.user.js 架构

- **段模型驱动编辑**：parseUrl 产出的段列表活过整个编辑会话，DOM 只是视图——渲染时建 `{ cell, span, param, input }` 绑定数组，模型定位 DOM，无 dataset 约定（曾有 5 处 dataset 字符串约定耦合三个函数，v0.4.4 前科）。
- **基底地址快照**：buildUrl 的 baseUrl 取打开弹窗那一刻的原始 href，点「确定」时不读地址栏——弹窗开着期间页面地址被别处改动的场景以快照为准。
- **重建是归一化**：buildUrl 走 URLSearchParams 序列化（空格变 `+`、`?` 编码为 `%3F`），不是逐字节还原；往返性质 `parseUrl(buildUrl(...))` 等于原段列表，不是重建串等于原串。hash 段 host 部分含未编码字符（如空格）时 `url.hash` 赋值同样会百分号编码——即使无编辑点「确定」也可能得到字节级不同的地址并触发一次刷新；后果仅此，不为它写防御。
- **无参数 hash 段必须保留**：v0.4.4 前按表格重建会把无参数段静默丢掉（如 `a.com#frag#b?x=1` 确定后丢 `#frag`），现按段列表全量重建，测试锁回归。
- **decode 时机**：打开时对整串 decodeURIComponent 一次，parseUrl 与顶部完整 URL 显示共用——分段依赖参数里编码的 `%23` 炸开成段。SPA 经 pushState 写入的 URL 可含裸 `%`，decode 抛 URIError——包 try/catch 回退原串（v0.4.6 前科：弹窗打不开且 Ctrl+U 已吞掉原生查看源代码，双重失效）。
- **编辑能力边界**：UI 只能改参数值，不能增删行、不能改键——段列表形状在会话内稳定；编辑值点「确定」才采纳进模型，「取消」直接按模型重渲染。
- **导航决策**：`location.href` 赋值是异步导航，跨文档跳转后紧跟 reload 会取消跳转（v0.4.3 教训）；只有 same-document 导航需补 reload。
- **开关收口**：openViewer/closeViewer 一对函数管 popup 生命周期——两个入口（菜单 / Ctrl+U）、三条关路径（关闭钮 / 点外部 / Ctrl+U）全走它；open 幂等（已开先关）、close 成对摘除 document click 监听器。新增关路径不得绕开 closeViewer 裸 remove（v0.4.5 前三条路径只有点外部摘监听器，其余空转到下次任意点击）。
- **弹窗样式自带 text-align: left**（v0.5.0）：站点页面样式会透进弹窗（example.com 居中排版实测把参数行挤到居中），旧实现靠 host/table 上零散的 textAlign 抵抗，现在弹窗根上一处兜底。
- **键/值 hover 分离与提示显隐全走 CSS 类**（v0.5.0）：`.pv-key-cell` / `.pv-val-cell` 各有 hover 底色与前景色；`:hover` 不得写成内联样式，**hint 元素的默认 `opacity: 0` 也必须在 GM_addStyle 里**——内联 opacity 会压死 hover 规则（内联样式只输给 `!important`）。「复制值」提示 span 挂在值 span 内部：编辑模式 `replaceWith(input)` 连带移除、取消重建 span 时一并恢复，提示没有残留盖住输入框的路径。编辑态弹窗挂 `.editing` 类，门控编辑态不出现查看态 hover 底色。
- **段序号徽标只在多段时渲染**（v0.5.0）：单段弹窗的序号没有信息量，多段（iframe 嵌套）场景才需要序号标层级。

验证：`node --test tests/url_viewer.url.test.mjs tests/url_viewer.popup.test.mjs`。UI 定稿设计稿：`designs/url-viewer/`（方向 C 极简，四方向对比稿已删减到只留定稿）。
