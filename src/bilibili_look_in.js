// ==UserScript==
// @name         Bilibili 追番追剧默认在看
// @author       11ze
// @description  Bilibili 我的订阅默认显示「在看」的番或剧
// @version      0.0.1
// @icon
// @match        *://space.bilibili.com/*/bangumi
// @match        *://space.bilibili.com/*/cinema
// @grant        none
// @license MIT
// ==/UserScript==

// 筛选：在看
function toLookIn() {
  const dropdownMenu = document.querySelector(
    `.s-space > div > div > div > div.sub-tabs.clearfix > div > div > ul`
  );
  if (!dropdownMenu) {
    return;
  }

  const options = dropdownMenu.getElementsByTagName('li');
  if (options.length < 3) {
    return;
  }
  options[2].click();

  // 收起下拉菜单
  const triggerButton = document.querySelector(
    `.s-space > div > div > div > div.sub-tabs.clearfix > div > div > span > i`
  );
  if (triggerButton) {
    triggerButton.click();
  }
}

// 切换选项卡时选择「在看」
function listenTab() {
  const container = document.querySelector('.s-space');
  if (!container) {
    return;
  }

  container.addEventListener('click', function (event) {
    const target = event.target;
    if (['追番', '追剧'].includes(target.innerHTML.trim())) {
      toLookIn();
    }
  });
}

(function () {
  'use strict';

  // 页面加载完成后执行
  window.addEventListener('load', function () {
    toLookIn();
    listenTab();
  });
})();
