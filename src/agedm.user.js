// ==UserScript==
// @name         AGE 动漫优化
// @namespace    https://github.com/11ze
// @version      0.3.0
// @description  2026-11-12 合并 AGE 屏蔽、豆瓣评分与 AGE / 哔哩哔哩 / 豆瓣跨站搜索，沿用原 AGE 存储格式
// @author       11ze
// @license      MIT
// @match        *://*/*
// @noframes
// @icon         data:image/vnd.microsoft.icon;base64,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
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
  'use strict';

  const BLOCKED_KEY = 'agedmBlockedNames';
  const MIRROR_KEY = 'agedm-blocked-11ze';
  const RATING_KEY = 'agedmDoubanRatings';
  const RATING_MIRROR_KEY = 'agedm-douban-ratings-11ze';
  // 名字不一致弹窗的决定表（GM 单存即可：丢了只是多弹一次确认）
  const PROMPT_KEY = 'agedmRatingPromptChoices';
  const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  // 「相关书影音」为客户端异步渲染（load 事件时仍未出现），轮询等待用
  const RATING_POLL_MS = 500;
  const RATING_WAIT_MS = 15000;
  const ENABLED_KEY = 'agedmEnabled';
  const HIDDEN_ATTR = 'data-11ze-hidden';
  const BTN_MARK = 'data-11ze-btn';
  const BTN_CLASS = 'agedm-11ze-block-btn';
  const PANEL_CLASS = 'agedm-11ze-panel';
  const ENTRY_CLASS = 'agedm-11ze-entry';
  const DIALOG_CLASS = 'agedm-11ze-dialog';
  const TOAST_CLASS = 'agedm-11ze-toast';
  const WEEKDAY_MARK = 'data-11ze-weekday';
  // 站点自己的强调色（Bootstrap .btn-danger，登录按钮/日期胶囊在用），hover 深一档；站点换主题时跟调
  const SITE_ACCENT = '#dc3545';
  const SITE_ACCENT_HOVER = '#c82333';
  // 容器底色比站点背景 #2B2D33 略亮半档（同蓝灰色调），配合遮罩和描边从背景上「浮起」
  const SITE_SURFACE = '#343845';
  const SITE_TEXT = '#f0f1f4';
  const SITE_MUTED = '#b1b5c1';
  const SITE_DANGER_TEXT = '#ffabb3';
  // toast 用同色调带透明度（CSS 模板里没法对 hex 常量加 alpha，单独存一份）
  const SITE_SURFACE_ALPHA = 'rgba(52, 56, 69, 0.95)';

  // 日文曜日 → 中文星期：update 页分组按钮是「今天 (土曜日)」这类文本
  const WEEKDAY_MAP = { 月: '周一', 火: '周二', 水: '周三', 木: '周四', 金: '周五', 土: '周六', 日: '周日' };

  function isTargetPage(hostname = location.hostname, pathname = location.pathname) {
    return hostname.includes('agedm') && pathname === '/update';
  }

  // 豆瓣搜索页
  function isDoubanSearchPage(hostname = location.hostname, pathname = location.pathname) {
    return hostname === 'www.douban.com' && pathname === '/search';
  }

  // agedm 详情/播放页：pathname 形如 /detail/20250181、/play/20250181/{源}/{集}
  function isAnimePage(hostname = location.hostname, pathname = location.pathname) {
    return hostname.includes('agedm') && /^\/(detail|play)\/\d+/.test(pathname);
  }

  const UPDATE_CSS = `
    .${ENTRY_CLASS} {
      position: fixed;
      top: 90px;
      right: 25px;
      z-index: 9998;
      width: 36px;
      height: 36px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: ${SITE_ACCENT};
      color: #fff;
      font-size: 15px;
      cursor: pointer;
    }
    .${ENTRY_CLASS}:hover { background: ${SITE_ACCENT_HOVER}; }
    .${BTN_CLASS} {
      display: none;
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 10;
      width: 22px;
      height: 22px;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, 0.75);
      border-radius: 50%;
      background: ${SITE_ACCENT};
      color: #fff;
      font-size: 14px;
      box-sizing: border-box;
      place-items: center;
      cursor: pointer;
    }
    .video_item:hover .${BTN_CLASS}, .video_item:focus-within .${BTN_CLASS} { display: grid; }
    .${BTN_CLASS} svg {
      display: block;
      width: 12px;
      height: 12px;
      pointer-events: none;
    }
    .${BTN_CLASS}:hover { background: ${SITE_ACCENT_HOVER}; }
    .${PANEL_CLASS} {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      display: none;
      flex-direction: column;
      color-scheme: dark;
      width: 440px;
      max-width: calc(100vw - 32px);
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0;
      background: ${SITE_SURFACE};
      color: ${SITE_TEXT};
      font-size: 14px;
      line-height: 1.55;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
    }
    .${PANEL_CLASS}, .${PANEL_CLASS} * { box-sizing: border-box; }
    .${PANEL_CLASS}-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 18px;
    }
    .${PANEL_CLASS} h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .${PANEL_CLASS}-count {
      margin-left: 9px;
      color: ${SITE_MUTED};
      font-size: 12px;
      font-weight: 400;
    }
    .${PANEL_CLASS}-enable {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 0 24px 16px;
      padding: 14px 16px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9px;
      background: rgba(255, 255, 255, 0.055);
    }
    .${PANEL_CLASS}-toggle {
      flex-shrink: 0;
      width: 38px;
      height: 22px;
      padding: 3px;
      border: 0;
      border-radius: 20px;
      background: ${SITE_ACCENT};
      cursor: pointer;
    }
    .${PANEL_CLASS}-toggle::after {
      content: '';
      display: block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      transform: translateX(16px);
    }
    .${PANEL_CLASS}-toggle[aria-checked="false"] { background: rgba(255, 255, 255, 0.3); }
    .${PANEL_CLASS}-toggle[aria-checked="false"]::after { transform: translateX(0); }
    .${PANEL_CLASS}-list {
      flex-shrink: 1;
      min-height: 0;
      margin: 0;
      padding: 0 24px;
      max-height: 37vh;
      overflow-y: auto;
      overscroll-behavior: contain;
      list-style: none;
    }
    .${PANEL_CLASS}-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      padding: 15px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .${PANEL_CLASS}-list li:last-child { border-bottom: 0; }
    .${PANEL_CLASS}-list li span { overflow-wrap: anywhere; }
    .${PANEL_CLASS}-list button, .${PANEL_CLASS}-actions button {
      padding: 7px 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.055);
      color: ${SITE_TEXT};
      font: inherit;
      font-size: 12px;
      white-space: nowrap;
      cursor: pointer;
    }
    .${PANEL_CLASS}-list button {
      padding: 5px 10px;
      background: transparent;
      color: ${SITE_MUTED};
    }
    .${PANEL_CLASS}-list button:hover, .${PANEL_CLASS}-actions button:hover { background: rgba(255, 255, 255, 0.11); }
    .${PANEL_CLASS}-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    .${PANEL_CLASS}-actions .${PANEL_CLASS}-clear {
      margin-left: auto;
      color: ${SITE_DANGER_TEXT};
      border-color: transparent;
      background: transparent;
    }
    .${PANEL_CLASS}-empty {
      margin: 0;
      padding: 30px 0 38px;
      text-align: center;
      color: ${SITE_MUTED};
    }
    .${PANEL_CLASS}-close {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 7px;
      background: transparent;
      color: ${SITE_MUTED};
      font-size: 23px;
      cursor: pointer;
    }
    .${PANEL_CLASS}-close svg {
      width: 16px;
      height: 16px;
    }
    .${PANEL_CLASS}-close:hover { background: rgba(255, 255, 255, 0.055); }
    .${PANEL_CLASS} button:focus-visible, .${ENTRY_CLASS}:focus-visible, .${BTN_CLASS}:focus-visible {
      outline: 2px solid ${SITE_TEXT};
      outline-offset: 3px;
    }
  `;
  const OVERLAY_CSS = `
    .${DIALOG_CLASS} {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
    }
    .${DIALOG_CLASS}, .${DIALOG_CLASS} * { box-sizing: border-box; }
    .${DIALOG_CLASS}-box {
      color-scheme: dark;
      width: 440px;
      max-width: calc(100vw - 32px);
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 24px;
      background: ${SITE_SURFACE};
      color: ${SITE_TEXT};
      font-size: 14px;
      line-height: 1.55;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
    }
    .${DIALOG_CLASS}-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
    }
    .${DIALOG_CLASS}-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .${DIALOG_CLASS}-close {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 7px;
      background: transparent;
      color: ${SITE_MUTED};
      cursor: pointer;
    }
    .${DIALOG_CLASS}-close svg {
      width: 16px;
      height: 16px;
    }
    .${DIALOG_CLASS}-box p {
      margin: 0 0 20px;
      color: ${SITE_MUTED};
      overflow-wrap: anywhere;
    }
    .${DIALOG_CLASS}-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .${DIALOG_CLASS}-actions.col { flex-direction: column; }
    .${DIALOG_CLASS}-actions:not(.col) button:first-child { order: 1; }
    .${DIALOG_CLASS}-actions button {
      padding: 9px 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.055);
      color: ${SITE_TEXT};
      font: inherit;
      cursor: pointer;
    }
    .${DIALOG_CLASS}-actions button:hover, .${DIALOG_CLASS}-close:hover { background: rgba(255, 255, 255, 0.11); }
    .${DIALOG_CLASS}-actions button:first-child {
      background: ${SITE_ACCENT};
      color: #fff;
      border-color: transparent;
    }
    .${DIALOG_CLASS}-actions button:first-child:hover { background: ${SITE_ACCENT_HOVER}; }
    .${DIALOG_CLASS}-box input {
      width: 100%;
      margin-bottom: 20px;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.055);
      color: ${SITE_TEXT};
      font: inherit;
      font-size: 22px;
    }
    .${DIALOG_CLASS} button:focus-visible, .${DIALOG_CLASS} input:focus-visible {
      outline: 2px solid ${SITE_TEXT};
      outline-offset: 3px;
    }
    .${DIALOG_CLASS}-compare {
      display: grid;
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.055);
      overflow-wrap: anywhere;
    }
    .${DIALOG_CLASS}-compare small {
      display: block;
      margin-bottom: 3px;
      color: ${SITE_MUTED};
    }
    .${TOAST_CLASS} {
      position: fixed;
      left: 50%;
      bottom: 36px;
      transform: translateX(-50%);
      z-index: 10001;
      padding: 11px 20px;
      background: ${SITE_SURFACE_ALPHA};
      color: #fff;
      font-size: 14px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 9px;
      max-width: calc(100vw - 32px);
      width: max-content;
    }
  `;


  // 样式按需注入：update 页用全部组件样式，豆瓣页只用浮层样式（弹窗/toast），详情/播放页复用站点样式不注入
  function injectStyle(css) {
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  let enabled = true;
  const injectedButtons = [];
  let entryBtn = null;
  // 面板元素引用：buildPanel 构建一次，null 即未构建
  let panelBox = null;

  // 镜像仓库：GM 主存（跨设备脚本导入导出会整包覆盖）+ 当前域名 localStorage 镜像（导入碰不到）。
  // 裁决语义按数据不同（见两个实例），骨架一致：load 读两边→裁决→胜者回写两边；clear 删键不留空值
  function createMirrorStore({ gmKey, mirrorKey, readGm, readMirror, merge }) {
    function load() {
      const gm = readGm(GM_getValue(gmKey, null));
      let mirror = null;
      try {
        mirror = readMirror(JSON.parse(localStorage.getItem(mirrorKey)));
      } catch {
        // 镜像损坏视同无键
      }
      if (!gm && !mirror) return null;
      const winner = merge(gm, mirror);
      save(winner);
      return winner;
    }

    function save(value) {
      GM_setValue(gmKey, value);
      try {
        localStorage.setItem(mirrorKey, JSON.stringify(value));
      } catch {
        // localStorage 不可写（禁 cookie 等）时降级只写 GM，主存仍为准
      }
    }

    function clear() {
      GM_deleteValue(gmKey);
      localStorage.removeItem(mirrorKey);
    }

    return { load, save, clear };
  }

  // 屏蔽名单仓库：整包裁决——两边比 at 新者胜，相同视为 GM 胜（ADR 0001，单一 list 才能整包定胜负）
  const blockedStore = createMirrorStore({
    gmKey: BLOCKED_KEY,
    mirrorKey: MIRROR_KEY,
    readGm: (raw) => {
      if (Array.isArray(raw)) return { list: raw, at: 0 }; // 旧版裸数组，视为最旧，首次回写即升级
      if (raw && Array.isArray(raw.list)) return raw;
      return null;
    },
    readMirror: (raw) => (raw && Array.isArray(raw.list) && typeof raw.at === 'number' ? raw : null),
    merge: (gm, mirror) => {
      const winner = mirror && (!gm || mirror.at > gm.at) ? mirror : gm;
      if (winner === mirror) console.info('agedm：GM 存储名单较旧或缺失，已从本域名镜像恢复');
      return winner;
    },
  });

  // 评分快照仓库：逐条合并——同 key 比 at 新者胜，相同视为 GM 胜（ADR 0002，多部动漫的字典不能整包裁决）
  const ratingStore = createMirrorStore({
    gmKey: RATING_KEY,
    mirrorKey: RATING_MIRROR_KEY,
    readGm: filterRatings,
    readMirror: filterRatings,
    merge: (gm, mirror) => mergeRatings(mirror ?? {}, gm ?? {}),
  });

  // 屏蔽名单：动词收口——改名单、双写持久化、重扫卡片、面板刷新一次完成。
  // Set 本体与 {list, at} 序列化是内部实现，调用方不再触碰
  const blocklist = (() => {
    let names = new Set();

    function persist() {
      blockedStore.save({ list: [...names], at: Date.now() });
    }

    function refresh() {
      scanCards();
      refreshList();
    }

    return {
      load() {
        names = new Set(blockedStore.load()?.list ?? []);
      },
      has: (name) => names.has(name),
      items: () => [...names],
      add(name) {
        names.add(name);
        persist();
        refresh();
      },
      remove(name) {
        names.delete(name);
        persist();
        refresh();
      },
      clearAll() {
        names.clear();
        // 清空即删键：避免留下"空但有键"的状态与镜像恢复规则互相打架
        blockedStore.clear();
        refresh();
      },
      replace(list) {
        names = new Set(list);
        persist();
        refresh();
      },
    };
  })();

  function isValidRatingEntry(entry) {
    return Boolean(entry) && typeof entry === 'object'
      && (entry.rating === null || typeof entry.rating === 'number')
      && typeof entry.name === 'string' && entry.name
      && typeof entry.at === 'number';
  }

  function filterRatings(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    for (const [key, entry] of Object.entries(raw)) {
      if (isValidRatingEntry(entry)) out[key] = entry;
    }
    return out;
  }

  // 合并两份字典：同 key 取 at 新者，相同 at 时第二参（override）胜
  function mergeRatings(base, override) {
    const out = { ...base };
    for (const [key, entry] of Object.entries(override)) {
      const existing = out[key];
      if (!existing || (entry.at || 0) >= (existing.at || 0)) out[key] = entry;
    }
    return out;
  }

  function loadRatings() {
    return ratingStore.load() ?? {};
  }

  function getCardTitle(card) {
    return (card.querySelector('.video_item-title a')?.textContent ?? '').trim();
  }

  // 全量重扫：命中且开关开 → 隐藏外层 col；此前由脚本隐藏的 → 恢复
  function scanCards() {
    for (const card of document.querySelectorAll('.video_item')) {
      const col = card.closest('.col');
      if (!col) continue;
      const title = getCardTitle(card);
      if (enabled && title && blocklist.has(title)) {
        col.style.display = 'none';
        col.setAttribute(HIDDEN_ATTR, '1');
      } else if (col.getAttribute(HIDDEN_ATTR) === '1') {
        col.style.display = '';
        col.removeAttribute(HIDDEN_ATTR);
      }
    }
  }

  function appendCrossIcon(button) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 3L9 9M9 3L3 9');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    button.appendChild(svg);
  }

  function ensureBlockButtons() {
    if (!enabled) return;
    for (const card of document.querySelectorAll('.video_item')) {
      if (card.hasAttribute(BTN_MARK)) continue;
      const image = card.querySelector('.video_item--image');
      if (!image) continue;
      card.setAttribute(BTN_MARK, '1');

      const btn = document.createElement('button');
      btn.className = BTN_CLASS;
      btn.type = 'button';
      appendCrossIcon(btn);
      btn.setAttribute('aria-label', '屏蔽这部动漫');
      btn.title = '屏蔽这部动漫';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToBlocked(getCardTitle(card));
      });
      image.appendChild(btn);
      injectedButtons.push(btn);
    }
  }

  function removeBlockButtons() {
    for (const btn of injectedButtons.splice(0)) btn.remove();
    for (const card of document.querySelectorAll('.video_item')) {
      card.removeAttribute(BTN_MARK);
    }
  }

  // 分组按钮的日文曜日括号内加中文星期（今天 (土曜日/周六)）；同页的登录/提交等红色按钮靠文本过滤排除
  function annotateWeekdays() {
    for (const btn of document.querySelectorAll('.btn-danger')) {
      if (btn.hasAttribute(WEEKDAY_MARK)) continue;
      const day = btn.textContent.match(/([月火水木金土日])曜日/)?.[1];
      if (!day) continue;
      btn.setAttribute(WEEKDAY_MARK, '1');
      btn.textContent = btn.textContent.replace(/曜日\)/, `曜日/${WEEKDAY_MAP[day]})`);
    }
  }

  function refreshList() {
    if (panelBox) renderPanelList();
  }

  // 浮层栈：Esc 关闭最上层；名单面板不锁网站滚动，一次性弹窗锁滚动。
  // 唯一进出协议：entry 在自己的 close 里摘除自己
  const overlayStack = [];
  const panelEntry = { close: closePanel };

  function syncScrollLock() {
    document.documentElement.style.overflow = overlayStack.some((entry) => entry !== panelEntry) ? 'hidden' : '';
  }

  function handleEscape(e) {
    if (e.key === 'Escape') overlayStack[overlayStack.length - 1]?.close();
  }

  // 一次性弹窗：创建容器、遮罩点击、销毁、Promise 收尾全包；
  // build(box, close) 填充内容，close(result) 关闭并 resolve，点遮罩/Esc 走 escapeResult
  function showOverlay({ build, escapeResult }) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = DIALOG_CLASS;
      let closed = false;
      const entry = { close: () => close(escapeResult) };
      const close = (result) => {
        if (closed) return;
        closed = true;
        el.remove();
        overlayStack.splice(overlayStack.indexOf(entry), 1);
        syncScrollLock();
        resolve(result);
      };
      el.addEventListener('click', (e) => {
        if (e.target === el) close(escapeResult);
      });
      const box = document.createElement('div');
      box.className = `${DIALOG_CLASS}-box`;
      build(box, close);
      el.appendChild(box);
      document.body.appendChild(el);
      overlayStack.push(entry);
      syncScrollLock();
    });
  }

  function appendDialogHeader(box, title, onClose) {
    const header = document.createElement('div');
    header.className = `${DIALOG_CLASS}-header`;
    const heading = document.createElement('h3');
    heading.textContent = title;
    header.appendChild(heading);
    const button = mkBtn('', onClose);
    button.className = `${DIALOG_CLASS}-close`;
    button.setAttribute('aria-label', '关闭弹窗');
    appendCrossIcon(button);
    header.appendChild(button);
    box.appendChild(header);
  }

  // 自绘确认弹窗（原生 confirm 有可感知延迟）：确认/取消/点遮罩/Esc 均立即关闭
  function showDialog(message) {
    return showOverlay({
      escapeResult: false,
      build: (box, close) => {
        appendDialogHeader(box, '确认操作', () => close(false));
        const msg = document.createElement('p');
        msg.textContent = message;
        box.appendChild(msg);
        const actions = document.createElement('div');
        actions.className = `${DIALOG_CLASS}-actions`;
        actions.appendChild(mkBtn('确认', () => close(true)));
        actions.appendChild(mkBtn('取消', () => close(false)));
        box.appendChild(actions);
      },
    });
  }

  // 无需用户操作的提示用 toast（原生 alert 需手动点掉）
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = TOAST_CLASS;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  async function addToBlocked(name) {
    const trimmed = String(name).trim();
    if (!trimmed) return;
    if (!(await showDialog(`屏蔽「${trimmed}」？`))) return;
    blocklist.add(trimmed);
  }

  async function removeFromBlocked(name) {
    if (!(await showDialog(`把「${name}」移出屏蔽名单？`))) return;
    blocklist.remove(name);
  }

  async function clearBlocked() {
    const size = blocklist.items().length;
    if (size && !(await showDialog(`清空全部屏蔽名单（${size} 项）？`))) return;
    blocklist.clearAll();
  }

  // 导入合并：过滤非字符串、trim、去空，与现有名单去重合并
  function mergeImported(imported) {
    const merged = new Set(blocklist.items());
    for (const item of imported) {
      if (typeof item !== 'string') continue;
      const name = item.trim();
      if (name) merged.add(name);
    }
    return [...merged];
  }

  function setEnabled(next) {
    enabled = next;
    GM_setValue(ENABLED_KEY, enabled);
    if (panelBox) {
      panelBox.status.textContent = enabled ? '屏蔽已启用' : '屏蔽已停用';
      panelBox.toggleBtn.setAttribute('aria-checked', String(enabled));
    }
    if (enabled) ensureBlockButtons();
    else removeBlockButtons();
    scanCards();
  }

  // update 页右缘入口圆钮（header 下方、与站点回顶按钮同列），点击切换管理面板
  function ensureEntry() {
    if (entryBtn) return;
    entryBtn = document.createElement('button');
    entryBtn.className = ENTRY_CLASS;
    entryBtn.type = 'button';
    entryBtn.textContent = '屏';
    entryBtn.title = '屏蔽管理';
    entryBtn.addEventListener('click', () => {
      if (overlayStack.includes(panelEntry)) closePanel();
      else openPanel();
    });
    document.body.appendChild(entryBtn);
  }

  function mkBtn(label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function openPanel() {
    if (overlayStack.includes(panelEntry)) return;
    if (!panelBox) panelBox = buildPanel();
    renderPanelList();
    panelBox.root.style.display = 'flex';
    overlayStack.push(panelEntry);
    syncScrollLock();
  }

  function closePanel() {
    if (!panelBox) return;
    const index = overlayStack.indexOf(panelEntry);
    if (index !== -1) overlayStack.splice(index, 1);
    panelBox.root.style.display = 'none';
    syncScrollLock();
  }

  function buildPanel() {
    const root = document.createElement('div');
    root.className = PANEL_CLASS;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', '屏蔽名单');

    const header = document.createElement('div');
    header.className = `${PANEL_CLASS}-header`;
    const title = document.createElement('h3');
    title.textContent = '屏蔽名单';
    const count = document.createElement('span');
    count.className = `${PANEL_CLASS}-count`;
    title.appendChild(count);
    header.appendChild(title);
    const closeBtn = mkBtn('', closePanel);
    appendCrossIcon(closeBtn);
    closeBtn.className = `${PANEL_CLASS}-close`;
    closeBtn.setAttribute('aria-label', '关闭屏蔽名单');
    header.appendChild(closeBtn);
    root.appendChild(header);

    const toggleRow = document.createElement('div');
    toggleRow.className = `${PANEL_CLASS}-enable`;
    const status = document.createElement('strong');
    status.className = `${PANEL_CLASS}-status`;
    status.textContent = enabled ? '屏蔽已启用' : '屏蔽已停用';
    toggleRow.appendChild(status);
    const toggleBtn = mkBtn('', () => setEnabled(!enabled));
    toggleBtn.className = `${PANEL_CLASS}-toggle`;
    toggleBtn.setAttribute('role', 'switch');
    toggleBtn.setAttribute('aria-label', '启用屏蔽');
    toggleBtn.setAttribute('aria-checked', String(enabled));
    toggleRow.appendChild(toggleBtn);
    root.appendChild(toggleRow);

    const list = document.createElement('ul');
    list.className = `${PANEL_CLASS}-list`;
    root.appendChild(list);

    const actions = document.createElement('div');
    actions.className = `${PANEL_CLASS}-actions`;
    actions.appendChild(mkBtn('导入', () => fileInput.click()));
    actions.appendChild(mkBtn('导出', exportList));
    const clearBtn = mkBtn('清空名单', clearBlocked);
    clearBtn.className = `${PANEL_CLASS}-clear`;
    actions.appendChild(clearBtn);
    root.appendChild(actions);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!Array.isArray(parsed)) throw new Error('not array');
          blocklist.replace(mergeImported(parsed));
        } catch {
          showToast('导入失败：文件需为 JSON 字符串数组');
        }
        fileInput.value = '';
      };
      reader.readAsText(file);
    });
    root.appendChild(fileInput);

    document.body.appendChild(root);
    return { root, list, toggleBtn, status, count, fileInput };
  }

  function renderPanelList() {
    panelBox.list.innerHTML = '';
    const names = blocklist.items().reverse();
    panelBox.count.textContent = `${names.length} 项`;
    if (!names.length) {
      const empty = document.createElement('p');
      empty.className = `${PANEL_CLASS}-empty`;
      empty.textContent = '暂无屏蔽的动漫';
      panelBox.list.appendChild(empty);
      return;
    }
    for (const name of names) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = name;
      li.appendChild(span);
      li.appendChild(mkBtn('移出名单', () => removeFromBlocked(name)));
      panelBox.list.appendChild(li);
    }
  }

  function exportList() {
    const blob = new Blob([JSON.stringify(blocklist.items(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agedm-屏蔽名单.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // 片名归一化：trim、折叠连续空白（含全角空格）、转小写——搜索词与豆瓣条目名、agedm 片名的比对基准
  function normalizeName(name) {
    return String(name).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // 「相关书影音」智能卡（2026 版豆瓣搜索 DOM）：第一个 [电视剧]/[电影] 条目，无评分记 null；类名改版时返回 null 静默降级
  function findDoubanEntry() {
    for (const li of document.querySelectorAll('li.DouWeb-SR-search-result-list-smart-box-card')) {
      const typeName = li.querySelector('.DouWeb-SR-subject-info-type-name')?.textContent?.trim();
      if (typeName !== '[电视剧]' && typeName !== '[电影]') continue;
      const name = li.querySelector('.DouWeb-SR-subject-info-name')?.textContent?.trim();
      if (!name) continue;
      const ratingText = li.querySelector('.frc-rating-num')?.textContent?.trim();
      const rating = Number.parseFloat(ratingText);
      return { name, rating: Number.isFinite(rating) ? rating : null };
    }
    return null;
  }

  // 决定表：bind 永久生效；skip 记录时间，冷却 7 天内不再弹
  function getPromptChoice(query, name) {
    const entry = GM_getValue(PROMPT_KEY, {})[`${query}=>${name}`];
    if (entry?.choice === 'bind') return 'bind';
    if (entry?.choice === 'skip' && typeof entry.at === 'number'
      && Date.now() - entry.at < PROMPT_COOLDOWN_MS) return 'skip';
    return 'ask';
  }

  function setPromptChoice(query, name, choice) {
    const table = GM_getValue(PROMPT_KEY, {});
    table[`${query}=>${name}`] = { choice, at: Date.now() };
    GM_setValue(PROMPT_KEY, table);
  }

  // 写评分快照：keys 内各名字（绑定后的搜索词+条目名）共用同一条记录；key 统一归一化，
  // 调用方传原始名也不会造出旁路 key（与 matchRating 共享同一 key 空间）
  function writeRating(keys, entry) {
    const ratings = loadRatings();
    const record = { ...entry, at: Date.now() };
    for (const key of keys) ratings[normalizeName(key)] = record;
    ratingStore.save(ratings);
  }

  // 名字不一致时的多选项弹窗，Esc/遮罩等同「本次不记录」
  function showRatingDialog(query, entry) {
    return showOverlay({
      escapeResult: 'none',
      build: (box, close) => renderRatingChoice(box, query, entry, close),
    });
  }

  function renderRatingChoice(box, query, entry, close) {
    for (const child of [...box.children]) child.remove();
    appendDialogHeader(box, '确认动漫名称', () => close('none'));
    const score = entry.rating === null ? '暂无评分' : `评分 ${entry.rating}`;
    const msg = document.createElement('p');
    msg.textContent = '豆瓣结果与搜索词不同，请选择记录方式。';
    box.appendChild(msg);
    const compare = document.createElement('div');
    compare.className = `${DIALOG_CLASS}-compare`;
    for (const [label, value] of [['搜索词', query], ['豆瓣结果', `${entry.name}（${score}）`]]) {
      const row = document.createElement('div');
      const caption = document.createElement('small');
      caption.textContent = label;
      const name = document.createElement('strong');
      name.textContent = value;
      row.appendChild(caption);
      row.appendChild(name);
      compare.appendChild(row);
    }
    box.appendChild(compare);
    const actions = document.createElement('div');
    actions.className = `${DIALOG_CLASS}-actions col`;
    actions.appendChild(mkBtn('绑定并记录两条', () => close('bind')));
    actions.appendChild(mkBtn('仅记录搜索词', () => close('only')));
    actions.appendChild(mkBtn('手动改分', () => renderManualRating(box, query, entry, close)));
    actions.appendChild(mkBtn('本次不记录', () => close('none')));
    box.appendChild(actions);
  }

  // 手动改分输入模式：只填分数，记录仍落在搜索词条目上
  function renderManualRating(box, query, entry, close) {
    for (const child of [...box.children]) child.remove();
    appendDialogHeader(box, '手动记录评分', () => close('none'));
    const msg = document.createElement('p');
    msg.textContent = `手动记录「${query}」的豆瓣评分（0-10，可一位小数）`;
    box.appendChild(msg);
    const input = document.createElement('input');
    input.type = 'number';
    input.setAttribute('aria-label', '豆瓣评分（0-10，可一位小数）');
    input.min = '0';
    input.max = '10';
    input.step = '0.1';
    box.appendChild(input);
    const actions = document.createElement('div');
    actions.className = `${DIALOG_CLASS}-actions col`;
    actions.appendChild(mkBtn('确认', () => {
      const value = Number.parseFloat(input.value);
      if (!Number.isFinite(value) || value < 0 || value > 10) {
        showToast('请输入 0-10 的数字');
        return;
      }
      close({ manual: Math.round(value * 10) / 10 });
    }));
    actions.appendChild(mkBtn('返回', () => renderRatingChoice(box, query, entry, close)));
    box.appendChild(actions);
  }

  // 异步渲染轮询：首次检查由调用方同步完成，命中即零等待；间隔重试至真值或超时
  async function waitFor(fn) {
    for (let waited = 0; waited < RATING_WAIT_MS; waited += RATING_POLL_MS) {
      await new Promise((resolve) => setTimeout(resolve, RATING_POLL_MS));
      const result = fn();
      if (result) return result;
    }
    return null;
  }

  // 评分弹窗答案 → 写入决定（纯函数）：bind 永久绑定记两条；only/manual 记搜索词并 skip 冷却；none 只记 skip
  function resolveRatingAnswer(queryKey, nameKey, entry, answer) {
    if (answer === 'bind') {
      return { choice: 'bind', keys: [queryKey, nameKey], entry };
    }
    if (answer === 'only') {
      return { choice: 'skip', keys: [queryKey], entry };
    }
    if (answer && typeof answer.manual === 'number') {
      return { choice: 'skip', keys: [queryKey], entry: { name: entry.name, rating: answer.manual } };
    }
    return { choice: 'skip' };
  }

  // 豆瓣搜索页：结果名与搜索词一致或已有决定时静默记录，否则弹窗确认
  async function initDoubanPage() {
    injectStyle(OVERLAY_CSS);
    const query = new URLSearchParams(location.search).get('q')?.trim();
    if (!query) return;
    let entry = findDoubanEntry();
    if (!entry) entry = await waitFor(findDoubanEntry);
    if (!entry) return;
    const queryKey = normalizeName(query);
    const nameKey = normalizeName(entry.name);
    if (queryKey === nameKey) {
      writeRating([queryKey], entry);
      return;
    }
    const choice = getPromptChoice(queryKey, nameKey);
    if (choice !== 'ask') {
      // 既定决定与弹窗答案走同一条决策路径：bind 记两条，skip（视为 only）记搜索词
      const decision = resolveRatingAnswer(queryKey, nameKey, entry, choice === 'bind' ? 'bind' : 'only');
      if (decision.keys) writeRating(decision.keys, decision.entry);
      return;
    }
    document.addEventListener('keydown', handleEscape);
    const answer = await showRatingDialog(query, entry);
    const decision = resolveRatingAnswer(queryKey, nameKey, entry, answer);
    setPromptChoice(queryKey, nameKey, decision.choice);
    if (decision.keys) writeRating(decision.keys, decision.entry);
  }

  // 标题元素可能被其他脚本挂上按钮子元素（如跨站搜索按钮），收集文本时跳过 button 子树，
  // 不用正则剥字（防误剥标题原文）；nodeType 用字面量（1 元素、3 文本）
  function collectTitleText(node) {
    let text = '';
    for (const child of node.childNodes) {
      if (child.nodeType === 3) text += child.textContent;
      else if (child.nodeType === 1 && child.tagName.toUpperCase() !== 'BUTTON') {
        text += collectTitleText(child);
      }
    }
    return text;
  }

  // agedm 片名：detail 页是页面级 h2.video_detail_title，play 页是 .card-body 的 h5.card-title
  // （detail 页 card-title 是「基本信息」等区块名，不能当片名）
  function collectAnimeNames() {
    const titleEl = document.querySelector('.video_detail_title') ?? document.querySelector('.card-title');
    const title = titleEl ? collectTitleText(titleEl).trim() : '';
    const names = title ? [normalizeName(title)] : [];
    // 详情行两套结构：detail 页 li 内 tag/value 两个 span，play 页 .video_detail_info 整行文本，textContent 都聚合成「label：值」
    const rows = [
      ...document.querySelectorAll('.detail_imform_list li'),
      ...document.querySelectorAll('.video_detail_info'),
    ];
    for (const row of rows) {
      const match = row.textContent.trim().match(/^(原版名称|其他名称)：([\s\S]*)$/);
      if (!match) continue;
      if (match[1] === '原版名称') names.push(normalizeName(match[2]));
      else for (const part of match[2].split(/[、，,／/]/)) names.push(normalizeName(part));
    }
    return names.filter(Boolean);
  }

  // 多个名字都命中时取记录时间最新的（绑定两条独立刷新可能分数不一，以此自愈）；
  // 名字统一归一化再查，调用方传原始名也能命中
  function matchRating(names, ratings) {
    let best = null;
    for (const name of names) {
      const entry = ratings[normalizeName(name)];
      if (entry && (!best || entry.at > best.at)) best = entry;
    }
    return best;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 追加评分行，贴各页原有行结构：detail 页 li(tag/value)，play 页 div.video_detail_info
  function appendRatingRow(entry) {
    const score = entry.rating === null ? '暂无' : `${entry.rating}`;
    const verb = entry.rating === null ? '查过' : '记录';
    const rest = `（${entry.name}，${formatDate(entry.at)} ${verb}）`;
    // 分数单独成 span：染豆瓣评分橙（.frc-rating-num 同色）+ 加粗，与站点灰底信息行拉开反差
    const scoreEl = document.createElement('span');
    scoreEl.textContent = score;
    scoreEl.style.color = '#ff9900';
    scoreEl.style.fontWeight = '600';
    const formList = document.querySelector('.detail_imform_list');
    if (formList) {
      const li = document.createElement('li');
      const tag = document.createElement('span');
      tag.className = 'detail_imform_tag';
      tag.textContent = '豆瓣评分：';
      const val = document.createElement('span');
      val.className = 'detail_imform_value';
      val.appendChild(scoreEl);
      val.append(rest);
      li.appendChild(tag);
      li.appendChild(val);
      formList.appendChild(li);
      return;
    }
    const cardBody = document.querySelector('.card-body');
    if (!cardBody) return;
    const row = document.createElement('div');
    row.className = 'video_detail_info';
    const label = document.createElement('span');
    label.textContent = '豆瓣评分：';
    row.appendChild(label);
    row.appendChild(scoreEl);
    row.append(rest);
    cardBody.appendChild(row);
  }

  // agedm 详情/播放页：纯被动展示，未命中不加行；页面为异步渲染，等详情行出现再匹配，超时放弃
  async function initRatingRow() {
    const hasRows = () => document.querySelector('.detail_imform_list') || document.querySelector('.video_detail_info');
    if (!hasRows() && !await waitFor(hasRows)) return;
    const entry = matchRating(collectAnimeNames(), loadRatings());
    if (entry) appendRatingRow(entry);
  }

  // 加载完成后轻推滚动 1px 再复原：下移与复位隔一帧，站点的懒加载/滚动监听才观察得到
  // 这次位移（同帧内 +1 再 -1 净移为零，scroll 事件可能不触发）；复位用记录的 scrollY
  // 而非 -1，防页面停在底部时 +1 被钳制、-1 反而净上移；instant 防站点 smooth 滚动成动画
  function nudgeScroll() {
    const y = window.scrollY;
    window.scrollBy({ top: 1, behavior: 'instant' });
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
  }

  function initUpdatePage() {
    injectStyle(UPDATE_CSS + OVERLAY_CSS);
    enabled = GM_getValue(ENABLED_KEY, true);
    blocklist.load();
    ensureEntry();
    // Esc 关闭最上层浮层：确认弹窗优先于面板
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', (e) => {
      if (overlayStack[overlayStack.length - 1] !== panelEntry) return;
      if (e.target.closest(`.${PANEL_CLASS}`) || e.target.closest(`.${ENTRY_CLASS}`)
        || e.target.closest(`.${DIALOG_CLASS}`)) return;
      closePanel();
    });
    new MutationObserver(() => {
      ensureBlockButtons();
      scanCards();
      annotateWeekdays();
    }).observe(document.body, { childList: true, subtree: true });
    ensureBlockButtons();
    scanCards();
    annotateWeekdays();
    // 加载完成后轻推一次滚动（见 nudgeScroll 注释）；document-idle 时通常未到 load，挂监听等
    if (document.readyState === 'complete') nudgeScroll();
    else window.addEventListener('load', nudgeScroll);
  }

  // 搜索与评分独立分派：豆瓣搜索页记录评分，条目页提供搜索入口。
  function initAnimeSearch() {
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
  }

  initAnimeSearch();

  if (isDoubanSearchPage()) initDoubanPage();
  else if (isAnimePage()) initRatingRow();
  else if (isTargetPage()) initUpdatePage();
  else return;

  // 测试钩子：浏览器中 __AGEDM_TEST__ 不存在，此分支永不执行
  if (window.__AGEDM_TEST__) {
    window.__AGEDM_TEST__.hooks = {
      isTargetPage,
      isDoubanSearchPage,
      isAnimePage,
      mergeRatings,
      loadRatings,
      resolveRatingAnswer,
      writeRating,
      matchRating,
      normalizeName,
      findDoubanEntry,
      getCardTitle,
      scanCards,
      ensureBlockButtons,
      addToBlocked,
      removeFromBlocked,
      clearBlocked,
      mergeImported,
      setEnabled,
      ensureEntry,
      openPanel,
      annotateWeekdays,
    };
  }
})();
