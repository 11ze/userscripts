'use strict';

/**
 * 存储域隐藏规则测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文，从 window.__JVS_TEST__ 条件钩子取出
 * IIFE 内部的存储相关函数。localStorage 用 Map 桩实现，可断言存储字节。
 * 见 plans/2026-08-14-candidate-5-storage-read-path.md。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

const STORAGE_KEYS = {
  LOGS: '__11ze_JVS_LOG_LOGS_',
  APP_NAME_MAP: '__11ze_JVS_APP_NAME_MAP__',
};

function loadScriptHooks() {
  const source = fs.readFileSync(sourcePath, 'utf8');

  const store = new Map();
  const sandbox = {
    console: {
      log() {},
      error() {},
      warn() {},
    },
    setInterval() {
      return 1;
    },
    clearInterval() {},
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    GM_addStyle() {},
    location: { href: 'https://jvs.example.com/#/wel/index' },
    addEventListener() {},
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener() {},
    },
    __JVS_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'jvs.user.js' });

  return { hooks: sandbox.__JVS_TEST__.hooks, store };
}

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
  const { hooks } = loadScriptHooks();
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
  const { hooks } = loadScriptHooks();
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
  const { hooks } = loadScriptHooks();
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
  const { hooks, store } = loadScriptHooks();

  hooks.saveAppIdName('app-1', '应用一');

  assert.deepEqual(readStoreJson(store, STORAGE_KEYS.APP_NAME_MAP), {
    'app-1': '应用一',
    应用一: 'app-1',
  });

  hooks.saveAppIdName('app-1', '改名后的应用');

  assert.equal(hooks.getAppIdName('app-1'), '应用一');
});

test('saveAppIdName 拒绝「复制」与空值', () => {
  const { hooks, store } = loadScriptHooks();

  hooks.saveAppIdName('app-1', '复制');
  hooks.saveAppIdName(null, '应用一');
  hooks.saveAppIdName('app-1', '');

  assert.equal(store.has(STORAGE_KEYS.APP_NAME_MAP), false);
});

test('getAppIdName 无映射时返回空串', () => {
  const { hooks } = loadScriptHooks();
  assert.equal(hooks.getAppIdName('unknown-app'), '');
});

test('enrichLogsWithAppName 用目录补全展示名，无映射条目保持原值', () => {
  const { hooks, store } = loadScriptHooks();

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
  const { hooks, store } = loadScriptHooks();

  hooks.saveAppIdName('app-1', '目录里的正式名');
  hooks.saveLog(createLogEntry({ jvsAppId: 'app-1', appName: '存储里的旧名' }), '打开');

  const stored = readStoreJson(store, STORAGE_KEYS.LOGS);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].appName, '存储里的旧名');
});

test('saveLog 连续保存后 getLogs 按保存顺序返回', () => {
  const { hooks } = loadScriptHooks();

  hooks.saveLog(createLogEntry({ id: 'design-1', designName: '第一条' }), '打开');
  hooks.saveLog(createLogEntry({ id: 'design-2', designName: '第二条' }), '打开');

  const logs = hooks.getLogs();
  assert.equal(
    logs.map((log) => log.designName).join(','),
    '第一条,第二条',
  );
  assert.equal(logs[0].appName, '应用一');
});
