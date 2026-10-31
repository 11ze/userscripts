// ==UserScript==
// @name         搜索动漫
// @namespace    https://github.com/11ze
// @version      0.6.21
// @description 2026-10-31 统一采用紧凑图标按钮，加入用途提示和键盘焦点样式；2026-10-29 聚合搜索按钮的 emoji 换成 #0069ad 内联 SVG 放大镜图标，各平台渲染一致；2026-10-25 标题 encodeURIComponent 后拼搜索 URL——含 & / # 的标题不再截断查询串；站点标题选择器收进装配表条目，加站只改一处；2026-10-14 站点→按钮工厂序列收拢为装配表——加站/加按钮不再改主循环控制流；buildDetailHref 收进 AGE 条目，不再依赖其他站路径判定恰好排除 /play/
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
   * 收集元素内文本，跳过 button 子树：自挂按钮不进标题，也不用正则剥字（防误剥标题原文）
   * nodeType 用字面量（1 元素、3 文本），测试 vm 沙箱里没有 Node 常量
   */
  function collectText(node) {
    let text = '';
    for (const child of node.childNodes) {
      if (child.nodeType === 1) {
        if (child.tagName.toUpperCase() === 'BUTTON') {
          continue;
        }
        text += collectText(child);
      } else if (child.nodeType === 3) {
        text += child.textContent;
      }
    }
    return text;
  }

  /**
   * 标题提取：span 优先回退元素文本（跳过按钮子树），做译名去重
   */
  function extractTitle(hDom) {
    let text = '';

    const span = hDom.querySelector('span');
    if (span) {
      text = span.textContent;
    }

    if (!text) {
      text = collectText(hDom);
    }

    return uniqueText(text);
  }

  const COLORS = {
    buttonBg: '#ffffff',
    buttonBorder: '#e1e5e9',
    buttonText: '#495057',
    buttonHoverBg: '#f0f4f7',
    buttonHoverBorder: '#b7c5cf',
    shadowRest: 'none',
    shadowHover: 'none',
    focus: '#0069ad',
    tooltipBg: '#292d32',
    tooltipText: '#ffffff',
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

  const targetWeb = 'https://so.wangze.tech?q=';

  const douban = 'https://www.douban.com/search?q=';

  const doubanFavicon = 'https://www.douban.com/favicon.ico';

  // 聚合搜索按钮图标：内联 SVG 放大镜，颜色不受 button 文字色影响，也不依赖 emoji 字体
  const searchIcon =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22' +
    ' viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%230069ad%22' +
    ' stroke-width=%221.5%22 stroke-linecap=%22round%22%3E' +
    '%3Ccircle cx=%226%22 cy=%226%22 r=%224.3%22/%3E' +
    '%3Cpath d=%22M10.2%2010.2%2014.2%2014.2%22/%3E%3C/svg%3E';

  // 按钮字号即图标边长：图标钮与文字钮同高的依据，单源防失配
  const fontSize = '14px';

  const BUTTON_STYLES = {
    margin: '12px 6px 0 0',
    padding: '0 8px',
    height: '30px',
    minWidth: '30px',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${COLORS.buttonBorder}`,
    borderRadius: '5px',
    background: COLORS.buttonBg,
    color: COLORS.buttonText,
    fontSize,
    fontWeight: '500',
    lineHeight: '1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
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

  const ICON_STYLES = {
    width: fontSize,
    height: fontSize,
  };

  /**
   * 图标渲染：favicon 或内联 SVG 的 img，alt 留空使加载失败显示空白
   */
  function createFaviconImg(src) {
    return createEl('img', ICON_STYLES, { src, alt: '' });
  }

  /**
   * 按钮渲染：内容为文字或 favicon img，统一挂 hover 与点击回调
   */
  function createButton(content, onClick, label) {
    const button = createEl('button', BUTTON_STYLES, {
      type: 'button',
      className: 'anime-search-button',
      ariaLabel: label,
    });
    if (typeof content === 'string') {
      button.textContent = content;
    } else {
      button.appendChild(content);
    }
    setHover(button, BUTTON_HOVER_STYLES, BUTTON_NORMAL_STYLES);
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * 按钮渲染：一对跨站搜索按钮（聚合搜索 SVG 图标 / 豆瓣 favicon），点击新标签页打开 target + title
   */
  function createSearchButton(content, target, title, label) {
    return createButton(content, function () {
      // 标题编码后拼 URL：& / # 未编码会被解析为参数分隔符或 fragment，截断查询串
      window.open(target + encodeURIComponent(title), '_blank');
    }, label);
  }

  /**
   * 按钮渲染：一对跨站搜索按钮（聚合搜索 SVG 图标 / 豆瓣 favicon）
   */
  function createButtonPair(title) {
    return [
      createSearchButton(createFaviconImg(searchIcon), targetWeb, title, '聚合搜索'),
      createSearchButton(createFaviconImg(doubanFavicon), douban, title, '豆瓣搜索'),
    ];
  }

  /**
   * 详情页跳转：play 页 pathname 提取番剧 id，拼站内 detail 地址；非 play 页返回 null
   */
  function buildDetailHref(pathname, origin) {
    const match = pathname.match(/^\/play\/([^/]+)/);
    return match ? `${origin}/detail/${match[1]}` : null;
  }

  /**
   * 按钮渲染：「详情」跳转按钮，点击新标签页打开
   */
  function createDetailButton(href) {
    return createButton('详情', function () {
      window.open(href, '_blank');
    }, '打开番剧详情');
  }

  /**
   * 按钮渲染：AGE 站内搜索按钮，图标取当前镜像域 favicon，搜索地址随域自适应
   */
  function createAgeSearchButton(origin, title) {
    return createSearchButton(
      createFaviconImg(`${origin}/favicon.ico`),
      `${origin}/search?query=`,
      title,
      'AGE 站内搜索',
    );
  }

  // 站点 → 标题选择器 + 按钮工厂序列 + 站点级样式：加站/加按钮改这张表，主循环不动。
  // buildDetailHref 只对 AGE 的 /play/ 有意义，收在 age 条目内——
  // 不再依赖其他站点的路径判定恰好排除 /play/ 前缀
  const SITE_SETUP = {
    age: {
      selectors: [
        'div.body_content_wrapper h2', // 动漫介绍页
        'div.body_content_wrapper h5', // 视频播放页
        '#content > h1', // AGE3
      ],
      buildButtons(title) {
        const buttons = [
          ...createButtonPair(title),
          createAgeSearchButton(location.origin, title),
        ];
        const detailHref = buildDetailHref(location.pathname, location.origin);
        if (detailHref) {
          buttons.push(createDetailButton(detailHref));
        }
        return buttons;
      },
      css: `
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
      `,
    },
    douban: {
      selectors: ['h1 > span:nth-child(1)'],
      buildButtons: createButtonPair,
    },
    bilibili: {
      selectors: ["a[class*='mediainfo_mediaTitle']"],
      buildButtons: createButtonPair,
    },
  };

  GM_addStyle(`
    .anime-search-button:focus-visible {
      outline: 2px solid ${COLORS.focus};
      outline-offset: 3px;
    }
    .anime-search-button::after {
      content: attr(aria-label);
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      padding: 6px 8px;
      border-radius: 4px;
      background: ${COLORS.tooltipBg};
      color: ${COLORS.tooltipText};
      font: 11px/1.4 sans-serif;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      z-index: 2147483647;
    }
    .anime-search-button:hover::after,
    .anime-search-button:focus-visible::after {
      opacity: 1;
    }
    :has(> .anime-search-button:focus-visible) > .anime-search-button:hover:not(:focus-visible)::after {
      opacity: 0;
    }
  `);

  const setup = SITE_SETUP[site];
  if (setup.css) {
    GM_addStyle(setup.css);
  }

  for (const selector of setup.selectors) {
    const hDom = document.querySelector(selector);
    if (!hDom) {
      continue;
    }

    const title = extractTitle(hDom);
    // 统一在标题下方显示操作，解除站点标题的截断，保证按钮与提示可见。
    setStyles(hDom, { display: 'block', overflow: 'visible', maxHeight: 'none' });
    hDom.appendChild(document.createElement('br'));
    for (const button of setup.buildButtons(title)) {
      hDom.appendChild(button);
    }
    break;
  }

  // 测试钩子：浏览器中 __ANIME_SEARCH_TEST__ 不存在，此分支永不执行
  if (window.__ANIME_SEARCH_TEST__) {
    window.__ANIME_SEARCH_TEST__.hooks = {
      detectSite,
      extractTitle,
      uniqueText,
      createButtonPair,
      buildDetailHref,
      createDetailButton,
      createAgeSearchButton,
      SITE_SETUP,
    };
  }
})();
