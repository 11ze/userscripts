// ==UserScript==
// @name        改善 JVS 开发体验
// @namespace   https://github.com/11ze
// @match       *://*/*
// @noframes
// @icon        data:image/png;base64,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
// @grant       GM_addStyle
// @license     MIT
// @author      11ze
// @version     0.3.5
// @description 2025-12-01
// ==/UserScript==

// 检查是否包含 jvs-ui 的 link 标签
const isJVS = (isLogFunction) => {
  const links = document.getElementsByTagName('link');
  for (const link of links) {
    const matchList = ['jvs-ui', 'edf-ui'];

    if (link.href && matchList.some((match) => link.href.includes(match))) {
      let message = '%c「改善 JVS 开发体验」已检测到 JVS 环境';
      if (isLogFunction) {
        message += '（日志功能）';
      }
      console.log(message, 'color: #0099ff;');
      return true;
    }
  }
  return false;
};

(function () {
  'use strict';

  if (!isJVS(false)) {
    return;
  }
  setInterval(() => {
    const operations = [
      expandNames,
      changeTitle,
      enterAppCenter,
      enterTabDesign,
      adjustInterfaceAndComponentStyle,
      addButtonToOpenNewLogicDesign,
      addButtonToOpenNewLogicDesignForNestedLogicFirst,
      addButtonToCopyDesignName,
      addButtonToCopyComponentName,
      expandFormButton,
      addButtonToClearAllFields,
      expandLogicVariableButton,
      addButtonToOpenNewFormOrListDesign,
      highlightApps,
      expandFormDesignAllComponentSettings,
      autoExpandComponentLibraryCategory,
      applicationSetClick,
      showNodeExecTime,
      // setCanvasScroll,
    ];

    for (const operation of operations) {
      try {
        operation();
      } catch (error) {
        console.error('「改善 JVS 开发体验」' + operation.name + ' 运行错误：');
        console.error(error);
      }
    }
  }, 400);

  // changeTitle
  const envList = [
    { ip: 'dev.', env: '开发站' },
    { ip: 'test.', env: '测试站' },
    { ip: '47.107.', env: '正式站' },
  ];

  const designMapping = {
    逻辑设计: '逻',
    列表设计: '列',
    表单设计: '表',
    流程设计: '流',
  };

  // log
  const designSetting = {
    逻辑设计: { color: 'blue', shortname: '逻辑' },
    列表设计: { color: 'orange', shortname: '列表' },
    表单设计: { color: 'green', shortname: '表单' },
    流程设计: { color: 'purple', shortname: '流程' },
  };
  const logsLocalStorageKey = '__11ze_JVS_LOG_LOGS_';
  const logOptionsLocalStorageKey = '__11ze_JVS_LOG_OPTIONS_';
  // value 是日志对象的 key
  const logOptions = [
    {
      label: '设计',
      value: 'tabType',
      options: ['全部', '逻辑', '表单', '列表', '流程'],
      selected: '全部',
    },
    {
      label: '类型',
      value: 'type',
      options: ['全部', '打开', '保存'],
      selected: '全部',
    },
  ];
  const logSaveDays = 365;
  window.designSetting = designSetting;
  window.logsLocalStorageKey = logsLocalStorageKey;
  window.logSaveDays = logSaveDays;
  window.logOptionsLocalStorageKey = logOptionsLocalStorageKey;
  window.logOptions = logOptions;

  window.appNameSelectorList = [
    // 应用左上角
    '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div.el-scrollbar__wrap > div > div.app-item-info.app-item-info-hide > div > span',
    // 应用左上角
    '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div.el-scrollbar__wrap > div > div.app-item-info > div > span',
    // 逻辑设计、列表设计、表单设计
    '#app > div > div > div.design-header-box > div.header-left',
    // 新版 JVS 列表设计、表单设计
    'div.design-header-box > div.header-left',
  ];

  function getQueryParamMapping(url) {
    if (!url) {
      return {};
    }

    // 先根据 # 分割，再平铺成基于 ? 分割的一维数组
    const urlParts = url.split('#');
    const urlQuery = urlParts.map((part) => part.split('?')[1]).join('&');

    if (!urlQuery) {
      return {};
    }

    const params = urlQuery.split('&');

    const mapping = {};

    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const id = param.split('=')[0];
      const value = param.split('=')[1];
      mapping[id] = value;
    }

    return mapping;
  }
  window.getQueryParamMapping = getQueryParamMapping;

  function getUrl() {
    return location.href;
  }
  window.getUrl = getUrl;

  function getJvsAppId() {
    const urlParams = getQueryParamMapping(getUrl());
    return urlParams['jvsAppId'];
  }
  window.getJvsAppId = getJvsAppId;

  function getTabType() {
    // #tab-design > span
    const typeDom = document.querySelector('#tab-design > span');
    if (!typeDom) {
      return '';
    }

    return typeDom.textContent;
  }
  window.getTabType = getTabType;

  window.appModeMapKey = '__11ze_JVS_APP_MODE_MAP__';

  function getAppModelMap() {
    return JSON.parse(localStorage.getItem(window.appModeMapKey) ?? '{}');
  }
  window.getAppModelMap = getAppModelMap;

  function getMode() {
    const systemList = document.querySelector('.system-list');
    if (!systemList) {
      return '';
    }

    const systemListItems = systemList.querySelectorAll('li');
    for (const systemListItem of systemListItems) {
      if (systemListItem.innerText.includes('模式')) {
        const mode = systemListItem.innerText.trim();

        const jvsAppId = window.getJvsAppId();
        if (jvsAppId) {
          const appModeMap = window.getAppModelMap();
          appModeMap[jvsAppId] = mode;
          localStorage.setItem(window.appModeMapKey, JSON.stringify(appModeMap));
        }

        return mode;
      }
    }

    return '';
  }
  window.getMode = getMode;

  function getModeFromHistory() {
    const urlParams = getQueryParamMapping(getUrl());
    if (!urlParams) {
      return '';
    }

    const jvsAppId = urlParams['jvsAppId'];
    if (!jvsAppId) {
      return '';
    }

    const appModeMap = window.getAppModelMap();
    return appModeMap[jvsAppId];
  }
  window.getModeFromHistory = getModeFromHistory;

  function getModeColor(mode) {
    const modeColorMapping = {
      开发模式: 'black',
      测试模式: 'green',
      正式模式: 'red',
    };
    return modeColorMapping[mode] ?? 'black';
  }
  window.getModeColor = getModeColor;

  /**
   * 展开应用名称和侧边栏功能名称
   */
  function expandNames() {
    const appNameSelectorList = [
      // 首页
      '#app > div > div > div.jvs-layout > div.jvs-main > div.el-scrollbar > div.el-scrollbar__wrap > div > div > div.top-outer-container > div.el-row-bottom-container.el-row > div > div > div > div > p',
      // 旧应用中心
      '#template > div.template-manage-content > div.template-manage-box > div.my-template-list > div > div > div.content > div.content-header > h5',
      // 新首页 > 常用应用
      '#app > div > div > div.jvs-layout > div.jvs-main > div.el-scrollbar > div.el-scrollbar__wrap > div > div > div.top-outer-container > div > div:nth-child(2) > div > div:nth-child(4) > div > div.card-body.el-col.el-col-24 > div > div > p',
      // 新首页 > 应用中心
      '#app > div > div > div.jvs-layout.jvs-layout-tempOpen > div.template-content-box > div.container.el-row > div:nth-child(2) > div > div > div > div:nth-child(1) > p',
      // 应用左上角
      '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div.el-scrollbar__wrap > div > div.app-item-info.app-item-info-hide > div > span',
      // 应用左上角
      '#app > div > div > div.jvs-layout > div.jvs-left > div > div.el-menu-scrollbar.el-scrollbar > div.el-scrollbar__wrap > div > div.app-item-info > div > span',
      // 逻辑设计、列表设计、表单设计
      '#app > div > div > div.design-header-box > div.header-left',
    ];

    for (let i = 0; i < appNameSelectorList.length; i++) {
      document.querySelectorAll(appNameSelectorList[i]).forEach((el) => {
        el.style.whiteSpace = 'normal';
      });
    }
  }

  /**
   * 修改浏览器标签页标题
   */
  function changeTitle() {
    function getEnvironment() {
      const url = location.href;

      for (let i = 0; i < envList.length; i++) {
        if (url.includes(envList[i].ip)) {
          return envList[i].env;
        }
      }
      return '';
    }

    /**
     * 可以获取到应用名称或设计名称，设置到浏览器标签页 title
     */
    function getNewTabTitle() {
      // 逻辑设计
      // 把 selector 放到 getAppName 获取不到，先保留下面的处理
      const title = document.querySelector(
        '#app > div > div > div.design-header-box > div.header-left > span:nth-child(3)'
      );

      if (title) {
        return title.textContent.trim();
      }

      for (let i = 1; i < window.appNameSelectorList.length; i++) {
        const allTextElements = document.querySelectorAll(window.appNameSelectorList[i]);

        for (let j = 0; j < allTextElements.length; j++) {
          const text = allTextElements[j].innerHTML;

          if (!text.includes('<')) {
            return text.trim();
          }

          if (i === 3) {
            let splitText = text.split('</svg>')[1];
            if (!splitText) {
              continue;
            }

            splitText = splitText.split('center;">')[1];
            if (!splitText) {
              continue;
            }

            splitText = splitText.split('<')[0];
            return splitText.trim();
          }

          const splitText = text.split('</svg>')[1];
          if (!splitText) {
            continue;
          }

          if (splitText.includes('<')) {
            return splitText.split('<')[0].trim();
          }

          return splitText.trim();
        }
      }

      if (location.href.includes('doc.html')) {
        return '接口文档';
      }

      return '';
    }
    window.getNewTabTitle = getNewTabTitle;

    function getTabType() {
      const typeDom = document.querySelector('#tab-design > span');
      if (!typeDom) {
        return '';
      }

      if (designMapping[typeDom.textContent]) {
        return designMapping[typeDom.textContent];
      }

      return typeDom.textContent.trim();
    }

    const newTabTitle = getNewTabTitle();
    const tabType = getTabType();

    function changeFavicon(iconURL) {
      const links = document.querySelectorAll("link[rel*='icon']"); // 获取现有的 favicon 元素

      if (!links) {
        // 如果不存在，则创建一个新的 link 元素
        const link = document.createElement('link');
        link.rel = 'shortcut icon'; // 或 'icon'
        link.type = 'image/x-icon'; // 设置类型，虽然并非所有浏览器都强制要求
        document.head.appendChild(link);
      }

      links.forEach(function (link) {
        link.href = iconURL; // 设置新的图标 URL
      });
    }

    if (tabType) {
      document.title = newTabTitle;
      changeFavicon(window.iconMap[tabType]);
    } else {
      let prefix = getMode();

      if (!prefix) {
        prefix = getEnvironment();
      }

      document.title = prefix + '｜' + (newTabTitle ? newTabTitle : '未打开应用');
    }
  }

  /**
   * 首次进入平台首页时自动进入应用中心
   */
  function enterAppCenter() {
    const selector =
      '#app > div > div > div.jvs-tags > div > div > div.top-nav > ul > li:nth-child(2) > span';
    const element = document.querySelector(selector);
    const url = location.href;
    if (element) {
      if (
        element.innerText === '应用中心' &&
        url.includes('wel/index') &&
        !element.hasAttribute('app-center-clicked-11ze')
      ) {
        element.click();
        element.setAttribute('app-center-clicked-11ze', 'true');
      }
    }
  }

  window.secondTabDesignClicked11ze = false;

  /**
   * 在设计页面自动点击 tab，如【表单设计】
   */
  function enterTabDesign() {
    const selector = '#tab-design';

    const element = document.querySelector(selector);
    if (!element) {
      return;
    }

    if (element.getAttribute('second-tab-design-clicked-11ze')) {
      if (window.secondTabDesignClicked11ze) {
        return;
      }
      window.secondTabDesignClicked11ze = true;
      element.click();

      return;
    }

    element.click();
    element.setAttribute('second-tab-design-clicked-11ze', 'true');
  }

  /**
   * 调整界面、组件样式
   */
  function adjustInterfaceAndComponentStyle() {
    // 旧版 JVS，逻辑设计，所有在用可拖拽组件，改颜色
    const draggableComponents = document.querySelectorAll(
      'div.jvs-rule-node.ef-node-container.jtk-droppable'
    );
    const typeToColorList = [
      {
        types: [
          '数据模型',
          '跳过数据权限',
          '删除数据',
          '新增数据',
          '查询单条',
          '查询所有',
          '更新模型',
          '统计条数',
        ],
        color: '#ffcbda',
      },
      {
        types: ['逻辑引擎', '逻辑应用'],
        color: '#d4e3fc',
      },
      {
        types: ['循环容器', '对数组对象进行遍历'],
        color: '#c8f0c7',
      },
      {
        types: ['中止程序', '提示消息'],
        color: '#fef7d7',
      },
      {
        types: [
          '对象变量',
          '数组变量',
          '对象数组变量',
          '固定变量',
          '对象结构',
          '公式值',
          '等变量',
          '结构示例',
        ],
        color: '#e6e6fa',
      },
    ];
    for (const component of draggableComponents) {
      const text = component.innerText.trim();
      for (const typeToColor of typeToColorList) {
        if (typeToColor.types.some((t) => text.includes(t))) {
          component.style.backgroundColor = typeToColor.color;
          component.style.borderColor = typeToColor.color;
          break;
        }
      }
    }

    // 新版 JVS，逻辑设计，所有在用可拖拽组件，改颜色
    const newDraggableComponents = document.querySelectorAll('.jvs-rule-node.ef-node-container');
    for (const component of newDraggableComponents) {
      // 获取组件所有文本
      const text = component.textContent.trim();
      for (const typeToColor of typeToColorList) {
        if (typeToColor.types.some((t) => text.includes(t))) {
          component.style.backgroundColor = typeToColor.color;
          component.style.borderColor = typeToColor.color;
          break;
        }
      }
    }

    // 设置侧边栏可选组件的颜色
    const sidebarComponents = document.querySelectorAll('.getItem');
    for (const component of sidebarComponents) {
      const text = component.innerText.trim();
      for (const typeToColor of typeToColorList) {
        if (typeToColor.types.some((t) => text.includes(t))) {
          component.style.backgroundColor = typeToColor.color;
          component.style.borderColor = typeToColor.color;
          break;
        }
      }
    }

    // 新版 JVS，表单设计，组件的名称全部显示出来
    const formComponents = document.querySelectorAll('.formitem2');
    for (const component of formComponents) {
      const parent = component.parentElement;
      if (!parent.getAttribute('draggable')) {
        continue;
      }

      component.classList.add('active-formitem2');
    }
  }

  /**
   * 从日志或 url 生成跳转链接
   *
   * @param {*} id 设计 id
   * @param {*} isFromUrl 是否是从 url 中获取
   * @returns string | null
   */
  function getUrlFromLogs(id, isFromUrl) {
    if (!id) {
      return null;
    }

    const logs = window.getLogs();
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      if (log.id === id) {
        return log.url;
      }
    }

    if (!isFromUrl) {
      return null;
    }

    const url = location.href; // http://xxx?id=xxx&xxx
    return url.replace(/id=([^&]*)/, `id=${id}`);
  }

  /**
   * 从日志和 url 生成跳转链接
   * @returns string | null
   */
  function getUrlFromLogsAndUrl(logicName, jvsAppId) {
    if (!logicName) {
      return null;
    }

    const logs = window.getLogs();
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];

      if (log.jvsAppId !== jvsAppId) {
        continue;
      }

      if (log.designName === logicName) {
        return log.url;
      }
    }

    return null;
  }

  /**
   * 逻辑设计，检查到【逻辑调用】组件时，自动添加一个按钮用于查看对应的逻辑设计
   */
  function addButtonToOpenNewLogicDesign() {
    const buttonClass = 'ze-look-logic-button';

    const selector = '.el-form-item__label';

    const labels = document.querySelectorAll(selector);
    for (const label of labels) {
      if (!label.innerText.includes('逻辑引擎远程调用key')) {
        continue;
      }

      const logicKey = label.nextElementSibling.querySelector('.el-input__inner').title;
      const newUrl = getUrlFromLogs(logicKey, true);
      if (!newUrl) {
        continue;
      }

      const existedButton = label.querySelector('.' + buttonClass);
      if (existedButton) {
        if (existedButton.getAttribute('target-key') === logicKey) {
          continue;
        }

        existedButton.remove();
      }

      const newButton = document.createElement('button');
      newButton.className =
        buttonClass + ' modern-button el-button el-button--primary el-button--mini button-11ze';
      newButton.innerHTML = '查看';
      newButton.setAttribute('target-key', logicKey);
      newButton.onclick = function () {
        window.open(newUrl, '_blank');
      };
      newButton.style.marginLeft = '10px';
      // 将按钮直接添加到 label 元素中
      label.appendChild(newButton);
    }
  }

  /**
   * 新版逻辑嵌套组件，检查到【逻辑嵌套】组件时，自动添加一个按钮用于查看对应的逻辑设计
   * 从已打开过的逻辑设计中获取跳转链接
   */
  function addButtonToOpenNewLogicDesignForNestedLogicFirst() {
    const buttonClass = 'ze-look-logic-button';

    let noLinkFound = false;

    const selector = '.el-form-item__label';
    const labels = document.querySelectorAll(selector);
    for (const label of labels) {
      if (!label.innerText.includes('选择逻辑引擎')) {
        continue;
      }

      const logicNameElement = label.nextElementSibling.querySelector(
        '.el-select-dropdown__item.selected > span'
      );
      if (!logicNameElement) {
        continue;
      }

      const logicName = logicNameElement.innerText.trim();

      const jvsAppId = window.getJvsAppId();
      const newUrl = getUrlFromLogsAndUrl(logicName, jvsAppId);
      if (!newUrl) {
        noLinkFound = true;
        continue;
      }

      const existedButton = label.querySelector('.' + buttonClass);
      if (existedButton) {
        if (existedButton.getAttribute('target-key') === logicName) {
          continue;
        }

        existedButton.remove();
      }

      const newButton = document.createElement('button');
      newButton.className =
        buttonClass + ' modern-button el-button el-button--primary el-button--mini button-11ze';
      newButton.innerHTML = '查看';
      newButton.setAttribute('target-key', logicName);
      newButton.onclick = function () {
        window.open(newUrl, '_blank');
      };
      newButton.style.marginLeft = '10px';
      // 将按钮直接添加到 label 元素中
      label.appendChild(newButton);

      return;
    }

    if (noLinkFound) {
      addButtonToOpenNewLogicDesignForNestedLogic();
    }
  }

  /**
   * 新版逻辑嵌套组件，检查到【逻辑嵌套】组件时，自动添加一个按钮用于查看对应的逻辑设计
   * 从左上角的 icon 中获取跳转页面
   * 谨慎使用，点到引用按钮会覆盖当前逻辑设计，自动保存，不可逆
   */
  function addButtonToOpenNewLogicDesignForNestedLogic() {
    const buttonClass = 'ze-look-logic-button';

    const selector = '.el-form-item__label';
    const labels = document.querySelectorAll(selector);

    const otherRuleListIcon = document.querySelector('.rule-list-icon');
    if (!otherRuleListIcon) {
      return;
    }
    if (!otherRuleListIcon.getAttribute('check-logic-design-rule-list-icon-11ze')) {
      // 点击后才有逻辑列表
      otherRuleListIcon.click();
      otherRuleListIcon.click();
    }
    otherRuleListIcon.setAttribute('check-logic-design-rule-list-icon-11ze', 'true');

    function createButton(target, element, logicName) {
      const newButton = document.createElement('button');
      newButton.className =
        buttonClass + ' modern-button el-button el-button--primary el-button--mini button-11ze';
      newButton.innerHTML = '查看';
      newButton.setAttribute('target-key', logicName);
      newButton.onclick = function () {
        // 第一个按钮是「设计」，第二个「引用」
        // 点击引用会引用设计覆盖当前逻辑设计，自动保存，不可逆
        const desginButtons = element
          .querySelector('.list-item-tool')
          .querySelectorAll('div.el-tooltip');
        if (desginButtons.length !== 2) {
          return;
        }
        desginButtons[0].click();
      };
      newButton.style.marginLeft = '10px';
      // 将按钮直接添加到 label 元素中
      target.appendChild(newButton);
    }

    const otherRuleList = document.querySelectorAll('.other-rule-list > .list-box > .list-item');

    for (const label of labels) {
      if (!label.innerText.includes('选择逻辑引擎')) {
        continue;
      }

      const logicNameElement = document.querySelector(
        '.el-scrollbar__view.el-select-dropdown__list > .el-select-dropdown__item.selected > span'
      );
      if (!logicNameElement) {
        continue;
      }

      const logicName = logicNameElement.innerText.trim();
      const existedButton = label.querySelector('.' + buttonClass);
      if (existedButton) {
        if (existedButton.getAttribute('target-key') === logicName) {
          continue;
        }

        existedButton.remove();
      }

      for (const otherRule of otherRuleList) {
        if (otherRule.innerHTML.includes(logicName)) {
          createButton(label, otherRule, logicName);
          return;
        }
      }
    }
  }

  // 新版 JVS，在逻辑设计名称旁边添加复制按钮
  function addButtonToCopyDesignName() {
    // 逻辑设计
    let designName = document.querySelector(
      '#app > div > div > div.design-header-box > div.header-left > span'
    );
    if (!designName) {
      // 表单设计
      designName = document.querySelector(
        '#app > div > div > div:nth-child(1) > div.design-header-box > div.header-left > span'
      );
    }

    if (designName) {
      const designNameText = designName.innerText.trim();

      const existedButton = document.querySelector('#copy-design-name-button-11ze');
      if (existedButton) {
        if (existedButton.getAttribute('design-name-11ze') === designNameText) {
          return;
        }

        existedButton.remove();
      }

      if (!designName.querySelector('use')) {
        return;
      }

      const copyButton = document.createElement('button');
      copyButton.innerHTML = '复制';
      copyButton.className =
        'modern-button el-button el-button--primary el-button--mini button-11ze';
      copyButton.id = 'copy-design-name-button-11ze';
      if (designNameText) {
        copyButton.setAttribute('design-name-11ze', designNameText);
      }

      copyButton.onclick = function () {
        copyToClipboard(designNameText, copyButton, '已复制');
      };
      designName.parentNode.insertBefore(copyButton, designName.nextSibling);
    }
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
          document.execCommand('copy');
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

  window.currentPageNotAddCopyComponentNameButton = false;

  /**
   * 新版 JVS，添加按钮复制组件名称
   */
  function addButtonToCopyComponentName() {
    const buttonClass = 'ze-copy-component-name-button';

    const componentName = document.querySelector('#node_detailpannel > h4 > div > span');
    if (!componentName) {
      return;
    }

    // 不在旧版加按钮，如果父级有子元素 el-icon-document-copy，则 return
    if (componentName.parentNode.querySelector('.el-icon-document-copy')) {
      window.currentPageNotAddCopyComponentNameButton = true;
      return;
    }

    if (window.currentPageNotAddCopyComponentNameButton) {
      return;
    }

    const componentNameText = componentName.innerText.trim();

    const existedButton = document.querySelector('#copy-component-name-button-11ze');
    if (existedButton) {
      if (existedButton.getAttribute('component-name-11ze') === componentNameText) {
        return;
      }

      existedButton.remove();
    }

    const copyButton = document.createElement('button');
    copyButton.innerHTML = '复制';
    copyButton.className =
      buttonClass + ' modern-button el-button el-button--primary el-button--mini button-11ze';
    copyButton.onclick = function () {
      copyToClipboard(componentNameText, copyButton, '已复制');
    };
    copyButton.id = 'copy-component-name-button-11ze';
    copyButton.setAttribute('component-name-11ze', componentNameText);
    componentName.parentNode.insertBefore(copyButton, componentName.nextSibling);
  }

  /**
   * 新版 JVS，表单设计，自动展开表单设计的按钮设置
   */
  function expandFormButton() {
    const buttons = document.querySelectorAll('.item-body');
    if (buttons) {
      for (const button of buttons) {
        if (button.getAttribute('item-body-checked-11ze') === 'true') {
          continue;
        }

        if (button.style.display === 'none') {
          button.style.display = 'block';
          button.setAttribute('item-body-checked-11ze', 'true');
        }
      }
    }
  }

  /**
   * 逻辑设计，添加按钮一键清空所有字段
   */
  function addButtonToClearAllFields() {
    const boxes = document.querySelectorAll('.data-model-box');

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.querySelector('#clear-all-fields-button-11ze' + i)) {
        continue;
      }

      const button = document.createElement('button');
      button.className = 'modern-button el-button el-button--primary el-button--mini button-11ze';
      button.innerHTML = '清空';
      button.id = 'clear-all-fields-button-11ze' + i;
      button.onclick = function () {
        const ps = box.querySelectorAll('p');
        for (let i = ps.length - 1; i >= 0; i--) {
          const el = ps[i];
          if (el.querySelector('.delete-icon-button')) {
            el.querySelector('.delete-icon-button > span').click();
          }

          if (el.querySelector('.el-icon-delete')) {
            el.querySelector('.el-icon-delete').click();
          }
        }
      };

      box.insertBefore(button, box.firstChild);
    }
  }

  /**
   * 新版 JVS，逻辑设计，自动展开变量组件设置里的按钮
   */
  function expandLogicVariableButton() {
    const buttons = document.querySelectorAll('.bottom-body');
    if (buttons) {
      for (const button of buttons) {
        if (button.getAttribute('bottom-body-checked-11ze') === 'true') {
          continue;
        }

        if (button.style.display === 'none') {
          button.style.display = 'block';
          button.setAttribute('bottom-body-checked-11ze', 'true');
        }
      }
    }
  }

  /**
   * 在列表表单列表的 id 旁边添加查看按钮
   */
  function addButtonToOpenNewFormOrListDesign() {
    // 列表设计页面也有元素，得排除
    const tabType = window.getTabType();
    if (tabType === '列表设计') {
      return;
    }

    const selector =
      'div.table-body-box > div > div.el-table__body-wrapper.is-scrolling-none > table > tbody > tr > td:nth-child(2) > div > span > span > div';
    const elements = document.querySelectorAll(selector);

    for (const element of elements) {
      const designId = element.innerText.trim();
      if (!designId) {
        continue;
      }

      element.style.whiteSpace = 'normal';

      if (element.getAttribute('form-added-button-11ze')) {
        continue;
      }

      const targetUrl = getUrlFromLogs(designId, false);
      if (!targetUrl) {
        continue;
      }

      const copyButton = document.createElement('button');
      copyButton.innerHTML = '查看';
      copyButton.className =
        'modern-button el-button el-button--primary el-button--mini button-11ze';
      copyButton.id = 'open-new-form-or-list-design-button-11ze';
      copyButton.onclick = function () {
        window.open(targetUrl, '_blank');
      };
      const targetElement =
        element.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(
          'td:nth-child(5) > div > div'
        );
      if (targetElement) {
        targetElement.appendChild(copyButton);
        element.setAttribute('form-added-button-11ze', 'true');
      }
    }
  }

  /**
   * 自动展开表单设计所有组件设置
   */
  function expandFormDesignAllComponentSettings() {
    // 表单设计
    const tabType = window.getTabType();
    if (tabType !== '表单设计') {
      return;
    }

    // 文字标题元素跟展开内容元素同级
    const buttons = document.querySelectorAll('.el-collapse-item > .el-collapse-item__wrap');
    for (const button of buttons) {
      if (button.getAttribute('bottom-body-checked-11ze')) {
        continue;
      }

      const text = button.parentElement.innerText.trim();

      const targetNames = ['设置', '扩展', '功能', '校验'];

      for (const targetName of targetNames) {
        if (text.includes(targetName)) {
          button.style.display = 'block';
          break;
        }
      }

      button.setAttribute('bottom-body-checked-11ze', 'true');
    }
  }

  /**
   * 高亮应用中心的应用
   */
  function highlightApps() {
    const highlightAppsKey = '__11ze_HIGHLIGHT_APPS__';

    const labelClass = 'ze-highlight-label';
    const appList = JSON.parse(localStorage.getItem(highlightAppsKey) ?? '[]');

    function getContentSelector() {
      return 'div > div > div > p';
    }

    function handle(nodes, appList) {
      // 如果在 appList 中，就高亮
      nodes.forEach((n) => {
        const text = getNodeText(n);
        const label = n.querySelector(`.${labelClass}`);
        if (!label) {
          return;
        }

        if (appList.includes(text)) {
          n.style.border = '2px solid blue';
          label.style.backgroundColor = 'white';
        } else {
          n.style.border = '2px solid transparent';
          label.style.backgroundColor = 'white';
        }
      });
    }

    function getNodeText(node) {
      return node.querySelector(getContentSelector()).innerText.trim();
    }

    function handleClickNode(node) {
      const text = getNodeText(node);

      if (appList.includes(text)) {
        appList.splice(appList.indexOf(text), 1);
      } else {
        appList.push(text);
      }
      localStorage.setItem(highlightAppsKey, JSON.stringify(appList));
    }

    function main() {
      const containerSelector = '.application';

      // 找到相关容器，不存在就结束
      const application = document.querySelector(containerSelector);
      if (!application) return;

      // 找到相关数据项，不存在就结束
      const nodes = [...document.querySelectorAll(containerSelector)];
      if (!nodes) return; // 不存在，结束

      // 设置点击事件
      nodes.forEach((n) => {
        if (n.querySelector(`.${labelClass}`)) {
          return;
        }

        // 加一个按钮，点击后高亮
        const button = document.createElement('button');
        button.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
        button.className =
          labelClass + ' modern-button el-button el-button--primary el-button--mini';
        button.style.borderColor = '#c8f0c7';
        button.style.borderRadius = '5px';
        button.style.borderWidth = '1px';
        button.style.borderStyle = 'solid';
        button.style.borderColor = '#c8f0c7';

        button.onclick = (event) => {
          event.stopPropagation();
          handleClickNode(n);
        };

        n.querySelector('div > div > div').appendChild(button);
      });

      // 渲染
      handle(nodes, appList);
    }

    main();
  }

  /**
   * 窗口聚焦时自动松开一次左 Ctrl 键
   * 场景：按快捷键切换软件时，如果包含 Ctrl，回到逻辑设计时，Ctrl 会一直按住，导致鼠标拖拽变成画框
   * 不用了，控制台有错误：Uncaught TypeError: Cannot read properties of undefined (reading 'removeEventListener')
    at HTMLDocument.<anonymous> (page.f3111d50.js:34:1216471)
   */
  function autoClickLeftCtrlKey() {
    const container = document.querySelector('.container');
    if (!container) {
      return;
    }

    container.addEventListener('focus', function () {
      // 创建一个模拟 Ctrl 键弹起的 KeyboardEvent (可选，如果需要模拟按下和弹起)
      const ctrlUp = new KeyboardEvent('keyup', {
        key: 'Control',
        code: 'ControlLeft',
        ctrlKey: false,
        bubbles: true,
      });

      container.dispatchEvent(ctrlUp);
    });
  }

  /**
   * 逻辑设计，自动展开组件库里指定的分类
   */
  function autoExpandComponentLibraryCategory() {
    if (window.autoExpandComponentLibraryCategory11ze) {
      return;
    }

    const ruleCategories = document.querySelectorAll('.left-tool-list-box > .rule-assembly-list');

    if (ruleCategories.length === 0) {
      return;
    }

    for (const ruleCategory of ruleCategories) {
      if (ruleCategory.classList.contains('open')) {
        continue;
      }

      if (ruleCategory.getAttribute('auto-expand-component-library-category-11ze')) {
        continue;
      }

      const textDom = ruleCategory.querySelector('div > div > .label');
      if (!textDom) {
        continue;
      }

      const text = textDom.innerText.trim();
      if (['模型插件', '服务插件', '自定义代码插件'].includes(text)) {
        const left = ruleCategory.querySelector('.t-left');
        if (left) {
          left.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      }

      ruleCategory.setAttribute('auto-expand-component-library-category-11ze', 'true');
    }

    function simulateMouseClick(element) {
      const mouseClickEvents = ['mousedown', 'click', 'mouseup'];

      mouseClickEvents.forEach((mouseEventType) => {
        const mouseEvent = new MouseEvent(mouseEventType, {
          bubbles: true, // 允许事件冒泡
          cancelable: true, // 允许事件被取消
          clientX: element.clientWidth, // 设置点击位置
          clientY: element.clientHeight, // 设置点击位置
        });
        element.dispatchEvent(mouseEvent);
      });
    }

    // 鼠标左键点击一次，收起组件库
    const container = document.querySelector('.butterfly-wrapper');
    if (container) {
      simulateMouseClick(container);
    }

    window.autoExpandComponentLibraryCategory11ze = true;
  }

  window.appNameMapKey = '__11ze_JVS_APP_NAME_MAP__';

  function getAppNameMap() {
    return JSON.parse(localStorage.getItem(window.appNameMapKey) ?? '{}');
  }
  window.getAppNameMap = getAppNameMap;

  function getAppIdName(jvsAppId) {
    const appNameMap = getAppNameMap();
    return appNameMap[jvsAppId] ?? '';
  }
  window.getAppIdName = getAppIdName;

  function saveAppIdName(jvsAppId, appName) {
    const appNameMap = getAppNameMap();
    appNameMap[jvsAppId] = appName;
    localStorage.setItem(window.appNameMapKey, JSON.stringify(appNameMap));
  }
  window.saveAppIdName = saveAppIdName;

  function applicationSetClick() {
    const applicationElements = document.querySelectorAll('div.application');

    if (applicationElements.length === 0) {
      return;
    }

    applicationElements.forEach(function (appElement) {
      if (appElement.classList.contains('set-click-11ze')) {
        return;
      }

      appElement.addEventListener('click', function (event) {
        const clickedElement = event.currentTarget;

        const idElement = clickedElement.querySelector('label.el-checkbox span.el-checkbox__label');

        const nameElement = clickedElement.querySelector('p');

        let applicationId = null;
        let applicationName = null;

        if (idElement) {
          applicationId = idElement.textContent.trim();
        } else {
          console.warn('11ze 未找到 ID 元素:', clickedElement);
        }

        if (nameElement) {
          applicationName = nameElement.textContent.trim();
        } else {
          console.warn('11ze 未找到名称元素:', clickedElement);
        }

        if (applicationId !== null && applicationName !== null) {
          saveAppIdName(applicationId, applicationName);
        } else {
          console.warn('11ze 应用中心点击应用未能完整获取点击的应用信息:', clickedElement);
        }
      });
      appElement.classList.add('set-click-11ze');
    });
  }

  /**
   * 逻辑设计，在组件右边显示执行时间
   */
  function showNodeExecTime() {
    const nodes = document.querySelectorAll(
      '.el-icon-circle-check.el-node-state-success.el-popover__reference'
    );

    // 在 aria-describedby 属性有 id
    for (const node of nodes) {
      const id = node.getAttribute('aria-describedby');
      if (!id) {
        continue;
      }

      const timeDomId = id + '-time-11ze';

      const resultPopover = document.getElementById(id);
      if (!resultPopover) {
        document.getElementById(timeDomId)?.remove();
        continue;
      }

      const resultText = resultPopover.querySelector('div > h4 > span > span');
      if (!resultText) {
        document.getElementById(timeDomId)?.remove();
        continue;
      }

      const resultTextContent = resultText.textContent.trim();
      if (!resultTextContent) {
        document.getElementById(timeDomId)?.remove();
        continue;
      }

      const timeDom = document.getElementById(timeDomId);

      if (timeDom && timeDom.textContent.trim() === resultTextContent) {
        continue;
      }

      document.getElementById(timeDomId)?.remove();

      const span = document.createElement('span');
      span.id = timeDomId;
      span.textContent = resultTextContent;
      span.style.position = 'absolute';
      span.style.right = '-40px';
      span.style.color = 'red';
      node.parentNode.appendChild(span);
    }
  }

  /**
   * 给逻辑设计的画布添加滚动功能
   * 跟鼠标左键拖动画布冲突，待修复
   */
  function setCanvasScroll() {
    // 1. 获取元素
    const container = document.querySelector('.butterfly-vue-container');
    const wrapper = document.querySelector('.butterfly-wrapper');
    const minimap = document.querySelector('div.butterfly-minimap-container > div:nth-child(2)');
    const guideCanvasWrapper = document.querySelector('.butterfly-guide-canvas-wrapper');

    if (!container || !wrapper || !minimap || !guideCanvasWrapper) {
      return;
    }

    if (wrapper.getAttribute('data-11ze-canvas-scroll')) {
      return;
    }

    // 优化性能，告诉浏览器该元素的 transform 属性将会变化，让浏览器提前做好准备
    wrapper.style.willChange = 'transform';

    // 2. 初始化位置
    let pos = {
      x: parseInt(wrapper.style.left) || 0,
      y: parseInt(wrapper.style.top) || 0,
    };
    let minimapPos = {
      x: parseInt(wrapper.style.left) || 0,
      y: parseInt(wrapper.style.top) || 0,
    };

    // 3. 滚轮事件
    container.addEventListener('wheel', (e) => {
      e.preventDefault();

      // 更新位置
      pos.x -= e.deltaX || 0;
      pos.y -= e.deltaY || 0;
      minimapPos.x += e.deltaX * (100 / 11 / 100) || 0;
      minimapPos.y += e.deltaY * (100 / 11 / 100) || 0;

      wrapper.style.left = `${pos.x}px`;
      wrapper.style.top = `${pos.y}px`;
      minimap.style.left = `${minimapPos.x}px`;
      minimap.style.top = `${minimapPos.y}px`;
      guideCanvasWrapper.style.left = `${pos.x}px`;
      guideCanvasWrapper.style.top = `${pos.y}px`;
    });

    wrapper.setAttribute('data-11ze-canvas-scroll', 'true');
  }
})();

