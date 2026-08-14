# 候选 1:把顶层副作用收回 isJVS seam 内侧

> 架构审查报告:`/var/folders/p_/c9rhwyyj05778dlz1jhfjp740000gn/T/architecture-review-20260814-142038.html`(候选 1,Strong)
> 执行顺序:候选 1 → 2(poll runner)→ 5(LogStore)→ 7(组件上色)→ 其余

## 问题

`src/jvs.user.js` 的 `@match *://*/*`,但两段副作用在 IIFE(结束于 2038 行)之外、环境检测 seam 之外执行:

- `window.ICONS = {...}`(2044-2053):约 40KB 的 4 个设计类型 favicon base64,挂全局且可写
- `GM_addStyle(JVS_STYLES)`(2322,样式串 2059-2320):260 行 JVS 专属 CSS,含无前缀全局类 `.popup`(z-index 9999)

后果:所有非 JVS 网站都被写入 `window.ICONS` 并注入 JVS 样式;`changeTitle`(965 行)隔着 1000 行读 `window.ICONS`,靠「setInterval 首次触发晚于同步顶层执行」的时序巧合才不报错。

## 决策记录(grilling 2026-08-14)

| 决策点 | 结论 |
|--------|------|
| Q1 `window.ICONS` 仓库外依赖 | 无 → 彻底闭包化为 `const ICONS` |
| Q2 `.popup` 类名 | 本次一并改为 `.popup-11ze`(与 `.button-11ze`、`.table-11ze` 后缀习惯一致;`.ze-logic-name-display` 的历史不一致不顺手动) |
| Q3 搬运方式 | 方案 A 最小 diff:把 2038 行 `})();` 挪到文件末尾,IIFE 吞掉尾部三段;不重组常量位置 |
| Q4 发布节奏 | 攒批:候选 1/2/5/7 各自 commit,全部完成后统一 bump 版本 + OpenUserJS + README |
| Q4 验证环境 | JVS 公网测试站:`https://qicong-edf.mtu.plus/#/wel/index` |

## 改动清单(共 5 处,全在 src/jvs.user.js)

1. 2038 行:删除 `})();`,移到 2322 行 `GM_addStyle(JVS_STYLES);` 之后——ICONS、JVS_STYLES、GM_addStyle 全部进入 IIFE,非 JVS 站在 111 行早退后不再执行
2. 2044 行:`window.ICONS = {` → `const ICONS = {`
3. 965 行:`changeFavicon(window.ICONS[tabType])` → `changeFavicon(ICONS[tabType])`
4. 619 行:`popup.className = 'popup'` → `popup.className = 'popup-11ze'`
5. 2184 行 CSS 规则:`.popup {` → `.popup-11ze {`(单一规则块,2184-2199,无后代选择器引用)

### 安全性分析

- TDZ 无风险:`changeFavicon` 首次调用发生在 setInterval 400ms 后,届时 IIFE 同步体(含 2044 行 `const ICONS`)已执行完毕
- 样式注入时机:IIFE 尾部 vs 原顶层,仅晚几毫秒,远早于首个 tick(400ms)
- isJVS() 在 document-idle(无 @run-at 时的默认值)下检测 link 标签,head 已就绪,检测可靠;样式与脚本主体从此共用同一个 gate,一致性更好

## 验证方案(可重复执行)

1. **语法**:`node --check src/jvs.user.js`
2. **非 JVS 站零污染**(浏览器自动化):访问任意公网页面(如 example.com),注入 `GM_addStyle` 桩后执行脚本全文,断言:
   - `window.ICONS === undefined`
   - GM_addStyle 桩未被调用
   - 无未捕获异常
3. **JVS 站正常初始化**(浏览器自动化):访问 `https://qicong-edf.mtu.plus/#/wel/index`,注入 GM 桩后执行脚本全文,断言:
   - console 出现「已检测到 JVS 环境」
   - GM_addStyle 桩被调用,且样式串包含 `.popup-11ze`、不包含裸 `.popup {`
   - 轮询运行数秒无报错
4. **手测清单**(真实安装环境,发给用户):
   - JVS 站打开日志弹窗:边框/圆角/阴影正常(原 .popup 样式)
   - 日志弹窗拖拽正常
   - 进入逻辑/列表/表单/流程设计器:浏览器标签 favicon 变为对应图标(ICONS 闭包化后仍工作)
   - 非 JVS 任意网站:控制台无「已检测到 JVS 环境」日志

## 不做的事

- 不 bump 版本号、不上传 OpenUserJS(攒批,见 Q4)
- 不重组 ICONS/JVS_STYLES 在文件中的位置(方案 A)
- 不改 `.ze-logic-name-display` 等其他类名
