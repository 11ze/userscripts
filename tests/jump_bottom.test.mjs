'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/jump_bottom.user.js', import.meta.url), 'utf8');

function loadScript({ documentHeight = 2000, clientHeight = 800, mail = null, elements = [] } = {}) {
  const buttons = [];
  const scrolls = [];
  const styles = [];
  const sandbox = {
    document: {
      documentElement: { scrollHeight: documentHeight, clientHeight },
      body: { appendChild: (button) => buttons.push(button) },
      head: { appendChild: (style) => styles.push(style) },
      createElement(tag) {
        const listeners = new Map();
        const classes = new Set();
        const attrs = {};
        return {
          tagName: tag.toUpperCase(),
          id: '',
          className: '',
          type: '',
          textContent: '',
          style: {},
          classList: {
            add: (name) => classes.add(name),
            contains: (name) => classes.has(name),
          },
          setAttribute(name, value) { attrs[name] = String(value); },
          getAttribute: (name) => attrs[name] ?? null,
          addEventListener: (type, handler) => listeners.set(type, handler),
          fire: (type) => listeners.get(type)?.(),
          click: () => listeners.get('click')(),
        };
      },
      getElementById(id) {
        const style = styles.find((entry) => entry.id === id);
        if (style) return style;
        if (id !== 'mainFrame' || !mail) return null;
        return { contentDocument: { getElementById: (id) => id === 'qqmail_mailcontainer' ? mail : null } };
      },
      querySelectorAll: () => elements,
    },
    scrollTo: (x, y) => scrolls.push([x, y]),
  };
  sandbox.self = sandbox;
  sandbox.top = sandbox;
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'jump_bottom.user.js' });
  assert.equal(buttons.length, 2, '完整脚本须挂出顶/底两个按钮');
  return { buttons, scrolls, styles, sandbox };
}

for (const [direction, buttonIndex, targetY] of [['顶部', 0, 0], ['底部', 1, 2000]]) {
  test(`文档可滚：点击${direction}按钮直接滚动 window`, () => {
    const { buttons, scrolls } = loadScript({
      elements: [{
        scrollHeight: 1200, clientHeight: 400, scrollWidth: 500, innerHTML: '内容',
        scrollTo: () => assert.fail('文档可滚时不应再滚动兜底容器'),
      }],
    });

    buttons[buttonIndex].click();

    assert.deepEqual(scrolls, [[0, targetY]]);
  });
}

for (const [direction, buttonIndex, block] of [['顶部', 0, 'start'], ['底部', 1, 'end']]) {
  test(`QQ 邮件与外层文档均可滚：点击${direction}按钮只滚动邮件`, () => {
    const mailScrolls = [];
    const { buttons, scrolls } = loadScript({
      mail: { scrollIntoView: (options) => mailScrolls.push(options.block) },
    });

    buttons[buttonIndex].click();

    assert.deepEqual(mailScrolls, [block]);
    assert.deepEqual(scrolls, []);
  });
}

for (const [direction, buttonIndex, expected] of [
  ['顶部', 0, [[0, 0, 0], [1, 0, 0]]],
  ['底部', 1, [[0, 0, 1200], [1, 0, 900]]],
]) {
  test(`文档不可滚：点击${direction}按钮只滚动符合现有条件的容器`, () => {
    const containerScrolls = [];
    const metrics = [
      { scrollHeight: 1200, clientHeight: 400, scrollWidth: 500, innerHTML: '内容 A' },
      { scrollHeight: 900, clientHeight: 400, scrollWidth: 500, innerHTML: '内容 B' },
      { scrollHeight: 400, clientHeight: 400, scrollWidth: 500, innerHTML: '无溢出' },
      { scrollHeight: 300, clientHeight: 100, scrollWidth: 500, innerHTML: '高度未达阈值' },
      { scrollHeight: 1200, clientHeight: 400, scrollWidth: 300, innerHTML: '宽度未达阈值' },
      { scrollHeight: 1200, clientHeight: 400, scrollWidth: 500, innerHTML: '<html>嵌套页面</html>' },
    ];
    const elements = metrics.map((metric, index) => ({
      ...metric,
      scrollTo: (x, y) => containerScrolls.push([index, x, y]),
    }));
    const { buttons, scrolls } = loadScript({ documentHeight: 800, elements });

    buttons[buttonIndex].click();

    assert.deepEqual(containerScrolls, expected);
    assert.deepEqual(scrolls, []);
  });
}

test('文档与候选容器都不可滚时，点击两个按钮不抛错也不滚动', () => {
  const { buttons, scrolls } = loadScript({ documentHeight: 800 });

  buttons[0].click();
  buttons[1].click();

  assert.deepEqual(scrolls, []);
});

test('脚本不向页面全局泄漏内部函数（IIFE）', () => {
  const { sandbox } = loadScript();
  for (const name of ['createButton', 'getTarget', 'runScrollableElements']) {
    assert.equal(sandbox[name], undefined, `${name} 不应挂到全局`);
  }
});


test('按钮语义：原生 button，带方向 aria-label，键盘可聚焦', () => {
  const { buttons } = loadScript();

  for (const [index, label] of [[0, '回到顶部'], [1, '回到底部']]) {
    const button = buttons[index];
    assert.equal(button.tagName, 'BUTTON');
    assert.equal(button.type, 'button');
    assert.equal(button.getAttribute('aria-label'), label);
  }
});

test('样式收进单个 style 块：常态 0.55，hover/焦点/按下到 1，不用厂商前缀', () => {
  const { buttons, styles } = loadScript();

  assert.equal(styles.length, 1, '两个按钮共用一张样式表');
  const css = styles[0].textContent;
  assert.match(css, /opacity:\s*0\.55/);
  assert.match(css, /\.jb-11ze-btn:hover[^{]*\{[^}]*opacity:\s*1/);
  assert.match(css, /\.jb-11ze-btn:focus-visible[^{]*\{[^}]*outline:/);
  assert.match(css, /\.jb-11ze-btn:active[^{]*\{[^}]*opacity:\s*1/);
  assert.doesNotMatch(css, /-(?:moz|webkit)-/);
  assert.equal(Object.keys(buttons[0].style).length, 0, '不再逐按钮写内联样式');
});

test('两个按钮在 50% 处相接，不随视口高度留缝', () => {
  const { styles } = loadScript();
  const css = styles[0].textContent;

  assert.match(css, /\.jb-11ze-top[^{]*\{[^}]*bottom:\s*50%/);
  assert.match(css, /\.jb-11ze-bottom[^{]*\{[^}]*top:\s*50%/);
});

test('悬停不再由 JS 改透明度：鼠标进出后样式保持空', () => {
  const { buttons } = loadScript();

  buttons[0].fire('mouseover');
  assert.equal(buttons[0].style.opacity, undefined);
  buttons[0].fire('mouseout');
  assert.equal(buttons[0].style.opacity, undefined);
});
