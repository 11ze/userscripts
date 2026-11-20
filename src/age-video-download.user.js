// ==UserScript==
// @name         AGE 新页面播放视频
// @namespace    https://github.com/11ze
// @version      0.2.7
// @description  2026-11-20 修按钮类名未生效，改成 30px 深色图标钮并补 aria-label；2026-11-11 名称写入成功后打开视频，剪贴板读取失败可重试，成功后停止轮询
// @author       11ze
// @match        https://www.agedm.org/play/*
// @match        https://age.tv/play/*
// @match        https://agefans.com/play/*
// @match        https://43.240.156.118:8443/*
// @icon         https://www.agedm.io/favicon.ico
// @license      MIT
// ==/UserScript==

/**
# AGE 新页面播放并下载视频

1. 自动在播放页面的动漫名称旁边新增一个按钮
2. 点击按钮把视频名写入剪贴板并打开新标签页播放视频
3. 新标签页找到 <video> 后按剪贴板内容命名并自动触发下载
*/

(function () {
  'use strict';

  let hasButton = false;
  let isCopied = false;
  let isCopying = false;

  const BUTTON_CLASS = 'age-11ze-newTabButton';
  const STYLE_ID = '11ze-age-video-button-style';
  const PLAY_ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  // 站点没有这套钮的先例：按标题旁 30px 图标钮做，色值跟随当前文字色，亮暗页都不突兀
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${BUTTON_CLASS} {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 30px;
        height: 30px;
        margin-left: 8px;
        padding: 0;
        border: 1px solid rgba(127, 127, 127, 0.42);
        border-radius: 8px;
        background: rgba(127, 127, 127, 0.16);
        color: inherit;
        vertical-align: middle;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
      }
      .${BUTTON_CLASS}:hover { background: rgba(127, 127, 127, 0.28); border-color: rgba(127, 127, 127, 0.6); }
      .${BUTTON_CLASS}:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      .${BUTTON_CLASS}:active { transform: scale(0.94); }
      .${BUTTON_CLASS}:disabled { opacity: 0.5; cursor: default; }
      .${BUTTON_CLASS} svg { display: block; fill: currentColor; }
    `;
    document.head.appendChild(style);
  }

  async function main() {
    if (hasButton) {
      return;
    }
    if (isCopied || isCopying) {
      return;
    }

    const videoNameDom = document.querySelector('div.body_content_wrapper h5');
    if (videoNameDom) {
      const iframe = document.querySelector('#iframeForVideo');
      if (!iframe?.src) return;

      ensureStyles();
      const newTabButton = document.createElement('button');
      newTabButton.type = 'button';
      newTabButton.className = BUTTON_CLASS;
      newTabButton.setAttribute('aria-label', '在新页面播放并下载视频');
      newTabButton.title = '在新页面播放并下载视频';
      newTabButton.innerHTML = PLAY_ICON;
      newTabButton.onclick = async function () {
        if (newTabButton.disabled) return;
        const payingNumber = document
          .querySelector('.video_detail_spisode_playing')
          .parentElement.querySelector('a').textContent;

        const videoName =
          videoNameDom.textContent.replace(/\s+/g, '').replace(/🔍/g, '').replace(/📺/g, '') +
          payingNumber;

        const videoUrl = iframe.src;
        // 点击时先保留标签页，异步写入完成后再导航，避免弹窗被拦截。
        const tab = window.open('about:blank');
        if (!tab) return;
        newTabButton.disabled = true;
        try {
          await navigator.clipboard.writeText(videoName);
          tab.location.href = videoUrl;
        } catch (error) {
          tab.close();
          console.error('保存视频名称失败：', error);
        } finally {
          newTabButton.disabled = false;
        }
      };

      videoNameDom.appendChild(newTabButton);
      hasButton = true;
      clearInterval(timer);
      return;
    }

    const video = document.querySelector('video');
    if (video) {
      const videoUrl = video.src;

      isCopying = true;
      try {
        const text = await navigator.clipboard.readText();
        const downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.download = text;
        downloadLink.click();

        document.title = text;
        isCopied = true;
        clearInterval(timer);
      } catch (error) {
        console.error('读取视频名称失败：', error);
      } finally {
        isCopying = false;
      }
      return;
    }
  }

  const timer = setInterval(main, 1000);

  // 测试钩子：浏览器中 __AGE_VIDEO_DOWNLOAD_TEST__ 不存在，此分支永不执行
  if (window.__AGE_VIDEO_DOWNLOAD_TEST__) {
    window.__AGE_VIDEO_DOWNLOAD_TEST__.hooks = { main };
  }
})();
