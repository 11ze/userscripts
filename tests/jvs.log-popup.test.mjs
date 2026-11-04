'use strict';

/**
 * 日志弹窗测试
 *
 * 从 showLogPopup 观察表格文字、行顺序与打开目标，不依赖 HTML 序列化。
 * 名称特殊字符的原生 DOM 解析回归另见 jvs.browser.html。document
 * 外点监听器必须注册/摘除成对——toggle 关闭（再点日志按钮）曾只删弹窗
 * 元素不摘监听器，每次泄漏一个，多活到下一次任意点击才自摘。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl } from './jvs-harness.mjs';

const POPUP_ID = '11ze-jvs-log-popup';

function makeLogEntry(overrides = {}) {
  const id = overrides.id ?? '1';
  return {
    time: new Date('2026-09-17T10:30:00').getTime(),
    tabType: '逻辑设计',
    appName: '示例应用',
    jvsAppId: 'app-1',
    designName: '订单流程',
    id,
    url: `https://jvs.example.com/design?id=${id}`,
    type: '打开',
    ...overrides,
  };
}

/** 记录型 document 桩：弹窗按 id 入册、click 监听器进出可数 */
function makeLogPopupEnv({ logs = [], appModeMap = {} } = {}) {
  const popups = new Map();
  const clickHandlers = new Set();
  const body = {
    children: [],
    appendChild(node) {
      body.children.push(node);
      node.parentElement = body;
      if (node.id) popups.set(node.id, node);
    },
  };
  const opened = [];
  const { hooks, store } = loadJvsHooks({
    open: (url, target) => opened.push({ url, target }),
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: (id) => popups.get(id) ?? null,
      createElement: (tag) => {
        const el = makeFakeEl();
        el.tagName = tag;
        const remove = el.remove.bind(el);
        el.remove = () => {
          popups.delete(el.id);
          remove();
        };
        el.contains = (target) => target === el || el.children.some((child) => child.contains(target));
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
  store.set('__11ze_JVS_LOG_LOGS_', JSON.stringify(logs));
  store.set('__11ze_JVS_APP_MODE_MAP__', JSON.stringify(appModeMap));
  return {
    hooks, popups, clickHandlers, opened,
    click(target) {
      for (const handler of [...clickHandlers]) handler({ target });
    },
  };
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

test('日志弹窗：点击表格内部保持打开，随后点外部才关闭并摘除监听器', () => {
  const { hooks, popups, clickHandlers, click } = makeLogPopupEnv();

  hooks.showLogPopup();
  const popup = popups.get(POPUP_ID);
  click(popup.children[0]);
  assert.equal(popups.get(POPUP_ID), popup);
  assert.equal(clickHandlers.size, 1);

  click({ closest: () => null });
  assert.ok(!popups.has(POPUP_ID));
  assert.equal(clickHandlers.size, 0);
});

function openTable(options) {
  const env = makeLogPopupEnv(options);
  env.hooks.showLogPopup();
  const table = env.popups.get(POPUP_ID).children[0];
  return { ...env, header: table.children[0].children[0].children, rows: table.children[1].children };
}

test('日志表格：无模式目录时不产出模式列', () => {
  const { header, rows } = openTable({ logs: [makeLogEntry()] });
  assert.deepEqual(header.map((cell) => cell.textContent.trim()), ['时间', '应用', '类型', '名称']);
  assert.equal(rows[0].children.length, 4);
});

test('日志表格：模式列取目录色值并去掉「模式」二字', () => {
  const { header, rows } = openTable({
    logs: [makeLogEntry()], appModeMap: { 'app-1': '测试模式' },
  });
  assert.equal(header[1].textContent.trim(), '模式');
  assert.equal(rows[0].children[1].textContent.trim(), '测试');
  assert.equal(rows[0].children[1].style.color, 'green');
});

test('日志表格：跳过保存类日志且倒序输出', () => {
  const { rows } = openTable({ logs: [
    makeLogEntry({ id: '1', designName: '第一条' }),
    makeLogEntry({ id: '2', type: '保存', designName: '不该出现' }),
    makeLogEntry({ id: '3', designName: '第三条' }),
  ] });
  assert.deepEqual(rows.map((row) => row.children.at(-1).textContent.trim()), ['第三条', '第一条']);
});

test('日志表格：应用名超 16 字截断加省略号', () => {
  const { rows } = openTable({ logs: [makeLogEntry({ appName: '一二三四五六七八九十一二三四五六七' })] });
  assert.equal(rows[0].children[1].textContent.trim(), '一二三四五六七八九十一二三四五六…');
});

test('日志表格：未知类型回退红色未知', () => {
  const { rows } = openTable({ logs: [makeLogEntry({ tabType: '不存在' })] });
  assert.equal(rows[0].children[2].textContent.trim(), '未知');
  assert.equal(rows[0].children[2].style.color, 'red');
});

test('日志表格：名称、应用和模式中的 HTML 字符按原文显示', () => {
  const { rows } = openTable({
    logs: [makeLogEntry({ designName: '订单<b>紧急</b> & "复核"', appName: '研发 <i>内</i>' })],
    appModeMap: { 'app-1': '测试模式 <b>&</b>' },
  });
  const cells = rows[0].children;
  assert.equal(cells[1].textContent.trim(), '测试 <b>&</b>');
  assert.equal(cells[2].textContent.trim(), '研发 <i>内</i>');
  assert.equal(cells[4].textContent.trim(), '订单<b>紧急</b> & "复核"');
  assert.equal(cells[4].children.length, 0);
});

test('日志表格：每行左键和中键都打开原始目标，右键不打开', () => {
  const targetUrl = 'https://jvs.example.com/design?id=1&name="quoted"#part';
  const { rows, opened } = openTable({ logs: [
    makeLogEntry({ id: '1', url: targetUrl }),
    makeLogEntry({ id: '2', url: 'https://jvs.example.com/design?id=2' }),
  ] });
  const first = rows[0].children.at(-1);
  const second = rows[1].children.at(-1);
  first.listeners.click();
  second.listeners.click();
  second.listeners.auxclick({ button: 1 });
  second.listeners.auxclick({ button: 2 });
  assert.deepEqual(opened, [
    { url: 'https://jvs.example.com/design?id=2', target: '_blank' },
    { url: targetUrl, target: '_blank' },
    { url: targetUrl, target: '_blank' },
  ]);
});
