'use strict';

/**
 * setCanvasScroll 画布滚轮平移测试
 *
 * 通过共享 harness 的 vm 桩环境执行 jvs.user.js 全文：Map 桩 localStorage、
 * 最小 DOM 桩（.butterfly-vue-container + 其 .butterfly-vue 宿主 + __vue__.canvas 桩），
 * 从 window.__JVS_TEST__ 条件钩子取出内部函数。核心锁定「wheel 全走
 * canvas.move API」：坐标计算在 Butterfly 内闭环，小地图由站点原生联动；
 * 主/循环画布切换容器重建后由轮询调度自动重挂。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks } from './jvs-harness.mjs';

/** Butterfly canvas 桩：getOffset 现读、move 记录调用并更新 offset */
function makeCanvas() {
  return {
    offset: [0, 0],
    calls: [],
    getOffset() {
      return [...this.offset];
    },
    move(next) {
      this.calls.push([...next]);
      this.offset = [...next];
    },
  };
}

/** 通用元素桩：attribute/listener 最小闭环 */
function fakeEl(className = '') {
  const attrs = {};
  const listeners = {};
  return {
    className,
    style: {},
    parentElement: null,
    setAttribute(key, value) {
      attrs[key] = String(value);
    },
    getAttribute: (key) => (key in attrs ? attrs[key] : null),
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    listeners,
    attrs,
  };
}

/** wheel 事件桩：preventDefault 记录是否被调 */
function wheelEvent({ deltaX = 0, deltaY = 0, shiftKey = false } = {}) {
  const event = { deltaX, deltaY, shiftKey, defaultPrevented: false };
  event.preventDefault = () => {
    event.defaultPrevented = true;
  };
  return event;
}

/** 画布环境：container（.butterfly-vue-container）挂在带 __vue__.canvas 的宿主下 */
function makeCanvasStage() {
  const stage = { container: null, canvas: makeCanvas(), activeTool: '主画布' };
  stage.rebuild = () => {
    const host = fakeEl('butterfly-vue');
    const container = fakeEl('butterfly-vue-container');
    container.parentElement = host;
    host.__vue__ = { canvas: stage.canvas };
    stage.container = container;
  };
  stage.rebuild();
  return stage;
}

function loadScriptHooks() {
  const stage = makeCanvasStage();
  const body = fakeEl();
  let inCanvas = true;

  const { hooks } = loadJvsHooks({
    location: { href: 'https://jvs.example.com/#/ruleDesign?id=1' },
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: (selector) => {
        if (selector === '.butterfly-vue-container') return inCanvas ? stage.container : null;
        if (selector === '.canvas-tool-item.active') {
          return inCanvas ? { textContent: stage.activeTool } : null;
        }
        return null;
      },
      querySelectorAll: () => [],
      createElement: () => fakeEl(),
      getElementById: () => null,
      addEventListener() {},
      body,
    },
  });
  return {
    hooks,
    stage,
    runner: () => hooks.createOperationRunner([hooks.canvasScrollOperation], () => {}),
    /** 模拟画布重建：宿主与容器整体重建（canvas 实例也换新）；带 activeTool 时同时切换画布身份 */
    rebuildCanvas(activeTool) {
      stage.canvas = makeCanvas();
      if (activeTool !== undefined) stage.activeTool = activeTool;
      stage.rebuild();
    },
    leaveCanvas() {
      inCanvas = false;
    },
  };
}

/** 触发当前 container 上已挂的全部 wheel 监听 */
function fireWheel(stage, event) {
  for (const handler of stage.container.listeners.wheel || []) {
    handler(event);
  }
  return event;
}

test('脚本暴露 setCanvasScroll 与 canvasScrollOperation 测试钩子', () => {
  const { hooks } = loadScriptHooks();
  assert.equal(typeof hooks.setCanvasScroll, 'function');
  assert.equal(typeof hooks.canvasScrollOperation.probe, 'function');
  assert.equal(typeof hooks.canvasScrollOperation.apply, 'function');
});

test('apply：挂 wheel 监听并打闩锁；重复调用幂等不重复挂', () => {
  const { hooks, stage } = loadScriptHooks();

  hooks.setCanvasScroll();
  assert.equal(stage.container.listeners.wheel.length, 1, 'wheel 监听应挂上');
  assert.equal(stage.container.getAttribute('data-11ze-canvas-scroll'), 'true', '闩锁应打上');

  hooks.setCanvasScroll();
  assert.equal(stage.container.listeners.wheel.length, 1, '闩锁已打时重复调用不应再挂');
});

