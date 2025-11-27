// ==UserScript==
// @name         网站亮暗色模式切换
// @namespace    https://github.com/11ze
// @version      0.0.4
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

  const STORAGE_KEY = '11ze_color_mode_switch_reverse_color_mode';
  let isReverseColorMode = localStorage.getItem(STORAGE_KEY) === 'true';
  let reverseColorModeStyle = null;

  function init() {
    GM_registerMenuCommand('切换', toggleReverseColorMode);

    createToggleButton();
    updateToggleButton();

    if (isReverseColorMode) {
      applyReverseColorMode();
    }
  }

  function createToggleButton() {
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.id = '11ze-reverse-color-mode-toggle-container';
    buttonContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    `;

    const toggleButton = document.createElement('button');
    toggleButton.id = '11ze-reverse-color-mode-toggle-button';
    toggleButton.innerHTML =
      '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwYzAtLjQ2My0uNjk0LS41NC0uOTMzLS4xNDNhNi41IDYuNSAwIDEgMS04LjkyNC04LjkyNEMxMi41NCAyLjY5MyAxMi40NjMgMiAxMiAyQzYuNDc3IDIgMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEwIi8+PC9zdmc+" alt="sun" style="width:24px;height:24px;">';

    toggleButton.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background-color: #000;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 添加悬停效果
    buttonContainer.addEventListener('mouseenter', () => {
      buttonContainer.style.opacity = '1';
    });

    buttonContainer.addEventListener('mouseleave', () => {
      buttonContainer.style.opacity = '0.7';
    });

    toggleButton.addEventListener('click', toggleReverseColorMode);

    buttonContainer.appendChild(toggleButton);
    document.body.appendChild(buttonContainer);
  }

  function updateToggleButton() {
    const button = document.getElementById('11ze-reverse-color-mode-toggle-button');

    if (!button) {
      return;
    }

    button.style.display = isReverseColorMode ? 'flex' : 'none';
  }

  function toggleReverseColorMode() {
    isReverseColorMode = !isReverseColorMode;

    localStorage.setItem(STORAGE_KEY, isReverseColorMode.toString());

    updateToggleButton();

    if (isReverseColorMode) {
      applyReverseColorMode();
    } else {
      removeReverseColorMode();
    }
  }

  function applyReverseColorMode() {
    if (reverseColorModeStyle) return;

    reverseColorModeStyle = GM_addStyle(`
            html {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            img, video, iframe, canvas, svg, picture {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            [style*="background-image"],
            [style*="background-image:"] {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            .reverse-color-mode-ignore,
            [data-theme],
            [data-color-mode] {
                filter: none !important;
            }
        `);
  }

  function removeReverseColorMode() {
    if (reverseColorModeStyle) {
      reverseColorModeStyle.remove();
      reverseColorModeStyle = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
