// 亮暗色切换 · 按钮定稿基准
// 定稿「墨盘」= src/color_mode_switch.user.js v0.1.3 的视觉基准：
// 黑底白月 + 发丝描边补暗页隐身，hover 三联动（上浮/描边亮/浮字）
// 历史对比稿（基准 v0.1.2 与 B/C/D 方向）已删减，见提交记录

function MoonIcon({ size = 22, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill={color} d="M12 22c5.523 0 10-4.477 10-10 0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2 6.477 2 2 6.477 2 12s4.477 10 10 10" />
    </svg>
  );
}

// 反转后页面的骨架 mock：light = 暗站反转成亮页（主场景），dark = 亮站反转成暗页（罕用）
function PageMock({ dark }) {
  return (
    <div className={'pgm ' + (dark ? 'pgm--dark' : 'pgm--light')}>
      <div className="pgm-nav">
        <div className="pgm-logo"></div>
        <div className="pgm-navitem" style={{ width: 38 }}></div>
        <div className="pgm-navitem"></div>
        <div className="pgm-navitem"></div>
      </div>
      <div className="pgm-body">
        <div className="pgm-main">
          <div className="pgm-head"></div>
          <div className="pgm-line" style={{ width: '92%' }}></div>
          <div className="pgm-line" style={{ width: '86%' }}></div>
          <div className="pgm-line" style={{ width: '64%' }}></div>
        </div>
        <div className="pgm-side"></div>
      </div>
      <div className="pgm-body2">
        <div className="pgm-line" style={{ width: '40%' }}></div>
        <div className="pgm-line" style={{ width: '72%' }}></div>
        <div className="pgm-line" style={{ width: '55%' }}></div>
      </div>
    </div>
  );
}

// 定稿按钮，两画板皆可真实 hover
function FinalButton({ dark }) {
  return (
    <React.Fragment>
      <PageMock dark={dark} />
      <div className="cmw cmw-a">
        <div className="cm-tip">还原配色</div>
        <button className="cma-btn"><MoonIcon size={22} /></button>
      </div>
    </React.Fragment>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="final" title="定稿 · 墨盘 v0.1.3" subtitle="黑底白月 + 发丝描边 · hover 上浮/描边亮/浮字 · 按钮可真实 hover">
        <DCArtboard id="final-light" label="亮页 · 主场景" width={460} height={320}>
          <FinalButton dark={false} />
        </DCArtboard>
        <DCArtboard id="final-dark" label="暗页 · 罕用" width={460} height={320}>
          <FinalButton dark={true} />
        </DCArtboard>
        <DCPostIt top={40} left={1130} width={230}>
          <b>实现约束</b><br />
          · 样式必须内联，图标是 base64 img（防站点样式污染）<br />
          · 容器在整页反转的二次抵消组内，按钮显示真实颜色<br />
          · 无外部资源，Chromium 120+<br />
          · 关闭态页面无任何入口
        </DCPostIt>
        <DCPostIt top={250} left={1130} width={230} rotate={1.5}>
          <b>定稿决策 2026-10-31</b><br />
          · 常态全不透明（v0.1.2 的 0.7 会把描边压没）<br />
          · 描边是暗页存活的唯一手段，删掉即回归隐身<br />
          · tooltip 挂 button 内、气泡自带描边<br />
          · 主场景：暗站反转成亮页；罕用：亮站反转成暗页
        </DCPostIt>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
