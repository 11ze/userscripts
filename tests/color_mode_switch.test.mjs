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

function loadScriptSandbox({ storage, readyState = 'complete' } = {}) {
  const domListeners = new Map();
  const sandbox = {
    console: {
      log() {},
      error() {},
      warn() {},
    },
    localStorage: storage ?? createStorageStub(),
    document: {
      readyState,
      addEventListener(type, handler) {
        domListeners.set(type, handler);
      },
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
  sandbox.__domListeners = domListeners;

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

test('buildReverseColorCss（图标三层反转回归）：容器内 img 豁免媒体双反转', () => {
  const { buildReverseColorCss } = loadScriptHooks();
  const noComments = buildReverseColorCss().replace(/\/\*[^*]*\*\//g, '');
  const rules = [...noComments.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2],
  }));
  const exemption = rules.find(
    (r) => r.selector === "[id='11ze-reverse-color-mode-toggle-container'] img",
  );
  assert.ok(exemption, '容器已带二次反转，容器内 img 再被媒体规则命中会叠成三层（奇数）反转');
  assert.match(exemption.body, /filter:\s*none\s*!important/, '特异性 (0,1,1) 压过媒体规则 img (0,0,1)，图标只受 html+容器两层反转，fill 按原色渲染');
});

test('buildReverseColorCss（选择器合法性回归）：不含数字开头的 ID 选择器', () => {
  const { buildReverseColorCss } = loadScriptHooks();
  const css = buildReverseColorCss();
  assert.ok(!/[#.]11ze/.test(css), '数字开头 ID 是非法 CSS 选择器，会连累整组规则被浏览器丢弃');
});

test('buildReverseColorCss（逃生舱反杀回归）：不含 data-theme / data-color-mode 选择器', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  assert.ok(
    !css.includes('[data-theme]') && !css.includes('[data-color-mode]'),
    '属性选择器特异性 (0,1,0) 高于 html (0,0,1)，挂在 <html> 上的站点整页反转被 filter:none 覆盖失效，图片仍二次反转变负片',
  );
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

test('时序（闪白回归）：document-start 即注样式与菜单，按钮等 DOMContentLoaded', () => {
  const { STORAGE_KEY } = loadScriptHooks();
  const storage = createStorageStub({ [STORAGE_KEY]: 'true' });
  const sandbox = loadScriptSandbox({ storage, readyState: 'loading' });

  assert.equal(sandbox.__styleCalls.length, 1, '样式在 DOM 就绪前已注入');
  assert.ok(sandbox.__menuCommands['切换'], '菜单命令即时注册');
  assert.ok(!getToggleButton(sandbox).container, 'body 未就绪，不挂按钮');

  sandbox.__domListeners.get('DOMContentLoaded')();
  assert.ok(getToggleButton(sandbox).button, 'DOMContentLoaded 后挂载按钮');
});

function readUserScriptHeader() {
  return sourceText.slice(0, sourceText.indexOf('==/UserScript=='));
}

test('元数据（iframe 回归）：头部声明 @noframes', () => {
  assert.ok(readUserScriptHeader().includes('@noframes'));
});

test('元数据（闪白回归）：头部声明 @run-at document-start', () => {
  assert.match(readUserScriptHeader(), /@run-at\s+document-start/);
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

test('图标防站点样式污染：img 内联重置 border/outline/padding/background', () => {
  const icon = getToggleButton(loadScriptSandbox()).button.children[0];
  assert.equal(icon.style.border, 'none', '站点 img { border } 在图标上打出方框');
  assert.equal(icon.style.outline, 'none');
  assert.equal(icon.style.padding, '0');
  assert.equal(icon.style.background, 'none');
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

test('按钮交互：hover 切换透明度（enter/leave 不冒泡）', () => {
  const sandbox = loadScriptSandbox();
  const { container } = getToggleButton(sandbox);

  container.fire('mouseenter');
  assert.equal(container.style.opacity, '1');
  container.fire('mouseleave');
  assert.equal(container.style.opacity, '0.7');

  // mouseover 冒泡会在容器与子按钮间连击抖动，修复后容器不再监听它
  container.fire('mouseover');
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

test('图标颜色（同底隐形回归）：按钮图标 #fff 黑底可见，@icon currentColor 面板可见', () => {
  const { ICON_SUN_DATA_URI } = loadScriptHooks();
  const svg = Buffer.from(ICON_SUN_DATA_URI.split(',')[1], 'base64').toString('utf8');
  assert.ok(
    svg.includes('#fff'),
    'img 加载的 SVG 是独立文档，currentColor 回落黑色，#000 按钮底上不可见',
  );
  // @icon 与按钮图标分家（v0.1.1 曾一刀切 #fff 致 @icon 在油猴浅色面板不可见）
  assert.match(readUserScriptHeader(), /@icon\s+data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+/, '@icon 须为独立 data URI');
  const iconUri = readUserScriptHeader().match(/@icon\s+(data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+)/)[1];
  const iconSvg = Buffer.from(iconUri.split(',')[1], 'base64').toString('utf8');
  assert.ok(iconSvg.includes('currentColor'), '@icon 底是油猴浅色面板，currentColor 回落黑色才可见');

  const { button } = getToggleButton(loadScriptSandbox());
  assert.equal(
    button.style.backgroundColor,
    '#000',
    '按钮只在反转开启时显示；主场景暗转亮，反转后的亮页上黑底白月对比度最高',
  );
  assert.ok(!button.style.boxShadow, '阴影是白底方案在亮页勾边的补偿，黑底不需要');
});
