'use strict';

/**
 * 设计器逻辑按钮集群特征测试（查看/名称展示/复制名三件套 + 列表查看按钮 + 节点耗时）
 *
 * _createOpenLogicButton 迁移 ensureInjected 后键与名称分离（target-key 可承载逻辑 id，
 * 展示/复制名跟随日志名），其余函数锁迁移前现状：键同跳过、键异移除重建、无名拆除不建。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl } from './jvs-harness.mjs';

const LOGS_KEY = '__11ze_JVS_LOG_LOGS_';

const FORM_LIST_SELECTOR =
  'div.table-body-box > div > div.el-table__body-wrapper.is-scrolling-none > table > tbody > tr > td:nth-child(2) > div > span > span > div';

/** 已注入元素桩：textContent 与属性键双身份（迁移前文本比较、迁移后属性键） */
function makeInjectedNode({ text = '', attrs = {} } = {}) {
  const node = {
    textContent: text,
    innerText: '',
    id: '',
    style: {},
    removed: false,
    remove() {
      node.removed = true;
    },
    getAttribute: (name) => attrs[name],
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    hasAttribute: (name) => name in attrs,
  };
  return node;
}

/** label 宿主桩：按 selector 分发已注入元素，appendChild 记录顺序 */
function makeLabelHost({ lookButton = null, displayButton = null, copyButton = null } = {}) {
  const appended = [];
  return {
    appended,
    innerText: '',
    nextElementSibling: null,
    querySelector(selector) {
      if (selector === '.ze-look-logic-button') return lookButton;
      if (selector === '.ze-logic-name-display') return displayButton;
      if (selector === '.ze-copy-logic-name-button') return copyButton;
      return null;
    },
    appendChild(node) {
      appended.push(node);
      return node;
    },
  };
}

function loadDesignerHooks(documentOverrides, logs = []) {
  const { hooks, store } = loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      createElement: () => makeFakeEl(),
      addEventListener() {},
      ...documentOverrides,
    },
  });
  if (logs.length) {
    store.set(LOGS_KEY, JSON.stringify(logs));
  }
  return hooks;
}

function emptyDocument() {
  return { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null };
}

// ==================== 逻辑名复制按钮 ====================

test('逻辑名复制按钮：无名 → 移除旧按钮不建新', () => {
  const copyButton = makeInjectedNode({ attrs: { 'target-logic-name': '订单逻辑' } });
  const label = makeLabelHost({ copyButton });
  loadDesignerHooks(emptyDocument())._createCopyNameButton(label, null);
  assert.equal(copyButton.removed, true);
  assert.equal(label.appended.length, 0);
});

test('逻辑名复制按钮：键同跳过', () => {
  const copyButton = makeInjectedNode({ attrs: { 'target-logic-name': '订单逻辑' } });
  const label = makeLabelHost({ copyButton });
  loadDesignerHooks(emptyDocument())._createCopyNameButton(label, '订单逻辑');
  assert.equal(copyButton.removed, false);
  assert.equal(label.appended.length, 0);
});

test('逻辑名复制按钮：键异 → 移除重建，新按钮带新名与 10px 间距', () => {
  const copyButton = makeInjectedNode({ attrs: { 'target-logic-name': '旧逻辑' } });
  const label = makeLabelHost({ copyButton });
  loadDesignerHooks(emptyDocument())._createCopyNameButton(label, '新逻辑');
  assert.equal(copyButton.removed, true);
  assert.equal(label.appended.length, 1);
  assert.equal(label.appended[0].getAttribute('target-logic-name'), '新逻辑');
  assert.equal(label.appended[0].style.marginLeft, '10px');
});

test('逻辑名复制按钮：无现有按钮 → 直接建', () => {
  const label = makeLabelHost();
  loadDesignerHooks(emptyDocument())._createCopyNameButton(label, '订单逻辑');
  assert.equal(label.appended.length, 1);
  assert.equal(label.appended[0].getAttribute('target-logic-name'), '订单逻辑');
});

// ==================== 逻辑名展示 ====================

test('逻辑名展示：无名 → 移除旧展示不建新', () => {
  const displayButton = makeInjectedNode({
    text: '订单逻辑',
    attrs: { 'logic-name-11ze': '订单逻辑' },
  });
  const label = makeLabelHost({ displayButton });
  loadDesignerHooks(emptyDocument())._createLogicNameDisplay(label, null);
  assert.equal(displayButton.removed, true);
  assert.equal(label.appended.length, 0);
});

