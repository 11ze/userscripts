# 候选 6：url_viewer URL 模型深化

日期：2026-08-14
脚本：src/url_viewer.user.js（0.4.1，独立脚本）

## 背景与问题

解析路径 `parseUrl` 产出扁平事件流 `[{type:'host'|'table'|'param'}, ...]`，
`main` 渲染循环用 `currentTable` / `currentHost` / `hostIndex` 三个侧变量把
结构拼回来——解析时丢结构、渲染时重构结构，跨函数重建心智模型。

## 决策记录

| # | 问题 | 决策 |
|---|------|------|
| Q1 | parseUrl 输出模型方向 | **改结构化模型** `[{host, params: [{key, value}]}]` |
| Q2 | buildUrlFromPanel 主 URL 用 `set` 丢重复参数键 | **修**，`set` → `append`，与 hash 段对称 |
| Q3 | 编辑路径数据模型（住在 DOM dataset 上） | **保持 DOM 即模型**，不统一（重写三个函数，过度设计） |
| Q4 | main 里的 console.log（打印完整 URL） | **删掉**（搭车小件，生产噪音） |
| Q5 | 参数值含 `?` 时第二个 `?` 之后的内容被丢弃（实施中测试发现） | **修**（2026-08-14 用户裁决）：`split('?')` 解构改为 rest + join，第一个 `?` 之后的全部作为查询串。与 Q2 同理——解析侧无理由丢内容 |

## 行为等价论证

### parseUrl → 结构化输出

- `type:'table'` 事件只在 entries 非空时 push；新模型用 `params.length > 0`
  在渲染侧判断建表，语义相同。
- `value || ''` 是死分支（URLSearchParams 的 value 永远是 string，最差 ''），
  新代码自然消失，行为等价。
- 空参数校验（非字符串 / 空串 → `[]` + console.error）原样保留。

### main 渲染循环

- 原侧变量语义核对：
  - `currentTable` 非空 ⟺ 历史上建过至少一张表（table 分支只覆盖不置
    null）→ 新循环用 `separatorNeeded` 累积布尔（只置 true 不回退），
    分隔线规则「出现过表之后，每个 host 段前都加线」严格等价。
    注意不能写成「上一段有表」——场景 A 有表 → B 无表 → C，原逻辑 C 前
    仍加线（currentTable 还是 A 的表）。
  - `hostIndex - 1`（table/param 的 hashIndex）= 当前 host 段索引 →
    新循环的 forEach 索引 `index`。
- `addParamRow(table, param, index)` 消费的 `param.key` / `param.value`
  字段名不变，函数零改动。
- `table.dataset.hashHost` / `dataset.hashIndex` 赋值不变，编辑路径
  （switchToEditMode / switchToViewMode / buildUrlFromPanel 读取侧）零改动。

### set → append

`?a=1&a=2` 解析产出两行 param，编辑跳转重建时 `set` 只留最后一个值，
`append` 与 hash 段（481 行）行为对称，与解析对称。仅影响「URL 带重复键
+ 编辑跳转」组合场景，普通 URL 无差异。

## 改动清单

1. `parseUrl`：事件流 → `[{host, params: [{key, value}]}]`，加段注释说明
   「调用方需先整串 decodeURIComponent，让编码的 #/? 炸开分段」。
2. `main` 渲染循环：侧变量状态机 → 结构化两层遍历 + `separatorNeeded`
   累积布尔。
3. `buildUrlFromPanel` 466 行：`params.set` → `params.append`。
4. `main`：删 `console.log('url-reader: urlInfo', urlInfo);`。
5. 测试钩子：`if (window.__URL_VIEWER_TEST__)` 暴露 `parseUrl` /
   `buildUrlFromPanel`（浏览器永不激活，同 jvs 模式）。

## 不做的事

- 编辑路径 DOM 即模型保持现状（Q3）。
- `decodeURIComponent` 整串预解码不动——这是 iframe 嵌套路由分节展示的
  杀手锏（有意设计）。
- goButton 的 `href 赋值 + reload()` 组合不动（纯 hash 编辑需强刷）。
- `copyTextToClipboard` 的 execCommand fallback 不动（http 非安全上下文
  无 navigator.clipboard，仍需要）。

## 验证方案

1. **vm 桩测试**（tests/url_viewer.url.test.mjs）：parseUrl 纯函数全行为
   （分段、嵌套路由、重复键、空 query、值含 ?、参数校验、空段跳过）。
   断言用 JSON.stringify 字符串对比，避开 vm realm deepEqual 坑。
2. **node --check + 全量 node --test**。
3. **浏览器桩页**（/tmp/jvs-verify-c6/，端口 18781）：
   `?a=1&a=2#/route?b=1&b=2` 打开弹窗 → 段/表/行结构断言（渲染等价）→
   切编辑 → 钩子调 buildUrlFromPanel 断言 `a=1&a=2` 与 `b=1&b=2` 均保留
   （append 修复端到端）。

## 发版

与其他候选攒批统一发版（版本号 bump + OpenUserJS + README），本候选不单独发。
