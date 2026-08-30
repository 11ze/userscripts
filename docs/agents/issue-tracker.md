# Issue tracker: 本地 markdown

本仓库的议题与规格以 markdown 文件形式存放在 `.scratch/` 下。

## 约定

- 一个功能一个目录：`.scratch/<feature-slug>/`
- 规格文件：`.scratch/<feature-slug>/spec.md`
- 实现议题每票一个文件：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 起编号，绝不合并成单个 tickets 文件
- 分诊状态记录在议题文件顶部的 `Status:` 行（角色字符串见 [triage-labels.md](triage-labels.md)）
- 评论与讨论历史追加到文件底部的 `## Comments` 标题下

## 当技能说「发布到 issue tracker」

在 `.scratch/<feature-slug>/` 下新建文件（目录不存在则创建）。

## 当技能说「取相关票据」

读取被引用路径的文件。用户通常会直接给出路径或议题编号。

## Wayfinder 操作

供 `/wayfinder` 使用。**地图（map）**是一个文件，每张**子票**一个文件。

- **Map**：`.scratch/<effort>/map.md`（Notes / Decisions-so-far / Fog 正文）。
- **子票**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 编号，正文写问题。`Type:` 行记录票型（`research`/`prototype`/`grilling`/`task`）；`Status:` 行记录 `claimed`/`resolved`。
- **阻塞**：顶部一行 `Blocked by: NN, NN`。所列文件全部 `resolved` 才算解除阻塞。
- **前沿（Frontier）**：扫 `.scratch/<effort>/issues/`，取开放、无阻塞、未认领的文件，编号最小者胜。
- **认领**：开工前先写 `Status: claimed` 并保存。
- **解决**：在 `## Answer` 标题下追加答案，置 `Status: resolved`，再把上下文指针（gist + 链接）追加到 `map.md` 的 Decisions-so-far。