/**
 * 记录和查看开发日志
 */
window.onload = function () {
  'use strict';

  if (!isJVS(true)) {
    return;
  }

  function log() {
    function getTabType() {
      return window.getTabType();
    }

    function getUrl() {
      return window.getUrl();
    }

    function getJvsAppId() {
      return window.getJvsAppId();
    }

    function getId() {
      return getQueryParamMapping(getUrl())['id'];
    }

    function getCurrentTime() {
      return new Date().getTime();
    }

    const appIdSelectorList = window.appNameSelectorList;

    /**
     * 日志，获取应用名称
     */
    function getAppName() {
      for (let i = 0; i < appIdSelectorList.length; i++) {
        const allTextElements = document.querySelectorAll(appIdSelectorList[i]);

        for (let j = 0; j < allTextElements.length; j++) {
          const text = allTextElements[j].textContent;
          if (text) {
            const textArray = text
              .trim()
              .split('\n')
              .map((item) => item.trim())
              .filter((item) => item !== '');

            // 旧版 JVS
            if (textArray.length === 1) {
              const appName = textArray[0].split(' ')[0].trim();
              window.saveAppIdName(getJvsAppId(), appName);
              return appName;
            }

            if (document.querySelector('.list-item')) {
              const name = textArray[textArray.length - 3];
              if (name) {
                return name;
              }
            }

            return textArray[0];
          }
        }
      }

      return '';
    }

    const url = getUrl();
    const id = getId();
    const time = getCurrentTime();
    const tabType = getTabType();
    const designName = window.getNewTabTitle();
    const appName = getAppName();
    const jvsAppId = getJvsAppId();

    // 如果有一个为空则返回 null
    if (!designName || !appName || !id || !jvsAppId || !tabType) {
      return null;
    }

    return {
      tabType,
      url,
      time,
      designName,
      appName,
      id,
      jvsAppId,
    };
  }

  function cutOverdueLogs(logs, currentTime) {
    // 每个 log 有 time 字段，格式为时间戳
    // 从数组删除时间戳跟当前时间相差 n 天的 log

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      if (!log.time) {
        logs.splice(i, 1);
        continue;
      }

      if (Math.abs(currentTime - log.time) > logSaveDays * 24 * 60 * 60 * 1000) {
        logs.splice(i, 1);
        continue;
      }
    }

    logs = uniqueLogs(logs);

    localStorage.setItem(logsLocalStorageKey, JSON.stringify(logs));

    return logs;
  }

  function getLogs() {
    const logs = JSON.parse(localStorage.getItem(logsLocalStorageKey));
    if (!logs) {
      return [];
    }

    logs.forEach((log) => {
      const appName = window.getAppIdName(log.jvsAppId);
      if (appName) {
        log.appName = appName;
      }
    });

    return cutOverdueLogs(logs, new Date().getTime());
  }
  window.getLogs = getLogs;

  function saveLog(logObj, type) {
    if (!logObj) {
      return;
    }
    logObj.type = type;

    const logList = getLogs();
    logList.push(logObj);
    localStorage.setItem(logsLocalStorageKey, JSON.stringify(logList));
  }

  function uniqueLogs(logs) {
    const appIds = [];
    const uniqueLogs = [];

    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      const urlParams = getQueryParamMapping(log.url);
      const id = urlParams['id'] + log.type;

      if (!appIds.includes(id)) {
        appIds.push(id);
        uniqueLogs.push(log);
      }
    }

    return uniqueLogs.reverse();
  }

  function formatTime(time) {
    const date = new Date(time);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function getQueryParamMapping(url) {
    return window.getQueryParamMapping(url);
  }

  function getJvsAppIdsFromLogs(logs) {
    const appIds = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (!appIds.includes(log.jvsAppId)) {
        appIds.push(log.jvsAppId);
      }
    }

    return appIds;
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function getOptions() {
    const options = JSON.parse(localStorage.getItem(logOptionsLocalStorageKey));
    if (!options) {
      return logOptions;
    }

    if (options.length !== logOptions.length) {
      return logOptions;
    }

    return options;
  }

  function saveOptions(selectedValue) {
    if (!selectedValue) {
      return;
    }

    const options = getOptions();

    const selectedArray = selectedValue.split('-');
    const value = selectedArray[0];
    const selected = selectedArray[1];

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option.value === value) {
        option.selected = selected;
      }
    }

    localStorage.setItem(logOptionsLocalStorageKey, JSON.stringify(options));
  }

  function filterLogs(logs, options) {
    if (!options) {
      return logs;
    }

    const filteredLogs = [];

    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      let allSelected = true;

      for (let j = 0; j < options.length; j++) {
        const option = options[j];

        if (option.selected === '全部') {
          continue;
        }

        if (!log[option.value].includes(option.selected)) {
          allSelected = false;
          break;
        }
      }

      if (allSelected) {
        filteredLogs.push(log);
      }
    }

    return filteredLogs;
  }

  function showPopup() {
    const popupId = '11ze-jvs-log-popup';

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.id = popupId;
    const oldPopup = document.getElementById(popupId);
    if (oldPopup) {
      oldPopup.remove();
      return;
    }

    const optionsDiv = document.createElement('div');
    optionsDiv.style.textAlign = 'right';

    const lastLogOptions = getOptions();

    for (let i = 0; i < lastLogOptions.length; i++) {
      const currentDiv = document.createElement('div');
      currentDiv.className = 'log-11ze-select-container';

      const selectDom = document.createElement('select');
      selectDom.className = 'log-11ze-select';
      selectDom.style.borderRadius = '5px';

      for (let j = 0; j < lastLogOptions[i].options.length; j++) {
        const option = document.createElement('option');
        option.value = lastLogOptions[i].value + '-' + lastLogOptions[i].options[j];
        option.textContent = lastLogOptions[i].options[j];

        if (lastLogOptions[i].selected === lastLogOptions[i].options[j]) {
          option.selected = true;
        }

        selectDom.appendChild(option);
      }

      const pDom = document.createElement('p');
      pDom.className = 'log-11ze-select-label';
      pDom.textContent = lastLogOptions[i].label;
      currentDiv.appendChild(pDom);
      currentDiv.appendChild(selectDom);
      optionsDiv.appendChild(currentDiv);

      selectDom.onchange = function () {
        const selectedValue = selectDom.value;
        saveOptions(selectedValue);

        showPopup();
        showPopup();
      };
    }
    popup.appendChild(optionsDiv);

    let logs = getLogs();

    logs = filterLogs(logs, lastLogOptions);

    const appModeMap = window.getAppModelMap();
    const hasMode = Object.keys(appModeMap).length > 0;

    const listContent = [];

    for (let i = logs.length - 1; i >= 0; i--) {
      const oneLog = logs[i];
      const datetime = formatTime(oneLog.time);

      const currentType = designSetting[oneLog.tabType] ?? {
        color: 'red',
        shortname: '未知',
      };

      const logFieldColor = oneLog.type === '打开' ? 'black' : 'red';

      let appName = oneLog.appName;
      if (appName.length > 16) {
        appName = appName.substring(0, 16) + '…';
      }

      const designName = oneLog.designName;

      const jvsAppId = oneLog.jvsAppId;

      const mode = appModeMap[jvsAppId] ?? '';
      const modeColor = window.getModeColor(mode);

      listContent.push(`
        <tr class="log-11ze-table-tr">
          ${
            hasMode
              ? `<td style="color: ${modeColor}"> ${mode.replace('模式', '')} &nbsp; </td>`
              : ''
          }
          <td> ${appName} &nbsp; </td>
          <td style="color: ${currentType.color}"> ${currentType.shortname} &nbsp; </td>
          <td> ${designName} &nbsp; </td>
          <td> ${datetime} &nbsp; </td>
          <td style="color: ${logFieldColor}"> ${oneLog.type} &nbsp; </td>
          <td> <a href="${oneLog.url}" target="_blank">设计</a> &nbsp; </td>
        </tr>
      `);
    }

    const logTable = document.createElement('table');
    logTable.className = 'table-11ze';
    logTable.innerHTML = `
      <thead>
        <tr style="background-color: #eef5fe" class="log-11ze-table-tr">
          ${hasMode ? `<th> 模式 &nbsp;</th>` : ''}
          <th> 应用 &nbsp;</th>
          <th> 设计 &nbsp;</th>
          <th> 名称 &nbsp;</th>
          <th> 时间 &nbsp;</th>
          <th> 类型 &nbsp;</th>
          <th> 操作 &nbsp;</th>
        </tr>
      </thead>
      <tbody>
        ${listContent.join('')}
      </tbody>
    `;

    popup.appendChild(logTable);

    document.body.appendChild(popup);

    // 添加点击事件监听器
    document.addEventListener('click', closePopupOnOutsideClick);
  }

  // 新增函数: 检查点击是否在popup外部并关闭popup
  function closePopupOnOutsideClick(event) {
    const popup = document.getElementById('11ze-jvs-log-popup');
    // 这是打开popup的按钮
    const button = document.querySelector('.modern-button');

    if (popup && !popup.contains(event.target) && event.target !== button) {
      popup.remove();
      document.removeEventListener('click', closePopupOnOutsideClick);
    }
  }

  window.savedLogDesignName = '';
  window.savedLogAppName = '';
  function main() {
    const newLog = log();
    if (newLog && newLog.tabType) {
      // 设计页面没有应用名称时会拿到逻辑设计列表
      if (newLog.appName.length > 100 || newLog.appName === newLog.designName) {
        newLog.appName = window.getAppIdName(newLog.jvsAppId);
      }

      const needToSave =
        window.savedLogDesignName !== newLog.designName ||
        window.savedLogAppName !== newLog.appName;
      if (needToSave) {
        saveLog(newLog, '打开');
        window.savedLogDesignName = newLog.designName;
        window.savedLogAppName = newLog.appName;
      }
    }

    // 用于显示当前在的模式
    let buttonName = '日志';
    let mode = window.getModeFromHistory();
    if (!mode) {
      mode = window.getMode();
    }

    let color = 'black';
    if (mode) {
      const modeSpan = document.createElement('span');
      color = window.getModeColor(mode);
      modeSpan.style.color = color;
      modeSpan.innerHTML = mode;
      buttonName = modeSpan.outerHTML + '｜' + buttonName;
    }

    createButton(buttonName, color);
  }

  function createButton(buttonName, color) {
    const existButton = document.getElementById('ze-jvs-log-button');
    if (existButton) {
      if (existButton.innerHTML === buttonName) {
        return;
      }

      existButton.remove();
    }

    // 在页面固定位置（绝对位置，悬浮）插入一个按钮
    // 点击按钮打开一个弹窗显示内容（全局唯一），已有窗口则直接显示

    const button = document.createElement('button');
    button.innerHTML = buttonName;
    button.className = 'modern-button el-button el-button--primary el-button--mini button-11ze';
    button.style.position = 'fixed';
    button.style.top = '14px';
    button.style.right = '310px';
    button.style.zIndex = '9998';
    button.style.fontSize = '13px';
    button.id = 'ze-jvs-log-button';
    button.style.setProperty('border', '1px solid ' + color, 'important');
    button.onclick = function (event) {
      event.stopPropagation(); // 阻止事件冒泡到 document
      showPopup();
    };

    document.body.appendChild(button);
  }

  // 逻辑设计的保存按钮
  const saveButton = document.querySelector(
    '#app > div > div > div.design-header-box > div.header-right > button'
  );
  if (saveButton) {
    saveButton.addEventListener('click', function () {
      const newLog = log();
      if (newLog) {
        saveLog(newLog, '保存');
      }
    });
  }

  setInterval(() => {
    try {
      main();
    } catch (error) {
      console.error('「改善 JVS 开发体验」日志功能运行错误：');
      console.error(error);
    }
  }, 400);
};

