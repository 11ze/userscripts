'use strict';

/**
 * agedm.user.js 测试：update 页动漫屏蔽 + 豆瓣评分记录与展示
 *
 * 通过 vm 桩环境执行 agedm.user.js 全文，从 window.__AGEDM_TEST__ 条件钩子取出
 * IIFE 内部函数（浏览器中该钩子永不激活）。DOM 桩覆盖脚本使用的选择器，
 * 支持集之外的形态显式报错。
 * 名单与开关状态通过 GM_* 桩的存储断言，确认弹窗/面板/入口通过 DOM 桩驱动。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/agedm.user.js');
const source = fs.readFileSync(sourcePath, 'utf8');

/**
 * 桩选择器语言：'.cls'、'.cls tag'（后代）、'tag'、'tag.cls'（复合）。
 * 直接子级和 class 包含选择器由 matchesSelector 处理；其他形态一律 throw
 */
function parseSelector(selector) {
  const [first, descendantTag] = selector.split(' ');
  const compound = first.match(/^([a-zA-Z][\w-]*)\.([-\w]+)$/);
  if (compound) {
    return { tag: compound[1], cls: compound[2], descendantTag };
  }
  if (/^\.[-\w]+$/.test(first)) return { cls: first.slice(1), descendantTag };
  if (/^[a-zA-Z][\w-]*$/.test(first) && !descendantTag) return { tag: first };
  throw new Error(`测试桩不支持选择器形态：${selector}`);
}

function matchEl(el, selector) {
  if (matchesSelector(el, selector)) return el;
  for (const child of el.children) {
    const found = matchEl(child, selector);
    if (found) return found;
  }
  return null;
}

/** 支持脚本使用的后代、直接子级、首个子级与 class 包含匹配；不支持的形态显式报错。 */
function matchesSelector(el, selector) {
  const direct = selector.match(/^(#[\w-]+|h1) > (h1|span:nth-child\(1\))$/);
  if (direct) {
    const parentMatches = direct[1].startsWith('#')
      ? el.parent?.attrs.id === direct[1].slice(1)
      : el.parent?.tag === direct[1];
    return Boolean(parentMatches && el.tag === direct[2].split(':')[0]
      && (!direct[2].includes(':') || el.parent.children.filter((child) => child.nodeType === 1)[0] === el));
  }
  const attribute = selector.match(/^a\[class\*='([\w]+)'\]$/);
  if (attribute) return el.tag === 'a' && el.className.includes(attribute[1]);
  const { tag, cls, descendantTag } = parseSelector(selector);
  if (descendantTag) {
    if (el.tag !== descendantTag) return false;
    for (let node = el.parent; node; node = node.parent) {
      if ((!tag || node.tag === tag) && node.classes.includes(cls)) return true;
    }
    return false;
  }
  return (!tag || el.tag === tag) && (!cls || el.classes.includes(cls));
}

/**
 * 最小元素桩：classes 数组、attrs 表、style 对象、children/parent 链。
 * querySelector 按 matchEl 深度优先查后代，closest 沿父链找 .class。
 */
function makeEl(classes = [], tag = 'div') {
  const el = {
    tag,
    classes: [...classes],
    attrs: {},
    style: {},
    textContent: '',
    nodeType: 1,
    tagName: tag.toUpperCase(),
    children: [],
    parent: null,
    handlers: {},
    set className(v) {
      el.classes = v.split(/\s+/);
    },
    get className() {
      return el.classes.join(' ');
    },
    // 清空 innerHTML 移除子节点（真实 DOM 行为）；src 只用它清空，非空赋值无此用法
    set innerHTML(v) {
      if (v === '') {
        for (const child of el.children) child.parent = null;
        el.children = [];
      }
    },
    get innerHTML() {
      return '';
    },
    get childNodes() {
      return el.children;
    },
    hasAttribute: (key) => key in el.attrs,
    getAttribute: (key) => (key in el.attrs ? el.attrs[key] : null),
    setAttribute(key, value) {
      el.attrs[key] = String(value);
    },
    removeAttribute(key) {
      delete el.attrs[key];
    },
    appendChild(child) {
      el.children.push(child);
      child.parent = el;
      return child;
    },
    append(child) {
      if (typeof child === 'string') {
        el.children.push({
          tag: '#text', classes: [], attrs: {}, style: {}, textContent: child,
          nodeType: 3, children: [], parent: el, handlers: {},
          querySelector: () => null,
          querySelectorAll: () => [],
        });
        return;
      }
      el.appendChild(child);
    },
    remove() {
      const i = el.parent ? el.parent.children.indexOf(el) : -1;
      if (i >= 0) el.parent.children.splice(i, 1);
    },
    addEventListener(type, handler) {
      el.handlers[type] = handler;
    },
    querySelector(selector) {
      for (const child of el.children) {
        const found = matchEl(child, selector) || child.querySelector(selector);
        if (found) return found;
      }
      return null;
    },
    querySelectorAll(selector) {
      const out = [];
      const walk = (node) => {
        for (const child of node.children) {
          if (matchesSelector(child, selector)) out.push(child);
          walk(child);
        }
      };
      walk(el);
      return out;
    },
    closest(selector) {
      const cls = selector.slice(1);
      for (let node = el; node; node = node.parent) {
        if (node.classes.includes(cls)) return node;
      }
      return null;
    },
  };
  return el;
}

/**
 * 构造一张动漫卡片：col > video_item > video_item--image + video_item-title > a(title)
 * withCol: false 构造不在 col 里的裸卡片。
 */
function makeCard(title, { withCol = true } = {}) {
  const card = makeEl(['video_item']);
  const image = makeEl(['video_item--image']);
  card.appendChild(image);
  const titleBox = makeEl(['video_item-title']);
  const link = makeEl([], 'a');
  link.textContent = title;
  titleBox.appendChild(link);
  card.appendChild(titleBox);

  if (!withCol) return { col: null, card };
  const col = makeEl(['col']);
  col.appendChild(card);
  return { col, card };
}

/**
 * 构造一条豆瓣「相关书影音」结果卡（li.DouWeb-SR-search-result-list-smart-box-card），
 * 结构对应 2026 版豆瓣搜索 DOM：type-name（[电视剧] 等）、name、frc-rating-num。
 */
function makeDoubanCard(typeName, name, ratingText) {
  const li = makeEl(['DouWeb-SR-search-result-list-smart-box-card'], 'li');
  const titleBox = makeEl(['DouWeb-SR-subject-info-title']);
  const typeEl = makeEl(['DouWeb-SR-subject-info-type-name']);
  typeEl.textContent = typeName;
  const nameEl = makeEl(['DouWeb-SR-subject-info-name'], 'a');
  nameEl.textContent = name;
  titleBox.appendChild(typeEl);
  titleBox.appendChild(nameEl);
  const ratingBox = makeEl(['DouWeb-SR-subject-info-rating']);
  if (ratingText !== undefined) {
    const num = makeEl(['frc-rating-num']);
    num.textContent = ratingText;
    ratingBox.appendChild(num);
  }
  li.appendChild(titleBox);
  li.appendChild(ratingBox);
  return li;
}

/**
 * play 页卡片主体：h5.card-title(片名) + 若干 .video_detail_info 行
 * （行文本直接整行给，与真实 DOM 的 span+文本聚合等价）
 */
function makePlayBody({ title = '', infos = [] } = {}) {
  const body = makeEl(['card-body']);
  if (title) {
    const h5 = makeEl(['card-title'], 'h5');
    h5.append(title); // 片名是文本子节点，与真实 DOM 一致（collectTitleText 遍历 childNodes）
    body.appendChild(h5);
  }
  for (const info of infos) body.appendChild(info);
  return body;
}

/**
 * detail 页结构：页面级 h2.video_detail_title(片名) + card-body(h5「基本信息」+ ul.detail_imform_list)。
 * rows 为 [label, value] 数组，label 含冒号如「原版名称：」；li.textContent 同时设聚合文本。
 */
function makeDetailEls({ title = '', rows = [] } = {}) {
  const h2 = makeEl(['video_detail_title'], 'h2');
  h2.append(title); // 片名是文本子节点，与真实 DOM 一致（collectTitleText 遍历 childNodes）
  const cardBody = makeEl(['card-body']);
  const h5 = makeEl(['card-title'], 'h5');
  h5.textContent = '基本信息';
  cardBody.appendChild(h5);
  const ul = makeEl(['detail_imform_list'], 'ul');
  for (const [label, value] of rows) {
    const li = makeEl([], 'li');
    const tag = makeEl(['detail_imform_tag']);
    tag.textContent = label;
    const val = makeEl(['detail_imform_value']);
    val.textContent = value;
    li.appendChild(tag);
    li.appendChild(val);
    li.textContent = label + value; // 桩不聚合子树，手动补整行文本
    ul.appendChild(li);
  }
  cardBody.appendChild(ul);
  return [h2, cardBody];
}

/** 一行 video_detail_info，text 如「原版名称：ホテル・インヒューマンズ」 */
function makeDetailInfo(text) {
  const row = makeEl(['video_detail_info']);
  row.textContent = text;
  return row;
}

/**
 * 在指定 location 下加载脚本，返回沙箱（可直接断言 gmStore / hooks）
 * 确认弹窗走 DOM：调 addToBlocked 等异步钩子后用 approveDialog 点「确认」
 */
function loadScript({
  hostname = 'www.agedm.io',
  pathname = '/update',
  search = '',
  cards = [],
  btnDanger = [],
  doubanCards = [],
  animeEls = [],
  initialStore = {},
  initialLocal = {},
  setItemThrows = false,
  readyState = 'loading',
  initialScrollY = 0,
} = {}) {
  const gmStore = new Map(Object.entries(initialStore));
  const localStore = new Map(Object.entries(initialLocal));
  const observed = [];
  const observerCallbacks = [];
  const timeouts = [];
  const scrollCalls = [];
  const rafQueue = [];

  const sandbox = {
    console: { log() {}, info() {}, error() {}, warn() {} },
    localStorage: {
      getItem: (key) => (localStore.has(key) ? localStore.get(key) : null),
      setItem: (key, value) => {
        if (setItemThrows) throw new Error('QuotaExceededError');
        localStore.set(key, String(value));
      },
      removeItem: (key) => localStore.delete(key),
    },
    location: { hostname, pathname, search, origin: `https://${hostname}`, href: `https://${hostname}${pathname}${search}` },
    URL,
    URLSearchParams,
    openCalls: [],
    open(url, target) { this.openCalls.push({ url, target }); },
    GM_addStyle(css) {
      const style = makeEl([], 'style');
      style.textContent = css;
      sandbox.document.head.appendChild(style);
    },
    // 滚动轻推桩：只记录调用、rAF 只登记不执行，测试手动驱动帧回调
    scrollY: initialScrollY,
    scrollBy: (opts) => scrollCalls.push({ api: 'scrollBy', ...opts }),
    scrollTo: (opts) => scrollCalls.push({ api: 'scrollTo', ...opts }),
    requestAnimationFrame: (fn) => {
      rafQueue.push(fn);
      return rafQueue.length;
    },
    handlers: {},
    addEventListener(type, handler) {
      this.handlers[type] = handler;
    },
    // 定时器桩：只登记不执行（toast 自动消失、评分轮询都用它），测试手动调 fn 推进
    setTimeout: (fn, ms) => {
      timeouts.push({ fn, ms });
      return timeouts.length;
    },
    FileReader: class {
      readAsText(file) {
        this.result = file.__text;
        this.onload();
      }
    },
    // observer 桩：保存 callback 供测试手动触发（模拟 SPA 突变驱使脚本重扫）
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(target) {
        observed.push(target);
        observerCallbacks.push(this.callback);
      }
    },
    GM_getValue: (key, fallback) => (gmStore.has(key) ? gmStore.get(key) : fallback),
    GM_setValue: (key, value) => gmStore.set(key, value),
    GM_deleteValue: (key) => {
      gmStore.delete(key);
    },
    document: {
      head: makeEl(),
      body: makeEl(['body']),
      documentElement: makeEl(['html']),
      createElement: (tag) => makeEl([], tag),
      createElementNS: (namespace, tag) => makeEl([], tag),
      readyState,
      handlers: {},
      addEventListener(type, handler) {
        this.handlers[type] = handler;
      },
      querySelector(selector) {
        return this.body.querySelector(selector);
      },
      querySelectorAll(selector) {
        return this.body.querySelectorAll(selector);
      },
    },
    __AGEDM_TEST__: {},
  };
  sandbox.window = sandbox;
  // fixture 统一挂 body 树：走通用 findAll 查询，与真实 DOM 的挂载语义一致
  for (const { col, card } of cards) sandbox.document.body.appendChild(col ?? card);
  for (const el of btnDanger) sandbox.document.body.appendChild(el);
  for (const li of doubanCards) sandbox.document.body.appendChild(li);
  for (const el of animeEls) sandbox.document.body.appendChild(el);

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'agedm.user.js' });

  return { sandbox, gmStore, localStore, observed, observerCallbacks, cards, timeouts, scrollCalls, rafQueue };
}

