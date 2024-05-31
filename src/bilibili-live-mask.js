// ==UserScript==
// @name         哔哩哔哩移除直播遮挡区域
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  无
// @author       11ze
// @match        https://live.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  function main() {
    const mask = document.querySelector('#web-player-module-area-mask-panel > div');

    if (mask) {
      mask.style.width = '0%';
      mask.style.height = '0%';
    }
  }

  setInterval(function () {
    main();
  }, 2000);
})();