test('逻辑名展示：名称相同 → 跳过', () => {
  const displayButton = makeInjectedNode({
    text: '订单逻辑',
    attrs: { 'logic-name-11ze': '订单逻辑' },
  });
  const label = makeLabelHost({ displayButton });
  loadDesignerHooks(emptyDocument())._createLogicNameDisplay(label, '订单逻辑');
  assert.equal(displayButton.removed, false);
  assert.equal(label.appended.length, 0);
});

test('逻辑名展示：名称变化 → 移除重建（textContent=新名）', () => {
  const displayButton = makeInjectedNode({
    text: '旧逻辑',
    attrs: { 'logic-name-11ze': '旧逻辑' },
  });
  const label = makeLabelHost({ displayButton });
  loadDesignerHooks(emptyDocument())._createLogicNameDisplay(label, '新逻辑');
  assert.equal(displayButton.removed, true);
  assert.equal(label.appended.length, 1);
  assert.equal(label.appended[0].textContent, '新逻辑');
});

// ==================== 查看逻辑按钮（键与名称分离） ====================

test('查看逻辑按钮：新建三件套——展示、按钮（target-key=键）、复制名，间距 10px', () => {
  const label = makeLabelHost();
  loadDesignerHooks(emptyDocument())._createOpenLogicButton(label, 'logic-key-1', '订单逻辑', () => {});
  assert.equal(label.appended.length, 3);
  assert.equal(label.appended[0].textContent, '订单逻辑');
  assert.equal(label.appended[1].getAttribute('target-key'), 'logic-key-1');
  assert.equal(label.appended[1].style.marginLeft, '10px');
  assert.equal(label.appended[2].getAttribute('target-logic-name'), '订单逻辑');
});

test('查看逻辑按钮：键同 → 按钮不重建，展示与复制名幂等同步', () => {
  const lookButton = makeInjectedNode({ attrs: { 'target-key': 'logic-key-1' } });
  const displayButton = makeInjectedNode({
    text: '订单逻辑',
    attrs: { 'logic-name-11ze': '订单逻辑' },
  });
  const copyButton = makeInjectedNode({ attrs: { 'target-logic-name': '订单逻辑' } });
  const label = makeLabelHost({ lookButton, displayButton, copyButton });
  loadDesignerHooks(emptyDocument())._createOpenLogicButton(label, 'logic-key-1', '订单逻辑', () => {});
  assert.equal(lookButton.removed, false);
  assert.equal(label.appended.length, 0);
});

test('查看逻辑按钮：键异 → 移除旧按钮重建三件套', () => {
  const lookButton = makeInjectedNode({ attrs: { 'target-key': 'old-key' } });
  const label = makeLabelHost({ lookButton });
  loadDesignerHooks(emptyDocument())._createOpenLogicButton(label, 'logic-key-1', '订单逻辑', () => {});
  assert.equal(lookButton.removed, true);
  assert.equal(label.appended.length, 3);
  assert.equal(label.appended[1].getAttribute('target-key'), 'logic-key-1');
});

// ==================== 逻辑引擎远程调用（消灭内联判重分叉） ====================

function makeLogicLabel({ title, lookButton = null, displayButton = null, copyButton = null }) {
  const label = makeLabelHost({ lookButton, displayButton, copyButton });
  label.innerText = '逻辑引擎远程调用';
  label.nextElementSibling = {
    querySelector: (selector) => (selector === '.el-input__inner' ? { title } : null),
  };
  return label;
}

function loadLogicDesignEnv(labels, logs = []) {
  return loadDesignerHooks(
    {
      querySelector: () => null,
      querySelectorAll: (selector) => (selector === '.el-form-item__label' ? labels : []),
      getElementById: () => null,
    },
    logs,
  );
}

function createLogicLog(id, designName) {
  return {
    id,
    designName,
    url: `https://jvs.example.com/#/ruleDesign?id=${id}`,
    time: Date.now(),
  };
}

