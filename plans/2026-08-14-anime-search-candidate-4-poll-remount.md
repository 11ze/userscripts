# anime_search 候选 4：SPA 换页后按钮补挂（轮询执行模式）

> 状态：已撤销 · 2026-08-14 · 出自 architecture-review-20260814-165829.html 的候选 4

## 撤销记录

实施后用户实测 B 站换番按钮仍未出现（2026-08-14），判断为 React 路由切换复用标题 `<a>` 元素：标题元素上的 `data-11ze-search` 标记被保留，appendChild 注入的按钮被 React 重渲染清除，tick 见标记即跳过——死锁。未继续验证该假设，用户拍板：**接受「换番后刷新页面」的使用方式，避免代码变复杂**。轮询补挂（mountButtons/setInterval/标记/beforeunload 及配套测试桩）整体回退，回到候选 3 的一次性挂载；版本仍为未发布的 0.6.12。

## 触发

用户实测 0.6.12（2026-08-14）：B 站播放页点右侧列表切到其他动漫，按钮消失——SPA 站内路由不刷新页面，脚本不重跑，旧按钮随 DOM 重建消失。首次挂载已由候选 3 期间的选择器修复验证可用。

## 决策记录

| 决策 | 结论 | 依据 |
|------|------|------|
| 触发方式 | `setInterval` 400ms 轮询 | AGENTS.md 架构模式 #2；jvs `CONFIG.TIMER_INTERVAL` 同款约定；不整搬 createOperationRunner（脚本体量不需要） |
| 幂等 | 挂载过的标题元素 `setAttribute('data-11ze-search', '1')`，tick 见标记跳过 | CLAUDE.md 代码规范「状态标记：getAttribute/setAttribute 避免重复操作」 |
| 首次挂载 | 与补挂走同一 tick 函数（立即执行一次 + setInterval） | 统一路径，消除双份逻辑 |
| 资源清理 | `beforeunload` 清 interval | CLAUDE.md 代码规范「资源清理」 |
| age.tv | **不纳入**闸门 | 用户拍板「原有的功能不变就行」；0.6.11 起就未覆盖（hostname 不含 agedm/agefans），维持 parity |
| 版本号 | 并入 0.6.12（用户尚未上传 OpenUserJS；若已上传则改 0.6.13 重发） | Q6 攒批发版 |

## 改动清单

1. `src/anime_search.user.js`：主循环提取为 `mountButtons()`（选择器命中 → 未标记 → 提取标题 → 挂一对 → 打标）；立即执行 + `setInterval(mountButtons, 400)`；`beforeunload` 清理
2. `tests/anime_search.test.mjs`：新增「轮询补挂」组——首次执行即挂载、已标记元素不重复挂、SPA 换页（新元素）后重挂、interval 参数与清理注册
3. `CLAUDE.md`：anime_search 小节补「轮询补挂」

## 测试用例

- 首次执行（脚本载入）即挂载一对按钮
- 标题元素已打标时，再 tick 不追加按钮（幂等）
- `document.querySelector` 返回新元素（模拟 SPA 换页重建）后，tick 重新挂载
- `setInterval` 以 400ms 注册，`beforeunload` 上注册了清理

## 验证方案

1. `node --test tests/anime_search.test.mjs`（含既有全量）
2. Tampermonkey 实测：B 站播放页点右侧列表换番 → 新页面标题旁按钮在 400ms 内重新出现；同页停留不重复增按钮
3. AGE / 豆瓣 MPA 行为不变（整页刷新脚本重跑，轮询仅多一次幂等跳过）

## 不做什么

- 不搬 jvs `createOperationRunner` 的 probe/apply 指纹机制（单 operation 场景，标记即指纹）
- 不改选择器表、`detectSite`、`extractTitle`
- 不纳入 age.tv（用户已拍板）
