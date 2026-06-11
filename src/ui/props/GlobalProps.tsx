import { store } from '../../core/store/store';
import { stats } from '../../core/store/selectors';
import { WALL_COLORS } from '../../core/catalog/catalog';
import { Check, KV, Section, SliderNum } from './widgets';

export function GlobalProps() {
  const s = stats(store);
  const set = store.project.settings;

  const applyHeight = (v: number, commit: boolean) => {
    store.begin();
    store.update((p) => {
      p.settings.wallHeight = v;
      p.walls.forEach((w) => { w.height = v; });
    });
    if (commit) store.end();
  };
  const applyThickness = (v: number, commit: boolean) => {
    store.begin();
    store.update((p) => { p.settings.wallThickness = v; });
    if (commit) store.end();
  };

  return (
    <>
      <Section title="方案">
        <input className="text-input" key={store.project.name} defaultValue={store.project.name}
          onBlur={(e) => { const name = e.target.value.trim() || '未命名方案'; store.commit((p) => { p.name = name; }); }} />
        <KV k="房间数" v={`${s.rooms}`} />
        <KV k="总面积" v={`${s.area.toFixed(1)} ㎡`} />
        <KV k="墙体" v={`${s.walls} 段 / ${s.wallLen.toFixed(1)} m`} />
        <KV k="家具" v={`${s.items} 件`} />
      </Section>
      <Section title="全局设置">
        <SliderNum label="层高" min={220} max={400} value={set.wallHeight}
          onPreview={(v) => applyHeight(v, false)} onCommit={(v) => applyHeight(v, true)} />
        <SliderNum label="新墙厚度" min={6} max={40} value={set.wallThickness}
          onPreview={(v) => applyThickness(v, false)} onCommit={(v) => applyThickness(v, true)} />
        <Check label="3D 显示吊顶" checked={set.showCeiling}
          onChange={(v) => store.commit((p) => { p.settings.showCeiling = v; })} />
      </Section>
      <Section title="墙面配色（整体）">
        <div className="swatches">
          {WALL_COLORS.map((c) => (
            <button key={c} className="swatch" style={{ background: c }}
              onClick={() => store.commit((p) => p.walls.forEach((w) => { w.color = c; }))} />
          ))}
        </div>
      </Section>
      <Section title="操作提示">
        <p className="tip-text">
          选中任意墙、门窗、家具或房间可编辑属性；所有尺寸都支持直接输入数值精确调整。右键元素可快速旋转 / 复制 / 删除。编辑会实时保存到本地 IndexedDB。
        </p>
      </Section>
    </>
  );
}
