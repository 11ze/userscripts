// ==UserScript==
// @name            Jump to Top or Bottom
// @namespace       https://github.com/11ze
// @author          11ze
// @description     2026-11-25 修复页面含跨域 mainFrame 时回顶和回底按钮失效
// @version         0.0.19
// @icon            data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAALVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////BHg4sAAAADXRSTlMAK1RVW1x3f4CI+vv8UJ/ShgAAAAFiS0dEDm+9ME8AAABqSURBVCjPY2CgHuCYgCbQexNNwe29DagKjmijKOG448C0dwKKAgYGZCVABQwMyErYjoBIrQKEEgEQwchAb4BuLQfYYdpILoU4HcmluSDPXUcyg+1OADOyAqCSo9bX8QchQ+519GhooKK3APJHHdKCOOK5AAAAAElFTkSuQmCC
// @match           *
// @include         *
// @grant           none
// @license         MIT
// ==/UserScript==

(function () {
  'use strict';

  // ==================== 页面效果 ====================

  const STYLE_ID = '11ze-jump-button-style';

  const topImage =
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAAe0lEQVRYhe2QOwqAMBAFB0/jXazEwutYehsrz+aviE3SCH4SdQV5A9sEsjMsCCGEuEcDtF/KnR/ziCCf/Tj/Zi4vgQIYMbrEVh4widiTm0ScyV+NuCp/JSJW/mhEqjwqIjtYMAALUANdQkAPVMDkdyWRp358eIcQQvyYFerfNk+Wc2XSAAAAAElFTkSuQmCC';
  const downImage =
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAAlUlEQVRYhe3QMRLBUBRA0YMxtmIvqajsRCk6W1FYhMKamIyZKCQzmoT8SBTerf979/5HEARB0M7ylztyFFj1kGe44dD0YNoyfMUcx8SIDCcsql1JbFHijk2HubXn9UrsUuWpEV+Vd40YRP5pxKDydxGjyJsiRpXX5JWweJHnY8lr6kv0+vmsR8AFE5yx77EnCILgz3kAzr4zPi4gwh0AAAAASUVORK5CYII=';

  // 两个按钮在 50% 处相接：固定像素缝会随视口高度变形，百分比缝又会露出页面
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .jb-11ze-btn {
        position: fixed;
        right: 8px;
        z-index: 9999;
        box-sizing: border-box;
        width: 40px;
        height: 40px;
        padding: 0;
        border: 1px solid rgba(24, 24, 27, 0.12);
        border-radius: 10px;
        background-color: rgba(247, 220, 111, 0.667);
        background-repeat: no-repeat;
        background-position: 50% 50%;
        background-size: 20px 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        cursor: pointer;
        opacity: 0.55;
        transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      }
      .jb-11ze-btn:hover,
      .jb-11ze-btn:focus-visible,
      .jb-11ze-btn:active { opacity: 1; }
      .jb-11ze-btn:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18); }
      .jb-11ze-btn:focus-visible { outline: 2px solid #18181b; outline-offset: 2px; }
      .jb-11ze-btn:active { transform: scale(0.94); }
      .jb-11ze-top {
        bottom: 50%;
        background-image: url("data:image/png;base64,${topImage}");
      }
      .jb-11ze-bottom {
        top: 50%;
        background-image: url("data:image/png;base64,${downImage}");
      }
    `;
    document.head.appendChild(style);
  }

  if (self == top) {
    injectStyles();
    createButton(true);
    createButton(false);
  }

  function createButton(isTop) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `jb-11ze-btn ${isTop ? 'jb-11ze-top' : 'jb-11ze-bottom'}`;
    button.setAttribute('aria-label', isTop ? '回到顶部' : '回到底部');
    button.addEventListener(
      'click',
      function () {
        // 三段式滚动：QQ 邮箱特例 → window 直滚 → 常见滚动容器兜底。
        // QQ 特例最特化须最先：外层文档可滚时 window 直滚会抢走 iframe 邮件内容的滚动。
        // scrollHeight 是 Element 属性，window 上不存在，须以文档高度判定
        const target = getTarget();
        if (target) {
          target.scrollIntoView({ block: isTop ? 'start' : 'end' });
          return;
        }

        if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
          window.scrollTo(0, isTop ? 0 : document.documentElement.scrollHeight);
          return;
        }

        runScrollableElements(isTop);
      },
      false
    );
    document.body.appendChild(button);
  }

  function getTarget() {
    // QQ 邮箱邮件详情 https://mail.qq.com/cgi-bin/frame_html
    const iframe = document.getElementById('mainFrame');
    return iframe?.contentDocument?.getElementById('qqmail_mailcontainer');
  }

  function runScrollableElements(isTop) {
    // 只检查常见的滚动容器,避免选择所有元素
    const scrollableSelectors = [
      'div[style*="overflow"]',
      '[class*="scroll"]',
      '[id*="scroll"]',
      'main',
      '[role="main"]',
      '.content',
      '.container',
      '.scrollable',
      'article',
      'section',
      '.list',
      '.table',
      '[class*="list"]',
    ];
    const elements = document.querySelectorAll(scrollableSelectors.join(','));

    for (const e of elements) {
      if (
        e.scrollHeight > e.clientHeight &&
        e.scrollHeight > 300 &&
        e.scrollWidth > 300 &&
        !e.innerHTML.includes('<html')
      ) {
        if (isTop) {
          e.scrollTo(0, 0);
        } else {
          e.scrollTo(0, e.scrollHeight);
        }
      }
    }
  }
})();
