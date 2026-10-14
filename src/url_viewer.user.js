// ==UserScript==
// @name         查看网址
// @namespace    https://github.com/11ze
// @version      0.4.5
// @description  2026-10-14 popup 开关收口 open/close 一对函数——菜单连点不再叠层，三条关路径（关闭钮/点外部/Ctrl+U）都成对摘除 document 监听器，删除恒假的菜单项 ID 判断
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

    el.addEventListener('mouseover', () => setStyles(el, hoverStyles));
    el.addEventListener('mouseout', () => setStyles(el, original));
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

  const valueInputStyles = {
    width: '100%',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.blueBgLight,
    outline: 'none',
    cursor: 'text',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    boxSizing: 'border-box',
  };

  const buttonBarStyles = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    width: '100%',
  };

  const modeGroupStyles = {
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  const primaryButtonStyles = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    background: COLORS.blue,
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    height: '42px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    flex: '1',
  };

  const closeButtonStyles = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.textMuted,
    fontWeight: '600',
    transition: 'all 0.2s ease',
    height: '42px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    width: '100%',
  };

  let toastZIndex = 10000;

  const toastStyles = {
    position: 'fixed',
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
    input.param-input:focus {
      border-color: ${COLORS.blue};
      background-color: ${COLORS.blueBg};
    }

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
    toast.style.zIndex = String(toastZIndex++);  // 递增 z-index 避免覆盖
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
  /**
   * 把 URL 拆成 host 段列表，每段携带自己的查询参数
   * 段内取第一个 ? 之后的全部作为查询串，参数值里的 ? 不截断
   * 调用方需先对整串 decodeURIComponent：让参数里编码的 #
   * 炸开成独立段，iframe 嵌套路由才能分节展示
   */
  function parseUrl(url) {
    if (typeof url !== 'string' || !url) {
      console.error('parseUrl: 参数必须是非空字符串');
      return [];
    }

    const segments = [];

    for (const part of url.split('#')) {
      if (!part) continue;

      const [host, ...queryParts] = part.split('?');
      const queryString = queryParts.join('?');
      const params = [];

      if (queryString) {
        for (const [key, value] of new URLSearchParams(queryString).entries()) {
          params.push({ key: key, value: value });
        }
      }

      segments.push({ host: host, params: params });
    }

    return segments;
  }

  /**
   * parseUrl 的逆函数：段列表 + 基底地址 → URL 字符串
   * 主段（下标 0）参数写入 search，其余段按原序以 # 连接写入 hash，
   * 无参数段同样保留（按表格重建的旧实现会静默丢段）
   * 序列化走 URLSearchParams，是归一化而非逐字节还原（空格变 +、? 编码为 %3F）
   */
  function buildUrl(baseUrl, segments) {
    const url = new URL(baseUrl);
    const [main, ...hashSegments] = segments;

    if (main && main.params.length > 0) {
      const params = new URLSearchParams();
      for (const { key, value } of main.params) params.append(key, value);
      url.search = params.toString();
    }

    if (hashSegments.length > 0) {
      url.hash = hashSegments
        .map((segment) => {
          const params = new URLSearchParams();
          for (const { key, value } of segment.params) params.append(key, value);
          const queryString = params.toString();
          return segment.host + (queryString ? '?' + queryString : '');
        })
        .join('#');
    }

    return url.toString();
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

    return { cell: cell2, span: valueSpan, param: param, input: null };
  }

  // ==================== 模式切换 ====================
  function switchToEditMode(bindings, bar) {
    for (const binding of bindings) {
      const input = createEl('input', valueInputStyles, {
        value: binding.param.value,
        className: 'param-input',
      });

      binding.cell.onclick = null;
      binding.cell.style.cursor = 'text';
      binding.span.replaceWith(input);
      binding.input = input;
    }

    // 切换按钮: 隐藏查看模式按钮，显示编辑模式按钮
    bar.querySelector('.view-mode').style.display = 'none';
    bar.querySelector('.edit-mode').style.display = 'flex';
  }

  function switchToViewMode(bindings, bar) {
    // 编辑值只在点「确定」时采纳，取消直接按模型重渲染
    for (const binding of bindings) {
      const span = createEl('span', valueSpanStyles, {
        textContent: binding.param.value,
      });
      span.title = '点击复制参数值';
      setHover(span, { color: COLORS.blueHover }, { color: '' });

      binding.cell.onclick = (e) => copyToClipboard(binding.param.value, e.clientX, e.clientY);
      binding.cell.style.cursor = 'pointer';

      binding.input.replaceWith(span);
      binding.span = span;
      binding.input = null;
    }

    // 切换按钮
    bar.querySelector('.edit-mode').style.display = 'none';
    bar.querySelector('.view-mode').style.display = 'flex';
  }

  // ==================== 导航决策 ====================
  /**
   * location.href 赋值是异步导航：跨文档跳转后紧跟 reload() 会取消跳转，回到旧地址。
   * 只有 same-document 导航（除 hash 外全同）不会触发页面加载，需要补一次 reload。
   */
  function shouldReloadAfterNavigate(currentHref, nextHref) {
    const current = new URL(currentHref);
    const next = new URL(nextHref);
    return current.origin === next.origin
      && current.pathname === next.pathname
      && current.search === next.search;
  }

  // ==================== 底部按钮栏 ====================
  function createBottomBar(popup, session) {
    const bar = createEl('div', buttonBarStyles);
    const hasParams = session.segments.some((segment) => segment.params.length > 0);

    // 查看模式按钮组
    const viewModeGroup = createEl('div', { ...modeGroupStyles, display: 'flex' });
    viewModeGroup.classList.add('view-mode');

    const closeButton = createEl('button', closeButtonStyles, { textContent: '关闭（Ctrl + U）' });
    closeButton.onclick = closeViewer;
    setHover(closeButton, { borderColor: COLORS.textMuted }, { borderColor: COLORS.border });

    if (hasParams) {
      const editButton = createEl('button', primaryButtonStyles, { textContent: '编辑' });
      editButton.onclick = () => switchToEditMode(session.bindings, bar);
      setHover(editButton, { background: COLORS.blueHover }, { background: COLORS.blue });
      viewModeGroup.appendChild(editButton);
    } else {
      closeButton.style.flex = '1';
    }

    viewModeGroup.appendChild(closeButton);

    // 编辑模式按钮组
    const editModeGroup = createEl('div', { ...modeGroupStyles, display: 'none' });
    editModeGroup.classList.add('edit-mode');

    const confirmButton = createEl('button', primaryButtonStyles, { textContent: '确定' });
    confirmButton.onclick = () => {
      for (const { input, param } of session.bindings) {
        param.value = input.value;
      }
      const nextUrl = buildUrl(session.baseUrl, session.segments);
      const reloadAfter = shouldReloadAfterNavigate(window.location.href, nextUrl);
      window.location.href = nextUrl;
      if (reloadAfter) {
        window.location.reload();
      }
    };
    setHover(confirmButton, { background: COLORS.blueHover }, { background: COLORS.blue });

    const cancelButton = createEl('button', closeButtonStyles, { textContent: '取消' });
    cancelButton.onclick = () => switchToViewMode(session.bindings, bar);
    setHover(cancelButton, { borderColor: COLORS.textMuted }, { borderColor: COLORS.border });

    editModeGroup.appendChild(confirmButton);
    editModeGroup.appendChild(cancelButton);

    bar.appendChild(viewModeGroup);
    bar.appendChild(editModeGroup);

    return bar;
  }

  // ==================== 主函数 ====================

  // 开关收口：两个入口（菜单 / Ctrl+U）、三条关路径（关闭钮 / 点外部 / Ctrl+U）
  // 全走这一对函数——open 幂等（已开先关），close 成对摘除 document 监听器
  let activePopup = null;
  let outsideClickHandler = null;

  function closeViewer() {
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }
    if (outsideClickHandler) {
      document.removeEventListener('click', outsideClickHandler);
      outsideClickHandler = null;
    }
  }

  function openViewer() {
    closeViewer();

    // 打开时快照：基底地址与解码串只取一次，编辑会话全程认这份模型
    const rawHref = window.location.href;
    const decodedHref = decodeURIComponent(rawHref);
    const segments = parseUrl(decodedHref);

    const popup = createEl('div', popupStyles, {
      id: '11ze-url-reader-popup',
      className: 'popup url-reader-popup',
    });

    // 完整 URL 显示
    const fullUrlDiv = createEl('div', fullUrlStyles, {
      textContent: decodedHref,
    });
    popup.appendChild(fullUrlDiv);

    popup.appendChild(createSeparator());

    // 构建参数列表；出现过表之后，每个 host 段前都加分隔线
    let separatorNeeded = false;
    const bindings = [];

    segments.forEach((segment, index) => {
      if (separatorNeeded) {
        popup.appendChild(createSeparator());
      }

      popup.appendChild(createHostDiv(segment.host, index));

      if (segment.params.length === 0) return;

      const table = createTable(index);
      popup.appendChild(table);
      for (const param of segment.params) {
        bindings.push(addParamRow(table, param));
      }

      separatorNeeded = true;
    });

    // 底部按钮栏
    popup.appendChild(createBottomBar(popup, { segments, bindings, baseUrl: rawHref }));

    document.body.appendChild(popup);
    popup.style.animation = `${ANIM.slideIn} 0.3s ${ANIM.timing}`;

    // 点击外部关闭
    activePopup = popup;
    outsideClickHandler = (event) => {
      if (!popup.contains(event.target)) {
        closeViewer();
      }
    };
    document.addEventListener('click', outsideClickHandler);
  }

  // 测试钩子：浏览器中 __URL_VIEWER_TEST__ 不存在，此分支永不执行
  if (window.__URL_VIEWER_TEST__) {
    window.__URL_VIEWER_TEST__.hooks = {
      parseUrl: parseUrl,
      buildUrl: buildUrl,
      shouldReloadAfterNavigate: shouldReloadAfterNavigate,
    };
  }

  GM_registerMenuCommand('查看 (Ctrl + U)', openViewer);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      if (activePopup) {
        closeViewer();
      } else {
        openViewer();
      }
    }
  });
})();
