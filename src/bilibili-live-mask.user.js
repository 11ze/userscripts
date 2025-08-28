// ==UserScript==
// @name         哔哩哔哩移除直播遮挡区域
// @namespace    https://github.com/11ze
// @version      0.1.4
// @description  2025-02-21
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

  GM_addStyle('.web-player-module-area-mask { width: 0 !important; height: 0 !important; }');
})();
