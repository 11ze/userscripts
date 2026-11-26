'use strict';

/**
 * paintComponents 组件上色机制测试
 *
 * 通过共享 harness 的 vm 桩环境执行 jvs.user.js 全文，querySelectorAll 返回假元素
 * （带 innerText / textContent / style），从 window.__JVS_TEST__ 条件钩子
 * 取出 paintComponents。见 plans/2026-08-14-candidate-7-component-colors.md。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl } from './jvs-harness.mjs';

// 颜色值钉住源码 COLORS.component 字面量
const EXPECTED_COLORS = {
  data: '#FFD6E7',
  logic: '#D6E4FF',
  loop: '#D9F7D9',
  warning: '#FEF0C7',
  variable: '#EFDBFF',
};

function fakeComponent({ innerText = '', textContent = '' } = {}) {
  return { innerText, textContent, style: {}, dataset: {} };
}

function loadScriptHooks(fakeDom) {
  return loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: (selector) => fakeDom[selector] ?? [],
      getElementById: () => null,
      addEventListener() {},
    },
  }).hooks;
}

test('脚本暴露 paintComponents 测试钩子', () => {
  const hooks = loadScriptHooks({});
  assert.equal(typeof hooks.paintComponents, 'function');
});

test('命中类型时背景与边框都上对应颜色', () => {
  const component = fakeComponent({ innerText: '数据模型-按条件新增' });
  const hooks = loadScriptHooks({ '.getItem': [component] });

  hooks.paintComponents('.getItem', 'innerText');

  assert.equal(component.style.backgroundColor, EXPECTED_COLORS.data);
  assert.equal(component.style.borderColor, EXPECTED_COLORS.data);
});

test('跨组文本按数组顺序取靠前的组', () => {
  const component = fakeComponent({ innerText: '对象变量里的数据模型快照' });
  const hooks = loadScriptHooks({ '.getItem': [component] });

  hooks.paintComponents('.getItem', 'innerText');

  assert.equal(component.style.backgroundColor, EXPECTED_COLORS.data);
});

test('未命中任何类型时样式不动', () => {
  const component = fakeComponent({ innerText: '自由布局容器' });
  const hooks = loadScriptHooks({ '.getItem': [component] });

  hooks.paintComponents('.getItem', 'innerText');

  assert.deepEqual(Object.keys(component.style), []);
});

test('按传入的文本属性读取：innerText 与 textContent 值不同时结果不同', () => {
  const byInnerText = fakeComponent({ innerText: '提示消息', textContent: '逻辑引擎' });
  const byTextContent = fakeComponent({ innerText: '提示消息', textContent: '逻辑引擎' });
  const hooks = loadScriptHooks({ '#a': [byInnerText], '#b': [byTextContent] });

  hooks.paintComponents('#a', 'innerText');
  hooks.paintComponents('#b', 'textContent');

  assert.equal(byInnerText.style.backgroundColor, EXPECTED_COLORS.warning);
  assert.equal(byTextContent.style.backgroundColor, EXPECTED_COLORS.logic);
});

test('类型匹配是 includes 语义：分页等变量 命中 variable 组的「等变量」', () => {
  const component = fakeComponent({ innerText: '分页等变量' });
  const hooks = loadScriptHooks({ '.getItem': [component] });

  hooks.paintComponents('.getItem', 'innerText');

  assert.equal(component.style.backgroundColor, EXPECTED_COLORS.variable);
});

test('一个选择器下的多个组件各自独立匹配', () => {
  const components = [
    fakeComponent({ textContent: '循环容器' }),
    fakeComponent({ textContent: '不认识的组件' }),
    fakeComponent({ textContent: '中止程序' }),
  ];
  const hooks = loadScriptHooks({ '.jvs-rule-node.ef-node-container': components });

  hooks.paintComponents('.jvs-rule-node.ef-node-container', 'textContent');

  assert.equal(components[0].style.backgroundColor, EXPECTED_COLORS.loop);
  assert.deepEqual(Object.keys(components[1].style), []);
  assert.equal(components[2].style.backgroundColor, EXPECTED_COLORS.warning);
});

// ==================== 新版节点：类型名取自节点组件数据 ====================
// 新版节点自身文字只有可改的实例名，组件类型名与说明要到首次 hover 才进 DOM，
// 走真实入口 adjustInterfaceAndComponentStyle 锁「不 hover 也能上色」

/** 新版节点桩：类名不带 jtk-droppable，可挂节点组件数据 */
function newVersionNode(text, data = undefined) {
  const node = makeFakeEl();
  node.textContent = text;
  if (data) {
    node.__vue__ = { $props: { itemData: { node: { data } } } };
  }
  return node;
}

test('新版节点：DOM 文字不含类型名、节点组件数据带 functionName 时按类型上色', () => {
  const node = newVersionNode('数组 - 示例 ID', { functionName: '固定变量' });
  const hooks = loadScriptHooks({ '.jvs-rule-node.ef-node-container': [node] });

  hooks.adjustInterfaceAndComponentStyle();

  assert.equal(node.style.backgroundColor, EXPECTED_COLORS.variable);
  assert.equal(node.style.borderColor, EXPECTED_COLORS.variable);
});

test('新版节点：functionName 不命中时按说明文字匹配（hover 后弹层里就是这段文字）', () => {
  const node = newVersionNode('数组 - 示例', {
    functionName: '变量赋值',
    explain: '支持对象，数组,数组对象，文件等变量',
  });
  const hooks = loadScriptHooks({ '.jvs-rule-node.ef-node-container': [node] });

  hooks.adjustInterfaceAndComponentStyle();

  assert.equal(node.style.backgroundColor, EXPECTED_COLORS.variable);
});

test('宿主类型文本只给新版节点：同样数据，带 jtk-droppable 的旧版节点仍只按 DOM 文本匹配', () => {
  const data = { functionName: '固定变量' };
  const oldNode = newVersionNode('自由布局容器', data);
  oldNode.classList.add('jtk-droppable');
  const newNode = newVersionNode('自由布局容器', data);
  const hooks = loadScriptHooks({
    'div.jvs-rule-node.ef-node-container.jtk-droppable': [oldNode],
    '.jvs-rule-node.ef-node-container': [oldNode, newNode],
  });

  hooks.adjustInterfaceAndComponentStyle();

  assert.deepEqual(Object.keys(oldNode.style), []);
  assert.equal(newNode.style.backgroundColor, EXPECTED_COLORS.variable);
});

test('宿主结构对不上时退回只按 DOM 文本匹配：有关键词照常上色，没有则不动、不报错', () => {
  const noVm = newVersionNode('查询单条');
  const emptyVm = newVersionNode('自定义组件');
  emptyVm.__vue__ = {};
  const oddData = newVersionNode('自定义组件', { functionName: null, explain: 123 });
  const hooks = loadScriptHooks({
    '.jvs-rule-node.ef-node-container': [noVm, emptyVm, oddData],
  });

  hooks.adjustInterfaceAndComponentStyle();

  assert.equal(noVm.style.backgroundColor, EXPECTED_COLORS.data);
  assert.deepEqual(Object.keys(emptyVm.style), []);
  assert.deepEqual(Object.keys(oddData.style), []);
});
