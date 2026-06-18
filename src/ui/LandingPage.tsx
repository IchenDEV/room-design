import { Ic } from './icons';

const base = import.meta.env.BASE_URL;
const preview = `${base}editor-preview.png`;
const preview3d = `${base}editor-preview-3d.png`;
const studio = '#/studio';

const flow = [
  ['plan', '画户型', '墙体、门窗、房间和尺寸标注都在一张图上完成。'],
  ['cube', '看效果', '随时切换 3D，确认家具比例和空间关系。'],
  ['rotate', '同步更新', '平面改动会实时反映到 3D。'],
];

const electric = [
  ['outlet', '电源插座', '常规墙插点位。'],
  ['solid', '地插', '餐桌、办公桌等点位。'],
  ['sample', '弱电箱', '弱电与网络归位。'],
  ['door', '门禁', '出入口控制点位。'],
];

const files = [
  ['sample', '新建 / 打开', '多个方案文件保存在本地。'],
  ['copy', '复制 / 对比', '快速生成备选布局。'],
  ['upload', '导入 / 导出', 'JSON 格式，便于迁移。'],
  ['trash', '清理', '删除草稿。'],
];

function FeatureRow({ items }: { items: string[][] }) {
  return (
    <div className="landing-grid">
      {items.map(([icon, title, text]) => (
        <article className="landing-card" key={title}>
          <span className="landing-icon"><Ic n={icon} size={24} /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="landing" id="top">
      <header className="landing-nav">
        <a className="landing-brand" href="#top"><span>栖</span><b>栖居 Rooms</b></a>
        <nav aria-label="官网导航">
          <a href="#top">产品</a>
          <a href="#features">功能</a>
          <a href="#examples">示例</a>
        </nav>
        <a className="nav-cta" href={studio}>开始设计</a>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <h1>在线画户型<span>看装修效果</span></h1>
          <p>从墙体、门窗到家具摆放，在 2D 平面图上完成设计，随时切换 3D 预览。</p>
          <div className="hero-actions">
            <a className="primary" href={studio}>开始设计</a>
            <a className="secondary" href="#examples">查看示例</a>
          </div>
          <div className="hero-notes">
            <span>本地实时保存</span><span>厘米级尺寸</span><span>多方案编辑</span>
          </div>
        </div>
        <figure className="hero-shot">
          <img className="shot-main" src={preview} alt="栖居 Rooms 2D 平面图编辑界面" />
          <img className="shot-float" src={preview3d} alt="栖居 Rooms 3D 效果预览界面" />
        </figure>
      </section>

      <section className="landing-band" id="features">
        <div>
          <h2>从平面到 3D</h2>
          <p>画完户型即可切换立体效果，确认家具比例与动线。</p>
        </div>
        <FeatureRow items={flow} />
      </section>

      <section className="landing-split" id="examples">
        <div className="device-line" aria-hidden>
          {electric.map(([icon, title]) => <span key={title}><Ic n={icon} size={22} />{title}</span>)}
        </div>
        <div>
          <h2>电源与弱电点位</h2>
          <p>插座、地插、弱电箱和门禁可以像家具一样放置到墙面。</p>
          <FeatureRow items={electric} />
        </div>
      </section>

      <section className="landing-band compact">
        <div>
          <h2>多方案管理</h2>
          <p>同一个浏览器里保留多份方案，可随时复制、切换、导入和导出。</p>
        </div>
        <FeatureRow items={files} />
      </section>

      <section className="landing-cta">
        <h2>打开即可开始</h2>
        <p>无需安装，浏览器里直接用。</p>
        <div className="hero-actions">
          <a className="primary light" href={studio}>开始设计</a>
          <a className="secondary light" href="#top">返回顶部</a>
        </div>
      </section>
    </main>
  );
}
