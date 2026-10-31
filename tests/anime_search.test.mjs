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
  const children = [];
  return {
    tagName: tag,
    textContent: '',
    style: {},
    children,
    childNodes: children,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    fire(type) {
      listeners.get(type)?.call(this);
    },
    appendChild(child) {
      children.push(child);
    },
  };
}

/**
 * 标题元素假件：一个文本节点 + 记录挂载的按钮（按钮同进 childNodes，贴近真实 DOM）
 */
function makeTitleElement(text = '咒术回战 第二季') {
  const appended = [];
  const childNodes = [{ nodeType: 3, textContent: text }];
  return {
    appended,
    style: {},
    childNodes,
    querySelector() {
      return null;
    },
    textContent: text,
    appendChild(child) {
      if (child.tagName === 'button') appended.push(child);
      childNodes.push(child);
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
    __styleInjections: [],
    GM_addStyle(css) {
      sandbox.__styleInjections.push(css);
    },
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
    childNodes: [{ nodeType: 3, textContent: '攻壳机动队 SAC_2045' }],
  };
  assert.equal(extractTitle(noSpan), '攻壳机动队 SAC_2045');

  const emptySpan = {
    querySelector() {
      return { textContent: '' };
    },
    textContent: '后备标题',
    childNodes: [{ nodeType: 3, textContent: '后备标题' }],
  };
  assert.equal(extractTitle(emptySpan), '后备标题');
});

test('extractTitle：自挂按钮文字不进标题（重跑防护）', () => {
  const { extractTitle } = loadScriptHooks();
  const buttonNode = {
    nodeType: 1,
    tagName: 'BUTTON',
    textContent: '详情',
    childNodes: [{ nodeType: 3, textContent: '详情' }],
  };
  const element = {
    querySelector() {
      return null;
    },
    textContent: '咒术回战 第二季详情',
    childNodes: [{ nodeType: 3, textContent: '咒术回战 第二季' }, buttonNode],
  };
  assert.equal(extractTitle(element), '咒术回战 第二季');
});

test('extractTitle（误剥回归）：标题本身含「详情」二字不被吞', () => {
  const { extractTitle } = loadScriptHooks();
  const element = {
    querySelector() {
      return null;
    },
    textContent: '咒术回战 详情篇',
    childNodes: [{ nodeType: 3, textContent: '咒术回战 详情篇' }],
  };
  assert.equal(extractTitle(element), '咒术回战 详情篇');
});

test('extractTitle：空文本返回空串', () => {
  const { extractTitle } = loadScriptHooks();
  const element = {
    querySelector() {
      return null;
    },
    textContent: '',
    childNodes: [{ nodeType: 3, textContent: '' }],
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

test('测试钩子暴露 createAgeSearchButton', () => {
  const { createAgeSearchButton } = loadScriptHooks();
  assert.equal(typeof createAgeSearchButton, 'function');
});

test('createAgeSearchButton：当前域名 favicon 图标，点击开站内搜索', () => {
  const sandbox = loadScriptSandbox();
  const { createAgeSearchButton } = sandbox.__ANIME_SEARCH_TEST__.hooks;
  const button = createAgeSearchButton('https://www.agedm.io', '咒术回战 第二季');

  assert.equal(button.tagName, 'button');
  assert.equal(button.textContent, '');
  assert.equal(button.children.length, 1);
  assert.equal(button.children[0].tagName, 'img');
  assert.equal(button.children[0].src, 'https://www.agedm.io/favicon.ico');
  assert.equal(button.children[0].alt, '');
  assert.equal(button.children[0].style.width, '14px');
  assert.equal(button.children[0].style.height, '14px');

  button.fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    {
      url: 'https://www.agedm.io/search?query=%E5%92%92%E6%9C%AF%E5%9B%9E%E6%88%98%20%E7%AC%AC%E4%BA%8C%E5%AD%A3',
      target: '_blank',
    },
  ]);
});

test('createButtonPair：返回聚合搜索 SVG 图标钮与豆瓣 favicon 图标钮', () => {
  const { createButtonPair } = loadScriptHooks();
  const [search, douban] = createButtonPair('咒术回战');
  assert.equal(search.tagName, 'button');
  assert.equal(douban.tagName, 'button');
  assert.equal(search.textContent, '');
  assert.equal(search.children.length, 1);
  assert.equal(search.children[0].tagName, 'img');
  assert.equal(
    search.children[0].src,
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%230069ad%22 stroke-width=%221.5%22 stroke-linecap=%22round%22%3E%3Ccircle cx=%226%22 cy=%226%22 r=%224.3%22/%3E%3Cpath d=%22M10.2%2010.2%2014.2%2014.2%22/%3E%3C/svg%3E',
  );
  assert.equal(search.children[0].alt, '');
  assert.equal(search.children[0].style.width, '14px');
  assert.equal(search.children[0].style.height, '14px');
  assert.equal(douban.textContent, '');
  assert.equal(douban.children.length, 1);
  assert.equal(douban.children[0].tagName, 'img');
  assert.equal(douban.children[0].src, 'https://www.douban.com/favicon.ico');
  assert.equal(douban.children[0].alt, '');
  assert.equal(douban.children[0].style.width, '14px');
  assert.equal(douban.children[0].style.height, '14px');
});

test('createButtonPair：图标钮收紧行高并居中，防继承标题行高撑大按钮', () => {
  const { createButtonPair } = loadScriptHooks();
  const [search] = createButtonPair('咒术回战');
  assert.equal(search.style.lineHeight, '1');
  assert.equal(search.style.display, 'inline-flex');
  assert.equal(search.style.alignItems, 'center');
  assert.equal(search.style.justifyContent, 'center');
});

test('createButtonPair：按钮绑定 hover 样式切换', () => {
  const { createButtonPair } = loadScriptHooks();
  const [search] = createButtonPair('咒术回战');
  search.fire('mouseover');
  assert.equal(search.style.backgroundColor, '#f0f4f7');
  assert.equal(search.style.borderColor, '#b7c5cf');
  assert.equal(search.style.boxShadow, 'none');
  search.fire('mouseout');
  assert.equal(search.style.backgroundColor, '#ffffff');
  assert.equal(search.style.borderColor, '#e1e5e9');
  assert.equal(search.style.boxShadow, 'none');
});

test('createButtonPair：点击分别打开聚合搜索与豆瓣搜索', () => {
  const sandbox = loadScriptSandbox();
  const { createButtonPair } = sandbox.__ANIME_SEARCH_TEST__.hooks;
  const [search, douban] = createButtonPair('咒术回战');
  search.fire('click');
  douban.fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    {
      url: 'https://so.wangze.tech?q=%E5%92%92%E6%9C%AF%E5%9B%9E%E6%88%98',
      target: '_blank',
    },
    {
      url: 'https://www.douban.com/search?q=%E5%92%92%E6%9C%AF%E5%9B%9E%E6%88%98',
      target: '_blank',
    },
  ]);
});