/** 造默认环境跑一轮，取钩子 */
function loadHooks(options = {}) {
  return loadScript(options).sandbox.__AGEDM_TEST__.hooks;
}

/** 深度优先收集后代里的 button 元素 */
function collectButtons(root, out = []) {
  for (const child of root.children) {
    if (child.tag === 'button') out.push(child);
    collectButtons(child, out);
  }
  return out;
}

/** 按文本找按钮（自绘弹窗、面板动作行都用它驱动） */
function findBtn(root, text) {
  return collectButtons(root).find((b) => b.textContent === text);
}

/** 深度优先按 tag 找第一个后代 */
function findByTag(root, tag) {
  for (const child of root.children) {
    if (child.tag === tag) return child;
    const found = findByTag(child, tag);
    if (found) return found;
  }
  return null;
}

/** 汇总子树的 textContent（桩元素不像真实 DOM 自动聚合） */
function nodeText(root) {
  let out = root.textContent || '';
  for (const child of root.children) out += nodeText(child);
  return out;
}

/** 点弹窗「确认」并等操作 promise 走完 */
async function approveDialog(sandbox, p) {
  findBtn(sandbox.document.body, '确认').handlers.click();
  await p;
}

/** vm 沙箱对象跨 realm 原型不同，JSON 往返转成主 realm 普通对象再断言 */
function json(value) {
  return JSON.parse(JSON.stringify(value));
}

/** 豆瓣搜索页环境：默认搜 HOTEL INHUMANS，第一条结果是 [电视剧] 异人旅馆 5.5 */
function loadDouban({
  q = 'HOTEL INHUMANS',
  cards = [makeDoubanCard('[电视剧]', '异人旅馆', '5.5')],
  initialStore = {},
} = {}) {
  return loadScript({
    hostname: 'www.douban.com',
    pathname: '/search',
    search: `?q=${encodeURIComponent(q)}`,
    doubanCards: cards,
    initialStore,
  });
}

/** 等豆瓣记录 promise（closeRatingDialog resolve 后）走完微任务 */
function flush() {
  return new Promise((resolve) => setTimeout(resolve));
}

test('门控：agedm 的 update 页才激活（观察 DOM、暴露钩子、注入入口按钮）', () => {
  const { observed, sandbox } = loadScript();
  assert.equal(observed.length, 1);
  assert.ok(sandbox.__AGEDM_TEST__.hooks);
  const entry = sandbox.document.body.querySelector('.agedm-11ze-entry');
  assert.ok(entry, '右缘应有入口按钮');
  assert.equal(entry.textContent, '屏');
  assert.equal(entry.title, '屏蔽管理');
});

test('update 页：页面突变 → observer 回调重扫，新增屏蔽卡片被隐藏', () => {
  const late = makeCard('动漫C');
  const { sandbox, observerCallbacks } = loadScript({
    cards: [],
    initialStore: { agedmBlockedNames: { list: ['动漫C'], at: 1 } },
  });
  sandbox.document.body.appendChild(late.col);
  observerCallbacks[0]();
  assert.equal(late.col.style.display, 'none', '突变后重扫隐藏新增卡片');
  assert.ok(late.card.querySelector('.agedm-11ze-block-btn'), '新增卡片补上屏蔽按钮');
});

test('门控：非 agedm 域名直接 return，零副作用', () => {
  const { observed, sandbox } = loadScript({ hostname: 'www.google.com' });
  assert.equal(observed.length, 0);
  assert.equal(sandbox.__AGEDM_TEST__.hooks, undefined);
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-entry'), null);
});

test('门控：agedm detail 页激活评分展示分支，但不注入 update 功能', () => {
  const { sandbox, observed } = loadScript({ pathname: '/detail/20260346' });
  assert.ok(sandbox.__AGEDM_TEST__.hooks, 'detail 页应暴露钩子');
  assert.equal(observed.length, 0, '不启动 update 页的 observer');
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-entry'), null);
});

test('门控：m.agedm.io hash 路由（pathname 为 /）不激活', () => {
  const { sandbox } = loadScript({ hostname: 'm.agedm.io', pathname: '/' });
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-entry'), null);
});

test('门控：豆瓣搜索页激活评分记录分支，不注入 update 功能', () => {
  const { sandbox } = loadScript({ hostname: 'www.douban.com', pathname: '/search', search: '?q=测试' });
  assert.ok(sandbox.__AGEDM_TEST__.hooks, '豆瓣搜索页应暴露钩子');
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-entry'), null);
});

test('门控：豆瓣非搜索页不激活', () => {
  const { sandbox } = loadScript({ hostname: 'www.douban.com', pathname: '/movie/1292052/' });
  assert.equal(sandbox.__AGEDM_TEST__.hooks, undefined);
});

test('门控：agedm play 页激活评分展示分支', () => {
  const { sandbox } = loadScript({ pathname: '/play/20250181/1/1' });
  assert.ok(sandbox.__AGEDM_TEST__.hooks);
});

test('门控：agedm 其他路径（/rank）不激活', () => {
  const { sandbox } = loadScript({ pathname: '/rank' });
  assert.equal(sandbox.__AGEDM_TEST__.hooks, undefined);
});

test('isAnimePage：detail/play 数字 ID 命中，其余不命中', () => {
  const hooks = loadHooks();
  assert.equal(hooks.isAnimePage('www.agedm.io', '/detail/20250181'), true);
  assert.equal(hooks.isAnimePage('www.agedm.io', '/play/20250181/1/12'), true);
  assert.equal(hooks.isAnimePage('www.agedm.io', '/detail/abc'), false);
  assert.equal(hooks.isAnimePage('www.agedm.cc', '/detail/20250181'), true);
});

test('isDoubanSearchPage：仅 www.douban.com 的 /search 命中', () => {
  const hooks = loadHooks();
  assert.equal(hooks.isDoubanSearchPage('www.douban.com', '/search'), true);
  assert.equal(hooks.isDoubanSearchPage('movie.douban.com', '/search'), false);
  assert.equal(hooks.isDoubanSearchPage('www.douban.com', '/explore'), false);
});

test('评分合并：按条目 at 新者胜，两边各有对方没有的条目互不丢', () => {
  const hooks = loadHooks();
  const merged = hooks.mergeRatings(
    { a: { rating: 5, name: 'A', at: 100 }, c: { rating: 7, name: 'C', at: 50 } },
    { a: { rating: 6, name: 'A', at: 200 }, b: { rating: null, name: 'B', at: 150 } },
  );
  assert.equal(merged.a.at, 200, '同 key 时 at 新者胜');
  assert.equal(merged.b.at, 150, '只在第二份的条目保留');
  assert.equal(merged.c.at, 50, '只在第一份的条目保留');
});

test('评分合并：同 at 时第二参（GM）胜出，与 ADR 0001 同 at 语义一致', () => {
  const hooks = loadHooks();
  const merged = hooks.mergeRatings(
    { a: { rating: 5, name: '镜像', at: 500 } },
    { a: { rating: 6, name: 'GM', at: 500 } },
  );
  assert.equal(merged.a.name, 'GM');
});

