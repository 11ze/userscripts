'use strict';

/**
 * getTabType 页面类型判定测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文，querySelector 按选择器映射返回假元素，
 * 从 window.__JVS_TEST__ 条件钩子取出 getTabType。
 * 浏览器中该钩子永不激活。
 *
 * 背景：旧版 JVS 的非设计页面上 #tab-design 页签残留（span 文本「逻辑设计」），
 * 导致 changeTitle 误把 favicon 换成「逻」图标——判定必须先确认当前页面真是设计器。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

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
      querySelector: (selector) => fakeDom[selector] ?? null,
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

function fakeSpan(text) {
  return { textContent: text };
}

test('设计器页面：有设计器头部时返回 #tab-design 的设计类型', () => {
  const hooks = loadScriptHooks({
    '.design-header-box': {},
    '#tab-design > span': fakeSpan('逻辑设计'),
  });
  assert.equal(hooks.getTabType(), '逻辑设计');
});

test('旧版 JVS 非设计页面：页签残留「逻辑设计」但无设计器头部，返回空', () => {
  const hooks = loadScriptHooks({
    '#tab-design > span': fakeSpan('逻辑设计'),
  });
  assert.equal(hooks.getTabType(), '');
});

test('#tab-design 文本不是四种设计类型时返回空', () => {
  const hooks = loadScriptHooks({
    '.design-header-box': {},
    '#tab-design > span': fakeSpan('页面设计'),
  });
  assert.equal(hooks.getTabType(), '');
});

test('页面上没有 #tab-design 时返回空', () => {
  const hooks = loadScriptHooks({
    '.design-header-box': {},
  });
  assert.equal(hooks.getTabType(), '');
});
