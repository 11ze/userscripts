// ==UserScript==
// @name         网站亮暗色模式切换
// @namespace    https://github.com/11ze
// @version      0.0.2
// @description  为任意网站提供亮暗色模式切换功能
// @author       11ze
// @match        *://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwYzAtLjQ2My0uNjk0LS41NC0uOTMzLS4xNDNhNi41IDYuNSAwIDEgMS04LjkyNC04LjkyNEMxMi41NCAyLjY5MyAxMi40NjMgMiAxMiAyQzYuNDc3IDIgMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEwIi8+PC9zdmc+
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = '11ze_color_mode_switch_dark_mode';
  let isDarkMode = localStorage.getItem(STORAGE_KEY) === 'true';
  let darkModeStyle = null;

  function init() {
    GM_registerMenuCommand('切换', toggleDarkMode);

    createToggleButton();
    updateToggleButton();

    if (isDarkMode) {
      applyDarkMode();
    }
  }

  function createToggleButton() {
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.id = '11ze-dark-mode-toggle-container';
    buttonContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    `;

    const toggleButton = document.createElement('button');
    toggleButton.id = '11ze-dark-mode-toggle-button';
    toggleButton.innerHTML =
      '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwYzAtLjQ2My0uNjk0LS41NC0uOTMzLS4xNDNhNi41IDYuNSAwIDEgMS04LjkyNC04LjkyNEMxMi41NCAyLjY5MyAxMi40NjMgMiAxMiAyQzYuNDc3IDIgMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEwIi8+PC9zdmc+" alt="sun" style="width:24px;height:24px;">';

    toggleButton.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: transparent;
      border: 2px solid rgba(128, 128, 128, 0.5);
      color: '#fff';
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;

    // 添加悬停效果
    buttonContainer.addEventListener('mouseenter', () => {
      buttonContainer.style.opacity = '1';
    });

    buttonContainer.addEventListener('mouseleave', () => {
      buttonContainer.style.opacity = '0.7';
    });

    toggleButton.addEventListener('click', toggleDarkMode);

    buttonContainer.appendChild(toggleButton);
    document.body.appendChild(buttonContainer);
  }

  function updateToggleButton() {
    const button = document.getElementById('11ze-dark-mode-toggle-button');

    if (!button) {
      return;
    }

    button.style.display = isDarkMode ? 'flex' : 'none';
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;

    localStorage.setItem(STORAGE_KEY, isDarkMode.toString());

    updateToggleButton();

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

            body {
                background-color: #121212 !important;
                color: #e0e0e0 !important;
            }

            img, video, iframe, canvas, svg, picture {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            /* 处理带有背景图片的元素 */
            [style*="background-image"],
            [style*="background-image:"] {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            /* 处理代码块 */
            pre, code {
                background-color: #2d2d2d !important;
                color: #f8f8f2 !important;
            }

            /* 处理表格 */
            table {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }

            th, td {
                border-color: #555 !important;
            }

            /* 处理输入框和文本区域 */
            input, textarea, select {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #555 !important;
            }

            /* 处理链接 */
            a:link, a:visited {
                color: #66b3ff !important;
            }

            /* 处理特殊网站元素 */
            .dark-mode-ignore,
            [data-theme],
            [data-color-mode] {
                filter: none !important;
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