test('normalizeName：trim、折叠连续空白（含全角空格）、转小写', () => {
  const hooks = loadHooks();
  assert.equal(hooks.normalizeName('  HOTEL   INHUMANS '), 'hotel inhumans');
  assert.equal(hooks.normalizeName('　异人 旅馆　'), '异人 旅馆');
});

test('findDoubanEntry：跳过书籍游戏，取第一个 [电视剧] 条目的名字与评分', () => {
  const cards = [
    makeDoubanCard('[书籍]', '异人旅馆(小说)', '8.0'),
    makeDoubanCard('[游戏]', 'INHUMANS', '9.0'),
    makeDoubanCard('[电视剧]', '异人旅馆', '5.5'),
    makeDoubanCard('[电影]', '剧场版', '7.2'),
  ];
  const { sandbox } = loadScript({
    hostname: 'www.douban.com', pathname: '/search', doubanCards: cards,
  });
  assert.deepEqual(json(sandbox.__AGEDM_TEST__.hooks.findDoubanEntry()), { name: '异人旅馆', rating: 5.5 });
});

test('findDoubanEntry：[电视剧] 在前但无评分也取它（rating 记 null）', () => {
  const cards = [
    makeDoubanCard('[电视剧]', '新番A'),
    makeDoubanCard('[电影]', '剧场版B', '7.2'),
  ];
  const { sandbox } = loadScript({
    hostname: 'www.douban.com', pathname: '/search', doubanCards: cards,
  });
  assert.deepEqual(json(sandbox.__AGEDM_TEST__.hooks.findDoubanEntry()), { name: '新番A', rating: null });
});

test('findDoubanEntry：只有 [电影] 时取电影（剧场版）', () => {
  const cards = [makeDoubanCard('[电影]', '紫罗兰永恒花园外传', '8.8')];
  const { sandbox } = loadScript({
    hostname: 'www.douban.com', pathname: '/search', doubanCards: cards,
  });
  assert.deepEqual(json(sandbox.__AGEDM_TEST__.hooks.findDoubanEntry()), { name: '紫罗兰永恒花园外传', rating: 8.8 });
});

test('findDoubanEntry：无影视条目（豆瓣改版/纯文本结果）→ null', () => {
  const { sandbox } = loadScript({
    hostname: 'www.douban.com',
    pathname: '/search',
    doubanCards: [makeDoubanCard('[小组]', '异人旅馆', '5.5')],
  });
  assert.equal(sandbox.__AGEDM_TEST__.hooks.findDoubanEntry(), null);
});

test('豆瓣记录：搜索词与条目名一致 → 静默记一条，不弹窗', async () => {
  const { sandbox, gmStore, localStore } = loadDouban({ q: '异人旅馆' });
  await flush();
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-dialog'), null, '不弹窗');
  const ratings = json(gmStore.get('agedmDoubanRatings'));
  assert.deepEqual(Object.keys(ratings), ['异人旅馆']);
  assert.equal(ratings['异人旅馆'].rating, 5.5);
  assert.equal(ratings['异人旅馆'].name, '异人旅馆');
  assert.ok(ratings['异人旅馆'].at > 0);
  assert.ok(localStore.has('agedm-douban-ratings-11ze'), '镜像同步');
});

test('豆瓣记录：无搜索词或无影视条目 → 不记录', async () => {
  const noQuery = loadScript({ hostname: 'www.douban.com', pathname: '/search', search: '' });
  await flush();
  assert.equal(noQuery.gmStore.has('agedmDoubanRatings'), false);

  // 无影视条目 → 进轮询，驱动完 15s（500ms×30 拍）超时放弃
  const noEntry = loadDouban({ cards: [makeDoubanCard('[书籍]', '小说', '8.0')] });
  for (let i = 0; i < 30; i++) {
    noEntry.timeouts[i].fn();
    await flush();
  }
  assert.equal(noEntry.timeouts.length, 30, '超时后不再登记新拍');
  assert.equal(noEntry.gmStore.has('agedmDoubanRatings'), false);
});

test('豆瓣记录：条目异步渲染 → 轮询等到后按同词快速路径记录', async () => {
  const { sandbox, gmStore, timeouts } = loadDouban({ q: 'HOTEL INHUMANS', cards: [] });
  assert.equal(timeouts.length, 1, '条目未出现，登记首拍轮询');
  sandbox.document.body.appendChild(makeDoubanCard('[电视剧]', 'hotel inhumans', '5.5'));
  timeouts[0].fn();
  await flush();
  const ratings = json(gmStore.get('agedmDoubanRatings'));
  assert.deepEqual(Object.keys(ratings), ['hotel inhumans']);
  assert.equal(timeouts.length, 1, '命中后不再登记新拍');
});

test('豆瓣记录：名字不一致 → 弹窗文案含搜索词与结果名', () => {
  const { sandbox, gmStore } = loadDouban();
  const dialog = sandbox.document.body.querySelector('.agedm-11ze-dialog');
  assert.ok(dialog, '应弹确认窗');
  const text = nodeText(dialog);
  assert.ok(text.includes('HOTEL INHUMANS') && text.includes('异人旅馆'), '文案含两个名字');
  assert.ok(findBtn(dialog, '绑定并记录两条') && findBtn(dialog, '仅记录搜索词')
    && findBtn(dialog, '本次不记录') && findBtn(dialog, '手动改分'), '四个动作齐全');
  assert.equal(gmStore.has('agedmDoubanRatings'), false, '未选择前不记录');
});

test('豆瓣记录：选「绑定并记录两条」→ 两个名字各一条 + bind 永久记住', async () => {
  const { sandbox, gmStore } = loadDouban();
  findBtn(sandbox.document.body, '绑定并记录两条').handlers.click();
  await flush();
  const ratings = json(gmStore.get('agedmDoubanRatings'));
  assert.deepEqual(Object.keys(ratings).sort(), ['hotel inhumans', '异人旅馆']);
  assert.equal(ratings['hotel inhumans'].rating, 5.5);
  const choices = gmStore.get('agedmRatingPromptChoices');
  assert.equal(choices['hotel inhumans=>异人旅馆'].choice, 'bind');
});

test('豆瓣记录：bind 过的组合再遇 → 静默记两条，不再弹窗', async () => {
  const { sandbox, gmStore } = loadDouban({
    initialStore: { agedmRatingPromptChoices: { 'hotel inhumans=>异人旅馆': { choice: 'bind', at: 1 } } },
  });
  await flush();
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-dialog'), null);
  assert.deepEqual(Object.keys(json(gmStore.get('agedmDoubanRatings'))).sort(), ['hotel inhumans', '异人旅馆']);
});

test('豆瓣记录：选「仅记录搜索词」→ 一条 + skip 冷却', async () => {
  const { sandbox, gmStore } = loadDouban();
  findBtn(sandbox.document.body, '仅记录搜索词').handlers.click();
  await flush();
  const ratings = json(gmStore.get('agedmDoubanRatings'));
  assert.deepEqual(Object.keys(ratings), ['hotel inhumans']);
  assert.equal(gmStore.get('agedmRatingPromptChoices')['hotel inhumans=>异人旅馆'].choice, 'skip');
});

test('豆瓣记录：skip 冷却中（7 天内）→ 静默仅记搜索词条', async () => {
  const { sandbox, gmStore } = loadDouban({
    initialStore: { agedmRatingPromptChoices: { 'hotel inhumans=>异人旅馆': { choice: 'skip', at: Date.now() } } },
  });
  await flush();
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-dialog'), null);
  assert.deepEqual(Object.keys(json(gmStore.get('agedmDoubanRatings'))), ['hotel inhumans']);
});

test('豆瓣记录：skip 已过期 → 重新弹窗', () => {
  const { sandbox } = loadDouban({
    initialStore: { agedmRatingPromptChoices: { 'hotel inhumans=>异人旅馆': { choice: 'skip', at: 0 } } },
  });
  assert.ok(sandbox.document.body.querySelector('.agedm-11ze-dialog'), '冷却过期后应重新弹窗');
});

test('豆瓣记录：选「本次不记录」/ Esc / 点遮罩 → 不记录 + skip 冷却', async () => {
  const cases = [
    (sandbox) => findBtn(sandbox.document.body, '本次不记录').handlers.click(),
    (sandbox) => sandbox.document.handlers.keydown({ key: 'Escape' }),
    (sandbox) => {
      const dialog = sandbox.document.body.querySelector('.agedm-11ze-dialog');
      dialog.handlers.click({ target: dialog });
    },
  ];
  for (const act of cases) {
    const { sandbox, gmStore } = loadDouban();
    act(sandbox);
    await flush();
    assert.equal(gmStore.has('agedmDoubanRatings'), false, '不写评分');
    assert.equal(gmStore.get('agedmRatingPromptChoices')['hotel inhumans=>异人旅馆'].choice, 'skip');
    assert.equal(sandbox.document.body.querySelector('.agedm-11ze-dialog'), null, '弹窗关闭');
    assert.equal(sandbox.document.documentElement.style.overflow, '', '滚动锁恢复');
  }
});

test('豆瓣记录：手动改分 → 输入模式填 7.5，记录搜索词条 7.5', async () => {
  const { sandbox, gmStore } = loadDouban();
  findBtn(sandbox.document.body, '手动改分').handlers.click();
  const input = findByTag(sandbox.document.body, 'input');
  assert.ok(input, '切到输入模式');
  input.value = '7.5';
  findBtn(sandbox.document.body, '确认').handlers.click();
  await flush();
  const ratings = json(gmStore.get('agedmDoubanRatings'));
  assert.deepEqual(Object.keys(ratings), ['hotel inhumans']);
  assert.equal(ratings['hotel inhumans'].rating, 7.5);
  assert.equal(ratings['hotel inhumans'].name, '异人旅馆');
});

