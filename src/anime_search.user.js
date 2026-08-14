// ==UserScript==
// @name         搜索动漫
// @namespace    https://github.com/11ze
// @version      0.6.12
// @description  2026-08-14
// @author       11ze
// @match        *://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItc2VhcmNoIj48Y2lyY2xlIGN4PSIxMSIgY3k9IjExIiByPSI4Ij48L2NpcmNsZT48cGF0aCBkPSJtMjEgMjEtNC4zNS00LjM1Ij48L3BhdGg+PC9zdmc+
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  /**
   * 站点判定：hostname + pathname 推出所属站点，query 不参与判定
   */
  function detectSite(href) {
    let url;
    try {
      url = new URL(href);
    } catch {
      return null;
    }
    const host = url.hostname;
    const path = url.pathname;
    if (host.includes('agedm') || host.includes('agefans')) {
      return 'age';
    }
    if (host === 'douban.com' || host.endsWith('.douban.com')) {
      if (path.startsWith('/subject') || path.startsWith('/game')) {
        return 'douban';
      }
    }
    if (host === 'bilibili.com' || host.endsWith('.bilibili.com')) {
      if (path.startsWith('/bangumi/play')) {
        return 'bilibili';
      }
    }
    return null;
  }

  const site = detectSite(window.location.href);
  if (!site) {
    return;
  }

  console.log('11ze：运行 anime_search');

  /**
   * 豆瓣匹配出来的文字是原名称和译名，只要一个名称，用此方法去重
   */
  function uniqueText(text) {
    const textArray = text.trim().split(' ');
    if (textArray.length === 1) {
      return textArray[0];
    }

    const startText = textArray[0].slice(0, 1);
    let endIndex = textArray.length - 1;

    for (let i = 1; i < textArray.length; i++) {
      const currentText = textArray[i];
      if (currentText.slice(0, 1) === startText) {
        endIndex = i - 1;
        break;
      }
    }

    const resultArray = textArray.slice(0, endIndex + 1);
    return resultArray.join(' ');
  }

  /**
   * 标题提取：span 优先回退元素文本，做译名去重
   */
  function extractTitle(hDom) {
    let text = '';

    const span = hDom.querySelector('span');
    if (span) {
      console.log('span：' + span.textContent);
      text = span.textContent;
    }

    if (!text) {
      console.log('h：' + hDom.textContent);
      text = hDom.textContent;
    }

    // 剥离自挂按钮的 🔍🏆，防止重跑时把按钮文字读进标题
    return uniqueText(text.replace(/🔍|🏆/g, ''));
  }

  const COLORS = {
    buttonBg: '#ffffff',
    buttonBorder: '#e1e5e9',
    buttonText: '#495057',
    buttonHoverBg: '#f8f9fa',
    buttonHoverBorder: '#ced4da',
    shadowRest: '0 1px 2px rgba(0,0,0,0.05)',
    shadowHover: '0 2px 4px rgba(0,0,0,0.08)',
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

  // const targetWeb = 'http://localhost:9060/search?&type=video&url=box=';
  const targetWeb = 'https://so.wangze.tech?q=';

  const douban = 'https://www.douban.com/search?q=';

  const BUTTON_STYLES = {
    marginLeft: '6px',
    padding: '6px 10px',
    border: `1px solid ${COLORS.buttonBorder}`,
    borderRadius: '6px',
    background: COLORS.buttonBg,
    color: COLORS.buttonText,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: COLORS.shadowRest,
  };

  const BUTTON_HOVER_STYLES = {
    backgroundColor: COLORS.buttonHoverBg,
    borderColor: COLORS.buttonHoverBorder,
    boxShadow: COLORS.shadowHover,
  };

  const BUTTON_NORMAL_STYLES = {
    backgroundColor: COLORS.buttonBg,
    borderColor: COLORS.buttonBorder,
    boxShadow: COLORS.shadowRest,
  };

  /**
   * 按钮渲染：一对跨站搜索按钮（🔍 聚合搜索 / 🏆 豆瓣）
   */
  function createButtonPair(title) {
    return [
      ['🔍', targetWeb],
      ['🏆', douban],
    ].map(([buttonName, target]) => {
      const button = createEl('button', BUTTON_STYLES, { textContent: buttonName });
      setHover(button, BUTTON_HOVER_STYLES, BUTTON_NORMAL_STYLES);
      button.addEventListener('click', function () {
        window.open(target + title, '_blank');
      });
      return button;
    });
  }

  const list = [
    {
      dom: 'div.body_content_wrapper h2',
      name: 'AGE 动漫介绍页',
    },
    {
      dom: 'div.body_content_wrapper h5',
      name: 'AGE 视频播放页',
    },
    {
      dom: '#content > h1',
      name: 'AGE3',
    },
    {
      dom: 'h1 > span:nth-child(1)',
      name: '豆瓣',
    },
    {
      dom: "a[class*='mediainfo_mediaTitle']",
      name: '哔哩哔哩看番',
    },
  ];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const hDom = document.querySelector(item.dom);
    if (!hDom) {
      continue;
    }

    const title = extractTitle(hDom);
    for (const button of createButtonPair(title)) {
      hDom.appendChild(button);
    }
    break;
  }

  if (site === 'age') {
    const css = `
      .comment-box-cover,
      .comment-function-wrapper,
      .comment_textarea,
      .comment-content-wrapper {
        display: none !important;
      }

      /* 屏蔽全局通知弹窗 */
      .global_notice_wrapper {
        display: none !important;
      }
    `;
    GM_addStyle(css);
  }

  if (window.__ANIME_SEARCH_TEST__) {
    window.__ANIME_SEARCH_TEST__.hooks = { detectSite, extractTitle, uniqueText, createButtonPair };
  }
})();
