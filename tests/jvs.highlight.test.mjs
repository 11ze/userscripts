'use strict';

/**
 * highlightApps 星标注入与 filterStarredApps 只看星标过滤测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文:Map 桩 localStorage、最小 DOM 桩
 * （.application 卡片 + 新旧版应用中心容器 + document.body），从 window.__JVS_TEST__
 * 条件钩子取出内部函数。核心锁定「localStorage 是唯一事实来源」：点击时现读
 * 最新状态再切换，多标签页同开不会用旧快照覆盖掉别人写入的。
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
const FILTER_KEY = '__11ze_JVS_STARRED_FILTER__';

/** 通用元素桩：className/classList/attribute/listener 最小闭环 */
function fakeEl() {
  const classes = new Set();
  const attrs = {};
  return {
    className: '',
    title: '',
    type: '',
    innerHTML: '',
    innerText: '',
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
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    click() {
      this.listeners.click({ stopPropagation() {} });
    },
  };
}

/** 页面容器桩（新版 .app-page / 旧版 .template-content-box / 旧版筛选行 .filter-bar）：
    children + 按 class 递归查找 + prepend/append */
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
  };
  return container;
}

function makeCard(name) {
  const card = {
    className: 'application',
    parentElement: null,
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

/** mode：new = 新版应用中心（.app-page 在），old = 旧版（.template-content-box 在），none = 已离开 */
function loadScriptHooks(cards, mode = 'new') {
  const source = fs.readFileSync(sourcePath, 'utf8');

  const store = new Map();
  const appPage = makeContainer();
  const templateBox = makeContainer();
  const filterBar = makeContainer('filter-bar');
  templateBox.append(filterBar); // 旧版筛选行（全部分类 + 搜索框）常驻容器内
  const cardArea = makeContainer('container el-row');
  templateBox.append(cardArea); // 旧版 45 张卡平铺的卡片列表区
  for (const card of cards) {
    card.parentElement = cardArea; // 卡片流所在层 = 第一张卡的父级
    cardArea.append(card);
  }
  const body = fakeEl();
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
        if (selector === '.application') return cards[0] ?? null;
        if (selector === '.app-page') return mode === 'new' ? appPage : null;
        if (selector === '.jvs-layout-tempOpen > .template-content-box') {
          return mode === 'old' ? templateBox : null;
        }
        if (selector === '.ze-star-filter-btn' || selector === '.ze-star-empty-tip') {
          const host = mode === 'new' ? appPage : mode === 'old' ? templateBox : null;
          return host ? host.querySelector(selector) : null;
        }
        return null;
      },
      querySelectorAll: (selector) => (selector === '.application' ? cards : []),
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
    appPage,
    templateBox,
    filterBar,
    cardArea,
    body,
    /** 模拟 SPA 路由切换：进出应用中心、切新旧版容器 */
    setMode: (next) => {
      mode = next;
    },
    /** 模拟旧版异步数据到位：卡片列表 v-for 晚于筛选行渲染 */
    addCard: (card) => {
      cards.push(card);
      card.parentElement = cardArea;
      cardArea.append(card);
    },
    readMarked: () => JSON.parse(store.get(HIGHLIGHT_KEY)),
    writeMarked: (names) => store.set(HIGHLIGHT_KEY, JSON.stringify(names)),
    readFilter: () => JSON.parse(store.get(FILTER_KEY)),
    writeFilter: (value) => store.set(FILTER_KEY, JSON.stringify(value)),
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

test('只看星标开关：注入 pill 与空态提示，状态现读存储同步 body class', () => {
  const card = makeCard('应用C');
  const { hooks, appPage, body, writeFilter } = loadScriptHooks([card]);

  // 默认关：按钮与提示注入，body 无过滤 class
  hooks.filterStarredApps();
  const btn = appPage.querySelector('.ze-star-filter-btn');
  assert.notEqual(btn, null, '开关按钮应注入 app-page');
  assert.notEqual(appPage.querySelector('.ze-star-empty-tip'), null, '空态提示应注入');
  assert.equal(body.classList.contains('ze-star-filter-on'), false);
  assert.equal(btn.getAttribute('aria-pressed'), 'false');

  // 另一标签页写入 true → 本页下一次 tick 跟随（存储是唯一事实来源）
  writeFilter(true);
  hooks.filterStarredApps();
  assert.equal(body.classList.contains('ze-star-filter-on'), true);
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
});

test('旧版应用中心：开关注入筛选行内搜索框右侧，与原生筛选控件同行', () => {
  const card = makeCard('应用C');
  const { hooks, filterBar, cardArea, body, writeFilter } = loadScriptHooks([card], 'old');

  hooks.filterStarredApps();
  const btn = filterBar.querySelector('.ze-star-filter-btn');
  assert.notEqual(btn, null, '旧版开关按钮应注入 .filter-bar（搜索框右侧）');
  assert.notEqual(
    cardArea.querySelector('.ze-star-empty-tip'),
    null,
    '空态提示应注入卡片列表区（空态时卡片全隐藏，提示落进空白区，不顶筛选行）'
  );
  assert.equal(body.classList.contains('ze-star-filter-on'), false);

  writeFilter(true);
  hooks.filterStarredApps();
  assert.equal(body.classList.contains('ze-star-filter-on'), true);

  btn.click();
  assert.equal(body.classList.contains('ze-star-filter-on'), false, '点击应立即关闭');
});

test('旧版卡片未渲染时：先插按钮不插提示，卡片出现后提示落进卡片列表区', () => {
  const card = makeCard('应用C');
  const { hooks, filterBar, templateBox, cardArea, addCard } = loadScriptHooks([], 'old');

  // 首轮 tick：筛选行静态渲染已就位，卡片列表还在等异步数据
  hooks.filterStarredApps();
  assert.notEqual(
    filterBar.querySelector('.ze-star-filter-btn'),
    null,
    '按钮首轮就应注入筛选行（静态标记，无需等卡片）'
  );
  assert.equal(
    templateBox.querySelector('.ze-star-empty-tip'),
    null,
    '卡片未渲染时不得插入提示——旧实现此刻走兜底塞进容器最前，顶到筛选行上方'
  );

  // 异步数据到位（Vuex menuAll）→ 卡片 v-for 渲染 → 下一个 400ms tick
  addCard(card);
  hooks.filterStarredApps();
  const tip = cardArea.querySelector('.ze-star-empty-tip');
  assert.notEqual(tip, null, '卡片出现后提示应插进卡片列表区（第一张卡的父级）');
  assert.equal(
    templateBox.children[0],
    filterBar,
    '筛选行必须仍是容器第一个子节点（提示不得顶到它上方）'
  );
});

test('只看星标开关：点击切换存储并立即同步，不等轮询', () => {
  const card = makeCard('应用C');
  const { hooks, appPage, body, readFilter } = loadScriptHooks([card]);

  hooks.filterStarredApps();
  const btn = appPage.querySelector('.ze-star-filter-btn');

  btn.click();
  assert.equal(readFilter(), true, '点击后存储应翻为 true');
  assert.equal(body.classList.contains('ze-star-filter-on'), true, 'body class 应立即同步');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');

  btn.click();
  assert.equal(readFilter(), false);
  assert.equal(body.classList.contains('ze-star-filter-on'), false);
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
});

test('离开应用中心：body 过滤 class 被清理，不波及其他页面', () => {
  const card = makeCard('应用C');
  const { hooks, body, writeFilter, readFilter, setMode } = loadScriptHooks([card]);

  writeFilter(true);
  hooks.filterStarredApps();
  assert.equal(body.classList.contains('ze-star-filter-on'), true);

  // SPA 路由切走后应用中心容器不存在，下一次 tick 只清理 class
  setMode('none');
  hooks.filterStarredApps();
  assert.equal(body.classList.contains('ze-star-filter-on'), false, '离开后 body class 应被移除');

  // 存储状态不动——回应用中心时开关仍是开的
  assert.equal(readFilter(), true);
});
