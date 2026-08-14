# 候选 7：组件上色配置/机制分离

日期：2026-08-14
前置：候选 1（`1fcf1d4`）、候选 2（`5cc914d`）、候选 5（`414068e`）已完成
范围文件：`src/jvs.user.js`、新增 `tests/jvs.paint.test.mjs`

## 背景与目标

`adjustInterfaceAndComponentStyle`（1102-1195 行）每 400ms 执行一次，内部：

1. `typeToColorList` 40 行配置字面量定义在函数体内，每个 tick 重建；
2. 三段循环体逐字相同（旧版画布 `innerText`、新版画布 `textContent`、侧边栏
   `innerText`）：取文本 → `types.some(includes)` → 上背景色 + 边框色 → break；
3. 第四段 `.formitem2` 加 class 是表单设计名称显示功能，机制不同，不并入。

目标：配置外提为模块常量，机制抽 `paintComponents` 助手，三段变三行调用；
vm 桩测机制钉住优先级与 includes 语义。

## 决策记录

| # | 问题 | 决策 | 理由 |
|---|------|------|------|
| Q1 | 三段循环怎么合 | **抽 paintComponents(selector, textProperty)**（用户裁决） | 选择器、文本属性、执行顺序逐一保持，严格行为等价；机制单写一遍，净省约 15 行 |
| Q2 | 配置外提形态 | **保持 {types, color} 数组结构**（用户裁决） | 外科手术式搬动，改名 `COMPONENT_TYPE_COLORS`；匹配优先级 = 数组顺序，语义不变 |
| Q3 | 测试 | **vm 桩测机制**（用户裁决） | querySelectorAll 返回假元素（带 innerText/textContent/style），钉住命中上色、优先级取第一组、未命中不动、按传入属性读文本 |

## 行为保持论证

- 原执行顺序「查询1 → 建数组 → 循环1 → 查询2 → 循环2 → 查询3 → 循环3」变为
  「查询1 → 循环1 → 查询2 → 循环2 → 查询3 → 循环3」（数组外提到 tick 外）——
  同步执行无 DOM 变化介入，等价
- 旧版选择器是新版选择器的子集：旧版组件被两段先后上色（第二段覆盖，同色幂等），
  三行调用保持原顺序，该行为不变
- 文本读取方式（innerText 触发 reflow 只取渲染文本 / textContent 全量）原样保留为
  参数，不做统一

## 改动清单

### 1. 模块常量（COLORS 之后、STORAGE_KEYS 之前，TDZ 安全）

```javascript
/**
 * 组件类型上色配置：数组顺序即匹配优先级
 */
const COMPONENT_TYPE_COLORS = [ { types: [...], color: COLORS.component.data }, ... ];
```

### 2. 机制函数（adjustInterfaceAndComponentStyle 之后）

```javascript
function paintComponents(selector, textProperty) {
  const components = document.querySelectorAll(selector);
  for (const component of components) {
    const text = component[textProperty].trim();
    for (const typeToColor of COMPONENT_TYPE_COLORS) {
      if (typeToColor.types.some((t) => text.includes(t))) {
        component.style.backgroundColor = typeToColor.color;
        component.style.borderColor = typeToColor.color;
        break;
      }
    }
  }
}
```

原函数三段各变一行调用，原注释（旧版/新版/侧边栏）保留；`.formitem2` 段原样。

### 3. 测试钩子

`__JVS_TEST__.hooks` 增加 `paintComponents`。

### 4. tests/jvs.paint.test.mjs

- 命中类型 → 背景 + 边框上对应色（颜色值钉源码字面量，如 data `#FFD6E7`）
- 跨组文本取靠前组（优先级 = 数组顺序）
- 未命中 → style 不动
- innerText / textContent 按传入属性读（同元素两属性不同值 → 两调用不同色）
- includes 语义：`分页等变量` 命中 variable 组的 `等变量`

## 验证方案（可重复执行）

1. `node --check src/jvs.user.js`
2. `node --test tests/jvs.runner.test.mjs tests/jvs.storage.test.mjs tests/jvs.paint.test.mjs`
3. 手测（真 JVS 站，攒批发版前统一做）：逻辑设计画布与侧边栏组件颜色与改前一致

## 不做的事

- 不 bump 版本号（攒批发版）
- 不扁平化配置结构（Q2 裁决）
- 不把 `.formitem2` 段并入 paintComponents（机制不同）
- 不统一 innerText / textContent（两版 JVS 的既有语义差异）
