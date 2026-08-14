'use strict';

/**
 * createOperationRunner 契约测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文（isJVS 走 JVS 分支完成初始化），
 * 从 window.__JVS_TEST__ 条件钩子取出 IIFE 内部的 createOperationRunner。
 * 浏览器中该钩子永不激活，见 plans/2026-08-14-candidate-2-poll-runner.md 决策 Q5。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/jvs.user.js');

function loadScriptHooks() {
  const source = fs.readFileSync(sourcePath, 'utf8');

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
      getItem: () => null,
      setItem() {},
      removeItem() {},
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

  return sandbox.__JVS_TEST__.hooks;
}

function createTestRunner(operations) {
  const hooks = loadScriptHooks();
  const errors = [];
  const tick = hooks.createOperationRunner(operations, (name, error) => {
    errors.push({ name, error });
  });
  return { tick, errors };
}

test('脚本在桩环境完成初始化并暴露 createOperationRunner', () => {
  const hooks = loadScriptHooks();
  assert.equal(typeof hooks.createOperationRunner, 'function');
});

test('普通函数 operation 每 tick 执行', () => {
  const calls = [];
  const { tick, errors } = createTestRunner([
    function plainOperation() {
      calls.push('plain');
    },
  ]);

  tick();
  tick();

  assert.deepEqual(calls, ['plain', 'plain']);
  assert.deepEqual(errors, []);
});

test('probe 返回 null 时 apply 不执行', () => {
  const calls = [];
  const { tick } = createTestRunner([
    { name: 'watched', probe: () => null, apply: () => calls.push('apply') },
  ]);

  tick();
  tick();

  assert.deepEqual(calls, []);
});

test('probe 键不变时 apply 只执行一次，键变化后重新执行', () => {
  let probeKey = 'k1';
  const calls = [];
  const { tick } = createTestRunner([
    { name: 'watched', probe: () => probeKey, apply: () => calls.push(probeKey) },
  ]);

  tick();
  tick();
  probeKey = 'k2';
  tick();
  tick();

  assert.deepEqual(calls, ['k1', 'k2']);
});

test('probe 返回 null 不覆盖上次记录的键', () => {
  let probeKey = 'k1';
  const calls = [];
  const { tick } = createTestRunner([
    { name: 'watched', probe: () => probeKey, apply: () => calls.push(probeKey) },
  ]);

  tick();
  probeKey = null;
  tick();
  probeKey = 'k1';
  tick();

  assert.deepEqual(calls, ['k1']);
});

test('apply 抛错不中断后续 operation，onError 收到 name 和 error', () => {
  const calls = [];
  const boom = new Error('boom');
  const { tick, errors } = createTestRunner([
    { name: 'badApply', probe: () => 'k', apply: () => { throw boom; } },
    function goodOperation() {
      calls.push('good');
    },
  ]);

  tick();

  assert.deepEqual(calls, ['good']);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].name, 'badApply');
  assert.equal(errors[0].error, boom);
});

test('probe 抛错同样被隔离，apply 不执行', () => {
  const calls = [];
  const probeBoom = new Error('probe boom');
  const { tick, errors } = createTestRunner([
    { name: 'badProbe', probe: () => { throw probeBoom; }, apply: () => calls.push('apply') },
    function goodOperation() {
      calls.push('good');
    },
  ]);

  tick();

  assert.deepEqual(calls, ['good']);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].name, 'badProbe');
  assert.equal(errors[0].error, probeBoom);
});

test('普通函数抛错时 onError 收到函数名', () => {
  const { tick, errors } = createTestRunner([
    function brokenOperation() {
      throw new Error('fn boom');
    },
  ]);

  tick();

  assert.equal(errors.length, 1);
  assert.equal(errors[0].name, 'brokenOperation');
  assert.equal(errors[0].error.message, 'fn boom');
});
