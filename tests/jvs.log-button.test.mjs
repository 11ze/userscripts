'use strict';

/**
 * 日志按钮模式前缀测试
 *
 * 通过共享 harness 的 vm 桩环境执行 jvs.user.js 全文，从 window.__JVS_TEST__
 * 条件钩子取出 getLogButtonName。浏览器中该钩子永不激活。
 *
 * 背景：按钮换成仿应用内 plain 蓝（蓝字）后，模式前缀仍是纯黑内联 span
 * 加全角「｜」，黑字贴蓝字像两个元素硬拼。前缀用间距替代「｜」，与
 * 「日志」同字号同色——颜色由按钮按 data-mode 整体换色（色板断言见
 * jvs.styles 测试），任何时刻整钮只有一套色系。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl, makeContainer } from './jvs-harness.mjs';

test('日志按钮：模式前缀与「日志」同字号同色，间距替代「｜」，无模式只显示「日志」', () => {
  const { hooks } = loadJvsHooks();

  assert.equal(hooks.getLogButtonName(''), '日志');
  assert.equal(
    hooks.getLogButtonName('开发模式'),
    '<span style="margin-right: 6px">开发模式</span>日志'
  );
});

test('日志按钮 operation：无容器 probe 返回 missing，apply 全路径创建容器不炸', () => {
  const body = makeContainer();
  const { hooks } = loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      createElement: () => makeFakeEl(),
      addEventListener() {},
      body,
    },
  });

  const probeResult = hooks.updateLogButtonOperation.probe();
  assert.equal(probeResult?.key, 'missing');

  // apply 走 updateLogButton 全路径：历史锁 updateLogButtonOperation 与其内部
  // 局部变量曾遮蔽全局 currentMode() 触发 TDZ（真机每 tick 报错、单测盲区）
  hooks.updateLogButtonOperation.apply(probeResult.payload);
  assert.equal(body.children.length, 1);
});

test('updateLogButton 走 ensureInjected：容器 data-mode 为身份键，同键复用、键变重建', () => {
  const body = makeContainer();
  const { hooks } = loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      createElement: () => makeFakeEl(),
      addEventListener() {},
      body,
    },
  });

  hooks.updateLogButton('开发模式');
  assert.equal(body.children.length, 1);
  const first = body.children[0];
  assert.equal(first.getAttribute('data-mode'), '开发模式');

  hooks.updateLogButton('开发模式'); // 同键：复用既有容器
  assert.equal(body.children[0], first);

  hooks.updateLogButton(''); // 键变：旧容器摘除、原位重建
  assert.equal(body.children.length, 1);
  assert.notEqual(body.children[0], first);
  assert.equal(body.children[0].getAttribute('data-mode'), '');
});
