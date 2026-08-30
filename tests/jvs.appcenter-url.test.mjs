'use strict';

/**
 * syncAppCenterUrl 新版应用中心地址栏同步测试
 *
 * 通过共享 harness 的 vm 桩环境执行 jvs.user.js 全文，从 window.__JVS_TEST__ 条件
 * 钩子取出内部函数。核心锁定：只在新版应用中心容器（.app-page）显示且 hash 非首页
 * 路由时替换；replaceState 不触发路由响应属浏览器语义，桩只记录调用、不验证。
 * 函数只认 .app-page，旧版容器与离开应用中心走同一条不替换路径。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks } from './jvs-harness.mjs';

/** hasAppPage：新版应用中心容器是否在（旧版容器或已离开时为 false——函数只认 .app-page） */
function loadScriptHooks(hash, hasAppPage = true) {
  const replaceStateCalls = [];
  const { hooks } = loadJvsHooks({
    location: { href: 'https://jvs.example.com/' + hash, hash },
    history: {
      replaceState(...args) {
        replaceStateCalls.push(args);
      },
    },
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: (selector) => (selector === '.app-page' && hasAppPage ? {} : null),
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener() {},
    },
  });
  return { hooks, replaceStateCalls };
}

test('脚本暴露 syncAppCenterUrl 测试钩子', () => {
  const { hooks } = loadScriptHooks('#/wel/index');
  assert.equal(typeof hooks.syncAppCenterUrl, 'function');
});

test('新版应用中心 + hash 停留在进站前路由：地址栏替换成 #/wel/index', () => {
  const { hooks, replaceStateCalls } = loadScriptHooks('#/logic/design?id=1');

  hooks.syncAppCenterUrl();

  assert.equal(replaceStateCalls.length, 1);
  assert.deepEqual(replaceStateCalls[0], [null, '', '#/wel/index']);
});

test('hash 已是 #/wel/index：不重复替换', () => {
  const { hooks, replaceStateCalls } = loadScriptHooks('#/wel/index');

  hooks.syncAppCenterUrl();

  assert.equal(replaceStateCalls.length, 0);
});

test('.app-page 不存在（旧版容器或已离开应用中心）：不动其他路由的地址栏', () => {
  const { hooks, replaceStateCalls } = loadScriptHooks('#/logic/design?id=1', false);

  hooks.syncAppCenterUrl();

  assert.equal(replaceStateCalls.length, 0);
});
