'use strict';

/**
 * URL 解析模型测试
 *
 * 通过 vm 桩环境执行 url_viewer.user.js 全文，从 window.__URL_VIEWER_TEST__
 * 条件钩子取出 IIFE 内部的解析函数。断言用 JSON.stringify 字符串对比，
 * 避开 vm realm 的 deepEqual 引用相等误报。
 * 见 plans/2026-08-14-candidate-6-url-model.md。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(currentDir, '../src/url_viewer.user.js');

function loadScriptHooks() {
  const source = fs.readFileSync(sourcePath, 'utf8');

  const sandbox = {
    console: {
      log() {},
      error() {},
      warn() {},
    },
    URLSearchParams: URLSearchParams,
    GM_addStyle() {},
    GM_registerMenuCommand() {},
    addEventListener() {},
    document: {
      addEventListener() {},
    },
    __URL_VIEWER_TEST__: {},
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'url_viewer.user.js' });

  return sandbox.__URL_VIEWER_TEST__.hooks;
}

test('测试钩子暴露 parseUrl', () => {
  const hooks = loadScriptHooks();
  assert.equal(typeof hooks.parseUrl, 'function');
});

test('parseUrl：单段无参数', () => {
  const { parseUrl } = loadScriptHooks();
  assert.equal(
    JSON.stringify(parseUrl('https://example.com/path')),
    JSON.stringify([{ host: 'https://example.com/path', params: [] }]),
  );
});

test('parseUrl：单段多参数', () => {
  const { parseUrl } = loadScriptHooks();
  assert.equal(
    JSON.stringify(parseUrl('https://example.com/p?a=1&b=2')),
    JSON.stringify([
      {
        host: 'https://example.com/p',
        params: [
          { key: 'a', value: '1' },
          { key: 'b', value: '2' },
        ],
      },
    ]),
  );
});

test('parseUrl：iframe 嵌套路由按 # 分段', () => {
  const { parseUrl } = loadScriptHooks();
  const actual = parseUrl(
    'https://jvs.example.com/#/myiframe/urlPath?name=学年学期管理&src=/page-design-ui/#/list/use?id=abc&jvsAppId=app1',
  );
  assert.equal(
    JSON.stringify(actual),
    JSON.stringify([
      { host: 'https://jvs.example.com/', params: [] },
      {
        host: '/myiframe/urlPath',
        params: [
          { key: 'name', value: '学年学期管理' },
          { key: 'src', value: '/page-design-ui/' },
        ],
      },
      {
        host: '/list/use',
        params: [
          { key: 'id', value: 'abc' },
          { key: 'jvsAppId', value: 'app1' },
        ],
      },
    ]),
  );
});

test('parseUrl：重复参数键保留多行', () => {
  const { parseUrl } = loadScriptHooks();
  assert.equal(
    JSON.stringify(parseUrl('https://example.com/?a=1&a=2')),
    JSON.stringify([
      {
        host: 'https://example.com/',
        params: [
          { key: 'a', value: '1' },
          { key: 'a', value: '2' },
        ],
      },
    ]),
  );
});

test('parseUrl：query 为空串时不产出参数', () => {
  const { parseUrl } = loadScriptHooks();
  assert.equal(
    JSON.stringify(parseUrl('https://example.com/?')),
    JSON.stringify([{ host: 'https://example.com/', params: [] }]),
  );
});

test('parseUrl：参数值包含 ? 时按整值处理（第一个 ? 之后的全部作为查询串）', () => {
  const { parseUrl } = loadScriptHooks();
  assert.equal(
    JSON.stringify(parseUrl('https://example.com/?redirect=https://x.com/path?foo=bar')),
    JSON.stringify([
      {
        host: 'https://example.com/',
        params: [{ key: 'redirect', value: 'https://x.com/path?foo=bar' }],
      },
    ]),
  );
});

test('parseUrl：空串与非字符串参数返回空数组', () => {
  const { parseUrl } = loadScriptHooks();
  assert.equal(JSON.stringify(parseUrl('')), '[]');
  assert.equal(JSON.stringify(parseUrl(null)), '[]');
  assert.equal(JSON.stringify(parseUrl(undefined)), '[]');
});

test('parseUrl：空段跳过', () => {
  const { parseUrl } = loadScriptHooks();
  assert.equal(
    JSON.stringify(parseUrl('https://example.com/#')),
    JSON.stringify([{ host: 'https://example.com/', params: [] }]),
  );
  assert.equal(
    JSON.stringify(parseUrl('https://h.com/#/route')),
    JSON.stringify([
      { host: 'https://h.com/', params: [] },
      { host: '/route', params: [] },
    ]),
  );
});
