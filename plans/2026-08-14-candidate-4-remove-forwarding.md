# 候选 4：LogModule / DesignModule 转发假抽象移除

日期：2026-08-14
前置：候选 1（`1fcf1d4`）、候选 2（`5cc914d`）、候选 5（`414068e`）、候选 7（`0751f42`）已完成
范围文件：`src/jvs.user.js`

## 背景与决策

`LogModule`（8 成员）与 `DesignModule`（16 成员）是纯别名转发对象，全部引用都只在
operations 数组（LogModule 经候选 2 删掉两条转发后仅剩 `bindSaveButton` 一处引用，
另有 7 个零引用死成员）。deletion test：删掉后 operations 直引函数，零复杂度回流，
跳转实现反而少一层间接。

**Q1（唯一决策）：移除范围 → 两个全删（用户裁决）。**

## 行为保持论证

- runner 的错误日志取 `operation.name` = 函数真名（如 `DesignModule.adjustStyle`
  报错时本来就显示 `adjustInterfaceAndComponentStyle`），直引后不变
- operations 为普通函数引用数组，函数均为 function 声明（提升安全，无 TDZ）
- 分组语义由数组内既有注释（`// 设计器模块`、`// 日志模块`）承担，不丢失

## 改动清单

1. 删除 `LogModule`、`DesignModule` 两个对象定义（约 42 行，含 JSDoc 注释）
2. operations 数组 16 处成员访问改为函数名（改名成员还原真名）：
   `DesignModule.adjustStyle` → `adjustInterfaceAndComponentStyle`、
   `DesignModule.enterTab` → `enterTabDesign`、七个 `addXxxButton/expand/highlight`
   成员同理还原；`LogModule.bindSaveButton` → `bindSaveButton`
3. 注释行 `// DesignModule.autoRefreshPage,` → `// autoRefreshPage,`（死路径提示保留，
   `autoRefreshPage` 函数本体不动——预存死代码只提示不删除）

## 验证方案（可重复执行）

纯改名/删除重构，无新行为，不新增测试；靠既有 24 条测试回归 + 浏览器桩页：

1. `node --check src/jvs.user.js`
2. `node --test tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs tests/jvs.paint.test.mjs`
   （三个文件都在 vm 桩里执行脚本全文完成初始化，转发层移除后初始化路径回归即被覆盖）
3. 浏览器桩页（复用候选 7 的 /tmp 基建思路）：日志按钮出现、组件上色正常、无运行错误

## 不做的事

- 不 bump 版本号（攒批发版）
- 不改函数名（`firstAddButtonToOpenNewLogicDesignForNestedLogic` 等长名是既有词汇）
- 不删 `autoRefreshPage` / `setCanvasScroll` 死函数本体
