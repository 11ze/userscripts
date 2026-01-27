// ==UserScript==
// @name         哔哩哔哩移除直播遮挡区域
// @namespace    https://github.com/11ze
// @version      0.1.6
// @description  2026-01-27
// @author       11ze
// @match        https://live.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_addStyle
// @license      MIT
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
