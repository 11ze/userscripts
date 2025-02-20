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
// @downloadURL  https://update.greasyfork.org/scripts/496649/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E7%A7%BB%E9%99%A4%E7%9B%B4%E6%92%AD%E9%81%AE%E6%8C%A1%E5%8C%BA%E5%9F%9F.user.js
// @updateURL    https://update.greasyfork.org/scripts/496649/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9%E7%A7%BB%E9%99%A4%E7%9B%B4%E6%92%AD%E9%81%AE%E6%8C%A1%E5%8C%BA%E5%9F%9F.meta.js
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle('.web-player-module-area-mask { width: 0 !important; height: 0 !important; }');
})();
