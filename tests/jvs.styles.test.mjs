'use strict';

/**
 * JVS_STYLES 样式规则测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文，从 window.__JVS_TEST__ 条件钩子取出 getStyles。
 * 浏览器中该钩子永不激活。
 *
 * 背景：旧版 JVS 逻辑设计节点按单行排版（.ef-node-text line-height 46px
 * 撑起 ~48px 文字框，节点整体 ~97px 固定），脚本用 white-space: normal
 * 展开组件名称后，折到第二行的文字被 overflow: hidden 垂直裁掉——折行状态下
 * text-overflow: ellipsis 失效，尾部文字无声被吞、无省略号。
 * 修复只压缩 .ef-node-text 行高（46px→20px，两行共 40px 装进原本文字框）
 * 并在框内垂直居中；节点框/.top/连线锚点零改动——height: auto 会把节点
 * 高度交给内容重算、节点形态与锚点全变，已被用户截图否决。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

function loadScriptHooks() {
  const source = fs.readFileSync(sourcePath, 'utf8');

  const sandbox = {
    console: {
      log() {},
      error() {},
      warn() {},
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
    localStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {},
    },
    GM_addStyle() {},
    location: { href: 'https://jvs.example.com/#/wel/index' },
    addEventListener() {},
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener() {},
    },
    __JVS_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'jvs.user.js' });

  return sandbox.__JVS_TEST__.hooks;
}

/** 取 selector 的声明块（到平衡花括号），未找到时返回 null */
function getBlock(styles, selector) {
  const start = styles.indexOf(selector + ' {');
  if (start === -1) return null;
  const open = styles.indexOf('{', start);
  let depth = 1;
  let end = open;
  while (depth > 0 && end < styles.length) {
    end += 1;
    if (styles[end] === '{') depth += 1;
    if (styles[end] === '}') depth -= 1;
  }
  return styles.slice(open, end);
}

/** 断言 selector 的声明块内含指定声明 */
function assertDeclaration(styles, selector, declaration) {
  const block = getBlock(styles, selector);
  assert.notEqual(block, null, `缺少规则块：${selector}`);
  assert.match(
    block,
    new RegExp(declaration.replace(/([{}:()])/g, '\\$1').replace(/\s+/g, '\\s+')),
    `${selector} 块内缺少声明：${declaration}`
  );
}

test('旧版 JVS 逻辑设计节点：文字框内压缩行高展开两行，避免折行文字被裁', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  // 行高压缩：原 46px 单行行高撑满 ~48px 文字框，第二行必然溢出被裁；
  // 20px 行高下两行共 40px，装进原本的文字框内即可完整显示
  assertDeclaration(styles, '.ef-node-text', 'line-height: 20px !important');

  // 钉住原本的自然框高：行高压缩后须 min-height 兜底，
  // 否则 .top 跟着塌、节点变矮，外观再变
  assertDeclaration(styles, '.ef-node-text', 'min-height: 48px !important');

  // 单行/两行文字都在框内垂直居中，单行节点视觉与原本一致
  assertDeclaration(styles, '.ef-node-text', 'display: flex !important');
  assertDeclaration(
    styles,
    '.ef-node-text',
    'flex-direction: column !important'
  );
  assertDeclaration(
    styles,
    '.ef-node-text',
    'justify-content: center !important'
  );
});

test('旧版节点框与 .top 高度不动，节点外观与连线锚点不变', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  // 用户验收：height: auto 会把节点框高度交给内容重算，节点形态、
  // 主标题排布、jsPlumber 锚点全部改变——旧版规则不得触碰节点框高度
  const block = getBlock(styles, '.jvs-rule-node.ef-node-container.jtk-droppable');
  assert.notEqual(block, null, '缺少旧版节点规则块');
  assert.doesNotMatch(
    block,
    /height:\s*auto/,
    '旧版节点规则不得放开节点或文字框高度'
  );
  assert.doesNotMatch(block, /\.top/, '旧版节点规则不得改动 .top');
});

