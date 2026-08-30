// ==UserScript==
// @name         AGE 新页面播放视频
// @namespace    https://github.com/11ze
// @version      0.2.5
// @description  2026-01-27 在 AGE 播放页标题旁挂按钮：新标签页播放视频并自动下载（文件名经剪贴板跨页传递）
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

  function main() {
    if (hasButton) {
      return;
    }
    if (isCopied) {
      return;
    }

    const videoNameDom = document.querySelector('div.body_content_wrapper h5');
    if (videoNameDom) {
      const iframe = document.querySelector('#iframeForVideo');

      const newTabButton = document.createElement('button');
      newTabButton.class = '11ze-age-newTabButton';
      newTabButton.innerText = '📺';
      newTabButton.onclick = function () {
        const payingNumber = document
          .querySelector('.video_detail_spisode_playing')
          .parentElement.querySelector('a').textContent;

        const videoName =
          videoNameDom.textContent.replace(/\s+/g, '').replace(/🔍/g, '').replace(/📺/g, '') +
          payingNumber;

        // 保存视频名称到剪贴板
        navigator.clipboard.writeText(videoName);

        window.open(iframe.src);
      };

      videoNameDom.appendChild(newTabButton);
      hasButton = true;
    }

    const video = document.querySelector('video');
    if (video) {
      const videoUrl = video.src;

      navigator.clipboard.readText().then(function (text) {
        const downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.download = text;
        downloadLink.click();

        document.title = text;
      });

      isCopied = true;
      return;
    }
  }

  setInterval(main, 1000);
})();