test('豆瓣记录：手动改分非法输入 → toast 提示且弹窗留在输入模式', async () => {
  const { sandbox, gmStore, timeouts } = loadDouban();
  findBtn(sandbox.document.body, '手动改分').handlers.click();
  const input = findByTag(sandbox.document.body, 'input');
  input.value = '15';
  findBtn(sandbox.document.body, '确认').handlers.click();
  await flush();
  const toast = sandbox.document.body.querySelector('.agedm-11ze-toast');
  assert.ok(toast && toast.textContent.includes('0-10'), 'toast 提示范围');
  assert.ok(sandbox.document.body.querySelector('.agedm-11ze-dialog'), '弹窗未关');
  assert.equal(gmStore.has('agedmDoubanRatings'), false, '未写记录');
  assert.equal(timeouts.length, 1, 'toast 注册自动消失定时器');
});

test('豆瓣记录：手动改分「返回」→ 回到三选项模式，再选绑定仍可', async () => {
  const { sandbox, gmStore } = loadDouban();
  findBtn(sandbox.document.body, '手动改分').handlers.click();
  findBtn(sandbox.document.body, '返回').handlers.click();
  assert.ok(findBtn(sandbox.document.body, '绑定并记录两条'), '回到三选项');
  findBtn(sandbox.document.body, '绑定并记录两条').handlers.click();
  await flush();
  assert.deepEqual(Object.keys(json(gmStore.get('agedmDoubanRatings'))).sort(), ['hotel inhumans', '异人旅馆']);
});

test('resolveRatingAnswer：bind → 永久绑定，搜索词与条目名各记一条', () => {
  const { sandbox } = loadDouban();
  const entry = { name: '异人旅馆', rating: 5.5 };
  const decision = json(sandbox.__AGEDM_TEST__.hooks
    .resolveRatingAnswer('hotel inhumans', '异人旅馆', entry, 'bind'));
  assert.deepEqual(decision, {
    choice: 'bind',
    keys: ['hotel inhumans', '异人旅馆'],
    entry: { name: '异人旅馆', rating: 5.5 },
  });
});

test('resolveRatingAnswer：only → skip 冷却，只记搜索词条', () => {
  const { sandbox } = loadDouban();
  const entry = { name: '异人旅馆', rating: 5.5 };
  const decision = json(sandbox.__AGEDM_TEST__.hooks
    .resolveRatingAnswer('hotel inhumans', '异人旅馆', entry, 'only'));
  assert.deepEqual(decision, {
    choice: 'skip',
    keys: ['hotel inhumans'],
    entry: { name: '异人旅馆', rating: 5.5 },
  });
});

test('resolveRatingAnswer：manual → skip 冷却，搜索词条记手填分', () => {
  const { sandbox } = loadDouban();
  const entry = { name: '异人旅馆', rating: null };
  const decision = json(sandbox.__AGEDM_TEST__.hooks
    .resolveRatingAnswer('hotel inhumans', '异人旅馆', entry, { manual: 7.5 }));
  assert.deepEqual(decision, {
    choice: 'skip',
    keys: ['hotel inhumans'],
    entry: { name: '异人旅馆', rating: 7.5 },
  });
});

test('resolveRatingAnswer：none 及意外形状 → 只记 skip 冷却，不写评分', () => {
  const { sandbox } = loadDouban();
  const entry = { name: '异人旅馆', rating: 5.5 };
  for (const answer of ['none', null, 'xyz', {}]) {
    const decision = json(sandbox.__AGEDM_TEST__.hooks
      .resolveRatingAnswer('hotel inhumans', '异人旅馆', entry, answer));
    assert.deepEqual(decision, { choice: 'skip' }, `answer=${JSON.stringify(answer)}`);
  }
});

test('writeRating：内部归一化 key——原始名（含大小写/连续空白）直接写入', () => {
  const { sandbox, gmStore } = loadDouban();
  sandbox.__AGEDM_TEST__.hooks.writeRating(
    ['HOTEL  INHUMANS', '异人旅馆 '],
    { name: '异人旅馆', rating: 5.5 },
  );
  const ratings = json(gmStore.get('agedmDoubanRatings'));
  assert.deepEqual(Object.keys(ratings).sort(), ['hotel inhumans', '异人旅馆']);
  assert.equal(ratings['hotel inhumans'].rating, 5.5);
});

test('matchRating：内部归一化名字——原始名也能命中已归一化的 key', () => {
  const { sandbox } = loadDouban({
    initialStore: {
      agedmDoubanRatings: { 'hotel inhumans': { rating: 5.5, name: '异人旅馆', at: 100 } },
    },
  });
  const hooks = sandbox.__AGEDM_TEST__.hooks;
  const entry = hooks.matchRating(['HOTEL  INHUMANS'], hooks.loadRatings());
  assert.ok(entry, '原始名应命中');
  assert.equal(entry.rating, 5.5);
});

/** agedm play 页环境：card-body 含 h5 片名与 .video_detail_info 行 */
function loadPlay({
  path = '/play/20250181/1/1',
  title = '异人旅馆',
  infos = [],
  initialStore = {},
} = {}) {
  return loadScript({
    hostname: 'www.agedm.io',
    pathname: path,
    animeEls: [makePlayBody({ title, infos })],
    initialStore,
  });
}

/** agedm detail 页环境：h2 片名 + detail_imform_list 行 */
function loadDetailPage({
  path = '/detail/20250181',
  title = 'HOTEL INHUMANS',
  rows = [],
  initialStore = {},
} = {}) {
  return loadScript({
    hostname: 'www.agedm.io',
    pathname: path,
    animeEls: makeDetailEls({ title, rows }),
    initialStore,
  });
}

test('agedm 展示（play）：标题命中 → card-body 末尾追加评分行', () => {
  const at = new Date(2026, 9, 6).getTime();
  const { sandbox } = loadPlay({
    infos: [makeDetailInfo('地区：日本')],
    initialStore: { agedmDoubanRatings: { 异人旅馆: { rating: 5.5, name: '异人旅馆', at } } },
  });
  const rows = sandbox.document.body.querySelectorAll('.video_detail_info');
  assert.equal(rows.length, 2, '原有地区行 + 追加评分行');
  assert.equal(nodeText(rows[1]), '豆瓣评分：5.5（异人旅馆，2026-10-06 记录）');
  const score = rows[1].children[1];
  assert.equal(score.textContent, '5.5', '分数单独成 span');
  assert.equal(score.style.color, '#ff9900', '豆瓣评分橙');
  assert.equal(score.style.fontWeight, '600', '分数加粗');
});

test('agedm 展示（play）：标题内被其他脚本挂了按钮（跨站搜索）→ 跳过按钮子树仍命中', () => {
  const at = new Date(2026, 9, 6).getTime();
  const body = makeEl(['card-body']);
  const h5 = makeEl(['card-title'], 'h5');
  h5.append('HOTEL INHUMANS');
  const searchBtn = makeEl([], 'button');
  searchBtn.textContent = '🔍';
  h5.appendChild(searchBtn);
  const detailBtn = makeEl([], 'button');
  detailBtn.textContent = '详情';
  h5.appendChild(detailBtn);
  h5.textContent = 'HOTEL INHUMANS🔍详情'; // 模拟真实 DOM 的 textContent 聚合
  body.appendChild(h5);
  body.appendChild(makeDetailInfo('地区：日本'));
  const { sandbox } = loadScript({
    hostname: 'www.agedm.io',
    pathname: '/play/20250181/1/1',
    animeEls: [body],
    initialStore: { agedmDoubanRatings: { 'hotel inhumans': { rating: 5.5, name: '异人旅馆', at } } },
  });
  const rows = sandbox.document.body.querySelectorAll('.video_detail_info');
  assert.equal(rows.length, 2, '原有地区行 + 追加评分行');
  assert.equal(nodeText(rows[1]), '豆瓣评分：5.5（异人旅馆，2026-10-06 记录）');
});

test('agedm 展示（detail）：h2 片名命中 → imform_list 末尾追加 li 行', () => {
  const at = new Date(2026, 9, 6).getTime();
  const { sandbox } = loadDetailPage({
    title: 'HOTEL INHUMANS',
    rows: [['地区：', '日本'], ['原版名称：', 'ホテル・インヒューマンズ']],
    initialStore: { agedmDoubanRatings: { 'hotel inhumans': { rating: 5.5, name: '异人旅馆', at } } },
  });
  const items = sandbox.document.body.querySelectorAll('.detail_imform_list li');
  assert.equal(items.length, 3, '原有两行 + 追加一行');
  const added = items[items.length - 1];
  assert.equal(added.children[0].textContent, '豆瓣评分：');
  assert.equal(nodeText(added.children[1]), '5.5（异人旅馆，2026-10-06 记录）');
  const score = added.children[1].children[0];
  assert.equal(score.textContent, '5.5', '分数单独成 span');
  assert.equal(score.style.color, '#ff9900', '豆瓣评分橙');
  assert.equal(score.style.fontWeight, '600', '分数加粗');
});

test('agedm 展示（detail）：标题不匹配时按原版名称/其他名称（含分隔符拆分）命中', () => {
  const { sandbox } = loadDetailPage({
    title: '杀手旅店',
    rows: [
      ['原版名称：', 'ホテル・インヒューマンズ'],
      ['其他名称：', '异人旅馆、Hotel Inhumans'],
    ],
    initialStore: {
      agedmDoubanRatings: {
        'hotel inhumans': { rating: 5.8, name: '异人旅馆', at: 200 },
      },
    },
  });
  const items = sandbox.document.body.querySelectorAll('.detail_imform_list li');
  assert.equal(items.length, 3, '原有两行 + 追加一行');
  assert.match(nodeText(items[2]), /5\.8/);
});

test('agedm 展示：多个名字都命中时取记录时间最新的一条', () => {
  const { sandbox } = loadDetailPage({
    title: '杀手旅店',
    rows: [['其他名称：', '异人旅馆']],
    initialStore: {
      agedmDoubanRatings: {
        杀手旅店: { rating: 9.9, name: '错配', at: 100 },
        异人旅馆: { rating: 5.5, name: '异人旅馆', at: 200 },
      },
    },
  });
  const items = sandbox.document.body.querySelectorAll('.detail_imform_list li');
  assert.equal(items.length, 2);
  assert.match(nodeText(items[1]), /5\.5/);
});

