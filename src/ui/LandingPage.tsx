import { Ic } from './icons';
import { capabilities, proof, workflow } from './landingContent';

const base = import.meta.env.BASE_URL;
const logoMark = `${base}qiju-logo-mark.svg`;
const preview = `${base}editor-preview.png`;
const preview3d = `${base}editor-preview-3d.png`;
const studio = '#/studio';

function FeatureGrid({ items }: { items: string[][] }) {
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
        <a className="landing-brand" href="#top">
          <img className="landing-brand-mark" src={logoMark} alt="" aria-hidden="true" />
          <b>栖居 Rooms</b>
        </a>
        <nav aria-label="官网导航">
          <a href="#top">产品</a>
          <a href="#workflow">流程</a>
          <a href="#collab">协作</a>
          <a href="#capabilities">能力</a>
        </nav>
        <a className="nav-cta" href={studio}>开始设计</a>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <h1>在线画户型<span>看装修效果</span></h1>
          <p>从墙体、门窗到家具摆放，在 2D 平面图上完成设计，随时切换 3D 预览。</p>
          <div className="hero-actions">
            <a className="primary" href={studio}>开始设计</a>
            <a className="secondary" href="#workflow">查看示例</a>
          </div>
          <div className="hero-notes">
            <span>云端自动保存</span><span>厘米级尺寸</span><span>实时多人协作</span>
          </div>
        </div>
        <figure className="hero-shot">
          <img className="shot-main" src={preview} alt="栖居 Rooms 2D 平面图编辑界面" />
          <img className="shot-float" src={preview3d} alt="栖居 Rooms 3D 效果预览界面" />
        </figure>
      </section>

      <section className="landing-proof" aria-label="产品能力概览">
        {proof.map(([icon, title, text]) => (
          <article key={title}>
            <span><Ic n={icon} size={24} /></span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="landing-workflow" id="workflow">
        <div className="section-copy">
          <h2>为室内设计全流程提供高效工具</h2>
          <p>从空白户型、家具尺度、电源点位到 3D 检查，都在同一个工作台里完成。</p>
        </div>
        <div className="workflow-shell">
          <div className="workflow-tabs" aria-label="设计流程">
            {workflow.map(([icon, title]) => (
              <span key={title}><Ic n={icon} size={18} />{title}</span>
            ))}
          </div>
          <div className="workflow-preview">
            <div className="workflow-plan" aria-hidden="true">
              <span className="plan-room large">客厅 / 餐厅</span>
              <span className="plan-room bed">主卧</span>
              <span className="plan-room bath">卫浴</span>
              <span className="plan-room hall">走廊</span>
              <i className="plan-line x top" />
              <i className="plan-line x mid" />
              <i className="plan-line y left" />
              <i className="plan-line y right" />
            </div>
            <ul className="workflow-list">
              {workflow.map(([icon, title, text]) => (
                <li key={title}>
                  <Ic n={icon} size={17} />
                  <div>
                    <b>{title}</b>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-band compact" id="collab">
        <div className="section-copy">
          <h2>云端协作</h2>
          <p>登录账号，方案自动上云；生成邀请链接，团队可以围绕同一个户型快速沟通。</p>
        </div>
        <div className="collab-panel">
          <span><Ic n="cloud" size={22} />云端同步</span>
          <span><Ic n="user" size={22} />账号管理</span>
          <span><Ic n="share" size={22} />协作分享</span>
          <span><Ic n="sync" size={22} />自动保存</span>
        </div>
      </section>

      <section className="landing-capabilities" id="capabilities">
        <div className="section-copy">
          <h2>专业设计工作台需要的细节</h2>
          <p>不是简单白板，而是围绕户型、家具、点位、协作和交付组织的工具链。</p>
        </div>
        <FeatureGrid items={capabilities} />
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
