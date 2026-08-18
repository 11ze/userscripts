# color_mode_switch.user.js 架构

按「状态存取 → 反转样式表 → 按钮渲染」组织：

- **iframe 闸门**：头部 `@noframes` 声明只在顶层 frame 运行（对齐 jvs/url_viewer 惯例），iframe 内不再重复注入按钮与反转滤镜，跨 frame 写同一存储键的失步问题随之消除
- **状态存取**：`readState(storage)` / `writeState(storage, reverseColorMode)` 注入式存储端口——storage 由调用方传入，异常（隐私模式 SecurityError / 配额 QuotaExceeded）时读出关闭、写返回 false；`toggleReverseColorMode` 写失败即短路，内存态、存储态、视觉态三方一致
- **反转样式表**：`buildReverseColorCss()` 纯函数生成——整页 `invert(1) hue-rotate(180deg)`、媒体与自挂按钮容器二次反转抵消、`.reverse-color-mode-ignore` / `[data-theme]` / `[data-color-mode]` 仅清除自身 filter（CSS filter 下子树无法脱离整页反转）
- **按钮渲染**：`STYLES` 常量 + `setStyles` / `setHover` / `createEl` 最小工具集（自 anime_search 复制）；按钮显隐走闭包元素引用 `toggleButtonElement`，不回查 DOM

测试：`node --test tests/color_mode_switch.test.mjs` 覆盖状态存取（含隐私模式读异常、配额写异常回归）、反转样式表（含死规则与按钮自反回归）、元数据（`@noframes`、`@description` 单条含日期）与按钮挂载/显隐/交互。
