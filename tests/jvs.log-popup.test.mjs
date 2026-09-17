'use strict';

/**
 * 日志弹窗测试
 *
 * buildLogTableHtml：表格 HTML 纯函数（表头模式条件列、行内模式/类型颜色、
 * 应用名 16 字截断、倒序输出、跳过保存类日志）；showLogPopup：document
 * 外点监听器必须注册/摘除成对——toggle 关闭（再点日志按钮）曾只删弹窗
 * 元素不摘监听器，每次泄漏一个，多活到下一次任意点击才自摘。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl } from './jvs-harness.mjs';

const POPUP_ID = '11ze-jvs-log-popup';

function makeLogEntry(overrides = {}) {
  return {
    time: new Date('2026-09-17T10:30:00').getTime(),
    tabType: '逻辑设计',
    appName: '示例应用',
    jvsAppId: 'app-1',
    designName: '订单流程',
    url: 'https://jvs.example.com/design?id=1',
    type: '自动保存',
    ...overrides,
  };
}

/** 记录型 document 桩：弹窗按 id 入册、click 监听器进出可数 */
function makeLogPopupEnv() {
  const popups = new Map();
  const clickHandlers = new Set();
  const body = {
    children: [],
    appendChild(node) {
      body.children.push(node);
      if (node.id) popups.set(node.id, node);
    },
  };
  const { hooks } = loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: (id) => popups.get(id) ?? null,
      createElement: () => {
        const el = makeFakeEl();
        el.remove = () => popups.delete(el.id);
        el.contains = () => false;
        el.closest = () => null;
        return el;
      },
      addEventListener(type, handler) {
        clickHandlers.add(handler);
      },
      removeEventListener(type, handler) {
        clickHandlers.delete(handler);
      },
      body,
    },
  });
  return { hooks, popups, clickHandlers };
}

test('日志弹窗：toggle 关闭时同步摘除 document 外点监听器', () => {
  const { hooks, popups, clickHandlers } = makeLogPopupEnv();

  hooks.showLogPopup();
  assert.ok(popups.has(POPUP_ID));
  assert.equal(clickHandlers.size, 1);

  hooks.showLogPopup();
  assert.ok(!popups.has(POPUP_ID));
  assert.equal(clickHandlers.size, 0);
});

test('日志弹窗：外点关闭删弹窗并自摘监听器', () => {
  const { hooks, popups, clickHandlers } = makeLogPopupEnv();

  hooks.showLogPopup();
  const handler = [...clickHandlers][0];
  handler({ target: { closest: () => null } });

  assert.ok(!popups.has(POPUP_ID));
  assert.equal(clickHandlers.size, 0);
});

test('buildLogTableHtml：无模式目录时不产出模式列', () => {
  const { hooks } = loadJvsHooks();
  const html = hooks.buildLogTableHtml([makeLogEntry()], {});

  assert.match(html, /<th> 时间/);
  assert.doesNotMatch(html, /模式/);
});

test('buildLogTableHtml：模式列取目录色值并去掉「模式」二字', () => {
  const { hooks } = loadJvsHooks();
  const html = hooks.buildLogTableHtml(
    [makeLogEntry({ jvsAppId: 'app-1' })],
    { 'app-1': '测试模式' },
  );

  assert.match(html, /<th> 模式/);
  assert.match(html, /color: green/);
  assert.match(html, /测试\s*&nbsp;/);
});

test('buildLogTableHtml：跳过保存类日志且倒序输出', () => {
  const { hooks } = loadJvsHooks();
  const html = hooks.buildLogTableHtml(
    [
      makeLogEntry({ designName: '第一条' }),
      makeLogEntry({ type: '保存', designName: '不该出现' }),
      makeLogEntry({ designName: '第三条' }),
    ],
    {},
  );

  assert.ok(!html.includes('不该出现'));
  assert.ok(html.indexOf('第三条') < html.indexOf('第一条'));
});

test('buildLogTableHtml：应用名超 16 字截断加省略号', () => {
  const { hooks } = loadJvsHooks();
  const longName = '一二三四五六七八九十一二三四五六七';
  const html = hooks.buildLogTableHtml([makeLogEntry({ appName: longName })], {});

  assert.ok(html.includes(longName.substring(0, 16) + '…'));
  assert.ok(!html.includes(longName + ' '));
});

test('buildLogTableHtml：未知 tabType 回退红色未知，名称列带 data-url', () => {
  const { hooks } = loadJvsHooks();
  const html = hooks.buildLogTableHtml(
    [makeLogEntry({ tabType: '不存在', url: 'https://jvs.example.com/x' })],
    {},
  );

  assert.match(html, /color: red/);
  assert.match(html, /未知/);
  assert.match(html, /data-url="https:\/\/jvs\.example\.com\/x"/);
});
