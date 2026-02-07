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

  // ==================== 样式常量 ====================
  const ANIM = {
    slideIn: '11ze-url-viewer-slide-in',
    slideOut: '11ze-url-viewer-slide-out',
    duration: 200,
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const COLORS = {
    bg: '#ffffff',
    border: '#e2e8f0',
    borderLight: 'rgba(0,0,0,0.06)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    textHost: '#1e3a8a',
    blue: '#3b82f6',
    blueHover: '#2563eb',
    blueBg: '#eff6ff',
    blueBgLight: '#f8fafc',
    success: '#10b981',
    error: '#ef4444',
  };

  // ==================== 工具函数 ====================
  function setStyles(el, styles) {
    Object.assign(el.style, styles);
  }

  function setHover(el, hoverStyles, normalStyles = {}) {
    const original = {};
    for (const key of Object.keys(hoverStyles)) {
      original[key] = el.style[key];
    }
    Object.assign(original, normalStyles);

    el.onmouseover = () => setStyles(el, hoverStyles);
    el.onmouseout = () => setStyles(el, original);
  }

  function runExitAnimation(el, callback) {
    el.style.animation = `${ANIM.slideOut} 0.2s ${ANIM.timing}`;
    setTimeout(() => {
      el.remove();
      callback?.();
    }, ANIM.duration);
  }

  function createEl(tag, styles = {}, props = {}) {
    const el = document.createElement(tag);
    setStyles(el, styles);
    Object.assign(el, props);
    return el;
  }

  // ==================== 样式定义 ====================
  const popupStyles = {
    position: 'fixed',
    top: 'calc(50vh - 40%)',
    left: 'calc(50vw - 260px)',
    zIndex: '9999',
    backgroundColor: COLORS.bg,
    padding: '24px',
    maxHeight: '80vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    width: '520px',
    fontSize: '14px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.08)',
    border: `1px solid ${COLORS.borderLight}`,
  };

  const fullUrlStyles = {
    overflowWrap: 'break-word',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#334155',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    marginBottom: '16px',
  };

  const separatorStyles = {
    height: '1px',
    backgroundColor: COLORS.border,
    margin: '12px 0',
    width: '100%',
  };

  const hostDivStyles = {
    display: 'flex',
    marginBottom: '12px',
    padding: '14px 16px',
    backgroundColor: COLORS.blueBg,
    borderRadius: '8px',
    borderLeft: `3px solid ${COLORS.blue}`,
  };

  const hostSpanStyles = {
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: '600',
    color: COLORS.textHost,
  };

  const tableStyles = {
    minWidth: '400px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '13px',
    borderCollapse: 'separate',
    borderSpacing: '0',
    overflow: 'hidden',
  };

  const cellStyles = {
    padding: '14px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s ease',
  };

  const keySpanStyles = {
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'color 0.15s ease',
  };

  const valueSpanStyles = {
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    transition: 'color 0.15s ease',
  };

  const closeButtonStyles = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.textMuted,
    width: '100%',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    height: '42px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    marginTop: '8px',
  };

  const toastStyles = {
    position: 'fixed',
    zIndex: '10000',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  // ==================== 动画样式 ====================
  GM_addStyle(`
    @keyframes ${ANIM.slideIn} {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes ${ANIM.slideOut} {
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

  // ==================== 复制功能 ====================
  function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
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

  function showToast(message, type, x, y) {
    const toast = createEl('div', toastStyles);
    toast.textContent = message;
    toast.style.background = type === 'success' ? COLORS.success : COLORS.error;
    toast.style.left = `${x + 16}px`;
    toast.style.top = `${y + 16}px`;
    toast.style.animation = `${ANIM.slideIn} 0.2s ${ANIM.timing}`;

    document.body.appendChild(toast);

    setTimeout(() => {
      runExitAnimation(toast);
    }, 1000);
  }

  function copyToClipboard(text, x, y) {
    copyTextToClipboard(text)
      .then(() => showToast('✓ 已复制', 'success', x, y))
      .catch((err) => {
        console.error('复制失败:', err);
        showToast('✗ 复制失败', 'error', x, y);
      });
  }

  // ==================== URL 解析 ====================
  function parseUrl(url) {
    if (typeof url !== 'string' || !url) {
      console.error('parseUrl: 参数必须是非空字符串');
      return [];
    }

    const result = [];
    const parts = url.split('#');

    for (const part of parts) {
      if (!part) continue;

      const [host, queryString] = part.split('?');

      result.push({ type: 'host', value: host });

      if (queryString) {
        const params = new URLSearchParams(queryString);
        const entries = Array.from(params.entries());

        if (entries.length > 0) {
          result.push({ type: 'table' });
        }

        for (const [key, value] of entries) {
          result.push({ type: 'param', key, value: value || '' });
        }
      }
    }

    return result;
  }

  // ==================== DOM 创建函数 ====================
  function createSeparator() {
    return createEl('div', separatorStyles);
  }

  function createHostDiv(host, level = 0) {
    const hostDiv = createEl('div', hostDivStyles);
    hostDiv.style.marginLeft = `${level * 24}px`;

    const hostSpan = createEl('span', hostSpanStyles);
    hostSpan.textContent = host;
    hostDiv.appendChild(hostSpan);

    return hostDiv;
  }

  function createTable(level = 0) {
    const table = createEl('table', tableStyles);
    table.style.marginLeft = `${level * 24}px`;
    table.innerHTML = '<tbody></tbody>';
    return table;
  }

  function addParamRow(table, param) {
    const row = table.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);

    // 参数名单元格
    const keySpan = createEl('span', keySpanStyles, { textContent: param.key });
    keySpan.title = '点击复制参数名';
    cell1.onclick = (e) => copyToClipboard(param.key, e.clientX, e.clientY);
    setStyles(cell1, { ...cellStyles, color: COLORS.textPrimary });
    setHover(cell1, { backgroundColor: COLORS.blueBg }, { backgroundColor: '' });
    setHover(keySpan, { color: COLORS.blueHover }, { color: '' });
    cell1.appendChild(keySpan);

    // 参数值单元格
    const valueSpan = createEl('span', valueSpanStyles, { textContent: param.value });
    valueSpan.title = '点击复制参数值';
    cell2.onclick = (e) => copyToClipboard(param.value, e.clientX, e.clientY);
    setStyles(cell2, { ...cellStyles, color: COLORS.textSecondary });
    setHover(cell2, { backgroundColor: COLORS.blueBg }, { backgroundColor: '' });
    setHover(valueSpan, { color: COLORS.blueHover }, { color: '' });
    cell2.appendChild(valueSpan);

    // 第一行添加顶部圆角
    if (table.rows.length === 1) {
      cell1.style.borderRadius = '8px 0 0 0';
      cell2.style.borderRadius = '0 8px 0 0';
    }

    row.style.transition = 'none';
  }

  function createCloseButton(popup) {
    const button = createEl('button', closeButtonStyles, { textContent: '关闭' });

    button.onclick = () => runExitAnimation(popup);

    setHover(
      button,
      {
        backgroundColor: COLORS.blueBgLight,
        borderColor: '#cbd5e1',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
      {
        backgroundColor: COLORS.bg,
        borderColor: COLORS.border,
        transform: 'translateY(0)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }
    );

    return button;
  }

  // ==================== 主函数 ====================
  function main() {
    const urlInfo = parseUrl(decodeURIComponent(window.location.href));
    console.log('url-reader: urlInfo', urlInfo);

    const popup = createEl('div', popupStyles, {
      id: '11ze-url-reader-popup',
      className: 'popup url-reader-popup',
    });

    // 完整 URL 显示
    const fullUrlDiv = createEl('div', fullUrlStyles, {
      textContent: decodeURIComponent(window.location.href),
    });
    popup.appendChild(fullUrlDiv);

    popup.appendChild(createSeparator());

    // 构建参数列表
    let currentTable = null;
    let hostIndex = 0;

    for (const item of urlInfo) {
      if (item.type === 'host') {
        if (currentTable) {
          popup.appendChild(createSeparator());
        }
        popup.appendChild(createHostDiv(item.value, hostIndex));
        hostIndex++;
      } else if (item.type === 'table') {
        currentTable = createTable(hostIndex - 1);
        popup.appendChild(currentTable);
      } else if (item.type === 'param') {
        addParamRow(currentTable, item);
      }
    }

    // 关闭按钮
    popup.appendChild(createCloseButton(popup));

    document.body.appendChild(popup);
    popup.style.animation = `${ANIM.slideIn} 0.3s ${ANIM.timing}`;

    // 点击外部关闭
    const closePopup = (event) => {
      if (!popup.contains(event.target) && event.target.id !== 'url-reader-menu-item') {
        runExitAnimation(popup, () => document.removeEventListener('click', closePopup));
      }
    };
    document.addEventListener('click', closePopup);
  }

  GM_registerMenuCommand('查看', main);
})();
