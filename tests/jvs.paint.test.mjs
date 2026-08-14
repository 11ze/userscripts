'use strict';

/**
 * paintComponents 组件上色机制测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文，querySelectorAll 返回假元素
 * （带 innerText / textContent / style），从 window.__JVS_TEST__ 条件钩子
 * 取出 paintComponents。见 plans/2026-08-14-candidate-7-component-colors.md。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

// 颜色值钉住源码 COLORS.component 字面量
const EXPECTED_COLORS = {
  data: '#FFD6E7',
  logic: '#D6E4FF',
  loop: '#D9F7D9',
  warning: '#FEF0C7',
  variable: '#EFDBFF',
};

function fakeComponent({ innerText = '', textContent = '' } = {}) {
  return { innerText, textContent, style: {} };
}

function loadScriptHooks(fakeDom) {
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
      querySelectorAll: (selector) => fakeDom[selector] ?? [],
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
