'use strict';

/**
 * popup 开关生命周期测试
 *
 * 通过 vm 桩环境执行 url_viewer.user.js 全文，从 GM_registerMenuCommand 桩
 * 捕获菜单入口、从 document 桩捕获 keydown 入口，在入口行为层面断言：
 * open 幂等（连点菜单不叠层）、任何关路径都成对摘除 document click 监听器。
 * 历史缺陷：幂等检查与 listener 清理各只覆盖一条路径（菜单连点叠同 ID popup、
 * Ctrl+U/关闭钮关闭后旧监听器空转），死 ID 'url-reader-menu-item' 判断恒假。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/url_viewer.user.js');

function makeEl(tag) {
  const el = {
    tagName: tag,
    id: '',
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    children: [],
    listeners: {},
    parentElement: null,
    appendChild(child) {
      el.children.push(child);
      child.parentElement = el;
      return child;
    },
    remove() {
      const parent = el.parentElement;
      if (parent) {
        const index = parent.children.indexOf(el);
        if (index !== -1) parent.children.splice(index, 1);
      }
      el.parentElement = null;
    },
    addEventListener(type, handler) {
      el.listeners[type] = handler;
    },
    removeEventListener() {},
    replaceWith(replacement) {
      const parent = el.parentElement;
      if (parent) {
        const index = parent.children.indexOf(el);
        if (index !== -1) parent.children.splice(index, 1, replacement);
      }
      replacement.parentElement = parent;
      el.parentElement = null;
    },
    querySelector(selector) {
      // 支持底栏用的 '.className' 形式
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        return findDescendant(
          el,
          (node) =>
            typeof node.className === 'string' &&
            node.className.split(/\s+/).includes(cls)
        );
      }
      return null;
    },
    contains(node) {
      if (el === node) return true;
      return el.children.some(
        (child) => typeof child.contains === 'function' && child.contains(node)
      );
    },
    classList: {
      add(...names) {
        const classes = el.className ? el.className.split(/\s+/) : [];
        for (const name of names) {
          if (!classes.includes(name)) classes.push(name);
        }
        el.className = classes.join(' ');
      },
      remove(...names) {
        const classes = el.className ? el.className.split(/\s+/) : [];
        el.className = classes.filter((name) => !names.includes(name)).join(' ');
      },
      toggle() {},
    },
  };
  return el;
}

/** 找子树里第一个匹配的元素（浅遍历整树） */
function findDescendant(root, predicate) {
  for (const child of root.children) {
    if (predicate(child)) return child;
    const found = findDescendant(child, predicate);
    if (found) return found;
  }
  return null;
}

function loadScript({ href: pageHref = 'https://example.com/p?x=1#frag#b?y=2' } = {}) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const menuCommands = [];
  const docListeners = [];
  // 导航事件按发生顺序记录：href 赋值与 reload 的先后是 v0.4.3 修复的契约
  const navigation = { events: [] };

  const body = makeEl('body');
  const document = {
    createElement: makeEl,
    getElementById: (id) =>
      body.children.find((child) => child.id === id) ?? null,
    addEventListener(type, handler) {
      docListeners.push({ type, handler });
    },
    removeEventListener(type, handler) {
      const index = docListeners.findIndex(
        (entry) => entry.type === type && entry.handler === handler
      );
      if (index !== -1) docListeners.splice(index, 1);
    },
    body,
  };

  const location = {
    reload() {
      navigation.events.push({ type: 'reload' });
    },
  };
  Object.defineProperty(location, 'href', {
    get() {
      return pageHref;
    },
    set(value) {
      navigation.events.push({ type: 'href', value });
    },
  });

  const sandbox = {
    console: { log() {}, error() {}, warn() {} },
    URL,
    URLSearchParams,
    setTimeout,
    GM_addStyle() {},
    GM_registerMenuCommand(label, callback) {
      menuCommands.push({ label, callback });
    },
    addEventListener() {},
    document,
    location,
    __URL_VIEWER_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'url_viewer.user.js' });

  return {
    body,
    document,
    docListeners,
    navigation,
    openFromMenu: () => menuCommands[0].callback(),
    pressCtrlU: () => {
      const keydown = docListeners.find((entry) => entry.type === 'keydown');
      keydown.handler({ ctrlKey: true, key: 'u', preventDefault() {} });
    },
    clickOutside: () => {
      const click = docListeners.find((entry) => entry.type === 'click');
      click.handler({ target: body });
    },
    popupCount: () =>
      body.children.filter((child) => child.id === '11ze-url-reader-popup')
        .length,
    findCloseButton: (popup) =>
      findDescendant(
        popup,
        (el) => el.tagName === 'button' && el.textContent === '关闭（Ctrl + U）'
      ),
    clickListeners: () =>
      docListeners.filter((entry) => entry.type === 'click').length,
  };
}

test('菜单连点两次不叠层：body 里始终只有一个 popup', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  viewer.openFromMenu();

  assert.equal(viewer.popupCount(), 1);
});

test('Ctrl+U 关闭后 document 上无残留 click 监听器', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  assert.equal(viewer.clickListeners(), 1);

  viewer.pressCtrlU();
  assert.equal(viewer.popupCount(), 0);
  assert.equal(viewer.clickListeners(), 0);
});

