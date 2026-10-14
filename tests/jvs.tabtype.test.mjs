'use strict';

/**
 * 标签页标题场景测试：getTabType 页面类型判定 + getNewTabTitle/collectAppName 名称解析
 *
 * 通过共享 harness 的 vm 桩环境执行 jvs.user.js 全文，querySelector 按选择器映射
 * 返回假元素，从 window.__JVS_TEST__ 条件钩子取出被测函数。
 * 浏览器中该钩子永不激活。
 *
 * 背景：旧版 JVS 的非设计页面上 #tab-design 页签残留（span 文本「逻辑设计」），
 * 导致 changeTitle 误把 favicon 换成「逻」图标——判定必须先确认当前页面真是设计器。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks } from './jvs-harness.mjs';

function loadScriptHooks(fakeDom) {
  return loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: (selector) => fakeDom[selector] ?? null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener() {},
    },
  }).hooks;
}

// 名称解析需要 querySelectorAll 也按映射命中（返回单元素数组）
function loadNameHooks(fakeDom) {
  return loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: (selector) => fakeDom[selector] ?? null,
      querySelectorAll: (selector) => (fakeDom[selector] ? [fakeDom[selector]] : []),
      getElementById: () => null,
      addEventListener() {},
    },
  }).hooks;
}

function fakeSpan(text) {
  return { textContent: text };
}

test('设计器页面：有设计器头部时返回 #tab-design 的设计类型', () => {
  const hooks = loadScriptHooks({
    '.design-header-box': {},
    '#tab-design > span': fakeSpan('逻辑设计'),
  });
  assert.equal(hooks.getTabType(), '逻辑设计');
});

test('旧版 JVS 非设计页面：页签残留「逻辑设计」但无设计器头部，返回空', () => {
  const hooks = loadScriptHooks({
    '#tab-design > span': fakeSpan('逻辑设计'),
  });
  assert.equal(hooks.getTabType(), '');
});

test('#tab-design 文本不是四种设计类型时返回空', () => {
  const hooks = loadScriptHooks({
    '.design-header-box': {},
    '#tab-design > span': fakeSpan('页面设计'),
  });
  assert.equal(hooks.getTabType(), '');
});

test('页面上没有 #tab-design 时返回空', () => {
  const hooks = loadScriptHooks({
    '.design-header-box': {},
  });
  assert.equal(hooks.getTabType(), '');
});

// ==================== getNewTabTitle / collectAppName ====================

// 与 src 内 APP_NAME_SELECTORS 一致的四个选择器，fakeDom 按选择器键命中假元素
const LEFT_MENU_HIDE_SELECTOR =
  '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div.el-scrollbar__wrap > div > div.app-item-info.app-item-info-hide > div > span';
const LEFT_MENU_SELECTOR =
  '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div.el-scrollbar__wrap > div > div.app-item-info > div > span';
const OLD_DESIGN_HEADER_SELECTOR = '#app > div > div > div.design-header-box > div.header-left';
const NEW_DESIGN_HEADER_SELECTOR = 'div.design-header-box > div.header-left';

test('getNewTabTitle 表驱动：三种命中形态各自解析出标题', () => {
  const cases = [
    {
      name: '应用左上角纯文本，innerHTML 无标签直取',
      selector: LEFT_MENU_SELECTOR,
      innerHTML: ' 订单管理 ',
      expected: '订单管理',
    },
    {
      name: '旧版设计页头，跨过 svg 图标后截掉尾部标签',
      selector: OLD_DESIGN_HEADER_SELECTOR,
      innerHTML: '<svg viewBox="0 0 24 24"></svg>订单管理<span class="tag">列表</span>',
      expected: '订单管理',
    },
    {
      name: '新版设计页头，跨过 svg 图标与 center 样式锚点',
      selector: NEW_DESIGN_HEADER_SELECTOR,
      innerHTML: '<svg viewBox="0 0 24 24"></svg><span style="text-align: center;">订单管理</span>',
      expected: '订单管理',
    },
  ];

  for (const { name, selector, innerHTML, expected } of cases) {
    const hooks = loadNameHooks({ [selector]: { innerHTML, textContent: innerHTML } });
    assert.equal(hooks.getNewTabTitle(), expected, name);
  }
});

test('getNewTabTitle 不取应用左上角 hide 形态（仅采集用）', () => {
  const hooks = loadNameHooks({
    [LEFT_MENU_HIDE_SELECTOR]: { innerHTML: '订单管理', textContent: '订单管理' },
  });
  assert.equal(hooks.getNewTabTitle(), '');
});

test('collectAppName 采集左上角 hide 形态并落库', () => {
  const hooks = loadNameHooks({
    [LEFT_MENU_HIDE_SELECTOR]: { innerHTML: '订单管理', textContent: '订单管理' },
  });
  assert.equal(hooks.collectAppName('app-1'), '订单管理');
  assert.equal(hooks.getAppIdName('app-1'), '订单管理');
});
