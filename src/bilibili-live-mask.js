// ==UserScript==
// @name         哔哩哔哩移除直播遮挡区域
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  2025-01-14
// @author       11ze
// @match        https://live.bilibili.com/*
// @icon         https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle('.web-player-module-area-mask { width: 0 !important; height: 0 !important; }');
})();
