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

// 按 CSS Filter 的中性灰公式验收实际生成的滤镜；色相旋转不改变中性灰。
function applyNeutralFilter(value, filter) {
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
  assert.ok(Math.abs(applyNeutralFilter(0, pageFilter) - 242.25) < 0.01);
  assert.ok(Math.abs(applyNeutralFilter(255, pageFilter) - 12.75) < 0.01);
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

test('SVG 图标可读：currentColor 图标跟随页面，彩色 SVG 仍抵消反转', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  assert.match(css, /\bsvg\s*,/, '彩色 SVG 默认保留媒体处理');
  const iconRule = css.match(/svg:where\(\[fill="currentColor"\][^{]*\{([^}]+)\}/);
  assert.ok(iconRule, 'currentColor SVG 必须单独处理');
  assert.match(iconRule[0], /\[stroke="currentColor"\]/, '覆盖描边图标');
  assert.match(iconRule[0], /:has\(\[fill="currentColor"\], \[stroke="currentColor"\]\)/, '覆盖内部路径指定 currentColor 的图标');
  assert.match(iconRule[1], /filter:\s*none\s*!important/, '图标只受整页反转');
});

test('混合 SVG 保色：含 currentColor 文字的彩色图表仍按媒体处理', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  const colorRule = css.match(/svg:where\(\[fill\]:not\(\[fill="none"\], \[fill="currentColor"\]\)[^{]+\{([^}]+)\}/);
  assert.ok(colorRule, '显式填色的图表须覆盖 currentColor 图标规则');
  assert.match(colorRule[0], /\[stroke\]:not\(\[stroke="none"\], \[stroke="currentColor"\]\)/);
  const mediaFilter = colorRule[1].match(/filter:\s*([^;]+)/)[1];
  const pageFilter = css.match(/html\s*\{\s*filter:\s*([^;]+)/)[1];
  assert.ok(Math.abs(applyNeutralFilter(applyNeutralFilter(64, mediaFilter), pageFilter) - 64) < 0.01);
  assert.ok(css.indexOf(colorRule[0]) > css.indexOf('svg:where([fill="currentColor"]'), '同等特异性的保色规则须位于图标规则之后');
});

test('嵌套 SVG 保色：只让最外层 SVG 抵消反转', () => {
  const css = loadScriptHooks().buildReverseColorCss();
  assert.match(css, /\bsvg\s*,/);
  assert.match(css, /svg svg\s*\{\s*filter:\s*none\s*!important/, '嵌套 SVG 不能再增加一层反转');
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
