'use strict';

/**
 * ensureInjected 幂等注入契约 + 三个设计器按钮函数特征测试
 *
 * 契约：host 内按 find 定位已注入元素，keyAttr+key 键同跳过、键异移除重建、
 * 省略 keyAttr 恒等键（存在即命中）、mount 可返回 null 拒绝注入（旧元素已移除）。
 * 特征测试锁定迁移前现状：复制设计名（use 图标门）、复制组件名（旧版闩锁）、
 * 清空全部字段（逐 box 恒等键），迁移到 ensureInjected 后用例不动仍绿。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJvsHooks, makeFakeEl } from './jvs-harness.mjs';

// ==================== ensureInjected 契约 ====================

/** 记录 remove 调用的已注入元素桩 */
function makeExistingStub(attrValue) {
  const stub = {
    removed: false,
    remove() {
      stub.removed = true;
    },
    getAttribute: () => attrValue,
  };
  return stub;
}

function loadEnsureInjected() {
  const { hooks } = loadJvsHooks();
  return hooks.ensureInjected;
}

test('ensureInjected：host 缺失返回 null，不调 mount', () => {
  const ensureInjected = loadEnsureInjected();
  let mounted = 0;
  const result = ensureInjected({
    host: null,
    find: '.btn',
    mount() {
      mounted++;
      return {};
    },
  });
  assert.equal(result, null);
  assert.equal(mounted, 0);
});

test('ensureInjected：无已注入元素 → 调 mount 返回其产物', () => {
  const ensureInjected = loadEnsureInjected();
  const host = { querySelector: () => null };
  const created = {};
  let mounted = 0;
  const result = ensureInjected({
    host,
    find: '.btn',
    keyAttr: 'name-11ze',
    key: 'a',
    mount() {
      mounted++;
      return created;
    },
  });
  assert.equal(result, created);
  assert.equal(mounted, 1);
});

test('ensureInjected：键同（keyAttr 读出 === key）→ 不调 mount 返回已存在元素', () => {
  const ensureInjected = loadEnsureInjected();
  const existing = makeExistingStub('a');
  const host = { querySelector: () => existing };
  let mounted = 0;
  const result = ensureInjected({
    host,
    find: '.btn',
    keyAttr: 'name-11ze',
    key: 'a',
    mount() {
      mounted++;
      return {};
    },
  });
  assert.equal(result, existing);
  assert.equal(mounted, 0);
  assert.equal(existing.removed, false);
});

test('ensureInjected：键异 → 移除旧元素并调 mount 返回新元素', () => {
  const ensureInjected = loadEnsureInjected();
  const existing = makeExistingStub('old');
  const host = { querySelector: () => existing };
  const created = {};
  const result = ensureInjected({
    host,
    find: '.btn',
    keyAttr: 'name-11ze',
    key: 'new',
    mount() {
      return created;
    },
  });
  assert.equal(result, created);
  assert.equal(existing.removed, true);
});

test('ensureInjected：省略 keyAttr 为恒等键，存在即跳过', () => {
  const ensureInjected = loadEnsureInjected();
  const existing = makeExistingStub('whatever');
  const host = { querySelector: () => existing };
  let mounted = 0;
  const result = ensureInjected({
    host,
    find: '.btn',
    mount() {
      mounted++;
      return {};
    },
  });
  assert.equal(result, existing);
  assert.equal(mounted, 0);
  assert.equal(existing.removed, false);
});

test('ensureInjected：mount 返回 null 拒绝注入；键异时旧元素已移除不建新', () => {
  const ensureInjected = loadEnsureInjected();
  const host = { querySelector: () => null };
  assert.equal(
    ensureInjected({ host, find: '.btn', mount: () => null }),
    null
  );

  const existing = makeExistingStub('old');
  const hostWithStale = { querySelector: () => existing };
  assert.equal(
    ensureInjected({ host: hostWithStale, find: '.btn', keyAttr: 'k', key: 'new', mount: () => null }),
    null
  );
  assert.equal(existing.removed, true);
});

// ==================== 设计器按钮特征（迁移前锁现状） ====================

const DESIGN_NAME_SELECTOR =
  '#app > div > div > div.design-header-box > div.header-left > span';

/** 逻辑/表单设计头部名称桩：parentNode.insertBefore 记录插入 */
function makeDesignName(text, hasUseIcon) {
  const inserted = [];
  const designName = {
    innerText: text,
    inserted,
    querySelector(selector) {
      if (selector === 'use') return hasUseIcon ? {} : null;
      return null;
    },
    parentNode: {
      insertBefore(node, ref) {
        inserted.push({ node, ref });
      },
    },
  };
  return designName;
}

/**
 * 加载设计器按钮环境
 * existing：#copy-design-name-button-11ze 现有按钮（null = 没有）
 */
function loadDesignerEnv({ designName, existing = null, boxes = [] } = {}) {
  const { hooks } = loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector(selector) {
        if (selector === DESIGN_NAME_SELECTOR) return designName;
        if (selector === '#copy-design-name-button-11ze') return existing;
        if (selector === '#node_detailpannel > h4 > div > span') return null;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '.data-model-box') return boxes;
        return [];
      },
      createElement: () => makeFakeEl(),
      getElementById: () => null,
      addEventListener() {},
    },
  });
  return hooks;
}

test('复制设计名：无现有按钮且名称带 use 图标 → 插入复制按钮（带身份属性与 10px 间距）', () => {
  const designName = makeDesignName('订单逻辑', true);
  const hooks = loadDesignerEnv({ designName });
  hooks.addButtonToCopyDesignName();

  assert.equal(designName.inserted.length, 1);
  const button = designName.inserted[0].node;
  assert.equal(button.getAttribute('design-name-11ze'), '订单逻辑');
  assert.equal(button.style.marginLeft, '10px');
});

