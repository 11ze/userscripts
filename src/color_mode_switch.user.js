// ==UserScript==
// @name         亮暗色切换
// @namespace    https://github.com/11ze
// @version      0.1.5
// @description  2026-10-31 对比度调整为 0.95，修复全屏视频偏色与固定黑白 SVG 隐身，保留站点原有媒体滤镜
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
  const PAGE_FILTER = 'invert(1) hue-rotate(180deg) contrast(0.95)';
  // 逆序补偿页面滤镜；极端高光与阴影受色域裁切限制，无法完全恢复。
  const MEDIA_FILTER = 'contrast(1.0526315789473684) hue-rotate(180deg) invert(1)';
  const MEDIA_SELECTOR = 'img, video, iframe, canvas, svg';
  const ORIGINAL_FILTER_PROPERTY = '--11ze-original-filter';

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
        filter: ${PAGE_FILTER} !important;
      }

      img, video, iframe, canvas, svg,
      [id='${TOGGLE_CONTAINER_ID}'] {
        filter: var(--11ze-original-filter, ) ${MEDIA_FILTER} !important;
      }

      /* 容器已带二次反转，容器内 img 再被上面的媒体规则命中会叠成三层（奇数）反转，白色图标变黑底黑字 */
      [id='${TOGGLE_CONTAINER_ID}'] img {
        filter: var(--11ze-original-filter, none) !important;
      }

      /* 单色 SVG 随文字变色；用计算后的颜色识别固定黑白和 currentColor */
      svg[data-11ze-monochrome] {
        filter: var(--11ze-original-filter, none) !important;
      }

      /* 嵌套 SVG 共享最外层的处理，不能逐层叠加滤镜 */
      svg svg {
        filter: var(--11ze-original-filter, none) !important;
      }

      /* 逃生舱仅此类名：data-theme 之类的属性选择器特异性高于 html，会反杀整页反转；
         且 filter:none 无法让子树脱离反转，本就只对媒体二次反转有效 */
      .reverse-color-mode-ignore {
        filter: var(--11ze-original-filter, none) !important;
      }

      /* 全屏内容进入顶层后不再受 html 滤镜影响，只保留站点原有滤镜 */
      :fullscreen,
      :fullscreen :is(img, video, iframe, canvas, svg),
      :fullscreen [id='${TOGGLE_CONTAINER_ID}'] {
        filter: var(--11ze-original-filter, none) !important;
      }
    `;
  }

  // 与 @icon 分家：按钮底 #000 需白月（img 独立文档 currentColor 回落黑，黑底不可见）；
  // @icon 底是油猴浅色面板需 currentColor（回落黑）。两份 base64 人肉同步，
  // 形状一致性（剥 fill 后逐字节一致）由测试锁定，改月亮路径须两处同改
  const ICON_SUN_DATA_URI =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTIgMjJjNS41MjMgMCAxMC00LjQ3NyAxMC0xMGMwLS40NjMtLjY5NC0uNTQtLjkzMy0uMTQzYTYuNSA2LjUgMCAxIDEtOC45MjQtOC45MjRDMTIuNTQgMi42OTMgMTIuNDYzIDIgMTIgMkM2LjQ3NyAyIDIgNi40NzcgMiAxMnM0LjQ3NyAxMCAxMCAxMCIvPjwvc3ZnPg==';

  // 定稿「墨盘」（designs/color-mode-switch/ 方向 A，2026-10-31）：
  // 黑底发丝描边补暗页隐身（黑底唯一隐身场景是反转后暗页——亮站转暗，罕用），
  // hover 三联动（上浮/描边亮/浮字），常态全不透明（0.7 会把描边压没）
  const STYLES = {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '9999',
    },
    button: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '1px solid rgba(255, 255, 255, 0.22)',
      // 按钮只在反转开启时显示，主场景暗转亮——反转后的亮页上黑底白月对比度最高
      backgroundColor: '#000',
      // 描边只保暗页下限，阴影保反转后亮页上不悬空；描边 hover 变亮是主反馈
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.28)',
      cursor: 'pointer',
      // tooltip 的定位锚点（挂 button 内：display:none 级联隐藏、随按钮位移）
      position: 'relative',
      // 站点全局 button/overflow 样式会裁掉探出按钮左侧的 tooltip
      overflow: 'visible',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      borderColor: 'rgba(255, 255, 255, 0.55)',
      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.32)',
    },
    buttonNormal: {
      transform: 'none',
      borderColor: 'rgba(255, 255, 255, 0.22)',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.28)',
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
    tooltip: {
      // 挂 button 内：关闭态 display:none 级联隐藏，无需单独同步显隐
      position: 'absolute',
      top: '50%',
      right: 'calc(100% + 10px)',
      transform: 'translateY(-50%) translateX(4px)',
      // 暗页上黑底气泡无描边则边界不可见，与按钮描边同理
      background: 'rgba(20, 20, 20, 0.92)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      color: '#fff',
      fontSize: '12px',
      lineHeight: '1',
      padding: '7px 9px',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
      opacity: '0',
      // 不参与 hover：鼠标扫过 tooltip 不算离开容器，防连击抖动
      pointerEvents: 'none',
      transition: 'opacity 0.16s ease, transform 0.16s ease',
    },
    tooltipHover: {
      opacity: '1',
      transform: 'translateY(-50%) translateX(0)',
    },
    tooltipNormal: {
      opacity: '0',
      transform: 'translateY(-50%) translateX(4px)',
    },
  };

  function setStyles(el, styles) {
    Object.assign(el.style, styles);
  }

  function setHover(el, applyHover) {
    // mouseenter/mouseleave 不冒泡；mouseover/mouseout 会在容器与子按钮间连击导致样式抖动
    el.addEventListener('mouseenter', function () {
      applyHover(true);
    });
    el.addEventListener('mouseleave', function () {
      applyHover(false);
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
  let mediaObserver = null;
  const mediaStyles = new Map();

  function isMonochromeSvg(svg) {
    // 图片、外部符号和渐变不能从当前绘制色判断，保留媒体处理。
    if (svg.querySelector('image, foreignObject, use')) return false;
    const shapes = [svg, ...svg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text')];
    return shapes.every(function (shape) {
      const style = getComputedStyle(shape);
      return [style.fill, style.stroke].every(function (paint) {
        if (paint === 'none' || paint === 'transparent') return true;
        const match = paint.match(/^rgba?\(([^)]+)\)$/);
        if (!match) return false;
        const channels = match[1].split(/[,\s/]+/).map(Number);
        return channels[3] === 0 || (channels[0] === channels[1] && channels[1] === channels[2]);
      });
    });
  }

  function updateMediaStyles(root) {
    const elements = new Set(root.querySelectorAll(MEDIA_SELECTOR));
    if (root === document && document.fullscreenElement) elements.add(document.fullscreenElement);
    if (root.nodeType === 1 && (root.matches(MEDIA_SELECTOR) || root === document.fullscreenElement)) {
      elements.add(root);
    }
    for (let svg = root.closest?.('svg'); svg; svg = svg.parentElement?.closest('svg')) elements.add(svg);
    if (!elements.size) return;

    // 同步读取期间停用脚本样式，避免把自己的补偿重新采集为站点滤镜。
    const disabled = reverseColorModeStyle.disabled;
    reverseColorModeStyle.disabled = true;
    try {
      const originals = [];
      for (const element of elements) {
        if (!element.isConnected) continue;
        const previous = mediaStyles.get(element);
        let inlineFilter = element.style.getPropertyValue('filter');
        let priority = element.style.getPropertyPriority('filter');
        if (previous?.appliedFilter && inlineFilter === previous.appliedFilter && priority === 'important') {
          inlineFilter = previous.inlineFilter;
          priority = previous.priority;
          element.style.setProperty('filter', inlineFilter, priority);
        }
        originals.push({ element, inlineFilter, priority });
      }
      // 先读取整批原值，防止 filter:inherit 读到父媒体刚挂上的补偿。
      const captured = originals.map(function (original) {
        const { element } = original;
        return { ...original, filter: getComputedStyle(element).filter,
          monochrome: element.matches('svg') && isMonochromeSvg(element) };
      });
      for (const { element, inlineFilter, priority, filter, monochrome } of captured) {
        // initial 阻止私有属性从外层媒体继承，none 又不能与滤镜函数拼接。
        element.style.setProperty(ORIGINAL_FILTER_PROPERTY, filter === 'none' ? 'initial' : filter);
        if (element.matches('svg')) {
          if (monochrome) element.setAttribute('data-11ze-monochrome', '');
          else element.removeAttribute('data-11ze-monochrome');
        }
        // 内联 important 同时覆盖站点样式表中的 important，原值留待关闭时恢复。
        const compensate = element.matches(MEDIA_SELECTOR) && !monochrome &&
          element !== document.fullscreenElement &&
          !element.matches('svg svg, .reverse-color-mode-ignore, :fullscreen *') &&
          !(element.matches('img') && element.closest(`[id='${TOGGLE_CONTAINER_ID}']`));
        const appliedFilter = compensate ? `var(--11ze-original-filter, ) ${MEDIA_FILTER}` : 'var(--11ze-original-filter, none)';
        element.style.setProperty('filter', appliedFilter, 'important');
        mediaStyles.set(element, { lastStyle: element.getAttribute('style'), inlineFilter, priority, appliedFilter });
      }
    } finally {
      reverseColorModeStyle.disabled = disabled;
    }
  }

  function clearMediaStyle(element) {
    const previous = mediaStyles.get(element);
    if (previous.appliedFilter && element.style.getPropertyValue('filter') === previous.appliedFilter &&
        element.style.getPropertyPriority('filter') === 'important') {
      element.style.setProperty('filter', previous.inlineFilter, previous.priority);
    }
    element.style.removeProperty(ORIGINAL_FILTER_PROPERTY);
    element.removeAttribute('data-11ze-monochrome');
    mediaStyles.delete(element);
  }

  function observeMedia() {
    mediaObserver = new MutationObserver(function (records) {
      let changed = false;
      for (const record of records) {
        if (record.type === 'attributes' && record.attributeName === 'style' &&
            mediaStyles.get(record.target)?.lastStyle === record.target.getAttribute('style')) continue;
        changed = true;
      }
      for (const element of mediaStyles.keys()) {
        if (!element.isConnected) clearMediaStyle(element);
      }
      // 样式表删除、兄弟选择器和 :has() 都可能影响目标子树外的媒体。
      if (changed) updateMediaStyles(document);
    });
    mediaObserver.observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'fill', 'stroke', 'color'],
    });
    updateMediaStyles(document);
  }

  /**
   * document-start 即执行：早注反转样式防加载期闪白，此时 body 未就绪不碰按钮
   */
  function init() {
    GM_registerMenuCommand('切换', toggleReverseColorMode);
    document.addEventListener('fullscreenchange', function () {
      if (!reverseColorModeStyle) return;
      for (const element of mediaStyles.keys()) {
        if (!element.matches(MEDIA_SELECTOR) && element !== document.fullscreenElement) clearMediaStyle(element);
      }
      updateMediaStyles(document.fullscreenElement || document);
    });
    // document-start 时外部样式表可能尚未加载，加载后重读站点滤镜。
    document.addEventListener('load', function (event) {
      if (reverseColorModeStyle && event.target.tagName === 'LINK') updateMediaStyles(document);
    }, true);

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

    const tooltip = createEl('span', STYLES.tooltip, {
      textContent: '还原配色',
    });

    const toggleButton = createEl('button', STYLES.button, {
      id: '11ze-reverse-color-mode-toggle-button',
    });
    toggleButton.appendChild(icon);
    toggleButton.appendChild(tooltip);

    // hover 三联动作用于 button 与 tooltip，容器本身无样式变化
    setHover(buttonContainer, function (hovered) {
      setStyles(toggleButton, hovered ? STYLES.buttonHover : STYLES.buttonNormal);
      setStyles(tooltip, hovered ? STYLES.tooltipHover : STYLES.tooltipNormal);
    });
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
    observeMedia();
  }

  function removeReverseColorMode() {
    if (reverseColorModeStyle) {
      mediaObserver.disconnect();
      mediaObserver = null;
      reverseColorModeStyle.remove();
      reverseColorModeStyle = null;
      for (const element of mediaStyles.keys()) clearMediaStyle(element);
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
