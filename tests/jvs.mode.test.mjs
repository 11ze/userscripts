'use strict';

/**
 * 模式读写分离与色板单源测试
 *
 * collectAppMode（采集：读 DOM 模式项 + 值变才写目录）与 currentMode（唯一入口：
 * 历史目录优先、未命中走采集）分离——「当前模式」的真实接口不再手抄组合。
 * MODE_COLORS 单一事实源同时投影日志表格行色（getModeColor）与按钮整钮
 * 换色 CSS（buildModeColorCss），两处色板不再并存。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeStorageStub } from './jvs-harness.mjs';

const MODE_MAP_KEY = '__11ze_JVS_APP_MODE_MAP__';

/** 带 .system-list 的桩环境：mode null = 无侧栏（采集返回空串） */
function loadModeHooks({ mode = null, href = 'https://jvs.example.com/#/ruleDesign?jvsAppId=app-1' } = {}) {
  const { localStorage, store } = makeStorageStub();
  const writes = [];
  const countingStorage = {
    ...localStorage,
    setItem(key, value) {
      writes.push(key);
      localStorage.setItem(key, value);
    },
  };
  const systemList = mode === null ? null : { querySelectorAll: () => [{ innerText: mode }] };

  const { hooks } = loadJvsHooks({
    localStorage: countingStorage,
    location: { href },
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: (selector) => (selector === '.system-list' ? systemList : null),
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener() {},
    },
  });
  return { hooks, store, writes };
}

test('脚本暴露模式测试钩子', () => {
  const { hooks } = loadModeHooks();
  for (const name of ['collectAppMode', 'getModeFromHistory', 'currentMode', 'getModeColor', 'buildModeColorCss']) {
    assert.equal(typeof hooks[name], 'function', name);
  }
});

test('collectAppMode：读 DOM 模式项，值变化时写目录', () => {
  const { hooks, store } = loadModeHooks({ mode: '测试模式' });
  assert.equal(hooks.collectAppMode(), '测试模式');
  assert.equal(JSON.parse(store.get(MODE_MAP_KEY))['app-1'], '测试模式');
});

test('collectAppMode：同值不重写存储', () => {
  const { hooks, store, writes } = loadModeHooks({ mode: '测试模式' });
  store.set(MODE_MAP_KEY, JSON.stringify({ 'app-1': '测试模式' }));
  hooks.collectAppMode();
  assert.equal(writes.length, 0);
});

test('collectAppMode：无 system-list 返回空串且不写目录', () => {
  const { hooks, store, writes } = loadModeHooks({ mode: null });
  assert.equal(hooks.collectAppMode(), '');
  assert.equal(store.has(MODE_MAP_KEY), false);
  assert.equal(writes.length, 0);
});

test('getModeFromHistory：目录命中返回记录，未命中返回 undefined', () => {
  const hit = loadModeHooks();
  hit.store.set(MODE_MAP_KEY, JSON.stringify({ 'app-1': '正式模式' }));
  assert.equal(hit.hooks.getModeFromHistory(), '正式模式');

  const miss = loadModeHooks({ href: 'https://jvs.example.com/#/ruleDesign?jvsAppId=app-2' });
  miss.store.set(MODE_MAP_KEY, JSON.stringify({ 'app-1': '正式模式' }));
  assert.equal(miss.hooks.getModeFromHistory(), undefined);
});

test('currentMode：历史目录优先，未命中走 DOM 采集', () => {
  const fromHistory = loadModeHooks({ mode: '测试模式' });
  fromHistory.store.set(MODE_MAP_KEY, JSON.stringify({ 'app-1': '正式模式' }));
  assert.equal(fromHistory.hooks.currentMode(), '正式模式');

  const fromDom = loadModeHooks({ mode: '测试模式' });
  assert.equal(fromDom.hooks.currentMode(), '测试模式');
});

test('getModeColor：三模式投影，未知回退 black', () => {
  const { hooks } = loadModeHooks();
  assert.equal(hooks.getModeColor('开发模式'), 'black');
  assert.equal(hooks.getModeColor('测试模式'), 'green');
  assert.equal(hooks.getModeColor('正式模式'), 'red');
  assert.equal(hooks.getModeColor('未知'), 'black');
});

test('buildModeColorCss：生成测试/正式整钮换色规则，开发模式无规则（默认蓝）', () => {
  const { hooks } = loadModeHooks();
  const css = hooks.buildModeColorCss();

  assert.match(css, /\.button-11ze\[data-mode="测试模式"\]/);
  assert.match(css, /\.button-11ze\[data-mode="测试模式"\]:hover/);
  assert.match(css, /\.button-11ze\[data-mode="正式模式"\]/);
  assert.match(css, /\.button-11ze\[data-mode="正式模式"\]:hover/);
  assert.doesNotMatch(css, /data-mode="开发模式"/);
});

test('buildModeColorCss 与 MODE_COLORS 单源：色值取自同一常量', () => {
  const { hooks } = loadModeHooks();
  assert.match(hooks.buildModeColorCss(), new RegExp(hooks.MODE_COLORS['测试模式'].buttonPlain.color));
  assert.match(hooks.buildModeColorCss(), new RegExp(hooks.MODE_COLORS['正式模式'].buttonPlain.color));
});
