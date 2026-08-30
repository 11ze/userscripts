# age-video-download.user.js 架构

按「按钮挂载 → 剪贴板传名 → 自动下载」组织，`main()` 每 1000ms 轮询：

- **闩锁**：`hasButton`（按钮挂过不再挂）与 `isCopied`（下载触发过不再触发）两个模块级布尔控制轮询幂等
- **按钮挂载**：播放页 `div.body_content_wrapper h5` 标题旁挂 📺 按钮，点击时拼「视频名（剥 emoji）+ 正在播放集数」写入剪贴板，再 `window.open(iframe.src)` 打开新标签页
- **剪贴板跨页传名**：两个页面是独立的，文件名靠剪贴板传递——按钮页写入，新标签页轮询到 `<video>` 后 `clipboard.readText()` 读出，作为 `<a download>` 的文件名触发自动下载，顺带写入 `document.title`
- **已知问题**：按钮用 `newTabButton.class =` 赋类名无效（应为 `className`），按钮实际无样式类，改动会有视觉变化故暂留

测试：无。验证方式：agedm 播放页装脚本，点 📺 后观察新标签页自动下载、文件名与标题为剪贴板内容。