test('createSearchButton（截断回归）：标题编码后拼 URL，& 与 # 不再截断查询串', () => {
  const sandbox = loadScriptSandbox();
  const { createButtonPair } = sandbox.__ANIME_SEARCH_TEST__.hooks;
  const [search, douban] = createButtonPair('Re:从零 & 异世界#1');
  search.fire('click');
  douban.fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    {
      url: 'https://so.wangze.tech?q=Re%3A%E4%BB%8E%E9%9B%B6%20%26%20%E5%BC%82%E4%B8%96%E7%95%8C%231',
      target: '_blank',
    },
    {
      url: 'https://www.douban.com/search?q=Re%3A%E4%BB%8E%E9%9B%B6%20%26%20%E5%BC%82%E4%B8%96%E7%95%8C%231',
      target: '_blank',
    },
  ]);
});

test('按钮挂载：首个命中的选择器挂一对按钮并停止', () => {
  const titleElement = makeTitleElement('咒术回战 第二季');
  const sandbox = loadScriptSandbox({ element: titleElement });

  assert.equal(sandbox.document.querySelectorCalls.length, 1, '命中后应停止，不查后续选择器');
  assert.equal(titleElement.appended.length, 2);
  assert.equal(titleElement.appended[0].tagName, 'button');
  assert.equal(titleElement.appended[0].children[0].tagName, 'img');
  assert.match(titleElement.appended[0].children[0].src, /^data:image\/svg\+xml,/);
  assert.equal(titleElement.appended[1].tagName, 'button');
  assert.equal(titleElement.appended[1].children[0].src, 'https://www.douban.com/favicon.ico');

  titleElement.appended[0].fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    {
      url: 'https://so.wangze.tech?q=%E5%92%92%E6%9C%AF%E5%9B%9E%E6%88%98%20%E7%AC%AC%E4%BA%8C%E5%AD%A3',
      target: '_blank',
    },
  ]);
});

test('按钮挂载：AGE play 页四个按钮，顺序为聚合搜索/豆瓣/AGE/详情', () => {
  const titleElement = makeTitleElement('咒术回战 第二季');
  const sandbox = loadScriptSandbox({
    element: titleElement,
    href: 'https://www.agedm.io/play/20260212/1/1',
  });

  assert.equal(titleElement.appended.length, 4, '搜索对 + AGE 站内搜索 + 详情');
  assert.match(titleElement.appended[0].children[0].src, /^data:image\/svg\+xml,/);
  assert.equal(titleElement.appended[1].children[0].src, 'https://www.douban.com/favicon.ico');
  assert.equal(titleElement.appended[2].children[0].src, 'https://www.agedm.io/favicon.ico');
  const detailButton = titleElement.appended[3];
  assert.equal(detailButton.tagName, 'button');
  assert.equal(detailButton.textContent, '详情');

  detailButton.fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    { url: 'https://www.agedm.io/detail/20260212', target: '_blank' },
  ]);
});

