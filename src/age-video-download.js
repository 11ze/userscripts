// ==UserScript==
// @name         AGE 新页面播放视频
// @namespace    https://github.com/11ze
// @version      0.2.2
// @description  2025-02-20
// @author       11ze
// @match        https://www.agedm.org/play/*
// @match        https://age.tv/play/*
// @match        https://agefans.com/play/*
// @match        https://43.240.156.118:8443/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=agedm.org
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/498500/AGE%20%E6%96%B0%E9%A1%B5%E9%9D%A2%E6%92%AD%E6%94%BE%E8%A7%86%E9%A2%91.user.js
// @updateURL    https://update.greasyfork.org/scripts/498500/AGE%20%E6%96%B0%E9%A1%B5%E9%9D%A2%E6%92%AD%E6%94%BE%E8%A7%86%E9%A2%91.meta.js
// ==/UserScript==

/**
# AGE 新页面播放并下载视频

1. 自动在播放页面的动漫名称旁边新增一个按钮
2. 点击按钮打开新标签页播放视频
*/

(function () {
  ('use strict');

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

  // 增加节流控制
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      if (!inThrottle) {
        func.apply(this, arguments);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  setInterval(
    throttle(() => {
      main();
    }),
    1000
  );
})();
