// ==UserScript==
// @name         哔哩哔哩移除直播遮挡区域
// @namespace    https://github.com/11ze
// @version      0.1.5
// @description  2025-08-27
// @author       11ze
// @match        https://live.bilibili.com/*
// @icon         https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico
// @grant        GM_addStyle
// @license      MIT
// @downloadURL  https://fastly.jsdelivr.net/gh/11ze/userscripts@main/src/bilibili-live-mask.user.js
// @updateURL    https://fastly.jsdelivr.net/gh/11ze/userscripts@main/src/bilibili-live-mask.user.js
// ==/UserScript==

(function () {
  'use strict';

    const css = `
      .web-player-module-area-mask {
        width: 0 !important;
        height: 0 !important;
      }

      .radio-room-brand-icon {
        display: none !important;
      }
    `;

    GM_addStyle(css);
})();
