// ==UserScript==
// @name         网站亮暗色模式切换
// @namespace    https://github.com/11ze
// @version      0.0.1
// @description  2025-11-26
// @author       11ze
// @match        *://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwYzAtLjQ2My0uNjk0LS41NC0uOTMzLS4xNDNhNi41IDYuNSAwIDEgMS04LjkyNC04LjkyNEMxMi41NCAyLjY5MyAxMi40NjMgMiAxMiAyQzYuNDc3IDIgMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEwIi8+PC9zdmc+
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function () {
  ('use strict');

  let isDarkMode = false;
  let darkModeStyle = null;

  function init() {
    // 每次打开页面都重置为关闭状态
    isDarkMode = false;

    GM_registerMenuCommand('切换', toggleDarkMode);
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;

    if (isDarkMode) {
      applyDarkMode();
    } else {
      removeDarkMode();
    }
  }

  function applyDarkMode() {
    if (darkModeStyle) return;

    darkModeStyle = GM_addStyle(`
            html {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            img, video, iframe, canvas, svg {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            /* 特殊处理某些元素 */
            [style*="background-image"] {
                filter: invert(1) hue-rotate(180deg) !important;
            }
        `);
  }

  function removeDarkMode() {
    if (darkModeStyle) {
      darkModeStyle.remove();
      darkModeStyle = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