test('wheel deltaY：offset 减 delta，preventDefault 被调', () => {
  const { hooks, stage } = loadScriptHooks();
  hooks.setCanvasScroll();

  const event = fireWheel(stage, wheelEvent({ deltaY: 100 }));
  assert.equal(stage.canvas.calls.length, 1);
  assert.deepEqual(stage.canvas.calls[0], [0, -100], 'deltaY=100 应 move([0,-100])');
  assert.equal(event.defaultPrevented, true, '应 preventDefault 压掉原生行为');
});

test('wheel 连续滚动：offset 现读累计', () => {
  const { hooks, stage } = loadScriptHooks();
  hooks.setCanvasScroll();

  fireWheel(stage, wheelEvent({ deltaY: 100 }));
  fireWheel(stage, wheelEvent({ deltaY: 60 }));
  assert.deepEqual(stage.canvas.calls[1], [0, -160], '第二次应从 [0,-100] 继续减');
});

test('wheel deltaX：横移且纵移归零', () => {
  const { hooks, stage } = loadScriptHooks();
  hooks.setCanvasScroll();

  fireWheel(stage, wheelEvent({ deltaX: 40, deltaY: 30 }));
  assert.deepEqual(stage.canvas.calls[0], [-40, 0], '有 deltaX 时只横移');
});

test('wheel shift+deltaY：竖直 delta 转横移', () => {
  const { hooks, stage } = loadScriptHooks();
  hooks.setCanvasScroll();

  fireWheel(stage, wheelEvent({ deltaY: 50, shiftKey: true }));
  assert.deepEqual(stage.canvas.calls[0], [-50, 0], 'shift 时 deltaY 应作 deltaX 用');
});

test('probe 状态机：无容器 null / 有 canvas mount / 挂后 mounted / 重建回 mount', () => {
  const ctx = loadScriptHooks();
  const { hooks, stage } = ctx;
  const { probe } = hooks.canvasScrollOperation;

  assert.match(probe(), /^mount@/, '容器与 canvas 就绪时应返回带实例序号的 mount');

  hooks.setCanvasScroll();
  assert.equal(probe(), 'mounted', '闩锁已打时应返回 mounted');

  ctx.rebuildCanvas();
  assert.match(probe(), /^mount@/, '容器重建（循环画布切换）后应回到带实例序号的 mount');
  assert.equal(stage.container.getAttribute('data-11ze-canvas-scroll'), null, '新容器应无闩锁');

  ctx.leaveCanvas();
  assert.equal(probe(), null, '容器缺失时应返回 null');
});

test('调度契约：连续 tick 只挂一次；容器重建后自动重挂', () => {
  const ctx = loadScriptHooks();
  const { stage } = ctx;
  const runner = ctx.runner();

  runner();
  runner();
  runner();
  assert.equal(stage.container.listeners.wheel.length, 1, '键稳定后不应重复挂监听');

  ctx.rebuildCanvas();
  runner();
  runner();
  assert.equal(stage.container.listeners.wheel.length, 1, '容器重建后应重新挂上监听');
});

test('画布重建恢复：平移后实例重建，probe 返回 restore，apply 恢复销毁前平移', () => {
  const ctx = loadScriptHooks();
  const { hooks, stage } = ctx;
  const { probe } = hooks.canvasScrollOperation;

  hooks.setCanvasScroll();
  fireWheel(stage, wheelEvent({ deltaY: 100 }));
  probe(); // 轮询 tick：同一实例，随手记录最新平移 [0,-100]

  ctx.rebuildCanvas();
  assert.deepEqual(stage.canvas.offset, [0, 0], '重建后的新画布平移归零（bug 现场）');

  assert.match(probe(), /^restore@/, '非零平移随重建丢失时应返回带实例序号的 restore');
  hooks.setCanvasScroll(); // 调度器的 apply
  assert.deepEqual(stage.canvas.calls[0], [0, -100], '重建后应把销毁前平移带回来');
  assert.equal(stage.container.listeners.wheel.length, 1, '监听也应重挂');
});