test('远程调用查看按钮：日志命中 → 三件套，按钮键为逻辑 id、展示为日志名', () => {
  const label = makeLogicLabel({ title: 'logic-key-1' });
  loadLogicDesignEnv([label], [createLogicLog('logic-key-1', '订单逻辑')]).addButtonToOpenNewLogicDesign();
  assert.equal(label.appended.length, 3);
  assert.equal(label.appended[1].getAttribute('target-key'), 'logic-key-1');
  assert.equal(label.appended[0].textContent, '订单逻辑');
});

test('远程调用查看按钮：逻辑 id 空 → 拆除查看按钮与展示，不建新', () => {
  const lookButton = makeInjectedNode({ attrs: { 'target-key': 'logic-key-1' } });
  const displayButton = makeInjectedNode({
    text: '订单逻辑',
    attrs: { 'logic-name-11ze': '订单逻辑' },
  });
  const label = makeLogicLabel({ title: '', lookButton, displayButton });
  loadLogicDesignEnv([label]).addButtonToOpenNewLogicDesign();
  assert.equal(lookButton.removed, true);
  assert.equal(displayButton.removed, true);
  assert.equal(label.appended.length, 0);
});

test('远程调用查看按钮：键同 → 按钮不重建，展示幂等', () => {
  const lookButton = makeInjectedNode({ attrs: { 'target-key': 'logic-key-1' } });
  const displayButton = makeInjectedNode({
    text: '订单逻辑',
    attrs: { 'logic-name-11ze': '订单逻辑' },
  });
  const copyButton = makeInjectedNode({ attrs: { 'target-logic-name': '订单逻辑' } });
  const label = makeLogicLabel({ title: 'logic-key-1', lookButton, displayButton, copyButton });
  loadLogicDesignEnv([label], [createLogicLog('logic-key-1', '订单逻辑')]).addButtonToOpenNewLogicDesign();
  assert.equal(lookButton.removed, false);
  assert.equal(label.appended.length, 0);
});

test('远程调用查看按钮：键异 → 重建三件套', () => {
  const lookButton = makeInjectedNode({ attrs: { 'target-key': 'old-key' } });
  const label = makeLogicLabel({ title: 'logic-key-1', lookButton });
  loadLogicDesignEnv([label], [createLogicLog('logic-key-1', '订单逻辑')]).addButtonToOpenNewLogicDesign();
  assert.equal(lookButton.removed, true);
  assert.equal(label.appended.length, 3);
  assert.equal(label.appended[1].getAttribute('target-key'), 'logic-key-1');
});

// ==================== 列表/表单设计列表查看按钮 ====================

/** 列表行桩：innerText 即设计 id，上溯五级父代再查目标格 */
function makeFormListRow({ targetElement, marked = false }) {
  const element = makeInjectedNode({});
  element.innerText = 'design-9';
  if (marked) element.setAttribute('form-added-button-11ze', 'true');
  let current = element;
  for (let i = 0; i < 5; i++) {
    const next = i === 4 ? { querySelector: () => targetElement } : {};
    current.parentElement = next;
    current = next;
  }
  return element;
}

function loadFormListEnv({ elements, targetElement, logs = [] }) {
  return loadDesignerHooks(
    {
      querySelector(selector) {
        if (selector === '.design-header-box') return {};
        if (selector === '#tab-design > span') return { textContent: '表单设计' };
        return null;
      },
      querySelectorAll: (selector) => (selector === FORM_LIST_SELECTOR ? elements : []),
      getElementById: () => null,
    },
    logs,
  );
}

function makeTargetCell() {
  const appended = [];
  return {
    appended,
    querySelector: () => null,
    appendChild(node) {
      appended.push(node);
      return node;
    },
  };
}

test('列表查看按钮：日志命中 → 目标格插入查看按钮并标记行', () => {
  const targetCell = makeTargetCell();
  const element = makeFormListRow({ targetElement: targetCell });
  loadFormListEnv({
    elements: [element],
    targetElement: targetCell,
    logs: [{ id: 'design-9', designName: '订单列表', url: 'https://jvs.example.com/#/crud/design?id=design-9', time: Date.now() }],
  }).addButtonToOpenNewFormOrListDesign();
  assert.equal(targetCell.appended.length, 1);
  assert.equal(targetCell.appended[0].id, 'open-new-form-or-list-design-button-11ze');
  assert.equal(element.getAttribute('form-added-button-11ze'), 'true');
});

