// ==UserScript==
// @name         查看浏览器地址栏信息
// @namespace    https://github.com/11ze
// @version      0.1.8
// @description  2025-12-02
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
    popup.style.backgroundColor = '#ffffff';
    popup.style.padding = '20px';
    popup.style['max-height'] = '80vh';
    popup.style['overflow-y'] = 'auto';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.width = '450px';
    popup.style.fontSize = '14px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
    popup.style.border = '1px solid #e1e8ed';

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
    fullUrlDiv.style.padding = '12px';
    fullUrlDiv.style.backgroundColor = '#f8fafc';
    fullUrlDiv.style.borderRadius = '8px';
    fullUrlDiv.style.border = '1px solid #e2e8f0';
    fullUrlDiv.style.fontSize = '13px';
    fullUrlDiv.style.lineHeight = '1.5';
    fullUrlDiv.style.color = '#1e293b';
    fullUrlDiv.style.marginBottom = '16px';
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
    closeButton.style.padding = '10px 16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '13px';
    closeButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '6px';
    closeButton.style.color = 'white';
    closeButton.style.width = '100%';
    closeButton.style.fontWeight = '600';
    closeButton.style.transition = 'all 0.2s ease';
    closeButton.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
    closeButton.style.marginTop = '8px';

    closeButton.onclick = () => {
      popup.remove();
    };

    // 添加悬停效果
    closeButton.onmouseover = () => {
      closeButton.style.transform = 'translateY(-1px)';
      closeButton.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
    };
    closeButton.onmouseout = () => {
      closeButton.style.transform = 'translateY(0)';
      closeButton.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
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
    separator.style.backgroundColor = '#e2e8f0';
    separator.style.margin = '16px 0';
    separator.style.width = '100%';
    return separator;
  }

  function createHostDiv(host) {
    const hostDiv = document.createElement('div');
    hostDiv.style.display = 'flex';
    hostDiv.style.marginBottom = '12px';
    hostDiv.style.padding = '10px 12px';
    hostDiv.style.backgroundColor = '#f1f5f9';
    hostDiv.style.borderRadius = '6px';
    hostDiv.style.borderLeft = '4px solid #3b82f6';

    const hostSpan = document.createElement('span');
    hostSpan.textContent = host;
    hostSpan.style.textAlign = 'left';
    hostSpan.style.fontSize = '14px';
    hostSpan.style.fontWeight = '600';
    hostSpan.style.color = '#000';
    hostDiv.appendChild(hostSpan);

    return hostDiv;
  }

  function createTable() {
    const table = document.createElement('table');
    table.className = 'table';
    table.style.minWidth = '400px';
    table.style.border = '1px solid #e2e8f0';
    table.style.borderRadius = '8px';
    table.style.textAlign = 'left';
    table.style.fontSize = '13px';
    table.style.borderCollapse = 'separate';
    table.style.borderSpacing = '0';
    table.style.overflow = 'hidden';

    table.innerHTML = `
      <thead>
        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <th style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: white; border: none;">参数名</th>
          <th style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: white; border: none;">参数值</th>
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
    cell1.style.padding = '12px 16px';
    cell2.style.padding = '12px 16px';
    cell1.style.borderBottom = '1px solid #f1f5f9';
    cell2.style.borderBottom = '1px solid #f1f5f9';
    cell1.style.fontSize = '13px';
    cell2.style.fontSize = '13px';
    cell1.style.color = '#374151';
    cell2.style.color = '#374151';
    cell1.style.fontWeight = '500';

    // 添加悬停效果
    row.style.transition = 'background-color 0.2s ease';
    row.onmouseover = () => (row.style.backgroundColor = '#f8fafc');
    row.onmouseout = () => (row.style.backgroundColor = '');
  }

  function addParamsCopyButton(popup, paramString) {
    const paramsDiv = document.createElement('div');
    paramsDiv.style.display = 'flex';
    paramsDiv.style.marginBottom = '16px';
    paramsDiv.style.width = '100%';

    const copyParamsButton = document.createElement('button');
    copyParamsButton.textContent = '复制参数';
    copyParamsButton.style.padding = '8px 16px';
    copyParamsButton.style.cursor = 'pointer';
    copyParamsButton.style.fontSize = '13px';
    copyParamsButton.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    copyParamsButton.style.border = 'none';
    copyParamsButton.style.borderRadius = '6px';
    copyParamsButton.style.color = 'white';
    copyParamsButton.style.width = '100%';
    copyParamsButton.style.fontWeight = '500';
    copyParamsButton.style.transition = 'all 0.2s ease';
    copyParamsButton.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';

    // 添加悬停效果
    copyParamsButton.onmouseover = () => {
      copyParamsButton.style.transform = 'translateY(-1px)';
      copyParamsButton.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
    };
    copyParamsButton.onmouseout = () => {
      copyParamsButton.style.transform = 'translateY(0)';
      copyParamsButton.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
    };

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
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          return document.execCommand('copy')
            ? Promise.resolve()
            : Promise.reject(new Error('复制失败'));
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
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        button.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
        button.disabled = true;
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          // 恢复原始样式
          if (originalText === '复制参数') {
            button.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
            button.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
          }
        }, 1000);
      })
      .catch((err) => {
        console.error('复制失败:', err);
        button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        button.textContent = '复制失败';
        setTimeout(() => {
          button.textContent = '复制参数';
          button.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
        }, 1000);
      });
  }

  GM_registerMenuCommand('查看', main);
})();
