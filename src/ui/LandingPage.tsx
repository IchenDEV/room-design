import { Ic } from './icons';

const base = import.meta.env.BASE_URL;
const preview = `${base}editor-preview.png`;
const preview3d = `${base}editor-preview-3d.png`;
const studio = '#/studio';

const flow = [
  ['plan', '高效 2D 绘制', '墙体、门窗、房间和尺寸标注一处完成，适合快速梳理空间动线。'],
  ['cube', '实时 3D 预览', '随时切换立体效果，检查家具比例、视线关系和整体氛围。'],
  ['rotate', '双向调整', '平面修改会同步影响 3D 结果，减少重复建模和返工。'],
];

const electric = [
  ['outlet', '电源插座', '常规墙插点位规划。'],
  ['solid', '地插', '餐桌、办公桌等场景。'],
  ['sample', '弱电箱', '贴墙弱电与网络归位。'],
  ['door', '门禁', '出入口控制点位。'],
];

const files = [
  ['sample', '新建 / 打开', '多个方案文件保存在本地。'],
  ['copy', '复制 / 对比', '快速生成备选布局。'],
  ['upload', '导入 / 导出', 'JSON 数据便于迁移。'],
  ['trash', '清理', '删除无用草稿。'],
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
          <h1>在线规划你的<span>下一间房</span></h1>
          <p>从墙体、门窗到家具、电源点位，一次完成 2D 平面和 3D 预览。</p>
          <div className="hero-actions">
            <a className="primary" href={studio}>开始设计</a>
            <a className="secondary" href="#examples">查看示例</a>
          </div>
          <div className="hero-notes">
            <span>本地实时保存</span><span>厘米级尺寸</span><span>多方案编辑</span>
          </div>
        </div>
        <figure className="hero-shot">
          <img className="shot-main" src={preview} alt="栖居 Rooms 2D 平面设计器界面" />
          <img className="shot-float" src={preview3d} alt="栖居 Rooms 3D 预览界面" />
          <figcaption>真实设计器预览</figcaption>
        </figure>
      </section>

      <section className="landing-band" id="features">
        <div>
          <h2>从 2D 到 3D，所见即所得</h2>
          <p>先画平面，再检查空间效果。适合装修前沟通、家具摆放推演和点位规划。</p>
        </div>
        <FeatureRow items={flow} />
      </section>

      <section className="landing-split" id="examples">
        <div className="device-line" aria-hidden>
          {electric.map(([icon, title]) => <span key={title}><Ic n={icon} size={22} />{title}</span>)}
        </div>
        <div>
          <h2>电源与弱电规划，安全又专业</h2>
          <p>插座、地插、弱电箱和门禁可以作为家具一样拖放，提前发现遮挡、走线和使用习惯问题。</p>
          <FeatureRow items={electric} />
        </div>
      </section>

      <section className="landing-band compact">
        <div>
          <h2>本地多文件项目管理</h2>
          <p>同一浏览器内保留多个方案文件，随时复制、切换、导入和导出。</p>
        </div>
        <FeatureRow items={files} />
      </section>

      <section className="landing-cta">
        <h2>立即开始设计你的理想空间</h2>
        <p>打开即用，无需安装。</p>
        <div className="hero-actions">
          <a className="primary light" href={studio}>开始设计</a>
          <a className="secondary light" href="#top">返回顶部</a>
        </div>
      </section>
    </main>
  );
}
