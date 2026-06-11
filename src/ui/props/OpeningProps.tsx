import { store } from '../../core/store/store';
import { openingOf, wallOf } from '../../core/store/selectors';
import { deleteSelection } from '../../core/store/actions';
import { wallLen } from '../../core/geometry/vec';
import { Check, KV, Section, SliderNum, BtnRow } from './widgets';
import type { Opening } from '../../core/types';

export function OpeningProps({ id }: { id: string }) {
  const o = openingOf(store, id);
  const w = o && wallOf(store, o.wallId);
  if (!o || !w) return null;
  const isDoor = o.kind === 'door';
  const maxW = Math.max(40, wallLen(w) - 10);

  const mut = (fn: (x: Opening) => void, commit: boolean) => {
    store.begin();
    store.update((p) => { const t = p.openings.find((x) => x.id === id); if (t) fn(t); });
    if (commit) store.end();
  };

  return (
    <>
      <Section title={isDoor ? (o.style === 'glass' ? '玻璃门属性' : '门属性') : '窗属性'}>
        <SliderNum label="宽度" min={40} max={Math.min(maxW, 400)} value={o.width}
          onPreview={(v) => mut((x) => { x.width = v; }, false)} onCommit={(v) => mut((x) => { x.width = v; }, true)} />
        <SliderNum label="高度" min={60} max={Math.min(300, w.height - 10)} value={o.height}
          onPreview={(v) => mut((x) => { x.height = v; }, false)} onCommit={(v) => mut((x) => { x.height = v; }, true)} />
        {!isDoor && (
          <SliderNum label="窗台高" min={0} max={Math.max(0, w.height - o.height - 10)} value={o.sill}
            onPreview={(v) => mut((x) => { x.sill = v; }, false)} onCommit={(v) => mut((x) => { x.sill = v; }, true)} />
        )}
        <KV k="所在墙" v={`${Math.round(wallLen(w))} cm`} />
      </Section>
      {isDoor && (
        <Section title="样式">
          <Check label="玻璃门（铝框 + 透明玻璃）" checked={o.style === 'glass'}
            onChange={(v) => store.commit((p) => { const t = p.openings.find((x) => x.id === id); if (t) t.style = v ? 'glass' : 'wood'; })} />
          <Check label="翻转开门方向" checked={o.flip}
            onChange={(v) => store.commit((p) => { const t = p.openings.find((x) => x.id === id); if (t) t.flip = v; })} />
        </Section>
      )}
      <BtnRow>
        <button className="btn danger" onClick={() => deleteSelection(store)}>删除{isDoor ? '门' : '窗'}</button>
      </BtnRow>
    </>
  );
}
