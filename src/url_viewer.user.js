// ==UserScript==
// @name         查看网址
// @namespace    https://github.com/11ze
// @version      0.5.0
// @description  2026-10-31 弹窗重设计（designs/url-viewer 方向 C 极简）：毛玻璃面板、黑色主按钮、分段式底栏；表格改网格行，键/值 hover 分离各带复制提示，多段显示序号徽标；2026-10-25 打开时 decode 包 try/catch——SPA pushState 写入的裸 % href 不再抛 URIError 致弹窗打不开
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

  // 方向 C（极简）：毛玻璃面板、黑主色、灰阶 hover——取自 designs/url-viewer 定稿
  const COLORS = {
    bg: 'rgba(250, 250, 252, 0.92)',
    border: 'rgba(0, 0, 0, 0.06)',
    borderLight: 'rgba(0, 0, 0, 0.06)',
    textSecondary: '#3f3f46',
    textMuted: '#71717a',
    textHost: '#18181b',
    keyText: '#52525b',
    valText: '#27272a',
    keyHoverBg: 'rgba(0, 0, 0, 0.07)',
    keyHoverFg: '#000000',
    valHoverBg: 'rgba(0, 0, 0, 0.045)',
    valHoverFg: '#18181b',
    accent: '#18181b',
    accentHover: '#000000',
    accentSoft: 'rgba(0, 0, 0, 0.05)',
    inputBg: '#ffffff',
    success: '#18181b',
    error: '#dc2626',
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
    fontSize: '13.5px',
    textAlign: 'left',
    borderRadius: '18px',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 22px 60px rgba(0,0,0,0.18)',
    border: `1px solid ${COLORS.borderLight}`,
  };

  const fullUrlStyles = {
    overflowWrap: 'break-word',
    wordBreak: 'break-all',
    maxHeight: '96px',
    overflowY: 'auto',
    padding: '6px 0 0',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '12.5px',
    lineHeight: '1.65',
    color: COLORS.textSecondary,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    marginBottom: '0',
  };

  const fullUrlLabelStyles = {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    color: COLORS.textMuted,
    marginBottom: '7px',
  };

  const separatorStyles = {
    height: '1px',
    backgroundColor: COLORS.border,
    margin: '14px 0',
    width: '100%',
  };

  const hostSegHeadStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginBottom: '10px',
    padding: '2px 2px 0',
    backgroundColor: 'transparent',
  };

  const hostSpanStyles = {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.textHost,
    overflowWrap: 'anywhere',
  };

  const segNoStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '19px',
    height: '19px',
    flex: 'none',
    borderRadius: '50%',
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.borderLight}`,
    color: COLORS.textMuted,
    fontSize: '11px',
    fontWeight: '600',
  };

  const rowsStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px',
    margin: '-4px',
  };

  const rowStyles = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 38%) minmax(0, 1fr)',
    alignItems: 'baseline',
    padding: '3px 6px',
  };

  const keyCellStyles = {
    position: 'relative',
    padding: '8px 10px',
    borderRadius: '7px',
    cursor: 'pointer',
    overflowWrap: 'anywhere',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  };

  const valCellStyles = {
    ...keyCellStyles,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    fontSize: '12.5px',
    lineHeight: '1.55',
  };

  const valueSpanStyles = {
    display: 'block',
    position: 'relative',
    overflowWrap: 'anywhere',
  };

  const hintStyles = {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '11px',
    fontWeight: '600',
    color: COLORS.textMuted,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    padding: '2px 4px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  const valueInputStyles = {
    width: '100%',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '7px',
    padding: '6px 10px',
    fontSize: '12.5px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    color: COLORS.valText,
    backgroundColor: COLORS.inputBg,
    outline: 'none',
    cursor: 'text',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  };

  // 分段式底栏：胶囊底由 bar 提供，两组按钮共用
  const buttonBarStyles = {
    display: 'flex',
    gap: '4px',
    marginTop: '20px',
    width: '100%',
    backgroundColor: COLORS.accentSoft,
    padding: '4px',
    borderRadius: '999px',
    boxSizing: 'border-box',
  };

  const modeGroupStyles = {
    gap: '4px',
    width: '100%',
  };

  const primaryButtonStyles = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    background: COLORS.accent,
    border: 'none',
    borderRadius: '999px',
    color: '#ffffff',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    height: '40px',
    flex: '1',
  };

  const closeButtonStyles = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    background: 'transparent',
    border: 'none',
    borderRadius: '999px',
    color: COLORS.textSecondary,
    fontWeight: '600',
    transition: 'all 0.2s ease',
    height: '40px',
    flex: '1',
  };

  let toastZIndex = 10000;

  const toastStyles = {
    position: 'fixed',
    padding: '9px 15px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#ffffff',
    boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  // ==================== 动画样式 ====================
  // 键/值 hover 分离与复制提示显隐走 CSS：查看态才出 hover 底色（编辑态输入框
  // 占位后仍会触发 :hover，用 .editing 门控关掉），提示随单元格 hover 显隐
  GM_addStyle(`
    .pv-key-cell {
      color: ${COLORS.keyText};
      font-weight: 600;
      font-size: 13px;
    }

    .pv-val-cell {
      color: ${COLORS.valText};
    }

    .popup:not(.editing) .pv-key-cell:hover {
      background-color: ${COLORS.keyHoverBg};
      color: ${COLORS.keyHoverFg};
    }

    .popup:not(.editing) .pv-val-cell:hover {
      background-color: ${COLORS.valHoverBg};
      color: ${COLORS.valHoverFg};
    }

    .pv-copy {
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .pv-key-cell:hover .pv-copy,
    .pv-val-cell:hover .pv-copy {
      opacity: 1;
    }

    input.param-input:focus {
      border-color: ${COLORS.accent};
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

  function createHostDiv(host, level = 0, badgeIndex = null) {
    const hostDiv = createEl('div', hostSegHeadStyles);
    hostDiv.style.marginLeft = `${level * 20}px`;

    if (badgeIndex !== null) {
      hostDiv.appendChild(createEl('span', segNoStyles, {
        textContent: String(badgeIndex + 1),
        className: 'pv-seg-no',
      }));
    }

    const hostSpan = createEl('span', hostSpanStyles);
    hostSpan.textContent = host;
    hostDiv.appendChild(hostSpan);

    return hostDiv;
  }

  // 值提示挂在值 span 内部：编辑模式 replaceWith(input) 连带移除，
  // 取消重建 span 时一并恢复——提示没有残留盖住输入框的路径
  function createValueSpan(param) {
    const span = createEl('span', valueSpanStyles, { textContent: param.value });
    span.appendChild(createEl('span', hintStyles, { textContent: '复制值', className: 'pv-copy' }));
    return span;
  }

  function addParamRow(rows, param) {
    const row = createEl('div', rowStyles, { className: 'pv-row' });

    // 参数名单元格：hover 底色/前景色与提示显隐由 .pv-key-cell CSS 接管
    const keyCell = createEl('div', keyCellStyles, {
      className: 'pv-cell pv-key-cell',
      title: '点击复制参数名',
    });
    keyCell.appendChild(createEl('span', {}, { textContent: param.key }));
    keyCell.appendChild(createEl('span', hintStyles, { textContent: '复制键名', className: 'pv-copy' }));
    keyCell.onclick = (e) => copyToClipboard(param.key, e.clientX, e.clientY);

    // 参数值单元格
    const valCell = createEl('div', valCellStyles, {
      className: 'pv-cell pv-val-cell',
      title: '点击复制参数值',
    });
    const valueSpan = createValueSpan(param);
    valCell.appendChild(valueSpan);
    valCell.onclick = (e) => copyToClipboard(param.value, e.clientX, e.clientY);

    row.appendChild(keyCell);
    row.appendChild(valCell);
    rows.appendChild(row);

    return { cell: valCell, span: valueSpan, param: param, input: null };
  }

  // ==================== 模式切换 ====================
  function switchToEditMode(bindings, bar, popup) {
    popup.classList.add('editing');

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

  function switchToViewMode(bindings, bar, popup) {
    popup.classList.remove('editing');

    // 编辑值只在点「确定」时采纳，取消直接按模型重渲染
    for (const binding of bindings) {
      const span = createValueSpan(binding.param);

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
    setHover(closeButton, { background: COLORS.accentSoft });

    if (hasParams) {
      const editButton = createEl('button', primaryButtonStyles, { textContent: '编辑' });
      editButton.onclick = () => switchToEditMode(session.bindings, bar, popup);
      setHover(editButton, { background: COLORS.accentHover }, { background: COLORS.accent });
      viewModeGroup.appendChild(editButton);
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
    setHover(confirmButton, { background: COLORS.accentHover }, { background: COLORS.accent });

    const cancelButton = createEl('button', closeButtonStyles, { textContent: '取消' });
    cancelButton.onclick = () => switchToViewMode(session.bindings, bar, popup);
    setHover(cancelButton, { background: COLORS.accentSoft });

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
    let decodedHref = rawHref;
    try {
      decodedHref = decodeURIComponent(rawHref);
    } catch {
      // SPA 经 pushState 写入的 URL 可含裸 %，decode 会抛 URIError——回退原串，弹窗照常打开
    }
    const segments = parseUrl(decodedHref);

    const popup = createEl('div', popupStyles, {
      id: '11ze-url-reader-popup',
      className: 'popup url-reader-popup',
    });

    // 完整 URL 显示
    const fullUrlLabel = createEl('div', fullUrlLabelStyles, { textContent: '完整 URL' });
    popup.appendChild(fullUrlLabel);

    const fullUrlDiv = createEl('div', fullUrlStyles, {
      textContent: decodedHref,
    });
    popup.appendChild(fullUrlDiv);

    popup.appendChild(createSeparator());

    // 构建参数列表；多段时段与段之间加分隔线，段序号徽标也只在多段时出现
    const bindings = [];
    const multi = segments.length > 1;

    segments.forEach((segment, index) => {
      if (index > 0 && multi) {
        popup.appendChild(createSeparator());
      }

      popup.appendChild(createHostDiv(segment.host, index, multi ? index : null));

      if (segment.params.length === 0) return;

      const rows = createEl('div', rowsStyles);
      // -4 抵消 rows 自身 padding，行内容与段头文字左对齐，hover 底向外溢 4px
      rows.style.marginLeft = `${index * 20 - 4}px`;
      popup.appendChild(rows);
      for (const param of segment.params) {
        bindings.push(addParamRow(rows, param));
      }
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
