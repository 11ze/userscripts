// ==UserScript==
// @name         亮暗色切换
// @namespace    https://github.com/11ze
// @version      0.1.2
// @description  2026-10-15 @icon 回退 currentColor 修面板不可见；按钮黑底白月配反转后亮页，图标内联重置站点边框防方框
// @author       11ze
// @match        *://*/*
// @run-at       document-start
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

      /* 容器已带二次反转，容器内 img 再被上面的媒体规则命中会叠成三层（奇数）反转，白色图标变黑底黑字 */
      [id='${TOGGLE_CONTAINER_ID}'] img {
        filter: none !important;
      }

      [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      /* 逃生舱仅此类名：data-theme 之类的属性选择器特异性高于 html，会反杀整页反转；
         且 filter:none 无法让子树脱离反转，本就只对媒体二次反转有效 */
      .reverse-color-mode-ignore {
        filter: none !important;
      }
    `;
  }

  // 与 @icon 分家：按钮底 #000 需白月（img 独立文档 currentColor 回落黑，黑底不可见）；
  // @icon 底是油猴浅色面板需 currentColor（回落黑）。两份 base64 人肉同步，
  // 形状一致性（剥 fill 后逐字节一致）由测试锁定，改月亮路径须两处同改
  const ICON_SUN_DATA_URI =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTIgMjJjNS41MjMgMCAxMC00LjQ3NyAxMC0xMGMwLS40NjMtLjY5NC0uNTQtLjkzMy0uMTQzYTYuNSA2LjUgMCAxIDEtOC45MjQtOC45MjRDMTIuNTQgMi42OTMgMTIuNDYzIDIgMTIgMkM2LjQ3NyAyIDIgNi40NzcgMiAxMnM0LjQ3NyAxMCAxMCAxMCIvPjwvc3ZnPg==';

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
      // 按钮只在反转开启时显示，主场景暗转亮——反转后的亮页上黑底白月对比度最高，无需阴影补偿
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
      // 站点全局 img 样式会命中此图标打出方框，四项内联重置挡住
      border: 'none',
      outline: 'none',
      padding: '0',
      background: 'none',
    },
  };

  function setStyles(el, styles) {
    Object.assign(el.style, styles);
  }

  function setHover(el, hoverStyles, normalStyles = {}) {
    // mouseenter/mouseleave 不冒泡；mouseover/mouseout 会在容器与子按钮间连击导致透明度抖动
    el.addEventListener('mouseenter', function () {
      setStyles(this, hoverStyles);
    });
    el.addEventListener('mouseleave', function () {
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

  /**
   * document-start 即执行：早注反转样式防加载期闪白，此时 body 未就绪不碰按钮
   */
  function init() {
    GM_registerMenuCommand('切换', toggleReverseColorMode);

    if (isReverseColorMode) {
      applyReverseColorMode();
    }
  }

  function mountToggleButton() {
    createToggleButton();
    updateToggleButton();
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
      ICON_SUN_DATA_URI,
      STORAGE_KEY,
    };
  }

  init();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggleButton);
  } else {
    mountToggleButton();
  }
})();
