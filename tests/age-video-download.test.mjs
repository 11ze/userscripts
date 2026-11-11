'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/age-video-download.user.js', import.meta.url), 'utf8');

function loadScript({ readText = async () => '测试视频', writeText = async () => {}, playerPage = false, popupBlocked = false } = {}) {
  let reads = 0;
  let cleared = false;
  const downloads = [];
  const opened = [];
  const errors = [];
  const title = { textContent: '测试视频', appendChild(button) { this.button = button; } };
  const document = {
    title: '',
    querySelector(selector) {
      if (selector === 'div.body_content_wrapper h5') return playerPage ? title : null;
      if (selector === '#iframeForVideo') return { src: 'https://video.example.com/movie.mp4' };
      if (selector === '.video_detail_spisode_playing') return { parentElement: { querySelector: () => ({ textContent: '第1集' }) } };
      if (selector === 'video') return playerPage ? null : { src: 'https://video.example.com/movie.mp4' };
      return null;
    },
    createElement() {
      return { disabled: false, click() { downloads.push({ href: this.href, download: this.download }); } };
    },
  };
  const sandbox = {
    console: { error: (...args) => errors.push(args) },
    document,
    navigator: { clipboard: { readText() { reads++; return readText(); }, writeText } },
    setInterval() { return 1; },
    clearInterval() { cleared = true; },
    open(url) {
      if (popupBlocked) return null;
      const tab = { location: { href: url }, closed: false, close() { this.closed = true; } };
      opened.push(tab);
      return tab;
    },
    __AGE_VIDEO_DOWNLOAD_TEST__: {},
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'age-video-download.user.js' });
  return { document, title, downloads, opened, errors, get reads() { return reads; }, get cleared() { return cleared; },
    async tick() { await sandbox.__AGE_VIDEO_DOWNLOAD_TEST__.hooks.main(); await new Promise(setImmediate); },
  };
}

test('读取剪贴板被拒绝后：权限恢复可重试并按文件名触发一次下载', async () => {
  let allowed = false;
  const page = loadScript({ readText: async () => {
    if (!allowed) throw new Error('NotAllowedError');
    return '测试视频第1集';
  } });
  await page.tick();
  assert.equal(page.downloads.length, 0);
  assert.equal(page.cleared, false);
  allowed = true;
  await page.tick();
  assert.deepEqual(page.downloads, [{ href: 'https://video.example.com/movie.mp4', download: '测试视频第1集' }]);
  assert.equal(page.document.title, '测试视频第1集');
  assert.equal(page.cleared, true);
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('剪贴板读取尚未完成：后续轮询不重复请求，完成后停止轮询', async () => {
  const reading = deferred();
  const page = loadScript({ readText: () => reading.promise });
  const pending = page.tick();
  await page.tick();
  assert.equal(page.reads, 1);
  reading.resolve('等待完成');
  await pending;
  await page.tick();
  assert.equal(page.downloads.length, 1);
  assert.equal(page.cleared, true);
});

test('打开视频：同步保留标签页，剪贴板写入完成后才跳转，按钮页停止轮询', async () => {
  const writing = deferred();
  const names = [];
  const page = loadScript({ playerPage: true, writeText: (name) => { names.push(name); return writing.promise; } });
  await page.tick();
  const pending = page.title.button.onclick();
  assert.equal(page.opened.length, 1);
  assert.equal(page.opened[0].location.href, 'about:blank');
  assert.equal(page.title.button.disabled, true);
  writing.resolve();
  await pending;
  assert.deepEqual(names, ['测试视频第1集']);
  assert.equal(page.opened[0].location.href, 'https://video.example.com/movie.mp4');
  assert.equal(page.title.button.disabled, false);
  assert.equal(page.cleared, true);
});

test('写入剪贴板失败：关闭空白标签页，按钮可再次使用', async () => {
  let allowed = false;
  const page = loadScript({ playerPage: true, writeText: async () => {
    if (!allowed) throw new Error('NotAllowedError');
  } });
  await page.tick();
  await page.title.button.onclick();
  assert.equal(page.opened[0].closed, true);
  assert.equal(page.opened[0].location.href, 'about:blank');
  assert.equal(page.title.button.disabled, false);
  allowed = true;
  await page.title.button.onclick();
  assert.equal(page.opened[1].location.href, 'https://video.example.com/movie.mp4');
});

test('浏览器拦截新标签页：不覆盖剪贴板，按钮仍可用', async () => {
  let writes = 0;
  const page = loadScript({ playerPage: true, popupBlocked: true, writeText: async () => { writes++; } });
  await page.tick();
  await page.title.button.onclick();
  assert.equal(writes, 0);
  assert.equal(page.title.button.disabled, false);
});
