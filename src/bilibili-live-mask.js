// ==UserScript==
// @name         哔哩哔哩移除直播遮挡区域
// @namespace    https://github.com/11ze
// @version      0.1.3
// @description  2025-02-20
// @author       11ze
// @match        https://live.bilibili.com/*
// @icon         https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico
// @grant        GM_addStyle
// @license      MIT
// @downloadURL  https://cdn.jsdelivr.net/gh/11ze/userscripts@main/src/bilibili-live-mask.js
// @updateURL    https://cdn.jsdelivr.net/gh/11ze/userscripts@main/src/bilibili-live-mask.js
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle('.web-player-module-area-mask { width: 0 !important; height: 0 !important; }');
})();