test('agedm 展示：暂无评分显示「暂无」+ 查过时间', () => {
  const at = new Date(2026, 9, 6).getTime();
  const { sandbox } = loadPlay({
    infos: [makeDetailInfo('地区：日本')],
    initialStore: { agedmDoubanRatings: { 异人旅馆: { rating: null, name: '异人旅馆', at } } },
  });
  const rows = sandbox.document.body.querySelectorAll('.video_detail_info');
  assert.equal(nodeText(rows[1]), '豆瓣评分：暂无（异人旅馆，2026-10-06 查过）');
  const score = rows[1].children[1];
  assert.equal(score.textContent, '暂无', '「暂无」占分数位同染色');
  assert.equal(score.style.color, '#ff9900', '豆瓣评分橙');
  assert.equal(score.style.fontWeight, '600', '分数加粗');
});

test('agedm 展示：未命中任何记录 → 不追加行', () => {
  const { sandbox } = loadPlay({
    title: '别的动漫',
    initialStore: { agedmDoubanRatings: { 异人旅馆: { rating: 5.5, name: '异人旅馆', at: 1 } } },
  });
  assert.equal(sandbox.document.body.querySelectorAll('.video_detail_info').length, 0);
});

test('agedm 展示：详情行异步渲染 → 轮询等到后仍追加评分行', async () => {
  const at = new Date(2026, 9, 6).getTime();
  const { sandbox, timeouts } = loadScript({
    hostname: 'www.agedm.io',
    pathname: '/play/20250181/1/1',
    animeEls: [makePlayBody({ title: '异人旅馆' })],
    initialStore: { agedmDoubanRatings: { 异人旅馆: { rating: 5.5, name: '异人旅馆', at } } },
  });
  assert.equal(timeouts.length, 1, '详情行未渲染，登记首拍轮询');
  sandbox.document.body.appendChild(makeDetailInfo('地区：日本'));
  timeouts[0].fn();
  await flush();
  const rows = sandbox.document.body.querySelectorAll('.video_detail_info');
  assert.equal(rows.length, 2, '页面详情行 + 追加评分行');
});

test('agedm 展示：结构缺失（改版/m 站 hash 路由）→ 轮询超时后不追加行', async () => {
  const { sandbox, timeouts } = loadScript({
    hostname: 'www.agedm.io',
    pathname: '/detail/20250181',
    initialStore: { agedmDoubanRatings: { 异人旅馆: { rating: 5.5, name: '异人旅馆', at: 1 } } },
  });
  for (let i = 0; i < 30; i++) {
    timeouts[i].fn();
    await flush();
  }
  assert.equal(timeouts.length, 30, '15s（500ms×30 拍）耗尽后停');
  assert.equal(sandbox.document.body.querySelectorAll('.video_detail_info').length, 0);
  assert.equal(sandbox.document.body.querySelectorAll('.detail_imform_list li').length, 0);
});

test('豆瓣记录：同词重搜覆盖刷新（评分变化、at 更新）', async () => {
  const before = Date.now();
  const { sandbox, gmStore } = loadDouban({
    q: '异人旅馆',
    initialStore: { agedmDoubanRatings: { 异人旅馆: { rating: 5.0, name: '异人旅馆', at: 100 } } },
  });
  await flush();
  const ratings = json(gmStore.get('agedmDoubanRatings'));
  assert.equal(ratings['异人旅馆'].rating, 5.5, '评分刷新');
  assert.ok(ratings['异人旅馆'].at >= before, 'at 更新');
});

test('评分双存储：GM 键丢失（导入被覆盖）→ 从本域镜像恢复并回写两边', () => {
  const { sandbox, gmStore } = loadScript({
    initialLocal: { 'agedm-douban-ratings-11ze': JSON.stringify({ a: { rating: 5.5, name: 'A', at: 500 } }) },
  });
  const ratings = sandbox.__AGEDM_TEST__.hooks.loadRatings();
  assert.deepEqual(json(ratings), { a: { rating: 5.5, name: 'A', at: 500 } });
  assert.deepEqual(json(gmStore.get('agedmDoubanRatings')), { a: { rating: 5.5, name: 'A', at: 500 } });
});

test('评分双存储：两台设备互导场景（GM 与镜像各有独有条目）逐条合并不互丢', () => {
  const { sandbox, gmStore, localStore } = loadScript({
    initialStore: { agedmDoubanRatings: { a: { rating: 5, name: 'A', at: 300 }, c: { rating: 7, name: 'C', at: 50 } } },
    initialLocal: {
      'agedm-douban-ratings-11ze': JSON.stringify({ a: { rating: 6, name: 'A', at: 200 }, b: { rating: null, name: 'B', at: 150 } }),
    },
  });
  const ratings = sandbox.__AGEDM_TEST__.hooks.loadRatings();
  assert.equal(ratings.a.at, 300, '同 key 两边都有，at 新者胜');
  assert.ok(ratings.b && ratings.c, '两边独有的条目都保留');
  assert.deepEqual(json(gmStore.get('agedmDoubanRatings')), json(ratings), '合并结果回写 GM');
  assert.deepEqual(JSON.parse(localStore.get('agedm-douban-ratings-11ze')), json(ratings), '合并结果回写镜像');
});

test('评分双存储：条目值损坏（缺字段/非对象）读取时丢弃，好条目不受影响', () => {
  const { sandbox, gmStore } = loadScript({
    initialStore: {
      agedmDoubanRatings: {
        good: { rating: 5.5, name: 'A', at: 100 },
        noName: { rating: 5, at: 100 },
        notObject: 'oops',
        noAt: { rating: 5, name: 'B' },
      },
    },
  });
  const ratings = sandbox.__AGEDM_TEST__.hooks.loadRatings();
  assert.deepEqual(Object.keys(ratings), ['good']);
  assert.deepEqual(json(gmStore.get('agedmDoubanRatings')), { good: { rating: 5.5, name: 'A', at: 100 } });
});

test('评分双存储：两边都无键时不凭空造键', () => {
  const { sandbox, gmStore, localStore } = loadScript();
  assert.deepEqual(json(sandbox.__AGEDM_TEST__.hooks.loadRatings()), {});
  assert.equal(gmStore.has('agedmDoubanRatings'), false);
  assert.equal(localStore.has('agedm-douban-ratings-11ze'), false);
});

test('评分双存储：镜像 JSON 损坏视同无键，GM 胜出并修复镜像', () => {
  const { sandbox, localStore } = loadScript({
    initialStore: { agedmDoubanRatings: { a: { rating: 5.5, name: 'A', at: 500 } } },
    initialLocal: { 'agedm-douban-ratings-11ze': '{oops' },
  });
  const ratings = sandbox.__AGEDM_TEST__.hooks.loadRatings();
  assert.deepEqual(json(ratings), { a: { rating: 5.5, name: 'A', at: 500 } });
  assert.deepEqual(JSON.parse(localStore.get('agedm-douban-ratings-11ze')), { a: { rating: 5.5, name: 'A', at: 500 } });
});

test('评分双存储：localStorage 写失败降级只写 GM，脚本不崩', () => {
  const { sandbox, gmStore } = loadScript({
    setItemThrows: true,
    initialStore: { agedmDoubanRatings: { a: { rating: 5.5, name: 'A', at: 500 } } },
  });
  const ratings = sandbox.__AGEDM_TEST__.hooks.loadRatings();
  assert.deepEqual(json(gmStore.get('agedmDoubanRatings')), json(ratings));
});

test('isTargetPage：换域名仍命中，子路径不命中', () => {
  const hooks = loadHooks();
  assert.equal(hooks.isTargetPage('www.agedm.cc', '/update'), true);
  assert.equal(hooks.isTargetPage('www.agedm.io', '/update/2'), false);
});

test('getCardTitle：取卡片中文标题并 trim', () => {
  const { card } = makeCard('  卡片战斗先导者DivineZ 命运星战篇 \n');
  const hooks = loadHooks();
  assert.equal(hooks.getCardTitle(card), '卡片战斗先导者DivineZ 命运星战篇');
});

test('scanCards：命中名单 → col display:none；未命中不动', async () => {
  const matched = makeCard('动漫A');
  const other = makeCard('动漫B');
  const { sandbox } = loadScript({ cards: [matched, other] });
  await approveDialog(sandbox, sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A'));

  assert.equal(matched.col.style.display, 'none');
  assert.equal(matched.col.getAttribute('data-11ze-hidden'), '1');
  assert.equal(other.col.style.display, undefined);
});

test('scanCards：无标题卡片跳过不报错', () => {
  const card = makeEl(['video_item']);
  const titleBox = makeEl(['video_item-title']);
  const link = makeEl([], 'a');
  link.textContent = '   ';
  titleBox.appendChild(link);
  card.appendChild(titleBox);
  const col = makeEl(['col']);
  col.appendChild(card);

  const hooks = loadHooks({ cards: [{ col, card }] });
  hooks.scanCards();
  assert.equal(col.style.display, undefined);
});

test('scanCards：不在 col 里的裸卡片跳过', async () => {
  const { col, card } = makeCard('动漫A', { withCol: false });
  const { sandbox } = loadScript({ cards: [{ col, card }] });
  await approveDialog(sandbox, sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A'));
  assert.equal(card.style.display, undefined);
});

test('解除屏蔽：移出名单后重扫恢复显示', async () => {
  const matched = makeCard('动漫A');
  const { sandbox, gmStore } = loadScript({ cards: [matched] });
  const hooks = sandbox.__AGEDM_TEST__.hooks;
  await approveDialog(sandbox, hooks.addToBlocked('动漫A'));
  assert.equal(matched.col.style.display, 'none');

  await approveDialog(sandbox, hooks.removeFromBlocked('动漫A'));
  assert.equal(matched.col.style.display, '');
  assert.equal(matched.col.hasAttribute('data-11ze-hidden'), false);
  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], []);
});

