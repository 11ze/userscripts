# url_viewer.user.js 架构

URL 解析采用结构化模型：

- **解析模型**：`parseUrl` 返回 `[{host, params: [{key, value}]}]`，段内取第一个 `?` 之后的全部作为查询串（参数值里的 `?` 不截断），渲染循环直接按结构遍历，重复参数键保留多行
- **解码顺序**：先对整串 `decodeURIComponent` 再按 `#` 分段——让参数里编码的 # 炸开成独立段，iframe 嵌套路由才能分节展示
- **编辑路径**：以 DOM 为数据模型（`dataset.hashIndex`/`hashHost`/`paramKey`），重建 URL 时主 URL 与 hash 段都用 `URLSearchParams.append` 保留重复键

测试：`node --test tests/url_viewer.url.test.mjs` 覆盖 URL 解析行为。
