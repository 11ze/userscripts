'use strict';

/**
 * 日志按钮模式前缀测试
 *
 * 通过 vm 桩环境执行 jvs.user.js 全文，从 window.__JVS_TEST__ 条件钩子取出
 * getLogButtonName。浏览器中该钩子永不激活。
 *
 * 背景：按钮换成仿应用内 plain 蓝（蓝字）后，模式前缀仍是纯黑内联 span
 * 加全角「｜」，黑字贴蓝字像两个元素硬拼。前缀用间距替代「｜」，与
 * 「日志」同字号同色——颜色由按钮按 data-mode 整体换色（色板断言见
 * jvs.styles 测试），任何时刻整钮只有一套色系。
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

test('日志按钮：模式前缀与「日志」同字号同色，间距替代「｜」，无模式只显示「日志」', () => {
  const hooks = loadScriptHooks();

  assert.equal(hooks.getLogButtonName(''), '日志');
  assert.equal(
    hooks.getLogButtonName('开发模式'),
    '<span style="margin-right: 6px">开发模式</span>日志'
  );
});
