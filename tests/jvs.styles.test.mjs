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
    new RegExp(declaration.replace(/([{}:])/g, '\\$1').replace(/\s+/g, '\\s+')),
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