test('addToBlocked：名称 trim 后入库，重复添加去重', async () => {
  const { sandbox, gmStore } = loadScript();
  const hooks = sandbox.__AGEDM_TEST__.hooks;
  await approveDialog(sandbox, hooks.addToBlocked('  动漫A  '));
  await approveDialog(sandbox, hooks.addToBlocked('动漫A'));
  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);
});

test('mergeImported：过滤非字符串、trim、去空、与现有名单合并去重', async () => {
  const { sandbox } = loadScript();
  await approveDialog(sandbox, sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A'));
  const merged = sandbox.__AGEDM_TEST__.hooks.mergeImported(['  动漫B ', '动漫A', '', '   ', 123, null]);
  assert.deepEqual([...merged].sort(), ['动漫A', '动漫B']);
});

test('功能开关：关闭后已隐藏卡片恢复，且只恢复自己隐藏的', async () => {
  const mine = makeCard('动漫A');
  const untouched = makeCard('动漫B');
  untouched.col.style.display = 'none'; // 站点自身或他人隐藏的
  const { sandbox } = loadScript({ cards: [mine, untouched] });
  const hooks = sandbox.__AGEDM_TEST__.hooks;
  await approveDialog(sandbox, hooks.addToBlocked('动漫A'));
  assert.equal(mine.col.style.display, 'none');

  hooks.setEnabled(false);
  assert.equal(mine.col.style.display, '');
  assert.equal(untouched.col.style.display, 'none'); // 不属于脚本的不动
});

test('功能开关：关闭后名单保留，重新开启恢复隐藏', async () => {
  const matched = makeCard('动漫A');
  const { sandbox, gmStore } = loadScript({ cards: [matched] });
  const hooks = sandbox.__AGEDM_TEST__.hooks;
  await approveDialog(sandbox, hooks.addToBlocked('动漫A'));
  hooks.setEnabled(false);
  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);

  hooks.setEnabled(true);
  assert.equal(matched.col.style.display, 'none');
});

test('入口按钮：幂等，重复调用不重复注入', () => {
  const { sandbox } = loadScript();
  sandbox.__AGEDM_TEST__.hooks.ensureEntry();
  const entries = sandbox.document.body.children.filter((c) => c.classes.includes('agedm-11ze-entry'));
  assert.equal(entries.length, 1);
});

test('面板列表：倒序列出名单，移出后刷新数量与列表', async () => {
  const { sandbox, gmStore } = loadScript({
    initialStore: { agedmBlockedNames: { list: ['动漫A', '动漫B'], at: 1 } },
  });
  sandbox.__AGEDM_TEST__.hooks.openPanel();
  const list = sandbox.document.body.querySelector('.agedm-11ze-panel-list');
  let items = list.querySelectorAll('li');
  assert.deepEqual(
    [...items].map((li) => li.children[0].textContent),
    ['动漫B', '动漫A'],
    '后屏蔽的排前面',
  );

  const delBtn = collectButtons(items[0]).find((b) => b.textContent === '移出名单');
  delBtn.handlers.click();
  await flush();
  findBtn(sandbox.document.body, '确认').handlers.click();
  await flush();

  assert.deepEqual([...json(gmStore.get('agedmBlockedNames')).list], ['动漫A'], '存储同步移出');
  items = list.querySelectorAll('li');
  assert.equal(items.length, 1, '列表刷新剩一项');
  assert.equal(items[0].children[0].textContent, '动漫A');
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-panel-count').textContent, '1 项');
});

test('入口按钮：连续点击显示、隐藏、再次显示管理面板', () => {
  const { sandbox } = loadScript();
  sandbox.document.body.querySelector('.agedm-11ze-entry').handlers.click();
  const panel = sandbox.document.body.querySelector('.agedm-11ze-panel');
  assert.ok(panel);
  assert.equal(panel.style.display, 'flex');
  const entry = sandbox.document.body.querySelector('.agedm-11ze-entry');
  entry.handlers.click();
  assert.equal(panel.style.display, 'none');
  entry.handlers.click();
  assert.equal(panel.style.display, 'flex');
});

test('面板：打开时不加遮罩、不锁页面滚动，可用关闭按钮隐藏', () => {
  const { sandbox } = loadScript();
  sandbox.__AGEDM_TEST__.hooks.openPanel();
  const body = sandbox.document.body;
  assert.equal(body.querySelector('.agedm-11ze-backdrop'), null);
  assert.equal(body.querySelector('.agedm-11ze-panel').style.display, 'flex');
  assert.notEqual(sandbox.document.documentElement.style.overflow, 'hidden');
  const close = collectButtons(body).find((button) => button.getAttribute('aria-label') === '关闭屏蔽名单');
  assert.ok(close);
  close.handlers.click();
  assert.equal(body.querySelector('.agedm-11ze-panel').style.display, 'none');
});

test('面板：点击内部和入口保持打开，点击外部关闭且可重新打开', () => {
  const { sandbox } = loadScript();
  const { document } = sandbox;
  const entry = document.body.querySelector('.agedm-11ze-entry');
  entry.handlers.click();
  const panel = document.body.querySelector('.agedm-11ze-panel');
  document.handlers.click({ target: panel });
  document.handlers.click({ target: panel.children[0] });
  document.handlers.click({ target: entry });
  assert.equal(panel.style.display, 'flex');
  document.handlers.click({ target: document.body });
  assert.equal(panel.style.display, 'none');
  entry.handlers.click();
  document.handlers.click({ target: entry });
  assert.equal(panel.style.display, 'flex');
});

test('面板：Esc 关闭并恢复页面滚动', () => {
  const { sandbox } = loadScript();
  sandbox.__AGEDM_TEST__.hooks.openPanel();
  sandbox.document.handlers.keydown({ key: 'Escape' });
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-panel').style.display, 'none');
  assert.equal(sandbox.document.documentElement.style.overflow, '');
});

test('面板：确认弹窗内点击与取消冒泡不关闭底下面板', async () => {
  const { sandbox } = loadScript({ initialStore: { agedmBlockedNames: ['动漫A'] } });
  const { document } = sandbox;
  sandbox.__AGEDM_TEST__.hooks.openPanel();
  const panel = document.body.querySelector('.agedm-11ze-panel');
  findBtn(panel, '移出名单').handlers.click();
  const dialog = document.body.querySelector('.agedm-11ze-dialog');
  document.handlers.click({ target: dialog.children[0] });
  assert.equal(panel.style.display, 'flex');
  dialog.handlers.click({ target: dialog });
  document.handlers.click({ target: dialog });
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(panel.style.display, 'flex');
  document.handlers.click({ target: document.body });
  assert.equal(panel.style.display, 'none');
});

test('面板：开关切换状态，保留名单并同步可访问状态', () => {
  const { sandbox, gmStore } = loadScript({ initialStore: { agedmBlockedNames: ['动漫A'] } });
  sandbox.__AGEDM_TEST__.hooks.openPanel();
  const panel = sandbox.document.body.querySelector('.agedm-11ze-panel');
  const toggle = panel.querySelector('.agedm-11ze-panel-toggle');
  assert.ok(toggle);
  assert.equal(toggle.getAttribute('role'), 'switch');
  assert.equal(toggle.getAttribute('aria-checked'), 'true');
  toggle.handlers.click();
  assert.equal(gmStore.get('agedmEnabled'), false);
  assert.equal(toggle.getAttribute('aria-checked'), 'false');
  assert.equal(panel.querySelector('.agedm-11ze-panel-status').textContent, '屏蔽已停用');
  toggle.handlers.click();
  assert.equal(gmStore.get('agedmEnabled'), true);
  assert.equal(toggle.getAttribute('aria-checked'), 'true');
  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);
});

test('屏蔽按钮：载入时注入 × 按钮，点击即屏蔽对应卡片', async () => {
  const target = makeCard('动漫A');
  const { sandbox, gmStore } = loadScript({ cards: [target] });
  const btn = target.card.querySelector('.agedm-11ze-block-btn');
  assert.ok(btn, '卡片图片区右上角应有 × 按钮');

  btn.handlers.click({ preventDefault() {}, stopPropagation() {} });
  findBtn(sandbox.document.body, '确认').handlers.click();
  await new Promise((resolve) => setTimeout(resolve));
  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);
  assert.equal(target.col.style.display, 'none');
});

test('屏蔽按钮：图形 × 有独立可访问名称，不污染卡片名称', () => {
  const target = makeCard('动漫A');
  const hooks = loadHooks({ cards: [target] });
  const button = target.card.querySelector('.agedm-11ze-block-btn');
  assert.equal(button.getAttribute('aria-label'), '屏蔽这部动漫');
  assert.equal(button.querySelector('svg')?.getAttribute('aria-hidden'), 'true');
  assert.equal(hooks.getCardTitle(target.card), '动漫A');
});

test('屏蔽按钮：ensureBlockButtons 幂等，重复调用不重复注入', () => {
  const target = makeCard('动漫A');
  const { sandbox } = loadScript({ cards: [target] });
  const hooks = sandbox.__AGEDM_TEST__.hooks;
  hooks.ensureBlockButtons();
  const buttons = target.card.querySelector('.video_item--image').children.filter((c) =>
    c.classes.includes('agedm-11ze-block-btn'),
  );
  assert.equal(buttons.length, 1);
});

test('功能开关：关闭时移除屏蔽按钮，重开时恢复', () => {
  const target = makeCard('动漫A');
  const hooks = loadHooks({ cards: [target] });
  assert.ok(target.card.querySelector('.agedm-11ze-block-btn'));

  hooks.setEnabled(false);
  assert.equal(target.card.querySelector('.agedm-11ze-block-btn'), null);

  hooks.setEnabled(true);
  assert.ok(target.card.querySelector('.agedm-11ze-block-btn'));
});

