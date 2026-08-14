# anime_search 候选 1+2：标题提取深模块 + 站点判定收敛

> 状态：已完成 · 2026-08-14 · 出自 architecture-review-20260814-165829.html 的候选 1、候选 2

## 决策记录（grilling 定稿）

| 决策 | 结论 |
|------|------|
| Q1 接口形状 | 双函数进钩子：`extractTitle(el)` + `uniqueText(text)`，外加候选 2 的 `detectSite(href)` |
| Q2 吸收范围 | emoji 剥离（🔍🏆，防自挂按钮污染重读）、span→textContent 回退全吸收进 `extractTitle`；空标题返回 `''` 且按钮照挂；`from` 参数与 console.log 本轮不动（留候选 3） |
| Q3 候选 2 同批 | `detectSite(href)` 改 hostname+pathname 判定，query 不再参与；`?from=homepage` 触发 AGE 隐藏 CSS、query 含 `agedm` 激活脚本 两处泄漏一并修复 |
| Q4 测试组织 | 单文件 `tests/anime_search.test.mjs`，标题提取与站点判定两个 describe |
| Q5 bug 政策 | 特征测试只固化现状；`uniqueText` 启发式缺陷（如 nbsp 拆不开、英文标题截断）另立决策 |
| Q6 版本节奏 | 本轮不 bump 版本号；候选 3 完成后攒批 `0.6.11 → 0.6.12` 发版 |

实现细节（按先例自行敲定）：

- `detectSite(href)` 传参签名（对照 url_viewer `parseUrl(urlString)`）；匹配式与现状覆盖面逐条 parity：hostname 含 `agedm`/`agefans` → `'age'`；hostname 以 `douban.com` 结尾且 pathname 以 `/subject` 或 `/game` 开头 → `'douban'`；hostname 以 `bilibili.com` 结尾且 pathname 以 `/bangumi/play` 开头 → `'bilibili'`；否则 `null`。非法 URL 捕获后返回 `null`。
- `uniqueText` 从点击时挪进 `extractTitle`（纯函数，输出等价，仅求值时机变化）；点击回调直接 `window.open(targetWeb + text)`。
- 钩子放 IIFE 尾部（jvs / url_viewer 一致）：`if (window.__ANIME_SEARCH_TEST__) { window.__ANIME_SEARCH_TEST__.hooks = { detectSite, extractTitle, uniqueText }; }`
- AGE 清理 CSS 的触发条件从 `href.includes('age')` 改为 `site === 'age'`（agedm/agefans 域名现状必含 'age' 子串，实际覆盖面不变，仅消除泄漏）。

## 改动清单

1. `src/anime_search.user.js`
   - 新增 `detectSite(href)`，入口闸门消费它，`null` 早退
   - 新增 `extractTitle(hDom)`：span 回退 → emoji 剥离 → `uniqueText`；原 addButton 内的 span/h console.log 随逻辑搬入
   - `addButton` 签名与循环结构不动；点击回调改用提取好的 title
   - IIFE 尾部挂 `__ANIME_SEARCH_TEST__` 钩子
2. `tests/anime_search.test.mjs`（新增）：vm sandbox 手法照 url_viewer 变体（透传 `URL`，`document.querySelector` 返回 null，豆瓣 URL 让主体跑通早退闸门）
3. `CONTEXT.md`（懒创建）：术语「站点判定 detectSite」「标题提取 extractTitle」「译名去重 uniqueText」
4. `CLAUDE.md`：新增 anime_search 脚本架构小节（AGENTS.md 是软链，只改一份）

## 测试用例

`uniqueText`（特征测试，固化现状）：

- `'咒术回战 咒术回战'` → `'咒术回战'`（同首字词截断）
- `'咒术回战'` → 原样（单词直返）
- `'Re:从零开始的异世界生活 Re:ゼロから始める異世界生活'` → `'Re:从零开始的异世界生活'`（英文标题同首字截断——现状行为，Q5 固化）
- `'攻壳机动队 SAC_2045'` → 原样（首字不同不截断）
- 首个同首字词出现在中间时，保留其之前的全部词

`extractTitle`（假元素手法，对照 jvs.paint）：

- 有 span → 取 span.textContent；无 span → 取 textContent
- emoji 剥离：`'标题 🔍🏆'` → `'标题'`
- 空文本 → `''`

`detectSite`（含泄漏回归）：

- agedm / agefans 域名 → `'age'`
- `douban.com/subject/*`、`douban.com/game/*` → `'douban'`
- `bilibili.com/bangumi/play/*` → `'bilibili'`
- **泄漏回归 1**：`bilibili.com/bangumi/play/ep1?from=homepage` → `'bilibili'`（不是 `'age'`，隐藏 CSS 不再误注入）
- **泄漏回归 2**：`https://example.com/?ref=agedm` → `null`（query 不再激活脚本）
- 无关站点 / 非法 URL → `null`

## 验证方案

1. `node --test tests/anime_search.test.mjs`（本轮新增）
2. `node --test tests/`（全量，确认 jvs / url_viewer 无回归）
3. 真实标题样本验证（已执行，2026-08-14）：浏览器打开 https://movie.douban.com/subject/34895145/（咒术回战 第一季），`h1 > span:nth-child(1)` 精确文本为 `咒术回战 第一季 呪術廻戦`（码位确认无零宽字符；豆瓣搜索页列表里的 U+200E 是搜索页自加，详情页 span 没有）。实测结果：
   - `extractTitle`（span 优先路径）输出干净标题 ✓，`detectSite` 判 `'douban'` ✓
   - **记录的偏差（不修，Q5）**：`uniqueText` 对该真实标题不截断——中文「咒」(U+5492) 与日文「呪」(U+546A) 码位不同，同首字判定不命中。搜索词会带全名「咒术回战 第一季 呪術廻戦」。启发式只在「同码位同首字」（如纯中文重名列名）时生效；是否放宽为跨字形截断属另立决策

## 不做什么

- 不动 `addButton` 四参数签名 / `from` / 循环 break 结构（候选 3）
- 不修 `uniqueText` 启发式缺陷，即使特征测试暴露（Q5）
- 不 bump 版本号、不发版（Q6）
- 不加轮询补挂（候选 4）、不拆 AGE 清理（候选 5）