test('画布重建恢复：零平移时不恢复，probe 仍返回 mount', () => {
  const ctx = loadScriptHooks();
  const { hooks, stage } = ctx;
  const { probe } = hooks.canvasScrollOperation;

  hooks.setCanvasScroll();
  probe(); // 记录 [0,0]

  ctx.rebuildCanvas();
  assert.match(probe(), /^mount@/, '平移为零时恢复无意义');
  hooks.setCanvasScroll();
  assert.equal(stage.canvas.calls.length, 0, '不应调用 move');
});

test('画布重建恢复：首次挂载不恢复', () => {
  const ctx = loadScriptHooks();
  const { hooks, stage } = ctx;

  hooks.setCanvasScroll();
  assert.equal(stage.canvas.calls.length, 0, '首见画布无历史平移可恢复');
});

test('画布重建恢复：连续两次重建都带回各自销毁前的平移', () => {
  const ctx = loadScriptHooks();
  const { stage } = ctx;
  const runner = ctx.runner();

  runner();
  fireWheel(stage, wheelEvent({ deltaY: 100 })); // [0,-100]
  runner();

  ctx.rebuildCanvas();
  runner(); // 恢复 [0,-100]
  fireWheel(stage, wheelEvent({ deltaY: 50 })); // [0,-150]
  runner();

  ctx.rebuildCanvas();
  runner();
  assert.deepEqual(stage.canvas.calls[0], [0, -150], '第二次重建带回第二段平移');
});

test('切换画布：重建后身份不同，probe 返回 mount 且不恢复平移', () => {
  const ctx = loadScriptHooks();
  const { hooks, stage } = ctx;
  const runner = ctx.runner();

  runner();
  fireWheel(stage, wheelEvent({ deltaY: 100 })); // 主画布平移 [0,-100]
  runner(); // tick：记录平移与身份「主画布」

  ctx.rebuildCanvas('循环容器'); // 切换画布：实例重建 + 身份更换
  assert.match(hooks.canvasScrollOperation.probe(), /^mount@/, '身份不同不应 restore');
  runner();
  assert.equal(stage.canvas.calls.length, 0, '切画布不应把旧画布平移带过来');
  assert.equal(stage.container.listeners.wheel.length, 1, '但监听要重挂');
});

test('切换画布再切回：也不恢复（记录已被循环画布刷新）', () => {
  const ctx = loadScriptHooks();
  const { stage } = ctx;
  const runner = ctx.runner();

  runner();
  fireWheel(stage, wheelEvent({ deltaY: 100 })); // 主画布 [0,-100]
  runner();

  ctx.rebuildCanvas('循环容器');
  runner(); // mount：不恢复
  fireWheel(stage, wheelEvent({ deltaY: 300 })); // 循环画布 [0,-300]
  runner(); // tick：记录刷新为 [0,-300] + 身份「循环容器」

  ctx.rebuildCanvas('主画布'); // 切回主画布
  runner();
  assert.equal(stage.canvas.calls.length, 0, '切回主画布同样归零，不重放旧平移');
});

test('连续重建无间隔 tick：两次重建的待挂键不同，都触发挂载', () => {
  const ctx = loadScriptHooks();
  const { stage } = ctx;
  const runner = ctx.runner();

  runner();
  ctx.rebuildCanvas('循环容器');
  runner(); // 挂上循环画布（键 mount）
  assert.equal(stage.container.listeners.wheel.length, 1);

  ctx.rebuildCanvas('主画布'); // 一个 tick 内再切：两次重建之间没有轮询 tick
  runner();
  assert.equal(stage.container.listeners.wheel.length, 1, '第二次重建也必须挂上（键不能与上一次相同）');
});

test('快速双切回原画布：轮询只见身份未变，带回原平移（有意行为，勿当 bug 修）', () => {
  const ctx = loadScriptHooks();
  const { stage } = ctx;
  const runner = ctx.runner();

  runner();
  fireWheel(stage, wheelEvent({ deltaY: 100 })); // 主画布 [0,-100]
  runner(); // tick：记录平移与身份「主画布」

  ctx.rebuildCanvas('循环容器'); // 切走——无 tick
  ctx.rebuildCanvas('主画布'); // 一个 tick 内切回——循环画布从未被轮询见过
  runner();
  assert.deepEqual(stage.canvas.calls[0], [0, -100], '身份没变，视作同画布重建，恢复原平移');
  assert.equal(stage.container.listeners.wheel.length, 1, '监听照常重挂');
});
