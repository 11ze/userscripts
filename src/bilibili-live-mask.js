// ==UserScript==
// @name         哔哩哔哩移除直播遮挡区域
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  无
// @author       11ze
// @match        https://live.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle('.web-player-module-area-mask { width: 0 !important; height: 0 !important; }');
})();
