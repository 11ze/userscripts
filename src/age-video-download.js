// ==UserScript==
// @name         AGE 新页面播放视频并自动复制视频链接
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  2024-06-21
// @author       11ze
// @match        https://www.agedm.org/play/*
// @match        https://age.tv/play/*
// @match        https://agefans.com/play/*
// @match        https://43.240.156.118:8443/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=agedm.org
// @license      MIT
// ==/UserScript==

/**
# AGE 新页面播放视频并复制视频链接

1. 自动在播放页面的动漫名称旁边新增一个按钮
2. 点击按钮打开新标签页播放视频
3. 自动把视频下载链接复制到系统剪切板
4. 打开剪切板的链接可以 Ctrl + S 下载视频
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
        navigator.clipboard.writeText(videoName);

        window.open(iframe.src);
      };

      videoNameDom.appendChild(newTabButton);
      hasButton = true;
    }

    const video = document.querySelector('video');
    if (video) {
      const videoUrl = video.src;

      navigator.clipboard.writeText(videoUrl);
      isCopied = true;
      return;
    }
  }

  setInterval(function () {
    main();
  }, 1000);
})();