test('关闭钮关闭后 popup 移除且 click 监听器成对摘除', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  const popup = viewer.body.children.find(
    (child) => child.id === '11ze-url-reader-popup'
  );
  const closeButton = viewer.findCloseButton(popup);
  closeButton.onclick();

  assert.equal(viewer.popupCount(), 0);
  assert.equal(viewer.clickListeners(), 0);
});

test('点外部关闭后 click 监听器成对摘除', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  viewer.clickOutside();

  assert.equal(viewer.popupCount(), 0);
  assert.equal(viewer.clickListeners(), 0);
});

test('裸 % 的 href：打开不抛 URIError，弹窗照常出现', () => {
  const viewer = loadScript({ href: 'https://example.com/p?q=100%' });

  viewer.openFromMenu();

  assert.equal(viewer.popupCount(), 1);
});

// ==================== 编辑会话组合层 ====================
// 纯函数（parseUrl/buildUrl/shouldReloadAfterNavigate）各自在 url.test 锁定，
// 这里锁的是把它们串起来的 confirm/cancel 调用序列——v0.4.3 的 reload 竞态
// 缺陷正出在这层。期望 URL 字面量取自 url.test 的 buildUrl 既有用例。

function getPopup(viewer) {
  return viewer.body.children.find(
    (child) => child.id === '11ze-url-reader-popup'
  );
}

function clickBarButton(popup, text) {
  const button = findDescendant(
    popup,
    (el) => el.tagName === 'button' && el.textContent === text
  );
  button.onclick();
}

test('编辑→确定：采纳输入值，href 收到新串，search 变化不 reload', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  const popup = getPopup(viewer);
  clickBarButton(popup, '编辑');
  const input = findDescendant(popup, (el) => el.tagName === 'input');
  input.value = '9';
  clickBarButton(popup, '确定');

  assert.deepEqual(viewer.navigation.events, [
    { type: 'href', value: 'https://example.com/p?x=9#frag#b?y=2' },
  ]);
});

test('编辑→确定（值未变）：same-document 导航补 reload，href 赋值在前', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  const popup = getPopup(viewer);
  clickBarButton(popup, '编辑');
  clickBarButton(popup, '确定');

  assert.deepEqual(viewer.navigation.events, [
    { type: 'href', value: 'https://example.com/p?x=1#frag#b?y=2' },
    { type: 'reload' },
  ]);
});

test('编辑→取消：不导航，input 换回 span 且按模型值渲染', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  const popup = getPopup(viewer);
  clickBarButton(popup, '编辑');
  const input = findDescendant(popup, (el) => el.tagName === 'input');
  input.value = 'zzz';
  clickBarButton(popup, '取消');

  assert.deepEqual(viewer.navigation.events, []);
  assert.equal(findDescendant(popup, (el) => el.tagName === 'input'), null);
  assert.notEqual(
    findDescendant(popup, (el) => el.tagName === 'span' && el.textContent === '1'),
    null
  );
  assert.equal(
    findDescendant(popup, (el) => el.textContent === 'zzz'),
    null
  );
});

// ==================== 弹窗重设计（v0.5.0，定稿方向 C 极简） ====================
// 锁 UI 结构决策：多段序号徽标、复制提示与值 span 同生命周期。
// hover 底色/前景色与提示显隐是纯 CSS（GM_addStyle），DOM 桩测不到，不在此锁。

function countDescendants(root, predicate) {
  let count = 0;
  const walk = (node) => {
    for (const child of node.children) {
      if (predicate(child)) count += 1;
      walk(child);
    }
  };
  walk(root);
  return count;
}

function isSegNo(el) {
  return (
    typeof el.className === 'string' &&
    el.className.split(/\s+/).includes('pv-seg-no')
  );
}

test('多段 URL：每个段头显示序号徽标（1/2/3）', () => {
  const viewer = loadScript(); // 默认 href 拆成 3 段

  viewer.openFromMenu();
  const popup = getPopup(viewer);

  const badgeTexts = [];
  const walk = (node) => {
    for (const child of node.children) {
      if (isSegNo(child)) badgeTexts.push(child.textContent);
      walk(child);
    }
  };
  walk(popup);

  assert.deepEqual(badgeTexts, ['1', '2', '3']);
});

test('单段 URL：无序号徽标', () => {
  const viewer = loadScript({ href: 'https://example.com/p?x=1' });

  viewer.openFromMenu();
  const popup = getPopup(viewer);

  assert.equal(countDescendants(popup, isSegNo), 0);
});

test('「复制值」提示：查看模式存在，编辑模式随值 span 替换消失，取消后恢复', () => {
  const viewer = loadScript();

  viewer.openFromMenu();
  const popup = getPopup(viewer);
  const isValueHint = (el) =>
    el.tagName === 'span' && el.textContent === '复制值';

  assert.equal(countDescendants(popup, isValueHint) > 0, true);

  clickBarButton(popup, '编辑');
  // .editing 门控查看态 hover 底色（CSS），挂类时机在此锁
  assert.ok(popup.className.split(/\s+/).includes('editing'));
  assert.equal(countDescendants(popup, isValueHint), 0);
  // 键名不可编辑：键名提示保留，键名仍可点击复制
  assert.equal(
    countDescendants(
      popup,
      (el) => el.tagName === 'span' && el.textContent === '复制键名'
    ) > 0,
    true
  );

  clickBarButton(popup, '取消');
  assert.equal(countDescendants(popup, isValueHint) > 0, true);
  assert.ok(!popup.className.split(/\s+/).includes('editing'));
});
