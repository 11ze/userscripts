// ==UserScript==
// @name         查看网址
// @namespace    https://github.com/11ze
// @version      0.2.0
// @description  2026-02-07
// @author       11ze
// @license      MIT
// @match        *://*/*
// @noframes
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItc2VhcmNoIj48Y2lyY2xlIGN4PSIxMSIgY3k9IjExIiByPSI4Ij48L2NpcmNsZT48cGF0aCBkPSJtMjEgMjEtNC4zNS00LjM1Ij48L3BhdGg+PC9zdmc+
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  // 添加进入/退出动画
  GM_addStyle(`
    @keyframes 11ze-url-viewer-slide-in {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes 11ze-url-viewer-slide-out {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
    }
  `);

  function parseUrl(url) {
    if (typeof url !== 'string') {
      console.error('parseUrl: 参数必须是字符串');
      return [];
    }
    if (!url) {
      console.error('parseUrl: 参数不能为空');
      return [];
    }

    const multiplePath = url.split('#');
    const result = [];

    for (let i = 0; i < multiplePath.length; i++) {
      const path = multiplePath[i];
      if (!path) continue;

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
        // 使用 URLSearchParams 解析参数
        const params = new URLSearchParams(otherUrl);
        const paramEntries = Array.from(params.entries());

        if (paramEntries.length > 0) {
          result.push({
            type: 'table',
          });
        }

        for (const [key, value] of paramEntries) {
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
    popup.style.top = 'calc(50vh - 40%)';
    popup.style.left = 'calc(50vw - 260px)';
    popup.style.zIndex = '9999';
    popup.style.backgroundColor = '#ffffff';
    popup.style.padding = '24px';
    popup.style.maxHeight = '80vh';
    popup.style.overflowY = 'auto';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.width = '520px';
    popup.style.fontSize = '14px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.08)';
    popup.style.border = '1px solid rgba(0,0,0,0.06)';

    let currentHost = '';
    let currentTable = null;
    let paramString = '';
    let hasParams = false;
    let hostIndex = 0; // host 层级计数器

    // 显示地址栏内容
    const fullUrl = window.location.href;
    const fullUrlDiv = document.createElement('div');
    fullUrlDiv.textContent = decodeURIComponent(fullUrl);
    // 内容显示完整并换行
    fullUrlDiv.style.overflowWrap = 'break-word';
    fullUrlDiv.style.padding = '16px';
    fullUrlDiv.style.backgroundColor = '#f8fafc';
    fullUrlDiv.style.borderRadius = '10px';
    fullUrlDiv.style.border = '1px solid rgba(148, 163, 184, 0.2)';
    fullUrlDiv.style.fontSize = '13px';
    fullUrlDiv.style.lineHeight = '1.6';
    fullUrlDiv.style.color = '#334155';
    fullUrlDiv.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
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
            addParamsCopyButton(popup, paramString, hostIndex - 1);
            paramString = ''; // 重置参数字符串
          }

          popup.appendChild(createSeparator());
        }

        hasParams = false;

        currentHost = param.value;

        // 创建 host 显示和复制按钮
        const hostDiv = createHostDiv(currentHost, hostIndex);
        popup.appendChild(hostDiv);
        hostIndex++; // 递增层级计数器
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
        currentTable = createTable(hostIndex - 1);
        popup.appendChild(currentTable);
      }
    }

    // 为最后一个 host 添加参数复制按钮
    if (paramString) {
      addParamsCopyButton(popup, paramString, hostIndex - 1);
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.padding = '12px 16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '13px';
    closeButton.style.background = '#ffffff';
    closeButton.style.border = '1px solid #e2e8f0';
    closeButton.style.borderRadius = '8px';
    closeButton.style.color = '#64748b';
    closeButton.style.width = '100%';
    closeButton.style.fontWeight = '600';
    closeButton.style.transition = 'all 0.2s ease';
    closeButton.style.height = '42px';
    closeButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
    closeButton.style.marginTop = '8px';

    closeButton.onclick = () => {
      popup.style.animation = '11ze-url-viewer-slide-out 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => popup.remove(), 200);
    };

    // 添加悬停效果
    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = '#f8fafc';
      closeButton.style.borderColor = '#cbd5e1';
      closeButton.style.transform = 'translateY(-1px)';
      closeButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    };
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = '#ffffff';
      closeButton.style.borderColor = '#e2e8f0';
      closeButton.style.transform = 'translateY(0)';
      closeButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
    };

    popup.appendChild(closeButton);

    document.body.appendChild(popup);

    // 添加进入动画
    popup.style.animation = '11ze-url-viewer-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    // 添加点击事件监听器到 document
    const closePopup = (event) => {
      if (!popup.contains(event.target) && event.target.id !== 'url-reader-menu-item') {
        popup.style.animation = '11ze-url-viewer-slide-out 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }, 200);
      }
    };
    document.addEventListener('click', closePopup);
  }

  function createSeparator() {
    const separator = document.createElement('div');
    separator.style.height = '1px';
    separator.style.backgroundColor = '#e2e8f0';
    separator.style.margin = '12px 0';
    separator.style.width = '100%';
    return separator;
  }

  function createHostDiv(host, level = 0) {
    const hostDiv = document.createElement('div');
    hostDiv.style.display = 'flex';
    hostDiv.style.marginBottom = '12px';
    hostDiv.style.marginLeft = `${level * 24}px`; // 每层缩进 24px
    hostDiv.style.padding = '14px 16px';
    hostDiv.style.backgroundColor = '#eff6ff';
    hostDiv.style.borderRadius = '8px';
    hostDiv.style.borderLeft = '3px solid #3b82f6';

    const hostSpan = document.createElement('span');
    hostSpan.textContent = host;
    hostSpan.style.textAlign = 'left';
    hostSpan.style.fontSize = '15px';
    hostSpan.style.fontWeight = '600';
    hostSpan.style.color = '#1e3a8a';
    hostDiv.appendChild(hostSpan);

    return hostDiv;
  }

  function createTable(level = 0) {
    const table = document.createElement('table');
    table.className = 'table';
    table.style.minWidth = '400px';
    table.style.marginLeft = `${level * 24}px`; // 每层缩进 24px
    table.style.border = '1px solid #e2e8f0';
    table.style.borderRadius = '8px';
    table.style.textAlign = 'left';
    table.style.fontSize = '13px';
    table.style.borderCollapse = 'separate';
    table.style.borderSpacing = '0';
    table.style.overflow = 'hidden';

    table.innerHTML = `
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 14px 16px; font-size: 11px; font-weight: 700; color: #475569; border: none; border-radius: 8px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">参数名</th>
          <th style="padding: 14px 16px; font-size: 11px; font-weight: 700; color: #475569; border: none; border-radius: 0 8px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">参数值</th>
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

    // 创建参数名元素
    const keySpan = document.createElement('span');
    keySpan.textContent = param.key;
    keySpan.style.cursor = 'pointer';
    keySpan.style.padding = '6px 10px';
    keySpan.style.borderRadius = '6px';
    keySpan.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    keySpan.style.fontWeight = '600';
    keySpan.style.fontSize = '13px';
    keySpan.title = '点击复制参数名';

    // 创建参数值元素
    const valueSpan = document.createElement('span');
    valueSpan.textContent = param.value;
    valueSpan.style.cursor = 'pointer';
    valueSpan.style.padding = '6px 10px';
    valueSpan.style.borderRadius = '6px';
    valueSpan.style.transition = 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    valueSpan.style.fontSize = '13px';
    valueSpan.title = '点击复制参数值';

    // 添加点击复制功能到单元格
    cell1.onclick = () => {
      copyToClipboard(param.key, keySpan, '已复制');
    };

    cell2.onclick = () => {
      copyToClipboard(param.value, valueSpan, '已复制');
    };

    // 添加悬停效果到单元格
    cell1.onmouseover = () => {
      cell1.style.backgroundColor = '#eff6ff';
      keySpan.style.color = '#2563eb';
    };
    cell1.onmouseout = () => {
      cell1.style.backgroundColor = '';
      keySpan.style.color = '';
    };

    cell2.onmouseover = () => {
      cell2.style.backgroundColor = '#eff6ff';
      valueSpan.style.color = '#2563eb';
    };
    cell2.onmouseout = () => {
      cell2.style.backgroundColor = '';
      valueSpan.style.color = '';
    };

    // 设置单元格样式，使其可点击
    cell1.style.cursor = 'pointer';
    cell2.style.cursor = 'pointer';

    cell1.appendChild(keySpan);
    cell2.appendChild(valueSpan);

    cell1.style.padding = '14px 16px';
    cell2.style.padding = '14px 16px';
    cell1.style.borderBottom = '1px solid #f1f5f9';
    cell2.style.borderBottom = '1px solid #f1f5f9';
    cell1.style.fontSize = '13px';
    cell2.style.fontSize = '13px';
    cell1.style.color = '#0f172a';
    cell2.style.color = '#475569';
    cell1.style.fontWeight = '600';

    // 移除行悬停效果，保持单元格悬停一致性
    row.style.transition = 'none';
  }

  function addParamsCopyButton(popup, paramString, level = 0) {
    const paramsDiv = document.createElement('div');
    paramsDiv.style.display = 'flex';
    paramsDiv.style.marginBottom = '16px';
    paramsDiv.style.marginLeft = `${level * 24}px`; // 每层缩进 24px
    paramsDiv.style.width = `calc(100% - ${level * 24}px)`; // 宽度随缩进减少

    const copyParamsButton = document.createElement('button');
    copyParamsButton.textContent = '复制参数';
    copyParamsButton.style.padding = '12px 16px';
    copyParamsButton.style.cursor = 'pointer';
    copyParamsButton.style.fontSize = '13px';
    copyParamsButton.style.background = '#3b82f6';
    copyParamsButton.style.border = 'none';
    copyParamsButton.style.borderRadius = '8px';
    copyParamsButton.style.color = 'white';
    copyParamsButton.style.width = '100%';
    copyParamsButton.style.fontWeight = '500';
    copyParamsButton.style.transition = 'all 0.2s ease';
    copyParamsButton.style.height = '42px';
    copyParamsButton.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';

    // 添加悬停效果
    copyParamsButton.onmouseover = () => {
      copyParamsButton.style.background = '#2563eb';
      copyParamsButton.style.transform = 'translateY(-1px)';
      copyParamsButton.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
    };
    copyParamsButton.onmouseout = () => {
      copyParamsButton.style.background = '#3b82f6';
      copyParamsButton.style.transform = 'translateY(0)';
      copyParamsButton.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
    };

    copyParamsButton.onclick = () => copyToClipboard(paramString, copyParamsButton, '已复制');
    paramsDiv.appendChild(copyParamsButton);

    popup.appendChild(paramsDiv);
  }

  function copyToClipboard(text, button, successMessage) {
    // 防止重复点击
    if (button.disabled) {
      return;
    }

    // 保存原始样式和文本
    const originalText = button.textContent;
    const originalBackground = button.style.background;
    const originalBoxShadow = button.style.boxShadow;

    // 立即禁用按钮，防止重复点击
    button.disabled = true;

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
        // 立即更新按钮状态 - 使用精致的成功样式
        button.textContent = '✓ ' + successMessage;
        button.style.background = '#10b981';
        button.style.color = '#ffffff';
        button.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.4)';
        button.style.transform = 'scale(1.02)';

        // 1秒后恢复原始状态
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          button.style.background = originalBackground;
          button.style.color = '';
          button.style.boxShadow = originalBoxShadow;
          button.style.transform = '';
        }, 1000);
      })
      .catch((err) => {
        console.error('复制失败:', err);
        button.textContent = '✗ 复制失败';
        button.style.background = '#ef4444';
        button.style.color = '#ffffff';
        button.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.4)';

        // 1.5秒后恢复原始状态
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          button.style.background = originalBackground;
          button.style.color = '';
          button.style.boxShadow = originalBoxShadow;
        }, 1500);
      });
  }

  GM_registerMenuCommand('查看', main);
})();
