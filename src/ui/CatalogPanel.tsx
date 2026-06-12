import { useEffect, useRef, useState } from 'react';
import { CATALOG, CATS } from '../core/catalog/catalog';
import type { CatId, FurnDef } from '../core/catalog/catalog';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { drawThumb } from '../editor2d/glyphs/glyphs';
import { Ic } from './icons';

const CAT_ICONS: Record<CatId, string> = {
  living: 'sofa',
  bedroom: 'bed',
  dining: 'dining',
  bath: 'bath',
  seat: 'chair',
  office: 'office',
};

function Thumb({ def }: { def: FurnDef }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawThumb(ref.current, def);
  }, [def]);
  return <canvas ref={ref} className="cat-thumb" />;
}

export function CatalogPanel() {
  useTick();
  const [cat, setCat] = useState<CatId>('living');
  const [q, setQ] = useState('');
  const tool = store.ui.tool;
  const query = q.trim().toLowerCase();
  const items = CATALOG.filter((d) => d.cat === cat && (!query || `${d.name} ${d.id}`.toLowerCase().includes(query)));

  return (
    <aside className="catalog">
      <div className="panel-title">素材库</div>
      <div className="cat-tabs">
        {CATS.map((c) => (
          <button key={c.id} className={`cat-tab ${cat === c.id ? 'on' : ''}`} onClick={() => { setCat(c.id); setQ(''); }}>
            <Ic n={CAT_ICONS[c.id]} size={13} /><span>{c.name}</span>
          </button>
        ))}
      </div>
      <input className="cat-search" value={q} placeholder="搜索家具"
        onChange={(e) => setQ(e.target.value)} />
      <div className="cat-grid">
        {items.map((d) => {
          const active = tool.type === 'place' && tool.defId === d.id;
          return (
            <button key={d.id} className={`cat-card ${active ? 'on' : ''}`}
              title={`${d.name} ${d.w}×${d.d}×${d.h}cm`}
              onClick={() => store.setTool(active ? { type: 'select' } : { type: 'place', defId: d.id })}>
              <Thumb def={d} />
              <div className="cat-name">{d.name}</div>
              <div className="cat-dims">{d.w}×{d.d} cm</div>
            </button>
          );
        })}
      </div>
      <div className="cat-tip">点击素材后，在 2D 画布上点击放置；靠墙自动贴齐。</div>
    </aside>
  );
}
