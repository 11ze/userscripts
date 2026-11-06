'use strict';

/**
 * 表单设计组件名常显机制测试
 *
 * 两版 DOM 实测：新版（edf-ui）draggable 在 .formitem2 父级、站点仅 hover
 * 藏 .type-name；旧版（jvs-ui）draggable 在 .formitem2 本体、站点默认藏整条
 * .handle-btn。两版各挂各的常显类，互不串挂——旧版不挂 active-formitem2，
 * 否则其 display:block 会把旧版部分 inline 的 type-name 强改变排版。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl } from './jvs-harness.mjs';

function loadScriptHooks(formComponents) {
  return loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll: (selector) =>
        selector === '.formitem2' ? formComponents : [],
      getElementById: () => null,
      addEventListener() {},
    },
  }).hooks;
}

/** 画布组件桩：draggable 落在本体还是父级由入参控制，对应两版实测 DOM */
function fakeFormComponent({ selfDraggable = null, parentDraggable = null } = {}) {
  const component = makeFakeEl();
  const parent = makeFakeEl();
  if (selfDraggable) component.setAttribute('draggable', selfDraggable);
  if (parentDraggable) parent.setAttribute('draggable', parentDraggable);
  component.parentElement = parent;
  return component;
}

test('新版：draggable 在父级 → 挂 active-formitem2，不挂旧版类', () => {
  const component = fakeFormComponent({ parentDraggable: 'true' });
  const hooks = loadScriptHooks([component]);

  hooks.showFormDesignComponentNames();

  assert.equal(component.classList.contains('active-formitem2'), true);
  assert.equal(component.classList.contains('active-formitem2-handle'), false);
});

test('旧版：draggable 在本体、父级没有 → 挂 active-formitem2-handle，不挂新版类', () => {
  const component = fakeFormComponent({ selfDraggable: 'true' });
  const hooks = loadScriptHooks([component]);

  hooks.showFormDesignComponentNames();

  assert.equal(component.classList.contains('active-formitem2-handle'), true);
  assert.equal(component.classList.contains('active-formitem2'), false);
});

test('draggable 两级都没有（非画布组件）→ 不挂任何常显类', () => {
  const component = fakeFormComponent();
  const hooks = loadScriptHooks([component]);

  hooks.showFormDesignComponentNames();

  assert.equal(component.classList.contains('active-formitem2'), false);
  assert.equal(component.classList.contains('active-formitem2-handle'), false);
});

test('同一画布新旧版组件混存时各自挂各自的类', () => {
  const newVersion = fakeFormComponent({ parentDraggable: 'true' });
  const oldVersion = fakeFormComponent({ selfDraggable: 'true' });
  const hooks = loadScriptHooks([newVersion, oldVersion]);

  hooks.showFormDesignComponentNames();

  assert.equal(newVersion.classList.contains('active-formitem2'), true);
  assert.equal(oldVersion.classList.contains('active-formitem2-handle'), true);
});