window.iconMap = {
  列: 'data:image/png;base64,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',
  表: 'data:image/png;base64,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',
  逻: 'data:image/png;base64,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',
  流: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAD+CAYAAADVndu7AAAAAXNSR0IArs4c6QAAGVVJREFUeF7tXbuyHEUSnbkm+NhcEXwAXFM2+oEFuYII4S4fgM0HsK4UsYvLFT8AtsyRPoBYWBt/17yzUWgatfr2o/JRdbK6zjrE6tbzZObJk9k9M8cD/0cEiEC3CBy7vTkvTgSIwIEEQCcgAh0jQALo2Pi8OhEgAdAHiEDHCJAAOjY+r04ESAD0ASLQMQIkgI6Nz6sTARIAfYAIdIwACaBj4/PqRIAEQB+ojsDNzc3Tw+Hw+O7u7uPj8fjBlw9evJcO8cPvX/xyOp0eVT9QxxuSADo2fo2rLwX73N7//Pff/vP69evrGufiHm8QIAHQE9wQkAT70qZ/f/GAPulmke2FCPY2RhwxQeAS6Olf78l4K1g//P7F16fT6bl1Hc7PQ4AEkIdTt6OGrJ4AOJ/PD4d6vRQg7AOUQnZ+XRJAXbxD7+Yh4a0X/Ndvn//v1atX71vX4fw8BEgAeTjtdtQnn3zy+7gTH+Gi7APUswIJoB7WIXf6x+e/naMdjGVAPYuQAOphHXKnpAC++uinDyMdjo8D61mDBFAP65A73dzc/Pzk+vazaIdjGVDHIiSAOjiH3SU1/p5c3z6LdkA+DqxjkdAEMDgnJWFZZ2AfoCy+kVcPTQCffvrpf4fnzunx0PF4/IYvifi7E/sA/pi2smJYAliqTakG/F2LfQB/TFtZMSQB5NSlfFTk52I5ePvtlr8S+wD5WGlHhiSAsfRfuxjLAq3Z789jH8APy5ZWCkcAmnqUasDuchrc7buur8DXgksjHOzjwBYpSjVgcxb2AWz4tTo7lALwkKFUAzpXtJCvbse8WbRnHk7aUWEIILfuz7ko1UAOSm30AfjUR2fL3FkhCKCU/KTz5LrBm3ER+wDpXHwtWGZHyWg4AdSQnnyclOcSpYg4b/flUbSfFcHl+XAC8JT+azCxo7ztRDXIePsU90ewD6BBLW8OlAAQGYfOtO4YtQg5zz3fjGIpJ0FLNhZGAMhswybhspOwDyALoNZHwwggQqahGrjvvghVlhNE7APkoCQfAyGASFmGauBdp0EqszX3JVnLgztnRnUCiOpg0jpz/HXZOUC3NCbiNwRdiPplSzhaz1rjZ9KqE4DH235WYDcyTdYPU0QlspLYcO16CNR6alWVACLU/TkmzFUD0cks564cExOBXB+0nr4aAURtLlnqzki9DKsjcH4sBGr1PKoQQMtyOTHx1dXVd3NfRdYiqcVyc55mCYFdEUAr0l+jBlgGMIhLIFDrsWdxBbCnLDn3yHAP5FbCgbmmDYFaH4AqSgAtS/9cNbAngrO5LGd7IrALAtizPB7UQDJ6xB/W8HRGrlUXgVqPANOtiimAXjrkqUkY7dd167ord/NGoNYjwGIEsFfpP2fo1K29u7v7ONoPbHo7Jderh0CtJwAlCSDkD056m3CQauwDeCPb93rNE0AyX1IB5/P5++GnvfZo0uFRDQlgj9bF3anWI8BiCmAM3V6DY8zSvfQ7cCHR1861ngBUIYA9qoFpl5YE0FeAlr7t7ghgAGwvamAq0UgApUOin/VrPgKspgAmJUHTvYG5Bg3fBuwnQEvftOYjQAgBtKwGltiZBFA6LPpZv+YTACgBtNgbWOrOkgD6CdDSN+2KAFpSA2uGIQGUDot+1q/5CBCuAFrpDWw1Zvb8mYd+Qi/GTWs+AQhFAJHVwBYrkwBiBM8eTtE9AQxGjCKrc2oyEsAeQg9/hy2lWeKExT4N6HFY9HsDuQYhAXhYm2vUfgQYsgSYcwOUGtiS/sOTDH4fAIPXA4Ectemxz3iN0Apg0iSs+gnDXGP09NFnb+fjeu8ikOtznrg1QwA1ewO50p8KwNMVuVaO4vRGqTkCuARdUTUgMQQVgLdL9rte7ScAzfQAllyixIdwpDKMBNBvwHrfnASgQNQzACXSfzgq+kmFAjJOCYiAxvc8rtFkCTB3cQ81IJH+JIA899v6Vd/0fYpXV1e/zv03bwfZqPQFrufz+Y/xf9MKw7/JVnszOn3rVbqn5duvEI8Amy8BpsayqAGp9B8RwNPD4fB4cpYfL/+W/iv+X/oZsnSXuZ8jGxZDPRqVXgYha3POOHxlXRr76tWr93Pm7HHMbhTA2DhSNYCSX1qHkt5Pu491nkZRWffcmp8C/+7u7tvxtzhryX9rrxb+vksCSMBL1EBER11yHsm9kA6IkrRrd14jzpZ8wNOuuyWAAaStbNka+7fy2nEk6Z/TqG1NBXqRwO4JYE0NtGb0LTLzcgrrOlGyaU7gj+8aUbVYbbE1vwsCWFIDURx1y0jSkiZnvVJjIgRRCvzz+fxQ05VvySc8bNgVAQyBlH6w5Hg8vjydTo88QKyxBrv+2yh7/RhNpPJl+9a2Ed0RgA0uzGxK/3XcvQJ/2KW10tDilSQAC3oV5rLrvwzy3CM9L5O01hzW3psEoEWu0rwWpD8iY9ZQRT30A2AEsPWmW6X4Cr1NDSf3AKBmoEg7+5b7IYjNcl7NXBgBDM+ze5FaUuO0Iv1r2c/S2ZdiPx5f636WM1rmQghgmtmGD4y01JW3gJ4zl9L/DUreDb4c7Kdjaioczfksc6oTwFpmuxDBN2sfgrFctpW5lP4xAr+HpwLVCSDnVdaeiYDS/8/gL/qNT5pEEOEFJ825t+ZUJQBpZtsr6GtGofSXfZBry8E9/77HUqAaAVgy294bMYOTSgnS07kla9UIhIgqIGG0t7cEqxFAjvRfc8K9NwotBCkJXuvYmmQcUQ3tTZVWIQDPzLbX/kBEZ5+SRe3n4lFJsYYCshJ17vziBFDKiImJr66uvtvDE4OocnfqRAj5GxUbBBa5QS0ZV5wArNJ/6zI1JenWWTR/L0WQmrOszUHiHFEd1VZD3vYc1itKAJ7SfwsApINuna31rj+67o1Kkq363NgfixEAwmit9QeiytsI0n96hqhYtd4PKEYASNnWAhEgCFKjVCI5ONKnlrBrvRQoQgA1pf+aU6OlK6W/hnLW55TuKWlO3HIp4E4AETNbNANFlbNj54+a2aJiF0kpSUjMnQAiyrQESJQXiSIS5JzDRHboiD4WlTC3yMCVAKJI/7VLo/sDEZ13ilc0xTTTEHz65Pr22ZZz1/575JJzCQs3Amglsw1AIF4kiipfW5D+fCpQhs7cCKCFzLYgdX+p9UUkERtYM9n/61berozoc62VAi4E0EJm2+LP0rK3ofLo5RZWUf6eflJ8/COfUc7VUilgJoDWpD+iP7AnjKIEWfRzRG6ijrEzE0BEGWZ1Du9GYQvS34oZ599HoIUPDJkIYA/Sf81xPaRcC9KfwVsGgRb6AWoC6EnWavsDPWFUJoTaX1XrO7VuriaAPUr/LdClxuwRoy0Me/x75H6AigD2Lv2XnFQi6Zj9ewz1+TtL/KY2amIC6NmxJUzOxl9tV469n1Q91rqNmAB6bWpJGoK9KqRaTtvqPpIEUuuOYgJIB+uNBKQSjtm/lvu2tY/Uj2rcTkUA6WARfrOtBkBpDwlzM/vXskqb+0iUZI0bqglgONzeiUBqMGb/Gm7b9h6ShFL6pmYCGBFBuN9z8wBPYqyeG6QeWPe0RpS3BN0IYDDenvoD0s7tnu7eUzAi7ipVlqXO6E4Ae+kPaBo2fPGnlJvuc12JuiyFQBEC2ENZoDEO6/9SbrrfddGlQFECaJUItPKMBLDfQC11M43S9DxLFQIYyoK7u7tvI36BwxhQi0FIAJ6u2c9a0l6TJzLVCKCVx4Ya6T/cjQTg6Zp9rWXxOwtS1Qkgclmglf7DndgEtLhi33MtytOCHIwAIj42tLIw3wK0uCLnIkoBOAFEeWzoAT5fBGIQWxGwJiHp/iEIAN0f8JRfVAFSF+T4AQFrCapBMhQBoPoD3qzLNwI1rtjvHO8voZUgGZIAavYHPKT/HOAkAYkb9jk2wu9VhiaA0v0BT+k/58J7/6Rkn2Hrc2uE3J87eXgCKFkWeEv/JddIRNDCS1A+rs1V1hBAyv2mCcCbCFAMnMjgcDg8Hu6Tft7qeDx+wLDBI/DlgxfvlTpFtMAf7tmMAhgbxiOjoj+EUcrRuK4OgZKPcEv1mXQ3fXdWkwQwUgNPz+fz91LmjmwQD6NyDR0C3o9wo2b9MTpNE4CmLCjd+NO5HmdFQcDjde4WAr/pEmDJWXIevdVq/EVxaJ5DhoC1FGhNXe5CAUz7A0tlQWvGkbkuR3shoCkFUE1l6513RwBL/QFK/3VXSU5/Pp8fns/nP66urn49HA4/nk6n51YHqzU/nT89Ubm6uvrO49w5ajLdrSW5P2eL3RLAtD+Akv6Xx3614mB2n5yAWJO+wxtrl8V/TP/NWbPmpccB6/WG3VY/YA+KcvcEUNMJp3tppKT3eSVOKv1CkxRo6bwj1ZD+L4QgljJ2OqNW1SyRYqtyv0sF4B1QkvW2MohkLe1YifIpcd4xSQx3uJQY71zJKt9zJftItr8cFM2amhmT+JrcT2QRTRXl+AwVQA5KyjHSjKrcZnWa5IUnSRCVOKuErKb7W88+R1Rpj0RWT65vPxuUxLDv8Pbm8A5Kq6qABFDCky+/nfjk+vZZoeWzlpU2Pq1BlHWolUFIArCenQRgRXBn863Pkz3gkDolumdBAvCwumwNKgAZXtmj0dk0HVTSAEzjSQDZ5r03UEq2+p18ZzZNAEOWTeCnWu10Oj3yhUe/WomGmvQ00oyKVi3S847xQBMuCUDqnQ7j54LsQgYuL4NYjthaA/CiAJ4i+xYkAIvH6eY2qwByslWSwIg32nLOpjNX/ixNRkKfmwSQb1+vkc0SgERij95kq/J6K7qW1tT/VAC2kNIQrm1Hn9lNEoAlU3m9JroGP7oevRDA19IXUyy4ergjFYAHirI1miQArwAr1S+QqBOZufJHS14AGlYlAeTjOx1JBaDHTjSzlJN6kgG6ASh9AWhsAOTZqQBEoeAyuDkF4JX9l9Cz9gtKEZTE2pZsRAKQIP12rAVz3Y4+s5oigNrBpekXBGkAiuv/wZ1IALrAIgHocBPNKp391w6T+7IR8ozD+S1SmgQgcsm/BpMAdLiJZiGdc3zQtX4BugFoqf9rK6yp8S3EhSZeEoAolOWDI0jr8amXnBVNUlZHRJ6fBCCPC+uMZnoASMecgryUZdEZNJ1T+gGg6d2QOJMArOEsn98EAQTM/r/MffAowjktQZTchwQgD6I0w6q8dLvaZzVBAEinnIN46SUbdB2azqp5AWi4I1rBWMgLjT0JwE5GsytEyKrTBuDr16+v5w6LJipLA3C4D/IOJIBCQbSybHgFgO6q53aq0dnTo/5nCaAPQCoAPXaLM6Nl/7UMG4QA1C8AUQHYHJgEYMNvdnYr2T8dHl2DWuv/NB9NYiwBCgTRxpJhSwC0M0qaf2ksmqw86n+WAPoApALQY9dK9p999BdBOqczeDkgm4A6R/bCX7e7flZIBdBa9o9wXusLQBGIjCWAPpC1M0MSAFpOT8HcYvcIzUpL8Az3RROZ5Q7oHsyWj2gDtPS8cASAdsI5wLccE+18Hg1AKgBbqJEAbPj9NTtCMI2vktNcQysWT+djD0DnyJ420J1ANyuUAgia/Vebf+jOedrfq/5H32VLaa25ODpxkAB0BPTOLLQR566w9W59BNKyBM74zui7WO6B9h0SgJEA0M63UPtvZv8IDcAtkpKYhiWABK23Y0kAOtzC1v4Xab35ai068+T0KCSmIQFI0CIB6NCamYV0vLlL5DI6+ty558w1FPI+LAFyreQ3LkQTMIKMnkKa44wRyhbPBiD6PjmYL7k+Wol5E7FfiK+vFIIAkFlnDp5cWY0OmNwyReJMSFuQACSW8hkLJ4Cg2X+z+ZfgR2eddAbPBmBajwSgCywqAB1uUIdbOnJuUO3pBaABCxKAzpFJAArcImZ/iSGRwXKR/1lKJdc06JKGJUCupfzGQUsAdAadgzHXCdHBUqL+ZwmgDyxJ4tDv4j8TRgARs39u8y+ZIcL5c0sVidsgVU0u+c7dB92PIQFIvCzAN+hYsn+EBqCErCSmIQFI0Ho7lgQgwC2CfJ4eVxpQ6PKlhMOh7UIFIAgip6GQEgAdPAvZX9RQQ2bKUvU/ewD6qCpByPrT5M+sTgDoLLMEjaSejnAHS7Zccw8ksVnuxB5AftCPR1YngIjZX8ree20AUgHogijNkvqQfiffmVUJIELmtDb/0nw0iZVyNrR9qAB8gztntaoEgJZpc4BIm3/oLHmp/0X9ihxHGMawBJCgxacA2Wihs8vSQaWfpotwD0um3DIYCWALofm/l1JlutPkz6qmACJm/wSTpPmXxu+5/kerGwuxof2LBLBCOhGy5kLtL5bSaEfTlCy5+QBtJxJArqX8xlVRAOigWYJLmv0jNAClJYvUVVgCSBF7M54KYAU3pFMtHUtrMPRdLFkyx7WR97PcDZ1ktP6UY5OSY4orALRhVpp/m1/4OZ2LlsianoXUeUgAUsSoAFYRQzrU0sG0dTS6Aag9d65LowmOCiDXUn7jiioAdMCsZH9x8y+thVYzNWQmkrBJAH6BnbtSUQJAOtMaAJrmX1oPfZ/SDUD0HUkAuWHrN64YAUTN/tosipbHyeSWAMl1GSTJWe7XgzrLtaFkXDECQDrSGgBaJ4tAaFrlkusQaJLT2qaX8izXjpJxRQggQrDMgaDN/j05GJK4SQCS0PUZW4QA0J+WW2n+iR/9DWuh71Sj/mcPQB9UluSi39U+050A0DLS+9HfsB4yM9aq/0kA+oAiAVywQ2fKleyvevSX1otAaqXr/wj3ZAmgJyDtTFcFECFQloCwBBC6p1H6BaAxZkilQwLQhrF+nisBRM3+VnmGvpf1/BL3IAFI0Ho7tqaNdCecn+VGAJGzvyWzoOvimvU/+q4WO/E9AB0tuBEA2gClmn8RiM0SGBK3QN/Vck+0/3WtANCOs+bkFqe6NMZ+fnJ9+5kkkDzH1qz/qQD0luuaANDsu2Y2S/MvrYu+W23HYg9ARwK17aQ75f1Z5hIgePZXP/oboEI3AGu9ADTclwSgC61uCQCdIUtmf7Qkrt0ARJO5pVxD+2EUAkg2TH5zOp2e51CZWQEgM8baBT0Mgg6IdD9rCZPjBOMxSHuSAKTWenf8QIISHE0EgGbdks2/CPV/7QYgWvFIHHdqe7QveiQcbfhPX1ST4GgiAGS2WAPLK3B6q/9JANoQrPutwBeZ//ju7u7jrz766cPpqSWqUU0A6NdjN7K/ufmHDoba9X/aD13ySDJXNAWQks7xeHypp5D5mSnIh78cj8cPvnzw4r2tPaoQQNTs71U3o4PB6x5bzjL9O9KuLROAFOdS46XqV6UAesj+6DtKDenlUCQALyQx60h7ESoCQDrJFqyWLDJeu9emEtK2Ftuh7bXll7X+Ln1vREwA6My4BqSU/dbWQgbCpf536WNIHA9d9pAAJNaaH1ucANCd8Y3mn/orv8brogMBVf+jG58kABcCEMWASAFEzv6eNXOEe0o6uXa3ebsCUvlYCCCCzTztoF1L6jciAgie/d0kM7qe9CxlpI5EApAiFmt8MQKIIIvXoJZefG0tNNFJ6zgvF0Tb2KgAnj65vn3mhUWL62hUcLYCGD5kcDgcHidwpi8opH/LeUmhBLDeGROZBS8NQFEd54kp8u4kAJslNXGQTQDSo40II039kzRKfbGGxXGm94pQS3qqGandSABSxOKM1yjHYgSwBIu3vNbInjWToQnA+z5S92yVANI9vX1Lih16fBMEkEDyDDLP7B/BiTRG9HK8lnsACQN089bLDtp1NLFQXQEMl0vOdj6fv7f2DbzlMjIDouv/tD/y/hoHHgcLmsC0ges1TxMLMAIYEYH6Sze9s2UEB9IY0cuBWicA9Pk97aBZS+M7cAK4lAQqNaC5MOv/dddqWQH0XAZoe0chCECjBjSPPLZYFd1EKnGnrTtHktDWEmBIJj2+D6D1nVAEIFEDHs4yDQ5k9otQ/6MltJdNe2wGasvhcAQwBOWaEbVyZ0P+w98k8woASdaPRIJe94/Qy7HYQDN3dwSwJue0l2X9v+1aSBXkRQAX31E3l7dRijdCi11YBTCGeKoGvJt/EZpH2hrO0xXRmVPrxEsY9FQKaGOiCQIYM3qJ7I+ufS/1v9unGS2ksBcFMGCAbuxabCGZu3sCkIAhHYvOfFEagGgi9FYAvZCApSfWjAKQBrVkvOeryZJ9x2O1DK7db2ne3hRADyRgKR9JAAHeIbcY0JMA0EqolAIYMIpA9J72GtaylMUkAPD775Hq/xLOGW1NNMmVwMNCnN0TQASHsBiwhEP1sGZSA+fz+aH1w2gRsLL4Dwng5ib7efHw80/p25Byf6Ypx0Gi1P85Z93bGK9PpSJxsfhP9wSQ+6x4rc6a+7q0RBDJKbYyjKWDi3S6Pe6dVIE3uZfGyeo/3RPA1nNijwbdGkGkH5Q8nU6PSjsK15cjMPe1dvJVys+w+E/XBLBW/1/k/jen0+l5eRNyByKAQaB3ArhX/zPwMY7IXTEIdE0A0/rf8jwVYz7uSgRsCHRNAEP971Hn28zA2UQAg0D3BHA8HlnnY3yPuwZAoGsCCIA/j0AEoAiQAKDwc3MigEWABIDFn7sTASgCJAAo/NycCGARIAFg8efuRACKAAkACj83JwJYBEgAWPy5OxGAIkACgMLPzYkAFgESABZ/7k4EoAiQAKDwc3MigEXg/3RJSjqynhnMAAAAAElFTkSuQmCC',
};

