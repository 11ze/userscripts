'use strict';

/**
 * 标题提取与站点判定测试
 *
 * 通过 vm 桩环境执行 anime_search.user.js 全文，从 window.__ANIME_SEARCH_TEST__
 * 条件钩子取出 IIFE 内部函数。断言用 JSON.stringify 字符串对比，
 * 避开 vm realm 的 deepEqual 引用相等误报。
 * 见 plans/2026-08-14-anime-search-candidate-1-2.md。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/anime_search.user.js');

function createElementStub(tag) {
  const listeners = new Map();
  return {
    tagName: tag,
    textContent: '',
    style: {},
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    fire(type) {
      listeners.get(type)?.call(this);
    },
  };
}

/**
 * 标题元素假件：textContent 即标题，记录挂载的按钮
 */
function makeTitleElement(text = '咒术回战 第二季') {
  const appended = [];
  return {
    appended,
    querySelector() {
      return null;
    },
    textContent: text,
    appendChild(child) {
      appended.push(child);
    },
  };
}

/**
 * element 非空时，主循环首个选择器即命中该假标题元素
 */
function loadScriptSandbox({ element, href } = {}) {
  const source = fs.readFileSync(sourcePath, 'utf8');

  // 默认豆瓣条目页：过站点判定闸门
  const pageHref = href ?? 'https://www.douban.com/subject/26363254/';
  const pageUrl = new URL(pageHref);

  const sandbox = {
    console: {
      log() {},
      error() {},
      warn() {},
    },
    URL: URL,
    GM_addStyle() {},
    location: {
      href: pageHref,
      origin: pageUrl.origin,
      pathname: pageUrl.pathname,
    },
    document: {
      querySelectorCalls: [],
      querySelector(selector) {
        sandbox.document.querySelectorCalls.push(selector);
        return element ?? null;
      },
      createElement(tag) {
        return createElementStub(tag);
      },
    },
    __openCalls: [],
    open(url, target) {
      sandbox.__openCalls.push({ url, target });
    },
    __ANIME_SEARCH_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'anime_search.user.js' });

  return sandbox;
}

function loadScriptHooks() {
  return loadScriptSandbox().__ANIME_SEARCH_TEST__.hooks;
}

test('测试钩子暴露三个函数', () => {
  const hooks = loadScriptHooks();
  assert.equal(typeof hooks.uniqueText, 'function');
  assert.equal(typeof hooks.extractTitle, 'function');
  assert.equal(typeof hooks.detectSite, 'function');
});

test('uniqueText：同首字词截断（原名译名并列只留前者）', () => {
  const { uniqueText } = loadScriptHooks();
  assert.equal(uniqueText('咒术回战 咒术回战'), '咒术回战');
});

test('uniqueText：单词直返', () => {
  const { uniqueText } = loadScriptHooks();
  assert.equal(uniqueText('咒术回战'), '咒术回战');
});

test('uniqueText：英文标题同首字截断（现状固化）', () => {
  const { uniqueText } = loadScriptHooks();
  assert.equal(
    uniqueText('Re:从零开始的异世界生活 Re:ゼロから始める異世界生活'),
    'Re:从零开始的异世界生活',
  );
});

test('uniqueText：首字不同不截断', () => {
  const { uniqueText } = loadScriptHooks();
  assert.equal(uniqueText('攻壳机动队 SAC_2045'), '攻壳机动队 SAC_2045');
});

test('uniqueText：首个同首字词出现在中间时保留之前的词', () => {
  const { uniqueText } = loadScriptHooks();
  assert.equal(uniqueText('甲乙 丙 甲乙 丁'), '甲乙 丙');
});

test('uniqueText：空白串返回空串', () => {
  const { uniqueText } = loadScriptHooks();
  assert.equal(uniqueText(''), '');
  assert.equal(uniqueText('  '), '');
});

test('extractTitle：优先取 span 文本', () => {
  const { extractTitle } = loadScriptHooks();
  const element = {
    querySelector() {
      return { textContent: '咒术回战 咒术回战' };
    },
    textContent: '后备标题',
  };
  assert.equal(extractTitle(element), '咒术回战');
});

test('extractTitle：span 缺失或为空时回退元素文本', () => {
  const { extractTitle } = loadScriptHooks();
  const noSpan = {
    querySelector() {
      return null;
    },
    textContent: '攻壳机动队 SAC_2045',
  };
  assert.equal(extractTitle(noSpan), '攻壳机动队 SAC_2045');

  const emptySpan = {
    querySelector() {
      return { textContent: '' };
    },
    textContent: '后备标题',
  };
  assert.equal(extractTitle(emptySpan), '后备标题');
});

test('extractTitle：剥离自挂按钮的 🔍🏆ℹ️', () => {
  const { extractTitle } = loadScriptHooks();
  const element = {
    querySelector() {
      return null;
    },
    textContent: '标题 🔍🏆ℹ️',
  };
  assert.equal(extractTitle(element), '标题');
});

test('extractTitle：空文本返回空串', () => {
  const { extractTitle } = loadScriptHooks();
  const element = {
    querySelector() {
      return null;
    },
    textContent: '',
  };
  assert.equal(extractTitle(element), '');
});

test('detectSite：AGE 域名', () => {
  const { detectSite } = loadScriptHooks();
  assert.equal(detectSite('https://www.agedm.org/'), 'age');
  assert.equal(detectSite('https://agefans.vip/'), 'age');
});

