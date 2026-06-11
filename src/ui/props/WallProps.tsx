import { store } from '../../core/store/store';
import { openingsOnWall, wallOf } from '../../core/store/selectors';
import { deleteSelection, setWallLength } from '../../core/store/actions';
import { wallLen } from '../../core/geometry/vec';
import { WALL_COLORS } from '../../core/catalog/catalog';
import { KV, NumField, Section, SliderNum, Swatches, BtnRow } from './widgets';
import type { Wall } from '../../core/types';

export function WallProps({ id }: { id: string }) {
  const w = wallOf(store, id);
  if (!w) return null;
  const glass = w.material === 'glass';

  const mut = (fn: (x: Wall) => void, commit: boolean) => {
    store.begin();
    store.update((p) => { const t = p.walls.find((x) => x.id === id); if (t) fn(t); });
    if (commit) store.end();
  };

  return (
    <>
      <Section title={glass ? '玻璃墙属性' : '墙体属性'}>
        <NumField label="长度（精确）" value={wallLen(w)} min={10} max={5000}
          onCommit={(v) => setWallLength(store, id, v)} />
        <SliderNum label="厚度" min={4} max={50} value={w.thickness}
          onPreview={(v) => mut((x) => { x.thickness = v; }, false)} onCommit={(v) => mut((x) => { x.thickness = v; }, true)} />
        <SliderNum label="高度" min={120} max={400} value={w.height}
          onPreview={(v) => mut((x) => { x.height = v; }, false)} onCommit={(v) => mut((x) => { x.height = v; }, true)} />
        <KV k="门窗数量" v={`${openingsOnWall(store, id).length}`} />
      </Section>
      <Section title="材质">
        <div className="seg-row">
          <button className={`seg-btn ${!glass ? 'on' : ''}`}
            onClick={() => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.material = 'solid'; })}>
            实体墙
          </button>
          <button className={`seg-btn ${glass ? 'on' : ''}`}
            onClick={() => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.material = 'glass'; })}>
            玻璃墙
          </button>
        </div>
        {!glass && (
          <Swatches colors={WALL_COLORS} value={w.color}
            onPick={(c) => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.color = c; })} />
        )}
      </Section>
      <BtnRow>
        <button className="btn danger" onClick={() => deleteSelection(store)}>删除墙体</button>
      </BtnRow>
    </>
  );
}