const css = `
  /* 修改模型信息的弹窗宽度 */
  body > div > div.el-dialog[aria-label="修改模型"],
  body > div > div.el-dialog[aria-label="数据集详情"],
  body > div > div.el-dialog[aria-label="数据模型配置"] {
    width: 75% !important;
  }

  /* 列表设计的按钮设置弹窗宽度 */
  body > div > div.el-dialog[aria-label="导出"],
  body > div > div.el-dialog[aria-label="下载模板"] {
    width: 75% !important;
  }

  /* 逻辑设计，调整画布侧边栏宽度 */
  .canvas-tool {
    width: 260px !important;
  }

  /* 逻辑设计，画布列表的图标 */
  .canvas-tool-item > svg {
    display: none;
  }

  /* 调整画布右边的按钮位置 */
  .itempannel-box {
    left: 280px !important;
  }

  /* 新版 JVS，逻辑设计，把浮动操作栏的宽度减小到 45% */
  .tool-bar {
    width: 45% !important;
  }

  /* 新版 JVS，逻辑设计，组件详情底部的按钮，设置高度，原本 32px，改成 72px */
  #node_detailpannel > div.block-container > div > form > div.el-row > div.form-item-btn.el-col.el-col-24 > div > div {
    .el-button,
    span {
      height: 72px !important;
      width: 90px !important;
    }
  }

  /* 逻辑设计，展开组件库的组件名称（换行） */
  .left-tool-list {
    li.getItem > span {
      white-space: normal !important;
    }
  }

  /* 放大公式 icon，原本 16px */
  .add-formula-svg {
    width: 22px !important;
    height: 22px !important;
  }

  /* 移除新版逻辑设计右下角遮挡按钮的透明条 */
  .cont-box-right > .tool-bar {
    display: none !important;
  }

  /* 逻辑设计，展开组件名称 */
  .ef-node-text,
  .canvas-tool-item {
    white-space: normal !important;
    width: 100% !important;
    color: #363b4c !important;
  }

  /* 逻辑设计，调整页面设置和已使用逻辑的宽度 */
  .content-box:has(.page-setting),
  .content-box:has(.used-logic),
  .content-box:has(.permission-page) {
    width: 80% !important;
    margin-left: 10% !important;
  }

  .content-box > .page-setting,
  .content-box > .used-logic,
  .content-box > .permission-box,
  .content-box > .permission-page {
    width: 99% !important;
  }

  /* 逻辑设计，设计名称输入框 */
  #app > div > div > div.design-header-box > div.header-left > div.el-input.el-input--mini > input.el-input__inner {
    width: 300px !important;
  }

  /* 逻辑设计，设计名称编辑 icon */
  #app > div > div > div.design-header-box > div.header-left > span > svg {
    width: 22px !important;
    height: 22px !important;
  }

  /* 自己加的组件 */

  /* 日志弹窗 */
  .popup {
    border: 1px solid #e0e0e0 !important;
    border-radius: 5px !important;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
    background-color: #fff !important;
    position: fixed;
    top: 50px;
    right: 310px;
    z-index: 9999;
    background-color: white;
    padding: 10px;
    max-height: 800px;
    overflow-y: auto;
  }

  .table-11ze {
    font-size: 14px !important;
    min-width: 800px !important;
    border-bottom: 1px solid #dddddd !important;
    text-align: left !important;
  }

  /* 日志弹窗的表格 */
  .log-11ze-table-tr > td,
  .log-11ze-table-tr > th {
    padding: 0px 0px 5px 5px !important;
  }

  .log-11ze-table-tr:hover {
    background-color: #d5e3fb; /* 悬停时的背景颜色 */
  }

  .log-11ze-select-container {
    display: inline-block;
    margin-right: 10px;
  }
  .log-11ze-select-label {
    display: inline-block;
    margin-right: 5px;
    font-size: 14px;
  }
  .log-11ze-select {
    display: inline-block;
    background-color: white !important;
    border-color: #d4e3fc !important;
    color: black !important;
    border: 1px solid #23272e !important;
    font-size: 14px !important;
    &:hover {
      background-color: #f5f6f7 !important;
      cursor: pointer;
    }
  }

  /* 按钮统一样式 */
  .button-11ze {
    background-color: white !important;
    border-color: #d4e3fc !important;
    color: black !important;
    border: 1px solid #e0e0e0 !important;
    &:hover {
      background-color: #f5f6f7 !important;
      cursor: pointer;
    }
  }

  /* 逻辑设计左上角的逻辑列表弹窗 */
  .other-rule-list {
    width: 500px !important;
  }

  /* 应用中心， 移除每个分类末尾的透明方块（影响点击） */
  #app > div > div > div.jvs-layout.jvs-layout-tempOpen > div.template-content-box > div > div > div > div > div > div > img {
    display: none !important;
  }
`;

GM_addStyle(css);
