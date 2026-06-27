import { useState } from 'react';
import { store } from '../../core/store/store';
import { useTick } from '../../core/store/react';
import { TEMPLATE_STYLES, buildTemplatePlans, type TemplatePlan } from '../../core/templates/plans';
import type { TemplateStyle } from '../../core/templates/analysis';
import { toastOk, toastWarn } from '../toast';
import { Ic } from '../icons';

function PlanCard({ plan }: { plan: TemplatePlan }) {
  const run = () => {
    if (plan.disabled) { toastWarn(plan.disabled); return; }
    const count = plan.run();
    toastOk(count ? `已应用「${plan.title}」，新增 ${count} 件元素` : `已应用「${plan.title}」`);
  };
  return (
    <article className={`template-plan ${plan.disabled ? 'disabled' : ''}`}>
      <div className="template-plan-head">
        <div><span className="template-tag">{plan.tag}</span><h3>{plan.title}</h3></div>
        <button className="template-apply" disabled={!!plan.disabled} aria-label={`应用${plan.title}`} onClick={run}>应用</button>
      </div>
      <p>{plan.summary}</p>
      <ul>{plan.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
    </article>
  );
}

export function TemplatesPanel() {
  useTick();
  const [style, setStyle] = useState<TemplateStyle>('warm');
  const { analysis, plans } = buildTemplatePlans(store, style);
  const target = analysis.target;
  return (
    <div className="template-panel">
      <section className="template-summary" aria-label="模板总览">
        <Metric k="目标" v={target ? target.name : '未识别'} />
        <Metric k="面积" v={target ? `${target.area.toFixed(1)}㎡` : '-'} />
        <Metric k="家具" v={target ? `${target.items.length} 件` : `${analysis.itemCount} 件`} />
      </section>
      <section className="template-block" aria-labelledby="template-style-title">
        <div id="template-style-title" className="template-label"><Ic n="template" size={14} />风格</div>
        <div className="seg-row template-style-row" role="group" aria-label="模板风格">
          {TEMPLATE_STYLES.map((s) => (
            <button key={s.id} className={`seg-btn ${style === s.id ? 'on' : ''}`}
              aria-pressed={style === s.id} onClick={() => setStyle(s.id)}>{s.name}</button>
          ))}
        </div>
      </section>
      {!!analysis.notes.length && (
        <div className="template-notes" role="status" aria-live="polite">
          {analysis.notes.map((note) => <span key={note}>{note}</span>)}
        </div>
      )}
      <section className="template-plan-list" aria-label="模板方案">
        {plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
      </section>
    </div>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return <div className="template-metric"><span>{k}</span><b>{v}</b></div>;
}