test('星期注解：日文星期按钮追加中文星期', () => {
  const texts = [
    '今天 (土曜日)',
    '昨天 (金曜日)',
    '前天 (木曜日)',
    '2026-09-30 (水曜日)',
    '2026-09-29 (火曜日)',
    '2026-09-28 (月曜日)',
    '2026-09-27 (日曜日)',
  ];
  const buttons = texts.map((text) => {
    const btn = makeEl(['btn-danger'], 'button');
    btn.textContent = text;
    return btn;
  });
  loadScript({ btnDanger: buttons });

  assert.deepEqual(
    buttons.map((b) => b.textContent),
    [
      '今天 (土曜日/周六)',
      '昨天 (金曜日/周五)',
      '前天 (木曜日/周四)',
      '2026-09-30 (水曜日/周三)',
      '2026-09-29 (火曜日/周二)',
      '2026-09-28 (月曜日/周一)',
      '2026-09-27 (日曜日/周日)',
    ],
  );
});

test('星期注解：登录等无曜日按钮不动，重复调用幂等，不受屏蔽开关联动', () => {
  const login = makeEl(['btn-danger'], 'button');
  login.textContent = '登录 | 注册';
  const weekday = makeEl(['btn-danger'], 'button');
  weekday.textContent = '今天 (土曜日)';
  const { sandbox } = loadScript({ btnDanger: [login, weekday] });
  const hooks = sandbox.__AGEDM_TEST__.hooks;

  hooks.setEnabled(false);
  hooks.annotateWeekdays();

  assert.equal(login.textContent, '登录 | 注册');
  assert.equal(weekday.textContent, '今天 (土曜日/周六)');
});

test('滚动轻推：readyState complete → init 即下移 1px，隔一帧复位回原位', () => {
  const { scrollCalls, rafQueue } = loadScript({ readyState: 'complete' });
  assert.deepEqual(json(scrollCalls), [{ api: 'scrollBy', top: 1, behavior: 'instant' }], '先下移 1px');
  assert.equal(rafQueue.length, 1, '复位挂在下一帧');
  rafQueue[0]();
  assert.deepEqual(json(scrollCalls), [
    { api: 'scrollBy', top: 1, behavior: 'instant' },
    { api: 'scrollTo', top: 0, behavior: 'instant' },
  ], '下一帧复位回初始 scrollY');
});

test('滚动轻推：未加载完（loading）→ 挂 load 监听，load 后才轻推', () => {
  const { sandbox, scrollCalls, rafQueue } = loadScript();
  assert.deepEqual(scrollCalls, [], 'load 前不滚动');
  assert.ok(sandbox.handlers.load, '应注册 load 监听');
  sandbox.handlers.load();
  assert.deepEqual(json(scrollCalls), [{ api: 'scrollBy', top: 1, behavior: 'instant' }]);
  rafQueue[0]();
  assert.deepEqual(json(scrollCalls), [
    { api: 'scrollBy', top: 1, behavior: 'instant' },
    { api: 'scrollTo', top: 0, behavior: 'instant' },
  ]);
});

test('滚动轻推：初始停在 scrollY 123 → 复位目标 123（页面在底部/中部都无净位移）', () => {
  const { scrollCalls, rafQueue } = loadScript({ readyState: 'complete', initialScrollY: 123 });
  rafQueue[0]();
  assert.deepEqual(json(scrollCalls[1]), { api: 'scrollTo', top: 123, behavior: 'instant' });
});

test('滚动轻推：仅 update 页——豆瓣搜索页与 detail 页不挂 load、不滚动', () => {
  for (const opts of [
    { hostname: 'www.douban.com', pathname: '/search', search: '?q=测试' },
    { hostname: 'www.agedm.io', pathname: '/detail/20250181' },
  ]) {
    const { sandbox, scrollCalls } = loadScript(opts);
    assert.equal(sandbox.handlers.load, undefined, `${opts.pathname} 不挂 load 监听`);
    assert.deepEqual(scrollCalls, [], `${opts.pathname} 不滚动`);
  }
});

test('屏蔽确认：弹窗文案含动漫名，确认后入库并隐藏', async () => {
  const target = makeCard('动漫A');
  const { sandbox, gmStore } = loadScript({ cards: [target] });
  const p = sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A');
  const dialog = sandbox.document.body.querySelector('.agedm-11ze-dialog');
  assert.ok(dialog, '应有确认弹窗');
  assert.ok(nodeText(dialog).includes('屏蔽「动漫A」？'), '弹窗文案应含动漫名');

  await approveDialog(sandbox, p);
  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);
  assert.equal(target.col.style.display, 'none');
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-dialog'), null, '确认后弹窗移除');
});

test('屏蔽确认：取消时不入库、不隐藏、不写存储', async () => {
  const target = makeCard('动漫A');
  const { sandbox, gmStore } = loadScript({ cards: [target] });
  const p = sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A');
  findBtn(sandbox.document.body, '取消').handlers.click();
  await p;
  assert.equal(gmStore.has('agedmBlockedNames'), false);
  assert.equal(target.col.style.display, undefined);
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-dialog'), null);
});

test('确认弹窗：Esc 等同取消，滚动锁随弹窗关闭恢复', async () => {
  const target = makeCard('动漫A');
  const { sandbox, gmStore } = loadScript({ cards: [target] });
  const doc = sandbox.document;
  const p = sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A');
  assert.equal(doc.documentElement.style.overflow, 'hidden', '面板未开时弹窗也要锁滚动');
  doc.handlers.keydown({ key: 'Escape' });
  await p;
  assert.equal(doc.body.querySelector('.agedm-11ze-dialog'), null);
  assert.equal(doc.documentElement.style.overflow, '');
  assert.equal(gmStore.has('agedmBlockedNames'), false);
});

test('确认弹窗：点弹窗遮罩等同取消', async () => {
  const target = makeCard('动漫A');
  const { sandbox } = loadScript({ cards: [target] });
  const p = sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A');
  const dialog = sandbox.document.body.querySelector('.agedm-11ze-dialog');
  dialog.handlers.click({ target: dialog });
  await p;
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-dialog'), null);
});

test('确认弹窗：Esc 先关弹窗再关面板，层层退出', async () => {
  const { sandbox } = loadScript();
  const doc = sandbox.document;
  sandbox.__AGEDM_TEST__.hooks.openPanel();
  const p = sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A');
  doc.handlers.keydown({ key: 'Escape' });
  await p;
  assert.equal(doc.body.querySelector('.agedm-11ze-dialog'), null, '弹窗已关');
  assert.equal(doc.body.querySelector('.agedm-11ze-panel').style.display, 'flex', '面板仍开');
  assert.equal(doc.documentElement.style.overflow, '');
  doc.handlers.keydown({ key: 'Escape' });
  assert.equal(doc.body.querySelector('.agedm-11ze-panel').style.display, 'none');
  assert.equal(doc.documentElement.style.overflow, '');
});

test('移除确认：弹窗文案含动漫名，取消时名单不变、确认时移出', async () => {
  const cancelled = loadScript({ initialStore: { agedmBlockedNames: ['动漫A'] } });
  const p1 = cancelled.sandbox.__AGEDM_TEST__.hooks.removeFromBlocked('动漫A');
  assert.ok(nodeText(cancelled.sandbox.document.body.querySelector('.agedm-11ze-dialog')).includes('动漫A'));
  findBtn(cancelled.sandbox.document.body, '取消').handlers.click();
  await p1;
  assert.deepEqual([...cancelled.gmStore.get('agedmBlockedNames').list], ['动漫A']);

  const approved = loadScript({ initialStore: { agedmBlockedNames: ['动漫A'] } });
  await approveDialog(approved.sandbox, approved.sandbox.__AGEDM_TEST__.hooks.removeFromBlocked('动漫A'));
  assert.deepEqual([...approved.gmStore.get('agedmBlockedNames').list], []);
});

test('清空确认：取消时名单保留，确认时两边键都删除且文案含项数', async () => {
  const cancelled = loadScript({ initialStore: { agedmBlockedNames: ['动漫A', '动漫B'] } });
  const p1 = cancelled.sandbox.__AGEDM_TEST__.hooks.clearBlocked();
  assert.ok(nodeText(cancelled.sandbox.document.body.querySelector('.agedm-11ze-dialog')).includes('2 项'));
  findBtn(cancelled.sandbox.document.body, '取消').handlers.click();
  await p1;
  assert.deepEqual([...cancelled.gmStore.get('agedmBlockedNames').list], ['动漫A', '动漫B']);

  const approved = loadScript({ initialStore: { agedmBlockedNames: ['动漫A', '动漫B'] } });
  await approveDialog(approved.sandbox, approved.sandbox.__AGEDM_TEST__.hooks.clearBlocked());
  assert.equal(approved.gmStore.has('agedmBlockedNames'), false);
  assert.equal(approved.localStore.has('agedm-blocked-11ze'), false);
});

test('导入失败：文件非 JSON 数组 → toast 提示并自动消失', async () => {
  const { sandbox, timeouts } = loadScript();
  sandbox.__AGEDM_TEST__.hooks.openPanel();
  const fileInput = findByTag(sandbox.document.body, 'input');
  fileInput.files = [{ __text: '不是JSON' }];
  fileInput.handlers.change();

  const toast = sandbox.document.body.querySelector('.agedm-11ze-toast');
  assert.ok(toast, '应出现 toast 而非原生 alert');
  assert.ok(toast.textContent.includes('导入失败'));

  assert.equal(timeouts.length, 1, '注册一个自动消失定时器');
  timeouts[0].fn();
  assert.equal(sandbox.document.body.querySelector('.agedm-11ze-toast'), null);
});

test('双存储：旧版裸数组启动即升级为 {list, at} 并同步镜像', () => {
  const target = makeCard('动漫A');
  const { gmStore, localStore } = loadScript({
    cards: [target],
    initialStore: { agedmBlockedNames: ['动漫A'] },
  });

  const entry = gmStore.get('agedmBlockedNames');
  assert.deepEqual([...entry.list], ['动漫A']);
  assert.equal(entry.at, 0, '旧格式升级后视为最旧');
  assert.deepEqual(JSON.parse(localStore.get('agedm-blocked-11ze')), { list: ['动漫A'], at: 0 });
  assert.equal(target.col.style.display, 'none');
});

