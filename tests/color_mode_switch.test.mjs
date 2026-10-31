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
  const attributes = new Map();
  const style = {
    setProperty(name, value, priority = '') {
      if (value === '') this.removeProperty(name);
      else { this[name] = value; this[`${name}:priority`] = priority; }
    },
    getPropertyValue(name) { return this[name] ?? ''; },
    getPropertyPriority(name) { return this[`${name}:priority`] ?? ''; },
    removeProperty(name) { delete this[name]; delete this[`${name}:priority`]; },
  };
  return {
    tagName: tag,
    nodeType: 1,
    style,
    children: [],
    isConnected: true,
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) {
      return name === 'style' ? JSON.stringify(style) : attributes.get(name) ?? null;
    },
    matches(selector) {
      return selector.split(',').some((name) => name.trim() === '*' || name.trim() === tag);
    },
    querySelectorAll(selector) {
      return this.children.flatMap((child) => [
        ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
      ]);
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; },
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
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

function loadScriptSandbox({ storage, readyState = 'complete', media = [] } = {}) {
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
      querySelectorAll(selector) { return this.body.querySelectorAll(selector); },
    },
    getComputedStyle(element) {
      const filter = element.style.filter === 'inherit' ? element.parentElement.style.filter : element.style.filter;
      return { filter: filter ?? element.__filter ?? 'none', fill: element.__fill ?? 'rgb(0, 0, 0)', stroke: element.__stroke ?? 'none' };
    },
    __observers: [],
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
  sandbox.MutationObserver = class {
    constructor(callback) { this.callback = callback; sandbox.__observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  for (const element of media) sandbox.document.body.appendChild(element);

  vm.createContext(sandbox);
  vm.runInContext(sourceText, sandbox, { filename: 'color_mode_switch.user.js' });

  return sandbox;
}

function loadScriptHooks() {
  return loadScriptSandbox().__COLOR_MODE_SWITCH_TEST__.hooks;
}

// 按 CSS Filter 的中性灰公式验收实际生成的滤镜；色相旋转不改变中性灰。
function applyNeutralFilter(value, filter) {
  filter = filter.replace(/var\(--11ze-original-filter,\s*\)/g, '');
  for (const [, name, amount] of filter.matchAll(/([\w-]+)\(([^)]+)\)/g)) {
    assert.ok(['invert', 'contrast', 'hue-rotate'].includes(name), `未支持的验收滤镜：${name}`);
    if (name === 'invert') value = value + (255 - 2 * value) * Number(amount);
    if (name === 'contrast') value = (value - 127.5) * Number(amount) + 127.5;
    value = Math.max(0, Math.min(255, value));
  }
  return value;
}

test('柔化亮暗端点：纯黑转柔白，纯白转近黑，中灰保持中灰', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  const pageFilter = css.match(/html\s*\{\s*filter:\s*([^;]+)/)[1];
  assert.ok(Math.abs(applyNeutralFilter(0, pageFilter) - 248.625) < 0.01);
  assert.ok(Math.abs(applyNeutralFilter(255, pageFilter) - 6.375) < 0.01);
  assert.ok(Math.abs(applyNeutralFilter(127.5, pageFilter) - 127.5) < 0.01);
});

test('媒体补偿：页面柔化后，照片与按钮的中间灰阶不随页面变灰', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  const pageFilter = css.match(/html\s*\{\s*filter:\s*([^;]+)/)[1];
  const mediaFilter = css.match(/img, video[^{}]+\{\s*filter:\s*([^;]+)/)[1];
  for (const value of [32, 64, 128, 192, 224]) {
    const result = applyNeutralFilter(applyNeutralFilter(value, mediaFilter), pageFilter);
    assert.ok(Math.abs(result - value) < 0.01, `灰阶 ${value} 不应改变，实际为 ${result}`);
  }
});

test('全屏视频：顶层内容只保留站点滤镜，不再叠加媒体补偿', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  const fullscreenRule = css.match(/:fullscreen,[^{]+\{([^}]+)\}/);
  assert.ok(fullscreenRule, '全屏内容脱离根滤镜后，必须撤掉反向补偿');
  assert.match(fullscreenRule[0], /:fullscreen :is\(img, video, iframe, canvas, svg\)/, '覆盖全屏容器内的媒体');
  assert.match(fullscreenRule[1], /filter:\s*var\(--11ze-original-filter, none\)\s*!important/);
});

test('原有媒体滤镜：启用时保留灰度，关闭时清理脚本属性且不改站点样式', () => {
  const photo = createElementStub('img');
  photo.style.filter = 'grayscale(1)';
  const sandbox = loadScriptSandbox({ media: [photo] });
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  const css = sandbox.__styleCalls[0];
  assert.match(css, /filter:\s*var\(--11ze-original-filter,\s*\)\s+contrast\(/, '站点滤镜须先执行，再做媒体补偿');
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.filter, 'grayscale(1)');
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), '');
  assert.equal(sandbox.__observers[0].disconnected, true);
});

