import { store } from '../../core/store/store';
import { metaOf, roomByMeta, roomPerimeter } from '../../core/store/selectors';
import { deleteSelection } from '../../core/store/actions';
import { FLOORS } from '../../core/catalog/catalog';
import { ActionBtn, KV, Section, BtnRow } from './widgets';

export function RoomProps({ metaId }: { metaId: string }) {
  const meta = metaOf(store, metaId);
  const room = roomByMeta(store, metaId);
  if (!meta) return null;

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
      <BtnRow>
        <ActionBtn icon="trash" danger onClick={() => deleteSelection(store)}>移除房间标注</ActionBtn>
      </BtnRow>
    </>
  );
}
