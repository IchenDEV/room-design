import { store } from '../../core/store/store';
import { stats } from '../../core/store/selectors';
import { WALL_COLORS, WALL_TEXTURES } from '../../core/catalog/catalog';
import { Check, ChoiceGrid, KV, Section, SliderNum } from './widgets';
import { editors } from '../editors';
import { normalizeRenderQuality } from '../../core/renderQuality';
import { RENDER_QUALITY_OPTIONS } from '../RenderQualityMenu';
import type { Settings } from '../../core/types';

export function GlobalProps() {
  const s = stats(store);
  const set = store.project.settings;
  const wallTexture = store.project.walls.find((w) => w.material !== 'glass')?.texture ?? 'paint';

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
  const patchSetting = <K extends keyof Settings>(k: K, v: Settings[K], commit = true) => {
    store.begin();
    store.update((p) => { p.settings[k] = v; });
    if (commit) store.end();
  };
  const cam = editors.v3?.camera.position;
  const camX = set.cameraX ?? cam?.x ?? 700;
  const camY = set.cameraY ?? cam?.y ?? 760;
  const camZ = set.cameraZ ?? cam?.z ?? 760;

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
      <Section title="3D 渲染">
        <ChoiceGrid options={RENDER_QUALITY_OPTIONS} value={normalizeRenderQuality(set.renderQuality)}
          onPick={(v) => patchSetting('renderQuality', v)} />
        <Check label="开启光追预览" checked={!!set.rayTracing}
          onChange={(v) => patchSetting('rayTracing', v)} />
        <Check label="漫游实体碰撞" checked={!!set.solidCollision}
          onChange={(v) => patchSetting('solidCollision', v)} />
        <SliderNum label="灯光强度" min={0.3} max={4} step={0.1} unit="x" value={set.sunIntensity ?? 2.2}
          onPreview={(v) => patchSetting('sunIntensity', v, false)} onCommit={(v) => patchSetting('sunIntensity', v)} />
        <SliderNum label="灯光方位" min={-180} max={180} step={1} unit="°" value={set.sunAzimuth ?? 35}
          onPreview={(v) => patchSetting('sunAzimuth', v, false)} onCommit={(v) => patchSetting('sunAzimuth', v)} />
        <SliderNum label="灯光高度" min={8} max={82} step={1} unit="°" value={set.sunElevation ?? 52}
          onPreview={(v) => patchSetting('sunElevation', v, false)} onCommit={(v) => patchSetting('sunElevation', v)} />
      </Section>
      <Section title="相机位置">
        <SliderNum label="相机 X" min={-3000} max={3000} step={10} value={camX}
          onPreview={(v) => patchSetting('cameraX', v, false)} onCommit={(v) => patchSetting('cameraX', v)} />
        <SliderNum label="相机 Y" min={80} max={3000} step={10} value={camY}
          onPreview={(v) => patchSetting('cameraY', v, false)} onCommit={(v) => patchSetting('cameraY', v)} />
        <SliderNum label="相机 Z" min={-3000} max={3000} step={10} value={camZ}
          onPreview={(v) => patchSetting('cameraZ', v, false)} onCommit={(v) => patchSetting('cameraZ', v)} />
      </Section>
      <Section title="全局墙纸 / 墙面材质">
        <div className="swatches">
          {WALL_COLORS.map((c) => (
            <button key={c} className="swatch" style={{ background: c }}
              aria-label={`应用墙面颜色 ${c}`} title={`应用墙面颜色 ${c}`}
              onClick={() => store.commit((p) => p.walls.forEach((w) => { w.color = c; }))} />
          ))}
        </div>
        <label className="check-row">
          <input className="swatch" type="color" value={store.project.walls[0]?.color ?? WALL_COLORS[0]}
            onChange={(e) => store.commit((p) => p.walls.forEach((w) => { w.color = e.target.value; }))} />
          <span>自定义墙纸色</span>
        </label>
        <ChoiceGrid options={WALL_TEXTURES} value={wallTexture}
          onPick={(v) => store.commit((p) => p.walls.forEach((w) => {
            if (w.material !== 'glass') w.texture = v;
          }))} />
      </Section>
      <Section title="操作提示">
        <p className="tip-text">
          选中墙体、门窗、家具或房间可编辑其属性；尺寸可直接输入数值。右键元素可旋转、复制或删除。
        </p>
      </Section>
    </>
  );
}