test('原有 important 滤镜：补偿生效且关闭后还原内联值与优先级', () => {
  const photo = createElementStub('img');
  photo.style.setProperty('filter', 'grayscale(1)', 'important');
  const sandbox = loadScriptSandbox({ media: [photo] });
  sandbox.__menuCommands['切换']();
  assert.match(photo.style.filter, /var\(--11ze-original-filter,\s*\).*contrast\(/, '内联 important 不能挡住媒体补偿');
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.filter, 'grayscale(1)');
  assert.equal(photo.style.getPropertyPriority('filter'), 'important');
});

test('样式表 important 滤镜：采集计算值并用内联补偿，关闭后不留 filter 声明', () => {
  const photo = createElementStub('img');
  photo.__filter = 'grayscale(1)';
  const sandbox = loadScriptSandbox({ media: [photo] });
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  assert.match(photo.style.filter, /var\(--11ze-original-filter,\s*\).*contrast\(/);
  assert.equal(photo.style.getPropertyPriority('filter'), 'important');
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.getPropertyValue('filter'), '');
});

test('动态媒体：追加图片、修改滤镜及移除元素时同步并清理', () => {
  const sandbox = loadScriptSandbox();
  sandbox.__menuCommands['切换']();
  const photo = createElementStub('img');
  photo.style.filter = 'blur(2px)';
  sandbox.document.body.appendChild(photo);
  const observer = sandbox.__observers[0];
  observer.callback([{ type: 'childList', target: sandbox.document.body, addedNodes: [photo] }]);
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'blur(2px)');
  photo.style.filter = 'grayscale(1)';
  observer.callback([{ type: 'attributes', attributeName: 'style', target: photo }]);
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  photo.isConnected = false;
  observer.callback([{ type: 'childList', target: sandbox.document.body, addedNodes: [] }]);
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), '');
  assert.equal(photo.style.filter, 'grayscale(1)');
});

test('动态 SVG：内部路径改为彩色后撤掉单色标记', () => {
  const icon = createElementStub('svg');
  const shape = createElementStub('path');
  shape.__fill = 'rgb(255, 255, 255)';
  icon.appendChild(shape);
  const sandbox = loadScriptSandbox({ media: [icon] });
  sandbox.__menuCommands['切换']();
  assert.equal(icon.getAttribute('data-11ze-monochrome'), '');
  shape.__fill = 'rgb(255, 0, 0)';
  sandbox.__observers[0].callback([{ type: 'attributes', attributeName: 'fill', target: shape }]);
  assert.equal(icon.getAttribute('data-11ze-monochrome'), null);
});

test('全屏切换：进入时撤掉补偿，退出时恢复，原有 important 滤镜保持不变', () => {
  const video = createElementStub('video');
  video.style.setProperty('filter', 'grayscale(1)', 'important');
  const sandbox = loadScriptSandbox({ media: [video] });
  sandbox.__menuCommands['切换']();
  const normalFilter = video.style.filter;
  sandbox.document.fullscreenElement = video;
  sandbox.__domListeners.get('fullscreenchange')();
  assert.equal(video.style.filter, 'var(--11ze-original-filter, none)');
  assert.equal(video.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  sandbox.document.fullscreenElement = null;
  sandbox.__domListeners.get('fullscreenchange')();
  assert.equal(video.style.filter, normalFilter);
  sandbox.__menuCommands['切换']();
  assert.equal(video.style.filter, 'grayscale(1)');
});

test('滤镜更新：不采集自己的补偿，保留站点的新值和关闭前尚未处理的修改', () => {
  const photo = createElementStub('img');
  photo.style.setProperty('filter', 'grayscale(1)', 'important');
  const sandbox = loadScriptSandbox({ media: [photo] });
  sandbox.__menuCommands['切换']();
  const observer = sandbox.__observers[0];
  observer.callback([{ type: 'attributes', attributeName: 'style', target: photo }]);
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  photo.style.setProperty('filter', 'blur(2px)', 'important');
  observer.callback([{ type: 'attributes', attributeName: 'style', target: photo }]);
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'blur(2px)');
  photo.style.setProperty('filter', 'sepia(1)', 'important');
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.filter, 'sepia(1)', '关闭不能覆盖站点刚写入的新值');
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), '');
});

test('迟到的样式表：加载后重新采集站点滤镜', () => {
  const photo = createElementStub('img');
  const sandbox = loadScriptSandbox({ media: [photo] });
  sandbox.__menuCommands['切换']();
  photo.__filter = 'grayscale(1)';
  sandbox.__domListeners.get('load')({ target: { tagName: 'LINK' } });
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
});

