'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/jump_bottom.user.js', import.meta.url), 'utf8');

function loadScript({ documentHeight = 2000, clientHeight = 800, mail = null, elements = [] } = {}) {
  const buttons = [];
  const scrolls = [];
  const sandbox = {
    document: {
      documentElement: { scrollHeight: documentHeight, clientHeight },
      body: { appendChild: (button) => buttons.push(button) },
      createElement() {
        const listeners = new Map();
        return {
          style: {},
          addEventListener: (type, handler) => listeners.set(type, handler),
          click: () => listeners.get('click')(),
        };
      },
      getElementById(id) {
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
  return { buttons, scrolls };
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
