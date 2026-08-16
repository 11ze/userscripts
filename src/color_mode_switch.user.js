// ==UserScript==
// @name         亮暗色切换
// @namespace    https://github.com/11ze
// @version      0.1.0
// @description  2026-08-16 为任意网站提供亮暗色模式切换功能
// @author       11ze
// @match        *://*/*
// @noframes
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwYzAtLjQ2My0uNjk0LS41NC0uOTMzLS4xNDNhNi41IDYuNSAwIDEgMS04LjkyNC04LjkyNEMxMi41NCAyLjY5MyAxMi40NjMgMiAxMiAyQzYuNDc3IDIgMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEwIi8+PC9zdmc+
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = '11ze_color_mode_switch_reverse_color_mode';
  const TOGGLE_CONTAINER_ID = '11ze-reverse-color-mode-toggle-container';

  /**
   * 状态存取：storage 由调用方注入，异常（隐私模式/配额）时读出关闭、写返回 false
   */
  function readState(storage) {
    try {
      return storage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function writeState(storage, reverseColorMode) {
    try {
      storage.setItem(STORAGE_KEY, reverseColorMode.toString());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 反转样式表：整页反转、媒体与自挂按钮二次反转抵消、
   * 逃生舱元素仅清除自身 filter（CSS filter 下子树无法脱离整页反转）
   */
  function buildReverseColorCss() {
    return `
      html {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      img, video, iframe, canvas, svg, picture,
      [id='${TOGGLE_CONTAINER_ID}'] {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      .reverse-color-mode-ignore,
      [data-theme],
      [data-color-mode] {
        filter: none !important;
      }
    `;
  }

  const ICON_SUN_DATA_URI =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMiAyMmM1LjUyMyAwIDEwLTQuNDc3IDEwLTEwYzAtLjQ2My0uNjk0LS41NC0uOTMzLS4xNDNhNi41IDYuNSAwIDEgMS04LjkyNC04LjkyNEMxMi41NCAyLjY5MyAxMi40NjMgMiAxMiAyQzYuNDc3IDIgMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEwIi8+PC9zdmc+';

  const STYLES = {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '9999',
      opacity: '0.7',
      transition: 'opacity 0.3s ease',
    },
    containerHover: {
      opacity: '1',
    },
    containerNormal: {
      opacity: '0.7',
    },
    button: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: '#000',
      cursor: 'pointer',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      width: '24px',
      height: '24px',
    },
  };

  function setStyles(el, styles) {
    Object.assign(el.style, styles);
  }

  function setHover(el, hoverStyles, normalStyles = {}) {
    el.addEventListener('mouseover', function () {
      setStyles(this, hoverStyles);
    });
    el.addEventListener('mouseout', function () {
      setStyles(this, normalStyles);
    });
  }

  function createEl(tag, styles = {}, props = {}) {
    const el = document.createElement(tag);
    setStyles(el, styles);
    Object.assign(el, props);
    return el;
  }

  let isReverseColorMode = readState(localStorage);
  let reverseColorModeStyle = null;
  let toggleButtonElement = null;

  function init() {
    GM_registerMenuCommand('切换', toggleReverseColorMode);

    createToggleButton();
    updateToggleButton();

    if (isReverseColorMode) {
      applyReverseColorMode();
    }
  }

  function createToggleButton() {
    const buttonContainer = createEl('div', STYLES.container, {
      id: TOGGLE_CONTAINER_ID,
    });

    const icon = createEl('img', STYLES.icon, {
      src: ICON_SUN_DATA_URI,
      alt: 'sun',
    });

    const toggleButton = createEl('button', STYLES.button, {
      id: '11ze-reverse-color-mode-toggle-button',
    });
    toggleButton.appendChild(icon);

    setHover(buttonContainer, STYLES.containerHover, STYLES.containerNormal);
    toggleButton.addEventListener('click', toggleReverseColorMode);

    buttonContainer.appendChild(toggleButton);
    document.body.appendChild(buttonContainer);

    toggleButtonElement = toggleButton;
  }

  function updateToggleButton() {
    if (!toggleButtonElement) {
      return;
    }

    toggleButtonElement.style.display = isReverseColorMode ? 'flex' : 'none';
  }

  function toggleReverseColorMode() {
    const nextMode = !isReverseColorMode;

    // 写入失败（配额/禁用）时短路，内存态、存储态、视觉态保持一致
    if (!writeState(localStorage, nextMode)) return;

    isReverseColorMode = nextMode;

    updateToggleButton();

    if (isReverseColorMode) {
      applyReverseColorMode();
    } else {
      removeReverseColorMode();
    }
  }

  function applyReverseColorMode() {
    if (reverseColorModeStyle) return;

    reverseColorModeStyle = GM_addStyle(buildReverseColorCss());
  }

  function removeReverseColorMode() {
    if (reverseColorModeStyle) {
      reverseColorModeStyle.remove();
      reverseColorModeStyle = null;
    }
  }

  // 测试钩子：浏览器中 __COLOR_MODE_SWITCH_TEST__ 不存在，此分支永不执行
  if (window.__COLOR_MODE_SWITCH_TEST__) {
    window.__COLOR_MODE_SWITCH_TEST__.hooks = {
      readState,
      writeState,
      buildReverseColorCss,
      STORAGE_KEY,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
