'use strict';

/**
 * toggleAppCenterSidebar 应用中心侧边栏展开/收起测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文：Map 桩 localStorage、最小 DOM 桩
 * （.sidebar-col 分类栏 + 其父容器 + document.body），从 window.__JVS_TEST__
 * 条件钩子取出内部函数。核心锁定「localStorage 是唯一事实来源」：JS 只产出
 * body class，收起/展开的视觉全由 CSS 承担。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

const SIDEBAR_KEY = '__11ze_JVS_APPCENTER_SIDEBAR_COLLAPSED__';

/** 通用元素桩：className/classList/attribute/listener/style/rect 最小闭环 */
function fakeEl() {
  const classes = new Set();
  const attrs = {};
  return {
    className: '',
    innerText: '',
    style: {},
    parentElement: null,
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name),
    },
    setAttribute(key, value) {
      attrs[key] = String(value);
    },
    getAttribute: (key) => attrs[key],
    getBoundingClientRect: () => ({ right: 213 }),
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    click() {
      this.listeners.click({});
    },
  };
}

/** 容器桩：children + 按 class 直接查找 + append/appendChild（按钮只挂直接子级） */
function makeContainer(className = null) {
  const container = {
    className,
    children: [],
    querySelector(selector) {
      const wanted = selector.slice(1);
      const direct = container.children.find(
        (child) =>
          typeof child.className === 'string' &&
          child.className.split(' ').includes(wanted)
      );
      return direct ?? null;
    },
    append(...nodes) {
      container.children.push(...nodes);
    },
    appendChild(node) {
      container.append(node);
    },
  };
  return container;
}

/** center：应用中心在否（.sidebar-col 存在 = 按钮宿主容器在，SPA 离开 = 全没了） */
function loadScriptHooks() {
  const source = fs.readFileSync(sourcePath, 'utf8');

  const store = new Map();
  const sidebar = fakeEl();
  sidebar.className = 'sidebar-col el-col el-col-8';
  const host = makeContainer('container el-row');
  host.append(sidebar);
  sidebar.parentElement = host;
  const body = fakeEl();
  let center = true;

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
      querySelector: (selector) => {
        if (selector === '.sidebar-col') return center ? sidebar : null;
        if (selector === '.ze-side-toggle-btn') {
          return center ? host.querySelector(selector) : null;
        }
        return null;
      },
      querySelectorAll: () => [],
      createElement: () => fakeEl(),
      getElementById: () => null,
      addEventListener() {},
      body,
    },
    __JVS_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'jvs.user.js' });

  return {
    hooks: sandbox.__JVS_TEST__.hooks,
    sidebar,
    host,
    body,
    /** 模拟 SPA 路由切换：离开应用中心后宿主容器随 DOM 销毁 */
    setInCenter: (next) => {
      center = next;
      if (!next) host.children.splice(0);
    },
    readCollapsed: () => JSON.parse(store.get(SIDEBAR_KEY)),
    writeCollapsed: (value) => store.set(SIDEBAR_KEY, JSON.stringify(value)),
    countBtns: () =>
      host.children.filter(
        (child) =>
          typeof child.className === 'string' &&
          child.className.split(' ').includes('ze-side-toggle-btn')
      ).length,
  };
}

test('脚本暴露 toggleAppCenterSidebar 测试钩子', () => {
  const { hooks } = loadScriptHooks();
  assert.equal(typeof hooks.toggleAppCenterSidebar, 'function');
});

test('进入应用中心：注入收起按钮，默认展开态', () => {
  const { hooks, host, body } = loadScriptHooks();

  hooks.toggleAppCenterSidebar();
  const btn = host.querySelector('.ze-side-toggle-btn');
  assert.notEqual(btn, null, '收起按钮应注入 sidebar 父级容器');
  assert.equal(body.classList.contains('ze-appcenter-side-collapsed'), false);
  assert.equal(btn.innerText, '«', '展开态文案应为 «');
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.equal(btn.style.left, '197px', '展开态应骑在侧边栏右缘（213-16）');
});

test('点击收起：存储与 body class 立即同步，按钮变 » 贴左缘', () => {
  const { hooks, host, body, readCollapsed } = loadScriptHooks();

  hooks.toggleAppCenterSidebar();
  const btn = host.querySelector('.ze-side-toggle-btn');

  btn.click();
  assert.equal(readCollapsed(), true, '点击后存储应翻为 true');
  assert.equal(body.classList.contains('ze-appcenter-side-collapsed'), true, 'body class 应立即同步');
  assert.equal(btn.innerText, '»', '收起态文案应为 »');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  assert.equal(btn.style.left, '6px', '收起态应贴屏幕左缘');

  btn.click();
  assert.equal(readCollapsed(), false);
  assert.equal(body.classList.contains('ze-appcenter-side-collapsed'), false);
  assert.equal(btn.innerText, '«');
});

test('刷新后保持收起：预置存储，一次 tick 恢复收起态', () => {
  const { hooks, host, body, writeCollapsed } = loadScriptHooks();

  writeCollapsed(true);
  hooks.toggleAppCenterSidebar();
  assert.equal(
    body.classList.contains('ze-appcenter-side-collapsed'),
    true,
    '存储为收起时 body class 应恢复'
  );
  assert.equal(host.querySelector('.ze-side-toggle-btn').innerText, '»');
});

test('离开应用中心：body class 清理，存储保留', () => {
  const { hooks, body, readCollapsed, writeCollapsed, setInCenter } = loadScriptHooks();

  writeCollapsed(true);
  hooks.toggleAppCenterSidebar();
  assert.equal(body.classList.contains('ze-appcenter-side-collapsed'), true);

  // SPA 路由切走后宿主容器销毁，下一次 tick 只清理 class
  setInCenter(false);
  hooks.toggleAppCenterSidebar();
  assert.equal(body.classList.contains('ze-appcenter-side-collapsed'), false, '离开后 body class 应被移除');

  // 存储状态不动——回到应用中心时仍是收起
  assert.equal(readCollapsed(), true);
});

test('轮询判重：按钮不重复注入', () => {
  const { hooks, countBtns } = loadScriptHooks();

  hooks.toggleAppCenterSidebar();
  hooks.toggleAppCenterSidebar();
  assert.equal(countBtns(), 1);
});