test('列表查看按钮：日志未命中 → 不插入不标记', () => {
  const targetCell = makeTargetCell();
  const element = makeFormListRow({ targetElement: targetCell });
  loadFormListEnv({
    elements: [element],
    targetElement: targetCell,
    logs: [{ id: 'other', designName: '其他', url: 'https://jvs.example.com/#/crud/design?id=other', time: Date.now() }],
  }).addButtonToOpenNewFormOrListDesign();
  assert.equal(targetCell.appended.length, 0);
  assert.equal(element.hasAttribute('form-added-button-11ze'), false);
});

test('列表查看按钮：目标格缺失 → 不标记（下轮重试）', () => {
  const element = makeFormListRow({ targetElement: null });
  loadFormListEnv({
    elements: [element],
    targetElement: null,
    logs: [{ id: 'design-9', designName: '订单列表', url: 'https://jvs.example.com/#/crud/design?id=design-9', time: Date.now() }],
  }).addButtonToOpenNewFormOrListDesign();
  assert.equal(element.hasAttribute('form-added-button-11ze'), false);
});

test('列表查看按钮：已标记 → 跳过不重复插', () => {
  const targetCell = makeTargetCell();
  const element = makeFormListRow({ targetElement: targetCell, marked: true });
  loadFormListEnv({
    elements: [element],
    targetElement: targetCell,
    logs: [{ id: 'design-9', designName: '订单列表', url: 'https://jvs.example.com/#/crud/design?id=design-9', time: Date.now() }],
  }).addButtonToOpenNewFormOrListDesign();
  assert.equal(targetCell.appended.length, 0);
});

// ==================== 节点执行耗时标注 ====================

function loadExecTimeEnv({ popoverText, timeDom = null }) {
  const appended = [];
  const timeDomId = 'popover-1-time-11ze';
  const parentNode = {
    appended,
    appendChild(span) {
      appended.push(span);
      return span;
    },
    querySelector(selector) {
      if (selector === '#' + timeDomId) return timeDom;
      return null;
    },
  };
  const node = {
    parentNode,
    getAttribute: (name) => (name === 'aria-describedby' ? 'popover-1' : null),
  };
  const byId = {
    'popover-1':
      popoverText === null
        ? null
        : {
            querySelector: (selector) =>
              selector === 'div > h4 > span > span' ? { textContent: popoverText } : null,
          },
    [timeDomId]: timeDom,
  };
  const hooks = loadDesignerHooks({
    querySelector: () => null,
    querySelectorAll: (selector) =>
      selector === '.el-icon-circle-check.el-node-state-success.el-popover__reference' ? [node] : [],
    getElementById: (id) => byId[id] ?? null,
  });
  return { hooks, appended };
}

test('节点耗时：无标注 → 插入耗时 span（红字）', () => {
  const { hooks, appended } = loadExecTimeEnv({ popoverText: '123ms' });
  hooks.showNodeExecTime();
  assert.equal(appended.length, 1);
  assert.equal(appended[0].textContent, '123ms');
  assert.equal(appended[0].style.color, 'red');
});

test('节点耗时：耗时文本未变 → 跳过', () => {
  const timeDom = makeInjectedNode({ text: '123ms', attrs: { 'exec-time-11ze': '123ms' } });
  const { hooks, appended } = loadExecTimeEnv({ popoverText: '123ms', timeDom });
  hooks.showNodeExecTime();
  assert.equal(timeDom.removed, false);
  assert.equal(appended.length, 0);
});

test('节点耗时：耗时文本变化 → 移除旧标注重建', () => {
  const timeDom = makeInjectedNode({ text: '99ms', attrs: { 'exec-time-11ze': '99ms' } });
  const { hooks, appended } = loadExecTimeEnv({ popoverText: '456ms', timeDom });
  hooks.showNodeExecTime();
  assert.equal(timeDom.removed, true);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].textContent, '456ms');
});

test('节点耗时：结果弹层消失 → 拆除标注不建新', () => {
  const timeDom = makeInjectedNode({ text: '123ms', attrs: { 'exec-time-11ze': '123ms' } });
  const { hooks, appended } = loadExecTimeEnv({ popoverText: null, timeDom });
  hooks.showNodeExecTime();
  assert.equal(timeDom.removed, true);
  assert.equal(appended.length, 0);
});