test('按钮挂载：AGE 非 play 页挂站内搜索但不挂详情', () => {
  const titleElement = makeTitleElement('咒术回战 第二季');
  const sandbox = loadScriptSandbox({
    element: titleElement,
    href: 'https://www.agedm.io/detail/20260212',
  });

  assert.equal(titleElement.appended.length, 3);
  assert.equal(titleElement.appended[2].children[0].src, 'https://www.agedm.io/favicon.ico');

  titleElement.appended[2].fire('click');
  assert.deepEqual(sandbox.__openCalls, [
    {
      url: 'https://www.agedm.io/search?query=%E5%92%92%E6%9C%AF%E5%9B%9E%E6%88%98%20%E7%AC%AC%E4%BA%8C%E5%AD%A3',
      target: '_blank',
    },
  ]);
});

test('装配表：站点选择器收进条目（加站只改一处），站内优先级顺序保留', () => {
  const { SITE_SETUP } = loadScriptHooks();
  assert.equal(
    JSON.stringify(SITE_SETUP.age.selectors),
    JSON.stringify([
      'div.body_content_wrapper h2',
      'div.body_content_wrapper h5',
      '#content > h1',
    ]),
  );
  assert.equal(
    JSON.stringify(SITE_SETUP.douban.selectors),
    JSON.stringify(['h1 > span:nth-child(1)']),
  );
  assert.equal(
    JSON.stringify(SITE_SETUP.bilibili.selectors),
    JSON.stringify(["a[class*='mediainfo_mediaTitle']"]),
  );
});

test('装配表：douban/bilibili 按钮序列只有通用对——即使站在 /play/ 路径下也不产详情钮', () => {
  // age 域 + /play/ 路径让 buildDetailHref 的误挂条件拉满，
  // 再调 douban/bilibili 工厂验证站点差异各自封装，不随主循环泄漏
  const sandbox = loadScriptSandbox({ href: 'https://www.agedm.io/play/20260212' });
  const { SITE_SETUP } = sandbox.__ANIME_SEARCH_TEST__.hooks;

  assert.equal(SITE_SETUP.douban.buildButtons('咒术回战').length, 2);
  assert.equal(SITE_SETUP.bilibili.buildButtons('咒术回战').length, 2);
});

test('装配表：AGE play 页序列四个按钮，CSS 屏蔽只在 AGE 条目', () => {
  const sandbox = loadScriptSandbox({ href: 'https://www.agedm.io/play/20260212' });
  const { SITE_SETUP } = sandbox.__ANIME_SEARCH_TEST__.hooks;

  assert.equal(SITE_SETUP.age.buildButtons('咒术回战').length, 4);
  assert.ok(SITE_SETUP.age.css.includes('global_notice_wrapper'));
  assert.equal(SITE_SETUP.douban.css, undefined);
  assert.equal(SITE_SETUP.bilibili.css, undefined);
});

test('CSS 注入：所有站点共用按钮样式，AGE 另有屏蔽样式', () => {
  const ageSandbox = loadScriptSandbox({ href: 'https://www.agedm.io/detail/20260212' });
  assert.equal(ageSandbox.__styleInjections.length, 2);

  const doubanSandbox = loadScriptSandbox({ href: 'https://www.douban.com/subject/26363254/' });
  assert.equal(doubanSandbox.__styleInjections.length, 1);
});

test('紧凑按钮：各搜索入口有可访问名称和用途提示，详情保留文字', () => {
  const { createButtonPair, createAgeSearchButton, createDetailButton } = loadScriptHooks();
  const buttons = [
    ...createButtonPair('咒术回战'),
    createAgeSearchButton('https://www.agedm.io', '咒术回战'),
    createDetailButton('https://www.agedm.io/detail/20260139'),
  ];
  assert.deepEqual(buttons.map(button => button.ariaLabel), [
    '聚合搜索', '豆瓣搜索', 'AGE 站内搜索', '打开番剧详情',
  ]);
  assert.equal(buttons[3].textContent, '详情');
});


test('统一外观：三个站点使用相同按钮 CSS，操作位于标题换行之后', () => {
  const urls = [
    'https://www.agedm.io/detail/20260139',
    'https://www.agedm.io/play/20260139/1/1',
    'https://www.bilibili.com/bangumi/play/ep173287',
  ];
  const styles = urls.map(href => {
    const element = makeTitleElement();
    const sandbox = loadScriptSandbox({ element, href });
    assert.equal(element.childNodes[1].tagName, 'br');
    assert.equal(element.childNodes[2].tagName, 'button');
    return sandbox.__styleInjections[0];
  });
  assert.equal(styles[0], styles[1]);
  assert.equal(styles[1], styles[2]);
});
