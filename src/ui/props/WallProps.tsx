import { store } from '../../core/store/store';
import { openingsOnWall, wallOf } from '../../core/store/selectors';
import { deleteSelection, setWallLength } from '../../core/store/actions';
import { wallLen } from '../../core/geometry/vec';
import { WALL_COLORS, WALL_TEXTURES } from '../../core/catalog/catalog';
import { ActionBtn, KV, NumField, Section, SliderNum, Swatches, BtnRow, ChoiceGrid } from './widgets';
import { Ic } from '../icons';
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
        <NumField label="长度" value={wallLen(w)} min={10} max={5000}
          onCommit={(v) => setWallLength(store, id, v)} />
        <SliderNum label="厚度" min={4} max={50} value={w.thickness}
          onPreview={(v) => mut((x) => { x.thickness = v; }, false)} onCommit={(v) => mut((x) => { x.thickness = v; }, true)} />
        <SliderNum label="高度" min={120} max={400} value={w.height}
          onPreview={(v) => mut((x) => { x.height = v; }, false)} onCommit={(v) => mut((x) => { x.height = v; }, true)} />
        {glass && (
          <SliderNum label="玻璃间隔" min={40} max={260} step={5} value={w.glassGap ?? 120}
            onPreview={(v) => mut((x) => { x.glassGap = v; }, false)} onCommit={(v) => mut((x) => { x.glassGap = v; }, true)} />
        )}
        <KV k="门窗数量" v={`${openingsOnWall(store, id).length}`} />
      </Section>
      <Section title="墙纸 / 墙面材质">
        <div className="seg-row">
          <button className={`seg-btn ${!glass ? 'on' : ''}`}
            onClick={() => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.material = 'solid'; })}>
            <Ic n="solid" size={14} />实体墙
          </button>
          <button className={`seg-btn ${glass ? 'on' : ''}`}
            onClick={() => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.material = 'glass'; })}>
            <Ic n="glass" size={14} />玻璃墙
          </button>
        </div>
        {!glass && (
          <>
            <Swatches colors={WALL_COLORS} value={w.color}
              onPick={(c) => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.color = c; })} />
            <label className="check-row">
              <input className="swatch" type="color" value={w.color}
                onChange={(e) => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.color = e.target.value; })} />
              <span>自定义色</span>
            </label>
            <ChoiceGrid options={WALL_TEXTURES} value={w.texture ?? 'paint'}
              onPick={(v) => store.commit((p) => { const t = p.walls.find((x) => x.id === id); if (t) t.texture = v; })} />
          </>
        )}
      </Section>
      <BtnRow>
        <ActionBtn icon="trash" danger onClick={() => deleteSelection(store)}>删除墙体</ActionBtn>
      </BtnRow>
    </>
  );
}
