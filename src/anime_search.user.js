// ==UserScript==
// @name         搜索动漫
// @namespace    https://github.com/11ze
// @version      0.6.9
// @description  2025-07-01
// @author       11ze
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=agedm.org
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const domainList = [
    'agedm',
    'agefans',
    'douban.com/subject',
    'douban.com/game',
    'bilibili.com/bangumi/play',
  ];

  let inDomain = false;
  if (domainList.some((domain) => window.location.href.includes(domain))) {
    inDomain = true;
  }

  if (!inDomain) {
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

  function addButton(selector, targetWeb, from, buttonName) {
    const hDom = document.querySelector(selector);
    if (!hDom) {
      return;
    }

    console.log(from);

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

    text = text.replace(/🔍|🏆/g, '');

    const button = document.createElement('button');
    button.textContent = buttonName;

    button.addEventListener('click', function () {
      window.open(targetWeb + uniqueText(text), '_blank');
    });
    hDom.appendChild(button);

    return true;
  }

  // const targetWeb = 'http://localhost:9060/search?&type=video&url=box=';
  const targetWeb = 'https://so.wangze.tech?q=';

  const douban = 'https://www.douban.com/search?q=';

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
      dom: '#__next > div > div > div > div > div > div > a',
      name: '哔哩哔哩看番',
    },
  ];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const added = addButton(item.dom, targetWeb, item.name, '🔍');
    addButton(item.dom, douban, item.name, '🏆');
    if (added) {
      break;
    }
  }

  if (window.location.href.includes('age')) {
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
})();