test('旧版节点展开名称的规则不波及既有「展开组件名称」规则', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  // 既有规则保留：white-space: normal 是折行展开的来源，不可被新规则替换
  // （用同块并列的 .canvas-tool-item 锚定，避免把源码排版格式硬编码进断言）
  assertDeclaration(
    styles,
    '.canvas-tool-item',
    'white-space: normal !important'
  );
});

test('应用中心星标：悬停浮现空心星，悬停星标变金放大，已标记实心金星常驻', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  // 边框与定位由 :has() 驱动——只有注入了星标的卡片命中，视觉全归 CSS
  assertDeclaration(
    styles,
    '.application:has(.ze-star-btn)',
    'position: relative !important'
  );
  assertDeclaration(
    styles,
    '.application:has(.ze-star-btn)',
    'border: 1.5px solid transparent !important'
  );
  assertDeclaration(
    styles,
    '.application:has(.ze-star-btn.ze-marked)',
    'border-color: #FAAD14 !important'
  );

  // 星标按钮钉在卡片右上角，平时隐藏，200ms 过渡浮现（缓动曲线是调参，不锁）
  assertDeclaration(styles, '.ze-star-btn', 'position: absolute');
  assertDeclaration(styles, '.ze-star-btn', 'opacity: 0');
  assertDeclaration(styles, '.ze-star-btn', 'transition: opacity 0.2s');

  // 28px 热区 + 18px 中灰星（CSS 覆盖 SVG 的 16px 属性尺寸），替换旧 16px 浅灰细星
  assertDeclaration(styles, '.ze-star-btn', 'width: 28px');
  assertDeclaration(styles, '.ze-star-btn', 'height: 28px');
  assertDeclaration(styles, '.ze-star-btn', 'color: #909399');
  assertDeclaration(styles, '.ze-star-btn svg', 'width: 18px');

  // 悬停卡片时星标浮现
  assertDeclaration(styles, '.application:hover .ze-star-btn', 'opacity: 1');

  // 悬停星标本体：变金放大给出可点反馈；:active 与 :hover 同特异性、靠后生效，按下回缩
  assertDeclaration(styles, '.ze-star-btn:hover', 'color: #FAAD14');
  assertDeclaration(styles, '.ze-star-btn:hover', 'transform: scale(1.2)');
  assertDeclaration(styles, '.ze-star-btn:active', 'transform: scale(0.85)');

  // 已标记卡片星标常驻，实心星标金（CSS 覆盖 SVG 的 fill="none" 属性，
  // fill 与 stroke 都走 currentColor 跟随按钮 color）
  assertDeclaration(styles, '.ze-star-btn.ze-marked', 'opacity: 1');
  assertDeclaration(styles, '.ze-star-btn.ze-marked svg', 'fill: currentColor');
});

test('只看星标过滤：body class 驱动卡片与空组隐藏，纯 CSS 无 JS 参与', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  // 非星标卡片隐藏、无星标部门组整组隐藏（连标题一起，不留孤零零的组名）。
  // 卡片类名 .application 新旧版应用中心一致；.wrapper-content 仅新版有，旧版无分组自然不命中
  assertDeclaration(
    styles,
    'body.ze-star-filter-on :is(.application, .wrapper-content):not(:has(.ze-star-btn.ze-marked))',
    'display: none !important'
  );

  // 空态：开了过滤但一个星标都没有时给提示行，让用户知道过滤是开着的。
  // 新版容器 .app-page，旧版 .template-content-box
  assertDeclaration(
    styles,
    'body.ze-star-filter-on :is(.app-page, .template-content-box):not(:has(.ze-star-btn.ze-marked)) .ze-star-empty-tip',
    'display: block'
  );
});

test('只看星标开关 pill：未激活灰描边，激活金色由 body class 派生', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  assertDeclaration(styles, '.ze-star-filter-btn', 'border: 1px solid #C0C4CC');
  assertDeclaration(
    styles,
    'body.ze-star-filter-on .ze-star-filter-btn',
    'border-color: #FAAD14'
  );
  assertDeclaration(
    styles,
    'body.ze-star-filter-on .ze-star-filter-btn',
    'color: #FAAD14'
  );

  // 旧版筛选行内（搜索框右侧）：对齐与间距交给 flex 的 align-items/gap，清掉钉顶 margin
  assertDeclaration(styles, '.filter-bar .ze-star-filter-btn', 'margin: 0');
});

