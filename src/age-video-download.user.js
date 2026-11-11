// ==UserScript==
// @name         AGE 新页面播放视频
// @namespace    https://github.com/11ze
// @version      0.2.6
// @description  2026-11-11 名称写入成功后打开视频，剪贴板读取失败可重试，成功后停止轮询
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

      const newTabButton = document.createElement('button');
      newTabButton.class = '11ze-age-newTabButton';
      newTabButton.innerText = '📺';
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
