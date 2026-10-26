'use strict';

/**
 * 装配层测试：真实 operations 队列与三处零覆盖入口
 *
 * 钩子此前只暴露零件工厂（createOperationRunner / 单 op），装配体本身
 * 不在任何 seam 上——22 项真实队列从未在测试里 tick 过。TDZ 前科
 * （v0.8.6 真机崩过、单测盲区）证明组装层是历史上真炸过的层。
 * 这里锁三件事：
 * 1. 全队列对桩 DOM 连续 tick 零报错（登记漏项、桩能力缺口都变红灯）
 * 2. saveCurrentLogOperation 的 probe/apply 配对（唯一无配对测试的 keyed op）
 * 3. 嵌套逻辑回退梯子三分支 + changeTitle 的每 tick 采集契约（原只活在注释里）
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl, makeContainer, makeStorageStub } from './jvs-harness.mjs';

const LOGS_KEY = '__11ze_JVS_LOG_LOGS_';
const APP_MODE_MAP_KEY = '__11ze_JVS_APP_MODE_MAP__';

/** 按 selector 精确分发的最小 document 桩 */
function makeDocStub({ bySelector = {}, bySelectorAll = {}, body = null } = {}) {
  return {
    getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
    querySelector: (selector) => bySelector[selector] ?? null,
    querySelectorAll: (selector) => bySelectorAll[selector] ?? [],
    getElementById: () => null,
    createElement: () => makeFakeEl(),
    addEventListener() {},
    title: '',
    body,
  };
}

function makeClickRecorder() {
  const el = makeFakeEl();
  el.clickCount = 0;
  el.click = () => {
    el.clickCount++;
  };
  return el;
}

/** 嵌套逻辑梯子的 label 桩：innerText 命中、按 selector 交出已注入元素 */
function makeNestedLogicLabel() {
  const appended = [];
  return {
    appended,
    innerText: '选择逻辑引擎：订单逻辑',
    querySelector() {
      return null;
    },
    appendChild(node) {
      appended.push(node);
      return node;
    },
  };
}

const SELECTED_LOGIC_SPAN =
  '.el-scrollbar__view.el-select-dropdown__list > .el-select-dropdown__item.selected > span';

// ==================== C1：装配体 seam ====================

test('装配体冒烟：真实 operations 队列连续 3 tick，桩 DOM 上零报错', () => {
  const doc = makeDocStub({ body: makeContainer() });
  const { hooks } = loadJvsHooks({
    document: doc,
    location: { href: 'https://jvs.example.com/#/wel/index', hash: '' },
  });

  assert.ok(Array.isArray(hooks.operations), 'operations 须进测试钩子');
  assert.ok(hooks.operations.length > 0);

  const errors = [];
  const tick = hooks.createOperationRunner(hooks.operations, (name, error) => {
    errors.push({ name, message: error.message });
  });
  tick();
  tick();
  tick();

  assert.deepEqual(errors, []);
});

test('saveCurrentLog operation：probe 采组合键与完整 payload，apply 直存「打开」日志', () => {
  const bySelectorAll = {};
  for (const selector of [
    '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div.el-scrollbar__wrap > div > div.app-item-info.app-item-info-hide > div > span',
    '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div > div.app-item-info > div > span',
  ]) {
    bySelectorAll[selector] = [];
  }
  bySelectorAll['#app > div > div > div.design-header-box > div.header-left'] = [
    { textContent: '订单应用' },
  ];

  const { hooks, store } = loadJvsHooks({
    document: makeDocStub({
      bySelector: {
        '.design-header-box': makeFakeEl(),
        '#tab-design > span': { textContent: '逻辑设计' },
        '#app > div > div > div.design-header-box > div.header-left > span:nth-child(3)':
          { textContent: '订单逻辑' },
      },
      bySelectorAll,
    }),
    location: {
      href: 'https://jvs.example.com/#/ruleDesign?id=d1&jvsAppId=j1',
      hash: '#/ruleDesign?id=d1&jvsAppId=j1',
    },
  });

  const probeResult = hooks.saveCurrentLogOperation.probe();
  assert.ok(probeResult, '五要素齐全时 probe 须返回条目');
  assert.equal(probeResult.payload.designName, '订单逻辑');
  assert.equal(probeResult.payload.appName, '订单应用');

  hooks.saveCurrentLogOperation.apply(probeResult.payload);

  const logs = JSON.parse(store.get(LOGS_KEY));
  assert.equal(logs.length, 1);
  assert.equal(logs[0].type, '打开');
  assert.equal(logs[0].designName, '订单逻辑');
  assert.equal(logs[0].appName, '订单应用');
});