test('全局按钮：仿应用内 plain 蓝，去重阴影，hover 只动底色与边框', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  // 共享块两组选择器共用，锚在末选择器上——helper 按字面匹配「选择器 {」，
  // 首行 .button-11ze 因组内逗号结尾匹配不上（返回 null 而非误命中）
  assertDeclaration(styles, '.drag-handle-11ze', 'color: #409EFF !important');
  assertDeclaration(styles, '.drag-handle-11ze', 'border: 1px solid #B3D8FF !important');
  assert.doesNotMatch(
    getBlock(styles, '.drag-handle-11ze'),
    /box-shadow/,
    '按钮不带常驻阴影'
  );
  assert.doesNotMatch(
    getBlock(styles, '.drag-handle-11ze'),
    /transition:\s*all/,
    '不得用 transition: all'
  );
  assert.doesNotMatch(
    getBlock(styles, '.drag-handle-11ze'),
    /rgba\(64, 158, 255/,
    '旧半透明蓝边残留'
  );

  // hover 只动底色与边框，不再放大阴影
  assertDeclaration(
    styles,
    '.drag-handle-11ze:hover',
    'background-color: #ECF5FF !important'
  );
  assertDeclaration(
    styles,
    '.drag-handle-11ze:hover',
    'border-color: #409EFF !important'
  );
  assert.doesNotMatch(
    getBlock(styles, '.drag-handle-11ze:hover'),
    /box-shadow/,
    'hover 不加阴影'
  );
});

test('日志按钮整钮随模式换色：测试=绿 plain、正式=红 plain，色板取自 Element', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  assertDeclaration(
    styles,
    '.button-11ze[data-mode="测试模式"]',
    'color: #67C23A !important'
  );
  assertDeclaration(
    styles,
    '.button-11ze[data-mode="测试模式"]',
    'border-color: #B3E19D !important'
  );
  assertDeclaration(
    styles,
    '.button-11ze[data-mode="测试模式"]:hover',
    'background-color: #F0F9EB !important'
  );
  assertDeclaration(
    styles,
    '.button-11ze[data-mode="测试模式"]:hover',
    'border-color: #67C23A !important'
  );

  assertDeclaration(
    styles,
    '.button-11ze[data-mode="正式模式"]',
    'color: #F56C6C !important'
  );
  assertDeclaration(
    styles,
    '.button-11ze[data-mode="正式模式"]',
    'border-color: #FAB6B6 !important'
  );
  assertDeclaration(
    styles,
    '.button-11ze[data-mode="正式模式"]:hover',
    'background-color: #FEF0F0 !important'
  );
  assertDeclaration(
    styles,
    '.button-11ze[data-mode="正式模式"]:hover',
    'border-color: #F56C6C !important'
  );
});

test('应用中心侧边栏收起：body class 驱动分类列隐藏与卡片列拉满，开关按钮骑边定位', () => {
  const hooks = loadScriptHooks();
  const styles = hooks.getStyles();

  // 分类列与其右侧空白间隔列一起隐藏（el-col 为 float 布局、宽度全靠 class，覆盖需 !important）
  assertDeclaration(
    styles,
    'body.ze-appcenter-side-collapsed :is(.sidebar-col, .sidebar-col + .el-col)',
    'display: none !important'
  );

  // 卡片区拉满整行；.app-page 自带的 -128px 跨列偏移一并归位（侧边栏没了会推出屏幕外）
  assertDeclaration(
    styles,
    'body.ze-appcenter-side-collapsed .sidebar-col + .el-col + .el-col',
    'width: 100% !important'
  );
  assertDeclaration(
    styles,
    'body.ze-appcenter-side-collapsed .app-page',
    'margin-left: 0 !important'
  );

  // 开关按钮仿应用内样式：fixed 浮动，left 由 JS 按侧边栏右缘校准
  assertDeclaration(styles, '.ze-side-toggle-btn', 'position: fixed');
  assertDeclaration(styles, '.ze-side-toggle-btn', 'z-index: 999');
});
