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
  electric: 'outlet',
  seat: 'chair',
  office: 'office',
};

const CAT_COUNTS = Object.fromEntries(
  CATS.map((c) => [c.id, CATALOG.filter((d) => d.cat === c.id).length]),
) as Record<CatId, number>;

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
  const open = store.ui.panelL;
  const toggle = () => store.patchUI({ panelL: !open });
  const countKey = `${cat}:${query}:${items.length}`;

  if (!open) return (
    <aside className="catalog collapsed">
      <button className="panel-edge" title="展开素材库" onClick={toggle}>
        <Ic n="chev" size={14} />
      </button>
    </aside>
  );

  return (
    <aside className="catalog">
      <div className="panel-head">
        <div className="panel-heading">
          <span className="panel-title">素材库</span>
          <span className="catalog-total" aria-label={`${items.length} ${query ? '件匹配素材' : '件可用素材'}`} aria-live="polite">
            <b key={countKey}>{items.length}</b><span>{query ? '匹配' : '可用'}</span>
          </span>
        </div>
        <button className="panel-collapse" title="收起素材库" onClick={toggle}>
          <Ic n="chev" size={14} />
        </button>
      </div>
      <div className="cat-tabs">
        {CATS.map((c) => (
          <button key={c.id} className={`cat-tab ${cat === c.id ? 'on' : ''}`}
            aria-label={`${c.name}，${CAT_COUNTS[c.id]} 件素材`}
            title={`${c.name} · ${CAT_COUNTS[c.id]} 件素材`}
            onClick={() => { setCat(c.id); setQ(''); }}>
            <span className="cat-tab-main">
              <Ic n={CAT_ICONS[c.id]} size={13} /><span>{c.name}</span>
            </span>
            <span className="cat-count" aria-hidden="true">{CAT_COUNTS[c.id]}</span>
          </button>
        ))}
      </div>
      <input className="cat-search" value={q} placeholder="搜索素材"
        onChange={(e) => setQ(e.target.value)} />
      <div className="cat-grid">
        {items.map((d, index) => {
          const active = tool.type === 'place' && tool.defId === d.id;
          return (
            <button key={d.id} className={`cat-card ${active ? 'on' : ''}`}
              title={`${d.name} ${d.w}×${d.d}×${d.h}cm`}
              style={{ animationDelay: `${Math.min(index, 10) * 14}ms` }}
              onClick={() => store.setTool(active ? { type: 'select' } : { type: 'place', defId: d.id })}>
              <Thumb def={d} />
              <div className="cat-name">{d.name}</div>
              <div className="cat-dims">{d.w}×{d.d} cm</div>
            </button>
          );
        })}
      </div>
      <div className="cat-tip">选中素材后，在画布上点击放置。</div>
    </aside>
  );
}
