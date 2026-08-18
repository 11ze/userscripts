# UI/UX 设计规范

写 UI（颜色、圆角、阴影、动画）前读本文。

## 柔和色彩方案（JVS 脚本）

```javascript
const colorScheme = {
  data: '#FFD6E7',      // 数据 - 柔和粉色
  logic: '#D6E4FF',     // 逻辑 - 柔和蓝色
  loop: '#D9F7D9',      // 循环 - 柔和绿色
  warning: '#FEF0C7',   // 警告 - 柔和黄色
  variable: '#EFDBFF',  // 变量 - 柔和紫色
};
```

## 主题色系统（url_viewer 的按钮配色）

```javascript
const theme = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryBg: '#eff6ff',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  success: '#10b981',
  error: '#ef4444',
};
```

## 统一设计元素

- **圆角**：6px-12px
- **阴影**：`0 2px 8px rgba(0, 0, 0, 0.06)`
- **动画时长**：200ms
- **动画缓动**：`cubic-bezier(0.4, 0, 0.2, 1)`