test('detectSite：豆瓣条目与游戏页', () => {
  const { detectSite } = loadScriptHooks();
  assert.equal(detectSite('https://www.douban.com/subject/26363254/'), 'douban');
  assert.equal(detectSite('https://www.douban.com/game/123456/'), 'douban');
});

test('detectSite：B 站番剧页', () => {
  const { detectSite } = loadScriptHooks();
  assert.equal(detectSite('https://www.bilibili.com/bangumi/play/ep547996'), 'bilibili');
});

test('detectSite（泄漏回归）：query 含 age 不再误判为 AGE 站', () => {
  const { detectSite } = loadScriptHooks();
  assert.equal(
    detectSite('https://www.bilibili.com/bangumi/play/ep547996?from=homepage'),
    'bilibili',
  );
});

test('detectSite（泄漏回归）：query 含站点子串不再激活脚本', () => {
  const { detectSite } = loadScriptHooks();
  assert.equal(detectSite('https://example.com/?ref=agedm'), null);
});

test('detectSite：无关站点与非法 URL 返回 null', () => {
  const { detectSite } = loadScriptHooks();
  assert.equal(detectSite('https://example.com/'), null);
  assert.equal(detectSite('not-a-url'), null);
});

test('buildDetailHref：play 页 pathname 拼 detail 地址', () => {
  const { buildDetailHref } = loadScriptHooks();
  assert.equal(
    buildDetailHref('/play/20260212/1/1', 'https://www.agedm.io'),
    'https://www.agedm.io/detail/20260212',
  );
});

test('buildDetailHref：镜像域 origin 随传入拼接', () => {
  const { buildDetailHref } = loadScriptHooks();
  assert.equal(
    buildDetailHref('/play/20260212/1/1', 'https://agefans.vip'),
    'https://agefans.vip/detail/20260212',
  );
});

test('buildDetailHref：非 play 页返回 null', () => {
  const { buildDetailHref } = loadScriptHooks();
  assert.equal(buildDetailHref('/detail/20260212', 'https://www.agedm.io'), null);
  assert.equal(buildDetailHref('/', 'https://www.agedm.io'), null);
});

test('测试钩子暴露 createButtonPair', () => {
  const { createButtonPair } = loadScriptHooks();
  assert.equal(typeof createButtonPair, 'function');
});

test('createButtonPair：返回一对 🔍/🏆 按钮', () => {
  const { createButtonPair } = loadScriptHooks();
  const [search, douban] = createButtonPair('咒术回战');
  assert.equal(search.tagName, 'button');
  assert.equal(douban.tagName, 'button');
  assert.equal(search.textContent, '🔍');
  assert.equal(douban.textContent, '🏆');
});

test('createButtonPair：按钮绑定 hover 样式切换', () => {
  const { createButtonPair } = loadScriptHooks();
  const [search] = createButtonPair('咒术回战');
  search.fire('mouseover');
  assert.equal(search.style.backgroundColor, '#f8f9fa');
  assert.equal(search.style.borderColor, '#ced4da');
  assert.equal(search.style.boxShadow, '0 2px 4px rgba(0,0,0,0.08)');
  search.fire('mouseout');
  assert.equal(search.style.backgroundColor, '#ffffff');
  assert.equal(search.style.borderColor, '#e1e5e9');
  assert.equal(search.style.boxShadow, '0 1px 2px rgba(0,0,0,0.05)');
});

test('createButtonPair：点击分别打开聚合搜索与豆瓣搜索', () => {
  const sandbox = loadScriptSandbox();
  const { createButtonPair } = sandbox.__ANIME_SEARCH_TEST__.hooks;
  const [search, douban] = createButtonPair('咒术回战');
  search.fire('click');
  douban.fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    { url: 'https://so.wangze.tech?q=咒术回战', target: '_blank' },
    { url: 'https://www.douban.com/search?q=咒术回战', target: '_blank' },
  ]);
});

test('按钮挂载：首个命中的选择器挂一对按钮并停止', () => {
  const titleElement = makeTitleElement('咒术回战 第二季');
  const sandbox = loadScriptSandbox({ element: titleElement });

  assert.equal(sandbox.document.querySelectorCalls.length, 1, '命中后应停止，不查后续选择器');
  assert.equal(titleElement.appended.length, 2);
  assert.equal(titleElement.appended[0].tagName, 'button');
  assert.equal(titleElement.appended[0].textContent, '🔍');
  assert.equal(titleElement.appended[1].textContent, '🏆');

  titleElement.appended[0].fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    { url: 'https://so.wangze.tech?q=咒术回战 第二季', target: '_blank' },
  ]);
});

test('按钮挂载：AGE play 页追加 ℹ️ 详情按钮并当前页跳转', () => {
  const titleElement = makeTitleElement('咒术回战 第二季');
  const sandbox = loadScriptSandbox({
    element: titleElement,
    href: 'https://www.agedm.io/play/20260212/1/1',
  });

  assert.equal(titleElement.appended.length, 3, '搜索对 + ℹ️ 详情按钮');
  const detailButton = titleElement.appended[2];
  assert.equal(detailButton.tagName, 'button');
  assert.equal(detailButton.textContent, 'ℹ️');

  detailButton.fire('click');
  assert.equal(sandbox.location.href, 'https://www.agedm.io/detail/20260212');
});

test('按钮挂载：非 play 页不追加 ℹ️ 详情按钮', () => {
  const titleElement = makeTitleElement('咒术回战 第二季');
  const sandbox = loadScriptSandbox({
    element: titleElement,
    href: 'https://www.agedm.io/detail/20260212',
  });

  assert.equal(titleElement.appended.length, 2);
});
