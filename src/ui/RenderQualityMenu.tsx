import { normalizeRenderQuality } from '../core/renderQuality';
import { store } from '../core/store/store';
import type { RenderQuality } from '../core/types';
import { Ic } from './icons';

export const RENDER_QUALITY_OPTIONS = [
  { id: 'speed', name: '流畅', text: '降低像素比与阴影，适合大方案漫游。', icon: 'walk' },
  { id: 'balanced', name: '标准', text: '清晰度和帧率均衡，适合日常编辑。', icon: 'cube' },
  { id: 'high', name: '精细', text: '提高画布像素比和阴影细节。', icon: 'ray' },
  { id: 'ultra', name: '演示', text: '最高精度光影，适合截图和展示。', icon: 'sparkle' },
] as const satisfies readonly {
  id: RenderQuality; name: string; text: string; icon: string;
}[];

export const renderQualityName = (value: unknown) =>
  RENDER_QUALITY_OPTIONS.find((x) => x.id === normalizeRenderQuality(value))?.name ?? '标准';

export function RenderQualityMenu({ onPick }: { onPick?: () => void }) {
  const current = normalizeRenderQuality(store.project.settings.renderQuality);
  const pick = (id: RenderQuality) => {
    if (id !== current) store.commit((p) => { p.settings.renderQuality = id; });
    onPick?.();
  };

  return (
    <>
      <div className="dd-head">渲染精度</div>
      {RENDER_QUALITY_OPTIONS.map((q) => (
        <button key={q.id} className={`dd-item quality-item ${current === q.id ? 'on' : ''}`}
          aria-pressed={current === q.id} onClick={() => pick(q.id)}>
          <Ic n={q.icon} size={16} />
          <span className="quality-copy">
            <b>{q.name}</b>
            <span>{q.text}</span>
          </span>
        </button>
      ))}
    </>
  );
}