test('双存储：GM 键丢失（导出导入被覆盖）→ 从镜像恢复并按原 at 回写两边', () => {
  const target = makeCard('动漫A');
  const { gmStore, localStore } = loadScript({
    cards: [target],
    initialLocal: { 'agedm-blocked-11ze': JSON.stringify({ list: ['动漫A'], at: 500 }) },
  });

  const entry = gmStore.get('agedmBlockedNames');
  assert.deepEqual([...entry.list], ['动漫A']);
  assert.equal(entry.at, 500);
  assert.deepEqual(JSON.parse(localStore.get('agedm-blocked-11ze')), { list: ['动漫A'], at: 500 });
  assert.equal(target.col.style.display, 'none');
});

test('双存储：镜像无键（换镜像域名）→ 用 GM 名单并补写镜像', () => {
  const target = makeCard('动漫A');
  const { gmStore, localStore } = loadScript({
    cards: [target],
    initialStore: { agedmBlockedNames: { list: ['动漫A'], at: 500 } },
  });

  assert.deepEqual(gmStore.get('agedmBlockedNames').at, 500);
  assert.deepEqual(JSON.parse(localStore.get('agedm-blocked-11ze')), { list: ['动漫A'], at: 500 });
  assert.equal(target.col.style.display, 'none');
});

test('双存储：两边有键比 at——镜像较新（GM 被旧数据覆盖）→ 镜像胜出', () => {
  const target = makeCard('动漫A');
  const { gmStore, localStore } = loadScript({
    cards: [target],
    initialStore: { agedmBlockedNames: { list: ['另一台设备的旧名单'], at: 100 } },
    initialLocal: { 'agedm-blocked-11ze': JSON.stringify({ list: ['动漫A'], at: 200 }) },
  });

  const entry = gmStore.get('agedmBlockedNames');
  assert.deepEqual([...entry.list], ['动漫A']);
  assert.equal(entry.at, 200);
  assert.deepEqual(JSON.parse(localStore.get('agedm-blocked-11ze')), { list: ['动漫A'], at: 200 });
  assert.equal(target.col.style.display, 'none');
});

test('双存储：两边有键比 at——GM 较新 → GM 胜出，镜像被刷新', () => {
  const { gmStore, localStore } = loadScript({
    initialStore: { agedmBlockedNames: { list: ['动漫A'], at: 300 } },
    initialLocal: { 'agedm-blocked-11ze': JSON.stringify({ list: ['旧域名上的旧名单'], at: 200 }) },
  });

  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);
  assert.deepEqual(JSON.parse(localStore.get('agedm-blocked-11ze')), { list: ['动漫A'], at: 300 });
});

test('双存储：两边有键同 at → GM 胜出（维持现状）', () => {
  const { gmStore } = loadScript({
    initialStore: { agedmBlockedNames: { list: ['GM名单'], at: 500 } },
    initialLocal: { 'agedm-blocked-11ze': JSON.stringify({ list: ['镜像名单'], at: 500 }) },
  });

  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['GM名单']);
});

test('双存储：名单变化后 GM 与镜像的 list、at 完全一致', async () => {
  const { sandbox, gmStore, localStore } = loadScript({
    initialStore: { agedmBlockedNames: { list: ['旧条目'], at: 100 } },
  });
  await approveDialog(sandbox, sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A'));

  const entry = gmStore.get('agedmBlockedNames');
  const mirror = JSON.parse(localStore.get('agedm-blocked-11ze'));
  assert.ok(entry.at > 100, 'at 应刷新');
  assert.deepEqual([...entry.list], ['旧条目', '动漫A']);
  assert.deepEqual([...mirror.list], ['旧条目', '动漫A']);
  assert.equal(mirror.at, entry.at);
});

test('双存储：localStorage 写入失败（禁 cookie/配额满）降级只写 GM，脚本不崩', async () => {
  const target = makeCard('动漫A');
  const { sandbox, gmStore } = loadScript({ cards: [target], setItemThrows: true });

  await approveDialog(sandbox, sandbox.__AGEDM_TEST__.hooks.addToBlocked('动漫A'));
  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);
  assert.equal(target.col.style.display, 'none');
});

test('双存储：镜像 JSON 损坏视同无键，GM 胜出并修复镜像', () => {
  const target = makeCard('动漫A');
  const { gmStore, localStore } = loadScript({
    cards: [target],
    initialStore: { agedmBlockedNames: { list: ['动漫A'], at: 500 } },
    initialLocal: { 'agedm-blocked-11ze': '{oops' },
  });

  assert.deepEqual([...gmStore.get('agedmBlockedNames').list], ['动漫A']);
  assert.deepEqual(JSON.parse(localStore.get('agedm-blocked-11ze')), { list: ['动漫A'], at: 500 });
  assert.equal(target.col.style.display, 'none');
});

test('样式常量：配色收敛前的硬编码色值不回归，SITE_* 常量在 CSS 模板中被引用', () => {
  // 只防已知旧值回归，拦不住新增硬编码；新色值靠 conventions 的 grep 纪律
  const outsideConstDefs = source.replace(/^.*const SITE_.*$/gm, '');
  for (const legacy of ['#dc3545', '#c82333', '#1c1c1e', '#3a3a3c', '#98989d']) {
    assert.ok(!outsideConstDefs.includes(legacy), `旧硬编码色值 ${legacy} 回归`);
  }
  for (const ref of ['${SITE_ACCENT}', '${SITE_ACCENT_HOVER}', '${SITE_SURFACE}', '${SITE_SURFACE_ALPHA}']) {
    assert.ok(source.includes(ref), `${ref} 未被引用`);
  }
});


test('合并：AGE 播放页同时显示搜索按钮与旧评分快照，点击仍使用完整片名', () => {
  const wrapper = makeEl(['body_content_wrapper']);
  const body = makePlayBody({ title: '异人旅馆 & #1', infos: [makeDetailInfo('地区：日本')] });
  wrapper.appendChild(body);
  const at = new Date(2026, 9, 6).getTime();
  const { sandbox } = loadScript({
    pathname: '/play/20250181/1/1',
    animeEls: [wrapper],
    initialStore: { agedmDoubanRatings: { '异人旅馆 & #1': { rating: 5.5, name: '异人旅馆', at } } },
  });
  const buttons = collectButtons(body);
  assert.equal(buttons.length, 4);
  buttons[1].handlers.click();
  assert.deepEqual(sandbox.openCalls, [{
    url: 'https://www.douban.com/search?q=%E5%BC%82%E4%BA%BA%E6%97%85%E9%A6%86%20%26%20%231',
    target: '_blank',
  }]);
  const rows = body.querySelectorAll('.video_detail_info');
  assert.equal(rows.length, 2);
  assert.equal(nodeText(rows[1]), '豆瓣评分：5.5（异人旅馆，2026-10-06 记录）');
});


test('迁移：旧名单与停用状态保留，评分快照和确认决定不被搜索入口改写', () => {
  const initialStore = {
    agedmBlockedNames: { list: ['异人旅馆'], at: 123 },
    agedmEnabled: false,
    agedmDoubanRatings: { 异人旅馆: { rating: 5.5, name: '异人旅馆', at: 456 } },
    agedmRatingPromptChoices: { '异人旅馆=>异人旅馆原名': { choice: 'bind', at: 789 } },
  };
  const before = JSON.stringify(initialStore);
  const { sandbox, gmStore, localStore } = loadScript({
    initialStore,
    cards: [makeCard('异人旅馆')],
  });
  assert.equal(JSON.stringify(Object.fromEntries(gmStore)), before);
  assert.equal(localStore.get('agedm-blocked-11ze'), '{"list":["异人旅馆"],"at":123}');
  assert.equal(sandbox.document.body.querySelector('.col').style.display, undefined);
  sandbox.document.body.querySelector('.agedm-11ze-entry').handlers.click();
  const panel = sandbox.document.body.querySelector('.agedm-11ze-panel');
  assert.ok(nodeText(panel).includes('异人旅馆'));
});

test('合并：B 站与豆瓣条目页仍提供搜索，且不创建 AGE 数据', () => {
  for (const [hostname, pathname] of [
    ['www.bilibili.com', '/bangumi/play/ep173287'],
    ['www.douban.com', '/subject/26363254/'],
  ]) {
    const wrapper = makeEl([], 'h1');
    const title = makeEl(hostname.includes('bilibili') ? ['mediainfo_mediaTitle__abc'] : [],
      hostname.includes('bilibili') ? 'a' : 'span');
    title.append('异人旅馆');
    wrapper.appendChild(title);
    const { sandbox, gmStore, localStore } = loadScript({ hostname, pathname, animeEls: [wrapper] });
    const buttons = collectButtons(wrapper);
    assert.equal(buttons.length, 2);
    buttons[0].handlers.click();
    assert.deepEqual(sandbox.openCalls, [{
      url: 'https://so.wangze.tech?q=%E5%BC%82%E4%BA%BA%E6%97%85%E9%A6%86', target: '_blank',
    }]);
    assert.equal(gmStore.size, 0);
    assert.equal(localStore.size, 0);
  }
});

// 搜索入口的既有回归用例；单独词法作用域保留原测试桩。
{
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const sourcePath = path.join(currentDir, '../src/agedm.user.js');

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
        info() {},
        error() {},
        warn() {},
      },
      URL: URL,
      URLSearchParams,
      GM_getValue(key, fallback) { return fallback; },
      GM_setValue() { throw new Error('搜索入口不应写入存储'); },
      GM_deleteValue() { throw new Error('搜索入口不应删除存储'); },
      localStorage: { getItem() { return null; } },
      setTimeout() {},
      __styleInjections: [],
      GM_addStyle(css) {
        sandbox.__styleInjections.push(css);
      },
      location: {
        href: pageHref,
        hostname: pageUrl.hostname,
        search: pageUrl.search,
        origin: pageUrl.origin,
        pathname: pageUrl.pathname,
      },
      document: {
        querySelectorAll() { return []; },
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
    vm.runInContext(source, sandbox, { filename: 'agedm.user.js' });

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
}
