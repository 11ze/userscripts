'use strict';

/**
 * 仓库契约测试：脚本元数据、独立性与文档覆盖
 *
 * 这些约定写在 AGENTS.md 与 docs/userscript-conventions.md 里，靠人工遵守已经漂移过
 * （如 jump_bottom 缺 'use strict'）。这里把它们变成会失败的测试，避免规范只停在文档上。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const docsDir = path.join(root, 'docs/scripts');

const scripts = fs
  .readdirSync(srcDir)
  .filter((file) => file.endsWith('.user.js'))
  .sort();
const docs = fs
  .readdirSync(docsDir)
  .filter((file) => file.endsWith('.md'))
  .sort();

function readScript(file) {
  return fs.readFileSync(path.join(srcDir, file), 'utf8');
}

function baseName(file) {
  return file.replace(/\.user\.js$/, '');
}

// 元数据块之后是一个被立即调用的函数体，而不是在枚举 (function.../(() =>... 的具体写法
function isIifeWrapped(source) {
  const marker = '// ==/UserScript==';
  const index = source.indexOf(marker);
  const body = (index === -1 ? source : source.slice(index + marker.length))
    .replace(/^(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)+/, '');
  return /^(\(|!function\b)/.test(body) && /[)}]\s*\(\s*\)\s*;\s*$/.test(body);
}

test('src 下每个脚本都有同名架构文档', () => {
  for (const file of scripts) {
    assert.ok(
      docs.includes(`${baseName(file)}.md`),
      `${file} 缺少 docs/scripts/${baseName(file)}.md`,
    );
  }
});

test('没有孤立的脚本文档', () => {
  const known = new Set(scripts.map(baseName));
  for (const doc of docs) {
    assert.ok(known.has(doc.replace(/\.md$/, '')), `docs/scripts/${doc} 没有对应脚本`);
  }
});

test('元数据块完整且位于文件开头', () => {
  for (const file of scripts) {
    const source = readScript(file);
    assert.ok(source.startsWith('// ==UserScript=='), `${file} 元数据块不在开头`);
    const end = source.indexOf('// ==/UserScript==');
    assert.ok(end > 0, `${file} 元数据块未闭合`);
    const block = source.slice(0, end);

    for (const field of ['name', 'namespace', 'version', 'match', 'license']) {
      assert.match(block, new RegExp(`//\\s*@${field}\\s+\\S`), `${file} 缺少 @${field}`);
    }
    assert.match(block, /\/\/\s*@version\s+\d+\.\d+\.\d+/, `${file} 的 @version 不是语义化版本`);
  }
});

test('每个脚本都启用严格模式并包在 IIFE 内', () => {
  for (const file of scripts) {
    const source = readScript(file);
    assert.ok(source.includes("'use strict'"), `${file} 缺少 'use strict'`);
    assert.ok(isIifeWrapped(source), `${file} 未包在 IIFE 内`);
  }
});

test('脚本之间不相互引用', () => {
  for (const file of scripts) {
    const source = readScript(file);
    assert.doesNotMatch(source, /^\s*(import|export)\s/m, `${file} 不应使用模块语法`);
    assert.doesNotMatch(source, /\brequire\s*\(/, `${file} 不应 require 其他脚本`);
  }
});

test('测试钩子统一挂在 window.__*_TEST__ 上', () => {
  for (const file of scripts) {
    const source = readScript(file);
    for (const match of source.matchAll(/window\.(__[A-Za-z0-9_]*_TEST__)/g)) {
      assert.match(match[1], /^__[A-Z0-9]+(?:_[A-Z0-9]+)*_TEST__$/, `${file} 的钩子 ${match[1]} 命名不合规`);
    }
  }
});

test('IIFE 检测接受常见包裹写法，不认未调用的函数体', () => {
  for (const wrapped of [
    '(function () {\n})();',
    '(function named() {\n})();',
    '(() => {\n})();',
    '(async () => {\n})();',
    '!function () {\n}();',
  ]) {
    assert.equal(isIifeWrapped(wrapped), true, `应认作 IIFE：${wrapped.split('\n')[0]}`);
  }
  assert.equal(isIifeWrapped('const a = 1;\n'), false);
  assert.equal(isIifeWrapped('(function () {\n})'), false, '没调用的函数体不算');
});