function makeLogRecordingEnv() {
  const { localStorage } = makeStorageStub();
  const logWrites = [];
  const location = {
    href: 'https://jvs.example.com/#/ruleDesign?id=d1&jvsAppId=j1',
  };
  const designName = { textContent: '订单逻辑' };
  const appName = { textContent: '订单应用' };
  const tabType = { textContent: '逻辑设计' };
  const { hooks } = loadJvsHooks({
    location,
    localStorage: {
      ...localStorage,
      setItem(key, value) {
        localStorage.setItem(key, value);
        if (key === LOGS_KEY) logWrites.push(JSON.parse(value));
      },
    },
    document: makeDocStub({
      bySelector: {
        '.design-header-box': makeFakeEl(),
        '#tab-design > span': tabType,
        '#app > div > div > div.design-header-box > div.header-left > span:nth-child(3)':
          designName,
      },
      bySelectorAll: {
        '#app > div > div > div.design-header-box > div.header-left': [appName],
      },
    }),
  });
  const errors = [];
  const tick = hooks.createOperationRunner([hooks.saveCurrentLogOperation], (name, error) => {
    errors.push({ name, message: error.message });
  });
  return { hooks, tick, errors, location, designName, appName, tabType, logWrites };
}

test('打开日志：同应用内切换同名但不同 id 的设计，两条都可查', () => {
  const { hooks, tick, errors, location } = makeLogRecordingEnv();

  tick();
  location.href = 'https://jvs.example.com/#/ruleDesign?id=d2&jvsAppId=j1';
  tick();

  const logs = hooks.getLogs();
  assert.deepEqual(Array.from(logs, (log) => log.id), ['d1', 'd2']);
  assert.deepEqual(Array.from(logs, (log) => log.type), ['打开', '打开']);
  assert.deepEqual(errors, []);
});

test('打开日志：跨同名应用切换，同名同 id 的设计仍记录当前应用', () => {
  const { hooks, tick, errors, location } = makeLogRecordingEnv();

  tick();
  location.href = 'https://jvs.example.com/#/ruleDesign?id=d1&jvsAppId=j2';
  tick();

  assert.equal(hooks.getLogs().at(-1).jvsAppId, 'j2');
  assert.deepEqual(errors, []);
});

test('打开日志：名称与 id 未变，切换设计类型仍记录当前类型', () => {
  const { hooks, tick, errors, tabType } = makeLogRecordingEnv();

  tick();
  tabType.textContent = '表单设计';
  tick();

  assert.equal(hooks.getLogs().at(-1).tabType, '表单设计');
  assert.deepEqual(errors, []);
});

test('打开日志：同页面连续 tick 不重复记录，改名仍记录，信息未就绪时等待', () => {
  const { hooks, tick, errors, designName, appName, tabType, logWrites } = makeLogRecordingEnv();

  tabType.textContent = '';
  tick();
  assert.equal(hooks.getLogs().length, 0);
  assert.equal(logWrites.length, 0);

  tabType.textContent = '逻辑设计';
  tick();
  tick();
  tick();
  assert.equal(hooks.getLogs().length, 1);
  assert.equal(logWrites.length, 1, '历史去重可能掩盖重复写入，另核对存储写入次数');

  designName.textContent = '订单查询';
  tick();
  assert.equal(hooks.getLogs().at(-1).designName, '订单查询');
  assert.equal(logWrites.length, 2);

  appName.textContent = '订单管理';
  tick();
  assert.equal(hooks.getLogs().at(-1).appName, '订单管理');
  assert.equal(logWrites.length, 3);
  assert.deepEqual(errors, []);
});

// ==================== C2：嵌套逻辑回退梯子 ====================

test('梯子·日志命中：反查到链接直接挂查看钮，不碰逻辑列表', () => {
  const label = makeNestedLogicLabel();
  const ruleListIcon = makeClickRecorder();
  const { hooks, store } = loadJvsHooks({
    document: makeDocStub({
      bySelector: { '.rule-list-icon': ruleListIcon },
      bySelectorAll: {
        '.el-form-item__label': [label],
        [SELECTED_LOGIC_SPAN]: [{ innerText: '订单逻辑' }],
        '.other-rule-list > .list-box > .list-item': [],
      },
    }),
    location: {
      href: 'https://jvs.example.com/#/ruleDesign?id=d1&jvsAppId=j1',
      hash: '#/ruleDesign?id=d1&jvsAppId=j1',
    },
  });
  store.set(
    LOGS_KEY,
    JSON.stringify([
      {
        id: 'd1',
        jvsAppId: 'j1',
        designName: '订单逻辑',
        url: 'https://jvs.example.com/#/ruleDesign?id=d1',
        time: Date.now(),
      },
    ])
  );

  hooks.addButtonToOpenNewLogicDesignForNestedLogic();

  assert.equal(ruleListIcon.clickCount, 0, '日志命中不该点开逻辑列表');
  const lookButton = label.appended.find(
    (node) => node.getAttribute?.('target-key') === '订单逻辑'
  );
  assert.ok(lookButton, '应挂 target-key 为逻辑名的查看钮');
});