test('删除样式节点：重读 head 子树外的图片并撤掉已失效的灰度', () => {
  const photo = createElementStub('img');
  photo.__filter = 'grayscale(1)';
  const sandbox = loadScriptSandbox({ media: [photo] });
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  photo.__filter = 'none';
  sandbox.__observers[0].callback([{
    type: 'childList', target: createElementStub('head'),
    addedNodes: [], removedNodes: [createElementStub('style')],
  }]);
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'initial');
});

test('相邻元素 class 改动：重读目标子树外新匹配滤镜的图片', () => {
  const photo = createElementStub('img');
  const sibling = createElementStub('div');
  const sandbox = loadScriptSandbox({ media: [photo] });
  sandbox.document.body.appendChild(sibling);
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'initial');
  photo.__filter = 'blur(2px)';
  sandbox.__observers[0].callback([{ type: 'attributes', attributeName: 'class', target: sibling }]);
  assert.equal(photo.style.getPropertyValue('--11ze-original-filter'), 'blur(2px)');
  sandbox.__menuCommands['切换']();
  assert.equal(photo.style.getPropertyValue('filter'), '');
});

test('全页重读：全屏容器本身的站点滤镜也必须更新', () => {
  const container = createElementStub('div');
  container.__filter = 'grayscale(1)';
  container.appendChild(createElementStub('video'));
  const sandbox = loadScriptSandbox({ media: [container] });
  sandbox.__menuCommands['切换']();
  sandbox.document.fullscreenElement = container;
  sandbox.__domListeners.get('fullscreenchange')();
  assert.equal(container.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  container.__filter = 'blur(2px)';
  sandbox.__observers[0].callback([{ type: 'attributes', attributeName: 'class', target: container }]);
  assert.equal(container.style.getPropertyValue('--11ze-original-filter'), 'blur(2px)');
});

test('嵌套媒体继承滤镜：先还原整批原始声明，再读取子元素计算值', () => {
  const outer = createElementStub('svg');
  outer.style.filter = 'grayscale(1)';
  const inner = createElementStub('svg');
  inner.style.filter = 'inherit';
  outer.appendChild(inner);
  const sandbox = loadScriptSandbox({ media: [outer] });
  sandbox.__menuCommands['切换']();
  assert.equal(inner.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  // 重新采集时也不能读到父元素已经挂上的脚本补偿。
  sandbox.__observers[0].callback([{ type: 'attributes', attributeName: 'class', target: outer }]);
  assert.equal(inner.style.getPropertyValue('--11ze-original-filter'), 'grayscale(1)');
  sandbox.__menuCommands['切换']();
  assert.equal(inner.style.filter, 'inherit');
});

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
  assert.ok(css.includes('var(--11ze-original-filter, none)'));
});

test('picture 图片保色：只给 img 抵消反转，不给 picture 包装层加滤镜', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  assert.match(css, /\bimg\s*,/, '实际承载图片的 img 仍须抵消整页反转');
  assert.doesNotMatch(css, /\bpicture\s*[,\{]/, 'picture 与 img 同时反转会让图片再次变成负片');
});