test('复制设计名：键同 → 不动现有按钮', () => {
  const designName = makeDesignName('订单逻辑', true);
  const existing = makeExistingStub('订单逻辑');
  const hooks = loadDesignerEnv({ designName, existing });
  hooks.addButtonToCopyDesignName();

  assert.equal(designName.inserted.length, 0);
  assert.equal(existing.removed, false);
});

test('复制设计名：键异 → 移除旧按钮插入新按钮', () => {
  const designName = makeDesignName('新逻辑', true);
  const existing = makeExistingStub('旧逻辑');
  const hooks = loadDesignerEnv({ designName, existing });
  hooks.addButtonToCopyDesignName();

  assert.equal(existing.removed, true);
  assert.equal(designName.inserted.length, 1);
  assert.equal(designName.inserted[0].node.getAttribute('design-name-11ze'), '新逻辑');
});

test('复制设计名：名称元素无 use 图标 → 不插入', () => {
  const designName = makeDesignName('订单逻辑', false);
  const hooks = loadDesignerEnv({ designName });
  hooks.addButtonToCopyDesignName();

  assert.equal(designName.inserted.length, 0);
});

test('复制设计名：键异且无 use 图标 → 只移除旧按钮不建新', () => {
  const designName = makeDesignName('新逻辑', false);
  const existing = makeExistingStub('旧逻辑');
  const hooks = loadDesignerEnv({ designName, existing });
  hooks.addButtonToCopyDesignName();

  assert.equal(existing.removed, true);
  assert.equal(designName.inserted.length, 0);
});

/** 组件名称桩：parentFlag 控制父级是否有旧版复制图标 */
function makeComponentName(text, parentFlag) {
  const inserted = [];
  return {
    innerText: text,
    inserted,
    querySelector() {
      return null;
    },
    parentNode: {
      querySelector(selector) {
        if (selector === '.el-icon-document-copy') return parentFlag ? {} : null;
        return null;
      },
      insertBefore(node, ref) {
        inserted.push({ node, ref });
      },
    },
  };
}

function loadComponentEnv({ componentName, existing = null }) {
  const { hooks } = loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector(selector) {
        if (selector === '#node_detailpannel > h4 > div > span') return componentName;
        if (selector === '#copy-component-name-button-11ze') return existing;
        return null;
      },
      querySelectorAll: () => [],
      createElement: () => makeFakeEl(),
      getElementById: () => null,
      addEventListener() {},
    },
  });
  return hooks;
}

test('复制组件名：新版组件面板 → 插入复制按钮（带身份属性）', () => {
  const componentName = makeComponentName('输入框', false);
  const hooks = loadComponentEnv({ componentName });
  hooks.addButtonToCopyComponentName();

  assert.equal(componentName.inserted.length, 1);
  assert.equal(componentName.inserted[0].node.getAttribute('component-name-11ze'), '输入框');
});

test('复制组件名：键同跳过、键异换新', () => {
  const componentName = makeComponentName('输入框', false);
  const same = makeExistingStub('输入框');
  loadComponentEnv({ componentName, existing: same }).addButtonToCopyComponentName();
  assert.equal(componentName.inserted.length, 0);
  assert.equal(same.removed, false);

  const stale = makeExistingStub('旧组件');
  loadComponentEnv({ componentName, existing: stale }).addButtonToCopyComponentName();
  assert.equal(stale.removed, true);
  assert.equal(componentName.inserted.length, 1);
});

test('复制组件名：旧版复制图标在场 → 不插入且闩锁置位，图标消失后也不再插', () => {
  let parentHasIcon = true; // 可变：第一次在场，第二次消失
  const inserted = [];
  const componentName = {
    innerText: '输入框',
    querySelector() {
      return null;
    },
    parentNode: {
      querySelector(selector) {
        if (selector === '.el-icon-document-copy') return parentHasIcon ? {} : null;
        return null;
      },
      insertBefore(node, ref) {
        inserted.push({ node, ref });
      },
    },
  };
  const hooks = loadComponentEnv({ componentName });

  hooks.addButtonToCopyComponentName(); // 旧版图标在场：不插入，闩锁置位
  assert.equal(inserted.length, 0);

  parentHasIcon = false;
  hooks.addButtonToCopyComponentName(); // 图标消失：闩锁仍拦截（同一沙箱内 STATE 存活）
  assert.equal(inserted.length, 0);
});

/** 字段模型盒桩 */
function makeBox(hasButton) {
  return {
    querySelector(selector) {
      if (selector.startsWith('#clear-all-fields-button-11ze')) return hasButton ? {} : null;
      return null;
    },
    inserted: [],
    insertBefore(node, ref) {
      this.inserted.push({ node, ref });
    },
  };
}

test('清空全部字段：逐 box 注入，已有按钮的 box 跳过', () => {
  const box0 = makeBox(false);
  const box1 = makeBox(true);
  const { hooks } = loadJvsHooks({
    document: {
      getElementsByTagName: () => [{ href: 'data:text/css,/*jvs-ui*/' }],
      querySelector: () => null,
      querySelectorAll(selector) {
        if (selector === '.data-model-box') return [box0, box1];
        return [];
      },
      createElement: () => makeFakeEl(),
      getElementById: () => null,
      addEventListener() {},
    },
  });
  hooks.addButtonToClearAllFields();

  assert.equal(box0.inserted.length, 1);
  assert.equal(box1.inserted.length, 0);
});