test('梯子·日志未命中走列表：首访双击展开，按钮点「设计」不点「引用」', () => {
  const label = makeNestedLogicLabel();
  const ruleListIcon = makeClickRecorder();
  const designTooltip = makeClickRecorder();
  const refTooltip = makeClickRecorder();
  const listItem = {
    textContent: '订单逻辑',
    querySelector(selector) {
      return selector === '.list-item-tool'
        ? { querySelectorAll: () => [designTooltip, refTooltip] }
        : null;
    },
  };

  const { hooks } = loadJvsHooks({
    document: makeDocStub({
      bySelector: { '.rule-list-icon': ruleListIcon },
      bySelectorAll: {
        '.el-form-item__label': [label],
        [SELECTED_LOGIC_SPAN]: [{ innerText: '订单逻辑' }],
        '.other-rule-list > .list-box > .list-item': [listItem],
      },
    }),
    location: {
      href: 'https://jvs.example.com/#/ruleDesign?id=d1&jvsAppId=j1',
      hash: '#/ruleDesign?id=d1&jvsAppId=j1',
    },
  });

  hooks.addButtonToOpenNewLogicDesignForNestedLogic();

  // 列表未就绪，首访双击展开后标记——第二访不再双击
  assert.equal(ruleListIcon.clickCount, 2);
  hooks.addButtonToOpenNewLogicDesignForNestedLogic();
  assert.equal(ruleListIcon.clickCount, 2, '已标记后不重复双击');

  const lookButton = label.appended.find(
    (node) => node.getAttribute?.('target-key') === '订单逻辑'
  );
  assert.ok(lookButton);
  lookButton.click();

  // 「点设计不点引用」是不可逆保护：引用会覆盖当前逻辑设计且自动保存
  assert.equal(designTooltip.clickCount, 1);
  assert.equal(refTooltip.clickCount, 0);
});

test('梯子·列表未命中：无 rule-list-icon 直接返回，不挂钮不抛错', () => {
  const label = makeNestedLogicLabel();
  const { hooks } = loadJvsHooks({
    document: makeDocStub({
      bySelectorAll: {
        '.el-form-item__label': [label],
        [SELECTED_LOGIC_SPAN]: [{ innerText: '订单逻辑' }],
      },
    }),
    location: {
      href: 'https://jvs.example.com/#/ruleDesign?id=d1&jvsAppId=j1',
      hash: '#/ruleDesign?id=d1&jvsAppId=j1',
    },
  });

  hooks.addButtonToOpenNewLogicDesignForNestedLogic();

  assert.equal(
    label.appended.filter((node) => node.getAttribute?.('target-key')).length,
    0,
    '列表打不开时不该挂查看钮'
  );
});

// ==================== C5：changeTitle 每 tick 采集契约 ====================

test('changeTitle：title 未变时模式采集仍每 tick 跑（写副作用契约，曾只活在注释里）', () => {
  const modeLi = { innerText: '开发模式' };
  const doc = makeDocStub({
    bySelector: { '.system-list': { querySelectorAll: () => [modeLi] } },
  });
  const { hooks, store } = loadJvsHooks({
    document: doc,
    location: {
      href: 'https://jvs.example.com/#/wel/index?jvsAppId=j1',
      hash: '#/wel/index?jvsAppId=j1',
    },
  });

  hooks.changeTitle();
  assert.equal(doc.title, '开发模式｜未打开应用');
  assert.equal(JSON.parse(store.get(APP_MODE_MAP_KEY)).j1, '开发模式');

  // title 已应用过（本轮走提前 return 路径），目录被清后仍须重采集落库——
  // 若把提前 return 提到采集之前，这里读不到新目录
  store.delete(APP_MODE_MAP_KEY);
  hooks.changeTitle();
  assert.equal(JSON.parse(store.get(APP_MODE_MAP_KEY)).j1, '开发模式');
});
