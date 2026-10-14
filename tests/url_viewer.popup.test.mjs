'use strict';

/**
 * popup 开关生命周期测试
 *
 * 通过 vm 桩环境执行 url_viewer.user.js 全文，从 GM_registerMenuCommand 桩
 * 捕获菜单入口、从 document 桩捕获 keydown 入口，在入口行为层面断言：
 * open 幂等（连点菜单不叠层）、任何关路径都成对摘除 document click 监听器。
 * 历史缺陷：幂等检查与 listener 清理各只覆盖一条路径（菜单连点叠同 ID popup、
 * Ctrl+U/关闭钮关闭后旧监听器空转），死 ID 'url-reader-menu-item' 判断恒假。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/url_viewer.user.js');

function makeEl(tag) {
  const el = {
    tagName: tag,
    id: '',
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    children: [],
    rows: [],
    listeners: {},
    parentElement: null,
    appendChild(child) {
      el.children.push(child);
      child.parentElement = el;
      return child;
    },
    remove() {
      const parent = el.parentElement;
      if (parent) {
        const index = parent.children.indexOf(el);
        if (index !== -1) parent.children.splice(index, 1);
      }
      el.parentElement = null;
    },
    addEventListener(type, handler) {
      el.listeners[type] = handler;
    },
    removeEventListener() {},
    insertRow() {
      const row = makeEl('tr');
      const cells = [];
      row.insertCell = (index) => {
        const cell = makeEl('td');
        cells.push(cell);
        row.children.splice(Math.min(index, row.children.length), 0, cell);
        cell.parentElement = row;
        return cell;
      };
      el.children.push(row);
      row.parentElement = el;
      el.rows.push(row);
      return row;
    },
    contains(node) {
      if (el === node) return true;
      return el.children.some(
        (child) => typeof child.contains === 'function' && child.contains(node)
      );
    },
    classList: { add() {}, remove() {}, toggle() {} },
  };
  return el;
}

/** 找子树里第一个匹配的元素（浅遍历整树） */
function findDescendant(root, predicate) {
  for (const child of root.children) {
    if (predicate(child)) return child;
    const found = findDescendant(child, predicate);
    if (found) return found;
  }
  return null;
}

function loadScript() {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const menuCommands = [];
  const docListeners = [];

  const body = makeEl('body');
  const document = {
    createElement: makeEl,
    getElementById: (id) =>
      body.children.find((child) => child.id === id) ?? null,
    addEventListener(type, handler) {
      docListeners.push({ type, handler });
    },
    removeEventListener(type, handler) {
      const index = docListeners.findIndex(
        (entry) => entry.type === type && entry.handler === handler
      );
      if (index !== -1) docListeners.splice(index, 1);
    },
    body,
  };

  const sandbox = {
    console: { log() {}, error() {}, warn() {} },
    URL,
    URLSearchParams,
    setTimeout,
    GM_addStyle() {},
    GM_registerMenuCommand(label, callback) {
      menuCommands.push({ label, callback });
    },
    addEventListener() {},
    document,
    location: {
      href: 'https://example.com/p?x=1#frag#b?y=2',
      reload() {},
    },
    __URL_VIEWER_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'url_viewer.user.js' });

  return {
    body,
    document,
    docListeners,
    openFromMenu: () => menuCommands[0].callback(),
    pressCtrlU: () => {
      const keydown = docListeners.find((entry) => entry.type === 'keydown');
      keydown.handler({ ctrlKey: true, key: 'u', preventDefault() {} });
    },
    clickOutside: () => {
      const click = docListeners.find((entry) => entry.type === 'click');
      click.handler({ target: body });
    },
    popupCount: () =>
      body.children.filter((child) => child.id === '11ze-url-reader-popup')
        .length,
    findCloseButton: (popup) =>
      findDescendant(
        popup,
        (el) => el.tagName === 'button' && el.textContent === '关闭（Ctrl + U）'
      ),
    clickListeners: () =>
      docListeners.filter((entry) => entry.type === 'click').length,
  };
}

test('菜单连点两次不叠层：body 里始终只有一个 popup', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  viewer.openFromMenu();

  assert.equal(viewer.popupCount(), 1);
});

test('Ctrl+U 关闭后 document 上无残留 click 监听器', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  assert.equal(viewer.clickListeners(), 1);

  viewer.pressCtrlU();
  assert.equal(viewer.popupCount(), 0);
  assert.equal(viewer.clickListeners(), 0);
});

test('关闭钮关闭后 popup 移除且 click 监听器成对摘除', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  const popup = viewer.body.children.find(
    (child) => child.id === '11ze-url-reader-popup'
  );
  const closeButton = viewer.findCloseButton(popup);
  closeButton.onclick();

  assert.equal(viewer.popupCount(), 0);
  assert.equal(viewer.clickListeners(), 0);
});

test('点外部关闭后 click 监听器成对摘除', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  viewer.clickOutside();

  assert.equal(viewer.popupCount(), 0);
  assert.equal(viewer.clickListeners(), 0);
});
