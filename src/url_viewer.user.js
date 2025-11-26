// ==UserScript==
// @name         查看浏览器地址栏信息
// @namespace    https://github.com/11ze
// @version      0.1.7
// @description  2025-07-08
// @author       11ze
// @license      MIT
// @match        *://*/*
// @noframes
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAYAAABXuSs3AAAAAXNSR0IArs4c6QAABB1JREFUaEPtmXtIU1Ecx78uxbJa4SOtNqwwoZZmr1lNScskE7O3RWJNwTLIgqAMEnrTwywtQQ2ZkaGZSmRGQUElZilFYmpaEPkomk6aztTSFueQJ6+P7UbaZtzz187u73fu537P73d/v7NZ6PV6PUbgsBDA//GuCYr/Y8EhKC4ozlMBIVR4CjVkZoLiQyYlz4X+D8UTSkqgbmuDBYBDXl4Ya2XF6/mvl5ejsqmJ2u5asABSsZj55dfU4FlDw6DrWIpEmOfkBIVUCgcbm0HtXqvVyKyooNdP+vpyC9DEs2eh7eykF2v37uUAGHoCeVoaSj9+pCb3t22D/4wZzHxjTg5yq6p4CWA3ZgwOe3tjn6dnP/srL18isqCAfq+PjTUv8B7aQwoFTi1fzoE3Kfj+xYuxWSbjAH3W6fC6sRHni4uhaW9n12K9vXHMx4fNTQqeFhSEcA+PAcOms7sbKzMyUFhbS6+T2G89eBCjLS3p3GzBCdzntjY4xcezB3sUFoZlzs7mD04InRMTUavVUtj0NWuwfe7ckQE+MykJ75qbKey1tWsR6uZm/uAdXV0Yf+YMun78oLDPIyIgnzLF/MGj793DpdJSlpxfDhxgRdCkyXk5IAA7fsVsTwZ+6ehAVVMTThcV4eH79ywx+77LTQrOq3wCkDk4oCQiAja9Wg6zBifv7nN+foiWyyGyIB3T72FScFc7O8y2t+cA3Xn7liXjnkWLkLhq1YAbYxDcPi6Old0ipRJLJRJeuytNSEB9Swu1fRAaihXTpzO/3k3WQJXz6JMnOPL4MUtI0txNHjeu330Ngs9JTkZFYyN1Ou7jQzs1Y6O5vR12cXHMrDIqCrN6qWoM/Ov373CMj4fu2ze6xhaZDJnr1/8ZeFBWFsjWkUFKLSm5xsat6mqsy85mZrqYGE4fbwycOCa/eIGou3fZGmWRkXB3dOQf49mVlQjJzWUOyYGB2Dl//qDsdS0tmJeaysJriUSCp0olx54PeLdeD+nFi/ik01Ffz6lT8Sw8nD84qVgkznsOE8Tzgr8/9sjlGNUny6s1GihUKk4rejskBEGurn8MThzy3rzBhps3mW/B1q1Y7eLC5gZjnFgV19djqUrFuTl5TblNmkST9YNWS1vP3g9HjMPc3XE1OLjf7vBRvMfJPSUF5Wo1nUrEYnyIjmavRaPgxInE+aacHJDegc9QenggJTAQViLRX4EX1dXBKz2drZEUEIDdCxfSOS9wYkh64xOFhUgvK2MZ35fKd9o0xCgUnDNmX5steXm48euQS3aE7Iyh4ZeRwUr/BGtrkH6FDNWrVwjPz6ef+505B1qQ/M9So9GgobUVpK8gsU5O8S62thBbW/PZkGGx+T9+VxkWaYZpUUHxYRJ20GUFxQXFeSoghApPoYbMbMQq/hMMz1ikTVIoJgAAAABJRU5ErkJggg==
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  function parseUrl(url) {
    const multiplePath = url.split('#');

    const result = [];

    for (let i = 0; i < multiplePath.length; i++) {
      const path = multiplePath[i];
      let host, otherUrl;

      if (i === 0) {
        [host, otherUrl] = path.split('?');
      } else {
        host = path.split('?')[0];
        otherUrl = path.split('?')[1];
      }

      result.push({
        type: 'host',
        value: host,
      });

      if (otherUrl) {
        const params = otherUrl.split('&');

        if (params.length > 0) {
          result.push({
            type: 'table',
          });
        }

        for (let j = 0; j < params.length; j++) {
          const param = params[j];
          const [key, value] = param.split('=');
          result.push({
            type: 'param',
            key: key,
            value: value || '',
          });
        }
      }
    }

    return result;
  }

  function main() {
    const urlInfo = parseUrl(decodeURIComponent(window.location.href));

    console.log('url-reader: urlInfo');
    console.log(urlInfo);

    const popupId = '11ze-url-reader-popup';

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.id = popupId;
    popup.classList.add('url-reader-popup');

    // 设置弹窗样式
    popup.style.position = 'fixed';
    popup.style.top = '200px';
    popup.style.right = '400px';
    popup.style.zIndex = '9999';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '10px';
    popup.style['max-height'] = '800px';
    popup.style['overflow-y'] = 'auto';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.width = '400px';
    popup.style.marginLeft = '10px';
    popup.style.marginRight = '10px';
    popup.style.fontSize = '15px';

    let currentHost = '';
    let currentTable = null;
    let paramString = '';
    let hasParams = false;

    // 显示地址栏内容
    const fullUrl = window.location.href;
    const fullUrlDiv = document.createElement('div');
    fullUrlDiv.textContent = decodeURIComponent(fullUrl);
    // 内容显示完整并换行
    fullUrlDiv.style['overflow-wrap'] = 'break-word';
    popup.appendChild(fullUrlDiv);

    popup.appendChild(createSeparator());

    for (let i = 0; i < urlInfo.length; i++) {
      const param = urlInfo[i];
      const type = param.type;
      if (type === 'host') {
        if (currentTable) {
          if (hasParams) {
            // 为上一个 host 添加参数复制按钮
            addParamsCopyButton(popup, paramString);
            paramString = ''; // 重置参数字符串
          }

          popup.appendChild(createSeparator());
        }

        hasParams = false;

        currentHost = param.value;

        // 创建 host 显示和复制按钮
        const hostDiv = createHostDiv(currentHost);
        popup.appendChild(hostDiv);
      } else if (type === 'param') {
        // 添加参数行到表格
        addParamRow(currentTable, param);
        // 构建参数字符串
        paramString += (paramString ? '&' : '') + `${param.key}=${param.value}`;
        if (paramString) {
          hasParams = true;
        }
      } else if (type === 'table') {
        // 创建新的表格
        currentTable = createTable();
        popup.appendChild(currentTable);
      }
    }

    // 为最后一个 host 添加参数复制按钮
    if (paramString) {
      addParamsCopyButton(popup, paramString);
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.padding = '5px 10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '13px';
    closeButton.style.backgroundColor = '#f46f70';
    closeButton.style.border = '1px solid #e0e0e0';
    closeButton.style.borderColor = '#d4e3fc';
    closeButton.style.color = 'white';
    closeButton.style.width = '100%';
    closeButton.style.marginLeft = '10px';
    closeButton.style.marginRight = '10px';

    closeButton.onclick = () => {
      popup.remove();
    };

    popup.appendChild(closeButton);

    document.body.appendChild(popup);

    // 添加点击事件监听器到 document
    document.addEventListener('click', function (event) {
      if (!popup.contains(event.target) && event.target.id !== 'url-reader-menu-item') {
        popup.remove();
        document.removeEventListener('click', arguments.call);
      }
    });
  }

  function createSeparator() {
    const separator = document.createElement('div');
    separator.style.height = '1px';
    separator.style.backgroundColor = 'black';
    separator.style.margin = '10px 0';
    separator.style.marginTop = '20px';
    separator.style.width = '100%';
    return separator;
  }

  function createHostDiv(host) {
    const hostDiv = document.createElement('div');
    hostDiv.style.display = 'flex';
    hostDiv.style.marginBottom = '10px';

    const hostSpan = document.createElement('span');
    hostSpan.textContent = host;
    hostSpan.style.textAlign = 'left';
    hostDiv.appendChild(hostSpan);

    return hostDiv;
  }

  function createTable() {
    const table = document.createElement('table');
    table.className = 'table';
    table.style.minWidth = '400px';
    table.style.borderBottom = '1px solid #dddddd';
    table.style.textAlign = 'left';
    table.style.fontSize = '15px';

    table.innerHTML = `
      <thead>
        <tr style="background-color: #eef5fe;">
          <th style="padding: 6px; font-size: 15px;">&nbsp; 参数名 &nbsp;</th>
          <th style="padding: 6px; font-size: 15px;">&nbsp; 参数值 &nbsp;</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    return table;
  }

  function addParamRow(table, param) {
    const row = table.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    cell1.textContent = param.key;
    cell2.textContent = param.value;
    cell1.style.padding = '8px';
    cell2.style.padding = '8px';
  }

  function addParamsCopyButton(popup, paramString) {
    const paramsDiv = document.createElement('div');
    paramsDiv.style.display = 'flex';
    paramsDiv.style.marginBottom = '10px';
    paramsDiv.style.width = '100%';
    paramsDiv.style.marginLeft = '10px';
    paramsDiv.style.marginRight = '10px';

    const copyParamsButton = document.createElement('button');
    copyParamsButton.textContent = '复制参数';
    copyParamsButton.style.padding = '5px 10px';
    copyParamsButton.style.cursor = 'pointer';
    copyParamsButton.style.fontSize = '13px';
    copyParamsButton.style.backgroundColor = '#eef5fe';
    copyParamsButton.style.border = '1px solid #e0e0e0';
    copyParamsButton.style.borderColor = '#d4e3fc';
    copyParamsButton.style.color = 'black';
    copyParamsButton.style.width = '100%';

    copyParamsButton.onclick = () => copyToClipboard(paramString, copyParamsButton, '已复制');
    paramsDiv.appendChild(copyParamsButton);

    popup.appendChild(paramsDiv);
  }

  function copyToClipboard(text, button, successMessage) {
    const copyTextToClipboard = (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      } else {
        // 回退方法：创建一个临时的文本区域元素
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // 避免滚动到底部
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          navigator.clipboard.writeText(text);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    };

    copyTextToClipboard(text)
      .then(() => {
        const originalText = button.textContent;
        button.textContent = successMessage;
        button.disabled = true;
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 1000);
      })
      .catch((err) => {
        console.error('复制失败:', err);
        alert('复制失败，请重试');
      });
  }

  GM_registerMenuCommand('查看', main);
})();
