# 渐进披露重构 CLAUDE.md / AGENTS.md

日期：2026-08-18。来源：$11ze-clean-agents-md skill。

## 用户决策

- 浏览器门槛声明：Chromium 100+ → **Chromium 120+**（对齐代码实际使用的 `:has()` 与 CSS nesting）
- 文件结构：**保持 CLAUDE.md 为主体、AGENTS.md 符号链接指向它**（git 两者均在跟踪）

## 拆分映射

| 原段落 | 去向 |
|---|---|
| 项目概览 | root CLAUDE.md 压缩为一句话 + 硬约束速览 |
| 脚本头部规范 | docs/userscript-conventions.md |
| JVS / url_viewer / anime_search / color_mode_switch 架构 | docs/scripts/{jvs,url_viewer,anime_search,color_mode_switch}.md |
| 代码规范（事件处理/性能优化/代码质量/UI 组件/z-index） | docs/userscript-conventions.md（性能优化与代码质量两节去重合并） |
| UI/UX 设计规范 | docs/design.md |
| 发布流程 | docs/release.md |
| 注意事项 | 按条拆入 root（脚本独立、严格模式、版本规则）与 conventions（icon data URI、浏览器门槛） |

## 顺带修正（文档与代码不符）

- z-index 章节 `toastZIndex` 递增示例：代码已无此逻辑（现状为日志弹窗固定 9998），改写为现状 + 原则一句
- 主题色系统：`#3b82f6` 系列仅存在于 url_viewer，标注归属
- 「使用 STYLES 常量」命名不一：表述统一为「样式常量（COLORS / STYLES）」
- 「性能优化」与「代码质量」中重复的「优先使用 CSS」条目合并

## 不动项

- AGENTS.md 符号链接、既有内容措辞（仅迁移，除上述修正外不改写）
- 各脚本架构段内的测试命令与钩子说明随架构文件走
