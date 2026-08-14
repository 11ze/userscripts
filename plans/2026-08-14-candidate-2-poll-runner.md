# 候选 2（并入候选 3）：poll runner 统一调度 + keyed widget 收敛

日期：2026-08-14
前置：候选 1 已完成（commit `1fcf1d4`）
范围文件：`src/jvs.user.js`、`AGENTS.md`、新增 `tests/jvs.runner.test.mjs`

## 背景与目标

jvs.user.js 的 400ms 轮询（`jvsTimer`，418-427 行）里挂着 18 个 operation，各自手搓了
15 套"已处理"防御，机制互不相通：DOM 属性闩锁、按钮 dataset key 对比、闭包值闩锁、
STATE 对象闩锁、散落的 remove-重建分支。目标：

1. runner 调度层：operations 变成混合数组，`{ name, probe, apply }` 对象由 runner 按
   lastKey 调度（probe 返回 null = 本 tick 不适用；key 不变 = 跳过 apply）
2. widget 层：6 处手写 keyed 挂载逻辑收敛成 `syncKeyedWidget` 工具（候选 3 并入）
3. 删除能被 lastKey 严格等价替代的闭包值闩锁（`savedLogDesignName` / `savedLogAppName`）
4. runner / syncKeyedWidget 用 `node:test` 单测覆盖

## 决策记录

| # | 问题 | 决策 | 理由 |
|---|------|------|------|
| Q1 | 候选 3 是否并入 | 并入 | 共享 keyed 机制，分批要维护两套约定的中间态 |
| Q2 | operation interface | 方案 A 混合数组 | 普通函数 = 每 tick 执行（changeTitle/adjustStyle 零改动）；对象 = runner 管 key |
| Q3 | 测试基建 | 方案 A `node:test` | Node 内置零依赖，符合仓库无构建工具现状；不引 vitest/jsdom |
| Q4 | 行为边界 | **严格行为保持（用户修正后）** | 熔断型 STATE 闩锁保留原样；见下方等价性论证 |
| Q5 | 测试取用路径 | 条件测试钩子 `window.__JVS_TEST__` | 浏览器零执行零泄漏；与候选 1 vm 桩验证基建同构 |
| Q6 | keyed 收敛（原候选 3 主体） | **实施期否决** | 细读 6 处现场后确认伴随动作位置各异（key 变化时先清复制按钮、insertBefore 插入位、textContent 键），强行统一需回调参数爆炸（过度设计）或改变 tick 内中间步骤（违反 Q4）。唯一完全适配的 `_createCopyNameButton` 单处收敛净复杂度上升。6 处 keyed 现场全部保持原样 |

## 行为保持论证（按闩锁语义分类）

| 类型 | 现场 | 处理 | 等价性 |
|---|---|---|---|
| 值变化型 | `savedLogDesignName/savedLogAppName`（452-453、743-747） | 删闭包，probe 返回组合 key | 严格等价：闭包语义"值不变就跳过"与 lastKey 逐字相同 |
| 熔断型 | `STATE.skipCopyComponentButton`（1498）、`STATE.tabDesignClicked`（1009）、`STATE.componentLibraryExpanded`（1758） | **原样保留在函数内部** | lastKey 是"值变了就重跑"，表达不了"置位后永不复位"，迁移必改 SPA 行为 |
| 绑定型 | `Utils.isMarked/mark` 4 处（759/761、1584/1605、1623/1638、1773/1790） | 保留 | 闩锁跟随元素身份，本来就是正确机制 |
| keyed 型 | 6 处 querySelector→对比→remove→重建 | `syncKeyedWidget` 收敛 | 逻辑搬家，对比/移除/重建的时机与条件逐行保持 |

**probe 方法论**：probe 返回 apply 的完整输入状态指纹（不只是业务 key）。例：
`updateLogButton` 的指纹 = 日志容器存在性 + mode —— 容器被外部移除时指纹变化，apply
照跑重建，与原行为一致。

## 改动清单

### 1. runner（src/jvs.user.js）

```javascript
function createOperationRunner(operations, onError) {
  const lastKeys = new Map();

  return function tick() {
    for (const operation of operations) {
      try {
        if (typeof operation === 'function') {
          operation();
          continue;
        }
        const key = operation.probe();
        if (key === null || key === undefined) continue;
        if (lastKeys.get(operation) === key) continue;
        lastKeys.set(operation, key);
        operation.apply();
      } catch (error) {
        onError(operation.name, error);
      }
    }
  };
}
```

- `jvsTimer` 循环体改为调用 runner 返回的 tick，400ms 间隔不变
- 错误隔离保留：`console.error('「改善 JVS 开发体验」' + name + ' 运行错误：')` 格式不变
- probe 返回 null/undefined：跳过且**不更新** lastKey（值 → null → 同值 不重跑，与闭包语义一致）

### 2. operations 迁移（2 个对象化，其余保持函数）

- `LogModule.saveCurrent` → `{ name, probe, apply }`：probe 计算 `designName|appName`
  组合指纹（newLog 无效返回 null），apply 执行原 saveLog 逻辑；**删除 savedLog\* 闭包**
- `LogModule.updateButton` → `{ name, probe, apply }`：probe 返回容器存在性 + mode
  指纹，apply 移除容器重建（原 dataset.mode 对比自然消解——apply 被调用即指纹已变）
- 其余 16 个 operation 保持普通函数零改动（含熔断型三处的内部 STATE 逻辑）

### 3. keyed 现场收敛 —— 否决（见决策记录 Q6）

6 处 keyed 现场全部保持原样，不引入 `syncKeyedWidget`。

### 4. 测试钩子（IIFE 内部，runner 定义之后）

```javascript
if (window.__JVS_TEST__) {
  window.__JVS_TEST__.hooks = { createOperationRunner: createOperationRunner };
}
```

浏览器中 `__JVS_TEST__` 永远 undefined，零执行零泄漏。

### 5. tests/jvs.runner.test.mjs（node:test + vm 桩）

- 桩环境执行脚本全文（借鉴 verify-jvs-seam.mjs 的 JVS 模式：document/link 桩过
  isJVS、localStorage、GM_addStyle、setInterval 捕获）
- 从 `__JVS_TEST__.hooks` 取被测函数，断言：
  - 普通函数每 tick 执行
  - probe 返回 null → apply 不跑
  - probe 同 key → apply 只跑一次；换 key → 重跑；值→null→同值 不重跑
  - apply / probe 抛错 → 后续 operation 不受影响，onError 收到 name + error
- 运行：`node --test tests/`（要求 Node ≥ 18，实施前 `node --version` 确认）

### 6. AGENTS.md 架构描述更新

"操作队列：operations 数组包含所有功能函数，每 400ms 执行一次" → 混合数组 +
runner lastKey 调度 + syncKeyedWidget 的描述。

## 验证方案（可重复执行）

1. `node --check src/jvs.user.js`
2. `node --test tests/`
3. 浏览器桩页面：复用候选 1 的本地静态服务器基建（jvs.html / nonjvs.html），
   追加断言：mode 不变时日志按钮 DOM 引用不变、变化时重建、无检测日志回归

## 不做的事

- 不 bump 版本号（攒批发版，与候选 1 同一约定）
- 不动熔断型 STATE 三处、绑定型 isMarked 四处的任何逻辑
- 不动 `autoRefreshPage` / `STATE.pageHandler` 死路径（函数未被调度，预存死代码只提示）
- 不统一各 keyed 现场的属性名（DOM 零变化）
- 不做候选 4（LogModule/DesignModule 转发层移除）—— 后续单独候选
