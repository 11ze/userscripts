# 候选 5：存储读路径副作用显式化

日期：2026-08-14
前置：候选 1（`1fcf1d4`）、候选 2（`5cc914d`）已完成
范围文件：`src/jvs.user.js`、新增 `tests/jvs.storage.test.mjs`

## 背景与目标

架构扫描报告原方案：「LogStore + AppCatalog 存储域深化（读路径副作用移除、storage
adapter 注入）」。grilling 细读后大幅收窄：

- **locality 本来就好**：日志函数（getLogs/saveLog/uniqueLogs/cutOverdueLogs）在
  596-641 连续定义，目录函数（getAppNameMap/getAppIdName/saveAppIdName）在
  1878-1905 连续定义，建域对象是反向操作（候选 4 的方向恰恰是移除转发假抽象）。
- **adapter 注入是重复建设**：候选 2 已验证 vm 桩环境能直接替换 localStorage 跑通
  测试，测试能力已具备。

真正的病灶只有一个：**getLogs() 读 LOGS 时逐条用 APP_NAME_MAP 补全 appName
（607-610 行），saveLog 把补全结果持久化回写**——旧日志的 appName 被目录最新值
隐式刷新，读路径产生写效果。

目标：

1. 补全挪到展示端（showLogPopup），getLogs 变纯读
2. 测试钉住存储域隐藏规则：过期剪切、去重、幂等写入、双向映射、存储不被补全污染

## 决策记录

| # | 问题 | 决策 | 理由 |
|---|------|------|------|
| Q1 | getLogs 补全副作用 | **挪到展示端**（用户裁决） | 消费 appName 的只有 showLogPopup 一处；其余 3 个调用方只用 url/id/designName/jvsAppId。顺带省掉 addButtonToOpenNewLogicDesign 每 400ms 的 2 次目录读 + JSON.parse |
| Q2 | getMode / getAppNameForLog 顺手落库 | **保持现状**（用户授权代理裁决，约束"代码不变复杂"） | getMode 拆出的是单调用点 4 行函数，净增复杂度；getAppNameForLog 的落库只在"DOM 单行文本"分支发生，拆到调用点无法严格等价。两处是"DOM 是源、storage 是缓存"的采集即登记语义，保持原样 |
| Q3 | 域对象形态 | **不建 LogStore/AppCatalog**（用户裁决） | locality 已好；与候选 4（移除转发假抽象）方向相反 |
| Q4 | storage adapter 注入 | **不做**（用户裁决） | vm 桩 + __JVS_TEST__ 钩子已覆盖测试需求，注入是重复建设 |

## Q1 行为差异论证（唯一被接受的差异）

差异场景：某条旧日志保存时目录还没有该应用映射（appName 存了回退名），之后目录
有了映射——

- 原逻辑：下一次任意 saveLog 会把新映射持久化写进这条旧日志（getLogs 补全后回写）
- 新逻辑：存储保留旧值；showLogPopup 展示时照样用目录覆盖

**用户可见行为（弹窗展示、跳转链接、去重、剪切）逐一等价**；仅存储字节有差。
另：saveLog 回写的列表不再含补全痕迹，存储数据更"保真"（写入什么就是什么）。

调用方逐一核对：

| 调用方 | 用 appName？ | 等价性 |
|---|---|---|
| showLogPopup（667） | 是（680 展示） | 展示前调 enrichLogsWithAppName，顺序变化无观察差异 |
| saveLog（621） | 否（透传） | 存储字节差异 = Q1 已裁决接受 |
| getUrlFromLogs（1194） | 否（url/id） | 等价 |
| getUrlFromLogsAndUrl（1220） | 否（url/designName/jvsAppId） | 等价 |
| addButtonToOpenNewLogicDesign（1260） | 否（id/designName） | 等价，且省 2 次目录读 |

顺序细节：原 getLogs 是"先补全后剪切"；新路径"先剪切后补全"——被剪条目的补全
结果本就丢弃，保留条目两种顺序结果相同。

## 改动清单

### 1. getLogs 变纯读（src/jvs.user.js 603-613）

删除 forEach 补全块，保留剪切：

```javascript
function getLogs() {
  const logs = jvsStorage.get(STORAGE_KEYS.LOGS, []);
  if (!logs) return [];
  return cutOverdueLogs(logs, Date.now());
}
```

### 2. 新增 enrichLogsWithAppName（日志模块区，getLogs 附近）

```javascript
/**
 * 用应用目录补全日志的 appName（仅用于展示，不回写存储）
 */
function enrichLogsWithAppName(logs) {
  logs.forEach((log) => {
    const appName = getAppIdName(log.jvsAppId);
    if (appName) log.appName = appName;
  });
  return logs;
}
```

showLogPopup 的 `const logs = getLogs();` 改为
`const logs = enrichLogsWithAppName(getLogs());`。

### 3. 测试钩子扩展（复用候选 2 的 __JVS_TEST__ 挂载点）

```javascript
window.__JVS_TEST__.hooks = {
  createOperationRunner,   // 候选 2 已有
  cutOverdueLogs, uniqueLogs, enrichLogsWithAppName,
  saveAppIdName, getAppIdName, saveLog, getLogs,
};
```

挂载点在主逻辑区，这些全是 function 声明（提升安全，无 TDZ）。

### 4. tests/jvs.storage.test.mjs（node:test + vm 桩，复用候选 2 基建）

桩环境：localStorage（Map 实现）、console、setInterval 捕获、GM_addStyle、
location、document.getElementsByTagName 返回含 jvs-ui 的 link、
window.addEventListener 空实现、`__JVS_TEST__: {}`。

TDD 红（对旧代码必失败的两条）：

- enrichLogsWithAppName 存在且补全（旧代码：undefined → 红）
- saveLog 后存储 LOGS 不被目录污染（旧代码：补全回写 → 红）

钉住既存行为（防御回归）：

- cutOverdueLogs：time = 0（远超 365 天）被剪、无 time 被剪、新近保留
- uniqueLogs：同 id+type 去重保最新、不同 id/type 共存
- saveAppIdName：新映射双向写入（id→名、名→id）；已有 id 不覆盖；appName
  为「复制」拒绝；空 id/名拒绝
- getAppIdName：有映射返回名、无映射返回 ''
- 集成：saveLog 两条 → getLogs 顺序正确

### 5. CLAUDE.md

「本地存储工具：统一的 localStorage 封装处理 JSON 数据」描述仍准确；仅在出现
失实时更新，不为内部澄清加文档。

## 验证方案（可重复执行）

1. `node --check src/jvs.user.js`
2. `node --test tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs`
3. 浏览器桩页面（重建 /tmp 基建）：预置目录映射 + 日志数据 → 点日志按钮开弹窗
   → 断言弹窗内 appName 为目录名、LOGS 存储字节不变、控制台无运行错误

## 不做的事

- 不 bump 版本号（攒批发版，与候选 1/2 同一约定）
- 不动 getMode / getAppNameForLog 的顺手落库（Q2 裁决）
- 不建 LogStore / AppCatalog 域对象（Q3 裁决）
- 不做 storage adapter 注入（Q4 裁决）
- 不动 jvsStorage.get 的 catch→remove 自愈（读失败清坏数据，合理且罕见）
- 不动 HIGHLIGHT_APPS（locality 已好）与 REFRESH_PAGE_LAST_TIME 死路径
- 不动 cutOverdueLogs / uniqueLogs 的语义（剪切+去重经 saveLog 持久化是有意清理）
