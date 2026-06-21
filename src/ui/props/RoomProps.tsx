import { store } from '../../core/store/store';
import { metaOf, roomByMeta, roomPerimeter } from '../../core/store/selectors';
import { deleteSelection } from '../../core/store/actions';
import { CEILING_COLORS, CEILING_STYLES, FLOORS } from '../../core/catalog/catalog';
import { normalizeCeiling, type CeilingConfig } from '../../core/types';
import { ActionBtn, ChoiceGrid, KV, Section, BtnRow, SliderNum, Swatches } from './widgets';

export function RoomProps({ metaId }: { metaId: string }) {
  const meta = metaOf(store, metaId);
  const room = roomByMeta(store, metaId);
  if (!meta) return null;
  const ceiling = normalizeCeiling(meta.ceiling);
  const patchCeiling = (patch: Partial<CeilingConfig>, commit = true) => {
    store.begin();
    store.update((p) => {
      const m = p.roomMetas.find((x) => x.id === metaId);
      if (m) m.ceiling = { ...normalizeCeiling(m.ceiling), ...patch };
    });
    if (commit) store.end();
  };

  return (
    <>
      <Section title="房间属性">
        <input className="text-input" key={meta.name} defaultValue={meta.name} placeholder="房间名称"
          onBlur={(e) => {
            const name = e.target.value.trim() || '房间';
            store.commit((p) => { const m = p.roomMetas.find((x) => x.id === metaId); if (m) m.name = name; });
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        {room && <KV k="面积" v={`${(room.area / 10000).toFixed(2)} ㎡`} />}
        {room && <KV k="周长" v={`${roomPerimeter(room).toFixed(1)} m`} />}
      </Section>
      <Section title="地面材质">
        <div className="floor-grid">
          {FLOORS.map((f) => (
            <button key={f.id} className={`floor-card ${meta.floor === f.id ? 'on' : ''}`}
              onClick={() => store.commit((p) => { const m = p.roomMetas.find((x) => x.id === metaId); if (m) m.floor = f.id; })}>
              <span className="floor-chip" style={{ background: f.base }} />
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="吊顶配置">
        {!store.project.settings.showCeiling && <KV k="3D 状态" v="全局关闭" />}
        <ChoiceGrid options={CEILING_STYLES} value={ceiling.style}
          onPick={(style) => patchCeiling({ style })} />
        {ceiling.style !== 'none' && (
          <>
            <SliderNum label="下吊" min={6} max={60} value={ceiling.drop}
              onPreview={(v) => patchCeiling({ drop: v }, false)}
              onCommit={(v) => patchCeiling({ drop: v })} />
            <SliderNum label="边距" min={18} max={120} value={ceiling.inset}
              onPreview={(v) => patchCeiling({ inset: v }, false)}
              onCommit={(v) => patchCeiling({ inset: v })} />
            <Swatches colors={CEILING_COLORS} value={ceiling.color}
              onPick={(color) => patchCeiling({ color })} />
          </>
        )}
      </Section>
      <BtnRow>
        <ActionBtn icon="trash" danger onClick={() => deleteSelection(store)}>移除房间标注</ActionBtn>
      </BtnRow>
    </>
  );
}
