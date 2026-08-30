'use strict';

/**
 * 存储域隐藏规则测试
 *
 * 通过共享 harness 的 vm 桩环境执行 jvs.user.js 全文，从 window.__JVS_TEST__ 条件钩子
 * 取出 IIFE 内部的存储相关函数。localStorage 用 Map 桩实现，可断言存储字节。
 * 见 plans/2026-08-14-candidate-5-storage-read-path.md。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks } from './jvs-harness.mjs';

const STORAGE_KEYS = {
  LOGS: '__11ze_JVS_LOG_LOGS_',
  APP_NAME_MAP: '__11ze_JVS_APP_NAME_MAP__',
};

function readStoreJson(store, key) {
  return JSON.parse(store.get(key));
}

function createLogEntry(overrides = {}) {
  // uniqueLogs 的去重键取自 url 查询参数里的 id，让 url 与 log.id 保持联动
  const id = overrides.id ?? 'design-1';
  return {
    tabType: '逻辑设计',
    url: `https://jvs.example.com/#/logic?id=${id}&jvsAppId=app-1`,
    time: Date.now(),
    designName: '订单查询逻辑',
    appName: '应用一',
    id,
    jvsAppId: 'app-1',
    type: '打开',
    ...overrides,
  };
}

test('脚本暴露存储域测试钩子', () => {
  const { hooks } = loadJvsHooks();
  for (const name of [
    'cutOverdueLogs',
    'uniqueLogs',
    'saveAppIdName',
    'getAppIdName',
    'saveLog',
    'getLogs',
  ]) {
    assert.equal(typeof hooks[name], 'function', `${name} 应暴露为函数`);
  }
});

test('cutOverdueLogs 剪掉过期与无 time 的日志，保留新近日志', () => {
  const { hooks } = loadJvsHooks();
  const now = Date.now();
  const logs = [
    createLogEntry({ id: 'expired', time: 0 }),
    createLogEntry({ id: 'no-time', time: undefined }),
    createLogEntry({ id: 'fresh', time: now }),
  ];

  const result = hooks.cutOverdueLogs(logs, now);

  // join 成字符串断言：vm 桩环境的数组原型与主 realm 不同，deepEqual 会误报
  assert.equal(
    result.map((log) => log.id).join(','),
    'fresh',
  );
});

test('uniqueLogs 按 id + type 去重，保留最新一条', () => {
  const { hooks } = loadJvsHooks();
  const now = Date.now();
  const logs = [
    createLogEntry({ id: 'same', time: now - 3000, designName: '旧记录' }),
    createLogEntry({ id: 'same', time: now, designName: '新记录' }),
    createLogEntry({ id: 'other', time: now }),
    createLogEntry({ id: 'same', time: now, type: '保存', designName: '同 id 不同类型' }),
  ];

  const result = hooks.uniqueLogs(logs);

  assert.equal(
    result.map((log) => log.designName).join(','),
    '新记录,订单查询逻辑,同 id 不同类型',
  );
});

test('saveAppIdName 双向写入且对已有 id 幂等', () => {
  const { hooks, store } = loadJvsHooks();

  hooks.saveAppIdName('app-1', '应用一');

  assert.deepEqual(readStoreJson(store, STORAGE_KEYS.APP_NAME_MAP), {
    'app-1': '应用一',
    应用一: 'app-1',
  });

  hooks.saveAppIdName('app-1', '改名后的应用');

  assert.equal(hooks.getAppIdName('app-1'), '应用一');
});

test('saveAppIdName 拒绝「复制」与空值', () => {
  const { hooks, store } = loadJvsHooks();

  hooks.saveAppIdName('app-1', '复制');
  hooks.saveAppIdName(null, '应用一');
  hooks.saveAppIdName('app-1', '');

  assert.equal(store.has(STORAGE_KEYS.APP_NAME_MAP), false);
});

test('getAppIdName 无映射时返回空串', () => {
  const { hooks } = loadJvsHooks();
  assert.equal(hooks.getAppIdName('unknown-app'), '');
});

test('enrichLogsWithAppName 用目录补全展示名，无映射条目保持原值', () => {
  const { hooks, store } = loadJvsHooks();

  hooks.saveAppIdName('app-1', '目录里的正式名');
  const logs = [
    createLogEntry({ jvsAppId: 'app-1', appName: '存储里的旧名' }),
    createLogEntry({ jvsAppId: 'app-2', appName: '应用二' }),
  ];

  const result = hooks.enrichLogsWithAppName(logs);

  assert.deepEqual(
    result.map((log) => log.appName),
    ['目录里的正式名', '应用二'],
  );
});

test('saveLog 不把目录补全回写进存储（读路径无写效果）', () => {
  const { hooks, store } = loadJvsHooks();

  hooks.saveAppIdName('app-1', '目录里的正式名');
  hooks.saveLog(createLogEntry({ jvsAppId: 'app-1', appName: '存储里的旧名' }), '打开');

  const stored = readStoreJson(store, STORAGE_KEYS.LOGS);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].appName, '存储里的旧名');
});

test('saveLog 连续保存后 getLogs 按保存顺序返回', () => {
  const { hooks } = loadJvsHooks();

  hooks.saveLog(createLogEntry({ id: 'design-1', designName: '第一条' }), '打开');
  hooks.saveLog(createLogEntry({ id: 'design-2', designName: '第二条' }), '打开');

  const logs = hooks.getLogs();
  assert.equal(
    logs.map((log) => log.designName).join(','),
    '第一条,第二条',
  );
  assert.equal(logs[0].appName, '应用一');
});

test('latestLogWhere 倒序遍历：首个 matcher 命中返回该条，无命中返回 null', () => {
  const { hooks } = loadJvsHooks();

  hooks.saveLog(createLogEntry({ id: 'design-1', designName: '第一条' }), '打开');
  hooks.saveLog(createLogEntry({ id: 'design-2', designName: '第二条' }), '打开');
  hooks.saveLog(createLogEntry({ id: 'design-3', designName: '第三条' }), '打开');

  const hit = hooks.latestLogWhere((log) => log.id !== 'design-3');
  assert.equal(hit.designName, '第二条', '倒序应先命中第三条之后的第二条');

  assert.equal(hooks.latestLogWhere(() => false), null);
});

test('getUrlFromLogs 同 id 多条时倒序命中最新一条（保存后于打开）', () => {
  const { hooks } = loadJvsHooks();

  // 去重键是 url 的 id 参数 + type：同 id 两种 type 都保留，构成倒序扫描的真实多候选场景
  hooks.saveLog(
    createLogEntry({ id: 'design-1', url: 'https://jvs.example.com/#/logic?id=design-1&v=1' }),
    '打开',
  );
  hooks.saveLog(
    createLogEntry({ id: 'design-1', url: 'https://jvs.example.com/#/logic?id=design-1&v=2' }),
    '保存',
  );

  assert.equal(hooks.getUrlFromLogs('design-1', false), 'https://jvs.example.com/#/logic?id=design-1&v=2');
});

test('getUrlFromLogs 未命中时 isFromUrl 兜底替换 location.href 的 id 参数', () => {
  const { hooks } = loadJvsHooks({
    location: { href: 'https://jvs.example.com/page-design-ui/#/form?id=old-id&x=1' },
  });

  assert.equal(
    hooks.getUrlFromLogs('new-id', true),
    'https://jvs.example.com/page-design-ui/#/form?id=new-id&x=1',
  );
  assert.equal(hooks.getUrlFromLogs('new-id', false), null, 'isFromUrl=false 未命中即 null');
  assert.equal(hooks.getUrlFromLogs('', true), null, 'id 空直接 null');
});

test('getUrlFromLogsAndUrl 命中 jvsAppId+designName 返回最新 url，跨应用同名不误中', () => {
  const { hooks } = loadJvsHooks();

  hooks.saveLog(
    createLogEntry({
      id: 'a1',
      jvsAppId: 'app-1',
      designName: '同名逻辑',
      url: 'https://jvs.example.com/#/logic?id=a1&v=old',
    }),
    '打开',
  );
  hooks.saveLog(
    createLogEntry({
      id: 'b1',
      jvsAppId: 'app-2',
      designName: '同名逻辑',
      url: 'https://jvs.example.com/#/logic?id=b1',
    }),
    '打开',
  );
  hooks.saveLog(
    createLogEntry({
      id: 'a1',
      jvsAppId: 'app-1',
      designName: '同名逻辑',
      url: 'https://jvs.example.com/#/logic?id=a1&v=new',
    }),
    '保存',
  );

  assert.equal(
    hooks.getUrlFromLogsAndUrl('同名逻辑', 'app-1'),
    'https://jvs.example.com/#/logic?id=a1&v=new',
  );
  assert.equal(hooks.getUrlFromLogsAndUrl('同名逻辑', 'app-2'), 'https://jvs.example.com/#/logic?id=b1');
  assert.equal(hooks.getUrlFromLogsAndUrl('不存在的逻辑', 'app-1'), null);
  assert.equal(hooks.getUrlFromLogsAndUrl('', 'app-1'), null, 'logicName 空直接 null');
});

test('findDesignNameById 按 id 反查逻辑名，未命中返回 null', () => {
  const { hooks } = loadJvsHooks();

  hooks.saveLog(createLogEntry({ id: 'design-1', designName: '订单查询逻辑' }), '打开');

  assert.equal(hooks.findDesignNameById('design-1'), '订单查询逻辑');
  assert.equal(hooks.findDesignNameById('unknown'), null);
});