test('背景图容器可读：不对带文字的背景图容器整体抵消反转', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  assert.match(css, /html\s*\{\s*filter:/, '整页仍执行反转');
  assert.doesNotMatch(css, /\[style\*=["']background-image["']\]/, '背景图选择器会连同正文一起抵消反转');
});

test('SVG 图标可读：计算后的黑、白与灰色图标跟随页面变色', () => {
  for (const paint of ['rgb(255, 255, 255)', 'rgb(0, 0, 0)', 'rgb(184, 184, 184)']) {
    const icon = createElementStub('svg');
    icon.__fill = paint;
    const sandbox = loadScriptSandbox({ media: [icon] });
    sandbox.__menuCommands['切换']();
    assert.equal(icon.getAttribute('data-11ze-monochrome'), '', `单色图标 ${paint} 应跟随页面变色`);
    sandbox.__menuCommands['切换']();
    assert.equal(icon.getAttribute('data-11ze-monochrome'), null, '关闭时移除脚本标记');
  }
});

test('混合 SVG 保色：含 currentColor 文字的彩色图表仍按媒体处理', () => {
  const chart = createElementStub('svg');
  const label = createElementStub('text');
  label.__fill = 'rgb(229, 229, 229)';
  const bar = createElementStub('rect');
  bar.__fill = 'rgb(66, 134, 96)';
  chart.appendChild(label);
  chart.appendChild(bar);
  const sandbox = loadScriptSandbox({ media: [chart] });
  sandbox.__menuCommands['切换']();
  assert.equal(chart.getAttribute('data-11ze-monochrome'), null, '彩色图表不能按单色图标处理');
});

test('嵌套 SVG 保色：只让最外层 SVG 抵消反转', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  assert.match(css, /\bsvg\s*,/);
  assert.match(css, /svg svg\s*\{\s*filter:\s*var\(--11ze-original-filter, none\)\s*!important/, '嵌套 SVG 只保留站点滤镜');
});

test('设计稿只保留改进后的 index.html，并运行当前脚本快照', () => {
  const previewPath = path.join(currentDir, '../designs/color-mode-switch/index.html');
  const preview = fs.readFileSync(previewPath, 'utf8');
  const snapshot = preview.match(/<script id="script-source" type="application\/json">([^]*?)<\/script>/);
  assert.ok(snapshot, 'index.html 应运行实际脚本');
  assert.equal(JSON.parse(snapshot[1]), sourceText, '脚本变更后必须同步设计稿');
  const drafts = fs.readdirSync(path.dirname(previewPath)).filter((name) => /\.(html|jsx)$/.test(name));
  assert.deepEqual(drafts, ['index.html'], '移除旧稿、对照稿及不再使用的画布文件');
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
  assert.match(exemption.body, /filter:\s*var\(--11ze-original-filter, none\)\s*!important/, '图标只保留站点滤镜，不再增加媒体补偿');
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
});

test('按钮样式（暗页隐身回归）：黑底加发丝描边与阴影，hover 有过渡', () => {
  const { button } = getToggleButton(loadScriptSandbox());

  // v0.1.2 黑底唯一隐身场景是反转后暗页（亮站转暗，罕用），v0.1.3 定稿墨盘：
  // 描边让黑钮在暗页上勾出边界，阴影让黑钮在反转后亮页上不悬空
  assert.equal(
    button.style.border,
    '1px solid rgba(255, 255, 255, 0.22)',
    '发丝描边是暗页存活的唯一手段，删掉即回归隐身',
  );
  assert.ok(button.style.boxShadow);
  assert.match(button.style.transition, /transform/, 'hover 上浮需要过渡');
});

test('按钮交互：hover 三联动（上浮/描边亮），替代旧透明度契约', () => {
  const sandbox = loadScriptSandbox();
  const { container, button } = getToggleButton(sandbox);

  container.fire('mouseenter');
  assert.equal(button.style.transform, 'translateY(-2px)');
  assert.equal(button.style.borderColor, 'rgba(255, 255, 255, 0.55)');
  container.fire('mouseleave');
  assert.equal(button.style.transform, 'none');
  assert.equal(button.style.borderColor, 'rgba(255, 255, 255, 0.22)');

  // 旧契约（常态 0.7 透明度）已随定稿移除：0.7 会把发丝描边压没，暗页存活失效
  assert.equal(container.style.opacity, undefined);

  // mouseover 冒泡会在容器与子按钮间连击抖动，容器不监听它
  container.fire('mouseover');
  assert.equal(button.style.transform, 'none');
});

test('按钮交互：tooltip 挂 button 内，hover 浮出「还原配色」', () => {
  const sandbox = loadScriptSandbox();
  const { button } = getToggleButton(sandbox);

  const tooltip = button.children[1];
  assert.ok(tooltip, 'tooltip 应在 button 内（display:none 级联隐藏、随按钮位移）');
  assert.equal(tooltip.tagName, 'span');
  assert.equal(tooltip.textContent, '还原配色');
  assert.equal(tooltip.style.opacity, '0', '常态隐藏');
  assert.equal(tooltip.style.pointerEvents, 'none', '不参与 hover，防容器间连击');

  containerFire(sandbox, 'mouseenter');
  assert.equal(tooltip.style.opacity, '1');
  containerFire(sandbox, 'mouseleave');
  assert.equal(tooltip.style.opacity, '0');
});

test('tooltip 样式（暗页可读回归）：黑底气泡自带描边', () => {
  const { button } = getToggleButton(loadScriptSandbox());
  const tooltip = button.children[1];
  assert.ok(
    tooltip.style.border,
    '反转后暗页上黑底气泡无描边则边界不可见（与按钮描边同理）',
  );
});

function containerFire(sandbox, type) {
  const { container } = getToggleButton(sandbox);
  container.fire(type);
}

test('图标形状锁：@icon 与 ICON_SUN_DATA_URI 剥 fill 后逐字节一致', () => {
  const { ICON_SUN_DATA_URI } = loadScriptHooks();
  const iconUri = readUserScriptHeader().match(
    /@icon\s+(data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+)/
  )[1];
  // 两串只许 fill 不同：改月亮路径改一漏一，此断言变红（v0.1.2 整版还过这笔债）
  const shapeOnly = (uri) =>
    Buffer.from(uri.split(',')[1], 'base64')
      .toString('utf8')
      .replace(/fill="[^"]*"/, 'fill="X"');

  assert.equal(shapeOnly(iconUri), shapeOnly(ICON_SUN_DATA_URI));
});
