// ==UserScript==
// @name            Jump to Top or Bottom
// @namespace       https://github.com/11ze
// @author          11ze
// @description     为所有网页增加可立即跳转至最大的可滚动区域顶部和底部的按钮
// @version         0.0.14
// @icon            data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAALVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////BHg4sAAAADXRSTlMAK1RVW1x3f4CI+vv8UJ/ShgAAAAFiS0dEDm+9ME8AAABqSURBVCjPY2CgHuCYgCbQexNNwe29DagKjmijKOG448C0dwKKAgYGZCVABQwMyErYjoBIrQKEEgEQwchAb4BuLQfYYdpILoU4HcmluSDPXUcyg+1OADOyAqCSo9bX8QchQ+519GhooKK3APJHHdKCOOK5AAAAAElFTkSuQmCC
// @match           *
// @include         *
// @grant           none
// @license         MIT
// @downloadURL     https://fastly.jsdelivr.net/gh/11ze/userscripts@main/src/jump_bottom.js
// @updateURL       https://fastly.jsdelivr.net/gh/11ze/userscripts@main/src/jump_bottom.js
// ==/UserScript==

/* ************************ 页面效果 ************************ */

// const buttonColor = '241,148,138,0.500'; // 红色
const buttonColor = '247,220,111,0.667'; // 奶黄

const topImage =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAAe0lEQVRYhe2QOwqAMBAFB0/jXazEwutYehsrz+aviE3SCH4SdQV5A9sEsjMsCCGEuEcDtF/KnR/ziCCf/Tj/Zi4vgQIYMbrEVh4widiTm0ScyV+NuCp/JSJW/mhEqjwqIjtYMAALUANdQkAPVMDkdyWRp358eIcQQvyYFerfNk+Wc2XSAAAAAElFTkSuQmCC';
const downImage =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAAlUlEQVRYhe3QMRLBUBRA0YMxtmIvqajsRCk6W1FYhMKamIyZKCQzmoT8SBTerf979/5HEARB0M7ylztyFFj1kGe44dD0YNoyfMUcx8SIDCcsql1JbFHijk2HubXn9UrsUuWpEV+Vd40YRP5pxKDydxGjyJsiRpXX5JWweJHnY8lr6kv0+vmsR8AFE5yx77EnCILgz3kAzr4zPi4gwh0AAAAASUVORK5CYII=';

const sameCssText = `opacity:0.3;
                -moz-transition-duration:0.2s;
                -webkit-transition-duration:0.2s;
                border-radius:5px 5px 5px 5px;
                cursor:pointer;
                position:fixed;
                width:40px;
                height:40px;
                right:0px;
                z-index:9999;`;

function createTopButton() {
  const cssText = `${sameCssText}
                  background:url("data:image/png;base64,${topImage}")
                  no-repeat scroll 50% 50% rgba(${buttonColor});
                  bottom:50%`;
  createButton(cssText, true);
}
if (self == top) createTopButton();

function createBottomButton() {
  const cssText = `${sameCssText}
                  background:url("data:image/png;base64,${downImage}")
                  no-repeat scroll 50% 50% rgba(${buttonColor});
                  top:51%`;
  createButton(cssText, false);
}
if (self == top) createBottomButton();

function createButton(cssText, isTop) {
  const button = document.createElement('span');
  button.style.cssText = cssText;
  button.addEventListener(
    'mouseover',
    function () {
      button.style.opacity = 0.8;
    },
    false
  );
  button.addEventListener(
    'mouseout',
    function () {
      button.style.opacity = 0.2;
    },
    false
  );
  button.addEventListener(
    'click',
    function () {
      if (window.scrollHeight) {
        window.scrollTo(0, isTop ? 0 : document.body.scrollHeight);
        return;
      }

      const target = getTarget();
      if (target) {
        target.scrollIntoView({ block: isTop ? 'start' : 'end' });
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
  if (iframe) {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    const mailText = iframeDocument.getElementById('qqmail_mailcontainer');
    if (mailText) {
      return mailText;
    }
  }
}

function runScrollableElements(isTop) {
  const elements = document.querySelectorAll('*');
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
