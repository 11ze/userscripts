'use strict';

/**
 * jvs 测试共享 harness
 *
 * vm 桩环境执行 jvs.user.js 全文（isJVS 走 JVS 分支完成初始化），
 * 从 window.__JVS_TEST__ 条件钩子取出 IIFE 内部函数（浏览器中该钩子永不激活）。
 * 各测试文件用 overrides 覆盖默认桩（如带路由的 document.querySelector）。
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

/** Map 版 localStorage 桩，可断言存储字节 */
export function makeStorageStub() {
  const store = new Map();
  return {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    store,
  };
}

/** 通用元素桩：className/classList/attribute/listener/style 最小闭环 */
export function makeFakeEl() {
  const classes = new Set();
  const attrs = {};
  return {
    className: '',
    title: '',
    type: '',
    innerHTML: '',
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
    getBoundingClientRect: () => ({ right: 0 }),
    listeners: {},
    children: [],
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    click() {
      this.listeners.click({ stopPropagation() {} });
    },
  };
}

/** 容器桩：children + 按 class 递归查找 + prepend/append/appendChild */
export function makeContainer(className = null) {
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
      if (direct) return direct;
      for (const child of container.children) {
        if (typeof child.querySelector === 'function') {
          const found = child.querySelector(selector);
          if (found) return found;
        }
      }
      return null;
    },
    prepend(...nodes) {
      container.children.unshift(...nodes);
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

/**
 * 默认桩环境执行脚本全文，返回 { hooks, sandbox, store }
 * overrides 浅合并进沙箱（后写覆盖），不含 window（强制指向沙箱自身）
 */
export function loadJvsHooks(overrides = {}) {
  const { localStorage, store } = makeStorageStub();
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
    localStorage,
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
    ...overrides,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), sandbox, {
    filename: 'jvs.user.js',
  });

  return { hooks: sandbox.__JVS_TEST__.hooks, sandbox, store };
}
