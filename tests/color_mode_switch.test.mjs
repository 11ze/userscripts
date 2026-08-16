'use strict';

/**
 * 反转色模式状态模块测试
 *
 * 通过 vm 桩环境执行 color_mode_switch.user.js 全文，从 window.__COLOR_MODE_SWITCH_TEST__
 * 条件钩子取出 IIFE 内部函数。
 * 见 plans/2026-08-16-color-mode-switch-deepening.md。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/color_mode_switch.user.js');
const sourceText = fs.readFileSync(sourcePath, 'utf8');

function createElementStub(tag) {
  const listeners = new Map();
  return {
    tagName: tag,
    style: {},
    children: [],
    appendChild(child) {
      this.children.push(child);
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    fire(type) {
      listeners.get(type)?.call(this);
    },
  };
}

function createStorageStub(initial = {}) {
  const store = { ...initial };
  return {
    store,
    getItem(key) {
      return key in store ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
  };
}

function loadScriptSandbox({ storage } = {}) {
  const sandbox = {
    console: {
      log() {},
      error() {},
      warn() {},
    },
    localStorage: storage ?? createStorageStub(),
    document: {
      readyState: 'complete',
      addEventListener() {},
      createElement(tag) {
        return createElementStub(tag);
      },
      body: createElementStub('body'),
    },
    __styleCalls: [],
    __styleRemovals: 0,
    GM_addStyle(css) {
      sandbox.__styleCalls.push(css);
      return {
        remove() {
          sandbox.__styleRemovals++;
        },
      };
    },
    __menuCommands: {},
    GM_registerMenuCommand(label, command) {
      sandbox.__menuCommands[label] = command;
    },
    __COLOR_MODE_SWITCH_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(sourceText, sandbox, { filename: 'color_mode_switch.user.js' });

  return sandbox;
}

function loadScriptHooks() {
  return loadScriptSandbox().__COLOR_MODE_SWITCH_TEST__.hooks;
}

test('测试钩子暴露状态模块函数', () => {
  const hooks = loadScriptHooks();
  assert.equal(typeof hooks.readState, 'function');
  assert.equal(typeof hooks.writeState, 'function');
  assert.equal(typeof hooks.buildReverseColorCss, 'function');
});

test('readState：存储值 true 读出开启', () => {
  const { readState, STORAGE_KEY } = loadScriptHooks();
  const storage = createStorageStub({ [STORAGE_KEY]: 'true' });
  assert.equal(readState(storage), true);
});

test('readState：false 与缺省读出关闭', () => {
  const { readState, STORAGE_KEY } = loadScriptHooks();
  assert.equal(readState(createStorageStub({ [STORAGE_KEY]: 'false' })), false);
  assert.equal(readState(createStorageStub()), false);
});

test('readState（隐私模式回归）：getItem 抛异常返回 false', () => {
  const { readState } = loadScriptHooks();
  const brokenStorage = {
    getItem() {
      throw new Error('SecurityError: storage denied');
    },
  };
  assert.equal(readState(brokenStorage), false);
});

test('writeState：写入后存储值正确且返回 true', () => {
  const { writeState, STORAGE_KEY } = loadScriptHooks();
  const storage = createStorageStub();
  assert.equal(writeState(storage, true), true);
  assert.equal(storage.store[STORAGE_KEY], 'true');
  assert.equal(writeState(storage, false), true);
  assert.equal(storage.store[STORAGE_KEY], 'false');
});

test('writeState（写失败回归）：setItem 抛异常返回 false 且存储不变', () => {
  const { writeState, STORAGE_KEY } = loadScriptHooks();
  const storage = createStorageStub({ [STORAGE_KEY]: 'false' });
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  assert.equal(writeState(storage, true), false);
  assert.equal(storage.store[STORAGE_KEY], 'false');
});

test('buildReverseColorCss：html 反转 + 媒体双反转 + 逃生舱', () => {
  const { buildReverseColorCss } = loadScriptHooks();
  const css = buildReverseColorCss();
  assert.ok(css.includes('filter: invert(1) hue-rotate(180deg)'));
  assert.ok(css.includes('img'));
  assert.ok(css.includes('.reverse-color-mode-ignore'));
  assert.ok(css.includes('filter: none'));
});

test('buildReverseColorCss（死规则回归）：不含子集冗余的带冒号选择器', () => {
  const { buildReverseColorCss } = loadScriptHooks();
  assert.ok(!buildReverseColorCss().includes('background-image:'));
});

test('buildReverseColorCss（按钮自反回归）：按钮容器在双反转组内', () => {
  const { buildReverseColorCss } = loadScriptHooks();
  const css = buildReverseColorCss();
  assert.ok(css.includes("[id='11ze-reverse-color-mode-toggle-container']"));
});

test('buildReverseColorCss（选择器合法性回归）：不含数字开头的 ID 选择器', () => {
  const { buildReverseColorCss } = loadScriptHooks();
  const css = buildReverseColorCss();
  assert.ok(!/[#.]11ze/.test(css), '数字开头 ID 是非法 CSS 选择器，会连累整组规则被浏览器丢弃');
});

test('菜单切换：关→开写入存储并注入反转样式，再切回移除', () => {
  const storage = createStorageStub();
  const sandbox = loadScriptSandbox({ storage });
  const { STORAGE_KEY } = sandbox.__COLOR_MODE_SWITCH_TEST__.hooks;

  sandbox.__menuCommands['切换']();
  assert.equal(storage.store[STORAGE_KEY], 'true');
  assert.equal(sandbox.__styleCalls.length, 1);

  sandbox.__menuCommands['切换']();
  assert.equal(sandbox.__styleRemovals, 1);
  assert.equal(sandbox.__styleCalls.length, 1, '关闭不重复注入');
});

test('菜单切换（写失败回归）：存储写失败时不注入样式', () => {
  const storage = createStorageStub();
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  const sandbox = loadScriptSandbox({ storage });

  sandbox.__menuCommands['切换']();
  assert.equal(sandbox.__styleCalls.length, 0, '写失败短路，UI 保持原状');
});

test('初始状态开启：init 即注入反转样式', () => {
  const { STORAGE_KEY } = loadScriptHooks();
  const storage = createStorageStub({ [STORAGE_KEY]: 'true' });
  const sandbox = loadScriptSandbox({ storage });

  assert.equal(sandbox.__styleCalls.length, 1);
});

function readUserScriptHeader() {
  return sourceText.slice(0, sourceText.indexOf('==/UserScript=='));
}

test('元数据（iframe 回归）：头部声明 @noframes', () => {
  assert.ok(readUserScriptHeader().includes('@noframes'));
});

test('元数据：@description 恰一条且含日期', () => {
  const header = readUserScriptHeader();
  assert.equal((header.match(/\/\/ @description/g) ?? []).length, 1);
  assert.match(header, /@description\s+.*\d{4}-\d{2}-\d{2}/);
});

function getToggleButton(sandbox) {
  const container = sandbox.document.body.children.find(
    (child) => child.id === '11ze-reverse-color-mode-toggle-container',
  );
  return { container, button: container?.children[0] };
}

test('按钮挂载：init 后容器挂到 body，内含圆形切换按钮', () => {
  const sandbox = loadScriptSandbox();
  const { container, button } = getToggleButton(sandbox);

  assert.ok(container, '容器应挂载到 body');
  assert.equal(button.tagName, 'button');
  assert.equal(button.id, '11ze-reverse-color-mode-toggle-button');
  assert.equal(button.style.borderRadius, '50%');
});

test('按钮挂载：图标为 img 元素而非 innerHTML 拼串', () => {
  const sandbox = loadScriptSandbox();
  const { button } = getToggleButton(sandbox);

  const icon = button.children[0];
  assert.equal(icon.tagName, 'img');
  assert.ok(icon.src.startsWith('data:image/svg+xml'));
});

test('按钮显隐：初始关闭隐藏，切换后显示、再切换隐藏', () => {
  const sandbox = loadScriptSandbox();
  const { button } = getToggleButton(sandbox);

  assert.equal(button.style.display, 'none');
  sandbox.__menuCommands['切换']();
  assert.equal(button.style.display, 'flex');
  sandbox.__menuCommands['切换']();
  assert.equal(button.style.display, 'none');
});

test('按钮显隐：初始开启时显示', () => {
  const { STORAGE_KEY } = loadScriptHooks();
  const storage = createStorageStub({ [STORAGE_KEY]: 'true' });
  const sandbox = loadScriptSandbox({ storage });

  assert.equal(getToggleButton(sandbox).button.style.display, 'flex');
});

test('按钮交互：hover 切换透明度', () => {
  const sandbox = loadScriptSandbox();
  const { container } = getToggleButton(sandbox);

  container.fire('mouseover');
  assert.equal(container.style.opacity, '1');
  container.fire('mouseout');
  assert.equal(container.style.opacity, '0.7');
});

test('按钮交互：点击按钮等同菜单切换', () => {
  const sandbox = loadScriptSandbox();
  const { button } = getToggleButton(sandbox);

  button.fire('click');
  assert.equal(sandbox.__styleCalls.length, 1);
});

test('样式收编：源码不再含内联 cssText 与 innerHTML 拼串', () => {
  assert.ok(!sourceText.includes('cssText'), '样式应走 STYLES 常量 + setStyles');
  assert.ok(!sourceText.includes('innerHTML'), '图标应走 createEl 构建');
});
