# color_mode_switch.user.js 架构

- **iframe 闸门**：`@noframes` 只在顶层 frame 运行，跨 frame 写同一存储键的失步问题随之消除。
- **存储异常语义**：读异常出关闭、写异常返回 false，toggle 写失败即短路——内存态、存储态、视觉态三方一致。
- **CSS filter 约束**：子树无法脱离整页反转，媒体与自挂按钮只能二次反转抵消。

验证：`node --test tests/color_mode_switch.test.mjs`。
