'use strict';

/**
 * highlightApps 星标注入与存储联动测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文:Map 桩 localStorage、最小 DOM 桩
 * （.application 卡片 + 可点击的星标按钮），从 window.__JVS_TEST__ 条件钩子
 * 取出 highlightApps。核心锁定「localStorage 是唯一事实来源」：点击时现读
 * 最新列表再增删，多标签页同开不会用旧快照覆盖掉别人写入的星标。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

const HIGHLIGHT_KEY = '__11ze_HIGHLIGHT_APPS__';

function makeStarButton() {
  const classes = new Set();
  return {
    className: '',
    title: '',
    innerHTML: '',
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains: (name) => classes.has(name),
    },
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    click() {
      this.listeners.click({ stopPropagation() {} });
    },
  };
}

function makeCard(name) {
  const card = {
    star: null,
    querySelector(selector) {
      if (selector === '.ze-star-btn') return card.star;
      if (selector === 'div > div > div > p') return { innerText: name };
      return null;
    },
    appendChild(child) {
      card.star = child;
    },
  };
  return card;
}

function loadScriptHooks(cards) {
  const source = fs.readFileSync(sourcePath, 'utf8');

  const store = new Map();
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
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    GM_addStyle() {},
    location: { href: 'https://jvs.example.com/#/wel/index' },
    addEventListener() {},
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: (selector) => (selector === '.application' ? cards[0] ?? null : null),
      querySelectorAll: (selector) => (selector === '.application' ? cards : []),
      createElement: () => makeStarButton(),
      getElementById: () => null,
      addEventListener() {},
    },
    __JVS_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'jvs.user.js' });

  return {
    hooks: sandbox.__JVS_TEST__.hooks,
    readMarked: () => JSON.parse(store.get(HIGHLIGHT_KEY)),
    writeMarked: (names) => store.set(HIGHLIGHT_KEY, JSON.stringify(names)),
  };
}

test('脚本暴露 highlightApps 测试钩子', () => {
  const { hooks } = loadScriptHooks([]);
  assert.equal(typeof hooks.highlightApps, 'function');
});

test('点击加星：另一标签页已写入的星标不被旧快照覆盖', () => {
  const card = makeCard('应用C');
  const { hooks, readMarked, writeMarked } = loadScriptHooks([card]);
  writeMarked(['应用A']);

  hooks.highlightApps(); // 先执行一次——旧实现此刻闭包已持列表快照，现实现现读存储、不持快照
  writeMarked(['应用A', '应用B']); // 模拟另一标签页标记了 应用B
  card.star.click(); // 本页给 应用C 点星

  assert.deepEqual(readMarked(), ['应用A', '应用B', '应用C']);
});

test('点击取消星标：另一标签页已写入的星标不被旧快照覆盖', () => {
  const card = makeCard('应用C');
  const { hooks, readMarked, writeMarked } = loadScriptHooks([card]);
  writeMarked(['应用C']);

  hooks.highlightApps();
  writeMarked(['应用C', '应用B']); // 另一标签页标记了 应用B
  card.star.click(); // 本页取消 应用C

  assert.deepEqual(readMarked(), ['应用B']);
});

test('再次执行（轮询）时渲染跟随最新存储', () => {
  const card = makeCard('应用C');
  const { hooks, writeMarked } = loadScriptHooks([card]);

  hooks.highlightApps();
  assert.equal(card.star.classList.contains('ze-marked'), false);

  writeMarked(['应用C']);
  hooks.highlightApps(); // 400ms 轮询的下一次
  assert.equal(card.star.classList.contains('ze-marked'), true);
});

test('点击后立即刷新当前卡片星标，不等轮询', () => {
  const card = makeCard('应用C');
  const { hooks, readMarked } = loadScriptHooks([card]);

  hooks.highlightApps();
  card.star.click();
  assert.equal(card.star.classList.contains('ze-marked'), true);
  assert.deepEqual(readMarked(), ['应用C']);

  card.star.click();
  assert.equal(card.star.classList.contains('ze-marked'), false);
  assert.deepEqual(readMarked(), []);
});
